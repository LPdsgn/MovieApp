import argparse
import logging
from pathlib import Path

from . import catalog, features


def main() -> None:
    parser = argparse.ArgumentParser(prog="moovie-pipeline")
    sub = parser.add_subparsers(dest="command", required=True)
    for name, doc in (
        ("catalog", "catalogo dei film da Wikidata"),
        ("features", "catalogo + date, durate e feature da wbgetentities"),
    ):
        cmd = sub.add_parser(name, help=doc)
        cmd.add_argument("--min-sitelinks", type=int, default=10)
        cmd.add_argument("--out", type=Path, default=Path("dist/moovie.sqlite"))
        cmd.add_argument("--cache-dir", type=Path, default=Path(".cache"))
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    logging.getLogger("httpx").setLevel(logging.WARNING)
    if args.command == "catalog":
        n = catalog.build(args.out, args.min_sitelinks, args.cache_dir)
        print(f"{n} film in {args.out}")
    elif args.command == "features":
        n = features.build(args.out, args.min_sitelinks, args.cache_dir)
        print(f"{n} feature in {args.out}")
