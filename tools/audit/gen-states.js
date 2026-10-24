// Saved game states for screenshots: drives a dynasty headlessly (same trick as tools/smoke.js) and dumps S at chosen moments.
// Usage: node tools/audit/gen-states.js [outdir]   (default tools/audit/states, gitignored)
// drive a dynasty headlessly (same trick as tools/smoke.js) and dump saves at chosen moments
const fs=require('fs'),path=require('path'),root=path.join(__dirname,'..','..'),OUT=process.argv[2]||path.join(__dirname,'states');fs.mkdirSync(OUT,{recursive:true});
const store={};global.localStorage={getItem:k=>(k in store?store[k]:null),setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};
const app={innerHTML:''};global.document={querySelector:s=>s==='#app'?app:null};global.window={};global.navigator={};
const src=['coast.js','world.js','game.js','ui.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n').replace(/^(const|let) /gm,'var ');
eval(src);
const dump=(n)=>fs.writeFileSync(path.join(OUT,n+'.json'),JSON.stringify(S));
startGame('ragnar');
const r=rng('shots'); const want={fight:false,stay:false,winter:false,event:false,landfall:false};
function drive(){const sc=S.queue[0]; if(!sc)return false;
  if(sc.t==='arrive'){ if(!want.landfall&&S.year>805){dump('landfall');want.landfall=true;} act(()=>chooseTarget(S,sc.targets[0])); }
  else if(sc.t==='fight'){ if(!want.fight&&sc.win&&sc.loot>60){dump('fight-win');want.fight=true;} if(!sc.win&&!want.fightlose){dump('fight-lose');want.fightlose=true;} act(()=>next(S)); }
  else if(sc.t==='stay'){ const ship=S.notables.filter(m=>m.place==='ship'&&!m.isKing); if(!want.stay&&ship.length){dump('stay');want.stay=true;} if(ship.length&&r()<0.6)act(()=>chooseStay(S,ship[0].id)); else act(()=>choosePlunder(S)); }
  else if(sc.t==='winter'){ if(!want.winter&&S.holdings.length){dump('winter');want.winter=true;} if(S.silver>60&&r()<0.7)act(()=>buyMen(S,10)); act(()=>closeWinter(S)); }
  else if(sc.t==='event'){ if(!want.event&&sc.ev!=='quiet'){dump('event-'+sc.ev);want.event=true;} act(()=>sc.choice?acceptSuitor(S,true):next(S)); }
  else if(sc.t==='fork')act(()=>takeTitle(S,sc.offers[0]));
  else if(sc.t==='death'){dump('death');act(()=>startSuccession(S));}
  else if(sc.t==='heir')act(()=>chooseHeir(S,sc.sons[0]));
  else if(sc.t==='oath')act(()=>oathPay(S,S.silver>=sc.price));
  else if(sc.t==='coronation')act(()=>finishCoronation(S));
  else if(sc.t==='end')return 'end';
  else act(()=>next(S));
  return true;}
let n=0;
while(S&&n++<400){
  while(S.queue.length){if(drive()==='end')break;}
  if(S.queue.length&&S.queue[0].t==='end')break;
  if(S.year===793){dump('spring-793');}
  if(S.year===800)dump('spring-800');
  if(S.year===815)dump('spring-815');
  if(S.year===850)dump('spring-850');
  if(S.year===900){dump('spring-900');break;}
  act(()=>boardAll(S)); if(r()<0.25)act(()=>place(S,S.king.id,'home'));
  const seen=Object.values(S.shores).filter(x=>x.seen&&x.id!==HOME_ID&&!isHolding(S,x.id)).sort((a,b)=>b.loot-a.loot);
  const Sh=strengthShip(S); const pick=seen.find(x=>x.def<Sh*0.9);
  if(pick&&r()<0.75)act(()=>setDestination(S,pick.id)); else act(()=>setDestination(S,'blind'));
  act(()=>sail(S));
}
console.log('done',S&&S.year,fs.readdirSync(OUT));
