import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const origin = process.env.TJC_TEST_ORIGIN;
if (!origin || !process.env.TJC_TEST_CDP) throw Error("Run node scripts/check_journeys.mjs --studio-mobile");
const tabs = await (await fetch(`${process.env.TJC_TEST_CDP}/json/list`)).json();
const socket = new WebSocket(tabs.find((tab) => tab.type === "page").webSocketDebuggerUrl);
await new Promise((resolve) => socket.addEventListener("open", resolve, { once: true }));
let sequence = 0;
let checks = 0;
const pending = new Map();
const errors = [];
let blockEnvironment = false;
socket.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const task = pending.get(message.id);
    if (!task) return;
    pending.delete(message.id);
    clearTimeout(task.timer);
    if (message.error) task.reject(Error(JSON.stringify(message.error)));
    else task.resolve(message.result);
  } else if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.exception?.description);
  else if (message.method === "Fetch.requestPaused") {
    const { requestId, request } = message.params;
    const allowed = request.url.startsWith(origin + "/") && ["GET", "HEAD"].includes(request.method) && !(blockEnvironment && /RGBELoader|\.hdr|Metal002/.test(request.url));
    send(allowed ? "Fetch.continueRequest" : "Fetch.failRequest", allowed ? { requestId } : { requestId, errorReason: "BlockedByClient" }).catch(() => {});
  }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  const timer = setTimeout(() => { pending.delete(id); reject(Error("Timed out: " + method)); }, 30000);
  pending.set(id, { resolve, reject, timer });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const response = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails) throw Error(response.exceptionDetails.exception?.description);
  return response.result.value;
};
const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
const check = async (expression, label) => { assert.equal(await evaluate(`(async()=>Boolean(await (${expression})))()`), true, label); checks++; };
const ready = async () => {
  for (let attempt = 0; attempt < 300; attempt++) {
    await wait(100);
    if (await evaluate('document.querySelector("[data-design-studio]")?.dataset.designerReady === "true"')) return;
  }
  throw Error("Studio initialization timed out");
};
const setField = async (name,value) => {
  await evaluate(`(() => {
    const fields=[...document.querySelectorAll('[data-designer-field="${name}"]')];
    const field=fields.find(f=>f.type==='radio'&&f.value===${JSON.stringify(value)})||fields[0];
    if(field.type==='radio')field.checked=true;
    else if(field.type==='checkbox')field.checked=Boolean(${JSON.stringify(value)});
    else field.value=${JSON.stringify(value)};
    field.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await wait(400);
};
const screenshot = async (name) => {
  if (!process.env.TJC_SCREENSHOT_DIR) return;
  const capture = await send("Page.captureScreenshot", { format: "png" });
  await writeFile(join(process.env.TJC_SCREENSHOT_DIR, `studio-${name}.png`), Buffer.from(capture.data, "base64"));
};
const until = async (expression, label) => {
 for(let i=0;i<200;i++){if(await evaluate(`Boolean(${expression})`))return;await wait(100);}
 throw Error(label+': '+JSON.stringify(await evaluate(`({data:{...document.querySelector('[data-design-studio]')?.dataset},status:document.querySelector('[data-designer-share-status]')?.textContent,exports:window.__exports?.length})`)));
};
const stage = "document.querySelector('[data-design-studio]')";
const threeReady = `${stage}.dataset.designerPreview==='ready' && ${stage}.dataset.designerRenderer==='three'`;
const pixels = `(() => {
 const canvas=document.querySelector('[data-designer-canvas]');const copy=document.createElement('canvas');copy.width=64;copy.height=64;
 const ctx=copy.getContext('2d');ctx.drawImage(canvas,0,0,64,64);const p=ctx.getImageData(0,0,64,64).data;
 let visible=0;const colors=new Set();for(let i=0;i<p.length;i+=4){if(p[i+3]>0)visible++;colors.add(p[i]+','+p[i+1]+','+p[i+2]);}
 return visible>1000&&colors.size>50;
})()`;
const instrumentation = `
 window.__cameraRequests=0;
 navigator.mediaDevices.getUserMedia=async()=>{window.__cameraRequests++;throw Error('Camera prohibited');};
 window.__blockWebGL=false;window.__failFirstCanvas=false;window.__failTextureOnce=false;window.__failedCanvas=null;window.__contexts=[];
 const getContext=HTMLCanvasElement.prototype.getContext;
 HTMLCanvasElement.prototype.getContext=function(type,...args){
   if(type==='webgl2'&&this.matches('[data-designer-canvas]')){
     if(window.__failFirstCanvas&&!window.__failedCanvas)window.__failedCanvas=this;
     if(window.__blockWebGL||window.__failedCanvas===this)throw Error('Test: GPU unavailable');
     const gl=getContext.call(this,type,...args);
     if(gl&&!window.__contexts.some(c=>c.gl===gl)){
       window.__contexts.push({gl,canvas:this});gl.__draws=0;
       for(const name of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){
         const draw=gl[name];gl[name]=function(...params){gl.__draws++;return draw.apply(this,params);};
       }
     }
     return gl;
   }
   if(type==='2d'&&window.__failTextureOnce&&window.__contexts.length){window.__failTextureOnce=false;throw Error('Test: texture allocation interrupted');}
   return getContext.call(this,type,...args);
 };
`;
let faultScript;
let navigationCount=0;
const navigate = async (fault = '') => {
 if(faultScript)await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:faultScript});
 faultScript=(await send('Page.addScriptToEvaluateOnNewDocument',{source:instrumentation+fault})).identifier;
 const previous=await evaluate('performance.timeOrigin');
 await send('Page.navigate',{url:origin+'/customs.html?studio-test='+ ++navigationCount +'#design-studio'});
 await until(`performance.timeOrigin!==${previous}`,'new document loaded');await ready();
};
try {
 await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
 await send('Network.setCacheDisabled',{cacheDisabled:true});
 await send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 for(const name of ['camera','microphone']) await send('Browser.setPermission',{permission:{name},setting:'denied',origin});
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});
 await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await navigate(); await check(threeReady,'phone opens full 3D');
 await check(`${stage}.dataset.designerProfile==='mobile'`,'phone starts within mobile GPU budget');
 await check(`${stage}.dataset.designerOptics==='gem-bvh-rgb'`,'phone retains gemstone ray tracing');
 await check(pixels,'3D canvas contains visible jewellery');
 await evaluate(`${stage}.hidden=true`);await wait(250);
 await evaluate('window.__drawsBeforePause=window.__contexts.at(-1).gl.__draws');await wait(250);
 await check('window.__contexts.at(-1).gl.__draws===window.__drawsBeforePause','hidden editor stops GPU drawing');
 await evaluate(`${stage}.hidden=false;${stage}.scrollIntoView({block:'start'})`);await wait(400);
 await check('window.__contexts.at(-1).gl.__draws>window.__drawsBeforePause','visible editor resumes GPU drawing');
 for(const [width,height] of [[320,667],[390,844],[430,932],[844,390]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:3,mobile:true});await wait(250);
  await check('document.documentElement.scrollWidth<=innerWidth',`${width}: no horizontal overflow`);
  await check(`(()=>{const h=${stage}.querySelector('h2');return h.clientWidth>=${stage}.querySelector('.design-studio__intro').clientWidth-1&&h.clientHeight<90;})()`,`${width}: heading fits controls`);
  await check(`(()=>{const c=${stage}.querySelector('canvas');return Math.abs(c.width/c.height-c.clientWidth/c.clientHeight)<0.01&&c.width*c.height<=751000;})()`,`${width}: proportional, bounded canvas`);
  await check(`(()=>{const a=${stage}.querySelector('.reality-score').getBoundingClientRect();const b=${stage}.querySelector('[data-inspect-design]').getBoundingClientRect();const fix=${stage}.querySelector('[data-reality-fix]').getBoundingClientRect();return a.right<=b.left&&b.width>=44&&b.height>=44&&fix.width>=44&&fix.height>=44;})()`,`${width}: toolbar does not overlap`);
 }
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});await wait(250);
 for(const piece of ['Necklace','Bracelet','Earrings','Ring']){
  await setField('piece',piece);await check(threeReady,piece+' uses full 3D');await check(pixels,piece+' renders pixels');
 }
 await setField('metal','White Gold');await setField('stone','Blue Sapphire');
 await evaluate('window.__savedState=JSON.stringify(window.__tjcDesigner.getState())');
 await screenshot('phone');
 // Actual WebGL loss and native restoration, not synthetic DOM events.
 await evaluate(`window.__lost=window.__contexts.at(-1).gl.getExtension('WEBGL_lose_context');window.__lost.loseContext();`);
 await until(`${stage}.dataset.designerPreview==='paused'`,'context loss is visible');checks++;
 await check(`${stage}.querySelector('[data-inspect-design]').disabled`,'inspection disabled while context is lost');
 await evaluate('window.__lost.restoreContext()');await until(threeReady,'native context restoration');await wait(400);
 await check('JSON.stringify(window.__tjcDesigner.getState())===window.__savedState','restoration preserves design');
 await check(pixels,'restored context renders jewellery');
 // Manual retry after loss destroys the old context and reinstates the builder.
 await evaluate(`window.__oldCanvas=document.querySelector('[data-designer-canvas]');window.__lost.loseContext();`);
 await until(`${stage}.dataset.designerPreview==='paused'`,'second loss');
 await evaluate(`${stage}.querySelector('[data-designer-retry]').click()`);await until(threeReady,'manual retry');await wait(300);
 await check('window.__oldCanvas.width===1&&!window.__oldCanvas.isConnected','retry releases old canvas backing store');
 await check('JSON.stringify(window.__tjcDesigner.getState())===window.__savedState','manual retry preserves exact state');
 await check(pixels,'retry restores visible 3D');
 await evaluate(`${stage}.querySelector('[data-inspect-design]').click()`);await wait(250);
 await check(`${stage}.classList.contains('is-inspecting')`,'fullscreen works after recovery');
 await check(`${stage}.querySelector('canvas').width*${stage}.querySelector('canvas').height<=751000`,'fullscreen retains pixel cap');
 await evaluate(`${stage}.querySelector('[data-inspect-exit]').click()`);
 await check(`!${stage}.classList.contains('is-inspecting')`,'fullscreen exits after recovery');
 await navigate('window.__failFirstCanvas=true;');
 await check(threeReady,'automatic retry recovers first context failure');
 await check(`${stage}.dataset.designerProfile==='recovery'`,'automatic retry uses reduced allocation profile');
 await navigate('window.__failTextureOnce=true;');
 await check(threeReady,'automatic retry recovers failure after GPU allocation');
 await check('window.__contexts.length===2&&window.__contexts[0].gl.isContextLost()&&window.__contexts[0].canvas.width===1','failed initialization releases its context');
 blockEnvironment=true;await navigate();
 await check(threeReady,'missing optional HDR loader and textures still allow full 3D');
 await check(`${stage}.dataset.designerTextureWarning==='studio-hdri-fallback'`,'environment fallback recorded');
 await check(pixels,'procedural environment still lights jewellery');blockEnvironment=false;
 await navigate('window.__blockWebGL=true;');
 await check(`${stage}.dataset.designerPreview==='fallback'`,'permanent GPU failure clearly labels simplified preview');
 await check(`${stage}.querySelector('[data-designer-preview-message]').textContent.includes('Simplified preview')`,'fallback is not presented as realistic 3D');
 await check(`${stage}.querySelector('[data-export-glb]').disabled&&!window.__tjcDesigner`,'unavailable builder cannot export or start AR');
 await setField('stone','Blue Sapphire');
 await screenshot('fallback');
 await check(`(()=>{const c=${stage}.querySelector('[data-designer-fallback-canvas]');return Math.abs(c.width/c.height-c.clientWidth/c.clientHeight)<0.01;})()`,'fallback canvas preserves aspect ratio');
 await setField('metal','Rose Gold');
 await evaluate(`window.__blockWebGL=false;${stage}.querySelector('[data-designer-retry]').click();`);await until(threeReady,'fallback retry');
 await check(`window.__tjcDesigner.getState().metal==='Rose Gold'&&window.__tjcDesigner.getState().stone==='Blue Sapphire'`,'edits made in fallback survive recovery');
 await check(`!${stage}.querySelector('[data-export-glb]').disabled`,'3D export re-enabled after recovery');
 await evaluate(`${stage}.querySelector('[data-undo-design]').click()`);
 await check(`window.__tjcDesigner.getState().metal!=='Rose Gold'`,'undo history survives recovery');
 // Exercise the real PNG and GLB export buttons without writing downloads.
 await evaluate(`window.__exports=[];const blobs=new Map();const createURL=URL.createObjectURL;URL.createObjectURL=function(blob){const url=createURL.call(this,blob);blobs.set(url,blob);return url};const click=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download)window.__exports.push(blobs.get(this.href));else return click.call(this)};`);
 await evaluate(`${stage}.querySelector('[data-download-design]').click()`);
 await until('window.__exports.length===1','PNG export completed');
 await check(`(await createImageBitmap(window.__exports[0])).width<=1600 && window.__exports[0].size>10000`,'phone image export produces a bounded, nonempty PNG');
 // Export a valid plain bezel setting; the existing contact gate must not
 // be bypassed just to exercise renderer recovery.
 await setField('setting','Bezel');await setField('band','Solitaire');await setField('halo',false);
 await evaluate(`${stage}.querySelector('[data-export-glb]').click()`);
 await until('window.__exports.length===2','GLB export completed');
 await check(`new DataView(await window.__exports[1].arrayBuffer()).getUint32(0,true)===0x46546c67`,'recovered builder exports a valid GLB container');
 await check('window.__cameraRequests===0','no camera requests');
 assert.deepEqual(errors,[]);checks++;
 console.log(JSON.stringify({passed:checks,errors}));
} finally {socket.close();}
