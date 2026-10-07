# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stato del repository

MoovieFinder è un'app per scoprire film con lo swipe. Il repo è in fase di **riscrittura da iOS nativo (Swift) a React Native + Expo**.

| Percorso    | Contenuto                                                   | Regola                                                                    |
| ----------- | ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| `swift/`    | App Swift originale (2022)                                  | **Solo riferimento, non si modifica.** È la specifica funzionale e visiva |
| `docs/`     | Analisi e valutazioni da cui nascono le decisioni qui sotto | Leggerle prima di decisioni architetturali                                |
| `mobile/`   | App Expo (SDK 57), pacchetto del workspace pnpm             | —                                                                         |
| `proxy/`    | Proxy TMDB su Cloudflare Workers, pacchetto del workspace   | Unico posto dove vive la chiave TMDB                                      |
| `pipeline/` | Pipeline dati Wikidata in Python, progetto `uv`             | —                                                                         |

Documenti in `docs/`:

- `analisi-codebase.md`: com'è fatta l'app Swift e i suoi bug.
- `valutazione-porting.md`: mappa iOS → Expo e stima.
- `valutazione-motore-ml.md`: valore del ML e vincoli di licenza TMDB.
- `valutazione-ui-stack.md`: perché React Native Reusables + Uniwind.
- `valutazione-strategie-ml.md`: quali famiglie di algoritmi di raccomandazione sono adatte, e quando.
- `valutazione-toolchain.md`: lint, format, hook e CI/CD, e perché ESLint + Prettier invece di OXC.
- `wikidata-api.md`: parametri di WDQS e `wbgetentities` che usa la pipeline, e i comportamenti scoperti misurando.
- `campioni-vicini.md`: vicini TF-IDF di film noti, misurati, da confrontare in fase di test.

Il passo "esportare le tabelle Core ML" di `valutazione-porting.md` è **superato** dalla decisione su Wikidata (vedi sotto).

## Comandi

App Swift di riferimento (compila con Xcode 16.2, circa 32 warning noti):

