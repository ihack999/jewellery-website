# Ticket 05a: responsive homepage hero

Measured 2026-09-12 using disposable headless Chrome, a loopback static server, disabled cache, and a 3-second unscrolled observation window at 390×900 and 1440×900. External page requests were blocked, including Google Fonts. These are local encoded resource body sizes, not production Core Web Vitals or a font-loading audit. The local server does not compress CSS/JS.

## Largest initial resource

The original hero JPEG was the largest resource in both baseline runs: 391,561 bytes, 930×1600 pixels. Initial shared CSS was 209,799 bytes; main.js was 196,236 bytes. Neither designer.js nor AR modules appeared in the initial requests.

Added 480px and 780px-wide JPEG derivatives using macOS `sips --resampleWidth WIDTH -s formatOptions 85`, retaining the original source and its public URL. Both the image and its preload now have matching responsive candidates and sizes: 100vw through 700px, otherwise 53vw. The original's width descriptor is 930w, matching its actual width despite the filename's 1600 suffix.

| Viewport / density | Hero before | Hero after | Reduction |
|---|---:|---:|---:|
| 390px / 1× | 391,561 B | 143,375 B | 63.4% |
| 1440px / 1× | 391,561 B | 335,023 B | 14.4% |
| 390px / 2× | 391,561 B | 335,023 B | 14.4% |
| 390px / 3× | 391,561 B | 391,561 B | 0%; original retained |

Observed local resource body totals (excluding document HTML):

| Viewport | Before bytes | After bytes | Reduction |
|---|---:|---:|---:|
| 390px, 1× | 980,039 | 731,853 | 25.3% |
| 1440px, 1× | 1,457,368 | 1,400,830 | 3.9% |

## Validation and limitations

- Before/after screenshots reviewed at phone and desktop widths: same crop, composition, readable controls, and no obvious visual loss at the tested display sizes. Derivatives are resized/re-encoded; they are not pixel-identical originals.
- Resource records show one hero request per navigation: matching preload avoids fetching both candidates. The 2× phone selects 780px; 3× retains the 930px original.
- No horizontal overflow or unloaded visible images in the measured views.
- Combined static/browser regression command passed: 33 pages, 1,367 local references, 28 JSON-LD blocks, 41 browser assertions, zero runtime exceptions.
- No deployment, payment, form submission, or camera use.

Next bounded performance task: measure production-like compression, font loading, and render timing before deciding whether shared CSS or initial JavaScript should be reduced. This subtask improves transferred bytes; it does not establish real-user LCP or INP gains.

## Ticket 05b: compression, fonts, and render baseline

Run `node scripts/check_journeys.mjs --performance` with the same prerequisites as the regression suite (Node 22+, Python 3, Chrome; `CHROME_BIN` may override its path). This mode serves local text assets with gzip, permits read-only Google Fonts requests, and writes `docs/performance-lab.json`. All other external page requests and submissions are blocked. It uses a disposable profile and does not alter product code.

Method: three 4-second observations each at 390×900 and 1440×900, DPR 1, browser cache disabled, no CPU or network throttling. Samples share a browser process and may benefit from warm network connections and system caches. Treat these as a reproducible local baseline, not cold-network production scores. The reported CLS is the observed sum of non-interaction layout shifts within the short window, not a full-session field metric.

| Asset | Raw bytes | Gzip bytes | Brotli bytes (offline estimate) |
|---|---:|---:|---:|
| `assets/css/styles.css` | 209,799 | 36,493 | 28,383 |
| `assets/css/atelier.css` | 36,943 | 6,785 | 5,862 |
| `assets/css/curation.css` | 31,283 | 6,371 | 5,434 |
| `assets/js/main.js` | 196,236 | 45,600 | 37,295 |
| `assets/js/curation.js` | 7,809 | 2,563 | 2,117 |

The five assets total 482,070 raw bytes and 97,812 gzip bytes (79.7% smaller). Browser response headers confirmed gzip in this local run; production hosting compression remains unverified. Brotli sizes are offline compression estimates, not observed server behavior.

| Viewport | Median observed LCP | Observed LCP range | Maximum observed layout-shift sum |
|---|---:|---:|---:|
| 390px | 104 ms | 80–264 ms | 0.0000 |
| 1440px | 76 ms | 72–104 ms | 0.0023 |

All six observations reached document completion with no failed requests or horizontal overflow. Eight declared font faces reported loaded; the browser requested three WOFF2 files (Manrope and upright/italic Cormorant Garamond), all HTTP 200. The first font stylesheet request took approximately 165 ms and transferred 1,022 encoded body bytes. WOFF2 body sizes were not captured in the resource-timing report; do not treat the stylesheet size as total font cost.

Decision: retain the current font loading and shared code for now. The earlier hero optimization remains the measured change; this follow-up establishes the compressed baseline without speculative product refactoring. Initial designer/AR loading remains deferred. Validate real hosting headers, slow-network behavior, and field performance during release qualification. Next local ticket: accessibility QA (06).
