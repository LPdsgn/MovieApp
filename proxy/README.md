# proxy

Proxy TMDB su Cloudflare Workers. Tiene la chiave fuori dal client (vincolo in `CLAUDE.md`, sezione "Dati").

Inoltra solo `GET /3/movie/{id}` con `language` (it-IT, en-US, de-DE) e `append_to_response` limitato a `credits` e `watch/providers`. Tutto il resto risponde 404. Lo status di TMDB passa invariato, con cache di un giorno all'edge.

Le immagini non passano di qui: gli URL di `image.tmdb.org` non richiedono chiave.

## Comandi

```bash
pnpm --filter proxy test        # node --test, nessuna dipendenza
pnpm --filter proxy typecheck
pnpm --filter proxy dev         # locale su http://localhost:8787, legge .dev.vars
pnpm --filter proxy release     # wrangler deploy; richiede `pnpm --filter proxy exec wrangler login`
                                # (lo script non si chiama `deploy`: è un comando interno di pnpm)
```

## Secret

`TMDB_TOKEN` accetta la chiave v3 (32 esadecimali, passata come `api_key`) o il token di lettura v4 (JWT, passato come `Authorization: Bearer`).

```bash
cp proxy/.dev.vars.example proxy/.dev.vars                   # locale, ignorato da git: compila TMDB_TOKEN
pnpm --filter proxy exec wrangler secret put TMDB_TOKEN      # produzione
```
