import * as THREE from "../three.module.js";
import { GEM_APPEARANCES } from "../gem-appearance.js?v=20260911-construction-v32";
import { installGemRayMaterial } from "../gem-ray-material.js?v=20260911-ar-live2";

export function configureWearableGemOptics(wearable, state) {
  if (wearable.pose.userData.arOptics) return wearable.pose.userData.arOptics;
  const candidates = [];
  wearable.piece.traverse((mesh) => {
    const material = mesh.material;
    const name = mesh.userData.gemMaterial || material?.userData?.gemMaterial || state.stone;
    if (mesh.userData.isGem && mesh.geometry?.userData.kind === "gemstone" && material?.transmission >= 0.55 && GEM_APPEARANCES[name]?.kind === "crystal") {
      candidates.push({ mesh, width: mesh.geometry.userData.dimensionsMm?.width || 0 });
    }
  });
  wearable.pose.updateWorldMatrix(true, true);
  const worldToPhysical = wearable.pose.matrixWorld.clone().invert();
  const originals = new Set();
  let count = 0;
  const budget = state.opticsMode === "Fast" ? 0 : 64;
  for (const { mesh, width } of candidates.sort((first, second) => second.width - first.width).slice(0, budget)) {
    const smallGem = width < 4 || state.piece === "Bracelet";
    const dispersion = mesh.material.dispersion / (state.appearance === "Expressive" ? 14 : 6);
    try {
      const original = installGemRayMaterial(THREE, mesh, {
        physicalMatrix: worldToPhysical.clone().multiply(mesh.matrixWorld),
        dispersion: Number.isFinite(dispersion) ? dispersion : 0,
        strength: smallGem ? 0 : 1,
        bounces: Math.max(1, Math.min(Number(state.gemBounces) || 12, smallGem ? 6 : 12))
      });
      if (!original) continue;
      wearable.registerPhysicalOptics(mesh.material, original);
      originals.add(original);
      count += 1;
    } catch (error) {
      console.warn("[AR] gemstone uses physical raster fallback:", error);
    }
  }
  wearable.piece.traverse((mesh) => {
    for (const material of [mesh.material].flat()) originals.delete(material);
  });
  for (const material of originals) {
    wearable.releaseOpticalMaterial(material);
    material.dispose();
  }
  const report = { traced: count, fallback: candidates.length - count, budget, scope: "gem-internal rays; environment exits only" };
  wearable.pose.userData.arOptics = report;
  return report;
}
