import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin = process.env.TJC_TEST_ORIGIN;
if (!origin || !process.env.TJC_TEST_CDP) throw Error('Run node scripts/check_journeys.mjs');
const tabs = await (await fetch(`${process.env.TJC_TEST_CDP}/json/list`)).json();
const socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
let sequence = 0; const pending = new Map(); const errors = []; let checks = 0;
socket.addEventListener('message', ({ data }) => { const msg = JSON.parse(data); if (msg.id) { const task = pending.get(msg.id); pending.delete(msg.id); if (!task) return; clearTimeout(task.timer); msg.error ? task.reject(new Error(JSON.stringify(msg.error))) : task.resolve(msg.result); } else if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text); });
const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; const timer = setTimeout(() => {pending.delete(id); reject(Error('Timed out: ' + method));}, 15000); timer.unref(); pending.set(id, {resolve, reject, timer}); socket.send(JSON.stringify({id,method,params})); });
const evaluate = async expression => { const result = await send('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true}); if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text); return result.result.value; };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const check = async (expression, label) => { assert.equal(await evaluate(`Boolean(${expression})`), true, label); checks++; };
const navigate = async path => { await send('Page.navigate', {url:origin + path}); for(let i=0;i<40;i++){ await wait(100); if(await evaluate(`location.pathname === ${JSON.stringify(path.split('?')[0])} && document.readyState === 'complete' && typeof setupCartIcon === 'function'`)) return; } throw Error('Navigation timeout: ' + path); };
const key = async (key, modifiers=0) => {await send('Input.dispatchKeyEvent', {type:'keyDown', key, code:key, windowsVirtualKeyCode:key==='Tab'?9:27, modifiers}); await send('Input.dispatchKeyEvent', {type:'keyUp', key, code:key, windowsVirtualKeyCode:key==='Tab'?9:27, modifiers});};
await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Network.setCacheDisabled',{cacheDisabled:true});
await send('Fetch.enable', {patterns:[{urlPattern:'*'}]});
socket.addEventListener('message', ({data}) => { const event = JSON.parse(data); if(event.method !== 'Fetch.requestPaused') return; const request = event.params; const allowed = (request.request.url.startsWith(origin + '/') || /^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(request.request.url)) && ['GET','HEAD'].includes(request.request.method); send(allowed ? 'Fetch.continueRequest' : 'Fetch.failRequest', allowed ? {requestId:request.requestId} : {requestId:request.requestId,errorReason:'BlockedByClient'}).catch(()=>{}); });
for(const name of ['camera','microphone']) await send('Browser.setPermission',{permission:{name},setting:'denied',origin});
await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__testPostStatus=503; window.__testPostCount=0; window.__cameraRequests=0; const testFetch=window.fetch.bind(window); window.fetch=(input,options={})=>{const method=String(options.method||input?.method||'GET').toUpperCase();if(method!=='GET'&&method!=='HEAD'){window.__testPostCount++;return Promise.resolve(new Response('{}',{status:window.__testPostStatus,headers:{'Content-Type':'application/json'}}));}return testFetch(input,options);}; if(navigator.mediaDevices)Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async()=>{window.__cameraRequests++;throw Error('Camera prohibited in regression');}});`});
const screenshot = async name => {
 const {data} = await send('Page.captureScreenshot',{format:'png'});
 await writeFile(`/private/tmp/tjc-mobile-${name}.png`,Buffer.from(data,'base64'));
};
const touch = async (x1,y1,x2,y2) => {
 await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x1,y:y1}]});
 for(let i=1;i<=8;i++) {
  await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x1+(x2-x1)*i/8,y:y1+(y2-y1)*i/8}]});
  await wait(20);
 }
 await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await wait(220);
};
try {
 await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 for(const [width,height] of [[320,700],[375,812],[390,844],[430,932],[844,390],[1440,1000]]) {
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:width<500?3:1,mobile:width<1000});
  for(const path of ['/index.html','/shop.html','/products/the-rise-ring/','/customs.html','/contact.html']) {
   await navigate(path); await wait(250);
   await check(`document.documentElement.scrollWidth<=innerWidth`, `${width}: ${path} fits horizontally`);
   await check(`!/[↗✳]/u.test(document.body.innerText)`, `${width}: ${path} no emoji-prone decorations`);
   await check(`[...document.querySelectorAll('.header-actions button')].filter(b=>b.getBoundingClientRect().width).every(b=>{const r=b.getBoundingClientRect();return r.width>=44&&r.height>=44})`, `${width}: ${path} header touch targets`);
   await check(`document.querySelector('.brand').getBoundingClientRect().right<=document.querySelector('.header-actions').getBoundingClientRect().left+1`, `${width}: ${path} brand and controls do not overlap`);
   await check(`!performance.getEntriesByType('resource').some(r=>/designer\.js|three\.module|vision_bundle|\.task/.test(r.name))`, `${width}: ${path} browsing does not load 3D or camera models`);
   if(width<=430) await check(`[...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]), select, textarea')].filter(e=>e.getBoundingClientRect().width).every(e=>parseFloat(getComputedStyle(e).fontSize)>=16)`, `${width}: ${path} inputs avoid focus zoom`);
   if(path==='/index.html') {
    await check(`[...document.querySelectorAll('[data-product-card]')].every(c=>{const r=c.getBoundingClientRect();return [...c.children].every(e=>e.getBoundingClientRect().bottom<=r.bottom+1)})`, `${width}: product controls stay within their cards`);
    if(width<=430) await check(`document.querySelector('.editorial-hero__visual').getBoundingClientRect().top<620`, `${width}: jewellery photo appears earlier`);
    if(width===390) await screenshot('home');
    await evaluate(`document.querySelector('[data-personal-edit-open]').scrollIntoView({block:'center',behavior:'instant'});`); await wait(250);
    await check(`(()=>{const p=document.querySelector('.personal-edit-invitation'),r=p.getBoundingClientRect();return [...p.querySelectorAll('h2,.editorial-kicker,button')].every(e=>{const c=e.getBoundingClientRect();return c.top>=r.top&&c.bottom<=r.bottom})})()`, `${width}: invitation content stays inside border`);
    if(width===390) await screenshot('invitation');
    await evaluate(`document.querySelector('[data-personal-edit-open]').click()`); await wait(250);
    await check(`(()=>{const d=document.querySelector('.personal-edit-dialog');const r=d.getBoundingClientRect();return d.open&&r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1&&d.scrollWidth<=d.clientWidth+1})()`, `${width}: finder fits viewport`);
    await key('Escape'); await wait(80);
    await check(`document.activeElement.matches('[data-personal-edit-open]')`, `${width}: finder restores focus`);
    if(width<1000) {
     await evaluate(`window.scrollTo(0,0);document.querySelector('[data-menu-toggle]').click()`); await wait(200);
     await check(`document.body.classList.contains('nav-open')&&document.querySelector('main').inert`, `${width}: menu isolates page`);
     await check(`(()=>{const r=document.querySelector('.primary-nav').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1})()`, `${width}: menu fits browser height`);
     await key('Escape'); await wait(80);
    }
   }
  }
 }
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});
 await navigate('/products/the-rise-ring/');
 await evaluate(`document.querySelector('.gallery-main').scrollIntoView({block:'center',behavior:'instant'})`); await wait(200);
 const rect=await evaluate(`(()=>{const r=document.querySelector('[data-product-main-image]').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()`);
 const cy=Math.min(650,Math.max(180,rect.y+rect.h/2));
 await touch(300,cy,90,cy+5);
 await check(`document.querySelectorAll('[data-gallery-thumb]')[1].getAttribute('aria-pressed')==='true'`, 'Horizontal touch swipe changes product image');
 await check(`!document.querySelector('.product-lightbox.is-open')`, 'Swiping does not accidentally open the gallery');
 await touch(220,cy,210,cy-120);
 await check(`document.querySelectorAll('[data-gallery-thumb]')[1].getAttribute('aria-pressed')==='true'`, 'Vertical touch scroll does not change photo');
 await evaluate(`document.querySelector('[data-gallery-zoom]').click()`); await wait(250);
 await check(`document.querySelector('.product-lightbox.is-open')`, 'Gallery zoom opens');
 await touch(300,380,90,385);
 await check(`document.querySelector('[data-lightbox-counter]').textContent==='3 / 5'`, 'Full-screen gallery supports horizontal touch swipe with studio and original views');
 await check(`!document.querySelector('[data-lightbox-image]').srcset && !document.querySelector('[data-lightbox-image]').src.includes('/responsive/')`, 'Zoom retains original photo resolution');
 await key('Escape'); await wait(80);
 await evaluate(`document.querySelectorAll('[data-gallery-thumb]')[2].click();document.querySelectorAll('[data-gallery-thumb]')[0].click()`); await wait(300);
 await check(`document.querySelector('[data-product-main-image]').currentSrc.includes('rise-ring-polished')`, 'Rapid selections keep latest responsive photo');
 await navigate('/index.html');
 await evaluate(`document.querySelector('.icon-button[aria-label="Search catalogue"]').click()`); await wait(250);
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:360,deviceScaleFactor:3,mobile:true}); await wait(150);
 await check(`(()=>{const r=document.querySelector('.search-modal__panel').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1&&r.right<=innerWidth})()`, 'Search fits a shortened viewport with results still scrollable');
 await key('Escape'); await wait(80);
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});
 await evaluate(`document.querySelector('[data-signature-finish="satin"]').click()`); await wait(100);
 await check(`document.querySelector('[data-signature-image]').srcset.includes('rise-ring-satin')`, 'Finish preview updates responsive source');
 await evaluate(`document.querySelector('[data-card-add]').click();document.querySelector('[data-card-add]').click()`); await wait(1900);
 await check(`document.querySelector('[data-card-add] .ui-icon--arrow') && document.querySelector('[data-card-add]').textContent.includes('Add to bag')`, 'Repeated bag taps restore the original SVG and label');
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await evaluate(`document.querySelector('[data-personal-edit-open]').click()`);
 await check(`getComputedStyle(document.querySelector('.personal-edit-dialog')).animationName==='none' && getComputedStyle(document.querySelector('.personal-edit-result')).animationName==='none'`, 'Reduced motion disables finder animations');
 await key('Escape'); await wait(80);
 await check(`window.__cameraRequests===0 && window.__testPostCount===0`, 'No capture or submissions');
 assert.deepEqual(errors,[],'No browser runtime exceptions'); checks++;
 console.log(JSON.stringify({passed:checks,browser:'Chrome touch emulation; not physical iPhone Safari',screenshots:'/private/tmp/tjc-mobile-*.png'}));
} finally {socket.close();}
