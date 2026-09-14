import * as THREE from './three.module.js';
import { metalReflectanceColor, metalFinishParameters } from './jewellery-materials.js?v=20260912-metals';
import { createGemstoneGeometry } from './gemstone-geometry.js?v=20260911-construction-v32';
import { buildJewellerySpec } from './jewellery-spec.js?v=20260911-construction-v32';
import { installGemRayMaterial, disposeGemRayMaterial } from './gem-ray-material.js?v=20260911-construction-v32';

// One opt-in concept viewer; no catalogue model claims and no camera access.
export async function createMaterialStudy(canvas, onLost, { signal } = {}) {
  signal?.throwIfAborted();
  const compact = matchMedia('(pointer: coarse)').matches || innerWidth < 768;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.1;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 40);
  camera.position.set(0, .3, 6.1);
  camera.lookAt(0, .1, 0);
  const group = new THREE.Group();
  scene.add(group);
  const metal = new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: .105 });
  const band = new THREE.Mesh(new THREE.TorusGeometry(1, .135, 32, 128), metal);
  band.position.y = -.24;
  group.add(band);
  // A low, rounded cup seats into the shank; the lip encloses the girdle.
  const profile = [[.15,.835],[.19,.86],[.245,.91],[.3,.97],[.35,1.03],[.39,1.095],[.425,1.16],[.439,1.21],[.44,1.238],[.433,1.255],[.417,1.264],[.4,1.257],[.392,1.244],[.39,1.21],[.375,1.16],[.34,1.10],[.28,1.035],[.22,.97],[.15,.91],[.15,.835]];
  const bezel = new THREE.Mesh(new THREE.LatheGeometry(profile.map(([x,y]) => new THREE.Vector2(x,y)), 96), metal);
  group.add(bezel);
  const spec = buildJewellerySpec({ piece: 'Ring', shape: 'Round', size: '1', stone: 'Clear Diamond', setting: 'Bezel' });
  const geometry = createGemstoneGeometry(THREE, spec.centerStone, .12);
  const stone = new THREE.Mesh(geometry, new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .015, metalness: 0, transmission: 1, thickness: .5, ior: 2.417, attenuationDistance: 3, attenuationColor: 0xffffff, envMapIntensity: 1.25 }));
  stone.rotation.x = -Math.PI / 2;
  stone.position.y = 1.245;
  group.add(stone);
  const key = new THREE.DirectionalLight(0xfff1dd, 3.5);
  key.position.set(-3, 4, 5);
  const rim = new THREE.DirectionalLight(0xc8dcff, 2);
  rim.position.set(4, 2, -2);
  scene.add(key, rim, new THREE.HemisphereLight(0xffffff, 0x332526, .65));
  let environment;
  let pmremTarget;
  let frame = 0;
  let visible = true;
  let disposed = false;
  let rotating = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lastTime = 0;
  let yaw = -.35;
  let pitch = .6;
  let distance = 6.1;
  const pointers = new Map();
  let pinch = 0;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    observer?.disconnect();
    resizeObserver?.disconnect();
    document.removeEventListener('visibilitychange', resume);
    motion.removeEventListener('change', motionChanged);
    canvas.removeEventListener('pointerdown', down);
    canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerup', up);
    canvas.removeEventListener('pointercancel', up);
    canvas.removeEventListener('keydown', keyboard);
    canvas.removeEventListener('webglcontextlost', lost);
    signal?.removeEventListener('abort', cleanup);
    disposeGemRayMaterial(stone);
    group.traverse((node) => node.geometry?.dispose());
    stone.material.dispose();
    metal.dispose();
    pmremTarget?.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.width = canvas.height = 1;
  };
  let observer;
  let resizeObserver;
  function draw(time) {
    frame = 0;
    if (disposed || !visible || document.hidden || renderer.getContext().isContextLost()) { lastTime = 0; return; }
    const delta = lastTime ? Math.min((time-lastTime)/1000, .05) : 0;
    lastTime = time;
    if (rotating && !motion.matches && !pointers.size) yaw += delta * .16;
    group.rotation.set(pitch, yaw, 0);
    camera.position.z = distance;
    renderer.render(scene, camera);
    if (rotating && !motion.matches) frame = requestAnimationFrame(draw);
  }
  function resume() { if (!frame && !disposed) frame = requestAnimationFrame(draw); }
  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(width)), h = Math.max(1, Math.round(height));
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, compact ? 1.5 : 2, Math.sqrt(650000/(w*h))));
    renderer.setSize(w, h, false);
    camera.aspect = w/h;
    camera.zoom = Math.min(1, camera.aspect/.9);
    camera.updateProjectionMatrix();
    resume();
  }
  function lost(event) { event.preventDefault(); cleanup(); onLost(); }
  function down(event) {
    if (event.button !== 0) return;
    pointers.set(event.pointerId, [event.clientX,event.clientY]);
    canvas.setPointerCapture(event.pointerId);
    pinch = pointers.size === 2 ? Math.hypot(...[0,1].map(i => [...pointers.values()][0][i]-[...pointers.values()][1][i])) : 0;
  }
  function move(event) {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    const deltaX = event.clientX-previous[0], deltaY = event.clientY-previous[1];
    pointers.set(event.pointerId,[event.clientX,event.clientY]);
    if (pointers.size === 2) {
      const [a,b]=[...pointers.values()];const next=Math.hypot(a[0]-b[0],a[1]-b[1]);
      if (pinch) distance = THREE.MathUtils.clamp(distance-(next-pinch)*.013,4.5,8);
      pinch=next;
    } else { yaw += deltaX*.009; pitch=THREE.MathUtils.clamp(pitch+deltaY*.007,-1.1,1.3); }
    resume();
  }
  function up(event) { pointers.delete(event.pointerId); pinch=0; }
  function keyboard(event) {
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','Home'].includes(event.key)) return;
    event.preventDefault();
    if(event.key==='ArrowLeft')yaw-=.12;
    if(event.key==='ArrowRight')yaw+=.12;
    if(event.key==='ArrowUp')pitch=Math.min(1.3,pitch+.12);
    if(event.key==='ArrowDown')pitch=Math.max(-1.1,pitch-.12);
    if(event.key==='+')distance=Math.max(4.5,distance-.3);
    if(event.key==='-')distance=Math.min(8,distance+.3);
    if(event.key==='Home'){yaw=-.35;pitch=.6;distance=6.1;}
    resume();
  }
  function motionChanged() { if (motion.matches) rotating=false; resume(); }
  canvas.addEventListener('webglcontextlost',lost);
  signal?.addEventListener('abort',cleanup,{once:true});
  try {
    try {
      const { RGBELoader } = await import('./RGBELoader.js');
      signal?.throwIfAborted();
      const hdr = await new RGBELoader().loadAsync('/assets/textures/studio_small_08_1k.hdr');
      if (disposed) { hdr.dispose(); throw new Error('The material study was closed.'); }
      const pmrem = new THREE.PMREMGenerator(renderer);
      try { pmremTarget = pmrem.fromEquirectangular(hdr); environment=pmremTarget.texture; }
      finally { hdr.dispose(); pmrem.dispose(); }
    } catch {
      if (disposed) throw new Error('The material study was closed.');
      const room=new THREE.Scene();room.background=new THREE.Color(0x222222);
      room.add(new THREE.Mesh(new THREE.BoxGeometry(8,8,8),new THREE.MeshBasicMaterial({color:0x555555,side:THREE.BackSide})));
      for(const x of [-2,2]){const panel=new THREE.Mesh(new THREE.PlaneGeometry(2,4),new THREE.MeshBasicMaterial({color:0xffffff}));panel.position.set(x,1,-3);room.add(panel);}
      const pmrem=new THREE.PMREMGenerator(renderer);
      try {pmremTarget=pmrem.fromScene(room);environment=pmremTarget.texture;}
      finally {pmrem.dispose();room.traverse(n=>{n.geometry?.dispose();n.material?.dispose();});}
    }
    scene.environment=environment;
    const original=installGemRayMaterial(THREE,stone,{bounces:8,strength:.8});
    if(original)original.dispose();
    metal.color.copy(metalReflectanceColor(THREE,'Yellow Gold','18K'));
    observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)resume();});observer.observe(canvas);
    resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);
    document.addEventListener('visibilitychange',resume);
    motion.addEventListener('change',motionChanged);
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);
    canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
    canvas.addEventListener('keydown',keyboard);
    resize();
    return {
      update(state) {
        metal.color.copy(metalReflectanceColor(THREE,state.metal,'18K'));
        metal.roughness=metalFinishParameters(state.finish).roughness;
        const warm=state.light==='Evening';
        key.color.set(warm?0xffd1a0:0xfff1dd);key.intensity=warm?2.8:3.5;
        rim.color.set(warm?0xffdfcb:0xc8dcff);
        renderer.toneMappingExposure = warm ? .95 : 1.1;
        resume();
      },
      rotate(enabled){rotating=enabled&&!motion.matches;resume();},
      reset(){yaw=-.35;pitch=.6;distance=6.1;resume();},
      zoom(amount){distance=THREE.MathUtils.clamp(distance+amount,4.5,8);resume();},
      destroy:cleanup
    };
  } catch(error) {cleanup();throw error;}
}
