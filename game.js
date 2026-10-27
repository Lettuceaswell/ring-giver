// ---- Tuning (GDD §13) ----------------------------------------------------------
const T = { startMen: 40, menPerF: 10, manPrice: 3, upkeep: 1, rumor: 20, startYear: 793, endYear: 1066,
  emptyUnrest: 10, heldCalm: 5, quietYears: 5, forkAges: [25, 35, 45, 55],
  gift: 20, giftWarm: 15, hallWarm: 5, idleSour: 3, walkChance: 0.35, realmGrow: 30, raidSour: 10, takeSour: 25,
  // TODO 25, the persona playtests: what makes a bad plan lose
  fallLoss: 0.25, fallWin: 0.25,   // a named man aboard falls in a lost fight at lossFrac x fallLoss; in a bloody win at (lossFrac - 0.2) x fallWin
  defWin: 1.3, defCap: 1000, defMend: 0.965, // after a win a coast's defenders x defWin (cap defCap); each autumn x defMend back toward its own (was 1.2, 200, 0.95)
  hallSlay: 0.5, guardSave: 3, richHall: 300, richKing: 1, // a fallen hall kills a named man at hallSlay x (1 - guardSave x guard / fleet) x clamp(chest / richHall, king's fleet 1 | strange 0, 2); the victim is the King at chest / richHall x richKing (at most 0.75), else by lot
  starveSour: 10,                  // a hungry winter: every jarl sours (half at a holding); the sourest at home leaves with his men
  breakYears: 3,                   // summers a whole realm must be held before its king kneels
  strike: 0.3, strikeBase: 40, strikePer: 20, strikeSated: 20, // a hostile king comes for a holding that was his each summer at this chance; host = base + per x his free coasts; a coast won back warms him
  benches: 8,                      // named men without a holding the hall will feed at its table; past that no wanderer or local comes (sons always do)
  oldAge: 0.04,                    // past sixty a named man dies in his bed at oldAge x (age - 60) a winter
  reachBase: 4, reachRule: 2, reachRise: 0.003, reachMax: 0.05, // past reachBase + reachRule x the King's Rule holdings (10 at Rule 3), each holding stirs (unrest +15..40) at reachRise x the excess a summer, at most reachMax
  build: { market: 300, longhouse: 300, palisade: 200 }, marketPay: 0.5, longhouseMen: 5, palisadeCalm: 20,
  hall: { price: [400, 800, 1600], bench: 1, quiet: 1, seaman: 1, oath: 0.15 },
  grow: [2, 3, 5, 8], growF: [1, 1, 2, 3], ageFall: [50, 60],
  holyMend: 1.03, holyWall: 2, holySack: 0.3,
  championEvery: 10, championWall: 80 }; // a champion comes only from a line worth breaking (defenders at least championWall: a monastery's monks make none); // 41B.6: after a rout, once in this many years of a reign and only with a bench free, a fighter of the broken coast asks to follow the King; the reckoning lets the player refuse him // 41B.7, a monastery: its treasure comes back at holyMend a year (a town's at 1.1), its wall rises a tenth a sack and never past holyWall x its own; a sack leaves holySack of its treasure (a town keeps 0.6): the monks flee with the rest, so it is raided once a generation, as Lindisfarne was // TODO 47: a stat rises by doing, slower each step (raids or held summers to the next step, by the stat as it stands; big wins for Following), and falls by what goes wrong: a lost fight (the man who led), a holding lost, a named man who walks from a hungry hall, and the arm at 50 and 60; swept at 16 seeds, TODO 47: 3/5/8/12 and 46/56 took the King's Combat from 4.9 to 3.7 and doubled the idle chest // 41B.2 (reflex run 3), raise the hall: three tiers in spring; each adds a bench, takes a year off the wait for a new man, +1 to the seaman's weight in the winter deck, and 15% off the next Oath's price; cumulative // priced by the builder persona, reflex run 2: at 60/60/40 the chest rose; at 300/300/200 it fell 1177 → 719 and the line still lives // 41B.2 (reflex run 2): a Market adds marketPay x the coast's rent; a Longhouse sends longhouseMen to the jarl each spring; a Palisade takes palisadeCalm off the unrest and halves every rise after

const uid = () => Math.random().toString(36).slice(2, 8);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const has = (s, t) => s.king.titles.includes(t);
// the year's account, for the autumn ledger: the spring chest and everything that moved silver before the rent (rumor, gifts, the Oath: TODO 41A.8)
const newYr = spring => ({ spring, loot: 0, from: null, forfeit: null, beaten: null, bought: 0, rumor: 0, gifts: 0, giftN: 0, oath: [] });
// how a man came to be kin: a daughter wed to him, or the Oath he swore (TODO 41A.8); old saves know neither
const kinOf = m => m.wed || !m.sworn ? 'married into the line' : 'sworn to the line';

// a name no living man or child of the hall carries, so no card says "Odo died" twice (audit 3); when the list is spent, "Odo of Rouen"
function freshName(s, list, r, at) { const used = new Set([...s.notables.map(m => m.name), ...s.children.map(c => c.name)]), free = list.filter(n => !used.has(n)); return free.length ? r.pick(free) : `${r.pick(list)} of ${at || 'Vestfold'}`; }
// " 5 men walk home unled." / " One man walks home unled." / "" (audit 3: no more "His 0 men")
const unled = n => n ? ` ${n === 1 ? 'One man walks' : `${n} men walk`} home unled.` : '';
// the King's winter past fifty: the chance this winter takes him
const deathOdds = s => s.king.age > 50 ? 0.05 * (s.king.age - 50) * (has(s,'oldwise') ? 0.5 : 1) : 0;
function makeMan(name, c, r, f, extra = {}) {
  return { id: uid(), name, combat: clamp(c,1,5), rule: clamp(r,1,5), follow: clamp(f,1,5), place: 'home', men: 0, age: 25,
    kin: false, raids: 0, raidRun: 0, heldRun: 0, winRun: 0, stance: 0, why: [], ...extra };
}
// ---- Stats move both ways (TODO 47): a run of doing raises a stat when it reaches T.grow[stat − 1], and a fall ends the run ----
const RUN = { combat: 'raidRun', rule: 'heldRun', follow: 'winRun' };
function grow(m, stat, table) { if (m[stat] >= 5) return false; const run = RUN[stat]; m[run] = (m[run] || 0) + 1; if (m[run] < table[m[stat] - 1]) return false; m[run] = 0; m[stat]++; return true; }
function fall(m, stat) { m[RUN[stat]] = 0; if (m[stat] <= 1) return false; m[stat]--; return true; }
const toGrow = (m, stat, table) => m[stat] >= 5 ? 0 : table[m[stat] - 1] - (m[RUN[stat]] || 0); // how many more before the next step
// ---- Stance: one number per named man, read in words (GDD §15.1) ---------------
// Deeds move it; it is a view of the King, never a currency.
const STANCE = [[60, 'devoted'], [20, 'loyal'], [-20, 'cool'], [-60, 'sour'], [-Infinity, 'hostile']];
function stanceWord(v) { return STANCE.find(([lo]) => (v || 0) >= lo)[1]; }
function moveStance(s, m, d, why) {
  if (!m || !d || m.isKing) return;
  m.stance = clamp((m.stance || 0) + d, -100, 100);
  if (m.wroth != null && stanceWord(m.stance) !== 'hostile') m.wroth = null; // a king warmed out of hostility must stay hostile a full year again before his fleet sails
  if (m.moved && m.moved.y === s.year) m.moved.d += d; else m.moved = { y: s.year, d };
  const w = m.why = m.why || [], last = w[w.length - 1];
  if (last && last.t === why && Math.sign(last.d) === Math.sign(d)) { last.d += d; last.y = s.year; } // the same deed, year on year, is one line
  else { w.push({ y: s.year, t: why, d }); if (w.length > 6) w.shift(); }
}
// the King's Rule is what the hall pays (a third of its yield for each point) and how far his land runs before it stirs (session 13)
function hallPay(s, rule = s.king.rule) { return Math.round(holdPay(s.shores[HOME_ID]) * rule / 3); }
const reachFree = (s, rule = s.king.rule) => T.reachBase + T.reachRule * rule;
// the chronicle: one line, stamped with its year (GDD §16); the Saga sheet groups them
function log(s, t) { s.log.push({ y: s.year, t }); if (s.log.length > 3000) s.log.splice(0, s.log.length - 3000); }
// a man's stance moved this year or last: the card carries an arrow for one turn (TODO 21)
function stanceMoved(s, m) { return m.moved && m.moved.y >= s.year - 1 && m.moved.d ? Math.sign(m.moved.d) : 0; }
// how many more men the named men could lead; past that, bought men sit unled (TODO 20, the market's frame)
function menRoom(s) { return Math.max(0, s.notables.reduce((a, m) => a + fCap(s, m), 0) - s.men); }

