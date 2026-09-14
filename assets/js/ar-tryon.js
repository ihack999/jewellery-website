import * as THREE from "./three.module.js";
import { RGBELoader } from "./RGBELoader.js";
import { AppearanceLighting, cameraProbeRegion, measureCameraAppearance, applyAppearanceLighting } from "./ar/appearance-lighting.js?v=20260912-ar-lighting";
import { RenderTiming } from "./ar/render-timing.js?v=20260912-ar-render";
import { createWearableAsset } from "./ar/wearable-asset.js?v=20260912-ar-render";
import { configureWearableGemOptics } from "./ar/gem-optics.js?v=20260911-ar-live2";
import { disposeGemRayMaterial } from "./gem-ray-material.js?v=20260911-ar-live2";
import { weightedCenter, shoulderProjection, palmScale } from "./ar/body-fit.js?v=20260911-ar-live3";
import { OneEuro, predictionSeconds } from "./ar/pose-filter.js?v=20260911-ar-live3";
import { createFaceOccluder, updateFaceOccluder, earFacingVisible, updateEarOpenings } from "./ar/face-occlusion.js?v=20260911-ar-live3";
import { HandIdentity, TrackingFrameGate, estimateHandRoll, handLandmarkValidity } from "./ar/tracking.js?v=20260911-ar-live3";
import { VideoFrameClock, TrackingTiming, frameIsFresh, MAX_TRACKING_AGE_MS } from "./ar/frame-timing.js?v=20260912-ar-timing";
import { FingerContactBody, fingerContactWeight } from "./ar/finger-contact.js?v=20260912-ar-contact";
import { torsoFrame, neckPlacementOffset } from "./ar/torso-fit.js?v=20260912-ar-torso-wrist";
import { WristContactBody, rigidWristSeat, wristOrientation } from "./ar/wrist-contact.js?v=20260912-ar-torso-wrist";
import { observeForearm, fitForearmOrientation } from "./ar/forearm-fit.js?v=20260912-ar-placement";
import { NeckContactBody, neckOrientation, neckContactWeight } from "./ar/neck-contact.js?v=20260912-ar-placement";
import { WearableArticulation } from "./ar/articulation.js?v=20260911-ar-v1";
import { CameraTexture } from "./ar/camera-texture.js?v=20260911-ar-v1";
import {
  METERS_PER_MM
} from "./jewellery-spec.js?v=20260911-construction-v32";

const HDR_URL = "assets/textures/studio_small_08_1k.hdr";

const TRIGGER_SELECTOR = "[data-ar-tryon]";
const STATE_KEY = "tj-custom-design-state";
const CALIBRATION_KEY = "tj-ar-tryon-calibration-v1";
const TARGET_DETECTION_FPS = 30;
const MIN_DETECTION_FPS = 16;
const MAX_DETECTION_FPS = 42;
const MAX_PIXEL_RATIO = 1.5;

const MEDIAPIPE_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const WASM_BASE = `${MEDIAPIPE_BASE}/wasm`;
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const FOREARM_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const FACE_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const POSE_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";

const FACE_EAR_RIGHT = 234;
const FACE_EAR_LEFT = 454;
const FACE_LOWER_RIGHT = 132;
const FACE_LOWER_LEFT = 361;
const EARLOBE_DROP_RATIO = 0.10;
const EAR_SPAN_M = 0.150;
const SHOULDER_SPAN_M = 0.365;

/* MediaPipe Pose Landmarker body landmarks (33-point model).
 *   0  = nose
 *   7  = left ear
 *   8  = right ear
 *   9  = mouth left
 *  10  = mouth right
 *  11  = left shoulder  (wearer's left)
 *  12  = right shoulder (wearer's right)
 *  23  = left hip
 *  24  = right hip
 * The necklace anchors at the suprasternal notch — the clavicle hollow
 * just below the throat. Its height above the shoulder midpoint remains
 * an adjustable estimate, not a detected anatomical landmark. */
const POSE_LEFT_SHOULDER = 11;
const POSE_RIGHT_SHOULDER = 12;
const POSE_NOSE = 0;
const POSE_LEFT_EAR = 7;
const POSE_RIGHT_EAR = 8;
const POSE_MOUTH_LEFT = 9;
const POSE_MOUTH_RIGHT = 10;
const POSE_LEFT_HIP = 23;
const POSE_RIGHT_HIP = 24;
const NECKLACE_MIN_SHOULDER_PX = 118;
const NECKLACE_CONTACT_SHADOW_OPACITY = 0.36;
// MediaPipe landmark indices we care about.
// 0=wrist, 5=index MCP, 9=middle MCP, 13=ring MCP, 14=ring PIP, 17=pinky MCP
const RING_MCP = 13;
const RING_PIP = 14;
const INDEX_MCP = 5;
const PINKY_MCP = 17;

// Fallback finger-width priors relative to the index–pinky knuckle span.
// A manual hand width improves the scale reference, but these ratios still
// cannot measure the wearer's finger diameter or establish ring-size accuracy.
const FINGER_DIAMETER_RATIO = {
  index:  0.205,
  middle: 0.220,
  ring:   0.200,
  pinky:  0.165
};

// §5 contact fit: where a ring naturally rests on the proximal phalanx,
// expressed as t along MCP→PIP. Closer to MCP than the midpoint keeps the
// band at the finger base instead of drifting toward the knuckle.
const FINGER_RING_SEAT_T = {
  index:  0.38,
  middle: 0.36,
  ring:   0.34,
  pinky:  0.32
};

