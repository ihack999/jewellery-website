import assert from 'node:assert/strict';
const origin = process.env.TJC_TEST_ORIGIN;
if (!origin || !process.env.TJC_TEST_CDP) throw Error('Run node scripts/check_journeys.mjs --ar-contact');
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

  const result = await evaluate(String.raw`(async () => {
    const THREE = await import('/assets/js/three.module.js');
    const { ARTryOn } = await import('/assets/js/ar-tryon.js?v=20260912-metal-assets');
    const { FingerContactBody } = await import('/assets/js/ar/finger-contact.js?v=20260912-ar-contact');
    const { handFixture } = await import('/scripts/ar_contact_fixtures.js');
    const designer = await import('/assets/js/designer.js?v=20260912-metals');
    await designer.prepareDesignerForAR();
    const results = [];
    const check = (ok, label) => { if (!ok) throw Error(label); results.push(label); };
    const sameMatrix = (a, b) => a.elements.every((v,i) => Math.abs(v-b.elements[i]) < 1e-6);

    // Pixel checks distinguish depth ordering from merely having valid matrices.
    const renderer = new THREE.WebGLRenderer({ antialias: false });
    const target = new THREE.WebGLRenderTarget(256, 256);
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0xffffff);
    const camera = new THREE.OrthographicCamera(-.06, .06, .06, -.06, .01, 1);
    camera.position.z = .2; camera.updateMatrixWorld(true);
    const body = new FingerContactBody(); scene.add(body);
    body.updateSource({start:new THREE.Vector3(0,-.020,0), end:new THREE.Vector3(0,.025,0),
      dorsal:new THREE.Vector3(0,0,1), radius:.008});
    const marker = (x,y,z,color) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(.005,.005), new THREE.MeshBasicMaterial({color, toneMapped:false}));
      mesh.position.set(x,y,z); scene.add(mesh); return mesh;
    };
    const front = marker(0, -.01, .014, 0xff0000);
    const back = marker(0, .008, -.014, 0x0000ff);
    const pastJoint = marker(0, .045, -.014, 0x00ff00);
    const pixels = () => {
      renderer.setRenderTarget(target); renderer.render(scene, camera);
      return [front,back,pastJoint].map(mesh => {
        const p=mesh.position.clone().project(camera), color=new Uint8Array(4);
        renderer.readRenderTargetPixels(target, Math.floor((p.x+1)*128), Math.floor((p.y+1)*128),1,1,color);
        return [...color].slice(0,3);
      });
    };
    const equals = (a,b) => a.every((v,i)=>Math.abs(v-b[i])<3);
    body.syncDisplay(new THREE.Matrix4(), false);
    check(pixels().every((p,i)=>equals(p,[[255,0,0],[0,0,255],[0,255,0]][i])), 'Unmasked depth markers render at their sample pixels');
    body.syncDisplay(new THREE.Matrix4(), true);
    const masked = pixels();
    check(equals(masked[0],[255,0,0]), 'Jewellery in front of skin stays visible');
    check(equals(masked[1],[255,255,255]), 'Jewellery behind skin is hidden without painting over the background');
    check(equals(masked[2],[0,255,0]), 'The proximal body ends at the joint cap, preserving a marker beyond it');
    back.position.x=.025;
    check(equals(pixels()[1],[0,0,255]), 'A band moved away from the finger is no longer hidden by phantom skin');
    body.updateSource({start:new THREE.Vector3(),end:new THREE.Vector3(),dorsal:new THREE.Vector3(0,0,1),radius:.008});
    body.syncDisplay(new THREE.Matrix4(), true); back.position.x=0;
    check(equals(pixels()[1],[0,0,255]), 'Rejected joint data clears the previous depth surface');
    for (const mesh of [front,back,pastJoint]) { mesh.geometry.dispose(); mesh.material.dispose(); }
    body.dispose(); target.dispose(); renderer.dispose(); renderer.forceContextLoss();

    const originalGetState = window.__tjcDesigner.getState;
    const baseState = originalGetState();
    const studioBefore = JSON.stringify(baseState);
    const cases = [['Ring','Classic Round'], ['Ring','Cigar Band'], ['Ring','Split Shank'], ['Ring','Tapered Shank'], ['Ring','Stacked Double'], ['Bracelet','Bangle'], ['Bracelet','Tennis']];
    const renders = [];
    for (const [piece, silhouette] of cases) {
      const state = {...baseState,piece,silhouette,stone:'Blue Sapphire',ringSize:7,accent:true,accentSetting:'Bezel'};
      window.__tjcDesigner.getState = () => state;
      const app = new ARTryOn();
      // Exercise the real modal, designer handoff and startThree. Only capture,
      // inference, camera background and autonomous scheduling are replaced.
      app.startCamera = async function() {
        Object.defineProperties(this.video,{videoWidth:{value:1280,configurable:true},videoHeight:{value:720,configurable:true}});
      };
      app.startMediaPipe = async () => {};
      app.setupCameraBackground = app.startVideoFrames = app.loop = () => {};
      const loadEnvironment = app._loadEnvironment.bind(app);
      let environment;
      app._loadEnvironment = () => environment = loadEnvironment();
      try {
        await app.open();
        check(app._initialized, piece+' / '+silhouette+' initializes the real AR model');
        await environment;
        const physical = app.ring.getObjectByName('ar-physical-metres');
        const before = physical.matrix.clone();
        const dimensionsBefore = JSON.stringify(app._physicalSpec);
        const geometryBefore = [];
        physical.traverse(node => { if(node.isMesh) geometryBefore.push([node.geometry, node.geometry.attributes.position.array.slice()]); });
        const step = (pose={}) => {
          app.resetTrackingFilters();
          const tracking = handFixture(pose);
          if(piece==='Ring') app.applyResult(tracking, performance.now());
          else app.applyResultBracelet(tracking, performance.now());
          app._poseConfidence=1;
          app.syncHandContactDisplay(); app.updateContactVisuals(1);
          app.renderer.render(app.scene,app.camera);
          return tracking;
        };
        step();
        if(piece==='Ring') {
          check(app._fingerContactBody?.visible && !app._occluder, silhouette+' uses only the joint-fitted selected-finger body');
          const source = app._fingerContactBody.sourceMatrix.clone();
          const bounds = new THREE.Box3().setFromObject(app._fingerContactBody);
          for (const [selector,value] of [['data-ar-side',48],['data-ar-lift',-30],['data-ar-roll',35],['data-ar-fit',126]]) {
            const input=app.modal.querySelector('['+selector+']'); input.value=String(value); input.dispatchEvent(new Event('input',{bubbles:true}));
            check(!app._hasTarget, silhouette+' placement edit resets motion before recomputing contact');
            app.applyResult(handFixture(),performance.now()); app.syncHandContactDisplay();
            check(sameMatrix(app._fingerContactBody.sourceMatrix,source), silhouette+' '+selector+' preserves the tracked body');
            const after=new THREE.Box3().setFromObject(app._fingerContactBody);
            check(after.min.distanceTo(bounds.min)<1e-6 && after.max.distanceTo(bounds.max)<1e-6, silhouette+' '+selector+' preserves displayed skin');
          }
          check(app._targetShadowOpacity===0, silhouette+' suppresses contact shadow away from the finger');
          app.calibration.side=app.calibration.lift=app.calibration.roll=0; app.calibration.fit=1;
          for (const finger of ['index','middle','ring','pinky']) {
            app.modal.querySelector('[data-finger="'+finger+'"]').click();
            app.applyResult(handFixture({pitch:.4,yaw:.3,bend:1.5}),performance.now()); app.syncHandContactDisplay();
            check(app._fingerContactBody.visible && app._handMaskMesh.count===14, silhouette+' switches to '+finger+' without a duplicate depth segment');
          }
        } else check(!app._fingerContactBody && app._wristContactBody?.visible && !app._occluder, silhouette+' uses independent wrist contact');
        step({pitch:.3,yaw:.3,bend:1.2});
        check(app.renderer.info.render.calls>0 && app.renderer.info.render.triangles>0, silhouette+' renders its full model');
        check(app.renderer.info.programs.every(program=>program.diagnostics?.runnable!==false), silhouette+' compiles its WebGL shaders');
        physical.updateMatrix();
        check(sameMatrix(before,physical.matrix) && dimensionsBefore===JSON.stringify(app._physicalSpec), silhouette+' preserves physical dimensions and conversion');
        check(geometryBefore.every(([geometry,positions])=>geometry.attributes.position.array.every((value,i)=>value===positions[i])), silhouette+' preserves product mesh vertices');
        renders.push({piece,silhouette,drawCalls:app.renderer.info.render.calls,triangles:app.renderer.info.render.triangles});
        if(piece==='Ring' && silhouette==='Classic Round') {
          // Review artifact: explicitly schematic bodies with the real product.
          app.scene.background=new THREE.Color(0xe8edf3);
          app._fingerContactBody.material.colorWrite=true; app._fingerContactBody.material.color.set(0x6989a5);
          app._handMaskMesh.material.colorWrite=true; app._handMaskMesh.material.color.set(0x8ba2b7);
          step();
          window.__arContactPreview=app.canvas.toDataURL('image/png');
        }
      } finally {
        const contact=app._fingerContactBody;
        app.close();
        check(!app._fingerContactBody && (!contact || !contact.parent) && !document.querySelector('.ar-tryon-modal'), silhouette+' disposes its body and closes the modal');
      }
    }
    window.__tjcDesigner.getState=originalGetState;
    check(JSON.stringify(originalGetState())===studioBefore, 'AR validation leaves the original studio design unchanged');
    check(window.__cameraRequests===0, 'Zero camera requests');
    return {checks:results.length,results,renders,cameraCalls:window.__cameraRequests};
  })()`);
  assert.equal(result.cameraCalls, 0);
  assert.deepEqual(errors, [], 'No uncaught browser errors');
  const { writeFile } = await import('node:fs/promises');
  const preview = await evaluate('window.__arContactPreview');
  if (preview) await writeFile('/private/tmp/ar-finger-contact-synthetic.png', Buffer.from(preview.split(',')[1], 'base64'));
  delete result.results;
  console.log(JSON.stringify({...result,errors,preview:'/private/tmp/ar-finger-contact-synthetic.png'}));
} finally { socket.close(); }
