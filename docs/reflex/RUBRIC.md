# The rubric — what "better" means, run after run

The North Star (CLAUDE.md): *in tension with the constraints of a mobile-facing PWA "thumb tapping" app, stealing anything that's not nailed down, the best of the best, from Paradox games (CK3 first), merged with new and different state-of-the-art methods, yielding the most compelling high-strategy game exploring specifically Viking history.*

This file turns that sentence into dimensions the loop can score. Each run measures what can be measured (`node tools/reflex/measure.js`), judges what cannot against the questions below, and picks the one change that moves the furthest-from-target dimension the most for the least risk. Scores live in `metrics/`, the reasoning in `JOURNAL.md`, the candidates in `QUEUE.md`.

## The seven dimensions

| # | Dimension | The North Star clause | Measured by | Judged by |
|---|---|---|---|---|
| 1 | **Sound** | (everything) | smoke gate on the fixed seed; the fuzz smoke; reload invariants; `migrate` on old saves; sw file list; no `undefined`/`NaN`/"1 men" in a render | a hand-played spring, summer and winter on the phone driver after any UI change |
| 2 | **Teeth** (a bad plan loses) | high-strategy | persona bands: raider ≥ 75% break, reckless ≥ 50%, miser ≥ 35%; careful personas ≥ 75% reach 1066; levi loses 3–15% of fights; luck in play 4–10%; levi's King falls ≤ 3 a line | does any choice dominate (the dead-choice test: a persona that always does X vs one that never does, same outcome = dead choice) |
| 3 | **Want** (something to reach for) | compelling | idle silver: careful personas' chest average ≤ 300; levi's holdings at 850 within 8–30 (not every coast); late raids that lose money (`FIGHTS=` count) | year-seven test: name what a player in 800, 850, 900 is afraid of and what he is saving for. If either answer is "nothing", this dimension is red |
| 4 | **People** (the CK3 itch) | CK3 first and foremost | verbs on the Man card that a persona can call (count); stance moves a player can cause per reign; decisions per reign that are about a person, not a coast | can the player *read* a man (why he feels as he does) and *work* on him (three verbs that change it)? Does a death feel like a loss? |
| 5 | **Thumb** (the phone) | mobile PWA, thumb tapping | taps per quiet year (target ≤ 3 for a repeat raid); every sheet has a sticky title with ×; no font under 12 px except mono micro-labels; nothing needs a horizontal scroll at 390 px; bundle ≤ 450 KB; offline start works | the law list (app-design-laws skill): undo over confirm, teach on the thing itself, change shows once, one sentence before the sums |
| 6 | **Juice** (earned reward) | compelling, state of the art | big moments that get a card rather than a ledger line (count the kinds in `s.big` / `momentCard` against the list of things that can happen) | the dopamine-audit skill, one screen at a time: anticipation → reveal → consequence; motion that means something; the slow beat kept for the big moments |
| 7 | **Saga** (Viking history, the voice) | specifically Viking history | `LINES` variants per card kind (≥ 3 each); famous places with their line; names from the right half-century per anchor | the writing reads as saga, not UI copy; the history teacher persona's notes (41B.7); nothing a Dane of 850 would find silly |

Weights when choosing: Sound outranks everything (a regression is always the next pick). Then whichever of Teeth / Want / People is furthest from target, because they are the game. Thumb and Juice are the frame and get a turn when the game dimensions are inside their bands or blocked on the Director. Saga rides along with every copy change.

## Classes of work (the gate on what the loop may build)

- **A — no decision needed.** Bugs, copy, tests, lint, the UI saying what the rules already do, a measurement, a harness. Build at once.
- **B — decided, not built.** Anything Levi has called by number in `docs/TODO.md` ("Decided (Levi …)") with a build order. Build in that order. Prices and numbers for B items are set with the persona harness, before and after, 8 seeds or more.
- **C — undecided or parked.** Every item marked undecided (all of TODO 42, 41B.4–41B.7, 43.4+, 40, 28, 30 as judgments), any new noun, currency or screen, any change to an audit round's chosen option (TODO 24, rounds 1–4). **Never built.** The loop may prepare: a mock, a measurement, three options in one page, a TODO entry with a recommendation. Levi answers by number.
- **D — taste.** A redesign of a screen, a new look, a new sound, a new animation idea. Prepared like C (the screen-audit pattern: every state shot, a critique, three live options, one marked as the pick). Defects inside the chosen design (overflow, collision, contrast, a 7.5 px label) are A.

## Tuning rules

- Every number lives in `const T` (game.js) or `world.js`. A tuning change needs the harness before and after (`measure.js` does this) and a JOURNAL line with the two scoreboards.
- Never the same constant two runs in a row. A change that moves a band toward its target but pushes another out is not a change; revert it and journal both numbers.
- Bands in `measure.js` are the rubric's targets. They move only with a JOURNAL entry that says why, and never to make a run pass.

## What a run must leave behind

A commit on master that passes the gate, a JOURNAL entry (what was picked and why, the prediction, what the measure said after, the lesson), the QUEUE reordered, the LOG with a short session line, TODO updated if an item closed or a new call for Levi was filed, and the live site updated by the push.
