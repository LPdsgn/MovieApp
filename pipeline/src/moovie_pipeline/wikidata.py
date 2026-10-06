"""Client minimo per il Wikidata Query Service, con retry e User-Agent da ambiente."""

import logging
import os
import time
from typing import Any

import httpx

ENDPOINT = "https://query.wikidata.org/sparql"
USER_AGENT_VAR = "MOOVIE_USER_AGENT"
MAX_RETRIES = 8
TIMEOUT = 65  # WDQS taglia a 60 s: aspettiamo la sua risposta, non la nostra.

log = logging.getLogger(__name__)


def user_agent() -> str:
    ua = os.environ.get(USER_AGENT_VAR)
    if not ua:
        raise SystemExit(
            f"Imposta {USER_AGENT_VAR}, per esempio "
            f'{USER_AGENT_VAR}="MoovieFinderPipeline/0.1 (https://github.com/...; email)"'
        )
    return ua


def retry_delay(response: httpx.Response | None, attempt: int) -> float:
    """Secondi da attendere: Retry-After se c'è, altrimenti backoff esponenziale fino a 120 s."""
    if response is not None:
        header = response.headers.get("Retry-After")
        if header and header.isdigit():
            return float(header)
    return float(min(2**attempt, 120))


def sparql(query: str, client: httpx.Client | None = None) -> list[dict[str, Any]]:
    """Esegue una query e restituisce i binding come lista di dict {var: valore}."""
    own = client is None
    client = client or httpx.Client(headers={"User-Agent": user_agent()}, timeout=TIMEOUT)
    try:
        for attempt in range(MAX_RETRIES):
            response = None
            try:
                response = client.get(
                    ENDPOINT,
                    params={"query": query, "format": "json"},
                )
                if response.status_code == 200:
                    bindings = response.json()["results"]["bindings"]
                    return [{k: v["value"] for k, v in b.items()} for b in bindings]
                if response.status_code not in (429, 500, 502, 503, 504):
                    response.raise_for_status()
            except httpx.TransportError as exc:
                log.warning("errore di rete: %s", exc)
            delay = retry_delay(response, attempt)
            log.warning(
                "WDQS %s, riprovo tra %.0f s (%d/%d)",
                response.status_code if response is not None else "timeout",
                delay,
                attempt + 1,
                MAX_RETRIES,
            )
            time.sleep(delay)
        raise RuntimeError(f"WDQS: rinuncio dopo {MAX_RETRIES} tentativi")
    finally:
        if own:
            client.close()
