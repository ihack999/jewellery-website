const subtract = (first, second) => first.map((value, axis) => value - second[axis]);
const cross = (first, second) => [first[1] * second[2] - first[2] * second[1], first[2] * second[0] - first[0] * second[2], first[0] * second[1] - first[1] * second[0]];
const dot = (first, second) => first.reduce((sum, value, axis) => sum + value * second[axis], 0);

export function auditMesh({ positions, indices, name = "Component", role = "component" }, toleranceMm = 0.0001) {
  const triangleCount = (indices ? indices.length : positions.length / 3) / 3;
  const report = { name, role, triangles: triangleCount, invalidTriangles: 0, degenerateTriangles: 0, boundaryEdges: 0, nonManifoldEdges: 0, inconsistentEdges: 0, closed: false, signedVolumeMm3: null };
  if (!Number.isInteger(triangleCount) || triangleCount < 1 || positions.length % 3) return { ...report, invalidTriangles: 1 };
  const points = [];
  const bins = new Map();
  const parents = [];
  const triangles = [];
  const edges = new Map();
  const findRoot = (vertex) => {
    while (parents[vertex] !== vertex) { parents[vertex] = parents[parents[vertex]]; vertex = parents[vertex]; }
    return vertex;
  };
  const weld = (point) => {
    const cell = point.map((value) => Math.floor(value / toleranceMm));
    for (let horizontal = -1; horizontal <= 1; horizontal += 1) {
      for (let vertical = -1; vertical <= 1; vertical += 1) {
        for (let depth = -1; depth <= 1; depth += 1) {
          const candidates = bins.get([cell[0] + horizontal, cell[1] + vertical, cell[2] + depth].join(",")) || [];
          const match = candidates.find((index) => Math.hypot(...subtract(point, points[index])) <= toleranceMm);
          if (match !== undefined) return match;
        }
      }
    }
    const index = points.length;
    points.push(point);
    parents.push(index);
    const key = cell.join(",");
    if (!bins.has(key)) bins.set(key, []);
    bins.get(key).push(index);
    return index;
  };
  const bounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  const vertexIds = new Map();
  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const vertices = [0, 1, 2].map((corner) => indices ? indices[triangle * 3 + corner] : triangle * 3 + corner);
    const coordinates = vertices.map((vertex) => Array.from(positions.slice(vertex * 3, vertex * 3 + 3)));
    if (coordinates.some((point) => point.length !== 3 || point.some((value) => !Number.isFinite(value)))) { report.invalidTriangles += 1; continue; }
    const welded = vertices.map((vertex, corner) => {
      if (!vertexIds.has(vertex)) vertexIds.set(vertex, weld(coordinates[corner]));
      return vertexIds.get(vertex);
    });
    if (new Set(welded).size !== 3 || Math.hypot(...cross(subtract(coordinates[1], coordinates[0]), subtract(coordinates[2], coordinates[0]))) <= toleranceMm ** 2) {
      report.degenerateTriangles += 1;
      continue;
    }
    for (const point of coordinates) for (let axis = 0; axis < 3; axis += 1) {
      bounds.min[axis] = Math.min(bounds.min[axis], point[axis]);
      bounds.max[axis] = Math.max(bounds.max[axis], point[axis]);
    }
    for (let corner = 0; corner < 3; corner += 1) {
      const start = welded[corner];
      const end = welded[(corner + 1) % 3];
      const key = start < end ? `${start}:${end}` : `${end}:${start}`;
      const edge = edges.get(key) || { count: 0, orientation: 0 };
      edge.count += 1;
      edge.orientation += start < end ? 1 : -1;
      edges.set(key, edge);
      parents[findRoot(end)] = findRoot(start);
    }
    triangles.push({ vertex: welded[0], coordinates });
  }
  for (const edge of edges.values()) {
    if (edge.count === 1) report.boundaryEdges += 1;
    if (edge.count > 2) report.nonManifoldEdges += 1;
    if (edge.count === 2 && edge.orientation !== 0) report.inconsistentEdges += 1;
  }
  const shells = new Map();
  const center = bounds.min.map((value, axis) => (value + bounds.max[axis]) / 2);
  for (const triangle of triangles) {
    const shell = findRoot(triangle.vertex);
    const relative = triangle.coordinates.map((point) => subtract(point, center));
    shells.set(shell, (shells.get(shell) || 0) + dot(relative[0], cross(relative[1], relative[2])) / 6);
  }
  report.weldedVertices = points.length;
  report.connectedShells = shells.size;
  report.boundsMm = triangles.length ? bounds : null;
  report.closed = triangles.length > 0 && !report.invalidTriangles && !report.degenerateTriangles && !report.boundaryEdges && !report.nonManifoldEdges && !report.inconsistentEdges;
  if (report.closed) {
    report.signedVolumeMm3 = [...shells.values()].reduce((sum, volume) => sum + volume, 0);
    report.reversedShells = [...shells.values()].filter((volume) => volume <= 0).length;
  }
  return report;
}

