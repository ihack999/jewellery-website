/**
 * Canonical physical jewellery specification.
 *
 * All source dimensions are millimetres. `WORLD_UNITS_PER_MM` is only a
 * display conversion for Three.js; it must never be used as a manufacturing
 * unit. The designer and AR renderer both consume the same spec so carat,
 * ring size, shank dimensions and setting clearances cannot drift apart.
 */

export const WORLD_UNITS_PER_MM = 0.12;
export const METERS_PER_MM = 0.001;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const hasFiniteInput = (value) => (
  value !== "" && value !== null && value !== undefined && Number.isFinite(Number(value))
);
const finite = (value, fallback) => {
  if (!hasFiniteInput(value)) return fallback;
  return Number(value);
};
const cubeRoot = (value) => Math.cbrt(Math.max(0.001, value));

/**
 * Calibrated 1 ct visual defaults in mm: [length, width, depth].
 * These are render defaults, not grading/certification values. A supplied
 * laboratory report or manufacturer dimensions always override them.
 */
export const ONE_CARAT_DIMENSIONS_MM = Object.freeze({
  Round:    [6.45, 6.45, 3.95],
  Oval:     [8.10, 5.90, 3.70],
  Cushion:  [6.50, 6.50, 4.15],
  Princess: [5.55, 5.55, 4.00],
  Emerald:  [6.80, 4.80, 3.20],
  Asscher:  [5.55, 5.55, 3.75],
  Marquise: [10.50, 5.20, 3.35],
  Pear:     [8.50, 5.70, 3.60],
  Heart:    [6.60, 6.50, 4.00],
  Trillion: [6.70, 6.70, 3.50],
  Baguette: [7.00, 3.50, 2.50],
  Hexagon:  [6.60, 5.70, 3.70],
  Kite:     [8.00, 5.00, 3.50]
});

export const CUT_DEFAULTS = Object.freeze({
  Round:    { tablePct: 57, totalDepthPct: 61.5, crownAngleDeg: 34.5, pavilionAngleDeg: 40.8, girdlePct: 3.5, culetPct: 0 },
  Oval:     { tablePct: 58, totalDepthPct: 62.0, crownAngleDeg: 34.0, pavilionAngleDeg: 40.8, girdlePct: 3.5, culetPct: 0 },
  Cushion:  { tablePct: 59, totalDepthPct: 64.0, crownAngleDeg: 35.0, pavilionAngleDeg: 41.0, girdlePct: 4.0, culetPct: 0 },
  Princess: { tablePct: 70, totalDepthPct: 72.0, crownAngleDeg: 35.0, pavilionAngleDeg: 40.5, girdlePct: 3.5, culetPct: 0 },
  Emerald:  { tablePct: 66, totalDepthPct: 67.0, crownAngleDeg: 11.0, pavilionAngleDeg: 43.0, girdlePct: 4.0, culetPct: 0 },
  Asscher:  { tablePct: 64, totalDepthPct: 68.0, crownAngleDeg: 15.0, pavilionAngleDeg: 43.0, girdlePct: 4.0, culetPct: 0 },
  Marquise: { tablePct: 58, totalDepthPct: 63.0, crownAngleDeg: 34.5, pavilionAngleDeg: 41.0, girdlePct: 3.5, culetPct: 0 },
  Pear:     { tablePct: 58, totalDepthPct: 63.0, crownAngleDeg: 34.5, pavilionAngleDeg: 41.0, girdlePct: 3.5, culetPct: 0 },
  Heart:    { tablePct: 59, totalDepthPct: 63.0, crownAngleDeg: 35.0, pavilionAngleDeg: 41.0, girdlePct: 4.0, culetPct: 0 },
  Trillion: { tablePct: 56, totalDepthPct: 52.0, crownAngleDeg: 33.0, pavilionAngleDeg: 39.0, girdlePct: 4.0, culetPct: 0 },
  Baguette: { tablePct: 68, totalDepthPct: 62.0, crownAngleDeg: 10.0, pavilionAngleDeg: 42.0, girdlePct: 4.0, culetPct: 0 },
  Hexagon:  { tablePct: 60, totalDepthPct: 62.0, crownAngleDeg: 34.0, pavilionAngleDeg: 40.5, girdlePct: 4.0, culetPct: 0 },
  Kite:     { tablePct: 58, totalDepthPct: 62.0, crownAngleDeg: 34.0, pavilionAngleDeg: 40.5, girdlePct: 4.0, culetPct: 0 }
});

