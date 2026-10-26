// The reflexion loop's one measurement (docs/reflex/RUBRIC.md). Runs the headless dynasty, the persona playtests and a few lints,
// scores each against the rubric's bands, writes docs/reflex/metrics/latest.json (and a dated copy), prints a scoreboard.
// Usage: node tools/reflex/measure.js [--seeds 8] [--no-personas] [--tag text]
// Exit code is 0 unless the smoke test fails (the gate); WARN lines are for the loop to weigh, not to block.
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto');
const root = path.join(__dirname, '..', '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : d; };
const SEEDS = +opt('seeds', 8), PERSONAS = !args.includes('--no-personas'), TAG = opt('tag', '');
const out = { at: new Date().toISOString(), head: git('rev-parse --short HEAD'), tag: TAG, seeds: SEEDS, gate: 'ok', smoke: {}, personas: {}, bands: [], lints: [], notes: [] };

function git(cmd) { try { return cp.execSync('git ' + cmd, { cwd: root, encoding: 'utf8' }).trim(); } catch (e) { return ''; } }
function run(cmd, env) { try { return { ok: true, text: cp.execSync(cmd, { cwd: root, encoding: 'utf8', env: Object.assign({}, process.env, env || {}), stdio: ['ignore', 'pipe', 'pipe'] }) }; } catch (e) { return { ok: false, text: String(e.stdout || '') + String(e.stderr || '') }; } }
const band = (name, value, lo, hi, why) => { const v = value == null || Number.isNaN(value) ? null : +value; const ok = v !== null && (lo == null || v >= lo) && (hi == null || v <= hi); out.bands.push({ name, value: v, lo, hi, ok, why }); return ok; };

// ---- 1. the gate: the headless dynasty (fake DOM, every screen, reloads), on its fixed seed; then once more on today's seed as a fuzz ---
function smoke(env) {
  const r = run('node tools/smoke.js', env);
  const lines = r.text.trim().split('\n');
  const json = lines.find(l => l.startsWith('{')); const bad = lines.filter(l => !l.startsWith('{') && !/^(OK|FAIL)/.test(l));
  return Object.assign({ ok: r.ok, bad }, json ? JSON.parse(json) : {});
}
out.smoke = smoke({});
if (!out.smoke.ok) out.gate = 'fail';
out.fuzz = smoke({ SEED: 'fuzz-' + out.at.slice(0, 13) }); // a different dynasty every hour; a failure here is a find, not a gate: note the seed and queue it

// ---- 2. the persona playtests: does a bad plan lose, does a good one live, is there anything to want -------------------
if (PERSONAS) {
  const tmp = path.join(require('os').tmpdir(), 'reflex-pt.json');
  const r = run(`node tools/playtest/run.js --seeds ${SEEDS} --json ${tmp}`);
  if (!r.ok || !fs.existsSync(tmp)) { out.notes.push('persona harness failed: ' + r.text.slice(-400)); }
  else {
    const pt = JSON.parse(fs.readFileSync(tmp, 'utf8')); fs.unlinkSync(tmp);
    const by = {}; for (const x of pt.runs) (by[x.persona] = by[x.persona] || []).push(x);
    const mean = (rs, f) => { const v = rs.map(f).filter(x => x != null && !Number.isNaN(x)); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
    for (const [p, rs] of Object.entries(by)) out.personas[p] = { broke: mean(rs, x => x.broke ? 1 : 0), lossPct: mean(rs, x => x.lossPct), luckPct: mean(rs, x => x.luckPct), starveYears: mean(rs, x => x.starveYears), chestAvg: mean(rs, x => x.chestAvg), holdAt850: mean(rs, x => x.holdAt850), finalHoldings: mean(rs, x => x.finalHoldings), kingFell: mean(rs, x => x.kingFell), endYear: mean(rs, x => x.endYear), gens: mean(rs, x => x.gens) };
    out.fateHash = crypto.createHash('md5').update(JSON.stringify(pt.runs)).digest('hex').slice(0, 12); // same code, same seeds, same fates; a change here with no rule change is a nondeterminism bug
    const P = out.personas, g = p => P[p] || {};
    // the rubric's bands (RUBRIC.md §Measured). Change a band only with a JOURNAL entry saying why.
    band('raider breaks', g('raider').broke, 0.75, null, 'a plan that never holds land should not reach 1066');
    band('reckless breaks', g('reckless').broke, 0.5, null, 'sailing blind at any odds should usually end the line');
    band('miser breaks', g('miser').broke, 0.35, null, 'a rich unguarded hall should draw sails');
    for (const p of ['levi', 'settler', 'hall-sitter', 'courtier']) band(`${p} lives`, 1 - (g(p).broke ?? 1), 0.75, null, 'a careful plan should usually reach 1066');
    band('levi loses fights %', g('levi').lossPct, 3, 15, 'the fight has to be able to go wrong without being a coin toss');
    band('levi luck in play %', g('levi').luckPct, 4, 10, 'the roll decides a fight sometimes, not often (audit 4)');
    band('levi holdings at 850', g('levi').holdAt850, 8, 30, 'not every coast by 850: the "automatic win" complaint (TODO 25)');
    band('levi king falls / line', g('levi').kingFell, 0, 3, 'the King at sea is a risk, not a habit');
    const careful = ['levi', 'settler', 'hall-sitter', 'courtier'].map(p => g(p).chestAvg).filter(x => x != null);
    band('idle silver (careful chest avg)', careful.length ? careful.reduce((a, b) => a + b, 0) / careful.length : null, null, 300, 'silver with nothing to buy is the year-seven itch (41B.2, TODO 33)');
  }
}

// ---- 3. lints: things a reader would catch that no harness renders ------------------------------------------------------
{
  const read = f => fs.readFileSync(path.join(root, f), 'utf8');
  const lint = (kind, where, text) => out.lints.push({ kind, where, text });
  // palette: colours live as tokens in index.html; a hex in a script is a colour the brand did not approve
  const code = l => l.replace(/\/\/(?![^'"`]*['"`][^'"`]*$).*$/, ''); // drop a trailing comment (keeps a // inside a string)
  for (const f of ['ui.js', 'game.js', 'world.js']) read(f).split('\n').forEach((l, i) => { if (/mask|fog/.test(l)) return; const m = code(l).replace(/\$\('#[^']*'\)/g, '').match(/#[0-9a-fA-F]{3,8}\b(?![\w-])/g); if (m) for (const h of m) lint('palette', `${f}:${i + 1}`, h + ' (colours are tokens in index.html)'); });
  // copy: plural and spacing slips in literal strings
  for (const f of ['ui.js', 'game.js', 'world.js']) read(f).split('\n').forEach((l, i) => { const c = code(l); if (/[^$]\b1 (men|holdings|coasts|sons|years)\b/.test(c)) lint('copy', `${f}:${i + 1}`, '"1 men"-style plural'); if (/\w ,/.test(c)) lint('copy', `${f}:${i + 1}`, 'space before comma'); });
  // the service worker's file list against the disk and against what index.html loads
  const sw = read('sw.js'); const files = [...sw.matchAll(/'\.\/([^']+)'/g)].map(m => m[1]).filter(f => f !== '');
  for (const f of files) if (!fs.existsSync(path.join(root, f))) lint('sw', 'sw.js', `cached file missing on disk: ${f}`);
  const html = read('index.html'); for (const m of html.matchAll(/(?:src|href)="([^"#:]+)"/g)) { const f = m[1].replace(/^\.\//, ''); if (!/^(sw\.js)$/.test(f) && !files.includes(f) && fs.existsSync(path.join(root, f))) lint('sw', 'index.html', `loaded but not cached offline: ${f}`); }
  const changed = git('diff --name-only HEAD').split('\n').filter(Boolean);
  if (changed.some(f => files.includes(f)) && !changed.includes('sw.js')) lint('sw', 'sw.js', 'a cached file changed in the working tree and V was not bumped');
  // type: nothing under 12 px on a phone
  for (const m of html.matchAll(/font-size:\s*([\d.]+)px/g)) if (+m[1] < 12) lint('type', 'index.html', `font-size ${m[1]}px`);
  // weight: the game is one page; keep it light
  const bytes = ['index.html', 'ui.js', 'game.js', 'world.js', 'coast.js'].reduce((a, f) => a + fs.statSync(path.join(root, f)).size, 0);
  out.bytes = bytes; if (bytes > 450000) lint('weight', 'bundle', `${(bytes / 1024).toFixed(0)} KB of html+js (budget 450)`);
  // unfinished work: TODO items Levi decided that are not marked built (the loop's B-class queue)
  const todo = read('docs/TODO.md'); const decided = [...todo.matchAll(/\*\*Decided[^*]*\*\*/g)].length, built = [...todo.matchAll(/\*\*Built[^*]*\*\*|\*Built\.\*|Built session|built session/gi)].length;
  out.todo = { decided, built };
}

// ---- 4. write and print -------------------------------------------------------------------------------------------------
const dir = path.join(root, 'docs', 'reflex', 'metrics'); fs.mkdirSync(dir, { recursive: true });
const prevPath = path.join(dir, 'latest.json'); const prev = fs.existsSync(prevPath) ? JSON.parse(fs.readFileSync(prevPath, 'utf8')) : null;
fs.writeFileSync(prevPath, JSON.stringify(out, null, 1));
fs.writeFileSync(path.join(dir, out.at.slice(0, 16).replace(/[:T]/g, '-') + (TAG ? '-' + TAG.replace(/\W+/g, '_') : '') + '.json'), JSON.stringify(out, null, 1));

const fmt = x => x == null ? '-' : Math.abs(x) >= 100 ? String(Math.round(x)) : Math.abs(x) >= 10 ? x.toFixed(0) : x.toFixed(2).replace(/\.?0+$/, '');
console.log(`Ring Giver reflex measure · ${out.at.slice(0, 16)} · ${out.head}${TAG ? ' · ' + TAG : ''}`);
const smokeLine = (s, label) => `${label} ${s.ok ? 'OK  ' : 'FAIL'} seed ${s.seed} · ${s.from}→${s.to} · ${s.gens} kings · ${s.lines} lines · ${s.renders} renders · ${s.reloads} reloads${s.bad && s.bad.length ? '\n  ' + s.bad.join('\n  ') : ''}`;
console.log(`GATE ${out.gate === 'ok' ? 'ok ' : 'FAIL'}  ${smokeLine(out.smoke, 'smoke')}`);
console.log(`fuzz  ${smokeLine(out.fuzz, out.fuzz.ok ? 'clean' : 'FOUND')}${out.fuzz.ok ? '' : '\n  reproduce: SEED=' + out.fuzz.seed + ' node tools/smoke.js'}`);
if (PERSONAS) {
  console.log(`fates ${out.fateHash}${prev && prev.fateHash ? (prev.fateHash === out.fateHash ? ' (unchanged)' : ' (changed from ' + prev.fateHash + ')') : ''}`);
  for (const b of out.bands) { const was = prev && prev.bands && prev.bands.find(x => x.name === b.name); const d = was && was.value != null && b.value != null && Math.abs(was.value - b.value) > 1e-9 ? ` (was ${fmt(was.value)})` : ''; console.log(`${b.ok ? 'pass' : 'WARN'}  ${b.name.padEnd(34)} ${fmt(b.value).padStart(6)}  [${b.lo == null ? '' : fmt(b.lo)}..${b.hi == null ? '' : fmt(b.hi)}]${d}  ${b.why}`); }
}
for (const l of out.lints) console.log(`lint  ${l.kind.padEnd(8)} ${l.where.padEnd(18)} ${l.text}`);
for (const n of out.notes) console.log('note  ' + n);
console.log(`weight ${(out.bytes / 1024).toFixed(0)} KB · TODO decided-marks ${out.todo.decided} built-marks ${out.todo.built} · written docs/reflex/metrics/latest.json`);
process.exit(out.gate === 'ok' ? 0 : 1);
