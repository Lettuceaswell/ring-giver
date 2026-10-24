// headless dynasty: fake DOM + localStorage, runs the real coast/world/game/ui files, drives every spring and every scene. Usage: node tools/smoke.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
const app = { innerHTML: '' };
global.document = { querySelector: sel => sel === '#app' ? app : null };
global.window = {};
global.navigator = {};
const src = ['coast.js', 'world.js', 'game.js', 'ui.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
// expose everything: strip top-level const/let so they become globals under eval in sloppy mode
const code = src.replace(/^(const|let) /gm, 'var ');
let fails = 0, renders = 0;
const check = (where) => { renders++; const h = app.innerHTML; for (const bad of ['undefined', 'NaN', '[object', 'null silver']) if (h.includes(bad)) { fails++; console.log('BAD', where, bad, h.slice(Math.max(0, h.indexOf(bad) - 120), h.indexOf(bad) + 40).replace(/\s+/g, ' ')); if (fails > 8) process.exit(1); } };
eval(code);
// start
check('setup empty');
if (!app.innerHTML.includes('Ring Giver')) { console.log('no setup'); process.exit(1); }
startGame('ragnar'); check('intro');
let year0 = S.year, deaths = 0, stays = 0, fights = 0, winters = 0, skips = 0, landfalls = 0, maxYears = 700;
const r = rng('smoke');
function drive() {
  const sc = S.queue[0];
  if (!sc) return false;
  if (sc.t === 'arrive') { landfalls++; act(() => chooseTarget(S, sc.targets[0])); }
  else if (sc.t === 'fight') { fights++; act(() => next(S)); }
  else if (sc.t === 'stay') { const ship = S.notables.filter(m => m.place === 'ship' && !m.isKing); if (ship.length && r() < 0.6) { stays++; act(() => chooseStay(S, ship[0].id)); } else if (sc.walked && r() < 0.5) { act(() => chooseStay(S, 'walked')); } else act(() => choosePlunder(S)); }
  else if (sc.t === 'winter') { winters++; if (S.silver > 60 && r() < 0.7) act(() => buyMen(S, 10)); check('winter'); act(() => closeWinter(S)); }
  else if (sc.t === 'event') { if (sc.choice) { act(() => answerSuitor(S, r() < 0.5)); check('event answered'); } if (sc.roll) { UI.rolled = S.year; render(); check('event rolled'); } act(() => next(S)); } // the winter card: answer, turn the King's card, move on
  else if (sc.t === 'fork') act(() => takeTitle(S, sc.offers[r() < 0.5 ? 0 : 1]));
  else if (sc.t === 'death') { deaths++; act(() => startSuccession(S)); }
  else if (sc.t === 'heir') act(() => chooseHeir(S, sc.sons[0]));
  else if (sc.t === 'oath') act(() => oathPay(S, S.silver >= sc.price && r() < 0.7));
  else if (sc.t === 'coronation') act(() => finishCoronation(S));
  else if (sc.t === 'end') return 'end';
  else act(() => next(S));
  check(sc.t);
  return true;
}
while (S && maxYears-- > 0) {
  // spring
  while (S.queue.length) { const d = drive(); if (d === 'end') break; }
  if (S.queue.length && S.queue[0].t === 'end') break;
  if (S.phase !== 'spring') { console.log('not spring after queue drained', S.phase, S.year); fails++; break; }
  for (const pane of ['map', 'ship', 'hall']) { UI.pane = pane; render(); check('pane ' + pane); }
  UI.saga = true; render(); check('saga'); UI.saga = false;
  UI.picker = true; render(); check('picker'); UI.picker = false;
  for (const m of S.notables) { UI.man = m.id; render(); check('man ' + m.name); } UI.man = null;
  for (const k of Object.values(S.rulers)) if (k.known) { UI.man = k.id; render(); check('ruler ' + k.name); } UI.man = null;
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
console.log(JSON.stringify({ from: year0, to: S && S.year, gens: S && S.gen, deaths, fights, stays, winters, landfalls, skipsOK: skips > 0, renders, fails, log: S && S.log.length, holdings: S && S.holdings.length, men: S && S.men, silver: S && S.silver, lost: S && S.lost.length }));
// the end card and begin again
if (S && S.queue[0] && S.queue[0].t === 'end') { render(); check('end'); act(() => { archive(S, 'reached 1066'); S = null; }); check('setup after end'); if (!app.innerHTML.includes('Past kings')) { console.log('no past kings'); fails++; } }
// a fresh run: two-tap abandon
startGame('rollo'); act(() => next(S)); UI.saga = true; render(); check('saga fresh');
newDynasty(); if (!app.innerHTML.includes('Tap again')) { console.log('not armed'); fails++; }
newDynasty(); if (S !== null) { console.log('not abandoned'); fails++; } check('setup after abandon');
if ((loadPast().length) !== 2) { console.log('past count', loadPast().length); fails++; }
// migrate an old-shaped save: string log, market card in queue
const old = newGame('ragnar'); old.log = ['801: Kent plundered for 40 silver.', 'Bjorn kneels.']; old.queue = [{ t: 'market' }]; old.phase = 'winter'; old.flags = {}; delete old.lost;
const mig = migrate(JSON.parse(JSON.stringify(old)));
if (mig.log[0].y !== 801 || mig.log[1].y !== null || mig.queue[0].t !== 'winter') { console.log('migrate', JSON.stringify(mig.log), mig.queue); fails++; }
console.log(fails ? `FAIL ${fails}` : 'OK');
process.exit(fails ? 1 : 0);