// ---- Rulers and realms (GDD §15.3) -----------------------------------------------
function ownerOf(s, id) { return Object.values(s.rulers).find(k => k.coasts.includes(id)) || null; }
// a ruler comes out of the fog when one of his coasts does; then his whole realm is named on the map
function discoverRulers(s) {
  const found = [];
  for (const k of Object.values(s.rulers)) if (!k.known && k.coasts.some(c => s.shores[c].known)) { k.known = true; found.push(k); }
  for (const k of found) for (const c of k.coasts) s.shores[c].known = true;
  return found;
}
function rulerCards(s, found, envoy) { for (const k of found) s.queue.push({ t:'ruler', ruler: k.id, envoy: !!envoy }); }
// each ruler takes one free coast beside his realm every few years; never the player's, never another king's
function growRealms(s, lines, events = []) {
  for (const k of Object.values(s.rulers)) {
    if (k.broken || s.year < k.nextGrow) continue;
    const r = rng(s.day + ':grow:' + k.id + s.year);
    k.nextGrow = s.year + T.realmGrow + r.int(-8, 8);
    const cands = [...new Set(k.coasts.flatMap(c => s.shores[c].neighbors))].filter(id => id !== HOME_ID && !ownerOf(s, id) && !isHolding(s, id) && !s.shores[id].walked);
    if (!cands.length) continue;
    const id = r.pick(cands), sh = s.shores[id]; k.coasts.push(id); k.newest = id;
    if (k.known) { sh.known = true; lines.push(`${k.name}'s reach grows. ${sh.name} is his now.`); events.push({ k:'realm', t:`${k.name}'s reach grows.`, s:`${sh.name} is his now` }); }
    else if (sh.known || sh.neighbors.some(n => s.shores[n].known)) s.envoy = k.id; // his realm now touches what you know: his envoy comes this winter
  }
}
// hold every coast of a realm but the anchor and the ruler breaks: he kneels, and the anchor lies open
function checkBreak(s, k) {
  if (!k || k.broken) return;
  const rest = k.coasts.filter(c => c !== k.anchor);
  if (!rest.length || rest.some(c => !isHolding(s, c))) { k.yoke = null; return; }
  if (k.yoke == null) k.yoke = s.year; // the realm is held; he bends, and kneels only when it has stayed held (TODO 25)
  if (s.year - k.yoke < T.breakYears) return;
  k.broken = true; k.stance = 40; k.why = [{ y: s.year, t: 'his realm is yours; he kneels', d: 0 }];
  const a = s.shores[k.anchor]; a.holdable = true;
  s.queue.push({ t:'moment', tone:'boon', glyph:'crown', when:'Summer', title: `${k.name} kneels`, lead:'Every coast of his realm answers to you. He will not rise again.', // the big moment gets the card (TODO 41A.5)
    chips: [{ t:`${a.name} lies open to be held` }, { t:`his realm · ${k.coasts.length} coasts` }], rows: [] });
  log(s, `${k.name} kneels. His realm is yours.`);
}
// the hall's benches: only so many named men can sit at the King's table without a holding of their own; a full hall draws no more (TODO 25)
const benchSat = s => s.notables.filter(m => !m.isKing && !s.holdings.some(h => h.id === m.place)).length;
const benchCap = s => T.benches + (s.hall || 0) * T.hall.bench;
const quietWait = s => Math.max(2, T.quietYears - (s.hall || 0) * T.hall.quiet); // quiet years at a holding before a new man comes to the hall
function benchRoom(s) { return benchSat(s) < benchCap(s); }
function fCap(s, m) { return (m.follow + (has(s,'ringgiver') ? 1 : 0)) * T.menPerF; }
// a named man fights with his own arm too: he counts as one man at his Combat, whether or not he leads any (session 13)
function strengthShip(s) { return s.notables.filter(m => m.place === 'ship').reduce((a, m) => a + m.combat * (m.men + 1), 0); }
// ---- The battle (audit 4): up to three exchanges, the landing, the shield wall and the press, each a genuine roll of the ship's strength on the day ----
// Each exchange the ship fights at ROLL[0]..ROLL[1] of its strength; the mean of the exchanges fought must beat the defenders. A battle stops as soon as
// one side breaks (the coast when the ship stands at twice its number, the ship at half); a side can only break when the rolls still to come could not save it. Three rolls on 0.75..1.25 average to about the spread of the
// old single roll on 0.85..1.15 (6.5% of the levi persona's fights against 5.9%).
const ROLL = [0.82, 1.18], PHASES = ['landing', 'wall', 'press'];
// the chance the mean of three rolls beats D / S: Irwin-Hall, n = 3
function winOdds(S, D) {
  if (S <= 0) return 0;
  const x = (D / S - ROLL[0]) / (ROLL[1] - ROLL[0]) * 3;
  const F = x <= 0 ? 0 : x >= 3 ? 1 : x <= 1 ? x * x * x / 6 : x <= 2 ? (-2 * x * x * x + 9 * x * x - 9 * x + 3) / 6 : 1 - Math.pow(3 - x, 3) / 6;
  return clamp(1 - F, 0, 1);
}
// fight it out with the rolls given: how many exchanges, won or not, the margin, and what share of the men aboard die (losses are shared out by how hard each exchange went)
function battle(S, D, rolls, iron) {
  const [lo, hi] = ROLL; let sum = 0, n = 0;
  for (n = 1; n <= 3; n++) { sum += rolls[n - 1]; const m = S * sum / n; if (n === 3 || m > 2 * D || m < 0.5 * D) break; } // a side breaks: the coast at twice its number, the ship at half
  const mean = sum / n, win = S * (sum + (3 - n) * lo) / 3 > D, margin = (S * mean - D) / Math.max(1, D);
  let lossFrac = win ? clamp(0.35 * D / (S * mean), 0.02, 0.4) : clamp(0.5 * D / (S * mean), 0.2, 0.6);
  if (iron) lossFrac /= 2;
  const w = rolls.slice(0, n).map(r => D / (S * r)), wt = w.reduce((a, b) => a + b, 0);
  return { n, rolls: rolls.slice(0, n), mean, win, margin, lossFrac, share: w.map(x => x / wt) };
}
// a holding's summer is one roll, as it always was: the jarl's Rule x men x 0.85..1.15 must beat the unrest
function holdOdds(R, U) { return R <= 0 ? 0 : clamp((R * 1.15 - U) / (R * 0.3), 0, 1); }
// one odds vocabulary (TODO 41A.4): the percent, then the word. pct is shared with ui.js
const pct = p => `${p < 0.1 ? Math.round(1000 * p) / 10 : Math.round(100 * p)}%`;
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const nMen = n => `${n} ${n === 1 ? 'man' : 'men'}`;
function holdWords(R, U) { const p = holdOdds(R, U); return `${pct(p)} · ${p >= .97 ? 'holds' : p >= .7 ? 'likely holds' : p >= .4 ? 'even' : p > 0 ? 'long odds' : 'cannot hold'}`; }
// a jarl and a holding's unrest, said as one sentence before the sums (TODO 41A.4): the chance as he stands, with all he could lead, the men that would make it sure,
// and the sentence itself for the stay sheet ('stay', by spring) or the Hall pane ('hall', by summer)
function holdNeed(r, men, cap, un) {
  const pNow = holdOdds(r * men, un), pFull = holdOdds(r * cap, un), need = r > 0 ? Math.floor(un / (0.85 * r)) + 1 : Infinity;
  const sentence = (name, ctx) => {
    if (pNow >= .97) return ctx === 'hall' ? `${name} holds it (${pct(pNow)}).` : `${name} holds it with the men he has.`;
    if (need <= cap) { const more = `${need - men} more ${need - men === 1 ? 'man' : 'men'}`; return ctx === 'hall' ? `${name} needs ${more} by summer (${pct(pNow)} as he stands).` : `${name} needs ${more} by spring to hold it.`; }
    if (pFull >= .4) return men >= cap ? `With all ${cap} men he can lead, ${pct(pFull)} at best.` : `Even with all ${cap} men he leads, ${pct(pFull)} at best.`;
    return ctx === 'hall' ? `${name} cannot hold it: Rule ${r} × ${men} against unrest ${un}.` : `${name} cannot hold it.`;
  };
  return { pNow, pFull, need, sentence };
}
// a named man's chance to fall aboard: the losses decide it (a lost fight lossFrac x fallLoss, a bloody win (lossFrac - 0.2) x fallWin)
const fallChance = b => b.win ? Math.max(0, b.lossFrac - 0.2) * T.fallWin : b.lossFrac * T.fallLoss;
// before the ship sails: the chance of a win and of each named man aboard falling, over every day the rolls could bring (a fixed grid, so the number is steady)
const riskCache = new Map();
function fightRisk(S, D, iron) {
  const key = S + ':' + D + ':' + (iron ? 1 : 0); if (riskCache.has(key)) return riskCache.get(key);
  const g = 10, [lo, hi] = ROLL, at = i => lo + (hi - lo) * (i + 0.5) / g; let fall = 0, win = 0, loot = 0, loss = 0;
  for (let a = 0; a < g; a++) for (let b = 0; b < g; b++) for (let c = 0; c < g; c++) { const f = battle(S, D, [at(a), at(b), at(c)], iron); fall += fallChance(f); win += f.win ? 1 : 0;
    loot += f.win ? clamp(0.5 + f.margin / 2, 0.3, 1) : 0; loss += f.lossFrac; } // the same share of the coast's loot and of the men aboard that chooseTarget takes
  const out = { win: win / g ** 3, fall: fall / g ** 3, loot: loot / g ** 3, loss: loss / g ** 3 }; if (riskCache.size > 500) riskCache.clear(); riskCache.set(key, out); return out;
}
const shipRisk = (s, D) => fightRisk(strengthShip(s), D, has(s, 'ironside'));
// what a raid on a seen coast should bring with the ship as it stands, averaged over every day the rolls could bring: the loot, the men lost and what they
// cost at the market, the profit, and what it does to the coast's king (Levi, session 14: the return, not the defenders, is the question)
function raidValue(s, id) {
  const sh = s.shores[id], aboard = s.notables.filter(m => m.place === 'ship').reduce((a, m) => a + m.men, 0), r = shipRisk(s, sh.def);
  const loot = Math.round(r.loot * sh.loot * (has(s,'seawolf') ? 1.25 : 1)), men = Math.round(r.loss * aboard), k = ownerOf(s, id);
  return { win: r.win, fall: r.fall, loot, men, cost: men * T.manPrice, profit: loot - men * T.manPrice,
    king: k && k.known ? { name: k.name, st0: stanceWord(k.stance), st1: stanceWord((k.stance || 0) - T.raidSour) } : null };
}
// the odds in words: how likely, and how dear. A sure fight can still be a bloody one.
function oddsWords(S, D) {
  const p = winOdds(S, D), q = S > 0 ? D / S : 9;
  const chance = p >= .97 ? 'sure' : p >= .7 ? 'likely' : p >= .4 ? 'even' : p > 0 ? 'long odds' : 'hopeless';
  const cost = q < .4 ? 'clean' : q < .65 ? 'fair' : 'bloody';
  return p > 0 ? `${pct(p)} · ${chance} · ${cost}` : `${pct(p)} · ${chance}`;
}
// the same, and what it costs in men when that is knowable (TODO 41A.4): the expected share lost x the men aboard. short drops the cost word (the plank is small)
function oddsLine(s, D, short, Sv = strengthShip(s), men = s.notables.filter(m => m.place === 'ship').reduce((a, m) => a + m.men, 0)) {
  const base = short ? oddsWords(Sv, D).replace(/ · (clean|fair|bloody)$/, '') : oddsWords(Sv, D);
  if (!men || winOdds(Sv, D) <= 0) return base;
  const n = Math.round(fightRisk(Sv, D, has(s, 'ironside')).loss * men);
  return short ? `${base} · ≈${nMen(n)}` : `${base}, ≈${nMen(n)} lost`;
}
// the hall's guard (TODO 41A.1): rule x men of the named men at home, the King too when he is home, doubled by Hall-ward. guardPlan reads the plan as it stands this spring;
// guardNow reads what sailed with once the ship is out (s.guard, s.guardWho). A strange fleet is 20..80 and the day rolls 0.85..1.15 (winterCard), so the odds are a fixed grid
const guardPlan = s => { const home = s.notables.filter(m => m.place === 'home' && m.men > 0);
  return { g: home.reduce((a, m) => a + m.rule * m.men, 0) * (has(s, 'hallward') ? 2 : 1), who: home.map(m => `${m.name} (${nMen(m.men)} × Rule ${m.rule})`) }; };
const guardNow = s => s.phase === 'spring' || s.guard == null ? guardPlan(s) : { g: s.guard * (has(s, 'hallward') ? 2 : 1), who: s.guardWho || [] };
function guardOdds(g) { let held = 0, n = 0;
  for (let D = 20; D <= 80; D++) for (let i = 0; i < 20; i++) { n++; if (g * (0.85 + 0.3 * (i + 0.5) / 20) > D) held++; }
  return held / n; }
