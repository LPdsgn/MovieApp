"""Schema e scrittura dell'artefatto SQLite che l'app include nel bundle."""

import sqlite3
from collections.abc import Iterable
from pathlib import Path

SCHEMA_VERSION = 2

SCHEMA = """
CREATE TABLE meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Un film per riga. QID e id TMDB sono interi (senza prefisso "Q").
-- released e runtime li riempie lo stadio feature (wbgetentities).
CREATE TABLE movies (
    qid        INTEGER PRIMARY KEY,
    tmdb_id    INTEGER NOT NULL UNIQUE,
    sitelinks  INTEGER NOT NULL,
    released   TEXT,              -- ISO 8601 (YYYY-MM-DD), prima data di P577; NULL = l'app lo tratta come non uscito
    runtime    INTEGER,           -- minuti, da P2047
    popularity REAL               -- TMDB, NULL finché la fonte resta disattivata
);

-- Feature come insiemi di QID per proprietà (P136, P57, ...), indipendenti dalla lingua.
CREATE TABLE features (
    qid      INTEGER NOT NULL REFERENCES movies(qid),
    property TEXT    NOT NULL,
    value    INTEGER NOT NULL,
    PRIMARY KEY (qid, property, value)
) WITHOUT ROWID;

-- Top-K vicini per film (TF-IDF + coseno), una riga per film invece di K: 4 volte più compatto.
-- data = K record da 6 byte, little-endian, dal più simile: uint32 qid del vicino, uint16 coseno × 65535.
-- Meno di K record se il film ha pochi vicini con similarità > 0.
CREATE TABLE neighbors (
    qid  INTEGER PRIMARY KEY REFERENCES movies(qid),
    data BLOB    NOT NULL
);
"""


def create(path: Path) -> sqlite3.Connection:
    """Crea un artefatto nuovo. Un file esistente viene sovrascritto."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.unlink(missing_ok=True)
    conn = sqlite3.connect(path)
    conn.executescript(SCHEMA)
    conn.execute("INSERT INTO meta VALUES ('schema_version', ?)", (str(SCHEMA_VERSION),))
    return conn


def connect(path: Path) -> sqlite3.Connection:
    return sqlite3.connect(path)


def set_meta(conn: sqlite3.Connection, **values: object) -> None:
    conn.executemany(
        "INSERT OR REPLACE INTO meta VALUES (?, ?)",
        [(k, str(v)) for k, v in values.items()],
    )


def insert_movies(conn: sqlite3.Connection, rows: Iterable[tuple[int, int, int]]) -> None:
    """rows: (qid, tmdb_id, sitelinks)."""
    conn.executemany("INSERT INTO movies (qid, tmdb_id, sitelinks) VALUES (?, ?, ?)", rows)
