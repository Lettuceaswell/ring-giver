# Screen audits

One round per screen, in order of how often a hand lands on them: 1 spring Map pane · 2 Winter sheet · 3 winter event card · 4 Fight sheet · 5 Hall pane.

Each round: screenshot every state of the screen (`tools/audit/shoot.sh`), critique it against the dopamine-audit mechanisms and the design laws, build three live alternatives in one artifact, Levi picks, the winner is built into the game, then the next screen.

| # | Screen | Audit page | Decision |
|---|---|---|---|
| 1 | Spring Map pane | https://claude.ai/artifact/BZLsmsJppbmJz16RN1pBJb (source: `1-spring-map.template.html`, data `1-spring-map.states.json`) | A, The Chart. Built 2026-10-23, commit 3c87a1d |
| 2 | Winter sheet | | |
| 3 | Winter event card | | |
| 4 | Fight sheet | | |
| 5 | Hall pane | | |

The template has three placeholders: `%%COAST%%` (the `const COAST_PATH` line from `coast.js`), `%%STATES%%` (the states JSON), `%%SHOT815%%` / `%%SHOT793%%` (base64 PNGs of the original). The mock-ups use the game's own tokens, the real coast path and real saved states, so they can be compared against the game honestly.
