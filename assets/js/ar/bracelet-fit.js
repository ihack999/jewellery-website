import * as THREE from "../three.module.js";
import { createBraceletWearPath } from "./wearable-paths.js?v=20260911-ar-live3";

export function createBraceletFitter(piece) {
  const profile = piece.userData.wearableBracelet;
  if (!profile?.flexible || !profile.wristWidthMm) return null;
  const original = createBraceletWearPath(THREE, profile.lengthMm, profile.wristWidthMm);
  const samples = Array.from({ length: 512 }, (_, index) => original.point(index / 512 * original.length));
  const bindings = [];
  const matrix = new THREE.Matrix4();
  const point = new THREE.Vector3();
  for (const node of piece.children) {
    node.updateMatrix();
    const count = node.isInstancedMesh ? node.count : 1;
    for (let index = 0; index < count; index += 1) {
      if (node.isInstancedMesh) node.getMatrixAt(index, matrix);
      else matrix.copy(node.matrix);
      point.setFromMatrixPosition(matrix);
      let nearest = 0;
      let distance = Infinity;
      samples.forEach((sample, sampleIndex) => {
        const squared = (sample.x - point.x) ** 2 + (sample.y - point.y) ** 2;
        if (squared < distance) { distance = squared; nearest = sampleIndex; }
      });
      const fraction = nearest / samples.length;
      const tangent = original.tangent(fraction * original.length);
      bindings.push({ node, index, fraction, matrix: matrix.clone(), point: samples[nearest], angle: Math.atan2(tangent.y, tangent.x) });
    }
  }
  return (widthMm) => {
    const path = createBraceletWearPath(THREE, profile.lengthMm, widthMm);
    const before = new THREE.Matrix4();
    const after = new THREE.Matrix4();
    const rotation = new THREE.Matrix4();
    for (const binding of bindings) {
      const position = path.point(binding.fraction * path.length);
      const tangent = path.tangent(binding.fraction * path.length);
      before.makeTranslation(-binding.point.x, -binding.point.y, 0);
      rotation.makeRotationZ(Math.atan2(tangent.y, tangent.x) - binding.angle);
      after.makeTranslation(position.x, position.y, 0);
      matrix.copy(after).multiply(rotation).multiply(before).multiply(binding.matrix);
      if (binding.node.isInstancedMesh) {
        binding.node.setMatrixAt(binding.index, matrix);
        binding.node.instanceMatrix.needsUpdate = true;
        binding.node.frustumCulled = false;
      } else matrix.decompose(binding.node.position, binding.node.quaternion, binding.node.scale);
    }
    profile.wristWidthMm = widthMm;
    profile.fits = path.fits;
    return path.fits;
  };
}
