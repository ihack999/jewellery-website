// Camera-matched compositing.
//
// A rendered piece is cleaner than any phone camera: no sensor noise, no
// lens softness, no motion blur. That difference is what makes AR jewellery
// look "stuck on". Here the jewellery is rendered on its own (transparent,
// HDR, 4× MSAA) and composited over the camera frame in one pass that gives
// only the jewellery the camera's character:
//   • grain measured from the live frame (Immerkær noise estimate),
//   • a touch of lens softness scaled to how much the camera is upscaled,
//   • motion blur along the piece's on-screen velocity,
//   • a soft cast shadow from the key light onto the skin/clothes it rests on,
// with the materials' own tone mapping, exactly as in the direct render.
// Where WebGL2 half-float targets aren't available the caller keeps the
// original direct render.

import * as THREE from "../three.module.js";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** Immerkær (1996) fast noise σ, in 8-bit units, from an RGBA crop. */
export function estimateNoiseSigma(pixels, width, height) {
  if (width < 8 || height < 8) return 0;
  const luma = new Float32Array(width * height);
  for (let i = 0; i < luma.length; i++) { const o = i * 4; luma[i] = 0.299 * pixels[o] + 0.587 * pixels[o + 1] + 0.114 * pixels[o + 2]; }
  const values = [];
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const i = y * width + x;
    const v = luma[i - width - 1] - 2 * luma[i - width] + luma[i - width + 1]
      - 2 * luma[i - 1] + 4 * luma[i] - 2 * luma[i + 1]
      + luma[i + width - 1] - 2 * luma[i + width] + luma[i + width + 1];
    values.push(Math.abs(v));
  }
  // Edges inflate the estimate; use the quieter 60% of the image. For pure
  // Gaussian noise that subset's mean is 0.497× the full mean, hence ÷0.497.
  values.sort((a, b) => a - b);
  const kept = values.slice(0, Math.floor(values.length * 0.6));
  const mean = kept.reduce((s, v) => s + v, 0) / Math.max(1, kept.length) / 0.497;
  return clamp(Math.sqrt(Math.PI / 2) * mean / 6, 0, 12);
}

export class CameraMatchedRenderer {
  static supported(renderer) {
    return Boolean(renderer.capabilities.isWebGL2
      && (renderer.extensions.has("EXT_color_buffer_float") || renderer.extensions.has("EXT_color_buffer_half_float")));
  }

