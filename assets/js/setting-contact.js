import { buildTriangleBvh, intersectTriangleBvh } from "./gem-ray-kernel.js?v=20260911-construction-v32";

export function createGemCollider(THREE, mesh) {
  mesh.updateWorldMatrix(true, false);
  const attribute = mesh.geometry.attributes.position;
  const positions = new Float64Array(attribute.count * 3);
  const point = new THREE.Vector3();
  for (let index = 0; index < attribute.count; index += 1) point.fromBufferAttribute(attribute, index).applyMatrix4(mesh.matrixWorld).toArray(positions, index * 3);
  let indices = mesh.geometry.index?.array.slice();
  if (mesh.matrixWorld.determinant() < 0) {
    indices ||= Uint32Array.from({ length: attribute.count }, (_, index) => index);
    for (let index = 0; index < indices.length; index += 3) [indices[index + 1], indices[index + 2]] = [indices[index + 2], indices[index + 1]];
  }
  const bvh = buildTriangleBvh(positions, indices);
  const triangle = new THREE.Triangle();
  const nearest = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const query = new THREE.Vector3();
  const boxDistance = (node, value) => ["x", "y", "z"].reduce((sum, axis, index) => sum + Math.max(node.minimum[index] - value[axis], 0, value[axis] - node.maximum[index]) ** 2, 0);
  return {
    bvh,
    mesh,
    distanceTo(point) {
      query.copy(point);
      let squared = Infinity;
      const closest = new THREE.Vector3();
      const closestNormal = new THREE.Vector3();
      const stack = [0];
      while (stack.length) {
        const node = bvh.nodes[stack.pop()];
        if (boxDistance(node, query) > squared) continue;
        if (!node.count) { stack.push(node.left, node.right); continue; }
        for (let index = node.start; index < node.start + node.count; index += 1) {
          const face = bvh.triangles[index];
          triangle.a.fromArray(face.vertex);
          triangle.b.fromArray(face.edgeFirst).add(triangle.a);
          triangle.c.fromArray(face.edgeSecond).add(triangle.a);
          triangle.closestPointToPoint(query, nearest);
          const candidate = query.distanceToSquared(nearest);
          if (candidate < squared) {
            squared = candidate;
            closest.copy(nearest);
            triangle.getNormal(normal);
            closestNormal.copy(normal);
          }
        }
      }
      const probe = [0.811107, 0.324443, 0.486664];
      const hit = intersectTriangleBvh(bvh, query.toArray(), probe, 1e-9);
      const inside = hit && hit.normal.reduce((sum, value, axis) => sum + value * probe[axis], 0) > 0;
      const distance = Math.sqrt(squared) * (inside ? -1 : 1);
      const direction = Math.abs(distance) > 1e-9 ? query.clone().sub(closest).multiplyScalar(1 / distance) : closestNormal;
      return { distance, point: closest, direction };
    },
    nearBounds(minimum, maximum, margin = 0) {
      return [0, 1, 2].every((axis) => bvh.nodes[0].minimum[axis] <= maximum[axis] + margin && bvh.nodes[0].maximum[axis] >= minimum[axis] - margin);
    }
  };
}

export function projectClearance(point, radius, colliders, margin, directions = null) {
  const result = point.clone();
  for (let iteration = 0; iteration < 12; iteration += 1) {
    let corrected = false;
    for (const [index, collider] of colliders.entries()) {
      const contact = collider.distanceTo(result);
      const overlap = radius + margin - contact.distance;
      if (overlap > 1e-7) {
        if (directions) {
          const direction = directions[index];
          let lower = 0;
          let upper = Math.max(overlap, margin);
          for (let bracket = 0; bracket < 12 && collider.distanceTo(result.clone().addScaledVector(direction, upper)).distance < radius + margin; bracket += 1) upper *= 2;
          for (let search = 0; search < 16; search += 1) {
            const middle = (lower + upper) / 2;
            if (collider.distanceTo(result.clone().addScaledVector(direction, middle)).distance < radius + margin) lower = middle;
            else upper = middle;
          }
          result.addScaledVector(direction, upper + 1e-7);
        } else result.addScaledVector(contact.direction, overlap + 1e-7);
        corrected = true;
      }
    }
    if (!corrected) break;
  }
  return result;
}

export function countMeshGemIntersections(THREE, mesh, colliders) {
  const own = createGemCollider(THREE, mesh);
  const relevant = colliders.filter((collider) => collider.nearBounds(own.bvh.nodes[0].minimum, own.bvh.nodes[0].maximum));
  let intersections = 0;
  const point = new THREE.Vector3();
  const edgesCross = (source, target) => {
    for (const face of source.triangles) {
      const vertices = [face.vertex, face.vertex.map((value, axis) => value + face.edgeFirst[axis]), face.vertex.map((value, axis) => value + face.edgeSecond[axis])];
      for (let edge = 0; edge < 3; edge += 1) {
        const start = vertices[edge];
        const end = vertices[(edge + 1) % 3];
        const direction = end.map((value, axis) => value - start[axis]);
        const length = Math.hypot(...direction);
        if (length < 1e-10) continue;
        const hit = intersectTriangleBvh(target, start, direction.map((value) => value / length), 1e-8);
        if (hit && hit.distance < length - 1e-8) return true;
      }
    }
    return false;
  };
  for (const collider of relevant) {
    const inside = own.bvh.triangles.some((face) => collider.distanceTo(point.fromArray(face.vertex)).distance < -1e-7);
    const enclosesGem = own.distanceTo(point.fromArray(collider.bvh.triangles[0].vertex)).distance < -1e-7;
    if (inside || enclosesGem || edgesCross(own.bvh, collider.bvh) || edgesCross(collider.bvh, own.bvh)) intersections += 1;
  }
  return intersections;
}