```bash
xcodebuild -project swift/MoviesApp.xcodeproj -scheme MoviesApp \
  -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

Root (workspace pnpm):

```bash
pnpm install                  # dipendenze + hook git (script prepare → lefthook install)
pnpm format                   # prettier su tutto il repo; pnpm format:check per verificare
```

`mobile/` (dalla root con `pnpm --filter mobile <script>`, o da `mobile/` con `pnpm <script>`):

```bash
pnpm dev                      # expo start -c; pnpm ios / pnpm android / pnpm web
pnpm lint                     # expo lint (ESLint)
pnpm typecheck                # tsc --noEmit
pnpm test                     # jest con preset jest-expo
pnpm test path/al/file.test.tsx         # un solo file (senza `--`: pnpm lo passerebbe a jest)
pnpm test -t "nome del test"            # un solo test
pnpm exec expo install <pacchetto>      # dipendenze native: versione allineata alla SDK
pnpm dlx expo-doctor                    # controllo di coerenza del progetto Expo
pnpm dlx @react-native-reusables/cli@latest add switch alert-dialog --styling-library uniwind
pnpm db:pull                  # copia pipeline/dist/moovie.sqlite in assets/db/moovie.db (ignorato da git)
```

`proxy/` (dalla root con `pnpm --filter proxy <script>`):

```bash
pnpm test                     # node --test, senza dipendenze
pnpm typecheck                # tsc --noEmit con @cloudflare/workers-types
pnpm dev                      # wrangler dev su localhost:8787, legge proxy/.dev.vars
pnpm release                  # wrangler deploy (non `deploy`: è un comando interno di pnpm); prima `wrangler login` e `wrangler secret put TMDB_TOKEN`
```

`pipeline/` (da `pipeline/`, con `MOOVIE_USER_AGENT` impostata):

```bash
uv run moovie-pipeline catalog|features|neighbors   # ogni stadio include i precedenti, legge dalla cache
uv run ruff check . && uv run ruff format .
uv run pytest
uv run pytest tests/test_x.py::test_nome  # un solo test
```

## Stack di `mobile/`

- Expo + Expo Router.
- **React Native Reusables nella variante Uniwind.** I componenti vengono copiati nel progetto e sono codice nostro. Poggiano su `@rn-primitives`, che dà già l'accessibilità.
- **Uniwind**, piano gratuito (Tailwind 4). Non usare NativeWind: la v4 è su Tailwind 3 e la v5 è ancora RC.
- Reanimated + Gesture Handler per il mazzo di carte e le animazioni.
- TanStack Query per le chiamate di rete.
- `expo-sqlite` per i dati locali.
- `expo-image` per le immagini.
- Tema solo scuro, come l'originale. I colori di partenza sono i colorset in `swift/MoviesApp/Assets.xcassets/`.
- Lingue it, en, de, come l'originale. Nei `.strings` originali ci sono chiavi rotte, documentate in `docs/analisi-codebase.md`.

Perimetro v1 = le funzioni che oggi funzionano:

- Discover (swipe + storico);
- Watchlist;
- dettaglio film (cast, provider);
- Settings (piattaforme, storage, about).

Fuori dalla v1, perché nell'originale erano morte: Search, onboarding, location e lingua.

## Toolchain

Motivazioni in `docs/valutazione-toolchain.md`.

| Area      | Strumento                                                                                                                                                           | Dove                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Lint      | ESLint 9 con `eslint-config-expo` (`expo lint`)                                                                                                                     | `mobile/`               |
| Format    | Prettier + `prettier-plugin-tailwindcss` (con `tailwindStylesheet` puntato al CSS di Uniwind, percorso relativo alla config di Prettier) + `eslint-config-prettier` | Root, per tutto il repo |
| Typecheck | La versione di TypeScript del template (6.0.3), `tsc --noEmit`                                                                                                      | `mobile/`               |
| Python    | ruff (lint + format), pytest                                                                                                                                        | `pipeline/`             |
| Hook      | lefthook + commitlint                                                                                                                                               | Root                    |
| CI        | GitHub Actions                                                                                                                                                      | `.github/workflows/`    |
| CD        | EAS Workflows, solo dalla prima build da distribuire                                                                                                                | `.eas/workflows/`       |

- **Non passare a oxlint, oxfmt o TypeScript 7 senza rivalutare.**
   - Il template Expo SDK 57 ha il React Compiler attivo, e `eslint-plugin-react-hooks` 7 ne attiva 14 diagnostiche che oxlint non ha.
   - typescript-eslint supporta TypeScript solo fino alla 6.0.
- **Reanimated con il React Compiler attivo:** sui valori condivisi usare `get()` e `set()`, non `.value`.
- **Prettier si esegue a parte**, non come regola ESLint: niente `eslint-plugin-prettier`.
- **Solo pnpm**, mai npm o npx: `pnpm exec` per i binari locali, `pnpm dlx` per quelli una tantum. La versione è fissata in `packageManager` (`package.json` di root).
- **Workspace pnpm** (`pnpm-workspace.yaml`):
   - `nodeLinker: hoisted`, come nel template: Expo e Metro si aspettano un `node_modules` piatto;
   - `allowBuilds`: pnpm blocca gli script di installazione delle dipendenze non elencati. `lefthook: false` perché gli hook li installa lo script `prepare` di root;
   - `minimumReleaseAgeExclude`: pnpm rifiuta i pacchetti pubblicati da poco e aggiunge da solo le eccezioni quando `expo install` le richiede.
- **ESLint fissato a `^9`:** `eslint-plugin-react` 7, incluso da `eslint-config-expo`, non funziona con ESLint 10.
- **TypeScript 6 non include più da solo i pacchetti `@types`:** i tipi globali servono elencati in `compilerOptions.types` (oggi `jest`). Senza, i file `*.test.ts` non passano il typecheck.
- **`mobile/expo-types.d.ts`** contiene il riferimento a `expo/types` (per esempio `*.css`), perché `expo-env.d.ts` è generato da `expo start` ed escluso da git. Senza, il typecheck fallisce in CI e negli hook.
- **Classi Tailwind:** l'ordine lo decide `prettier-plugin-tailwindcss` leggendo `mobile/global.css`. Se il foglio di stile non si carica (è successo allo scaffolding, con un errore di serializzazione), i colori del tema Uniwind risultano classi sconosciute e finiscono in testa; con il foglio caricato stanno al loro posto. Se `pnpm format:check` segnala solo riordini di classi in file non toccati, è cambiato questo, non il codice: riformattare e committare come `style`.
- **Hook:**
   - `pre-commit`: Prettier, ESLint `--fix` e ruff sui file in stage, più `tsc --noEmit` se cambia `mobile/` o `proxy/`;
   - `commit-msg`: commitlint;
   - `pre-push`: jest, `node --test` o pytest, a seconda della cartella toccata.
- **CI e CD:** i controlli girano su GitHub Actions, gratuite su un repo pubblico. EAS fa solo build e aggiornamenti, perché il piano gratuito include appena 60 minuti al mese di workflow.
- **Trigger della CI:** per ora solo `pull_request` e avvio manuale (`workflow_dispatch`), niente trigger su push.
- **Insidie della CI:**
   - sui fork le Actions sono disattivate per default;
   - nei repo pubblici i workflow programmati si spengono dopo 60 giorni senza attività;
   - l'artefatto dei dati non va committato a ogni esecuzione della pipeline.

## Dati: Wikidata per raccomandare, TMDB solo per mostrare

È un vincolo di licenza, non una preferenza. I termini delle API TMDB (aggiornati il 20/10/2023) vietano di usare contenuti TMDB in applicazioni ML o AI e di conservarli in cache per più di 6 mesi.

- **TMDB si usa solo a runtime e solo per la UI:** poster, dettagli, cast, provider.
   - Il catalogo, le feature e la logica di raccomandazione non leggono mai contenuti TMDB.
   - La pipeline non usa TMDB. L'unica eccezione è la colonna opzionale di popolarità (vedi Pipeline), che resta **disattivata** finché non c'è un accordo scritto con TMDB.
   - Su disco l'app salva solo id, mai contenuti TMDB.
- **Wikidata (CC0)** è l'unica fonte di catalogo e feature. Il collegamento ai film TMDB passa dalla proprietà **P4947** (TMDB movie ID).
- **Chiave TMDB mai nel client.** Le chiamate passano dal proxy in `proxy/` (Cloudflare Workers, `https://mooviefinder-tmdb-proxy.luigipdt-dev.workers.dev`), che aggiunge la chiave lato server e inoltra solo `GET /3/movie/{id}` con `language` e `append_to_response` limitati a `credits` e `watch/providers`: ogni nuovo endpoint va aggiunto alla lista chiusa. La chiave in `swift/MoviesApp/Models/NetworkManager.swift` è pubblica e va considerata compromessa.
- **Non portare né derivare dati dai file dell'app originale:**
   - i 3 `.mlmodel` sono stati addestrati su metadati TMDB;
   - `swift/MoviesApp/Resources/movies-id-name.json` è un dump TMDB, come lo era `movies.json`, rimosso dal repo ma ancora nella history.