const guardWord = g => { if (g === 0) return 'empty'; const p = guardOdds(g); return p >= 0.9 ? 'held' : p >= 0.5 ? 'thin' : 'open'; };
function placedMen(s) { return s.notables.reduce((a, m) => a + m.men, 0); }
function unledMen(s) { return s.men - placedMen(s); }
// the bill beside the profit (TODO 41A.6). At autumn every ship man comes home, so what eats in the hall is every man not under a jarl on a holding
const hallMen = (s, extraMen = 0) => Math.max(0, s.men + extraMen - s.notables.filter(m => s.holdings.some(h => h.id === m.place)).reduce((a, m) => a + m.men, 0));
// next winter's upkeep as things stand; hard says whether it doubles (the Hard winter card's chip shows both)
const billNext = (s, extraMen = 0, hard = !!s.flags.hardWinter) => Math.round(hallMen(s, extraMen) * T.upkeep * (hard ? 2 : 1) * (has(s, 'deepchest') ? 0.5 : 1));
// what the land should pay this autumn: the hall if the King is home, each holding with its jarl there (odds ignored), doubled by a good harvest; a holding taken this year pays nothing
const rentNext = s => ((s.king.place === 'home' ? hallPay(s) : 0) + s.holdings.filter(h => h.taken !== s.year && s.notables.some(m => m.place === h.id)).reduce((a, h) => a + h.pay, 0)) * (s.flags.harvest ? 2 : 1);
const chestAfter = (s, gain, extraMen = 0) => s.silver + gain + rentNext(s) - billNext(s, extraMen);
// "chest after winter ~18", and " · men will leave" when it goes under nothing (the chest cannot feed them and they walk)
const chestTxt = (n, tail = '') => n < 0 ? `chest after winter ~<b class="lose">−${-n}</b>${tail} · men will leave` : `chest after winter ~${n}${tail}`;
const billLine = (s, gain, extraMen = 0, tail = '') => `next autumn's bill ~${billNext(s, extraMen)} · ${chestTxt(chestAfter(s, gain, extraMen), tail)}`;
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
// a coast first seen is stamped with the year, so the next spring's map can show it arriving (the arrival beat)
function see(s, x) { if (!x.seen) x.seenY = s.year; x.known = x.seen = true; }
function revealAround(s, id) { see(s, s.shores[id]); for (const n of s.shores[id].neighbors) see(s, s.shores[n]); }
function isHolding(s, id) { return s.holdings.some(h => h.id === id); }
function holdPay(sh) { return Math.max(10, Math.round(sh.baseLoot / 4)); }
function stayUnrest(s, sh) { return clamp(Math.round(sh.baseDef / 1.5) - (has(s,'landtaker') ? 20 : 0), 10, 100); }
// ---- Buildings (41B.2, reflex run 2): a holding takes each once, in spring, from its sheet. They belong to the coast (sh.built), so a king who
// takes it back takes them too, and a coast won back again has them still. Prices and gains live in T; the words are made from the numbers.
const BUILDINGS = {
  market:    { name: 'Market',    what: sh => `rent +${marketGain(sh)} a year, while it is ours` },
  longhouse: { name: 'Longhouse', what: () => `up to ${nMen(T.longhouseMen)} to the jarl there each spring, as far as he can lead them` },
  palisade:  { name: 'Palisade',  what: () => `unrest −${T.palisadeCalm} now, and every rise after is halved` },
};
const built = (sh, k) => !!sh.built && sh.built.includes(k);
function marketGain(sh) { return Math.round(holdPay(sh) * T.marketPay); }
function holdRent(sh) { return holdPay(sh) + (built(sh, 'market') ? marketGain(sh) : 0); }
function canBuild(s, id, k) { return s.phase === 'spring' && isHolding(s, id) && !built(s.shores[id], k) && s.silver >= T.build[k]; }
function build(s, id, k) {
  if (!canBuild(s, id, k)) return;
  const sh = s.shores[id], h = s.holdings.find(x => x.id === id);
  s.silver -= T.build[k]; (sh.built = sh.built || []).push(k); s.deeds.built++;
  if (k === 'market') h.pay = holdRent(sh);
  if (k === 'palisade') h.unrest = clamp(h.unrest - T.palisadeCalm, 0, 100);
  log(s, rng(s.day + id + k).pick(LINES.built[k])(sh.name));
}
// ---- The hall (41B.2, reflex run 3): the King's hall at Vestfold is raised in spring, tier by tier, for silver. Not a holding, so it lives on the state (s.hall, 0..3)
const HALL_TIERS = ['The hall', 'A longer hall', 'A gabled hall', 'A king\'s hall'];
const hallName = s => HALL_TIERS[s.hall || 0];
const hallGives = () => `a bench · a new man a year sooner · the Oath ${Math.round(T.hall.oath * 100)}% cheaper`;
function canRaise(s) { return s.phase === 'spring' && (s.hall || 0) < T.hall.price.length && s.silver >= T.hall.price[s.hall || 0]; }
function raiseHall(s) {
  if (!canRaise(s)) return;
  s.silver -= T.hall.price[s.hall || 0]; s.hall = (s.hall || 0) + 1; s.deeds.raised = (s.deeds.raised || 0) + 1; s.hallYears = (s.hallYears || []).concat(s.year);
  log(s, rng(s.day + 'hall' + s.hall).pick(LINES.raised[s.hall - 1]));
}
function unrestRise(s, h, up) { return clamp(h.unrest + (built(s.shores[h.id], 'palisade') ? Math.round(up / 2) : up), 0, 100); }

// ---- New game ------------------------------------------------------------------
function newGame(kingKey, custom) {
  const day = new Date().toISOString().slice(0, 10);
  const stats = { ragnar: ['Ragnar', 4, 2, 3], rollo: ['Rollo', 2, 4, 3], custom: ['Custom', ...(custom || [3, 3, 3])] }[kingKey];
  const king = makeMan(custom && custom.name ? custom.name : stats[0], stats[1], stats[2], stats[3], { age: 20, isKing: true, titles: [], offeredPairs: [], born: T.startYear - 20 });
  const s = { seed: day, day, year: T.startYear, phase: 'spring', silver: 60, men: T.startMen, king, notables: [king], children: [],
    holdings: [], hall: 0, hallYears: [], shores: buildWorld(day), rulers: buildRulers(day), destination: null, rumorOffer: null, queue: [], log: [], envoy: null, guard: null,
    deeds: { raids:0, blind:0, heldYears:0, jarlYears:0, bigWins:0, homeYears:0, rumors:0, menBought:0, stays:0, upkeep:0, marriages:0, years:0, built:0, raised:0 },
    reign: { bestRaid: null, bestHoldings: 0, title: null, start: T.startYear },
    dynasty: [], flags: {}, gen: 1 };
  king.men = Math.min(T.startMen, fCap(s, king));
  const first = makeMan(rng(day + ':first')(0) < 0.5 ? 'Bjorn' : 'Ivar', 3, 2, 2, { age: 30, stance: 20, why: [{ y: T.startYear, t: 'sailed with your father', d: 20 }] });
  s.notables.push(first); first.men = 10;
  revealAround(s, HOME_ID); discoverRulers(s); // the sea king next door is known from the first spring
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
  m.place = where; m.sailed = false;
  if (m.isKing) s.kingHome = where === 'home'; // the King sent home by hand is the toggle set: Everyone aboard leaves him there
  else if (where !== 'ship') s.allAboard = false; // a man sent home or to a holding by hand: the crew is no longer set to board each spring (TODO 41A.3)
}
// − and + step to the next multiple of five, so 23 goes to 25 or 20, never to 28 (Levi, 2026-10-26)
function stepMen(s, id, dir) { const m = s.notables.find(x => x.id === id); if (!m) return; addMen(s, id, (dir > 0 ? Math.floor(m.men / 5) * 5 + 5 : Math.ceil(m.men / 5) * 5 - 5) - m.men); }
function addMen(s, id, d) {
  const m = s.notables.find(x => x.id === id);
  // a man can stand over his cap (the Ring-giver who raised every cap died with the King): he keeps those men, − still takes them off him, + gives him none (reflex run 1)
  m.men = clamp(m.men + d, 0, Math.max(m.men, Math.min(fCap(s, m), m.men + unledMen(s))));
}
// fill every named man aboard from the unled pool, the King first, then by Combat (TODO 41A.3)
function fillShip(s) {
  const ship = s.notables.filter(m => m.place === 'ship').sort((a, b) => (b.isKing ? 1 : 0) - (a.isKing ? 1 : 0) || b.combat - a.combat);
  for (const m of ship) m.men = Math.max(m.men, Math.min(fCap(s, m), m.men + unledMen(s))); // a man over his cap keeps what he has (Q16)
}
function boardAll(s) {
  if (s.phase !== 'spring') return;
  for (const m of s.notables) if (m.place === 'home' && !(m.isKing && s.kingHome)) m.place = 'ship';
  s.allAboard = true; // it stays set year to year until someone is sent home by hand (TODO 41A.3)
  fillShip(s);
  // a man with no one to lead still boards: he fights with his own arm, shares the loot and grows, and at home he would only sour (session 13, reversing TODO 32)
}
// the King stays home: Everyone aboard and each spring's re-boarding leave him in the hall, to rule it and guard it (Levi, 2026-10-26)
function kingStays(s, on) {
  s.kingHome = on; if (s.phase !== 'spring') return;
  if (on) { s.king.place = 'home'; s.king.sailed = false; }
  else if (s.allAboard) { s.king.place = 'ship'; fillShip(s); }
}
// the man in a holding's seat as it would stand with this jarl: his men now and at his full following against its unrest
function holdPreview(s, m, h) { const cap = fCap(s, m); return { now: holdOdds(m.rule * m.men, h.unrest), full: holdOdds(m.rule * cap, h.unrest), need: holdNeed(m.rule, m.men, cap, h.unrest) }; }
function setDestination(s, id) { if (s.phase === 'spring') s.destination = id; } // the ship may be empty yet; Sail is what needs men
function marry(s, childId, jarlId) {
  const d = s.children.find(c => c.id === childId), j = s.notables.find(m => m.id === jarlId);
  if (!d || !j || d.sex !== 'f' || d.age < 16 || j.isKing || j.kin) return;
  j.kin = true; j.wed = d.name; d.married = j.name; s.deeds.marriages++;
  moveStance(s, j, 30, `married ${d.name}`);
  log(s, `${d.name} married to ${j.name}. He is kin now.`);
}
// a gift of silver warms a man once a year; a king costs three times a jarl
function giftPrice(m) { return m.anchor ? T.gift * 3 : T.gift; }
function gift(s, id) {
  const m = s.notables.find(x => x.id === id) || (s.rulers && s.rulers[id]);
  if (!m || m.isKing || s.phase !== 'spring') return;
  const cost = giftPrice(m); if (s.silver < cost || m.gifted === s.year) return;
  s.silver -= cost; if (s.yr) { s.yr.gifts += cost; s.yr.giftN++; } m.gifted = s.year; moveStance(s, m, T.giftWarm, 'a gift of silver');
  log(s, `${m.name} takes ${cost} silver from the King's hand.`);
}
function rumorPrice(s) { return has(s,'silvertongue') ? 0 : (s.flags.wanderer ? T.rumor / 2 : T.rumor); }
// what the Wanderer could name: a rich coast within reach not yet on the map, never one a king's realm or an earlier rumor already named (session 13)
const rumorCands = s => Object.values(s.shores).filter(x => !x.known && x.baseLoot >= 100 && reachable(s, x.id) && !isHolding(s, x.id));
function buyRumor(s) {
  const price = rumorPrice(s); if (s.silver < price) return;
  const r = rng(s.day + ':rumor:' + s.year);
  const cands = rumorCands(s);
  if (!cands.length) { s.rumorOffer = 'none'; return; }
  const pick = r.pick(cands); pick.known = true; pick.rumored = true;
  s.silver -= price; if (s.yr) s.yr.rumor += price; s.deeds.rumors++; s.rumorOffer = pick.id;
  log(s, `The Wanderer speaks of ${pick.name}. Rich, he says.`);
  for (const k of discoverRulers(s)) log(s, `He names its king too: ${k.name}, ${k.title}.`);
}
function takeTitle(s, key) { s.king.titles.push(key); s.reign.title = TITLES[key].name; log(s, `${s.king.name} is called ${TITLES[key].name}.`); next(s); }

