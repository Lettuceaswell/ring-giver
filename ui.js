let S = load();
const $ = sel => document.querySelector(sel);
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const statLine = m => `<span class="stats">C <b>${m.combat}</b> · R <b>${m.rule}</b> · F <b>${m.follow}</b> · age ${m.age}</span>`;
const shoreOf = id => S.shores[id];
const notable = id => S.notables.find(m => m.id === id);
// line icons at the brand's thin strand weight: one stroke, no fills, nothing that is a symbol
const ICONS = {
  ship: '<path d="M3 13c2 3 4 4 7 4s5-1 7-4l-1-1H4z M10 12V4 M10 4c3 1 5 3 6 7 M10 4c-3 1-5 3-6 7"/>',
  hall: '<path d="M3 10l7-6 7 6 M5 9v8h10V9 M9 17v-4h2v4"/>',
  land: '<path d="M3 16h14 M5 16V9l5-5 5 5v7 M3 7l2 2 M17 7l-2 2"/>',
  silver: '<path d="M10 3a7 7 0 1 0 0 14"/><path d="M10 3a7 7 0 0 1 0 14" stroke-dasharray="2 2.6"/>',
  men: '<circle cx="7" cy="7" r="2.5"/><circle cx="14" cy="8" r="2"/><path d="M2.5 17c0-3 2-5 4.5-5s4.5 2 4.5 5 M11.5 16c.3-2.3 1.4-3.8 3-4 1.6.2 2.8 1.7 3 4"/>',
  wanderer: '<path d="M8 17V5a2 2 0 0 1 4 0v1 M8 9h3 M12 17l1-6"/>',
  death: '<path d="M4 17h12 M6 17l1-7h6l1 7 M10 10V4 M8 6h4"/>',
  fork: '<path d="M10 17v-7 M10 10L5 4 M10 10l5-6 M5 4H3 M15 4h2"/>',
  oath: '<path d="M10 3a7 7 0 1 0 0 14 M10 3a7 7 0 0 1 6 3.5 M10 17a7 7 0 0 0 6-3.5 M16 6.5l-1 1 M16 13.5l-1-1"/>',
  axe: '<path d="M5 17L15 7 M12 4c3 0 5 2 5 5-2 0-4-1-5-2-1-1-2-3 0-3z"/>',
};
const ico = k => `<svg class="ico" viewBox="0 0 20 20" aria-hidden="true">${ICONS[k]}</svg>`;

function render() {
  const app = $('#app');
  if (!S) { app.innerHTML = setupHTML(); return; }
  app.innerHTML = mainHTML() + (S.queue.length ? overlayHTML(S.queue[0]) : '');
  window.scrollTo(0, window._scrollY || 0);
}
function act(fn) { window._scrollY = window.scrollY; fn(); save(S); render(); }

// ---- Setup ------------------------------------------------------------------------------
function setupHTML() {
  return `<div class="setup"><img class="mark" src="mark/ring-small.svg" alt=""><h1>Sea King</h1><div class="sub">793. A hall, forty men, one ship. Play until the dynasty ends.</div>
  <div class="pick" onclick="startGame('ragnar')"><span class="name">Ragnar</span> <span class="stats">C 4 · R 2 · F 3</span><small>Leans Combat. Raids hard, holds poorly.</small></div>
  <div class="pick" onclick="startGame('rollo')"><span class="name">Rollo</span> <span class="stats">C 2 · R 4 · F 3</span><small>Leans Rule. Holds land, bleeds at sea.</small></div>
  <div class="card"><span class="name">Custom</span> <span class="stats">9 points across three</span>
    <div class="custom"><input id="cname" placeholder="Name" value="Halfdan"><span></span>
      <span>Combat</span><span class="men"><button onclick="bump('c',-1)">−</button><span class="n" id="c">3</span><button onclick="bump('c',1)">+</button></span>
      <span>Rule</span><span class="men"><button onclick="bump('r',-1)">−</button><span class="n" id="r">3</span><button onclick="bump('r',1)">+</button></span>
      <span>Followability</span><span class="men"><button onclick="bump('f',-1)">−</button><span class="n" id="f">3</span><button onclick="bump('f',1)">+</button></span></div>
    <div class="hint" id="pts">9 of 9 placed</div>
    <button class="primary" style="width:100%;margin-top:10px" onclick="startCustom()">Begin</button></div>
  <p class="hint">The world is seeded by today's date. Anyone who starts a dynasty today sails the same seas.</p>
  <div class="imprint">House Hansen</div></div>`;
}
const cust = { c: 3, r: 3, f: 3 };
function bump(k, d) { const v = cust[k] + d, sum = cust.c + cust.r + cust.f + d; if (v < 1 || v > 5 || sum > 9) return; cust[k] = v;
  $('#' + k).textContent = v; $('#pts').textContent = `${cust.c + cust.r + cust.f} of 9 placed`; }
