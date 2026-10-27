// Records the live maxxing site frame by frame on a virtual clock, so the WebGL intro and the
// 3D bull come out perfectly smooth even on a CPU-only runner. Real data, real site.
// Each frame: advance the page clock 1/30 s, wait for paint, screenshot. Outputs mp4 clips in ./out
import { chromium } from 'playwright-core';
import ffmpegPath from 'ffmpeg-static';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const FFMPEG = process.env.FFMPEG || ffmpegPath || 'ffmpeg';
const SITE = process.env.SITE || 'https://maxxing-paad.vercel.app';
const OUT = 'out'; fs.mkdirSync(OUT, { recursive: true });
const LOG = []; const L = (...a) => { const s = a.join(' '); console.log(s); LOG.push(s) };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const W = 1600, H = 900, DPR = 1.2, FPS = 30, DT = 1000 / FPS;
const T0 = Date.now();

const browser = await chromium.launch({ channel: process.env.CHANNEL || 'chrome', args: ['--hide-scrollbars', '--disable-features=Translate', '--force-color-profile=srgb', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, colorScheme: 'dark', locale: 'en-US' });
await ctx.addInitScript(() => {
  if (window !== window.top) return; // leave the chart iframe on real time
  // ---- virtual clock: rAF, performance.now and timers only move when the recorder ticks ----
  const rRAF = window.requestAnimationFrame.bind(window);
  let vt = 0, rq = [], rid = 0, tid = 0; const TM = [];
  performance.now = () => vt;
  window.requestAnimationFrame = cb => { rq.push([++rid, cb]); return rid };
  window.cancelAnimationFrame = i => { rq = rq.filter(x => x[0] !== i) };
  window.setTimeout = (fn, ms, ...a) => { const id = ++tid; if (typeof fn === 'function') TM.push({ id, at: vt + Math.max(0, +ms || 0), fn, a }); return id };
  window.setInterval = (fn, ms, ...a) => { const id = ++tid; const iv = Math.max(1, +ms || 1); if (typeof fn === 'function') TM.push({ id, at: vt + iv, fn, a, iv }); return id };
  window.clearTimeout = window.clearInterval = id => { const i = TM.findIndex(x => x.id === id); if (i >= 0) TM.splice(i, 1) };
  window.__tick = ms => {
    const end = vt + ms;
    for (let guard = 0; guard < 500; guard++) {
      let n = null; for (const t of TM) if (t.at <= end && (!n || t.at < n.at)) n = t;
      if (!n) break;
      vt = Math.max(vt, n.at);
      if (n.iv) n.at += n.iv; else TM.splice(TM.indexOf(n), 1);
      try { n.fn(...n.a) } catch (e) { console.error(e) }
    }
    vt = end; const cbs = rq; rq = [];
    for (const [, cb] of cbs) { try { cb(vt) } catch (e) { console.error(e) } }
  };
  window.__paint = () => new Promise(r => rRAF(() => rRAF(r)));
  // ---- a visible cursor ----
  const mk = () => {
    if (document.getElementById('__cur')) return;
    const c = document.createElement('div'); c.id = '__cur';
    c.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M4 2.5l15 9.4-6.5 1.5-3.2 6.3z" fill="#fff" stroke="#061012" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, { position: 'fixed', left: '0', top: '0', zIndex: '2147483647', pointerEvents: 'none', transform: 'translate(-200px,-200px)', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,.55))' });
    document.documentElement.appendChild(c);
    const st = document.createElement('style'); st.textContent = '@keyframes __rp{from{transform:scale(.4);opacity:.95}to{transform:scale(1.7);opacity:0}}'; document.documentElement.appendChild(st);
    addEventListener('mousemove', e => { c.style.transform = `translate(${e.clientX - 4}px,${e.clientY - 2}px)` }, true);
    addEventListener('mousedown', e => { const r = document.createElement('div'); Object.assign(r.style, { position: 'fixed', left: e.clientX - 15 + 'px', top: e.clientY - 15 + 'px', width: '30px', height: '30px', borderRadius: '50%', border: '2px solid #39d6a3', zIndex: '2147483646', pointerEvents: 'none', animation: '__rp .55s ease-out forwards' }); document.documentElement.appendChild(r); window.setTimeout(() => r.remove(), 650) }, true);
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', mk); else mk();
});
const page = await ctx.newPage();
page.on('pageerror', e => L('pageerror', e.message.slice(0, 200)));
const cdp = await ctx.newCDPSession(page);
await cdp.send('Animation.enable').catch(() => { });

// ---- frame engine ----
let REC = null, NF = 0, msPer = 400, rate = 0;
async function setRate() { const r = Math.max(.02, Math.min(1, DT / msPer)); if (Math.abs(r - rate) / Math.max(rate, .01) > .15) { rate = r; await cdp.send('Animation.setPlaybackRate', { playbackRate: r }).catch(() => { }) } }
async function tick(n = 1, fn) {
  for (let i = 0; i < n; i++) {
    const t0 = Date.now();
    if (fn) await fn(n > 1 ? i / (n - 1) : 1, i);
    await page.evaluate(dt => { window.__tick(dt); return window.__paint() }, DT);
    if (REC) {
      const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 90, optimizeForSpeed: true });
      fs.writeFileSync(`${REC}/f${String(NF++).padStart(5, '0')}.jpg`, Buffer.from(r.data, 'base64'));
    }
    msPer = msPer * .85 + (Date.now() - t0) * .15; if (i % 10 === 0) await setRate();
  }
}
const secs = s => Math.round(s * FPS);
function start(name) { REC = `${OUT}/frames_${name}`; fs.mkdirSync(REC, { recursive: true }); NF = 0; L(`> ${name} (${((Date.now() - T0) / 60000).toFixed(1)} min in, ${msPer.toFixed(0)} ms/frame)`) }
function stop(name) {
  const dir = REC; REC = null; if (!NF) return;
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${dir}/f%05d.jpg`, '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x071013', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', `${OUT}/${name}.mp4`]);
  L(`clip ${name}: ${NF} frames = ${(NF / FPS).toFixed(2)}s`);
}
async function scene(name, fn) { try { start(name); await fn(); stop(name) } catch (e) { L(`scene ${name} error: ${e.message}`); try { stop(name) } catch (e2) { } } }

// ---- mouse + scroll, all driven per frame ----
let MX = W * .62, MY = H + 40;
const eio = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
async function move(x, y, s = .8) { const x0 = MX, y0 = MY; await tick(secs(s), async k => { const e = eio(k); MX = x0 + (x - x0) * e; MY = y0 + (y - y0) * e; await page.mouse.move(MX, MY) }) }
async function box(sel) { const b = await page.locator(sel).first().boundingBox(); if (!b) throw new Error('no box ' + sel); return b }
async function moveTo(sel, s = .8, fx = .5, fy = .5) { const b = await box(sel); await move(b.x + b.width * fx, b.y + b.height * fy, s) }
async function press() { await page.mouse.down(); await tick(2); await page.mouse.up() }
async function click(sel, s = .8, fx = .5, fy = .5) { await moveTo(sel, s, fx, fy); await tick(3); await press() }
async function scrollY(y, s = 1.2) { const y0 = await page.evaluate(() => scrollY); await tick(secs(s), async k => { await page.evaluate(v => scrollTo(0, v), y0 + (y - y0) * eio(k)) }) }
async function topOf(sel, off = 90) { return page.evaluate(([s, o]) => { const el = document.querySelector(s); return el ? el.getBoundingClientRect().top + scrollY - o : 0 }, [sel, off]) }
async function hold(s) { await tick(secs(s)) }
async function type(text, every = 3) { for (const ch of text) { await page.keyboard.type(ch); await tick(every) } }
async function warm(realMs, pred) { const t = Date.now(); while (Date.now() - t < realMs) { await tick(1); if (pred && await page.evaluate(pred).catch(() => false)) break } }

/* 1. the intro, the flight into the hero, then the bull reacting to the cursor */
await page.goto(SITE, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__mx3d, null, { timeout: 60000 }).catch(() => L('3d module slow'));
L('3d', await page.evaluate(() => JSON.stringify(window.__mx3d || null)));
await page.mouse.move(MX, MY);
await sleep(2500); // let the first data requests land (the virtual clock is still at 0)
await scene('s1_intro', async () => {
  await tick(secs(4.4));
  // make sure the auto-close can happen: it waits for data
  await tick(secs(2.2));
  if (await page.evaluate(() => !!document.getElementById('intro'))) { L('intro still up, closing'); await page.evaluate(() => window.__mx && window.__mx.close()); await tick(secs(1.1)) }
  await hold(.8);
  const b = await box('#hb'); await move(b.x + b.width * .62, b.y + b.height * .32, 1.2);
  await move(b.x + b.width * .44, b.y + b.height * .45, 1.0); await move(b.x + b.width * .56, b.y + b.height * .58, .9);
  await press(); await hold(1.4);
});
await warm(25000, () => document.querySelectorAll('#grid .cc').length > 8 && document.querySelectorAll('#mmap .mt').length > 10);

/* 2. fee band → the two kings → stonk market map */
await scene('s2_map', async () => {
  await moveTo('#meter', .9, .5, .5); await hold(1.2);
  await scrollY(await topOf('#king', 110), 1.1); await moveTo('#king .king', .8, .3, .5); await hold(.8);
  await scrollY(await topOf('#mapSec', 76), 1.2); await hold(.3);
  for (const k of [1, 2, 4]) { await moveTo(`#mmap .mt:nth-child(${k})`, .7, .5, .5); await hold(.7) }
  await click('#mmBy button[data-b="mcap"]', .8); await hold(1.4);
  await click('#mmPad button[data-p="stonkfun"]', .8); await hold(1.3);
  await click('#mmPad button[data-p="all"]', .7); await click('#mmBy button[data-b="v1"]', .6); await hold(.8);
});

