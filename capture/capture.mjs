// Records real screen footage of the live aura site (real data, real chart, real Jupiter quote)
// as separate clips. Runs in GitHub Actions; outputs mp4 clips + a log into ./out
import { chromium } from 'playwright';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const SITE = process.env.SITE || 'https://aura-pad-tqqy.vercel.app';
const OUT = 'out'; fs.mkdirSync(OUT, { recursive: true });
const LOG = []; const L = (...a) => { const s = a.join(' '); console.log(s); LOG.push(s) };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const W = 1600, H = 900, DPR = 1.2;

const browser = await chromium.launch({ args: ['--hide-scrollbars', '--disable-features=Translate', '--force-color-profile=srgb'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, colorScheme: 'dark', locale: 'en-US' });
await ctx.addInitScript(() => {
  const mk = () => {
    if (document.getElementById('__cur')) return;
    const c = document.createElement('div'); c.id = '__cur';
    c.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M4 2.5l15 9.4-6.5 1.5-3.2 6.3z" fill="#fff" stroke="#0d0d10" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, { position: 'fixed', left: '0', top: '0', zIndex: '2147483647', pointerEvents: 'none', transform: 'translate(-200px,-200px)', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,.55))' });
    document.documentElement.appendChild(c);
    const st = document.createElement('style'); st.textContent = '@keyframes __rp{from{transform:scale(.4);opacity:.95}to{transform:scale(1.7);opacity:0}}'; document.documentElement.appendChild(st);
    addEventListener('mousemove', e => { c.style.transform = `translate(${e.clientX - 4}px,${e.clientY - 2}px)` }, true);
    addEventListener('mousedown', e => { const r = document.createElement('div'); Object.assign(r.style, { position: 'fixed', left: e.clientX - 15 + 'px', top: e.clientY - 15 + 'px', width: '30px', height: '30px', borderRadius: '50%', border: '2px solid #b9a4ff', zIndex: '2147483646', pointerEvents: 'none', animation: '__rp .55s ease-out forwards' }); document.documentElement.appendChild(r); setTimeout(() => r.remove(), 650) }, true);
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', mk); else mk();
});
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
let FR = null;
cdp.on('Page.screencastFrame', async f => { if (FR) FR.push({ t: f.metadata.timestamp, d: f.data }); try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }) } catch (e) { } });
async function start() { FR = []; await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 }) }
async function stop(name) {
  await sleep(200); await cdp.send('Page.stopScreencast'); const F = FR; FR = null;
  const dir = `${OUT}/frames_${name}`; fs.mkdirSync(dir, { recursive: true });
  let list = '';
  F.forEach((f, i) => { const p = `${dir}/f${String(i).padStart(5, '0')}.jpg`; fs.writeFileSync(p, Buffer.from(f.d, 'base64')); const dur = i < F.length - 1 ? Math.max(0.001, F[i + 1].t - f.t) : 0.4; list += `file 'f${String(i).padStart(5, '0')}.jpg'\nduration ${dur.toFixed(4)}\n` });
  if (F.length) list += `file 'f${String(F.length - 1).padStart(5, '0')}.jpg'\n`;
  fs.writeFileSync(`${dir}/list.txt`, list);
  const span = F.length ? (F[F.length - 1].t - F[0].t + 0.4) : 0;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${dir}/list.txt`, '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x0d0d10,fps=30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', `${OUT}/${name}.mp4`]);
  L(`clip ${name}: ${F.length} frames over ${span.toFixed(2)}s (${(F.length / Math.max(span, .1)).toFixed(1)} fps)`);
}
let MX = W / 2, MY = H + 40;
async function move(x, y, ms = 900) { const n = Math.max(10, Math.round(ms / 16)), x0 = MX, y0 = MY; for (let i = 1; i <= n; i++) { const k = i / n, e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; await page.mouse.move(x0 + (x - x0) * e, y0 + (y - y0) * e); await sleep(ms / n) } MX = x; MY = y }
async function box(sel) { const b = await page.locator(sel).first().boundingBox(); if (!b) throw new Error('no box ' + sel); return b }
async function moveTo(sel, ms = 900, fx = .5, fy = .5) { const b = await box(sel); await move(b.x + b.width * fx, b.y + b.height * fy, ms) }
async function click(sel, ms = 900, fx = .5, fy = .5) { await moveTo(sel, ms, fx, fy); await sleep(160); await page.mouse.down(); await sleep(90); await page.mouse.up() }
async function scrollTo(y, ms = 1500) { await page.evaluate(([y, ms]) => new Promise(res => { const y0 = scrollY, t0 = performance.now(); const f = n => { const k = Math.min(1, (n - t0) / ms), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; scrollTo(0, y0 + (y - y0) * e); if (k < 1) requestAnimationFrame(f); else res() }; requestAnimationFrame(f) }), [y, ms]) }
async function topOf(sel, off = 90) { return page.evaluate(([s, o]) => { const el = document.querySelector(s); return el ? el.getBoundingClientRect().top + scrollY - o : 0 }, [sel, off]) }
async function scene(name, fn) { try { await fn() } catch (e) { L(`scene ${name} error: ${e.message}`); try { if (FR) await stop(name) } catch (e2) { } } }

/* 1. intro → site entrance → hero */
await scene('s1_intro', async () => {
  await page.goto('about:blank'); await start();
  await page.goto(SITE, { waitUntil: 'commit' });
  await sleep(6400);
  await move(720, 330, 1500); await move(980, 300, 1300); await sleep(500);
  await stop('s1_intro');
});
await page.waitForFunction(() => document.querySelectorAll('#grid .cc').length > 8 && document.querySelectorAll('#strip .tc').length > 4, null, { timeout: 30000 }).catch(() => L('board slow'));
await sleep(1500);

/* 2. hero meter ticking → top coins → trending marquee → board */
await scene('s2_board', async () => {
  await start();
  await moveTo('#meter', 1200, .5, .62); await sleep(1600);
  await scrollTo(await topOf('#king', 110), 1700); await moveTo('#king .king', 1000, .3, .5); await sleep(1300);
  await scrollTo(await topOf('#strip', 130), 1500); await moveTo('#strip .tc:nth-child(3)', 900); await sleep(1700);
  await scrollTo(await topOf('#market', 76), 1600); await sleep(400);
  await moveTo('#grid .cc:nth-child(1)', 900, .55, .45); await sleep(900);
  await moveTo('#grid .cc:nth-child(2)', 800, .5, .55); await sleep(900);
  await click('#tabs button[data-t="aura"]', 900); await sleep(1500);
  await click('#plat button[data-p="stonkfun"]', 900); await sleep(1700);
  await click('#plat button[data-p="all"]', 800); await sleep(900);
  await stop('s2_board');
});

/* pick a busy pump.fun coin for the coin page */
const mint = await page.evaluate(() => { const els = [...document.querySelectorAll('#strip .tc[data-m]')]; const m = els.map(e => e.dataset.m).find(m => /pump$/.test(m)); return m || els[0]?.dataset.m || document.querySelector('#grid .cc')?.dataset.m });
L('coin', mint);
await page.evaluate(m => location.hash = '#/coin/' + m, mint);
await page.waitForFunction(() => { const h = document.querySelector('#jupiter-plugin-instance > div'); return h && h.shadowRoot && h.shadowRoot.querySelectorAll('input').length > 0 }, null, { timeout: 25000 }).catch(() => L('jupiter widget slow'));
await sleep(7000); // let the chart draw
await page.evaluate(() => scrollTo(0, 0));

/* 3. coin page: chart, live Jupiter quote, stats, watch */
await scene('s3_coin', async () => {
  await start();
  await moveTo('#chart', 1300, .35, .45); await sleep(600); await move(MX + 260, MY - 40, 1500); await sleep(700);
  const inp = await page.evaluate(() => { const sr = document.querySelector('#jupiter-plugin-instance > div')?.shadowRoot; const i = sr && sr.querySelector('input'); if (!i) return null; const r = i.getBoundingClientRect(); return { x: r.x + r.width * .6, y: r.y + r.height / 2 } });
  if (inp) { await move(inp.x, inp.y, 1200); await sleep(200); await page.mouse.down(); await sleep(80); await page.mouse.up(); await sleep(300); await page.keyboard.type('0.5', { delay: 220 }); await sleep(3200) } else L('no jupiter input');
  await scrollTo(await topOf('#cPress', 120), 1600); await moveTo('#cPress', 900, .3, .5); await sleep(1100);
  await moveTo('#cStats .st:nth-child(6)', 800); await sleep(900);
  await moveTo('#cMore', 900, .5, .4); await sleep(1100);
  await scrollTo(0, 1300); await click('#cStar', 900); await sleep(1500);
  await stop('s3_coin');
});

/* 4. launch: name, ticker check against pump.fun + StonkFun, fee curve */
await page.evaluate(() => location.hash = '#/launch'); await sleep(1500);
await scene('s4_launch', async () => {
  await start();
  await click('#lName', 1000); await page.keyboard.type('Lilac Cat', { delay: 110 }); await sleep(300);
  await click('#lTk', 700); await page.keyboard.type('LILAC', { delay: 140 }); await sleep(2600);
  await moveTo('#lPrev', 1000, .5, .5); await sleep(1200);
  await scrollTo(await topOf('.rules', 140), 1400); await moveTo('#curve', 900, .2, .4); await move(MX + 380, MY + 30, 2200); await sleep(800);
  await stop('s4_launch');
});

/* 5. aura check */
await page.evaluate(() => location.hash = '#/check'); await sleep(2500);
await scene('s5_check', async () => {
  await start();
  await moveTo('#kOut', 1100, .3, .5); await sleep(700);
  await click('#presets button[data-s="5"]', 1000); await sleep(1700);
  await click('#presets button[data-s="1"]', 800); await sleep(1500);
  const b = await box('#kN'); await move(b.x + b.width * .15, b.y + b.height / 2, 800); await page.mouse.down(); for (let i = 1; i <= 30; i++) { await page.mouse.move(b.x + b.width * (.15 + .5 * i / 30), b.y + b.height / 2); await sleep(45) } await page.mouse.up(); MX = b.x + b.width * .65; await sleep(1500);
  await stop('s5_check');
});

/* 6. FAQ */
await page.evaluate(() => location.hash = '#/faq'); await sleep(1200);
await scene('s6_faq', async () => {
  await start();
  await click('#fqCats button[data-c="fees"]', 1100); await sleep(900);
  const sum = page.locator('#faqList details summary', { hasText: 'compare to pump.fun' }).first();
  const sb = await sum.boundingBox(); if (sb) { await move(sb.x + 260, sb.y + sb.height / 2, 900); await page.mouse.down(); await sleep(80); await page.mouse.up() } await sleep(2600);
  await click('aside [data-plat="aura"]', 1200); await sleep(2200);
  await stop('s6_faq');
});

fs.writeFileSync(`${OUT}/log.txt`, LOG.join('\n'));
fs.writeFileSync(`${OUT}/done.json`, JSON.stringify({ at: new Date().toISOString(), site: SITE, coin: mint, clips: fs.readdirSync(OUT).filter(f => f.endsWith('.mp4')) }));
await browser.close();
