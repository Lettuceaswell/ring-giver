// Personas for the headless playtest harness (docs/TODO.md item 25). Each persona is a policy: a bag of hooks the driver in run.js
// calls at every decision the game offers. Whatever a persona leaves out falls to the SHARED DEFAULT below.
//
// SHARED DEFAULT (the "baseline" player; used wherever a persona's rule does not cover the decision)
//   spring     everyone not holding a shore boards; the King sails; each holding gets a jarl, sized to hold it with a margin
//              (jarl stays home if even a full following cannot beat the unrest, so the holding is left empty and drifts);
//              crew men go highest Combat first; leftover men sit at home (they guard the hall, highest Rule first).
//              (TODO 25) a holding taken from a king who is now hostile is sized against his host, if the jarl can lead that many (defend);
//              when any known king is hostile or the chest is 300+, the hall keeps a guard before the crew: the King if he stays home, else the
//              free jarl with the most Rule x following (guard). The raider, the miser and the reckless keep no guard.
//   gifts      a garrison jarl who has gone sour or hostile gets a 20-silver gift when the chest is 40+.
//   destination  richest seen, unheld coast with win odds >= 0.7 (expected loot = loot x odds); else sail blind if the ship is 60+; else stay home.
//   landfall   (blind) best expected loot among the three, odds >= 0.5; else the weakest defenders. Fights cannot be declined once landed.
//   stay       Stay when a non-King jarl (or a walked jarl, who kneels and keeps it) could hold it: Rule x full following beats the unrest. Else plunder.
//   market     buy up to the room under the named men, only while the chest plus 70% of this year's income covers next autumn's bill (every man, 1 silver; garrison men are not counted as free because spring may move them to the ship), 20 silver kept. (Upkeep is paid BEFORE the market, from the year's loot.)
//   suitors    always accept; heir: best (2 Rule + Combat + Follow); titles: a fixed priority list; oath: pay when the price is at most half the chest.
// The game has NO subjugate/tribute/demand verb (only gift silver and the realm break), so "subjugate" for the levi persona means:
// go and hold the coasts of a hostile king's realm until he breaks (checkBreak), and gift him 60 silver when rich.
'use strict';

