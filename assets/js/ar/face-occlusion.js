import * as THREE from "../three.module.js";

export const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

export function createFaceOccluder() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array((FACE_OVAL.length + 1) * 3), 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setIndex(FACE_OVAL.flatMap((_, index) => [0, index + 1, (index + 1) % FACE_OVAL.length + 1]));
  const material = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, side: THREE.DoubleSide });
  const openings = { centers: [new THREE.Vector3(), new THREE.Vector3()], active: [0, 0] };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.arEarCenters = { value: openings.centers };
    shader.uniforms.arEarActive = { value: openings.active };
    shader.vertexShader = "varying vec3 arFacePosition;\n" + shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\narFacePosition = position;");
    shader.fragmentShader = "varying vec3 arFacePosition;\nuniform vec3 arEarCenters[2];\nuniform float arEarActive[2];\n" + shader.fragmentShader.replace("#include <clipping_planes_fragment>", `#include <clipping_planes_fragment>
      for (int earIndex = 0; earIndex < 2; earIndex++) {
        vec2 lobeDistance = (arFacePosition.xy - arEarCenters[earIndex].xy) / vec2(0.007, 0.009);
        if (arEarActive[earIndex] > 0.5 && dot(lobeDistance, lobeDistance) < 1.0) discard;
      }`);
  };
  material.customProgramCacheKey = () => "face-depth-local-lobes-v1";
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData.earOpenings = openings;
  mesh.name = "tracked-face-depth-surface";
  mesh.renderOrder = -100;
  mesh.frustumCulled = false;
  mesh.visible = false;
  return mesh;
}

export function updateFaceOccluder(mesh, landmarks, toLocal, alpha = 1) {
  if (!mesh) return false;
  const points = [1, ...FACE_OVAL].map((index) => landmarks?.[index]);
  if (!points.every((point) => point && [point.x, point.y, point.z].every(Number.isFinite))) {
    mesh.visible = false;
    return false;
  }
  const local = points.map(toLocal);
  if (!local.every((point) => point.toArray().every(Number.isFinite) && point.length() < 0.3)
    || local[1].distanceTo(local[19]) < 0.08) {
    mesh.visible = false;
    return false;
  }
  const positions = mesh.geometry.attributes.position;
  const blend = mesh.visible ? Math.max(0, Math.min(1, alpha)) : 1;
  local.forEach((point, index) => {
    positions.setXYZ(index,
      positions.getX(index) + (point.x - positions.getX(index)) * blend,
      positions.getY(index) + (point.y - positions.getY(index)) * blend,
      positions.getZ(index) + (point.z - positions.getZ(index)) * blend);
  });
  positions.needsUpdate = true;
  mesh.visible = true;
  return true;
}

export function earFacingVisible(facing, previouslyVisible = false) {
  return Number.isFinite(facing) && facing > (previouslyVisible ? -0.02 : 0.06);
}

export function updateEarOpenings(mesh, anchors, visibility) {
  const openings = mesh?.userData.earOpenings;
  if (!openings) return;
  ["Left", "Right"].forEach((side, index) => {
    openings.active[index] = anchors[side] && visibility[side] ? 1 : 0;
    if (anchors[side]) openings.centers[index].copy(anchors[side]);
  });
}
