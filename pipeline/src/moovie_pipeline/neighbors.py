"""Stadio 3: top-K vicini per film con TF-IDF sulle feature e similarità del coseno.

Ogni coppia (proprietà, QID) è un termine. TF binario, IDF = log(N / df): le feature comuni
("drammatico", "Stati Uniti") pesano poco, quelle rare (regista, saga) pesano molto.
"""

import logging
import sqlite3
from pathlib import Path

import numpy as np
from scipy import sparse

from . import artifact, features

log = logging.getLogger(__name__)

K = 64
BLOCK = 1000
ALGORITHM = "tfidf-cosine-v1"


def tfidf(qids: list[int], rows: list[tuple[int, str, int]]) -> sparse.csr_matrix:
    """Matrice film × termine, pesi TF-IDF, righe normalizzate L2. rows: (qid, property, value)."""
    row_of = {q: i for i, q in enumerate(qids)}
    terms: dict[tuple[str, int], int] = {}
    r, c = [], []
    for qid, prop, value in rows:
        r.append(row_of[qid])
        c.append(terms.setdefault((prop, value), len(terms)))
    x = sparse.csr_matrix(
        (np.ones(len(r), dtype=np.float32), (r, c)), shape=(len(qids), len(terms))
    )
    x.data[:] = 1  # binario anche se una coppia si ripetesse
    df = np.asarray((x > 0).sum(axis=0)).ravel()
    idf = np.log(len(qids) / df).astype(np.float32)
    x = x @ sparse.diags(idf)
    norms = np.sqrt(np.asarray(x.multiply(x).sum(axis=1)).ravel())
    norms[norms == 0] = 1
    return sparse.diags(1 / norms) @ x


def top_k(x: sparse.csr_matrix, k: int = K) -> list[tuple[int, int, int, float]]:
    """(riga, rank, riga vicina, coseno) per ogni riga, escludendo se stessa e gli zeri."""
    out = []
    xt = x.T.tocsc()
    for start in range(0, x.shape[0], BLOCK):
        sims = (x[start : start + BLOCK] @ xt).toarray()
        for i, row in enumerate(sims):
            row[start + i] = 0
            kk = min(k, len(row) - 1)
            idx = np.argpartition(-row, kk)[:kk]
            idx = idx[np.argsort(-row[idx])]
            out += [
                (start + i, rank, int(j), float(row[j])) for rank, j in enumerate(idx) if row[j] > 0
            ]
        log.info("vicini: %d/%d", min(start + BLOCK, x.shape[0]), x.shape[0])
    return out


def compute(conn: sqlite3.Connection, k: int = K) -> int:
    qids = [q for (q,) in conn.execute("SELECT qid FROM movies ORDER BY qid")]
    rows = conn.execute("SELECT qid, property, value FROM features").fetchall()
    x = tfidf(qids, rows)
    result = [(qids[i], rank, qids[j], score) for i, rank, j, score in top_k(x, k)]
    with conn:
        conn.executemany("INSERT INTO neighbors VALUES (?, ?, ?, ?)", result)
        artifact.set_meta(conn, neighbors_k=k, neighbors_algorithm=ALGORITHM)
    return len(result)


def build(out: Path, min_sitelinks: int, cache_dir: Path) -> int:
    """Catalogo + feature + vicini. Restituisce il numero di righe in neighbors."""
    features.build(out, min_sitelinks, cache_dir)
    conn = artifact.connect(out)
    n = compute(conn)
    conn.execute("VACUUM")
    conn.close()
    return n
