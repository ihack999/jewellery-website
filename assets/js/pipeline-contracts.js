import { buildJewellerySpec } from "./jewellery-spec.js";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object.`);
  }
}

/**
 * Stable request sent to a CAD/CSG service. This is intentionally a contract,
 * not a false claim that a Three.js preview mesh is production-ready STEP.
 */
export function createManufacturingRequest(state, options = {}) {
  assertObject(state, "state");
  assertObject(options, "options");
  const spec = buildJewellerySpec(state);
  const errors = spec.validation.issues.filter((issue) => issue.severity === "error");

  if (errors.length && options.allowInvalid !== true) {
    const error = new Error(`Manufacturing request rejected: ${errors.map((item) => item.code).join(", ")}`);
    error.code = "INVALID_JEWELLERY_SPEC";
    error.issues = clone(errors);
    throw error;
  }

  return {
    schema: "tjc.manufacturing-request.v1",
    requestedOutput: options.requestedOutput || ["STEP", "STL", "3MF"],
    toleranceMm: Number.isFinite(Number(options.toleranceMm)) ? Number(options.toleranceMm) : 0.025,
    jewellerySpec: clone(spec),
    operations: {
      booleanUnion: true,
      removeInternalIntersections: true,
      filletShankTransitions: true,
      cutProngBearings: true,
      verifyManifold: true,
      calculateExactMetalVolume: true,
      preserveGemAsSeparateBody: true
    },
    qualityGates: {
      minimumWallMm: 0.45,
      minimumFinishedShankWidthMm: 1.6,
      minimumFinishedShankThicknessMm: 1.45,
      minimumCuletClearanceMm: 0.25,
      maximumOpenEdges: 0,
      maximumNonManifoldEdges: 0
    }
  };
}

/**
 * Stable request for a server-side path-traced catalogue/hero render.
 */
export function createHeroRenderRequest(state, options = {}) {
  assertObject(state, "state");
  assertObject(options, "options");
  const spec = buildJewellerySpec(state);

  return {
    schema: "tjc.hero-render-request.v1",
    jewellerySpec: clone(spec),
    geometrySource: options.geometrySource || "cad-service",
    output: {
      width: Math.max(512, Math.round(Number(options.width) || 2400)),
      height: Math.max(512, Math.round(Number(options.height) || 2400)),
      format: options.format || "png",
      transparent: Boolean(options.transparent),
      samples: Math.max(64, Math.round(Number(options.samples) || 1024)),
      denoise: options.denoise !== false
    },
    optics: {
      spectralSamples: Math.max(3, Math.round(Number(options.spectralSamples) || 9)),
      internalReflections: true,
      totalInternalReflection: true,
      wavelengthDependentIor: true,
      caustics: true,
      depthOfField: options.depthOfField !== false
    },
    camera: {
      focalLengthMm: Number(options.focalLengthMm) || 85,
      fStop: Number(options.fStop) || 8,
      focusTarget: options.focusTarget || "center-stone-table",
      view: options.view || state.view || "Three-Quarter"
    },
    lighting: {
      environmentId: options.environmentId || "studio-softbox-neutral",
      exposureEv: Number.isFinite(Number(options.exposureEv)) ? Number(options.exposureEv) : 0,
      noAutonomousSparkleLights: true
    }
  };
}

/**
 * Metadata bundled beside an optimized GLB used by browser/native AR.
 */
export function createArAssetManifest(state, options = {}) {
  assertObject(state, "state");
  assertObject(options, "options");
  const spec = buildJewellerySpec(state);

  return {
    schema: "tjc.ar-asset-manifest.v1",
    jewellerySpec: clone(spec),
    asset: {
      uri: options.uri || "piece.glb",
      units: "millimetres",
      localUnitsPerMm: spec.world.unitsPerMm,
      upAxis: "+Y",
      fingerAxis: "+Z",
      stoneDirection: "+Y",
      draco: options.draco !== false,
      meshopt: options.meshopt !== false
    },
    anchors: {
      ringSeat: [0, 0, 0],
      fingerAxis: [0, 0, 1],
      stoneDirection: [0, 1, 0]
    },
    lod: options.lod || [
      { name: "hero", maxTriangles: 180000 },
      { name: "mobile", maxTriangles: 55000 },
      { name: "fallback", maxTriangles: 18000 }
    ]
  };
}
