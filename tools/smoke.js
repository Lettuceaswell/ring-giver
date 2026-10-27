// headless dynasty: fake DOM + localStorage, runs the real coast/world/game/ui files, drives every spring and every scene. Usage: node tools/smoke.js
// SEED=word fixes every roll (the game's uid draws on Math.random, so without it two runs differ); DAY=2026-10-26 fixes the world's day. Default: a fixed seed and day, so the gate is the same run every time.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const SEED = process.env.SEED || 'smoke', DAY = process.env.DAY || '2026-10-26';
{ let a = 0; for (const ch of SEED) a = (a * 31 + ch.charCodeAt(0)) | 0; Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
global.Date = class extends Date { toISOString() { return DAY + 'T12:00:00.000Z'; } };
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
const app = { innerHTML: '' };
global.document = { querySelector: sel => sel === '#app' ? app : null };
global.window = {};
global.navigator = {};
const src = ['coast.js', 'world.js', 'game.js', 'ui.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
// expose everything: strip top-level const/let so they become globals under eval in sloppy mode
const code = src.replace(/^(const|let) /gm, 'var ');
let fails = 0, markets = 0, renders = 0, regents = 0, stepdowns = 0;
const check = (where) => { renders++; const h = app.innerHTML; for (const bad of ['undefined', 'NaN', '[object', 'null silver']) if (h.includes(bad)) { fails++; console.log('BAD', where, bad, h.slice(Math.max(0, h.indexOf(bad) - 120), h.indexOf(bad) + 40).replace(/\s+/g, ' ')); if (fails > 8) process.exit(1); } };
eval(code);
// start
check('setup empty');
if (!app.innerHTML.includes('Ring Giver')) { console.log('no setup'); process.exit(1); }
startGame('ragnar'); check('intro');
let year0 = S.year, homes = 0, lines = 1, deaths = 0, stays = 0, fights = 0, winters = 0, skips = 0, landfalls = 0, maxYears = 700;
const r = rng(SEED);
function drive() {
  const sc = S.queue[0];
  if (!sc) return false;
  if (sc.t === 'arrive') { landfalls++; const Sh = strengthShip(S); if (sc.targets.every(id => winOdds(Sh, S.shores[id].def) < 0.2) && r() < 0.6) { homes++; act(() => turnHome(S)); } else act(() => chooseTarget(S, sc.targets[0])); }
  else if (sc.t === 'fight') { fights++; check('battle'); UI.fightDone = fightKey(sc); render(); check('battle fought'); if (!app.innerHTML.includes('bverdict')) { console.log('no verdict', S.year); fails++; } act(() => next(S)); }
  else if (sc.t === 'stay') { const ship = S.notables.filter(m => m.place === 'ship' && !m.isKing); if (ship.length && r() < 0.6) { stays++; act(() => chooseStay(S, ship[0].id)); } else if (sc.walked && r() < 0.5) { act(() => chooseStay(S, 'walked')); } else act(() => choosePlunder(S)); }
  else if (sc.t === 'winter') { winters++; check('winter'); act(() => closeWinter(S)); }
  else if (sc.t === 'market') { markets++; if (!canMarket(S)) { console.log('market opened on a chest that cannot buy', S.year); fails++; } if (S.silver > 60 && r() < 0.7) act(() => buyMen(S, 10)); check('market'); if (!app.innerHTML.includes('id="bbuy"')) { console.log('market sheet has no buy', S.year); fails++; } act(() => next(S)); }
  else if (sc.t === 'event') { if (sc.choice) { act(() => answerSuitor(S, r() < 0.5)); check('event answered'); } if (sc.roll) { UI.rolled = S.year; render(); check('event rolled'); } act(() => next(S)); } // the winter card: answer, turn the King's card, move on
  else if (sc.t === 'fork') act(() => takeTitle(S, sc.offers[r() < 0.5 ? 0 : 1]));
  else if (sc.t === 'death') { deaths++; const w = successor(S); if (w.kind === 'regent') regents++; act(() => startSuccession(S)); if (w.kind === 'regent' && (S.king !== w.man || !S.regency || S.regency.boy !== w.boy.id)) { console.log('regent not crowned', S.year); fails++; } }
  else if (sc.t === 'moment' && / steps down$/.test(sc.title)) { const y = S.year, rg = S.notables.find(m => !m.isKing && sc.title.startsWith(m.name)); stepdowns++; if (!rg || S.regency || S.king.age !== 16) { console.log('step down', y, !!rg, !!S.regency, S.king.age); fails++; } act(() => next(S)); }
  else if (sc.t === 'heir') act(() => chooseHeir(S, sc.sons[0]));
  else if (sc.t === 'oath') act(() => oathPay(S, S.silver >= sc.price && r() < 0.7));
  else if (sc.t === 'coronation') act(() => finishCoronation(S));
  else if (sc.t === 'end') return 'end';
  else act(() => next(S));
  check(sc.t);
  return true;
}
// a reload mid-run (TODO 41A.10): the save goes through JSON and migrate the way closing the app does; the two pre-play bugs of the LLM round were both reload bugs
let reloads = 0;
function reload(where) {
  save(S); const was = { year: S.year, king: S.king.name, age: S.king.age, place: S.king.place, men: S.men, silver: S.silver, q: S.queue.length };
  S = migrate(load()); reloads++;
  const row = S.notables.find(m => m.isKing);
  if (S.king !== row) { console.log('reload: the King is not his row', where); fails++; }
  if (S.year !== was.year || S.king.name !== was.king || S.king.age !== was.age || S.king.place !== was.place || S.men !== was.men || S.silver !== was.silver || S.queue.length !== was.q) { console.log('reload changed the state', where, was, { year: S.year, king: S.king.name, age: S.king.age, place: S.king.place, men: S.men, silver: S.silver, q: S.queue.length }); fails++; }
  render(); check('after reload ' + where);
}
while (S && maxYears-- > 0) {
  // spring
  while (S.queue.length) { if (S.year % 5 === 2 && S.queue[0].t !== 'fight') reload(S.queue[0].t); const d = drive(); if (d === 'end') break; }
  if (S.year % 3 === 0) reload('spring');
  if (S.queue.length && S.queue[0].t === 'end') { if (S.year >= 900 || lines >= 4) break; // a line broken early: begin again, so the run still covers a century
    render(); check('end early'); act(() => { archive(S, 'the line broke'); S = null; }); startGame('ragnar'); lines++; continue; }
  if (S.phase !== 'spring') { console.log('not spring after queue drained', S.phase, S.year); fails++; break; }
  for (const pane of ['map', 'ship', 'hall']) { UI.pane = pane; render(); check('pane ' + pane); }
  UI.saga = true; render(); check('saga'); UI.saga = false;
  UI.picker = true; render(); check('picker'); UI.picker = false;
  for (const m of S.notables) { UI.man = m.id; render(); check('man ' + m.name); } UI.man = null;
  for (const k of Object.values(S.rulers)) if (k.known) { UI.man = k.id; render(); check('ruler ' + k.name); } UI.man = null;
  // the new sheets (2026-10-26): each holding opened, its jarl list with a pick; a man's assign list with a pick; the Hall folded and open
  for (const h of S.holdings) { openHold(h.id); check('hold ' + h.name); UI.assign = 'hold'; UI.assignTo = (S.notables.find(m => !m.isKing && m.place !== h.id) || {}).id || null; render(); check('hold assign ' + h.name); closeHold(); }
  for (const m of S.notables.filter(m => !m.isKing).slice(0, 2)) { openCard(m.id); UI.assign = 'man'; UI.assignTo = S.holdings[0] ? S.holdings[0].id : null; render(); check('man assign ' + m.name); closeCard(); }
  for (const k of ['home', 'holdings']) { UI.pane = 'hall'; toggleFold(k); check('fold ' + k); toggleFold(k); }
  // − and + land on multiples of five
  { const m = S.notables.find(m => m.men % 5); if (m && m.men >= 5) { const was = m.men; stepMen(S, m.id, -1); if (m.men !== Math.ceil(was / 5) * 5 - 5) { console.log('step', was, m.men); fails++; } } }
  // buildings (reflex run 2): every row armed on the sheet; the first holding takes a market and a longhouse once, and keeps them through the winters
  if (S.holdings[0] && !(global.builtOnce && global.builtOnce.line === lines)) { const h = S.holdings[0], sh = S.shores[h.id]; openHold(h.id); for (const k of Object.keys(BUILDINGS)) { UI.build = k; render(); check('build armed ' + k); }
    const was = S.silver; S.silver = Math.max(was, T.build.market + T.build.longhouse); act(() => { build(S, h.id, 'market'); build(S, h.id, 'longhouse'); });
    if (!built(sh, 'market') || !built(sh, 'longhouse') || h.pay !== holdPay(sh) + marketGain(sh)) { console.log('build failed', h.name, sh.built, h.pay); fails++; }
    const silver = S.silver; build(S, h.id, 'market'); if (S.silver !== silver) { console.log('market built twice'); fails++; }
    render(); check('build built'); closeHold(); S.silver = Math.min(S.silver, was); global.builtOnce = { id: h.id, line: lines }; }
  if (global.builtOnce && global.builtOnce.line === lines && S.shores[global.builtOnce.id].built.length !== 2) { console.log('the coast lost its buildings', global.builtOnce.id); fails++; }
  // the stats move both ways (TODO 47): a run reaches the step and the stat rises, a fall ends the run, five is the height, one is the floor; an old save keeps its raid progress
  if (global.statsOnce !== lines) { global.statsOnce = lines; const m = makeMan('Smoke', 3, 2, 5, {}); m.raidRun = T.grow[2] - 1;
    if (!grow(m, 'combat', T.grow) || m.combat !== 4 || m.raidRun !== 0 || toGrow(m, 'combat', T.grow) !== T.grow[3]) { console.log('grow combat', m.combat, m.raidRun); fails++; }
    if (grow(m, 'follow', T.growF) || m.follow !== 5 || toGrow(m, 'follow', T.growF) !== 0) { console.log('grow past five', m.follow); fails++; }
    m.heldRun = 2; if (!fall(m, 'rule') || m.rule !== 1 || m.heldRun !== 0 || fall(m, 'rule') || m.rule !== 1) { console.log('fall rule', m.rule, m.heldRun); fails++; }
    const old = migrate(JSON.parse(JSON.stringify(S))); for (const x of old.notables) { delete x.raidRun; delete x.winRun; } const mg = migrate(old); if (mg.notables.some(x => x.raidRun === undefined || x.winRun === undefined || x.raidRun !== (x.raids || 0) % 3)) { console.log('migrate runs'); fails++; }
    openMan(S.king.id) && 0; UI.man = S.king.id; render(); check('man card stats'); if (!app.innerHTML.includes('Combat rises')) { console.log('no stats line on the card'); fails++; } UI.man = null; render(); }
  // the hall (reflex run 3): the sheet opened at every tier; raised once with the chest forced high; short of silver, twice, and at the top it is refused
  if (S.hall === 0 && global.hallOnce !== lines) { const was = S.silver, cap = benchCap(S), wait = quietWait(S), p0 = T.hall.price[0];
    openHall(); check('hall'); S.silver = p0 - 1; render(); check('hall short'); const short = S.silver; raiseHall(S); if (S.hall !== 0 || S.silver !== short) { console.log('hall raised short of silver'); fails++; }
    S.silver = p0 + 40; render(); check('hall affordable'); act(() => raiseHall(S));
    if (S.hall !== 1 || S.silver !== 40 || benchCap(S) !== cap + 1 || quietWait(S) !== wait - 1 || S.deeds.raised !== 1 || !hallName(S)) { console.log('hall raise failed', S.hall, S.silver, benchCap(S), cap); fails++; }
    const after = S.silver; raiseHall(S); if (S.hall !== 1 || S.silver !== after) { console.log('hall raised twice on a short chest'); fails++; }
    S.silver = T.hall.price[0]; raiseHall(S); if (S.hall !== 1) { console.log('hall raised out of order (tier 2 for tier 1 silver)'); fails++; }
    render(); check('hall raised'); S.hall = 2; render(); check('hall tier 2'); S.hall = T.hall.price.length; S.silver = 99999; render(); check('hall top'); if (canRaise(S)) { console.log('hall raised past the top'); fails++; }
    S.hall = 1; closeHall(); S.silver = Math.min(S.silver, was); global.hallOnce = lines; }
  if (global.hallOnce === lines && S.hall < 1) { console.log('the hall lost its tier'); fails++; }
  // a man over his cap (a dead Ring-giver's men): − steps him down to the next five, + gives him nothing (reflex run 1)
  { const m = S.notables.find(m => !m.isKing); if (m) { const was = m.men, cap = fCap(S, m); m.men = cap + 7; stepMen(S, m.id, -1); if (m.men !== cap + 5) { console.log('step over cap down', cap + 7, m.men); fails++; } stepMen(S, m.id, 1); if (m.men !== cap + 5) { console.log('step over cap up', cap + 5, m.men); fails++; } m.men = was; } }
  if (r() < 0.15) { act(() => kingStays(S, true)); act(() => boardAll(S)); if (S.king.place !== 'home') { console.log('king boarded with kingHome'); fails++; } act(() => kingStays(S, false)); }
  // decide: everyone aboard most years, king home some years
  if (r() < 0.8) act(() => boardAll(S)); else { act(() => boardAll(S)); act(() => place(S, S.king.id, 'home')); }
  const ship = S.notables.filter(m => m.place === 'ship');
  if (ship.length) {
    const seen = Object.values(S.shores).filter(x => x.seen && x.id !== HOME_ID && !isHolding(S, x.id)).sort((a, b) => b.loot - a.loot);
    const Sh = strengthShip(S);
    const pick = seen.find(x => x.def < Sh * 0.9);
    const before = S.destination;
    if (pick && r() < 0.75) act(() => setDestination(S, pick.id)); else if (!S.destination || r() < 0.3) act(() => setDestination(S, 'blind'));
    const lf = landfalls; const wasSeen = S.destination !== 'blind' && S.shores[S.destination].seen;
    act(() => sail(S));
    if (wasSeen && S.queue[0] && S.queue[0].t === 'fight') skips++;
  } else act(() => sail(S));
  check('after sail');
}
console.log(JSON.stringify({ seed: SEED, day: DAY, from: year0, to: S && S.year, gens: S && S.gen, deaths, regents, stepdowns, fights, stays, winters, markets, landfalls, skipsOK: skips > 0, homes, lines, renders, reloads, fails, log: S && S.log.length, holdings: S && S.holdings.length, men: S && S.men, silver: S && S.silver, lost: S && S.lost.length }));
// the end card and begin again
if (S && S.queue[0] && S.queue[0].t === 'end') { render(); check('end'); act(() => { archive(S, 'reached 1066'); S = null; }); check('setup after end'); if (!app.innerHTML.includes('Past kings')) { console.log('no past kings'); fails++; } }
// a fresh run: two-tap abandon
startGame('rollo'); act(() => next(S)); UI.saga = true; render(); check('saga fresh');
newDynasty(); if (!app.innerHTML.includes('Tap again')) { console.log('not armed'); fails++; }
newDynasty(); if (S !== null) { console.log('not abandoned'); fails++; } check('setup after abandon');
if ((loadPast().length) !== lines + 1) { console.log('past count', loadPast().length); fails++; }
// migrate an old-shaped save: string log; a queued market is the market sheet now (41B.4) and stays
const old = newGame('ragnar'); old.log = ['801: Kent plundered for 40 silver.', 'Bjorn kneels.']; old.queue = [{ t: 'market' }]; old.phase = 'winter'; old.flags = {}; delete old.lost;
const mig = migrate(JSON.parse(JSON.stringify(old)));
if (mig.log[0].y !== 801 || mig.log[1].y !== null || mig.queue[0].t !== 'market') { console.log('migrate', JSON.stringify(mig.log), mig.queue); fails++; }
console.log(fails ? `FAIL ${fails}` : 'OK');
process.exit(fails ? 1 : 0);
