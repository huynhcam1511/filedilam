from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

from file_di_lam_factory.core.build import build_template, run_template_qc
from file_di_lam_factory.core.loader import load_template_assets
from file_di_lam_factory.core.publish import publish_artifact
from file_di_lam_factory.templates.registry import TEMPLATE_REGISTRY


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="File Di Lam workbook factory")
    subparsers = parser.add_subparsers(dest="command", required=True)

    list_parser = subparsers.add_parser("list", help="List registered templates")
    list_parser.set_defaults(command="list")

    build_parser_ = subparsers.add_parser("build", help="Build a template")
    build_parser_.add_argument("template_id", choices=sorted(TEMPLATE_REGISTRY))
    build_parser_.add_argument("--output-dir", default="outputs")
    build_parser_.add_argument("--version")
    build_parser_.add_argument("--timestamp", help="ISO timestamp, e.g. 2026-07-03T09:00:00")
    build_parser_.add_argument(
        "--publish",
        action="store_true",
        help="After QC passes, add/update this product in the local storefront catalog",
    )
    build_parser_.add_argument(
        "--storefront-root",
        default=".",
        help="Folder containing index.html (default: current folder)",
    )

    qc_parser = subparsers.add_parser("qc", help="Run QC against an exported workbook")
    qc_parser.add_argument("template_id", choices=sorted(TEMPLATE_REGISTRY))
    qc_parser.add_argument("workbook_path")
    qc_parser.add_argument("--report-path")

    return parser


def parse_timestamp(raw: str | None) -> datetime | None:
    if not raw:
        return None
    return datetime.fromisoformat(raw)


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "list":
        for template_id, definition in sorted(TEMPLATE_REGISTRY.items()):
            print(f"{template_id}: {definition.name}")
        return 0

    if args.command == "build":
        artifact = build_template(
            template_id=args.template_id,
            output_dir=Path(args.output_dir),
            version_override=args.version,
            build_timestamp=parse_timestamp(args.timestamp),
        )
        result = artifact.to_dict()
        if args.publish:
            definition = TEMPLATE_REGISTRY[args.template_id]
            config = load_template_assets(definition)["config"]
            catalog_path = publish_artifact(
                artifact=artifact,
                config=config,
                storefront_root=Path(args.storefront_root),
            )
            result["storefront_catalog_path"] = str(catalog_path)
            result["published"] = True
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0

    if args.command == "qc":
        report = run_template_qc(
            template_id=args.template_id,
            workbook_path=Path(args.workbook_path),
            report_path=Path(args.report_path) if args.report_path else None,
        )
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 0

    parser.error("Unsupported command")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