// ---- Summer -----------------------------------------------------------------------
function sail(s) {
  if (s.phase !== 'spring') return;
  if (s.notables.some(m => m.place === 'ship') && !s.destination) return;
  s.phase = 'summer'; s.lastDest = null; // set by the fight itself, so "again" means a coast actually reached (TODO 41A.8)
  const ship = s.notables.filter(m => m.place === 'ship');
  // who guards the hall while the ship is out; a rival sail this winter meets these men
  s.guard = s.notables.filter(m => m.place === 'home').reduce((a, m) => a + m.rule * m.men, 0); s.guardWho = guardPlan(s).who;
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
    const knownCoast = s.destination !== 'blind' && s.shores[s.destination].seen; // a coast already seen: no Landfall, straight to the fight (TODO 20)
    for (const id of targets) { const x = s.shores[id]; see(s, x); x.rumored = false; }
    for (const m of ship) m.sailed = true; // they board again next spring
    s.queue.push({ t:'arrive', targets });
    rulerCards(s, discoverRulers(s));
    if (knownCoast) chooseTarget(s, s.destination);
  } else {
    s.queue.push({ t:'noSail' });
  }
  save(s);
}
function chooseTarget(s, id) {
  const sh = s.shores[id], r = rng(s.day + ':fight:' + s.year + id); s.lastDest = id;
  const ship = s.notables.filter(m => m.place === 'ship');
  const S = strengthShip(s), D = sh.def, [lo, hi] = ROLL;
  const rolls = [lo + r() * (hi - lo), lo + r() * (hi - lo), lo + r() * (hi - lo)];
  const b = battle(S, D, rolls, has(s,'ironside')), win = b.win, margin = b.margin;
  const menAboard = ship.reduce((a, m) => a + m.men, 0);
  const losses = Math.round(menAboard * b.lossFrac);
  // the crew before the fight, so the sheet can show what each man lost and gained (audit 4)
  const own0 = ownerOf(s, id), before = ship.map(m => ({ m, men: m.men, c: m.combat, f: m.follow, stance: m.stance || 0 }));
  const def0 = sh.def, loot0 = sh.loot;
  let loot = 0;
  if (win) {
    loot = Math.round(sh.loot * clamp(0.5 + margin / 2, 0.3, 1) * (has(s,'seawolf') ? 1.25 : 1));
    sh.loot = Math.round(sh.loot * (sh.holy ? T.holySack : 0.6)); sh.def = sh.holy ? Math.min(sh.baseDef * T.holyWall, Math.round(sh.def * 1.1)) : Math.min(T.defCap, Math.round(sh.def * T.defWin)); // a coast arms against the raider who keeps coming (TODO 25); a monastery's wall never becomes a fortress (41B.7)
    for (const m of ship) { m.raids++; grow(m, 'combat', T.grow); if (margin > 1) grow(m, 'follow', T.growF); moveStance(s, m, margin > 1 ? 10 : 5, `shared the loot of ${sh.name}`); }
    if (margin > 1) s.deeds.bigWins++;
  } else { sh.def = Math.min(T.defCap, Math.round(sh.def * 1.1)); const led = [...ship].sort((a, b) => b.men - a.men)[0]; fall(led, 'combat'); for (const m of ship) moveStance(s, m, -5, `bled at ${sh.name} for nothing`); /* the man who led the most men in is the one a lost fight is laid on: a step of Combat (TODO 47; the first cut took it from every leader aboard and old jarls sank to one) */ log(s, `Driven back at ${sh.name}. ${nMen(losses)} lost.`); if (s.yr) s.yr.beaten = sh.name; }
  // distribute losses across the ship's men
  let left = losses; for (const m of ship) { const l = Math.min(m.men, Math.round(losses * m.men / Math.max(1, menAboard))); m.men -= l; left -= l; }
  if (left > 0) { const m = ship[0]; const l = Math.min(m.men, left); m.men -= l; }
  s.men -= losses; s.deeds.raids++;
  const owner = ownerOf(s, id); if (owner) moveStance(s, owner, -T.raidSour, `you raided ${sh.name}`);
  // named men are not safe aboard: each may fall, the likelier the bloodier the day (TODO 25); he falls in the exchange that cost the most, by lot
  const fr = rng(s.day + ':fall:' + s.year + id), fallP = fallChance(b);
  const fallen = fallP > 0 ? ship.filter(() => fr() < fallP) : [];
  const phaseOf = () => { let x = fr(), i = 0; while (i < b.n - 1 && x > b.share[i]) { x -= b.share[i]; i++; } return i; };
  const fellAt = new Map(fallen.map(m => [m, phaseOf()]));
  // the exchanges as the sheet plays them: the day's roll, the men lost, the share of the defenders broken, who fell
  const dTot = win ? (margin > 1 ? 1 : margin > 0.3 ? 0.7 : 0.45) : clamp(S * b.mean / D, 0, 1) * 0.35, rs = b.rolls.reduce((a, x) => a + x, 0);
  let mLeft = losses;
  const phases = b.rolls.map((roll, i) => { const men = i === b.n - 1 ? mLeft : Math.round(losses * b.share[i]); mLeft -= men;
    return { k: PHASES[i], roll: +roll.toFixed(3), men, dl: +(dTot * roll / rs).toFixed(3), fell: fallen.filter(m => fellAt.get(m) === i).map(m => m.name) }; });
  const crew = before.map(x => { const m = x.m, fell = fallen.includes(m);
    return { name: m.name, isKing: !!m.isKing, kin: !!m.kin, sworn: !!m.sworn && !m.wed, son: !!m.son, men0: x.men, men1: m.men, c0: x.c, c1: m.combat, f0: x.f, f1: m.follow, st0: stanceWord(x.stance), st1: stanceWord(m.stance), d: (m.stance || 0) - x.stance, raids: m.raids, fell, at: fell ? fellAt.get(m) : null, unled: fell && !m.isKing ? m.men : 0 }; });
  const res = { t:'fight', shore: id, S, D, Sr: Math.round(S * b.mean), mean: +b.mean.toFixed(3), win, margin, loot, loot0, losses, odds: winOdds(S, D), fallP: +fallP.toFixed(4), risk: +fightRisk(S, D, has(s,'ironside')).fall.toFixed(4),
    phases, crew, def0, def1: sh.def, owner: own0 ? { name: own0.name, st0: stanceWord(own0.stance + T.raidSour), st1: stanceWord(own0.stance) } : null, wolf: has(s,'seawolf') };
  // a champion after a rout (41B.6): once a reign-decade, with a bench free, a fighter of the broken line asks to follow the King; Take him or Refuse on the reckoning
  if (win && margin > 1 && D >= T.championWall && benchRoom(s) && s.year - (s.reign.champion ?? -999) >= T.championEvery) {
    const cr = rng(s.day + ':champion:' + s.year + id), nm = freshName(s, LOCAL_NAMES[sh.culture], cr, sh.name);
    res.champion = { name: nm, combat: 3 + cr.int(0, 2), rule: 1 + cr.int(0, 1), follow: 2 + cr.int(0, 1), age: 18 + cr.int(0, 10), line: cr.pick(LINES.champion)(nm, sh.name), taken: null }; s.reign.champion = s.year; }
  s.queue.shift(); // the arrive card
  s.queue.unshift(res);
  const canStay = win && sh.holdable && (sh.walked || ship.some(m => !m.isKing && !fallen.includes(m)));
  if (canStay) s.queue.splice(1, 0, { t:'stay', shore: id, loot, walked: !!sh.walked });
  else if (win) { plunder(s, loot, id); }
  // the fallen are on the fight sheet itself (audit 4); the King's fall brings the death card after the summer's choice
  for (const m of fallen) if (!m.isKing) { s.notables = s.notables.filter(x => x !== m); log(s, `${m.name} fell at ${sh.name}.`); }
  const king = fallen.find(m => m.isKing);
  if (king) { log(s, `${king.name} fell at ${sh.name}.`); s.queue.splice(canStay ? 2 : 1, 0, { t:'death', cause: 'fell', at: sh.name }); }
  save(s);
}
// Landfall shows nothing worth the men: the ship turns for home and the summer is spent (TODO 31)
function turnHome(s) {
  const sc = s.queue[0]; if (!sc || sc.t !== 'arrive') return;
  log(s, 'The ship turned for home. Nothing on those coasts was worth the men.');
  next(s);
}
// the champion's two buttons are an undo pair: Take him puts him on the ship, Refuse takes him off again, until the reckoning is left (41B.6)
function takeChampion(s) { const sc = s.queue[0], c = sc && sc.t === 'fight' && sc.champion; if (!c || c.taken) return; if (!benchRoom(s)) return;
  const m = makeMan(c.name, c.combat, c.rule, c.follow, { age: c.age, place: 'ship', sailed: true }); s.notables.push(m); c.taken = true; c.id = m.id; s.deeds.champions = (s.deeds.champions || 0) + 1; log(s, `${c.name} of ${s.shores[sc.shore].name} follows the King home.`); }
