import * as THREE from '../assets/js/three.module.js';
import { handFixture } from './ar_contact_fixtures.js';

export function forearmFixture({flex=0,deviation=0,ageMs=0,visibility=1,poseOrigin=[2,3,4]}={}) {
  const hand=handFixture({pitch:flex,roll:deviation});
  hand.landmarks[0]=hand.worldLandmarks[0].map(p=>({x:.5+p.x*900/1280,y:.43+p.y*900/720,z:p.z*900/1280}));
  const points=Array.from({length:33},()=>({x:0,y:0,z:0,visibility:0,presence:0}));
  const world=Array.from({length:33},()=>new THREE.Vector3(...poseOrigin));
  points[16]={...hand.landmarks[0][0],visibility,presence:visibility};
  points[14]={x:.5,y:.43+.24*900/720,z:.02*900/1280,visibility,presence:visibility};
  world[14].add(new THREE.Vector3(0,.24,.02));
  hand.forearmPose={landmarks:[points],worldLandmarks:[world],ageMs};
  return hand;
}