const STONE_DENSITY_G_CM3 = Object.freeze({
  "Clear Diamond": 3.52,
  "Salt & Pepper": 3.52,
  "Blue Sapphire": 4.00,
  "Blush Sapphire": 4.00,
  "Padparadscha": 4.00,
  "Ruby Red": 4.00,
  "Emerald Green": 2.72,
  Aquamarine: 2.72,
  "Morganite Peach": 2.72,
  "Amethyst Purple": 2.65,
  "Citrine Yellow": 2.65,
  "Black Onyx": 2.65,
  "Fire Opal": 2.15,
  "Tanzanite Violet": 3.35,
  "Alexandrite Shift": 3.73,
  "Paraiba Tourmaline": 3.06,
  "Moonstone Glow": 2.58
});

const METAL_DENSITY_G_CM3 = Object.freeze({
  "Yellow Gold:10K": 11.6,
  "Yellow Gold:14K": 13.1,
  "Yellow Gold:18K": 15.6,
  "Yellow Gold:22K": 17.8,
  "White Gold:10K": 11.8,
  "White Gold:14K": 13.4,
  "White Gold:18K": 14.7,
  "Rose Gold:10K": 11.7,
  "Rose Gold:14K": 13.2,
  "Rose Gold:18K": 15.4,
  "Champagne Gold:14K": 13.2,
  "Champagne Gold:18K": 15.5,
  "Black Gold:14K": 13.4,
  "Black Gold:18K": 15.2,
  "Two-Tone Mix:14K": 13.3,
  "Two-Tone Mix:18K": 15.2,
  "Platinum:950": 21.45,
  "Mirror Silver:950": 10.49,
  "Bronze Patina:14K": 8.8
});

export function usRingSizeToInnerDiameterMm(sizeUS) {
  return 11.63 + 0.8128 * clamp(finite(sizeUS, 7), 1, 16);
}

export function innerDiameterMmToUS(diameterMm) {
  return clamp((finite(diameterMm, 17.32) - 11.63) / 0.8128, 1, 16);
}

export function mmToWorld(mm) {
  return finite(mm, 0) * WORLD_UNITS_PER_MM;
}

export function worldToMm(worldUnits) {
  return finite(worldUnits, 0) / WORLD_UNITS_PER_MM;
}

function densityScaleForStone(stoneName) {
  const density = STONE_DENSITY_G_CM3[stoneName] || STONE_DENSITY_G_CM3["Clear Diamond"];
  // Same carat mass with a lower-density material occupies more volume.
  return cubeRoot(STONE_DENSITY_G_CM3["Clear Diamond"] / density);
}

export function estimateStoneDimensionsMm({
  shape = "Round",
  stone = "Clear Diamond",
  carat = 1,
  lengthMm,
  widthMm,
  depthMm,
  lengthWidthRatio
} = {}) {
  const reference = ONE_CARAT_DIMENSIONS_MM[shape] || ONE_CARAT_DIMENSIONS_MM.Round;
  const massScale = cubeRoot(clamp(finite(carat, 1), 0.03, 50));
  const materialScale = densityScaleForStone(stone);
  let length = finite(lengthMm, reference[0] * massScale * materialScale);
  let width = finite(widthMm, reference[1] * massScale * materialScale);
  let depth = finite(depthMm, reference[2] * massScale * materialScale);

  const ratio = finite(lengthWidthRatio, 0);
  if (ratio > 0 && !hasFiniteInput(lengthMm)) {
    length = width * clamp(ratio, 0.75, 3.0);
  }

  length = clamp(length, 0.8, 60);
  width = clamp(width, 0.8, 60);
  depth = clamp(depth, 0.4, 35);

  return {
    lengthMm: length,
    widthMm: width,
    depthMm: depth,
    lengthWidthRatio: length / Math.max(width, 0.001)
  };
}

function defaultBandWidthMm(weight) {
  return clamp(2.10 + (finite(weight, 1) - 1) * 1.10, 1.55, 5.5);
}

function defaultBandThicknessMm(weight) {
  return clamp(1.75 + (finite(weight, 1) - 1) * 0.85, 1.40, 4.0);
}

