const METAL_COLORS = {
  "White Gold": "#e8eef1",
  Platinum: "#d9e1e5",
  "Yellow Gold": "#d5a647",
  "Rose Gold": "#c98778"
};

const FINISH_SETTINGS = {
  "High Polish": {
    roughness: 0.14,
    clearcoat: 0.82
  },
  "Soft Satin": {
    roughness: 0.46,
    clearcoat: 0.24
  },
  "Milgrain Edge": {
    roughness: 0.2,
    clearcoat: 0.58
  }
};

const STONE_COLORS = {
  "Clear Diamond": "#f7fbff",
  "Blush Sapphire": "#f3a7bb",
  "Blue Sapphire": "#5b89d7",
  "Emerald Green": "#4da77a"
};

const PIECE_MAP = {
  ring: "Ring",
  rings: "Ring",
  necklace: "Necklace",
  necklaces: "Necklace",
  bracelet: "Bracelet",
  bracelets: "Bracelet",
  earring: "Earrings",
  earrings: "Earrings"
};

function normalizePiece(value) {
  if (!value) {
    return "";
  }

  return PIECE_MAP[value.trim().toLowerCase().replace(/[^a-z]/g, "")] || "";
}

function getWeightLabel(value) {
  const weight = Number(value) || 1;

  if (weight < 0.95) {
    return "Fine";
  }

  if (weight > 1.18) {
    return "Statement";
  }

  return "Classic";
}

function createSummary(state) {
  const details = [
    `${state.piece}`,
    `${state.metal} with ${state.finish}`,
    `${state.setting} setting`,
    `${getWeightLabel(state.weight).toLowerCase()} proportion`,
    `${state.size} ct feel ${state.stone}`,
    `${state.shape} stone`,
    state.halo ? "halo detail" : "no halo",
    state.accent ? "accent stones" : "clean setting"
  ];

  if (state.engraving) {
    details.push(`engraving: ${state.engraving}`);
  }

  return details.join(" | ");
}

function getState(root) {
  const field = (name) => root.querySelector(`[data-designer-field="${name}"]`);
  const checked = (name) => root.querySelector(`[data-designer-field="${name}"]:checked`);

  return {
    piece: field("piece")?.value || "Ring",
    metal: checked("metal")?.value || "White Gold",
    setting: field("setting")?.value || "Prong",
    finish: field("finish")?.value || "High Polish",
    shape: field("shape")?.value || "Round",
    stone: field("stone")?.value || "Clear Diamond",
    size: field("size")?.value || "1.2",
    weight: field("weight")?.value || "1",
    halo: Boolean(field("halo")?.checked),
    accent: Boolean(field("accent")?.checked),
    engraving: field("engraving")?.value.trim() || ""
  };
}

function setInitialPiece(root) {
  const params = new URLSearchParams(window.location.search);
  const selectedPiece = normalizePiece(params.get("piece") || params.get("piece-type"));
  const pieceField = root.querySelector('[data-designer-field="piece"]');

  if (selectedPiece && pieceField) {
    pieceField.value = selectedPiece;
  }
}

