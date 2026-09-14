// Media time measures motion between source images. performance.now() measures
// work/age on the main thread. Neither callback time nor media time is an
// observed sensor capture time. Keep these clocks separate across inference.
export const MAX_TRACKING_AGE_MS = 450;

const nonnegative = (value) => Number.isFinite(value) && value >= 0;
const observedTime = (value, now) => nonnegative(value) && value <= now ? value : null;

export class VideoFrameClock {
  constructor() { this.reset(); }

  reset() {
    this.lastMediaTime = -Infinity;
    this.mediaOffset = null;
  }

  next(video, sampledAt, metadata = {}, callbackAt = sampledAt) {
    const mediaTime = nonnegative(metadata.mediaTime) ? metadata.mediaTime : video.currentTime;
    if (!nonnegative(sampledAt) || !nonnegative(mediaTime) || mediaTime <= this.lastMediaTime) return null;
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!(width > 0 && height > 0)) return null;
    this.lastMediaTime = mediaTime;
    this.mediaOffset ??= sampledAt - mediaTime * 1000;
    const presentationTime = observedTime(metadata.presentationTime, sampledAt);
    const captureTime = observedTime(metadata.captureTime, presentationTime ?? sampledAt);
    return {
      sampledAt,
      callbackAt,
      mediaTime,
      // Anchored once per session, so callback/inference jitter cannot change
      // the intervals used by position, rotation, scale and velocity filters.
      filterTimestamp: this.mediaOffset + mediaTime * 1000,
      presentationTime,
      captureTime,
      sourceTime: captureTime ?? presentationTime ?? sampledAt,
      timeBasis: captureTime !== null ? "capture" : presentationTime !== null ? "presentation" : "sample",
      presentedFrames: Number.isSafeInteger(metadata.presentedFrames) ? metadata.presentedFrames : null,
      width,
      height
    };
  }
}

export function frameIsFresh(frame, now) {
  return frame && nonnegative(now) && nonnegative(frame.sampledAt) && nonnegative(frame.sourceTime)
    && frame.sourceTime <= frame.sampledAt && frame.sampledAt <= now
    && now - frame.sourceTime <= MAX_TRACKING_AGE_MS;
}

// Bounded, local-only diagnostics; no image, landmark or wearer data retained.
export class TrackingTiming {
  constructor() { this.reset(); }

  reset() {
    this.samples = [];
    this.last = null;
    this.skippedBusy = 0;
    this.droppedStale = 0;
  }

  record(frame, receivedAt, inferenceMs) {
    if (!frameIsFresh(frame, receivedAt) || !Number.isFinite(inferenceMs) || inferenceMs < 0) return;
    const turnaroundMs = receivedAt - frame.sampledAt;
    this.last = { frame, receivedAt, inferenceMs, turnaroundMs };
    this.samples.push(turnaroundMs);
    if (this.samples.length > 120) this.samples.shift();
  }

  describe(now, frozen = false) {
    if (!this.last) return "Waiting for tracking timing";
    const { frame, inferenceMs, turnaroundMs } = this.last;
    const sorted = [...this.samples].sort((a, b) => a - b);
    const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1];
    const age = Math.max(0, now - frame.sourceTime);
    return `${frozen ? "frozen frame" : `${Math.round(age)} ms ${frame.timeBasis} age`} · ${Math.round(inferenceMs)} ms inference · ${Math.round(turnaroundMs)} ms turnaround (p95 ${Math.round(p95)}, n=${sorted.length}) · ${this.skippedBusy} busy skips / ${this.droppedStale} stale drops`;
  }
}
