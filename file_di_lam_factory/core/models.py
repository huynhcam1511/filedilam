from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


@dataclass(frozen=True)
class TemplateDefinition:
    template_id: str
    name: str
    package: str
    config_path: Path
    sample_data_path: Path


@dataclass(frozen=True)
class BuildPaths:
    workbook_path: Path
    qc_path: Path
    manifest_path: Path
    file_name: str


@dataclass(frozen=True)
class BuildContext:
    template_id: str
    template_name: str
    design_system_id: str
    version: str
    build_timestamp: datetime
    output_dir: Path
    paths: BuildPaths

    @property
    def build_timestamp_iso(self) -> str:
        return self.build_timestamp.replace(microsecond=0).isoformat()

    @property
    def build_timestamp_compact(self) -> str:
        return self.build_timestamp.strftime("%Y%m%d_%H%M%S")


@dataclass(frozen=True)
class BuildArtifact:
    template_id: str
    template_name: str
    version: str
    build_timestamp: str
    workbook_path: str
    qc_path: str
    manifest_path: str
    qc_passed: bool

    def to_dict(self) -> dict[str, object]:
        return {
            "template_id": self.template_id,
            "template_name": self.template_name,
            "version": self.version,
            "build_timestamp": self.build_timestamp,
            "workbook_path": self.workbook_path,
            "qc_path": self.qc_path,
            "manifest_path": self.manifest_path,
            "qc_passed": self.qc_passed,
        }

