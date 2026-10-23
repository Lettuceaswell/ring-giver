// ---- Tuning (GDD §13) ----------------------------------------------------------
const T = { startMen: 40, menPerF: 10, manPrice: 3, upkeep: 1, rumor: 20, startYear: 793, endYear: 1066,
  emptyUnrest: 10, heldCalm: 5, quietYears: 5, forkAges: [25, 35, 45, 55] };

const uid = () => Math.random().toString(36).slice(2, 8);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const has = (s, t) => s.king.titles.includes(t);

function makeMan(name, c, r, f, extra = {}) {
  return { id: uid(), name, combat: clamp(c,1,5), rule: clamp(r,1,5), follow: clamp(f,1,5), place: 'home', men: 0, age: 25,
    kin: false, raids: 0, heldRun: 0, ...extra };
}
function fCap(s, m) { return (m.follow + (has(s,'ringgiver') ? 1 : 0)) * T.menPerF; }
function strengthShip(s) { return s.notables.filter(m => m.place === 'ship').reduce((a, m) => a + m.combat * m.men, 0); }
function winOdds(S, D) { return clamp((S * 1.15 - D) / (S * 0.3), 0, 1); }
// the odds in words: how likely, and how dear. A sure fight can still be a bloody one.
function oddsWords(S, D) {
  const p = winOdds(S, D), q = S > 0 ? D / S : 9;
  const chance = p >= .97 ? 'sure' : p >= .7 ? 'likely' : p >= .4 ? 'even' : p > 0 ? 'long odds' : 'hopeless';
  const cost = q < .4 ? 'clean' : q < .65 ? 'fair' : 'bloody';
  return p > 0 ? `${chance} · ${cost}` : chance;
}
function placedMen(s) { return s.notables.reduce((a, m) => a + m.men, 0); }
function unledMen(s) { return s.men - placedMen(s); }
function dist(s, from, to) { // BFS distance in coast graph
  const seen = { [from]: 0 }, q = [from];
  while (q.length) { const c = q.shift(); if (c === to) return seen[c];
    for (const n of s.shores[c].neighbors) if (!(n in seen)) { seen[n] = seen[c] + 1; q.push(n); } }
  return 99;
}
function reachable(s, id) { // within 2 of home or any holding
  const bases = [HOME_ID, ...s.holdings.map(h => h.id)];
  return bases.some(b => dist(s, b, id) <= 2);
}
function revealAround(s, id) { s.shores[id].known = s.shores[id].seen = true; for (const n of s.shores[id].neighbors) { s.shores[n].known = s.shores[n].seen = true; } }
function isHolding(s, id) { return s.holdings.some(h => h.id === id); }
function holdPay(sh) { return Math.max(10, Math.round(sh.baseLoot / 4)); }
function stayUnrest(s, sh) { return clamp(Math.round(sh.baseDef / 1.5) - (has(s,'landtaker') ? 20 : 0), 10, 100); }

// ---- New game ------------------------------------------------------------------
function newGame(kingKey, custom) {
  const day = new Date().toISOString().slice(0, 10);
  const stats = { ragnar: ['Ragnar', 4, 2, 3], rollo: ['Rollo', 2, 4, 3], custom: ['Custom', ...(custom || [3, 3, 3])] }[kingKey];
  const king = makeMan(custom && custom.name ? custom.name : stats[0], stats[1], stats[2], stats[3], { age: 20, isKing: true, titles: [], offeredPairs: [], born: T.startYear - 20 });
  const s = { seed: day, day, year: T.startYear, phase: 'spring', silver: 60, men: T.startMen, king, notables: [king], children: [],
    holdings: [], shores: buildWorld(day), destination: null, rumorOffer: null, queue: [], log: [],
    deeds: { raids:0, blind:0, heldYears:0, jarlYears:0, bigWins:0, homeYears:0, rumors:0, menBought:0, stays:0, upkeep:0, marriages:0, years:0 },
    reign: { bestRaid: null, bestHoldings: 0, title: null, start: T.startYear },
    dynasty: [], flags: {}, gen: 1 };
  king.men = Math.min(T.startMen, fCap(s, king));
  const first = makeMan(rng(day + ':first')(0) < 0.5 ? 'Bjorn' : 'Ivar', 3, 2, 2, { age: 30 });
  s.notables.push(first); first.men = 10;
  revealAround(s, HOME_ID);
  s.queue.push({ t:'intro' });
  return s;
}

