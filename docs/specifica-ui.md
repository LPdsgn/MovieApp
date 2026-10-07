# Specifica UI dall'app Swift

- **Data:** 2026-10-07
- **Fonte:** lettura di tutte le viste, i modificatori, gli stili, le stringhe e i colorset in `swift/MoviesApp/`, più l'app in esecuzione sul simulatore iPhone 15 Pro (iOS 17.5). Gli screenshot sono in `screenshots/swift-*.png`, a metà risoluzione.
- **Scopo:** riferimento funzionale e visivo per i task Discover, dettaglio, watchlist e impostazioni. Dove la nuova app si discosta dall'originale è scritto esplicitamente.

## Screenshot

| File                     | Schermata                                                        |
| ------------------------ | ---------------------------------------------------------------- |
| `swift-01-discover.png`  | Discover con il bottone Popcorn                                  |
| `swift-02-deck.png`      | Mazzo con tre carte e i tre bottoni                              |
| `swift-03-details.png`   | Dettaglio del film (parte alta; sotto ci sono attori e provider) |
| `swift-04-history.png`   | Storico con un film piaciuto e uno scartato                      |
| `swift-05-watchlist.png` | Watchlist, stato vuoto con barra di ricerca                      |
| `swift-06-settings.png`  | Impostazioni                                                     |
| `swift-07-storage.png`   | Memoria con i tre bottoni                                        |
| `swift-08-about.png`     | About con attribuzione TMDB                                      |
| `swift-09-platforms.png` | Piattaforme di streaming                                         |

Nota dallo scatto 04: l'originale registra il voto sulla carta sbagliata (il bug "feedback dopo il fetch" di `analisi-codebase.md`): i due film nello storico non sono quello che era in cima al mazzo.

## Navigazione

`TabView` con tre tab: **Scopri** (icona globo), **Lista film** (segnalibro pieno), **Impostazioni** (ingranaggio). Tab bar di sistema con accent sulla tab attiva. Nessun onboarding, nessuna Search (commentata).

## Discover (home)

Titolo grande "Scopri"; in alto a destra l'icona della cronologia (`clock.arrow.circlepath`, accent) che apre lo storico in push. Al centro il **bottone Popcorn**: immagine `Popcorns.png` dentro un cerchio skeumorfico da 252 pt; dietro, tre cerchi concentrici (636, 431, 323 pt) al 2% di opacità che pulsano in scala 0,8→1 (0,85 e 0,9 per gli interni) in 1,5 s con autoreverse. Sotto, "Tocca per iniziare!" (title2 semibold, bianco). Il tap carica 3 carte e apre il mazzo a schermo intero con "Chiudi" in alto a destra (subheadline semibold, accent). Aptica rigid sul tap.

Da non ripetere: su errore di rete il bottone resta in caricamento per sempre. Qui ogni stato di caricamento ha il ramo di errore.

## Mazzo (MovieSwipe)

Tre carte sovrapposte, ognuna con una rotazione casuale fra −4° e +4°; la carta in cima è interattiva. **Carta:** rapporto 2:3, raggio 8, ombra Gray-900 80% raggio 5; poster `w500` a riempire; gradiente dal basso verso l'alto Gray-900 75% → 55% → 0. Contenuto in basso a sinistra, bianco, con spaziatura 10:

- titolo largeTitle semibold con ombra testo nera 50% (raggio 4, y 2);
- fino a 3 chip di genere: footnote medium, sfondo materiale spesso, pillola, padding 8×2;
- trama caption su 2 righe;
- durata "1h40m" (icona orologio) e anno (icona calendario), font body, a distanza 20;
- stelle `round(voto/2)` su 5, in AccentDark.

**Etichette di swipe** sovrapposte alla carta, opacità guidata dal gesto (`pX` = spostamento orizzontale / larghezza schermo, `pY` = verticale / altezza):

| Etichetta | Stile                                                                   | Posizione     | Opacità           |
| --------- | ----------------------------------------------------------------------- | ------------- | ----------------- |
| YEP       | cuore + testo title3 heavy, accent, pillola materiale, bordo accent 3,5 | alto sinistra | `(pX − 0,2) × 5`  |
| NOPE      | X + testo, bianco, pillola materiale, bordo bianco 3,5                  | alto destra   | `(pX + 0,2) × −5` |
| SALVATO   | segnalibro + testo, Gray-800 su sfondo accent, pillola                  | alto centro   | `v −              | v × pX / 0,2 | `con`v = (pY − 0,1) × 5` |

**Gesto:** durante il trascinamento rotazione di `(pX / 0,2) × 4` gradi e offset pari allo spostamento. Al rilascio: destra se `pX > 0,3`, sinistra se `pX < −0,3`, giù se `pY > 0,2`; uscita a ±500 pt orizzontale (rotazione ±15°) o 800 pt verticale, in 0,3 s; altrimenti ritorno con molla. Tap sulla carta → dettaglio con transizione condivisa di poster, titolo, generi, tempo e stelle.

**Bottoni sotto il mazzo** (padding doppio ai lati): X 60 pt secondario, segnalibro 75 pt primario (più in basso di un padding), cuore 60 pt secondario. Aptica soft sullo scarto, heavy su like e salva.

