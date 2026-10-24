# Ring Giver — progress log

Newest first. Read this before touching anything.

## 2026-10-24 (session 13, the King's Rule, Board all, two stray-tap fixes)

Levi asked whether a high-Rule King matters (it didn't), and reported two things from play: Everyone aboard left his named men home, and a stray tap on a jarl's name on Plunder or stay gave the jarl away. Mid-session: New dynasty at the foot of the Saga jumped to the top on the first tap. He approved my two fixes for Rule. TODO 34–37.

**The King's Rule (TODO 34).** Measured first with the harness, which now takes `--king C,R,F` (11 builds, all personas, 24 seeds, snapshots at 803/813/823): Rule was the dump stat (C4 R1 F4 best; a home-sitting King's build changed nothing). Now `hallPay(s)` is a third of Vestfold's yield per point of the King's Rule, and `reachFree(s)` = `T.reachBase` 4 + `T.reachRule` 2 × Rule (was the flat `T.reachFree` 10). After: the hall-sitter's loot to 823 is within 2% across builds and Rule builds have more men; sailing Kings still want Combat. The reach is weak (tried `reachRise` 0.01 and 0.02: holdings did not move), left at 0.003. Picker: Rule reads "the hall pays 44 · 12 holdings before they stir" (today's Vestfold); Rollo is "the lawgiver". The hall card says what his Rule pays and keeps calm; a stir names the King's Rule.

**Board all (TODO 35, reverses 32).** Everyone boards, the King too. `strengthShip` counts each named man aboard as one more man at his Combat (his own arm), so a man with no men adds something; he shares the loot and grows instead of souring at home.

**Plunder or stay (TODO 36).** A tap picks the jarl; a confirm under the row (what staying costs; Not him / Leave <name>). `render` keeps the open sheet's scroll and skips its rise when the same sheet is drawn again (`UI.sheetId`, `.overlay.still`).

**Saga (TODO 37).** New dynasty sits under the title.

