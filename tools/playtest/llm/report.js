// Builds the round's report page from out/all.json, out/clusters.json, out/ratings.json and the screenshots.
// Usage: node tools/playtest/llm/report.js [out.html]   (default docs/playtests/llm-round-1.html). Needs ImageMagick (`magick`) for the thumbnails.
'use strict';
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const ROOT = path.join(__dirname, '..', '..', '..'), OUT = path.join(__dirname, 'out'), THUMBS = path.join(OUT, 'thumbs');
const DEST = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, 'docs', 'playtests', 'llm-round-1.html');
const all = JSON.parse(fs.readFileSync(path.join(OUT, 'all.json'), 'utf8')), C = JSON.parse(fs.readFileSync(path.join(OUT, 'clusters.json'), 'utf8')), R = JSON.parse(fs.readFileSync(path.join(OUT, 'ratings.json'), 'utf8'));
const sprite = fs.readFileSync(path.join(__dirname, 'sprite.svg'), 'utf8');
const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ico = (n, cls = '') => `<svg class="icon ${cls}" width="16" height="16" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const AG = all.agents, NAMES = ['roleplayer', 'minmaxer', 'map-painter', 'paradox-veteran', 'history-buff', 'mobile-strategist', 'casual-phone', 'action-gamer'];
const handle = n => AG[n] ? AG[n].handle : n;
const CATS = ['onboarding', 'legibility', 'clarity', 'decisions', 'feedback', 'pacing', 'map', 'people', 'goal', 'writing', 'visuals', 'overall'];
const by = id => C.issues.concat(C.delights, C.wishlist).find(x => x.id === id);

// ---- thumbnails: 320px JPEGs of the screenshots the page shows, as data URIs ----
fs.mkdirSync(THUMBS, { recursive: true });
function thumb(rel) { if (!rel) return null; const src = path.join(ROOT, rel); if (!fs.existsSync(src)) return null;
  const name = rel.replace(/^tools\/playtest\/llm\/out\//, '').replace(/\/shots\//, '__').replace(/\.png$/, '.jpg'), dst = path.join(THUMBS, name);
  if (!fs.existsSync(dst)) execSync(`magick "${src}" -resize 320x -quality 72 "${dst}"`);
  return 'data:image/jpeg;base64,' + fs.readFileSync(dst).toString('base64'); }
const shotOf = (agent, kind, year, which = 'first') => { const s = AG[agent].steps.filter(x => x.kind === kind && (year == null || x.year === year)); const p = which === 'last' ? s[s.length - 1] : s[0]; return p ? p.shot : null; };
const fig = (rel, cap) => { const d = thumb(rel); return d ? `<figure><img src="${d}" alt="${esc(cap)}" loading="lazy"><figcaption>${esc(cap)}</figcaption></figure>` : ''; };

// ---- numbers for the hero ----
const calls = NAMES.reduce((a, n) => a + AG[n].calls, 0), notes = NAMES.reduce((a, n) => a + AG[n].notes.length, 0);
const broke = NAMES.filter(n => AG[n].end && AG[n].end.year < 813), reached = NAMES.filter(n => AG[n].end && AG[n].end.year >= 813);
const mean = c => { const v = NAMES.map(n => R[n][c]).filter(x => x != null); return v.reduce((a, b) => a + b, 0) / v.length; };
const sevRank = { blocker: 0, major: 1, minor: 2, nit: 3, praise: 4 };
const sevIcon = { blocker: 'triangle-alert', major: 'circle-alert', minor: 'circle-minus', nit: 'circle-minus', praise: 'sparkles' };
const chip = s => `<span class="sev ${s}">${ico(sevIcon[s] || 'circle-minus')}${s}</span>`;
const who = x => `<span class="who" title="${esc(x.agents.map(handle).join(', '))}">${x.agents.length} of 8${x.outGenre ? ` · ${x.outGenre} outside the genre` : ''}</span>`;
const quoteList = (qs, n = 3) => `<ul class="quotes">${qs.slice(0, n).map(q => `<li><span class="q">${esc(q.text)}</span><span class="src">${esc(q.handle)}${q.year ? ` · ${q.year}` : ''}${q.kind ? ` · ${esc(q.kind)}` : ''}</span></li>`).join('')}</ul>`;
const clusterCard = x => `<details class="cl ${x.kind}"><summary>${chip(x.worstSeverity)}${x.bug ? `<span class="sev bug">${ico('bug')}bug</span>` : ''}<span class="t">${esc(x.title)}</span>${who(x)}</summary><div class="body">${quoteList(x.quotes, 4)}<div class="meta">${x.noteCount} notes · first seen ${x.firstYear || '—'} · screens: ${esc((x.screens || []).join(', '))}</div></div></details>`;

// ---- the headline findings: hand-picked groups of clusters, with the screens that show them ----
const FINDINGS = [
  { title: 'The winter trapdoor: Guard 0, the King slain, the line broken', ids: ['guard-zero', 'strange-fleet-unnamed', 'line-ends-unwarned'], sev: 'blocker',
    text: `Three of the eight dynasties ended in winter 799, six years in, the same way: a rival sail came up the fjord, the card said <em>Guard 0</em> with forty to seventy men in the hall, the King died in his door, and his son was four. Nothing before that winter says what the guard is made of (a named man at home), that a strange sail can kill the King, or that a King who dies before a son is sixteen ends the dynasty, which is true for every death before 809. Every summer screen prices the King's risk to a tenth of a percent; the one risk that ended the run had no number anywhere. The careful players (the min-maxer, the Paradox veteran, the history teacher) were the ones it killed, because they had read "no risk to him at these odds" and believed the ship was the dangerous place.`,
    shots: [['paradox-veteran', 'tools/playtest/llm/out/paradox-veteran/shots/063-card-rival.png', 'Winter 797, Mikkel: the first strange sail. Guard 0 against Fleet 44, with the King home.'], ['paradox-veteran', 'tools/playtest/llm/out/paradox-veteran/shots/081-death.png', 'Winter 799: Ragnar slain in his door. Gunnar is 4. The line is broken.']] },
  { title: 'Men you buy do not get on the boat', ids: ['unled-men', 'garrison-taps', 'everyone-aboard-inconsistent'], sev: 'major',
    text: `All eight hit it. The market says "room for 37 more under the named men", the player buys, and in spring the band reads "30 unled" while the ship sails with the same crew as last year. Fill lives on the Ship tab under each man; Everyone aboard is a grey chip that comes and goes; "+ 5 men to Bjorn" on the Hall does nothing, silently, when the men are under the King. By five holdings the Hall is 1,500 px of − n + Fill rows with nine destination buttons each. The casual player found Fill in year three by poking; the action gamer sailed under strength for most of twenty years.`,
    shots: [['mobile-strategist', 'tools/playtest/llm/out/mobile-strategist/shots/016-spring-ship.png', 'Spring 794, Priya: bought men sit unled; Fill is a small button per man.'], ['mobile-strategist', 'tools/playtest/llm/out/mobile-strategist/shots/232-spring-hall.png', 'Spring 813: the Hall at five holdings, nine buttons a man, 1,700 px of scroll.']] },
  { title: 'Numbers where a sentence should be', ids: ['hold-math-not-actionable', 'odds-vocabulary', 'setup-jargon', 'fork-at-25-jargon', 'ship-strength-sum'], sev: 'major',
    text: `"Rule 2 × 8 = 16 vs 52 · 0% · with 30 men 60 · 94%" was quoted by seven players, in-genre and out, as the line that asked them to leave their father's man on a foreign shore. The odds come in three vocabularies that never meet ("sure · fair", "sailed on 100%", "likely holds", "hopeless" beside "12%"). "F × 10", "fork at 25" and "0 unled" sit in the first minute with no words under them. The min-maxer liked the formulas and still wanted the sentence first; the teacher and the nurse never got past them.`,
    shots: [['mobile-strategist', 'tools/playtest/llm/out/mobile-strategist/shots/007-stay.png', 'Plunder or stay, 793: the hold test as arithmetic in 13 px mono.']] },
  { title: 'The biggest moments happen in the ledger', ids: ['big-events-grey-lines', 'raid-text-same', 'birth-card-template', 'named-men-no-intro'], sev: 'major',
    text: `A raid gets the battle, the roll, the stamp. A holding rising against its jarl, a king kneeling, a king taking his seat back, a named man dying in the door, and a son coming of age are each one grey line in the autumn account or a silent row in a list. Six players called it out and the roleplayer built her whole review around it: "I care about my run more than the game seems to know it does." The winter card already has the frame these moments need.`,
    shots: [['roleplayer', 'tools/playtest/llm/out/roleplayer/shots/034-winter.png', 'Autumn 794, Dana: "Skåne rose against Bjorn. 8 men dead" as the fifth line of the money sheet.']] },
  { title: 'Profit forgets the winter bill', ids: ['profit-ignores-upkeep', 'starvation-no-preview', 'rent-only-if-king-home'], sev: 'major',
    text: `"+52 profit" in spring, "The hall ate · 53 men −53" in autumn, chest up 14. The profit figure leaves out upkeep and the hall-pay a sailing King forfeits, so maximum buying looks right on every screen and walks the player into a treadmill, then a famine: a short chest sends every unfed man away, with no preview on the stay sheet or in the market, and the Hard Winter card turns <em>after</em> the market has taken the silver. Two players lost their whole crew to it in 797; the casual player said "I felt tricked."`,
    shots: [['casual-phone', 'tools/playtest/llm/out/casual-phone/shots/040-card-hardWinter.png', 'Winter 796, Jen: the bill doubles, after the market, with 16 silver left.'], ['mobile-strategist', 'tools/playtest/llm/out/mobile-strategist/shots/056-winter.png', 'Autumn 797, Priya: "The hall could not feed everyone. 36 men left."']] },
  { title: 'Year seven: nothing to fear, nothing to want', ids: ['loop-repeats', 'no-danger', 'no-score-or-goal', 'silver-has-no-sink', 'named-men-bottleneck', 'fork-names-ignore-deeds'], sev: 'major',
    text: `Every player who survived 799 described the same mid-game: every coast "sure · clean", a one-round rout, 300 to 700 silver with nothing to buy but men no one can lead, and no new named man for a decade. Goal was the lowest-rated category on the panel (${mean('goal').toFixed(1)} of 5). The only countdown anyone found was "three summers held and he kneels", and five of them praised it. The man card's gift, the one silver sink, was discovered by two players in year nineteen.`,
    shots: [['roleplayer', 'tools/playtest/llm/out/roleplayer/shots/189-picker.png', 'The picker in 809, Dana: a column of sure things, best on top.'], ['action-gamer', 'tools/playtest/llm/out/action-gamer/shots/078-fight-reckoning.png', 'A late rout, Marcus: the grid rescales, so a ship of 400 looks like a ship of 150.']] },
  { title: 'The map is mood, not a tool', ids: ['map-readability', 'map-tap-targets', 'map-realm-unpainted', 'persistent-destination'], sev: 'major',
    text: `Praised by all eight for being the real North Sea, and used by almost none of them to choose: "rich ones are bigger dots" cannot be read, labels pile into the Channel by 805, a king's name sits on his coast's dot so the tap opens his card, and the player's own coasts never paint while a broken king keeps his wash. The map-painter, who came for exactly this, rated it 2.`,
    shots: [['roleplayer', 'tools/playtest/llm/out/roleplayer/shots/238-spring-map.png', 'Spring 813, Dana: labels over the Channel; Ælla on the Humber dot.']] },
];

