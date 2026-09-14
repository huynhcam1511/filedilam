from __future__ import annotations

import json
from importlib import import_module
from pathlib import Path

from file_di_lam_factory.core.models import TemplateDefinition


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def load_template_assets(definition: TemplateDefinition) -> dict[str, object]:
    package = definition.package
    return {
        "config": load_json(definition.config_path),
        "sample_data": load_json(definition.sample_data_path),
        "builder": import_module(f"{package}.builder"),
        "dashboard": import_module(f"{package}.dashboard"),
        "formulas": import_module(f"{package}.formulas"),
        "validations": import_module(f"{package}.validations"),
        "qc": import_module(f"{package}.qc"),
    }

