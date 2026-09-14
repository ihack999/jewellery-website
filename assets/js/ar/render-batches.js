import * as THREE from "../three.module.js";

// AR-only draw representation. Source objects remain in their original
// hierarchy for fitting, articulation, dimensions and optical inspection.
// A zero layer mask suppresses only that source draw, never its children.
const plainMaterial = (material) => material?.isMeshStandardMaterial
  && !material.transparent && material.opacity === 1 && !(material.transmission > 0)
  && material.colorWrite && material.depthWrite && !material.wireframe
  && material.onBeforeCompile === THREE.Material.prototype.onBeforeCompile
  && material.onBeforeRender === THREE.Material.prototype.onBeforeRender;

function geometryData(geometry) {
  if (!geometry?.isBufferGeometry || geometry.isInstancedBufferGeometry
    || Object.keys(geometry.morphAttributes).length) return null;
  const names = Object.keys(geometry.attributes).sort();
  const attributes = names.map((name) => geometry.attributes[name]);
  if (geometry.index) attributes.push(geometry.index);
  if (attributes.some((a) => !a.array || a.isInterleavedBufferAttribute || a.isInstancedBufferAttribute)) return null;
  const layout = JSON.stringify([names, attributes.map((a) => [a.itemSize, a.normalized, a.array.constructor.name, a.array.length, a.gpuType]),
    geometry.index !== null, geometry.groups, geometry.drawRange.start, String(geometry.drawRange.count)]);
  const bytes = attributes.map((a) => new Uint8Array(a.array.buffer, a.array.byteOffset, a.array.byteLength));
  let hash = 2166136261;
  for (const array of bytes) for (const value of array) hash = Math.imul(hash ^ value, 16777619);
  return { key: layout + ":" + (hash >>> 0), bytes };
}

const equalBytes = (a, b) => a.bytes.length === b.bytes.length && a.bytes.every((array, i) =>
  array.length === b.bytes[i].length && array.every((value, j) => value === b.bytes[i][j]));
const axisPairs = [[0, 4], [0, 8], [4, 8]];

// Three r164's instance normal transform supports positive, orthogonal basis
// columns. Preserve the original draw for mirrored, collapsed or sheared parts.
function supportedTransform(matrix) {
  const e = matrix.elements;
  if (!e.every(Number.isFinite) || matrix.determinant() <= 1e-12) return false;
  for (const [i, j] of axisPairs) {
    const dot = e[i] * e[j] + e[i + 1] * e[j + 1] + e[i + 2] * e[j + 2];
    const lengthA = e[i] ** 2 + e[i + 1] ** 2 + e[i + 2] ** 2;
    const lengthB = e[j] ** 2 + e[j + 1] ** 2 + e[j + 2] ** 2;
    if (dot ** 2 > lengthA * lengthB * 1e-12) return false;
  }
  return true;
}

