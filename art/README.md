# Grafiki kart

Domyślnie gra przy pierwszym uruchomieniu pobiera linki do grafik z Wikipedii, Superhero API i Jikan (MyAnimeList) — mapa jest w `ART_SRC` w `js/cards.js` — i zapamiętuje je w przeglądarce. To rozwiązanie do prywatnych testów.

Własny plik z tego folderu (`art:true` w karcie) ma pierwszeństwo przed grafiką z API. Jak nie ma ani jednego, ani drugiego, gra pokazuje emoji.

Żeby pobrać grafiki od nowa: w grze **Zapis → Pobierz grafiki od nowa**.

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

## Lista id

Liderzy: `gandalf`, `vader`, `fury`, `naruto`

Śródziemie: `gollum`, `sam`, `frodo`, `legolas`, `gimli`, `urukhai`, `galadriela`, `aragorn`, `smaug`, `sauron`, `armia`, `pierscien`

Gwiezdne Wojny: `grogu`, `szturmowiec`, `r2d2`, `obiwan`, `han`, `chewie`, `luke`, `yoda`, `palpatine`, `miecz`, `gwiazda`, `rozkaz66`

Marvel: `hawkeye`, `wdowa`, `kapitan`, `deadpool`, `spidey`, `ironman`, `hulk`, `thor`, `thanos`, `serum`, `tarcza`, `avengers`

Naruto: `hinata`, `sakura`, `rocklee`, `shikamaru`, `kakashi`, `sasuke`, `gaara`, `itachi`, `kurama`, `rasengan`, `armiaklonow`

Multiwersum: `goku`, `vegeta`, `kame`, `senzu`, `batman`, `wonder`, `t800`, `ripley`, `xeno`, `godzilla`, `optimus`, `luffy`, `zoro`, `saitama`

## Skąd brać grafiki

Repo i strona na GitHub Pages są publiczne, więc wszystko, co tu wrzucisz, jest publikowane.
Oficjalne grafiki z filmów, gier, komiksów i anime mają właścicieli — nie wrzucaj ich tutaj bez zgody.
Bezpieczne źródła: własne rysunki, grafiki zamówione u artysty, albo grafiki na licencji pozwalającej na użycie (sprawdź licencję).