function defaultProngCount(shape) {
  if (shape === "Pear") return 5;      // four claws + one protective V-tip
  if (shape === "Marquise") return 6;  // four side claws + V-tips at both ends
  if (shape === "Heart") return 3;     // two lobe claws + V-tip at the point
  if (["Princess", "Emerald", "Asscher", "Baguette", "Kite"].includes(shape)) return 4;
  if (shape === "Trillion") return 3;
  return 6;
}

function metalDensity(spec) {
  const key = `${spec.metal.alloy}:${spec.metal.karat}`;
  return METAL_DENSITY_G_CM3[key]
    || METAL_DENSITY_G_CM3[`${spec.metal.alloy}:18K`]
    || METAL_DENSITY_G_CM3[`${spec.metal.alloy}:14K`]
    || 15.0;
}

/* Standard retail chain lengths in mm keyed by necklace silhouette. */
const NECKLACE_CHAIN_LENGTH_MM = Object.freeze({
  Choker: 380,
  Pendant: 450,
  "Y-Drop": 480,
  Lariat: 660,
  Station: 460
});

function defaultChainWireMm(weight) {
  return clamp(0.90 + (finite(weight, 1) - 1) * 0.55, 0.6, 2.2);
}

function defaultBraceletTubeMm(weight) {
  return clamp(3.30 + (finite(weight, 1) - 1) * 1.60, 2.0, 7.0);
}

function defaultHoopTubeMm(weight) {
  return clamp(2.30 + (finite(weight, 1) - 1) * 1.10, 1.4, 4.5);
}

/** Approximate shank + setting mass from the canonical dimensions. */
export function estimateMetalMassGrams(spec) {
  const density = metalDensity(spec);

  if (spec.piece === "Necklace") {
    // Cable-family chain: torus links of wire radius r and outer radius R,
    // pitch ≈ 1.7× link outer diameter after interlocking overlap.
    const wireR = spec.necklace.wireDiameterMm * 0.5;
    const linkR = Math.max(wireR * 1.2, spec.necklace.linkOuterDiameterMm * 0.5 - wireR);
    const linkVolumeMm3 = 2 * Math.PI * Math.PI * linkR * wireR * wireR;
    const pitch = Math.max(spec.necklace.linkOuterDiameterMm * 1.7, 0.8);
    const linkCount = spec.necklace.chainLengthMm / pitch;
    // Bail, jump rings and clasp hardware ≈ 12 links equivalent.
    const volumeCm3 = (linkVolumeMm3 * (linkCount + 12)) / 1000;
    return volumeCm3 * density;
  }

  if (spec.piece === "Bracelet") {
    // Closed bangle torus; cuff ≈ 0.78× (open arc), tennis ≈ 0.85× (links
    // replace the solid tube but add settings).
    const centreR = spec.bracelet.innerDiameterMm * 0.5 + spec.bracelet.tubeDiameterMm * 0.5;
    const tubeR = spec.bracelet.tubeDiameterMm * 0.5;
    const torusVolumeMm3 = 2 * Math.PI * Math.PI * centreR * tubeR * tubeR;
    const styleFactor = spec.sourceState.silhouette === "Cuff" ? 0.78
      : spec.sourceState.silhouette === "Tennis" ? 0.85
      : 1.0;
    return (torusVolumeMm3 * styleFactor / 1000) * density;
  }

  if (spec.piece === "Earrings") {
    // Per earring: post cylinder + butterfly (≈ 2 post volumes) + head
    // hardware (≈ prong cylinders), or hoop torus for huggies. ×2 for the pair.
    const postR = spec.earrings.postDiameterMm * 0.5;
    const postVolumeMm3 = Math.PI * postR * postR * spec.earrings.postLengthMm;
    let perEarringMm3 = postVolumeMm3 * 3;
    if (spec.sourceState.silhouette === "Huggie") {
      const hoopCentreR = spec.earrings.hoopInnerDiameterMm * 0.5 + spec.earrings.hoopTubeDiameterMm * 0.5;
      const hoopTubeR = spec.earrings.hoopTubeDiameterMm * 0.5;
      perEarringMm3 += 2 * Math.PI * Math.PI * hoopCentreR * hoopTubeR * hoopTubeR;
    } else {
      const prongR = spec.setting.prongBaseDiameterMm * 0.5;
      const prongLength = Math.max(1.2, spec.setting.galleryHeightMm);
      perEarringMm3 += spec.setting.prongCount * Math.PI * prongR * prongR * prongLength * 0.78;
    }
    return (perEarringMm3 * 2 / 1000) * density;
  }

  if (spec.piece !== "Ring") return 0;
  const innerR = spec.ring.innerDiameterMm * 0.5;
  const radialThickness = spec.ring.shankThicknessMm;
  const axialWidth = spec.ring.shankWidthMm;
  const centerlineR = innerR + radialThickness * 0.5;
  const crossSectionArea = Math.PI * (radialThickness * 0.5) * (axialWidth * 0.5);
  const shankVolumeMm3 = 2 * Math.PI * centerlineR * crossSectionArea;

  // Gallery, prongs and head are approximated as a fraction of the shank plus
  // explicit prong cylinders. It is intentionally conservative and marked as
  // an estimate; production mass should come from the watertight CAD mesh.
  const prongR = spec.setting.prongBaseDiameterMm * 0.5;
  const prongLength = Math.max(1.2, spec.setting.galleryHeightMm);
  const prongVolumeMm3 = spec.setting.prongCount * Math.PI * prongR * prongR * prongLength * 0.78;
  const railVolumeMm3 = Math.PI * Math.pow(Math.max(0.35, spec.setting.galleryRailDiameterMm * 0.5), 2)
    * (2 * Math.PI * Math.max(spec.centerStone.widthMm, spec.centerStone.lengthMm) * 0.46);
  const volumeCm3 = (shankVolumeMm3 + prongVolumeMm3 + railVolumeMm3) / 1000;
  return volumeCm3 * density;
}

