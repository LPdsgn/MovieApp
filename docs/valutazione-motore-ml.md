# Un motore ML "vero" per MoovieFinder: valutazione

- **Data:** 2026-10-05
- **Commit analizzato:** `2ad7402` (`main`)
- **Metodo:**
   - analisi della codebase in [analisi-codebase.md](analisi-codebase.md);
   - ispezione dei modelli Core ML in [valutazione-porting.md](valutazione-porting.md);
   - lettura dei termini delle API di TMDB e delle risposte dello staff sul forum (fonti in fondo).
- **Limiti:**
   - non è un parere legale: per un uso commerciale va confermato con TMDB;
   - stime e librerie sono indicative, non verificate con un prototipo.

## In breve

1. **Aggiungerebbe valore? Sì, ma non è la prima cosa da fare.** I problemi principali dell'app non si risolvono con più ML. E per un singolo utente ci sono pochi dati: poche decine di swipe a sessione bastano per un modello semplice, non per uno complesso.
2. **Sarebbe possibile in multipiattaforma? Tecnicamente sì**, con qualsiasi toolchain. **Il vero vincolo però è legale.** I termini delle API di TMDB, aggiornati il 20/10/2023, vietano di usare le API o i contenuti TMDB "in connection with, including for training, a machine learning (ML) or artificial intelligence (AI) based Application". Per farlo serve un accordo scritto con TMDB.

## 1. Il valore

Il motore di oggi è già una tecnica di raccomandazione legittima: suggerisce film simili per contenuto, usando tabelle di vicini. I suoi limiti reali sono però quasi tutti fuori dal ML:

| Limite di oggi                                                                           | Lo risolve un ML migliore?                                                      |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Gli swipe non vengono salvati: a ogni avvio l'app dimentica i tuoi gusti                 | No: basta salvarli                                                              |
| Il catalogo è fermo al 2022 (circa 17 mila film)                                         | No: serve una pipeline che aggiorni i dati                                      |
| L'app non sa su quali piattaforme guardi (l'impostazione non viene salvata)              | No: basta un filtro sui provider TMDB                                           |
| Il feedback viene applicato in ritardo (bug)                                             | No: va corretto il bug                                                          |
| Propone sempre il film più simile, senza mai esplorare: resti chiuso negli stessi generi | **In parte**: un algoritmo "bandit" alterna sfruttamento ed esplorazione        |
| Alterna i 3 modelli invece di combinarli, con gli stessi pesi per tutti                  | **Sì**: un modello per utente impara cosa conta per te (regista, genere, epoca) |
| Due film sono simili solo se condividono etichette (generi, keyword, case di produzione) | **Sì**: gli embedding della trama misurano la somiglianza di contenuto          |

In ordine di valore rispetto al costo:

1. **Correggere i fondamentali**, cioè le prime quattro righe della tabella. È il guadagno più grande e non c'entra il ML.
2. **ML leggero per utente:** un bandit (Thompson sampling o LinUCB) sulle caratteristiche dei film, più embedding precalcolati. Buon valore e costo basso.
3. **Collaborative filtering**, cioè imparare dai gusti degli altri utenti. È la tecnica che renderebbe di più, ma richiede un backend e migliaia di utenti attivi, che oggi non ci sono.
4. **LLM** ("cerca per mood", spiegazioni del perché un film ti viene proposto). Sarebbe ottimo per l'esperienza, ma i termini di TMDB lo vietano esplicitamente.

Una premessa vale per tutto: oggi l'app non ha nessuna analytics, quindi un miglioramento non si può misurare. Prima di investire va definita una metrica, per esempio la percentuale di swipe a destra o le aggiunte alla watchlist per sessione.

## 2. La fattibilità tecnica

La toolchain non è un limite. Conta dove gira il modello:

