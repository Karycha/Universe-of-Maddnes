/* Universe Madness — SILNIK ZASAD
   Czysta logika gry: bez DOM, bez zapisu. Komunikuje się z widokiem przez HOOKS.
   Ten plik + cards.js da się uruchomić w Node (tools/sim.js) i przepisać 1:1 do C#. */
const HOOKS={toast(){},banner(){},gameOver(){}};
let G=null;
const CARD = {}; CARDS.forEach(c=>CARD[c.id]=c);
const TARGETED = new Set(['any','enemyUnit','friendlyUnit']);
const COND = {party:'Drużyna',force:'Moc',assemble:'Zbiórka'};
const shuffle = a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const pick = a=>a[Math.random()*a.length|0];
const dmgWord = n=>n===1?'obrażenie':([2,3,4].includes(n%10)&&!(n%100>=12&&n%100<=14))?'obrażenia':'obrażeń';
const leaderOf = w=>LEADERS.find(l=>l.world===w);
let UID = 1;

/* =========================================================
   SILNIK GRY
   ========================================================= */
function mkPlayer(world,deck){return {world,leader:leaderOf(world),hp:RULES.leaderHp,maxHp:RULES.leaderHp,armor:0,mana:0,max:0,deck:shuffle([...deck]),hand:[],board:[],fat:0,powerUsed:false,madness:false,force:0,heroes:0}}
function mkUnit(c){const kw=[...(c.kw||[])];return {uid:UID++,id:c.id,name:c.name,icon:c.icon,world:c.world,src:c.src,race:c.race,atk:c.atk,hp:c.hp,maxHp:c.hp,baseAtk:c.atk,baseHp:c.hp,kw,canAttack:kw.includes('charge'),attacked:false,frozen:false,webbed:false}}
const worldKey=u=>u.src||u.world;
function fx(k,t,c){G.fxq.push({k,t,c})}
function setLog(m){G.log=m;if(G.hist)G.hist.push({m})}
const who=p=>p?'Przeciwnik':'Ty';
const tname=t=>!t?'':t.kind==='leader'?(t.p?'wrogi Lider':'twój Lider'):t.u.name;
function findUnit(uid){for(let p=0;p<2;p++){const u=G.p[p].board.find(x=>x.uid===uid);if(u)return {u,p}}return null}
const keyOf=t=>t.kind==='leader'?'L'+t.p:'U'+t.u.uid;
function parseKey(k){if(!k)return null;if(k[0]==='L')return {kind:'leader',p:+k.slice(1)};const f=findUnit(+k.slice(1));return f?{kind:'unit',u:f.u,p:f.p}:null}
const unitsOf=q=>G.p[q].board.map(u=>({kind:'unit',u,p:q}));
const clones=p=>G.p[p].board.filter(u=>u.id==='klon').length;
const races=p=>new Set(G.p[p].board.map(u=>u.race).filter(Boolean)).size;
const worldsOn=p=>new Set(G.p[p].board.map(worldKey)).size;
function costOf(p,c){let k=c.cost;if(c.costMod==='clones'&&G&&p!=null)k-=clones(p);return Math.max(0,k)}
function effN(p,e){if(e.n==='force')return G.p[p].force;return (e.n||0)+(e.plusClones?clones(p):0)}
function validTargets(t,p){
  if(t==='any')return [...unitsOf(0),...unitsOf(1),{kind:'leader',p:0},{kind:'leader',p:1}];
  if(t==='enemyUnit')return unitsOf(1-p);
  if(t==='friendlyUnit')return unitsOf(p);
  return [];
}
function validAttack(p){
  const o=1-p, taunts=G.p[o].board.filter(u=>u.kw.includes('taunt'));
  if(taunts.length)return taunts.map(u=>({kind:'unit',u,p:o}));
  return [...unitsOf(o),{kind:'leader',p:o}];
}
function canPlay(p,c){
  const pl=G.p[p];
  if(costOf(p,c)>pl.mana)return false;
  if(c.type==='unit')return pl.board.length<RULES.boardMax;
  if(c.play&&TARGETED.has(c.play.t))return validTargets(c.play.t,p).length>0;
  return true;
}
function condMet(p,cond){
  const pl=G.p[p];
  if(cond.type==='party')return races(p)>=cond.n;
  if(cond.type==='force')return pl.force>=cond.n;
  if(cond.type==='assemble')return pl.heroes>=1;
  return false;
}
function damageUnit(u,n){if(n<=0)return;u.hp-=n;fx('U'+u.uid,'-'+n,'dmg')}
function damageLeader(p,n){if(n<=0)return;const pl=G.p[p],a=Math.min(pl.armor,n);pl.armor-=a;pl.hp-=n-a;fx('L'+p,'-'+n,'dmg')}
function healLeader(p,n){const pl=G.p[p];pl.hp=Math.min(pl.maxHp,pl.hp+n);fx('L'+p,'+'+n,'heal')}
function healUnit(u,n){u.hp=Math.min(u.maxHp,u.hp+n);fx('U'+u.uid,'+'+n,'heal')}
function hit(t,n){t.kind==='leader'?damageLeader(t.p,n):damageUnit(t.u,n)}
function buffUnit(u,a,h){u.atk+=a;u.hp+=h;u.maxHp+=h;fx('U'+u.uid,`+${a}/+${h}`,'heal')}
function giveKw(u,kw){if(!u.kw.includes(kw))u.kw.push(kw);if(kw==='charge'&&!u.attacked&&!u.frozen)u.canAttack=true}

