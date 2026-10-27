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

// ---- Writing variants (TODO 41A.9): the saga says the same thing a few ways, picked by rng(day + ':line:' + key + year) so a given winter or fight always reads the same ----
const upFirst = x => x[0].toUpperCase() + x.slice(1);
const LINES = {
  // the lead on the birth card; each takes { name, king }
  birth: {
    son: [({ name, king }) => `${name}, son of ${king}.`, ({ name }) => `${name}, born in the dark of the year. The hall drinks to him.`, ({ name, king }) => `${king} lifts the boy before the hall and names him ${name}.`,
      ({ name }) => `A son. They call him ${name}, and the line has a boy to raise.`, ({ name, king }) => `The women say a boy. ${name}, son of ${king}.`],
    daughter: [({ name, king }) => `${name}, daughter of ${king}.`, ({ name }) => `${name}, born in the dark of the year. The hall drinks to her.`, ({ name, king }) => `${king} takes the child in his arms and names her ${name}.`,
      ({ name }) => `A daughter. ${name}. In sixteen winters a jarl may ask for her.`, ({ name, king }) => `The women say a girl. ${name}, daughter of ${king}.`],
  },
  arm: ['His arm is not what it was.', 'The sword sits heavier in his hand.', 'He is slower to the shield wall than he was.', 'The young men row past him now.'],
  quiet: ['Snow on the roof. Nothing stirs.', 'The fjord freezes at its edges. Nothing comes up it.', 'A long night, a short day, and the fire kept. Nothing stirs.', 'The wind drops. The hall sleeps through the dark.', 'Ice on the oars. The men mend nets and tell the old tales.'],
  wanderer: ['He winters in the hall and talks of far coasts.', 'A stranger at the door with salt in his cloak. He has seen coasts you have not.', 'An old sailor asks for the fire and pays in talk of far shores.', 'He comes in out of the snow with a hundred place names, and the hall listens.'],
  // the verdict under the stamp; `at` is the phase the fight ended in ("the landing"). lostLate is a fight fought to the press and lost
  verdict: {
    rout: [at => `They break at ${at}.`, at => `They do not stand. ${upFirst(at)} is the whole of it.`, at => `The line breaks at ${at} and does not mend.`, at => `${upFirst(at)} is enough. They run.`],
    victory: [at => `They give way at ${at}.`, at => `The defenders give ground at ${at} and do not take it back.`, at => `It is won at ${at}.`, at => `${upFirst(at)} decides it, and the coast goes to the ships.`],
    narrow: [at => `It hangs until ${at}, and then the coast gives.`, at => `Won at ${at}, by a hand's breadth.`, at => `${upFirst(at)} tips it. Nobody will say how close.`, at => `They give way at ${at}, barely.`],
    lost: [at => `The ship's men break at ${at}.`, at => `The ship's men give way at ${at} and run for the oars.`, at => `${upFirst(at)} is lost, and the oars with it.`, at => `The coast does not bend at ${at}. The ship's men turn.`],
    lostLate: ['Back to the ships.', 'The shore holds. Back to the ships.', 'They carry the wounded to the ships.', 'Nothing to take here. Back to the ships.'],
  },
  // the saga's line when a holding gets a building (41B.2); each takes the coast's name
  built: {
    market: [n => `A market rises at ${n}. Traders come up the beach with the tide, and the jarl takes his tenth.`, n => `${n} keeps a market now. Silver comes in by the boatload, and some of it stays.`, n => `Booths on the strand at ${n}, and weights that are honest while the jarl is looking.`],
    longhouse: [n => `A longhouse goes up at ${n}, with benches for men who were not there before.`, n => `${n} has a longhouse now. Farmers' sons sit on its benches and learn the shield.`, n => `The roof-tree is raised at ${n}. Its benches will fill every spring.`],
    palisade: [n => `A palisade rings ${n}. Oak stakes, a ditch, and a gate that shuts.`, n => `${n} is fenced in oak now. The men inside sleep better than the men outside.`, n => `A ditch and a wall of stakes at ${n}. Trouble finds it harder to get in.`],
  },
  // the saga's line when the King's hall is raised (41B.2), one list per tier
  raised: [
    ['The hall at Vestfold is lengthened by two bays. There is room on the benches for one more man.', 'Timber comes down the fjord, and the hall at Vestfold grows a bay. A longer table, and a longer list of those who sit at it.', 'The King\'s hall is made longer. The new bench is already spoken for.'],
    ['Gables rise on the hall at Vestfold, carved at the peaks. Men who see them from the water know whose roof it is.', 'The hall at Vestfold takes a gabled roof and a second door. The skalds will have more to count.', 'Carvers come to Vestfold and leave their beasts on the gables. A gabled hall draws men, and keeps them.'],
    ['Vestfold has a king\'s hall now: high, long and dark with smoke. Jarls who would not kneel will think again at its door.', 'The last beam is raised at Vestfold. A hundred could eat under that roof, and none of them would forget it.', 'The hall at Vestfold is finished, and it is bigger than the fear of it. Men will kneel more easily under that roof.'],
  ],
  // one line for the places a saga would name; shown under the account of the coast (destSub)
  famous: { lindisfarne: 'A holy house on a tidal island. Monks, silver, and no wall worth the name; what is knocked down is slow to rise again.', york: 'The old Roman walls still stand, and a king\'s hall inside them.',
    paris: 'An island city behind two bridges. The Franks will pay to be left alone.', jutland: 'A market town at the neck of the land: traders from every sea.',
    hebrides: 'Columba\'s island house. The monks have fled before and come back; they always come back, and the wall never does.',
    tours: 'Saint Martin\'s house, three days up the Loire: the richest shrine in Francia, no wall but prayer, and too far up the river to keep.',
    galicia: 'A long coast under the Asturian king\'s mountains: rich churches, no harbour to winter in.',
    lisbon: 'The Moors\' city at the river\'s mouth: walls, a garrison, and a sea too far from home to hold.' },
};

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
  ['tours','Tours',0.7,47.4,false,'frank',{loot:200,def:40,holy:true,late:true}],
  ['galicia','Galicia',-8.4,43.4,false,'frank',{loot:150,def:90,late:true}],
  ['lisbon','Lisbon',-9.1,38.7,false,'frank',{loot:260,def:170,late:true}],
  ['kent','Kent',1.1,51.3,true,'saxon',null,'a'],
  ['london','London',-0.1,51.5,true,'saxon',null,'l'],
  ['eastanglia','East Anglia',1.3,52.4,true,'saxon'],
  ['humber','Humber',-0.3,53.65,true,'saxon',null],
  ['york','York',-1.1,53.96,true,'saxon',{loot:220,def:120},'a'],
  ['lindisfarne','Lindisfarne',-1.8,55.67,false,'saxon',{loot:180,def:30,holy:true}],
  ['pictland','Pictland',-3.0,56.4,true,'gael',null,'l'],
  ['orkney','Orkney',-3.0,59.0,true,'norse',null,'l'],
  ['shetland','Shetland',-1.3,60.3,true,'norse'],
  ['hebrides','Iona',-6.5,57.3,true,'gael',{loot:120,def:35,holy:true,late:true},'l'],
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
    if (famous && !famous.late) { loot = famous.loot; def = famous.def; }
    else { loot = r.int(20, 140); def = Math.max(20, Math.min(150, Math.round(loot * (0.4 + r() * 0.6)) + 10)); if (famous) { loot = famous.loot; def = famous.def; } } // a coast made famous after the world was seeded (late) draws like a plain one first, so the seed's world stays the world
    shores[id] = { id, name, x: +x.toFixed(1), y: +y.toFixed(1), side: side || 'r', holdable, culture, famous: !!famous, baseLoot: loot, baseDef: def, loot, def, holy: !!(famous && famous.holy), // a monastery (41B.7): weak walls that never become a fortress, and treasure that comes back slowly
      known: id === HOME_ID, seen: id === HOME_ID, rumored: false, neighbors: nb[id] || [], walked: null };
  }
  return shores;
}

