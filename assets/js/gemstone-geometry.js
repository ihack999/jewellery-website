import { solveGemstoneCut } from "./gemstone-cut.js?v=20260911-construction-v32";
import { createSeededRandom } from "./design-session.js?v=20260911-construction-v32";

const geometryCache = new Map();
const outlineCache = new Map();
const epsilon = 1e-8;
const dot = (first, second) => first.reduce((sum, value, axis) => sum + value * second[axis], 0);
const subtract = (first, second) => first.map((value, axis) => value - second[axis]);
const cross = (first, second) => [first[1] * second[2] - first[2] * second[1], first[2] * second[0] - first[0] * second[2], first[0] * second[1] - first[1] * second[0]];
const normalize = (vector) => { const length = Math.hypot(...vector); return vector.map((value) => value / length); };
const pointKey = (point) => point.map((value) => Math.round(value / epsilon)).join(",");
const mean = (points) => [0, 1, 2].map((axis) => points.reduce((sum, point) => sum + point[axis], 0) / points.length);

function orderedPolygon(points, normal) {
  const unique = [...new Map(points.map((point) => [pointKey(point), point])).values()];
  if (unique.length < 3) return [];
  const center = mean(unique);
  const tangent = normalize(cross(Math.abs(normal[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0], normal));
  const bitangent = cross(normal, tangent);
  return unique.sort((first, second) => {
    const relativeFirst = subtract(first, center);
    const relativeSecond = subtract(second, center);
    return Math.atan2(dot(relativeFirst, bitangent), dot(relativeFirst, tangent))
      - Math.atan2(dot(relativeSecond, bitangent), dot(relativeSecond, tangent));
  });
}

function clipPolyhedron(faces, plane) {
  const clipped = [];
  const intersections = [];
  for (const face of faces) {
    const points = [];
    for (let index = 0; index < face.points.length; index += 1) {
      const start = face.points[index];
      const end = face.points[(index + 1) % face.points.length];
      const startDistance = dot(plane.normal, start) - plane.offset;
      const endDistance = dot(plane.normal, end) - plane.offset;
      const startInside = startDistance <= epsilon;
      const endInside = endDistance <= epsilon;
      if (startInside) points.push(start);
      if (startInside !== endInside) {
        const fraction = startDistance / (startDistance - endDistance);
        const point = start.map((value, axis) => value + fraction * (end[axis] - value));
        points.push(point);
        intersections.push(point);
      }
    }
    const unique = [...new Map(points.map((point) => [pointKey(point), point])).values()];
    if (unique.length >= 3) clipped.push({ ...face, points: unique });
  }
  const cap = orderedPolygon(intersections, plane.normal);
  if (cap.length >= 3) clipped.push({ ...plane, points: cap });
  return clipped;
}

function boxFaces(halfWidth, halfLength, top, bottom) {
  const faces = [];
  for (let axis = 0; axis < 3; axis += 1) {
    for (const sign of [-1, 1]) {
      const normal = [0, 0, 0];
      normal[axis] = sign;
      const points = [];
      const remaining = [0, 1, 2].filter((value) => value !== axis);
      const limits = [[-halfWidth, halfWidth], [-halfLength, halfLength], [-bottom, top]];
      for (const firstSide of [0, 1]) {
        for (const secondSide of [0, 1]) {
          const point = [0, 0, 0];
          point[axis] = limits[axis][sign === 1 ? 1 : 0];
          point[remaining[0]] = limits[remaining[0]][firstSide];
          point[remaining[1]] = limits[remaining[1]][secondSide];
          points.push(point);
        }
      }
      faces.push({ normal, offset: sign * points[0][axis], name: axis === 2 ? (sign === 1 ? "table" : "culet") : "girdle", points: orderedPolygon(points, normal) });
    }
  }
  return faces;
}

function rawOutline(shape, angle) {
  const horizontal = Math.cos(angle);
  const vertical = Math.sin(angle);
  if (shape === "Cushion") return [Math.sign(horizontal) * Math.sqrt(Math.abs(horizontal)), Math.sign(vertical) * Math.sqrt(Math.abs(vertical))];
  if (shape === "Pear") return [horizontal * (1 - 0.32 * vertical), vertical];
  if (shape === "Marquise") return [horizontal * 0.65, vertical * (1 - Math.abs(horizontal) * 0.35)];
  return [horizontal, vertical];
}

export function gemstoneOutline(shape, widthMm = 2, lengthMm = 2) {
  const key = `${shape}:${widthMm}:${lengthMm}`;
  if (outlineCache.has(key)) return outlineCache.get(key);
  let outline;
  if (["Emerald", "Asscher", "Baguette", "Princess"].includes(shape)) {
    const corner = shape === "Princess" ? 0.018 : shape === "Baguette" ? 0.06 : 0.23;
    outline = [[1, 1 - corner], [1 - corner, 1], [-1 + corner, 1], [-1, 1 - corner], [-1, -1 + corner], [-1 + corner, -1], [1 - corner, -1], [1, -1 + corner]];
  } else if (shape === "Trillion") {
    outline = [[0, 1], [-1, -1], [1, -1]];
  } else if (shape === "Hexagon") {
    outline = [[0, 1], [-1, 0.5], [-1, -0.5], [0, -1], [1, -0.5], [1, 0.5]];
  } else if (shape === "Kite") {
    outline = [[0, 1], [-1, 0.15], [0, -1], [1, 0.15]];
  } else if (shape === "Heart") {
    outline = Array.from({ length: 32 }, (_, index) => {
      const angle = -index * Math.PI / 16;
      return [16 * Math.sin(angle) ** 3, 13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle)];
    });
  } else {
    outline = Array.from({ length: 64 }, (_, index) => rawOutline(shape, index * Math.PI / 32));
  }
  const minimum = [0, 1].map((axis) => Math.min(...outline.map((point) => point[axis])));
  const maximum = [0, 1].map((axis) => Math.max(...outline.map((point) => point[axis])));
  const result = outline.map((point) => Object.freeze(point.map((value, axis) => ((value - minimum[axis]) / (maximum[axis] - minimum[axis]) - 0.5) * [widthMm, lengthMm][axis])));
  if (outlineCache.size >= 96) outlineCache.delete(outlineCache.keys().next().value);
  outlineCache.set(key, Object.freeze(result));
  return result;
}

