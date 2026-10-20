// Boots the 3D Design Studio (assets/js/designer.js) on /design-studio/ and
// wires the custom-request form. The studio is always open on this page.

const STUDIO_HASH = "#design-studio";
const arrivalHash = location.hash;
const status = document.querySelector("[data-designer-preview-message]");

// designer.js only opens itself when the URL hash is #design-studio.
if (arrivalHash !== STUDIO_HASH) {
  const url = new URL(location.href);
  url.hash = STUDIO_HASH.slice(1);
  history.replaceState(null, "", url);
}

import("/assets/js/designer.js?v=20260930-site") // keep in sync with the import inside ar-tryon.js
  .then(() => {
    if (arrivalHash && arrivalHash !== STUDIO_HASH) {
      const url = new URL(location.href);
      url.hash = arrivalHash.slice(1);
      history.replaceState(null, "", url);
      document.querySelector(arrivalHash)?.scrollIntoView();
    }
  })
  .catch(() => {
    if (status) status.textContent = "The 3D studio could not load on this device. You can still send us a request below.";
    window.tjToast?.("The 3D studio could not load. Please refresh, or send a request below.");
  });

// AR try-on is heavy: load it on first use, then replay the click.
let arLoading = null;
document.addEventListener("click", async (event) => {
  const trigger = event.target instanceof Element ? event.target.closest("[data-ar-tryon]") : null;
  if (!trigger || window.__arModuleReady) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  try {
    arLoading ||= import("/assets/js/ar-tryon.js?v=20260930-site");
    await arLoading;
    window.__arModuleReady = true;
    trigger.click();
  } catch {
    window.tjToast?.("Try-on isn't available on this device.");
  }
}, true);

// ------------------------------------------------------------------ AR try-on
// Metal/stone picked inside the try-on is mirrored onto the studio controls,
// so closing the camera leaves the studio showing what was tried on.
function syncDesigner(change) {
  if (change.metal) {
    const radio = [...document.querySelectorAll('[data-designer-field="metal"]')].find((input) => input.value === change.metal);
    if (radio && !radio.checked) radio.click();
  }
  if (change.stone) {
    const select = document.querySelector('#designer-stone, [data-designer-field="stone"]');
    if (select && select.value !== change.stone && [...select.options].some((o) => o.value === change.stone)) {
      select.value = change.stone;
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
}

const params = new URLSearchParams(location.search);
const launch = params.get("tryon") === "1";
const productSlug = params.get("product");
const launchEl = document.querySelector("[data-tryon-launch]");

function endLaunch(message) {
  document.documentElement.classList.remove("is-tryon-launch");
  const url = new URL(location.href);
  url.searchParams.delete("tryon");
  history.replaceState(null, "", url);
  if (message) window.tjToast?.(message);
}

window.__arContext = { title: "Your design", subtitle: "Live 3D try-on", onVariant: syncDesigner };

if (launch) {
  (async () => {
    let product = null;
    if (productSlug) {
      const list = await fetch(window.STORE?.catalog || "/products.json").then((r) => r.json()).catch(() => []);
      product = list.find((p) => p.slug === productSlug) || null;
    }
    if (product) {
      const title = launchEl?.querySelector("[data-tryon-launch-title]");
      if (title) title.textContent = product.name;
      window.__arContext = {
        title: product.name,
        shortTitle: product.name,
        subtitle: "3D preview · approximate scale",
        brand: window.STORE?.brand,
        metals: product.tryonMetals?.length ? product.tryonMetals : null,
        stones: null, // a finished piece: the stone is part of the design
        returnUrl: product.url,
        shareText: `Trying on ${product.name} — ${new URL(product.url, location.origin).href}`,
        onVariant: syncDesigner,
        // Closing the camera takes the shopper back to the product they came from.
        onClose: () => { location.href = product.url; }
      };
    } else {
      window.__arContext.onClose = () => endLaunch();
    }
    // Wait for the studio to finish building the piece, then open the try-on.
    const started = performance.now();
    while (!window.__tjcDesigner?.buildPiece && performance.now() - started < 20000) await new Promise((r) => setTimeout(r, 120));
    const trigger = document.querySelector("[data-ar-tryon]");
    if (!window.__tjcDesigner?.buildPiece || !trigger) return endLaunch("Try-on couldn't start here — you can still explore the piece in 3D.");
    trigger.click();
    // The try-on overlay covers the page; drop the launch cover once it's up.
    const until = performance.now() + 20000;
    while (!document.querySelector(".ar-tryon-modal") && performance.now() < until) await new Promise((r) => setTimeout(r, 100));
    if (!document.querySelector(".ar-tryon-modal")) return endLaunch("Try-on isn't available on this device.");
    endLaunch();
  })();
}

// Shared with the request-only page when the editor is temporarily hidden.
import "./request-form.js";