function applyFx(p,e,target,src){
  const o=1-p, me=G.p[p], op=G.p[o], n=effN(p,e), self=src?findUnit(src):null;
  switch(e.fx){
    case 'dmg':
      if(e.t==='enemyLeader')damageLeader(o,n);
      else if(e.t==='allEnemyUnits')op.board.forEach(u=>damageUnit(u,n));
      else if(e.t==='allEnemies'){op.board.forEach(u=>damageUnit(u,n));damageLeader(o,n)}
      else if(target)hit(target,n);
      break;
    case 'heal':
      if(e.t==='myLeader')healLeader(p,n);
      else if(e.t==='allFriendlyUnits')me.board.forEach(u=>healUnit(u,n));
      else if(target)target.kind==='leader'?healLeader(target.p,n):healUnit(target.u,n);
      break;
    case 'buff': if(target&&target.u){buffUnit(target.u,e.a,e.h);if(e.kw)giveKw(target.u,e.kw)} break;
    case 'buffAll': me.board.forEach(u=>buffUnit(u,e.a,e.h)); break;
    case 'buffClones': me.board.filter(u=>u.id==='klon').forEach(u=>buffUnit(u,e.a,e.h)); break;
    case 'selfBuff': if(self)buffUnit(self.u,e.a,e.h); break;
    case 'selfKw': if(self){giveKw(self.u,e.kw);fx('U'+src,'Szarża!','info')} break;
    case 'shield': if(target&&target.u){const u=target.u;u.hp+=2;u.maxHp+=2;giveKw(u,'taunt');fx(keyOf(target),'+2 HP','heal')} break;
    case 'summon': {const t=TOKENS[e.token];for(let i=0;i<n;i++){if(me.board.length>=RULES.boardMax)break;me.board.push(mkUnit(t));if(t.world==='marvel'&&me.world==='marvel')me.heroes++}break}
    case 'draw': for(let i=0;i<(n||1);i++)draw(p); break;
    case 'destroy': if(target&&target.u){target.u.hp=0;fx(keyOf(target),'✖','dmg')} break;
    case 'freeze': if(target&&target.u){target.u.frozen=true;target.u.canAttack=false;fx(keyOf(target),'Unieruchomiony','info')} break;
    case 'armor': me.armor+=n;fx('L'+p,`+${n} pancerza`,'heal'); break;
    case 'wipeEnemy': op.board.forEach(u=>u.hp=0); break;
    case 'wipe': [...me.board,...op.board].forEach(u=>u.hp=0); break;
    case 'snap': {const pool=shuffle([...me.board,...op.board].filter(u=>u.uid!==src));pool.slice(0,Math.ceil(pool.length/2)).forEach(u=>u.hp=0);if(src)fx('U'+src,'PSTRYK','info');break}
  }
}
function draw(p){
  const pl=G.p[p];
  if(!pl.deck.length){pl.fat++;damageLeader(p,pl.fat);setLog(`${who(p)}: pusta talia, -${pl.fat} HP`);return}
  const id=pl.deck.pop();
  if(pl.hand.length>=RULES.handMax){if(p===0)HOOKS.toast(`Pełna ręka: ${CARD[id].name} przepada`);return}
  pl.hand.push({uid:UID++,id});
}
function cleanup(){
  G.p.forEach((pl,q)=>{pl.board.filter(u=>u.hp<=0).forEach(u=>G.hist&&G.hist.push({m:`💀 ${u.name} (${who(q)}) ginie`,dead:1}));pl.board=pl.board.filter(u=>u.hp>0)});
  if(G.sel&&!findUnit(G.sel))G.sel=null;
  if(G.pending&&G.pending.src&&!findUnit(G.pending.src)&&G.pending.eff.fx.startsWith('self'))G.pending=null;
  const a=G.p[0].hp<=0,b=G.p[1].hp<=0;
  if((a||b)&&!G.over){
    G.over={res:a&&b?'draw':b?'win':'lose'};G.pending=null;G.sel=null;
    if(!G.sim)HOOKS.gameOver(G.over);
  }
}
function gainForce(p){const pl=G.p[p];pl.force++;fx('L'+p,`✦ Moc ${pl.force}`,'info')}
function playCard(p,idx,target){
  const pl=G.p[p], c=CARD[pl.hand[idx].id];
  if(G.over||G.turn!==p||!canPlay(p,c))return false;
  pl.mana-=costOf(p,c);pl.hand.splice(idx,1);
  setLog(`${who(p)}: ${c.name}${target?' → '+tname(target):''}`);
  if(c.force)gainForce(p);
  if(c.type==='unit'){
    const u=mkUnit(c);pl.board.push(u);
    const effs=[];
    if(c.play)effs.push(c.play);
    if(c.cond&&condMet(p,c.cond)){effs.push(c.cond.play);fx('U'+u.uid,COND[c.cond.type]+'!','info')}
    if(c.world==='marvel')pl.heroes++;
    let targeted=null;
    for(const e of effs){
      if(TARGETED.has(e.t)){targeted=e;continue}
      applyFx(p,e,null,u.uid);
    }
    if(targeted&&validTargets(targeted.t,p).length){
      if(p===0){G.pending={kind:'bc',eff:targeted,src:u.uid,name:c.name};cleanup();return true}
      const t=aiTarget(targeted,p);if(t)applyFx(p,targeted,t,u.uid);
    }
  } else applyFx(p,c.play,target,null);
  cleanup();return true;
}
function canAttackTarget(p,uid,t){
  const f=findUnit(uid);if(!f||f.p!==p||!t||G.turn!==p||G.over||!f.u.canAttack)return false;
  return validAttack(p).map(keyOf).includes(keyOf(t));
}
function attack(p,uid,t){
  const f=findUnit(uid);if(!f||f.p!==p||!t||G.turn!==p||G.over)return false;
  const u=f.u;if(!u.canAttack)return false;
  if(!validAttack(p).map(keyOf).includes(keyOf(t)))return false;
  u.canAttack=false;u.attacked=true;
  if(t.kind==='leader'){damageLeader(t.p,u.atk);setLog(`${u.name} (${who(p)}) bije Lidera za ${u.atk}`)}
  else{const d=t.u;damageUnit(d,u.atk);damageUnit(u,d.atk);setLog(`${u.name} ${u.atk}/${u.hp+d.atk} ⚔ ${d.name} ${d.atk}/${d.hp+u.atk} (${who(p)} atakuje)`)}
  cleanup();return true;
}
function usePower(p,t){
  const pl=G.p[p], pw=pl.leader.power;
  if(pl.powerUsed||pl.mana<RULES.powerCost||G.turn!==p||G.over)return false;
  if(TARGETED.has(pw.t)&&!t)return false;
  if(pw.fx==='summon'&&pl.board.length>=RULES.boardMax)return false;
  pl.mana-=RULES.powerCost;pl.powerUsed=true;
  applyFx(p,pw,t,null);if(pw.force)gainForce(p);
  setLog(`${who(p)}: ${pw.name}${t?' → '+tname(t):''}`);cleanup();return true;
}
function startTurn(p){
  const pl=G.p[p];G.turn=p;G.turnNo=(G.turnNo||0)+1;
  if(G.hist)G.hist.push({sep:1,m:`Tura ${Math.ceil(G.turnNo/2)} · ${who(p)}`});
  pl.max=Math.min(RULES.maxMana,pl.max+1);pl.mana=pl.max;pl.powerUsed=false;pl.heroes=0;
  pl.madness=worldsOn(p)>=3;
  if(pl.madness){pl.mana++;fx('L'+p,'MADNESS +1 mana','info')}
  pl.board.forEach(u=>{u.webbed=u.frozen;u.canAttack=!u.frozen;u.attacked=false;u.frozen=false});
  draw(p);cleanup();
  HOOKS.banner(p===0?(pl.madness?'Twoja tura · Madness!':'Twoja tura'):'Tura przeciwnika');
}
function nextTurn(){
  if(G.over)return;
  G.sel=null;G.pending=null;
  G.p[G.turn].board.forEach(u=>u.webbed=false);
  startTurn(1-G.turn);
}
/* Nowa gra: gracz 0 = człowiek (dół), 1 = AI. Zwraca, kto zaczyna. */
function createGame(w,deck,aiW,aiDeck,level='normal'){
  const first=Math.random()<.5?0:1;
  G={p:[mkPlayer(w,deck),mkPlayer(aiW,aiDeck)],turn:first,first,phase:'mulligan',lv:['normal',level],hist:[],turnNo:0,over:null,busy:false,pending:null,sel:null,preview:null,menu:false,log:'',fxq:[]};
  for(let i=0;i<3;i++)draw(first);for(let i=0;i<4;i++)draw(1-first);
  G.log=`${WORLDS[w].n} vs ${WORLDS[aiW].n}. ${first===0?'Zaczynasz!':'Zaczyna przeciwnik, masz dodatkową kartę.'}`;
  return first;
}
/* Mulligan: wybrane karty wracają do talii, w ich miejsce dobierasz nowe (nie te same). */
function mulligan(p,idxs){
  const pl=G.p[p], back=[];
  [...new Set(idxs)].sort((a,b)=>b-a).forEach(i=>{if(pl.hand[i])back.push(pl.hand.splice(i,1)[0].id)});
  for(let i=0;i<back.length;i++)draw(p);
  pl.deck.push(...back);shuffle(pl.deck);
  return back.length;
}
/* AI zostawia tanie karty, oddaje drogie (5+ many). */
const lvl=p=>(G.lv&&G.lv[p])||'normal';
function aiMulligan(p){if(lvl(p)==='easy')return;mulligan(p,G.p[p].hand.map((h,i)=>CARD[h.id].cost>=5?i:-1).filter(i=>i>=0))}
/* Wybór karty wg poziomu: Łatwy losowo (czasem pasuje), Normalny najdroższa, Trudny najlepszy zestaw na całą manę. */
function aiPickCard(p){
  const me=G.p[p], L=lvl(p);
  const opts=me.hand.map((h,i)=>({c:CARD[h.id],i})).filter(o=>canPlay(p,o.c)&&aiWants(o.c,p));
  if(!opts.length)return null;
  if(L==='easy')return Math.random()<.15?null:pick(opts);
  if(L==='hard'){
    // 1 krok w przód: każda karta × każdy cel na kopii gry; premia za wydaną manę
    const base=evalState(p);let bestO=null,bestS=base+.01;
    for(const o of opts){
      const c=o.c, needT=c.type==='spell'&&TARGETED.has(c.play.t);
      const targets=needT?validTargets(c.play.t,p).map(keyOf):[null];
      for(const k of targets){
        const s=scoreAfter(p,()=>{playCard(p,o.i,k?parseKey(k):null);
          if(G.pending){const pd=G.pending;G.pending=null;const tt=aiTarget(pd.eff,p);if(tt)applyFx(p,pd.eff,tt,pd.src);cleanup()}})+HARD_W.mana*costOf(p,c);
        if(s>bestS){bestS=s;bestO={...o,t:k}}
      }
    }
    if(bestO)return bestO;
    let best=null,bestScore=-1;const n=Math.min(opts.length,9),room=RULES.boardMax-me.board.length;
    for(let m=1;m<(1<<n);m++){
      let cost=0,units=0;const set=[];
      for(let k=0;k<n;k++)if(m>>k&1){const c=opts[k].c;cost+=costOf(p,c);if(c.type==='unit')units++;set.push(opts[k])}
      if(cost>me.mana||units>room)continue;
      const score=cost*10+units;if(score>bestScore){bestScore=score;best=set}
    }
    if(!best)return null;
    // najpierw karty bez warunków (budują Zbiórkę/Drużynę/Klony), potem warunkowe i Kurama
    best.sort((a,b)=>((a.c.cond||a.c.costMod)?1:0)-((b.c.cond||b.c.costMod)?1:0)||costOf(p,b.c)-costOf(p,a.c));
    return best[0];
  }
  return opts.sort((a,b)=>costOf(p,b.c)-costOf(p,a.c))[0];
}
/* Trudny: jeśli obrażenia z tablicy + zaklęcia w ręce + zdolność zabijają Lidera, najpierw dobija zaklęciami. */
function* aiLethal(p){
  const me=G.p[p], op=G.p[1-p], o=1-p;
  const taunt=op.board.some(u=>u.kw.includes('taunt'));
  const board=taunt?0:me.board.filter(u=>u.canAttack).reduce((s,u)=>s+u.atk,0);
  const burn=me.hand.map((h,i)=>({c:CARD[h.id],i})).filter(x=>x.c.type==='spell'&&x.c.play.fx==='dmg'&&(x.c.play.t==='any'||x.c.play.t==='enemyLeader')&&typeof x.c.play.n==='number');
  let mana=me.mana,dmg=board;const use=[];
  burn.sort((a,b)=>b.c.play.n/b.c.cost-a.c.play.n/a.c.cost).forEach(x=>{if(costOf(p,x.c)<=mana){mana-=costOf(p,x.c);dmg+=x.c.play.n;use.push(x.c.id)}});
  const pw=me.leader.power, pwDmg=!me.powerUsed&&pw.fx==='dmg'&&mana>=RULES.powerCost?pw.n:0;
  if(dmg+pwDmg<op.hp+op.armor||!use.length&&!pwDmg)return;
  for(const id of use){const i=me.hand.findIndex(h=>h.id===id);if(i<0||G.over)continue;yield {kind:'preplay',id};playCard(p,i,{kind:'leader',p:o});yield 'play'}
  if(pwDmg&&!G.over&&usePower(p,{kind:'leader',p:o}))yield 'power';
}
function beginGame(){G.phase='play';startTurn(G.first)}

