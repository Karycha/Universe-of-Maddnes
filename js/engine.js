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
function setLog(m){G.log=m}
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
  if(!pl.deck.length){pl.fat++;damageLeader(p,pl.fat);setLog(`${p?'AI':'Ty'}: pusta talia, -${pl.fat} HP`);return}
  const id=pl.deck.pop();
  if(pl.hand.length>=RULES.handMax){if(p===0)HOOKS.toast(`Pełna ręka: ${CARD[id].name} przepada`);return}
  pl.hand.push({uid:UID++,id});
}
function cleanup(){
  for(const pl of G.p)pl.board=pl.board.filter(u=>u.hp>0);
  if(G.sel&&!findUnit(G.sel))G.sel=null;
  if(G.pending&&G.pending.src&&!findUnit(G.pending.src)&&G.pending.eff.fx.startsWith('self'))G.pending=null;
  const a=G.p[0].hp<=0,b=G.p[1].hp<=0;
  if((a||b)&&!G.over){
    G.over={res:a&&b?'draw':b?'win':'lose'};G.pending=null;G.sel=null;
    HOOKS.gameOver(G.over);
  }
}
function gainForce(p){const pl=G.p[p];pl.force++;fx('L'+p,`✦ Moc ${pl.force}`,'info')}
function playCard(p,idx,target){
  const pl=G.p[p], c=CARD[pl.hand[idx].id];
  if(G.over||G.turn!==p||!canPlay(p,c))return false;
  pl.mana-=costOf(p,c);pl.hand.splice(idx,1);
  setLog(`${p?'AI':'Ty'}: ${c.name}`);
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
function attack(p,uid,t){
  const f=findUnit(uid);if(!f||f.p!==p||!t||G.turn!==p||G.over)return false;
  const u=f.u;if(!u.canAttack)return false;
  if(!validAttack(p).map(keyOf).includes(keyOf(t)))return false;
  u.canAttack=false;u.attacked=true;
  if(t.kind==='leader'){damageLeader(t.p,u.atk);setLog(`${u.name} bije Lidera za ${u.atk}`)}
  else{const d=t.u;damageUnit(d,u.atk);damageUnit(u,d.atk);setLog(`${u.name} ⚔ ${d.name}`)}
  cleanup();return true;
}
function usePower(p,t){
  const pl=G.p[p], pw=pl.leader.power;
  if(pl.powerUsed||pl.mana<RULES.powerCost||G.turn!==p||G.over)return false;
  if(TARGETED.has(pw.t)&&!t)return false;
  if(pw.fx==='summon'&&pl.board.length>=RULES.boardMax)return false;
  pl.mana-=RULES.powerCost;pl.powerUsed=true;
  applyFx(p,pw,t,null);if(pw.force)gainForce(p);
  setLog(`${p?'AI':'Ty'}: ${pw.name}`);cleanup();return true;
}
function startTurn(p){
  const pl=G.p[p];G.turn=p;
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
function createGame(w,deck,aiW,aiDeck){
  const first=Math.random()<.5?0:1;
  G={p:[mkPlayer(w,deck),mkPlayer(aiW,aiDeck)],turn:first,first,phase:'mulligan',over:null,busy:false,pending:null,sel:null,preview:null,menu:false,log:'',fxq:[]};
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
function aiMulligan(p){mulligan(p,G.p[p].hand.map((h,i)=>CARD[h.id].cost>=5?i:-1).filter(i=>i>=0))}
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
function aiAttackTarget(u,p=1){
  const vt=validAttack(p), op=G.p[1-p], leader=vt.find(t=>t.kind==='leader');
  const ready=G.p[p].board.filter(x=>x.canAttack).reduce((s,x)=>s+x.atk,0);
  if(leader&&ready>=op.hp+op.armor)return leader;
  const units=vt.filter(t=>t.kind==='unit');
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
  for(let g=0;g<12&&!G.over;g++){
    const opts=me.hand.map((h,i)=>({c:CARD[h.id],i})).filter(o=>canPlay(p,o.c)&&aiWants(o.c,p)).sort((a,b)=>costOf(p,b.c)-costOf(p,a.c));
    if(!opts.length)break;
    const {c,i}=opts[0];
    const t=c.type==='spell'&&TARGETED.has(c.play.t)?aiTarget(c.play,p):null;
    playCard(p,i,t);
    if(G.pending){const pd=G.pending;G.pending=null;const tt=aiTarget(pd.eff,p);if(tt)applyFx(p,pd.eff,tt,pd.src);cleanup()}
    yield 'play';
  }
  yield* power();
  for(const u of [...me.board]){
    if(G.over)break;
    if(!findUnit(u.uid)||!u.canAttack||u.atk<=0)continue;
    const t=aiAttackTarget(u,p);if(!t)continue;
    attack(p,u.uid,t);yield 'attack';
  }
}
