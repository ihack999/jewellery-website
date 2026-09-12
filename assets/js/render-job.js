import { createDesignDocument, createSeededRandom } from "./design-session.js?v=20260911-construction-v32";
import { gemstoneIors } from "./gem-ray-kernel.js?v=20260911-construction-v32";

export function createRenderJob(state, specification, profile, options = {}) {
  const choose = (value, choices, fallback) => choices.includes(value) ? value : fallback;
  return {
    schema: "tjc.cycles-job.v1", engine: "CYCLES", units: "metres",
    resolution: choose(Number(options.resolution), [512, 1024, 2048, 4096], 2048),
    samples: choose(Number(options.samples), [64, 256, 1024], 256),
    maxBounces: 24, transmissionBounces: 20,
    seed: Math.floor(createSeededRandom(state.seed)() * 2147483647),
    view: choose(options.view, ["Three-Quarter", "Profile", "Top"], "Three-Quarter"),
    background: choose(options.background, ["Charcoal", "Ivory", "Transparent"], "Charcoal"),
    aperture: choose(Number(options.aperture), [0, 8, 16, 32], 0),
    transport: options.transport === "Three-Band" ? "Three-Band" : "RGB",
    gemIors: gemstoneIors(profile.ior || 1.5, profile.dispersion || 0, Number(state.dispersionStrength ?? 1)),
    referenceIor: profile.ior || 1.5,
    design: createDesignDocument(state, specification),
    limitations: ["Three-band dispersion composites three RGB path-traced renders; it is not full spectral transport.", "Alloy and absorption profiles are artistic defaults, not measured material certification.", "The asset contains intersecting preview components, not manufacturing solids."]
  };
}
