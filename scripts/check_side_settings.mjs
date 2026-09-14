import assert from "node:assert/strict";
import * as THREE from "../assets/js/three.module.js";
import { buildJewellerySpec } from "../assets/js/jewellery-spec.js";
import { createJewelleryAssemblies, resolveAccentSetting } from "../assets/js/jewellery-assemblies.js";
import { auditMesh } from "../assets/js/mesh-audit.js";
import { createDesignDocument, readDesignDocument, createDesignVariation } from "../assets/js/design-session.js";

const metal = new THREE.MeshStandardMaterial();
const crystal = new THREE.MeshPhysicalMaterial({ transmission: 1 });
const base = { piece: "Ring", band: "Solitaire", shape: "Round", stone: "Blue Sapphire", size: "1.2", accent: true, halo: false, accentDensity: "Auto", accentStone: "Clear Diamond", setting: "Prong" };
let configurations = 0;
let meshes = 0;
for (const band of ["Solitaire", "Pavé", "Channel", "Three-Stone", "Tapered Baguette", "Eternity"]) {
  assert.equal(resolveAccentSetting({ band }), band === "Channel" ? "Channel" : "Prong");
  for (const accentSetting of ["Prong", "Bezel", "Channel"]) {
    for (const bandWidthMm of ["2.2", "3.8"]) {
      for (const accentStone of ["Clear Diamond", "Match Center"]) {
        const state = { ...base, band, accentSetting, bandWidthMm, accentStone };
        const spec = buildJewellerySpec(state);
        const geometry = {
          bandOuterR: spec.world.ringInnerRadius + spec.world.shankThickness,
          bandWidth: spec.world.shankThickness, bandHeight: spec.world.shankWidth,
          gemHalfW: spec.world.stoneWidth / 2
        };
        const group = createJewelleryAssemblies(THREE, { spec, state, metal, stoneMaterial: () => crystal }).ringAccents(geometry);
        let prongs = 0;
        let gems = 0;
        const audited = new Set();
        group.traverse((object) => {
          if (object.userData.isProng) prongs++;
          if (object.userData.isGem) {
            gems++;
            assert.equal(object.userData.gemMaterial, accentStone === "Match Center" ? "Blue Sapphire" : "Clear Diamond");
          }
          if (!object.isMesh) return;
          meshes++;
          assert.ok(object.geometry.attributes.position.array.every(Number.isFinite));
          assert.ok(object.position.toArray().every(Number.isFinite));
          if (["enclosing-bezel-wall", "bezel-lip", "channel-shoulder-wall"].includes(object.name) && !audited.has(object.name)) {
            const report = auditMesh({ positions: object.geometry.attributes.position.array, indices: object.geometry.index?.array, name: object.name });
            assert.ok(report.closed && report.inconsistentEdges === 0 && report.invalidTriangles === 0, JSON.stringify({ band, accentSetting, report }));
            audited.add(object.name);
          }
        });
        assert.ok(gems > 0);
        assert.equal(prongs > 0, accentSetting === "Prong");
        assert.equal(group.userData.construction.accentSetting, accentSetting);
        assert.equal(gems, group.userData.construction.stoneCount);
        if (accentSetting === "Bezel") assert.ok(audited.has("enclosing-bezel-wall") && audited.has("bezel-lip"));
        if (accentSetting === "Channel") assert.ok(audited.has("channel-shoulder-wall"));
        const restored = readDesignDocument(JSON.stringify(createDesignDocument(state, spec)));
        assert.equal(restored.accentSetting, accentSetting);
        assert.equal(createDesignVariation(state, "Classic", ["structure"]).accentSetting, accentSetting);
        assert.equal(buildJewellerySpec(restored).ring.innerDiameterMm, spec.ring.innerDiameterMm);
        configurations++;
        group.traverse((object) => object.geometry?.dispose());
      }
    }
  }
}
assert.equal(resolveAccentSetting({ band: "Channel", accentSetting: "invalid" }), "Channel");
assert.equal(createDesignVariation(base).accentSetting, "Bezel");
metal.dispose();
crystal.dispose();
console.log(`PASS: ${configurations} side-setting configurations; ${meshes} finite meshes; no claws in bezel/channel; closed enclosing hardware; saved settings and structure locks preserved.`);