// ---- suggested decisions for TODO 41 (the Director's call) ----
// TODO 41A: the UI or the copy saying what the rules already do, or a plain bug. No rule changes, no new nouns. In build order.
const FIX = [
  ['The guard, visible where the choice is made', 'The hall row and the commit sheet carry "Guard 24 · a strange sail finds the hall held / thin", the King counted when he is home; the rival card shows Guard vs Fleet as a roll like the battle does, and names what made the guard ("no named man stayed home").'],
  ['The line\'s rule, said out loud', 'The intro and the children list say "if the King dies before a son is sixteen, the line ends." The regency itself is a decision, below.'],
  ['Bought men follow the ship', 'Men bought in the market fill the named men at once; Everyone aboard stays set year to year; "+" on a jarl with no free men says why; Fill is one button for the whole ship.'],
  ['One sentence before the sums, one odds vocabulary', '"Bjorn needs 12 more men by spring to hold it", with the arithmetic under it; odds read the same everywhere (the percent, then the word); "sure · fair" says what fair is.'],
  ['The big moments get the card', 'An uprising, a hall that fell, a king who kneels or takes a coast back, a named man dead, a son of age: each turns on the winter night in the card\'s frame, with its numbers.'],
  ['The bill beside the profit', 'The picker, the commit sheet, the stay sheet and the market show "next autumn\'s bill ~72 · chest after winter ~18 · men will leave" where it applies. Profit keeps its definition.'],
  ['Map hit areas', 'A king\'s name label must not cover his coast\'s dot; the dot wins the tap.'],
  ['Small bugs', 'The list below, plus writing variants for the birth card, the quiet winter, the Wanderer, the verdict, and the famous places; and a reload step in the smoke test.'],
];
// TODO 41B: the Director's calls, worst first, each with a recommendation.
const DECISIONS = [
  ['A regency', 'No son can be sixteen before 809, so every early death ends the dynasty; three of eight ended in year six. Recommend: when the King dies with a son under sixteen and a loyal-or-better jarl or an in-law at home, that man holds the hall until the boy is sixteen, then the Oath runs for the boy. Flag: a new noun, one new card, the Oath deferred.'],
  ['Something to want in year seven', 'Every survivor described the same mid-game. Candidates, cheapest first: surface the man card\'s gift (it exists; two players found it in year 19); rings and dowries as stance verbs; a champion offered after a rout; coasts that arm faster against a big ship; a second ship as a Sea-king title. Recommend: the gift surfaced, one silver sink that fits the title, then measure with the persona harness.'],
  ['Profit less the bill?', 'Keep profit as loot less men, with the bill shown beside it, or redefine it to subtract the hall\'s bill and the forfeited hall-pay. Recommend: keep the definition and show the bill; redefining makes a sure raid read negative every lean year.'],
  ['The Hard Winter card before the market', 'Today the market comes first and the bill doubles after the silver is spent. Recommend: turn the card first; the ledger is the summer\'s account, the card the winter\'s news, the market the player\'s answer to both.'],
  ['Paint the player\'s coasts', 'Held coasts get a wash in the player\'s colour; a broken king\'s wash fades or turns. Recommend: yes, with pinch-zoom (TODO 15) in the same session.'],
  ['Named men on demand', 'Expansion is capped by named men who come on their own clock. Recommend: not a market line; a champion offered on the reckoning after a rout, once per reign-decade; tune the bench cap with the harness.'],
  ['Period and tone', 'Ælla in 796, men bought by the head, Lindisfarne as a fortress. Recommend: names from the right half-century per anchor, the market renamed, monasteries with their own line and weak walls that recover slowly; the rule stays.'],
];
const SMALL_BUGS = ['The rumor\'s 20 silver is missing from the autumn ledger, so the sum is off by 20 (three players did the arithmetic).', 'Two "Rent · Birka" lines in one autumn when a king took the coast back.', '"1 men", stray spaces before commas on ruler cards ("Birka (his seat) , Gotland ."), the "Hall · 1" badge that never clears.', '"His realm: 0 of 1 coasts held" on a two-coast realm; "Hordaland lies open to be held" when it is a fight.', 'Tapping a king\'s card on the setup screen starts the game at once; the custom-king steppers reset between taps, so a custom build could not be made.', 'The end card says "No son, no son-in-law" when there is a son of four; the coronation card reads "Same screen. Smaller kingdom." to a new king.', 'After a succession every jarl showed "Kin" (one player); the Saga shows a modern ISO date ("the seas of 2026-10-25").', 'Spring reopens on last year\'s target even when it is now "hopeless", and names the coast aimed at, not the one reached.'];

