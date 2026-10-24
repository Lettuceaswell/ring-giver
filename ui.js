let S = migrate(load());
// screen state that is not game state: which pane, the picker, the open Man card, the Saga sheet, the two-tap arm, and what changed since the band last showed it
const UI = { fightDone: null, fightT: [], pane: 'map', picker: false, man: null, saga: false, armed: 0, scroll: {}, pend: { silver: 0, men: 0 }, buy: 10, beatYear: 0, routeDrawn: null, winterYear: 0, winterBeat: false, cardYear: 0, cardBeat: false, rolled: 0 };
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
  babe: '<path d="M3 11h14 M4 11c0 3.5 2.7 6 6 6s6-2.5 6-6 M12.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>',
  sail: '<path d="M10 3v12 M10 4c3 2 5 5 5 9h-5 M3 15c2 2 4 2.5 7 2.5s5-.5 7-2.5"/>',
  snow: '<path d="M10 2v16 M3 6l14 8 M3 14l14-8 M8 3l2 2 2-2 M8 17l2-2 2 2"/>',
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
  const fsc = S.queue[0] && S.queue[0].t === 'fight' && S.queue[0].phases ? S.queue[0] : null;
  clearFight(); // drawn again mid-battle: the battle starts over (only Skip ends it early)
  const quiet = !S.queue.length, open = UI.man || UI.saga || UI.picker;
  // the arrival beat: the first time the Map pane shows a new spring, the band counts, the fog opens, last summer's coasts bloom, the route draws
  const beat = quiet && S.phase === 'spring' && UI.pane === 'map' && !open && UI.beatYear !== S.year;
  if (beat) UI.beatYear = S.year;
  const sheet = S.queue.length ? overlayHTML(S.queue[0]) : UI.man ? manSheet(UI.man) : UI.saga ? sagaSheet() : UI.picker ? pickerHTML() : '';
  // the same sheet drawn again (a tap inside it) keeps its scroll and does not rise again (session 13: the Saga's New dynasty, the Stay confirm)
  const sheetId = S.queue.length ? S.queue[0] : UI.man || (UI.saga && 'saga') || (UI.picker && 'picker') || null, sc0 = $('.scene'), keep = sc0 ? sc0.scrollTop : 0, same = sheetId && sheetId === UI.sheetId;
  UI.sheetId = sheetId;
  app.innerHTML = bandHTML(quiet, beat) + paneHTML(beat) + footHTML() + sheet;
  if (same) { const o = $('.overlay'), sc = $('.scene'); if (o) o.classList.add('still'); if (sc) sc.scrollTop = keep; }
  const p = $('.pane'); if (p && UI.pane !== 'map') p.scrollTop = UI.scroll[UI.pane] || 0;
  if ($('#bn')) marketNums();
  fitMap(); if (beat) countUp(app);
  if (UI.winterBeat) { UI.winterBeat = false; const sc = $('.scene'); if (sc) countUp(sc); } // the autumn ledger counts the chest on its first showing
  if (UI.cardBeat) { UI.cardBeat = false; const f = $('.tc .flip'); if (f) setTimeout(() => f.classList.remove('down'), 380); } // the winter card lies face down a breath, then turns
  if (UI.pane === 'map') UI.routeDrawn = S.destination;
  if (fsc && !fightPlayed(fsc)) playFight(fsc); // the battle plays once
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
    const step = t => { const k = Math.max(0, Math.min(1, (t - t0) / dur)), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); };
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
  <div class="pick" onclick="startGame('rollo')"><span class="name">Rollo</span><small>The lawgiver. His hall pays well while he sits in it, and his land runs far before it stirs. Silver comes slow and sure, and the fleet is weak when it must fight.</small>${statRows(2, 4, 3)}</div>
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
// the King's Rule is his hall's pay and his reach (session 13); the seas are today's, so the hall's yield is today's too
let todayHall = null; const hallYield = () => todayHall ?? (todayHall = holdPay(buildWorld(new Date().toISOString().slice(0, 10))[HOME_ID]));
const STAT_WORDS = { c: v => `each man aboard fights as ${v}`, r: v => `the hall pays ${Math.round(hallYield() * v / 3)} · ${T.reachBase + T.reachRule * v} holdings before they stir`, f: v => `leads ${v * T.menPerF} men` };
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
  const nextFork = T.forkAges.find(a => a > k.age), death = Math.round(100 * deathOdds(S));
  const show = quiet || UI.man || UI.saga, d = UI.pend;
  const delta = v => show && v ? `<span class="delta ${v > 0 ? 'up' : 'down'}">${v > 0 ? '+' : ''}${v}</span>` : '';
  const n = (v, dv) => `<b data-count="${v}">${beat && dv ? v - dv : v}</b>`; // counts up to v on the beat
  const fs = S.queue[0] && S.queue[0].t === 'fight' && S.queue[0].phases && !fightPlayed(S.queue[0]) ? S.queue[0] : null; // before the battle is fought, the band does not know how it went
  if (fs) return `<div class="top"><div class="year">${S.year}</div><div class="res"><b data-count="${S.silver}">${S.silver - (fightPlunders(fs) ? fs.loot : 0)}</b> silver<br><b data-count="${S.men}">${S.men + fs.losses}</b> men · ${unledMen(S)} unled</div>
    <div class="king">${esc(k.name)}, ${k.age}${titles}${nextFork ? `<span class="fork">· fork at ${nextFork}</span>` : ''}${death ? `<span class="death">· death ${death}%</span>` : ''}</div></div>`;
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
  const rumor = off === 'none' || (!off && !rumorCands(S).length) ? `<div class="chip dim">${ico('wanderer')}Nothing new within reach</div>`
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
  const bar2 = spring && manned ? riskLine(x && x.seen ? x.def : null) : '';
  let label, small = '', fn = '', cls = 'plank', temp = '';
  if (!spring) label = 'Winter';
  else if (!d) { label = 'Choose a coast'; small = 'tap one on the map'; fn = 'UI.picker=true;render()'; cls += ' ask'; }
  else if (!manned) { label = 'No one aboard'; small = 'tap the crew'; fn = "go('ship')"; cls += ' ask'; }
  else { label = `Sail for ${d === 'blind' ? 'the dark' : esc(x.name)}${d !== 'blind' && S.lastDest === d ? ' again' : ''}`; fn = 'depart()';
    if (x && x.seen) { small = oddsWords(Sh, x.def); temp = oddsTemp(Sh, x.def); } else small = `ship ${Sh}`; }
  const stay = spring && !manned ? `<button class="stay" onclick="act(()=>sail(S))">Stay home this year</button>` : '';
  return `<div class="sheet ${temp}"><div class="dest" ${spring ? 'onclick="UI.picker=true;render()"' : ''}><div><div class="dname">${name}</div>${sub ? `<div class="dsub">${sub}</div>` : ''}</div><span class="chev">▸</span></div>
    ${bar}${bar2}<button class="${cls}" ${spring ? '' : 'disabled'} onclick="${fn}"><span>${label}</span><small>${small}</small></button>${stay}</div>`;
}
// the King's risk aboard, where the choice is made (audit 4): every named man aboard runs the same chance; the King's is the one that ends a reign
function riskLine(D) {
  const ship = S.notables.filter(m => m.place === 'ship'), king = ship.find(m => m.isKing); if (!ship.length) return '';
  if (D == null) return `<div class="krisk">${king ? `${esc(king.name)} is aboard.` : `${plural(ship.length, 'named man')} aboard.`} The risk is unknown until the fog lifts.</div>`;
  const p = shipRisk(S, D).fall, n = ship.length - (king ? 1 : 0), pc = `<b>${Math.round(1000 * p) / 10}%</b>`;
  if (p < 0.0005) return `<div class="krisk">${king ? `${esc(king.name)} aboard: no risk to him at these odds.` : 'No named man aboard is at risk at these odds.'}</div>`;
  return `<div class="krisk${p >= 0.05 ? ' high' : ''}">${king ? `${esc(king.name)} aboard: ${pc} chance he falls${n ? `, the same for ${n === 1 ? 'the man' : `each of the ${n} men`} with him` : ''}. Home, he holds the hall.` : `Each named man aboard: ${pc} chance to fall.`}</div>`;
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
    ${spring && atHome ? `<div class="where"><button class="small" onclick="act(()=>boardAll(S))">Everyone aboard</button><span class="hint" style="margin:0;align-self:center">all at home board, the King too, filled from the unled; a man with no men fights alone</span></div>` : ''}</div>`;
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
  const tot = Sv + D || 1, land = labelD === 'Unrest';
  return `<div class="bar${anim ? ' anim' : ''}"><i class="s" style="width:${100 * Sv / tot}%"></i><i class="d" style="width:${100 * D / tot}%"></i></div>
  <div class="odds">${labelS} <b class="us">${Math.round(Sv)}</b> vs ${labelD} <b class="them">${D}</b> · ${land ? holdWords(Sv, D) : oddsWords(Sv, D)}</div>`;
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
  const text = !spring ? 'The King\'s hall. It cannot revolt.' : home ? `${esc(k.name)} keeps his hall this summer: it pays ${hallPay(S)} (a third of its yield for each point of his Rule), his Rule grows every third year, and every man at home warms to him. His Rule keeps ${reachFree(S)} holdings calm.` : `${esc(k.name)} sails. The hall pays nothing and stands thin against a rival sail.`;
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
    <div class="where"><button class="small${armed ? ' armed' : ''}" onclick="newDynasty()">${armed ? 'Tap again · this dynasty is lost' : 'New dynasty'}</button><span class="hint" style="margin:0;align-self:center">${armed ? 'or wait, and nothing happens' : 'its kings stay under Past kings'}</span></div>
    <h2>Kings</h2>${reigns.map(reignRow).join('')}
    <h2>Chronicle</h2><div class="chron">${chron || '<div class="hint">Nothing yet. Sail.</div>'}</div>
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

// ---- The winter card (audit 3, option A: the Turn) ----------------------------------------
// One card lies face down on the winter night, turns, and takes the tone of what it says: grave (oxblood), good (pine), warning (chestnut), routine (iron).
// Under it, the rest of the winter as weighted rows; past fifty, the King's own card, which the button turns.
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
function cardRead(sc) {
  const k = S.king, o = { tone: 'quiet', glyph: 'hall', title: sc.title, lead: sc.lines[0] || '', chips: [], rows: [], note: '' };
  const kids = S.children.filter(c => !c.ofAge), ofAge = S.notables.filter(m => m.son && !m.isKing).length;
  if (sc.ev === 'birth') { const son = sc.kid ? sc.kid.sex === 'm' : /son/.test(sc.title); o.tone = 'boon'; o.glyph = 'babe';
    o.chips.push(son ? `The line · <b>${plural(ofAge + kids.filter(c => c.sex === 'm').length, 'son')}</b> · ${ofAge || 'none'} of age` : `<b>${plural(kids.filter(c => c.sex === 'f' && !c.married).length, 'daughter')}</b> · at sixteen a jarl may ask`); }
  else if (sc.ev === 'jarlDeath') { o.tone = 'blood'; o.glyph = 'death'; if (sc.dead) { o.lead = `He was ${sc.dead.a}.`; if (sc.dead.m) o.chips.push({ h: `${sc.dead.m} men unled`, cls: 'down' }); } }
  else if (sc.ev === 'wanderer') { o.glyph = 'wanderer'; o.lead = 'He winters in the hall and talks of far coasts.'; if (!has(S, 'silvertongue')) o.chips.push(`Rumor in spring <s>${T.rumor}</s> <b>${rumorPrice(S)}</b> silver`); }
  else if (sc.ev === 'hardWinter') { o.tone = 'omen'; o.glyph = 'snow'; o.lead = 'The ice came early and lies long.';
    const home = S.notables.filter(m => m.place === 'home').reduce((a, m) => a + m.men, 0) + unledMen(S), b = Math.round(home * T.upkeep * (has(S, 'deepchest') ? 0.5 : 1));
    o.chips.push({ h: `Next autumn's bill <s>${b}</s> <b>${b * 2}</b> silver`, cls: 'down' }); o.note = `at today's ${home} men at home`; }
  else if (sc.ev === 'harvest') { o.tone = 'boon'; o.glyph = 'land'; o.lead = 'The land is kind.'; const r = S.holdings.reduce((a, h) => a + h.pay, 0); if (r) o.chips.push({ h: `Rents next summer <s>${r}</s> <b>${r * 2}</b>`, cls: 'up' }); }
  else if (sc.ev === 'seaman') { o.tone = 'boon'; o.glyph = 'men'; const m = sc.man && notable(sc.man); if (m) o.chips.push(`Combat ${m.combat} · Rule ${m.rule} · Follow ${m.follow} · ${m.age}`); }
  else if (sc.ev === 'suitor') { o.tone = 'boon'; o.glyph = 'oath'; o.lead = 'Give her, and he is kin. Kin kneel to your heir without a price.'; }
  else if (sc.ev === 'feud') { o.tone = 'omen'; o.glyph = 'axe'; const b = sc.feud && notable(sc.feud.b); if (b) o.chips.push(`${esc(b.name)} · ${stanceWord(b.stance)} · Follow ${b.follow}`); }
  else if (sc.ev === 'quiet') { o.lead = 'Snow on the roof. Nothing stirs.'; }
  else if (sc.ev === 'rival' && sc.fight) { const f = sc.fight, whose = f.foe ? `${f.foe}'s fleet` : 'A strange fleet'; o.glyph = 'sail';
    o.title = f.foe ? `${f.foe}'s fleet` : 'A strange sail'; o.tone = f.fell ? 'blood' : f.foe ? 'omen' : 'held';
    o.lead = `${whose} came up the fjord. The hall ${f.fell ? 'fell' : 'held'}.`; o.fight = f;
    if (sc.lost) { if (sc.lost.silver) o.chips.push({ h: `−${sc.lost.silver} silver`, cls: 'down' }); if (sc.lost.men) o.chips.push({ h: `−${sc.lost.men === 1 ? '1 man' : `${sc.lost.men} men`}`, cls: 'down' }); }
    if (sc.kingSlain) { o.title = `${k.name} is slain`; o.glyph = 'death'; o.lead = `${whose} came up the fjord. The hall fell, and ${k.name} died in its door.`; }
    if (sc.slain) o.rows.push({ tone: 'blood', t: `${sc.slain.n} died in the door.`, s: sc.slain.m ? `${sc.slain.m} men unled` : '' });
    if (f.foe) o.rows.push({ tone: 'omen', t: `${f.foe} is hostile.`, s: 'His fleets keep coming while he stays hostile. Gift silver in spring to warm him.' }); }
  else if (sc.ev === 'rival') { o.glyph = 'sail'; o.tone = /fell/.test(o.lead) ? 'blood' : 'quiet'; o.lead = sc.lines.join(' '); } // a save from before the card carried its fight
  const aged = sc.aged || [];
  if (aged.length === 1) { const a = aged[0]; o.rows.push({ tone: 'quiet', t: `${a.n}, ${a.a}, died in his bed.`, s: a.m ? `${a.m} men walk home unled` : '' }); }
  else if (aged.length > 1) { const sum = aged.reduce((x, a) => x + a.m, 0); o.rows.push({ tone: 'quiet', t: `${aged.length} old men died in their beds.`, s: aged.map(a => `${a.n} ${a.a}`).join(' · ') + (sum ? ` · ${sum} men unled` : '') }); }
  for (const n of sc.gather || []) o.rows.push({ tone: 'omen', t: `${n}'s fleet is gathering.`, s: 'It sails on the hall next winter if he is still hostile. Warm him with silver in spring, or leave men home.' });
  if (sc.benchFull) o.rows.push({ tone: 'quiet', t: 'The benches are full.', s: `${T.benches} named men sit without land. No new man comes until one is given a holding.` });
  if (sc.answer) { const j = notable(sc.choice.j), d = S.children.find(c => c.id === sc.choice.d); o.rows.unshift(sc.answer === 'yes' ? { tone: 'boon', t: `${j ? j.name : 'He'} is kin.`, s: 'He kneels to your heir without a price.' } : { tone: 'quiet', t: `${d ? d.name : 'She'} stays in the hall.`, s: `${j ? j.name : 'He'} says nothing at the table.` }); }
  return o;
}
const cardRows = (rows, d0, beat) => rows.map((r, i) => `<div class="crow tone-${r.tone}${beat ? ' in' : ''}" style="animation-delay:${beat ? d0 + 120 * i : 0}ms"><i></i><div><div class="t">${esc(r.t)}</div>${r.s ? `<div class="s">${esc(r.s)}</div>` : ''}</div></div>`).join('');
const vsHTML = f => { const t = f.h + f.f || 1; return `<div class="vs ${f.fell ? 'fell' : 'held'}"><div class="lab"><span>Guard <b>${f.h}</b></span><span>the hall ${f.fell ? 'fell' : 'held'}</span><span>Fleet <b>${f.f}</b></span></div><div class="track"><i class="h" style="width:${100 * f.h / t}%"></i><i class="f" style="width:${100 * f.f / t}%"></i></div></div>`; };
const cardFoot = (label, small, cls, fn) => `<div class="cardfoot"><button class="${cls}" onclick="${fn}"><span>${esc(label)}</span><small>${esc(small)}</small></button></div>`;
function winterCardHTML(sc) {
  const k = S.king, o = cardRead(sc), beat = UI.cardYear !== S.year && !reducedMotion; if (UI.cardYear !== S.year) { UI.cardYear = S.year; UI.cardBeat = beat; }
  const j = sc.choice && notable(sc.choice.j), r = sc.roll, rolled = UI.rolled === S.year, d0 = beat ? 950 : 0;
  const suitor = j ? `<div class="suitor"><span class="nm">${esc(j.name)}, ${j.age}</span>${stanceTag(j)}<span class="st">Combat ${j.combat} · Rule ${j.rule} · Follow ${j.follow} · ${j.men} of ${fCap(S, j)} men</span></div>` : '';
  const chips = o.chips.length ? `<div class="cchips">${o.chips.map(c => typeof c === 'string' ? `<span class="cchip">${c}</span>` : `<span class="cchip ${c.cls || ''}">${c.h}</span>`).join('')}</div>${o.note ? `<div class="cnote">${esc(o.note)}</div>` : ''}` : '';
  const card = `<div class="tc"><div class="flip${beat ? ' down' : ''}" onclick="this.classList.remove('down')"><div class="face tone-${o.tone}"><div class="ctop">${ico(o.glyph)}<small>Winter ${S.year}</small></div>
    <h3>${esc(o.title)}</h3><p class="lead">${esc(o.lead)}</p>${suitor}${o.fight ? vsHTML(o.fight) : ''}${chips}</div>
    <div class="back"><span class="cyr">${S.year}</span><small>one card turns</small></div></div></div>`;
  const rows = o.rows.length ? `<div class="crows">${cardRows(o.rows, d0, beat)}</div>` : '';
  const roll = r ? `<div class="rollc${beat ? ' in' : ''}" style="animation-delay:${d0 + 120 * o.rows.length}ms"><div class="flip${rolled ? '' : ' down'}"><div class="face tone-${r.dies ? 'blood' : 'boon'}"><span class="cwho">${esc(k.name)} ${r.dies ? 'dies in his sleep.' : 'sees the spring.'}</span><span class="p">${Math.round(100 * r.p)}%</span><div class="strand"><i style="width:${100 - 100 * r.p}%"></i></div></div>
    <div class="back"><span class="cwho">${esc(k.name)}, ${k.age} · his winter</span><span class="p">${Math.round(100 * r.p)}%</span></div></div></div>` : '';
  let foot;
  if (j && !sc.answer) foot = `<div class="cardfoot two"><button class="primary" onclick="act(()=>answerSuitor(S,true))">Give her</button><button onclick="act(()=>answerSuitor(S,false))">Refuse</button></div>`;
  else if (r && !rolled) foot = cardFoot('Turn his card', `${Math.round(100 * r.p)}% · ${k.name}, ${k.age}`, 'roll', 'turnRoll(this)');
  else if (sc.kingSlain || (r && r.dies)) foot = cardFoot(`${k.name} is dead`, 'his saga', 'grave', 'act(()=>next(S))');
  else foot = cardFoot('Spring', String(S.year + 1), 'primary', 'act(()=>next(S))');
  return `<div class="overlay night"><div class="stage">${card}${rows}${roll}</div>${foot}</div>`;
}
// the King's card turns in place; the button names what follows once it has
function turnRoll(b) { UI.rolled = S.year; b.disabled = true; const f = $('.rollc .flip'); if (f) f.classList.remove('down'); setTimeout(render, reducedMotion ? 0 : 650); }
// the death card names how he died and who takes the hall, or that no one can (audit 3, TODO 29)
function deathHTML(sc) {
  const k = S.king, r = S.reign, sons = S.notables.filter(m => m.son && !m.isKing), inlaw = !sons.length && S.notables.filter(m => m.kin && !m.son && !m.isKing).sort((a, b) => a.age - b.age)[0];
  const cause = sc.cause === 'slain' ? 'Slain in the door of his hall.' : sc.cause === 'fell' ? `Fell in the shield wall at ${esc(sc.at)}.` : sc.kid ? `Died in his bed, the winter ${esc(sc.kid)} was born.` : sc.cause === 'age' ? 'Died in his bed.' : '';
  const boys = S.children.filter(c => c.sex === 'm' && !c.ofAge);
  const heir = sons.length ? `<div class="heir">${sons.length === 1 ? 'His heir' : 'His sons'}: <b>${sons.map(m => `${esc(m.name)}, ${m.age}`).join(' · ')}</b></div>`
    : inlaw ? `<div class="heir">No son of age. <b>${esc(inlaw.name)}</b>, married into the line, takes the hall.</div>`
    : `<div class="heir broken">No son of age. No kin to take the hall. The line is broken.${boys.length ? `<small>${boys.map(c => `${esc(c.name)} is ${c.age}`).join(' · ')}</small>` : ''}</div>`;
  const card = `<div class="dead in"><h3>${ico('death')}${esc(k.name)} is dead</h3>${cause ? `<div class="cause">${cause}</div>` : ''}<div class="meta">${k.age} winters · king ${r.start}–${S.year}${r.title ? ` · ${esc(r.title)}` : ''}</div>
    <p>${r.bestRaid ? `The year ${r.bestRaid.year}: ${esc(r.bestRaid.shore)} fell and the ship came home with ${r.bestRaid.loot} silver.` : 'He never took a shore.'} ${r.bestHoldings ? `At most ${plural(r.bestHoldings, 'holding')} answered to him.` : 'No holding ever answered to him.'}</p>${heir}</div>`;
  const foot = sons.length ? cardFoot('The heir', 'the jarls weigh him', 'primary', 'act(()=>startSuccession(S))') : inlaw ? cardFoot(`${inlaw.name} takes the hall`, 'a new king', 'primary', 'act(()=>startSuccession(S))') : cardFoot('The line is broken', 'the dynasty saga', 'grave', 'act(()=>startSuccession(S))');
  return `<div class="overlay night"><div class="stage">${card}</div>${foot}</div>`;
}

