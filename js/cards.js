/* Universe Madness — DANE: światy, karty, Liderzy, zasady, źródła grafik.
   Odpowiednik ScriptableObjectów: dodajesz kartę = dodajesz obiekt. */
/* =========================================================
   ŚWIATY (frakcje) — talia = karty jednego świata + max 6 neutralnych
   ========================================================= */
const WORLDS = {
  lotr:   {n:'Śródziemie',     i:'🧙', mech:'Drużyna', desc:'Efekty Drużyny działają, gdy masz na stole 3+ różne rasy.'},
  sw:     {n:'Gwiezdne Wojny', i:'🚀', mech:'Moc',     desc:'Karty ✦ dają +1 Mocy. Efekty „Moc N” działają od N Mocy.'},
  marvel: {n:'Marvel',         i:'🦸', mech:'Zbiórka', desc:'Efekty Zbiórki działają, jeśli w tej turze zagrałeś już innego bohatera Marvela.'},
  naruto: {n:'Naruto',         i:'🍥', mech:'Klony',   desc:'Przyzywaj Klony 1/1 i wzmacniaj karty za każdego z nich.'},
  neutral:{n:'Multiwersum',    i:'🌀', mech:'Neutralne',desc:'Karty neutralne pasują do każdej talii (max 6).'},
};
const PLAYABLE = ['lotr','sw','marvel','naruto'];
const SRC = {dbz:'Dragon Ball',dc:'DC',terminator:'Terminator',alien:'Obcy',godzilla:'Godzilla',transformers:'Transformers',onepiece:'One Piece',opm:'One Punch Man'};

/* =========================================================
   DANE KART — odpowiednik ScriptableObjectów.
   world: lotr | sw | marvel | naruto | neutral   (neutral: src = świat pochodzenia)
   race: rasa (Śródziemie, do Drużyny)            force: true = ✦ +1 Mocy przy zagraniu
   kw: 'charge' (Szarża), 'taunt' (Prowokacja)     costMod: 'clones' = -1 koszt za każdego Klona
   play: efekt Okrzyku / zaklęcia                  cond: {type:'party'|'force'|'assemble', n, play} efekt warunkowy
   fx: dmg heal buff buffAll buffClones selfBuff selfKw summon draw destroy freeze armor wipeEnemy wipe snap shield
   t:  any enemyUnit friendlyUnit enemyLeader myLeader allEnemyUnits allEnemies allFriendlyUnits
   starter: kopie w talii startowej swojego świata   art: true → art/<id>.webp
   ========================================================= */
