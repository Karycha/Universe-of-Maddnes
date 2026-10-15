/* Universe Madness — WIDOK: ekrany, karty, dotyk, paczki, kolekcja, zapis. */
const APP_VERSION='0.13';   // przy każdej aktualizacji podbij tu i w version.json (i ?v= w index.html)
/* Auto-aktualizacja: telefon trzyma starą stronę w pamięci podręcznej, więc sprawdzamy version.json bez cache. */
(function(){try{fetch('version.json?t='+Date.now(),{cache:'no-store'}).then(r=>r.json()).then(j=>{
  if(j&&j.v&&j.v!==APP_VERSION&&!location.search.includes('v='+j.v))location.replace('./?v='+j.v);}).catch(()=>{})}catch(e){}})();
/* Android (apka z ekranu głównego): próbujemy zablokować poziom. iOS na to nie pozwala — tam jest ekran „Obróć telefon”. */
document.addEventListener('pointerdown',function lockOnce(){document.removeEventListener('pointerdown',lockOnce);
  try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{})}catch(e){}});
const app = document.getElementById('app');
const sleep = ms=>new Promise(r=>setTimeout(r,ms));
function fxText(p){
  const n=p.n;
  switch(p.fx){
    case 'dmg':
      if(n==='force')return 'Tyle obrażeń we wrogiego Lidera, ile masz Mocy';
      if(p.plusClones)return `${n} ${dmgWord(n)} we wrogą jednostkę (+1 za każdego twojego Klona)`;
      return ({enemyLeader:`${n} ${dmgWord(n)} we wrogiego Lidera`,allEnemyUnits:`${n} ${dmgWord(n)} we wszystkie wrogie jednostki`,allEnemies:`${n} ${dmgWord(n)} we wszystkich wrogów`,enemyUnit:`${n} ${dmgWord(n)} we wrogą jednostkę`,any:`${n} ${dmgWord(n)} w dowolny cel`})[p.t];
    case 'heal': return p.t==='myLeader'?`Leczy twojego Lidera o ${n}`:p.t==='allFriendlyUnits'?`Leczy twoje jednostki o ${n}`:`Leczy cel o ${n}`;
    case 'buff': return `Twoja jednostka dostaje +${p.a}/+${p.h}${p.kw==='charge'?' i Szarżę':''}`;
    case 'buffAll': return `Twoje jednostki dostają +${p.a}/+${p.h}`;
    case 'buffClones': return `Twoje Klony dostają +${p.a}/+${p.h}`;
    case 'selfBuff': return `Dostaje +${p.a}/+${p.h}`;
    case 'selfKw': return 'Dostaje Szarżę';
    case 'summon': {const t=TOKENS[p.token];return `Przyzywa ${n>1?n+'× ':''}${t.name} ${t.atk}/${t.hp}`}
    case 'draw': return 'Dobierasz kartę';
    case 'destroy': return 'Niszczy wrogą jednostkę';
    case 'freeze': return 'Wroga jednostka nie zaatakuje w następnej turze';
    case 'armor': return `+${n} Pancerza dla twojego Lidera`;
    case 'wipeEnemy': return 'Niszczy wszystkie wrogie jednostki';
    case 'wipe': return 'Niszczy WSZYSTKIE jednostki na stole';
    case 'snap': return 'Niszczy losową połowę pozostałych jednostek';
  } return '';
}
function cardText(c){
  const parts=[];
  if(c.force)parts.push('<b>✦ +1 Mocy</b>');
  if(c.kw&&c.kw.includes('charge'))parts.push('<b>Szarża</b>');
  if(c.kw&&c.kw.includes('taunt'))parts.push('<b>Prowokacja</b>');
  if(c.costMod==='clones')parts.push('Kosztuje 1 mniej za każdego twojego Klona');
  if(c.play)parts.push(c.type==='unit'?`<span><b>Okrzyk:</b> ${fxText(c.play)}.</span>`:fxText(c.play)+'.');
  if(c.cond)parts.push(`<span><b>${COND[c.cond.type]}${c.cond.type==='force'?' '+c.cond.n:''}:</b> ${fxText(c.cond.play)}.</span>`);
  return parts.join(' · ');
}
const cardLabel = c=>[WORLDS[c.world].n,c.race,c.src&&SRC[c.src],RAR[c.rarity]&&RAR[c.rarity].n].filter(Boolean).join(' · ');
function cardFace(c,size,extra='',cost){
  const u=c.type==='unit', a=artSrc(c), k=cost===undefined?c.cost:cost;
  return `<div class="card ${size} r-${c.rarity} ${a?'has-art':''}" style="--u:var(--${c.world})">${a?artImg(a):''}
    <span class="cost ${k<c.cost?'low':''}">${k}</span><span class="gem"></span>
    <span class="cu">${cardLabel(c)}</span>
    <span class="ci">${c.icon}</span><span class="cn">${c.name}</span>
    <span class="ct">${cardText(c)||'Bez efektu. Czysta siła.'}</span>
    ${u?`<span class="ca">${c.atk}</span><span class="ch">${c.hp}</span>`:`<span class="sp">Zaklęcie</span>`}${extra}</div>`;
}

/* ---------- grafiki z API (mapa ART_SRC jest w cards.js) ---------- */
const ART_KEY='universe-madness-art-v2';
let ART={};
try{ART=JSON.parse(localStorage.getItem(ART_KEY))||{}}catch(e){}
function artSrc(c){if(!c)return null;if(c.art)return c.art===true?`art/${c.id}.webp`:c.art;return ART[c.id]||null}
const artImg=a=>`<img class="art" src="${a}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.remove('has-art');this.remove()">`;
/* fetch z limitem czasu: jedno zawieszone zapytanie nie blokuje reszty */
function fetchJSON(u,ms=9000){
  const ctl=typeof AbortController!=='undefined'?new AbortController():null;
  const t=setTimeout(()=>ctl&&ctl.abort(),ms);
  return fetch(u,ctl?{signal:ctl.signal}:{}).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json()}).finally(()=>clearTimeout(t));
}
let HEROES=null;
async function findArt([src,q]){
  if(src==='wiki'){ // API MediaWiki: pilicense=any oddaje też obrazki z filmów/komiksów (REST summary dawał tylko wolne licencje)
    const d=await fetchJSON(`https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages&piprop=thumbnail&pithumbsize=500&pilicense=any&titles=${encodeURIComponent(q)}`);
    const p=d.query&&d.query.pages?Object.values(d.query.pages)[0]:null;return (p&&p.thumbnail&&p.thumbnail.source)||''}
  if(src==='hero'){if(!HEROES)HEROES=await fetchJSON('https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/all.json',15000);
    const h=HEROES.find(x=>x.name.toLowerCase()===q.toLowerCase());return h?h.images.lg||h.images.md:''}
  if(src==='jikan'){
    const url=`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(q)}&order_by=favorites&sort=desc&limit=1`;
    let d;try{d=await fetchJSON(url)}catch(e){if(e.message!=='429')throw e;await sleep(2000);d=await fetchJSON(url)}
    const c=d.data&&d.data[0];return c?(c.images.webp&&c.images.webp.image_url)||c.images.jpg.image_url:''}
  return '';
}
const ART_STATUS={busy:false,done:0,total:0,fail:0};
let artTimer=null;
function artRefresh(){clearTimeout(artTimer);artTimer=setTimeout(()=>{if(!drag&&screen!=='game')render()},350)}
async function resolveArt(){
  if(ART_STATUS.busy)return;
  const todo=Object.entries(ART_SRC).filter(([id])=>ART[id]===undefined);
  if(!todo.length)return;
  Object.assign(ART_STATUS,{busy:true,done:0,total:todo.length,fail:0});artRefresh();
  const one=async([id,spec])=>{
    try{ART[id]=await findArt(spec);try{localStorage.setItem(ART_KEY,JSON.stringify(ART))}catch(e){}}
    catch(e){ART_STATUS.fail++} // spróbuje przy następnym uruchomieniu
    ART_STATUS.done++;artRefresh();
  };
  // trzy źródła równolegle; Jikan (MyAnimeList) ma limit zapytań, więc tam po kolei z przerwą
  const by=s=>todo.filter(([,spec])=>spec[0]===s);
  const wiki=by('wiki'), hero=by('hero'), jikan=by('jikan');
  const pool=async(list,n)=>{let k=0;await Promise.all(Array.from({length:n},async()=>{while(k<list.length)await one(list[k++])}))};
  await Promise.all([pool(wiki,4),pool(hero,2),(async()=>{for(const x of jikan){await one(x);await sleep(700)}})()]);
  ART_STATUS.busy=false;artRefresh();
}
const artNote=()=>ART_STATUS.busy?`<p class="note">Pobieram grafiki ${ART_STATUS.done}/${ART_STATUS.total}${ART_STATUS.fail?` · nieudane ${ART_STATUS.fail}`:''}…</p>`:'';
const backFace = size=>`<div class="card ${size} back"><span class="bk">UM</span></div>`;