// ---- The battle (audit 4, option A with ceremony): the ranks, up to three exchanges each with its real roll, men falling where they fall, then the reckoning ----
const PHASE_NAME = { landing: 'The landing', wall: 'The shield wall', press: 'The press' };
const fightKey = sc => `${S.year}:${sc.shore}`;
const fightPlayed = sc => UI.fightDone === fightKey(sc) || reducedMotion;
const fightPlunders = sc => sc.win && !(S.queue[1] && S.queue[1].t === 'stay'); // the loot is already in the chest when there is no choice to make
const signed = v => `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v)}`;
const dayPct = r => signed(Math.round((r - 1) * 100)) + '%';
const VERDICT = sc => sc.win ? (sc.margin > 1 ? 'Rout' : sc.margin > 0.3 ? 'Victory' : 'A narrow thing') : 'Driven back';
const VTONE = { 'Rout': 'boon', 'Victory': 'win', 'A narrow thing': 'omen', 'Driven back': 'blood' };
function verdictLine(sc) { const p = sc.phases, at = PHASE_NAME[p[p.length - 1].k].replace(/^The /, 'the ');
  return sc.win ? (sc.margin > 1 ? `They break at ${at}.` : `They give way at ${at}.`) : p.length < 3 ? `The ship's men break at ${at}.` : 'Back to the ships.'; }
