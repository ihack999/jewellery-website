import { WORLD_UNITS_PER_MM } from "./jewellery-spec.js?v=20260911-construction-v32";

export const FINISH_PROFILES = Object.freeze({
  "High Polish": { roughness: 0.16, anisotropy: 0.08, normal: 0.015 },
  "Soft Satin": { roughness: 0.36, anisotropy: 0.45, normal: 0.06 },
  "Milgrain Edge": { roughness: 0.20, anisotropy: 0.08, normal: 0.02 },
  Hammered: { roughness: 0.30, anisotropy: 0, normal: 0.24 },
  Sandblast: { roughness: 0.62, anisotropy: 0, normal: 0.12 },
  Brushed: { roughness: 0.32, anisotropy: 0.80, normal: 0.10 },
  Stardust: { roughness: 0.48, anisotropy: 0, normal: 0.10 }
});

export function gemOpticalParameters(profile, depthWorld, appearance = "Photographic", options = {}) {
  const depth = Math.max(0.0001, Number(depthWorld) || 0.1);
  const attenuationDistanceMm = Math.max(0.01, Number(profile.attenuationDistanceMm) || Number(profile.attenuationDistance) / WORLD_UNITS_PER_MM || 50);
  const artistic = appearance === "Expressive";
  return {
    metalness: 0, roughness: Math.max(0, Math.min(1, profile.roughness ?? 0.01)),
    opacity: 1, transparent: false, transmission: profile.transmission ?? 1,
    thickness: depth, ior: profile.ior || 1.5,
    dispersion: Math.min(1.5, (profile.dispersion || 0) * (artistic ? 14 : 6) * Number(options.dispersionStrength ?? 1)),
    attenuationDistance: attenuationDistanceMm * WORLD_UNITS_PER_MM / Math.max(0.1, Number(options.absorptionStrength ?? 1)),
    attenuationColor: profile.absorption || "#ffffff",
    specularIntensity: 1, specularColor: "#ffffff", clearcoat: 0,
    envMapIntensity: 1, iridescence: 0, sheen: 0
  };
}
