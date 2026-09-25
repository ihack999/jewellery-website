/**
 * MediaPipe tracking worker for jewellery AR.
 *
 * The main thread owns camera display, UI, Three.js and pose interpolation.
 * This worker owns synchronous MediaPipe `detectForVideo()` calls so an
 * inference spike cannot freeze the camera overlay or calibration controls.
 */

// MediaPipe loads its WASM glue with importScripts(), which throws inside
// module workers. Provide a synchronous equivalent so inference really runs
// off the main thread (previously every session silently fell back to the
// main thread, competing with rendering).
try { self.importScripts("data:text/javascript,"); } catch {
  self.importScripts = (...urls) => {
    for (const url of urls) {
      const request = new XMLHttpRequest();
      request.open("GET", String(url), false);
      request.send();
      if (request.status >= 400) throw new Error(`Could not load ${url} (${request.status})`);
      (0, eval)(`${request.responseText}\n//# sourceURL=${url}`);
    }
  };
}

let tracker = null;
let mode = "hand";
let initialized = false;
let trackerSession = 0;
let forearmTracker = null;
let forearmObservation = null;
let forearmGeneration = null;
let forearmNextAt = -Infinity;
let hairSegmenter = null;
let hairNextAt = -Infinity;

function resetHair() {
  hairSegmenter?.close?.(); hairSegmenter = null; hairNextAt = -Infinity;
}

// Low-rate hair segmentation for earrings/necklaces (hair in front of the
// jewellery). Runs every ~120–400 ms depending on its own cost, never when
// the primary tracker is already slow, and downsamples the mask for transfer.
function sampleHair(bitmap, message, primaryCost) {
  if (!hairSegmenter || primaryCost > 60 || message.timestamp < hairNextAt) return null;
  const started = performance.now();
  let output = null;
  try {
    const result = hairSegmenter.segmentForVideo(bitmap, message.timestamp);
    const masks = result?.confidenceMasks || [];
    const mask = masks[masks.length - 1];
    if (mask) {
      const source = mask.getAsFloat32Array();
      const step = Math.max(1, Math.ceil(mask.width / 192));
      const width = Math.floor(mask.width / step), height = Math.floor(mask.height / step);
      const data = new Uint8Array(width * height);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) data[y * width + x] = Math.round(Math.min(1, Math.max(0, source[(y * step) * mask.width + x * step])) * 255);
      }
      output = { width, height, data, timestamp: message.timestamp };
    }
    result?.close?.();
  } catch {
    resetHair(); // optional feature: never interrupt tracking
  }
  const cost = performance.now() - started;
  hairNextAt = message.timestamp + Math.max(120, Math.min(400, cost * 5));
  return output;
}

function resetForearm() {
  forearmTracker?.close?.(); forearmTracker = null;
  forearmObservation = null; forearmGeneration = null; forearmNextAt = -Infinity;
}

function sampleForearm(bitmap, message, hasHands, handCost) {
  if (message.generation !== forearmGeneration) {
    forearmObservation = null; forearmNextAt = -Infinity; forearmGeneration = message.generation;
  }
  // Never queue a second bitmap or run this auxiliary model on the main
  // thread. Its cost is included in the existing result/age diagnostics.
  if (forearmTracker && hasHands && handCost < 45 && message.timestamp >= forearmNextAt) {
    const started = performance.now();
    try {
      const pose = forearmTracker.detectForVideo(bitmap, message.timestamp);
      forearmObservation = { landmarks: cloneLandmarkGroups(pose?.landmarks),
        worldLandmarks: cloneLandmarkGroups(pose?.worldLandmarks), timestamp: message.timestamp };
    } catch {
      // Losing the auxiliary task must not interrupt precise hand tracking.
      resetForearm();
    }
    const cost = performance.now() - started;
    forearmNextAt = message.timestamp + Math.max(220, Math.min(1500, cost * 6));
  }
  const age = message.timestamp - (forearmObservation?.timestamp ?? -Infinity);
  if (!hasHands || age < 0 || age >= 350) return null;
  return { landmarks: forearmObservation.landmarks, worldLandmarks: forearmObservation.worldLandmarks, ageMs: age };
}

function clonePoint(point) {
  if (!point) return null;
  const output = {
    x: Number.isFinite(point.x) ? point.x : NaN,
    y: Number.isFinite(point.y) ? point.y : NaN,
    z: Number.isFinite(point.z) ? point.z : NaN
  };
  if (point.visibility !== undefined) output.visibility = Number(point.visibility);
  if (point.presence !== undefined) output.presence = Number(point.presence);
  return output;
}

function cloneLandmarkGroups(groups) {
  if (!Array.isArray(groups)) return [];
  return groups.map((group) => Array.isArray(group) ? group.map(clonePoint) : []);
}

function cloneMatrices(matrices) {
  if (!Array.isArray(matrices)) return [];
  return matrices.map((matrix) => {
    const data = matrix?.data || matrix;
    return { data: data ? Array.from(data) : [] };
  });
}

function serializeResult(result) {
  if (mode === "face") {
    return {
      faceLandmarks: cloneLandmarkGroups(result?.faceLandmarks),
      facialTransformationMatrixes: cloneMatrices(result?.facialTransformationMatrixes)
    };
  }

  return {
    landmarks: cloneLandmarkGroups(result?.landmarks),
    worldLandmarks: cloneLandmarkGroups(result?.worldLandmarks),
    handedness: (result?.handedness || result?.handednesses || []).map((categories) => categories.map((category) => ({
      categoryName: category.categoryName, score: category.score
    })))
  };
}

