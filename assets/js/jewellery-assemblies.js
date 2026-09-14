import { createGemstoneGeometry, gemstoneOutline } from "./gemstone-geometry.js?v=20260911-construction-v32";
import { solveGemstoneCut } from "./gemstone-cut.js?v=20260911-construction-v32";
import { CUT_DEFAULTS, WORLD_UNITS_PER_MM } from "./jewellery-spec.js?v=20260911-construction-v32";
import { capSweepEnds } from "./sweep-geometry.js?v=20260911-construction-v32";
import { createNecklaceWearPath, createBraceletWearPath } from "./ar/wearable-paths.js?v=20260911-ar-live3";

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
const TAU = Math.PI * 2;

export function resolveAccentSetting(state) {
  return ["Prong", "Bezel", "Channel"].includes(state.accentSetting)
    ? state.accentSetting : state.band === "Channel" ? "Channel" : "Prong";
}

function offsetAccentOutline(outline, distance) {
  const area = outline.reduce((sum, point, index) => {
    const next = outline[(index + 1) % outline.length];
    return sum + point[0] * next[1] - next[0] * point[1];
  }, 0);
  const direction = Math.sign(area);
  const normal = (start, end) => {
    const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
    return [direction * (end[1] - start[1]) / length, direction * (start[0] - end[0]) / length];
  };
  return outline.map((point, index) => {
    const before = normal(outline[(index + outline.length - 1) % outline.length], point);
    const after = normal(point, outline[(index + 1) % outline.length]);
    const divisor = 1 + before[0] * after[0] + before[1] * after[1];
    return point.map((value, axis) => value + distance * (before[axis] + after[axis]) / divisor);
  });
}

export function calibratedAccentStone(reference, diameter, shape = "Round", material = "Clear Diamond") {
  const defaults = CUT_DEFAULTS[shape] || CUT_DEFAULTS.Round;
  const stone = { ...reference, ...defaults, material, shape, widthMm: diameter,
    lengthMm: diameter * (shape === "Baguette" ? 1.65 : 1),
    depthMm: diameter * defaults.totalDepthPct / 100, symmetryMode: "Precision" };
  stone.cutSolution = solveGemstoneCut(stone);
  return stone;
}

export function createArcSampler(THREE, points, closed = false, desiredLength = 0) {
  const curve = new THREE.CatmullRomCurve3(points, closed, "centripetal");
  curve.arcLengthDivisions = 2048;
  const length = curve.getLength();
  const scale = desiredLength > 0 ? desiredLength / length : 1;
  return {
    length: length * scale,
    point: (distance) => curve.getPointAt(clamp(distance / (length * scale), 0, 1)).multiplyScalar(scale),
    tangent: (distance) => curve.getTangentAt(clamp(distance / (length * scale), 0, 1)).normalize()
  };
}