// ---- Spring actions -------------------------------------------------------------
function place(s, id, where) {
  const m = s.notables.find(x => x.id === id); if (!m) return;
  if (where !== 'ship' && where !== 'home') { // a holding
    const h = s.holdings.find(h => h.id === where); if (!h || m.isKing) return;
    const prev = s.notables.find(x => x.place === where); if (prev) prev.place = 'home';
  }
  m.place = where;
  if (m.place !== 'ship' && !s.notables.some(x => x.place === 'ship')) s.destination = null;
}
function addMen(s, id, d) {
  const m = s.notables.find(x => x.id === id);
  m.men = clamp(m.men + d, 0, Math.min(fCap(s, m), m.men + unledMen(s)));
}
function boardAll(s) {
  if (s.phase !== 'spring') return;
  for (const m of s.notables) if (m.place === 'home') m.place = 'ship';
  const ship = s.notables.filter(m => m.place === 'ship').sort((a, b) => (b.isKing ? 1 : 0) - (a.isKing ? 1 : 0) || b.combat - a.combat);
  for (const m of ship) m.men = Math.min(fCap(s, m), m.men + unledMen(s));
}
function setDestination(s, id) { if (s.phase === 'spring' && s.notables.some(m => m.place === 'ship')) s.destination = id; }
function marry(s, childId, jarlId) {
  const d = s.children.find(c => c.id === childId), j = s.notables.find(m => m.id === jarlId);
  if (!d || !j || d.sex !== 'f' || d.age < 16 || j.isKing || j.kin) return;
  j.kin = true; d.married = j.name; s.deeds.marriages++;
  s.log.push(`${d.name} married to ${j.name}. He is kin now.`);
}
function rumorPrice(s) { return has(s,'silvertongue') ? 0 : (s.flags.wanderer ? T.rumor / 2 : T.rumor); }
function buyRumor(s) {
  const price = rumorPrice(s); if (s.silver < price) return;
  const r = rng(s.day + ':rumor:' + s.year);
  const cands = Object.values(s.shores).filter(x => !x.seen && x.baseLoot >= 100 && reachable(s, x.id) && !isHolding(s, x.id));
  if (!cands.length) { s.rumorOffer = 'none'; return; }
  const pick = r.pick(cands); pick.known = true; pick.rumored = true;
  s.silver -= price; s.deeds.rumors++; s.rumorOffer = pick.id;
  s.log.push(`The Wanderer speaks of ${pick.name}. Rich, he says.`);
}
function takeTitle(s, key) { s.king.titles.push(key); s.reign.title = TITLES[key].name; s.log.push(`${s.king.name} is called ${TITLES[key].name}.`); next(s); }

