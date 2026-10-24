# Balance levers in Ring Giver (inventory for TODO 25)

Line numbers are `game.js` unless a file is named; values are as of the TODO 25 tuning pass (uncommitted, on top of cfddfb7). "EXISTS" = a number you can turn today. "MISSING" = the design wants it and the code has no such thing yet.
The `Observed` lines are from `node tools/playtest/run.js` (8 seeds, all seven personas), after the pass. The baseline before it is kept at the foot.

## The tuning table
`const T` at **2-14**. The old row: startMen 40, menPerF 10, manPrice 3, upkeep 1, rumor 20, startYear 793, endYear 1066, emptyUnrest 10, heldCalm 5, quietYears 5,
forkAges [25,35,45,55], gift 20, giftWarm 15, hallWarm 5, idleSour 3, walkChance 0.35, realmGrow 30, raidSour 10, takeSour 25. Start: silver 60 (**115**), one jarl with 10 men.
New in the pass (each commented in place): fallLoss 0.25, fallWin 0.25 (**6**); defWin 1.3, defCap 1000, defMend 0.965 (**7**); hallSlay 0.5, guardSave 3, richHall 300, richKing 1 (**8**); starveSour 10 (**9**);
breakYears 3 (**10**); strike 0.3, strikeBase 40, strikePer 20, strikeSated 20 (**11**); benches 8 (**12**); oldAge 0.04 (**13**); reachFree 10, reachRise 0.003, reachMax 0.05 (**14**).

## 1. Defender strength and recovery
- EXISTS. Base def per coast: `world.js:96`, unchanged (20-150; Paris 300/180, York 220/120, Lindisfarne 180/30, Dublin 160/80).
- EXISTS. Win odds `winOdds` **83**, unchanged and still the true probability: the ship rolls x0.85..1.15 (`chooseTarget` **210**).
- CHANGED. After a win: def x`T.defWin` 1.3, cap `T.defCap` 1000 (was x1.2, cap 200; **222**). After a loss x1.1, same cap. Recovery each autumn def x`T.defMend` 0.965 toward baseDef (was 0.95; **345**).
  A coast farmed by a strong raider now arms toward the raider's own strength, so the richest coasts sit at the edge of whatever odds he accepts.
- Observed: levi loses 7.6% of fights (0 before), the hall-sitter 6.6%, the settler 16% (it fights holdables at even odds), the courtier (sure fights only) 0%.

## 2. Losses and the ship
- EXISTS. Casualties (**216-218**) unchanged.
- NEW. Named men fall (**231-248**): each named man aboard, the King too, falls at `lossFrac x T.fallLoss` in a lost fight (5-15%, halved by Ironside through lossFrac) and `(lossFrac - 0.2) x T.fallWin` in a bloody win.
  A fallen jarl leaves the roll; his men come home unled. A fallen King: a `summary` card names him, then the `death` card, the heir and the oath at once; `finishCoronation` (**540**) lets the summer and winter still run.
- Observed: reckless loses its King at sea in its first years and breaks 7/8 (0 before); levi loses ~3 kings and ~21 jarls a line at sea.

## 3. Upkeep and starvation
- EXISTS. Upkeep (`upkeep` **377**), `T.upkeep` 1 a man at home, unchanged.
- CHANGED. Starvation (**383-390**): one man leaves per silver short (was one per 2), every jarl sours `T.starveSour` 10 (5 at a holding, "the hall went hungry"), and the sourest unkin jarl at home at sour or worse leaves with his men. All on the Winter sheet as `starve` events.
  Running short now costs a man worth 3 silver for every silver saved, plus stance.
- Observed: starve years fell (levi 45 -> 20, settler 29 -> 17) because men lost to it are no longer cheap; 0.3-1.3 jarls a line walk out of a hungry hall.

## 4. Loot share
- Unchanged (**221**, `chooseStay` forfeit).

## 5. Unrest and holding a coast
- EXISTS. `stayUnrest` **108**, the summer contest **300**, empty holdings **293-297**, hostile jarl walks **290** (`T.walkChance`): unchanged.
- NEW. A long reach (**306-310**): past `T.reachFree` 10 holdings, a holding that paid this summer stirs at `T.reachRise x (holdings - 10)` (at most `T.reachMax` 5%): unrest +15..40 for next summer, told as an `empty` event ("N holdings is a long reach for one hall"). It comes a summer ahead, so a jarl can be given more men in spring.
- NEW. Benches (`benchRoom` **80**): a local from five quiet years (**311**) or a seaman from the winter deck (**417**) comes only while fewer than `T.benches` 8 named men sit without a holding. Named men no longer run to hundreds; `menRoom` is honest. Sons always come.
- NEW. Old age (**409**, told on the winter card): a named man past 60 dies in his bed at `T.oldAge x (age - 60)` a winter. Before, jarls and uncles lived past 130 and were crowned one a winter.
- Observed: levi loses 16 holdings a line (0.1 before) and holds ~23 at 850 (all 33 before); the careful lines lose 3-11.

