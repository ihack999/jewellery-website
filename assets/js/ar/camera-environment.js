// Live camera reflections.
//
// Polished metal and diamonds are mostly mirrors: what makes them look real
// is that they reflect the room they are in. A studio HDR alone gives the
// same grey softbox reflections everywhere, which reads as "pasted on".
//
// Every ~1.2 s (only when the view has changed; less often on busy devices) we build an environment from
// the camera: a small, blurred copy of the frame is wrapped around the
// jewellery (behind it: what the camera sees; in front of it: the same view
// mirrored, the usual approximation for the unseen half). It is blended with
// the studio HDR, whose bright lights are kept at full strength so stones
// still sparkle, then pre-filtered (PMREM) into the same render target the
// scene already uses — no shader recompiles.
//
// It also estimates the light colour (white balance) from the brightest
// parts of the frame, so white gold looks warm under warm indoor light.

import * as THREE from "../three.module.js";

const CAM_W = 64, CAM_H = 48;
const INTERVAL_MS = 1200;      // rebuild cadence when the view changes
const SLOW_INTERVAL_MS = 4000; // when the device is already busy rendering
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const toLinear = Float32Array.from({ length: 256 }, (_, b) => { const v = b / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });

export function estimateWhitePoint(pixels, width, height) {
  // White-patch estimate: the brightest ~6% of pixels (lamps, walls, speculars)
  // carry the illuminant's colour; skin and clothing dominate the rest.
  const lum = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    lum[i] = 0.2126 * toLinear[pixels[o]] + 0.7152 * toLinear[pixels[o + 1]] + 0.0722 * toLinear[pixels[o + 2]];
  }
  const sorted = Float32Array.from(lum).sort();
  const threshold = sorted[Math.floor(sorted.length * 0.94)];
  let r = 0, g = 0, b = 0, n = 0, mean = 0;
  for (let i = 0; i < lum.length; i++) {
    mean += lum[i];
    if (lum[i] < threshold) continue;
    const o = i * 4;
    // Clipped pixels have lost their colour; skip them.
    if (pixels[o] > 250 && pixels[o + 1] > 250 && pixels[o + 2] > 250) continue;
    r += toLinear[pixels[o]]; g += toLinear[pixels[o + 1]]; b += toLinear[pixels[o + 2]]; n++;
  }
  mean /= Math.max(1, lum.length);
  if (n < 4) return { tint: [1, 1, 1], mean };
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b || 1;
  // Keep the correction gentle and bounded: a colour cast, never a colour.
  const tint = [r / l, g / l, b / l].map((c) => clamp(1 + (c - 1) * 0.55, 0.86, 1.14));
  const tl = 0.2126 * tint[0] + 0.7152 * tint[1] + 0.0722 * tint[2];
  return { tint: tint.map((c) => c / tl), mean };
}

