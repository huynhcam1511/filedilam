from datetime import datetime
from pathlib import Path
import tempfile
import unittest
import zipfile
import xml.etree.ElementTree as ET

from openpyxl import load_workbook
from file_di_lam_factory.core.build import build_template
from file_di_lam_factory.templates.shop_online_mini import qc
from file_di_lam_factory.core.loader import load_template_assets
from file_di_lam_factory.templates.registry import TEMPLATE_REGISTRY


class ShopOnlineDashboardTest(unittest.TestCase):
    def test_live_sources_catalog_capacity_and_cached_totals(self):
        with tempfile.TemporaryDirectory() as folder:
            result = build_template('shop_online_mini', Path(folder), build_timestamp=datetime(2026,9,17))
            self.assertTrue(result.qc_passed)
            wb = load_workbook(result.workbook_path)
            cached = load_workbook(result.workbook_path, data_only=True)
            try:
                dashboard = wb['4_TỔNG_QUAN']
                values = cached['4_TỔNG_QUAN']
                self.assertEqual(sum(values[f'AB{r}'].value for r in range(3,11)), values['F7'].value)
                self.assertEqual(sum(values[f'AE{r}'].value for r in range(3,11)), 14)
                self.assertEqual(sum(values[f'AH{r}'].value for r in range(3,8)), 14)
                self.assertEqual(values['AP3'].value, 'SP06 - Khóa học Canva cơ bản')
                self.assertEqual(values['AQ3'].value, 1497000)
                self.assertIn('$A$4:$A$203', dashboard['B7'].value)
                expected_sources = {
                    'B4:B203': "'5_DANH_MỤC'!$G$3:$G$62",
                    'D4:D203': "'5_DANH_MỤC'!$E$3:$E$502",
                }
                for rule in wb['1_ĐƠN_HÀNG'].data_validations.dataValidation:
                    if str(rule.sqref) in expected_sources:
                        self.assertEqual(rule.formula1, expected_sources[str(rule.sqref)])
                        self.assertFalse(rule.showDropDown)
                cash_category_rule = next(v for v in wb['2_THU_CHI'].data_validations.dataValidation if str(v.sqref)=='C4:C203')
                self.assertEqual(cash_category_rule.formula1, "'5_DANH_MỤC'!$M$3:$M$152")
                self.assertTrue(all('OFFSET(' not in name.attr_text for name in wb.defined_names.values()))
                self.assertEqual(cached['5_DANH_MỤC']['D62'].value, 'SP60')
                for cell in ['D502','E502','L152','M152']:
                    self.assertEqual(wb['5_DANH_MỤC'][cell].data_type, 'f')
                for cell in ['A502','G62','J152','K152']:
                    self.assertFalse(wb['5_DANH_MỤC'][cell].protection.locked)
                with zipfile.ZipFile(result.workbook_path) as package:
                    for number in range(1,7):
                        chart = ET.fromstring(package.read(f'xl/charts/chart{number}.xml'))
                        visible = chart.find('.//{http://schemas.openxmlformats.org/drawingml/2006/chart}plotVisOnly')
                        self.assertTrue(visible is None or visible.get('val') == '0')
                # Reject the regression that originally passed chart-count-only QC.
                dashboard['AB3'] = 123
                class Context:
                    version = '1.4.0'
                    build_timestamp_iso = '2026-09-17T00:00:00'
                    template_id = 'shop_online_mini'
                assets = load_template_assets(TEMPLATE_REGISTRY['shop_online_mini'])
                bad_path = Path(folder) / 'broken.xlsx'
                wb.save(bad_path)
                report = qc.run_qc(context=Context(), config=assets['config'], sample_data=assets['sample_data'], workbook_path=bad_path)
                self.assertFalse(next(c['passed'] for c in report['checks'] if c['name']=='live_chart_sources'))
            finally:
                wb.close()
                cached.close()


if __name__ == '__main__':
    unittest.main()