// Uncalibrated wrist-width prior. The optional manual wrist reference takes
// precedence; this ratio is not a measured property of the wearer.
const WRIST_DIAMETER_RATIO = 0.62;
const BRACELET_WALL_THICKNESS_M = 0.0021;
const BRACELET_CONTACT_CLEARANCE_M = 0.0014;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / Math.max(1e-6, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function landmarkPresence(point) {
  if (!point || ![point.x, point.y, point.z].every(Number.isFinite)) return 0;
  const presence = Number(point.visibility ?? point.presence ?? 1);
  return Number.isFinite(presence) ? clamp(presence, 0, 1) : 0;
}

function readCalibration() {
  const defaults = {
    fit: 1,
    lift: 0,
    side: 0,
    roll: 0,
    fovUser: 50,
    fovEnvironment: 58,
    earDrop: 0,
    earSpan: 1,
    neckHeightMm: 40,
    neckHeightAuto: true,
    neckBaseOffsetMm: { x: 0, y: 0 },
    facingMode: "user"
  };
  try {
    const raw = JSON.parse(localStorage.getItem(CALIBRATION_KEY) || "{}");
    return {
      fit: clamp(Number(raw.fit) || defaults.fit, 0.78, 1.26),
      lift: clamp(Number(raw.lift) || defaults.lift, -48, 48),
      side: clamp(Number(raw.side) || defaults.side, -48, 48),
      roll: clamp(Number(raw.roll) || defaults.roll, -35, 35),
      // Browser camera APIs do not expose reliable intrinsics on every phone.
      // Persist a per-facing-mode vertical FOV calibration rather than baking
      // one device-independent number into the perspective projection.
      fovUser: clamp(Number(raw.fovUser) || defaults.fovUser, 38, 76),
      fovEnvironment: clamp(Number(raw.fovEnvironment) || defaults.fovEnvironment, 42, 88),
      // Face Landmarker exposes ear-adjacent points, not the piercing itself.
      // These two saved controls let the wearer calibrate the inferred lobe
      // drop and inter-piercing span once, then reuse it on later sessions.
      earDrop: clamp(Number(raw.earDrop) || defaults.earDrop, -40, 40),
      earSpan: clamp(Number(raw.earSpan) || defaults.earSpan, 0.82, 1.18),
      neckHeightMm: Number.isFinite(raw.neckHeightMm) ? clamp(raw.neckHeightMm, 0, 90) : defaults.neckHeightMm,
      neckHeightAuto: typeof raw.neckHeightAuto === "boolean" ? raw.neckHeightAuto : !Number.isFinite(raw.neckHeightMm),
      neckBaseOffsetMm: {
        x: clamp(Number(raw.neckBaseOffsetMm?.x) || 0, -100, 100),
        y: clamp(Number(raw.neckBaseOffsetMm?.y) || 0, -120, 120)
      },
      earOffsets: Object.fromEntries(["Left", "Right"].map((side) => [side,
        [0, 1, 2].map((index) => clamp(Number(raw.earOffsets?.[side]?.[index]) || 0, -0.02, 0.02))
      ])),
      facingMode: raw.facingMode === "environment" ? "environment" : "user"
    };
  } catch {
    return defaults;
  }
}

function writeCalibration(calibration) {
  try {
    localStorage.setItem(CALIBRATION_KEY, JSON.stringify(calibration));
  } catch {
    // Calibration is a convenience. AR should still work if storage is blocked.
  }
}

function disposeObjectTree(object) {
  const geometries = new Set(), materials = new Set();
  object?.traverse?.((node) => {
    disposeGemRayMaterial(node);
    if (node.geometry) geometries.add(node.geometry);
    if (node.isInstancedMesh) node.dispose();

    for (const material of [node.material].flat().filter(Boolean)) materials.add(material);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}

/* Build the soft-shadow texture once and cache it. A 256² radial gradient
 * with the alpha falling off cubically — gives a believable contact-shadow
 * penumbra rather than the linear halo that a default radial gradient
 * produces. Cached at module scope so multiple sessions reuse one upload. */
let _shadowTexCache = null;
function makeShadowTexture() {
  if (_shadowTexCache) return _shadowTexCache;
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(size, size);
  const cx = size / 2, cy = size / 2, rMax = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - cx) / rMax;
      const dy = (y - cy) / rMax;
      const d = Math.min(1, Math.hypot(dx, dy));
      // Cubic falloff: alpha ≈ (1−d)³ — soft core, gentle penumbra, hard 0 at edge.
      const a = Math.pow(1 - d, 3);
      const i = (y * size + x) * 4;
      img.data[i] = 0;
      img.data[i + 1] = 0;
      img.data[i + 2] = 0;
      img.data[i + 3] = Math.round(a * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  _shadowTexCache = tex;
  return tex;
}


function readDesignState() {
  try {
    if (window.__tjcDesigner?.getState) return window.__tjcDesigner.getState();
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function injectStyles() {
  if (document.getElementById("ar-tryon-styles")) return;
  const style = document.createElement("style");
  style.id = "ar-tryon-styles";
  style.textContent = `
    .ar-tryon-modal {
      position: fixed; inset: 0; z-index: 9999;
      background: #000;
      display: flex; flex-direction: column;
      align-items: stretch; justify-content: center;
      animation: ar-fade-in 200ms ease-out;
      font-family: system-ui, sans-serif;
    }
    @keyframes ar-fade-in { from { opacity: 0; } to { opacity: 1; } }
    .ar-tryon-stage {
      position: relative; flex: 1 1 auto;
      width: 100%; overflow: hidden;
      background: #0a0a0a;
    }
    .ar-tryon-modal [hidden] { display: none !important; }
    .ar-tryon-toolbar { max-width: calc(100% - 24px); flex-wrap: wrap; justify-content: flex-end; }
    .ar-tryon-video,
    .ar-tryon-canvas {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      object-fit: cover;
    }
    /* Mirror the video for a selfie experience. The three.js overlay is NOT
       css-mirrored — we mirror landmark X in JS, which keeps the 3D ring's
       rotation/depth math consistent with what the user sees. */
    .ar-tryon-video { transform: scaleX(-1); }
    .ar-tryon-modal.is-world-camera .ar-tryon-video { transform: none; }
    .ar-tryon-canvas { pointer-events: none; }
    .ar-tryon-status {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      color: #fff;
      font: 500 14px/1.5 system-ui, -apple-system, sans-serif;
      text-align: center;
      padding: 18px 24px;
      background: rgba(0,0,0,0.55);
      border-radius: 12px;
      backdrop-filter: blur(8px);
      max-width: 360px;
      pointer-events: none;
    }
    .ar-tryon-status.is-hidden { display: none; }
    .ar-tryon-hint {
      position: absolute;
      bottom: 18px; left: 50%;
      transform: translateX(-50%);
      color: #fff;
      font: 500 13px/1.4 system-ui, sans-serif;
      padding: 10px 16px;
      background: rgba(0,0,0,0.5);
      border-radius: 999px;
      backdrop-filter: blur(8px);
      letter-spacing: 0.02em;
      white-space: nowrap;
    }
    .ar-tryon-toolbar {
      position: absolute;
      top: 16px; right: 16px;
      display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px;
      z-index: 2;
      max-width: min(520px, calc(100vw - 32px));
    }
    .ar-tryon-btn {
      appearance: none;
      border: 1px solid rgba(255,255,255,0.25);
      background: rgba(0,0,0,0.5);
      color: #fff;
      font: 500 13px/1 system-ui, sans-serif;
      padding: 10px 16px;
      border-radius: 999px;
      cursor: pointer;
      backdrop-filter: blur(8px);
      transition: background 120ms, border-color 120ms;
    }
    .ar-tryon-btn:hover { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.45); }
    .ar-tryon-calibration {
      position: absolute;
      left: 50%;
      bottom: 112px;
      z-index: 2;
      transform: translateX(-50%);
	      display: grid;
	      grid-template-columns: repeat(5, minmax(88px, 1fr)) auto;
      gap: 8px;
      width: min(720px, calc(100vw - 28px));
      padding: 8px;
      border: 1px solid rgba(255,255,255,0.16);
      border-radius: 16px;
      background: rgba(0,0,0,0.48);
      color: #fff;
      backdrop-filter: blur(12px);
      box-shadow: 0 18px 60px rgba(0,0,0,0.24);
    }
    .ar-tryon-calibration { max-height: 42vh; overflow-y: auto; }
    .ar-tryon-calibration [hidden] { display: none !important; }
    .ar-wearable-options { grid-column: 1 / -1; font-size: 12px; }
    .ar-wearable-options summary { padding: 8px; cursor: pointer; }
    .ar-wearable-options[open] { display: grid; gap: 12px; }
    .ar-wearable-options p { line-height: 1.5; margin: 0; }
    .ar-wearable-options input, .ar-wearable-options select { min-height: 32px; max-width: 100%; }
    .ar-wearable-options input[type="checkbox"] { width: 18px; height: 18px; min-height: 18px; }
    .ar-wearable-options label:has(input[type="checkbox"]) { display: flex; align-items: center; }
    .ar-tryon-btn:focus-visible, .ar-tryon-calibration :focus-visible { outline: 2px solid #ead8a6; outline-offset: 3px; }
    @media (prefers-reduced-motion: reduce) { .ar-tryon-modal { animation: none; } }
    .ar-tryon-calibration label {
      display: grid;
      gap: 4px;
      min-width: 0;
      font: 600 10px/1.1 system-ui, -apple-system, sans-serif;
      letter-spacing: 0.11em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.72);
    }
    .ar-tryon-calibration output {
      color: #fff;
      font-size: 11px;
      letter-spacing: 0;
      text-transform: none;
      font-variant-numeric: tabular-nums;
    }
    .ar-tryon-calibration input[type="range"] {
      width: 100%;
      accent-color: #fff;
    }
    .ar-tryon-reset {
      align-self: end;
      min-height: 34px;
      padding-inline: 12px;
      font-size: 11px;
    }
    .ar-tryon-finger-select {
      position: absolute;
      bottom: 64px; left: 50%;
      transform: translateX(-50%);
      display: flex; gap: 6px;
      background: rgba(0,0,0,0.5);
      padding: 6px;
      border-radius: 999px;
      backdrop-filter: blur(8px);
    }
    .ar-tryon-finger-select button {
      appearance: none;
      border: none;
      background: transparent;
      color: rgba(255,255,255,0.7);
      font: 500 12px/1 system-ui, sans-serif;
      padding: 8px 14px;
      border-radius: 999px;
      cursor: pointer;
      letter-spacing: 0.02em;
    }
    .ar-tryon-finger-select button.is-active {
      background: #fff;
      color: #111;
    }
    .ar-tryon-size {
      position: absolute;
      top: 16px; left: 16px;
      display: flex; flex-direction: column; align-items: flex-start;
      gap: 2px;
      padding: 10px 14px;
      background: rgba(0,0,0,0.55);
      color: #fff;
      border-radius: 12px;
      backdrop-filter: blur(8px);
      font-family: system-ui, -apple-system, sans-serif;
      pointer-events: none;
      z-index: 2;
      min-width: 132px;
    }
    .ar-tryon-size-label {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.7);
    }
    .ar-tryon-size-value {
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 0.01em;
      font-variant-numeric: tabular-nums;
    }
	    .ar-tryon-size-sub {
	      font-size: 11px;
	      color: rgba(255,255,255,0.75);
	      font-variant-numeric: tabular-nums;
	    }
	    .ar-tryon-quality {
	      position: absolute;
	      top: 94px; left: 16px;
	      z-index: 2;
	      display: grid;
	      grid-template-columns: auto auto;
	      gap: 6px 10px;
	      min-width: 132px;
	      padding: 10px 14px 12px;
	      border: 1px solid rgba(255,255,255,0.14);
	      border-radius: 12px;
	      background: rgba(0,0,0,0.50);
	      color: #fff;
	      backdrop-filter: blur(8px);
	      pointer-events: none;
	      font-family: system-ui, -apple-system, sans-serif;
	    }
	    .ar-tryon-quality[hidden] { display: none; }
	    .ar-tryon-quality span {
	      font-size: 10px;
	      font-weight: 600;
	      letter-spacing: 0.12em;
	      text-transform: uppercase;
	      color: rgba(255,255,255,0.68);
	    }
	    .ar-tryon-quality b {
	      justify-self: end;
	      font-size: 12px;
	      font-weight: 700;
	      font-variant-numeric: tabular-nums;
	    }
	    .ar-tryon-quality i {
	      grid-column: 1 / -1;
	      position: relative;
	      height: 3px;
	      border-radius: 999px;
	      background: rgba(255,255,255,0.16);
	      overflow: hidden;
	    }
	    .ar-tryon-quality i::before {
	      content: "";
	      position: absolute;
	      inset: 0;
	      width: var(--ar-lock, 0%);
	      border-radius: inherit;
	      background: linear-gradient(90deg, #ffdf9a, #ffffff);
	      transition: width 160ms ease;
	    }
    @media (max-width: 620px) {
      .ar-tryon-toolbar {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
      }
      .ar-tryon-btn {
        padding: 9px 12px;
      }
      .ar-tryon-calibration {
        bottom: 110px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        width: min(420px, calc(100vw - 20px));
      }
      .ar-tryon-reset {
        justify-self: stretch;
      }
      .ar-tryon-finger-select {
        bottom: 58px;
      }
      .ar-tryon-hint {
        display: none;
      }
    }
  `;
  document.head.appendChild(style);
}

function buildModal() {
  const modal = document.createElement("div");
  modal.className = "ar-tryon-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "AR ring try-on");
  modal.innerHTML = `
    <div class="ar-tryon-stage">
      <video class="ar-tryon-video" playsinline muted autoplay></video>
      <canvas class="ar-tryon-canvas"></canvas>
      <div class="ar-tryon-toolbar">
        <button type="button" class="ar-tryon-btn" data-ar-flip disabled>Flip Camera</button>
        <button type="button" class="ar-tryon-btn" data-ar-freeze disabled>Freeze / adjust</button>
        <button type="button" class="ar-tryon-btn" data-ar-adjust aria-expanded="false" aria-controls="ar-placement-panel">Adjust placement</button>
        <button type="button" class="ar-tryon-btn" data-ar-snapshot disabled>Save Snapshot</button>
        <button type="button" class="ar-tryon-btn" data-ar-close aria-label="Close AR try-on">Close ✕</button>
      </div>
      <div class="ar-tryon-calibration" id="ar-placement-panel" aria-label="Adjust approximate jewellery placement" hidden>
	        <label>Preview scale <output data-ar-fit-value>100%</output><input type="range" min="78" max="126" step="1" value="100" data-ar-fit></label>
	        <label>Lift <output data-ar-lift-value>0px</output><input type="range" min="-48" max="48" step="1" value="0" data-ar-lift></label>
	        <label>Side <output data-ar-side-value>0px</output><input type="range" min="-48" max="48" step="1" value="0" data-ar-side></label>
	        <label>Tilt <output data-ar-roll-value>0°</output><input type="range" min="-35" max="35" step="1" value="0" data-ar-roll></label>
	        <label>Camera <output data-ar-fov-value>50°</output><input type="range" min="38" max="88" step="1" value="50" data-ar-fov></label>
	        <label data-ar-ear-calibration hidden>Lobe <output data-ar-ear-drop-value>0px</output><input type="range" min="-40" max="40" step="1" value="0" data-ar-ear-drop></label>
	        <label data-ar-ear-calibration hidden>Ear span <output data-ar-ear-span-value>100%</output><input type="range" min="82" max="118" step="1" value="100" data-ar-ear-span></label>
	        <button type="button" class="ar-tryon-btn ar-tryon-reset" data-ar-reset-fit>Reset</button>
	      </div>
      <div class="ar-tryon-finger-select" role="group" aria-label="Choose finger">
        <button type="button" data-finger="index">Index</button>
        <button type="button" data-finger="middle">Middle</button>
        <button type="button" data-finger="ring" class="is-active">Ring</button>
        <button type="button" data-finger="pinky">Pinky</button>
      </div>
	      <div class="ar-tryon-size" data-ar-size hidden>
	        <span class="ar-tryon-size-label">Estimated size</span>
	        <span class="ar-tryon-size-value" data-ar-size-value>—</span>
	        <span class="ar-tryon-size-sub" data-ar-size-sub></span>
	      </div>
	      <div class="ar-tryon-quality" data-ar-quality hidden>
	        <span>Tracking</span>
	        <b data-ar-quality-value>0%</b>
	        <i data-ar-quality-bar></i>
	      </div>
      <div class="ar-tryon-status" role="status" aria-live="polite" data-ar-status>Preparing private camera preview…</div>
      <div class="ar-tryon-hint">Hold your hand up to the camera</div>
    </div>
  `;
  return modal;
}


export class ARTryOn {
  constructor() {
    this._closed = false;
    this._frameGate = new TrackingFrameGate();
    this._frameClock = new VideoFrameClock();
    this._trackingTiming = new TrackingTiming();
    this._renderTiming = new RenderTiming();
    this._pendingTrackingFrame = null;
    this._handIdentity = new HandIdentity();
    this._lastHandRoll = 0;
    this._frozen = false;
    this._suspended = false;
    this._earOffsets = { Left: new THREE.Vector3(), Right: new THREE.Vector3() };
    this.modal = null;
    this.video = null;
    this.canvas = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.ring = null;
    this.handLandmarker = null;
    this.faceLandmarker = null;
    this.poseLandmarker = null;
    this._trackingWorker = null;
    this._trackingWorkerReady = false;
    this._trackingWorkerBusy = false;
    this._trackingWorkerFallbackStarted = false;
    this._trackingFrameId = 0;
    this.stream = null;
    this.rafId = null;
    this.lastVideoTime = -1;
    this.lastDetectMs = 0;
    this.activeFinger = "ring";
    this.pieceType = "Ring";
    this.statusEl = null;
    this.handLostFrames = 0;
    this.calibration = readCalibration();
    for (const side of ["Left", "Right"]) if (this.calibration.earOffsets?.[side]) this._earOffsets[side].fromArray(this.calibration.earOffsets[side]);
    this.facingMode = this.calibration.facingMode;
    this.detectInterval = 1000 / TARGET_DETECTION_FPS;
    this._lastLightSample = -Infinity;
    this._appearanceLighting = new AppearanceLighting();
    this._lightProbe = null;
    this._handMaskCanvas = null;
    this._handMaskCtx = null;
    this._handMaskTexture = null;
    this._handMaskMesh = null;
    this._fingerContactBody = null;
    this._wristContactBody = null;
    this._neckContactBody = null;
    this._neckContactSourceInverse = null;
    this._neckDisplayCorrection = new THREE.Matrix4();
    this._forearmSource = "palm estimate";
    this._neckPlacementReference = null;
    this._placingNeckBase = false;
    this._handDisplayCorrection = new THREE.Matrix4();
    this._isRestartingCamera = false;
    this._designState = null;
    this._physicalSpec = null;
    this._unitsPerMm = METERS_PER_MM;
    this._arPlaneZ = 0;
    this._cameraFovDeg = this.facingMode === "environment" ? this.calibration.fovEnvironment : this.calibration.fovUser;
    this._detectCostEMA = 1000 / TARGET_DETECTION_FPS;
    this._poseConfidence = 0;
    this._poseConfidenceTarget = 0;
    this._motionEnergy = 0;
    this._poseDeltaEnergy = 0;
    this._badPoseFrames = 0;
    this._lastPoseForDelta = null;
    this._lastStageNorm = null;
    this._targetFingerLocalRadius = 1;
    this._targetShadowOpacity = 0;
    this._targetShadowScaleX = 1;
    this._targetShadowScaleY = 1;
    this._targetShadowScaleZ = 1;
    this._targetOccluderScaleX = 1;
    this._targetOccluderScaleY = 1;
    this._neckShadow = null;
    this._neckShadowBaseOpacity = NECKLACE_CONTACT_SHADOW_OPACITY;
    this._targetNeckShadowOpacity = 0;
    this._targetNeckShadowScaleX = 1;
    this._targetNeckShadowScaleY = 1;
    this._necklaceLocalVisibleSpan = 0.12;
    this._necklaceLocalHeight = 1;
    this._necklaceAnchorLocal = new THREE.Vector3();
    this._necklaceWrapTargets = [];
    this._necklaceWrapHalfSpan = 0.06;
    this._necklaceWrapMinY = -1;
    this._necklaceWrapHeight = 1;
    this._necklaceWrapState = { depth: 0, lift: 0, turn: 0 };
    this._sparklePhase = Math.random() * Math.PI * 2;
    // §4 jitter residual (E_jitter ≈ Σ‖T_t T_{t-1}^{-1} - I‖²). Tracks the
    // EMA of post-filter pose jitter so §14 reality score can penalise
    // residual jitter that survived the One-Euro stage. Pure smoothing
    // metric — not fed back into the filters.
    this._jitterEMA = 0;
    this._lastFilteredPose = null;

    // One-Euro filters per channel — much cleaner than EMA for tracking jitter.
    // Position: low cutoff, low beta (slow corrections, very smooth).
    // Scale:    even lower cutoff (depth wobble is annoying).
    // Angle/pitch: per-scalar, then we build the quaternion AFTER smoothing
    //   (avoids 4-channel hemisphere headaches and is way more stable).
    // Lower minCutoff → more aggressive smoothing at low hand speeds
    // (rigidity when held still). Beta governs how fast we let go when the
    // hand actually moves quickly.
    this.filtPx = new OneEuro(1.4, 0.018, 1, 100, 1200);
    this.filtPy = new OneEuro(1.4, 0.018, 1, 100, 1200);
    this.filtScale = new OneEuro(1.2, 0.15, 1, 0.18, 0.8);
    this.filtDirection = new OneEuro(1.4, 0.20, 1, 0.45, 5);
    this._lastDirection = null;
    this.filtNeckHeight = new OneEuro(0.7, 0.1);
    this.filtWristWidth = new OneEuro(0.5, 0.01, 1, 8, 15);
    this.filtPitch = new OneEuro(1.2, 0.18, 1, 0.4, 5);
    this.filtRoll = new OneEuro(1.2, 0.20, 1, 0.45, 5);
    // Body width is a slowly varying estimate, independent of fast pose.
    this.filtFingerDia = new OneEuro(0.3, 0.005);
    // Confidence gets filtered too, so a single bad MediaPipe frame fades the
    // contact shadow / sparkle instead of popping the whole ring.
    this.filtConfidence = new OneEuro(1.2, 0.02);

    // Pre-allocated math objects (avoid GC each frame).
    this._vBase = new THREE.Vector3();
    this._vTip = new THREE.Vector3();
    this._vUp = new THREE.Vector3();
    this._vRight = new THREE.Vector3();
    this._vFwd = new THREE.Vector3();
    this._vTmpA = new THREE.Vector3();
    this._vTmpB = new THREE.Vector3();
    this._mat = new THREE.Matrix4();
    this._quat = new THREE.Quaternion();
    this._wrapQuat = new THREE.Quaternion();
    this._wrapAxisY = new THREE.Vector3(0, 1, 0);

    /* Target-pose state for per-rAF interpolation.
     * MediaPipe emits at ~video fps (≈30); rAF runs at ≈60. Updating the
     * ring once per detection causes a stepped "two-frame held" look.
     * Instead we write each detection into a target pose and lerp the
     * displayed pose toward it every rAF — gives continuous, silky motion
     * without compromising responsiveness (the underlying One-Euro filters
     * still do the heavy lifting on noise). */
    this._tgtPos = new THREE.Vector3();
    this._tgtQuat = new THREE.Quaternion();
    this._tgtScale = 1;
    this._hasTarget = false;
    this._lastRafTime = 0;

    // Velocity uses source-media intervals; prediction age uses the main
    // thread clock. Extrapolation remains limited to 25 ms / six pixels,
    // fading to zero at 150 ms. This is not measured display latency.
    this._lastDetectionTime = 0;
    this._lastVelocityTime = null;
    this._velPx = 0;
    this._velPy = 0;
    this._velScale = 0;
    this._tgtPrevX = 0;
    this._tgtPrevY = 0;
    this._tgtPrevScale = 1;
    this._predTgtPos = new THREE.Vector3();
  }

  async open() {
    this._previousFocus = document.activeElement;
    this._previousOverflow = document.body.style.overflow;
    injectStyles();
    this.modal = buildModal();
    document.body.appendChild(this.modal);
    document.body.style.overflow = "hidden";

    this.video = this.modal.querySelector(".ar-tryon-video");
    this.canvas = this.modal.querySelector(".ar-tryon-canvas");
    this.statusEl = this.modal.querySelector("[data-ar-status]");
    this.sizeEl = this.modal.querySelector("[data-ar-size]");
    this.sizeValueEl = this.modal.querySelector("[data-ar-size-value]");
    this.sizeSubEl = this.modal.querySelector("[data-ar-size-sub]");
    this.qualityEl = this.modal.querySelector("[data-ar-quality]");
    this.qualityValueEl = this.modal.querySelector("[data-ar-quality-value]");
    this.qualityBarEl = this.modal.querySelector("[data-ar-quality-bar]");
    this.fitInput = this.modal.querySelector("[data-ar-fit]");
    this.liftInput = this.modal.querySelector("[data-ar-lift]");
    this.sideInput = this.modal.querySelector("[data-ar-side]");
    this.rollInput = this.modal.querySelector("[data-ar-roll]");
    this.fovInput = this.modal.querySelector("[data-ar-fov]");
    this.earDropInput = this.modal.querySelector("[data-ar-ear-drop]");
    this.earSpanInput = this.modal.querySelector("[data-ar-ear-span]");
    this.fitValueEl = this.modal.querySelector("[data-ar-fit-value]");
    this.liftValueEl = this.modal.querySelector("[data-ar-lift-value]");
    this.sideValueEl = this.modal.querySelector("[data-ar-side-value]");
    this.rollValueEl = this.modal.querySelector("[data-ar-roll-value]");
    this.fovValueEl = this.modal.querySelector("[data-ar-fov-value]");
    this.earDropValueEl = this.modal.querySelector("[data-ar-ear-drop-value]");
    this.earSpanValueEl = this.modal.querySelector("[data-ar-ear-span-value]");
    this.fingerSelectEl = this.modal.querySelector(".ar-tryon-finger-select");
    this.hintEl = this.modal.querySelector(".ar-tryon-hint");

    /* Piece dispatch — read the last saved design state to decide which
     * tracking strategy + UI affordances to use. Rings show a finger picker
     * + US/EU size readout. Bracelets hide those, anchor at the wrist, and
     * relabel the hint. Any unknown piece falls back to ring. */
    const stateEarly = readDesignState();
    this._designState = stateEarly || {};
    this.pieceType = stateEarly?.piece === "Bracelet" ? "Bracelet"
      : stateEarly?.piece === "Earrings" ? "Earrings"
      : stateEarly?.piece === "Necklace" ? "Necklace"
      : "Ring";
    if (this.pieceType === "Bracelet") {
      this.modal.setAttribute("aria-label", "AR bracelet try-on");
      if (this.fingerSelectEl) this.fingerSelectEl.hidden = true;
      if (this.sizeEl) this.sizeEl.hidden = true;
      if (this.hintEl) this.hintEl.textContent = "Show your wrist; include your elbow when possible";
    } else if (this.pieceType === "Earrings") {
      this.modal.setAttribute("aria-label", "AR earring try-on");
      if (this.fingerSelectEl) this.fingerSelectEl.hidden = true;
      if (this.sizeEl) this.sizeEl.hidden = true;
      this.modal.querySelectorAll("[data-ar-ear-calibration]").forEach((label) => { label.hidden = false; });
      if (this.hintEl) this.hintEl.textContent = "Face the camera so both ears are visible";
    } else if (this.pieceType === "Necklace") {
      this.modal.setAttribute("aria-label", "AR necklace try-on");
      if (this.fingerSelectEl) this.fingerSelectEl.hidden = true;
      if (this.sizeEl) this.sizeEl.hidden = true;
      if (this.hintEl) this.hintEl.textContent = "Step back so head and shoulders are visible";
    }

    this.applyCameraClass();
    this.syncCalibrationControls();
    this.setupWearableControls();
    this.modal.querySelector("[data-ar-close]").focus();

    this.modal.querySelector("[data-ar-close]").addEventListener("click", () => this.close());
    this.modal.querySelector("[data-ar-snapshot]").addEventListener("click", () => this.snapshot());
    this.modal.querySelector("[data-ar-flip]").addEventListener("click", () => this.flipCamera());
    this.modal.querySelector("[data-ar-adjust]").addEventListener("click", () => {
      this.setPlacementOpen(this.modal.querySelector(".ar-tryon-calibration").hidden);
    });
    this.modal.querySelector("[data-ar-reset-fit]").addEventListener("click", () => {
      this.calibration.fit = 1;
      this.calibration.lift = 0;
      this.calibration.side = 0;
      this.calibration.roll = 0;
      this.calibration.fovUser = 50;
      this.calibration.fovEnvironment = 58;
      this.calibration.earDrop = 0;
      this.calibration.earSpan = 1;
      this.calibration.neckHeightMm = 40;
      this.calibration.neckHeightAuto = true;
      this.calibration.neckBaseOffsetMm = { x: 0, y: 0 };
      this.cancelNeckPlacement();
      this._earOffsets.Left.set(0, 0, 0);
      this._earOffsets.Right.set(0, 0, 0);
      this.modal.querySelector("[data-ar-ear-x]").value = "0";
      this.modal.querySelector("[data-ar-ear-y]").value = "0";
      this.persistCalibration();
      this.syncCalibrationControls();
      this.updateCameraProjection();
      this.resetTrackingFilters();
      if (this._frozen && this._lastTrackingResult) this.applyTrackingResult(this._lastTrackingResult);
    });
    [this.fitInput, this.liftInput, this.sideInput, this.rollInput, this.fovInput, this.earDropInput, this.earSpanInput].forEach((input) => {
      input?.addEventListener("input", () => {
        this.calibration.fit = Number(this.fitInput?.value || 100) / 100;
        this.calibration.lift = Number(this.liftInput?.value || 0);
        this.calibration.side = Number(this.sideInput?.value || 0);
        this.calibration.roll = Number(this.rollInput?.value || 0);
        const activeFovKey = this.facingMode === "environment" ? "fovEnvironment" : "fovUser";
        this.calibration[activeFovKey] = Number(this.fovInput?.value || this.currentCameraFov());
        this.calibration.earDrop = Number(this.earDropInput?.value || 0);
        this.calibration.earSpan = Number(this.earSpanInput?.value || 100) / 100;
        this.persistCalibration();
        this.syncCalibrationLabels();
        this.updateCameraProjection();
        // Placement controls are deliberate edits. A partly filtered edit
        // would temporarily displace the body when undoing the raw ring pose.
        if (["Ring", "Bracelet", "Necklace"].includes(this.pieceType)) this.resetTrackingFilters();
        if (this._frozen && this._lastTrackingResult) this.applyTrackingResult(this._lastTrackingResult);
      });
    });
    this.modal.querySelectorAll(".ar-tryon-finger-select button").forEach(btn => {
      btn.addEventListener("click", () => {
        this.modal.querySelectorAll(".ar-tryon-finger-select button").forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        this.activeFinger = btn.dataset.finger;
        // The next accepted joints rebuild the selected finger's body fit.
        this.resetTrackingFilters();
        if (this.ring) this.ring.visible = false;
      });
    });
    document.addEventListener("keydown", this._onKey = (event) => {
      if (event.key === "Escape") {
        if (this._placingNeckBase) {
          event.preventDefault(); this.cancelNeckPlacement(); this.setPlacementOpen(true); this.setStatus("");
          this.modal.querySelector("[data-ar-place-neck]").focus();
        } else this.close();
      }
      if (event.key === "Tab") {
        const controls = [...this.modal.querySelectorAll("button, input, select")].filter((control) => !control.disabled && control.getClientRects().length);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    });
    document.addEventListener("visibilitychange", this._onVisibility = () => {
      if (!document.hidden || this._closed) return;
      if (!this._initialized) { this.close(); return; }
      this._suspended = true;
      this._renderTiming.pause();
      this._frozen = true;
      this.resetFrameSession();
      this._cameraAbort?.abort();
      this.stream?.getTracks().forEach((track) => track.stop());
      this.stream = null;
      this.resetTrackingFilters();
      if (this.ring) this.ring.visible = false;
      this.hideHandSilhouetteOccluder();
      this.modal.querySelector("[data-ar-freeze]").textContent = "Resume camera";
      this.setStatus("Camera paused. Choose Resume camera to continue.");
    });

    try {
      this.setStatus("Preparing your selected design…");
      const designer = await import("./designer.js?v=20260914-studio");
      await designer.prepareDesignerForAR();
      if (this._closed) return;
      this._designState = readDesignState() || this._designState;
      if (this._designState.piece !== this.pieceType) throw new Error("The design changed. Close and reopen try-on.");
      this.startThree();
      this.setStatus("Requesting camera…");
      await this.startCamera();
      if (this._closed) return;
      this.setupCameraBackground();
      this.setStatus("Loading private, on-device tracking…");
      await this.startMediaPipe();
      if (this._closed) return;
      this._initialized = true;
      this.modal.querySelectorAll("[data-ar-flip], [data-ar-freeze], [data-ar-snapshot]").forEach((button) => { button.disabled = false; });
      this.setStatus("");
      this.startVideoFrames();
      this.loop();
    } catch (error) {
      if (this._closed) return;
      this.stream?.getTracks().forEach((track) => track.stop());
      this.stream = null;
      this.setStatus(`Could not start AR: ${error.message || error}. Close and retry.`);
    }
  }

  setupWearableControls() {
    const panel = this.modal.querySelector(".ar-tryon-calibration");
    panel.setAttribute("aria-label", "Adjust approximate jewellery placement");
    const options = document.createElement("details");
    options.className = "ar-wearable-options";
    options.innerHTML = `
      <summary>Placement, sizing & privacy</summary>
      <p>On-device camera preview. Scale and body contact are approximate—not a sizing guarantee.</p>
      <label data-ar-hand-control>Hand <select data-ar-hand><option>Auto</option><option>Left</option><option>Right</option></select></label>
      <label data-ar-measure-control>Knuckle width (mm, optional)<input data-ar-measure type="number" min="40" max="110" step="1" placeholder="Uncalibrated"></label>
      <label data-ar-wrist-control>Wrist width across (mm, optional)<input data-ar-wrist type="number" min="30" max="90" step="1" placeholder="Estimated from hand"></label>
      <label><input type="checkbox" data-ar-remember> Remember placement on this device</label>
      <label><input type="checkbox" data-ar-diagnostics> Show tracking diagnostics</label>
      <label><input type="checkbox" data-ar-motion> Natural pendant movement</label>
      <label data-ar-neck-control>Neck circumference (mm, estimate)<input data-ar-neck type="number" min="240" max="520" step="5" value="320"></label>
      <label data-ar-neck-auto-control><input data-ar-neck-auto type="checkbox"> Estimate neck base from pose</label>
      <label data-ar-neck-height-control>Manual neck base above shoulders (mm)<input data-ar-neck-height type="number" min="0" max="90" step="2" value="40"></label>
      <div data-ar-neck-placement hidden>
        <button type="button" class="ar-tryon-btn" data-ar-place-neck>Place neck base</button>
        <p data-ar-place-neck-help>Freeze the preview, then mark the hollow at the base of your throat. The necklace will follow that point as you move.</p>
      </div>
      <div data-ar-independent-ears hidden>
        <label>Adjust ear <select data-ar-ear-side><option>Left</option><option>Right</option></select></label>
        <label>Outward (mm)<input data-ar-ear-x type="range" min="-20" max="20" value="0" step="0.5"></label>
        <label>Height (mm)<input data-ar-ear-y type="range" min="-20" max="20" value="0" step="0.5"></label>
      </div>
      <button type="button" class="ar-tryon-btn" data-ar-forget>Forget saved placement</button>
      <output data-ar-debug hidden></output>`;
    panel.append(options);
    options.querySelector("[data-ar-motion]").checked = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    options.querySelector("[data-ar-neck-control]").hidden = this.pieceType !== "Necklace";
    options.querySelector("[data-ar-neck-height-control]").hidden = this.pieceType !== "Necklace";
    options.querySelector("[data-ar-neck-auto-control]").hidden = this.pieceType !== "Necklace";
    options.querySelector("[data-ar-neck-placement]").hidden = this.pieceType !== "Necklace";
    options.querySelector("[data-ar-place-neck]").addEventListener("click", () => {
      if (this._placingNeckBase) { this.cancelNeckPlacement(); return; }
      if (!this._frozen || !this._hasTarget || !this.ring?.visible
        || this._neckPlacementReference?.trackingResult !== this._lastTrackingResult) {
        this.setStatus("Freeze a tracked preview first, then choose Place neck base."); return;
      }
      this._placingNeckBase = true;
      this.canvas.style.pointerEvents = "auto";
      this.canvas.style.cursor = "crosshair";
      this.modal.querySelector("[data-ar-place-neck]").textContent = "Cancel placement";
      this.setPlacementOpen(false);
      this.modal.querySelector("[data-ar-adjust]").focus();
      this.setStatus("Tap the hollow at the base of your throat. Press Escape to cancel placement.");
    });
    this.canvas.addEventListener("pointerdown", event => {
      if (!this._placingNeckBase) return;
      event.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      this.placeNeckBase({ x: event.clientX - rect.left - rect.width / 2, y: rect.height / 2 - (event.clientY - rect.top) });
    });
    const neckAuto = options.querySelector("[data-ar-neck-auto]");
    const neckHeight = options.querySelector("[data-ar-neck-height]");
    neckAuto.checked = this.calibration.neckHeightAuto;
    neckHeight.disabled = neckAuto.checked;
    neckAuto.addEventListener("change", () => {
      this.calibration.neckHeightAuto = neckAuto.checked;
      neckHeight.disabled = neckAuto.checked;
      this.persistCalibration();
      this.resetTrackingFilters();
      if (this._frozen && this._lastTrackingResult) this.applyTrackingResult(this._lastTrackingResult);
    });
    neckHeight.value = this.calibration.neckHeightMm;
    neckHeight.addEventListener("change", () => {
      const value = neckHeight.valueAsNumber;
      if (!Number.isFinite(value) || value < 0 || value > 90) return;
      this.calibration.neckHeightMm = value;
      this.persistCalibration();
      this.resetTrackingFilters();
      if (this._frozen && this._lastTrackingResult) this.applyTrackingResult(this._lastTrackingResult);
    });
    options.querySelector("[data-ar-neck]").addEventListener("change", (event) => {
      const value = Number(event.target.value);
      if (value < 240 || value > 520 || !Number.isFinite(value)) return;
      this._neckCircumferenceMm = value;
      if (this.ring) this.rebuildNecklace();
    });
    options.querySelector("[data-ar-wrist-control]").hidden = this.pieceType !== "Bracelet";
    options.querySelector("[data-ar-wrist]").addEventListener("change", (event) => {
      const value = event.target.value === "" ? 0 : event.target.valueAsNumber;
      if (!Number.isFinite(value) || (value !== 0 && (value < 30 || value > 90))) return;
      this._wristWidthMm = value;
      this._braceletFitAt = null;
      this.resetTrackingFilters();
      if (this._frozen && this._lastTrackingResult) this.applyTrackingResult(this._lastTrackingResult);
    });
    const handType = this.pieceType === "Ring" || this.pieceType === "Bracelet";
    options.querySelector("[data-ar-hand-control]").hidden = !handType;
    options.querySelector("[data-ar-measure-control]").hidden = !handType;
    options.querySelector("[data-ar-independent-ears]").hidden = this.pieceType !== "Earrings";
    options.querySelector("[data-ar-hand]").addEventListener("change", (event) => {
      this._handIdentity.preference = event.target.value;
      this._handIdentity.reset();
      this.resetTrackingFilters();
      if (this.ring) this.ring.visible = false;
    });
    options.querySelector("[data-ar-measure]").addEventListener("input", (event) => {
      const value = Number(event.target.value);
      this._measuredHandWidthMm = value >= 40 && value <= 110 ? value : 0;
      this.resetTrackingFilters();
      if (this.ring) this.ring.visible = false;
    });
    options.querySelector("[data-ar-remember]").addEventListener("change", (event) => {
      this._rememberCalibration = event.target.checked;
      if (this._rememberCalibration) this.persistCalibration();
    });
    options.querySelector("[data-ar-forget]").addEventListener("click", () => {
      try { localStorage.removeItem(CALIBRATION_KEY); } catch {}
      this._rememberCalibration = false;
      options.querySelector("[data-ar-remember]").checked = false;
      this.calibration = readCalibration();
      this._earOffsets.Left.set(0, 0, 0);
      this._earOffsets.Right.set(0, 0, 0);
      this.syncCalibrationControls();
      this.updateCameraProjection();
      this.resetTrackingFilters();
    });
    const earSide = options.querySelector("[data-ar-ear-side]");
    const earX = options.querySelector("[data-ar-ear-x]");
    const earY = options.querySelector("[data-ar-ear-y]");
    earX.value = this._earOffsets.Left.x * 1000;
    earY.value = this._earOffsets.Left.y * 1000;
    earSide.addEventListener("change", () => {
      earX.value = this._earOffsets[earSide.value].x * 1000;
      earY.value = this._earOffsets[earSide.value].y * 1000;
    });
    for (const input of [earX, earY]) input.addEventListener("input", () => {
      this._earOffsets[earSide.value].set(Number(earX.value) / 1000, Number(earY.value) / 1000, 0);
      this.persistCalibration();
      if (this._frozen && this._lastTrackingResult) this.applyTrackingResult(this._lastTrackingResult);
    });
    this.modal.querySelector("[data-ar-freeze]").addEventListener("click", async (event) => {
      this.cancelNeckPlacement();
      if (this._isRestartingCamera) return;
      if (this._suspended) {
        try {
          await this.startCamera();
          if (this._closed) return;
          this._suspended = false;
          this._frozen = false;
          this.startVideoFrames();
          event.target.textContent = "Freeze / adjust";
          this.setStatus("");
        } catch (error) { if (!this._closed) this.setStatus(error.message); }
        return;
      }
      this._frozen = !this._frozen;
      this.resetFrameSession(this._frozen);
      if (this._frozen) { this.video.pause(); this.setPlacementOpen(true); }
      else { await this.video.play(); this.resetTrackingFilters(); }
      event.target.textContent = this._frozen ? "Resume live" : "Freeze / adjust";
    });
  }

  startVideoFrames() {
    if (!this.video?.requestVideoFrameCallback || this._closed) return;
    if (this._videoCallback) this.video.cancelVideoFrameCallback(this._videoCallback);
    const process = (timestamp, metadata) => {
      if (this._closed) return;
      this.processVideoFrame(timestamp, metadata);
      this._videoCallback = this.video.requestVideoFrameCallback(process);
    };
    this._videoCallback = this.video.requestVideoFrameCallback(process);
  }

  cancelNeckPlacement() {
    this._placingNeckBase = false;
    if (this.canvas?.style) { this.canvas.style.pointerEvents = ""; this.canvas.style.cursor = ""; }
    const button = this.modal?.querySelector("[data-ar-place-neck]");
    if (button) button.textContent = "Place neck base";
  }

  placeNeckBase(point) {
    if (!this._frozen || !this._hasTarget || !this.ring?.visible || !this._lastTrackingResult
      || this._neckPlacementReference?.trackingResult !== this._lastTrackingResult) return false;
    const offset = neckPlacementOffset(point, this._neckPlacementReference);
    if (!offset) { this.setStatus("Choose a point near the base of your throat."); return false; }
    this.calibration.neckBaseOffsetMm = offset;
    this.calibration.neckHeightMm = this._neckPlacementReference.neckHeightMm;
    this.calibration.neckHeightAuto = false;
    this.calibration.side = 0;
    this.calibration.lift = 0;
    this.cancelNeckPlacement();
    this.persistCalibration();
    this.syncCalibrationControls();
    this.applyTrackingResult(this._lastTrackingResult);
    this.setPlacementOpen(true);
    this.setStatus("Neck base placed. Resume live when ready.");
    return true;
  }

  resetFrameSession(preserveTiming = false) {
    this._frameGate.reset();
    this._frameClock.reset();
    if (!preserveTiming) this._trackingTiming.reset();
    this.lastVideoTime = -1;
    this.lastDetectMs = -Infinity;
    this._lastResultAt = null;
    // An old worker job still owns its slot until it completes. Clearing busy
    // here would queue a second job behind it after freeze or a camera switch.
  }

  processVideoFrame(timestamp, metadata) {
    if (this._closed || this._frozen || this._suspended || this._isRestartingCamera || this.video?.readyState < 2) return;
    const tracker = this.pieceType === "Earrings" ? this.faceLandmarker : this.pieceType === "Necklace" ? this.poseLandmarker : this.handLandmarker;
    if (!this._trackingWorkerReady && !tracker) return;
    if (this._trackingWorkerReady && this._trackingWorkerBusy) {
      this._trackingTiming.skippedBusy++;
      return;
    }
    const sampledAt = performance.now();
    if (sampledAt - this.lastDetectMs < this.detectInterval) return;
    const frame = this._frameClock.next(this.video, sampledAt, metadata, timestamp);
    if (!frame) return;
    frame.mirrored = this.isMirrored;
    if (!frameIsFresh(frame, sampledAt)) { this._trackingTiming.droppedStale++; return; }
    this.lastVideoTime = frame.mediaTime;
    this.lastDetectMs = sampledAt;
    if (this._trackingWorkerReady) this.sendFrameToTrackingWorker(frame);
    else {
      const started = performance.now();
      try { this.applyTrackingResult(tracker.detectForVideo(this.video, sampledAt), performance.now() - started, sampledAt, frame); }
      catch { this.setStatus("Tracking interrupted. Close and reopen try-on."); }
    }
  }


  setStatus(msg) {
    if (!this.statusEl) return;
    if (!msg) {
      this.statusEl.classList.add("is-hidden");
    } else {
      this.statusEl.classList.remove("is-hidden");
      this.statusEl.textContent = msg;
    }
  }

  setPlacementOpen(open) {
    this.modal.querySelector(".ar-tryon-calibration").hidden = !open;
    const button = this.modal.querySelector("[data-ar-adjust]");
    button.setAttribute("aria-expanded", String(open));
    button.textContent = open ? "Hide adjustments" : "Adjust placement";
  }

  applyCameraClass() {
    this.modal?.classList.toggle("is-world-camera", this.facingMode === "environment");
  }

  get isMirrored() {
    return this.facingMode !== "environment";
  }

  persistCalibration() {
    this.calibration.facingMode = this.facingMode;
    this.calibration.earOffsets = Object.fromEntries(["Left", "Right"].map((side) => [side, this._earOffsets[side].toArray()]));
    if (this._rememberCalibration) writeCalibration(this.calibration);
  }

  currentCameraFov() {
    return this.facingMode === "environment"
      ? this.calibration.fovEnvironment
      : this.calibration.fovUser;
  }

  updateCameraProjection() {
    this._cameraFovDeg = clamp(Number(this.currentCameraFov()) || 50, 38, 88);
    if (!this.camera) return;
    this.camera.fov = this._cameraFovDeg;
    const width = Math.max(this.canvas?.clientWidth || 1, 1);
    const height = Math.max(this.canvas?.clientHeight || 1, 1);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.syncHandSilhouettePlane();
  }

  syncCalibrationLabels() {
    if (this.fitValueEl) this.fitValueEl.textContent = `${Math.round(this.calibration.fit * 100)}%`;
    if (this.liftValueEl) this.liftValueEl.textContent = `${Math.round(this.calibration.lift)}px`;
    if (this.sideValueEl) this.sideValueEl.textContent = `${Math.round(this.calibration.side)}px`;
    if (this.rollValueEl) this.rollValueEl.textContent = `${Math.round(this.calibration.roll || 0)}°`;
    if (this.fovValueEl) this.fovValueEl.textContent = `${Math.round(this.currentCameraFov())}°`;
    if (this.earDropValueEl) this.earDropValueEl.textContent = `${Math.round(this.calibration.earDrop || 0)}px`;
    if (this.earSpanValueEl) this.earSpanValueEl.textContent = `${Math.round((this.calibration.earSpan || 1) * 100)}%`;
  }

  syncCalibrationControls() {
    if (this.fitInput) this.fitInput.value = String(Math.round(this.calibration.fit * 100));
    if (this.liftInput) this.liftInput.value = String(Math.round(this.calibration.lift));
    if (this.sideInput) this.sideInput.value = String(Math.round(this.calibration.side));
    if (this.rollInput) this.rollInput.value = String(Math.round(this.calibration.roll || 0));
    if (this.fovInput) this.fovInput.value = String(Math.round(this.currentCameraFov()));
    if (this.earDropInput) this.earDropInput.value = String(Math.round(this.calibration.earDrop || 0));
    if (this.earSpanInput) this.earSpanInput.value = String(Math.round((this.calibration.earSpan || 1) * 100));
    const neckHeight = this.modal?.querySelector("[data-ar-neck-height]");
    if (neckHeight) {
      neckHeight.value = String(this.calibration.neckHeightMm);
      neckHeight.disabled = this.calibration.neckHeightAuto;
    }
    const neckAuto = this.modal?.querySelector("[data-ar-neck-auto]");
    if (neckAuto) neckAuto.checked = this.calibration.neckHeightAuto;
    this.syncCalibrationLabels();
  }

  resetTrackingFilters() {
    this.hideHandSilhouetteOccluder();
    this._earAnchors = null;
    this._earVisibility = {};
    this._earPoseQuaternion = null;
    this._pendingEarRotation = null;
    this._lastDirection = null;
    this._lastSourceTimestamp = null;
    this._lastVelocityTime = null;
    this._earAnchorTime = null;
    this._braceletFitAt = -Infinity;
    this._lastHandRoll = 0;
    this._forearmSource = "palm estimate";
    this._neckContactSourceInverse = null;
    if (this._faceOccluder) this._faceOccluder.visible = false;
    this._articulation?.reset();
    [
      this.filtPx,
      this.filtPy,
      this.filtScale,
      this.filtDirection,
      this.filtNeckHeight,
      this.filtWristWidth,
      this.filtPitch,
      this.filtRoll,
      this.filtFingerDia,
      this.filtConfidence
    ].forEach(filter => filter.reset());
    this._hasTarget = false;
    this._poseConfidence = 0;
    this._poseConfidenceTarget = 0;
    this._motionEnergy = 0;
    this._poseDeltaEnergy = 0;
    this._lastPoseForDelta = null;
    this._jitterEMA = 0;
    this._lastFilteredPose = null;
    this._badPoseFrames = 0;
    this._targetNeckShadowOpacity = 0;
    // §4 predictor — clear velocity & last-detection clock so a re-acquired
    // hand doesn't extrapolate from stale velocity vectors.
    this._lastDetectionTime = 0;
    this._velPx = 0;
    this._velPy = 0;
    this._velScale = 0;
    this._tgtPrevX = 0;
    this._tgtPrevY = 0;
    this._tgtPrevScale = 1;
  }

  prepareNecklaceFit(pieceSize) {
    this._necklaceWrapTargets = [];
    this._necklaceLocalVisibleSpan = pieceSize.x;
    this._necklaceLocalHeight = pieceSize.y;
    this._necklaceAnchorLocal.set(0, 0, 0);
  }


  updateQualityReadout() {
    if (!this.qualityEl) return;
    this.qualityEl.hidden = !this.ring?.visible || !this._hasTarget;
    if (this.hintEl) this.hintEl.hidden = !this.qualityEl.hidden;
    const confidence = clamp(this._poseConfidence, 0, 1);
    this.qualityValueEl.textContent = confidence > 0.75 ? "Tracking well" : "Adjust framing";
    this.qualityBarEl.style.setProperty("--ar-lock", `${Math.round(confidence * 100)}%`);
    const debug = this.modal.querySelector("[data-ar-debug]");
    debug.hidden = !this.modal.querySelector("[data-ar-diagnostics]").checked;
    if (!debug.hidden) {
      const optics = this.ring?.userData.arOptics;
      debug.textContent = `${this.pieceType} · metres · ${this._trackingTiming.describe(performance.now(), this._frozen)} · ${this._handIdentity.previous?.handedness || "body"} · ${this._measuredHandWidthMm ? "manual knuckle reference" : "approximate scale"} · ${this.pieceType === "Bracelet" ? this._forearmSource : "body estimate"} · ${this._appearanceLighting.describe()} · ${this._renderTiming.describe(performance.now())} · ${this._wearable?.renderBatches.report.sourceDraws || 0} metal parts in ${this._wearable?.renderBatches.report.batches || 0} batches · ${optics ? `${optics.traced} ray gems / ${optics.fallback} crystal fallbacks` : "loading environment"}`;
    }
  }


  setupHandSilhouetteOccluder() {
    if (!["Ring", "Bracelet"].includes(this.pieceType)) return;
    const geometry = new THREE.CylinderGeometry(0.94, 1, 1, 10);
    const material = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true });
    this._handMaskMesh = new THREE.InstancedMesh(geometry, material, 20);
    this._handMaskMesh.name = "articulated-finger-depth-proxies";
    this._handMaskMesh.renderOrder = -110;
    this._handMaskMesh.frustumCulled = false;
    this._handMaskMesh.matrixAutoUpdate = false;
    this._handMaskMesh.visible = false;
    this._handProxyTransform = new THREE.Object3D();
    this._handProxyAxis = new THREE.Vector3(0, 1, 0);
    this.scene.add(this._handMaskMesh);
    if (this.pieceType === "Ring") {
      this._fingerContactBody = new FingerContactBody();
      this.scene.add(this._fingerContactBody);
    } else {
      this._wristContactBody = new WristContactBody();
      this.scene.add(this._wristContactBody);
    }
  }

  setupCameraBackground() {
    this._appearanceLighting.reset();
    this._lastLightSample = -Infinity;
    this._cameraTexture?.dispose();
    this._cameraTexture = new CameraTexture(this.video);
    this.scene.background = this._cameraTexture;
    this.syncHandSilhouettePlane();
  }

  syncHandSilhouettePlane() {
    this._cameraTexture?.fit(this.videoMetrics(), this.isMirrored);
  }

  hideHandSilhouetteOccluder() {
    if (this._handMaskMesh) this._handMaskMesh.visible = false;
    if (this._fingerContactBody) this._fingerContactBody.visible = false;
    if (this._wristContactBody) this._wristContactBody.visible = false;
    if (this._neckContactBody) this._neckContactBody.visible = false;
  }

  updateHandSilhouetteOccluder(landmarks, metrics, handWidthPx, rawX, rawY, rawScale, directionX, directionY, pitch, roll, fingerRadiusPx, wristFit) {
    if (!this._handMaskMesh || !landmarks?.length) return;
    const units = this.worldUnitsPerPixelAtZ();
    const selectedBase = this.pieceType === "Ring" ? this.fingerLandmarks()[0] : 0;
    const depthOrigin = this.pieceType === "Ring"
      ? lerp(landmarks[selectedBase].z, landmarks[selectedBase + 1].z, FINGER_RING_SEAT_T[this.activeFinger] || FINGER_RING_SEAT_T.ring)
      : landmarks[0].z;
    const side = new THREE.Vector3(-directionY, directionX, 0);
    const up = new THREE.Vector3(-directionX * Math.sin(pitch), -directionY * Math.sin(pitch), Math.cos(pitch));
    const along = new THREE.Vector3(directionX * Math.cos(pitch), directionY * Math.cos(pitch), Math.sin(pitch));
    const basis = new THREE.Matrix4().makeBasis(
      side.clone().multiplyScalar(Math.cos(roll)).addScaledVector(up, -Math.sin(roll)),
      side.multiplyScalar(Math.sin(roll)).addScaledVector(up, Math.cos(roll)), along);
    const rawOrigin = this.stageToWorld(rawX, rawY);
    rawOrigin.z += wristFit?.depth || 0;
    this._handMaskSourceInverse = new THREE.Matrix4().compose(
      rawOrigin, new THREE.Quaternion().setFromRotationMatrix(basis),
      new THREE.Vector3().setScalar(this.pixelScaleToWorld(rawScale))).invert();
    const position = (point) => {
      const stage = this.landmarkToStage(point, metrics);
      return this.stageToWorld(stage.x, stage.y, this._arPlaneZ - (point.z - depthOrigin) * metrics.drawWidth * units);
    };
    if (this._fingerContactBody) {
      // Ring pose includes the user's tilt adjustment; skin orientation does
      // not. The depth proxy remains fitted to the detected joint centres.
      const bodyRoll = roll - THREE.MathUtils.degToRad(this.calibration.roll || 0);
      const dorsal = new THREE.Vector3(-directionY, directionX, 0).multiplyScalar(Math.sin(bodyRoll))
        .addScaledVector(up, Math.cos(bodyRoll));
      this._fingerContactBody.updateSource({
        start: position(landmarks[selectedBase]), end: position(landmarks[selectedBase + 1]),
        dorsal, radius: fingerRadiusPx * units,
        finger: this.activeFinger, seat: FINGER_RING_SEAT_T[this.activeFinger] || FINGER_RING_SEAT_T.ring
      });
    }
    if (this._wristContactBody && wristFit) {
      this._wristContactBody.updateSource(this.stageToWorld(wristFit.x, wristFit.y),
        wristOrientation(directionX, directionY, pitch, roll - THREE.MathUtils.degToRad(this.calibration.roll || 0)),
        wristFit.radiusPx * units, wristFit.pixelsPerMeter * units);
    }
    let count = 0;
    for (const base of [1, 5, 9, 13, 17]) {
      for (let segment = 0; segment < 3; segment += 1) {
        if (base === selectedBase && segment === 0) continue;
        const first = landmarks[base + segment], second = landmarks[base + segment + 1];
        if (!first || !second || ![first.x, first.y, first.z, second.x, second.y, second.z].every(Number.isFinite)) continue;
        const start = position(first), end = position(second);
        const direction = end.clone().sub(start);
        const length = direction.length();
        if (length < 0.0001) continue;
        const radius = handWidthPx * units * (base === 17 ? 0.072 : 0.09) * (1 - segment * 0.12);
        const transform = this._handProxyTransform;
        transform.position.copy(start).lerp(end, 0.5);
        transform.quaternion.setFromUnitVectors(this._handProxyAxis, direction.normalize());
        transform.scale.set(radius, length + radius * 0.45, radius * 0.80);
        transform.updateMatrix();
        this._handMaskMesh.setMatrixAt(count++, transform.matrix);
      }
    }
    this._handMaskMesh.count = count;
    this._handMaskMesh.instanceMatrix.needsUpdate = true;
    this._handMaskMesh.visible = this._hasTarget;
  }

  syncHandContactDisplay() {
    if (this.ring && this._neckContactBody && this._neckContactSourceInverse) {
      this.ring.updateMatrixWorld(true);
      this._neckDisplayCorrection.copy(this.ring.matrixWorld).multiply(this._neckContactSourceInverse);
      this._neckContactBody.syncDisplay(this._neckDisplayCorrection,this.ring.visible&&this._hasTarget);
    }
    if (!this.ring || !this._handMaskSourceInverse) return;
    this.ring.updateMatrixWorld(true);
    this._handDisplayCorrection.copy(this.ring.matrixWorld).multiply(this._handMaskSourceInverse);
    if (this._handMaskMesh) {
      this._handMaskMesh.visible = this.ring.visible && this._hasTarget && this._handMaskMesh.count > 0;
      this._handMaskMesh.matrix.copy(this._handDisplayCorrection);
      this._handMaskMesh.matrixWorldNeedsUpdate = true;
    }
    this._fingerContactBody?.syncDisplay(this._handDisplayCorrection, this.ring.visible && this._hasTarget);
    this._wristContactBody?.syncDisplay(this._handDisplayCorrection, this.ring.visible && this._hasTarget);
  }


  videoMetrics() {
    const width = Math.max(this.canvas?.clientWidth || 1, 1);
    const height = Math.max(this.canvas?.clientHeight || 1, 1);
    const videoWidth = this.video?.videoWidth || width;
    const videoHeight = this.video?.videoHeight || height;
    const coverScale = Math.max(width / videoWidth, height / videoHeight);
    const drawWidth = videoWidth * coverScale;
    const drawHeight = videoHeight * coverScale;

    return {
      width,
      height,
      drawWidth,
      drawHeight,
      offsetX: (width - drawWidth) / 2,
      offsetY: (height - drawHeight) / 2
    };
  }

  worldUnitsPerPixelAtZ(z = this._arPlaneZ) {
    if (!this.camera?.isPerspectiveCamera) return 1;
    const metrics = this.videoMetrics();
    const distance = Math.max(0.01, Math.abs(this.camera.position.z - z));
    const worldHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) * 0.5);
    return worldHeight / Math.max(metrics.height, 1);
  }

  stageToWorld(xPx, yPx, z = this._arPlaneZ, target = new THREE.Vector3()) {
    const unitsPerPixel = this.worldUnitsPerPixelAtZ(z);
    return target.set(xPx * unitsPerPixel, yPx * unitsPerPixel, z);
  }

  pixelScaleToWorld(scalePxPerLocalUnit, z = this._arPlaneZ) {
    return scalePxPerLocalUnit * this.worldUnitsPerPixelAtZ(z);
  }

  filterDirection(horizontal, vertical, timestamp) {
    const angle = Math.atan2(vertical, horizontal);
    const previous = this._lastDirection ?? angle;
    const unwrapped = previous + Math.atan2(Math.sin(angle - previous), Math.cos(angle - previous));
    const filtered = this.filtDirection.filter(unwrapped, timestamp);
    this._lastDirection = this.filtDirection.rawPrev;
    return { x: Math.cos(filtered), y: Math.sin(filtered) };
  }

  updatePoseVelocity(timestamp) {
    const delta = (timestamp - this._lastVelocityTime) / 1000;
    if (this._hasTarget && this._lastVelocityTime != null && delta > 0 && delta < 0.2) {
      const blend = 1 - Math.exp(-delta / 0.06);
      const velocityX = (this._tgtPos.x - this._tgtPrevX) / delta;
      const velocityY = (this._tgtPos.y - this._tgtPrevY) / delta;
      const limit = this.worldUnitsPerPixelAtZ() * Math.max(this.videoMetrics().width, this.videoMetrics().height) * 1.5;
      const weight = Math.min(1, limit / Math.max(1e-8, Math.hypot(velocityX, velocityY)));
      this._velPx += (velocityX * weight - this._velPx) * blend;
      this._velPy += (velocityY * weight - this._velPy) * blend;
    } else {
      this._velPx = this._velPy = 0;
    }
    this._lastVelocityTime = timestamp;
    this._lastDetectionTime = this._applyingFrame?.sourceTime ?? timestamp;
    this._tgtPrevX = this._tgtPos.x;
    this._tgtPrevY = this._tgtPos.y;
    this._tgtPrevScale = this._tgtScale;
  }

  filterScale(scale, timestamp) {
    return Math.exp(this.filtScale.filter(Math.log(Math.max(1e-8, scale)), timestamp));
  }

  setTargetFromStage(xPx, yPx, scalePxPerLocalUnit, z = this._arPlaneZ) {
    this.stageToWorld(xPx, yPx, z, this._tgtPos);
    this._tgtScale = this.pixelScaleToWorld(scalePxPerLocalUnit, z);
  }

  landmarkToStage(point, metrics) {
    let x = metrics.offsetX + point.x * metrics.drawWidth;
    const y = metrics.offsetY + point.y * metrics.drawHeight;

    if (this.isMirrored) {
      x = metrics.width - x;
    }

    return {
      x: x - metrics.width / 2,
      y: -(y - metrics.height / 2)
    };
  }

  landmarkDistance(a, b, metrics) {
    const pa = this.landmarkToStage(a, metrics);
    const pb = this.landmarkToStage(b, metrics);
    return Math.hypot(pa.x - pb.x, pa.y - pb.y);
  }

  selectHand(result, metrics, baseIdx, tipIdx) {
    return this._handIdentity.choose(result, performance.now(), [0, 5, 9, 17, baseIdx, tipIdx]);
  }


  estimatePoseConfidence({
    landmarks,
    world,
    metrics,
    baseIdx,
    tipIdx,
    handWidthPx,
    handWidthM,
    imgLen,
    expectedFlatPx
  }) {
    // §4 pose error + jitter gate. MediaPipe can emit plausible-but-wrong
    // single frames when fingers overlap or leave the frame. Instead of
    // accepting every pose, score the measurement against simple projective
    // invariants before it is allowed to move the ring:
    //   - visibility/presence exists for the used landmarks,
    //   - hand and finger are large enough in screen pixels,
    //   - world-space hand dimensions remain anthropometrically plausible,
    //   - projected length never exceeds the flat world-length prediction.
    const used = [baseIdx, tipIdx, INDEX_MCP, PINKY_MCP, 0];
    const presence = used.reduce((sum, idx) => sum + handLandmarkValidity(landmarks[idx]), 0) / used.length;
    const base = landmarks[baseIdx];
    const tip = landmarks[tipIdx];
    const centerX = (base.x + tip.x) * 0.5;
    const centerY = (base.y + tip.y) * 0.5;
    const edgeDistance = Math.min(centerX, centerY, 1 - centerX, 1 - centerY);
    const edgeScore = smoothstep(0.02, 0.14, edgeDistance);
    const pixelScore = smoothstep(28, 88, handWidthPx) * smoothstep(16, 42, imgLen);
    const handWorldScore = 1 - smoothstep(0.05, 0.105, Math.abs(handWidthM - 0.082));
    const wBase = world[baseIdx];
    const wTip = world[tipIdx];
    const worldLen = Math.hypot(wTip.x - wBase.x, wTip.y - wBase.y, wTip.z - wBase.z);
    const fingerWorldScore = 1 - smoothstep(0.018, 0.055, Math.abs(worldLen - 0.045));
    const projectionRatio = imgLen / Math.max(1, expectedFlatPx);
    const projectionScore = (1 - smoothstep(1.04, 1.28, projectionRatio)) * smoothstep(0.08, 0.18, projectionRatio);

    return clamp(
      presence * 0.30 +
      edgeScore * 0.14 +
      pixelScore * 0.22 +
      handWorldScore * 0.14 +
      fingerWorldScore * 0.10 +
      projectionScore * 0.10,
      0,
      1
    );
  }

  // Smooth the contact-width prior and show the selected product dimensions.
  // The UI does not infer a personal ring size from these landmarks.
  _updateSizeReadout(handWidthM, now) {
    const ratio = FINGER_DIAMETER_RATIO[this.activeFinger] || FINGER_DIAMETER_RATIO.ring;
    const rawDia = handWidthM * ratio;                       // meters
    const dia = this.filtFingerDia.filter(rawDia, now);      // smoothed
    if (!this.sizeEl) return dia;
    const selectedUS = Number(this._physicalSpec?.ring?.sizeUS);
    const selectedDia = Number(this._physicalSpec?.ring?.innerDiameterMm);
    this.sizeEl.hidden = false;
    this.sizeValueEl.textContent = `Selected US ${selectedUS.toFixed(1)} · Ø ${selectedDia.toFixed(1)} mm`;
    this.sizeSubEl.textContent = this._measuredHandWidthMm
      ? "Manual knuckle reference · finger contact remains estimated"
      : "Approximate scale · not a ring-size measurement";
    return dia;
  }


  async startCamera() {
    this.cancelNeckPlacement();
    this._neckPlacementReference = null;
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera requires HTTPS and a supported browser.");
    this.resetFrameSession();
    this.resetTrackingFilters();
    if (this.ring) this.ring.visible = false;
    this.hideHandSilhouetteOccluder();
    this._cameraAbort?.abort();
    this._cameraAbort = new AbortController();
    const signal = this._cameraAbort.signal;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    const video = this.video;
    video.srcObject = null;
    const request = navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: this.facingMode }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } },
      audio: false
    });
    const stream = await new Promise((resolve, reject) => {
      const aborted = () => reject(new Error("Camera session cancelled."));
      signal.addEventListener("abort", aborted, { once: true });
      request.then((media) => {
        signal.removeEventListener("abort", aborted);
        if (signal.aborted) media.getTracks().forEach((track) => track.stop());
        else resolve(media);
      }, (error) => { signal.removeEventListener("abort", aborted); reject(error); });
      if (signal.aborted) aborted();
    });
    if (this._closed || signal.aborted) { stream.getTracks().forEach((track) => track.stop()); return; }
    this.stream = stream;
    video.srcObject = stream;
    await new Promise((resolve, reject) => {
      const cleanup = () => {
        video.removeEventListener("loadeddata", loaded);
        signal.removeEventListener("abort", aborted);
        clearTimeout(timeout);
      };
      const loaded = () => { cleanup(); resolve(); };
      const aborted = () => { cleanup(); reject(new Error("Camera session cancelled.")); };
      const timeout = setTimeout(() => { cleanup(); reject(new Error("Camera did not provide a frame.")); }, 12000);
      video.addEventListener("loadeddata", loaded, { once: true });
      signal.addEventListener("abort", aborted, { once: true });
      if (video.readyState >= 2) loaded();
      else if (signal.aborted) aborted();
    });
    if (this._closed || signal.aborted) return;
    await video.play();
    if (this._closed || signal.aborted) return;
    this.lastVideoTime = -1;
    this.lastDetectMs = 0;
    this.handLostFrames = 0;
    this._measuredHandWidthMm = 0;
    const measurement = this.modal.querySelector("[data-ar-measure]");
    if (measurement) measurement.value = "";
    this._handIdentity.reset();
    this.applyCameraClass();
    this.persistCalibration();
    if (this.scene) this.setupCameraBackground();
  }


  async flipCamera() {
    if (this._isRestartingCamera || this._closed) return;
    this._frozen = false;
    this.modal.querySelector("[data-ar-freeze]").textContent = "Freeze / adjust";
    this._isRestartingCamera = true;
    this.setStatus("Switching camera...");
    this.facingMode = this.facingMode === "user" ? "environment" : "user";
    this.applyCameraClass();
    try {
      await this.startCamera();
      if (this._closed) return;
      this.startVideoFrames();
      this.syncCalibrationControls();
      this.updateCameraProjection();
      this.resetTrackingFilters();
      if (this.ring) this.ring.visible = false;
      this.setStatus("");
    } catch (error) {
      this.facingMode = this.facingMode === "user" ? "environment" : "user";
      this.applyCameraClass();
      this.persistCalibration();
      this.setStatus("Could not switch camera.");
    } finally {
      this._isRestartingCamera = false;
    }
  }

  trackingMode() {
    if (this.pieceType === "Earrings") return "face";
    if (this.pieceType === "Necklace") return "pose";
    return "hand";
  }

  applyTrackingResult(result, detectCost = 0, timestamp = performance.now(), frame = null) {
    if (!result || !this.ring || this._closed || !Number.isFinite(timestamp)) return;
    const arrival = performance.now();
    if (!this._frozen && (arrival - timestamp > MAX_TRACKING_AGE_MS || timestamp > arrival + 10
      || (frame && !frameIsFresh(frame, arrival))
      || (frame && (frame.width !== this.video.videoWidth || frame.height !== this.video.videoHeight || frame.mirrored !== this.isMirrored))
      || (this._lastSourceTimestamp != null && timestamp <= this._lastSourceTimestamp))) {
      this._trackingTiming.droppedStale++;
      return;
    }
    if (this._frozen) this.resetTrackingFilters();
    if (!this._frozen) {
      this._lastSourceTimestamp = timestamp;
      this._lastResultAt = frame?.sourceTime ?? timestamp;
      if (frame) this._trackingTiming.record(frame, arrival, detectCost);
    }
    this._lastTrackingResult = result;
    this._applyingFrame = this._frozen ? null : frame;
    const filterTimestamp = this._frozen ? timestamp : frame?.filterTimestamp ?? timestamp;
    const metrics = this.videoMetrics();
    this.filtPx.jump = this.filtPy.jump = Math.max(metrics.width, metrics.height) * 0.08;
    try {
      if (this.pieceType === "Bracelet") {
        this.applyResultBracelet(result, filterTimestamp);
      } else if (this.pieceType === "Earrings") {
        this.applyResultEarrings(result, filterTimestamp);
      } else if (this.pieceType === "Necklace") {
        this.applyResultNecklace(result, filterTimestamp);
      } else {
        this.applyResult(result, filterTimestamp);
      }
    } finally { this._applyingFrame = null; }
    if (Number.isFinite(detectCost) && detectCost > 0) {
      this.updateDeltaBudget(detectCost);
    }
  }

  async startMediaPipe() {
    const canUseWorker = typeof Worker !== "undefined" && typeof createImageBitmap === "function";
    if (canUseWorker) {
      try {
        await this.startTrackingWorker();
        return;
      } catch (error) {
        console.warn("[AR] Tracking worker unavailable; using main-thread fallback:", error);
      }
    }
    if (!this._closed) await this.startMediaPipeOnMainThread();
  }

  async startTrackingWorker() {
    if (this._trackingWorkerReady) return;

    const worker = new Worker(new URL("./ar-tracking-worker.js?v=20260912-ar-placement", import.meta.url), { type: "module" });
    this._trackingWorker = worker;
    this._trackingWorkerBusy = false;
    this._pendingTrackingFrame = null;
    this._trackingWorkerFallbackStarted = false;

    await new Promise((resolve, reject) => {
      let settled = false;
      const finishReject = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        worker.terminate();
        if (this._trackingWorker === worker) this._trackingWorker = null;
        reject(error instanceof Error ? error : new Error(String(error)));
      };
      const timeoutId = setTimeout(() => finishReject(new Error("Tracking worker initialization timed out.")), 12000);

      this._cancelWorkerInit = () => finishReject(new Error("AR session closed."));
      worker.onmessage = (event) => {
        if (this._closed || this._trackingWorker !== worker) return;
        const message = event.data || {};
        if (message.type === "ready") {
          if (!settled) {
            settled = true;
            clearTimeout(timeoutId);
            this._trackingWorkerReady = true;
            resolve();
          }
          return;
        }

        if (message.type === "result") {
          const pending = this.finishTrackingFrame(message, worker);
          if (!pending || message.generation !== this._frameGate.generation) return;
          if (!this._frozen && this._frameGate.accept(message, performance.now())) {
            this.applyTrackingResult(message.result, Number(message.detectCost) || 0, message.timestamp, pending.frame);
          } else if (!this._frozen) this._trackingTiming.droppedStale++;
          return;
        }

        if (message.type === "error") {
          if (message.phase === "frame") {
            const pending = this.finishTrackingFrame(message, worker);
            if (!pending || message.generation !== this._frameGate.generation) return;
          }
          const error = new Error(message.message || "Tracking worker failed.");
          if (!this._trackingWorkerReady) {
            finishReject(error);
          } else {
            console.warn(`[AR] Tracking worker ${message.phase || "runtime"} failure:`, error);
            this.fallbackToMainThreadTracking(error);
          }
        }
      };

      worker.onerror = (event) => {
        if (this._closed || this._trackingWorker !== worker) return;
        const error = new Error(event?.message || "Tracking worker script failed.");
        if (!this._trackingWorkerReady) finishReject(error);
        else this.fallbackToMainThreadTracking(error);
      };

      worker.postMessage({
        type: "init",
        config: {
          mode: this.trackingMode(),
          mediaPipeBase: MEDIAPIPE_BASE,
          wasmBase: WASM_BASE,
          handModelUrl: MODEL_URL,
          faceModelUrl: FACE_MODEL_URL,
          poseModelUrl: POSE_MODEL_URL,
          trackForearm: this.pieceType === "Bracelet",
          forearmModelUrl: FOREARM_MODEL_URL
        }
      });
    });
  }

  async fallbackToMainThreadTracking(error) {
    if (this._trackingWorkerFallbackStarted || this._closed) return;
    this._trackingWorkerFallbackStarted = true;
    this._trackingWorkerReady = false;
    this._trackingWorkerBusy = false;
    this._pendingTrackingFrame = null;
    this._trackingWorker?.terminate();
    this._trackingWorker = null;

    try {
      await this.startMediaPipeOnMainThread();
      this.setStatus("");
    } catch (fallbackError) {
      console.error("[AR] Tracking fallback failed:", fallbackError, error);
      this.setStatus("Tracking could not restart on this device.");
    }
  }

  finishTrackingFrame(message, worker) {
    const pending = this._pendingTrackingFrame;
    if (!pending || pending.worker !== worker || message.generation !== pending.generation
      || message.frameId !== pending.frameId) return null;
    this._pendingTrackingFrame = null;
    this._trackingWorkerBusy = false;
    return message.timestamp === pending.frame.sampledAt ? pending : null;
  }

  sendFrameToTrackingWorker(frame) {
    if (!this._trackingWorkerReady || !this._trackingWorker || this._trackingWorkerBusy) return;
    this._trackingWorkerBusy = true;
    const worker = this._trackingWorker;
    const frameId = ++this._trackingFrameId;
    const generation = this._frameGate.generation;
    const pending = { worker, frameId, generation, frame };
    this._pendingTrackingFrame = pending;
    const isCurrent = () => !this._closed && generation === this._frameGate.generation
      && this._trackingWorkerReady && this._trackingWorker === worker && this._pendingTrackingFrame === pending;
    const release = () => {
      if (this._pendingTrackingFrame !== pending) return;
      this._pendingTrackingFrame = null;
      this._trackingWorkerBusy = false;
    };
    const failed = (error) => {
      const current = isCurrent();
      release();
      if (!current) return;
      console.warn("[AR] Could not transfer camera frame to tracking worker:", error);
      this.fallbackToMainThreadTracking(error);
    };

    // Invoke the snapshot while still processing this frame's callback. Guard
    // both synchronous failure and late promise settlement by job ownership.
    let snapshot;
    try { snapshot = createImageBitmap(this.video); }
    catch (error) { failed(error); return; }
    Promise.resolve(snapshot).then((bitmap) => {
      if (!isCurrent() || !frameIsFresh(frame, performance.now())) {
        bitmap.close?.();
        if (isCurrent()) this._trackingTiming.droppedStale++;
        release();
        return;
      }
      try { worker.postMessage({ type: "frame", bitmap, timestamp: frame.sampledAt, frame, frameId, generation }, [bitmap]); }
      catch (error) { bitmap.close(); throw error; }
    }).catch(failed);
  }

  async startMediaPipeOnMainThread() {
    const vision = await import(`${MEDIAPIPE_BASE}/vision_bundle.mjs`);
    const fileset = await vision.FilesetResolver.forVisionTasks(WASM_BASE);
    if (this._closed) return;
    const mode = this.trackingMode();
    const trackerClass = mode === "face" ? vision.FaceLandmarker : mode === "pose" ? vision.PoseLandmarker : vision.HandLandmarker;
    const options = mode === "face" ? { numFaces: 1, outputFacialTransformationMatrixes: true }
      : mode === "pose" ? { numPoses: 1 } : { numHands: 2 };
    const tracker = await trackerClass.createFromOptions(fileset, {
      ...options, runningMode: "VIDEO",
      baseOptions: { modelAssetPath: mode === "face" ? FACE_MODEL_URL : mode === "pose" ? POSE_MODEL_URL : MODEL_URL, delegate: "CPU" }
    });
    if (this._closed) { tracker.close(); return; }
    this[mode === "face" ? "faceLandmarker" : mode === "pose" ? "poseLandmarker" : "handLandmarker"] = tracker;
    this.detectInterval = Math.max(this.detectInterval, 1000 / 20);
  }


  addWearableBody() {
    const neck = this.ring.userData.wearable.neck;
    if (this.pieceType === "Necklace" && neck?.fits) {
      if (!this._neckContactBody) {
        this._neckContactBody = new NeckContactBody();
        this.scene.add(this._neckContactBody);
      }
    }
    if (this.pieceType === "Earrings") {
      const proxy = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true }));
      proxy.scale.set(0.065, 0.10, 0.070);
      proxy.position.set(0, -0.01, 0.008);
      this._headOccluder = proxy;
      this._faceOccluder = createFaceOccluder();
      this.ring.add(this._faceOccluder);
      proxy.renderOrder = -100;
      this.ring.add(proxy);
    }
  }

  rebuildNecklace() {
    let next;
    try {
      const piece = window.__tjcDesigner.buildPiece(this._designState, { wearable: true, neckCircumferenceMm: this._neckCircumferenceMm });
      next = createWearableAsset(piece, this._designState);
    } catch (error) { this.setStatus(error.message); return; }
    const previous = this.ring;
    this._wearable?.renderBatches.dispose();
    this._wearable = next;
    this.ring = next.pose;
    const bounds = new THREE.Box3().setFromObject(this.ring);
    this.prepareNecklaceFit(bounds.getSize(new THREE.Vector3()));
    this.addWearableBody();
    this._articulation = new WearableArticulation(this.ring);
    this.scene.remove(previous);
    disposeObjectTree(previous);
    this.scene.add(this.ring);
    if (this.scene.environment) configureWearableGemOptics(next, this._designState);
    this.ring.visible = false;
    this.resetTrackingFilters();
    if (this._frozen && this._lastTrackingResult) this.applyTrackingResult(this._lastTrackingResult);
  }

  startThree() {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    const stage = this.modal.querySelector(".ar-tryon-stage");
    const rect = stage.getBoundingClientRect();

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(rect.width, rect.height, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    this.scene = new THREE.Scene();
    this._renderTiming.reset();
    // Runs before render-list collection, including freeze/adjust renders.
    this.scene.onBeforeRender = () => this._wearable?.renderBatches.sync();

    // Perspective compositing camera. Landmark math remains in stage pixels,
    // then stageToWorld() projects those pixels onto a stable AR plane. Unlike
    // the old orthographic camera, near/far sides of a tilted ring now receive
    // real perspective foreshortening.
    this._cameraFovDeg = this.currentCameraFov();
    this.camera = new THREE.PerspectiveCamera(
      this._cameraFovDeg,
      rect.width / Math.max(rect.height, 1),
      0.01,
      10
    );
    this.camera.position.set(0, 0, 1);
    this.camera.lookAt(0, 0, this._arPlaneZ);

    // Neutral reference rig: direction is a prior, not inferred from skin
    // texture. Camera appearance scales this rig and the HDR together.
    this._hemi = new THREE.HemisphereLight(0xffffff, 0x555555, 0.45);
    this.scene.add(this._hemi);
    this._key = new THREE.DirectionalLight(0xffffff, 1.05);
    this._key.position.set(0.8, 1.0, 0.6);
    this.scene.add(this._key);
    this._fill = new THREE.DirectionalLight(0xffffff, 0.35);
    this._fill.position.set(-0.7, 0.4, 0.5);
    this.scene.add(this._fill);
    this._rim = new THREE.DirectionalLight(0xffffff, 0.25);
    this._rim.position.set(-0.2, 0.6, -1);
    this.scene.add(this._rim);
    this._lightProbe = document.createElement("canvas");
    this._lightProbe.width = 48;
    this._lightProbe.height = 32;
    this._lightProbeCtx = this._lightProbe.getContext("2d", { willReadFrequently: true });
    this.setupHandSilhouetteOccluder();

    const state = this._designState;
    const factory = window.__tjcDesigner?.buildPiece;
    if (!factory) throw new Error("The full jewellery designer is not ready.");
    const piece = factory(state, { wearable: true, neckCircumferenceMm: this._neckCircumferenceMm || 320, wristWidthMm: this._wristWidthMm || 55 });
    this._wearable = createWearableAsset(piece, state);
    this.ring = this._wearable.pose;
    this._articulation = new WearableArticulation(this.ring);
    this._physicalSpec = this._wearable.spec;
    this._unitsPerMm = 0.001;
    this._ringLocalInnerR = this._wearable.innerRadius;
    this._ringLocalOuterR = this._wearable.outerRadius;
    const bounds = new THREE.Box3().setFromObject(this.ring);
    const pieceSize = bounds.getSize(new THREE.Vector3());
    if (this.pieceType === "Necklace") this.prepareNecklaceFit(pieceSize);
    this.ring.traverse((node) => {
      if (!node.isMesh) return;
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        if ("envMapIntensity" in material) material.envMapIntensity = Math.min(material.envMapIntensity ?? 1, 1.15);
      }
    });


    this.scene.add(this.ring);
    this.ring.visible = false;

    // Finger and wrist depth bodies are owned by the scene, independently
    // of the jewellery. Contact-shadow geometry remains local to the band.
    if (this.pieceType === "Ring" || this.pieceType === "Bracelet") {
    const fingerR = this._ringLocalInnerR * 0.94;
    this._occluderBaseRadius = fingerR;
    this._targetFingerLocalRadius = fingerR;
    /* ----- soft contact shadow -----
     * A radial-gradient plane oriented in the ring's local XZ plane
     * (normal = +Y = stone direction). It draws between the occluder
     * (renderOrder -100) and the ring band (renderOrder 0) with
     * depthTest off, so it appears as a soft dark halo on the finger
     * surface AROUND the band's outline — the visual cue that the ring
     * is sitting on the finger rather than floating in front of it.
     *
     * The plane is elongated along the finger axis (Z) so the shadow
     * reads as a contact shadow on a cylindrical finger, not a generic
     * blob. It rotates with the ring (so the long axis always tracks
     * the finger) and tilts with pitch (so the shadow foreshortens
     * naturally when the finger points toward camera).
     *
     * Texture is a 256² radial gradient baked once into a CanvasTexture
     * — no runtime cost beyond a single tex sample per shadow fragment. */
    const shadowTex = makeShadowTexture();
    const shadowGeom = new THREE.PlaneGeometry(this._ringLocalOuterR * 2.6, this._ringLocalOuterR * 4.8);
    shadowGeom.rotateX(-Math.PI / 2);  // lay flat in local XZ
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      opacity: 0.22,
      side: THREE.DoubleSide,
      color: 0x000000   // shadow texture is grey-alpha; multiply to pure black
    });
    this._shadow = new THREE.Mesh(shadowGeom, shadowMat);
    this._shadow.renderOrder = -50;
    this._shadow.frustumCulled = false;
    this._shadowBaseOpacity = shadowMat.opacity;
    this._targetShadowOpacity = shadowMat.opacity;
    this._targetShadowScaleX = 1;
    this._targetShadowScaleZ = 1;
    this.ring.add(this._shadow);
    }
    this.addWearableBody();


    // Async HDR environment for PBR reflections — the ring looks plasticky
    // without it. Don't block ring visibility on the load; lights cover until
    // PMREM is ready.
    this._loadEnvironment().catch(err => console.warn("[AR] env load failed:", err));

    this._onResize = () => {
      const r = stage.getBoundingClientRect();
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
      this.renderer.setSize(r.width, r.height, false);
      this.camera.aspect = r.width / Math.max(r.height, 1);
      this.camera.updateProjectionMatrix();
      this.syncHandSilhouettePlane();
      if (this.pieceType === "Necklace" && this._frozen && this._lastTrackingResult) this.applyTrackingResult(this._lastTrackingResult);
    };
    window.addEventListener("resize", this._onResize);
  }

  async _loadEnvironment() {
    return new Promise((resolve, reject) => {
      new RGBELoader().load(HDR_URL, (tex) => {
        if (!this.renderer || this._closed) { tex.dispose(); return resolve(); }
        const pmrem = new THREE.PMREMGenerator(this.renderer);
        pmrem.compileEquirectangularShader();
        const envRT = pmrem.fromEquirectangular(tex);
        // HDR supplies reflection structure; the shared camera appearance
        // gain controls its intensity without rebuilding this texture.
        this.scene.environment = envRT.texture;
        this._envRT = envRT;
        tex.dispose();
        pmrem.dispose();
        configureWearableGemOptics(this._wearable, this._designState);
        resolve();
      }, undefined, reject);
    });
  }

  sampleVideoLighting(now) {
    if (!this.video || !this._lightProbeCtx || !this.renderer || this._frozen || this._suspended
      || this._isRestartingCamera || this.video.readyState < 2 || now - this._lastLightSample < 260
      || this.video.currentTime === this._appearanceLighting.lastFrame) return;
    this._lastLightSample = now;
    const roi = this._hasTarget && this.ring?.visible ? this._lastStageNorm : null;
    const region = cameraProbeRegion(this.video.videoWidth, this.video.videoHeight, this.videoMetrics(), roi, this.isMirrored);
    if (!region) return;
    const { width, height } = this._lightProbe;
    try {
      this._lightProbeCtx.drawImage(this.video, region.sx, region.sy, region.sw, region.sh, 0, 0, width, height);
      const pixels = this._lightProbeCtx.getImageData(0, 0, width, height).data;
      const observation = measureCameraAppearance(pixels, width, height, region.roi);
      if (this._appearanceLighting.observe(observation, this.video.currentTime)) {
        applyAppearanceLighting(this.scene, this.renderer, {
          hemi: this._hemi, key: this._key, fill: this._fill, rim: this._rim
        }, this._appearanceLighting.gain);
      }
    } catch {
      // An unavailable frame retains the last valid appearance, rather than
      // brightening the object or reusing a failed measurement.
    }
  }

  updateDeltaBudget(detectCost) {
    // §12 delta-tile compute: MediaPipe is the expensive tile. When the hand
    // is stable and pose confidence is high, spend fewer detector calls and
    // let rAF interpolation carry the motion. When motion rises, increase the
    // detector budget. Detection cost is folded in so slower phones back off
    // automatically instead of dropping render frames.
    this._detectCostEMA = lerp(this._detectCostEMA, detectCost, 0.18);
    const overload = smoothstep(18, 34, this._detectCostEMA);
    const motion = clamp(this._motionEnergy, 0, 1);
    const confidence = clamp(this._poseConfidenceTarget, 0, 1);
    const stableDiscount = confidence > 0.86 && motion < 0.10 ? 7 : 0;
    const targetFps = clamp(
      23 + motion * 18 + (1 - confidence) * 5 - overload * 9 - stableDiscount,
      MIN_DETECTION_FPS,
      MAX_DETECTION_FPS
    );
    const targetInterval = 1000 / targetFps;
    this.detectInterval += (targetInterval - this.detectInterval) * 0.22;
  }

  updateContactVisuals(dt) {
    if (!this.ring) return;
    const a = 1 - Math.exp(-dt / 0.075);
    const confidence = this.ring.visible ? clamp(this._poseConfidence, 0, 1) : 0;
    const localRadius = Math.max(1e-3, this._targetFingerLocalRadius || this._occluderBaseRadius || 1);

    if (this._occluder && this._occluderBaseRadius) {
      // §5 signed-distance contact: the depth-only cylinder is the tracked
      // finger body B. Resize it from measured finger diameter so ring/skin
      // occlusion follows the user's actual hand instead of a fixed proxy.
      const radialScale = clamp(localRadius / this._occluderBaseRadius, 0.64, 1.42);
      const scaleX = this._targetOccluderScaleX || radialScale;
      const scaleY = this._targetOccluderScaleY || radialScale;
      this._occluder.scale.x += (scaleX - this._occluder.scale.x) * a;
      this._occluder.scale.y += (scaleY - this._occluder.scale.y) * a;
      this._occluder.scale.z = 1;
    }

    if (this._shadow?.material) {
      const targetOpacity = (this._targetShadowOpacity || 0) * (0.18 + confidence * 0.82);
      this._shadow.material.opacity += (targetOpacity - this._shadow.material.opacity) * a;
      this._shadow.position.y += ((localRadius + this._ringLocalOuterR * 0.02) - this._shadow.position.y) * a;
      this._shadow.scale.x += (((this._targetShadowScaleX || 1) * (this._targetShadowScaleY || 1)) - this._shadow.scale.x) * a;
      this._shadow.scale.z += ((this._targetShadowScaleZ || 1) - this._shadow.scale.z) * a;
      this._shadow.visible = this._shadow.material.opacity > 0.025;
    }

    if (this._neckShadow?.material) {
      const targetOpacity = (this._targetNeckShadowOpacity || 0) * (0.20 + confidence * 0.80);
      this._neckShadow.material.opacity += (targetOpacity - this._neckShadow.material.opacity) * a;
      this._neckShadow.scale.x += ((this._targetNeckShadowScaleX || 1) - this._neckShadow.scale.x) * a;
      this._neckShadow.scale.y += ((this._targetNeckShadowScaleY || 1) - this._neckShadow.scale.y) * a;
      this._neckShadow.visible = this._neckShadow.material.opacity > 0.018;
    }
  }


  fingerLandmarks() {
    switch (this.activeFinger) {
      case "index": return [5, 6];
      case "middle": return [9, 10];
      case "pinky": return [17, 18];
      case "ring":
      default: return [RING_MCP, RING_PIP];
    }
  }

  loop = () => {
    if (this._closed || !this.renderer) return;
    this.rafId = requestAnimationFrame(this.loop);
    if (!this.video || this.video.readyState < 2 || this._suspended) { this._renderTiming.pause(); return; }
    if (!this.video.requestVideoFrameCallback) this.processVideoFrame(performance.now());
    // Main-thread inference can block; render age and interpolation must use
    // the clock after it returns, rather than the pre-inference rAF time.
    const now = performance.now();
    const dt = this._lastRafTime ? Math.min(0.1, (now - this._lastRafTime) / 1000) : 0.016;
    if (!this._frozen && this._lastResultAt != null && now - this._lastResultAt > MAX_TRACKING_AGE_MS) {
      this.ring.visible = false;
      this._lastResultAt = null;
      this.resetTrackingFilters();
      this.hideHandSilhouetteOccluder();
      this.setStatus("Tracking lost. Keep the target clearly in view.");
    }


    /* Per-rAF pose interpolation toward the latest target. Exponential
     * follow with τ ≈ 55ms → catches up to ~95% in ~165ms, which feels
     * locked but never twitchy. Critically dt-aware so it stays correct
     * if rAF drops to 30fps.
     *
     * §4 motion-aware: tighten τ during high-motion + high-confidence
     * frames so the ring sticks to a fast-moving hand instead of trailing
     * behind. At low motion τ stays in the smoothing band (cleans residual
     * detector noise); at high motion τ contracts toward ~25ms so the ring
     * locks. Low-confidence frames keep the original wide τ — we don't
     * want a bad detection yanking the ring across the screen.
     */
    this._poseConfidence += (this._poseConfidenceTarget - this._poseConfidence) * (1 - Math.exp(-dt / 0.11));
    if (this._hasTarget && this.ring && this.ring.visible) {
      const conf = clamp(this._poseConfidence, 0, 1);
      const baseTau = lerp(0.042, 0.095, 1 - conf);
      const motionTighten = lerp(1.0, 0.55, clamp(this._motionEnergy, 0, 1) * conf);
      const followTau = baseTau * motionTighten;
      const alpha = 1 - Math.exp(-dt / followTau);
      // Bounded extrapolation from the last valid pose's observed frame time.
      // Capture time is used only when the browser actually reports it.
      const prediction = predictionSeconds(now - this._lastDetectionTime, Math.min(conf, this._poseConfidenceTarget), this._frozen);
      const offsetX = this._velPx * prediction;
      const offsetY = this._velPy * prediction;
      const limit = this.worldUnitsPerPixelAtZ() * 6;
      const weight = Math.min(1, limit / Math.max(1e-8, Math.hypot(offsetX, offsetY)));
      this._predTgtPos.set(this._tgtPos.x + offsetX * weight, this._tgtPos.y + offsetY * weight, this._tgtPos.z);
      const predScale = this._tgtScale;
      this.ring.position.lerp(this._predTgtPos, alpha);
      this.ring.quaternion.slerp(this._tgtQuat, alpha);
      const cs = this.ring.scale.x;
      this.ring.scale.setScalar(cs + (predScale - cs) * alpha);
    }
    this._lastRafTime = now;
    this.syncHandContactDisplay();
    this._wearable?.updateOpticalScale();
    if (!this._frozen && this._hasTarget) this._articulation?.update(dt, this.modal.querySelector("[data-ar-motion]").checked);
    this.updateContactVisuals(dt);
    this.updateQualityReadout();
    this.sampleVideoLighting(now);
    const renderStart = performance.now();
    this.renderer.render(this.scene, this.camera);
    this._renderTiming.record(renderStart, performance.now(), this.renderer.info.render, this.renderer.getPixelRatio());
  };

  applyResult(result, now = performance.now()) {
    const [baseIdx, tipIdx] = this.fingerLandmarks();
    const metrics = this.videoMetrics();
    const selected = this.selectHand(result, metrics, baseIdx, tipIdx);
    const landmarks = selected?.landmarks;
    const world = selected?.world;

    if (!landmarks || !world) {
      this.handLostFrames++;
      this._poseConfidenceTarget = 0;
      if (this.handLostFrames > 8) {
        this.ring.visible = false;
        this._hasTarget = false;  // snap on re-acquire, don't lerp from stale
        if (this.sizeEl) this.sizeEl.hidden = true;
        if (this.qualityEl) this.qualityEl.hidden = true;
        if (this.handLostFrames === 9) this.setStatus("Show your hand to the camera");
        this.hideHandSilhouetteOccluder();
      }
      return;
    }
    this.handLostFrames = 0;

    /* ============================================================
     * POSE STRATEGY (rewrite)
     * ------------------------------------------------------------
     * Old approach built a full 3D basis from worldLandmarks cross
     * products, which amplified per-frame noise in the depth (z)
     * channel and produced visible jitter + occasional flips.
     *
     * New approach decomposes into three low-noise scalars:
     *   1. (px, py)   — image-space midpoint of MCP↔PIP (very stable)
     *   2. angle      — in-plane finger direction from atan2 (stable)
     *   3. pitch      — out-of-plane tilt from foreshortening of the
     *                   image projection vs the world-space length
     *                   (noisier than 1+2, smoothed harder)
     * Each scalar is smoothed independently, then a deterministic
     * basis is reconstructed AFTER smoothing. No more quaternion
     * channel-wise filtering, no hemisphere flips, no cross product
     * noise amplification.
     * ============================================================ */

    /* --- pixels-per-meter calibration (knuckle line) --- */
    const idxImg = landmarks[INDEX_MCP];
    const pkyImg = landmarks[PINKY_MCP];
    const handWidthPx = this.landmarkDistance(idxImg, pkyImg, metrics);
    const reference = palmScale(landmarks, world, metrics, this._measuredHandWidthMm);
    if (!reference) { this._poseConfidenceTarget = 0; return; }
    const handWidthM = reference.widthM;
    const pxPerMeter = reference.pixelsPerMeter;
    const fingerDiameterM = this._updateSizeReadout(handWidthM, now);

    /* --- 2D position (mirrored: video is CSS-flipped, overlay is not) --- */
    const baseImg = landmarks[baseIdx];
    const tipImg = landmarks[tipIdx];
    const basePoint = this.landmarkToStage(baseImg, metrics);
    const tipPoint = this.landmarkToStage(tipImg, metrics);
    const baseX = basePoint.x;
    const baseY = basePoint.y;
    const tipX = tipPoint.x;
    const tipY = tipPoint.y;
    // Ring sits near the base of the proximal phalanx, closer to MCP than
    // PIP. That is where real rings rest once contact/fit is solved.
    const tParam = FINGER_RING_SEAT_T[this.activeFinger] || FINGER_RING_SEAT_T.ring;
    let rawPx = baseX + (tipX - baseX) * tParam;
    let rawPy = baseY + (tipY - baseY) * tParam;

    /* --- in-plane finger angle (image space) --- */
    const dx = tipX - baseX;
    const dy = tipY - baseY;
    const imgLen = Math.hypot(dx, dy) || 1;
    const fx = dx / imgLen;
    const fy = dy / imgLen;
    // We mirror the X axis of the source (selfie view), so the in-plane
    // sense is already correct.
    rawPx += -fy * this.calibration.side;
    rawPy += fx * this.calibration.side + this.calibration.lift;

    const wBase = world[baseIdx];
    const wTip = world[tipIdx];
    const worldLen = Math.hypot(wTip.x - wBase.x, wTip.y - wBase.y, wTip.z - wBase.z) || 0.04;
    const rawPitch = Math.asin(clamp(-(wTip.z - wBase.z) / worldLen, -0.985, 0.985));
    const expectedFlatPx = worldLen * pxPerMeter;
    this._lastHandRoll = estimateHandRoll(world, selected.handedness, this.isMirrored, fx, fy, rawPitch, this._lastHandRoll);
    const rawRoll = this._lastHandRoll + THREE.MathUtils.degToRad(this.calibration.roll || 0);

    const confidenceRaw = this.estimatePoseConfidence({
      landmarks,
      world,
      metrics,
      baseIdx,
      tipIdx,
      handWidthPx,
      handWidthM,
      imgLen,
      expectedFlatPx
    });
    const confidence = this.filtConfidence.filter(confidenceRaw, now);
    this._poseConfidenceTarget = confidence;
    if (confidence < 0.22) {
      this._badPoseFrames += 1;
      if (this._badPoseFrames > 5) {
        this.ring.visible = false;
        this._hasTarget = false;
        this.hideHandSilhouetteOccluder();
        this.setStatus("Hold your hand steady in the camera");
      }
      return;
    }
    this._badPoseFrames = 0;
    if (this.handLostFrames > 0) this.setStatus("");
    this.setStatus("");
    this.ring.visible = true;

    /* --- physical product scale, separate from inferred body width --- */
    const localOuterR = this._ringLocalOuterR || 1.0;
    const localInnerR = this._ringLocalInnerR || localOuterR * 0.84;
    // The object already contains the selected physical ring dimensions. Scale
    // local units to camera pixels using MediaPipe's px-per-metre estimate; do
    // NOT resize the ring to force it onto every finger. A US 7 now remains a
    // US 7 and visible looseness/tightness is honest.
    const metersPerLocalUnit = METERS_PER_MM / Math.max(this._unitsPerMm, 1e-6);
    const rawScale = pxPerMeter * metersPerLocalUnit * this.calibration.fit;

    /* --- smooth each scalar independently --- */
    const px = this.filtPx.filter(rawPx, now);
    const py = this.filtPy.filter(rawPy, now);
    const s = this.filterScale(rawScale, now);
    // Angle: filter sin & cos separately so the ±π wrap doesn't cause a
    // pop. Then re-derive the angle's components from the smoothed pair.
    const direction = this.filterDirection(fx, fy, now);
    const fxN = direction.x;
    const fyN = direction.y;
    const pitch = this.filtPitch.filter(rawPitch, now);
    const roll = this.filtRoll.filter(rawRoll, now);
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);
    const cosR = Math.cos(roll);
    const sinR = Math.sin(roll);

    /* --- reconstruct basis AFTER smoothing ---
     * Local axis mapping (designer + simple ring both use this convention):
     *   +Z = finger axis (band axis through the ring's hole)
     *   +Y = "up" — points toward the stone/head
     *   +X = sideways (set/shank tangent)
     *
     * §4 pose — true 3D basis.
     * At pitch=0 the finger lies in the screen plane and the stone faces
     * the CAMERA:
     *   +Z (finger) = (fxN, fyN, 0)
     *   +Y (stone)  = (0, 0, 1)        [out of screen toward viewer]
     *   +X (right)  = +Y × +Z = (-fyN, fxN, 0)
     *
     * `pitch` is rotation OF THE WHOLE BASIS about the side axis +X (which
     * itself stays in the screen plane and is invariant under pitch). With
     * +pitch = tip toward camera, the rotated basis is:
     *   +Z' = (fxN·cos,  fyN·cos,  sin)   — finger axis tilts into depth
     *   +Y' = (-fxN·sin, -fyN·sin, cos)   — stone direction follows
     *   +X  = (-fyN,      fxN,     0)     — UNCHANGED (rotation axis)
     *
     * This is the fix for "ring keeps turning away when hand is straight
     * out": previously +Z was hard-coded to the screen-plane (fxN,fyN,0)
     * for all pitches, so when the finger pointed at the camera the band's
     * cylinder axis stayed sideways and the stone rolled to a garbage
     * orientation. The new basis is a proper SO(3) rotation.
     *
     * Then roll +X/+Y around +Z' so the stone follows the hand's dorsal
     * surface. */
    this._vRight.set(-fyN, fxN, 0);
    this._vUp.set(-fxN * sinP, -fyN * sinP, cosP);
    this._vFwd.set(fxN * cosP, fyN * cosP, sinP);
    this._vTmpA.copy(this._vRight);
    this._vTmpB.copy(this._vUp);
    this._vRight.copy(this._vTmpA).multiplyScalar(cosR).addScaledVector(this._vTmpB, -sinR).normalize();
    this._vUp.copy(this._vTmpA).multiplyScalar(sinR).addScaledVector(this._vTmpB, cosR).normalize();
    this._mat.makeBasis(this._vRight, this._vUp, this._vFwd);

    const posNormX = clamp((px + metrics.width / 2) / metrics.width, 0, 1);
    const posNormY = clamp((metrics.height / 2 - py) / metrics.height, 0, 1);
    this._lastStageNorm = { x: posNormX, y: posNormY };

    // §12 local delta energy: the expensive detector updates target pose only
    // when this energy rises. It also drives phase sparkle and follow speed.
    if (this._lastPoseForDelta) {
      const prev = this._lastPoseForDelta;
      const posDelta = Math.hypot(rawPx - prev.x, rawPy - prev.y) / Math.max(metrics.width, metrics.height);
      const scaleDelta = Math.abs(rawScale - prev.scale) / Math.max(1e-3, prev.scale);
      const angleDelta = Math.acos(clamp(fx * prev.fx + fy * prev.fy, -1, 1));
      const pitchDelta = Math.abs(rawPitch - prev.pitch);
      const rollDelta = Math.abs(rawRoll - prev.roll);
      const poseDelta = clamp(posDelta * 8.5 + scaleDelta * 2.4 + angleDelta * 0.9 + pitchDelta * 0.55 + rollDelta * 0.38, 0, 1);
      this._poseDeltaEnergy = poseDelta;
      this._motionEnergy += (poseDelta - this._motionEnergy) * 0.30;
    }
    this._lastPoseForDelta = { x: rawPx, y: rawPy, scale: rawScale, fx, fy, pitch: rawPitch, roll: rawRoll };

    // §4 jitter residual on FILTERED pose. ‖T_t T_{t-1}^{-1} - I‖ approximated
    // by per-frame deltas of the smoothed scalars, normalised to a unitless
    // value in roughly [0,1]. Heavy weight on translation (the most visible
    // jitter), lighter on angle/pitch/roll because those are filtered harder.
    if (this._lastFilteredPose) {
      const fp = this._lastFilteredPose;
      const jPos = Math.hypot(px - fp.px, py - fp.py) / Math.max(metrics.width, metrics.height);
      const jAng = Math.acos(clamp(fxN * fp.fxN + fyN * fp.fyN, -1, 1));
      const jPit = Math.abs(pitch - fp.pitch);
      const jRol = Math.abs(roll - fp.roll);
      const jScl = Math.abs(s - fp.s) / Math.max(1e-3, fp.s);
      const jit = clamp(jPos * 22 + jAng * 1.8 + jPit * 1.2 + jRol * 0.8 + jScl * 4, 0, 1);
      this._jitterEMA += (jit - this._jitterEMA) * 0.18;
    }
    this._lastFilteredPose = { px, py, fxN, fyN, pitch, roll, s };

    const fingerRadiusPx = Math.max(1, fingerDiameterM * 0.5 * pxPerMeter);
    const fingerLocalRadius = fingerDiameterM * 0.5 / this.calibration.fit;
    this._targetFingerLocalRadius = fingerLocalRadius;
    const selectedInnerRadiusPx = localInnerR * s;
    const fitError = (selectedInnerRadiusPx - fingerRadiusPx) / Math.max(fingerRadiusPx, 1);
    const contactError = Math.abs(fitError);
    const contactScore = (1 - smoothstep(0.035, 0.18, contactError)) * fingerContactWeight({
      side: this.calibration.side, lift: this.calibration.lift, directionX: fx, directionY: fy,
      radius: fingerRadiusPx, length: imgLen, seat: tParam
    });
    this._ringFitError = fitError;
    this._targetShadowOpacity = (this._shadowBaseOpacity || 0.85) * contactScore * clamp(0.50 + confidence * 0.55, 0, 1);
    const occluderBase = this._occluderBaseRadius || this._targetFingerLocalRadius;
    this._targetShadowScaleX = clamp(this._targetFingerLocalRadius / occluderBase, 0.72, 1.42);
    this._targetOccluderScaleX = this._targetShadowScaleX;
    this._targetOccluderScaleY = this._targetOccluderScaleX;
    this._targetShadowScaleY = 1;
    this._targetShadowScaleZ = clamp(0.94 + Math.abs(pitch) * 0.24 + this._motionEnergy * 0.16, 0.86, 1.42);

    // Keep the jewellery target separate from the body; no artificial skin
    // compression or product resizing is applied to manufacture a snug fit.
    this.setTargetFromStage(px, py, s);
    this._tgtQuat.setFromRotationMatrix(this._mat);
    this._stoneNormalZ = this._vUp.z;
    this.updateHandSilhouetteOccluder(landmarks, metrics, handWidthM * pxPerMeter, rawPx, rawPy, rawScale, fx, fy, rawPitch, rawRoll, fingerRadiusPx);
    if (this._fingerContactBody && !this._fingerContactBody.valid) this._targetShadowOpacity = 0;

    // §4 predictor — update pose velocity from the inter-detection delta.
    // We track velocity of the FILTERED target pose (so velocity inherits
    // the One-Euro denoising) rather than raw landmark velocity. Light EMA
    // (α=0.45) on the velocity itself keeps it from whipping around when a
    // single detection happens to land slightly off.
    this.updatePoseVelocity(now);

    if (!this._hasTarget) {
      this.ring.position.copy(this._tgtPos);
      this.ring.quaternion.copy(this._tgtQuat);
      this.ring.scale.setScalar(this._tgtScale);
      this._hasTarget = true;
      // First lock — no prior detection so velocity is meaningless.
      this._velPx = this._velPy = this._velScale = 0;
    }
  }

  /* =================================================================
   * BRACELET PIPELINE
   * -----------------------------------------------------------------
   * Mirrors `applyResult` but anchors at the wrist (landmark 0) and
   * orients along the forearm axis instead of a single finger. The
   * piece is built by `designer.buildPiece({piece:"Bracelet", …})` so
   * its local frame matches the studio convention: +Z runs through
   * the wrist hole, +Y is the dorsal-top of the band (where focal
   * stones live), +X is the circumferential tangent. We compute the
   * same scalar set as the ring path (px, py, scale, sin/cos,
   * pitch, roll) and reuse every smoothing filter so the existing
   * lerp pipeline in `loop()` renders without modification.
   * ================================================================= */
  selectHandForBracelet(result, metrics) {
    return this._handIdentity.choose(result, performance.now(), [0, 5, 9, 17]);
  }


  applyResultBracelet(result, now = performance.now()) {
    const metrics = this.videoMetrics();
    const selected = this.selectHandForBracelet(result, metrics);
    if (!selected) {
      this.handLostFrames++;
      this._poseConfidenceTarget = 0;
      if (this.handLostFrames > 8) {
        this.ring.visible = false;
        this._hasTarget = false;
        if (this.qualityEl) this.qualityEl.hidden = true;
        if (this.handLostFrames === 9) this.setStatus("Show your wrist to the camera");
        this.hideHandSilhouetteOccluder();
      }
      return;
    }
    this.handLostFrames = 0;
    const { landmarks, world } = selected;

    // pxPerMeter — derive from knuckle line (most stable rigid pair).
    const idxImg = landmarks[INDEX_MCP];
    const pkyImg = landmarks[PINKY_MCP];
    const handWidthPx = this.landmarkDistance(idxImg, pkyImg, metrics);
    const reference = palmScale(landmarks, world, metrics, this._measuredHandWidthMm);
    if (!reference) { this._poseConfidenceTarget = 0; return; }
    const handWidthM = reference.widthM;
    const pxPerMeter = reference.pixelsPerMeter;

    const wristPt = this.landmarkToStage(landmarks[0], metrics);
    const palm = [5,9,17].map(index => this.landmarkToStage(landmarks[index],metrics));
    const dx = wristPt.x - palm.reduce((sum,p)=>sum+p.x,0)/3;
    const dy = wristPt.y - palm.reduce((sum,p)=>sum+p.y,0)/3;
    const imgLen = Math.hypot(dx,dy)||1;
    const wristWorld=world[0];
    const middleWorld={x:(world[5].x+world[9].x+world[17].x)/3,
      y:(world[5].y+world[9].y+world[17].y)/3,z:(world[5].z+world[9].z+world[17].z)/3};
    const worldLen=Math.hypot(wristWorld.x-middleWorld.x,wristWorld.y-middleWorld.y,wristWorld.z-middleWorld.z)||.09;
    const handPitch=Math.asin(clamp(-(wristWorld.z-middleWorld.z)/worldLen,-.985,.985));
    this._lastHandRoll=estimateHandRoll(world,selected.handedness,this.isMirrored,dx/imgLen,dy/imgLen,handPitch,this._lastHandRoll);
    const deliveryAge=this._applyingFrame ? Math.max(0,performance.now()-this._applyingFrame.sampledAt) : 0;
    const observation=observeForearm(result.forearmPose,landmarks,metrics,this.isMirrored,deliveryAge);
    const forearm=fitForearmOrientation({x:dx/imgLen,y:dy/imgLen,pitch:handPitch,roll:this._lastHandRoll},observation);
    this._forearmSource=forearm.observed ? "elbow/wrist observation" : "palm estimate";
    const fx=forearm.x,fy=forearm.y,rawPitch=forearm.pitch;
    const rawRoll=forearm.roll+THREE.MathUtils.degToRad(this.calibration.roll||0);
    const sideX=-fy,sideY=fx;
    // Place the band 10 mm along the forearm from the observed wrist joint.
    // Screen foreshortening changes the projected offset, not the real seat.
    const seatOffset=.010*pxPerMeter*Math.cos(rawPitch);
    const bodyPx=wristPt.x+fx*seatOffset,bodyPy=wristPt.y+fy*seatOffset;
    let rawPx=bodyPx+fx*this.calibration.lift*.6+sideX*this.calibration.side;
    let rawPy=bodyPy+fy*this.calibration.lift*.6+sideY*this.calibration.side;

    // Confidence: presence + edge-distance + on-screen size.
    const used = [0, 9, INDEX_MCP, PINKY_MCP];
    const presence = used.reduce((sum, index) => sum + handLandmarkValidity(landmarks[index]), 0) / used.length;
    const centerNX = (wristPt.x + metrics.width / 2) / metrics.width;
    const centerNY = (-wristPt.y + metrics.height / 2) / metrics.height;
    const edgeDistance = Math.min(centerNX, centerNY, 1 - centerNX, 1 - centerNY);
    const edgeScore = smoothstep(0.02, 0.14, edgeDistance);
    const pixelScore = smoothstep(40, 110, handWidthPx);
    const handWorldScore = 1 - smoothstep(0.05, 0.105, Math.abs(handWidthM - 0.082));
    const confidenceRaw = clamp(presence * 0.42 + edgeScore * 0.18 + pixelScore * 0.24 + handWorldScore * 0.16, 0, 1);
    const confidence = this.filtConfidence.filter(confidenceRaw, now);
    this._poseConfidenceTarget = confidence;
    if (confidence < 0.22) {
      this._badPoseFrames = (this._badPoseFrames || 0) + 1;
      if (this._badPoseFrames > 5) {
        this.ring.visible = false;
        this._hasTarget = false;
        this.hideHandSilhouetteOccluder();
        this.setStatus("Hold your wrist steady in the camera");
      }
      return;
    }
    this._badPoseFrames = 0;
    this.setStatus("");
    this.ring.visible = true;

    // Honest physical scale — identical maths to the ring pipeline: the
    // bangle renders at its true spec size, never resized to the wrist.
    const wristWidthMm = this.filtWristWidth.filter(this._wristWidthMm || handWidthM * WRIST_DIAMETER_RATIO * 1000, now);
    const wristDiameterM = wristWidthMm / 1000;
    const localWristWidthMm = wristWidthMm / this.calibration.fit;
    if (this._wearable?.fitBracelet && (this._braceletFitAt == null
      || (now - this._braceletFitAt > 300 && Math.abs(localWristWidthMm - this._braceletFitWidth) > 1))) {
      this._braceletFits = this._wearable.fitBracelet(localWristWidthMm);
      this._braceletFitAt = now;
      this._braceletFitWidth = localWristWidthMm;
    }
    if (this._braceletFits === false) {
      this.ring.visible = false;
      this._poseConfidenceTarget = 0;
      this.setStatus("This bracelet is too short for the wrist estimate. Check wrist width or choose a longer bracelet.");
      return;
    }
    const metersPerLocalUnit = METERS_PER_MM / Math.max(this._unitsPerMm, 1e-6);
    const rawScale = pxPerMeter * metersPerLocalUnit * this.calibration.fit;

    const flexible = ["Tennis", "Station"].includes(this._designState.silhouette);
    const rawOrientation = wristOrientation(fx, fy, rawPitch, rawRoll);
    const gravity = new THREE.Vector3(0, -1, 0).applyQuaternion(rawOrientation.clone().invert());
    const seating = !flexible && Math.abs(this.calibration.roll || 0) < .01
      ? rigidWristSeat({ wristRadius: wristDiameterM * .5 / this.calibration.fit,
        innerRadius: this._physicalSpec.bracelet.innerDiameterMm * .0005,
        thickness: this._physicalSpec.bracelet.tubeDiameterMm * .001,
        gravityX: gravity.x, gravityY: gravity.y }) : { x: 0, y: 0, fits: true };
    const seatShift = new THREE.Vector3(seating.x, seating.y, 0).applyQuaternion(rawOrientation);
    rawPx += seatShift.x * rawScale;
    rawPy += seatShift.y * rawScale;
    const seatDepth = seatShift.z * this.pixelScaleToWorld(rawScale);
    this._rigidWristSeating = seating;
    if (this.sizeEl) {
      this.sizeEl.textContent = flexible
        ? `${this._physicalSpec.bracelet.lengthMm} mm length · approximate wrist preview`
        : `${this._physicalSpec.bracelet.innerDiameterMm} mm opening · approximate wrist preview`;
      this.sizeEl.hidden = false;
    }


    // Filter all scalars (OneEuro).
    const px = this.filtPx.filter(rawPx, now);
    const py = this.filtPy.filter(rawPy, now);
    const s = this.filterScale(rawScale, now);
    const direction = this.filterDirection(fx, fy, now);
    const fxN = direction.x;
    const fyN = direction.y;
    const pitch = this.filtPitch.filter(rawPitch, now);
    const roll = this.filtRoll.filter(rawRoll, now);
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);
    const cosR = Math.cos(roll);
    const sinR = Math.sin(roll);

    // Build SO(3) basis.  Local +Z = forearm direction in 3D (screen
    // (fxN,fyN) tilted out-of-plane by pitch).  Local +X = screen-
    // perpendicular to that.  Local +Y = +Z × +X (dorsal up before
    // roll).  Then rotate (X,Y) about Z by `roll`.
    this._vRight.set(-fyN, fxN, 0);
    this._vUp.set(-fxN * sinP, -fyN * sinP, cosP);
    this._vFwd.set(fxN * cosP, fyN * cosP, sinP);
    this._vTmpA.copy(this._vRight);
    this._vTmpB.copy(this._vUp);
    this._vRight.copy(this._vTmpA).multiplyScalar(cosR).addScaledVector(this._vTmpB, -sinR).normalize();
    this._vUp.copy(this._vTmpA).multiplyScalar(sinR).addScaledVector(this._vTmpB, cosR).normalize();
    this._mat.makeBasis(this._vRight, this._vUp, this._vFwd);

    const posNormX = clamp((px + metrics.width / 2) / metrics.width, 0, 1);
    const posNormY = clamp((metrics.height / 2 - py) / metrics.height, 0, 1);
    this._lastStageNorm = { x: posNormX, y: posNormY };

    // Motion energy + jitter EMAs (drive sparkle + contact dynamics).
    if (this._lastPoseForDelta) {
      const prev = this._lastPoseForDelta;
      const posDelta = Math.hypot(rawPx - prev.x, rawPy - prev.y) / Math.max(metrics.width, metrics.height);
      const scaleDelta = Math.abs(rawScale - prev.scale) / Math.max(1e-3, prev.scale);
      const angleDelta = Math.acos(clamp(fx * prev.fx + fy * prev.fy, -1, 1));
      const pitchDelta = Math.abs(rawPitch - prev.pitch);
      const rollDelta = Math.abs(rawRoll - prev.roll);
      const poseDelta = clamp(posDelta * 8.5 + scaleDelta * 2.4 + angleDelta * 0.9 + pitchDelta * 0.55 + rollDelta * 0.38, 0, 1);
      this._poseDeltaEnergy = poseDelta;
      this._motionEnergy += (poseDelta - this._motionEnergy) * 0.30;
    }
    this._lastPoseForDelta = { x: rawPx, y: rawPy, scale: rawScale, fx, fy, pitch: rawPitch, roll: rawRoll };

    if (this._lastFilteredPose) {
      const fp = this._lastFilteredPose;
      const jPos = Math.hypot(px - fp.px, py - fp.py) / Math.max(metrics.width, metrics.height);
      const jAng = Math.acos(clamp(fxN * fp.fxN + fyN * fp.fyN, -1, 1));
      const jPit = Math.abs(pitch - fp.pitch);
      const jRol = Math.abs(roll - fp.roll);
      const jScl = Math.abs(s - fp.s) / Math.max(1e-3, fp.s);
      const jit = clamp(jPos * 22 + jAng * 1.8 + jPit * 1.2 + jRol * 0.8 + jScl * 4, 0, 1);
      this._jitterEMA += (jit - this._jitterEMA) * 0.18;
    }
    this._lastFilteredPose = { px, py, fxN, fyN, pitch, roll, s };

    // Contact + shadow targets — same scheme as ring path but sized
    // to the wrist (no flesh-compression dip; the wrist is mostly bone).
    const localOuterR = this._ringLocalOuterR || 1.42;
    const wristRadiusPx = Math.max(1, wristDiameterM * 0.5 * pxPerMeter);
    const wristLocalRadius = wristDiameterM * 0.5 / this.calibration.fit;
    this._targetFingerLocalRadius = clamp(wristLocalRadius, 0.012, 0.060);
    const idealOuterPx = wristRadiusPx + BRACELET_WALL_THICKNESS_M * pxPerMeter;
    const actualOuterPx = localOuterR * s;
    const contactError = Math.abs(actualOuterPx - idealOuterPx) / Math.max(idealOuterPx, 1);
    const contactScore = 1 - smoothstep(0.10, 0.34, contactError);
    this._targetShadowOpacity = (this._shadowBaseOpacity || 0.85) * contactScore * clamp(0.50 + confidence * 0.55, 0, 1);
    const occluderBase = this._occluderBaseRadius || this._targetFingerLocalRadius;
    this._targetShadowScaleX = clamp(this._targetFingerLocalRadius / occluderBase, 0.4, 2.5);
    this._targetOccluderScaleX = this._targetShadowScaleX;
    this._targetOccluderScaleY = this._targetOccluderScaleX;
    this._targetShadowScaleY = 1;
    this._targetShadowScaleZ = clamp(0.98 + Math.abs(pitch) * 0.20 + this._motionEnergy * 0.14, 0.90, 1.36);

    this.setTargetFromStage(px, py, s);
    this._tgtQuat.setFromRotationMatrix(this._mat);
    this._stoneNormalZ = this._vUp.z;
    this._tgtPos.z += seatDepth;
    this.updateHandSilhouetteOccluder(landmarks, metrics, handWidthM * pxPerMeter, rawPx, rawPy, rawScale, fx, fy, rawPitch, rawRoll, null,
      { x: bodyPx, y: bodyPy, radiusPx: wristRadiusPx, pixelsPerMeter: pxPerMeter, depth: seatDepth });

    // Predictor velocity (drives forward extrapolation in loop()).
    this.updatePoseVelocity(now);

    if (!this._hasTarget) {
      this.ring.position.copy(this._tgtPos);
      this.ring.quaternion.copy(this._tgtQuat);
      this.ring.scale.setScalar(this._tgtScale);
      this._hasTarget = true;
      this._velPx = this._velPy = this._velScale = 0;
    }
  }

  /* =================================================================
   * EARRINGS PIPELINE
   * -----------------------------------------------------------------
   * Uses MediaPipe Face Landmarker (separate model from the Hand
   * tasks). Anchors the earring pair at the midpoint of the two
   * lateral face landmarks (234 = right tragus, 454 = left tragus),
   * offset downward along the inter-ear vector by EARLOBE_DROP_RATIO
   * to land on the lobe. Scale comes from the inter-ear pixel span
   * divided by the designer's local pair span (2 \u00d7 0.76). Rotation
   * is extracted from `facialTransformationMatrixes[0]` \u2014 a 4\u00d74
   * metric matrix mapping canonical face coords to camera coords \u2014
   * with a mirror flip on the X axis when the selfie preview is on.
   * No occluder + no contact shadow (skipped in startThree).
   * ================================================================= */
  /* Slide each earring child along local X so the pair spacing matches the
   * wearer's detected lobe span while the per-earring geometry keeps its
   * honest physical scale. Children were cached with their build-time
   * positions and side signs in startThree(). */

  applyResultEarrings(result, now = performance.now()) {
    const metrics = this.videoMetrics();
    const faces = result?.faceLandmarks || [];
    const landmarks = faces[0];
    const transformList = result?.facialTransformationMatrixes || [];
    if (![FACE_EAR_RIGHT, FACE_EAR_LEFT].every((index) => {
      const point = landmarks?.[index];
      return point && [point.x, point.y, point.z].every(Number.isFinite);
    })) {
      this.handLostFrames++;
      this._poseConfidenceTarget = 0;
      if (this.handLostFrames > 8) {
        this.ring.visible = false;
        this._hasTarget = false;
        if (this.qualityEl) this.qualityEl.hidden = true;
        if (this.handLostFrames === 9) this.setStatus("Face the camera so both ears are visible");
      }
      return;
    }
    this.handLostFrames = 0;

    const earR = this.landmarkToStage(landmarks[FACE_EAR_RIGHT], metrics);
    const earL = this.landmarkToStage(landmarks[FACE_EAR_LEFT], metrics);
    const dxEar = earL.x - earR.x;
    const dyEar = earL.y - earR.y;
    const earPx = Math.hypot(dxEar, dyEar) || 1;
    const headMidX = (earL.x + earR.x) / 2;
    const headMidY = (earL.y + earR.y) / 2;
    const rawPx = headMidX + (this.calibration.side || 0);
    const rawPy = headMidY + (this.calibration.lift || 0);

    const earDepthPx = (landmarks[FACE_EAR_LEFT].z - landmarks[FACE_EAR_RIGHT].z) * metrics.drawWidth;
    const earPxPerMeter = Math.hypot(earPx, earDepthPx) / EAR_SPAN_M;
    const earMetersPerLocalUnit = METERS_PER_MM / Math.max(this._unitsPerMm, 1e-6);
    const rawScale = earPxPerMeter * earMetersPerLocalUnit * this.calibration.fit;

    // Confidence: presence-driven (FaceLandmarker presence is not exposed
    // per-landmark, so we score by ear span vs frame size + central
    // visibility of forehead/chin).
    const centerNX = (rawPx + metrics.width / 2) / metrics.width;
    const centerNY = (metrics.height / 2 - rawPy) / metrics.height;
    const edgeDistance = Math.min(centerNX, centerNY, 1 - centerNX, 1 - centerNY);
    const edgeScore = smoothstep(0.01, 0.12, edgeDistance);
    const sizeScore = smoothstep(60, 260, earPx);
    const presenceScore = landmarks[10] && landmarks[152] ? 1 : 0.4;
    const confidenceRaw = clamp(presenceScore * 0.40 + edgeScore * 0.25 + sizeScore * 0.35, 0, 1);
    const confidence = this.filtConfidence.filter(confidenceRaw, now);
    this._poseConfidenceTarget = confidence;
    if (confidence < 0.22) {
      this._badPoseFrames = (this._badPoseFrames || 0) + 1;
      if (this._badPoseFrames > 5) {
        this.ring.visible = false;
        this._hasTarget = false;
        this.setStatus("Hold your head steady in the camera");
      }
      return;
    }
    this._badPoseFrames = 0;
    this.setStatus("");
    this.ring.visible = true;
    if (this.sizeEl) this.sizeEl.hidden = true;

    // Filter scalars (position + scale only — rotation comes from the
    // matrix and is slerped target-side).
    const px = this.filtPx.filter(rawPx, now);
    const py = this.filtPy.filter(rawPy, now);
    const s = this.filterScale(rawScale, now);

    // Head rotation: prefer facialTransformationMatrixes when available,
    // fall back to a 2D roll from the inter-ear vector.
    const transform = transformList[0];
    const matData = transform?.data || transform;
    if (matData && matData.length === 16 && Array.from(matData).every(Number.isFinite)
      && Math.abs(new THREE.Matrix4().fromArray(matData).determinant()) > 1e-6) {
      // MediaPipe outputs column-major; THREE.Matrix4.fromArray expects same.
      const M = this._mat.fromArray(matData);
      const e = M.elements;
      // Extract head basis vectors (cols 0,1,2) in camera coords:
      //   col0 = wearer's-left direction
      //   col1 = up direction
      //   col2 = out-of-face (toward camera) direction
      this._vRight.set(e[0], e[1], e[2]);
      this._vUp.set(e[4], e[5], e[6]);
      this._vFwd.set(e[8], e[9], e[10]);
      if (this.isMirrored) {
        this._vRight.y = -this._vRight.y;
        this._vRight.z = -this._vRight.z;
        this._vUp.x = -this._vUp.x;
        this._vFwd.x = -this._vFwd.x;
      }
      this._vRight.normalize();
      this._vUp.addScaledVector(this._vRight, -this._vUp.dot(this._vRight)).normalize();
      this._vFwd.crossVectors(this._vRight, this._vUp).normalize();
      this._mat.makeBasis(this._vRight, this._vUp, this._vFwd);
      this._tgtQuat.setFromRotationMatrix(this._mat);
      // User roll calibration around the forward axis.
      const rollCal = THREE.MathUtils.degToRad(this.calibration.roll || 0);
      if (Math.abs(rollCal) > 1e-4) {
        const qRoll = new THREE.Quaternion().setFromAxisAngle(this._vFwd, rollCal);
        this._tgtQuat.premultiply(qRoll);
      }
    } else {
      const direction = dxEar < 0 ? -1 : 1;
      this._vRight.set(dxEar * direction, dyEar * direction, -earDepthPx * direction).normalize();
      this._vUp.set(-dyEar * direction, dxEar * direction, 0).normalize();
      this._vFwd.crossVectors(this._vRight, this._vUp).normalize();
      this._vUp.crossVectors(this._vFwd, this._vRight).normalize();
      this._mat.makeBasis(this._vRight, this._vUp, this._vFwd);
      this._tgtQuat.setFromRotationMatrix(this._mat);
      const rollCal = THREE.MathUtils.degToRad(this.calibration.roll || 0);
      this._tgtQuat.premultiply(new THREE.Quaternion().setFromAxisAngle(this._vFwd, rollCal));
    }

    const posNormX = clamp((px + metrics.width / 2) / metrics.width, 0, 1);
    const posNormY = clamp((metrics.height / 2 - py) / metrics.height, 0, 1);
    this._lastStageNorm = { x: posNormX, y: posNormY };

    // Motion energy for sparkle + lock score.
    if (this._lastPoseForDelta) {
      const prev = this._lastPoseForDelta;
      const posDelta = Math.hypot(rawPx - prev.x, rawPy - prev.y) / Math.max(metrics.width, metrics.height);
      const scaleDelta = Math.abs(rawScale - prev.scale) / Math.max(1e-3, prev.scale);
      const poseDelta = clamp(posDelta * 8.5 + scaleDelta * 2.4, 0, 1);
      this._poseDeltaEnergy = poseDelta;
      this._motionEnergy += (poseDelta - this._motionEnergy) * 0.30;
    }
    this._lastPoseForDelta = { x: rawPx, y: rawPy, scale: rawScale, fx: 1, fy: 0, pitch: 0, roll: 0 };

    if (this._lastFilteredPose) {
      const fp = this._lastFilteredPose;
      const jPos = Math.hypot(px - fp.px, py - fp.py) / Math.max(metrics.width, metrics.height);
      const jScl = Math.abs(s - fp.s) / Math.max(1e-3, fp.s);
      const jit = clamp(jPos * 22 + jScl * 4, 0, 1);
      this._jitterEMA += (jit - this._jitterEMA) * 0.18;
    }
    this._lastFilteredPose = { px, py, fxN: 1, fyN: 0, pitch: 0, roll: 0, s };

    this.setTargetFromStage(px, py, s);
    const inverse = this._tgtQuat.clone().invert();
    const meanDepth = (landmarks[FACE_EAR_LEFT].z + landmarks[FACE_EAR_RIGHT].z) / 2;
    const anchorAlpha = this._frozen || !this._hasTarget ? 1 : 1 - Math.exp(-clamp((now - (this._earAnchorTime || now)) / 1000, 0.001, 0.20) / 0.08);
    this._earAnchors ||= {};
    this._earVisibility ||= {};
    const toLocal = (landmark) => {
      const point = this.landmarkToStage(landmark, metrics);
      const depthPixels = -(landmark.z - meanDepth) * metrics.drawWidth;
      const cameraDistance = this.camera?.isPerspectiveCamera ? this.camera.position.z - this._arPlaneZ : Infinity;
      const projection = 1 - depthPixels * this.worldUnitsPerPixelAtZ() / cameraDistance;
      return new THREE.Vector3((point.x * projection - headMidX) / rawScale,
        (point.y * projection - headMidY) / rawScale, depthPixels / rawScale).applyQuaternion(inverse);
    };
    const faceTracked = updateFaceOccluder(this._faceOccluder, landmarks, toLocal, anchorAlpha);
    if (this._headOccluder) this._headOccluder.visible = !faceTracked;
    for (const [side, lowerIndex, upperIndex] of [
      ["Right", FACE_LOWER_RIGHT, FACE_EAR_RIGHT],
      ["Left", FACE_LOWER_LEFT, FACE_EAR_LEFT]
    ]) {
      const lower = landmarks[lowerIndex];
      const hasLower = lower && [lower.x, lower.y, lower.z].every(Number.isFinite);
      const landmark = hasLower ? lower : landmarks[upperIndex];
      const sideSign = (side === "Left" ? 1 : -1) * (this.isMirrored ? -1 : 1);
      const facing = new THREE.Vector3(sideSign * 0.94, 0, 0.34).normalize().applyQuaternion(this._tgtQuat).z;
      const onScreen = landmark.x > 0.01 && landmark.x < 0.99 && landmark.y > 0.01 && landmark.y < 0.99;
      const visible = onScreen && earFacingVisible(facing, this._earVisibility[side]);
      const position = toLocal(landmark);
      position.x = position.x * (this.calibration.earSpan || 1) + sideSign * (0.0015 + this._earOffsets[side].x);
      position.y += this._earOffsets[side].y - (this.calibration.earDrop || 0) / rawScale;
      if (!hasLower) position.y -= EAR_SPAN_M * EARLOBE_DROP_RATIO;
      if (!this._earAnchors[side]) this._earAnchors[side] = position.clone();
      if (visible || this._frozen) this._earAnchors[side].lerp(position, anchorAlpha);
      this._wearable.setEarAnchor(side, this._earAnchors[side]);
      this._earVisibility[side] = visible;
      this._wearable.setEarVisible(side, visible);
    }
    updateEarOpenings(this._faceOccluder, this._earAnchors, this._earVisibility);
    const rotationDelta = Math.max(0.001, (now - (this._earAnchorTime ?? now)) / 1000);
    if (this._earPoseQuaternion && this._hasTarget && !this._frozen) {
      const difference = this._earPoseQuaternion.angleTo(this._tgtQuat);
      const threshold = 0.5 + rotationDelta * 5;
      if (difference > threshold && (!this._pendingEarRotation || this._pendingEarRotation.angleTo(this._tgtQuat) > 0.25)) {
        this._pendingEarRotation = this._tgtQuat.clone();
        this._tgtQuat.copy(this._earPoseQuaternion);
      } else {
        this._pendingEarRotation = null;
        this._earPoseQuaternion.slerp(this._tgtQuat, 1 - Math.exp(-rotationDelta / 0.04));
        this._tgtQuat.copy(this._earPoseQuaternion);
      }
    } else this._earPoseQuaternion = this._tgtQuat.clone();
    this._earAnchorTime = now;
    this._stoneNormalZ = this._vFwd.z;

    this.updatePoseVelocity(now);

    if (!this._hasTarget) {
      this.ring.position.copy(this._tgtPos);
      this.ring.quaternion.copy(this._tgtQuat);
      this.ring.scale.setScalar(this._tgtScale);
      this._hasTarget = true;
      this._velPx = this._velPy = this._velScale = 0;
    }
  }

  applyResultNecklace(result, now = performance.now()) {
    const metrics = this.videoMetrics();
    const poses = result?.landmarks || [];
    const worldPoses = result?.worldLandmarks || [];
    const landmarks = poses[0];
    const world = worldPoses[0] || null;
    if (!landmarks || !landmarks[POSE_LEFT_SHOULDER] || !landmarks[POSE_RIGHT_SHOULDER]) {
      this.handLostFrames++;
      this._poseConfidenceTarget = 0;
      this._targetNeckShadowOpacity = 0;
      if (this.handLostFrames > 8) {
        this.ring.visible = false;
        this._hasTarget = false;
        if (this.qualityEl) this.qualityEl.hidden = true;
        if (this.handLostFrames === 9) this.setStatus("Step back so head and shoulders are visible");
      }
      return;
    }
    this.handLostFrames = 0;

    const lShRaw = landmarks[POSE_LEFT_SHOULDER];
    const rShRaw = landmarks[POSE_RIGHT_SHOULDER];
    const lShVis = landmarkPresence(lShRaw);
    const rShVis = landmarkPresence(rShRaw);
    const shoulderVis = Math.min(lShVis, rShVis);
    if (shoulderVis < 0.48) {
      this._badPoseFrames = (this._badPoseFrames || 0) + 1;
      this._poseConfidenceTarget = 0;
      this._targetNeckShadowOpacity = 0;
      if (this._badPoseFrames > 5) {
        this.ring.visible = false;
        this._hasTarget = false;
        this.setStatus("Hold still so both shoulders are visible");
      }
      return;
    }

    const lSh = this.landmarkToStage(lShRaw, metrics);
    const rSh = this.landmarkToStage(rShRaw, metrics);
    const shoulderMidX = (lSh.x + rSh.x) / 2;
    const shoulderMidY = (lSh.y + rSh.y) / 2;
    const dxSh = lSh.x - rSh.x;
    const dySh = lSh.y - rSh.y;
    const shoulderPx = Math.hypot(dxSh, dySh) || 1;

    const stageIfVisible = (idx, minPresence = 0.34) => {
      const lm = landmarks[idx];
      const presence = landmarkPresence(lm);
      return lm && presence >= minPresence ? { ...this.landmarkToStage(lm, metrics), presence } : null;
    };

    const weightedPoints = [];
    const mouthL = stageIfVisible(POSE_MOUTH_LEFT, 0.30);
    const mouthR = stageIfVisible(POSE_MOUTH_RIGHT, 0.30);
    if (mouthL && mouthR) {
      weightedPoints.push({
        x: (mouthL.x + mouthR.x) * 0.5,
        y: (mouthL.y + mouthR.y) * 0.5,
        weight: Math.min(mouthL.presence, mouthR.presence) * 0.62
      });
    }
    const nose = stageIfVisible(POSE_NOSE, 0.34);
    if (nose) weightedPoints.push({ x: nose.x, y: nose.y, weight: nose.presence * 0.26 });
    const earL = stageIfVisible(POSE_LEFT_EAR, 0.28);
    const earR = stageIfVisible(POSE_RIGHT_EAR, 0.28);
    if (earL && earR) {
      weightedPoints.push({
        x: (earL.x + earR.x) * 0.5,
        y: (earL.y + earR.y) * 0.5,
        weight: Math.min(earL.presence, earR.presence) * 0.12
      });
    }

    const faceCenter = weightedCenter(weightedPoints, { x: shoulderMidX, y: shoulderMidY + shoulderPx * 0.50 });
    const faceWeight = faceCenter.weight;
    const faceScore = clamp(faceWeight, 0, 1);

    const torso = torsoFrame(lSh, rSh, world, landmarks);
    if (!torso) { this._poseConfidenceTarget = 0; return; }
    let upX = torso.up.x, upY = torso.up.y;
    let rightX = torso.right.x, rightY = torso.right.y;
    let rightLen = 1;
    const rawRightDotUp = 0;
    const hipScore = torso.leanObserved ? 1 : 0;

    const projection = shoulderProjection(world?.[POSE_LEFT_SHOULDER], world?.[POSE_RIGHT_SHOULDER], this.isMirrored, dxSh);
    const shoulderPxPerMeter = shoulderPx / (SHOULDER_SPAN_M * projection.ratio);
    const mouthHeight = mouthL && mouthR
      ? (((mouthL.x + mouthR.x) / 2 - shoulderMidX) * upX + ((mouthL.y + mouthR.y) / 2 - shoulderMidY) * upY) / shoulderPxPerMeter
      : 0.1;
    const neckHeightM = this.calibration.neckHeightAuto
      ? clamp(mouthHeight * 0.4, 0.035, 0.085)
      : (this.calibration.neckHeightMm ?? 40) * 0.001;
    const filteredNeckHeight = this.filtNeckHeight.filter(neckHeightM, now);
    const neckOffsetPx = shoulderPxPerMeter * filteredNeckHeight;
    const anchorX = shoulderMidX + upX * neckOffsetPx;
    const anchorY = shoulderMidY + upY * neckOffsetPx;

    // Corrections are stored in torso-local millimetres. The frame uses the
    // shoulders and reliable torso depth, independently of head movement.
    const rawCy = Math.cos(projection.yaw), rawSy = Math.sin(projection.yaw);
    const rawCl = Math.cos(torso.lean), rawSl = Math.sin(torso.lean);
    const bodyRight = { x: rightX * rawCy, y: rightY * rawCy };
    const bodyUp = { x: upX * rawCl - rightX * rawSy * rawSl, y: upY * rawCl - rightY * rawSy * rawSl };
    const neckReference = { x: anchorX, y: anchorY, right: bodyRight, up: bodyUp,
      pixelsPerMeter: shoulderPxPerMeter, neckHeightMm: filteredNeckHeight * 1000, trackingResult: result };
    const offset = this.calibration.neckBaseOffsetMm || { x: 0, y: 0 };
    const sidePx = (this.calibration.side || 0) + offset.x * .001 * shoulderPxPerMeter;
    const liftPx = (this.calibration.lift || 0) + offset.y * .001 * shoulderPxPerMeter;
    const rawPx = anchorX + bodyRight.x * sidePx + bodyUp.x * liftPx;
    const rawPy = anchorY + bodyRight.y * sidePx + bodyUp.y * liftPx;

    const neckMetersPerLocalUnit = METERS_PER_MM / Math.max(this._unitsPerMm, 1e-6);
    const rawScale = shoulderPxPerMeter * neckMetersPerLocalUnit * this.calibration.fit;

    const centerNX = (rawPx + metrics.width / 2) / metrics.width;
    const centerNY = (metrics.height / 2 - rawPy) / metrics.height;
    const edgeDistance = Math.min(centerNX, centerNY, 1 - centerNX, 1 - centerNY);
    const edgeScore = smoothstep(0.01, 0.10, edgeDistance);
    const sizeScore = smoothstep(NECKLACE_MIN_SHOULDER_PX, 430, shoulderPx);
    const axisScore = 1 - smoothstep(0.32, 0.72, Math.abs(rawRightDotUp));
    const confidenceRaw = clamp(
      shoulderVis * 0.34 +
      edgeScore * 0.16 +
      sizeScore * 0.22 +
      faceScore * 0.18 +
      hipScore * 0.04 +
      axisScore * 0.06,
      0,
      1
    );
    const confidence = this.filtConfidence.filter(confidenceRaw, now);
    this._poseConfidenceTarget = confidence;
    if (confidence < 0.22) {
      this._badPoseFrames = (this._badPoseFrames || 0) + 1;
      this._targetNeckShadowOpacity = 0;
      if (this._badPoseFrames > 5) {
        this.ring.visible = false;
        this._hasTarget = false;
        this.setStatus("Hold still so both shoulders are visible");
      }
      return;
    }
    this._badPoseFrames = 0;
    this.setStatus("");
    this.ring.visible = this.ring.userData.wearable.neck?.fits !== false;
    if (this.ring.visible) this._neckPlacementReference = neckReference;
    if (!this.ring.visible) this.setStatus("This chain is too short for the current neck estimate. Choose a longer chain.");
    const chainLengthMm = Number(this._physicalSpec?.necklace?.chainLengthMm);
    if (this.sizeEl && Number.isFinite(chainLengthMm) && chainLengthMm > 0) {
      this.sizeEl.textContent = `${(chainLengthMm / 10).toFixed(0)} cm design · approximate body scale`;
      this.sizeEl.hidden = false;
    } else if (this.sizeEl) {
      this.sizeEl.hidden = true;
    }

    const px = this.filtPx.filter(rawPx, now);
    const py = this.filtPy.filter(rawPy, now);
    const s = this.filterScale(rawScale, now);

    const direction = this.filterDirection(upX, upY, now);
    upX = direction.x;
    upY = direction.y;
    const dotRightUp = rightX * upX + rightY * upY;
    rightX -= upX * dotRightUp;
    rightY -= upY * dotRightUp;
    rightLen = Math.hypot(rightX, rightY) || 1;
    rightX /= rightLen;
    rightY /= rightLen;
    if (rightX < 0) {
      rightX = -rightX;
      rightY = -rightY;
    }

    const rollCal = THREE.MathUtils.degToRad(this.calibration.roll || 0);
    const cr = Math.cos(rollCal);
    const sr = Math.sin(rollCal);
    const calRightX = rightX * cr + upX * sr;
    const calRightY = rightY * cr + upY * sr;
    const calUpX = -rightX * sr + upX * cr;
    const calUpY = -rightY * sr + upY * cr;

    const rawYaw = projection.yaw;
    const yaw = this.filtPitch.filter(rawYaw, now);
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const lean = this.filtRoll.filter(torso.lean, now);
    this._vRight.set(calRightX * cy, calRightY * cy, sy).normalize();
    this._vUp.set(calUpX, calUpY, 0).normalize();
    this._vFwd.crossVectors(this._vRight, this._vUp).normalize();
    this._vUp.multiplyScalar(Math.cos(lean)).addScaledVector(this._vFwd, Math.sin(lean)).normalize();
    this._vFwd.crossVectors(this._vRight, this._vUp).normalize();
    this._vRight.crossVectors(this._vUp, this._vFwd).normalize();
    this._mat.makeBasis(this._vRight, this._vUp, this._vFwd);
    this._tgtQuat.setFromRotationMatrix(this._mat);

    const posNormX = clamp((px + metrics.width / 2) / metrics.width, 0, 1);
    const posNormY = clamp((metrics.height / 2 - py) / metrics.height, 0, 1);
    this._lastStageNorm = { x: posNormX, y: posNormY };

    if (this._lastPoseForDelta) {
      const prev = this._lastPoseForDelta;
      const posDelta = Math.hypot(rawPx - prev.x, rawPy - prev.y) / Math.max(metrics.width, metrics.height);
      const scaleDelta = Math.abs(rawScale - prev.scale) / Math.max(1e-3, prev.scale);
      const angleDelta = Math.acos(clamp(calRightX * prev.fx + calRightY * prev.fy, -1, 1));
      const yawDelta = Math.abs(yaw - prev.pitch);
      const poseDelta = clamp(posDelta * 8.5 + scaleDelta * 2.4 + angleDelta * 0.7 + yawDelta * 0.45, 0, 1);
      this._poseDeltaEnergy = poseDelta;
      this._motionEnergy += (poseDelta - this._motionEnergy) * 0.30;
    }
    this._lastPoseForDelta = { x: rawPx, y: rawPy, scale: rawScale, fx: calRightX, fy: calRightY, pitch: yaw, roll: 0 };

    if (this._lastFilteredPose) {
      const fp = this._lastFilteredPose;
      const jPos = Math.hypot(px - fp.px, py - fp.py) / Math.max(metrics.width, metrics.height);
      const jAng = Math.acos(clamp(calRightX * fp.fxN + calRightY * fp.fyN, -1, 1));
      const jYaw = Math.abs(yaw - fp.pitch);
      const jScl = Math.abs(s - fp.s) / Math.max(1e-3, fp.s);
      const jit = clamp(jPos * 22 + jAng * 1.25 + jYaw * 0.85 + jScl * 4, 0, 1);
      this._jitterEMA += (jit - this._jitterEMA) * 0.18;
    }
    this._lastFilteredPose = { px, py, fxN: calRightX, fyN: calRightY, pitch: yaw, roll: 0, s };

    const localAnchor = this._necklaceAnchorLocal || this._vBase.set(0, 0, 0);
    const anchorOffsetX = (
      this._vRight.x * localAnchor.x +
      this._vUp.x * localAnchor.y +
      this._vFwd.x * localAnchor.z
    ) * s;
    const anchorOffsetY = (
      this._vRight.y * localAnchor.x +
      this._vUp.y * localAnchor.y +
      this._vFwd.y * localAnchor.z
    ) * s;
    this.setTargetFromStage(px - anchorOffsetX, py - anchorOffsetY, s);
    const bodyOffsetX=offset.x*.001*shoulderPxPerMeter;
    const bodyOffsetY=offset.y*.001*shoulderPxPerMeter;
    const bodyAnchor=this.stageToWorld(anchorX+bodyRight.x*bodyOffsetX+bodyUp.x*bodyOffsetY,
      anchorY+bodyRight.y*bodyOffsetX+bodyUp.y*bodyOffsetY);
    const rawRight={x:torso.right.x,y:torso.right.y},rawUp=torso.up;
    const bodyOrientation=neckOrientation(rawRight,rawUp,rawYaw,torso.lean);
    const rawOrientation=neckOrientation(rawRight,rawUp,rawYaw,torso.lean,rollCal);
    const rawAnchorOffset=localAnchor.clone().applyQuaternion(rawOrientation).multiplyScalar(rawScale);
    this._neckContactSourceInverse=new THREE.Matrix4().compose(
      this.stageToWorld(rawPx-rawAnchorOffset.x,rawPy-rawAnchorOffset.y),rawOrientation,
      new THREE.Vector3().setScalar(this.pixelScaleToWorld(rawScale))).invert();
    const neckBody=this.ring.userData.wearable.neck;
    if (neckBody && this._neckContactBody) this._neckContactBody.updateSource(bodyAnchor,bodyOrientation,
      shoulderPxPerMeter*this.worldUnitsPerPixelAtZ(),neckBody.radiusMm*.00098,neckBody.depthMm*.00098);

    this._stoneNormalZ = this._vFwd.z;
    const motionGate = 1 - smoothstep(0.18, 0.72, this._motionEnergy);
    const contactScore = clamp(confidence * (0.64 + faceScore * 0.20 + axisScore * 0.16), 0, 1);
    this._targetNeckShadowOpacity = this._neckShadowBaseOpacity * contactScore * (0.58 + motionGate * 0.42)
      * neckContactWeight(this.calibration.side||0,this.calibration.lift||0,shoulderPxPerMeter,this.calibration.fit,this.calibration.roll||0);
    this._targetNeckShadowScaleX = clamp(0.88 + Math.abs(rawRightDotUp) * 0.22 + Math.abs(yaw) * 0.18, 0.82, 1.18);
    this._targetNeckShadowScaleY = clamp(0.74 + (1 - sizeScore) * 0.18, 0.72, 1.04);

    this.updatePoseVelocity(now);

    if (!this._hasTarget) {
      this.ring.position.copy(this._tgtPos);
      this.ring.quaternion.copy(this._tgtQuat);
      this.ring.scale.setScalar(this._tgtScale);
      this._hasTarget = true;
      this._velPx = this._velPy = this._velScale = 0;
    }
  }

  snapshot() {
    try {
      // Composite: mirrored video + un-mirrored overlay into one PNG.
      // The overlay canvas already has the ring drawn at mirrored coordinates
      // (we flipped X in landmark math), so it should be drawn straight.
      const w = this.video.videoWidth;
      const h = this.video.videoHeight;
      if (!w || !h) return;
      const out = document.createElement("canvas");
      out.width = w; out.height = h;
      const ctx = out.getContext("2d");
      if (this.isMirrored) {
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(this.video, 0, 0, w, h);
        ctx.restore();
      } else {
        ctx.drawImage(this.video, 0, 0, w, h);
      }
      // Overlay (no flip)
      ctx.drawImage(this.canvas, 0, 0, w, h);
      out.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tjc-tryon-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, "image/png");
    } catch (err) {
      console.error("[AR] snapshot failed", err);
    }
  }

  close() {
    if (this._closed) return;
    this._closed = true;
    this.cancelNeckPlacement();
    this._neckPlacementReference = null;
    this._frameGate.reset();
    this._cameraAbort?.abort();
    this._cancelWorkerInit?.();
    if (this._videoCallback) this.video?.cancelVideoFrameCallback?.(this._videoCallback);
    if (this._onVisibility) document.removeEventListener("visibilitychange", this._onVisibility);
    if (window.__arTryOn === this) window.__arTryOn = null;
    this._lastTrackingResult = null;
    this._cameraTexture?.dispose();
    this._cameraTexture = null;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this._onResize) window.removeEventListener("resize", this._onResize);
    if (this._onKey) document.removeEventListener("keydown", this._onKey);
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
    if (this._trackingWorker) {
      try { this._trackingWorker.postMessage({ type: "close" }); } catch {}
      this._trackingWorker.terminate();
      this._trackingWorker = null;
    }
    this._trackingWorkerReady = false;
    this._trackingWorkerBusy = false;
    this._pendingTrackingFrame = null;
    if (this.handLandmarker) {
      try { this.handLandmarker.close(); } catch {}
      this.handLandmarker = null;
    }
    if (this.faceLandmarker) {
      try { this.faceLandmarker.close(); } catch {}
      this.faceLandmarker = null;
    }
    if (this.poseLandmarker) {
      try { this.poseLandmarker.close(); } catch {}
      this.poseLandmarker = null;
    }
    this._fingerContactBody?.dispose();
    this._fingerContactBody = null;
    this._wristContactBody?.dispose();
    this._wristContactBody = null;
    this._neckContactBody?.dispose();
    this._neckContactBody = null;
    this._neckContactSourceInverse = null;
    if (this._handMaskMesh) {
      this.scene?.remove?.(this._handMaskMesh);
      this._handMaskMesh.dispose();
      this._handMaskMesh.geometry?.dispose?.();
      this._handMaskMesh.material?.dispose?.();
      this._handMaskTexture?.dispose?.();
      this._handMaskMesh = null;
      this._handMaskTexture = null;
      this._handMaskCanvas = null;
      this._handMaskCtx = null;
    }
    if (this.renderer) {
      this._wearable?.renderBatches.dispose();
      disposeObjectTree(this.ring);
      this.renderer.dispose();
      this.renderer.forceContextLoss?.();
      this.renderer = null;
    }
    if (this._envRT) {
      this._envRT.dispose();
      this._envRT = null;
    }
    if (this.modal && this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal);
    }
    this.ring = null;
    this.scene = null;
    this.camera = null;
    this._lightProbe = null;
    this._lightProbeCtx = null;
    this._appearanceLighting.reset();
    this._wearable = null;
    this._articulation = null;
    this._faceOccluder = null;
    this._headOccluder = null;
    this._earAnchors = null;
    this._earVisibility = null;
    this._handMaskSourceInverse = null;
    document.body.style.overflow = this._previousOverflow || "";
    this._previousFocus?.focus?.();
  }
}

// Wire up the trigger button(s) on the page.
function init() {
  const triggers = document.querySelectorAll(TRIGGER_SELECTOR);
  triggers.forEach(btn => {
    btn.addEventListener("click", async () => {
      if (window.__arTryOn) return;
      const state = readDesignState();

      if (state?.piece && state.piece !== "Ring" && state.piece !== "Bracelet" && state.piece !== "Earrings" && state.piece !== "Necklace") {
        btn.hidden = true;
        return;
      }

      const app = new ARTryOn();
      window.__arTryOn = app;
      await app.open();

    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