function refuseChampion(s) { const sc = s.queue[0], c = sc && sc.t === 'fight' && sc.champion; if (!c) return; if (c.taken) { s.notables = s.notables.filter(m => m.id !== c.id); s.deeds.champions--; s.log = s.log.filter(l => !(l.y === s.year && /follows the King home/.test(l.t))); } c.taken = false; }
function plunder(s, loot, id) {
  s.silver += loot; if (s.yr) { s.yr.loot += loot; s.yr.from = s.shores[id].name; }
  if (!s.reign.bestRaid || loot > s.reign.bestRaid.loot) s.reign.bestRaid = { loot, shore: s.shores[id].name, year: s.year };
  log(s, `${s.shores[id].name} plundered for ${loot} silver.`);
}
// a holding gone, however it went: the Hall pane shows the row struck through until the next spring (TODO 21)
function markLost(s, h, why) { (s.lost = s.lost || []).push({ name: h.name, y: s.year, why }); }
// the summer's big moments wait in s.big for the winter night, where each turns as a card in the frame of the winter's own (TODO 41A.5); the ledger keeps its rows
const sentence = t => t.split(' · ').map(x => x[0].toUpperCase() + x.slice(1)).join('. ') + '.';
function bigMoment(s, when, glyph, e, chips) { (s.big = s.big || []).push({ tone:'blood', glyph, when, title: e.t, lead: sentence(e.s), chips }); }
function choosePlunder(s) { const sc = s.queue[0]; plunder(s, sc.loot, sc.shore); next(s); }
function chooseStay(s, jarlId) {
  const sc = s.queue[0], sh = s.shores[sc.shore];
  let j;
  if (jarlId === 'walked') { const w = sh.walked; j = makeMan(w.name, w.combat, w.rule, w.follow, { age: 40 }); s.notables.push(j); }
  else j = s.notables.find(m => m.id === jarlId);
  sh.walked = null;
  const unrest = stayUnrest(s, sh);
  s.holdings.push({ id: sh.id, name: sh.name, pay: holdRent(sh), unrest, quiet: 0, empty: 0, taken: s.year });
  j.place = sh.id; s.deeds.stays++; moveStance(s, j, 10, `given ${sh.name}`);
  revealAround(s, sh.id);
  log(s, `${j.name} stays at ${sh.name}. It is ours.`); if (s.yr) s.yr.forfeit = { jarl: j.name, shore: sh.name, loot: sc.loot };
  const owner = ownerOf(s, sh.id); if (owner) { moveStance(s, owner, -T.takeSour, `you hold ${sh.name}, which was his`); checkBreak(s, owner); }
  rulerCards(s, discoverRulers(s));
  next(s);
}

// Land contests, home, then into winter
function resolveLand(s) {
  // the autumn ledger (audit 2, option A): `rows` are the rent roll, `events` what mattered on the land, `lines` what the chronicle keeps
  const r = rng(s.day + ':land:' + s.year), lines = [], rows = [], events = [], k = s.king, dbl = s.flags.harvest ? ' · good harvest, doubled' : '';
  // the King holds the hall (GDD §15.2): home, it pays and his Rule grows and the hall warms to him
  if (k.place === 'home') {
    const pay = Math.round(hallPay(s) * (s.flags.harvest ? 2 : 1)); s.silver += pay; s.deeds.homeYears++;
    const grew = grow(k, 'rule', T.grow), grewF = grow(k, 'follow', T.grow); // men come to a King who sits his hall: a summer at home is a step toward Following too, on the slower table (TODO 47; a King who never sails had no road up once it could fall)
    for (const m of s.notables) if (m.place === 'home') moveStance(s, m, T.hallWarm, 'a summer in the hall with the King');
    lines.push(`${k.name} kept his hall. Vestfold pays ${pay}.${grew ? ` His Rule is ${k.rule} now.` : ''}${grewF ? ` His Following is ${k.follow} now.` : ''}`);
    rows.push({ n: 'Vestfold', v: pay, why: `${k.name} kept his hall${dbl}` });
    if (grew) events.push({ k:'rule', t:`${k.name}'s Rule is ${k.rule} now.`, s:'three summers in his hall' });
  } else { lines.push(`The King was at sea. Vestfold paid nothing.`); rows.push({ n: 'Vestfold', v: 0, why: 'the King was at sea' }); }
  for (const m of s.notables) if (m.place === 'home' && m.men === 0 && !m.isKing) moveStance(s, m, -T.idleSour, 'sat idle, no men to lead');
  for (const h of [...s.holdings]) {
    const j = s.notables.find(m => m.place === h.id);
    if (h.taken === s.year) { lines.push(`${h.name} is newly ours. No contest this summer.`); rows.push({ n: h.name, v: null, why: 'newly ours · pays from next year' }); continue; } // the jarl who stayed just won it
    if (j && stanceWord(j.stance) === 'hostile' && r() < T.walkChance) {
      const took = j.men; walkAway(s, j, h); lines.push(`${j.name} has had enough of the King. He walks, and ${h.name} is his now.`);
      rows.push({ n: h.name, v: 0, why: `${j.name} walked with it` }); events.push({ k:'lost', t:`${j.name} has had enough of the King.`, s:`he walks, and ${h.name} is his now` });
      bigMoment(s, 'Summer', 'land', events[events.length - 1], [...(took ? [{ t:`−${nMen(took)} go with him`, cls:'down' }] : []), { t:`−${h.pay} a year`, cls:'down' }]); continue; }
    if (!j) {
      h.empty++; h.quiet = 0; h.unrest = unrestRise(s, h, has(s,'lawgiver') ? 5 : T.emptyUnrest);
      if (h.empty >= 2) { loseHolding(s, h, null, 'stood empty and revolted'); lines.push(`${h.name} stood empty two summers. It has revolted.`); rows.push({ n: h.name, v: 0, why: 'stood empty two summers · revolted' }); events.push({ k:'lost', t:`${h.name} has revolted.`, s:'it stood empty two summers · the holding is lost' }); bigMoment(s, 'Autumn', 'land', events[events.length - 1], [{ t:`−${h.pay} a year`, cls:'down' }]); }
      else { lines.push(`${h.name} stood empty. Unrest ${h.unrest}.`); rows.push({ n: h.name, v: 0, why: `stood empty · unrest ${h.unrest}` }); events.push({ k:'empty', t:`${h.name} stands empty.`, s:`unrest ${h.unrest} · another empty summer and it revolts` }); }
      continue;
    }
    const S = j.rule * j.men * (0.85 + r() * 0.3);
    if (S > h.unrest) {
      const pay = Math.round(h.pay * (s.flags.harvest ? 2 : 1));
      s.silver += pay; h.unrest = clamp(h.unrest - (has(s,'lawgiver') ? 10 : T.heldCalm), 0, 100); h.quiet++; h.empty = 0;
      grow(j, 'rule', T.grow);
      s.deeds.heldYears++; moveStance(s, j, 3, `held ${h.name} and it paid`);
      lines.push(`${h.name} pays ${pay}. ${j.name} holds it.`); rows.push({ n: h.name, v: pay, why: `${j.name} holds it${built(s.shores[h.id], 'market') ? ' · the market' : ''}${dbl}` });
      const n = s.holdings.length; // a long reach: past a few holdings, any one may stir, and next summer asks more of its jarl (TODO 25)
      const free = reachFree(s);
      if (n > free && r() < Math.min(T.reachMax, T.reachRise * (n - free))) {
        const up = 15 + r.int(0, 25); h.unrest = unrestRise(s, h, up);
        events.push({ k:'empty', t:`${h.name} stirs.`, s:`unrest ${h.unrest} next summer · ${n} holdings, and a King of Rule ${k.rule} keeps ${free} calm` });
      }
      if (h.quiet > 0 && h.quiet % quietWait(s) === 0 && benchRoom(s)) {
        const sh = s.shores[h.id], nm = freshName(s, LOCAL_NAMES[sh.culture], rng(s.day + h.id + s.year), sh.name);
        s.notables.push(makeMan(nm, 1 + r.int(0, 1), 3 + r.int(0, 2), 2 + r.int(0, 1), { age: 22 + r.int(0, 15) }));
        const qw = ['', 'one', 'two', 'three', 'four', 'five'][quietWait(s)]; lines.push(`${upFirst(qw)} quiet years at ${h.name}. ${nm} comes to the hall.`); events.push({ k:'new', t:`${nm} comes to the hall.`, s:`${qw} quiet years at ${h.name}` });
      }
    } else {
      const lost = Math.round(j.men * 0.3); j.men -= lost; s.men -= lost; const rf = fall(j, 'rule'); moveStance(s, j, -10, `lost ${h.name} and ${nMen(lost)}`);
      loseHolding(s, h, j, `rose against ${j.name}`); lines.push(`${h.name} rose against ${j.name}. ${nMen(lost)} dead. The holding is lost.${rf ? ` His Rule falls to ${j.rule}.` : ''}`);
      rows.push({ n: h.name, v: 0, why: 'lost' }); events.push({ k:'lost', t:`${h.name} rose against ${j.name}.`, s:`${lost ? `${nMen(lost)} dead` : 'no men dead'} · the holding is lost${rf ? ` · his Rule falls to ${j.rule}` : ''}` });
      bigMoment(s, 'Autumn', 'land', events[events.length - 1], [...(lost ? [{ t:`−${nMen(lost)}`, cls:'down' }] : []), { t:`−${h.pay} a year`, cls:'down' }]);
    }
  }
  // a hostile king does not wait for the winter deck: he comes for a holding that was his (TODO 25)
  for (const k of Object.values(s.rulers)) {
    if (!k.known || k.broken || stanceWord(k.stance) !== 'hostile') continue;
    const near = s.holdings.filter(h => h.taken !== s.year && k.coasts.includes(h.id));
    if (!near.length || r() >= T.strike) continue;
    const h = r.pick(near), j = s.notables.find(m => m.place === h.id);
    const D = Math.round((T.strikeBase + T.strikePer * k.coasts.filter(c => !isHolding(s, c)).length) * (0.85 + r() * 0.3));
    const G = j ? Math.round(j.rule * j.men * (0.85 + r() * 0.3)) : 0;
    if (G > D) { moveStance(s, j, 5, `held ${h.name} against ${k.name}`); lines.push(`${k.name} came for ${h.name}. ${j.name} held it (${G} vs ${D}).`); events.push({ k:'realm', t:`${k.name} came for ${h.name}.`, s:`${j.name} held it · ${G} vs ${D}` }); continue; }
    const lost = j ? Math.round(j.men * 0.4) : 0, rf = j ? fall(j, 'rule') : false; if (j) { j.men -= lost; s.men -= lost; moveStance(s, j, -10, `lost ${h.name} to ${k.name}`); }
    loseHolding(s, h, j, `taken by ${k.name}`); if (!k.coasts.includes(h.id)) k.coasts.push(h.id);
    const st0 = stanceWord(k.stance); moveStance(s, k, T.strikeSated, `took ${h.name} from you`); const st1 = stanceWord(k.stance);
    lines.push(`${k.name} came for ${h.name} and took it (${G} vs ${D}).${lost ? ` ${nMen(lost)} dead.` : ''}`);
    const trow = { n: h.name, v: 0, why: `taken by ${k.name}` }, ti = rows.findIndex(x => x.n === h.name); if (ti >= 0) rows[ti] = trow; else rows.push(trow); // one Rent line for a coast a king took back (TODO 41A.8)
    events.push({ k:'lost', t:`${k.name} took ${h.name}.`, s:`${j ? `${j.name} could not hold it · ${G} vs ${D}` : 'no one held it'}${lost ? ` · ${nMen(lost)} dead` : ''}${rf ? ` · his Rule falls to ${j.rule}` : ''} · it is his now` });
    bigMoment(s, 'Summer', 'sail', events[events.length - 1], [...(lost ? [{ t:`−${nMen(lost)}`, cls:'down' }] : []), { t:`−${h.pay} a year`, cls:'down' }, ...(st1 !== st0 ? [{ t:`${k.name} warms: ${st0} → ${st1}` }] : [])]);
  }
  // a held realm bends before it breaks: its king kneels only when every coast has stayed held (TODO 25)
  for (const k of Object.values(s.rulers)) if (k.known && !k.broken) {
    checkBreak(s, k);
    if (!k.broken && k.yoke != null) { const left = T.breakYears - (s.year - k.yoke); events.push({ k:'realm', t:`${k.name} bends.`, s:`his realm is held · ${left} more summer${left > 1 ? 's' : ''} and he kneels` }); }
  }
  s.deeds.jarlYears += s.notables.filter(m => !m.isKing && m.place !== 'home').length;
  // shores recover slowly
  for (const sh of Object.values(s.shores)) { if (sh.loot < sh.baseLoot) sh.loot = Math.min(sh.baseLoot, Math.round(sh.loot * (sh.holy ? T.holyMend : 1.1)) + 1); /* a monastery's treasure comes back slowly: the monks fled (41B.7) */ if (sh.def > sh.baseDef) sh.def = Math.max(sh.baseDef, Math.round(sh.def * T.defMend)); }
  growRealms(s, lines, events);
  s.reign.bestHoldings = Math.max(s.reign.bestHoldings, s.holdings.length);
  // everyone home for winter; those who sailed board again in spring, and the destination stands (TODO 20)
  for (const m of s.notables) if (m.place === 'ship') m.place = 'home';
  for (const l of lines) if (!/ pays \d+\. | paid nothing\.$|No contest this summer/.test(l) || / Rule is /.test(l)) log(s, l); // the rent roll stays on the Winter sheet
  s.phase = 'winter';
  const u = upkeep(s, events), y = s.yr || {};
  s.queue.push({ t:'winter', land: lines, hall: u.lines, rows, events, eat: u.eat, spring: y.spring ?? null, loot: { n: y.loot || 0, from: y.from, forfeit: y.forfeit, beaten: y.beaten } });
}
function loseHolding(s, h, j, why) {
  s.holdings = s.holdings.filter(x => x !== h);
  markLost(s, h, why || 'revolted');
  if (j) { j.place = 'home'; j.sailed = false; }
  const sh = s.shores[h.id]; sh.loot = Math.round(sh.baseLoot * 0.8); sh.def = Math.round(sh.baseDef * 1.1);
}
// a jarl leaves with his holding and his men; the shore is his, with his stats as its defenders
function walkAway(s, j, h) {
  const sh = s.shores[h.id];
  s.holdings = s.holdings.filter(x => x !== h);
  markLost(s, h, `${j.name} walked with it`);
  fall(s.king, 'follow'); // men walked from the King's service (TODO 47)
  sh.walked ={ name: j.name, combat: j.combat, rule: j.rule, follow: j.follow }; sh.def = clamp(j.rule * j.men + 20, 20, 200); sh.loot = Math.round(h.pay * 3);
  s.notables = s.notables.filter(m => m !== j); s.men -= j.men;
  log(s, `${j.name} walks. ${h.name} is his now.`);
}