// ---- Summer -----------------------------------------------------------------------
function sail(s) {
  if (s.phase !== 'spring') return;
  if (s.notables.some(m => m.place === 'ship') && !s.destination) return;
  s.phase = 'summer';
  const ship = s.notables.filter(m => m.place === 'ship');
  if (ship.length && s.destination && strengthShip(s) > 0) {
    const r = rng(s.day + ':sail:' + s.year);
    let targets;
    if (s.destination === 'blind') {
      s.deeds.blind++;
      const dark = Object.values(s.shores).filter(x => !x.seen && reachable(s, x.id) && !isHolding(s, x.id));
      const n = has(s,'farsailor') ? 5 : 3;
      targets = []; const pool = dark.length ? dark : Object.values(s.shores).filter(x => reachable(s, x.id) && !isHolding(s, x.id) && x.id !== HOME_ID);
      while (targets.length < n && pool.length) { const p = r.pick(pool); pool.splice(pool.indexOf(p), 1); targets.push(p.id); }
    } else {
      const t = s.shores[s.destination];
      targets = [t.id, ...t.neighbors.filter(n => n !== HOME_ID && !isHolding(s, n)).slice(0, 2)];
    }
    for (const id of targets) { const x = s.shores[id]; x.known = x.seen = true; x.rumored = false; }
    s.queue.push({ t:'arrive', targets });
  } else {
    s.queue.push({ t:'noSail' });
  }
  save(s);
}
function chooseTarget(s, id) {
  const sh = s.shores[id], r = rng(s.day + ':fight:' + s.year + id);
  const ship = s.notables.filter(m => m.place === 'ship');
  const S = strengthShip(s), D = sh.def, roll = 0.85 + r() * 0.3;
  const win = S * roll > D, margin = (S * roll - D) / D;
  const menAboard = ship.reduce((a, m) => a + m.men, 0);
  let lossFrac = win ? clamp(0.35 * D / (S * roll), 0.02, 0.4) : clamp(0.5 * D / (S * roll), 0.2, 0.6);
  if (has(s,'ironside')) lossFrac /= 2;
  const losses = Math.round(menAboard * lossFrac);
  let loot = 0;
  if (win) {
    loot = Math.round(sh.loot * clamp(0.5 + margin / 2, 0.3, 1) * (has(s,'seawolf') ? 1.25 : 1));
    sh.loot = Math.round(sh.loot * 0.6); sh.def = Math.min(200, Math.round(sh.def * 1.2));
    for (const m of ship) { m.raids++; if (m.raids % 3 === 0) m.combat = clamp(m.combat + 1, 1, 5); if (margin > 1) m.follow = clamp(m.follow + 1, 1, 5); }
    if (margin > 1) s.deeds.bigWins++;
  } else { sh.def = Math.min(200, Math.round(sh.def * 1.1)); }
  // distribute losses across the ship's men
  let left = losses; for (const m of ship) { const l = Math.min(m.men, Math.round(losses * m.men / Math.max(1, menAboard))); m.men -= l; left -= l; }
  if (left > 0) { const m = ship[0]; const l = Math.min(m.men, left); m.men -= l; }
  s.men -= losses; s.deeds.raids++;
  const res = { t:'fight', shore: id, S: Math.round(S * roll), D, win, margin, loot, losses, odds: winOdds(S, D) };
  s.queue.shift(); // the arrive card
  s.queue.unshift(res);
  const canStay = win && sh.holdable && (sh.walked || ship.some(m => !m.isKing));
  if (canStay) s.queue.splice(1, 0, { t:'stay', shore: id, loot, walked: !!sh.walked });
  else if (win) { plunder(s, loot, id); }
  save(s);
}
function plunder(s, loot, id) {
  s.silver += loot;
  if (!s.reign.bestRaid || loot > s.reign.bestRaid.loot) s.reign.bestRaid = { loot, shore: s.shores[id].name, year: s.year };
  s.log.push(`${s.year}: ${s.shores[id].name} plundered for ${loot} silver.`);
}
function choosePlunder(s) { const sc = s.queue[0]; plunder(s, sc.loot, sc.shore); next(s); }
function chooseStay(s, jarlId) {
  const sc = s.queue[0], sh = s.shores[sc.shore];
  let j;
  if (jarlId === 'walked') { const w = sh.walked; j = makeMan(w.name, w.combat, w.rule, w.follow, { age: 40 }); s.notables.push(j); }
  else j = s.notables.find(m => m.id === jarlId);
  sh.walked = null;
  const unrest = stayUnrest(s, sh);
  s.holdings.push({ id: sh.id, name: sh.name, pay: holdPay(sh), unrest, quiet: 0, empty: 0, taken: s.year });
  j.place = sh.id; s.deeds.stays++;
  revealAround(s, sh.id);
  s.log.push(`${s.year}: ${j.name} stays at ${sh.name}. It is ours.`);
  next(s);
}

