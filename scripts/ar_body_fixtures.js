import * as THREE from "../assets/js/three.module.js";

export function torsoFixture({ yaw = 0, lean = 0, roll = 0, headX = 0, headY = 0, zoom = 1, hipsVisible = true } = {}) {
  const world = Array.from({ length: 33 }, () => new THREE.Vector3());
  for (const [i, x, y, z] of [[0,0,-.60,-.04], [7,-.075,-.575,0], [8,.075,-.575,0],
    [9,-.025,-.55,-.035], [10,.025,-.55,-.035], [11,-.1825,-.35,0], [12,.1825,-.35,0],
    [23,-.13,0,0], [24,.13,0,0]]) world[i].set(x,y,z);
  for (const i of [0,7,8,9,10]) { world[i].x+=headX; world[i].y+=headY; }
  const rotation=new THREE.Euler(lean,yaw,roll);
  for (const point of world) point.applyEuler(rotation);
  const landmarks=world.map(point=>({ x:.5+point.x*750*zoom/1280, y:.82+point.y*750*zoom/720,
    z:point.z*750*zoom/1280, visibility:1, presence:1 }));
  if (!hipsVisible) for (const i of [23,24]) { landmarks[i].y=1.2; landmarks[i].visibility=.1; }
  return {landmarks:[landmarks],worldLandmarks:[world]};
}
