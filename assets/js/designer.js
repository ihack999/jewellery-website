import {
  WORLD_UNITS_PER_MM,
  buildJewellerySpec,
  mmToWorld,
  physicalMetadata
} from "./jewellery-spec.js";

const METAL_COLORS = {
  "White Gold": "#e8eef1",
  Platinum: "#d9e1e5",
  "Yellow Gold": "#d5a647",
  "Rose Gold": "#c98778",
  "Champagne Gold": "#d4b574",
  "Black Gold": "#3a3438",
  "Mirror Silver": "#f4f6f8",
  "Bronze Patina": "#7a5a3a",
  "Two-Tone Mix": "#d6c2a2"
};

// Finish choices are material presets, not coatings. Bare jewellery alloys
// do not receive an automatic dielectric clearcoat; plating/lacquer must be
// represented as an explicit surface layer when a design actually uses one.
const FINISH_SETTINGS = {
  "High Polish": { roughness: 0.12 },
  "Soft Satin": { roughness: 0.38 },
  "Milgrain Edge": { roughness: 0.20 },
  "Hammered": { roughness: 0.34 },
  "Sandblast": { roughness: 0.68 },
  "Brushed": { roughness: 0.32 },
  "Stardust": { roughness: 0.48 }
};

const STONE_PROFILES = {
  "Clear Diamond": {
    color: "#ffffff",
    absorption: "#ffffff",   // transmits unchanged - pure water white
    tint: "#ffffff",
    table: "#ffffff",
    opacity: 1,
    transmission: 1,
    roughness: 0.01,
    ior: 2.417,              // diamond reference
    dispersion: 0.044,       // physically-accurate Cauchy dispersion
    attenuationDistance: 6,
    thickness: 1.4,
    fire: 0.82
  },
  // Colored gemstones — body color is driven by Beer-Lambert volumetric
  // absorption (attenuationColor * exp(-d / attenuationDistance)). The
  // `color` is the diffuse/specular surface tint that you see on facet
  // edges + table reflections; the `absorption` is the deep hue that the
  // light picks up as it traverses the stone. Together they read as the
  // saturated body color of a top-grade cut stone.
  "Blush Sapphire": {
    color: "#ff5d8a",        // hot pink facet pickup
    absorption: "#c41a55",   // padparadscha-pink Beer-Lambert tint
    tint: "#ffc6d9",
    table: "#ffe4ed",
    opacity: 1,
    transmission: 0.92,
    roughness: 0.018,
    ior: 1.77,
    dispersion: 0.022,
    attenuationDistance: 0.32,
    thickness: 1.05,
    fire: 0.42
  },
  "Blue Sapphire": {
    color: "#2a64f5",        // royal blue facet color
    absorption: "#0a2db4",   // Kashmir cornflower volumetric tint
    tint: "#5a8aff",
    table: "#bcd1ff",
    opacity: 1,
    transmission: 0.9,
    roughness: 0.018,
    ior: 1.77,
    dispersion: 0.022,
    attenuationDistance: 0.22,
    thickness: 1.05,
    fire: 0.38
  },
  "Emerald Green": {
    color: "#1ec07b",        // saturated green tint
    absorption: "#0a7a3a",   // Colombian Muzo green
    tint: "#39d693",
    table: "#a7f0ca",
    opacity: 1,
    transmission: 0.86,
    roughness: 0.035,        // emerald typically has a "garden" of inclusions
    ior: 1.582,
    dispersion: 0.018,
    attenuationDistance: 0.2,
    thickness: 0.95,
    fire: 0.3
  },
  "Ruby Red": {
    color: "#ff1d3e",        // pigeon-blood ruby surface
    absorption: "#9b0d2a",   // deep Burmese ruby volumetric color
    tint: "#ff5876",
    table: "#ffc0cf",
    opacity: 1,
    transmission: 0.88,
    roughness: 0.02,
    ior: 1.77,
    dispersion: 0.022,
    attenuationDistance: 0.22,
    thickness: 1.05,
    fire: 0.42
  },
  "Amethyst Purple": {
    color: "#9b3df0",        // vivid Siberian amethyst
    absorption: "#4a0e8e",   // deep regal purple Beer-Lambert
    tint: "#b486e6",
    table: "#d9c0f4",
    opacity: 1,
    transmission: 0.9,
    roughness: 0.022,
    ior: 1.55,
    dispersion: 0.017,
    attenuationDistance: 0.32,
    thickness: 1,
    fire: 0.34
  },
  "Aquamarine": {
    color: "#34c6e8",        // Santa Maria sea-blue
    absorption: "#0a86b4",   // saturated aquamarine body
    tint: "#7ee0f0",
    table: "#dff4f8",
    opacity: 1,
    transmission: 0.94,
    roughness: 0.018,
    ior: 1.577,
    dispersion: 0.018,
    attenuationDistance: 0.42,
    thickness: 0.95,
    fire: 0.36
  },
  // Black Onyx - opaque, mirror-black with cool sheen. transmission ~0
  // means light bounces off the surface rather than passing through.
  "Black Onyx": {
    color: "#0a0a0c",
    absorption: "#000000",
    tint: "#1d1d22",
    table: "#2a2a30",
    opacity: 1,
    transmission: 0.02,
    roughness: 0.04,
    ior: 1.49,
    dispersion: 0,
    attenuationDistance: 0.02,
    thickness: 1.2,
    fire: 0
  },
  // Fire Opal - milky semi-translucent with play-of-color rainbow shift.
  // Driven by extra iridescence in materialForStone.
  "Fire Opal": {
    color: "#ffb070",
    absorption: "#ff7a2a",
    tint: "#ffd1a3",
    table: "#fff0e0",
    opacity: 1,
    transmission: 0.55,
    roughness: 0.18,
    ior: 1.45,
    dispersion: 0.026,
    attenuationDistance: 0.6,
    thickness: 1.1,
    fire: 0.55
  },
  // Imperial Citrine - sun-yellow gold tone
  "Citrine Yellow": {
    color: "#ffc733",
    absorption: "#c98a0a",
    tint: "#ffe08a",
    table: "#fff5d1",
    opacity: 1,
    transmission: 0.92,
    roughness: 0.02,
    ior: 1.553,
    dispersion: 0.013,
    attenuationDistance: 0.45,
    thickness: 0.95,
    fire: 0.32
  },
  // Morganite - peachy soft pink, romantic warmth
  "Morganite Peach": {
    color: "#ffb0a2",
    absorption: "#ff7a6a",
    tint: "#ffd2c6",
    table: "#fff0eb",
    opacity: 1,
    transmission: 0.93,
    roughness: 0.02,
    ior: 1.585,
    dispersion: 0.014,
    attenuationDistance: 0.55,
    thickness: 0.95,
    fire: 0.3
  },
  // Tanzanite - vivid violet-blue
  "Tanzanite Violet": {
    color: "#5d4cef",
    absorption: "#2a18a8",
    tint: "#8a7af0",
    table: "#c8c0f4",
    opacity: 1,
    transmission: 0.88,
    roughness: 0.02,
    ior: 1.69,
    dispersion: 0.019,
    attenuationDistance: 0.28,
    thickness: 1,
    fire: 0.36
  },
  // Salt & Pepper Diamond - smoky transparent with grey inclusions feel
  "Salt & Pepper": {
    color: "#bfc1c4",
    absorption: "#3a3a40",
    tint: "#dadbdd",
    table: "#eaebed",
    opacity: 1,
    transmission: 0.74,
    roughness: 0.08,
    ior: 2.417,
    dispersion: 0.032,
    attenuationDistance: 0.65,
    thickness: 1.3,
    fire: 0.55
  },
  // Alexandrite — chrysoberyl with the chromium III absorption band at
  // ~580 nm. The band transmits BOTH blue-green and red; whichever wins
  // depends on the illuminant's spectral power distribution, so the body
  // color physically flips between teal-green (daylight, high CCT) and
  // raspberry-red (incandescent, low CCT). materialForStone interpolates
  // the two poles below from the active lighting mode's CCT.
  "Alexandrite Shift": {
    color: "#1fae7a",          // daylight pole — bluish teal-green
    absorption: "#0c6e4c",
    tint: "#5ad6a8",
    table: "#c8f0de",
    colorChange: {
      // Incandescent pole — columbine raspberry-red
      color: "#c4385f",
      absorption: "#8e1b3e",
      tint: "#e88aa6",
      table: "#f6cdd9"
    },
    opacity: 1,
    transmission: 0.9,
    roughness: 0.02,
    ior: 1.746,
    dispersion: 0.015,
    attenuationDistance: 0.3,
    thickness: 1.0,
    fire: 0.45
  },
  // Paraiba tourmaline — copper-bearing elbaite with the famous "neon
  // windex" glow. The Cu²⁺ absorption leaves an unusually pure cyan
  // transmission window, so even small stones look lit from within.
  "Paraiba Tourmaline": {
    color: "#19e0d6",
    absorption: "#0894a0",
    tint: "#7af0e8",
    table: "#d2faf6",
    opacity: 1,
    transmission: 0.93,
    roughness: 0.018,
    ior: 1.62,
    dispersion: 0.017,
    attenuationDistance: 0.4,
    thickness: 0.95,
    fire: 0.4
  },
  // Moonstone — orthoclase with adularescence: light scatters off
  // exsolution lamellae inside the stone producing a billowy blue schiller
  // that floats above the surface. Modeled with high-thickness thin-film
  // iridescence + a strong bluish sheen in materialForStone.
  "Moonstone Glow": {
    color: "#e9eef8",
    absorption: "#b9d2ff",
    tint: "#dfe8fb",
    table: "#f6f9ff",
    opacity: 1,
    transmission: 0.62,
    roughness: 0.14,
    ior: 1.52,
    dispersion: 0.008,
    attenuationDistance: 0.9,
    thickness: 1.05,
    fire: 0.18,
    adularescence: true
  },
  // Padparadscha sapphire — the rare lotus-hued corundum balancing pink
  // and orange. Same crystal physics as the other sapphires (Mohs 9).
  "Padparadscha": {
    color: "#ff8a5c",
    absorption: "#d4472a",
    tint: "#ffc4a8",
    table: "#ffe6d6",
    opacity: 1,
    transmission: 0.9,
    roughness: 0.018,
    ior: 1.77,
    dispersion: 0.022,
    attenuationDistance: 0.3,
    thickness: 1.05,
    fire: 0.42
  }
};

const STONE_COLORS = Object.fromEntries(
  Object.entries(STONE_PROFILES).map(([name, profile]) => [name, profile.color])
);

const STONE_IMAGE_URLS = {
  "Clear Diamond": "assets/images/gemstones/clear-diamond.jpg",
  "Blush Sapphire": "assets/images/gemstones/blush-sapphire.jpg",
  "Blue Sapphire": "assets/images/gemstones/blue-sapphire.jpg",
  "Emerald Green": "assets/images/gemstones/emerald-green.jpg"
};

const TEXTURE_URLS = {
  studioHdr: "assets/textures/studio_small_08_1k.hdr",
  metalNormal: "assets/textures/Metal002/Metal002_1K-JPG_NormalGL.jpg",
  metalRoughness: "assets/textures/Metal002/Metal002_1K-JPG_Roughness.jpg"
};

const DESIGN_STUDIO_HASH = "#design-studio";
const DESIGN_STUDIO_PUBLIC = true;
const designerUpdates = new WeakMap();
let designerSetupPromise = null;

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

const DESIGN_STORAGE_KEY = "tj-custom-design-state";
const SAVED_DESIGN_KEY = "tj-saved-design-state";

const DESIGN_DEFAULTS = {
  piece: "Ring",
  metal: "Yellow Gold",
  karat: "18K",
  setting: "Prong",
  finish: "High Polish",
  shape: "Round",
  stone: "Clear Diamond",
  band: "Solitaire",
  backdrop: "Velvet",
  view: "Three-Quarter",
  size: "1.2",
  weight: "1",
  halo: true,
  accent: true,
  hiddenHalo: false,
  milgrain: false,
  prongCount: "Auto",
  silhouette: "Classic Round",
  engraving: "",
  lighting: "Softbox",
  // Necklace-specific: chain link pattern + clasp closure.
  // chainType drives the per-segment link geometry walked along the
  // shared arc-length chainPath. clasp adds a manufactured closure at
  // the chain endpoints. Both are ignored for non-Necklace pieces.
  chainType: "Cable",
  clasp: "Lobster",
  // Wild-mode toggles - unconventional looks without breaking geometry.
  // emissiveGlow: stone self-illuminates with its absorption hue.
  // twoTone:      band reads with a contrasting sheen tint.
  // sparkleBurst: pumps the scene sparkle particles for a hero look.
  emissiveGlow: false,
  twoTone: false,
  sparkleBurst: false,
  // Fine-tune: per-design transforms that adjust geometry without
  // changing materials or composition. Defaults keep visuals identical.
  setRotation: "0",   // degrees, spins head (stone + prongs + halo) around vertical
  stoneTilt: "0",     // degrees, tilts just the center stone within its setting
  accentDensity: "Auto", // Auto | Sparse | Dense for shoulder side stones
  haloGap: "0.25",    // physical millimetre gap between centre girdle and halo
  haloCount: "Auto",  // Auto | explicit count
  prongHeight: "1",   // visual multiplier; physical galleryHeightMm is preferred

  // Canonical physical inputs. These are optional so the existing UI keeps
  // working; when absent, jewellery-spec.js derives conservative defaults
  // from the legacy size/weight controls. All values are millimetres except
  // ringSizeUS, angles and percentages.
  ringSizeUS: "7",
  bandWidthMm: "",
  bandThicknessMm: "",
  stoneLengthMm: "",
  stoneWidthMm: "",
  stoneDepthMm: "",
  lengthWidthRatio: "",
  tablePct: "",
  totalDepthPct: "",
  crownAngleDeg: "",
  pavilionAngleDeg: "",
  girdlePct: "",
  culetPct: "",
  prongBaseDiameterMm: "",
  prongTipDiameterMm: "",
  bearingDepthMm: "",
  galleryHeightMm: "",
  galleryRailDiameterMm: "",
  culetClearanceMm: "",
  haloMeleeDiameterMm: "",
  symmetryMode: "Precision"
};

// Per-piece sub-type catalogue. Each silhouette physically changes the
// geometry the builder produces — not just a label. Keep the first entry
// per piece as the "classic" fall-through so legacy state always matches
// something visually familiar.
const SILHOUETTES = {
  Ring: ["Classic Round", "Cigar Band", "Split Shank", "Tapered Shank", "Stacked Double"],
  Necklace: ["Pendant", "Y-Drop", "Lariat", "Station", "Choker"],
  Bracelet: ["Bangle", "Tennis", "Cuff", "Station"],
  Earrings: ["Stud", "Drop", "Huggie", "Chandelier"]
};

const DESIGN_OPTIONS = {
  piece: ["Ring", "Necklace", "Bracelet", "Earrings"],
  metal: Object.keys(METAL_COLORS),
  karat: ["10K", "14K", "18K", "22K", "950"],
  setting: ["Prong", "Bezel", "Cathedral", "Trellis", "Tension"],
  finish: Object.keys(FINISH_SETTINGS),
  shape: ["Round", "Princess", "Cushion", "Oval", "Emerald", "Asscher", "Marquise", "Pear", "Heart", "Trillion", "Baguette", "Hexagon", "Kite"],
  stone: Object.keys(STONE_PROFILES),
  band: ["Solitaire", "Pavé", "Channel", "Three-Stone", "Tapered Baguette", "Twist", "Knife-Edge", "Eternity", "Bypass"],
  chainType: ["Cable", "Curb", "Box", "Rope", "Snake", "Figaro", "Wheat", "Herringbone", "Byzantine", "Mariner"],
  clasp: ["Lobster", "Spring Ring", "Toggle", "Box", "S-Hook", "Hidden"],
  prongCount: ["Auto", "3", "4", "5", "6", "8"],
  silhouette: Array.from(new Set(Object.values(SILHOUETTES).flat())),
  backdrop: ["Studio White", "Velvet", "Marble", "Onyx", "Linen", "Sweep", "Concrete", "Driftwood", "Holographic", "Smoke", "Ivory"],
  view: ["Three-Quarter", "Macro", "Top-Down", "Profile"],
  lighting: ["Daylight", "Candlelight", "Showroom", "Flash", "Sunset", "Moonlight", "Neon", "Softbox", "Gallery"]
};

const DESIGN_PRESETS = {
  classic: {
    piece: "Ring",
    metal: "Platinum",
    setting: "Prong",
    finish: "High Polish",
    shape: "Oval",
    stone: "Clear Diamond",
    size: "1.4",
    weight: "1.05",
    halo: true,
    accent: true,
    engraving: "",
    lighting: "Showroom"
  },
  cocktail: {
    piece: "Ring",
    metal: "Rose Gold",
    setting: "Prong",
    finish: "High Polish",
    shape: "Cushion",
    stone: "Blue Sapphire",
    size: "2",
    weight: "1.28",
    halo: true,
    accent: true,
    engraving: "",
    lighting: "Flash"
  },
  pendant: {
    piece: "Necklace",
    metal: "White Gold",
    setting: "Bezel",
    finish: "Soft Satin",
    shape: "Round",
    stone: "Clear Diamond",
    size: "1",
    weight: "0.9",
    halo: false,
    accent: false,
    engraving: "",
    lighting: "Daylight"
  },
  vintage: {
    piece: "Ring",
    metal: "Yellow Gold",
    setting: "Cathedral",
    finish: "Milgrain Edge",
    shape: "Pear",
    stone: "Clear Diamond",
    size: "1.5",
    weight: "1.16",
    halo: true,
    accent: true,
    engraving: "",
    lighting: "Candlelight"
  },
  estate: {
    piece: "Ring",
    metal: "Platinum",
    karat: "950",
    setting: "Bezel",
    finish: "High Polish",
    shape: "Emerald",
    stone: "Clear Diamond",
    band: "Three-Stone",
    backdrop: "Onyx",
    view: "Macro",
    size: "1.8",
    weight: "1.18",
    halo: false,
    accent: true,
    engraving: "",
    lighting: "Showroom"
  },
  princessPave: {
    piece: "Ring",
    metal: "White Gold",
    karat: "18K",
    setting: "Prong",
    finish: "High Polish",
    shape: "Princess",
    stone: "Clear Diamond",
    band: "Pavé",
    backdrop: "Marble",
    view: "Three-Quarter",
    size: "1.4",
    weight: "1.08",
    halo: false,
    accent: true,
    engraving: "",
    lighting: "Daylight"
  },
  trinity: {
    piece: "Ring",
    metal: "Rose Gold",
    karat: "22K",
    setting: "Prong",
    finish: "Soft Satin",
    shape: "Round",
    stone: "Clear Diamond",
    band: "Twist",
    backdrop: "Linen",
    view: "Three-Quarter",
    size: "1.3",
    weight: "1.1",
    halo: false,
    accent: false,
    engraving: "",
    lighting: "Candlelight"
  },
  // ---- Unconventional / statement presets ----
  celestial: {
    piece: "Necklace",
    metal: "Mirror Silver",
    karat: "950",
    setting: "Bezel",
    finish: "Stardust",
    shape: "Marquise",
    stone: "Tanzanite Violet",
    band: "Solitaire",
    backdrop: "Onyx",
    view: "Macro",
    size: "1.6",
    weight: "0.95",
    halo: true,
    accent: true,
    engraving: "",
    lighting: "Moonlight",
    emissiveGlow: true,
    sparkleBurst: true
  },
  brutalist: {
    piece: "Ring",
    metal: "Black Gold",
    karat: "18K",
    setting: "Tension",
    finish: "Sandblast",
    shape: "Hexagon",
    stone: "Salt & Pepper",
    band: "Knife-Edge",
    backdrop: "Concrete",
    view: "Macro",
    size: "1.6",
    weight: "1.25",
    halo: false,
    accent: false,
    engraving: "",
    lighting: "Showroom"
  },
  neonCyber: {
    piece: "Ring",
    metal: "Mirror Silver",
    karat: "18K",
    setting: "Tension",
    finish: "High Polish",
    shape: "Kite",
    stone: "Emerald Green",
    band: "Knife-Edge",
    backdrop: "Holographic",
    view: "Three-Quarter",
    size: "1.5",
    weight: "1",
    halo: false,
    accent: false,
    engraving: "",
    lighting: "Neon",
    emissiveGlow: true,
    sparkleBurst: true
  },
  punkSpike: {
    piece: "Ring",
    metal: "Black Gold",
    karat: "18K",
    setting: "Prong",
    finish: "Brushed",
    shape: "Trillion",
    stone: "Black Onyx",
    band: "Knife-Edge",
    backdrop: "Onyx",
    view: "Three-Quarter",
    size: "1.8",
    weight: "1.3",
    halo: false,
    accent: false,
    engraving: "",
    lighting: "Flash",
    twoTone: true
  },
  sunsetGlow: {
    piece: "Ring",
    metal: "Bronze Patina",
    karat: "14K",
    setting: "Cathedral",
    finish: "Brushed",
    shape: "Pear",
    stone: "Fire Opal",
    band: "Twist",
    backdrop: "Driftwood",
    view: "Macro",
    size: "1.4",
    weight: "1.1",
    halo: true,
    accent: true,
    engraving: "",
    lighting: "Sunset",
    emissiveGlow: true
  },
  // ---- New-stone showcases ----
  // Alexandrite under candlelight opens on the raspberry-red pole of the
  // colour change; switch the lighting to Daylight to watch it go green.
  alexandrite: {
    piece: "Ring",
    metal: "Platinum",
    karat: "950",
    setting: "Prong",
    finish: "High Polish",
    shape: "Cushion",
    stone: "Alexandrite Shift",
    band: "Solitaire",
    backdrop: "Onyx",
    view: "Three-Quarter",
    size: "1.5",
    weight: "1.1",
    halo: false,
    accent: true,
    engraving: "",
    lighting: "Candlelight"
  },
  paraibaHalo: {
    piece: "Ring",
    metal: "White Gold",
    karat: "18K",
    setting: "Prong",
    finish: "High Polish",
    shape: "Oval",
    stone: "Paraiba Tourmaline",
    band: "Pavé",
    backdrop: "Studio White",
    view: "Three-Quarter",
    size: "1.6",
    weight: "1.05",
    halo: true,
    accent: true,
    engraving: "",
    lighting: "Gallery"
  },
  moonlitDrop: {
    piece: "Earrings",
    silhouette: "Drop",
    metal: "Yellow Gold",
    karat: "18K",
    setting: "Bezel",
    finish: "Soft Satin",
    shape: "Round",
    stone: "Moonstone Glow",
    backdrop: "Smoke",
    view: "Three-Quarter",
    size: "1.3",
    weight: "1",
    halo: false,
    accent: false,
    engraving: "",
    lighting: "Moonlight"
  },

  // ===========================================================================
  // REFERENCE CATALOGUE PRESETS  (R1–R5, B1–B5, N1–N5, E1–E5)
  //
  // 20 internet-sourced reference pieces, mapped to the closest combination of
  // studio state that the procedural renderer can actually produce.
  //
  // Each entry includes a `catalogue` block with:
  //   id            – R1/B2/N3/E4 reference code from the source brief
  //   name          – product brief title
  //   achievable    – "full" | "partial" | "skin-only"
  //                   • full       – studio output is a faithful reproduction
  //                   • partial    – proportions/stones match but ornament
  //                                  details (milgrain density, openwork
  //                                  panels) are approximated
  //                   • skin-only  – only the silhouette / metal / stone
  //                                  reads; signature feature (enamel,
  //                                  filigree, granulation, animal head,
  //                                  rope-link chain, multi-strand pearls)
  //                                  is NOT yet a renderer feature
  //   needsFeature  – ordered list of new geometry generators that would be
  //                   required to bridge the gap to a true reproduction
  //
  // INDEX of new generators required to lift every "skin-only"/"partial"
  // entry to "full":
  //   makeChampleveEnamelPanel(curve, palette)   – B5, N2 (enamel inlay)
  //   makeFiligreeCone(height, motif)            – E3       (wire scroll cone)
  //   makeGranulationOrb(R, beadR, pattern)      – E4       (decorated bell)
  //   makeRopeLinkChain(curve, twistFreq)        – N3       (twisted rope chain)
  //   makeMultiStrandPearl(strands, lengths)     – N2, N4   (parallel pearl rows)
  //   makeOpenworkScrollPanel(panel, motif)      – N1, N5   (pierced lace plates)
  //   makeAnimalHeadTerminal(species, scale)     – E5       (lion / ram head)
  //   makeCharm(motif)                           – B2       (heart/key/disc/etc)
  //   makeEnamelDrop(...)                        – E1       (snap-on covers)
  //   makeCaboBezel(stoneR, depth)               – B5       (cabochon mount)
  // Once any of these lands, flip the matching catalogue entry's
  // `needsFeature` to [] and bump `achievable` to "full".
  // ===========================================================================

  // ---- R1 · Smoky Halo Statement Ring ---------------------------------------
  ref_R1_smokyHalo: {
    catalogue: { id: "R1", name: "Smoky Halo Statement Ring", achievable: "full", needsFeature: [] },
    piece: "Ring", metal: "White Gold", karat: "14K",
    setting: "Cathedral", finish: "High Polish",
    shape: "Round", stone: "Citrine Yellow",   // smoky stand-in; closest warm body
    band: "Solitaire",
    size: "2", weight: "1.18",
    halo: true, accent: false, hiddenHalo: false,
    backdrop: "Velvet", view: "Three-Quarter", lighting: "Showroom",
    engraving: ""
  },

  // ---- R2 · Vintage Platinum Three-Stone -----------------------------------
  ref_R2_vintage3Stone: {
    catalogue: { id: "R2", name: "Vintage Platinum Three-Stone Diamond Ring", achievable: "full", needsFeature: [] },
    piece: "Ring", metal: "Platinum", karat: "950",
    setting: "Prong", finish: "Milgrain Edge",
    shape: "Round", stone: "Clear Diamond",
    band: "Three-Stone",
    size: "1.1", weight: "1.05",
    halo: false, accent: true,
    backdrop: "Linen", view: "Three-Quarter", lighting: "Candlelight",
    engraving: ""
  },

  // ---- R3 · Citrine & Diamond Bypass ---------------------------------------
  ref_R3_citrineBypass: {
    catalogue: { id: "R3", name: "Citrine & Diamond Modern Bypass Ring", achievable: "full", needsFeature: [] },
    piece: "Ring", metal: "White Gold", karat: "14K",
    setting: "Prong", finish: "High Polish",
    shape: "Oval", stone: "Citrine Yellow",
    band: "Bypass",
    size: "1.4", weight: "1.12",
    halo: false, accent: true,
    backdrop: "Marble", view: "Three-Quarter", lighting: "Daylight",
    engraving: ""
  },

  // ---- R4 · Classic Bridal Solitaire + Matching Band -----------------------
  ref_R4_classicBridal: {
    catalogue: { id: "R4", name: "Classic Bridal Solitaire + Matching Band", achievable: "full", needsFeature: ["matched wedding band as second piece"] },
    piece: "Ring", metal: "White Gold", karat: "18K",
    setting: "Prong", finish: "High Polish",
    shape: "Round", stone: "Clear Diamond",
    band: "Pavé",
    size: "1", weight: "1.0",
    halo: false, accent: true,
    backdrop: "Ivory", view: "Three-Quarter", lighting: "Showroom",
    engraving: ""
  },

  // ---- R5 · Milgrain Halo Diamond Ring -------------------------------------
  ref_R5_milgrainHalo: {
    catalogue: { id: "R5", name: "Milgrain Halo Diamond Ring", achievable: "full", needsFeature: [] },
    piece: "Ring", metal: "Platinum", karat: "950",
    setting: "Prong", finish: "Milgrain Edge",
    shape: "Round", stone: "Clear Diamond",
    band: "Pavé",
    size: "1", weight: "1.0",
    halo: true, accent: true,
    backdrop: "Velvet", view: "Macro", lighting: "Showroom",
    engraving: ""
  },

  // ---- B1 · Two-Tone Silver Bangle with Gold Drop --------------------------
  ref_B1_twoToneDrop: {
    catalogue: { id: "B1", name: "Two-Tone Silver Bangle with Gold Drop", achievable: "partial",
      needsFeature: ["two-tone material zones on a single mesh", "pendant drop on bangle"] },
    piece: "Bracelet", metal: "Mirror Silver", karat: "950",
    setting: "Bezel", finish: "High Polish",
    shape: "Pear", stone: "Citrine Yellow",       // gold-look drop substitute
    band: "Solitaire",
    size: "1", weight: "0.7",
    halo: false, accent: false,
    backdrop: "Linen", view: "Macro", lighting: "Daylight",
    engraving: "", twoTone: true
  },

  // ---- B2 · Gold Charm Story Bracelet --------------------------------------
  ref_B2_charmStory: {
    catalogue: { id: "B2", name: "Gold Charm Story Bracelet", achievable: "skin-only",
      needsFeature: ["makeCharm(motif)", "jump-ring attachment along chain", "charm motif library (heart/key/disc/initial/birthstone)"] },
    piece: "Bracelet", metal: "Yellow Gold", karat: "14K",
    setting: "Bezel", finish: "High Polish",
    shape: "Round", stone: "Clear Diamond",
    band: "Solitaire",
    size: "0.8", weight: "0.6",
    halo: false, accent: false,
    backdrop: "Velvet", view: "Three-Quarter", lighting: "Candlelight",
    engraving: ""
  },

  // ---- B3 · Emerald & Diamond Cuff Bracelet --------------------------------
  ref_B3_emeraldCuff: {
    catalogue: { id: "B3", name: "Emerald & Diamond Cuff Bracelet", achievable: "full", needsFeature: [] },
    piece: "Bracelet", metal: "White Gold", karat: "14K",
    setting: "Bezel", finish: "High Polish",
    shape: "Emerald", stone: "Emerald Green",
    band: "Pavé",
    size: "1.6", weight: "1.2",
    halo: false, accent: true,
    backdrop: "Velvet", view: "Macro", lighting: "Showroom",
    engraving: ""
  },

  // ---- B4 · Ruby & Diamond Band Bracelet -----------------------------------
  ref_B4_rubyBand: {
    catalogue: { id: "B4", name: "Ruby & Diamond Band Bracelet", achievable: "full", needsFeature: [] },
    piece: "Bracelet", metal: "Yellow Gold", karat: "18K",
    setting: "Bezel", finish: "High Polish",
    shape: "Round", stone: "Ruby Red",
    band: "Channel",
    size: "1.2", weight: "1.05",
    halo: false, accent: true,
    backdrop: "Onyx", view: "Macro", lighting: "Flash",
    engraving: ""
  },

  // ---- B5 · Garnet Enamel Heritage Bangle ----------------------------------
  ref_B5_heritageEnamel: {
    catalogue: { id: "B5", name: "Garnet Enamel Heritage Bangle", achievable: "skin-only",
      needsFeature: ["makeChampleveEnamelPanel (recessed enamel cells)", "makeCaboBezel for cabochon stones", "open-cuff terminal caps"] },
    piece: "Bracelet", metal: "Yellow Gold", karat: "22K",
    setting: "Bezel", finish: "High Polish",
    shape: "Pear", stone: "Ruby Red",
    band: "Solitaire",
    size: "1.4", weight: "1.4",
    halo: false, accent: false,
    backdrop: "Linen", view: "Three-Quarter", lighting: "Daylight",
    engraving: ""
  },

  // ---- N1 · Edwardian Diamond & Pearl Collar -------------------------------
  ref_N1_edwardianCollar: {
    catalogue: { id: "N1", name: "Edwardian Diamond & Pearl Collar Necklace", achievable: "skin-only",
      needsFeature: ["makeOpenworkScrollPanel (pierced lace plates)", "pearl drop stations on articulated links"] },
    piece: "Necklace", metal: "Platinum", karat: "950",
    setting: "Prong", finish: "Milgrain Edge",
    shape: "Round", stone: "Clear Diamond",
    band: "Solitaire",
    size: "1.4", weight: "1.05",
    halo: true, accent: true,
    backdrop: "Velvet", view: "Macro", lighting: "Showroom",
    engraving: ""
  },

  // ---- N2 · Four-Strand Pearl & Enamel Necklace ----------------------------
  ref_N2_fourStrandPearl: {
    catalogue: { id: "N2", name: "Four-Strand Pearl & Enamel Necklace", achievable: "skin-only",
      needsFeature: ["makeMultiStrandPearl (parallel pearl rows on silk)", "makeChampleveEnamelPanel for floral clasp"] },
    piece: "Necklace", metal: "Yellow Gold", karat: "14K",
    setting: "Bezel", finish: "High Polish",
    shape: "Round", stone: "Clear Diamond",
    band: "Solitaire",
    size: "0.8", weight: "0.5",
    halo: false, accent: false,
    backdrop: "Linen", view: "Three-Quarter", lighting: "Daylight",
    engraving: ""
  },

  // ---- N3 · Amethyst, Ruby & Diamond Rope Necklace -------------------------
  ref_N3_amethystRope: {
    catalogue: { id: "N3", name: "Amethyst, Ruby & Diamond Rope Necklace", achievable: "partial",
      needsFeature: ["makeRopeLinkChain (twisted-rope chain texture)"] },
    piece: "Necklace", metal: "Yellow Gold", karat: "18K",
    setting: "Prong", finish: "High Polish",
    shape: "Oval", stone: "Amethyst Purple",
    band: "Solitaire",
    size: "2", weight: "1.3",
    halo: false, accent: true,
    backdrop: "Onyx", view: "Macro", lighting: "Candlelight",
    engraving: ""
  },

  // ---- N4 · Freshwater Pearl Lace Necklace ---------------------------------
  ref_N4_pearlLace: {
    catalogue: { id: "N4", name: "Freshwater Pearl Lace Necklace", achievable: "skin-only",
      needsFeature: ["makeMultiStrandPearl (mixed sizes, lace pattern with draped loops)", "iridescent pearl material"] },
    piece: "Necklace", metal: "Mirror Silver", karat: "950",
    setting: "Bezel", finish: "High Polish",
    shape: "Round", stone: "Clear Diamond",
    band: "Solitaire",
    size: "0.7", weight: "0.45",
    halo: false, accent: false,
    backdrop: "Ivory", view: "Three-Quarter", lighting: "Softbox",
    engraving: ""
  },

  // ---- N5 · Malaya Garnet & Diamond Statement Necklace ---------------------
  ref_N5_garnetFire: {
    catalogue: { id: "N5", name: "Malaya Garnet & Diamond Statement Necklace", achievable: "partial",
      needsFeature: ["makeOpenworkScrollPanel for scroll-link front structure"] },
    piece: "Necklace", metal: "Yellow Gold", karat: "22K",
    setting: "Prong", finish: "High Polish",
    shape: "Cushion", stone: "Ruby Red",        // garnet stand-in (warmer red)
    band: "Solitaire",
    size: "2.5", weight: "1.5",
    halo: true, accent: true,
    backdrop: "Onyx", view: "Macro", lighting: "Flash",
    engraving: ""
  },

  // ---- E1 · Diamond Drop Earrings with Snap-On Covers ----------------------
  ref_E1_diamondDrop: {
    catalogue: { id: "E1", name: "Diamond Drop Earrings with Snap-On Covers", achievable: "partial",
      needsFeature: ["makeEnamelDrop (interchangeable snap-on cover variants)"] },
    piece: "Earrings", metal: "Yellow Gold", karat: "14K",
    setting: "Prong", finish: "High Polish",
    shape: "Round", stone: "Clear Diamond",
    band: "Solitaire",
    size: "1", weight: "0.65",
    halo: false, accent: false,
    backdrop: "Velvet", view: "Three-Quarter", lighting: "Showroom",
    engraving: ""
  },

  // ---- E2 · Aquamarine Pear Drop Pavé Earrings -----------------------------
  ref_E2_aquaPearDrop: {
    catalogue: { id: "E2", name: "Aquamarine Pear Drop Pavé Earrings", achievable: "full", needsFeature: [] },
    piece: "Earrings", metal: "White Gold", karat: "14K",
    setting: "Prong", finish: "High Polish",
    shape: "Pear", stone: "Aquamarine",
    band: "Pavé",
    size: "1.5", weight: "0.9",
    halo: true, accent: true,
    backdrop: "Marble", view: "Macro", lighting: "Daylight",
    engraving: ""
  },

  // ---- E3 · Gilt Filigree Cone Drop Earrings -------------------------------
  ref_E3_filigreeCone: {
    catalogue: { id: "E3", name: "Gilt Filigree Cone Drop Earrings", achievable: "skin-only",
      needsFeature: ["makeFiligreeCone (wire scroll cone)", "bottom bead cluster cap"] },
    piece: "Earrings", metal: "Yellow Gold", karat: "14K",
    setting: "Bezel", finish: "Brushed",
    shape: "Round", stone: "Clear Diamond",
    band: "Solitaire",
    size: "0.8", weight: "0.5",
    halo: false, accent: false,
    backdrop: "Linen", view: "Three-Quarter", lighting: "Candlelight",
    engraving: ""
  },

  // ---- E4 · Ancient-Inspired Gold Orb Hoop Earrings ------------------------
  ref_E4_ancientOrb: {
    catalogue: { id: "E4", name: "Ancient-Inspired Gold Orb Hoop Earrings", achievable: "skin-only",
      needsFeature: ["makeGranulationOrb (decorated hollow bell with bead borders)"] },
    piece: "Earrings", metal: "Yellow Gold", karat: "22K",
    setting: "Bezel", finish: "Brushed",
    shape: "Round", stone: "Clear Diamond",
    band: "Solitaire",
    size: "1.6", weight: "1.0",
    halo: false, accent: false,
    backdrop: "Velvet", view: "Three-Quarter", lighting: "Showroom",
    engraving: ""
  },

  // ---- E5 · Lion-Head Twisted Hoop Earrings --------------------------------
  ref_E5_lionHoop: {
    catalogue: { id: "E5", name: "Lion-Head Twisted Hoop Earrings", achievable: "skin-only",
      needsFeature: ["makeAnimalHeadTerminal('lion')", "twisted rope hoop body (already partly available via Twist band)"] },
    piece: "Earrings", metal: "Mirror Silver", karat: "950",
    setting: "Bezel", finish: "Brushed",
    shape: "Round", stone: "Clear Diamond",
    band: "Twist",
    size: "0.8", weight: "0.6",
    halo: false, accent: false,
    backdrop: "Concrete", view: "Macro", lighting: "Showroom",
    engraving: ""
  }
};

const LIGHTING_MODES = {
  Daylight: {
    exposure: 1.05,
    hemi: 1.32,
    key: 2.4,
    fill: 1.55,
    rim: 2.0,
    punch: 4.8,
    table: 2.0,
    keyColor: "#ffffff",
    fillColor: "#eaf8ff",
    rimColor: "#cfe3f2",
    punchColor: "#ffffff",
    floorOpacity: 0.24,
    sparkleOpacity: 0.46,
    envMul: 0.95
  },
  Candlelight: {
    exposure: 1.02,
    hemi: 0.88,
    key: 1.85,
    fill: 2.25,
    rim: 2.6,
    punch: 4.2,
    table: 1.55,
    keyColor: "#ffd79f",
    fillColor: "#ffb46c",
    rimColor: "#ff8aa8",
    punchColor: "#ffe2b3",
    floorOpacity: 0.32,
    sparkleOpacity: 0.4,
    envMul: 1.0
  },
  Showroom: {
    exposure: 1.08,
    hemi: 1.18,
    key: 2.6,
    fill: 1.95,
    rim: 2.4,
    punch: 6.8,
    table: 2.6,
    keyColor: "#fff4dc",
    fillColor: "#fff3df",
    rimColor: "#ffd9c4",
    punchColor: "#ffffff",
    floorOpacity: 0.3,
    sparkleOpacity: 0.55,
    envMul: 0.78
  },
  Flash: {
    exposure: 1.16,
    hemi: 0.82,
    key: 3.2,
    fill: 1.05,
    rim: 3.1,
    punch: 9.4,
    table: 4.4,
    keyColor: "#f0f4f8",
    fillColor: "#cfe7f2",
    rimColor: "#d9e6f0",
    punchColor: "#ffffff",
    floorOpacity: 0.2,
    sparkleOpacity: 0.68,
    envMul: 0.6
  },
  // Golden-hour wash with long warm rim
  Sunset: {
    exposure: 1.1,
    hemi: 1.0,
    key: 2.3,
    fill: 1.6,
    rim: 3.0,
    punch: 5.4,
    table: 2.4,
    keyColor: "#ffb070",
    fillColor: "#ff8a6a",
    rimColor: "#ffd29c",
    punchColor: "#ffe0b4",
    floorOpacity: 0.3,
    sparkleOpacity: 0.5,
    envMul: 0.85
  },
  // Cool, low-key moonlit blue rim with deep shadow
  Moonlight: {
    exposure: 0.95,
    hemi: 0.7,
    key: 1.6,
    fill: 1.1,
    rim: 2.8,
    punch: 4.2,
    table: 1.8,
    keyColor: "#c9d8ff",
    fillColor: "#7a8cb8",
    rimColor: "#9ec0ff",
    punchColor: "#dfe9ff",
    floorOpacity: 0.36,
    sparkleOpacity: 0.42,
    envMul: 0.7
  },
  // High-saturation magenta + cyan gels
  Neon: {
    exposure: 1.18,
    hemi: 0.6,
    key: 2.8,
    fill: 2.2,
    rim: 3.4,
    punch: 7.2,
    table: 3.2,
    keyColor: "#ff3df0",
    fillColor: "#22e0ff",
    rimColor: "#7a52ff",
    punchColor: "#ffffff",
    floorOpacity: 0.24,
    sparkleOpacity: 0.7,
    envMul: 0.6
  },
  // Even, diffuse studio softbox — catalogue / e-commerce look
  Softbox: {
    // "Normal studio" reference — metal needs dark zones between the two
    // softbox reflections to read as polished; stacking key+fill+hemi at
    // full strength lit every point of the torus and read as molten gold.
    exposure: 0.94,
    hemi: 0.7,
    key: 2.0,
    fill: 1.2,
    rim: 1.0,
    punch: 1.8,
    table: 1.3,
    keyColor: "#ffffff",
    fillColor: "#eef3ff",
    rimColor: "#fff6e8",
    punchColor: "#ffffff",
    floorOpacity: 0.6,
    sparkleOpacity: 0.36,
    envMul: 0.55,
    cct: 5200
  },
  // Museum vitrine — near-black room, one warm halogen spot from above,
  // hard shadow, maximum gem contrast. The look of a Cartier display case.
  Gallery: {
    exposure: 1.06,
    hemi: 0.42,
    key: 3.4,
    fill: 0.7,
    rim: 1.9,
    punch: 8.6,
    table: 3.4,
    keyColor: "#ffe7c4",
    fillColor: "#c9c2b4",
    rimColor: "#ffdcae",
    punchColor: "#fff4e0",
    floorOpacity: 0.5,
    sparkleOpacity: 0.6,
    envMul: 0.55,
    cct: 3200
  }
};

// Correlated colour temperature per lighting mode (Kelvin). Drives the
// colour-change interpolation for pleochroic stones (alexandrite): low
// CCT (incandescent) excites the red transmission window, high CCT
// (daylight/moonlight) the green one. Values match the keyColor tints.
const LIGHTING_CCT = {
  Daylight: 6500,
  Candlelight: 1900,
  Showroom: 3800,
  Flash: 6000,
  Sunset: 2600,
  Moonlight: 9000,
  Neon: 8000,
  Softbox: 5200,
  Gallery: 3200
};

function normalizePiece(value) {
  if (!value) {
    return "";
  }

  return PIECE_MAP[value.trim().toLowerCase().replace(/[^a-z]/g, "")] || "";
}

function matchOption(value, options, fallback) {
  if (!value) {
    return fallback;
  }

  const normalizedValue = String(value).trim().toLowerCase();

  return options.find((option) => option.toLowerCase() === normalizedValue) || fallback;
}

function normalizeRangeValue(value, min, max, fallback, decimals = 1) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  const clamped = Math.min(max, Math.max(min, number));

  // Format with the requested decimal precision, then drop trailing zeros
  // ONLY in the fractional part (so "90" stays "90", "1.20" becomes "1.2").
  return parseFloat(clamped.toFixed(decimals)).toString();
}

function normalizeOptionalRangeValue(value, min, max, decimals = 2) {
  if (value === undefined || value === null || value === "") return "";
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  return parseFloat(Math.min(max, Math.max(min, number)).toFixed(decimals)).toString();
}

function normalizeDesignBoolean(value, fallback) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function silhouetteFor(piece, value) {
  const list = SILHOUETTES[piece] || SILHOUETTES.Ring;
  if (typeof value === "string") {
    const hit = list.find((item) => item.toLowerCase() === value.toLowerCase());
    if (hit) return hit;
  }
  return list[0];
}

function sanitizeDesignState(input = {}) {
  const engraving = typeof input.engraving === "string"
    ? input.engraving.trim().slice(0, 32)
    : DESIGN_DEFAULTS.engraving;

  const piece = matchOption(normalizePiece(input.piece) || input.piece, DESIGN_OPTIONS.piece, DESIGN_DEFAULTS.piece);

  return {
    piece,
    silhouette: silhouetteFor(piece, input.silhouette),
    metal: matchOption(input.metal, DESIGN_OPTIONS.metal, DESIGN_DEFAULTS.metal),
    karat: matchOption(input.karat, DESIGN_OPTIONS.karat, DESIGN_DEFAULTS.karat),
    setting: matchOption(input.setting, DESIGN_OPTIONS.setting, DESIGN_DEFAULTS.setting),
    finish: matchOption(input.finish, DESIGN_OPTIONS.finish, DESIGN_DEFAULTS.finish),
    shape: matchOption(input.shape, DESIGN_OPTIONS.shape, DESIGN_DEFAULTS.shape),
    stone: matchOption(input.stone, DESIGN_OPTIONS.stone, DESIGN_DEFAULTS.stone),
    band: matchOption(input.band, DESIGN_OPTIONS.band, DESIGN_DEFAULTS.band),
    backdrop: matchOption(input.backdrop, DESIGN_OPTIONS.backdrop, DESIGN_DEFAULTS.backdrop),
    view: matchOption(input.view, DESIGN_OPTIONS.view, DESIGN_DEFAULTS.view),
    size: normalizeRangeValue(input.size, 0.8, 2.4, DESIGN_DEFAULTS.size, 1),
    weight: normalizeRangeValue(input.weight, 0.85, 1.35, DESIGN_DEFAULTS.weight, 2),
    halo: normalizeDesignBoolean(input.halo, DESIGN_DEFAULTS.halo),
    accent: normalizeDesignBoolean(input.accent, DESIGN_DEFAULTS.accent),
    hiddenHalo: normalizeDesignBoolean(input.hiddenHalo, DESIGN_DEFAULTS.hiddenHalo),
    milgrain: normalizeDesignBoolean(input.milgrain, DESIGN_DEFAULTS.milgrain),
    emissiveGlow: normalizeDesignBoolean(input.emissiveGlow, DESIGN_DEFAULTS.emissiveGlow),
    twoTone: normalizeDesignBoolean(input.twoTone, DESIGN_DEFAULTS.twoTone),
    sparkleBurst: normalizeDesignBoolean(input.sparkleBurst, DESIGN_DEFAULTS.sparkleBurst),
    prongCount: matchOption(input.prongCount, DESIGN_OPTIONS.prongCount, DESIGN_DEFAULTS.prongCount),
    setRotation: normalizeRangeValue(input.setRotation, 0, 180, DESIGN_DEFAULTS.setRotation, 0),
    stoneTilt: normalizeRangeValue(input.stoneTilt, -15, 15, DESIGN_DEFAULTS.stoneTilt, 0),
    accentDensity: ["Auto", "Sparse", "Dense"].includes(input.accentDensity) ? input.accentDensity : DESIGN_DEFAULTS.accentDensity,
    haloGap: normalizeRangeValue(input.haloGap, 0.05, 2.0, DESIGN_DEFAULTS.haloGap, 2),
    haloCount: input.haloCount === "Auto" || /^\d+$/.test(String(input.haloCount || ""))
      ? String(input.haloCount)
      : DESIGN_DEFAULTS.haloCount,
    prongHeight: normalizeRangeValue(input.prongHeight, 0.7, 1.3, DESIGN_DEFAULTS.prongHeight, 2),

    ringSizeUS: normalizeRangeValue(input.ringSizeUS, 1, 16, DESIGN_DEFAULTS.ringSizeUS, 2),
    bandWidthMm: normalizeOptionalRangeValue(input.bandWidthMm, 1.2, 12, 2),
    bandThicknessMm: normalizeOptionalRangeValue(input.bandThicknessMm, 1.1, 8, 2),
    stoneLengthMm: normalizeOptionalRangeValue(input.stoneLengthMm, 0.8, 60, 2),
    stoneWidthMm: normalizeOptionalRangeValue(input.stoneWidthMm, 0.8, 60, 2),
    stoneDepthMm: normalizeOptionalRangeValue(input.stoneDepthMm, 0.4, 35, 2),
    lengthWidthRatio: normalizeOptionalRangeValue(input.lengthWidthRatio, 0.75, 3.0, 3),
    tablePct: normalizeOptionalRangeValue(input.tablePct, 20, 90, 2),
    totalDepthPct: normalizeOptionalRangeValue(input.totalDepthPct, 25, 90, 2),
    crownAngleDeg: normalizeOptionalRangeValue(input.crownAngleDeg, 0, 60, 2),
    pavilionAngleDeg: normalizeOptionalRangeValue(input.pavilionAngleDeg, 0, 60, 2),
    girdlePct: normalizeOptionalRangeValue(input.girdlePct, 0.5, 12, 2),
    culetPct: normalizeOptionalRangeValue(input.culetPct, 0, 20, 2),
    prongBaseDiameterMm: normalizeOptionalRangeValue(input.prongBaseDiameterMm, 0.45, 3, 2),
    prongTipDiameterMm: normalizeOptionalRangeValue(input.prongTipDiameterMm, 0.25, 2, 2),
    bearingDepthMm: normalizeOptionalRangeValue(input.bearingDepthMm, 0.08, 1.2, 2),
    galleryHeightMm: normalizeOptionalRangeValue(input.galleryHeightMm, 1.8, 20, 2),
    galleryRailDiameterMm: normalizeOptionalRangeValue(input.galleryRailDiameterMm, 0.35, 2.5, 2),
    culetClearanceMm: normalizeOptionalRangeValue(input.culetClearanceMm, 0.1, 3, 2),
    haloMeleeDiameterMm: normalizeOptionalRangeValue(input.haloMeleeDiameterMm, 0.6, 4, 2),
    chainLengthMm: normalizeOptionalRangeValue(input.chainLengthMm, 300, 1000, 0),
    chainWireMm: normalizeOptionalRangeValue(input.chainWireMm, 0.5, 2.6, 2),
    braceletInnerDiameterMm: normalizeOptionalRangeValue(input.braceletInnerDiameterMm, 50, 90, 1),
    braceletTubeMm: normalizeOptionalRangeValue(input.braceletTubeMm, 1.6, 9, 2),
    postDiameterMm: normalizeOptionalRangeValue(input.postDiameterMm, 0.5, 1.6, 2),
    hoopDiameterMm: normalizeOptionalRangeValue(input.hoopDiameterMm, 8, 40, 1),
    dropLengthMm: normalizeOptionalRangeValue(input.dropLengthMm, 8, 140, 0),
    symmetryMode: input.symmetryMode === "Antique" ? "Antique" : "Precision",

    chainType: matchOption(input.chainType, DESIGN_OPTIONS.chainType, DESIGN_DEFAULTS.chainType),
    clasp: matchOption(input.clasp, DESIGN_OPTIONS.clasp, DESIGN_DEFAULTS.clasp),
    engraving,
    lighting: matchOption(input.lighting, DESIGN_OPTIONS.lighting, DESIGN_DEFAULTS.lighting)
  };
}

function readStoredDesignState(key) {
  try {
    const value = window.localStorage.getItem(key);

    return value ? sanitizeDesignState(JSON.parse(value)) : null;
  } catch (error) {
    return null;
  }
}

function writeStoredDesignState(key, state) {
  try {
    window.localStorage.setItem(key, JSON.stringify(sanitizeDesignState(state)));
  } catch (error) {
    // Browsers can deny storage in private modes; the designer should still work.
  }
}

function readDesignStateFromParams(params) {
  const raw = {};
  let hasDesignParam = false;
  const aliases = {
    piece: ["piece", "piece-type"],
    shape: ["shape", "stone-shape"],
    stone: ["stone", "stone-color"]
  };

  Object.keys(DESIGN_DEFAULTS).forEach((fieldName) => {
    const names = aliases[fieldName] || [fieldName];
    const value = names.map((name) => params.get(name)).find((item) => item !== null);

    if (value !== undefined) {
      hasDesignParam = true;
      raw[fieldName] = value;
    }
  });

  return hasDesignParam ? sanitizeDesignState(raw) : null;
}

function createDesignUrl(state) {
  const url = new URL(window.location.href);
  const cleanState = sanitizeDesignState(state);

  Object.entries(cleanState).forEach(([key, value]) => {
    url.searchParams.set(key, typeof value === "boolean" ? (value ? "1" : "0") : value);
  });

  url.hash = "design-studio";

  return url.toString();
}

function setDesignerStatus(target, message) {
  if (!target) {
    return;
  }

  window.clearTimeout(Number(target.dataset.statusTimer || 0));
  target.textContent = message;

  const timer = window.setTimeout(() => {
    target.textContent = "";
  }, 2600);

  target.dataset.statusTimer = String(timer);
}

function applyDesignState(root, state) {
  const cleanState = sanitizeDesignState(state);
  const setField = (name, value) => {
    const field = root.querySelector(`[data-designer-field="${name}"]`);

    if (field) {
      field.value = value;
    }
  };

  setField("piece", cleanState.piece);
  setField("silhouette", cleanState.silhouette);
  setField("setting", cleanState.setting);
  setField("finish", cleanState.finish);
  setField("shape", cleanState.shape);
  setField("stone", cleanState.stone);
  setField("karat", cleanState.karat);
  setField("band", cleanState.band);
  setField("size", cleanState.size);
  setField("weight", cleanState.weight);
  setField("engraving", cleanState.engraving);
  setField("prongCount", cleanState.prongCount);
  setField("setRotation", cleanState.setRotation);
  setField("stoneTilt", cleanState.stoneTilt);
  setField("accentDensity", cleanState.accentDensity);
  setField("haloGap", cleanState.haloGap);
  setField("haloCount", cleanState.haloCount);
  setField("prongHeight", cleanState.prongHeight);
  [
    "ringSizeUS", "bandWidthMm", "bandThicknessMm",
    "stoneLengthMm", "stoneWidthMm", "stoneDepthMm", "lengthWidthRatio",
    "tablePct", "totalDepthPct", "crownAngleDeg", "pavilionAngleDeg",
    "girdlePct", "culetPct", "prongBaseDiameterMm", "prongTipDiameterMm",
    "bearingDepthMm", "galleryHeightMm", "galleryRailDiameterMm",
    "culetClearanceMm", "haloMeleeDiameterMm", "symmetryMode",
    "chainLengthMm", "chainWireMm", "braceletInnerDiameterMm", "braceletTubeMm",
    "postDiameterMm", "hoopDiameterMm", "dropLengthMm"
  ].forEach((fieldName) => setField(fieldName, cleanState[fieldName]));
  setField("chainType", cleanState.chainType);
  setField("clasp", cleanState.clasp);

  root.querySelectorAll('[data-designer-field="metal"]').forEach((field) => {
    field.checked = field.value === cleanState.metal;
  });

  root.querySelectorAll('[data-designer-field="lighting"]').forEach((field) => {
    field.checked = field.value === cleanState.lighting;
  });
  root.querySelectorAll('[data-designer-field="backdrop"]').forEach((field) => {
    field.checked = field.value === cleanState.backdrop;
  });
  root.querySelectorAll('[data-designer-field="view"]').forEach((field) => {
    field.checked = field.value === cleanState.view;
  });

  const haloField = root.querySelector('[data-designer-field="halo"]');
  const accentField = root.querySelector('[data-designer-field="accent"]');
  const hiddenHaloField = root.querySelector('[data-designer-field="hiddenHalo"]');
  const milgrainField = root.querySelector('[data-designer-field="milgrain"]');
  const emissiveGlowField = root.querySelector('[data-designer-field="emissiveGlow"]');
  const twoToneField = root.querySelector('[data-designer-field="twoTone"]');
  const sparkleBurstField = root.querySelector('[data-designer-field="sparkleBurst"]');

  if (haloField) {
    haloField.checked = cleanState.halo;
  }

  if (accentField) {
    accentField.checked = cleanState.accent;
  }

  if (hiddenHaloField) {
    hiddenHaloField.checked = cleanState.hiddenHalo;
  }

  if (milgrainField) {
    milgrainField.checked = cleanState.milgrain;
  }

  if (emissiveGlowField) {
    emissiveGlowField.checked = cleanState.emissiveGlow;
  }
  if (twoToneField) {
    twoToneField.checked = cleanState.twoTone;
  }
  if (sparkleBurstField) {
    sparkleBurstField.checked = cleanState.sparkleBurst;
  }
}

function setInitialDesignState(root) {
  const params = new URLSearchParams(window.location.search);
  const stateFromUrl = readDesignStateFromParams(params);
  const storedState = readStoredDesignState(DESIGN_STORAGE_KEY);

  if (stateFromUrl || storedState) {
    applyDesignState(root, stateFromUrl || storedState);
    return;
  }

  setInitialPiece(root);
}

function physicalSpecForState(state) {
  return buildJewellerySpec(sanitizeDesignState(state || {}));
}

function formatPhysicalMm(value, decimals = 2) {
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(decimals)} mm` : "—";
}

function formatStoneDimensions(spec) {
  const stone = spec.centerStone;
  return `${stone.lengthMm.toFixed(2)} × ${stone.widthMm.toFixed(2)} × ${stone.depthMm.toFixed(2)} mm`;
}

function createCompactDesignLabel(state) {
  const spec = physicalSpecForState(state);
  const ringSize = spec.piece === "Ring" ? `, US ${spec.ring.sizeUS.toFixed(1)}` : "";
  return `${spec.piece} - ${spec.metal.alloy}, ${spec.centerStone.shape} ${spec.centerStone.material}, `
    + `${spec.centerStone.carat.toFixed(2)} ct (${formatStoneDimensions(spec)})${ringSize}`;
}

function estimateDesignComplexity(state) {
  const score = (state.halo ? 1 : 0)
    + (state.accent ? 1 : 0)
    + (state.finish === "Milgrain Edge" ? 1 : 0)
    + (Number(state.size) > 1.7 ? 1 : 0)
    + (Number(state.weight) > 1.18 ? 1 : 0);

  if (score >= 4) {
    return "Statement";
  }

  if (score >= 2) {
    return "Premium detailed";
  }

  return "Clean custom";
}

// ---------------------------------------------------------------------------
// Price + weight estimator REMOVED
//
// A prior version computed an order-of-magnitude price range + metal weight
// from the design state. Those numbers were not accurate enough to stand
// behind in front of a client, so the entire investment card was removed
// from the studio and the constants / helpers were deleted. Scope is still
// inferred qualitatively via estimateDesignComplexity above for the
// request-form brief card.
// ---------------------------------------------------------------------------

function createDesignBriefDetails(state) {
  const spec = physicalSpecForState(state);
  const ringLine = spec.piece === "Ring"
    ? `US ${spec.ring.sizeUS.toFixed(1)} · ${spec.ring.shankWidthMm.toFixed(2)} × ${spec.ring.shankThicknessMm.toFixed(2)} mm shank`
    : `${state.silhouette}`;
  return [
    ["Piece", `${state.piece} — ${state.silhouette}`],
    ["Physical size", ringLine],
    ["Metal", `${state.metal}, ${state.karat}, ${state.finish}`],
    ["Stone", `${spec.centerStone.carat.toFixed(2)} ct ${state.shape} ${state.stone} · ${formatStoneDimensions(spec)}`],
    ["Setting", `${state.setting}, ${spec.setting.prongCount} prongs, ${spec.setting.culetClearanceMm.toFixed(2)} mm culet clearance`],
    ["Scope", estimateDesignComplexity(state)]
  ];
}

function updateDesignBriefCard(state, imageUrl = "") {
  const card = document.querySelector("[data-design-brief-card]");

  if (!card) {
    return;
  }

  const title = card.querySelector("[data-design-brief-title]");
  const copy = card.querySelector("[data-design-brief-copy]");
  const specs = card.querySelector("[data-design-brief-specs]");
  const image = card.querySelector("[data-design-brief-image]");
  const placeholder = card.querySelector("[data-design-brief-placeholder]");
  const steps = card.querySelector("[data-design-brief-steps]");

  card.hidden = false;

  if (title) {
    title.textContent = `${state.shape} ${state.stone} ${state.piece.toLowerCase()}`;
  }

  if (copy) {
    copy.textContent = `${estimateDesignComplexity(state)} direction with ${state.metal.toLowerCase()} and ${state.lighting.toLowerCase()} sparkle.`;
  }

  if (specs) {
    specs.replaceChildren();
    createDesignBriefDetails(state).forEach(([label, value]) => {
      const wrapper = document.createElement("div");
      const term = document.createElement("dt");
      const detail = document.createElement("dd");

      term.textContent = label;
      detail.textContent = value;
      wrapper.append(term, detail);
      specs.appendChild(wrapper);
    });
  }

  if (image && imageUrl) {
    const existingUrl = image.dataset.previewUrl;

    if (existingUrl) {
      URL.revokeObjectURL(existingUrl);
    }

    image.src = imageUrl;
    image.dataset.previewUrl = imageUrl;
    image.hidden = false;
    if (placeholder) {
      placeholder.hidden = true;
    }
  } else if (placeholder) {
    const stoneImage = STONE_IMAGE_URLS[state.stone] || STONE_IMAGE_URLS["Clear Diamond"];
    placeholder.style.setProperty("--design-stone-image", `url("${stoneImage}")`);
    placeholder.querySelector("span").textContent = `${state.piece} Preview`;
  }

  if (steps) {
    steps.replaceChildren();
    [
      "Request review",
      "Consultation",
      `${state.piece} quote and design direction`,
      `${estimateDesignComplexity(state)} production window`
    ].forEach((step) => {
      const item = document.createElement("li");
      item.textContent = step;
      steps.appendChild(item);
    });
  }
}

function updateDesignerSmartDetails(root, state) {
  const piece = root.querySelector("[data-designer-smart-piece]");
  const metal = root.querySelector("[data-designer-smart-metal]");
  const stone = root.querySelector("[data-designer-smart-stone]");
  const savedCard = root.querySelector("[data-designer-saved-card]");
  const savedSummary = root.querySelector("[data-designer-saved-summary]");
  const savedState = readStoredDesignState(SAVED_DESIGN_KEY);

  if (piece) {
    piece.textContent = state.piece;
  }

  if (metal) {
    metal.textContent = state.metal;
  }

  if (stone) {
    stone.textContent = `${state.shape} ${state.stone}`;
  }

  if (savedCard && savedSummary) {
    savedCard.hidden = !savedState;
    savedSummary.textContent = savedState ? createCompactDesignLabel(savedState) : "";
  }
}

function createRandomDesignState(currentState) {
  const pick = (items) => items[Math.floor(Math.random() * items.length)];

  return sanitizeDesignState({
    piece: currentState.piece || pick(DESIGN_OPTIONS.piece),
    metal: pick(DESIGN_OPTIONS.metal),
    setting: pick(DESIGN_OPTIONS.setting),
    finish: pick(DESIGN_OPTIONS.finish),
    shape: pick(DESIGN_OPTIONS.shape),
    stone: pick(DESIGN_OPTIONS.stone),
    lighting: pick(DESIGN_OPTIONS.lighting),
    size: String((0.9 + Math.random() * 1.3).toFixed(1)),
    weight: String((0.9 + Math.random() * 0.4).toFixed(2)),
    halo: Math.random() > 0.28,
    accent: Math.random() > 0.22,
    engraving: currentState.engraving || ""
  });
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
  const spec = physicalSpecForState(state);
  const details = [
    `${state.piece}`,
    `${state.metal} ${state.karat} with ${state.finish}`,
    `${spec.centerStone.carat.toFixed(2)} ct ${state.shape} ${state.stone}`,
    formatStoneDimensions(spec),
    `${state.setting} setting`,
    `${spec.setting.culetClearanceMm.toFixed(2)} mm culet clearance`,
    state.halo ? `${spec.halo.meleeDiameterMm.toFixed(2)} mm melee halo` : "unframed centre stone",
    state.accent ? "side stones" : "clean band"
  ];

  if (spec.piece === "Ring") {
    details.splice(1, 0, `US ${spec.ring.sizeUS.toFixed(1)} ring`);
    details.splice(2, 0, `${spec.ring.shankWidthMm.toFixed(2)} × ${spec.ring.shankThicknessMm.toFixed(2)} mm shank`);
  }

  if (state.engraving) details.push(`engraving: ${state.engraving}`);
  return details.join(" | ");
}

function formatGuideLabel(value) {
  return (value || "")
    .replace(/[-_]+/gu, " ")
    .replace(/\b\w/gu, (letter) => letter.toUpperCase());
}

function readGuideContextFromUrl() {
  const params = new URLSearchParams(window.location.search);

  if (!params.has("guide-occasion") && !params.has("guide-wear") && !params.has("guide-budget")) {
    return null;
  }

  const budget = params.get("guide-budget") || "detailed";

  return {
    occasion: params.get("guide-occasion") || "engagement",
    wear: params.get("guide-wear") || "daily",
    budget,
    occasionLabel: formatGuideLabel(params.get("guide-occasion") || "engagement"),
    wearLabel: formatGuideLabel(params.get("guide-wear") || "daily"),
    budgetLabel: formatGuideLabel(budget),
    budgetFormValue: params.get("form-budget") || {
      simple: "500 to 1000",
      detailed: "1000 to 5000",
      premium: "5000 to 10000",
      statement: "10000 plus"
    }[budget] || "1000 to 5000"
  };
}

function createGuideContextLine(context) {
  return context
    ? `Guided direction: ${context.occasionLabel}, ${context.wearLabel.toLowerCase()} wear, ${context.budgetLabel.toLowerCase()} budget`
    : "";
}

function getState(root) {
  const field = (name) => root.querySelector(`[data-designer-field="${name}"]`);
  const checked = (name) => root.querySelector(`[data-designer-field="${name}"]:checked`);

  return sanitizeDesignState({
    piece: field("piece")?.value,
    silhouette: field("silhouette")?.value,
    metal: checked("metal")?.value,
    karat: field("karat")?.value,
    setting: field("setting")?.value,
    finish: field("finish")?.value,
    shape: field("shape")?.value,
    stone: field("stone")?.value,
    band: field("band")?.value,
    backdrop: checked("backdrop")?.value || field("backdrop")?.value,
    view: checked("view")?.value || field("view")?.value,
    size: field("size")?.value,
    weight: field("weight")?.value,
    halo: field("halo")?.checked,
    accent: field("accent")?.checked,
    hiddenHalo: field("hiddenHalo")?.checked,
    milgrain: field("milgrain")?.checked,
    emissiveGlow: field("emissiveGlow")?.checked,
    twoTone: field("twoTone")?.checked,
    sparkleBurst: field("sparkleBurst")?.checked,
    prongCount: field("prongCount")?.value,
    setRotation: field("setRotation")?.value,
    stoneTilt: field("stoneTilt")?.value,
    accentDensity: field("accentDensity")?.value,
    haloGap: field("haloGap")?.value,
    haloCount: field("haloCount")?.value,
    prongHeight: field("prongHeight")?.value,
    ringSizeUS: field("ringSizeUS")?.value,
    bandWidthMm: field("bandWidthMm")?.value,
    bandThicknessMm: field("bandThicknessMm")?.value,
    stoneLengthMm: field("stoneLengthMm")?.value,
    stoneWidthMm: field("stoneWidthMm")?.value,
    stoneDepthMm: field("stoneDepthMm")?.value,
    lengthWidthRatio: field("lengthWidthRatio")?.value,
    tablePct: field("tablePct")?.value,
    totalDepthPct: field("totalDepthPct")?.value,
    crownAngleDeg: field("crownAngleDeg")?.value,
    pavilionAngleDeg: field("pavilionAngleDeg")?.value,
    girdlePct: field("girdlePct")?.value,
    culetPct: field("culetPct")?.value,
    prongBaseDiameterMm: field("prongBaseDiameterMm")?.value,
    prongTipDiameterMm: field("prongTipDiameterMm")?.value,
    bearingDepthMm: field("bearingDepthMm")?.value,
    galleryHeightMm: field("galleryHeightMm")?.value,
    galleryRailDiameterMm: field("galleryRailDiameterMm")?.value,
    culetClearanceMm: field("culetClearanceMm")?.value,
    haloMeleeDiameterMm: field("haloMeleeDiameterMm")?.value,
    symmetryMode: field("symmetryMode")?.value,
    chainType: field("chainType")?.value,
    clasp: field("clasp")?.value,
    engraving: field("engraving")?.value,
    lighting: checked("lighting")?.value
  });
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
  const guideContext = readGuideContextFromUrl();

  setValue("#piece-type", `${state.piece} (${state.silhouette})`);
  setValue("#metal-preference", `${state.metal}, ${state.finish}`);
  setValue("#stone-preference", `${state.size} ct feel ${state.stone}, ${state.shape}`);
  setValue("#finish-preference", `${state.setting} setting, ${state.halo ? "diamond frame" : "unframed center stone"}, ${state.accent ? "side stones" : "clean band"}${state.hiddenHalo ? ", hidden halo" : ""}`);
  setValue("#dimensions", `${state.piece} designer scale: ${state.size} ct feel, ${getWeightLabel(state.weight).toLowerCase()} proportion`);

  if (guideContext) {
    const budgetField = document.querySelector(`input[name="budget"][value="${guideContext.budgetFormValue}"]`);

    setValue("#occasion", `${guideContext.occasionLabel} / ${guideContext.wearLabel} wear`);

    if (budgetField) {
      budgetField.checked = true;
      budgetField.dispatchEvent(new Event("change", { bubbles: true }));
      budgetField.closest(".form-field")?.classList.add("is-prefilled");
    }
  }

  if (hiddenSummary) {
    hiddenSummary.value = guideContext ? `${summary} | ${createGuideContextLine(guideContext)}` : summary;
  }

  if (description) {
    const existing = description.value.replace(/\n*\[Design Studio\][\s\S]*$/u, "").trim();
    const guidedBlock = guideContext && !existing.includes("[Guided Direction]")
      ? `[Guided Direction]\n${createGuideContextLine(guideContext)}`
      : "";
    const intro = [existing, guidedBlock].filter(Boolean).join("\n\n");
    description.value = `${intro ? `${intro}\n\n` : ""}[Design Studio]\n${summary}`;
    description.dispatchEvent(new Event("input", { bubbles: true }));
    description.closest(".form-field")?.classList.add("is-prefilled");
  }

  document.querySelector("#request-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function fileSafeName(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "design";
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Unable to capture design preview"));
      }
    }, "image/png", 0.96);
  });
}

function attachFileToInput(input, file) {
  if (typeof DataTransfer === "undefined") {
    return false;
  }

  try {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    return Boolean(input.files && input.files.length);
  } catch (error) {
    return false;
  }
}

function updateDesignUploadPreview(input, file) {
  const picker = input.closest("[data-file-picker]");
  const field = input.closest(".form-field");
  const fileName = picker?.querySelector("[data-file-name]");
  const preview = picker?.querySelector("[data-design-preview]");

  if (fileName) {
    fileName.textContent = file.name;
  }

  if (preview && typeof URL !== "undefined") {
    const existingUrl = preview.dataset.previewUrl;

    if (existingUrl) {
      URL.revokeObjectURL(existingUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    const image = document.createElement("img");

    image.src = previewUrl;
    image.alt = "Generated custom jewellery design";
    preview.dataset.previewUrl = previewUrl;
    preview.hidden = false;
    preview.replaceChildren(image);
  }

  picker?.classList.add("has-generated-design");
  field?.classList.add("is-prefilled");
}

function composeDesignScreenshot(sourceCanvas, state) {
  const preview = document.createElement("canvas");
  const context = preview.getContext("2d");
  const width = 1400;
  const height = 1000;

  if (!context) {
    return sourceCanvas;
  }

  preview.width = width;
  preview.height = height;

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#071012");
  gradient.addColorStop(0.5, "#0d2723");
  gradient.addColorStop(1, "#1a1115");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  const sourceWidth = sourceCanvas.width || sourceCanvas.clientWidth;
  const sourceHeight = sourceCanvas.height || sourceCanvas.clientHeight;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const drawX = (width - drawWidth) / 2;
  const drawY = (height - drawHeight) / 2;

  context.drawImage(sourceCanvas, drawX, drawY, drawWidth, drawHeight);

  context.fillStyle = "rgba(255, 255, 255, 0.9)";
  context.font = "600 34px Georgia, serif";
  context.fillText("Toronto Jewels Curation", 56, 84);
  context.font = "700 18px Arial, sans-serif";
  context.letterSpacing = "2px";
  context.fillText(`${state.piece} / ${state.stone} / ${state.metal}`.toUpperCase(), 58, 122);

  return preview;
}

async function attachDesignScreenshot(sourceCanvas, state) {
  const input = document.querySelector("#inspiration-upload");

  if (!sourceCanvas || !input || typeof File === "undefined") {
    return false;
  }

  const screenshot = composeDesignScreenshot(sourceCanvas, state);
  const blob = await canvasToBlob(screenshot);
  const fileName = `toronto-jewels-${fileSafeName(state.piece)}-${fileSafeName(state.stone)}-design.png`;
  const file = new File([blob], fileName, { type: "image/png" });
  const attachedToInput = attachFileToInput(input, file);

  if (input.form) {
    input.form.__tjGeneratedDesignFile = file;
  }

  input.dataset.generatedDesignFile = file.name;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  updateDesignUploadPreview(input, file);

  if (typeof URL !== "undefined") {
    updateDesignBriefCard(state, URL.createObjectURL(file));
  }

  return attachedToInput || Boolean(input.form);
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
  const lighting = LIGHTING_MODES[state.lighting] || LIGHTING_MODES.Daylight;
  const weight = Number(state.weight) || 1;
  const cx = width / 2;
  const cy = height / 2;
  const glow = context.createRadialGradient(cx, cy, 20, cx, cy, Math.min(width, height) * 0.5);
  glow.addColorStop(0, state.lighting === "Candlelight" ? "rgba(255,214,160,0.3)" : "rgba(255,255,255,0.24)");
  glow.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = metal;
  context.fillStyle = stone;
  context.shadowColor = lighting.punchColor;
  context.shadowBlur = state.lighting === "Flash" ? 34 : 22;

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

// ---------------------------------------------------------------------------
// Reality Score (Realism Engine §14)
//
// S_real = exp(−E_real),  E_real = Σ_k w_k · e_k(state)
//
// Each penalty term e_k is in roughly [0, 1] and captures one realism
// leak of the current design state. We keep the terms transparent so the
// readout actually reflects user choices — fire stone, sensible band
// thickness for the stone size, prong count matching the shape, finish
// matching the stone style. A perfect classic-engagement design lands
// near 0.95; a wildly mismatched one (e.g. razor-thin band carrying a
// 3 ct stone with the wrong prong count) drops toward 0.5.
// ---------------------------------------------------------------------------
function computeRealityEnergy(state) {
  const stone = state.stone || "Clear Diamond";
  const shape = state.shape || "Round";
  const piece = state.piece || "Ring";
  const finish = state.finish || "High Polish";
  const size = Number(state.size) || 1;        // carat weight feel
  const weight = Number(state.weight) || 1;    // metal weight knob
  const prongCount = Number(state.prongCount) || (shape === "Pear" ? 5 : 6);
  const isOpaque = stone === "Black Onyx";

  // Fire from STONE_PROFILES — must mirror the exact keys used elsewhere
  // in this file (Blue Sapphire, Ruby Red, Emerald Green, etc.) so the
  // penalty actually reflects the chosen stone instead of falling through.
  const fireByStone = {
    "Clear Diamond": 0.82,
    "Blush Sapphire": 0.42,
    "Blue Sapphire": 0.38,
    "Emerald Green": 0.30,
    "Ruby Red": 0.42,
    "Amethyst Purple": 0.24,
    "Aquamarine": 0.28,
    "Black Onyx": 0.00,
    "Fire Opal": 0.34,
    "Citrine Yellow": 0.26,
    "Morganite Peach": 0.24,
    "Tanzanite Violet": 0.42,
    "Salt & Pepper": 0.55,
    "Alexandrite Shift": 0.45,
    "Paraiba Tourmaline": 0.40,
    "Moonstone Glow": 0.18,
    "Padparadscha": 0.42
  };
  const fire = fireByStone[stone] ?? 0.3;

  // §2 — band thickness adequacy. For a ring carrying a heavy stone, a
  // very low weight knob produces a paper-thin band that can't support
  // the head. Penalty rises when (size / weight) gap is large.
  let e_thickness = 0;
  if (piece === "Ring") {
    const loadRatio = size / Math.max(weight, 0.6);
    e_thickness = Math.max(0, loadRatio - 1.4) * 0.18;       // 0 until 1.4×, then linear
  }

  // §11 — sparkle headroom. Opaque stones cost a fixed budget; dull
  // stones cost proportionally to (1 − fire). Honest reflection of how
  // much "life" the gem contributes.
  const e_sparkle = isOpaque ? 0.08 : (1 - fire) * 0.18;

  // §13 — manufacturability: prong count outside [4, 6] for round shapes,
  // [5, 5] for pointed shapes (pear/marquise/heart) costs forging realism.
  const idealProngs = shape === "Pear" ? [5]
    : shape === "Marquise" ? [6]
    : shape === "Heart" ? [3]
    : shape === "Trillion" ? [3]
    : (shape === "Princess" || shape === "Asscher" || shape === "Emerald" || shape === "Baguette" || shape === "Kite") ? [4]
    : [4, 6];
  const prongMiss = Math.min(...idealProngs.map(n => Math.abs(prongCount - n)));
  const e_prong = Math.min(0.20, prongMiss * 0.06);

  // §3 — finish/stone coherence: a hammered/sandblast finish under a
  // diamond is unusual; a high-polish under onyx is overkill. Tiny
  // penalty so the user is nudged toward the natural pairing.
  let e_finish = 0;
  if (stone === "Clear Diamond" && (finish === "Hammered" || finish === "Sandblast")) e_finish = 0.07;
  if (isOpaque && finish === "Milgrain Edge") e_finish = 0.04;

  // §2 — extreme carat with a non-ring piece (earrings carrying >2.5 ct
  // each is unrealistic). Small nudge.
  const e_scale = (piece === "Earrings" && size > 2.4) ? 0.06 : 0;

  // §8 — NoDrop multi-scale defect scan. Sums coarse/mid/fine defects
  // surfaced by computeNoDropDefects (proportion, setting integrity,
  // surface). Folded into E_real so Gate-C and the score both see them.
  const nd = computeNoDropDefects(state);
  const e_nodrop = nd.total;

  // §10 — brand memory (HDWA-FSE). e_brand = 0.10 · (1 − S_brand) keeps
  // the house style as a soft prior — never dominates physical realism,
  // but pulls the design toward the Toronto Jewels canon.
  const brand = computeBrandAlignment(state);
  const e_brand = 0.10 * (1 - brand.coherence);

  const terms = { e_thickness, e_sparkle, e_prong, e_finish, e_scale, e_nodrop, e_brand };
  const total = e_thickness + e_sparkle + e_prong + e_finish + e_scale + e_nodrop + e_brand;
  return { total, terms, defects: nd.defects, brand };
}

// ---------------------------------------------------------------------------
// NoDrop multi-scale defect scan (Realism Engine §8)
//
//   E_NoDrop(x) = Σ_σ Σ_d w_{σ,d} · severity_{σ,d}(x)
//
// where σ ∈ {coarse, mid, fine} are the three perceptual scales:
//
//   coarse — overall proportion you would notice from across a room
//            (e.g., a 3 ct stone on a 0.7 g band looks structurally
//            impossible).
//   mid    — setting integrity you would notice at arm's length
//            (e.g., a bezel rounding off the sharp tip of a pear cut,
//            or a tension setting trusting a brittle stone).
//   fine   — surface defects you would notice up close
//            (e.g., a hammered finish on platinum — too springy to
//            hold a crisp peen mark).
//
// Each defect carries a {field, value} pair so Gate-C can resolve it
// with the same minimal-correction operator that handles the smooth
// penalty terms. Severity is in the same units as the other E_real
// terms so the badge tooltip can rank them apples-to-apples.
// ---------------------------------------------------------------------------
function computeNoDropDefects(state) {
  const piece   = state.piece   || "Ring";
  const shape   = state.shape   || "Round";
  const setting = state.setting || "Prong";
  const finish  = state.finish  || "High Polish";
  const metal   = state.metal   || "Yellow Gold";
  const stone   = state.stone   || "Clear Diamond";
  const size    = Number(state.size)   || 1;
  const weight  = Number(state.weight) || 1;

  const defects = [];

  // ── Coarse scale ────────────────────────────────────────────────────
  // Support deficit: heavy stone on a paper-thin ring shank. The head
  // would torque the band when worn. severity scales with how far the
  // ratio (size/weight) is past the comfort line of 2.2.
  if (piece === "Ring") {
    const ratio = size / Math.max(weight, 0.6);
    if (ratio > 2.2) {
      defects.push({
        scale: "coarse",
        name: "support-deficit",
        severity: Math.min(0.18, (ratio - 2.2) * 0.10),
        hint: "Band is too thin to carry this stone — thicken the shank.",
        field: "weight",
        value: Math.min(2, weight + 0.5).toFixed(2)
      });
    }
  }

  // Oversized pendant: a 4 ct pendant on a delicate chain feels off.
  if (piece === "Necklace" && size > 3.5) {
    defects.push({
      scale: "coarse",
      name: "oversized-pendant",
      severity: Math.min(0.16, (size - 3.5) * 0.10),
      hint: "Pendant is oversized for the chain.",
      field: "size",
      value: "3.0"
    });
  }

  // ── Mid scale ───────────────────────────────────────────────────────
  // Bezel + sharp-tip shape: a bezel rim rounds off the points of pear,
  // marquise, heart and princess cuts — those silhouettes are the whole
  // point of the cut, so this is a real defect, not a taste call.
  if (setting === "Bezel"
      && (shape === "Pear" || shape === "Marquise" || shape === "Heart" || shape === "Princess")) {
    defects.push({
      scale: "mid",
      name: "bezel-corners-clipped",
      severity: 0.12,
      hint: `A bezel rim will round off the points of a ${shape} cut.`,
      field: "setting",
      value: "Prong"
    });
  }

  // Tension on a non-tough stone: tension settings rely on compressive
  // strength; only diamond, sapphire and ruby (Mohs ≥ 9) are safe.
  if (setting === "Tension"
      && stone !== "Clear Diamond"
      && stone !== "Blue Sapphire"
      && stone !== "Blush Sapphire"
      && stone !== "Padparadscha"
      && stone !== "Ruby Red") {
    defects.push({
      scale: "mid",
      name: "tension-fragile-stone",
      severity: 0.14,
      hint: `Tension settings need a Mohs ≥ 9 stone; ${stone} can fracture.`,
      field: "setting",
      value: "Prong"
    });
  }

  // ── Fine scale ──────────────────────────────────────────────────────
  // Hammered marks on platinum: platinum is too springy for crisp peen
  // marks — they recover and the texture goes soft.
  if (finish === "Hammered" && metal === "Platinum") {
    defects.push({
      scale: "fine",
      name: "hammered-on-platinum",
      severity: 0.06,
      hint: "Platinum is too springy to hold crisp hammer marks.",
      field: "finish",
      value: "High Polish"
    });
  }

  // Brushed finish on rose gold: the copper alloy goes muddy under a
  // unidirectional brush — the salmon glow only reads clean under polish.
  if (finish === "Brushed" && metal === "Rose Gold") {
    defects.push({
      scale: "fine",
      name: "brushed-rose-mud",
      severity: 0.05,
      hint: "Brushed rose gold reads muddy; high polish keeps the salmon glow.",
      field: "finish",
      value: "High Polish"
    });
  }

  // Sort by severity so the tooltip and Gate-C both see the worst first.
  defects.sort((a, b) => b.severity - a.severity);
  const total = defects.reduce((s, d) => s + d.severity, 0);
  return { total, defects };
}

// ---------------------------------------------------------------------------
// Brand memory — HDWA-FSE coherence (Realism Engine §10)
//
//   z_i = a_i e^{i φ_i},  z ∈ ℂⁿ design,  b ∈ ℂⁿ brand vector.
//
//   S_brand(z, b) = |⟨z, b⟩| / (‖z‖ ‖b‖)        E_brand = 1 − S_brand
//
// Each design axis is encoded as a complex number whose phase says
// "aligned with house style" (φ = 0) or "departing from house style"
// (φ = π), and whose amplitude says how strongly this axis matters.
// The brand vector b is the all-ones / all-aligned canonical pole, so
// the inner product reduces to:
//
//   ⟨z, b⟩ = Σ a_i · e^{i φ_i}                  ‖b‖ = √n
//
// Toronto Jewels Curation house style (the canonical pole):
//   metal       — warm karats (yellow/rose/champagne) over cool
//   finish      — high polish over textured
//   stone       — diamond / sapphire / ruby (the four-Cs canon)
//   setting     — prong or bezel (heritage settings)
//   shape       — round / oval / cushion (timeless silhouettes)
//   prongCount  — 4 or 6 (workshop standard)
//   scale       — restrained 1.0–1.8 ct
// ---------------------------------------------------------------------------
function computeBrandAlignment(state) {
  const metal   = state.metal   || "Yellow Gold";
  const finish  = state.finish  || "High Polish";
  const stone   = state.stone   || "Clear Diamond";
  const setting = state.setting || "Prong";
  const shape   = state.shape   || "Round";
  const piece   = state.piece   || "Ring";
  const size    = Number(state.size) || 1;
  const prongCount = Number(state.prongCount) || 6;

  const PI = Math.PI;

  // Axis encodings: amp = how much this axis weighs in the house style,
  //                 phase = 0 aligned, π opposed, fractions in between.
  const warmMetals = ["Yellow Gold", "Rose Gold", "Champagne Gold"];
  const coolMetals = ["White Gold", "Platinum", "Mirror Silver"];
  const offCanonMetals = ["Black Gold", "Bronze Patina", "Two-Tone Mix"];
  const metalPhase = warmMetals.includes(metal) ? 0
    : coolMetals.includes(metal) ? PI * 0.35   // cool but still classic
    : offCanonMetals.includes(metal) ? PI : PI * 0.6;

  const finishPhase = finish === "High Polish" ? 0
    : finish === "Brushed" ? PI * 0.35
    : finish === "Milgrain Edge" ? PI * 0.25
    : finish === "Sandblast" ? PI * 0.75
    : finish === "Hammered" ? PI * 0.9
    : PI * 0.5;

  const canonStones = ["Clear Diamond", "Blue Sapphire", "Blush Sapphire", "Ruby Red", "Emerald Green"];
  const stonePhase = canonStones.includes(stone) ? 0
    : (stone === "Black Onyx") ? PI
    : PI * 0.5;

  const settingPhase = (setting === "Prong" || setting === "Bezel") ? 0
    : (setting === "Cathedral") ? PI * 0.3
    : PI * 0.7;

  const classicShapes = ["Round", "Oval", "Cushion"];
  const shapePhase = classicShapes.includes(shape) ? 0
    : (shape === "Princess" || shape === "Emerald" || shape === "Asscher") ? PI * 0.4
    : PI * 0.7;

  const prongPhase = (prongCount === 4 || prongCount === 6) ? 0
    : (prongCount === 5) ? PI * 0.3
    : PI;

  // Scale phase: sweet spot 1.0–1.8 ct (centered 1.4). Drift quadratically.
  const scaleDrift = Math.min(1, Math.abs(size - 1.4) / 1.0);
  const scalePhase = PI * scaleDrift * 0.7;

  // Per-axis amplitudes (importance weights). Sum chosen so n=7, ‖b‖=√7.
  const axes = [
    { name: "metal",       amp: 1.0, phase: metalPhase },
    { name: "finish",      amp: 1.0, phase: finishPhase },
    { name: "stone",       amp: 1.1, phase: stonePhase },     // stone matters most
    { name: "setting",     amp: 1.0, phase: settingPhase },
    { name: "shape",       amp: 1.0, phase: shapePhase },
    { name: "prongCount",  amp: 0.7, phase: prongPhase },     // earrings: irrelevant; keep low
    { name: "scale",       amp: 0.8, phase: scalePhase }
  ];

  // Earring/Necklace pieces don't care about prongCount — collapse its amp.
  if (piece !== "Ring") {
    const i = axes.findIndex(a => a.name === "prongCount");
    if (i >= 0) axes[i].amp = 0;
  }

  // Inner product ⟨z, b⟩ = Σ aᵢ · e^{iφᵢ}.
  let re = 0, im = 0, ampSq = 0, bSq = 0;
  for (const a of axes) {
    re += a.amp * Math.cos(a.phase);
    im += a.amp * Math.sin(a.phase);
    ampSq += a.amp * a.amp;
    bSq   += (a.amp > 0 ? 1 : 0);   // brand pole: amp=1 on every active axis
  }
  const inner = Math.sqrt(re * re + im * im);
  const zNorm = Math.sqrt(ampSq);
  const bNorm = Math.sqrt(bSq);
  const coherence = (zNorm > 0 && bNorm > 0) ? Math.min(1, inner / (zNorm * bNorm)) : 1;

  // Rank axes by their misalignment contribution: the axis that hurts
  // coherence the most is the one with largest (amp · (1 − cos φ)).
  // Each axis carries its own Gate-C correction target.
  const HOUSE_TARGET = {
    metal:      "Yellow Gold",
    finish:     "High Polish",
    stone:      "Clear Diamond",
    setting:    "Prong",
    shape:      "Round",
    prongCount: "6",
    scale:      "1.4"
  };
  const HOUSE_FIELD = {
    metal: "metal", finish: "finish", stone: "stone", setting: "setting",
    shape: "shape", prongCount: "prongCount", scale: "size"
  };
  const ranked = axes
    .filter(a => a.amp > 0)
    .map(a => ({
      ...a,
      misalignment: a.amp * (1 - Math.cos(a.phase))
    }))
    .sort((a, b) => b.misalignment - a.misalignment);

  const worst = ranked.find(r => r.misalignment > 0.05);
  const correction = worst ? {
    axis:  worst.name,
    field: HOUSE_FIELD[worst.name],
    value: HOUSE_TARGET[worst.name],
    misalignment: worst.misalignment,
    hint: `Brand axis "${worst.name}" drifts from house style.`
  } : null;

  return { coherence, axes: ranked, correction };
}

// Retail pricing is deliberately excluded from the renderer. A physically
// derived metal-mass estimate is shown only after `buildJewellerySpec()` has
// validated the dimensions; stone pricing and labour require live supplier and
// workshop data and must not be invented from a static front-end table.

// ---------------------------------------------------------------------------
// Gate-C minimal correction operator (Realism Engine §9)
//
//   x* = argmin_y [ ‖y − ̃x‖²_W  +  λ_N E_NoDrop(y)  +  Σ λ_i [C_i(y)]₊² + ... ]
//
// We approximate the operator with a single-step, single-variable nudge:
// pick the dominant penalty term, identify the control variable that
// drives it, and snap that variable to its viable target. The user gets
// the *minimal* edit that reduces E_real the most — the Gate-C spirit.
// ---------------------------------------------------------------------------
function proposeGateCCorrection(state) {
  // Physical validation always outranks aesthetic/brand guidance. The first
  // unresolved manufacturing error is the highest-value minimal correction.
  const physical = physicalSpecForState(state);
  const physicalIssue = physical.validation.issues
    .slice()
    .sort((a, b) => (a.severity === "error" ? -1 : 1) - (b.severity === "error" ? -1 : 1))[0];
  if (physicalIssue) {
    const fieldMap = { haloGapMm: "haloGap" };
    return {
      field: fieldMap[physicalIssue.field] || physicalIssue.field,
      value: String(physicalIssue.recommendedValue),
      message: `Physical fix [${physicalIssue.code}]: ${physicalIssue.message}`
    };
  }

  const energy = computeRealityEnergy(state);
  const entries = Object.entries(energy.terms).filter(([, v]) => v > 0.01);
  if (!entries.length) return null;
  entries.sort((a, b) => b[1] - a[1]);
  const [worstKey] = entries[0];
  const shape = state.shape || "Round";

  // §8 NoDrop dominates: every defect already carries its own
  // {field, value, hint}, so we delegate to the worst entry.
  if (worstKey === "e_nodrop" && energy.defects && energy.defects.length) {
    const d = energy.defects[0];
    return {
      field: d.field,
      value: d.value,
      message: `Gate-C §8 [${d.scale}/${d.name}]: ${d.hint}`
    };
  }

  // §10 brand drift dominates: snap the worst-misaligned axis back to
  // the house pole using its precomputed {field, value}.
  if (worstKey === "e_brand" && energy.brand && energy.brand.correction) {
    const c = energy.brand.correction;
    return {
      field: c.field,
      value: c.value,
      message: `Gate-C §10 [brand/${c.axis}]: nudged to house style → ${c.value}.`
    };
  }

  switch (worstKey) {
    case "e_thickness": {
      const cur = Number(state.weight) || 1;
      const next = Math.min(2, cur + 0.4);
      return {
        field: "weight",
        value: next.toFixed(2),
        message: `Gate-C §9: band thickened (weight ${cur.toFixed(2)} → ${next.toFixed(2)}).`
      };
    }
    case "e_prong": {
      // UI exposes ["Auto","4","6","8"]; pointed shapes prefer 4, round prefers 6.
      const choice = (shape === "Princess" || shape === "Asscher" || shape === "Emerald"
                     || shape === "Pear" || shape === "Marquise" || shape === "Heart") ? "4" : "6";
      return {
        field: "prongCount",
        value: choice,
        message: `Gate-C §9: prong count set to ${choice} for ${shape}.`
      };
    }
    case "e_finish":
      return {
        field: "finish",
        value: "High Polish",
        message: `Gate-C §9: finish set to High Polish to match the stone.`
      };
    case "e_sparkle":
      return {
        field: "stone",
        value: "Clear Diamond",
        message: `Gate-C §9: swapped to Clear Diamond for sparkle headroom.`
      };
    case "e_scale":
      return {
        field: "size",
        value: "1.8",
        message: `Gate-C §9: stone size reduced to 1.8 ct for earring scale.`
      };
  }
  return null;
}

function computeEngineeringAssessment(state) {
  const spec = physicalSpecForState(state);
  const issues = spec.validation.issues || [];
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity !== "error");

  // A transparent engineering score: hard failures carry a 22-point cost,
  // cautions carry eight. The score is not mixed with brand taste, sparkle
  // preference or price. Those are shown separately as design guidance.
  const score = Math.max(10, Math.min(100, 100 - errors.length * 22 - warnings.length * 8));
  return { spec, issues, errors, warnings, score };
}

function updateRealityScore(root, state) {
  const host = root.querySelector("[data-reality-score]");
  if (!host) return;
  const valueEl = host.querySelector("[data-reality-score-value]");
  const fillEl = host.querySelector("[data-reality-score-fill]");
  const assessment = computeEngineeringAssessment(state);
  const { spec, score, issues } = assessment;
  const pct = Math.round(score);

  if (valueEl) valueEl.textContent = `${pct}%`;
  if (fillEl) fillEl.style.width = `${pct}%`;
  host.dataset.grade = pct >= 90 ? "high" : pct >= 70 ? "mid" : "low";
  host.dataset.metric = "engineering-viability";
  host.setAttribute("aria-label", `Engineering viability ${pct}%`);

  // The previous card placed a speculative retail cost in this slot. Replace
  // it with a physically derived metal-mass estimate until a watertight CAD
  // solid and live supplier pricing are available.
  const costEl = host.querySelector("[data-reality-cost]");
  if (costEl) {
    const mass = Number(spec.estimate.metalMassGrams) || 0;
    // The mass model now covers every piece type (shank/torus-link chain/
    // bangle tube/posts+hoops), so surface it for all of them.
    costEl.textContent = mass > 0 ? `~${mass.toFixed(1)} g metal` : "CAD mass pending";
    costEl.title = "Pre-CAD estimate from published alloy densities and the current mm dimensions; not a quote.";
  }

  const brand = computeBrandAlignment(state);
  const issueText = issues.length
    ? issues.map((issue) => `[${issue.severity}] ${issue.code}: ${issue.message}`).join("\n  ")
    : "No dimensional manufacturing failures detected.";

  host.title = `Engineering viability — ${pct}%`
    + `\n\nPhysical specification:`
    + (spec.piece === "Ring"
      ? `\n  ring US ${spec.ring.sizeUS.toFixed(1)} / ${spec.ring.innerDiameterMm.toFixed(2)} mm ID`
        + `\n  shank ${spec.ring.shankWidthMm.toFixed(2)} × ${spec.ring.shankThicknessMm.toFixed(2)} mm`
      : "")
    + `\n  stone ${formatStoneDimensions(spec)}`
    + `\n  gallery ${spec.setting.galleryHeightMm.toFixed(2)} mm`
    + `\n  culet clearance ${spec.setting.culetClearanceMm.toFixed(2)} mm`
    + `\n\nValidation:\n  ${issueText}`
    + `\n\nHouse-style alignment (not physics): ${Math.round(brand.coherence * 100)}%`
    + `\nMetal mass is approximate until the production mesh is watertight.`;
}

function setSummary(root, state) {
  const summary = root.querySelector("[data-designer-summary]");
  const sizeLabel = root.querySelector("[data-designer-size-label]");
  const weightLabel = root.querySelector("[data-designer-weight-label]");

  if (summary) {
    const guideLine = createGuideContextLine(readGuideContextFromUrl());
    const text = createSummary(state);
    summary.innerHTML = `
      <p class="designer-summary__text">${text}${guideLine ? ` <span class="designer-summary__guide">· ${guideLine}</span>` : ""}</p>
    `;
  }

  const physicalSpec = physicalSpecForState(state);
  if (sizeLabel) {
    sizeLabel.textContent = `${physicalSpec.centerStone.carat.toFixed(2)} ct · ${physicalSpec.centerStone.lengthMm.toFixed(2)} × ${physicalSpec.centerStone.widthMm.toFixed(2)} mm`;
  }

  if (weightLabel) {
    weightLabel.textContent = physicalSpec.piece === "Ring"
      ? `${physicalSpec.ring.shankWidthMm.toFixed(2)} × ${physicalSpec.ring.shankThicknessMm.toFixed(2)} mm`
      : getWeightLabel(state.weight);
  }

  updateRealityScore(root, state);

  const physicalReadout = root.querySelector("[data-physical-readout]");
  if (physicalReadout) {
    const issues = physicalSpec.validation.issues || [];
    const issueSuffix = issues.length
      ? ` · ${issues.length} build ${issues.length === 1 ? "issue" : "issues"}`
      : " · dimensions pass current checks";
    physicalReadout.dataset.valid = String(physicalSpec.validation.valid);
    physicalReadout.textContent = physicalSpec.piece === "Ring"
      ? `US ${physicalSpec.ring.sizeUS.toFixed(1)} · ${physicalSpec.ring.innerDiameterMm.toFixed(2)} mm inner diameter · `
        + `${physicalSpec.ring.shankWidthMm.toFixed(2)} × ${physicalSpec.ring.shankThicknessMm.toFixed(2)} mm shank · `
        + `${formatStoneDimensions(physicalSpec)} stone`
        + issueSuffix
      : physicalSpec.piece === "Necklace"
        ? `${(physicalSpec.necklace.chainLengthMm / 10).toFixed(0)} cm chain · `
          + `Ø ${physicalSpec.necklace.wireDiameterMm.toFixed(2)} mm wire · `
          + `${formatStoneDimensions(physicalSpec)} stone`
          + issueSuffix
        : physicalSpec.piece === "Bracelet"
          ? `Ø ${physicalSpec.bracelet.innerDiameterMm.toFixed(1)} mm opening · `
            + `${physicalSpec.bracelet.tubeDiameterMm.toFixed(2)} mm tube · `
            + `${formatStoneDimensions(physicalSpec)} stone`
            + issueSuffix
          : `Ø ${physicalSpec.earrings.postDiameterMm.toFixed(2)} mm post × ${physicalSpec.earrings.postLengthMm.toFixed(1)} mm · `
            + `${formatStoneDimensions(physicalSpec)} stone each`
            + issueSuffix;
  }

  // Fine-tune live labels (Setting rotation, Stone tilt, Band width).
  // Each <span data-designer-output-for="FIELD"> reads the matching state
  // value and appends the suffix declared on the slider's data attribute.
  root.querySelectorAll("[data-designer-output-for]").forEach((output) => {
    const fieldName = output.dataset.designerOutputFor;
    const value = state[fieldName];
    if (value === undefined || value === null) return;
    const slider = root.querySelector(`[data-designer-field="${fieldName}"]`);
    const suffix = slider?.dataset.designerOutputSuffix || "";
    const num = Number(value);
    if (suffix === "×") {
      output.textContent = `${num.toFixed(2)}×`;
    } else if (suffix === "°") {
      output.textContent = `${Math.round(num)}°`;
    } else {
      output.textContent = `${value}${suffix}`;
    }
  });
}

async function createThreeStudio(root, canvas) {
  const THREE = await import("./three.module.js");
  const { RGBELoader } = await import("./RGBELoader.js");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100);
  const model = new THREE.Group();
  const sparkle = new THREE.Group();
  // Realism Engine §11 — phase-coherent micro-sparkle.
  //   Three tiny point lights orbit the stone on Lissajous paths at
  //   irrationally-related frequencies. As they sweep across crown / star
  //   facet normals they produce transient bright specular hits — the
  //   "scintillation" that distinguishes a real diamond from a glass blob.
  //   Phases are coherent (deterministic per gem) so the sparkle pattern
  //   is reproducible, not random noise.
  const microSparkleGroup = new THREE.Group();
  const microSparkles = [];
  // Accent lights live in world space. When the piece rotates beneath fixed
  // lights, facet flashes emerge naturally; lights must never rotate with the
  // gem or orbit it independently.
  scene.add(microSparkleGroup);
  const runtimeTextures = {};
  const disposableTextures = [];
  const cameraHomeZ = 5.75;
  const cameraMinZ = 3.05;
  const cameraMaxZ = 7.4;
  let environmentTexture = null;
  let currentState = getState(root);
  let currentPhysicalSpec = buildJewellerySpec(currentState);
  let frameId = null;
  let isDragging = false;
  let isInspecting = false;
  let isAutoOrbiting = false;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let lastPinchDistance = 0;
  let targetCameraZ = cameraHomeZ;

  // ─── Phase 6: Adaptive quality ────────────────────────────────────
  // Default to ULTRA. On sustained heavy frames (rolling avg > 26 ms ≈
  // sub-38 fps) step down to HIGH, then MEDIUM. On sustained recovery
  // (rolling avg < 16 ms ≈ 60 fps with headroom) step back up. Hysteresis
  // via a min-dwell timer prevents oscillation when the GPU sits near a
  // tier boundary. Only the cheap knobs are adjusted — pixel ratio cap
  // and planar-reflection RT resolution. Bloom, DOF and CA stay on at
  // every tier so the *look* of the renderer doesn't visibly degrade;
  // only the *resolution* drops, which on M-series is invisible until
  // tier 2 on a high-DPI display.
  const QUALITY_TIERS = [
    { name: "ultra",  pixelRatioCap: 2,   reflectionSize: 512 },
    { name: "high",   pixelRatioCap: 1.5, reflectionSize: 384 },
    { name: "medium", pixelRatioCap: 1,   reflectionSize: 256 }
  ];
  let qualityTier = 0;
  const frameTimeRing = new Float32Array(60);
  let frameTimeIndex = 0;
  let frameTimeFilled = 0;
  let lastFrameTimestamp = 0;
  let qualityDwellUntil = 0;

  // Present-pose rotation: tilt the model forward so the centre stone's
  // table (which faces +Y in model space) tips toward the camera. Without
  // this, the default view is a strict elevation — stone seen in profile,
  // band seen edge-on — which strips out the sparkle a buyer expects when
  // a ring is photographed for marketing. A ~22° forward tilt + ~10° yaw
  // shows the stone's table, the band's 3D profile, and the side gallery
  // all at once.
  let targetRotationX = -0.38;
  let targetRotationY = -0.18;
  // §5 + §11 dangle physics — driven damped pendulum for pieces that hang
  // (necklace pendants, drop/chandelier earrings). The whole piece swings
  // about its top anchor when the turntable accelerates, then settles with
  // light underdamping:  θ'' = −ω₀²θ − 2ζω₀θ' − k·a_support.
  const dangleSim = {
    node: null,
    thetaX: 0, omegaX: 0,
    thetaZ: 0, omegaZ: 0,
    prevYaw: 0, prevYawVel: 0,
    prevPitch: 0, prevPitchVel: 0,
    freq: 1.1,      // natural frequency Hz — set per piece on rebuild
    lastT: 0
  };
  // Inspect-mode pan offsets (world units). Shift-drag or two-finger drag
  // adds to these so the user can look at the top of a band, the back of
  // a halo, etc. Reset when exiting inspect mode.
  let inspectPanX = 0;
  let inspectPanY = 0;
  let onReadoutChange = null;
  let lastReadoutKey = "";
  const activePointers = new Map();

  renderer.setClearColor(0x000000, 0);
  // AgX gives more natural highlight roll-off than ACES for jewelry; fall back
  // gracefully on older builds of three.js.
  renderer.toneMapping = (typeof THREE.AgXToneMapping !== "undefined")
    ? THREE.AgXToneMapping
    : THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Auto-update env map intensities + use highp where supported for crisper
  // specular highlights on the curved surfaces of small jewellery.
  if ("precision" in renderer.capabilities) {
    // best-effort hint; renderer already picks highp when available
  }
  // Modern physical lighting + sRGB output - critical for getting metal
  // colors to read as the goldsmith intends.
  if ("useLegacyLights" in renderer) {
    renderer.useLegacyLights = false;
  }
  if ("physicallyCorrectLights" in renderer) {
    renderer.physicallyCorrectLights = true;
  }

  if ("outputColorSpace" in renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  camera.position.set(0, 0.62, cameraHomeZ);
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

  // Phase 2 — Hallmark engraving texture.
  // Real jewelry always carries a karat/maker stamp on the inside of the
  // band. We bake the stamp string into a 2048×128 canvas as dark text on
  // a mid-gray background, then sample it as a bumpMap on a thin cylinder
  // mounted just inside the band's inner surface. Mid-gray = no bump
  // displacement, dark = depressed (when bumpScale is negative), so the
  // text reads as engraved. Repeating the text 4× across the canvas width
  // gives a continuous engraving around the full circumference without
  // letter-stretching, since the cylinder UVs span [0,1] once around.
  function createHallmarkTexture(text) {
    return createCanvasTexture(2048, 128, (ctx, w, h) => {
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#1a1a1a";
      ctx.font = "bold 60px 'Helvetica Neue', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const repeat = 4;
      const segW = w / repeat;
      for (let i = 0; i < repeat; i += 1) {
        ctx.fillText(text, segW * (i + 0.5), h * 0.5);
      }
    }, { repeat: 1 });
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

  function createHammeredNormalTexture() {
    // Procedural hammered-metal normal: many overlapping circular dimples.
    // Normals encode dimple curvature so light catches the rims of each peen mark.
    return createCanvasTexture(512, 512, (context, width, height) => {
      context.fillStyle = "rgb(128, 128, 255)";
      context.fillRect(0, 0, width, height);
      const dimples = 110;
      for (let i = 0; i < dimples; i += 1) {
        const cx = Math.random() * width;
        const cy = Math.random() * height;
        const r  = 18 + Math.random() * 48;
        // Each dimple: bright rim (high Z) -> dark center (low Z) gradient.
        const grad = context.createRadialGradient(cx, cy, r * 0.05, cx, cy, r);
        grad.addColorStop(0,    "rgba( 96, 96,255,0.55)");
        grad.addColorStop(0.55, "rgba(128,128,255,0.0)");
        grad.addColorStop(0.78, "rgba(168,168,255,0.45)");
        grad.addColorStop(1,    "rgba(128,128,255,0)");
        context.fillStyle = grad;
        context.beginPath();
        context.arc(cx, cy, r, 0, Math.PI * 2);
        context.fill();
      }
      // Light micro-noise for tooled surface grit.
      context.globalAlpha = 0.08;
      for (let i = 0; i < 1200; i += 1) {
        const tone = 118 + Math.random() * 24;
        context.fillStyle = `rgb(${tone},${tone},255)`;
        context.fillRect(Math.random() * width, Math.random() * height, 1, 1);
      }
    }, { repeat: 3 });
  }

  function createSandblastNormalTexture() {
    // High-frequency pitted noise normal map for matte sandblasted metal.
    return createCanvasTexture(256, 256, (context, width, height) => {
      const image = context.createImageData(width, height);
      for (let index = 0; index < image.data.length; index += 4) {
        // Random direction perturbation, weighted toward flat (B=255).
        const ang  = Math.random() * Math.PI * 2;
        const mag  = (Math.random() ** 2) * 0.55; // bias to small bumps
        image.data[index]     = Math.round(128 + Math.cos(ang) * mag * 60);
        image.data[index + 1] = Math.round(128 + Math.sin(ang) * mag * 60);
        image.data[index + 2] = 255;
        image.data[index + 3] = 255;
      }
      context.putImageData(image, 0, 0);
    }, { repeat: 24 });
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

      // §3 hairline polishing scratches — every real polished metal carries
      // a population of sub-pixel scratches left by the rouge cloth's last
      // pass. Their geometry is the classic signature of "real handled
      // jewelry": dense at low angles, sparser at extremes, sub-1 px wide,
      // length distributed log-normally. Energy interpretation:
      //   r(x) = r₀ + Σ_i a_i · K(x − x_i, θ_i)
      // where K is a thin anisotropic kernel. Driving roughness up locally
      // (bright streaks on a roughness map → higher roughness) makes the
      // metal's specular highlight visibly fragment instead of staying a
      // mathematical mirror sweep. Kept low-amplitude (alpha ≤ 0.22) so
      // they never read as actual damage — only as the soft sheen
      // discontinuity real macro photos show.
      context.globalAlpha = 0.18;
      context.lineCap = "round";
      // 220 long scratches, mostly horizontal-ish (real polishing wheel
      // direction is the dominant axis but never perfectly uniform).
      for (let i = 0; i < 220; i += 1) {
        const cx = Math.random() * width;
        const cy = Math.random() * height;
        // Bias angle toward 0 (horizontal) with ±18° spread; 12% of
        // scratches get a free angle so we don't read as a brush map.
        const free = Math.random() < 0.12;
        const angle = free
          ? Math.random() * Math.PI
          : (Math.random() - 0.5) * 0.62; // ±~18°
        // Log-normal length: most are short, a few are long sweeps.
        const len = Math.exp(Math.random() * 3.2 + 2.4); // ~11 .. 320 px
        const dx = Math.cos(angle) * len * 0.5;
        const dy = Math.sin(angle) * len * 0.5;
        const brightness = 180 + Math.random() * 60; // raise local roughness
        context.strokeStyle = `rgb(${brightness},${brightness},${brightness})`;
        context.lineWidth = Math.random() < 0.85 ? 0.6 : 1.2;
        context.beginPath();
        context.moveTo(cx - dx, cy - dy);
        context.lineTo(cx + dx, cy + dy);
        context.stroke();
      }
      // 90 micro-pits (tiny dark points → locally smoother) — represent
      // micro-craters from polishing compound particles. Reads as
      // "pinpoint sparkles" on the metal in motion.
      context.globalAlpha = 0.22;
      for (let i = 0; i < 90; i += 1) {
        const tone = 60 + Math.random() * 50; // dark = lower roughness
        context.fillStyle = `rgb(${tone},${tone},${tone})`;
        const sz = Math.random() < 0.7 ? 1 : 2;
        context.fillRect(Math.random() * width, Math.random() * height, sz, sz);
      }
    }, { repeat: 5 });
  }

  // §3 — Skin-oil / smudge low-frequency metalness modulation.
  //
  // Real handled jewellery always carries a slowly-varying film of skin
  // oils, polish wax residue, and humidity-deposited moisture. Optically
  // these films are dielectric thin layers (n ≈ 1.45, t < 1 μm) that
  // locally reduce the effective metallic Fresnel response — the mirror
  // gets ever-so-slightly milky in patches.
  //
  // In three.js MeshPhysicalMaterial the `metalnessMap` blue channel
  // multiplies the metalness factor, so a texture in the 0.93..1.0 range
  // dips the base metalness 1.0 down to 0.93..1.0 across the surface
  // without ever falsely raising it. The variation is at very low spatial
  // frequency (few cycles across the band) — it's a *smudge field*, not a
  // brushed pattern. Energy interpretation:
  //   m(x) = 1 − σ(x),    σ(x) = Σ_k a_k · gaussian(x − c_k, r_k)
  // where the smudge sources c_k are randomly placed Gaussian blobs.
  function createMetalSmudgeTexture() {
    return createCanvasTexture(512, 512, (context, width, height) => {
      // Base: full metalness everywhere (blue channel = 255 ⇒ ×1.0).
      context.fillStyle = "rgb(255,255,255)";
      context.fillRect(0, 0, width, height);
      // Layer of 14 large soft Gaussian smudges, each dipping metalness
      // by up to ~7 %. Radial gradient gives the C¹-continuous Gaussian
      // falloff with no banding.
      context.globalCompositeOperation = "multiply";
      for (let i = 0; i < 14; i += 1) {
        const cx = Math.random() * width;
        const cy = Math.random() * height;
        const r = 60 + Math.random() * 140; // large patches
        // Darkness 240..253 → metalness ×0.94..0.99.
        const dark = 240 + Math.floor(Math.random() * 14);
        const grad = context.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0.0, `rgb(${dark},${dark},${dark})`);
        grad.addColorStop(1.0, "rgb(255,255,255)");
        context.fillStyle = grad;
        context.fillRect(0, 0, width, height);
      }
      context.globalCompositeOperation = "source-over";
      // Restore strict 0.93..1.0 range and add a final near-imperceptible
      // grain so the smudge field doesn't read as banding under tone-map.
      const image = context.getImageData(0, 0, width, height);
      for (let p = 0; p < image.data.length; p += 4) {
        const jitter = (Math.random() - 0.5) * 4;
        image.data[p]     = Math.max(237, Math.min(255, image.data[p]     + jitter));
        image.data[p + 1] = image.data[p];
        image.data[p + 2] = image.data[p];
      }
      context.putImageData(image, 0, 0);
    }, { repeat: 2 });  // low repeat so the smudge field doesn't tile visibly
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

  function createGemBodyTexture(profile, stoneName) {
    return createCanvasTexture(768, 768, (context, width, height) => {
      const centerX = width * 0.5;
      const centerY = height * 0.48;
      const body = context.createRadialGradient(centerX * 0.82, centerY * 0.74, width * 0.02, centerX, centerY, width * 0.62);

      body.addColorStop(0, profile.table);
      body.addColorStop(0.22, profile.tint);
      body.addColorStop(0.58, profile.color);
      body.addColorStop(1, profile.absorption);
      context.fillStyle = body;
      context.fillRect(0, 0, width, height);

      context.globalCompositeOperation = "screen";
      context.globalAlpha = stoneName === "Clear Diamond" ? 0.42 : 0.22;

      for (let index = 0; index < 24; index += 1) {
        const angle = (Math.PI * 2 * index) / 24;
        const x = centerX + Math.cos(angle) * width * 0.18;
        const y = centerY + Math.sin(angle) * height * 0.14;
        const gradient = context.createLinearGradient(x - 90, y - 20, x + 90, y + 20);

        gradient.addColorStop(0, "rgba(255,255,255,0)");
        gradient.addColorStop(0.5, index % 4 === 0 ? "rgba(255,230,178,0.75)" : "rgba(210,245,255,0.62)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        context.save();
        context.translate(x, y);
        context.rotate(angle);
        context.fillStyle = gradient;
        context.fillRect(-120, -2, 240, 4);
        context.restore();
      }

      context.globalCompositeOperation = "source-over";
      context.globalAlpha = stoneName === "Emerald Green" ? 0.28 : stoneName === "Clear Diamond" ? 0.08 : 0.18;
      context.strokeStyle = stoneName === "Clear Diamond" ? "rgba(130,150,160,0.42)" : "rgba(255,255,255,0.42)";
      context.lineWidth = 1;

      for (let index = 0; index < 70; index += 1) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const length = 14 + Math.random() * (stoneName === "Emerald Green" ? 120 : 62);
        const angle = stoneName === "Emerald Green" ? -0.2 + Math.random() * 0.4 : Math.random() * Math.PI;

        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
        context.stroke();
      }

      context.globalAlpha = stoneName === "Clear Diamond" ? 0.12 : 0.2;

      for (let index = 0; index < 140; index += 1) {
        const radius = 0.35 + Math.random() * (stoneName === "Clear Diamond" ? 1.1 : 1.8);
        context.fillStyle = index % 4 === 0 ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.16)";
        context.beginPath();
        context.arc(Math.random() * width, Math.random() * height, radius, 0, Math.PI * 2);
        context.fill();
      }
    }, { repeat: 1, colorSpace: THREE.SRGBColorSpace });
  }

  function createCausticTexture() {
    return createCanvasTexture(768, 768, (context, width, height) => {
      context.clearRect(0, 0, width, height);

      const centerX = width * 0.5;
      const centerY = height * 0.5;
      const glow = context.createRadialGradient(centerX, centerY, 12, centerX, centerY, width * 0.46);
      glow.addColorStop(0, "rgba(255,255,255,0.72)");
      glow.addColorStop(0.2, "rgba(205,244,255,0.36)");
      glow.addColorStop(0.52, "rgba(244,234,214,0.18)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      context.globalCompositeOperation = "lighter";

      for (let index = 0; index < 34; index += 1) {
        const angle = (Math.PI * 2 * index) / 34;
        const radius = width * (0.08 + Math.random() * 0.34);
        const x = centerX + Math.cos(angle) * radius * 0.9;
        const y = centerY + Math.sin(angle) * radius * 0.54;
        const length = 70 + Math.random() * 160;

        context.save();
        context.translate(x, y);
        context.rotate(angle + Math.PI / 2 + (Math.random() - 0.5) * 0.8);
        context.globalAlpha = 0.12 + Math.random() * 0.2;
        context.strokeStyle = index % 3 === 0 ? "#c9f4ff" : index % 3 === 1 ? "#ffe7b0" : "#ffffff";
        context.lineWidth = 1 + Math.random() * 2.4;
        context.beginPath();
        context.moveTo(-length * 0.48, 0);
        context.bezierCurveTo(-length * 0.2, -18, length * 0.18, 18, length * 0.48, 0);
        context.stroke();
        context.restore();
      }
    }, { repeat: 1, colorSpace: THREE.SRGBColorSpace });
  }

  function createPrismaticSparkTexture() {
    return createCanvasTexture(512, 512, (context, width, height) => {
      const centerX = width * 0.5;
      const centerY = height * 0.5;
      const glow = context.createRadialGradient(centerX, centerY, 2, centerX, centerY, width * 0.45);

      context.clearRect(0, 0, width, height);
      glow.addColorStop(0, "rgba(255,255,255,1)");
      glow.addColorStop(0.12, "rgba(255,255,255,0.82)");
      glow.addColorStop(0.36, "rgba(190,236,255,0.28)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = "lighter";

      [
        ["#ffffff", 0, 1],
        ["#bcefff", Math.PI * 0.06, 0.72],
        ["#ffd6ea", Math.PI * 0.28, 0.54],
        ["#fff0b8", Math.PI * 0.5, 0.44],
        ["#d7d0ff", Math.PI * 0.72, 0.36]
      ].forEach(([color, rotation, alpha]) => {
        context.save();
        context.translate(centerX, centerY);
        context.rotate(rotation);
        context.globalAlpha = alpha;
        context.strokeStyle = color;
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(-width * 0.4, 0);
        context.lineTo(width * 0.4, 0);
        context.stroke();
        context.lineWidth = 1.4;
        context.beginPath();
        context.moveTo(0, -height * 0.26);
        context.lineTo(0, height * 0.26);
        context.stroke();
        context.restore();
      });
    }, { repeat: 1, colorSpace: THREE.SRGBColorSpace });
  }

  function createShowcaseNormalTexture() {
    return createCanvasTexture(512, 512, (context, width, height) => {
      context.fillStyle = "rgb(128,128,255)";
      context.fillRect(0, 0, width, height);
      context.globalAlpha = 0.2;

      for (let index = 0; index < 1600; index += 1) {
        const tone = 116 + Math.random() * 24;
        context.fillStyle = `rgb(${tone}, ${tone}, 255)`;
        context.fillRect(Math.random() * width, Math.random() * height, 1, 1);
      }

      context.globalAlpha = 0.16;
      context.strokeStyle = "rgb(170,170,255)";

      for (let ring = 0; ring < 18; ring += 1) {
        context.beginPath();
        context.ellipse(width * 0.5, height * 0.5, 40 + ring * 15, 18 + ring * 8, 0, 0, Math.PI * 2);
        context.stroke();
      }
    }, { repeat: 2.2 });
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
  runtimeTextures.hammeredNormal = createHammeredNormalTexture();
  runtimeTextures.sandblastNormal = createSandblastNormalTexture();
  runtimeTextures.microRoughness = createFineRoughnessTexture();
  runtimeTextures.metalSmudge = createMetalSmudgeTexture();
  runtimeTextures.velvet = createStudioVelvetTexture();
  runtimeTextures.gemNormal = createGemMicroNormalTexture();
  runtimeTextures.gemInclusions = createGemInclusionTexture();
  runtimeTextures.gemBodyMaps = Object.fromEntries(
    Object.entries(STONE_PROFILES).map(([name, profile]) => [name, createGemBodyTexture(profile, name)])
  );
  runtimeTextures.caustics = createCausticTexture();
  runtimeTextures.prismSpark = createPrismaticSparkTexture();
  runtimeTextures.showcaseNormal = createShowcaseNormalTexture();
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

  // Soft radial contact shadow disc directly under the model. Procedurally
  // drawn so it never depends on shadow-map resolution and reads clean on any
  // backdrop / lighting mode.
  const contactShadowCanvas = document.createElement("canvas");
  contactShadowCanvas.width = 256;
  contactShadowCanvas.height = 256;
  const csCtx = contactShadowCanvas.getContext("2d");
  const csGrad = csCtx.createRadialGradient(128, 128, 8, 128, 128, 120);
  csGrad.addColorStop(0.0, "rgba(0,0,0,0.55)");
  csGrad.addColorStop(0.4, "rgba(0,0,0,0.32)");
  csGrad.addColorStop(0.75, "rgba(0,0,0,0.12)");
  csGrad.addColorStop(1.0, "rgba(0,0,0,0.0)");
  csCtx.fillStyle = csGrad;
  csCtx.fillRect(0, 0, 256, 256);
  const contactShadowTexture = new THREE.CanvasTexture(contactShadowCanvas);
  contactShadowTexture.colorSpace = THREE.SRGBColorSpace;
  disposableTextures.push(contactShadowTexture);
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.85, 1.85),
    new THREE.MeshBasicMaterial({
      map: contactShadowTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.7
    })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0, -1.1, 0);
  contactShadow.renderOrder = -1;
  scene.add(contactShadow);
  // Tighter hot-spot shadow disc directly under the piece — gives the
  // illusion of an AO contact dot that grounds the model to the plinth.
  const contactShadowHot = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 0.95),
    new THREE.MeshBasicMaterial({
      map: contactShadowTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.55
    })
  );
  contactShadowHot.rotation.x = -Math.PI / 2;
  contactShadowHot.position.set(0, -1.095, 0);
  contactShadowHot.renderOrder = -1;
  scene.add(contactShadowHot);
  const hemi = new THREE.HemisphereLight(0xf8fbff, 0x281c1a, 1.35);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 3.0);
  key.position.set(3.8, 4.6, 3.4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 12;
  key.shadow.camera.left = -4;
  key.shadow.camera.right = 4;
  key.shadow.camera.top = 4;
  key.shadow.camera.bottom = -4;
  // Tighter bias + larger PCF kernel = softer contact, no shadow acne on
  // tiny prong tips and pavé claws.
  key.shadow.bias = -0.00035;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 5;
  key.target.position.set(0, 0.05, 0);
  scene.add(key, key.target);

  const fill = new THREE.PointLight(0xfff2d8, 2.2, 9);
  fill.position.set(-2.7, 1.8, 3.6);
  scene.add(fill);

  // Cooler rim (back-right) — classic jewel-photography counter light, kicks
  // a crisp cyan edge along the silhouette without warming the metal.
  const rim = new THREE.PointLight(0xb6d4ff, 3.6, 10);
  rim.position.set(3.1, 0.8, -1.2);
  scene.add(rim);

  // Back kicker — far behind the piece, soft white-blue, lifts the rear
  // contour off the dark backdrop in inspect mode.
  const kicker = new THREE.PointLight(0xe8f1ff, 2.4, 8);
  kicker.position.set(-2.4, 1.6, -2.6);
  scene.add(kicker);

  const gemPunch = new THREE.SpotLight(0xffffff, 7.8, 9, 0.42, 0.58, 0.9);
  gemPunch.position.set(-1.7, 2.2, 3.6);
  gemPunch.target.position.set(-0.32, 0.6, 0);
  scene.add(gemPunch, gemPunch.target);

  const tableFlash = new THREE.PointLight(0xdff6ff, 2.8, 4.5);
  tableFlash.position.set(-0.55, 0.85, 1.6);
  scene.add(tableFlash);

  // Underlight — a faint warm point light positioned BELOW the piece pointing
  // up through the pavilion. Real jewelry photography uses a tracing-paper
  // diffuser below the gem so the pavilion lights up from inside; this fakes
  // that "lit from within" look without changing scene composition. Low
  // intensity + short range so it only kicks the gem and prong undersides.
  const underlight = new THREE.PointLight(0xffeac8, 0.85, 2.4, 1.6);
  underlight.position.set(0, -0.55, 0.15);
  scene.add(underlight);

  // ─── Fixed photographic accent lights ───────────────────────────────
  // Three restrained, world-space pin lights emulate real jewellery-table
  // accents. They remain fixed while the turntable/model moves, so a facet
  // only flashes when the reflection condition is actually crossed.
  {
    const tints = [0xffe9c8, 0xdfeeff, 0xfff4d6];
    const positions = [
      [-0.62, 0.92, 1.38],
      [0.74, 0.54, 1.10],
      [-0.18, 1.34, 0.72]
    ];
    for (let i = 0; i < 3; i += 1) {
      const light = new THREE.PointLight(tints[i], 0, 2.2, 2.0);
      light.position.set(...positions[i]);
      light.userData.baseIntensity = [0.30, 0.22, 0.18][i];
      microSparkleGroup.add(light);
      microSparkles.push(light);
    }
  }


  const studioSet = new THREE.Group();
  scene.add(studioSet);

  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(8.4, 5.2, 1, 1),
    new THREE.MeshBasicMaterial({
      color: 0x071012,
      transparent: true,
      opacity: 0.74,
      depthWrite: false,
      // toneMapped:false so a pure-white Studio White backdrop (0xffffff)
      // doesn't get crushed to mid-gray by AgX. Dark backdrops still render
      // correctly because their hex values are already low enough.
      toneMapped: false
    })
  );
  backdrop.position.set(0.3, 0.55, -3.2);
  studioSet.add(backdrop);

  function addSoftbox(width, height, x, y, z, color, opacity, rotationZ = 0) {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      })
    );

    panel.position.set(x, y, z);
    panel.lookAt(0, 0, 0.4);
    panel.rotation.z += rotationZ;
    studioSet.add(panel);
    return panel;
  }

  const softboxes = [
    addSoftbox(1.2, 3.2, -3.15, 1.1, -1.15, 0xeaf8ff, 0.16, -0.08),
    addSoftbox(0.9, 2.4, 2.75, 1.35, -1.65, 0xffe0b8, 0.13, 0.12),
    addSoftbox(2.2, 0.28, -0.1, 2.35, -1.4, 0xffffff, 0.12, 0)
  ];

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

  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(1.88, 2.18, 0.2, 128),
    new THREE.MeshPhysicalMaterial({
      color: 0x101615,
      roughness: 0.34,
      metalness: 0,
      map: runtimeTextures.velvet,
      normalMap: runtimeTextures.showcaseNormal,
      normalScale: new THREE.Vector2(0.035, 0.035),
      clearcoat: 0.52,
      clearcoatRoughness: 0.2,
      sheen: 0.74,
      sheenColor: 0x9bb8af,
      sheenRoughness: 0.68,
      envMapIntensity: 0.9
    })
  );
  plinth.position.set(-0.1, -1.5, -0.28);
  plinth.receiveShadow = true;
  plinth.castShadow = true;
  scene.add(plinth);

  const glassPlate = new THREE.Mesh(
    new THREE.CircleGeometry(2.05, 128),
    new THREE.MeshPhysicalMaterial({
      color: 0xdff8ff,
      roughness: 0.05,
      metalness: 0,
      transparent: true,
      opacity: 0.18,
      transmission: 0.7,
      thickness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 1.8
    })
  );
  glassPlate.rotation.x = -Math.PI / 2;
  glassPlate.position.set(-0.1, -1.365, -0.28);
  glassPlate.receiveShadow = true;
  scene.add(glassPlate);

  const reflection = new THREE.Mesh(
    new THREE.RingGeometry(1.05, 3.05, 96),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.04, side: THREE.DoubleSide })
  );
  reflection.rotation.x = -Math.PI / 2;
  reflection.position.set(0, -1.37, -0.2);
  scene.add(reflection);

  const caustics = new THREE.Mesh(
    new THREE.CircleGeometry(2.65, 128),
    new THREE.MeshBasicMaterial({
      map: runtimeTextures.caustics,
      color: 0xffffff,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    })
  );
  caustics.rotation.x = -Math.PI / 2;
  caustics.position.set(-0.05, -1.355, -0.28);
  caustics.renderOrder = 1;
  scene.add(caustics);

  // ─── Phase 4: Planar Plinth Reflection ────────────────────────────────
  // Real product photography uses a polished black acrylic base so the
  // piece "doubles" into a soft mirror below it. Three has no built-in
  // Reflector in the core module, so we roll a minimal planar reflector:
  //
  //   1. Mirror the main camera across the reflection plane (y = -1.365).
  //   2. Hide the floor/plinth/shadow discs (would self-occlude the mirror).
  //   3. Render the scene from the mirrored camera into reflectionRT, with
  //      a clipping plane so nothing below the plinth leaks through.
  //   4. In the main pass, the mirror disc samples reflectionRT in screen
  //      space and blends with the plinth's dark base via a Fresnel weight,
  //      so reflections fade at grazing angles like real polished onyx.
  //
  // Cost: one extra scene render per frame at 512², well within budget on
  // M-series GPUs. UnsignedByteType so the texture survives the renderer's
  // sRGB output transform (matches sceneRT — see threejs-gotchas note).
  const REFLECTION_PLANE_Y = -1.352;
  const reflectionRT = new THREE.WebGLRenderTarget(512, 512, {
    type: THREE.UnsignedByteType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    generateMipmaps: false,
    depthBuffer: true,
    stencilBuffer: false
  });
  reflectionRT.texture.colorSpace = THREE.SRGBColorSpace;
  const reflectionCamera = new THREE.PerspectiveCamera();
  const reflectionClipPlane = new THREE.Plane(
    new THREE.Vector3(0, 1, 0),
    -REFLECTION_PLANE_Y + 0.001
  );

  const reflectionMaterial = new THREE.ShaderMaterial({
    uniforms: {
      tReflect: { value: reflectionRT.texture },
      uBaseColor: { value: new THREE.Color(0x0c0f12) },
      uReflectStrength: { value: 1.6 },
      uFresnelPow: { value: 1.8 },
      uBlur: { value: 1.5 },
      uTexel: { value: new THREE.Vector2(1 / 512, 1 / 512) }
    },
    transparent: true,
    depthWrite: false,
    vertexShader: `
      varying vec4 vProj;
      varying vec3 vWorldNormal;
      varying vec3 vViewDir;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vec4 mvPos = viewMatrix * worldPos;
        gl_Position = projectionMatrix * mvPos;
        vProj = gl_Position;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - worldPos.xyz);
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform sampler2D tReflect;
      uniform vec3 uBaseColor;
      uniform float uReflectStrength;
      uniform float uFresnelPow;
      uniform float uBlur;
      uniform vec2 uTexel;
      varying vec4 vProj;
      varying vec3 vWorldNormal;
      varying vec3 vViewDir;

      vec3 sampleBlurred(vec2 uv) {
        // 5-tap cross blur — cheap, hides reflection-RT aliasing on the
        // gem's sharp facet highlights, gives the surface a soft polished
        // (not chrome) look. Radius scaled by uBlur for grazing-angle
        // intensity falloff.
        vec3 c = texture2D(tReflect, uv).rgb;
        vec2 o = uTexel * uBlur;
        c += texture2D(tReflect, uv + vec2( o.x,  0.0)).rgb;
        c += texture2D(tReflect, uv + vec2(-o.x,  0.0)).rgb;
        c += texture2D(tReflect, uv + vec2( 0.0,  o.y)).rgb;
        c += texture2D(tReflect, uv + vec2( 0.0, -o.y)).rgb;
        return c * 0.2;
      }

      void main() {
        vec2 uv = (vProj.xy / vProj.w) * 0.5 + 0.5;
        // Clamp to avoid sampling outside the reflection RT at extreme
        // angles (would smear edge pixels across the plinth).
        uv = clamp(uv, vec2(0.002), vec2(0.998));

        vec3 reflColor = sampleBlurred(uv);

        // Fresnel — Schlick approximation. Plinth surface normal is +Y in
        // world space, so cosTheta is just abs(viewDir.y). Looking straight
        // down gives weak reflection (mostly base color); grazing gives
        // strong reflection (mostly mirror image). uFresnelPow = 3.6 is
        // close to acrylic's IOR-1.49 behavior.
        float cosTheta = clamp(abs(dot(normalize(vViewDir), normalize(vWorldNormal))), 0.0, 1.0);
        float fres = pow(1.0 - cosTheta, uFresnelPow);
        float mixAmt = clamp(fres * uReflectStrength + 0.06, 0.0, 0.95);

        vec3 outColor = mix(uBaseColor, reflColor, mixAmt);
        // Slight darkening at the edges of the disc (radial vignette in UV
        // space relative to disc center) so the mirror fades into the
        // surrounding plinth instead of cutting off as a hard circle.
        gl_FragColor = vec4(outColor, 0.92);
      }
    `
  });
  const reflectionMirror = new THREE.Mesh(
    new THREE.CircleGeometry(2.02, 128),
    reflectionMaterial
  );
  reflectionMirror.rotation.x = -Math.PI / 2;
  reflectionMirror.position.set(-0.1, REFLECTION_PLANE_Y, -0.28);
  reflectionMirror.renderOrder = 2;
  scene.add(reflectionMirror);

  // ─── Underside light-bleed halo ───────────────────────────────────────
  // The narrow 33° camera FOV means a true planar reflection of the ring
  // mostly captures the backdrop (rays bounce off the visible plinth area
  // and travel BEHIND the ring rather than into it). To recreate the
  // iconic "ring impression on polished onyx" look from product photos,
  // we add a soft additive halo disc just above the mirror surface. The
  // halo uses the same radial gradient as the contact shadow but inverted
  // (bright in the middle) so it reads as a metallic light-bleed.
  const haloCanvas = document.createElement("canvas");
  haloCanvas.width = 256;
  haloCanvas.height = 256;
  const hctx = haloCanvas.getContext("2d");
  const hgrad = hctx.createRadialGradient(128, 128, 6, 128, 128, 124);
  hgrad.addColorStop(0.0, "rgba(255,238,210,0.85)");
  hgrad.addColorStop(0.18, "rgba(220,210,200,0.45)");
  hgrad.addColorStop(0.42, "rgba(180,200,210,0.18)");
  hgrad.addColorStop(0.78, "rgba(60,90,110,0.06)");
  hgrad.addColorStop(1.0, "rgba(0,0,0,0)");
  hctx.fillStyle = hgrad;
  hctx.fillRect(0, 0, 256, 256);
  const haloTexture = new THREE.CanvasTexture(haloCanvas);
  haloTexture.colorSpace = THREE.SRGBColorSpace;
  disposableTextures.push(haloTexture);
  const undersideHalo = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 1.4),
    new THREE.MeshBasicMaterial({
      map: haloTexture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.7
    })
  );
  undersideHalo.rotation.x = -Math.PI / 2;
  undersideHalo.position.set(0, REFLECTION_PLANE_Y + 0.001, 0);
  undersideHalo.renderOrder = 3;
  scene.add(undersideHalo);

  // Hide the old glassPlate — the reflectionMirror replaces its role as
  // the polished surface. Keep it in the scene graph so any external code
  // referencing it still works, but make it invisible.
  glassPlate.visible = false;

  // Set of meshes hidden during the reflection pass so they don't
  // self-occlude or pollute the mirror image. (The mirror itself MUST be
  // hidden to avoid infinite recursion.)
  const reflectionHidden = [
    plinth, glassPlate, caustics, floor,
    contactShadow, contactShadowHot, reflection, reflectionMirror, undersideHalo
  ];

  function updateReflection() {
    // Snapshot visibilities so we can restore exactly.
    const prevVis = reflectionHidden.map(m => m.visible);
    for (let i = 0; i < reflectionHidden.length; i += 1) {
      reflectionHidden[i].visible = false;
    }

    // Mirror the camera across y = REFLECTION_PLANE_Y.
    reflectionCamera.fov = camera.fov;
    reflectionCamera.aspect = camera.aspect;
    reflectionCamera.near = camera.near;
    reflectionCamera.far = camera.far;
    reflectionCamera.position.set(
      camera.position.x,
      2 * REFLECTION_PLANE_Y - camera.position.y,
      camera.position.z
    );
    // Camera looks at the model origin reflected across the plane.
    const lookAtX = 0;
    const lookAtY = 2 * REFLECTION_PLANE_Y - 0; // origin mirrored
    const lookAtZ = 0;
    // Flip up vector to maintain handedness through the mirror.
    reflectionCamera.up.set(0, -1, 0);
    reflectionCamera.lookAt(lookAtX, lookAtY, lookAtZ);
    reflectionCamera.updateMatrixWorld();
    reflectionCamera.updateProjectionMatrix();

    // Clipping plane prevents geometry below the reflection plane from
    // leaking into the mirror (would show as inverted floor crud).
    const prevClipping = renderer.clippingPlanes;
    const prevLocalClipping = renderer.localClippingEnabled;
    renderer.clippingPlanes = [reflectionClipPlane];
    renderer.localClippingEnabled = true;

    const prevTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(reflectionRT);
    renderer.clear();
    renderer.render(scene, reflectionCamera);
    renderer.setRenderTarget(prevTarget);

    renderer.clippingPlanes = prevClipping;
    renderer.localClippingEnabled = prevLocalClipping;

    // Restore visibilities.
    for (let i = 0; i < reflectionHidden.length; i += 1) {
      reflectionHidden[i].visible = prevVis[i];
    }
  }

  const BACKDROP_PRESETS = {
    Velvet:  { color: 0x141a1c, floorColor: 0x1c2326, floorOpacity: 0.42, sheen: 0xcbded5, plinth: 0x101615 },
    Marble:  { color: 0xe8e3dc, floorColor: 0xf2efe9, floorOpacity: 0.66, sheen: 0xffffff, plinth: 0xcfc6b7 },
    Onyx:    { color: 0x05080a, floorColor: 0x080a0c, floorOpacity: 0.74, sheen: 0xa6c2c9, plinth: 0x0a0d10 },
    Linen:   { color: 0xc7b9a3, floorColor: 0xd9cbb4, floorOpacity: 0.5, sheen: 0xf3e7cd, plinth: 0x8a7659 },
    Sweep:   { color: 0xeef0f2, floorColor: 0xf6f7f8, floorOpacity: 0.62, sheen: 0xffffff, plinth: 0xbfc4c8 },
    Concrete: { color: 0x3a3d40, floorColor: 0x4c5054, floorOpacity: 0.58, sheen: 0x8a9094, plinth: 0x2e3134 },
    Driftwood: { color: 0x6e553a, floorColor: 0x8a6d4c, floorOpacity: 0.56, sheen: 0xd9b889, plinth: 0x4d3b27 },
    Holographic: { color: 0x1a0a2e, floorColor: 0x2a1450, floorOpacity: 0.7, sheen: 0xff7af0, plinth: 0x12082a },
    Smoke:   { color: 0x16161a, floorColor: 0x202028, floorOpacity: 0.52, sheen: 0x8c7fa6, plinth: 0x0d0d10 },
    Ivory:   { color: 0xf2ead9, floorColor: 0xf8f1e3, floorOpacity: 0.7, sheen: 0xffffff, plinth: 0xc9bda3 },
    // Catalog-grade pure-white seamless cyc — inspired by Richter & Phillips
    // designer. Bright neutral white backdrop + soft mirror floor so the
    // ring and gem read like a studio product shot.
    "Studio White": { color: 0xffffff, floorColor: 0xffffff, floorOpacity: 0.85, sheen: 0xffffff, plinth: 0xe5e7ea }
  };

  function applyBackdrop(name) {
    const preset = BACKDROP_PRESETS[name] || BACKDROP_PRESETS.Velvet;
    const isStudioWhite = name === "Studio White";
    backdrop.material.color.setHex(preset.color);
    backdrop.material.opacity = isStudioWhite ? 1.0 : name === "Sweep" || name === "Marble" ? 0.94 : 0.82;
    floor.material.color.setHex(preset.floorColor);
    floor.material.opacity = preset.floorOpacity;
    floor.material.sheenColor.setHex(preset.sheen);
    // The velvet base map darkens the floor; strip it in Studio White so
    // the catalog cyc reads as a flat seamless white sweep.
    floor.material.map = isStudioWhite ? null : runtimeTextures.velvet;
    floor.material.needsUpdate = true;
    plinth.material.color.setHex(preset.plinth);
    plinth.material.needsUpdate = true;
    // Catalog look: hide the dark display props so the ring floats on
    // pure white with only its contact shadow + planar reflection visible.
    plinth.visible = !isStudioWhite;
    glassPlate.visible = !isStudioWhite;
    caustics.visible = !isStudioWhite;
    // Solid white scene.background fills the void around the floor disc
    // and the cyclorama edges so the canvas reads as a clean seamless
    // sweep edge-to-edge. Cleared back to null for other backdrops so the
    // post chain's tonemap + canvas alpha keep working as before.
    scene.background = isStudioWhite ? new THREE.Color(0xffffff) : null;
    // Expand the backdrop plane wide enough to fill the whole framing in
    // Studio White (acts as a true infinity cyc); keep the smaller size
    // for the lit display modes so the backdrop tones don't dominate.
    backdrop.scale.set(isStudioWhite ? 4 : 1, isStudioWhite ? 4 : 1, 1);
    backdrop.position.z = isStudioWhite ? -2.6 : -3.2;
    if (isStudioWhite) {
      floor.material.color.setHex(0xf5f6f8);
      floor.material.opacity = 0.98;
      floor.material.needsUpdate = true;
    }
    if (typeof reflection !== "undefined") {
      reflection.material.opacity = isStudioWhite ? 0.12 : 0.04;
    }
  }

  const VIEW_PRESETS = {
    "Three-Quarter": { z: cameraHomeZ,            rx: 0.03,             ry: -0.18 },
    "Macro":         { z: cameraMinZ + 0.2,       rx: 0.18,             ry: -0.12 },
    "Top-Down":      { z: cameraHomeZ - 0.6,      rx: -Math.PI / 2.2,   ry: 0 },
    "Profile":       { z: cameraHomeZ - 0.3,      rx: 0,                ry: Math.PI / 2.1 }
  };
  function applyView(name) {
    const preset = VIEW_PRESETS[name] || VIEW_PRESETS["Three-Quarter"];
    targetCameraZ = preset.z;
    targetRotationX = preset.rx;
    targetRotationY = preset.ry;
  }

  // Hide ring-specific controls (Band Style, Hidden Halo) when the user is
  // designing a Necklace / Bracelet / Earrings piece. Anything tagged
  // [data-piece-only="X"] is shown only when state.piece === "X".
  function applyPieceOptionVisibility(piece) {
    root.querySelectorAll("[data-piece-only]").forEach((node) => {
      const allowed = node.getAttribute("data-piece-only");
      const show = !allowed || allowed.split(",").map((s) => s.trim()).includes(piece);
      node.hidden = !show;
      node.style.display = show ? "" : "none";
    });

    // Rebuild the silhouette dropdown with the chosen piece's sub-types so
    // the user can pick e.g. "Cigar Band" for rings or "Y-Drop" for
    // necklaces. The currently-selected value is preserved if it's valid
    // for the new piece, otherwise the first entry is chosen.
    const silSelect = root.querySelector('[data-designer-field="silhouette"]');
    if (silSelect) {
      const list = SILHOUETTES[piece] || SILHOUETTES.Ring;
      const previous = silSelect.value;
      const keep = list.includes(previous) ? previous : list[0];
      silSelect.innerHTML = "";
      list.forEach((name) => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        if (name === keep) opt.selected = true;
        silSelect.appendChild(opt);
      });
      if (currentState && currentState.silhouette !== keep) {
        currentState.silhouette = keep;
      }
    }
  }

  function applyLightingMode(modeName) {
    const mode = LIGHTING_MODES[modeName] || LIGHTING_MODES.Daylight;

    renderer.toneMappingExposure = mode.exposure;
    hemi.intensity = mode.hemi;
    key.intensity = mode.key;
    fill.intensity = mode.fill;
    rim.intensity = mode.rim;
    gemPunch.intensity = mode.punch;
    tableFlash.intensity = mode.table;
    key.color.set(mode.keyColor);
    fill.color.set(mode.fillColor);
    rim.color.set(mode.rimColor);
    gemPunch.color.set(mode.punchColor);
    floor.material.opacity = mode.floorOpacity;
    caustics.material.opacity = modeName === "Flash" ? 0.26 : modeName === "Showroom" ? 0.2 : 0.14;
    glassPlate.material.opacity = modeName === "Candlelight" ? 0.14 : 0.18;
    reflection.material.opacity = modeName === "Flash" ? 0.075 : 0.04;
    softboxes.forEach((panel, index) => {
      panel.material.opacity = modeName === "Flash" ? 0.2 : index === 1 && modeName === "Candlelight" ? 0.18 : 0.12 + index * 0.018;
    });
    sparkle.children.forEach((gem) => {
      gem.material.opacity = mode.sparkleOpacity * (currentState && currentState.sparkleBurst ? 1.65 : 1);
    });
    if (currentState && currentState.sparkleBurst) {
      renderer.toneMappingExposure = mode.exposure + 0.08;
    }
    root.dataset.designerLighting = modeName.toLowerCase();
  }

  const sparkleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });

  // The original code scattered 34 octahedron "sparkle gems" behind the
  // ring as bokeh fakes. With the Phase 1 post-chain (bloom + CA) and the
  // Phase 4 DOF in place, those low-poly octahedra read as obvious
  // CG diamond-shaped pixel artifacts, not as photographic bokeh. They
  // are intentionally disabled here — real depth-of-field on the actual
  // gem highlights now provides the soft glow these were faking.
  void sparkleMaterial;

  // -------------------------------------------------------------------
  // PHASE 1 — Photoreal post-processing chain.
  // Scene renders into an HDR (HalfFloat) render target with no tone-mapping
  // applied. A bright-pass + 3-mip separable Gaussian blur builds a bloom
  // pyramid in linear light. A final composite shader stacks:
  //   - radial chromatic aberration (~0.3% lateral, scales with r²)
  //   - bloom (3 mips, falling weight)
  //   - radial vignette
  //   - per-frame film grain
  // Tone-mapping (AgX) + sRGB conversion is applied by the renderer in the
  // composite-to-canvas step because we use ShaderMaterial({toneMapped:true}).
  // This single pipeline costs ~1.4 ms on M-series at 1080p and lifts the
  // perceived realism dramatically — gem specular highlights now bloom into
  // the surrounding metal the way they do in real macro photography.
  // -------------------------------------------------------------------
  let post = null;
  function createPostChain() {
    const rtOpts = { type: THREE.UnsignedByteType, depthBuffer: true, stencilBuffer: false };
    const bloomRtOpts = { type: THREE.HalfFloatType, depthBuffer: false, stencilBuffer: false };
    const sceneRT = new THREE.WebGLRenderTarget(2, 2, rtOpts);
    // Phase 4 DOF: attach a DepthTexture so the composite pass can sample
    // per-pixel scene depth and compute a circle-of-confusion for bokeh.
    // UnsignedShortType is enough precision at our scene scale (~12 units
    // total camera-to-backdrop depth) and avoids the WEBGL_depth_texture
    // float-depth extension cost.
    sceneRT.depthTexture = new THREE.DepthTexture(2, 2);
    sceneRT.depthTexture.type = THREE.UnsignedShortType;
    // NOTE: UnsignedByteType is required here. HalfFloatType (which we tried
    // first for HDR bloom precision) caused the entire jewelry model to
    // render as solid black inside the RT — a three.js r164 quirk likely
    // tied to the PBR material's specular pipeline emitting NaN/Inf into
    // half-float when a depth buffer is attached. LDR after AgX still
    // gives speculars >0.85, so the 0.72 bright-pass threshold still
    // catches every gem flash and metal highlight.
    const bloomMips = [];
    for (let i = 0; i < 3; i += 1) {
      bloomMips.push([
        new THREE.WebGLRenderTarget(2, 2, bloomRtOpts),
        new THREE.WebGLRenderTarget(2, 2, bloomRtOpts)
      ]);
    }
    // §11 diffraction starburst — dedicated half-res RT fed from the raw
    // bright pass (before the gaussian pyramid softens it). Real jewellery
    // photography shows 4/6-point star flares wherever a facet flash
    // saturates the lens; this pass streaks the bright pixels along two
    // diagonal axes to reproduce that aperture-diffraction signature.
    const starRT = new THREE.WebGLRenderTarget(2, 2, bloomRtOpts);

    const fsScene = new THREE.Scene();
    const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const fsQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    fsQuad.frustumCulled = false;
    fsScene.add(fsQuad);

    const vs = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position, 1.0); }";

    const brightMat = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        // Threshold sits just under clip so only true specular flashes
        // bloom — a knee wide enough to catch the whole gold body reads
        // as a radioactive halo, not jewellery.
        threshold: { value: 0.985 },
        knee: { value: 0.1 }
      },
      vertexShader: vs,
      fragmentShader: [
        "varying vec2 vUv;",
        "uniform sampler2D tDiffuse;",
        "uniform float threshold;",
        "uniform float knee;",
        "void main() {",
        "  vec4 src = texture2D(tDiffuse, vUv);",
        "  vec3 c = src.rgb;",
        "  float lum = max(c.r, max(c.g, c.b));",
        "  float soft = clamp((lum - threshold + knee) / (2.0 * knee + 1e-4), 0.0, 1.0);",
        "  soft = soft * soft * (3.0 - 2.0 * soft);",
        "  float weight = max(soft, lum - threshold) / max(lum, 1e-4);",
        "  gl_FragColor = vec4(c * weight, src.a);",
        "}"
      ].join("\n"),
      toneMapped: false,
      depthTest: false,
      depthWrite: false
    });

    const blurMat = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        direction: { value: new THREE.Vector2(1, 0) },
        texelSize: { value: new THREE.Vector2(1, 1) }
      },
      vertexShader: vs,
      fragmentShader: [
        "varying vec2 vUv;",
        "uniform sampler2D tDiffuse;",
        "uniform vec2 direction;",
        "uniform vec2 texelSize;",
        "void main() {",
        "  vec2 d = direction * texelSize;",
        "  vec3 c = vec3(0.0);",
        "  c += texture2D(tDiffuse, vUv - 4.0 * d).rgb * 0.05;",
        "  c += texture2D(tDiffuse, vUv - 3.0 * d).rgb * 0.09;",
        "  c += texture2D(tDiffuse, vUv - 2.0 * d).rgb * 0.12;",
        "  c += texture2D(tDiffuse, vUv - 1.0 * d).rgb * 0.15;",
        "  c += texture2D(tDiffuse, vUv             ).rgb * 0.18;",
        "  c += texture2D(tDiffuse, vUv + 1.0 * d).rgb * 0.15;",
        "  c += texture2D(tDiffuse, vUv + 2.0 * d).rgb * 0.12;",
        "  c += texture2D(tDiffuse, vUv + 3.0 * d).rgb * 0.09;",
        "  c += texture2D(tDiffuse, vUv + 4.0 * d).rgb * 0.05;",
        "  gl_FragColor = vec4(c, 1.0);",
        "}"
      ].join("\n"),
      toneMapped: false,
      depthTest: false,
      depthWrite: false
    });

    // Two diagonal streak axes (±45°) — the classic 4-point cross a lens
    // aperture stamps on a specular point source. Exponential tap falloff
    // approximates the sinc² envelope of slit diffraction, and a subtle
    // per-tap cool shift fakes the spectral spread along each spike.
    const starMat = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        texelSize: { value: new THREE.Vector2(1, 1) }
      },
      vertexShader: vs,
      fragmentShader: [
        "varying vec2 vUv;",
        "uniform sampler2D tDiffuse;",
        "uniform vec2 texelSize;",
        "void main() {",
        "  vec2 dirA = normalize(vec2( 1.0, 1.0)) * texelSize * 2.6;",
        "  vec2 dirB = normalize(vec2( 1.0,-1.0)) * texelSize * 2.6;",
        "  vec3 acc = vec3(0.0);",
        "  float wsum = 0.0;",
        "  for (int i = 1; i <= 14; i++) {",
        "    float fi = float(i);",
        "    float w = exp(-fi * 0.32);",
        // Long spikes cool toward blue at their tips (dispersion of the
        // diffraction orders) — multiply the far taps toward steel blue.
        "    vec3 tint = mix(vec3(1.0), vec3(0.82, 0.90, 1.08), fi / 14.0);",
        "    acc += texture2D(tDiffuse, vUv + dirA * fi).rgb * w * tint;",
        "    acc += texture2D(tDiffuse, vUv - dirA * fi).rgb * w * tint;",
        "    acc += texture2D(tDiffuse, vUv + dirB * fi).rgb * w * tint;",
        "    acc += texture2D(tDiffuse, vUv - dirB * fi).rgb * w * tint;",
        "    wsum += 4.0 * w;",
        "  }",
        "  gl_FragColor = vec4(acc / max(wsum, 1e-4) * 1.3, 1.0);",
        "}"
      ].join("\n"),
      toneMapped: false,
      depthTest: false,
      depthWrite: false
    });

    const compositeMat = new THREE.ShaderMaterial({
      uniforms: {
        tScene:        { value: null },
        tBloom0:       { value: null },
        tBloom1:       { value: null },
        tBloom2:       { value: null },
        tStar:         { value: null },
        tDepth:        { value: null },
        bloomStrength: { value: 0.14 },
        starStrength:  { value: 0.3 },
        chromatic:     { value: 0.0009 },
        vignette:      { value: 0.5 },
        grain:         { value: 0.012 },
        // Phase 4 DOF — focal plane sits on the gem. cameraNear/Far feed
        // the linearizer so CoC scales correctly across the actual scene
        // depth range. focusDist/Range are tuned for the 33° telephoto
        // jewelry framing (camera at z=5.75 → gem at z=0 → eye-depth 5.75).
        cameraNear:    { value: 0.1 },
        cameraFar:     { value: 100 },
        focusDist:     { value: 5.75 },
        focusRange:    { value: 0.55 },
        bokehScale:    { value: 0.016 },
        texelSize:     { value: new THREE.Vector2(1 / 1024, 1 / 1024) },
        time:          { value: 0 }
      },
      vertexShader: vs,
      fragmentShader: [
        "varying vec2 vUv;",
        "uniform sampler2D tScene;",
        "uniform sampler2D tBloom0;",
        "uniform sampler2D tBloom1;",
        "uniform sampler2D tBloom2;",
        "uniform sampler2D tStar;",
        "uniform sampler2D tDepth;",
        "uniform float bloomStrength;",
        "uniform float starStrength;",
        "uniform float chromatic;",
        "uniform float vignette;",
        "uniform float grain;",
        "uniform float cameraNear;",
        "uniform float cameraFar;",
        "uniform float focusDist;",
        "uniform float focusRange;",
        "uniform float bokehScale;",
        "uniform vec2  texelSize;",
        "uniform float time;",
        "float rand(vec2 co){ return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453); }",
        // Convert non-linear depth-buffer value (NDC z in [0,1]) back to
        // view-space distance (positive, in scene units). Standard
        // formula for a perspective projection.
        "float linearizeDepth(float d) {",
        "  float z = d * 2.0 - 1.0;",
        "  return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));",
        "}",
        // 13-tap bokeh: 1 center + 6 inner hex ring (0.5 radius) + 6 outer
        // hex ring (1.0 radius). The single-ring 6-tap version produced
        // visible 'ghost copies' of bright sources scattered across the
        // backdrop — at high CoC every dark pixel within reach of the gem
        // would alias to (1/7)·brightness, creating a hexagonal halo of
        // floating sparkles. Two concentric rings smooth this out.
        "const vec2 BOKEH[12] = vec2[12](",
        "  vec2( 0.500,  0.000), vec2( 0.250,  0.433), vec2(-0.250,  0.433),",
        "  vec2(-0.500,  0.000), vec2(-0.250, -0.433), vec2( 0.250, -0.433),",
        "  vec2( 1.000,  0.000), vec2( 0.500,  0.866), vec2(-0.500,  0.866),",
        "  vec2(-1.000,  0.000), vec2(-0.500, -0.866), vec2( 0.500, -0.866)",
        ");",
        "void main() {",
        "  vec2 d = vUv - 0.5;",
        "  float r2 = dot(d, d);",
        "  float ca = chromatic * (1.0 + r2 * 2.5);",
        // CoC: 0 within focus range, ramps to 1.0 over a 2× falloff zone.
        // Sign of (depth - focusDist) intentionally ignored — symmetric
        // blur in front of and behind focal plane.
        "  float depth01 = texture2D(tDepth, vUv).r;",
        "  float dist = linearizeDepth(depth01);",
        "  float coc = clamp((abs(dist - focusDist) - focusRange) / (focusRange * 2.0), 0.0, 1.0);",
        // Hexagonal bokeh sample — sample center + 6 ring taps offset by
        // CoC * bokehScale. When CoC = 0 (in focus), all taps converge at
        // center → pin-sharp. Each tap also gets the chromatic split so
        // bokeh discs retain the rim CA fringe.
        "  vec2 radius = texelSize * (coc * bokehScale * 380.0);",
        "  vec4 sceneSample = texture2D(tScene, vUv);",
        "  vec3 col;",
        "  col.r = texture2D(tScene, vUv - d * ca).r;",
        "  col.g = sceneSample.g;",
        "  col.b = texture2D(tScene, vUv + d * ca).b;",
        // Mix in hexagonal blur when out of focus.
        "  if (coc > 0.01) {",
        "    vec3 blurred = sceneSample.rgb;",
        "    for (int i = 0; i < 12; i++) {",
        "      blurred += texture2D(tScene, vUv + BOKEH[i] * radius).rgb;",
        "    }",
        "    blurred *= (1.0 / 13.0);",
        "    col = mix(col, blurred, coc);",
        "  }",
        "  vec3 b = texture2D(tBloom0, vUv).rgb;",
        "  b += texture2D(tBloom1, vUv).rgb * 0.9;",
        "  b += texture2D(tBloom2, vUv).rgb * 1.0;",
        "  col += b * bloomStrength;",
        "  col += texture2D(tStar, vUv).rgb * starStrength;",
        "  float vig = 1.0 - clamp(r2 * vignette * 2.2, 0.0, 1.0);",
        "  col *= mix(1.0, vig, 0.9);",
        "  col += (rand(vUv * 2048.0 + vec2(time, -time)) - 0.5) * grain;",
        "  gl_FragColor = vec4(col, 1.0);",
        "}"
      ].join("\n"),
      toneMapped: false,
      depthTest: false,
      depthWrite: false,
      transparent: false,
      blending: THREE.NoBlending
    });

    let curW = 0;
    let curH = 0;

    function resizeTo(w, h) {
      if (w === curW && h === curH) return;
      curW = w;
      curH = h;
      sceneRT.setSize(w, h);
      // Keep the DOF composite's texel size in sync with the actual RT
      // resolution so the bokeh radius is resolution-independent.
      compositeMat.uniforms.texelSize.value.set(1 / Math.max(1, w), 1 / Math.max(1, h));
      const sw = Math.max(1, w >> 1);
      const sh = Math.max(1, h >> 1);
      starRT.setSize(sw, sh);
      starMat.uniforms.texelSize.value.set(1 / sw, 1 / sh);
      for (let i = 0; i < 3; i += 1) {
        const mw = Math.max(1, w >> (i + 1));
        const mh = Math.max(1, h >> (i + 1));
        bloomMips[i][0].setSize(mw, mh);
        bloomMips[i][1].setSize(mw, mh);
      }
    }

    function renderFrame(timeMs) {
      // 1. Scene → RT (renderer's AgX tone-mapping + sRGB conversion is
      //    baked into each material's compiled shader; we cannot toggle it
      //    at runtime without forcing a full shader recompile every frame.
      //    So we let the scene render in tonemapped LDR into the RT, then
      //    bloom + composite operate in LDR. Highlights above the bright-
      //    pass threshold (0.72) still bloom convincingly because metal
      //    speculars and gem table flashes reach ~0.9–1.0 after AgX. The
      //    composite material has toneMapped:false to avoid a SECOND
      //    AgX pass (which was making everything 2×-dark).
      renderer.setRenderTarget(sceneRT);
      renderer.clear();
      renderer.render(scene, camera);

      // 2. Bright pass → bloomMips[0][0]
      fsQuad.material = brightMat;
      brightMat.uniforms.tDiffuse.value = sceneRT.texture;
      renderer.setRenderTarget(bloomMips[0][0]);
      renderer.render(fsScene, fsCam);

      // 2b. Starburst streaks from the RAW bright pass (before the blur
      //     pyramid overwrites mip 0). Strength rides the design state:
      //     sparkleBurst pumps the spikes for hero shots; Gallery/Flash
      //     lighting naturally shows stronger lens diffraction.
      fsQuad.material = starMat;
      starMat.uniforms.tDiffuse.value = bloomMips[0][0].texture;
      renderer.setRenderTarget(starRT);
      renderer.render(fsScene, fsCam);
      const starLighting = currentState?.lighting;
      compositeMat.uniforms.starStrength.value =
        (currentState?.sparkleBurst ? 0.55 : 0.3)
        * (starLighting === "Gallery" || starLighting === "Flash" ? 1.2
          : starLighting === "Softbox" ? 0.45 : 1);

      // 3. Build bloom pyramid: blur + downsample chain
      for (let i = 0; i < 3; i += 1) {
        const mw = Math.max(1, curW >> (i + 1));
        const mh = Math.max(1, curH >> (i + 1));
        // Seed mip i (for i>0, downsample previous mip)
        if (i > 0) {
          fsQuad.material = blurMat;
          blurMat.uniforms.tDiffuse.value = bloomMips[i - 1][0].texture;
          blurMat.uniforms.direction.value.set(1, 0);
          blurMat.uniforms.texelSize.value.set(1 / Math.max(1, curW >> i), 1 / Math.max(1, curH >> i));
          renderer.setRenderTarget(bloomMips[i][0]);
          renderer.render(fsScene, fsCam);
        }
        // H blur → [1]
        fsQuad.material = blurMat;
        blurMat.uniforms.tDiffuse.value = bloomMips[i][0].texture;
        blurMat.uniforms.direction.value.set(1, 0);
        blurMat.uniforms.texelSize.value.set(1 / mw, 1 / mh);
        renderer.setRenderTarget(bloomMips[i][1]);
        renderer.render(fsScene, fsCam);
        // V blur → [0]
        blurMat.uniforms.tDiffuse.value = bloomMips[i][1].texture;
        blurMat.uniforms.direction.value.set(0, 1);
        renderer.setRenderTarget(bloomMips[i][0]);
        renderer.render(fsScene, fsCam);
      }

      // 4. Composite to canvas (no additional tonemap — scene RT is
      //    already AgX tonemapped from the scene-render pass).
      fsQuad.material = compositeMat;
      compositeMat.uniforms.tScene.value = sceneRT.texture;
      compositeMat.uniforms.tDepth.value = sceneRT.depthTexture;
      compositeMat.uniforms.cameraNear.value = camera.near;
      compositeMat.uniforms.cameraFar.value = camera.far;
      // Focus distance tracks the camera→origin distance so any view
      // preset (Macro, Top-Down, …) keeps the gem in sharp focus.
      compositeMat.uniforms.focusDist.value = camera.position.length();
      compositeMat.uniforms.tBloom0.value = bloomMips[0][0].texture;
      compositeMat.uniforms.tBloom1.value = bloomMips[1][0].texture;
      compositeMat.uniforms.tBloom2.value = bloomMips[2][0].texture;
      compositeMat.uniforms.tStar.value = starRT.texture;
      compositeMat.uniforms.time.value = timeMs * 0.001;
      renderer.setRenderTarget(null);
      renderer.render(fsScene, fsCam);
    }

    return {
      resize: resizeTo,
      render: renderFrame,
      composite: compositeMat,
      bright: brightMat
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const cap = QUALITY_TIERS[qualityTier].pixelRatioCap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (post) {
      const dpr = renderer.getPixelRatio();
      post.resize(Math.max(2, Math.round(width * dpr)), Math.max(2, Math.round(height * dpr)));
    }
  }

  function applyQualityTier(nextTier) {
    if (nextTier === qualityTier) return;
    qualityTier = nextTier;
    const tier = QUALITY_TIERS[qualityTier];
    reflectionRT.setSize(tier.reflectionSize, tier.reflectionSize);
    resize();
    root.dataset.designerQuality = tier.name;
  }

  // Instantiate the post chain now that scene/camera/renderer/lights exist.
  post = createPostChain();

  // Goldsmith reference colors per metal + karat. These are the linear-sRGB
  // base colors that real jewelers see; they're what drives the *base* color
  // of the metal before any environment reflection / specular tint.
  const METAL_KARAT_COLORS = {
    "Yellow Gold": {
      "10K": 0xd9c071,
      "14K": 0xe2b85a,
      "18K": 0xeab64a,
      "22K": 0xf5c441,
      default: 0xeab64a
    },
    "Rose Gold": {
      "10K": 0xd2a292,
      "14K": 0xcd8c7c,
      "18K": 0xc1786a,
      "22K": 0xba6f5f,
      default: 0xc1786a
    },
    "White Gold": {
      "10K": 0xe6e9ec,
      "14K": 0xeaedf0,
      "18K": 0xeef1f3,
      "22K": 0xf1f4f6,
      default: 0xeef1f3
    },
    "Platinum": {
      "950": 0xe1e6ea,
      default: 0xd6dee2
    },
    // Champagne Gold - pale warm gold, less saturated than yellow gold.
    "Champagne Gold": {
      "10K": 0xe6d0a1,
      "14K": 0xddc18a,
      "18K": 0xd4b574,
      "22K": 0xceac66,
      default: 0xd4b574
    },
    // Black Gold (black rhodium plating over gold) - very dark gunmetal with
    // a faint warm undertone. Keep base color extremely dark so the highly
    // metallic F0 reads as a near-mirror black surface.
    "Black Gold": {
      "10K": 0x2a2622,
      "14K": 0x232020,
      "18K": 0x1d1b1c,
      "22K": 0x171516,
      default: 0x1d1b1c
    },
    // Mirror Silver - hyper-reflective bright argentium / rhodium look
    "Mirror Silver": {
      "950": 0xf2f5f8,
      default: 0xeef2f5
    },
    // Bronze Patina - warm coppery brown with greenish oxidation hint
    "Bronze Patina": {
      "10K": 0x8a6a44,
      "14K": 0x7a5a3a,
      "18K": 0x6e4f30,
      default: 0x7a5a3a
    },
    // Two-Tone Mix - warm/cool blend, body reads as soft champagne so the
    // contrasting sheen tint (when twoTone toggle is on) reads cleanly.
    "Two-Tone Mix": {
      "14K": 0xd6c2a2,
      "18K": 0xd6c2a2,
      default: 0xd6c2a2
    }
  };
  // Specular tint - the color of the reflection highlight. Real gold reflects
  // light back with its own hue (warm), while white gold/platinum reflect
  // nearly pure white.
  const METAL_SPECULAR_TINT = {
    "Yellow Gold": 0xfff0c0,
    "Rose Gold":   0xffd5c4,
    "White Gold":  0xfafcff,
    "Platinum":    0xf4f7fa,
    "Champagne Gold": 0xffe9b8,
    "Black Gold":  0x8a8082,
    "Mirror Silver": 0xffffff,
    "Bronze Patina": 0xffd9a0,
    "Two-Tone Mix": 0xfff0d0
  };
  // Attenuation/rim color for transmissive clearcoat - subtle warming.
  const METAL_SHEEN_TINT = {
    "Yellow Gold": 0xffdf86,
    "Rose Gold":   0xf9b4a0,
    "White Gold":  0xeef4ff,
    "Platinum":    0xe7eef3,
    "Champagne Gold": 0xffd896,
    "Black Gold":  0x6a5f60,
    "Mirror Silver": 0xf0f6ff,
    "Bronze Patina": 0xffc888,
    "Two-Tone Mix": 0xffd9a0
  };

  function metalBaseColor(metal, karat) {
    const table = METAL_KARAT_COLORS[metal] || METAL_KARAT_COLORS["White Gold"];
    return new THREE.Color(table[karat] ?? table.default);
  }

  function materialForMetal(metalOverride = currentState.metal, karatOverride = currentState.karat) {
    const isSatin     = currentState.finish === "Soft Satin";
    const isMilgrain  = currentState.finish === "Milgrain Edge";
    const isPolish    = currentState.finish === "High Polish";
    const isHammered  = currentState.finish === "Hammered";
    const isSandblast = currentState.finish === "Sandblast";
    const isBrushed   = currentState.finish === "Brushed";
    const isStardust  = currentState.finish === "Stardust";
    const metal       = metalOverride || currentState.metal;
    const karat       = karatOverride || currentState.karat;

    // §3 BRDF — Bronze Patina is an oxide/carbonate film (verdigris, brown
    // tarnish), not bare metal. Treating it as metalness = 1 like polished
    // bronze gives an unrealistic mirror sheen the patina layer would have
    // long since killed. We model it as a near-dielectric: low metalness,
    // markedly higher roughness, and a tiny diffuse hue from the underlying
    // copper-tin substrate. This is the single biggest realism win for the
    // patina metal choice — without it the piece reads "freshly polished
    // bronze" instead of "aged antique bronze".
    const isPatina = metal === "Bronze Patina";

    // For polished gold the *body* color is F0. A clearcoat layer (transparent
    // lacquer over the metal) reflects environment light tinted toward WHITE,
    // sitting on top of the gold and visually drowning the F0 hue. Real
    // polished jewelry has no such coating, so clearcoat must be 0. Likewise a
    // dark roughnessMap multiplied with a low base value drives the surface
    // back toward a perfect mirror, also hiding F0. We keep polish uniform.
    const baseRoughnessRaw = isPolish    ? 0.18
      : isMilgrain  ? 0.20
      : isHammered  ? 0.34
      : isSandblast ? 0.68
      : isBrushed   ? 0.32
      : isStardust  ? 0.48
      :               0.38;
    // Patina pushes whichever finish is selected toward matte oxide territory
    // (never below 0.6 roughness, even on "polished" patina — the polishing
    // wheel cannot restore the oxide to a mirror).
    const baseRoughness = isPatina ? Math.max(0.66, baseRoughnessRaw + 0.18) : baseRoughnessRaw;

    // Brushed grain direction (Realism §3): with the band & prong tubes now
    // carrying UVs whose U axis follows the surface flow (band circumference
    // / prong axis), anisotropyRotation = 0 means highlights streak ALONG
    // that flow — the diagnostic mark of a polishing wheel. Small per-metal
    // offsets simulate the slightly different grain angles different alloys
    // hold under polishing.
    const anisoRotation = metal === "Rose Gold"   ?  0.18
      :                   metal === "Yellow Gold" ?  0.08
      :                                             -0.06;

    // Pick a per-finish normal map. Hammered and Sandblast each have their own
    // procedural normal so the surface relief is physically distinct, not just
    // a roughness tweak. High Polish gets a *very* faint brushed normal so
    // reflections aren't a perfect mathematical mirror — real polished gold
    // carries imperceptible polish-wheel marks that scatter light just
    // enough to read as a physical object instead of CGI.
    const finishNormalMap =
      isPolish      ? (runtimeTextures.brushNormal || runtimeTextures.metalNormal)
      : isHammered  ? runtimeTextures.hammeredNormal
      : isSandblast ? runtimeTextures.sandblastNormal
      : isStardust  ? (runtimeTextures.sandblastNormal || runtimeTextures.metalNormal)
      : (runtimeTextures.brushNormal || runtimeTextures.metalNormal);

    const normalAmount =
      isSatin       ? 0.16
      : isMilgrain  ? 0.08
      : isHammered  ? 0.42
      : isSandblast ? 0.20
      : isBrushed   ? 0.24
      : isStardust  ? 0.16
      : isPolish    ? 0.025
      :               0.08;

    return new THREE.MeshPhysicalMaterial({
      color: metalBaseColor(metal, karat),
      // §3 metalness drop on patinated metal — the oxide film is a
      // dielectric, so part of the reflection should follow Schlick on a
      // refractive layer rather than the metallic F0 = color path.
      metalness: isPatina ? 0.45 : 1,
      roughness: baseRoughness,
      // Real polished gold still has micro-roughness variation from the
      // polishing wheel — perfectly uniform roughness reads as CGI plastic.
      // The microRoughness map adds 1–2% surface variation that's invisible
      // up close but breaks the mathematical mirror and gives the metal a
      // "breathing" quality across the band's length.
      roughnessMap: isPolish
        ? (runtimeTextures.microRoughness || null)
        : (runtimeTextures.metalRoughness || null),
      // Keep conductor identity constant. Fingerprints and polishing residue
      // change the surface micro-roughness/coating response; they do not turn
      // patches of gold into a dielectric. The old metalness map produced
      // milky grey islands, so metalness remains uniform across bare alloy.
      metalnessMap: null,
      normalMap: finishNormalMap,
      normalScale: new THREE.Vector2(normalAmount, normalAmount),
      // A trace of anisotropy on polished metal mimics the directional
      // sweep of a jeweller's polishing wheel — with proper UVs now in
      // place on the band & prong tubes this is no longer noise: the
      // highlight elongates along the band's length / prong's axis.
      // §11 anisotropy: patina kills directional polishing-wheel streaks,
      // because the oxide film is randomly textured. Keep a hint on satin
      // finish where the patina has been gently rubbed back, but no more.
      anisotropy: isPatina ? (isBrushed ? 0.14 : 0)
        : isBrushed ? 0.90
        : isSatin ? 0.58
        : isMilgrain ? 0.18
        : isPolish ? 0.12
        : 0,
      anisotropyRotation: anisoRotation,
      // Bare alloy has no lacquer layer. Plating/lacquer belongs in an
      // explicit coating material, not an always-on clearcoat approximation.
      clearcoat: 0,
      clearcoatRoughness: 0,
      // Energy-balanced env reflection. HDR studio is already bright; over 1.0
      // the F0 hue starts to wash out at near-normal viewing angles. The
      // envMul comes from the active lighting mode so bright presets
      // (Flash, Showroom) automatically dial the metal reflection DOWN to
      // keep the karat hue from clipping to white.
      envMapIntensity: (isPolish ? 1.0 : isMilgrain ? 0.9 : isSandblast ? 0.72 : 0.85) * (LIGHTING_MODES[currentState.lighting]?.envMul ?? 1),
      // Subtle satin sheen on satin finish — adds the cloth-like soft rim.
      // For polished warm metals, a faint sheen layer recovers the F90
      // grazing halo (§3). Bronze Patina kills sheen entirely — the oxide
      // layer would absorb any soft rim before it left the surface.
      sheen: isPatina ? 0
        : isSatin ? 0.25
        : (isPolish && /(Yellow|Rose|Champagne|Bronze)/.test(metal)) ? 0.07
        : 0,
      // Two-tone work is represented by separate meshes/material zones in
      // buildRing(), never by a tinted sheen layered over one alloy.
      sheenColor: METAL_SHEEN_TINT[metal] || 0xffffff,
      sheenRoughness: 0.6,
      // §3 F90 grazing halo — Real polished warm gold (yellow/rose/
      // champagne/bronze, when not patinated) shows a soft warm rim glow
      // at grazing angles. This is the Fresnel-conserved energy that the
      // baseline Schlick BRDF under-represents because three.js does not
      // tint F90 separately. A whisper of sheen with the karat-specific
      // METAL_SHEEN_TINT recovers this rim glow without washing out F0
      // (kept ≤0.08 so the body hue still dominates). Two-tone and satin
      // overrides retain priority — they are explicit user choices.
      // Bare jewellery metal has no thin-film rainbow layer. Any real plating
      // or lacquer should be represented as an explicit coating mesh/material.
      iridescence: 0
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

  function materialForStone(sizeScale = 1) {
    const profile = stoneProfile();
    const isDiamond = currentState.stone === "Clear Diamond";
    const isOpaque = currentState.stone === "Black Onyx";
    const isOpal = currentState.stone === "Fire Opal";
    const isAdularescent = !!profile.adularescence;
    const glow = !!(currentState && currentState.emissiveGlow);

    // §3 pleochroic colour change (alexandrite effect). The Cr³⁺ absorption
    // band at ~580 nm transmits both blue-green and red; the illuminant's
    // spectral power distribution decides which dominates. We interpolate
    // between the profile's daylight pole and its `colorChange` incandescent
    // pole on the active lighting mode's CCT:
    //   t = smoothstep(2200 K, 6200 K, CCT)  →  0 = full red, 1 = full green.
    let bodyColor = profile.color;
    let bodyAbsorption = profile.absorption;
    if (profile.colorChange) {
      const cct = LIGHTING_CCT[currentState.lighting] ?? 5200;
      const u = Math.min(1, Math.max(0, (cct - 2200) / (6200 - 2200)));
      const t = u * u * (3 - 2 * u);
      bodyColor = new THREE.Color(profile.colorChange.color).lerp(new THREE.Color(profile.color), t);
      bodyAbsorption = new THREE.Color(profile.colorChange.absorption).lerp(new THREE.Color(profile.absorption), t);
    }

    // Beer-Lambert transport must use the same physical depth as the mesh.
    // The previous profile-only value could be several times larger than the
    // rendered stone, making coloured stones unnaturally opaque. Three.js uses
    // scene units here, so convert the canonical millimetre depth through the
    // shared world scale and then apply the relative melee/side-stone scale.
    const physicalDepth = currentPhysicalSpec?.world?.stoneDepth
      ?? mmToWorld((currentPhysicalSpec?.centerStone?.depthMm) || 4);
    const scaledThickness = Math.max(mmToWorld(0.12), physicalDepth * Math.max(0.08, sizeScale));

    /* Dispersion (Realism §3 / §11):
     * Profile stores PHYSICAL Abbe-equivalent values (diamond 0.044, etc).
     * three.js MeshPhysicalMaterial.dispersion is a perceptual 0..~2
     * strength knob — at 0.044 the chromatic split is invisible. Scale
     * the physical value through the `fire` knob: stones cut for
     * brilliance (high fire) get more visual dispersion than the raw
     * Abbe number alone would give. Capped at 2.0 to stay artist-friendly.
     *
     *   dispersion_three = clamp( physical * fireGain , 0, 2 )
     *   fireGain = 18 + 14·fire    →   diamond 0.044·(18+14·0.82) ≈ 1.3
     *                                  emerald 0.018·(18+14·0.30) ≈ 0.40
     *                                  onyx                       = 0     */
    const fire = profile.fire || 0;
    // Three.js dispersion is a visual strength control, not the physical
    // dispersion coefficient stored in STONE_PROFILES. Keep the conversion
    // restrained: excessive values create permanent rainbow fringes rather
    // than motion-dependent fire.
    const dispersionThree = Math.min(0.85, (profile.dispersion || 0) * 14);

    // Thin-film iridescence is reserved for opal-like/adularescent
    // materials. Diamond fire comes from refractive dispersion through the
    // facet geometry, not an oil-film layer on the surface.
    const iridescenceFromFire = isOpal ? 0.85
      : isAdularescent ? 0.55
      : 0;

    // Keep IBL energy below clipping. Facet topology and refractive transport
    // should create contrast; an over-bright environment makes every facet
    // white and hides the cut.
    const envIntensity = isDiamond ? 1.55 : isOpaque ? 1.10 : 1.30;

    return new THREE.MeshPhysicalMaterial({
      color: bodyColor,
      metalness: isOpaque ? 0.15 : 0,
      roughness: profile.roughness,
      transparent: !isOpaque,
      side: THREE.FrontSide,
      opacity: 1,
      transmission: profile.transmission,
      thickness: scaledThickness,
      ior: profile.ior,
      dispersion: dispersionThree,
      attenuationColor: bodyAbsorption,
      attenuationDistance: profile.attenuationDistance,
      // Emissive glow: stone self-illuminates with its absorption hue.
      // Diamonds get a cooler white glow; coloreds get a saturated glow.
      emissive: glow ? (isDiamond ? new THREE.Color(0xbfd6ff) : new THREE.Color(bodyAbsorption)) : new THREE.Color(0x000000),
      emissiveIntensity: glow ? (isDiamond ? 0.35 : 0.7) : 0,
      specularIntensity: 1,
      specularColor: 0xffffff,
      reflectivity: 1,
      // A cut gemstone is not covered by a clear lacquer layer. Clearcoat
      // creates a second white dielectric reflection and makes diamonds read
      // like coated glass.
      clearcoat: 0,
      clearcoatRoughness: 0,
      envMapIntensity: envIntensity,
      iridescence: iridescenceFromFire,
      iridescenceIOR: isOpal ? 1.45 : isAdularescent ? 1.42 : 1.32,
      ...(isOpal ? { iridescenceThicknessRange: [200, 800] } : {}),
      ...(isAdularescent ? { iridescenceThicknessRange: [420, 1400] } : {}),
      // Moonstone schiller: strong soft bluish sheen floating above the
      // surface — the adularescence glow that defines the stone.
      sheen: isAdularescent ? 0.65 : 0,
      sheenColor: isAdularescent ? 0x9fc4ff : 0xbfd6ff,
      ...(isAdularescent ? { sheenRoughness: 0.4 } : {})
    });
  }

  function weightValue() {
    return Number(currentState.weight) || 1;
  }

  // Certified centre-stone half-width in world units — the single size
  // authority for every non-ring builder (the ring reads the spec via
  // computeRingGeometry). mm is truth; carat only sets mm via density.
  function specStoneHalfWidth() {
    const spec = currentPhysicalSpec || buildJewellerySpec(currentState);
    return spec.world.stoneWidth * 0.5;
  }

  function pieceSpec() {
    return currentPhysicalSpec || buildJewellerySpec(currentState);
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
    // Jewellery meshes are rebuilt per state change. The photographic accent
    // lights live directly under `scene`, so clearing the model cannot delete
    // the lighting rig or accidentally tie its motion to the jewellery.
    for (let i = model.children.length - 1; i >= 0; i -= 1) {
      const child = model.children[i];
      model.remove(child);
      disposeObject(child);
    }
  }

  // ---------------------------------------------------------------------------
  // Real faceted gem geometry. Each shape uses its proper facet topology with
  // flat (per-facet) shading so reflections look like a cut stone rather than
  // a smooth blob. Built non-indexed so computeVertexNormals yields face normals.
  // ---------------------------------------------------------------------------

  function polygonRayOutline(vertices, ux, uy) {
    const len = Math.hypot(ux, uy) || 1;
    const dx = ux / len;
    const dy = uy / len;
    let bestT = Infinity;
    for (let i = 0; i < vertices.length; i += 1) {
      const a = vertices[i];
      const b = vertices[(i + 1) % vertices.length];
      const ex = b[0] - a[0];
      const ey = b[1] - a[1];
      const det = dx * (-ey) - dy * (-ex);
      if (Math.abs(det) < 1e-8) continue;
      const t = (a[0] * (-ey) - a[1] * (-ex)) / det;
      const u = (dx * a[1] - dy * a[0]) / det;
      if (t > 0 && u >= -1e-6 && u <= 1 + 1e-6) bestT = Math.min(bestT, t);
    }
    return Number.isFinite(bestT) ? [dx * bestT, dy * bestT] : [ux, uy];
  }

  function shapeOutline(shape, ux, uy) {
    switch (shape) {
      case "Oval":
        return [ux * 0.78, uy * 1.18];
      case "Cushion": {
        const k = 0.86 + Math.max(Math.abs(ux), Math.abs(uy)) * 0.22;
        return [ux * k, uy * k];
      }
      case "Pear": {
        const taper = uy > 0 ? 1 - uy * 0.46 : 1 + Math.abs(uy) * 0.06;
        return [ux * 0.8 * taper, (uy > 0 ? uy * 1.32 : uy * 0.84) - 0.08];
      }
      case "Marquise": {
        const point = 1 - Math.abs(ux) * 0.46;
        return [ux * 0.58, uy * 1.42 * point];
      }
      case "Heart": {
        if (uy > 0.55) {
          const t = (uy - 0.55) / 0.45;
          return [ux * (1 - t * 0.55) * 1.02, uy * 1.04 - t * 0.42 * Math.abs(uy)];
        }
        return [ux * 1.04, uy * 1.04];
      }
      case "Trillion":
        return polygonRayOutline([[0, 1.05], [-0.94, -0.60], [0.94, -0.60]], ux, uy);
      case "Hexagon":
        return polygonRayOutline([[0, 1], [-0.86, 0.5], [-0.86, -0.5], [0, -1], [0.86, -0.5], [0.86, 0.5]], ux, uy);
      case "Kite":
        return polygonRayOutline([[0, 1.22], [-0.68, 0.02], [0, -0.88], [0.68, 0.02]], ux, uy);
      case "Baguette":
        return polygonRayOutline([[-0.48, 1.25], [-0.48, -1.25], [0.48, -1.25], [0.48, 1.25]], ux, uy);
      default:
        return [ux, uy];
    }
  }
  function outlineAt(shape, angle, radiusScale) {
    const [ux, uy] = shapeOutline(shape, Math.cos(angle), Math.sin(angle));
    return [ux * radiusScale, uy * radiusScale];
  }

  const shapeExtentCache = new Map();
  function shapeUnitExtents(shape) {
    if (shapeExtentCache.has(shape)) return shapeExtentCache.get(shape);
    let maxX = 1e-6;
    let maxY = 1e-6;
    for (let i = 0; i < 720; i += 1) {
      const a = (i / 720) * Math.PI * 2;
      const [x, y] = shapeOutline(shape, Math.cos(a), Math.sin(a));
      maxX = Math.max(maxX, Math.abs(x));
      maxY = Math.max(maxY, Math.abs(y));
    }
    const value = { maxX, maxY };
    shapeExtentCache.set(shape, value);
    return value;
  }

  function physicalOutlinePoint(shape, halfW, halfH, angle, rotation = 0) {
    const [ux, uy] = shapeOutline(shape, Math.cos(angle), Math.sin(angle));
    const ext = shapeUnitExtents(shape);
    const x = (ux / ext.maxX) * halfW;
    const y = (uy / ext.maxY) * halfH;
    const cs = Math.cos(rotation);
    const sn = Math.sin(rotation);
    return new THREE.Vector2(x * cs - y * sn, x * sn + y * cs);
  }

  function samplePhysicalOutlineByArcLength(shape, halfW, halfH, count, rotation = 0) {
    const denseCount = Math.max(256, count * 32);
    const dense = [];
    const cumulative = [0];
    for (let i = 0; i <= denseCount; i += 1) {
      const a = (i / denseCount) * Math.PI * 2;
      dense.push(physicalOutlinePoint(shape, halfW, halfH, a, rotation));
      if (i > 0) cumulative.push(cumulative[i - 1] + dense[i].distanceTo(dense[i - 1]));
    }
    const perimeter = cumulative[cumulative.length - 1];
    const result = [];
    let cursor = 1;
    for (let i = 0; i < count; i += 1) {
      const target = (i / count) * perimeter;
      while (cursor < cumulative.length - 1 && cumulative[cursor] < target) cursor += 1;
      const a = dense[cursor - 1];
      const b = dense[cursor];
      const span = Math.max(1e-8, cumulative[cursor] - cumulative[cursor - 1]);
      const t = (target - cumulative[cursor - 1]) / span;
      const point = a.clone().lerp(b, t);
      const before = dense[Math.max(0, cursor - 2)];
      const after = dense[Math.min(dense.length - 1, cursor + 1)];
      const tangent = after.clone().sub(before).normalize();
      result.push({
        x: point.x,
        y: point.y,
        tangentAngle: Math.atan2(tangent.y, tangent.x)
      });
    }
    return result;
  }

  function makePhysicalOutlineRail(points, z, tubeRadius, material) {
    const curvePoints = points.map((p) => new THREE.Vector3(p.x, p.y, z));
    const curve = new THREE.CatmullRomCurve3(curvePoints, true, "centripetal", 0.5);
    const rail = new THREE.Mesh(
      new THREE.TubeGeometry(curve, Math.max(96, points.length * 4), tubeRadius, 12, true),
      material
    );
    rail.castShadow = true;
    return rail;
  }

  function stoneDepthMetrics(size, shape = currentState.shape) {
    const cut = currentPhysicalSpec?.centerStone || buildJewellerySpec(currentState).centerStone;
    const tableScale = clamp((cut.tablePct || 57) / 100, 0.25, 0.88);
    const girdleHalf = size * clamp((cut.girdlePct || 3.5) / 100, 0.005, 0.12);
    const crownAngle = THREE.MathUtils.degToRad(clamp(cut.crownAngleDeg || 34.5, 0.5, 60));
    const pavilionAngle = THREE.MathUtils.degToRad(clamp(cut.pavilionAngleDeg || 40.8, 0.5, 60));

    const planRadius = (shape === "Emerald" || shape === "Asscher" || shape === "Baguette" || shape === "Princess")
      ? size * 0.78
      : size;
    const crownRun = Math.max(size * 0.06, planRadius * (1 - tableScale));
    const culetRadius = planRadius * clamp((cut.culetPct || 0) / 100, 0, 0.20);
    const pavilionRun = Math.max(planRadius * 0.25, planRadius - culetRadius);
    const crownH = girdleHalf + Math.max(size * 0.035, crownRun * Math.tan(crownAngle));
    const pavilionH = girdleHalf + Math.max(size * 0.22, pavilionRun * Math.tan(pavilionAngle));

    return {
      crownH,
      pavilionH,
      tableScale,
      girdleScale: 0.985,
      girdleHalf
    };
  }

  function rectangularRayRadius(halfX, halfY, angle) {
    const c = Math.abs(Math.cos(angle));
    const s = Math.abs(Math.sin(angle));
    const xLimit = c > 1e-5 ? halfX / c : Infinity;
    const yLimit = s > 1e-5 ? halfY / s : Infinity;
    return Math.min(xLimit, yLimit);
  }

  function stonePlanEnvelopeRadius(shape, angle, size, scale = 1) {
    if (shape === "Emerald") {
      return rectangularRayRadius(size * 0.74 * scale, size * 1.16 * scale, angle);
    }
    if (shape === "Baguette") {
      return rectangularRayRadius(size * 0.48 * scale, size * 1.25 * scale, angle);
    }
    if (shape === "Asscher") {
      return rectangularRayRadius(size * 0.78 * scale, size * 0.78 * scale, angle);
    }
    if (shape === "Princess") {
      return rectangularRayRadius(size * 0.78 * scale, size * 0.78 * scale, angle);
    }
    const [x, y] = outlineAt(shape, angle, size * scale);
    return Math.hypot(x, y);
  }

  function stonePlanExtentY(shape, size, direction = 1, scale = 1) {
    const sign = direction >= 0 ? 1 : -1;
    if (shape === "Emerald") return sign * size * 1.16 * scale;
    if (shape === "Baguette") return sign * size * 1.25 * scale;
    if (shape === "Asscher" || shape === "Princess") return sign * size * 0.78 * scale;
    const [, y] = outlineAt(shape, sign > 0 ? Math.PI / 2 : -Math.PI / 2, size * scale);
    return y;
  }

  function stoneEnvelopeScaleAtZ(size, shape, localZ) {
    const metrics = stoneDepthMetrics(size, shape);
    if (localZ >= 0) {
      const t = THREE.MathUtils.clamp(localZ / Math.max(metrics.crownH, 1e-5), 0, 1);
      return metrics.girdleScale + (metrics.tableScale - metrics.girdleScale) * t;
    }
    const t = THREE.MathUtils.clamp((-localZ) / Math.max(metrics.pavilionH, 1e-5), 0, 1);
    // Conservative pavilion envelope: slightly larger than the actual lower
    // facets, so metal guards stay outside the stone instead of relying on
    // visual overlap to suggest contact.
    return Math.max(0.12, metrics.girdleScale * (1 - t * 0.62));
  }

  function safeSettingRadiusAtZ(angle, z, opts = {}) {
    const {
      stoneSize,
      stoneZ,
      shape = currentState.shape,
      scaleY = 1,
      tubeRadius = 0,
      margin = 0.002,
      physicalHalfWidth = 0,
      physicalCrownH = 0,
      physicalPavilionH = 0
    } = opts;
    if (!Number.isFinite(stoneZ)) return 0;
    const localZ = z - stoneZ;
    if (physicalHalfWidth > 0) {
      let envelopeScale = 1;
      if (localZ >= 0 && physicalCrownH > 0) {
        const t = THREE.MathUtils.clamp(localZ / physicalCrownH, 0, 1);
        envelopeScale = 1 + (stoneDepthMetrics(1, shape).tableScale - 1) * t;
      } else if (localZ < 0 && physicalPavilionH > 0) {
        const t = THREE.MathUtils.clamp(-localZ / physicalPavilionH, 0, 1);
        envelopeScale = Math.max(0.12, 1 - t * 0.72);
      }
      return physicalHalfWidth * envelopeScale + tubeRadius + margin;
    }
    if (!stoneSize) return 0;
    const envelopeScale = stoneEnvelopeScaleAtZ(stoneSize, shape, localZ);
    const geometricAngle = Math.atan2(Math.sin(angle) * scaleY, Math.cos(angle));
    const envelopeR = stonePlanEnvelopeRadius(shape, geometricAngle, stoneSize, envelopeScale);
    const rayScale = Math.max(0.001, Math.hypot(Math.cos(angle), Math.sin(angle) * scaleY));
    return envelopeR / rayScale + tubeRadius + margin;
  }

  function vec(x, y, z) {
    return new THREE.Vector3(x, y, z);
  }

  function pushTri(arr, a, b, c) {
    arr.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  }
  function pushQuad(arr, a, b, c, d) {
    pushTri(arr, a, b, c);
    pushTri(arr, a, c, d);
  }

  // Build a box with all 12 edges chamfered. Real machined / cast metal
  // never has perfectly sharp 90° edges — a small bevel catches a thin
  // highlight that's the difference between "object" and "render".
  function makeChamferedBox(w, h, d, chamfer) {
    const ch = Math.min(chamfer ?? Math.min(w, h, d) * 0.12, w * 0.45, h * 0.45, d * 0.45);
    const rx = w / 2 - ch;
    const ry = h / 2 - ch;
    const shape = new THREE.Shape();
    shape.moveTo(-rx, -h / 2);
    shape.lineTo(rx, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -ry);
    shape.lineTo(w / 2, ry);
    shape.quadraticCurveTo(w / 2, h / 2, rx, h / 2);
    shape.lineTo(-rx, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, ry);
    shape.lineTo(-w / 2, -ry);
    shape.quadraticCurveTo(-w / 2, -h / 2, -rx, -h / 2);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(0.0001, d - ch * 2),
      bevelEnabled: true,
      bevelThickness: ch,
      bevelSize: ch,
      bevelSegments: 3,
      curveSegments: 4,
      steps: 1
    });
    geo.translate(0, 0, -(d - ch * 2) / 2);
    geo.computeVertexNormals();
    return geo;
  }

  function finishGeometry(positions) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.computeVertexNormals();
    return geometry;
  }

  // Deterministic per-vertex micro-jitter. Real hand-cut diamonds are
  // never mathematically symmetric to micron precision — each facet sits
  // at a slightly different angle. Sub-percent positional jitter perturbs
  // facet normals by ~0.3–0.8°, the same human-cutter variance that
  // distinguishes a real polished stone from a CGI one. Because each vertex
  // object is referenced across multiple triangles, jittering in place
  // keeps the gem watertight (no facet cracks).
  function jitterStoneVerts(arrays, amp, seedStart = 1) {
    // Precision-cut stones stay mathematically planar and symmetric. The old
    // unconditional XYZ jitter warped tables and generated unstable facet
    // normals. Antique mode retains a deliberately tiny, deterministic cutter
    // variance; modern stones receive no geometry displacement.
    if (currentState.symmetryMode !== "Antique") return;
    amp *= 0.35;
    let seed = seedStart;
    for (const arr of arrays) {
      for (const v of arr) {
        const h1 = Math.sin(seed * 12.9898) * 43758.5453;
        const h2 = Math.sin(seed * 78.233 + 4.1) * 43758.5453;
        const h3 = Math.sin(seed * 39.346 + 7.9) * 43758.5453;
        v.x += ((h1 - Math.floor(h1)) * 2 - 1) * amp;
        v.y += ((h2 - Math.floor(h2)) * 2 - 1) * amp;
        v.z += ((h3 - Math.floor(h3)) * 2 - 1) * amp;
        seed += 1;
      }
    }
  }

  // 57-facet round-brilliant topology mapped through a shape outline.
  // Used for Round, Oval, Cushion, Pear, Marquise, Heart.
  function createBrilliantGeometry(size, shape) {
    const N = shape === "Trillion" ? 3
      : shape === "Kite" ? 4
      : shape === "Hexagon" ? 6
      : 8;
    // -----------------------------------------------------------------
    // TOLKOWSKY IDEAL-CUT PROPORTIONS
    //   (`size` is the gem's half-diameter, so full girdle diameter
    //    = 2 * size. Reference proportions are taken as fractions of the
    //    full girdle diameter and then doubled below because everything
    //    in this geometry is expressed in half-diameter units.)
    //
    //   Table diameter ............. 53.0% of girdle (→ tableScale 0.53)
    //   Star length ................ 50.0% of crown radius (starScale 0.50)
    //   Crown height ............... 16.2% of girdle (→ tableZ +0.324·size)
    //   Pavilion depth ............. 43.1% of girdle (→ culetZ −0.862·size)
    //   Lower-girdle length ........ 77% of pavilion main (pmScale 0.46)
    //   Girdle thickness (medium) .. 3.5% of girdle (→ girdleH 0.035·size)
    //
    // The OLD geometry used crownH 0.38 + pavZ −0.32 — squat and lens-
    // shaped, with a crown taller than the pavilion. Real brilliants are
    // the opposite: a tall steep pavilion and a relatively short crown.
    // Tolkowsky proportions are why ideal-cut rounds have the legendary
    // "hearts and arrows" optical pattern. Wide-field IBL with our HDR
    // probe will now bounce light through the gem the way a cutter
    // designed it to.
    // -----------------------------------------------------------------
    const cut = currentPhysicalSpec?.centerStone || buildJewellerySpec(currentState).centerStone;
    const tableScale = clamp((cut.tablePct || 57) / 100, 0.25, 0.85);
    const starScale = tableScale + (1 - tableScale) * (shape === "Marquise" ? 0.42 : 0.50);
    const ugScale = 0.985;
    const gmScale = 0.985;
    const pmScale = shape === "Marquise" ? 0.50 : 0.46;
    const culetOffset = shape === "Pear" ? -size * 0.05 : 0;

    // Cut-certificate parameters now drive the actual facet planes. Crown and
    // pavilion heights are solved from their angles and radial runs, while the
    // final L×W×D scaling preserves the certified overall dimensions.
    const girdleH = size * clamp((cut.girdlePct || 3.5) / 100, 0.005, 0.12);
    const crownAngle = THREE.MathUtils.degToRad(clamp(cut.crownAngleDeg || 34.5, 0.5, 60));
    const pavilionAngle = THREE.MathUtils.degToRad(clamp(cut.pavilionAngleDeg || 40.8, 0.5, 60));
    const crownRun = size * (1 - tableScale);
    const crownHeight = Math.max(size * 0.04, crownRun * Math.tan(crownAngle));
    const requestedCuletRadius = size * clamp((cut.culetPct || 0) / 100, 0, 0.20);
    const pavilionRun = Math.max(size * 0.25, size - requestedCuletRadius);
    const pavilionDepth = Math.max(size * 0.22, pavilionRun * Math.tan(pavilionAngle));
    const tableZ = girdleH + crownHeight;
    const starZ = girdleH + crownHeight * 0.72;
    const girdleUpperZ = girdleH;
    const girdleLowerZ = -girdleH;
    const pavZ = -girdleH - pavilionDepth * 0.62;
    const culetZ = -girdleH - pavilionDepth;

    const T = [], UG = [], S = [], GM = [], PM = [];
    for (let i = 0; i < N; i += 1) {
      const a = (i / N) * Math.PI * 2;
      const am = ((i + 0.5) / N) * Math.PI * 2;
      const [tx, ty] = outlineAt(shape, a, size * tableScale);
      const [ux, uy] = outlineAt(shape, a, size * ugScale);
      const [sx, sy] = outlineAt(shape, am, size * starScale);
      const [gx, gy] = outlineAt(shape, am, size * gmScale);
      const [px, py] = outlineAt(shape, am, size * pmScale);
      T.push(vec(tx, ty, tableZ));
      UG.push(vec(ux, uy, girdleUpperZ));
      S.push(vec(sx, sy, starZ));
      GM.push(vec(gx, gy, girdleLowerZ));
      PM.push(vec(px, py, pavZ));
    }
    const tableCenter = vec(0, culetOffset * 0.4, tableZ);
    const culet = vec(0, culetOffset, culetZ);

    // Tiny culet facet: real round brilliants almost always have a small
    // octagonal culet facet rather than a mathematically perfect point.
    // Without it, the bottom apex is a sharp singular vertex that catches
    // light as a tiny CGI "hot spot." We replace the single point with a
    // small N-gon at the same Z (one vertex per pavilion main, at the
    // SAME angle as the main so each pavilion main terminates cleanly at
    // its own culet-facet edge).
    const culetFacetR = Math.max(size * 0.002, requestedCuletRadius);
    const CF = [];
    for (let i = 0; i < N; i += 1) {
      const a = (i / N) * Math.PI * 2;
      CF.push(vec(Math.cos(a) * culetFacetR, culetOffset + Math.sin(a) * culetFacetR, culetZ));
    }

    // Micro-jitter every conceptual vertex. Real hand-cut diamonds are
    // never 8-fold symmetric to micron precision — each facet sits at a
    // slightly different angle. Sub-percent positional jitter (~0.25% of
    // half-diameter) tilts each face plane by ~0.3–0.8° which is exactly
    // the human-cutter variance that distinguishes a real stone from a
    // computer-generated one. Because each vertex object is referenced
    // across multiple triangles, jittering in place keeps the gem
    // watertight (no cracks between facets).
    jitterStoneVerts([T, UG, S, GM, PM, CF], size * 0.0025);

    const positions = [];
    // Table (n triangles fanned from center) - flat single normal across whole table after computeVertexNormals because they share the same plane.
    for (let i = 0; i < N; i += 1) {
      pushTri(positions, tableCenter, T[i], T[(i + 1) % N]);
    }
    // Star facets - flat triangles between table edge and crown ridge.
    for (let i = 0; i < N; i += 1) {
      pushTri(positions, T[i], S[i], T[(i + 1) % N]);
    }
    // Bezel kites - one per main, sides meet star tips.
    for (let i = 0; i < N; i += 1) {
      pushQuad(positions, T[i], S[(i + N - 1) % N], UG[i], S[i]);
    }
    // Upper girdle facets - 2 triangles per main between bezel apex and star tip.
    for (let i = 0; i < N; i += 1) {
      pushTri(positions, S[i], UG[i], GM[i]);
      pushTri(positions, S[i], GM[i], UG[(i + 1) % N]);
    }
    // Lower girdle facets - 2 triangles per main between girdle and pavilion mid.
    for (let i = 0; i < N; i += 1) {
      pushTri(positions, UG[i], PM[(i + N - 1) % N], GM[(i + N - 1) % N]);
      pushTri(positions, UG[i], PM[i], GM[i]);
    }
    // Pavilion main facets - kites from girdle main through pavilion mids
    // to the culet-facet edge. CF[i] sits directly under UG[i] (same main
    // angle), so each pavilion main is a clean trapezoid.
    for (let i = 0; i < N; i += 1) {
      pushQuad(positions, UG[i], PM[i], CF[i], PM[(i + N - 1) % N]);
    }
    // Culet facet itself (small N-gon centred on the culet point).
    for (let i = 0; i < N; i += 1) {
      pushTri(positions, culet, CF[(i + 1) % N], CF[i]);
    }
    return finishGeometry(positions);
  }

  // Step-cut emerald / asscher.
  function createStepCutGeometry(size, shape) {
    const isSquare = shape === "Asscher";
    const isBaguette = shape === "Baguette";
    const cut = currentPhysicalSpec?.centerStone || buildJewellerySpec(currentState).centerStone;
    const halfX = size * (isSquare ? 0.78 : isBaguette ? 0.48 : 0.74);
    const halfY = size * (isSquare ? 0.78 : isBaguette ? 1.25 : 1.16);
    const corner = size * (isBaguette ? 0.08 : 0.18);
    const tableScale = clamp((cut.tablePct || 66) / 100, 0.35, 0.88);
    const girdleH = size * clamp((cut.girdlePct || 4) / 100, 0.005, 0.12);
    const crownAngle = THREE.MathUtils.degToRad(clamp(cut.crownAngleDeg || 11, 0.5, 60));
    const pavilionAngle = THREE.MathUtils.degToRad(clamp(cut.pavilionAngleDeg || 43, 0.5, 60));
    const crownHeight = Math.max(size * 0.035, size * (1 - tableScale) * Math.tan(crownAngle));
    const pavilionDepth = Math.max(size * 0.30, size * Math.tan(pavilionAngle));
    const tableZ = girdleH + crownHeight;
    const girdleZ = 0;
    const pavZ = -girdleH - pavilionDepth;

    // 8-vertex outline (rectangle with chamfered corners).
    function outlineRect(scaleXY, z) {
      const sx = halfX * scaleXY;
      const sy = halfY * scaleXY;
      const cx = corner * scaleXY;
      const cy = corner * scaleXY;
      return [
        vec( sx - cx,  sy, z),
        vec(-sx + cx,  sy, z),
        vec(-sx,  sy - cy, z),
        vec(-sx, -sy + cy, z),
        vec(-sx + cx, -sy, z),
        vec( sx - cx, -sy, z),
        vec( sx, -sy + cy, z),
        vec( sx,  sy - cy, z)
      ];
    }
    const positions = [];
    // Real emerald/asscher cuts have THREE concentric crown steps (table
    // edge → step 1 → step 2 → girdle). The old geometry only had two
    // steps, which read as a chunky bevel rather than the signature
    // stair-step crown that gives these cuts their hall-of-mirrors
    // optical effect. Adding the third tier brings the crown count up
    // to the canonical 1 + 8 + 8 + 8 = 25 facets.
    const rings = [
      outlineRect(tableScale, tableZ),
      outlineRect(tableScale + (1 - tableScale) * 0.30, girdleH + crownHeight * 0.68),
      outlineRect(tableScale + (1 - tableScale) * 0.62, girdleH + crownHeight * 0.34),
      outlineRect(1, girdleZ)
    ];
    // Pavilion: THREE step rings then converge to a keel line / culet.
    // Real emerald-cut pavilions are deeper than the crown and stepped
    // in 3 rings — the same hall-of-mirrors effect, but inverted, that
    // returns light up through the table.
    const pavRings = [
      outlineRect(0.88, -girdleH - pavilionDepth * 0.24),
      outlineRect(0.66, -girdleH - pavilionDepth * 0.52),
      outlineRect(0.36, -girdleH - pavilionDepth * 0.78)
    ];
    // Sub-percent vertex jitter so the step facets don't sit at
    // mathematically perfect right angles — real lapidary work is
    // never that clean.
    jitterStoneVerts([...rings, ...pavRings], size * 0.0022);
    // Table fan from center.
    const tc = vec(0, 0, tableZ);
    for (let i = 0; i < 8; i += 1) pushTri(positions, tc, rings[0][i], rings[0][(i + 1) % 8]);
    // Crown steps (band of quads between adjacent rings).
    for (let r = 0; r < rings.length - 1; r += 1) {
      const a = rings[r], b = rings[r + 1];
      for (let i = 0; i < 8; i += 1) {
        pushQuad(positions, a[i], b[i], b[(i + 1) % 8], a[(i + 1) % 8]);
      }
    }
    // Pavilion: two step rings then converge to a keel line (or culet point for square).
    const girdle = rings[rings.length - 1];
    const ringsDown = [girdle, ...pavRings];
    for (let r = 0; r < ringsDown.length - 1; r += 1) {
      const a = ringsDown[r], b = ringsDown[r + 1];
      for (let i = 0; i < 8; i += 1) {
        pushQuad(positions, a[i], b[i], b[(i + 1) % 8], a[(i + 1) % 8]);
      }
    }
    // Final pavilion converges. Emerald: a horizontal keel line (two points along x). Asscher: point.
    if (isSquare) {
      const culet = vec(0, 0, pavZ);
      const inner = pavRings[pavRings.length - 1];
      for (let i = 0; i < 8; i += 1) pushTri(positions, inner[i], inner[(i + 1) % 8], culet);
    } else {
      const keelA = vec(-size * 0.18, 0, pavZ);
      const keelB = vec( size * 0.18, 0, pavZ);
      const inner = pavRings[pavRings.length - 1];
      // Connect each inner ring vertex to nearest keel point.
      for (let i = 0; i < 8; i += 1) {
        const v0 = inner[i];
        const v1 = inner[(i + 1) % 8];
        const k0 = v0.x < 0 ? keelA : keelB;
        const k1 = v1.x < 0 ? keelA : keelB;
        if (k0 === k1) {
          pushTri(positions, v0, v1, k0);
        } else {
          // straddling - add bridge triangle
          pushTri(positions, v0, v1, k0);
          pushTri(positions, v1, k1, k0);
        }
      }
    }
    return finishGeometry(positions);
  }

  // Princess: square modified-brilliant. Real french-cut princess has a
  // TWO-TIER chevron pavilion (the signature "X" you see on the bottom of
  // a princess diamond when held to light). The old single-tier pavilion
  // was a 21-facet approximation; the new layout uses two chevron rings
  // bringing the count to ~37 facets — closer to the 49-facet french-cut
  // reference and producing the broken-light pattern that distinguishes
  // a real princess from a CGI inverted pyramid.
  function createPrincessGeometry(size) {
    const cut = currentPhysicalSpec?.centerStone || buildJewellerySpec(currentState).centerStone;
    const half = size * 0.78;
    const tableScale = clamp((cut.tablePct || 70) / 100, 0.40, 0.88);
    const tableHalf = half * tableScale;
    const girdleH = size * clamp((cut.girdlePct || 3.5) / 100, 0.005, 0.12);
    const crownAngle = THREE.MathUtils.degToRad(clamp(cut.crownAngleDeg || 35, 0.5, 60));
    const pavilionAngle = THREE.MathUtils.degToRad(clamp(cut.pavilionAngleDeg || 40.5, 0.5, 60));
    const tableZ = girdleH + Math.max(size * 0.04, (half - tableHalf) * Math.tan(crownAngle));
    const girdleZ = 0;
    const culetZ = -girdleH - Math.max(size * 0.30, half * Math.tan(pavilionAngle));
    const T = [
      vec( tableHalf,  tableHalf, tableZ),
      vec(-tableHalf,  tableHalf, tableZ),
      vec(-tableHalf, -tableHalf, tableZ),
      vec( tableHalf, -tableHalf, tableZ)
    ];
    const G = [
      vec( half,  half, girdleZ),
      vec(-half,  half, girdleZ),
      vec(-half, -half, girdleZ),
      vec( half, -half, girdleZ)
    ];
    // Mid-edge girdle helpers (chevron upper tier joint).
    const Gm = [
      vec(0, half, girdleZ),
      vec(-half, 0, girdleZ),
      vec(0, -half, girdleZ),
      vec(half, 0, girdleZ)
    ];
    const culet = vec(0, 0, culetZ);

    // Chevron tier 1: corner-line helpers ~40% down the pavilion.
    const Pm = [
      vec( half * 0.42,  half * 0.42, culetZ * 0.40),
      vec(-half * 0.42,  half * 0.42, culetZ * 0.40),
      vec(-half * 0.42, -half * 0.42, culetZ * 0.40),
      vec( half * 0.42, -half * 0.42, culetZ * 0.40)
    ];
    // Mid-side helpers between tier 1 and tier 2 (the chevron "elbow").
    const Gm2 = [
      vec(0,  half * 0.46, culetZ * 0.55),
      vec(-half * 0.46, 0, culetZ * 0.55),
      vec(0, -half * 0.46, culetZ * 0.55),
      vec( half * 0.46, 0, culetZ * 0.55)
    ];
    // Chevron tier 2: corner-line helpers ~75% down the pavilion.
    const Pm2 = [
      vec( half * 0.18,  half * 0.18, culetZ * 0.75),
      vec(-half * 0.18,  half * 0.18, culetZ * 0.75),
      vec(-half * 0.18, -half * 0.18, culetZ * 0.75),
      vec( half * 0.18, -half * 0.18, culetZ * 0.75)
    ];

    // Sub-percent jitter on every conceptual vertex so the four-fold
    // princess symmetry isn't mathematically perfect — real princess
    // cuts have ~0.3–0.5° facet-angle variance from the cutter.
    jitterStoneVerts([T, G, Gm, Pm, Gm2, Pm2, [culet]], size * 0.0025);

    const positions = [];
    // Table - 2 triangles.
    pushQuad(positions, T[0], T[1], T[2], T[3]);
    // Crown bevels - 4 trapezoid quads.
    for (let i = 0; i < 4; i += 1) {
      pushQuad(positions, T[i], T[(i + 1) % 4], G[(i + 1) % 4], G[i]);
    }
    // Pavilion — tier 1 chevron (between girdle line and Pm/Gm2 line).
    // Each side contributes 4 triangular facets that form the upper half
    // of the chevron "V" pattern.
    for (let i = 0; i < 4; i += 1) {
      const iNext = (i + 1) % 4;
      // Tier 1 upper-left and upper-right (girdle corner → Pm → mid-edge)
      pushTri(positions, G[i],   Pm[i],     Gm[i]);
      pushTri(positions, Gm[i],  Pm[iNext], G[iNext]);
      // Tier 1 lower-left and lower-right (Pm → Gm2 → mid-edge)
      pushTri(positions, Pm[i],  Gm2[i],    Gm[i]);
      pushTri(positions, Gm[i],  Gm2[i],    Pm[iNext]);
    }
    // Pavilion — tier 2 chevron (Pm/Gm2 line → Pm2/culet).
    for (let i = 0; i < 4; i += 1) {
      const iNext = (i + 1) % 4;
      // Tier 2 upper-left and upper-right
      pushTri(positions, Pm[i],  Pm2[i],    Gm2[i]);
      pushTri(positions, Gm2[i], Pm2[iNext], Pm[iNext]);
      // Tier 2 lower-left and lower-right (terminate at culet point)
      pushTri(positions, Pm2[i],  culet,    Gm2[i]);
      pushTri(positions, Gm2[i],  culet,    Pm2[iNext]);
    }
    return finishGeometry(positions);
  }

  function createCutStoneGeometry(size, shape = currentState.shape) {
    switch (shape) {
      case "Emerald":
      case "Asscher":
      case "Baguette":
        return createStepCutGeometry(size, shape);
      case "Princess":
        return createPrincessGeometry(size);
      default:
        return createBrilliantGeometry(size, shape);
    }
  }

  function createPhysicalCutStoneGeometry(stoneSpec, shape = currentState.shape) {
    // Build topology at a neutral size, then scale its complete bounding box
    // to the certified L × W × D dimensions. This makes carat independent
    // from ring size and allows a lab-report dimension override without
    // rewriting every topology generator.
    const geometry = createCutStoneGeometry(1, shape);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    const sourceX = Math.max(1e-6, box.max.x - box.min.x);
    const sourceY = Math.max(1e-6, box.max.y - box.min.y);
    const sourceZ = Math.max(1e-6, box.max.z - box.min.z);
    const targetX = mmToWorld(stoneSpec.widthMm);
    const targetY = mmToWorld(stoneSpec.lengthMm);
    const targetZ = mmToWorld(stoneSpec.depthMm);
    geometry.scale(targetX / sourceX, targetY / sourceY, targetZ / sourceZ);
    geometry.computeBoundingBox();
    geometry.computeVertexNormals();
    geometry.userData = {
      units: "mm",
      dimensionsMm: {
        length: stoneSpec.lengthMm,
        width: stoneSpec.widthMm,
        depth: stoneSpec.depthMm
      },
      cut: {
        tablePct: stoneSpec.tablePct,
        totalDepthPct: stoneSpec.totalDepthPct,
        crownAngleDeg: stoneSpec.crownAngleDeg,
        pavilionAngleDeg: stoneSpec.pavilionAngleDeg,
        girdlePct: stoneSpec.girdlePct,
        culetPct: stoneSpec.culetPct
      },
      shape
    };
    return geometry;
  }

  // Real-time contact approximation for the metal seat immediately beneath a
  // set stone. This is intentionally restrained: the previous near-black AO,
  // painted head shadow and painted prong dots baked camera-dependent optical
  // effects into the object and made it look like CGI. Only a soft seat-darkening
  // annulus remains until the hero renderer supplies true global illumination.
  function contactAOSpotTexture() {
    if (runtimeTextures.contactAOSpot) return runtimeTextures.contactAOSpot;
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 128, 128);
    // Annular dark band straddling the gem girdle: white inside (no
    // effect over the stone footprint), darkest at ~67% of disc radius
    // (just outside the girdle), fading back to white at the edge.
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0.00, "rgba(255,255,255,1)");
    g.addColorStop(0.55, "rgba(255,255,255,1)");
    g.addColorStop(0.67, "rgba(142,142,148,1)"); // restrained seat occlusion
    g.addColorStop(0.82, "rgba(210,210,214,1)");
    g.addColorStop(1.00, "rgba(255,255,255,1)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    disposableTextures.push(tex);
    runtimeTextures.contactAOSpot = tex;
    return tex;
  }

  function addStoneContactAO(stoneGroup, size) {
    if (currentState.setting === "Tension") return;
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(size * 1.38, 32),
      new THREE.MeshBasicMaterial({
        map: contactAOSpotTexture(),
        transparent: true,
        opacity: 0.28,
        blending: THREE.MultiplyBlending,
        depthWrite: false,
        toneMapped: false,
        fog: false
      })
    );
    // Sit just below the girdle plane in gem-local space, facing +Z so the
    // gradient is visible from the viewing hemisphere. The disc is OUTSIDE
    // the gem volume (girdle is at z = 0, gem culet at z ≈ -0.86·size, but
    // the dark portion of the texture only fires at radius > 0.55·disc =
    // 0.85·size, beyond the gem girdle outline) so it does not multiply
    // over the stone itself.
    disc.position.z = -size * 0.04;
    disc.renderOrder = -0.5;
    disc.userData.isContactAO = true;
    stoneGroup.add(disc);
  }

  function makeStone(scale = 1) {
    const size = specStoneHalfWidth() * scale;
    const stone = new THREE.Group();
    const mesh = new THREE.Mesh(createCutStoneGeometry(size, currentState.shape), materialForStone(scale));
    mesh.userData.isGem = true;
    stone.add(mesh);
    // §5 contact AO — applied as a soft rim around set stones so the gem
    // reads seated at the metal interface.
    addStoneContactAO(stone, size);
    // Internal features are deterministic and are only added to stones whose
    // material normally displays them (for example salt-and-pepper diamonds
    // and emerald jardin). Clean diamonds are left optically clean.
    addMaterialInclusions(mesh, size, currentState.stone);

    // Do not paint a fixed bow-tie or prong-contact dots onto the crown. Those
    // patterns depend on the current viewer/light directions and must emerge
    // from facet transport, environment reflections and real setting geometry.
    return enableShadows(stone);
  }

  function seededUnit(seed) {
    // Small deterministic PRNG so a design keeps the same inclusion pattern
    // across redraws, screenshots and AR. This avoids the visible "stone
    // changes every frame" tell caused by Math.random().
    let x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function addMaterialInclusions(parentMesh, size, stoneName) {
    const profile = STONE_PROFILES[stoneName];
    if (!profile || (profile.transmission || 0) < 0.55) return;

    // Clean commercial diamonds and transparent coloured gems should not be
    // given visible black specks by default. Only explicit inclusion-bearing
    // materials get an internal feature field.
    const inclusionProfile = stoneName === "Salt & Pepper"
      ? { count: 18, blackRatio: 0.78, radiusMin: 0.009, radiusMax: 0.026, featherOpacity: 0.24 }
      : stoneName === "Emerald Green"
        ? { count: 8, blackRatio: 0.20, radiusMin: 0.006, radiusMax: 0.015, featherOpacity: 0.18 }
        : null;
    if (!inclusionProfile) return;

    const matBlack = new THREE.MeshBasicMaterial({
      color: stoneName === "Emerald Green" ? 0x17362a : 0x0a0c0f,
      fog: false,
      toneMapped: false
    });
    const matFeather = new THREE.MeshBasicMaterial({
      color: stoneName === "Emerald Green" ? 0xb8e2ca : 0xe8ebee,
      transparent: true,
      opacity: inclusionProfile.featherOpacity,
      fog: false,
      toneMapped: false,
      depthWrite: false
    });

    const seedBase = [...`${stoneName}|${currentState.shape}|${currentState.size}`]
      .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

    for (let i = 0; i < inclusionProfile.count; i += 1) {
      const u0 = seededUnit(seedBase + i * 7 + 1);
      const u1 = seededUnit(seedBase + i * 7 + 2);
      const u2 = seededUnit(seedBase + i * 7 + 3);
      const u3 = seededUnit(seedBase + i * 7 + 4);
      const u4 = seededUnit(seedBase + i * 7 + 5);
      const u5 = seededUnit(seedBase + i * 7 + 6);
      const u6 = seededUnit(seedBase + i * 7 + 7);

      const r = Math.cbrt(u0) * size * 0.31;
      const theta = u1 * Math.PI * 2;
      const phi = Math.acos(2 * u2 - 1);
      const isBlack = u3 < inclusionProfile.blackRatio;
      const radius = size * (
        inclusionProfile.radiusMin
        + u4 * (inclusionProfile.radiusMax - inclusionProfile.radiusMin)
      );
      const speck = new THREE.Mesh(
        new THREE.SphereGeometry(radius, 7, 5),
        isBlack ? matBlack : matFeather
      );
      speck.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
      if (!isBlack) {
        speck.scale.set(1, 0.22 + u5 * 0.28, 1.6 + u6 * 0.8);
        speck.rotation.set(u1 * Math.PI, u2 * Math.PI, u4 * Math.PI);
      }
      parentMesh.add(speck);
    }
  }

  function makeMeleeStone(size, material) {
    const mesh = new THREE.Mesh(createBrilliantGeometry(size, "Round"), material);
    mesh.castShadow = true;
    return mesh;
  }

  function createFlushSetStoneGeometry(size, shape = "Round") {
    const segments = shape === "Princess" ? 4 : 12;
    const offset = shape === "Princess" ? Math.PI / 4 : 0;
    const girdleR = size * (shape === "Princess" ? 0.78 : 0.82);
    const breakR = size * (shape === "Princess" ? 0.58 : 0.64);
    const tableR = size * (shape === "Princess" ? 0.38 : 0.40);
    const girdleZ = 0.000;
    const breakZ = size * 0.052;
    const tableZ = size * 0.112;
    const crown = [];
    const shoulder = [];
    const table = [];

    for (let i = 0; i < segments; i += 1) {
      const a = offset + (Math.PI * 2 * i) / segments;
      crown.push(new THREE.Vector3(Math.cos(a) * girdleR, Math.sin(a) * girdleR, girdleZ));
      shoulder.push(new THREE.Vector3(Math.cos(a) * breakR, Math.sin(a) * breakR, breakZ));
      table.push(new THREE.Vector3(Math.cos(a) * tableR, Math.sin(a) * tableR, tableZ));
    }

    jitterStoneVerts([shoulder, table], size * 0.006, shape === "Princess" ? 180 : 120);
    const positions = [];
    const add = (...verts) => verts.forEach((v) => positions.push(v.x, v.y, v.z));
    const topCenter = new THREE.Vector3(0, 0, tableZ + size * 0.004);
    for (let i = 0; i < segments; i += 1) {
      const next = (i + 1) % segments;
      // Crown-only geometry: pavé stones are embedded into drilled seats, so
      // only the crown/table sits above the metal. The pavilion is implied by
      // the dark seat below instead of rendered as a cone sticking out.
      add(crown[i], crown[next], shoulder[next]);
      add(crown[i], shoulder[next], shoulder[i]);
      add(shoulder[i], shoulder[next], table[next]);
      add(shoulder[i], table[next], table[i]);
      add(table[i], table[next], topCenter);
    }

    return finishGeometry(positions);
  }

  function makeFlushSetStone(size, material, shape = "Round") {
    const mesh = new THREE.Mesh(createFlushSetStoneGeometry(size, shape), material);
    mesh.castShadow = true;
    mesh.userData.isGem = true;
    return mesh;
  }

  function addHalo(parent, centerX, centerY, radius, count, z, scaleY = 1) {
    if (!currentState.halo) {
      return;
    }

    // §3/§11 Halo accents are roughly 0.3–0.4× the center stone's path
    // length — forward that scale so Beer-Lambert absorption stays
    // physically consistent across the piece (pavé stones should NOT
    // saturate to opaque, large halo stones should NOT wash out).
    const material = materialForStone(0.4);
    const metal = materialForMetal();
    const haloStoneR = 0.048 + Number(currentState.size) * 0.006;

    // Under-collar: a thin metal torus that sits a hair below the halo
    // girdle plane. This is what stops the halo from reading as a ring of
    // floating gems — every set halo has a continuous bezel rail behind it.
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(radius, haloStoneR * 0.42, 16, Math.max(64, count * 2)),
      metal
    );
    collar.position.set(centerX, centerY, z - haloStoneR * 0.25);
    collar.scale.y = scaleY;
    parent.add(collar);

    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count;
      const gem = makeMeleeStone(haloStoneR, material);
      gem.position.set(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius * scaleY, z);
      // Table-up: the old chaotic tilt (rotation.set(angle*0.3, angle, 0))
      // gave each melee a different tilt around two axes — visible as
      // "every halo stone facing a slightly different direction" in any
      // close-up. Real halo melee all sit on the same plane and their
      // tables share one normal.
      gem.rotation.set(0, 0, angle);
      parent.add(gem);
      // Tiny corner bead between this stone and the next — clamps the
      // girdle into the collar.
      const next = (Math.PI * 2 * (index + 0.5)) / count;
      const bead = new THREE.Mesh(
        new THREE.SphereGeometry(haloStoneR * 0.32, 18, 14),
        metal
      );
      bead.position.set(
        centerX + Math.cos(next) * radius,
        centerY + Math.sin(next) * radius * scaleY,
        z + haloStoneR * 0.25
      );
      parent.add(bead);
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
    const material = materialForStone(0.35);  // §3/§11 pavé-scale absorption
    const metal = materialForMetal();
    // Each accent gets a drilled-seat shadow underneath so it reads as
    // bead-set into the band, and corner beads between adjacent stones
    // clamp the row visually.
    const angles = [];
    for (let index = 0; index < count; index += 1) {
      const progress = count === 1 ? 0.5 : index / (count - 1);
      const angle = start + (end - start) * progress;
      angles.push(angle);
      const sx = x + Math.cos(angle) * radius;
      const sy = y + Math.sin(angle) * radius * scaleY;
      parent.add(makePaveSeat(sx, sy, z + size * 0.6, size * 0.95, angle));
      const gem = makeMeleeStone(size, material);
      gem.position.set(sx, sy, z);
      // Flat tables — same fix as the halo melee. Old chaotic rotation
      // produced bead-set accents that read as randomly-glued chips.
      gem.rotation.set(0, 0, angle);
      parent.add(gem);
    }
    // Corner beads between every adjacent pair, on inner + outer edges.
    const beadR = size * 0.34;
    for (let i = 0; i < angles.length - 1; i += 1) {
      const a = (angles[i] + angles[i + 1]) / 2;
      const innerR = radius - size * 0.55;
      const outerR = radius + size * 0.55;
      parent.add(makePaveBead(
        x + Math.cos(a) * innerR,
        y + Math.sin(a) * innerR * scaleY,
        z + beadR * 0.55, beadR, metal
      ));
      parent.add(makePaveBead(
        x + Math.cos(a) * outerR,
        y + Math.sin(a) * outerR * scaleY,
        z + beadR * 0.55, beadR, metal
      ));
    }
  }

  function makeCylinderBetween(start, end, radius, material) {
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    // 24-segment cylinder reads as a smooth wire on close-up; 16 was
    // visibly faceted on prong posts and gallery rails under inspect.
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 24), material);

    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());

    return mesh;
  }

  // Tiny half-sphere bead used to clamp the girdle of band-set stones.
  // Real pavé work uses these between every two adjacent stones; in a row
  // of N stones there are typically N+1 beads (or 2N corner beads for a
  // double row). The bead radius is ~38% of the stone diameter.
  function makePaveBead(x, y, z, radius, material) {
    const bead = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 16), material);
    bead.position.set(x, y, z);
    bead.castShadow = true;
    return bead;
  }

  // §5 — Drilled-hole rim mark beneath a band-set stone.
  //
  // PRIOR DEFECT: A filled CircleGeometry with near-black opaque material
  // was placed directly under each pavé stone. Because pavé stones use
  // MeshPhysicalMaterial with transmission > 0, the Fresnel-corrected
  // transmission path samples the framebuffer BEHIND the stone — i.e.
  // the dark seat disc. This produced a black blob visible THROUGH the
  // table of every pavé/halo melee gem (the "dark spots on the stones"
  // defect).
  //
  // PHYSICAL CORRECTION: the only visible signature of a drilled seat is
  // a thin dark RIM where the conical hole wall meets the metal surface
  // (the rest of the hole is occluded by the stone's pavilion). We model
  // exactly that — a RingGeometry annulus from 0.62R to R. Inside 0.62R
  // is open metal that the stone's pavilion now occupies, so transmission
  // sampling sees the BAND (gold/silver) instead of black.
  //
  // INVARIANT: ∀ stone with transmission > 0 placed at z > z_seat, the
  // ray from the camera through the table to the seat traverses the open
  // annulus center, returning the band material's albedo (bright) not
  // black. Dark-spot energy = ∫_table (seat_albedo · transmission) dA = 0
  // since the under-table region of the seat is now empty.
  function makePaveSeat(x, y, z, radius, ang) {
    const seat = new THREE.Mesh(
      new THREE.RingGeometry(radius * 0.62, radius, 24, 1),
      new THREE.MeshBasicMaterial({
        color: 0x140f0c,
        transparent: true,
        opacity: 0.55,         // softer than the previous 0.85 — real
                               // drilled rims are dark but not pure black
        depthWrite: false,
        side: THREE.DoubleSide // visible from above OR through gem rim
      })
    );
    seat.position.set(x, y, z);
    seat.rotation.z = ang;
    seat.renderOrder = -1;     // draw BEFORE transparent stones; stones
                               // render on top in the same transparency
                               // pass and fully cover the rim from above.
    return seat;
  }

  // Generic prong cluster for non-ring pieces (necklace / bracelet / earrings).
  //
  // Why this used to look "floating":
  //   The old implementation built a vertical cylinder of fixed length 0.28
  //   centered at centerZ+0.05 and placed a sphere "tip" at centerZ+0.2,
  //   regardless of the gem's actual height. For tennis links (gem radius
  //   ~0.05) the tip ended up 0.13 ABOVE the crown.
  //
  // New behaviour:
  //   Caller passes `stoneZ` (gem girdle z) and `stoneSize` (mesh half-dia).
  //   We derive baseZ / tipZ from the stone's real geometry and use the
  //   curved-prong builder (post + solder torus at base + curled claw at tip)
  //   so every prong physically grips the crown and is welded to the basket
  //   rail at its base.
  function addProngs(parent, centerX, centerY, centerZ, radius, count = 6, scaleY = 1, opts = {}) {
    const metal = materialForMetal();
    const prongRadius = 0.015 * weightValue();
    // Default geometry assumes the stone half-diameter ≈ prong-circle radius
    // (i.e. prongs hug the girdle from a hair outside), with the girdle
    // plane just above the basket centre. Callers can override either
    // explicitly when they know the exact stone metrics.
    const stoneSize = opts.stoneSize ?? radius * 0.9;
    const stoneZ    = opts.stoneZ    ?? (centerZ + stoneSize * 0.18);
    const shape = opts.shape || currentState.shape;
    const depth = stoneDepthMetrics(stoneSize, shape);
    // §5 collision guard: prong posts start outside the pavilion envelope
    // and claws stop on the crown surface, never through the gem volume.
    const baseZ = stoneZ - depth.pavilionH * 0.34;
    const tipZ  = stoneZ + depth.crownH * 0.72;
    const baseR = radius * 1.01;
    const tipR  = radius * 0.96;
    for (let i = 0; i < count; i += 1) {
      const ang = (Math.PI * 2 * i) / count + Math.PI / count;
      addCurvedProng(
        parent, centerX, centerY, ang,
        baseR, tipR,
        baseZ, tipZ,
        prongRadius, scaleY, metal,
        { stoneSize, stoneZ, shape }
      );
    }
  }

  function addBezel(parent, centerX, centerY, centerZ, radius, scaleY = 1) {
    const metal = materialForMetal();
    const bezel = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.024 * weightValue(), 24, 128), metal);

    bezel.position.set(centerX, centerY, centerZ + 0.04);
    bezel.scale.y = scaleY;
    parent.add(bezel);
  }

  // Gallery basket for non-ring pieces. Two rails (upper at gem girdle,
  // lower well below) joined by N vertical struts whose count matches the
  // prong count so prong-base / strut-top share a vertex visually.
  //
  // The UPPER rail was previously missing — only the lower torus was
  // rendered, so prong posts appeared to spring from open air. Now the
  // upper rail closes the basket at gem girdle level.
  function addGalleryBasket(parent, centerX, centerY, centerZ, radius, scaleY = 1, opts = {}) {
    const metal = materialForMetal();
    const railRadius = 0.014 * weightValue();
    const strutCount = opts.strutCount ?? 6;
    const stoneSize = opts.stoneSize;
    const stoneZ = opts.stoneZ;
    const shape = opts.shape || currentState.shape;
    const depth = stoneSize ? stoneDepthMetrics(stoneSize, shape) : null;
    // Lower rail sits safely below the culet; upper rail sits outside the
    // pavilion envelope. That avoids the classic CGI bug where basket rails
    // visibly slice through the stone belly.
    const lowerZ = depth ? stoneZ - depth.pavilionH - railRadius * 0.45 : centerZ - 0.10;
    const upperZ = depth ? stoneZ - depth.pavilionH * 0.26 : centerZ + 0.01;
    let upperR = radius * 0.94;
    for (let sample = 0; sample < 8; sample += 1) {
      const a = (Math.PI * 2 * sample) / 8;
      upperR = Math.max(
        upperR,
        safeSettingRadiusAtZ(a, upperZ, { stoneSize, stoneZ, shape, scaleY, tubeRadius: railRadius })
      );
    }
    const lowerR = radius * 0.68;

    const upperRail = new THREE.Mesh(new THREE.TorusGeometry(upperR, railRadius, 16, 96), metal);
    upperRail.position.set(centerX, centerY, upperZ);
    upperRail.scale.y = scaleY;
    const lowerRail = new THREE.Mesh(new THREE.TorusGeometry(lowerR, railRadius, 16, 96), metal);
    lowerRail.position.set(centerX, centerY, lowerZ);
    lowerRail.scale.y = scaleY;
    parent.add(upperRail, lowerRail);

    for (let i = 0; i < strutCount; i += 1) {
      const ang = (Math.PI * 2 * i) / strutCount;
      const top = new THREE.Vector3(
        centerX + Math.cos(ang) * upperR,
        centerY + Math.sin(ang) * upperR * scaleY,
        upperZ
      );
      const bot = new THREE.Vector3(
        centerX + Math.cos(ang) * lowerR,
        centerY + Math.sin(ang) * lowerR * scaleY,
        lowerZ
      );
      parent.add(makeCylinderBetween(top, bot, railRadius * 0.78, metal));
    }
  }

  function addMilgrain(parent, centerX, centerY, radius, count, z, scaleY = 1, size = 0.018) {
    if (currentState.finish !== "Milgrain Edge") {
      return;
    }

    const metal = materialForMetal();

    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count;
      const bead = new THREE.Mesh(new THREE.SphereGeometry(size * weightValue(), 16, 12), metal);
      bead.position.set(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius * scaleY, z);
      parent.add(bead);
    }
  }

  function addSetting(parent, centerX, centerY, centerZ, radius, options = {}) {
    const {
      scaleY = 1,
      prongs = 6,
      shoulders = false,
      stoneSize = radius * 0.9,
      stoneZ = centerZ + stoneSize * 0.18
    } = options;
    const setting = currentState.setting;
    const shape = options.shape || currentState.shape;
    const depth = stoneDepthMetrics(stoneSize, shape);

    if (setting === "Bezel") {
      // For necklace/bracelet/earring focal stones the bezel IS the
      // basket's upper rail — emitting both a bezel torus AND an addBasket
      // upper rail (the old code) stacked two parallel rings ~0.05 apart
      // ("floating collar" defect, same as the ring renderer had). Now we
      // emit ONE bezel + 4 cardinal struts down to a single lower rail.
      const metal = materialForMetal();
      const railRadius = 0.014 * weightValue();
      const bezelZ = stoneZ - Math.min(stoneSize * 0.03, 0.012);
      const bezelTube = 0.024 * weightValue();
      let bezelR = radius;
      for (let sample = 0; sample < 12; sample += 1) {
        const a = (Math.PI * 2 * sample) / 12;
        bezelR = Math.max(
          bezelR,
          safeSettingRadiusAtZ(a, bezelZ, { stoneSize, stoneZ, shape, scaleY, tubeRadius: bezelTube })
        );
      }
      const bezel = new THREE.Mesh(new THREE.TorusGeometry(bezelR, bezelTube, 24, 128), metal);
      bezel.position.set(centerX, centerY, bezelZ);
      bezel.scale.y = scaleY;
      parent.add(bezel);
      const lowerZ = stoneZ - depth.pavilionH - railRadius * 0.45;
      const lowerR = radius * 0.68;
      const lowerRail = new THREE.Mesh(
        new THREE.TorusGeometry(lowerR, railRadius, 16, 96), metal
      );
      lowerRail.position.set(centerX, centerY, lowerZ);
      lowerRail.scale.y = scaleY;
      parent.add(lowerRail);
      for (let i = 0; i < 4; i += 1) {
        const ang = (Math.PI * 2 * i) / 4 + Math.PI / 4;
        const top = new THREE.Vector3(
          centerX + Math.cos(ang) * bezelR * 0.92,
          centerY + Math.sin(ang) * bezelR * 0.92 * scaleY,
          bezelZ
        );
        const bot = new THREE.Vector3(
          centerX + Math.cos(ang) * lowerR,
          centerY + Math.sin(ang) * lowerR * scaleY,
          lowerZ
        );
        parent.add(makeCylinderBetween(top, bot, railRadius * 0.78, metal));
      }
      return;
    }

    if (setting === "Tension") {
      // Two flat arms grip the stone from opposite sides. No basket, no
      // prongs over the crown — the gem appears suspended between the arms.
      const metal = materialForMetal();
      const armT = 0.024 * weightValue();
      const armH = stoneSize * 1.1;
      for (const side of [-1, 1]) {
        const contactAngle = side > 0 ? 0 : Math.PI;
        const clampR = safeSettingRadiusAtZ(contactAngle, stoneZ, {
          stoneSize, stoneZ, shape, scaleY, tubeRadius: armT * 1.2, margin: armT * 0.4
        });
        const tipX = centerX + side * clampR;
        const anchorX = centerX + side * Math.max(radius * 1.8, clampR + stoneSize * 0.78);
        const dx = tipX - anchorX;
        const len = Math.abs(dx);
        const arm = new THREE.Mesh(makeChamferedBox(len, armH * 0.55, armT), metal);
        arm.position.set((anchorX + tipX) / 2, centerY, stoneZ);
        parent.add(arm);
        const pad = new THREE.Mesh(makeChamferedBox(armT * 1.2, armH * 0.55, armT * 2.4), metal);
        pad.position.set(tipX, centerY, stoneZ);
        parent.add(pad);
      }
      return;
    }

    if (setting === "Trellis") {
      // Interlaced 4-prong head: prong bases sit 45° from the gallery
      // strut posts, and two crossing arc bars sweep UNDER the pavilion to
      // tie opposite shoulders together (the visual signature of a real
      // trellis head). Without these arcs a "trellis" looks identical to a
      // normal prong setting, which is the bug the user pointed out for
      // the bracelet.
      const metal = materialForMetal();
      const prongRadius = 0.015 * weightValue();
      const baseZ = stoneZ - depth.pavilionH * 0.38;
      const tipZ  = stoneZ + depth.crownH * 0.72;
      const baseR = radius * 1.00;
      const tipR  = radius * 0.96;
      for (let i = 0; i < 4; i += 1) {
        const ang = (Math.PI * 2 * i) / 4 + Math.PI / 4;
        addCurvedProng(
          parent, centerX, centerY, ang,
          baseR, tipR, baseZ, tipZ,
          prongRadius, scaleY, metal,
          { stoneSize, stoneZ, shape }
        );
      }
      // 2 crossing arc bars — one along x-axis, one along y-axis — that
      // dip under the gem before climbing back to the opposite shoulder.
      const arcBaseZ = stoneZ - depth.pavilionH - prongRadius * 0.6;
      for (let i = 0; i < 2; i += 1) {
        const arcAng = i * Math.PI / 2;
        const a = new THREE.Vector3(
          centerX + Math.cos(arcAng) * baseR,
          centerY + Math.sin(arcAng) * baseR * scaleY,
          arcBaseZ
        );
        const b = new THREE.Vector3(
          centerX - Math.cos(arcAng) * baseR,
          centerY - Math.sin(arcAng) * baseR * scaleY,
          arcBaseZ - stoneSize * 0.12
        );
        parent.add(makeCylinderBetween(a, b, prongRadius * 0.85, metal));
      }
      addGalleryBasket(parent, centerX, centerY, centerZ, radius, scaleY, { strutCount: 4, stoneSize, stoneZ, shape });
      return;
    }

    // Default: Prong (also Cathedral — the shoulder ramps are added below).
    addProngs(parent, centerX, centerY, centerZ, radius, prongs, scaleY, { stoneZ, stoneSize, shape });
    addGalleryBasket(parent, centerX, centerY, centerZ, radius, scaleY, { strutCount: prongs, stoneSize, stoneZ, shape });

    if (setting === "Cathedral" && shoulders) {
      const metal = materialForMetal();
      const tube = 0.028 * weightValue();
      parent.add(
        makeCylinderBetween(new THREE.Vector3(-0.62, 0.88, 0.03), new THREE.Vector3(-0.22, 1.12, centerZ), tube, metal),
        makeCylinderBetween(new THREE.Vector3(0.62, 0.88, 0.03), new THREE.Vector3(0.22, 1.12, centerZ), tube, metal)
      );
    }
  }

  // Build a real comfort-fit band by sweeping a CLOSED elliptical cross
  // section around a torus path.
  //
  // Why the cross-section must be closed (not a half-arc):
  //   The camera looks down +Z. The ring lies in the XY plane (finger axis
  //   = Z). A half-arc that only bulges radially outward gives every band
  //   surface a normal in the XY plane — those normals are ~90° (grazing)
  //   to the camera, so Fresnel forces the reflection toward F90 = white
  //   for ANY metal. That's why an "open" profile reads as plain white
  //   regardless of which gold you pick.
  //
  //   A closed ellipse adds true side faces at z = ±profileHeight/2 whose
  //   normals point toward ±Z (i.e. toward the camera). At those near-
  //   normal angles you see F0 = the goldsmith base color (yellow / rose /
  //   white / platinum), so the band finally shows its metal.
  //
  //   We also build the geometry INDEXED with shared vertices so
  //   computeVertexNormals produces smooth interpolated normals — no
  //   faceted "disco quilt" aggregation that washes out hue.
  function makeBandGeometry(majorRadius, profileWidth, profileHeight, style = "Solitaire") {
    const segments = 220;
    const profileSegments = 32;          // around the closed ellipse
    const isKnife = style === "Knife-Edge";
    const isTwist = style === "Twist";

    // Closed cross section in local (r, h) space, traversed CCW so that
    // generated face normals end up pointing OUTWARD from the swept tube.
    //   r is the radial offset added to majorRadius.
    //   h is the axial offset along the finger axis (z).
    //
    // Ellipse parameters:
    //   Outer extreme:  r = +profileWidth,         h = 0
    //   Top side face:  r =  profileWidth/2,       h = +profileHeight/2
    //   Inner extreme:  r =  0 (against finger),   h = 0
    //   Bottom side:    r =  profileWidth/2,       h = -profileHeight/2
    //
    // For Knife-Edge we sharpen the outer extreme into a ridge by pulling
    // the radial term with an exponent > 1 (preserves closure).
    const profile = [];
    const rCenter = profileWidth * 0.5;
    const rHalf   = profileWidth * 0.5;
    const hHalf   = profileHeight * 0.5;
    for (let j = 0; j < profileSegments; j += 1) {
      const t = j / profileSegments;
      const ang = t * Math.PI * 2;             // 0..2π, closes on itself
      let cR = Math.cos(ang);
      const cH = Math.sin(ang);
      if (isKnife) {
        // Sharpen outer extreme (cR ≈ +1) into a ridge; soften the rest.
        const s = Math.sign(cR);
        cR = s * Math.pow(Math.abs(cR), 0.55);
      }
      profile.push({
        r: rCenter + cR * rHalf,
        h: cH * hHalf
      });
    }

    // Build shared vertex grid: cols × profileSegments (both wrap).
    const cols = segments;
    const rows = profileSegments;
    const positions = new Float32Array(cols * rows * 3);
    // §2 macro relief — a real cast-and-polished band carries
    // low-frequency variance from hand finishing: the cross-section is
    // never identical at every angle around the finger. The existing
    // per-vertex micro-jitter (added later in this function) lives at the
    // *highest* spatial frequency and breaks specular noise; what reads as
    // "physical object, not CAD" is the MIDDLE band — 2–3 cycles around
    // the ring at ~0.35% amplitude. We modulate both radial offset (band
    // gets fractionally heavier/lighter around the circumference) and a
    // very gentle profile-height wobble (slight ovalization).
    const geometryRelief = currentState.finish === "Hammered";
    const macroAmpR = geometryRelief ? profileWidth * 0.0022 : 0;
    const macroAmpH = geometryRelief ? profileHeight * 0.0016 : 0;
    // Irrational frequencies so the two modes never line up and the
    // pattern doesn't read as a designed symmetry.
    const fR1 = 2.0, fR2 = 3.0;
    const fH1 = 2.0, fH2 = 5.0;
    const phR = 0.73, phH = 1.91;
    for (let i = 0; i < cols; i += 1) {
      const ang = (i / cols) * Math.PI * 2;
      const twist = isTwist ? Math.sin(ang * 3) * 0.06 : 0;
      const cx = Math.cos(ang);
      const sy = Math.sin(ang);
      const macroR = (Math.sin(ang * fR1 + phR) * 0.6 + Math.sin(ang * fR2 + phR * 1.7) * 0.4) * macroAmpR;
      const macroH = (Math.sin(ang * fH1 + phH) * 0.55 + Math.sin(ang * fH2 + phH * 0.9) * 0.45) * macroAmpH;
      for (let j = 0; j < rows; j += 1) {
        const p = profile[j];
        const radial = majorRadius + p.r + macroR;
        const idx = (i * rows + j) * 3;
        positions[idx + 0] = cx * radial;
        positions[idx + 1] = sy * radial;
        positions[idx + 2] = p.h + twist + macroH;
      }
    }

    // Indices: two triangles per quad. Both i and j wrap so the band has
    // no seams in either direction → smooth normals everywhere.
    const indices = new Uint32Array(cols * rows * 6);
    let k = 0;
    for (let i = 0; i < cols; i += 1) {
      const iNext = (i + 1) % cols;
      for (let j = 0; j < rows; j += 1) {
        const jNext = (j + 1) % rows;
        const a =  i     * rows + j;
        const b =  iNext * rows + j;
        const c =  iNext * rows + jNext;
        const d =  i     * rows + jNext;
        // Winding chosen so face normals point OUTWARD from the swept tube.
        indices[k++] = a; indices[k++] = b; indices[k++] = c;
        indices[k++] = a; indices[k++] = c; indices[k++] = d;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    // UVs (Realism §3): U follows the band's circumference, V wraps the
    // profile cross-section. With these UVs in place, three.js builds
    // tangent space such that the anisotropic specular direction set by
    // anisotropyRotation = 0 streaks ALONG the band length — exactly the
    // direction a real polishing wheel leaves marks. Without UVs the
    // tangent frame is per-face arbitrary and anisotropy looks like noise.
    const uvs = new Float32Array(cols * rows * 2);
    for (let i = 0; i < cols; i += 1) {
      for (let j = 0; j < rows; j += 1) {
        const uvIdx = (i * rows + j) * 2;
        uvs[uvIdx + 0] = i / cols;   // u: 0..1 around the finger
        uvs[uvIdx + 1] = j / rows;   // v: 0..1 around the profile
      }
    }
    geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    // Sub-percent organic micro-displacement: real cast → polished gold is
    // never mathematically perfect. Adding a tiny pseudo-random perturbation
    // breaks the dead symmetry that screams "computer" without producing
    // visible bumps. The hash is deterministic per-vertex so the band
    // re-renders identically. Amplitude tuned down to ~0.28% — the old
    // 0.85% was enough to read as a faint "cast, not polished" graininess
    // on close-ups (visible noise across the highlight).
    const microAmp = geometryRelief ? Math.min(profileWidth, profileHeight) * 0.0018 : 0;
    for (let v = 0; v < cols * rows; v += 1) {
      const idx = v * 3;
      // Cheap deterministic hash → [-1, 1]
      const h1 = Math.sin(v * 12.9898) * 43758.5453;
      const h2 = Math.sin(v * 78.233 + 4.1) * 43758.5453;
      const h3 = Math.sin(v * 39.346 + 7.9) * 43758.5453;
      const nx = (h1 - Math.floor(h1)) * 2 - 1;
      const ny = (h2 - Math.floor(h2)) * 2 - 1;
      const nz = (h3 - Math.floor(h3)) * 2 - 1;
      positions[idx + 0] += nx * microAmp;
      positions[idx + 1] += ny * microAmp;
      positions[idx + 2] += nz * microAmp;
    }
    geometry.computeVertexNormals();
    return geometry;
  }

  function makeEllipticalTubeAlongCurve(curve, radialThickness, axialWidth, material, options = {}) {
    const segments = options.segments || 128;
    const radialSegments = options.radialSegments || 18;
    const closed = Boolean(options.closed);
    const radius = Math.max(0.001, radialThickness * 0.5);
    const geometry = new THREE.TubeGeometry(curve, segments, radius, radialSegments, closed);
    // Curves used for shanks lie in the XY plane. Scaling world Z therefore
    // turns the circular tube into the same radial×axial ellipse as the main
    // comfort-fit shank without changing its inner diameter.
    geometry.scale(1, 1, Math.max(0.2, axialWidth / Math.max(radialThickness, 1e-4)));
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    return mesh;
  }

  /**
   * True bypass shank: one lower continuous arc plus two open swept arms.
   * The previous renderer placed a second complete ring through the first,
   * which created impossible internal metal intersections and preserved a
   * closed top where a bypass must open. This assembly keeps the calibrated
   * finger opening, leaves a real head gap, and gives the two shoulders a
   * controlled over/under crossing before they terminate beside the stone.
   */
  function makeBypassShankAssembly(G, material) {
    const assembly = new THREE.Group();
    assembly.userData.manufacturing = {
      role: "bypass-shank-assembly",
      openTop: true,
      ringInnerDiameterMm: G.spec.ring.innerDiameterMm
    };

    const centerlineR = G.bandMajorR + G.bandWidth * 0.5;
    const headHalfWidth = G.gemHalfW + G.prongBaseRadius * 2.0;
    const requiredGap = Math.asin(clamp(headHalfWidth / Math.max(centerlineR, 1e-4), 0.16, 0.78));
    const gapHalfAngle = clamp(requiredGap + 0.20, 0.46, 0.88);
    const arcStart = Math.PI / 2 + gapHalfAngle;
    const arcLength = Math.PI * 2 - gapHalfAngle * 2;
    const baseArc = new THREE.Curve();
    baseArc.getPoint = (t) => {
      const angle = arcStart + arcLength * t;
      return new THREE.Vector3(Math.cos(angle) * centerlineR, Math.sin(angle) * centerlineR, 0);
    };
    const lowerShank = makeEllipticalTubeAlongCurve(
      baseArc,
      G.bandWidth,
      G.bandHeight,
      material,
      { segments: 180, radialSegments: 22 }
    );
    lowerShank.userData.manufacturing = { role: "bypass-lower-shank", closed: false };
    assembly.add(lowerShank);

    for (const side of [-1, 1]) {
      // side=-1 starts on the wearer's left shoulder and crosses toward the
      // right side of the stone; side=+1 does the inverse. Small opposite Z
      // offsets establish a real over/under order instead of intersecting.
      const shoulderAngle = Math.PI / 2 - side * gapHalfAngle;
      const p0 = new THREE.Vector3(
        Math.cos(shoulderAngle) * centerlineR,
        Math.sin(shoulderAngle) * centerlineR,
        0
      );
      const p1 = new THREE.Vector3(
        side * centerlineR * 0.36,
        G.bandOuterR + G.gemPos.z * 0.10,
        side * G.bandHeight * 0.12
      );
      const p2 = new THREE.Vector3(
        -side * (G.gemHalfW + G.prongBaseRadius * 1.35),
        G.bandOuterR + G.gemPos.z * 0.42,
        side * G.bandHeight * 0.22
      );
      const curve = new THREE.CatmullRomCurve3([p0, p1, p2], false, "centripetal", 0.45);
      const arm = makeEllipticalTubeAlongCurve(
        curve,
        G.bandWidth * 0.86,
        G.bandHeight * 0.82,
        material,
        { segments: 72, radialSegments: 20 }
      );
      arm.userData.manufacturing = {
        role: "bypass-arm",
        crossesTo: side < 0 ? "right" : "left",
        overUnderZ: p2.z
      };
      assembly.add(arm);

      const shoulderFillet = new THREE.Mesh(
        new THREE.SphereGeometry(G.bandWidth * 0.46, 20, 16),
        material
      );
      shoulderFillet.position.copy(p0);
      shoulderFillet.scale.z = G.bandHeight / Math.max(G.bandWidth, 1e-4);
      assembly.add(shoulderFillet);

      const headFillet = new THREE.Mesh(
        new THREE.SphereGeometry(G.bandWidth * 0.38, 20, 16),
        material
      );
      headFillet.position.copy(p2);
      headFillet.scale.z = G.bandHeight / Math.max(G.bandWidth, 1e-4);
      headFillet.userData.manufacturing = { role: "bypass-head-joint" };
      assembly.add(headFillet);
    }

    return assembly;
  }

  // ---------------------------------------------------------------------------
  // ALGORITHMIC RING GEOMETRY
  //
  // Every position in the ring (gem, prongs, halo, side stones, pavé) is
  // derived from a small set of inputs (size, weight, shape, band style)
  // using real jeweler proportions.  Nothing is placed with a magic number.
  //
  //   Conventions:
  //     - Finger axis = world Z (band lies in XY plane).
  //     - "Up" on the ring (where the center stone sits) = +Y.
  //     - Stone tables face +Z (toward camera). Girdle = stone's local XY plane.
  //
  //   Reference proportions are read from `stoneDepthMetrics()` so every
  //   dependent placement mirrors the actual mesh depth. This is the §5
  //   no-interpenetration invariant: the code cannot use stale pavilion
  //   depths and then bury the stone through the band.
  //
  //   Side-stone spacing uses the chord formula:
  //     chord = 2 R sin(Δθ / 2)   ⇒   Δθ = 2 · asin(chord / (2R))
  //   so the angular offset around the band is exactly what is needed for
  //   girdle-to-girdle tangency plus a small metal gap.
  // ---------------------------------------------------------------------------
  function computeRingGeometry(state) {
    const spec = buildJewellerySpec(state);
    const S = spec.centerStone.carat;
    // Preserve the legacy relative weight variable for secondary decorative
    // details, but never use it to determine the finger opening.
    const W = spec.ring.shankThicknessMm / 1.75;
    const shape = spec.centerStone.shape;

    // ---- certified / physical center-stone envelope -----------------------
    const gemHalfW = spec.world.stoneWidth * 0.5;
    const gemHalfH = spec.world.stoneLength * 0.5;
    const gemBoundingR = Math.max(gemHalfW, gemHalfH);
    // `gemR` remains the X-axis base radius used by elliptical setting rails.
    // Y is produced by `prongScaleY`, so elongated stones are not double-scaled.
    const gemR = gemHalfW;
    const nominalDepth = stoneDepthMetrics(1, shape);
    const nominalTotal = Math.max(1e-6, nominalDepth.crownH + nominalDepth.pavilionH);
    const crownH = spec.world.stoneDepth * (nominalDepth.crownH / nominalTotal);
    const pavilionH = spec.world.stoneDepth * (nominalDepth.pavilionH / nominalTotal);

    // ---- ring shank: independent from stone carat -------------------------
    // makeBandGeometry sweeps an ellipse from radial offset 0..bandWidth, so
    // bandMajorR is the physical finger-hole radius.
    const bandMajorR = spec.world.ringInnerRadius;
    const bandWidth = spec.world.shankThickness; // radial wall thickness
    const bandHeight = spec.world.shankWidth;    // axial width along finger
    const bandTopY = bandMajorR + bandWidth * 0.5; // camera-facing crown line
    const bandOuterR = bandMajorR + bandWidth;     // radial outer surface
    const bandTopZ = bandHeight * 0.5;

    // ---- center-stone placement -------------------------------------------
    // The head is welded to the radial OUTER surface, not the shank centreline.
    const gemY = bandOuterR;
    const gemZ = pavilionH + spec.world.culetClearance;

    // ---- setting hardware --------------------------------------------------
    const prongCount = spec.setting.prongCount;
    // addCurvedProng historically multiplies its radius by 1.18 at the base;
    // normalize so the resulting forged base matches the physical diameter.
    const prongRadius = spec.world.prongBaseRadius / 1.18;
    const prongBaseRadius = spec.world.prongBaseRadius;
    const prongTipRadius = spec.world.prongTipRadius;
    const bearingDepth = spec.world.bearingDepth;
    const prongScaleY = gemHalfH / Math.max(gemHalfW, 1e-6);
    const prongPostR = gemHalfW + prongBaseRadius * 0.18;
    const prongTipR = Math.max(gemHalfW * 0.72, gemHalfW - bearingDepth);
    const prongBaseZ = Math.max(0.02, gemZ - pavilionH * 0.30);
    const prongTipZ = gemZ + crownH * 0.72;

    const basketUpperR = Math.max(gemHalfW * 0.88, prongPostR - prongBaseRadius * 0.35);
    const basketLowerR = Math.max(gemHalfW * 0.66, basketUpperR * 0.76);
    const basketUpperZ = prongBaseZ;
    const basketLowerZ = 0;
    const galleryRadius = spec.world.galleryRailRadius;

    // ---- halo: real melee diameter + physical gap -------------------------
    const haloStoneR = spec.world.haloStoneRadius;
    const haloGap = spec.world.haloGap;
    const haloHalfW = gemHalfW + haloGap + haloStoneR;
    const haloHalfH = gemHalfH + haloGap + haloStoneR;
    const haloRadius = haloHalfW; // legacy X-axis base radius
    const haloZ = gemZ;
    // Ramanujan ellipse perimeter; arc-length packing avoids bunching at tips.
    const a = Math.max(haloHalfW, haloHalfH);
    const b = Math.min(haloHalfW, haloHalfH);
    const h = Math.pow(a - b, 2) / Math.pow(a + b, 2);
    const haloPerimeter = Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
    const autoHaloCount = Math.max(8, Math.floor(haloPerimeter / Math.max(haloStoneR * 2.12, 1e-4)));
    const haloCount = spec.halo.count > 0 ? spec.halo.count : autoHaloCount;

    // ---- side stones -------------------------------------------------------
    const sideRatio = 0.55;
    const sideGemR = gemHalfW * sideRatio;
    const sideGemHalfH = gemHalfH * sideRatio;
    const sideBoundingR = Math.max(sideGemR, sideGemHalfH);
    const sideCrownH = crownH * sideRatio;
    const sidePavilionH = pavilionH * sideRatio;
    const metalGap = Math.max(mmToWorld(0.25), gemBoundingR * 0.045);
    const sideChord = gemBoundingR + sideBoundingR + metalGap;
    const sideΔθ = 2 * Math.asin(Math.min(0.92, sideChord / Math.max(2 * bandTopY, 1e-4)));
    const sideAngles = [Math.PI / 2 + sideΔθ, Math.PI / 2 - sideΔθ];
    const sideCulet = Math.max(mmToWorld(0.25), bandTopZ * 0.20);
    const sideRingR = bandTopY;
    const sideZ = bandTopZ + sidePavilionH + sideCulet;
    const sideStones = sideAngles.map((ang) => ({
      ang,
      x: Math.cos(ang) * sideRingR,
      y: Math.sin(ang) * sideRingR,
      z: sideZ,
      gemR: sideGemR,
      crownH: sideCrownH,
      pavilionH: sidePavilionH,
      meshSize: Math.max(sideGemR, sideGemHalfH),
      prongCount: 4,
      prongPostR: sideGemR * 1.03,
      prongTipR: sideGemR * 0.92,
      prongBaseZ: sideZ - sidePavilionH * 0.5,
      prongTipZ: sideZ + sideCrownH * 0.72,
      prongRadius: prongRadius * 0.75
    }));

    // ---- pavé / channel ----------------------------------------------------
    const meleeDiameterMm = Math.min(1.35, Math.max(0.90, spec.ring.shankWidthMm * 0.46));
    const paveStoneSize = mmToWorld(meleeDiameterMm * 0.5);
    const paveArc = paveStoneSize * 2.08;
    const headClearance =
      (state.setting === "Cathedral" ? 0.16 : 0) +
      (state.hiddenHalo ? 0.08 : 0);
    const paveAngStart = sideΔθ + paveArc / Math.max(bandTopY, 1e-4) * 0.6 + headClearance;
    const paveAngEnd = Math.PI - paveAngStart;
    const paveAngSpan = Math.max(0.1, paveAngEnd - paveAngStart);
    const paveCount = Math.max(6, Math.floor((bandTopY * paveAngSpan) / Math.max(paveArc, 1e-4)));
    const paveRowGap = Math.min(paveStoneSize * 0.96, bandWidth * 0.54);
    const paveBeadR = paveStoneSize * 0.36;

    return {
      spec,
      physical: physicalMetadata(spec),
      S, W, shape,
      gemR, gemBoundingR, gemHalfW, gemHalfH, crownH, pavilionH,
      meshHalfDia: gemHalfW,
      stoneSpec: spec.centerStone,
      gemPos: { x: 0, y: gemY, z: gemZ },
      bandMajorR, bandWidth, bandHeight, bandTopY, bandOuterR, bandTopZ,
      prongCount, prongRadius, prongBaseRadius, prongTipRadius, bearingDepth,
      prongPostR, prongTipR, prongBaseZ, prongTipZ, prongScaleY,
      basketUpperR, basketLowerR, basketUpperZ, basketLowerZ, galleryRadius,
      haloStoneR, haloGap, haloHalfW, haloHalfH, haloRadius, haloZ, haloCount,
      sideStones, sideΔθ,
      paveStoneSize, paveAngStart, paveAngEnd, paveCount, paveRowGap, paveBeadR
    };
  }

  // Tapered-tube sweep along a 3-point quadratic Bezier. Radius interpolates
  // linearly from baseRadius at t=0 to tipRadius at t=1 so prongs forge
  // thicker at the solder joint and thinner at the claw — matching how a
  // jeweller files a hand-forged claw arm.
  // (Realism Engine §2: curvature + thickness penalties on the band/prong
  // skeleton. A straight cylinder is the dead-flat zero-curvature solution,
  // a clear "CGI" tell.)
  function makeTaperedTube(p0, p1, p2, baseRadius, tipRadius, material, axial = 18, radial = 12) {
    const curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
    const frames = curve.computeFrenetFrames(axial, false);
    const cols = axial + 1;
    const positions = new Float32Array(cols * radial * 3);
    for (let i = 0; i < cols; i += 1) {
      const t = i / axial;
      const p = curve.getPoint(t);
      const N = frames.normals[i];
      const B = frames.binormals[i];
      const r = baseRadius * (1 - t) + tipRadius * t;
      for (let j = 0; j < radial; j += 1) {
        const a = (j / radial) * Math.PI * 2;
        const ca = Math.cos(a), sa = Math.sin(a);
        const idx = (i * radial + j) * 3;
        positions[idx + 0] = p.x + r * (ca * N.x + sa * B.x);
        positions[idx + 1] = p.y + r * (ca * N.y + sa * B.y);
        positions[idx + 2] = p.z + r * (ca * N.z + sa * B.z);
      }
    }
    const indices = new Uint32Array(axial * radial * 6);
    let k = 0;
    for (let i = 0; i < axial; i += 1) {
      for (let j = 0; j < radial; j += 1) {
        const jn = (j + 1) % radial;
        const a =  i      * radial + j;
        const b = (i + 1) * radial + j;
        const c = (i + 1) * radial + jn;
        const d =  i      * radial + jn;
        indices[k++] = a; indices[k++] = b; indices[k++] = c;
        indices[k++] = a; indices[k++] = c; indices[k++] = d;
      }
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setIndex(new THREE.BufferAttribute(indices, 1));
    // UVs (Realism §3): U along the prong axis, V around the tube. With
    // anisotropyRotation = 0 this makes the polish-wheel highlight streak
    // ALONG the prong post — the way real forged claws read under light.
    const uvs = new Float32Array(cols * radial * 2);
    for (let i = 0; i < cols; i += 1) {
      for (let j = 0; j < radial; j += 1) {
        const u = i / axial;       // 0..1 base -> tip
        const v = j / radial;      // 0..1 around the tube
        const uvIdx = (i * radial + j) * 2;
        uvs[uvIdx + 0] = u;
        uvs[uvIdx + 1] = v;
      }
    }
    geom.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geom.computeVertexNormals();
    return new THREE.Mesh(geom, material);
  }

  // Curved prong: a tapered tube from (baseR, baseZ) on the prong circle up
  // to a tip inset radially toward the gem at (tipR, tipZ). The arm bows
  // slightly OUTWARD at mid-height (the natural shape of a forged claw
  // springing from a gallery rail before it curls back over the crown),
  // and tapers from thicker at the solder joint to thinner at the claw.
  function addCurvedProng(group, centerX, centerY, ang, baseR, tipR, baseZ, tipZ, radius, scaleY, material, opts = {}) {
    const cosA = Math.cos(ang);
    const sinA = Math.sin(ang);
    const guardRadiusAt = (z, tubeRadius = radius) => safeSettingRadiusAtZ(ang, z, {
      stoneSize: opts.stoneSize,
      stoneZ: opts.stoneZ,
      shape: opts.shape || currentState.shape,
      scaleY,
      tubeRadius,
      margin: Math.max(0.002, radius * 0.28),
      physicalHalfWidth: opts.physicalHalfWidth || 0,
      physicalCrownH: opts.physicalCrownH || 0,
      physicalPavilionH: opts.physicalPavilionH || 0
    });
    const safeBaseR = Math.max(baseR, guardRadiusAt(baseZ, radius * 1.18));
    const safeTipR = Math.max(tipR, guardRadiusAt(tipZ, radius * 0.82));
    const base = new THREE.Vector3(
      centerX + cosA * safeBaseR,
      centerY + sinA * safeBaseR * scaleY,
      baseZ
    );
    const tip = new THREE.Vector3(
      centerX + cosA * safeTipR,
      centerY + sinA * safeTipR * scaleY,
      tipZ
    );
    // Bezier control point: midpoint pulled radially OUTWARD by ~7% of the
    // base radius. This gives the arm a subtle outward bow before the
    // claw curls in — the diagnostic detail of a real forged prong.
    const midZ = (baseZ + tipZ) * 0.5;
    const midR = Math.max(safeBaseR * 1.04, safeTipR + radius * 1.1, guardRadiusAt(midZ, radius * 1.05));
    const ctrl = new THREE.Vector3(
      centerX + cosA * midR,
      centerY + sinA * midR * scaleY,
      midZ
    );
    const forgedBaseRadius = opts.prongBaseRadius || radius * 1.18;
    const forgedTipRadius = opts.prongTipRadius || radius * 0.82;
    const post = makeTaperedTube(base, ctrl, tip, forgedBaseRadius, forgedTipRadius, material);
    group.add(post);

    // Solder joint: a tiny torus where the prong springs from the gallery
    // rail, hiding the seam between tube and basket. Slightly larger than
    // the (now thicker) prong base so it reads as a proper fillet.
    const solder = new THREE.Mesh(
      new THREE.TorusGeometry(forgedBaseRadius * 1.18, forgedBaseRadius * 0.38, 8, 20),
      material
    );
    solder.position.copy(base);
    // Lay the torus flat so its ring axis matches the local prong direction
    // at the base (= tangent to the curve at t=0 ≈ ctrl − base).
    const dir = new THREE.Vector3().subVectors(tip, base).normalize();
    const baseDir = new THREE.Vector3().subVectors(ctrl, base).normalize();
    solder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), baseDir);
    group.add(solder);

    // Claw: a slightly flattened bead tangent to the crown facet. The
    // radius is clamped by safeSettingRadiusAtZ(), so it visually grips the
    // stone without its sphere volume entering the gem mesh.
    const clawZ = tip.z - radius * 0.18;
    const clawR = Math.max(safeTipR - radius * 0.12, guardRadiusAt(clawZ, radius * 1.55) + radius * 0.08);
    const clawCenter = new THREE.Vector3(
      centerX + cosA * clawR,
      centerY + sinA * clawR * scaleY,
      clawZ
    );
    const claw = new THREE.Mesh(
      new THREE.SphereGeometry(forgedTipRadius * 1.55, 20, 16),
      material
    );
    claw.position.copy(clawCenter);
    // Squash along the post direction so the claw reads as a wrap, not ball.
    claw.scale.set(1.05, 1.05, 0.62);
    claw.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    claw.userData.manufacturing = {
      role: "prong-claw",
      bearingDepthMm: opts.bearingDepthMm || null,
      baseDiameterMm: opts.prongBaseRadius ? (opts.prongBaseRadius / WORLD_UNITS_PER_MM) * 2 : null,
      tipDiameterMm: opts.prongTipRadius ? (opts.prongTipRadius / WORLD_UNITS_PER_MM) * 2 : null
    };
    group.add(claw);
  }

  /**
   * Protective V-prong for a pointed outline. A real V-prong is not a round
   * bead placed on the tip: it has one forged stem that branches into two
   * claws wrapping the two edges adjacent to the point. The geometry below
   * follows that assembly and tags the contact for downstream CAD export.
   */
  function addProtectiveVProng(group, G, centerX, centerY, pointAngle, rotation, material) {
    const epsilon = 0.045;
    const point2 = physicalOutlinePoint(G.shape, G.gemHalfW, G.gemHalfH, pointAngle, rotation);
    const before = physicalOutlinePoint(G.shape, G.gemHalfW, G.gemHalfH, pointAngle - epsilon, rotation);
    const after = physicalOutlinePoint(G.shape, G.gemHalfW, G.gemHalfH, pointAngle + epsilon, rotation);
    const tangent2 = after.clone().sub(before).normalize();
    const outward2 = point2.clone().normalize();
    const baseRadius = G.prongBaseRadius;
    const tipRadius = G.prongTipRadius;
    const branchSpan = Math.max(mmToWorld(0.34), tipRadius * 1.25);
    const outerClearance = Math.max(mmToWorld(0.24), baseRadius * 0.58);
    const stemPoint2 = point2.clone().addScaledVector(outward2, outerClearance);

    const base = new THREE.Vector3(
      centerX + stemPoint2.x,
      centerY + stemPoint2.y,
      G.prongBaseZ
    );
    const junction = new THREE.Vector3(
      centerX + stemPoint2.x,
      centerY + stemPoint2.y,
      G.gemPos.z + G.crownH * 0.54
    );
    const stemCtrl = base.clone().lerp(junction, 0.56).add(new THREE.Vector3(
      outward2.x * baseRadius * 0.55,
      outward2.y * baseRadius * 0.55,
      0
    ));
    const stem = makeTaperedTube(
      base,
      stemCtrl,
      junction,
      baseRadius,
      Math.max(tipRadius * 1.08, baseRadius * 0.72),
      material,
      18,
      12
    );
    stem.userData.manufacturing = {
      role: "v-prong-stem",
      pointAngle,
      baseDiameterMm: G.spec.setting.prongBaseDiameterMm
    };
    group.add(stem);

    for (const side of [-1, 1]) {
      const contact2 = point2.clone()
        .addScaledVector(tangent2, branchSpan * side)
        .addScaledVector(outward2, tipRadius * 0.12);
      const contact = new THREE.Vector3(
        centerX + contact2.x,
        centerY + contact2.y,
        G.gemPos.z + G.crownH * 0.43
      );
      const ctrl = junction.clone().lerp(contact, 0.52)
        .add(new THREE.Vector3(outward2.x * tipRadius * 0.45, outward2.y * tipRadius * 0.45, tipRadius * 0.18));
      const arm = makeTaperedTube(
        junction,
        ctrl,
        contact,
        Math.max(tipRadius * 1.02, baseRadius * 0.58),
        tipRadius,
        material,
        12,
        10
      );
      arm.userData.manufacturing = {
        role: "v-prong-arm",
        bearingDepthMm: G.spec.setting.bearingDepthMm,
        tipDiameterMm: G.spec.setting.prongTipDiameterMm,
        protectedShape: G.shape
      };
      group.add(arm);
    }
  }

  function automaticProngLayout(shape, rotation = 0) {
    const rotate = (angles) => angles.map((angle) => angle + rotation);
    switch (shape) {
      case "Pear":
        return {
          regular: rotate([Math.PI / 2 - 1.02, Math.PI / 2 + 1.02, Math.PI / 2 - 2.12, Math.PI / 2 + 2.12]),
          vTips: rotate([Math.PI / 2])
        };
      case "Marquise":
        return {
          regular: rotate([Math.PI * 0.15, Math.PI * 0.85, Math.PI * 1.15, Math.PI * 1.85]),
          vTips: rotate([Math.PI / 2, Math.PI * 1.5])
        };
      case "Heart":
        return {
          regular: rotate([Math.PI * 0.34, Math.PI * 0.66]),
          vTips: rotate([Math.PI * 1.5])
        };
      case "Kite":
        return {
          regular: rotate([0, Math.PI]),
          vTips: rotate([Math.PI / 2, Math.PI * 1.5])
        };
      case "Trillion":
        return {
          regular: [],
          vTips: rotate([Math.PI / 2, Math.PI * 7 / 6, Math.PI * 11 / 6])
        };
      default:
        return null;
    }
  }

  function getBandCrownPoint(angle, majorRadius, bandWidth, bandHeight, style = "Solitaire") {
    const radial = majorRadius + bandWidth * 0.5;
    const twistZ = style === "Twist" ? Math.sin(angle * 3) * 0.06 : 0;
    return new THREE.Vector3(
      Math.cos(angle) * radial,
      Math.sin(angle) * radial,
      bandHeight * 0.5 + twistZ
    );
  }

  function addShoulderRailSupports(parent, centerX, centerY, angle, bandPoint, railZ, span, radius, material) {
    const tangent = new THREE.Vector3(-Math.sin(angle), Math.cos(angle), 0);
    for (const sign of [-1, 1]) {
      const base = bandPoint.clone().addScaledVector(tangent, span * sign);
      const tip = new THREE.Vector3(
        centerX + tangent.x * span * 0.78 * sign,
        centerY + tangent.y * span * 0.78 * sign,
        railZ
      );
      parent.add(makeCylinderBetween(base, tip, radius, material));
    }
  }

  function addRectGalleryFrame(parent, centerX, centerY, angle, z, halfW, halfH, radius, material) {
    const cs = Math.cos(angle);
    const sn = Math.sin(angle);
    const pointAt = (lx, ly, pz = z) => new THREE.Vector3(
      centerX + cs * lx - sn * ly,
      centerY + sn * lx + cs * ly,
      pz
    );
    const corners = [
      pointAt(-halfW, -halfH),
      pointAt(halfW, -halfH),
      pointAt(halfW, halfH),
      pointAt(-halfW, halfH)
    ];
    for (let i = 0; i < corners.length; i += 1) {
      parent.add(makeCylinderBetween(corners[i], corners[(i + 1) % corners.length], radius, material));
    }
    return { corners, pointAt };
  }

  function makeOutlineRail(centerX, centerY, radius, z, tubeRadius, material, options = {}) {
    const {
      shape = currentState.shape,
      rotation = 0,
      scaleY = 1,
      segments = 128
    } = options;
    const cs = Math.cos(rotation);
    const sn = Math.sin(rotation);
    const curve = new THREE.Curve();
    curve.getPoint = (t) => {
      const a = t * Math.PI * 2;
      const [ox, oy] = outlineAt(shape, a, radius);
      return new THREE.Vector3(
        centerX + ox * cs - oy * sn,
        centerY + (ox * sn + oy * cs) * scaleY,
        z
      );
    };
    const rail = new THREE.Mesh(
      new THREE.TubeGeometry(curve, segments, tubeRadius, 12, true),
      material
    );
    rail.castShadow = true;
    return rail;
  }

  // ---------------------------------------------------------------------------
  // ATTACHMENT TEMPLATES
  //
  // bandSurfaceAt(angle, G, style, lateralOffset) is the §2 smooth surface
  // map X(u,v) for the ring shank. The band cross-section is the same
  // ellipse that makeBandGeometry sweeps:
  //
  //   r(v) = bandMajorR + bandWidth/2 + v
  //   z(v) = ±bandHeight/2 · sqrt(1 - (v/(bandWidth/2))²)
  //
  // We use the +z branch because pavé / channel / accent stones live on the
  // camera-facing crown of the shank. This is also the §5 contact anchor:
  // every station stone, bead, seat and rail starts from X(u,v), then lifts
  // only along the local surface normal. No ornament should place itself at
  // raw bandMajorR again, because raw bandMajorR is the inner edge of the
  // swept ellipse, not the crown.
  function bandSurfaceAt(angle, G, style = "Solitaire", lateralOffset = 0, normalLift = 0) {
    const halfW = G.bandWidth * 0.5;
    const halfH = G.bandHeight * 0.5;
    const maxOffset = Math.max(halfW * 0.08, halfW - 0.004);
    const lateral = Math.max(-maxOffset, Math.min(maxOffset, lateralOffset || 0));
    const ratio = halfW > 0 ? lateral / halfW : 0;
    const crownZ = halfH * Math.sqrt(Math.max(0, 1 - ratio * ratio));
    const twistZ = style === "Twist" ? Math.sin(angle * 3) * 0.06 : 0;
    const radial = G.bandMajorR + halfW + lateral;
    const outward = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
    const tangent = new THREE.Vector3(-Math.sin(angle), Math.cos(angle), 0);

    // Ellipse normal from ∇((v/a)^2 + (z/b)^2) in local radial/z space.
    const nr = halfW > 0 ? lateral / (halfW * halfW) : 0;
    const nz = halfH > 0 ? crownZ / (halfH * halfH) : 1;
    const normal = outward.clone().multiplyScalar(nr).add(new THREE.Vector3(0, 0, nz)).normalize();
    const pos = outward.clone().multiplyScalar(radial);
    pos.z = crownZ + twistZ;
    if (normalLift) {
      pos.addScaledVector(normal, normalLift);
    }

    return { pos, tangent, outward, normal, lateral, radial };
  }

  function applyBandSurfaceFrame(object, surface) {
    const zAxis = surface.normal.clone().normalize();
    const xAxis = surface.tangent.clone().normalize();
    const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();
    const basis = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
    object.quaternion.setFromRotationMatrix(basis);
    return object;
  }

  function addBandSurfaceSeat(parent, angle, G, style, lateralOffset, radius, lift = 0.001) {
    const surface = bandSurfaceAt(angle, G, style, lateralOffset, lift);
    const seat = makePaveSeat(surface.pos.x, surface.pos.y, surface.pos.z, radius, angle);
    applyBandSurfaceFrame(seat, surface);
    parent.add(seat);
    return surface;
  }

  function addBandMelee(parent, angle, G, style, lateralOffset, stoneSize, material, liftFactor = 0.10) {
    addBandSurfaceSeat(parent, angle, G, style, lateralOffset, stoneSize * 0.92, 0.001);
    // Pavé/accent stones should read as embedded into drilled seats. Rendering
    // the full brilliant pavilion above the shank made side views show a row
    // of red cones stuck to the band. Use a crown-only flush melee and lift it
    // just enough for the table/crown facets to catch light.
    const flushLift = Math.max(0.0015, stoneSize * Math.min(liftFactor, 0.045));
    const surface = bandSurfaceAt(angle, G, style, lateralOffset, flushLift);
    const gem = makeFlushSetStone(stoneSize, material, "Round");
    gem.position.copy(surface.pos);
    applyBandSurfaceFrame(gem, surface);
    parent.add(gem);
    return { gem, surface };
  }

  function addBandBead(parent, angle, G, style, lateralOffset, radius, material, liftFactor = 0.55) {
    const surface = bandSurfaceAt(angle, G, style, lateralOffset, radius * liftFactor);
    const bead = makePaveBead(surface.pos.x, surface.pos.y, surface.pos.z, radius, material);
    parent.add(bead);
    return bead;
  }

  function makeBandSurfaceRail(G, style, lateralOffset, lift, radius, material, segments = 240) {
    const curve = new THREE.Curve();
    curve.getPoint = (t) => bandSurfaceAt(t * Math.PI * 2, G, style, lateralOffset, lift).pos;
    const rail = new THREE.Mesh(new THREE.TubeGeometry(curve, segments, radius, 14, true), material);
    rail.castShadow = true;
    return rail;
  }

  // bandCrownAt(angle, G) returns the band's crown contact point at
  // angle `angle`. It is the single authoritative source of truth for
  // "where on the band does something attach" — every prong base, tension
  // arm, cathedral ramp, side-stone bezel rail, accent seat and pavé seat
  // must derive its anchor from this helper (NOT from raw bandMajorR or
  // gemPos math), so no component can ever float relative to the band.
  //
  //   pos     – world position on the band's crown surface at that angle
  //   tangent – unit vector along the band's circumference at that point
  //   outward – unit vector pointing radially out of the finger axis
  //   normal  – local crown normal (tilts on off-centre pavé rows)
  //
  // For Knife-Edge bands the outer ridge bulges into a peak; for Twist
  // bands the ridge wobbles in z by sin(3θ)*0.06. Both are encoded here
  // so callers never have to special-case the band style themselves.
  function bandCrownAt(angle, G, style) {
    return bandSurfaceAt(angle, G, style || currentState?.band || "Solitaire", 0, 0);
  }

  function bandOuterSideAt(angle, G) {
    const outward = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
    return {
      pos: outward.clone().multiplyScalar(G.bandMajorR + G.bandWidth),
      tangent: new THREE.Vector3(-Math.sin(angle), Math.cos(angle), 0),
      outward,
      normal: outward.clone()
    };
  }

  // ---------------------------------------------------------------------------
  // COMPONENT INDEX  (every jewelled-piece part the renderer can emit)
  //
  //   BAND parts
  //     makeBandGeometry(majorR, profileW, profileH, style)
  //       — closed comfort-fit elliptical sweep; profile is the cross-section
  //         and the swept circle is the band centerline. Anchor: bandCrownAt.
  //     channel walls (two slim torus rings) — clamp a row of step-cuts
  //     milgrain rails (two rings of beads on ±bandHeight/2 edges)
  //
  //   GEM parts
  //     createBrilliantGeometry / createStepCutGeometry / createPrincessGeometry
  //       — table at gem-local +z, culet at gem-local -pavilionH, girdle at 0.
  //     halo melee (table-up brilliant ring around gem girdle)
  //     hidden-halo melee (table-radial brilliant ring under gem pavilion)
  //
  //   HEAD parts (gem holders)
  //     prong head  — addCurvedProng × N around basket; claws curl over crown
  //     bezel head  — single torus rail at gem girdle
  //     tension head — two flat arms emerging from band shoulders, clamp girdle
  //     trellis head — interlaced 4 prongs + crossing under-pavilion arc bars
  //     basket gallery (addGalleryBasket) — upper + lower rail joined by struts
  //     under-bezel rail (slim torus) — sits directly under side-stone pavilion
  //     cathedral shoulders (cylinders) — bridge band → head bottom
  //     shoulder rail supports (cylinders) — bridge band → side-stone gallery
  //     rectangular gallery frame (4 cylinders) — for baguette / step-cut sides
  //
  //   STATION parts (small melee mounts along the band)
  //     pavé seat (dark circle for drilled hole)
  //     pavé bead (corner bead between adjacent melees)
  //
  //   CHAIN / EARRING parts
  //     chain bead sphere, bail vertical torus, jump ring, link cylinder,
  //     stud post + butterfly back, hoop torus.
  //
  // ASSEMBLY GRAMMAR (parent → child contact rule)
  //
  //   Band.outerRidge[θ]   ←──connects──→   Head.lowerRail[0]   (prong/bezel)
  //   Head.upperRail       ←──connects──→   Prong.post.base     (each prong)
  //   Prong.tip            ←──contact───→   Gem.girdle[θ]
  //   Bezel.rim            ←──contact───→   Gem.girdle (all θ)
  //   Tension.arm.anchor   ←──on band───→   Band.outerRidge[π/2 ± shoulderΔ]
  //   Tension.arm.tip      ←──contact───→   Gem.girdle[E + W]
  //   Cathedral.ramp.base  ←──on band───→   Band.outerRidge[π/2 ± shoulderΔ]
  //   Cathedral.ramp.tip   ←──welds────→   Head.lowerRail[π/2]
  //   SideStone.bezel.rim  ←──contact───→   SideGem.girdle
  //   SideStone.rail       ←──struts───→   Band.outerRidge[sideΔθ]
  //   PaveSeat[θ]          ←──coincident→   Band.crownTop[θ]
  //   PaveBead             ←──between───→   PaveSeat[θ_i] + PaveSeat[θ_{i+1}]
  //   Halo.collar          ←──tangent──→   Gem.girdle.outerR + meleeR
  //   HiddenHalo.melee     ←──tangent──→   Gem.pavilion.surface[θ]
  //   Chain.lowest         ←──coincident→   Bail.top
  //   Bail.bottom          ←──coincident→   Head.lowerRail (pendant)
  //   Lobe (y=0)           ←──pierced──→   Stud.post / DropEarring.jumpRing
  //   JumpRing             ←──link────→   Drop.link.top
  //   Drop.link.bottom     ←──coincident→   Head.lowerRail (drop)
  //
  // INVARIANT: every position in the geometry should be derivable from the
  // attach point of its parent component via one of the templates above.
  // No call site should hand-write coordinates that aren't anchored to a
  // parent component's outer surface.
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // REFERENCE INDEX  (20-piece source catalogue → studio capabilities)
  //
  // Source: Jewelry_Reference_Catalogue_20_Internet_Sourced_Pieces.docx
  // The 20 reference pieces are documented as `ref_R1_*` … `ref_E5_*` entries
  // in DESIGN_PRESETS above. Each preset carries a `catalogue` block with
  // `achievable` ∈ { full, partial, skin-only } and `needsFeature[]`.
  //
  // ACHIEVABLE NOW (procedural renderer reproduces the brief to-spec):
  //   R1  Smoky Halo Statement Ring        — Halo + warm body stone
  //   R2  Vintage Three-Stone Diamond Ring  — Three-Stone + milgrain
  //   R3  Citrine & Diamond Bypass Ring     — Bypass band + colored center
  //   R4  Classic Bridal Solitaire          — Solitaire + Pavé band
  //   R5  Milgrain Halo Diamond Ring        — Halo + Pavé + milgrain
  //   B3  Emerald & Diamond Cuff            — bezel center + accents
  //   B4  Ruby & Diamond Band Bracelet      — channel-set rubies
  //   E2  Aquamarine Pear Drop Pavé         — pear drop + halo + pavé
  //
  // PARTIAL (silhouette + setting match; surface ornament approximated):
  //   B1  Two-Tone Silver Bangle w/ Gold Drop  – needs two-tone material zoning
  //   N3  Amethyst Rope Necklace               – needs twisted-rope chain
  //   N5  Malaya Garnet Statement Necklace     – needs scroll-link front
  //   E1  Diamond Drop w/ Snap-On Covers       – needs enamel cover variants
  //
  // SKIN-ONLY (the SIGNATURE feature of the reference is not a renderer
  // capability yet — the preset emits a plausible substitute but the
  // distinctive ornament is missing):
  //   B2  Charm Story Bracelet      – needs makeCharm(motif) + jump rings
  //   B5  Heritage Enamel Bangle    – needs makeChampleveEnamelPanel
  //   N1  Edwardian Pearl Collar    – needs makeOpenworkScrollPanel
  //   N2  Four-Strand Pearl & Enamel– needs makeMultiStrandPearl + enamel
  //   N4  Freshwater Pearl Lace     – needs iridescent pearl material + lace
  //   E3  Filigree Cone Drops       – needs makeFiligreeCone wire scrollwork
  //   E4  Ancient Granulation Orbs  – needs makeGranulationOrb bead patterns
  //   E5  Lion-Head Twisted Hoops   – needs makeAnimalHeadTerminal sculpt
  //
  // REALISM DELTA  (independent of motif support — what lifts the current
  // renderer above a "CG plastic" look toward photographic reference):
  //
  //   1. Geometry segments: every torus / lathe in jewellery hot-path is at
  //      ≥96 radial segments; verify no setting code drops below 64.
  //   2. Edge bevels: gem girdles and band edges should carry a 0.012mm
  //      micro-bevel — sharp boolean edges read as CG. Use Curve→tubeR≈0.01.
  //   3. Subtle vertex jitter on prong/bezel inner faces (±0.004mm) breaks
  //      the perfect mirror reflection that screams synthetic.
  //   4. HDR IBL is already loaded (studio_small_08_1k.hdr) — verify the
  //      gem material `envMapIntensity` ≥ 1.5 and metal ≥ 1.1.
  //   5. Side-light from below at very low intensity (rim fill) makes
  //      prongs photographically pop instead of looking like extruded prims.
  //   6. Background depth-of-field blur at f/2.8 equivalent — already
  //      handled per backdrop preset; ensure macro view doesn't disable it.
  //   7. Pavé melee should be set in DRILLED HOLES (small dark seat circle
  //      under each bead) — already present via `pavé seat`; confirm the
  //      seat texture renders dark in current lighting.
  //   8. Milgrain bead spacing should equal bead diameter (no gaps, no
  //      overlap). Render-test at Macro view shows whether spacing drifts.
  //
  // The component renderer is sized so that the achievable subset of the
  // reference catalogue passes a "photograph at arm's length" test. The
  // skin-only set needs the listed `makeXxx` generators to be implemented
  // before its catalogue entries can be promoted to full.
  //
  // FIXED-ISSUES LOG (audit pass — placement / intersection / orientation)
  //
  // Each entry below is a real bug that was producing "Roblox-look" output
  // and has been permanently corrected.
  //
  //   [F1] Bezel double-stack
  //        Cause:   addAlgorithmicSetting added a bezel torus at z ≈ gemZ-0.01,
  //                 then the generic basket code unconditionally appended an
  //                 upper rail at z = gemZ - pavilionH*0.30, producing two
  //                 concentric rings 0.05 apart — a visible "collar floating
  //                 above a thinner ring".
  //        Fix:     Bezel branch now emits ONE chunky torus + 4 cardinal
  //                 struts down to a single lower rail welded to band crown,
  //                 then returns early so the generic basket is skipped.
  //
  //   [F2] Channel walls intersecting the stones
  //        Cause:   Wall tori placed at bandMajorR ± channelStoneSize*0.62
  //                 sat INSIDE the princess half-diagonal (~0.92), so the
  //                 metal walls visibly punched through the gem footprint.
  //        Fix:     New offset = channelStoneSize * 1.02 + wallTubeR; walls
  //                 now clamp from outside the stone row, as in real channel
  //                 work.
  //
  //   [F3] Three-Stone side stones table-orientation mismatch
  //        Cause:   Centre stone sits inside a headGroup rotated -π/2 X, so
  //                 its table faces world +Y. Side stones were placed in
  //                 world space with rotation.x = tiltDir*0.10 only — their
  //                 tables faced world +Z. The trio read as "centre stone
  //                 upright, side stones laid flat".
  //        Fix:     Side stones now rotate (-π/2 + tiltDir*0.08, 0, 0); all
  //                 three tables now share the +Y plane.
  //
  //   [F4] Tapered Baguette table-orientation mismatch
  //        Cause:   Same as [F3] — table faced +Z, plus an extra rotateY
  //                 was stacked on top of rotation.set producing double-
  //                 applied yaw.
  //        Fix:     Single rotation.set(-π/2, ang-π/2, ±0.05) locks tables
  //                 to +Y, yaws long axis tangent to band, leans ±3° outward.
  //
  //   [F5] Side-stone chord conversion used wrong circle
  //        Cause:   sideΔθ = 2*asin(sideChord/(2*bandMajorR)) — but the gem
  //                 centre and side gems both sit on the bandTopY circle.
  //                 Using bandMajorR over-estimated angle → tighter packing
  //                 than intended (no intersection, but uneven gap).
  //        Fix:     Denominator now bandTopY.
  //
  //   [F6] Milgrain head trim clipping into halo melee
  //        Cause:   milgrainR = gemR + haloStoneR*2.2 ≈ gemR + 0.075, while
  //                 halo outer melee edge reaches gemR + 2*haloStoneR + 0.012
  //                 ≈ gemR + 0.080. Beads sat INSIDE the halo melees and
  //                 z-fought them.
  //        Fix:     With-halo trim radius = haloRadius + haloStoneR*1.42
  //                 (clear of every halo gem); without-halo radius unchanged.
  //
  //   [F7] Bypass band intersecting main shank
  //        Cause:   Bypass band built at the SAME bandMajorR as the main
  //                 shank then tilted (x, y) — the two shank volumes
  //                 interpenetrated everywhere they overlapped.
  //        Fix:     Bypass band now built at bandMajorR + bandWidth*0.55,
  //                 so it visibly rides OVER the main shank at crossings.
  //
  //   [F8] Necklace halo behind the pendant girdle
  //        Cause:   placeFocalAt called addHalo with z = 0.11 hardcoded
  //                 while pendant girdle sat at z = 0.16 → halo wrapped
  //                 around the pavilion edge instead of ringing the table.
  //        Fix:     Halo z = pendantZ - stoneHalfDia*0.04 (just behind the
  //                 girdle plane). Milgrain trim similarly snapped.
  //
  //   [F9] Halo & accent melee tilted on three axes (Roblox-confetti)
  //        Cause:   addHalo() and addAccentStones() each emitted melee
  //                 with rotation.set(angle*0.3, angle, 0) — every gem
  //                 ended up tilted differently around two axes, reading
  //                 as a ring of randomly-glued chips instead of a
  //                 coherent halo / accent row.
  //        Fix:     Both now use rotation.set(0, 0, angle) — table-up,
  //                 girdle aligned to tangent. Matches real bead-set work.
  //
  //   [F10] Bezel double-stack in addSetting (necklace/bracelet/earring)
  //        Cause:   Same defect as F1 but in the SHARED setting helper:
  //                 addBezel + addGalleryBasket emitted bezel torus AND
  //                 a basket upper rail 0.05 below it. Any bezel-set
  //                 pendant / station / huggie inherited the "floating
  //                 collar" defect (the ring renderer's standalone
  //                 addAlgorithmicSetting had already been fixed in F1).
  //        Fix:     Bezel branch in addSetting now emits ONE bezel +
  //                 4 cardinal struts + 1 lower rail (mirroring F1),
  //                 then returns early.
  //
  //   [F11] Band microdisplacement too aggressive
  //        Cause:   makeBandGeometry perturbed every vertex by 0.85% of
  //                 the band cross-section, intended to break dead
  //                 symmetry but loud enough to read as visible grain
  //                 across the highlight in close-ups (looked like a
  //                 just-cast, not-yet-polished surface).
  //        Fix:     Amplitude reduced to 0.28% — still kills perfect
  //                 mathematical symmetry but no longer visible on
  //                 sweep of the specular highlight.
  //
  //   [F12] Necklace bail edge-on (invisible thin line)
  //        Cause:   bail.rotation.x = π/2 rotated the default torus
  //                 (XY plane, axis Z) so its plane became XZ — edge-on
  //                 to a camera looking down +Z. The bail rendered as a
  //                 thin horizontal sliver instead of a loop.
  //        Fix:     bail.rotation.x = 0.35 (~20° forward tilt). The
  //                 default torus already has its hole facing +Z, so a
  //                 small tilt is all that's needed to read as a 3D
  //                 loop AND let the chain bead sit naturally on top.
  //
  //   [F13] Earring halo & milgrain z behind the gem girdle
  //        Cause:   Hardcoded z = 0.13 (halo) and 0.18 (milgrain) while
  //                 earring gem girdle sat at z = 0.18 — halo wrapped
  //                 the pavilion edge (same defect as F8 for necklaces).
  //        Fix:     Both snapped to earringZ ± a small proportional
  //                 offset (earringHalfDia × 0.04 / 0.02 respectively).
  //
  //   [F14] Default present-pose was a strict elevation
  //        Cause:   targetRotationX = 0.03 (≈ 2°) gave a face-on
  //                 ring silhouette where the stone (table faces +Y)
  //                 is shown in profile and the band is seen edge-on
  //                 as a thin ellipse — no sparkle visible.
  //        Fix:     targetRotationX = -0.38 (≈ 22° forward tip) so the
  //                 stone's table partly faces the camera and the
  //                 band's 3D profile shows. Stays a presentation
  //                 pose, not an awkward angle.
  //
  //   [F15] Bracelet was built in world space, not band-local frame
  //        Cause:   buildBracelet placed every stone, basket, and accent
  //                 directly on the world `group` while the band itself
  //                 had rotation.x = bandTiltX. Consequences:
  //                   • gems' tables faced world +Z instead of the band's
  //                     outward normal (visually wrong direction);
  //                   • prong bases extended along world -Z (toward the
  //                     camera) instead of into the band, so the setting
  //                     "gripped" thin air behind the gem;
  //                   • the focal gem's pavilion penetrated the band
  //                     centreline (offset of `tube + R*0.35` was too
  //                     small once the gem's depth was accounted for);
  //                   • accent stones for the Bangle were positioned on
  //                     the un-tilted XY plane via `addAccentStones`, so
  //                     they floated above the tilted band instead of
  //                     following it.
  //        Fix:     Architectural rebuild. A `bandFrame` Group holds the
  //                 tilt; the band AND every mount live inside it. Each
  //                 mount is a child Group placed at the band's outer
  //                 surface and rotated so its LOCAL +Z = the radial-
  //                 outward direction at that angle. Inside the mount,
  //                 the stone has default orientation (table = local +Z =
  //                 outward) and addSetting works unchanged with prong
  //                 bases at local -Z (into the band). Accents are now
  //                 real mounts too — each carrying its own bezel collar
  //                 fastened to the mount, NEVER floating off it.
  //                 Same architecture applies to Cuff (3/4 arc), Tennis
  //                 (articulated per-link mounts joined by link bars),
  //                 Station (5 inline mounts on a solid band), and
  //                 Bangle (one focal + optional symmetric accent rows).
  //
  //   [F16] Necklace bail was an axis-Z coin, not a real loop
  //        Cause:   The bail torus had its axis along +Z (default torus
  //                 orientation) plus a small `rotation.x = 0.35` tilt.
  //                 With axis = Z the bail's "hole" faced the camera, so
  //                 the chain (which runs along X) couldn't physically
  //                 pass through it; the bail read as a flat coin glued
  //                 below the chain. Compounded by pendantZ = 0.16 sitting
  //                 0.16 in front of the chain/bail plane (z = 0), the
  //                 whole pendant assembly looked detached from the chain.
  //        Fix:     bail.rotation.y = π/2 so the bail axis is along X (the
  //                 chain direction). Bail centre placed at the chain bead
  //                 position so the bead sits INSIDE the loop. pendantZ
  //                 lowered to 0 so the gem is coplanar with the chain
  //                 plane — table still faces +Z (camera) so face-on view
  //                 is unchanged, but the assembly no longer floats in
  //                 profile.
  //
  //   [F17] Necklace Station stones floated in front of the chain
  //        Cause:   stationZ = 0.08 placed each station gem 0.08 in front
  //                 of its chain bead (bead radius ≈ 0.05). Prong bases
  //                 sit at stationZ − stoneSize·0.6, which still landed
  //                 in empty space in front of the bead's front face. No
  //                 bezel collar bridged the gem girdle and the bead, so
  //                 each station read as a floating prong-set stone in
  //                 front of an unmodified chain.
  //        Fix:     stationZ is solved from bead front + true pavilion
  //                 depth, then a thin collar / bead clamps weld the stone
  //                 pad to the chain. The gem touches the chain hardware
  //                 without its pavilion mesh penetrating the bead.
  //
  //   [F18] Chandelier earring links were straight vertical bars
  //        Cause:   The link cylinder connecting the main stone to each
  //                 teardrop was a pure-vertical cylinder at a fixed
  //                 z = 0.10. The main stone sits at z = 0.18 and the
  //                 teardrops at z = 0.12, so both ends of the "link"
  //                 hovered 0.06–0.08 forward / behind their actual gem
  //                 surfaces. The chandelier articulation read as three
  //                 floating bars in front of, not attached to, the gems.
  //        Fix:     Built the link via makeCylinderBetween with start/end
  //                 points snapped to the actual gem girdle extremities
  //                 (Y at gem edge, Z at gem near-face). Links now follow
  //                 the gems' real Z planes and read as physical chains.
  //
  //   [F19] Drop earring front decoration disconnected from post
  //        Cause:   Jump ring at z = 0.04 and vertical link at z = 0.06
  //                 floated ~0.1 in front of the post (whose front face
  //                 exits the lobe at z ≈ −0.04). No metal physically
  //                 bridged the front decoration and the back assembly.
  //        Fix:     Jump ring + link moved to z = 0 (the lobe plane), so
  //                 they are continuous with the post's front face at the
  //                 lobe puncture. The earring now reads as a single
  //                 assembly that pierces the lobe instead of two
  //                 disconnected halves.
  //
  //   [F20] Realism push — Phase 1: post-processing chain + underlight + contact shadow
  //        Cause:   Scene rendered straight to the canvas at LDR through
  //                 AgX. Bright gem specular highlights clipped at 1.0
  //                 with no spill into surrounding metal — the dead
  //                 giveaway of CGI versus real macro photography. No
  //                 vignette, no chromatic dispersion at lens edges, no
  //                 grain to break up perfectly clean gradients. Pavilion
  //                 read as a dark dead zone because every light was
  //                 placed above the piece. Ring also floated with no
  //                 anchoring shadow tying it to the plinth.
  //        Fix:     Added a custom inline post-processing chain:
  //                 (1) Scene renders into an UnsignedByte (LDR-after-AgX)
  //                     render target with depthBuffer. Three.js's AgX
  //                     tone-mapping + sRGB conversion are baked into
  //                     each material's compiled shader and cannot be
  //                     toggled at runtime without forcing a full
  //                     recompile every frame — so we let the scene
  //                     render in tonemapped LDR into the RT and
  //                     bloom/composite operate in LDR. Metal speculars
  //                     and gem table flashes still reach ~0.95–1.0
  //                     after AgX, so the 0.94 bright-pass threshold
  //                     catches every real highlight.
  //                 (2) Bright-pass with soft 0.28 knee.
  //                 (3) Three-mip HalfFloat Gaussian pyramid (½, ¼, ⅛
  //                     scale) with 9-tap separable H/V blur per mip.
  //                 (4) Composite shader stacks scene + bloom (0.32×) +
  //                     radial chromatic aberration (~0.22% scaled by
  //                     r²) + radial vignette (0.5) + per-frame film
  //                     grain (0.012). Composite has toneMapped:false
  //                     and blending:NoBlending to avoid a SECOND AgX
  //                     pass.
  //                 Pixel-ratio cap dropped from 3× to 2× because the
  //                 post chain reads every pixel 7× per frame.
  //                 Added an "underlight" PointLight (warm 0xffeac8,
  //                 intensity 1.6, range 2.4, decay 1.6) at
  //                 (0, −0.55, 0.15) — below and slightly in front of
  //                 the piece — to kick the gem's pavilion and prong
  //                 undersides the way a tracing-paper diffuser does in
  //                 a real jewelry photo booth.
  //                 Added two contact-shadow planes at y=-1.1: a soft
  //                 1.85² halo (opacity 0.7) and a tight 0.95² hot core
  //                 (opacity 0.55), both with transparent radial-gradient
  //                 alpha maps, to anchor the ring to the plinth.
  //                 Specular highlights now bloom into the metal, gem
  //                 facets show subtle prism fringes at high-contrast
  //                 edges, pavilion reads as "lit from within", and the
  //                 piece feels grounded instead of floating.
  //
  //   [F21] Phase 1 black-model regression — HalfFloat scene RT
  //        Cause:   First implementation of the post chain (F20) used
  //                 HalfFloatType for the scene RT to preserve HDR
  //                 precision for bloom. With a depth buffer attached
  //                 and AgX tonemap baked into the material shaders,
  //                 three.js r164 emitted NaN/Inf into half-float
  //                 channels for PBR metal materials, causing the
  //                 entire jewelry model to render as solid RGB(0,0,0)
  //                 while the plinth, sparkles, environment, and post
  //                 chain itself all worked correctly. Symptom: a
  //                 perfectly-silhouetted black model on an otherwise
  //                 photoreal scene. Bypassing the post chain proved
  //                 the geometry/materials were intact; the bug was
  //                 specifically in the RT type.
  //        Fix:     Switched sceneRT to UnsignedByteType. Bloom mips
  //                 stay HalfFloat (no depth attached, no NaN path).
  //                 Lost HDR threshold headroom but speculars still
  //                 hit 0.95+ post-AgX so the 0.94 bright-pass catches
  //                 every real highlight. Bonus: less bandwidth per
  //                 frame, post chain now costs ~1.1ms instead of 1.4ms.
  //
  //   [F22] Ring shank pavé / channel / accent stones on inner wall
  //        Cause:   makeBandGeometry sweeps the band cross-section from
  //                 radial offset 0..bandWidth, so raw bandMajorR is the
  //                 INNER edge of the ellipse. Pavé, eternity, channel,
  //                 and accent stones were positioned at bandMajorR (or
  //                 bandMajorR ± row offsets), which placed them inside
  //                 the finger hole / through the shank instead of on the
  //                 crown. This is exactly the "pavé sticking out from
  //                 the ring instead of aligned along the band" defect.
  //        Fix:     Added bandSurfaceAt(θ, lateral), the §2 surface map
  //                 X(u,v) for the elliptical shank. All band-set stones,
  //                 drilled seats, shared beads, and channel walls now
  //                 derive from X and lift only along the local normal
  //                 (§5 contact/float constraint). bandCrownAt delegates
  //                 to the same solver, so future structural anchors share
  //                 one coordinate system.
  //
  //   [F23] Cross-piece contact audit — unsupported halo/tension/mount/post
  //        Cause:   A few later feature additions still bypassed the shared
  //                 attachment templates: ring halo melee had no continuous
  //                 under-rail, tension arms mixed z=bandTopZ anchors with
  //                 z=0 clamp pads, bracelet mounts used circular normals
  //                 even after the bracelet was oval-scaled, and earring
  //                 posts/hoop stones lacked visible solder bridges.
  //        Fix:     Added outline rails for ring halo/hidden halo, anchored
  //                 tension arms to the radial side of the shank in one
  //                 plane, solved bracelet mount frames from an elliptical
  //                 wrist surface normal, and added earring post/hoop
  //                 bridges so wearable hardware and ornament are one
  //                 continuous assembly.
  //
  //   [F24] Global no-interpenetration guard — prongs / stones / bands
  //        Cause:   Several pieces still used stale approximate depths
  //                 (0.72R / 0.55R) while the actual gem meshes now use
  //                 deeper Tolkowsky / step-cut pavilions. Result: center
  //                 stones could sit too low in bands, pavé pavilions could
  //                 pass through shanks, and curved prong tips could bend
  //                 visibly through the crown.
  //        Fix:     Added stoneDepthMetrics() + safeSettingRadiusAtZ(),
  //                 then routed prongs, gallery rails, bracelet mounts,
  //                 ring band-set stones, channel stones, huggie stones,
  //                 and necklace station stones through those constraints.
  //                 Geometry is now emitted outside the stone envelope and
  //                 lifted by true pavilion depth before it contacts metal.
  //
  //   [F25] Necklace / earring contact solver
  //        Cause:   The chain, earring post, huggie saddle, and chandelier
  //                 links still used visual constants (`pendantZ = 0`,
  //                 `earringZ = 0.18`, `teardropZ = 0.12`) after the gem
  //                 meshes were deepened. Large or elongated stones could
  //                 therefore put their pavilion through chain beads, bails,
  //                 posts, saddles, or connecting links.
  //        Fix:     Necklace pendants now sit forward of the chain plane by
  //                 true pavilion depth, with jump tabs above the solved
  //                 outline boundary. Necklace stations, earring studs,
  //                 drops, huggies, and chandelier teardrops now derive
  //                 front/back hardware planes from stoneDepthMetrics() and
  //                 stonePlanExtentY(), so links/post bridges terminate
  //                 outside the stone envelope.
  //
  //   [F26] Ring side stones read as loose lone diamonds
  //        Cause:   Three-Stone and Tapered Baguette side stones were
  //                 physically placed correctly after F24, but visually had
  //                 only prongs/seat pins. From front view they read as
  //                 standalone gems perched near the shank instead of stones
  //                 cut into a shoulder pocket.
  //        Fix:     Three-Stone side gems now sit inside an oval shoulder
  //                 cup with a metal lip, side rails, dark drilled seat, and
  //                 tapered ramp struts grown from the band. Tapered
  //                 baguettes now get channel walls, an inset seat, and
  //                 ramped end supports. Both side-stone paths also use the
  //                 same contact AO / inclusion / head-shadow treatment as
  //                 the main gem, so the set point reads embedded, not glued.
  //
  //   [F27] Shank melee cones + non-ring black stone spots
  //        Cause:   Band-set pavé/accent/channel stones reused full brilliant
  //                 meshes and were lifted by pavilion depth, so side views
  //                 showed exposed gemstone cones stuck onto the shank instead
  //                 of crown-only stones set into drilled seats. The optical
  //                 head-shadow/prong-kiss overlays were also applied to
  //                 necklaces, earrings, bracelets, and coloured stones, where
  //                 they read as obvious black dots.
  //        Fix:     Added crown-only flush-set melee geometry for ring shank
  //                 stones and channel stones, with the pavilion implied by
  //                 the recessed seat rather than rendered above the metal.
  //                 Head-shadow and prong-kiss overlays now only run on ring
  //                 diamonds, removing the dark spot artifact from non-ring
  //                 pieces and coloured gems.
  //
  // F28 resolves the former bypass defect with makeBypassShankAssembly():
  // a partial lower shank plus two swept over/under arms, preserving the
  // calibrated finger opening without intersecting two complete rings.
  // ---------------------------------------------------------------------------

  function addAlgorithmicSetting(group, G, centerX, centerY, metal) {
    if (currentState.setting === "Bezel") {
      // Bezel: a single chunky torus hugging the girdle. The bezel ring IS
      // the head's upper rail — no separate gallery upper rail (the old
      // code stacked a thin upper torus 0.05 below the bezel, creating a
      // visible double-ring "floating collar" look). Vertical struts drop
      // straight from the bezel rim to the band crown so the bezel is
      // physically welded to the shank.
      const bezelTube = Math.max(mmToWorld(0.52), G.galleryRadius * 0.82);
      const bezelZ = G.gemPos.z - bezelTube * 0.18;
      const setRot = (Number(currentState.setRotation) || 0) * Math.PI / 180;
      const bezelPoints = samplePhysicalOutlineByArcLength(
        G.shape,
        G.gemHalfW + bezelTube * 0.48,
        G.gemHalfH + bezelTube * 0.48,
        Math.max(48, G.prongCount * 12),
        setRot
      ).map((p) => ({ ...p, x: p.x + centerX, y: p.y + centerY }));
      const bezel = makePhysicalOutlineRail(bezelPoints, bezelZ, bezelTube, metal);
      bezel.userData.manufacturing = {
        role: "bezel-wall",
        wallDiameterMm: (bezelTube / WORLD_UNITS_PER_MM) * 2,
        followsStoneOutline: true
      };
      group.add(bezel);

      // Four welded gallery struts sampled by arc length from the real outline.
      const strutR = G.galleryRadius * 0.95;
      for (let i = 0; i < 4; i += 1) {
        const p = bezelPoints[Math.floor((i + 0.5) * bezelPoints.length / 4) % bezelPoints.length];
        const ang = Math.atan2(p.y - centerY, p.x - centerX);
        const top = new THREE.Vector3(p.x, p.y, bezelZ);
        const bot = new THREE.Vector3(
          centerX + Math.cos(ang) * G.basketLowerR,
          centerY + Math.sin(ang) * G.basketLowerR * G.prongScaleY,
          G.basketLowerZ
        );
        group.add(makeCylinderBetween(top, bot, strutR, metal));
      }
      const lowerPoints = samplePhysicalOutlineByArcLength(
        G.shape,
        G.basketLowerR,
        G.basketLowerR * G.prongScaleY,
        48,
        setRot
      ).map((p) => ({ ...p, x: p.x + centerX, y: p.y + centerY }));
      group.add(makePhysicalOutlineRail(lowerPoints, G.basketLowerZ, G.galleryRadius, metal));
      return; // skip the generic basket (which would re-add an upper rail)
    } else if (currentState.setting === "Tension") {
      // Tension: stone suspended between two flat metal arms physically
      // emerging from the band's SHOULDERS (±π/2 from the head angle) and
      // clamping the girdle. The arms used to anchor at
      // (±bandMajorR*0.62, …) which is INSIDE the finger hole — floating
      // metal. Now they anchor at the band's radial outer side in the
      // same z=0 plane as the clamp pads, so the arm, pad, and shank are
      // one continuous tension bridge instead of two offset pieces.
      const gemWorld = new THREE.Vector3(centerX, centerY, 0);
      for (const side of [-1, 1]) {
        const armW = G.gemR * 0.55;      // tangential width of the arm
        const armT = 0.034 * G.W;        // metal thickness (radial)
        const shoulderAng = Math.PI / 2 + side * (Math.PI / 2 - 0.08);
        const anchor = bandOuterSideAt(shoulderAng, G).pos;
        const tip = new THREE.Vector3(
          centerX + side * G.gemR * 1.03,
          centerY,
          0
        );
        const dx = tip.x - anchor.x;
        const dy = tip.y - anchor.y;
        const len = Math.hypot(dx, dy);
        const arm = new THREE.Mesh(makeChamferedBox(len, armW, armT), metal);
        arm.position.set((anchor.x + tip.x) / 2, (anchor.y + tip.y) / 2, 0);
        arm.rotation.z = Math.atan2(dy, dx);
        group.add(arm);
        // Flat clamp pad at the gem's girdle.
        const clampPad = new THREE.Mesh(makeChamferedBox(armT * 1.2, armW, armT * 2.4), metal);
        clampPad.position.set(tip.x, tip.y, 0);
        clampPad.rotation.z = Math.atan2(dy, dx);
        group.add(clampPad);
      }
      // Tiny solder ring at each anchor so the arms read as fused to the
      // band crown rather than ending in a hard butt-joint.
      for (const side of [-1, 1]) {
        const shoulderAng = Math.PI / 2 + side * (Math.PI / 2 - 0.08);
        const anchor = bandOuterSideAt(shoulderAng, G).pos;
        const solder = new THREE.Mesh(
          new THREE.SphereGeometry(0.034 * G.W * 1.15, 16, 12), metal
        );
        solder.position.copy(anchor);
        group.add(solder);
      }
      // Silence the unused gemWorld var (used as a sanity reference if we
      // later add a centre fillet — keeps the symbol live for clarity).
      void gemWorld;
      return; // no gallery basket for tension settings
    } else if (currentState.setting === "Trellis") {
      // Trellis: prongs from opposite shoulders interlace UNDER the gem
      // before curling up to clamp the crown. We render this as 4 prongs
      // with their base points rotated 45° from the gallery posts and an
      // extra mid-control arc segment that crosses the centre line.
      for (let i = 0; i < 4; i += 1) {
        const ang = (Math.PI * 2 * i) / 4 + Math.PI / 4;
        addCurvedProng(
          group, centerX, centerY, ang,
          G.prongPostR, G.prongTipR,
          G.prongBaseZ - G.pavilionH * 0.18, G.prongTipZ,
          G.prongRadius, G.prongScaleY, metal,
          {
            stoneSize: G.meshHalfDia,
            stoneZ: G.gemPos.z,
            shape: G.shape,
            physicalHalfWidth: G.gemHalfW,
            physicalCrownH: G.crownH,
            physicalPavilionH: G.pavilionH,
            prongBaseRadius: G.prongBaseRadius,
            prongTipRadius: G.prongTipRadius,
            bearingDepthMm: G.spec.setting.bearingDepthMm
          }
        );
      }
      // Crossing arc bars: 2 thin metal arcs sweeping under the pavilion.
      for (let i = 0; i < 2; i += 1) {
        const arcAng = i * Math.PI / 2;
        const a = new THREE.Vector3(
          centerX + Math.cos(arcAng) * G.basketUpperR,
          centerY + Math.sin(arcAng) * G.basketUpperR * G.prongScaleY,
          G.basketUpperZ
        );
        const b = new THREE.Vector3(
          centerX - Math.cos(arcAng) * G.basketUpperR,
          centerY - Math.sin(arcAng) * G.basketUpperR * G.prongScaleY,
          G.basketLowerZ - G.pavilionH * 0.15
        );
        group.add(makeCylinderBetween(a, b, G.galleryRadius * 0.9, metal));
      }
    } else {
      // Prongs: bent posts climbing from gallery rail up over the crown.
      // Auto mode uses cut-specific layouts and true V-prongs at vulnerable
      // points. An explicitly requested numeric count keeps the user's evenly
      // spaced layout, except that the manufacturability validator can still
      // warn when a pointed cut is under-protected.
      const setRot = (Number(currentState.setRotation) || 0) * Math.PI / 180;
      const autoLayout = currentState.prongCount === "Auto"
        ? automaticProngLayout(G.shape, setRot)
        : null;
      const regularAngles = autoLayout?.regular || Array.from({ length: G.prongCount }, (_, i) => (
        (Math.PI * 2 * i) / G.prongCount + Math.PI / G.prongCount + setRot
      ));

      for (const ang of regularAngles) {
        addCurvedProng(
          group, centerX, centerY, ang,
          G.prongPostR, G.prongTipR,
          G.prongBaseZ, G.prongTipZ,
          G.prongRadius, G.prongScaleY, metal,
          {
            stoneSize: G.meshHalfDia,
            stoneZ: G.gemPos.z,
            shape: G.shape,
            physicalHalfWidth: G.gemHalfW,
            physicalCrownH: G.crownH,
            physicalPavilionH: G.pavilionH,
            prongBaseRadius: G.prongBaseRadius,
            prongTipRadius: G.prongTipRadius,
            bearingDepthMm: G.spec.setting.bearingDepthMm
          }
        );
      }
      for (const pointAngle of autoLayout?.vTips || []) {
        addProtectiveVProng(group, G, centerX, centerY, pointAngle - setRot, setRot, metal);
      }
    }
    // Gallery basket: two rails at top/bottom + 6 vertical struts.
    const upperRail = new THREE.Mesh(
      new THREE.TorusGeometry(G.basketUpperR, G.galleryRadius, 16, 96),
      metal
    );
    upperRail.position.set(centerX, centerY, G.basketUpperZ);
    upperRail.scale.y = G.prongScaleY;
    const lowerRail = new THREE.Mesh(
      new THREE.TorusGeometry(G.basketLowerR, G.galleryRadius, 16, 96),
      metal
    );
    lowerRail.position.set(centerX, centerY, G.basketLowerZ);
    lowerRail.scale.y = G.prongScaleY;
    group.add(upperRail, lowerRail);
    const strutCount = G.prongCount;
    for (let i = 0; i < strutCount; i += 1) {
      const ang = (Math.PI * 2 * i) / strutCount;
      const top = new THREE.Vector3(
        centerX + Math.cos(ang) * G.basketUpperR,
        centerY + Math.sin(ang) * G.basketUpperR * G.prongScaleY,
        G.basketUpperZ
      );
      const bot = new THREE.Vector3(
        centerX + Math.cos(ang) * G.basketLowerR,
        centerY + Math.sin(ang) * G.basketLowerR * G.prongScaleY,
        G.basketLowerZ
      );
      group.add(makeCylinderBetween(top, bot, G.galleryRadius * 0.85, metal));
    }
  }

  function buildRing() {
    const metal = materialForMetal();
    const warmMetal = /(Yellow|Rose|Champagne|Bronze)/.test(currentState.metal || "");
    const contrastMetalName = warmMetal ? "White Gold" : "Yellow Gold";
    // A genuine two-tone ring uses distinct alloy zones. The shank retains the
    // chosen alloy; the head, gallery and halo hardware use the contrasting
    // alloy. This creates separate F0 responses instead of a cosmetic sheen.
    const settingMetal = currentState.twoTone
      ? materialForMetal(contrastMetalName, currentState.karat === "950" ? "18K" : currentState.karat)
      : metal;
    const meleeMaterial = materialForStone(0.3);  // §3/§11 melée-scale absorption
    const group = new THREE.Group();
    const style = currentState.band || "Solitaire";
    const G = computeRingGeometry(currentState);

    // The physical halo gap/count are already solved in computeRingGeometry.
    // Keep only the legacy prong-height art-direction multiplier.
    const prongHeightMul = Number(currentState.prongHeight) || 1;
    if (prongHeightMul !== 1) {
      G.prongTipZ = G.prongBaseZ + (G.prongTipZ - G.prongBaseZ) * prongHeightMul;
    }
    // Setting rotation: spins the head (stone + prongs + halo) around the
    // vertical axis. Stone tilt: rocks just the stone within its setting.
    const setRot = (Number(currentState.setRotation) || 0) * Math.PI / 180;
    const stoneTilt = (Number(currentState.stoneTilt) || 0) * Math.PI / 180;

    // ---- band ----
    // The silhouette field swaps the shank profile: a single ring, a
    // wide cigar, two thin parallel rails (split shank), a thinned-out
    // tapered shank, or two stacked rings.
    const silhouette = currentState.silhouette || "Classic Round";
    if (style === "Bypass") {
      group.add(makeBypassShankAssembly(G, metal));
    } else if (silhouette === "Split Shank") {
      const halfH = G.bandHeight * 0.42;
      const rail = makeBandGeometry(G.bandMajorR, G.bandWidth * 0.6, halfH, style);
      const left = new THREE.Mesh(rail, metal);
      const right = new THREE.Mesh(rail, metal);
      left.position.z = -G.bandHeight * 0.55;
      right.position.z = G.bandHeight * 0.55;
      group.add(left, right);
    } else if (silhouette === "Stacked Double") {
      const halfH = G.bandHeight * 0.45;
      const rail = makeBandGeometry(G.bandMajorR, G.bandWidth * 0.82, halfH, style);
      const top = new THREE.Mesh(rail, metal);
      const bot = new THREE.Mesh(rail, metal);
      top.position.z = G.bandHeight * 0.58;
      bot.position.z = -G.bandHeight * 0.58;
      group.add(top, bot);
    } else {
      let bandW = G.bandWidth;
      let bandH = G.bandHeight;
      if (silhouette === "Cigar Band") { bandW *= 1.55; bandH *= 1.45; }
      else if (silhouette === "Tapered Shank") { bandW *= 0.7; bandH *= 0.82; }
      const bandGeometry = makeBandGeometry(G.bandMajorR, bandW, bandH, style);
      const band = new THREE.Mesh(bandGeometry, metal);
      group.add(band);
    }

    // ---- Phase 2: hallmark engraving on inside of band ----
    // Real fine jewelry always carries a karat / maker stamp inside the
    // band. We mount a thin cylindrical patch at the band's inner radius
    // and drive the text via bumpMap on a fresh material instance (sharing
    // the band's metalness/colour so it reads as the same piece of gold).
    // Negative bumpScale makes dark canvas pixels read as recessed — i.e.
    // engraved into the surface. Skipped for silhouettes without a
    // continuous inside surface (split shank / stacked) where it would
    // poke through the metal at z ≠ 0.
    if (style !== "Bypass" && silhouette !== "Split Shank" && silhouette !== "Stacked Double") {
      const karat = currentState.karat || "";
      const metalName = currentState.metal || "";
      const stamp = metalName === "Platinum"
        ? `PT ${karat} \u00b7 TJC`
        : `${karat} \u00b7 TJC \u00b7 AU`;
      const hallmarkTex = createHallmarkTexture(stamp);
      const hallmarkMat = materialForMetal();
      hallmarkMat.bumpMap = hallmarkTex;
      hallmarkMat.bumpScale = -0.004;
      // Strip the band's brushed/hammered normal map on the hallmark patch
      // so the engraved text reads cleanly, not muddied by the surrounding
      // finish texture.
      hallmarkMat.normalMap = null;
      hallmarkMat.normalScale = new THREE.Vector2(0, 0);
      hallmarkMat.roughnessMap = null;
      hallmarkMat.roughness = Math.max(0.45, hallmarkMat.roughness);

      // Cylinder axis defaults to Y; rotateX(π/2) aligns it to the band
      // axis (Z). Radius slightly less than bandMajorR so it sits just
      // inside the elliptical inner surface (band geometry occludes it
      // from the outside; visible only when looking through the ring).
      const hallmarkH = G.bandHeight * 0.55;
      const hallmarkGeo = new THREE.CylinderGeometry(
        G.bandMajorR - 0.001, G.bandMajorR - 0.001,
        hallmarkH, 240, 1, true
      );
      hallmarkGeo.rotateX(Math.PI * 0.5);
      const hallmark = new THREE.Mesh(hallmarkGeo, hallmarkMat);
      hallmark.userData.isHallmark = true;
      group.add(hallmark);
    }

    // ---- milgrain edge: tiny beaded rails along the band's top edges
    // for a vintage Edwardian/Art Deco trim. Cheap to render: just two
    // rings of small spheres at \u00b1bandHeight/2.
    if (currentState.milgrain && style !== "Bypass") {
      const beadR = 0.022 * G.W;
      const beadCount = 96;
      const edgeR = G.bandTopY;
      const edgeZ = G.bandHeight * 0.5 + beadR * 0.18;
      const beadGeo = new THREE.SphereGeometry(beadR, 16, 12);
      for (const sign of [-1, 1]) {
        for (let i = 0; i < beadCount; i += 1) {
          const a = (i / beadCount) * Math.PI * 2;
          const bead = new THREE.Mesh(beadGeo, metal);
          bead.position.set(Math.cos(a) * edgeR, Math.sin(a) * edgeR, sign * edgeZ);
          group.add(bead);
        }
      }
    }

    // ---- head sub-group ----
    // A real engagement ring has the stone's table facing OUTWARD from the
    // band (radially up, away from the finger top) — i.e. perpendicular to
    // the band axis. The head construction code below (stone, prongs,
    // basket, halo, milgrain trim) is all written with the head's "up"
    // direction along its own local +Z. We square that circle by putting
    // the entire head into a sub-group positioned at the band crown and
    // rotated -90° around X, so head-local +Z becomes band-local +Y. The
    // construction code stays unchanged inside the sub-group.
    //
    // Tension settings keep their arms in the band's XY plane (since the
    // arms physically emerge from the band shoulders), but the stone
    // itself is rotated table-up so the ring reads correctly. The stone
    // is lifted above the band crown to sit between the tension arms.
    const isTension = currentState.setting === "Tension";
    const headGroup = isTension ? group : new THREE.Group();
    if (!isTension) {
      headGroup.position.set(G.gemPos.x, G.gemPos.y, 0);
      headGroup.rotation.x = -Math.PI / 2;
      group.add(headGroup);
    }
    // Center-stone local position. For Tension the stone sits above the
    // band at world (0, gemY+gemZ, 0) with table facing world +Y.
    const stoneLocalX = isTension ? G.gemPos.x : 0;
    const stoneLocalY = isTension ? (G.gemPos.y + G.gemPos.z) : 0;
    const stoneLocalZ = isTension ? 0 : G.gemPos.z;
    // Same convention for the setting helper's (centerX, centerY) inputs.
    const headCenterX = isTension ? G.gemPos.x : 0;
    const headCenterY = isTension ? (G.gemPos.y + G.gemPos.z) : 0;

    // ---- center stone ----
    const stoneMesh = new THREE.Mesh(
      createPhysicalCutStoneGeometry(G.stoneSpec, currentState.shape),
      materialForStone()
    );
    stoneMesh.userData.isGem = true;
    stoneMesh.position.set(stoneLocalX, stoneLocalY, stoneLocalZ);
    stoneMesh.rotation.z = setRot;
    // For Tension the stone lives in the main group, so it needs its own
    // -90° X rotation to bring its table up (the headGroup that handles
    // this for other settings is bypassed for Tension).
    stoneMesh.rotation.x = stoneTilt + (isTension ? -Math.PI / 2 : 0);
    stoneMesh.castShadow = true;
    headGroup.add(stoneMesh);

    // ---- head: prongs + basket holding the center stone ----
    addAlgorithmicSetting(headGroup, G, headCenterX, headCenterY, settingMetal);

    // Cathedral shoulders: structural ramps from band up to the head.
    // Base points are derived from bandCrownAt() so they physically sit on
    // the band's outer ridge — the old hardcoded (±0.55*bandMajorR, …)
    // anchors were inside the finger hole and read as floating arches.
    if (currentState.setting === "Cathedral") {
      const tube = 0.028 * G.W;
      const shoulderΔ = 0.62; // ~35° each side of the head
      const baseL = bandCrownAt(Math.PI / 2 + shoulderΔ, G).pos;
      const baseR = bandCrownAt(Math.PI / 2 - shoulderΔ, G).pos;
      // After the head sub-group's -90° X rotation the basket lower rail
      // (head-local z = 0) lives in world at y = bandTopY. The basket
      // circle's ends in head-local ±X map to world ±X. So the head's
      // contact patches sit at world (±basketLowerR, bandTopY, 0).
      const headHalfWidth = G.basketLowerR * 0.92;
      const headL = new THREE.Vector3(-headHalfWidth, G.bandOuterR, 0);
      const headR = new THREE.Vector3( headHalfWidth, G.bandOuterR, 0);
      group.add(
        makeCylinderBetween(baseL, headL, tube, settingMetal),
        makeCylinderBetween(baseR, headR, tube, settingMetal)
      );
    }

    // ---- halo: arc-length packed around the certified stone outline ----
    if (currentState.halo) {
      const haloPoints = samplePhysicalOutlineByArcLength(
        currentState.shape,
        G.haloHalfW,
        G.haloHalfH,
        G.haloCount,
        setRot
      );
      const railPoints = haloPoints.map((p) => ({
        ...p,
        x: p.x + headCenterX,
        y: p.y + headCenterY
      }));
      headGroup.add(makePhysicalOutlineRail(
        railPoints,
        G.haloZ - G.haloStoneR * 0.28,
        G.haloStoneR * 0.22,
        settingMetal
      ));

      for (const point of haloPoints) {
        const gem = makeMeleeStone(G.haloStoneR, meleeMaterial);
        gem.position.set(headCenterX + point.x, headCenterY + point.y, G.haloZ);
        gem.rotation.set(0, 0, point.tangentAngle - Math.PI / 2);
        headGroup.add(gem);
      }

      // Shared beads are placed at the true arc midpoint between adjacent
      // melee, then offset along the local outline normal. This keeps pear and
      // marquise tips from bunching while preserving equal metal gaps.
      const haloBeadR = G.haloStoneR * 0.32;
      const haloBeadZ = G.haloZ + G.haloStoneR * 0.42;
      for (let i = 0; i < haloPoints.length; i += 1) {
        const a = haloPoints[i];
        const b = haloPoints[(i + 1) % haloPoints.length];
        const mx = (a.x + b.x) * 0.5;
        const my = (a.y + b.y) * 0.5;
        let nx = my;
        let ny = -mx;
        const nLen = Math.hypot(nx, ny) || 1;
        nx /= nLen;
        ny /= nLen;
        if (nx * mx + ny * my < 0) { nx *= -1; ny *= -1; }
        const offset = G.haloStoneR * 0.46;
        headGroup.add(makePaveBead(
          headCenterX + mx - nx * offset,
          headCenterY + my - ny * offset,
          haloBeadZ,
          haloBeadR,
          settingMetal
        ));
        headGroup.add(makePaveBead(
          headCenterX + mx + nx * offset,
          headCenterY + my + ny * offset,
          haloBeadZ,
          haloBeadR,
          settingMetal
        ));
      }
    }

    // Milgrain follows the same physical outline rather than a circular angle
    // loop, so bead density stays constant through pointed and elongated cuts.
    if (currentState.finish === "Milgrain Edge") {
      const trimHalfW = currentState.halo
        ? G.haloHalfW + G.haloStoneR * 1.42
        : G.gemHalfW + mmToWorld(0.50);
      const trimHalfH = currentState.halo
        ? G.haloHalfH + G.haloStoneR * 1.42
        : G.gemHalfH + mmToWorld(0.50);
      const approxPerimeter = Math.PI * (3 * (trimHalfW + trimHalfH)
        - Math.sqrt((3 * trimHalfW + trimHalfH) * (trimHalfW + 3 * trimHalfH)));
      const beadR = Math.max(mmToWorld(0.16), 0.018 * G.W);
      const count = Math.max(16, Math.floor(approxPerimeter / Math.max(beadR * 2.2, 1e-4)));
      const points = samplePhysicalOutlineByArcLength(currentState.shape, trimHalfW, trimHalfH, count, setRot);
      const beadGeo = new THREE.SphereGeometry(beadR, 16, 12);
      for (const point of points) {
        const bead = new THREE.Mesh(beadGeo, settingMetal);
        bead.position.set(headCenterX + point.x, headCenterY + point.y, G.gemPos.z + mmToWorld(0.04));
        headGroup.add(bead);
      }
    }

    // ---- band-style ornaments ----
    if (style === "Pavé") {
      // §13 + §5 — Aligned 2×N pavé grid.
      //
      // Real pavé is a STRICT rectangular grid: inner row stone i and outer
      // row stone i share their two corner beads with the (i±1) stones in
      // the OPPOSITE row, so every interior bead is shared between exactly
      // 4 stones. This requires the two rows to occupy IDENTICAL angular
      // positions α_i.
      //
      // The previous loop computed count_inner and count_outer INDEPENDENTLY
      // from each row's own rowR, so count_inner < count_outer (smaller
      // radius packs fewer stones at the same arc-spacing). Result: inner
      // and outer stones at unrelated angles → no shared beads, no grid →
      // visually scattered pavé that doesn't read as a continuous row.
      //
      // Fix: compute a single shared count N from the band CROWN radius
      // (bandTopY), then both rows use α_i = α_start +
      // (i/(N-1))·(α_end-α_start). Each gem is placed on the solved band
      // surface X(α, lateral) and lifted along that surface normal, so
      // the pavé cannot drift inside the finger hole or float above the
      // shank when the band cross-section changes.
      const N = G.paveCount;
      const sharedAngles = new Array(N);
      for (let i = 0; i < N; i += 1) {
        const t = N === 1 ? 0.5 : i / (N - 1);
        sharedAngles[i] = G.paveAngStart + (G.paveAngEnd - G.paveAngStart) * t;
      }
      // §5 — Stone girdle elevation: each stone's girdle center is lifted
      // 0.10× its radius along the crown normal. The pavilion still drops
      // into the drilled seat, but the table/crown facets remain visible.
      const rowOffsets = [-G.paveRowGap * 0.5, +G.paveRowGap * 0.5];
      rowOffsets.forEach((offset) => {
        for (let i = 0; i < N; i += 1) {
          const ang = sharedAngles[i];
          addBandMelee(group, ang, G, style, offset, G.paveStoneSize * 0.98, meleeMaterial, 0.10);
        }
      });
      // 3×(N+1) corner-bead grid: 3 radial rails (inner / centerline / outer)
      // at the GAP angles (i+0.5) of the shared sequence. Every interior
      // bead is shared between 4 stones (2 from each row), so this satisfies
      // the §13 manufacturability invariant for corner-shared pavé.
      const beadRails = [
        -G.paveRowGap * 0.5 - G.paveStoneSize * 0.42, // inner edge
        0,                                             // centerline between rows
        G.paveRowGap * 0.5 + G.paveStoneSize * 0.42    // outer edge
      ];
      // N+1 gap positions (N-1 interior gaps + 2 endpoints extrapolated by
      // half the local spacing) — gives a bead at every stone boundary.
      for (let i = 0; i <= N; i += 1) {
        const a = (i === 0)
          ? sharedAngles[0] - (sharedAngles[1] - sharedAngles[0]) * 0.5
          : (i === N)
            ? sharedAngles[N - 1] + (sharedAngles[N - 1] - sharedAngles[N - 2]) * 0.5
            : (sharedAngles[i - 1] + sharedAngles[i]) * 0.5;
        beadRails.forEach((rr, idx) => {
          // Center rail beads are slightly smaller (they're shared between
          // 4 stones in real pavé, so less metal shows).
          const r = idx === 1 ? G.paveBeadR * 0.82 : G.paveBeadR;
          addBandBead(group, a, G, style, rr, r, metal);
        });
      }
    } else if (style === "Channel") {
      // Channel: a row of step-cut stones sits flush between two raised metal
      // walls. Every stone is now solved from bandSurfaceAt(), not the raw
      // inner-radius bandMajorR, so it follows the shank crown exactly.
      const channelStoneSize = Math.min(G.paveStoneSize * 1.45, G.bandWidth * 0.48);
      const count = Math.max(5, Math.floor((G.bandTopY * (G.paveAngEnd - G.paveAngStart)) / (channelStoneSize * 2.05)));
      for (let i = 0; i < count; i += 1) {
        const t = count === 1 ? 0.5 : i / (count - 1);
        const ang = G.paveAngStart + (G.paveAngEnd - G.paveAngStart) * t;
        addBandSurfaceSeat(group, ang, G, style, 0, channelStoneSize * 1.0, 0.001);
        const channelLift = channelStoneSize * 0.035;
        const surface = bandSurfaceAt(ang, G, style, 0, channelLift);
        const gem = makeFlushSetStone(channelStoneSize * 0.92, meleeMaterial, "Princess");
        gem.position.copy(surface.pos);
        applyBandSurfaceFrame(gem, surface);
        group.add(gem);
      }
      // Two raised walls (torus rings) flanking the row, set proud of the band
      // top so they visibly clamp the row from both sides. They are no
      // longer constant-z torus rings; each rail is a tube following the
      // exact crown surface at its lateral offset.
      const wallR = G.bandWidth * 0.16;
      const wallOffset = Math.min(G.bandWidth * 0.42, channelStoneSize * 0.58 + wallR);
      group.add(
        makeBandSurfaceRail(G, style, -wallOffset, wallR * 0.55, wallR, metal),
        makeBandSurfaceRail(G, style, wallOffset, wallR * 0.55, wallR, metal)
      );
    } else if (style === "Three-Stone") {
      // §2 + §5 — Side stones MUST sit co-planar with the centre stone.
      //
      // The centre stone lives in `headGroup`, which is positioned at
      // (0, bandTopY, 0) and rotated -π/2 about X, so the gem ends up at
      // world (0, bandTopY + gemZ, 0) — i.e. raised by gemZ along the
      // RADIAL direction r̂(π/2) = (0, 1, 0) (radially outward from the
      // finger axis at the top of the band).
      //
      // The previous side-stone block placed the gems in WORLD space at
      // (cos α · sideRingR, sin α · sideRingR, sideZ) where the Y was
      // sin(α)·bandTopY ≈ cos(Δθ)·bandTopY ≈ bandTopY — i.e. NOT raised
      // along the radial direction at all. Result: a gemZ-sized vertical
      // drop in Y between the centre stone and the side stones, visible
      // as "side stones hanging below the head". The forward push in Z
      // compounded the error.
      //
      // Math fix. For each side stone at angle α = π/2 ± Δθ on the band's
      // outer ridge:
      //   1. Band ridge point in world:  p₀ = (cos α, sin α, 0) · bandTopY
      //   2. Radial outward unit:        r̂  = (cos α, sin α, 0)
      //   3. Stone girdle centre:        p₀ + sideGemZ · r̂
      //                                = (cos α, sin α, 0) · (bandTopY + sideGemZ)
      //      → identical raise to the centre stone, just at a different α.
      //   4. Table normal must equal r̂ → rotation Rx(-π/2) Rz(α-π/2)
      //      so the gem's local +Z aligns with r̂.
      //   5. Stone Z (depth toward camera) = 0 (same plane as centre stone).
      //
      // Everything attached to the stone (prongs, under-bezel rail, seat
      // pin, shoulder buttresses) is built inside a sub-group with that
      // position+rotation, so in the sub-group's local frame:
      //   local +Z = radial outward (= "up" toward stone table)
      //   local +X = band tangent at angle α
      //   local +Y = -depth toward camera
      // and the geometry can be written exactly like the centre stone's
      // head (gem at +Z, prongs growing along +Z) without any extra
      // angular bookkeeping. §13 manufacturability: this is identical
      // topology to the centre head, just rotated.
      G.sideStones.forEach((side) => {
        const dTheta = side.ang - Math.PI / 2;            // ±Δθ
        const sideCulet  = Math.max(0.012, G.bandTopZ * 0.25);
        const sideGemZ   = side.pavilionH + sideCulet;    // radial raise
        const railZ_lc   = sideGemZ - side.pavilionH * 0.22;
        const prongTipZL = sideGemZ + side.crownH * 0.55;
        const sideDepth = stoneDepthMetrics(side.meshSize, currentState.shape);
        const sideXExtent = stonePlanEnvelopeRadius(currentState.shape, 0, side.meshSize, sideDepth.girdleScale);
        const sideYExtent = Math.abs(stonePlanExtentY(currentState.shape, side.meshSize, 1, sideDepth.girdleScale));

        const sideAssembly = new THREE.Group();
        // Pivot at band ridge point at angle α (world).
        sideAssembly.position.set(
          Math.cos(side.ang) * G.bandTopY,
          Math.sin(side.ang) * G.bandTopY,
          0
        );
        // R · (0,0,1) = (cos α, sin α, 0) = r̂  →  Euler(-π/2, 0, α-π/2) XYZ.
        sideAssembly.rotation.set(-Math.PI / 2, 0, dTheta);

        // ----- stone (girdle at local z = sideGemZ, table = local +Z)
        const sideStoneGroup = new THREE.Group();
        sideStoneGroup.position.set(0, 0, sideGemZ);
        const sideMesh = new THREE.Mesh(
          createCutStoneGeometry(side.meshSize, currentState.shape), meleeMaterial
        );
        sideMesh.castShadow = true;
        sideMesh.userData.isGem = true;
        sideStoneGroup.add(sideMesh);
        addStoneContactAO(sideStoneGroup, side.meshSize);
        addMaterialInclusions(sideMesh, side.meshSize, currentState.stone);
        sideAssembly.add(sideStoneGroup);

        // ----- embedded shoulder cup
        // The old side-stone anatomy was mechanically correct but visually
        // too isolated: a diamond head on a thin pin. Real three-stone rings
        // blend side stones into a metal pocket grown out of the shank. This
        // cup sits below/outside the pavilion envelope, with side rails and
        // four ramp struts tying it back into the band shoulder.
        const cupX = Math.max(sideXExtent * 1.14, side.gemR * 0.92);
        const cupY = Math.max(sideYExtent * 1.12, side.gemR * 0.74);
        const cupBaseZ = Math.max(sideCulet * 0.42, 0.004);
        const cupRailZ = Math.max(cupBaseZ + G.galleryRadius * 1.8, sideGemZ - side.pavilionH * 0.08);
        const cupRadius = Math.max(cupX, cupY) * 1.02;
        const cupSeat = makePaveSeat(0, 0, cupBaseZ, cupRadius, 0);
        cupSeat.scale.set(cupX / cupRadius, cupY / cupRadius, 1);
        sideAssembly.add(cupSeat);
        const cupLip = new THREE.Mesh(
          new THREE.TorusGeometry(cupRadius, G.galleryRadius * 1.08, 16, 96),
          metal
        );
        cupLip.position.set(0, 0, cupRailZ);
        cupLip.scale.set(cupX / cupRadius, cupY / cupRadius, 1);
        sideAssembly.add(cupLip);
        for (const ySign of [-1, 1]) {
          sideAssembly.add(makeCylinderBetween(
            new THREE.Vector3(-cupX * 1.05, ySign * cupY, cupRailZ),
            new THREE.Vector3( cupX * 1.05, ySign * cupY, cupRailZ),
            G.galleryRadius * 0.95,
            metal
          ));
          for (const xSign of [-1, 1]) {
            sideAssembly.add(makeTaperedTube(
              new THREE.Vector3(xSign * cupX * 1.46, ySign * cupY * 0.48, 0),
              new THREE.Vector3(xSign * cupX * 1.22, ySign * cupY * 0.74, cupRailZ * 0.52),
              new THREE.Vector3(xSign * cupX * 0.94, ySign * cupY, cupRailZ),
              G.galleryRadius * 1.25,
              G.galleryRadius * 0.76,
              metal,
              12,
              10
            ));
          }
        }

        // ----- prongs around stone (identical topology to centre head)
        for (let i = 0; i < side.prongCount; i += 1) {
          const ang = (Math.PI * 2 * i) / side.prongCount + Math.PI / side.prongCount;
          addCurvedProng(
            sideAssembly, 0, 0, ang,
            side.prongPostR, side.prongTipR,
            railZ_lc, prongTipZL,
            side.prongRadius, 1, metal,
            { stoneSize: side.meshSize, stoneZ: sideGemZ, shape: currentState.shape }
          );
        }

        // ----- under-bezel rail (torus in the girdle plane)
        const bezel = new THREE.Mesh(
          new THREE.TorusGeometry(side.gemR * 0.97, G.galleryRadius * 0.95, 12, 72), metal
        );
        bezel.position.set(0, 0, railZ_lc);
        bezel.scale.y = G.prongScaleY;
        sideAssembly.add(bezel);

        // ----- seat pin: tapered tube from band ridge (local origin, on
        // the band's outer surface) straight up the radial direction to
        // the bezel underside. §5 d_G(seat_base, band_ridge) ≡ 0 by
        // construction (base sits AT the ridge point).
        const seatPin = makeTaperedTube(
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0, railZ_lc * 0.5),
          new THREE.Vector3(0, 0, railZ_lc - side.gemR * 0.04),
          side.gemR * 0.34,
          side.gemR * 0.22,
          metal,
          14, 10
        );
        seatPin.castShadow = true;
        sideAssembly.add(seatPin);

        // ----- shoulder buttresses: short tapered struts along the band
        // tangent (local ±X) anchoring the bezel rail back into the band
        // shoulder. Each strut runs from (±span, 0, 0) on the ridge up
        // to (±span·0.78, 0, railZ_lc) on the rail, so its base satisfies
        // §5 contact with the band ridge exactly.
        const buttressSpan = side.gemR * 0.95;
        const buttressR    = G.galleryRadius * 0.78;
        for (const sign of [-1, 1]) {
          const base = new THREE.Vector3(sign * buttressSpan, 0, 0);
          const tip  = new THREE.Vector3(sign * buttressSpan * 0.62, 0, railZ_lc);
          const strut = makeTaperedTube(
            base,
            new THREE.Vector3(sign * buttressSpan * 0.85, 0, railZ_lc * 0.5),
            tip,
            buttressR * 1.05, buttressR * 0.82,
            metal, 12, 10
          );
          strut.castShadow = true;
          sideAssembly.add(strut);
        }

        group.add(sideAssembly);
      });
    } else if (style === "Tapered Baguette") {
      // Two trapezoidal step-cut side stones flanking the center, tables
      // coplanar with the center table. Classic 1950s engagement silhouette.
      // Baguette is created as a flat hexagonal step-cut with tapered outline.
      const bgRatio = 0.42;                        // baguette : center linear ratio
      const bgHalfDia = G.meshHalfDia * bgRatio;
      const bgGap = Math.max(0.020, G.gemR * 0.08);
      // Distance from center stone girdle center to baguette girdle center.
      const bgChord = G.gemR + bgHalfDia * 0.92 + bgGap;
      const bgΔθ = 2 * Math.asin(Math.min(0.92, bgChord / (2 * G.bandTopY)));
      const bgAngles = [Math.PI / 2 + bgΔθ, Math.PI / 2 - bgΔθ];
      bgAngles.forEach((ang, idx) => {
        // §2 + §5 — Same radial-raise fix as Three-Stone. Build the
        // baguette + its gallery frame + corner prongs inside a sub-group
        // pivoted at the band ridge point at angle α, rotated so the
        // sub-group's local +Z = r̂(α) (radial outward). Stone girdle then
        // sits at local z = bgGemZ, raised radially identical to the
        // centre stone (no Y-drop, no Z-forward push).
        const dTheta = ang - Math.PI / 2;
        const bgDepth = stoneDepthMetrics(bgHalfDia, "Emerald");
        const bgPavilionH = bgDepth.pavilionH;
        const bgCulet = Math.max(0.012, G.bandTopZ * 0.25);
        const bgGemZ_lc = bgPavilionH + bgCulet;         // radial raise
        const railZ_lc  = bgGemZ_lc - bgHalfDia * 0.34;

        const bgAssembly = new THREE.Group();
        bgAssembly.position.set(
          Math.cos(ang) * G.bandTopY,
          Math.sin(ang) * G.bandTopY,
          0
        );
        // Same orientation construction as Three-Stone side stones.
        // Add a tiny outward lean (±0.05 rad about local Y) so the long
        // baguette edge tips a hair away from centre — period-accurate.
        bgAssembly.rotation.set(-Math.PI / 2, (idx === 0 ? 1 : -1) * 0.05, dTheta);

        // ----- baguette mesh (table = local +Z, girdle at local z = bgGemZ_lc)
        const bgStoneGroup = new THREE.Group();
        bgStoneGroup.position.set(0, 0, bgGemZ_lc);
        const bgMesh = new THREE.Mesh(createStepCutGeometry(bgHalfDia, "Emerald"), meleeMaterial);
        // Scale the outline narrow + long so it reads as a baguette, not square.
        bgMesh.scale.set(0.55, 1.35, 1);
        bgMesh.castShadow = true;
        bgMesh.userData.isGem = true;
        bgStoneGroup.add(bgMesh);
        addStoneContactAO(bgStoneGroup, bgHalfDia);
        addMaterialInclusions(bgMesh, bgHalfDia, currentState.stone);
        bgAssembly.add(bgStoneGroup);

        // ----- supported baguette gallery: rectangular rail under the
        // stone, in the sub-group's local XY plane at z = railZ_lc.
        const frameHalfW = bgHalfDia * 0.38;
        const frameHalfH = bgHalfDia * 1.10;
        const cornerOffsets = [
          [-frameHalfW, frameHalfH],
          [frameHalfW, frameHalfH],
          [-frameHalfW, -frameHalfH],
          [frameHalfW, -frameHalfH]
        ];
        const corners = cornerOffsets.map(([ox, oy]) => new THREE.Vector3(ox, oy, railZ_lc));
        const galleryR = G.galleryRadius * 0.82;
        for (let i = 0; i < corners.length; i += 1) {
          bgAssembly.add(makeCylinderBetween(corners[i], corners[(i + 1) % corners.length], galleryR, metal));
        }

        // ----- embedded baguette channel
        // Baguette side stones should look channel-set into the shoulder,
        // not like loose rectangular gems. These long rails hug the two
        // long edges outside the step-cut envelope and ramp into the shank.
        const channelZ = Math.max(bgCulet * 0.44, bgGemZ_lc - bgPavilionH * 0.08);
        const channelWallX = frameHalfW * 1.48;
        const channelWallY = frameHalfH * 1.08;
        const channelTube = G.galleryRadius * 1.05;
        const channelRadius = Math.max(channelWallX, channelWallY);
        const channelSeat = makePaveSeat(0, 0, Math.max(bgCulet * 0.36, 0.004), channelRadius, 0);
        channelSeat.scale.set(channelWallX / channelRadius, channelWallY / channelRadius, 1);
        bgAssembly.add(channelSeat);
        for (const xSign of [-1, 1]) {
          bgAssembly.add(makeCylinderBetween(
            new THREE.Vector3(xSign * channelWallX, -channelWallY, channelZ),
            new THREE.Vector3(xSign * channelWallX,  channelWallY, channelZ),
            channelTube,
            metal
          ));
          for (const ySign of [-1, 1]) {
            bgAssembly.add(makeTaperedTube(
              new THREE.Vector3(xSign * channelWallX * 1.32, ySign * channelWallY * 0.66, 0),
              new THREE.Vector3(xSign * channelWallX * 1.12, ySign * channelWallY * 0.84, channelZ * 0.52),
              new THREE.Vector3(xSign * channelWallX, ySign * channelWallY, channelZ),
              G.galleryRadius * 1.18,
              G.galleryRadius * 0.70,
              metal,
              12,
              10
            ));
          }
        }

        // ----- seat pin from band ridge (local origin) straight up to
        // gallery centre (railZ_lc). Same §5 d_G = 0 construction.
        const seatPin = makeTaperedTube(
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0, railZ_lc * 0.55),
          new THREE.Vector3(0, 0, railZ_lc - bgHalfDia * 0.04),
          bgHalfDia * 0.32, bgHalfDia * 0.22,
          metal, 14, 10
        );
        seatPin.castShadow = true;
        bgAssembly.add(seatPin);

        // ----- shoulder buttresses (local ±X tangent struts).
        const bgButtSpan = bgHalfDia * 0.95;
        for (const sign of [-1, 1]) {
          const base = new THREE.Vector3(sign * bgButtSpan, 0, 0);
          const tip  = new THREE.Vector3(sign * bgButtSpan * 0.62, 0, railZ_lc);
          bgAssembly.add(makeTaperedTube(
            base,
            new THREE.Vector3(sign * bgButtSpan * 0.85, 0, railZ_lc * 0.5),
            tip,
            G.galleryRadius * 0.82, G.galleryRadius * 0.62,
            metal, 12, 10
          ));
        }

        // ----- 4 micro-prongs at the baguette corners. Posts from the
        // gallery frame corner up to a flattened claw bead over the
        // crown.
        cornerOffsets.forEach(([ox, oy]) => {
          const base = new THREE.Vector3(ox * 0.96, oy * 0.96, railZ_lc);
          const tip  = new THREE.Vector3(
            ox * 1.01,
            oy * 1.01,
            bgGemZ_lc + bgDepth.crownH * 0.72
          );
          bgAssembly.add(makeCylinderBetween(base, tip, G.prongRadius * 0.52, metal));
          const prong = new THREE.Mesh(
            new THREE.SphereGeometry(G.prongRadius * 0.92, 16, 12), metal
          );
          prong.position.copy(tip);
          bgAssembly.add(prong);
        });

        group.add(bgAssembly);
      });
    } else if (style === "Twist") {
      // Second entwined micro-band offset 180° in twist phase. The twist
      // amplitude is taken from makeBandGeometry's `Math.sin(ang*3)*0.06`.
      const twistBand = new THREE.Mesh(
        makeBandGeometry(G.bandMajorR * 1.005, G.bandWidth * 0.55, G.bandHeight * 0.7, "Twist"),
        metal
      );
      twistBand.rotation.z = Math.PI / 3; // phase shift so the two strands interleave
      group.add(twistBand);
    } else if (style === "Eternity") {
      // Full circumference of melee — a continuous ring of light. Same
      // top-mount + corner-bead treatment as pavé but wrapping 360° with
      // a single dense row (the eternity standard).
      const eternityCount = Math.max(28, Math.floor((Math.PI * 2 * G.bandTopY) / (G.paveStoneSize * 1.95)));
      const angles = [];
      for (let i = 0; i < eternityCount; i += 1) {
        const ang = (Math.PI * 2 * i) / eternityCount;
        angles.push(ang);
        addBandMelee(group, ang, G, style, 0, G.paveStoneSize * 1.02, meleeMaterial, 0.08);
      }
      // Two bead rails (inner + outer girdle line), one bead per stone gap.
      const innerOffset = -G.paveStoneSize * 0.48;
      const outerOffset = G.paveStoneSize * 0.48;
      for (let i = 0; i < angles.length; i += 1) {
        const next = (i + 1) % angles.length;
        let a = (angles[i] + angles[next]) / 2;
        if (next === 0) a += Math.PI;
        addBandBead(group, a, G, style, innerOffset, G.paveBeadR, metal);
        addBandBead(group, a, G, style, outerOffset, G.paveBeadR, metal);
      }
    } else if (style === "Bypass") {
      // The structural bypass shank is emitted in the primary band phase by
      // makeBypassShankAssembly(). No decorative second full ring is added.
    }

    // Accent (small scattered melee on the shank shoulders) — skip for
    // styles that already cover the shoulder.
    if (currentState.accent && style !== "Pavé" && style !== "Channel" && style !== "Three-Stone" && style !== "Eternity" && style !== "Tapered Baguette") {
      // Side-stone density: Sparse halves the row, Dense adds 50 %.
      const densityFactor = currentState.accentDensity === "Sparse" ? 0.5
        : currentState.accentDensity === "Dense" ? 1.5
        : 1;
      const accentCount = Math.max(3, Math.round(10 * densityFactor));
      const accentSize = 0.034 + G.W * 0.003;
      const accentBeadR = accentSize * 0.34;
      // Accent rows sit on the band shoulders. When a halo is active push
      // them further from the head so the outer halo bezel doesn't crowd
      // the first accent stone.
      const accentStart = G.sideΔθ + (currentState.halo ? 0.32 : 0.18);
      const accentEnd = Math.PI - accentStart;
      const innerOffset = -accentSize * 0.45;
      const outerOffset = accentSize * 0.45;

      [accentStart, -accentStart].forEach((shoulderStart) => {
        const shoulderEnd = shoulderStart > 0 ? accentEnd : -accentEnd;
        const angles = [];
        for (let i = 0; i < accentCount; i += 1) {
          const t = i / (accentCount - 1);
          const ang = shoulderStart + (shoulderEnd - shoulderStart) * t;
          angles.push(ang);
          addBandMelee(group, ang, G, style, 0, accentSize, meleeMaterial, 0.08);
        }
        // Corner beads on inner + outer rails at every gap.
        for (let i = 0; i <= angles.length; i += 1) {
          const a = (i === 0) ? angles[0] - (angles[1] - angles[0]) * 0.5
                  : (i === angles.length) ? angles[angles.length - 1] + (angles[angles.length - 1] - angles[angles.length - 2]) * 0.5
                  : (angles[i - 1] + angles[i]) * 0.5;
          addBandBead(group, a, G, style, innerOffset, accentBeadR, metal);
          addBandBead(group, a, G, style, outerOffset, accentBeadR, metal);
        }
      });
    }

    // Hidden Halo: a ring of melee mounted UNDER the center stone's girdle,
    // visible only from profile / 3-quarter — the modern "surprise sparkle"
    // trick used by Tiffany, Brian Gavin et al.
    //
    // Lives INSIDE headGroup so the halo rotates with the head; positions
    // are in head-local coordinates. Each melee is tangent to the pavilion
    // surface (the gem's outline at the appropriate z) instead of using a
    // hardcoded 1.05*gemR which only matched a round center stone and left
    // the melee floating for elongated cuts.
    if (currentState.hiddenHalo) {
      const hiddenStoneR = G.gemR * 0.09;
      const hiddenZ      = G.gemPos.z - G.pavilionH * 0.22;
      // Outline at z = hiddenZ is interpolated between girdle (full outline)
      // and culet (point). z = girdle - 0.22*pavilionH → outline factor 0.78.
      const pavilionFactor = 0.78;
      const hiddenCount  = Math.max(16, Math.round((Math.PI * 2 * G.gemR * pavilionFactor) / (hiddenStoneR * 2.2)));
      headGroup.add(makeOutlineRail(
        headCenterX,
        headCenterY,
        G.gemR * pavilionFactor + hiddenStoneR * 0.55,
        hiddenZ - hiddenStoneR * 0.25,
        hiddenStoneR * 0.22,
        metal,
        {
          shape: currentState.shape,
          rotation: setRot,
          segments: Math.max(96, hiddenCount * 3)
        }
      ));
      for (let i = 0; i < hiddenCount; i += 1) {
        const ang = (Math.PI * 2 * i) / hiddenCount;
        const [ox, oy] = outlineAt(currentState.shape, ang, G.gemR * pavilionFactor + hiddenStoneR + 0.006);
        const rx = ox * Math.cos(setRot) - oy * Math.sin(setRot);
        const ry = ox * Math.sin(setRot) + oy * Math.cos(setRot);
        const gem = makeMeleeStone(hiddenStoneR, meleeMaterial);
        // Position is in head-local; the headGroup rotation will bring it
        // to world. Roll each gem so its table faces radially outward
        // from the centre stone (visible in profile, hidden in plan view).
        gem.position.set(headCenterX + rx, headCenterY + ry, hiddenZ);
        gem.rotation.set(0, Math.PI / 2, ang + setRot);
        headGroup.add(gem);
      }
    }

    group.rotation.x = -0.08;
    group.userData.jewellerySpec = G.spec;
    group.userData.physical = G.physical;
    group.userData.unitsPerMm = WORLD_UNITS_PER_MM;
    group.userData.manufacturingValid = G.spec.validation.valid;
    return enableShadows(group);
  }

  // ====================================================================
  // NECKLACE — Chain link patterns & clasp closures
  // --------------------------------------------------------------------
  // Every emitter consumes a uniform arc-length sample table `chainPath`
  // (array of {x, y} on the screen plane z = 0; spacing Δs ≈ 2·beadSize)
  // and writes geometry into `group`. The §5 no-intersection /
  // no-float invariants are enforced uniformly:
  //   • Every link sits exactly on the centerline (no detached beads).
  //   • Consecutive links touch tangentially — segment length equals
  //     the arc-length step so links kiss.
  //   • Helical / multi-strand patterns (Rope, Byzantine) bound their
  //     cross-section offset inside the link envelope so the chain
  //     never reads as two detached pieces drifting apart.
  //   • Plate / box patterns (Herringbone, Box) project depth strictly
  //     within ±beadSize·tube so they cannot poke through the pendant.
  //   • Clasps anchor AT a curve endpoint with a jump-ring that
  //     physically threads the last link — never floating.
  // --------------------------------------------------------------------
  function _chainTangentAt(chainPath, i) {
    const a = chainPath[Math.max(0, i - 1)];
    const b = chainPath[Math.min(chainPath.length - 1, i + 1)];
    return Math.atan2(b.y - a.y, b.x - a.x);
  }

  function _emitChainCable(group, chainPath, beadSize, _weight, metal) {
    // Bead-and-link cable: sphere bead at each sample + rolo jump-ring
    // threading consecutive beads. Already verified §5-tight via the
    // Δs = 2·R arc-length walk.
    const sphereGeom = new THREE.SphereGeometry(beadSize, 18, 12);
    for (let i = 0; i < chainPath.length; i += 1) {
      const p = chainPath[i];
      const bead = new THREE.Mesh(sphereGeom, metal);
      bead.position.set(p.x, p.y, 0);
      group.add(bead);
    }
    const linkTube = beadSize * 0.22;
    const linkR    = beadSize * 0.78;
    const torusGeom = new THREE.TorusGeometry(linkR, linkTube, 10, 22);
    for (let i = 0; i < chainPath.length - 1; i += 1) {
      const a = chainPath[i], b = chainPath[i + 1];
      const link = new THREE.Mesh(torusGeom, metal);
      link.position.set((a.x + b.x) * 0.5, (a.y + b.y) * 0.5, 0);
      link.rotation.y = Math.PI / 2;
      link.rotation.z = Math.atan2(b.y - a.y, b.x - a.x);
      group.add(link);
    }
  }

  function _emitChainCurb(group, chainPath, beadSize, _weight, metal) {
    // Curb: flat oval links lying parallel to the screen plane, long
    // axis along the local tangent. The torus default hole faces +Z
    // (toward camera), which is exactly the "lay-flat" curb aesthetic.
    // Scale Z compresses depth so plates never poke through the pendant.
    const majorR = beadSize * 1.05;
    const tubeR  = beadSize * 0.28;
    const geom = new THREE.TorusGeometry(majorR, tubeR, 8, 30);
    for (let i = 0; i < chainPath.length - 1; i += 1) {
      const a = chainPath[i], b = chainPath[i + 1];
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const link = new THREE.Mesh(geom, metal);
      link.position.set((a.x + b.x) * 0.5, (a.y + b.y) * 0.5, 0);
      link.scale.set(1.0, 0.62, 0.40);
      link.rotation.z = ang;
      group.add(link);
    }
  }

  function _emitChainBox(group, chainPath, beadSize, _weight, metal) {
    // Box (Venetian): cuboid links abutting along the tangent. Each
    // box's long axis = tangent, side faces square so the chain reads
    // as a sequence of small bricks. Depth is half a beadSize so no
    // intersection with the pendant (which sits at z = pavilionH > 0).
    const boxLen = beadSize * 1.95; // touch-along-tangent at Δs = 2R
    const boxSide = beadSize * 0.95;
    const geom = new THREE.BoxGeometry(boxLen, boxSide, boxSide);
    for (let i = 0; i < chainPath.length - 1; i += 1) {
      const a = chainPath[i], b = chainPath[i + 1];
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const m = new THREE.Mesh(geom, metal);
      m.position.set((a.x + b.x) * 0.5, (a.y + b.y) * 0.5, 0);
      m.rotation.z = ang;
      group.add(m);
    }
  }

  function _emitChainRope(group, chainPath, beadSize, _weight, metal) {
    // Rope: dual helical bead strands twisted around the centerline.
    // Cross-section offset bounded by R = beadSize * 0.55 so the
    // envelope is contained — never reads as two detached strands.
    const R = beadSize * 0.55;
    const beadR = beadSize * 0.62;
    const turnsPerStep = 0.55; // ≈ 0.55 rad twist per arc-step
    const geom = new THREE.SphereGeometry(beadR, 14, 10);
    for (let i = 0; i < chainPath.length; i += 1) {
      const p = chainPath[i];
      const ang = _chainTangentAt(chainPath, i);
      const nx = -Math.sin(ang), ny = Math.cos(ang); // in-plane normal
      const phase = i * turnsPerStep;
      for (let s = 0; s < 2; s += 1) {
        const ph = phase + s * Math.PI;
        const ox = nx * Math.cos(ph) * R;
        const oy = ny * Math.cos(ph) * R;
        const oz = Math.sin(ph) * R;
        const b = new THREE.Mesh(geom, metal);
        b.position.set(p.x + ox, p.y + oy, oz);
        group.add(b);
      }
    }
  }

  function _emitChainSnake(group, chainPath, beadSize, _weight, metal) {
    // Snake: smooth flexible tube along the curve. TubeGeometry built
    // from a Catmull-Rom interpolation of chainPath. Radius half a bead.
    const pts = chainPath.map((p) => new THREE.Vector3(p.x, p.y, 0));
    if (pts.length < 2) return;
    const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);
    const tubeR = beadSize * 0.55;
    const segs = Math.max(64, chainPath.length * 4);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, segs, tubeR, 14, false), metal
    );
    group.add(tube);
    // Subtle articulated rings every few steps — micro-bumps that read
    // as snake-chain "vertebrae" without breaking the smooth silhouette.
    const ringGeom = new THREE.TorusGeometry(tubeR * 1.08, tubeR * 0.18, 8, 16);
    for (let i = 1; i < chainPath.length - 1; i += 2) {
      const p = chainPath[i];
      const ang = _chainTangentAt(chainPath, i);
      const r = new THREE.Mesh(ringGeom, metal);
      r.position.set(p.x, p.y, 0);
      r.rotation.y = Math.PI / 2;
      r.rotation.z = ang;
      group.add(r);
    }
  }

  function _emitChainFigaro(group, chainPath, beadSize, _weight, metal) {
    // Figaro: 3 short + 1 long repeating, ALL rendered as flat ovals
    // lying in the screen plane (curb-style orientation) so the chain
    // visibly reads as a continuous flat-link strip. Long link spans
    // 2 arc-length steps and its diameter is set to match that span so
    // there are no visible gaps between consecutive links (the previous
    // pass used cable-style (axis = tangent) rings which projected as
    // detached bars at every midpoint — the "floating" artefact).
    const tubeR = beadSize * 0.26;
    const stepLen = beadSize * 2.0; // arc-length step ≈ 2·beadSize
    const shortR = stepLen * 0.50;  // 1-step span
    const longR  = stepLen * 1.00;  // 2-step span
    const shortGeom = new THREE.TorusGeometry(shortR, tubeR, 8, 28);
    const longGeom  = new THREE.TorusGeometry(longR,  tubeR, 8, 36);
    let i = 0;
    let count = 0;
    while (i < chainPath.length - 1) {
      const isLong = (count % 4) === 3;
      const span = isLong ? 2 : 1;
      const j = Math.min(chainPath.length - 1, i + span);
      const a = chainPath[i], b = chainPath[j];
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const link = new THREE.Mesh(isLong ? longGeom : shortGeom, metal);
      link.position.set((a.x + b.x) * 0.5, (a.y + b.y) * 0.5, 0);
      // Curb-style flat oval: hole faces camera, long axis along tangent.
      link.scale.set(1, 0.55, 0.40);
      link.rotation.z = ang;
      group.add(link);
      i += span;
      count += 1;
    }
  }

  function _emitChainWheat(group, chainPath, beadSize, _weight, metal) {
    // Wheat (spiga): paired diagonal oval links alternating ±28° about
    // the local tangent so the weave reads as overlapping chevrons.
    const majorR = beadSize * 0.95;
    const tubeR  = beadSize * 0.22;
    const geom = new THREE.TorusGeometry(majorR, tubeR, 8, 24);
    for (let i = 0; i < chainPath.length - 1; i += 1) {
      const a = chainPath[i], b = chainPath[i + 1];
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      for (let s = 0; s < 2; s += 1) {
        const sign = s === 0 ? 1 : -1;
        const link = new THREE.Mesh(geom, metal);
        link.position.set(
          (a.x + b.x) * 0.5,
          (a.y + b.y) * 0.5,
          sign * tubeR * 0.6
        );
        link.scale.set(1, 0.65, 0.5);
        link.rotation.z = ang + sign * 0.49; // ~28° chevron splay
        group.add(link);
      }
    }
  }

  function _emitChainHerringbone(group, chainPath, beadSize, _weight, metal) {
    // Herringbone: thin flat plates lying tangent to the curve, tilted
    // alternately ±26° about the local tangent so they form a V-pattern.
    // Plate depth = beadSize·0.18 → cannot poke through the pendant.
    const plateW = beadSize * 1.95;
    const plateH = beadSize * 0.40;
    const plateD = beadSize * 0.18;
    const geom = new THREE.BoxGeometry(plateW, plateH, plateD);
    for (let i = 0; i < chainPath.length - 1; i += 1) {
      const a = chainPath[i], b = chainPath[i + 1];
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const plate = new THREE.Mesh(geom, metal);
      plate.position.set((a.x + b.x) * 0.5, (a.y + b.y) * 0.5, 0);
      // First rotate about Z to align plate length with tangent, then
      // tilt about local-X (tangent direction) using a quaternion so
      // the tilt is truly about the tangent and not world-X.
      const tiltSign = (i % 2 === 0) ? 1 : -1;
      const qZ = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 0, 1), ang
      );
      const tangent = new THREE.Vector3(Math.cos(ang), Math.sin(ang), 0);
      const qTilt = new THREE.Quaternion().setFromAxisAngle(tangent, tiltSign * 0.45);
      plate.quaternion.copy(qTilt).multiply(qZ);
      group.add(plate);
    }
  }

  function _emitChainByzantine(group, chainPath, beadSize, _weight, metal) {
    // Byzantine: every step gets a two-link cluster — one ring whose
    // axis = tangent (link threads forward), one whose axis = in-plane
    // normal (link threads sideways). The orthogonal pair is the
    // signature woven look. Envelope bounded by R = beadSize so no
    // pendant intersection.
    const R = beadSize * 0.78;
    const tube = beadSize * 0.20;
    const geom = new THREE.TorusGeometry(R, tube, 10, 22);
    for (let i = 0; i < chainPath.length; i += 1) {
      const p = chainPath[i];
      const ang = _chainTangentAt(chainPath, i);
      // Ring A: axis = tangent direction (default torus axis +Z → rotate
      // to +X then yaw to tangent angle).
      const a1 = new THREE.Mesh(geom, metal);
      a1.position.set(p.x, p.y, 0);
      a1.rotation.y = Math.PI / 2;
      a1.rotation.z = ang;
      group.add(a1);
      // Ring B: axis perpendicular to tangent in the plane (rotation
      // about Z only). Default torus axis = +Z so its hole already
      // faces camera; rotate to align hole with in-plane normal: keep
      // axis +Z but rotate about X by π/2 then yaw — easier: rotate
      // about world X by π/2 (hole points +Y), then yaw about Z.
      const a2 = new THREE.Mesh(geom, metal);
      a2.position.set(p.x, p.y, 0);
      a2.rotation.x = Math.PI / 2;
      a2.rotation.z = ang;
      a2.scale.set(0.9, 0.9, 0.9);
      group.add(a2);
    }
  }

  function _emitChainMariner(group, chainPath, beadSize, _weight, metal) {
    // Mariner / anchor: cable-style oval links each bisected by a small
    // crossbar (the anchor crosspiece). Bar sits centered on the link
    // along the tangent direction.
    const majorR = beadSize * 0.95;
    const tubeR  = beadSize * 0.22;
    const linkGeom = new THREE.TorusGeometry(majorR, tubeR, 10, 26);
    const barGeom  = new THREE.CylinderGeometry(tubeR * 0.85, tubeR * 0.85, majorR * 1.55, 10);
    for (let i = 0; i < chainPath.length - 1; i += 1) {
      const a = chainPath[i], b = chainPath[i + 1];
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const mx = (a.x + b.x) * 0.5, my = (a.y + b.y) * 0.5;
      const link = new THREE.Mesh(linkGeom, metal);
      link.position.set(mx, my, 0);
      link.scale.set(1, 0.62, 0.45); // flat oval like curb
      link.rotation.z = ang;
      group.add(link);
      // Crossbar: cylinder default axis +Y → rotate Z by 90° to align
      // with +X then yaw by tangent angle. Place across the oval's hole.
      const bar = new THREE.Mesh(barGeom, metal);
      bar.position.set(mx, my, 0);
      bar.rotation.z = ang + Math.PI / 2;
      group.add(bar);
    }
  }

  const CHAIN_EMITTERS = {
    Cable: _emitChainCable,
    Curb: _emitChainCurb,
    Box: _emitChainBox,
    Rope: _emitChainRope,
    Snake: _emitChainSnake,
    Figaro: _emitChainFigaro,
    Wheat: _emitChainWheat,
    Herringbone: _emitChainHerringbone,
    Byzantine: _emitChainByzantine,
    Mariner: _emitChainMariner
  };

  // ------- Clasp emitters --------------------------------------------
  // Each clasp anchors AT one chain endpoint and adds a matching jump-
  // ring counterpart at the other endpoint so the closure reads as a
  // complete manufactured part. Outward-tangent at the endpoint guides
  // the clasp orientation so it never floats sideways off the curve.

  function _endpointFrame(chainPath, atStart) {
    const N = chainPath.length;
    const p   = atStart ? chainPath[0] : chainPath[N - 1];
    const ref = atStart ? chainPath[1] : chainPath[N - 2];
    let dx = p.x - ref.x, dy = p.y - ref.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    return { x: p.x, y: p.y, tx: dx, ty: dy, ang: Math.atan2(dy, dx) };
  }

  function _addJumpRing(group, frame, weight, metal, R) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(R, R * 0.22, 10, 24), metal
    );
    ring.position.set(frame.x + frame.tx * R * 0.85, frame.y + frame.ty * R * 0.85, 0);
    ring.rotation.y = Math.PI / 2;
    ring.rotation.z = frame.ang;
    group.add(ring);
    return ring;
  }

  function _emitClaspLobster(group, chainPath, weight, metal) {
    // Lobster on RIGHT endpoint, plain jump-ring on LEFT endpoint.
    const right = _endpointFrame(chainPath, false);
    const left  = _endpointFrame(chainPath, true);
    const jrR = 0.030 * weight;
    _addJumpRing(group, right, weight, metal, jrR);
    _addJumpRing(group, left,  weight, metal, jrR);
    // Lobster body: capsule along tangent, with a small claw torus at
    // the tip and a tiny lever box on the side.
    const bodyLen  = 0.085 * weight;
    const bodyR    = 0.022 * weight;
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(bodyR, bodyLen, 6, 14), metal
    );
    const cx = right.x + right.tx * (jrR * 1.7 + bodyLen * 0.5);
    const cy = right.y + right.ty * (jrR * 1.7 + bodyLen * 0.5);
    body.position.set(cx, cy, 0);
    // Capsule default axis = +Y → rotate Z by (ang - π/2) to align with tangent.
    body.rotation.z = right.ang - Math.PI / 2;
    group.add(body);
    // Lever (small box on side of body)
    const lever = new THREE.Mesh(
      new THREE.BoxGeometry(bodyR * 0.7, bodyLen * 0.45, bodyR * 0.7), metal
    );
    lever.position.set(
      cx - right.ty * bodyR * 0.9,
      cy + right.tx * bodyR * 0.9,
      0
    );
    lever.rotation.z = right.ang - Math.PI / 2;
    group.add(lever);
    // Claw opening: a small open torus at the far tip of the capsule
    const tipX = cx + right.tx * (bodyLen * 0.55);
    const tipY = cy + right.ty * (bodyLen * 0.55);
    const claw = new THREE.Mesh(
      new THREE.TorusGeometry(bodyR * 0.85, bodyR * 0.30, 10, 18, Math.PI * 1.4), metal
    );
    claw.position.set(tipX, tipY, 0);
    claw.rotation.z = right.ang;
    group.add(claw);
  }

  function _emitClaspSpringRing(group, chainPath, weight, metal) {
    // Spring-ring: small ring with a slim lever protrusion, matched
    // jump-ring opposite end.
    const right = _endpointFrame(chainPath, false);
    const left  = _endpointFrame(chainPath, true);
    const jrR = 0.026 * weight;
    _addJumpRing(group, left, weight, metal, jrR);
    const ringR = 0.040 * weight;
    const ringTube = ringR * 0.20;
    const cx = right.x + right.tx * (ringR + jrR * 0.6);
    const cy = right.y + right.ty * (ringR + jrR * 0.6);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(ringR, ringTube, 10, 28), metal
    );
    ring.position.set(cx, cy, 0);
    ring.rotation.y = Math.PI / 2;
    ring.rotation.z = right.ang;
    group.add(ring);
    // Lever: thin bar tangent to ring
    const lever = new THREE.Mesh(
      new THREE.BoxGeometry(ringR * 0.65, ringTube * 1.8, ringTube * 1.6), metal
    );
    lever.position.set(
      cx + right.tx * ringR * 0.6,
      cy + right.ty * ringR * 0.6,
      ringR * 0.45
    );
    lever.rotation.z = right.ang;
    group.add(lever);
    // Connector jump ring (the chain-end ring on the clasp itself)
    _addJumpRing(group, right, weight, metal, jrR);
  }

  function _emitClaspToggle(group, chainPath, weight, metal) {
    // Toggle: T-bar at LEFT endpoint, big O-ring at RIGHT endpoint.
    const right = _endpointFrame(chainPath, false);
    const left  = _endpointFrame(chainPath, true);
    // Big O-ring
    const oR = 0.060 * weight;
    const oTube = oR * 0.18;
    const ox = right.x + right.tx * (oR + 0.01);
    const oy = right.y + right.ty * (oR + 0.01);
    const oRing = new THREE.Mesh(
      new THREE.TorusGeometry(oR, oTube, 10, 36), metal
    );
    oRing.position.set(ox, oy, 0);
    oRing.rotation.y = Math.PI / 2;
    oRing.rotation.z = right.ang;
    group.add(oRing);
    // T-bar: cylinder with a small loop at its midpoint where the chain
    // joins. Length ≈ 1.7·oR so it cannot slip through the ring when
    // perpendicular (real toggle geometry).
    const barLen = oR * 1.7;
    const barR = oTube * 1.1;
    const bar = new THREE.Mesh(
      new THREE.CylinderGeometry(barR, barR, barLen, 12), metal
    );
    const lx = left.x + left.tx * barR * 1.5;
    const ly = left.y + left.ty * barR * 1.5;
    bar.position.set(lx, ly, 0);
    // Cylinder axis +Y → rotate to be perpendicular to tangent (so it
    // visually crosses the O-ring). Perpendicular angle = ang + π/2 - π/2 = ang.
    bar.rotation.z = left.ang;
    group.add(bar);
    // Small loop at bar midpoint connecting to chain end
    const loop = new THREE.Mesh(
      new THREE.TorusGeometry(barR * 1.6, barR * 0.35, 8, 14), metal
    );
    loop.position.set(left.x, left.y, 0);
    loop.rotation.y = Math.PI / 2;
    loop.rotation.z = left.ang;
    group.add(loop);
  }

  function _emitClaspBox(group, chainPath, weight, metal) {
    // Box clasp: small rectangular box with a tongue on one side,
    // visible as two abutting boxes at the right endpoint. Plain jump
    // ring at the other end.
    const right = _endpointFrame(chainPath, false);
    const left  = _endpointFrame(chainPath, true);
    _addJumpRing(group, left, weight, metal, 0.026 * weight);
    const w = 0.060 * weight, h = 0.038 * weight, d = 0.022 * weight;
    const cx = right.x + right.tx * (w * 0.55 + 0.005);
    const cy = right.y + right.ty * (w * 0.55 + 0.005);
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), metal);
    box.position.set(cx, cy, 0);
    box.rotation.z = right.ang;
    group.add(box);
    // Tongue (thin protruding lip)
    const tongueLen = w * 0.45;
    const tongue = new THREE.Mesh(
      new THREE.BoxGeometry(tongueLen, h * 0.4, d * 0.6), metal
    );
    const tx = cx + right.tx * (w * 0.5 + tongueLen * 0.5);
    const ty = cy + right.ty * (w * 0.5 + tongueLen * 0.5);
    tongue.position.set(tx, ty, 0);
    tongue.rotation.z = right.ang;
    group.add(tongue);
    _addJumpRing(group, right, weight, metal, 0.020 * weight);
  }

  function _emitClaspSHook(group, chainPath, weight, metal) {
    // S-hook: bent wire S, approximated as two half-torus arcs.
    const right = _endpointFrame(chainPath, false);
    const left  = _endpointFrame(chainPath, true);
    _addJumpRing(group, left, weight, metal, 0.024 * weight);
    const armR = 0.030 * weight;
    const wire = armR * 0.18;
    const arc = new THREE.TorusGeometry(armR, wire, 8, 18, Math.PI);
    // First half: centered just outside right endpoint
    const cx1 = right.x + right.tx * (armR + 0.006);
    const cy1 = right.y + right.ty * (armR + 0.006);
    const half1 = new THREE.Mesh(arc, metal);
    half1.position.set(cx1, cy1, 0);
    half1.rotation.y = Math.PI / 2;
    half1.rotation.z = right.ang + Math.PI / 2;
    group.add(half1);
    // Second half: offset further out, mirrored
    const cx2 = cx1 + right.tx * armR * 2;
    const cy2 = cy1 + right.ty * armR * 2;
    const half2 = new THREE.Mesh(arc, metal);
    half2.position.set(cx2, cy2, 0);
    half2.rotation.y = Math.PI / 2;
    half2.rotation.z = right.ang - Math.PI / 2;
    group.add(half2);
  }

  const CLASP_EMITTERS = {
    Lobster: _emitClaspLobster,
    "Spring Ring": _emitClaspSpringRing,
    Toggle: _emitClaspToggle,
    Box: _emitClaspBox,
    "S-Hook": _emitClaspSHook,
    Hidden: () => {}
  };

  function buildNecklace() {
    // ====================================================================
    // NECKLACE — Physical anatomy & component index
    // --------------------------------------------------------------------
    // The necklace hangs from the wearer's neck and the front-facing side
    // of every component faces the camera (+Z). Unlike the ring/bracelet,
    // there is no body curvature to align to: every gem table just faces
    // world +Z. Components:
    //
    //   group  (returned, scaled by 1.18)
    //     ├── chain: row of `beadCount` SphereGeometry beads laid out along
    //     │           a parametric curve `chainPath(t)` whose shape is
    //     │           silhouette-driven (Choker = shallow arc, Y-Drop = arc
    //     │           with a low cusp, Lariat = two crossing strands,
    //     │           Pendant/Station = wide low arc). Bead size = beadSize.
    //     ├── focal mount(s)  (placeFocalAt(x, y, scale, addBail))
    //     │     • Bail: vertical TorusGeometry below the chain bead, axis
    //     │       aligned to the chain so the bead passes through the hole
    //     │       with clearance.
    //     │     • Pendant: makeStone at z = true pavilion depth + clearance
    //     │       so the stone back clears the chain/bail plane. A jump tab
    //     │       sits above the outline boundary, never through the stone.
    //     │     • Setting: addSetting at (x, focalY, pendantZ - R*0.18) so
    //     │       prong bases sit just behind the pendant girdle and tips
    //     │       grip the crown (centerZ→stoneZ convention, see addSetting).
    //     │     • Halo + milgrain: coplanar with the pendant girdle, NOT
    //     │       hardcoded z values (F8 fix).
    //     └── silhouette-specific extras: Y-Drop's extra drop-chain ending
    //         in the bail; Lariat's knot-bead + two terminal stones;
    //         Station's 5 inline stones bezel-set ON the chain (no bail).
    //
    // Coordinate convention (matches earring/pendant front-facing pieces):
    //     +Z = toward camera (table direction for every focal stone)
    //     +Y = up (necklace top, where the chain anchors)
    //     -Y = down (where the pendant hangs)
    //     +X = wearer's left (the chain spans symmetrically around X = 0)
    // ====================================================================
    const metal = materialForMetal();
    const meleeMat = materialForStone(0.3);  // §3/§11 necklace melée absorption
    const group = new THREE.Group();
    const weight = weightValue();
    const spec = pieceSpec();
    // Link outer radius from the true chain wire gauge — no more arbitrary
    // bead size. `wEff` rescales legacy weight-based hardware constants
    // (clasps, link tubes) to the physical link size.
    const beadSize = spec.world.chainLinkRadius;
    const wEff = beadSize / 0.052;
    const silhouette = currentState.silhouette || "Pendant";

    // ----- chain curve (silhouette controls span + droop) -----
    // Each silhouette uses a different parametric curve so the chain
    // physically reads as a Y-drop, lariat, choker, etc.
    //
    // §2 + §5 — Chain coherence.
    //
    // A real chain is a sequence of *interlocking* metal links: every
    // link physically touches its neighbour, and the chain's apparent
    // length along the curve equals the integral arc length, not the
    // parameter span. The previous loop sampled the parametric curve at
    // uniform parameter t and dropped a sphere at each sample, so:
    //   – beads were unevenly spaced (denser at the cusp, sparser at the
    //     ends) violating manufacturability (§13);
    //   – nothing connected adjacent beads, so the chain read as a row
    //     of floating ornaments.
    //
    // Fixed by:
    //   1. Densely sample the parametric curve, then walk it by accumulated
    //      arc length s = ∫₀ᵗ ‖dC/du‖ du, emitting a bead every Δs = 2·R
    //      so consecutive beads kiss tangentially (§5 contact = 0 between
    //      bead i and bead i+1 in arc-length parameterisation).
    //   2. Connect every consecutive bead pair with a small rolo-chain
    //      jump-ring (torus oriented perpendicular to the local tangent
    //      so it visibly threads through both spheres). This is the
    //      canonical "real chain" anatomy — bead-and-link cable chain.
    const silhouetteSpan  = silhouette === "Choker" ? 2.6 : silhouette === "Lariat" ? 4.4 : 3.8;
    const silhouetteDroop = silhouette === "Choker" ? 0.42
                          : silhouette === "Lariat" ? 1.05
                          : silhouette === "Y-Drop" ? 0.92
                          : 0.82;
    // Parametric curve y(t) — same family as before, just sampled densely
    // here for arc-length integration.
    const curveAt = (t) => {
      const x = (t - 0.5) * silhouetteSpan;
      const dipShape = silhouette === "Lariat"
        ? -Math.cos((t - 0.42) * Math.PI * 1.05)
        : -Math.cos((t - 0.5) * Math.PI);
      const y = -0.48 + dipShape * silhouetteDroop;
      return { x, y };
    };
    // Dense pre-sample for cumulative arc-length table.
    const denseSamples = 800;
    const dense = new Array(denseSamples + 1);
    let totalArc = 0;
    dense[0] = { ...curveAt(0), s: 0 };
    for (let i = 1; i <= denseSamples; i += 1) {
      const t = i / denseSamples;
      const p = curveAt(t);
      const prev = dense[i - 1];
      totalArc += Math.hypot(p.x - prev.x, p.y - prev.y);
      dense[i] = { ...p, s: totalArc };
    }
    // mm truth — rescale the parametric family so the visible front arc
    // equals the worn drape of the real chain length (≈52% of the chain
    // shows from the front; the rest passes behind the neck).
    const targetArc = spec.world.chainLength * 0.52;
    const arcScale = targetArc / Math.max(totalArc, 1e-6);
    for (const p of dense) {
      p.x *= arcScale;
      p.y *= arcScale;
      p.s *= arcScale;
    }
    totalArc *= arcScale;
    // Walk the dense table at uniform arc-length step Δs = 2·R so adjacent
    // beads kiss exactly (touching spheres condition).
    const beadStep = beadSize * 2.0;
    const beadCountActual = Math.max(8, Math.floor(totalArc / beadStep) + 1);
    // §13 manufacturability: snap to an even count for symmetric layout.
    const beadCount = beadCountActual % 2 === 0 ? beadCountActual : beadCountActual + 1;
    const chainPath = [];
    // Walk the dense table monotonically to map each target arc-length
    // to an interpolated (x, y) position — O(N) total. We just build the
    // centerline here; per-pattern link geometry is emitted below by the
    // chainType dispatch so every chain style shares the SAME arc-length
    // anchor points (Station/Y-Drop/Pendant placement is invariant).
    let denseIdx = 0;
    for (let i = 0; i < beadCount; i += 1) {
      const targetS = (i / (beadCount - 1)) * totalArc;
      while (denseIdx < denseSamples && dense[denseIdx + 1].s < targetS) {
        denseIdx += 1;
      }
      const a = dense[denseIdx];
      const b = dense[Math.min(denseSamples, denseIdx + 1)];
      const span = (b.s - a.s) || 1;
      const u = (targetS - a.s) / span;
      const x = a.x + (b.x - a.x) * u;
      const y = a.y + (b.y - a.y) * u;
      chainPath.push({ x, y });
    }
    // §2 — emit per-pattern chain link geometry. Default Cable matches
    // the original bead-and-link rolo construction; other patterns swap
    // in their own link primitives along the same arc-length samples.
    const chainType = currentState.chainType || "Cable";
    const chainEmitter = CHAIN_EMITTERS[chainType] || CHAIN_EMITTERS.Cable;
    chainEmitter(group, chainPath, beadSize, wEff, metal);

    const lowest = chainPath.reduce((acc, p) => (p.y < acc.y ? p : acc), chainPath[0]);
    // Real pendant assembly geometry:
    //   chain bead (attachY) → bail (vertical loop, touches chain) → pendant
    //   The bail must be a *vertical* torus (axis = local X) so you can see
    //   THROUGH it; the previous flat-disc orientation read as a coin glued
    //   between the chain and the gem. The pendant centre is derived from the
    //   bail's actual outer rim so there's never a floating gap.
    const placeFocalAt = (x, attachY, scale, addBail) => {
      const focalScale = 1.08 * scale;
      const stoneHalfDia = specStoneHalfWidth() * focalScale;
      const pendantDepth = stoneDepthMetrics(stoneHalfDia, currentState.shape);
      const pendantTopExtent = stonePlanExtentY(currentState.shape, stoneHalfDia, 1, pendantDepth.girdleScale);
      const settingR = stoneHalfDia * 1.06;
      const connectorRadius = spec.world.chainWireRadius * 0.8;
      const pendantTabR = Math.max(mmToWorld(0.9), stoneHalfDia * 0.13);
      const pendantTabTube = spec.world.chainWireRadius * 0.7;
      let focalY;
      let connectorTopY;
      if (addBail) {
        // Bail forged from slightly heavier wire than the chain links.
        const bailR = Math.max(mmToWorld(2.2) * scale, beadSize * 1.35);
        const bailTube = spec.world.chainWireRadius * 1.15;
        const bail = new THREE.Mesh(new THREE.TorusGeometry(bailR, bailTube, 18, 64), metal);
        // Bail axis is along X (chain direction) so the chain physically
        // threads THROUGH the bail loop — anatomically correct. The bail
        // is centred on the chain bead at the attach point, with the loop
        // sitting in the YZ plane. Previously rotation.x = 0.35 left the
        // bail's hole facing the camera (a coin pressed against the chain)
        // which read as floating metal rather than a real jump ring.
        bail.position.set(x, attachY, 0);
        bail.rotation.y = Math.PI / 2;
        group.add(bail);
        // §5 contact/anchor: the pendant centre is solved from the bail's
        // physical lower rim. The old 0.6R offset overlapped the gem into
        // the jump ring on some shapes while still leaving visual gaps on
        // others. We now keep a tiny solder tab between the bail and the
        // pendant top so the assembly reads like one manufactured part.
        connectorTopY = attachY - bailR - bailTube * 0.7;
      } else {
        // No bail: the pendant hangs from a soldered chain tab under the
        // bead/link at the attachment point.
        connectorTopY = attachY - beadSize * 0.82;
      }
      focalY = connectorTopY
        - Math.max(spec.world.chainWireRadius * 1.6, stoneHalfDia * 0.08)
        - pendantTabR * 2
        - pendantTabTube
        - pendantTopExtent;
      const pendant = makeStone(focalScale);
      // §5 no-collision: the chain and bail live in z=0. The pendant stone
      // is lifted forward by its true pavilion depth, so the back of the
      // stone clears the chain plane instead of slicing through it.
      const pendantZ = pendantDepth.pavilionH + connectorRadius * 1.7;
      pendant.position.set(x, focalY, pendantZ);
      const pendantTopY = focalY + pendantTopExtent;
      const pendantTabY = pendantTopY + pendantTabR + pendantTabTube + 0.003;
      const pendantTabTopY = pendantTabY + pendantTabR;
      if (connectorTopY - pendantTabTopY > 0.008) {
        group.add(makeCylinderBetween(
          new THREE.Vector3(x, connectorTopY, 0),
          new THREE.Vector3(x, pendantTabTopY, pendantZ),
          connectorRadius,
          metal
        ));
      }
      const solderTop = new THREE.Mesh(new THREE.SphereGeometry(spec.world.chainWireRadius * 1.2, 16, 10), metal);
      solderTop.position.set(x, connectorTopY, 0);
      group.add(solderTop);
      const pendantTab = new THREE.Mesh(
        new THREE.TorusGeometry(pendantTabR, pendantTabTube, 12, 34),
        metal
      );
      pendantTab.position.set(x, pendantTabY, pendantZ);
      pendantTab.rotation.y = Math.PI / 2;
      group.add(pendantTab);
      addSetting(group, x, focalY, pendantZ - stoneHalfDia * 0.18, settingR, {
        scaleY: 0.92,
        prongs: currentState.shape === "Pear" ? 5 : 6,
        stoneSize: stoneHalfDia,
        stoneZ: pendantZ
      });
      if (currentState.halo) {
        // Halo girdle coplanar with pendant girdle (pendantZ). The old
        // hardcoded z = 0.11 sat 0.05 BEHIND the pendant girdle (z = 0.16),
        // which left the halo wrapping around the pavilion edge instead of
        // ringing the table.
        addHalo(group, x, focalY, settingR + 0.10 * scale, 18, pendantZ - stoneHalfDia * 0.04, 0.92);
      }
      addMilgrain(group, x, focalY, settingR + (currentState.halo ? 0.20 : 0.06), 32, pendantZ + stoneHalfDia * 0.02, 0.92);
      group.add(pendant);
    };

    if (silhouette === "Choker") {
      // Small centerpiece kissing the front of the chain, no bail.
      placeFocalAt(lowest.x, lowest.y, 0.55, false);
    } else if (silhouette === "Station") {
      // Five accent stones evenly distributed across the chain, each
      // bezel-set into the chain itself (no hanging). Each stone's pavilion
      // is mounted on the bead's front face with no mesh interpenetration:
      // stationZ = bead front + true pavilion depth + clearance. A thin
      // bezel collar wraps the girdle to read as a true station set.
      const stations = 5;
      for (let i = 0; i < stations; i += 1) {
        const t = (i + 1) / (stations + 1);
        const idx = Math.floor(t * (chainPath.length - 1));
        const p = chainPath[idx];
        const stationScale = 0.32;
        const stationHalfDia = specStoneHalfWidth() * stationScale;
        const stationDepth = stoneDepthMetrics(stationHalfDia, currentState.shape);
        const stationRailR = spec.world.chainWireRadius;
        const stationZ = beadSize + stationDepth.pavilionH + stationRailR * 0.65 + 0.004;
        const stone = makeStone(stationScale);
        stone.position.set(p.x, p.y, stationZ);
        group.add(makePaveSeat(p.x, p.y, stationZ - stationHalfDia * 0.20, stationHalfDia * 1.05, 0));
        addSetting(group, p.x, p.y, stationZ - stationHalfDia * 0.18, stationHalfDia * 1.06, {
          scaleY: 0.9, prongs: 4, stoneSize: stationHalfDia, stoneZ: stationZ
        });
        // Bezel collar bridging gem girdle to chain bead.
        const collar = new THREE.Mesh(
          new THREE.TorusGeometry(stationHalfDia * 1.10, spec.world.chainWireRadius * 0.8, 12, 36), metal
        );
        collar.position.set(p.x, p.y, stationZ - stationHalfDia * 0.05);
        group.add(collar);
        const beadR = stationHalfDia * 0.15;
        for (let b = 0; b < 4; b += 1) {
          const ang = Math.PI / 4 + (Math.PI * 2 * b) / 4;
          group.add(makePaveBead(
            p.x + Math.cos(ang) * stationHalfDia * 0.88,
            p.y + Math.sin(ang) * stationHalfDia * 0.88,
            stationZ + stationHalfDia * 0.08,
            beadR,
            metal
          ));
        }
        group.add(stone);
      }
    } else if (silhouette === "Y-Drop") {
      // Bail at the bottom of the main chain, then a SHORT drop-chain of
      // beads ending in the pendant. The bail is attached to the LAST drop
      // bead — not floating between drop and pendant as before.
      //
      // §2/§5 — Same kiss-and-link logic as the main chain: drop beads are
      // arc-length-uniform (Δs = 2·R_drop so they kiss) and consecutive
      // pairs are bridged by a torus jump-ring so the drop reads as a
      // single continuous chain rather than a stack of floating spheres.
      const dropLength = spec.world.necklaceDropLength;
      const dropBeadR = beadSize * 0.78;
      const dropStep = dropBeadR * 2.0;
      const dropCount = Math.max(4, Math.floor(dropLength / dropStep));
      const dropLinkTube = dropBeadR * 0.22;
      const dropLinkR    = dropBeadR * 0.78;
      const dropPositions = [];
      for (let i = 0; i < dropCount; i += 1) {
        const by = lowest.y - (i + 1) * dropStep;
        dropPositions.push({ x: lowest.x, y: by });
        const bead = new THREE.Mesh(new THREE.SphereGeometry(dropBeadR, 16, 10), metal);
        bead.position.set(lowest.x, by, 0);
        group.add(bead);
      }
      // Bridge from the actual lowest main-chain bead down to the first
      // drop bead with a jump-ring, AND between every consecutive drop-bead
      // pair, so the drop is physically continuous with the main chain.
      const dropAnchor = [lowest, ...dropPositions];
      for (let i = 0; i < dropAnchor.length - 1; i += 1) {
        const a = dropAnchor[i];
        const b = dropAnchor[i + 1];
        const link = new THREE.Mesh(
          new THREE.TorusGeometry(dropLinkR, dropLinkTube, 10, 22), metal
        );
        link.position.set((a.x + b.x) * 0.5, (a.y + b.y) * 0.5, 0);
        // Drop runs along -Y so tangent is vertical → ring axis = +Y.
        link.rotation.x = Math.PI / 2;
        group.add(link);
      }
      const lastDrop = dropPositions[dropPositions.length - 1];
      placeFocalAt(lastDrop.x, lastDrop.y - dropBeadR, 0.95, true);
    } else if (silhouette === "Lariat") {
      // Two pendants — one on each strand end, plus a knot-bead at the
      // crossover point near the front. Stones hang DIRECTLY off the chain
      // ends (no bail) like a real lariat.
      const knot = new THREE.Mesh(new THREE.SphereGeometry(beadSize * 1.6, 18, 14), metal);
      knot.position.set(lowest.x, lowest.y, 0.05);
      group.add(knot);
      const left  = chainPath[Math.floor(chainPath.length * 0.08)];
      const right = chainPath[Math.floor(chainPath.length * 0.92)];
      placeFocalAt(left.x,  left.y,  0.55, false);
      placeFocalAt(right.x, right.y, 0.55, false);
    } else {
      // Pendant (default): bail at the lowest chain bead, gem hangs from bail.
      placeFocalAt(lowest.x, lowest.y, 1.0, true);
    }

    // §13 manufacturability — add a physical closure at the curve
    // endpoints. The clasp jump-rings thread the outermost chain links
    // so the closure is never floating sideways off the curve.
    const claspType = currentState.clasp || "Lobster";
    const claspEmitter = CLASP_EMITTERS[claspType] || CLASP_EMITTERS.Lobster;
    claspEmitter(group, chainPath, wEff, metal);

    group.userData.jewellerySpec = spec;
    group.userData.physical = physicalMetadata(spec);
    group.userData.unitsPerMm = WORLD_UNITS_PER_MM;
    return enableShadows(group);
  }

  function buildBracelet() {
    // ====================================================================
    // BRACELET — Physical anatomy & component index
    // --------------------------------------------------------------------
    // A real bracelet wraps a cylinder (the wrist). To render one correctly
    // we MUST work in a band-local frame, otherwise stones and settings sit
    // in world XY while the band is tilted for the 3/4 view (this is the
    // bug the previous renderer had: gem table faced world +Y instead of
    // the band's outward normal; prongs extended toward the camera instead
    // of DOWN INTO the band; accent stones sat on the un-tilted XY plane
    // and floated above the tilted band).
    //
    // Component hierarchy (everything below `bandFrame` lives in band-local
    // coordinates: wrist axis = local +Z (toward camera); band lies in
    // local XY; +Y = "top of the band" where focal stones sit):
    //
    //   group (outer, gets a small `rotation.z` for studio framing)
    //     └── bandFrame  (rotation.x = bandTiltX, the 3/4 view tilt)
    //           ├── BAND
    //           │     • Bangle / Station: TorusGeometry(majorR, tube)
    //           │       with scale.y = scaleY (worn ovality)
    //           │     • Cuff: TubeGeometry along a 3/4 elliptical arc + 2
    //           │       sphere end-caps
    //           │     • Tennis: NO continuous band — articulated chain of
    //           │       per-link mounts joined by short cylindrical bars
    //           │       along the same oval wrist surface
    //           └── MOUNTS  (one Group per stone, made by `makeMount(a, R)`)
    //                 • position: on the band's OUTER surface at angle `a`
    //                   so the gem pavilion just kisses the band, never
    //                   penetrating it (centerline + normal·(tube + true pavilion depth))
    //                 • rotation: local +Z follows the oval wrist normal —
    //                   the gem's table thus points OUTWARD (away from the
    //                   wrist), exactly as a real bracelet stone does
    //                 • children: stone (table = local +Z), setting
    //                   (prongs/bezel extending in local -Z into the band),
    //                   optional halo / milgrain / accent bezels — ALL
    //                   built at the mount's local origin with the same
    //                   convention as the ring head group
    // ====================================================================
    const metal = materialForMetal();
    const group = new THREE.Group();
    const weight = weightValue();
    const spec = pieceSpec();
    const silhouette = currentState.silhouette || "Bangle";

    // mm truth: centreline radius = true inner radius + tube radius so the
    // wrist opening matches the selected bangle size exactly.
    const majorR = spec.world.braceletInnerRadius + spec.world.braceletTubeRadius;
    const tube = spec.world.braceletTubeRadius;
    const scaleY = spec.bracelet.ovalRatio; // oval-comfort profile
    const bandTiltX = 0.24;          // 3/4-view tilt around X

    const bandFrame = new THREE.Group();
    bandFrame.rotation.x = bandTiltX;
    group.add(bandFrame);

    function braceletSurfaceAt(a, lift = 0) {
      const center = new THREE.Vector3(
        Math.cos(a) * majorR,
        Math.sin(a) * majorR * scaleY,
        0
      );
      const tangent = new THREE.Vector3(
        -Math.sin(a) * majorR,
        Math.cos(a) * majorR * scaleY,
        0
      ).normalize();
      // Ellipse normal for x = R cosθ, y = R·scaleY sinθ.
      const normal = new THREE.Vector3(Math.cos(a), Math.sin(a) / Math.max(scaleY, 0.001), 0).normalize();
      return {
        pos: center.addScaledVector(normal, tube + lift),
        tangent,
        normal
      };
    }

    function braceletFrameAt(a, lift = 0) {
      const surface = braceletSurfaceAt(a, lift);
      return {
        ...surface,
        binormal: new THREE.Vector3().crossVectors(surface.normal, surface.tangent).normalize()
      };
    }

    function applyBraceletFrame(object, surface) {
      const zAxis = surface.normal.clone().normalize();
      const xAxis = surface.tangent.clone().normalize();
      const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();
      const basis = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
      object.quaternion.setFromRotationMatrix(basis);
      return object;
    }

    // Build a mount group at band-angle `a` (0 = +X right, π/2 = +Y top).
    // `stoneR` is the gem's half-diameter; the mount is positioned so the
    // true pavilion depth below the gem centre sits flush on the band's
    // outer surface without entering the metal volume.
    function makeMount(a, stoneR, opts = {}) {
      const pavilionDepth = opts.pavilionDepth ?? 0.72;
      const seatInset = opts.seatInset ?? 0.004;
      const physicalLift = stoneDepthMetrics(stoneR, currentState.shape).pavilionH + seatInset;
      const requestedLift = stoneR * pavilionDepth + seatInset;
      const surface = braceletSurfaceAt(a, Math.max(requestedLift, physicalLift));
      const m = new THREE.Group();
      m.position.copy(surface.pos);
      applyBraceletFrame(m, surface);
      return m;
    }

    function addBraceletMeleeSeat(mount, stoneR, stoneScale) {
      // §2/§5 — local mount frame: +Z is the bracelet surface normal, so a
      // negative-z recess is literally drilled down into the bangle tube.
      mount.add(makePaveSeat(0, 0, -stoneR * 0.18, stoneR * 1.08, 0));
      const underBezel = new THREE.Mesh(
        new THREE.TorusGeometry(stoneR * 1.10, stoneR * 0.12, 10, 36),
        metal
      );
      underBezel.position.z = -stoneR * 0.08;
      mount.add(underBezel);
      mount.add(makeStone(stoneScale));
      const beadR = stoneR * 0.24;
      for (let b = 0; b < 4; b += 1) {
        const ang = Math.PI / 4 + (Math.PI * 2 * b) / 4;
        mount.add(makePaveBead(
          Math.cos(ang) * stoneR * 0.90,
          Math.sin(ang) * stoneR * 0.90,
          stoneR * 0.15,
          beadR,
          metal
        ));
      }
    }

    function addBraceletChannelRails(angles, stoneR) {
      const railR = stoneR * 0.105;
      const railOffset = stoneR * 1.17;
      for (const side of [-1, 1]) {
        for (let i = 0; i < angles.length - 1; i += 1) {
          const a = angles[i];
          const b = angles[i + 1];
          const fa = braceletFrameAt(a, stoneR * 0.18);
          const fb = braceletFrameAt(b, stoneR * 0.18);
          const pa = fa.pos.clone().addScaledVector(fa.binormal, side * railOffset);
          const pb = fb.pos.clone().addScaledVector(fb.binormal, side * railOffset);
          bandFrame.add(makeCylinderBetween(pa, pb, railR, metal));
        }
      }
    }

    // Drop a focal stone + setting at band-angle `a` with the given scale.
    function placeFocal(a, scale, opts = {}) {
      const stoneR = specStoneHalfWidth() * scale;
      const settingR = stoneR * 1.06;
      const mount = makeMount(a, stoneR, opts.embedded ? { pavilionDepth: 0.62, seatInset: 0.002 } : {});
      bandFrame.add(mount);
      const stone = makeStone(scale);
      if (opts.embedded) {
        mount.add(makePaveSeat(0, 0, -stoneR * 0.18, settingR * 0.92, 0));
      }
      mount.add(stone);
      addSetting(mount, 0, 0, -stoneR * 0.18, settingR, {
        scaleY: 1,
        prongs: opts.prongs || (currentState.shape === "Pear" ? 5 : 6),
        stoneSize: stoneR,
        stoneZ: 0
      });
      if (opts.halo && currentState.halo) {
        addHalo(mount, 0, 0, settingR + 0.09, 16, -stoneR * 0.04, 1);
      }
      if (opts.milgrain) {
        addMilgrain(mount, 0, 0,
          settingR + (currentState.halo ? 0.18 : 0.05),
          28, stoneR * 0.02, 1);
      }
      return { stoneR, settingR, mount };
    }

    if (silhouette === "Cuff") {
      // Open cuff: 3/4-arc tube centred on the TOP of the band (the open
      // gap is at the BACK of the wrist where the cuff slips on).
      const arc = Math.PI * 1.55;
      const curve = new THREE.Curve();
      curve.getPoint = (t) => {
        const ang = Math.PI / 2 - arc / 2 + t * arc;
        return new THREE.Vector3(
          Math.cos(ang) * majorR,
          Math.sin(ang) * majorR * scaleY,
          0
        );
      };
      const band = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 140, tube * 1.1, 20, false), metal
      );
      bandFrame.add(band);
      // Rounded end caps where the cuff opens at the back.
      [0, 1].forEach((t) => {
        const ang = Math.PI / 2 - arc / 2 + t * arc;
        const cap = new THREE.Mesh(
          new THREE.SphereGeometry(tube * 1.18, 20, 14), metal
        );
        cap.position.set(
          Math.cos(ang) * majorR,
          Math.sin(ang) * majorR * scaleY,
          0
        );
        bandFrame.add(cap);
      });
      placeFocal(Math.PI / 2, 0.78, { halo: true, milgrain: true });

    } else if (silhouette === "Tennis") {
      // Articulated chain. Each link is a 4-prong mount; adjacent mounts
      // are joined by short cylindrical bars at the basket-base height so
      // the row reads as chain-jointed, not a row of floating settings.
      // Link count solved from the real oval circumference at the true
      // melee pitch (§13 manufacturability), clamped for mesh budget.
      const stoneR = Math.max(specStoneHalfWidth() * 0.18, mmToWorld(1.6));
      const tennisScale = stoneR / Math.max(specStoneHalfWidth(), 1e-6);
      const settingR = stoneR * 1.10;
      const ovalPerimeter = Math.PI * (majorR + majorR * scaleY);
      const links = Math.max(24, Math.min(56, Math.floor(ovalPerimeter / (stoneR * 2 * 1.18))));
      const angles = [];

      for (let i = 0; i < links; i += 1) {
        const a = (i / links) * Math.PI * 2;
        angles.push(a);
        const mount = makeMount(a, stoneR);
        bandFrame.add(mount);
        mount.add(makePaveSeat(0, 0, -stoneR * 0.18, settingR * 0.90, 0));
        mount.add(makeStone(tennisScale));
        addSetting(mount, 0, 0, -stoneR * 0.30, settingR, {
          scaleY: 1, prongs: 4, stoneSize: stoneR, stoneZ: 0
        });
      }
      for (let i = 0; i < links; i += 1) {
        const a1 = angles[i];
        const a2 = angles[(i + 1) % links];
        const p1 = braceletSurfaceAt(a1, -stoneR * 0.18).pos;
        const p2 = braceletSurfaceAt(a2, -stoneR * 0.18).pos;
        bandFrame.add(makeCylinderBetween(p1, p2, mmToWorld(0.5), metal));
      }

    } else if (silhouette === "Station") {
      // Continuous bangle band + 5 evenly-spaced stones along the front
      // arc. Each station has its own 4-prong mount that grips the band.
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(majorR, tube, 40, 220), metal
      );
      band.scale.y = scaleY;
      bandFrame.add(band);
      const stations = 5;
      const startA = Math.PI * 0.22;
      const endA = Math.PI * 0.78;
      for (let i = 0; i < stations; i += 1) {
        const t = i / (stations - 1);
        placeFocal(startA + t * (endA - startA), 0.32, { prongs: 4, embedded: true });
      }

    } else {
      // Bangle (default): single solid band, one focal stone on top.
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(majorR, tube, 40, 220), metal
      );
      band.scale.y = scaleY;
      bandFrame.add(band);
      const focal = placeFocal(Math.PI / 2, 0.78, {
        halo: true, milgrain: true
      });

      if (currentState.accent) {
        // Side/accent stones — small bezel-set rounds running along the
        // band on BOTH sides of the focal, each one a real mount on the
        // band's outer surface (NOT floating in world XY like before). The
        // bezel collar is attached to the mount, never hovering off it.
        const accentR = mmToWorld(1.25); // true 2.5 mm melee
        const accentScale = accentR / Math.max(specStoneHalfWidth(), 1e-6);
        const perSide = 8;
        const startGap = focal.stoneR * 1.4; // clearance from focal halo
        const endGap = Math.PI * 0.42;       // stop before the side
        // Convert clearance gap to an angular step from π/2.
        const aMin = Math.PI / 2 + startGap / majorR;
        const aMax = Math.PI / 2 + endGap;
        for (let side = 0; side < 2; side += 1) {
          const sign = side === 0 ? 1 : -1;
          const railAngles = [];
          for (let i = 0; i < perSide; i += 1) {
            const t = (i + 1) / (perSide + 1);
            const a = Math.PI / 2 + sign * (
              (aMin - Math.PI / 2) + t * (aMax - aMin)
            );
            railAngles.push(a);
            const m = makeMount(a, accentR, { pavilionDepth: 0.57, seatInset: 0.001 });
            bandFrame.add(m);
            addBraceletMeleeSeat(m, accentR, accentScale);
            // Tiny bezel collar fastened to the recessed seat (NOT hovering
            // off it) — sits just under the stone's girdle in local XY.
            const bezel = new THREE.Mesh(
              new THREE.TorusGeometry(accentR * 1.05, accentR * 0.14, 12, 36),
              metal
            );
            // Default torus axis = local +Z, which aligns with the gem's
            // outward direction → the bezel hole faces outward exactly
            // like the gem table. ✓
            bezel.position.z = -accentR * 0.02;
            m.add(bezel);
          }
          addBraceletChannelRails(railAngles, accentR);
        }
      }
    }

    group.rotation.z = -0.18;
    group.userData.jewellerySpec = spec;
    group.userData.physical = physicalMetadata(spec);
    group.userData.unitsPerMm = WORLD_UNITS_PER_MM;
    return enableShadows(group);
  }

  function buildEarrings() {
    // ====================================================================
    // EARRINGS — Physical anatomy & component index
    // --------------------------------------------------------------------
    // Earrings live in the lobe plane (XY) and face the camera (+Z). Two
    // mirrored copies are emitted at x = ±0.76. Components per earring:
    //
    //   STUD silhouette:
    //     • Stone (front): makeStone at z = true pavilion depth + clearance,
    //       no rotation → table faces world +Z (camera). Its back clears
    //       the post/lobe hardware plane for every stone size.
    //     • Setting: addSetting receives the stone's real z/depth so rails
    //       and prongs sit outside the gem envelope.
    //     • Post: short cylinder, rotation.x = π/2 so axis = world Z, starts
    //       behind the culet and extends BEHIND the lobe.
    //     • Backing (butterfly clutch): TorusGeometry at default rotation
    //       (hole along +Z, facing camera) sitting on the post's back end.
    //
    //   DROP / CHANDELIER silhouettes:
    //     • Post + backing as above, anchored at the lobe (y = 0).
    //     • Jump ring: small torus just below the post, placed on a front
    //       hardware plane outside the focal stone volume.
    //     • Vertical link: thin cylinder from jump ring down to a focal bail
    //       above the stone outline, never through the stone.
    //     • Focal stone + setting: same convention as the stud, but at
    //       (x, -0.42, earringZ).
    //     • Chandelier extras: 3 small teardrops hanging beneath the focal,
    //       each tied to it with thin inline links so the row reads as
    //       articulated, not floating.
    //
    //   HUGGIE silhouette:
    //     • Hoop: TorusGeometry hugging the lobe (axis = +Z, default
    //       orientation), with a single accent stone bezel-set at the
    //       BOTTOM-FRONT of the hoop (positioned ON the torus tube).
    //
    // Coordinate convention:
    //     +Z = toward camera (gem table direction; post extends into -Z)
    //     +Y = up
    //     +X = wearer's left
    // ====================================================================
    const group = new THREE.Group();
    const metal = materialForMetal();
    const weight = weightValue();
    const spec = pieceSpec();
    const silhouette = currentState.silhouette || "Stud";
    // Studio pair spacing is compositional (real lobe spacing is anatomy,
    // not jewellery); each earring's own geometry is mm-true. The AR reads
    // earringPairHalfSpanLocal from userData to re-span the pair per face.
    const pairHalfSpan = Math.max(
      0.9,
      specStoneHalfWidth() * 2.6,
      (spec.world.hoopInnerRadius + spec.world.hoopTubeRadius * 2) * 1.35
    );

    function addPostBridge(x, y, fromZ, toZ, radius = spec.world.postRadius * 0.8) {
      if (Math.abs(toZ - fromZ) < 0.006) {
        return;
      }
      group.add(makeCylinderBetween(
        new THREE.Vector3(x, y, fromZ),
        new THREE.Vector3(x, y, toZ),
        radius,
        metal
      ));
      const solder = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.55, 14, 10), metal);
      solder.position.set(x, y, toZ);
      group.add(solder);
    }

    function frontHardwareZ(stoneZ, depth, amount = 0.16) {
      return stoneZ + depth.crownH * amount + spec.world.postRadius * 0.35;
    }

    [-pairHalfSpan, pairHalfSpan].forEach((x) => {
      if (silhouette === "Huggie") {
        // A small hoop hugging the earlobe, with a single accent stone at
        // the bottom-front of the hoop (positioned ON the torus tube).
        // Hoop opening and wire section are true mm.
        const hoopTube = spec.world.hoopTubeRadius;
        const hoopR = spec.world.hoopInnerRadius + hoopTube;
        const hoop = new THREE.Mesh(new THREE.TorusGeometry(hoopR, hoopTube, 18, 64), metal);
        hoop.position.set(x, 0, 0);
        group.add(hoop);
        const huggieScale = 0.45;
        const huggieHalfDia = specStoneHalfWidth() * huggieScale;
        const huggieY = -hoopR + hoopTube * 0.4;
        const stone = makeStone(huggieScale);
        const huggieDepth = stoneDepthMetrics(huggieHalfDia, currentState.shape);
        const huggieZ = hoopTube + huggieDepth.pavilionH + 0.004;
        const huggieBackZ = huggieZ - huggieDepth.pavilionH;
        stone.position.set(x, huggieY, huggieZ);
        const huggieSettingZ = huggieBackZ;
        addSetting(group, x, huggieY, huggieSettingZ, huggieHalfDia * 1.06, {
          scaleY: 0.9, prongs: 4, stoneSize: huggieHalfDia, stoneZ: huggieZ
        });
        const saddle = new THREE.Mesh(new THREE.SphereGeometry(hoopTube * 0.85, 18, 12), metal);
        saddle.position.set(x, huggieY, huggieBackZ - hoopTube * 0.42);
        saddle.scale.set(1.55, 0.55, 0.34);
        group.add(saddle);
        const bridgeZ = huggieBackZ - spec.world.postRadius;
        for (const side of [-1, 1]) {
          group.add(makeCylinderBetween(
            new THREE.Vector3(x + side * hoopTube * 0.52, huggieY, huggieBackZ - hoopTube * 0.70),
            new THREE.Vector3(x + side * huggieHalfDia * 0.42, huggieY, bridgeZ),
            spec.world.postRadius * 0.7,
            metal
          ));
        }
        group.add(stone);
        return;
      }

      // ---- post + butterfly back ----
      // Stud: post extends STRAIGHT BEHIND the stone (into the lobe).
      // Drop / Chandelier: post sits at the TOP of the earring at the lobe;
      // the stone hangs BELOW the post via a connecting link + jump ring.
      const isDrop = silhouette === "Drop" || silhouette === "Chandelier";
      const earringScale = 1.0; // the pair stones ARE the selected carat
      const earringHalfDia = specStoneHalfWidth() * earringScale;
      const earringDepth = stoneDepthMetrics(earringHalfDia, currentState.shape);
      const earringTopY = stonePlanExtentY(currentState.shape, earringHalfDia, 1, earringDepth.girdleScale);
      const earringBottomY = stonePlanExtentY(currentState.shape, earringHalfDia, -1, earringDepth.girdleScale);
      const settingR = earringHalfDia * 1.06;
      const stoneY = isDrop ? -spec.world.earringDropLength : 0;
      const postAttachY = isDrop ? 0 : stoneY; // where the post pierces the lobe
      const postRadius = spec.world.postRadius;
      const postLength = spec.world.postLength;
      const earringZ = earringDepth.pavilionH + postRadius * 1.8;
      const earringBackZ = earringZ - earringDepth.pavilionH;
      const postFrontZ = earringBackZ - postRadius * 1.6;
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(postRadius, postRadius, postLength, 16),
        metal
      );
      post.position.set(x, postAttachY, postFrontZ - postLength * 0.5);
      post.rotation.x = Math.PI / 2; // cylinder axis along Z (into the lobe)
      const backing = new THREE.Mesh(
        new THREE.TorusGeometry(spec.world.butterflyRadius, postRadius * 0.55, 18, 48),
        metal
      );
      backing.position.set(x, postAttachY, postFrontZ - postLength * 0.78);
      backing.rotation.y = Math.PI / 2; // ring lies in YZ plane → faces along X... want it parallel to lobe (XY plane facing -Z)
      // Actually we want the butterfly ring co-planar with the lobe (so its
      // hole receives the post). Default torus is in the XY plane (axis = Z),
      // which IS what we want for a back facing the post's Z-axis. Reset rot:
      backing.rotation.set(0, 0, 0);
      group.add(post, backing);

      if (isDrop) {
        // Front decoration sits on a solved hardware plane in front of the
        // focal stone, then bridges back to the post. This keeps the link
        // visible while preventing it from passing through the gemstone.
        const jumpR = Math.max(mmToWorld(1.5), postRadius * 2.6);
        const linkTube = postRadius * 0.62;
        const linkZ = frontHardwareZ(earringZ, earringDepth, 0.12);
        const jump = new THREE.Mesh(
          new THREE.TorusGeometry(jumpR, postRadius * 0.55, 16, 40), metal
        );
        jump.position.set(x, postAttachY - jumpR, linkZ);
        jump.rotation.x = Math.PI / 2;
        group.add(jump);
        addPostBridge(x, postAttachY, postFrontZ, linkZ, postRadius * 0.72);
        // Vertical connecting link from jump ring down to a bail that sits
        // above the stone outline. The link lives in front of the gem plane,
        // so its cylinder never passes through the focal stone.
        const linkTopY = postAttachY - jumpR * 2;
        const focalBailR = Math.max(mmToWorld(1.3), postRadius * 2.2);
        const focalBailY = stoneY + earringTopY + focalBailR + linkTube + 0.006;
        const linkBotY = focalBailY + focalBailR;
        const linkLen = Math.max(0.05, linkTopY - linkBotY);
        const link = new THREE.Mesh(
          new THREE.CylinderGeometry(linkTube, linkTube, linkLen, 14),
          metal
        );
        link.position.set(x, (linkTopY + linkBotY) / 2, linkZ);
        group.add(link);
        const bail = new THREE.Mesh(
          new THREE.TorusGeometry(focalBailR, postRadius * 0.5, 12, 30),
          metal
        );
        bail.position.set(x, focalBailY, linkZ);
        bail.rotation.x = Math.PI / 2;
        group.add(bail);
      }

      const earring = makeStone(earringScale);
      earring.position.set(x, stoneY, earringZ);
      group.add(earring);
      const settingCenterZ = earringBackZ;
      addSetting(group, x, stoneY, settingCenterZ, settingR, {
        scaleY: 0.9,
        prongs: currentState.shape === "Pear" ? 5 : 6,
        stoneSize: earringHalfDia,
        stoneZ: earringZ
      });
      if (!isDrop) {
        addPostBridge(x, postAttachY, postFrontZ, earringBackZ - postRadius * 0.6, postRadius * 0.72);
      }
      if (currentState.halo) {
        // Halo girdle coplanar with the earring's gem girdle (earringZ),
        // pulled back by a hair so the melee sits just behind the table
        // plane. The old hardcoded z = 0.13 sat 0.05 behind the girdle
        // (historically fixed at 0.18) and the halo visibly wrapped around the
        // pavilion edge instead of ringing the table.
        addHalo(group, x, stoneY, settingR + 0.10, 16, earringZ - earringHalfDia * 0.04, 0.9);
      }
      addMilgrain(group, x, stoneY, settingR + (currentState.halo ? 0.20 : 0.06), 28, earringZ + earringHalfDia * 0.02, 0.9);

      if (silhouette === "Chandelier") {
        // Three small teardrops dangling beneath the main stone, tied to it
        // with thin metal links so they read as articulated.
        const teardropScale = 0.34;
        const teardropHalfDia = specStoneHalfWidth() * teardropScale;
        const teardropDepth = stoneDepthMetrics(teardropHalfDia, currentState.shape);
        const teardropTopY = stonePlanExtentY(currentState.shape, teardropHalfDia, 1, teardropDepth.girdleScale);
        const tierDrop = earringHalfDia + teardropHalfDia * 2.2;
        const tetraYOffsets = [-tierDrop, -tierDrop * 1.22, -tierDrop];
        const tierDx = earringHalfDia * 0.78;
        [-tierDx, 0, tierDx].forEach((dx, i) => {
          const tdY = stoneY + tetraYOffsets[i];
          const teardropZ = teardropDepth.pavilionH + postRadius * 0.8;
          const teardrop = makeStone(teardropScale);
          teardrop.position.set(x + dx, tdY, teardropZ);
          group.add(teardrop);
          addSetting(group, x + dx, tdY, teardropZ - teardropDepth.pavilionH * 0.32, teardropHalfDia * 1.06, {
            scaleY: 0.9, prongs: 4, stoneSize: teardropHalfDia, stoneZ: teardropZ
          });
          // Thin link physically bridging the main stone girdle and the
          // teardrop girdle in full 3D — start/end points are the actual
          // gem extremity positions, so the link follows any Z offset
          // between the two stones instead of being a vertical bar pinned
          // to a constant z = 0.10 (which left both ends floating relative
          // to their gems' true z planes).
          const chandelierLinkZ = Math.max(
            frontHardwareZ(earringZ, earringDepth, 0.10),
            frontHardwareZ(teardropZ, teardropDepth, 0.10)
          );
          const linkStart = new THREE.Vector3(
            x + dx * 0.5,
            stoneY + earringBottomY - postRadius * 1.1,
            chandelierLinkZ
          );
          const linkEnd = new THREE.Vector3(
            x + dx,
            tdY + teardropTopY + postRadius * 1.1,
            chandelierLinkZ
          );
          group.add(makeCylinderBetween(linkStart, linkEnd, postRadius * 0.6, metal));
        });
      }
    });

    group.userData.jewellerySpec = spec;
    group.userData.physical = physicalMetadata(spec);
    group.userData.unitsPerMm = WORLD_UNITS_PER_MM;
    group.userData.earringPairHalfSpanLocal = pairHalfSpan;
    return enableShadows(group);
  }

  function rebuild(state) {
    currentState = sanitizeDesignState(state);
    currentPhysicalSpec = buildJewellerySpec(currentState);
    clearModel();
    applyLightingMode(currentState.lighting);
    applyBackdrop(currentState.backdrop);
    applyView(currentState.view);
    applyPieceOptionVisibility(currentState.piece);

    const builders = {
      Ring: buildRing,
      Necklace: buildNecklace,
      Bracelet: buildBracelet,
      Earrings: buildEarrings
    };

    const pieceGroup = (builders[currentState.piece] || buildRing)();
    // Hanging pieces get a sway pivot at their top anchor so the dangle
    // integrator can rotate them about the physically-correct hinge line
    // (chain top / earring posts) instead of the model centroid.
    const isDangly = currentState.piece === "Necklace"
      || (currentState.piece === "Earrings"
        && (currentState.silhouette === "Drop" || currentState.silhouette === "Chandelier"));
    if (isDangly) {
      const preBox = new THREE.Box3().setFromObject(pieceGroup);
      // Earrings hinge at the post line (local y = 0); necklaces at the
      // top of the chain arc.
      const pivotY = currentState.piece === "Earrings"
        ? 0
        : (Number.isFinite(preBox.max.y) ? preBox.max.y : 0);
      const sway = new THREE.Group();
      sway.position.y = pivotY;
      pieceGroup.position.y = -pivotY;
      sway.add(pieceGroup);
      model.add(sway);
      dangleSim.node = sway;
      dangleSim.freq = currentState.piece === "Earrings" ? 1.35 : 0.85;
      dangleSim.thetaX = 0;
      dangleSim.thetaZ = 0;
      dangleSim.omegaX = 0.22;
      // Settle-in impulse: the piece swings gently into rest when it first
      // appears — the visual cue that it hangs rather than floats.
      dangleSim.omegaZ = 0.85;
      dangleSim.prevYaw = model.rotation.y;
      dangleSim.prevYawVel = 0;
      dangleSim.prevPitch = model.rotation.x;
      dangleSim.prevPitchVel = 0;
      dangleSim.lastT = 0;
    } else {
      dangleSim.node = null;
      model.add(pieceGroup);
    }
    model.scale.setScalar(1);
    if (currentState.piece === "Ring") {
      model.scale.setScalar(0.64);
    } else {
      // Non-ring pieces are now genuinely mm-true (units = mm × 0.12), so a
      // 45 cm chain is ~28 world units wide. Normalise the DISPLAY scale to
      // the studio frame from the measured bounds; userData keeps mm truth.
      model.updateMatrixWorld(true);
      const normBox = new THREE.Box3().setFromObject(model);
      const normSize = normBox.getSize(new THREE.Vector3());
      const targetWidth = currentState.piece === "Necklace" ? 3.05
        : currentState.piece === "Bracelet" ? 2.55
        : 1.95;
      const heightWeight = currentState.piece === "Necklace" ? 0.6 : 0.92;
      const dominant = Math.max(normSize.x, normSize.y * heightWeight, 1e-3);
      model.scale.setScalar(Math.min(1.4, Math.max(0.02, targetWidth / dominant)));
    }
    // Centre necklace in the viewer panel; other pieces retain the historic
    // slight left offset that lived alongside the older overlay editor.
    const defaultX = currentState.piece === "Necklace" ? 0
      : currentState.piece === "Earrings" ? -0.2
      : -0.58;
    // Necklace hangs from the top of the frame so the pendant floats free
    // above the plinth instead of resting on it.
    const defaultY = currentState.piece === "Necklace" ? 1.45 : 0;
    model.userData.defaultX = defaultX;
    model.userData.defaultY = defaultY;
    // In inspect mode keep the piece at its natural vertical position so a
    // necklace doesn't drop out of view; centre horizontally so the piece
    // sits in the middle of the loupe view.
    model.position.set(isInspecting ? 0 : defaultX, defaultY, 0);

    // §5 — Silhouette-matched floor contact shadow.
    //
    // The two static contact discs at y = -1.1 are the strongest "CGI
    // tell" left in the scene: a fixed 1.85 m circle reads as a sticker
    // under a ring but as a wrong-shaped halo under a wide bracelet, and
    // it stays at full opacity under a necklace that's hovering 2.5 m
    // above the plinth (which would cast no contact shadow at all in
    // real life).
    //
    // Energy interpretation: the contact penalty term
    //   E_contact = ∫ max(0, |x − x_floor|)² · w(piece)
    // is minimized when the shadow's spatial support matches the piece's
    // actual XZ footprint and its opacity falls off with the piece's
    // vertical clearance d_y from the floor (Beer-Lambert in air for
    // the soft penumbra: I(d) ≈ I₀ · e^{−d/λ_air}, λ_air ≈ 1.6 m for
    // the studio's diffuse fill).
    //
    // We rebuild the bbox after the model is positioned so the world-space
    // XZ extent reflects the actual on-screen silhouette (post scale +
    // translate).
    model.updateMatrixWorld(true);
    const pieceBox = new THREE.Box3().setFromObject(model);
    if (Number.isFinite(pieceBox.min.x) && Number.isFinite(pieceBox.max.x)) {
      const bboxSize = pieceBox.getSize(new THREE.Vector3());
      const bboxCenter = pieceBox.getCenter(new THREE.Vector3());
      // Soft penumbra: piece XZ footprint × 1.55 + 0.35 m base bleed for
      // the falloff radius of the radial-gradient texture.
      const softW = Math.max(0.55, bboxSize.x * 1.55 + 0.35);
      const softD = Math.max(0.55, bboxSize.z * 1.55 + 0.35);
      // Hot contact dot: tight 0.65× footprint, never larger than the soft
      // shadow, gives the AO seat directly beneath the lowest geometry.
      const hotW = Math.max(0.25, bboxSize.x * 0.7 + 0.15);
      const hotD = Math.max(0.25, bboxSize.z * 0.7 + 0.15);
      contactShadow.scale.set(softW, softD, 1);
      contactShadowHot.scale.set(hotW, hotD, 1);
      // X/Z follow the piece's centroid so off-centre pieces (Ring at
      // x ≈ -0.58) get their shadow under them, not at world origin.
      contactShadow.position.x = bboxCenter.x;
      contactShadow.position.z = bboxCenter.z;
      contactShadowHot.position.x = bboxCenter.x;
      contactShadowHot.position.z = bboxCenter.z;
      // Vertical clearance attenuation. A ring resting near y = -1.1 keeps
      // full opacity; a necklace at y = +1 fades to ~5 %; pieces below
      // the floor (impossible in normal use) clamp to the floor value.
      const clearance = Math.max(0, pieceBox.min.y - (-1.1));
      const proximity = Math.exp(-clearance / 1.6);  // λ_air = 1.6
      contactShadow.material.opacity = 0.7 * proximity;
      contactShadowHot.material.opacity = 0.55 * proximity;
      // Hide entirely once the piece is far enough that the shadow would
      // be visually noisy (< 4 % opacity) — cleaner than a faint ghost.
      const visible = proximity > 0.06;
      contactShadow.visible = visible;
      contactShadowHot.visible = visible;
    }

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

  // §11 — animate the three micro-sparkle PointLights along Lissajous
  // paths over the stone, gated by the stone's fire profile so onyx /
  // opaques don't glow from within.
  function animateMicroSparkles() {
    const profile = STONE_PROFILES[currentState?.stone] || STONE_PROFILES["Clear Diamond"];
    const fire = currentState?.stone === "Black Onyx" ? 0 : clamp(profile.fire || 0, 0, 1);
    const burst = currentState?.sparkleBurst ? 1.8 : 1;
    for (const light of microSparkles) {
      light.intensity = light.userData.baseIntensity * fire * burst;
      light.visible = fire > 0.04;
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getPointerDistance() {
    const pointers = Array.from(activePointers.values());

    if (pointers.length < 2) {
      return 0;
    }

    return Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);
  }

  function setInspectMode(enabled) {
    isInspecting = Boolean(enabled);
    activePointers.clear();
    isDragging = false;
    lastPinchDistance = 0;
    if (!isInspecting) {
      isAutoOrbiting = false;
    }
    // Pull camera in for inspect; restore on exit.
    targetCameraZ = isInspecting ? Math.min(targetCameraZ, 4.6) : cameraHomeZ;
    root.classList.toggle("is-inspecting", isInspecting);
    // Inspect mode gets a touch more punch — like a jeweller's loupe lamp.
    renderer.toneMappingExposure = isInspecting ? 1.18 : 1.05;
    // Hide stage fixtures so the piece floats in pure black during inspect.
    floor.visible = !isInspecting;
    plinth.visible = !isInspecting;
    glassPlate.visible = !isInspecting;
    softboxes.forEach((s) => { s.visible = !isInspecting; });
    contactShadow.visible = true; // keep the soft grounding shadow
    // Resize on next frame so the canvas picks up the new (fullscreen or
    // normal) bounding box.
    window.requestAnimationFrame(() => {
      resize();
      window.requestAnimationFrame(resize);
    });
  }

  function setAutoOrbit(enabled) {
    isAutoOrbiting = Boolean(enabled);
  }

  function resetView() {
    targetRotationX = 0.03;
    targetRotationY = -0.18;
    inspectPanX = 0;
    inspectPanY = 0;
    targetCameraZ = isInspecting ? 4.6 : cameraHomeZ;
  }

  function takeScreenshot(filename = "jewellery-design.png") {
    // Re-render once with preserveDrawingBuffer = true (set at construction)
    // so the canvas still has pixels to read. Route through the post chain
    // so the saved image matches what the user sees on screen.
    if (post) {
      post.render(performance.now());
    } else {
      renderer.render(scene, camera);
    }
    try {
      const url = renderer.domElement.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch (error) {
      return false;
    }
  }

  function setReadoutListener(fn) {
    onReadoutChange = typeof fn === "function" ? fn : null;
    lastReadoutKey = "";
  }

  function animate(time = 0) {
    // ── Phase 6: adaptive quality sampling ──
    // Sample the wall-clock delta between rAF callbacks. After the ring
    // buffer fills, compare the rolling average against tier thresholds
    // with a 2-second minimum dwell time to prevent flapping.
    if (lastFrameTimestamp > 0) {
      const dt = time - lastFrameTimestamp;
      if (dt > 0 && dt < 200) {
        frameTimeRing[frameTimeIndex] = dt;
        frameTimeIndex = (frameTimeIndex + 1) % frameTimeRing.length;
        if (frameTimeFilled < frameTimeRing.length) frameTimeFilled += 1;
      }
      if (frameTimeFilled >= frameTimeRing.length && time > qualityDwellUntil) {
        let sum = 0;
        for (let i = 0; i < frameTimeRing.length; i += 1) sum += frameTimeRing[i];
        const avg = sum / frameTimeRing.length;
        if (avg > 26 && qualityTier < QUALITY_TIERS.length - 1) {
          applyQualityTier(qualityTier + 1);
          qualityDwellUntil = time + 2000;
          frameTimeFilled = 0; // reset window after change
        } else if (avg < 16 && qualityTier > 0) {
          applyQualityTier(qualityTier - 1);
          qualityDwellUntil = time + 3000;
          frameTimeFilled = 0;
        }
      }
    }
    lastFrameTimestamp = time;

    if (!isDragging && (!isInspecting || isAutoOrbiting)) {
      // Faster orbit while inspect+auto, gentle drift otherwise.
      targetRotationY += isAutoOrbiting ? 0.006 : (isInspecting ? 0 : 0.0016);
    }

    const idleLift = (isInspecting && !isAutoOrbiting) ? 0 : Math.sin(time * 0.00028) * 0.035;
    const idleTurn = (isInspecting && !isAutoOrbiting) ? 0 : Math.sin(time * 0.00035) * 0.08;

    // Smoothly center the model in inspect mode; restore offset on exit.
    // Inspect mode uses the piece's natural Y (e.g. a necklace's hanging
    // height) as the baseline so pieces don't drop out of view, and the
    // inspect pan offsets ride on top of that baseline.
    const baseX = model.userData.defaultX ?? 0;
    const baseY = model.userData.defaultY ?? 0;
    const targetX = isInspecting ? inspectPanX : baseX;
    const targetY = isInspecting ? (baseY + inspectPanY) : baseY;
    model.position.x += (targetX - model.position.x) * 0.1;
    model.position.y += (targetY - model.position.y) * 0.1;

    // Push live camera/rotation readout to subscribers (HUD).
    if (onReadoutChange) {
      const rxDeg = Math.round((model.rotation.x * 180 / Math.PI + 360) % 360);
      const ryDeg = Math.round((model.rotation.y * 180 / Math.PI + 360) % 360);
      const zoom = (cameraHomeZ / Math.max(0.001, camera.position.z)).toFixed(2);
      const key = `${rxDeg}|${ryDeg}|${zoom}`;
      if (key !== lastReadoutKey) {
        lastReadoutKey = key;
        onReadoutChange({ rx: rxDeg, ry: ryDeg, zoom });
      }
    }
    model.rotation.y += (targetRotationY + idleTurn - model.rotation.y) * 0.08;
    model.rotation.x += (targetRotationX + idleLift - model.rotation.x) * 0.08;

    // §5 dangle integrator — semi-implicit Euler on the driven damped
    // pendulum. Support acceleration (yaw/pitch of the turntable) enters
    // as the drive term; light underdamping (ζ = 0.12) gives the slow
    // fade-out real hanging jewellery shows.
    if (dangleSim.node) {
      const dtRaw = dangleSim.lastT > 0 ? (time - dangleSim.lastT) / 1000 : 0.016;
      const dt = clamp(dtRaw, 0.002, 0.05);
      dangleSim.lastT = time;
      const yaw = model.rotation.y;
      const yawVel = (yaw - dangleSim.prevYaw) / dt;
      const yawAcc = (yawVel - dangleSim.prevYawVel) / dt;
      dangleSim.prevYaw = yaw;
      dangleSim.prevYawVel = yawVel;
      const pitch = model.rotation.x;
      const pitchVel = (pitch - dangleSim.prevPitch) / dt;
      const pitchAcc = (pitchVel - dangleSim.prevPitchVel) / dt;
      dangleSim.prevPitch = pitch;
      dangleSim.prevPitchVel = pitchVel;
      const w0 = Math.PI * 2 * dangleSim.freq;
      const zeta = 0.12;
      const drive = 0.0016;
      dangleSim.omegaZ += (-w0 * w0 * dangleSim.thetaZ - 2 * zeta * w0 * dangleSim.omegaZ - clamp(yawAcc, -80, 80) * drive) * dt;
      dangleSim.thetaZ = clamp(dangleSim.thetaZ + dangleSim.omegaZ * dt, -0.32, 0.32);
      dangleSim.omegaX += (-w0 * w0 * dangleSim.thetaX - 2 * zeta * w0 * dangleSim.omegaX - clamp(pitchAcc, -80, 80) * drive) * dt;
      dangleSim.thetaX = clamp(dangleSim.thetaX + dangleSim.omegaX * dt, -0.26, 0.26);
      dangleSim.node.rotation.z = dangleSim.thetaZ;
      dangleSim.node.rotation.x = dangleSim.thetaX;
    }
    camera.position.z += (targetCameraZ - camera.position.z) * 0.1;
    camera.position.y += ((isInspecting ? 0.5 : 0.62) - camera.position.y) * 0.08;
    camera.lookAt(0, 0, 0);
    // Lighting remains fixed in world space. The model/turntable movement
    // alone changes reflection vectors, matching a real studio capture.
    sparkle.visible = !!currentState?.sparkleBurst;
    animateScintillation(time);
    animateMicroSparkles();
    // Phase 4: refresh planar plinth reflection before the post pass. This
    // is one extra scene render at 512² — the post chain immediately after
    // samples the up-to-date reflectionRT through the mirror disc.
    updateReflection();
    if (post) {
      post.render(time);
    } else {
      renderer.render(scene, camera);
    }
    frameId = window.requestAnimationFrame(animate);
  }

  function onPointerDown(event) {
    if (!isInspecting) {
      return;
    }

    event.preventDefault();
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    isDragging = true;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    lastPinchDistance = getPointerDistance();
    canvas.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    if (!isInspecting || !activePointers.has(event.pointerId)) {
      return;
    }

    event.preventDefault();
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointers.size >= 2) {
      const pinchDistance = getPointerDistance();

      if (lastPinchDistance) {
        targetCameraZ = clamp(targetCameraZ - (pinchDistance - lastPinchDistance) * 0.012, cameraMinZ, cameraMaxZ);
      }

      lastPinchDistance = pinchDistance;
      isDragging = false;
      return;
    }

    if (!isDragging) {
      isDragging = true;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      return;
    }

    const width = Math.max(canvas.clientWidth, 1);
    const height = Math.max(canvas.clientHeight, 1);
    const deltaX = (event.clientX - lastPointerX) / width;
    const deltaY = (event.clientY - lastPointerY) / height;

    // Shift / right-button / middle-button drag = PAN along the Y axis
    // (and X for completeness). Regular drag = orbit. This gives Inspect 3D
    // a true vertical axis so you can travel up the side of the ring or
    // down past the gallery.
    const panMode = event.shiftKey || event.buttons === 2 || event.buttons === 4;
    if (panMode) {
      const panScale = 2.2;
      inspectPanX = clamp(inspectPanX + deltaX * panScale, -1.6, 1.6);
      inspectPanY = clamp(inspectPanY - deltaY * panScale, -1.8, 1.8);
    } else {
      targetRotationY += deltaX * 3.2;
      // Expanded tilt range so the user can look straight down at the top
      // of the band or up under the gallery (was ±0.42 rad ≈ 24°).
      targetRotationX = clamp(targetRotationX + deltaY * 2.4, -1.45, 1.45);
    }
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
  }

  function onPointerUp(event) {
    activePointers.delete(event.pointerId);
    lastPinchDistance = getPointerDistance();

    if (activePointers.size === 1) {
      const pointer = activePointers.values().next().value;
      lastPointerX = pointer.x;
      lastPointerY = pointer.y;
      isDragging = true;
    } else {
      isDragging = false;
    }

    try {
      canvas.releasePointerCapture?.(event.pointerId);
    } catch (error) {
      // The pointer may already be released when the cursor leaves the canvas.
    }
  }

  function onWheel(event) {
    if (!isInspecting) {
      return;
    }

    event.preventDefault();
    targetCameraZ = clamp(targetCameraZ + event.deltaY * 0.0038, cameraMinZ, cameraMaxZ);
  }

  // Suppress the browser context menu so right-button drag can be used as
  // a pan gesture without a menu popping up over the canvas.
  function onContextMenu(event) {
    if (isInspecting) event.preventDefault();
  }

  // Keyboard nudges while inspecting: arrows tilt/orbit, Shift+arrows pan
  // along Y/X, +/- zoom. Gives keyboard users a path to the same vertical
  // axis the mouse now provides.
  function onKeyDown(event) {
    if (!isInspecting) return;
    if (event.target && (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA" || event.target.isContentEditable)) return;
    const step = event.shiftKey ? 0.18 : 0.08;
    switch (event.key) {
      case "ArrowUp":
        if (event.shiftKey) inspectPanY = clamp(inspectPanY + step, -1.8, 1.8);
        else targetRotationX = clamp(targetRotationX - step, -1.45, 1.45);
        event.preventDefault();
        break;
      case "ArrowDown":
        if (event.shiftKey) inspectPanY = clamp(inspectPanY - step, -1.8, 1.8);
        else targetRotationX = clamp(targetRotationX + step, -1.45, 1.45);
        event.preventDefault();
        break;
      case "ArrowLeft":
        if (event.shiftKey) inspectPanX = clamp(inspectPanX - step, -1.6, 1.6);
        else targetRotationY -= step;
        event.preventDefault();
        break;
      case "ArrowRight":
        if (event.shiftKey) inspectPanX = clamp(inspectPanX + step, -1.6, 1.6);
        else targetRotationY += step;
        event.preventDefault();
        break;
      case "+":
      case "=":
        targetCameraZ = clamp(targetCameraZ - 0.25, cameraMinZ, cameraMaxZ);
        event.preventDefault();
        break;
      case "-":
      case "_":
        targetCameraZ = clamp(targetCameraZ + 0.25, cameraMinZ, cameraMaxZ);
        event.preventDefault();
        break;
      default:
        break;
    }
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("pointerleave", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("contextmenu", onContextMenu);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", resize);
  rebuild(currentState);
  animate();

  return {
    renderer: "three",
    update: rebuild,
    setInspectMode,
    setAutoOrbit,
    resetView,
    takeScreenshot,
    setReadoutListener,
    isAutoOrbiting: () => isAutoOrbiting,
    isInspecting: () => isInspecting,
    /**
     * Build a fresh piece Group from an arbitrary design state without
     * mutating the visible designer scene. Used by the AR try-on module
     * to render a fully-featured ring (halo, prongs, milgrain, hallmark,
     * pavé, channel, three-stone, baguette flanks, etc.) over the user's
     * hand instead of a simplified placeholder.
     *
     * The returned group reuses the designer's textures (env-independent
     * normal/roughness/inclusion maps) so it composites correctly inside
     * the AR scene's own HDR environment. Caller is responsible for
     * adding the group to its scene and disposing of geometries when no
     * longer needed; materials are fresh per build so dispose is safe.
     */
    buildPiece(state) {
      const prev = currentState;
      const prevSpec = currentPhysicalSpec;
      try {
        currentState = sanitizeDesignState(state || prev);
        currentPhysicalSpec = buildJewellerySpec(currentState);
        const builders = {
          Ring: buildRing,
          Necklace: buildNecklace,
          Bracelet: buildBracelet,
          Earrings: buildEarrings
        };
        return (builders[currentState.piece] || buildRing)();
      } finally {
        currentState = prev;
        currentPhysicalSpec = prevSpec;
      }
    },
    destroy() {
      window.cancelAnimationFrame(frameId);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("keydown", onKeyDown);
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
    },
    setInspectMode(enabled) {
      root.classList.toggle("is-inspecting", Boolean(enabled));
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

const PHYSICAL_CONTROL_DEFS = [
  { name: "ringSizeUS", label: "US ring size", min: 1, max: 16, step: 0.25, placeholder: "7", pieceOnly: "Ring" },
  { name: "bandWidthMm", label: "Shank width", min: 1.2, max: 12, step: 0.05, placeholder: "Auto", unit: "mm", pieceOnly: "Ring" },
  { name: "bandThicknessMm", label: "Shank thickness", min: 1.1, max: 8, step: 0.05, placeholder: "Auto", unit: "mm", pieceOnly: "Ring" },
  { name: "chainLengthMm", label: "Chain length", min: 300, max: 1000, step: 5, placeholder: "450", unit: "mm", pieceOnly: "Necklace" },
  { name: "chainWireMm", label: "Chain wire Ø", min: 0.5, max: 2.6, step: 0.05, placeholder: "Auto", unit: "mm", pieceOnly: "Necklace" },
  { name: "braceletInnerDiameterMm", label: "Bangle inner Ø", min: 50, max: 90, step: 0.5, placeholder: "63", unit: "mm", pieceOnly: "Bracelet" },
  { name: "braceletTubeMm", label: "Band tube Ø", min: 1.6, max: 9, step: 0.1, placeholder: "Auto", unit: "mm", pieceOnly: "Bracelet" },
  { name: "postDiameterMm", label: "Post gauge Ø", min: 0.5, max: 1.6, step: 0.05, placeholder: "0.90", unit: "mm", pieceOnly: "Earrings" },
  { name: "hoopDiameterMm", label: "Hoop inner Ø", min: 8, max: 40, step: 0.5, placeholder: "13", unit: "mm", pieceOnly: "Earrings" },
  { name: "dropLengthMm", label: "Drop length", min: 8, max: 140, step: 1, placeholder: "Auto", unit: "mm", pieceOnly: "Earrings,Necklace" },
  { name: "stoneLengthMm", label: "Stone length", min: 0.8, max: 60, step: 0.05, placeholder: "Auto", unit: "mm" },
  { name: "stoneWidthMm", label: "Stone width", min: 0.8, max: 60, step: 0.05, placeholder: "Auto", unit: "mm" },
  { name: "stoneDepthMm", label: "Stone depth", min: 0.4, max: 35, step: 0.05, placeholder: "Auto", unit: "mm" },
  { name: "lengthWidthRatio", label: "Length / width", min: 0.75, max: 3, step: 0.01, placeholder: "Auto" },
  { name: "tablePct", label: "Table", min: 20, max: 90, step: 0.1, placeholder: "Cut default", unit: "%" },
  { name: "totalDepthPct", label: "Total depth", min: 25, max: 90, step: 0.1, placeholder: "Cut default", unit: "%" },
  { name: "crownAngleDeg", label: "Crown angle", min: 0, max: 60, step: 0.1, placeholder: "Cut default", unit: "°" },
  { name: "pavilionAngleDeg", label: "Pavilion angle", min: 0, max: 60, step: 0.1, placeholder: "Cut default", unit: "°" },
  { name: "girdlePct", label: "Girdle", min: 0.5, max: 12, step: 0.1, placeholder: "Cut default", unit: "%" },
  { name: "culetPct", label: "Culet", min: 0, max: 20, step: 0.1, placeholder: "0", unit: "%" },
  { name: "prongBaseDiameterMm", label: "Prong base Ø", min: 0.45, max: 3, step: 0.05, placeholder: "0.95", unit: "mm" },
  { name: "prongTipDiameterMm", label: "Prong tip Ø", min: 0.25, max: 2, step: 0.05, placeholder: "0.58", unit: "mm" },
  { name: "bearingDepthMm", label: "Bearing depth", min: 0.08, max: 1.2, step: 0.01, placeholder: "0.24", unit: "mm" },
  { name: "galleryHeightMm", label: "Gallery height", min: 1.8, max: 20, step: 0.05, placeholder: "Auto", unit: "mm" },
  { name: "galleryRailDiameterMm", label: "Gallery rail Ø", min: 0.35, max: 2.5, step: 0.05, placeholder: "0.75", unit: "mm" },
  { name: "culetClearanceMm", label: "Culet clearance", min: 0.1, max: 3, step: 0.05, placeholder: "0.35", unit: "mm" },
  { name: "haloMeleeDiameterMm", label: "Halo melee Ø", min: 0.6, max: 4, step: 0.05, placeholder: "1.30", unit: "mm" }
];

function ensurePhysicalControls(root, controls) {
  if (!root || !controls || controls.querySelector("[data-designer-physical-controls]")) return;

  const missing = PHYSICAL_CONTROL_DEFS.filter(({ name }) => !root.querySelector(`[data-designer-field="${name}"]`));
  const needsSymmetry = !root.querySelector('[data-designer-field="symmetryMode"]');
  if (!missing.length && !needsSymmetry) return;

  if (!document.getElementById("designer-physical-controls-style")) {
    const style = document.createElement("style");
    style.id = "designer-physical-controls-style";
    style.textContent = `
      .designer-physical-controls { margin-top: 16px; border: 1px solid rgba(126, 104, 77, .22); border-radius: 14px; overflow: hidden; }
      .designer-physical-controls > summary { cursor: pointer; padding: 13px 15px; font: 600 12px/1.2 system-ui, sans-serif; letter-spacing: .08em; text-transform: uppercase; }
      .designer-physical-controls__body { padding: 0 14px 14px; }
      .designer-physical-controls__intro { margin: 0 0 12px; font: 400 12px/1.5 system-ui, sans-serif; opacity: .72; }
      .designer-physical-controls__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .designer-physical-control { display: grid; gap: 5px; min-width: 0; font: 600 10px/1.2 system-ui, sans-serif; letter-spacing: .06em; text-transform: uppercase; }
      .designer-physical-control span { display: flex; justify-content: space-between; gap: 8px; }
      .designer-physical-control small { opacity: .58; font: inherit; text-transform: none; letter-spacing: 0; }
      .designer-physical-control input, .designer-physical-control select { width: 100%; box-sizing: border-box; border: 1px solid rgba(126, 104, 77, .28); border-radius: 9px; padding: 9px 10px; background: transparent; color: inherit; font: 500 13px/1.2 system-ui, sans-serif; }
      .designer-physical-readout { display: block; margin-top: 12px; padding: 10px 11px; border-radius: 9px; background: rgba(126, 104, 77, .08); font: 500 11px/1.45 system-ui, sans-serif; }
      .designer-physical-readout[data-valid="false"] { background: rgba(150, 40, 30, .10); }
      @media (max-width: 620px) { .designer-physical-controls__grid { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);
  }

  const details = document.createElement("details");
  details.className = "designer-physical-controls";
  details.dataset.designerPhysicalControls = "";
  details.innerHTML = `
    <summary>Physical dimensions · millimetres</summary>
    <div class="designer-physical-controls__body">
      <p class="designer-physical-controls__intro">Blank fields use cut- and setting-specific defaults. Enter certificate or workshop measurements to override them.</p>
      <div class="designer-physical-controls__grid" data-physical-grid></div>
      <output class="designer-physical-readout" data-physical-readout></output>
    </div>
  `;

  const grid = details.querySelector("[data-physical-grid]");
  missing.forEach((definition) => {
    const label = document.createElement("label");
    label.className = "designer-physical-control";
    if (definition.pieceOnly) {
      label.setAttribute("data-piece-only", definition.pieceOnly);
    }
    const caption = document.createElement("span");
    caption.textContent = definition.label;
    if (definition.unit) {
      const unit = document.createElement("small");
      unit.textContent = definition.unit;
      caption.appendChild(unit);
    }
    const input = document.createElement("input");
    input.type = "number";
    input.inputMode = "decimal";
    input.min = String(definition.min);
    input.max = String(definition.max);
    input.step = String(definition.step);
    input.placeholder = definition.placeholder || "Auto";
    input.dataset.designerField = definition.name;
    input.name = `designer-${definition.name}`;
    label.append(caption, input);
    grid.appendChild(label);
  });

  if (needsSymmetry) {
    const label = document.createElement("label");
    label.className = "designer-physical-control";
    label.innerHTML = `<span>Cut symmetry</span><select data-designer-field="symmetryMode" name="designer-symmetryMode"><option value="Precision">Precision</option><option value="Antique">Controlled antique</option></select>`;
    grid.appendChild(label);
  }

  (controls.querySelector("[data-physical-slot]") || controls).appendChild(details);
}

async function setupDesigner(root = document.querySelector("[data-design-studio]")) {
  if (!root) {
    return;
  }

  if (root.dataset.designerReady === "true") {
    return;
  }

  root.dataset.designerReady = "loading";

  const canvas = root.querySelector("[data-designer-canvas]");
  const fallback = root.querySelector("[data-designer-fallback]");
  const controls = root.querySelector("[data-designer-controls]");
  const sendButton = root.querySelector("[data-send-design]");
  const saveButton = root.querySelector("[data-save-design]");
  const shareButton = root.querySelector("[data-share-design]");
  const compareButton = root.querySelector("[data-compare-design]");
  const inspectButton = root.querySelector("[data-inspect-design]");
  const randomizeButton = root.querySelector("[data-randomize-design]");
  const undoButton = root.querySelector("[data-undo-design]");
  const redoButton = root.querySelector("[data-redo-design]");
  const downloadButton = root.querySelector("[data-download-design]");
  const presetButtons = root.querySelectorAll("[data-designer-preset]");
  const status = root.querySelector("[data-designer-share-status]");
  let studio = null;

  ensurePhysicalControls(root, controls);
  setInitialDesignState(root);
  setSummary(root, getState(root));
  updateDesignerSmartDetails(root, getState(root));

  try {
    studio = await createThreeStudio(root, canvas);
  } catch (error) {
    root.dataset.designerError = error instanceof Error ? error.message : "3D preview unavailable";
    studio = createFallbackStudio(root, fallback, canvas);
  }

  // Expose a piece builder so the AR try-on module can render the full
  // high-fidelity ring instead of its simplified placeholder. Guarded
  // against the fallback studio which lacks Three.js.
  if (typeof studio.buildPiece === "function") {
    window.__tjcDesigner = window.__tjcDesigner || {};
    window.__tjcDesigner.buildPiece = studio.buildPiece;
  }

  const update = () => {
    const state = getState(root);
    setSummary(root, state);
    updateDesignerSmartDetails(root, state);
    writeStoredDesignState(DESIGN_STORAGE_KEY, state);
    studio.update(state);
    recordCanvasState(root, canvas.hidden ? fallback.querySelector("[data-designer-fallback-canvas]") : canvas, studio.renderer);
    pushHistory(state);
  };

  // ---- undo / redo history --------------------------------------------
  // Snapshot every settled state so the user can reverse mistakes. We
  // coalesce rapid slider input (last-write-wins within 280 ms) so we
  // don't fill the stack with one entry per pixel of drag.
  const history = [];
  let historyIndex = -1;
  let isRestoringHistory = false;
  let coalesceTimer = null;
  const HISTORY_MAX = 60;

  const refreshHistoryButtons = () => {
    if (undoButton) undoButton.disabled = historyIndex <= 0;
    if (redoButton) redoButton.disabled = historyIndex >= history.length - 1;
  };

  const pushHistory = (state) => {
    if (isRestoringHistory) return;
    const serialized = JSON.stringify(state);
    if (history[historyIndex] === serialized) return;
    if (coalesceTimer) window.clearTimeout(coalesceTimer);
    coalesceTimer = window.setTimeout(() => {
      // Drop forward history when committing a new branch.
      history.splice(historyIndex + 1);
      history.push(serialized);
      if (history.length > HISTORY_MAX) {
        history.shift();
      } else {
        historyIndex += 1;
      }
      refreshHistoryButtons();
    }, 280);
  };

  const restoreFromHistory = () => {
    const serialized = history[historyIndex];
    if (!serialized) return;
    isRestoringHistory = true;
    try {
      applyDesignState(root, JSON.parse(serialized));
      const state = getState(root);
      setSummary(root, state);
      updateDesignerSmartDetails(root, state);
      writeStoredDesignState(DESIGN_STORAGE_KEY, state);
      studio.update(state);
    } finally {
      isRestoringHistory = false;
      refreshHistoryButtons();
    }
  };

  // Seed the stack with the initial state so the very first user change
  // can be undone back to the starting point.
  history.push(JSON.stringify(getState(root)));
  historyIndex = 0;
  refreshHistoryButtons();

  designerUpdates.set(root, update);

  controls?.addEventListener("input", update);
  controls?.addEventListener("change", update);

  // §9 Gate-C minimal correction — one-click viability snap.
  const gateCButton = root.querySelector("[data-reality-fix]");
  if (gateCButton) {
    gateCButton.addEventListener("click", () => {
      const state = getState(root);
      const correction = proposeGateCCorrection(state);
      if (!correction) {
        setDesignerStatus(status, "No realism corrections needed.");
        return;
      }
      const fields = root.querySelectorAll(`[data-designer-field="${correction.field}"]`);
      if (!fields.length) return;
      if (fields.length > 1) {
        // Radio group: select the matching value and fire change on it.
        fields.forEach((r) => { r.checked = (r.value === correction.value); });
        const picked = Array.from(fields).find((r) => r.checked);
        picked?.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        const f = fields[0];
        f.value = correction.value;
        f.dispatchEvent(new Event("input",  { bubbles: true }));
        f.dispatchEvent(new Event("change", { bubbles: true }));
      }
      setDesignerStatus(status, correction.message);
    });
  }

  presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const preset = DESIGN_PRESETS[button.dataset.designerPreset];

      if (!preset) {
        return;
      }

      applyDesignState(root, preset);
      setDesignerStatus(status, `${button.textContent.trim()} design loaded.`);
      update();
    });
  });

  randomizeButton?.addEventListener("click", () => {
    applyDesignState(root, createRandomDesignState(getState(root)));
    setDesignerStatus(status, "A fresh design direction is ready.");
    update();
  });

  const setInspectButtonState = (enabled, message = "") => {
    inspectButton?.setAttribute("aria-pressed", String(Boolean(enabled)));

    if (inspectButton) {
      // Only update text content if it's a text-based button (not an icon button)
      if (!inspectButton.querySelector("svg")) {
        inspectButton.textContent = enabled ? "Exit Inspect" : "Inspect 3D";
      }
    }

    studio.setInspectMode?.(enabled);

    if (message) {
      setDesignerStatus(status, message);
    }
  };

  inspectButton?.addEventListener("click", () => {
    const enabled = inspectButton.getAttribute("aria-pressed") !== "true";

    setInspectButtonState(
      enabled,
      enabled ? "Inspect mode unlocked: drag, pinch, or scroll to zoom." : "Auto rotation restored."
    );
  });

  root.addEventListener("designer:close", () => {
    setInspectButtonState(false);
  });

  // ---- Fullscreen Inspect HUD wiring ---------------------------------------
  const hud = root.querySelector("[data-inspect-hud]");
  const hudExit = root.querySelector("[data-inspect-exit]");
  const hudReadout = root.querySelector("[data-inspect-readout]");
  const hudLightingLabel = root.querySelector("[data-inspect-lighting-label]");
  const hudTitle = root.querySelector("[data-inspect-title]");
  const orbitChip = root.querySelector('[data-inspect-action="orbit"]');
  const lightingChip = root.querySelector('[data-inspect-action="lighting"]');
  const resetChip = root.querySelector('[data-inspect-action="reset"]');
  const screenshotChip = root.querySelector('[data-inspect-action="screenshot"]');
  const viewChips = root.querySelectorAll("[data-inspect-view]");
  const lightingOrder = ["Daylight", "Candlelight", "Showroom", "Flash"];

  const setRadioField = (name, value) => {
    const input = root.querySelector(`[data-designer-field="${name}"][value="${value}"]`);
    if (input) {
      input.checked = true;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  const refreshLightingLabel = () => {
    const current = getState(root).lighting || "Daylight";
    if (hudLightingLabel) hudLightingLabel.textContent = current;
  };

  const refreshTitle = () => {
    const s = getState(root);
    if (hudTitle) hudTitle.textContent = `${s.piece} · ${s.metal}`;
  };

  // Live camera/angle readout
  studio.setReadoutListener?.(({ rx, ry, zoom }) => {
    if (!hudReadout) return;
    hudReadout.textContent = `Y ${ry}° · X ${rx}° · Zoom ${zoom}×`;
  });

  hudExit?.addEventListener("click", () => {
    setInspectButtonState(false, "Auto rotation restored.");
  });

  orbitChip?.addEventListener("click", () => {
    const enabled = orbitChip.getAttribute("aria-pressed") !== "true";
    orbitChip.setAttribute("aria-pressed", String(enabled));
    studio.setAutoOrbit?.(enabled);
    setDesignerStatus(status, enabled ? "Auto-orbit on." : "Auto-orbit off.");
  });

  lightingChip?.addEventListener("click", () => {
    const current = getState(root).lighting || "Daylight";
    const next = lightingOrder[(lightingOrder.indexOf(current) + 1) % lightingOrder.length];
    setRadioField("lighting", next);
    refreshLightingLabel();
  });

  resetChip?.addEventListener("click", () => {
    studio.resetView?.();
    orbitChip?.setAttribute("aria-pressed", "false");
    studio.setAutoOrbit?.(false);
    setDesignerStatus(status, "View reset.");
  });

  screenshotChip?.addEventListener("click", () => {
    const ok = studio.takeScreenshot?.(`tj-design-${Date.now()}.png`);
    setDesignerStatus(status, ok ? "Image downloaded." : "Could not save image.");
  });

  viewChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const view = chip.dataset.inspectView;
      setRadioField("view", view);
      viewChips.forEach((c) => c.classList.toggle("is-active", c === chip));
    });
  });

  // Double-click the canvas to reset rotation/zoom
  canvas.addEventListener("dblclick", () => {
    if (studio.isInspecting?.()) {
      studio.resetView?.();
    }
  });

  // ESC closes inspect mode anywhere on the page
  document.addEventListener("keydown", (event) => {
    if (!studio.isInspecting?.()) return;
    if (event.key === "Escape") {
      setInspectButtonState(false, "Inspect closed.");
    } else if (event.key === "r" || event.key === "R") {
      studio.resetView?.();
    } else if (event.key === " " || event.code === "Space") {
      event.preventDefault();
      orbitChip?.click();
    }
  });

  // Sync HUD labels when underlying state changes (presets / form / etc.)
  controls?.addEventListener("change", () => { refreshLightingLabel(); refreshTitle(); });
  refreshLightingLabel();
  refreshTitle();

  saveButton?.addEventListener("click", () => {
    const state = getState(root);

    writeStoredDesignState(SAVED_DESIGN_KEY, state);
    updateDesignerSmartDetails(root, state);
    setDesignerStatus(status, "Design saved in this browser.");
  });

  shareButton?.addEventListener("click", async () => {
    const state = getState(root);
    const url = createDesignUrl(state);

    try {
      await navigator.clipboard.writeText(url);
      setDesignerStatus(status, "Design link copied.");
    } catch (error) {
      window.history.replaceState(null, "", url);
      setDesignerStatus(status, "Design link is now in the address bar.");
    }
  });

  compareButton?.addEventListener("click", () => {
    const savedState = readStoredDesignState(SAVED_DESIGN_KEY);
    const savedSummary = root.querySelector("[data-designer-saved-summary]");
    const savedCard = root.querySelector("[data-designer-saved-card]");

    if (!savedState) {
      setDesignerStatus(status, "Save a design first.");
      return;
    }

    if (savedCard && savedSummary) {
      savedCard.hidden = false;
      savedSummary.textContent = `Saved: ${createCompactDesignLabel(savedState)} | Current: ${createCompactDesignLabel(getState(root))}`;
    }

    setDesignerStatus(status, "Saved design compared.");
  });

  undoButton?.addEventListener("click", () => {
    if (historyIndex <= 0) return;
    historyIndex -= 1;
    restoreFromHistory();
    setDesignerStatus(status, "Undid last change.");
  });

  redoButton?.addEventListener("click", () => {
    if (historyIndex >= history.length - 1) return;
    historyIndex += 1;
    restoreFromHistory();
    setDesignerStatus(status, "Redid change.");
  });

  downloadButton?.addEventListener("click", () => {
    const sourceCanvas = canvas.hidden ? fallback.querySelector("[data-designer-fallback-canvas]") : canvas;
    if (!sourceCanvas) return;
    try {
      sourceCanvas.toBlob((blob) => {
        if (!blob) {
          setDesignerStatus(status, "Could not capture the canvas.");
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const state = getState(root);
        const safe = `${state.piece}-${state.shape}-${state.stone}`.replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
        link.href = url;
        link.download = `tjc-design-${safe}.png`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 4000);
        setDesignerStatus(status, "Design image downloaded.");
      }, "image/png");
    } catch (error) {
      setDesignerStatus(status, "Download failed — try Save Image in Inspect mode.");
    }
  });

  // Keyboard shortcuts — work anywhere outside text inputs.
  document.addEventListener("keydown", (event) => {
    if (root.hidden) return;
    const target = event.target;
    const isTyping = target instanceof HTMLElement && (
      target.matches("input[type=text], textarea, [contenteditable=true]")
    );
    if (isTyping) return;
    const mod = event.metaKey || event.ctrlKey;
    if (mod && (event.key === "z" || event.key === "Z")) {
      event.preventDefault();
      if (event.shiftKey) {
        redoButton?.click();
      } else {
        undoButton?.click();
      }
    } else if (mod && (event.key === "y" || event.key === "Y")) {
      event.preventDefault();
      redoButton?.click();
    }
  });

  sendButton?.addEventListener("click", async () => {
    const state = getState(root);
    const sourceCanvas = canvas.hidden ? fallback.querySelector("[data-designer-fallback-canvas]") : canvas;

    sendButton.textContent = "Capturing Design...";

    try {
      await attachDesignScreenshot(sourceCanvas, state);
    } catch (error) {
      root.dataset.designerCaptureError = error instanceof Error ? error.message : "Unable to attach design preview";
      updateDesignBriefCard(state);
    }

    fillRequestForm(state);
    sendButton.textContent = "Design Sent";
    window.setTimeout(() => {
      sendButton.textContent = "Send Design to Request Form";
    }, 1800);
  });

  update();
  root.dataset.designerReady = "true";
}

function ensureDesignerReady(root) {
  if (!designerSetupPromise) {
    designerSetupPromise = setupDesigner(root).catch((error) => {
      designerSetupPromise = null;
      throw error;
    });
  }

  return designerSetupPromise;
}

function isSamePageDesignStudioLink(link) {
  if (!link || link.hash !== DESIGN_STUDIO_HASH) {
    return false;
  }

  const url = new URL(link.href, window.location.href);

  return url.origin === window.location.origin && url.pathname === window.location.pathname;
}

function syncDesignerFromCurrentUrl(root) {
  setInitialDesignState(root);
  designerUpdates.get(root)?.();
}

async function openDesignStudio(root, options = {}) {
  const { url = null, scroll = true } = options;
  const closeButton = document.querySelector("[data-close-design-studio]");

  if (!root) {
    return;
  }

  if (url) {
    window.history.pushState(null, "", url.toString());
  }

  root.hidden = false;
  root.dataset.designerOptIn = "true";
  if (closeButton) {
    closeButton.hidden = false;
  }

  if (scroll) {
    window.requestAnimationFrame(() => {
      root.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  await ensureDesignerReady(root);
  syncDesignerFromCurrentUrl(root);
}

function closeDesignStudio(root) {
  const closeButton = document.querySelector("[data-close-design-studio]");

  if (!root) {
    return;
  }

  root.hidden = true;
  root.dataset.designerOptIn = "false";
  root.dispatchEvent(new CustomEvent("designer:close"));
  if (closeButton) {
    closeButton.hidden = true;
  }

  const requestForm = document.querySelector("#request-form");
  const url = new URL(window.location.href);
  url.hash = "request-form";
  window.history.replaceState(null, "", url.toString());

  requestForm?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setupDesignerGate() {
  const root = document.querySelector("[data-design-studio]");
  const closeButton = document.querySelector("[data-close-design-studio]");

  if (!root) {
    return;
  }

  if (!DESIGN_STUDIO_PUBLIC) {
    root.hidden = true;
    root.dataset.designerPublic = "false";
    if (closeButton) {
      closeButton.hidden = true;
    }
    if (window.location.hash === DESIGN_STUDIO_HASH) {
      const url = new URL(window.location.href);
      url.hash = "request-form";
      window.history.replaceState(null, "", url.toString());
    }
    return;
  }

  if (window.location.hash !== DESIGN_STUDIO_HASH) {
    root.hidden = true;
    if (closeButton) {
      closeButton.hidden = true;
    }
  }

  closeButton?.addEventListener("click", () => {
    closeDesignStudio(root);
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    const link = target instanceof Element ? target.closest("a[href]") : null;

    if (!isSamePageDesignStudioLink(link)) {
      return;
    }

    event.preventDefault();
    openDesignStudio(root, { url: new URL(link.href, window.location.href) });
  });

  window.addEventListener("hashchange", () => {
    if (window.location.hash === DESIGN_STUDIO_HASH) {
      openDesignStudio(root);
    }
  });

  if (window.location.hash === DESIGN_STUDIO_HASH) {
    openDesignStudio(root, { scroll: false });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupDesignerGate);
} else {
  setupDesignerGate();
}
