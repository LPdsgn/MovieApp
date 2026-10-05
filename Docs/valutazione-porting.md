# Porting multipiattaforma di MoovieFinder: valutazione

- **Data:** 2026-10-05
- **Commit analizzato:** `2ad7402` (`main`)
- **Metodo:**
  - ispezione dei 3 modelli Core ML con `coremltools` (`load_spec`);
  - conteggio delle API esclusive di iOS nel codice Swift;
  - analisi della codebase in [analisi-codebase.md](analisi-codebase.md).
- **Limiti:** stime e scelte di librerie sono indicative, non verificate con un prototipo.

## Verdetto

**Si può fare e conviene. Expo (React Native) è la toolchain più adatta.** Va però chiarita una cosa: non sarebbe un porting ma una **riscrittura**, perché del codice Swift non si riusa nessuna riga. L'app attuale servirebbe come specifica e come riferimento visivo.

Il rischio che sembrava maggiore, i modelli Core ML, si è rivelato piccolo. Tutti e tre sono `itemSimilarityRecommender`, cioè **tabelle di vicini precalcolate, senza alcuna rete neurale**:

| Modello | Film | Vicini per film (max) | Coppie |
|---|---|---|---|
| Genres | 17.572 | 64 | 1,04 M |
| Keyword | 15.666 | 64 | 0,95 M |
| Production | 15.937 | 64 | 0,68 M |

Gli id dei film sono id TMDB numerici. Gli input sono gli stessi in tutti e tre (`items`, `k`, `restrict`, `exclude`), e così gli output (`recommendations`, `scores`).

Per portarli:

1. Si esportano con uno script Python in un file statico dentro l'app, per esempio indici a 16 bit più un punteggio a 8 bit. Stima: circa 8 MB in tutto, contro i 37 MB attuali.
2. Il calcolo si riscrive in TypeScript in una cinquantina di righe: per ogni film candidato si somma "voto × similarità" sui film già valutati, si escludono quelli già visti e si prende il migliore.
3. Serve un test che confronti i risultati con quelli di Core ML su un campione di input. Si può fare in Python con `coremltools` su macOS.

Così non serve alcun runtime di ML né su iOS né su Android.

## Dove finisce ogni componente

| Oggi su iOS | In Expo | Difficoltà |
|---|---|---|
| 3 modelli Core ML | file statico + motore in TypeScript (vedi sopra) | bassa-media |
| `URLSession` → TMDB | `fetch` + TanStack Query | bassa |
| Core Data (1 entità, 2 campi) | `expo-sqlite` o MMKV | bassa |
| `NSCache` per le immagini | `expo-image` (cache su disco e in memoria) | bassa |
| Mazzo di carte con lo swipe (`DragGesture`) | Gesture Handler + Reanimated | media |
| Transizione carta → dettaglio con `matchedGeometryEffect` (10 occorrenze) | shared element transition di Reanimated (sperimentale, da verificare) oppure una transizione più semplice | **medio-alta** |
| Materiali e blur | `expo-blur` (su Android rende meno) | bassa |
| Bottoni skeuomorfici con ombra interna | `boxShadow` inset (solo New Architecture) o Skia | bassa-media |
| 10 SF Symbols | `expo-symbols` su iOS, set di icone vettoriali su Android | bassa |
| Haptics, mail, deep link ai provider | `expo-haptics`, `expo-mail-composer`, `Linking` | bassa |
| `.strings` (3 lingue, circa 44 chiavi) | `expo-localization` + i18next, convertibili in automatico | bassa |
| Particelle SpriteKit | già disattivate: non si portano | — |

L'unico punto in cui l'app perderebbe un po' di resa rispetto a SwiftUI è la transizione animata dalla carta al dettaglio. Tutto il resto ha un equivalente maturo.

## Cosa si guadagna oltre ad Android

- **Molti bug del report spariscono con il nuovo design:**
  - TanStack Query gestisce già retry con limite, deduplica delle richieste e una cache per richiesta: niente più loop infinito né `uiImage` condivisa;
  - JavaScript ha un solo thread, quindi niente data race;
  - una sola tabella SQLite, quindi niente righe orfane.
- **Il formato portabile semplifica la rigenerazione del catalogo.**
  - I modelli conoscono solo i circa 17 mila film presenti nel 2022.
  - La pipeline di training non è nel repo.
  - I punteggi (0,75 / 0,5 / 0,333) fanno pensare a una similarità di Jaccard su generi, keyword e case di produzione: in quel caso uno script Python sui dati TMDB basterebbe a ricostruire le tabelle. È un'inferenza, va verificata.
- **Versione web quasi gratuita** con react-native-web. In quel caso il motore di raccomandazione starebbe meglio lato server.
- **Chiave API:** in un'app React Native la chiave dentro il bundle resta estraibile. Conviene un piccolo proxy, per esempio una Vercel Function, che aggiunge la chiave lato server.

## Le alternative

- **Flutter.** Lo sforzo è simile. È più forte sulle animazioni personalizzate, ma richiede Dart. Ha senso se il team lo conosce già.
- **Kotlin Multiplatform.** Si condivide la logica e si tiene la UI SwiftUI su iOS, ma bisogna riscrivere la logica e in più scrivere da zero una UI Compose per Android. Per 4,6k righe è più lavoro di Expo, senza vantaggi chiari.
- **Skip (da SwiftUI a Compose).** È l'unica toolchain che riusa codice Swift. Però Core Data e Core ML non sono supportati, quindi andrebbero sostituiti comunque, e supporta solo una parte di SwiftUI. Va verificato quanto è maturo oggi.
- **Due app native.** Due codebase da mantenere per un'app di queste dimensioni: non conviene.

## Stima indicativa

Ipotesi: una persona esperta di Expo, che porta le funzioni che oggi funzionano davvero (Discover con swipe e storico, Watchlist, dettaglio con cast e provider, Settings) e lascia fuori quelle morte (Search, onboarding, location e lingua).

| Attività | Giorni |
|---|---|
| Setup, navigazione, i18n, tema | 2–3 |
| Layer TMDB, proxy per la chiave, storage | 2–3 |
| Export dei modelli, motore in TypeScript, test di parità | 2–3 |
| Mazzo di carte e animazioni | 4–6 |
| Schermate dettaglio, watchlist, storico, impostazioni | 5–7 |
| Rifinitura, test su Android, build per gli store con EAS | 3–5 |
| **Totale** | **circa 4–6 settimane-persona** |
