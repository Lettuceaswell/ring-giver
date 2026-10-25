#!/usr/bin/env node
// The phone driver for the LLM playtesters: plays the real Ring Giver UI through Playwright at iPhone size, one command per call.
// Each call loads the agent's saved game, acts by tapping a real element, screenshots, prints a compact text view of the screen with numbered
// tappables, and saves the game back. Nothing in the game is edited or called; the page's own onclicks do the work. Notes ride on any call.
//
// Usage: node tools/playtest/llm/drive.js <agent> <command> [args] [--note "category|severity|text"]... [--hd] [--until YEAR]
//   start            a fresh dynasty: the setup screen (tap a king there)
//   look             the screen as it is, no action
//   tap <n>          tap the numbered tappable
//   scroll <px>      scroll the open sheet (or the pane) by px (negative scrolls up)
//   go               advance through every screen that offers only one way forward; stops at the next decision (or in spring)
//   note             log notes only
// Every command accepts --note (repeatable); a note is stamped with the screen that was showing BEFORE the action (the one you were looking at).
// Files: tools/playtest/llm/out/<agent>/{save.json,ui.json,meta.json,steps.log,notes.jsonl,shots/NNN-<kind>.png}
'use strict';
const fs = require('fs'), path = require('path');
const { chromium, devices } = require('playwright-core');
const ROOT = path.join(__dirname, '..', '..', '..'), OUTROOT = path.join(__dirname, 'out');