function startGame(k) { S = newGame(k); save(S); render(); }
function startCustom() { const name = $('#cname').value.trim() || 'Halfdan'; S = newGame('custom', Object.assign([cust.c, cust.r, cust.f], { name })); save(S); render(); }

// ---- Main screen ----------------------------------------------------------------------------
function mainHTML() {
  const k = S.king, ship = S.notables.filter(m => m.place === 'ship'), home = S.notables.filter(m => m.place === 'home');
  const titles = k.titles.map(t => `<span class="tag">${TITLES[t].name}</span>`).join('');
  const nextFork = T.forkAges.find(a => a > k.age);
  const spring = S.phase === 'spring';
  return `<div class="top"><div><div class="year">${S.year}</div><div class="king">${esc(k.name)}, ${k.age}${titles}${nextFork ? ` · fork at ${nextFork}` : ''}${k.age > 50 ? ` · <span class="death">death ${Math.round(5 * (k.age - 50) * (has(S,'oldwise') ? .5 : 1))}%</span>` : ''}</div></div>
    <div class="res"><b>${S.silver}</b> silver<br>${unledMen(S)} unled / <b>${S.men}</b> men</div></div>
  ${mapHTML()}
  <h2>${ico('ship')}The ship</h2>
  ${destHTML(ship)}
  ${ship.map(m => manCard(m)).join('') || '<div class="card empty">No one aboard.</div>'}
  <h2>${ico('land')}Holdings</h2>
  ${S.holdings.map(h => holdingHTML(h)).join('') || '<div class="card empty">No land but the home hall. Win a holdable shore and Stay.</div>'}
  <h2>${ico('hall')}Home · Vestfold</h2>
  ${home.map(m => manCard(m)).join('')}
  <div class="card row"><span>Unled men</span><span class="stats"><b>${unledMen(S)}</b> — no use, still fed</span></div>
  ${childrenHTML()}
  ${wandererHTML()}
  ${shoresHTML()}
  <div class="log">${S.log.slice(-6).reverse().map(l => `<div>${esc(l)}</div>`).join('')}</div>
  <details><summary>Dynasty</summary>${dynastyHTML()}<button class="small" onclick="if(confirm('Abandon this dynasty?')){localStorage.removeItem('seaking');S=null;render()}">Start over</button></details>
  <div class="sail"><button class="primary" ${spring ? '' : 'disabled'} onclick="act(()=>sail(S))">${spring ? (ship.length && S.destination ? `Sail for ${S.destination === 'blind' ? 'the dark' : esc(shoreOf(S.destination).name)}` : 'Sail · stay home this year') : 'Winter'}</button></div>`;
}
function destHTML(ship) {
  const known = Object.values(S.shores).filter(x => x.known && x.id !== HOME_ID && !isHolding(S, x.id)).sort((a, b) => dist(S, HOME_ID, a.id) - dist(S, HOME_ID, b.id));
  const sel = `<select onchange="act(()=>S.destination=this.value||null)" ${ship.length ? '' : 'disabled'}><option value="">— destination —</option>
    <option value="blind" ${S.destination === 'blind' ? 'selected' : ''}>Sail blind (${has(S,'farsailor') ? 5 : 3} dark coasts)</option>
    ${known.map(x => `<option value="${x.id}" ${S.destination === x.id ? 'selected' : ''}>${esc(x.name)} — ${x.seen ? `loot ${x.loot}, ${x.def} defenders` : 'rich, by rumor'}${x.walked ? ' (walked jarl)' : ''}</option>`).join('')}</select>`;
  const Sh = strengthShip(S); let bar = '';
  if (S.destination && S.destination !== 'blind' && shoreOf(S.destination).seen) bar = barHTML(Sh, shoreOf(S.destination).def);
  else if (ship.length) bar = `<div class="odds">Ship strength ${Sh}. ${S.destination === 'blind' ? 'Fog until you arrive.' : ''}</div>`;
  return `<div class="card">${sel}${bar}${ship.length ? '' : '<div class="hint">Move a man to the ship to choose a destination.</div>'}</div>`;
}
function barHTML(Sv, D, labelS = 'Ship', labelD = 'Defenders', anim = false) {
  const tot = Sv + D || 1;
  return `<div class="bar${anim ? ' anim' : ''}"><i class="s" style="width:${100 * Sv / tot}%"></i><i class="d" style="width:${100 * D / tot}%"></i></div>
  <div class="odds">${labelS} <b class="us">${Math.round(Sv)}</b> vs ${labelD} <b class="them">${D}</b> · ${oddsWords(Sv, D)}</div>`;
}
function manCard(m) {
  const spring = S.phase === 'spring', cap = fCap(S, m);
  const places = [['ship', 'Ship'], ['home', 'Home'], ...(m.isKing ? [] : S.holdings.map(h => [h.id, h.name]))];
  return `<div class="card"><div class="row"><div><span class="name">${esc(m.name)}</span>${m.isKing ? '<span class="tag">King</span>' : ''}${m.son ? '<span class="tag kin">Son</span>' : m.kin ? '<span class="tag kin">Kin</span>' : ''}<br>${statLine(m)}</div>
    <div class="men"><button ${spring ? '' : 'disabled'} onclick="act(()=>addMen(S,'${m.id}',-5))">−</button><span class="n">${m.men}<div class="cap">of ${cap}</div></span><button ${spring ? '' : 'disabled'} onclick="act(()=>addMen(S,'${m.id}',5))">+</button></div></div>
    ${spring ? `<div class="where">${places.map(([id, nm]) => `<button class="small ${m.place === id ? 'sel' : ''}" onclick="act(()=>place(S,'${m.id}','${id}'))">${esc(nm)}</button>`).join('')}</div>` : ''}</div>`;
}
function holdingHTML(h) {
  const j = S.notables.find(m => m.place === h.id);
  return `<div class="card"><div class="row"><span class="name">${esc(h.name)}</span><span class="stats">pays <b>${h.pay}</b> · unrest <b>${h.unrest}</b> · quiet ${h.quiet}y</span></div>
    ${j ? barHTML(j.rule * j.men, h.unrest, j.name, 'Unrest') + manCard(j) : `<div class="empty" style="margin-top:6px">No jarl. ${h.empty ? 'Stood empty last summer — one more and it revolts.' : 'Empty this summer: unrest rises, nothing paid.'}</div>`}</div>`;
}
function childrenHTML() {
  if (!S.children.length) return '';
  const jarls = S.notables.filter(m => !m.isKing && !m.kin);
  return `<h2>${ico('men')}Children</h2>` + S.children.map(c => `<div class="card row"><span>${esc(c.name)} <span class="stats">${c.sex === 'm' ? 'son' : 'daughter'}, ${c.age}${c.married ? `, wife of ${esc(c.married)}` : c.ofAge ? ', in the hall' : ''}</span></span>
    ${c.sex === 'f' && c.age >= 16 && !c.married && jarls.length && S.phase === 'spring' ? `<select onchange="if(this.value)act(()=>marry(S,'${c.id}',this.value))"><option value="">Marry to…</option>${jarls.map(j => `<option value="${j.id}">${esc(j.name)}</option>`).join('')}</select>` : ''}</div>`).join('');
}
function wandererHTML() {
  if (S.phase !== 'spring') return '';
  const p = rumorPrice(S);
  return `<h2>${ico('wanderer')}The Wanderer</h2><div class="card row"><span>${S.rumorOffer === 'none' ? 'He knows nothing new within reach.' : S.rumorOffer ? `He names <b class="rich">${esc(shoreOf(S.rumorOffer).name)}</b>.` : 'Sells the name of a rich coast.'}</span>
    <button class="small" ${S.silver < p || S.rumorOffer ? 'disabled' : ''} onclick="act(()=>buyRumor(S))">Rumor · ${p}</button></div>`;
}
function shoresHTML() {
  const seen = Object.values(S.shores).filter(x => x.seen && x.id !== HOME_ID && !isHolding(S, x.id));
  if (!seen.length) return '';
  return `<details><summary>Known shores (${seen.length})</summary><div class="card">${seen.map(x => `<div class="shore"><span>${esc(x.name)}${x.walked ? ` <span class="muted">— ${esc(x.walked.name)}'s</span>` : ''}${x.holdable ? '' : ' <span class="muted">· cannot hold</span>'}</span><span class="muted">loot <b class="rich">${x.loot}</b> · def ${x.def}</span></div>`).join('')}</div></details>`;
}
function dynastyHTML() {
  return S.dynasty.map(d => `<div class="card"><span class="name">${esc(d.king)}</span> <span class="stats">${d.from}–${d.to}${d.title ? ' · ' + d.title : ''}</span><br><span class="stats">${d.bestRaid ? `Richest raid: ${d.bestRaid.shore}, ${d.bestRaid.loot} silver (${d.bestRaid.year}). ` : 'Never raided. '}Most holdings: ${d.bestHoldings}.</span></div>`).join('') + `<div class="hint">Generation ${S.gen}. World seed ${S.day}.</div>`;
}
function mapHTML() {
  const known = Object.values(S.shores).filter(x => x.known);
  // the edge of the known world: unnamed coasts one step past what is known, drawn in iron
  const dark = Object.values(S.shores).filter(x => !x.known && x.neighbors.some(n => S.shores[n].known));
  const edges = EDGES.filter(([a, b]) => S.shores[a].known || S.shores[b].known).filter(([a, b]) => (S.shores[a].known || dark.includes(S.shores[a])) && (S.shores[b].known || dark.includes(S.shores[b])))
    .map(([a, b]) => `<line class="edge${S.shores[a].known && S.shores[b].known ? '' : ' dark'}" x1="${S.shores[a].x}" y1="${S.shores[a].y}" x2="${S.shores[b].x}" y2="${S.shores[b].y}"/>`).join('');
  const dots = known.map(x => { const cls = x.id === HOME_ID ? 'home' : isHolding(S, x.id) ? 'hold' : x.seen ? 'seen' : '';
    return `<circle class="coast ${cls}" cx="${x.x}" cy="${x.y}" r="${x.famous ? 4.5 : 3}"/>${S.destination === x.id ? `<circle class="dest" cx="${x.x}" cy="${x.y}" r="8"/>` : ''}<text class="lbl" x="${x.x + 6}" y="${x.y + 3}">${esc(x.name)}</text>`; }).join('')
    + dark.map(x => `<circle class="coast dark" cx="${x.x}" cy="${x.y}" r="2"/>`).join('');
  // crop to what is drawn, with room for the labels; never narrower than the eye expects
  const all = [...known, ...dark], pad = 28;
  let x0 = Math.min(...all.map(x => x.x)) - pad, x1 = Math.max(...all.map(x => x.x)) + pad + 40, y0 = Math.min(...all.map(x => x.y)) - pad, y1 = Math.max(...all.map(x => x.y)) + pad;
  const minW = 220, minH = 150;
  if (x1 - x0 < minW) { const c = (x0 + x1) / 2; x0 = c - minW / 2; x1 = c + minW / 2; }
  if (y1 - y0 < minH) { const c = (y0 + y1) / 2; y0 = c - minH / 2; y1 = c + minH / 2; }
  if ((y1 - y0) / (x1 - x0) > 1.1) { const c = (x0 + x1) / 2, w = (y1 - y0) / 1.1; x0 = c - w / 2; x1 = c + w / 2; }
  return `<svg class="map" viewBox="${x0.toFixed(0)} ${y0.toFixed(0)} ${(x1 - x0).toFixed(0)} ${(y1 - y0).toFixed(0)}">${edges}${dots}</svg>`;
}

