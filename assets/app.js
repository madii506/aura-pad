(() => {
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const JUP = 'https://lite-api.jup.ag/tokens/v2';
const PUMP = .0125, AURA = .005;
const BAD = /fuck|shit|cunt|n[i1]gg|fag|retard|porn|nazi|hitler|pedo|rape|kys|\bsex\b|cum\b/i;
const usd = v => v == null || !isFinite(v) ? '—' : v >= 1e9 ? '$' + (v / 1e9).toFixed(2) + 'B' : v >= 1e6 ? '$' + (v / 1e6).toFixed(2) + 'M' : v >= 1e3 ? '$' + (v / 1e3).toFixed(1) + 'K' : v >= 1 ? '$' + v.toFixed(0) : '$' + v.toFixed(2);
const pct = v => v == null || !isFinite(v) ? '—' : (v > 0 ? '+' : '') + (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1)) + '%';
const ago = t => { const s = Math.max(0, (Date.now() - new Date(t)) / 1000); return s < 60 ? Math.round(s) + 's' : s < 3600 ? Math.round(s / 60) + 'm' : s < 86400 ? Math.round(s / 3600) + 'h' : Math.round(s / 86400) + 'd' };
const short = a => a ? a.slice(0, 4) + '…' + a.slice(-4) : '';
const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 1800) };
const tile = s => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#1c1c23"/><text x="32" y="41" text-anchor="middle" font-family="Arial" font-weight="700" font-size="24" fill="#b9a4ff">${String(s || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || '?'}</text></svg>`);

/* images: pump.fun's image server first (works for every pump.fun coin), then the coin's own icon, then a proxy, then a tile */
const srcs = c => [c.mint && /pump$/.test(c.mint) || c.pad === 'pump.fun' ? 'https://images.pump.fun/coin-image/' + c.mint + '?variant=200x200' : '', c.img, c.img ? 'https://wsrv.nl/?url=' + encodeURIComponent(c.img) + '&w=200&h=200&fit=cover' : ''].filter(Boolean);
window.__ai = (el, sym) => { const n = (el.dataset.alt || '').split('|').filter(Boolean); if (n.length) { el.dataset.alt = n.slice(1).join('|'); el.src = n[0] } else { el.onerror = null; el.src = tile(sym) } };
const img = (c, cls = '') => { const L = srcs(c); return L.length ? `<img class="${cls}" src="${esc(L[0])}" data-alt="${esc(L.slice(1).join('|'))}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="__ai(this,'${esc((c.sym || '').replace(/'/g, ''))}')">` : `<img class="${cls}" src="${tile(c.sym)}" alt="">` };

/* ---------- data ---------- */
const fromJup = t => ({ mint: t.id, sym: t.symbol, name: t.name, img: t.icon, pad: t.launchpad, mcap: t.mcap, price: t.usdPrice, liq: t.liquidity, holders: t.holderCount, aura: t.organicScore, auraL: t.organicScoreLabel, dev: t.dev, created: t.firstPool?.createdAt || t.createdAt, pool: t.firstPool?.id,
  c5: t.stats5m?.priceChange, c1: t.stats1h?.priceChange, c24: t.stats24h?.priceChange,
  v1: (t.stats1h?.buyVolume || 0) + (t.stats1h?.sellVolume || 0), v24: (t.stats24h?.buyVolume || 0) + (t.stats24h?.sellVolume || 0), tx1: (t.stats1h?.numBuys || 0) + (t.stats1h?.numSells || 0) });
