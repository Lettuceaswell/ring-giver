// Round 2: dump every winter of a driven dynasty with a one-line summary (year, silver, men, room, price, land and hall lines).
// Usage: node tools/audit/gen-winters.js OUTDIR [king] [seed]   e.g. node tools/audit/gen-winters.js /tmp/w ragnar shots2
// dump every winter of a driven dynasty with a one-line summary, so the audit can pick interesting ones
const fs=require('fs'),path=require('path'),root=path.join(__dirname,'..','..'),OUT=process.argv[2];fs.mkdirSync(OUT,{recursive:true});
const store={};global.localStorage={getItem:k=>(k in store?store[k]:null),setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}};
const app={innerHTML:''};global.document={querySelector:s=>s==='#app'?app:null};global.window={};global.navigator={};
const src=['coast.js','world.js','game.js','ui.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n').replace(/^(const|let) /gm,'var ');
eval(src);
const dump=(n)=>fs.writeFileSync(path.join(OUT,n+'.json'),JSON.stringify(S));
startGame(process.argv[3]||'ragnar');
const r=rng(process.argv[4]||'shots2'); const rows=[];
function drive(){const sc=S.queue[0]; if(!sc)return false;
  if(sc.t==='arrive'){ act(()=>chooseTarget(S,sc.targets[0])); }
  else if(sc.t==='fight'){ act(()=>next(S)); }
  else if(sc.t==='stay'){ const ship=S.notables.filter(m=>m.place==='ship'&&!m.isKing); if(ship.length&&r()<0.6)act(()=>chooseStay(S,ship[0].id)); else act(()=>choosePlunder(S)); }
  else if(sc.t==='winter'){ const p=has(S,'fairdealer')?2:T.manPrice, room=menRoom(S);
    rows.push([S.year,'silver',S.silver,'men',S.men,'room',room,'price',p,'king',S.king.name,S.king.age,'titles',S.king.titles.join('/'),'hold',S.holdings.length,'| LAND:',sc.land.join(' // '),'| HALL:',sc.hall.join(' // ')].join(' '));
    dump('w'+S.year); if(S.silver>60&&r()<0.5)act(()=>buyMen(S,10)); act(()=>closeWinter(S)); }
  else if(sc.t==='event'){ act(()=>sc.choice?acceptSuitor(S,true):next(S)); }
  else if(sc.t==='fork')act(()=>takeTitle(S,sc.offers.includes('fairdealer')?'fairdealer':sc.offers[0]));
  else if(sc.t==='death'){act(()=>startSuccession(S));}
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
  if(S.year>=905)break;
  act(()=>boardAll(S)); if(r()<0.25)act(()=>place(S,S.king.id,'home'));
  const seen=Object.values(S.shores).filter(x=>x.seen&&x.id!==HOME_ID&&!isHolding(S,x.id)).sort((a,b)=>b.loot-a.loot);
  const Sh=strengthShip(S); const pick=seen.find(x=>x.def<Sh*0.9);
  if(pick&&r()<0.75)act(()=>setDestination(S,pick.id)); else act(()=>setDestination(S,'blind'));
  act(()=>sail(S));
}
fs.writeFileSync(path.join(OUT,'_rows.txt'),rows.join('\n'));
console.log(rows.join('\n'));
