# AR tracking timing and session ownership

Implemented 12 September 2026 as the first batch following the AR/neural research. This improves the shared tracking foundation for rings, bracelets, earrings, and necklaces. It does not add a new perception model or claim improved real-camera attachment accuracy.

## Resulting behavior

- Post-inference position, orientation, scale, and velocity filters use elapsed source-video media time. Uneven callback delivery no longer changes their input intervals. The media timeline is anchored once per camera/resume session.
- Main-thread sampling time, callback time, optional presentation/capture time, media time, source dimensions, and mirroring are retained separately. MediaPipe receives the monotonic main-thread sample timestamp; the application filters use the media timeline. Worker clock values are used only for local durations.
- Result age and bounded prediction use capture time only when the browser reports a valid value. Otherwise, they use presentation time or sampling time. The diagnostics identify the basis. These values are not a measurement of motion-to-photon latency.
- One pending image conversion or inference owns the worker slot. A session reset invalidates its result but retains ownership until completion, preventing another frame from queuing behind it. An unrelated response cannot release the current slot.
- Obsolete snapshot promises and old-session worker errors cannot switch a newer session to the main-thread fallback. Synchronous snapshot errors, failed transfers, and stale image conversions release their own resources.
- Busy callbacks do not consume the scheduling interval or source-frame identity. The next available callback can submit the current frame immediately when eligible.
- The animation-frame fallback reads render time after synchronous inference returns, so result age and interpolation include that blocking work.
- Results from changed video dimensions or mirroring are rejected. Frozen adjustments reset the filters and recompute placement without adding fabricated timing samples. Stale-display teardown runs once per expiry.
- Opt-in diagnostics show inference time, sample-to-result turnaround, a rolling p95 and sample count, the available frame-age basis, and busy/stale counters. The window is bounded to 120 samples and retains no images or landmarks.

The browser specification distinguishes media time, presentation time, callback time, and optional capture time. Frame callbacks and drawing are best-effort synchronized; this change does not guarantee that an asynchronous tracking result matches the camera image currently on the display. [Video frame callback specification](https://wicg.github.io/video-rvfc/)

## Files

- `assets/js/ar/frame-timing.js`: frame timing and bounded diagnostics.
- `assets/js/ar-tryon.js`: frame scheduling, filter clock selection, worker ownership, lifecycle, and diagnostic integration.
- `assets/js/ar-tracking-worker.js`: preserve frame identity in all frame errors, validate the supplied timestamp, and preserve a valid zero timestamp.
- `assets/js/main.js`, `customs.html`: updated AR entry cache references. Existing side-stone changes are preserved.
- `scripts/check_ar_tracking.mjs`: dependency-free synthetic timing and async-failure checks.
- `scripts/ar_tracking_assertions.mjs`, `scripts/check_journeys.mjs --ar-tracking`: isolated browser verification.

## Validation

`node scripts/check_ar_tracking.mjs` passed 21 scenario groups. A 180-frame replay produced matching filtered positions for equal source frames delivered with different callback delays. Other cases cover all four placement routes, optional timing metadata, stale/changed-frame rejection, freeze adjustment, busy scheduling, the render clock after blocking inference, obsolete errors, snapshot/transfer failures, close during pending work, bounded diagnostics, and the production worker handler. Camera and network calls: zero.

`node scripts/check_journeys.mjs --ar-tracking` passed 34 assertions in a disposable headless Chrome profile. It exercised native video frame callbacks, canvas-generated video, actual ImageBitmap transfers, and the production worker with a local synthetic vision module. Each of the four categories processed at least eight frames. The browser reported presentation timing, and the test preserved source intervals through asynchronous processing. Camera/microphone permissions were denied and hardware capture APIs were blocked. Camera calls and uncaught runtime errors: zero.

The model outputs and placement methods in these tests are controlled fixtures. They validate protocol, scheduling, filter timing, and dispatch; they do not validate MediaPipe inference quality, anatomical fitting, the jewellery render, real phone performance, or perceived smoothness. No participant footage, real camera, microphone, model download, deployment, or external submission was used.

The established browser journey suite also passed all 41 assertions with no runtime errors. Static validation passed for 33 pages, 1,369 local references, and 28 JSON-LD blocks. Changed JavaScript syntax and whitespace checks passed.

## Next research-informed increment

With timing and recovery failures now reproducible, the next bounded perception experiment should compare additional local wearer observations against the existing landmark/proxy baseline. Finger contours and hair/ear visibility are candidates. Adoption should depend on better local attachment/occlusion under the full rendering workload, not isolated model FPS. Real-camera and mobile qualification remain separate work requiring fresh camera authorization.
