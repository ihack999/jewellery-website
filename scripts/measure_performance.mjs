// Local lab measurements, not production Core Web Vitals. Invoked by check_journeys.
import { readFile, writeFile } from 'node:fs/promises';
import { gzipSync, brotliCompressSync } from 'node:zlib';
const origin = process.env.TJC_TEST_ORIGIN;
if (!origin || !process.env.TJC_TEST_CDP) throw Error('Run node scripts/check_journeys.mjs --performance');
const tabs = await (await fetch(`${process.env.TJC_TEST_CDP}/json/list`)).json();
const socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, {once:true}));
let sequence = 0;
const pending = new Map(), responses = [], failures = [];
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  const timer = setTimeout(() => {pending.delete(id); reject(Error(`Timeout: ${method}`));}, 15000);
  timer.unref();
  pending.set(id, {resolve, reject, timer});
  socket.send(JSON.stringify({id, method, params}));
});
socket.addEventListener('message', ({data}) => {
  const event = JSON.parse(data);
  if (event.id) {
    const task = pending.get(event.id);
    if (!task) return;
    clearTimeout(task.timer); pending.delete(event.id);
    event.error ? task.reject(Error(JSON.stringify(event.error))) : task.resolve(event.result);
  } else if (event.method === 'Fetch.requestPaused') {
    const {requestId, request} = event.params;
    const url = new URL(request.url);
    const allowed = ['GET','HEAD'].includes(request.method) && (url.origin === origin || ['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname));
    send(allowed ? 'Fetch.continueRequest' : 'Fetch.failRequest', allowed ? {requestId} : {requestId,errorReason:'BlockedByClient'}).catch(()=>{});
  } else if (event.method === 'Network.responseReceived') {
    const {response, type} = event.params;
    responses.push({url:response.url.replace(origin,''),type,status:response.status,encoding:response.headers['content-encoding'] || response.headers['Content-Encoding'] || null});
  } else if (event.method === 'Network.loadingFailed') {
    failures.push({type:event.params.type,error:event.params.errorText});
  }
});
try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Network.setCacheDisabled', {cacheDisabled:true});
  await send('Fetch.enable', {patterns:[{urlPattern:'*'}]});
  await send('Page.addScriptToEvaluateOnNewDocument', {source:`window.__lab={lcp:0,cls:0};new PerformanceObserver(list=>{for(const entry of list.getEntries())window.__lab.lcp=entry.startTime;}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(list=>{for(const entry of list.getEntries())if(!entry.hadRecentInput)window.__lab.cls+=entry.value;}).observe({type:'layout-shift',buffered:true});`});
  const samples = [];
  for (const width of [390,1440]) {
    await send('Emulation.setDeviceMetricsOverride', {width,height:900,deviceScaleFactor:1,mobile:width===390});
    for (let repeat = 0; repeat < 3; repeat++) {
      await send('Page.navigate', {url:'about:blank'});
      await new Promise(resolve=>setTimeout(resolve,100));
      responses.length=0; failures.length=0;
      await send('Page.navigate', {url:origin+'/index.html'});
      await new Promise(resolve=>setTimeout(resolve,4000));
      const {result, exceptionDetails} = await send('Runtime.evaluate', {returnByValue:true,expression:`({width:innerWidth,ready:document.readyState,fontsStatus:document.fonts.status,fontFaces:[...document.fonts].map(f=>({family:f.family,status:f.status,weight:f.weight,style:f.style})),paint:performance.getEntriesByType('paint').map(p=>({name:p.name,ms:p.startTime})),...window.__lab,resources:performance.getEntriesByType('resource').map(r=>({url:r.name.replace(location.origin,''),encoded:r.encodedBodySize,decoded:r.decodedBodySize,ms:r.duration})),overflow:document.documentElement.scrollWidth>innerWidth})`});
      if (exceptionDetails) throw Error(JSON.stringify(exceptionDetails));
      samples.push({...result.value,responses:[...responses],failures:[...failures]});
    }
  }
  const compression = [];
  for (const path of ['assets/css/fonts.css','assets/css/styles.css','assets/css/atelier.css','assets/css/curation.css','assets/css/experience.css','assets/js/main.js','assets/js/curation.js','assets/js/experience.js']) {
    const body = await readFile(new URL('../'+path,import.meta.url));
    compression.push({path,raw:body.length,gzip:gzipSync(body).length,brotli:brotliCompressSync(body).length});
  }
  const report={measuredAt:new Date().toISOString(),method:'Local gzip server; cache disabled; unthrottled Chrome; 4-second window; 3 samples per width; Google Fonts allowed, other external requests blocked. Not production metrics.',compression,samples};
  await writeFile(new URL('../docs/performance-lab.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({compression,samples:samples.map(s=>({width:s.width,ready:s.ready,lcp:s.lcp,cls:s.cls,paint:s.paint,fontsLoaded:s.fontFaces.filter(f=>f.status==='loaded').length,failures:s.failures,overflow:s.overflow}))},null,2));
} finally { socket.close(); }