function fillRequestForm(state) {
  const setValue = (selector, value) => {
    const field = document.querySelector(selector);

    if (!field) {
      return;
    }

    field.value = value;
    field.dispatchEvent(new Event("change", { bubbles: true }));
    field.closest(".form-field")?.classList.add("is-prefilled");
  };
  const summary = createSummary(state);
  const description = document.querySelector("#description");
  const hiddenSummary = document.querySelector("[data-design-summary-field]");

  setValue("#piece-type", state.piece);
  setValue("#metal-preference", `${state.metal}, ${state.finish}`);
  setValue("#stone-preference", `${state.size} ct feel ${state.stone}, ${state.shape}`);
  setValue("#finish-preference", `${state.setting} setting, ${state.halo ? "halo detail" : "no halo"}, ${state.accent ? "accent stones" : "clean setting"}`);
  setValue("#dimensions", `${state.piece} designer scale: ${state.size} ct feel, ${getWeightLabel(state.weight).toLowerCase()} proportion`);

  if (hiddenSummary) {
    hiddenSummary.value = summary;
  }

  if (description) {
    const existing = description.value.replace(/\n*\[Design Studio\][\s\S]*$/u, "").trim();
    description.value = `${existing ? `${existing}\n\n` : ""}[Design Studio]\n${summary}`;
    description.closest(".form-field")?.classList.add("is-prefilled");
  }

  document.querySelector("#request-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function drawFallback(canvas, state) {
  const context = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(Math.round(rect.width), 640);
  const height = Math.max(Math.round(rect.height), 420);
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);

  const metal = METAL_COLORS[state.metal];
  const stone = STONE_COLORS[state.stone];
  const weight = Number(state.weight) || 1;
  const cx = width / 2;
  const cy = height / 2;
  const glow = context.createRadialGradient(cx, cy, 20, cx, cy, Math.min(width, height) * 0.5);
  glow.addColorStop(0, "rgba(255,255,255,0.24)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = metal;
  context.fillStyle = stone;
  context.shadowColor = "rgba(255,255,255,0.5)";
  context.shadowBlur = 22;

  if (state.piece === "Ring") {
    context.lineWidth = 22 * weight;
    context.beginPath();
    context.ellipse(cx, cy + 36, 142, 102, 0, 0, Math.PI * 2);
    context.stroke();
    drawFallbackStone(context, cx, cy - 90, 54, state.shape, stone);
  } else if (state.piece === "Necklace") {
    context.lineWidth = 12 * weight;
    context.beginPath();
    context.arc(cx, cy - 90, 230, 0.2 * Math.PI, 0.8 * Math.PI);
    context.stroke();
    drawFallbackStone(context, cx, cy + 95, 58, state.shape, stone);
  } else if (state.piece === "Bracelet") {
    context.lineWidth = 18 * weight;
    context.beginPath();
    context.ellipse(cx, cy, 185, 96, -0.18, 0, Math.PI * 2);
    context.stroke();
    drawFallbackStone(context, cx + 105, cy - 50, 38, state.shape, stone);
  } else {
    drawFallbackStone(context, cx - 95, cy, 54, state.shape, stone);
    drawFallbackStone(context, cx + 95, cy, 54, state.shape, stone);
  }
}

function drawFallbackStone(context, x, y, size, shape, color) {
  context.fillStyle = color;
  context.strokeStyle = "rgba(255,255,255,0.82)";
  context.lineWidth = 3;
  context.beginPath();

  if (shape === "Pear") {
    context.moveTo(x, y - size);
    context.bezierCurveTo(x + size, y - size * 0.1, x + size * 0.55, y + size, x, y + size);
    context.bezierCurveTo(x - size * 0.55, y + size, x - size, y - size * 0.1, x, y - size);
  } else if (shape === "Oval") {
    context.ellipse(x, y, size * 0.72, size, 0, 0, Math.PI * 2);
  } else if (shape === "Cushion") {
    if (typeof context.roundRect === "function") {
      context.roundRect(x - size * 0.78, y - size * 0.78, size * 1.56, size * 1.56, 16);
    } else {
      context.rect(x - size * 0.78, y - size * 0.78, size * 1.56, size * 1.56);
    }
  } else {
    context.arc(x, y, size, 0, Math.PI * 2);
  }

  context.fill();
  context.stroke();
}

function setSummary(root, state) {
  const summary = root.querySelector("[data-designer-summary]");
  const sizeLabel = root.querySelector("[data-designer-size-label]");
  const weightLabel = root.querySelector("[data-designer-weight-label]");

  if (summary) {
    summary.textContent = createSummary(state);
  }

  if (sizeLabel) {
    sizeLabel.textContent = `${state.size} ct feel`;
  }

  if (weightLabel) {
    weightLabel.textContent = getWeightLabel(state.weight);
  }
}

async function createThreeStudio(root, canvas) {
  const THREE = await import("./three.module.js");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100);
  const model = new THREE.Group();
  const sparkle = new THREE.Group();
  let environmentTexture = null;
  let currentState = getState(root);
  let frameId = null;
  let isDragging = false;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let targetRotationX = 0.03;
  let targetRotationY = -0.18;

  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  if ("outputColorSpace" in renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  camera.position.set(0, 0.62, 5.75);
  camera.lookAt(0, 0, 0);

  function createEnvironmentTexture() {
    const environmentCanvas = document.createElement("canvas");
    const context = environmentCanvas.getContext("2d");

    if (!context) {
      return null;
    }

    environmentCanvas.width = 512;
    environmentCanvas.height = 256;

    const gradient = context.createLinearGradient(0, 0, 512, 256);
    gradient.addColorStop(0, "#f6f0e6");
    gradient.addColorStop(0.26, "#ffffff");
    gradient.addColorStop(0.48, "#173531");
    gradient.addColorStop(0.72, "#d5b06a");
    gradient.addColorStop(1, "#140d10");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 256);
    context.fillStyle = "rgba(255,255,255,0.78)";
    context.fillRect(38, 22, 112, 18);
    context.fillRect(360, 38, 88, 22);
    context.fillStyle = "rgba(255,232,190,0.58)";
    context.fillRect(210, 182, 124, 24);

    const texture = new THREE.CanvasTexture(environmentCanvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;

    if ("colorSpace" in texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
    }

    return texture;
  }

  environmentTexture = createEnvironmentTexture();

  if (environmentTexture) {
    scene.environment = environmentTexture;
  }

  scene.add(model, sparkle);
  scene.add(new THREE.HemisphereLight(0xf8fbff, 0x281c1a, 1.35));

  const key = new THREE.DirectionalLight(0xffffff, 2.8);
  key.position.set(3.8, 4.6, 3.4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 12;
  key.shadow.camera.left = -4;
  key.shadow.camera.right = 4;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -4;
  key.target.position.set(0, 0.05, 0);
  scene.add(key, key.target);

  const fill = new THREE.PointLight(0xfff2d8, 2.2, 9);
  fill.position.set(-2.7, 1.8, 3.6);
  scene.add(fill);

  const rim = new THREE.PointLight(0xffabc2, 3.4, 10);
  rim.position.set(3.1, 0.8, -1.2);
  scene.add(rim);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(3.25, 96),
    new THREE.MeshPhysicalMaterial({
      color: 0xf1ebe1,
      roughness: 0.72,
      metalness: 0,
      transparent: true,
      opacity: 0.18,
      clearcoat: 0.2
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -1.38, -0.22);
  floor.receiveShadow = true;
  scene.add(floor);

  const reflection = new THREE.Mesh(
    new THREE.RingGeometry(1.05, 3.05, 96),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.04, side: THREE.DoubleSide })
  );
  reflection.rotation.x = -Math.PI / 2;
  reflection.position.set(0, -1.37, -0.2);
  scene.add(reflection);

  const sparkleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });

  for (let index = 0; index < 34; index += 1) {
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.018 + Math.random() * 0.024, 0),
      sparkleMaterial
    );
    gem.position.set((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 3.8, -1.2 - Math.random() * 2.8);
    sparkle.add(gem);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function materialForMetal() {
    const finish = FINISH_SETTINGS[currentState.finish] || FINISH_SETTINGS["High Polish"];

    return new THREE.MeshPhysicalMaterial({
      color: METAL_COLORS[currentState.metal],
      metalness: currentState.finish === "Soft Satin" ? 0.82 : 0.95,
      roughness: finish.roughness,
      clearcoat: finish.clearcoat,
      clearcoatRoughness: Math.min(0.4, finish.roughness * 0.62),
      envMapIntensity: 1.2,
      reflectivity: 0.82
    });
  }

  function materialForStone() {
    const isDiamond = currentState.stone === "Clear Diamond";

    return new THREE.MeshPhysicalMaterial({
      color: STONE_COLORS[currentState.stone],
      metalness: 0,
      roughness: 0.04,
      transparent: true,
      opacity: isDiamond ? 0.72 : 0.84,
      transmission: isDiamond ? 0.72 : 0.34,
      thickness: 0.82,
      ior: isDiamond ? 2.35 : 1.76,
      reflectivity: 1,
      clearcoat: 1,
      clearcoatRoughness: 0.025,
      envMapIntensity: 1.45
    });
  }

  function weightValue() {
    return Number(currentState.weight) || 1;
  }

  function enableShadows(object) {
    object.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });

    return object;
  }

  function disposeObject(object) {
    object.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }

      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  function clearModel() {
    while (model.children.length) {
      const child = model.children.pop();
      disposeObject(child);
    }
  }

  function makeStone(scale = 1) {
    const size = Number(currentState.size) * 0.24 * scale;
    const material = materialForStone();
    const stone = new THREE.Group();
    let mesh;

    if (currentState.shape === "Pear") {
      mesh = new THREE.Group();
      const cone = new THREE.Mesh(new THREE.ConeGeometry(size * 0.78, size * 1.35, 38), material);
      const round = new THREE.Mesh(new THREE.SphereGeometry(size * 0.58, 32, 18), material);
      cone.position.y = -size * 0.18;
      round.position.y = size * 0.26;
      mesh.add(cone, round);
    } else if (currentState.shape === "Oval") {
      mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 42, 24), material);
      mesh.scale.set(0.74, 1.15, 0.58);
    } else if (currentState.shape === "Cushion") {
      mesh = new THREE.Mesh(new THREE.OctahedronGeometry(size * 1.04, 2), material);
      mesh.scale.set(1.02, 1.02, 0.48);
      mesh.rotation.z = Math.PI / 4;
    } else {
      mesh = new THREE.Mesh(new THREE.OctahedronGeometry(size, 2), material);
      mesh.scale.z = 0.66;
    }

    const table = new THREE.Mesh(
      new THREE.CircleGeometry(size * 0.38, 36),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: currentState.stone === "Clear Diamond" ? 0.34 : 0.18,
        side: THREE.DoubleSide
      })
    );
    table.position.z = size * 0.5;
    table.scale.y = currentState.shape === "Oval" ? 1.28 : currentState.shape === "Pear" ? 1.08 : 0.88;

    stone.add(mesh, table);

    return enableShadows(stone);
  }

  function addHalo(parent, centerX, centerY, radius, count, z, scaleY = 1) {
    if (!currentState.halo) {
      return;
    }

    const material = materialForStone();

    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count;
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.05 + Number(currentState.size) * 0.006, 1), material);
      gem.position.set(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius * scaleY, z);
      gem.rotation.set(angle * 0.3, angle, 0);
      parent.add(gem);
    }
  }

  function addAccentStones(parent, radius, count, options = {}) {
    if (!currentState.accent) {
      return;
    }

    const {
      x = 0,
      y = 0,
      z = 0.13,
      scaleY = 1,
      start = Math.PI * 0.18,
      end = Math.PI * 0.82,
      size = 0.043
    } = options;
    const material = materialForStone();

    for (let index = 0; index < count; index += 1) {
      const progress = count === 1 ? 0.5 : index / (count - 1);
      const angle = start + (end - start) * progress;
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(size, 1), material);
      gem.position.set(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius * scaleY, z);
      parent.add(gem);
    }
  }

  function makeCylinderBetween(start, end, radius, material) {
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 16), material);

    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());

    return mesh;
  }

  function addProngs(parent, centerX, centerY, centerZ, radius, count = 6, scaleY = 1) {
    const metal = materialForMetal();
    const prongRadius = 0.015 * weightValue();

    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius * scaleY;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(prongRadius, prongRadius * 1.22, 0.28, 12), metal);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(prongRadius * 1.75, 12, 8), metal);

      post.position.set(x, y, centerZ + 0.05);
      post.rotation.x = Math.PI / 2;
      tip.position.set(x, y, centerZ + 0.2);
      parent.add(post, tip);
    }
  }

  function addBezel(parent, centerX, centerY, centerZ, radius, scaleY = 1) {
    const metal = materialForMetal();
    const bezel = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.024 * weightValue(), 16, 96), metal);

    bezel.position.set(centerX, centerY, centerZ + 0.04);
    bezel.scale.y = scaleY;
    parent.add(bezel);
  }

  function addMilgrain(parent, centerX, centerY, radius, count, z, scaleY = 1, size = 0.018) {
    if (currentState.finish !== "Milgrain Edge") {
      return;
    }

    const metal = materialForMetal();

    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count;
      const bead = new THREE.Mesh(new THREE.SphereGeometry(size * weightValue(), 10, 8), metal);
      bead.position.set(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius * scaleY, z);
      parent.add(bead);
    }
  }

  function addSetting(parent, centerX, centerY, centerZ, radius, options = {}) {
    const { scaleY = 1, prongs = 6, shoulders = false } = options;

    if (currentState.setting === "Bezel") {
      addBezel(parent, centerX, centerY, centerZ, radius, scaleY);
    } else {
      addProngs(parent, centerX, centerY, centerZ, radius, prongs, scaleY);
    }

    if (currentState.setting === "Cathedral" && shoulders) {
      const metal = materialForMetal();
      const tube = 0.028 * weightValue();
      parent.add(
        makeCylinderBetween(new THREE.Vector3(-0.62, 0.88, 0.03), new THREE.Vector3(-0.22, 1.12, centerZ), tube, metal),
        makeCylinderBetween(new THREE.Vector3(0.62, 0.88, 0.03), new THREE.Vector3(0.22, 1.12, centerZ), tube, metal)
      );
    }
  }

  function buildRing() {
    const metal = materialForMetal();
    const group = new THREE.Group();
    const weight = weightValue();
    const bandRadius = 1.18 + (weight - 1) * 0.08;
    const tube = 0.072 * weight;
    const stoneRadius = Number(currentState.size) * 0.22 * 1.18;
    const band = new THREE.Mesh(new THREE.TorusGeometry(bandRadius, tube, 40, 190), metal);
    const stone = makeStone(1.18);

    band.rotation.z = 0;
    stone.position.set(0, 1.22, 0.2);
    addSetting(group, 0, 1.22, 0.13, stoneRadius * 0.92, { scaleY: 0.86, prongs: currentState.shape === "Pear" ? 5 : 6, shoulders: true });
    addHalo(group, 0, 1.22, stoneRadius + 0.13, 18, 0.14, 0.86);
    addMilgrain(group, 0, 1.22, stoneRadius + (currentState.halo ? 0.22 : 0.07), 32, 0.19, 0.86);
    addAccentStones(group, bandRadius, 18, { z: 0.13, size: 0.04, start: Math.PI * 0.16, end: Math.PI * 0.84 });
    group.add(band, stone);
    group.rotation.x = -0.08;
    return enableShadows(group);
  }

  function buildNecklace() {
    const metal = materialForMetal();
    const group = new THREE.Group();
    const weight = weightValue();
    const beadSize = 0.052 * weight;
    const stoneRadius = Number(currentState.size) * 0.2 * 1.08;

    for (let index = 0; index < 42; index += 1) {
      const t = index / 41;
      const x = (t - 0.5) * 3.8;
      const y = -0.48 - Math.cos((t - 0.5) * Math.PI) * 0.82;
      const bead = new THREE.Mesh(new THREE.SphereGeometry(beadSize, 18, 12), metal);
      bead.position.set(x, y, 0);
      group.add(bead);
    }

    const bail = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.018 * weight, 16, 56), metal);
    bail.position.set(0, -1.02, 0.06);
    group.add(bail);

    const pendant = makeStone(1.08);
    pendant.position.set(0, -1.37, 0.16);
    addSetting(group, 0, -1.37, 0.1, stoneRadius * 0.94, { scaleY: 0.92, prongs: currentState.shape === "Pear" ? 5 : 6 });
    addHalo(group, 0, -1.37, stoneRadius + 0.12, 18, 0.11, 0.92);
    addMilgrain(group, 0, -1.37, stoneRadius + (currentState.halo ? 0.21 : 0.07), 32, 0.16, 0.92);
    group.add(pendant);
    group.scale.setScalar(1.18);
    return enableShadows(group);
  }

  function buildBracelet() {
    const metal = materialForMetal();
    const group = new THREE.Group();
    const weight = weightValue();
    const stoneRadius = Number(currentState.size) * 0.2 * 0.78;
    const band = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.06 * weight, 40, 190), metal);
    const stone = makeStone(0.78);

    band.scale.y = 0.62;
    band.rotation.x = 0.24;
    stone.position.set(1.04, 0.43, 0.2);
    addSetting(group, 1.04, 0.43, 0.13, stoneRadius * 0.96, { scaleY: 0.86, prongs: currentState.shape === "Pear" ? 5 : 6 });
    addHalo(group, 1.04, 0.43, stoneRadius + 0.1, 16, 0.14, 0.86);
    addMilgrain(group, 1.04, 0.43, stoneRadius + (currentState.halo ? 0.2 : 0.06), 28, 0.18, 0.86);
    addAccentStones(group, 1.42, 26, { scaleY: 0.62, z: 0.14, size: 0.038, start: Math.PI * 0.06, end: Math.PI * 0.94 });
    group.add(band, stone);
    group.rotation.z = -0.18;
    return enableShadows(group);
  }

  function buildEarrings() {
    const group = new THREE.Group();
    const metal = materialForMetal();
    const weight = weightValue();
    const stoneRadius = Number(currentState.size) * 0.2 * 0.88;

    [-0.76, 0.76].forEach((x) => {
      const earring = makeStone(0.88);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.018 * weight, 0.018 * weight, 0.34, 14), metal);
      const backing = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.014 * weight, 14, 42), metal);

      earring.position.set(x, 0, 0.18);
      post.position.set(x, -0.34, -0.08);
      post.rotation.x = Math.PI / 2;
      backing.position.set(x, -0.35, -0.2);
      group.add(earring);
      addSetting(group, x, 0, 0.12, stoneRadius * 0.94, { scaleY: 0.9, prongs: currentState.shape === "Pear" ? 5 : 6 });
      addHalo(group, x, 0, stoneRadius + 0.11, 16, 0.13, 0.9);
      addMilgrain(group, x, 0, stoneRadius + (currentState.halo ? 0.2 : 0.06), 28, 0.18, 0.9);
      group.add(post, backing);
    });

    return enableShadows(group);
  }

  function rebuild(state) {
    currentState = state;
    clearModel();

    const builders = {
      Ring: buildRing,
      Necklace: buildNecklace,
      Bracelet: buildBracelet,
      Earrings: buildEarrings
    };

    model.add((builders[currentState.piece] || buildRing)());
    model.scale.setScalar(currentState.piece === "Earrings" ? 0.9 : 0.82);
    model.position.set(currentState.piece === "Necklace" ? -0.12 : -0.18, currentState.piece === "Necklace" ? 0.08 : 0, 0);
    resize();
  }

  function animate(time = 0) {
    if (!isDragging) {
      targetRotationY += 0.0016;
    }

    const idleLift = Math.sin(time * 0.00028) * 0.035;
    model.rotation.y += (targetRotationY + Math.sin(time * 0.00035) * 0.08 - model.rotation.y) * 0.08;
    model.rotation.x += (targetRotationX + idleLift - model.rotation.x) * 0.08;
    sparkle.rotation.y += 0.0018;
    sparkle.rotation.x = Math.sin(time * 0.00018) * 0.08;
    renderer.render(scene, camera);
    frameId = window.requestAnimationFrame(animate);
  }

  function onPointerDown(event) {
    isDragging = true;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    canvas.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    if (!isDragging) {
      return;
    }

    const width = Math.max(canvas.clientWidth, 1);
    const height = Math.max(canvas.clientHeight, 1);
    const deltaX = (event.clientX - lastPointerX) / width;
    const deltaY = (event.clientY - lastPointerY) / height;

    targetRotationY += deltaX * 3.2;
    targetRotationX = Math.max(-0.42, Math.min(0.42, targetRotationX + deltaY * 1.8));
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
  }

  function onPointerUp(event) {
    isDragging = false;

    try {
      canvas.releasePointerCapture?.(event.pointerId);
    } catch (error) {
      // The pointer may already be released when the cursor leaves the canvas.
    }
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("pointerleave", onPointerUp);
  window.addEventListener("resize", resize);
  rebuild(currentState);
  animate();

  return {
    renderer: "three",
    update: rebuild,
    destroy() {
      window.cancelAnimationFrame(frameId);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);
      window.removeEventListener("resize", resize);
      environmentTexture?.dispose();
      renderer.dispose();
    }
  };
}

