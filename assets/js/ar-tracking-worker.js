/**
 * MediaPipe tracking worker for jewellery AR.
 *
 * The main thread owns camera display, UI, Three.js and pose interpolation.
 * This worker owns synchronous MediaPipe `detectForVideo()` calls so an
 * inference spike cannot freeze the camera overlay or calibration controls.
 */

let tracker = null;
let mode = "hand";
let initialized = false;

function clonePoint(point) {
  if (!point) return null;
  const output = {
    x: Number(point.x) || 0,
    y: Number(point.y) || 0,
    z: Number(point.z) || 0
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
    worldLandmarks: cloneLandmarkGroups(result?.worldLandmarks)
  };
}

async function createTracker(config) {
  const vision = await import(/* @vite-ignore */ `${config.mediaPipeBase}/vision_bundle.mjs`);
  const fileset = await vision.FilesetResolver.forVisionTasks(config.wasmBase);
  mode = config.mode;

  // CPU is intentional here. Inference is isolated from rendering, while the
  // Three.js context remains the sole high-priority GPU client on mobile.
  const baseOptions = (modelAssetPath) => ({ modelAssetPath, delegate: "CPU" });

  if (mode === "face") {
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

  if (mode === "pose") {
    return vision.PoseLandmarker.createFromOptions(fileset, {
      baseOptions: baseOptions(config.poseModelUrl),
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.50,
      minPosePresenceConfidence: 0.50,
      minTrackingConfidence: 0.50
    });
  }

  return vision.HandLandmarker.createFromOptions(fileset, {
    baseOptions: baseOptions(config.handModelUrl),
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.50,
    minHandPresenceConfidence: 0.50,
    minTrackingConfidence: 0.50
  });
}

self.onmessage = async (event) => {
  const message = event.data || {};

  if (message.type === "init") {
    try {
      tracker?.close?.();
      tracker = await createTracker(message.config);
      initialized = true;
      self.postMessage({ type: "ready", mode });
    } catch (error) {
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
        message: "Tracking worker received a frame before initialization."
      });
      return;
    }

    const startedAt = performance.now();
    try {
      const result = tracker.detectForVideo(bitmap, Number(message.timestamp) || performance.now());
      const serialized = serializeResult(result);
      self.postMessage({
        type: "result",
        result: serialized,
        detectCost: performance.now() - startedAt,
        frameId: message.frameId
      });
    } catch (error) {
      self.postMessage({
        type: "error",
        phase: "frame",
        message: error?.message || String(error),
        frameId: message.frameId
      });
    } finally {
      bitmap.close?.();
    }
    return;
  }

  if (message.type === "close") {
    tracker?.close?.();
    tracker = null;
    initialized = false;
    self.close();
  }
};
