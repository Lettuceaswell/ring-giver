// Round 3: trim saved winter-card states (tools/audit/states/card-*.json, dumped by `CARDS=dir node tools/playtest/run.js`) to what the card mock-ups need.
// Usage: node tools/audit/card-states.js [names...]  → JSON on stdout. Also reports, per state, what follows the card (spring, the old-age death, the King slain).
const fs = require('fs'), path = require('path'), vm = require('vm'), root = path.join(__dirname, '..', '..');
const ctx = vm.createContext({ console, Date, localStorage: { getItem: () => null, setItem() {}, removeItem() {} } });
vm.runInContext(['coast.js', 'world.js', 'game.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n').replace(/^(const|let) /gm, 'var '), ctx);
const G = ctx, dir = path.join(__dirname, 'states');
const names = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(dir).filter(f => f.startsWith('card-')).map(f => f.slice(0, -5));
const out = {};
// this reign's winter cards, read back from the chronicle: one { y, tone, t } a winter (tone: blood, boon, omen, quiet)
const CARD = /^(A son is born|A daughter is born|\S+ is dead\. He was|The Wanderer at the door|.+ sail sighted|Hard winter|Good harvest|\S+ comes from the sea|\S+ asks for |A feud in the hall|A quiet winter)/;
const tone = t => /hall fell|is dead\. He was/.test(t) ? 'blood' : /born|from the sea|harvest|asks for/.test(t) ? 'boon' : /Hard winter|feud|sail sighted/.test(t) ? 'omen' : 'quiet';
function reignWinters(s) { const by = {}; for (const l of s.log) if (l.y >= s.reign.start && l.y < s.year && CARD.test(l.t)) by[l.y] = { y: l.y, tone: tone(l.t), t: l.t.replace(/\. .*/, '') }; return Object.values(by); }
for (const n of names) {
  const s = G.migrate(JSON.parse(fs.readFileSync(path.join(dir, n + '.json'), 'utf8'))), sc = s.queue[0], k = s.king;
  const held = m => s.holdings.some(h => h.id === m.place);
  const man = m => ({ name: m.name, age: m.age, men: m.men, cap: G.fCap(s, m), c: m.combat, r: m.rule, f: m.follow, st: G.stanceWord(m.stance), kin: !!m.kin, son: !!m.son, at: held(m) ? s.shores[m.place].name : m.place });
  const p = k.age > 50 ? 0.05 * (k.age - 50) * (G.has(s, 'oldwise') ? 0.5 : 1) : 0;
  // what follows: run the card's own button on a copy
  const c = JSON.parse(JSON.stringify(s)); const slain = !!c.kingSlain;
  if (sc.t === 'event' && sc.choice) G.acceptSuitor(c, false); else G.next(c);
  const after = c.queue[0] ? c.queue[0].t : 'spring', follows = after === 'death' ? (slain ? 'slain' : 'age') : after;
  let succ = null; if (after === 'death') { G.startSuccession(c); const q = c.queue[0]; succ = q ? { t: q.t, reason: q.reason || null, sons: q.sons ? q.sons.map(id => { const m = c.notables.find(x => x.id === id); return m.name + ' ' + m.age; }) : null, lines: q.lines || null } : null; } // who takes the hall after him
  out[n.replace(/^card-/, '')] = {
    year: s.year, king: { name: k.name, age: k.age, titles: k.titles, c: k.combat, r: k.rule }, silver: s.silver, men: s.men,
    unled: s.men - s.notables.reduce((a, m) => a + m.men, 0), deathP: +p.toFixed(3), follows, succ,
    card: sc.t === 'ruler' ? { t: 'ruler', ruler: s.rulers[sc.ruler].name, title: s.rulers[sc.ruler].title, st: G.stanceWord(s.rulers[sc.ruler].stance), coasts: s.rulers[sc.ruler].coasts.map(x => s.shores[x].name), seat: s.shores[s.rulers[sc.ruler].anchor].name, newest: s.rulers[sc.ruler].newest ? s.shores[s.rulers[sc.ruler].newest].name : null }
      : { t: sc.t, ev: sc.ev, title: sc.title, lines: sc.lines, choice: sc.choice ? { d: s.children.find(x => x.id === sc.choice.d).name, j: man(s.notables.find(x => x.id === sc.choice.j)) } : null },
    kids: s.children.filter(x => !x.ofAge && !(x.sex === 'f' && x.married)).map(x => ({ name: x.name, sex: x.sex, age: x.age })),
    sons: s.notables.filter(m => m.son).map(m => ({ name: m.name, age: m.age })),
    bench: s.notables.filter(m => !m.isKing && !held(m)).map(man), benchMax: G.benchCap(s), benchFull: !G.benchRoom(s),
    holdings: s.holdings.length, rent: s.holdings.reduce((a, h) => a + G.holdPay(s.shores[h.id]), 0),
    homeMen: s.notables.filter(m => m.place === 'home').reduce((a, m) => a + m.men, 0), guard: s.guard,
    rulers: Object.values(s.rulers).filter(x => x.known).map(x => ({ name: x.name, st: G.stanceWord(x.stance), wroth: x.wroth ?? null, broken: !!x.broken })),
    flags: s.flags, rumor: G.rumorPrice(s), deep: G.has(s, 'deepchest'), reign: s.reign.start, winters: reignWinters(s),
  };
}
console.log(JSON.stringify(out, null, 1));
