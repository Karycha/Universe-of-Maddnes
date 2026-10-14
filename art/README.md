# Grafiki kart

Domyślnie gra przy pierwszym uruchomieniu pobiera linki do grafik z Wikipedii, Superhero API i Jikan (MyAnimeList) — mapa jest w `ART_SRC` w `js/cards.js` — i zapamiętuje je w przeglądarce. To rozwiązanie do prywatnych testów.

Własny plik z tego folderu (`art:true` w karcie) ma pierwszeństwo przed grafiką z API. Jak nie ma ani jednego, ani drugiego, gra pokazuje emoji.

Żeby wymusić ponowne pobranie grafik: usuń dane strony w przeglądarce (albo klucz `universe-madness-art-v1` w localStorage).

## Jak dodać grafikę do karty

1. Przygotuj obrazek **poziomy, ok. 400×310 px** (takie proporcje ma okno grafiki na karcie). Postać w środku kadru — na stole pokazuje się wycinek z centrum.
2. Zapisz jako **`.webp`** i nazwij dokładnie jak `id` karty, np. `naruto.webp`, `t800.webp`.
3. Wrzuć plik do folderu `art/`.
4. W `js/cards.js`, w tablicy `CARDS`, dopisz do karty `art:true`:
   ```js
   {id:'naruto', name:'Naruto', ..., art:true},
   ```
   Liderzy działają tak samo (tablica `LEADERS`, np. `art/gandalf.webp`).

Możesz też podać własną ścieżkę: `art:'art/inne/naruto-v2.png'`.

## Lista id (talia startowa + Liderzy)

Liderzy: `gandalf`, `vader`, `batman`, `goku`

Karty: `gollum`, `grogu`, `legolas`, `kapitan`, `naruto`, `spidey`, `t800`, `luffy`, `wonder`, `smaug`, `godzilla`, `kame`, `senzu`, `serum`, `armia`, `gwiazda`

Z paczek: `gimli`, `aragorn`, `sauron`, `ripley`, `xeno`, `optimus`, `deadpool`, `thor`, `thanos`, `zoro`, `vegeta`, `saitama`, `rasengan`, `tarcza`, `pierscien`, `rozkaz66`

## Skąd brać grafiki

Repo i strona na GitHub Pages są publiczne, więc wszystko, co tu wrzucisz, jest publikowane.
Oficjalne grafiki z filmów, gier, komiksów i anime mają właścicieli — nie wrzucaj ich tutaj bez zgody.
Bezpieczne źródła: własne rysunki, grafiki zamówione u artysty, albo grafiki na licencji pozwalającej na użycie (sprawdź licencję).
