export const GEM_APPEARANCES = Object.freeze({
  "Clear Diamond": { kind: "crystal", absorption: "#ffffff", distanceMm: 50, roughness: 0.01 },
  "Blush Sapphire": { kind: "crystal", absorption: "#ee97b0", distanceMm: 4.5, roughness: 0.015 },
  "Blue Sapphire": { kind: "crystal", absorption: "#406aca", distanceMm: 3.5, roughness: 0.015 },
  "Emerald Green": { kind: "crystal", absorption: "#31c98a", distanceMm: 3.5, roughness: 0.022 },
  "Ruby Red": { kind: "crystal", absorption: "#db3858", distanceMm: 4.5, roughness: 0.016 },
  "Amethyst Purple": { kind: "crystal", absorption: "#a369d6", distanceMm: 5, roughness: 0.017 },
  Aquamarine: { kind: "crystal", absorption: "#a7e4ed", distanceMm: 6.5, roughness: 0.015 },
  "Black Onyx": { kind: "opaque", absorption: "#111214", body: "#101214", distanceMm: 0.2, roughness: 0.12, transmission: 0 },
  "Fire Opal": { kind: "translucent", absorption: "#ffb668", body: "#ed8e35", distanceMm: 5, roughness: 0.12, transmission: 0.62 },
  "Citrine Yellow": { kind: "crystal", absorption: "#f4cf75", distanceMm: 4.5, roughness: 0.016 },
  "Morganite Peach": { kind: "crystal", absorption: "#f4b8a9", distanceMm: 6.5, roughness: 0.015 },
  "Tanzanite Violet": { kind: "crystal", absorption: "#7970d8", distanceMm: 4.2, roughness: 0.016 },
  "Salt & Pepper": { kind: "crystal", absorption: "#c4c2bd", distanceMm: 7, roughness: 0.025 },
  "Alexandrite Shift": { kind: "crystal", absorption: "#64c09b", warmAbsorption: "#c56183", distanceMm: 4.5, roughness: 0.018 },
  "Paraiba Tourmaline": { kind: "crystal", absorption: "#51d7d8", distanceMm: 4, roughness: 0.018 },
  "Moonstone Glow": { kind: "translucent", absorption: "#bed5f5", body: "#c3d0e3", distanceMm: 7, roughness: 0.19, transmission: 0.32 },
  Padparadscha: { kind: "crystal", absorption: "#f3aa89", distanceMm: 4.8, roughness: 0.016 }
});

export function resolvedGemProfile(name, profile) {
  const appearance = GEM_APPEARANCES[name];
  return appearance ? { ...profile, ...appearance, attenuationDistanceMm: appearance.distanceMm, transmission: appearance.kind === "crystal" ? 1 : appearance.transmission } : profile;
}
