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
    # A chart object alone does not prove that its source responds to input.
    chart_cells = [f'{col}{row}' for col, end in [('AB',10),('AE',10),('AH',7),('AK',6),('AN',4),('AQ',7)] for row in range(3,end+1)]
    checks.append(_check('live_chart_sources', all(dashboard_ws[cell].data_type == 'f' for cell in chart_cells), 'All six chart value ranges contain formulas'))
    checks.append(_check('live_product_ranking', all(dashboard_ws[f'AP{r}'].data_type == 'f' for r in range(3,8)), 'Top product labels use live ranking formulas'))
    expected_lists = {'products': ('E','A',config['catalog_capacity']['products']), 'channels': ('G','G',config['catalog_capacity']['channels']), 'cashbook_categories': ('M','K',config['catalog_capacity']['cashbook_categories'])}
    checks.append(_check('expandable_catalog_names', all(f'shop_{name}' in wb.defined_names and f'${column}${capacity+2}' in wb.defined_names[f'shop_{name}'].attr_text and 'OFFSET(' not in wb.defined_names[f'shop_{name}'].attr_text for name, (column,_,capacity) in expected_lists.items()), 'Named ranges are simple references including reserved catalog rows'))
    end_row = config['max_input_rows'] + 3
    checks.append(_check('cash_amount_validation', any(v.type == 'whole' and f'D{end_row}' in v.sqref for v in cashbook_ws.data_validations.dataValidation), 'Cash amount validation covers column D through final row'))
    for sheet, cols in [(orders_ws, ['B','D','F','G','I']), (cashbook_ws,['B','C'])]:
        checks.append(_check(f'{sheet.title}_dropdown_coverage', all(any(v.type == 'list' and f'{col}4' in v.sqref and f'{col}{end_row}' in v.sqref and v.formula1.startswith(f"'{config['sheets']['lists']}'!$") and not v.showDropDown for v in sheet.data_validations.dataValidation) for col in cols), 'Every dropdown covers first and last input rows, uses a direct catalog range and shows its arrow'))
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

    wb.close()
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