// ---- ratings heatmap ----
const heat = `<div class="tablewrap"><table class="heat"><thead><tr><th>player</th>${CATS.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${NAMES.map(n => `<tr><th><span class="nm">${esc(handle(n))}</span><small>${esc(n)}${AG[n].genre === 'out' ? ' · outside' : ''}</small></th>${CATS.map(c => { const v = R[n][c]; return `<td class="v${v == null ? '' : Math.round(v)}">${v == null ? '—' : v}</td>`; }).join('')}</tr>`).join('')}<tr class="mean"><th>panel mean</th>${CATS.map(c => `<td>${mean(c).toFixed(1)}</td>`).join('')}</tr></tbody></table></div>`;

// ---- each persona's review, collapsed ----
const reviewBlock = n => { const a = AG[n], md = a.review || '', sec = h => { const m = md.match(new RegExp(`##\\s*\\d\\.\\s*${h}[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s|$)`)); return m ? m[1].trim() : ''; };
  const md2html = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<em>$1</em>').split(/\n{2,}/).map(p => /^(\d+\.|-)\s/m.test(p) ? `<ul>${p.split('\n').map(l => `<li>${l.replace(/^(\d+\.|-)\s*/, '')}</li>`).join('')}</ul>` : `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  const end = a.end ? `${a.end.year} · ${a.end.king}, generation ${a.end.gen} · ${a.end.holdings} holdings · ${a.end.silver} silver · ${a.end.men} men` : '';
  return `<details class="review"><summary><span class="nm">${esc(a.handle)}</span><span class="role">${esc(n)}${a.genre === 'out' ? ' · outside the genre' : ''}</span><span class="ov">overall ${R[n].overall ?? '—'}</span></summary><div class="body"><p class="end">${esc(end)} · ${a.calls} calls · ${a.notes.length} notes</p><h4>Verdict</h4>${md2html(sec('Verdict'))}<h4>Fix these first</h4>${md2html(sec('Fix these first'))}<h4>Keep these</h4>${md2html(sec('Keep these'))}<h4>Tomorrow?</h4>${md2html(sec('Tomorrow\\?'))}</div></details>`; };

