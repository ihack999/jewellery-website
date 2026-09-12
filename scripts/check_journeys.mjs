// Node 22+; launches a disposable Chrome profile and a loopback-only static server.
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { gzipSync } from 'node:zlib';
const performanceMode = process.argv.includes('--performance');
const accessibilityMode = process.argv.includes('--accessibility');
const screenReaderMode = process.argv.includes('--screen-reader');
import { readFile, stat, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const staticCheck = spawnSync('python3', [resolve(root, 'scripts/check_static.py')], { stdio: 'inherit' });
if (staticCheck.status !== 0) process.exit(1);
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const server = createServer(async (req, res) => {
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
  try {
    let path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (!path.startsWith(root.endsWith(sep) ? root : root + sep)) throw Error('Outside root');
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    let data = await readFile(path);
    const compressed = performanceMode && ['.html','.js','.css','.json','.svg'].includes(extname(path)) && /gzip/.test(req.headers['accept-encoding'] || '');
    if (compressed) data = gzipSync(data);
    res.writeHead(200, {'Content-Type':mime[extname(path)] || 'application/octet-stream','Cache-Control':'no-store', ...(compressed ? {'Content-Encoding':'gzip', 'Vary':'Accept-Encoding'} : {})});
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const profile = await mkdtemp(resolve(tmpdir(), 'tjc-regression-'));
let chrome;
try {
  const executable = process.env.CHROME_BIN || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'google-chrome');
  chrome = spawn(executable, ['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-background-networking','about:blank'], {stdio:'ignore'});
  let launchError;
  chrome.on('error', error => { launchError = error; });
  let port;
  for (let i = 0; i < 100; i++) {
    if (launchError) throw launchError;
    try { port = Number((await readFile(resolve(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]); break; } catch {}
    await new Promise(resolve => setTimeout(resolve,100));
  }
  if (!port) throw Error('Chrome did not start; set CHROME_BIN to a supported Chrome executable.');
  process.env.TJC_TEST_ORIGIN = `http://127.0.0.1:${server.address().port}`;
  process.env.TJC_TEST_CDP = `http://127.0.0.1:${port}`;
  await import(performanceMode ? './measure_performance.mjs' : accessibilityMode ? './accessibility_assertions.mjs' : screenReaderMode ? './screen_reader_assertions.mjs' : './journey_assertions.mjs');
} finally {
  if (chrome?.pid && chrome.exitCode === null) {
    const stopped = new Promise(resolve => chrome.once('exit', resolve));
    chrome.kill();
    await stopped;
  }
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
  await rm(profile, {recursive:true,force:true,maxRetries:5,retryDelay:100});
}
