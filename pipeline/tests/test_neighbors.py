import sqlite3

from moovie_pipeline import artifact
from moovie_pipeline.neighbors import compute, tfidf, top_k

DRAMA, USA = ("P136", 1), ("P495", 2)
KUBRICK, NOLAN = ("P57", 10), ("P57", 11)
FILMS = {
    1: [DRAMA, USA, KUBRICK],
    2: [DRAMA, USA, KUBRICK],
    3: [DRAMA, USA, NOLAN],
    4: [DRAMA, USA],
    5: [],  # senza feature: nessun vicino
}
ROWS = [(q, p, v) for q, fs in FILMS.items() for p, v in fs]


def test_rare_feature_beats_common_ones():
    x = tfidf(list(FILMS), ROWS)
    by_row = {}
    for i, _rank, j, score in top_k(x, k=2):
        by_row.setdefault(i, []).append((j, score))
    assert by_row[0][0][0] == 1  # il film 1 ha come primo vicino il 2 (stesso regista)
    assert by_row[0][0][1] > by_row[0][1][1]
    assert (
        by_row[2][0][0] == 3
    )  # il film 3 (Nolan) preferisce il 4: solo feature comuni, ma nessuna estranea
    assert 4 not in by_row  # il film 5 non ha vicini
    assert all(len(v) <= 2 for v in by_row.values())
    assert all(i != j for i, v in by_row.items() for j, _ in v)


def test_compute_writes_neighbors_and_meta():
    conn = sqlite3.connect(":memory:")
    conn.executescript(artifact.SCHEMA)
    conn.executemany(
        "INSERT INTO movies (qid, tmdb_id, sitelinks) VALUES (?, ?, 10)", [(q, q) for q in FILMS]
    )
    conn.executemany("INSERT INTO features VALUES (?, ?, ?)", ROWS)
    n = compute(conn, k=2)
    assert n == conn.execute("SELECT count(*) FROM neighbors").fetchone()[0] > 0
    assert conn.execute("SELECT neighbor FROM neighbors WHERE qid = 1 AND rank = 0").fetchone() == (
        2,
    )
    assert dict(conn.execute("SELECT key, value FROM meta"))["neighbors_k"] == "2"
