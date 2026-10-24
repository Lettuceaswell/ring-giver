let S = migrate(load());
// screen state that is not game state: which pane, the picker, the open Man card, the Saga sheet, the two-tap arm, and what changed since the band last showed it
const UI = { pane: 'map', picker: false, man: null, saga: false, armed: 0, scroll: {}, pend: { silver: 0, men: 0 } };
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
  const sheet = S.queue.length ? overlayHTML(S.queue[0]) : UI.man ? manSheet(UI.man) : UI.saga ? sagaSheet() : UI.picker ? pickerHTML() : '';
  app.innerHTML = bandHTML(!S.queue.length) + paneHTML() + footHTML() + sheet;
  const p = $('.pane'); if (p) p.scrollTop = UI.scroll[UI.pane] || 0;
}
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
function startGame(k) { S = newGame(k); UI.pane = 'map'; save(S); render(); }
function startCustom() { const name = $('#cname').value.trim() || 'Halfdan'; S = newGame('custom', Object.assign([cust.c, cust.r, cust.f], { name })); UI.pane = 'map'; save(S); render(); }

// ---- The band: year, king, silver and men; tap it for the Saga. What changed shows once, when the band is in view (TODO 21) ----
function bandHTML(quiet) {
  const k = S.king, titles = k.titles.map(t => `<span class="tag">${TITLES[t].name}</span>`).join('');
  const nextFork = T.forkAges.find(a => a > k.age);
  const show = quiet || UI.man || UI.saga, d = UI.pend;
  const delta = v => show && v ? `<span class="delta ${v > 0 ? 'up' : 'down'}">${v > 0 ? '+' : ''}${v}</span>` : '';
  const h = `<div class="top" onclick="UI.saga=true;render()"><div><div class="year">${S.year}</div><div class="king">${esc(k.name)}, ${k.age}${titles}${nextFork ? ` · fork at ${nextFork}` : ''}${k.age > 50 ? ` · <span class="death">death ${Math.round(5 * (k.age - 50) * (has(S,'oldwise') ? .5 : 1))}%</span>` : ''}</div></div>
    <div class="res">${delta(d.silver)}<b>${S.silver}</b> silver<br>${delta(d.men)}${unledMen(S)} unled / <b>${S.men}</b> men</div></div>`;
  if (show) UI.pend = { silver: 0, men: 0 };
  return h;
}