  constructor(renderer) {
    this.renderer = renderer;
    this.size = new THREE.Vector2();
    this.target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4, depthBuffer: true, colorSpace: THREE.LinearSRGBColorSpace });
    // three.js only tone-maps when drawing to the screen (or an XR target).
    // Tone mapping must happen per sample, before the MSAA resolve — otherwise
    // HDR specular edges average into glowing outlines — so the target is
    // flagged like an XR target: materials tone-map exactly as they do for the
    // canvas, and the linear colour space keeps storage and resolve plain
    // RGBA16F (no sRGB encode; the composite does that).
    this.target.isXRRenderTarget = true;
    this.noiseSigma = 2;
    this.velocity = new THREE.Vector2();
    this.frame = 0;
    this.uniforms = {
      tFg: { value: this.target.texture },
      tCam: { value: null },
      uCamXform: { value: new THREE.Matrix3() },
      uHasCam: { value: 0 },
      uCamDecode: { value: 0 },
      uTexel: { value: new THREE.Vector2(1, 1) },
      uSoft: { value: 0.5 },
      uVel: { value: new THREE.Vector2() },
      uGrain: { value: 0 },
      uSeed: { value: 0 },
      uShadowDir: { value: new THREE.Vector2() },
      uShadowRadius: { value: new THREE.Vector2() },
      uShadow: { value: 0 }
    };
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      depthTest: false, depthWrite: false, toneMapped: false, transparent: false,
      vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D tFg, tCam;
        uniform mat3 uCamXform;
        uniform float uHasCam, uCamDecode, uSoft, uGrain, uSeed;
        vec3 srgbToLinear(vec3 c) { return mix(pow(c * 0.9478672986 + vec3(0.0521327014), vec3(2.4)), c * 0.0773993808, vec3(lessThanEqual(c, vec3(0.04045)))); }
        uniform vec2 uTexel, uVel, uShadowDir, uShadowRadius;
        uniform float uShadow;
        vec3 oetf(vec3 c) { return mix(pow(c, vec3(0.41666)) * 1.055 - vec3(0.055), c * 12.92, vec3(lessThanEqual(c, vec3(0.0031308)))); }
        float hash(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
        void main() {
          vec4 fg = texture2D(tFg, vUv);
          // Lens softness: centre + four diagonal taps.
          if (uSoft > 0.01) {
            vec2 o = uTexel * uSoft;
            vec4 ring = texture2D(tFg, vUv + vec2(o.x, o.y)) + texture2D(tFg, vUv + vec2(-o.x, o.y))
                      + texture2D(tFg, vUv + vec2(o.x, -o.y)) + texture2D(tFg, vUv + vec2(-o.x, -o.y));
            fg = fg * 0.5 + ring * 0.125;
          }
          // Motion blur along the piece's on-screen velocity.
          if (dot(uVel, uVel) > 0.0) {
            vec4 acc = fg;
            for (int i = 1; i <= 3; i++) {
              float t = float(i) / 6.0;
              acc += texture2D(tFg, vUv + uVel * t) + texture2D(tFg, vUv - uVel * t);
            }
            fg = acc / 7.0;
          }
          float a = clamp(fg.a, 0.0, 1.0);
          // fg is already tone mapped (linear, premultiplied). Encode it the way
          // the canvas did: un-premultiply, encode, re-premultiply. Additive
          // glints (alpha 0) are encoded as light on top.
          vec3 jewelDisplay = a > 0.004 ? oetf(clamp(fg.rgb / a, 0.0, 1.0)) * a : oetf(clamp(fg.rgb, 0.0, 1.0));
          vec3 jewel = fg.rgb;
          // Sensor grain, only where there is jewellery (triangular noise).
          float n = hash(gl_FragCoord.xy + uSeed) + hash(gl_FragCoord.yx * 1.37 + uSeed * 1.91) - 1.0;
          float presence = clamp(max(a, dot(jewel, vec3(0.333)) * 4.0), 0.0, 1.0);
          if (uHasCam > 0.5) {
            vec3 bg = texture2D(tCam, (uCamXform * vec3(vUv, 1.0)).xy).rgb;
            // three.js uploads video frames untouched and decodes sRGB in the shader.
            if (uCamDecode > 0.5) bg = srgbToLinear(bg);
            // Soft cast shadow: jewellery coverage a little toward the key light,
            // blurred over a small disc. Skin shadows lean warm, not grey.
            float shade = 0.0;
            if (uShadow > 0.0) {
              vec2 c = vUv + uShadowDir;
              shade += texture2D(tFg, c).a * 0.2;
              shade += texture2D(tFg, c + vec2( 1.0,  0.0) * uShadowRadius).a * 0.1;
              shade += texture2D(tFg, c + vec2(-1.0,  0.0) * uShadowRadius).a * 0.1;
              shade += texture2D(tFg, c + vec2( 0.0,  1.0) * uShadowRadius).a * 0.1;
              shade += texture2D(tFg, c + vec2( 0.0, -1.0) * uShadowRadius).a * 0.1;
              shade += texture2D(tFg, c + vec2( 0.7,  0.7) * uShadowRadius).a * 0.1;
              shade += texture2D(tFg, c + vec2(-0.7,  0.7) * uShadowRadius).a * 0.1;
              shade += texture2D(tFg, c + vec2( 0.7, -0.7) * uShadowRadius).a * 0.1;
              shade += texture2D(tFg, c + vec2(-0.7, -0.7) * uShadowRadius).a * 0.1;
              bg *= vec3(1.0) - clamp(shade, 0.0, 1.0) * uShadow * vec3(0.82, 1.0, 1.08);
            }
            // Blend in display space, exactly as the browser composited the
            // direct render over the camera (keeps the established look).
            vec3 srgb = jewelDisplay + oetf(bg) * (1.0 - a);
            srgb += n * uGrain * presence;
            gl_FragColor = vec4(srgb, 1.0);
          } else {
            vec3 srgb = jewelDisplay + n * uGrain * presence;
            gl_FragColor = vec4(srgb, a);
          }
        }`
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.quad.frustumCulled = false;
    this.scene = new THREE.Scene();
    this.scene.add(this.quad);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  /** Measure grain from an unscaled crop of the live frame. */
  observeNoise(sigma) {
    if (!Number.isFinite(sigma)) return;
    this.noiseSigma += (sigma - this.noiseSigma) * 0.35;
  }

  /** On-screen velocity of the piece, in drawing-buffer pixels per second. */
  observeVelocity(vx, vy, dt) {
    // Blur length ≈ distance moved during a ~1/60 s exposure.
    const k = 1 - Math.exp(-dt / 0.06);
    this.velocity.x += (vx * 0.016 - this.velocity.x) * k;
    this.velocity.y += (vy * 0.016 - this.velocity.y) * k;
  }

  /**
   * shadow: { strength, distance, radius } in drawing-buffer pixels;
   * lightDir: screen direction toward the key light (x right, y up).
   */
  render(scene, camera, { cameraTexture = null, bufferPerVideoPixel = 1, shadow = null, lightDir = null } = {}) {
    const renderer = this.renderer;
    renderer.getDrawingBufferSize(this.size);
    if (this.target.width !== this.size.x || this.target.height !== this.size.y) this.target.setSize(this.size.x, this.size.y);
    const background = scene.background;
    scene.background = null;
    const clearAlpha = renderer.getClearAlpha();
    renderer.setClearAlpha(0);
    renderer.setRenderTarget(this.target);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.setClearAlpha(clearAlpha);
    scene.background = background;

    const u = this.uniforms;
    u.uTexel.value.set(1 / this.size.x, 1 / this.size.y);
    // Softer when the camera image is enlarged on screen, never mushy.
    // Match the camera's own softness: a camera pixel spans bufferPerVideoPixel
    // buffer pixels, so blur by about half of that (none when it's sub-pixel).
    const soft = bufferPerVideoPixel * 0.5;
    u.uSoft.value = soft < 0.2 ? 0 : clamp(soft, 0, 1.5);
    let vx = this.velocity.x, vy = this.velocity.y;
    const len = Math.hypot(vx, vy);
    // Slightly under the physical estimate and capped: the tracker's own lag
    // already smears fast motion a little, and a ghosted piece reads as a bug.
    vx *= 0.6; vy *= 0.6;
    const blur = len * 0.6;
    if (blur < 1.5) { vx = 0; vy = 0; } else if (blur > 14) { vx *= 14 / blur; vy *= 14 / blur; }
    u.uVel.value.set(vx / this.size.x, vy / this.size.y);
    // σ (8-bit) → amplitude of triangular noise (std = amplitude / √6).
    // A camera frame shown smaller than native averages its noise away
    // (σ scales with the linear size ratio); enlarged frames keep it.
    const shownSigma = clamp(this.noiseSigma, 0, 8) * clamp(bufferPerVideoPixel, 0.25, 1);
    u.uGrain.value = shownSigma / 255 * Math.sqrt(6) * 0.85;
    u.uSeed.value = (this.frame++ % 997) * 7.13;
    if (shadow && shadow.strength > 0) {
      const dir = lightDir || { x: 0.62, y: 0.78 };
      const l = Math.hypot(dir.x, dir.y) || 1;
      u.uShadowDir.value.set(dir.x / l * shadow.distance / this.size.x, dir.y / l * shadow.distance / this.size.y);
      u.uShadowRadius.value.set(shadow.radius / this.size.x, shadow.radius / this.size.y);
      u.uShadow.value = shadow.strength;
    } else u.uShadow.value = 0;
    if (cameraTexture) {
      u.tCam.value = cameraTexture;
      cameraTexture.updateMatrix?.();
      u.uCamXform.value.copy(cameraTexture.matrix);
      u.uHasCam.value = 1;
      u.uCamDecode.value = cameraTexture.isVideoTexture && cameraTexture.colorSpace === THREE.SRGBColorSpace ? 1 : 0;
    } else u.uHasCam.value = 0;
    renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.target.dispose();
    this.material.dispose();
    this.quad.geometry.dispose();
  }
}