/* 3. the maxx ladder, live level-ups, stonk pairs, trending */
await scene('s3_ladder', async () => {
  await scrollY(await topOf('#ladderSec', 76), 1.2); await hold(.3);
  await moveTo('#ladder .rung:nth-child(2)', .7, .5, .45); await hold(.6);
  await moveTo('#ladder .rung:nth-child(3)', .6, .5, .45); await hold(.6);
  await moveTo('#ladder .rung:nth-child(4)', .6, .5, .45); await hold(.8);
  await moveTo('#lupl', .7, .3, .5); await hold(.8);
  await scrollY(await topOf('#pairs', 160), 1.0); await moveTo('#pairs .pair:nth-child(2)', .7); await hold(.8);
  await scrollY(await topOf('#strip', 130), 1.0); await moveTo('#strip .tc:nth-child(3)', .8); await hold(1.2);
});

/* 4. the board */
await scene('s4_board', async () => {
  await scrollY(await topOf('#market', 76), 1.1); await hold(.2);
  await moveTo('#grid .cc:nth-child(1)', .7, .55, .45); await hold(.6);
  await moveTo('#grid .cc:nth-child(2)', .6, .5, .55); await hold(.6);
  await click('#tabs button[data-t="asc"]', .8); await hold(1.2);
  await click('#tabs button[data-t="mog"]', .6); await hold(1.0);
  await click('#plat button[data-p="stonkfun"]', .8); await hold(1.2);
  await click('#plat button[data-p="all"]', .6); await click('#tabs button[data-t="new"]', .6); await hold(.6);
});

