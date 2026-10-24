// Headless persona playtests for Ring Giver (docs/TODO.md item 25).
// Usage: node tools/playtest/run.js [--seeds N] [--persona name] [--king ragnar|rollo] [--json out.json]
// Loads coast.js, world.js, game.js (no ui.js, no DOM) into a vm context with its own Math.random and Date, so a seed and a persona always
// give the same dynasty. The game is never edited; its public functions are driven exactly as the UI would, and a few are wrapped to count events.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..', '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const SEEDS = +opt('seeds', 8), ONLY = opt('persona', null), KING = opt('king', 'ragnar'), JSON_OUT = opt('json', null);

// ---- load the game into a sandbox --------------------------------------------------------
let DAY = 'pt-0000001', RAND = () => 0.5;
class FakeDate { toISOString() { return DAY; } static now() { return 0; } }
const sandbox = { console, Date: FakeDate, __rand: () => RAND(), localStorage: { getItem: () => null, setItem() {}, removeItem() {} } };
const ctx = vm.createContext(sandbox);
const src = ['coast.js', 'world.js', 'game.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n').replace(/^(const|let) /gm, 'var ');
vm.runInContext(src + '\nMath.random = __rand;', ctx);
const G = ctx; // every top-level function and table of the game, as globals of the sandbox
const personas = require('./personas.js')(G);

function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

G.save = () => {}; // the game saves to localStorage after every step; nothing to save here, and the stringify is the slow part
// ---- counting hooks (wrap game functions; behaviour unchanged) -------------------------------
let M = null; // metrics of the run in progress
const origMarkLost = G.markLost;
G.markLost = (s, h, why) => { if (M) { if (/walked/.test(why)) M.holdWalked++; else if (/empty/.test(why)) M.holdEmpty++; else if (/taken by/.test(why)) M.holdTaken++; else M.holdRevolt++; M.holdLost++; } origMarkLost(s, h, why); };
const origCheckBreak = G.checkBreak;
G.checkBreak = (s, k) => { const was = k && k.broken; origCheckBreak(s, k); if (M && k && k.broken && !was) { M.realmsBroken++; if (M.firstHostile[k.id] != null) M.breakWinters.push(s.year - M.firstHostile[k.id]); } };

// ---- the driver ------------------------------------------------------------------------------
function newMetrics() {
  return { fights: 0, lost: 0, menLostFights: 0, lootTotal: 0, starveYears: 0, starveHard: 0, starveNewKing: 0, starveMen: 0, hallFell: 0, rivalSails: 0, rivalSilver: 0, rivalMen: 0,
    holdGained: 0, holdLost: 0, holdWalked: 0, holdEmpty: 0, holdRevolt: 0, holdTaken: 0, realmsBroken: 0,
    firstHostile: {}, breakWinters: [],
    kingFell: 0, kingSlain: 0, jarlFell: 0, hallSlain: 0, starveWalk: 0, stirs: 0, strikes: 0, strikesHeld: 0, firstBreakYear: null, kingDeaths: 0, jarlDeaths: 0, titles: 0, menBought: 0,
    hostileEpisodes: 0, hostileResolved: 0, hostileWinters: [], hostileOpen: 0, hostileJarlYears: 0,
    holdByDecade: {}, chestSum: 0, chestYears: 0, chestMin: Infinity, menSum: 0, years: 0, eventsBy: {} };
}

function allocate(s, order, homeOrder) {
  // zero everyone, then hand the men out in order, each clamped to his cap and what is left of the pool (what addMen does, without its O(n) scan per call)
  for (const m of s.notables) m.men = 0;
  let pool = s.men;
  for (const [m, n] of order) { const d = Math.max(0, Math.min(n, fCap(s, m), pool)); m.men = d; pool -= d; }
  for (const m of homeOrder) { if (!pool) break; const d = Math.max(0, Math.min(fCap(s, m) - m.men, pool)); m.men += d; pool -= d; }
}
const fCap = (s, m) => G.fCap(s, m);

