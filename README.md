# Universe Madness

Crossoverowa karcianka 1v1 — bohaterowie z Fantasy, Sci-Fi, Komiksów i Anime w jednej talii.
To jest webowa wersja testowa (czysty HTML/CSS/JS, bez frameworków), pod telefon — najlepiej poziomo, dodana do ekranu początkowego.

**Graj:** https://karycha.github.io/universe-of-maddnes/

## Co jest w grze
- 4 światy (frakcje) z własnymi Liderami i mechanikami: 🧙 Śródziemie (Drużyna), 🚀 Gwiezdne Wojny (Moc), 🦸 Marvel (Zbiórka), 🍥 Naruto (Klony)
- 🌀 Multiwersum: karty neutralne (max 6 w talii); **Madness** = +1 many za jednostki z 3+ różnych światów
- 1 na 1 z AI, mana 1→10, Lider ma 20 HP, Szarża / Prowokacja / Okrzyk
- Paczki w stylu Gwinta, Pył, tworzenie/rozbijanie kart, osobna talia (20 kart) dla każdego świata

Plan rozwoju: [ROADMAP.md](ROADMAP.md) · Grafiki: [art/README.md](art/README.md)

## Pliki
| Plik | Co jest w środku |
|---|---|
| `js/cards.js` | **dane**: światy, karty, Liderzy, `RULES`, źródła grafik (`ART_SRC`) |
| `js/engine.js` | **silnik zasad**: tury, efekty, walka, AI — bez DOM, działa też w Node |
| `js/ui.js` | **widok**: ekrany, dotyk, paczki, kolekcja, zapis, eksport/import |
| `style.css` | wygląd |
| `tools/sim.js` | symulator balansu AI vs AI |

## Symulator balansu
```
node tools/sim.js 200
```
Rozgrywa każdą parę światów (talie startowe) AI vs AI i wypisuje tabelę win-rate.

## Jak dodać kartę
W `js/cards.js` znajdź tablicę `CARDS` i dopisz obiekt:

```js
{id:'nowa_karta', name:'Nazwa', world:'sw', force:true, type:'unit', cost:3, atk:3, hp:3,
 rarity:'R', icon:'🛸', kw:['charge'], play:{fx:'dmg', n:2, t:'enemyUnit'},
 cond:{type:'force', n:3, play:{fx:'selfBuff', a:2, h:2}}}
```

| Pole | Wartości |
|---|---|
| `world` | `lotr`, `sw`, `marvel`, `naruto`, `neutral` (+ `src` = świat pochodzenia dla neutralnych) |
| `type` | `unit`, `spell` |
| `rarity` | `C`, `R`, `E`, `L` |
| `kw` | `charge` (Szarża), `taunt` (Prowokacja) |
| `race` | rasa (Śródziemie, liczy się do Drużyny) |
| `force` | `true` = ✦ +1 Mocy przy zagraniu |
| `costMod` | `clones` = -1 koszt za każdego Klona |
| `play.fx` | `dmg`, `heal`, `buff`, `buffAll`, `buffClones`, `selfBuff`, `selfKw`, `summon`, `draw`, `destroy`, `freeze`, `armor`, `wipeEnemy`, `wipe`, `snap`, `shield` |
| `play.t` | `any`, `enemyUnit`, `friendlyUnit`, `enemyLeader`, `myLeader`, `allEnemyUnits`, `allEnemies`, `allFriendlyUnits` |
| `cond` | efekt warunkowy: `party` (Drużyna, n ras), `force` (Moc n), `assemble` (Zbiórka) |
| `starter` | ile kopii w talii startowej swojego świata |
| `art` | `true` → `art/<id>.webp`; bez tego grafika z `ART_SRC` (API) |

Balans ogólny (HP Lidera, koszt paczki, nagrody) jest w obiekcie `RULES`.

Pola kart odpowiadają 1:1 klasie `CardData` (ScriptableObject) w wersji Unity.

Kolekcja zapisuje się w `localStorage` przeglądarki. W menu **Zapis** możesz ją wyeksportować jako kod i wczytać na innym urządzeniu.
