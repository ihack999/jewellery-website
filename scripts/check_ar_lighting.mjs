import assert from 'node:assert/strict';
import { AppearanceLighting, cameraProbeRegion, measureCameraAppearance, applyAppearanceLighting } from '../assets/js/ar/appearance-lighting.js';
const labels = [], check = (name, fn) => { fn(); labels.push(name); };
const pixels = (colour, width = 48, height = 32) => {
  const values = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < values.length; i += 4) values.set([...colour, 255], i);
  return values;
};
const sample = (colour, roi = null) => measureCameraAppearance(pixels(colour), 48, 32, roi);
const near = (a, b, tolerance = 1e-8) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);
check('sRGB is decoded before luminance and exposure-like statistics', () => {
  near(sample([128,128,128]).sceneLuminance, .21586, .004);
  near(sample([255,0,0]).sceneLuminance, .2126, .004);
  near(sample([0,255,0]).sceneLuminance, .7152, .015);
  near(sample([0,0,255]).sceneLuminance, .0722, .002);
  let previous = 0;
  for (let value = 0; value <= 255; value++) {
    const observation = sample([value,value,value]);
    assert.ok(observation.gain >= previous && observation.gain >= .125 && observation.gain <= 2 ** .60);
    previous = observation.gain;
  }
});
check('Uniform off-centre regions and isolated highlights do not invent changing illumination', () => {
  const base = sample([100,100,100]);
  for (const roi of [{x:0,y:0},{x:1,y:1},{x:.02,y:.7}]) near(sample([100,100,100], roi).gain, base.gain);
  const data = pixels([100,100,100]);
  for (let i = 0; i < 40 * 4; i += 4) data.set([255,255,255,255], i);
  near(measureCameraAppearance(data,48,32).gain, base.gain);
  assert.equal('colourTemperature' in base, false);
  assert.equal('direction' in base, false);
});
check('Local dark clothing can only modestly change the global appearance reference', () => {
  const data = pixels([150,150,150]);
  for (let y = 11; y < 21; y++) for (let x = 17; x < 31; x++) data.set([12,12,12,255], (y*48+x)*4);
  const full = measureCameraAppearance(data,48,32), local = measureCameraAppearance(data,48,32,{x:.5,y:.5});
  assert.ok(Math.abs(local.stops - full.stops) <= .1500001);
  assert.equal(measureCameraAppearance(new Uint8ClampedArray(48*32*4),48,32),null);
  assert.equal(measureCameraAppearance([],48,32),null);
});
check('Cover crop and selfie mirroring map the same target into raw probe coordinates', () => {
  let cases = 0;
  for (const [width,height] of [[960,720],[390,844],[1200,500]]) for (const mirrored of [true,false]) {
    const scale = Math.max(width/1280,height/720);
    const metrics = {width,height,drawWidth:1280*scale,drawHeight:720*scale,offsetX:(width-1280*scale)/2,offsetY:(height-720*scale)/2};
    const raw = {x:.55,y:.45};
    const display = {x:(raw.x*metrics.drawWidth+metrics.offsetX)/width,y:(raw.y*metrics.drawHeight+metrics.offsetY)/height};
    if(mirrored)display.x=1-display.x;
    const region = cameraProbeRegion(1280,720,metrics,display,mirrored);
    near(region.sx+region.roi.x*region.sw,raw.x*1280);
    near(region.sy+region.roi.y*region.sh,raw.y*720);
    assert.ok(region.sw<=1280&&region.sh<=720);cases++;
  }
  assert.equal(cases,6);assert.equal(cameraProbeRegion(0,0,{},null,true),null);
});
check('Temporal adaptation uses unique source frames and is independent of observation frequency', () => {
  const dark = sample([32,32,32]), bright = sample([170,170,170]);
  const first = new AppearanceLighting(), second = new AppearanceLighting();
  first.observe(dark,0);second.observe(dark,0);
  for(let i=1;i<=30;i++)first.observe(bright,i/30);
  for(let i=1;i<=4;i++)second.observe(bright,i/4);
  near(first.gain,second.gain);
  const held=first.gain;
  for(let i=0;i<20;i++)assert.equal(first.observe(dark,1),false);
  near(first.gain,held);assert.equal(first.observe(dark,.5),false);
  assert.equal(first.observe(null,2),false);
  first.reset();assert.equal(first.gain,1);assert.equal(first.lastFrame,null);
  first.observe(dark,0);near(first.gain,dark.gain);
});
check('Environment and direct-light energy change together without tinting materials or camera pixels', () => {
  const scene={environmentIntensity:1,backgroundIntensity:1},renderer={toneMappingExposure:1};
  const lights=Object.fromEntries(['hemi','key','fill','rim'].map(name=>[name,{intensity:1,colour:'unchanged'}]));
  applyAppearanceLighting(scene,renderer,lights,.25);
  near(scene.environmentIntensity,.25);near(lights.key.intensity,1.05*.25);
  near(lights.rim.intensity,.25*.25);assert.equal(scene.backgroundIntensity,1);
  assert.ok(Object.values(lights).every(light=>light.colour==='unchanged'));
  applyAppearanceLighting(scene,renderer,lights,NaN);near(scene.environmentIntensity,.25);
});
console.log(JSON.stringify({passed:labels.length,checks:labels,cameraCalls:0}));