const html = `<title>Eight Players, Twenty Summers</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Hanken+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
/* Layout: one column of prose at 68ch with full-width bands for the findings and the heatmap; the game's own Forge tokens (dark first), a parchment mirror for light. */
:root{--bg:#2B2E33;--surface:#353A40;--raised:#3D434A;--rule:#4A4F55;--text:#E8DFCC;--muted:#C9A58E;--iron:#8A9096;--primary:#5A95A6;--fjord:#214C58;--pine:#8FA793;--chestnut:#A47159;--oxblood:#B07A7C;--gold:#C9A58E;
  --display:"Fraunces","Iowan Old Style",Georgia,serif;--body:"Hanken Grotesk",system-ui,sans-serif;--mono:"JetBrains Mono",ui-monospace,Menlo,monospace;--r:3px;color-scheme:dark}
@media (prefers-color-scheme: light){:root:not([data-theme="dark"]){--bg:#F1ECE2;--surface:#FBF8F1;--raised:#FFFFFF;--rule:#D8CEBE;--text:#2B2E33;--muted:#6B5546;--iron:#7A7F85;--primary:#2F6F80;--fjord:#D6E6EA;--pine:#4F7A58;--chestnut:#A05A3A;--oxblood:#8E3B3F;--gold:#8A6A4C;color-scheme:light}}
:root[data-theme="light"]{--bg:#F1ECE2;--surface:#FBF8F1;--raised:#FFFFFF;--rule:#D8CEBE;--text:#2B2E33;--muted:#6B5546;--iron:#7A7F85;--primary:#2F6F80;--fjord:#D6E6EA;--pine:#4F7A58;--chestnut:#A05A3A;--oxblood:#8E3B3F;--gold:#8A6A4C;color-scheme:light}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:400 16px/1.55 var(--body);padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:0 48px}
.wrap{max-width:68ch;margin:0 auto}.wide{max-width:980px;margin:0 auto}
h1,h2,h3,h4{font-family:var(--display);font-weight:600;line-height:1.15;text-wrap:balance;margin:0}
h1{font-size:clamp(34px,7vw,52px);letter-spacing:-.01em}h2{font-size:26px;margin-top:56px;padding-top:18px;border-top:1px solid var(--rule)}h3{font-size:20px}h4{font-size:15px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-family:var(--body);font-weight:600;margin:18px 0 6px}
p{margin:10px 0}em{color:var(--muted);font-style:normal;font-weight:500}a{color:var(--primary)}
.eyebrow{font:500 12px/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:40px 0 14px}
.lede{font-size:18px;line-height:1.5;margin-top:16px}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:22px 0 8px}
.tile{background:var(--surface);border:1px solid var(--rule);border-radius:var(--r);padding:12px 14px}.tile b{display:block;font:600 28px/1 var(--display);font-variant-numeric:tabular-nums}.tile span{font-size:12.5px;color:var(--muted)}
.tile.bad b{color:var(--oxblood)}.tile.good b{color:var(--pine)}
.callout{border-left:3px solid var(--primary);background:var(--surface);padding:12px 16px;border-radius:0 var(--r) var(--r) 0;margin:18px 0}.callout.fixed{border-color:var(--pine)}.callout h3{font-size:17px;margin-bottom:6px}
.icon{width:1em;height:1em;flex-shrink:0;vertical-align:-.15em}
.finding{background:var(--surface);border:1px solid var(--rule);border-radius:var(--r);padding:18px 18px 10px;margin:18px 0;display:grid;grid-template-columns:1fr;gap:14px}
@media (min-width:760px){.finding{grid-template-columns:1fr 300px}.finding.two{grid-template-columns:1fr 1fr}.finding.two .shots{grid-column:2}}
.finding .shots{display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap}
figure{margin:0;flex:1 1 140px;max-width:220px}figure img{width:100%;height:auto;border:1px solid var(--rule);border-radius:var(--r);display:block}figcaption{font:400 11.5px/1.35 var(--mono);color:var(--muted);margin-top:6px}
.finding h3{display:flex;gap:10px;align-items:flex-start}.finding .n{font:500 13px/1.3 var(--mono);color:var(--muted);margin-top:4px}
.sev{display:inline-flex;align-items:center;gap:.35em;font:500 11.5px/1 var(--mono);letter-spacing:.02em;padding:4px 7px;border-radius:var(--r);border:1px solid var(--rule);color:var(--muted);white-space:nowrap}
.sev.blocker{color:var(--oxblood);border-color:var(--oxblood)}.sev.major{color:var(--chestnut);border-color:var(--chestnut)}.sev.praise{color:var(--pine);border-color:var(--pine)}.sev.bug{color:var(--primary);border-color:var(--primary)}
.who{font:400 12px/1.2 var(--mono);color:var(--muted);white-space:nowrap;margin-left:auto}
details.cl{border-bottom:1px solid var(--rule)}details.cl summary{display:flex;align-items:center;gap:10px;padding:10px 4px;cursor:pointer;list-style:none;flex-wrap:wrap}details.cl summary::-webkit-details-marker{display:none}details.cl summary .t{flex:1 1 60%;min-width:0;font-size:15px}details.cl .body{padding:0 4px 14px}
.quotes{list-style:none;margin:6px 0;padding:0;display:grid;gap:10px}.quotes li{background:var(--raised);border-radius:var(--r);padding:10px 12px;font-size:14.5px}.quotes .q{display:block}.quotes .src{display:block;font:400 11.5px/1.3 var(--mono);color:var(--muted);margin-top:6px}
.meta{font:400 11.5px/1.4 var(--mono);color:var(--iron);margin-top:8px}
.finding .quotes{grid-column:1 / -1}
.tablewrap{overflow-x:auto;margin:16px 0}
table.heat{border-collapse:separate;border-spacing:3px;font-variant-numeric:tabular-nums;font-size:13px;min-width:720px}table.heat th{font:500 11.5px/1.2 var(--mono);color:var(--muted);text-align:left;padding:4px 6px;vertical-align:bottom}table.heat thead th{writing-mode:vertical-rl;transform:rotate(180deg);text-align:left;padding:6px 2px}table.heat thead th:first-child{writing-mode:horizontal-tb;transform:none}
table.heat tbody th .nm{display:block;font:600 14px/1.2 var(--display);color:var(--text)}table.heat tbody th small{display:block;font:400 10.5px/1.2 var(--mono);color:var(--iron)}
table.heat td{text-align:center;padding:9px 0;min-width:44px;border-radius:var(--r);background:var(--surface);color:var(--text)}
table.heat td.v1{background:color-mix(in oklab,var(--oxblood) 55%,var(--surface))}table.heat td.v2{background:color-mix(in oklab,var(--chestnut) 45%,var(--surface))}table.heat td.v3{background:var(--raised)}table.heat td.v4{background:color-mix(in oklab,var(--primary) 35%,var(--surface))}table.heat td.v5{background:color-mix(in oklab,var(--primary) 70%,var(--surface))}
table.heat tr.mean td{background:transparent;border-top:1px solid var(--rule);border-radius:0;font-weight:600}
.legend{font:400 12px/1.4 var(--mono);color:var(--muted)}
ol.dec{padding-left:1.2em}ol.dec li{margin:10px 0}ol.dec b{font-family:var(--display);font-size:17px;font-weight:600;display:block}
ul.small{padding-left:1.1em;font-size:14.5px}ul.small li{margin:5px 0}
details.review{border:1px solid var(--rule);border-radius:var(--r);background:var(--surface);margin:10px 0}details.review summary{display:flex;align-items:baseline;gap:12px;padding:12px 14px;cursor:pointer;list-style:none;flex-wrap:wrap}details.review summary::-webkit-details-marker{display:none}details.review .nm{font:600 18px/1.2 var(--display)}details.review .role{font:400 12px/1.3 var(--mono);color:var(--muted)}details.review .ov{margin-left:auto;font:500 12px/1 var(--mono);color:var(--primary)}details.review .body{padding:0 14px 14px;font-size:15px}details.review .body ul{padding-left:1.1em}details.review .end{font:400 12px/1.4 var(--mono);color:var(--muted)}
.kit{font-size:14.5px}.kit code{font-family:var(--mono);font-size:12.5px;background:var(--raised);padding:1px 5px;border-radius:var(--r)}
footer{margin-top:56px;padding-top:16px;border-top:1px solid var(--rule);font:400 12px/1.5 var(--mono);color:var(--iron)}
@media (prefers-reduced-motion:no-preference){details .body{animation:in .25s ease}}@keyframes in{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}
summary:focus-visible{outline:2px solid var(--primary);outline-offset:2px}
</style>
${sprite}
<main>
<div class="wrap">
<p class="eyebrow">Ring Giver · playtest round 1 · 24 October 2026</p>
<h1>Eight Players, Twenty Summers</h1>
<p class="lede">Eight Opus agents, each with a persona (six grand-strategy players, two from outside the genre), played Ring Giver on a 390 × 844 phone through the real screens for twenty game-years or until the line broke, logging what they felt as they went. The panel agrees: the numbers are honest, the ledger and the Plunder-or-stay sheet are the best screens, and the people are the reason to come back. It also agrees on what hurts. One winter card killed three dynasties in year six with no number on it; bought men never got on the boat; the big moments happen in grey ledger lines; and from year seven there is nothing to fear and nothing to buy.</p>
<div class="tiles">
<div class="tile"><b>8</b><span>players · 6 in-genre, 2 outside</span></div>
<div class="tile"><b>${calls.toLocaleString()}</b><span>screens driven by real taps</span></div>
<div class="tile"><b>${notes}</b><span>notes, stamped with year and screen</span></div>
<div class="tile bad"><b>${broke.length} of 8</b><span>lines broken in 799, winter raid</span></div>
<div class="tile"><b>${mean('overall').toFixed(1)}</b><span>panel mean, overall, of 5</span></div>
<div class="tile bad"><b>${mean('goal').toFixed(1)}</b><span>lowest category: goal</span></div>
</div>
<div class="callout fixed"><h3>${ico('check')} Two bugs found before anyone played, both fixed</h3><p>Driving the real screens by touch turned up two things the headless harnesses never could. <b>Coasts could not be tapped on the map:</b> the chip strip over the water covered the whole chart and took every touch (one line of CSS; service worker bumped to v11). <b>The King froze after any reload:</b> the save holds him twice and loading parted the copies, so after closing the app his age, stats, place and death roll stopped moving; <code>migrate</code> re-links him. Both are in the working tree, not yet committed.</p></div>
</div>

<div class="wide">
<p class="eyebrow">What the panel hit</p>
${FINDINGS.map((f, i) => { const cs = f.ids.map(by).filter(Boolean), agents = new Set(cs.flatMap(c => c.agents)), out = new Set(cs.flatMap(c => c.agents.filter(a => AG[a].genre === 'out'))), n = cs.reduce((a, c) => a + c.noteCount, 0);
  const qs = cs.flatMap(c => c.quotes).filter((q, j, arr) => arr.findIndex(x => x.text === q.text) === j).sort((a, b) => (a.shot ? 0 : 1) - (b.shot ? 0 : 1)).slice(0, 3);
  return `<section class="finding${f.shots.length > 1 ? ' two' : ''}"><div><h3>${chip(f.sev)}<span>${esc(f.title)}</span></h3><div class="n">${agents.size} of 8 players${out.size ? ` (${out.size} outside the genre)` : ''} · ${n} notes</div><p>${f.text}</p></div><div class="shots">${f.shots.map(s => fig(s[1], s[2])).join('')}</div>${quoteList(qs, 3)}</section>`; }).join('')}
</div>

<div class="wrap">
<h2>Fix and build first</h2>
<p>TODO 41A. No decision needed: each is the UI or the copy saying what the rules already do, or a plain bug. In build order.</p>
<ol class="dec">${FIX.map(([t, d]) => `<li><b>${esc(t)}</b>${esc(d)}</li>`).join('')}</ol>
<h4>Small bugs and slips the panel found</h4>
<ul class="small">${SMALL_BUGS.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
<h2>Then decide</h2>
<p>TODO 41B. Worst first, each with a recommendation; the calls are yours.</p>
<ol class="dec">${DECISIONS.map(([t, d]) => `<li><b>${esc(t)}</b>${esc(d)}</li>`).join('')}</ol>
</div>

<div class="wide">
<h2>Ratings</h2>
<p class="legend">1 to 5 as each player gave them in their review. Red is 1, rust 2, flat 3, teal 4 and 5. Decisions and writing carry the game; goal, feedback and clarity do not.</p>
${heat}
</div>

<div class="wrap">
<h2>Every issue</h2>
<p>${C.issues.length} issues clustered from ${notes - C.unclustered} notes, most players first. Open one for the quotes.</p>
${C.issues.map(clusterCard).join('')}
<h2>Keep these</h2>
<p>What landed, by how many players said so.</p>
${C.delights.map(clusterCard).join('')}
<h2>What they asked for</h2>
${C.wishlist.map(x => `<details class="cl wishlist"><summary>${ico('lightbulb')}<span class="t">${esc(x.title)}</span>${who(x)}</summary><div class="body">${quoteList(x.quotes, 3)}</div></details>`).join('')}
<h2>The eight reviews</h2>
${NAMES.map(reviewBlock).join('')}
<h2>How this was run</h2>
<div class="kit">
<p>A Node driver (<code>tools/playtest/llm/drive.js</code>) plays the real game through Playwright and Chrome at iPhone size, one command per call: it loads the agent's saved game, taps a real element, screenshots, prints the screen as text with numbered tappables, and saves the game back. <code>go</code> runs through screens with one way forward and stops at every decision. Notes ride on any call and are stamped with the screen that was showing. Each playtester was a Claude Opus 5.5 subagent given <code>brief.md</code> and one of the eight <code>personas/*.md</code>, forbidden from reading the game's source or docs. The runs took 16 to 38 minutes each, in parallel, about 1.3 million tokens across the panel. <code>collect.js</code> gathers the notes; a Sonnet pass clustered them (<code>out/clusters.json</code>); this page is built by <code>report.js</code>.</p>
<p>What to keep in mind: the world is seeded by the date, so all eight played the same seas and met the same 799 sail. The agents cannot feel timing; they judged the battle from two stills. They are good at legibility, clarity, missing information and dead ends, and at saying what a given kind of player would say; they are not a substitute for watching a person's thumbs. A second round should start two players from a saved year-850 game.</p>
</div>
<footer>Ring Giver · tools/playtest/llm · round 1 · ${new Date().toISOString().slice(0, 10)}</footer>
</div>
</main>`;
fs.mkdirSync(path.dirname(DEST), { recursive: true });
fs.writeFileSync(DEST, html);
console.log(`wrote ${path.relative(ROOT, DEST)} (${(fs.statSync(DEST).size / 1024).toFixed(0)} KB)`);