/* 5. ⌘K search → open a real coin */
const pick = await page.evaluate(() => { const els = [...document.querySelectorAll('#strip .tc[data-m]')].map(e => e.dataset.m); const m = els.find(m => /pump$/.test(m)) || els[0] || document.querySelector('#grid .cc')?.dataset.m; return m });
const sym = await page.evaluate(m => { const t = document.querySelector(`#strip .tc[data-m="${m}"] .bd b`) || document.querySelector(`.cc[data-m="${m}"] .nm span`); return (t?.textContent || '').replace(/^\$/, '').trim() }, pick);
L('coin', pick, sym);
await page.evaluate(() => scrollTo(0, 0));
await scene('s5_search', async () => {
  await moveTo('#qbtn', .9, .4, .5); await hold(.3);
  await page.keyboard.press('Control+k'); await hold(.6);
  await type((sym || 'stonk').toLowerCase().slice(0, 8), 3); await hold(1.4);
  // pick the exact coin if it's listed, else the first
  await page.evaluate(m => { const L = [...document.querySelectorAll('#ckl .ck-i')]; const i = L.findIndex(x => x.innerHTML.includes(m.slice(0, 4)) && x.innerHTML.includes(m.slice(-4))); if (i > 0) { L[i].dispatchEvent(new MouseEvent('mousemove', { bubbles: true })) } }, pick || '');
  await hold(.6);
  await page.keyboard.press('Enter'); await hold(.8);
});
// let the chart and the Jupiter widget load in real time before filming the coin page
await warm(14000, () => { const h = document.querySelector('#jupiter-plugin-instance > div'); return !!(h && h.shadowRoot && h.shadowRoot.querySelectorAll('input').length) });
await warm(5000);
await page.evaluate(() => scrollTo(0, 0));

