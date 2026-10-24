# Sea King — Decisions Ahead

Ordered by how much each one constrains everything after it. Each carries a recommendation; Director's call.

## 1. When does the dynasty end?
"Play as long as you want" still needs a far peak. **Recommend:** the dynasty closes at 1066 with a Dynasty Saga — every king's best year in a row, ~8–10 generations at one year per turn. The world keeps going after if the player wants, untracked. One legible end that leaving feels natural at.

## 2. One fleet or many?
One fleet, one destination keeps the summer to one arc. **Recommend:** one fleet for the whole first version. If splitting is wanted later, make it a title (*Sea King*: the fleet may split in two), not a base rule.

## 3. How does the heir die?
What happens with no sons? **Recommend:** a daughter's husband inherits if she's married to a jarl; otherwise the strongest jarl takes the hall and the dynasty ends there. Marriage becomes a hedge, which it was.

## 4. The home hall
Is the starting hall a holding row like any other? **Recommend:** yes, with no jarl slot needed (the King's presence counts) and it cannot revolt — but it can be raided by a rival sail sighted in winter, with Strength vs Strength on the men left at home. Makes "everyone on the ship" a real risk.

## 5. Marriage mechanics
Daughters as cards is approved. Needs: who do daughters appear from, can the King remarry, do marriages bring men? **Recommend:** marriage brings no men and no silver. It only makes kin. Kin kneel. Keep it to one effect.

## 6. The winter deck
Which events, how many, seeded how. **Recommend:** ten cards max, every one touching an existing element (a birth, a jarl's death, a Wanderer visit, a rival sail, a fork). No card introduces a new noun.

## 7. Titles list
Four forks per life, two offered each, never the same pair. Needs ~12 titles total, each bending one existing rule. Draft the list, cut any that need a new stat.

## 8. Walked jarls as neighbors
Approved in principle. Needs: does a walked jarl ever come back, does he raid you? **Recommend:** he sits as a shore with his stats as defenders. Reconquer him and he is offered back as a Notable Man at Stay. No AI behavior.

## 9. Blind sail arrival on a huge map
Blind sailing lands "somewhere" — define somewhere. **Recommend:** the fleet picks a random dark coast within reach of the nearest holding; never across the map. Reach grows with holdings, so the world opens outward like it did.

## 10. Session boundary
The daily seed gives the family a shared world, but what ends a session? **Recommend:** nothing forces it. The Saga card at death is the natural stopping point; the year counter is always visible so the player can set their own ("I'll stop at 850").

## 11. Numbers
Everything in GDD §13 is a first pass. Tune only after the loop is playable end to end: one dynasty, three generations, one death.

---

## From playtest 1 (2026-10-23)

Levi's phone notes. What could be built was built (see LOG). These are the calls that change what the game *is*.

## 12. Why would the King ever stay home?
Right now sailing with the King is always right, so the choice is dead. Levi: being away should not cost; staying should be worth something when you can afford it. **Recommend:** the King at home does the one thing only a King does: he holds the hall. Fold this into item 4 (home hall as a holding): with the King home it pays its yield, and his held years grow his Rule the way a jarl's do. Rule is what the Oath weighs, so a King who can afford to stay home is buying his heir a smoother succession. No new rule, one existing rule pointed at the King.

## 13. The CK3 itch
Levi wants to touch his people: children, marriages, neighbors, an opinion system. Three pieces, cheapest first:
- **a. A Man card.** Tap any name and a sheet opens: his stats, his story (raids, held years, kin), and every action that exists for him (marry a daughter to him, send him to a holding or the ship). Marriage is already in the rules; it was just buried. **Recommend:** build this first; it is a screen, not a system.
- **b. Opinion.** Rather than a new stat, show the Oath verdict on every jarl's card now: "would kneel to Bjorn" / "would walk · price 45". It is the same check the Oath runs, shown early, so the player can act (marry, pay, send him somewhere dangerous). **Recommend:** this *is* the opinion system; no second loyalty number.
- **c. Neighbors.** **Flag:** real neighboring rulers you can treat with are AI kings, which the GDD rules out, and they roughly double the game. ~80% version: the neighbors you already have are the shores and walked jarls. One diplomatic act, **Tribute**: demand it from a beaten shore instead of holding it (pays less than a holding, needs no jarl, lapses if you lose a fight there). Your call. Either way, 13 wants its own session: CK3's systems one by one, keep / cut / reshape.

## 14. Moving the hall
Vestfold → Lindisfarne as a long game, with development catching up. **Flag:** development / culture is a new noun with its own clock. ~80% version, no new noun: a one-time **Move the hall** to any holding you have held five quiet years. The hall's yield becomes that holding's, "within reach" recomputes from there, the old hall becomes an ordinary holding. **Recommend:** decide 4 first (what the home hall is), then this falls out of it.

## 15. A real map
Built today: tap a coast to target it, dot size by loot, hollow dot for cannot-hold, Landfall shows the three. Still asked for, in order of cost:
- **Pinch-zoom and pan.** Cheap (one afternoon). **Recommend:** next session.
- **Tap a holding for its details.** Same sheet pattern as the Man card (13a). Cheap.
- **Real coastline art.** One SVG traced from a public-domain map of the North Sea / Baltic / Atlantic coasts, drawn in the Forge palette behind the dots. Medium; needs your eye on a draft before it is finished.
- **Regions with bonuses, Risk-style.** **Flag:** a region is a new noun on every shore. ~80% version: every shore already has a culture (norse, saxon, frank, gael). Hold every coast of one culture and earn a named bonus. Four regions for free. Your call.

## 16. More winter events
Levi likes them and is open to more. Item 6 capped the deck at ten. **Recommend:** raise the cap to sixteen once a list exists; draft the list next session; same rule as before, no card introduces a new noun.

## 17. Unholdable shores
Lindisfarne, Paris, Tours, Galicia, Lisbon cannot be held. It now says so before you sail. The question is whether that rule stays. **Recommend:** keep it, and let the world say why in one line each (a monastery, a walled city three turns upstream, too far). Famous shores that can never be owned are what keep raiding worth doing after the map is full.

---

## Decided 2026-10-23 (playtest-1 decision session)

**D1. Other kings: named rulers with a stance.** Five or six named rulers own the famous anchors. They do not take turns. Each has one stance number toward the King, moved by deeds. Stance unlocks marriage into his house, tribute either way, a joint raid, and he can send the rival fleet. Overrides GDD §12 "no AI kings" in this limited form; full AI kings stay out.

**D2. Everyone has a stance.** Every named man, jarl or foreign ruler, carries one stance number toward the King, shown in words on his card (devoted / loyal / cool / sour / hostile). One verb list moves it for both: gift of silver, a daughter in marriage, a share of loot, a feud, being sent somewhere deadly. Stance feeds the Oath; a hostile jarl can walk with his holding mid-reign. Overrides GDD §12 "no separate loyalty stat".

**D3. The King holds the hall.** Vestfold is a holding row with the King as its jarl. King home: it pays its yield, his Rule grows as a jarl's does, everyone at home warms one step in stance. King away: none of that, and the rival fleet finds the hall thin. The hall cannot revolt. Being away costs nothing beyond the uncollected benefit. Closes items 4 and 12.

**D4. Rulers' realms, with free land that runs out.** Each named ruler owns the coasts around his anchor, tinted on the map. Coasts between realms start unowned. Realms grow on a seeded clock: each ruler takes one adjacent unowned coast every few years (tune; ~8), never a coast the player holds. By the late game the map is full. Raiding in a realm sours its ruler, holding there sours him more, taking every coast of a realm breaks him: his anchor opens or he kneels. Levi: "there can be lands that are not under a king, but eventually they may be as all kings expand, not just the player."

**D5. Verbs live on a Man card, in spring.** Tap any name, jarl or ruler: stats, stance in words with its reasons, his story, and every verb that applies now (gift silver, marry a daughter to him, promise the next holding, send him, demand or pay tribute, sail together). Verbs cost silver, a daughter, or a placement; never a new resource. Winter cards stay the world's moves. **Rulers under fog:** a ruler is discovered like a coast. Until one of his coasts is seen he has no card and his realm is dark. See one, and the realm tints and his card opens. When a realm grows to touch a known coast, the winter card is his envoy, and that is how you meet him. The Wanderer can sell a king's name. Levi: "the right pace is discovering the new characters at the same pace as uncovering the fog."

**Build order:** stance on every man + the Man card with the verbs that already exist (marry, send) → the King holds the hall → named rulers on the anchors with stance, realms tinted, fog discovery, realm growth on the clock → ruler verbs (tribute, marry out, sail together) → break-a-realm bonus. Tune after.

**Status 2026-10-23 (session 4):** steps 1–3 built, plus the envoy card and the break (he kneels, the anchor opens). Gift silver was added as the one stance verb so stance could be worked on, not only read. Open: ruler verbs (tribute, marry out, sail together), promise-the-next-holding. See LOG.

---

## From playtest 2 (2026-10-23): the shell

Levi: "make it feel more like a game on my phone." He named the first two. All five are about the frame the game sits in, not the rules. Each carries a recommendation; Director's call.

## 18. Where does the menu live, and what is a new run?
Today "Start over" is inside the collapsed Dynasty `<details>` at the foot of the page, behind a `confirm()` dialog. On the phone it does not exist. **Recommend:** tap the top band (year + king) to open the **Hall sheet**: the dynasty rows, the seed line ("the seas of 23 Oct 2026"), and **New dynasty**. No dialog: the button becomes "Tap again · this dynasty is lost" for three seconds (undo-over-confirm, law 1). New dynasty goes to the setup screen. The abandoned or finished dynasty keeps only its Saga rows in a second key (`seaking-sagas`), listed at the foot of setup as **Past kings**. One live dynasty at a time, no slots. Same day, same seas stays the rule.

## 19. Panes, not a thread
The main screen is nine sections stacked into one scroll with the Sail button floating over it. **Recommend:** three panes behind a bottom bar, each fitting one viewport, swipe or tap between them: **Map · Ship · Hall**. Map: the map at full height (pinch-zoom from TODO 15 lands here), the destination row under it, the Wanderer as one row; kings' names and coasts are tapped on the map, so the Kings and Known shores lists go away. Ship: destination, Everyone aboard, the men aboard. Hall: men at home, the hall row and holdings, children, unled men. The band stays sticky, the Sail bar stays fixed under the tabs. The log and dynasty leave the main screen (see 22). Open on Map in spring: the game's one question is where to sail.

## 20. A quiet turn is two taps
273 years at eight taps each is 2,000 taps of chrome. Destination clears every autumn; the crew stays; summer and winter each push three or four sheets. **Recommend:** (a) the destination survives the year, so the Sail button reads "Sail for Lindisfarne again"; (b) the land summary, the hall eats, and the market fold into one **Winter** sheet with the market's buttons at its foot, and no line that says nothing happened; (c) an Arrive at a known coast with the three targets already seen skips its sheet when the destination was named (it only matters when sailing blind). The fork, the death, the Oath, the winter card keep their own sheets: those are the game.

## 21. The game shows what changed
Numbers change silently on re-render: silver drops, a jarl cools, a holding is gone, and the screen just looks different. **Recommend:** every scene records what it moved, and the next render shows it once: silver and men in the band tick and flash (pine up, oxblood down), a stance tag that moved carries its arrow for one turn, a lost holding leaves a struck-through row that fades at the next spring. No toasts, no sound. One rule: change is visible on the thing that changed, for one render.

## 22. The chronicle is a screen
The story lives in six log lines at the foot of the page and in winter cards that vanish when dismissed. **Recommend:** a **Saga** tab in the Hall sheet (18): every year as one block of its lines, newest first, the king's reign as the heading, the dynasty rows at the top. It is the same `s.log` grouped by year, with the winter card's text pushed into it. The end-of-dynasty card already reads the dynasty rows; it reads this too. Cap it at the live dynasty; past kings keep rows only (18).

**Build order:** 19 first (every other item hangs on where things sit) → 18 → 20 → 22 → 21. 19 and 18 are one session; 20 wants a playtest after.
