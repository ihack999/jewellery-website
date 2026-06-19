/**
 * AR Try-On (rings, bracelets, earrings, necklaces)
 *
 * Stack:
 *   - MediaPipe Tasks Vision (HandLandmarker, Apache 2.0) loaded from jsDelivr CDN.
 *     https://developers.google.com/mediapipe/solutions/vision/hand_landmarker
 *   - three.js (already bundled at assets/js/three.module.js)
 *
 * What it does:
 *   - Opens a fullscreen overlay with the user's front camera mirrored.
 *   - Runs the right MediaPipe tracker for the selected piece each frame.
 *   - Pulls the user's last saved design from localStorage and renders it
 *     via the designer's `buildPiece(state)` factory.
 *   - Ring  : locked to the proximal phalanx of the chosen finger
 *             (landmarks MCP↔PIP), full §4 SO(3) pose + roll + occluder.
 *   - Bracelet : locked to the wrist (landmark 0), oriented along the
 *             forearm axis (= wrist → palm-centre inverted), wrist-radius
 *             occluder, dorsal-side roll from world-space palm×finger.
 *
 *   - Earrings : Face Landmarker ear/lobe anchors.
 *   - Necklace : Pose Landmarker neck/shoulder/clavicle anchor.
 */

import * as THREE from "./three.module.js";
import { RGBELoader } from "./RGBELoader.js";

const HDR_URL = "assets/textures/studio_small_08_1k.hdr";

const TRIGGER_SELECTOR = "[data-ar-tryon]";
const STATE_KEY = "tj-custom-design-state";
const CALIBRATION_KEY = "tj-ar-tryon-calibration";
const TARGET_DETECTION_FPS = 30;
const MIN_DETECTION_FPS = 16;
const MAX_DETECTION_FPS = 42;
const MAX_PIXEL_RATIO = 2;

const MEDIAPIPE_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const WASM_BASE = `${MEDIAPIPE_BASE}/wasm`;
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const FACE_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const POSE_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task";

/* MediaPipe Face Mesh ear-adjacent landmarks. 234 (right) and 454 (left)
 * sit at the lateral edge of the face mesh near the tragus — they are the
 * most ear-like points the model exposes. The earlobe itself is not a
 * labelled landmark; we project downward along the inter-ear vector by
 * EARLOBE_DROP_RATIO × ear-to-ear distance so the hanging point falls on
 * the lobe. 0.22 was tuned to match adult anthropometric ratios where the
 * earlobe sits ~22% of the bizygomatic breadth below the tragus. */
const FACE_EAR_RIGHT = 234;
const FACE_EAR_LEFT = 454;
const EARLOBE_DROP_RATIO = 0.22;
/* Designer's earring pair sits at x = ±0.76 in local units — the lobe
 * hanging point sits exactly at (±0.76, 0). The renderer scales the pair
 * so the inter-lobe screen distance equals 1.52 × scale. */
const EARRING_PAIR_LOCAL_HALF_SPAN = 0.76;

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
 * just below the throat. Empirically this sits roughly NECK_BASE_RATIO of
 * the way from the shoulder midpoint toward the nose. */
const POSE_LEFT_SHOULDER = 11;
const POSE_RIGHT_SHOULDER = 12;
const POSE_NOSE = 0;
const POSE_LEFT_EAR = 7;
const POSE_RIGHT_EAR = 8;
const POSE_MOUTH_LEFT = 9;
const POSE_MOUTH_RIGHT = 10;
const POSE_LEFT_HIP = 23;
const POSE_RIGHT_HIP = 24;
const NECK_BASE_RATIO = 0.26;
const NECKLACE_MIN_SHOULDER_PX = 118;
const NECKLACE_CONTACT_SHADOW_OPACITY = 0.36;
const NECKLACE_WRAP_DEPTH_MIN = 0.10;
const NECKLACE_WRAP_DEPTH_MAX = 0.42;
const NECKLACE_CONTACT_Y_BY_STYLE = {
  Choker: -0.34,
  Station: -0.46,
  Pendant: -0.50,
  "Y-Drop": -0.50,
  Lariat: -0.44
};
/* Designer's necklace spans X ∈ [-silhouetteSpan/2, +silhouetteSpan/2] in
 * local units, with the group then scaled by 1.18 inside buildNecklace.
 * For the default Pendant silhouette silhouetteSpan = 3.8, so the visible
 * width of the chain measured in local units is ~3.8 × 1.18 = 4.484. The
 * AR scale maps shoulder-to-shoulder screen pixels onto that visible
 * width × NECKLACE_SHOULDER_FILL (the chain drapes inside the shoulder
 * line, not edge-to-edge). */
const NECKLACE_LOCAL_VISIBLE_SPAN = 3.8 * 1.18;
const NECKLACE_SHOULDER_FILL = 0.76;

// MediaPipe landmark indices we care about.
// 0=wrist, 5=index MCP, 9=middle MCP, 13=ring MCP, 14=ring PIP, 17=pinky MCP
const RING_MCP = 13;
const RING_PIP = 14;
const INDEX_MCP = 5;
const PINKY_MCP = 17;

/* Per-finger anthropometric ratios: finger diameter at the proximal phalanx
 * (where rings sit) as a fraction of the knuckle-bone hand width (index MCP
 * ↔ pinky MCP). Sourced from adult hand measurement studies; treat as a
 * coarse first-pass calibration with ±1 US ring size of error. */
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

// §5 contact body: per-finger anatomical taper for the depth-only occluder.
// `distal` ≈ R_PIP / R_proximal-mid, `proximal` ≈ R_MCP / R_proximal-mid.
// Sourced from adult hand morphometrics (Greiner 1991; Buryanov & Kotiuk
// 2010). Pinky has the tightest taper (shorter, slimmer phalanx); middle
// is the most cylindrical. Per-finger silhouettes eliminate the residual
// "index occluder looks too round / pinky occluder looks too thick" tells.
const FINGER_OCCLUDER_TAPER = {
  index:  { distal: 0.93, proximal: 1.11 },
  middle: { distal: 0.95, proximal: 1.09 },
  ring:   { distal: 0.94, proximal: 1.10 },
  pinky:  { distal: 0.91, proximal: 1.08 }
};

// §13 manufacturability / §5 fit: a real ring's outer radius is finger radius
// plus metal wall thickness. This lets AR scale to the actual tracked hand
// instead of a fixed one-size-fits-all 19 mm outer diameter.
const RING_WALL_THICKNESS_M = 0.00135;
const RING_CONTACT_CLEARANCE_M = 0.00025;

/* §5 contact fit — bracelet anthropometrics. Wrist diameter on adults is
 * a fairly tight ratio of the knuckle-line hand width (mean across mixed-
 * sex samples ≈ 0.62). Wall thickness is a touch more than a ring because
 * a bracelet's structural cross-section is larger. */
const WRIST_DIAMETER_RATIO = 0.62;
const BRACELET_WALL_THICKNESS_M = 0.0021;
const BRACELET_CONTACT_CLEARANCE_M = 0.0014;

const METAL_COLORS = {
  "White Gold": 0xe9eef2,
  "Yellow Gold": 0xeab64a,
  "Rose Gold": 0xd48a78,
  "Platinum": 0xdce3e8,
  "Champagne Gold": 0xd9b97a,
  "Black Gold": 0x39323a,
  "Mirror Silver": 0xf2f5f8,
  "Bronze Patina": 0x866241,
  "Two-Tone Mix": 0xe2c79a
};
const STONE_COLORS = {
  "Clear Diamond": 0xffffff,
  "Sapphire": 0x1f3b9a,
  "Ruby": 0xb1112c,
  "Emerald": 0x1b8b4e,
  "Pink Sapphire": 0xd86aa1,
  "Yellow Sapphire": 0xe6b73a,
  "Garnet": 0x7a1620,
  "Zircon": 0xc6e4f0,
  "Aquamarine": 0x8ad6ea,
  "Tanzanite": 0x4a3aa6,
  "Onyx": 0x111111
};

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
  return clamp(Number(point?.visibility ?? point?.presence ?? 1), 0, 1);
}

