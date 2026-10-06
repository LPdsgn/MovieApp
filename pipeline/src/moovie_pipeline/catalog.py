"""Stadio 1: catalogo dei film con id TMDB (P4947) e abbastanza sitelink.

Una sola query SPARQL: con soglia 10 risponde in circa 30 s, metà del timeout di WDQS.
Date, durata e feature arrivano nello stadio successivo con wbgetentities, a blocchi di 50.
"""

import json
import logging
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path
from typing import NamedTuple

from . import artifact, wikidata

log = logging.getLogger(__name__)

# Una riga per coppia (film, id TMDB): i film con più P4947 si risolvono in dedup().
QUERY = """
SELECT ?film ?tmdb ?sitelinks WHERE {{
  ?film wdt:P4947 ?tmdb ;
        wikibase:sitelinks ?sitelinks .
  FILTER(?sitelinks >= {min_sitelinks})
}}
"""


class Row(NamedTuple):
    qid: int
    tmdb_id: int
    sitelinks: int


def parse(bindings: list[dict[str, str]]) -> list[Row]:
    rows = []
    for b in bindings:
        if not b["tmdb"].isdigit():  # qualche P4947 sporco con lettere o spazi
            continue
        rows.append(Row(int(b["film"].rsplit("/Q", 1)[1]), int(b["tmdb"]), int(b["sitelinks"])))
    return rows


def dedup(rows: list[Row]) -> list[Row]:
    """Un film per QID e un QID per id TMDB.

    - più id TMDB per film: il più piccolo;
    - più film per id TMDB: quello con più sitelink, poi il QID più piccolo.
    """
    by_qid: dict[int, list[Row]] = defaultdict(list)
    for r in rows:
        by_qid[r.qid].append(r)
    films = [Row(qid, min(r.tmdb_id for r in g), g[0].sitelinks) for qid, g in by_qid.items()]
    by_tmdb: dict[int, Row] = {}
    for f in sorted(films, key=lambda r: (-r.sitelinks, r.qid)):
        by_tmdb.setdefault(f.tmdb_id, f)
    return sorted(by_tmdb.values())


def fetch(min_sitelinks: int, cache_dir: Path) -> list[Row]:
    """Scarica il catalogo, con cache su disco così gli stadi successivi non ripetono la query."""
    cached = cache_dir / f"catalog-s{min_sitelinks}.json"
    if cached.exists():
        return [Row(*r) for r in json.loads(cached.read_text())]
    rows = dedup(parse(wikidata.sparql(QUERY.format(min_sitelinks=min_sitelinks))))
    cache_dir.mkdir(parents=True, exist_ok=True)
    cached.write_text(json.dumps(rows))
    return rows


def build(out: Path, min_sitelinks: int, cache_dir: Path) -> int:
    """Scarica il catalogo e scrive l'artefatto. Restituisce il numero di film."""
    films = fetch(min_sitelinks, cache_dir)
    now = datetime.now(UTC)
    conn = artifact.create(out)
    with conn:
        artifact.insert_movies(conn, films)
        artifact.set_meta(
            conn,
            data_version=now.strftime("%Y%m%d"),
            generated_at=now.isoformat(timespec="seconds"),
            min_sitelinks=min_sitelinks,
        )
    conn.close()
    return len(films)