Nuovo rispetto all'originale: lo swipe si salva **prima** di chiedere la carta successiva; il bottone segnalibro produce un evento `watchlist` che entra nello storico fra gli amati.

## Dettaglio (MovieDetails)

Poster in alto, circa 300 pt visibili, con gradiente trasparente → Gray-700 → Gray-700 sotto. Poi, in una `ScrollView`, bianco su Gray-700: titolo largeTitle semibold con ombra; a sinistra generi, durata e anno, stelle (spaziatura 16); a destra il bottone segnalibro 75 pt, primario se salvato altrimenti secondario; trama (body). Sezione **Attori:** (callout smallCaps, secondario) con scorrimento orizzontale di schede larghe 100 pt: foto 2:3 raggio 6, nome footnote semibold su una riga, segnaposto `cast-placeholder.png`. Sezione **provider** in tre blocchi con titolo (streaming, noleggio, acquisto) e icone circolari 45 pt a distanza 16. Bottone chiudi: cerchio 40 pt in materiale con X bianca, in alto a destra, visibile solo quando il dettaglio viene dal mazzo. Trascinando il poster verso il basso la vista si riduce (scala fino a 0,8, raggio fino a 8) e si chiude sotto 0,9.

Da non ripetere: le etichette di noleggio e acquisto sono invertite; i deep link ai provider fanno solo `print`; un film aperto dalla watchlist non mostra attori né provider. Qui: etichette giuste, link alla pagina JustWatch del film (è anche l'attribuzione richiesta), stessi dati da qualunque strada.

## Storico (DiscoverHistory)

Titolo "Cronologia" inline, back verso Scopri. Griglia adattiva con celle da almeno 110 pt e spaziatura 14. Cella: poster con overlay Gray-700 60% e icona cuore accent (piaciuto) o X bianca (scartato) al centro; sotto, titolo subheadline semibold su una riga con chevron, padding 8; sfondo Gray-800, raggio 6. Ordine dal più recente. In alto a destra un menu (icona `line.3.horizontal.decrease`) con tre filtri: Piaciuti (cuore), Scartati (X), Tutti. Barra di ricerca per titolo. Stato vuoto: `HistoryEmptyStatePlaceholder.png` + "I film che hai fatto scorrere nella sessione corrente verranno visualizzati qui" (headline, secondario). Qui lo storico persiste, quindi il testo va cambiato.

## Watchlist

Titolo grande "Lista film", barra di ricerca sotto il titolo. Griglia adattiva con celle da almeno 170 pt, spaziatura 14 orizzontale e 24 verticale. Cella: poster; in basso una barra in materiale sottile con titolo title3 semibold su una riga, durata e anno a 13 pt con icone, chevron; sfondo Gray-800, raggio 6. Stato vuoto: `WatchlistEmptyStatePlaceholder.png` + "Aggiungi i film ai preferiti per trovarli qui". Nell'originale l'ordine era casuale (un `Set`): qui per data di aggiunta.

## Impostazioni

Titolo grande, lista piatta con tre righe e chevron: Piattaforme di streaming, Memoria, About.

- **Piattaforme di streaming:** quattro voci fisse (Netflix, Prime Video, Disney+, Apple TV+) con spunta accent a destra, tutte selezionate per default, mai salvate. Qui la selezione va in `settings`; l'uso come filtro resta un punto aperto di `CLAUDE.md`.
- **Memoria:** tre bottoni larghi con dialogo di conferma: "Svuota Lista film" (primario, accent, testo nero), "Svuota Cronologia" (secondario, Gray-800, testo bianco), "Svuota Cache" (solo testo accent). Qui le azioni diventano quattro: svuota watchlist, svuota storico (nasconde), azzera raccomandazioni (cancella gli eventi), svuota cache immagini.
- **About:** titolo grande; testo di presentazione (title3); sezione "HAI BISOGNO DI PARLARCI?" (callout medium, accent, maiuscolo) con bottone "Get in touch" largo, accent, testo nero smallCaps, che apre la mail; sezione "CONTRIBUTI" con logo TMDB (max 100 pt) e l'avviso "This product uses the TMDb API but is not endorsed or certified by TMDb"; poi "MoovieFinder is brought to you by" e i quattro nomi in semibold.

## Colori e stili

| Nome        | Valore        | Uso                                        |
| ----------- | ------------- | ------------------------------------------ |
| AccentColor | `#FFD400`     | tab attiva, bottoni primari, icone, YEP    |
| AccentDark  | `#FFC300`     | stelle                                     |
| Gray-600    | `#797979`     | testo secondario                           |
| Gray-650    | `#5B5B5B`     | bordi                                      |
| Gray-700    | `#3D3D3D`     | bottoni secondari, inizio del gradiente    |
| Gray-800    | `#1F1F1F`     | fine del gradiente, celle, testo su accent |
| Gray-900    | `#0A0A0A`     | ombre e gradiente delle carte              |
| Spotlight   | `#0A0A0A` 85% | onboarding (fuori perimetro)               |

Sfondo di ogni schermata: gradiente verticale Gray-700 → Gray-800, a tutto schermo. Raggio base 8. Font di sistema.

**Bottone skeumorfico** (`SkeumorphicButtonStyle`): cerchio pieno accent (primario) o Gray-700 (secondario); ombra nera 20% raggio 5 offset y 5, che sparisce da premuto; riflesso interno bianco sottile in alto; icona title semibold, Gray-800 sul primario e accent sul secondario; da premuto scala 0,95; aptica opzionale.

**Bottone rettangolare** (`RoundedRectangleButtonStyle`): larghezza piena, padding, accent con testo nero (primario) o Gray-800 con testo bianco (secondario), raggio 8, da premuto scala 0,95.

## Stringhe

45 chiavi in `Localizable.strings` per it, en e de. Difetti dell'originale, da correggere nella nuova app:

- `movie-credits-title` usata nel codice ma definita come `movie-credit-title`: a schermo compariva la chiave;
- `"available-to-buy "` con uno spazio finale nella chiave;
- etichette di noleggio e acquisto invertite nella vista;
- `about-text` vuoto in tedesco;
- YEP, NOPE, i titoli dei dialoghi di Memoria, "Get in touch", l'avviso TMDB e "brought to you by" scritti a mano in inglese;
- in italiano `location-united-kingdom` tradotto "Inghilterra".

Nella nuova app tutte le stringhe passano da un dizionario tipizzato in tre lingue con fallback inglese, incluse quelle che l'originale non traduceva e quelle nuove (azzera raccomandazioni, errori di rete, etichette di accessibilità dei bottoni).

## Asset riutilizzabili (`mobile/assets/images/`)

Popcorns, Placeholder (poster mancante), cast-placeholder, HistoryEmptyStatePlaceholder, WatchlistEmptyStatePlaceholder, TMDB-logo, loghi Netflix, PrimeVideo e disney+, icon, splash.

## Componenti React Native Reusables (variante Uniwind)

Catalogo letto dal repo (`packages/registry/src/uniwind/components/ui/`), 30 componenti: accordion, alert, alert-dialog, aspect-ratio, avatar, badge, button, card, checkbox, collapsible, context-menu, dialog, dropdown-menu, hover-card, icon, input, label, menubar, native-only-animated-view, popover, progress, radio-group, select, separator, skeleton, switch, tabs, text, textarea, toggle, toggle-group, tooltip. Nel progetto ci sono già button, icon e text.

| Elemento                           | Scelta                                                              |
| ---------------------------------- | ------------------------------------------------------------------- |
| Chip di genere                     | `badge`                                                             |
| Caricamento di poster e testi      | `skeleton`                                                          |
| Conferme in Memoria                | `alert-dialog`                                                      |
| Filtro dello storico               | `dropdown-menu`                                                     |
| Righe di Impostazioni              | `separator`, `text`, `Pressable`                                    |
| Piattaforme di streaming           | `checkbox`                                                          |
| Ricerca in storico e watchlist     | barra nativa di expo-router (`headerSearchBarOptions`), non `input` |
| Foto del cast                      | `expo-image` con `cast-placeholder.png`, non `avatar`               |
| Bottoni skeumorfici e rettangolari | varianti aggiunte alla `cva` del `button` copiato                   |
| Tab bar                            | `Tabs` di expo-router, non `tabs` di Reusables                      |
| Mazzo, etichette di swipe, stelle  | componenti propri con Reanimated e Gesture Handler                  |

Da aggiungere: `pnpm dlx @react-native-reusables/cli@latest add badge skeleton alert-dialog dropdown-menu separator checkbox --styling-library uniwind`.

Fuori da Reusables: `expo-image` ed `expo-linear-gradient`, avvolti una sola volta con `withUniwind` in `components/styled.ts` (regola Uniwind: mai avvolgere componenti di `react-native` o Reanimated). I "materiali" di SwiftUI si rendono con sfondi traslucidi (`bg-black/40`); `expo-blur` solo se servirà. Icone da `lucide-react-native` tramite il componente `icon`.

## Tema Uniwind

Solo scuro: `light` e `dark` in `global.css` definiscono gli stessi valori, perché Uniwind richiede le stesse variabili in ogni variante, e all'avvio si chiama `Uniwind.setTheme('dark')`. Token: `background` Gray-800, `card` Gray-700, `primary` AccentColor con `primary-foreground` Gray-800, `secondary` Gray-700 con `secondary-foreground` AccentColor, `muted` Gray-650, `muted-foreground` Gray-600, `accent` AccentDark, `border` Gray-650, `destructive` il rosso del template. Il gradiente di sfondo è un componente `Screen`. `lib/theme.ts` allineato agli stessi valori per React Navigation.

## Punto aperto emerso dagli screenshot

Nello storico è comparso un film con titolo e poster a sfondo sessuale ("How to Plan an Orgy in a Small Town"). Il catalogo Wikidata non filtra i contenuti per adulti e il flag `adult` di TMDB non si può usare per decidere le raccomandazioni. Da valutare un filtro sulle feature Wikidata (genere P136) in pipeline.