/* 6. coin page: chart, live Jupiter quote, level, stats */
await scene('s6_coin', async () => {
  await moveTo('#chart', 1.0, .35, .45); await move(MX + 240, MY - 30, 1.2); await hold(.3);
  const inp = await page.evaluate(() => { const sr = document.querySelector('#jupiter-plugin-instance > div')?.shadowRoot; const i = sr && sr.querySelector('input'); if (!i) return null; const r = i.getBoundingClientRect(); return { x: r.x + r.width * .6, y: r.y + r.height / 2 } });
  if (inp) { await move(inp.x, inp.y, .9); await press(); await hold(.3); await type('0.5', 5); for (let i = 0; i < 6; i++) { await warm(450); await hold(.2) } } else L('no jupiter input');
  await scrollY(await topOf('#cLevel', 140), 1.2); await moveTo('#cLevel', .8, .4, .45); await hold(1.2);
  await moveTo('#cStats .st:nth-child(6)', .7); await hold(.8);
  await scrollY(0, 1.0); await click('#cStar', .8); await hold(1.0);
});

/* 7. launch: name, ticker check against pump.fun + StonkFun, pair, sniper fee curve */
await page.evaluate(() => location.hash = '#/launch'); await warm(1500);
await scene('s7_launch', async () => {
  await click('#lName', .9); await type('Steel Bull', 2); await hold(.2);
  await click('#lTk', .6); await type('STEEL', 3); for (let i = 0; i < 5; i++) { await warm(400); await hold(.2) }
  await moveTo('#lPrev', .8, .5, .5); await hold(.8);
  await page.evaluate(() => { const s = document.querySelector('#lPair'); const o = [...s.options].find(o => o.value !== 'SOL'); if (o) { s.value = o.value; s.dispatchEvent(new Event('change')) } }); await hold(.9);
  await scrollY(await topOf('.rules', 140), 1.1); await moveTo('#curve', .7, .2, .4); await move(MX + 360, MY + 20, 1.6); await hold(.5);
});

/* 8. maxx check */
await page.evaluate(() => location.hash = '#/check'); await warm(2500, () => /\$/.test(document.querySelector('#kSol')?.textContent || ''));
await scene('s8_check', async () => {
  await moveTo('#kOut', .9, .3, .5); await hold(.4);
  await click('#presets button[data-s="5"]', .8); await hold(1.1);
  await click('#presets button[data-s="1"]', .6); await hold(.9);
  const b = await box('#kN'); await move(b.x + b.width * .15, b.y + b.height / 2, .6); await page.mouse.down();
  await tick(secs(1.1), async k => { MX = b.x + b.width * (.15 + .5 * k); await page.mouse.move(MX, MY) }); await page.mouse.up(); await hold(1.0);
});

/* 9. back to the bull */
await page.evaluate(() => { location.hash = '#/'; }); await warm(1500); await page.evaluate(() => scrollTo(0, 0)); await warm(800);
await scene('s9_bull', async () => {
  const b = await box('#hb'); await move(b.x + b.width * .3, b.y + b.height * .7, .9);
  await move(b.x + b.width * .5, b.y + b.height * .42, 1.2); await press(); await hold(.9);
  await move(b.x + b.width * .62, b.y + b.height * .5, 1.0); await hold(1.2);
  await move(b.x + b.width * 1.2, b.y + b.height * .3, .9); await hold(1.6);
});

fs.writeFileSync(`${OUT}/log.txt`, LOG.join('\n'));
fs.writeFileSync(`${OUT}/done.json`, JSON.stringify({ at: new Date().toISOString(), site: SITE, coin: pick, sym, mins: ((Date.now() - T0) / 60000).toFixed(1), clips: fs.readdirSync(OUT).filter(f => f.endsWith('.mp4')) }));
await browser.close();
