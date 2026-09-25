// Premium try-on interface: onboarding, live metal/stone switching,
// before/after compare, photo capture + share, photo (no-camera) mode and
// framing guides. The tracking/rendering core lives in ../ar-tryon.js; this
// module owns presentation only and talks to the core through a few hooks.

const ICON = {
  close: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  flip: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l1.6-2.4h6.8L17 8h3v11H4z"/><path d="M9.2 13.2a3 3 0 0 1 5.3-1.6M14.8 14.2a3 3 0 0 1-5.3 1.6"/><path d="m14.8 10.2-.3 1.5-1.5-.3M9.2 17.2l.3-1.5 1.5.3"/></svg>',
  compare: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M12 3v18"/></svg>',
  adjust: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>',
  photo: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="14" rx="1.5"/><circle cx="9" cy="10" r="1.6"/><path d="m4 17 5-4.5 3.5 3 2.5-2 5 4"/></svg>',
  camera: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l1.6-2.4h6.8L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.4"/></svg>',
  share: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M8 8l4-4 4 4"/><path d="M5 12v7h14v-7"/></svg>',
  save: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M8 11l4 4 4-4"/><path d="M5 19h14"/></svg>',
  lock: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="5" y="10.5" width="14" height="9.5" rx="1.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>'
};

// Line illustrations used for onboarding and the "find your hand" guide.
const GUIDES = {
  Ring: '<svg viewBox="0 0 200 220" aria-hidden="true"><path d="M70 210V120c0-8-14-30-20-44-6-13 6-22 15-10l15 22V38c0-10 16-10 16 0v58-70c0-10 16-10 16 0v70-62c0-10 16-10 16 0v66-50c0-10 15-10 15 0v96c0 22-12 34-18 44v26"/><ellipse class="arx-guide__gem" cx="120" cy="104" rx="10" ry="5"/></svg>',
  Bracelet: '<svg viewBox="0 0 200 220" aria-hidden="true"><path d="M78 214V150c-6-10-22-34-26-46-4-12 8-18 15-8l12 18V40c0-10 15-10 15 0v54-66c0-10 15-10 15 0v66-58c0-10 15-10 15 0v60-44c0-10 14-10 14 0v84c0 20-8 30-14 40v38"/><path class="arx-guide__gem" d="M76 176c20 10 44 10 64 0"/></svg>',
  Earrings: '<svg viewBox="0 0 200 220" aria-hidden="true"><path d="M60 96c0-44 18-72 40-72s40 28 40 72-18 78-40 78-40-34-40-78z"/><path d="M60 100c-8-2-12 6-10 16s8 14 12 12M140 100c8-2 12 6 10 16s-8 14-12 12"/><path d="M80 176l-6 40M120 176l6 40"/><circle class="arx-guide__gem" cx="56" cy="136" r="4"/><circle class="arx-guide__gem" cx="144" cy="136" r="4"/></svg>',
  Necklace: '<svg viewBox="0 0 200 220" aria-hidden="true"><path d="M70 70c0-30 14-50 30-50s30 20 30 50-14 44-30 44-30-14-30-44z"/><path d="M86 110v22c-30 4-58 16-66 40v44M114 110v22c30 4 58 16 66 40v44"/><path class="arx-guide__gem" d="M78 140c8 30 36 30 44 0"/><circle class="arx-guide__gem" cx="100" cy="164" r="4"/></svg>'
};

const TIPS = {
  Ring: ["Hold the back of your hand to the camera, fingers relaxed.", "Soft, even light makes stones sparkle."],
  Bracelet: ["Show your wrist and forearm — include your elbow if you can.", "Turn your wrist slowly to see every stone."],
  Earrings: ["Face the camera with your ears uncovered.", "Turn your head slowly side to side."],
  Necklace: ["Step back so your head and both shoulders are in view.", "Lower necklines show the chain best."]
};

