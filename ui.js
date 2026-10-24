let S = migrate(load());
// screen state that is not game state: which pane, the picker, the open Man card, the Saga sheet, the two-tap arm, and what changed since the band last showed it
const UI = { pane: 'map', picker: false, man: null, saga: false, armed: 0, scroll: {}, pend: { silver: 0, men: 0 }, buy: 10, beatYear: 0, routeDrawn: null, winterYear: 0, winterBeat: false };
const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = sel => document.querySelector(sel);
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const statLine = m => `<span class="stats">C <b>${m.combat}</b> · R <b>${m.rule}</b> · F <b>${m.follow}</b>${m.age ? ` · age ${m.age}` : ''}</span>`;
const shoreOf = id => S.shores[id];
const ownerName = id => { const o = ownerOf(S, id); return o && o.known ? o.name : null; }; // a known king's name on his coast
const notable = id => S.notables.find(m => m.id === id);
// line icons at the brand's thin strand weight: one stroke, no fills, nothing that is a symbol
const ICONS = {
  ship: '<path d="M3 13c2 3 4 4 7 4s5-1 7-4l-1-1H4z M10 12V4 M10 4c3 1 5 3 6 7 M10 4c-3 1-5 3-6 7"/>',
  hall: '<path d="M3 10l7-6 7 6 M5 9v8h10V9 M9 17v-4h2v4"/>',
  land: '<path d="M3 16h14 M5 16V9l5-5 5 5v7 M3 7l2 2 M17 7l-2 2"/>',
  map: '<path d="M3 14c2-2 4-2 7 0s5 2 7 0 M3 9c2-2 4-2 7 0s5 2 7 0 M3 4c2-2 4-2 7 0s5 2 7 0"/>',
  silver: '<path d="M10 3a7 7 0 1 0 0 14"/><path d="M10 3a7 7 0 0 1 0 14" stroke-dasharray="2 2.6"/>',
  men: '<circle cx="7" cy="7" r="2.5"/><circle cx="14" cy="8" r="2"/><path d="M2.5 17c0-3 2-5 4.5-5s4.5 2 4.5 5 M11.5 16c.3-2.3 1.4-3.8 3-4 1.6.2 2.8 1.7 3 4"/>',
  wanderer: '<path d="M8 17V5a2 2 0 0 1 4 0v1 M8 9h3 M12 17l1-6"/>',
  death: '<path d="M4 17h12 M6 17l1-7h6l1 7 M10 10V4 M8 6h4"/>',
  fork: '<path d="M10 17v-7 M10 10L5 4 M10 10l5-6 M5 4H3 M15 4h2"/>',
  oath: '<path d="M10 3a7 7 0 1 0 0 14 M10 3a7 7 0 0 1 6 3.5 M10 17a7 7 0 0 0 6-3.5 M16 6.5l-1 1 M16 13.5l-1-1"/>',
  axe: '<path d="M5 17L15 7 M12 4c3 0 5 2 5 5-2 0-4-1-5-2-1-1-2-3 0-3z"/>',
  crown: '<path d="M4 15h12 M4 15L3 7l4 3 3-5 3 5 4-3-1 8"/>',
};
// the stance word as a tag, with an arrow for one turn after it moved (TODO 21); pine / chestnut / oxblood for warm / cool / cold
const stanceTag = m => { const w = stanceWord(m.stance), a = stanceMoved(S, m); return `<span class="tag st-${w}">${w}${a ? `<i class="arr ${a > 0 ? 'up' : 'down'}">${a > 0 ? '↑' : '↓'}</i>` : ''}</span>`; };
const openMan = id => `onclick="UI.man='${id}';render()"`;
const ico = k => `<svg class="ico" viewBox="0 0 20 20" aria-hidden="true">${ICONS[k]}</svg>`;