// the field: our strength as marks grouped by the man who leads them (the King's in accent), the coast's opposite, a front line between
function fieldSVG(sc, done) {
  const led = sc.crew.filter(c => c.men0 > 0), u = Math.max(1, Math.ceil(Math.max(sc.S, sc.D) / 120)), rows = 10, cell = 9, mid = 170, H = rows * cell + 4;
  const ours = []; led.forEach((c, g) => { const n = Math.max(1, Math.round(c.c0 * c.men0 / u)); for (let i = 0; i < n; i++) ours.push({ k: c.isKing, g }); });
  const nT = Math.max(1, Math.round(sc.D / u));
  // once fought, the fallen marks stay down, scattered (a fixed scatter, so the field looks the same each time it is drawn)
  const aboard = sc.crew.reduce((a, c) => a + c.men0, 0) || 1, lostO = done ? Math.round(sc.losses / aboard * ours.length) : 0, lostT = done ? Math.round(sc.phases.reduce((a, p) => a + p.dl, 0) * nT) : 0;
  const scatter = (n, k) => { const o = Array.from({ length: n }, (_, i) => i).sort((a, b) => ((a * 2654435761) % 997) - ((b * 2654435761) % 997)); return new Set(o.slice(0, k)); };
  const hitO = scatter(ours.length, lostO), hitT = scatter(nT, lostT);
  const pip = (x, y, cls, i) => `<rect class="${cls}" data-i="${i}" x="${x}" y="${y}" width="7" height="7" rx="1"/>`;
  return `<svg class="field" viewBox="0 0 340 ${H + 18}" aria-label="Ship ${sc.S} against ${sc.D} defenders">
    <line class="front" x1="${mid}" y1="0" x2="${mid}" y2="${H}"/>
    <g class="ours">${ours.map((p, i) => pip(mid - 10 - (Math.floor(i / rows) + 1) * cell, 2 + (i % rows) * cell, `us${p.k ? ' k' : ''}${hitO.has(i) ? ' hit' : ''}`, i)).join('')}</g>
    <g class="theirs">${Array.from({ length: nT }, (_, i) => pip(mid + 12 + Math.floor(i / rows) * cell, 2 + (i % rows) * cell, `them${hitT.has(i) ? ' hit' : ''}`, i)).join('')}</g>
    <text x="${mid - 10}" y="${H + 14}" text-anchor="end">Ship <tspan class="b">${sc.S}</tspan></text><text x="${mid + 12}" y="${H + 14}">${esc(shoreOf(sc.shore).name)} <tspan class="b">${sc.D}</tspan></text>
    <text class="u" x="0" y="${H + 14}">1 mark = ${u}</text></svg>`;
}
function crewChips(sc, done) {
  const risk = sc.risk == null ? sc.fallP : sc.risk;
  return `<div class="bchips">${sc.crew.map((c, i) => `<span class="bchip${c.isKing ? ' king' : ''}${done && c.fell ? ' fell' : ''}" data-i="${i}">${esc(c.name)}${c.isKing ? ` <b>${Math.round(100 * risk)}%</b>` : ''}</span>`).join('')}</div>
    <div class="brisk">${risk > 0.0005 ? `Each named man aboard: <b>${Math.round(1000 * risk) / 10}%</b> to fall this day.` : 'No named man is likely to fall this day.'}</div>`;
}
function phaseRows(sc, upto) {
  const nm = shoreOf(sc.shore).name;
  return sc.phases.slice(0, upto).map(p => `<div class="xrow"><span class="xn">${PHASE_NAME[p.k]}</span><span class="xd">the day <b>${dayPct(p.roll)}</b></span>
    <span class="xs">ship fights as <b>${Math.round(sc.S * p.roll)}</b> · −${p.men} men · ${nm} loses ${Math.round(100 * p.dl)}%${p.fell.length ? ` · <em>${esc(p.fell.join(', '))} fell</em>` : ''}</span></div>`).join('');
}
function reckonHTML(sc) {
  const worth = sc.losses * T.manPrice, plundered = fightPlunders(sc), net = (plundered ? sc.loot : 0) - worth, nm = shoreOf(sc.shore).name, r = [];
  if (sc.win) r.push([plundered ? 'Loot, into the chest' : 'Loot, if you plunder', `<span class="up">+${sc.loot}</span>`]);
  r.push([`Men lost, ${worth} silver of men`, `<span class="down">−${sc.losses}</span>`]);
  if (plundered || !sc.win) r.push(['The raid, all told', `<span class="${net >= 0 ? 'up' : 'down'}">${signed(net)} silver</span>`, 'net']);
  r.push([`${esc(nm)}'s defenders`, `<s>${sc.def0}</s> ${sc.def1}`]);
  if (sc.owner) r.push([`${esc(sc.owner.name)}, whose coast`, sc.owner.st0 === sc.owner.st1 ? `still ${sc.owner.st1}` : `${sc.owner.st0} → ${sc.owner.st1}`]);
  const led = sc.crew.filter(c => c.isKing || c.men0 > 0 || c.fell), idle = sc.crew.filter(c => !(c.isKing || c.men0 > 0 || c.fell));
  const gains = c => { if (c.fell) return c.isKing ? '<em>fell in the shield wall</em>' : `<em>fell</em>${c.unled ? ` · ${c.unled === 1 ? 'one man walks' : `${c.unled} men walk`} home unled` : ''}`;
    const g = []; if (c.men0 - c.men1) g.push(`−${c.men0 - c.men1} men`); if (c.f1 > c.f0) g.push(`<b>Follow ${c.f0} → ${c.f1}</b>`); if (c.c1 > c.c0) g.push(`<b>Combat ${c.c0} → ${c.c1}</b> · raid ${c.raids}`);
    if (!c.isKing && c.d > 0) g.push(`<b>↑</b> ${c.st1}`); else if (!c.isKing && c.d < 0) g.push(`<em>↓</em> ${c.st1}`); return g.join(' · ') || 'unhurt'; };
  const tag = c => c.isKing ? 'King' : c.son ? 'son' : c.kin ? 'kin' : '';
  return `<div class="acct">${r.map(([a, b, c]) => `<span class="${c || ''}">${a}</span><span class="${c || ''}">${b}</span>`).join('')}</div>
    <h2>The crew</h2><div class="bcrew">${led.map(c => `<div class="cm${c.fell ? ' fell' : c.f1 > c.f0 || c.c1 > c.c0 ? ' up' : ''}"><i></i><div><div class="n">${esc(c.name)}${tag(c) ? `<small>${tag(c)}</small>` : ''}</div><div class="g">${gains(c)}</div></div><div class="m">${c.fell ? '—' : `<b>${c.men1}</b> of ${c.men0}`}</div></div>`).join('')}</div>
    ${idle.length ? `<div class="cnote">${esc(idle.map(c => c.name).join(', '))} sailed with no men to lead.</div>` : ''}`;
}
function fightFoot(sc) {
  const nx = S.queue[1], king = sc.crew.find(c => c.isKing && c.fell);
  if (nx && nx.t === 'stay') return cardFoot('Plunder or stay', `${shoreOf(sc.shore).name} can be held`, 'primary', 'act(()=>next(S))');
  if (king) return cardFoot(`${king.name} is dead`, 'his saga', 'grave', 'act(()=>next(S))');
  return cardFoot('Home', `Autumn ${S.year}`, 'primary', 'act(()=>next(S))');
}
function fightHTML(sc) {
  if (!sc.phases) { const x = shoreOf(sc.shore); return `<div class="overlay"><div class="scene"><h1>${ico('axe')}${esc(x.name)}</h1><p>${sc.win ? `${sc.loot} silver in loot.` : 'No loot.'} ${sc.losses} men lost.</p><div class="actions"><button class="primary" onclick="act(()=>next(S))">On</button></div></div></div>`; } // a save from before the battle
  const done = fightPlayed(sc), x = shoreOf(sc.shore), v = VERDICT(sc), king = sc.crew.find(c => c.isKing && c.fell);
  const title = done && king ? `${king.name} falls at ${x.name}` : x.name;
  const head = `<div class="bhead${done && king ? ' grave' : ''}">${ico(done && king ? 'death' : 'axe')}<div><h3>${esc(title)}</h3><small>Summer ${S.year} · sailed on <b>${Math.round(100 * sc.odds)}%</b> · ${oddsWords(sc.S, sc.D)}</small></div></div>`;
  const banner = `<div class="bphase"><span class="pn">${done ? '' : 'The ships run in'}</span><span class="pd"></span></div>`;
  const verdict = `<div class="bverdict tone-${VTONE[v]}${done ? '' : ' wait'}"><span class="w">${v}.</span><span class="l">${verdictLine(sc)}</span></div>`;
  const after = `<div class="reckon${done ? '' : ' wait'}">${reckonHTML(sc)}</div>`;
  const foot = done ? fightFoot(sc) : `<div class="cardfoot"><button class="ghost" onclick="skipFight()"><span>Skip the battle</span><small>tap anywhere</small></button></div>`;
  return `<div class="overlay night battle"><div class="stage" ${done ? '' : 'onclick="skipFight()"'}><div class="bcard${done ? ' done' : ''}">${head}<div class="bfield">${banner}${fieldSVG(sc, done)}</div>${crewChips(sc, done)}<div class="xrows">${phaseRows(sc, done ? sc.phases.length : 0)}</div>${verdict}</div>${after}</div>${foot}</div>`;
}
function skipFight() { const sc = S.queue[0]; if (!sc || sc.t !== 'fight') return; UI.fightDone = fightKey(sc); clearFight(); render(); }
function clearFight() { (UI.fightT || []).forEach(clearTimeout); UI.fightT = []; }
// plays the battle on the sheet just drawn: each exchange shows its roll, the ranks close, marks fall at scattered moments, the front line moves
function playFight(sc) {
  clearFight(); const T0 = [], at = (ms, fn) => T0.push(setTimeout(fn, ms)); UI.fightT = T0;
  const root = $('.battle'); if (!root) return; const svg = root.querySelector('.field'), ours = [...svg.querySelectorAll('.ours rect')], theirs = [...svg.querySelectorAll('.theirs rect')];
  const pn = root.querySelector('.bphase .pn'), pd = root.querySelector('.bphase .pd'), front = svg.querySelector('.front'), xr = root.querySelector('.xrows');
  const aboard = sc.crew.reduce((a, c) => a + c.men0, 0) || 1, mid = 170, shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const aliveO = shuffle([...ours]), aliveT = shuffle([...theirs]); let t = 900, sum = 0;
  const fall = (el, d) => at(d, () => { el.classList.add('hit'); });
  sc.phases.forEach((p, i) => {
    at(t, () => { pn.textContent = PHASE_NAME[p.k]; pn.classList.remove('in'); void pn.offsetWidth; pn.classList.add('in'); pd.textContent = ''; svg.classList.remove('close'); });
    // the day's roll: the number tumbles, then lands on the real one
    for (let k = 0; k < 9; k++) at(t + 350 + k * 55, () => { pd.textContent = 'the day ' + dayPct(0.82 + Math.random() * 0.36); });
    at(t + 860, () => { pd.textContent = 'the day ' + dayPct(p.roll); pd.classList.add('set'); });
    at(t + 1050, () => { pd.classList.remove('set'); svg.classList.add('close'); });
    // the men fall, ours and theirs, at scattered moments over the clash
    const nO = Math.min(aliveO.length, Math.round(p.men / aboard * ours.length)), nT = Math.min(aliveT.length, Math.round(p.dl * theirs.length));
    aliveO.splice(0, nO).forEach(el => fall(el, t + 1100 + Math.random() * 1300));
    aliveT.splice(0, nT).forEach(el => fall(el, t + 1100 + Math.random() * 1300));
    // a named man falls: his name on the field, his chip struck, the field shudders
    p.fell.forEach((name, j) => at(t + 1500 + j * 450, () => {
      const c = sc.crew.findIndex(x => x.name === name), chip = root.querySelector(`.bchip[data-i="${c}"]`); if (chip) chip.classList.add('fell');
      root.querySelector('.bfield').insertAdjacentHTML('beforeend', `<span class="bfall${sc.crew[c] && sc.crew[c].isKing ? ' king' : ''}">${esc(name)} falls</span>`);
      root.querySelector('.bcard').classList.remove('shake'); void root.offsetWidth; root.querySelector('.bcard').classList.add('shake');
      try { navigator.vibrate && navigator.vibrate(sc.crew[c] && sc.crew[c].isKing ? [80, 60, 140] : 60); } catch (e) {}
    }));
    // the front line moves with the running strength of the day
    sum += p.roll; const m = sc.S * sum / (i + 1), adv = Math.max(-1, Math.min(1, (m - sc.D) / (m + sc.D)));
    at(t + 2400, () => { front.setAttribute('x1', mid + adv * 40); front.setAttribute('x2', mid + adv * 40); xr.insertAdjacentHTML('beforeend', phaseRows({ ...sc, phases: [p] }, 1)); xr.lastElementChild.classList.add('in'); });
    t += 2900 + p.fell.length * 450;
  });
  at(t, () => { pn.textContent = ''; pd.textContent = ''; svg.classList.remove('close'); const v = root.querySelector('.bverdict'); v.classList.remove('wait'); v.classList.add('stamp'); });
  at(t + 900, () => { UI.fightDone = fightKey(sc); render(); // the band counts the day in
    const st = $('.battle .stage'), vd = $('.bverdict'); if (st && vd && st.scrollTo) st.scrollTo({ top: Math.max(0, vd.offsetTop - 120), behavior: 'smooth' }); // bring the verdict and the reckoning up
    const top = $('.top'), b = top ? top.querySelectorAll('.res b') : []; if (b.length >= 2) { b[0].textContent = S.silver - (fightPlunders(sc) ? sc.loot : 0); b[1].textContent = S.men + sc.losses; countUp(top); } });
}