/* ---------- AI ---------- */
function aiTarget(e,p){
  const o=1-p, op=G.p[o], me=G.p[p], byAtk=(a,b)=>b.atk-a.atk, n=effN(p,e);
  switch(e.fx){
    case 'dmg':{const kill=op.board.filter(u=>u.hp<=n).sort(byAtk)[0];if(kill)return {kind:'unit',u:kill,p:o};
      if(e.t==='any')return {kind:'leader',p:o};const big=[...op.board].sort(byAtk)[0];return big?{kind:'unit',u:big,p:o}:null}
    case 'heal':{if(me.hp<=me.maxHp-3)return {kind:'leader',p};const h=me.board.filter(u=>u.hp<=u.maxHp-2).sort(byAtk)[0];return h?{kind:'unit',u:h,p}:null}
    case 'buff':case 'shield':{const u=[...me.board].sort(byAtk)[0];return u?{kind:'unit',u,p}:null}
    case 'destroy':case 'freeze':{const u=[...op.board].sort((a,b)=>(b.atk+b.hp)-(a.atk+a.hp))[0];return u?{kind:'unit',u,p:o}:null}
  } return null;
}
function aiWants(c,p=1){
  const me=G.p[p], op=G.p[1-p];
  if(c.type==='spell'){
    if(TARGETED.has(c.play.t))return !!aiTarget(c.play,p);
    if(c.play.fx==='wipe')return op.board.length>=me.board.length+2;
    if(c.play.fx==='buffAll')return me.board.length>=2;
    if(c.play.fx==='summon')return me.board.length<RULES.boardMax;
  }
  return true;
}
/* Ocena stołu z perspektywy p (Trudne AI): życie, siła jednostek, prowokacje. */
const HARD_W={face:.8,mine:1,theirs:1.3,taunt:1.5,hp:.9,mana:.5};
function evalState(p){
  const me=G.p[p],op=G.p[1-p];
  if(op.hp<=0)return 1e4; if(me.hp<=0)return -1e4;
  const W=HARD_W,val=b=>b.reduce((s,u)=>s+u.atk+u.hp*W.hp+(u.kw.includes('taunt')?W.taunt:0),0);
  return W.face*((me.hp+me.armor)-(op.hp+op.armor))+W.mine*val(me.board)-W.theirs*val(op.board);
}
/* Wynik po wykonaniu fn na kopii gry (prawdziwa gra nietknięta). */
function scoreAfter(p,fn){
  const saved=G;G=JSON.parse(JSON.stringify(saved,(k,v)=>k==='hist'||k==='fxq'?undefined:v));G.sim=true;G.fxq=[];
  let s;try{fn();s=evalState(p)}finally{G=saved}
  return s;
}
function aiAttackHard(u,p){
  const op=G.p[1-p], vt=validAttack(p), leader=vt.find(t=>t.kind==='leader');
  const ready=G.p[p].board.filter(x=>x.canAttack).reduce((s,x)=>s+x.atk,0);
  if(leader&&ready>=op.hp+op.armor)return leader;
  let best=null,bs=-Infinity;
  // cel przekazujemy jako klucz i odtwarzamy w kopii gry — inaczej symulacja raniłaby prawdziwe jednostki
  for(const t of vt){const k=keyOf(t);const s=scoreAfter(p,()=>attack(p,u.uid,parseKey(k)));if(s>bs){bs=s;best=t}}
  return best;
}
function aiAttackTarget(u,p=1){
  if(lvl(p)==='hard')return aiAttackHard(u,p);
  const vt=validAttack(p), op=G.p[1-p], leader=vt.find(t=>t.kind==='leader');
  const ready=G.p[p].board.filter(x=>x.canAttack).reduce((s,x)=>s+x.atk,0);
  if(leader&&ready>=op.hp+op.armor)return leader;
  const units=vt.filter(t=>t.kind==='unit');
  if(lvl(p)==='hard'){
    const me=G.p[p], threat=op.board.reduce((s,x)=>s+x.atk,0);
    // obrona: przeciwnik może nas dobić w następnej turze → zabijamy jego najgroźniejsze jednostki, nawet kosztem własnych
    if(threat>=me.hp+me.armor-2){const kill=units.filter(t=>t.u.hp<=u.atk).sort((a,b)=>b.u.atk-a.u.atk)[0];if(kill)return kill}
    // darmowe zabicie groźnej jednostki zawsze przed biciem w Lidera
    const free=units.filter(t=>t.u.hp<=u.atk&&t.u.atk<u.hp&&t.u.atk>=2).sort((a,b)=>b.u.atk-a.u.atk)[0];if(free)return free;
  }
  const clean=units.filter(t=>t.u.hp<=u.atk&&t.u.atk<u.hp).sort((a,b)=>b.u.atk-a.u.atk)[0];if(clean)return clean;
  const trade=units.filter(t=>t.u.hp<=u.atk&&(t.u.atk+t.u.hp)>(u.atk+u.hp)+1).sort((a,b)=>b.u.atk-a.u.atk)[0];if(trade)return trade;
  if(leader)return leader;
  return units.sort((a,b)=>a.u.hp-b.u.hp)[0]||null;
}

