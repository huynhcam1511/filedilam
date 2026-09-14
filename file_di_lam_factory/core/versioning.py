from __future__ import annotations

from datetime import datetime
from pathlib import Path

from file_di_lam_factory.core.models import BuildPaths


def sanitize_version(version: str) -> str:
    return version.replace(".", "_").replace(" ", "_")


def ensure_unique_path(path: Path) -> Path:
    if not path.exists():
        return path
    stem = path.stem
    suffix = path.suffix
    counter = 1
    while True:
        candidate = path.with_name(f"{stem}__{counter:02d}{suffix}")
        if not candidate.exists():
            return candidate
        counter += 1


def build_output_paths(
    output_dir: Path,
    file_stem: str,
    version: str,
    build_timestamp: datetime,
) -> BuildPaths:
    output_dir.mkdir(parents=True, exist_ok=True)
    timestamp = build_timestamp.strftime("%Y%m%d_%H%M%S")
    file_name_base = f"{file_stem}__v{sanitize_version(version)}__{timestamp}"

    workbook_path = ensure_unique_path(output_dir / f"{file_name_base}.xlsx")
    effective_base = workbook_path.stem
    qc_path = output_dir / f"{effective_base}.qc.json"
    manifest_path = output_dir / f"{effective_base}.manifest.json"

    return BuildPaths(
        workbook_path=workbook_path,
        qc_path=qc_path,
        manifest_path=manifest_path,
        file_name=workbook_path.name,
    )

