const radians = (degrees) => degrees * Math.PI / 180;
const degrees = (angle) => angle * 180 / Math.PI;
const supplied = (value) => value !== "" && value !== null && value !== undefined && Number.isFinite(Number(value));

export function solveGemstoneCut(stone, controls = {}) {
  const width = stone.widthMm;
  const halfWidth = width * 0.5;
  const girdleThicknessMm = width * stone.girdlePct / 100;
  const crownRun = halfWidth * (1 - stone.tablePct / 100);
  const pavilionRun = halfWidth * (1 - stone.culetPct / 100);
  const minimumHeight = width * 0.005;
  const angleCrownHeight = Math.max(minimumHeight, crownRun * Math.tan(radians(stone.crownAngleDeg)));
  const anglePavilionHeight = Math.max(minimumHeight, pavilionRun * Math.tan(radians(stone.pavilionAngleDeg)));
  const depthLocked = supplied(controls.stoneDepthMm) || supplied(controls.totalDepthPct);
  const crownLocked = supplied(controls.crownAngleDeg);
  const pavilionLocked = supplied(controls.pavilionAngleDeg);
  const issues = [];
  if ((crownLocked && stone.crownAngleDeg <= 0) || (pavilionLocked && stone.pavilionAngleDeg <= 0)) {
    issues.push({ severity: "error", code: "CUT_ZERO_ANGLE", field: crownLocked && stone.crownAngleDeg <= 0 ? "crownAngleDeg" : "pavilionAngleDeg",
      message: "A zero facet angle creates a degenerate cut. Enter a positive angle or clear it to use the cut default." });
  }
  let crownHeightMm = angleCrownHeight;
  let pavilionHeightMm = anglePavilionHeight;
  let depthMm = stone.depthMm;
  let source = depthLocked ? "measured-depth" : "estimated-dimensions";

  if (!depthLocked && (crownLocked || pavilionLocked)) {
    depthMm = girdleThicknessMm + crownHeightMm + pavilionHeightMm;
    source = "specified-angles";
  } else {
    const available = Math.max(minimumHeight * 2, depthMm - girdleThicknessMm);
    if (crownLocked && !pavilionLocked) {
      pavilionHeightMm = available - crownHeightMm;
    } else if (pavilionLocked && !crownLocked) {
      crownHeightMm = available - pavilionHeightMm;
    } else if (crownLocked && pavilionLocked) {
      if (Math.abs(available - crownHeightMm - pavilionHeightMm) > 0.01) {
        issues.push({ severity: "error", code: "CUT_CONFLICT", field: "stoneDepthMm", recommendedValue: girdleThicknessMm + crownHeightMm + pavilionHeightMm,
          message: "Stone depth and both facet angles conflict. Clear one angle or use the depth calculated from the angles." });
      }
      pavilionHeightMm = available - crownHeightMm;
    } else {
      const ratio = available / (crownHeightMm + pavilionHeightMm);
      crownHeightMm *= ratio;
      pavilionHeightMm *= ratio;
    }
  }

  if (crownHeightMm < minimumHeight || pavilionHeightMm < minimumHeight || depthMm <= girdleThicknessMm + minimumHeight * 2) {
    issues.push({ severity: "error", code: "CUT_DEPTH", field: "stoneDepthMm", recommendedValue: girdleThicknessMm + angleCrownHeight + anglePavilionHeight,
      message: "The requested depth leaves too little room for the crown and pavilion. Increase depth or release the angle constraint." });
    const available = Math.max(minimumHeight * 2, depthMm - girdleThicknessMm);
    crownHeightMm = available * angleCrownHeight / (angleCrownHeight + anglePavilionHeight);
    pavilionHeightMm = available - crownHeightMm;
    depthMm = crownHeightMm + pavilionHeightMm + girdleThicknessMm;
  }

  if (supplied(controls.stoneDepthMm) && supplied(controls.totalDepthPct)
      && Math.abs(Number(controls.stoneDepthMm) - width * Number(controls.totalDepthPct) / 100) > 0.01) {
    issues.push({ severity: "error", code: "CUT_DEPTH_PERCENT", field: "totalDepthPct", recommendedValue: depthMm / width * 100,
      message: "Measured depth and depth percentage disagree. Measured millimetres determine the preview." });
  }

  return {
    version: 2, source, depthMm, girdleThicknessMm, crownHeightMm, pavilionHeightMm,
    crownAngleDeg: degrees(Math.atan2(crownHeightMm, crownRun)),
    pavilionAngleDeg: degrees(Math.atan2(pavilionHeightMm, pavilionRun)),
    totalDepthPct: depthMm / width * 100,
    requestedCrownAngleDeg: stone.crownAngleDeg, requestedPavilionAngleDeg: stone.pavilionAngleDeg,
    angleConvention: "nominal section across stone width", issues
  };
}
