# Ring Giver — progress log

Newest first. Read this before touching anything.

## 2026-10-23 (session 6, the landing screen)

Levi: the choose-your-king screen "is not working": a new player is met with `C 4 · R 2 · F 3`, which means nothing, and only the Custom card names the stats, with no reasoning. No tutorial wanted, just the minimum that gets a player fired up and in control. Built as one screen, no screen before it (active-user law: teach on the thing itself).

**Shipped**
- **The stakes, up top.** The sub-line now says what is about to occur: twenty, a hall, forty men, one ship; raid, hold, marry, die; the son faces the jarls, who kneel or walk; play until the line ends.
- **Each king is a way to play.** Ragnar "the raider", Rollo "the settler", each with one sentence of how his reign will feel (fast red silver kept badly; slow sure silver, weak at sea). The letter triplet is gone. `statRows()` in `ui.js` shows the three stats as dots (`●●●●○`) with what each one does in the rules, in words: "each man aboard fights as 4", "each man on land holds as 2", "leads 30 men". The numbers come straight from `strengthShip`, `guard`/`resolveLand`, and `fCap`, so the screen cannot drift from the rules.
- **Custom is "Your own"**, with the same rows and +/− steppers; the meaning line updates live (bump Followability, "leads 40 men"), and the points line reads "2 points left to spend" / "All nine placed". Name field moved above the stats.

**Verified:** Chrome at 390 px: both cards and the builder read clean, steppers respect 1–5 and the nine-point cap, Begin starts Halfdan 2/3/4 with 40 men and the intro card.

**Note for local testing:** an old `http.server` from a past session can still own port 8765 and serve a stale copy; check the served `<title>` before trusting a screenshot.

## 2026-10-23 (session 5, the shell)

**Name.** The game is **Ring Giver** (Levi, end of session 5): title, manifest, setup screen, doc headings. It had shipped as "Sea King" since session 1. Storage keys (`seaking`, `seaking-sagas`) and the SW cache name keep the old word so no save is lost; "sea king" stays as in-world flavor (Gudrød's title, the end card). The *Ring-giver* title a king can earn keeps its name too: the game is named for the thing a king is called.

Levi's second phone playtest came back as two complaints: no way to start over, and the main screen is one long thread. Five decisions were drafted (TODO 18–22), all approved as recommended, then built in one pass, plus two asks from the same message: a frame of reference for buying men, and a real map.

**Shipped**
- **Panes** (TODO 19). `UI.pane` ∈ map / ship / hall. `render()` = `bandHTML() + paneHTML() + footHTML() + sheet`. `#app` is a fixed-height flex column (`100dvh`); the band and foot are `flex:none`, the pane scrolls (`UI.scroll[pane]` restored after each render). The foot holds the Sail bar and the tab bar; the Ship tab shows men aboard, the Hall tab the holdings count. `rulersHTML` and `shoresHTML` are gone: a king is tapped by his name under his seat on the map (`.kname`). The map is tappable in spring with no one aboard; the Sail button then reads "No one aboard" and jumps to the Ship pane.
- **The Saga sheet and New dynasty** (TODO 18, 22). Tap the band. `sagaSheet()`: reign rows (current first), the chronicle by year with a reign heading where the king changes, New dynasty. Two-tap arm (`UI.armed`, 3 s, no `confirm()`). `archive(s, why)` writes `{at, seed, from, to, gens, why, rows}` to `seaking-sagas` (20 kept) and clears the save; the setup screen lists them as Past kings. The end card's Begin again archives too. **One live dynasty, no slots** (Levi's call on 18).
- **A quiet turn** (TODO 20). `m.sailed` is set in `sail()`; `newYear()` puts those men back on the ship. The destination survives the winter (dropped in spring if it became ours or unknown); the button says "Sail for X again" when `s.lastDest === destination`. `sail()` calls `chooseTarget()` at once when the destination was already seen, so Landfall only shows for blind sailing and rumored coasts. One `winter` scene replaces the land summary, the hall-eats summary and the market: `resolveLand` pushes `{t:'winter', land, hall}`; `upkeep()` returns its lines; `closeWinter()` draws the winter card. `migrate()` finishes an old save caught mid-winter.
- **The market's frame** (Levi's question). The Winter sheet states the price, the upkeep per man, silver and men, and `menRoom(s)`: how many more men the named men can lead (Σ fCap − men). Buy buttons show their cost and disable when unaffordable.
- **Change shows once** (TODO 21). `act()` accumulates silver and men deltas in `UI.pend`; `bandHTML()` shows them (`.delta`, pine/oxblood, fades) when no scene covers the band, then clears. `moveStance` records `m.moved = {y, d}`; `stanceMoved()` gives the tag an arrow for this year and last. `markLost()` keeps `s.lost` rows (struck through on the Hall pane) until the following spring.
- **The chronicle.** `s.log` entries are `{y, t}` via `log(s, t)` (cap 3000). Added: defeats, winter cards, the land's non-routine lines. The yearly "pays N" / "paid nothing" lines stay off the log. Old string logs are migrated (year prefix parsed out).
- **The real map** (TODO 15, coastline). `tools/coast.py` reads Natural Earth 10m land (public domain), clips to 12°W–34°E / 36°–64°N with Sutherland–Hodgman, projects with Mercator (`PROJ` in `world.js`, identical constants), simplifies with Douglas–Peucker (tol .55), drops islands under 6 units², and writes `coast.js` (`COAST_PATH`, 48 rings, 40 KB). `COASTS` now carries lon/lat and a label side (r/l/a/b); `proj()` gives x,y in `buildWorld` and `migrate()` re-projects every save. Land is `#363B41` with a faint strand stroke under the realm blobs and dots. Labels collide in a few places on the full map (Seine-mouth/Rouen, London/Wessex); pinch-zoom is the real fix.
- Band tags no longer wrap mid-word. SW cache `seaking-v3`, `coast.js` in the file list.

