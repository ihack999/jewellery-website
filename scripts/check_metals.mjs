import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import * as THREE from '../assets/js/three.module.js';
import { unwrapMetalBand } from '../assets/js/metal-geometry.js';
import { FINISH_PROFILES, METAL_REFLECTANCE, metalReflectanceColor, metalFinishParameters } from '../assets/js/jewellery-materials.js';
import { mmToWorld } from '../assets/js/jewellery-spec.js';
const source = await readFile(new URL('../assets/js/designer.js', import.meta.url), 'utf8');
const bandSource = source.slice(source.indexOf('  function makeBandGeometry('), source.indexOf('  function makeEllipticalTubeAlongCurve('));
let bands = 0;
for (const finish of Object.keys(FINISH_PROFILES)) for (const style of ['Solitaire','Knife-Edge','Twist']) for (const scale of [.25,1.5,6]) {
  const build = vm.runInNewContext(bandSource + '\nmakeBandGeometry;', {THREE, mmToWorld, unwrapMetalBand, currentState:{finish,finishStrength:1,finishScaleMm:scale}});
  const geometry = build(.8,.15,.24,style);
  const {position,normal,uv}=geometry.attributes, {columns,rows}=geometry.userData.metalSweep;
  const stride=rows+1;
  const vector=(attribute,index)=>new THREE.Vector3().fromBufferAttribute(attribute,index);
  for (let i=0;i<=columns;i++) {
    assert.ok(vector(position,i*stride).distanceTo(vector(position,i*stride+rows))<1e-8);
    assert.ok(vector(normal,i*stride).distanceTo(vector(normal,i*stride+rows))<1e-8);
  }
  for (let j=0;j<=rows;j++) {
    assert.ok(vector(position,j).distanceTo(vector(position,columns*stride+j))<1e-8);
    assert.ok(vector(normal,j).distanceTo(vector(normal,columns*stride+j))<1e-8);
  }
  const indices=geometry.index.array;
  for(let i=0;i<indices.length;i+=3) {
    const ids=[indices[i],indices[i+1],indices[i+2]];
    const u=ids.map(v=>uv.getX(v)),v=ids.map(v=>uv.getY(v));
    assert.ok(Math.max(...u)-Math.min(...u)<geometry.userData.metalSweep.uRepeats/columns+1e-4,'no triangle crosses the U wrap');
    assert.ok(Math.max(...v)-Math.min(...v)<geometry.userData.metalSweep.vRepeats/rows+1e-4,'no triangle crosses the V wrap');
  }
  assert.equal(indices.length,220*32*6,'surface triangle count preserved');
  for (const attribute of [position,normal,uv]) assert.ok(attribute.array.every(Number.isFinite));
  geometry.dispose();bands++;
}
for (const metal of Object.keys(METAL_REFLECTANCE)) for (const karat of ['10K','14K','18K','22K','950']) {
  const c=metalReflectanceColor(THREE,metal,karat);assert.ok(c.toArray().every(v=>v>0&&v<=1));
}
const silver=metalReflectanceColor(THREE,'Mirror Silver','950');
assert.ok(silver.r>.9&&silver.g>.88&&silver.b>.79,'silver uses conductor reflectance, decoded once');
for (const finish of Object.keys(FINISH_PROFILES)) {
  const low=metalFinishParameters(finish,0),high=metalFinishParameters(finish,2);
  assert.equal(low.normal,0);assert.equal(low.anisotropy,0);assert.equal(low.roughness,.085);
  assert.ok(high.roughness>low.roughness&&high.roughness<=.85);
}
assert.equal(metalFinishParameters('High Polish').anisotropy,0,'polish does not need arbitrary brushed direction');
assert.ok(metalFinishParameters('Brushed').anisotropy>.7);
console.log(JSON.stringify({passed:3,bands,checks:['continuous positions/normals with unwrapped periodic UVs','bounded conductor reflectance','finish strength affects scattering']}));