const CARDS = [
  // ---------- Śródziemie ----------
  {id:'gollum',    name:'Gollum',        world:'lotr',race:'Hobbit',   type:'unit', cost:1,atk:1,hp:2,rarity:'C',icon:'🐟',play:{fx:'dmg',n:1,t:'enemyLeader'},starter:2},
  {id:'sam',       name:'Sam',           world:'lotr',race:'Hobbit',   type:'unit', cost:1,atk:1,hp:3,rarity:'C',icon:'🍳',play:{fx:'heal',n:2,t:'myLeader'},starter:2},
  {id:'frodo',     name:'Frodo',         world:'lotr',race:'Hobbit',   type:'unit', cost:2,atk:1,hp:3,rarity:'R',icon:'🎒',cond:{type:'party',n:3,play:{fx:'draw',n:1}},starter:2},
  {id:'legolas',   name:'Legolas',       world:'lotr',race:'Elf',      type:'unit', cost:2,atk:2,hp:1,rarity:'C',icon:'🏹',kw:['charge'],starter:2},
  {id:'gimli',     name:'Gimli',         world:'lotr',race:'Krasnolud',type:'unit', cost:3,atk:3,hp:3,rarity:'C',icon:'🪓',kw:['taunt'],starter:2},
  {id:'urukhai',   name:'Uruk-hai',      world:'lotr',race:'Ork',      type:'unit', cost:3,atk:4,hp:2,rarity:'C',icon:'👹',starter:2},
  {id:'galadriela',name:'Galadriela',    world:'lotr',race:'Elf',      type:'unit', cost:4,atk:2,hp:5,rarity:'R',icon:'✨',play:{fx:'heal',n:2,t:'allFriendlyUnits'},starter:1},
  {id:'aragorn',   name:'Aragorn',       world:'lotr',race:'Człowiek', type:'unit', cost:5,atk:4,hp:5,rarity:'E',icon:'👑',kw:['taunt'],cond:{type:'party',n:3,play:{fx:'selfBuff',a:2,h:2}},starter:2},
  {id:'smaug',     name:'Smaug',         world:'lotr',race:'Smok',     type:'unit', cost:6,atk:5,hp:5,rarity:'E',icon:'🐲',play:{fx:'dmg',n:2,t:'allEnemyUnits'},starter:1},
  {id:'sauron',    name:'Sauron',        world:'lotr',race:'Majar',    type:'unit', cost:8,atk:7,hp:7,rarity:'L',icon:'👁️',play:{fx:'dmg',n:3,t:'enemyLeader'}},
  {id:'armia',     name:'Armia Umarłych',world:'lotr',type:'spell',cost:3,rarity:'R',icon:'💀',play:{fx:'summon',token:'duch',n:2},starter:2},
  {id:'pierscien', name:'Pierścień Władzy',world:'lotr',type:'spell',cost:4,rarity:'E',icon:'💍',play:{fx:'buff',a:3,h:3,t:'friendlyUnit'},starter:2},
  // ---------- Gwiezdne Wojny ----------
  {id:'grogu',     name:'Grogu',         world:'sw',force:true,type:'unit',cost:1,atk:1,hp:2,rarity:'C',icon:'🐸',play:{fx:'heal',n:2,t:'myLeader'},starter:2},
  {id:'szturmowiec',name:'Szturmowiec',  world:'sw',type:'unit',cost:1,atk:2,hp:1,rarity:'C',icon:'🪖',starter:2},
  {id:'r2d2',      name:'R2-D2',         world:'sw',type:'unit',cost:2,atk:1,hp:3,rarity:'R',icon:'📟',play:{fx:'draw',n:1},starter:2},
  {id:'obiwan',    name:'Obi-Wan',       world:'sw',force:true,type:'unit',cost:3,atk:2,hp:4,rarity:'R',icon:'🧔',play:{fx:'dmg',n:1,t:'enemyUnit'},starter:2},
  {id:'han',       name:'Han Solo',      world:'sw',type:'unit',cost:3,atk:3,hp:2,rarity:'C',icon:'🔫',kw:['charge'],starter:2},
  {id:'chewie',    name:'Chewbacca',     world:'sw',type:'unit',cost:4,atk:4,hp:5,rarity:'R',icon:'🐻',kw:['taunt'],starter:2},
  {id:'luke',      name:'Luke Skywalker',world:'sw',force:true,type:'unit',cost:4,atk:3,hp:4,rarity:'E',icon:'🧑‍🚀',cond:{type:'force',n:3,play:{fx:'selfBuff',a:2,h:2}},starter:2},
  {id:'yoda',      name:'Yoda',          world:'sw',force:true,type:'unit',cost:5,atk:3,hp:5,rarity:'E',icon:'🟢',cond:{type:'force',n:3,play:{fx:'destroy',t:'enemyUnit'}},starter:1},
  {id:'palpatine', name:'Palpatine',     world:'sw',force:true,type:'unit',cost:7,atk:5,hp:6,rarity:'L',icon:'☠️',play:{fx:'dmg',n:'force',t:'enemyLeader'}},
  {id:'miecz',     name:'Miecz świetlny',world:'sw',force:true,type:'spell',cost:2,rarity:'C',icon:'🗡️',play:{fx:'buff',a:2,h:1,kw:'charge',t:'friendlyUnit'},starter:2},
  {id:'gwiazda',   name:'Gwiazda Śmierci',world:'sw',type:'spell',cost:4,rarity:'R',icon:'🛰️',play:{fx:'destroy',t:'enemyUnit'},starter:2},
  {id:'rozkaz66',  name:'Rozkaz 66',     world:'sw',type:'spell',cost:6,rarity:'E',icon:'📜',play:{fx:'wipe'},starter:1},
  // ---------- Marvel ----------
  {id:'hawkeye',   name:'Hawkeye',       world:'marvel',type:'unit',cost:2,atk:2,hp:1,rarity:'C',icon:'🎯',play:{fx:'dmg',n:1,t:'any'},starter:2},
  {id:'wdowa',     name:'Czarna Wdowa',  world:'marvel',type:'unit',cost:2,atk:2,hp:2,rarity:'C',icon:'🕷️',cond:{type:'assemble',play:{fx:'dmg',n:2,t:'enemyUnit'}},starter:2},
  {id:'kapitan',   name:'Kapitan Ameryka',world:'marvel',type:'unit',cost:2,atk:1,hp:4,rarity:'C',icon:'⭐',kw:['taunt'],starter:2},
  {id:'deadpool',  name:'Deadpool',      world:'marvel',type:'unit',cost:2,atk:3,hp:1,rarity:'R',icon:'😈',kw:['charge'],starter:2},
  {id:'spidey',    name:'Spider-Man',    world:'marvel',type:'unit',cost:3,atk:2,hp:3,rarity:'R',icon:'🕸️',play:{fx:'freeze',t:'enemyUnit'},starter:2},
  {id:'ironman',   name:'Iron Man',      world:'marvel',type:'unit',cost:5,atk:4,hp:4,rarity:'E',icon:'🦾',play:{fx:'dmg',n:2,t:'any'},starter:2},
  {id:'hulk',      name:'Hulk',          world:'marvel',type:'unit',cost:6,atk:6,hp:6,rarity:'E',icon:'💚',cond:{type:'assemble',play:{fx:'selfKw',kw:'charge'}},starter:2},
  {id:'thor',      name:'Thor',          world:'marvel',type:'unit',cost:7,atk:6,hp:6,rarity:'L',icon:'🔨',play:{fx:'dmg',n:2,t:'allEnemies'}},
  {id:'thanos',    name:'Thanos',        world:'marvel',type:'unit',cost:9,atk:8,hp:8,rarity:'L',icon:'🧤',play:{fx:'snap'}},
  {id:'serum',     name:'Serum Superżołnierza',world:'marvel',type:'spell',cost:2,rarity:'C',icon:'💉',play:{fx:'buff',a:2,h:2,t:'friendlyUnit'},starter:2},
  {id:'tarcza',    name:'Tarcza z Vibranium',world:'marvel',type:'spell',cost:1,rarity:'C',icon:'🔰',play:{fx:'armor',n:5,t:'myLeader'},starter:2},
  {id:'avengers',  name:'Avengers, zbiórka!',world:'marvel',type:'spell',cost:3,rarity:'R',icon:'🅰️',play:{fx:'buffAll',a:1,h:1},starter:2},
  // ---------- Naruto ----------
  {id:'hinata',    name:'Hinata',        world:'naruto',type:'unit',cost:2,atk:2,hp:2,rarity:'C',icon:'💜',play:{fx:'buffClones',a:1,h:1},starter:2},
  {id:'sakura',    name:'Sakura',        world:'naruto',type:'unit',cost:2,atk:2,hp:3,rarity:'C',icon:'🌸',play:{fx:'heal',n:3,t:'any'},starter:2},
  {id:'rocklee',   name:'Rock Lee',      world:'naruto',type:'unit',cost:3,atk:3,hp:2,rarity:'C',icon:'🥋',kw:['charge'],starter:2},
  {id:'shikamaru', name:'Shikamaru',     world:'naruto',type:'unit',cost:3,atk:2,hp:3,rarity:'R',icon:'🦌',play:{fx:'freeze',t:'enemyUnit'},starter:2},
  {id:'kakashi',   name:'Kakashi',       world:'naruto',type:'unit',cost:4,atk:3,hp:4,rarity:'R',icon:'📕',play:{fx:'draw',n:1},starter:2},
  {id:'sasuke',    name:'Sasuke',        world:'naruto',type:'unit',cost:4,atk:5,hp:3,rarity:'E',icon:'🌩️',kw:['charge'],starter:2},
  {id:'gaara',     name:'Gaara',         world:'naruto',type:'unit',cost:5,atk:2,hp:7,rarity:'R',icon:'🏜️',kw:['taunt'],starter:2},
  {id:'itachi',    name:'Itachi',        world:'naruto',type:'unit',cost:6,atk:5,hp:5,rarity:'E',icon:'🔥',play:{fx:'dmg',n:2,t:'allEnemyUnits'},starter:2},
  {id:'kurama',    name:'Kurama',        world:'naruto',type:'unit',cost:8,atk:8,hp:8,rarity:'L',icon:'🦊',costMod:'clones'},
  {id:'rasengan',  name:'Rasengan',      world:'naruto',type:'spell',cost:1,rarity:'C',icon:'🌀',play:{fx:'dmg',n:2,plusClones:true,t:'enemyUnit'},starter:2},
  {id:'armiaklonow',name:'Armia Klonów', world:'naruto',type:'spell',cost:3,rarity:'R',icon:'👥',play:{fx:'summon',token:'klon',n:3},starter:2},
  // ---------- Multiwersum (neutralne) ----------
  {id:'goku',      name:'Goku',          world:'neutral',src:'dbz',type:'unit',cost:5,atk:4,hp:5,rarity:'E',icon:'☁️',kw:['charge']},
  {id:'vegeta',    name:'Vegeta',        world:'neutral',src:'dbz',type:'unit',cost:6,atk:6,hp:4,rarity:'E',icon:'😠',kw:['charge']},
  {id:'kame',      name:'Kamehameha',    world:'neutral',src:'dbz',type:'spell',cost:2,rarity:'C',icon:'💥',play:{fx:'dmg',n:3,t:'any'}},
  {id:'senzu',     name:'Fasolka Senzu', world:'neutral',src:'dbz',type:'spell',cost:1,rarity:'C',icon:'🌱',play:{fx:'heal',n:4,t:'any'}},
  {id:'batman',    name:'Batman',        world:'neutral',src:'dc',type:'unit',cost:4,atk:3,hp:4,rarity:'R',icon:'🦇',play:{fx:'armor',n:3,t:'myLeader'}},
  {id:'wonder',    name:'Wonder Woman',  world:'neutral',src:'dc',type:'unit',cost:5,atk:4,hp:4,rarity:'R',icon:'🪢',kw:['charge']},
  {id:'t800',      name:'T-800',         world:'neutral',src:'terminator',type:'unit',cost:4,atk:3,hp:5,rarity:'R',icon:'🤖',kw:['taunt']},
  {id:'ripley',    name:'Ellen Ripley',  world:'neutral',src:'alien',type:'unit',cost:3,atk:2,hp:3,rarity:'R',icon:'👩‍🚀',play:{fx:'dmg',n:2,t:'enemyUnit'}},
  {id:'xeno',      name:'Ksenomorf',     world:'neutral',src:'alien',type:'unit',cost:4,atk:5,hp:2,rarity:'E',icon:'👾',kw:['charge']},
  {id:'godzilla',  name:'Godzilla',      world:'neutral',src:'godzilla',type:'unit',cost:7,atk:7,hp:7,rarity:'E',icon:'🦖'},
  {id:'optimus',   name:'Optimus Prime', world:'neutral',src:'transformers',type:'unit',cost:5,atk:4,hp:6,rarity:'E',icon:'🚛',kw:['taunt']},
  {id:'luffy',     name:'Luffy',         world:'neutral',src:'onepiece',type:'unit',cost:4,atk:4,hp:3,rarity:'R',icon:'👒',play:{fx:'draw',n:1}},
  {id:'zoro',      name:'Zoro',          world:'neutral',src:'onepiece',type:'unit',cost:4,atk:5,hp:3,rarity:'R',icon:'⚔️'},
  {id:'saitama',   name:'Saitama',       world:'neutral',src:'opm',type:'unit',cost:8,atk:4,hp:4,rarity:'L',icon:'👊',play:{fx:'wipeEnemy'}},
];
const TOKENS = {
  klon: {id:'klon', name:'Klon', world:'naruto',type:'unit',atk:1,hp:1,icon:'👤'},
  duch: {id:'duch', name:'Duch', world:'lotr',race:'Duch',type:'unit',atk:1,hp:1,icon:'👻'},
  agent:{id:'agent',name:'Agent S.H.I.E.L.D.',world:'marvel',type:'unit',atk:1,hp:2,icon:'🕶️'},
};
const LEADERS = [
  {id:'gandalf',name:'Gandalf',    world:'lotr',  icon:'🧙‍♂️',power:{name:'Nie przejdziesz!',fx:'shield',t:'friendlyUnit',text:'Twoja jednostka: +0/+2 i Prowokacja.'}},
  {id:'vader',  name:'Darth Vader',world:'sw',    icon:'🌑',power:{name:'Chwyt Mocy',fx:'dmg',n:1,t:'any',force:true,text:'1 obrażenie w dowolny cel, +1 Mocy.'}},
  {id:'fury',   name:'Nick Fury',  world:'marvel',icon:'🎖️',power:{name:'Inicjatywa',fx:'summon',token:'agent',n:1,text:'Przyzywa Agenta S.H.I.E.L.D. 1/2 (liczy się do Zbiórki).'}},
  {id:'naruto', name:'Naruto Uzumaki',world:'naruto',icon:'🍥',power:{name:'Kage Bunshin',fx:'summon',token:'klon',n:1,text:'Przyzywa Klona 1/1.'}},
];
const RAR = {C:{n:'Zwykła',craft:30,mill:5,max:2},R:{n:'Rzadka',craft:80,mill:20,max:2},E:{n:'Epicka',craft:200,mill:50,max:2},L:{n:'Legendarna',craft:800,mill:200,max:1}};
const RULES = {leaderHp:20,maxMana:10,boardMax:7,handMax:8,deckSize:20,neutralMax:6,powerCost:2,packCost:100,reward:{win:60,lose:25,draw:30}};

