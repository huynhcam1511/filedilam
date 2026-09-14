from __future__ import annotations

from pathlib import Path

from file_di_lam_factory.core.models import TemplateDefinition


BASE_DIR = Path(__file__).resolve().parent


def _template_definition(template_id: str, name: str) -> TemplateDefinition:
    template_dir = BASE_DIR / template_id
    return TemplateDefinition(
        template_id=template_id,
        name=name,
        package=f"file_di_lam_factory.templates.{template_id}",
        config_path=template_dir / "config.json",
        sample_data_path=template_dir / "sample_data.json",
    )


TEMPLATE_REGISTRY = {
    "shop_online_mini": _template_definition("shop_online_mini", "Shop Online Mini"),
    "cong_no_premium": _template_definition("cong_no_premium", "Quản Lý Công Nợ Premium"),
    "quan_ly_kho_mini": _template_definition("quan_ly_kho_mini", "Quản Lý Kho Mini"),
}
