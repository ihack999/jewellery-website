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
      transform: scaleX(-1);  /* mirror selfie */
    }
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

// Build a lightweight ring matching the designed metal + stone.
function buildRing(state) {
  const group = new THREE.Group();
  const metalName = state?.metal || "Yellow Gold";
  const stoneName = state?.stone || "Clear Diamond";
  const metalColor = METAL_COLORS[metalName] ?? METAL_COLORS["Yellow Gold"];
  const stoneColor = STONE_COLORS[stoneName] ?? STONE_COLORS["Clear Diamond"];

  // Band — TorusGeometry along XY, axis = Z
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(1.0, 0.14, 24, 96),
    new THREE.MeshPhysicalMaterial({
      color: metalColor,
      metalness: 1.0,
      roughness: 0.18,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2
    })
  );
  group.add(band);

  // Setting head — six prong claw + center stone
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.0, 0);  // sits at top of band
  group.add(headGroup);

  const collet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.22, 0.18, 24),
    new THREE.MeshPhysicalMaterial({ color: metalColor, metalness: 1, roughness: 0.22 })
  );
  collet.position.y = 0.08;
  headGroup.add(collet);

  const prongMat = new THREE.MeshPhysicalMaterial({ color: metalColor, metalness: 1, roughness: 0.2 });
  const prongCount = 4;
  for (let i = 0; i < prongCount; i++) {
    const ang = (i / prongCount) * Math.PI * 2 + Math.PI / 4;
    const prong = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 0.34, 12),
      prongMat
    );
    prong.position.set(Math.cos(ang) * 0.28, 0.24, Math.sin(ang) * 0.28);
    headGroup.add(prong);
  }

  // Center stone
  const stone = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.34, 1),
    new THREE.MeshPhysicalMaterial({
      color: stoneColor,
      metalness: 0.0,
      roughness: 0.02,
      transmission: stoneName === "Clear Diamond" ? 0.85 : 0.5,
      ior: stoneName === "Clear Diamond" ? 2.4 : 1.7,
      thickness: 0.4,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      attenuationDistance: 1.5,
      reflectivity: 0.9
    })
  );
  stone.position.y = 0.34;
  stone.scale.set(1, 0.85, 1);
  headGroup.add(stone);

  return group;
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
    this.smoothed = null;  // smoothed pose data
    this.activeFinger = "ring";
    this.statusEl = null;
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
    if (!landmarks) {
      this.ring.visible = false;
      return;
    }
    this.ring.visible = true;

    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    const [baseIdx, tipIdx] = this.fingerLandmarks();
    const base = landmarks[baseIdx];
    const tip = landmarks[tipIdx];
    // Hand width reference: distance index_MCP → pinky_MCP, used for scale.
    const knuckle1 = landmarks[INDEX_MCP];
    const knuckle2 = landmarks[PINKY_MCP];

    // Convert MediaPipe normalized coords. The video is mirrored via CSS scaleX(-1),
    // so we mirror X here too (1 - x) to match what the user sees.
    const baseX = (1 - base.x) * w - w / 2;
    const baseY = -(base.y * h - h / 2);   // flip Y for three.js (Y up)
    const tipX = (1 - tip.x) * w - w / 2;
    const tipY = -(tip.y * h - h / 2);

    // Position: ~30% from base → tip (the ring sits on the proximal phalanx).
    const t = 0.30;
    const px = baseX + (tipX - baseX) * t;
    const py = baseY + (tipY - baseY) * t;

    // Scale from knuckle-to-knuckle distance (≈ hand width).
    const kdx = (knuckle2.x - knuckle1.x) * w;
    const kdy = (knuckle2.y - knuckle1.y) * h;
    const handWidthPx = Math.hypot(kdx, kdy);
    // A ring spans roughly 0.22× the hand width.
    const ringScale = handWidthPx * 0.22;

    // Orientation: the ring's local axis is Z (band lies in XY).
    // Aim it along the finger direction in 2D (base → tip in image), which means
    // we rotate the ring so its plane is perpendicular to the finger segment.
    const angle = Math.atan2(tipY - baseY, tipX - baseX);

    // Smoothing — EMA on position/scale/rotation to kill jitter.
    if (!this.smoothed) {
      this.smoothed = { x: px, y: py, s: ringScale, a: angle };
    } else {
      const k = 0.35;  // higher = snappier; lower = smoother
      this.smoothed.x += (px - this.smoothed.x) * k;
      this.smoothed.y += (py - this.smoothed.y) * k;
      this.smoothed.s += (ringScale - this.smoothed.s) * k;
      // unwrap rotation to avoid 2π jumps
      let da = angle - this.smoothed.a;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      this.smoothed.a += da * k;
    }

    this.ring.position.set(this.smoothed.x, this.smoothed.y, 0);
    this.ring.scale.setScalar(this.smoothed.s);

    // Rotate the ring so its band axis aligns with the finger.
    // Default ring (torus on XY) has its hole pointing along Z.
    // We want the hole to point along the finger direction in screen space.
    // Step 1: rotate ring 90° around X so the torus opening faces along Y → align with finger.
    // Step 2: rotate around Z by the finger's screen angle.
    this.ring.rotation.set(Math.PI / 2, 0, angle + Math.PI / 2);

    // Tilt the head forward a bit so the stone faces camera at ~70°.
    // Implemented by adding a child-level tilt:
    // (Cheap approach — rotate the whole ring slightly toward camera.)
    this.ring.rotation.x = Math.PI / 2 - 0.35;
  }

  snapshot() {
    try {
      // Composite: draw mirrored video + overlay canvas into a single canvas.
      const w = this.video.videoWidth;
      const h = this.video.videoHeight;
      if (!w || !h) return;
      const out = document.createElement("canvas");
      out.width = w; out.height = h;
      const ctx = out.getContext("2d");
      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(this.video, 0, 0, w, h);
      ctx.restore();
      // Draw three canvas, which is already mirrored visually. We need the
      // CSS-mirrored appearance baked into the output, so draw flipped too.
      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(this.canvas, 0, 0, w, h);
      ctx.restore();
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