/* Jedna tura AI krok po kroku (generator) — UI dokłada animacje i pauzy, symulator leci od razu. */
function* aiTurnSteps(p=1){
  const me=G.p[p];
  const power=function*(){
    if(G.over||me.mana<RULES.powerCost||me.powerUsed)return;
    const pw=me.leader.power;let t=null,ok=true;
    if(TARGETED.has(pw.t)){t=aiTarget(pw,p);ok=!!t}
    if(ok&&usePower(p,t))yield 'power';
  };
  // Zdolność przed kartami tylko gdy realnie pomaga: Kurama w ręce (tańszy za Klony) albo Zbiórka do odpalenia.
  const hasKurama=me.hand.some(h=>CARD[h.id].costMod==='clones');
  const wantsAssemble=me.world==='marvel'&&me.heroes===0&&me.hand.some(h=>{const c=CARD[h.id];return c.cond&&c.cond.type==='assemble'&&costOf(p,c)<=me.mana-RULES.powerCost});
  if((me.world==='naruto'&&hasKurama)||wantsAssemble)yield* power();
  if(lvl(p)==='hard')yield* aiLethal(p);
  for(let g=0;g<12&&!G.over;g++){
    const o=aiPickCard(p);
    if(!o)break;
    const {c,i}=o;
    const t=o.t!==undefined?(o.t?parseKey(o.t):null):(c.type==='spell'&&TARGETED.has(c.play.t)?aiTarget(c.play,p):null);
    yield {kind:'preplay',id:c.id};
    playCard(p,i,t);
    if(G.pending){const pd=G.pending;G.pending=null;const tt=aiTarget(pd.eff,p);if(tt)applyFx(p,pd.eff,tt,pd.src);cleanup()}
    yield 'play';
  }
  if(lvl(p)!=='easy'||Math.random()<.5)yield* power();
  const order=lvl(p)==='hard'?[...me.board].sort((a,b)=>b.atk-a.atk):[...me.board];
  for(const u of order){
    if(G.over)break;
    if(!findUnit(u.uid)||!u.canAttack||u.atk<=0)continue;
    const t=lvl(p)==='easy'&&Math.random()<.6?pick(validAttack(p)):aiAttackTarget(u,p);if(!t)continue;
    yield {kind:'preattack',uid:u.uid,t};
    if(G.over)break;
    attack(p,u.uid,t);yield 'attack';
  }
}
