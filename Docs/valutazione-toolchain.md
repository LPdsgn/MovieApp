# Toolchain per lint, format, hook e CI/CD

- **Data:** 2026-10-05 (versioni, stato dei progetti e prezzi rilevati in questa data).
- **Aggiornamento del 2026-10-06:** il verdetto su lint e format è passato da OXC a **ESLint + Prettier**. Il motivo è il React Compiler (sezione 1). Python, hook, CI e CD restano com'erano.
- **Contesto:** strumenti da introdurre insieme allo scaffolding di `mobile/` (Expo) e `pipeline/` (Python + uv), vedi [CLAUDE.md](../CLAUDE.md).
- **Preferenze dell'utente:** lefthook, OXC (oxfmt + oxlint), Prettier + ESLint.
- **Metodo:** documentazione ufficiale, metadati npm e PyPI, sorgenti su GitHub, ispezione del template Expo SDK 57 e di `eslint-plugin-react-hooks`.
- **Limiti:**
   - nessuna configurazione è stata provata;
   - le prestazioni dichiarate dai produttori non sono verificate.

## Verdetto

| Area                 | Scelta                                                                               |
| -------------------- | ------------------------------------------------------------------------------------ |
| Lint JS/TS           | **ESLint** con `eslint-config-expo` 57 (`npx expo lint`)                             |
| Format               | **Prettier** 3.9 + `prettier-plugin-tailwindcss` + `eslint-config-prettier`          |
| Typecheck            | **TypeScript 6.0.3**, come nel template Expo (`tsc --noEmit`)                        |
| Python (`pipeline/`) | **ruff** (lint + format) + **pytest**                                                |
| Hook                 | **lefthook** + **commitlint**                                                        |
| CI                   | **GitHub Actions**: controlli su push/PR e pipeline dati programmata                 |
| CD                   | **EAS Workflows**, da attivare alla prima build da distribuire, non allo scaffolding |

OXC (oxlint + oxfmt) va rivalutato più avanti: la sezione 1 indica a quali condizioni.

## 1. OXC vs ESLint + Prettier

|                               | OXC (oxlint + oxfmt)                                                                                                                 | ESLint + Prettier (strada ufficiale Expo)                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Stato                         | oxlint 1.87 stabile. oxfmt 0.72: beta da febbraio 2026, ancora sotto la 1.0, dichiara il 100% di compatibilità con Prettier su JS/TS | ESLint 10.12, Prettier 3.9.9. È ciò che crea `npx expo lint` (`eslint-config-expo` 57)                                                        |
| **Regole del React Compiler** | **No.** Copre solo `react/hooks` e `react/exhaustive-deps`                                                                           | **Sì.** `eslint-config-expo` attiva il set `recommended` di `eslint-plugin-react-hooks` 7.1.1: 16 regole, di cui 14 diagnostiche del compiler |
| TypeScript                    | Il linting sui tipi richiede TS 7+. Copre 59 delle 61 regole di typescript-eslint basate sui tipi                                    | typescript-eslint 8.71 supporta TS solo `<6.1.0`. Il template Expo usa 6.0.3, quindi va bene                                                  |
| Regole Expo                   | `eslint-plugin-expo` solo tramite i JS plugin di oxlint, che sono in alpha                                                           | Incluse (`no-dynamic-env-var`, `no-env-var-destructuring`, `prefer-box-shadow`, `use-dom-exports`)                                            |
| Riordino classi Tailwind      | Integrato (`sortTailwindcss`, disattivato per default)                                                                               | `prettier-plugin-tailwindcss` 0.8.1 (opzione `tailwindStylesheet` per Tailwind 4)                                                             |
| Riordino import               | Integrato (`sortImports`)                                                                                                            | `import/order`, già incluso in `eslint-config-expo`                                                                                           |
| Altri formati                 | JSON, YAML, TOML, CSS, Markdown                                                                                                      | Con Prettier, ma TOML richiede un plugin                                                                                                      |

**Il punto decisivo è il React Compiler.**

