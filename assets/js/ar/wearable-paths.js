const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

export function createBraceletWearPath(THREE, lengthMm, wristWidthMm = 55) {
  const radius = clamp(wristWidthMm, 30, 90) / 2 + 0.8;
  const depth = (radius - 0.8) * 0.72 + 0.8;
  const makeCurve = (slack) => {
    const curve = new THREE.Curve();
    curve.getPoint = (fraction, target = new THREE.Vector3()) => {
      const angle = -Math.PI / 2 + fraction * Math.PI * 2;
      const sine = Math.sin(angle);
      return target.set(radius * Math.cos(angle), depth * sine - slack * Math.max(0, -sine) ** 2, 0);
    };
    curve.arcLengthDivisions = 1024;
    return curve;
  };
  let lower = 0;
  let upper = lengthMm;
  const fits = makeCurve(0).getLength() <= lengthMm;
  for (let iteration = 0; iteration < 22; iteration += 1) {
    const middle = (lower + upper) / 2;
    if (makeCurve(middle).getLength() < lengthMm) lower = middle;
    else upper = middle;
  }
  const curve = makeCurve((lower + upper) / 2);
  const actual = curve.getLength();
  const scale = fits ? 1 : lengthMm / actual;
  return {
    length: lengthMm, fits, wristWidthMm, radiusMm: radius * scale, depthMm: depth * scale,
    point: (distance) => curve.getPointAt(clamp(distance / lengthMm, 0, 1)).multiplyScalar(scale),
    tangent: (distance) => curve.getTangentAt(clamp(distance / lengthMm, 0, 1)).normalize()
  };
}

export function createNecklaceWearPath(THREE, lengthMm, open = false, circumferenceMm = 320) {
  const radius = circumferenceMm / (Math.PI * 1.76);
  const depth = radius * 0.76;
  const makeCurve = (drop) => {
    const curve = new THREE.Curve();
    const gapAngle = Math.asin(3 / (radius + 2));
    curve.getPoint = (fraction, target = new THREE.Vector3()) => {
      const angle = open ? (Math.PI - gapAngle) * (1 - 2 * fraction) : fraction * Math.PI * 2;
      const cosine = Math.cos(angle);
      const frontWeight = Math.max(0, -cosine) ** 2;
      return target.set(
        -(radius + 2) * Math.sin(angle),
        14 * Math.max(0, cosine) ** 2 - drop * frontWeight,
        -depth - (depth + 2) * cosine + drop * 0.15 * frontWeight
      );
    };
    curve.arcLengthDivisions = 2048;
    return curve;
  };
  let lower = 0;
  let upper = Math.max(100, lengthMm);
  const minimum = makeCurve(0).getLength();
  const fits = lengthMm >= minimum;
  for (let iteration = 0; iteration < 24; iteration += 1) {
    const middle = (lower + upper) / 2;
    if (makeCurve(middle).getLength() < lengthMm) lower = middle;
    else upper = middle;
  }
  const curve = makeCurve((lower + upper) / 2);
  const actual = curve.getLength();
  const scale = fits ? 1 : lengthMm / actual;
  return {
    length: actual * scale,
    fits,
    neckRadiusMm: radius,
    neckDepthMm: depth,
    point: (distance) => curve.getPointAt(clamp(distance / (actual * scale), 0, 1)).multiplyScalar(scale),
    tangent: (distance) => curve.getTangentAt(clamp(distance / (actual * scale), 0, 1)).normalize()
  };
}