const ok = c => c.mint && !BAD.test((c.sym || '') + ' ' + (c.name || ''));
async function get(u) { const ac = new AbortController(); const to = setTimeout(() => ac.abort(), 10000); try { const r = await fetch(u, { cache: 'no-store', signal: ac.signal }); if (!r.ok) throw new Error(r.status); return await r.json() } finally { clearTimeout(to) } }
const ALL = new Map(); const S = { new: [], trend: [], aura: [], move: [] };
let TAB = 'new', Q = '', SEEN = new Set(), FIRST = true;
function keep(list) { list.forEach(c => ALL.set(c.mint, { ...ALL.get(c.mint), ...c })); return list }
async function loadNew() {
  try {
    const L = keep((await get(`${JUP}/recent`)).filter(t => t.launchpad === 'pump.fun').map(fromJup).filter(ok));
    const fresh = []; L.forEach(c => { if (!SEEN.has(c.mint)) { SEEN.add(c.mint); if (!FIRST) fresh.push(c.mint) } });
    const m = new Map(S.new.map(c => [c.mint, c])); L.forEach(c => m.set(c.mint, c));
    S.new = [...m.values()].sort((a, b) => new Date(b.created) - new Date(a.created)).slice(0, 48);
    feed(L.filter(c => fresh.includes(c.mint) || FIRST).slice(0, 14), !FIRST);
    if (TAB === 'new') grid(fresh);
    FIRST = false;
  } catch (e) { if (!S.new.length && TAB === 'new') $('#grid').innerHTML = '<div class="empty">Jupiter isn\'t answering right now. Try again in a moment.</div>' }
}
async function loadTrend() {
  try {
    const L = keep((await get(`${JUP}/toptrending/1h?limit=100`)).filter(t => t.launchpad === 'pump.fun').map(fromJup).filter(ok));
    S.trend = L.slice(0, 40); S.move = [...L].sort((a, b) => Math.abs(b.c5 || 0) - Math.abs(a.c5 || 0)).slice(0, 40);
    strip(); meter(); if (TAB === 'trend' || TAB === 'move') grid();
  } catch (e) { if (!S.trend.length) $('#strip').innerHTML = '<div class="empty">Jupiter isn\'t answering right now.</div>' }
}
async function loadAura() {
  try {
    const L = keep((await get(`${JUP}/toporganicscore/1h?limit=100`)).filter(t => t.launchpad === 'pump.fun').map(fromJup).filter(ok));
    S.aura = L.sort((a, b) => (b.aura || 0) - (a.aura || 0)).slice(0, 40); king(); if (TAB === 'aura') grid();
  } catch (e) { if (!S.aura.length) $('#king').innerHTML = '<div class="empty">Jupiter isn\'t answering right now.</div>' }
}

/* ---------- home renders ---------- */
function feed(L, hit) {
  const box = $('#feedItems'); if (!L.length) return;
  const html = L.map(c => `<a class="fi${hit ? ' hit' : ''}" href="#/coin/${c.mint}">${img(c)}<b>$${esc((c.sym || '').slice(0, 10))}</b><span>launched · ${usd(c.mcap)}</span></a>`).join('');
  box.insertAdjacentHTML('afterbegin', html); while (box.children.length > 24) box.lastChild.remove();
}
function king() {
  const c = S.aura[0]; if (!c) return;
  $('#king').innerHTML = `<a class="king" href="#/coin/${c.mint}">${img(c)}<div style="min-width:0"><div class="crown">✦ most aura on pump.fun</div><h3>$${esc((c.sym || '').slice(0, 14))}</h3><div class="meta">${esc((c.name || '').slice(0, 40))} · ${usd(c.mcap)} mcap · ${c.holders ?? '—'} holders · ${ago(c.created)} old</div></div><div class="big"><b>+${Math.round(c.aura || 0)} aura</b><span>organic score · 1h <span class="${(c.c1 || 0) < 0 ? 'dn' : 'up'}">${pct(c.c1)}</span></span></div></a>`;
}
function strip() {
  const L = S.trend.slice(0, 16); if (!L.length) return;
  $('#strip').innerHTML = L.map(c => `<a class="tc" href="#/coin/${c.mint}"><div class="im">${img(c)}<span class="chg ${(c.c1 || 0) < 0 ? 'dn' : 'up'}">${pct(c.c1)}</span></div><div class="bd"><b>$${esc((c.sym || '').slice(0, 14))}</b><span>${usd(c.mcap)} · vol ${usd(c.v1)} / 1h</span></div></a>`).join('');
}
function meter() {
  const L = [...new Map([...S.trend, ...S.new].map(c => [c.mint, c])).values()];
  const v = L.reduce((a, c) => a + (c.v1 || 0), 0); if (!v) return;
  countTo($('#mP'), v * PUMP, usd); countTo($('#mA'), v * AURA, usd);
  $('#mAb').style.width = (AURA / PUMP * 100) + '%';
  $('#mNote').textContent = `${L.length} live pump.fun coins, ${usd(v)} traded in the last hour. Estimated at the bonding-curve rate from Jupiter's volume.`;
}
function card(c, fresh) {
  const chg = c.c5 ?? c.c1; const bar = Math.max(4, Math.min(100, (c.mcap || 0) / 70000 * 100));
  return `<a class="cc${fresh ? ' fresh' : ''}" href="#/coin/${c.mint}"><div class="im">${img(c)}</div><div style="min-width:0">
    <div class="nm"><b>${esc((c.name || '').slice(0, 26))}</b><span>$${esc((c.sym || '').slice(0, 12))}</span></div>
    <div class="sub">by ${esc(short(c.dev) || 'anon')} · ${ago(c.created)} ago</div>
    <div class="mc"><span>mcap <b>${usd(c.mcap)}</b></span><span class="${(chg || 0) < 0 ? 'dn' : 'up'} num">${pct(chg)}</span></div>
    <div class="bar"><i style="width:${bar}%"></i></div>
    <div class="ft"><span class="badge">+${Math.round(c.aura || 0)} aura</span><span>${c.holders ?? '—'} holders · vol ${usd(c.v1)}</span></div></div></a>`;
}
function grid(fresh = []) {
  let L = S[TAB] || [];
  if (Q) { const q = Q.toLowerCase(); L = [...ALL.values()].filter(c => (c.sym || '').toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q) || c.mint === Q) }
  $('#grid').innerHTML = L.length ? L.map(c => card(c, fresh.includes(c.mint))).join('') : `<div class="empty">${Q ? 'No live coin matches that. Paste a full address to open any coin.' : 'Reading pump.fun…'}</div>`;
}
$('#tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; TAB = b.dataset.t; $$('#tabs button').forEach(x => x.classList.toggle('on', x === b)); grid() });
$('#q').addEventListener('input', e => { Q = e.target.value.trim(); if (location.hash !== '#/' && location.hash !== '') location.hash = '#/'; grid() });
$('#q').addEventListener('keydown', e => { if (e.key === 'Enter' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(Q)) location.hash = '#/coin/' + Q });
function countTo(el, to, fmt) { const from = el._v || 0; el._v = to; const t0 = performance.now(); const f = n => { const k = Math.min(1, (n - t0) / 900), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) requestAnimationFrame(f) }; requestAnimationFrame(f) }

