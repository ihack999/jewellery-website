import assert from 'node:assert/strict';
const origin = process.env.TJC_TEST_ORIGIN;
if (!origin || !process.env.TJC_TEST_CDP) throw Error('Run node scripts/check_journeys.mjs --ar-lighting');
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
    window.__lightTest={THREE:await import('/assets/js/three.module.js'),
      ARTryOn:(await import('/assets/js/ar-tryon.js?v=20260912-metal-assets')).ARTryOn,
      apply:(await import('/assets/js/ar/appearance-lighting.js?v=20260912-ar-lighting')).applyAppearanceLighting};
    await (await import('/assets/js/designer.js?v=20260912-metals')).prepareDesignerForAR();
    window.__lightTest.getState=window.__tjcDesigner.getState;
    window.__lightTest.base=window.__tjcDesigner.getState();
  })()`);
  const cases=[
    ...['Classic Round','Cigar Band','Split Shank','Tapered Shank','Stacked Double'].map(s=>['Ring',s]),
    ...['Pendant','Y-Drop','Lariat','Station','Choker'].map(s=>['Necklace',s]),
    ...['Bangle','Cuff','Tennis','Station'].map(s=>['Bracelet',s]),
    ...['Stud','Drop','Huggie','Chandelier'].map(s=>['Earrings',s])
  ];
  const results=[];
  for(const[piece,silhouette]of cases){
    const result=await evaluate(`(async()=>{
      const {THREE,ARTryOn,apply,base}=window.__lightTest;
      const state={...base,piece:${JSON.stringify(piece)},silhouette:${JSON.stringify(silhouette)},stone:'Blue Sapphire',accent:true};
      window.__tjcDesigner.getState=()=>state;
      const source=document.createElement('canvas');source.width=640;source.height=360;
      const ctx=source.getContext('2d');let grey=32,cropPattern=false;
      const draw=()=>{
        ctx.fillStyle='rgb('+grey+','+grey+','+grey+')';ctx.fillRect(0,0,640,360);
        if(cropPattern){ctx.fillStyle='white';ctx.fillRect(0,0,192,360);ctx.fillRect(448,0,192,360);}
      };
      draw();const stream=source.captureStream(30),timer=setInterval(draw,33);
      const app=new ARTryOn();
      app.startCamera=async function(){this.stream=stream;this.video.srcObject=stream;await this.video.play();};
      app.startMediaPipe=async()=>{};app.startVideoFrames=app.loop=()=>{};
      let environment;const load=app._loadEnvironment.bind(app);app._loadEnvironment=()=>environment=load();
      const labels=[],check=(ok,label)=>{if(!ok)throw Error(state.piece+'/'+state.silhouette+': '+label);labels.push(label);};
      const next=()=>new Promise((resolve,reject)=>{
        const timeout=setTimeout(()=>reject(Error('Generated frame timed out')),3000);
        app.video.requestVideoFrameCallback(()=>{clearTimeout(timeout);resolve();});
      });
      let report;
      try{
        await app.open();check(app._initialized,'full AR opens with generated video');await environment;await next();
        const wearable=app._wearable,beforeSpec=JSON.stringify(wearable.spec),geometry=[],materials=[];
        wearable.piece.traverse(node=>{
          if(node.isMesh){geometry.push([node.geometry,node.geometry.attributes.position.array.slice()]);
            for(const m of [node.material].flat())if(m.isMeshStandardMaterial)materials.push([m,m.color.clone(),m.roughness,m.ior,m.attenuationColor?.clone()]);}
        });
        check(materials.every(([m])=>m.envMap===null),'all physical materials use the shared environment gain');
        app.renderer.setPixelRatio(1);app.renderer.setSize(480,360,false);
        app.camera.aspect=4/3;app.camera.updateProjectionMatrix();
        app.ring.traverse(node=>{if(node.isMesh&&!node.material.colorWrite)node.visible=false;});
        app.ring.visible=true;app.ring.quaternion.setFromEuler(new THREE.Euler(.20,.22,0));app.ring.updateWorldMatrix(true,true);
        const bounds=new THREE.Box3().setFromObject(wearable.piece),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
        const zoom=.50/Math.max(size.x,size.y,size.z);app.ring.scale.setScalar(zoom);app.ring.position.copy(center).multiplyScalar(-zoom);
        const lights={hemi:app._hemi,key:app._key,fill:app._fill,rim:app._rim};
        const pixels=()=>{
          app.renderer.render(app.scene,app.camera);const gl=app.renderer.getContext(),bytes=new Uint8Array(480*360*4);
          gl.readPixels(0,0,480,360,gl.RGBA,gl.UNSIGNED_BYTE,bytes);return bytes;
        };
        app._lastLightSample=-Infinity;app.sampleVideoLighting(performance.now());
        const darkGain=app.scene.environmentIntensity;check(darkGain>.125&&darkGain<.4,'dim camera lowers reflected and direct lighting');
        const adapted=pixels();if(state.piece==='Necklace'&&state.silhouette==='Pendant')window.__lightingAdapted=app.canvas.toDataURL('image/png');
        apply(app.scene,app.renderer,lights,1);const reference=pixels();
        if(state.piece==='Necklace'&&state.silhouette==='Pendant')window.__lightingReference=app.canvas.toDataURL('image/png');
        app.ring.visible=false;const background=pixels();app.ring.visible=true;
        let baselineSum=0,adaptedSum=0,foreground=0,maxBackgroundDelta=0;
        for(let i=0;i<reference.length;i+=4){
          const delta=Math.abs(reference[i]-background[i])+Math.abs(reference[i+1]-background[i+1])+Math.abs(reference[i+2]-background[i+2]);
          if(delta>30){baselineSum+=reference[i]+reference[i+1]+reference[i+2];adaptedSum+=adapted[i]+adapted[i+1]+adapted[i+2];foreground++;}
          if(i<480*4)for(let c=0;c<3;c++)maxBackgroundDelta=Math.max(maxBackgroundDelta,Math.abs(reference[i+c]-adapted[i+c]));
        }
        check(foreground>50,'nonempty jewellery fragments measured');
        check(adaptedSum<baselineSum*.90,'actual product shader radiance responds to the environment gain');
        check(maxBackgroundDelta===0,'appearance gain does not re-expose camera pixels');
        check([0,1,2].every(c=>Math.abs(background[c]-grey)<=3),'camera sRGB round-trip retains generated grey');
        apply(app.scene,app.renderer,lights,darkGain);
        if(state.piece==='Ring'&&state.silhouette==='Classic Round'){
          const saved=[];let gem;
          wearable.piece.traverse(node=>{if(node.isMesh){saved.push([node,node.visible]);node.visible=false;if(node.userData.optics&&!gem)gem=node;}});
          check(Boolean(gem),'ray-traced gem exists for the isolated environment test');
          const batchRoot=wearable.piece.getObjectByName('ar-metal-draw-batches');batchRoot.visible=false;
          gem.visible=true;
          const environmentPixels=gain=>{
            apply(app.scene,app.renderer,lights,gain);for(const light of Object.values(lights))light.intensity=0;
            return pixels();
          };
          const envBright=environmentPixels(1),envDim=environmentPixels(.125);
          let bright=0,dim=0,fragments=0;
          for(let i=0;i<envBright.length;i+=4){
            if(Math.abs(envBright[i]-background[i])+Math.abs(envBright[i+1]-background[i+1])+Math.abs(envBright[i+2]-background[i+2])>30){
              bright+=envBright[i]+envBright[i+1]+envBright[i+2];dim+=envDim[i]+envDim[i+1]+envDim[i+2];fragments++;
            }
          }
          check(fragments>20&&dim<bright*.8,'isolated custom ray gem responds with all direct lights disabled');
          for(const[node,visible]of saved)node.visible=visible;batchRoot.visible=true;
          apply(app.scene,app.renderer,lights,darkGain);
        }
        // A held frame must not accumulate repeated filter updates.
        app.modal.querySelector('[data-ar-freeze]').click();check(app._frozen&&app.video.paused,'real freeze control pauses video');
        const frozen=app.scene.environmentIntensity;
        for(let i=0;i<10;i++)app.sampleVideoLighting(performance.now()+i*300);
        check(app.scene.environmentIntensity===frozen,'frozen preview holds its lighting');
        grey=170;draw();app.modal.querySelector('[data-ar-freeze]').click();await next();await next();
        app._appearanceLighting.reset();app._lastLightSample=-Infinity;app.sampleVideoLighting(performance.now());
        const brightGain=app.scene.environmentIntensity;check(brightGain>darkGain*2,'bright camera raises shared lighting');
        const key=app._key.position.clone();app._hasTarget=true;app._lastStageNorm={x:.02,y:.85};
        await next();app._lastLightSample=-Infinity;app.sampleVideoLighting(performance.now());
        check(app._key.position.equals(key),'uniform off-centre image does not rotate the key light');
        check(app.renderer.info.programs.every(p=>p.diagnostics?.runnable!==false),'physical and custom gem shaders compile');
        check(materials.every(([m,c,r,ior,abs])=>m.color.equals(c)&&m.roughness===r&&m.ior===ior&&(!abs||m.attenuationColor.equals(abs))),'metal and stone material properties preserved');
        check(JSON.stringify(wearable.spec)===beforeSpec&&geometry.every(([g,v])=>g.attributes.position.array.every((n,i)=>n===v[i])),'dimensions and geometry preserved');
        if(state.piece==='Necklace'&&state.silhouette==='Pendant'){
          const held=app.scene.environmentIntensity;app._neckCircumferenceMm=350;app.rebuildNecklace();
          check(app.scene.environmentIntensity===held&&app._wearable.pose.userData.arOptics.traced>0,'neck rebuild preserves camera gain with new ray materials');
          grey=32;cropPattern=true;draw();app.canvas.style.width='240px';app.canvas.style.height='480px';
          check(app.videoMetrics().width/app.videoMetrics().height<.6,'portrait crop fixture is active');
          await next();await next();app._appearanceLighting.reset();app._lastLightSample=-Infinity;
          app.sampleVideoLighting(performance.now());
          check(app.scene.environmentIntensity<.4,'bright pixels outside the displayed cover crop do not illuminate the necklace');
        }
        report={piece:state.piece,silhouette:state.silhouette,darkGain,brightGain,fragmentRatio:adaptedSum/baselineSum,foreground,passed:labels.length};
      }finally{clearInterval(timer);app.close();stream.getTracks().forEach(track=>track.stop());}
      check(stream.getTracks().every(track=>track.readyState==='ended')&&app._appearanceLighting.lastFrame===null,'close clears lighting and ends generated tracks');
      return {...report,passed:labels.length};
    })()`);
    results.push(result);console.log(JSON.stringify(result));
  }
  await evaluate('window.__tjcDesigner.getState=window.__lightTest.getState');
  assert.equal(await evaluate('window.__cameraRequests'),0);assert.deepEqual(errors,[]);
  const {writeFile}=await import('node:fs/promises');
  for(const name of ['Reference','Adapted']){
    const preview=await evaluate('window.__lighting'+name);
    if(preview)await writeFile('/private/tmp/ar-lighting-'+name.toLowerCase()+'-synthetic.png',Buffer.from(preview.split(',')[1],'base64'));
  }
  console.log(JSON.stringify({passed:results.reduce((s,r)=>s+r.passed,0),styles:results.length,cameraCalls:0,errors}));
}finally{socket.close();}