export function injectExperienceStyles() {
  if (document.getElementById("ar-tryon-styles")) return;
  const style = document.createElement("style");
  style.id = "ar-tryon-styles";
  style.textContent = `
  .ar-tryon-modal {
    --arx-ink: #0d0d0d; --arx-glass: rgba(14,14,14,.58); --arx-line: rgba(255,255,255,.18);
    --arx-accent: var(--color-accent, #b8976a); --arx-font: var(--font-body, "Helvetica Neue", system-ui, sans-serif);
    --arx-display: var(--font-display, Georgia, "Times New Roman", serif);
    position: fixed; inset: 0; z-index: 9999; background: #050505; color: #fff;
    font-family: var(--arx-font); -webkit-font-smoothing: antialiased;
    animation: arx-in .28s cubic-bezier(.22,1,.36,1);
  }
  @keyframes arx-in { from { opacity: 0; transform: scale(1.01); } }
  .ar-tryon-modal [hidden] { display: none !important; }
  .ar-tryon-modal h2, .ar-tryon-modal strong { color: #fff; }
  .ar-tryon-modal.is-preparing .arx-dock, .ar-tryon-modal.is-preparing .ar-tryon-status, .ar-tryon-modal.is-preparing .ar-tryon-size,
  .ar-tryon-modal.is-preparing .ar-tryon-quality, .ar-tryon-modal.is-preparing .arx-guide, .ar-tryon-modal.is-preparing .arx-title { visibility: hidden; }
  .ar-tryon-modal button { font: inherit; color: inherit; cursor: pointer; }
  .ar-tryon-modal :focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
  .ar-tryon-stage { position: absolute; inset: 0; overflow: hidden; background: #050505; touch-action: none; }
  .ar-tryon-video, .ar-tryon-canvas { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .ar-tryon-video { transform: scaleX(-1); transition: filter .6s ease; }
  .ar-tryon-modal.is-world-camera .ar-tryon-video { transform: none; }
  .ar-tryon-modal.is-preparing .ar-tryon-video { filter: blur(18px) brightness(.55); }
  .ar-tryon-canvas { pointer-events: none; transition: opacity .18s linear; }
  .arx-vignette { position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(180deg, rgba(0,0,0,.55) 0, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 62%, rgba(0,0,0,.62) 100%); }

  /* top bar */
  .arx-top { position: absolute; z-index: 5; top: 0; left: 0; right: 0; display: grid; grid-template-columns: 48px 1fr 48px;
    align-items: center; gap: 8px; padding: calc(10px + env(safe-area-inset-top)) 12px 10px; }
  .arx-icon { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; border: 0;
    background: rgba(0,0,0,.28); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); transition: background .2s, opacity .2s; }
  .arx-icon:hover { background: rgba(255,255,255,.16); }
  .arx-icon:disabled { opacity: .35; cursor: default; }
  .arx-title { text-align: center; min-width: 0; display: grid; gap: 2px; text-shadow: 0 1px 12px rgba(0,0,0,.4); }
  .arx-title strong { font-family: var(--arx-display); font-weight: 400; font-size: 19px; letter-spacing: .01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .arx-title span { font-size: 10.5px; letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.72); }

  /* status + guide */
  .ar-tryon-status { position: absolute; z-index: 4; left: 50%; top: calc(76px + env(safe-area-inset-top)); transform: translateX(-50%);
    max-width: min(420px, calc(100vw - 32px)); padding: 10px 16px; border-radius: 999px; background: var(--arx-glass);
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); font-size: 13px; line-height: 1.35; text-align: center;
    pointer-events: none; animation: arx-pop .25s ease; }
  .ar-tryon-status.is-hidden { display: none; }
  @keyframes arx-pop { from { opacity: 0; transform: translate(-50%, -6px); } }
  .arx-guide { position: absolute; z-index: 2; inset: 0; display: grid; place-items: center; pointer-events: none; animation: arx-fade .5s ease; }
  @keyframes arx-fade { from { opacity: 0; } }
  .arx-guide svg { width: min(52vw, 260px); height: auto; fill: none; stroke: rgba(255,255,255,.72); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round;
    filter: drop-shadow(0 0 16px rgba(0,0,0,.4)); animation: arx-breathe 2.4s ease-in-out infinite; }
  .arx-guide__gem { stroke: var(--arx-accent) !important; stroke-width: 3 !important; }
  @keyframes arx-breathe { 50% { opacity: .55; transform: scale(.985); } }

  /* compare */
  .arx-compare { position: absolute; inset: 0; z-index: 3; cursor: ew-resize; }
  .arx-compare__line { position: absolute; top: 0; bottom: 0; left: var(--split, 50%); width: 2px; margin-left: -1px; background: #fff; box-shadow: 0 0 18px rgba(0,0,0,.45); }
  .arx-compare__knob { position: absolute; top: 50%; left: 50%; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%;
    background: #fff; color: #111; display: grid; place-items: center; box-shadow: 0 6px 24px rgba(0,0,0,.35); font-size: 15px; }
  .arx-compare__tag { position: absolute; top: calc(130px + env(safe-area-inset-top)); padding: 6px 10px; border-radius: 999px; background: var(--arx-glass);
    font-size: 10.5px; letter-spacing: .16em; text-transform: uppercase; }
  .arx-compare__tag--before { right: calc(100% + 12px); }
  .arx-compare__tag--after { left: 12px; }

  /* readouts */
  .ar-tryon-size, .ar-tryon-quality { position: absolute; z-index: 4; left: 12px; top: calc(72px + env(safe-area-inset-top)); pointer-events: none;
    padding: 8px 12px; border-radius: 14px; background: var(--arx-glass); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); display: grid; gap: 2px; }
  .ar-tryon-quality { left: auto; right: 12px; grid-template-columns: auto auto; align-items: center; column-gap: 8px; }
  .ar-tryon-size-label, .ar-tryon-quality span { font-size: 9.5px; letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.66); }
  .ar-tryon-size-value { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .ar-tryon-size-sub { font-size: 10.5px; color: rgba(255,255,255,.66); max-width: 190px; }
  .ar-tryon-quality b { font-size: 11px; font-weight: 600; }
  .ar-tryon-quality i { grid-column: 1 / -1; height: 2px; border-radius: 2px; background: rgba(255,255,255,.18); overflow: hidden; position: relative; }
  .ar-tryon-quality i::before { content: ""; position: absolute; inset: 0; width: var(--ar-lock, 0%); background: linear-gradient(90deg, var(--arx-accent), #fff); transition: width .2s; }

  /* bottom dock */
  .arx-dock { position: absolute; z-index: 5; left: 0; right: 0; bottom: 0; display: grid; justify-items: center; gap: 12px;
    padding: 12px 12px calc(16px + env(safe-area-inset-bottom)); }
  .ar-tryon-hint { font-size: 12.5px; color: rgba(255,255,255,.86); text-shadow: 0 1px 10px rgba(0,0,0,.6); text-align: center; }
  .ar-tryon-finger-select { display: flex; gap: 4px; padding: 4px; border-radius: 999px; background: var(--arx-glass); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
  .ar-tryon-finger-select button { border: 0; background: transparent; color: rgba(255,255,255,.75); padding: 7px 13px; border-radius: 999px; font-size: 12px; letter-spacing: .04em; }
  .ar-tryon-finger-select button.is-active { background: #fff; color: #111; }
  .arx-rails { display: grid; gap: 8px; width: min(560px, 100%); }
  .arx-rail { display: flex; gap: 8px; justify-content: center; overflow-x: auto; scrollbar-width: none; padding: 2px 4px; }
  .arx-rail::-webkit-scrollbar { display: none; }
  .arx-chip { flex: none; display: grid; justify-items: center; gap: 5px; min-width: 58px; padding: 0; border: 0; background: none; }
  .arx-chip__dot { width: 34px; height: 34px; border-radius: 50%; background: var(--swatch); box-shadow: inset 0 -6px 10px rgba(0,0,0,.18), inset 0 6px 10px rgba(255,255,255,.35), 0 0 0 1px rgba(255,255,255,.28);
    transition: transform .2s, box-shadow .2s; }
  .arx-chip--stone .arx-chip__dot { border-radius: 34% 34% 50% 50% / 30% 30% 70% 70%; background: radial-gradient(circle at 35% 30%, rgba(255,255,255,.95) 0 10%, transparent 11%), conic-gradient(from 20deg, var(--swatch), color-mix(in srgb, var(--swatch), #fff 45%), var(--swatch), color-mix(in srgb, var(--swatch), #000 25%), var(--swatch)); }
  .arx-chip span:last-child { font-size: 10px; letter-spacing: .06em; color: rgba(255,255,255,.72); white-space: nowrap; }
  .arx-chip[aria-checked="true"] .arx-chip__dot { transform: scale(1.08); box-shadow: 0 0 0 2px #0d0d0d, 0 0 0 3.5px #fff; }
  .arx-chip[aria-checked="true"] span:last-child { color: #fff; }
  .arx-actions { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 18px; width: min(420px, 100%); }
  .arx-pill { justify-self: start; display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 16px; border-radius: 999px;
    border: 1px solid var(--arx-line); background: var(--arx-glass); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); font-size: 12.5px; letter-spacing: .04em; }
  .arx-pill:last-child { justify-self: end; }
  .arx-pill[aria-pressed="true"], .arx-pill[aria-expanded="true"] { background: #fff; color: #111; border-color: #fff; }
  .arx-shutter { width: 74px; height: 74px; border-radius: 50%; border: 3px solid #fff; background: transparent; padding: 4px; transition: transform .15s; }
  .arx-shutter span { display: block; width: 100%; height: 100%; border-radius: 50%; background: #fff; transition: transform .15s, background .2s; }
  .arx-shutter:active span { transform: scale(.88); }
  .arx-shutter:disabled { opacity: .4; }
  .arx-flash { position: absolute; inset: 0; z-index: 8; background: #fff; pointer-events: none; animation: arx-flash .45s ease forwards; }
  @keyframes arx-flash { from { opacity: .85; } to { opacity: 0; } }
  .arx-busy .arx-rails { opacity: .6; pointer-events: none; }
  .arx-busy .ar-tryon-canvas { opacity: .6 !important; }

  /* placement sheet */
  .ar-tryon-calibration { position: absolute; z-index: 6; left: 50%; bottom: calc(172px + env(safe-area-inset-bottom)); transform: translateX(-50%);
    width: min(560px, calc(100vw - 20px)); max-height: 46vh; overflow-y: auto; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;
    padding: 16px; border-radius: 22px; background: rgba(12,12,12,.78); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--arx-line); box-shadow: 0 24px 60px rgba(0,0,0,.4); animation: arx-sheet .28s cubic-bezier(.22,1,.36,1); }
  @keyframes arx-sheet { from { opacity: 0; transform: translate(-50%, 12px); } }
  @media (min-width: 720px) { .ar-tryon-calibration { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
  .ar-tryon-calibration label { display: grid; gap: 6px; font-size: 10px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: rgba(255,255,255,.7); }
  .ar-tryon-calibration output { color: #fff; font-size: 11px; letter-spacing: 0; text-transform: none; font-variant-numeric: tabular-nums; }
  .ar-tryon-calibration input[type="range"] { width: 100%; accent-color: #fff; }
  .ar-tryon-calibration .ar-tryon-btn, .ar-wearable-options .ar-tryon-btn { min-height: 38px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--arx-line); background: rgba(255,255,255,.08); font-size: 12px; }
  .ar-tryon-reset { align-self: end; }
  .arx-freeze-row { grid-column: 1 / -1; display: flex; gap: 8px; flex-wrap: wrap; }
  .ar-wearable-options { grid-column: 1 / -1; font-size: 12px; border-top: 1px solid var(--arx-line); padding-top: 8px; }
  .ar-wearable-options summary { padding: 6px 0; cursor: pointer; color: rgba(255,255,255,.8); }
  .ar-wearable-options[open] { display: grid; gap: 12px; }
  .ar-wearable-options p { line-height: 1.5; margin: 0; color: rgba(255,255,255,.72); }
  .ar-wearable-options input, .ar-wearable-options select { min-height: 34px; max-width: 100%; border-radius: 10px; border: 1px solid var(--arx-line); background: rgba(255,255,255,.06); color: #fff; padding: 0 8px; }
  .ar-wearable-options select option { color: #111; }
  .ar-wearable-options input[type="checkbox"] { width: 18px; height: 18px; min-height: 18px; margin-right: 8px; }
  .ar-wearable-options label:has(input[type="checkbox"]) { display: flex; align-items: center; text-transform: none; letter-spacing: .02em; font-size: 12px; }
  .ar-wearable-options output[data-ar-debug] { font-size: 10.5px; line-height: 1.5; color: rgba(255,255,255,.7); word-break: break-word; }

  /* onboarding */
  .arx-onboard { position: absolute; inset: 0; z-index: 7; display: grid; align-items: end; justify-items: center; padding: 16px;
    background: radial-gradient(120% 80% at 50% 20%, rgba(40,36,30,.72), rgba(5,5,5,.97) 70%); }
  .arx-onboard__card { width: min(440px, 100%); display: grid; gap: 18px; justify-items: center; text-align: center;
    padding: 28px 22px calc(22px + env(safe-area-inset-bottom)); animation: arx-sheet2 .45s cubic-bezier(.22,1,.36,1); }
  @keyframes arx-sheet2 { from { opacity: 0; transform: translateY(18px); } }
  @media (min-height: 700px) { .arx-onboard { align-items: center; } }
  .arx-onboard__art svg { width: 150px; height: auto; fill: none; stroke: rgba(255,255,255,.85); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
  .arx-eyebrow { font-size: 10.5px; letter-spacing: .22em; text-transform: uppercase; color: var(--arx-accent); }
  .arx-onboard h2 { margin: 0; font-family: var(--arx-display); font-weight: 400; font-size: clamp(28px, 7vw, 38px); line-height: 1.05; }
  .arx-onboard ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; font-size: 13.5px; color: rgba(255,255,255,.8); }
  .arx-onboard li::before { content: "✦"; color: var(--arx-accent); margin-right: 8px; font-size: 10px; }
  .arx-btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; width: 100%; min-height: 52px; border-radius: 999px; border: 1px solid #fff;
    background: #fff; color: #111; font-size: 12.5px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; }
  .ar-tryon-modal .arx-btn { color: #111; }
  .arx-btn--ghost, .ar-tryon-modal .arx-btn--ghost { background: transparent; color: #fff; border-color: var(--arx-line); }
  .arx-btn:disabled { opacity: .5; }
  .arx-privacy { display: flex; align-items: center; gap: 8px; font-size: 11.5px; color: rgba(255,255,255,.62); }
  .arx-progress { width: 100%; height: 2px; border-radius: 2px; background: rgba(255,255,255,.14); overflow: hidden; }
  .arx-progress span { display: block; height: 100%; width: var(--p, 8%); background: linear-gradient(90deg, var(--arx-accent), #fff); transition: width .4s ease; }
  .arx-progress-label { font-size: 11px; color: rgba(255,255,255,.6); letter-spacing: .04em; }

  /* capture sheet */
  .arx-sheet { position: absolute; inset: 0; z-index: 9; display: grid; place-items: center; padding: 16px; background: rgba(5,5,5,.86);
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); animation: arx-fade .25s ease; }
  .arx-sheet__card { display: grid; gap: 14px; justify-items: center; width: min(520px, 100%); }
  .arx-sheet img { max-width: 100%; max-height: 64vh; border-radius: 18px; box-shadow: 0 30px 80px rgba(0,0,0,.6); }
  .arx-sheet__actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; width: 100%; }
  .arx-sheet__actions .arx-btn { min-height: 48px; }
  @media (max-width: 380px) { .arx-chip { min-width: 50px; } .arx-chip__dot { width: 30px; height: 30px; } }
  @media (prefers-reduced-motion: reduce) { .ar-tryon-modal, .arx-guide svg, .arx-onboard__card, .ar-tryon-calibration { animation: none !important; } }
  `;
  document.head.appendChild(style);
}

