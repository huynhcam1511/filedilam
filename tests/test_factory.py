from __future__ import annotations

import json
import tempfile
import unittest
from datetime import datetime
from pathlib import Path

from openpyxl import load_workbook

from file_di_lam_factory.core.build import build_template
from file_di_lam_factory.core.publish import publish_artifact
from file_di_lam_factory.core.loader import load_template_assets
from file_di_lam_factory.templates.registry import TEMPLATE_REGISTRY


class FactorySmokeTest(unittest.TestCase):
    def test_build_shop_online_mini(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            artifact = build_template(
                template_id="shop_online_mini",
                output_dir=Path(tmpdir),
                build_timestamp=datetime(2026, 7, 3, 9, 0, 0),
            )

            self.assertTrue(Path(artifact.workbook_path).exists())
            self.assertTrue(Path(artifact.qc_path).exists())
            self.assertTrue(Path(artifact.manifest_path).exists())
            self.assertTrue(artifact.qc_passed)

            workbook = load_workbook(artifact.workbook_path, read_only=True)
            try:
                self.assertEqual(
                    workbook.sheetnames,
                    [
                        "0_BẮT_ĐẦU",
                        "1_ĐƠN_HÀNG",
                        "2_THU_CHI",
                        "3_THEO_DÕI_COD",
                        "4_TỔNG_QUAN",
                        "5_DANH_MỤC",
                        "6_HỆ_THỐNG",
                    ],
                )
            finally:
                workbook.close()

            with Path(artifact.qc_path).open("r", encoding="utf-8") as handle:
                qc_report = json.load(handle)
            self.assertTrue(qc_report["summary"]["passed"])

    def test_publish_shop_online_mini_to_storefront_catalog(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            (root / "index.html").write_text("<!doctype html>", encoding="utf-8")
            artifact = build_template(
                template_id="shop_online_mini",
                output_dir=root / "outputs",
                build_timestamp=datetime(2026, 7, 3, 9, 0, 0),
            )
            config = load_template_assets(TEMPLATE_REGISTRY["shop_online_mini"])["config"]
            catalog_path = publish_artifact(
                artifact=artifact, config=config, storefront_root=root
            )

            text = catalog_path.read_text(encoding="utf-8")
            self.assertIn('"id": "shop-online-mini"', text)
            self.assertIn('"price": 79000', text)
            self.assertIn('"usageGuide"', text)
            self.assertIn('"qcPassed": true', text)
            self.assertIn('./outputs/shop_online_mini/', text)

    def test_build_quan_ly_kho_mini(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            artifact = build_template(
                template_id="quan_ly_kho_mini",
                output_dir=Path(tmpdir),
                build_timestamp=datetime(2026, 8, 18, 4, 0, 0),
            )
            self.assertTrue(Path(artifact.workbook_path).exists())
            self.assertTrue(artifact.qc_passed)

            workbook = load_workbook(artifact.workbook_path, read_only=True, data_only=False)
            try:
                self.assertEqual(workbook["4_TỒN_KHO"]["F4"].value, "=C4+D4-E4")
                self.assertTrue(workbook["6_TỔNG_QUAN"]["G5"].value.startswith("=SUM("))
            finally:
                workbook.close()


if __name__ == "__main__":
    unittest.main()