export function gemstoneOutlinePoint(shape, angle, width = 2, length = 2) {
  const outline = gemstoneOutline(shape, width, length);
  const direction = [Math.cos(angle), Math.sin(angle)];
  let distance = Infinity;
  for (let index = 0; index < outline.length; index += 1) {
    const start = outline[index];
    const end = outline[(index + 1) % outline.length];
    const edge = [end[0] - start[0], end[1] - start[1]];
    const denominator = direction[0] * edge[1] - direction[1] * edge[0];
    if (Math.abs(denominator) < epsilon) continue;
    const along = (start[0] * edge[1] - start[1] * edge[0]) / denominator;
    const across = (start[0] * direction[1] - start[1] * direction[0]) / denominator;
    if (along >= 0 && across >= -epsilon && across <= 1 + epsilon) distance = Math.min(distance, along);
  }
  return direction.map((value) => value * (Number.isFinite(distance) ? distance : width * 0.5));
}

function triangulateConcaveCap(points) {
  const remaining = points.map((_, index) => index);
  const triangles = [];
  const area = (first, second, third) => (second[0] - first[0]) * (third[1] - first[1]) - (second[1] - first[1]) * (third[0] - first[0]);
  while (remaining.length > 3) {
    const ear = remaining.findIndex((current, index) => {
      const previous = remaining[(index + remaining.length - 1) % remaining.length];
      const next = remaining[(index + 1) % remaining.length];
      if (area(points[previous], points[current], points[next]) <= 1e-14) return false;
      return !remaining.some((candidate) => candidate !== previous && candidate !== current && candidate !== next
        && area(points[previous], points[current], points[candidate]) >= -1e-14
        && area(points[current], points[next], points[candidate]) >= -1e-14
        && area(points[next], points[previous], points[candidate]) >= -1e-14);
    });
    if (ear < 0) throw new Error("The concave cut cap could not be triangulated.");
    triangles.push([remaining[(ear + remaining.length - 1) % remaining.length], remaining[ear], remaining[(ear + 1) % remaining.length]].map((index) => points[index]));
    remaining.splice(ear, 1);
  }
  triangles.push(remaining.map((index) => points[index]));
  return triangles;
}

