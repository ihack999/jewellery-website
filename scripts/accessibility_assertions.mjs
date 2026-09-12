import assert from 'node:assert/strict';

const origin = process.env.TJC_TEST_ORIGIN;
if (!origin || !process.env.TJC_TEST_CDP) throw Error('Run node scripts/check_journeys.mjs --accessibility');
const tabs = await (await fetch(`${process.env.TJC_TEST_CDP}/json/list`)).json();
const socket = new WebSocket(tabs.find((tab) => tab.type === 'page').webSocketDebuggerUrl);
await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
let sequence = 0;
const pending = new Map();
const errors = [];
let checks = 0;

socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const task = pending.get(message.id);
    if (!task) return;
    clearTimeout(task.timer);
    pending.delete(message.id);
    message.error ? task.reject(new Error(JSON.stringify(message.error))) : task.resolve(message.result);
  } else if (message.method === 'Runtime.exceptionThrown') {
    errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  } else if (message.method === 'Fetch.requestPaused') {
    const request = message.params.request;
    const allowed = request.url.startsWith(`${origin}/`) && ['GET', 'HEAD'].includes(request.method);
    send(allowed ? 'Fetch.continueRequest' : 'Fetch.failRequest', allowed
      ? { requestId: message.params.requestId }
      : { requestId: message.params.requestId, errorReason: 'BlockedByClient' }).catch(() => {});
  }
});

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)); }, 15000);
  timer.unref();
  pending.set(id, { resolve, reject, timer });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const check = async (expression, label) => {
  assert.equal(await evaluate(`Boolean(${expression})`), true, label);
  checks += 1;
};
const navigate = async (path) => {
  await send('Page.navigate', { url: origin + path });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await wait(100);
    if (await evaluate(`location.pathname === ${JSON.stringify(path)} && document.readyState === 'complete' && typeof setupCartIcon === 'function'`)) return;
  }
  throw Error(`Navigation timeout: ${path}`);
};
const key = async (keyName, modifiers = 0) => {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: keyName, code: keyName, windowsVirtualKeyCode: keyName === 'Tab' ? 9 : 27, modifiers });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: keyName, code: keyName, windowsVirtualKeyCode: keyName === 'Tab' ? 9 : 27, modifiers });
};

await send('Page.enable');
await send('Runtime.enable');
await send('Network.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });

try {
  await navigate('/shop.html');
  await evaluate('localStorage.clear(); location.reload()');
  await wait(500);
  await check('document.documentElement.scrollWidth <= innerWidth', 'Shop has no horizontal overflow at phone width');
  await check('[...document.querySelectorAll("button, a, input, select, textarea")].filter((element) => { const style = getComputedStyle(element); return !element.hidden && !element.disabled && !element.closest("[hidden], [inert]") && style.visibility !== "hidden" && style.display !== "none" && style.opacity !== "0"; }).every((element) => getComputedStyle(element).pointerEvents !== "none")', 'Visible enabled controls remain pointer accessible');
  await evaluate('document.querySelector("[data-menu-toggle]").focus(); document.querySelector("[data-menu-toggle]").click()');
  await check('document.body.classList.contains("nav-open") && document.querySelector("main").inert && document.activeElement.matches("[data-menu-toggle]")', 'Mobile menu opens with trigger focus and inert main');
  await key('Tab');
  await check('document.activeElement.closest(".site-header") && !document.activeElement.closest("main[inert]")', 'Mobile menu keeps keyboard focus in header');
  await key('Escape');
  await check('!document.body.classList.contains("nav-open") && document.activeElement.matches("[data-menu-toggle]")', 'Escape closes menu and restores focus');

  await evaluate('document.querySelector("[data-personal-edit-open]").focus(); document.querySelector("[data-personal-edit-open]").click()');
  await check('document.querySelector(".personal-edit-dialog").open && document.activeElement.matches(".personal-edit-dialog__close")', 'Finder opens with close control focused');
  await key('Escape');
  await check('!document.querySelector(".personal-edit-dialog").open && document.activeElement.matches("[data-personal-edit-open]")', 'Finder Escape restores trigger focus');

  await evaluate('document.querySelector("[data-card-add=rise-ring]").click(); document.querySelector(".cart-icon").click()');
  await wait(100);
  await check('document.querySelector("[data-cart-modal]").classList.contains("is-open") && document.querySelector(".page-shell").inert', 'Bag makes background inert');
  await check('document.activeElement.matches(".cart-modal__panel [data-cart-close]")', 'Bag focuses its close control');
  await key('Escape');
  await check('!document.querySelector("[data-cart-modal]").classList.contains("is-open") && document.activeElement.matches(".cart-icon")', 'Bag Escape restores trigger focus');

  await navigate('/customs.html');
  await check('[...document.querySelectorAll("[data-custom-form] input, [data-custom-form] select, [data-custom-form] textarea")].filter((field) => !field.hidden && field.type !== "hidden" && field.type !== "file").every((field) => field.labels?.length || field.getAttribute("aria-label") || field.getAttribute("aria-labelledby"))', 'Enquiry fields have accessible labels');
  await check('document.querySelector("[data-custom-form] [data-form-status]").getAttribute("role") === "status" && document.querySelector("[data-custom-form] [data-form-status]").getAttribute("aria-live") === "polite"', 'Enquiry status is announced');
  await check('document.documentElement.scrollWidth <= innerWidth', 'Enquiry has no horizontal overflow at phone width');

  await send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
  await wait(200);
  await check('visualViewport.scale === 2', 'Browser zoom is set to 200 percent');
  await check('document.querySelector("#request-form").getBoundingClientRect().width > 0 && document.querySelector("#email-address").getBoundingClientRect().height >= 40', 'Primary enquiry controls remain measurable at 200 percent zoom');
  await send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 });
  await send('Emulation.setEmulatedMedia', { features: [] });
  assert.deepEqual(errors, [], 'No runtime exceptions');
  checks += 1;
  console.log(JSON.stringify({ passed: checks, runtimeErrors: errors, browser: 'Disposable Chrome; 390px; reduced motion and 200% page scale', submissions: 'None' }));
} finally {
  socket.close();
}