// ---- Panes: Map, Ship, Hall. Each fits one screen; the band above, the Sail bar and tabs below (TODO 19) ----
function paneHTML() {
  const ship = S.notables.filter(m => m.place === 'ship'), home = S.notables.filter(m => m.place === 'home');
  const body = UI.pane === 'ship' ? shipPane(ship) : UI.pane === 'hall' ? hallPane(home) : mapPane(ship);
  return `<div class="pane ${UI.pane}">${body}</div>`;
}
function mapPane(ship) { return mapHTML() + destHTML(ship) + wandererHTML(); }
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
  return `<div class="foot">${sailButton(ship)}<nav class="tabs">${tab('map', 'Map', 'map')}${tab('ship', 'Ship', 'ship', ship.reduce((a, m) => a + m.men, 0))}${tab('hall', 'Hall', 'hall', S.holdings.length)}</nav></div>`;
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
    <span class="pname">${esc(x.name)}${x.walked ? `<small>${esc(x.walked.name)}'s now</small>` : own ? `<small>${esc(own)}'s realm</small>` : x.rumored && !x.seen ? '<small>rich, by rumor</small>' : ''}</span>
    <span class="pnum rich">${x.seen ? x.loot : '?'}</span><span class="pnum">${x.seen ? x.def : '?'}</span>
    <span class="psub">${x.seen ? oddsWords(Sh, x.def) : 'unknown'} · ${x.holdable ? 'holdable' : 'cannot hold'}</span></div>`; };
  const blind = `<div class="prow blind${S.destination === 'blind' ? ' sel' : ''}" onclick="act(()=>{setDestination(S,'blind');UI.picker=false})">
    <span class="pname">Sail blind</span><span class="pnum">—</span><span class="pnum">—</span><span class="psub">${has(S,'farsailor') ? 5 : 3} dark coasts · fog until you arrive</span></div>`;
  return `<div class="overlay" onclick="if(event.target===this){UI.picker=false;render()}"><div class="scene">
    <h1>${ico('ship')}Where?</h1><p>Ship strength <b class="rich">${Sh}</b>. Richest first. Tapping a coast on the map works too.</p>
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
    <div class="men"><button ${spring ? '' : 'disabled'} onclick="act(()=>addMen(S,'${m.id}',-5))">−</button><span class="n">${m.men}<div class="cap">of ${cap}</div></span><button ${spring ? '' : 'disabled'} onclick="act(()=>addMen(S,'${m.id}',5))">+</button></div></div>
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
function wandererHTML() {
  if (S.phase !== 'spring') return '';
  const p = rumorPrice(S);
  return `<div class="card row wand"><span>${ico('wanderer')}<span>${S.rumorOffer === 'none' ? 'The Wanderer knows nothing new within reach.' : S.rumorOffer ? `The Wanderer names <b class="rich">${esc(shoreOf(S.rumorOffer).name)}</b>.` : 'The Wanderer sells the name of a rich coast.'}</span></span>
    <button class="small" ${S.silver < p || S.rumorOffer ? 'disabled' : ''} onclick="act(()=>buyRumor(S))">Rumor · ${p}</button></div>`;
}
function reignRow(d) {
  return `<div class="card"><span class="name">${esc(d.king)}</span> <span class="stats">${d.from}–${d.now ? 'now' : d.to}${d.title ? ' · ' + d.title : ''}</span><br><span class="stats">${d.bestRaid ? `Richest raid: ${esc(d.bestRaid.shore)}, ${d.bestRaid.loot} silver (${d.bestRaid.year}). ` : 'Never raided. '}Most holdings: ${d.bestHoldings}.</span></div>`;
}
function dynastyHTML() { return S.dynasty.map(reignRow).join('') + `<div class="hint">Generation ${S.gen}. World seed ${S.day}.</div>`; }
function mapHTML(targets) {
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
    return `<g class="${tgt ? 'tgt' : targets ? 'dim' : ''}${can ? ' tap' : ''}" ${can ? `onclick="act(()=>setDestination(S,'${x.id}'))"` : ''}>${can ? `<circle class="hit" cx="${x.x}" cy="${x.y}" r="13"/>` : ''}<circle class="coast ${cls}" cx="${x.x}" cy="${x.y}" r="${r.toFixed(1)}"/>${S.destination === x.id && !targets ? `<circle class="dest" cx="${x.x}" cy="${x.y}" r="${(r + 4).toFixed(1)}"/>` : ''}${tgt ? `<circle class="ring" cx="${x.x}" cy="${x.y}" r="${(r + 5).toFixed(1)}"/>` : ''}<text class="lbl${L ? ' l' : AB ? ' c' : ''}" x="${lx}" y="${ly}">${esc(x.name)}</text>${kname}</g>`; }).join('')
    + dark.map(x => `<circle class="coast dark" cx="${x.x}" cy="${x.y}" r="2"/>`).join('');
  // crop to what is drawn, with room for the labels; never narrower than the eye expects
  const all = targets ? targets.map(id => S.shores[id]) : [...known, ...dark], pad = targets ? 40 : 28;
  let x0 = Math.min(...all.map(x => x.x - (x.side === 'l' ? 40 : 0))) - pad, x1 = Math.max(...all.map(x => x.x + (x.side === 'l' ? 0 : 40))) + pad, y0 = Math.min(...all.map(x => x.y)) - pad, y1 = Math.max(...all.map(x => x.y)) + pad;
  const minW = 220, minH = 150;
  if (x1 - x0 < minW) { const c = (x0 + x1) / 2; x0 = c - minW / 2; x1 = c + minW / 2; }
  if (y1 - y0 < minH) { const c = (y0 + y1) / 2; y0 = c - minH / 2; y1 = c + minH / 2; }
  if ((y1 - y0) / (x1 - x0) > 1.1) { const c = (x0 + x1) / 2, w = (y1 - y0) / 1.1; x0 = c - w / 2; x1 = c + w / 2; }
  return `<svg class="map${targets ? ' landfall' : ''}" viewBox="${x0.toFixed(0)} ${y0.toFixed(0)} ${(x1 - x0).toFixed(0)} ${(y1 - y0).toFixed(0)}"><path class="land" d="${COAST_PATH}"/>${realms}${edges}${dots}</svg>`;
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
    <h1>${ico('oath')}Saga</h1><p class="stats">Generation ${S.gen} · the seas of ${S.day}</p>
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
    <div class="row" style="margin-top:10px"><span>Men he leads</span><div class="men"><button onclick="act(()=>addMen(S,'${m.id}',-5))">−</button><span class="n">${m.men}<div class="cap">of ${cap}</div></span><button onclick="act(()=>addMen(S,'${m.id}',5))">+</button></div></div>
    ${m.isKing ? '' : `<h2>Warm him</h2>
    <div class="where"><button class="small" ${S.silver < price || gifted ? 'disabled' : ''} onclick="act(()=>gift(S,'${m.id}'))">${gifted ? 'Gifted this year' : `Gift ${price} silver`}</button><span class="hint" style="margin:0;align-self:center">once a year · +${T.giftWarm}</span></div>
    ${!m.kin && daughters.length ? `<div class="where" style="margin-top:8px">${daughters.map(d => `<button class="small" onclick="act(()=>marry(S,'${d.id}','${m.id}'))">Marry ${esc(d.name)} to him</button>`).join('')}<span class="hint" style="margin:0;align-self:center">he is kin then · +30</span></div>` : ''}`}`;
  const children = m.isKing && S.children.length ? `<h2>Children</h2><p class="stats">${S.children.map(c => `${esc(c.name)} ${c.age}${c.married ? `, wife of ${esc(c.married)}` : ''}`).join(' · ')}</p>` : '';
  return `<div class="overlay" onclick="if(event.target===this){UI.man=null;render()}"><div class="scene">
    <h1>${esc(m.name)}${m.isKing ? '<span class="tag">King</span>' : ''}${m.son ? '<span class="tag kin">Son</span>' : m.kin ? '<span class="tag kin">Kin</span>' : ''}</h1>
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
    <h1>${ico('crown')}${esc(k.name)}</h1><p class="stats">${esc(k.title)}</p>
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
  // one sheet for the turn of the year: what the land did, what the hall ate, and the market with its frame of reference (TODO 20)
  else if (sc.t === 'winter') { const p = has(S,'fairdealer') ? 2 : T.manPrice, room = menRoom(S);
    h = `<h1>${ico('silver')}Winter ${S.year}</h1>
    ${sc.land.length ? `<h2>The land</h2>${sc.land.map(l => `<p>${esc(l)}</p>`).join('')}` : ''}
    ${sc.hall.length ? `<h2>The hall eats</h2>${sc.hall.map(l => `<p>${esc(l)}</p>`).join('')}` : ''}
    <h2>The market</h2>
    <p>A man costs <b class="rich">${p}</b> silver and eats 1 each winter at home. You have <b class="rich">${S.silver}</b> silver and ${S.men} men.</p>
    <p>${room ? `Your named men can lead <b>${room}</b> more. Past that, men sit unled: fed, no use.` : 'Your named men lead all they can. New men would sit unled until another man comes to the hall.'}</p>
    <div class="actions"><div class="row">${[5, 10, 20].map(n => `<button ${S.silver >= n * p ? '' : 'disabled'} onclick="act(()=>buyMen(S,${n}))">Buy ${n} · ${n * p}</button>`).join('')}</div>${btn('Close the market', 'closeWinter(S)')}</div>`; }
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
