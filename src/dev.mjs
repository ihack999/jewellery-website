#!/usr/bin/env node
// Local preview: builds the site, serves /dist on http://localhost:8000 and
// rebuilds whenever something in /store, /src or /assets changes.
//
//   npm run dev            (PORT=3000 npm run dev for another port)

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { ROOT } from "./lib/util.mjs";

const DIST = path.join(ROOT, "dist");
const PORT = Number(process.env.PORT) || 8000;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif", ".gif": "image/gif",
  ".mp4": "video/mp4", ".webm": "video/webm", ".woff2": "font/woff2", ".hdr": "application/octet-stream", ".glb": "model/gltf-binary", ".xml": "application/xml",
  ".txt": "text/plain", ".webmanifest": "application/manifest+json", ".wasm": "application/wasm", ".task": "application/octet-stream"
};

let redirects = [];
function loadRedirects() {
  try {
    redirects = fs.readFileSync(path.join(DIST, "_redirects"), "utf8").split("\n")
      .filter((l) => l.trim() && !l.startsWith("#"))
      .map((l) => l.trim().split(/\s+/))
      .map(([from, to, status]) => ({ from, to, status: Number(status) || 301 }));
  } catch { redirects = []; }
}

// Each build runs in a fresh Node process so edits to /src templates are picked up too.
let running = null;
let queued = false;
function rebuild() {
  if (running) { queued = true; return running; }
  running = new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(ROOT, "src", "build.mjs")], { stdio: "inherit", env: process.env });
    child.on("exit", () => {
      loadRedirects();
      running = null;
      resolve();
      if (queued) { queued = false; rebuild(); }
    });
  });
  return running;
}

function serveFile(res, file, status = 200) {
  const ext = path.extname(file).toLowerCase();
  const stat = fs.statSync(file);
  res.writeHead(status, { "Content-Type": TYPES[ext] || "application/octet-stream", "Content-Length": stat.size, "Cache-Control": "no-cache" });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (req.method === "POST") {
    // Netlify Forms / functions are only available when deployed. Pretend success locally.
    req.resume();
    req.on("end", () => {
      console.log(`  (dev) form/function POST ${url.pathname} — accepted locally, not sent.`);
      res.writeHead(url.pathname.includes("/.netlify/functions/") ? 409 : 200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, message: "Local preview — functions run on Netlify only." }));
    });
    return;
  }
  const hit = redirects.find((r) => r.from === url.pathname || (r.from.endsWith("*") && url.pathname.startsWith(r.from.slice(0, -1))));
  if (hit) { res.writeHead(hit.status, { Location: hit.to }); res.end(); return; }
  let pathname = decodeURIComponent(url.pathname);
  let file = path.join(DIST, pathname);
  if (!file.startsWith(DIST)) { res.writeHead(403); res.end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file) && !path.extname(file)) file = path.join(DIST, pathname, "index.html");
  if (fs.existsSync(file)) return serveFile(res, file);
  const notFound = path.join(DIST, "404.html");
  if (fs.existsSync(notFound)) return serveFile(res, notFound, 404);
  res.writeHead(404); res.end("Not found");
});

const serveOnly = process.argv.includes("--serve-only") && fs.existsSync(path.join(DIST, "index.html"));
if (serveOnly) loadRedirects(); else await rebuild();
server.listen(PORT, () => console.log(`  → Preview: http://localhost:${PORT}\n  Watching /store, /src and /assets for changes…\n`));

let timer;
const seen = new Map();
function snapshot(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) snapshot(file);
    else { const st = fs.statSync(file); seen.set(file, `${st.mtimeMs}:${st.size}`); }
  }
}
for (const dir of serveOnly ? [] : ["store", "src", "assets/css", "assets/js"]) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) continue;
  snapshot(full);
  try {
    fs.watch(full, { recursive: true }, (_event, name) => {
      if (name && /(^|\/)\./.test(name)) return;
      // Ignore metadata-only events (e.g. hard links being removed from dist/): only real edits count.
      if (name) {
        const file = path.join(full, name);
        let stamp = "gone";
        try { const st = fs.statSync(file); stamp = `${st.mtimeMs}:${st.size}`; } catch { /* deleted */ }
        if (seen.get(file) === stamp) return;
        seen.set(file, stamp);
      }
      clearTimeout(timer);
      timer = setTimeout(() => { console.log(`  ↻ ${dir}/${name || ""} changed — rebuilding…`); rebuild(); }, 250);
    });
  } catch {
    // Recursive watch is unsupported on some Linux setups; re-run `npm run dev` after edits.
  }
}
