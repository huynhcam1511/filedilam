from __future__ import annotations

import json
from pathlib import Path

from file_di_lam_factory.core.models import BuildArtifact


GENERATED_CATALOG_NAME = "storefront-products.generated.js"


def _web_path(path: Path, storefront_root: Path) -> str:
    try:
        relative = path.resolve().relative_to(storefront_root.resolve())
    except ValueError as exc:
        raise ValueError(
            "File build phải nằm bên trong storefront root để localhost có thể phục vụ file."
        ) from exc
    return "./" + relative.as_posix()


def _product_from_config(
    *, artifact: BuildArtifact, config: dict, storefront_root: Path
) -> dict:
    storefront = config.get("storefront")
    if not storefront:
        raise ValueError(
            f"Template {artifact.template_id} chưa có khối 'storefront' trong config.json."
        )

    required = [
        "id",
        "categoryId",
        "name",
        "price",
        "description",
        "suitableFor",
        "delivery",
        "usageGuide",
    ]
    missing = [key for key in required if storefront.get(key) in (None, "", [])]
    if missing:
        raise ValueError("Thiếu metadata storefront: " + ", ".join(missing))

    product = dict(storefront)
    product.update(
        {
            "fileUrl": _web_path(Path(artifact.workbook_path), storefront_root),
            "version": artifact.version,
            "buildTimestamp": artifact.build_timestamp,
            "qcPassed": artifact.qc_passed,
            "type": storefront.get("type", "static_file"),
        }
    )
    return product


def _load_existing_products(catalog_path: Path) -> list[dict]:
    if not catalog_path.exists():
        return []
    text = catalog_path.read_text(encoding="utf-8")
    prefix = "window.GeneratedStorefrontProducts = "
    if not text.startswith(prefix):
        raise ValueError(f"Catalog sinh tự động không đúng định dạng: {catalog_path}")
    payload = text[len(prefix) :].strip()
    if payload.endswith(";"):
        payload = payload[:-1]
    data = json.loads(payload)
    if not isinstance(data, list):
        raise ValueError("Catalog sinh tự động phải là một JSON array.")
    return data


def publish_artifact(
    *, artifact: BuildArtifact, config: dict, storefront_root: Path
) -> Path:
    if not artifact.qc_passed:
        raise ValueError("QC chưa đạt nên pipeline không đăng sản phẩm lên web.")

    storefront_root = storefront_root.resolve()
    if not (storefront_root / "index.html").exists():
        raise ValueError(f"Không tìm thấy index.html trong storefront root: {storefront_root}")

    catalog_path = storefront_root / GENERATED_CATALOG_NAME
    product = _product_from_config(
        artifact=artifact, config=config, storefront_root=storefront_root
    )
    products = _load_existing_products(catalog_path)

    by_id = {item["id"]: item for item in products if item.get("id")}
    by_id[product["id"]] = product
    published = sorted(by_id.values(), key=lambda item: item["id"])

    payload = json.dumps(published, ensure_ascii=False, indent=2)
    catalog_path.write_text(
        "window.GeneratedStorefrontProducts = " + payload + ";\n",
        encoding="utf-8",
    )
    return catalog_path
