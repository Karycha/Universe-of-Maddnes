// Symulator balansu: AI vs AI na prawdziwym silniku gry (js/cards.js + js/engine.js).
// Użycie:  node tools/sim.js [liczba_partii_na_parę]   (domyślnie 200)
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = vm.createContext({Math, console});
for (const f of ['js/cards.js', 'js/engine.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, {filename: f});
vm.runInContext(`function starterDeckOf(w){const d=[];CARDS.forEach(c=>{if(c.world===w)for(let i=0;i<(c.starter||0);i++)d.push(c.id)});return d}`, ctx);

const N = +process.argv[2] || 200, LA = process.argv[3] || 'normal', LB = process.argv[4] || 'normal';
const run0 = vm.runInContext(`(function(a,b,la,lb){
  createGame(a,starterDeckOf(a),b,starterDeckOf(b)); G.lv=[la,lb]; aiMulligan(0); aiMulligan(1); beginGame();
  let turns=0;
  while(!G.over&&turns<200){ for(const _ of aiTurnSteps(G.turn)){} if(!G.over)nextTurn(); turns++; }
  return {res:G.over?G.over.res:'timeout',turns};
})`, ctx);
const run = (a, b) => run0(a, b, LA, LB);
const worlds = vm.runInContext('PLAYABLE', ctx), names = vm.runInContext('WORLDS', ctx);

const total = {}; worlds.forEach(w => total[w] = {w: 0, g: 0});
console.log(`Universe Madness — ${N} partii na parę, talie startowe, AI: ${LA} (wiersz) vs ${LB} (kolumna)\n`);
console.log('gracz ↓ / rywal →'.padEnd(20) + worlds.map(w => names[w].n.slice(0, 10).padStart(12)).join(''));
let timeouts = 0, turnsSum = 0, games = 0, rowWins = 0;
for (const a of worlds) {
  let row = names[a].n.padEnd(20);
  for (const b of worlds) {
    if (a === b) { row += '—'.padStart(12); continue; }
    let win = 0;
    for (let i = 0; i < N; i++) {
      const r = run(a, b); games++; turnsSum += r.turns;
      if (r.res === 'win') { win++; rowWins++; } if (r.res === 'timeout') timeouts++;
    }
    total[a].w += win; total[a].g += N; total[b].w += N - win; total[b].g += N;
    row += `${Math.round(100 * win / N)}%`.padStart(12);
  }
  console.log(row);
}
console.log('\nŁączny win-rate:');
worlds.forEach(w => console.log(`  ${names[w].n.padEnd(16)} ${(100 * total[w].w / total[w].g).toFixed(1)}%`));
if (LA !== LB) console.log(`\nAI ${LA} wygrywa ${(100 * rowWins / games).toFixed(1)}% partii z AI ${LB}`);
console.log(`\nŚrednio ${(turnsSum / games).toFixed(1)} tur na partię · zawieszone partie: ${timeouts}`);
