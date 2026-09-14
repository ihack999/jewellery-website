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
const screenshot=async name=>{await wait(500);const {data}=await send('Page.captureScreenshot',{format:'png'});await writeFile(`/private/tmp/tjc-photography-${name}.png`,Buffer.from(data,'base64'));};
const decode=async selector=>evaluate(`Promise.all([...document.querySelectorAll(${JSON.stringify(selector)})].map(im=>{im.loading='eager';return im.decode()}))`);
try {
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 for(const width of [320,390,1440]) {
  await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:width<500?3:1,mobile:width<500});
  await navigate('/shop.html'); await decode('.product-card__media img');
  await check(`document.querySelectorAll('.product-card__media img').length===12 && [...document.querySelectorAll('.product-card__media img')].every(im=>im.src.includes('/studio/')&&im.naturalWidth>0)` ,`${width}: all twelve catalogue covers use decoded studio assets`);
  await check(`[...document.querySelectorAll('.product-card__media')].every(e=>{const r=e.getBoundingClientRect();return Math.abs(r.width-r.height)<2&&getComputedStyle(e.querySelector('img')).objectFit==='contain'})`,`${width}: consistent square frames without cropping`);
  await check(`document.documentElement.scrollWidth<=innerWidth`,`${width}: catalogue has no horizontal overflow`);
  await check(`[...document.querySelectorAll('.product-card')].every(c=>c.querySelector('.compare-button').getBoundingClientRect().top>=c.querySelector('.product-card__media').getBoundingClientRect().bottom)`,`${width}: compare controls never cover jewellery`);
  await check(`!performance.getEntriesByType('resource').some(r=>r.name.includes('/studio/sources/'))`,`${width}: PNG masters never downloaded during browsing`);
  await evaluate(`document.querySelector('.product-card').scrollIntoView({block:'start',behavior:'instant'});scrollBy(0,-140)`);
  await screenshot('shop-'+width);
 }
 const catalogue=await evaluate(`products.map(p=>({slug:p.slug,url:p.urlSlug,hero:p.heroImage,gallery:p.gallery}))`);
 for(const p of catalogue) {
  await navigate('/products/'+p.url+'/'); await decode('[data-product-main-image]');
  await check(`document.querySelector('[data-product-main-image]').src.endsWith(${JSON.stringify(p.hero)})&&document.querySelector('[data-photo-caption]').textContent.includes('AI-restyled')`,p.slug+': studio cover and accurate caption');
  await check(`document.querySelectorAll('[data-gallery-thumb]').length===${p.gallery.length} && ${p.gallery.length}>1`,p.slug+': originals retained after studio cover');
  await evaluate(`document.querySelectorAll('[data-gallery-thumb]')[1].click()`); await decode('[data-product-main-image]');
  await check(`!document.querySelector('[data-product-main-image]').src.includes('/studio/')&&document.querySelector('[data-photo-caption]').textContent.startsWith('Original photograph')`,p.slug+': original photo can be selected');
  await evaluate(`document.querySelector('[data-gallery-zoom]').click()`); await decode('[data-lightbox-image]');
  await check(`document.querySelector('[data-lightbox-image]').src.endsWith(${JSON.stringify(p.gallery[1])})&&!document.querySelector('[data-lightbox-image]').srcset`,p.slug+': full-screen originals keep source resolution');
  await key('Escape');
 }
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:3,mobile:true});
 await navigate('/products/the-rise-ring/'); await decode('[data-product-main-image]');
 await evaluate(`document.querySelector('.product-gallery').scrollIntoView({block:'start',behavior:'instant'});scrollBy(0,-110)`);await screenshot('product-phone');
 await navigate('/shop.html');
 await evaluate(`document.querySelector('[data-quick-view-trigger="rise-ring"]').click()`); await decode('[data-quick-view-image]');
 await check(`document.querySelector('[data-quick-view-image]').src.includes('/studio/')`, 'Quick view starts with matching studio cover');
 await evaluate(`document.querySelectorAll('[data-quick-view-image-choice]')[1].click()`); await decode('[data-quick-view-image]');
 await check(`document.querySelector('.quick-view-modal [data-photo-caption]').textContent.startsWith('Original photograph')`,'Quick view changes original/studio caption with selection');
 await key('Escape');
 await navigate('/index.html');
 await evaluate(`document.querySelector('[data-favorite-toggle="rise-ring"]').click();document.querySelector('[data-edit-open]').click()`); await decode('.edit-drawer__item img');
 await check(`[...document.querySelectorAll('.edit-drawer__item img')].every(i=>i.src.includes('/studio/')&&getComputedStyle(i).objectFit==='contain')`,'Saved edit uses complete studio thumbnails');await screenshot('saved-phone');await key('Escape');
 await navigate('/curated-luxuries.html');
 await decode('.luxury-card__media img');
 await check(`document.documentElement.scrollWidth<=innerWidth`,'Estate photography frames fit phone');
 await check(`document.querySelectorAll('.luxury-card__media img[src*="/studio/"]').length===7&&document.querySelectorAll('.luxury-card a[href*="estate-luxuries/"]').length>=8`,'Every estate cover matches and retains access to original condition photographs');
 await check(`[...document.querySelectorAll('video[poster]')].every(v=>v.poster.includes('.webp')&&v.dataset.posterSource)`,'Video posters use traceable WebP exports');
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await evaluate(`document.querySelector('.luxury-grid').scrollIntoView({block:'start',behavior:'instant'});scrollBy(0,-140)`);await screenshot('estate');
 // Static fallbacks remain usable without JavaScript.
 await send('Emulation.setScriptExecutionDisabled',{value:true});
 await send('Page.navigate',{url:origin+'/products/the-rise-ring/?no-script=1'});await wait(800);
 await decode('[data-product-main-image]');
 await check(`document.querySelector('[data-product-main-image]').src.includes('/studio/')&&document.querySelectorAll('[data-product-thumbnails] a').length===5`,'No-JavaScript product page retains new cover and original links');
 await send('Emulation.setScriptExecutionDisabled',{value:false});
 assert.deepEqual(errors,[],'No runtime errors');checks++;
 console.log(JSON.stringify({passed:checks,catalogue:12,screenshots:'/private/tmp/tjc-photography-*.png',browser:'Chrome desktop and touch emulation; no camera or submissions'}));
} finally { socket.close(); }
