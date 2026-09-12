import * as THREE from "../three.module.js";

export class WearableArticulation {
  constructor(root) {
    this.root = root;
    this.joints = [];
    this.gravity = new THREE.Vector3();
    this.orientation = new THREE.Quaternion();
    this.axis = new THREE.Vector3(0, 0, 1);
    this.accumulator = 0;
    root.traverse((node) => {
      if (node.userData.wearableHinge) this.joints.push({ node, rest: node.quaternion.clone(), angle: 0, velocity: 0 });
    });
  }

  reset() {
    this.accumulator = 0;
    for (const joint of this.joints) {
      joint.angle = 0;
      joint.velocity = 0;
      joint.node.quaternion.copy(joint.rest);
    }
  }

  update(delta, enabled = true) {
    if (!enabled) { this.reset(); return; }
    this.accumulator = Math.min(4 / 120, this.accumulator + Math.max(0, delta));
    this.root.updateWorldMatrix(true, true);
    while (this.accumulator >= 1 / 120) {
      for (const joint of this.joints) {
        joint.node.parent.getWorldQuaternion(this.orientation).invert();
        this.gravity.set(0, -1, 0).applyQuaternion(this.orientation);
        const limit = joint.node.userData.wearableHinge.limit;
        const target = Math.max(-limit, Math.min(limit, Math.atan2(this.gravity.x, -this.gravity.y)));
        joint.velocity += ((target - joint.angle) * 80 - joint.velocity * 16) / 120;
        joint.angle = Math.max(-limit, Math.min(limit, joint.angle + joint.velocity / 120));
        joint.node.quaternion.copy(joint.rest).multiply(this.orientation.setFromAxisAngle(this.axis, joint.angle));
      }
      this.accumulator -= 1 / 120;
    }
  }
}
