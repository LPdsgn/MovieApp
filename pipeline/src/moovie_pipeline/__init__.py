import argparse
import logging
from pathlib import Path

from . import catalog


def main() -> None:
    parser = argparse.ArgumentParser(prog="moovie-pipeline")
    sub = parser.add_subparsers(dest="command", required=True)
    cat = sub.add_parser("catalog", help="catalogo dei film da Wikidata")
    cat.add_argument("--min-sitelinks", type=int, default=10)
    cat.add_argument("--out", type=Path, default=Path("dist/moovie.sqlite"))
    cat.add_argument("--cache-dir", type=Path, default=Path(".cache"))
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    logging.getLogger("httpx").setLevel(logging.WARNING)
    if args.command == "catalog":
        n = catalog.build(args.out, args.min_sitelinks, args.cache_dir)
        print(f"{n} film in {args.out}")