// ---- Winter ---------------------------------------------------------------------------
function buyMen(s, n) {
  const price = has(s,'fairdealer') ? 2 : T.manPrice;
  n = Math.min(n, Math.floor(s.silver / price)); if (n <= 0) return;
  s.silver -= n * price; s.men += n; s.deeds.menBought += n; if (s.yr) s.yr.bought += n;
  // the bought men follow the named men at once, in the order the market names: the King, then the men at home, then the rest, each up to what he leads (TODO 41A.3)
  let left = n;
  for (const m of [...s.notables].sort((a, b) => (b.isKing ? 1 : 0) - (a.isKing ? 1 : 0) || (a.place === 'home' ? 0 : 1) - (b.place === 'home' ? 0 : 1))) {
    if (left <= 0) break; const take = Math.min(left, Math.max(0, fCap(s, m) - m.men)); m.men += take; left -= take; }
}
// what the chest can buy this winter, in lots of five (the market's stepper); the market sheet opens only when it is five or more and the King is not about to die on his card
const marketMax = s => Math.floor(s.silver / (has(s,'fairdealer') ? 2 : T.manPrice) / 5) * 5;
const kingFalls = s => !!s.kingSlain || (s.rolled === s.year && !!s.oldDeath);
const canMarket = s => marketMax(s) >= 5 && !kingFalls(s);
function upkeep(s, events = []) {
  const home = s.notables.filter(m => m.place === 'home').reduce((a, m) => a + m.men, 0) + unledMen(s);
  const hard = !!s.flags.hardWinter, deep = has(s,'deepchest'), base = Math.round(home * T.upkeep);
  const due = Math.round(home * T.upkeep * (hard ? 2 : 1) * (deep ? 0.5 : 1));
  let cost = due; s.deeds.upkeep += cost;
  const lines = []; let starve = 0;
  if (cost > s.silver) {
    starve = Math.min(home, cost - s.silver); cost = s.silver; s.men -= starve; trimMen(s); // every man the chest cannot feed walks
    // a hungry hall is remembered (TODO 25): every jarl sours, and the sourest at home will not starve twice
    for (const m of s.notables) if (!m.isKing) moveStance(s, m, m.place === 'home' ? -T.starveSour : -Math.round(T.starveSour / 2), 'the hall went hungry');
    const gone = s.notables.filter(m => !m.isKing && !m.kin && m.place === 'home' && m.stance <= -20).sort((a, b) => a.stance - b.stance)[0];
    lines.push(`The hall could not feed everyone. ${nMen(starve)} walked.`); events.unshift({ k:'starve', t:'The hall could not feed everyone.', s:`${nMen(starve)} walked · every jarl remembers it` });
    // a named man who walks out takes a step of the King's Following with him (TODO 47); the first cut fell on every hungry winter and the harness said the King's cap collapsed
    if (gone) { s.notables = s.notables.filter(m => m !== gone); s.men -= gone.men; const ff = fall(s.king, 'follow'); lines.push(`${gone.name} will not starve in this hall. He goes, and his ${nMen(gone.men)} with him.${ff ? ` ${s.king.name}'s Following falls to ${s.king.follow}.` : ''}`); events.splice(1, 0, { k:'starve', t:`${gone.name} will not starve in this hall.`, s:`he goes, and his ${nMen(gone.men)} with him${ff ? ` · the King's Following falls to ${s.king.follow}` : ''}` }); }
  }
  s.silver -= cost; lines.push(`${nMen(home)} at home ate ${cost} silver.`);
  if (hard) events.push({ k:'hard', t:'Hard winter.', s:'the ice came early · the hall ate double' });
  if (lines.length > 1) log(s, lines[0]);
  s.flags = {};
  const why = starve ? `only ${cost} in the chest` : hard && deep ? 'hard winter, Deep-chest' : hard ? 'hard winter · doubled' : deep ? 'Deep-chest · halved' : '';
  return { lines, eat: { men: home, base, due, paid: cost, why, starve } };
}
function closeWinter(s) { winterCard(s); s.queue.push({ t:'market' }); next(s); } // autumn ledger, then the card turns, then the market (TODO 41B.4): the hard winter is known before the men are bought
function trimMen(s) { let over = placedMen(s) - s.men; for (const m of s.notables) { if (over <= 0) break; const d = Math.min(m.men, over); m.men -= d; over -= d; } }