function springPlan(s, P, run) {
  const k = s.king;
  P.extras(s);
  // 1. everyone not holding a shore starts at home
  for (const m of s.notables) if (!s.holdings.some(h => h.id === m.place)) m.place = 'home';
  // 2. garrisons
  const garr = [];
  if (P.garrison !== 'none') {
    for (const h of s.holdings) {
      let j = s.notables.find(m => m.place === h.id);
      const sh = s.shores[h.id];
      if (!j) {
        const free = G_free(s).sort((a, b) => b.rule - a.rule || a.combat - b.combat);
        const pick = free.find(m => P.garrison === 'full' || m.rule * fCap(s, m) * 0.9 > h.unrest);
        if (pick) { G.place(s, pick.id, h.id); j = pick; }
      }
      if (j) {
        const cap = fCap(s, j); let need = Math.ceil(h.unrest / (0.9 * Math.max(1, j.rule))) + 1;
        // a coast taken from a king who is hostile: he will come for it (TODO 25). A careful hand garrisons against his host if the jarl can
        const foe = Object.values(s.rulers).find(r => r.known && !r.broken && r.coasts.includes(h.id) && G.stanceWord(r.stance) === 'hostile');
        if (foe && P.defend) { const host = (G.T.strikeBase + G.T.strikePer * foe.coasts.filter(c => !G.isHolding(s, c)).length) * 1.15, n2 = Math.ceil(host / (0.85 * Math.max(1, j.rule))) + 1; if (n2 <= cap) need = Math.max(need, n2); }
        const feasible = j.rule * cap * 0.9 > h.unrest;
        if (feasible) garr.push([j, Math.min(cap, need)]);
        else if (P.garrison === 'full') garr.push([j, cap]);
        else { G.place(s, j.id, 'home'); } // hopeless: leave it empty, keep the jarl and his men for the ship
      }
    }
  }
  // 2b. the hall's guard (TODO 25: a fallen hall can kill): when a king is hostile or the chest draws sails, someone stays home with his men
  if (P.guard && (s.silver >= G.T.richHall || Object.values(s.rulers).some(r => r.known && !r.broken && G.stanceWord(r.stance) === 'hostile'))) {
    const g = !P.kingSails(s) ? k : G_free(s).filter(m => m.place === 'home').sort((a, b) => b.rule * fCap(s, b) - a.rule * fCap(s, a))[0];
    const left = s.men - garr.reduce((a, [, n]) => a + n, 0); // the guard takes at most half the men the holdings leave: the ship still sails
    if (g) { g.place = 'home'; g.guarding = true; garr.push([g, Math.min(fCap(s, g), Math.floor(left / 2))]); }
  }
  const crewPool = () => G_free(s).filter(m => !m.guarding);
  // 3. crew
  const sailing = [];
  if (P.kingSails(s) && !k.guarding) sailing.push(k);
  if (P.jarlsSail(s)) sailing.push(...crewPool());
  const crew = [...new Set(sailing)].sort((a, b) => b.combat - a.combat);
  for (const m of crew) m.place = 'ship';
  const homeFolk = () => s.notables.filter(m => m.place === 'home').sort((a, b) => b.rule - a.rule);
  allocate(s, [...garr, ...crew.map(m => [m, fCap(s, m)])], homeFolk());
  // 4. destination
  const Sh = G.strengthShip(s);
  if (process.env.TRACE && s.year % 20 === 0) console.log(s.year, 'ship', Sh, 'men', s.men, 'silver', s.silver, 'holdings', s.holdings.length, 'named', s.notables.length, 'crew', crew.length);
  let dest = crew.length && Sh > 0 ? P.dest(s, Sh) : null;
  if (!dest) { for (const m of crew) m.place = 'home'; allocate(s, garr, homeFolk()); G.setDestination(s, null); s.destination = null; run.noSail++; }
  else { G.setDestination(s, dest); run.sails++; if (dest === 'blind') run.blind++; }
  s.guardSnap = s.notables.filter(m => m.place === 'home').reduce((a, m) => a + m.rule * m.men, 0);
  for (const m of s.notables) delete m.guarding;
  G.sail(s);
}
function G_free(s) { return s.notables.filter(m => !m.isKing && !s.holdings.some(h => h.id === m.place)); }

function trackRulers(s, run, M) {
  for (const k of Object.values(s.rulers)) {
    const hostile = k.known && !k.broken && G.stanceWord(k.stance) === 'hostile', ep = run.hostile[k.id];
    if (hostile && !ep) { run.hostile[k.id] = { y: s.year }; M.hostileEpisodes++; if (M.firstHostile[k.id] == null) M.firstHostile[k.id] = s.year; }
    else if (!hostile && ep) { M.hostileResolved++; M.hostileWinters.push(s.year - ep.y); delete run.hostile[k.id]; }
  }
}

