import assert from 'node:assert/strict';
const origin = process.env.TJC_TEST_ORIGIN;
if (!origin || !process.env.TJC_TEST_CDP) throw Error('Run node scripts/check_journeys.mjs --ar-rendering');
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

  await evaluate(`(async()=>{
    window.__renderTest={THREE:await import('/assets/js/three.module.js'),
      ARTryOn:(await import('/assets/js/ar-tryon.js?v=20260912-metal-assets')).ARTryOn};
    await (await import('/assets/js/designer.js?v=20260912-metals')).prepareDesignerForAR();
    window.__renderTest.getState=window.__tjcDesigner.getState;
    window.__renderTest.base=window.__tjcDesigner.getState();
  })()`);
  const cases = [
    ...['Classic Round','Cigar Band','Split Shank','Tapered Shank','Stacked Double'].map(s=>['Ring',s]),
    ...['Pendant','Y-Drop','Lariat','Station','Choker'].map(s=>['Necklace',s]),
    ...['Bangle','Cuff','Tennis','Station'].map(s=>['Bracelet',s]),
    ...['Stud','Drop','Huggie','Chandelier'].map(s=>['Earrings',s])
  ];
  const results=[];
  for (const [piece,silhouette] of cases) {
    const result=await evaluate(`(async()=>{
      const {THREE,ARTryOn,base}=window.__renderTest;
      const state={...base,piece:${JSON.stringify(piece)},silhouette:${JSON.stringify(silhouette)},stone:'Blue Sapphire',accent:true,chainLengthMm:450};
      window.__tjcDesigner.getState=()=>state;
      const app=new ARTryOn();
      app.startCamera=async function(){Object.defineProperties(this.video,{videoWidth:{value:1280},videoHeight:{value:720}});};
      app.startMediaPipe=async()=>{};
      app.setupCameraBackground=app.startVideoFrames=app.loop=()=>{};
      let environment;const load=app._loadEnvironment.bind(app);app._loadEnvironment=()=>environment=load();
      const labels=[], comparisons=[];
      const check=(condition,label)=>{if(!condition)throw Error(state.piece+'/'+state.silhouette+': '+label);labels.push(label);};
      let batchReport;
      try{
        await app.open();check(app._initialized,'full AR model initializes');await environment;
        const wearable=app._wearable;batchReport={...wearable.renderBatches.report};
        app.renderer.setPixelRatio(1);app.renderer.setSize(480,360,false);
        app.camera.aspect=4/3;app.camera.updateProjectionMatrix();
        app.scene.background=new THREE.Color(0x303941);
        // Compare product rendering without fixture skin. Body/depth behavior
        // is independently covered by the body-fit and contact browser suites.
        app.ring.traverse(node=>{if(node.isMesh&&!node.material.colorWrite)node.visible=false;});
        const spec=JSON.stringify(wearable.spec), sourceBuffers=[];
        wearable.piece.traverse(node=>{if(node.isMesh&&!node.name.startsWith('ar-metal-batch:'))sourceBuffers.push([node,node.geometry,node.material,node.geometry.attributes.position.array.slice()]);});
        const pixels=()=>{
          app.renderer.render(app.scene,app.camera);
          const gl=app.renderer.getContext(),bytes=new Uint8Array(480*360*4);
          gl.readPixels(0,0,480,360,gl.RGBA,gl.UNSIGNED_BYTE,bytes);
          return {bytes,calls:app.renderer.info.render.calls,triangles:app.renderer.info.render.triangles};
        };
        const frame=()=>{
          app.ring.visible=true;app.ring.position.set(0,0,0);app.ring.scale.setScalar(1);
          app.ring.updateWorldMatrix(true,true);wearable.renderBatches.sync();
          const bounds=new THREE.Box3().setFromObject(wearable.piece),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
          const zoom=.48/Math.max(size.x,size.y,size.z);
          app.ring.scale.setScalar(zoom);app.ring.position.copy(center).multiplyScalar(-zoom);
        };
        for(let pose=0;pose<3;pose++){
          app.ring.quaternion.setFromEuler(new THREE.Euler(pose*.20,pose*.26,pose*-.10));
          if(wearable.fitBracelet)wearable.fitBracelet([55,45,62][pose]);
          if(pose===1)for(let i=0;i<20;i++)app._articulation.update(1/60,true);
          if(pose===2&&state.piece==='Earrings'){
            wearable.setEarVisible('Left',false);
            check(wearable.earNodes.some(n=>n.userData.wearableEar==='Left'&&!n.visible),'left earring hidden for visibility comparison');
          }
          frame();
          wearable.renderBatches.setEnabled(false);const before=pixels();
          wearable.renderBatches.setEnabled(true);const after=pixels();
          let squared=0,large=0,foreground=0;
          for(let i=0;i<before.bytes.length;i+=4){
            let max=0;
            for(let c=0;c<3;c++){const d=Math.abs(before.bytes[i+c]-after.bytes[i+c]);squared+=d*d;max=Math.max(max,d);}
            if(max>8)large++;
            if(Math.abs(before.bytes[i]-before.bytes[0])+Math.abs(before.bytes[i+1]-before.bytes[1])+Math.abs(before.bytes[i+2]-before.bytes[2])>20)foreground++;
          }
          const rmse=Math.sqrt(squared/(480*360*3)),changedFraction=large/(480*360);
          check(foreground>100,'nonempty rendered product pose '+pose);
          check(rmse<1&&changedFraction<.002,'pixel equivalence pose '+pose+' RMSE '+rmse+' changed '+changedFraction);
          check(after.calls<=before.calls,'draw count never increases pose '+pose);
          check(after.triangles===before.triangles,'triangle workload preserved pose '+pose);
          comparisons.push({pose,before:before.calls,after:after.calls,triangles:after.triangles,rmse,changedFraction});
          if(pose===0&&state.piece==='Bracelet'&&state.silhouette==='Tennis')window.__renderPreview=app.canvas.toDataURL('image/png');
        }
        check(JSON.stringify(wearable.spec)===spec,'physical specification preserved');
        check(sourceBuffers.every(([node,g,m,v])=>node.geometry===g&&node.material===m&&g.attributes.position.array.every((n,i)=>n===v[i])),'source geometry and optical materials preserved');
        check(app.renderer.info.programs.every(p=>p.diagnostics?.runnable!==false),'all shaders compile');
        if(batchReport.sourceDraws>100)check(comparisons[0].after<comparisons[0].before*.65,'substantial draw reduction for repeated hardware');
        if(state.piece==='Necklace'&&state.silhouette==='Pendant'){
          const oldBatch=wearable.piece.getObjectByName('ar-metal-draw-batches');
          app._neckCircumferenceMm=360;app.rebuildNecklace();
          check(oldBatch.parent===null&&oldBatch.children.length===0,'neck rebuild releases previous instance buffers');
          app.ring.visible=true;pixels();check(app._wearable.renderBatches.report.batches>0,'rebuilt necklace renders with fresh batches');
        }
      }finally{app.close();}
      check(window.__cameraRequests===0,'no camera calls');
      return {piece:state.piece,silhouette:state.silhouette,passed:labels.length,batchReport,comparisons};
    })()`);
    results.push(result);
    console.log(JSON.stringify(result));
  }
  await evaluate(`window.__tjcDesigner.getState=window.__renderTest.getState`);
  assert.deepEqual(errors,[],'No runtime or shader errors');
  const preview=await evaluate('window.__renderPreview');
  if(preview){const {writeFile}=await import('node:fs/promises');await writeFile('/private/tmp/ar-render-tennis-synthetic.png',Buffer.from(preview.split(',')[1],'base64'));}
  console.log(JSON.stringify({passed:results.reduce((s,r)=>s+r.passed,0),styles:results.length,cameraCalls:await evaluate('window.__cameraRequests'),errors}));
}finally{socket.close();}
