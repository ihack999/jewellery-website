const dot = (first, second) => first.reduce((sum, value, axis) => sum + value * second[axis], 0);
const subtract = (first, second) => first.map((value, axis) => value - second[axis]);
const cross = (first, second) => [first[1] * second[2] - first[2] * second[1], first[2] * second[0] - first[0] * second[2], first[0] * second[1] - first[1] * second[0]];
const normalize = (vector) => { const length = Math.hypot(...vector); return vector.map((value) => value / Math.max(length, 1e-30)); };

export function gemstoneIors(referenceIor, dispersion = 0, strength = 1) {
  const coefficient = Math.max(0, dispersion * strength) / (1 / 0.4308 ** 2 - 1 / 0.6867 ** 2);
  const constant = referenceIor - coefficient / 0.5893 ** 2;
  return [0.65, 0.55, 0.46].map((wavelength) => Math.max(1.0001, constant + coefficient / wavelength ** 2));
}

export function fresnelDielectric(cosine, relativeIor) {
  if (Math.abs(relativeIor - 1) < 1e-12) return 0;
  const incidence = Math.max(0, Math.min(1, Math.abs(cosine)));
  const sinSquared = relativeIor ** 2 * (1 - incidence ** 2);
  if (sinSquared >= 1) return 1;
  const transmitted = Math.sqrt(1 - sinSquared);
  const parallel = (relativeIor * incidence - transmitted) / (relativeIor * incidence + transmitted);
  const perpendicular = (incidence - relativeIor * transmitted) / (incidence + relativeIor * transmitted);
  return Math.max(0, Math.min(1, (parallel ** 2 + perpendicular ** 2) * 0.5));
}

export function refractRay(direction, opposingNormal, relativeIor) {
  const cosine = dot(direction, opposingNormal);
  const discriminant = 1 - relativeIor ** 2 * (1 - cosine ** 2);
  if (discriminant < 0) return null;
  return normalize(direction.map((value, axis) => relativeIor * value - (relativeIor * cosine + Math.sqrt(discriminant)) * opposingNormal[axis]));
}

export function buildTriangleBvh(positions, indices = null, leafSize = 4) {
  if (!Number.isInteger(leafSize) || leafSize < 1 || leafSize > 16) throw new Error("BVH leaf size must be between 1 and 16.");
  const count = (indices ? indices.length : positions.length / 3) / 3;
  if (!Number.isInteger(count) || count < 1 || count > 20000) throw new Error("Unsupported gemstone triangle count.");
  const triangles = [];
  for (let triangle = 0; triangle < count; triangle += 1) {
    const vertices = [0, 1, 2].map((corner) => {
      const vertex = indices ? indices[triangle * 3 + corner] : triangle * 3 + corner;
      return Array.from(positions.slice(vertex * 3, vertex * 3 + 3));
    });
    if (vertices.some((vertex) => vertex.length !== 3 || vertex.some((value) => !Number.isFinite(value)))) throw new Error("Gemstone geometry has invalid positions.");
    const edgeFirst = subtract(vertices[1], vertices[0]);
    const edgeSecond = subtract(vertices[2], vertices[0]);
    if (Math.hypot(...cross(edgeFirst, edgeSecond)) < 1e-16) continue;
    triangles.push({ vertex: vertices[0], edgeFirst, edgeSecond,
      minimum: [0, 1, 2].map((axis) => Math.min(...vertices.map((vertex) => vertex[axis]))),
      maximum: [0, 1, 2].map((axis) => Math.max(...vertices.map((vertex) => vertex[axis]))),
      centroid: [0, 1, 2].map((axis) => vertices.reduce((sum, vertex) => sum + vertex[axis], 0) / 3) });
  }
  if (!triangles.length) throw new Error("Gemstone geometry has no usable triangles.");
  const nodes = [];
  const ordered = [];
  let maximumDepth = 0;
  const split = (subset, depth) => {
    maximumDepth = Math.max(maximumDepth, depth);
    const minimum = [0, 1, 2].map((axis) => Math.min(...subset.map((triangle) => triangle.minimum[axis])));
    const maximum = [0, 1, 2].map((axis) => Math.max(...subset.map((triangle) => triangle.maximum[axis])));
    const node = { minimum, maximum, start: 0, count: 0, left: -1, right: -1 };
    const nodeIndex = nodes.push(node) - 1;
    if (subset.length <= leafSize) {
      node.start = ordered.length;
      node.count = subset.length;
      ordered.push(...subset);
    } else {
      const extents = maximum.map((value, axis) => value - minimum[axis]);
      const axis = extents.indexOf(Math.max(...extents));
      subset.sort((first, second) => first.centroid[axis] - second.centroid[axis]);
      const middle = Math.floor(subset.length / 2);
      node.left = split(subset.slice(0, middle), depth + 1);
      node.right = split(subset.slice(middle), depth + 1);
    }
    return nodeIndex;
  };
  split(triangles, 0);
  const packedNodes = new Float32Array(nodes.length * 8);
  const packedTriangles = new Float32Array(ordered.length * 12);
  nodes.forEach((node, index) => packedNodes.set([...node.minimum, node.count ? -node.start - 1 : node.left, ...node.maximum, node.count || node.right], index * 8));
  ordered.forEach((triangle, index) => packedTriangles.set([...triangle.vertex, 0, ...triangle.edgeFirst, 0, ...triangle.edgeSecond, 0], index * 12));
  return { nodes, triangles: ordered, packedNodes, packedTriangles, maximumDepth };
}

