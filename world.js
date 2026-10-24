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
// Mercator, shared with coast.py (which builds coast.js from Natural Earth): x from longitude, y from latitude
const PROJ = { lon0: -12, lat1: 63.5, k: 9.4 };
const merc = lat => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
function proj(lon, lat) { return { x: (lon - PROJ.lon0) * PROJ.k, y: (merc(PROJ.lat1) - merc(lat)) * PROJ.k * 180 / Math.PI }; }
// [id, name, lon, lat, holdable, culture, famous{loot,def}, label side: r (default) l a b = right, left, above, below the dot]
const COASTS = [
  ['vestfold','Vestfold',10.2,59.2,true,'norse'],
  ['agder','Agder',8.0,58.1,true,'norse'],
  ['rogaland','Rogaland',5.7,58.9,true,'norse',null,'l'],
  ['hordaland','Hordaland',5.3,60.4,true,'norse',null],
  ['skane','Skåne',13.0,55.6,true,'norse'],
  ['jutland','Hedeby',9.6,54.5,true,'norse',null,'l'],
  ['gotland','Gotland',18.3,57.6,true,'norse'],
  ['birka','Birka',17.5,59.3,true,'norse'],
  ['truso','Truso',19.4,54.3,true,'norse'],
  ['ladoga','Ladoga',32.3,60.0,true,'norse',null,'l'],
  ['saxony','Elbe-mouth',8.9,53.9,true,'saxon'],
  ['frisia','Dorestad',5.3,52.0,true,'frank',null],
  ['flanders','Flanders',3.2,51.2,true,'frank',null,'b'],
  ['seine','Seine-mouth',0.2,49.45,true,'frank',null,'l'],
  ['rouen','Rouen',1.1,49.3,true,'frank',null,'b'],
  ['paris','Paris',2.35,48.86,false,'frank',{loot:300,def:180}],
  ['brittany','Brittany',-3.5,48.6,true,'frank',null,'l'],
  ['loire','Nantes',-1.6,47.2,true,'frank',null,'l'],
  ['tours','Tours',0.7,47.4,false,'frank'],
  ['galicia','Galicia',-8.4,43.4,false,'frank'],
  ['lisbon','Lisbon',-9.1,38.7,false,'frank'],
  ['kent','Kent',1.1,51.3,true,'saxon',null,'a'],
  ['london','London',-0.1,51.5,true,'saxon',null,'l'],
  ['eastanglia','East Anglia',1.3,52.4,true,'saxon'],
  ['humber','Humber',-0.3,53.65,true,'saxon',null],
  ['york','York',-1.1,53.96,true,'saxon',{loot:220,def:120},'a'],
  ['lindisfarne','Lindisfarne',-1.8,55.67,false,'saxon',{loot:180,def:30}],
  ['pictland','Pictland',-3.0,56.4,true,'gael',null,'l'],
  ['orkney','Orkney',-3.0,59.0,true,'norse',null,'l'],
  ['shetland','Shetland',-1.3,60.3,true,'norse'],
  ['hebrides','Hebrides',-6.5,57.3,true,'gael',null,'l'],
  ['ulster','Ulster',-5.9,54.6,true,'gael',null,'l'],
  ['dublin','Dublin',-6.26,53.35,true,'gael',{loot:160,def:80},'l'],
  ['munster','Munster',-8.5,51.9,true,'gael',null,'l'],
  ['man','Man',-4.5,54.2,true,'gael',null,'a'],
  ['wales','Wales',-4.3,53.3,true,'gael',null],
  ['cornwall','Cornwall',-5.0,50.3,true,'saxon',null,'l'],
  ['wessex','Wessex',-1.4,50.9,true,'saxon',null,'b'],
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
  for (const [id, name, lon, lat, holdable, culture, famous, side] of COASTS) {
    const { x, y } = proj(lon, lat);
    let loot, def;
    if (famous) { loot = famous.loot; def = famous.def; }
    else { loot = r.int(20, 140); def = Math.max(20, Math.min(150, Math.round(loot * (0.4 + r() * 0.6)) + 10)); }
    shores[id] = { id, name, x: +x.toFixed(1), y: +y.toFixed(1), side: side || 'r', holdable, culture, famous: !!famous, baseLoot: loot, baseDef: def, loot, def,
      known: id === HOME_ID, seen: id === HOME_ID, rumored: false, neighbors: nb[id] || [], walked: null };
  }
  return shores;
}

// ---- Named rulers (GDD §15.3): a stance and a clock, never a turn -----------------
// [id, name, title, anchor, starting realm, map tint (a brand token)]
const RULERS = [
  ['gudrod',   'Gudrød',   'sea king of Hordaland',  'hordaland', ['hordaland', 'rogaland'],  'oxblood'],
  ['aella',    'Ælla',     'King of Northumbria',    'york',      ['york', 'humber'],         'chestnut'],
  ['ecgberht', 'Ecgberht', 'King of Wessex',         'wessex',    ['wessex', 'cornwall'],     'accent'],
  ['charles',  'Charles',  'King of the Franks',     'paris',     ['paris', 'rouen', 'seine'], 'pine'],
  ['aed',      'Áed',      'King of Tara',           'dublin',    ['dublin', 'munster'],      'iron'],
  ['anund',    'Anund',    'King at Birka',          'birka',     ['birka', 'gotland'],       'text'],
];
function buildRulers(seed) {
  const r = rng(seed + ':rulers'), out = {};
  for (const [id, name, title, anchor, coasts, tint] of RULERS)
    out[id] = { id, name, title, anchor, coasts: [...coasts], tint, stance: 0, why: [], known: false, broken: false, nextGrow: 793 + r.int(6, 30) };
  return out;
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
