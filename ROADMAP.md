# Universe Madness — Roadmapa

Crossoverowa karcianka 1v1: bohaterowie z Fantasy, Sci-Fi, Komiksów i Anime w jednej talii.
Wersja webowa (ten repo, GitHub Pages) służy do szybkiego testowania mechanik na telefonie.
Docelowa gra powstaje w Unity — dane kart są trzymane tak, żeby dało się je przenieść 1:1.

Legenda: ✅ zrobione · 🔨 w trakcie · ⏳ zaplanowane · 💭 do decyzji

---

## Etap 0 — Prototyp web v0.1 ✅
- ✅ Gra 1 na 1 z AI (AI zagrywa najdroższą kartę, na którą go stać, prosto wymienia jednostki)
- ✅ 4 Liderów (Gandalf, Darth Vader, Batman, Goku), 20 HP, zdolność za 2 many raz na turę
- ✅ Mana 1→10, ręka max 8, stół max 5, zmęczenie przy pustej talii
- ✅ Słowa kluczowe: Szarża, Prowokacja, Okrzyk
- ✅ Mechaniki crossoverowe: **Rezonans** (+1/+1 za to samo uniwersum) i **Madness** (+1 many za 3+ uniwersa)
- ✅ 32 karty (16 startowych + 16 z paczek), 4 rzadkości
- ✅ Paczki w stylu Gwinta (4 losowe + 1 z 3 do wyboru), Pył, tworzenie i rozbijanie kart
- ✅ Budowanie talii (20 kart, max 2 kopie, Legendarna 1)
- ✅ Sterowanie dotykiem: przeciąganie kart i ataków

## Etap 0.5 — Światy (v0.3) ✅
- ✅ Frakcje w stylu Gwinta: talia = jeden świat + max 6 neutralnych
- ✅ Śródziemie (Drużyna), Gwiezdne Wojny (Moc), Marvel (Zbiórka), Naruto (Klony)
- ✅ Multiwersum (neutralne) i Madness za 3+ światy na stole
- ✅ 61 kart, osobna talia na świat, wybór świata przed grą
- ⏳ Kolejne światy: Dragon Ball, DC, One Piece jako pełne frakcje (dziś karty neutralne)

## Etap 1 — Fundamenty web ✅
- ✅ Repo + GitHub Pages
- ✅ Stonowany wygląd (ciemny stół, mosiężne wykończenia, kolory uniwersów jako akcenty)
- ✅ System grafik kart: pole `art` w danych, pliki w `art/`, emoji jako zapas
- ✅ Grafiki z API (Wikipedia, Superhero API, Jikan) do prywatnych testów
- ✅ Rozbicie na pliki: `js/cards.js` (dane), `js/engine.js` (zasady, bez DOM), `js/ui.js` (widok), `style.css`
- ✅ Eksport/import zapisu kolekcji (kod `UM2:…` do skopiowania)
- ✅ Stół powiększony do 7 miejsc na stronę, kafelki skalują się do ekranu
- ✅ Gra w poziomie (układ jak w Hearthstonie) + instalacja na ekranie początkowym jak apka (pełny ekran)

## Etap 2 — Czytelność i balans ⏳
- Animacje: atak (lot jednostki do celu), śmierć jednostki, zagranie karty
- Historia walki (rozwijany log tury)
- Mulligan na starcie (wymiana kart z ręki)
- Samouczek pierwszej partii
- Poziomy AI: Łatwy / Normalny / Trudny (Trudny liczy zabójcze ciągi i wymiany)
- ✅ Symulator balansu AI vs AI (`node tools/sim.js`) — win-rate światów
- Balans światów wg symulatora (v0.4: Gwiezdne Wojny 78%, Śródziemie 54%, Marvel 40%, Naruto 28%)
- Symulator: win-rate pojedynczych kart
- Ustawienia: dźwięk, szybkość animacji, wibracje

## Etap 3 — Treść ⏳
- Nowe uniwersa (propozycje): 🎮 Gry wideo, 👻 Horror, ⚡ Mitologia, 📺 Kreskówki, 🦖 Kaiju/Mecha
- 60+ kart, po 2–3 Liderów na uniwersum
- Nowe słowa kluczowe: Ostatnie tchnienie, Kradzież życia, Tarcza, Ukrycie, Wściekłość
- Karty synergii między uniwersami („Drużyna crossover”: bonusy za konkretne pary)
- Talie tematyczne do odblokowania

## Etap 4 — Meta i progres ⏳
- Kilka zapisanych talii
- Codzienne zadania i nagrody za wygrane z rzędu
- Osiągnięcia i statystyki (najczęściej grane karty, win-rate)
- Złote/animowane wersje kart (kosmetyka z paczek)
- Tryb wyzwań: gotowe scenariusze z twistem

## Etap 5 — Przejście do Unity ⏳
- Eksport `CARDS` do JSON → importer w Edytorze tworzący `CardData` (ScriptableObject)
- Silnik zasad przepisany 1:1 do C# (te same efekty: `dmg`, `heal`, `buff`, `summon`…)
- Te same testy balansu po obu stronach, żeby web i Unity liczyły identycznie
- UI w Unity: drag & drop, animacje, efekty cząsteczkowe

## Etap 6 — Multiplayer 💭
- PvP przez sieć (np. Unity Netcode / Photon) albo turniej hot-seat na jednym telefonie

---

## Decyzje i ryzyka 💭
- **Prawa do postaci.** Prawdziwe postacie i ich grafiki należą do właścicieli marek. Do prywatnych testów OK; przed publicznym wydaniem trzeba albo licencji, albo zamiany na oryginalne postacie. Dlatego nazwy i grafiki są tylko w danych kart — zamiana to edycja tablicy, a nie kodu.
- **Zapis tylko lokalny.** Do czasu eksportu/importu albo backendu kolekcja żyje w jednej przeglądarce.
- **AI.** Prosty heurystyczny bot wystarcza do testów mechanik; do testów balansu potrzebny będzie mocniejszy.