function winterCard(s) {
  const r = rng(s.day + ':winter:' + s.year), k = s.king;
  if (s.envoy && s.rulers[s.envoy] && !s.rulers[s.envoy].known) { // a realm grew to touch what you know: that is how you meet its king
    const ru = s.rulers[s.envoy]; s.envoy = null; ru.known = true; for (const c of ru.coasts) s.shores[c].known = true;
    s.queue.push({ t:'ruler', ruler: ru.id, envoy: true }); return;
  }
  s.envoy = null;
  // the old die in their beds: past sixty a named man's winters are counted, as the King's are past fifty (TODO 25). Told on this winter's card
  const dr = rng(s.day + ':age:' + s.year), aged = s.notables.filter(m => !m.isKing && m.age > 60 && dr() < T.oldAge * (m.age - 60));
  if (aged.length) s.notables = s.notables.filter(m => !aged.includes(m));
  // a king's fleet takes a year to gather: only a king hostile last winter too sails on the hall (TODO 25), so the hostile word on his card is the warning
  for (const x of Object.values(s.rulers)) { const h = x.known && !x.broken && stanceWord(x.stance) === 'hostile'; if (!h) x.wroth = null; else if (x.wroth == null) x.wroth = s.year; }
  const foes = Object.values(s.rulers).filter(x => x.wroth != null && x.wroth < s.year);
  const deck = [];
  const kids = s.children.length;
  if (k.age < 55 && !s.regency) deck.push(['birth', kids < 2 ? 7 : 4]);
  if (s.notables.some(m => !m.isKing && m.age > 45)) deck.push(['jarlDeath', 2]);
  deck.push(['wanderer', 2]); deck.push(['rival', 1 + 2 * foes.length + Math.min(6, 2 * Math.floor(s.silver / T.richHall))]); deck.push(['hardWinter', 1]); deck.push(['harvest', s.holdings.length ? 2 : 0]); // a rich chest draws sails
  if (benchRoom(s)) deck.push(['seaman', 2 + (s.hall || 0) * T.hall.seaman]);
  if (s.children.some(c => c.sex === 'f' && c.age >= 16 && !c.married) && s.notables.some(m => !m.isKing && !m.kin)) deck.push(['suitor', 3]);
  if (s.notables.filter(m => !m.isKing).length >= 2) deck.push(['feud', 1]);
  deck.push(['quiet', 1]);
  const total = deck.reduce((a, [, w]) => a + w, 0); let roll = r() * total, ev = 'quiet';
  for (const [e, w] of deck) { roll -= w; if (roll <= 0) { ev = e; break; } }
  const sc = { t:'event', ev, lines: [], big: s.big || [] }; s.big = []; // the summer's big moments turn above the winter's own card (TODO 41A.5)
  if (ev === 'birth') {
    const sex = r() < 0.5 ? 'm' : 'f', name = freshName(s, sex === 'm' ? MALE_NAMES : FEMALE_NAMES, r);
    s.children.push({ id: uid(), name, sex, age: 0, born: s.year });
    sc.title = sex === 'm' ? 'A son is born' : 'A daughter is born'; sc.lines.push(rng(s.day + ':line:birth' + s.year).pick(LINES.birth[sex === 'm' ? 'son' : 'daughter'])({ name, king: k.name })); sc.kid = { name, sex }; s.winterKid = { y: s.year, name };
  } else if (ev === 'jarlDeath') {
    const old = s.notables.filter(m => !m.isKing && m.age > 45).sort((a, b) => b.age - a.age)[0];
    s.notables = s.notables.filter(m => m !== old);
    sc.title = `${old.name} is dead`; sc.lines.push(`He was ${old.age}.${unled(old.men)}`); sc.dead = { n: old.name, a: old.age, m: old.men };
  } else if (ev === 'wanderer') {
    s.flags.wanderer = true; sc.title = 'The Wanderer at the door'; sc.lines.push(rng(s.day + ':line:wanderer' + s.year).pick(LINES.wanderer), 'Rumors are half price in spring.');
  } else if (ev === 'rival') {
    const foe = foes.length ? r.pick(foes) : null, whose = foe ? `${foe.name}'s fleet` : 'A strange fleet';
    const D = r.int(20, 80) + (foe ? 30 : 0), homeS = (s.guard ?? s.notables.filter(m => m.place === 'home').reduce((a, m) => a + m.rule * m.men, 0)) * (has(s,'hallward') ? 2 : 1);
    sc.title = foe ? `${foe.name}'s sail sighted` : 'A rival sail sighted';
    const roll = 0.85 + r() * 0.3, held = homeS * roll > D; // the day's roll is kept for the card (TODO 41A.1)
    sc.fight = { h: Math.round(homeS), f: D, fell: !held, foe: foe ? foe.name : null, roll: +roll.toFixed(3), who: s.guardWho || [], unled: unledMen(s) };
    if (held) sc.lines.push(`${whose} came up the fjord. The hall held (${Math.round(homeS)} vs ${D}).`);
    else { const lostS = Math.round(s.silver * 0.3), lostM = Math.round(s.men * 0.1); s.silver -= lostS; s.men -= lostM; trimMen(s);
      sc.lines.push(`${whose} came up the fjord and the hall fell (${Math.round(homeS)} vs ${D}). ${lostS} silver and ${nMen(lostM)} gone.`); sc.lost = { silver: lostS, men: lostM };
      // a thin hall is a deadly one: someone dies in the door, by lot, the likelier the thinner the guard (TODO 25)
      if (r() < T.hallSlay * clamp(1 - T.guardSave * homeS / D, 0, 1) * clamp(s.silver / T.richHall, foe ? 1 : 0, 2)) { // a king's fleet comes for blood; a strange one kills for a rich chest; a rich chest behind a thin guard is deadlier still
        const v = r() < clamp(s.silver / T.richHall * T.richKing, 0, 0.75) ? k : r.pick(s.notables.filter(m => !s.holdings.some(h => h.id === m.place))); // they came for the King's silver: the richer the chest, the likelier it is him; else by lot
        if (v && v.isKing) { s.kingSlain = true; sc.kingSlain = true; sc.lines.push(`${k.name} died in the door of his hall.`); }
        else if (v) { s.notables = s.notables.filter(m => m !== v); sc.lines.push(`${v.name} died in the door of the hall.${unled(v.men)}`); sc.slain = { n: v.name, m: v.men }; }
      } }
    if (foe) sc.lines.push(held ? `${foe.name} is hostile. His fleets keep coming.` : `${foe.name} is hostile. This is what that costs.`);
  } else if (ev === 'hardWinter') { s.flags.hardWinter = true; sc.title = 'Hard winter'; sc.lines.push('The ice came early. Upkeep is doubled next winter.'); }
  else if (ev === 'harvest') { s.flags.harvest = true; sc.title = 'Good harvest'; sc.lines.push('The land is kind. Holdings pay double next summer.'); }
  else if (ev === 'seaman') {
    const nm = freshName(s, MALE_NAMES, r);
    s.notables.push(makeMan(nm, 3 + r.int(0, 2), 1 + r.int(0, 1), 1 + r.int(0, 2), { age: 20 + r.int(0, 12) }));
    sc.title = `${nm} comes from the sea`; sc.lines.push('A fighter looking for a lord. He waits at home.'); sc.man = s.notables[s.notables.length - 1].id;
  } else if (ev === 'suitor') {
    const d = s.children.find(c => c.sex === 'f' && c.age >= 16 && !c.married), j = r.pick(s.notables.filter(m => !m.isKing && !m.kin));
    sc.title = `${j.name} asks for ${d.name}`; sc.lines.push('Give her, and he is kin. Kin kneel.'); sc.choice = { d: d.id, j: j.id };
  } else if (ev === 'feud') {
    const js = s.notables.filter(m => !m.isKing), a = r.pick(js), b = r.pick(js.filter(x => x !== a));
    b.follow = clamp(b.follow - 1, 1, 5); moveStance(s, b, -10, `shamed at the King's table by ${a.name}`); sc.title = 'A feud in the hall'; sc.lines.push(`${a.name} shamed ${b.name} at the table. Men drift from ${b.name}.`); sc.feud = { a: a.id, b: b.id };
  } else { sc.title = 'A quiet winter'; sc.lines.push(rng(s.day + ':line:quiet' + s.year).pick(LINES.quiet)); }
  log(s, `${sc.title}. ${sc.lines[0]}`);
  for (const m of aged) { const t = `${m.name} died in his bed, ${m.age} winters old.${unled(m.men)}`; sc.lines.push(t); log(s, t); }
  sc.aged = aged.map(m => ({ n: m.name, a: m.age, m: m.men }));
  // what is coming (audit 3, TODO 26 and 27): a king's fleet that began to gather this winter, and benches that just filled
  sc.gather = Object.values(s.rulers).filter(x => x.wroth === s.year).map(x => x.name);
  const full = !benchRoom(s); sc.benchFull = full && !s.benchFull; s.benchFull = full;
  // the King's winter past fifty is turned on the card, not after it: the same seed endWinter used, so the same fate (audit 3)
  const p = deathOdds(s); s.rolled = null;
  if (p > 0 && !s.kingSlain) { s.rolled = s.year; s.oldDeath = rng(s.day + ':death:' + s.year)() < p; sc.roll = { p, dies: s.oldDeath }; }
  s.queue.push(sc);
}
function answerSuitor(s, yes) { const sc = s.queue[0]; if (sc.answer) return; if (yes) marry(s, sc.choice.d, sc.choice.j); sc.answer = yes ? 'yes' : 'no'; }
function acceptSuitor(s, yes) { answerSuitor(s, yes); next(s); }

// mortality, then the new year
function endWinter(s) {
  const p = deathOdds(s), dies = s.rolled === s.year ? s.oldDeath : p > 0 && rng(s.day + ':death:' + s.year)() < p; // turned on the winter card, or (an envoy's winter) here
  if (s.kingSlain || dies) { const kid = s.winterKid && s.winterKid.y === s.year ? s.winterKid.name : null; s.queue.push({ t:'death', cause: s.kingSlain ? 'slain' : 'age', kid }); s.kingSlain = false; return; }
  newYear(s);
}
function newYear(s) {
  s.year++; s.deeds.years++;
  for (const m of s.notables) { m.age++; if (T.ageFall.includes(m.age) && fall(m, 'combat')) log(s, `${m.name} is ${m.age}. ${rng(s.day + ':arm:' + m.id).pick(LINES.arm)} Combat ${m.combat}.`); } // the arm goes past 45 and 55 (TODO 47)
  for (const c of s.children) { c.age++; if (c.sex === 'm' && c.age === 16) comeOfAge(s, c); }
  if (s.year >= T.endYear) { s.dynasty.push(reignCard(s)); s.queue.push({ t:'end', reason: '1066' }); return; }
  s.phase = 'spring'; s.rumorOffer = null;
  s.yr = newYr(s.silver);
  // a longhouse fills the benches of the jarl who holds the coast, up to what he leads; no jarl, or a full following, and it sends no one (41B.2: a levy, not a flood)
  for (const h of s.holdings) if (built(s.shores[h.id], 'longhouse')) {
    const j = s.notables.find(m => m.place === h.id), n = j ? Math.min(T.longhouseMen, Math.max(0, fCap(s, j) - j.men)) : 0;
    if (n) { s.men += n; j.men += n; log(s, `The longhouse at ${h.name} sends ${nMen(n)} to ${j.name}.`); }
  }
  // the crews who sailed last summer gather at the ship; a destination that is now ours or gone is forgotten (TODO 20)
  for (const m of s.notables) if (m.sailed && m.place === 'home' && !(m.isKing && s.kingHome)) m.place = 'ship';
  if (s.allAboard) boardAll(s); // everyone aboard stays set (TODO 41A.3)
  if (s.destination && s.destination !== 'blind' && (isHolding(s, s.destination) || !s.shores[s.destination].known)) s.destination = null;
  // and a seen coast the ship as it stands could not take is not left on the plank ("even" is the line; TODO 41A.8)
  if (s.destination && s.destination !== 'blind' && s.shores[s.destination].seen && strengthShip(s) > 0 && winOdds(strengthShip(s), s.shores[s.destination].def) < 0.4) s.destination = null;
  if (s.lost) s.lost = s.lost.filter(l => l.y >= s.year - 1);
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
  const rg = s.regency && s.regency.boy === c.id ? s.regency : null;
  const r = rng(s.day + c.id), k = rg ? rg.father : s.king;
  const m = makeMan(c.name, clamp(k.combat - 1 + r.int(0, 2), 1, 5), clamp(k.rule - 1 + r.int(0, 2), 1, 5), clamp(2 + r.int(0, 2), 1, 5), { age: 16, son: true, kin: true });
  s.notables.push(m); c.ofAge = true;
  if (rg) return stepDown(s, m);
  log(s, `${c.name} is sixteen and takes a seat in the hall.`);
  s.queue.push({ t:'moment', tone:'boon', glyph:'men', when:'Spring', title: `${c.name} is sixteen`, lead:'He takes a seat in the hall. The line has an heir of age.', chips: [{ t:`Combat ${m.combat} · Rule ${m.rule} · Follow ${m.follow}` }], rows: [] });
}

