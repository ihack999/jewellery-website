import assert from 'node:assert/strict';
const origin = process.env.TJC_TEST_ORIGIN;
if (!origin || !process.env.TJC_TEST_CDP) throw Error('Run node scripts/check_journeys.mjs --ar-placement');
const tabs = await (await fetch(`${process.env.TJC_TEST_CDP}/json/list`)).json();
const socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
let sequence = 0;
const pending = new Map(), errors = [];
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const task = pending.get(message.id); if (!task) return;
    pending.delete(message.id); clearTimeout(task.timer);
    message.error ? task.reject(Error(JSON.stringify(message.error))) : task.resolve(message.result);
  } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(arg => arg.value || arg.description).join(' '));
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  const timer = setTimeout(() => { pending.delete(id); reject(Error(`Timed out: ${method}`)); }, 60000);
  timer.unref(); pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};

try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  if (process.argv.includes('--mobile')) await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await send('Network.setBlockedURLs', { urls: ['https://*'] });
  for (const name of ['camera', 'microphone']) await send('Browser.setPermission', { permission: { name }, setting: 'denied', origin });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__cameraRequests = 0;
    navigator.mediaDevices.getUserMedia = async () => { window.__cameraRequests++; throw Error('Hardware capture forbidden by AR test'); };
    navigator.mediaDevices.getDisplayMedia = async () => { throw Error('Display capture forbidden by AR test'); };
  ` });
  await send('Page.navigate', { url: origin + '/customs.html' });
  for (let i = 0; i < 60; i++) {
    if (await evaluate(`location.pathname === '/customs.html' && document.readyState === 'complete'`)) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const result=await evaluate(String.raw`(async()=>{
    const {ARTryOn}=await import('/assets/js/ar-tryon.js?v=20260912-metal-assets');
    const {forearmFixture}=await import('/scripts/ar_placement_fixtures.js');
    const labels=[],check=(ok,label)=>{if(!ok)throw Error(label);labels.push(label);};
    const active=new Set(),urls=[];
    const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;
    canvas.getContext('2d').fillRect(0,0,320,180);
    const create=async(scenario='normal')=>{
      const source=
        'import {forearmFixture} from '+JSON.stringify(location.origin+'/scripts/ar_placement_fixtures.js')+';\n'+
        'const scenario='+JSON.stringify(scenario)+';\n'+
        'export const FilesetResolver={forVisionTasks:async()=>({})};\n'+
        'export const HandLandmarker={createFromOptions:async()=>({\n'+
        'detectForVideo(){if(scenario==="overload"){const s=performance.now();while(performance.now()-s<55){}}return forearmFixture({flex:.5});},\n'+
        'close(){self.postMessage({type:"fixture",event:"hand-closed"});}})};\n'+
        'export const PoseLandmarker={createFromOptions:async(fileset,options)=>{\n'+
        'self.postMessage({type:"fixture",event:"pose-request",options});\n'+
        'await new Promise(r=>setTimeout(r,120));if(scenario==="unavailable")throw Error("fixture pose unavailable");\n'+
        'self.postMessage({type:"fixture",event:"pose-loaded"});\n'+
        'return {detectForVideo(){self.postMessage({type:"fixture",event:"pose-detect"});return forearmFixture().forearmPose;},\n'+
        'close(){self.postMessage({type:"fixture",event:"pose-closed"});}};}};';
      const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));urls.push(url);
      const worker=new Worker('/assets/js/ar-tracking-worker.js?v=20260912-ar-placement',{type:'module'});active.add(worker);
      const messages=[],waiters=[];
      worker.addEventListener('message',e=>{
        messages.push(e.data);
        for(const waiter of [...waiters])if(waiter.predicate(e.data)){waiters.splice(waiters.indexOf(waiter),1);clearTimeout(waiter.timer);waiter.resolve(e.data);}
      });
      worker.addEventListener('error',e=>{throw Error(e.message);});
      const wait=predicate=>new Promise((resolve,reject)=>{const waiter={predicate,resolve};waiter.timer=setTimeout(()=>reject(Error('Worker fixture timeout')),4000);waiters.push(waiter);});
      const config={mode:'hand',mediaPipeBase:url+'#',wasmBase:'fixture',handModelUrl:'fixture-hand',trackForearm:true,
        forearmModelUrl:'fixture-pose-landmarker-lite'};
      const ready=wait(m=>m.type==='ready');worker.postMessage({type:'init',config});await ready;
      return {worker,messages,wait,config};
    };
    let frameId=0;
    const frame=async(client,timestamp,generation=1)=>{
      const bitmap=await createImageBitmap(canvas),id=++frameId;
      const result=client.wait(m=>m.type==='result'&&m.frameId===id);
      client.worker.postMessage({type:'frame',bitmap,timestamp,generation,frameId:id},[bitmap]);
      return result;
    };
    try{
      const normal=await create();
      check(!normal.messages.some(m=>m.event==='pose-loaded'),'primary hand tracker becomes ready before the auxiliary model');
      const before=await frame(normal,0);check(before.result.forearmPose===null&&before.result.landmarks[0].length===21,'hand fitting works during auxiliary loading');
      if(!normal.messages.some(m=>m.event==='pose-loaded'))await normal.wait(m=>m.event==='pose-loaded');
      // model assignment runs in the same worker turn after its fixture event
      const first=await frame(normal,1000);
      check(first.result.forearmPose?.landmarks[0].length===33&&first.result.forearmPose.ageMs===0,'production worker returns a same-frame elbow/wrist observation');
      check(first.result.forearmPose.landmarks[0][14].visibility===1,'pose visibility survives worker serialization');
      const configuration=normal.messages.find(m=>m.event==='pose-request').options;
      check(configuration.baseOptions.delegate==='CPU'&&!configuration.outputSegmentationMasks&&configuration.numPoses===1,'auxiliary model uses the bounded CPU configuration');
      const count=normal.messages.filter(m=>m.event==='pose-detect').length;
      const cached=await frame(normal,1100);
      check(cached.result.forearmPose.ageMs===100&&normal.messages.filter(m=>m.event==='pose-detect').length===count,'intervening hand frames reuse only timestamped auxiliary data');
      const replaced=await frame(normal,1101,2);
      check(replaced.result.forearmPose.ageMs===0&&replaced.generation===2,'a new camera generation clears cached elbow data');
      const app=new ARTryOn();app.pieceType='Bracelet';
      let config;app._trackingWorkerReady=false;
      // Actual configuration is verified by the production start method via
      // a local Worker shim; no camera or model request occurs here.
      const NativeWorker=window.Worker;
      window.Worker=class{postMessage(m){config=m.config;queueMicrotask(()=>this.onmessage({data:{type:'ready'}}));}terminate(){}};
      try{await app.startTrackingWorker();check(config.trackForearm&&config.forearmModelUrl.includes('pose_landmarker_lite/float16/1/'),'bracelet controller requests the pinned auxiliary model');}
      finally{app.close();window.Worker=NativeWorker;}
      for(const piece of ['Ring','Necklace','Earrings']){
        const other=new ARTryOn();other.pieceType=piece;window.Worker=class{postMessage(m){config=m.config;queueMicrotask(()=>this.onmessage({data:{type:'ready'}}));}terminate(){}};
        try{await other.startTrackingWorker();check(!config.trackForearm,piece+' does not request the extra model');}
        finally{other.close();window.Worker=NativeWorker;}
      }
      const failure=await create('unavailable');
      await new Promise(resolve=>setTimeout(resolve,160));
      const failed=await frame(failure,2000);
      check(failed.result.landmarks[0].length===21&&!failed.result.forearmPose&&!failure.messages.some(m=>m.type==='error'),'unavailable auxiliary model preserves hand-only tracking');
      const overloaded=await create('overload');await overloaded.wait(m=>m.event==='pose-loaded');
      const slow=await frame(overloaded,3000);
      check(slow.detectCost>=50&&!slow.result.forearmPose&&!overloaded.messages.some(m=>m.event==='pose-detect'),'slow hand inference skips auxiliary work');
      const late=await create();
      const readyAgain=late.wait(m=>m.type==='ready');late.worker.postMessage({type:'init',config:{...late.config,trackForearm:false}});await readyAgain;
      if(!late.messages.some(m=>m.event==='pose-closed'))await late.wait(m=>m.event==='pose-closed');
      const next=await frame(late,4000,3);
      check(!next.result.forearmPose&&late.messages.some(m=>m.event==='hand-closed'),'late auxiliary initialization is disposed after replacing the tracker session');
      check(window.__cameraRequests===0,'no camera requests');
      return {passed:labels.length,checks:labels,cameraCalls:window.__cameraRequests,models:'synthetic vision API inside the production worker'};
    }finally{for(const worker of active)worker.terminate();for(const url of urls)URL.revokeObjectURL(url);}
  })()`);
  assert.deepEqual(errors,[],'No browser/worker exceptions');console.log(JSON.stringify({...result,errors}));
}finally{socket.close();}
