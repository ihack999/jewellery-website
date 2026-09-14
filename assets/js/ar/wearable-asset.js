import * as THREE from "../three.module.js";
import { createBraceletFitter } from "./bracelet-fit.js?v=20260911-ar-live3";
import { createRenderBatches } from "./render-batches.js?v=20260912-ar-render";
import { WORLD_UNITS_PER_MM, buildJewellerySpec } from "../jewellery-spec.js?v=20260911-construction-v32";

export function createWearableAsset(piece, state) {
  if (!piece?.isObject3D) throw new Error("The selected jewellery model could not be built.");
  const spec = buildJewellerySpec(state);
  const pose = new THREE.Group();
  pose.name = "ar-tracking-pose";
  const physical = new THREE.Group();
  physical.name = "ar-physical-metres";
  physical.scale.setScalar(0.001 / WORLD_UNITS_PER_MM);
  if (spec.piece === "Ring") piece.rotation.set(0, 0, 0);
  physical.add(piece);
  pose.add(physical);
  pose.userData = {
    jewellerySpec: spec,
    unitsPerMm: 0.001,
    wearable: {
      version: 1, units: "m", piece: spec.piece, silhouette: state.silhouette,
      designRevision: JSON.stringify(state), approximateBodyFit: true,
      neck: piece.userData.wearableNeck || null
    }
  };
  const earNodes = piece.children.filter((child) => child.userData.wearableEar);
  const fitBracelet = createBraceletFitter(piece);
  const bounds = new THREE.Box3().setFromObject(pose);
  for (const ear of earNodes) {
    if (!ear.children.some((child) => child.userData.wearableFixed)) continue;
    const lobe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true }));
    lobe.name = "piercing-lobe-depth-proxy";
    lobe.scale.set(0.0045, 0.006, 0.004).divideScalar(physical.scale.x);
    lobe.position.set(0, 0.001, -0.004).divideScalar(physical.scale.x);
    lobe.renderOrder = -100;
    ear.add(lobe);
  }
  const opticalDistances = new Map();
  const physicalOptics = new Set();
  piece.traverse((node) => {
    for (const material of [node.material].flat().filter(Boolean)) {
      if (!opticalDistances.has(material) && Number.isFinite(material.attenuationDistance) && material.attenuationDistance > 0) {
        opticalDistances.set(material, material.attenuationDistance * physical.scale.x);
      }
    }
  });
  const updateOpticalScale = () => {
    for (const [material, distance] of opticalDistances) material.attenuationDistance = distance * (physicalOptics.has(material) ? 1 : pose.scale.x);
  };
  updateOpticalScale();
  const bracelet = spec.bracelet;
  const flexible = state.silhouette === "Tennis" || state.silhouette === "Station";
  const innerRadius = spec.piece === "Ring" ? spec.ring.innerRadiusMm * 0.001
    : flexible ? Math.max(0.005, ((piece.userData.wearableBracelet?.majorRadiusMm || bracelet.lengthMm / 5.67) - 1) * 0.001)
    : bracelet.innerDiameterMm * 0.0005;
  const outerRadius = spec.piece === "Ring" ? (spec.ring.innerRadiusMm + spec.ring.shankThicknessMm) * 0.001
    : Math.max(0.005, bounds.getSize(new THREE.Vector3()).x / 2);
  const renderBatches = createRenderBatches(piece);
  return {
    pose, piece, spec, innerRadius, outerRadius, earNodes, updateOpticalScale, fitBracelet, renderBatches,
    registerPhysicalOptics(material, original) {
      opticalDistances.set(material, opticalDistances.get(original) ?? Infinity);
      physicalOptics.add(material);
      updateOpticalScale();
    },
    releaseOpticalMaterial(material) {
      opticalDistances.delete(material);
      physicalOptics.delete(material);
    },
    setEarAnchor(side, position) {
      const node = earNodes.find((ear) => ear.userData.wearableEar === side);
      if (node) node.position.copy(position).divideScalar(physical.scale.x);
    },
    setEarVisible(side, visible) {
      const node = earNodes.find((ear) => ear.userData.wearableEar === side);
      if (node) node.visible = visible;
    }
  };
}
