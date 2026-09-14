import * as THREE from "../three.module.js";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const smoothstep = (low, high, value) => {
  const t = clamp((value - low) / (high - low), 0, 1);
  return t * t * (3 - 2 * t);
};
const finiteVector = vector => vector && [vector.x, vector.y, vector.z].every(Number.isFinite);

// Conservative application priors, not a measured skin surface. The radius
// supplied by the caller is the cross-section AT the ring seat, not at a cap.
const PROFILES = {
  index: { proximal: 1.11, distal: 0.93 },
  middle: { proximal: 1.09, distal: 0.95 },
  ring: { proximal: 1.10, distal: 0.94 },
  pinky: { proximal: 1.08, distal: 0.91 }
};

/** Depth-only proximal phalanx fitted between MCP and PIP joint centres.
 * Source geometry belongs to the tracked body. A display correction can keep
 * it in time with a filtered ring without baking ring size/adjustments into it.
 */
export class FingerContactBody extends THREE.Mesh {
  constructor() {
    const geometry = new THREE.CapsuleGeometry(1, 1, 8, 32);
    geometry.rotateX(Math.PI / 2); // joint centres at local z = -0.5, +0.5
    super(geometry, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, depthTest: true }));
    this.name = "joint-fitted-finger-depth";
    this.renderOrder = -100;
    this.frustumCulled = false;
    this.matrixAutoUpdate = false;
    this.visible = false;
    this.valid = false;
    this.sourceMatrix = new THREE.Matrix4();
    this.template = geometry.attributes.position.array.slice();
    this._along = new THREE.Vector3();
    this._up = new THREE.Vector3();
    this._side = new THREE.Vector3();
    this._center = new THREE.Vector3();
  }

  updateSource({ start, end, dorsal, radius, seat = 0.34, finger = "ring" }) {
    this.valid = false;
    this.visible = false;
    if (![start, end, dorsal].every(finiteVector) || !Number.isFinite(radius) || radius <= 0
      || !Number.isFinite(seat) || seat < 0 || seat > 1) return false;
    const length = this._along.subVectors(end, start).length();
    // Reject collapsed or implausibly elongated geometry, rather than emit a
    // huge depth sheet. These guards are geometry checks, not model confidence.
    if (length < radius * 1.5 || length > radius * 12) return false;
    this._along.divideScalar(length);
    this._up.copy(dorsal);
    this._up.addScaledVector(this._along, -this._up.dot(this._along));
    if (this._up.lengthSq() < 1e-6) return false;
    this._up.normalize();
    this._side.crossVectors(this._up, this._along).normalize();
    this._up.crossVectors(this._along, this._side).normalize();
    this._center.copy(start).lerp(end, 0.5);
    this.sourceMatrix.makeBasis(this._side, this._up, this._along).setPosition(this._center);

    const { proximal, distal } = PROFILES[finger] || PROFILES.ring;
    const seatWidth = proximal + (distal - proximal) * seat;
    const position = this.geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const j = i * 3, z = this.template[j + 2];
      const jointZ = clamp(z, -0.5, 0.5);
      const width = (proximal + (distal - proximal) * (jointZ + 0.5)) / seatWidth;
      position.setXYZ(i, this.template[j] * radius * width,
        this.template[j + 1] * radius * width * 0.82,
        jointZ * length + (z - jointZ) * radius * width);
    }
    position.needsUpdate = true;
    // Depth-only material does not use normals. Keep bounds valid for tooling.
    this.geometry.computeBoundingBox();
    this.geometry.computeBoundingSphere();
    this.valid = true;
    return true;
  }

  syncDisplay(correction, visible) {
    this.visible = this.valid && visible;
    if (!this.visible) return;
    this.matrix.multiplyMatrices(correction, this.sourceMatrix);
    this.matrixWorldNeedsUpdate = true;
  }

  dispose() {
    this.removeFromParent();
    this.geometry.dispose();
    this.material.dispose();
  }
}

// A shadow can suggest contact only while the adjusted band stays near the
// finger centreline and between its joints. This does not snap or resize it.
export function fingerContactWeight({ side, lift, directionX, directionY, radius, length, seat }) {
  if (![side, lift, directionX, directionY, radius, length, seat].every(Number.isFinite)
    || radius <= 0 || length <= 0) return 0;
  const lateral = Math.abs(side + directionX * lift);
  const along = length * seat + directionY * lift;
  const beyondJoint = Math.max(-along, along - length, 0);
  return (1 - smoothstep(radius * 0.15, radius * 0.65, lateral))
    * (1 - smoothstep(0, radius * 0.75, beyondJoint));
}