// Land contests, home, then into winter
function resolveLand(s) {
  const r = rng(s.day + ':land:' + s.year), lines = [];
  for (const h of [...s.holdings]) {
    const j = s.notables.find(m => m.place === h.id);
    if (h.taken === s.year) { lines.push(`${h.name} is newly ours. No contest this summer.`); continue; } // the jarl who stayed just won it
    if (!j) {
      h.empty++; h.quiet = 0; h.unrest = clamp(h.unrest + (has(s,'lawgiver') ? 5 : T.emptyUnrest), 0, 100);
      if (h.empty >= 2) { loseHolding(s, h, null); lines.push(`${h.name} stood empty two summers. It has revolted.`); }
      else lines.push(`${h.name} stood empty. Unrest ${h.unrest}.`);
      continue;
    }
    const S = j.rule * j.men * (0.85 + r() * 0.3);
    if (S > h.unrest) {
      const pay = Math.round(h.pay * (s.flags.harvest ? 2 : 1));
      s.silver += pay; h.unrest = clamp(h.unrest - (has(s,'lawgiver') ? 10 : T.heldCalm), 0, 100); h.quiet++; h.empty = 0;
      j.heldRun++; if (j.heldRun % 3 === 0) j.rule = clamp(j.rule + 1, 1, 5);
      s.deeds.heldYears++;
      lines.push(`${h.name} pays ${pay}. ${j.name} holds it.`);
      if (h.quiet > 0 && h.quiet % T.quietYears === 0) {
        const sh = s.shores[h.id], nm = rng(s.day + h.id + s.year).pick(LOCAL_NAMES[sh.culture]);
        s.notables.push(makeMan(nm, 1 + r.int(0, 1), 3 + r.int(0, 2), 2 + r.int(0, 1), { age: 22 + r.int(0, 15) }));
        lines.push(`Five quiet years at ${h.name}. ${nm} comes to the hall.`);
      }
    } else {
      const lost = Math.round(j.men * 0.3); j.men -= lost; s.men -= lost; j.heldRun = 0;
      loseHolding(s, h, j); lines.push(`${h.name} rose against ${j.name}. ${lost} men dead. The holding is lost.`);
    }
  }
  s.deeds.jarlYears += s.notables.filter(m => !m.isKing && m.place !== 'home').length;
  if (s.king.place === 'home') s.deeds.homeYears++;
  // shores recover slowly
  for (const sh of Object.values(s.shores)) { if (sh.loot < sh.baseLoot) sh.loot = Math.min(sh.baseLoot, Math.round(sh.loot * 1.1) + 1); if (sh.def > sh.baseDef) sh.def = Math.max(sh.baseDef, Math.round(sh.def * 0.95)); }
  s.reign.bestHoldings = Math.max(s.reign.bestHoldings, s.holdings.length);
  // everyone home for winter
  for (const m of s.notables) if (m.place === 'ship') m.place = 'home';
  s.destination = null;
  if (lines.length) s.queue.push({ t:'summary', title: 'The land', lines });
  s.phase = 'winter';
  upkeep(s);
  s.queue.push({ t:'market' });
}
function loseHolding(s, h, j) {
  s.holdings = s.holdings.filter(x => x !== h);
  if (j) j.place = 'home';
  const sh = s.shores[h.id]; sh.loot = Math.round(sh.baseLoot * 0.8); sh.def = Math.round(sh.baseDef * 1.1);
}

