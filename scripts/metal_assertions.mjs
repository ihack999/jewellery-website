import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const origin = process.env.TJC_TEST_ORIGIN;
if (!origin || !process.env.TJC_TEST_CDP) throw Error("Run node scripts/check_journeys.mjs --metals");
const tabs = await (await fetch(`${process.env.TJC_TEST_CDP}/json/list`)).json();
const socket = new WebSocket(tabs.find((tab) => tab.type === "page").webSocketDebuggerUrl);
await new Promise((resolve) => socket.addEventListener("open", resolve, { once: true }));
let sequence = 0;
let checks = 0;
const pending = new Map();
const errors = [];
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
    const allowed = request.url.startsWith(origin + "/") && ["GET", "HEAD"].includes(request.method);
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
const check = async (expression, label) => { assert.equal(await evaluate(`Boolean(${expression})`), true, label); checks++; };
const ready = async () => {
  for (let attempt = 0; attempt < 120; attempt++) {
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
  await writeFile(join(process.env.TJC_SCREENSHOT_DIR, `metal-${name}.png`), Buffer.from(capture.data, "base64"));
};
try {
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
 await send('Fetch.enable',{patterns:[{urlPattern:'*'}]});
 for(const name of ['camera','microphone'])await send('Browser.setPermission',{permission:{name},setting:'denied',origin});
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__cameraRequests=0;navigator.mediaDevices.getUserMedia=async()=>{window.__cameraRequests++;throw Error('Camera prohibited');};`});
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await send('Page.navigate',{url:origin+'/customs.html#design-studio'});await ready();
 await evaluate(`window.__metalTest={base:window.__tjcDesigner.getState()};`);
 const construction=await evaluate(`(() => {
  const {base}=window.__metalTest;let variants=0,vertices=0;
  const release=p=>{const gs=new Set(),ms=new Set();p.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material)});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());};
  window.__metalTest.release=release;
  for(const silhouette of ['Classic Round','Cigar Band','Split Shank','Tapered Shank','Stacked Double'])
  for(const band of ['Solitaire','Knife-Edge','Twist','Bypass','Pavé','Channel'])
  for(const size of ['0.5','3']) {
   const p=window.__tjcDesigner.buildPiece({...base,setting:'Cathedral',halo:false,silhouette,band,size,bandThicknessMm:'1.1'});
   const shoulders=p.getObjectByName('cathedral-shoulders');
   const expected=['Split Shank','Stacked Double'].includes(silhouette)&&band!=='Bypass'?4:2;
   if(!shoulders||shoulders.children.length<2)throw Error('Missing shoulder: '+[silhouette,band,size]);
   if(band!=='Bypass'&&shoulders.children.length!==expected)throw Error('Wrong rail anchors: '+[silhouette,band,size]);
   const inner=p.userData.jewellerySpec.world.ringInnerRadius;
   for(const arm of shoulders.children){
    if(arm.geometry.userData.endCaps!=='planar')throw Error('Uncapped shoulder');
    const ps=arm.geometry.attributes.position;
    for(let i=0;i<ps.count;i++){
     if(![ps.getX(i),ps.getY(i),ps.getZ(i)].every(Number.isFinite))throw Error('Invalid shoulder');
     if(Math.hypot(ps.getX(i),ps.getY(i))<inner-1e-5)throw Error('Shoulder enters finger opening: '+[silhouette,band,size]);
     vertices++;
    }
   }
   release(p);variants++;
  }
  return {variants,vertices};
 })()`);
 checks+=construction.variants;
 const materials=await evaluate(`(async()=>{
  const {base,release}=window.__metalTest;const {FINISH_PROFILES}=await import('/assets/js/jewellery-materials.js?v=20260912-metals');
  let variants=0,reference=null;
  const hash=a=>{let h=2166136261;const bytes=new Uint8Array(a.buffer,a.byteOffset,a.byteLength);for(const n of bytes)h=Math.imul(h^n,16777619);return h>>>0;};
  for(const metal of ['Yellow Gold','Rose Gold','White Gold','Platinum','Champagne Gold','Mirror Silver','Black Gold','Bronze Patina','Two-Tone Mix'])
  for(const finish of Object.keys(FINISH_PROFILES)) {
   const p=window.__tjcDesigner.buildPiece({...base,setting:'Prong',halo:false,metal,finish,finishStrength:'1'});
   let found=false;const gems=[];
   p.traverse(o=>{
    if(o.userData.isGem&&o.geometry&&o.material){const m=o.material;gems.push([hash(o.geometry.attributes.position.array),m.ior,m.transmission,m.thickness,m.roughness,m.dispersion,m.attenuationDistance,m.attenuationColor?.toArray()]);}
    if(o.material?.metalness===1){found=true;const m=o.material;if(m.clearcoat!==0||m.sheen!==0||m.iridescence!==0)throw Error('Unrequested coating');if(m.roughness<.05||m.roughness>1)throw Error('Invalid roughness');}
   });
   if(!found)throw Error('No metal');
   const signature=JSON.stringify(gems);if(!reference)reference=signature;else if(signature!==reference)throw Error('Metal change altered stone geometry/optics');
   release(p);variants++;
  }
  return {variants};
 })()`);
 checks+=materials.variants;
 for(const [k,v] of [['setting','Cathedral'],['halo',false],['band','Solitaire'],['karat','18K'],['finish','High Polish']])await setField(k,v);
 await evaluate(`document.querySelector('[data-design-studio]').scrollIntoView()`);
 for(const metal of ['Yellow Gold','White Gold','Rose Gold','Platinum','Champagne Gold','Mirror Silver','Black Gold','Bronze Patina','Two-Tone Mix']){
  await setField('metal',metal);
  await check(`window.__tjcDesigner.getState().metal===${JSON.stringify(metal)}`,metal+' actual UI choice');
  await screenshot(metal.split(' ')[0]);
 }
 await setField('metal','Yellow Gold');
 for(const finish of ['High Polish','Soft Satin','Milgrain Edge','Hammered','Sandblast','Brushed','Stardust']){
  await setField('finish',finish);await check(`window.__tjcDesigner.getState().finish===${JSON.stringify(finish)}`,finish+' actual UI choice');
  await screenshot(finish.replaceAll(' ','-'));
 }
 await setField('finish','High Polish');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await wait(300);
 await screenshot('mobile');
 await check(`document.documentElement.scrollWidth<=innerWidth`,'mobile editor fits viewport');
 await check('window.__cameraRequests===0','no camera');
 assert.deepEqual(errors,[]);checks++;
 console.log(JSON.stringify({passed:checks,construction,materials,errors}));
}finally{socket.close();}
