import { capSweepEnds } from "./sweep-geometry.js?v=20260911-construction-v32";

// Duplicate only the UV boundary. Copy the already averaged normals and
// positions exactly, so neither the surface nor its highlight gains a seam.
export function unwrapMetalBand(THREE, geometry, columns, rows, uRepeats, vRepeats) {
  const stride = rows + 1;
  for (const [name, source] of Object.entries(geometry.attributes)) {
    const values = new source.array.constructor((columns + 1) * stride * source.itemSize);
    for (let i = 0; i <= columns; i++) for (let j = 0; j <= rows; j++) {
      const from = ((i % columns) * rows + j % rows) * source.itemSize;
      values.set(source.array.subarray(from, from + source.itemSize), (i * stride + j) * source.itemSize);
    }
    geometry.setAttribute(name, new THREE.BufferAttribute(values, source.itemSize, source.normalized));
  }
  // Whole repeat counts close the texture itself at the seam. Physical
  // repeat size stays near the requested finish scale, without a hard reset.
  const u = Math.max(1, Math.round(uRepeats)), v = Math.max(1, Math.round(vRepeats));
  for (let i = 0; i <= columns; i++) for (let j = 0; j <= rows; j++) {
    geometry.attributes.uv.setXY(i * stride + j, i / columns * u, j / rows * v);
  }
  const indices = [];
  for (let i = 0; i < columns; i++) for (let j = 0; j < rows; j++) {
    const a = i * stride + j, b = a + stride;
    indices.push(a, b, b + 1, a, b + 1, a + 1);
  }
  geometry.setIndex(indices);
  geometry.userData.metalSweep = { columns, rows, uRepeats: u, vRepeats: v };
  return geometry;
}

// Shoulders start on the actual shank mesh, including split/stacked/twisted
// profiles. Polar curves travel around its convex exterior, instead of
// cutting a straight chord through the finger opening.
export function createCathedralShoulders(THREE, shanks, G, state, material) {
  const group = new THREE.Group();
  group.name = "cathedral-shoulders";
  const radius = Math.min(.028 * G.W, G.bandWidth * .28);
  const ray = new THREE.Raycaster();
  const reach = G.bandOuterR + G.bandWidth * 3;
  ray.far = reach - G.bandMajorR;
  const offsets = state.band === "Bypass" ? [0]
    : state.silhouette === "Split Shank" ? [-.55, .55]
    : state.silhouette === "Stacked Double" ? [-.58, .58] : [0];
  shanks.forEach(object => object.updateWorldMatrix(true, true));
  for (const side of [-1, 1]) for (const offset of offsets) {
    let anchor, startAngle;
    // An open bypass may not cross the first ray. Search farther along its
    // shoulder until we reach existing metal; never invent a floating base.
    for (const delta of [.62, .72, .84, .98, 1.12]) {
      startAngle = Math.PI / 2 - side * delta;
      const z = offset * G.bandHeight + (state.band === "Twist" ? Math.sin(startAngle * 3) * .06 : 0);
      const outward = new THREE.Vector3(Math.cos(startAngle), Math.sin(startAngle), 0);
      ray.set(outward.clone().multiplyScalar(reach).setZ(z), outward.clone().negate());
      const hit = ray.intersectObjects(shanks, true)[0];
      if (hit) { anchor = hit.point.clone().addScaledVector(outward, radius * .55); break; }
    }
    if (!anchor) continue;
    const headZ = Math.max(-G.basketLowerR * G.prongScaleY * .65,
      Math.min(G.basketLowerR * G.prongScaleY * .65, offset * G.bandHeight));
    const headX = side * G.basketLowerR * Math.sqrt(1 - (headZ / (G.basketLowerR * G.prongScaleY)) ** 2);
    const end = new THREE.Vector3(headX, G.gemPos.y + G.basketLowerZ, headZ);
    const endAngle = Math.atan2(end.y, end.x);
    const startRadius = Math.hypot(anchor.x, anchor.y), endRadius = Math.hypot(end.x, end.y);
    const curve = new THREE.Curve();
    curve.getPoint = (t, target = new THREE.Vector3()) => {
      const angle = startAngle + (endAngle - startAngle) * t;
      const r = startRadius + (endRadius - startRadius) * t + Math.sin(Math.PI * t) * G.bandWidth * .45;
      return target.set(Math.cos(angle) * r, Math.sin(angle) * r, anchor.z + (end.z - anchor.z) * t);
    };
    const geometry = new THREE.TubeGeometry(curve, 40, radius, 20, false);
    capSweepEnds(THREE, geometry, 40, 20, true);
    const shoulder = new THREE.Mesh(geometry, material);
    shoulder.name = "cathedral-shoulder";
    shoulder.castShadow = true;
    shoulder.userData.construction = { role: "cathedral-shoulder", anchor: anchor.toArray(), end: end.toArray(), radius };
    group.add(shoulder);
  }
  return group;
}
