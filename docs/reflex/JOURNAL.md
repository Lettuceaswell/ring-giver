# The journal — one entry per run, newest first

Each entry: **Picked** (what and why, the class), **Predicted** (which band or judgment moves, by how much), **Measured** (the scoreboard before → after), **Shipped** (commit), **Lesson** (what to do differently; the next run reads this first), **For Levi** (calls filed, by number). A run that failed verification still gets an entry: what was tried, why it was reverted.

## Run 0 — 2026-10-26, the baseline (no game change)

**Built the loop:** `tools/reflex/measure.js` (gate + fuzz + persona bands + lints → `docs/reflex/metrics/`), `RUBRIC.md`, this journal, `QUEUE.md`, the `reflex` skill (`.claude/skills/reflex/SKILL.md`), the "run" trigger in CLAUDE.md. `tools/smoke.js` now seeds `Math.random` and pins the day (`SEED=`, `DAY=`): before this, two runs of the gate were two different dynasties (the game's `uid()` draws on `Math.random`, and something downstream of the ids changes fates), so a failure could not be reproduced. The fuzz smoke runs a new seed every hour for exactly that reason.

**Measured (baseline, 8 seeds, HEAD 8197fc6):** gate ok on seed `smoke` (793→863, 4 lines) · fates `c06892e611e1` · bands: 10 pass, 2 WARN — **levi loses 2% of fights** (band 3–15) and **idle silver 903** (careful personas' chest average; band ≤ 300; the hall-sitter alone sits on ~1,700). Lints: `#fff`/`#000` in the fog mask (exempted: luminance, not colour), mono labels at 9.5 / 11 / 11.5 px (Q13).

**Found:** an unseeded smoke run failed once with `step 47 40` (Q1): a man over his cap cannot step down to the next five. Not yet reproduced on a fixed seed.

**Lesson, seeded for run 1:** the two WARNs are the two oldest complaints on record (Levi's "optimizing an automatic win", the panel's "nothing to buy by year seven"). The second has a signed build order (41B.2: buildings → raise the hall → second ship), so the loop's main road for the next several runs is Q2 → Q3, with Q1 and small A items in between to keep every run shipping something. Do not touch `T` to chase the 2% until Q5's dead-choice measurement says what the fight's floor should be.

**For Levi:** nothing new filed. Waiting as before: 41B.4–7, 42.1–9, TODO 15 (pinch-zoom by number), round 5 yes/no. The 2026-10-24 voice note (real silver arm rings for top contributors) is not a game item; it belongs with House Hansen, not in this queue.
