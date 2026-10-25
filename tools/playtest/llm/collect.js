// Gathers every playtester's notes, review and steps into out/all.json, for the round's report. Usage: node tools/playtest/llm/collect.js [agent ...]
'use strict';
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, 'out'), ROOT = path.join(__dirname, '..', '..', '..');
const PERSONAS = { roleplayer: 'in', minmaxer: 'in', 'map-painter': 'in', 'paradox-veteran': 'in', 'history-buff': 'in', 'mobile-strategist': 'in', 'casual-phone': 'out', 'action-gamer': 'out' };
const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PERSONAS).filter(n => fs.existsSync(path.join(OUT, n)));
const all = { collected: new Date().toISOString(), agents: {} };
for (const n of names) {
  const d = path.join(OUT, n), rd = f => { try { return fs.readFileSync(path.join(d, f), 'utf8'); } catch (e) { return ''; } };
  const notes = rd('notes.jsonl').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean);
  const steps = rd('steps.log').split('\n').filter(Boolean).map(l => { const [step, year, phase, kind, cmd, shot, notes] = l.split('\t'); return { step: +step, year: +year || null, phase, kind, cmd, shot, notes: +notes || 0 }; });
  const save = (() => { try { return JSON.parse(rd('save.json')); } catch (e) { return null; } })();
  const persona = (() => { try { return fs.readFileSync(path.join(__dirname, 'personas', n + '.md'), 'utf8'); } catch (e) { return ''; } })();
  all.agents[n] = { name: n, genre: PERSONAS[n] || 'in', handle: (persona.match(/— "([^"]+)"/) || [])[1] || n, persona, notes, review: rd('review.md'), steps,
    calls: steps.length, years: steps.length ? [steps[0].year, steps[steps.length - 1].year] : null, kinds: [...new Set(steps.map(s => s.kind))],
    end: save ? { year: save.year, king: save.king && save.king.name, gen: save.gen, silver: save.silver, men: save.men, holdings: save.holdings.length, notables: save.notables.length, log: save.log.slice(-12) } : null };
  console.log(`${n.padEnd(18)} ${steps.length} calls · ${notes.length} notes · review ${all.agents[n].review ? 'yes' : 'NO'} · ${all.agents[n].years ? all.agents[n].years.join('→') : '-'}`);
}
fs.writeFileSync(path.join(OUT, 'all.json'), JSON.stringify(all, null, 1));
const byCat = {}; for (const a of Object.values(all.agents)) for (const x of a.notes) { const k = `${x.category}/${x.severity}`; byCat[k] = (byCat[k] || 0) + 1; }
console.log('\nnotes by category/severity:'); console.log(Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${v.toString().padStart(3)}  ${k}`).join('\n'));
console.log(`\nwrote ${path.relative(ROOT, path.join(OUT, 'all.json'))}`);
