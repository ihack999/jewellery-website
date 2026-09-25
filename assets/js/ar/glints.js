// Facet glints ("scintillation") for transparent gems.
//
// Real diamonds flash when an individual facet reflects a light source
// straight into the eye; as the hand moves, different facets line up and the
// stone twinkles. We model exactly that: each visible gem gets a small set of
// facet normals (fixed in the gem's own frame), and every frame we test them
// against the scene's key/fill lights and the camera. Alignment drives a
// small additive star at the gem. Nothing flashes unless the geometry and
// lighting say it should, so it reads as sparkle rather than decoration.

import * as THREE from "../three.module.js";
import { GEM_APPEARANCES } from "../gem-appearance.js?v=20260911-construction-v32";

const MAX_GLINTS = 14;
const FACETS_PER_GEM = 9;

let starTexture = null;
function makeStarTexture() {
  if (starTexture) return starTexture;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const c = size / 2;
  const glow = ctx.createRadialGradient(c, c, 0, c, c, c);
  glow.addColorStop(0, "rgba(255,255,255,1)");
  glow.addColorStop(0.08, "rgba(255,255,255,0.85)");
  glow.addColorStop(0.25, "rgba(255,248,235,0.18)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = "lighter";
  const ray = (angle, length, width, alpha) => {
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(angle);
    const g = ctx.createLinearGradient(-length, 0, length, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, `rgba(255,255,255,${alpha})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-length, 0);
    ctx.lineTo(0, -width);
    ctx.lineTo(length, 0);
    ctx.lineTo(0, width);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  ray(0, c, 2.2, 0.95);
  ray(Math.PI / 2, c, 2.2, 0.95);
  ray(Math.PI / 4, c * 0.55, 1.4, 0.45);
  ray(-Math.PI / 4, c * 0.55, 1.4, 0.45);
  starTexture = new THREE.CanvasTexture(canvas);
  starTexture.colorSpace = THREE.SRGBColorSpace;
  return starTexture;
}

// Deterministic pseudo-random so a gem always keeps the same facets.
function seeded(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export class GlintLayer {
  constructor(scene, lights = []) {
    this.scene = scene;
    this.lights = lights;
    this.group = new THREE.Group();
    this.group.name = "ar-gem-glints";
    this.group.renderOrder = 20;
    scene.add(this.group);
    this.items = [];
    this.enabled = true;
    this._v = new THREE.Vector3();
    this._p = new THREE.Vector3();
    this._n = new THREE.Vector3();
    this._r = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._s = new THREE.Vector3();
    this._l = [new THREE.Vector3(), new THREE.Vector3()];
  }

  setTarget(wearable, state) {
    this.clear();
    if (!wearable?.piece) return;
    const gems = [];
    wearable.piece.traverse((mesh) => {
      if (!mesh.isMesh || !mesh.userData.isGem) return;
      const name = mesh.userData.gemMaterial || mesh.material?.userData?.gemMaterial || state?.stone;
      if (GEM_APPEARANCES[name] && GEM_APPEARANCES[name].kind !== "crystal") return;
      mesh.geometry.computeBoundingSphere?.();
      gems.push({ mesh, radius: mesh.geometry.boundingSphere?.radius || 0 });
    });
    gems.sort((a, b) => b.radius - a.radius);
    // Keep the centre stone(s) plus a spread of accents.
    const chosen = gems.length <= MAX_GLINTS ? gems : [...gems.slice(0, 4), ...gems.slice(4).filter((_, i, arr) => i % Math.ceil(arr.length / (MAX_GLINTS - 4)) === 0)].slice(0, MAX_GLINTS);
    // Additive light that leaves alpha untouched: a glint adds brightness but
    // must not count as "jewellery coverage" (which would cast a shadow and
    // hide the camera behind it in the camera-matched composite).
    const material = () => new THREE.SpriteMaterial({ map: makeStarTexture(), color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, depthTest: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor });
    chosen.forEach(({ mesh, radius }, index) => {
      const random = seeded(1000 + index * 7919);
      const facets = Array.from({ length: FACETS_PER_GEM }, () => {
        // Crown facets: tilted 18–52° from the table normal (+Y), any azimuth.
        const tilt = THREE.MathUtils.degToRad(18 + random() * 34);
        const azimuth = random() * Math.PI * 2;
        return new THREE.Vector3(Math.sin(tilt) * Math.cos(azimuth), Math.cos(tilt), Math.sin(tilt) * Math.sin(azimuth));
      });
      facets.push(new THREE.Vector3(0, 1, 0)); // table
      const sprite = new THREE.Sprite(material());
      sprite.material.rotation = random() * Math.PI;
      sprite.visible = false;
      this.group.add(sprite);
      this.items.push({ mesh, radius, facets, sprite, intensity: 0, sharpness: radius === gems[0].radius ? 220 : 140 });
    });
  }

  clear() {
    for (const item of this.items) {
      this.group.remove(item.sprite);
      item.sprite.material.dispose();
    }
    this.items = [];
  }

  update(dt, camera, gain = 1, active = true) {
    if (!this.items.length) return;
    this.group.visible = this.enabled && active;
    if (!this.group.visible) return;
    const brightness = THREE.MathUtils.clamp(Number(gain) || 1, 0.35, 1.4);
    this.lights.forEach((light, i) => this._l[i]?.copy(light.position).normalize());
    const follow = 1 - Math.exp(-dt / 0.035);
    for (const item of this.items) {
      const { mesh, sprite } = item;
      if (!mesh.parent || !mesh.visible) { sprite.visible = false; continue; }
      mesh.getWorldPosition(this._p);
      mesh.matrixWorld.decompose(this._s, this._q, this._r);
      this._v.copy(camera.position).sub(this._p).normalize();
      let best = 0;
      for (const facet of item.facets) {
        this._n.copy(facet).applyQuaternion(this._q);
        if (this._n.dot(this._v) <= 0) continue; // facing away from the camera
        for (let i = 0; i < this.lights.length && i < 2; i++) {
          const l = this._l[i];
          // Mirror reflection of the light about the facet normal.
          this._r.copy(this._n).multiplyScalar(2 * this._n.dot(l)).sub(l);
          const alignment = this._r.dot(this._v);
          if (alignment > 0.9) best = Math.max(best, Math.pow(alignment, item.sharpness) * (i === 0 ? 1 : 0.55));
        }
      }
      item.intensity += (best - item.intensity) * follow;
      const worldRadius = item.radius * this._s.x;
      if (item.intensity < 0.02 || worldRadius <= 0) { sprite.visible = false; continue; }
      sprite.visible = true;
      // Sit just in front of the stone so the gem body doesn't hide it.
      sprite.position.copy(this._p).addScaledVector(this._v, worldRadius * 1.05);
      const size = worldRadius * (2.2 + item.intensity * 2.6);
      sprite.scale.set(size, size, 1);
      sprite.material.opacity = Math.min(1, item.intensity * 1.2) * 0.9 * brightness;
    }
  }

  dispose() {
    this.clear();
    this.scene?.remove(this.group);
  }
}