/* ---------- coin page ---------- */
let JUP_READY = null;
function loadJupPlugin() {
  if (JUP_READY) return JUP_READY;
  JUP_READY = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://plugin.jup.ag/plugin-v1.js'; s.async = true; s.onload = () => res(); s.onerror = rej; document.head.appendChild(s); setTimeout(() => rej(new Error('timeout')), 12000) });
  return JUP_READY;
}
async function coin(mint) {
  let c = ALL.get(mint);
  if (!c) { try { const r = await get(`${JUP}/search?query=${mint}`); if (r && r[0]) c = keep([fromJup(r[0])])[0] } catch (e) { } }
  if (!c) c = { mint, sym: '?', name: 'Unknown coin' };
  $('#cImg').outerHTML = img(c).replace('<img ', '<img id="cImg" ');
  $('#cName').textContent = '$' + (c.sym || '?'); $('#cSub').textContent = c.name || '';
  $('#cMint').innerHTML = `${short(mint)} <span style="color:var(--a)">copy</span>`; $('#cMint').onclick = () => { navigator.clipboard?.writeText(mint); toast('Address copied') };
  $('#cAura').textContent = `+${Math.round(c.aura || 0)} aura`;
  $('#chart').innerHTML = `<iframe src="https://dexscreener.com/solana/${encodeURIComponent(mint)}?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartTheme=dark&theme=dark&chartStyle=1&chartType=usd&interval=5" title="chart" loading="lazy"></iframe>`;
  $('#cStats').innerHTML = [['Market cap', usd(c.mcap)], ['Liquidity', usd(c.liq)], ['Holders', c.holders ?? '—'], ['1h change', pct(c.c1)], ['Volume 1h', usd(c.v1)], ['Trades 1h', c.tx1 || '—'], ['Launchpad', c.pad || '—'], ['Age', c.created ? ago(c.created) : '—']].map(([k, v]) => `<div class="st"><span>${k}</span><b>${esc(v)}</b></div>`).join('');
  const v = c.v1 || 0; $('#cVol').textContent = usd(v); $('#cFp').textContent = usd(v * PUMP); $('#cFa').textContent = usd(v * AURA); countTo($('#cSave'), v * (PUMP - AURA), usd);
  const jt = $('#jup'); jt.style.minHeight = ''; jt.innerHTML = '<div class="skel" style="height:420px"></div>';
  try {
    await loadJupPlugin(); jt.innerHTML = '';
    window.Jupiter.init({ displayMode: 'integrated', integratedTargetId: 'jup', formProps: { initialInputMint: 'So11111111111111111111111111111111111111112', initialOutputMint: mint } });
  } catch (e) {
    jt.style.minHeight = '0';
    jt.innerHTML = `<a class="btn pri" style="width:100%;height:48px" href="https://jup.ag/swap/SOL-${encodeURIComponent(mint)}" target="_blank" rel="noopener">Trade $${esc(c.sym || '')} on Jupiter ↗</a>`;
    $('#jupNote').textContent = 'Opens Jupiter in a new tab. You sign in your own wallet.';
  }
}

