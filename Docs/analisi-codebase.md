# Analisi della codebase di MoviesApp ("MoovieFinder")

- **Data:** 2026-10-05
- **Commit analizzato:** `2ad7402` (`main`)
- **Metodo:** lettura statica del codice e build con Xcode 16.2 sul simulatore iOS. Ho verificato a mano i punti più gravi. Il resto viene dalla lettura del codice: l'app non è stata eseguita.
- **Riferimenti:** nel formato `file:riga`. I nomi dei file sono univoci nel target `MoviesApp/`.

## In sintesi

- **Cos'è:** un'app iOS in SwiftUI per scoprire film con lo swipe, in stile Tinder. Le raccomandazioni girano sul dispositivo con Core ML, i dati arrivano da TMDB e la watchlist sta in Core Data. Bundle `com.ToM.MoovieFinder`, versione 2.0 (build 4).
- **Storia:** progetto di 4 persone, sviluppato fra febbraio e marzo 2022 e fermo dal 19/03/2022.
- **Dimensioni:** 56 file Swift, circa 4,6k righe, un solo target. Nessun test e nessuna dipendenza esterna.
- **Maturità:** prototipo o MVP. **Compila ancora con Xcode 16.2**, ma ha bug che possono bloccare il flusso principale.

## Stack

| Area | Tecnologia |
|---|---|
| Linguaggio e target | Swift 5, iOS 15.0/15.2 (il target non è uguale fra progetto e app), iPhone e iPad |
| UI | SwiftUI, con pezzi UIKit: `MFMailComposeViewController`, StoreKit, appearance globali |
| Rete | `URLSession` con async/await verso TMDB v3 (3 endpoint: dettaglio, crediti, provider) |
| Persistenza | Core Data, con una sola entità `MovieToSave` (`id`, `watchListItBelong`) |
| Machine learning | 3 recommender Create ML (generi, keyword, case di produzione), 9–15 MB ciascuno |
| Altro | SpriteKit per le particelle, ma è disattivato. Localizzazione it/en/de |
| Tooling | Nessuna dipendenza (né SPM né CocoaPods), nessun test, CI, linter o README |

## Architettura

È presentata come MVVM, ma in pratica è un insieme di **singleton globali**:

```
MoviesApp → ContentView ─@StateObject→ DiscoverViewModel (350 righe, fa tutto)
                        └─ env ──────→ WatchlistViewModel.shared
DiscoverViewModel → MovieAppModel.shared → NetworkManager.shared → TMDB
                  → GrandAdvisor.shared  → 3 modelli Core ML
                  → WatchlistViewModel.shared → WatchListModel → CoreDataManager.shared
```

- **Navigazione:** una `TabView` con Discover, Watchlist e Settings. La tab Search è commentata.
- **Raccomandazioni:**
  - Il punto di partenza sono gli id della watchlist, con valore 1.0. Ogni swipe aggiunge +1 o −1.
  - Si usa un modello alla volta, a rotazione 6/2/1 (probabilmente doveva essere 6/2/2) e sempre con `k=1`.
  - La lista dei film esclusi cresce senza limite.
- **Persistenza:** su Core Data va **solo la watchlist**. Storico, feedback alle raccomandazioni e impostazioni restano in memoria e si perdono al riavvio. Non si usa mai `UserDefaults`.
- **Concorrenza:** il codice usa async/await, ma nessun ViewModel è `@MainActor` tranne `ImageLoaderViewModel`. Da qui vengono i data race.

## Problemi critici

1. **La chiave API di TMDB è in chiaro in un repo pubblico dal 2022.** Si trova in `NetworkManager.swift:63`, `:103` e `:140`. Inoltre a `:65` l'URL completo, chiave compresa, viene stampato nel log. Sia `LPdsgn/MovieApp` sia `Carminepo2/MovieApp` sono pubblici. **La soluzione è revocarla su TMDB** (lo deve fare chi l'ha registrata). Ripulire la history non serve.
2. **Loop infinito di richieste.** In `MovieAppModel.swift:25-27` c'è un `while id == Movie.example.id { riprova }`.
   - `NetworkManager` restituisce il film segnaposto `Movie.example` a ogni errore: risposta non-200 o decodifica fallita (`NetworkManager.swift:95`).
   - Quindi basta un 404, un 429 o l'id 0 (che arriva quando Core ML fallisce) per far ripartire le richieste all'infinito.
   - Lo stesso succede se viene raccomandato proprio il film con quell'id, 634649, che è un film vero.
3. **Il bottone Popcorn si blocca per sempre dopo un errore di rete.** In `DiscoverTab.swift:59-68` il `catch` non chiama `setCardsLoading(false)`.
4. **Possibili crash da force unwrap e indici non controllati:**
   - `recommendations[0]` senza controllo (`GrandAdvisor.swift:36,50,64`);
   - `posterPath!` (`DiscoverViewModel.swift:146`);
   - `movieCards.last!` (`DiscoverViewModel.swift:267,289,311`);
   - `movie.isSaved!` (`MovieDetails.swift:225,236`).