**Verified:** `tools/smoke.js` (committed): fake DOM + localStorage, a scripted dynasty 793→1026 (the line broke) and another to 1066, every pane, the Saga, picker, every Man and ruler card rendered each spring, the Winter sheet, the end card → Past kings, the two-tap abandon, and the old-save migration; 7,200 renders, no `undefined`/`NaN`. Headless Chromium via CDP at 390×844 @2x: Map / Ship / Hall panes, Saga, Winter, setup with Past kings, ruler card, picker, Landfall with the coastline, the full map with every coast known, band deltas. Not on the phone yet.

**Next**
1. Levi plays it. Watch: is the Map pane the right home; does re-boarding ever surprise; is the chronicle worth reading; do the deltas register.
2. Pinch-zoom and pan on the map (TODO 15), then tap a holding for its details.
3. Ruler verbs (tribute, marry out, sail together) — step 4 of the session-4 build order, still open.

## 2026-10-23 (session 4, build phase: people and kings)

Built the first three steps of the build order in TODO.md (decided after playtest 1), plus the realm-break detection because it was five lines. Two commits: `2a8f635` (stance, Man card, hall) and the rulers commit after it.

**Shipped**
- **Stance** (GDD §15.1). `m.stance` −100..100, read in words by `stanceWord()`: devoted ≥60, loyal ≥20, cool, sour ≤−20, hostile ≤−60. `moveStance(s, m, d, why)` keeps the last six deeds in `m.why`; the same deed in consecutive years folds into one line. Deeds: loot share +5 (+10 on a rout), lost fight −5, holding held +3/yr, holding lost −10, given a holding +10, marriage +30, feud −10, idle at home with no men −3/yr, a summer at home with the King +5, gift +15, paying his Oath price +10. A new king halves everyone's stance. Oath: kin and loyal kneel; hostile never kneel free and cost ×2 (sour ×1.5). A hostile jarl with a holding walks mid-reign with 35% a summer (`walkAway()`, shared with the Oath).
- **The Man card** (§15.4). `UI.man` holds the open card; tap any name (band, home, ship, holdings, Kings rows). Stats, stance with reasons, story, verbs in spring: send, men, gift (`T.gift` 20, once a year, kings ×3), marry a daughter. Marriage buttons left the Children list. The King's card shows his titles and children.
- **The King holds the hall** (§15.2). Not a holdings-array entry: `resolveLand` handles it first. King home → `hallPay()` (= `holdPay` of Vestfold), his `heldRun` grows his Rule every third year, everyone at home warms +5. King away → "Vestfold paid nothing". `s.guard` is set in `sail()` to the Rule×men left at home that summer, and the winter rival sail fights that, not the winter roster. Rendered as the first Holdings row (`hallHTML`).
- **Named rulers and realms** (§15.3). `RULERS` in `world.js`: Gudrød (Hordaland, Rogaland), Ælla (York, Humber), Ecgberht (Wessex, Cornwall), Charles (Paris, Rouen, Seine), Áed (Dublin, Munster), Anund (Birka, Gotland). `s.rulers[id]` = stance, why, coasts, known, broken, nextGrow, tint. `ownerOf(s, id)` scans coasts; nothing is stored on the shore. Discovery: `discoverRulers()` when any realm coast becomes `known`; then every coast of the realm becomes known (named on the map, no numbers). Gudrød is known from the first spring. Growth: `growRealms()` in `resolveLand`, each ruler one adjacent free coast every `T.realmGrow` 30 ± 8 years, never Vestfold, a player holding, a walked shore or another king's. If an unknown ruler grows to touch a known coast, `s.envoy` is set and the next winter card is his envoy (a `ruler` scene) instead of the deck. Raid in a realm −10, Stay on his coast −25. Hostile known rulers triple the rival-sail weight, the sail is named and 30 stronger. **Break:** hold every coast but the anchor → he kneels (stance pinned 40, `broken`), the anchor becomes holdable, a card says so.
- Map: one tinted blob per known realm (`.realm`, group opacity .3, thick rounded lines along realm edges + r11 circles, tint = a brand token per ruler), the king's name in small caps under his anchor. Picker, destination row, Landfall picks and Known shores name the owner. Picker sort: seen by loot, rumored at the top, unseen-but-named at the foot.
- `migrate()` runs on load: fills stance/why, builds rulers into older saves (dropping any starting realm coast the player already holds).

**Tuning calls made here (GDD §13 updated)**: realm growth 30 ± 8 years, not the ~8 from D4. With 24 free coasts and six rulers, 8 filled the map by ~830; 30 fills it around 910 with no player land, later with some. Gift 20 / +15. Walk chance 35%.

**Verified:** headless (`smokeA.js`, `smokeB.js` in the job tmp dir, 24 checks), two scripted dynasties 793→1066 with every new screen rendered each spring, no errors. Chrome at 520 px max-width: main with tints and Kings rows, Man card, ruler card, envoy card. Not on the phone yet.

**Not built, by the build order:** ruler verbs (tribute either way, marry out, sail together), the promise-the-next-holding verb, the Wanderer selling a king's name as its own offer (today he names the king when the rumored coast is in a realm). The ruler card has only the gift verb and says so by omission.

**Next**
1. Levi plays it. Watch: does stance move enough to notice in one reign; is 30-year growth too slow to feel; does Gudrød next door read as a threat.
2. Ruler verbs (step 4 of the build order), then pinch-zoom (TODO 15).
3. The daughter's row says "tap a jarl"; if that is missed in play, put a marry button back on her row that opens the jarl list.

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
