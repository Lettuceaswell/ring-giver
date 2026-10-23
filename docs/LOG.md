# Sea King — progress log

Newest first. Read this before touching anything.

## 2026-10-23 (session 3, playtest 1)

**Source:** Levi's first phone playtest, voice notes at `/mnt/g/Projects/transcribe/transcriptions/2026-10-23_ring-giver-playtest-notes.txt` (summary beside it in `summaries/`). The transcribe pipeline already ran scribe and Notion intake on it; this entry is the project side.

**What he reported, and what happened to each**

| # | Note | Outcome |
|---|---|---|
| 1 | Sailing with the King is always the right move; why is it a decision? | Design question → TODO 12 |
| 2 | Character cards do nothing but move. No children, marriages, diplomacy, neighbors. "Scratch the CK3 itch." | Design question → TODO 13. Marriage already existed but was hidden in a native select; now buttons on the daughter's card |
| 3 | Destination dropdown is a native Apple list; breaks theme; wants loot-sorted, columns aligned | **Built.** Native select gone. Themed sheet, richest first, name / loot / def in fixed columns, odds and holdable under the name, Sail blind as a dashed row at the foot |
| 4 | Double-tap glitch on + / − | **Fixed.** `touch-action: manipulation` everywhere. iOS was reading the second fast tap as a double-tap zoom |
| 5 | Landfall: show the map with the three coasts highlighted | **Built.** The Landfall sheet carries its own map, cropped to the three, each ringed and pulsing, the rest dimmed |
| 6 | Plunder or Stay: no idea what the holding pays, what unrest it starts at, or whether the jarl can hold it | **Built.** Card states pay per year, starting unrest, the rule in one sentence, then one pick per candidate jarl with C/R/F, men of cap, and a Holds-vs-Unrest bar in words |
| 7 | Vassal relationship / opinion system | Design question → TODO 13b |
| 8 | Likes the winter events; open to more | → TODO 16 |
| 9 | Moving the kingdom, development catching up | Design question → TODO 14 |
| 10 | A real map: pinch-zoom, tap holdings for detail, regions with bonuses, a target button so you don't scroll the list | **Partly built.** Tap any known coast on the map to set it as destination (the target button). Rest → TODO 15 |
| 11 | Dot sizing by loot | **Built.** Radius is tiered on loot once a coast is seen or rumored. Hollow dot = cannot hold |
| 12 | Map blends into the top band when scrolled | **Fixed.** Sea is one step deeper than the band (`--sea`), band has a hairline and a soft drop |
| 13 | Lindisfarne not holdable, found out on arrival | **Fixed as information.** "cannot hold" shows in the picker, the destination row, and as a hollow dot. Whether it *should* be holdable → TODO 17 |
| 14 | Quick "all unlanded men to the ship" | **Built.** "Everyone aboard": everyone at home boards, King first, each filled to his cap from the unled pool |
| 15 | Forgot a destination and pressed Sail | **Fixed.** With men aboard and no destination the big button reads "Choose a destination" and opens the picker; `sail()` refuses too. Empty ship reads "Stay home this year" |

**Code notes**
- `UI` in `ui.js` holds screen state that is not game state (the picker). Game state stays in `S`.
- `holdPay(sh)` and `stayUnrest(s, sh)` in `game.js` are the one source for what a Stay will cost; the card and the rule share them.
- `boardAll(s)`, `setDestination(s, id)` in `game.js`. `mapHTML(targets)` draws the Landfall crop when given the three ids.
- `statLine` tolerates a man with no age (walked jarls).
- SW cache name unchanged (`seaking-v2`): file list did not change, fetch is network-first.

**Verified:** headless, a scripted dynasty 793→1066 over 22 generations through the new flows, no errors (`smoke.js` lived in the job tmp dir, not committed). In Chrome at 390 px: main screen with destination set, the picker, Landfall with map, the Stay card. Not on the phone yet.

**Seen in testing, for tuning (TODO 11):** a new holding starts at unrest `baseDef / 1.5`. A jarl who just raided with 10 men and Rule 2 shows "Holds 20 vs Unrest 84 · hopeless". The first summer is free, but unless men go to him in spring it revolts the next. The card now says so honestly; the number may be too steep. Also: a walked jarl who kneels at Stay comes back with no men.

