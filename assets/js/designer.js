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

const STONE_PROFILES = {
  "Clear Diamond": {
    color: "#f8fcff",
    absorption: "#edf8ff",
    tint: "#ffffff",
    table: "#ffffff",
    opacity: 0.58,
    transmission: 0.92,
    roughness: 0.012,
    ior: 2.42,
    dispersion: 0.68,
    attenuationDistance: 2.4,
    fire: 0.72
  },
  "Blush Sapphire": {
    color: "#d36f92",
    absorption: "#b84676",
    tint: "#ffc6d9",
    table: "#ffe4ed",
    opacity: 0.78,
    transmission: 0.42,
    roughness: 0.028,
    ior: 1.77,
    dispersion: 0.14,
    attenuationDistance: 0.72,
    fire: 0.34
  },
  "Blue Sapphire": {
    color: "#1c4a9c",
    absorption: "#0b225e",
    tint: "#76a7ff",
    table: "#bcd1ff",
    opacity: 0.84,
    transmission: 0.3,
    roughness: 0.032,
    ior: 1.77,
    dispersion: 0.12,
    attenuationDistance: 0.48,
    fire: 0.26
  },
  "Emerald Green": {
    color: "#16764f",
    absorption: "#0c4f34",
    tint: "#55c98d",
    table: "#a7f0ca",
    opacity: 0.82,
    transmission: 0.36,
    roughness: 0.036,
    ior: 1.58,
    dispersion: 0.08,
    attenuationDistance: 0.54,
    fire: 0.22
  }
};

const STONE_COLORS = Object.fromEntries(
  Object.entries(STONE_PROFILES).map(([name, profile]) => [name, profile.color])
);