function render() {
  const app = $('#app');
  if (!S) { app.innerHTML = setupHTML(); return; }
  if (S.queue.length) UI.picker = false;
  if (UI.man && !S.rulers?.[UI.man] && !notable(UI.man)) UI.man = null; // he died, or walked
  const quiet = !S.queue.length, open = UI.man || UI.saga || UI.picker;
  // the arrival beat: the first time the Map pane shows a new spring, the band counts, the fog opens, last summer's coasts bloom, the route draws
  const beat = quiet && S.phase === 'spring' && UI.pane === 'map' && !open && UI.beatYear !== S.year;
  if (beat) UI.beatYear = S.year;
  const sheet = S.queue.length ? overlayHTML(S.queue[0]) : UI.man ? manSheet(UI.man) : UI.saga ? sagaSheet() : UI.picker ? pickerHTML() : '';
  app.innerHTML = bandHTML(quiet, beat) + paneHTML(beat) + footHTML() + sheet;
  const p = $('.pane'); if (p && UI.pane !== 'map') p.scrollTop = UI.scroll[UI.pane] || 0;
  if ($('#bn')) marketNums();
  fitMap(); if (beat) countUp(app);
  if (UI.winterBeat) { UI.winterBeat = false; const sc = $('.scene'); if (sc) countUp(sc); } // the autumn ledger counts the chest on its first showing
  if (UI.pane === 'map') UI.routeDrawn = S.destination;
}
// the map behind the band and the commit sheet: crop to the known world, match the screen's shape, and sit the world in the free water between the two
function fitMap() {
  const svg = $('.pane.map svg.map'); if (!svg || !svg.dataset || !svg.dataset.crop) return;
  const [x0, y0, x1, y1] = svg.dataset.crop.split(' ').map(Number);
  const W = svg.clientWidth, H = svg.clientHeight; if (!W || !H) return;
  const top = $('.top'), foot = $('.foot'), bandH = top ? top.offsetHeight : 90, footH = foot ? foot.offsetHeight : 220;
  const freeC = (bandH + (H - footH)) / 2 / H;
  let w = x1 - x0, h = y1 - y0; const want = W / H; if (w / h > want) h = w / want; else w = h * want;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + (0.5 - freeC) * h;
  svg.setAttribute('viewBox', `${(cx - w / 2).toFixed(1)} ${(cy - h / 2).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
}
if (typeof addEventListener === 'function') addEventListener('resize', fitMap);
// numbers in the band count from last year's value to this one (data-count holds the target)
function countUp(root) {
  if (reducedMotion || !root.querySelectorAll || typeof requestAnimationFrame !== 'function') return;
  for (const el of root.querySelectorAll('[data-count]')) {
    const to = +el.dataset.count, from = +el.textContent; if (from === to) continue;
    const t0 = performance.now(), dur = 650;
    const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
}
// Sail: the ship leaves along the route, then the summer's sheet rises
function depart() {
  const plank = $('.plank'); if (plank) plank.disabled = true;
  const svg = $('.pane.map svg.map'), rt = svg && svg.querySelector('.route');
  if (!rt || reducedMotion) { act(() => sail(S)); return; }
  const path = 'M' + rt.getAttribute('points').split(' ').join(' L').replace(/,/g, ' ');
  svg.insertAdjacentHTML('beforeend', `<circle class="shipdot" r="3"><animateMotion dur="0.9s" fill="freeze" begin="indefinite" path="${path}"/></circle>`);
  const am = svg.querySelector('.shipdot animateMotion'); if (am && am.beginElement) am.beginElement();
  setTimeout(() => act(() => sail(S)), 950);
}
// the coast graph's path from the hall to a shore, for the route line and the departing ship
function routeTo(s, to) {
  const prev = { [HOME_ID]: null }, q = [HOME_ID];
  while (q.length) { const c = q.shift(); if (c === to) break; for (const n of s.shores[c].neighbors) if (!(n in prev)) { prev[n] = c; q.push(n); } }
  if (!(to in prev)) return [HOME_ID, to];
  const p = []; for (let c = to; c; c = prev[c]) p.unshift(c); return p;
}
// the odds as a temperature on the plank: pine, teal, chestnut, oxblood
function oddsTemp(Sv, D) { const p = winOdds(Sv, D); return 't-' + (p >= .97 ? 'sure' : p >= .7 ? 'likely' : p >= .4 ? 'even' : 'long'); }
const closeX = fn => `<button class="x" onclick="${fn}" aria-label="Back">×</button>`;
function act(fn) {
  const p = $('.pane'); if (p) UI.scroll[UI.pane] = p.scrollTop;
  const was = S ? { silver: S.silver, men: S.men } : null;
  fn();
  if (S && was) { UI.pend.silver += S.silver - was.silver; UI.pend.men += S.men - was.men; } // shown on the band once it is in view
  if (S) save(S);
  render();
}
function go(pane) { UI.pane = pane; render(); }

// ---- Setup ------------------------------------------------------------------------------
function setupHTML() {
  const past = loadPast();
  const kings = p => { const ks = p.rows.map(r => r.king); return ks.length > 3 ? `${ks.slice(0, 3).join(', ')} and ${ks.length - 3} more` : ks.join(', '); };
  return `<div class="setup"><img class="mark" src="mark/ring-small.svg" alt=""><h1>Ring Giver</h1>
  <div class="sub">793. You are twenty, with a hall, forty men, and one ship. Raid for silver. Hold what you take. Marry well, and die. Then your son faces the jarls: they kneel, or they walk. Play until the line ends.</div>
  <h2>Choose your king</h2>
  <div class="pick" onclick="startGame('ragnar')"><span class="name">Ragnar</span><small>The raider. Silver comes fast and the summers run red. What he takes, he keeps badly.</small>${statRows(4, 2, 3)}</div>
  <div class="pick" onclick="startGame('rollo')"><span class="name">Rollo</span><small>The settler. Takes a coast and holds it. Silver comes slow and sure, and the fleet is weak when it must fight.</small>${statRows(2, 4, 3)}</div>
  <div class="card"><span class="name">Your own</span><small>Name him. Nine points, one to five each.</small>
    <input id="cname" class="cname" placeholder="Name" value="Halfdan">
    ${statRows(cust.c, cust.r, cust.f, true)}
    <div class="hint" id="pts">${ptsLine()}</div>
    <button class="primary" style="width:100%;margin-top:10px" onclick="startCustom()">Begin</button></div>
  <p class="hint">The world is seeded by today's date. Anyone who starts a dynasty today sails the same seas.</p>
  ${past.length ? `<h2>Past kings</h2>${past.map(p => `<div class="card"><span class="name">${esc(kings(p))}</span><br><span class="stats">${p.from}–${p.to} · ${p.gens} king${p.gens === 1 ? '' : 's'} · ${esc(p.why)} · the seas of ${p.seed}</span></div>`).join('')}` : ''}
  <div class="imprint">House Hansen</div></div>`;
}
// the three stats as dots and what each one does in the rules: Combat multiplies men at sea, Rule multiplies men on land, Followability is men led (F × 10)
const dots = n => `<span class="dots">${'●'.repeat(n)}${'○'.repeat(5 - n)}</span>`;
const STAT_WORDS = { c: v => `each man aboard fights as ${v}`, r: v => `each man on land holds as ${v}`, f: v => `leads ${v * T.menPerF} men` };
function statRows(c, r, f, edit) {
  const row = (k, label, v) => `<span class="k">${label}</span>${edit
    ? `<span class="men"><button onclick="bump('${k}',-1)">−</button><span class="n" id="${k}">${dots(v)}</span><button onclick="bump('${k}',1)">+</button></span>`
    : dots(v)}<i id="${edit ? k + 'w' : ''}">${STAT_WORDS[k](v)}</i>`;
  return `<div class="srows${edit ? ' edit' : ''}">${row('c', 'Combat', c)}${row('r', 'Rule', r)}${row('f', 'Followability', f)}</div>`;
}
const cust = { c: 3, r: 3, f: 3 };
const ptsLine = () => { const left = 9 - cust.c - cust.r - cust.f; return left ? `${left} point${left === 1 ? '' : 's'} left to spend` : 'All nine placed'; };
function bump(k, d) { const v = cust[k] + d, sum = cust.c + cust.r + cust.f + d; if (v < 1 || v > 5 || sum > 9) return; cust[k] = v;
  $('#' + k).innerHTML = dots(v); $('#' + k + 'w').textContent = STAT_WORDS[k](v); $('#pts').textContent = ptsLine(); }
function startGame(k) { S = migrate(newGame(k)); UI.pane = 'map'; save(S); render(); }
function startCustom() { const name = $('#cname').value.trim() || 'Halfdan'; S = migrate(newGame('custom', Object.assign([cust.c, cust.r, cust.f], { name }))); UI.pane = 'map'; save(S); render(); }

// ---- The autumn ledger and the market (Winter sheet, audit 2 option A): the year as an account, events weighted by kind, one card for the market, the way on at the foot ----
function winterHTML(sc) {
  const beat = UI.winterYear !== S.year; if (beat) { UI.winterYear = S.year; UI.winterBeat = true; }
  const p = has(S,'fairdealer') ? 2 : T.manPrice, mx = Math.floor(S.silver / p / 5) * 5, first = S.year === T.startYear;
  const rows = sc.rows || [], events = sc.events || (sc.land || []).map(t => ({ k:'note', t, s:'' })), eat = sc.eat, lo = sc.loot, spring = sc.spring;
  let i = 0; const d = () => beat ? ` style="animation-delay:${120 * i++}ms"` : '';
  const row = (k, sub, v, cls) => { const a = d(); return `<span class="k${beat ? ' in' : ''}"${a}>${k}${sub ? `<small>${sub}</small>` : ''}</span><span class="v ${cls}${beat ? ' in' : ''}"${a}>${v}</span>`; };
  let L = '';
  if (spring != null) L += row('Chest in spring', '', spring, '');
  if (lo) L += row('Loot', lo.n ? `${esc(lo.from)} plundered` : lo.forfeit ? `${esc(lo.forfeit.jarl)} stayed at ${esc(lo.forfeit.shore)}; the loot was forfeited` : lo.beaten ? `driven back at ${esc(lo.beaten)}` : 'the ship stayed home', lo.n ? `+${lo.n}` : '0', lo.n ? 'up' : 'nil');
  for (const r of rows) L += row(`Rent · ${esc(r.n)}`, esc(r.why), r.v === null ? '—' : r.v ? `+${r.v}` : '0', r.v ? 'up' : 'nil');
  if (eat) { const struck = eat.paid !== eat.due ? eat.due : eat.due !== eat.base ? eat.base : null; L += row(`The hall ate · ${eat.men} men`, esc(eat.why), `${struck !== null ? `<s>−${struck}</s> ` : ''}−${eat.paid}`, 'down'); }
  else for (const t of sc.hall || []) L += row(esc(t), '', '', '');
  if (S.yr && S.yr.bought) L += row(`Men bought · ${S.yr.bought}`, '', `−${S.yr.bought * p}`, 'down');
  const from = beat && spring != null ? spring : S.silver, delta = spring != null ? S.silver - spring : 0;
  L += `<div class="tot"><span class="k">Chest</span><span class="v"><b id="btot" data-count="${S.silver}">${from}</b>${delta ? `<span class="d ${delta > 0 ? 'up' : 'down'}">${delta > 0 ? '+' : ''}${delta}</span>` : ''}</span></div>`;
  const ev = events.length ? events.map((e, j) => `<div class="ev ${e.k}${beat ? ' in' : ''}"${beat ? ` style="animation-delay:${120 * i + 110 * j}ms"` : ''}><i></i><div><div class="t">${esc(e.t)}</div>${e.s ? `<div class="s">${esc(e.s)}</div>` : ''}</div></div>`).join('') : `<p class="quiet">A quiet summer on the land.</p>`;
  const market = mx < 5 ? `<div class="nomarket"><span>${S.silver} silver buys no men this winter.</span><b>${p} each</b></div>`
    : `<div class="market"><div class="price"><span>The market</span><span>${p === 2 ? '<s>3</s> <b>2</b> silver a man · Fair-dealer' : `<b>${p}</b> silver a man`}</span></div>${marketHTML()}${first ? '<div class="teach">Men at home eat 1 silver a winter. Men aboard raid. A named man leads F × 10; past that, they sit unled.</div>' : ''}</div>`;
  return `<h1>${ico('land')}Autumn ${S.year}</h1><div class="ledger">${L}</div><h2>The land</h2>${ev}<h2>The market</h2>${market}
    <div class="exit"><button class="primary" onclick="act(()=>closeWinter(S))"><span>Into winter</span><small>one card turns</small></button></div>`;
}
// pick how many, read what they buy, then one Buy that names the deal. Numbers update in place; the sheet does not jump
function marketHTML() {
  const unled = unledMen(S);
  return `<div class="step"><button id="bdec" onclick="setBuy(-5)">−</button><span class="n"><span id="bn"></span><small>men</small></span><button id="binc" onclick="setBuy(5)">+</button></div>
  <div class="cons"><span>Silver</span><b id="bsil"></b><span>Men</span><b id="bmen"></b><span id="bleadk"></span><b id="bleadv"></b><span class="w" id="bwarn" hidden></span>
    <div class="room"><i class="led" id="bled"></i><i class="add" id="badd"></i></div><span class="full" id="broom"></span></div>
  <button class="buy" id="bbuy" onclick="buyNow()"></button>${S.yr && S.yr.bought ? `<div class="bought">${S.yr.bought} men bought this winter. ${S.men} men now${unled ? ` · ${unled} unled` : ''}.</div>` : ''}`;
}
function setBuy(d) { if (d) UI.buy += d; marketNums(); }
function buyNow() { const t = $('#btot'), from = t ? t.textContent : null; act(() => buyMen(S, UI.buy)); const e = $('#btot'); if (e && from !== null) { e.textContent = from; countUp(e.closest('.scene')); } }
function marketNums() {
  const p = has(S,'fairdealer') ? 2 : T.manPrice, room = menRoom(S), max = Math.floor(S.silver / p / 5) * 5;
  const n = UI.buy = Math.max(0, Math.min(UI.buy, max)), cost = n * p, over = Math.max(0, n - room);
  const set = (id, v) => { const e = $('#' + id); if (e) e.innerHTML = v; };
  set('bn', n); set('bsil', `${S.silver} → ${S.silver - cost}`); set('bmen', `${S.men} → ${S.men + n}`);
  // who would lead them: the King first, then the named men at home, as Fill does in spring (bought men wait unled until placed)
  let left = n, lead = null, str = 0;
  for (const m of [...S.notables].sort((a, b) => (b.isKing ? 1 : 0) - (a.isKing ? 1 : 0) || (a.place === 'home' ? 0 : 1) - (b.place === 'home' ? 0 : 1))) {
    if (left <= 0) break; const r = fCap(S, m) - m.men; if (r <= 0) continue; const take = Math.min(r, left); if (!lead) lead = m; str += m.combat * take; left -= take; }
  set('bleadk', lead ? `Aboard under ${esc(lead.name)}` : ''); set('bleadv', lead ? `+${str} ship strength` : '');
  const w = $('#bwarn'); if (w) { w.hidden = over <= 0; w.textContent = over > 0 ? `${over} of these would sit unled: fed, no use, until another named man comes to the hall.` : ''; }
  const capAll = S.notables.reduce((a, m) => a + fCap(S, m), 0) || 1, led = S.men - unledMen(S);
  const bl = $('#bled'), ba = $('#badd'); if (bl) bl.style.width = `${100 * Math.min(1, led / capAll)}%`; if (ba) ba.style.width = `${100 * Math.min(n, room) / capAll}%`;
  set('broom', `room for ${room} more under the named men`);
  const dec = $('#bdec'), inc = $('#binc'), buy = $('#bbuy');
  if (dec) dec.disabled = n <= 5; if (inc) inc.disabled = n + 5 > max;
  if (buy) { buy.disabled = n <= 0; buy.textContent = n > 0 ? `Buy ${n} men for ${cost} silver` : 'Not enough silver for five men'; }
}

// ---- The band: year, king, silver and men; tap it for the Saga. What changed shows once, when the band is in view (TODO 21) ----
function bandHTML(quiet, beat) {
  const k = S.king, titles = k.titles.map(t => `<span class="tag">${TITLES[t].name}</span>`).join('');
  const nextFork = T.forkAges.find(a => a > k.age), death = k.age > 50 ? Math.round(5 * (k.age - 50) * (has(S,'oldwise') ? .5 : 1)) : 0;
  const show = quiet || UI.man || UI.saga, d = UI.pend;
  const delta = v => show && v ? `<span class="delta ${v > 0 ? 'up' : 'down'}">${v > 0 ? '+' : ''}${v}</span>` : '';
  const n = (v, dv) => `<b data-count="${v}">${beat && dv ? v - dv : v}</b>`; // counts up to v on the beat
  // past fifty, a life strand under the king's name: what is left of it shortens each winter
  const life = death ? `<div class="life"><i style="width:${Math.max(5, 100 - death)}%"></i></div>` : '';
  const h = `<div class="top${UI.pane === 'map' ? ' glass' : ''}" onclick="UI.saga=true;render()"><div class="year">${S.year}</div>
    <div class="res">${delta(d.silver)}${n(S.silver, d.silver)} silver<br>${delta(d.men)}${n(S.men, d.men)} men · ${unledMen(S)} unled</div>
    <div class="king">${esc(k.name)}, ${k.age}${titles}${nextFork ? `<span class="fork">· fork at ${nextFork}</span>` : ''}${death ? `<span class="death">· death ${death}%</span>` : ''}</div>${life}</div>`;
  if (show) UI.pend = { silver: 0, men: 0 };
  return h;
}

// ---- Panes: Map, Ship, Hall. Each fits one screen; the band above, the Sail bar and tabs below (TODO 19) ----
function paneHTML(beat) {
  const ship = S.notables.filter(m => m.place === 'ship'), home = S.notables.filter(m => m.place === 'home');
  if (UI.pane === 'map') {
    // the chart: the whole screen is the map; the band floats above it, the commit sheet below, two chips over the water
    const newIds = beat ? Object.values(S.shores).filter(x => x.seenY === S.year - 1).map(x => x.id) : [];
    const first = S.gen === 1 && !S.deeds.raids && !S.destination && S.phase === 'spring'; // the first spring: one coast pulses until it is tapped
    const hint = first ? (Object.values(S.shores).filter(x => x.seen && x.id !== HOME_ID).sort((a, b) => b.loot - a.loot)[0] || {}).id : null;
    return `<div class="pane map">${mapHTML(null, { beat, newIds, hint, draw: UI.routeDrawn !== S.destination })}</div><div class="free">${chipsHTML(ship)}</div>`;
  }
  return `<div class="pane ${UI.pane}">${UI.pane === 'ship' ? shipPane(ship) : hallPane(home)}</div>`;
}
// the Wanderer and the crew as two chips over the water, spring only
function chipsHTML(ship) {
  if (S.phase !== 'spring') return '';
  const p = rumorPrice(S), off = S.rumorOffer;
  const rumor = off === 'none' ? `<div class="chip dim">${ico('wanderer')}Nothing new within reach</div>`
    : off ? `<div class="chip" onclick="act(()=>setDestination(S,'${off}'))">${ico('wanderer')}He names <b class="rich">${esc(shoreOf(off).name)}</b></div>`
    : `<div class="chip${S.silver < p ? ' dim' : ''}" onclick="act(()=>buyRumor(S))">${ico('wanderer')}Rumor <small>${p ? `${p} silver` : 'free'}</small></div>`;
  const ab = ship.reduce((a, m) => a + m.men, 0), atHome = S.notables.some(m => m.place === 'home');
  const hint = S.destination && !ab && !S.deeds.raids && S.gen === 1; // the first spring, second lesson: the crew
  const crew = `<div class="chip${hint ? ' hint' : ''}" onclick="${atHome ? 'act(()=>boardAll(S))' : "go('ship')"}">${ico('men')}${ab} aboard${atHome ? ' <small>all aboard</small>' : ''}</div>`;
  return rumor + crew;
}
function shipPane(ship) {
  return `<h2>${ico('ship')}The ship</h2>${destHTML(ship)}
  ${ship.map(m => manCard(m)).join('') || '<div class="card empty">No one aboard. <b>Everyone aboard</b> puts the whole hall on the ship; or send men one at a time from the Hall.</div>'}`;
}
function hallPane(home) {
  return `<h2>${ico('hall')}Home · Vestfold</h2>
  ${home.map(m => manCard(m)).join('') || '<div class="card empty">Everyone is at sea. The hall stands thin.</div>'}
  <div class="card row"><span>Unled men</span><span class="stats"><b>${unledMen(S)}</b> — no use, still fed</span></div>
  <h2>${ico('land')}Holdings</h2>
  ${hallHTML()}${S.holdings.map(h => holdingHTML(h)).join('')}${lostHTML()}
  ${childrenHTML()}`;
}
function footHTML() {
  const ship = S.notables.filter(m => m.place === 'ship');
  const tab = (id, label, icon, n) => `<button class="${UI.pane === id ? 'on' : ''}" onclick="go('${id}')">${ico(icon)}<span>${label}${n ? ` · ${n}` : ''}</span></button>`;
  return `<div class="foot${UI.pane === 'map' ? ' commit' : ''}">${UI.pane === 'map' ? sheetHTML(ship) : sailButton(ship)}<nav class="tabs">${tab('map', 'Map', 'map')}${tab('ship', 'Ship', 'ship', ship.reduce((a, m) => a + m.men, 0))}${tab('hall', 'Hall', 'hall', S.holdings.length)}</nav></div>`;
}
// the commit sheet: where, the odds, and one plank that carries the odds' temperature (audit 1, option A)
function sheetHTML(ship) {
  const spring = S.phase === 'spring', d = S.destination, x = d && d !== 'blind' ? shoreOf(d) : null, Sh = strengthShip(S), manned = Sh > 0;
  const own = x && ownerName(x.id), first = S.gen === 1 && !S.deeds.raids;
  let name, sub = '';
  if (!spring) { name = `Winter ${S.year}`; sub = 'The year turns.'; }
  else if (!d) { name = 'Where this year?'; sub = first ? 'Tap a coast. Rich ones are bigger dots.' : 'Tap a coast on the map, or open the list.'; }
  else if (d === 'blind') { name = 'Sail blind'; sub = `${has(S,'farsailor') ? 5 : 3} dark coasts, fog until you arrive`; }
  else { name = esc(x.name); sub = (x.seen ? `loot ${x.loot} · ${x.def} defenders · ${x.holdable ? 'holdable' : 'cannot hold'}` : x.rumored ? 'rich, by rumor' : 'unseen') + (own ? ` · ${esc(own)}'s` : ''); }
  const bar = x && x.seen && manned ? barHTML(Sh, x.def) : d && manned ? `<div class="odds">Ship strength ${Sh}.</div>` : '';
  let label, small = '', fn = '', cls = 'plank', temp = '';
  if (!spring) label = 'Winter';
  else if (!d) { label = 'Choose a coast'; small = 'tap one on the map'; fn = 'UI.picker=true;render()'; cls += ' ask'; }
  else if (!manned) { label = 'No one aboard'; small = 'tap the crew'; fn = "go('ship')"; cls += ' ask'; }
  else { label = `Sail for ${d === 'blind' ? 'the dark' : esc(x.name)}${d !== 'blind' && S.lastDest === d ? ' again' : ''}`; fn = 'depart()';
    if (x && x.seen) { small = oddsWords(Sh, x.def); temp = oddsTemp(Sh, x.def); } else small = `ship ${Sh}`; }
  const stay = spring && !manned ? `<button class="stay" onclick="act(()=>sail(S))">Stay home this year</button>` : '';
  return `<div class="sheet ${temp}"><div class="dest" ${spring ? 'onclick="UI.picker=true;render()"' : ''}><div><div class="dname">${name}</div>${sub ? `<div class="dsub">${sub}</div>` : ''}</div><span class="chev">▸</span></div>
    ${bar}<button class="${cls}" ${spring ? '' : 'disabled'} onclick="${fn}"><span>${label}</span><small>${small}</small></button>${stay}</div>`;
}
function sailButton(ship) {
  const spring = S.phase === 'spring', manned = ship.length > 0, d = S.destination;
  let label, fn = 'act(()=>sail(S))', cls = 'primary';
  if (!spring) label = 'Winter';
  else if (!manned && !d) label = 'Stay home this year';
  else if (!manned) { label = 'No one aboard'; fn = "go('ship')"; cls = 'primary ask'; }
  else if (!d) { label = 'Choose a destination'; fn = 'UI.picker=true;render()'; cls = 'primary ask'; }
  else label = `Sail for ${d === 'blind' ? 'the dark' : esc(shoreOf(d).name)}${d !== 'blind' && S.lastDest === d ? ' again' : ''}`;
  return `<div class="sail"><button class="${cls}" ${spring ? '' : 'disabled'} onclick="${fn}">${label}</button></div>`;
}
function destHTML(ship) {
  const spring = S.phase === 'spring', d = S.destination, x = d && d !== 'blind' ? shoreOf(d) : null;
  const label = !d ? 'Choose a destination' : d === 'blind' ? 'Sail blind' : esc(x.name);
  const own = x && ownerName(x.id);
  const sub = x ? (x.seen ? `loot ${x.loot} · ${x.def} defenders · ${x.holdable ? 'holdable' : 'cannot hold'}` : x.rumored ? 'rich, by rumor' : 'unseen') + (own ? ` · ${esc(own)}'s` : '') : d === 'blind' ? `${has(S,'farsailor') ? 5 : 3} dark coasts, fog until you arrive` : '';
  const Sh = strengthShip(S); let bar = '';
  if (x && x.seen && ship.length) bar = barHTML(Sh, x.def);
  else if (ship.length) bar = `<div class="odds">Ship strength ${Sh}.</div>`;
  const atHome = S.notables.some(m => m.place === 'home');
  return `<div class="card">
    <button class="dest${d ? ' set' : ''}" ${spring ? '' : 'disabled'} onclick="UI.picker=true;render()"><span><span class="dname">${label}</span>${sub ? `<br><span class="stats">${sub}</span>` : ''}</span><span class="chev">▸</span></button>
    ${bar}
    ${spring && atHome ? `<div class="where"><button class="small" onclick="act(()=>boardAll(S))">Everyone aboard</button><span class="hint" style="margin:0;align-self:center">all at home board, filled from the unled</span></div>` : ''}</div>`;
}
// the destination picker: one sheet, every known shore in the same shape, richest first
function pickerHTML() {
  const Sh = strengthShip(S);
  const known = Object.values(S.shores).filter(x => x.known && x.id !== HOME_ID && !isHolding(S, x.id))
    .sort((a, b) => (b.seen ? b.loot : b.rumored ? 999 : -1) - (a.seen ? a.loot : a.rumored ? 999 : -1) || a.name.localeCompare(b.name));
  const row = x => { const own = ownerName(x.id); return `<div class="prow${S.destination === x.id ? ' sel' : ''}" onclick="act(()=>{setDestination(S,'${x.id}');UI.picker=false})">
    <span class="pname">${esc(x.name)}${x.walked ? `<small>(${esc(x.walked.name)}'s now)</small>` : own ? `<small>(${esc(own)}'s realm)</small>` : x.rumored && !x.seen ? '<small>(rich, by rumor)</small>' : ''}</span>
    <span class="pnum rich">${x.seen ? x.loot : '?'}</span><span class="pnum">${x.seen ? x.def : '?'}</span>
    <span class="psub">${x.seen ? oddsWords(Sh, x.def) : 'unknown'} · ${x.holdable ? 'holdable' : 'cannot hold'}</span></div>`; };
  const blind = `<div class="prow blind${S.destination === 'blind' ? ' sel' : ''}" onclick="act(()=>{setDestination(S,'blind');UI.picker=false})">
    <span class="pname">Sail blind</span><span class="pnum">—</span><span class="pnum">—</span><span class="psub">${has(S,'farsailor') ? 5 : 3} dark coasts · fog until you arrive</span></div>`;
  return `<div class="overlay" onclick="if(event.target===this){UI.picker=false;render()}"><div class="scene">
    <h1>${ico('ship')}Where?${closeX('UI.picker=false;render()')}</h1><p>Ship strength <b class="rich">${Sh}</b>. Richest first. Tapping a coast on the map works too.</p>
    <div class="phead"><span>Shore</span><span>loot</span><span>def</span></div>
    ${known.map(row).join('')}${blind}
    <div class="actions"><button onclick="UI.picker=false;render()">Back</button></div></div></div>`;
}
function barHTML(Sv, D, labelS = 'Ship', labelD = 'Defenders', anim = false) {
  const tot = Sv + D || 1;
  return `<div class="bar${anim ? ' anim' : ''}"><i class="s" style="width:${100 * Sv / tot}%"></i><i class="d" style="width:${100 * D / tot}%"></i></div>
  <div class="odds">${labelS} <b class="us">${Math.round(Sv)}</b> vs ${labelD} <b class="them">${D}</b> · ${oddsWords(Sv, D)}</div>`;
}
function manCard(m) {
  const spring = S.phase === 'spring', cap = fCap(S, m);
  const places = [['ship', 'Ship'], ['home', 'Home'], ...(m.isKing ? [] : S.holdings.map(h => [h.id, h.name]))];
  return `<div class="card"><div class="row"><div class="who" ${openMan(m.id)}><span class="name">${esc(m.name)}</span>${m.isKing ? '<span class="tag">King</span>' : stanceTag(m)}${m.son ? '<span class="tag kin">Son</span>' : m.kin ? '<span class="tag kin">Kin</span>' : ''}<br>${statLine(m)}</div>
    <div class="men"><button ${spring ? '' : 'disabled'} onclick="act(()=>addMen(S,'${m.id}',-5))">−</button><span class="n">${m.men}<div class="cap">of ${cap}</div></span><button ${spring ? '' : 'disabled'} onclick="act(()=>addMen(S,'${m.id}',5))">+</button><button class="fill" ${spring && m.men < cap && unledMen(S) ? '' : 'disabled'} onclick="act(()=>addMen(S,'${m.id}',${cap}))">Fill</button></div></div>
    ${spring ? `<div class="where">${places.map(([id, nm]) => `<button class="small ${m.place === id ? 'sel' : ''}" onclick="act(()=>place(S,'${m.id}','${id}'))">${esc(nm)}</button>`).join('')}</div>` : ''}</div>`;
}
// the hall is a holding row with the King as its jarl (GDD §15.2); it cannot revolt
function hallHTML() {
  const k = S.king, home = k.place === 'home', spring = S.phase === 'spring';
  const text = !spring ? 'The King\'s hall. It cannot revolt.' : home ? `${esc(k.name)} keeps his hall this summer: it pays, his Rule grows every third year, and every man at home warms to him.` : `${esc(k.name)} sails. The hall pays nothing and stands thin against a rival sail.`;
  return `<div class="card"><div class="row"><span class="name">Vestfold<span class="tag">the hall</span></span><span class="stats">pays <b>${hallPay(S)}</b> · King ${home ? 'home' : 'at sea'}</span></div><div class="hint">${text}</div></div>`;
}
function holdingHTML(h) {
  const j = S.notables.find(m => m.place === h.id);
  return `<div class="card"><div class="row"><span class="name">${esc(h.name)}</span><span class="stats">pays <b>${h.pay}</b> · unrest <b>${h.unrest}</b> · quiet ${h.quiet}y</span></div>
    ${j ? barHTML(j.rule * j.men, h.unrest, j.name, 'Unrest') + manCard(j) : `<div class="empty" style="margin-top:6px">No jarl. ${h.empty ? 'Stood empty last summer — one more and it revolts.' : 'Empty this summer: unrest rises, nothing paid.'}</div>`}</div>`;
}
// a holding lost last summer stays on the pane, struck through, until the next spring (TODO 21)
function lostHTML() { return (S.lost || []).map(l => `<div class="card lost row"><span class="name">${esc(l.name)}</span><span class="stats">${esc(l.why)} · ${l.y}</span></div>`).join(''); }
function childrenHTML() {
  if (!S.children.length) return '';
  const hasJarl = S.notables.some(m => !m.isKing && !m.kin);
  return `<h2>${ico('men')}Children</h2>` + S.children.map(c => `<div class="card row"><span>${esc(c.name)} <span class="stats">${c.sex === 'm' ? 'son' : 'daughter'}, ${c.age}${c.married ? `, wife of ${esc(c.married)}` : c.ofAge ? ', in the hall' : c.sex === 'f' && c.age >= 16 ? (hasJarl ? ' · of age. Tap a jarl to marry her to him' : ' · of age') : ''}</span></span></div>`).join('');
}
function reignRow(d) {
  return `<div class="card"><span class="name">${esc(d.king)}</span> <span class="stats">${d.from}–${d.now ? 'now' : d.to}${d.title ? ' · ' + d.title : ''}</span><br><span class="stats">${d.bestRaid ? `Richest raid: ${esc(d.bestRaid.shore)}, ${d.bestRaid.loot} silver (${d.bestRaid.year}). ` : 'Never raided. '}Most holdings: ${d.bestHoldings}.</span></div>`;
}
function dynastyHTML() { return S.dynasty.map(reignRow).join('') + `<div class="hint">Generation ${S.gen}. World seed ${S.day}.</div>`; }
function mapHTML(targets, o = {}) {
  const known = Object.values(S.shores).filter(x => x.known);
  const tappable = !targets && S.phase === 'spring' && !S.queue.length;
  // the edge of the known world: unnamed coasts one step past what is known, drawn in iron
  const dark = Object.values(S.shores).filter(x => !x.known && x.neighbors.some(n => S.shores[n].known));
  const edges = EDGES.filter(([a, b]) => S.shores[a].known || S.shores[b].known).filter(([a, b]) => (S.shores[a].known || dark.includes(S.shores[a])) && (S.shores[b].known || dark.includes(S.shores[b])))
    .map(([a, b]) => `<line class="edge${S.shores[a].known && S.shores[b].known ? '' : ' dark'}" x1="${S.shores[a].x}" y1="${S.shores[a].y}" x2="${S.shores[b].x}" y2="${S.shores[b].y}"/>`).join('');
  // known realms, tinted: one blob per king, drawn under the coast dots (GDD §15.3)
  const realms = Object.values(S.rulers).filter(k => k.known).map(k => `<g class="realm" style="color:var(--${k.tint})">${EDGES.filter(([a, b]) => k.coasts.includes(a) && k.coasts.includes(b)).map(([a, b]) => `<line x1="${S.shores[a].x}" y1="${S.shores[a].y}" x2="${S.shores[b].x}" y2="${S.shores[b].y}"/>`).join('')}${k.coasts.map(id => `<circle cx="${S.shores[id].x}" cy="${S.shores[id].y}" r="11"/>`).join('')}</g>`).join('');
  const dots = known.map(x => {
    const mine = x.id === HOME_ID || isHolding(S, x.id), tgt = targets && targets.includes(x.id);
    const cls = x.id === HOME_ID ? 'home' : isHolding(S, x.id) ? 'hold' : x.seen ? (x.holdable ? 'seen' : 'seen nohold') : '';
    const r = mine ? 4 : (x.seen || x.rumored) ? 2.5 + Math.min(3, x.baseLoot / 80) : 3; // dot size is loot, in tiers
    const can = tappable && !mine;
    const own = ownerOf(S, x.id), anchor = own && own.known && own.anchor === x.id;
    // the king's name under his seat opens his card (the Kings list lived here before TODO 19)
    const L = x.side === 'l', AB = x.side === 'a' || x.side === 'b', lx = L ? x.x - r - 3 : AB ? x.x : x.x + r + 3, ly = x.side === 'a' ? x.y - r - 4 : x.side === 'b' ? x.y + r + 11 : x.y + 3, kw = 8 + own?.name.length * 5.2 || 0;
    const kname = anchor ? `<g class="kname" ${targets ? '' : `onclick="event.stopPropagation();UI.man='${own.id}';render()"`}><rect x="${L ? x.x - r - kw : x.x + r}" y="${x.y + 4}" width="${kw}" height="14" fill="transparent"/><text class="lbl king${L ? ' l' : AB ? ' c' : ''}" x="${lx}" y="${x.side === 'a' ? ly - 9 : ly + 10}">${esc(own.name)}</text></g>` : '';
    const isNew = o.newIds && o.newIds.includes(x.id), hint = o.hint === x.id; // a coast first seen last summer blooms; the first spring's coast pulses
    return `<g class="c ${tgt ? 'tgt' : targets ? 'dim' : ''}${can ? ' tap' : ''}${isNew ? ' bloom' : ''}" ${isNew ? `style="animation-delay:${(.35 + o.newIds.indexOf(x.id) * .12).toFixed(2)}s"` : ''} ${can ? `onclick="act(()=>setDestination(S,'${x.id}'))"` : ''}>${can ? `<circle class="hit" cx="${x.x}" cy="${x.y}" r="13"/>` : ''}<circle class="coast ${cls}" cx="${x.x}" cy="${x.y}" r="${r.toFixed(1)}"/>${S.destination === x.id && !targets ? `<circle class="dest" cx="${x.x}" cy="${x.y}" r="${(r + 4).toFixed(1)}"/>` : ''}${tgt || hint ? `<circle class="ring" cx="${x.x}" cy="${x.y}" r="${(r + 5).toFixed(1)}"/>` : ''}<text class="lbl${L ? ' l' : AB ? ' c' : ''}" x="${lx}" y="${ly}">${esc(x.name)}</text>${kname}</g>`; }).join('')
    + dark.map(x => `<circle class="coast dark" cx="${x.x}" cy="${x.y}" r="2"/>`).join('');
  // the fog: a lit pool of sea and coast around every known shore, dimmer land and deeper water everywhere else
  const fog = known.map(x => `<circle cx="${x.x}" cy="${x.y}" r="${x.seen ? 46 : 30}" fill="#fff"/>`).join('');
  // the route from the hall to the standing destination
  let route = '';
  if (!targets && S.destination && S.destination !== 'blind' && S.shores[S.destination] && S.shores[S.destination].known) {
    const pts = routeTo(S, S.destination).map(id => S.shores[id]);
    route = `<polyline pathLength="1" class="route${o.draw ? ' draw' : ''}" points="${pts.map(p => p.x + ',' + p.y).join(' ')}"/>`;
  }
  // crop to what is drawn, with room for the labels; never narrower than the eye expects. The pane's map is refit to the screen's shape after render (fitMap)
  const all = targets ? targets.map(id => S.shores[id]) : [...known, ...dark], pad = targets ? 40 : 22;
  let x0 = Math.min(...all.map(x => x.x - (x.side === 'l' ? 40 : 0))) - pad, x1 = Math.max(...all.map(x => x.x + (x.side === 'l' ? 0 : 40))) + pad, y0 = Math.min(...all.map(x => x.y)) - pad, y1 = Math.max(...all.map(x => x.y)) + pad;
  const minW = 220, minH = 150;
  if (x1 - x0 < minW) { const c = (x0 + x1) / 2; x0 = c - minW / 2; x1 = c + minW / 2; }
  if (y1 - y0 < minH) { const c = (y0 + y1) / 2; y0 = c - minH / 2; y1 = c + minH / 2; }
  if (targets && (y1 - y0) / (x1 - x0) > 1.1) { const c = (x0 + x1) / 2, w = (y1 - y0) / 1.1; x0 = c - w / 2; x1 = c + w / 2; }
  const id = targets ? 'l' : 'p', cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, big = 'x="-1000" y="-1000" width="3000" height="3000"';
  return `<svg class="map${targets ? ' landfall' : ''}" viewBox="${x0.toFixed(0)} ${y0.toFixed(0)} ${(x1 - x0).toFixed(0)} ${(y1 - y0).toFixed(0)}" ${targets ? '' : `preserveAspectRatio="xMidYMid slice" data-crop="${x0.toFixed(1)} ${y0.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}"`}>
    <defs><filter id="fb${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="11"/></filter>
    <mask id="fog${id}" maskUnits="userSpaceOnUse" ${big}><rect ${big} fill="#000"/><g filter="url(#fb${id})" class="${o.beat ? 'fogin' : ''}" style="transform-origin:${cx.toFixed(1)}px ${cy.toFixed(1)}px">${fog}</g></mask></defs>
    <rect class="seaDark" ${big}/><path class="land dark" d="${COAST_PATH}"/>
    <g mask="url(#fog${id})"><rect class="seaLit" ${big}/><path class="land" d="${COAST_PATH}"/>${realms}</g>
    ${edges}${route}${dots}</svg>`;
}

// ---- The Saga sheet: the kings, the chronicle by year, and the way out (TODO 18, 22) ----
function sagaSheet() {
  const reigns = [...S.dynasty, { king: S.king.name, from: S.reign.start, to: S.year, bestRaid: S.reign.bestRaid, bestHoldings: S.reign.bestHoldings, title: S.reign.title, now: true }].reverse();
  const byYear = {}; for (const l of S.log) (byYear[l.y ?? 'before'] = byYear[l.y ?? 'before'] || []).push(l.t);
  const years = Object.keys(byYear).filter(y => y !== 'before').map(Number).sort((a, b) => b - a);
  const reignOf = y => reigns.find(r => r.from <= y) || reigns[reigns.length - 1]; // newest first, so the first reign begun by then
  const block = (y, lines) => `<div class="yr"><span class="y">${y}</span><div>${lines.map(t => `<div>${esc(t)}</div>`).join('')}</div></div>`;
  let last = null, chron = '';
  for (const y of years) { const r = reignOf(y); if (r !== last) { chron += `<div class="reign">${esc(r.king)} · ${r.from}–${r.now ? 'now' : r.to}</div>`; last = r; } chron += block(y, byYear[y]); }
  if (byYear.before) chron += block('—', byYear.before);
  const armed = Date.now() - UI.armed < 3000;
  return `<div class="overlay" onclick="if(event.target===this){UI.saga=false;render()}"><div class="scene">
    <h1>${ico('oath')}Saga${closeX('UI.saga=false;render()')}</h1><p class="stats">Generation ${S.gen} · the seas of ${S.day}</p>
    <h2>Kings</h2>${reigns.map(reignRow).join('')}
    <h2>Chronicle</h2><div class="chron">${chron || '<div class="hint">Nothing yet. Sail.</div>'}</div>
    <h2>New dynasty</h2>
    <div class="where"><button class="small${armed ? ' armed' : ''}" onclick="newDynasty()">${armed ? 'Tap again · this dynasty is lost' : 'New dynasty'}</button><span class="hint" style="margin:0;align-self:center">${armed ? 'or wait, and nothing happens' : 'its kings stay under Past kings'}</span></div>
    <div class="actions"><button onclick="UI.saga=false;render()">Back</button></div></div></div>`;
}
// two taps within three seconds; no dialog (design law 1: undo over confirm)
function newDynasty() {
  if (Date.now() - UI.armed < 3000) { archive(S, 'given up'); S = null; UI.saga = false; UI.armed = 0; render(); return; }
  UI.armed = Date.now(); render();
  setTimeout(() => { if (S && UI.saga && Date.now() - UI.armed >= 3000) render(); }, 3100);
}

// ---- The Man card (GDD §15.4): one sheet for a person, every verb that applies now ---------
function stanceHTML(m) {
  const w = stanceWord(m.stance), why = (m.why || []).slice().reverse();
  return `<div class="stance st-${w}">${w}</div>
    ${why.length ? `<div class="why">${why.map(x => `<span>${x.y}</span><span>${esc(x.t)}</span><b class="${x.d > 0 ? 'up' : x.d < 0 ? 'down' : ''}">${x.d > 0 ? '+' : ''}${x.d || ''}</b>`).join('')}</div>` : '<div class="hint">No deeds between you yet.</div>'}`;
}
function manSheet(id) {
  if (S.rulers && S.rulers[id]) return rulerSheet(S.rulers[id]);
  const m = notable(id), k = S.king, spring = S.phase === 'spring';
  const h = S.holdings.find(h => h.id === m.place);
  const whereNow = m.place === 'ship' ? 'on the ship' : m.place === 'home' ? 'at home' : `holding ${esc(h ? h.name : m.place)}`;
  const story = [];
  if (m.isKing) { story.push(`King since ${S.reign.start}, generation ${S.gen}.`); if (m.titles.length) story.push(m.titles.map(t => `${TITLES[t].name}: ${TITLES[t].text}`).join(' ')); }
  else { if (m.son) story.push(`Son of ${esc(k.name)}.`); else if (m.kin) story.push('Married into the line.'); }
  story.push(`${m.raids ? `${m.raids} raid${m.raids === 1 ? '' : 's'}` : 'Never raided'}.${m.heldRun ? ` Has held land ${m.heldRun} summer${m.heldRun === 1 ? '' : 's'} running.` : ''}`);
  if (m.age) story.push(`Born ${S.year - m.age}. ${whereNow[0].toUpperCase() + whereNow.slice(1)}${m.men ? ` with ${m.men} men` : ''}.`);
  const places = [['ship', 'Ship'], ['home', 'Home'], ...(m.isKing ? [] : S.holdings.map(x => [x.id, x.name]))];
  const daughters = S.children.filter(c => c.sex === 'f' && c.age >= 16 && !c.married);
  const cap = fCap(S, m), price = giftPrice(m), gifted = m.gifted === S.year;
  const verbs = !spring ? '<div class="hint">Verbs are spoken in spring.</div>' : `
    <h2>Send him</h2><div class="where">${places.map(([pid, nm]) => `<button class="small ${m.place === pid ? 'sel' : ''}" onclick="act(()=>place(S,'${m.id}','${pid}'))">${esc(nm)}</button>`).join('')}</div>
    <div class="row" style="margin-top:10px"><span>Men he leads</span><div class="men"><button onclick="act(()=>addMen(S,'${m.id}',-5))">−</button><span class="n">${m.men}<div class="cap">of ${cap}</div></span><button onclick="act(()=>addMen(S,'${m.id}',5))">+</button><button class="fill" ${m.men < cap && unledMen(S) ? '' : 'disabled'} onclick="act(()=>addMen(S,'${m.id}',${cap}))">Fill</button></div></div>
    ${m.isKing ? '' : `<h2>Warm him</h2>
    <div class="where"><button class="small" ${S.silver < price || gifted ? 'disabled' : ''} onclick="act(()=>gift(S,'${m.id}'))">${gifted ? 'Gifted this year' : `Gift ${price} silver`}</button><span class="hint" style="margin:0;align-self:center">once a year · +${T.giftWarm}</span></div>
    ${!m.kin && daughters.length ? `<div class="where" style="margin-top:8px">${daughters.map(d => `<button class="small" onclick="act(()=>marry(S,'${d.id}','${m.id}'))">Marry ${esc(d.name)} to him</button>`).join('')}<span class="hint" style="margin:0;align-self:center">he is kin then · +30</span></div>` : ''}`}`;
  const children = m.isKing && S.children.length ? `<h2>Children</h2><p class="stats">${S.children.map(c => `${esc(c.name)} ${c.age}${c.married ? `, wife of ${esc(c.married)}` : ''}`).join(' · ')}</p>` : '';
  return `<div class="overlay" onclick="if(event.target===this){UI.man=null;render()}"><div class="scene">
    <h1>${esc(m.name)}${m.isKing ? '<span class="tag">King</span>' : ''}${m.son ? '<span class="tag kin">Son</span>' : m.kin ? '<span class="tag kin">Kin</span>' : ''}${closeX('UI.man=null;render()')}</h1>
    <p>${statLine(m)}</p>
    ${m.isKing ? '' : `<h2>Toward the King</h2>${stanceHTML(m)}`}
    <h2>His story</h2><p>${story.join(' ')}</p>${children}
    ${verbs}
    <div class="actions"><button onclick="UI.man=null;render()">Back</button></div></div></div>`;
}
function realmList(k) {
  return k.coasts.map(id => { const x = shoreOf(id); return `<span class="realm-coast ${isHolding(S, id) ? 'mine' : x.seen ? '' : 'dark'}">${esc(x.name)}${isHolding(S, id) ? ' (yours)' : id === k.anchor ? ' (his seat)' : ''}</span>`; }).join(', ');
}
function rulerSheet(k) {
  const spring = S.phase === 'spring', price = giftPrice(k), gifted = k.gifted === S.year;
  const held = k.coasts.filter(c => c !== k.anchor && isHolding(S, c)).length, rest = k.coasts.length - 1;
  return `<div class="overlay" onclick="if(event.target===this){UI.man=null;render()}"><div class="scene">
    <h1>${ico('crown')}${esc(k.name)}${closeX('UI.man=null;render()')}</h1><p class="stats">${esc(k.title)}</p>
    <h2>Toward the King</h2>${k.broken ? '<div class="stance st-loyal">kneels</div><div class="hint">His realm answers to you. He will not rise again.</div>' : stanceHTML(k)}
    <h2>His realm</h2><p>${realmList(k)}</p>
    <p class="hint">${k.broken ? `${esc(shoreOf(k.anchor).name)} lies open to be held.` : `He takes a free coast beside his own every ${T.realmGrow} years or so. Raid his coasts and he sours; hold one and he sours more. Hold every coast but ${esc(shoreOf(k.anchor).name)} and he breaks: ${held} of ${rest} so far.`}</p>
    ${spring && !k.broken ? `<h2>Warm him</h2><div class="where"><button class="small" ${S.silver < price || gifted ? 'disabled' : ''} onclick="act(()=>gift(S,'${k.id}'))">${gifted ? 'Gifted this year' : `Gift ${price} silver`}</button><span class="hint" style="margin:0;align-self:center">once a year · +${T.giftWarm}</span></div>` : ''}
    <div class="actions"><button onclick="UI.man=null;render()">Back</button></div></div></div>`;
}

// ---- Scenes -------------------------------------------------------------------------------
function overlayHTML(sc) {
  const btn = (t, fn, cls = 'primary') => `<button class="${cls}" onclick="act(()=>${fn})">${t}</button>`;
  let h = '';
  if (sc.t === 'intro') h = `<h1>${ico('hall')}${S.year}. Spring.</h1><p>You are ${esc(S.king.name)}, twenty, with a hall, forty men, and one ship.</p><p><b>Tap a coast. Put men aboard. Press Sail.</b></p><p>Men on the ship raid. Men on the land hold. Men at home eat. Each named man leads F × 10.</p><p>Every summer the fleet sails. Every winter one card turns. Past fifty, every winter rolls against you. The year, up top, opens the Saga.</p><div class="actions">${btn('Begin', 'next(S)')}</div>`;
  else if (sc.t === 'fork') h = `<h1>${ico('fork')}${esc(S.king.name)} is ${S.king.age}</h1><p>What they call him is what he did. Choose one.</p>${sc.offers.map(k => `<div class="pick" onclick="act(()=>takeTitle(S,'${k}'))"><span class="name">${TITLES[k].name}</span><br><span class="stats">${TITLES[k].text}</span></div>`).join('')}`;
  else if (sc.t === 'noSail') h = `<h1>Summer</h1><p>The ship stays beached. The land contests itself.</p><div class="actions">${btn('On', 'next(S)')}</div>`;
  else if (sc.t === 'arrive') { const Sh = strengthShip(S);
    h = `<h1>${ico('ship')}Landfall</h1>${mapHTML(sc.targets)}<p>The fog lifts. Ship strength <b class="rich">${Sh}</b>. Pick one.</p>${sc.targets.map(id => { const x = shoreOf(id);
      return `<div class="pick" onclick="act(()=>chooseTarget(S,'${id}'))"><div class="row"><span class="name">${esc(x.name)}</span><span class="stats">loot <b class="rich">${x.loot}</b>${x.holdable ? ' · holdable' : ''}${x.walked ? ` · ${esc(x.walked.name)} holds it` : ownerName(id) ? ` · ${esc(ownerName(id))}'s` : ''}</span></div>${barHTML(Sh, x.def)}</div>`; }).join('')}`; }
  else if (sc.t === 'ruler') { const k = S.rulers[sc.ruler], w = stanceWord(k.stance), newest = k.newest && shoreOf(k.newest);
    h = `<h1>${ico('crown')}${esc(k.name)}</h1><p class="stats">${esc(k.title)}</p>
    <p>${sc.envoy ? `His envoy comes over the ice with gifts and a long look at the hall. ${esc(k.name)}'s reach has grown${newest ? ` to ${esc(newest.name)}` : ''}, and now it touches yours.` : `The men bring back a king's name.`} He holds ${realmList(k)}.</p>
    <p>He is <b class="st-${w}">${w}</b> toward you. Raid his coasts and he sours. Hold every one but ${esc(shoreOf(k.anchor).name)} and he breaks.</p>
    <div class="actions">${btn('On', 'next(S)')}</div>`; }
  else if (sc.t === 'fight') { const x = shoreOf(sc.shore);
    h = `<h1>${ico('axe')}${esc(x.name)}</h1>${barHTML(sc.S, sc.D, 'Ship', 'Defenders', true)}<div class="result ${sc.win ? '' : 'lose'}">${sc.win ? (sc.margin > 1 ? 'Rout.' : sc.margin > 0.3 ? 'Victory.' : 'A narrow thing.') : 'Driven back.'}</div>
    <p>${sc.win ? `${sc.loot} silver in loot.` : 'No loot.'} ${sc.losses} men lost.${sc.win && sc.margin > 1 ? ' The men will follow these jarls anywhere.' : ''}</p><div class="actions">${btn('On', 'next(S)')}</div>`; }
  else if (sc.t === 'stay') { const x = shoreOf(sc.shore), ship = S.notables.filter(m => m.place === 'ship' && !m.isKing), pay = holdPay(x), unrest = stayUnrest(S, x);
    const who = m => `<div class="pick" onclick="act(()=>chooseStay(S,'${m.id}'))"><div class="row"><div><span class="name">${esc(m.name)} stays</span><br>${statLine(m)}</div><span class="stats"><b>${m.men}</b> of ${fCap(S, m)} men</span></div>${barHTML(m.rule * m.men, unrest, 'Holds', 'Unrest')}</div>`;
    h = `<h1>${ico('land')}Plunder or stay?</h1>
    <p><b>Plunder:</b> ${sc.loot} silver now, and sail home.</p>
    <p><b>Stay:</b> forfeit the loot. ${esc(x.name)} becomes a holding. It pays <b class="rich">${pay}</b> silver a year and starts at unrest <b>${unrest}</b>, falling 5 each held summer. Every summer the jarl's Rule × men must beat the unrest or it revolts. The first summer is his for free.</p>
    <div class="actions">${btn(`Plunder · ${sc.loot} silver`, 'choosePlunder(S)')}</div>
    <h2>Or leave a jarl</h2>
    ${sc.walked ? `<div class="pick" onclick="act(()=>chooseStay(S,'walked'))"><div class="row"><div><span class="name">${esc(x.walked.name)} kneels and keeps it</span><br>${statLine(x.walked)}</div><span class="stats">no men yet</span></div><div class="hint">He brings no men. Send him some in spring or it revolts.</div></div>` : ''}
    ${ship.map(who).join('') || (sc.walked ? '' : '<div class="empty">The King cannot stay. Only another jarl can hold a shore.</div>')}`; }
  else if (sc.t === 'summary') h = `<h1>${esc(sc.title)}</h1>${sc.lines.map(l => `<p>${esc(l)}</p>`).join('')}<div class="actions">${btn('On', 'next(S)')}</div>`;
  else if (sc.t === 'winter') h = winterHTML(sc); // the autumn ledger and the market (TODO 20, audit 2)
  else if (sc.t === 'event') h = `<h1>${esc(sc.title)}</h1>${sc.lines.map(l => `<p>${esc(l)}</p>`).join('')}<div class="actions">${sc.choice ? btn('Give her', 'acceptSuitor(S,true)') + btn('Refuse', 'acceptSuitor(S,false)', '') : btn('On', 'next(S)')}</div>`;
  else if (sc.t === 'death') { const r = S.reign;
    h = `<h1>${ico('death')}${esc(S.king.name)} is dead</h1><p>${S.king.age} winters. King ${r.start}–${S.year}.</p><h2>The Saga</h2>${r.bestRaid ? `<p>The year ${r.bestRaid.year}: ${esc(r.bestRaid.shore)} fell and the ship came home with ${r.bestRaid.loot} silver.</p>` : '<p>He never took a shore.</p>'}<p>At most ${r.bestHoldings} holdings answered to him.${r.title ? ` Men called him ${r.title}.` : ''}</p><div class="actions">${btn('The heir', 'startSuccession(S)')}</div>`; }
  else if (sc.t === 'heir') h = `<h1>${ico('men')}The Heir</h1><p>Pick a son. The jarls will weigh his Rule against their own following.</p>${sc.sons.map(id => { const m = notable(id); return `<div class="pick" onclick="act(()=>chooseHeir(S,'${id}'))"><span class="name">${esc(m.name)}</span><br>${statLine(m)}</div>`; }).join('')}`;
  else if (sc.t === 'oath') { const j = notable(sc.jarl), h2 = S.holdings.find(h => h.id === j.place);
    h = `<h1>${ico('oath')}${esc(j.name)} of ${esc(h2.name)}</h1><p>${statLine(j)} · ${j.men} men</p>${sc.kneels ? `<p class="rich">He kneels${j.kin ? ' — he is kin' : ''}.</p><div class="actions">${btn('On', 'oathPay(S,false)')}</div>`
      : `<p>He hesitates. His following outweighs the heir's Rule.</p><p>Price of his knee: <b class="rich">${sc.price}</b> silver. You have ${S.silver}.</p><div class="actions">${btn(`Pay ${sc.price}`, 'oathPay(S,true)', S.silver >= sc.price ? 'primary' : '')}${btn('Let him walk with his holding', 'oathPay(S,false)', '')}</div>`}`; }
  else if (sc.t === 'coronation') h = `<h1>${ico('hall')}${esc(S.king.name)}, king</h1><p>${S.holdings.length} holdings. ${S.men} men. ${S.silver} silver.</p><p>Same screen. Smaller kingdom.</p><div class="actions">${btn('First spring', 'finishCoronation(S)')}</div>`;
  else if (sc.t === 'end') h = `<h1>${sc.reason === '1066' ? 'The dynasty ends at 1066' : 'The line is broken'}</h1><p>${sc.reason === '1066' ? 'The age of the sea kings is over.' : 'No son, no son-in-law. The strongest jarl takes the hall.'}</p><h2>Dynasty Saga</h2>${dynastyHTML()}<div class="actions">${btn('Begin again', `archive(S,'${sc.reason === '1066' ? 'reached 1066' : 'the line broke'}');S=null`)}</div>`;
  return `<div class="overlay"><div class="scene">${h}</div></div>`;
}
render();