export function auditMeshCollection(meshes, revision) {
  const components = meshes.map((mesh) => auditMesh(mesh));
  const valid = components.filter((component) => component.closed && !component.reversedShells);
  return {
    schema: "tjc.mesh-audit.v3", revision, units: "mm", weldingToleranceMm: 0.0001,
    productionValidated: false, status: "workshop-review-required",
    summary: {
      meshes: components.length, triangles: components.reduce((sum, component) => sum + component.triangles, 0),
      closedOrientedMeshes: valid.length, flaggedMeshes: components.length - valid.length,
      summedClosedComponentVolumeMm3: valid.reduce((sum, component) => sum + component.signedVolumeMm3, 0)
    },
    limitations: [
      "A mesh topology audit is not manufacturing certification.",
      "Welded edge incidence, winding and connected shells are checked; vertex-link manifoldness and self-intersections are not.",
      "Components are not boolean-unioned. Summed volume can double-count overlaps and excludes flagged or decorative meshes; it is not a metal mass estimate.",
      "Stone-seat contact, collisions, minimum walls, tolerances and tool access require CAD and workshop review.",
      "Contact-AO discs, sprites, hallmark overlays and inclusion particles are excluded."
    ], components
  };
}

export async function auditPiece(piece, specification) {
  piece.updateMatrixWorld(true);
  const meshes = [];
  let vertexCount = 0;
  piece.traverseVisible((object) => {
    if (!object.isMesh || object.userData.isContactAO || object.userData.isHallmark || object.userData.isInclusion) return;
    const attribute = object.geometry?.attributes.position;
    if (!attribute) return;
    vertexCount += attribute.count;
    if (vertexCount > 6000000) throw new Error("This design exceeds the six-million-vertex audit limit.");
    const positions = new Float64Array(attribute.count * 3);
    const matrix = object.matrixWorld.elements;
    for (let index = 0; index < attribute.count; index += 1) {
      const horizontal = attribute.getX(index);
      const vertical = attribute.getY(index);
      const depth = attribute.getZ(index);
      for (let axis = 0; axis < 3; axis += 1) positions[index * 3 + axis] = (matrix[axis] * horizontal + matrix[axis + 4] * vertical + matrix[axis + 8] * depth + matrix[axis + 12]) / specification.world.unitsPerMm;
    }
    const isGemstone = object.userData.isGem || object.geometry.userData.kind === "gemstone";
    const role = isGemstone ? "gemstone" : object.userData.manufacturing?.role || "component";
    meshes.push({ name: object.name || `${role} ${meshes.length + 1}`, role, positions, indices: object.geometry.index?.array.slice() });
  });
  const worker = new Worker(new URL("./mesh-audit-worker.js?v=20260911-construction-v32", import.meta.url), { type: "module" });
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { worker.terminate(); reject(new Error("Mesh audit timed out. Try a less complex design.")); }, 90000);
    const finish = () => { clearTimeout(timeout); worker.terminate(); };
    worker.onmessage = ({ data }) => { finish(); data.error ? reject(new Error(data.error)) : resolve({ ...data.report, prongClearance: piece.userData.prongClearance || null }); };
    worker.onerror = () => { finish(); reject(new Error("Mesh audit worker failed. Check browser worker support.")); };
    worker.postMessage({ meshes, revision: specification.revision }, meshes.flatMap((mesh) => [mesh.positions.buffer, ...(mesh.indices ? [mesh.indices.buffer] : [])]));
  });
}