- **Il template Expo SDK 57 lo attiva per default** (`"reactCompiler": true` in `app.json`).
- **Le 14 diagnostiche del compiler** sono: `static-components`, `use-memo`, `preserve-manual-memoization`, `incompatible-library`, `immutability`, `globals`, `refs`, `set-state-in-effect`, `error-boundaries`, `purity`, `set-state-in-render`, `unsupported-syntax`, `config`, `gating`.
- **Perché contano qui.** Segnalano gli schemi che fanno rinunciare il compiler a ottimizzare un componente, o che lo fanno comportare male: mutazioni o letture di ref durante il render, valori condivisi. Il cuore dell'app è un mazzo di carte con Reanimated, che con il compiler attivo raccomanda `get()` e `set()` al posto di `.value`.
- **Con oxlint** questi errori passerebbero senza avviso. Spegnere il compiler per poter adottare un linter non ha senso.

Gli altri motivi:

- **È la strada ufficiale Expo.** `eslint-config-expo` esce in sincronia con la SDK (57.x) e include le regole sulle variabili `EXPO_PUBLIC_`.
- **Nessuno scostamento dal template:** si resta su TypeScript 6.0.3. Il vantaggio di TS 7 e di OXC è la velocità, che con qualche migliaio di righe non si nota.
- **Il formatter conta poco.** oxfmt promette lo stesso output di Prettier, quindi passare dall'uno all'altro in futuro non cambia il codice. Prettier ha dalla sua la stabilità e il plugin Tailwind di riferimento.

Note su Prettier:

- va eseguito **separatamente**, non come regola ESLint, quindi niente `eslint-plugin-prettier`;
- `eslint-config-prettier` serve solo a disattivare le regole ESLint che entrano in conflitto con la formattazione.

**Quando rivalutare OXC:**

- quando oxlint coprirà le regole del React Compiler. Una possibilità è caricare `eslint-plugin-react-hooks` tramite i suoi JS plugin, ma oggi sono in alpha e non è verificato che le regole del compiler ci funzionino;
- oppure se il lint diventasse lento. A quel punto si può affiancare oxlint con `eslint-plugin-oxlint`, che spegne in ESLint le regole già coperte da oxlint, e migrare con `@oxlint/migrate`;
- per oxfmt, aspettare la 1.0.

Due cose da sapere se si passa a OXC:

- il linting basato sui tipi di oxlint richiede TypeScript 7. Il `tsconfig` di base di Expo SDK 57 è compatibile (`bundler`, `preserve`, `ESNext`, niente `baseUrl`);
- oxfmt usa `printWidth` 100 di default, contro 80 di Prettier.

## 2. Python (`pipeline/`)

- **ruff** 0.16, stabile: `ruff check` + `ruff format`.
- **pytest** 9, con test che usano risposte SPARQL salvate e non vanno in rete.
- **ty** di Astral è ancora beta (0.0.84): eventualmente lo si aggiunge come controllo non bloccante.

## 3. Hook: lefthook

lefthook 2.1.17 è disponibile sia su npm sia su PyPI.

Propongo un `package.json` in root come radice di workspace npm (`"workspaces": ["mobile"]`). Expo supporta i workspace in modo nativo (npm, Bun, pnpm, Yarn) e configura Metro da solo dalla SDK 52. Con un `npm install` vengono installati anche gli hook.

Dove stanno gli strumenti:

- **Root:** lefthook, commitlint e Prettier. Prettier formatta tutto il repo (codice, Markdown, YAML, JSON) con un'unica configurazione, e `tailwindStylesheet` è relativo a quel file.
- **`mobile/`:** ESLint (`eslint.config.js` generato da `npx expo lint`) e TypeScript.

| Hook         | Cosa esegue                                                                                     | Quando                                    |
| ------------ | ----------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `pre-commit` | Prettier (corregge e ri-aggiunge al commit), ESLint `--fix`, `ruff format` + `ruff check --fix` | Sui file in stage                         |
| `pre-commit` | `tsc --noEmit`                                                                                  | Solo se cambiano file in `mobile/`        |
| `commit-msg` | commitlint con le regole dell'utente: tipi ammessi, header ≤ 120, subject minuscolo             | Sempre                                    |
| `pre-push`   | jest (`jest-expo` 57), pytest                                                                   | Solo se cambia la cartella corrispondente |