// ---- Scenes -------------------------------------------------------------------------------
function overlayHTML(sc) {
  const btn = (t, fn, cls = 'primary') => `<button class="${cls}" onclick="act(()=>${fn})">${t}</button>`;
  let h = '';
  if (sc.t === 'intro') h = `<h1>${ico('hall')}${S.year}. Spring.</h1><p>You are ${esc(S.king.name)}, twenty, with a hall, forty men, and one ship.</p><p><b>Place your men. Press Sail.</b></p><p>Men on the ship raid. Men on the land hold. Men at home eat. Each named man leads F × 10.</p><p>Every summer the fleet sails. Every winter one card turns. Past fifty, every winter rolls against you.</p><div class="actions">${btn('Begin', 'next(S)')}</div>`;
  else if (sc.t === 'fork') h = `<h1>${ico('fork')}${esc(S.king.name)} is ${S.king.age}</h1><p>What they call him is what he did. Choose one.</p>${sc.offers.map(k => `<div class="pick" onclick="act(()=>takeTitle(S,'${k}'))"><span class="name">${TITLES[k].name}</span><br><span class="stats">${TITLES[k].text}</span></div>`).join('')}`;
  else if (sc.t === 'noSail') h = `<h1>Summer</h1><p>The ship stays beached. The land contests itself.</p><div class="actions">${btn('On', 'next(S)')}</div>`;
  else if (sc.t === 'arrive') { const Sh = strengthShip(S);
    h = `<h1>${ico('ship')}Landfall</h1><p>The fog lifts. Ship strength <b class="rich">${Sh}</b>. Pick one.</p>${sc.targets.map(id => { const x = shoreOf(id);
      return `<div class="pick" onclick="act(()=>chooseTarget(S,'${id}'))"><div class="row"><span class="name">${esc(x.name)}</span><span class="stats">loot <b class="rich">${x.loot}</b>${x.holdable ? ' · holdable' : ''}${x.walked ? ` · ${esc(x.walked.name)} holds it` : ''}</span></div>${barHTML(Sh, x.def)}</div>`; }).join('')}`; }
  else if (sc.t === 'fight') { const x = shoreOf(sc.shore);
    h = `<h1>${ico('axe')}${esc(x.name)}</h1>${barHTML(sc.S, sc.D, 'Ship', 'Defenders', true)}<div class="result ${sc.win ? '' : 'lose'}">${sc.win ? (sc.margin > 1 ? 'Rout.' : sc.margin > 0.3 ? 'Victory.' : 'A narrow thing.') : 'Driven back.'}</div>
    <p>${sc.win ? `${sc.loot} silver in loot.` : 'No loot.'} ${sc.losses} men lost.${sc.win && sc.margin > 1 ? ' The men will follow these jarls anywhere.' : ''}</p><div class="actions">${btn('On', 'next(S)')}</div>`; }
  else if (sc.t === 'stay') { const x = shoreOf(sc.shore), ship = S.notables.filter(m => m.place === 'ship' && !m.isKing);
    h = `<h1>${ico('land')}Plunder or stay?</h1><p><b>Plunder:</b> take ${sc.loot} silver and come home.</p><p><b>Stay:</b> forfeit the loot. ${esc(x.name)} becomes a holding paying ~${Math.max(10, Math.round(x.baseLoot / 4))} a year, and the jarl who stays holds it with his men.</p>
    <div class="actions">${btn(`Plunder · ${sc.loot} silver`, 'choosePlunder(S)')}${sc.walked ? btn(`${esc(x.walked.name)} kneels and keeps it`, `chooseStay(S,'walked')`, '')  : ''}${ship.map(m => btn(`${esc(m.name)} stays (R ${m.rule}, ${m.men} men)`, `chooseStay(S,'${m.id}')`, '')).join('')}</div>`; }
  else if (sc.t === 'summary') h = `<h1>${esc(sc.title)}</h1>${sc.lines.map(l => `<p>${esc(l)}</p>`).join('')}<div class="actions">${btn('On', 'next(S)')}</div>`;
  else if (sc.t === 'market') { const p = has(S,'fairdealer') ? 2 : T.manPrice;
    h = `<h1>${ico('silver')}Winter market</h1><p>You have <b class="rich">${S.silver}</b> silver and ${S.men} men. A man costs ${p}. Every man at home eats 1 silver next winter.</p>
    <div class="actions"><div class="row">${btn('Buy 5', 'buyMen(S,5)', '')}${btn('Buy 10', 'buyMen(S,10)', '')}${btn('Buy 20', 'buyMen(S,20)', '')}</div>${btn('Close the market', 'closeMarket(S)')}</div>`; }
  else if (sc.t === 'event') h = `<h1>${esc(sc.title)}</h1>${sc.lines.map(l => `<p>${esc(l)}</p>`).join('')}<div class="actions">${sc.choice ? btn('Give her', 'acceptSuitor(S,true)') + btn('Refuse', 'acceptSuitor(S,false)', '') : btn('On', 'next(S)')}</div>`;
  else if (sc.t === 'death') { const r = S.reign;
    h = `<h1>${ico('death')}${esc(S.king.name)} is dead</h1><p>${S.king.age} winters. King ${r.start}–${S.year}.</p><h2>The Saga</h2>${r.bestRaid ? `<p>The year ${r.bestRaid.year}: ${esc(r.bestRaid.shore)} fell and the ship came home with ${r.bestRaid.loot} silver.</p>` : '<p>He never took a shore.</p>'}<p>At most ${r.bestHoldings} holdings answered to him.${r.title ? ` Men called him ${r.title}.` : ''}</p><div class="actions">${btn('The heir', 'startSuccession(S)')}</div>`; }
  else if (sc.t === 'heir') h = `<h1>${ico('men')}The Heir</h1><p>Pick a son. The jarls will weigh his Rule against their own following.</p>${sc.sons.map(id => { const m = notable(id); return `<div class="pick" onclick="act(()=>chooseHeir(S,'${id}'))"><span class="name">${esc(m.name)}</span><br>${statLine(m)}</div>`; }).join('')}`;
  else if (sc.t === 'oath') { const j = notable(sc.jarl), h2 = S.holdings.find(h => h.id === j.place);
    h = `<h1>${ico('oath')}${esc(j.name)} of ${esc(h2.name)}</h1><p>${statLine(j)} · ${j.men} men</p>${sc.kneels ? `<p class="rich">He kneels${j.kin ? ' — he is kin' : ''}.</p><div class="actions">${btn('On', 'oathPay(S,false)')}</div>`
      : `<p>He hesitates. His following outweighs the heir's Rule.</p><p>Price of his knee: <b class="rich">${sc.price}</b> silver. You have ${S.silver}.</p><div class="actions">${btn(`Pay ${sc.price}`, 'oathPay(S,true)', S.silver >= sc.price ? 'primary' : '')}${btn('Let him walk with his holding', 'oathPay(S,false)', '')}</div>`}`; }
  else if (sc.t === 'coronation') h = `<h1>${ico('hall')}${esc(S.king.name)}, king</h1><p>${S.holdings.length} holdings. ${S.men} men. ${S.silver} silver.</p><p>Same screen. Smaller kingdom.</p><div class="actions">${btn('First spring', 'finishCoronation(S)')}</div>`;
  else if (sc.t === 'end') h = `<h1>${sc.reason === '1066' ? 'The dynasty ends at 1066' : 'The line is broken'}</h1><p>${sc.reason === '1066' ? 'The age of the sea kings is over.' : 'No son, no son-in-law. The strongest jarl takes the hall.'}</p><h2>Dynasty Saga</h2>${dynastyHTML()}<div class="actions">${btn('Begin again', "localStorage.removeItem('seaking');S=null")}</div>`;
  return `<div class="overlay"><div class="scene">${h}</div></div>`;
}
render();
