// Minimal CDP driver: node cap.mjs steps.json
// steps: [{goto,url}|{eval,js}|{wait,ms}|{shot,name}|{viewport,w,h,mobile}|{click,selector}|{clickText,text,tag?}|{type,selector,text}|{key,key}]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = process.env.OUT || path.resolve(process.cwd(), '../screenshots');
const PORT = 9333;
const profile = path.join(process.cwd(), 'profile');
const steps = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const USER = fs.readFileSync(path.join(process.cwd(), 'user.json'), 'utf8').trim();

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--window-size=1440,900', '--hide-scrollbars', '--no-first-run', '--disable-gpu', '--force-device-scale-factor=1',
  'about:blank'
], { stdio: 'ignore' });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function getWs() {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json`);
      const tabs = await r.json();
      const t = tabs.find(t => t.type === 'page');
      if (t) return t.webSocketDebuggerUrl;
    } catch {}
    await sleep(200);
  }
  throw new Error('chrome not ready');
}

const ws = new WebSocket(await getWs());
await new Promise(r => ws.onopen = r);
let id = 0; const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, (d) => d.error ? rej(new Error(method + ': ' + JSON.stringify(d.error))) : res(d.result)); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (js) => { const r = await send('Runtime.evaluate', { expression: js, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails))); return r.result.value; };

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

// Helpers injected in page
const HELPERS = `
window.__q = (sel) => document.querySelector(sel);
window.__scope = () => { const ds = document.querySelectorAll('[role=dialog]'); return ds.length ? ds[ds.length-1] : document; };
window.__byText = (text, tag='button') => Array.from(__scope().querySelectorAll(tag)).find(e => (e.textContent||'').replace(/\\s+/g,' ').trim().toLowerCase().includes(text.toLowerCase()));
window.__click = (el) => { if(!el) throw new Error('no element'); el.scrollIntoView({block:'center'}); el.click(); return true; };
window.__setInput = (el, v) => { const s = Object.getOwnPropertyDescriptor(el.__proto__, 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); return true; };
true`;

const log = (...a) => console.log('[cap]', ...a);
for (const s of steps) {
  const k = Object.keys(s)[0];
  try {
    if (k === 'goto') {
      await send('Page.navigate', { url: s.goto });
      await sleep(1500);
      await evaluate(`localStorage.setItem('berc_user', ${JSON.stringify(USER)}); localStorage.setItem('theme', ${JSON.stringify(s.theme || 'dark')}); true`);
      if (s.clearUser) await evaluate(`localStorage.removeItem('berc_user'); true`);
      await send('Page.reload'); await sleep(s.wait || 3500);
      await evaluate(HELPERS);
      await evaluate(`(()=>{const st=document.createElement('style'); st.textContent='*,*::before,*::after{animation:none!important;transition:none!important}'; document.head.appendChild(st); return true})()`);
    } else if (k === 'viewport') {
      await send('Emulation.setDeviceMetricsOverride', { width: s.viewport[0], height: s.viewport[1], deviceScaleFactor: s.dpr || 1, mobile: !!s.mobile });
      await sleep(600);
    } else if (k === 'eval') {
      const v = await evaluate(HELPERS + ';' + s.eval); log('eval ->', JSON.stringify(v));
      await sleep(s.wait || 700);
    } else if (k === 'click') {
      await evaluate(HELPERS + `;__click(__q(${JSON.stringify(s.click)}))`); await sleep(s.wait || 900);
    } else if (k === 'clickText') {
      await evaluate(HELPERS + `;__click(__byText(${JSON.stringify(s.clickText)}, ${JSON.stringify(s.tag || 'button')}))`); await sleep(s.wait || 900);
    } else if (k === 'type') {
      await evaluate(HELPERS + `;__setInput(__q(${JSON.stringify(s.type)}), ${JSON.stringify(s.text)})`); await sleep(s.wait || 900);
    } else if (k === 'key') {
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: s.key, code: s.key, windowsVirtualKeyCode: s.key === 'Enter' ? 13 : s.key === 'Escape' ? 27 : 0 });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: s.key, code: s.key });
      await sleep(s.wait || 700);
    } else if (k === 'wait') {
      await sleep(s.wait);
    } else if (k === 'shot') {
      const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      const f = path.join(OUT, s.shot + '.png');
      fs.writeFileSync(f, Buffer.from(r.data, 'base64')); log('saved', f);
    }
  } catch (e) { log('STEP FAILED', JSON.stringify(s), e.message); if (!s.optional) break; }
}
ws.close(); chrome.kill();