| Approccio                                                                         | Dove gira                                                                                                                                            | In Expo                                                                                                                                                      |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bandit + embedding precalcolati                                                   | Sul dispositivo, TypeScript puro. 17 mila film × 384 dimensioni in int8 fanno circa 6,5 MB. Il calcolo richiede probabilmente decine di millisecondi | Nessun modulo nativo                                                                                                                                         |
| Reti neurali sul dispositivo (embedding di una query, piccoli LLM)                | Sul dispositivo                                                                                                                                      | Moduli nativi (`react-native-executorch`, `onnxruntime-react-native`, `react-native-fast-tflite`) con development build, non Expo Go. Maturità da verificare |
| LLM di sistema (Apple Foundation Models su iOS 26, Gemini Nano su alcuni Android) | Sul dispositivo                                                                                                                                      | Un bridge nativo per piattaforma. Coprono solo una parte dei dispositivi, quindi non vanno bene come motore principale                                       |
| Collaborative filtering o LLM lato server                                         | Backend (Python, Vercel Functions…)                                                                                                                  | Non dipende dalla toolchain                                                                                                                                  |

Flutter e Kotlin Multiplatform hanno opzioni equivalenti.

## Il vincolo vero: i termini di TMDB

- **Cosa vietano i termini** (§1.C e §2.A):
   - usare contenuti TMDB in un'applicazione basata su ML o AI;
   - addestrare o validare modelli con quei contenuti;
   - qualunque uso con LLM o chatbot;
   - conservare in cache i dati TMDB per più di 6 mesi.

   L'uso commerciale richiede sempre un accordo scritto.

- **Un'interpretazione più stretta, ma informale.** Il 20/07/2026 Travis Bell, dello staff TMDB, ha risposto sul forum a un caso specifico: un progetto di studenti, non commerciale, che calcola similarità con TF-IDF o embedding "non rientra" in ciò che i termini vogliono escludere. È una risposta su un forum, non una regola: non definisce un confine e non copre l'uso commerciale.
- **Riguarda anche l'app di oggi:**
   - i 3 modelli Core ML sono stati addestrati sui metadati TMDB nel 2022, prima che i termini cambiassero;
   - `swift/MoviesApp/Resources/movies.json` contiene 10.000 schede TMDB del 2022 (trama, poster, provider) ed è **pubblico sul fork `LPdsgn/MovieApp`**. Supera il limite di 6 mesi di cache ed è di fatto un dataset pubblicato. L'app non lo usa nemmeno: conviene toglierlo dal repo. Resterebbe comunque nella history di git.
- **Una strada che riduce il rischio:**
   - il ML si costruisce su **Wikidata**, che è CC0 e ha generi, registi, cast e case di produzione. La proprietà P4947 collega circa 1,4 milioni di elementi agli id TMDB;
   - TMDB resta solo per mostrare i dati: poster, dettagli e provider.

   La clausola "in connection with" però è molto ampia: per un uso commerciale l'accordo scritto con TMDB serve comunque.

## Raccomandazione

1. Prima del ML: correggere i fondamentali e aggiungere una metrica.
2. Decidere se il progetto sarà commerciale:
   - **se no**, il ML leggero sul dispositivo (bandit + embedding) è ragionevole, anche se resta in una zona grigia;
   - **se sì**, serve un accordo con TMDB, oppure il ML va spostato su dati aperti.
3. Collaborative filtering e LLM vanno rimandati finché non ci sono utenti e una licenza che li permetta.

## Fonti

- [TMDB — API Terms of Use](https://www.themoviedb.org/api-terms-of-use) (ultimo aggiornamento: 20/10/2023)
- [TMDB Talk — Clarification needed: "training an AI/ML system"](https://www.themoviedb.org/talk/6a5e284be6125cf4396873a6) (risposta dello staff del 20/07/2026)
- [TMDB Talk — Non-commercial academic ML research](https://www.themoviedb.org/talk/684b56e31516e3e64b343bce) (senza risposta dello staff)
- [Wikidata — Property P4947 (TMDB movie ID)](https://www.wikidata.org/wiki/Property:P4947)