export function buildJewellerySpec(state = {}) {
  const piece = state.piece || "Ring";
  const shape = state.shape || "Round";
  const cut = CUT_DEFAULTS[shape] || CUT_DEFAULTS.Round;
  const carat = clamp(finite(state.carat ?? state.size, 1), 0.03, 50);
  const stoneDims = estimateStoneDimensionsMm({
    shape,
    stone: state.stone || "Clear Diamond",
    carat,
    lengthMm: state.stoneLengthMm,
    widthMm: state.stoneWidthMm,
    depthMm: state.stoneDepthMm,
    lengthWidthRatio: state.lengthWidthRatio
  });
  // A user-entered depth percentage must alter the physical depth when no
  // certificate depth is supplied. Otherwise the UI control would only change
  // internal facet ratios while the outside L×W×D box stayed unchanged.
  if (!hasFiniteInput(state.stoneDepthMm) && hasFiniteInput(state.totalDepthPct)) {
    stoneDims.depthMm = clamp(
      stoneDims.widthMm * clamp(Number(state.totalDepthPct), 25, 90) / 100,
      0.4,
      35
    );
  }

  const hasRingSize = hasFiniteInput(state.ringSizeUS ?? state.ringSize);
  const hasInnerDiameter = hasFiniteInput(state.innerDiameterMm);
  const ringSizeUS = clamp(
    hasRingSize
      ? Number(state.ringSizeUS ?? state.ringSize)
      : hasInnerDiameter
        ? innerDiameterMmToUS(Number(state.innerDiameterMm))
        : 7,
    1,
    16
  );
  const innerDiameterMm = hasInnerDiameter
    ? clamp(Number(state.innerDiameterMm), usRingSizeToInnerDiameterMm(1), usRingSizeToInnerDiameterMm(16))
    : usRingSizeToInnerDiameterMm(ringSizeUS);
  const shankWidthMm = clamp(finite(state.bandWidthMm ?? state.shankWidthMm, defaultBandWidthMm(state.weight)), 1.2, 12);
  const shankThicknessMm = clamp(finite(state.bandThicknessMm ?? state.shankThicknessMm, defaultBandThicknessMm(state.weight)), 1.1, 8);
  const prongCount = clamp(
    Number.isFinite(parseInt(state.prongCount, 10)) ? parseInt(state.prongCount, 10) : defaultProngCount(shape),
    2,
    12
  );
  const culetClearanceMm = clamp(finite(state.culetClearanceMm, 0.35), 0.10, 3.0);
  const galleryHeightMm = clamp(
    finite(state.galleryHeightMm, stoneDims.depthMm + culetClearanceMm + 0.7),
    1.8,
    20
  );

  const weight = clamp(finite(state.weight, 1), 0.5, 2.5);
  const silhouette = state.silhouette || "Classic Round";
  const chainWireMm = clamp(finite(state.chainWireMm, defaultChainWireMm(weight)), 0.5, 2.6);
  const braceletTubeMm = clamp(finite(state.braceletTubeMm, defaultBraceletTubeMm(weight)), 1.6, 9);
  const hoopTubeMm = defaultHoopTubeMm(weight);
  const earringDropDefault = silhouette === "Chandelier" ? 38 : 22;

  const spec = {
    version: 1,
    units: "mm",
    piece,
    ring: {
      sizeUS: ringSizeUS,
      innerDiameterMm,
      innerRadiusMm: innerDiameterMm * 0.5,
      shankWidthMm,
      shankThicknessMm,
      comfortFitRadiusMm: clamp(finite(state.comfortFitRadiusMm, 0.30), 0, 1.2)
    },
    necklace: {
      chainLengthMm: clamp(
        finite(state.chainLengthMm, NECKLACE_CHAIN_LENGTH_MM[silhouette] || 450),
        300,
        1000
      ),
      wireDiameterMm: chainWireMm,
      linkOuterDiameterMm: clamp(chainWireMm * 3.4, 1.7, 9),
      dropLengthMm: clamp(finite(state.dropLengthMm, 42), 10, 140)
    },
    bracelet: {
      innerDiameterMm: clamp(finite(state.braceletInnerDiameterMm, 63), 50, 90),
      tubeDiameterMm: braceletTubeMm,
      ovalRatio: 0.80
    },
    earrings: {
      postDiameterMm: clamp(finite(state.postDiameterMm, 0.90), 0.5, 1.6),
      postLengthMm: clamp(finite(state.postLengthMm, 10.5), 6, 16),
      butterflyDiameterMm: 5.2,
      hoopInnerDiameterMm: clamp(finite(state.hoopDiameterMm, 13), 8, 40),
      hoopTubeDiameterMm: hoopTubeMm,
      dropLengthMm: clamp(finite(state.dropLengthMm, earringDropDefault), 8, 90)
    },
    centerStone: {
      material: state.stone || "Clear Diamond",
      carat,
      shape,
      facetStyle: state.facetStyle || (["Emerald", "Asscher", "Baguette"].includes(shape) ? "Step" : "Brilliant"),
      ...stoneDims,
      tablePct: clamp(finite(state.tablePct, cut.tablePct), 20, 90),
      totalDepthPct: clamp(finite(state.totalDepthPct, cut.totalDepthPct), 25, 90),
      crownAngleDeg: clamp(finite(state.crownAngleDeg, cut.crownAngleDeg), 0, 60),
      pavilionAngleDeg: clamp(finite(state.pavilionAngleDeg, cut.pavilionAngleDeg), 0, 60),
      girdlePct: clamp(finite(state.girdlePct, cut.girdlePct), 0.5, 12),
      culetPct: clamp(finite(state.culetPct, cut.culetPct), 0, 20),
      symmetryMode: state.symmetryMode === "Antique" ? "Antique" : "Precision"
    },
    setting: {
      type: state.setting || "Prong",
      prongCount,
      prongBaseDiameterMm: clamp(finite(state.prongBaseDiameterMm, 0.95), 0.45, 3.0),
      prongTipDiameterMm: clamp(finite(state.prongTipDiameterMm, 0.58), 0.25, 2.0),
      bearingDepthMm: clamp(finite(state.bearingDepthMm, 0.24), 0.08, 1.2),
      galleryHeightMm,
      galleryRailDiameterMm: clamp(finite(state.galleryRailDiameterMm, 0.75), 0.35, 2.5),
      culetClearanceMm
    },
    halo: {
      enabled: Boolean(state.halo),
      gapMm: clamp(finite(state.haloGapMm ?? state.haloGap, 0.25), 0.05, 2.0),
      meleeDiameterMm: clamp(finite(state.haloMeleeDiameterMm, 1.30), 0.6, 4.0),
      count: state.haloCount && state.haloCount !== "Auto" ? clamp(parseInt(state.haloCount, 10) || 0, 0, 80) : 0
    },
    metal: {
      alloy: state.metal || "Yellow Gold",
      karat: state.karat || "18K",
      finish: state.finish || "High Polish",
      plating: state.plating || null
    },
    sourceState: {
      band: state.band || "Solitaire",
      silhouette: state.silhouette || "Classic Round"
    }
  };

  spec.world = {
    unitsPerMm: WORLD_UNITS_PER_MM,
    ringInnerRadius: mmToWorld(spec.ring.innerRadiusMm),
    shankWidth: mmToWorld(spec.ring.shankWidthMm),
    shankThickness: mmToWorld(spec.ring.shankThicknessMm),
    stoneLength: mmToWorld(spec.centerStone.lengthMm),
    stoneWidth: mmToWorld(spec.centerStone.widthMm),
    stoneDepth: mmToWorld(spec.centerStone.depthMm),
    prongBaseRadius: mmToWorld(spec.setting.prongBaseDiameterMm * 0.5),
    prongTipRadius: mmToWorld(spec.setting.prongTipDiameterMm * 0.5),
    bearingDepth: mmToWorld(spec.setting.bearingDepthMm),
    galleryHeight: mmToWorld(spec.setting.galleryHeightMm),
    galleryRailRadius: mmToWorld(spec.setting.galleryRailDiameterMm * 0.5),
    culetClearance: mmToWorld(spec.setting.culetClearanceMm),
    haloGap: mmToWorld(spec.halo.gapMm),
    haloStoneRadius: mmToWorld(spec.halo.meleeDiameterMm * 0.5),
    chainWireRadius: mmToWorld(spec.necklace.wireDiameterMm * 0.5),
    chainLinkRadius: mmToWorld(spec.necklace.linkOuterDiameterMm * 0.5),
    chainLength: mmToWorld(spec.necklace.chainLengthMm),
    necklaceDropLength: mmToWorld(spec.necklace.dropLengthMm),
    braceletInnerRadius: mmToWorld(spec.bracelet.innerDiameterMm * 0.5),
    braceletTubeRadius: mmToWorld(spec.bracelet.tubeDiameterMm * 0.5),
    postRadius: mmToWorld(spec.earrings.postDiameterMm * 0.5),
    postLength: mmToWorld(spec.earrings.postLengthMm),
    butterflyRadius: mmToWorld(spec.earrings.butterflyDiameterMm * 0.5),
    hoopInnerRadius: mmToWorld(spec.earrings.hoopInnerDiameterMm * 0.5),
    hoopTubeRadius: mmToWorld(spec.earrings.hoopTubeDiameterMm * 0.5),
    earringDropLength: mmToWorld(spec.earrings.dropLengthMm)
  };
  spec.estimate = {
    metalMassGrams: estimateMetalMassGrams(spec)
  };
  spec.validation = validateJewellerySpec(spec);
  return spec;
}

