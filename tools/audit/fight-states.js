// Round 4: trim saved summer states (tools/audit/states/fight-*.json, dumped by `FIGHTS=dir node tools/playtest/run.js`) to what the Fight-sheet mock-ups need.
// Usage: node tools/audit/fight-states.js [names...]  → JSON on stdout. A Landfall state carries the fight each of its coasts would bring (run on a copy, same seed).
const fs = require('fs'), path = require('path'), vm = require('vm'), root = path.join(__dirname, '..', '..');
const ctx = vm.createContext({ console, Date, localStorage: { getItem: () => null, setItem() {}, removeItem() {} } });
vm.runInContext(['coast.js', 'world.js', 'game.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n').replace(/^(const|let) /gm, 'var '), ctx);
const G = ctx, dir = path.join(__dirname, 'states');
const names = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(dir).filter(f => f.startsWith('fight-')).map(f => f.slice(0, -5));
const copy = s => JSON.parse(JSON.stringify(s)), held = (s, m) => s.holdings.some(h => h.id === m.place), r1 = v => Math.round(v * 1000) / 1000;
const pre = (s, id) => { const sh = s.shores[id], own = G.ownerOf(s, id);
  return { shore: id, def: sh.def, loot: sh.loot, silver: s.silver, men: s.men, S: G.strengthShip(s), owner: own ? { name: own.name, stance: own.stance } : null,
    crew: s.notables.filter(m => m.place === 'ship').map(m => ({ id: m.id, name: m.name, isKing: !!m.isKing, kin: !!m.kin, son: !!m.son, age: m.age, men: m.men, c: m.combat, r: m.rule, f: m.follow, stance: m.stance, raids: m.raids })) }; };
const shoreOf = (s, id) => { const x = s.shores[id]; return { id, name: x.name, x: x.x, y: x.y, holdable: x.holdable }; };
// who takes the hall if the King fell: run the succession on a copy
function succ(s) { const c = copy(s); while (c.queue.length && c.queue[0].t !== 'death') c.queue.shift(); if (!c.queue.length) return null; G.startSuccession(c); const q = c.queue[0];
  return q ? { t: q.t, reason: q.reason || null, sons: q.sons ? q.sons.map(id => { const m = c.notables.find(x => x.id === id); return m.name + ' ' + m.age; }) : null, lines: q.lines || null } : null; }
