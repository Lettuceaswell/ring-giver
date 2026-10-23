# Sea King — Game Design Document

Working title. A mini-CK3 for one thumb. Viking Age dynasty, 793 onward, played one year at a time.
Mechanics and rationale only. Visual and technical decisions belong to the builder.

---

## 1. Pitch

You are a sea king with a hall, a warband, and a handful of named men. Every spring you place your men. Every summer the fleet sails. Every winter one card turns over. Raid or settle, hold or overreach, raise an heir or lose the jarls when you die. Play until the dynasty ends.

Teachable in a minute: **place your jarls, press Sail.** Arguable for years: *where, with whom, and what do you do when you win.*

## 2. Pillars

1. **Maximum depth per rule.** Five elements, each distinct, combining. No stat exists that another element could have expressed.
2. **Reward the reach.** Information arrives one beat at a time. You commit before you know; you choose at the peak.
3. **End on the peak.** Every reign ends with a Saga, a Heir, and an Oath. The last thirty seconds are a funeral and a coronation.
4. **Not live, not timed.** The year advances only when the player presses Sail. No obligation, no decay while away.

## 3. The five elements

### 3.1 Men
The only resource that fights, holds, or counts. A single pool at home.
- Men on the ship raid. Men on the land hold. Men at home eat.
- Men are led only by Notable Men. Men beyond anyone's Followability sit unled: no use, still fed.
- Men are bought with silver at the winter market. Nothing else creates them except sons coming of age.
- Losses are the only drain. A bad summer hurts for years.

**Why:** control, happiness, levies, garrison, overextension are all the same question — *where are your men this year?*

### 3.2 Notable Men
Named cards. The King is one; sons become them; the world supplies more. Three stats, 1–5 each:
- **Combat** — multiplies men on the ship.
- **Rule** — multiplies men on the land.
- **Followability** — how many men he can lead (F × 10).

A Notable Man is placed on exactly one of: the ship, a holding, or home. His men go with him.
Stats grow by doing: raiding feeds Combat, holding feeds Rule, a big win feeds Followability.

**Why:** the player never touches individual men. Five named cards instead of forty tokens. Pros and cons per man are read off three numbers.

### 3.3 Holdings
Rows the player owns. Each shows what it pays (silver per year) and its unrest. Each has one jarl slot.
- A held holding is contested each year (see §5). Win: it pays. Lose: it revolts and is lost.
- An unheld holding is not contested. It pays nothing and its unrest rises one step. One year empty is a gamble, two is a revolt.
- A holding quiet for five consecutive years raises a local Notable Man (Rule-heavy).
- A held holding reveals its neighbors on the map for free.

### 3.4 Shores
Rows the player can reach but does not own. Each shows loot, defenders, and whether it can be held.
- Each raid makes a shore poorer and better walled. Each quiet year slowly reverses it. Farming one coast dies on its own.
- Famous anchors (Paris, York, Dublin, Lindisfarne) are always rich. Every other shore's richness is rolled per dynasty.
- A jarl who walks at the Oath keeps his holding as a shore with his own stats as its defense.

### 3.5 Silver
Bought with loot and yield; spent on men, rumors, and oaths. Never a score.
- Holdings pay silver. Silver buys men. Men take holdings. One loop.
- Men at home cost silver each winter. Men on land are fed by the land. Men at sea are fed by loot.

**Why the upkeep:** "raid every summer" is pressure, not a rule. An idle warband drains the hall.

## 4. The year

One screen. Three phases. The year advances only on Sail.

**Spring — place.** Move cards between Ship, Holdings, and Home. Buy a rumor from the Wanderer. Choose the fleet's destination: a known shore, a rumored coast, or blind.

**Summer — sail.** One fleet, one destination, all sailing jarls together; Strength sums. Resolves as the Sail arc (§6). Holdings resolve their land contests the same summer.

**Winter — one card.** The market (silver → men). Then a single seeded event: a birth, a death, a fork, a rival sail sighted, a wanderer's arrival. Then the mortality roll if the King is past fifty.

## 5. One resolution rule

Every contest in the game is **Strength vs Strength**, shown as a bar before the player commits.

- Strength = stat × men.
- Ship: (Combat × men) vs shore defenders. Margin sets loot share and losses. Win big, loot big. Win narrow, bleed.
- Land: (Rule × men) vs holding unrest. Win: it pays. Lose: revolt.
- One seeded roll, small swing. The odds are always visible; the result never is until the ships come home.

