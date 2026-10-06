# Wikidata: cosa usa la pipeline e cosa abbiamo imparato

- **Data:** 2026-10-06
- **Scopo:** i soli parametri e comportamenti di WDQS e dell'API MediaWiki che servono a `pipeline/`. Per il resto, le pagine online restano la fonte.
- **Fonti:**
   - [WDQS, guida utente](https://www.mediawiki.org/wiki/Wikidata_Query_Service/User_Manual)
   - [`wbgetentities`](https://www.wikidata.org/w/api.php?action=help&modules=wbgetentities)
   - [Parametri del modulo principale dell'API](https://www.wikidata.org/w/api.php?action=help&modules=main), tra cui `maxlag`
   - [Manual: Maxlag parameter](https://www.mediawiki.org/wiki/Manual:Maxlag_parameter)
   - [Policy sullo User-Agent](https://foundation.wikimedia.org/wiki/Policy:Wikimedia_Foundation_User-Agent_Policy)

## Parametri che usiamo

| Dove            | Parametro    | Valore        | Perché                                                                               |
| --------------- | ------------ | ------------- | ------------------------------------------------------------------------------------ |
| WDQS            | `format`     | `json`        | Binding come JSON                                                                    |
| `wbgetentities` | `ids`        | fino a 50 QID | Limite per i client senza `apihighlimits`                                            |
| `wbgetentities` | `props`      | `claims`      | Il default aggiunge label, descrizioni, alias e sitelink in tutte le lingue: inutili |
| `wbgetentities` | `redirects`  | default `yes` | Vedi sotto                                                                           |
| Entrambi        | `User-Agent` | da ambiente   | Descrittivo e con contatto, come richiede la policy; mai email nel codice            |

Richieste sempre in GET e in serie, mai in parallelo.

## Comportamenti misurati o scoperti

1. **La query del catalogo basta da sola.** `?film wdt:P4947 ?tmdb; wikibase:sitelinks ?s` con `FILTER(?s >= 10)` risponde in circa 30 s con 28.600 righe. Partizionare per anno non conviene: `FILTER(YEAR(?date) = ...)` non usa indici e ogni anno costa 17-25 s, quanto la query intera.
2. **`maxlag` non va mandato nelle letture.** Serve ai bot che scrivono. Su Wikidata il lag calcolato include anche il ritardo dell'updater di WDQS, che arriva a minuti (`queryserviceLag` nella risposta d'errore): con `maxlag=5` le letture restano bloccate anche se i database sono allineati.
3. **I redirect cambiano chiave.** Con `redirects=yes` un QID unito a un altro elemento torna sotto la chiave del QID di destinazione, con un campo `redirects: {from, to}`. Chi cerca la chiave originale lo scambia per mancante.
4. **I valori truthy vanno ricostruiti a mano.** `wbgetentities` restituisce tutti gli statement con il loro `rank`. La semantica di `wdt:` è: i `preferred` se ce ne sono, altrimenti i `normal`, mai i `deprecated`.
5. **Date e quantità hanno precisione e unità.** P577 con precisione 9 (anno) ha mese e giorno a `00`; P2047 può essere in minuti (Q7727), ore (Q25235) o secondi (Q11574).
6. **Limiti di frequenza.** WDQS può rispondere 429 con `Retry-After` anche di un minuto durante i disservizi (visto il 05/10/2026). Il client rispetta l'header e riprova con backoff; i risultati parziali restano su disco.
