const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
const valid = p => p && [p.x, p.y, p.z].every(Number.isFinite);

// Shoulder direction determines the necklace's image-plane frame. Face points
// can help estimate neck height; they must not rotate the chest when the head
// turns. Reliable hip/shoulder depth adds torso lean, with a frontal fallback.
export function torsoFrame(left, right, world, landmarks) {
  if (![left?.x, left?.y, right?.x, right?.y].every(Number.isFinite)) return null;
  const dx = left.x - right.x, dy = left.y - right.y, span = Math.hypot(dx, dy);
  if (span < 1) return null;
  const sign = dx < 0 ? -1 : 1;
  const across = { x: dx / span * sign, y: dy / span * sign };
  let lean = 0, leanObserved = false;
  const indices = [11, 12, 23, 24];
  if (indices.every(i => valid(world?.[i]) && valid(landmarks?.[i])
    && Number(landmarks[i].visibility ?? landmarks[i].presence ?? 0) >= .65
    && landmarks[i].x > .01 && landmarks[i].x < .99 && landmarks[i].y > .01 && landmarks[i].y < .99)) {
    const x = (world[11].x + world[12].x - world[23].x - world[24].x) / 2;
    const y = (world[11].y + world[12].y - world[23].y - world[24].y) / 2;
    const z = (world[11].z + world[12].z - world[23].z - world[24].z) / 2;
    const length = Math.hypot(x, y, z), projected = Math.hypot(x, y);
    if (length >= .20 && length <= .75 && projected / length > .45) {
      lean = clamp(Math.atan2(-z, projected), -.65, .65);
      leanObserved = true;
    }
  }
  return { right: across, up: { x: -across.y, y: across.x }, lean, leanObserved };
}

// A wearer-supplied neck-base offset is expressed in the torso's local mm,
// so moving closer to the camera does not change the chosen attachment point.
export function neckPlacementOffset(point, reference) {
  if (!reference || ![point?.x, point?.y, reference.x, reference.y, reference.pixelsPerMeter,
    reference.right?.x, reference.right?.y, reference.up?.x, reference.up?.y].every(Number.isFinite)
    || reference.pixelsPerMeter <= 0) return null;
  const dx = point.x - reference.x, dy = point.y - reference.y;
  const determinant = reference.right.x * reference.up.y - reference.right.y * reference.up.x;
  if (Math.abs(determinant) < .25) return null;
  const x = (dx * reference.up.y - dy * reference.up.x) / determinant / reference.pixelsPerMeter * 1000;
  const y = (dy * reference.right.x - dx * reference.right.y) / determinant / reference.pixelsPerMeter * 1000;
  return Math.abs(x) <= 100 && Math.abs(y) <= 120 ? { x, y } : null;
}
