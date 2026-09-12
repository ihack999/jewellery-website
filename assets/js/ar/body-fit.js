const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

export function palmScale(landmarks, world, metrics, measuredWidthMm = 0) {
  const valid = (point) => point && [point.x, point.y, point.z].every(Number.isFinite);
  if (![5, 17].every((index) => valid(world?.[index]))) return null;
  const estimatedWidth = Math.hypot(world[5].x - world[17].x, world[5].y - world[17].y, world[5].z - world[17].z);
  if (estimatedWidth < 0.025 || estimatedWidth > 0.16) return null;
  const widthM = measuredWidthMm > 0 ? measuredWidthMm / 1000 : estimatedWidth;
  const referenceScale = widthM / estimatedWidth;
  const samples = [];
  for (const [first, second] of [[0, 5], [0, 9], [0, 17], [5, 17], [5, 9], [9, 17]]) {
    if (![landmarks?.[first], landmarks?.[second], world?.[first], world?.[second]].every(valid)) continue;
    const projected = Math.hypot(world[first].x - world[second].x, world[first].y - world[second].y) * referenceScale;
    const length = Math.hypot(world[first].x - world[second].x, world[first].y - world[second].y, world[first].z - world[second].z) * referenceScale;
    const pixels = Math.hypot((landmarks[first].x - landmarks[second].x) * metrics.drawWidth, (landmarks[first].y - landmarks[second].y) * metrics.drawHeight);
    if (projected < 0.012 || projected < length * 0.3 || pixels < 8) continue;
    samples.push({ scale: pixels / projected, weight: projected * projected });
  }
  if (!samples.length) return null;
  samples.sort((first, second) => first.scale - second.scale);
  const total = samples.reduce((sum, sample) => sum + sample.weight, 0);
  let accumulated = 0;
  for (const sample of samples) {
    accumulated += sample.weight;
    if (accumulated >= total / 2) return { pixelsPerMeter: sample.scale, widthM };
  }
  return null;
}

export function weightedCenter(points, fallback) {
  let horizontal = 0;
  let vertical = 0;
  let weight = 0;
  for (const point of points) {
    if (![point.x, point.y, point.weight].every(Number.isFinite) || point.weight <= 0) continue;
    horizontal += point.x * point.weight;
    vertical += point.y * point.weight;
    weight += point.weight;
  }
  return weight > 1e-3 ? { x: horizontal / weight, y: vertical / weight, weight } : { ...fallback, weight: 0 };
}

export function shoulderProjection(left, right, mirrored, stageDirection) {
  if (!left || !right) return { ratio: 1, yaw: 0 };
  const horizontal = left.x - right.x;
  const vertical = left.y - right.y;
  const depth = left.z - right.z;
  const span = Math.hypot(horizontal, vertical, depth);
  if (!Number.isFinite(span) || span < 0.16 || span > 0.62) return { ratio: 1, yaw: 0 };
  const projected = Math.hypot(horizontal, vertical);
  const direction = Math.sign(stageDirection) || (mirrored ? -1 : 1);
  return {
    ratio: clamp(projected / span, 0.45, 1),
    yaw: clamp(Math.atan2(-depth * direction, projected), -1.1, 1.1)
  };
}