module.exports = function (G) {
  const { has, isHolding, winOdds, strengthShip, stanceWord, fCap, stayUnrest, holdPay, menRoom, giftPrice, HOME_ID, T } = G;
  const jarlsOf = s => s.notables.filter(m => !m.isKing);
  const seenCands = (s, S) => Object.values(s.shores).filter(x => x.seen && x.id !== HOME_ID && !isHolding(s, x.id))
    .map(x => ({ x, p: winOdds(S, x.def), ev: x.loot * winOdds(S, x.def) }));
  const holdable = (s, x) => x.holdable;

  const DEFAULT_TITLES = ['ironside', 'deepchest', 'landtaker', 'fairdealer', 'hallward', 'seawolf', 'ringgiver', 'lawgiver', 'beloved', 'oldwise', 'farsailor', 'silvertongue'];
  const prio = (list) => (offers) => [...offers].sort((a, b) => list.indexOf(a) - list.indexOf(b))[0];

  // can this jarl, with a full following, beat the unrest of the shore? (Rule x men x 0.85..1.15 against unrest)
  const canHold = (s, rule, cap, sh) => rule * cap * 0.9 > stayUnrest(s, sh);

  // a buyer never takes the next autumn's bill past what the chest plus this year's income would cover: income is measured by the driver
  // (s.pt.income = silver gained between spring and autumn, before the hall ate); incomeFrac is how much of it he trusts again
  const buyWith = (incomeFrac, flat) => s => {
    const price = has(s, 'fairdealer') ? 2 : T.manPrice, inc = (s.pt.income || 0) * incomeFrac;
    let n = Math.min(menRoom(s), Math.floor((s.silver - flat) / price));
    while (n > 0 && (s.men + n) > (s.silver - n * price) + inc) n--;
    return Math.max(0, n);
  };

  const base = {
    garrison: 'fit',            // 'fit' (skip hopeless holdings) | 'full' (always send a jarl with all he can lead) | 'none'
    defend: true,               // a holding taken from a king who is now hostile is garrisoned against his host (base + per x his free coasts, at the top of the roll) when the jarl can lead that many
    guard: true,                // when a king is hostile or the chest is rich, the hall keeps a guard: the King if he stays home, else the free jarl with the most Rule, his full following, before the crew
    kingSails: () => true,
    jarlsSail: () => true,
    extras(s) { // shared gifts: warm a sour garrison jarl
      for (const h of s.holdings) { const j = s.notables.find(m => m.place === h.id); if (j && ['sour', 'hostile'].includes(stanceWord(j.stance)) && s.silver >= 40) G.gift(s, j.id); }
    },
    dest(s, S) {
      const c = seenCands(s, S).filter(o => o.p >= 0.7).sort((a, b) => b.ev - a.ev)[0];
      if (c) return c.x.id;
      return S >= 60 ? 'blind' : null;
    },
    target(s, sc) { // landfall pick
      const S = strengthShip(s), t = sc.targets.map(id => s.shores[id]).map(x => ({ x, p: winOdds(S, x.def), ev: x.loot * winOdds(S, x.def) }));
      const ok = t.filter(o => o.p >= 0.5).sort((a, b) => b.ev - a.ev)[0];
      if (!ok && Math.max(...t.map(o => o.p)) < 0.2) return 'home'; // nothing worth the men: turn for home (TODO 31)
      return (ok || t.sort((a, b) => a.x.def - b.x.def)[0]).x.id;
    },
    stay(s, sc) { // -> 'plunder' | jarl id | 'walked'
      const sh = s.shores[sc.shore], ship = jarlsOf(s).filter(m => m.place === 'ship');
      const fits = ship.filter(m => canHold(s, m.rule, fCap(s, m), sh)).sort((a, b) => b.rule - a.rule || a.combat - b.combat);
      if (fits.length) return fits[0].id;
      if (sc.walked && canHold(s, sh.walked.rule, sh.walked.follow * 10, sh)) return 'walked';
      return 'plunder';
    },
    buy: buyWith(0.7, 20),
    suitor: () => true,
    titles: prio(DEFAULT_TITLES),
    heir: (s, sc) => sc.sons.map(id => s.notables.find(m => m.id === id)).sort((a, b) => (2 * b.rule + b.combat + b.follow) - (2 * a.rule + a.combat + a.follow))[0].id,
    oath: (s, sc) => sc.price <= s.silver * 0.5,
  };

  const P = {};
  P.raider = { ...base, garrison: 'none', guard: false,
    dest(s) { // the richest coast it has seen, odds be damned
      const c = Object.values(s.shores).filter(x => x.seen && x.id !== HOME_ID && !isHolding(s, x.id)).sort((a, b) => b.loot - a.loot)[0];
      return c ? c.id : 'blind';
    },
    target: (s, sc) => sc.targets.map(id => s.shores[id]).sort((a, b) => b.loot - a.loot)[0].id,
    stay: () => 'plunder',
    titles: prio(['seawolf', 'ironside', 'farsailor', 'deepchest', 'fairdealer']),
  };
  P.rover = { ...base, garrison: 'none', // a careful raider: odds >= 0.75 or stay home; never holds; keeps the hall's guard (base.guard); gifts a hostile king
    extras(s) {
      base.extras(s);
      for (const k of Object.values(s.rulers)) if (k.known && !k.broken && stanceWord(k.stance) === 'hostile' && s.silver >= G.giftPrice(k) + 60) G.gift(s, k.id);
    },
    dest(s, S) {
      const c = seenCands(s, S).filter(o => o.p >= 0.75);
      const rich = c.sort((a, b) => b.x.loot - a.x.loot)[0]; // richest seen coast that clears 0.75
      return rich ? rich.x.id : null; // none clears it: the fleet stays home (the best-odds coast is, by definition, also below 0.75)
    },
    stay: () => 'plunder',
    titles: prio(['ironside', 'seawolf', 'deepchest', 'fairdealer', 'hallward']),
  };
  P.settler = { ...base, garrison: 'full', kingSails: () => false,
    dest(s, S) { // holdable coasts first, by cheapest unrest to hold
      const c = seenCands(s, S).filter(o => o.x.holdable && o.p >= 0.5).sort((a, b) => a.x.baseDef - b.x.baseDef)[0];
      if (c) return c.x.id;
      const l = seenCands(s, S).filter(o => o.p >= 0.7).sort((a, b) => b.ev - a.ev)[0];
      if (l) return l.x.id;
      return S >= 40 ? 'blind' : null;
    },
    stay(s, sc) { // stays wherever holdable: the jarl with the most Rule, whatever the odds; the walked jarl if no one is aboard
      const ship = jarlsOf(s).filter(m => m.place === 'ship').sort((a, b) => b.rule - a.rule);
      return ship.length ? ship[0].id : sc.walked ? 'walked' : 'plunder';
    },
    titles: prio(['landtaker', 'lawgiver', 'ringgiver', 'beloved', 'deepchest', 'hallward']),
  };
  P.miser = { ...base, guard: false, buy: () => 0, titles: prio(['deepchest', 'ironside', 'landtaker', 'hallward', 'lawgiver']) };
  P.reckless = { ...base, garrison: 'full', guard: false,
    dest: () => 'blind',
    target: (s, sc) => sc.targets.map(id => s.shores[id]).sort((a, b) => b.loot - a.loot)[0].id, // richest, any odds
    stay(s, sc) { const ship = jarlsOf(s).filter(m => m.place === 'ship').sort((a, b) => b.rule - a.rule); return ship.length ? ship[0].id : sc.walked ? 'walked' : 'plunder'; },
    titles: prio(['ironside', 'farsailor', 'seawolf', 'landtaker']),
  };
  P['hall-sitter'] = { ...base, kingSails: () => false,
    dest(s, S) { const c = seenCands(s, S).filter(o => o.p >= 0.7).sort((a, b) => b.ev - a.ev)[0]; return c ? c.x.id : S >= 60 ? 'blind' : null; },
    titles: prio(['hallward', 'lawgiver', 'deepchest', 'ringgiver', 'landtaker']),
  };
  P.courtier = { ...base,
    extras(s) {
      base.extras(s);
      // gifts: warm every jarl under "loyal" while the chest is comfortable; placate rulers who have gone cool or worse
      for (const j of jarlsOf(s)) if (stanceWord(j.stance) !== 'devoted' && j.stance < 40 && s.silver >= 120) G.gift(s, j.id);
      for (const k of Object.values(s.rulers)) if (k.known && !k.broken && k.stance < 0 && s.silver >= 300) G.gift(s, k.id);
      // marriages: every daughter of age goes to a jarl who is not yet kin, holders first, then the most followable
      for (const d of s.children.filter(c => c.sex === 'f' && c.age >= 16 && !c.married)) {
        const j = jarlsOf(s).filter(m => !m.kin).sort((a, b) => (s.holdings.some(h => h.id === b.place) ? 1 : 0) - (s.holdings.some(h => h.id === a.place) ? 1 : 0) || b.follow - a.follow)[0];
        if (j) G.marry(s, d.id, j.id);
      }
    },
    dest(s, S) { const c = seenCands(s, S).filter(o => o.p >= 0.97).sort((a, b) => b.ev - a.ev)[0]; return c ? c.x.id : null; }, // only sure fights, otherwise the fleet stays home
    target(s, sc) { const S = strengthShip(s), best = sc.targets.map(id => s.shores[id]).sort((a, b) => winOdds(S, b.def) - winOdds(S, a.def) || b.loot - a.loot)[0]; return winOdds(S, best.def) < 0.5 ? 'home' : best.id; },
    titles: prio(['beloved', 'ringgiver', 'lawgiver', 'landtaker', 'deepchest']),
  };
  P.builder = { ...base, // the baseline player who spends on the land (41B.2): each spring every holding takes its next building while the chest covers the price, a winter's bill (the men not at a holding) and sixty over
    extras(s) {
      base.extras(s);
      const bill = s.men - s.notables.filter(m => isHolding(s, m.place)).reduce((a, m) => a + m.men, 0);
      for (const h of s.holdings) for (const k of Object.keys(G.BUILDINGS)) if (G.canBuild(s, h.id, k) && s.silver - T.build[k] >= bill + 60) G.build(s, h.id, k);
    },
    titles: prio(['landtaker', 'lawgiver', 'deepchest', 'ringgiver', 'hallward', 'fairdealer']),
  };
  P.levi = { ...base,
    // Levi's first line (LOG s8 / TODO 25): steady expansion every few years, buys men freely, never lost a battle (he fights favorable odds),
    // never short of silver, and "subjugates a hostile king at once" (modelled as: take the coasts of his realm until he breaks; gift him when rich).
    extras(s) {
      base.extras(s);
      for (const k of Object.values(s.rulers)) if (k.known && !k.broken && stanceWord(k.stance) === 'hostile' && s.silver >= 250) G.gift(s, k.id);
    },
    dest(s, S) {
      const hostile = Object.values(s.rulers).filter(k => k.known && !k.broken && stanceWord(k.stance) === 'hostile');
      for (const k of hostile) { // the open coasts of his realm, nearest to breaking first
        const open = k.coasts.filter(c => c !== k.anchor && !isHolding(s, c) && s.shores[c].holdable);
        const c = open.map(id => s.shores[id]).filter(x => x.seen ? winOdds(S, x.def) >= 0.5 : S >= 100).sort((a, b) => (a.seen ? a.def : 60) - (b.seen ? b.def : 60))[0];
        if (c) return c.id;
      }
      const cands = seenCands(s, S).filter(o => o.p >= 0.7);
      const due = s.holdings.length < 2 + Math.floor((s.year - 793) / 25) || (s.year - (s.pt.lastStay || 793)) >= 3;
      const exp = due ? cands.filter(o => o.x.holdable).sort((a, b) => a.x.baseDef - b.x.baseDef || b.ev - a.ev)[0] : null;
      if (exp) return exp.x.id;
      const rich = cands.sort((a, b) => b.ev - a.ev)[0];
      if (rich) return rich.x.id;
      return S >= 60 ? 'blind' : null;
    },
    buy: buyWith(0.9, 10), // freely: up to what the chest plus a year's income can feed
    titles: prio(['ironside', 'landtaker', 'fairdealer', 'deepchest', 'seawolf', 'ringgiver', 'lawgiver']),
  };
  return P;
};