// ---- Winter ---------------------------------------------------------------------------
function buyMen(s, n) {
  const price = has(s,'fairdealer') ? 2 : T.manPrice;
  n = Math.min(n, Math.floor(s.silver / price)); if (n <= 0) return;
  s.silver -= n * price; s.men += n; s.deeds.menBought += n;
}
function upkeep(s) {
  const home = s.notables.filter(m => m.place === 'home').reduce((a, m) => a + m.men, 0) + unledMen(s);
  let cost = Math.round(home * T.upkeep * (s.flags.hardWinter ? 2 : 1) * (has(s,'deepchest') ? 0.5 : 1));
  s.deeds.upkeep += cost;
  const lines = [];
  if (cost > s.silver) { const starve = Math.min(home, Math.ceil((cost - s.silver) / 2)); cost = s.silver; s.men -= starve; trimMen(s); lines.push(`The hall could not feed everyone. ${starve} men left.`); }
  s.silver -= cost; lines.push(`${home} men at home ate ${cost} silver.`);
  s.flags = {};
  s.queue.push({ t:'summary', title: 'The hall eats', lines });
}
function closeMarket(s) { winterCard(s); next(s); }
function trimMen(s) { let over = placedMen(s) - s.men; for (const m of s.notables) { if (over <= 0) break; const d = Math.min(m.men, over); m.men -= d; over -= d; } }

function winterCard(s) {
  const r = rng(s.day + ':winter:' + s.year), k = s.king;
  const deck = [];
  const kids = s.children.length;
  if (k.age < 55) deck.push(['birth', kids < 2 ? 6 : 3]);
  if (s.notables.some(m => !m.isKing && m.age > 45)) deck.push(['jarlDeath', 2]);
  deck.push(['wanderer', 2]); deck.push(['rival', 1]); deck.push(['hardWinter', 1]); deck.push(['harvest', s.holdings.length ? 2 : 0]);
  deck.push(['seaman', 2]);
  if (s.children.some(c => c.sex === 'f' && c.age >= 16 && !c.married) && s.notables.some(m => !m.isKing && !m.kin)) deck.push(['suitor', 3]);
  if (s.notables.filter(m => !m.isKing).length >= 2) deck.push(['feud', 1]);
  deck.push(['quiet', 1]);
  const total = deck.reduce((a, [, w]) => a + w, 0); let roll = r() * total, ev = 'quiet';
  for (const [e, w] of deck) { roll -= w; if (roll <= 0) { ev = e; break; } }
  const sc = { t:'event', ev, lines: [] };
  if (ev === 'birth') {
    const sex = r() < 0.5 ? 'm' : 'f', name = r.pick(sex === 'm' ? MALE_NAMES : FEMALE_NAMES);
    s.children.push({ id: uid(), name, sex, age: 0, born: s.year });
    sc.title = sex === 'm' ? 'A son is born' : 'A daughter is born'; sc.lines.push(`${name}, child of ${k.name}.`);
  } else if (ev === 'jarlDeath') {
    const old = s.notables.filter(m => !m.isKing && m.age > 45).sort((a, b) => b.age - a.age)[0];
    s.notables = s.notables.filter(m => m !== old);
    sc.title = `${old.name} is dead`; sc.lines.push(`He was ${old.age}. His ${old.men} men walk home unled.`);
  } else if (ev === 'wanderer') {
    s.flags.wanderer = true; sc.title = 'The Wanderer at the door'; sc.lines.push('He winters in the hall. Rumors are half price in spring.');
  } else if (ev === 'rival') {
    const D = r.int(20, 80), homeS = s.notables.filter(m => m.place === 'home').reduce((a, m) => a + m.rule * m.men, 0) * (has(s,'hallward') ? 2 : 1);
    sc.title = 'A rival sail sighted';
    if (homeS * (0.85 + r() * 0.3) > D) sc.lines.push(`A strange fleet came up the fjord. The hall held (${Math.round(homeS)} vs ${D}).`);
    else { const lostS = Math.round(s.silver * 0.3), lostM = Math.round(s.men * 0.1); s.silver -= lostS; s.men -= lostM; trimMen(s);
      sc.lines.push(`A strange fleet came up the fjord and the hall fell (${Math.round(homeS)} vs ${D}). ${lostS} silver and ${lostM} men gone.`); }
  } else if (ev === 'hardWinter') { s.flags.hardWinter = true; sc.title = 'Hard winter'; sc.lines.push('The ice came early. Upkeep is doubled next winter.'); }
  else if (ev === 'harvest') { s.flags.harvest = true; sc.title = 'Good harvest'; sc.lines.push('The land is kind. Holdings pay double next summer.'); }
  else if (ev === 'seaman') {
    const nm = r.pick(MALE_NAMES.filter(n => !s.notables.some(m => m.name === n)));
    s.notables.push(makeMan(nm, 3 + r.int(0, 2), 1 + r.int(0, 1), 1 + r.int(0, 2), { age: 20 + r.int(0, 12) }));
    sc.title = `${nm} comes from the sea`; sc.lines.push('A fighter looking for a lord. He waits at home.');
  } else if (ev === 'suitor') {
    const d = s.children.find(c => c.sex === 'f' && c.age >= 16 && !c.married), j = r.pick(s.notables.filter(m => !m.isKing && !m.kin));
    sc.title = `${j.name} asks for ${d.name}`; sc.lines.push('Give her, and he is kin. Kin kneel.'); sc.choice = { d: d.id, j: j.id };
  } else if (ev === 'feud') {
    const js = s.notables.filter(m => !m.isKing), a = r.pick(js), b = r.pick(js.filter(x => x !== a));
    b.follow = clamp(b.follow - 1, 1, 5); sc.title = 'A feud in the hall'; sc.lines.push(`${a.name} shamed ${b.name} at the table. Men drift from ${b.name}.`);
  } else { sc.title = 'A quiet winter'; sc.lines.push('Snow on the roof. Nothing stirs.'); }
  s.queue.push(sc);
}
function acceptSuitor(s, yes) { const sc = s.queue[0]; if (yes) marry(s, sc.choice.d, sc.choice.j); next(s); }