function runOne(name, seed) {
  const P = personas[name];
  DAY = 'pt-' + String(seed).padStart(7, '0');
  RAND = mulberry32(seed * 7919 + 13);
  M = newMetrics();
  const s = G.migrate(G.newGame(KING));
  s.pt = { lastStay: 793 };
  const run = { sails: 0, noSail: 0, blind: 0, hostile: {} };
  let endReason = null, guard = 0;
  const holdSeries = {};
  const drive = () => {
    const sc = s.queue[0]; if (!sc) return false;
    switch (sc.t) {
      case 'arrive': G.chooseTarget(s, P.target(s, sc)); break;
      case 'fight': M.fights++; if (!sc.win) M.lost++; M.menLostFights += sc.losses; M.lootTotal += sc.loot; G.next(s); break;
      case 'stay': {
        const c = P.stay(s, sc);
        if (c === 'plunder') G.choosePlunder(s); else { G.chooseStay(s, c); M.holdGained++; s.pt.lastStay = s.year; }
        break; }
      case 'summary': if (s.phase === 'summer' && sc.lines.some(l => / went down /.test(l))) M.jarlFell += sc.lines.filter(l => / went down at /.test(l)).length; G.next(s); break;
      case 'winter': {
        trackRulers(s, run, M);
        for (const e of sc.events || []) { if (/will not starve/.test(e.t)) M.starveWalk++; if (/ stirs\.$/.test(e.t)) M.stirs++; if (/ came for /.test(e.t)) { M.strikes++; M.strikesHeld++; } if (/ took /.test(e.t)) M.strikes++; }
        if (sc.eat && sc.eat.starve) { M.starveYears++; M.starveMen += sc.eat.starve; if (/hard/.test(sc.eat.why) || sc.eat.due > sc.eat.base) M.starveHard++; else if (!s.king.titles.includes('deepchest') && s.pt.deepKing) M.starveNewKing++; }
        s.pt.deepKing = s.king.titles.includes('deepchest');
        { const inc = Math.max(0, s.silver + (sc.eat ? sc.eat.paid : 0) - (sc.spring == null ? s.silver : sc.spring)); s.pt.last = s.pt.last == null ? inc : s.pt.last; s.pt.income = Math.min(inc, s.pt.last); s.pt.last = inc; } // the lesser of this year's and last year's (a doubled harvest is not a trend)
        const n = Math.min(P.buy(s, sc), Math.floor(s.silver / (G.has(s, 'fairdealer') ? 2 : G.T.manPrice))); if (n > 0) { G.buyMen(s, n); M.menBought += n; }
        const sv = s.silver, mn = s.men; G.closeWinter(s);
        const ev = s.queue[0];
        if (ev && ev.t === 'event') { M.eventsBy[ev.ev] = (M.eventsBy[ev.ev] || 0) + 1; if (ev.ev === 'jarlDeath') M.jarlDeaths++;
          if (ev.ev === 'rival') { M.rivalSails++; if (process.env.TRACE) console.log(s.year, 'rival:', ev.lines.join(' / '), 'silver', sv); if (/hall fell/.test(ev.lines[0])) { M.hallFell++; M.rivalSilver += sv - s.silver; M.rivalMen += mn - s.men; }
            if (ev.lines.some(l => /died in the door of his hall/.test(l))) M.kingSlain++; else if (ev.lines.some(l => /died in the door/.test(l))) M.hallSlain++; } }
        break; }
      case 'event': G.acceptSuitor(s, sc.choice ? P.suitor(s, sc) : false); break;
      case 'fork': G.takeTitle(s, P.titles(sc.offers)); M.titles++; break;
      case 'death': if (process.env.TRACE) console.log(s.year, s.phase, 'dies:', s.king.name, s.king.age, 'sons:', s.notables.filter(m => m.son).map(m => m.name + m.age).join(' ')); M.kingDeaths++; if (s.phase === 'summer') M.kingFell++; G.startSuccession(s); break;
      case 'heir': G.chooseHeir(s, P.heir(s, sc)); break;
      case 'oath': G.oathPay(s, P.oath(s, sc)); break;
      case 'coronation': G.finishCoronation(s); break;
      case 'end': endReason = sc.reason; return 'end';
      default: G.next(s);
    }
    return true;
  };
  while (guard++ < 1000) {
    let n = 0;
    while (s.queue.length && n++ < 400) if (drive() === 'end') break;
    if (endReason) break;
    if (s.phase !== 'spring') throw new Error(`stuck: phase ${s.phase} year ${s.year} queue ${JSON.stringify(s.queue.map(q => q.t))}`);
    // spring: sample, then decide
    trackRulers(s, run, M);
    const d = Math.floor((s.year - 793) / 10), hs = holdSeries[d] = holdSeries[d] || [0, 0]; hs[0] += s.holdings.length; hs[1]++;
    M.chestSum += s.silver; M.chestYears++; M.chestMin = Math.min(M.chestMin, s.silver); M.menSum += s.men; M.years++;
    M.hostileJarlYears += s.notables.filter(m => !m.isKing && G.stanceWord(m.stance) === 'hostile').length;
    springPlan(s, P, run);
  }
  trackRulers(s, run, M);
  M.hostileOpen = Object.keys(run.hostile).length;
  const hostileWinters = M.hostileWinters.length ? M.hostileWinters.reduce((a, b) => a + b, 0) / M.hostileWinters.length : null;
  const broke = endReason === 'noheir';
  const holdByDecade = []; for (let d = 0; d <= Math.floor((s.year - 793) / 10); d++) { const h = holdSeries[d]; holdByDecade.push(h ? +(h[0] / h[1]).toFixed(2) : null); }
  const hy = Object.values(holdSeries).reduce((a, h) => a + h[0], 0), hn = Object.values(holdSeries).reduce((a, h) => a + h[1], 0);
  const out = {
    persona: name, seed, endYear: s.year, broke, survived: !broke, gens: s.gen, reason: endReason,
    fights: M.fights, fightsLost: M.lost, lossPct: M.fights ? 100 * M.lost / M.fights : 0, menLostFights: M.menLostFights, lootTotal: M.lootTotal,
    starveYears: M.starveYears, starveHard: M.starveHard, starveMen: M.starveMen, rivalSails: M.rivalSails, hallFell: M.hallFell, rivalSilver: M.rivalSilver, rivalMen: M.rivalMen,
    holdAvg: hn ? hy / hn : 0, holdMax: Math.max(0, ...Object.values(holdSeries).map(h => h[0] / h[1])), holdGained: M.holdGained, holdLost: M.holdLost,
    holdWalked: M.holdWalked, holdEmpty: M.holdEmpty, holdRevolt: M.holdRevolt, holdTaken: M.holdTaken, holdByDecade,
    kingFell: M.kingFell, kingSlain: M.kingSlain, jarlFell: M.jarlFell, hallSlain: M.hallSlain, starveWalk: M.starveWalk, stirs: M.stirs, strikes: M.strikes, strikesHeld: M.strikesHeld,
    breakWinters: M.breakWinters.length ? M.breakWinters.reduce((a, b) => a + b, 0) / M.breakWinters.length : null,
    holdAt850: (holdSeries[5] ? holdSeries[5][0] / holdSeries[5][1] : null),
    hostileEpisodes: M.hostileEpisodes, hostileResolved: M.hostileResolved, hostileOpen: M.hostileOpen, hostileWinters, hostileWintersAll: M.hostileWinters, realmsBroken: M.realmsBroken,
    hostileJarlYears: M.hostileJarlYears, kingDeaths: M.kingDeaths, jarlDeaths: M.jarlDeaths, titles: M.titles, menBought: M.menBought,
    chestAvg: M.chestYears ? M.chestSum / M.chestYears : 0, chestMin: isFinite(M.chestMin) ? M.chestMin : 0, menAvg: M.years ? M.menSum / M.years : 0,
    sails: run.sails, noSail: run.noSail, blind: run.blind, eventsBy: M.eventsBy,
    finalSilver: s.silver, finalMen: s.men, finalHoldings: s.holdings.length, finalNotables: s.notables.length,
  };
  M = null;
  return out;
}

