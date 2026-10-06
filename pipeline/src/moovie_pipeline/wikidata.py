"""Client minimo per Wikidata (WDQS e API), con retry e User-Agent da ambiente."""

import logging
import os
import time
from typing import Any

import httpx

SPARQL_ENDPOINT = "https://query.wikidata.org/sparql"
API_ENDPOINT = "https://www.wikidata.org/w/api.php"
USER_AGENT_VAR = "MOOVIE_USER_AGENT"
MAX_RETRIES = 8
TIMEOUT = 65  # WDQS taglia a 60 s: aspettiamo la sua risposta, non la nostra.
RETRY_STATUS = (429, 500, 502, 503, 504)

log = logging.getLogger(__name__)


def user_agent() -> str:
    ua = os.environ.get(USER_AGENT_VAR)
    if not ua:
        raise SystemExit(
            f"Imposta {USER_AGENT_VAR}, per esempio "
            f'{USER_AGENT_VAR}="MoovieFinderPipeline/0.1 (https://github.com/...; email)"'
        )
    return ua


def client() -> httpx.Client:
    return httpx.Client(headers={"User-Agent": user_agent()}, timeout=TIMEOUT)


def retry_delay(response: httpx.Response | None, attempt: int) -> float:
    """Secondi da attendere: Retry-After se c'è, altrimenti backoff esponenziale fino a 120 s."""
    if response is not None:
        header = response.headers.get("Retry-After")
        if header and header.isdigit():
            return float(header)
    return float(min(2**attempt, 120))


def get_json(url: str, params: dict[str, str], http: httpx.Client | None = None) -> Any:
    """GET con retry su 429, 5xx ed errori di rete."""
    own = http is None
    http = http or client()
    try:
        for attempt in range(MAX_RETRIES):
            response = None
            reason = "errore di rete"
            try:
                response = http.get(url, params=params)
                if response.status_code == 200:
                    return response.json()
                if response.status_code in RETRY_STATUS:
                    reason = f"HTTP {response.status_code}"
                else:
                    response.raise_for_status()
            except httpx.TransportError as exc:
                reason = f"errore di rete: {exc}"
            delay = retry_delay(response, attempt)
            log.warning("%s, riprovo tra %.0f s (%d/%d)", reason, delay, attempt + 1, MAX_RETRIES)
            time.sleep(delay)
        raise RuntimeError(f"Wikidata: rinuncio dopo {MAX_RETRIES} tentativi")
    finally:
        if own:
            http.close()


def sparql(query: str, http: httpx.Client | None = None) -> list[dict[str, str]]:
    """Esegue una query e restituisce i binding come lista di dict {var: valore}."""
    data = get_json(SPARQL_ENDPOINT, {"query": query, "format": "json"}, http)
    return [{k: v["value"] for k, v in b.items()} for b in data["results"]["bindings"]]


def entities(qids: list[int], http: httpx.Client | None = None) -> dict[str, Any]:
    """wbgetentities per al massimo 50 QID: restituisce {"Q123": entity}. Le entità mancanti non ci sono."""
    assert len(qids) <= 50
    data = get_json(
        API_ENDPOINT,
        {
            "action": "wbgetentities",
            "ids": "|".join(f"Q{q}" for q in qids),
            "props": "claims",
            "format": "json",
            # niente maxlag: serve ai bot che scrivono, e Wikibase ci somma il lag di WDQS
        },
        http,
    )
    found = {k: v for k, v in data.get("entities", {}).items() if "missing" not in v}
    # Un QID unito a un altro torna sotto la chiave di destinazione: lo rimettiamo sotto l'originale.
    for entity in list(found.values()):
        if "redirects" in entity:
            found[entity["redirects"]["from"]] = entity
    return found
