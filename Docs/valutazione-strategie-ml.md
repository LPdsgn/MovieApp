# Le strategie di ML nel contesto di MoovieFinder

- **Data:** 2026-10-05
- **Domanda:** quali famiglie di algoritmi di raccomandazione (senza LLM) hanno senso per MoovieFinder, e quando. Va tutto rimandato a dopo la riscrittura?
- **Input:** l'elenco di 8 famiglie raccolto dall'utente: content-based, collaborative filtering, ibridi e feature-based, deep learning non generativo, grafi, regole di associazione, reinforcement learning, rule-based.
- **Contesto:**
   - [valutazione-motore-ml.md](valutazione-motore-ml.md) (vincoli di licenza TMDB);
   - [CLAUDE.md](../CLAUDE.md) (decisioni: Wikidata per raccomandare, TMDB solo per la UI, motore sul dispositivo).
- **Limiti:** le dimensioni sono stime. Nessun algoritmo è stato provato sui dati.

## In breve

**No, non va tutto rimandato.** A decidere cosa si può fare non è la complessità del metodo ma **quali dati abbiamo**. Oggi abbiamo tre cose:

- le feature dei film, da Wikidata;
- gli swipe di **un solo utente**, salvati sul suo telefono;
- nessun backend e nessun dato di altri utenti.

Quasi tutte le famiglie dell'elenco, cioè collaborative filtering, LightFM, learning to rank e deep learning, imparano dalle interazioni di **molti** utenti. Senza quei dati non si possono usare, a prescindere dalla tecnica.

## Dove va ogni famiglia

| Famiglia                                       | Dati necessari                         | Li abbiamo? | Quando                           |
| ---------------------------------------------- | -------------------------------------- | ----------- | -------------------------------- |
| Content-based (TF-IDF + coseno)                | Feature dei film                       | Sì          | **v1**                           |
| Regole / knowledge-based                       | Vincoli di dominio                     | Sì          | **v1**                           |
| Bandit ε-greedy                                | Swipe dell'utente                      | Sì          | **v1**                           |
| Bandit Thompson / LinUCB                       | Swipe dell'utente + feature            | Sì          | **Dopo la riscrittura**          |
| Collaborative filtering (item-kNN, ALS, BPR)   | Interazioni di molti utenti            | No          | Solo se arrivano i dati          |
| Ibridi (LightFM), learning to rank (LightGBM)  | Interazioni di molti utenti + feature  | No          | Solo se arrivano i dati          |
| Grafo con random walk                          | Grafo film–feature (Wikidata lo è già) | Sì          | Possibile, ma guadagno marginale |
| Deep learning (two-tower, DeepFM, SASRec), GNN | Milioni di interazioni, reti neurali   | No          | Non adatto                       |
| Regole di associazione                         | "Carrelli" di molti utenti             | No          | Non adatto                       |
| Reinforcement learning completo                | Molti dati, obiettivo di lungo periodo | No          | Non adatto                       |

## Cosa entra già nella v1

Sono quattro aggiunte a costo quasi zero, e ognuna corregge un difetto noto:

