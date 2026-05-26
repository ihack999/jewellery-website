/**
 * AR Try-On (rings)
 *
 * Stack:
 *   - MediaPipe Tasks Vision (HandLandmarker, Apache 2.0) loaded from jsDelivr CDN.
 *     https://developers.google.com/mediapipe/solutions/vision/hand_landmarker
 *   - three.js (already bundled at assets/js/three.module.js)
 *
 * What it does:
 *   - Opens a fullscreen overlay with the user's front camera mirrored.
 *   - Runs MediaPipe hand landmarking each frame (~30fps on M-series).
 *   - Renders a three.js ring locked to the base of the ring finger
 *     (landmarks 13 ↔ 14 → MCP–PIP segment).
 *   - Pulls the user's last saved design from localStorage so the AR ring
 *     reflects the chosen metal + stone colour.
 *
 * MVP scope: rings only. Earrings/necklace would need Face Landmarker; future.
 */

import * as THREE from "./three.module.js";
import { RGBELoader } from "./RGBELoader.js";

const HDR_URL = "assets/textures/studio_small_08_1k.hdr";

const TRIGGER_SELECTOR = "[data-ar-tryon]";
const STATE_KEY = "tj-custom-design-state";

const MEDIAPIPE_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const WASM_BASE = `${MEDIAPIPE_BASE}/wasm`;
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

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
      display: flex; gap: 8px;
      z-index: 2;
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
        <button type="button" class="ar-tryon-btn" data-ar-snapshot>Save Snapshot</button>
        <button type="button" class="ar-tryon-btn" data-ar-close aria-label="Close AR try-on">Close ✕</button>
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
    this.stream = null;
    this.rafId = null;
    this.lastVideoTime = -1;
    this.activeFinger = "ring";
    this.statusEl = null;
    this.handLostFrames = 0;

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
    // Finger diameter (meters) filtered hard — the digit display would
    // flicker between sizes otherwise. Low cutoff + low beta = lazy lock.
    this.filtFingerDia = new OneEuro(0.3, 0.005);

    // Pre-allocated math objects (avoid GC each frame).
    this._vBase = new THREE.Vector3();
    this._vTip = new THREE.Vector3();
    this._vUp = new THREE.Vector3();
    this._vRight = new THREE.Vector3();
    this._vFwd = new THREE.Vector3();
    this._mat = new THREE.Matrix4();
    this._quat = new THREE.Quaternion();

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

    this.modal.querySelector("[data-ar-close]").addEventListener("click", () => this.close());
    this.modal.querySelector("[data-ar-snapshot]").addEventListener("click", () => this.snapshot());
    this.modal.querySelectorAll(".ar-tryon-finger-select button").forEach(btn => {
      btn.addEventListener("click", () => {
        this.modal.querySelectorAll(".ar-tryon-finger-select button").forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        this.activeFinger = btn.dataset.finger;
      });
    });
    document.addEventListener("keydown", this._onKey = (e) => {
      if (e.key === "Escape") this.close();
    });

    try {
      this.setStatus("Requesting camera…");
      await this.startCamera();
      this.setStatus("Loading hand tracking…");
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
    if (!this.sizeEl) return;
    const ratio = FINGER_DIAMETER_RATIO[this.activeFinger] || FINGER_DIAMETER_RATIO.ring;
    const rawDia = handWidthM * ratio;                       // meters
    const dia = this.filtFingerDia.filter(rawDia, now);      // smoothed
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
  }

  async startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera API not supported in this browser.");
    }
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    this.video.srcObject = this.stream;
    await new Promise((resolve) => {
      if (this.video.readyState >= 2) resolve();
      else this.video.addEventListener("loadeddata", () => resolve(), { once: true });
    });
    await this.video.play();
  }

  async startMediaPipe() {
    // Dynamically import to avoid blocking the customs page load.
    const vision = await import(/* @vite-ignore */ `${MEDIAPIPE_BASE}/vision_bundle.mjs`);
    const fileset = await vision.FilesetResolver.forVisionTasks(WASM_BASE);
    this.handLandmarker = await vision.HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
  }

  startThree() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    const stage = this.modal.querySelector(".ar-tryon-stage");
    const rect = stage.getBoundingClientRect();

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: true
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
    const hemi = new THREE.HemisphereLight(0xffffff, 0x404a55, 0.55);
    this.scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(0.8, 1.0, 0.6);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xc7d6ff, 0.55);
    fill.position.set(-0.7, 0.4, 0.5);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xfff1d8, 0.7);
    rim.position.set(-0.2, 0.6, -1);
    this.scene.add(rim);
    // Scintillation light — small, fast-moving point light positioned just
    // off-axis from the camera; its intensity is modulated in the loop so
    // the stone gets a wandering specular flash even when the hand is still.
    this._sparkleLight = new THREE.PointLight(0xffffff, 1.2, 0, 2);
    this._sparkleLight.position.set(0, 0, 200);
    this.scene.add(this._sparkleLight);

    const state = readDesignState();
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
    this._ringLocalOuterR = Math.max(bb.max.x, -bb.min.x, 1e-3);

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

    /* ----- finger occluder -----
     * A depth-only cylinder along the finger axis (ring-local +Z) the
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
    const fingerR = this._ringLocalOuterR * 0.92;
    const fingerL = this._ringLocalOuterR * 14;
    const occluderGeom = new THREE.CylinderGeometry(fingerR, fingerR, fingerL, 48, 1, false);
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
    this.ring.add(this._shadow);

    // Async HDR environment for PBR reflections — the ring looks plasticky
    // without it. Don't block ring visibility on the load; lights cover until
    // PMREM is ready.
    this._loadEnvironment().catch(err => console.warn("[AR] env load failed:", err));

    this._onResize = () => {
      const r = stage.getBoundingClientRect();
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
    if (!this.handLandmarker || !this.video || this.video.readyState < 2) return;

    const now = performance.now();
    if (this.video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.video.currentTime;
      const result = this.handLandmarker.detectForVideo(this.video, now);
      this.applyResult(result);
    }

    /* Per-rAF pose interpolation toward the latest target. Exponential
     * follow with τ ≈ 55ms → catches up to ~95% in ~165ms, which feels
     * locked but never twitchy. Critically dt-aware so it stays correct
     * if rAF drops to 30fps. */
    if (this._hasTarget && this.ring && this.ring.visible) {
      const dt = this._lastRafTime ? Math.min(0.1, (now - this._lastRafTime) / 1000) : 0.016;
      const alpha = 1 - Math.exp(-dt / 0.055);
      this.ring.position.lerp(this._tgtPos, alpha);
      this.ring.quaternion.slerp(this._tgtQuat, alpha);
      const cs = this.ring.scale.x;
      this.ring.scale.setScalar(cs + (this._tgtScale - cs) * alpha);
    }
    this._lastRafTime = now;
    /* Scintillation — wander the sparkle light around the ring on a Lissajous
     * path so the stone gets a continuous, asymmetric specular flash even
     * when the hand is held still. Two incommensurate frequencies keep the
     * motion from looking periodic. */
    if (this._sparkleLight && this.ring && this.ring.visible) {
      const t = now * 0.001;
      const r = 220;
      this._sparkleLight.position.set(
        this.ring.position.x + Math.cos(t * 1.7) * r,
        this.ring.position.y + Math.sin(t * 2.3) * r * 0.6 + 60,
        180 + Math.sin(t * 1.1) * 30
      );
      this._sparkleLight.intensity = 1.0 + 0.6 * Math.sin(t * 3.7) + 0.4 * Math.cos(t * 5.3);
    }
    this.renderer.render(this.scene, this.camera);
  };

  applyResult(result) {
    const landmarks = result?.landmarks?.[0];
    const world = result?.worldLandmarks?.[0];

    if (!landmarks || !world) {
      this.handLostFrames++;
      if (this.handLostFrames > 8) {
        this.ring.visible = false;
        this._hasTarget = false;  // snap on re-acquire, don't lerp from stale
        if (this.sizeEl) this.sizeEl.hidden = true;
        if (this.handLostFrames === 9) this.setStatus("Show your hand to the camera");
      }
      return;
    }
    if (this.handLostFrames > 0) this.setStatus("");
    this.handLostFrames = 0;
    this.ring.visible = true;

    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    const now = performance.now();
    const [baseIdx, tipIdx] = this.fingerLandmarks();

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
    const handWidthPx = Math.hypot((pkyImg.x - idxImg.x) * w, (pkyImg.y - idxImg.y) * h);
    const idxW = world[INDEX_MCP];
    const pkyW = world[PINKY_MCP];
    const handWidthM = Math.hypot(pkyW.x - idxW.x, pkyW.y - idxW.y, pkyW.z - idxW.z) || 0.08;
    const pxPerMeter = handWidthPx / handWidthM;
    this._updateSizeReadout(handWidthM, now);

    /* --- 2D position (mirrored: video is CSS-flipped, overlay is not) --- */
    const baseImg = landmarks[baseIdx];
    const tipImg = landmarks[tipIdx];
    const baseX = (1 - baseImg.x) * w - w / 2;
    const baseY = -(baseImg.y * h - h / 2);
    const tipX = (1 - tipImg.x) * w - w / 2;
    const tipY = -(tipImg.y * h - h / 2);
    // Ring sits at ~50% of the proximal phalanx (visually centered between
    // the knuckle and PIP joint — that's where rings actually sit).
    const tParam = 0.50;
    const rawPx = baseX + (tipX - baseX) * tParam;
    const rawPy = baseY + (tipY - baseY) * tParam;

    /* --- in-plane finger angle (image space) --- */
    const dx = tipX - baseX;
    const dy = tipY - baseY;
    const imgLen = Math.hypot(dx, dy) || 1;
    const fx = dx / imgLen;
    const fy = dy / imgLen;
    // We mirror the X axis of the source (selfie view), so the in-plane
    // sense is already correct.

    /* --- out-of-plane pitch from foreshortening ---
     * If finger were exactly in the image plane: imgLen ≈ worldLen × pxPerMeter
     * If finger points toward/away camera: imgLen shrinks, ratio < 1.
     * cos(pitch) = imgLen / (worldLen * pxPerMeter), clamped.
     * Sign: if the TIP is closer to the camera than the BASE in world Z,
     *       pitch is positive (head tilts toward camera).  MediaPipe world
     *       z is "smaller = closer to camera" for image landmarks but for
     *       worldLandmarks z grows toward camera in some builds; we infer
     *       sign from which direction makes the visual prediction match.
     *       Empirically: tip closer to camera → wTip.z < wBase.z. */
    const wBase = world[baseIdx];
    const wTip = world[tipIdx];
    const worldLen = Math.hypot(wTip.x - wBase.x, wTip.y - wBase.y, wTip.z - wBase.z) || 0.04;
    const expectedFlatPx = worldLen * pxPerMeter;
    const cosPitch = Math.max(0.15, Math.min(1, imgLen / expectedFlatPx));
    const pitchMag = Math.acos(cosPitch);
    const pitchSign = (wTip.z < wBase.z) ? +1 : -1;
    const rawPitch = pitchMag * pitchSign;

    /* --- scale ---
     * Calibrate the ring's outer rim to a real ~9.5mm radius (≈19mm OD —
     * typical women's engagement-ring outside diameter). Designer ring's
     * local outer R varies (1.1–1.5) so divide it out. */
    const targetOuterMeters = 0.0095;
    const localOuterR = this._ringLocalOuterR || 1.0;
    const rawScale = (pxPerMeter * targetOuterMeters) / localOuterR;

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
    const cosP = Math.cos(pitch);
    const sinP = Math.sin(pitch);

    /* --- reconstruct basis AFTER smoothing ---
     * Local axis mapping (designer + simple ring both use this convention):
     *   +Z = finger axis (band axis through the ring's hole)
     *   +Y = "up" — points toward the stone/head
     *   +X = sideways (set/shank tangent)
     *
     * Place at pitch=0:
     *   +Z → (fxN, fyN, 0)
     * At pitch=0 the stone faces the CAMERA, so:
     *   +Y (stone)  = (0, 0, 1)        [out of screen toward viewer]
     *   +Z (finger) = (fxN, fyN, 0)
     *   +X (right)  = +Y × +Z = (-fyN, fxN, 0)
     *
     * Rotate +X and +Y around the finger axis +Z by `pitch` so the head
     * tilts away from the camera as the finger pitches forward:
     *   +Y' = (-fyN·sin, fxN·sin,  cos)
     *   +X' = (-fyN·cos, fxN·cos, -sin)
     *   +Z  = (fxN, fyN, 0)                              (unchanged) */
    this._vRight.set(-fyN * cosP, fxN * cosP, -sinP);
    this._vUp.set(-fyN * sinP, fxN * sinP, cosP);
    this._vFwd.set(fxN, fyN, 0);
    this._mat.makeBasis(this._vRight, this._vUp, this._vFwd);

    /* Stash as TARGET pose. The render loop lerps ring → target every
     * rAF for smooth motion between detection frames. On first lock (or
     * after hand-lost) snap directly to avoid an intro lerp from origin. */
    this._tgtPos.set(px, py, 0);
    this._tgtQuat.setFromRotationMatrix(this._mat);
    this._tgtScale = s;
    if (!this._hasTarget) {
      this.ring.position.copy(this._tgtPos);
      this.ring.quaternion.copy(this._tgtQuat);
      this.ring.scale.setScalar(s);
      this._hasTarget = true;
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
      // Mirrored video
      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(this.video, 0, 0, w, h);
      ctx.restore();
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
    if (this.handLandmarker) {
      try { this.handLandmarker.close(); } catch {}
      this.handLandmarker = null;
    }
    if (this.renderer) {
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
    document.body.style.overflow = "";
  }
}

// Wire up the trigger button(s) on the page.
function init() {
  const triggers = document.querySelectorAll(TRIGGER_SELECTOR);
  triggers.forEach(btn => {
    btn.addEventListener("click", async () => {
      if (window.__arTryOn) return;
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