export function createRenderBatches(piece) {
  const pool = new Map(), dataCache = new Map(), batches = [];
  piece.traverse((node) => {
    if (node === piece || !node.isMesh || node.isInstancedMesh || node.isSkinnedMesh || node.userData.isGem
      || node.geometry?.userData.kind === "gemstone" || !plainMaterial(node.material)
      || node.onBeforeRender !== THREE.Object3D.prototype.onBeforeRender
      || node.onAfterRender !== THREE.Object3D.prototype.onAfterRender
      || node.customDepthMaterial || node.customDistanceMaterial) return;
    if (!dataCache.has(node.geometry)) dataCache.set(node.geometry, geometryData(node.geometry));
    const data = dataCache.get(node.geometry);
    if (!data) return;
    const key = [node.material.uuid, node.layers.mask, node.renderOrder, node.castShadow, node.receiveShadow, data.key].join("/");
    const candidates = pool.get(key) || [];
    let group = candidates.find((candidate) => equalBytes(candidate.data, data));
    if (!group) { group = { data, nodes: [] }; candidates.push(group); pool.set(key, candidates); }
    group.nodes.push(node);
  });
  const root = new THREE.Group();
  root.name = "ar-metal-draw-batches";
  const records = new Map();
  const recordFor = (node) => {
    if (node === piece) return null;
    if (!records.has(node)) {
      const parent = recordFor(node.parent);
      records.set(node, { node, parent, matrix: new THREE.Matrix4(), visible: true });
    }
    return records.get(node);
  };
  for (const candidates of pool.values()) for (const { nodes } of candidates) {
    if (nodes.length < 3) continue;
    const first = nodes[0];
    const mesh = new THREE.InstancedMesh(first.geometry, first.material, nodes.length);
    mesh.name = "ar-metal-batch:" + first.name;
    mesh.layers.mask = first.layers.mask;
    mesh.renderOrder = first.renderOrder;
    mesh.castShadow = first.castShadow;
    mesh.receiveShadow = first.receiveShadow;
    // The wearable is small and its settings can move every frame. Avoid a
    // stale instance bound clipping a fitted bracelet or a swinging pendant.
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    root.add(mesh);
    batches.push({ mesh, bindings: nodes.map((node) => ({ node, record: recordFor(node), mask: node.layers.mask })) });
  }
  if (batches.length) piece.add(root);
  let enabled = true, disposed = false;
  const report = { sourceDraws: batches.reduce((sum, batch) => sum + batch.bindings.length, 0), batches: batches.length, activeInstances: 0 };
  const sync = () => {
    if (disposed || !enabled) return;
    // Local ancestry excludes the tracking pose and physical-unit root, so
    // ordinary wearer movement does not cause redundant instance uploads.
    for (const record of records.values()) {
      if (record.node.matrixAutoUpdate) record.node.updateMatrix();
      record.matrix.copy(record.node.matrix);
      if (record.parent) record.matrix.premultiply(record.parent.matrix);
      record.visible = record.node.visible && (!record.parent || record.parent.visible);
    }
    report.activeInstances = 0;
    for (const { mesh, bindings } of batches) {
      let count = 0, changed = false;
      for (const { node, record, mask } of bindings) {
        // Material replacements and unsupported transforms retain a correct
        // individual fallback. AR geometry itself is immutable after creation.
        const usable = node.geometry === originals.get(node) && node.material === mesh.material && supportedTransform(record.matrix);
        node.layers.mask = usable ? 0 : mask;
        if (!usable || !record.visible) continue;
        const array = mesh.instanceMatrix.array, values = record.matrix.elements;
        for (let i = 0; i < 16; i++) {
          const value = Math.fround(values[i]), offset = count * 16 + i;
          if (array[offset] !== value) { array[offset] = value; changed = true; }
        }
        count++;
      }
      mesh.count = count;
      mesh.visible = count > 0;
      if (changed) mesh.instanceMatrix.needsUpdate = true;
      report.activeInstances += count;
    }
  };
  // Comparison was byte-exact at construction; keep a reference to each
  // original geometry so replacing it later exits the batch safely.
  const originals = new Map(batches.flatMap(({ bindings }) => bindings.map(({ node }) => [node, node.geometry])));
  const setEnabled = (value) => {
    if (disposed) return;
    enabled = Boolean(value); root.visible = enabled;
    if (enabled) sync();
    else for (const { bindings } of batches) for (const { node, mask } of bindings) node.layers.mask = mask;
  };
  sync();
  return {
    report, sync, setEnabled,
    dispose() {
      if (disposed) return;
      setEnabled(false); disposed = true;
      root.removeFromParent();
      // Instance buffers are owned here; shared geometry/materials belong to
      // the original wearable and are released by its ordinary tree cleanup.
      for (const { mesh } of batches) mesh.dispose();
      root.clear(); records.clear(); originals.clear(); batches.length = 0;
    }
  };
}
