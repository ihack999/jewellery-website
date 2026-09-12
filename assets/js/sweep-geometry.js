export function capSweepEnds(THREE, geometry, axialSegments, radialSegments, repeatedSeam = false) {
  const stride = radialSegments + (repeatedSeam ? 1 : 0);
  if (!geometry.index || geometry.attributes.position.count !== (axialSegments + 1) * stride) throw new Error("Unexpected sweep topology.");
  if (!geometry.attributes.normal) geometry.computeVertexNormals();
  const positions = Array.from(geometry.attributes.position.array);
  const normals = Array.from(geometry.attributes.normal.array);
  const uvs = geometry.attributes.uv ? Array.from(geometry.attributes.uv.array) : Array(positions.length / 3 * 2).fill(0);
  const indices = Array.from(geometry.index.array);
  const pointAt = (index) => new THREE.Vector3().fromArray(positions, index * 3);
  const ringCenter = (row) => {
    const center = new THREE.Vector3();
    for (let corner = 0; corner < radialSegments; corner += 1) center.add(pointAt(row * stride + corner));
    return center.divideScalar(radialSegments);
  };
  for (const row of [0, axialSegments]) {
    const center = ringCenter(row);
    const neighbor = ringCenter(row === 0 ? 1 : axialSegments - 1);
    const first = pointAt(row * stride);
    const second = pointAt(row * stride + 1);
    const third = pointAt(row * stride + 2);
    const normal = new THREE.Vector3().crossVectors(second.clone().sub(first), third.clone().sub(first)).normalize();
    const reverse = normal.dot(center.clone().sub(neighbor)) < 0;
    if (reverse) normal.negate();
    const centerIndex = positions.length / 3;
    positions.push(...center.toArray());
    normals.push(...normal.toArray());
    uvs.push(0.5, 0.5);
    for (let corner = 0; corner < radialSegments; corner += 1) {
      positions.push(...pointAt(row * stride + corner).toArray());
      normals.push(...normal.toArray());
      const angle = corner / radialSegments * Math.PI * 2;
      uvs.push(0.5 + Math.cos(angle) * 0.5, 0.5 + Math.sin(angle) * 0.5);
      const current = centerIndex + 1 + corner;
      const next = centerIndex + 1 + (corner + 1) % radialSegments;
      indices.push(centerIndex, reverse ? next : current, reverse ? current : next);
    }
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.userData.endCaps = "planar";
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