/* ---------- zapis kolekcji ---------- */
const KEY='universe-madness-save-v2';
function starterDeckOf(w){const d=[];CARDS.forEach(c=>{if(c.world===w)for(let i=0;i<(c.starter||0);i++)d.push(c.id)});return d}
function defaultSave(){
  const coll={},decks={};
  CARDS.forEach(c=>{if(c.starter)coll[c.id]=c.starter});
  PLAYABLE.forEach(w=>decks[w]=starterDeckOf(w));
  const s={shards:300,dust:0,coll,decks,wins:0,losses:0};
  try{const old=JSON.parse(localStorage.getItem('universe-madness-save-v1'));
    if(old){s.shards=Math.max(s.shards,old.shards||0);s.dust=old.dust||0;s.wins=old.wins||0;s.losses=old.losses||0;
      Object.entries(old.coll||{}).forEach(([id,n])=>{if(CARD[id])s.coll[id]=Math.max(s.coll[id]||0,Math.min(n,RAR[CARD[id].rarity].max))})}}catch(e){}
  return s;
}
let S=null;
try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}
if(!S||!S.coll||!S.decks)S=defaultSave();
PLAYABLE.forEach(w=>{S.decks[w]=(S.decks[w]||[]).filter(id=>CARD[id])});
function persist(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
const owned=id=>S.coll[id]||0;
const inDeck=(id,w)=>S.decks[w].filter(x=>x===id).length;
const deckMax=id=>Math.min(owned(id),RAR[CARD[id].rarity].max);
const neutralCount=w=>S.decks[w].filter(id=>CARD[id].world==='neutral').length;
const deckOk=w=>S.decks[w].length===RULES.deckSize&&neutralCount(w)<=RULES.neutralMax;
function canAddTo(id,w){const c=CARD[id];if(c.world!==w&&c.world!=='neutral')return false;if(inDeck(id,w)>=deckMax(id)||S.decks[w].length>=RULES.deckSize)return false;if(c.world==='neutral'&&neutralCount(w)>=RULES.neutralMax)return false;return true}

/* ---------- UI helpers ---------- */
let screen='menu', PK=null, CV={tab:'coll',filter:'all',deckWorld:'lotr',open:null};
function toast(m){const d=document.createElement('div');d.className='toast';d.textContent=m;document.body.appendChild(d);setTimeout(()=>d.remove(),2000)}
function banner(m){const d=document.createElement('div');d.className='banner';d.textContent=m;document.body.appendChild(d);setTimeout(()=>d.remove(),1300)}
const cur=()=>`<span class="cur">🔹 ${S.shards} · <i>✨ ${S.dust}</i></span>`;
const header=t=>`<div class="hdr"><button class="ib" data-act="menu" aria-label="Wróć do menu">←</button><h2>${t}</h2>${cur()}</div>`;
function render(){({menu:renderMenu,leaders:renderLeaders,rules:renderRules,pack:renderPack,coll:renderColl,save:renderSave,game:renderGame})[screen]()}

/* ---------- menu główne w stylu Gwinta ---------- */
const FEATURE={lotr:'aragorn',sw:'luke',marvel:'ironman',naruto:'kakashi'};
const lastWorld=()=>PLAYABLE.includes(S.lastWorld)?S.lastWorld:'lotr';
function menuCard(act,label,id,icon,cls=''){
  const c=CARD[id]||LEADERS.find(l=>l.id===id), a=artSrc(c), w=c?c.world:'neutral';
  return `<button class="mc ${cls}" data-act="${act}" style="--u:var(--${w})">
    <span class="mc-art">${a?artImg(a):`<span class="mc-ico">${icon}</span>`}</span><span class="mc-l">${label}</span></button>`;
}
function renderMenu(){
  const lw=lastWorld(), L=leaderOf(lw), la=artSrc(L);
  app.innerHTML=`<div class="mmn" style="--u:var(--${lw})">
    ${la?`<img class="mm-bg" src="${la}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">`:''}
    <div class="mm-top">
      <div class="mm-prof"><span class="mm-por" style="--u:var(--${lw})">${L.icon}${la?artImg(la):''}</span>
        <span class="mm-name"><b>Gracz</b><small>${WORLDS[lw].n}</small></span>
        <span class="mm-badge" title="Wygrane"><b>${S.wins}</b><small>wygr.</small></span>
        <span class="mm-badge" title="Porażki"><b>${S.losses}</b><small>por.</small></span></div>
      <div class="mm-cur"><span><b>${S.shards}</b><small>🔹 odłamki</small></span><span><b>${S.dust}</b><small>✨ pył</small></span>
        <button class="mm-shop" data-act="packs">SKLEP</button></div>
    </div>
    <div class="mm-mid">
      <div class="mm-hero"><div class="logo"><div class="u">UNIVERSE</div><span class="m">MADNESS</span><div class="bars"><i></i><i></i><i></i><i></i></div></div>
        <p class="tag">${WORLDS[lw].n} czeka. Ostatnio grałeś jako ${L.name}.</p>${artNote()}</div>
      <div class="mm-fan">
        ${menuCard('play','Gra',L.id,L.icon,'main')}
        ${menuCard('coll','Tworzenie talii',FEATURE[lw],'🃏')}
        ${menuCard('packs','Paczki','thanos','🎴')}
      </div>
    </div>
    <div class="mm-bot"><span class="note">v${APP_VERSION}</span>
      <span class="mm-icons"><button class="ib" data-act="rules" aria-label="Zasady">📖</button><button class="ib" data-act="save" aria-label="Zapis">💾</button></span></div>
  </div>`;
}
let LV={sel:null};
function renderLeaders(){
  const sel=LV.sel||lastWorld(), W=WORLDS[sel], l=leaderOf(sel), ok=deckOk(sel);
  app.innerHTML=`<div class="scr ls">${header('Wybierz świat')}
    <div class="ls-row">${PLAYABLE.map(w=>{const L=leaderOf(w),a=artSrc(L);
      return `<button class="mc lc ${w===sel?'on':''}" data-act="sel-world" data-w="${w}" style="--u:var(--${w})">
        <span class="mc-art">${a?artImg(a):`<span class="mc-ico">${L.icon}</span>`}</span>
        <span class="mc-l">${L.name}<small>${WORLDS[w].i} ${WORLDS[w].n}</small></span></button>`}).join('')}</div>
    <div class="ls-info" style="--u:var(--${sel})">
      <div class="ls-txt"><b>${W.mech}</b> · ${W.desc}<br><span class="wp"><b>${l.power.name}</b> (2🔷): ${l.power.text}</span>
        ${ok?'':`<br><span class="bad">Talia ${S.decks[sel].length}/${RULES.deckSize}${neutralCount(sel)>RULES.neutralMax?' · za dużo neutralnych':''}: popraw w Tworzeniu talii</span>`}</div>
      <div class="lvl"><small>Poziom AI</small><div class="seg">${Object.entries(AI_LEVELS).map(([k,n])=>`<button class="${aiLevel()===k?'on':''}" data-act="ai-level" data-l="${k}">${n}</button>`).join('')}</div><small>Wygrana: +${RULES.winByLevel[aiLevel()]} 🔹</small></div>
      <button class="btn" data-act="pick-world" data-w="${sel}">${ok?'Graj':'Popraw talię'}</button>
    </div></div>`;
}
function renderRules(){
  app.innerHTML=`<div class="scr">${header('Zasady')}<div class="body rules">
    <section><h3>Cel</h3><p>Zbij HP wrogiego Lidera (${RULES.leaderHp}) do zera.</p></section>
    <section><h3>Światy i talie</h3><ul><li>Każdy świat ma swojego Lidera i mechanikę.</li><li>Talia: ${RULES.deckSize} kart z twojego świata + max ${RULES.neutralMax} neutralnych (Multiwersum).</li><li>Max 2 kopie karty, Legendarna 1.</li></ul></section>
    <section><h3>Mechaniki światów</h3><ul>${PLAYABLE.map(w=>`<li><b>${WORLDS[w].n}, ${WORLDS[w].mech}:</b> ${WORLDS[w].desc}</li>`).join('')}<li><b>Madness:</b> na początku tury masz jednostki z 3+ różnych światów (licząc neutralne po ich pochodzeniu) → +1 many.</li></ul></section>
    <section><h3>Tura</h3><ul><li>Mana: start 1, +1 co turę (max 10).</li><li>Dobierasz 1 kartę na turę, max ${RULES.handMax} w ręce, max ${RULES.boardMax} jednostek na stole.</li><li>Zdolność Lidera: 2 many, raz na turę.</li><li>Pusta talia: tracisz 1, potem 2, 3… HP.</li></ul></section>
    <section><h3>Sterowanie</h3><ul><li>Przeciągnij kartę z ręki na stół. Zaklęcie z celem upuść na cel.</li><li>Atak: przeciągnij jednostkę z zieloną ramką na wroga albo dotknij jej, a potem celu.</li><li>Dotknij karty, żeby zobaczyć opis.</li></ul></section>
    <section><h3>Słowa kluczowe</h3><ul><li><b>Szarża ⚡:</b> atakuje od razu.</li><li><b>Prowokacja</b> (gruba ramka): trzeba ją zbić najpierw.</li><li><b>Okrzyk:</b> efekt przy zagraniu.</li></ul></section>
    <section><h3>Kolekcja</h3><ul><li>Paczka (100🔹): 4 losowe karty + ostatnia do wyboru z 3 (min. Rzadka).</li><li>Odłamki 🔹 za grę: wygrana +60, porażka +25.</li><li>Rozbijaj karty na Pył ✨, twórz brakujące za Pył.</li></ul></section>
  </div></div>`;
}

/* ---------- eksport / import zapisu ---------- */
const SAVE_PREFIX='UM2:';
const exportCode=()=>SAVE_PREFIX+btoa(unescape(encodeURIComponent(JSON.stringify(S))));
function parseCode(txt){
  const t=(txt||'').trim().replace(/\s+/g,'');
  if(!t.startsWith(SAVE_PREFIX))throw new Error('Kod musi zaczynać się od '+SAVE_PREFIX);
  const d=JSON.parse(decodeURIComponent(escape(atob(t.slice(SAVE_PREFIX.length)))));
  if(!d||typeof d.coll!=='object'||typeof d.decks!=='object')throw new Error('To nie jest zapis Universe Madness');
  PLAYABLE.forEach(w=>{d.decks[w]=(d.decks[w]||[]).filter(id=>CARD[id])});
  return d;
}
let SV={confirm:false,msg:''};
function renderSave(){
  app.innerHTML=`<div class="scr">${header('Zapis')}<div class="body rules">
    <section><h3>Eksport</h3><p>Skopiuj kod i schowaj go (notatki, wiadomość do siebie). Wczytasz nim kolekcję na innym telefonie albo po wyczyszczeniu przeglądarki.</p>
      <textarea class="code" id="exp" readonly rows="4">${exportCode()}</textarea>
      <button class="btn" data-act="copy-save" style="width:100%;margin-top:8px">Kopiuj kod</button></section>
    <section><h3>Import</h3><p>Wklej kod zapisu. Obecna kolekcja, talie i odłamki zostaną zastąpione.</p>
      <textarea class="code" id="imp" rows="4" placeholder="UM2:…"></textarea>
      <button class="btn ${SV.confirm?'':'sec'}" data-act="import" style="width:100%;margin-top:8px">${SV.confirm?'Na pewno? Dotknij, żeby nadpisać':'Wczytaj zapis'}</button>
      ${SV.msg?`<p class="note" style="margin-top:8px">${SV.msg}</p>`:''}</section>
    <section><h3>Grafiki</h3><p>Mam ${Object.values(ART).filter(Boolean).length}/${Object.keys(ART_SRC).length} grafik postaci. Jeśli któraś się nie pobrała albo wygląda źle, pobierz wszystkie od nowa.</p>
      <button class="btn sec" data-act="art-reset" style="width:100%;margin-top:8px">Pobierz grafiki od nowa</button>${artNote()}</section>
  </div></div>`;
}

/* ---------- paczki (w stylu Gwinta) ---------- */
function rollId(min){
  const w=min==='R'?[['R',70],['E',24],['L',6]]:[['C',70],['R',22],['E',7],['L',1]];
  let r=Math.random()*w.reduce((s,x)=>s+x[1],0), rar=w[0][0];
  for(const [k,v] of w){if(r<v){rar=k;break}r-=v}
  return pick(CARDS.filter(c=>c.rarity===rar)).id;
}
function addCard(id){
  const isNew=!owned(id);
  if(owned(id)>=RAR[CARD[id].rarity].max){const d=RAR[CARD[id].rarity].mill;S.dust+=d;return {isNew:false,dust:d}}
  S.coll[id]=owned(id)+1;return {isNew,dust:0};
}
function openPack(){
  if(PK&&PK.stage==='tear')return;
  if(S.shards<RULES.packCost){toast('Za mało odłamków. Zagraj partię!');return}
  S.shards-=RULES.packCost;
  const cards=[0,1,2,3].map(()=>{const id=rollId('C');return {id,open:false,...addCard(id)}});
  const ch=[];for(let g=0;ch.length<3&&g<60;g++){const id=rollId('R');if(!ch.includes(id))ch.push(id)}
  persist();PK={stage:'tear',cards,choices:ch,picked:null,res:null,just:new Set()};render();
  setTimeout(()=>{if(PK&&PK.stage==='tear'){PK.stage='reveal';render()}},RM()?0:950);
}
const badge=r=>r.isNew?'<span class="badge new">NOWA</span>':r.dust?`<span class="badge dup">+${r.dust}✨</span>`:'';
const packArt=(cls='')=>`<div class="pack ${cls}"><span class="pk-u">UNIVERSE</span><span class="pk-m">MADNESS</span><span class="pk-bars"><i></i><i></i><i></i><i></i></span><span class="pk-n">5 kart</span></div>`;
/* karta do odwracania: rewers + awers w 3D; .just = animacja odwrócenia przy tym renderze */
function flipCard(c,i,delay=0){
  const C=CARD[c.id], just=PK.just.has(i);
  return `<button class="fc ${c.open?'open':''} ${just?'just':''} g-${C.rarity}" data-act="flip" data-i="${i}" style="--d:${delay}s" aria-label="${c.open?C.name:'Odkryj kartę'}">
    <span class="fc-in"><span class="fc-b">${backFace('pk')}</span><span class="fc-f">${cardFace(C,'pk')}</span></span>
    ${c.open?badge(c):''}</button>`;
}
function renderPack(){
  const canOpen=S.shards>=RULES.packCost, packs=Math.floor(S.shards/RULES.packCost);
  let body;
  if(!PK||PK.stage==='tear'){
    const tear=PK&&PK.stage==='tear';
    body=`<div class="pk-shop">
      <button class="pk-hit" data-act="open" ${canOpen||tear?'':'disabled'} aria-label="Otwórz paczkę">${packArt(tear?'tear':'')}${tear?'<span class="flash"></span>':''}</button>
      <div class="pk-side">
        <h3>Paczka Uniwersów</h3>
        <p>4 losowe karty ze wszystkich światów, a piątą wybierasz z trzech (co najmniej Rzadka). Duplikaty ponad limit zamieniają się w Pył ✨.</p>
        <button class="btn" data-act="open" ${canOpen&&!tear?'':'disabled'}>Otwórz · 100 🔹</button>
        <p class="note">${canOpen?`Stać cię na ${packs} ${packs===1?'paczkę':packs<5?'paczki':'paczek'}.`:'Za mało odłamków. Wygrana daje 35–90 🔹, porażka 25 🔹.'}</p>
      </div></div>`;
  } else if(PK.stage==='reveal'){
    const all=PK.cards.every(c=>c.open);
    body=`<div class="pk-stage"><p class="sec-t">${all?'Twoje karty':'Dotknij kart, żeby je odkryć'}</p>
      <div class="pk-row">${PK.cards.map((c,i)=>flipCard(c,i,PK.stagger?PK.stagger.indexOf(i)*.22:0)).join('')}</div>
      <div class="pk-act">${all?`<button class="btn" data-act="to-choose">Dalej: wybierz piątą kartę</button>`:`<button class="btn sec" data-act="flipall">Odkryj wszystkie</button>`}</div></div>`;
  } else if(PK.stage==='choose'){
    const pc=PK.picked&&CARD[PK.picked];
    body=`<div class="pk-choose"><div class="pk-stage"><p class="sec-t">Piąta karta: wybierz 1 z 3</p>
      <div class="pk-row">${PK.choices.map(id=>`<button class="pk-pick g-${CARD[id].rarity} ${PK.picked===id?'on':''}" data-act="choose" data-id="${id}">${cardFace(CARD[id],'pk')}</button>`).join('')}</div></div>
      <div class="pk-info">${pc?`<b>${pc.name}</b><small>${cardLabel(pc)}</small><p>${cardText(pc)||'Bez efektu. Czysta siła.'}</p>${owned(pc.id)?`<small>Masz już ${owned(pc.id)}/${RAR[pc.rarity].max}</small>`:'<small class="nw">Nowa w kolekcji</small>'}`:'<p>Dotknij karty, żeby zobaczyć opis.</p>'}
        <button class="btn" data-act="take" ${pc?'':'disabled'}>Zabierz kartę</button></div></div>`;
  } else {
    const got=[...PK.cards,{id:PK.picked,...PK.res,pick:true}], dust=got.reduce((s,c)=>s+(c.dust||0),0), nw=got.filter(c=>c.isNew).length;
    body=`<div class="pk-stage"><p class="sec-t">Z paczki</p>
      <div class="pk-row sum">${got.map(c=>`<div class="pk-got ${c.pick?'on':''}">${cardFace(CARD[c.id],'pk')}${badge(c)}</div>`).join('')}</div>
      <p class="note">${nw?`Nowe karty: ${nw}`:'Bez nowych kart'}${dust?` · Pył z duplikatów: +${dust} ✨`:''}</p>
      <div class="pk-act"><button class="btn" data-act="open" ${canOpen?'':'disabled'}>Kolejna paczka · 100 🔹</button><button class="btn sec" data-act="coll">Kolekcja</button></div></div>`;
  }
  app.innerHTML=`<div class="scr">${header('Paczki')}<div class="body pk-body">${body}</div></div>`;
  if(PK)PK.just.clear(),PK.stagger=null;
}

/* ---------- kolekcja i talie ---------- */
function renderColl(){
  const dw=CV.deckWorld, n=S.decks[dw].length, nn=neutralCount(dw);
  let body;
  if(CV.tab==='coll'){
    const list=CARDS.filter(c=>CV.filter==='all'||c.world===CV.filter).sort((a,b)=>a.cost-b.cost||a.name.localeCompare(b.name));
    body=`<div class="chips">${[['all','Wszystkie'],...Object.entries(WORLDS).map(([k,v])=>[k,v.i+' '+v.n])].map(([k,l])=>`<button class="${CV.filter===k?'on':''}" data-act="filter" data-f="${k}">${l}</button>`).join('')}</div>
      <div class="grid">${list.map(c=>{const dk=c.world==='neutral'?dw:c.world, d=inDeck(c.id,dk);
        return `<button class="tile ${owned(c.id)?'':'locked'}" data-act="card" data-id="${c.id}">${cardFace(c,'md')}<span class="own">${owned(c.id)?'×'+owned(c.id):'brak'}</span>${d?`<span class="ind">T${d}</span>`:''}</button>`}).join('')}</div>`;
  } else {
    const ids=[...new Set(S.decks[dw])].sort((a,b)=>(CARD[a].world==='neutral')-(CARD[b].world==='neutral')||CARD[a].cost-CARD[b].cost||CARD[a].name.localeCompare(CARD[b].name));
    body=`<div class="chips">${PLAYABLE.map(w=>`<button class="${dw===w?'on':''}" data-act="deckworld" data-w="${w}">${WORLDS[w].i} ${WORLDS[w].n}</button>`).join('')}</div>
      <div class="dhead"><b class="${deckOk(dw)?'':'bad'}">Talia ${n}/${RULES.deckSize} · neutralne ${nn}/${RULES.neutralMax}</b><button class="smallb" data-act="reset-deck">Startowa</button></div>
      ${n<RULES.deckSize?`<p class="note">Dodaj karty: Kolekcja → filtr ${WORLDS[dw].n} albo Multiwersum → dotknij karty → „Do talii”.</p>`:''}
      <div class="drows">${ids.map(id=>{const c=CARD[id];return `<div class="drow" style="--u:var(--${c.world})"><span class="dc">${c.cost}</span><span>${c.icon}</span><span class="dn">${c.name}</span><span class="dx">×${inDeck(id,dw)}</span><button class="ib" data-act="remove" data-id="${id}" aria-label="Usuń z talii">−</button></div>`}).join('')}</div>`;
  }
  let modal='';
  if(CV.open){
    const c=CARD[CV.open], r=RAR[c.rarity], o=owned(c.id), tw=c.world==='neutral'?dw:c.world, d=inDeck(c.id,tw);
    modal=`<div class="ov" data-act="close"><div class="modal" data-act="noop">${cardFace(c,'lg')}<div class="mside">
      <p>Masz ${o}/${r.max} · w talii ${WORLDS[tw].n}: ${d} · Pył ✨ ${S.dust}</p>
      <div class="mbt">
        <button class="btn" data-act="add" data-id="${c.id}" ${canAddTo(c.id,tw)?'':'disabled'}>Do talii +</button>
        <button class="btn sec" data-act="remove" data-id="${c.id}" ${d?'':'disabled'}>Z talii −</button>
        <button class="btn sec" data-act="craft" data-id="${c.id}" ${o<r.max&&S.dust>=r.craft?'':'disabled'}>Stwórz −${r.craft}✨</button>
        <button class="btn sec" data-act="mill" data-id="${c.id}" ${o?'':'disabled'}>Rozbij +${r.mill}✨</button>
      </div>${c.world==='neutral'?`<p>Neutralna: trafia do talii ${WORLDS[dw].n} (zmień w zakładce Talie)</p>`:''}
      <button class="btn sec" data-act="close" style="width:100%">Zamknij</button></div></div></div>`;
  }
  app.innerHTML=`<div class="scr">${header('Kolekcja')}
    <div class="tabs"><button class="${CV.tab==='coll'?'on':''}" data-act="tab" data-t="coll">Kolekcja</button><button class="${CV.tab==='deck'?'on':''}" data-act="tab" data-t="deck">Talie</button></div>
    <div class="body">${artNote()}${body}</div></div>${modal}`;
}

/* ---------- animacje ---------- */
const RM=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
let LUNGE=null;
/* wyskok jednostki do celu; obietnica kończy się w chwili uderzenia */
function lunge(uid,tk){
  return new Promise(res=>{
    const a=app.querySelector(`[data-k="U${uid}"]`), b=app.querySelector(`[data-k="${tk}"]`);
    if(!a||!b||RM()||!a.animate){res();return}
    const ra=a.getBoundingClientRect(), rb=b.getBoundingClientRect();
    const dx=((rb.left+rb.width/2)-(ra.left+ra.width/2))*.8, dy=((rb.top+rb.height/2)-(ra.top+ra.height/2))*.8;
    a.style.zIndex=30;a.style.position='relative';
    a.animate([{transform:'none'},{transform:`translate(${dx*.15}px,${dy*.15}px) scale(1.08)`,offset:.35},{transform:`translate(${dx}px,${dy}px) scale(1.12)`}],{duration:300,easing:'ease-in',fill:'forwards'});
    LUNGE={uid,dx,dy};setTimeout(res,300);
  });
}
/* po renderze: atakujący wraca z miejsca uderzenia na swoje pole */
function lungeBack(){
  if(!LUNGE)return;const {uid,dx,dy}=LUNGE;LUNGE=null;
  const a=app.querySelector(`[data-k="U${uid}"]`);
  if(a&&a.animate&&!RM())a.animate([{transform:`translate(${dx}px,${dy}px) scale(1.12)`,zIndex:30},{transform:'none'}],{duration:260,easing:'ease-out'});
}
/* karta zagrana przez przeciwnika pokazuje się na chwilę na środku */
function showPlayed(id){
  return new Promise(res=>{
    if(RM()){res();return}
    const d=document.createElement('div');d.className='played';d.innerHTML=cardFace(CARD[id],'md')+'<span>Przeciwnik zagrywa</span>';
    document.body.appendChild(d);setTimeout(()=>{d.remove();res()},1050);
  });
}
const settle=()=>new Promise(r=>requestAnimationFrame(()=>r()));
/* atak gracza: walidacja, wyskok, potem właściwy atak */
async function attackUI(uid,t){
  if(!canAttackTarget(0,uid,t)){if(t&&t.p===1)toast('Najpierw zbij jednostkę z Prowokacją');G.sel=null;render();return}
  G.anim=true;G.sel=null;render();
  await lunge(uid,keyOf(t));
  attack(0,uid,t);G.anim=false;render();
}

async function runAI(){
  G.busy=true;render();await sleep(700);
  for(const step of aiTurnSteps(1)){
    if(screen!=='game')return;
    if(step&&step.kind==='preplay'){await showPlayed(step.id);continue}
    if(step&&step.kind==='preattack'){render();await lunge(step.uid,keyOf(step.t));continue}
    render();await settle();await sleep(step==='attack'?450:550);
  }
  G.busy=false;
  if(screen!=='game')return;
  if(!G.over)endTurnUI();else render();
}
function endTurnUI(){nextTurn();render();if(G.turn===1&&!G.over)runAI()}
const isLandscape=()=>true;
function startGame(w){
  S.lastWorld=w;persist();
  const aiW=pick(PLAYABLE.filter(x=>x!==w));
  createGame(w,S.decks[w],aiW,starterDeckOf(aiW),aiLevel());
  G.mull=new Set();
  screen='game';render();
}
function finishMulligan(){
  const n=mulligan(0,[...G.mull]);aiMulligan(1);G.mull=null;
  if(n)toast(`Wymieniono ${n} ${n===1?'kartę':n<5?'karty':'kart'}`);
  beginGame();render();
  if(G.turn===1&&!G.over)runAI();
}
function mullHTML(){
  const me=G.p[0];
  return `<div class="ov mull"><h2>Wymiana kart</h2>
    <p>${G.first===0?'Zaczynasz ty.':'Zaczyna przeciwnik, ty masz dodatkową kartę.'} Dotknij kart, które chcesz wymienić.</p>
    <div class="prow">${me.hand.map((h,i)=>`<button class="slot ${G.mull.has(i)?'swap':''}" data-act="mull-toggle" data-i="${i}">${cardFace(CARD[h.id],'md')}${G.mull.has(i)?'<span class="mx">✕</span>':''}</button>`).join('')}</div>
    <button class="btn" data-act="mull-ok">${G.mull.size?`Wymień ${G.mull.size} i graj`:'Zostaw rękę i graj'}</button></div>`;
}
HOOKS.toast=m=>toast(m);
HOOKS.banner=m=>banner(m);
const aiLevel=()=>AI_LEVELS[S.aiLevel]?S.aiLevel:'normal';
HOOKS.gameOver=o=>{o.rw=o.res==='win'?RULES.winByLevel[G.lv[1]]||RULES.reward.win:RULES.reward[o.res];S.shards+=o.rw;if(o.res==='win')S.wins++;if(o.res==='lose')S.losses++;persist()};

/* ---------- render gry ---------- */
function targetKeys(){
  if(G.pending){const t=G.pending.kind==='bc'?G.pending.eff.t:G.p[0].leader.power.t;return new Set(validTargets(t,0).map(keyOf))}
  if(G.sel)return new Set(validAttack(0).map(keyOf));
  return new Set();
}
function mechStatus(p){
  const pl=G.p[p];
  const m={lotr:[`Drużyna ${races(p)}/3`,races(p)>=3],sw:[`Moc ${pl.force}`,pl.force>=3],marvel:[`Zbiórka ${pl.heroes}`,pl.heroes>=1],naruto:[`Klony ${clones(p)}`,clones(p)>0]}[pl.world];
  return `<span class="mad ${m[1]?'on':''}">${m[0]}</span> · <span class="mad ${worldsOn(p)>=3?'on':''}">Madness ${worldsOn(p)}/3</span>`;
}
function leaderBar(p,tg,myTurn){
  const pl=G.p[p], L=pl.leader, k='L'+p, a=artSrc(L);
  const crys=Array.from({length:RULES.maxMana},(_,i)=>`<i class="${i<pl.mana?'f':i<pl.max?'e':''}"></i>`).join('');
  const right=p===0
    ?`<button class="pow" data-act="power" ${myTurn&&!G.busy&&!pl.powerUsed&&pl.mana>=RULES.powerCost&&!G.pending?'':'disabled'}><span>${L.power.name}</span><i>2🔷</i></button>`
    :`<div class="epow">${WORLDS[pl.world].n}<br>Ręka: ${pl.hand.length} · Talia ${pl.deck.length}</div>`;
  return `<div class="lb ${p?'lb-e':'lb-m'}">
    <div class="por ${tg.has(k)?'tgt':''}" data-tgt="${k}" data-k="${k}" data-leader="${p}" style="--u:var(--${L.world})">${L.icon}${a?artImg(a):''}<span class="hp">${pl.hp}</span>${pl.armor?`<span class="ar">${pl.armor}</span>`:''}</div>
    <div class="li">${p?`<span class="lvtag">AI ${AI_LEVELS[G.lv[1]]}</span>`:''}<b>${L.name}</b><div class="mana"><b>${pl.mana}/${pl.max}</b>${crys}</div>
    <small>${mechStatus(p)} · ${p?`Ręka ${pl.hand.length} · `:''}Talia ${pl.deck.length}</small></div>${right}</div>`;
}
function unitHTML(u,owner,tg,myTurn){
  const k='U'+u.uid; u.art=artSrc(CARD[u.id]||TOKENS[u.id]);
  const cls=['unit',G.seen&&!G.seen.has(u.uid)&&G.phase==='play'?'enter':'',u.art?'has-art':'',u.kw.includes('taunt')?'taunt':'',owner===0&&myTurn&&!G.busy&&u.canAttack&&!G.pending?'ready':'',G.sel===u.uid?'sel':'',tg.has(k)?'tgt':''].join(' ');
  return `<div class="${cls}" data-uid="${u.uid}" data-owner="${owner}" data-tgt="${k}" data-k="${k}" style="--u:var(--${u.world})">
    ${u.art?artImg(u.art):''}<span class="ui">${u.icon}</span><span class="nm">${u.name}</span>
    ${u.kw.includes('charge')?'<span class="kw">⚡</span>':''}
    <span class="at ${u.atk>u.baseAtk?'up':''}">${u.atk}</span><span class="hpx ${u.hp<u.maxHp?'hurt':u.maxHp>u.baseHp?'up':''}">${u.hp}</span>
    ${u.frozen||u.webbed?'<span class="web">🕸️</span>':''}</div>`;
}
function deathGhosts(){
  const alive=new Set([...G.p[0].board,...G.p[1].board].map(u=>u.uid)), out=[];
  if(RM())return out;
  app.querySelectorAll('.unit[data-uid]').forEach(el=>{
    if(alive.has(+el.dataset.uid))return;
    const r=el.getBoundingClientRect(), g=el.cloneNode(true);
    ['data-uid','data-k','data-tgt','data-owner'].forEach(a=>g.removeAttribute(a));
    g.classList.remove('tgt','sel','ready');g.classList.add('dying');
    Object.assign(g.style,{position:'fixed',left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',margin:0,fontSize:getComputedStyle(el).fontSize});
    out.push(g);
  });
  return out;
}
function renderGame(){
  const ghosts=deathGhosts();
  if(!G.seen)G.seen=new Set();
  const me=G.p[0], ai=G.p[1], myTurn=G.turn===0&&!G.over, tg=targetKeys();
  const anyMove=myTurn&&(me.hand.some(h=>canPlay(0,CARD[h.id]))||me.board.some(u=>u.canAttack)||(!me.powerUsed&&me.mana>=2));
  const W=Math.max(200,app.clientWidth-(isLandscape()?302:0)), n=me.hand.length, cw=isLandscape()?72:64, step=n>1?Math.min(cw+4,(W-cw)/(n-1)):0;
  let mid;
  if(G.pending){
    const nm=G.pending.kind==='bc'?G.pending.name:me.leader.power.name;
    mid=`<div class="pend">🎯 ${nm}: wybierz cel</div><button class="smallb" data-act="cancel">${G.pending.kind==='bc'?'Pomiń':'Anuluj'}</button>`;
  } else {
    mid=`<button class="smallb" data-act="gmenu" aria-label="Menu gry">☰</button><button class="log" data-act="hist" aria-label="Historia walki">${G.log||''}<i>📜 historia</i></button>
      <button class="endb ${anyMove?'':'hot'}" data-act="end" ${myTurn&&!G.busy?'':'disabled'}>${G.busy?'Tura AI…':'Koniec tury'}</button>`;
  }
  let over='';
  if(G.phase==='mulligan'){over=mullHTML()}
  else if(G.histOpen){over=`<div class="ov hist" data-act="hist"><h2>Historia walki</h2><div class="hl" data-act="noop">${[...G.hist].reverse().map(h=>h.sep?`<div class="hs">${h.m}</div>`:`<div class="${h.dead?'hd':''}">${h.m}</div>`).join('')||'<div>Jeszcze nic się nie wydarzyło.</div>'}</div><button class="btn sec" data-act="hist">Zamknij</button></div>`}
  else if(G.over){const r=G.over.res;over=`<div class="ov"><h2>${r==='win'?'Zwycięstwo!':r==='lose'?'Porażka':'Remis'}</h2><p>+${G.over.rw} 🔹 odłamków (masz ${S.shards})</p>
    <div class="col"><button class="btn" data-act="again">Jeszcze raz</button><button class="btn sec" data-act="hist">Historia walki</button><button class="btn sec" data-act="packs">Paczki</button><button class="btn sec" data-act="menu">Menu</button></div></div>`}
  else if(G.menu){over=`<div class="ov"><h2>Pauza</h2><div class="col"><button class="btn" data-act="gmenu">Wróć do gry</button><button class="btn sec" data-act="${G.menu==='sure'?'surrender2':'surrender'}">${G.menu==='sure'?'Na pewno? Dotknij jeszcze raz':'Poddaj się'}</button></div></div>`}
  else if(G.preview){const pc=CARD[G.preview]||(TOKENS[G.preview]&&{...TOKENS[G.preview],cost:0,rarity:'C'});over=`<div class="ov">${cardFace(pc,'lg')}<p>Dotknij, aby zamknąć</p></div>`}
  app.innerHTML=`<div class="game" style="--ew:var(--${ai.world});--mw:var(--${me.world})">
    ${leaderBar(1,tg,myTurn)}
    <div class="board enemy">${ai.board.map(u=>unitHTML(u,1,tg,myTurn)).join('')||'<span class="empty">Pusto</span>'}</div>
    <div class="mid">${mid}</div>
    <div class="board mine" id="myboard">${me.board.map(u=>unitHTML(u,0,tg,myTurn)).join('')||'<span class="empty">Przeciągnij tu kartę</span>'}</div>
    ${leaderBar(0,tg,myTurn)}
    <div class="hand" id="hand">${me.hand.map((h,i)=>{const c=CARD[h.id];return `<div class="hc ${myTurn&&!G.busy&&!G.pending&&canPlay(0,c)?'ok':''}" data-hand="${i}" style="z-index:${i};${i?`margin-left:${step-cw}px`:''}">${cardFace(c,'sm','',costOf(0,c))}</div>`}).join('')}</div>
  </div>${over}`;
  ghosts.forEach(g=>{document.body.appendChild(g);setTimeout(()=>g.remove(),650)});
  [...G.p[0].board,...G.p[1].board].forEach(u=>G.seen.add(u.uid));
  lungeBack();
  flushFx();
}
function flushFx(){
  const q=G.fxq;G.fxq=[];const cnt={};
  q.forEach(f=>{
    const el=app.querySelector(`[data-k="${f.k}"]`);if(!el)return;
    const i=cnt[f.k]=(cnt[f.k]||0)+1;
    const s=document.createElement('span');s.className='pop '+f.c;s.textContent=f.t;s.style.setProperty('--d',(i-1)*18+'px');
    el.appendChild(s);
    if(f.c==='dmg'){el.classList.remove('hit');void el.offsetWidth;el.classList.add('hit')}
    setTimeout(()=>s.remove(),1000);
  });
}

/* ---------- dotyk: przeciąganie ---------- */
let drag=null, swallow=false, ghost=null, arrow=null;
function clearDragVisual(){
  if(ghost){ghost.remove();ghost=null}
  if(arrow){arrow.remove();arrow=null}
  app.querySelectorAll('.tgt,.drop,.lift').forEach(e=>e.classList.remove('tgt','drop','lift'));
}
function markTargets(keys){keys.forEach(k=>{const el=app.querySelector(`[data-tgt="${k}"]`);if(el)el.classList.add('tgt')})}
app.addEventListener('pointerdown',e=>{
  swallow=false;
  if(screen!=='game'||!G)return;
  if(G.preview){G.preview=null;swallow=true;render();return}
  if(G.phase==='mulligan'||G.anim||G.over||G.menu||G.busy||G.turn!==0||G.pending)return;
  const h=e.target.closest('[data-hand]'), u=e.target.closest('.unit[data-owner="0"]');
  if(h)drag={kind:'hand',idx:+h.dataset.hand,el:h,x0:e.clientX,y0:e.clientY,moved:false};
  else if(u){const f=findUnit(+u.dataset.uid);if(f&&f.u.canAttack)drag={kind:'unit',uid:+u.dataset.uid,el:u,x0:e.clientX,y0:e.clientY,moved:false}}
  if(drag){try{drag.el.setPointerCapture(e.pointerId)}catch(_){}}
});
window.addEventListener('pointermove',e=>{
  if(!drag)return;
  const dx=e.clientX-drag.x0, dy=e.clientY-drag.y0;
  if(!drag.moved){
    if(Math.hypot(dx,dy)<9)return;
    drag.moved=true;G.sel=null;
    if(drag.kind==='hand'){
      const c=CARD[G.p[0].hand[drag.idx].id];
      ghost=document.createElement('div');ghost.className='ghost';ghost.innerHTML=cardFace(c,'md','',costOf(0,c));document.body.appendChild(ghost);
      drag.el.classList.add('lift');
      if(c.type==='spell'&&TARGETED.has(c.play.t))markTargets(validTargets(c.play.t,0).map(keyOf));
      else app.querySelector('#myboard').classList.add('drop');
    } else {
      const r=drag.el.getBoundingClientRect();drag.cx=r.left+r.width/2;drag.cy=r.top+r.height/2;
      arrow=document.createElementNS('http://www.w3.org/2000/svg','svg');arrow.setAttribute('class','arrow');
      arrow.innerHTML=`<defs><marker id="ah" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#c9a45c"/></marker></defs><line stroke="#c9a45c" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 9" marker-end="url(#ah)"/>`;
      document.body.appendChild(arrow);drag.el.classList.add('sel');
      markTargets(validAttack(0).map(keyOf));
    }
  }
  if(ghost)ghost.style.transform=`translate(${e.clientX-52}px,${e.clientY-120}px) rotate(${Math.max(-8,Math.min(8,dx/20))}deg)`;
  if(arrow){const l=arrow.querySelector('line');l.setAttribute('x1',drag.cx);l.setAttribute('y1',drag.cy);l.setAttribute('x2',e.clientX);l.setAttribute('y2',e.clientY)}
});
window.addEventListener('pointerup',e=>{
  if(!drag)return;
  const d=drag;drag=null;
  if(!d.moved)return;
  swallow=true;
  if(ghost)ghost.style.display='none';if(arrow)arrow.style.display='none';
  const el=document.elementFromPoint(e.clientX,e.clientY);
  const tEl=el&&el.closest('[data-tgt]');
  clearDragVisual();
  if(d.kind==='hand'){
    const c=CARD[G.p[0].hand[d.idx].id];
    const handTop=app.querySelector('#hand').getBoundingClientRect().top;
    if(!canPlay(0,c)){if(e.clientY<handTop-10)toast(costOf(0,c)>G.p[0].mana?'Za mało many':c.type==='unit'?'Stół jest pełny':'Brak celu');render();return}
    if(c.type==='spell'&&TARGETED.has(c.play.t)){
      const t=tEl&&parseKey(tEl.dataset.tgt);
      if(t&&validTargets(c.play.t,0).map(keyOf).includes(keyOf(t)))playCard(0,d.idx,t);
      else if(e.clientY<handTop-10)toast('Upuść zaklęcie na podświetlony cel');
    } else if(e.clientY<handTop-10)playCard(0,d.idx,null);
  } else {
    const t=tEl&&parseKey(tEl.dataset.tgt);
    if(t&&t.p===1){attackUI(d.uid,t);return}
  }
  render();
});
window.addEventListener('pointercancel',()=>{if(drag){drag=null;clearDragVisual();if(G)render()}});

/* ---------- kliknięcia ---------- */
app.addEventListener('click',e=>{
  if(swallow){swallow=false;return}
  const a=e.target.closest('[data-act]');
  if(a)return doAct(a.dataset.act,a.dataset);
  if(screen!=='game'||!G||G.over||G.menu||G.anim||G.phase==='mulligan')return;
  const t=e.target.closest('[data-tgt]');
  if(G.pending){
    if(!t)return;
    const tt=parseKey(t.dataset.tgt);if(!tt||!targetKeys().has(keyOf(tt)))return;
    if(G.pending.kind==='bc'){const pd=G.pending;G.pending=null;applyFx(0,pd.eff,tt,pd.src);cleanup()}
    else{G.pending=null;usePower(0,tt)}
    render();return;
  }
  if(G.sel&&t){
    const tt=parseKey(t.dataset.tgt);
    if(tt&&tt.p===1){attackUI(G.sel,tt);return}
  }
  const h=e.target.closest('[data-hand]');
  if(h){G.sel=null;G.preview=G.p[0].hand[+h.dataset.hand].id;render();return}
  const u=e.target.closest('.unit');
  if(u){
    const f=findUnit(+u.dataset.uid);if(!f)return;
    if(f.p===0&&G.turn===0&&!G.busy&&f.u.canAttack){G.sel=G.sel===f.u.uid?null:f.u.uid;render();return}
    G.sel=null;G.preview=f.u.id;render();return;
  }
  const l=e.target.closest('[data-leader]');
  if(l){const L=G.p[+l.dataset.leader].leader;toast(`${L.name} · ${L.power.name}: ${L.power.text}`);return}
  if(G.sel){G.sel=null;render()}
});

function doAct(act,ds){
  const id=ds.id, dw=CV.deckWorld;
  switch(act){
    case 'noop': return;
    case 'menu': screen='menu';G=null;if(PK&&PK.stage==='done')PK=null;render();break;
    case 'play': case 'again': screen='leaders';LV.sel=null;G=null;render();break;
    case 'sel-world': LV.sel=ds.w;render();break;
    case 'pick-world': if(deckOk(ds.w))startGame(ds.w);else{CV.tab='deck';CV.deckWorld=ds.w;screen='coll';render()}break;
    case 'rules': screen='rules';render();break;
    case 'save': SV={confirm:false,msg:''};screen='save';render();break;
    case 'art-reset': if(!ART_STATUS.busy){ART={};try{localStorage.removeItem(ART_KEY)}catch(e){}resolveArt();toast('Pobieram grafiki od nowa')}render();break;
    case 'copy-save': {const ta=document.getElementById('exp');const fallback=()=>{ta.focus();ta.select();toast('Zaznaczone: skopiuj ręcznie')};
      try{navigator.clipboard.writeText(ta.value).then(()=>toast('Skopiowano kod zapisu'),fallback)}catch(e){fallback()}break}
    case 'import': {const v=document.getElementById('imp').value;let d;
      try{d=parseCode(v)}catch(e){SV={confirm:false,msg:'Nie udało się wczytać: '+e.message};render();break}
      if(!SV.confirm){SV={confirm:true,msg:''};const keep=v;render();document.getElementById('imp').value=keep;break}
      S=d;persist();SV={confirm:false,msg:`Wczytano: ${Object.values(S.coll).reduce((a,b)=>a+b,0)} kart, 🔹 ${S.shards}, ✨ ${S.dust}.`};render();break}
    case 'packs': G=null;screen='pack';if(PK&&PK.stage==='done')PK=null;render();break;
    case 'coll': G=null;screen='coll';CV.open=null;if(PK&&PK.stage==='done')PK=null;render();break;
    case 'open': openPack();break;
    case 'flip': {const c=PK&&PK.cards[+ds.i];if(c&&!c.open){c.open=true;PK.just.add(+ds.i);render()}break}
    case 'flipall': if(PK){PK.stagger=[];PK.cards.forEach((c,i)=>{if(!c.open){c.open=true;PK.just.add(i);PK.stagger.push(i)}});render()}break;
    case 'to-choose': if(PK){PK.stage='choose';render()}break;
    case 'choose': PK.picked=id;render();break;
    case 'take': if(PK&&PK.picked&&PK.stage==='choose'){PK.res=addCard(PK.picked);PK.stage='done';persist();render()}break;
    case 'tab': CV.tab=ds.t;render();break;
    case 'filter': CV.filter=ds.f;if(PLAYABLE.includes(ds.f))CV.deckWorld=ds.f;render();break;
    case 'deckworld': CV.deckWorld=ds.w;render();break;
    case 'card': CV.open=id;render();break;
    case 'close': CV.open=null;render();break;
    case 'add': {const w=CARD[id].world==='neutral'?dw:CARD[id].world;if(canAddTo(id,w)){S.decks[w].push(id);persist()}render();break}
    case 'remove': {const w=CARD[id].world==='neutral'?dw:CARD[id].world, d=S.decks[w], i=d.indexOf(id);if(i>=0){d.splice(i,1);persist()}render();break}
    case 'craft': {const r=RAR[CARD[id].rarity];if(owned(id)<r.max&&S.dust>=r.craft){S.dust-=r.craft;S.coll[id]=owned(id)+1;persist();toast(`Stworzono: ${CARD[id].name}`)}render();break}
    case 'mill': {const r=RAR[CARD[id].rarity];if(owned(id)){S.coll[id]--;S.dust+=r.mill;PLAYABLE.forEach(w=>{while(inDeck(id,w)>owned(id))S.decks[w].splice(S.decks[w].indexOf(id),1)});persist();toast(`+${r.mill} ✨ Pyłu`)}render();break}
    case 'reset-deck': {const d=starterDeckOf(dw);d.forEach(x=>{const k=d.filter(y=>y===x).length;if(owned(x)<k)S.coll[x]=k});S.decks[dw]=d;persist();render();break}
    case 'end': if(G&&G.turn===0&&!G.busy&&!G.pending)endTurnUI();break;
    case 'power': {
      const pl=G.p[0],pw=pl.leader.power;
      if(TARGETED.has(pw.t)){if(!validTargets(pw.t,0).length){toast('Brak celu dla zdolności');return}G.sel=null;G.pending={kind:'pw'};render()}
      else{if(!usePower(0,null))toast('Stół jest pełny');render()}
      break;}
    case 'cancel': G.pending=null;render();break;
    case 'mull-toggle': {const i=+ds.i;G.mull.has(i)?G.mull.delete(i):G.mull.add(i);render();break}
    case 'mull-ok': if(G&&G.phase==='mulligan')finishMulligan();break;
    case 'gmenu': G.menu=G.menu?false:true;render();break;
    case 'hist': if(G){G.histOpen=!G.histOpen;render()}break;
    case 'ai-level': S.aiLevel=ds.l;persist();render();break;
    case 'surrender': G.menu='sure';render();break;
    case 'surrender2': G.menu=false;G.p[0].hp=0;cleanup();render();break;
  }
}
window.addEventListener('resize',()=>{if(screen==='game'&&!drag)render()});
render();
resolveArt();
