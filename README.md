# Universe Madness

Crossoverowa karcianka 1v1 — bohaterowie z Fantasy, Sci-Fi, Komiksów i Anime w jednej talii.
To jest webowa wersja testowa (jeden plik `index.html`, bez frameworków), pod telefon w pionie.

**Graj:** https://karycha.github.io/universe-of-maddnes/

## Co jest w grze
- 1 na 1 z AI, 4 Liderów ze zdolnościami, mana 1→10, Lider ma 20 HP
- Szarża, Prowokacja, Okrzyk + crossoverowe **Rezonans** i **Madness**
- Paczki w stylu Gwinta, Pył, tworzenie/rozbijanie kart, budowanie talii 20 kart

Plan rozwoju: [ROADMAP.md](ROADMAP.md) · Grafiki: [art/README.md](art/README.md)

## Jak dodać kartę
W `index.html` znajdź tablicę `CARDS` i dopisz obiekt:

```js
{id:'nowa_karta', name:'Nazwa', uni:'scifi', type:'unit', cost:3, atk:3, hp:3,
 rarity:'R', icon:'🛸', kw:['charge'], play:{fx:'dmg', n:2, t:'enemyUnit'}}
```

| Pole | Wartości |
|---|---|
| `uni` | `fantasy`, `scifi`, `comic`, `anime` |
| `type` | `unit`, `spell` |
| `rarity` | `C`, `R`, `E`, `L` |
| `kw` | `charge` (Szarża), `taunt` (Prowokacja) |
| `play.fx` | `dmg`, `heal`, `buff`, `summon`, `draw`, `destroy`, `freeze`, `armor`, `wipeEnemy`, `wipe`, `snap` |
| `play.t` | `any`, `enemyUnit`, `friendlyUnit`, `enemyLeader`, `myLeader`, `allEnemyUnits`, `allEnemies` |
| `starter` | ile kopii w talii startowej (opcjonalnie) |
| `art` | `true` → `art/<id>.webp` (opcjonalnie) |

Balans ogólny (HP Lidera, koszt paczki, nagrody) jest w obiekcie `RULES`.

Pola kart odpowiadają 1:1 klasie `CardData` (ScriptableObject) w wersji Unity.

Kolekcja zapisuje się w `localStorage` przeglądarki.