export class CameraEnvironment {
  constructor(renderer, hdrTexture, envTarget) {
    this.renderer = renderer;
    this.hdr = hdrTexture;
    this.envTarget = envTarget;
    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.pmrem.compileEquirectangularShader();
    // PMREMGenerator only allocates its blur targets when it creates the output
    // target itself; since we re-render into the scene's existing target,
    // warm it up once (the throwaway output is freed immediately).
    this.pmrem.fromEquirectangular(hdrTexture).dispose();
    this.canvas = document.createElement("canvas");
    this.canvas.width = CAM_W; this.canvas.height = CAM_H;
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    this.camTexture = new THREE.CanvasTexture(this.canvas);
    this.camTexture.colorSpace = THREE.SRGBColorSpace;
    this.camTexture.minFilter = THREE.LinearFilter;
    this.camTexture.generateMipmaps = false;
    const w = hdrTexture.image.width, h = hdrTexture.image.height;
    this.target = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, depthBuffer: false, magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter, generateMipmaps: false });
    this.target.texture.mapping = THREE.EquirectangularReflectionMapping;
    this.hdrMean = meanLuminance(hdrTexture);
    this.tint = new THREE.Vector3(1, 1, 1);
    this.tintTarget = new THREE.Vector3(1, 1, 1);
    this.lastUpdate = -Infinity;
    this.lastSignature = null;
    this.enabled = true;
    this.uniforms = {
      tHdr: { value: hdrTexture },
      tCam: { value: this.camTexture },
      uMix: { value: 0.42 },
      uCamGain: { value: 1 },
      uTint: { value: this.tint },
      uHdrMean: { value: this.hdrMean },
      uK: { value: new THREE.Vector2(0.42, 0.56) }
    };
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      depthTest: false, depthWrite: false, toneMapped: false,
      vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D tHdr, tCam;
        uniform float uMix, uCamGain, uHdrMean;
        uniform vec3 uTint;
        uniform vec2 uK;
        void main() {
          float phi = (vUv.x - 0.5) * 6.28318530718;
          float theta = (vUv.y - 0.5) * 3.14159265359;
          vec3 d = vec3(cos(theta) * cos(phi), sin(theta), cos(theta) * sin(phi));
          vec3 hdr = texture2D(tHdr, vUv).rgb;
          // Behind the piece: the camera view. In front: its mirror image.
          vec2 p = d.xy / max(abs(d.z), 0.12);
          vec2 cuv = clamp(0.5 + p * uK, vec2(0.0), vec2(1.0));
          vec3 cam = texture2D(tCam, cuv).rgb * uCamGain;
          // Studio lights stay at full strength; the room colours the rest.
          vec3 lights = max(hdr - vec3(uHdrMean * 3.0), vec3(0.0));
          vec3 col = mix(hdr, cam, uMix) + lights * uMix;
          gl_FragColor = vec4(col * uTint, 1.0);
        }`
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.quad.frustumCulled = false;
    this.scene = new THREE.Scene();
    this.scene.add(this.quad);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  /** Returns true when the environment was rebuilt. */
  update(now, source, { mirrored = false, videoAspect = 4 / 3, busy = false } = {}) {
    if (!this.enabled || !source || now - this.lastUpdate < (busy ? SLOW_INTERVAL_MS : INTERVAL_MS)) return false;
    this.lastUpdate = now;
    let pixels;
    try {
      this.ctx.save();
      if (mirrored) { this.ctx.translate(CAM_W, 0); this.ctx.scale(-1, 1); }
      this.ctx.drawImage(source, 0, 0, CAM_W, CAM_H);
      this.ctx.restore();
      pixels = this.ctx.getImageData(0, 0, CAM_W, CAM_H).data;
    } catch { return false; }
    // Skip the (few ms) rebuild when the view has barely changed.
    const signature = signatureOf(pixels);
    const changed = !this.lastSignature || signature.some((v, i) => Math.abs(v - this.lastSignature[i]) > 10);
    const { tint, mean } = estimateWhitePoint(pixels, CAM_W, CAM_H);
    this.tintTarget.set(...tint);
    if (!changed && now - this.lastRebuild < 6000) return false;
    this.lastSignature = signature;
    this.lastRebuild = now;
    this.tint.lerp(this.tintTarget, this.lastRebuildDone ? 0.5 : 1);
    // Camera supplies colour and structure; its level is matched to the HDR's
    // so a dim room doesn't make the metal look dead (exposure is handled by
    // the appearance gain).
    this.uniforms.uCamGain.value = clamp(this.hdrMean / Math.max(mean, 1e-3), 0.3, 6);
    this.uniforms.uK.value.set(0.42, 0.42 * clamp(videoAspect, 0.4, 2.5));
    this.camTexture.needsUpdate = true;
    const renderer = this.renderer;
    const previousTarget = renderer.getRenderTarget();
    const autoClear = renderer.autoClear;
    renderer.autoClear = true;
    renderer.setRenderTarget(this.target);
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(previousTarget);
    renderer.autoClear = autoClear;
    this.pmrem.fromEquirectangular(this.target.texture, this.envTarget);
    this.lastRebuildDone = true;
    return true;
  }

  dispose() {
    this.pmrem.dispose();
    this.target.dispose();
    this.camTexture.dispose();
    this.material.dispose();
    this.quad.geometry.dispose();
    this.hdr?.dispose();
  }
}

function signatureOf(pixels) {
  // 4×3 grid of mean sRGB values.
  const out = new Array(36).fill(0);
  const counts = new Array(12).fill(0);
  for (let y = 0; y < CAM_H; y++) for (let x = 0; x < CAM_W; x++) {
    const cell = Math.floor(y / (CAM_H / 3)) * 4 + Math.floor(x / (CAM_W / 4));
    const o = (y * CAM_W + x) * 4;
    out[cell * 3] += pixels[o]; out[cell * 3 + 1] += pixels[o + 1]; out[cell * 3 + 2] += pixels[o + 2];
    counts[cell]++;
  }
  return out.map((v, i) => v / counts[Math.floor(i / 3)]);
}

function meanLuminance(texture) {
  const { data, width, height } = texture.image || {};
  if (!data || !width || !height) return 0.5;
  const half = data instanceof Uint16Array;
  const channels = data.length / (width * height);
  const read = (i) => (half ? THREE.DataUtils.fromHalfFloat(data[i]) : data[i]);
  let sum = 0, n = 0;
  const step = Math.max(1, Math.floor((width * height) / 4096));
  for (let p = 0; p < width * height; p += step) {
    const o = p * channels;
    const l = 0.2126 * read(o) + 0.7152 * read(o + 1) + 0.0722 * read(o + 2);
    if (Number.isFinite(l)) { sum += l; n++; }
  }
  return n ? sum / n : 0.5;
}
