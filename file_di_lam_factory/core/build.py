from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from file_di_lam_factory.core.design_system import load_design_system_tokens
from file_di_lam_factory.core.loader import load_template_assets
from file_di_lam_factory.core.models import BuildArtifact, BuildContext
from file_di_lam_factory.core.versioning import build_output_paths
from file_di_lam_factory.templates.registry import TEMPLATE_REGISTRY


def _make_context(template_id: str, output_dir: Path, version_override: str | None, build_timestamp: datetime | None) -> tuple[BuildContext, dict[str, object]]:
    definition = TEMPLATE_REGISTRY[template_id]
    assets = load_template_assets(definition)
    config = assets["config"]
    timestamp = build_timestamp or datetime.now()
    version = version_override or config["version"]
    template_output_dir = output_dir / template_id
    paths = build_output_paths(template_output_dir, config["file_stem"], version, timestamp)

    context = BuildContext(
        template_id=template_id,
        template_name=config["template_name"],
        design_system_id=config["design_system"],
        version=version,
        build_timestamp=timestamp,
        output_dir=template_output_dir,
        paths=paths,
    )
    return context, assets


def build_template(
    template_id: str,
    output_dir: Path,
    version_override: str | None = None,
    build_timestamp: datetime | None = None,
) -> BuildArtifact:
    context, assets = _make_context(template_id, output_dir, version_override, build_timestamp)
    config = assets["config"]
    design_tokens = load_design_system_tokens(context.design_system_id)

    builder = assets["builder"]
    builder.build_workbook(context=context, config=config, sample_data=assets["sample_data"], design_tokens=design_tokens)

    qc_report = assets["qc"].run_qc(context=context, config=config, sample_data=assets["sample_data"], workbook_path=context.paths.workbook_path)
    with context.paths.qc_path.open("w", encoding="utf-8") as handle:
        json.dump(qc_report, handle, ensure_ascii=False, indent=2)

    manifest = {
        "template_id": context.template_id,
        "template_name": context.template_name,
        "design_system_id": context.design_system_id,
        "version": context.version,
        "build_timestamp": context.build_timestamp_iso,
        "workbook_path": str(context.paths.workbook_path),
        "qc_path": str(context.paths.qc_path),
        "qc_passed": qc_report["summary"]["passed"],
    }
    with context.paths.manifest_path.open("w", encoding="utf-8") as handle:
        json.dump(manifest, handle, ensure_ascii=False, indent=2)

    return BuildArtifact(
        template_id=context.template_id,
        template_name=context.template_name,
        version=context.version,
        build_timestamp=context.build_timestamp_iso,
        workbook_path=str(context.paths.workbook_path),
        qc_path=str(context.paths.qc_path),
        manifest_path=str(context.paths.manifest_path),
        qc_passed=qc_report["summary"]["passed"],
    )


def run_template_qc(template_id: str, workbook_path: Path, report_path: Path | None = None) -> dict:
    definition = TEMPLATE_REGISTRY[template_id]
    assets = load_template_assets(definition)
    config = assets["config"]
    context = BuildContext(
        template_id=template_id,
        template_name=config["template_name"],
        design_system_id=config["design_system"],
        version=config["version"],
        build_timestamp=datetime.now(),
        output_dir=workbook_path.parent,
        paths=build_output_paths(workbook_path.parent, workbook_path.stem, config["version"], datetime.now()),
    )
    report = assets["qc"].run_qc(
        context=context,
        config=config,
        sample_data=assets["sample_data"],
        workbook_path=workbook_path,
    )
    if report_path:
        with report_path.open("w", encoding="utf-8") as handle:
            json.dump(report, handle, ensure_ascii=False, indent=2)
    return report