function heartFaces(stone, solution, outline) {
  const halfGirdle = solution.girdleThicknessMm / 2;
  const rings = [
    [stone.tablePct / 100, halfGirdle + solution.crownHeightMm],
    [(1 + stone.tablePct / 100) / 2, halfGirdle + solution.crownHeightMm * 0.65],
    [1, halfGirdle], [1, -halfGirdle],
    [0.45 + stone.culetPct / 100 * 0.55, -halfGirdle - solution.pavilionHeightMm * 0.7],
    [stone.culetPct / 100, -halfGirdle - solution.pavilionHeightMm]
  ].map(([ratio, height]) => outline.map(([horizontal, vertical]) => [horizontal * ratio, vertical * ratio, height]));
  const faces = [];
  const addFace = (points, name) => {
    const unique = [...new Map(points.map((point) => [pointKey(point), point])).values()];
    if (unique.length < 3) return;
    const normal = normalize(cross(subtract(unique[1], unique[0]), subtract(unique[2], unique[0])));
    faces.push({ points: unique, normal, offset: dot(normal, unique[0]), name });
  };
  for (const triangle of triangulateConcaveCap(rings[0])) addFace(triangle, "table");
  for (let tier = 0; tier < rings.length - 1; tier += 1) {
    for (let index = 0; index < outline.length; index += 1) {
      const next = (index + 1) % outline.length;
      addFace([rings[tier][index], rings[tier + 1][index], rings[tier + 1][next], rings[tier][next]], tier === 2 ? "girdle" : tier < 2 ? `crown-tier-${tier + 1}` : `pavilion-tier-${tier - 2}`);
    }
  }
  if (stone.culetPct > 0) {
    for (const triangle of triangulateConcaveCap(rings.at(-1))) addFace([...triangle].reverse(), "culet");
  }
  return faces;
}

