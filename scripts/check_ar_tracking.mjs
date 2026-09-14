// Camera-free checks using the real AR controller, filters and worker handler.
// Models and image transfers are controlled fakes; no camera or network access.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { VideoFrameClock, TrackingTiming, frameIsFresh } from '../assets/js/ar/frame-timing.js';
import { OneEuro } from '../assets/js/ar/pose-filter.js';

let now = 1000;
let cameraCalls = 0;
let networkCalls = 0;
const replaced = new Map();
const replace = (name, value) => {
  if (!replaced.has(name)) replaced.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
};
replace('document', { readyState: 'loading', addEventListener() {}, removeEventListener() {}, body: { style: {} } });
replace('window', {});
replace('performance', { now: () => now });
replace('navigator', { mediaDevices: { getUserMedia() { cameraCalls++; throw Error('Camera forbidden in this test'); } } });
replace('fetch', () => { networkCalls++; throw Error('Network forbidden in this test'); });
const completed = [];
const test = async (name, run) => {
  try { await run(); completed.push(name); }
  catch (error) { throw new Error(name, { cause: error }); }
};
const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const video = () => ({ readyState: 2, videoWidth: 1280, videoHeight: 720, currentTime: 0 });
const bitmap = () => ({ closes: 0, close() { this.closes++; } });
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

class FakeWorker {
  messages = [];
  postMessage(message) {
    if (message.type === 'init') queueMicrotask(() => this.reply({ type: 'ready' }));
    else this.messages.push(message);
  }
  reply(message) { this.onmessage({ data: message }); }
  terminate() { this.terminated = true; }
}
replace('Worker', FakeWorker);
replace('createImageBitmap', () => Promise.resolve(bitmap()));