function readCalibration() {
  try {
    const raw = JSON.parse(localStorage.getItem(CALIBRATION_KEY) || "{}");
    return {
      fit: clamp(Number(raw.fit) || 1, 0.78, 1.26),
      lift: clamp(Number(raw.lift) || 0, -48, 48),
      side: clamp(Number(raw.side) || 0, -48, 48),
      roll: clamp(Number(raw.roll) || 0, -35, 35),
      facingMode: raw.facingMode === "environment" ? "environment" : "user"
    };
  } catch {
    return { fit: 1, lift: 0, side: 0, roll: 0, facingMode: "user" };
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
  object?.traverse?.((node) => {
    node.geometry?.dispose?.();

    if (Array.isArray(node.material)) {
      node.material.forEach(material => material.dispose?.());
    } else {
      node.material?.dispose?.();
    }
  });
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
    }
    @keyframes ar-fade-in { from { opacity: 0; } to { opacity: 1; } }
    .ar-tryon-stage {
      position: relative; flex: 1 1 auto;
      width: 100%; overflow: hidden;
      background: #0a0a0a;
    }
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
	      grid-template-columns: repeat(4, minmax(96px, 1fr)) auto;
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
        grid-template-columns: 1fr;
        width: min(340px, calc(100vw - 20px));
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
        <button type="button" class="ar-tryon-btn" data-ar-flip>Flip Camera</button>
        <button type="button" class="ar-tryon-btn" data-ar-snapshot>Save Snapshot</button>
        <button type="button" class="ar-tryon-btn" data-ar-close aria-label="Close AR try-on">Close ✕</button>
      </div>
      <div class="ar-tryon-calibration" aria-label="Adjust AR ring fit">
	        <label>Fit <output data-ar-fit-value>100%</output><input type="range" min="78" max="126" step="1" value="100" data-ar-fit></label>
	        <label>Lift <output data-ar-lift-value>0px</output><input type="range" min="-48" max="48" step="1" value="0" data-ar-lift></label>
	        <label>Side <output data-ar-side-value>0px</output><input type="range" min="-48" max="48" step="1" value="0" data-ar-side></label>
	        <label>Tilt <output data-ar-roll-value>0°</output><input type="range" min="-35" max="35" step="1" value="0" data-ar-roll></label>
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
	        <span>AR Lock</span>
	        <b data-ar-quality-value>0%</b>
	        <i data-ar-quality-bar></i>
	      </div>
      <div class="ar-tryon-status" data-ar-status>Requesting camera…</div>
      <div class="ar-tryon-hint">Hold your hand up to the camera</div>
    </div>
  `;
  return modal;
}

// Build a lightweight ring matching the designed metal + stone + halo + side stones.
function buildRing(state) {
  const group = new THREE.Group();

  const metalName = state?.metal || "Yellow Gold";
  const stoneName = state?.stone || "Clear Diamond";
  const cut = state?.cut || "Round";
  const halo = state?.halo && state.halo !== "None" ? state.halo : null;
  const sideStones = !!state?.sideStones;
  const metalColor = METAL_COLORS[metalName] ?? METAL_COLORS["Yellow Gold"];
  const stoneColor = STONE_COLORS[stoneName] ?? STONE_COLORS["Clear Diamond"];

  const metalMat = new THREE.MeshPhysicalMaterial({
    color: metalColor,
    metalness: 1.0,
    roughness: 0.16,
    clearcoat: 0.55,
    clearcoatRoughness: 0.18
  });

  // Band — TorusGeometry; local +Y is "up" (toward setting), torus axis = Z (the finger).
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(1.0, 0.13, 24, 128),
    metalMat
  );
  group.add(band);

  // Setting head sits at the top of the band.
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.0, 0);
  group.add(headGroup);

  // Collet (basket under the stone)
  const collet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.30, 0.20, 0.16, 24),
    metalMat
  );
  collet.position.y = 0.07;
  headGroup.add(collet);

  // Prongs — 4 for Round/Princess/Oval, 4 corner for emerald-cut
  const prongCount = (cut === "Emerald") ? 4 : 4;
  const prongOffset = (cut === "Emerald" || cut === "Princess") ? Math.PI / 4 : Math.PI / 4;
  for (let i = 0; i < prongCount; i++) {
    const ang = (i / prongCount) * Math.PI * 2 + prongOffset;
    const prong = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.05, 0.32, 12),
      metalMat
    );
    prong.position.set(Math.cos(ang) * 0.27, 0.22, Math.sin(ang) * 0.27);
    // tip bead
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), metalMat);
    bead.position.y = 0.16;
    bead.scale.set(1, 0.7, 1);
    prong.add(bead);
    headGroup.add(prong);
  }

  // Center stone — geometry varies by cut.
  let stoneGeo;
  let stoneScale = [1, 0.85, 1];
  switch (cut) {
    case "Princess":
      stoneGeo = new THREE.BoxGeometry(0.5, 0.42, 0.5);
      stoneScale = [1, 1, 1];
      break;
    case "Emerald":
      stoneGeo = new THREE.BoxGeometry(0.55, 0.32, 0.42);
      stoneScale = [1, 1, 1];
      break;
    case "Oval":
      stoneGeo = new THREE.SphereGeometry(0.30, 32, 24);
      stoneScale = [1.4, 0.78, 1];
      break;
    case "Pear":
      stoneGeo = new THREE.ConeGeometry(0.34, 0.7, 32);
      stoneScale = [1, 0.62, 1];
      break;
    case "Cushion":
      stoneGeo = new THREE.BoxGeometry(0.48, 0.4, 0.48);
      stoneScale = [1, 1, 1];
      break;
    case "Marquise":
      stoneGeo = new THREE.SphereGeometry(0.32, 32, 24);
      stoneScale = [1.6, 0.65, 0.85];
      break;
    case "Round":
    default:
      stoneGeo = new THREE.OctahedronGeometry(0.34, 2);
      stoneScale = [1, 0.85, 1];
  }
  const isClear = stoneName === "Clear Diamond";
  const stone = new THREE.Mesh(
    stoneGeo,
    new THREE.MeshPhysicalMaterial({
      color: stoneColor,
      metalness: 0.0,
      roughness: 0.02,
      transmission: isClear ? 0.9 : 0.55,
      ior: isClear ? 2.4 : 1.74,
      thickness: 0.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      attenuationDistance: 1.4,
      attenuationColor: new THREE.Color(stoneColor).lerp(new THREE.Color(0xffffff), 0.5),
      reflectivity: 0.95,
      dispersion: isClear ? 0.06 : 0.02
    })
  );
  stone.position.y = 0.32;
  stone.scale.set(...stoneScale);
  if (cut === "Princess" || cut === "Cushion") stone.rotation.y = Math.PI / 4;
  headGroup.add(stone);

  // Halo — small ring of diamonds around the center stone.
  if (halo) {
    const haloRadius = Math.max(stoneScale[0], stoneScale[2]) * 0.32 + 0.12;
    const haloMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.02,
      transmission: 0.85,
      ior: 2.4,
      thickness: 0.18,
      clearcoat: 1.0,
      dispersion: 0.05
    });
    const haloCount = 16;
    for (let i = 0; i < haloCount; i++) {
      const a = (i / haloCount) * Math.PI * 2;
      const tiny = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 1), haloMat);
      tiny.position.set(Math.cos(a) * haloRadius, 0.30, Math.sin(a) * haloRadius);
      tiny.scale.setScalar(1);
      headGroup.add(tiny);
    }
  }

  // Side stones — tiny diamonds set along the band's shoulders.
  if (sideStones) {
    const sideMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.04,
      transmission: 0.8,
      ior: 2.4,
      thickness: 0.15,
      clearcoat: 1.0
    });
    const positions = [-0.6, -0.45, -0.3, 0.3, 0.45, 0.6];
    for (const a of positions) {
      const angle = (Math.PI / 2) - a;  // span from top toward sides
      const r = 1.0;
      const stoneSide = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 1), sideMat);
      stoneSide.position.set(Math.cos(angle) * r, Math.sin(angle) * r, 0);
      // tip toward outside
      stoneSide.lookAt(stoneSide.position.clone().multiplyScalar(2));
      headGroup.add(stoneSide);
    }
  }

  // Cache a reference to swap finger/scale base later.
  group.userData.metalColor = metalColor;
  group.userData.stoneColor = stoneColor;
  return group;
}

/* --- One-Euro filter ----------------------------------------------------
   Smooth noisy signals while staying responsive. Cleaner than EMA for
   tracking data because cutoff adapts to the signal's velocity. */
class OneEuro {
  constructor(minCutoff = 1.0, beta = 0.02, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }
  _alpha(cutoff, dt) {
    const r = 2 * Math.PI * cutoff * dt;
    return r / (r + 1);
  }
  filter(x, t) {
    if (this.xPrev == null) {
      this.xPrev = x;
      this.tPrev = t;
      return x;
    }
    const dt = Math.max(1e-3, (t - this.tPrev) / 1000);
    const dx = (x - this.xPrev) / dt;
    const aD = this._alpha(this.dCutoff, dt);
    const dxHat = aD * dx + (1 - aD) * this.dxPrev;
    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const a = this._alpha(cutoff, dt);
    const xHat = a * x + (1 - a) * this.xPrev;
    this.xPrev = xHat;
    this.dxPrev = dxHat;
    this.tPrev = t;
    return xHat;
  }
  reset() {
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }
}

class ARTryOn {
  constructor() {
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
    this.stream = null;
    this.rafId = null;
    this.lastVideoTime = -1;
    this.lastDetectMs = 0;
    this.activeFinger = "ring";
    this.pieceType = "Ring";
    this.statusEl = null;
    this.handLostFrames = 0;
    this.calibration = readCalibration();
    this.facingMode = this.calibration.facingMode;
    this.detectInterval = 1000 / TARGET_DETECTION_FPS;
    this._lastLightSample = 0;
    this._lightProbe = null;
    this._isRestartingCamera = false;
    this._designState = null;
    this._detectCostEMA = 1000 / TARGET_DETECTION_FPS;
    this._poseConfidence = 0;
    this._poseConfidenceTarget = 0;
    this._motionEnergy = 0;
    this._poseDeltaEnergy = 0;
    this._badPoseFrames = 0;
    this._lastPoseForDelta = null;
    this._lastStageNorm = null;
    this._localBrightness = 0.55;
    this._localLightColor = new THREE.Color(1, 1, 1);
    this._lightGradient = { x: 0, y: -0.25 };
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
    this._necklaceLocalVisibleSpan = NECKLACE_LOCAL_VISIBLE_SPAN;
    this._necklaceLocalHeight = 1;
    this._necklaceAnchorLocal = new THREE.Vector3();
    this._necklaceWrapTargets = [];
    this._necklaceWrapHalfSpan = NECKLACE_LOCAL_VISIBLE_SPAN * 0.5;
    this._necklaceWrapMinY = -1;
    this._necklaceWrapHeight = 1;
    this._necklaceWrapState = { depth: 0, lift: 0, turn: 0 };
    this._sparklePhase = Math.random() * Math.PI * 2;
    this._sparkleLights = [];
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
    this.filtPx = new OneEuro(1.0, 0.015);
    this.filtPy = new OneEuro(1.0, 0.015);
    this.filtScale = new OneEuro(0.3, 0.006);
    // Angle: filter sin/cos separately so the wrap at ±π doesn't cause jumps.
    this.filtAngleSin = new OneEuro(1.0, 0.02);
    this.filtAngleCos = new OneEuro(1.0, 0.02);
    // Pitch: extra-slow filter — finger pitch from foreshortening is noisy.
    this.filtPitch = new OneEuro(0.4, 0.008);
    // Roll: stone/head orientation around the finger axis. This lets the ring
    // follow the dorsal/top side of the hand instead of always facing camera.
    // §4 — the 3D dorsal-axis roll has slightly more high-frequency content
    // than the old screen-wrist heuristic (it picks up palm-vs-finger world
    // jitter from MediaPipe), so soften the floor cutoff a touch. β stays
    // the same so fast hand rotations still catch up quickly.
    this.filtRoll = new OneEuro(0.45, 0.012);
    // Finger diameter (meters) filtered hard — the digit display would
    // flicker between sizes otherwise. Low cutoff + low beta = lazy lock.
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

    /* §4 forward-predictive pose extrapolation (constant-velocity Kalman
     * lite). The detection pipeline (video decode → MediaPipe inference →
     * JS post-process) introduces ≈30–60 ms of latency between the real
     * hand position and the pose that reaches the renderer. Rather than
     * letting the lerp catch up reactively, we track the velocity of the
     * smoothed target pose across detection frames and push the lerp
     * target forward at each rAF by `velocity × t_predict` where
     * t_predict = clamp(now − last_detection_time, 0, 60 ms) · confidence.
     * That hides the latency: the displayed pose is where the hand will
     * be by the time the photons hit the display, not where it was when
     * the last detection finished. Confidence-gated and capped so a noisy
     * detection can't run away. */
    this._lastDetectionTime = 0;
    this._velPx = 0;
    this._velPy = 0;
    this._velScale = 0;
    this._tgtPrevX = 0;
    this._tgtPrevY = 0;
    this._tgtPrevScale = 1;
    this._predTgtPos = new THREE.Vector3();
  }

  async open() {
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
    this.fitValueEl = this.modal.querySelector("[data-ar-fit-value]");
    this.liftValueEl = this.modal.querySelector("[data-ar-lift-value]");
    this.sideValueEl = this.modal.querySelector("[data-ar-side-value]");
    this.rollValueEl = this.modal.querySelector("[data-ar-roll-value]");
    this.fingerSelectEl = this.modal.querySelector(".ar-tryon-finger-select");
    this.hintEl = this.modal.querySelector(".ar-tryon-hint");

    /* Piece dispatch — read the last saved design state to decide which
     * tracking strategy + UI affordances to use. Rings show a finger picker
     * + US/EU size readout. Bracelets hide those, anchor at the wrist, and
     * relabel the hint. Any unknown piece falls back to ring. */
    const stateEarly = readDesignState();
    this.pieceType = stateEarly?.piece === "Bracelet" ? "Bracelet"
      : stateEarly?.piece === "Earrings" ? "Earrings"
      : stateEarly?.piece === "Necklace" ? "Necklace"
      : "Ring";
    if (this.pieceType === "Bracelet") {
      this.modal.setAttribute("aria-label", "AR bracelet try-on");
      if (this.fingerSelectEl) this.fingerSelectEl.hidden = true;
      if (this.sizeEl) this.sizeEl.hidden = true;
      if (this.hintEl) this.hintEl.textContent = "Show your wrist to the camera";
    } else if (this.pieceType === "Earrings") {
      this.modal.setAttribute("aria-label", "AR earring try-on");
      if (this.fingerSelectEl) this.fingerSelectEl.hidden = true;
      if (this.sizeEl) this.sizeEl.hidden = true;
      if (this.hintEl) this.hintEl.textContent = "Face the camera so both ears are visible";
    } else if (this.pieceType === "Necklace") {
      this.modal.setAttribute("aria-label", "AR necklace try-on");
      if (this.fingerSelectEl) this.fingerSelectEl.hidden = true;
      if (this.sizeEl) this.sizeEl.hidden = true;
      if (this.hintEl) this.hintEl.textContent = "Step back so head and shoulders are visible";
    }

    this.applyCameraClass();
    this.syncCalibrationControls();

    this.modal.querySelector("[data-ar-close]").addEventListener("click", () => this.close());
    this.modal.querySelector("[data-ar-snapshot]").addEventListener("click", () => this.snapshot());
    this.modal.querySelector("[data-ar-flip]").addEventListener("click", () => this.flipCamera());
    this.modal.querySelector("[data-ar-reset-fit]").addEventListener("click", () => {
      this.calibration.fit = 1;
      this.calibration.lift = 0;
      this.calibration.side = 0;
      this.calibration.roll = 0;
      this.persistCalibration();
      this.syncCalibrationControls();
    });
    [this.fitInput, this.liftInput, this.sideInput, this.rollInput].forEach((input) => {
      input?.addEventListener("input", () => {
        this.calibration.fit = Number(this.fitInput?.value || 100) / 100;
        this.calibration.lift = Number(this.liftInput?.value || 0);
        this.calibration.side = Number(this.sideInput?.value || 0);
        this.calibration.roll = Number(this.rollInput?.value || 0);
        this.persistCalibration();
        this.syncCalibrationLabels();
      });
    });
    this.modal.querySelectorAll(".ar-tryon-finger-select button").forEach(btn => {
      btn.addEventListener("click", () => {
        this.modal.querySelectorAll(".ar-tryon-finger-select button").forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        this.activeFinger = btn.dataset.finger;
        // §5 swap the depth-only occluder to the new finger's anatomical
        // taper so the silhouette cutout always matches the real digit.
        this.rebuildOccluderGeometry();
        this.resetTrackingFilters();
        if (this.ring) this.ring.visible = false;
      });
    });
    document.addEventListener("keydown", this._onKey = (e) => {
      if (e.key === "Escape") this.close();
    });

    try {
      this.setStatus("Requesting camera…");
      await this.startCamera();
      this.setStatus(
        this.pieceType === "Earrings" ? "Loading face tracking…"
        : this.pieceType === "Necklace" ? "Loading body tracking…"
        : "Loading hand tracking…"
      );
      await this.startMediaPipe();
      this.setStatus("Initializing 3D…");
      this.startThree();
      this.setStatus("");
      this.loop();
    } catch (err) {
      console.error("[AR] Init failed:", err);
      this.setStatus(`Could not start AR: ${err.message || err}`);
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

  applyCameraClass() {
    this.modal?.classList.toggle("is-world-camera", this.facingMode === "environment");
  }

  get isMirrored() {
    return this.facingMode !== "environment";
  }

  persistCalibration() {
    this.calibration.facingMode = this.facingMode;
    writeCalibration(this.calibration);
  }

  syncCalibrationLabels() {
    if (this.fitValueEl) this.fitValueEl.textContent = `${Math.round(this.calibration.fit * 100)}%`;
    if (this.liftValueEl) this.liftValueEl.textContent = `${Math.round(this.calibration.lift)}px`;
    if (this.sideValueEl) this.sideValueEl.textContent = `${Math.round(this.calibration.side)}px`;
    if (this.rollValueEl) this.rollValueEl.textContent = `${Math.round(this.calibration.roll || 0)}°`;
  }

  syncCalibrationControls() {
    if (this.fitInput) this.fitInput.value = String(Math.round(this.calibration.fit * 100));
    if (this.liftInput) this.liftInput.value = String(Math.round(this.calibration.lift));
    if (this.sideInput) this.sideInput.value = String(Math.round(this.calibration.side));
    if (this.rollInput) this.rollInput.value = String(Math.round(this.calibration.roll || 0));
    this.syncCalibrationLabels();
  }

  /* §5 rebuild the depth-only finger occluder to the active finger's
   * anatomical taper. Called on first occluder creation (from startThree)
   * and again whenever the user picks a different finger. Disposes the
   * old geometry to avoid GPU leaks. The base radius / length / material
   * are reused — only the cylinder taper ratios change. */
  rebuildOccluderGeometry() {
    if (!this._occluder || !this._occluderBaseRadius || !this._occluderBaseLength) return;
    const taper = this.pieceType === "Bracelet"
      ? { distal: 0.96, proximal: 1.00 }
      : (FINGER_OCCLUDER_TAPER[this.activeFinger] || FINGER_OCCLUDER_TAPER.ring);
    const fingerR = this._occluderBaseRadius;
    const fingerL = this._occluderBaseLength;
    const next = new THREE.CylinderGeometry(
      fingerR * taper.distal,
      fingerR * taper.proximal,
      fingerL,
      48, 1, false
    );
    next.rotateX(Math.PI / 2);
    this._occluder.geometry.dispose();
    this._occluder.geometry = next;
  }

  resetTrackingFilters() {
    [
      this.filtPx,
      this.filtPy,
      this.filtScale,
      this.filtAngleSin,
      this.filtAngleCos,
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

  prepareNecklaceSmartWrap(bb, pieceSize) {
    this._necklaceWrapTargets = [];
    if (this.pieceType !== "Necklace" || !this.ring) return;

    const baseRootScale = Math.max(1e-3, this.ring.scale.x || 1);
    const invRootScale = 1 / baseRootScale;
    const localMinY = bb.min.y * invRootScale;
    const localMaxY = bb.max.y * invRootScale;
    const localHeight = Math.max((bb.max.y - bb.min.y) * invRootScale, 1);
    const localSpan = Math.max(pieceSize.x * invRootScale, NECKLACE_LOCAL_VISIBLE_SPAN * 0.72);
    const style = this._designState?.silhouette || "Pendant";
    const styleContactY = NECKLACE_CONTACT_Y_BY_STYLE[style] ?? NECKLACE_CONTACT_Y_BY_STYLE.Pendant;
    const contactY = clamp(
      styleContactY,
      localMinY + localHeight * 0.30,
      localMaxY - localHeight * 0.08
    );

    this._necklaceLocalVisibleSpan = Math.max(localSpan * 0.94, NECKLACE_LOCAL_VISIBLE_SPAN * 0.72, 1e-3);
    this._necklaceLocalHeight = localHeight;
    this._necklaceWrapHalfSpan = Math.max(localSpan * 0.5, 1.1);
    this._necklaceWrapMinY = localMinY;
    this._necklaceWrapHeight = localHeight;
    this._necklaceAnchorLocal.set(0, contactY, 0);

    /* §5 smart wrapping: capture each direct child in its manufactured local
     * position. During AR tracking we apply a reversible neck-cylinder warp to
     * those child transforms only. Direct-child wrapping avoids double warping
     * nested settings/prongs while still making every chain bead/link follow
     * the collar curve. */
    for (const child of this.ring.children) {
      child.userData.arWrapBasePosition = child.position.clone();
      child.userData.arWrapBaseQuaternion = child.quaternion.clone();
      this._necklaceWrapTargets.push(child);
    }
  }

  applyNecklaceSmartWrapping({ yaw, confidence, axisScore, faceScore, sizeScore }) {
    if (this.pieceType !== "Necklace" || !this._necklaceWrapTargets.length) return;

    const localSpan = this._necklaceLocalVisibleSpan || NECKLACE_LOCAL_VISIBLE_SPAN;
    const halfSpan = Math.max(this._necklaceWrapHalfSpan || localSpan * 0.5, 1e-3);
    const height = Math.max(this._necklaceWrapHeight || 1, 1e-3);
    const minY = this._necklaceWrapMinY || -height;
    const lock = clamp(confidence * (0.74 + faceScore * 0.26), 0, 1);
    const yawEnergy = clamp(Math.abs(yaw) / 0.55, 0, 1);
    const badAxis = 1 - clamp(axisScore, 0, 1);
    const depthTarget = localSpan * clamp(
      0.035 + yawEnergy * 0.055 + badAxis * 0.022,
      NECKLACE_WRAP_DEPTH_MIN / localSpan,
      NECKLACE_WRAP_DEPTH_MAX / localSpan
    ) * lock;
    const liftTarget = localSpan * clamp(0.014 + (1 - sizeScore) * 0.010 + badAxis * 0.006, 0.012, 0.034) * lock;
    const turnTarget = clamp(0.18 + yawEnergy * 0.24 + badAxis * 0.12, 0.14, 0.48) * lock;
    const a = 0.24;

    this._necklaceWrapState.depth += (depthTarget - this._necklaceWrapState.depth) * a;
    this._necklaceWrapState.lift += (liftTarget - this._necklaceWrapState.lift) * a;
    this._necklaceWrapState.turn += (turnTarget - this._necklaceWrapState.turn) * a;

    const depth = this._necklaceWrapState.depth;
    const lift = this._necklaceWrapState.lift;
    const turn = this._necklaceWrapState.turn;

    for (const child of this._necklaceWrapTargets) {
      const basePos = child.userData.arWrapBasePosition;
      const baseQuat = child.userData.arWrapBaseQuaternion;
      if (!basePos || !baseQuat) continue;

      const xNorm = clamp(basePos.x / halfSpan, -1, 1);
      const side = Math.abs(xNorm);
      const yNorm = clamp((basePos.y - minY) / height, 0, 1);
      const chainMask = smoothstep(0.38, 0.92, yNorm);
      const wrapMask = (0.22 + chainMask * 0.78) * Math.pow(side, 1.45);
      const sideLift = lift * Math.pow(side, 1.7) * chainMask;
      const sideRecede = depth * wrapMask;
      const frontRelax = depth * 0.10 * (1 - side) * smoothstep(0.28, 0.78, yNorm);

      child.position.set(
        basePos.x,
        basePos.y + sideLift,
        basePos.z - sideRecede + frontRelax
      );

      this._wrapQuat.setFromAxisAngle(this._wrapAxisY, -xNorm * turn * chainMask);
      child.quaternion.copy(baseQuat).premultiply(this._wrapQuat);
    }
  }

  updateQualityReadout() {
    if (!this.qualityEl) return;
    const visible = !!(this.ring?.visible && this._hasTarget);
    this.qualityEl.hidden = !visible;
    if (!visible) return;
    const shadowOpacity = this.pieceType === "Necklace"
      ? this._targetNeckShadowOpacity
      : this._targetShadowOpacity;
    const shadowBase = this.pieceType === "Necklace"
      ? this._neckShadowBaseOpacity
      : this._shadowBaseOpacity;
    const contactOpacity = (shadowOpacity || 0) / Math.max(0.01, shadowBase || 0.85);
    const tracking = clamp(this._poseConfidence, 0, 1);
    const contact = clamp(contactOpacity, 0, 1);
    const motionPenalty = 1 - smoothstep(0.18, 0.72, this._motionEnergy);
    // §4 jitter residual penalty — penalise post-filter jitter that survived
    // the One-Euro stage. smoothstep keeps small residuals invisible.
    const stability = 1 - smoothstep(0.04, 0.32, this._jitterEMA || 0);
    // §14 reality score: S_real = exp(-E_real), with E_real = w·(1-tracking)
    //   + w·(1-contact) + w·motion + w·(1-stability). Linear weights here
    //   are a faithful first-order Taylor expansion around S_real ≈ 1 and
    //   stay readable to the user.
    const score = clamp(
      tracking * 0.50 + contact * 0.22 + motionPenalty * 0.10 + stability * 0.18,
      0, 1
    );
    const pct = Math.round(score * 100);
    if (this.qualityValueEl) this.qualityValueEl.textContent = `${pct}%`;
    if (this.qualityBarEl) this.qualityBarEl.style.setProperty("--ar-lock", `${pct}%`);
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
    const hands = result?.landmarks || [];
    const worlds = result?.worldLandmarks || [];
    let best = null;

    hands.forEach((landmarks, index) => {
      const world = worlds[index];

      if (!landmarks?.[baseIdx] || !landmarks?.[tipIdx] || !world?.[baseIdx] || !world?.[tipIdx]) {
        return;
      }

      const base = this.landmarkToStage(landmarks[baseIdx], metrics);
      const tip = this.landmarkToStage(landmarks[tipIdx], metrics);
      const wrist = this.landmarkToStage(landmarks[0], metrics);
      const fingerLength = Math.hypot(tip.x - base.x, tip.y - base.y);
      const handWidth = landmarks[INDEX_MCP] && landmarks[PINKY_MCP]
        ? this.landmarkDistance(landmarks[INDEX_MCP], landmarks[PINKY_MCP], metrics)
        : fingerLength * 2.4;
      const centerDistance = Math.hypot((base.x + tip.x) * 0.5, (base.y + tip.y) * 0.5);
      const wristPenalty = Math.max(0, Math.hypot(wrist.x, wrist.y) - Math.max(metrics.width, metrics.height) * 0.18);
      const score = fingerLength * 1.4 + handWidth * 0.34 - centerDistance * 0.16 - wristPenalty * 0.08;

      if (!best || score > best.score) {
        best = { landmarks, world, index, score };
      }
    });

    return best;
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
    const presence = used.reduce((sum, idx) => sum + landmarkPresence(landmarks[idx]), 0) / used.length;
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

  /* Convert real-world hand width (meters) into an estimated ring size for
   * the currently-selected finger and update the size chip UI. The math:
   *
   *   fingerDiameter_m = handWidth_m * ratio[finger]
   *   circumference_mm = fingerDiameter_m * 1000 * π
   *   US size        ≈ (innerDiameter_mm − 11.63) / 0.8128   (Wheatsheaf)
   *   UK letter       = lookup table indexed by half-size
   *   EU size        ≈ circumference_mm − 40                  (ISO 8653)
   *
   * Numbers are advisory ±1 US size; we surface this as "Estimated" so
   * customers don't take a sizing screenshot as gospel. */
  _updateSizeReadout(handWidthM, now) {
    const ratio = FINGER_DIAMETER_RATIO[this.activeFinger] || FINGER_DIAMETER_RATIO.ring;
    const rawDia = handWidthM * ratio;                       // meters
    const dia = this.filtFingerDia.filter(rawDia, now);      // smoothed
    if (!this.sizeEl) return dia;
    const diaMm = dia * 1000;
    const circMm = diaMm * Math.PI;
    const usRaw = (diaMm - 11.63) / 0.8128;
    // Clamp + round to nearest half-size; below 3 or above 13 is unusual.
    const usClamped = Math.max(3, Math.min(13, usRaw));
    const usHalf = Math.round(usClamped * 2) / 2;
    const euRaw = Math.round(circMm - 40);
    this.sizeEl.hidden = false;
    this.sizeValueEl.textContent = `US ${usHalf.toFixed(1)}`;
    this.sizeSubEl.textContent = `${diaMm.toFixed(1)} mm \u00b7 EU ${euRaw}`;
    return dia;
  }

  async startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera API not supported in this browser.");
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: this.facingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30, max: 60 }
      },
      audio: false
    });
    this.video.srcObject = this.stream;
    await new Promise((resolve) => {
      if (this.video.readyState >= 2) resolve();
      else this.video.addEventListener("loadeddata", () => resolve(), { once: true });
    });
    await this.video.play();
    this.lastVideoTime = -1;
    this.lastDetectMs = 0;
    this.handLostFrames = 0;
    this.applyCameraClass();
    this.persistCalibration();
  }

  async flipCamera() {
    if (this._isRestartingCamera) return;
    this._isRestartingCamera = true;
    this.setStatus("Switching camera...");
    this.facingMode = this.facingMode === "user" ? "environment" : "user";
    this.applyCameraClass();
    try {
      await this.startCamera();
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

  async startMediaPipe() {
    // Dynamically import to avoid blocking the customs page load.
    const vision = await import(/* @vite-ignore */ `${MEDIAPIPE_BASE}/vision_bundle.mjs`);
    const fileset = await vision.FilesetResolver.forVisionTasks(WASM_BASE);
    if (this.pieceType === "Earrings") {
      this.faceLandmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFacialTransformationMatrixes: true,
        outputFaceBlendshapes: false,
        minFaceDetectionConfidence: 0.50,
        minFacePresenceConfidence: 0.50,
        minTrackingConfidence: 0.50
      });
    } else if (this.pieceType === "Necklace") {
      this.poseLandmarker = await vision.PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.50,
        minPosePresenceConfidence: 0.50,
        minTrackingConfidence: 0.50
      });
    } else {
      this.handLandmarker = await vision.HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numHands: 2,
        // §12 delta budget: lower the detection floor so re-acquisition happens
        // quickly when the hand briefly leaves frame. The downstream confidence
        // gate (estimatePoseConfidence ≥ 0.22) protects against bad poses being
        // committed; raising the MediaPipe floor only slows re-lock.
        minHandDetectionConfidence: 0.50,
        minHandPresenceConfidence: 0.50,
        minTrackingConfidence: 0.50
      });
    }
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

    // Orthographic camera in pixel space (top-left origin, but three uses center;
    // we'll map landmark x→canvas X (mirrored) and y→canvas Y).
    this.camera = new THREE.OrthographicCamera(
      -rect.width / 2, rect.width / 2,
      rect.height / 2, -rect.height / 2,
      -1000, 1000
    );
    this.camera.position.z = 100;

    // Lighting rig — acts as a fallback before the HDR env loads, and
    // adds shaped specular punch on top of the env's diffuse contribution.
    // The sparkle light is animated each frame to make the gem scintillate.
    this._hemi = new THREE.HemisphereLight(0xffffff, 0x404a55, 0.55);
    this.scene.add(this._hemi);
    this._key = new THREE.DirectionalLight(0xffffff, 1.4);
    this._key.position.set(0.8, 1.0, 0.6);
    this.scene.add(this._key);
    this._fill = new THREE.DirectionalLight(0xc7d6ff, 0.55);
    this._fill.position.set(-0.7, 0.4, 0.5);
    this.scene.add(this._fill);
    this._rim = new THREE.DirectionalLight(0xfff1d8, 0.7);
    this._rim.position.set(-0.2, 0.6, -1);
    this.scene.add(this._rim);
    // §11 phase-memory sparkle rig — three small point lights with locked
    // phase offsets. Intensity is driven by hand motion + local camera light,
    // so scintillation appears when the hand moves, not as arbitrary blinking.
    this._sparkleLights = [
      new THREE.PointLight(0xffffff, 1.2, 0, 2),
      new THREE.PointLight(0xdfe8ff, 0.55, 0, 2),
      new THREE.PointLight(0xffefd0, 0.45, 0, 2)
    ];
    this._sparkleLight = this._sparkleLights[0];
    this._sparkleLights.forEach((light, index) => {
      light.position.set(index * 42 - 42, 30, 200);
      this.scene.add(light);
    });
    this._lightProbe = document.createElement("canvas");
    this._lightProbe.width = 28;
    this._lightProbe.height = 18;
    this._lightProbeCtx = this._lightProbe.getContext("2d", { willReadFrequently: true });

    const state = readDesignState();
    this._designState = state || {};
    // Prefer the designer's full ring builder (halo, prongs, milgrain,
    // hallmark, pavé, channel, baguette flanks, etc.) when available.
    // Falls back to the simplified buildRing() if the designer module
    // hasn't initialised yet or the page didn't load it.
    const factory = (typeof window !== "undefined" && window.__tjcDesigner && window.__tjcDesigner.buildPiece) || null;
    if (factory) {
      try {
        this.ring = factory(state);
      } catch (err) {
        console.warn("[AR] designer buildPiece failed, falling back to simple ring:", err);
        this.ring = buildRing(state);
      }
    } else {
      this.ring = buildRing(state);
    }
    // Lock the band's plane perpendicular to the camera by default (the
    // applyResult() basis will then rotate it to track the finger). The
    // designer ring is built with the band axis on local +Z, head pointing
    // local +Y — which is exactly what our AR basis expects.
    // Cache the band's outer radius in LOCAL units so scale calibration
    // converts physical mm → px correctly regardless of which ring style
    // is loaded. We take half the X-extent because the head/stone push
    // +Y but not +X, so max.x ≈ band outer radius.
    const bb = new THREE.Box3().setFromObject(this.ring);
    const pieceSize = new THREE.Vector3();
    bb.getSize(pieceSize);
    this._ringLocalOuterR = Math.max(bb.max.x, -bb.min.x, 1e-3);
    if (this.pieceType === "Necklace") {
      this.prepareNecklaceSmartWrap(bb, pieceSize);
    } else {
      this._necklaceLocalVisibleSpan = Math.max(pieceSize.x * 0.94, NECKLACE_LOCAL_VISIBLE_SPAN * 0.72, 1e-3);
      this._necklaceLocalHeight = Math.max(pieceSize.y, 1);
      this._necklaceAnchorLocal.set(0, 0, 0);
    }

    /* Realism boost — crank env reflections on every PBR material under
     * the ring. The HDR studio probe gives crisp highlights that read as
     * "polished metal" / "faceted gem" once envMapIntensity is pushed
     * past 1. Also nudge stone roughness down + clearcoat-ish look. */
    this.ring.traverse((node) => {
      if (!node.isMesh || !node.material) return;
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      for (const m of mats) {
        if ("envMapIntensity" in m) m.envMapIntensity = 1.6;
        // Stones — sharpen the faceted look.
        const isStone = m.transparent || (m.transmission !== undefined && m.transmission > 0) ||
          /stone|gem|diamond|emerald|sapphire|ruby/i.test(m.name || "");
        if (isStone && "roughness" in m) m.roughness = Math.min(m.roughness ?? 0.1, 0.05);
      }
    });

    this.scene.add(this.ring);
    this.ring.visible = false;

    /* ----- finger occluder -----
     * Skipped entirely for earrings: an earring hangs in air at the
     * earlobe and does not need a depth-only sleeve, and a hard contact
     * shadow would imply a surface the earring is resting on (none exists
     * — the lobe is a thin flap, not a flat plane). All downstream
     * references to `_occluder` / `_shadow` are null-guarded already, so
     * the contact-visual lerp inside updateContactVisuals becomes a no-op. */
    if (this.pieceType !== "Earrings" && this.pieceType !== "Necklace") {
    /* ----- finger occluder body -----
     * radius of the finger itself, parented to the ring so it inherits
     * the same pose + scale. It writes ONLY to the depth buffer
     * (colorWrite=false), so fragments of the ring band that fall behind
     * the cylinder's near surface fail their depth test — i.e. the BACK
     * HALF of the band (the portion that would be behind the finger
     * flesh) disappears. The top of the band, the head, and the underside
     * sit OUTSIDE the cylinder's screen footprint, so they remain fully
     * visible. Render order is forced negative so it draws before the
     * ring regardless of THREE's sort heuristics.
     *
     * Finger radius is approximated as 0.85 × ring outer radius (the band
     * is ~15% thicker than the finger inner hole on a snug fit). Length
     * is 8 × outer radius so the sleeve extends well past the PIP and MCP
     * landmarks in either direction. */
    const isBracelet = this.pieceType === "Bracelet";
    const fingerR = this._ringLocalOuterR * (isBracelet ? 0.97 : 0.92);
    const fingerL = this._ringLocalOuterR * 14;
    this._occluderBaseRadius = fingerR;
    this._occluderBaseLength = fingerL;
    this._targetFingerLocalRadius = fingerR;
    /* §5 contact body: real proximal phalanges taper from MCP-wide to
     * PIP-narrow. CylinderGeometry(top, bottom, …) → after rotateX(π/2)
     * the +Y top maps to local +Z (= finger axis from base to tip, i.e.
     * the distal/PIP direction). So radiusTop = PIP-narrow ≈ 0.94·R,
     * radiusBottom = MCP-wide ≈ 1.10·R. This makes the depth-only
     * occluder match the silhouette of a real digit, eliminating the
     * "cylindrical sausage" cutout artefact at the band's near and far
     * edges. Anatomical taper sourced from adult hand morphometrics
     * (mean ratio R_PIP/R_MCP ≈ 0.85 per Greiner 1991 — we soften to
     * 0.94/1.10 because the ring sits proximal-of-PIP, not at PIP itself).
     *
     * Bracelets sit on the wrist, which is much closer to a true cylinder
     * with only a slight ulnar/radial taper toward the hand. Use a near-
     * uniform 0.96 / 1.00 profile so the depth-only occluder hides the
     * back half of the band without sculpting a finger-shape silhouette.
     */
    const taper = isBracelet
      ? { distal: 0.96, proximal: 1.00 }
      : (FINGER_OCCLUDER_TAPER[this.activeFinger] || FINGER_OCCLUDER_TAPER.ring);
    const occluderGeom = new THREE.CylinderGeometry(fingerR * taper.distal, fingerR * taper.proximal, fingerL, 48, 1, false);
    occluderGeom.rotateX(Math.PI / 2);  // align cylinder axis to local +Z
    const occluderMat = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: true,
      depthTest: true,
      transparent: false,
      side: THREE.FrontSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
    this._occluder = new THREE.Mesh(occluderGeom, occluderMat);
    this._occluder.renderOrder = -100;
    this._occluder.frustumCulled = false;
    this.ring.add(this._occluder);

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
      opacity: 0.85,
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
    } else if (this.pieceType === "Necklace") {
      /* §5 contact body for necklaces: no hard depth occluder, because Pose
       * Landmarker does not expose an accurate neck mesh. Instead, a soft
       * clavicle shadow is parented to the necklace and driven by the neck-fit
       * score in applyResultNecklace(). It gives the chain a real contact cue
       * without pretending we have per-pixel body depth. */
      const shadowTex = makeShadowTexture();
      const shadowGeom = new THREE.PlaneGeometry(
        this._necklaceLocalVisibleSpan * 0.86,
        Math.max(0.62, this._necklaceLocalHeight * 0.34)
      );
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        opacity: 0,
        side: THREE.DoubleSide,
        color: 0x000000
      });
      this._neckShadow = new THREE.Mesh(shadowGeom, shadowMat);
      this._neckShadow.position.set(0, -0.56, -0.035);
      this._neckShadow.renderOrder = -55;
      this._neckShadow.frustumCulled = false;
      this._neckShadow.visible = false;
      this._neckShadowBaseOpacity = NECKLACE_CONTACT_SHADOW_OPACITY;
      this.ring.add(this._neckShadow);
    } // end pieceType occluder/contact visual dispatch

    // Async HDR environment for PBR reflections — the ring looks plasticky
    // without it. Don't block ring visibility on the load; lights cover until
    // PMREM is ready.
    this._loadEnvironment().catch(err => console.warn("[AR] env load failed:", err));

    this._onResize = () => {
      const r = stage.getBoundingClientRect();
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
      this.renderer.setSize(r.width, r.height, false);
      this.camera.left = -r.width / 2;
      this.camera.right = r.width / 2;
      this.camera.top = r.height / 2;
      this.camera.bottom = -r.height / 2;
      this.camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", this._onResize);
  }

  async _loadEnvironment() {
    return new Promise((resolve, reject) => {
      new RGBELoader().load(HDR_URL, (tex) => {
        if (!this.renderer) return resolve();   // closed before load finished
        const pmrem = new THREE.PMREMGenerator(this.renderer);
        pmrem.compileEquirectangularShader();
        const envRT = pmrem.fromEquirectangular(tex);
        this.scene.environment = envRT.texture;
        this._envRT = envRT;
        tex.dispose();
        pmrem.dispose();
        resolve();
      }, undefined, reject);
    });
  }

  sampleVideoLighting(now) {
    if (!this.video || !this._lightProbeCtx || !this.renderer || now - this._lastLightSample < 260) {
      return;
    }

    const { width, height } = this._lightProbe;

    try {
      this._lightProbeCtx.drawImage(this.video, 0, 0, width, height);
      const pixels = this._lightProbeCtx.getImageData(0, 0, width, height).data;
      let red = 0;
      let green = 0;
      let blue = 0;
      let count = 0;
      let localRed = 0;
      let localGreen = 0;
      let localBlue = 0;
      let localWeight = 0;
      let gradX = 0;
      let gradY = 0;

      // §3/§5: sample lighting near the actual ring, not just the whole
      // camera frame. The displayed selfie video is CSS-mirrored, while
      // drawImage samples the raw camera pixels, so invert X for user-facing
      // cameras. This gives the AR metal/gem the colour temperature and
      // shadow density of the skin region it is sitting on.
      const roi = this._lastStageNorm || { x: 0.5, y: 0.5 };
      const roiX = clamp(this.isMirrored ? 1 - roi.x : roi.x, 0, 1) * (width - 1);
      const roiY = clamp(roi.y, 0, 1) * (height - 1);
      const sigmaX = width * 0.17;
      const sigmaY = height * 0.22;

      for (let index = 0; index < pixels.length; index += 4) {
        const pixel = index / 4;
        const x = pixel % width;
        const y = Math.floor(pixel / width);
        const pr = pixels[index];
        const pg = pixels[index + 1];
        const pb = pixels[index + 2];
        red += pr;
        green += pg;
        blue += pb;
        count += 1;

        const dx = (x - roiX) / sigmaX;
        const dy = (y - roiY) / sigmaY;
        const w = Math.exp(-0.5 * (dx * dx + dy * dy));
        const luma = (0.2126 * pr + 0.7152 * pg + 0.0722 * pb) / 255;
        localRed += pr * w;
        localGreen += pg * w;
        localBlue += pb * w;
        localWeight += w;
        gradX += dx * luma * w;
        gradY += dy * luma * w;
      }

      red /= count * 255;
      green /= count * 255;
      blue /= count * 255;

      const invLocalWeight = 1 / Math.max(1, localWeight);
      const lr = (localRed * invLocalWeight) / 255;
      const lg = (localGreen * invLocalWeight) / 255;
      const lb = (localBlue * invLocalWeight) / 255;
      const frameBrightness = clamp((red + green + blue) / 3, 0.08, 0.92);
      const localBrightness = clamp((lr + lg + lb) / 3, 0.06, 0.96);
      const brightness = lerp(frameBrightness, localBrightness, 0.68);
      const warmth = clamp(lr - lb, -0.28, 0.28);
      const targetExposure = clamp(1.24 - brightness * 0.42, 0.82, 1.28);
      const lightColor = new THREE.Color(
        clamp(1 + warmth * 0.34, 0.82, 1.16),
        clamp(0.94 + warmth * 0.08, 0.82, 1.08),
        clamp(1 - warmth * 0.28, 0.78, 1.16)
      );
      const gNorm = Math.hypot(gradX, gradY) || 1;
      const gx = clamp(gradX / gNorm, -1, 1);
      const gy = clamp(gradY / gNorm, -1, 1);

      this._localBrightness += (localBrightness - this._localBrightness) * 0.22;
      this._localLightColor.lerp(lightColor, 0.20);
      this._lightGradient.x += (gx - this._lightGradient.x) * 0.18;
      this._lightGradient.y += (gy - this._lightGradient.y) * 0.18;

      this.renderer.toneMappingExposure += (targetExposure - this.renderer.toneMappingExposure) * 0.2;
      this._hemi.intensity += (clamp(0.42 + brightness * 0.48, 0.42, 0.84) - this._hemi.intensity) * 0.16;
      this._key.intensity += (clamp(1.05 + (1 - brightness) * 0.72, 1.05, 1.9) - this._key.intensity) * 0.16;
      this._fill.intensity += (clamp(0.34 + brightness * 0.38, 0.34, 0.78) - this._fill.intensity) * 0.16;
      this._rim.intensity += (clamp(0.56 + (1 - brightness) * 0.52, 0.56, 1.1) - this._rim.intensity) * 0.16;
      this._key.position.x += (this._lightGradient.x * 1.2 - this._key.position.x) * 0.12;
      this._key.position.y += ((1.05 - this._lightGradient.y * 0.35) - this._key.position.y) * 0.12;
      this._key.color.lerp(lightColor, 0.18);
      this._fill.color.lerp(lightColor.clone().lerp(new THREE.Color(0xd9e6ff), 0.42), 0.14);
      this._rim.color.lerp(lightColor.clone().lerp(new THREE.Color(0xfff1d8), 0.52), 0.14);
      this._lastLightSample = now;
    } catch {
      this._lastLightSample = now;
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
      this._occluder.scale.z += (clamp(1.0 + this._motionEnergy * 0.08, 0.92, 1.14) - this._occluder.scale.z) * a;
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

  updateSparkle(now, dt) {
    if (!this._sparkleLights?.length || !this.ring || !this.ring.visible) return;
    // §11 phase coherence: sparkle should respond to relative motion between
    // camera, light, and gem facets. Motion energy raises amplitude; local
    // brightness modulates it so gems do not flash absurdly in flat light.
    //
    // §11 view-aware gate: stone facets only catch the light when the table
    // (≈ stone normal) is oriented toward both the camera and an inferred
    // light direction. _stoneNormalZ ∈ [-1,1] is the +Z component of the
    // stone-side basis vector (cos(pitch)·cos(roll) at first order). We
    // build a soft-coherence factor:
    //     C_view = 0.32 + 0.68 · max(0, _stoneNormalZ)^1.6
    // and a light-alignment factor from the lighting-probe gradient — when
    // the local light gradient points in the stone-side screen direction
    // (-_vUp.xy), the gem is closer to the mirror reflection condition
    // and we boost sparkle accordingly.
    const confidence = clamp(this._poseConfidence, 0, 1);
    const motion = clamp(this._motionEnergy, 0, 1);
    const darknessBoost = clamp(1 - this._localBrightness, 0, 1);
    const stoneZ = clamp(this._stoneNormalZ ?? 1, -1, 1);
    const viewGate = 0.32 + 0.68 * Math.pow(Math.max(0, stoneZ), 1.6);
    // Light-alignment dot: stone-screen-up vs light gradient direction.
    const sUpX = this._vUp ? this._vUp.x : 0;
    const sUpY = this._vUp ? this._vUp.y : 1;
    const sUpLen = Math.hypot(sUpX, sUpY) || 1;
    const lgDot = (sUpX / sUpLen) * (-this._lightGradient.x)
                + (sUpY / sUpLen) * (-this._lightGradient.y);
    const lightAlign = 0.78 + 0.32 * clamp(lgDot, -1, 1);
    const burst = clamp(motion * 1.35 + darknessBoost * 0.28, 0.08, 1) * viewGate * lightAlign;
    this._sparklePhase += dt * (1.4 + motion * 5.6);
    const baseR = 125 + motion * 95;
    const t = now * 0.001;
    const colour = this._localLightColor || new THREE.Color(1, 1, 1);

    this._sparkleLights.forEach((light, index) => {
      const phase = this._sparklePhase + index * 2.094;
      const orbit = baseR * (1 + index * 0.18);
      light.position.set(
        this.ring.position.x + Math.cos(phase * 1.13 + t * 0.23) * orbit + this._lightGradient.x * 36,
        this.ring.position.y + Math.sin(phase * 0.91) * orbit * 0.42 + 62 - this._lightGradient.y * 30,
        175 + Math.sin(phase * 0.67 + index) * 42
      );
      const wave = Math.pow(Math.max(0, Math.sin(phase * (1.7 + index * 0.23))), 3.0);
      light.intensity = confidence * (0.12 + burst * (0.36 + wave * (index === 0 ? 1.35 : 0.72)));
      light.color.lerp(colour, 0.12);
    });
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
    this.rafId = requestAnimationFrame(this.loop);
    const landmarker = this.pieceType === "Earrings" ? this.faceLandmarker
                     : this.pieceType === "Necklace" ? this.poseLandmarker
                     : this.handLandmarker;
    if (!landmarker || !this.video || this.video.readyState < 2) return;

    const now = performance.now();
    const dt = this._lastRafTime ? Math.min(0.1, (now - this._lastRafTime) / 1000) : 0.016;
    if (this.video.currentTime !== this.lastVideoTime && now - this.lastDetectMs >= this.detectInterval) {
      this.lastVideoTime = this.video.currentTime;
      this.lastDetectMs = now;
      const detectStart = performance.now();
      const result = landmarker.detectForVideo(this.video, now);
      if (this.pieceType === "Bracelet") {
        this.applyResultBracelet(result);
      } else if (this.pieceType === "Earrings") {
        this.applyResultEarrings(result);
      } else if (this.pieceType === "Necklace") {
        this.applyResultNecklace(result);
      } else {
        this.applyResult(result);
      }
      const detectCost = performance.now() - detectStart;
      this.updateDeltaBudget(detectCost);
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
      // §4 forward-predictive extrapolation. Push the lerp target ahead
      // by velocity × t_predict so the visible ring is positioned where
      // the hand will be when the photons reach the user's eye, instead
      // of where the hand was when the last MediaPipe frame finished.
      // Cap at 60ms forward (≈ 2 detection intervals) so a stale velocity
      // can't drift far during a hand-lost spike. Scale by confidence so
      // low-confidence frames extrapolate less.
      const tSinceDet = this._lastDetectionTime
        ? Math.min(0.060, Math.max(0, (now - this._lastDetectionTime) / 1000))
        : 0;
      const predictGain = tSinceDet * conf;
      this._predTgtPos.set(
        this._tgtPos.x + this._velPx * predictGain,
        this._tgtPos.y + this._velPy * predictGain,
        this._tgtPos.z
      );
      const predScale = this._tgtScale + this._velScale * predictGain;
      this.ring.position.lerp(this._predTgtPos, alpha);
      this.ring.quaternion.slerp(this._tgtQuat, alpha);
      const cs = this.ring.scale.x;
      this.ring.scale.setScalar(cs + (predScale - cs) * alpha);
    }
    this._lastRafTime = now;
    this.updateContactVisuals(dt);
    this.updateSparkle(now, dt);
    this.updateQualityReadout();
    this.sampleVideoLighting(now);
    this.renderer.render(this.scene, this.camera);
  };

  applyResult(result) {
    const now = performance.now();
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
    const idxW = world[INDEX_MCP];
    const pkyW = world[PINKY_MCP];
    const handWidthM = Math.hypot(pkyW.x - idxW.x, pkyW.y - idxW.y, pkyW.z - idxW.z) || 0.08;
    const pxPerMeter = handWidthPx / handWidthM;
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
    const wristPoint = this.landmarkToStage(landmarks[0], metrics);
    const sideX = -fy;
    const sideY = fx;
    const wristSide = ((wristPoint.x - rawPx) * sideX + (wristPoint.y - rawPy) * sideY) / Math.max(imgLen, 1);
    // §4 pose — 3D dorsal-axis roll.
    //   palm_W   = (pinky_MCP - index_MCP)  in world meters
    //   finger_W = (tip - base)             in world meters
    //   dorsal_W = palm_W × finger_W        — points out of the back of the hand
    //
    // Projecting dorsal_W onto the screen plane (XY) and measuring its
    // signed angle to the finger's side vector gives a geometry-true roll
    // estimate that works in any hand orientation, unlike the wrist-side
    // screen heuristic which collapses when the wrist projects close to
    // the ring midpoint (e.g. fingers pointing toward camera). The screen
    // heuristic remains as a fallback when the cross product is degenerate
    // (finger parallel to palm-line — should never happen anatomically).
    const wBase0 = world[baseIdx];
    const wTip0 = world[tipIdx];
    const wfx0 = wTip0.x - wBase0.x;
    const wfy0 = wTip0.y - wBase0.y;
    const wfz0 = wTip0.z - wBase0.z;
    const palmWx = pkyW.x - idxW.x;
    const palmWy = pkyW.y - idxW.y;
    const palmWz = pkyW.z - idxW.z;
    // dorsal = palm × finger
    const dorWx = palmWy * wfz0 - palmWz * wfy0;
    const dorWy = palmWz * wfx0 - palmWx * wfz0;
    // Screen-plane components. Mirror X to match the displayed (flipped)
    // selfie video; stage Y is image-Y inverted.
    const dorSx = (this.isMirrored ? -dorWx : dorWx);
    const dorSy = -dorWy;
    const dorScreenLen = Math.hypot(dorSx, dorSy);
    let geometryRoll;
    if (dorScreenLen > 1e-5) {
      const dnx = dorSx / dorScreenLen;
      const dny = dorSy / dorScreenLen;
      // Signed angle from (sideX,sideY) to dorsal projection, about finger axis.
      const dot = sideX * dnx + sideY * dny;
      const crsZ = sideX * dny - sideY * dnx;
      // The dorsal axis points perpendicular to side at roll=0 (stone facing
      // dorsal). Subtract π/2 so roll=0 means stone-up on the back of hand.
      let raw = Math.atan2(crsZ, dot) - Math.PI / 2;
      // Wrap to [-π, π]
      if (raw > Math.PI) raw -= 2 * Math.PI;
      if (raw < -Math.PI) raw += 2 * Math.PI;
      // Blend with screen heuristic when the 3D cross product is short
      // (degenerate geometry → 3D estimate is noisy).
      const dorWlen3 = Math.hypot(dorWx, dorWy, palmWx * wfy0 - palmWy * wfx0) || 1e-6;
      const conf3 = clamp(dorWlen3 / 0.0035, 0, 1); // ~3.5mm² product saturates
      const screenRoll = clamp(-wristSide * 0.78, -0.68, 0.68);
      geometryRoll = clamp(lerp(screenRoll, raw, conf3), -1.1, 1.1);
    } else {
      geometryRoll = clamp(-wristSide * 0.78, -0.68, 0.68);
    }
    const rawRoll = geometryRoll + THREE.MathUtils.degToRad(this.calibration.roll || 0);
    // We mirror the X axis of the source (selfie view), so the in-plane
    // sense is already correct.
    rawPx += -fy * this.calibration.side;
    rawPy += fx * this.calibration.side + this.calibration.lift;

    /* --- out-of-plane pitch from world-space finger axis ---
     * §4 pose: with MediaPipe worldLandmarks (3D, hand-anchored, in meters)
     * we can derive pitch directly from the finger axis's normalized Z:
     *   sin(pitch) = -wfz / |w_finger|
     * (negative because MediaPipe world z grows AWAY from camera; tip toward
     * camera ⇒ wfz < 0 ⇒ positive pitch). This is continuous in z, unlike
     * the previous foreshortening-magnitude × world-z-sign approach which
     * was bistable around pitch=0 and noisy when imgLen ≈ expectedFlatPx.
     *
     * Foreshortening magnitude is still computed and used as a cross-check
     * at large pitch (where world-z is itself noisy because the finger
     * subtends few pixels). Final pitch blends them by 3D-confidence:
     * how saturated the z/length ratio is.
     */
    const wBase = world[baseIdx];
    const wTip = world[tipIdx];
    const wfx = wTip.x - wBase.x;
    const wfy = wTip.y - wBase.y;
    const wfz = wTip.z - wBase.z;
    const worldLen = Math.hypot(wfx, wfy, wfz) || 0.04;
    const sinPitch3D = clamp(-wfz / worldLen, -0.985, 0.985);
    const pitch3D = Math.asin(sinPitch3D);
    const expectedFlatPx = worldLen * pxPerMeter;
    const cosPitchImg = Math.max(0.15, Math.min(1, imgLen / expectedFlatPx));
    const pitchMagImg = Math.acos(cosPitchImg);
    const pitchSignImg = (wfz < 0) ? +1 : -1;
    const pitchImg = pitchMagImg * pitchSignImg;
    // 3D confidence: how far we are from the (degenerate) pitch=0 plane.
    // When |sinPitch3D| is small, world z is dominated by hand-anchor noise
    // and the foreshortening estimate is more reliable; at high pitch,
    // imgLen collapses and the 3D estimate wins.
    const conf3DPitch = smoothstep(0.06, 0.34, Math.abs(sinPitch3D));
    const rawPitch = lerp(pitchImg, pitch3D, conf3DPitch);

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
        this.setStatus("Hold your hand steady in the camera");
      }
      return;
    }
    this._badPoseFrames = 0;
    if (this.handLostFrames > 0) this.setStatus("");
    this.setStatus("");
    this.ring.visible = true;

    /* --- scale ---
     * §5 contact fit: outer radius = measured finger radius + metal wall.
     * That minimizes both collision (ring sinking into finger) and floating
     * (ring hovering larger than the finger) under the tracked hand body B.
     * Designer ring's local outer R varies, so divide it out. */
    const weight = clamp(Number(this._designState?.weight) || 1, 0.55, 1.8);
    const ringWallM = RING_WALL_THICKNESS_M * (0.82 + weight * 0.18);
    const targetOuterMeters = fingerDiameterM * 0.5 + ringWallM + RING_CONTACT_CLEARANCE_M;
    const localOuterR = this._ringLocalOuterR || 1.0;
    const rawScale = ((pxPerMeter * targetOuterMeters) / localOuterR) * this.calibration.fit;

    /* --- smooth each scalar independently --- */
    const px = this.filtPx.filter(rawPx, now);
    const py = this.filtPy.filter(rawPy, now);
    const s = this.filtScale.filter(rawScale, now);
    // Angle: filter sin & cos separately so the ±π wrap doesn't cause a
    // pop. Then re-derive the angle's components from the smoothed pair.
    const fxS = this.filtAngleCos.filter(fx, now);
    const fyS = this.filtAngleSin.filter(fy, now);
    const aLen = Math.hypot(fxS, fyS) || 1;
    const fxN = fxS / aLen;
    const fyN = fyS / aLen;
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
    const fingerLocalRadius = fingerRadiusPx / Math.max(1e-3, s);
    this._targetFingerLocalRadius = clamp(fingerLocalRadius, localOuterR * 0.48, localOuterR * 1.12);
    const idealOuterPx = fingerRadiusPx + ringWallM * pxPerMeter;
    const actualOuterPx = localOuterR * s;
    const contactError = Math.abs(actualOuterPx - idealOuterPx) / Math.max(idealOuterPx, 1);
    const contactScore = 1 - smoothstep(0.10, 0.34, contactError);
    this._targetShadowOpacity = (this._shadowBaseOpacity || 0.85) * contactScore * clamp(0.50 + confidence * 0.55, 0, 1);
    const occluderBase = this._occluderBaseRadius || this._targetFingerLocalRadius;
    this._targetShadowScaleX = clamp(this._targetFingerLocalRadius / occluderBase, 0.72, 1.42);
    this._targetOccluderScaleX = this._targetShadowScaleX;
    this._targetOccluderScaleY = clamp(this._targetShadowScaleX * (1 - Math.min(0.22, Math.abs(roll) * 0.18)), 0.68, 1.36);
    this._targetShadowScaleY = clamp(1 - Math.abs(roll) * 0.18, 0.78, 1.08);
    this._targetShadowScaleZ = clamp(0.94 + Math.abs(pitch) * 0.24 + this._motionEnergy * 0.16, 0.86, 1.42);

    /* Stash as TARGET pose. The render loop lerps ring → target every
     * rAF for smooth motion between detection frames. On first lock (or
     * after hand-lost) snap directly to avoid an intro lerp from origin.
     *
     * §5 contact pressure dip — sink the ring INTO the finger by a small
     * amount along the stone-down direction (−_vUp). Skin flesh compresses
     * ≈0.3–0.6 mm under a real ring's weight; modeling it eliminates the
     * "floating ring" look that AR overlays produce when the band geometry
     * sits exactly tangent to the cylinder. Magnitude is gated by:
     *   • contactScore — only dip when the fit is correct
     *   • confidence  — don't dip during low-confidence frames
     *   • motionGate  — relax the dip during fast motion (finger flexes)
     *
     * The dip is applied in SCREEN pixels (pxPerMeter conversion), in the
     * 2D direction (vUp.x, vUp.y) since the orthographic camera collapses Z.
     */
    const dipMeters = 0.00045; // ~0.45 mm flesh compression target
    const motionGate = 1 - smoothstep(0.18, 0.72, this._motionEnergy);
    const dipPx = dipMeters * pxPerMeter
      * clamp(contactScore, 0, 1)
      * clamp(confidence, 0, 1)
      * motionGate;
    this._tgtPos.set(
      px - this._vUp.x * dipPx,
      py - this._vUp.y * dipPx,
      0
    );
    this._tgtQuat.setFromRotationMatrix(this._mat);
    this._tgtScale = s;
    // §11 stash stone normal Z so updateSparkle can apply view-aware gating
    // without recomputing the basis. _vUp.z is the stone direction's depth
    // component; |_vUp.z| ≈ 1 when stone faces camera, ≈ 0 at grazing.
    this._stoneNormalZ = this._vUp.z;

    // §4 predictor — update pose velocity from the inter-detection delta.
    // We track velocity of the FILTERED target pose (so velocity inherits
    // the One-Euro denoising) rather than raw landmark velocity. Light EMA
    // (α=0.45) on the velocity itself keeps it from whipping around when a
    // single detection happens to land slightly off.
    if (this._lastDetectionTime) {
      const dtDet = Math.max(0.012, Math.min(0.20, (now - this._lastDetectionTime) / 1000));
      const instVx = (this._tgtPos.x - this._tgtPrevX) / dtDet;
      const instVy = (this._tgtPos.y - this._tgtPrevY) / dtDet;
      const instVs = (s - this._tgtPrevScale) / dtDet;
      const velAlpha = 0.45;
      this._velPx += (instVx - this._velPx) * velAlpha;
      this._velPy += (instVy - this._velPy) * velAlpha;
      this._velScale += (instVs - this._velScale) * velAlpha;
    }
    this._lastDetectionTime = now;
    this._tgtPrevX = this._tgtPos.x;
    this._tgtPrevY = this._tgtPos.y;
    this._tgtPrevScale = s;

    if (!this._hasTarget) {
      this.ring.position.copy(this._tgtPos);
      this.ring.quaternion.copy(this._tgtQuat);
      this.ring.scale.setScalar(s);
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
    const hands = result?.landmarks || [];
    const worlds = result?.worldLandmarks || [];
    let best = null;
    hands.forEach((landmarks, index) => {
      const world = worlds[index];
      if (!landmarks?.[0] || !landmarks?.[9] || !world?.[0] || !world?.[9]) return;
      if (!landmarks[INDEX_MCP] || !landmarks[PINKY_MCP]) return;
      const wrist = this.landmarkToStage(landmarks[0], metrics);
      const handWidth = this.landmarkDistance(landmarks[INDEX_MCP], landmarks[PINKY_MCP], metrics);
      // Prefer larger, more-centred hand. Wrist near frame edge → demote.
      const centerDistance = Math.hypot(wrist.x, wrist.y);
      const score = handWidth * 1.6 - centerDistance * 0.10;
      if (!best || score > best.score) best = { landmarks, world, index, score };
    });
    return best;
  }

  applyResultBracelet(result) {
    const now = performance.now();
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
      }
      return;
    }
    this.handLostFrames = 0;
    const { landmarks, world } = selected;

    // pxPerMeter — derive from knuckle line (most stable rigid pair).
    const idxImg = landmarks[INDEX_MCP];
    const pkyImg = landmarks[PINKY_MCP];
    const handWidthPx = this.landmarkDistance(idxImg, pkyImg, metrics);
    const idxW = world[INDEX_MCP];
    const pkyW = world[PINKY_MCP];
    const handWidthM = Math.hypot(pkyW.x - idxW.x, pkyW.y - idxW.y, pkyW.z - idxW.z) || 0.085;
    const pxPerMeter = handWidthPx / handWidthM;

    // Stage-space wrist + palm centre.  Forearm axis (in screen) runs
    // from palm-centre → wrist; we extrapolate slightly past the wrist
    // so the bracelet sits a bit proximal of landmark 0 (anatomically
    // ~1cm into the forearm, which reads as natural).
    const wristPt = this.landmarkToStage(landmarks[0], metrics);
    const midPt = this.landmarkToStage(landmarks[9], metrics);
    const idxPt = this.landmarkToStage(idxImg, metrics);
    const pkyPt = this.landmarkToStage(pkyImg, metrics);
    const palmX = (idxPt.x + pkyPt.x + midPt.x) / 3;
    const palmY = (idxPt.y + pkyPt.y + midPt.y) / 3;
    const dx = wristPt.x - palmX;
    const dy = wristPt.y - palmY;
    const imgLen = Math.hypot(dx, dy) || 1;
    const fx = dx / imgLen;
    const fy = dy / imgLen;
    const sideX = -fy;
    const sideY = fx;

    // Anchor with calibration: lift = along forearm (away from hand),
    // side = perpendicular (radial vs ulnar).  Push slightly past the
    // wrist landmark (≈ 8% of palm length) so the band centres on the
    // forearm rather than straddling the wrist crease.
    const seatOffset = imgLen * 0.08;
    let rawPx = wristPt.x + fx * (seatOffset + this.calibration.lift * 0.6) + sideX * this.calibration.side;
    let rawPy = wristPt.y + fy * (seatOffset + this.calibration.lift * 0.6) + sideY * this.calibration.side;

    // World-space pitch: forearm vector tilt out of the image plane.
    const w0 = world[0];
    const w9 = world[9];
    const wfx = w0.x - w9.x;
    const wfy = w0.y - w9.y;
    const wfz = w0.z - w9.z;
    const worldLen = Math.hypot(wfx, wfy, wfz) || 0.09;
    const sinPitch3D = clamp(-wfz / worldLen, -0.985, 0.985);
    const pitch3D = Math.asin(sinPitch3D);
    // Image foreshortening gives a magnitude-only pitch estimate; sign
    // borrowed from the world-z direction.
    const palmToWristW = Math.hypot(w0.x - w9.x, w0.y - w9.y, w0.z - w9.z) || 0.09;
    const expectedFlatPx = palmToWristW * pxPerMeter;
    const cosPitchImg = Math.max(0.15, Math.min(1, imgLen / Math.max(1e-3, expectedFlatPx)));
    const pitchMagImg = Math.acos(cosPitchImg);
    const pitchSignImg = (wfz < 0) ? +1 : -1;
    const pitchImg = pitchMagImg * pitchSignImg;
    const conf3DPitch = smoothstep(0.06, 0.34, Math.abs(sinPitch3D));
    const rawPitch = lerp(pitchImg, pitch3D, conf3DPitch);

    // Roll about the forearm axis — derived from the palm-normal
    // (cross product of knuckle-line × wrist→middle-MCP), projected
    // to screen and compared against our screen-side vector.
    const palmWx = pkyW.x - idxW.x;
    const palmWy = pkyW.y - idxW.y;
    const palmWz = pkyW.z - idxW.z;
    const handAxisX = w9.x - w0.x;
    const handAxisY = w9.y - w0.y;
    const handAxisZ = w9.z - w0.z;
    const dorWx = palmWy * handAxisZ - palmWz * handAxisY;
    const dorWy = palmWz * handAxisX - palmWx * handAxisZ;
    const dorWz = palmWx * handAxisY - palmWy * handAxisX;
    const dorSx = this.isMirrored ? -dorWx : dorWx;
    const dorSy = -dorWy;
    const dorScreenLen = Math.hypot(dorSx, dorSy);
    let geometryRoll = 0;
    if (dorScreenLen > 1e-5) {
      const dnx = dorSx / dorScreenLen;
      const dny = dorSy / dorScreenLen;
      // Want dorsal-up = +Y of bracelet local frame.  Side vector is
      // local +X target; the signed angle from side → dorsal minus
      // π/2 is the roll about the forearm.
      const dot = sideX * dnx + sideY * dny;
      const crsZ = sideX * dny - sideY * dnx;
      let raw = Math.atan2(crsZ, dot) - Math.PI / 2;
      if (raw > Math.PI) raw -= 2 * Math.PI;
      if (raw < -Math.PI) raw += 2 * Math.PI;
      const dorWlen3 = Math.hypot(dorWx, dorWy, dorWz) || 1e-6;
      const conf3 = clamp(dorWlen3 / 0.0035, 0, 1);
      geometryRoll = clamp(raw * conf3, -1.1, 1.1);
    }
    const rawRoll = geometryRoll + THREE.MathUtils.degToRad(this.calibration.roll || 0);

    // Confidence: presence + edge-distance + on-screen size.
    const used = [0, 9, INDEX_MCP, PINKY_MCP];
    const presence = used.reduce((sum, i) => sum + landmarkPresence(landmarks[i]), 0) / used.length;
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
        this.setStatus("Hold your wrist steady in the camera");
      }
      return;
    }
    this._badPoseFrames = 0;
    this.setStatus("");
    this.ring.visible = true;
    if (this.sizeEl) this.sizeEl.hidden = true;

    // Scale: wrist diameter ≈ 0.62 × hand width.  Target band outer
    // radius = wrist radius + wall + clearance.  Convert to local
    // units via pxPerMeter / piece-local outer radius.
    const wristDiameterM = handWidthM * WRIST_DIAMETER_RATIO;
    const targetOuterM = wristDiameterM * 0.5 + BRACELET_WALL_THICKNESS_M + BRACELET_CONTACT_CLEARANCE_M;
    const localOuterR = this._ringLocalOuterR || 1.42;
    const rawScale = ((pxPerMeter * targetOuterM) / localOuterR) * this.calibration.fit;

    // Filter all scalars (OneEuro).
    const px = this.filtPx.filter(rawPx, now);
    const py = this.filtPy.filter(rawPy, now);
    const s = this.filtScale.filter(rawScale, now);
    const fxS = this.filtAngleCos.filter(fx, now);
    const fyS = this.filtAngleSin.filter(fy, now);
    const aLen = Math.hypot(fxS, fyS) || 1;
    const fxN = fxS / aLen;
    const fyN = fyS / aLen;
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
    const wristRadiusPx = Math.max(1, wristDiameterM * 0.5 * pxPerMeter);
    const wristLocalRadius = wristRadiusPx / Math.max(1e-3, s);
    this._targetFingerLocalRadius = clamp(wristLocalRadius, localOuterR * 0.66, localOuterR * 1.02);
    const idealOuterPx = wristRadiusPx + BRACELET_WALL_THICKNESS_M * pxPerMeter;
    const actualOuterPx = localOuterR * s;
    const contactError = Math.abs(actualOuterPx - idealOuterPx) / Math.max(idealOuterPx, 1);
    const contactScore = 1 - smoothstep(0.10, 0.34, contactError);
    this._targetShadowOpacity = (this._shadowBaseOpacity || 0.85) * contactScore * clamp(0.50 + confidence * 0.55, 0, 1);
    const occluderBase = this._occluderBaseRadius || this._targetFingerLocalRadius;
    this._targetShadowScaleX = clamp(this._targetFingerLocalRadius / occluderBase, 0.72, 1.20);
    this._targetOccluderScaleX = this._targetShadowScaleX;
    this._targetOccluderScaleY = clamp(this._targetShadowScaleX * (1 - Math.min(0.18, Math.abs(roll) * 0.14)), 0.70, 1.18);
    this._targetShadowScaleY = clamp(1 - Math.abs(roll) * 0.14, 0.82, 1.06);
    this._targetShadowScaleZ = clamp(0.98 + Math.abs(pitch) * 0.20 + this._motionEnergy * 0.14, 0.90, 1.36);

    this._tgtPos.set(px, py, 0);
    this._tgtQuat.setFromRotationMatrix(this._mat);
    this._tgtScale = s;
    this._stoneNormalZ = this._vUp.z;

    // Predictor velocity (drives forward extrapolation in loop()).
    if (this._lastDetectionTime) {
      const dtDet = Math.max(0.012, Math.min(0.20, (now - this._lastDetectionTime) / 1000));
      const instVx = (this._tgtPos.x - this._tgtPrevX) / dtDet;
      const instVy = (this._tgtPos.y - this._tgtPrevY) / dtDet;
      const instVs = (s - this._tgtPrevScale) / dtDet;
      const velAlpha = 0.45;
      this._velPx += (instVx - this._velPx) * velAlpha;
      this._velPy += (instVy - this._velPy) * velAlpha;
      this._velScale += (instVs - this._velScale) * velAlpha;
    }
    this._lastDetectionTime = now;
    this._tgtPrevX = this._tgtPos.x;
    this._tgtPrevY = this._tgtPos.y;
    this._tgtPrevScale = s;

    if (!this._hasTarget) {
      this.ring.position.copy(this._tgtPos);
      this.ring.quaternion.copy(this._tgtQuat);
      this.ring.scale.setScalar(s);
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
  applyResultEarrings(result) {
    const now = performance.now();
    const metrics = this.videoMetrics();
    const faces = result?.faceLandmarks || [];
    const landmarks = faces[0];
    const transformList = result?.facialTransformationMatrixes || [];
    if (!landmarks || !landmarks[FACE_EAR_RIGHT] || !landmarks[FACE_EAR_LEFT]) {
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

    // Anchor: midpoint of the two ear-side face landmarks, offset down
    // along the inter-ear vector to land on the earlobe.
    const earR = this.landmarkToStage(landmarks[FACE_EAR_RIGHT], metrics);
    const earL = this.landmarkToStage(landmarks[FACE_EAR_LEFT], metrics);
    const dxEar = earL.x - earR.x;
    const dyEar = earL.y - earR.y;
    const earPx = Math.hypot(dxEar, dyEar) || 1;
    // "Down" is perpendicular to the inter-ear vector, in the half-plane
    // away from the forehead. The face-mesh forehead landmark 10 lets us
    // pick the correct side: perpendicular direction toward which the
    // chin lies = perpendicular pointing away from the forehead.
    const perpAx = -dyEar / earPx;
    const perpAy =  dxEar / earPx;
    const forehead = landmarks[10] ? this.landmarkToStage(landmarks[10], metrics) : null;
    let perpSign = 1;
    if (forehead) {
      const midX = (earL.x + earR.x) / 2;
      const midY = (earL.y + earR.y) / 2;
      // Want the perpendicular pointing toward the chin (= away from forehead).
      const foreDot = (forehead.x - midX) * perpAx + (forehead.y - midY) * perpAy;
      if (foreDot > 0) perpSign = -1;
    }
    const dropPx = earPx * EARLOBE_DROP_RATIO;
    const lobeRx = earR.x + perpAx * perpSign * dropPx;
    const lobeRy = earR.y + perpAy * perpSign * dropPx;
    const lobeLx = earL.x + perpAx * perpSign * dropPx;
    const lobeLy = earL.y + perpAy * perpSign * dropPx;
    const rawPx = (lobeRx + lobeLx) / 2 + (this.calibration.side || 0);
    const rawPy = (lobeRy + lobeLy) / 2 + (this.calibration.lift || 0);

    // Scale: inter-lobe pixel span \u2192 local pair span.
    const lobeSpanPx = Math.hypot(lobeLx - lobeRx, lobeLy - lobeRy);
    const rawScale = (lobeSpanPx / (2 * EARRING_PAIR_LOCAL_HALF_SPAN)) * this.calibration.fit;

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

    // Filter scalars (position + scale only \u2014 rotation comes from the
    // matrix and is slerped target-side).
    const px = this.filtPx.filter(rawPx, now);
    const py = this.filtPy.filter(rawPy, now);
    const s = this.filtScale.filter(rawScale, now);

    // Head rotation: prefer facialTransformationMatrixes when available,
    // fall back to a 2D roll from the inter-ear vector.
    const transform = transformList[0];
    const matData = transform?.data || transform;
    if (matData && matData.length === 16) {
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
      // Mirror flip: when the selfie preview is mirrored, the screen-X
      // axis is reversed relative to camera-X. Negating the X component
      // of each basis vector composes with the mirrored render.
      if (this.isMirrored) {
        this._vRight.x = -this._vRight.x;
        this._vUp.x = -this._vUp.x;
        this._vFwd.x = -this._vFwd.x;
      }
      this._vRight.normalize();
      this._vUp.normalize();
      this._vFwd.normalize();
      this._mat.makeBasis(this._vRight, this._vUp, this._vFwd);
      this._tgtQuat.setFromRotationMatrix(this._mat);
      // User roll calibration around the forward axis.
      const rollCal = THREE.MathUtils.degToRad(this.calibration.roll || 0);
      if (Math.abs(rollCal) > 1e-4) {
        const qRoll = new THREE.Quaternion().setFromAxisAngle(this._vFwd, rollCal);
        this._tgtQuat.premultiply(qRoll);
      }
    } else {
      // Fallback: 2D roll only, head assumed facing camera.
      const rollOnly = -Math.atan2(dyEar, dxEar) + THREE.MathUtils.degToRad(this.calibration.roll || 0);
      const c = Math.cos(rollOnly), si = Math.sin(rollOnly);
      this._vRight.set(c, si, 0);
      this._vUp.set(-si, c, 0);
      this._vFwd.set(0, 0, 1);
      this._mat.makeBasis(this._vRight, this._vUp, this._vFwd);
      this._tgtQuat.setFromRotationMatrix(this._mat);
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

    this._tgtPos.set(px, py, 0);
    this._tgtScale = s;
    this._stoneNormalZ = this._vFwd.z;

    if (this._lastDetectionTime) {
      const dtDet = Math.max(0.012, Math.min(0.20, (now - this._lastDetectionTime) / 1000));
      const instVx = (this._tgtPos.x - this._tgtPrevX) / dtDet;
      const instVy = (this._tgtPos.y - this._tgtPrevY) / dtDet;
      const instVs = (s - this._tgtPrevScale) / dtDet;
      const velAlpha = 0.45;
      this._velPx += (instVx - this._velPx) * velAlpha;
      this._velPy += (instVy - this._velPy) * velAlpha;
      this._velScale += (instVs - this._velScale) * velAlpha;
    }
    this._lastDetectionTime = now;
    this._tgtPrevX = this._tgtPos.x;
    this._tgtPrevY = this._tgtPos.y;
    this._tgtPrevScale = s;

    if (!this._hasTarget) {
      this.ring.position.copy(this._tgtPos);
      this.ring.quaternion.copy(this._tgtQuat);
      this.ring.scale.setScalar(s);
      this._hasTarget = true;
      this._velPx = this._velPy = this._velScale = 0;
    }
  }

  /* =================================================================
   * NECKLACE PIPELINE
   * -----------------------------------------------------------------
   * §4 pose: solve a neck-space frame from Pose Landmarker shoulders,
   * mouth/nose/ears, and hips. The anchor is the suprasternal notch,
   * not a generic "upper body center"; the local +Y axis follows the
   * neck/spine up vector, local +X follows the clavicle/shoulder line,
   * and a mild world-landmark yaw lets the chain turn with the torso
   * without collapsing into a skinny edge-on render.
   *
   * §5 contact: since we do not have a real depth mesh for the neck,
   * contact is visualized as a confidence-gated clavicle shadow instead
   * of a fake hard occluder. Collision/floating are minimized by keeping
   * the origin at the throat hollow and scaling from the measured
   * shoulder span to the designer necklace's real local span.
   * ================================================================= */
  applyResultNecklace(result) {
    const now = performance.now();
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

    let faceX = shoulderMidX;
    let faceY = shoulderMidY + shoulderPx * 0.50;
    let faceWeight = 0;
    for (const p of weightedPoints) {
      faceX += (p.x - shoulderMidX) * p.weight;
      faceY += (p.y - shoulderMidY) * p.weight;
      faceWeight += p.weight;
    }
    if (faceWeight > 1e-3) {
      faceX = shoulderMidX + (faceX - shoulderMidX) / faceWeight;
      faceY = shoulderMidY + (faceY - shoulderMidY) / faceWeight;
    }
    const faceScore = clamp(faceWeight, 0, 1);

    let upX = 0;
    let upY = 0;
    if (faceScore > 0.05) {
      const fx = faceX - shoulderMidX;
      const fy = faceY - shoulderMidY;
      const fl = Math.hypot(fx, fy) || 1;
      upX += (fx / fl) * (0.72 + faceScore * 0.28);
      upY += (fy / fl) * (0.72 + faceScore * 0.28);
    }

    const hipL = stageIfVisible(POSE_LEFT_HIP, 0.26);
    const hipR = stageIfVisible(POSE_RIGHT_HIP, 0.26);
    let hipScore = 0;
    if (hipL && hipR) {
      const hipX = (hipL.x + hipR.x) * 0.5;
      const hipY = (hipL.y + hipR.y) * 0.5;
      const tx = shoulderMidX - hipX;
      const ty = shoulderMidY - hipY;
      const tl = Math.hypot(tx, ty) || 1;
      hipScore = Math.min(hipL.presence, hipR.presence);
      upX += (tx / tl) * hipScore * 0.44;
      upY += (ty / tl) * hipScore * 0.44;
    }

    if (Math.hypot(upX, upY) < 1e-4) {
      upX = -dySh;
      upY = dxSh;
      if (upY < 0) { upX = -upX; upY = -upY; }
    }
    if (faceScore > 0.05 && (upX * (faceX - shoulderMidX) + upY * (faceY - shoulderMidY)) < 0) {
      upX = -upX;
      upY = -upY;
    } else if (faceScore <= 0.05 && upY < 0) {
      upX = -upX;
      upY = -upY;
    }
    const rawUpLen = Math.hypot(upX, upY) || 1;
    upX /= rawUpLen;
    upY /= rawUpLen;

    let rightX = dxSh / shoulderPx;
    let rightY = dySh / shoulderPx;
    const rawRightDotUp = rightX * upX + rightY * upY;
    rightX -= upX * rawRightDotUp;
    rightY -= upY * rawRightDotUp;
    let rightLen = Math.hypot(rightX, rightY);
    if (rightLen < 0.28) {
      rightX = upY;
      rightY = -upX;
      rightLen = 1;
    }
    rightX /= rightLen;
    rightY /= rightLen;
    if (rightX < 0) {
      rightX = -rightX;
      rightY = -rightY;
    }

    const faceDist = Math.hypot(faceX - shoulderMidX, faceY - shoulderMidY);
    const faceDrivenLift = clamp(faceDist * 0.38, shoulderPx * 0.16, shoulderPx * 0.30);
    const shoulderDrivenLift = shoulderPx * NECK_BASE_RATIO;
    const neckOffsetPx = lerp(shoulderDrivenLift, faceDrivenLift, faceScore * 0.72);
    const anchorX = shoulderMidX + upX * neckOffsetPx;
    const anchorY = shoulderMidY + upY * neckOffsetPx;

    const sidePx = this.calibration.side || 0;
    const liftPx = this.calibration.lift || 0;
    const rawPx = anchorX + rightX * sidePx + upX * liftPx;
    const rawPy = anchorY + rightY * sidePx + upY * liftPx;

    const silhouette = this._designState?.silhouette || "Pendant";
    const silhouetteFill = silhouette === "Choker" ? 0.62
      : silhouette === "Lariat" ? 0.82
      : silhouette === "Y-Drop" ? 0.78
      : silhouette === "Station" ? 0.72
      : NECKLACE_SHOULDER_FILL;
    const localSpan = this._necklaceLocalVisibleSpan || NECKLACE_LOCAL_VISIBLE_SPAN;
    const rawScale = (shoulderPx * silhouetteFill / localSpan) * this.calibration.fit;

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
    this.ring.visible = true;
    if (this.sizeEl) this.sizeEl.hidden = true;

    const px = this.filtPx.filter(rawPx, now);
    const py = this.filtPy.filter(rawPy, now);
    const s = this.filtScale.filter(rawScale, now);

    const upXS = this.filtAngleCos.filter(upX, now);
    const upYS = this.filtAngleSin.filter(upY, now);
    const upSL = Math.hypot(upXS, upYS) || 1;
    upX = upXS / upSL;
    upY = upYS / upSL;
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

    let rawYaw = 0;
    if (world?.[POSE_LEFT_SHOULDER] && world?.[POSE_RIGHT_SHOULDER]) {
      const wl = world[POSE_LEFT_SHOULDER];
      const wr = world[POSE_RIGHT_SHOULDER];
      const wx = wl.x - wr.x;
      const wy = wl.y - wr.y;
      const wz = wl.z - wr.z;
      const wSpan = Math.hypot(wx, wy, wz);
      if (wSpan > 0.16 && wSpan < 0.62) {
        rawYaw = clamp(Math.atan2((this.isMirrored ? -wz : wz), Math.hypot(wx, wy) || 0.32), -0.64, 0.64) * 0.48;
      }
    }
    const yaw = this.filtPitch.filter(rawYaw, now);
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    this._vRight.set(calRightX * cy, calRightY * cy, sy).normalize();
    this._vUp.set(calUpX, calUpY, 0).normalize();
    this._vFwd.crossVectors(this._vRight, this._vUp).normalize();
    this._vRight.crossVectors(this._vUp, this._vFwd).normalize();
    this._mat.makeBasis(this._vRight, this._vUp, this._vFwd);
    this._tgtQuat.setFromRotationMatrix(this._mat);
    this.applyNecklaceSmartWrapping({ yaw, confidence, axisScore, faceScore, sizeScore });

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
    this._tgtPos.set(px - anchorOffsetX, py - anchorOffsetY, 0);
    this._tgtScale = s;
    this._stoneNormalZ = this._vFwd.z;
    const motionGate = 1 - smoothstep(0.18, 0.72, this._motionEnergy);
    const contactScore = clamp(confidence * (0.64 + faceScore * 0.20 + axisScore * 0.16), 0, 1);
    this._targetNeckShadowOpacity = this._neckShadowBaseOpacity * contactScore * (0.58 + motionGate * 0.42);
    this._targetNeckShadowScaleX = clamp(0.88 + Math.abs(rawRightDotUp) * 0.22 + Math.abs(yaw) * 0.18, 0.82, 1.18);
    this._targetNeckShadowScaleY = clamp(0.74 + (1 - sizeScore) * 0.18, 0.72, 1.04);

    if (this._lastDetectionTime) {
      const dtDet = Math.max(0.012, Math.min(0.20, (now - this._lastDetectionTime) / 1000));
      const instVx = (this._tgtPos.x - this._tgtPrevX) / dtDet;
      const instVy = (this._tgtPos.y - this._tgtPrevY) / dtDet;
      const instVs = (s - this._tgtPrevScale) / dtDet;
      const velAlpha = 0.45;
      this._velPx += (instVx - this._velPx) * velAlpha;
      this._velPy += (instVy - this._velPy) * velAlpha;
      this._velScale += (instVs - this._velScale) * velAlpha;
    }
    this._lastDetectionTime = now;
    this._tgtPrevX = this._tgtPos.x;
    this._tgtPrevY = this._tgtPos.y;
    this._tgtPrevScale = s;

    if (!this._hasTarget) {
      this.ring.position.copy(this._tgtPos);
      this.ring.quaternion.copy(this._tgtQuat);
      this.ring.scale.setScalar(s);
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
    if (this.renderer) {
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
    document.body.style.overflow = "";
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
      try {
        await app.open();
      } finally {
        // open() runs the modal until close(); after close clear the ref.
        const observer = new MutationObserver(() => {
          if (!document.body.contains(app.modal)) {
            window.__arTryOn = null;
            observer.disconnect();
          }
        });
        observer.observe(document.body, { childList: true });
      }
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
