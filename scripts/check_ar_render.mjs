import assert from 'node:assert/strict';
import * as THREE from '../assets/js/three.module.js';
import { createRenderBatches } from '../assets/js/ar/render-batches.js';
import { RenderTiming } from '../assets/js/ar/render-timing.js';
import { createJewelleryAssemblies } from '../assets/js/jewellery-assemblies.js';
import { buildJewellerySpec } from '../assets/js/jewellery-spec.js';
import { createWearableAsset } from '../assets/js/ar/wearable-asset.js';

const labels = [], check = (name, fn) => { fn(); labels.push(name); };
const nearMatrix = (a, b) => a.elements.forEach((v, i) => assert.ok(Math.abs(v - b.elements[i]) < 1e-5));
function fixture() {
  const piece = new THREE.Group(), parents = [], sources = [];
  const material = new THREE.MeshStandardMaterial({ metalness: 1 });
  for (let i = 0; i < 5; i++) {
    const parent = new THREE.Group(); parent.position.x = i * 2;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), material); mesh.position.y = 1;
    piece.add(parent); parent.add(mesh); parents.push(parent); sources.push(mesh);
  }
  return { piece, parents, sources, material };
}
check('Byte-identical geometry batches across independently moving parents without changing source data', () => {
  const { piece, parents, sources } = fixture();
  const vertices = sources.map(n => n.geometry.attributes.position.array.slice());
  const batcher = createRenderBatches(piece), mesh = piece.getObjectByName('ar-metal-draw-batches').children[0];
  assert.equal(batcher.report.sourceDraws, 5); assert.equal(batcher.report.batches, 1);
  for (let frame = 0; frame < 90; frame++) {
    parents.forEach((p, i) => { p.rotation.z = frame * .01 * (i + 1); p.position.y = frame * .003; });
    batcher.sync(); piece.updateMatrixWorld(true);
    sources.forEach((source, i) => {
      const matrix = new THREE.Matrix4(); mesh.getMatrixAt(i, matrix);
      nearMatrix(matrix.premultiply(mesh.matrixWorld), source.matrixWorld);
      assert.equal(source.layers.mask, 0);
      assert.deepEqual(source.geometry.attributes.position.array, vertices[i]);
    });
  }
  const version = mesh.instanceMatrix.version;
  piece.position.set(10, 20, 30); piece.rotation.y = .7; piece.scale.setScalar(2);
  batcher.sync(); assert.equal(mesh.instanceMatrix.version, version, 'wearer pose causes no redundant upload');
  parents[2].visible = false; batcher.sync(); assert.equal(mesh.count, 4);
  sources[0].visible = false; batcher.sync(); assert.equal(mesh.count, 3);
  sources[0].visible = true; parents[2].visible = true; batcher.sync(); assert.equal(mesh.count, 5);
  batcher.setEnabled(false); assert.ok(sources.every(n => n.layers.mask === 1));
  batcher.setEnabled(true); assert.ok(sources.every(n => n.layers.mask === 0));
  let instanceDisposals = 0, resourceDisposals = 0;
  mesh.addEventListener('dispose', () => instanceDisposals++);
  mesh.geometry.addEventListener('dispose', () => resourceDisposals++);
  mesh.material.addEventListener('dispose', () => resourceDisposals++);
  batcher.dispose(); batcher.dispose();
  assert.equal(instanceDisposals, 1); assert.equal(resourceDisposals, 0);
  assert.ok(sources.every(n => n.layers.mask === 1)); assert.equal(piece.children.length, 5);
});
check('Negative scale, shear and replaced resources fall back to individual draws', () => {
  const { piece, parents, sources } = fixture();
  const batcher = createRenderBatches(piece), mesh = piece.getObjectByName('ar-metal-draw-batches').children[0];
  parents[0].scale.x = -1;
  parents[1].scale.set(2, 1, 1); sources[1].rotation.z = .4;
  sources[2].material = sources[2].material.clone();
  sources[3].geometry = new THREE.SphereGeometry();
  batcher.sync(); assert.equal(mesh.count, 1);
  assert.ok(sources.slice(0, 4).every(n => n.layers.mask === 1));
  batcher.dispose();
});
check('Distinct UVs, opacity, optical gems and custom callbacks are never conflated', () => {
  const { piece, sources } = fixture();
  sources[0].geometry.attributes.uv.setX(0, .123);
  sources[1].userData.isGem = true;
  sources[2].onBeforeRender = () => {};
  sources[3].material = new THREE.MeshPhysicalMaterial({ transmission: .9 });
  sources[4].material = new THREE.MeshStandardMaterial({ transparent: true, opacity: .8 });
  const batcher = createRenderBatches(piece);
  assert.equal(batcher.report.batches, 0); assert.ok(sources.every(n => n.layers.mask === 1)); batcher.dispose();
});
check('Real tennis settings retain fit transforms, stone count, product dimensions and geometry', () => {
  const state = { piece: 'Bracelet', silhouette: 'Tennis', stone: 'Blue Sapphire' }, spec = buildJewellerySpec(state);
  const piece = createJewelleryAssemblies(THREE, { spec, state, metal: new THREE.MeshPhysicalMaterial({ metalness: 1 }),
    stoneMaterial: () => new THREE.MeshPhysicalMaterial({ transmission: .9 }), wearable: { wristWidthMm: 55 } }).bracelet();
  const wearable = createWearableAsset(piece, state), physical = wearable.pose.children[0];
  const matrix = physical.matrix.clone(), before = JSON.stringify(wearable.spec);
  const originalSettings = piece.children.filter(n => n.name === 'open-gallery-basket');
  const batchRoot = piece.getObjectByName('ar-metal-draw-batches');
  assert.ok(wearable.renderBatches.report.sourceDraws > 400);
  for (const width of [45, 62, 50, 55]) {
    wearable.fitBracelet(width); wearable.renderBatches.sync(); wearable.pose.updateMatrixWorld(true);
    assert.ok(batchRoot.children.every(n => n.instanceMatrix.array.every(Number.isFinite)));
    assert.ok(originalSettings.every(n => n.children.find(c => c.userData.isGem).layers.mask === 1));
    assert.equal(JSON.stringify(wearable.spec), before); nearMatrix(physical.matrix, matrix);
  }
  wearable.renderBatches.dispose();
});
check('Render diagnostics stay bounded, separate CPU time from cadence, and exclude pause gaps', () => {
  const timing = new RenderTiming();
  for (let i = 0; i < 180; i++) timing.record(i * 20, i * 20 + 4, { calls: 100, triangles: 200000 }, 1.5);
  assert.equal(timing.samples.length, 120);
  assert.match(timing.describe(4000), /CPU render p95 4.0ms · render interval p95 20.0ms/);
  timing.record(4200, 4400, { calls: 100, triangles: 200000 }, 1.5);
  assert.equal(timing.last.intervalMs, 620, 'slow active frames remain in cadence measurements');
  timing.pause();
  timing.record(9000, 9005, { calls: 10, triangles: 1000 }, 1);
  assert.equal(timing.last.intervalMs, null);
  timing.reset(); assert.equal(timing.samples.length, 0);
});
console.log(JSON.stringify({ passed: labels.length, checks: labels, cameraCalls: 0 }));