// mortality, then the new year
function endWinter(s) {
  const k = s.king, r = rng(s.day + ':death:' + s.year);
  const p = k.age > 50 ? 0.05 * (k.age - 50) * (has(s,'oldwise') ? 0.5 : 1) : 0;
  if (p > 0 && r() < p) { s.queue.push({ t:'death' }); return; }
  newYear(s);
}
function newYear(s) {
  s.year++; s.deeds.years++;
  for (const m of s.notables) m.age++;
  for (const c of s.children) { c.age++; if (c.sex === 'm' && c.age === 16) comeOfAge(s, c); }
  if (s.year >= T.endYear) { s.dynasty.push(reignCard(s)); s.queue.push({ t:'end', reason: '1066' }); return; }
  s.phase = 'spring'; s.rumorOffer = null;
  const k = s.king;
  if (T.forkAges.includes(k.age)) {
    const scored = Object.keys(TITLES).filter(t => !k.titles.includes(t)).map(t => [t, TITLES[t].score(s) + rng(s.day + t + s.year)() * 0.5]).sort((a, b) => b[1] - a[1]);
    let pair = scored.slice(0, 2).map(x => x[0]);
    if (k.offeredPairs.some(p => p[0] === pair[0] && p[1] === pair[1]) && scored.length > 2) pair = [scored[0][0], scored[2][0]];
    k.offeredPairs.push(pair);
    s.queue.push({ t:'fork', offers: pair });
  }
}
function comeOfAge(s, c) {
  const r = rng(s.day + c.id), k = s.king;
  const m = makeMan(c.name, clamp(k.combat - 1 + r.int(0, 2), 1, 5), clamp(k.rule - 1 + r.int(0, 2), 1, 5), clamp(2 + r.int(0, 2), 1, 5), { age: 16, son: true, kin: true });
  s.notables.push(m); c.ofAge = true;
  s.log.push(`${c.name} is sixteen and takes a seat in the hall.`);
}

