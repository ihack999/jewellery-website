import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const origin = process.env.TJC_TEST_ORIGIN;
if (!origin || !process.env.TJC_TEST_CDP) throw Error("Run node scripts/check_journeys.mjs --side-settings");
const tabs = await (await fetch(`${process.env.TJC_TEST_CDP}/json/list`)).json();
const socket = new WebSocket(tabs.find((tab) => tab.type === "page").webSocketDebuggerUrl);
await new Promise((resolve) => socket.addEventListener("open", resolve, { once: true }));
let sequence = 0;
let checks = 0;
const pending = new Map();
const errors = [];
socket.addEventListener("message", ({ data }) => {
  const message = JSON.parse(data);
  if (message.id) {
    const task = pending.get(message.id);
    if (!task) return;
    pending.delete(message.id);
    clearTimeout(task.timer);
    if (message.error) task.reject(Error(JSON.stringify(message.error)));
    else task.resolve(message.result);
  } else if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.exception?.description);
  else if (message.method === "Fetch.requestPaused") {
    const { requestId, request } = message.params;
    const allowed = request.url.startsWith(origin + "/") && ["GET", "HEAD"].includes(request.method);
    send(allowed ? "Fetch.continueRequest" : "Fetch.failRequest", allowed ? { requestId } : { requestId, errorReason: "BlockedByClient" }).catch(() => {});
  }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++sequence;
  const timer = setTimeout(() => { pending.delete(id); reject(Error("Timed out: " + method)); }, 30000);
  pending.set(id, { resolve, reject, timer });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const response = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails) throw Error(response.exceptionDetails.exception?.description);
  return response.result.value;
};
const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
const check = async (expression, label) => { assert.equal(await evaluate(`Boolean(${expression})`), true, label); checks++; };
const ready = async () => {
  for (let attempt = 0; attempt < 120; attempt++) {
    await wait(100);
    if (await evaluate('document.querySelector("[data-design-studio]")?.dataset.designerReady === "true"')) return;
  }
  throw Error("Studio initialization timed out");
};
const setField = async (name, value) => {
  await evaluate(`(() => { const field=document.querySelector('[data-designer-field="${name}"]'); if(field.type==='checkbox')field.checked=${JSON.stringify(value)}===true||${JSON.stringify(value)}==='true';else field.value=${JSON.stringify(value)}; field.dispatchEvent(new Event('change',{bubbles:true})); })()`);
  await wait(450);
};
const screenshot = async (name) => {
  if (!process.env.TJC_SCREENSHOT_DIR) return;
  const capture = await send("Page.captureScreenshot", { format: "png" });
  await writeFile(join(process.env.TJC_SCREENSHOT_DIR, `side-settings-${name}.png`), Buffer.from(capture.data, "base64"));
};
try {
  await send("Page.enable"); await send("Runtime.enable");
  await send("Fetch.enable", { patterns: [{ urlPattern: "*" }] });
  for (const name of ["camera", "microphone"]) await send("Browser.setPermission", { permission: { name }, setting: "denied", origin });
  await send("Page.addScriptToEvaluateOnNewDocument", { source: `window.__cameraRequests=0;if(navigator.mediaDevices)Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async()=>{window.__cameraRequests++;throw Error('Camera prohibited');},configurable:false});` });
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: origin + "/customs.html#design-studio" });
  await ready();
  await check('window.__tjcDesigner.getState().accentSetting === "Bezel"', "New rings default to bezel accents");
  await setField("halo", "false");
  for (const setting of ["Bezel", "Channel", "Prong"]) {
    await setField("accentSetting", setting);
    await check(`window.__tjcDesigner.getState().accentSetting === ${JSON.stringify(setting)}`, setting + " updates actual studio state");
    const hardware = await evaluate(`(() => {
      const piece=window.__tjcDesigner.buildPiece(window.__tjcDesigner.getState());
      const result={prongs:0,setting:null,gems:0};
      piece.traverse(object=>{if(object.name==='shoulder-settings'){result.setting=object.userData.construction.accentSetting;object.traverse(child=>{if(child.userData.isProng)result.prongs++;if(child.userData.isGem)result.gems++;});}});
      const geometries=new Set();piece.traverse(object=>{if(object.geometry)geometries.add(object.geometry);});geometries.forEach(geometry=>geometry.dispose());
      return result;
    })()`);
    assert.equal(hardware.setting, setting);
    assert.ok(hardware.gems > 0);
    assert.equal(hardware.prongs > 0, setting === "Prong"); checks++;
    await evaluate('document.querySelector("[data-designer-stage]").scrollIntoView({block:"center"})');
    await screenshot(setting.toLowerCase());
  }
  await setField("accentSetting", "Channel");
  await evaluate('document.querySelector("[data-undo-design]").click()'); await wait(450);
  await check('window.__tjcDesigner.getState().accentSetting === "Prong"', "Undo restores previous setting");
  await evaluate('document.querySelector("[data-redo-design]").click()'); await wait(450);
  await check('window.__tjcDesigner.getState().accentSetting === "Channel"', "Redo restores channel");
  await evaluate('document.querySelector("[data-save-design]").click()');
  await send("Page.reload"); await ready();
  await check('window.__tjcDesigner.getState().accentSetting === "Channel"', "Saved setting survives reload");
  await check('window.__tjcDesigner.getState().setting === "Prong"', "Centre setting is independent");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await evaluate(`(() => {const field=document.querySelector('[data-designer-field="accentSetting"]');let parent=field.parentElement;while(parent){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}field.scrollIntoView({block:'center',behavior:'instant'});field.focus({preventScroll:true});})()`);
  await wait(300);
  await check('document.documentElement.scrollWidth <= innerWidth', "No mobile page overflow");
  await check('document.activeElement.id === "designer-accent-setting" && document.activeElement.getBoundingClientRect().width <= innerWidth', "Mobile setting selector is reachable");
  await check('document.activeElement.getBoundingClientRect().top >= 74 && document.activeElement.getBoundingClientRect().bottom <= innerHeight', "Mobile selector is visible below header");
  await screenshot("mobile");
  await check('window.__cameraRequests === 0 && !performance.getEntriesByType("resource").some(entry=>entry.name.includes("ar-tryon.js"))', "No camera or AR use");
  await send("Page.navigate", { url: origin + "/customs.html?piece=Ring&band=Solitaire#design-studio" }); await ready();
  await check('window.__tjcDesigner.getState().accentSetting === "Auto"', "Old design URLs retain legacy settings");
  assert.deepEqual(errors, []);
  console.log(`PASS: ${checks} side-setting browser checks; desktop/mobile, save/reload, undo/redo, actual geometry, independent centre setting; no runtime exceptions.`);
} finally { socket.close(); }
