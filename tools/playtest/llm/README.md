# LLM playtesters

Opus subagents with personas play the real UI on a phone through `drive.js` and log opinions. Round 1 (2026-10-24): `docs/playtests/llm-round-1.html`, TODO 41, LOG session 15. General notes toward a skill: `~/Projects/claude-agents/notes/agent-playtesting.md`.

## Run a round

1. `npm install` here once (`playwright-core`; uses the system Chrome via `channel: 'chrome'`). ImageMagick for the report's thumbnails.
2. Smoke the driver by hand: `node tools/playtest/llm/drive.js smoke start`, tap a king, `go`, tap a coast, the crew, Sail, `go` to autumn. Every command prints the screen and the tappables.
3. Dry-run one agent (Agent tool, `model: "opus"`, `general-purpose`): prompt = read `brief.md`, read `personas/<name>.md`, `drive.js <name> start`, play, write `out/<name>/review.md`, reply with one line. Check `out/<name>/notes.jsonl` stamps and the token count, then launch the other seven in one message.
4. `node tools/playtest/llm/collect.js` → `out/all.json`. Cluster the notes with a Sonnet agent into `out/clusters.json` (schema in `report.js`: issues / delights / wishlist, each with id, title, kind, agents, inGenre, outGenre, worstSeverity, noteCount, screens, firstYear, quotes[{agent, handle, year, kind, shot, text}], bug). Extract ratings into `out/ratings.json` (`{agent: {onboarding..overall}}`).
5. `node tools/playtest/llm/report.js` → `docs/playtests/llm-round-N.html` (edit `FINDINGS`, `DECISIONS`, `SMALL_BUGS` and the title inside first). Publish as an artifact.

## Next round

- Start two agents from saved late states: `drive.js <name> start --from tools/audit/states/spring-850.json` (`gen-states.js` makes them).
- Vary the world seed per agent (shim `Date` in the driver's init script) and keep two on the shared seed.
- Add `tap a,b,c` chains; agents over-tap steppers and lists.
- `collect.js` should list screen kinds seen per agent (coverage).
- Add a reload step to `tools/smoke.js`: both pre-play bugs were reload bugs.
