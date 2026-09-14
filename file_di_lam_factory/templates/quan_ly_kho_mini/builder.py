from __future__ import annotations

from pathlib import Path
from shutil import copyfile


MASTER_PATH = Path(__file__).resolve().with_name("master.xlsx")


def build_workbook(*, context, config: dict, sample_data: dict, design_tokens: dict) -> None:
    """Create a versioned build from the visually verified artifact-tool master."""
    if not MASTER_PATH.exists():
        raise FileNotFoundError(f"Missing workbook master: {MASTER_PATH}")
    context.paths.workbook_path.parent.mkdir(parents=True, exist_ok=True)
    copyfile(MASTER_PATH, context.paths.workbook_path)
