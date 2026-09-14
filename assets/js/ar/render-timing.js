// Bounded local measurements. CPU submission includes scene preparation and
// driver calls; it is not GPU elapsed time or camera-to-display latency.
export class RenderTiming {
  constructor() { this.reset(); }
  reset() { this.samples = []; this.previousStart = null; this.last = null; this.cached = "render warming up"; this.readAt = -Infinity; }
  pause() { this.previousStart = null; }
  record(start, end, info, pixelRatio) {
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return;
    const interval = this.previousStart === null ? null : start - this.previousStart;
    this.previousStart = start;
    // Pause is explicit: a genuinely slow active frame must remain observable.
    this.last = { cpuMs: end - start, intervalMs: interval > 0 ? interval : null,
      calls: info.calls, triangles: info.triangles, pixelRatio };
    this.samples.push(this.last);
    if (this.samples.length > 120) this.samples.shift();
  }
  describe(now) {
    if (!this.last) return this.cached;
    if (now - this.readAt < 500) return this.cached;
    this.readAt = now;
    const p95 = (key) => {
      const values = this.samples.map((sample) => sample[key]).filter(Number.isFinite).sort((a, b) => a - b);
      return values.length ? values[Math.ceil(values.length * .95) - 1].toFixed(1) : "—";
    };
    this.cached = `${this.last.calls} draws · ${Math.round(this.last.triangles / 1000)}k triangles · CPU render p95 ${p95("cpuMs")}ms · render interval p95 ${p95("intervalMs")}ms · DPR ${this.last.pixelRatio}`;
    return this.cached;
  }
}
