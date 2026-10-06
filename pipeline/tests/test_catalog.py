import sqlite3

import httpx

from moovie_pipeline import artifact, wikidata
from moovie_pipeline.catalog import Row, dedup, parse

WD = "http://www.wikidata.org/entity/Q"


def test_parse_skips_malformed_tmdb_ids():
    rows = parse(
        [
            {"film": f"{WD}1", "tmdb": "11", "sitelinks": "50"},
            {"film": f"{WD}2", "tmdb": "tt123", "sitelinks": "50"},
        ]
    )
    assert rows == [Row(1, 11, 50)]


def test_dedup_rules():
    rows = [
        Row(1, 11, 50),  # stesso film, due id TMDB: vince il più piccolo
        Row(1, 10, 50),
        Row(2, 99, 30),  # due QID per lo stesso id TMDB: vince più sitelink
        Row(3, 99, 40),
        Row(4, 77, 40),  # parità di sitelink: vince il QID più piccolo
        Row(5, 77, 40),
    ]
    assert dedup(rows) == [Row(1, 10, 50), Row(3, 99, 40), Row(4, 77, 40)]


def test_artifact_roundtrip(tmp_path):
    conn = artifact.create(tmp_path / "a.sqlite")
    with conn:
        artifact.insert_movies(conn, [Row(1, 10, 50)])
        artifact.set_meta(conn, data_version="20261006")
    meta = dict(conn.execute("SELECT key, value FROM meta"))
    assert meta == {"schema_version": "1", "data_version": "20261006"}
    assert conn.execute("SELECT qid, tmdb_id, released FROM movies").fetchall() == [(1, 10, None)]
    conn.close()


def test_schema_has_unique_tmdb_id():
    conn = sqlite3.connect(":memory:")
    conn.executescript(artifact.SCHEMA)
    conn.execute("INSERT INTO movies (qid, tmdb_id, sitelinks) VALUES (1, 10, 5)")
    try:
        conn.execute("INSERT INTO movies (qid, tmdb_id, sitelinks) VALUES (2, 10, 5)")
    except sqlite3.IntegrityError:
        return
    raise AssertionError("tmdb_id duplicato accettato")


def test_retry_delay_prefers_retry_after():
    resp = httpx.Response(429, headers={"Retry-After": "60"})
    assert wikidata.retry_delay(resp, attempt=0) == 60
    assert wikidata.retry_delay(None, attempt=3) == 8
    assert wikidata.retry_delay(None, attempt=20) == 120


def test_entities_keys_redirects_by_original_qid():
    payload = {
        "entities": {
            "Q2": {"id": "Q2", "redirects": {"from": "Q1", "to": "Q2"}, "claims": {}},
            "Q3": {"id": "Q3", "missing": ""},
        }
    }
    http = httpx.Client(
        transport=httpx.MockTransport(lambda req: httpx.Response(200, json=payload))
    )
    found = wikidata.entities([1, 3], http)
    assert set(found) == {"Q1", "Q2"}
