// Generated joint data only. This module never requests a camera or a model.
import * as THREE from "../assets/js/three.module.js";

export function handFixture({ pitch = 0, yaw = 0, roll = 0, bend = 0, shiftX = 0 } = {}) {
  const points = Array.from({ length: 21 }, () => new THREE.Vector3());
  for (const [base, x, y, length] of [
    [1, -.050, -.016, .030], [5, -.038, -.062, .040], [9, -.012, -.073, .045],
    [13, .013, -.067, .041], [17, .039, -.051, .034]
  ]) {
    points[base].set(x, y, 0);
    points[base + 1].set(x, y - length, 0);
    points[base + 2].set(x, y - length - .025 * Math.cos(bend), -.025 * Math.sin(bend));
    points[base + 3].set(x, y - length - .045 * Math.cos(bend), -.045 * Math.sin(bend));
  }
  const rotation = new THREE.Euler(pitch, yaw, roll);
  const world = points.map(point => point.applyEuler(rotation));
  const landmarks = world.map(point => ({ x: .5 + point.x * 3 + shiftX, y: .72 + point.y * 3, z: point.z * 3 }));
  return { landmarks: [landmarks], worldLandmarks: [world], handedness: [[{ categoryName: "Right", score: 1 }]] };
}