export function fitProngsToGems(THREE, piece, unitsPerMm) {
  piece.updateMatrixWorld(true);
  const gems = [];
  const hardware = [];
  piece.traverse((mesh) => {
    if (mesh.isMesh && mesh.geometry?.userData.kind === "gemstone") gems.push(mesh);
    if (mesh.isMesh && mesh.userData.isProng) hardware.push(mesh);
  });
  const report = { schema: "tjc.prong-clearance.v1", units: "mm", coordinateSpace: "piece-build", testedProngs: 0, adjustedProngs: 0, remainingIntersections: 0, clearanceMm: 0.025, productionValidated: false, components: [] };
  const margin = report.clearanceMm * unitsPerMm;
  const gemBounds = hardware.length ? gems.map((mesh) => ({ mesh, box: new THREE.Box3().setFromObject(mesh), collider: null })) : [];
  const obsolete = new Set();
  for (const mesh of hardware) {
    const box = new THREE.Box3().setFromObject(mesh);
    const neighborhood = box.clone().expandByScalar(unitsPerMm * 1.5);
    const relevant = gemBounds.filter((entry) => entry.box.intersectsBox(neighborhood)).map((entry) => entry.collider ||= createGemCollider(THREE, entry.mesh));
    if (!relevant.length) continue;
    report.testedProngs += 1;
    const inverse = mesh.matrixWorld.clone().invert();
    const source = mesh.geometry;
    const geometry = source.clone();
    const attribute = geometry.attributes.position;
    const point = new THREE.Vector3();
    const sweep = source.userData.contactSweep;
    let changed = false;
    const directions = relevant.map((collider) => {
      const center = box.getCenter(new THREE.Vector3()).applyMatrix4(collider.mesh.matrixWorld.clone().invert());
      center.z = 0;
      if (center.lengthSq() < 1e-12) center.x = 1;
      return center.normalize().transformDirection(collider.mesh.matrixWorld);
    });
    if (sweep) {
      const shifts = [];
      const stride = sweep.radial + (sweep.repeatedSeam ? 1 : 0);
      for (let row = 0; row <= sweep.axial; row += 1) {
        const center = new THREE.Vector3();
        for (let corner = 0; corner < sweep.radial; corner += 1) center.add(point.fromBufferAttribute(attribute, row * stride + corner));
        center.divideScalar(sweep.radial);
        const worldCenter = center.clone().applyMatrix4(mesh.matrixWorld);
        let radius = 0;
        for (let corner = 0; corner < sweep.radial; corner += 1) radius = Math.max(radius, point.fromBufferAttribute(attribute, row * stride + corner).applyMatrix4(mesh.matrixWorld).distanceTo(worldCenter));
        const target = projectClearance(worldCenter, radius, relevant, margin, directions).applyMatrix4(inverse);
        const shift = target.sub(center);
        shifts.push(shift);
        if (shift.lengthSq() > 1e-14) changed = true;
        for (let corner = 0; corner < stride; corner += 1) {
          const index = row * stride + corner;
          point.fromBufferAttribute(attribute, index).add(shift);
          attribute.setXYZ(index, point.x, point.y, point.z);
        }
      }
      const start = (sweep.axial + 1) * stride;
      for (let cap = 0; cap < 2; cap += 1) for (let corner = 0; corner <= sweep.radial; corner += 1) {
        const index = start + cap * (sweep.radial + 1) + corner;
        point.fromBufferAttribute(attribute, index).add(shifts[cap === 0 ? 0 : sweep.axial]);
        attribute.setXYZ(index, point.x, point.y, point.z);
      }
    } else {
      geometry.computeBoundingSphere();
      const sphere = geometry.boundingSphere.clone().applyMatrix4(mesh.matrixWorld);
      const displacement = projectClearance(sphere.center, sphere.radius, relevant, margin, directions).sub(sphere.center);
      if (displacement.lengthSq() > 1e-14) {
        changed = true;
        for (let index = 0; index < attribute.count; index += 1) {
          point.fromBufferAttribute(attribute, index).applyMatrix4(mesh.matrixWorld).add(displacement).applyMatrix4(inverse);
          attribute.setXYZ(index, point.x, point.y, point.z);
        }
      }
    }
    if (changed) {
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      mesh.geometry = geometry;
      obsolete.add(source);
      report.adjustedProngs += 1;
    } else geometry.dispose();
    const fittedBounds = new THREE.Box3().setFromObject(mesh);
    const finalNeighbors = gemBounds.filter((entry) => entry.box.intersectsBox(fittedBounds)).map((entry) => entry.collider ||= createGemCollider(THREE, entry.mesh));
    const remaining = countMeshGemIntersections(THREE, mesh, finalNeighbors);
    mesh.userData.gemContact = { checked: true, intersections: remaining, clearanceMm: report.clearanceMm };
    report.components.push({ role: mesh.userData.manufacturing?.role || (sweep ? "prong-post" : "claw-or-bead"), intersections: remaining, adjusted: changed, bounds: { min: fittedBounds.min.divideScalar(unitsPerMm).toArray(), max: fittedBounds.max.divideScalar(unitsPerMm).toArray() } });
    report.remainingIntersections += remaining;
  }
  piece.traverse((mesh) => obsolete.delete(mesh.geometry));
  obsolete.forEach((geometry) => geometry.dispose());
  piece.userData.prongClearance = report;
  return report;
}
