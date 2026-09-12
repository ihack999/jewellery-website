export function handLandmarkValidity(point) {
  return point && [point.x, point.y, point.z].every(Number.isFinite) ? 1 : 0;
}

export function estimateHandRoll(world, handedness, mirrored, directionX, directionY, pitch, previous = 0) {
  if (![0, 5, 9, 17].every((index) => handLandmarkValidity(world?.[index]))) return previous;
  if (handedness !== "Left" && handedness !== "Right") return previous;
  const acrossX = world[17].x - world[5].x;
  const acrossY = world[17].y - world[5].y;
  const acrossZ = world[17].z - world[5].z;
  const alongX = world[9].x - world[0].x;
  const alongY = world[9].y - world[0].y;
  const alongZ = world[9].z - world[0].z;
  const sign = handedness === "Left" ? -1 : 1;
  const normalX = (acrossY * alongZ - acrossZ * alongY) * sign * (mirrored ? -1 : 1);
  const normalY = -(acrossZ * alongX - acrossX * alongZ) * sign;
  const normalZ = -(acrossX * alongY - acrossY * alongX) * sign;
  const side = -directionY * normalX + directionX * normalY;
  const facing = -Math.sin(pitch) * (directionX * normalX + directionY * normalY) + Math.cos(pitch) * normalZ;
  if (Math.hypot(side, facing) < 1e-7) return previous;
  const angle = Math.atan2(side, facing);
  return previous + Math.atan2(Math.sin(angle - previous), Math.cos(angle - previous));
}

export class TrackingFrameGate {
  generation = 0;
  lastFrame = 0;
  lastTimestamp = -Infinity;

  reset() {
    this.generation += 1;
    this.lastFrame = 0;
    this.lastTimestamp = -Infinity;
  }

  accept(message, now) {
    if (message.generation !== this.generation || !Number.isFinite(message.timestamp)
      || !Number.isSafeInteger(message.frameId) || message.frameId <= 0
      || message.frameId <= this.lastFrame || message.timestamp <= this.lastTimestamp
      || now - message.timestamp > 450 || message.timestamp > now + 10) return false;
    this.lastFrame = message.frameId;
    this.lastTimestamp = message.timestamp;
    return true;
  }
}

export class HandIdentity {
  previous = null;
  preference = "Auto";

  reset() {
    this.previous = null;
  }

  choose(result, now, required = [0, 5, 9, 13, 14, 17]) {
    const candidates = [];
    (result?.landmarks || []).forEach((landmarks, index) => {
      const world = result.worldLandmarks?.[index];
      if (!required.every((point) => [landmarks?.[point], world?.[point]].every((value) => value
        && [value.x, value.y, value.z].every(Number.isFinite)))) return;
      const handedness = (result.handedness || result.handednesses)?.[index]?.[0]?.categoryName || "Unknown";
      if (this.preference !== "Auto" && handedness !== this.preference) return;
      const wrist = landmarks[0];
      const previous = this.previous;
      const recent = previous && now - previous.time < 1200;
      const distance = recent ? Math.hypot(wrist.x - previous.x, wrist.y - previous.y) : 0;
      if (recent && ((handedness !== "Unknown" && previous.handedness !== "Unknown" && handedness !== previous.handedness) || distance > 0.30)) return;
      const width = Math.hypot(landmarks[5].x - landmarks[17].x, landmarks[5].y - landmarks[17].y);
      const score = recent ? -distance : width - Math.hypot(wrist.x - 0.5, wrist.y - 0.5) * 0.1;
      candidates.push({ landmarks, world, index, handedness, score });
    });
    candidates.sort((first, second) => second.score - first.score);
    const selected = candidates[0];
    if (selected) this.previous = { ...selected.landmarks[0], handedness: selected.handedness, time: now };
    return selected || null;
  }
}
