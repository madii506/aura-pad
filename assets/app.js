(() => {
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const JUP = 'https://lite-api.jup.ag/tokens/v2', SF = 'https://www.stonkfun.xyz', SFAPI = SF + '/api/public/v1/tokens';
const SOLM = 'So11111111111111111111111111111111111111112';
const PUMP = .0125, AURA = .005, PADS = new Set(['pump.fun', 'stonkfun']);
const BAD = /fuck|shit|cunt|n[i1]gg|fag|retard|porn|nazi|hitler|pedo|rape|kys|\bsex\b|cum\b/i;
const usd = v => v == null || !isFinite(v) ? '—' : v >= 1e9 ? '$' + (v / 1e9).toFixed(2) + 'B' : v >= 1e6 ? '$' + (v / 1e6).toFixed(2) + 'M' : v >= 1e3 ? '$' + (v / 1e3).toFixed(1) + 'K' : v >= 1 ? '$' + v.toFixed(0) : '$' + v.toFixed(2);
const price = v => v == null || !isFinite(v) ? '—' : v >= 1 ? '$' + v.toFixed(2) : v >= .01 ? '$' + v.toFixed(4) : '$' + v.toPrecision(3);
const pct = v => v == null || !isFinite(v) ? '—' : (v > 0 ? '+' : '') + (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1)) + '%';
const fmtN = v => v == null || !isFinite(v) ? '—' : v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e4 ? (v / 1e3).toFixed(1) + 'K' : Math.round(v).toLocaleString('en-US');
const ago = t => { if (!t) return '—'; const s = Math.max(0, (Date.now() - new Date(t)) / 1000); return s < 60 ? Math.round(s) + 's' : s < 3600 ? Math.round(s / 60) + 'm' : s < 86400 ? Math.round(s / 3600) + 'h' : Math.round(s / 86400) + 'd' };
const short = a => a ? a.slice(0, 4) + '…' + a.slice(-4) : '';
const padName = p => p === 'aura' ? 'aura' : p === 'stonkfun' ? 'StonkFun' : p === 'pump.fun' ? 'pump.fun' : (p || '—');
const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 1800) };
const tile = s => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#1c1c23"/><text x="32" y="41" text-anchor="middle" font-family="Arial" font-weight="700" font-size="24" fill="#b9a4ff">${String(s || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || '?'}</text></svg>`);
const store = { get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d } catch (e) { return d } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const pcdn = (m, v = '128x128') => 'https://images.pump.fun/coin-image/' + m + '?variant=' + v;
function countTo(el, to, fmt, dur = 900) { if (!el || to == null || !isFinite(to)) return; const from = el._v || 0; el._v = to; const t0 = performance.now(); const f = n => { const k = Math.min(1, (n - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) requestAnimationFrame(f) }; requestAnimationFrame(f) }

/* =================== intro =================== */
const LOADED = new Set();
const INTRO = { done: false, t0: performance.now(), orbit: [], picked: new Set(), exitAt: null };
function introProgress() {
  if (INTRO.done) return;
  const b = $('#ildB'), t = $('#ildT'); if (!b) return;
  b.style.width = Math.max(10, LOADED.size / 4 * 100) + '%';
  const all = [...ALL.values()], pf = all.filter(c => c.pad === 'pump.fun').length, sf = all.filter(c => c.pad === 'stonkfun').length;
  if (all.length && t) t.innerHTML = `<i class="dot"></i>${all.length} live coins · pump.fun ${pf} · StonkFun ${sf}`;
  // real coin logos join the orbit as they load
  const pool = all.filter(c => !INTRO.picked.has(c.mint) && (c.pad === 'pump.fun' || c.simg)).slice(0, 18 - INTRO.picked.size);
  pool.forEach(c => { INTRO.picked.add(c.mint); const im = new Image(); im.referrerPolicy = 'no-referrer'; im.onload = () => { if (!INTRO.done && INTRO.orbit.length < 16) INTRO.orbit.push({ im, born: Math.max(performance.now(), INTRO.t0 + 1850 + INTRO.orbit.length * 70), k: INTRO.orbit.length }) }; im.src = c.pad === 'pump.fun' ? pcdn(c.mint, '86x86') : c.simg });
}
function closeIntro() {
  if (INTRO.done) return; INTRO.done = true; INTRO.exitAt = performance.now();
  const el = $('#intro'); if (!el) return;
  document.body.classList.add('entering'); document.body.classList.remove('locked');
  el.classList.add('out');
  setTimeout(() => el.remove(), 950); setTimeout(() => document.body.classList.remove('entering'), 2200);
  revealAll();
}
(function intro() {
  const el = $('#intro'); if (!el) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('#iskip').onclick = closeIntro; el.addEventListener('click', e => { if (performance.now() - INTRO.t0 > 1200) closeIntro() });
  addEventListener('keydown', e => { if (!INTRO.done && (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ')) closeIntro() });
  if (reduce) { setTimeout(closeIntro, 500); return }
  const cv = $('#ic'), ctx = cv.getContext('2d'); let W = 0, H = 0, D = 1, box = null;
  const size = () => { const ia = $('#ia'); if (!ia) { removeEventListener('resize', size); return } D = Math.min(2, devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * D; cv.height = H * D; ctx.setTransform(D, 0, 0, D, 0, 0); box = ia.getBoundingClientRect() };
  size(); addEventListener('resize', size);
  // warp stars
  const ST = Array.from({ length: 160 }, () => ({ a: Math.random() * 6.283, d: Math.random(), s: .6 + Math.random() * 1.6, v: .25 + Math.random() * .6 }));
  let P = [], N = 0, M = 0, ready = false;
  const im = new Image();
  im.onload = () => {
    N = 46; M = Math.round(N * im.height / im.width);
    const oc = document.createElement('canvas'); oc.width = N; oc.height = M; const o = oc.getContext('2d'); o.drawImage(im, 0, 0, N, M);
    let d; try { d = o.getImageData(0, 0, N, M).data } catch (e) { return }
    for (let y = 0; y < M; y++) for (let x = 0; x < N; x++) { const i = (y * N + x) * 4; if (d[i + 3] > 150) P.push({ x, y, r: d[i], g: d[i + 1], b: d[i + 2], a: Math.random() * 6.283, R: .45 + Math.random() * .55, dl: Math.hypot(x - N / 2, y - M / 2) / N * .55 + Math.random() * .3, sp: .8 + Math.random() * .45 }) }
    ready = true;
  };
  im.src = 'assets/img/a.png';
  const ease = k => 1 - Math.pow(1 - k, 4), easeIO = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const iw = [...$$('#iw span')], GLY = 'aur#%&@$01▚▞▓<>/';
  let feeStarted = false, flash = 0, shakeT = -1, impacted = false;
  function drawOrbit(cx, cy, rx, ry, t, front, zoom) {
    const n = INTRO.orbit.length; if (!n) return;
    for (const o of INTRO.orbit) {
      const ang = t * .55 + o.k / Math.max(8, n) * 6.283; const z = Math.sin(ang); if ((z >= 0) !== front) continue;
      const pop = Math.max(0, Math.min(1, (performance.now() - o.born) / 450)), pe = 1 - Math.pow(1 - pop, 3); if (!pop) continue;
      const sc = (.62 + .38 * (z + 1) / 2) * (0.4 + .6 * pe) * zoom;
      const sz = 38 * sc, x = cx + Math.cos(ang) * rx * zoom - sz / 2, y = cy + z * ry * zoom - sz / 2;
      ctx.globalAlpha = (.35 + .65 * (z + 1) / 2) * pop;
      ctx.save(); ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, sz, sz, sz * .24); else ctx.rect(x, y, sz, sz); ctx.clip(); ctx.drawImage(o.im, x, y, sz, sz); ctx.restore();
      ctx.strokeStyle = 'rgba(185,164,255,.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, sz, sz, sz * .24); else ctx.rect(x, y, sz, sz); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function frame(now) {
    if (INTRO.done && !$('#intro')) return;
    const t = (now - INTRO.t0) / 1000;
    const ex = INTRO.exitAt ? Math.min(1, (now - INTRO.exitAt) / 850) : 0, zoom = 1 + easeIO(ex) * 1.6;
    // trails while assembling, clean frame after
    if (t < 1.9 && !ex) { ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over' } else ctx.clearRect(0, 0, W, H);
    if (!box) { requestAnimationFrame(frame); return }
    const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
    let sx = 0, sy = 0; if (shakeT > 0 && t - shakeT < .35) { const k = 1 - (t - shakeT) / .35; sx = (Math.random() - .5) * 10 * k; sy = (Math.random() - .5) * 10 * k }
    // warp stars rushing toward the A, then settling into a slow drift
    const warp = Math.max(0, 1 - t / 1.8);
    for (const s of ST) {
      s.d -= (.004 + warp * .03) * s.v; if (s.d < .02) { s.d = 1; s.a = Math.random() * 6.283 }
      const R = Math.max(W, H) * .75 * s.d, x = cx + Math.cos(s.a) * R, y = cy + Math.sin(s.a) * R * .8;
      const len = warp * 26 * s.v; ctx.strokeStyle = `rgba(185,164,255,${.12 + .4 * (1 - s.d)})`; ctx.lineWidth = s.s;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(s.a) * len, y + Math.sin(s.a) * len * .8); ctx.stroke();
      if (!len) { ctx.fillStyle = `rgba(185,164,255,${.15 + .35 * (1 - s.d)})`; ctx.fillRect(x, y, s.s, s.s) }
    }
    if (ready) {
      const cell = box.width / N * zoom, w = N * cell, h = M * cell;
      const ox = cx - w / 2 + sx, oy = cy - h / 2 + sy + Math.sin(t * 1.6) * 4 * Math.min(1, Math.max(0, t - 1.8));
      const orx = box.width * 1.05, ory = box.width * .32;
      drawOrbit(cx + sx, cy + sy, orx, ory, t, false, zoom);
      const sweep = ((t - 1.9) % 2.4) / 2.4; let all = true;
      for (const p of P) {
        const k = Math.max(0, Math.min(1, (t - .15 - p.dl) / (1.05 * p.sp))), e = ease(k); if (k < 1) all = false;
        const tx = ox + p.x * cell, ty = oy + p.y * cell;
        const R = Math.max(W, H) * .62 * p.R * (1 - e), th = p.a + (1 - e) * 5.5;
        const spx = cx + Math.cos(th) * R, spy = cy + Math.sin(th) * R * .7;
        const x = spx + (tx - spx) * e, y = spy + (ty - spy) * e;
        const wv = 1 - e; ctx.globalAlpha = Math.min(1, k * 2) * (1 - ex);
        ctx.fillStyle = `rgb(${p.r + (255 - p.r) * wv | 0},${p.g + (255 - p.g) * wv | 0},${p.b + (255 - p.b) * wv | 0})`;
        const s = cell * (k < 1 ? .5 + .45 * e : .95); ctx.fillRect(x, y, s, s);
        if (t > 1.9 && k >= 1) { const d = (p.x + p.y) / (N + M), wd = Math.abs(d - sweep); if (wd < .05) { ctx.globalAlpha = (1 - wd / .05) * .6 * (1 - ex); ctx.fillStyle = '#fff'; ctx.fillRect(x, y, s, s) } }
      }
      ctx.globalAlpha = 1;
      if (all && !impacted && t > 1) { impacted = true; flash = 1; shakeT = t }
      if (impacted) {
        const it = t - shakeT; if (it < 1.1) { const k = it / 1.1, r = box.width * (.6 + k * 2.4); ctx.strokeStyle = `rgba(214,201,255,${(1 - k) * .7})`; ctx.lineWidth = 3 * (1 - k) + .5; ctx.beginPath(); ctx.ellipse(cx, cy, r, r * .8, 0, 0, 6.283); ctx.stroke(); const r2 = box.width * (.5 + k * 1.5); ctx.strokeStyle = `rgba(143,120,255,${(1 - k) * .45})`; ctx.beginPath(); ctx.ellipse(cx, cy, r2, r2 * .8, 0, 0, 6.283); ctx.stroke() }
      }
      drawOrbit(cx + sx, cy + sy, orx, ory, t, true, zoom);
      if (flash > 0) { ctx.fillStyle = `rgba(214,201,255,${flash * .22})`; ctx.fillRect(0, 0, W, H); flash = Math.max(0, flash - .05) }
    }
    // wordmark scramble then settle
    iw.forEach((s, i) => { const st = 1.75 + i * .1, set = st + .38; if (t >= st && !s.classList.contains('on')) s.classList.add('on'); if (t >= st && t < set) s.textContent = GLY[(Math.random() * GLY.length) | 0]; else if (t >= set && !s.classList.contains('set')) { s.textContent = 'aura'[i]; s.classList.add('set') } });
    if (t > 2.3 && !feeStarted && $('#ifeeV')) { feeStarted = true; const v = $('#ifeeV'), t1 = performance.now(); const f = n => { const k = Math.min(1, (n - t1) / 1000), e = 1 - Math.pow(1 - k, 3); v.textContent = (1.25 - .75 * e).toFixed(2) + '%'; if (k < 1) requestAnimationFrame(f) }; requestAnimationFrame(f) }
    if (!INTRO.done && ((t > 4.4 && LOADED.size >= 2) || t > 6.2)) closeIntro();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* =================== data =================== */
const abs = u => !u ? '' : /^https?:/.test(u) ? u : SF + (u.startsWith('/') ? '' : '/') + u;
const fromJup = t => ({ mint: t.id, sym: t.symbol, name: t.name, jimg: t.icon, pad: t.launchpad, mcap: t.mcap, price: t.usdPrice, liq: t.liquidity, holders: t.holderCount, hch: t.stats1h?.holderChange, aura: t.organicScore, auraL: t.organicScoreLabel, dev: t.dev, created: t.firstPool?.createdAt || t.createdAt, pool: t.firstPool?.id, gpool: t.graduatedPool, gat: t.graduatedAt,
  c5: t.stats5m?.priceChange, c1: t.stats1h?.priceChange, c24: t.stats24h?.priceChange,
  v1: t.stats1h ? (t.stats1h.buyVolume || 0) + (t.stats1h.sellVolume || 0) : undefined, v24: t.stats24h ? (t.stats24h.buyVolume || 0) + (t.stats24h.sellVolume || 0) : undefined,
  b1: t.stats1h?.numBuys, s1: t.stats1h?.numSells, bv1: t.stats1h?.buyVolume, sv1: t.stats1h?.sellVolume, tr1: t.stats1h?.numTraders,
  tw: t.twitter, tg: t.telegram, top10: t.audit?.topHoldersPercentage, mintOff: t.audit?.mintAuthorityDisabled, freezeOff: t.audit?.freezeAuthorityDisabled, verified: t.isVerified, jt: Date.now() });
const fromSF = t => ({ mint: t.mint, sym: t.symbol, name: t.name, simg: abs(t.imageUrl), pad: 'stonkfun', mcap: t.market?.marketCapUsd, price: t.market?.priceUsd, liq: t.market?.liquidityUsd, v24: t.market?.volume24hUsd, peak: t.market?.peakMarketCapUsd, created: t.createdAt, pool: t.pool,
  quote: t.quote?.symbol, qlogo: abs(t.quote?.logoUrl), qcat: t.quote?.categoryLabel, prog: t.graduationProgress, status: t.status, tfee: t.transferFee?.bps, sx: t.links?.twitter, sweb: t.links?.website, stg: t.links?.telegram });
const ok = c => c && c.mint && !BAD.test((c.sym || '') + ' ' + (c.name || ''));
async function get(u, ms = 10000) { const ac = new AbortController(); const to = setTimeout(() => ac.abort(), ms); try { const r = await fetch(u, { cache: 'no-store', signal: ac.signal }); if (!r.ok) throw new Error(r.status); return await r.json() } finally { clearTimeout(to) } }
/* Jupiter: through our edge-cached proxy first, then direct with a polite queue and 429 backoff */
let JQ = Promise.resolve(), JNEXT = 0;
function jdirect(path) {
  const run = async () => {
    for (let i = 0; i < 4; i++) {
      const w = JNEXT - Date.now(); if (w > 0) await sleep(w); JNEXT = Date.now() + 500;
      try { return await get(`${JUP}/${path}`) } catch (e) { if (String(e.message) !== '429') throw e; JNEXT = Date.now() + 1500 * (i + 1) }
    }
    throw new Error('429');
  };
  const p = JQ.then(run); JQ = p.catch(() => { }); return p;
}
async function jget(path) { try { return await get('/api/jup?p=' + encodeURIComponent(path), 12000) } catch (e) { return jdirect(path) } }
const ALL = new Map(), GOOD = {}, PREV = new Map();
const S = { new: [], trend: [], aura: [], move: [], top: [] };
let TAB = 'new', PLAT = 'all', SORT = 'def', Q = '', REMOTE = [], SFTOTAL = null, SOL = null;
let WATCH = store.get('aura.watch', []); if (!Array.isArray(WATCH)) WATCH = [];
const SEEN = new Set(), FIRSTS = { j: true, s: true };
function keep(list) {
  return list.filter(ok).map(c => {
    const o = ALL.get(c.mint) || {}; const n = { ...o };
    for (const k in c) if (c[k] !== undefined && c[k] !== null && c[k] !== '') n[k] = c[k];
    if (o.pad === 'stonkfun' || c.pad === 'stonkfun') n.pad = 'stonkfun';
    ALL.set(c.mint, n); return n;
  });
}
const byNew = (a, b) => new Date(b.created || 0) - new Date(a.created || 0);
function addNew(L, src) {
  const fresh = []; L.forEach(c => { if (!SEEN.has(c.mint)) { SEEN.add(c.mint); if (!FIRSTS[src]) fresh.push(c.mint) } });
  const set = new Set([...S.new, ...L.map(c => c.mint)]);
  S.new = [...set].map(m => ALL.get(m)).filter(Boolean).sort(byNew).slice(0, 72).map(c => c.mint);
  feed(L.filter(c => FIRSTS[src] || fresh.includes(c.mint)).sort(byNew).slice(0, 12), !FIRSTS[src]);
  FIRSTS[src] = false;
  if (TAB === 'new') grid(fresh); stats();
}
async function loadJNew() {
  try { const L = keep((await jget('recent')).filter(t => PADS.has(t.launchpad)).map(fromJup)); addNew(L, 'j') }
  catch (e) { emptyIf('new') } finally { LOADED.add('jn'); introProgress() }
}
async function loadSFNew() {
  try { const j = await get(`${SFAPI}?sort=newest&pageSize=30&page=1`); SFTOTAL = j.data?.pagination?.total ?? SFTOTAL; const L = keep((j.data?.tokens || []).map(fromSF)); addNew(L, 's'); sfFeeNote() }
  catch (e) { } finally { LOADED.add('sn'); introProgress() }
}
async function loadTrend() {
  try {
    const L = keep((await jget('toptrending/1h?limit=100')).filter(t => PADS.has(t.launchpad)).map(fromJup));
    S.trend = L.slice(0, 48).map(c => c.mint);
    S.move = [...L].sort((a, b) => Math.abs(b.c5 || 0) - Math.abs(a.c5 || 0)).slice(0, 48).map(c => c.mint);
    strip(); meter(); stats(); topList(); if (['trend', 'move', 'top'].includes(TAB)) grid();
  } catch (e) { if (!S.trend.length) $('#strip').innerHTML = '<div class="empty">Jupiter isn\'t answering right now.</div>' } finally { LOADED.add('tr'); introProgress() }
}
async function loadAura() {
  try {
    const L = keep((await jget('toporganicscore/1h?limit=100')).filter(t => PADS.has(t.launchpad)).map(fromJup));
    S.aura = L.sort((a, b) => (b.aura || 0) - (a.aura || 0)).slice(0, 48).map(c => c.mint); king(); if (TAB === 'aura') grid();
  } catch (e) { if (!S.aura.length) $('#king').innerHTML = '<div class="empty">Jupiter isn\'t answering right now.</div>' } finally { LOADED.add('au'); introProgress() }
}
let SFTOP = [];
async function loadSFTop() { try { const j = await get(`${SFAPI}?sort=marketCap&pageSize=30&page=1`); SFTOP = keep((j.data?.tokens || []).map(fromSF)).map(c => c.mint); topList(); king() } catch (e) { } }
function topList() { const set = new Set([...SFTOP, ...S.trend, ...S.aura]); S.top = [...set].map(m => ALL.get(m)).filter(c => c && c.mcap).sort((a, b) => b.mcap - a.mcap).slice(0, 48).map(c => c.mint); if (TAB === 'top') grid() }
async function enrich(force) {
  const now = Date.now();
  const need = [...ALL.values()].filter(c => c.pad === 'stonkfun' && (!c.jt || now - c.jt > 45000)).sort(byNew).slice(0, 100).map(c => c.mint);
  WATCH.forEach(m => { const c = ALL.get(m); if ((!c || !c.jt || now - c.jt > 45000) && !need.includes(m) && need.length < 100) need.push(m) });
  if (!need.length) return;
  try { const r = await jget('search?query=' + need.join(',')); keep(r.filter(t => need.includes(t.id)).map(fromJup)); need.forEach(m => { const c = ALL.get(m); if (c && !c.jt) c.jt = now }); grid(); if (VIEW === 'watch') wgrid(); king(); stats() } catch (e) { }
}
async function solPrice() { try { const r = await jget('search?query=' + SOLM); SOL = r[0]?.usdPrice || SOL } catch (e) { }  $('#kSol').textContent = SOL ? '$' + SOL.toFixed(2) + ' · live' : 'unavailable'; check() }
function emptyIf(t) { if (!S[t].length && TAB === t) $('#grid').innerHTML = '<div class="empty">The data sources aren\'t answering right now. Try again in a moment.</div>' }

/* =================== images =================== */
// pump.fun's image server has every pump.fun coin (valid sizes: 64, 86, 128, 256, 300, 400)
const wsrv = (u, n = 160) => 'https://wsrv.nl/?url=' + encodeURIComponent(u) + `&w=${n}&h=${n}&fit=cover&default=1`;
const apiImg = c => '/api/img?mint=' + encodeURIComponent(c.mint) + (c.simg || c.jimg ? '&u=' + encodeURIComponent(c.simg || c.jimg) : '') + (c.pad === 'pump.fun' ? '&pad=pump.fun' : '');
const isPump = c => c.pad === 'pump.fun' || /pump$/.test(c.mint || '');
const srcs = (c, sz = 'm') => {
  const L = []; const v = sz === 's' ? '86x86' : sz === 'l' ? '256x256' : '128x128';
  if (isPump(c) && c.mint) L.push(pcdn(c.mint, v));
  if (GOOD[c.mint]) L.push(GOOD[c.mint]);
  if (c.simg) L.push(c.simg); if (c.jimg) L.push(c.jimg);
  const o = c.simg || c.jimg; if (o) L.push(wsrv(o, sz === 'l' ? 300 : 160));
  if (c.mint && c.mint.length >= 32) L.push(apiImg(c));
  return [...new Set(L)];
};
window.__ai = (el, sym) => {
  const n = (el.dataset.alt || '').split('|').filter(Boolean);
  if (n.length) { el.dataset.alt = n.slice(1).join('|'); el.src = n[0]; return }
  el.onerror = null; const api = el.dataset.api; el.src = tile(sym);
  // one more try a bit later: brand-new coins sometimes publish their image a few seconds after launch
  if (api && !el.dataset.retried) { el.dataset.retried = 1; setTimeout(() => { if (!el.isConnected) return; const t = new Image(); t.onload = () => { el.src = t.src }; t.src = api + '&r=' + Date.now() }, 12000) }
};
window.__ok = (el, m) => { if (m && !el.src.startsWith('data:') && !el.src.includes('images.pump.fun')) GOOD[m] = el.src };
const img = (c, cls = '', id = '', sz = 'm') => {
  const L = srcs(c, sz); const sym = esc((c.sym || '').replace(/['\\]/g, '')); const idA = id ? ` id="${id}"` : '';
  return L.length ? `<img${idA} class="${cls}" src="${esc(L[0])}" data-alt="${esc(L.slice(1).join('|'))}" data-api="${c.mint && c.mint.length >= 32 ? esc(apiImg(c)) : ''}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onload="__ok(this,'${esc(c.mint || '')}')" onerror="__ai(this,'${sym}')">` : `<img${idA} class="${cls}" src="${tile(c.sym)}" alt="">`;
};
const padPill = c => c.pad === 'aura' ? '<span class="pp" style="color:var(--a)"><i style="background:var(--a)"></i>aura</span>' : c.pad === 'stonkfun' ? '<span class="pp sf"><i></i>StonkFun</span>' : c.pad === 'pump.fun' ? '<span class="pp pf"><i></i>pump.fun</span>' : '';
const quoteChip = c => c.quote ? `<span class="qt" title="Paired with ${esc(c.quote)} on StonkFun">${c.qlogo ? `<img src="${esc(c.qlogo)}" alt="" onerror="this.remove()">` : '⇄'}${esc(c.quote)}</span>` : '';
const xUrl = c => c.sx || (c.tw && /^https?:/.test(c.tw) ? c.tw : c.tw ? 'https://x.com/' + String(c.tw).replace(/^@/, '') : '');
const tgUrl = c => c.stg || (c.tg && /^https?:/.test(c.tg) ? c.tg : '');
const webUrl = c => c.sweb || '';
const socials = c => { const a = []; const x = xUrl(c), w = webUrl(c), t = tgUrl(c); if (x) a.push(`<span data-href="${esc(x)}" title="X">𝕏</span>`); if (w) a.push(`<span data-href="${esc(w)}" title="Website">↗</span>`); if (t) a.push(`<span data-href="${esc(t)}" title="Telegram">✈</span>`); return a.length ? `<span class="soc">${a.join('')}</span>` : '' };

/* =================== home renders =================== */
function feed(L, hit) {
  const box = $('#feedItems'); if (!box || !L.length) return;
  const html = L.map(c => `<a class="fi${hit ? ' hit' : ''}" href="#/coin/${c.mint}"><span class="pdot ${c.pad === 'stonkfun' ? 'sf' : 'pf'}"></span>${img(c, '', '', 's')}<b>$${esc((c.sym || '').slice(0, 10))}</b><span>${c.pad === 'stonkfun' ? 'StonkFun' : 'pump.fun'} · ${usd(c.mcap)}</span></a>`).join('');
  box.insertAdjacentHTML('afterbegin', html); while (box.children.length > 28) box.lastChild.remove();
}
function king() {
  const c = ALL.get(S.aura[0]); if (!c) return;
  const sfs = [...ALL.values()].filter(x => x.pad === 'stonkfun' && x.mint !== c.mint && x.mcap);
  const k2 = sfs.filter(x => x.aura != null).sort((a, b) => (b.aura || 0) - (a.aura || 0))[0] || sfs.sort((a, b) => b.mcap - a.mcap)[0];
  let h = `<a class="king" href="#/coin/${c.mint}"><span class="shn"></span>${img(c, '', '', 'l')}<div style="min-width:0"><div class="crown">✦ most aura · ${padName(c.pad)}</div><h3>$${esc((c.sym || '').slice(0, 14))}</h3><div class="meta">${esc((c.name || '').slice(0, 40))} · ${usd(c.mcap)} mcap · ${fmtN(c.holders)} holders · ${ago(c.created)} old</div></div><div class="big"><b>+${Math.round(c.aura || 0)} aura</b><span>organic score · 1h <span class="${(c.c1 || 0) < 0 ? 'dn' : 'up'}">${pct(c.c1)}</span></span></div></a>`;
  if (k2) h += `<a class="king k2" href="#/coin/${k2.mint}"><span class="shn"></span>${img(k2, '', '', 'l')}<div style="min-width:0"><div class="crown">✦ top on StonkFun</div><h3>$${esc((k2.sym || '').slice(0, 14))}</h3><div class="meta">${esc((k2.name || '').slice(0, 30))} ${k2.quote ? '· paired with ' + esc(k2.quote) : ''}</div></div><div class="big"><b>${usd(k2.mcap)}</b><span>${k2.aura != null ? '+' + Math.round(k2.aura) + ' aura · ' : ''}${fmtN(k2.holders)} holders</span></div></a>`;
  $('#king').innerHTML = h;
}
let STRIPKEY = '';
function strip() {
  const L = S.trend.slice(0, 18).map(m => ALL.get(m)).filter(Boolean); if (!L.length) return;
  const key = L.map(c => c.mint).join(); if (key === STRIPKEY) { $$('#strip .tc').forEach(el => { const c = ALL.get(el.dataset.m); if (!c) return; const g = el.querySelector('.chg'); g.textContent = pct(c.c1); g.className = 'chg ' + ((c.c1 || 0) < 0 ? 'dn' : 'up'); el.querySelector('.bd span').textContent = `${usd(c.mcap)} · vol ${usd(c.v1)} / 1h` }); return }
  STRIPKEY = key;
  const one = L.map(c => `<a class="tc" href="#/coin/${c.mint}" data-m="${c.mint}"><div class="im">${img(c, '', '', 'l')}${padPill(c)}<span class="chg ${(c.c1 || 0) < 0 ? 'dn' : 'up'}">${pct(c.c1)}</span></div><div class="bd"><b>$${esc((c.sym || '').slice(0, 14))}</b><span>${usd(c.mcap)} · vol ${usd(c.v1)} / 1h</span></div></a>`).join('');
  $('#strip').innerHTML = `<div class="mq-in" style="--dur:${L.length * 4.5}s">${one}${one}</div>`;
}
let RATE = 0, TICK = 0, TLAST = performance.now();
function meter() {
  const L = [...new Set([...S.trend, ...S.new])].map(m => ALL.get(m)).filter(c => c && c.pad === 'pump.fun');
  const v = L.reduce((a, c) => a + (c.v1 || 0), 0); if (!v) return;
  countTo($('#mP'), v * PUMP, usd); countTo($('#mA'), v * AURA, usd);
  $('#mAb').style.width = (AURA / PUMP * 100) + '%';
  RATE = v * PUMP / 3600;
  $('#mNote').textContent = `${L.length} live pump.fun coins, ${usd(v)} traded in the last hour. Estimated at the bonding-curve rate from Jupiter's volume.`;
}
setInterval(() => { const n = performance.now(); TICK += RATE * (n - TLAST) / 1000; TLAST = n; const el = $('#mT'); if (el) el.textContent = '$' + TICK.toFixed(2) }, 120);
function stats() {
  const all = [...ALL.values()]; const pf = all.filter(c => c.pad === 'pump.fun').length, sf = all.filter(c => c.pad === 'stonkfun').length;
  const n10 = all.filter(c => c.created && Date.now() - new Date(c.created) < 600000).length;
  const vol = all.reduce((a, c) => a + (c.v1 || 0), 0);
  $('#nAll').textContent = all.length; $('#nPf').textContent = pf; $('#nSf').textContent = sf; $('#nAu').textContent = all.filter(c => c.pad === 'aura').length;
  countTo($('#hT'), all.length, v => Math.round(v).toLocaleString('en-US')); countTo($('#hN'), n10, v => Math.round(v)); countTo($('#hV'), vol, usd);

}
function sfFeeNote() {
  const f = [...ALL.values()].filter(c => c.pad === 'stonkfun' && c.tfee != null).map(c => c.tfee); if (!f.length) return;
  const lo = Math.min(...f) / 100, hi = Math.max(...f) / 100;
  $('#sfFeeNote').textContent = `StonkFun coins set their own transfer fee. On the ${f.length} StonkFun coins on the board right now it runs from ${lo}% to ${hi}%, per StonkFun's API.`;
}

/* =================== board =================== */
function card(c, fresh) {
  const chg = c.c5 ?? c.c1; const sf = c.pad === 'stonkfun';
  const pv = PREV.get(c.mint); const fl = pv && c.mcap && Math.abs(c.mcap - pv) / pv > .003 ? (c.mcap > pv ? 'fu' : 'fd') : '';
  const prog = sf && c.prog != null ? Math.max(2, Math.min(100, c.prog * 100)) : Math.max(3, Math.min(100, (c.mcap || 0) / 70000 * 100));
  const bs = (c.b1 || c.s1) ? (c.b1 || 0) / ((c.b1 || 0) + (c.s1 || 0)) * 100 : null;
  const W = WATCH.includes(c.mint);
  const grad = c.gpool || c.status === 'graduated';
  return `<a class="cc${fresh ? ' fresh' : ''}" href="#/coin/${c.mint}" data-m="${c.mint}">
    <span class="star${W ? ' on' : ''}" role="button" data-star="${c.mint}" title="Watch">${W ? '★' : '☆'}</span>
    <div class="im">${img(c)}${padPill(c)}</div><div style="min-width:0">
    <div class="nm"><b>${esc((c.name || '').slice(0, 26))}</b><span>$${esc((c.sym || '').slice(0, 12))}</span></div>
    <div class="sub">${c.dev ? 'by ' + esc(short(c.dev)) + ' · ' : ''}${ago(c.created)} ago ${sf ? quoteChip(c) : ''}${grad ? '<span class="gd">graduated</span>' : ''}</div>
    <div class="mc"><span>mcap <b class="${fl}">${usd(c.mcap)}</b></span><span class="${(chg || 0) < 0 ? 'dn' : 'up'} num">${pct(chg)}</span></div>
    <div class="bar${sf ? ' sfb' : ''}" title="${sf && c.prog != null ? 'StonkFun curve ' + Math.round(prog) + '%' : 'market cap'}"><i style="width:${prog}%"></i></div>
    ${bs != null ? `<div class="bs" title="buys vs sells, last hour"><i style="width:${bs}%;background:var(--up)"></i><i style="width:${100 - bs}%;background:var(--dn)"></i></div>` : ''}
    <div class="ft"><span style="display:flex;gap:6px;align-items:center">${c.aura != null ? `<span class="badge">+${Math.round(c.aura)} aura</span>` : sf && c.tfee != null ? `<span class="badge" title="StonkFun transfer fee">${c.tfee / 100}% fee</span>` : ''}${socials(c)}</span><span>${c.holders != null ? fmtN(c.holders) + ' holders · ' : ''}vol ${c.v1 != null ? usd(c.v1) : usd(c.v24) + ' 24h'}</span></div></div></a>`;
}
function list(tab) {
  let L;
  if (Q) { const q = Q.toLowerCase(); const loc = [...ALL.values()].filter(c => (c.sym || '').toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q) || c.mint === Q); const set = new Set(loc.map(c => c.mint)); L = [...loc, ...REMOTE.filter(m => !set.has(m)).map(m => ALL.get(m)).filter(Boolean)] }
  else if (tab === 'watch') L = WATCH.map(m => ALL.get(m) || { mint: m, sym: '…', name: 'Loading' });
  else L = (S[tab] || []).map(m => ALL.get(m)).filter(Boolean);
  if (PLAT !== 'all') L = L.filter(c => c.pad === PLAT);
  if (SORT !== 'def') L = [...L].sort((a, b) => SORT === 'age' ? byNew(a, b) : (b[SORT] ?? -1e18) - (a[SORT] ?? -1e18));
  return L;
}
function grid(fresh = []) {
  const L = list(TAB);
  const msg = PLAT === 'aura' && !Q ? 'No aura coins yet. Launches open with $AURA, and every coin launched on aura shows up here live.' : Q ? 'No coin matches that yet. Paste a full address to open any coin.' : TAB === 'watch' ? 'Nothing saved yet. Tap ☆ on any coin to watch it.' : LOADED.size < 2 ? 'Reading pump.fun and StonkFun…' : 'No coins here right now.';
  $('#grid').innerHTML = L.length ? L.map(c => card(c, fresh.includes(c.mint))).join('') : `<div class="empty">${msg}</div>`;
  $('#bCount').textContent = `${L.length} coins · ${PLAT === 'all' ? 'pump.fun + StonkFun' : padName(PLAT)}`;
  L.forEach(c => c.mcap && PREV.set(c.mint, c.mcap));
}
function wgrid() { const L = WATCH.map(m => ALL.get(m) || { mint: m, sym: '…', name: 'Loading' }); $('#wgrid').innerHTML = L.length ? L.map(c => card(c)).join('') : '<div class="empty">Nothing saved yet. Tap ☆ on any coin to watch it.</div>' }
function setTab(t) { TAB = t; $$('#tabs button').forEach(x => x.classList.toggle('on', x.dataset.t === t)); grid() }
function setPlat(p) { PLAT = p; $$('#plat button').forEach(x => x.classList.toggle('on', x.dataset.p === p)); $$('[data-plat]').forEach(x => x.classList.toggle('on', x.dataset.plat === p)); grid() }
$('#tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setTab(b.dataset.t) });
$('#plat').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setPlat(b.dataset.p) });
$('#sort').addEventListener('change', e => { SORT = e.target.value; grid() });
let QT;
$('#q').addEventListener('input', e => {
  Q = e.target.value.trim(); REMOTE = [];
  if (VIEW !== 'home') location.hash = '#/board'; else grid();
  clearTimeout(QT); if (Q.length < 2) return;
  QT = setTimeout(async () => {
    const q = Q; const [a, b] = await Promise.allSettled([jget('search?query=' + encodeURIComponent(q)), get(`${SFAPI}?q=${encodeURIComponent(q)}&pageSize=30&page=1`)]);
    if (q !== Q) return;
    const L = [...(a.status === 'fulfilled' ? keep(a.value.filter(t => PADS.has(t.launchpad)).map(fromJup)) : []), ...(b.status === 'fulfilled' ? keep((b.value.data?.tokens || []).map(fromSF)) : [])];
    REMOTE = [...new Set(L.map(c => c.mint))]; grid();
  }, 400);
});
$('#q').addEventListener('keydown', e => { if (e.key === 'Enter' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(Q)) location.hash = '#/coin/' + Q });
addEventListener('keydown', e => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '') && INTRO.done) { e.preventDefault(); $('#q').focus() } });

/* watchlist + delegated clicks */
function toggleWatch(m) {
  const i = WATCH.indexOf(m); if (i >= 0) WATCH.splice(i, 1); else WATCH.unshift(m); store.set('aura.watch', WATCH);
  const on = WATCH.includes(m);
  $$(`[data-star="${m}"]`).forEach(s => { s.classList.toggle('on', on); s.textContent = on ? '★' : '☆' });
  if (CUR === m) $('#cStar').textContent = on ? '★ Watching' : '☆ Watch';
  $('#nWatch').textContent = WATCH.length; toast(on ? 'Added to your watchlist' : 'Removed from your watchlist');
  if (TAB === 'watch') grid(); if (VIEW === 'watch') wgrid(); if (on) enrich();
}
document.addEventListener('click', e => {
  const s = e.target.closest('[data-star]'); if (s) { e.preventDefault(); e.stopPropagation(); toggleWatch(s.dataset.star); return }
  const h = e.target.closest('[data-href]'); if (h) { e.preventDefault(); e.stopPropagation(); window.open(h.dataset.href, '_blank', 'noopener'); return }
  const p = e.target.closest('[data-plat]'); if (p) { setPlat(p.dataset.plat); location.hash = '#/board'; if (VIEW === 'home') goMarket(); return }
  if (e.target.closest('[data-rand]')) { const L = [...ALL.values()].filter(c => c.mcap > 0 && (PLAT === 'all' || c.pad === PLAT)); if (L.length) location.hash = '#/coin/' + L[Math.floor(Math.random() * L.length)].mint; else toast('Still reading coins…'); return }
  if (e.target.closest('[data-connect]')) connect();
}, true);

/* card tilt + glow */
if (matchMedia('(pointer:fine)').matches) {
  document.addEventListener('pointermove', e => { const c = e.target.closest?.('.cc'); if (!c) return; const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; c.style.setProperty('--ry', ((x - .5) * 6).toFixed(2) + 'deg'); c.style.setProperty('--rx', ((.5 - y) * 6).toFixed(2) + 'deg'); c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%') });
  document.addEventListener('pointerout', e => { const c = e.target.closest?.('.cc'); if (c && !c.contains(e.relatedTarget)) { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg') } });
}

/* =================== coin page =================== */
let JUP_READY = null, CUR = null;
function loadJupPlugin() {
  if (JUP_READY) return JUP_READY;
  JUP_READY = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://plugin.jup.ag/plugin-v1.js'; s.async = true; s.onload = () => res(); s.onerror = () => { JUP_READY = null; rej(new Error('load')) }; document.head.appendChild(s); setTimeout(() => rej(new Error('timeout')), 12000) });
  return JUP_READY;
}
const st = (k, v, cls = '') => `<div class="st"><span>${k}</span><b class="${cls}">${esc(v)}</b></div>`;
const kv = (k, v, cls = '') => v == null || v === '' ? '' : `<div class="kv"><span>${k}</span><b class="${cls}">${v}</b></div>`;
function renderCoin(c) {
  const mint = c.mint, sf = c.pad === 'stonkfun';
  $('#cImg').outerHTML = img(c, '', 'cImg', 'l');
  $('#cName').textContent = '$' + (c.sym || '?'); $('#cPad').innerHTML = padPill(c); $('#cQuote').innerHTML = quoteChip(c);
  $('#cSub').textContent = c.name || '';
  $('#cMint').innerHTML = `${short(mint)} <span style="color:var(--a)">copy address</span>`; $('#cMint').onclick = () => { navigator.clipboard?.writeText(mint).then(() => toast('Address copied'), () => toast('Copy failed')) };
  $('#cAura').textContent = c.aura != null ? `+${Math.round(c.aura)} aura${c.auraL ? ' · ' + c.auraL : ''}` : 'aura —';
  $('#cStar').textContent = WATCH.includes(mint) ? '★ Watching' : '☆ Watch'; $('#cStar').onclick = () => toggleWatch(mint);
  $('#cShare').onclick = () => window.open('https://x.com/intent/post?text=' + encodeURIComponent(`$${c.sym} · ${usd(c.mcap)} mcap · ${pct(c.c1)} in the last hour\n\nFound on aura, where every trade costs less.\n${location.origin}/#/coin/${mint}`), '_blank', 'noopener');
  const L = [[sf ? 'StonkFun' : 'pump.fun', sf ? `${SF}/token/${mint}` : `https://pump.fun/coin/${mint}`], ['DEX Screener', `https://dexscreener.com/solana/${mint}`], ['Solscan', `https://solscan.io/token/${mint}`], ['Jupiter', `https://jup.ag/swap/SOL-${mint}`]];
  if (xUrl(c)) L.push(['𝕏', xUrl(c)]); if (webUrl(c)) L.push(['Website', webUrl(c)]); if (tgUrl(c)) L.push(['Telegram', tgUrl(c)]);
  $('#cLinks').innerHTML = L.map(([k, u]) => `<a class="btn gh xs" href="${esc(u)}" target="_blank" rel="noopener">${esc(k)} ↗</a>`).join('');
  $('#cStats').innerHTML = [st('Price', price(c.price)), st('Market cap', usd(c.mcap)), st('Liquidity', usd(c.liq)), st('Holders', fmtN(c.holders) + (c.hch != null ? ' ' + pct(c.hch) : '')),
    st('5m change', pct(c.c5), (c.c5 || 0) < 0 ? 'dn' : 'up'), st('1h change', pct(c.c1), (c.c1 || 0) < 0 ? 'dn' : 'up'), st('24h change', pct(c.c24), (c.c24 || 0) < 0 ? 'dn' : 'up'), st('Age', ago(c.created)),
    st('Volume 1h', usd(c.v1)), st('Volume 24h', usd(c.v24)), st('Trades 1h', c.b1 != null ? fmtN((c.b1 || 0) + (c.s1 || 0)) : '—'), st('Traders 1h', fmtN(c.tr1))].join('');
  if (c.b1 != null || c.s1 != null) { const b = c.bv1 || 0, s = c.sv1 || 0, t = b + s || 1; $('#cPress').innerHTML = `<div class="hd"><span class="up">Buys ${fmtN(c.b1)} · ${usd(b)}</span><span>Last hour</span><span class="dn">${usd(s)} · ${fmtN(c.s1)} Sells</span></div><div class="tr"><i style="width:${b / t * 100}%;background:var(--up)"></i><i style="width:${s / t * 100}%;background:var(--dn)"></i></div>` } else $('#cPress').innerHTML = '';
  const rate = sf ? (c.tfee != null ? c.tfee / 10000 : null) : PUMP; const v = c.v1 || 0;
  $('#cVol').textContent = usd(v); $('#cFpL').textContent = sf ? (rate != null ? `At its ${c.tfee / 100}% transfer fee` : 'StonkFun fee') : "At pump.fun's 1.25%";
  $('#cFp').textContent = rate != null ? usd(v * rate) : 'not reported'; $('#cFa').textContent = usd(v * AURA);
  if (rate != null && rate > AURA) { countTo($('#cSave'), v * (rate - AURA), usd); $('#cSaveNote').textContent = "what this coin's traders would have kept on aura" + (sf ? ' (StonkFun fee from its API)' : '') } else { $('#cSave').textContent = '—'; $('#cSave')._v = 0; $('#cSaveNote').textContent = sf ? "StonkFun didn't report a fee for this coin" : '' }
  $('#cMore').innerHTML = `<h4>Details</h4>` + [kv('Launchpad', padName(c.pad)), sf ? kv('Paired with', c.quote ? esc(c.quote) + (c.qcat ? ' · ' + esc(c.qcat) : '') : null) : '', sf && c.prog != null ? kv('Curve', (c.prog * 100).toFixed(1) + '%') : '', sf && c.tfee != null ? kv('Transfer fee', c.tfee / 100 + '%') : '', c.peak ? kv('Peak market cap', usd(c.peak)) : '',
    kv('Status', c.gpool || c.status === 'graduated' ? '<span class="up">graduated</span>' : 'on the curve'), c.top10 != null ? kv('Top 10 holders', (+c.top10).toFixed(1) + '%') : '', c.mintOff != null ? kv('Mint authority', c.mintOff ? '<span class="up">off</span>' : '<span class="dn">on</span>') : '', c.freezeOff != null ? kv('Freeze authority', c.freezeOff ? '<span class="up">off</span>' : '<span class="dn">on</span>') : '',
    c.dev ? kv('Dev', `<a href="https://solscan.io/account/${esc(c.dev)}" target="_blank" rel="noopener" style="color:var(--a)">${esc(short(c.dev))} ↗</a>`) : '', kv('Address', `<a href="https://solscan.io/token/${esc(mint)}" target="_blank" rel="noopener" style="color:var(--a)">${esc(short(mint))} ↗</a>`)].join('');
}
async function coin(mint) {
  CUR = mint;
  let c = ALL.get(mint);
  if (c) renderCoin(c); else { $('#cName').textContent = 'Loading…'; $('#cSub').textContent = ''; $('#cStats').innerHTML = ''; $('#cMore').innerHTML = ''; $('#cPress').innerHTML = ''; $('#cLinks').innerHTML = ''; $('#cPad').innerHTML = ''; $('#cQuote').innerHTML = '' }
  $('#chart').innerHTML = `<iframe src="https://dexscreener.com/solana/${encodeURIComponent(mint)}?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartTheme=dark&theme=dark&chartStyle=1&chartType=usd&interval=5" title="chart" loading="lazy"></iframe>`;
  const jt = $('#jup'); jt.style.minHeight = ''; jt.innerHTML = '<div class="skel" style="height:420px"></div>'; $('#jupNote').textContent = 'Swaps run through Jupiter. You sign in your own wallet.';
  loadJupPlugin().then(() => { if (CUR !== mint) return; jt.innerHTML = ''; window.Jupiter.init({ displayMode: 'integrated', integratedTargetId: 'jup', formProps: { initialInputMint: SOLM, initialOutputMint: mint } }) })
    .catch(() => { if (CUR !== mint) return; jt.style.minHeight = '0'; jt.innerHTML = `<a class="btn pri" style="width:100%;height:48px" href="https://jup.ag/swap/SOL-${encodeURIComponent(mint)}" target="_blank" rel="noopener">Trade on Jupiter ↗</a>`; $('#jupNote').textContent = 'Opens Jupiter in a new tab. You sign in your own wallet.' });
  try { const r = await jget('search?query=' + mint); const t = r.find(x => x.id === mint); if (t) c = keep([fromJup(t)])[0] } catch (e) { }
  if (c && c.pad === 'stonkfun' && c.quote == null) { try { const j = await get(`${SFAPI}?q=${mint}&pageSize=5&page=1`); const t = (j.data?.tokens || []).find(x => x.mint === mint); if (t) c = keep([fromSF(t)])[0] } catch (e) { } }
  if (CUR !== mint) return;
  renderCoin(c || { mint, sym: '?', name: 'Coin not found on Jupiter yet' });
}

/* =================== launch =================== */
let LIMG = '';
function lprev() {
  const c = { mint: '', sym: ($('#lTk').value || 'TICKER').toUpperCase(), name: $('#lName').value || 'Your coin', mcap: 4200, c5: 0, aura: 0, holders: 1, v1: 0, created: new Date().toISOString(), dev: (window.__wallet || '') };
  $('#lPrev').innerHTML = card(c).replace(/<span class="star[^>]*>.*?<\/span>/, '').replace(/<div class="im">.*?<\/div>/, `<div class="im"><img src="${LIMG || tile(c.sym)}" alt=""><span class="pp" style="color:var(--a)"><i style="background:var(--a)"></i>aura</span></div>`).replace(/href="[^"]*"/, '');
}
let TK;
function tkCheck() {
  const tk = $('#lTk').value.trim().toUpperCase().replace(/^\$/, ''); const out = $('#tkCheck'); clearTimeout(TK);
  if (tk.length < 2) { out.innerHTML = ''; return }
  out.innerHTML = `Checking <b>$${esc(tk)}</b> on pump.fun and StonkFun…`;
  TK = setTimeout(async () => {
    const [a, b] = await Promise.allSettled([jget('search?query=' + encodeURIComponent(tk)), get(`${SFAPI}?q=${encodeURIComponent(tk)}&pageSize=100&page=1`)]);
    if ($('#lTk').value.trim().toUpperCase().replace(/^\$/, '') !== tk) return;
    const pf = a.status === 'fulfilled' ? a.value.filter(t => t.launchpad === 'pump.fun' && String(t.symbol).toUpperCase() === tk).length : null;
    const sf = b.status === 'fulfilled' ? (b.value.data?.tokens || []).filter(t => String(t.symbol).toUpperCase() === tk).length : null;
    const part = (n, w) => n == null ? `${w} didn't answer` : n ? `<b>${n}</b> on ${w}` : `none on ${w}`;
    out.innerHTML = (pf || sf) ? `<b>$${esc(tk)}</b> is taken: ${part(pf, 'pump.fun')}${pf != null && pf >= 20 ? '+' : ''}, ${part(sf, 'StonkFun')}. On aura, the first one keeps the name on the board.` : `<b style="color:var(--up)">$${esc(tk)} looks clean.</b> ${part(pf, 'pump.fun')} and ${part(sf, 'StonkFun')} with this exact ticker.`;
  }, 500);
}
['lName', 'lTk', 'lDesc'].forEach(id => $('#' + id).addEventListener('input', lprev));
$('#lTk').addEventListener('input', tkCheck);
$('#lImg').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; LIMG = URL.createObjectURL(f); $('#lDrop').innerHTML = `<img src="${LIMG}" alt="">`; lprev() });
$('#lDrop').addEventListener('dragover', e => { e.preventDefault(); $('#lDrop').style.borderColor = 'var(--a)' });
$('#lDrop').addEventListener('drop', e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) { LIMG = URL.createObjectURL(f); $('#lDrop').innerHTML = `<img src="${LIMG}" alt="">`; lprev() } });
/* fee curve: 99% in block 0, down to 0.5% */
let CURVE = false;
function curve() {
  if (CURVE) return; CURVE = true;
  const cv = $('#curve'), ctx = cv.getContext('2d'); const t0 = performance.now();
  const fee = x => .5 + 98.5 * Math.exp(-x * 5.2);
  function draw(n) {
    if (VIEW !== 'launch') { CURVE = false; return }
    const D = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight; if (cv.width !== W * D) { cv.width = W * D; cv.height = H * D } ctx.setTransform(D, 0, 0, D, 0, 0); ctx.clearRect(0, 0, W, H);
    const pl = 8, pr = 8, pt = 14, pb = 18, w = W - pl - pr, h = H - pt - pb;
    const X = x => pl + x * w, Y = f => pt + h - (f / 100) * h;
    ctx.strokeStyle = '#25252e'; ctx.lineWidth = 1; [0, .5, 1].forEach(g => { ctx.beginPath(); ctx.moveTo(pl, pt + h * g); ctx.lineTo(pl + w, pt + h * g); ctx.stroke() });
    const k = Math.min(1, (n - t0) / 1400);
    const gr = ctx.createLinearGradient(0, pt, 0, pt + h); gr.addColorStop(0, 'rgba(255,107,138,.35)'); gr.addColorStop(1, 'rgba(185,164,255,.02)');
    ctx.beginPath(); ctx.moveTo(X(0), Y(0)); for (let i = 0; i <= 100 * k; i++) { const x = i / 100; ctx.lineTo(X(x), Y(fee(x))) } ctx.lineTo(X(k), Y(0)); ctx.closePath(); ctx.fillStyle = gr; ctx.fill();
    ctx.beginPath(); for (let i = 0; i <= 100 * k; i++) { const x = i / 100; i ? ctx.lineTo(X(x), Y(fee(x))) : ctx.moveTo(X(x), Y(fee(x))) } ctx.strokeStyle = '#b9a4ff'; ctx.lineWidth = 2; ctx.stroke();
    const p = ((n - t0) / 3200) % 1, px = X(p), py = Y(fee(p));
    if (k >= 1) { ctx.beginPath(); ctx.arc(px, py, 4, 0, 7); ctx.fillStyle = '#fff'; ctx.shadowColor = '#b9a4ff'; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0; ctx.font = '700 11px Inter'; ctx.fillStyle = '#d6c9ff'; ctx.textAlign = px > W - 70 ? 'right' : 'left'; ctx.fillText(fee(p).toFixed(1) + '%', px + (px > W - 70 ? -8 : 8), Math.max(12, py - 6)) }
    ctx.font = '600 10.5px Inter'; ctx.fillStyle = '#686578'; ctx.textAlign = 'left'; ctx.fillText('block 0 · 99%', pl, H - 4); ctx.textAlign = 'right'; ctx.fillText('seconds later · 0.5%', W - pr, H - 4);
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

/* =================== aura check =================== */
function check() {
  const s = +$('#kSize').value, n = +$('#kN').value; $('#kSizeV').textContent = s.toFixed(1) + ' SOL'; $('#kNV').textContent = n;
  const vol = s * n * 365, p = vol * PUMP, a = vol * AURA, save = p - a;
  const f = x => SOL ? usd(x * SOL) : x.toFixed(1) + ' SOL';
  const conv = x => SOL ? x * SOL : x;
  countTo($('#kOut'), conv(save), v => SOL ? usd(v) : v.toFixed(1) + ' SOL', 500); $('#kOutSol').textContent = `${save.toFixed(1)} SOL on ${Math.round(vol).toLocaleString('en-US')} SOL of volume`;
  countTo($('#kP'), conv(p), v => SOL ? usd(v) : v.toFixed(1) + ' SOL', 500); countTo($('#kA'), conv(a), v => SOL ? usd(v) : v.toFixed(1) + ' SOL', 500);
  $('#kShare').onclick = () => window.open('https://x.com/intent/post?text=' + encodeURIComponent(`pump.fun's 1.25% fee costs me ${f(p)} a year. On aura it'd be ${f(a)}.\n\nEvery trade on aura costs less.`), '_blank', 'noopener');
}
['kSize', 'kN'].forEach(id => $('#' + id).addEventListener('input', check));
$('#presets').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $('#kSize').value = b.dataset.s; $('#kN').value = b.dataset.n; check() });

/* =================== wallet =================== */
async function connect() {
  const p = window.phantom?.solana || window.solflare || window.backpack || window.solana;
  if (!p) { window.open('https://phantom.com/download', '_blank', 'noopener'); return }
  try { const r = await p.connect(); const k = (r?.publicKey || p.publicKey)?.toString(); if (k) { window.__wallet = k; $$('[data-connect]').forEach(b => b.textContent = short(k)); toast('Wallet connected'); lprev() } } catch (e) { toast('Connection cancelled') }
}

/* =================== router =================== */
let VIEW = 'home';
function goMarket() { requestAnimationFrame(() => $('#market').scrollIntoView({ behavior: 'smooth', block: 'start' })) }
function route() {
  const h = location.hash.replace(/^#/, '') || '/'; const [, r, arg] = h.split('/');
  const view = r === 'coin' ? 'coin' : r === 'how' ? 'faq' : ['launch', 'check', 'faq', 'watch'].includes(r) ? r : 'home';
  const prevView = VIEW; VIEW = view;
  $$('.view').forEach(v => v.classList.toggle('on', v.id === 'v-' + view));
  const nav = r === 'board' || r === 'trending' ? r : view;
  $$('#nav a,#mob a').forEach(a => a.classList.toggle('on', a.dataset.r === nav));
  if (view !== 'coin') CUR = null;
  if (view === 'coin' && arg) coin(arg);
  if (view === 'launch') { lprev(); curve() }
  if (view === 'check') { if (SOL === null) solPrice(); else check() }
  if (view === 'watch') { wgrid(); enrich() }
  if (r === 'trending') setTab('trend');
  if (r === 'board' || r === 'trending') { grid(); if (prevView !== 'home') scrollTo(0, 0); goMarket() }
  else scrollTo({ top: 0, behavior: 'auto' });
  if (view === 'home') revealAll();
}
addEventListener('hashchange', route);

/* reveal on scroll */
let IO = null;
function revealAll() { if (!('IntersectionObserver' in window)) { $$('.rv').forEach(e => e.classList.add('rv-in')); return } if (!IO) IO = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('rv-in'); IO.unobserve(x.target) } }), { rootMargin: '0px 0px -40px 0px' }); $$('.rv:not(.rv-in)').forEach(e => IO.observe(e)) }

/* hero pixel field */
(function field() {
  const cv = $('#hf'), hero = $('.hero'); if (!cv || !hero) return;
  const ctx = cv.getContext('2d'); let W = 0, H = 0, D = 1, vis = true, mx = -1e3, my = -1e3;
  const P = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), s: 2 + Math.random() * 3.5, v: .02 + Math.random() * .06, ph: Math.random() * 6.28, dx: 0, dy: 0 }));
  const size = () => { D = Math.min(2, devicePixelRatio || 1); W = hero.clientWidth; H = hero.clientHeight; cv.width = W * D; cv.height = H * D; ctx.setTransform(D, 0, 0, D, 0, 0) };
  size(); addEventListener('resize', size);
  if ('IntersectionObserver' in window) new IntersectionObserver(e => vis = e[0].isIntersecting).observe(hero);
  hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; const x = mx / r.width - .5, y = my / r.height - .5; hero.querySelectorAll('.vx').forEach((v, i) => v.style.translate = `${x * (12 + i * 6)}px ${y * (10 + i * 5)}px`) });
  hero.addEventListener('pointerleave', () => { mx = my = -1e3 });
  let last = performance.now();
  function f(n) {
    const dt = Math.min(50, n - last) / 16; last = n;
    if (vis && !document.hidden && VIEW === 'home' && W) {
      if (hero.clientWidth !== W || hero.clientHeight !== H) size();
      ctx.clearRect(0, 0, W, H);
      for (const p of P) {
        p.y -= p.v * dt / 100 * 1.4; if (p.y < -.05) { p.y = 1.05; p.x = Math.random() }
        let x = p.x * W + p.dx, y = p.y * H + p.dy; const ddx = x - mx, ddy = y - my, d2 = ddx * ddx + ddy * ddy;
        if (d2 < 9000) { const k = (1 - d2 / 9000) * 2.2; p.dx += ddx / Math.sqrt(d2 + 1) * k; p.dy += ddy / Math.sqrt(d2 + 1) * k }
        p.dx *= .94; p.dy *= .94;
        const a = .15 + .35 * (.5 + .5 * Math.sin(n / 600 + p.ph));
        ctx.fillStyle = `rgba(185,164,255,${a})`; ctx.fillRect(Math.round(x), Math.round(y), p.s, p.s);
      }
    }
    requestAnimationFrame(f);
  }
  requestAnimationFrame(f);
})();