export function intersectTriangleBvh(bvh, origin, direction, epsilon = 1e-7) {
  const stack = [0];
  let nearest = Infinity;
  let hit = null;
  const intersectsBox = (node) => {
    let minimum = epsilon;
    let maximum = nearest;
    for (let axis = 0; axis < 3; axis += 1) {
      if (Math.abs(direction[axis]) < 1e-20) {
        if (origin[axis] < node.minimum[axis] || origin[axis] > node.maximum[axis]) return false;
      } else {
        const first = (node.minimum[axis] - origin[axis]) / direction[axis];
        const second = (node.maximum[axis] - origin[axis]) / direction[axis];
        minimum = Math.max(minimum, Math.min(first, second));
        maximum = Math.min(maximum, Math.max(first, second));
        if (maximum < minimum) return false;
      }
    }
    return true;
  };
  while (stack.length) {
    const node = bvh.nodes[stack.pop()];
    if (!intersectsBox(node)) continue;
    if (!node.count) { stack.push(node.left, node.right); continue; }
    for (let index = node.start; index < node.start + node.count; index += 1) {
      const triangle = bvh.triangles[index];
      const determinantVector = cross(direction, triangle.edgeSecond);
      const determinant = dot(triangle.edgeFirst, determinantVector);
      if (Math.abs(determinant) < 1e-14) continue;
      const relative = subtract(origin, triangle.vertex);
      const firstWeight = dot(relative, determinantVector) / determinant;
      const crossRelative = cross(relative, triangle.edgeFirst);
      const secondWeight = dot(direction, crossRelative) / determinant;
      const distance = dot(triangle.edgeSecond, crossRelative) / determinant;
      if (firstWeight < -1e-7 || secondWeight < -1e-7 || firstWeight + secondWeight > 1 + 1e-7 || distance <= epsilon || distance >= nearest) continue;
      nearest = distance;
      hit = { distance, normal: normalize(cross(triangle.edgeFirst, triangle.edgeSecond)), triangle: index };
    }
  }
  return hit;
}

export function traceInternalRay(bvh, surface, normal, incident, { ior = 2.417, bounces = 12, attenuationColor = [1, 1, 1], attenuationDistance = Infinity, epsilon = 1e-6 } = {}) {
  const initialReflection = fresnelDielectric(-dot(incident, normal), 1 / ior);
  let direction = refractRay(incident, normal, 1 / ior);
  if (!direction) return { initialReflection: 1, exits: [], residual: [0, 0, 0], absorbed: [0, 0, 0] };
  let origin = surface.map((value, axis) => value + direction[axis] * epsilon * 4);
  let throughput = [1, 1, 1].map(() => 1 - initialReflection);
  const exits = [];
  const absorbed = [0, 0, 0];
  let totalDistance = 0;
  for (let bounce = 0; bounce < bounces; bounce += 1) {
    const hit = intersectTriangleBvh(bvh, origin, direction, epsilon);
    if (!hit) break;
    totalDistance += hit.distance;
    const attenuation = attenuationColor.map((value) => Number.isFinite(attenuationDistance) ? Math.pow(Math.max(1e-6, Math.min(1, value)), hit.distance / Math.max(epsilon, attenuationDistance)) : 1);
    absorbed.forEach((value, axis) => { absorbed[axis] = value + throughput[axis] * (1 - attenuation[axis]); });
    throughput = throughput.map((value, axis) => value * attenuation[axis]);
    const point = origin.map((value, axis) => value + direction[axis] * hit.distance);
    const outward = refractRay(direction, hit.normal.map((value) => -value), ior);
    const reflectance = fresnelDielectric(dot(direction, hit.normal), ior);
    if (outward) exits.push({ point, direction: outward, weight: throughput.map((value) => value * (1 - reflectance)), distance: totalDistance, bounce });
    throughput = throughput.map((value) => value * reflectance);
    if (Math.max(...throughput) < 1e-5) break;
    const projection = dot(direction, hit.normal);
    direction = normalize(direction.map((value, axis) => value - 2 * projection * hit.normal[axis]));
    origin = point.map((value, axis) => value + direction[axis] * epsilon * 4);
  }
  return { initialReflection, exits, residual: throughput, absorbed };
}