const TEXTURE_URLS = {
  studioHdr: "assets/textures/studio_small_08_1k.hdr",
  metalNormal: "assets/textures/Metal002/Metal002_1K-JPG_NormalGL.jpg",
  metalRoughness: "assets/textures/Metal002/Metal002_1K-JPG_Roughness.jpg"
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
    state.halo ? "diamond frame" : "unframed center stone",
    state.accent ? "side stones" : "clean band"
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
  const setMatchingSelect = (fieldName, ...paramNames) => {
    const field = root.querySelector(`[data-designer-field="${fieldName}"]`);
    const selectedValue = paramNames.map((name) => params.get(name)).find(Boolean);

    if (!field || !selectedValue) {
      return;
    }

    const selectedOption = Array.from(field.options).find((option) => (
      option.value.toLowerCase() === selectedValue.toLowerCase()
      || option.textContent.trim().toLowerCase() === selectedValue.toLowerCase()
    ));

    if (selectedOption) {
      field.value = selectedOption.value;
    }
  };

  if (selectedPiece && pieceField) {
    pieceField.value = selectedPiece;
  }

  setMatchingSelect("shape", "shape", "stone-shape");
  setMatchingSelect("stone", "stone", "stone-color");
  setMatchingSelect("setting", "setting");
  setMatchingSelect("finish", "finish");
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
  setValue("#finish-preference", `${state.setting} setting, ${state.halo ? "diamond frame" : "unframed center stone"}, ${state.accent ? "side stones" : "clean band"}`);
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
  const { RGBELoader } = await import("./RGBELoader.js");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100);
  const model = new THREE.Group();
  const sparkle = new THREE.Group();
  const runtimeTextures = {};
  const disposableTextures = [];
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
  renderer.toneMappingExposure = 1.26;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  if ("outputColorSpace" in renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  camera.position.set(0, 0.62, 5.75);
  camera.lookAt(0, 0, 0);

  function trackTexture(texture) {
    if (texture) {
      disposableTextures.push(texture);
    }

    return texture;
  }

  function configureTexture(texture, options = {}) {
    const {
      repeat = 1,
      colorSpace = null,
      minFilter = THREE.LinearMipmapLinearFilter,
      magFilter = THREE.LinearFilter
    } = options;

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat, repeat);
    texture.minFilter = minFilter;
    texture.magFilter = magFilter;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

    if (colorSpace && "colorSpace" in texture) {
      texture.colorSpace = colorSpace;
    }

    texture.needsUpdate = true;

    return trackTexture(texture);
  }

  function createCanvasTexture(width, height, draw, options = {}) {
    const textureCanvas = document.createElement("canvas");
    const context = textureCanvas.getContext("2d");

    textureCanvas.width = width;
    textureCanvas.height = height;

    if (context) {
      draw(context, width, height);
    }

    return configureTexture(new THREE.CanvasTexture(textureCanvas), options);
  }

  function createBrushedAnisotropyTexture() {
    return createCanvasTexture(512, 512, (context, width, height) => {
      context.fillStyle = "rgb(128, 128, 255)";
      context.fillRect(0, 0, width, height);

      for (let y = 0; y < height; y += 1) {
        const wave = Math.sin(y * 0.055) * 18 + Math.sin(y * 0.017) * 9;
        const tone = 122 + (y % 11) * 2;
        context.fillStyle = `rgb(${Math.round(tone + wave * 0.06)}, ${Math.round(130 - wave * 0.04)}, 250)`;
        context.fillRect(0, y, width, 1);
      }

      context.globalAlpha = 0.28;
      context.strokeStyle = "rgb(172, 172, 255)";

      for (let index = 0; index < 120; index += 1) {
        const y = Math.random() * height;
        context.beginPath();
        context.moveTo(Math.random() * width * 0.18, y);
        context.lineTo(width - Math.random() * width * 0.18, y + Math.sin(index) * 5);
        context.stroke();
      }
    }, { repeat: 7 });
  }

  function createStudioVelvetTexture() {
    return createCanvasTexture(512, 512, (context, width, height) => {
      const gradient = context.createRadialGradient(width * 0.48, height * 0.4, 20, width * 0.48, height * 0.4, width * 0.72);
      gradient.addColorStop(0, "#233b36");
      gradient.addColorStop(0.55, "#102724");
      gradient.addColorStop(1, "#07100f");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      context.globalAlpha = 0.2;

      for (let y = 0; y < height; y += 3) {
        context.fillStyle = y % 2 ? "#ffffff" : "#000000";
        context.fillRect(0, y, width, 1);
      }

      context.globalAlpha = 0.16;

      for (let index = 0; index < 2400; index += 1) {
        const shade = 70 + Math.random() * 60;
        context.fillStyle = `rgb(${shade}, ${shade + 18}, ${shade + 10})`;
        context.fillRect(Math.random() * width, Math.random() * height, 1, 1);
      }
    }, { repeat: 2.4, colorSpace: THREE.SRGBColorSpace });
  }

  function createFineRoughnessTexture() {
    return createCanvasTexture(512, 512, (context, width, height) => {
      const image = context.createImageData(width, height);

      for (let index = 0; index < image.data.length; index += 4) {
        const grain = 120 + Math.random() * 70;
        image.data[index] = grain;
        image.data[index + 1] = grain;
        image.data[index + 2] = grain;
        image.data[index + 3] = 255;
      }

      context.putImageData(image, 0, 0);
      context.globalAlpha = 0.32;

      for (let y = 0; y < height; y += 6) {
        context.fillStyle = y % 12 === 0 ? "#f2f2f2" : "#6e6e6e";
        context.fillRect(0, y, width, 1);
      }
    }, { repeat: 5 });
  }

  function createGemMicroNormalTexture() {
    return createCanvasTexture(512, 512, (context, width, height) => {
      context.fillStyle = "rgb(128, 128, 255)";
      context.fillRect(0, 0, width, height);
      context.globalAlpha = 0.22;

      for (let index = 0; index < 190; index += 1) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const length = 14 + Math.random() * 72;
        const angle = (Math.random() - 0.5) * Math.PI;
        const dx = Math.cos(angle) * length;
        const dy = Math.sin(angle) * length;
        const tone = 122 + Math.random() * 34;

        context.strokeStyle = `rgb(${tone}, ${tone}, 255)`;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + dx, y + dy);
        context.stroke();
      }

      context.globalAlpha = 0.16;

      for (let index = 0; index < 800; index += 1) {
        const tone = 112 + Math.random() * 40;
        context.fillStyle = `rgb(${tone}, ${tone}, 255)`;
        context.fillRect(Math.random() * width, Math.random() * height, 1, 1);
      }
    }, { repeat: 4 });
  }

  function createGemInclusionTexture() {
    return createCanvasTexture(512, 512, (context, width, height) => {
      const gradient = context.createRadialGradient(width * 0.42, height * 0.36, 20, width * 0.5, height * 0.5, width * 0.68);
      gradient.addColorStop(0, "rgba(255,255,255,0.95)");
      gradient.addColorStop(0.56, "rgba(222,238,245,0.56)");
      gradient.addColorStop(1, "rgba(120,140,155,0.18)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
      context.globalAlpha = 0.2;

      for (let index = 0; index < 72; index += 1) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = 0.5 + Math.random() * 2.4;

        context.fillStyle = index % 3 ? "#ffffff" : "#9fb5bf";
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }

      context.globalAlpha = 0.12;
      context.strokeStyle = "#ffffff";

      for (let index = 0; index < 36; index += 1) {
        const y = Math.random() * height;
        context.beginPath();
        context.moveTo(Math.random() * width * 0.2, y);
        context.bezierCurveTo(width * 0.35, y - 18, width * 0.68, y + 24, width - Math.random() * width * 0.2, y + Math.random() * 20);
        context.stroke();
      }
    }, { repeat: 1.8, colorSpace: THREE.SRGBColorSpace });
  }

  async function loadTexture(url, options = {}) {
    const loader = new THREE.TextureLoader();

    return new Promise((resolve) => {
      loader.load(
        url,
        (texture) => resolve(configureTexture(texture, options)),
        undefined,
        () => resolve(null)
      );
    });
  }

  async function loadStudioEnvironment() {
    try {
      const hdrTexture = await new RGBELoader().loadAsync(TEXTURE_URLS.studioHdr);
      const pmrem = new THREE.PMREMGenerator(renderer);
      const environment = pmrem.fromEquirectangular(hdrTexture).texture;

      pmrem.dispose();
      hdrTexture.dispose();

      return trackTexture(environment);
    } catch (error) {
      root.dataset.designerTextureWarning = "studio-hdri-fallback";
      return createProceduralEnvironmentTexture();
    }
  }

  function createProceduralEnvironmentTexture() {
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

    return trackTexture(texture);
  }

  runtimeTextures.brushNormal = createBrushedAnisotropyTexture();
  runtimeTextures.microRoughness = createFineRoughnessTexture();
  runtimeTextures.velvet = createStudioVelvetTexture();
  runtimeTextures.gemNormal = createGemMicroNormalTexture();
  runtimeTextures.gemInclusions = createGemInclusionTexture();
  runtimeTextures.metalNormal = await loadTexture(TEXTURE_URLS.metalNormal, { repeat: 10 });
  runtimeTextures.metalRoughness = await loadTexture(TEXTURE_URLS.metalRoughness, { repeat: 10 });
  environmentTexture = await loadStudioEnvironment();
  root.dataset.designerTextures = runtimeTextures.metalNormal && runtimeTextures.metalRoughness
    ? "studio-hdri-metal-pbr"
    : "studio-hdri-procedural-metal";

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

  const gemPunch = new THREE.SpotLight(0xffffff, 7.8, 9, 0.42, 0.58, 0.9);
  gemPunch.position.set(-1.7, 2.2, 3.6);
  gemPunch.target.position.set(-0.32, 0.6, 0);
  scene.add(gemPunch, gemPunch.target);

  const tableFlash = new THREE.PointLight(0xdff6ff, 2.8, 4.5);
  tableFlash.position.set(-0.55, 0.85, 1.6);
  scene.add(tableFlash);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(3.25, 96),
    new THREE.MeshPhysicalMaterial({
      color: 0xf1ebe1,
      roughness: 0.72,
      metalness: 0,
      map: runtimeTextures.velvet,
      transparent: true,
      opacity: 0.28,
      clearcoat: 0.16,
      sheen: 0.45,
      sheenColor: 0xcbded5,
      sheenRoughness: 0.86
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
    const normalScale = currentState.finish === "Soft Satin" ? 0.12 : currentState.finish === "Milgrain Edge" ? 0.08 : 0.045;
    const metalNormal = runtimeTextures.metalNormal || runtimeTextures.brushNormal;
    const metalRoughness = currentState.finish === "High Polish"
      ? runtimeTextures.microRoughness
      : runtimeTextures.metalRoughness || runtimeTextures.microRoughness;

    return new THREE.MeshPhysicalMaterial({
      color: METAL_COLORS[currentState.metal],
      metalness: currentState.finish === "Soft Satin" ? 0.82 : 0.95,
      roughness: finish.roughness,
      roughnessMap: metalRoughness,
      normalMap: metalNormal,
      normalScale: new THREE.Vector2(normalScale, normalScale),
      anisotropy: currentState.finish === "Soft Satin" ? 0.82 : 0.42,
      anisotropyRotation: currentState.metal === "Rose Gold" ? 0.42 : -0.18,
      anisotropyMap: runtimeTextures.brushNormal,
      clearcoat: finish.clearcoat,
      clearcoatRoughness: Math.min(0.4, finish.roughness * 0.62),
      clearcoatNormalMap: runtimeTextures.brushNormal,
      clearcoatNormalScale: new THREE.Vector2(0.018, 0.018),
      envMapIntensity: 1.2,
      reflectivity: 0.86
    });
  }

  function stoneProfile() {
    return STONE_PROFILES[currentState.stone] || STONE_PROFILES["Clear Diamond"];
  }

  function scintillatingMaterial(parameters, speed = 0.0014) {
    const material = new THREE.MeshBasicMaterial(parameters);

    material.userData.scintillation = {
      baseOpacity: parameters.opacity ?? 1,
      phase: Math.random() * Math.PI * 2,
      speed
    };

    return material;
  }

  function materialForStone() {
    const profile = stoneProfile();
    const isDiamond = currentState.stone === "Clear Diamond";
    const isEmerald = currentState.stone === "Emerald Green";

    return new THREE.MeshPhysicalMaterial({
      color: profile.color,
      map: isDiamond ? runtimeTextures.gemInclusions : null,
      metalness: 0,
      roughness: profile.roughness,
      flatShading: true,
      normalMap: runtimeTextures.gemNormal,
      normalScale: new THREE.Vector2(isDiamond ? 0.018 : 0.032, isDiamond ? 0.018 : 0.032),
      transparent: true,
      side: THREE.DoubleSide,
      opacity: profile.opacity,
      transmission: profile.transmission,
      thickness: isEmerald ? 0.56 : 0.92,
      ior: profile.ior,
      dispersion: profile.dispersion,
      attenuationColor: profile.absorption,
      attenuationDistance: profile.attenuationDistance,
      specularIntensity: 1,
      specularColor: 0xffffff,
      reflectivity: 1,
      clearcoat: 1,
      clearcoatRoughness: 0.025,
      envMapIntensity: isDiamond ? 2.35 : 1.48,
      iridescence: isDiamond ? 0.08 : 0.02,
      iridescenceIOR: profile.ior,
      premultipliedAlpha: true
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

  function gemPoint(angle, radius, z, shape = currentState.shape) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    let x = cos * radius;
    let y = sin * radius;

    if (shape === "Oval") {
      x *= 0.74;
      y *= 1.18;
    } else if (shape === "Pear") {
      const taper = sin > 0 ? 1 - sin * 0.52 : 1 + Math.abs(sin) * 0.08;
      x *= 0.78 * taper;
      y *= sin > 0 ? 1.28 : 0.86;
      y -= radius * 0.08;
    } else if (shape === "Cushion") {
      const cornerLift = 0.88 + Math.max(Math.abs(cos), Math.abs(sin)) * 0.2;
      x *= cornerLift;
      y *= cornerLift;
    }

    return new THREE.Vector3(x, y, z);
  }

  function gemRing(count, radius, z, shape = currentState.shape, offset = 0) {
    return Array.from({ length: count }, (_, index) => {
      const angle = offset + (Math.PI * 2 * index) / count;
      return gemPoint(angle, radius, z, shape);
    });
  }

  function pushGemVertex(positions, uvs, point, uvScale) {
    positions.push(point.x, point.y, point.z);
    uvs.push(0.5 + point.x / uvScale, 0.5 + point.y / uvScale);
  }

  function pushGemTriangle(positions, uvs, a, b, c, uvScale) {
    pushGemVertex(positions, uvs, a, uvScale);
    pushGemVertex(positions, uvs, b, uvScale);
    pushGemVertex(positions, uvs, c, uvScale);
  }

  function pushGemQuad(positions, uvs, a, b, c, d, uvScale) {
    pushGemTriangle(positions, uvs, a, b, d, uvScale);
    pushGemTriangle(positions, uvs, b, c, d, uvScale);
  }

  function createCutStoneGeometry(size, shape = currentState.shape, segments = null) {
    const count = segments || (shape === "Pear" ? 36 : shape === "Oval" ? 34 : 32);
    const depth = shape === "Pear" ? size * 1.26 : shape === "Cushion" ? size * 0.98 : size * 1.08;
    const tableRadius = size * (shape === "Pear" ? 0.31 : shape === "Cushion" ? 0.36 : 0.38);
    const crownRadius = size * (shape === "Pear" ? 0.64 : 0.66);
    const girdleRadius = size * (shape === "Cushion" ? 0.86 : 0.9);
    const pavilionRadius = size * (shape === "Pear" ? 0.48 : 0.56);
    const table = gemRing(count, tableRadius, depth * 0.45, shape, Math.PI / count);
    const crown = gemRing(count, crownRadius, depth * 0.18, shape);
    const girdle = gemRing(count, girdleRadius, 0, shape, Math.PI / count);
    const pavilion = gemRing(count, pavilionRadius, -depth * 0.3, shape);
    const tableCenter = new THREE.Vector3(0, shape === "Pear" ? -size * 0.04 : 0, depth * 0.52);
    const culet = new THREE.Vector3(0, shape === "Pear" ? -size * 0.08 : 0, -depth * 0.58);
    const positions = [];
    const uvs = [];
    const uvScale = size * 2.2;

    for (let index = 0; index < count; index += 1) {
      const next = (index + 1) % count;
      pushGemTriangle(positions, uvs, tableCenter, table[index], table[next], uvScale);
      pushGemQuad(positions, uvs, table[index], crown[index], crown[next], table[next], uvScale);
      pushGemQuad(positions, uvs, crown[index], girdle[index], girdle[next], crown[next], uvScale);
      pushGemQuad(positions, uvs, girdle[index], pavilion[index], pavilion[next], girdle[next], uvScale);
      pushGemTriangle(positions, uvs, pavilion[next], pavilion[index], culet, uvScale);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.computeVertexNormals();

    return geometry;
  }

  function makeGemLineGeometry(size, shape, count) {
    const depth = shape === "Pear" ? size * 1.26 : shape === "Cushion" ? size * 0.98 : size * 1.08;
    const tableRadius = size * (shape === "Pear" ? 0.31 : shape === "Cushion" ? 0.36 : 0.38);
    const crownRadius = size * (shape === "Pear" ? 0.64 : 0.66);
    const girdleRadius = size * (shape === "Cushion" ? 0.86 : 0.9);
    const pavilionRadius = size * (shape === "Pear" ? 0.48 : 0.56);
    const table = gemRing(count, tableRadius, depth * 0.535, shape, Math.PI / count);
    const crown = gemRing(count, crownRadius, depth * 0.18, shape);
    const girdle = gemRing(count, girdleRadius, 0.01, shape, Math.PI / count);
    const pavilion = gemRing(count, pavilionRadius, -depth * 0.28, shape);
    const positions = [];

    function addLine(a, b) {
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }

    for (let index = 0; index < count; index += 1) {
      const next = (index + 1) % count;
      addLine(table[index], table[next]);
      addLine(girdle[index], girdle[next]);

      if (index % 2 === 0) {
        addLine(table[index], crown[index]);
        addLine(crown[index], girdle[index]);
        addLine(girdle[index], pavilion[index]);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

    return geometry;
  }

  function addGemFacetOverlay(stone, size) {
    const profile = stoneProfile();
    const count = currentState.shape === "Pear" ? 36 : currentState.shape === "Oval" ? 34 : 32;
    const lineMaterial = new THREE.LineBasicMaterial({
      color: profile.table,
      transparent: true,
      opacity: currentState.stone === "Clear Diamond" ? 0.58 : 0.32,
      depthWrite: false
    });
    const lines = new THREE.LineSegments(makeGemLineGeometry(size, currentState.shape, count), lineMaterial);
    const fireColors = [0xffd0ef, 0xcbeeff, 0xffebb0, 0xded0ff, 0xc9fff0];

    stone.add(lines);

    function addHighlight(width, height, x, y, z, rotation, opacity, color = profile.table) {
      const highlight = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        scintillatingMaterial({
          color,
          transparent: true,
          opacity,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending
        }, 0.0022)
      );

      highlight.position.set(x, y, z);
      highlight.rotation.z = rotation;
      highlight.renderOrder = 4;
      stone.add(highlight);
    }

    addHighlight(size * 0.5, size * 0.07, -size * 0.08, size * 0.08, size * 0.64, -0.24, currentState.stone === "Clear Diamond" ? 0.42 : 0.24);
    addHighlight(size * 0.32, size * 0.045, size * 0.16, -size * 0.18, size * 0.63, 0.56, currentState.stone === "Clear Diamond" ? 0.34 : 0.2, 0xffffff);
    addHighlight(size * 0.22, size * 0.035, -size * 0.24, -size * 0.14, size * 0.62, -0.74, currentState.stone === "Clear Diamond" ? 0.26 : 0.16, profile.tint);

    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8 + 0.1;
      const next = angle + Math.PI / 10;
      const near = gemPoint(angle, size * 0.18, size * 0.625, currentState.shape);
      const farA = gemPoint(angle, size * 0.58, size * 0.47, currentState.shape);
      const farB = gemPoint(next, size * 0.52, size * 0.49, currentState.shape);
      const panelGeometry = new THREE.BufferGeometry();
      const flashColor = index % 3 === 0 ? profile.tint : index % 3 === 1 ? profile.table : 0xffffff;

      panelGeometry.setAttribute("position", new THREE.Float32BufferAttribute([
        near.x, near.y, near.z,
        farA.x, farA.y, farA.z,
        farB.x, farB.y, farB.z
      ], 3));
      panelGeometry.computeVertexNormals();

      stone.add(new THREE.Mesh(
        panelGeometry,
        scintillatingMaterial({
          color: flashColor,
          transparent: true,
          opacity: currentState.stone === "Clear Diamond" ? 0.2 : 0.12,
          depthWrite: false,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending
        }, 0.0017)
      ));
    }

    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6 + 0.32;
      const next = angle + Math.PI / 8;
      const near = gemPoint(angle, size * 0.24, size * 0.32, currentState.shape);
      const farA = gemPoint(angle, size * 0.76, size * 0.08, currentState.shape);
      const farB = gemPoint(next, size * 0.68, size * 0.1, currentState.shape);
      const shadowGeometry = new THREE.BufferGeometry();

      shadowGeometry.setAttribute("position", new THREE.Float32BufferAttribute([
        near.x, near.y, near.z,
        farA.x, farA.y, farA.z,
        farB.x, farB.y, farB.z
      ], 3));

      stone.add(new THREE.Mesh(
        shadowGeometry,
        new THREE.MeshBasicMaterial({
          color: currentState.stone === "Clear Diamond" ? 0x5c6f76 : profile.absorption,
          transparent: true,
          opacity: currentState.stone === "Clear Diamond" ? 0.12 : 0.22,
          depthWrite: false,
          side: THREE.DoubleSide
        })
      ));
    }

    for (let index = 0; index < 10; index += 1) {
      const angle = (Math.PI * 2 * index) / 10 + 0.18;
      const point = gemPoint(angle, size * 0.44, size * 0.58, currentState.shape);
      const glint = new THREE.Mesh(
        new THREE.TetrahedronGeometry(size * (0.022 + (index % 3) * 0.006), 0),
        scintillatingMaterial({
          color: fireColors[index % fireColors.length],
          transparent: true,
          opacity: profile.fire,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        }, 0.0028)
      );

      glint.position.copy(point);
      glint.rotation.set(angle * 0.2, angle * 0.7, angle);
      stone.add(glint);
    }
  }

  function makeStone(scale = 1) {
    const size = Number(currentState.size) * 0.24 * scale;
    const material = materialForStone();
    const profile = stoneProfile();
    const stone = new THREE.Group();
    const mesh = new THREE.Mesh(createCutStoneGeometry(size, currentState.shape), material);
    const core = new THREE.Mesh(
      createCutStoneGeometry(size * 0.76, currentState.shape, currentState.shape === "Pear" ? 24 : 22),
      new THREE.MeshBasicMaterial({
        color: profile.absorption,
        transparent: true,
        opacity: currentState.stone === "Clear Diamond" ? 0.08 : 0.2,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );

    const table = new THREE.Mesh(
      new THREE.CircleGeometry(size * (currentState.shape === "Pear" ? 0.31 : currentState.shape === "Cushion" ? 0.36 : 0.38), 48),
      new THREE.MeshBasicMaterial({
        color: profile.table,
        transparent: true,
        opacity: currentState.stone === "Clear Diamond" ? 0.36 : 0.18,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    table.position.z = size * 0.59;
    table.scale.y = currentState.shape === "Oval" ? 1.22 : currentState.shape === "Pear" ? 1.08 : 0.9;
    core.scale.z = 0.82;

    stone.add(core, mesh, table);
    addGemFacetOverlay(stone, size);

    return enableShadows(stone);
  }

  function makeMeleeStone(size, material) {
    const profile = stoneProfile();
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(createCutStoneGeometry(size, "Round", 14), material);
    const table = new THREE.Mesh(
      new THREE.CircleGeometry(size * 0.36, 18),
      new THREE.MeshBasicMaterial({
        color: profile.table,
        transparent: true,
        opacity: currentState.stone === "Clear Diamond" ? 0.34 : 0.18,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );

    table.position.z = size * 0.56;
    group.add(mesh, table);

    return enableShadows(group);
  }

  function addHalo(parent, centerX, centerY, radius, count, z, scaleY = 1) {
    if (!currentState.halo) {
      return;
    }

    const material = materialForStone();

    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count;
      const gem = makeMeleeStone(0.048 + Number(currentState.size) * 0.006, material);
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
      const gem = makeMeleeStone(size, material);
      gem.position.set(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius * scaleY, z);
      gem.rotation.set(angle * 0.2, angle * 0.9, 0);
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

  function addGalleryBasket(parent, centerX, centerY, centerZ, radius, scaleY = 1) {
    const metal = materialForMetal();
    const railRadius = 0.014 * weightValue();
    const lowerZ = centerZ - 0.12;
    const upperZ = centerZ + 0.05;
    const basket = new THREE.Group();
    const lowerRail = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.72, railRadius, 10, 72), metal);

    lowerRail.position.set(centerX, centerY, lowerZ);
    lowerRail.scale.y = scaleY;
    basket.add(lowerRail);

    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6;
      const x = centerX + Math.cos(angle) * radius * 0.68;
      const y = centerY + Math.sin(angle) * radius * scaleY * 0.68;
      basket.add(makeCylinderBetween(
        new THREE.Vector3(x, y, lowerZ),
        new THREE.Vector3(centerX + Math.cos(angle) * radius * 0.9, centerY + Math.sin(angle) * radius * scaleY * 0.9, upperZ),
        railRadius * 0.74,
        metal
      ));
    }

    parent.add(basket);
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

    addGalleryBasket(parent, centerX, centerY, centerZ, radius, scaleY);

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
    model.scale.setScalar(currentState.piece === "Ring" ? 0.64 : currentState.piece === "Earrings" ? 0.84 : 0.76);
    model.position.set(currentState.piece === "Necklace" ? -0.28 : currentState.piece === "Earrings" ? -0.2 : -0.58, currentState.piece === "Necklace" ? 0.08 : 0, 0);
    resize();
  }

  function animateScintillation(time) {
    model.traverse((child) => {
      const material = child.material;

      if (!material || !material.userData?.scintillation) {
        return;
      }

      const { baseOpacity, phase, speed } = material.userData.scintillation;
      material.opacity = baseOpacity * (0.72 + Math.sin(time * speed + phase) * 0.28);
    });
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
    animateScintillation(time);
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
      disposableTextures.forEach((texture) => texture.dispose());
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
