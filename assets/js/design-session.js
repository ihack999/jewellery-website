export const GENERATOR_VERSION = "3.2.0";
export const MATERIAL_VERSION = "3.2.0";

export function normalizeSeed(value) {
  return String(value ?? "atelier-001").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48) || "atelier-001";
}

export function createSeededRandom(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return () => {
    hash += 0x6d2b79f5;
    let mixed = Math.imul(hash ^ (hash >>> 15), 1 | hash);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().filter((key) => value[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function designRevision(state) {
  let hash = 2166136261;
  for (const character of canonicalJson(state)) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return `v3-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export const DESIGN_FAMILIES = Object.freeze({
  Classic: { shapes: ["Round", "Oval", "Cushion"], bands: ["Solitaire", "Knife-Edge"], settings: ["Prong", "Cathedral"], metals: ["Yellow Gold", "Platinum", "White Gold"], finishes: ["High Polish"], stones: ["Clear Diamond", "Blue Sapphire"], halo: 0.2, accent: 0.3 },
  "Art Deco": { shapes: ["Emerald", "Asscher", "Baguette", "Hexagon"], bands: ["Tapered Baguette", "Channel", "Three-Stone"], settings: ["Prong", "Bezel"], metals: ["Platinum", "Yellow Gold", "White Gold"], finishes: ["High Polish", "Milgrain Edge"], stones: ["Clear Diamond", "Emerald Green", "Blue Sapphire"], halo: 0.35, accent: 0.8 },
  Romantic: { shapes: ["Oval", "Pear", "Cushion", "Round"], bands: ["Twist", "Pavé", "Solitaire"], settings: ["Trellis", "Prong"], metals: ["Rose Gold", "Champagne Gold", "Yellow Gold"], finishes: ["High Polish", "Soft Satin"], stones: ["Morganite Peach", "Blush Sapphire", "Clear Diamond", "Padparadscha"], halo: 0.5, accent: 0.5 },
  Sculptural: { shapes: ["Kite", "Hexagon", "Trillion", "Emerald"], bands: ["Bypass", "Knife-Edge", "Solitaire"], settings: ["Bezel", "Prong"], metals: ["Yellow Gold", "Platinum", "Rose Gold"], finishes: ["Brushed", "Soft Satin", "High Polish"], stones: ["Black Onyx", "Clear Diamond", "Aquamarine"], halo: 0, accent: 0.15 },
  Vintage: { shapes: ["Cushion", "Round", "Oval", "Asscher"], bands: ["Three-Stone", "Pavé", "Solitaire"], settings: ["Prong", "Trellis"], metals: ["Yellow Gold", "Platinum", "Rose Gold"], finishes: ["Milgrain Edge", "High Polish"], stones: ["Clear Diamond", "Blue Sapphire", "Ruby Red", "Emerald Green"], halo: 0.65, accent: 0.6 }
});

export const LOCK_GROUPS = Object.freeze({
  stone: ["stone", "shape", "size", "accentStone", "stoneLengthMm", "stoneWidthMm", "stoneDepthMm", "lengthWidthRatio", "tablePct", "totalDepthPct", "crownAngleDeg", "pavilionAngleDeg", "girdlePct", "culetPct", "symmetryMode"],
  metal: ["metal", "karat", "finish", "twoTone", "finishStrength", "finishScaleMm", "patinaCoverage"],
  structure: ["piece", "silhouette", "band", "setting", "halo", "accent", "hiddenHalo", "milgrain", "prongCount", "prongHeight", "setRotation", "stoneTilt", "haloGap", "haloCount", "accentDensity", "chainType", "clasp", "weight", "chainLengthMm", "chainWireMm", "braceletLengthMm", "braceletWidthMm", "braceletTubeMm", "braceletInnerDiameterMm", "braceletStoneDiameterMm", "cuffGapMm", "prongBaseDiameterMm", "prongTipDiameterMm", "bearingDepthMm", "galleryHeightMm", "galleryRailDiameterMm", "culetClearanceMm", "haloMeleeDiameterMm"]
});

export function createDesignVariation(current, familyName = "Classic", locked = []) {
  const family = DESIGN_FAMILIES[familyName] || DESIGN_FAMILIES.Classic;
  const variationIndex = Math.max(0, Math.trunc(Number(current.variationIndex) || 0)) + 1;
  const random = createSeededRandom(`${normalizeSeed(current.seed)}:${familyName}:${variationIndex}`);
  const pick = (items) => items[Math.floor(random() * items.length)];
  const next = {
    ...current,
    seed: normalizeSeed(current.seed), variationIndex, designFamily: familyName,
    shape: pick(family.shapes), stone: pick(family.stones), metal: pick(family.metals),
    setting: pick(family.settings), band: pick(family.bands), finish: pick(family.finishes),
    size: (0.8 + random() * 1.6).toFixed(1), weight: (0.9 + random() * 0.35).toFixed(2),
    halo: random() < family.halo, accent: random() < family.accent,
    hiddenHalo: false, milgrain: familyName === "Vintage", twoTone: false,
    prongCount: "Auto", prongHeight: "1.00", setRotation: "0", stoneTilt: "0",
    haloGap: "0.25", haloCount: "Auto", accentDensity: "Auto",
    symmetryMode: familyName === "Vintage" ? "Antique" : "Precision"
  };
  next.karat = next.metal === "Platinum" ? "950" : "18K";
  for (const field of LOCK_GROUPS.stone) {
    if (field.endsWith("Mm") || field.endsWith("Pct") || field.endsWith("Deg") || field === "lengthWidthRatio") next[field] = "";
  }
  for (const field of ["prongBaseDiameterMm", "prongTipDiameterMm", "bearingDepthMm", "galleryHeightMm", "galleryRailDiameterMm", "haloMeleeDiameterMm"]) next[field] = "";
  for (const group of locked) {
    for (const field of LOCK_GROUPS[group] || []) next[field] = current[field];
  }
  return next;
}

export function createDesignDocument(state, specification) {
  return {
    schema: "tjc.design.v3", generatorVersion: GENERATOR_VERSION, materialVersion: MATERIAL_VERSION,
    revision: designRevision(state), state: JSON.parse(JSON.stringify(state)),
    specification: JSON.parse(JSON.stringify(specification)),
    representation: "parametric-preview", units: "mm"
  };
}

export function readDesignDocument(text) {
  if (text.length > 1024 * 1024) throw new Error("Design files must be smaller than 1 MB.");
  const document = JSON.parse(text);
  if (!document || !["tjc.design.v2", "tjc.design.v3"].includes(document.schema) || !document.state || Array.isArray(document.state) || typeof document.state !== "object") {
    throw new Error("Choose a jewellery design JSON exported from this studio.");
  }
  if (Object.values(document.state).some((value) => value !== null && typeof value === "object")) {
    throw new Error("The design contains unsupported parameter values.");
  }
  return document.schema === "tjc.design.v2" ? { opticsMode: "Fast", gemBounces: "12", dispersionStrength: "1", absorptionStrength: "1", inclusionDensity: "1", ...document.state } : document.state;
}

export function createDesignHistory(initialState, limit = 60) {
  const entries = [canonicalJson(initialState)];
  let cursor = 0;
  return {
    get canUndo() { return cursor > 0; },
    get canRedo() { return cursor < entries.length - 1; },
    commit(state) {
      const serialized = canonicalJson(state);
      if (serialized === entries[cursor]) return;
      entries.splice(cursor + 1);
      entries.push(serialized);
      if (entries.length > limit) entries.shift();
      cursor = entries.length - 1;
    },
    undo() { if (cursor > 0) cursor -= 1; return JSON.parse(entries[cursor]); },
    redo() { if (cursor < entries.length - 1) cursor += 1; return JSON.parse(entries[cursor]); }
  };
}