async function createTracker(config, session) {
  const vision = await import(/* @vite-ignore */ `${config.mediaPipeBase}/vision_bundle.mjs`);
  const fileset = await vision.FilesetResolver.forVisionTasks(config.wasmBase);
  const requestedMode = config.mode;

  // CPU is intentional here. Inference is isolated from rendering, while the
  // Three.js context remains the sole high-priority GPU client on mobile.
  const baseOptions = (modelAssetPath) => ({ modelAssetPath, delegate: "CPU" });

  if ((requestedMode === "face" || requestedMode === "pose") && config.hairModelUrl && session === trackerSession) {
    Promise.resolve().then(() => vision.ImageSegmenter.createFromOptions(fileset, {
      baseOptions: baseOptions(config.hairModelUrl), runningMode: "VIDEO",
      outputCategoryMask: false, outputConfidenceMasks: true
    })).then((segmenter) => {
      if (session !== trackerSession) segmenter.close();
      else hairSegmenter = segmenter;
    }).catch(() => { /* hair occlusion is optional */ });
  }

  if (requestedMode === "face") {
    return vision.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: baseOptions(config.faceModelUrl),
      runningMode: "VIDEO",
      numFaces: 1,
      outputFacialTransformationMatrixes: true,
      outputFaceBlendshapes: false,
      minFaceDetectionConfidence: 0.50,
      minFacePresenceConfidence: 0.50,
      minTrackingConfidence: 0.50
    });
  }

  if (requestedMode === "pose") {
    return vision.PoseLandmarker.createFromOptions(fileset, {
      baseOptions: baseOptions(config.poseModelUrl),
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.50,
      minPosePresenceConfidence: 0.50,
      minTrackingConfidence: 0.50
    });
  }

  const hand = await vision.HandLandmarker.createFromOptions(fileset, {
    baseOptions: baseOptions(config.handModelUrl),
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.50,
    minHandPresenceConfidence: 0.50,
    minTrackingConfidence: 0.50
  });
  if (config.trackForearm && session === trackerSession) {
    // Start hand tracking immediately. The optional elbow/wrist observer may
    // load later or fail; neither condition changes the primary tracker.
    Promise.resolve().then(() => vision.PoseLandmarker.createFromOptions(fileset, {
      baseOptions: baseOptions(config.forearmModelUrl), runningMode: "VIDEO", numPoses: 1,
      minPoseDetectionConfidence: .6, minPosePresenceConfidence: .6, minTrackingConfidence: .6,
      outputSegmentationMasks: false
    })).then((pose) => {
      if (session !== trackerSession) pose.close();
      else forearmTracker = pose;
    }).catch(() => { /* Hand-only fitting remains available. */ });
  }
  return hand;
}

self.onmessage = async (event) => {
  const message = event.data || {};

  if (message.type === "init") {
    const session = ++trackerSession;
    initialized = false;
    resetForearm();
    resetHair();
    mode = message.config.mode;
    try {
      tracker?.close?.();
      tracker = null;
      let next;
      try {
        next = await createTracker(message.config, session);
      } catch (localError) {
        // Self-hosted runtime/models missing from this deployment: retry the
        // official MediaPipe hosts before giving up.
        if (!message.config.fallback || session !== trackerSession) throw localError;
        next = await createTracker({ ...message.config, ...message.config.fallback, fallback: null }, session);
      }
      if (session !== trackerSession) { next.close(); return; }
      tracker = next;
      initialized = true;
      self.postMessage({ type: "ready", mode });
    } catch (error) {
      if (session !== trackerSession) return;
      initialized = false;
      self.postMessage({
        type: "error",
        phase: "init",
        message: error?.message || String(error)
      });
    }
    return;
  }

  if (message.type === "frame") {
    const bitmap = message.bitmap;
    if (!initialized || !tracker || !bitmap) {
      bitmap?.close?.();
      self.postMessage({
        type: "error",
        phase: "frame",
        message: "Tracking worker received a frame before initialization.",
        frameId: message.frameId,
        timestamp: message.timestamp,
        generation: message.generation
      });
      return;
    }

    const startedAt = performance.now();
    try {
      if (!Number.isFinite(message.timestamp)) throw new Error("Tracking frame requires a finite sample timestamp.");
      const result = tracker.detectForVideo(bitmap, message.timestamp);
      const serialized = serializeResult(result);
      if (mode === "hand") serialized.forearmPose = sampleForearm(bitmap, message, serialized.landmarks.length > 0, performance.now() - startedAt);
      const hairMask = mode !== "hand" ? sampleHair(bitmap, message, performance.now() - startedAt) : null;
      self.postMessage({
        type: "result",
        result: serialized,
        hairMask,
        detectCost: performance.now() - startedAt,
        frameId: message.frameId,
        timestamp: message.timestamp,
        generation: message.generation
      }, hairMask ? [hairMask.data.buffer] : []);
    } catch (error) {
      self.postMessage({
        type: "error",
        phase: "frame",
        message: error?.message || String(error),
        frameId: message.frameId,
        timestamp: message.timestamp,
        generation: message.generation
      });
    } finally {
      bitmap.close?.();
    }
    return;
  }

  if (message.type === "close") {
    trackerSession++;
    resetForearm();
    resetHair();
    tracker?.close?.();
    tracker = null;
    initialized = false;
    self.close();
  }
};