export function buildExperienceModal(context) {
  const modal = document.createElement("div");
  modal.className = "ar-tryon-modal is-preparing";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", `Virtual try-on: ${context.title}`);
  const piece = context.pieceType;
  const tips = TIPS[piece] || TIPS.Ring;
  modal.innerHTML = `
    <div class="ar-tryon-stage">
      <video class="ar-tryon-video" playsinline muted autoplay></video>
      <canvas class="ar-tryon-canvas"></canvas>
      <div class="arx-vignette"></div>
      <div class="arx-guide" data-arx-guide hidden>${GUIDES[piece] || GUIDES.Ring}</div>
      <div class="arx-compare" data-arx-compare hidden>
        <div class="arx-compare__line"><span class="arx-compare__tag arx-compare__tag--before">Before</span><span class="arx-compare__tag arx-compare__tag--after">With ${escapeHtml(context.shortTitle || "jewellery")}</span><span class="arx-compare__knob" aria-hidden="true">⇆</span></div>
      </div>
      <header class="arx-top">
        <button type="button" class="arx-icon" data-ar-close aria-label="Close try-on">${ICON.close}</button>
        <div class="arx-title"><strong data-arx-title>${escapeHtml(context.title)}</strong><span>${escapeHtml(context.subtitle || "Live 3D try-on")}</span></div>
        <button type="button" class="arx-icon" data-ar-flip aria-label="Switch camera" disabled>${ICON.flip}</button>
      </header>
      <div class="ar-tryon-status is-hidden" role="status" aria-live="polite" data-ar-status></div>
      <div class="ar-tryon-size" data-ar-size hidden>
        <span class="ar-tryon-size-label">Ring size</span>
        <span class="ar-tryon-size-value" data-ar-size-value>—</span>
        <span class="ar-tryon-size-sub" data-ar-size-sub></span>
      </div>
      <div class="ar-tryon-quality" data-ar-quality hidden>
        <span>Tracking</span><b data-ar-quality-value>—</b><i data-ar-quality-bar></i>
      </div>
      <div class="ar-tryon-calibration" id="ar-placement-panel" aria-label="Adjust placement" hidden>
        <div class="arx-freeze-row">
          <button type="button" class="ar-tryon-btn" data-ar-freeze disabled>Freeze / adjust</button>
          <button type="button" class="ar-tryon-btn ar-tryon-reset" data-ar-reset-fit>Reset</button>
        </div>
        <label>Preview scale <output data-ar-fit-value>100%</output><input type="range" min="78" max="126" step="1" value="100" data-ar-fit></label>
        <label>Lift <output data-ar-lift-value>0px</output><input type="range" min="-48" max="48" step="1" value="0" data-ar-lift></label>
        <label>Side <output data-ar-side-value>0px</output><input type="range" min="-48" max="48" step="1" value="0" data-ar-side></label>
        <label>Tilt <output data-ar-roll-value>0°</output><input type="range" min="-35" max="35" step="1" value="0" data-ar-roll></label>
        <label>Camera lens <output data-ar-fov-value>50°</output><input type="range" min="38" max="88" step="1" value="50" data-ar-fov></label>
        <label data-ar-ear-calibration hidden>Lobe <output data-ar-ear-drop-value>0px</output><input type="range" min="-40" max="40" step="1" value="0" data-ar-ear-drop></label>
        <label data-ar-ear-calibration hidden>Ear span <output data-ar-ear-span-value>100%</output><input type="range" min="82" max="118" step="1" value="100" data-ar-ear-span></label>
      </div>
      <div class="arx-dock">
        <p class="ar-tryon-hint">${escapeHtml(tips[0])}</p>
        <div class="ar-tryon-finger-select" role="group" aria-label="Choose finger">
          <button type="button" data-finger="index">Index</button>
          <button type="button" data-finger="middle">Middle</button>
          <button type="button" data-finger="ring" class="is-active">Ring</button>
          <button type="button" data-finger="pinky">Pinky</button>
        </div>
        <div class="arx-rails">
          <div class="arx-rail" data-arx-metals role="radiogroup" aria-label="Metal"></div>
          <div class="arx-rail" data-arx-stones role="radiogroup" aria-label="Stone"></div>
        </div>
        <div class="arx-actions">
          <button type="button" class="arx-pill" data-arx-compare-toggle aria-pressed="false">${ICON.compare}<span>Compare</span></button>
          <button type="button" class="arx-shutter" data-ar-snapshot aria-label="Take a photo" disabled><span></span></button>
          <button type="button" class="arx-pill" data-ar-adjust aria-expanded="false" aria-controls="ar-placement-panel">${ICON.adjust}<span>Adjust</span></button>
        </div>
      </div>
      <section class="arx-onboard" data-arx-onboard aria-labelledby="arx-onboard-title">
        <div class="arx-onboard__card">
          <div class="arx-onboard__art">${GUIDES[piece] || GUIDES.Ring}</div>
          <p class="arx-eyebrow">Virtual try-on</p>
          <h2 id="arx-onboard-title">${escapeHtml(context.title)}</h2>
          <ul>${tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>
          <div class="arx-progress" aria-hidden="true"><span data-arx-progress></span></div>
          <p class="arx-progress-label" data-arx-progress-label>Preparing your piece in 3D…</p>
          <button type="button" class="arx-btn" data-arx-start>${ICON.camera}<span>Start camera</span></button>
          <label class="arx-btn arx-btn--ghost">${ICON.photo}<span>Use a photo instead</span><input type="file" accept="image/*" data-arx-photo hidden></label>
          <p class="arx-privacy">${ICON.lock}<span>Private — the camera is processed on this device and never uploaded.</span></p>
        </div>
      </section>
      <section class="arx-sheet" data-arx-sheet hidden aria-label="Your try-on photo">
        <div class="arx-sheet__card">
          <img data-arx-shot alt="Your try-on photo">
          <div class="arx-sheet__actions">
            <button type="button" class="arx-btn" data-arx-share hidden>${ICON.share}<span>Share</span></button>
            <button type="button" class="arx-btn" data-arx-save>${ICON.save}<span>Save photo</span></button>
            <button type="button" class="arx-btn arx-btn--ghost" data-arx-retake>Back to try-on</button>
          </div>
        </div>
      </section>
    </div>`;
  return modal;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/** Wires the premium interface to a running ARTryOn instance. */
export function createExperience(app, context) {
  const modal = app.modal;
  const $ = (selector) => modal.querySelector(selector);
  const onboard = $("[data-arx-onboard]");
  const guide = $("[data-arx-guide]");
  const compare = $("[data-arx-compare]");
  const compareToggle = $("[data-arx-compare-toggle]");
  const sheet = $("[data-arx-sheet]");
  const progress = $("[data-arx-progress]");
  const progressLabel = $("[data-arx-progress-label]");
  let lastShot = null;
  let guideTimer = null;
  let split = 50;

  // -------------------------------------------------------- variant rails
  function renderRail(el, list, current, kind) {
    if (!el) return;
    if (!list || list.length < 2) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = list.map((item) => `<button type="button" role="radio" class="arx-chip arx-chip--${kind}" data-value="${escapeHtml(item.value)}" aria-checked="${item.value === current}" style="--swatch:${escapeHtml(item.swatch)}"><span class="arx-chip__dot"></span><span>${escapeHtml(item.label)}</span></button>`).join("");
  }
  renderRail($("[data-arx-metals]"), context.metals, context.current?.metal, "metal");
  renderRail($("[data-arx-stones]"), context.stones, context.current?.stone, "stone");
  for (const [selector, key] of [["[data-arx-metals]", "metal"], ["[data-arx-stones]", "stone"]]) {
    const rail = $(selector);
    rail?.addEventListener("click", async (event) => {
      const chip = event.target.closest(".arx-chip");
      if (!chip || chip.getAttribute("aria-checked") === "true" || modal.classList.contains("arx-busy")) return;
      rail.querySelectorAll(".arx-chip").forEach((c) => c.setAttribute("aria-checked", String(c === chip)));
      modal.classList.add("arx-busy");
      try {
        await app.applyDesignChange({ [key]: chip.dataset.value });
        context.onVariant?.({ [key]: chip.dataset.value });
      } finally {
        modal.classList.remove("arx-busy");
      }
    });
    rail?.addEventListener("keydown", (event) => {
      if (!["ArrowRight", "ArrowLeft"].includes(event.key)) return;
      const chips = [...rail.querySelectorAll(".arx-chip")];
      const index = chips.indexOf(document.activeElement);
      const next = chips[(index + (event.key === "ArrowRight" ? 1 : -1) + chips.length) % chips.length];
      next?.focus(); next?.click();
    });
  }

  // ------------------------------------------------------------- compare
  const applySplit = () => {
    compare.style.setProperty("--split", `${split}%`);
    // Left of the line = the camera alone ("before"), right = with jewellery.
    app.canvas.style.clipPath = compare.hidden ? "" : `inset(0 0 0 ${split}%)`;
  };
  compareToggle?.addEventListener("click", () => {
    compare.hidden = !compare.hidden;
    compareToggle.setAttribute("aria-pressed", String(!compare.hidden));
    split = 50;
    applySplit();
  });
  let dragging = false;
  const moveSplit = (event) => {
    const rect = compare.getBoundingClientRect();
    split = Math.max(4, Math.min(96, ((event.clientX - rect.left) / rect.width) * 100));
    applySplit();
  };
  compare.addEventListener("pointerdown", (event) => { dragging = true; compare.setPointerCapture(event.pointerId); moveSplit(event); });
  compare.addEventListener("pointermove", (event) => { if (dragging) moveSplit(event); });
  compare.addEventListener("pointerup", () => { dragging = false; });
  compare.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") { split = Math.max(4, split - 5); applySplit(); }
    if (event.key === "ArrowRight") { split = Math.min(96, split + 5); applySplit(); }
  });
  compare.tabIndex = 0;
  compare.setAttribute("role", "slider");
  compare.setAttribute("aria-label", "Before and after comparison");

  // --------------------------------------------------------------- capture
  const shutter = $("[data-ar-snapshot]");
  const share = $("[data-arx-share]");
  const save = $("[data-arx-save]");
  const fileName = () => `${(context.shortTitle || "try-on").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-try-on.jpg`;
  shutter.addEventListener("click", async () => {
    shutter.disabled = true;
    const flash = document.createElement("div");
    flash.className = "arx-flash";
    $(".ar-tryon-stage").append(flash);
    setTimeout(() => flash.remove(), 500);
    try {
      const blob = await app.capture({ watermark: context.brand });
      if (!blob) return;
      lastShot = blob;
      const img = $("[data-arx-shot]");
      if (img.dataset.url) URL.revokeObjectURL(img.dataset.url);
      img.dataset.url = URL.createObjectURL(blob);
      img.src = img.dataset.url;
      const file = new File([blob], fileName(), { type: blob.type });
      share.hidden = !(navigator.canShare && navigator.canShare({ files: [file] }));
      sheet.hidden = false;
      (share.hidden ? save : share).focus();
    } finally {
      shutter.disabled = false;
    }
  });
  save.addEventListener("click", () => {
    if (!lastShot) return;
    const a = document.createElement("a");
    a.href = $("[data-arx-shot]").dataset.url;
    a.download = fileName();
    document.body.append(a); a.click(); a.remove();
  });
  share.addEventListener("click", async () => {
    if (!lastShot) return;
    try {
      await navigator.share({ files: [new File([lastShot], fileName(), { type: lastShot.type })], title: context.title, text: context.shareText || `Trying on ${context.title}` });
    } catch { /* cancelled */ }
  });
  $("[data-arx-retake]").addEventListener("click", () => { sheet.hidden = true; shutter.focus(); });

  // ------------------------------------------------------------ onboarding
  function setProgress(fraction, label) {
    progress?.style.setProperty("--p", `${Math.round(Math.max(0.06, Math.min(1, fraction)) * 100)}%`);
    if (label && progressLabel) progressLabel.textContent = label;
  }
  function waitForStart() {
    return new Promise((resolve) => {
      $("[data-arx-start]").addEventListener("click", () => resolve({ mode: "camera" }), { once: true });
      $("[data-arx-photo]").addEventListener("change", (event) => {
        const file = event.target.files?.[0];
        if (file) resolve({ mode: "photo", file });
      });
      requestAnimationFrame(() => $("[data-arx-start]").focus());
    });
  }
  function dismissOnboarding() {
    onboard.hidden = true;
    modal.classList.remove("is-preparing");
  }

  // Shows the silhouette guide only after the target has been missing for a
  // moment, so brief dropouts don't flash it.
  function onTargetState(found) {
    clearTimeout(guideTimer);
    if (found) { guide.hidden = true; return; }
    guideTimer = setTimeout(() => { if (!onboard.hidden) return; guide.hidden = false; }, 900);
  }

  return {
    setProgress, waitForStart, dismissOnboarding, onTargetState,
    get compareActive() { return !compare.hidden; },
    dispose() {
      clearTimeout(guideTimer);
      const img = $("[data-arx-shot]");
      if (img?.dataset.url) URL.revokeObjectURL(img.dataset.url);
    }
  };
}