/* ---------- launch preview ---------- */
let LIMG = '';
function lprev() {
  const c = { mint: '', sym: ($('#lTk').value || 'TICKER').toUpperCase(), name: $('#lName').value || 'Your coin', mcap: 4200, c5: 0, aura: 0, holders: 1, v1: 0, created: new Date().toISOString(), dev: (window.__wallet || '') };
  $('#lPrev').innerHTML = card(c).replace(/<div class="im">.*?<\/div>/, `<div class="im"><img src="${LIMG || tile(c.sym)}" alt=""></div>`).replace(/href="[^"]*"/, '');
}
['lName', 'lTk', 'lDesc'].forEach(id => $('#' + id).addEventListener('input', lprev));
$('#lImg').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; LIMG = URL.createObjectURL(f); $('#lDrop').innerHTML = `<img src="${LIMG}" alt="">`; lprev() });
$('#lDrop').addEventListener('dragover', e => { e.preventDefault(); $('#lDrop').style.borderColor = 'var(--a)' });
$('#lDrop').addEventListener('drop', e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && f.type.startsWith('image/')) { LIMG = URL.createObjectURL(f); $('#lDrop').innerHTML = `<img src="${LIMG}" alt="">`; lprev() } });

/* ---------- aura check ---------- */
let SOL = null;
async function solPrice() { try { const r = await get(`${JUP}/search?query=So11111111111111111111111111111111111111112`); SOL = r[0]?.usdPrice || null } catch (e) { } $('#kSol').textContent = SOL ? '$' + SOL.toFixed(2) + ' · live' : 'unavailable'; check() }
function check() {
  const s = +$('#kSize').value, n = +$('#kN').value; $('#kSizeV').textContent = s.toFixed(1) + ' SOL'; $('#kNV').textContent = n;
  const vol = s * n * 365, p = vol * PUMP, a = vol * AURA, save = p - a;
  const f = x => SOL ? usd(x * SOL) : x.toFixed(1) + ' SOL';
  $('#kOut').textContent = f(save); $('#kOutSol').textContent = `${save.toFixed(1)} SOL on ${Math.round(s * n * 365).toLocaleString('en-US')} SOL of volume`;
  $('#kP').textContent = f(p); $('#kA').textContent = f(a);
  $('#kShare').onclick = () => window.open('https://x.com/intent/post?text=' + encodeURIComponent(`pump.fun's 1.25% fee costs me ${f(p)} a year. On aura it'd be ${f(a)}.\n\npump.fun lost aura.`), '_blank', 'noopener');
}
['kSize', 'kN'].forEach(id => $('#' + id).addEventListener('input', check));

/* ---------- wallet ---------- */
$('#connect').addEventListener('click', async () => {
  const p = window.phantom?.solana || window.solflare || window.backpack || window.solana;
  if (!p) { window.open('https://phantom.com/download', '_blank', 'noopener'); return }
  try { const r = await p.connect(); const k = (r?.publicKey || p.publicKey)?.toString(); if (k) { window.__wallet = k; $('#connect').textContent = short(k); toast('Wallet connected'); lprev() } } catch (e) { toast('Connection cancelled') }
});

/* ---------- router ---------- */
function route() {
  const h = location.hash.replace(/^#/, '') || '/'; const [, r, arg] = h.split('/');
  const view = r === 'coin' ? 'coin' : ['launch', 'check', 'how'].includes(r) ? r : 'home';
  $$('.view').forEach(v => v.classList.toggle('on', v.id === 'v-' + view));
  $$('#nav a,#mob a').forEach(a => a.classList.toggle('on', a.dataset.r === view));
  if (view === 'coin' && arg) coin(arg);
  if (view === 'launch') lprev();
  if (view === 'check' && SOL === null) solPrice();
  scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}
addEventListener('hashchange', route); route();

/* ---------- boot + live refresh ---------- */
loadNew(); loadTrend(); loadAura();
setInterval(() => { if (!document.hidden) loadNew() }, 8000);
setInterval(() => { if (!document.hidden) loadTrend() }, 30000);
setInterval(() => { if (!document.hidden) loadAura() }, 45000);
// hero voxels follow the mouse a little
const hero = $('.hero'); hero && hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; hero.querySelectorAll('.vx').forEach((v, i) => v.style.translate = `${x * (12 + i * 6)}px ${y * (10 + i * 5)}px`) });
})();
