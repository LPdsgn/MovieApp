# moovie-pipeline

Pipeline dati Wikidata per il motore di raccomandazione di MoovieFinder. Vincoli e formato dell'artefatto in `CLAUDE.md` (sezione "Pipeline dati").

## Uso

Serve un User-Agent descrittivo con un contatto, come richiede la policy Wikimedia:

```bash
export MOOVIE_USER_AGENT="MoovieFinderPipeline/0.1 (https://github.com/LPdsgn/MovieApp; email)"
uv run moovie-pipeline catalog                    # dist/moovie.sqlite, soglia sitelink 10
uv run moovie-pipeline catalog --min-sitelinks 50 # catalogo piccolo per le prove
```

I risultati delle query finiscono in `.cache/`: una nuova esecuzione riparte da lì senza interrogare WDQS. Per rigenerare i dati cancella la cache.

## Stadi

| Stadio     | Comando   | Scrive                                             |
| ---------- | --------- | -------------------------------------------------- |
| 1 Catalogo | `catalog` | `movies` (qid, tmdb_id, sitelinks) e `meta`        |
| 2 Feature  | —         | `features`, più `released` e `runtime` in `movies` |
| 3 Vicini   | —         | `neighbors` (TF-IDF + coseno, K=64)                |

Lo schema completo è in `src/moovie_pipeline/artifact.py`.
