// Hair in front of jewellery.
//
// The tracking worker periodically runs Google's hair segmenter and sends a
// small confidence mask. After the jewellery is rendered, we erase jewellery
// pixels where hair is — but only inside regions where hair is actually in
// front. Segmentation can't tell "hair in front of the earring" from "hair
// behind it", so:
//   • Necklaces: hair overlapping the chain is almost always in front (the
//     body hides any hair behind it), so the whole necklace region is used.
//   • Earrings: each ear is only occluded when its lobe itself is covered by
//     hair. An exposed ear with hair falling behind keeps the earring fully
//     visible.
//
// The same pass also erases jewellery behind a forearm/hand that the pose
// tracker says is in front of the body ("limbs": capsules in stage pixels) —
// e.g. a hand raised to the collarbone in front of a necklace.

import * as THREE from "../three.module.js";

const MAX_REGIONS = 4;
const MAX_LIMBS = 4;

export class HairOcclusion {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1);
    this.texture = null;
    this.mask = null;
    this.maskTime = 0;
    this.regions = [];
    this.limbs = [];
    this.uniforms = {
      uMask: { value: null },
      uHasMask: { value: 0 },
      uStage: { value: new THREE.Vector2(1, 1) },
      uLimb: { value: Array.from({ length: MAX_LIMBS }, () => new THREE.Vector4()) },
      uLimbR: { value: new Array(MAX_LIMBS).fill(0) },
      uLimbStrength: { value: new Array(MAX_LIMBS).fill(0) },
      uMap: { value: new THREE.Vector4(0, 0, 1, 1) },
      uMirror: { value: 0 },
      uRegion: { value: Array.from({ length: MAX_REGIONS }, () => new THREE.Vector4(0, 0, 1, 1)) },
      uStrength: { value: new Array(MAX_REGIONS).fill(0) }
    };
    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      premultipliedAlpha: false,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.ZeroFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uMask;
        uniform vec4 uMap;
        uniform float uMirror;
        uniform vec4 uRegion[${MAX_REGIONS}];
        uniform float uStrength[${MAX_REGIONS}];
        uniform float uHasMask;
        uniform vec2 uStage;
        uniform vec4 uLimb[${MAX_LIMBS}];
        uniform float uLimbR[${MAX_LIMBS}];
        uniform float uLimbStrength[${MAX_LIMBS}];
        void main() {
          vec2 s = vec2(vUv.x, 1.0 - vUv.y);
          // Limbs: distance to each capsule, in stage pixels.
          vec2 px = s * uStage;
          float limb = 0.0;
          for (int i = 0; i < ${MAX_LIMBS}; i++) {
            if (uLimbStrength[i] <= 0.0) continue;
            vec2 a = uLimb[i].xy, b = uLimb[i].zw;
            vec2 ab = b - a;
            float t = clamp(dot(px - a, ab) / max(dot(ab, ab), 1e-3), 0.0, 1.0);
            float d = length(px - (a + ab * t));
            limb = max(limb, uLimbStrength[i] * (1.0 - smoothstep(uLimbR[i] * 0.82, uLimbR[i] * 1.04, d)));
          }
          float hairAlpha = 0.0;
          if (uHasMask > 0.5) {
            vec2 v = (s - uMap.xy) / uMap.zw;
            if (uMirror > 0.5) v.x = 1.0 - v.x;
            float inside = step(0.0, v.x) * step(0.0, v.y) * step(v.x, 1.0) * step(v.y, 1.0);
            float weight = 0.0;
            for (int i = 0; i < ${MAX_REGIONS}; i++) {
              vec2 d = (s - uRegion[i].xy) / uRegion[i].zw;
              weight = max(weight, uStrength[i] * (1.0 - smoothstep(0.8, 1.0, length(d))));
            }
            if (weight > 0.0 && inside > 0.0) hairAlpha = smoothstep(0.38, 0.72, texture2D(uMask, clamp(v, 0.0, 1.0)).r) * weight;
          }
          float alpha = max(hairAlpha, limb);
          if (alpha <= 0.0) discard;
          gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
        }`
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
    quad.position.set(0.5, 0.5, 0);
    quad.frustumCulled = false;
    this.material = material;
    this.scene.add(quad);
  }

  /** @param {{width:number,height:number,data:Uint8Array,timestamp:number}} mask */
  updateMask(mask) {
    if (!mask?.data?.length) return;
    if (!this.texture || this.texture.image.width !== mask.width || this.texture.image.height !== mask.height) {
      this.texture?.dispose();
      this.texture = new THREE.DataTexture(mask.data, mask.width, mask.height, THREE.RedFormat, THREE.UnsignedByteType);
      this.texture.magFilter = THREE.LinearFilter;
      this.texture.minFilter = THREE.LinearFilter;
      this.uniforms.uMask.value = this.texture;
    } else {
      this.texture.image.data = mask.data;
    }
    this.texture.needsUpdate = true;
    this.mask = mask;
    this.maskTime = performance.now();
  }

  /** Average hair confidence around a point given in video-normalised coordinates. */
  coverageAt(u, v, radius = 0.025) {
    const mask = this.mask;
    if (!mask) return 0;
    const x0 = Math.max(0, Math.floor((u - radius) * mask.width)), x1 = Math.min(mask.width - 1, Math.ceil((u + radius) * mask.width));
    const y0 = Math.max(0, Math.floor((v - radius) * mask.height)), y1 = Math.min(mask.height - 1, Math.ceil((v + radius) * mask.height));
    let sum = 0, count = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { sum += mask.data[y * mask.width + x]; count++; }
    return count ? sum / count / 255 : 0;
  }

  /** Regions in stage pixels: {x, y, rx, ry, strength}. */
  setRegions(regions, metrics) {
    this.regions = regions.slice(0, MAX_REGIONS);
    for (let i = 0; i < MAX_REGIONS; i++) {
      const r = this.regions[i];
      this.uniforms.uStrength.value[i] = r ? r.strength : 0;
      if (r) this.uniforms.uRegion.value[i].set(r.x / metrics.width, r.y / metrics.height, Math.max(1, r.rx) / metrics.width, Math.max(1, r.ry) / metrics.height);
    }
  }

  /** Forearm/hand capsules in stage pixels: {ax, ay, bx, by, r, strength}. */
  setLimbs(limbs) {
    this.limbs = limbs.slice(0, MAX_LIMBS);
    for (let i = 0; i < MAX_LIMBS; i++) {
      const l = this.limbs[i];
      this.uniforms.uLimbStrength.value[i] = l ? l.strength : 0;
      this.uniforms.uLimbR.value[i] = l ? l.r : 0;
      if (l) this.uniforms.uLimb.value[i].set(l.ax, l.ay, l.bx, l.by);
    }
  }

  render(renderer, app) {
    const hasHair = Boolean(this.texture) && this.regions.some((r) => r.strength > 0.01) && performance.now() - this.maskTime <= 1200; // stale mask: don't guess
    const hasLimbs = this.limbs.some((l) => l.strength > 0.01);
    if (!hasHair && !hasLimbs) return;
    this.uniforms.uHasMask.value = hasHair ? 1 : 0;
    const m = app.videoMetrics();
    this.uniforms.uStage.value.set(m.width, m.height);
    this.uniforms.uMap.value.set(m.offsetX / m.width, m.offsetY / m.height, m.drawWidth / m.width, m.drawHeight / m.height);
    this.uniforms.uMirror.value = app.isMirrored ? 1 : 0;
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.render(this.scene, this.camera);
    renderer.autoClear = autoClear;
  }

  dispose() {
    this.texture?.dispose();
    this.material.dispose();
  }
}
