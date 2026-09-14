import * as THREE from "../three.module.js";
import { wristOrientation } from "./wrist-contact.js?v=20260912-ar-torso-wrist";
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const valid = p => p && [p.x, p.y, p.z].every(Number.isFinite);
const observed = p => valid(p) && Math.min(p.visibility ?? 0, p.presence ?? 1) >= .75
  && p.x > .01 && p.x < .99 && p.y > .01 && p.y < .99;

// Pose and hand world coordinates have different origins. Only the pose's
// elbow-minus-wrist vector is used; the precise anchor stays on the hand wrist.
export function observeForearm(pose, hand, metrics, mirrored, deliveryAgeMs = 0) {
  const age = (pose?.ageMs ?? Infinity) + Math.max(0, deliveryAgeMs);
  if (!Number.isFinite(age) || age < 0 || age >= 350 || ![0,5,17].every(i=>valid(hand?.[i]))) return null;
  const points = pose.landmarks?.[0], world = pose.worldLandmarks?.[0];
  const width = metrics.drawWidth, height = metrics.drawHeight;
  const palmWidth = Math.hypot((hand[5].x-hand[17].x)*width, (hand[5].y-hand[17].y)*height);
  if (!(palmWidth > 12)) return null;
  const candidates = [];
  for (const [wrist, elbow] of [[15,13],[16,14]]) {
    if (!observed(points?.[wrist]) || !observed(points?.[elbow]) || !valid(world?.[wrist]) || !valid(world?.[elbow])) continue;
    const distance = Math.hypot((points[wrist].x-hand[0].x)*width, (points[wrist].y-hand[0].y)*height);
    if (distance > palmWidth*.65) continue;
    const dx=(points[elbow].x-points[wrist].x)*width*(mirrored?-1:1);
    const dy=-(points[elbow].y-points[wrist].y)*height;
    const screenLength=Math.hypot(dx,dy);
    const v=new THREE.Vector3().subVectors(world[elbow],world[wrist]);
    const length=v.length(), projected=Math.hypot(v.x,v.y);
    if (length<.10 || length>.50 || projected/length<.35 || screenLength<palmWidth*.5) continue;
    const agreement=(dx*v.x*(mirrored?-1:1)-dy*v.y)/(screenLength*projected);
    if (agreement<.7) continue;
    const pitch=Math.asin(clamp(-v.z/length,-.985,.985));
    const axis=new THREE.Vector3(dx/screenLength*Math.cos(pitch),dy/screenLength*Math.cos(pitch),Math.sin(pitch));
    candidates.push({axis,distance,wrist,ageMs:age});
  }
  candidates.sort((a,b)=>a.distance-b.distance);
  if (!candidates.length || (candidates[1] && candidates[1].distance-candidates[0].distance<palmWidth*.25)) return null;
  const best=candidates[0];
  const weight=clamp((350-age)/130,0,1)*clamp((palmWidth*.65-best.distance)/(palmWidth*.30),0,1);
  return {...best,weight};
}

export function fitForearmOrientation(handFrame, observation) {
  const {x,y,pitch,roll}=handFrame;
  if (!observation || observation.weight<=0) return {...handFrame,observed:false};
  const handQuaternion=wristOrientation(x,y,pitch,roll);
  const along=new THREE.Vector3(0,0,1).applyQuaternion(handQuaternion);
  if (along.dot(observation.axis)<-.5) return {...handFrame,observed:false};
  along.lerp(observation.axis,observation.weight).normalize();
  const projected=Math.hypot(along.x,along.y);
  if (projected<.15) return {...handFrame,observed:false};
  // Transfer hand pronation onto the forearm plane without transferring wrist
  // flexion. A degenerate dorsal direction is too uncertain to use.
  const dorsal=new THREE.Vector3(0,1,0).applyQuaternion(handQuaternion);
  dorsal.addScaledVector(along,-dorsal.dot(along));
  if (dorsal.length()<.25) return {...handFrame,observed:false};
  dorsal.normalize();
  const nx=along.x/projected,ny=along.y/projected,newPitch=Math.asin(clamp(along.z,-1,1));
  const side=new THREE.Vector3(-ny,nx,0),up=new THREE.Vector3(-nx*along.z,-ny*along.z,projected);
  const newRoll=Math.atan2(dorsal.dot(side),dorsal.dot(up));
  return {x:nx,y:ny,pitch:newPitch,roll:newRoll,observed:true,weight:observation.weight};
}