// ---- arguments -------------------------------------------------------------------------------
const argv = process.argv.slice(2), notes = [], flags = {}, pos = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--note') notes.push(argv[++i]);
  else if (a.startsWith('--note=')) notes.push(a.slice(7));
  else if (a.startsWith('--')) { const k = a.slice(2); if (['until', 'from'].includes(k)) flags[k] = argv[++i]; else flags[k] = true; }
  else pos.push(a);
}
const [agent, cmd = 'look', arg] = pos;
if (!agent || !/^[\w-]+$/.test(agent)) die('usage: drive.js <agent> <start|look|tap n|scroll px|go|note> [--note "cat|sev|text"] [--hd] [--until YEAR]');
const OUT = path.join(OUTROOT, agent), SHOTS = path.join(OUT, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
const J = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8')); } catch (e) { return d; } };
const W = (f, v) => fs.writeFileSync(path.join(OUT, f), typeof v === 'string' ? v : JSON.stringify(v));
let meta = J('meta.json', { step: 0, seen: {}, until: 813 });
if (flags.until) meta.until = +flags.until;
const UNTIL = meta.until;
function die(m) { console.error(m); process.exit(2); }

// kinds of screen that are the player's to decide; `go` stops at them
const DECISIONS = new Set(['arrive', 'fight', 'stay', 'winter', 'fork', 'heir', 'oath', 'end', 'setup']);
const MIME = { html: 'text/html', js: 'text/javascript', json: 'application/json', woff2: 'font/woff2', svg: 'image/svg+xml', png: 'image/png', css: 'text/css' };

(async () => {
  if (cmd === 'start') { for (const f of ['save.json', 'ui.json']) try { fs.unlinkSync(path.join(OUT, f)); } catch (e) {} meta = { step: 0, seen: {}, until: UNTIL };
    if (flags.from) W('save.json', fs.readFileSync(path.resolve(flags.from), 'utf8')); } // --from <save.json>: begin from a saved game (a late-game tester)
  const save = J('save.json', null), ui = J('ui.json', null), prev = { year: meta.year, phase: meta.phase, kind: meta.kind, shot: meta.shot, step: meta.step };

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const dev = devices['iPhone 14'] || { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1' };
  // a phone's full screen (the game runs standalone, no browser chrome): 390 x 844
  const ctx = await browser.newContext({ ...dev, viewport: { width: 390, height: 844 }, deviceScaleFactor: flags.hd ? 2 : 1, serviceWorkers: 'block', reducedMotion: 'no-preference', colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message || e).split('\n')[0]));
  // the game is served from the repo root, no server: every request for ringgiver.test/<file> is answered from disk
  await page.route('**/*', async route => {
    const u = new URL(route.request().url()); let p = decodeURIComponent(u.pathname); if (p === '/' || p === '') p = '/index.html';
    const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({ status: 404, body: 'not found' });
    route.fulfill({ status: 200, contentType: MIME[path.extname(f).slice(1)] || 'application/octet-stream', body: fs.readFileSync(f) });
  });
  // the save goes into localStorage before the game's scripts run, as if the phone had it
  await page.addInitScript(({ save, sagas, setup }) => { localStorage.clear(); if (save) localStorage.setItem('seaking', save); if (sagas) localStorage.setItem('seaking-sagas', sagas); if (setup) localStorage.setItem('seaking-setup', setup); }, { save: save ? JSON.stringify(save) : null, sagas: J('sagas.json', null) ? JSON.stringify(J('sagas.json', null)) : null, setup: J('setup.json', null) ? JSON.stringify(J('setup.json', null)) : null });
  await page.goto('http://ringgiver.test/index.html');
  await page.waitForSelector('#app > *');
  // screen state that is not game state (which pane, the open sheet, a half-made choice) comes back as it was
  if (ui && save) await page.evaluate(u => { Object.assign(UI, u); UI.fightT = []; render(); }, ui);
  await page.waitForTimeout(400);

  const passed = []; // screens `go` went through
  const snap = () => page.evaluate(() => {
    const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
    // the screen as text: block elements on their own line, inline runs spaced apart (innerText glues "-5" to "55"), hidden things skipped
    const BLOCK = /^(DIV|P|H[1-6]|LI|UL|OL|BUTTON|SECTION|NAV|TABLE|TR|HR|text|svg)$/;
    const walk = el => { let out = ''; for (const n of el.childNodes) { if (n.nodeType === 3) out += n.nodeValue; else if (n.nodeType === 1) { if (n.tagName === 'BR') { out += '\n'; continue; } const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || n.tagName === 'STYLE' || n.tagName === 'SCRIPT') continue; const inner = walk(n); if (!inner.trim()) continue; out += BLOCK.test(n.tagName) || /block|flex|grid|list-item|table/.test(cs.display) ? '\n' + inner + '\n' : ' ' + inner + ' '; } } return out; };
    const txt = el => (el ? walk(el) : '').split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
    const overlay = document.querySelector('.overlay');
    const q = typeof S !== 'undefined' && S ? S.queue[0] : null;
    let kind;
    if (!S) kind = 'setup';
    else if (q) { kind = q.t; if (q.t === 'event') kind = 'card-' + (q.ev || 'event'); if (q.t === 'fight' && q.phases) kind = document.querySelector('.bcard.done') ? 'fight-reckoning' : 'fight'; }
    else if (UI.man) kind = S.rulers && S.rulers[UI.man] ? 'ruler-card' : 'man-card';
    else if (UI.saga) kind = 'saga'; else if (UI.picker) kind = 'picker';
    else kind = (S.phase === 'spring' ? 'spring-' : '') + UI.pane;
    const scope = overlay || document.body;
    const els = [...scope.querySelectorAll('[onclick]')].filter(el => vis(el) && !el.classList.contains('overlay') && !el.classList.contains('stage') && !(el.closest('.overlay') && !overlay));
    const taps = els.map((el, i) => {
      el.setAttribute('data-llm', i + 1);
      const oc = el.getAttribute('onclick') || '', dis = el.disabled || el.getAttribute('disabled') !== null;
      let label = txt(el).replace(/\n/g, ' · ');
      let what = el.tagName === 'BUTTON' ? '' : el.classList.contains('prow') ? 'row' : el.classList.contains('pick') ? 'choice' : el.classList.contains('chip') ? 'chip' : el.classList.contains('top') ? 'the band' : el.classList.contains('card') || el.classList.contains('row') ? 'card' : '';
      if (el.tagName.toLowerCase() === 'g') { const m = oc.match(/'([^']+)'/); const id = m && m[1];
        if (el.classList.contains('c')) { const x = id && S.shores[id]; const own = x && Object.values(S.rulers).find(k => k.coasts.includes(id)); label = `coast · ${x ? x.name : id}${own && own.known ? ` (${own.name}'s)` : ''}${S.destination === id ? ' · chosen' : ''}`; what = 'map dot'; }
        else if (el.classList.contains('kname')) { const k = id && S.rulers[id]; label = `king · ${k ? k.name : id}`; what = 'name on the map'; } }
      if (el.classList.contains('flip')) { label = 'the card (face down: tap to turn)'; what = ''; }
      if (/^[−+]$/.test(label)) { const m = oc.match(/setBuy\((-?\d+)\)/), b = oc.match(/bump\('(\w)',(-?\d+)\)/), am = oc.match(/addMen\(S,'(\w+)',(-?\d+)\)/), stat = { c: 'Combat', r: 'Rule', f: 'Followability' };
        label = m ? `${label} ${Math.abs(+m[1])} ${+m[1] > 0 ? 'more' : 'fewer'} men to buy` : b ? `${label} one ${stat[b[1]] || b[1]}` : am ? `${label} ${Math.abs(+am[2])} men ${+am[2] > 0 ? 'to' : 'from'} ${(S.notables.find(x => x.id === am[1]) || {}).name || am[1]}` : label; what = 'stepper'; }
      // a short button inside a man's card (Ship, Home, Fill, a holding's name) is named after the man
      if (el.tagName === 'BUTTON' && label.length < 18 && !what) { const card = el.closest('.card'), nm = card && card.querySelector('.name'); if (nm && !card.hasAttribute('onclick')) label = `${txt(nm).split('\n')[0]}: ${label}`; }
      if (el.classList.contains('top')) label = txt(el).replace(/\n/g, ' · ') + ' — opens the Saga';
      const r = el.getBoundingClientRect(), below = r.top >= innerHeight, above = r.bottom <= 0;
      return { n: i + 1, label: (label || oc.slice(0, 40)).slice(0, 110), what, dis, below, above };
    });
    const band = txt(document.querySelector('.top')).replace(/\n/g, ' · ');
    const screen = overlay ? txt(overlay) : !S ? txt(document.querySelector('#app')) : [txt(document.querySelector('.pane')), txt(document.querySelector('.free')), txt(document.querySelector('.foot'))].filter(Boolean).join('\n');
    const yr = S ? S.year : null, phase = S ? S.phase : null;
    const over = S && S.phase === 'spring' && !S.queue.length && S.year >= __UNTIL;
    const scroller = document.querySelector('.scene, .stage, .pane:not(.map)');
    return { kind, band, screen, taps, yr, phase, over, canScroll: scroller ? scroller.scrollHeight - scroller.clientHeight : 0 };
  }).then(r => r, async e => { // __UNTIL is defined below; a page that threw gets reported, not swallowed
    throw e; });
  await page.evaluate(u => { window.__UNTIL = u; }, UNTIL);

  // the battle plays on its own clock: catch it part way, then wait for the verdict and the reckoning
  const waitBattle = async () => {
    if (!await page.$('.overlay.battle .bcard:not(.done)')) return;
    await page.waitForTimeout(1200);
    const mid = path.join(SHOTS, `${String(meta.step + 1).padStart(3, '0')}-fight-mid.png`); await page.screenshot({ path: mid }); passed.push({ kind: 'the battle, part way (the ranks, the day\'s roll)', shot: mid, text: '' });
    await page.waitForSelector('.overlay.battle .bcard.done', { timeout: 40000 }).catch(() => {});
    await page.waitForTimeout(600);
  };
  const settle = async () => {
    await page.waitForTimeout(1300);
    if (await page.$('.shipdot')) await page.waitForTimeout(1000); // the ship departs along the route before the summer's sheet rises
    await waitBattle();
  };
  const tapN = async n => {
    const ok = await page.evaluate(n => { const el = document.querySelector(`[data-llm="${n}"]`); if (!el) return 'no such tappable'; if (el.disabled) return 'that button is disabled';
      el.scrollIntoView({ block: 'center' }); return 'ok'; }, n);
    if (ok !== 'ok') return ok;
    await page.waitForTimeout(150);
    // a map group is tapped on its dot (the hit circle), not on the king's label rect that now precedes it in the markup (TODO 41A.7)
    const pt = await page.evaluate(n => { const el = document.querySelector(`[data-llm="${n}"]`); const t = el.tagName.toLowerCase() === 'g' ? (el.querySelector('circle.hit') || el.querySelector('circle.coast') || el.querySelector('rect') || el) : el; const r = t.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, n);
    if (flags.debug) console.error('tap at', pt, await page.evaluate(p => { const e = document.elementFromPoint(p.x, p.y); return e ? e.tagName + '.' + e.getAttribute('class') : null; }, pt));
    await page.touchscreen.tap(pt.x, pt.y);
    return 'ok';
  };
  const forwardButton = () => page.evaluate(() => { const o = document.querySelector('.overlay'); if (!o) return null;
    const b = [...o.querySelectorAll('.actions button, .cardfoot button, .exit button, .cardfoot .roll')].filter(x => !x.disabled);
    return b.length === 1 ? +b[0].getAttribute('data-llm') : null; });

  await waitBattle(); // a battle left playing (a reload lands on it) finishes before anything is read
  let s0 = await snap(); // the screen before the action: notes are stamped with it
  let msg = '';
  const over0 = s0.over;
  if (cmd === 'tap' || cmd === 'go' || cmd === 'scroll') {
    if (over0 && cmd !== 'scroll') msg = `${UNTIL} is here: the session is over. Write your review (look and note still work).`;
    else if (cmd === 'tap') {
      let n = +arg; if (!arg) die('tap needs a number or a label');
      if (!n) { const q = arg.toLowerCase(), hit = s0.taps.filter(t => t.label.toLowerCase().includes(q)); if (hit.length === 1) n = hit[0].n; else msg = hit.length ? `"${arg}" matches ${hit.length} tappables: ${hit.map(t => t.n).join(', ')}. Tap by number.` : `nothing on screen matches "${arg}"`; }
      if (n) { const r = await tapN(n); if (r !== 'ok') msg = r; else await settle(); } }
    else if (cmd === 'scroll') { await page.evaluate(px => { const s = document.querySelector('.scene, .stage, .pane:not(.map)'); if (s) s.scrollBy(0, px); }, +arg || 400); await page.waitForTimeout(300); }
    else if (cmd === 'go') {
      let s = s0, n = 0;
      if (!s.kind.startsWith('spring-') && !DECISIONS.has(s.kind) && !(s.kind.startsWith('card-') && s.taps.some(t => /Give her|Refuse/.test(t.label)))) {
        while (n++ < 40) {
          const fb = await forwardButton(); if (fb == null) break;
          const before = s; await tapN(fb); await settle(); s = await snap();
          const shot = path.join(SHOTS, `${String(meta.step + 1).padStart(3, '0')}-${n}-${s.kind}.png`);
          passed.push({ kind: before.kind, shot: null, text: before.screen, tapped: before.taps.find(t => t.n === fb)?.label });
          if (s.kind.startsWith('spring-') || DECISIONS.has(s.kind) || s.kind === 'end') break;
          if (s.kind.startsWith('card-') && s.taps.some(t => /Give her|Refuse/.test(t.label))) break; // a suitor asks
          await page.screenshot({ path: shot }); passed[passed.length - 1].shotNext = shot; passed[passed.length - 1].nextKind = s.kind;
        }
        if (n >= 40) msg = 'go stopped after 40 screens';
      } else msg = s.kind.startsWith('spring-') ? 'Spring is yours: tap a coast, the crew, then Sail. (go only runs through screens with one way on.)' : 'This screen is a decision: tap something.';
    }
  } else if (cmd === 'start' || cmd === 'look' || cmd === 'note') { /* nothing to do: the screen is printed */ }
  else die('unknown command ' + cmd);

  // ---- the screen after the action --------------------------------------------------------
  const s1 = await snap();
  meta.step++;
  const shot = path.join(SHOTS, `${String(meta.step).padStart(3, '0')}-${s1.kind}.png`);
  await page.screenshot({ path: shot });
  const rel = p => path.relative(ROOT, p);
  const isNew = !meta.seen[s1.kind]; meta.seen[s1.kind] = meta.step;
  // notes: stamped with the screen that was showing when the agent wrote them
  for (const nt of notes) {
    const [category, severity, ...rest] = nt.split('|'); const text = rest.join('|').trim();
    if (!text) { console.log('note skipped (want "category|severity|text"): ' + nt); continue; }
    fs.appendFileSync(path.join(OUT, 'notes.jsonl'), JSON.stringify({ agent, step: prev.step ?? 0, year: prev.year ?? s0.yr, phase: prev.phase ?? s0.phase, kind: prev.kind ?? s0.kind, shot: prev.shot ? rel(prev.shot) : null, category: category.trim(), severity: severity.trim(), text }) + '\n');
  }
  // persist
  const st = await page.evaluate(() => ({ save: localStorage.getItem('seaking'), sagas: localStorage.getItem('seaking-sagas'), setup: localStorage.getItem('seaking-setup'), ui: typeof UI === 'undefined' ? null : (({ fightT, ...rest }) => rest)(UI) }));
  if (st.save) W('save.json', st.save); else try { fs.unlinkSync(path.join(OUT, 'save.json')); } catch (e) {}
  if (st.sagas) W('sagas.json', st.sagas);
  if (st.setup) W('setup.json', st.setup); else try { fs.unlinkSync(path.join(OUT, 'setup.json')); } catch (e) {} // the setup screen's chosen king and custom steppers (TODO 41A.8) survive the reload, as on the phone
  if (st.ui) W('ui.json', st.ui);
  Object.assign(meta, { year: s1.yr, phase: s1.phase, kind: s1.kind, shot });
  W('meta.json', meta);
  fs.appendFileSync(path.join(OUT, 'steps.log'), [meta.step, s1.yr, s1.phase, s1.kind, cmd + (arg ? ' ' + arg : ''), rel(shot), notes.length].join('\t') + '\n');
  await browser.close();

  // ---- print ------------------------------------------------------------------------------
  const cap = (t, n) => t.length > n ? t.slice(0, n) + ` …[${t.length - n} more chars; scroll to see the rest]` : t;
  const out = [];
  if (msg) out.push('!! ' + msg);
  if (notes.length) out.push(`${notes.length} note${notes.length === 1 ? '' : 's'} logged (at ${prev.year ?? s0.yr} · ${prev.kind ?? s0.kind})`);
  for (const p of passed) {
    out.push(`── passed: ${p.kind}${p.tapped ? ` — tapped "${p.tapped}"` : ''}${p.shot ? ` · shot ${rel(p.shot)}` : ''}`);
    if (p.text) out.push(cap(p.text, 900));
    if (p.shotNext && p.nextKind && !meta.seen[p.nextKind]) { meta.seen[p.nextKind] = meta.step; out.push(`   NEW SCREEN "${p.nextKind}" went by — look at ${rel(p.shotNext)}`); }
    else if (p.shotNext && /death|coronation|ruler|card-/.test(p.nextKind || '')) out.push(`   shot of the ${p.nextKind} that went by: ${rel(p.shotNext)}`);
  }
  if (passed.length) W('meta.json', meta);
  out.push(`══ step ${meta.step} · ${s1.yr ?? '—'} ${s1.phase ?? ''} · screen: ${s1.kind}${isNew ? '  ← NEW SCREEN: look at the shot' : ''} · shot: ${rel(shot)}${errors.length ? `\n!! page errors: ${errors.join(' | ')}` : ''}`);
  if (s1.over) out.push(`!! ${UNTIL} reached. The session is over: write your review now.`);
  if (s1.band) out.push('[band] ' + s1.band);
  out.push('[screen]\n' + cap(s1.screen, 2200));
  if (s1.canScroll > 40) out.push(`(this sheet scrolls: ${s1.canScroll}px more below)`);
  const taps = s1.taps.filter(t => !t.above);
  out.push('[tap]\n' + (taps.length ? taps.map(t => ` ${String(t.n).padStart(2)}  ${t.label}${t.what ? ` — ${t.what}` : ''}${t.dis ? ' (disabled)' : ''}${t.below ? ' ↓ below the fold' : ''}`).join('\n') : ' (nothing to tap)'));
  console.log(out.join('\n'));
})().catch(e => { console.error('drive error: ' + (e.stack || e)); process.exit(1); });