5. **Data race:**
   - `allMovies.append` viene eseguito da task concorrenti (`MovieAppModel.swift:29`);
   - `GrandAdvisor` viene modificato da thread diversi;
   - in `WatchlistViewModel.swift:14-16` un metodo `mutating async` su una struct `@Published` sovrascrive le aggiunte fatte mentre il fetch è in corso.
6. **Core Data incoerente:**
   - `addToWatchList` crea l'oggetto prima dei controlli (`MovieAppModel.swift:127`), quindi lascia righe orfane o duplicate;
   - `deleteMovie` non salva (`CoreDataManager.swift:86-89`);
   - gli errori finiscono in un `rollback` silenzioso.

## Bug funzionali minori

- **Localizzazione:**
  - la chiave `movie-credits-title` non esiste in nessuna lingua, quindi a schermo compare la chiave grezza (`MovieCredits.swift:15`);
  - la chiave `"available-to-buy "` ha uno spazio finale nei file `.strings`, quindi non viene trovata;
  - le etichette affitto/acquisto sono invertite (`MovieProviders.swift:41-55`);
  - il testo About in tedesco è vuoto;
  - YEP, NOPE, i dialog di Storage e parte di About sono scritti a mano in inglese.
- **Raccomandazioni:** il feedback viene registrato *dopo* aver scaricato la carta successiva, quindi ogni raccomandazione ignora l'ultimo swipe. Lo swipe verso la watchlist non finisce nello storico.
- **Icone dei provider:** possono mostrare l'immagine sbagliata, perché tutte usano un unico `uiImage` condiviso (`DiscoverViewModel.swift:17` → `MovieProviders.swift:106`).
- **Watchlist:** un film aperto dalla watchlist non mostra provider né crediti, perché viene caricato per un'altra strada.
- **Accessibilità:** non c'è nessun `accessibilityLabel`, alcuni font hanno dimensione fissa e le animazioni non rispettano l'impostazione "Riduci movimento".

## Codice morto e duplicato

- **Incompleto o mai usato:**
  - la tab Search, con dati finti;
  - `onboarding.swift`: fuori dal target e non compilerebbe;
  - `SplashScreen`;
  - `MovieCardDetailsViewModel`, tutto commentato;
  - le impostazioni Location, Language e Display;
  - la selezione delle piattaforme di streaming, mai salvata;
  - i deep link ai provider: fanno solo `print`, anche se gli schemi sono dichiarati in `Info.plist`.
- **Duplicazioni:**
  - `fetchImage` è copiata due volte;
  - il caricamento immagini è scritto tre volte;
  - `sectionHeader` compare tre volte;
  - i tre gestori di swipe sono copie l'uno dell'altro.

## Igiene del repo

- **File grandi:**
  - `MoviesApp/Resources/movies.json` (42 MB) è tracciato da git anche se è in `.gitignore`, non è nel target e non viene usato;
  - `movies-id-name.json` finisce nel bundle ma nessun codice lo legge;
  - i 3 file `.mlmodel` (circa 37 MB) sono in git senza LFS.
- **File di progetto:**
  - le cartelle `xcuserdata` di 4 utenti sono committate;
  - `DiscoverHistory.swift` compare due volte nella build phase.
- **Build:** 32 warning distinti, fra cui gli init Core ML deprecati e 2 avvisi di data race che in Swift 6 diventano errori.

## Punti di forza

- Il codice è piccolo e leggibile, senza dipendenze esterne.
- Le raccomandazioni girano interamente sul dispositivo.
- async/await e i task group sono già usati.
- `MoviePoster`, `SkeumorphicButtonStyle` e `withBackground` sono riusati bene.
- Le griglie si adattano all'iPad e il contrasto dei colori è buono.

## Cosa fare, in ordine di priorità

1. **Revocare la chiave TMDB**: si può fare subito, senza toccare il codice.
2. **Correggere loop, flag di caricamento e force unwrap**: sono modifiche piccole e l'app smette di bloccarsi e di crashare.
3. **Sistemare la concorrenza**: `@MainActor` sui due ViewModel, `GrandAdvisor` come actor, modelli Core ML caricati una volta sola.
4. **Correggere le chiavi di localizzazione.**
5. **Pulire**: codice morto, `movies.json` e `xcuserdata` fuori da git.

**Dove si può intervenire con poco rischio:** `Views/Shared`, `Settings`, `Localization`, `Utilities/Styles`.

**Dove serve cautela:** `DiscoverViewModel`, `MovieAppModel`/`WatchListModel` e `GrandAdvisor`, che condividono stato fra thread senza protezione e non hanno test che coprano le modifiche.

Il repo originale è di Carminepo2: eventuali fix vanno sul fork `LPdsgn/MovieApp`.