/* =================== faq =================== */
(function faq() {
  const list = $('#faqList'); if (!list) return;
  const D = $$('#faqList details'); D.forEach(d => { d._q = d.querySelector('summary').innerHTML; d._t = d.textContent.toLowerCase() });
  let cat = 'all', q = '';
  const rx = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function apply() {
    let shown = 0;
    $$('#faqList .fqg').forEach(g => {
      const okC = cat === 'all' || g.dataset.c === cat; let n = 0;
      g.querySelectorAll('details').forEach(d => {
        const m = okC && (!q || d._t.includes(q)); d.style.display = m ? '' : 'none'; if (m) n++;
        d.querySelector('summary').innerHTML = q ? d._q.replace(new RegExp('(' + rx(q) + ')', 'gi'), '<mark>$1</mark>') : d._q;
        if (q && m) d.open = true;
      });
      g.style.display = n ? '' : 'none'; shown += n;
    });
    $('#fqNone').style.display = shown ? 'none' : ''; syncAll();
  }
  function syncAll() { const vis = D.filter(d => d.style.display !== 'none'); $('#fqAll').textContent = vis.length && vis.every(d => d.open) ? 'Collapse all' : 'Expand all' }
  $('#fqCats').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; cat = b.dataset.c; $$('#fqCats button').forEach(x => x.classList.toggle('on', x === b)); apply() });
  $('#fq').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); apply() });
  $('#fqAll').addEventListener('click', () => { const vis = D.filter(d => d.style.display !== 'none'); const open = !vis.every(d => d.open); vis.forEach(d => d.open = open); syncAll() });
  D.forEach(d => d.addEventListener('toggle', syncAll));
})();

/* =================== boot =================== */
$('#nWatch').textContent = WATCH.length;
$$('aside .nav a, aside .slab, aside .sbtn, aside .ls').forEach((e, i) => e.style.setProperty('--d', i));
route(); revealAll();
loadJNew(); loadSFNew(); setTimeout(loadTrend, 250); setTimeout(loadAura, 500); loadSFTop();
setTimeout(enrich, 3000);
const every = (fn, ms) => setInterval(() => { if (!document.hidden) fn() }, ms);
every(loadJNew, 8000); every(loadSFNew, 10000); every(loadTrend, 30000); every(loadAura, 45000); every(loadSFTop, 60000); every(enrich, 40000); every(() => { if (VIEW === 'check') solPrice() }, 60000);
every(stats, 15000);
})();