**Why one rule:** combat, revolt, conquest, and reconquering a walked jarl are the same math. One bar to learn.

## 6. The Sail arc

The year's spine. Information arrives one beat at a time.

1. **Commit.** Jarls on the ship, destination chosen. Men already counted.
2. **Arrive.** Fog lifts on three provinces: the target and its two coastal neighbors, true numbers shown. Pick one.
3. **Fight.** The bar moves.
4. **Plunder or Stay.** On a win, if the shore is holdable: take the loot and come home, or forfeit the loot, keep the land, and leave that jarl standing. The holding appears as a new row.

Fog and discovery:
- The whole map starts dark. Fog lifts by arriving, or for free around a holding.
- The **Wanderer** sells rumors: a coast's name, and only rich coasts. Nothing else. Pay for a sure rich target, or sail blind and maybe find three fishing villages after a season gone.
- Rivers are coasts in a chain. Paris is three turns upstream.

**Why fog on a display-only map:** lifting fog is the best thing a map can do on a phone without being touched.

## 7. The reign ends

The King's age is on his card. Past fifty, every winter rolls against him; the odds are shown. The end is felt coming.

At death, three cards, in order:
1. **The Saga.** The reign's best year, replayed: the richest raid, the largest holding, the title earned.
2. **The Heir.** Pick a son. Stats shown.
3. **The Oath.** Each jarl, one at a time: kneel or walk. The check is his Followability against the heir's Rule.

Then the new King's first spring. Same screen, smaller kingdom.

Levers on the Oath, all pre-existing elements:
- **Raise the heir.** A son on a holding grows Rule while the King lives.
- **Marry daughters.** Daughters are cards. Marry one to a jarl and he is kin. Kin kneel.
- **Buy it at the knee.** A hesitating jarl shows a silver price scaled to his Followability. Pay, or let him walk with his holding.
- The dark fourth lever needs no rule: a jarl too big to trust can be sent somewhere dangerous first.

## 8. Growth: a life, not a menu

- **Starter build.** Pick the King: Ragnar leans Combat, Rollo leans Rule, Custom spreads 9 points across three stats. All start in 793 at age 20.
- **Stats grow by doing** (§3.2).
- **Forks** at ages 25, 35, 45, 55: two titles offered, earned by what he actually did, pick one. Four per life, never the same pair. First-pass titles: *Ironside* (halve ship losses), *Lawgiver* (unrest rises slower), *Ring-giver* (every jarl's Followability +1), *Far-sailor* (blind arrival reveals five, not three).
- The next fork shows on the King's card years ahead. That is the reach.

## 9. Where Notable Men come from

Each source skews the stats, so the player chooses what kind of man to go looking for.
- **Sons** come of age at 16, shaped by their parents.
- **The sea:** a shore sometimes offers a man instead of loot. Combat-heavy.
- **The land:** five quiet years on a holding raises a local. Rule-heavy.

When a Notable Man dies, his men walk home unled and wait for someone who can lead them.

## 10. Vassals who raid

Any jarl can be sent to sea. His holding stands empty that summer (§3.3). The loot is the King's; the fame is his — a big win grows his Followability. The man you send to get rich is the man who weighs the heir.

## 11. Daily seed and the family

A dynasty started today shares its world seed with every dynasty started today: same shore richness, same Wanderer rumors, same winter decks. The family compares dynasties by start date — same world, different choices. Rumors and winter cards on a given day are seeded by that day, so two players in the same year see the same offer.

## 12. What this game deliberately does not have

- No real-time, no timers, no decay while away.
- No map interaction. The map is a picture of the rows.
- No AI kings. The world pushes back through walls, unrest, and jarls who walked.
- No diplomacy screen, no council, no separate loyalty stat. The Oath is the only loyalty check.
- No currency other than silver; no prestige, piety, renown, or score.
- No accounts, no network. One dynasty per device, saved locally.

## 13. First-pass tuning (tune in play)

| Value | Start |
|---|---|
| Starting men | 40 |
| Followability → men led | F × 10 |
| Shore defenders | 20–150 |
| Holding unrest | 10–100, +10 per empty year, −5 per held year |
| Price of a man | 3 silver |
| Winter upkeep per man at home | 1 silver |
| Rumor | 20 silver |
| Mortality past 50 | 5% per year, +5% per year |
| Quiet years to raise a local | 5 |

## 14. Open questions

See TODO.md. Ordered by how much each one constrains the rest.