## 6. Realm clock and the break
- EXISTS. `growRealms` **55**, `T.realmGrow` 30: unchanged.
- CHANGED. `checkBreak` **68**: a realm held whole sets `k.yoke`; the king kneels only after `T.breakYears` 3 summers held, re-checked each autumn (**338-342**, a `realm` event "N more summers and he kneels"). Lose one coast and the count starts over.
- Observed: from a king's first hostility to his kneeling, levi 5.6 years, the settler 6.1 (immediate before).

## 7. Rulers' answers to raids
- EXISTS. Stance moves (`T.raidSour`, `T.takeSour`, gift) unchanged.
- NEW. Strikes (**322-336**): each summer a known, unbroken, hostile king comes for one holding that was his at `T.strike` 0.3. Host `(strikeBase 40 + strikePer 20 x his coasts you do not hold) x roll` against the jarl's Rule x men x roll. Held: the jarl +5. Lost: 40% of the garrison dead, the coast is his again (a ledger row and a `lost` event), and he warms `T.strikeSated` 20.
- CHANGED. The rival sail (**415-452**): its deck weight also rises by 2 per `T.richHall` 300 silver in the chest (at most +6). A king's fleet sails only if he was hostile last winter too (`k.wroth`, **413**; reset in `moveStance` **31** when he is warmed out of hostility), so the hostile word on his card is a year's warning.
  A fallen hall kills a named man at `hallSlay 0.5 x (1 - guardSave 3 x guard / fleet) x clamp(chest / richHall, 1 for a king's fleet | 0 for a strange one, 2)`: a guard a third the fleet's size saves every life; an empty hall over a rich chest is the deadliest. The victim is the King at `chest / richHall x richKing` (at most 0.75), else by lot. A King killed so dies at that winter's end (`s.kingSlain`).
- CHANGED. Births (**417**): weight 7 while fewer than two children, else 4 (was 6 / 3), so a line that never holds land (no knelt kin) can still raise heirs.
- Observed (16 seeds): the raider breaks 16/16 by ~840; the rover (careful raider) 4/16; the miser 9/16 (rich, unguarded halls); hostile kings retake holdings from levi (16 lost a line).

## 8. Oath and succession
- EXISTS. Oath at succession (`crown` **515-532**) unchanged; a knelt jarl is still made kin (`oathPay`).
- CHANGED. With no son, the youngest kin takes the hall (**508**; was the first in the roll, often the oldest).

## 9. Men: price, supply, cap
- `manPrice` 3 unchanged. The supply cap is now the benches (5): leaders are scarce, so bought men past `menRoom` sit unled.

## 10. The line and the King
- King mortality **470** unchanged. The King can now also die at sea (2) and in a fallen hall (7). Births unchanged (**414**).

## Harness (tools/playtest)
- `run.js`: `--seed N` runs one seed (with `TRACE=1`, prints each King's death and the ship every 20 years); a NEW TEETH table (king fell, king slain, jarls fell, hall slain, starve walk, stirs, strikes, struck held, revolt, taken, holdings in 843-852) and "hostile→kneels yrs" on RULERS.
- `personas.js`: two shared decisions the new rules call for, `defend` (size a hostile king's former coast against his host) and `guard` (keep a guard at a threatened or rich hall, at most half the men the holdings leave, so the ship still sails); the raider, the miser and the reckless keep no guard. The `rover` persona (coordinator's): richest seen coast at odds >= 0.75 or home, never holds, guards, gifts hostile kings.

## Baseline before the pass (cfddfb7, 8 seeds)
55/56 lines reached 1066. reckless lost 50% of fights and survived 8/8 with ~16 holdings; levi lost 0/273 fights, held all 33 coasts by ~850, broke 5.4 realms a line, kings kneeling the summer their realm was held; starvation was one man per 2 silver short and nothing else; named men never died in fights; late lines carried 500-900 named men.
