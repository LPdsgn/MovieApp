"""Stadio 2: data di uscita, durata e feature per film, da wbgetentities a blocchi di 50."""

import json
import logging
from pathlib import Path
from typing import Any, NamedTuple

from . import artifact, catalog, wikidata

log = logging.getLogger(__name__)

# Proprietà con valore item: diventano insiemi di QID nella tabella features.
FEATURE_PROPS = (
    "P136",  # genere
    "P57",  # regista
    "P161",  # cast
    "P58",  # sceneggiatore
    "P272",  # casa di produzione
    "P179",  # serie
    "P144",  # basato su
    "P921",  # soggetto
    "P495",  # paese
    "P364",  # lingua originale
    "P86",  # compositore
    "P344",  # fotografia
)
RELEASED = "P577"
# "Film pornografico" (Q185529) e le sue sottoclassi su Wikidata (wdt:P279*), al 08/10/2026: 18 generi,
# 47 film nel catalogo. Il genere "film erotico" (Q599558, 218 film) resta fuori: non è pornografia.
# Il flag TMDB `adult` non entra qui per la regola "TMDB solo per la UI" (CLAUDE.md).
ADULT_GENRES = frozenset(
    {
        185529,
        931552,
        3318957,
        4373044,
        10505214,
        16254232,
        20649407,
        20965835,
        62015757,
        85877822,
        97016664,
        123851043,
        125719481,
        128145358,
        128150456,
        140380310,
        141410241,
        141533770,
    }
)
RUNTIME = "P2047"
MINUTES_PER_UNIT = {
    "http://www.wikidata.org/entity/Q7727": 1.0,  # minuto
    "http://www.wikidata.org/entity/Q25235": 60.0,  # ora
    "http://www.wikidata.org/entity/Q11574": 1 / 60,  # secondo
    "1": 1.0,  # senza unità: assumiamo minuti
}
BLOCK = 50


class Entity(NamedTuple):
    qid: int
    released: str | None
    runtime: int | None
    features: dict[str, list[int]]


def truthy(statements: list[dict[str, Any]]) -> list[Any]:
    """Valori con la semantica di wdt: i preferred se ci sono, altrimenti i normal. Mai i deprecated."""
    values: dict[str, list[Any]] = {"preferred": [], "normal": []}
    for s in statements:
        if s["rank"] in values and "datavalue" in s["mainsnak"]:
            values[s["rank"]].append(s["mainsnak"]["datavalue"]["value"])
    return values["preferred"] or values["normal"]


def iso_date(value: dict[str, Any]) -> str | None:
    """'+1999-00-00T00:00:00Z' (precisione anno) -> '1999-01-01'. Date avanti Cristo scartate."""
    time = value["time"]
    if not time.startswith("+") or value["precision"] < 9:
        return None
    year, month, day = time[1:11].split("-")
    return f"{year}-{month if month != '00' else '01'}-{day if day != '00' else '01'}"


def minutes(value: dict[str, Any]) -> int | None:
    factor = MINUTES_PER_UNIT.get(value["unit"])
    if factor is None:
        return None
    return round(float(value["amount"]) * factor)


def parse(qid: int, entity: dict[str, Any]) -> Entity:
    claims = entity.get("claims", {})
    dates = [d for d in map(iso_date, truthy(claims.get(RELEASED, []))) if d]
    runtimes = [m for m in map(minutes, truthy(claims.get(RUNTIME, []))) if m]
    features = {
        p: sorted({v["numeric-id"] for v in truthy(claims.get(p, [])) if "numeric-id" in v})
        for p in FEATURE_PROPS
    }
    return Entity(
        qid,
        min(dates) if dates else None,
        runtimes[0] if runtimes else None,
        {p: ids for p, ids in features.items() if ids},
    )


def is_adult(entity: Entity) -> bool:
    return any(g in ADULT_GENRES for g in entity.features.get("P136", []))


def fetch(qids: list[int], cache_dir: Path) -> list[Entity]:
    """Scarica le entità mancanti dalla cache JSONL e la aggiorna blocco per blocco."""
    cache_dir.mkdir(parents=True, exist_ok=True)
    cached = cache_dir / "entities.jsonl"
    have: dict[int, Entity] = {}
    if cached.exists():
        for line in cached.read_text().splitlines():
            e = Entity(**json.loads(line))
            have[e.qid] = e
    todo = [q for q in qids if q not in have]
    log.info("entità: %d in cache, %d da scaricare", len(have), len(todo))
    with cached.open("a") as f, wikidata.client() as http:
        for i in range(0, len(todo), BLOCK):
            block = todo[i : i + BLOCK]
            raw = wikidata.entities(block, http)
            for qid in block:
                entity = raw.get(f"Q{qid}")
                if entity is None:
                    log.warning("Q%d mancante su Wikidata", qid)
                    continue
                e = parse(qid, entity)
                have[qid] = e
                f.write(json.dumps(e._asdict()) + "\n")
            if (i // BLOCK) % 20 == 0:
                log.info("entità: %d/%d", i + len(block), len(todo))
    return [have[q] for q in qids if q in have]


def build(out: Path, min_sitelinks: int, cache_dir: Path) -> int:
    """Catalogo + entità: scrive movies completo e features. Restituisce il numero di feature."""
    catalog.build(out, min_sitelinks, cache_dir)
    films = catalog.fetch(min_sitelinks, cache_dir)
    ents = fetch([f.qid for f in films], cache_dir)
    conn = artifact.connect(out)
    with conn:
        conn.executemany(
            "UPDATE movies SET released = ?, runtime = ?, adult = ? WHERE qid = ?",
            [(e.released, e.runtime, int(is_adult(e)), e.qid) for e in ents],
        )
        rows = [(e.qid, p, v) for e in ents for p, ids in e.features.items() for v in ids]
        conn.executemany("INSERT INTO features VALUES (?, ?, ?)", rows)
    conn.close()
    return len(rows)