function createFallbackStudio(root, fallback, mainCanvas) {
  const canvas = fallback.querySelector("[data-designer-fallback-canvas]");

  mainCanvas.hidden = true;
  fallback.hidden = false;

  return {
    renderer: "fallback",
    update(state) {
      drawFallback(canvas, state);
    }
  };
}

function recordCanvasState(root, canvas, rendererName) {
  window.requestAnimationFrame(() => {
    try {
      root.dataset.designerRenderer = rendererName;
      root.dataset.designerPixels = String(canvas.toDataURL("image/png").length);
    } catch (error) {
      root.dataset.designerRenderer = rendererName;
      root.dataset.designerPixels = "0";
    }
  });
}

async function setupDesigner() {
  const root = document.querySelector("[data-design-studio]");

  if (!root) {
    return;
  }

  const canvas = root.querySelector("[data-designer-canvas]");
  const fallback = root.querySelector("[data-designer-fallback]");
  const controls = root.querySelector("[data-designer-controls]");
  const sendButton = root.querySelector("[data-send-design]");
  let studio = null;

  setInitialPiece(root);
  setSummary(root, getState(root));

  try {
    studio = await createThreeStudio(root, canvas);
  } catch (error) {
    root.dataset.designerError = error instanceof Error ? error.message : "3D preview unavailable";
    studio = createFallbackStudio(root, fallback, canvas);
  }

  const update = () => {
    const state = getState(root);
    setSummary(root, state);
    studio.update(state);
    recordCanvasState(root, canvas.hidden ? fallback.querySelector("[data-designer-fallback-canvas]") : canvas, studio.renderer);
  };

  controls?.addEventListener("input", update);
  controls?.addEventListener("change", update);

  sendButton?.addEventListener("click", () => {
    const state = getState(root);
    fillRequestForm(state);
    sendButton.textContent = "Design Sent";
    window.setTimeout(() => {
      sendButton.textContent = "Send Design to Request Form";
    }, 1800);
  });

  update();
}

document.addEventListener("DOMContentLoaded", setupDesigner);
