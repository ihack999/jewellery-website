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
    // Quat:     channel-per-component (we re-normalize each frame).
    this.filtPx = new OneEuro(1.2, 0.015);
    this.filtPy = new OneEuro(1.2, 0.015);
    this.filtScale = new OneEuro(0.6, 0.01);
    this.filtQx = new OneEuro(2.0, 0.02);
    this.filtQy = new OneEuro(2.0, 0.02);
    this.filtQz = new OneEuro(2.0, 0.02);
    this.filtQw = new OneEuro(2.0, 0.02);

    // Pre-allocated math objects (avoid GC each frame).
    this._vBase = new THREE.Vector3();
    this._vTip = new THREE.Vector3();
    this._vUp = new THREE.Vector3();
    this._vRight = new THREE.Vector3();
    this._vFwd = new THREE.Vector3();
    this._mat = new THREE.Matrix4();
    this._quat = new THREE.Quaternion();
  }

  async open() {
    injectStyles();
    this.modal = buildModal();
    document.body.appendChild(this.modal);
    document.body.style.overflow = "hidden";

    this.video = this.modal.querySelector(".ar-tryon-video");
    this.canvas = this.modal.querySelector(".ar-tryon-canvas");
    this.statusEl = this.modal.querySelector("[data-ar-status]");

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

    // Three-point-ish rig appropriate for catalog-style metal pop on top of video.
    const hemi = new THREE.HemisphereLight(0xffffff, 0x404a55, 1.1);
    this.scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(0.8, 1, 0.6);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xc7d6ff, 0.9);
    fill.position.set(-0.7, 0.4, 0.5);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xfff1d8, 0.8);
    rim.position.set(0, 0.5, -1);
    this.scene.add(rim);

    const state = readDesignState();
    this.ring = buildRing(state);
    this.scene.add(this.ring);

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
    this.renderer.render(this.scene, this.camera);
  };

  applyResult(result) {
    const landmarks = result?.landmarks?.[0];
    const world = result?.worldLandmarks?.[0];
    const handedness = result?.handedness?.[0]?.[0]?.categoryName;  // 'Left'/'Right' in raw image

    if (!landmarks || !world) {
      this.handLostFrames++;
      if (this.handLostFrames > 8) {
        this.ring.visible = false;
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
    const base = landmarks[baseIdx];
    const tip = landmarks[tipIdx];

    /* ----- 2D POSITION (mirrored, in three.js pixel space) -----
       The video is css-mirrored; the overlay canvas is NOT, so we mirror X
       here (1 - x) to land the ring on the visually correct hand. Y is
       flipped because three.js is Y-up while image is Y-down. */
    const baseX = (1 - base.x) * w - w / 2;
    const baseY = -(base.y * h - h / 2);
    const tipX = (1 - tip.x) * w - w / 2;
    const tipY = -(tip.y * h - h / 2);

    // Ring sits ~30% up the proximal phalanx (base → PIP segment).
    const tParam = 0.30;
    const rawPx = baseX + (tipX - baseX) * tParam;
    const rawPy = baseY + (tipY - baseY) * tParam;

    /* ----- SCALE — use 3D finger length so out-of-plane rotation does not
       shrink the ring.  We measure the WORLD-space distance between adjacent
       knuckles and multiply by a pixels-per-meter factor derived from the
       image-space hand width (index MCP ↔ pinky MCP). */
    const k1Img = landmarks[INDEX_MCP];
    const k2Img = landmarks[PINKY_MCP];
    const handWidthPx = Math.hypot((k2Img.x - k1Img.x) * w, (k2Img.y - k1Img.y) * h);
    const k1W = world[INDEX_MCP];
    const k2W = world[PINKY_MCP];
    const handWidthM = Math.hypot(k2W.x - k1W.x, k2W.y - k1W.y, k2W.z - k1W.z) || 0.08;
    const pxPerMeter = handWidthPx / handWidthM;
    // Real-world ring outer diameter ≈ 22mm → radius 11mm.
    // Our torus has outer radius 1.0 in local units, so 1 unit = 11mm = 0.011m.
    const rawScale = pxPerMeter * 0.011;

    /* ----- 3D ORIENTATION via worldLandmarks -----
       Build an orthonormal basis from the hand:
         fwd   = finger base → tip      (becomes ring's local +Y, toward setting)
         right = index_MCP → pinky_MCP  (across the palm)
         up    = right × fwd            (palm normal; setting points along this)
       Then re-orthogonalize.  Mirror X to match the css-mirrored video. */
    this._vFwd.set(
      -(world[tipIdx].x - world[baseIdx].x),
      -(world[tipIdx].y - world[baseIdx].y),   // mediapipe Y is down
      -(world[tipIdx].z - world[baseIdx].z)
    ).normalize();
    this._vRight.set(
      -(k2W.x - k1W.x),
      -(k2W.y - k1W.y),
      -(k2W.z - k1W.z)
    ).normalize();
    // Up = right × fwd (right-hand rule).  For a palm-down (back of hand to
    // camera) gesture this points toward camera, which is what we want for
    // the stone to sit on top of the finger.
    this._vUp.crossVectors(this._vRight, this._vFwd).normalize();
    // Re-orthogonalize right so the basis is square.
    this._vRight.crossVectors(this._vFwd, this._vUp).normalize();

    // Flip up if the user is showing the palm (stone should still face camera).
    if (this._vUp.z < 0) {
      this._vUp.multiplyScalar(-1);
      this._vRight.multiplyScalar(-1);
    }

    /* Ring local axes: +Y up toward setting, +Z is the torus axis (finger),
       +X is sideways.  We need a basis where:
         local +Y = world up   (palm normal pointing away from palm)
         local +Z = world fwd  (finger direction)
         local +X = world right
       Matrix4.makeBasis(x, y, z) builds exactly this. */
    this._mat.makeBasis(this._vRight, this._vUp, this._vFwd);
    this._quat.setFromRotationMatrix(this._mat);

    /* ----- Smoothing (One-Euro on each component) ----- */
    const px = this.filtPx.filter(rawPx, now);
    const py = this.filtPy.filter(rawPy, now);
    const s = this.filtScale.filter(rawScale, now);

    // For quaternions, filter each component then normalize.  Guard against
    // hemisphere flips by aligning with the previous quaternion.
    if (this._prevQuat && this._quat.dot(this._prevQuat) < 0) {
      this._quat.x = -this._quat.x;
      this._quat.y = -this._quat.y;
      this._quat.z = -this._quat.z;
      this._quat.w = -this._quat.w;
    }
    const qx = this.filtQx.filter(this._quat.x, now);
    const qy = this.filtQy.filter(this._quat.y, now);
    const qz = this.filtQz.filter(this._quat.z, now);
    const qw = this.filtQw.filter(this._quat.w, now);
    const qLen = Math.hypot(qx, qy, qz, qw) || 1;
    this.ring.quaternion.set(qx / qLen, qy / qLen, qz / qLen, qw / qLen);
    if (!this._prevQuat) this._prevQuat = new THREE.Quaternion();
    this._prevQuat.copy(this.ring.quaternion);

    this.ring.position.set(px, py, 0);
    this.ring.scale.setScalar(s);
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
