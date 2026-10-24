# Screen audits

One round per screen, in order of how often a hand lands on them: 1 spring Map pane · 2 Winter sheet · 3 winter event card · 4 Fight sheet · 5 Hall pane.

Each round: screenshot every state of the screen (`tools/audit/shoot.sh`), critique it against the dopamine-audit mechanisms and the design laws, build three live alternatives in one artifact, Levi picks, the winner is built into the game, then the next screen.

| # | Screen | Audit page | Decision |
|---|---|---|---|
| 1 | Spring Map pane | https://claude.ai/artifact/BZLsmsJppbmJz16RN1pBJb (source: `1-spring-map.template.html`, data `1-spring-map.states.json`) | A, The Chart. Built 2026-10-23, commit 3c87a1d |
| 2 | Winter sheet | https://claude.ai/artifact/DSHVXj6S2YXbbcTWg4fDri (source: `2-winter-sheet.template.html`; states are inline, taken from `tools/audit/states/winter-*.json`) | A, The Ledger. Built 2026-10-23 (session 8) |
| 3 | Winter event card | https://claude.ai/artifact/HCnFYiyjm25E4SSc3oozDd (source: `3-winter-card.template.html`; states from `tools/audit/card-states.js`) | waiting on Levi · my pick A, The Turn |
| 4 | Fight sheet | | |
| 5 | Hall pane | | |

Round 1's template has three placeholders: `%%COAST%%` (the `const COAST_PATH` line from `coast.js`), `%%STATES%%` (the states JSON), `%%SHOT815%%` / `%%SHOT793%%` (base64 PNGs of the original). The mock-ups use the game's own tokens, the real coast path and real saved states, so they can be compared against the game honestly.

Round 2's template has `%%COAST%%` and `%%SHOT835%%` / `%%SHOT850%%`; its five states (793, 806, 835, 850, 802) are trimmed by hand into the page's `STATES`. The nine winter states under `tools/audit/states/winter-*.json` come from a second driven dynasty (seed `shots2`); `winter-fair` and `winter-starve` are patched by hand (a Fair-dealer title; a chest too small to feed the hall).

Round 3's template has `%%COAST%%`, `%%STATES%%` (the output of `node tools/audit/card-states.js card-birth-son card-wanderer card-gathering card-rival-strange-fell-kingslain card-rival-king-fell-slain card-suitor card-rival-strange-held card-agedeath-late card-rival-king-fell-slain-aged`) and `%%SHOT852%%` / `%%SHOT808%%` / `%%SHOTDEAD%%` (the shots `c3-rival-king-fell-slain-aged`, `c3-rival-strange-fell-kingslain`, `c3-kingslain-next`, resized to 390 px). The card states come from the persona playtests: `CARDS=tools/audit/states node tools/playtest/run.js --seeds 8` dumps one save per kind of winter card (`card-<kind>.json`, with `-aged`, `-late`, `gathering` and `agedeath` variants) and an index `_cards.json`. `states/` is gitignored, so regenerate them that way. `shoot.sh` learned `next=1` to see what follows a card.
