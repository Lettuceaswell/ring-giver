---
name: reflex
description: Ring Giver's reflexion loop. One run = orient → measure → harvest → reflect → pick one item → build → verify → ship → journal → report. Use when Levi says "run", "/run", "reflex", "next run", "make it better", or "iterate" in this repo. Every run leaves master one verified, pushed commit better and the journal one entry longer; it never builds a parked decision.
---

# reflex — one run

You are the builder of Ring Giver under CLAUDE.md's North Star. Levi is the Director: he decides, you build what is decided and what needs no decision, and you prepare the rest for him to call by number. One run is one improvement, verified and live. Do not ask questions mid-run; file them. Keep going until step 9 or a clean revert. Work in the game's voice (read three LOG entries and you have it); write code that reads like the code around it.

## 0. Orient (read, do not build)

In this order, skimming: `docs/reflex/RUBRIC.md` · `docs/reflex/JOURNAL.md` (the last two entries; the Lesson lines are instructions to you) · `docs/reflex/QUEUE.md` · `docs/TODO.md` (search for "Decided" lines newer than the last run: a new decision by Levi moves an item from C to B) · the head of `docs/LOG.md` · `git log -8 --oneline` · `git status --short`.
If the working tree has uncommitted changes to game files (`*.js`, `index.html`, `sw.js`), stop and report: someone is mid-work. Docs-only changes are fine.

## 1. Measure

`node tools/reflex/measure.js --tag before` (about 30 s). Read the scoreboard against the previous `docs/reflex/metrics/latest.json` (measure.js prints "(was …)"):
- GATE FAIL → the fix is this run's item, whatever the queue says.
- A band that moved out since the last run → regression; it is the item.
- The fuzz FOUND a failure → record its seed in the QUEUE as an A item (reproduce with `SEED=<seed> node tools/smoke.js`). If the queue's top is lower than a Sound item, take the fuzz find.
- `fates` changed with no change to `game.js`/`world.js` since the last metrics → nondeterminism; it is the item.

## 2. Harvest new evidence (five minutes, not more)

- New voice notes: `ls /mnt/g/Projects/transcribe/transcriptions/ | grep -i ring` against the QUEUE's "Sources harvested"; read a new one and turn each game point into a QUEUE row (Levi's own words are the strongest evidence there is; his taste outranks the panel's).
- New decisions in TODO.md (step 0) → reclass queue rows.
- Smoke `BAD` lines, lints, WARN bands → rows if not already there.
- Every sixth run, or whenever fewer than three A/B rows score ≥ 3: an **evidence run** instead of a build: pick one of — the dead-choice test (Q5), two LLM playtesters from a late save (`tools/playtest/llm/README.md`, start with `--from tools/audit/states/spring-850.json`, the brief and a persona each), a screenshot sweep of one screen through `tools/audit/shoot.sh` read by eye at 390×844, or a persona that exercises verbs no persona calls yet. Its deliverable is findings in the QUEUE with evidence, and a JOURNAL entry; it still ships (the harness or state files it made).

## 3. Reflect, in writing, before acting

Open the JOURNAL. Under a new heading `## Run N — <date>`, write **Reflection on run N−1** first: did its Predicted line come true in today's `before` measure? What did it miss? One or two sentences, honest. This is the part that makes the loop learn; skip it and the loop is just a cron job.

## 4. Pick one item

From the QUEUE, the top row that is class A or B, whose dimension was not the pick in the last two runs (variety), and that fits one run: ≤ ~150 changed lines typical, ≤ ~45 minutes of work. If the top row is bigger, take its first sub-step and leave the rest as rows. Never a C or D row (prepare them only: a page under `pages/`, a TODO entry with a recommendation, a mock through the audit kit). Write **Picked** and **Predicted** in the JOURNAL entry now (which band or judged question should move, by how much, or "no number: judged by …").

## 5. Build

House rules that every change obeys:
- Numbers come from the rules (`T`, `fCap`, `holdPay` …), never typed twice; one sentence before the sums; the odds in one vocabulary (`oddsWords`, `holdWords`, `pct`, `nMen`).
- No new noun, currency, screen or dialog without a decision in TODO. Every dismissible sheet has a sticky title row with ×. Undo over confirm (the two-tap arm). Change shows once on the thing that changed. No toasts, no sound.
- Colours are tokens in `index.html`; type is Fraunces / Hanken Grotesk / JetBrains Mono; radius 2 px; nothing under 12 px except mono micro-labels you have looked at.
- Saves: any new field is filled in `migrate()`; the smoke's reload check must stay green.
- Copy in the saga register, specific to Viking history; names and places from `world.js`; three to five variants in `LINES` for anything a player reads every year.
- A tuning change: `node tools/playtest/run.js --seeds 8` before and after in the JOURNAL; never the same constant two runs running.
- Bump `V` in `sw.js` when any cached file changed (`measure.js` lints this).
- If the item adds a verb, teach a persona to call it (`tools/playtest/personas.js`) in the same run, so the harness keeps measuring the game that exists.

## 6. Verify

`node tools/smoke.js` must print OK. `node tools/reflex/measure.js --tag after`: the gate ok, no band moved out, lints not worse. For any UI change: `tools/audit/shoot.sh setup` (re-run after editing `index.html`), shoot the states the change touches (`tools/audit/gen-states.js` makes saves; `shoot.sh NAME 'state=…&pane=…'`), and **look at the PNGs** with the Read tool at 390×844: overflow, collisions, contrast, truncation. For a rule change, also read one real sheet that shows its numbers.
If verification fails and the fix is not obvious inside ten minutes: `git checkout -- .` on the game files, keep the JOURNAL entry, write what failed and why under **Lesson**, and move the row down with the reason. A clean revert is a successful run.

## 7. Ship

Commit on master in the repo's voice (`Reflex N: <what changed, plainly> (Q#, TODO #)`), ending with the attribution lines the session gives you. `git push origin master` — Pages is the deploy (Levi's standing instruction: push and deploy without asking). Then:
- `docs/LOG.md`: a short entry at the top, `## <date> (reflex run N: <title>)`, three to eight lines: what shipped, what was verified, the numbers.
- `docs/TODO.md`: mark an item built, or add a numbered item (continuing the numbering) for anything that needs Levi's call, with a recommendation.
- `docs/reflex/QUEUE.md`: strike the shipped row with "run N", add the rows harvested, reorder, update "Sources harvested".
- `docs/reflex/JOURNAL.md`: fill **Measured**, **Shipped**, **Lesson**, **For Levi**.
- Commit the docs (same push or a second).

## 8. Report to Levi

Ten lines at most, in the terminal: what shipped and why it was the pick · the numbers that moved (before → after) · the live URL (https://lettuceaswell.github.io/ring-giver/) · what is waiting on him, by number, one line each · the next run's likely pick. No preamble.

## 9. Never

Build a C or D row · reverse a recorded decision · redesign a screen whose audit round is decided · add a currency, score, piety, prestige or intrigue · touch `T` without before/after · force-push, rewrite history, delete remote branches · ask Levi a question the TODO could carry · spend the run reading (orient is five minutes; the harness is the truth) · leave the tree dirty.
