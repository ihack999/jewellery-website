import * as THREE from "../three.module.js";

export function wristOrientation(x, y, pitch, roll) {
  const side = new THREE.Vector3(-y, x, 0);
  const up = new THREE.Vector3(-x * Math.sin(pitch), -y * Math.sin(pitch), Math.cos(pitch));
  const along = new THREE.Vector3(x * Math.cos(pitch), y * Math.cos(pitch), Math.sin(pitch));
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(
    side.clone().multiplyScalar(Math.cos(roll)).addScaledVector(up, -Math.sin(roll)),
    side.multiplyScalar(Math.sin(roll)).addScaledVector(up, Math.cos(roll)), along));
}

/** Scene-owned wrist depth. Pose comes from the hand; transverse dimensions
 * are explicit estimates. Jewellery translation/tilt never transforms skin.
 */
export class WristContactBody extends THREE.Mesh {
  constructor() {
    const geometry = new THREE.CapsuleGeometry(1, 2, 8, 32);
    geometry.rotateX(Math.PI / 2);
    super(geometry, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true }));
    this.name = "independent-wrist-depth";
    this.renderOrder = -100;
    this.frustumCulled = false;
    this.matrixAutoUpdate = false;
    this.visible = false;
    this.valid = false;
    this.sourceMatrix = new THREE.Matrix4();
    this._scale = new THREE.Vector3();
  }

  updateSource(center, orientation, radius, unitsPerMeter) {
    this.valid = [center.x, center.y, center.z, ...orientation.toArray(), radius, unitsPerMeter].every(Number.isFinite)
      && radius > 0 && unitsPerMeter > 0;
    this.visible = false;
    if (!this.valid) return;
    // 80 mm rounded sleeve around the wrist, rather than a long body tied to
    // the product opening. Width/depth remain independent of the selected size.
    this._scale.set(radius, radius * .72, unitsPerMeter * .020);
    this.sourceMatrix.compose(center, orientation, this._scale);
  }

  syncDisplay(correction, visible) {
    this.visible = this.valid && visible;
    if (!this.visible) return;
    this.matrix.multiplyMatrices(correction, this.sourceMatrix);
    this.matrixWorldNeedsUpdate = true;
  }

  dispose() { this.removeFromParent(); this.geometry.dispose(); this.material.dispose(); }
}

/** Settle a rigid opening towards projected gravity until it contacts the
 * estimated wrist. Translation only: product dimensions are never stretched.
 * A conservative inscribed ellipse approximates the actual rounded opening.
 */
export function rigidWristSeat({ wristRadius, innerRadius, thickness, gravityX, gravityY }) {
  if (![wristRadius, innerRadius, thickness, gravityX, gravityY].every(Number.isFinite)
    || wristRadius <= 0 || innerRadius <= 0 || thickness < 0) return { x: 0, y: 0, fits: false };
  const minor = innerRadius * .80 - thickness * .10;
  if (minor <= 0) return { x: 0, y: 0, fits: false };
  const magnitude = Math.hypot(gravityX, gravityY);
  const ux = magnitude > 1e-6 ? gravityX / magnitude : 0;
  const uy = magnitude > 1e-6 ? gravityY / magnitude : 0;
  const contains = distance => {
    for (let i = 0; i < 64; i++) {
      const angle = i / 64 * Math.PI * 2;
      const x = (wristRadius * Math.cos(angle) - ux * distance) / innerRadius;
      const y = (wristRadius * .72 * Math.sin(angle) - uy * distance) / minor;
      if (x * x + y * y > 1 + 1e-8) return false;
    }
    return true;
  };
  if (!contains(0)) return { x: 0, y: 0, fits: false };
  if (magnitude < .12) return { x: 0, y: 0, fits: true };
  let low = 0, high = Math.max(innerRadius, minor);
  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2;
    if (contains(mid)) low = mid; else high = mid;
  }
  // Fade near the underconstrained axial-gravity case, without a sudden flip.
  const weight = Math.min(1, (magnitude - .12) / .25);
  return { x: ux * low * weight, y: uy * low * weight, fits: true };
}