**Next**
1. Levi's calls on TODO 12–17. The CK3 list (13) wants its own session: walk CK3's systems one by one, keep / cut / reshape.
2. Pinch-zoom on the map and a tappable Man card are the two cheapest asks left from the notes.
3. Push and play again on the phone.

## 2026-10-23 (session 2, "Ring Giver")

**State:** playable, published, restyled to House Hansen. Live at https://lettuceaswell.github.io/ring-giver/ (GitHub Pages, master, root). Service worker is network-first, cache `seaking-v2`; bump `V` in `sw.js` whenever the cached file list changes.

**Done this session**
- Repo created and Pages enabled. First publish verified.
- Visual audit of all thirteen screens at phone width against the brand repo (`/mnt/g/Projects/modern-viking-brand`). Plan page: `docs/brand-plan.html`, published at https://claude.ai/artifact/RaG1LrMAdcpdiWEjZKp33u .
- Restyle shipped in one commit (`feeae59`):
  - Forge palette only, no light mode, no toggle (Levi's call). Tokens at the top of `index.html`, named by material, from `tokens/palette.json` in the brand repo.
  - Fraunces / Hanken Grotesk / JetBrains Mono, self-hosted in `fonts/` (latin variable woff2, 136 KB), cached by the SW.
  - Radius 2 px everywhere. Scenes are a bottom sheet (`.overlay` + `.scene`), fight bar animates, reduced-motion respected.
  - Map cropped to known coasts, capped at 42vh, unnamed coasts one step past the edge hinted in iron.
  - Odds in words (`oddsWords` in `game.js`): chance (sure / likely / even / long odds / hopeless) plus cost (clean / fair / bloody).
  - A holding taken this summer skips its land contest that summer (`h.taken === s.year` in `resolveLand`).
  - Mark: the silver twist arm ring, replica of `modern-viking-brand/approvals/portal/ref/danish-twist-bracelet.png`, built by `mark/ring.py` (run: `python3 mark/ring.py mark`, then `rsvg-convert` the icon SVGs to `icon-192.png` / `icon-512.png`, copy `mark/icon.svg` to `icon.svg`). Three cuts: full (ridges), small (no ridges, under 48 px), tiny (plain band, under 24 px).
  - Eight line icons in `ICONS` at the top of `ui.js`. Oath card uses the ring, fight card an axe-head curve.
  - "House Hansen" imprint once, on the setup screen.
  - Wool grain on the ground only (`body::before`).
- Decisions recorded and pushed in the brand repo's `docs/05-decisions-log.md` (2026-10-23 entry). The game is the brand's first app; it closed type, radius, icon-set and texture questions for apps.

**Verified:** fonts load, setup / main / Landfall / fight screens checked in Chrome at 375 px; headless dynasty 793→1066 over 24 generations, no errors.

**Not yet verified:** how it looks on Levi's actual phone; the Stay, market, event, fork, Saga, Heir, Oath and coronation cards after the restyle (same templates, not screenshotted); the ring at home-screen size in iOS.

**Next**
1. Levi plays one dynasty on the phone. Collect what feels wrong. TODO.md item 11: tune numbers only after that.
2. React to the ring. The fight icon (axe-head) is the weakest glyph; the ring's wire strand may want fewer, broader ridges.
3. Winter deck is still the first-pass list in `winterCard`; GDD §6 cap of ten cards holds.
4. Open mechanics questions from play so far: Stay with a raid-depleted jarl still loses the holding the *following* summer unless men are added in spring; the `rival` event hits the hall with everyone aboard (intended per TODO item 4).

## 2026-10-23 (session 1)

- Built the whole game from `docs/GDD.md` taking every `docs/TODO.md` recommendation as the rule. Commit `fd573de`. Plain HTML/JS PWA, no build step: `world.js` (seeded RNG, coasts, names), `game.js` (rules), `ui.js` (render), `index.html` (styles). Local save in `localStorage['seaking']`.
- Session ended before publishing; done in session 2.
