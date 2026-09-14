import assert from 'node:assert/strict';
import * as THREE from '../assets/js/three.module.js';
import { buildJewellerySpec } from '../assets/js/jewellery-spec.js';
import { torsoFrame, neckPlacementOffset } from '../assets/js/ar/torso-fit.js';
import { rigidWristSeat } from '../assets/js/ar/wrist-contact.js';
import { torsoFixture } from './ar_body_fixtures.js';
import { handFixture } from './ar_contact_fixtures.js';

const originals=new Map();
const replace=(name,value)=>{originals.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{value,configurable:true,writable:true});};
let cameraCalls=0,networkCalls=0;
replace('document',{readyState:'loading',addEventListener(){},body:{style:{}}});
replace('window',{}); replace('localStorage',{getItem:()=>null});
replace('navigator',{mediaDevices:{getUserMedia(){cameraCalls++;throw Error('Camera prohibited');}}});
replace('fetch',()=>{networkCalls++;throw Error('Network prohibited');});
const near=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const sameMatrix=(a,b)=>a.elements.forEach((v,i)=>near(v,b.elements[i]));
const checks=[];
const check=(name,fn)=>{fn();checks.push(name);};
try {
  const {ARTryOn}=await import('../assets/js/ar-tryon.js');
  const make=(piece='Necklace',calibration={})=>{
    const app=new ARTryOn(); app.pieceType=piece;
    app.video={videoWidth:1280,videoHeight:720}; app.canvas={clientWidth:960,clientHeight:720};
    app.camera=new THREE.PerspectiveCamera(50,960/720,.01,10);app.camera.position.z=1;app.camera.updateMatrixWorld(true);
    app.scene=new THREE.Scene();app.ring=new THREE.Group();app.scene.add(app.ring);
    app._designState={piece,silhouette:piece==='Necklace'?'Pendant':'Bangle'};
    app._physicalSpec=buildJewellerySpec(app._designState);app.ring.userData.wearable={neck:{fits:true}};
    app.calibration={...app.calibration,fit:1,lift:0,side:0,roll:0,neckHeightAuto:false,neckHeightMm:50,neckBaseOffsetMm:{x:0,y:0},...calibration};
    app.setPlacementOpen=()=>{};
    if(piece==='Bracelet'){
      app._ringLocalInnerR=app._physicalSpec.bracelet.innerDiameterMm*.0005;
      app._ringLocalOuterR=app._ringLocalInnerR+.002;
      app.setupHandSilhouetteOccluder();
    }
    return app;
  };
  const apply=(app,result,time=1000)=>{
    if(app.pieceType==='Necklace')app.applyResultNecklace(result,time);else app.applyResultBracelet(result,time);
    app.syncHandContactDisplay();app.scene.updateMatrixWorld(true);
    assert.ok(app._hasTarget&&app.ring.visible);
  };
  let headCases=0,torsoCases=0,wristCases=0;
  check('Head translation/nodding does not rotate the necklace or move a calibrated neck base',()=>{
    const baseline=make();apply(baseline,torsoFixture());
    for(const headX of [-.16,0,.16])for(const headY of [-.06,0,.06]){
      const app=make();apply(app,torsoFixture({headX,headY}));
      near(app._tgtQuat.angleTo(baseline._tgtQuat),0);near(app._tgtPos.distanceTo(baseline._tgtPos),0);
      app.close();headCases++;
    }baseline.close();
  });
  check('Torso yaw, shoulder roll and observed lean produce finite orthonormal poses in both mirror states',()=>{
    for(const mirrored of [true,false])for(const yaw of [-.8,0,.8])for(const lean of [-.5,0,.5])for(const roll of [-.3,.3]){
      const app=make();app.facingMode=mirrored?'user':'environment';apply(app,torsoFixture({yaw,lean,roll}));
      near(app._mat.determinant(),1);near(app._tgtQuat.length(),1);
      assert.ok(app._tgtPos.toArray().every(Number.isFinite));app.close();torsoCases++;
    }
    const input=torsoFixture({lean:.5});const world=input.worldLandmarks[0],points=input.landmarks[0];
    const left={x:-100,y:0},right={x:100,y:0};
    assert.ok(torsoFrame(left,right,world,points).leanObserved);
    points[23].visibility=.1;assert.equal(torsoFrame(left,right,world,points).leanObserved,false);
    points[23].visibility=1;points[24].y=1.5;assert.equal(torsoFrame(left,right,world,points).leanObserved,false);
    assert.equal(torsoFrame(left,left,world,points),null);
  });
  check('Neck-base picking inverts oblique projection and tracks physical offsets across camera distance',()=>{
    const app=make();const input=torsoFixture({yaw:.45,lean:.3});apply(app,input);
    app._frozen=true;app._lastTrackingResult=input;
    const r=app._neckPlacementReference;
    const point={x:r.x+r.pixelsPerMeter*(r.right.x*.025+r.up.x*.035),y:r.y+r.pixelsPerMeter*(r.right.y*.025+r.up.y*.035)};
    assert.ok(app.placeNeckBase(point));near(app.calibration.neckBaseOffsetMm.x,25);near(app.calibration.neckBaseOffsetMm.y,35);
    const stage=app._tgtPos.clone().project(app.camera);
    near(stage.x,point.x*2/960);near(stage.y,point.y*2/720);
    for(const zoom of [.7,1.2]){
      app.applyTrackingResult(torsoFixture({zoom,yaw:.45,lean:.3}));
      const ref=app._neckPlacementReference,p=app._tgtPos.clone().project(app.camera);
      near(p.x,(ref.x+ref.pixelsPerMeter*(ref.right.x*.025+ref.up.x*.035))*2/960);
      near(p.y,(ref.y+ref.pixelsPerMeter*(ref.right.y*.025+ref.up.y*.035))*2/720);
    }
    assert.equal(neckPlacementOffset({x:0,y:0},{}),null);
    assert.equal(neckPlacementOffset({x:1e8,y:0},r),null);
    app._lastTrackingResult={};assert.equal(app.placeNeckBase(point),false,'stale neck reference cannot place a newer rejected frame');
    app._frozen=false;assert.equal(app.placeNeckBase(point),false);app.close();
  });
  check('Rigid wrist seating preserves the opening and contains the body at contact',()=>{
    for(const wristRadius of [.018,.023,.028])for(const innerRadius of [.027,.031,.036])for(let i=0;i<16;i++){
      const angle=i/16*Math.PI*2;
      const seat=rigidWristSeat({wristRadius,innerRadius,thickness:.003,gravityX:Math.cos(angle),gravityY:Math.sin(angle)});
      if(seat.fits){
        let max=0;
        for(let j=0;j<4096;j++){
          const a=j/4096*Math.PI*2;
          const d=((wristRadius*Math.cos(a)-seat.x)/innerRadius)**2+((wristRadius*.72*Math.sin(a)-seat.y)/(innerRadius*.8-.0003))**2;
          max=Math.max(max,d);
        }
        assert.ok(max<1.001 && max>.999,`contact ${max}`);
        assert.ok(seat.x*Math.cos(angle)+seat.y*Math.sin(angle)>=0);
      }else assert.ok(wristRadius>innerRadius||wristRadius*.72>innerRadius*.8-.0003);
      wristCases++;
    }
    assert.deepEqual(rigidWristSeat({wristRadius:.025,innerRadius:.031,thickness:.003,gravityX:0,gravityY:0}),{x:0,y:0,fits:true});
  });
  check('Bracelet placement/size changes cannot drag the wrist body; first lock and loss share depth timing',()=>{
    const result=handFixture({roll:Math.PI/2,pitch:.3});
    const baseline=make('Bracelet');apply(baseline,result);
    assert.ok(baseline._wristContactBody.visible&&!baseline._occluder);
    const original=baseline._wristContactBody.matrixWorld.clone();
    for(const calibration of [{side:48},{lift:40},{fit:.78},{fit:1.26},{roll:35}]){
      const app=make('Bracelet',calibration);apply(app,result);
      sameMatrix(app._wristContactBody.matrixWorld,original);
      const physical=JSON.stringify(app._physicalSpec);
      for(let i=1;i<10;i++)apply(app,handFixture({roll:Math.PI/2+i*.03}),1000+i*33);
      assert.equal(JSON.stringify(app._physicalSpec),physical);app.close();
    }
    assert.ok(Math.hypot(baseline._rigidWristSeating.x,baseline._rigidWristSeating.y)>0);
    for(let i=0;i<9;i++)baseline.applyResultBracelet({},2000+i*33);
    baseline.syncHandContactDisplay();assert.equal(baseline._wristContactBody.visible,false);
    const body=baseline._wristContactBody;let disposed=0;body.geometry.addEventListener('dispose',()=>disposed++);
    baseline.close();baseline.close();assert.equal(disposed,1);assert.equal(body.parent,null);
  });
  console.log(JSON.stringify({passed:checks.length,headCases,torsoCases,wristCases,cameraCalls,networkCalls,checks}));
}finally{for(const[name,descriptor]of originals){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}
