# Screen audits

One round per screen, in order of how often a hand lands on them: 1 spring Map pane · 2 Winter sheet · 3 winter event card · 4 Fight sheet · 5 Hall pane.

Each round: screenshot every state of the screen (`tools/audit/shoot.sh`), critique it against the dopamine-audit mechanisms and the design laws, build three live alternatives in one artifact, Levi picks, the winner is built into the game, then the next screen.

| # | Screen | Audit page | Decision |
|---|---|---|---|
| 1 | Spring Map pane | https://claude.ai/artifact/BZLsmsJppbmJz16RN1pBJb (source: `1-spring-map.template.html`, data `1-spring-map.states.json`) | A, The Chart. Built 2026-10-23, commit 3c87a1d |
| 2 | Winter sheet | https://claude.ai/artifact/DSHVXj6S2YXbbcTWg4fDri (source: `2-winter-sheet.template.html`; states are inline, taken from `tools/audit/states/winter-*.json`) | A, The Ledger. Built 2026-10-23 (session 8) |
| 3 | Winter event card | https://claude.ai/artifact/HCnFYiyjm25E4SSc3oozDd (source: `3-winter-card.template.html`; states from `tools/audit/card-states.js`) | A, The Turn. Built 2026-10-24 (session 10), commit 7b9957d |
| 4 | Fight sheet (Landfall, the fight, Plunder or stay) | https://claude.ai/artifact/T7ttHAvgb7SxcSNheD5bx9 (source: `4-fight-sheet.template.html`; states from `tools/audit/fight-states.js`) | waiting on Levi |
| 5 | Hall pane | | |

Round 1's template has three placeholders: `%%COAST%%` (the `const COAST_PATH` line from `coast.js`), `%%STATES%%` (the states JSON), `%%SHOT815%%` / `%%SHOT793%%` (base64 PNGs of the original). The mock-ups use the game's own tokens, the real coast path and real saved states, so they can be compared against the game honestly.

Round 2's template has `%%COAST%%` and `%%SHOT835%%` / `%%SHOT850%%`; its five states (793, 806, 835, 850, 802) are trimmed by hand into the page's `STATES`. The nine winter states under `tools/audit/states/winter-*.json` come from a second driven dynasty (seed `shots2`); `winter-fair` and `winter-starve` are patched by hand (a Fair-dealer title; a chest too small to feed the hall).

Round 3's template has `%%COAST%%`, `%%STATES%%` (the output of `node tools/audit/card-states.js card-birth-son card-wanderer card-gathering card-rival-strange-fell-kingslain card-rival-king-fell-slain card-suitor card-rival-strange-held card-agedeath-late card-rival-king-fell-slain-aged`) and `%%SHOT852%%` / `%%SHOT808%%` / `%%SHOTDEAD%%` (the shots `c3-rival-king-fell-slain-aged`, `c3-rival-strange-fell-kingslain`, `c3-kingslain-next`, resized to 390 px). The card states come from the persona playtests: `CARDS=tools/audit/states node tools/playtest/run.js --seeds 8` dumps one save per kind of winter card (`card-<kind>.json`, with `-aged`, `-late`, `gathering` and `agedeath` variants) and an index `_cards.json`. `states/` is gitignored, so regenerate them that way. `shoot.sh` learned `next=1` to see what follows a card.

Round 4's template has `%%COAST%%`, `%%STATES%%` (the output of `node tools/audit/fight-states.js fight-lv-win-rout-stay fight-lv-win-narrow fight-lv-stay-owned-many fight-lose-kingfell fight-lv-stay-walked-owned-many fight-lv-win-rout-late fight-lv-land-blind3 fight-lv-win-narrow-late fight-lv-win-narrow-kingfell`) and `%%SHOT838%%` / `%%SHOT921%%` / `%%SHOT967%%` / `%%SHOT810%%` (shots `f4-lose-kingfell`, `f4-lv-win-narrow-late`, `f4-lv-win-narrow-kingfell`, `f4-lv-stay-owned-many`, resized to 390 px). The summer states come from the persona playtests: `FIGHTS=tools/audit/states node tools/playtest/run.js --seeds 4` dumps one save per kind of summer scene (`fight-<kind>.json`: `land-blindN|aimed[-walked][-owned]`, `win-rout|victory|narrow` or `lose`, with `-fell`, `-kingfell`, `-stay`; `stay[-walked][-owned][-many]`; `fallen`, `fallen-king`, `ruler-met`, `nosail`), and `--persona levi --seeds 8` into a subdirectory gives Levi's own line (copied in as `fight-lv-*`) plus `_fightcount.json`, the frequencies. With `FIGHTS` set, `chooseTarget` is wrapped to stamp `s.pre4`, the crew and coast before the fight. The default run's md5 is unchanged.
