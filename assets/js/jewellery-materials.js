import { WORLD_UNITS_PER_MM } from "./jewellery-spec.js?v=20260911-construction-v32";

export const FINISH_PROFILES = Object.freeze({
  "High Polish": { roughness: 0.105, anisotropy: 0, normal: 0 },
  "Soft Satin": { roughness: 0.36, anisotropy: 0.45, normal: 0.06 },
  "Milgrain Edge": { roughness: 0.13, anisotropy: 0, normal: 0 },
  Hammered: { roughness: 0.30, anisotropy: 0, normal: 0.24 },
  Sandblast: { roughness: 0.62, anisotropy: 0, normal: 0.12 },
  Brushed: { roughness: 0.32, anisotropy: 0.80, normal: 0.10 },
  Stardust: { roughness: 0.48, anisotropy: 0, normal: 0.10 }
});

// Encoded sRGB conductor reflectance, decoded once by Three. These are not
// diffuse paint swatches. Pure-metal references follow Filament's material
// table; jewellery alloys/platings are bounded appearance approximations,
// since karat alone does not specify alloy composition or surface treatment.
export const METAL_REFLECTANCE = Object.freeze({
  "Yellow Gold": { "10K": 0xf3dfbc, "14K": 0xf9dfb1, "18K": 0xfddba4, "22K": 0xffd999, default: 0xfddba4 },
  "Rose Gold": { "10K": 0xefd0c1, "14K": 0xf2c6b7, "18K": 0xf3bdab, "22K": 0xf8c79f, default: 0xf3bdab },
  "White Gold": { default: 0xe5e4e0 },
  Platinum: { default: 0xd3cec6 },
  "Champagne Gold": { "10K": 0xf0e0c7, "14K": 0xf3debc, "18K": 0xf6dbb0, "22K": 0xfbddaa, default: 0xf6dbb0 },
  "Black Gold": { default: 0x686368 },
  "Mirror Silver": { default: 0xf7f4e8 },
  "Two-Tone Mix": { default: 0xf3debc }
});

export function metalReflectanceColor(THREE, metal, karat) {
  const profile = METAL_REFLECTANCE[metal] || METAL_REFLECTANCE["White Gold"];
  return new THREE.Color().setHex(profile[karat] ?? profile.default, THREE.SRGBColorSpace);
}

export function metalFinishParameters(finish, strength = 1) {
  const profile = FINISH_PROFILES[finish] || FINISH_PROFILES["High Polish"];
  const amount = Math.max(0, Math.min(2, Number.isFinite(Number(strength)) ? Number(strength) : 1));
  return {
    roughness: Math.min(.85, .085 + (profile.roughness - .085) * amount),
    anisotropy: Math.min(.9, profile.anisotropy * amount),
    normal: profile.normal * amount
  };
}

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