**The Wanderer (TODO 38).** A rumor could name a coast already on the map (a known king's realm, or an earlier rumor) and charge for it: 13 of 35 rumors over the saved states. `rumorCands` now takes only coasts not yet known; the chip says "Nothing new within reach" up front when there are none.

**Verified:** `node tools/smoke.js` OK (fails 0); default playtest md5 is now `b9aa68cc75b2104229ad388318115d55` (the own arm and the hall pay change every fate). Screens at 390 px: the picker, the Saga, Plunder or stay with a jarl picked (`shoot.sh` learned `click=` and `scroll=`). sw `seaking-v8`.

**Next:** round 5, the Hall pane. Feel on the phone whether Rollo's hall pay makes sitting home a real summer.

## 2026-10-24 (session 12, audit 4 built: the battle)

Levi chose **A, The Clash**, with more ceremony: the needle swinging back and forth was motion that meant nothing; he wants genuine rolls he can watch, like CK3, losses scattered across the ranks, something when men fall, a slower pace by default that a tap can skip, and the King's risk of dying stated plainly. He agreed to all of my recommendations: real exchanges in the combat math, luck kept at about today's share, the King's risk on the commit sheet and the battle, no mid-battle retreat for now, Turn for home (TODO 31) and Board all's fix (TODO 32).

**`game.js`, the battle.** `battle(S, D, rolls)` fights up to three exchanges, the landing, the shield wall and the press, each a roll of the ship's strength on the day (`ROLL` 0.82–1.18). The mean of the exchanges fought must beat the defenders. A side breaks early when the running strength stands at twice the defenders or half of them, which only happens when the rest could not save it, so `winOdds` is exact (Irwin-Hall, n = 3) and routs end at the landing (the levi persona's fights average 1.7 exchanges). Losses and the loot follow the same formulas as before, on the mean roll; losses are shared across exchanges by how hard each went. Named men fall at the same chance as before (`fallChance`), in the exchange that cost the most, by lot. `fightRisk(S, D)` gives that chance before the ship sails, over a 10×10×10 grid of days (cached); `shipRisk(s, D)` for the ship as it stands. The fight scene now carries `phases` (k, roll, men, dl = share of defenders broken, fell), `crew` (before and after: men, Combat, Follow, stance, raids, fell, at, unled), `risk`, `def0/def1`, `owner`, `loot0`. The fallen-men summary card is gone: they are on the battle. `turnHome(s)` (TODO 31). `boardAll` leaves home a man with no one to lead (TODO 32). `holdOdds`/`holdWords`: a holding's summer keeps its one roll (0.85–1.15), and its bar no longer borrows fight words.
**Tuning.** Tried 0.75–1.25 (luck in play, odds 3–97%, in 9.3% of the levi persona's fights) and 0.80–1.20 (7.6%); 0.82–1.18 gives 6.5% against 5.9% with the old single roll measured the same way. With Turn for home the careful personas stop walking into hopeless landfalls: the levi persona's lost fights fall from 14% to about 3% and its King's falls from 6.3 to 1.4 a dynasty; the raider still breaks 16/16, the reckless 13/16, the miser 8/16. The personas' default target turns home when nothing is better than 20%, the courtier's when nothing reaches 50%. New playtest table THE BATTLE (luck in play %, exchanges a fight, turned home, king fell). Default-run md5 is now `7f877f98bda9c863b70cec9094c294a8`.

**`ui.js` / `index.html`, the battle sheet.** On the night, opaque: the coast's name, "sailed on 81% · likely · bloody"; the field (our strength as marks grouped by leader, the King's in accent; the coast's opposite; a front line); a chip for each named man aboard (the King's with his chance to fall) and "Each named man aboard: 2.2% to fall this day." Then each exchange: its name, the day's roll tumbling and landing on the real one, the ranks closing, marks falling at scattered moments, a named man's fall called on the field ("Harald falls"), his chip struck, the card shuddering, the phone buzzing where it can (`navigator.vibrate`, Android); the front line moves with the running strength; a row records the exchange. The verdict stamps ("A narrow thing. They give way at the press."), then the reckoning: loot, men and their worth in silver, the net, the coast's defenders struck and new, a ruler's stance, the crew man by man (men lost, Follow and Combat up, stance arrows, the fallen and the men they leave unled). The band holds the pre-battle silver and men and counts them in at the end. A full three-exchange battle runs about nine seconds, a rout about four; "Skip the battle" or a tap anywhere ends it; reduced motion shows it fought. The foot names what follows: "Plunder or stay · X can be held", "Home · Autumn N", "X is dead". If the King fell, the title becomes "Asmund falls at Lindisfarne".
**Plunder or stay** is the trade from the audit (loot now vs rent a year and summers to earn it back, unrest in one line, unled men to send, the ruler's price and his realm's count, each jarl's chance to hold next summer with his men and his full following, "send 9", walked jarl first, four shown and "N more"). **Landfall**: each coast's chance in the odds' color, loot, defenders, owner, the best sure coast marked, each man's chance to fall, and Turn for home (solid when nothing reaches 40%). **The commit sheet** says "Ragnar aboard: 4.1% chance he falls, the same for each of the 3 men with him. Home, he holds the hall." or "no risk to him at these odds", or that the risk is unknown until the fog lifts.
Also: `countUp` no longer dips below its start on its first frame. Class `.why` already meant the stance list, so the jarl row's line is `.jwhy`. `sw.js` cache v7. `shoot.sh` takes `VT=<ms>`. The smoke test checks the battle unfought and fought, uses Turn for home, and starts a new line if one breaks before 900: today 793→903, 2,600 renders, 89 battles, no fails.

**Not built:** a mid-battle retreat (decided: later, after the battle is felt on the phone). **Next:** Levi plays a summer on the phone and judges the battle's length; TODO 33 (late raids lose money) stands; then round 5, the Hall pane.

## 2026-10-24 (session 11, screen audit 4: the Fight sheet)

Round 4 of the five-screen audit: everything after Sail (Landfall, the fight, Plunder or stay, the fallen). Audit page with the critique and three live mock-ups: https://claude.ai/artifact/T7ttHAvgb7SxcSNheD5bx9 . **Waiting on Levi's pick.**

**How the states were found.** Like round 3, from the persona playtests: `FIGHTS=<dir> node tools/playtest/run.js` dumps the first save of each kind of summer scene and, with the levi persona, counts them (`_fightcount.json`). With `FIGHTS` set, `G.chooseTarget` is wrapped to stamp `s.pre4` (the crew and the coast before the fight) so the mocks can show before and after. `tools/audit/fight-states.js` trims a save for the mocks; a Landfall carries the fight each coast would bring, run on a copy with the game's seed. Default-run md5 unchanged (`95a07adb…`). Also fixed in `run.js`: the card dump's keep-one-early line had been swallowed into a comment.

**What a summer brings (Levi's line, 8 dynasties, 2,168 fights):** rout 56%, victory 19%, narrow 8%, driven back 17%; a named man falls in 14%; the King falls 61 times (7.6 a dynasty); Plunder or stay 18%; Landfall 18%. The roll changes the winner in only 6% of fights (odds strictly between 0 and 1), but sets loot and losses in all. Past 900, 88% of fights cost more in men (3 silver each) than they bring.

**The critique, in short.** The verdict is printed in the same frame the bar starts to grow; the roll is never shown. The bar's odds words use the rolled strength, so 838 (sailed on 81%, lost) reads "even" and 967 (76%, won) reads "sure". "28 silver in loot. 84 men lost." (921) never adds up to a loss of about 220 silver, nor says Lindisfarne is at 1,000 defenders now. The men are a number: Follow +1 on a rout, Combat +1 at the third raid and stance are silent; the fallen come on a separate card after On; in 967 the King falls in a won fight and the fight card does not say so. Plunder or stay is about fifty words of rules every time, borrows fight words for a holding ("Holds 84 vs Unrest 69 · sure · bloody"), says "hopeless" for a jarl who would hold once his men are sent, and never names the king whose coast or seat it is. A blind Landfall can offer only hopeless coasts with no way home. Every button is On.

**Three options, all with:** the odds strip (the roll's 0.85 to 1.15 range banded by what each day brings; the share right of oxblood is exactly the odds sailed on; the needle lands on the day; loot range under it), the raid's account, the crew rows with the fallen on the fight card and the King's fall as the title, the foot naming what follows, Plunder or stay as a trade (now against a year, summers to earn it back, unrest in one line, the king's price and his realm's count, each jarl's hold chance with his men and with his full following, "send 9"), and Turn for home at Landfall (TODO 31).
- **A, The Clash (my pick):** two ranks of marks (strength, grouped by leader, the King's in accent) across a line; the needle swings 900 ms, the ranks close, lost marks go oxblood, the verdict stamps.
- **B, The Raid on the Chart:** the sheet stays low and the map stays lit, cropped to Vestfold and the coast; the defenders' ring breaks or holds; the loot runs home along the route and the band's chest counts it in; Plunder or stay draws the coast as a holding with rent and unrest; Landfall's odds are printed on the map and the coasts are tappable there.
- **C, The Roll Call:** the crew is the body; after the needle each man's row resolves (his bar shrinks in oxblood, gains and stance appear); the account is a footer.

**Found on the way (not fixed):** TODO 32 (Board all boards men with no men), TODO 33 (late raids lose money), and Landfall's little map piles labels on the Channel (pinch-zoom, TODO 15).

**Next:** Levi picks; build the winner with the shared fixes; decide TODO 31 to 33. Then round 5, the Hall pane.

## 2026-10-24 (session 10, screen audit 3: the winter card)

Round 3 of the five-screen audit. Audit page with the critique and three live mock-ups: https://claude.ai/artifact/HCnFYiyjm25E4SSc3oozDd . Levi chose my pick, **A, The Turn**, and it is built (commit 7b9957d, below). Commits: 80c82a3 (audit page and kit), 7b9957d (the build), and the bookkeeping commit after it.

**How the states were found.** The card is random, so instead of a driven dynasty the persona playtests supply the states: `run.js` with `CARDS=<dir>` dumps the first save of each kind of card (birth son/daughter, wanderer, hard winter, harvest, man from the sea, feud, jarl death, suitor, quiet, the envoy, and the rival sail split by king or stranger, held or fell, a man or the King slain), each with `-aged` when old men also died in bed and `-late` past 880, plus `gathering` (a king turned wroth that winter) and `agedeath` (the King's old-age roll took him after the card). The hook only runs with `CARDS` set; the default run's md5 is unchanged (`95a07adb…`). `tools/audit/card-states.js` trims a save to what the mocks need and runs the card's button on a copy to learn what follows (spring, the fork, the old-age death, the King slain) and who takes the hall. Frequencies over 8 dynasties of the levi persona: birth 20.6%, sail 17.5% (the hall falls in about 6 of 48 a dynasty), Wanderer 11.8%, harvest 11.5%, jarl death 11.3%, suitor 10.1%, feud 6.1%, quiet 5.5%, hard winter 4.1%, man from the sea 1.6%.

**The critique, in short.** A notice where the game promised a draw ("one card turns"): no face-down moment, every card the same voice and the same On. In 808 a strange fleet kills Ragnar at 35 with no son of age and no kin, the dynasty ends, and the card says so as line two in body text. In 852 six equal paragraphs. The fight is "(0 vs 101)". Effects are words where numbers exist. The gathering fleet (TODO 27) and the full bench (TODO 26) are never told. The King's old-age roll past fifty happens after the card, unseen. The death card does not say how he died, says "At most 0 holdings", and offers "The heir" to a line that has none.

**Three options, all with:** tone by kind (oxblood grave, pine good, chestnut warning, iron routine; the King slain takes the title), the fight as a Guard vs Fleet bar, effects as chips with the struck and new figure, other news as weighted rows (old men's deaths grouped, grammar fixed), "X's fleet is gathering" the winter a king turns wroth, "The benches are full" when 8 sit without land, the King's roll on the card, the foot button naming what follows ("Spring · 826", "Ragnar is dead", "The line is broken"), and a death card with the cause and the heir or the broken line.
- **A, The Turn (my pick):** the card lies face down on the winter night (350 ms), turns (520 ms); other news arrives as rows under it; past fifty a second card with the King's odds on its back, turned by the foot button.
- **B, The Hall at Night:** a drawing above the text: horizon with hostile kings' sails (dashed while gathering), the fjord, the hall and its guard, the high seat, eight bench seats, the children. A fleet runs down the fjord and breaks or burns the hall; a seat empties; a child appears.
- **C, The Saga Page:** the winter as one saga sentence written in word by word, numbers as footnotes, an Ahead box (fleets, full benches, next winter's odds), and a strip of every winter of this reign colored by tone, read back from the chronicle.

**Found on the way (not fixed):** duplicate names among named men (two Odos die in one winter; two Osrics on one bench), "His 0 men" / "His 1 men", "This is what that costs." when the hall held.

**Levi: "Let's go with A and build it."** Shipped (option A, the Turn):
- **`game.js`.** `winterCard` stamps the card with what it did: `kid`, `dead`, `fight {h, f, fell, foe}`, `lost`, `slain`, `kingSlain`, `man`, `feud`, `aged`, `gather` (kings turned wroth this winter), `benchFull` (only the winter the benches fill; `s.benchFull` remembers), and `roll {p, dies}`. **The King's old-age roll moved onto the card:** `winterCard` draws it from the same seed `endWinter` used (`rng(day + ':death:' + year)`), stores `s.rolled` / `s.oldDeath`, and `endWinter` reads it (an envoy's winter, which has no event card, still rolls in `endWinter`). Death scenes carry `cause` (`slain`, `age`, `fell` with `at`) and `kid` (born that winter). `answerSuitor` answers on the card; `acceptSuitor` (answer and move on) stays for the playtests. `deathOdds(s)` is the one place the King's odds live (the band uses it). `freshName` gives births, locals and men from the sea a name no living man or child carries ("Odo of Rouen" when the list is spent). `unled(n)` ends "His 0 men" and "His 1 men". "This is what that costs." only when the hall fell. The persona playtest md5 is unchanged (`95a07adb…`): same fates, only names and words differ.
- **`ui.js` / `index.html`.** The `event` and `death` scenes take a night stage (`.overlay.night`): one card (`.tc`), face down for 380 ms on its first showing in a year (`UI.cardYear`, `UI.cardBeat`), then a 520 ms turn; a tap on the card skips it; reduced motion shows the face. Tone by kind (`cardRead`): oxblood grave, pine good or held, chestnut warning, iron routine; the King slain takes the title. Guard vs Fleet bar, chips with struck and new figures (next autumn's bill, rumor price, rents, losses, the line's sons), rows under the card (the slain man, the hostile king, old men's deaths grouped, the gathering fleet, the full bench, the suitor's answer). Past fifty the King's card lies face down under them and the foot button reads "Turn his card · 10%"; it turns in place (`turnRoll`) and the button becomes "Spring · 826" or "Ragnar is dead". The suitor card shows the man's stats and stance; Give her / Refuse answer on the card. The death card: cause, winters and reign, the best raid, holdings ("No holding ever answered to him."), and the heir, the in-law, or "No son of age. No kin to take the hall. The line is broken." with the boys too young named; its button says which.
- Card classes are prefixed (`ctop`, `cchip`, `cwho`, `cyr`) because `.top`, `.chip`, `.who`, `.yr` already mean the band, the map chips, the man rows and the saga rows.
- `sw.js` cache v6. `shoot.sh` learned `rolled=1` and `answer=yes|no`; `nobeat` also lays the card face up. The smoke test answers suitors on the card and turns the King's card.

**Verified:** `node tools/smoke.js` OK (793→903, 2198 renders, no fails); playtest md5 unchanged; headless shots at 390 px of 793 (son, the line), 807 (hard winter, bill 99 → 198, Gudrød's fleet gathering), 808 (Ragnar slain, then the death card: the line is broken, Ulf is 11), 813 (Gudrød's fleet, Orm in the door), 820 (Vidar asks for Gyda, answered), 825 (the King's card face down, then turned: sees the spring), 846 (Asa born, Asmund dies in his sleep, the death card names her, heir Knut), 852 (the pile-up as one card and three rows, "Osric of York"). The turn's timing is for the phone.

**Next:** round 4 of the screen audit, the Fight sheet. Levi should feel the turn and the King's card on the phone (TODO 26 to 30 still list what to look for).

## 2026-10-24 (session 9, persona playtests: TODO 25)

Levi's first full run was an automatic win, so the question was which levers make a bad plan lose. Built a headless kit, read what each personality got away with, tuned `game.js`, re-ran. Round 3 (the winter card) waits behind this.

**The kit (`tools/playtest/`).** `run.js` plays whole dynasties, 793 to 1066, for scripted players; `personas.js` holds the policies; `LEVERS.md` is the inventory of every balance lever with line numbers, what exists, what changed, what was observed. Usage: `node tools/playtest/run.js [--seeds N] [--persona X] [--seed N] [--json f]`; `TRACE=1` with `--seed` prints each King's death and the ship every 20 years. About 25 s for the default run. Deterministic: `Math.random` is seeded and `Date` is faked inside a `vm`, so the same seeds give the same lines (md5 of the default run's output `95a07adb71b7c5a72cc71be49af22944`). Eight personas: **raider** (richest seen coast every summer, never stays), **rover** (richest coast at odds of 0.75 or better, never holds, guards the hall, gifts hostile kings), **settler** (stays wherever holdable), **miser** (never buys men), **reckless** (sails blind, fights at any odds), **hall-sitter** (King always home, jarls sail), **courtier** (gifts and marriages, only sure fights), **levi** (his own line as he described it).

**Baseline finding (cfddfb7, 8 seeds).** 55 of 56 lines reached 1066. The reckless lost 50% of its fights and lived. The levi persona lost 0 of 273 fights, held all 33 coasts by about 850, and broke 5.4 realms a line, each king kneeling the summer his realm was held. Starving was cheaper than feeding (one man left per 2 silver short). Named men never died in fights; late lines carried 500 to 900 of them. A hostile ruler's only answer to a raid was a rival sail.

**The changes (`T` at the top of `game.js`, each commented in place).**
- `fallLoss` 0.25, `fallWin` 0.25: named men aboard can fall. In a lost fight each falls at lossFrac x fallLoss, in a bloody win at (lossFrac - 0.2) x fallWin. A fallen jarl leaves the roll and his men come home unled; a fallen King gets a summary card, then the death card, and `finishCoronation` now lets the summer and winter still run when he fell in summer.
- `defWin` 1.3, `defCap` 1000, `defMend` 0.965 (were 1.2, 200, 0.95): a coast arms toward the raider who keeps coming, and mends more slowly.
- `hallSlay` 0.5, `guardSave` 3, `richHall` 300, `richKing` 1: a fallen hall kills a named man, the likelier the thinner the guard and the richer the chest; the victim is the King at chest/richHall (at most 0.75), else by lot. A rich chest also draws more rival sails (+2 per 300 silver, at most +6).
- `starveSour` 10 and starving at 1 man per silver short (was per 2): every jarl sours, and the sourest unkin jarl at home leaves with his men.
- `breakYears` 3: a realm held whole must stay held three summers before its king kneels ("bends" on the winter sheet counts them down).
- `strike` 0.3, `strikeBase` 40, `strikePer` 20, `strikeSated` 20: a hostile king comes for a holding that was his each summer; host against the jarl's Rule x men; lost, he takes it back and warms.
- `benches` 8: no wanderer or local comes while 8 named men sit without a holding (sons always do).
- `oldAge` 0.04: past sixty a named man dies in his bed at oldAge x (age - 60) a winter.
- `reachFree` 10, `reachRise` 0.003, `reachMax` 0.05: past ten holdings each may stir (unrest +15..40) a summer ahead.
- A king's fleet sails only after he has been hostile a full year (`wroth`), so the hostile word is a year's warning. Births weigh 7 / 4 (were 6 / 3). With no son the youngest kin inherits. `finishCoronation` in summer, above.

**Before and after (16 seeds).** Columns: lines broken of 16, fights lost %, starving years, holdings peak, holdings lost.

| persona | broke/16 | lost % | starve yrs | hold peak | holdings lost |
|---|---|---|---|---|---|
| raider | 0 -> 16 | 19 -> 22 | 10 -> 2.2 | 0 -> 0 | 0 -> 0 |
| rover | 3 -> 4 | 1.7 -> 2.7 | 11 -> 7.8 | 0 -> 0 | 0 -> 0 |
| settler | 0 -> 0 | 0.2 -> 30 | 38 -> 18 | 33 -> 33 | 1.4 -> 4.6 |
| miser | 2 -> 9 | 1.8 -> 3.6 | 0 -> 0 | 1.5 -> 1.0 | 1.0 -> 1.0 |
| reckless | 0 -> 13 | 45 -> 53 | 18 -> 2.9 | 18 -> 6.5 | 2.4 -> 3.1 |
| hall-sitter | 0 -> 0 | 0.1 -> 12 | 42 -> 12 | 28 -> 31 | 0.6 -> 12 |
| courtier | 0 -> 2 | 0 -> 0 | 47 -> 19 | 27 -> 27 | 0.7 -> 8.9 |
| levi | 0 -> 0 | 0 -> 14 | 50 -> 21 | 33 -> 33 | 1.1 -> 16 |

Also: the levi persona now holds about 27 coasts in 843-852 (was 33), and a hostile king takes about 7 years to kneel (was at once).

**Verified:** smoke OK; determinism md5 above on the default run; all 21 saves in `tools/audit/states` load and advance two years; a forced King-falls-at-sea run reaches the next spring. `sw.js` cache bumped to v5.

**Residual risks.** The rover and the miser sit at their limits, plus or minus 2 seeds. The settler loses 30% of its fights at its 0.5-odds threshold. The levi persona's fights-lost % is sensitive to `defWin`. All of it is headless; none has been played by a hand.

**Next:** round 3 of the screen audit, the winter event card. And Levi should play a dynasty to feel it (TODO 26 to 30 log what to look for).

## 2026-10-23 (session 8, screen audit 2: the Winter sheet)

Round 2 of the five-screen audit. Audit page with the critique and three live mock-ups: https://claude.ai/artifact/DSHVXj6S2YXbbcTWg4fDri . Levi: "build your pick", so **A, The Ledger** is built (below).

**The critique, in short.** A receipt with a shop stapled to it. The year's money happens offstage: the band shows the final silver, the sheet names rent and upkeep, nothing adds loot, rents and the bill into the chest. Every line weighs the same (a lost holding and "Vestfold paid nothing" in one voice; starvation as body text). The same two sentences repeat every winter for 273 years (the King at sea; the market's lesson). Titles pay off in silence (Deep-chest halves the bill, hard winter doubles it, Fair-dealer drops the price, none named). A dead market fills three-fifths of the screen when silver cannot buy five men. Buying shows no consequence (no ship strength, no leader). The exit is the grey second button, and the sheet is called Winter though the winter card comes after it.

**Three options, all with:** a counted ledger or chest on open, events weighted by kind (oxblood display line with a stripe for a lost holding or starvation, pine for a new holding, muted for a realm's growth, routine lines gone), title payoffs shown as the struck-through old figure beside the title's name, the market collapsing to one dashed line when nothing can be bought, the price-and-upkeep lesson in the first winter only, and one sticky primary "Into winter · one card turns". The sheet is titled Autumn in the mocks.
- **A, The Ledger (my pick):** chest in spring, loot, rent per holding, the hall's bill, the chest now, rows arriving 120 ms apart and the total counting over 650 ms; market card with the stepper, "+N ship strength under <leader>", and a room bar.
- **B, The Chest:** one big counted number and a to-scale waterfall bar (kept, loot, rent, ate; buying eats a chestnut bite live).
- **C, The Muster:** four account tiles, then each named man's following as a bar against his cap; stepping fills the first man with room in pine. Changes a rule: bought men go to the first man with room, King first.

**Shipped (option A, the Ledger)**
- **The year's account lives on the state.** `newYear()` stamps `s.yr = { spring, loot, from, forfeit, beaten, bought }`; `plunder()`, `chooseStay()`, the fight's loss branch and `buyMen()` fill it in. `migrate()` gives old saves an `s.yr` at load (and `startGame` now runs `migrate` on a new game so the first year has one).
- **`resolveLand` carries three things:** `lines` for the chronicle (unchanged), `rows` for the rent roll (`{n, v, why}`; `v: null` is "newly ours · pays from next year"), and `events` weighted by kind: `lost` (rose, walked, revolted), `empty`, `new` (a man comes after five quiet years), `rule`, `realm` (from `growRealms`, which now takes an events array), `starve` and `hard` (from `upkeep`, which returns `{lines, eat:{men, base, due, paid, why, starve}}`). The winter scene is `{t:'winter', land, hall, rows, events, eat, spring, loot}`; the UI falls back to `land`/`hall` for a save caught mid-winter.
- **`winterHTML` in `ui.js`:** "Autumn 793", then the ledger (chest in spring, loot with its reason, one row per holding, the hall's bill with the plain figure struck through when a title or a hard winter changed it, men bought), the chest total with its delta; The land as weighted events or "A quiet summer on the land."; the market card (price line with Fair-dealer's strike-through, the stepper, silver and men before→after, "Aboard under Ragnar · +37 ship strength" from the same King-first-then-home placement that Fill uses, the room bar and "room for N more under the named men", one Buy that names the deal, the bought line, and the price-and-upkeep lesson in 793 only); when silver cannot buy five men the market is one dashed line. The exit is a sticky primary at the sheet's foot: "Into winter · one card turns".
- **The beat:** on the sheet's first showing in a year (`UI.winterYear`) ledger rows and events arrive 120 ms apart (`.in`) and the chest counts from last spring's number (`countUp` on the scene, `UI.winterBeat`). After a buy, `buyNow()` counts the total from its previous value in place. Reduced motion skips both.
- `sw.js` cache bumped to v4. `shoot.sh` learned `buy=<n>` and `nobeat` now also skips the ledger beat.

**Verified:** `node tools/smoke.js` 793→1026, 234 winters, 6009 renders, no fails. Headless Chromium at 390 px: 793 (first winter, teach line), 806 (loot +120, hard winter struck −27 → −54, the Hard winter event), 835 (lost Truso in oxblood, Ælla's reach muted, Gotland newly ours as a row), 835 after buying 20 (bought row, chest 308 → 201 −107, band 20 unled), 850 (Deep-chest struck, 9 silver → dashed market), 802 (starvation in oxblood, chest 0), 821 (Fair-dealer's struck price, Buy 10 for 20). Not on the phone yet. Headless stills catch the sheet mid-rise, so it looks translucent in them; it is not.

**Kit notes.** A stale `http.server` from a past job still owned :8766 and served old states; `shoot.sh setup` now needs the old one killed first (check `/proc/<pid>/cwd`). Headless stills freeze CSS animations and rAF counts at an arbitrary frame; for layout checks inject `*{animation:none!important;transition:none!important}` and ignore the counted numbers. Nine winter states added under `tools/audit/states/`.

**Next (Levi, end of session 8): playtests with different personalities and playstyles, before round 3.** His first full run: never lost a battle, never short of men or silver, expanded every few years, and a king's anger never mattered because he could subjugate him at once. "It feels like I'm just optimizing an automatic win." So: drive scripted players with distinct policies through whole dynasties headlessly (TODO 25), read what they get away with, and tune before the next screen audit. Round 3 (the winter card) follows.

## 2026-10-23 (session 7, screen audit 1: the spring Map screen)

Levi: audit the five most-used screens one at a time, three live alternatives each, he picks. Screen 1 is the spring Map pane. Audit page with the critique and the three mock-ups: https://claude.ai/artifact/BZLsmsJppbmJz16RN1pBJb . He chose **A, The Chart**, and agreed with the whole critique.

**The critique, in short.** Honest and flat: the right facts in the same voice every year. The map was a picture of all Europe with dots on it (the SVG was taller than its viewBox, so Italy leaked into the letterbox in 793), and the fog was invisible. The band wrapped badly. The commit (Sail) sat far from the odds and looked the same at "sure" and "hopeless". Three equal cards under the map. No arrival, no departure, no sense of the centuries. The first spring's primary button said "Stay home this year".

**Shipped (option A)**
- **The map is the screen.** The Map pane is the whole viewport behind the band and the foot (`.pane.map` is absolute; the band is `glass` over it). `fitMap()` in `ui.js` refits the crop to the screen's shape after every render and sits the known world in the free water between band and sheet. Known coasts stay the crop; the rest of Europe lies in fog.
- **The fog is real.** `mapHTML` draws the land twice: dim everywhere, lit inside an SVG mask of blurred circles around every known coast (r 46 seen, 30 known). Lit sea inside the same mask. Realm tints live under the mask so they fade into the dark with the coast. Landfall uses the same drawing, framed.
- **The band.** Grid: year and resources on the first row, name, age, tags and "· fork at N" or "· death N%" on the second; past fifty a two-pixel life strand that shortens with the death chance. "48 men · 10 unled".
- **Two chips over the water.** Rumor (price; names the coast once bought, and tapping it sets the destination) and the crew ("38 aboard · all aboard" boards everyone). The Wanderer card and the Everyone-aboard row are gone from the Map pane.
- **The commit sheet** (`sheetHTML`): where, loot and defenders, the odds bar, and one plank with the odds words and the odds' temperature as its underline (`oddsTemp`: pine sure, teal likely, chestnut even, oxblood long). Ask states: "Choose a coast · tap one on the map" opens the picker; "No one aboard · tap the crew"; "Stay home this year" is a text button under the plank when no one is aboard. Ship and Hall panes keep the old Sail bar.
- **The arrival beat.** The first render of the Map pane in a new spring (`UI.beatYear`): the band's silver and men count up from last year (`countUp`, 650 ms), the fog mask scales in (`fogin`, 1 s), coasts first seen last summer bloom in sequence (`seenY` stamped in `game.js` `see()`), and the route from the hall draws (`routeTo` over the coast graph, `pathLength` dash). Reduced motion skips all of it.
- **Departure.** `depart()`: a ship dot runs the route for 0.9 s (SMIL `animateMotion`), then `sail(S)`.
- **The first spring teaches on the thing itself.** The richest seen coast pulses until a destination is set; then the crew chip glows until men board. Sub-line: "Tap a coast. Rich ones are bigger dots."
- **Back without scrolling** (Levi, mid-session): every dismissible sheet (Man, ruler, Saga, picker) has an × in its title row, and the title row is sticky, so the way out is always on screen. Bottom Back stays.

**Verified:** `node tools/smoke.js` 793→1066, 20 generations, 7201 renders, no errors. Headless Chromium at 390 px: 793 first spring, 800 blind, 815 with and without men and destination, 850 hopeless odds, 900 late game, intro, Landfall, Man card, Hall pane. Not on the phone yet.

**Open from the audit, not built:** label pile-up on the Channel coast by 900 and 7.5 px king names (pinch-zoom is the real fix, TODO 15); the realm tints as pills.

**The audit kit, committed** (`tools/audit/`, `docs/audits/`), so the next round starts cold:
- `tools/audit/shoot.sh setup` builds a harness dir (symlinks to the game, a driver copy of `index.html` that loads a saved state from the URL hash, the states folder) and serves it on :8766. `tools/audit/shoot.sh NAME 'state=spring-815&pane=hall'` shoots it at 390×844, 2×, to `tools/audit/out/NAME.png`. Hash keys are listed at the top of the script. Re-run setup after editing `index.html`.
- `node tools/audit/gen-states.js` drives a dynasty headlessly and dumps saves at chosen moments: spring 793/800/815/850/900, landfall, fight-win, fight-lose, stay, winter, an event, a death. Edit the `dump()` calls for the states a screen needs.
- The Chrome extension was not connected this session; the kit needs only Chromium and Node. Levi's phone is still the final judge of timing.
- `docs/audits/README.md` tracks the five rounds. `1-spring-map.template.html` is the audit page's source with its data; the published page is the artifact linked there.

**Next:** round 2, the Winter sheet. Screenshot its states (land lines, hall eats, market at 0 / some / max silver, the unled warning, Fair-dealer price), critique, three live options in one artifact, Levi picks.

## 2026-10-23 (session 6, the landing screen)

Levi: the choose-your-king screen "is not working": a new player is met with `C 4 · R 2 · F 3`, which means nothing, and only the Custom card names the stats, with no reasoning. No tutorial wanted, just the minimum that gets a player fired up and in control. Built as one screen, no screen before it (active-user law: teach on the thing itself).

**Shipped**
- **The stakes, up top.** The sub-line now says what is about to occur: twenty, a hall, forty men, one ship; raid, hold, marry, die; the son faces the jarls, who kneel or walk; play until the line ends.
- **Each king is a way to play.** Ragnar "the raider", Rollo "the settler", each with one sentence of how his reign will feel (fast red silver kept badly; slow sure silver, weak at sea). The letter triplet is gone. `statRows()` in `ui.js` shows the three stats as dots (`●●●●○`) with what each one does in the rules, in words: "each man aboard fights as 4", "each man on land holds as 2", "leads 30 men". The numbers come straight from `strengthShip`, `guard`/`resolveLand`, and `fCap`, so the screen cannot drift from the rules.
- **Custom is "Your own"**, with the same rows and +/− steppers; the meaning line updates live (bump Followability, "leads 40 men"), and the points line reads "2 points left to spend" / "All nine placed". Name field moved above the stats.

- **Picker rows:** the realm note ("Gudrød's realm", "Bjorn's now", "rich, by rumor") sits beside the coast name in parentheses instead of on its own line, so it stays apart from the odds line below (Levi).

- **The market, option B** (Levi picked it from three live mocks: ledger buttons / stepper and sum / the chest as a bar). The three `Buy n · cost` buttons are gone. A stepper picks how many men (fives, capped by silver), and the sum reads in full under it in mono: `Silver 60 − 30 → 30`, `Men 40 + 10 → 50`, with a chestnut warning line when some of them would sit unled. One Buy button names the deal: "Buy 10 men for 30 silver". `marketHTML` / `setBuy` / `marketNums` in `ui.js`; the numbers update in place so the sheet does not jump; `UI.buy` keeps the chosen count between renders. "Close the market" is the quiet button now.
- **Fill.** Every named man's men stepper, the King's too, on the Hall/Ship cards and the Man sheet, has a Fill button: he takes all he can lead from the unled (`addMen(S, id, cap)` clamps). Disabled when he is at cap or no one is unled.

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
