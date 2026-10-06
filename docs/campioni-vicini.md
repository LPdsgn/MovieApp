# Campioni di vicini per i test del motore

- **Data:** 2026-10-07
- **Scopo:** fissare come si comportano i vicini TF-IDF su film noti, così da riconoscere in fase di test una regressione (cambio di pesi, di soglia, di schema) da un cambiamento voluto.
- **Algoritmo:** `tfidf-cosine-v1` (`pipeline/src/moovie_pipeline/neighbors.py`): TF binario sulle coppie (proprietà, QID), IDF = log(N/df), righe normalizzate L2, coseno, K=64.
- **Limite:** osservazioni su un solo film. Vanno estese ad altri campioni (un film di saga, un film d'autore, un film molto popolare con cast enorme) prima di trarne regole.

## Titanic (1997), Q44578, TMDB 597

### Catalogo piccolo: 30 film, soglia sitelink ≥ 100

| rank | vicino                | coseno | perché                                         |
| ---- | --------------------- | ------ | ---------------------------------------------- |
| 0    | Avatar (2009)         | 0,061  | stesso regista e sceneggiatore (James Cameron) |
| 1    | The Terminator (1984) | 0,032  | stesso regista e sceneggiatore                 |
| 2    | Gladiator (2000)      | 0,023  | solo feature comuni (genere, paese, lingua)    |

Con 30 film il regista è l'unica feature rara condivisa: domina subito. Punteggi bassi perché quasi tutte le feature di Titanic (cast, soggetto) non esistono altrove nel campione.

### Catalogo completo: 28.572 film, soglia sitelink ≥ 10

| rank | vicino                          | coseno | feature condivise                            |
| ---- | ------------------------------- | ------ | -------------------------------------------- |
| 0    | Ghosts of the Abyss (2003)      | 0,180  | P57, P58, P161, P364, P495, **P921**         |
| 1    | Aliens of the Deep (2005)       | 0,148  | P57, P58, P161, P364, P495                   |
| 2    | True Lies (1994)                | 0,103  | P57, P58, P161, P272, P344, P364, P495       |
| 3    | Avatar: Fire and Ash (2025)     | 0,089  | P57, P58, P161, P272, P344, P364, P495       |
| 4    | Avatar: The Way of Water (2022) | 0,081  | P57, P58, P161, P272, P344, P364, P495, P136 |
| 5    | Aliens (1986)                   | 0,080  | P57, P58, P161, P272, P364, P495, P86        |

Osservazioni:

1. **Regista e sceneggiatore dominano anche nel catalogo completo.** Tutti e sei sono film di James Cameron, che su Wikidata è sia P57 sia P58: la stessa persona conta due volte. Il soggetto P921 (naufragio del Titanic) pesa solo sul primo posto.
2. **I documentari dello stesso regista superano i suoi blockbuster.** Ghosts of the Abyss e Aliens of the Deep hanno poche feature, quindi la normalizzazione L2 concentra il peso su quelle condivise. Avatar (2009), primo nel campione piccolo, qui non è nemmeno tra i primi sei: ha un cast enorme e molte feature proprie che diluiscono la similarità.
3. **Il cast (P161) è condiviso da tutti**, ma è l'effetto del regista: attori ricorrenti di Cameron (Bill Paxton e altri), non il cast di Titanic in sé.

Caveat: è il comportamento atteso di un content-based puro, "sempre più dello stesso". La varietà non va cercata qui ma nel riordino dell'app: regola sulle saghe (P179), MMR, ε-greedy. Se in futuro si vorrà attenuare il doppio conteggio regista+sceneggiatore o la dominanza dei film con poche feature, le manopole sono i pesi per proprietà e un TF sublineare per gruppo, entrambi nella pipeline, e vanno misurati su questo campione prima e dopo.

## Come riprodurre

Da `pipeline/`, con l'artefatto in `dist/moovie.sqlite`:

```bash
uv run python -c "
import sqlite3
from moovie_pipeline.neighbors import unpack
c = sqlite3.connect('dist/moovie.sqlite')
blob, = c.execute('SELECT data FROM neighbors WHERE qid = 44578').fetchone()
for q, s in unpack(blob)[:6]:
    tmdb, = c.execute('SELECT tmdb_id FROM movies WHERE qid = ?', (q,)).fetchone()
    print(q, tmdb, round(s, 3))
"
```

I titoli si ricavano dagli id TMDB (per esempio tramite il proxy). Il catalogo piccolo si rigenera con `uv run moovie-pipeline neighbors --min-sitelinks 100 --out dist/small.sqlite`.
