import assert from 'node:assert/strict';

const origin = process.env.TJC_TEST_ORIGIN;
if (!origin || !process.env.TJC_TEST_CDP) throw Error('Run node scripts/check_journeys.mjs --screen-reader');
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
const check = (condition, label) => { assert.equal(condition, true, label); checks += 1; };
const navigate = async (path) => {
  await send('Page.navigate', { url: origin + path });
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await wait(100);
    if (await evaluate(`location.pathname === ${JSON.stringify(path)} && document.readyState === 'complete'`)) return;
  }
  throw Error(`Navigation timeout: ${path}`);
};

await send('Page.enable');
await send('Runtime.enable');
await send('Accessibility.enable');
await send('DOM.enable');
await send('Network.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });

const requiredRoles = new Set(['button', 'link', 'textbox', 'combobox', 'checkbox', 'radio', 'heading']);
const inspectPage = async (path) => {
  await navigate(path);
  const tree = await send('Accessibility.getFullAXTree');
  const nodes = tree.nodes || [];
  const unlabeled = nodes
    .filter((node) => !node.ignored && requiredRoles.has(node.role?.value) && !String(node.name?.value || '').trim())
    .map((node) => ({ role: node.role?.value, backendDOMNodeId: node.backendDOMNodeId }));
  const visibleUnlabeled = [];
  for (const node of unlabeled) {
    try {
      const box = await send('DOM.getBoxModel', { backendNodeId: node.backendDOMNodeId });
      if (box.model?.content?.some((value) => Number(value) !== 0)) visibleUnlabeled.push(node);
    } catch {}
  }
  const headings = nodes.filter((node) => !node.ignored && node.role?.value === 'heading');
  const landmarks = nodes.filter((node) => !node.ignored && ['banner', 'main', 'contentinfo', 'navigation', 'form'].includes(node.role?.value));
  check(visibleUnlabeled.length === 0, `${path} visible interactive and heading nodes have accessible names: ${JSON.stringify(visibleUnlabeled)}`);
  check(headings.some((node) => node.properties?.some((property) => property.name === 'level' && Number(property.value?.value) === 1)), `${path} exposes an h1 in the accessibility tree`);
  check(landmarks.length >= 3, `${path} exposes landmark regions`);
  return { path, unlabeled, headings: headings.length, landmarks: landmarks.length };
};

try {
  const inspected = [];
  for (const path of ['/index.html', '/shop.html', '/products/the-rise-ring/', '/customs.html']) inspected.push(await inspectPage(path));
  await navigate('/customs.html');
  const zoomAudit = await evaluate(`(() => { document.documentElement.style.fontSize = '200%'; const form = document.querySelector('[data-custom-form]'); const fields = [...form.querySelectorAll('input, select, textarea')].filter((field) => { const style = getComputedStyle(field); return !field.hidden && field.type !== 'hidden' && field.type !== 'file' && !field.closest('[hidden]') && style.display !== 'none' && style.visibility !== 'hidden'; }); return { overflow: document.documentElement.scrollWidth > innerWidth, formWidth: form.getBoundingClientRect().width, fields: fields.filter((field) => field.getBoundingClientRect().width <= 0 || field.getBoundingClientRect().height < 32).map((field) => field.name || field.id) }; })()`);
  check(zoomAudit.overflow === false, '200 percent text scaling has no horizontal overflow');
  check(zoomAudit.formWidth > 0 && zoomAudit.fields.length === 0, '200 percent text scaling keeps enquiry fields usable');
  await evaluate('document.documentElement.style.fontSize = ""');
  assert.deepEqual(errors, [], 'No runtime exceptions');
  checks += 1;
  console.log(JSON.stringify({ passed: checks, inspected, runtimeErrors: errors, browser: 'Disposable Chrome; accessibility tree; 390px; 200% text scaling', submissions: 'None' }));
} finally {
  socket.close();
}