// the fight as the mocks read it, from the crew before and the state after
function fightOf(p, s, sc) {
  const own = G.ownerOf(s, sc.shore), after = id => s.notables.find(m => m.id === id), fellLines = s.queue.filter(q => q.t === 'summary' && q.lines.some(l => / went down /.test(l))).flatMap(q => q.lines);
  const crew = p.crew.map(m => { const a = after(m.id), fell = m.isKing ? s.queue.some(q => q.t === 'death') : !a;
    return { name: m.name, isKing: m.isKing, kin: m.kin, son: m.son, age: m.age, men0: m.men, men1: a ? a.men : 0, lost: a ? m.men - a.men : null, unled: 0, c0: m.c, c1: a ? a.combat : m.c, f0: m.f, f1: a ? a.follow : m.f, r: m.r, st0: G.stanceWord(m.stance), st1: a ? G.stanceWord(a.stance) : null, d: a && !m.isKing ? a.stance - m.stance : 0, raids: a ? a.raids : m.raids + 1, fell }; });
  for (const m of crew) if (m.fell && !m.isKing) { const pm = p.crew.find(x => x.name === m.name); m.unled = pm.men - Math.min(pm.men, Math.round(sc.losses * pm.men / Math.max(1, p.crew.reduce((a, x) => a + x.men, 0)))); }
  const next = s.queue.slice(1).map(q => q.t === 'summary' ? (q.lines.some(l => / went down /.test(l)) ? 'fallen' : / breaks$/.test(q.title) ? 'breaks' : 'summary') : q.t);
  const ruler = s.queue.find(q => q.t === 'ruler'), rk = ruler && s.rulers[ruler.ruler];
  return { shore: shoreOf(s, sc.shore), S: p.S, Sr: sc.S, D: sc.D, roll: r1(sc.S / Math.max(1, p.S)), odds: r1(G.winOdds(p.S, sc.D)), words: G.oddsWords(p.S, sc.D), win: sc.win, margin: r1(sc.margin), loot: sc.loot, losses: sc.losses,
    verdict: sc.win ? (sc.margin > 1 ? 'Rout' : sc.margin > 0.3 ? 'Victory' : 'A narrow thing') : 'Driven back',
    loot0: p.loot, wolf: G.has(s, 'seawolf'), def0: p.def, def1: s.shores[sc.shore].def, crew, owner: p.owner ? { name: p.owner.name, st0: G.stanceWord(p.owner.stance), st1: own ? G.stanceWord(own.stance) : null, d: own ? own.stance - p.owner.stance : 0 } : null,
    next, succ: next.includes('death') ? succ(s) : null, ruler: rk ? { name: rk.name, title: rk.title, st: G.stanceWord(rk.stance), coasts: rk.coasts.map(x => s.shores[x].name), seat: s.shores[rk.anchor].name } : null,
    stay: next[0] === 'stay' ? stayOf(s, s.queue[1]) : null };
}
function stayOf(s, sc) {
  const sh = s.shores[sc.shore], own = G.ownerOf(s, sc.shore), pay = G.holdPay(sh), unrest = G.stayUnrest(s, sh);
  const jarls = s.notables.filter(m => m.place === 'ship' && !m.isKing).map(m => ({ name: m.name, men: m.men, cap: G.fCap(s, m), c: m.combat, r: m.rule, f: m.follow, age: m.age, st: G.stanceWord(m.stance), kin: !!m.kin, son: !!m.son }));
  return { shore: shoreOf(s, sc.shore), loot: sc.loot, pay, unrest, payback: Math.ceil(sc.loot / pay), jarls, walked: sc.walked ? { name: sh.walked.name, c: sh.walked.combat, r: sh.walked.rule, f: sh.walked.follow } : null,
    owner: own ? { name: own.name, st: G.stanceWord(own.stance), after: G.stanceWord(own.stance - G.T.takeSour), rest: own.coasts.filter(x => x !== own.anchor).length, held: own.coasts.filter(x => x !== own.anchor && s.holdings.some(h => h.id === x)).length, seat: s.shores[own.anchor].name, isSeat: own.anchor === sc.shore } : null,
    holdings: s.holdings.length, rent: s.holdings.reduce((a, h) => a + h.pay, 0) };
}
const out = {};
for (const n of names) {
  const s = G.migrate(JSON.parse(fs.readFileSync(path.join(dir, n + '.json'), 'utf8'))), sc = s.queue[0], k = s.king;
  const base = { year: s.year, king: { name: k.name, age: k.age, titles: k.titles }, silver: s.silver, men: s.men, unled: G.unledMen(s), deathP: +G.deathOdds(s).toFixed(3),
    home: shoreOf(s, G.HOME_ID), known: Object.values(s.shores).filter(x => x.seen).map(x => ({ id: x.id, name: x.name, x: x.x, y: x.y, ours: s.holdings.some(h => h.id === x.id) })), holdings: s.holdings.length, scene: sc.t, reign: s.reign.start, price: G.has(s, 'fairdealer') ? 2 : G.T.manPrice };
  if (sc.t === 'arrive') {
    const S = G.strengthShip(s);
    base.arrive = { blind: s.lastDest === 'blind', S, targets: sc.targets.map(id => { const x = s.shores[id], own = G.ownerOf(s, id), c = copy(s), p = pre(c, id); G.chooseTarget(c, id);
      return { ...shoreOf(s, id), loot: x.loot, def: x.def, owner: own ? own.name : null, walked: x.walked ? x.walked.name : null, odds: r1(G.winOdds(S, x.def)), words: G.oddsWords(S, x.def), fight: fightOf(p, c, c.queue[0]) }; }) };
  } else if (sc.t === 'fight') base.fight = fightOf(s.pre4, s, sc);
  else if (sc.t === 'stay') base.stay = stayOf(s, sc);
  out[n.replace(/^fight-/, '')] = base;
}
console.log(JSON.stringify(out));