// Plunder or stay as a trade (audit 4): the loot now against the rent, the unrest in one line, the king's price, and each jarl's chance to hold next summer
function stayHTML(sc) {
  const x = shoreOf(sc.shore), pay = holdPay(x), un = stayUnrest(S, x), own = ownerOf(S, x.id), back = Math.ceil(sc.loot / pay), spare = unledMen(S);
  const test = (r, men, cap) => { const pNow = holdOdds(r * men, un), pFull = holdOdds(r * cap, un), need = Math.floor(un / (0.85 * r)) + 1;
    const tag = pNow >= .97 ? ['sure', 'holds'] : need <= cap ? ['fill', `send ${need - men}`] : pFull >= .4 ? ['fill', `${Math.round(100 * pFull)}% at best`] : ['no', 'cannot hold'];
    return { pNow, pFull, tag, score: 2 * pNow + pFull, why: `Rule ${r} × ${men} = <b>${r * men}</b> vs ${un} · ${Math.round(100 * pNow)}%${pNow < .97 ? ` · with ${cap} men <b>${r * cap}</b> · ${Math.round(100 * pFull)}%` : ''}` }; };
  const rows = [];
  if (sc.walked) { const w = x.walked, cap = w.follow * T.menPerF; rows.push({ walked: true, key: 'walked', fn: "chooseStay(S,'walked')", who: w.name, name: `${w.name} kneels and keeps it`, st: `C ${w.combat} · R ${w.rule} · F ${w.follow} · brings no men · leads ${cap}`, h: test(w.rule, 0, cap) }); }
  for (const m of S.notables.filter(m => m.place === 'ship' && !m.isKing)) { const cap = fCap(S, m); rows.push({ key: m.id, fn: `chooseStay(S,'${m.id}')`, who: m.name, men: m.men, name: `${m.name} stays`, st: `C ${m.combat} · R ${m.rule} · F ${m.follow} · age ${m.age} · ${m.men} of ${cap} men`, h: test(m.rule, m.men, cap) }); }
  rows.sort((a, b) => (b.walked ? 1 : 0) - (a.walked ? 1 : 0) || b.h.score - a.h.score);
  const shown = UI.stayAll === sc.shore + S.year ? rows : rows.slice(0, 4);
  // a tap picks a jarl; leaving him is a second, named button, so a stray tap gives nothing away (session 13)
  const at = sc.shore + S.year, pick = UI.stayPick && UI.stayPick.at === at ? UI.stayPick.key : null;
  const confirm = r => `<div class="jconfirm"><p>${r.walked ? `${esc(r.who)} kneels and keeps ${esc(x.name)}. He brings no men; send them from home next spring.` : `${esc(r.who)} stays at ${esc(x.name)} with his ${r.men} men. They do not sail home, and the loot is left.`}</p>
    <div class="actions"><button onclick="UI.stayPick=null;render()">Not him</button><button class="primary" onclick="UI.stayPick=null;act(()=>${r.fn})">Leave ${esc(r.who)}</button></div></div>`;
  let owner = '';
  if (own) { const rest = own.coasts.filter(c => c !== own.anchor), held = rest.filter(c => isHolding(S, c)).length, seat = own.anchor === x.id;
    owner = `<p class="rule1">${esc(x.name)} is <b>${esc(own.name)}'s${seat ? ' seat' : ''}</b>. ${stanceWord(own.stance) === stanceWord(own.stance - T.takeSour) ? `He stays ${stanceWord(own.stance)}.` : `He sours: ${stanceWord(own.stance)} → ${stanceWord(own.stance - T.takeSour)}.`}${seat ? '' : ` His realm: ${held} of ${rest.length} coasts held${held + 1 >= rest.length ? ', and this makes it whole. He bends; three summers held and he kneels.' : ` → ${held + 1}.`}`}</p>`; }
  return `<h1>${ico('land')}Plunder or stay?<span class="sub">${esc(x.name)}</span></h1>
    <div class="trade"><div class="pl"><div class="k">Plunder</div><div class="v">${sc.loot}<small>now</small></div><div class="s">and sail home</div></div>
    <div><div class="k">Stay</div><div class="v">${pay}<small>a year</small></div><div class="s">from next summer · ${back} ${back === 1 ? 'summer' : 'summers'} to earn ${sc.loot}</div></div></div>
    <button class="primary pbtn" onclick="act(()=>choosePlunder(S))">Plunder · ${sc.loot} silver</button>
    <p class="rule1">Unrest <b>${un}</b>. Next summer the jarl's Rule × men must beat it; it falls 5 for each summer held. This summer is free.${spare ? ` ${spare} men sit unled at home to send.` : ''}</p>${owner}
    <h2>Or leave a jarl</h2>${shown.map(r => `<button class="jr${pick === r.key ? ' on' : ''}" onclick="UI.stayPick=${pick === r.key ? 'null' : `{at:'${at}',key:'${r.key}'}`};render()"><span class="nm">${esc(r.name)}</span><span class="ok ${r.h.tag[0]}">${r.h.tag[1]}</span><span class="st">${r.st}</span><span></span><span class="jwhy">${r.h.why}</span></button>${pick === r.key ? confirm(r) : ''}`).join('')}
    ${rows.length > shown.length ? `<button class="more" onclick="UI.stayAll='${sc.shore + S.year}';render()">${rows.length - shown.length} more who could stay</button>` : ''}
    ${!rows.length ? '<div class="empty">The King cannot stay. Only another jarl can hold a shore.</div>' : ''}`;
}
// ---- Scenes -------------------------------------------------------------------------------
function overlayHTML(sc) {
  if (sc.t === 'event') return winterCardHTML(sc); // the winter card turns on the night (audit 3)
  if (sc.t === 'death') return deathHTML(sc);
  const btn = (t, fn, cls = 'primary') => `<button class="${cls}" onclick="act(()=>${fn})">${t}</button>`;
  let h = '';
  if (sc.t === 'intro') h = `<h1>${ico('hall')}${S.year}. Spring.</h1><p>You are ${esc(S.king.name)}, twenty, with a hall, forty men, and one ship.</p><p><b>Tap a coast. Put men aboard. Press Sail.</b></p><p>Men on the ship raid. Men on the land hold. Men at home eat. Each named man leads F × 10.</p><p>Every summer the fleet sails. Every winter one card turns. Past fifty, every winter rolls against you. The year, up top, opens the Saga.</p><div class="actions">${btn('Begin', 'next(S)')}</div>`;
  else if (sc.t === 'fork') h = `<h1>${ico('fork')}${esc(S.king.name)} is ${S.king.age}</h1><p>What they call him is what he did. Choose one.</p>${sc.offers.map(k => `<div class="pick" onclick="act(()=>takeTitle(S,'${k}'))"><span class="name">${TITLES[k].name}</span><br><span class="stats">${TITLES[k].text}</span></div>`).join('')}`;
  else if (sc.t === 'noSail') h = `<h1>Summer</h1><p>The ship stays beached. The land contests itself.</p><div class="actions">${btn('On', 'next(S)')}</div>`;
  else if (sc.t === 'arrive') { const Sh = strengthShip(S), king = S.notables.find(m => m.isKing && m.place === 'ship'), xs = sc.targets.map(shoreOf), all = xs.every(x => winOdds(Sh, x.def) < 0.4);
    const best = xs.filter(x => winOdds(Sh, x.def) >= 0.97).sort((a, b) => b.loot - a.loot)[0];
    h = `<h1>${ico('ship')}Landfall</h1>${mapHTML(sc.targets)}<p>The fog lifts. Ship strength <b class="rich">${Sh}</b>.${king ? ` ${esc(king.name)} is aboard.` : ''}</p>${xs.map(x => { const p = winOdds(Sh, x.def), f = shipRisk(S, x.def).fall, own = ownerName(x.id);
      return `<div class="pick lf" onclick="act(()=>chooseTarget(S,'${x.id}'))"><div class="row"><span class="name">${esc(x.name)}</span><span class="pc ${oddsTemp(Sh, x.def)}">${Math.round(100 * p)}%</span></div>
      <div class="stats">loot <b class="rich">${x.loot}</b> · ${x.def} defenders${x.holdable ? ' · holdable' : ''}${x.walked ? ` · ${esc(x.walked.name)} holds it` : own ? ` · ${esc(own)}'s` : ''}${x === best ? ' · <b class="best">the best of them</b>' : ''}</div>
      <div class="stats">${oddsWords(Sh, x.def)}${f >= 0.0005 ? ` · ${king ? esc(king.name) : 'each man'} ${Math.round(1000 * f) / 10}% to fall` : ''}</div></div>`; }).join('')}
    <button class="home${all ? ' call' : ''}" onclick="act(()=>turnHome(S))"><span>Turn for home</span><small>${all ? 'nothing here worth the men' : 'the summer is spent, no blood'}</small></button>`; }
  else if (sc.t === 'ruler') { const k = S.rulers[sc.ruler], w = stanceWord(k.stance), newest = k.newest && shoreOf(k.newest);
    h = `<h1>${ico('crown')}${esc(k.name)}</h1><p class="stats">${esc(k.title)}</p>
    <p>${sc.envoy ? `His envoy comes over the ice with gifts and a long look at the hall. ${esc(k.name)}'s reach has grown${newest ? ` to ${esc(newest.name)}` : ''}, and now it touches yours.` : `The men bring back a king's name.`} He holds ${realmList(k)}.</p>
    <p>He is <b class="st-${w}">${w}</b> toward you. Raid his coasts and he sours. Hold every one but ${esc(shoreOf(k.anchor).name)} and he breaks.</p>
    <div class="actions">${btn('On', 'next(S)')}</div>`; }
  else if (sc.t === 'fight') return fightHTML(sc); // the battle (audit 4)
  else if (sc.t === 'stay') h = stayHTML(sc); // a trade (audit 4)
  else if (sc.t === 'summary') h = `<h1>${esc(sc.title)}</h1>${sc.lines.map(l => `<p>${esc(l)}</p>`).join('')}<div class="actions">${btn('On', 'next(S)')}</div>`;
  else if (sc.t === 'winter') h = winterHTML(sc); // the autumn ledger and the market (TODO 20, audit 2)
  else if (sc.t === 'heir') h = `<h1>${ico('men')}The Heir</h1><p>Pick a son. The jarls will weigh his Rule against their own following.</p>${sc.sons.map(id => { const m = notable(id); return `<div class="pick" onclick="act(()=>chooseHeir(S,'${id}'))"><span class="name">${esc(m.name)}</span><br>${statLine(m)}</div>`; }).join('')}`;
  else if (sc.t === 'oath') { const j = notable(sc.jarl), h2 = S.holdings.find(h => h.id === j.place);
    h = `<h1>${ico('oath')}${esc(j.name)} of ${esc(h2.name)}</h1><p>${statLine(j)} · ${j.men} men</p>${sc.kneels ? `<p class="rich">He kneels${j.kin ? ' — he is kin' : ''}.</p><div class="actions">${btn('On', 'oathPay(S,false)')}</div>`
      : `<p>He hesitates. His following outweighs the heir's Rule.</p><p>Price of his knee: <b class="rich">${sc.price}</b> silver. You have ${S.silver}.</p><div class="actions">${btn(`Pay ${sc.price}`, 'oathPay(S,true)', S.silver >= sc.price ? 'primary' : '')}${btn('Let him walk with his holding', 'oathPay(S,false)', '')}</div>`}`; }
  else if (sc.t === 'coronation') h = `<h1>${ico('hall')}${esc(S.king.name)}, king</h1><p>${S.holdings.length} holdings. ${S.men} men. ${S.silver} silver.</p><p>Same screen. Smaller kingdom.</p><div class="actions">${btn('First spring', 'finishCoronation(S)')}</div>`;
  else if (sc.t === 'end') h = `<h1>${sc.reason === '1066' ? 'The dynasty ends at 1066' : 'The line is broken'}</h1><p>${sc.reason === '1066' ? 'The age of the sea kings is over.' : 'No son, no son-in-law. The strongest jarl takes the hall.'}</p><h2>Dynasty Saga</h2>${dynastyHTML()}<div class="actions">${btn('Begin again', `archive(S,'${sc.reason === '1066' ? 'reached 1066' : 'the line broke'}');S=null`)}</div>`;
  return `<div class="overlay"><div class="scene">${h}</div></div>`;
}
render();
