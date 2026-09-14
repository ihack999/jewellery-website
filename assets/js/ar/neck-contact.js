import * as THREE from "../three.module.js";

export function neckOrientation(right, up, yaw, lean, roll = 0) {
  const cr=Math.cos(roll),sr=Math.sin(roll),cy=Math.cos(yaw),sy=Math.sin(yaw);
  const across=new THREE.Vector3((right.x*cr+up.x*sr)*cy,(right.y*cr+up.y*sr)*cy,sy).normalize();
  const vertical=new THREE.Vector3(-right.x*sr+up.x*cr,-right.y*sr+up.y*cr,0).normalize();
  const front=new THREE.Vector3().crossVectors(across,vertical).normalize();
  vertical.multiplyScalar(Math.cos(lean)).addScaledVector(front,Math.sin(lean)).normalize();
  front.crossVectors(across,vertical).normalize();across.crossVectors(vertical,front).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(across,vertical,front));
}

// A scene-owned body estimate, never scaled or translated by jewellery fit
// controls. Coordinates are relative to the calibrated throat anchor.
export class NeckContactBody extends THREE.Mesh {
  constructor() {
    const geometry=new THREE.LatheGeometry([
      new THREE.Vector2(0,-.035),new THREE.Vector2(.65,-.025),
      new THREE.Vector2(1,0),new THREE.Vector2(1,.06),
      new THREE.Vector2(.94,.12),new THREE.Vector2(0,.12)
    ],48);
    super(geometry,new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:true}));
    this.name='rounded-neck-depth-proxy';this.renderOrder=-100;this.frustumCulled=false;
    this.matrixAutoUpdate=false;this.visible=false;this.valid=false;
    this.sourceMatrix=new THREE.Matrix4();
  }
  updateSource(anchor,orientation,unitsPerMeter,radius,depth) {
    this.valid=[...anchor.toArray(),...orientation.toArray(),unitsPerMeter,radius,depth].every(Number.isFinite)
      && unitsPerMeter>0 && radius>.02 && radius<.12 && depth>.015 && depth<.10;
    this.visible=false;if(!this.valid)return;
    const center=new THREE.Vector3(0,0,-depth*unitsPerMeter).applyQuaternion(orientation).add(anchor);
    this.sourceMatrix.compose(center,orientation,new THREE.Vector3(radius*unitsPerMeter,unitsPerMeter,depth*unitsPerMeter));
  }
  syncDisplay(correction,visible) {
    this.visible=this.valid&&visible;if(!this.visible)return;
    this.matrix.multiplyMatrices(correction,this.sourceMatrix);this.matrixWorldNeedsUpdate=true;
  }
  dispose(){this.removeFromParent();this.geometry.dispose();this.material.dispose();}
}

export function neckContactWeight(sidePx,liftPx,pixelsPerMeter,fit,rollDegrees) {
  const distance=Math.hypot(sidePx,liftPx)/Math.max(1,pixelsPerMeter);
  const separation=distance/.015+Math.abs(fit-1)*4+Math.abs(rollDegrees)/30;
  return Math.max(0,1-separation)**2;
}
