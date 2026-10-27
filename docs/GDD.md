# Ring Giver — Game Design Document

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
- Losses are the only drain, and a chest that cannot feed the hall: each man short of silver walks. A bad summer hurts for years.

**Why:** control, happiness, levies, garrison, overextension are all the same question — *where are your men this year?*

### 3.2 Notable Men
Named cards. The King is one; sons become them; the world supplies more. Three stats, 1–5 each:
- **Combat** — multiplies men on the ship. A named man aboard also fights with his own arm: he counts as one man at his Combat, whether or not he leads any.
- **Rule** — multiplies men on the land. The King's Rule is his hall's pay (a third of Vestfold's yield for each point) and his reach (4 + 2 × Rule holdings before they stir), since a King never holds a coast himself.
- **Followability** — how many men he can lead (F × 10).

Named men are not safe aboard: each may fall in a lost fight or a bloody win, the King too. Past sixty they die in their beds.

A Notable Man is placed on exactly one of: the ship, a holding, or home. His men go with him.
Stats move both ways (TODO 47, decided 2026-10-26). They rise by doing, slower each step: Combat after 2, 3, 5, 8 raids, Rule after as many summers held, Followability after 1, 1, 2, 3 big wins (or, for a King who sits his hall, after 2, 3, 5, 8 summers at home). They fall by what goes wrong: a lost fight takes a step of Combat from the man who led the most men in, a holding lost takes a step of Rule from its jarl, a named man who walks from a hungry hall or with his holding takes a step of the King's Followability, and the arm goes at 50 and 60. Swept at 16 seeds (TODO 47): 3/5/8/12 with the arm at 46 took the King's Combat from 4.9 to 3.7 and doubled the idle chest. Five is the height; the marks of the blood (42.2) are the only sixth.

**The wife, and the blood (42.2, built session 20).** A King takes a wife in spring from the hall: a jarl's daughter (the jarl is kin then), a king's daughter (her father is an ally while she lives: his stance cannot fall below cool), or a free woman of a coast he holds (no house, no politics). Births need her, and stop past her forty-fifth winter. Each child is born with each stat from the better parent and each mark of the blood (Strong, Wise, Beloved: that stat may reach six) at a coin's toss, four in five when both parents carry it. She holds the hall as regent for a son under sixteen whenever a jarl stands with her; the loyal jarl of 41B.1 is the fallback. A new King takes his own wife; the widow goes home to her people. She is a card like a man's, with no verbs.

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

**The card itself (screen audit 3, built 2026-10-24).** The event is a card that lies face down on the winter night and turns; its kind sets its tone (grave oxblood, good pine, warning chestnut, routine iron). Its effects carry their numbers, other news of the winter sits under it as short rows, and it warns of what is coming: a king's fleet gathering (it sails a year later if he stays hostile) and benches full (no new man comes). Past fifty the mortality roll is turned on the card as the King's own card, from the same seed, so the odds and the fate are unchanged; only the moment is shown. The death card names how he died and who takes the hall, or that the line is broken. No two living men or children of a hall share a name.

## 5. One resolution rule

Every contest in the game is **Strength vs Strength**, shown as a bar before the player commits.

- Strength = stat × men.
- Ship: (Combat × men) vs shore defenders. Margin sets loot share and losses. Win big, loot big. Win narrow, bleed.
- Land: (Rule × men) vs holding unrest. Win: it pays. Lose: revolt.
- Up to three seeded exchanges (the landing, the shield wall, the press), each a roll of the ship's strength on the day (0.82 to 1.18); the mean of the exchanges fought must beat the defenders, and a side breaks early once the rest could not save it (the coast at twice its number, the ship at half). Luck is in play in about 6% of fights. The odds are always visible; the result never is until the battle is fought on screen.

**Why one rule:** combat, revolt, conquest, and reconquering a walked jarl are the same math. One bar to learn.

## 6. The Sail arc

The year's spine. Information arrives one beat at a time.

1. **Commit.** Jarls on the ship, destination chosen. Men already counted.
2. **Arrive.** Fog lifts on three provinces: the target and its two coastal neighbors, true numbers shown. Pick one.
3. **Fight.** The battle is played on the night (screen audit 4, built 2026-10-24): the ranks as marks, the King's in accent, each named man a chip with his chance to fall; each exchange shows its real roll, the ranks close, men fall at scattered moments, a named man's fall is called on the field (and the phone buzzes where it can); the verdict stamps; then the reckoning: loot, men and their worth in silver, the net, the coast arming, a ruler's stance, and the crew, man by man. A tap skips it.
   **Turn for home.** At Landfall, the ship may turn for home instead: the summer is spent, no loot, no blood.
4. **Plunder or Stay.** On a win, if the shore is holdable: take the loot and come home, or forfeit the loot, keep the land, and leave that jarl standing. The holding appears as a new row. The sheet is a trade: the loot now against the rent a year and the summers to earn it back, the unrest, the ruler's price, and each jarl's chance to hold next summer with his men and with his full following.

**The King's risk.** Every named man aboard may fall; the chance is the same for each and is shown where the choice is made (the spring commit sheet, Landfall) and on the battle. Board all leaves home a man with no one to lead.

**The return.** Where a coast is chosen (the picker, Landfall) each seen coast shows its **profit**: the loot the raid should bring less the men it should cost at the market price, averaged over every day the rolls could bring. The list runs most profit first; under a coast, only its catch (the King may fall, the fight may be lost, its king turns colder, it cannot be held). The chosen coast's full account (loot, men lost, its king, its rent) is on the commit sheet with the odds.

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

- **Starter build.** Pick the King: Ragnar leans Combat (a King who sails), Rollo leans Rule (a King who sits his hall: it pays twice Ragnar's, and his land runs further before it stirs), Custom spreads 9 points across three stats. All start in 793 at age 20.
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
- No AI kings that play turns. Named rulers exist (§15) but they hold a stance, not a strategy. The world pushes back through walls, unrest, realms that grow on a clock, and jarls who walked.
- No council, no separate screens per system. The Man card (§15.4) is the one place a person is acted on.
- No currency other than silver; no prestige, piety, renown, or score. Stance is a view of you, not a currency.
- No intrigue: no schemes, spies, murder plots or secrets. No faith currency, and no reformation of the Old Gods: a man or a coast keeps a faith, it is never a number (42.4). (42.1, decided 2026-10-26.)
- No accounts, no network. One dynasty per device, saved locally.

Revised 2026-10-23 after playtest 1. Earlier versions also ruled out map interaction, AI kings of any kind, and any loyalty stat; the playtest overturned those (§15).

## 13. First-pass tuning (tune in play)

| Value | Start |
|---|---|
| Starting men | 40 |
| Followability → men led | F × 10 |
| Shore defenders | 20–150; ×1.3 after a win (cap 1000), ×1.1 after a loss, ×0.965 a year back toward its own |
| Holding unrest | 10–100, +10 per empty year, −5 per held year |
| Price of a man | 3 silver |
| Winter upkeep per man at home | 1 silver; a man leaves for each silver short |
| Rumor | 20 silver |
| Mortality past 50 | 5% per year, +5% per year |
| Named man falls aboard | lost fight loss share × 0.25; bloody win (loss share − 0.2) × 0.25; in the exchange that cost the most, by lot |
| The battle | up to 3 exchanges, each roll × 0.82–1.18; mean of the exchanges fought vs defenders; a side breaks at 2× / 0.5× |
| Old age past 60 | 4% × (age − 60) a winter |
| Quiet years to raise a local | 5 |
| Stance bands | devoted ≥60 · loyal ≥20 · cool · sour ≤−20 · hostile ≤−60 |
| Stance moves | loot share +5 (rout +10), lost fight −5, held +3/yr, lost holding −10, given land +10, marriage +30, gift +15, feud −10, idle −3/yr, summer home with the King +5; new king halves all |
| Gift of silver | 20 (a king 60), once a year |
| Hostile jarl walks | 35% a summer |
| Realm growth | one free coast per ruler every 30 ± 8 years |
| Realm break | all coasts held for 3 summers |
| Hostile king strikes | 30% a summer at a holding that was his; host 40 + 20 per free coast; he warms +20 if he wins |
| King's fleet | only after a full year hostile |
| Fallen hall | kills a named man at 0.5 × (1 − 3 × guard/fleet) × chest/300 (0–2; a strange fleet needs a chest); the King at chest/300, at most 0.75 |
| Hungry winter | every jarl −10 (−5 at a holding); the sourest at home leaves |
| Bench cap | 8 named men without a holding; then no wanderer or local comes |
| Long reach | past 10 holdings, each stirs at 0.3% × excess a summer (max 5%) |
| Births | weight 7 under two children, else 4 |
| Raid / hold in a realm | −10 / −25 to its king |

## 14. Open questions

See TODO.md. Ordered by how much each one constrains the rest.

## 15. People and kings (decided 2026-10-23, playtest 1)

The CK3 itch, scratched with as few new nouns as possible: one number (stance), one roster (named rulers), one screen (the Man card).

### 15.1 Stance
Every named man, jarl or foreign ruler, carries one stance toward the King, shown in words on his card: devoted, loyal, cool, sour, hostile. Deeds move it, the same list for everyone: a gift of silver, a daughter in marriage, a share of loot, a feud, a promise kept or broken, being sent somewhere deadly, raids inside a ruler's realm, a hall the King winters in. Stance feeds the Oath (with kin and Followability vs Rule, as before). A hostile jarl can walk with his holding mid-reign, not only at a death. Stance is a view of the King, not a currency; it cannot be spent, only earned.

**Why:** the player wants to read his people and work on them. One word on every card does that; a second loyalty number would not add anything the Oath could not already say.

### 15.2 The King holds the hall
Vestfold is a holding row with the King as its jarl. King home: it pays a third of its yield for each point of his Rule (session 13; before, the full yield whatever his Rule), his Rule grows as a jarl's does, and everyone at home warms one step in stance. King away: none of that, and the rival fleet finds the hall thin. The hall cannot revolt. Being away costs nothing beyond what was not collected.

**Why:** sailing with the King was always right, so it was not a choice. Now the King at home is doing the one thing only a King can do.

### 15.3 Named rulers and realms
Five or six named rulers own the famous anchors: a king at York, the Frankish king behind Paris, the king of Dublin, a rival sea king in Hordaland, and so on. They do not take turns. Each has a stance (§15.1) and a realm: the coasts around his anchor, tinted on the map. Coasts between realms start unowned. Realms grow on a seeded clock: each ruler takes one adjacent unowned coast every few years, never a coast the player holds, so free land runs out over the centuries and the late game is all kings.

Raiding in a realm sours its ruler; holding one of his coasts sours him more. Take every coast of a realm and hold them three summers and he breaks: his anchor opens to be held, or he kneels and his stance pins to loyal. That is the region bonus, and the path to it is drawn on the map.

Rulers come out of the fog like coasts. Until one of his coasts is seen a ruler has no card and his realm is dark. See one and the realm tints and his card opens. When a realm grows to touch a coast the player knows, that winter's card is his envoy arriving. The Wanderer can sell a king's name the way he sells a rich coast.

**Why not AI kings:** a ruler who plays turns doubles the game and never balances. A ruler with a stance and a clock gives the player someone to treat with, marry into, and break, at the cost of one number and a schedule.

### 15.4 The Man card
Tap any name, jarl or ruler, and a sheet opens: his stats, his stance in words with the reasons under it, his story (raids, held years, kin, what he did at the last Oath), and every verb that applies right now. Verbs: gift silver, marry a daughter to him, promise him the next holding, send him to the ship or a holding, demand or pay tribute, sail together. Every verb costs silver, a daughter, or a placement; none creates a new resource. Verbs happen in spring. Winter cards stay the world's moves against the player.

**Why one card:** on a phone, one place to go to work on a person. The card is the diplomacy screen, the council, and the family tree at once.

## 16. The shell (decided 2026-10-23, playtest 2)
The frame the game sits in on a phone. Decisions 18–22 in TODO.md.

**Panes.** The screen is a band, one pane, and a foot. Three panes behind the foot's tabs: **Map** (the map at full height, the destination row, the Wanderer), **Ship** (destination, Everyone aboard, the men aboard), **Hall** (men at home, the unled, the hall row and holdings, children). The Sail bar sits above the tabs. The page itself never scrolls; a pane does. Known shores and the Kings list are gone: a king is tapped by his name under his seat on the map.

**The band.** Year, king, silver, men. Tapping it opens the **Saga** sheet: every reign as a row, the chronicle grouped by year with a heading where the king changes, and **New dynasty**. No dialog: the button arms for three seconds and reads "Tap again · this dynasty is lost". A dynasty that ends or is given up keeps only its reign rows, under **Past kings** on the setup screen (`seaking-sagas`, twenty at most). One live dynasty, no slots.

**A quiet turn is two taps.** The crews who sailed board again in spring; the destination stands until the coast is ours or forgotten, and the button says "again". A coast already seen skips Landfall and goes straight to the fight. The land's lines, the hall's upkeep and the market are one **Winter** sheet. The market says what the choice is: price, upkeep, and how many more men the named men can lead before new men sit unled.

**Change shows once.** Silver and men that moved since the band was last in view tick beside the number for one render. A stance that moved this year or last carries an arrow on its tag. A holding lost last summer stays on the Hall pane, struck through, until the next spring. No toasts, no sound.

**The chronicle.** `s.log` is `{y, t}`: fights lost, plunder, stays, marriages, walks, revolts, realm growth, winter cards. The yearly rent roll stays on the Winter sheet.

**The map.** Real coast: Natural Earth 10m land (public domain), clipped to 12°W–34°E, 36°–64°N, Mercator, simplified to a 40 KB path in `coast.js` by `tools/coast.py`. Every coast is placed by longitude and latitude through the same projection; the crop still follows the known coasts, so the world opens outward as before, but Denmark is Denmark.

**The chart (decided 2026-10-23, screen audit 1).** On the Map pane the map is the whole screen. The band floats over it; a commit sheet sits at the foot: where, the odds, and one plank that carries the odds' temperature. The known world is lit, the rest of the coast lies in fog, and the crop follows the lit pool, so the map itself shows how far the dynasty has come. Two chips over the water: the Wanderer and the crew. Spring opens with one beat, under a second, with nothing to dismiss: the band counts, the fog opens, last summer's coasts bloom, the route draws. Sail is a departure: the ship leaves along the route before the summer's sheet rises. The first spring teaches on the thing itself: a coast pulses until it is tapped, then the crew chip until men board.
