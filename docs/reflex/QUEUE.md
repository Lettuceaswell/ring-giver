# The queue — ranked candidates for the next run

Class per RUBRIC.md (A build now · B decided, build in order · C never build, prepare · D taste, prepare). Score = how far its dimension is from target × confidence that this moves it ÷ cost. The loop takes the top A or B whose dimension was not picked in the last two runs; a Sound regression always comes first. Reorder at the end of every run; strike what shipped with the run number.

## Top of the queue

| # | Item | Class | Dim | Score | Evidence | Notes |
|---|---|---|---|---|---|---|
| ~~Q1~~ | ~~`addMen` cannot step a man down when he is over his cap (47 → 40, not 45)~~ **shipped run 1.** Cause: `fCap` counts the King's Ring-giver title; a new King without it drops every cap by ten under the men already led | A | Sound | — | smoke `step 47 40` | see Q16 |
| ~~Q16~~ | ~~Where else does the game assume `men ≤ fCap`?~~ **read and fixed run 2:** only `fillShip` lied (it stripped a man over his cap to it); `menRoom`, `buyMen`, `boardAll`, the market's lead count all skip a full man | A | Sound | — | run 1 | |
| ~~Q2a~~ | ~~**Buildings in holdings**, the rule, a `builder` persona, prices, and the holding sheet's rows~~ **shipped run 2** at 300/300/200 (TODO 45 for the scale) | B | Want | — | | |
| ~~Q3~~ | ~~**Raise the hall** (41B.2, after Q2)~~ **shipped session 19** (not a reflex run; Levi's "build both" with 41B.4): three tiers at 400/800/1,600; builder chest 631 → 492, lines 6/8 unchanged; no baseline persona reaches tier 3 | B | Want / People | — | | the hall-sitter is the one who can afford tier 3; Q19 |
| Q19 | The hall-sitter and the courtier never raise the hall: give the rich personas the verb (raise when silver − price ≥ bill + 60, like the builder) so the tier-3 sink is measured where the idle silver is (hall-sitter 13,000) | A (evidence) | Want | 3 | session 19 sweep | harness only |
| Q2b | Buildings, the rest of the UI: the Hall's one-line holding row says what is built (a word each), the Winter sheet says what the longhouses sent (today a Saga line only), the ledger's "· the market" shown on the Rent row | A | Want / Thumb | 3 | run 2 | small |
| Q2c | A moment card when a building is lost with its coast (revolt, walked, taken): the chips name the Market and the Longhouse with the −pay | A | Juice | 3 | run 2; TODO 41B.2 "a king who takes the coast back takes them too" | after Q2b |
| Q17 | TODO 45 C, priced by the coast: a sweep with the builder once Q3 is in, so the whole sink is seen at once | C (prepare) | Want | 2 | run 2; 45 decided A | a measurement only, after Q3 |
| Q18 | `tools/audit/states/hall-850.json` (hand-made, gitignored) shows −29 unled: its men are fewer than the men placed. Regenerate it through `gen-states.js` so the shots are of a state the rules could reach | A | Sound | 2 | run 2 shots | harness only |
| Q4 | Map labels pile up on the Channel by 900; king names at 7.5 px. De-collide labels (nudge or drop the lesser) inside the chosen design (round 1). Pinch-zoom itself needs Levi to call TODO 15 by number | A | Thumb | 4 | audit 1 leftovers; panel "map is mood, not a tool" | measure with a 900 state through `shoot.sh`; a projected-label overlap count can live in `measure.js` |
| Q5 | The dead-choice test: `run.js --force king-sails\|king-home\|never-stay\|always-stay` on the levi persona, same seeds; if two forced policies end within 5% on loot and holdings the choice is dead | A | Teeth | 4 | TODO 12 history (King always sailed); TODO 34 (Rule did nothing) | a measurement that finds what no one has complained about yet |
| Q6 | TODO 26, the half left: the quiet-years line on the Autumn sheet does not mention full benches | A | People | 3 | TODO 26 | copy on an existing line |
| Q7 | Stance words that contradict the raid's effect (panel cluster): find the case (picker's "turns hostile" vs the card after) and make one function say both | A | People | 3 | panel round 1, 6–7 players | investigate first |
| Q8 | Verify "every jarl Kin after one succession" (41A.8, one run, unverified) with a harness count of kin after each crown | A | Sound | 3 | 41A.8 | if real, it hollows the Oath |
| Q9 | Taps per quiet year, counted: a driver script that plays a repeat-raid year on the phone driver and counts taps; target ≤ 3 + the battle's one tap | A | Thumb | 3 | TODO 20 (two taps) | number for the rubric's Thumb row |
| Q10 | levi loses 2% of fights (band 3–15). Judge first: the persona only sails at ≥ 0.7 odds and turns home; the band may be asking the wrong thing. If the fight cannot go wrong for a careful player, that is the "automatic win" again | A | Teeth | 3 | run 0 WARN | tuning only with before/after; never the same constant twice |
| Q11 | Round 5 of the screen audit, the Hall pane, from the folded Hall of TODO 44: every state shot, the critique, three options. Ask Levi whether he still wants round 5 now that he reshaped the Hall himself | D | Juice | 3 | TODO 24 | prepare only |
| Q12 | LLM playtest round 2: two agents from `spring-850` (one in-genre, one outside), the brief's categories, to measure 41A and see the middle game nobody saw | A (evidence) | Want / People | 3 | LOG 15 "next round" | ~300k tokens per agent; run on the evidence cadence |
| Q13 | Mono micro-labels at 9.5 / 11 / 11.5 px: look at them on the phone shots; keep or lift to 12 | A | Thumb | 2 | lint | judge |
| Q14 | Draft the winter deck's list to sixteen cards (TODO 16) as a page for Levi; no card introduces a new noun | C (prepare) | Juice / Saga | 2 | TODO 16 | a list, not code |
| Q15 | Period names per anchor and "hire men at the thing" (41B.7) — a names table ready for his yes | C (prepare) | Saga | 2 | panel, history teacher | prepare only |

## Waiting on the Director (do not build; keep the recommendation current)

41B.5 paint the player's coasts (+ pinch-zoom, TODO 15) · 41B.6 named men on demand · 41B.7 period and tone · TODO 40 richer king coasts · TODO 28 stirs as noise · TODO 30 0.5 as a gamble · TODO 14 moving the hall · TODO 16 more winter events · TODO 17 unholdable shores · all of TODO 42 (42.1–42.9) · 43.4 portrait route · round 5 of the audit.

## Sources harvested (so a run does not re-read them)

- Levi's voice notes: `transcribe/transcriptions/2026-10-23_ring-giver-playtest-notes.txt` (all 15 handled, LOG session 3) · `2026-10-24_ring-giver-silver-arm-rings.txt` (not game feedback: a real-world arm-ring loyalty tier under House Hansen; out of the loop's scope, mentioned to Levi in run 0's report).
- LLM panel round 1: `docs/playtests/llm-round-1.html`; TODO 41A built, 41B.1–41B.4 decided and built; open clusters folded into Q7, Q12.
- TODO 1–44 read through run 0.