// ---- The reign ends -------------------------------------------------------------------------
function reignCard(s) { return { king: s.king.name, from: s.reign.start, to: s.year, bestRaid: s.reign.bestRaid, bestHoldings: s.reign.bestHoldings, title: s.reign.title, age: s.king.age }; }
function startSuccession(s) {
  s.dynasty.push(reignCard(s));
  const sons = s.notables.filter(m => m.son);
  if (sons.length) s.queue.push({ t:'heir', sons: sons.map(m => m.id) });
  else {
    const inlaw = s.notables.find(m => m.kin && !m.son);
    if (inlaw) { s.queue.push({ t:'summary', title: 'No son', lines: [`${inlaw.name}, married into the line, takes the hall.`] }); crown(s, inlaw); }
    else s.queue.push({ t:'end', reason: 'noheir' });
  }
  next(s);
}
function chooseHeir(s, id) { crown(s, s.notables.find(m => m.id === id)); next(s); }
function crown(s, heir) {
  const old = s.king;
  s.notables = s.notables.filter(m => m !== old);
  heir.isKing = true; heir.son = false; heir.kin = false; heir.titles = []; heir.offeredPairs = []; heir.place = 'home';
  s.king = heir; s.gen++;
  s.reign = { bestRaid: null, bestHoldings: s.holdings.length, title: null, start: s.year };
  s.deeds = Object.fromEntries(Object.keys(s.deeds).map(k => [k, 0]));
  s.children = s.children.filter(c => !c.ofAge && !c.married);
  // the Oath: every jarl with a holding, one at a time
  const r = rng(s.day + ':oath:' + s.year);
  for (const j of s.notables.filter(m => !m.isKing && s.holdings.some(h => h.id === m.place))) {
    const kneels = j.kin || j.follow <= heir.rule + (r() < 0.5 ? 1 : 0);
    const price = Math.round(j.follow * 15 * (old.titles && old.titles.includes('beloved') ? 0.5 : 1));
    s.queue.push({ t:'oath', jarl: j.id, kneels, price });
  }
  s.queue.push({ t:'coronation' });
}
function oathPay(s, pay) {
  const sc = s.queue[0], j = s.notables.find(m => m.id === sc.jarl);
  if (sc.kneels || (pay && s.silver >= sc.price)) { if (!sc.kneels) s.silver -= sc.price; j.kin = true; s.log.push(`${j.name} kneels.`); }
  else { // he walks with his holding
    const h = s.holdings.find(h => h.id === j.place), sh = s.shores[h.id];
    s.holdings = s.holdings.filter(x => x !== h);
    sh.walked = { name: j.name, combat: j.combat, rule: j.rule, follow: j.follow }; sh.def = clamp(j.rule * j.men + 20, 20, 200); sh.loot = Math.round(h.pay * 3);
    s.notables = s.notables.filter(m => m !== j); s.men -= j.men;
    s.log.push(`${j.name} walks. ${h.name} is his now.`);
  }
  next(s);
}
function finishCoronation(s) { newYear(s); next(s); }

// ---- Scene queue ------------------------------------------------------------------------------
function next(s) {
  s.queue.shift();
  if (!s.queue.length) {
    if (s.phase === 'summer') resolveLand(s);
    else if (s.phase === 'winter' && !s.flags.winterDone) { s.flags.winterDone = true; endWinter(s); }
  }
  if (s.queue.length && s.queue[0].t === 'market') s.flags.winterDone = false;
  save(s);
}
function save(s) { try { localStorage.setItem('seaking', JSON.stringify(s)); } catch (e) {} }
function load() { try { const j = localStorage.getItem('seaking'); return j ? JSON.parse(j) : null; } catch (e) { return null; } }