commitlint non può verificare che il subject sia in italiano. Tipi, lunghezza e minuscole sì.

## 4. CI: GitHub Actions

Il repo è pubblico, quindi i runner standard sono gratuiti.

- **`ci.yml`**, su push e PR, con filtri per cartella:
   - `mobile`: `npm ci` → `prettier --check` → `npx expo lint` → `tsc --noEmit` → jest → `npx expo-doctor`
   - `pipeline`: `setup-uv` → `uv sync --locked` → `ruff check` → `ruff format --check` → pytest
- **`data.yml`**, settimanale e avviabile a mano: esegue la pipeline e produce l'artefatto.
   - Dove finisce l'artefatto dipende dal punto aperto sul canale di aggiornamento.
   - In ogni caso **non va committato ogni settimana**: 10 MB o più per 52 settimane gonfiano la history. Meglio un asset di release o un artifact del workflow.
- **Insidie da conoscere:**
   - sui fork le Actions sono **disattivate per default**: vanno abilitate dalla tab Actions;
   - nei repo pubblici i workflow programmati **si disattivano dopo 60 giorni** senza attività sul repo;
   - i runner condividono gli IP, quindi il 429 di WDQS è probabile. Servono una pipeline che riprende da dove si era fermata, i risultati parziali in `actions/cache` e un User-Agent con contatto letto da una variabile del repo.

## 5. CD: EAS Workflows

- **Struttura:** file in `.eas/workflows/*.yml`, con trigger su `push`, `pull_request` e `schedule`.
- **Job disponibili:** `fingerprint`, `build`, `repack`, `update`, `update-rollout`, `submit`, `testflight`, `maestro`, `github-comment`, `require-approval` e altri.
- **Schema di rilascio:** si parte da `fingerprint`.
   - Se esiste già una build compatibile, basta un **`update` OTA**.
   - Altrimenti si fa `build` (o `repack`), poi `submit` o `testflight`.
- **Piano gratuito:**
   - 15 build Android e 15 iOS al mese, coda a bassa priorità, timeout di 45 minuti;
   - aggiornamenti OTA fino a 1.000 utenti attivi al mese;
   - **60 minuti al mese di workflow CI/CD**: troppo pochi per i controlli su ogni push. Per questo i controlli girano su GitHub Actions ed EAS fa solo build e aggiornamenti.

   Il piano Starter costa 19 $/mese.

- **Prerequisiti:**
   - un account Expo collegato alla GitHub app;
   - Apple Developer Program per TestFlight e App Store;
   - un account Google Play Console per il Play Store.

## Ordine allo scaffolding

1. `package.json` di root con workspace, poi `mobile/` creato con il template `minimal-uniwind`.
2. TypeScript: si tiene la versione del template (6.0.3).
3. Lint e format:
   - `npx expo lint` in `mobile/`, più `eslint-config-prettier`;
   - Prettier in root con `prettier-plugin-tailwindcss` e `tailwindStylesheet` puntato al CSS di Uniwind.
4. `pyproject.toml` di `pipeline/` con ruff e pytest.
5. `lefthook.yml` e config di commitlint.
6. `.github/workflows/ci.yml`.

Più avanti: `data.yml` insieme alla pipeline, ed EAS Workflows alla prima build da distribuire.

## Fonti

- [Expo: ESLint e Prettier](https://docs.expo.dev/guides/using-eslint/) · [Expo: monorepo](https://docs.expo.dev/guides/monorepos/)
- [prettier-plugin-tailwindcss](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)
- [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) · [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) · [Oxlint: regole](https://oxc.rs/docs/guide/usage/linter/rules.html) · [Oxlint: linting basato sui tipi](https://oxc.rs/docs/guide/usage/linter/type-aware.html)
- [EAS Workflows](https://docs.expo.dev/eas/workflows/get-started/) · [EAS Workflows: job](https://docs.expo.dev/eas/workflows/pre-packaged-jobs/) · [Prezzi Expo](https://expo.dev/pricing)
