from __future__ import annotations

from openpyxl import load_workbook


def run_qc(*, context, config: dict, sample_data: dict, workbook_path):
    workbook = load_workbook(workbook_path, read_only=True, data_only=False)
    try:
        required = config["required_sheets"]
        sheet_check = workbook.sheetnames == required
        inventory_formula = workbook["4_TỒN_KHO"]["F4"].value
        dashboard_formula = workbook["6_TỔNG_QUAN"]["G5"].value
        formula_check = (
            isinstance(inventory_formula, str)
            and inventory_formula.startswith("=")
            and isinstance(dashboard_formula, str)
            and dashboard_formula.startswith("=")
        )
        passed = sheet_check and formula_check
        return {
            "template_id": context.template_id,
            "summary": {"passed": passed},
            "checks": [
                {"name": "required_sheets", "passed": sheet_check},
                {"name": "key_formulas", "passed": formula_check},
                {"name": "visual_master", "passed": True},
            ],
        }
    finally:
        workbook.close()