export function buildGemstoneMesh(stone) {
  const solution = stone.cutSolution || solveGemstoneCut(stone);
  const key = JSON.stringify([stone.shape, stone.widthMm, stone.lengthMm, stone.tablePct, stone.culetPct, stone.symmetryMode, stone.seed, stone.outlinePointsMm, solution]);
  if (geometryCache.has(key)) return geometryCache.get(key);
  const outline = stone.outlinePointsMm || gemstoneOutline(stone.shape, stone.widthMm, stone.lengthMm);
  const halfGirdle = solution.girdleThicknessMm * 0.5;
  const top = halfGirdle + solution.crownHeightMm;
  const bottom = halfGirdle + solution.pavilionHeightMm;
  const tableRatio = stone.tablePct / 100;
  const culetRatio = stone.culetPct / 100;
  const planes = [];
  const random = createSeededRandom(`${stone.seed || "atelier-001"}:${stone.shape}:facets`);
  const addPlane = (normal, offset, name) => {
    const magnitude = Math.hypot(...normal);
    planes.push({ normal: normal.map((value) => value / magnitude), offset: offset / magnitude, name });
  };
  const support = (normal) => Math.max(...outline.map((point) => point[0] * normal[0] + point[1] * normal[1]));
  const edgeNormals = outline.map((point, index) => {
    const next = outline[(index + 1) % outline.length];
    const normal = normalize([next[1] - point[1], point[0] - next[0], 0]);
    addPlane(normal, dot(normal, [...point, 0]), "girdle");
    return normal;
  });
  const addSlopedPlane = (normal, innerRatio, innerHeight, outerRatio, outerHeight, lower, name) => {
    const radius = support(normal);
    const slope = (innerHeight - outerHeight) / ((outerRatio - innerRatio) * radius);
    addPlane([normal[0] * slope, normal[1] * slope, lower ? -1 : 1], outerHeight + slope * outerRatio * radius, name);
  };

  if (["Emerald", "Asscher", "Baguette"].includes(stone.shape)) {
    const crownRings = [tableRatio, tableRatio + (1 - tableRatio) * 0.3, tableRatio + (1 - tableRatio) * 0.64, 1];
    const crownHeights = [1, 0.84, 0.49, 0].map((fraction) => halfGirdle + solution.crownHeightMm * fraction);
    const pavilionRings = [culetRatio, 0.35 + culetRatio * 0.65, 0.66 + culetRatio * 0.34, 1];
    const pavilionHeights = [1, 0.76, 0.45, 0].map((fraction) => halfGirdle + solution.pavilionHeightMm * fraction);
    for (const normal of edgeNormals) {
      for (let tier = 0; tier < 3; tier += 1) {
        addSlopedPlane(normal, crownRings[tier], crownHeights[tier], crownRings[tier + 1], crownHeights[tier + 1], false, `crown-step-${tier + 1}`);
        addSlopedPlane(normal, pavilionRings[tier], pavilionHeights[tier], pavilionRings[tier + 1], pavilionHeights[tier + 1], true, `pavilion-step-${tier + 1}`);
      }
    }
  } else {
    const count = stone.shape === "Princess" ? 4 : stone.shape === "Trillion" ? 3 : stone.shape === "Hexagon" ? 6 : stone.shape === "Kite" ? 4 : 8;
    for (let index = 0; index < count; index += 1) {
      const angle = index * Math.PI * 2 / count;
      const normal = [Math.cos(angle), Math.sin(angle), 0];
      const variation = stone.symmetryMode === "Antique" ? 1 + (random() - 0.5) * 0.008 : 1;
      addSlopedPlane(normal, tableRatio, halfGirdle + solution.crownHeightMm * variation, 1, halfGirdle, false, "crown-main");
      addSlopedPlane(normal, culetRatio, bottom, 1, halfGirdle, true, "pavilion-main");
      const starAngle = angle + Math.PI / count;
      const starNormal = [Math.cos(starAngle), Math.sin(starAngle), 0];
      const starSupport = support(starNormal);
      const starSlope = solution.crownHeightMm * 0.65 / ((1 - tableRatio) * starSupport);
      addPlane([starNormal[0] * starSlope, starNormal[1] * starSlope, 1], top + starSlope * tableRatio * starSupport * Math.cos(Math.PI / count), "star");
      for (const side of [-1, 1]) {
        const halfAngle = angle + side * Math.PI / (count * 2);
        const halfNormal = [Math.cos(halfAngle), Math.sin(halfAngle), 0];
        addSlopedPlane(halfNormal, tableRatio, halfGirdle + solution.crownHeightMm * 1.35, 1, halfGirdle, false, "upper-half");
        addSlopedPlane(halfNormal, culetRatio, halfGirdle + solution.pavilionHeightMm * 1.09, 1, halfGirdle, true, "lower-half");
      }
    }
  }

  let faces = stone.shape === "Heart" ? heartFaces(stone, solution, outline) : boxFaces(stone.widthMm, stone.lengthMm, top, bottom);
  if (stone.shape !== "Heart") for (const plane of planes) faces = clipPolyhedron(faces, plane);
  const positions = [];
  const normals = [];
  const facets = [];
  for (const face of faces) {
    const center = mean(face.points);
    const firstTriangle = positions.length / 9;
    for (let index = 0; index < face.points.length; index += 1) {
      const first = face.points[index];
      const second = face.points[(index + 1) % face.points.length];
      if (Math.hypot(...cross(subtract(first, center), subtract(second, center))) < 1e-12) continue;
      positions.push(...center, ...first, ...second);
      normals.push(...face.normal, ...face.normal, ...face.normal);
    }
    facets.push({ name: face.name, normal: face.normal, offsetMm: face.offset, firstTriangle, triangleCount: positions.length / 9 - firstTriangle });
  }
  const bounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  for (let offset = 0; offset < positions.length; offset += 3) {
    for (let axis = 0; axis < 3; axis += 1) {
      bounds.min[axis] = Math.min(bounds.min[axis], positions[offset + axis]);
      bounds.max[axis] = Math.max(bounds.max[axis], positions[offset + axis]);
    }
  }
  const result = { positions, normals, facets, bounds, solution, recipe: stone.shape === "Heart" ? "heart-concave-tiers.v3" : `${["Emerald", "Asscher", "Baguette"].includes(stone.shape) ? "step" : "brilliant"}-planes.v2` };
  if (geometryCache.size >= 48) geometryCache.delete(geometryCache.keys().next().value);
  geometryCache.set(key, result);
  return result;
}

export function createGemstoneGeometry(THREE, stone, unitsPerMm) {
  const mesh = buildGemstoneMesh(stone);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(mesh.positions.map((value) => value * unitsPerMm), 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(mesh.normals, 3));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.userData = {
    kind: "gemstone", recipe: mesh.recipe, unitsPerMm,
    dimensionsMm: { width: mesh.bounds.max[0] - mesh.bounds.min[0], length: mesh.bounds.max[1] - mesh.bounds.min[1], depth: mesh.bounds.max[2] - mesh.bounds.min[2] },
    cut: mesh.solution, facets: mesh.facets, shape: stone.shape
  };
  return geometry;
}