// the regent's years end at the boy's sixteenth spring: he steps down to a seat in the hall, kin to the line now, and the boy is crowned (TODO 41B.1)
function stepDown(s, boy) {
  const rg = s.king, years = s.year - s.reign.start;
  s.dynasty.push(Object.assign(reignCard(s), { title: 'Regent' + (s.reign.title ? ' · ' + s.reign.title : '') }));
  log(s, `${rg.name} steps down. ${boy.name} is sixteen and king.`);
  s.queue.push({ t:'moment', tone:'boon', glyph:'crown', when:'Spring', title: `${rg.name} steps down`, lead: `${boy.name} is sixteen. ${rg.name} held the hall for him ${plural(years, 'year')} and gives it back. The jarls swear to the boy now.`, chips: [{ t:`${boy.name}: Combat ${boy.combat} · Rule ${boy.rule} · Follow ${boy.follow}` }], rows: [] });
  crown(s, boy, true);
  Object.assign(rg, { isKing: false, place: 'home', kin: true, sailed: false, titles: [], stance: 40, why: [{ y: s.year, t: `held the hall for ${boy.name}`, d: 40 }] });
  s.notables.push(rg);
}
// ---- The reign ends -------------------------------------------------------------------------
function reignCard(s) { return { king: s.king.name, from: s.reign.start, to: s.year, bestRaid: s.reign.bestRaid, bestHoldings: s.reign.bestHoldings, title: s.reign.title, age: s.king.age }; }
// who takes the hall when the King dies: a son of age; else, with a boy under sixteen, the most loyal man in the hall rules for him as regent (TODO 41B.1),
// any man but a hostile one; else the youngest of the kin; else no one. A boy with only hostile men in the hall: the line breaks as before
function successor(s) {
  const others = s.notables.filter(m => !m.isKing);
  const sons = others.filter(m => m.son);
  if (sons.length) return { kind: 'son', sons };
  const boy = s.children.filter(c => c.sex === 'm' && !c.ofAge).sort((a, b) => b.age - a.age)[0];
  if (boy) {
    const regent = others.filter(m => m.kin || stanceWord(m.stance) !== 'hostile').sort((a, b) => (b.kin ? 1 : 0) - (a.kin ? 1 : 0) || b.stance - a.stance || b.rule - a.rule)[0];
    if (regent) return { kind: 'regent', man: regent, boy, until: s.year + 16 - boy.age };
  }
  const inlaw = others.filter(m => m.kin).sort((a, b) => a.age - b.age)[0]; // the youngest of the kin, who may yet raise sons
  if (inlaw) return { kind: 'inlaw', man: inlaw };
  return { kind: 'none', boy };
}
function startSuccession(s) {
  s.dynasty.push(reignCard(s));
  const w = successor(s), father = s.regency ? s.regency.father : { name: s.king.name, combat: s.king.combat, rule: s.king.rule }; // a regent's death keeps the boy's own father
  if (w.kind === 'son') s.queue.push({ t:'heir', sons: w.sons.map(m => m.id) });
  else if (w.kind === 'regent') {
    s.queue.push({ t:'summary', title: 'A regent', lines: [`${w.boy.name} is ${w.boy.age}. ${w.man.name} rules for him until his sixteenth spring, in ${w.until}. Then he steps down and the boy is crowned.`] });
    crown(s, w.man); s.regency = { boy: w.boy.id, name: w.boy.name, until: w.until, father };
  }
  else if (w.kind === 'inlaw') { s.queue.push({ t:'summary', title: 'No son', lines: [`${w.man.name}, ${kinOf(w.man)}, takes the hall.`] }); crown(s, w.man); }
  else s.queue.push({ t:'end', reason: 'noheir' });
  next(s);
}
function chooseHeir(s, id) { crown(s, s.notables.find(m => m.id === id)); next(s); }
function crown(s, heir, spring = s.phase === 'spring') {
  const old = s.king;
  s.notables = s.notables.filter(m => m !== old);
  heir.isKing = true; heir.son = false; heir.kin = false; heir.titles = []; heir.offeredPairs = []; heir.place = 'home'; heir.sailed = false;
  s.king = heir; s.gen++; s.regency = null;
  s.reign = { bestRaid: null, bestHoldings: s.holdings.length, title: null, start: s.year, oath: { knelt: 0, paidN: 0, paid: 0, walked: [] } }; // what the Oath did, for the coronation card (TODO 41A.8)
  s.deeds = Object.fromEntries(Object.keys(s.deeds).map(k => [k, 0]));
  s.children = s.children.filter(c => !c.ofAge && !c.married);
  for (const m of s.notables) if (!m.isKing && m.stance) { m.stance = Math.round(m.stance / 2); m.why = [{ y: s.year, t: `a new king in the hall`, d: 0 }]; } // the father's standing is half-inherited
  // the Oath: every jarl with a holding, one at a time. Kin kneel, the loyal kneel, the hostile never kneel for free
  const r = rng(s.day + ':oath:' + s.year);
  for (const j of s.notables.filter(m => !m.isKing && s.holdings.some(h => h.id === m.place))) {
    const w = stanceWord(j.stance);
    const kneels = j.kin || w === 'loyal' || w === 'devoted' || (w !== 'hostile' && j.follow <= heir.rule + (r() < 0.5 ? 1 : 0));
    const price = Math.round(j.follow * 15 * (1 - (s.hall || 0) * T.hall.oath) * (old.titles && old.titles.includes('beloved') ? 0.5 : 1) * (w === 'hostile' ? 2 : w === 'sour' ? 1.5 : 1));
    s.queue.push({ t:'oath', jarl: j.id, kneels, price });
  }
  s.queue.push({ t:'coronation', spring }); // crowned in spring (the regent steps down as the year turns): the coronation does not turn it again
}
function oathPay(s, pay) {
  const sc = s.queue[0], j = s.notables.find(m => m.id === sc.jarl), o = s.reign.oath = s.reign.oath || { knelt: 0, paidN: 0, paid: 0, walked: [] };
  if (sc.kneels || (pay && s.silver >= sc.price)) {
    if (!sc.kneels) { s.silver -= sc.price; o.paidN++; o.paid += sc.price; if (s.yr) s.yr.oath.push({ n: j.name, v: sc.price }); moveStance(s, j, 10, 'paid for his knee'); }
    if (!j.kin) { j.sworn = s.year; j.swornTo = s.king.name; } // how he became kin: the Oath he swore, as against a daughter wed to him
    o.knelt++; j.kin = true; log(s, `${j.name} kneels.`); }
  else { const h = s.holdings.find(h => h.id === j.place); o.walked.push({ n: j.name, at: h.name }); walkAway(s, j, h); } // he walks with his holding
  next(s);
}
function finishCoronation(s) { if (s.phase === 'summer' || s.queue[0].spring) next(s); else { newYear(s); next(s); } } // a King who fell at sea is crowned over in summer; the land and winter still come

// ---- Scene queue ------------------------------------------------------------------------------
function next(s) {
  s.queue.shift();
  while (s.queue.length && s.queue[0].t === 'market' && !canMarket(s)) s.queue.shift(); // the rival sail may have emptied the chest, or the King dies on his card
  if (!s.queue.length) {
    if (s.phase === 'summer') resolveLand(s);
    else if (s.phase === 'winter' && !s.flags.winterDone) { s.flags.winterDone = true; endWinter(s); }
  }
  if (s.queue.length && s.queue[0].t === 'winter') s.flags.winterDone = false;
  save(s);
}
// saves from before stance and the hall: fill what is missing, change nothing that is there
function migrate(s) {
  if (!s) return s;
  for (const m of s.notables) { if (m.stance === undefined) m.stance = m.kin ? 20 : 0; if (!m.why) m.why = []; if (m.raidRun === undefined) m.raidRun = (m.raids || 0) % 3; if (m.winRun === undefined) m.winRun = 0; if (m.heldRun === undefined) m.heldRun = 0; } // TODO 47: an old save keeps its progress toward the next raid step
  // a save holds the King twice (s.king and his row in notables) and JSON parts them: after a reload he aged, grew and moved only in one of the two.
  // The row is the one every rule reads; the King is that row (found by the LLM playtest driver, which reloads the page on every tap)
  s.king = s.notables.find(m => m.isKing) || s.king;
  if (s.guard === undefined) s.guard = null;
  if (!s.big) s.big = [];
  if (s.allAboard === undefined) s.allAboard = false;
  if (s.kingHome === undefined) s.kingHome = false;
  if (s.regency === undefined) s.regency = null;
  if (!s.guardWho) s.guardWho = [];
  if (s.deeds.built === undefined) s.deeds.built = 0;
  if (s.deeds.raised === undefined) s.deeds.raised = 0;
  if (s.hall === undefined) s.hall = 0;
  if (!s.hallYears) s.hallYears = [];
  for (const sh of Object.values(s.shores)) if (!sh.built) sh.built = []; // buildings belong to the coast (41B.2)
  if (!s.rulers) { s.rulers = buildRulers(s.day); s.envoy = null; for (const k of Object.values(s.rulers)) k.coasts = k.coasts.filter(c => !isHolding(s, c)); discoverRulers(s); }
  s.log = s.log.map(l => typeof l === 'string' ? { y: +(l.match(/^(\d{3,4}): /) || [])[1] || null, t: l.replace(/^\d{3,4}: /, '') } : l);
  if (!s.lost) s.lost = [];
  s.yr = Object.assign(newYr(s.silver), s.yr || {});
  if (s.reign && !s.reign.oath) s.reign.oath = { knelt: 0, paidN: 0, paid: 0, walked: [] };
  // where a coast sits on the map is presentation, not state: re-project every save from the table (the real coast came in session 5)
  for (const [id, name, lon, lat, , , famous, side] of COASTS) { const sh = s.shores[id]; if (!sh) continue; const { x, y } = proj(lon, lat); sh.x = +x.toFixed(1); sh.y = +y.toFixed(1); sh.side = side || 'r'; if (sh.holy === undefined) sh.holy = !!(famous && famous.holy); if (id === 'hebrides' && sh.name === 'Hebrides') sh.name = name; if (famous && famous.late && !sh.famous) { sh.famous = true; sh.baseLoot = famous.loot; sh.baseDef = famous.def; if (!sh.seen) { sh.loot = famous.loot; sh.def = famous.def; } } } // 41B.7: a monastery's slow walls and Iona's name reach old saves
  // a save caught between the old market card and this build: finish its winter the new way (a queued {t:'market'} is the market sheet now and stays)
  s.queue = s.queue.filter(sc => !(sc.t === 'summary' && (sc.title === 'The land' || sc.title === 'The hall eats')));
  if (s.phase === 'winter' && !s.queue.length && !s.flags.winterDone) s.queue.push({ t:'winter', land: [], hall: [] });
  return s;
}
function save(s) { try { localStorage.setItem('seaking', JSON.stringify(s)); } catch (e) {} }
function load() { try { const j = localStorage.getItem('seaking'); return j ? JSON.parse(j) : null; } catch (e) { return null; } }
// a dynasty that ended, or was given up: its rows live on as Past kings on the setup screen (TODO 18)
function archive(s, why) {
  const rows = [...s.dynasty]; if (!rows.length || rows[rows.length - 1].to !== s.year || rows[rows.length - 1].king !== s.king.name) rows.push(reignCard(s));
  const past = loadPast();
  past.unshift({ at: new Date().toISOString().slice(0, 10), seed: s.day, from: T.startYear, to: s.year, gens: s.gen, why, rows });
  try { localStorage.setItem('seaking-sagas', JSON.stringify(past.slice(0, 20))); } catch (e) {}
  try { localStorage.removeItem('seaking'); } catch (e) {}
}
function loadPast() { try { return JSON.parse(localStorage.getItem('seaking-sagas')) || []; } catch (e) { return []; } }
