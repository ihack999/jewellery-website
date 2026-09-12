import { GENERATOR_VERSION } from "./design-session.js?v=20260911-construction-v32";

export async function exportPieceGlb(piece, specification, { renderJob = null } = {}) {
  const prongClearance = piece.userData.prongClearance || null;
  if (prongClearance?.remainingIntersections > 0) throw new Error("Resolve the reported prong–gem intersections before exporting this setting.");
  const { GLTFExporter } = await import("./GLTFExporter.js");
  const metresPerWorldUnit = 0.001 / specification.world.unitsPerMm;
  const converted = new Set();
  piece.traverse((object) => {
    if (object.userData.isContactAO || object.isSprite) object.visible = false;
    if (!object.isMesh) return;
    object.name ||= object.userData.isGem ? "Gemstone" : "Jewellery component";
    const convert = (material) => {
      if (converted.has(material)) return;
      converted.add(material);
      if (Number.isFinite(material.attenuationDistance)) material.attenuationDistance *= metresPerWorldUnit;
    };
    if (Array.isArray(object.material)) object.material.forEach(convert);
    else convert(object.material);
  });
  piece.name = `${specification.piece} — ${specification.revision}`;
  piece.scale.multiplyScalar(metresPerWorldUnit);
  piece.userData = {
    schema: "tjc.preview-asset.v3", generatorVersion: GENERATOR_VERSION,
    physicalSpecification: specification, outputUnits: "metres",
    prongClearance,
    representation: "visual-preview", productionValidated: false,
    ...(renderJob ? { renderJob } : {}),
    limitations: ["Not a manufacturing solid", "Bump engraving requires EXT_materials_bump support; it is not carved geometry", "Appearance depends on viewer support for physical material extensions"]
  };
  piece.updateMatrixWorld(true);
  const exporter = new GLTFExporter();
  const data = await exporter.parseAsync(piece, { binary: true, onlyVisible: true, maxTextureSize: renderJob ? 2048 : 1024 });
  return new Blob([data], { type: "model/gltf-binary" });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
