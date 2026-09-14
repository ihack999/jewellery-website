// Real geometry, projection, placement and lifecycle; synthetic joints only.
import assert from 'node:assert/strict';
import * as THREE from '../assets/js/three.module.js';
import { FingerContactBody, fingerContactWeight } from '../assets/js/ar/finger-contact.js';
import { buildJewellerySpec } from '../assets/js/jewellery-spec.js';
import { handFixture } from './ar_contact_fixtures.js';

const originals = new Map();
const replace = (name, value) => {
  originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
};
let cameraCalls = 0, networkCalls = 0;
replace('document', { readyState: 'loading', addEventListener() {}, body: { style: {} } });
replace('window', {});
replace('localStorage', { getItem: () => null });
replace('navigator', { mediaDevices: { getUserMedia() { cameraCalls++; throw Error('Camera forbidden'); } } });
replace('fetch', () => { networkCalls++; throw Error('Network forbidden'); });
const near = (a, b, tolerance = 1e-7) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const vectorNear = (a, b) => near(a.distanceTo(b), 0);
const matrixNear = (a, b) => a.elements.forEach((x, i) => near(x, b.elements[i]));
const checks = [];
const test = (name, fn) => { fn(); checks.push(name); };

try {
  const { ARTryOn } = await import('../assets/js/ar-tryon.js');
  const appFor = ({ width = 960, height = 720, mirrored = true, finger = 'ring', ringSize = 7, ...calibration } = {}) => {
    const app = new ARTryOn();
    app.canvas = { clientWidth: width, clientHeight: height };
    app.video = { videoWidth: 1280, videoHeight: 720 };
    app.camera = new THREE.PerspectiveCamera(50, width / height, .01, 10);
    app.camera.position.z = 1; app.camera.updateMatrixWorld(true);
    app.scene = new THREE.Scene(); app.ring = new THREE.Group(); app.scene.add(app.ring);
    app.activeFinger = finger; app.facingMode = mirrored ? 'user' : 'environment';
    app.calibration = { ...app.calibration, fit: 1, side: 0, lift: 0, roll: 0, ...calibration };
    app._physicalSpec = buildJewellerySpec({ piece: 'Ring', ringSize });
    app._ringLocalInnerR = app._physicalSpec.ring.innerDiameterMm * .0005;
    app._ringLocalOuterR = app._ringLocalInnerR + .00175;
    app._occluderBaseRadius = app._ringLocalInnerR * .94;
    app._shadowBaseOpacity = .22;
    app.setupHandSilhouetteOccluder();
    return app;
  };
  const apply = (app, result = handFixture(), now = 1000) => {
    app.applyResult(result, now);
    app.syncHandContactDisplay();
    app.scene.updateMatrixWorld(true);
    assert.ok(app._hasTarget && app.ring.visible);
  };
  const surface = app => new THREE.Box3().setFromObject(app._fingerContactBody);

  test('Joint length, taper and rounded caps adapt without replacing GPU buffers', () => {
    const body = new FingerContactBody(), buffer = body.geometry.attributes.position;
    for (const finger of ['index', 'middle', 'ring', 'pinky']) for (const length of [.025, .041, .058]) {
      assert.ok(body.updateSource({ start: new THREE.Vector3(), end: new THREE.Vector3(0, 0, length),
        dorsal: new THREE.Vector3(0, 1, 0), radius: .008, seat: .34, finger }));
      vectorNear(new THREE.Vector3(0, 0, -length / 2).applyMatrix4(body.sourceMatrix), new THREE.Vector3());
      vectorNear(new THREE.Vector3(0, 0, length / 2).applyMatrix4(body.sourceMatrix), new THREE.Vector3(0, 0, length));
      const box = body.geometry.boundingBox;
      assert.ok(box.min.z < -length / 2 && box.min.z > -length / 2 - .010);
      assert.ok(box.max.z > length / 2 && box.max.z < length / 2 + .010);
      near(box.max.y / box.max.x, .82);
      assert.equal(body.geometry.attributes.position, buffer);
      assert.ok(buffer.array.every(Number.isFinite));
      // Ray at the seat intersects the specified lateral radius, independently
      // of capsule length or taper. This checks the actual triangle surface.
      body.syncDisplay(new THREE.Matrix4(), true); body.updateMatrixWorld(true);
      const ray = new THREE.Raycaster(new THREE.Vector3(.03, 0, length * .34), new THREE.Vector3(-1, 0, 0));
      near(ray.intersectObject(body)[0].point.x, .008, 2e-6);
    }
    body.dispose();
  });

  let projectionCases = 0;
  test('All four fingers remain at their joints across mirror, crop, rotation and flexion', () => {
    for (const finger of ['index', 'middle', 'ring', 'pinky']) for (const mirrored of [false, true])
      for (const [width, height] of [[960, 720], [390, 700], [1000, 450]])
        for (const pose of [{}, { pitch: .6, yaw: .5, roll: .4, bend: 1.3 }, { pitch: -.6, yaw: -.7, roll: -.8, bend: 2 }]) {
          const app = appFor({ finger, mirrored, width, height }), result = handFixture(pose);
          apply(app, result);
          const body = app._fingerContactBody;
          assert.ok(body.valid && body.visible);
          const [base, tip] = app.fingerLandmarks();
          const centre = new THREE.Vector3().setFromMatrixPosition(body.matrixWorld).project(app.camera);
          // Centre is the midpoint of the unprojected joint centres (depth
          // varies with perspective). The endpoints must project to the data.
          const units = app.worldUnitsPerPixelAtZ(), metrics = app.videoMetrics();
          const seat = { index: .38, middle: .36, ring: .34, pinky: .32 }[finger];
          const points = result.landmarks[0];
          const z0 = points[base].z * (1 - seat) + points[tip].z * seat;
          const endpoints = [base, tip].map(index => {
            const stage = app.landmarkToStage(points[index], metrics);
            return app.stageToWorld(stage.x, stage.y, -(points[index].z - z0) * metrics.drawWidth * units);
          });
          const length = endpoints[0].distanceTo(endpoints[1]);
          for (const [i, sign] of [[0, -1], [1, 1]]) {
            const endpoint = new THREE.Vector3(0, 0, sign * length / 2).applyMatrix4(body.matrixWorld).project(app.camera);
            const stage = app.landmarkToStage(points[i ? tip : base], metrics);
            near(endpoint.x, stage.x * 2 / width); near(endpoint.y, stage.y * 2 / height);
          }
          assert.ok(centre.toArray().every(Number.isFinite));
          assert.equal(app._handMaskMesh.count, 14, 'selected segment is not drawn twice');
          assert.equal(body.parent, app.scene, 'body is not a child of jewellery');
          app.close(); projectionCases++;
        }
  });

  test('Preview scale, side, lift, tilt and selected ring size leave the tracked skin in place', () => {
    const baseline = appFor(); apply(baseline);
    const box = surface(baseline), source = baseline._fingerContactBody.sourceMatrix.clone();
    for (const change of [{ side: 48 }, { lift: -48 }, { roll: 35 }, { fit: .78 }, { fit: 1.26 }, { ringSize: 4 }, { ringSize: 12 },
      { side: -35, lift: 22, roll: -30, fit: 1.2 }]) {
      const app = appFor(change); apply(app);
      matrixNear(app._fingerContactBody.sourceMatrix, source);
      vectorNear(surface(app).min, box.min); vectorNear(surface(app).max, box.max);
      assert.ok(!app._occluder, 'no product-parented finger sleeve');
      app.close();
    }
    baseline.close();
  });

  test('Filtered motion and prediction apply the same display correction to all finger depths', () => {
    const app = appFor(); apply(app);
    for (let frame = 1; frame <= 90; frame++) {
      apply(app, handFixture({ shiftX: .015 * Math.sin(frame / 8), roll: .25 * Math.sin(frame / 11) }), 1000 + frame * 33);
      app.ring.position.lerp(app._tgtPos, .35);
      app.ring.quaternion.slerp(app._tgtQuat, .35);
      app.ring.scale.setScalar(app.ring.scale.x + (app._tgtScale - app.ring.scale.x) * .35);
      app.ring.position.x += app.worldUnitsPerPixelAtZ() * 2;
      app.syncHandContactDisplay(); app.scene.updateMatrixWorld(true);
      const selectedCorrection = app._fingerContactBody.matrixWorld.clone().multiply(app._fingerContactBody.sourceMatrix.clone().invert());
      matrixNear(selectedCorrection, app._handMaskMesh.matrixWorld);
    }
    app.close();
  });

  test('Contact shadow fades when an adjustment leaves the finger', () => {
    const input = { side: 0, lift: 0, directionX: 0, directionY: 1, radius: 20, length: 110, seat: .34 };
    near(fingerContactWeight(input), 1);
    assert.equal(fingerContactWeight({ ...input, side: 20 }), 0);
    assert.equal(fingerContactWeight({ ...input, lift: -70 }), 0);
    assert.equal(fingerContactWeight({ ...input, lift: 100 }), 0);
    assert.ok(fingerContactWeight({ ...input, side: 7 }) > 0 && fingerContactWeight({ ...input, side: 7 }) < 1);
    near(fingerContactWeight({ ...input, directionX: 1, directionY: 0, lift: 20 }), 0);
    const app = appFor({ side: 48 }); apply(app); assert.equal(app._targetShadowOpacity, 0); app.close();
  });

  test('Invalid geometry clears old depth; loss, reset, reacquisition and close release visibility/resources', () => {
    const body = new FingerContactBody();
    const input = { start: new THREE.Vector3(), end: new THREE.Vector3(0, 0, .04), dorsal: new THREE.Vector3(0, 1, 0), radius: .008 };
    for (const bad of [{ radius: NaN }, { radius: 0 }, { end: new THREE.Vector3() }, { end: new THREE.Vector3(0, 0, 20) },
      { dorsal: new THREE.Vector3(0, 0, 1) }, { start: new THREE.Vector3(NaN, 0, 0) }]) {
      body.updateSource(input); body.syncDisplay(new THREE.Matrix4(), true); assert.ok(body.visible);
      assert.equal(body.updateSource({ ...input, ...bad }), false);
      body.syncDisplay(new THREE.Matrix4(), true); assert.ok(!body.visible);
    }
    body.dispose();
    const app = appFor(); apply(app);
    for (let i = 0; i < 9; i++) app.applyResult({}, 1100 + i * 33);
    app.syncHandContactDisplay(); assert.ok(!app._fingerContactBody.visible && !app._handMaskMesh.visible);
    apply(app, handFixture(), 1500); assert.ok(app._fingerContactBody.visible);
    app.resetTrackingFilters(); app.syncHandContactDisplay(); assert.ok(!app._fingerContactBody.visible);
    apply(app, handFixture(), 1600);
    const mesh = app._fingerContactBody; let geometryDisposals = 0, materialDisposals = 0;
    mesh.geometry.addEventListener('dispose', () => geometryDisposals++);
    mesh.material.addEventListener('dispose', () => materialDisposals++);
    app.close(); app.close();
    assert.equal(app._fingerContactBody, null); assert.equal(mesh.parent, null);
    assert.equal(geometryDisposals, 1); assert.equal(materialDisposals, 1);
  });
  assert.equal(cameraCalls, 0); assert.equal(networkCalls, 0);
  console.log(JSON.stringify({ passed: checks.length, projectionCases, motionFrames: 90, cameraCalls, networkCalls, checks }));
} finally {
  for (const [name, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name];
  }
}
