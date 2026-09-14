import assert from 'node:assert/strict';
const origin = process.env.TJC_TEST_ORIGIN;
if (!origin || !process.env.TJC_TEST_CDP) throw Error('Run node scripts/check_journeys.mjs --ar-tracking');
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
    const { ARTryOn } = await import('/assets/js/ar-tryon.js?v=20260912-metal-assets');
    const NativeWorker = window.Worker;
    // The actual production worker runs with a local synthetic vision module.
    // Only the model is replaced; ImageBitmap transfer and rVFC are native.
    const modelURL = URL.createObjectURL(new Blob([
      'export const FilesetResolver = { forVisionTasks: async () => ({}) };\n' +
      'const factory = { createFromOptions: async () => ({ close() {}, detectForVideo(bitmap) {\n' +
      ' const canvas = new OffscreenCanvas(1,1), ctx = canvas.getContext("2d");\n' +
      ' ctx.drawImage(bitmap,0,0,1,1); const x = ctx.getImageData(0,0,1,1).data[0] / 255;\n' +
      ' const start = performance.now(); while(performance.now() - start < 45) {}\n' +
      ' const points = Array.from({length:21}, () => ({x, y:0.5, z:0}));\n' +
      ' return {landmarks:[points], worldLandmarks:[points], handedness:[[{categoryName:"Right",score:1}]], faceLandmarks:[points], facialTransformationMatrixes:[]};\n' +
      '} }) }; export const HandLandmarker = factory, FaceLandmarker = factory, PoseLandmarker = factory;'
    ], { type: 'text/javascript' }));
    window.Worker = class extends NativeWorker {
      postMessage(message, ...rest) {
        if (message.type === 'init') message.config.mediaPipeBase = modelURL + '#';
        super.postMessage(message, ...rest);
      }
    };
    const results = [];
    try {
      for (const piece of ['Ring', 'Bracelet', 'Earrings', 'Necklace']) {
        const app = new ARTryOn();
        const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 180;
        const ctx = canvas.getContext('2d'); let tick = 0;
        const draw = () => { ctx.fillStyle = 'rgb(' + (50 + tick++ % 100) + ',80,120)'; ctx.fillRect(0,0,320,180); };
        draw(); const timer = setInterval(draw, 33);
        const video = document.createElement('video'); video.muted = true; video.playsInline = true;
        video.style.cssText = 'position:fixed;left:0;top:0;width:32px;height:18px;pointer-events:none';
        document.body.append(video); video.srcObject = canvas.captureStream(30);
        app.video = video; app.stream = video.srcObject; app.pieceType = piece;
        app.ring = { visible: true }; app.detectInterval = 0;
        app.videoMetrics = () => ({width:320,height:180}); app.worldUnitsPerPixelAtZ = () => 1;
        const applied = [];
        for (const method of ['applyResult','applyResultBracelet','applyResultEarrings','applyResultNecklace']) {
          app[method] = function(result, timestamp) {
            const points = result.faceLandmarks || result.landmarks;
            this._tgtPos.x = this.filtPx.filter(points[0][0].x, timestamp);
            this._hasTarget = true; this.updatePoseVelocity(timestamp);
            applied.push({method, timestamp, mediaTime:this._applyingFrame.mediaTime, pixel:points[0][0].x});
          };
        }
        try {
          await video.play(); await app.startTrackingWorker(); app.startVideoFrames();
          const deadline = performance.now() + 8000;
          while (applied.length < 8 && performance.now() < deadline) await new Promise(resolve => setTimeout(resolve, 50));
          const timing = app._trackingTiming;
          const frame = timing.last?.frame;
          results.push({piece, count:applied.length, methods:[...new Set(applied.map(x=>x.method))],
            decodedPixels:applied.length > 1 && applied.at(-1).pixel !== applied[0].pixel,
            intervals:applied.slice(1).every((x,i)=>Math.abs((x.timestamp-applied[i].timestamp)-(x.mediaTime-applied[i].mediaTime)*1000) < 0.01),
            metadata:!!frame?.presentedFrames && frame.width === 320 && frame.height === 180,
            busySkips:timing.skippedBusy, basis:frame?.timeBasis,
            timingFinite:Number.isFinite(timing.last?.turnaroundMs) && Number.isFinite(timing.last?.inferenceMs),
            diagnostics:timing.describe(performance.now())});
        } finally { clearInterval(timer); app.close(); video.remove(); }
      }
    } finally { window.Worker = NativeWorker; URL.revokeObjectURL(modelURL); }
    return {results, cameraCalls:window.__cameraRequests};
  })()`);
  let checks = 0;
  const expected = { Ring: 'applyResult', Bracelet: 'applyResultBracelet', Earrings: 'applyResultEarrings', Necklace: 'applyResultNecklace' };
  for (const item of result.results) {
    assert.ok(item.count >= 8, JSON.stringify(item)); checks++;
    assert.deepEqual(item.methods, [expected[item.piece]]); checks++;
    assert.ok(item.decodedPixels, 'Transferred bitmap contains changing synthetic pixels'); checks++;
    assert.ok(item.intervals, 'Source intervals survive real asynchronous worker execution'); checks++;
    assert.ok(item.metadata, 'Native video callback metadata reaches the result'); checks++;
    assert.ok(item.busySkips > 0, 'Slow worker skips incoming frames'); checks++;
    assert.ok(item.timingFinite && ['capture','presentation','sample'].includes(item.basis)); checks++;
    assert.match(item.diagnostics, /ms inference.*ms turnaround/); checks++;
  }
  assert.equal(result.cameraCalls, 0); checks++;
  assert.deepEqual(errors, []); checks++;
  console.log(JSON.stringify({ passed: checks, types: result.results.map(x => ({ piece: x.piece, frames: x.count, clock: x.basis })), cameraCalls: result.cameraCalls, runtimeErrors: errors, video: 'Generated canvas only', inference: 'Synthetic model inside the real production worker' }));
} finally { socket.close(); }
