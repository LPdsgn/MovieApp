# proxy

Proxy TMDB su Cloudflare Workers. Tiene la chiave fuori dal client (vincolo in `CLAUDE.md`, sezione "Dati").

Inoltra solo `GET /3/movie/{id}` con `language` (it-IT, en-US, de-DE) e `append_to_response` limitato a `credits` e `watch/providers`. Tutto il resto risponde 404. Lo status di TMDB passa invariato, con cache di un giorno all'edge.

Le immagini non passano di qui: gli URL di `image.tmdb.org` non richiedono chiave.

## Comandi

```bash
pnpm --filter proxy test        # node --test, nessuna dipendenza
pnpm --filter proxy typecheck
pnpm --filter proxy dev         # locale su http://localhost:8787, legge .dev.vars
pnpm --filter proxy deploy      # richiede `pnpm --filter proxy exec wrangler login`
```

## Secret

`TMDB_TOKEN` accetta la chiave v3 (32 esadecimali, passata come `api_key`) o il token di lettura v4 (JWT, passato come `Authorization: Bearer`).

```bash
echo "TMDB_TOKEN=..." > proxy/.dev.vars                       # locale, ignorato da git
pnpm --filter proxy exec wrangler secret put TMDB_TOKEN      # produzione
```