1. **TF-IDF + coseno al posto della Jaccard semplice (nella pipeline).** Con la Jaccard, avere in comune "drammatico" o "Stati Uniti" pesa quanto avere lo stesso regista. L'IDF dà poco peso alle feature comuni e molto a quelle rare. Cambia solo la pipeline: l'artefatto resta una tabella di vicini.
2. **Regole e riordino (nell'app):**
   - escludere i film già visti e quelli non ancora usciti (P577 nel futuro);
   - mai due film della stessa saga di fila (P179);
   - un riordino per diversità (MMR).

   È il rimedio al "sempre più dello stesso", il difetto tipico del content-based e anche dell'app originale.

3. **Esplorazione ε-greedy (nell'app).** Con probabilità ε, per esempio 10-15%, la carta arriva dai film popolari o diversi invece che dai vicini. Sono una decina di righe.
4. **Registrare la propensità.** Per ogni carta si salva la probabilità con cui è stata scelta. Costa una colonna in più negli eventi. Senza, la valutazione off-policy (IPS) dei motori futuri sui log storici non sarà mai possibile.

Queste quattro parti sono già l'architettura a stadi di produzione, in piccolo:

| Stadio       | v1                                                    | Dopo la riscrittura                 |
| ------------ | ----------------------------------------------------- | ----------------------------------- |
| Retrieval    | Vicini dei film piaciuti + film popolari per sitelink | + vicini negli embedding            |
| Ranking      | Σ voto × similarità + λ · prior                       | Modello lineare per utente (LinUCB) |
| Riordino     | Regole + diversità                                    | Uguale                              |
| Esplorazione | ε-greedy                                              | Thompson / LinUCB                   |

Nel codice sono quattro funzioni pure, non un framework.

## Dopo la riscrittura: bandit + embedding, sempre senza reti neurali

- **Embedding.** Una SVD troncata della matrice film × feature TF-IDF, calcolata nella pipeline con numpy o scikit-learn, dà vettori da 32-64 dimensioni per ogni film. È algebra lineare, non una rete neurale. Stima: circa 1,8 MB per 28.600 film in int8.
- **Bandit.** LinUCB o Thompson lineare, con **un solo modello condiviso** sulle feature del film (embedding, popolarità, decade, durata). Non un "braccio" per film: con 28.600 film non si potrebbe.
   - Si aggiorna con Sherman-Morrison: una matrice 64×64 per utente, costo trascurabile in TypeScript.
   - Vowpal Wabbit sul dispositivo non serve.

   In pratica è il "learning to rank" dell'elenco, ma addestrato solo sugli swipe di quell'utente.

## Solo se arrivano dati di più utenti

Le strade sono due:

1. **Raccolta dati propria.** Telemetria anonima e opt-in verso un backend.
   - Con abbastanza utenti si fanno item-kNN sui like in comune e ALS o BPR (con la libreria `implicit`) nella pipeline.
   - Il risultato ha la stessa forma dell'artefatto (vicini o embedding per film), quindi **l'app non cambia**.
   - Poi si possono aggiungere LightFM e LightGBM.
   - Costi: un backend, il GDPR (gli swipe sono dati personali) e utenti reali.
2. **MovieLens 32M.** Sono 32 milioni di valutazioni da 200 mila utenti su 87 mila film. `links.csv` contiene gli id TMDB, quindi si aggancia al catalogo tramite P4947. Permetterebbe un collaborative filtering addestrato offline, senza utenti nostri. Ma la licenza pone tre limiti:
   - è pensata per la ricerca;
   - l'uso commerciale richiede il permesso di GroupLens;
   - le trasformazioni, come gli embedding dentro l'app, si possono ridistribuire solo con la stessa licenza.

   Per un'app pubblica va chiesto il permesso. Inoltre i dati si fermano a ottobre 2023, quindi il ritardo sulle novità sarebbe anche peggiore di quello dei sitelink.

## Perché il resto non è adatto

- **Deep learning e GNN:** servono milioni di interazioni. Con 28 mila film e un solo utente, vicini + bandit lineare rendono almeno altrettanto a costo zero. In più c'è il vincolo "niente reti neurali".
- **Regole di associazione:** servono i "carrelli" di molti utenti, e il collaborative filtering fa la stessa cosa meglio.
- **RL completo:** l'obiettivo è trovare un film per stasera, quindi la ricompensa è immediata e basta un bandit. Non c'è un valore di lungo periodo da ottimizzare, e mancano comunque i dati.
- **Random walk sul grafo:** si potrebbe fare, perché Wikidata è già un grafo. Ma un percorso film → feature → film è una variante a più passi del content-based, e rispetto a TF-IDF + coseno aggiunge poco. Al massimo diventa una fonte di candidati in più, in futuro.

Vale per tutti i casi: nessun motore si può confrontare con un altro senza la metrica, cioè like rate e aggiunte alla watchlist per versione di algoritmo.

## Fonti

- [MovieLens 32M — README e licenza](https://files.grouplens.org/datasets/movielens/ml-32m-README.html)
