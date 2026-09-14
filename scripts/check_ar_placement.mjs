import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import * as THREE from '../assets/js/three.module.js';
import {observeForearm} from '../assets/js/ar/forearm-fit.js';
import {buildJewellerySpec} from '../assets/js/jewellery-spec.js';
import {forearmFixture} from './ar_placement_fixtures.js';
import {torsoFixture} from './ar_body_fixtures.js';
const saved=new Map();
const replace=(name,value)=>{saved.set(name,Object.getOwnPropertyDescriptor(globalThis,name));Object.defineProperty(globalThis,name,{value,configurable:true,writable:true});};
replace('document',{readyState:'loading',addEventListener(){},body:{style:{}}});
replace('window',{});replace('localStorage',{getItem:()=>null});
let cameraCalls=0;replace('navigator',{mediaDevices:{getUserMedia(){cameraCalls++;throw Error('Camera prohibited');}}});
const checks=[];const test=async(name,fn)=>{await fn();checks.push(name);};
const near=(a,b,t=1e-6)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
const same=(a,b)=>a.elements.forEach((v,i)=>near(v,b.elements[i]));
try{
  const {ARTryOn}=await import('../assets/js/ar-tryon.js');
  const make=(piece,calibration={})=>{
    const app=new ARTryOn();app.pieceType=piece;app.video={videoWidth:1280,videoHeight:720};app.canvas={clientWidth:960,clientHeight:720};
    app.camera=new THREE.PerspectiveCamera(50,960/720,.01,10);app.camera.position.z=1;app.camera.updateMatrixWorld(true);
    app.scene=new THREE.Scene();app.ring=new THREE.Group();app.scene.add(app.ring);
    app.calibration={...app.calibration,fit:1,lift:0,side:0,roll:0,neckHeightAuto:false,neckHeightMm:50,neckBaseOffsetMm:{x:0,y:0},...calibration};
    app._designState={piece,silhouette:piece==='Necklace'?'Pendant':'Bangle'};app._physicalSpec=buildJewellerySpec(app._designState);
    app.ring.userData.wearable={neck:{fits:true,radiusMm:58,depthMm:44}};
    app._neckShadowBaseOpacity=.2;
    app._ringLocalInnerR=app._physicalSpec.bracelet.innerDiameterMm*.0005;app._ringLocalOuterR=app._ringLocalInnerR+.002;
    if(piece==='Necklace')app.addWearableBody();else app.setupHandSilhouetteOccluder();
    return app;
  };
  const step=(app,result,t=1000)=>{app[app.pieceType==='Necklace'?'applyResultNecklace':'applyResultBracelet'](result,t);app.syncHandContactDisplay();app.scene.updateMatrixWorld(true);assert.ok(app._hasTarget&&app.ring.visible);};
  await test('Neck body is independent of fit/side/lift/tilt through mirror, yaw and lean',()=>{
    let cases=0;
    for(const mirrored of [true,false])for(const yaw of [-.65,0,.65])for(const lean of [-.3,.3]){
      const base=make('Necklace');base.facingMode=mirrored?'user':'environment';const input=torsoFixture({yaw,lean});step(base,input);
      const expected=base._neckContactBody.matrixWorld.clone();assert.equal(base._neckContactBody.parent,base.scene);
      for(const calibration of [{side:40},{lift:40},{roll:35},{fit:.8},{fit:1.2}]){
        const app=make('Necklace',calibration);app.facingMode=base.facingMode;step(app,input);
        same(app._neckContactBody.matrixWorld,expected);assert.ok(app._targetNeckShadowOpacity<base._targetNeckShadowOpacity);
        app.close();cases++;
      }
      base.close();
    }assert.equal(cases,60);
  });
  await test('Neck body shares display timing, clears on loss, and releases once on close',()=>{
    const app=make('Necklace');step(app,torsoFixture());const body=app._neckContactBody;
    for(let i=1;i<=90;i++){
      step(app,torsoFixture({yaw:Math.sin(i*.03)*.6,lean:.2,zoom:1+i*.001}),1000+i*33);
      app.ring.position.lerp(app._tgtPos,.4);app.ring.quaternion.slerp(app._tgtQuat,.4);app.ring.scale.lerp(new THREE.Vector3().setScalar(app._tgtScale),.4);
      app.syncHandContactDisplay();app.scene.updateMatrixWorld(true);
      const expected=app.ring.matrixWorld.clone().multiply(app._neckContactSourceInverse).multiply(body.sourceMatrix);same(body.matrixWorld,expected);
    }
    for(let i=0;i<9;i++)app.applyResultNecklace({},5000+i*33);app.syncHandContactDisplay();assert.equal(body.visible,false);
    let disposed=0;body.geometry.addEventListener('dispose',()=>disposed++);app.close();app.close();assert.equal(disposed,1);assert.equal(body.parent,null);
  });
  await test('Forearm observations reject ambiguity, occlusion, stale data and mismatched wrists',()=>{
    const app=make('Bracelet'),metrics=app.videoMetrics();
    const get=result=>observeForearm(result.forearmPose,result.landmarks[0],metrics,true);
    const base=forearmFixture();assert.ok(get(base));
    const translated=forearmFixture({poseOrigin:[-9,4,-2]});near(get(base).axis.distanceTo(get(translated).axis),0);
    assert.equal(get(forearmFixture({visibility:.3})),null);assert.equal(get(forearmFixture({ageMs:350})),null);
    const mismatched=forearmFixture();mismatched.forearmPose.landmarks[0][16].x+=.25;assert.equal(get(mismatched),null);
    const ambiguous=forearmFixture();const p=ambiguous.forearmPose.landmarks[0],w=ambiguous.forearmPose.worldLandmarks[0];
    p[15]={...p[16]};p[13]={...p[14]};w[15]=w[16].clone();w[13]=w[14].clone();assert.equal(get(ambiguous),null);
    assert.equal(observeForearm(base.forearmPose,base.landmarks[0],metrics,true,400),null);app.close();
  });
  await test('Bracelet wrist anchor and axis stay on the forearm while the hand flexes',()=>{
    let cases=0;
    for(const mirrored of [true,false]){
      const base=make('Bracelet');base.facingMode=mirrored?'user':'environment';step(base,forearmFixture());
      const axis=new THREE.Vector3(0,0,1).applyQuaternion(base._tgtQuat);
      const center=new THREE.Vector3().setFromMatrixPosition(base._wristContactBody.sourceMatrix);
      for(const flex of [-.75,-.4,0,.4,.75])for(const deviation of [-.35,0,.35]){
        const app=make('Bracelet');app.facingMode=base.facingMode;step(app,forearmFixture({flex,deviation}));
        assert.equal(app._forearmSource,'elbow/wrist observation');
        near(new THREE.Vector3(0,0,1).applyQuaternion(app._tgtQuat).distanceTo(axis),0);
        near(new THREE.Vector3().setFromMatrixPosition(app._wristContactBody.sourceMatrix).distanceTo(center),0);
        app.close();cases++;
      }
      const fallback=make('Bracelet');step(fallback,forearmFixture({visibility:0}));assert.equal(fallback._forearmSource,'palm estimate');fallback.close();base.close();
    }assert.equal(cases,30);
  });
  await test('Production worker throttles auxiliary poses, clears old generations and survives auxiliary failure',async()=>{
    const output=[],images=[];let time=0,handCost=5,poseCost=20,poseCalls=0,poseClosed=0,handCalls=0;
    const data=forearmFixture();const aux={detectForVideo(){poseCalls++;time+=poseCost;return data.forearmPose;},close(){poseClosed++;}};
    const context=vm.createContext({self:{postMessage:m=>output.push(m),close(){}},performance:{now:()=>time},
      primary:{detectForVideo(){handCalls++;time+=handCost;return data;},close(){}},aux});
    vm.runInContext(await readFile(new URL('../assets/js/ar-tracking-worker.js',import.meta.url),'utf8'),context);
    vm.runInContext('tracker=primary;forearmTracker=aux;initialized=true;',context);
    const frame=async(timestamp,generation=1)=>{
      const bitmap={closes:0,close(){this.closes++;}};images.push(bitmap);
      await context.self.onmessage({data:{type:'frame',bitmap,timestamp,generation,frameId:images.length}});return output.at(-1);
    };
    let result=await frame(0);assert.equal(poseCalls,1);assert.equal(result.result.forearmPose.ageMs,0);assert.equal(result.detectCost,25);
    result=await frame(100);assert.equal(poseCalls,1);assert.equal(result.result.forearmPose.ageMs,100);
    await frame(221);assert.equal(poseCalls,2);
    handCost=50;result=await frame(600);assert.equal(result.result.forearmPose,null);assert.equal(poseCalls,2);
    result=await frame(650,2);assert.equal(result.result.forearmPose,null,'camera generation cannot borrow old elbow data');
    handCost=5;aux.detectForVideo=()=>{throw Error('auxiliary fault');};result=await frame(900,2);
    assert.equal(result.type,'result');assert.equal(result.result.forearmPose,null);assert.equal(poseClosed,1);
    assert.equal(handCalls,6);assert.ok(images.every(image=>image.closes===1));
    await context.self.onmessage({data:{type:'close'}});
  });
  assert.equal(cameraCalls,0);console.log(JSON.stringify({passed:checks.length,checks,cameraCalls}));
}finally{for(const[name,descriptor]of saved){if(descriptor)Object.defineProperty(globalThis,name,descriptor);else delete globalThis[name];}}
