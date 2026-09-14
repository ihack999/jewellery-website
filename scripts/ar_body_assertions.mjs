import assert from 'node:assert/strict';
const origin = process.env.TJC_TEST_ORIGIN;
if (!origin || !process.env.TJC_TEST_CDP) throw Error('Run node scripts/check_journeys.mjs --ar-body-fit');
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
  const timer = setTimeout(() => { pending.delete(id); reject(Error(`Timed out: ${method}`)); }, 20000);
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
    const THREE=await import('/assets/js/three.module.js');
    const {ARTryOn}=await import('/assets/js/ar-tryon.js?v=20260912-metal-assets');
    const {WristContactBody}=await import('/assets/js/ar/wrist-contact.js?v=20260912-ar-torso-wrist');
    const {NeckContactBody}=await import('/assets/js/ar/neck-contact.js?v=20260912-ar-placement');
    const {torsoFixture}=await import('/scripts/ar_body_fixtures.js');
    const {handFixture}=await import('/scripts/ar_contact_fixtures.js');
    const {forearmFixture}=await import('/scripts/ar_placement_fixtures.js');
    const designer=await import('/assets/js/designer.js?v=20260912-metals');
    await designer.prepareDesignerForAR();
    const labels=[],renders=[];
    const check=(ok,label)=>{if(!ok)throw Error(label);labels.push(label);};
    const same=(a,b)=>a.elements.every((v,i)=>Math.abs(v-b.elements[i])<1e-6);
    const originalGetState=window.__tjcDesigner.getState,base=originalGetState();
    const savedBefore=localStorage.getItem('tj-ar-tryon-calibration-v1');
    const cases=[...['Pendant','Y-Drop','Lariat','Station','Choker'].map(style=>['Necklace',style]),...['Bangle','Cuff','Tennis','Station'].map(style=>['Bracelet',style])];
    for(const[piece,silhouette]of cases){
      const state={...base,piece,silhouette,chainLengthMm:450,stone:'Blue Sapphire',accent:true};
      window.__tjcDesigner.getState=()=>state;
      const app=new ARTryOn();
      app.startCamera=async function(){Object.defineProperties(this.video,{videoWidth:{value:1280},videoHeight:{value:720}});};
      app.startMediaPipe=async()=>{};
      app.setupCameraBackground=app.startVideoFrames=app.loop=()=>{};
      let environment;const load=app._loadEnvironment.bind(app);app._loadEnvironment=()=>environment=load();
      try{
        await app.open();check(app._initialized,piece+'/'+silhouette+' opens the full AR model');await environment;
        app.calibration={...app.calibration,side:0,lift:0,roll:0,fit:1,neckHeightAuto:false,neckHeightMm:50,neckBaseOffsetMm:{x:0,y:0}};
        app.syncCalibrationControls();
        const physical=app.ring.getObjectByName('ar-physical-metres');physical.updateMatrix();
        const matrixBefore=physical.matrix.clone(),specBefore=JSON.stringify(app._physicalSpec),buffers=[];
        physical.traverse(node=>{if(node.isMesh)buffers.push([node.geometry,node.geometry.attributes.position.array.slice()]);});
        const tracking=(options={})=>piece==='Necklace'?torsoFixture(options):handFixture({roll:Math.PI/2,...options});
        const step=(options={},reset=true)=>{
          if(reset)app.resetTrackingFilters();
          const input=tracking(options);app.applyTrackingResult(input);
          app._poseConfidence=1;app.syncHandContactDisplay();app.updateContactVisuals(1);
          app.renderer.render(app.scene,app.camera);return input;
        };
        step();check(app.ring.visible&&app._hasTarget,silhouette+' acquires a generated body');
        if(piece==='Necklace'){
          check(app._neckContactBody?.parent===app.scene,silhouette+' owns its neck depth outside the product');
          const neckMatrix=app._neckContactBody.matrixWorld.clone();
          for(const[name,value]of [['data-ar-side',40],['data-ar-lift',40],['data-ar-roll',30],['data-ar-fit',120]]){
            const control=app.modal.querySelector('['+name+']');control.value=String(value);control.dispatchEvent(new Event('input',{bubbles:true}));
            step();check(same(neckMatrix,app._neckContactBody.matrixWorld),silhouette+' '+name+' leaves the neck in place');
          }
          app.calibration.side=app.calibration.lift=app.calibration.roll=0;app.calibration.fit=1;step();
          const rotation=app._tgtQuat.clone(),position=app._tgtPos.clone();
          step({headX:.16,headY:.04});
          check(rotation.angleTo(app._tgtQuat)<1e-6&&position.distanceTo(app._tgtPos)<1e-6,silhouette+' stays attached when only the head moves');
          step({lean:.4});check(rotation.angleTo(app._tgtQuat)>.25,silhouette+' follows observed torso lean');
          step();app._frozen=true;app.setPlacementOpen(true);app.modal.querySelector(".ar-wearable-options").open=true;
          const panel=app.modal.querySelector('.ar-tryon-calibration');
          check(panel.scrollWidth<=panel.clientWidth+1,silhouette+' placement controls fit the viewport');
          const button=app.modal.querySelector('[data-ar-place-neck]');button.click();
          check(app._placingNeckBase&&app.canvas.style.pointerEvents==='auto',silhouette+' enters neck-base placement');
          document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
          check(!app._placingNeckBase&&!app._closed&&document.activeElement===button,silhouette+' cancels picking without closing AR');
          button.click();
          const ref=app._neckPlacementReference;
          const desired={x:ref.x+ref.pixelsPerMeter*(ref.right.x*.020+ref.up.x*.030),y:ref.y+ref.pixelsPerMeter*(ref.right.y*.020+ref.up.y*.030)};
          const rect=app.canvas.getBoundingClientRect();
          app.canvas.dispatchEvent(new PointerEvent('pointerdown',{clientX:rect.left+rect.width/2+desired.x,clientY:rect.top+rect.height/2-desired.y,bubbles:true}));
          check(!app._placingNeckBase&&!app.calibration.neckHeightAuto,silhouette+' accepts the chosen neck base');
          const screen=app._tgtPos.clone().project(app.camera);
          check(Math.abs(screen.x-desired.x*2/rect.width)<1e-6&&Math.abs(screen.y-desired.y*2/rect.height)<1e-6,silhouette+' projects the attachment onto the tapped point');
          check(Math.abs(app.calibration.neckBaseOffsetMm.x-20)<1e-5&&Math.abs(app.calibration.neckBaseOffsetMm.y-30)<1e-5,silhouette+' stores an offset in torso millimetres');
          step({zoom:1.2,headX:-.16,headY:-.05});
          const corrected=app._neckPlacementReference;
          const projected=app._tgtPos.clone().project(app.camera);
          check(Math.abs(projected.x-(corrected.x+corrected.pixelsPerMeter*(corrected.right.x*.020+corrected.up.x*.030))*2/rect.width)<1e-6,silhouette+' carries placement through distance and head changes');
          check(localStorage.getItem('tj-ar-tryon-calibration-v1')===savedBefore,silhouette+' does not save placement without Remember placement');
          app.modal.querySelector('[data-ar-reset-fit]').click();
          check(app.calibration.neckBaseOffsetMm.x===0&&app.calibration.neckBaseOffsetMm.y===0,silhouette+' resets the picked offset');
          step();
        }else{
          check(app._wristContactBody?.visible&&!app._occluder,silhouette+' uses scene-owned wrist depth');
          const wrist=app._wristContactBody.matrixWorld.clone();
          for(const[name,value]of [['data-ar-side',40],['data-ar-roll',30],['data-ar-fit',120]]){
            const control=app.modal.querySelector('['+name+']');control.value=String(value);control.dispatchEvent(new Event('input',{bubbles:true}));
            step();check(same(wrist,app._wristContactBody.matrixWorld),silhouette+' '+name+' leaves skin in place');
          }
          app.calibration.side=app.calibration.roll=0;app.calibration.fit=1;step();
          if(['Bangle','Cuff'].includes(silhouette))check(Math.hypot(app._rigidWristSeating.x,app._rigidWristSeating.y)>0,silhouette+' settles against the wrist without enlarging its opening');
          let forearmAxis,forearmCenter;
          for(const flex of [0,-.65,.65]){
            app.resetTrackingFilters();app.applyTrackingResult(forearmFixture({flex,deviation:.25}));app.syncHandContactDisplay();
            const axis=new THREE.Vector3(0,0,1).applyQuaternion(app._tgtQuat);
            const center=new THREE.Vector3().setFromMatrixPosition(app._wristContactBody.sourceMatrix);
            check(app._forearmSource==='elbow/wrist observation',silhouette+' uses matched forearm data at flex '+flex);
            if(forearmAxis)check(axis.distanceTo(forearmAxis)<1e-5&&center.distanceTo(forearmCenter)<1e-5,silhouette+' stays on the wrist as the hand bends '+flex);
            forearmAxis=axis;forearmCenter=center;app.renderer.render(app.scene,app.camera);
          }
        }
        physical.updateMatrix();
        check(same(matrixBefore,physical.matrix)&&JSON.stringify(app._physicalSpec)===specBefore,silhouette+' preserves product dimensions and metre conversion');
        check(buffers.every(([g,p])=>g.attributes.position.array.every((v,i)=>v===p[i])),silhouette+' preserves product geometry');
        check(app.renderer.info.render.calls>0&&app.renderer.info.programs.every(p=>p.diagnostics?.runnable!==false),silhouette+' renders with working shaders');
        renders.push({piece,silhouette,drawCalls:app.renderer.info.render.calls});
        if((piece==='Necklace'&&silhouette==='Pendant')||(piece==='Bracelet'&&silhouette==='Bangle')){
          app.scene.background=new THREE.Color(0xe8edf3);
          const body=piece==='Necklace'?app._neckContactBody:app._wristContactBody;
          body.material.colorWrite=true;body.material.color.set(0x6989a5);
          app.renderer.render(app.scene,app.camera);
          window['__bodyPreview'+piece]=app.canvas.toDataURL('image/png');
        }
      }finally{
        const wrist=app._wristContactBody,neck=app._neckContactBody;app.close();
        check(!app._wristContactBody&&(!wrist||!wrist.parent)&&(!neck||!neck.parent)&&!app._neckContactBody&&!app._placingNeckBase,silhouette+' releases its contact and placement state');
      }
    }
    window.__tjcDesigner.getState=originalGetState;
    check(JSON.stringify(originalGetState())===JSON.stringify(base),'Studio design is unchanged');

    const renderer=new THREE.WebGLRenderer({antialias:false}),target=new THREE.WebGLRenderTarget(256,256);
    const scene=new THREE.Scene();scene.background=new THREE.Color(0xffffff);
    const camera=new THREE.OrthographicCamera(-.08,.08,.08,-.08,.01,1);camera.position.z=.2;camera.updateMatrixWorld(true);
    const body=new WristContactBody();scene.add(body);
    body.updateSource(new THREE.Vector3(),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2),.025,1);
    body.syncDisplay(new THREE.Matrix4(),true);
    const marker=(y,z,color)=>{const mesh=new THREE.Mesh(new THREE.PlaneGeometry(.006,.006),new THREE.MeshBasicMaterial({color,toneMapped:false}));mesh.position.set(0,y,z);scene.add(mesh);return mesh;};
    const markers=[marker(-.008,.03,0xff0000),marker(.008,-.03,0x0000ff),marker(.065,-.03,0x00ff00)];
    renderer.setRenderTarget(target);renderer.render(scene,camera);
    for(const[i,mesh]of markers.entries()){
      const p=mesh.position.clone().project(camera),pixel=new Uint8Array(4);renderer.readRenderTargetPixels(target,Math.floor((p.x+1)*128),Math.floor((p.y+1)*128),1,1,pixel);
      const expected=[[255,0,0],[255,255,255],[0,255,0]][i];
      check(expected.every((v,j)=>Math.abs(v-pixel[j])<3),['Wrist front fragments remain visible','Wrist back fragments are occluded','Rounded wrist ends do not clip distant jewellery'][i]);
      mesh.geometry.dispose();mesh.material.dispose();
    }
    body.dispose();
    const neck=new NeckContactBody();scene.add(neck);
    neck.updateSource(new THREE.Vector3(),new THREE.Quaternion(),1,.030,.024);neck.syncDisplay(new THREE.Matrix4(),true);
    const neckMarkers=[marker(.025,.01,0xff0000),marker(.025,-.10,0x0000ff),marker(.025,-.10,0x00ff00)];
    neckMarkers[0].position.x=-.012;neckMarkers[1].position.x=.012;neckMarkers[2].position.x=.070;
    renderer.render(scene,camera);
    const read=mesh=>{const p=mesh.position.clone().project(camera),pixel=new Uint8Array(4);renderer.readRenderTargetPixels(target,Math.floor((p.x+1)*128),Math.floor((p.y+1)*128),1,1,pixel);return pixel;};
    for(const[i,mesh]of neckMarkers.entries()){
      const pixel=read(mesh),expected=[[255,0,0],[255,255,255],[0,255,0]][i];
      check(expected.every((v,j)=>Math.abs(v-pixel[j])<3),['Neck-front jewellery stays visible','Neck-back jewellery is occluded','Jewellery outside the neck remains visible'][i]);
    }
    neck.updateSource(new THREE.Vector3(),new THREE.Quaternion(),0,.030,.024);neck.syncDisplay(new THREE.Matrix4(),true);renderer.render(scene,camera);
    check(read(neckMarkers[1])[2]>250&&read(neckMarkers[1])[0]<3,'Invalid neck body cannot leave stale depth');
    for(const mesh of neckMarkers){mesh.geometry.dispose();mesh.material.dispose();}neck.dispose();
    target.dispose();renderer.dispose();renderer.forceContextLoss();
    check(window.__cameraRequests===0,'No camera requests');
    return {passed:labels.length,renders,cameraCalls:window.__cameraRequests};
  })()`);
  assert.equal(result.cameraCalls,0);assert.deepEqual(errors,[],'No browser or shader errors');
  const {writeFile}=await import('node:fs/promises');
  for(const type of ['Necklace','Bracelet']){
    const preview=await evaluate('window.__bodyPreview'+type);
    if(preview)await writeFile('/private/tmp/ar-body-'+type.toLowerCase()+'-synthetic.png',Buffer.from(preview.split(',')[1],'base64'));
  }
  console.log(JSON.stringify({...result,errors}));
}finally{socket.close();}