try {
  const { ARTryOn } = await import('../assets/js/ar-tryon.js');
  const makeApp = () => {
    const app = new ARTryOn();
    app.video = video();
    app.ring = { visible: true };
    app.videoMetrics = () => ({ width: 1280, height: 720 });
    app.worldUnitsPerPixelAtZ = () => 1;
    app.detectInterval = 0;
    app.lastDetectMs = -Infinity;
    app.applied = [];
    for (const method of ['applyResult', 'applyResultBracelet', 'applyResultEarrings', 'applyResultNecklace']) {
      app[method] = function(result, timestamp) {
        this.applied.push({ method, timestamp, result });
        this._tgtPos.x = this.filtPx.filter(result.x ?? 0, timestamp);
        this._hasTarget = true;
        this.updatePoseVelocity(timestamp);
      };
    }
    return app;
  };
  const frameFor = (app, metadata = {}) => ({ ...app._frameClock.next(app.video, now, metadata), mirrored: app.isMirrored });
  const workingApp = async () => { const app = makeApp(); await app.startTrackingWorker(); return app; };

  await test('Source-media smoothing is invariant to callback delays over 180 frames', () => {
    const steadyClock = new VideoFrameClock(), jitterClock = new VideoFrameClock();
    const steadyFilter = new OneEuro(), jitterFilter = new OneEuro();
    for (let i = 0; i < 180; i++) {
      const mediaTime = i / 30;
      const frameA = steadyClock.next(video(), 1000 + mediaTime * 1000, { mediaTime });
      const frameB = jitterClock.next(video(), 1000 + mediaTime * 1000 + (i ? [0, 24, 5, 19][i % 4] : 0), { mediaTime });
      const value = Math.sin(mediaTime * 3) * 100;
      near(frameA.filterTimestamp, frameB.filterTimestamp);
      near(steadyFilter.filter(value, frameA.filterTimestamp), jitterFilter.filter(value, frameB.filterTimestamp));
    }
  });

  await test('Metadata identifies frames independently of currentTime; fallback deduplicates', () => {
    const clock = new VideoFrameClock(), v = video();
    v.currentTime = 99;
    assert.equal(clock.next(v, 1000, { mediaTime: 0 }).mediaTime, 0);
    assert.equal(clock.next(v, 1033, { mediaTime: 0 }), null);
    assert.equal(clock.next(v, 1066, { mediaTime: 1 / 30 }).mediaTime, 1 / 30);
    clock.reset();
    assert.equal(clock.next(v, 1100).mediaTime, 99);
    assert.equal(clock.next(v, 1133), null);
    clock.reset(); v.currentTime = 0;
    assert.equal(clock.next(v, 1200).filterTimestamp, 1200);
    v.videoWidth = 0;
    assert.equal(clock.next(v, 1233, { mediaTime: 1 }), null);
  });

  await test('Capture is optional and never inferred from callback/presentation clocks', () => {
    const sample = (meta) => new VideoFrameClock().next(video(), 1000, meta, 995);
    assert.equal(sample({}).timeBasis, 'sample');
    assert.equal(sample({ presentationTime: 980 }).captureTime, null);
    assert.equal(sample({ presentationTime: 980 }).sourceTime, 980);
    assert.equal(sample({ presentationTime: 980, captureTime: 950 }).timeBasis, 'capture');
    assert.equal(sample({ presentationTime: 980, captureTime: 990 }).captureTime, null);
    assert.equal(sample({ presentationTime: 1010, captureTime: -1 }).sourceTime, 1000);
    assert.equal(sample({}).callbackAt, 995);
  });

  await test('Freshness includes time before inference, with finite clock guards', () => {
    const frame = new VideoFrameClock().next(video(), 1000, { captureTime: 700 });
    assert.ok(frameIsFresh(frame, 1100));
    assert.ok(!frameIsFresh(frame, 1151));
    assert.ok(!frameIsFresh(frame, 999));
    assert.ok(!frameIsFresh(frame, NaN));
  });

  await test('All four placement paths receive media intervals and wall-clock prediction age', () => {
    for (const [piece, method] of [['Ring', 'applyResult'], ['Bracelet', 'applyResultBracelet'], ['Earrings', 'applyResultEarrings'], ['Necklace', 'applyResultNecklace']]) {
      const app = makeApp(); app.pieceType = piece;
      now = 1000;
      const first = frameFor(app, { mediaTime: 0, captureTime: 970 });
      now = 1020; app.applyTrackingResult({ x: 0 }, 20, first.sampledAt, first);
      now = 1080;
      const second = frameFor(app, { mediaTime: 1 / 30, captureTime: 1040 });
      now = 1100; app.applyTrackingResult({ x: 1 }, 20, second.sampledAt, second);
      assert.equal(app.applied.at(-1).method, method);
      near(app.applied[1].timestamp - app.applied[0].timestamp, 1000 / 30);
      assert.equal(app._lastDetectionTime, 1040);
      assert.equal(app._lastResultAt, 1040);
      assert.equal(app._applyingFrame, null);
      assert.equal(app._trackingTiming.last.turnaroundMs, 20);
    }
  });

  await test('Old, mismatched-resolution and mirrored results do not move jewellery', () => {
    const app = makeApp(); now = 1000;
    const frame = frameFor(app);
    now = 1451; app.applyTrackingResult({ x: 99 }, 10, frame.sampledAt, frame);
    assert.equal(app.applied.length, 0);
    now = 1100; app.video.videoWidth = 640;
    app.applyTrackingResult({ x: 99 }, 10, frame.sampledAt, frame);
    app.video.videoWidth = 1280; app.facingMode = 'environment';
    app.applyTrackingResult({ x: 99 }, 10, frame.sampledAt, frame);
    assert.equal(app.applied.length, 0);
    assert.equal(app._trackingTiming.droppedStale, 3);
  });

  await test('Frozen adjustment bypasses old filter clocks without fabricating timing samples', () => {
    const app = makeApp(); app._frozen = true;
    app.filtPx.filter(1, 999999);
    now = 2000; app.applyTrackingResult({ x: 42 });
    assert.equal(app._tgtPos.x, 42);
    assert.equal(app._trackingTiming.samples.length, 0);
    app.resetFrameSession(); app.resetTrackingFilters(); app._frozen = false;
    const frame = frameFor(app); now += 10;
    app.applyTrackingResult({ x: 50 }, 10, frame.sampledAt, frame);
    assert.equal(app._tgtPos.x, 50);
    assert.equal(app._velPx, 0);
  });

  await test('Main-thread fallback uses the same timing envelope and deduplication', () => {
    const app = makeApp(); now = 1000;
    app.handLandmarker = { detectForVideo(source, timestamp) {
      assert.equal(source, app.video); assert.equal(timestamp, 1000);
      now += 40; return { x: 1 };
    } };
    app.processVideoFrame(995, { mediaTime: 0, presentationTime: 980 });
    app.processVideoFrame(1040, { mediaTime: 0 });
    assert.equal(app.applied.length, 1);
    assert.equal(app._trackingTiming.last.turnaroundMs, 40);
    assert.equal(app._trackingTiming.last.inferenceMs, 40);
    assert.equal(app._lastDetectionTime, 980);
  });

  await test('Busy inference consumes neither a source frame nor the scheduling interval', async () => {
    const app = await workingApp(); const worker = app._trackingWorker;
    now = 1000; app.processVideoFrame(now, { mediaTime: 0 }); await flush();
    const first = worker.messages[0];
    now = 1033; app.processVideoFrame(now, { mediaTime: 1 / 30 });
    assert.equal(app._trackingTiming.skippedBusy, 1);
    assert.equal(app.lastDetectMs, 1000);
    worker.reply({ ...first, type: 'result', result: { x: 1 }, detectCost: 30 });
    app.processVideoFrame(now, { mediaTime: 1 / 30 }); await flush();
    assert.equal(worker.messages.length, 2);
    assert.equal(worker.messages[1].frame.mediaTime, 1 / 30);
  });

  await test('Rendering uses the post-inference clock in the animation-frame fallback', () => {
    const app = makeApp(); now = 1000;
    replace('requestAnimationFrame', () => 1);
    let renderedAt;
    app.renderer = { render() { renderedAt = now; }, info: { render: { calls: 1, triangles: 10 } }, getPixelRatio: () => 1 };
    app.handLandmarker = { detectForVideo() { now += 200; return {}; } };
    app.applyTrackingResult = () => {};
    app.updateContactVisuals = app.sampleVideoLighting = app.updateQualityReadout = () => {};
    app.loop();
    assert.equal(renderedAt, 1200);
    assert.equal(app._lastRafTime, 1200);
    assert.equal(app._renderTiming.last.cpuMs, 0, 'the 200ms inference is not mislabeled as CPU render time');
  });

  await test('A session reset cannot queue work behind an old in-flight result', async () => {
    const app = await workingApp(); const worker = app._trackingWorker;
    now = 1000; app.sendFrameToTrackingWorker(frameFor(app)); await flush();
    const first = worker.messages[0];
    app.resetFrameSession(); now = 1033;
    app.processVideoFrame(now, { mediaTime: 1 / 30 });
    assert.equal(worker.messages.length, 1);
    worker.reply({ ...first, type: 'result', result: { x: 99 } });
    assert.equal(app.applied.length, 0); assert.equal(app._trackingWorkerBusy, false);
    app.processVideoFrame(now, { mediaTime: 1 / 30 }); await flush();
    assert.equal(worker.messages.length, 2);
  });

  await test('Old-session errors free their own slot without triggering fallback', async () => {
    const app = await workingApp(); const worker = app._trackingWorker;
    let fallbacks = 0; app.fallbackToMainThreadTracking = () => fallbacks++;
    now = 1000; app.sendFrameToTrackingWorker(frameFor(app)); await flush();
    const first = worker.messages[0]; app.resetFrameSession();
    worker.reply({ ...first, type: 'error', phase: 'frame', message: 'old frame' });
    assert.equal(fallbacks, 0); assert.equal(app._trackingWorkerBusy, false);
  });

  await test('Unrelated worker responses cannot release the active slot', async () => {
    const app = await workingApp(); const worker = app._trackingWorker;
    now = 1000; app.sendFrameToTrackingWorker(frameFor(app)); await flush();
    const first = worker.messages[0];
    worker.reply({ ...first, type: 'result', frameId: first.frameId + 1, result: { x: 99 } });
    assert.equal(app._trackingWorkerBusy, true); assert.equal(app.applied.length, 0);
    worker.reply({ ...first, type: 'result', timestamp: -1, result: { x: 99 } });
    assert.equal(app._trackingWorkerBusy, false); assert.equal(app.applied.length, 0);
  });

  await test('Late snapshot resolution closes the obsolete image without posting it', async () => {
    const task = deferred(), image = bitmap(); replace('createImageBitmap', () => task.promise);
    const app = await workingApp(); const worker = app._trackingWorker;
    now = 1000; app.sendFrameToTrackingWorker(frameFor(app)); app.resetFrameSession();
    task.resolve(image); await flush();
    assert.equal(image.closes, 1); assert.equal(worker.messages.length, 0);
    assert.equal(app._trackingWorkerBusy, false);
  });

  await test('Late snapshot rejection cannot clear a replacement worker job or start fallback', async () => {
    const old = deferred(); replace('createImageBitmap', () => old.promise);
    const app = await workingApp(); let fallbacks = 0; app.fallbackToMainThreadTracking = () => fallbacks++;
    now = 1000; app.sendFrameToTrackingWorker(frameFor(app));
    app._trackingWorkerReady = false; app._trackingWorker.terminate();
    await app.startTrackingWorker();
    replace('createImageBitmap', () => Promise.resolve(bitmap()));
    app.resetFrameSession(); now = 1033; app.sendFrameToTrackingWorker(frameFor(app)); await flush();
    const active = app._pendingTrackingFrame;
    old.reject(Error('obsolete snapshot failure')); await flush();
    assert.equal(fallbacks, 0); assert.equal(app._pendingTrackingFrame, active);
    assert.equal(app._trackingWorkerBusy, true);
  });

  await test('A stalled image conversion expires before worker inference', async () => {
    const task = deferred(), image = bitmap(); replace('createImageBitmap', () => task.promise);
    const app = await workingApp(); now = 1000; app.sendFrameToTrackingWorker(frameFor(app));
    now = 1451; task.resolve(image); await flush();
    assert.equal(image.closes, 1); assert.equal(app._trackingWorker.messages.length, 0);
    assert.equal(app._trackingTiming.droppedStale, 1); assert.equal(app._trackingWorkerBusy, false);
  });

  await test('Synchronous snapshot failure is recoverable and releases ownership', async () => {
    const app = await workingApp(); let fallbacks = 0; app.fallbackToMainThreadTracking = () => fallbacks++;
    replace('createImageBitmap', () => { throw Error('snapshot failed'); });
    const warn = console.warn; console.warn = () => {};
    try { now = 1000; app.sendFrameToTrackingWorker(frameFor(app)); } finally { console.warn = warn; }
    assert.equal(fallbacks, 1); assert.equal(app._pendingTrackingFrame, null); assert.equal(app._trackingWorkerBusy, false);
  });

  await test('Failed transfer closes the image and recovers once', async () => {
    const image = bitmap(); replace('createImageBitmap', () => Promise.resolve(image));
    const app = await workingApp(); let fallbacks = 0; app.fallbackToMainThreadTracking = () => fallbacks++;
    app._trackingWorker.postMessage = () => { throw Error('transfer failed'); };
    const warn = console.warn; console.warn = () => {};
    try { now = 1000; app.sendFrameToTrackingWorker(frameFor(app)); await flush(); } finally { console.warn = warn; }
    assert.equal(image.closes, 1); assert.equal(fallbacks, 1); assert.equal(app._trackingWorkerBusy, false);
  });

  await test('Closing while a snapshot is pending cannot restart tracking', async () => {
    const task = deferred(); replace('createImageBitmap', () => task.promise);
    const app = await workingApp(); let fallbacks = 0; app.fallbackToMainThreadTracking = () => fallbacks++;
    const worker = app._trackingWorker;
    now = 1000; app.sendFrameToTrackingWorker(frameFor(app)); app.close();
    task.reject(Error('late close failure')); await flush();
    assert.equal(fallbacks, 0); assert.equal(worker.terminated, true); assert.equal(app._pendingTrackingFrame, null);
  });

  await test('Diagnostics have a bounded window and distinguish turnaround from inference', () => {
    const timing = new TrackingTiming();
    for (let i = 0; i < 130; i++) {
      const frame = new VideoFrameClock().next(video(), 1000 + i * 100);
      timing.record(frame, frame.sampledAt + i, 10);
    }
    assert.equal(timing.samples.length, 120);
    assert.equal(timing.last.turnaroundMs, 129);
    assert.match(timing.describe(14000), /10 ms inference.*129 ms turnaround.*n=120/);
    assert.match(timing.describe(14000, true), /frozen frame/);
    timing.reset(); assert.equal(timing.last, null); assert.equal(timing.samples.length, 0);
  });

  await test('Real worker handler preserves frame identity on success, errors and zero timestamps', async () => {
    const output = [], detected = [];
    const context = vm.createContext({
      self: { postMessage: message => output.push(message) },
      performance: { now: () => 900000 },
      fakeTracker: { detectForVideo(image, time) { detected.push(time); return { landmarks: [[{ x: 0.1, y: 0.2, z: 0.3, visibility: 0.7 }]], worldLandmarks: [], handedness: [[{ categoryName: 'Right', score: 0.9 }]] }; } }
    });
    vm.runInContext(await readFile(new URL('../assets/js/ar-tracking-worker.js', import.meta.url), 'utf8'), context);
    let image = bitmap();
    await context.self.onmessage({ data: { type: 'frame', bitmap: image, frameId: 3, generation: 2, timestamp: 0 } });
    assert.equal(output.at(-1).phase, 'frame'); assert.equal(output.at(-1).frameId, 3);
    assert.equal(output.at(-1).generation, 2); assert.equal(output.at(-1).timestamp, 0); assert.equal(image.closes, 1);
    vm.runInContext('tracker = fakeTracker; initialized = true;', context);
    image = bitmap();
    await context.self.onmessage({ data: { type: 'frame', bitmap: image, frameId: 4, generation: 2, timestamp: 0 } });
    assert.equal(output.at(-1).type, 'result'); assert.equal(detected[0], 0); assert.equal(image.closes, 1);
    assert.equal(output.at(-1).result.handedness[0][0].categoryName, 'Right');
    assert.equal(output.at(-1).result.landmarks[0][0].visibility, 0.7);
    image = bitmap();
    await context.self.onmessage({ data: { type: 'frame', bitmap: image, frameId: 5, generation: 2, timestamp: NaN } });
    assert.equal(output.at(-1).type, 'error'); assert.equal(image.closes, 1); assert.equal(detected.length, 1);
  });

  assert.equal(cameraCalls, 0); assert.equal(networkCalls, 0);
  console.log(JSON.stringify({ passed: completed.length, replayFrames: 180, placementTypes: 4, cameraCalls, networkCalls, methods: 'Real controller/filter/worker code; synthetic data and controlled async failures' }));
} finally {
  for (const [name, descriptor] of replaced) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
}
