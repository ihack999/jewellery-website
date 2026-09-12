import { auditMeshCollection } from "./mesh-audit.js?v=20260911-construction-v32";

self.onmessage = ({ data }) => {
  try {
    self.postMessage({ report: auditMeshCollection(data.meshes, data.revision) });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : "Mesh audit failed." });
  }
};