export function validateJewellerySpec(spec) {
  const issues = [];
  const add = (severity, code, message, field, recommendedValue) => {
    issues.push({ severity, code, message, field, recommendedValue });
  };

  if (spec.piece === "Ring") {
    if (spec.ring.shankWidthMm < 1.6) {
      add("error", "SHANK_WIDTH", "Shank width is below the practical daily-wear floor.", "bandWidthMm", 1.8);
    }
    if (spec.ring.shankThicknessMm < 1.45) {
      add("error", "SHANK_THICKNESS", "Shank thickness is too thin after finishing allowance.", "bandThicknessMm", 1.6);
    }
    const load = spec.centerStone.carat / Math.max(spec.ring.shankWidthMm * spec.ring.shankThicknessMm, 0.1);
    if (load > 0.75) {
      add("warning", "HEAD_TORQUE", "Stone mass is high for the selected shank section; shoulder reinforcement is recommended.", "bandWidthMm", Math.max(2.2, spec.ring.shankWidthMm));
    }
  }

  if (spec.setting.type !== "Bezel" && spec.setting.type !== "Tension") {
    if (spec.setting.prongBaseDiameterMm < 0.8) {
      add("error", "PRONG_BASE", "Prong base diameter leaves too little metal for a durable bearing.", "prongBaseDiameterMm", 0.9);
    }
    if (spec.setting.prongTipDiameterMm < 0.45) {
      add("warning", "PRONG_TIP", "Prong tip is extremely fine and may not survive final polishing.", "prongTipDiameterMm", 0.55);
    }
    const residual = spec.setting.prongBaseDiameterMm * 0.5 - spec.setting.bearingDepthMm;
    if (residual < 0.22) {
      add("error", "BEARING_RESIDUAL", "Bearing cut removes too much of the prong cross-section.", "bearingDepthMm", Math.max(0.12, spec.setting.prongBaseDiameterMm * 0.5 - 0.25));
    }
  }

  if (spec.setting.culetClearanceMm < 0.25) {
    add("error", "CULET_CLEARANCE", "Culet clearance is too small; the stone can contact the finger or gallery.", "culetClearanceMm", 0.35);
  }

  if (spec.setting.type === "Tension") {
    const safe = new Set(["Clear Diamond", "Blue Sapphire", "Blush Sapphire", "Padparadscha", "Ruby Red"]);
    if (!safe.has(spec.centerStone.material)) {
      add("error", "TENSION_STONE", "This material is not suitable for a true tension setting.", "setting", "Prong");
    }
  }

  if (spec.halo.enabled && spec.halo.gapMm < 0.12) {
    add("warning", "HALO_GAP", "Halo gap is so tight that casting and cleaning access are compromised.", "haloGapMm", 0.20);
  }

  if (spec.piece === "Necklace") {
    if (spec.necklace.wireDiameterMm < 0.7) {
      add("error", "CHAIN_WIRE", "Chain wire is below the daily-wear floor; the chain will stretch and snap.", "chainWireMm", 0.8);
    }
    // Pendant load: carat mass hanging on the wire cross-section.
    const wireArea = Math.PI * Math.pow(spec.necklace.wireDiameterMm * 0.5, 2);
    if (spec.centerStone.carat / Math.max(wireArea, 0.05) > 3.2) {
      add("warning", "PENDANT_LOAD", "Pendant is heavy for the selected chain gauge; a thicker wire is recommended.", "chainWireMm", Math.min(2.2, spec.necklace.wireDiameterMm + 0.4));
    }
    if (spec.necklace.chainLengthMm < 340) {
      add("warning", "CHAIN_LENGTH", "Chain is shorter than a standard choker; confirm the neck measurement.", "chainLengthMm", 380);
    }
  }

  if (spec.piece === "Bracelet") {
    if (spec.bracelet.innerDiameterMm < 55) {
      add("warning", "BANGLE_FIT", "Inner diameter is below the common adult minimum; confirm the wrist measurement.", "braceletInnerDiameterMm", 58);
    }
    if (spec.bracelet.tubeDiameterMm < 2.2) {
      add("error", "BANGLE_WALL", "Bangle cross-section is too thin to survive daily knocks.", "braceletTubeMm", 2.6);
    }
    const braceletLoad = spec.centerStone.carat / Math.max(Math.pow(spec.bracelet.tubeDiameterMm, 2), 0.5);
    if (braceletLoad > 0.55) {
      add("warning", "BANGLE_HEAD", "Focal stone is heavy for the bangle section; reinforce the seat.", "braceletTubeMm", Math.min(7, spec.bracelet.tubeDiameterMm + 0.8));
    }
  }

  if (spec.piece === "Earrings") {
    if (spec.earrings.postDiameterMm < 0.6) {
      add("error", "POST_GAUGE", "Post is thinner than a safe piercing gauge and will bend.", "postDiameterMm", 0.8);
    }
    if (spec.earrings.postDiameterMm > 1.3) {
      add("warning", "POST_GAUGE_WIDE", "Post is thicker than a standard piercing; most wearers will find it uncomfortable.", "postDiameterMm", 1.0);
    }
    if (spec.centerStone.carat > 2.6) {
      add("warning", "LOBE_LOAD", "Stone mass is high for a lobe post; consider omega backs or smaller stones.", "carat", 2.0);
    }
  }

  return {
    valid: !issues.some((issue) => issue.severity === "error"),
    issues
  };
}

export function physicalMetadata(spec) {
  return {
    specVersion: spec.version,
    units: spec.units,
    unitsPerMm: WORLD_UNITS_PER_MM,
    piece: spec.piece,
    ringInnerDiameterMm: spec.ring.innerDiameterMm,
    ringOuterDiameterMm: spec.ring.innerDiameterMm + spec.ring.shankThicknessMm * 2,
    chainLengthMm: spec.necklace.chainLengthMm,
    chainWireDiameterMm: spec.necklace.wireDiameterMm,
    braceletInnerDiameterMm: spec.bracelet.innerDiameterMm,
    braceletTubeDiameterMm: spec.bracelet.tubeDiameterMm,
    postDiameterMm: spec.earrings.postDiameterMm,
    hoopInnerDiameterMm: spec.earrings.hoopInnerDiameterMm,
    stoneDimensionsMm: {
      length: spec.centerStone.lengthMm,
      width: spec.centerStone.widthMm,
      depth: spec.centerStone.depthMm
    },
    estimatedMetalMassGrams: spec.estimate.metalMassGrams,
    validation: spec.validation
  };
}
