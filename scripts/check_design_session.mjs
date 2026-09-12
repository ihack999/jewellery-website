import assert from "node:assert/strict";
import {
  LOCK_GROUPS,
  MATERIAL_VERSION,
  GENERATOR_VERSION,
  canonicalJson,
  createDesignDocument,
  createDesignHistory,
  createDesignVariation,
  createSeededRandom,
  designRevision,
  normalizeSeed,
  readDesignDocument
} from "../assets/js/design-session.js";

const baseState = {
  piece: "Ring",
  silhouette: "Solitaire",
  stone: "Clear Diamond",
  shape: "Oval",
  size: "1.4",
  metal: "Yellow Gold",
  karat: "18K",
  finish: "High Polish",
  ringSize: "7",
  stoneLengthMm: "10.2",
  stoneWidthMm: "7.0",
  stoneDepthMm: "4.3",
  chainLengthMm: "500",
  chainWireMm: "1.25",
  braceletLengthMm: "178",
  braceletTubeMm: "3.2",
  seed: "Aurora seed/01",
  variationIndex: 0,
  symmetryMode: "Precision",
  accentStone: "Clear Diamond",
  accent: false,
  setting: "Prong",
  band: "Solitaire",
  hiddenHalo: false,
  milgrain: false,
  prongCount: "Auto",
  prongHeight: "1.00",
  setRotation: "0",
  stoneTilt: "0",
  haloGap: "0.25",
  haloCount: "Auto",
  accentDensity: "Auto"
};

const specification = {
  version: 3,
  units: "mm",
  world: { unitsPerMm: 0.12 },
  dimensions: { ringSize: "7", stoneLengthMm: "10.2", chainLengthMm: "500" }
};

let passed = 0;
function check(condition, message) {
  assert.ok(condition, message);
  passed += 1;
}

function sameFields(left, right, fields) {
  return fields.every((field) => canonicalJson(left[field]) === canonicalJson(right[field]));
}

check(normalizeSeed("Aurora seed/01") === "Auroraseed01", "seed normalization removes unsupported characters");
check(normalizeSeed("") === "atelier-001", "empty seeds use the stable default");

const randomA = createSeededRandom("repeatable");
const randomB = createSeededRandom("repeatable");
check([randomA(), randomA(), randomA()].join(",") === [randomB(), randomB(), randomB()].join(","), "seeded random streams repeat");

const variationA = createDesignVariation(baseState, "Vintage", ["stone", "metal", "structure"]);
const variationB = createDesignVariation(baseState, "Vintage", ["stone", "metal", "structure"]);
assert.deepEqual(variationA, variationB, "identical variation inputs should produce identical state");
check(variationA.variationIndex === 1, "variation index increments from the current state");
check(sameFields(variationA, baseState, LOCK_GROUPS.stone), "stone lock preserves all stone and cut fields");
check(sameFields(variationA, baseState, LOCK_GROUPS.metal), "metal lock preserves all metal and finish fields");
check(sameFields(variationA, baseState, LOCK_GROUPS.structure), "structure lock preserves fit and construction fields");
check(sameFields(variationA, baseState, ["ringSize", "chainLengthMm", "chainWireMm", "braceletLengthMm", "braceletTubeMm"]), "physical fit dimensions survive variation");

const history = createDesignHistory({ step: 0 });
history.commit({ step: 1 });
history.commit({ step: 2 });
assert.deepEqual(history.undo(), { step: 1 });
assert.deepEqual(history.undo(), { step: 0 });
check(history.canRedo, "undo exposes redo history");
assert.deepEqual(history.redo(), { step: 1 });
history.commit({ step: 9 });
check(!history.canRedo, "a new edit truncates the redo branch");
assert.deepEqual(history.redo(), { step: 9 });

const document = createDesignDocument(baseState, specification);
check(document.schema === "tjc.design.v3", "new documents use the current schema");
check(document.generatorVersion === GENERATOR_VERSION && document.materialVersion === MATERIAL_VERSION, "documents record generator and material versions");
check(document.units === "mm" && document.specification.world.unitsPerMm === 0.12, "documents retain millimetre and display conversion metadata");
check(document.revision === designRevision(baseState), "document revision is derived from canonical state");
assert.deepEqual(readDesignDocument(JSON.stringify(document)), baseState, "v3 JSON round trip preserves editable state");

const reorderedState = { variationIndex: baseState.variationIndex, ...baseState };
check(designRevision(reorderedState) === designRevision(baseState), "revisions ignore object key order");
const legacy = JSON.stringify({ schema: "tjc.design.v2", state: { piece: "Ring", seed: "legacy", ringSize: "6.5" }, specification: { units: "mm" } });
const migrated = readDesignDocument(legacy);
check(migrated.opticsMode === "Fast" && migrated.gemBounces === "12", "v2 documents receive migration defaults");
check(migrated.ringSize === "6.5" && migrated.seed === "legacy", "v2 migration preserves editable values");

assert.throws(() => readDesignDocument(JSON.stringify({ schema: "tjc.design.v3", state: { nested: {} } })), /unsupported parameter values/);
assert.throws(() => readDesignDocument(JSON.stringify({ schema: "unknown", state: {} })), /Choose a jewellery design JSON/);
check(true, "malformed document guards are active");

console.log(JSON.stringify({ passed, generatorVersion: GENERATOR_VERSION, materialVersion: MATERIAL_VERSION, schema: document.schema, units: document.units }));