/* ---------- grafiki z zewnętrznych API (prywatne testy) ----------
   wiki = Wikipedia (tytuł artykułu), hero = Superhero API (nazwa), jikan = MyAnimeList (nazwa postaci) */
const ART_SRC = {
  gandalf:['wiki','Gandalf'], vader:['wiki','Darth_Vader'], fury:['hero','Nick Fury'], naruto:['jikan','Naruto'],
  gollum:['wiki','Gollum'], sam:['wiki','Samwise_Gamgee'], frodo:['wiki','Frodo_Baggins'], legolas:['wiki','Legolas'],
  gimli:['wiki','Gimli_(Middle-earth)'], urukhai:['wiki','Uruk-hai'], galadriela:['wiki','Galadriel'], aragorn:['wiki','Aragorn'],
  smaug:['wiki','Smaug'], sauron:['wiki','Sauron'], armia:['wiki','Army_of_the_Dead_(Middle-earth)'], pierscien:['wiki','One_Ring'],
  grogu:['wiki','Grogu'], szturmowiec:['wiki','Stormtrooper_(Star_Wars)'], r2d2:['wiki','R2-D2'], obiwan:['wiki','Obi-Wan_Kenobi'],
  han:['wiki','Han_Solo'], chewie:['wiki','Chewbacca'], luke:['wiki','Luke_Skywalker'], yoda:['wiki','Yoda'],
  palpatine:['wiki','Palpatine'], miecz:['wiki','Lightsaber'], gwiazda:['wiki','Death_Star'], rozkaz66:['wiki','Order_66'],
  hawkeye:['hero','Hawkeye'], wdowa:['hero','Black Widow'], kapitan:['hero','Captain America'], deadpool:['hero','Deadpool'],
  spidey:['hero','Spider-Man'], ironman:['hero','Iron Man'], hulk:['hero','Hulk'], thor:['hero','Thor'], thanos:['hero','Thanos'],
  tarcza:['wiki',"Captain_America's_shield"], avengers:['wiki','Avengers_(comics)'],
  hinata:['jikan','Hinata Hyuuga'], sakura:['jikan','Sakura Haruno'], rocklee:['jikan','Rock Lee'], shikamaru:['jikan','Shikamaru Nara'],
  kakashi:['jikan','Kakashi Hatake'], sasuke:['jikan','Sasuke Uchiha'], gaara:['jikan','Gaara'], itachi:['jikan','Itachi Uchiha'],
  kurama:['jikan','Kurama'],
  goku:['jikan','Goku'], vegeta:['jikan','Vegeta'], kame:['wiki','Kamehameha_(Dragon_Ball)'], batman:['hero','Batman'],
  wonder:['hero','Wonder Woman'], t800:['wiki','Terminator_(character)'], ripley:['wiki','Ellen_Ripley'], xeno:['wiki','Xenomorph'],
  godzilla:['wiki','Godzilla'], optimus:['wiki','Optimus_Prime'], luffy:['jikan','Luffy'], zoro:['jikan','Zoro'], saitama:['jikan','Saitama'],
};
