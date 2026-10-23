# Sea King — progress log

Newest first. Read this before touching anything.

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