// ---- run everything, aggregate, print ----------------------------------------------------------------
const NAMES = Object.keys(personas).filter(n => !ONLY || n === ONLY);
if (!NAMES.length) { console.error('no such persona: ' + ONLY + ' (have ' + Object.keys(personas).join(', ') + ')'); process.exit(1); }
const runs = [];
const ONE = opt('seed', null); // --seed N: that seed only (with TRACE=1 in the environment, the kings and the line are printed)
for (const n of NAMES) for (let sd = ONE ? +ONE : 1; sd <= (ONE ? +ONE : SEEDS); sd++) runs.push(runOne(n, sd));

const stat = (rs, f) => { const v = rs.map(f).filter(x => x !== null && x !== undefined && !Number.isNaN(x)); if (!v.length) return null; return { mean: v.reduce((a, b) => a + b, 0) / v.length, min: Math.min(...v), max: Math.max(...v), n: v.length }; };
const fmt = x => Math.abs(x) >= 100 ? String(Math.round(x)) : Math.abs(x) >= 10 ? x.toFixed(0) : x === Math.round(x) ? String(x) : x.toFixed(1);
const cell = st => st ? `${fmt(st.mean)} (${fmt(st.min)}-${fmt(st.max)})` : '-';
const pad = (t, w) => (t + ' '.repeat(w)).slice(0, w), padl = (t, w) => (' '.repeat(w) + t).slice(-w);
function table(title, cols) { // cols: [header, fn(runs of a persona) -> string]
  const rows = NAMES.map(n => { const rs = runs.filter(r => r.persona === n); return [n, ...cols.map(([, f]) => f(rs))]; });
  const heads = ['persona', ...cols.map(([h]) => h)];
  const w = heads.map((h, i) => Math.max(h.length, ...rows.map(r => r[i].length)));
  const line = r => r.map((c, i) => i === 0 ? pad(c, w[0]) : padl(c, w[i])).join('  ');
  console.log(['\n' + title, line(heads), ...rows.map(line)].join('\n'));
}
const S = (f) => rs => cell(stat(rs, f));
console.log(`Ring Giver persona playtest  ·  ${SEEDS} seeds (pt-0000001..${String(SEEDS).padStart(7, '0')}) · king ${KING} · cells are mean (min-max) over seeds`);
table('THE LINE', [['broke/runs', rs => `${rs.filter(r => r.broke).length}/${rs.length}`], ['end year', S(r => r.endYear)], ['kings', S(r => r.gens)], ['king deaths', S(r => r.kingDeaths)], ['jarl deaths', S(r => r.jarlDeaths)], ['titles', S(r => r.titles)]]);
table('WAR AND HALL', [['fights', S(r => r.fights)], ['lost', S(r => r.fightsLost)], ['lost %', S(r => r.lossPct)], ['starve yrs', S(r => r.starveYears)], ['starve men', S(r => r.starveMen)], ['hall fell', S(r => r.hallFell)], ['men bought', S(r => r.menBought)]]);
table('LAND', [['hold avg/yr', S(r => r.holdAvg)], ['hold peak', S(r => r.holdMax)], ['gained', S(r => r.holdGained)], ['lost', S(r => r.holdLost)], ['jarl walked', S(r => r.holdWalked)], ['hostile jarl-yrs', S(r => r.hostileJarlYears)]]);
table('NEW TEETH (TODO 25)', [['king fell', S(r => r.kingFell)], ['king slain', S(r => r.kingSlain)], ['jarls fell', S(r => r.jarlFell)], ['hall slain', S(r => r.hallSlain)], ['starve walk', S(r => r.starveWalk)], ['stirs', S(r => r.stirs)], ['strikes', S(r => r.strikes)], ['struck held', S(r => r.strikesHeld)], ['revolt', S(r => r.holdRevolt)], ['taken', S(r => r.holdTaken)], ['hold@843-852', S(r => r.holdAt850)]]);
table('RULERS', [['went hostile', S(r => r.hostileEpisodes)], ['calmed', S(r => r.hostileResolved)], ['winters to calm', S(r => r.hostileWinters)], ['still hostile', S(r => r.hostileOpen)], ['realms broken', S(r => r.realmsBroken)], ['hostile→kneels yrs', S(r => r.breakWinters)]]);
table('THE END', [['final silver', S(r => r.finalSilver)], ['final men', S(r => r.finalMen)], ['final holdings', S(r => r.finalHoldings)], ['chest avg', S(r => r.chestAvg)], ['chest min', S(r => r.chestMin)], ['men avg', S(r => r.menAvg)]]);
// holdings by era
const ERAS = [[793, 849], [850, 899], [900, 949], [950, 999], [1000, 1066]];
const eraMean = (r, [a, b]) => { const v = []; for (let d = 0; d < r.holdByDecade.length; d++) { const y0 = 793 + d * 10; if (r.holdByDecade[d] !== null && y0 + 9 >= a && y0 <= b) v.push(r.holdByDecade[d]); } return v.length ? v.reduce((x, y) => x + y, 0) / v.length : null; };
table('HOLDINGS HELD BY ERA (mean of decade means; seeds still alive)', ERAS.map(e => [`${e[0]}-${e[1]}`, rs => cell(stat(rs, r => eraMean(r, e)))]));

if (JSON_OUT) {
  const summary = {}; for (const n of NAMES) { const rs = runs.filter(r => r.persona === n); summary[n] = {}; for (const k of Object.keys(rs[0])) if (typeof rs[0][k] === 'number') summary[n][k] = stat(rs, r => r[k]); }
  fs.writeFileSync(JSON_OUT, JSON.stringify({ seeds: SEEDS, king: KING, summary, runs }, null, 1));
  console.log(`\nwrote ${JSON_OUT}`);
}