export function createJewelleryAssemblies(THREE, { spec, state, metal, stoneMaterial, wearable = null }) {
  const vector = (horizontal = 0, vertical = 0, depth = 0) => new THREE.Vector3(horizontal, vertical, depth);
  const root = (name) => {
    const group = new THREE.Group();
    group.name = name;
    group.scale.setScalar(WORLD_UNITS_PER_MM);
    group.userData.construction = { version: "3.2", units: "mm", style: state.silhouette, productionValidated: false };
    group.userData.jewellerySpec = spec;
    group.userData.unitsPerMm = WORLD_UNITS_PER_MM;
    return group;
  };
  const mesh = (geometry, material = metal, name = "hardware") => {
    const object = new THREE.Mesh(geometry, material);
    object.name = name;
    object.castShadow = true;
    object.receiveShadow = true;
    object.userData.manufacturing = { role: name };
    return object;
  };
  const wire = (points, radius, closed = false, name = "wire", prong = false, linear = false) => {
    const curve = linear ? new THREE.CurvePath() : new THREE.CatmullRomCurve3(points, closed, "centripetal");
    if (linear) for (let index = 0; index < points.length - (closed ? 0 : 1); index += 1) curve.add(new THREE.LineCurve3(points[index], points[(index + 1) % points.length]));
    const segments = Math.max(prong ? 48 : 12, Math.min(96, points.length * (closed ? 2 : 4)));
    const geometry = new THREE.TubeGeometry(curve, segments, radius, 8, closed);
    const uv = geometry.attributes.uv;
    const length = curve.getLength();
    for (let index = 0; index < uv.count; index += 1) uv.setXY(index, uv.getX(index) * length, uv.getY(index) * TAU * radius);
    if (!closed) capSweepEnds(THREE, geometry, segments, 8, true);
    const object = mesh(geometry, metal, name);
    if (prong) {
      geometry.userData.contactSweep = { axial: segments, radial: 8, repeatedSeam: true };
      object.userData.isProng = true;
    }
    return object;
  };
  const oval = (width, height, radius, name = "jump-ring") => wire(Array.from({ length: 32 }, (_, index) => {
    const angle = index / 32 * TAU;
    return vector(Math.cos(angle) * width / 2, Math.sin(angle) * height / 2);
  }), radius, true, name);
  const box = (width, height, depth, name) => {
    const bevel = Math.min(width, height, depth) * 0.16;
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2 + bevel, -height / 2 + bevel);
    shape.lineTo(width / 2 - bevel, -height / 2 + bevel);
    shape.lineTo(width / 2 - bevel, height / 2 - bevel);
    shape.lineTo(-width / 2 + bevel, height / 2 - bevel);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: depth - 2 * bevel, bevelEnabled: true,
      bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, steps: 1 });
    geometry.translate(0, 0, -depth / 2 + bevel);
    return mesh(geometry, metal, name);
  };
  const orient = (object, point, tangent, normal = vector(0, 0, 1)) => {
    const side = new THREE.Vector3().crossVectors(normal, tangent).normalize();
    const up = new THREE.Vector3().crossVectors(tangent, side).normalize();
    object.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(tangent, side, up));
    object.position.copy(point);
    return object;
  };
  const merge = (objects, name) => {
    const positions = [], normals = [], uvs = [], indices = [];
    for (const object of objects) {
      object.updateMatrix();
      const geometry = object.geometry.clone().applyMatrix4(object.matrix);
      const offset = positions.length / 3;
      positions.push(...geometry.attributes.position.array);
      normals.push(...geometry.attributes.normal.array);
      const uv = geometry.attributes.uv;
      for (let index = 0; index < uv.count; index += 1) uvs.push(uv.getX(index) + object.position.x * 0.37, uv.getY(index) + object.position.y * 0.21);
      if (geometry.index) for (const index of geometry.index.array) indices.push(offset + index);
      else for (let index = 0; index < geometry.attributes.position.count; index += 1) indices.push(offset + index);
      geometry.dispose();
    }
    new Set(objects.map((object) => object.geometry)).forEach((geometry) => geometry.dispose());
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    return mesh(geometry, metal, name);
  };

  function basket(stone, bezel = false, enclosed = false) {
    const group = new THREE.Group();
    group.name = bezel ? "open-back-bezel" : "open-gallery-basket";
    const radius = clamp(stone.widthMm * 0.048, 0.075, 0.30);
    const outline = stone.outlinePointsMm || gemstoneOutline(stone.shape, stone.widthMm, stone.lengthMm);
    const solution = stone.cutSolution;
    const baseZ = -solution.pavilionHeightMm - solution.girdleThicknessMm / 2 - radius - 0.06;
    const gem = mesh(createGemstoneGeometry(THREE, stone, 1), stoneMaterial(stone), "faceted-stone");
    gem.userData.isGem = true;
    gem.userData.gemMaterial = stone.material;
    gem.userData.isAccent = stone !== spec.centerStone;
    group.add(gem);
    if (enclosed) {
      group.userData.baseZ = baseZ;
      group.userData.stoneWidthMm = stone.widthMm;
      return group;
    }
    const ring = (factor, height, wireRadius, name) => wire(outline.map(([horizontal, vertical]) => vector(horizontal * factor, vertical * factor, height)), wireRadius, true, name, false, outline.length <= 8);
    group.add(ring(0.50, -solution.pavilionHeightMm * 0.72, radius, "lower-gallery"));
    group.add(ring(1 + (radius * 2.2 + 0.035) / stone.widthMm, -solution.girdleThicknessMm / 2 - radius, radius, "girdle-gallery"));
    if (bezel) group.add(ring(1 + (radius * 2.2 + 0.035) / stone.widthMm, solution.girdleThicknessMm / 2, radius, "bezel-lip"));
    const cornerCount = stone.shape === "Trillion" ? 3 : 4;
    for (let index = 0; index < cornerCount; index += 1) {
      const angle = TAU * (index + 0.5) / cornerCount;
      const direction = vector(Math.cos(angle), Math.sin(angle));
      let boundary = null, best = Infinity;
      for (const point of outline) {
        const delta = Math.abs(Math.atan2(Math.sin(Math.atan2(point[1], point[0]) - angle), Math.cos(Math.atan2(point[1], point[0]) - angle)));
        if (delta < best) { best = delta; boundary = vector(...point); }
      }
      const outside = boundary.clone().addScaledVector(direction, radius + 0.04);
      const foot = boundary.clone().multiplyScalar(0.50); foot.z = -solution.pavilionHeightMm * 0.72;
      const shoulder = outside.clone(); shoulder.z = -solution.girdleThicknessMm / 2 - radius;
      const tip = boundary.clone().multiplyScalar(0.97); tip.z = solution.girdleThicknessMm / 2 + solution.crownHeightMm * 0.52 + radius;
      group.add(wire([foot, shoulder, bezel ? outside.clone().setZ(0) : tip], radius, false, bezel ? "bezel-support" : "petite-claw", !bezel));
      if (!bezel) {
        const cap = mesh(new THREE.SphereGeometry(radius * 1.04, 12, 8), metal, "rounded-claw-tip");
        cap.position.copy(tip);
        cap.userData.isProng = true;
        group.add(cap);
      }
    }
    group.userData.baseZ = baseZ;
    group.userData.stoneWidthMm = stone.widthMm;
    return group;
  }

  function seatFeet(setting, stone) {
    const radius = clamp(stone.widthMm * 0.06, 0.10, 0.24);
    for (const side of [-1, 1]) setting.add(wire([
      vector(side * stone.widthMm * 0.25, 0, setting.userData.baseZ - radius * 0.4),
      vector(side * stone.widthMm * 0.25, 0, -stone.cutSolution.pavilionHeightMm * 0.72)
    ], radius, false, "shoulder-seat-foot"));
  }

  function chain(group, path, start = 0, end = path.length, type = state.chainType || "Cable", diameter = spec.necklace.wireDiameterMm) {
    const wireRadius = diameter / 2;
    const links = [];
    let distance = start, count = 0;
    const geometryCache = new Map();
    while (distance < end - diameter && count < 2200) {
      const long = type === "Figaro" && count % 4 === 3;
      const length = diameter * (long ? 10 : type === "Box" ? 4.4 : 6.2);
      const width = diameter * (type === "Rope" || type === "Wheat" || type === "Byzantine" ? 4.6 : 3.8);
      const pitch = type === "Snake" || type === "Herringbone" ? diameter * 0.9
        : type === "Rope" ? length * 0.38 : type === "Wheat" ? length * 0.46
        : type === "Byzantine" ? length * 0.42 : length - diameter * 2;
      const center = distance + Math.min(pitch / 2, (end - distance) / 2);
      const key = `${type}:${long}`;
      if (!geometryCache.has(key)) {
        let template;
        if (type === "Herringbone") template = box(diameter * 1.1, diameter * 5.2, diameter * 0.55, "chevron-link");
        else if (type === "Snake") { template = oval(diameter * 3.2, diameter * 3.2, wireRadius * 0.8); template.geometry.rotateY(Math.PI / 2); }
        else if (type === "Box") {
          const halfX = length / 2 - wireRadius, halfY = width / 2 - wireRadius;
          template = wire([vector(-halfX, -halfY), vector(halfX, -halfY), vector(halfX, halfY), vector(-halfX, halfY)], wireRadius, true);
        } else template = oval(length - diameter, width - diameter, wireRadius);
        geometryCache.set(key, template.geometry);
      }
      const link = mesh(geometryCache.get(key));
      const tangent = path.tangent(center);
      orient(link, path.point(center), tangent);
      const roll = type === "Curb" || type === "Figaro" || type === "Mariner" ? (count % 2 ? 0.52 : -0.52)
        : type === "Rope" ? count % 2 * Math.PI / 2 + Math.floor(count / 2) * 0.44
        : type === "Wheat" ? (count % 2 ? 0.95 : -0.95)
        : type === "Byzantine" ? [0, Math.PI / 2, Math.PI / 2, 0][count % 4]
        : type === "Snake" || type === "Herringbone" ? 0 : count % 2 * Math.PI / 2;
      link.rotateX(roll);
      if (type === "Wheat") link.translateY((count % 2 ? 1 : -1) * diameter * 0.42);
      if (type === "Byzantine") link.rotateY(count % 2 ? 0.40 : -0.40);
      links.push(link);
      if (type === "Mariner") {
        const bar = wire([vector(0, -width * 0.32), vector(0, width * 0.32)], wireRadius * 0.8);
        bar.position.copy(link.position); bar.quaternion.copy(link.quaternion); links.push(bar);
      }
      if (type === "Herringbone") {
        link.rotateZ(count % 2 ? 0.34 : -0.34);
      }
      distance += pitch;
      count += 1;
    }
    if (links.length && wearable) {
      const batches = new Map();
      for (const link of links) {
        if (!batches.has(link.geometry)) batches.set(link.geometry, []);
        batches.get(link.geometry).push(link);
      }
      for (const [geometry, objects] of batches) {
        const instances = new THREE.InstancedMesh(geometry, metal, objects.length);
        instances.name = `${type.toLowerCase()}-wearable-links`;
        objects.forEach((object, index) => {
          object.updateMatrix();
          instances.setMatrixAt(index, object.matrix);
        });
        instances.instanceMatrix.needsUpdate = true;
        instances.computeBoundingSphere();
        group.add(instances);
      }
    } else if (links.length) group.add(merge(links, `${type.toLowerCase()}-linked-chain`));
    group.userData.linkCount = (group.userData.linkCount || 0) + count;
    return count;
  }

  function clasp(group, first, second, type = state.clasp || "Lobster", depth = 1.3) {
    const closure = new THREE.Group();
    closure.name = `${type.toLowerCase()}-closure`;
    const span = first.distanceTo(second);
    const tangent = second.clone().sub(first).normalize();
    orient(closure, first.clone().add(second).multiplyScalar(0.5), tangent);
    const radius = clamp(span * 0.034, 0.15, 0.42);
    if (type === "Box" || type === "Hidden") {
      closure.add(box(span * 0.68, depth * 1.6, depth, "box-clasp-shell"));
      const tongue = box(span * 0.40, depth, depth * 0.55, "clasp-tongue"); tongue.position.x = span * 0.35; closure.add(tongue);
      if (type === "Box") for (const side of [-1, 1]) {
        const safety = oval(span * 0.62, radius * 4, radius * 0.65, "figure-eight-safety");
        safety.position.set(span * 0.12, side * depth * 1.12, 0); closure.add(safety);
      }
    } else if (type === "Toggle") {
      closure.add(oval(span * 0.52, span * 0.52, radius, "toggle-eye"));
      const bar = wire([vector(span * 0.25, -span * 0.42, radius * 2), vector(span * 0.25, span * 0.42, radius * 2)], radius * 1.2, false, "toggle-bar"); closure.add(bar);
    } else if (type === "S-Hook") {
      closure.add(wire([vector(-span / 2, 0), vector(-span * 0.32, span * 0.20), vector(0, 0), vector(span * 0.32, -span * 0.20), vector(span / 2, 0)], radius, false, "s-hook"));
    } else {
      const body = oval(span * 0.67, span * (type === "Spring Ring" ? 0.67 : 0.35), radius * 1.3, "clasp-body");
      body.position.x = -span * 0.10; closure.add(body);
      const eye = oval(span * 0.30, span * 0.28, radius, "clasp-end-eye"); eye.position.x = span * 0.37; eye.rotation.x = Math.PI / 2; closure.add(eye);
      const gate = wire([vector(span * 0.04, -span * 0.15), vector(span * 0.25, 0.05)], radius * 0.75, false, "spring-gate"); closure.add(gate);
      const lever = box(span * 0.12, radius * 2, radius * 1.5, "clasp-trigger"); lever.position.set(-span * 0.12, span * 0.20, 0); closure.add(lever);
    }
    for (const side of [-1, 1]) {
      const attachment = oval(radius * 4.2, radius * 3.4, radius * 0.75, "clasp-attachment-eye");
      attachment.position.x = side * span * 0.49;
      closure.add(attachment);
    }
    group.add(closure);
    return closure;
  }

  function pendant(group, anchor, stone = spec.centerStone, bezel = state.setting === "Bezel") {
    const setting = basket(stone, bezel);
    let haloExtent = 0;
    if (state.halo && stone === spec.centerStone) {
      const diameter = clamp(spec.halo.meleeDiameterMm, 0.7, 1.6);
      const haloGap = Math.max(spec.halo.gapMm, clamp(stone.widthMm * 0.048, 0.075, 0.30) * 2 + 0.20);
      haloExtent = diameter + haloGap;
      setting.userData.effectiveHaloGapMm = haloGap;
      const outline = gemstoneOutline(stone.shape, stone.widthMm, stone.lengthMm);
      const path = createArcSampler(THREE, outline.map(([horizontal, vertical], index) => {
        const previous = outline[(index + outline.length - 1) % outline.length];
        const next = outline[(index + 1) % outline.length];
        const incoming = vector(vertical - previous[1], previous[0] - horizontal).normalize();
        const outgoing = vector(next[1] - vertical, horizontal - next[0]).normalize();
        const normal = incoming.clone().add(outgoing).normalize();
        return vector(horizontal, vertical).addScaledVector(normal, (diameter / 2 + haloGap) / Math.max(0.35, normal.dot(outgoing)));
      }), true);
      let count = Math.max(8, Math.floor(path.length / (diameter + 0.28)));
      let locations;
      while (count >= 8) {
        locations = Array.from({ length: count }, (_, index) => path.point(index / count * path.length));
        if (locations.every((point, index) => locations.every((other, otherIndex) => index === otherIndex || point.distanceTo(other) >= diameter + 0.22))) break;
        count -= 1;
      }
      const haloStone = calibratedAccentStone(stone, diameter);
      for (let index = 0; index < count; index += 1) {
        const accent = basket(haloStone);
        accent.position.copy(locations[index]);
        setting.add(accent);
      }
      setting.add(wire(outline.map(([horizontal, vertical]) => vector(horizontal * (1 + haloExtent / stone.widthMm), vertical * (1 + haloExtent / stone.lengthMm), -diameter * 0.50)), 0.14, true, "halo-gallery"));
    }
    const bailHeight = clamp(stone.widthMm * 0.42, 1.6, 3.4);
    const bail = oval(Math.max(spec.necklace.wireDiameterMm * 3.4, 1.0), bailHeight, clamp(stone.widthMm * 0.035, 0.14, 0.26), "pendant-bail");
    bail.position.copy(anchor).add(vector(0, -bailHeight * 0.35, 0));
    setting.position.copy(anchor).add(vector(0, -bailHeight * 0.82 - stone.lengthMm / 2 - haloExtent, 0));
    if (wearable) {
      const joint = new THREE.Group();
      joint.name = "pendant-articulation";
      joint.position.copy(anchor);
      joint.userData.wearableHinge = { limit: 0.20 };
      bail.position.sub(anchor);
      setting.position.sub(anchor);
      joint.add(bail, setting);
      group.add(joint);
    } else group.add(bail, setting);
    return setting;
  }

  function necklace() {
    const group = root("finished-necklace");
    const style = state.silhouette;
    const length = spec.necklace.chainLengthMm;
    const drop = spec.necklace.dropLengthMm;
    const isLariat = style === "Lariat";
    const points = isLariat
      ? [vector(-4, -75), vector(-46, -44), vector(-53, 20, -7), vector(-30, 60, -12), vector(0, 70, -14), vector(30, 60, -12), vector(53, 20, -7), vector(46, -44), vector(4, -75)]
      : [vector(0, 68, -12), vector(-33, 56, -10), vector(-50, 8, -4), vector(-39, -50), vector(0, -78), vector(39, -50), vector(50, 8, -4), vector(33, 56, -10)];
    if (style === "Choker") points.forEach((point) => { point.y *= 0.70; });
    const closureGap = clamp(spec.necklace.wireDiameterMm * 19, 6, 12);
    const samplePath = (desiredLength) => wearable
      ? createNecklaceWearPath(THREE, desiredLength, isLariat, wearable.neckCircumferenceMm || 320)
      : createArcSampler(THREE, points, !isLariat, desiredLength);
    let path = samplePath(isLariat ? length - drop * 2.2 : length);
    const lariatTails = (loop) => {
      const crossing = vector(0, Math.min(loop.point(0).y, loop.point(loop.length).y) - 5, wearable ? loop.point(0).z : 0);
      const tails = [-1, 1].map((side) => {
        const anchor = loop.point(side < 0 ? 0 : loop.length);
        const tip = crossing.clone().add(vector(side * 3.2, -drop * (side < 0 ? 0.72 : 1.20), side * 0.6));
        return { side, tip, path: createArcSampler(THREE, [anchor, crossing.clone().add(vector(side * 0.75, 0, side * 0.3)), tip]) };
      });
      return { crossing, tails };
    };
    if (isLariat) for (let iteration = 0; iteration < 8; iteration += 1) {
      const tailLength = lariatTails(path).tails.reduce((total, tail) => total + tail.path.length, 0);
      path = samplePath(Math.max(180, length - tailLength));
    }
    const start = isLariat ? 0 : closureGap / 2;
    const end = isLariat ? path.length : path.length - closureGap / 2;
    const stations = style === "Station" ? [0.24, 0.37, 0.5, 0.63, 0.76] : [];
    let previous = start;
    for (const fraction of stations) {
      const distance = path.length * fraction;
      const diameter = clamp(spec.centerStone.widthMm * (fraction === 0.5 ? 0.58 : 0.42), 1.7, 4.5);
      const stationStone = calibratedAccentStone(spec.centerStone, diameter, "Round", state.stone);
      const gap = diameter + 1.3;
      chain(group, path, previous, distance - gap / 2);
      const setting = basket(stationStone, true);
      orient(setting, path.point(distance), path.tangent(distance));
      for (const sign of [-1, 1]) {
        const eye = oval(1.1, 0.8, 0.13, "station-eye"); eye.position.x = sign * (diameter / 2 + 0.55); setting.add(eye);
      }
      group.add(setting);
      previous = distance + gap / 2;
    }
    chain(group, path, previous, end);
    if (!isLariat) clasp(group, path.point(end), path.point(start));
    if (isLariat) {
      const { crossing, tails } = lariatTails(path);
      const slider = oval(2.8, 3.6, 0.30, "lariat-slider"); slider.position.copy(crossing); group.add(slider);
      for (const { side, tip, path: tail } of tails) {
        chain(group, tail);
        pendant(group, tip, side > 0 ? spec.centerStone : calibratedAccentStone(spec.centerStone, spec.centerStone.widthMm * 0.55, "Round", state.stone));
      }
      group.userData.construction.totalChainPathMm = path.length + tails.reduce((total, tail) => total + tail.path.length, 0);
    } else if (style !== "Station") {
      const anchor = path.point(path.length / 2);
      if (style === "Y-Drop") {
        const junction = oval(1.8, 2.0, 0.18, "y-junction"); junction.position.copy(anchor); group.add(junction);
        const tip = anchor.clone().add(vector(1.0, -drop, 0.7));
        chain(group, createArcSampler(THREE, [anchor, anchor.clone().lerp(tip, 0.5).add(vector(-0.6)), tip]));
        pendant(group, tip);
      } else pendant(group, anchor);
    }
    group.userData.construction.chainLengthMm = length;
    if (wearable) group.userData.wearableNeck = {
      radiusMm: path.neckRadiusMm, depthMm: path.neckDepthMm, fits: path.fits,
      circumferenceMm: wearable.neckCircumferenceMm || 320, anchorMm: [0, 0, 0]
    };
    group.userData.construction.layout = "arc-length-spaced-complete-necklace";
    return group;
  }

  function bracelet() {
    const group = root("finished-bracelet");
    const style = state.silhouette;
    const flexible = style === "Tennis" || style === "Station";
    const thickness = spec.bracelet.tubeDiameterMm;
    const width = spec.bracelet.widthMm;
    const radius = spec.bracelet.innerDiameterMm / 2 + thickness / 2;
    const path = wearable && flexible ? createBraceletWearPath(THREE, spec.bracelet.lengthMm, wearable.wristWidthMm || 55) : createArcSampler(THREE, Array.from({ length: 32 }, (_, index) => {
      const angle = Math.PI / 2 + index / 32 * TAU;
      return vector(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.80);
    }), true, flexible ? spec.bracelet.lengthMm : 0);
    const outward = (distance) => { const tangent = path.tangent(distance); return vector(tangent.y, -tangent.x, 0).normalize(); };
    const mount = (setting, distance, offset = 0) => orient(setting, path.point(distance).addScaledVector(outward(distance), offset), path.tangent(distance), outward(distance));
    if (style === "Tennis") {
      const diameter = spec.bracelet.stoneDiameterMm;
      const gap = Math.max(6, diameter * 2.0);
      const usable = path.length - gap;
      const count = Math.max(12, Math.floor(usable / (diameter + 0.55)));
      const pitch = usable / count;
      const stone = calibratedAccentStone(spec.centerStone, diameter, "Round", state.stone);
      for (let index = 0; index < count; index += 1) {
        const distance = gap / 2 + (index + 0.5) * pitch;
        const setting = basket(stone);
        mount(setting, distance, -setting.userData.baseZ);
        for (const sign of [-1, 1]) {
          for (const lateral of sign > 0 ? [-0.23, 0.23] : [0]) {
            const hinge = oval(0.7, 0.7, 0.10, "articulated-knuckle");
            hinge.rotation.x = Math.PI / 2;
            hinge.position.set(sign * pitch / 2, lateral, setting.userData.baseZ + 0.5);
            setting.add(hinge);
          }
          const axle = wire([vector(sign * pitch / 2, -0.37, setting.userData.baseZ + 0.5), vector(sign * pitch / 2, 0.37, setting.userData.baseZ + 0.5)], 0.09, false, "hinge-pin");
          if (sign > 0) setting.add(axle);
          else axle.geometry.dispose();
        }
        group.add(setting);
      }
      const closure = clasp(group, path.point(path.length - gap / 2), path.point(gap / 2), "Box", diameter * 0.62);
      closure.rotateX(Math.PI / 2);
      group.userData.construction.stoneCount = count;
      group.userData.construction.pitchMm = pitch;
    } else if (style === "Station") {
      const gap = 6;
      const count = 5;
      const diameter = spec.bracelet.stoneDiameterMm;
      let previous = gap / 2;
      for (let index = 0; index < count; index += 1) {
        const distance = gap / 2 + (index + 0.5) * (path.length - gap) / count;
        const stationGap = diameter + 1.4;
        chain(group, path, previous, distance - stationGap / 2);
        const setting = basket(calibratedAccentStone(spec.centerStone, diameter, "Round", state.stone), true);
        mount(setting, distance, -setting.userData.baseZ * 0.5);
        for (const sign of [-1, 1]) {
          const eye = oval(1.2, 0.85, 0.14, "station-eye"); eye.position.set(sign * (diameter / 2 + 0.55), 0, setting.userData.baseZ * 0.5); setting.add(eye);
        }
        group.add(setting);
        previous = distance + stationGap / 2;
      }
      chain(group, path, previous, path.length - gap / 2);
      clasp(group, path.point(path.length - gap / 2), path.point(gap / 2));
    } else {
      const gap = style === "Cuff" ? spec.bracelet.cuffGapMm : 0.65;
      const start = gap / 2, end = path.length - gap / 2;
      const profile = [];
      for (let index = 0; index < 24; index += 1) {
        const angle = index / 24 * TAU;
        const signedPower = (value) => Math.sign(value) * Math.pow(Math.abs(value), 0.38);
        profile.push([signedPower(Math.cos(angle)) * thickness / 2, signedPower(Math.sin(angle)) * width / 2]);
      }
      const positions = [], indices = [], uvs = [];
      const segments = 220;
      for (let row = 0; row <= segments; row += 1) {
        const distance = start + (end - start) * row / segments;
        const point = path.point(distance), normal = outward(distance);
        const taper = style === "Cuff" ? 0.70 + Math.sin(row / segments * Math.PI) * 0.30 : 1;
        for (const [radial, axial] of profile) {
          const vertex = point.clone().addScaledVector(normal, radial);
          vertex.z = axial * taper;
          positions.push(...vertex.toArray()); uvs.push(distance, axial);
        }
        if (row < segments) for (let corner = 0; corner < profile.length; corner += 1) {
          const first = row * profile.length + corner, second = row * profile.length + (corner + 1) % profile.length;
          indices.push(first, first + profile.length, second, second, first + profile.length, second + profile.length);
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices); geometry.computeVertexNormals();
      capSweepEnds(THREE, geometry, segments, profile.length);
      group.add(mesh(geometry, metal, style === "Cuff" ? "tapered-oval-cuff" : "oval-comfort-bangle"));
      if (style !== "Cuff") {
        const closure = clasp(group, path.point(end - 2), path.point(start + 2), "Hidden", width * 0.55);
        closure.rotateX(Math.PI / 2);
        const hinge = oval(thickness * 0.6, thickness * 0.6, thickness * 0.22, "bangle-hinge");
        mount(hinge, path.length / 2); hinge.scale.y = width / thickness; group.add(hinge);
      }
      if (state.accent) {
        const diameter = Math.min(spec.bracelet.stoneDiameterMm, width * 0.64);
        const distances = style === "Cuff" ? [start + diameter, end - diameter]
          : Array.from({ length: 9 }, (_, index) => path.length / 2 + (index - 4) * (diameter + 0.40));
        for (const distance of distances) {
          const setting = basket(calibratedAccentStone(spec.centerStone, diameter, "Round", state.stone), true);
          seatFeet(setting, calibratedAccentStone(spec.centerStone, diameter, "Round", state.stone));
          mount(setting, distance, thickness / 2 - setting.userData.baseZ); group.add(setting);
        }
      }
    }
    group.userData.construction.layout = flexible ? "articulated-oval-wrist" : "rounded-rectangular-oval-section";
    group.userData.construction.lengthMm = path.length;
    group.userData.wearableBracelet = {
      majorRadiusMm: path.radiusMm ?? Math.abs(path.point(path.length / 4).x),
      minorRadiusMm: path.depthMm ?? Math.abs(path.point(0).y),
      wristWidthMm: path.wristWidthMm || null, fits: path.fits !== false,
      flexible, lengthMm: path.length
    };
    if (style === "Cuff") group.rotation.z = Math.PI;
    return group;
  }

  function ringAccents(geometry) {
    const group = root("shoulder-settings");
    const style = state.band;
    const accentSetting = resolveAccentSetting(state);
    const material = state.accentStone === "Match Center" ? state.stone : "Clear Diamond";
    const bandRadius = geometry.bandOuterR / WORLD_UNITS_PER_MM;
    const bandWidth = geometry.bandHeight / WORLD_UNITS_PER_MM;
    const special = style === "Three-Stone" || style === "Tapered Baguette";
    const doubleRow = style === "Pavé" && bandWidth > 3.3 && accentSetting !== "Channel";
    const diamondWidth = special ? clamp(spec.centerStone.widthMm * 0.48, 1.8, 4.3)
      : clamp(bandWidth * (doubleRow ? 0.35 : 0.66), 0.8, 2.0);
    const shape = style === "Tapered Baguette" ? "Baguette" : "Round";
    const stone = calibratedAccentStone(spec.centerStone, diamondWidth, shape, material);
    if (shape === "Baguette") {
      const halfWidth = stone.widthMm / 2, halfLength = stone.lengthMm / 2;
      stone.outlinePointsMm = [[-halfWidth * 0.55, -halfLength], [halfWidth * 0.55, -halfLength], [halfWidth, halfLength], [-halfWidth, halfLength]];
    }
    const headWidth = (state.halo ? geometry.haloHalfW + geometry.haloStoneR : geometry.gemHalfW) / WORLD_UNITS_PER_MM;
    const tangentSize = shape === "Baguette" ? stone.lengthMm : diamondWidth;
    const excluded = Math.asin(clamp((headWidth + tangentSize * 0.6 + 0.35) / bandRadius, 0, 0.92));
    const shouldBuild = state.accent || ["Pavé", "Channel", "Eternity", "Three-Stone", "Tapered Baguette"].includes(style);
    if (!shouldBuild) return group;
    const wallThickness = clamp(diamondWidth * 0.085, 0.12, 0.24);
    const rowOffset = accentSetting === "Bezel" ? (diamondWidth + wallThickness * 2 + 0.14) / 2 : diamondWidth * 0.60;
    const rows = doubleRow ? [-rowOffset, rowOffset] : [0];
    const spacing = Math.max(state.accentDensity === "Sparse" ? 0.6 : 0.22, accentSetting === "Bezel" ? wallThickness * 2 + 0.14 : 0);
    const pitch = tangentSize + spacing;
    const endAngle = state.accentDensity === "Dense" ? 1.65 : 1.32;
    const span = Math.max(0, endAngle - excluded);
    const count = special ? 1 : Math.max(1, Math.floor(span * bandRadius / pitch) + 1);
    const angles = style === "Eternity"
      ? Array.from({ length: Math.floor((TAU - excluded * 2) * bandRadius / pitch) }, (_, index) => index)
      : [];
    if (style === "Eternity") {
      const total = angles.length;
      for (let index = 0; index < total; index += 1) angles[index] = Math.PI / 2 + excluded + index * (TAU - excluded * 2) / Math.max(1, total - 1);
    } else for (const side of [-1, 1]) for (let index = 0; index < count; index += 1) angles.push(Math.PI / 2 + side * (excluded + index * pitch / bandRadius));
    for (const lateral of rows) for (const angle of angles) {
      const setting = basket(stone, accentSetting === "Bezel", accentSetting === "Bezel");
      if (accentSetting === "Channel") {
        for (const child of setting.children.filter((child) => child.userData.isProng)) {
          setting.remove(child); child.geometry.dispose();
        }
      }
      if (accentSetting === "Bezel") {
        const outline = stone.outlinePointsMm || gemstoneOutline(stone.shape, stone.widthMm, stone.lengthMm);
        const inner = offsetAccentOutline(outline, 0.025);
        const outer = offsetAccentOutline(outline, 0.025 + wallThickness);
        const sleeve = new THREE.Shape(outer.map((point) => new THREE.Vector2(...point)));
        sleeve.holes.push(new THREE.Path([...inner].reverse().map((point) => new THREE.Vector2(...point))));
        const bottom = setting.userData.baseZ - 0.12;
        const top = stone.cutSolution.girdleThicknessMm / 2;
        const sleeveGeometry = new THREE.ExtrudeGeometry(sleeve, { depth: top - bottom, bevelEnabled: false, steps: 1 });
        sleeveGeometry.translate(0, 0, bottom);
        setting.add(mesh(sleeveGeometry, metal, "enclosing-bezel-wall"));
        const lip = offsetAccentOutline(outline, 0.025 + wallThickness / 2);
        setting.add(wire(lip.map((point) => vector(...point, top)), wallThickness / 2, true, "bezel-lip", false, outline.length <= 8));
      } else seatFeet(setting, stone);
      setting.userData.accentSetting = accentSetting;
      const normal = vector(Math.cos(angle), Math.sin(angle), 0);
      const tangent = vector(-Math.sin(angle), Math.cos(angle), 0);
      const radial = bandRadius - geometry.bandWidth / WORLD_UNITS_PER_MM * 0.5 * (1 - Math.sqrt(Math.max(0, 1 - (lateral * 2 / bandWidth) ** 2)));
      orient(setting, normal.clone().multiplyScalar(radial - setting.userData.baseZ).setZ(lateral), tangent, normal);
      if (shape === "Baguette") setting.rotateZ(angle < Math.PI / 2 ? Math.PI / 2 : -Math.PI / 2);
      group.add(setting);
    }
    if (accentSetting === "Channel") {
      const railRadius = clamp(diamondWidth * 0.11, 0.11, 0.22);
      const baseZ = -stone.cutSolution.pavilionHeightMm - stone.cutSolution.girdleThicknessMm / 2 - clamp(stone.widthMm * 0.048, 0.075, 0.30) - 0.06;
      const arcs = style === "Eternity" ? [[Math.PI / 2 + excluded, Math.PI / 2 + TAU - excluded]]
        : [-1, 1].map((side) => {
          const limits = [excluded - pitch / bandRadius * 0.42, excluded + pitch / bandRadius * (count - 0.58)];
          return limits.map((angle) => Math.PI / 2 + side * angle).sort((first, second) => first - second);
        });
      for (const [start, end] of arcs) for (const lateral of [-1, 1]) {
        const points = Array.from({ length: 40 }, (_, index) => {
          const angle = start + index / 39 * (end - start);
          const radius = bandRadius - baseZ + stone.cutSolution.girdleThicknessMm / 2;
          return vector(Math.cos(angle) * radius, Math.sin(angle) * radius, lateral * (diamondWidth / 2 + railRadius + 0.03));
        });
        group.add(wire(points, railRadius, false, "continuous-channel-wall"));
        if (state.accentSetting === "Channel") {
          const upperRadius = bandRadius - baseZ + stone.cutSolution.girdleThicknessMm / 2;
          const wall = new THREE.Shape();
          wall.absarc(0, 0, upperRadius, start, end, false);
          wall.absarc(0, 0, bandRadius - 0.12, end, start, true);
          wall.closePath();
          const wallGeometry = new THREE.ExtrudeGeometry(wall, { depth: railRadius * 2, bevelEnabled: false, curveSegments: 48, steps: 1 });
          wallGeometry.translate(0, 0, lateral * (diamondWidth / 2 + railRadius + 0.03) - railRadius);
          group.add(mesh(wallGeometry, metal, "channel-shoulder-wall"));
        }
      }
    }
    group.userData.construction.stoneCount = angles.length * rows.length;
    group.userData.construction.accentMaterial = material;
    group.userData.construction.accentSetting = accentSetting;
    return group;
  }
  return { necklace, bracelet, ringAccents, basket };
}