- **Attribuzioni obbligatorie in UI:**
   - TMDB (logo + avviso "not endorsed or certified by TMDB");
   - JustWatch per i dati dei provider (requisito dell'endpoint `/watch/providers`).

## Pipeline dati (`pipeline/`)

Va implementata da subito. Produce i dati del motore di raccomandazione v1, che non usa reti neurali.

- **Sorgente:** SPARQL su `query.wikidata.org`.
   - **Timeout di 60 s.** La query del catalogo (QID, id TMDB, sitelink ≥ 10, nessun'altra proprietà) impiega circa 30 s (misurato il 06/10/2026). Tutto il resto si scarica a blocchi con `wbgetentities` (50 id per richiesta), non con altre query SPARQL. Partizionare per anno (P577) non conviene: il filtro `YEAR()` non usa indici e ogni anno costa quanto la query intera.
   - **User-Agent:** la policy Wikimedia richiede un User-Agent descrittivo con un contatto. Va letto da una variabile d'ambiente, senza email personali nel codice.
   - **Limiti di frequenza:** WDQS può limitare in modo drastico. Il 05/10/2026 ha risposto HTTP 429, "1 req / min", durante un disservizio. La pipeline deve:
      - rispettare `Retry-After` e riprovare con attese crescenti;
      - salvare i risultati parziali, così una nuova esecuzione riprende senza ripetere le query già completate.
   - Usare i valori _truthy_ (`wdt:`).
   - **P4947 può avere più valori, e più QID possono puntare allo stesso id TMDB:** vanno deduplicati in modo esplicito.
- **Catalogo:** film con P4947, filtrati per popolarità con `wikibase:sitelinks`, che sostituisce la popolarità TMDB (non utilizzabile).
   - Con soglia ≥ 10 sono circa 28.600 film (ottobre 2026); l'originale ne aveva ~17.000.
   - La soglia è una manopola di tuning.
   - **Limite noto:** i sitelink arrivano in ritardo sulle novità. Dei 500 film più popolari su TMDB, il catalogo ne include 405.
      - 56 degli esclusi hanno un elemento Wikidata ma pochi sitelink (mediana 3), e sono quasi tutti del 2025-2026.
      - 39 non hanno proprio un elemento Wikidata con P4947, quindi non hanno feature e non si possono raccomandare.
- **Popolarità TMDB (colonna opzionale, disattivata per default).** Si attiva solo se arriva un accordo con TMDB.
   - **Fonte:** l'export giornaliero `https://files.tmdb.org/p/exports/movie_ids_MM_DD_YYYY.json.gz`. Contiene `id`, `original_title`, `popularity`, `adult` e `video` per tutti i film, non richiede chiave API e ogni file resta disponibile 3 mesi.
   - **Rumore:** un singolo giorno è molto rumoroso (alcuni classici valgono quasi 0), quindi si usa la **mediana degli ultimi 7-14 export**.
   - **Correlazione:** sul catalogo il rango di popolarità e quello dei sitelink hanno correlazione di Spearman 0,63. Sono correlati ma non ridondanti.
   - **Uso 1, inclusione nel catalogo:** entra un film con sitelink ≥ soglia **oppure** fra i più popolari, purché abbia un elemento Wikidata.
   - **Uso 2, segnale di base:** una combinazione dei ranghi percentuali, `α·rango(sitelink) + (1−α)·rango(popolarità)`, per le prime carte e per i pari punteggio. **Mai come feature di similarità.**
- **Feature:** insiemi di QID, non etichette, così restano indipendenti dalla lingua:
   - genere (P136), regista (P57), cast (P161), sceneggiatore (P58);
   - casa di produzione (P272), serie (P179), basato su (P144), soggetto (P921);
   - paese (P495), lingua originale (P364), compositore (P86), fotografia (P344);
   - decade da P577, durata (P2047).
- **Output:** un artefatto SQLite **versionato**, con versione dei dati e dello schema, che contiene:
   - catalogo (QID, id TMDB, sitelink, anno, più la popolarità TMDB come colonna nullable, vuota finché la fonte è disattivata);
   - tabella delle feature per film;
   - top-K vicini precalcolati con TF-IDF sulle feature e similarità del coseno (K=64 come nell'originale). Con l'IDF le feature comuni (genere "drammatico", paese "Stati Uniti") pesano poco e quelle rare (regista, saga) pesano molto. Stanno in un BLOB per film (K record da 6 byte: qid uint32 + coseno uint16, little-endian), perché una riga per vicino costava 4 volte tanto: 41 MB contro 11 (misurato il 07/10/2026 su 28.572 film).

   L'app lo include nel bundle come asset `mobile/assets/db/moovie.db` (estensione `db` aggiunta agli `assetExts` di Metro), **non committato**: si copia dalla pipeline con `pnpm --filter mobile db:pull`. Al primo avvio `SQLiteProvider` lo copia in un file locale il cui nome contiene l'hash dell'asset, così un artefatto nuovo non sovrascrive a ogni avvio e la versione dello schema si verifica in `onInit`. Il canale di aggiornamento è un punto aperto.

- **Aggiornare i dati** significa rigenerare l'artefatto: nessuna logica dell'app deve presupporre un catalogo fisso.

## Motore di raccomandazione

Motivazioni in `docs/valutazione-strategie-ml.md`.

**Cosa si può fare dipende dai dati.** Abbiamo le feature Wikidata e gli swipe di un solo utente, sul suo dispositivo. Mancano le interazioni di molti utenti, quindi collaborative filtering, LightFM, learning to rank e deep learning restano fuori.

**Struttura.** Il motore ha 4 stadi, ognuno è una funzione pura. Nel complesso è `(artefatto, eventi utente) → prossima carta`. Niente framework.

| Stadio       | v1 (sul dispositivo, senza runtime ML)                                                                                                    | Dopo la riscrittura                                                                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Retrieval    | Vicini dei film piaciuti + serbatoio di film popolari per sitelink, che serve anche per le prime carte                                    | + vicini negli embedding                                                                                                                                        |
| Ranking      | `Σ voto × similarità + λ·prior` su una sola tabella combinata (non 3 modelli a rotazione come nell'originale)                             | Modello lineare condiviso per utente (LinUCB o Thompson lineare) su embedding, prior, decade e durata. Si aggiorna con Sherman-Morrison: matrice d×d con d ≤ 64 |
| Riordino     | Escludere i film già visti e quelli non ancora usciti (P577 nel futuro). Mai due film della stessa saga di fila (P179). Diversità con MMR | Uguale                                                                                                                                                          |
| Esplorazione | ε-greedy (ε ≈ 0,10-0,15), pescando dal serbatoio dei popolari o dei diversi                                                               | Thompson / LinUCB                                                                                                                                               |

**Embedding futuri.** Si ottengono con una SVD troncata della matrice film × feature TF-IDF, calcolata nella pipeline con numpy o scikit-learn: 32-64 dimensioni, distribuiti come altra tabella versionata dell'artefatto. Niente reti neurali. Non generarli finché non esiste il codice che li usa.

**Eventi.** Si salvano **grezzi**, non solo i punteggi aggregati. Ogni evento contiene:

- film, azione (like, scarto, watchlist) e timestamp;
- **versione di algoritmo e artefatto** che ha proposto la carta;
- **propensità**: la probabilità con cui la carta è stata scelta (es. 0,9 se sfruttamento, 0,1 se esplorazione).

Servono a tre cose:

- al bandit;
- alla valutazione off-policy (IPS) dei motori futuri sui log;
- alla metrica di successo: percentuale di swipe a destra e aggiunte alla watchlist per sessione, divise per versione di algoritmo.

**Fonti di dati.** Anche il ML futuro userà solo feature Wikidata ed eventi dell'utente, mai contenuti TMDB.

**Solo se arrivano interazioni di molti utenti:** item-kNN sui like in comune, ALS o BPR (libreria `implicit`), poi LightFM o LightGBM. Le interazioni possono venire da:

- una telemetria propria, opt-in, con backend;
- MovieLens, ma serve il permesso di GroupLens: la licenza copre solo la ricerca, e le trasformazioni si ridistribuiscono solo con la stessa licenza.

Questi modelli producono vicini o embedding per film, quindi entrano nell'artefatto senza cambiare l'app.

**Non adatti:** deep learning, GNN, regole di associazione, RL completo.

## Errori dell'app originale da non ripetere

Dettagli e riferimenti in `docs/analisi-codebase.md`.

- **Swipe persi o applicati tardi.** Gli swipe non venivano salvati e il feedback arrivava dopo il fetch della carta successiva. Va salvato e applicato _prima_.
- **Segnaposto al posto degli errori.** Su errore si restituiva un film segnaposto (`Movie.example`), che causava un loop infinito di richieste. Gli errori devono essere espliciti e i retry limitati.
- **Watchlist in quattro copie.** Qui deve esserci una sola fonte di verità in SQLite.
- **Bottone bloccato.** Ogni stato di caricamento deve avere anche il ramo di errore.
- **Nessuna accessibilità.** I bottoni con sola icona devono avere un'etichetta accessibile.

## Punti aperti (da decidere con l'utente)

- **Filtro per piattaforme di streaming.** I provider sono dati TMDB/JustWatch: usarli per filtrare le raccomandazioni è in tensione con la regola "TMDB solo per la UI".
- **Canale di aggiornamento dell'artefatto:** nuova build, EAS Update o download da un host statico.
- **Uso commerciale:** richiede un accordo scritto con TMDB.

## Commit

Scope del repo: `mobile`, `proxy`, `pipeline`, `legacy`, `docs`.
