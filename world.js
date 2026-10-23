// ---- Seeded RNG -------------------------------------------------------------
function hashStr(s) {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h >>> 0);
}
function rng(seed) {
  let a = typeof seed === 'string' ? hashStr(seed) : seed >>> 0;
  const r = () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  return r;
}

// ---- Names ------------------------------------------------------------------
const MALE_NAMES = ['Bjorn','Ivar','Halfdan','Sigurd','Ubbe','Hastein','Eirik','Harald','Gorm','Ketil','Thorfinn','Olaf','Ragnvald','Sven','Asmund','Egil','Hakon','Leif','Orm','Skuli','Vidar','Gunnar','Toke','Ulf','Knut','Arne','Frodi','Hroar','Ingolf','Styr'];
const FEMALE_NAMES = ['Astrid','Gudrun','Thyra','Ingrid','Sigrid','Ragnhild','Aud','Hild','Solveig','Thora','Asa','Freydis','Bera','Gyda','Helga','Unn'];
const LOCAL_NAMES = {saxon:['Aelfric','Osric','Wulfstan','Cuthred','Eadric'], frank:['Rotbert','Hugo','Odo','Gerard','Walter'], gael:['Niall','Conall','Cormac','Donnchad','Aed'], norse:MALE_NAMES};

// ---- The coast ----------------------------------------------------------------
// [id, name, x, y, holdable, culture, famous{loot,def}]
const COASTS = [
  ['vestfold','Vestfold',232,72,true,'norse'],
  ['agder','Agder',205,92,true,'norse'],
  ['rogaland','Rogaland',183,76,true,'norse'],
  ['hordaland','Hordaland',190,44,true,'norse'],
  ['skane','Skåne',258,112,true,'norse'],
  ['jutland','Hedeby',218,138,true,'norse'],
  ['gotland','Gotland',292,100,true,'norse'],
  ['birka','Birka',304,66,true,'norse'],
  ['truso','Truso',305,152,true,'norse'],
  ['ladoga','Ladoga',334,44,true,'norse'],
  ['saxony','Elbe-mouth',214,186,true,'saxon'],
  ['frisia','Dorestad',182,198,true,'frank'],
  ['flanders','Flanders',152,222,true,'frank'],
  ['seine','Seine-mouth',126,250,true,'frank'],
  ['rouen','Rouen',150,266,true,'frank'],
  ['paris','Paris',176,286,false,'frank',{loot:300,def:180}],
  ['brittany','Brittany',84,266,true,'frank'],
  ['loire','Nantes',96,302,true,'frank'],
  ['tours','Tours',132,316,false,'frank'],
  ['galicia','Galicia',50,362,false,'frank'],
  ['lisbon','Lisbon',40,402,false,'frank'],
  ['kent','Kent',132,216,true,'saxon'],
  ['london','London',106,202,true,'saxon'],
  ['eastanglia','East Anglia',126,180,true,'saxon'],
  ['humber','Humber',126,150,true,'saxon'],
  ['york','York',104,160,true,'saxon',{loot:220,def:120}],
  ['lindisfarne','Lindisfarne',116,110,false,'saxon',{loot:180,def:30}],
  ['pictland','Pictland',96,86,true,'gael'],
  ['orkney','Orkney',102,46,true,'norse'],
  ['shetland','Shetland',118,20,true,'norse'],
  ['hebrides','Hebrides',60,80,true,'gael'],
  ['ulster','Ulster',44,120,true,'gael'],
  ['dublin','Dublin',40,166,true,'gael',{loot:160,def:80}],
  ['munster','Munster',26,212,true,'gael'],
  ['man','Man',70,150,true,'gael'],
  ['wales','Wales',70,196,true,'gael'],
  ['cornwall','Cornwall',60,246,true,'saxon'],
  ['wessex','Wessex',96,236,true,'saxon'],
];
const EDGES = [
  ['vestfold','agder'],['vestfold','skane'],['vestfold','hordaland'],['agder','rogaland'],['rogaland','hordaland'],
  ['hordaland','shetland'],['rogaland','lindisfarne'],['agder','jutland'],['skane','jutland'],['skane','gotland'],
  ['gotland','birka'],['gotland','truso'],['birka','ladoga'],['jutland','saxony'],['saxony','frisia'],
  ['frisia','flanders'],['flanders','seine'],['seine','rouen'],['rouen','paris'],['flanders','kent'],
  ['seine','brittany'],['brittany','loire'],['loire','tours'],['brittany','galicia'],['galicia','lisbon'],
  ['kent','london'],['kent','eastanglia'],['eastanglia','humber'],['humber','york'],['humber','lindisfarne'],
  ['lindisfarne','pictland'],['pictland','orkney'],['orkney','shetland'],['pictland','hebrides'],['hebrides','ulster'],
  ['ulster','dublin'],['dublin','munster'],['dublin','man'],['man','wales'],['wales','cornwall'],
  ['cornwall','wessex'],['wessex','kent'],['wales','dublin'],['frisia','eastanglia'],['jutland','eastanglia'],
];
const HOME_ID = 'vestfold';

function buildWorld(seed) {
  const r = rng(seed + ':world');
  const nb = {};
  for (const [a, b] of EDGES) { (nb[a] = nb[a] || []).push(b); (nb[b] = nb[b] || []).push(a); }
  const shores = {};
  for (const [id, name, x, y, holdable, culture, famous] of COASTS) {
    let loot, def;
    if (famous) { loot = famous.loot; def = famous.def; }
    else { loot = r.int(20, 140); def = Math.max(20, Math.min(150, Math.round(loot * (0.4 + r() * 0.6)) + 10)); }
    shores[id] = { id, name, x, y, holdable, culture, famous: !!famous, baseLoot: loot, baseDef: def, loot, def,
      known: id === HOME_ID, seen: id === HOME_ID, rumored: false, neighbors: nb[id] || [], walked: null };
  }
  return shores;
}

// ---- Titles: each bends one rule ----------------------------------------------
const TITLES = {
  ironside:   { name:'Ironside',     text:'Ship losses halved.',                      score: s => s.deeds.raids * 2 },
  farsailor:  { name:'Far-sailor',   text:'Blind arrival reveals five coasts, not three.', score: s => s.deeds.blind * 3 },
  lawgiver:   { name:'Lawgiver',     text:'Unrest rises by 5 on empty holdings, not 10.', score: s => s.deeds.heldYears },
  ringgiver:  { name:'Ring-giver',   text:'Every jarl leads 10 more men.',             score: s => s.deeds.jarlYears },
  seawolf:    { name:'Sea-wolf',     text:'Loot share +25%.',                         score: s => s.deeds.bigWins * 3 },
  hallward:   { name:'Hall-ward',    text:'The home hall defends at double strength.', score: s => s.deeds.homeYears },
  silvertongue:{name:'Silver-tongue',text:'Rumors are free.',                         score: s => s.deeds.rumors * 3 },
  fairdealer: { name:'Fair-dealer',  text:'Men cost 2 silver, not 3.',                score: s => s.deeds.menBought / 5 },
  landtaker:  { name:'Land-taker',   text:'New holdings start 20 unrest calmer.',     score: s => s.deeds.stays * 4 },
  deepchest:  { name:'Deep-chest',   text:'Winter upkeep halved.',                    score: s => s.deeds.upkeep / 20 },
  beloved:    { name:'Beloved',      text:"Jarls' oath price halved for your heir.",  score: s => s.deeds.marriages * 4 + s.deeds.jarlYears / 2 },
  oldwise:    { name:'Old-wise',     text:'Death rolls past fifty halved.',           score: s => s.deeds.years / 3 },
};