// ---- Named rulers (GDD §15.3): a stance and a clock, never a turn -----------------
// [id, name, title, anchor, starting realm, map tint (a brand token)]
// the ids are the seats (a save keys its rulers by them); the name is the man of the year (41B.7): RULER_NAMES gives each seat its kings by the
// year they took it, so 793 opens on Beorhtric, Æthelred and Charles, and when kings become mortal (42.3) the next name on the list follows
const RULERS = [
  ['gudrod',   'sea king of Hordaland',  'hordaland', ['hordaland', 'rogaland'],  'oxblood'],
  ['aella',    'King of Northumbria',    'york',      ['york', 'humber'],         'chestnut'],
  ['ecgberht', 'King of Wessex',         'wessex',    ['wessex', 'cornwall'],     'accent'],
  ['charles',  'King of the Franks',     'paris',     ['paris', 'rouen', 'seine'], 'pine'],
  ['aed',      'King of Tara',           'dublin',    ['dublin', 'munster'],      'iron'],
  ['anund',    'King at Birka',          'birka',     ['birka', 'gotland'],       'text'],
];
const RULER_NAMES = { // [year he took the seat, name]; the half-century is right even where the man is a saga's guess (the Svear before Rimbert)
  gudrod:   [[793, 'Gudrød'], [840, 'Halfdan'], [872, 'Harald'], [934, 'Hákon'], [961, 'Harald Greycloak'], [995, 'Olaf'], [1015, 'Olaf'], [1046, 'Harald Hardrada']],
  aella:    [[793, 'Æthelred'], [806, 'Eardwulf'], [841, 'Æthelred'], [862, 'Osberht'], [866, 'Ælla'], [876, 'Halfdan'], [919, 'Ragnall'], [939, 'Olaf'], [948, 'Eirik'], [954, 'Oswulf'], [1016, 'Eirik'], [1055, 'Tostig']],
  ecgberht: [[793, 'Beorhtric'], [802, 'Ecgberht'], [839, 'Æthelwulf'], [858, 'Æthelbald'], [860, 'Æthelberht'], [865, 'Æthelred'], [871, 'Alfred'], [899, 'Edward'], [924, 'Æthelstan'], [939, 'Edmund'], [946, 'Eadred'], [955, 'Eadwig'], [959, 'Edgar'], [975, 'Edward'], [978, 'Æthelred'], [1016, 'Cnut'], [1035, 'Harold'], [1040, 'Harthacnut'], [1042, 'Edward'], [1066, 'Harold']],
  charles:  [[793, 'Charles'], [814, 'Louis'], [840, 'Charles the Bald'], [877, 'Louis'], [879, 'Carloman'], [884, 'Charles the Fat'], [888, 'Odo'], [898, 'Charles the Simple'], [922, 'Robert'], [923, 'Rudolph'], [936, 'Louis'], [954, 'Lothair'], [986, 'Louis'], [987, 'Hugh Capet'], [996, 'Robert'], [1031, 'Henry'], [1060, 'Philip']],
  aed:      [[793, 'Áed'], [819, 'Conchobar'], [833, 'Niall'], [846, 'Máel Sechnaill'], [862, 'Áed Findliath'], [879, 'Flann'], [916, 'Niall Glúndub'], [919, 'Donnchad'], [944, 'Congalach'], [956, 'Domnall'], [980, 'Máel Sechnaill'], [1002, 'Brian'], [1014, 'Máel Sechnaill'], [1022, 'Donnchad'], [1064, 'Toirdelbach']],
  anund:    [[793, 'Sigurd'], [829, 'Björn'], [845, 'Anund'], [852, 'Olof'], [882, 'Erik'], [920, 'Björn'], [970, 'Erik the Victorious'], [995, 'Olof'], [1022, 'Anund Jacob'], [1050, 'Emund'], [1060, 'Stenkil']],
};
const rulerName = (id, year) => { let n = RULER_NAMES[id][0][1]; for (const [y, nm] of RULER_NAMES[id]) if (y <= year) n = nm; return n; };
function buildRulers(seed) {
  const r = rng(seed + ':rulers'), out = {};
  for (const [id, title, anchor, coasts, tint] of RULERS)
    out[id] = { id, name: rulerName(id, 793), title, anchor, coasts: [...coasts], tint, stance: 0, why: [], known: false, broken: false, nextGrow: 793 + r.int(6, 30) };
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