/** Turns a photo file into a MediaStream so the whole live pipeline works on it. */
export async function streamFromPhoto(file, aspect = 0) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  // The stage shows the stream with object-fit: cover. Letterbox the photo to
  // the stage's shape so the whole picture stays visible (nothing cropped off
  // the ears or fingers), on a plain dark fill that trackers ignore.
  const photoAspect = bitmap.width / bitmap.height;
  const frameAspect = aspect > 0 ? aspect : photoAspect;
  const long = 1600;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(frameAspect >= 1 ? long : long * frameAspect);
  canvas.height = Math.round(frameAspect >= 1 ? long / frameAspect : long);
  const fit = Math.min(canvas.width / bitmap.width, canvas.height / bitmap.height);
  const w = bitmap.width * fit, h = bitmap.height * fit;
  const x = (canvas.width - w) / 2, y = (canvas.height - h) / 2;
  const ctx = canvas.getContext("2d");
  const paint = () => {
    ctx.fillStyle = "#0b0b0b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, x, y, w, h);
  };
  paint();
  const stream = canvas.captureStream(15);
  // Canvas streams only emit frames when the canvas changes; keep repainting
  // (identical pixels) so tracking keeps receiving frames.
  const timer = setInterval(paint, 66);
  const [track] = stream.getVideoTracks();
  const stop = track.stop.bind(track);
  track.stop = () => { clearInterval(timer); bitmap.close?.(); stop(); };
  return stream;
}
