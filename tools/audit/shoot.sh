#!/bin/bash
# Screenshot any state of any screen at phone width with headless Chromium, no extension needed.
#   tools/audit/shoot.sh setup            builds the harness dir (symlinks to the game, a driver page, saved states) and starts a server on :8766
#   tools/audit/shoot.sh NAME 'HASH'      shoots http://127.0.0.1:8766/index.html#HASH to tools/audit/out/NAME.png at 390x844, 2x
# HASH keys (driver page): state=<name from states/>  pane=map|ship|hall  saga=1  picker=1  man=<index into S.notables>  ruler=1
#   dest=<coast id or empty>  board=1  unboard=1  rumor=<coast id>  delta=<silver>&dmen=<men>  nobeat=1 (skips the arrival and ledger beats)  buy=<n> (buy n men on the Winter sheet)  fresh=1&start=ragnar  shift=1 (drop queue[0])
set -e
ROOT=$(cd "$(dirname "$0")/../.." && pwd); H=$ROOT/tools/audit/harness; OUT=$ROOT/tools/audit/out
if [ "$1" = setup ]; then
  mkdir -p "$H" "$OUT" "$ROOT/tools/audit/states"
  for f in coast.js world.js game.js ui.js fonts mark icon.svg manifest.json; do ln -sfn "$ROOT/$f" "$H/$f"; done
  ln -sfn "$ROOT/tools/audit/states" "$H/states"
  python3 - "$ROOT" "$H" <<'PY'
import sys,re
root,h=sys.argv[1],sys.argv[2]
src=open(root+'/index.html').read()
driver='''<script>window.onerror=(m,s,l)=>{document.title="ERR "+m+" "+l};
(function(){const h=new URLSearchParams(location.hash.slice(1));const st=h.get('state');
 if(st){const x=new XMLHttpRequest();x.open('GET','states/'+st+'.json',false);x.send();localStorage.setItem('seaking',x.responseText);} else if(h.get('fresh')) localStorage.removeItem('seaking');
 window.__after=function(){
  if(h.get('start')){startGame(h.get('start'));}
  if(h.get('shift')){S.queue.shift();}
  const q=h.get('pane');if(q)UI.pane=q;if(h.get('saga'))UI.saga=true;if(h.get('picker'))UI.picker=true;
  if(h.get('man')){UI.man=S.notables[+h.get('man')].id;}if(h.get('ruler')){UI.man=Object.values(S.rulers).find(k=>k.known).id;}
  if(h.get('dest')!==null){S.destination=h.get('dest')||null;}
  if(h.get('board')){boardAll(S);} if(h.get('unboard')){for(const m of S.notables)m.place='home';}
  if(h.get('rumor')){S.rumorOffer=h.get('rumor');}
  if(h.get('delta')){UI.pend={silver:+h.get('delta'),men:+(h.get('dmen')||0)};}
  if(h.get('nobeat')){UI.beatYear=S.year;UI.winterYear=S.year;}
  if(h.get('buy')){UI.buy=+h.get('buy');act(()=>buyMen(S,UI.buy));}
  render();};
})();</script>
<script src="ui.js"></script><script>__after()</script>'''
old='<script src="ui.js"></script>\n<script>if(\'serviceWorker\' in navigator)navigator.serviceWorker.register(\'sw.js\');</script>'
assert old in src, 'index.html script tail changed; update shoot.sh'
open(h+'/index.html','w').write(src.replace(old,driver))
PY
  if ! curl -s -o /dev/null http://127.0.0.1:8766/; then (cd "$H" && nohup python3 -m http.server 8766 --bind 127.0.0.1 >/dev/null 2>&1 &) ; sleep 1; fi
  echo "harness at $H, serving on :8766. Rebuild after editing index.html: run setup again."
  exit 0
fi
mkdir -p "$OUT"
chromium --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=1500 --force-device-scale-factor=2 --window-size=390,844 --screenshot="$OUT/$1.png" "http://127.0.0.1:8766/index.html#$2" >/dev/null 2>&1
echo "$1 -> tools/audit/out/$1.png"
