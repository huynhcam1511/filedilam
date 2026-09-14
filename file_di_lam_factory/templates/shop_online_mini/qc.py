from __future__ import annotations

from openpyxl import load_workbook


def _check(name: str, passed: bool, detail: str) -> dict[str, object]:
    return {"name": name, "passed": passed, "detail": detail}


def run_qc(*, context, config: dict, sample_data: dict, workbook_path) -> dict:
    wb = load_workbook(workbook_path, read_only=False, data_only=False)
    checks: list[dict[str, object]] = []

    expected_sheets = list(config["sheets"].values())
    checks.append(
        _check(
            "expected_sheets",
            wb.sheetnames == expected_sheets,
            f"Actual sheets: {wb.sheetnames}",
        )
    )

    metadata_ws = wb[config["sheets"]["metadata"]]
    checks.append(
        _check(
            "metadata_version",
            metadata_ws["B7"].value == context.version,
            f"Metadata version: {metadata_ws['B7'].value}",
        )
    )
    checks.append(
        _check(
            "metadata_timestamp",
            metadata_ws["B8"].value == context.build_timestamp_iso,
            f"Metadata timestamp: {metadata_ws['B8'].value}",
        )
    )

    orders_ws = wb[config["sheets"]["orders"]]
    cashbook_ws = wb[config["sheets"]["cashbook"]]
    cod_ws = wb[config["sheets"]["cod"]]
    dashboard_ws = wb[config["sheets"]["dashboard"]]
    lists_ws = wb[config["sheets"]["lists"]]

    checks.append(
        _check(
            "sample_orders_present",
            orders_ws["C4"].value == sample_data["orders"][0]["customer_name"],
            f"First order customer C4: {orders_ws['C4'].value}",
        )
    )
    checks.append(
        _check(
            "sample_cashbook_present",
            cashbook_ws["C4"].value == sample_data["cashbook"][0]["category"],
            f"First cashbook category C4: {cashbook_ws['C4'].value}",
        )
    )
    checks.append(
        _check(
            "order_formula_column",
            isinstance(orders_ws["K4"].value, str) and orders_ws["K4"].value.startswith("="),
            f"Orders K4 formula: {orders_ws['K4'].value}",
        )
    )
    checks.append(
        _check(
            "cashbook_formula_column",
            isinstance(cashbook_ws["G4"].value, str) and cashbook_ws["G4"].value.startswith("="),
            f"Cashbook G4 formula: {cashbook_ws['G4'].value}",
        )
    )
    checks.append(
        _check(
            "cod_formula_column",
            isinstance(cod_ws["G4"].value, str) and cod_ws["G4"].value.startswith("="),
            f"COD G4 formula: {cod_ws['G4'].value}",
        )
    )
    setup_ws = wb[config["sheets"]["guide"]]
    checks.append(
        _check(
            "setup_shop_name_present",
            setup_ws["B4"].value == sample_data["shop_profile"]["shop_name"],
            f"Setup B4: {setup_ws['B4'].value}",
        )
    )
    checks.append(
        _check(
            "dashboard_charts",
            len(getattr(dashboard_ws, "_charts", [])) >= 6,
            f"Dashboard charts: {len(getattr(dashboard_ws, '_charts', []))}",
        )
    )
    checks.append(
        _check(
            "lists_sheet_visible",
            lists_ws.sheet_state == "visible",
            f"Lists sheet state: {lists_ws.sheet_state}",
        )
    )
    checks.append(
        _check(
            "metadata_sheet_hidden",
            metadata_ws.sheet_state == "hidden",
            f"Metadata sheet state: {metadata_ws.sheet_state}",
        )
    )
    checks.append(
        _check(
            "filename_version_timestamp",
            f"__v{context.version.replace('.', '_')}__" in workbook_path.name,
            f"Workbook file: {workbook_path.name}",
        )
    )

    all_passed = all(item["passed"] for item in checks)
    return {
        "template_id": context.template_id,
        "workbook_path": str(workbook_path),
        "summary": {
            "passed": all_passed,
            "total_checks": len(checks),
            "passed_checks": sum(1 for item in checks if item["passed"]),
        },
        "checks": checks,
    }
