export class OneEuro {
  constructor(minCutoff = 1, beta = 0.02, dCutoff = 1, jump = Infinity, speed = 0) {
    Object.assign(this, { minCutoff, beta, dCutoff, jump, speed });
    this.reset();
  }

  alpha(cutoff, delta) {
    const response = 2 * Math.PI * cutoff * delta;
    return response / (response + 1);
  }

  filter(value, timestamp) {
    if (!Number.isFinite(value) || !Number.isFinite(timestamp)) return this.xPrev ?? 0;
    if (this.tPrev !== null && timestamp <= this.tPrev) return this.xPrev;
    if (this.xPrev === null || timestamp - this.tPrev > 450) {
      this.xPrev = this.rawPrev = value;
      this.tPrev = timestamp;
      this.dxPrev = 0;
      this.pending = null;
      return value;
    }
    const delta = Math.max(0.001, (timestamp - this.tPrev) / 1000);
    const limit = this.jump + this.speed * delta;
    if (Math.abs(value - this.rawPrev) > limit
      && (this.pending === null || Math.abs(value - this.pending) > limit * 0.5)) {
      this.pending = value;
      return this.xPrev;
    }
    this.pending = null;
    const derivative = (value - this.rawPrev) / delta;
    const derivativeAlpha = this.alpha(this.dCutoff, delta);
    this.dxPrev += derivativeAlpha * (derivative - this.dxPrev);
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dxPrev);
    this.xPrev += this.alpha(cutoff, delta) * (value - this.xPrev);
    this.rawPrev = value;
    this.tPrev = timestamp;
    return this.xPrev;
  }

  reset() {
    this.xPrev = this.rawPrev = this.tPrev = this.pending = null;
    this.dxPrev = 0;
  }
}

export function predictionSeconds(ageMs, confidence, frozen = false) {
  if (frozen || !Number.isFinite(ageMs) || ageMs < 0) return 0;
  const freshness = Math.max(0, Math.min(1, (150 - ageMs) / 75));
  return Math.min(0.025, ageMs / 1000) * Math.max(0, Math.min(1, confidence)) * freshness;
}
