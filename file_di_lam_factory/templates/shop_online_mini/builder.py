from __future__ import annotations

from datetime import datetime
from pathlib import Path

import xlsxwriter

from file_di_lam_factory.core.design_system import create_format_catalog
from file_di_lam_factory.core.workbook import apply_row_defaults, configure_sheet, get_format_key, protect_sheet, write_banner, write_cell, write_table_headers
from file_di_lam_factory.templates.shop_online_mini.dashboard import write_dashboard
from file_di_lam_factory.templates.shop_online_mini.formulas import (
    build_dashboard_cache,
    build_sample_metrics,
    cashbook_formula_payload,
    cod_formula_payload,
    order_formula_payload,
)
from file_di_lam_factory.templates.shop_online_mini.validations import apply_validations


def _parse_date(raw: str) -> datetime:
    return datetime.fromisoformat(raw)


def _tabs(design_tokens: dict) -> dict[str, str]:
    return design_tokens["sheet_tabs"]


def _apply_order_conditional_formatting(workbook, worksheet, design_tokens: dict, max_input_rows: int, sample_data: dict) -> None:
    colors = design_tokens["colors"]
    end_row = max_input_rows + 3

    for platform in sample_data["platforms"]:
        worksheet.conditional_format(
            f"B4:B{end_row}",
            {
                "type": "text",
                "criteria": "containing",
                "value": platform["name"],
                "format": workbook.add_format(
                    {
                        "bold": True,
                        "align": "center",
                        "valign": "vcenter",
                        "font_color": platform["chip_font"],
                        "bg_color": platform["chip_bg"],
                        "border": 1,
                        "border_color": platform["chip_bg"],
                    }
                ),
            },
        )

    status_rules = [
        ("Mới", colors["brand_lavender_soft"], colors["text"]),
        ("Đang giao", colors["accent"], colors["text"]),
        ("Hoàn thành", colors["success"], colors["white"]),
        ("Hoàn", colors["brand_mist_soft"], colors["muted_text"]),
        ("Hủy", colors["danger"], colors["white"]),
    ]
    for value, bg_color, font_color in status_rules:
        worksheet.conditional_format(
            f"I4:I{end_row}",
            {
                "type": "text",
                "criteria": "containing",
                "value": value,
                "format": workbook.add_format(
                    {
                        "bold": True,
                        "align": "center",
                        "valign": "vcenter",
                        "font_color": font_color,
                        "bg_color": bg_color,
                        "border": 1,
                        "border_color": bg_color,
                    }
                ),
            },
        )

    cod_rules = [
        ("Đã nhận COD", colors["success"], colors["white"]),
        ("COD quá hạn", colors["danger"], colors["white"]),
        ("COD chờ về", colors["accent"], colors["text"]),
        ("Không áp dụng", colors["brand_mist_soft"], colors["muted_text"]),
        ("Giao thất bại", colors["brand_lavender_soft"], colors["text"]),
    ]
    for value, bg_color, font_color in cod_rules:
        worksheet.conditional_format(
            f"M4:M{end_row}",
            {
                "type": "text",
                "criteria": "containing",
                "value": value,
                "format": workbook.add_format(
                    {
                        "bold": True,
                        "align": "center",
                        "valign": "vcenter",
                        "font_color": font_color,
                        "bg_color": bg_color,
                        "border": 1,
                        "border_color": bg_color,
                    }
                ),
            },
        )

    worksheet.conditional_format(
        f"A4:M{end_row}",
        {
            "type": "formula",
            "criteria": '=$M4="COD quá hạn"',
            "format": workbook.add_format({"bg_color": colors["brand_rose_soft"]}),
        },
    )


def _apply_cashbook_conditional_formatting(workbook, worksheet, design_tokens: dict, max_input_rows: int) -> None:
    colors = design_tokens["colors"]
    end_row = max_input_rows + 3
    worksheet.conditional_format(
        f"B4:B{end_row}",
        {
            "type": "text",
            "criteria": "containing",
            "value": "Thu",
            "format": workbook.add_format(
                {
                    "bold": True,
                    "align": "center",
                    "bg_color": colors["success"],
                    "font_color": colors["white"],
                    "border": 1,
                    "border_color": colors["success"],
                }
            ),
        },
    )
    worksheet.conditional_format(
        f"B4:B{end_row}",
        {
            "type": "text",
            "criteria": "containing",
            "value": "Chi",
            "format": workbook.add_format(
                {
                    "bold": True,
                    "align": "center",
                    "bg_color": colors["brand_rose"],
                    "font_color": colors["white"],
                    "border": 1,
                    "border_color": colors["brand_rose"],
                }
            ),
        },
    )


def _apply_cod_conditional_formatting(workbook, worksheet, design_tokens: dict, max_input_rows: int) -> None:
    colors = design_tokens["colors"]
    end_row = max_input_rows + 3
    for value, bg_color, font_color in [
        ("Đã nhận đủ", colors["success"], colors["white"]),
        ("Chờ tiền về", colors["accent"], colors["text"]),
        ("Quá hạn tiền về", colors["danger"], colors["white"]),
        ("Không áp dụng", colors["brand_mist_soft"], colors["muted_text"]),
    ]:
        worksheet.conditional_format(
            f"H4:H{end_row}",
            {
                "type": "text",
                "criteria": "containing",
                "value": value,
                "format": workbook.add_format(
                    {
                        "bold": True,
                        "align": "center",
                        "bg_color": bg_color,
                        "font_color": font_color,
                        "border": 1,
                        "border_color": bg_color,
                    }
                ),
            },
        )
    worksheet.conditional_format(
        f"A4:H{end_row}",
        {
            "type": "formula",
            "criteria": '=$H4="Quá hạn tiền về"',
            "format": workbook.add_format({"bg_color": colors["brand_rose_soft"]}),
        },
    )


def _write_setup_sheet(worksheet, *, config: dict, sample_data: dict, formats: dict, context, design_tokens: dict) -> None:
    configure_sheet(worksheet, tab_color=design_tokens["sheet_tabs"]["setup"])
    worksheet.set_column("A:A", 24)
    worksheet.set_column("B:B", 36)
    worksheet.set_column("D:H", 14)

    write_banner(worksheet, formats, config["guide"]["title"], config["guide"]["subtitle"], 7)

    worksheet.write("A3", "Thông tin shop", formats["section"])
    for idx, field in enumerate(config["setup_fields"], start=4):
        worksheet.write(f"A{idx}", field["label"], formats["setup_label"])
        worksheet.write(f"B{idx}", sample_data["shop_profile"][field["key"]], formats["setup_input"])

    worksheet.write("A11", "Hướng dẫn nhanh", formats["section"])
    for idx, step in enumerate(config["guide"]["quick_start"], start=12):
        worksheet.write(f"A{idx}", f"Bước {idx - 11}", formats["meta_key"])
        worksheet.write(f"B{idx}", step, formats["meta_value"])

    worksheet.write("A18", "Nếu em mới dùng lần đầu", formats["section"])
    for idx, step in enumerate(config["guide"]["detail_steps"], start=19):
        worksheet.write(f"A{idx}", f"Nhớ {idx - 18}", formats["meta_key"])
        worksheet.write(f"B{idx}", step, formats["meta_value"])

    worksheet.write("A25", "Quy ước màu", formats["section"])
    for idx, item in enumerate(config["guide"]["legend"], start=26):
        worksheet.write(f"A{idx}", item["label"], formats["meta_key"])
        worksheet.write(f"B{idx}", item["meaning"], formats["meta_value"])

    worksheet.write("D3", "Logo shop", formats["section"])
    logo_path = sample_data["shop_profile"].get("logo_image_path", "").strip()
    if logo_path and Path(logo_path).exists():
        worksheet.merge_range("D4:H9", "", formats["logo_box"])
        worksheet.insert_image("D4", logo_path, {"x_scale": 0.45, "y_scale": 0.45, "x_offset": 8, "y_offset": 8})
    else:
        worksheet.merge_range("D4:H9", "Dán logo vào đây\n(Insert Picture)", formats["logo_box"])
    worksheet.write("D12", "Gợi ý", formats["meta_key"])
    worksheet.merge_range(
        "E12:H12",
        "Bạn chỉ cần đổi tên shop, hotline, kênh liên hệ và dán logo là đã có bản riêng của mình.",
        formats["setup_hint"],
    )

    worksheet.write("D15", "Các sheet em sẽ dùng", formats["section"])
    for idx, item in enumerate(config["guide"]["sheet_purpose"], start=16):
        worksheet.write(f"D{idx}", item[0], formats["meta_key"])
        worksheet.merge_range(f"E{idx}:H{idx}", item[1], formats["meta_value"])

    worksheet.write("D23", "Phiên bản file", formats["meta_key"])
    worksheet.write("E23", context.version, formats["meta_value"])
    worksheet.write("D24", "Thời gian build", formats["meta_key"])
    worksheet.write("E24", context.build_timestamp_iso, formats["meta_value"])
    protect_sheet(worksheet)


def _write_lists_sheet(workbook, worksheet, *, config: dict, sample_data: dict, formats: dict) -> dict[str, tuple[int, int, str]]:
    configure_sheet(worksheet, tab_color="#D9A7B5")
    worksheet.set_column("A:E", 18)
    worksheet.set_column("G:J", 18)
    worksheet.set_column("L:L", 18)
    worksheet.set_column("N:S", 18)
    worksheet.set_column("A:A", 32)
    worksheet.set_column("E:E", 42)
    worksheet.set_column("G:G", 24)
    worksheet.set_column("H:H", 28)
    worksheet.set_column("K:K", 32)
    worksheet.set_column("M:M", 42)
    worksheet.set_column("P:P", 22)
    worksheet.freeze_panes(2, 0)
    worksheet.write("A1", "Danh mục sản phẩm", formats["section"])
    product_headers = ["Tên sản phẩm", "Nhóm", "Giá gợi ý", "Mã SP tự tạo", "Dùng để chọn"]
    for idx, header in enumerate(product_headers):
        worksheet.write(1, idx, header, formats["helper_header"])
    for offset in range(config["catalog_capacity"]["products"]):
        row_idx = offset + 3
        item = sample_data["products_catalog"][offset] if offset < len(sample_data["products_catalog"]) else dict(name="", group="", default_price=None, code="", label="")
        worksheet.write(f"A{row_idx}", item["name"], formats["setup_input"])
        worksheet.write(f"B{row_idx}", item["group"], formats["setup_input"])
        write_cell(worksheet, row_idx - 1, 2, item["default_price"], formats["input_currency"])
        worksheet.write_formula(f"D{row_idx}", f'=IF(A{row_idx}="","", "SP"&TEXT(ROW()-2,"00"))', formats["locked_text"], item["code"])
        worksheet.write_formula(f"E{row_idx}", f'=IF(A{row_idx}="","", D{row_idx}&" - "&A{row_idx})', formats["locked_text"], item["label"])

    worksheet.write("G1", "Kênh bán hàng", formats["section"])
    worksheet.write("G2", "Tên kênh", formats["helper_header"])
    worksheet.write("H2", "Ghi chú", formats["helper_header"])
    for offset in range(config["catalog_capacity"]["channels"]):
        row_idx = offset + 3
        name = sample_data["platforms"][offset]["name"] if offset < len(sample_data["platforms"]) else ""
        worksheet.write(f"G{row_idx}", name, formats["setup_input"])
    worksheet.write("H3", "Thêm liên tiếp, không bỏ dòng trống", formats["setup_hint"])
    worksheet.write("H4", "Giữ tên/mã đã dùng trong đơn cũ", formats["setup_hint"])
    worksheet.write("H5", "Sản phẩm và giá là ví dụ để sửa", formats["setup_hint"])
    worksheet.write("H6", "500 SP / 60 kênh / 150 thu chi", formats["setup_hint"])

    worksheet.write("J1", "Danh mục thu chi", formats["section"])
    cash_headers = ["Loại Thu/Chi", "Tên danh mục", "Mã tự tạo", "Dùng để chọn"]
    for idx, header in enumerate(cash_headers):
        worksheet.write(1, 9 + idx, header, formats["helper_header"])
    for offset in range(config["catalog_capacity"]["cashbook_categories"]):
        row_idx = offset + 3
        item = sample_data["cashflow_categories"][offset] if offset < len(sample_data["cashflow_categories"]) else dict(flow_type="", name="", code="", label="")
        worksheet.write(f"J{row_idx}", item["flow_type"], formats["setup_input"])
        worksheet.write(f"K{row_idx}", item["name"], formats["setup_input"])
        worksheet.write_formula(
            f"L{row_idx}",
            f'=IF(J{row_idx}="","",IF(J{row_idx}="Thu","T","C")&TEXT(COUNTIF($J$3:J{row_idx},J{row_idx}),"00"))',
            formats["locked_text"],
            item["code"],
        )
        worksheet.write_formula(f"M{row_idx}", f'=IF(K{row_idx}="","", L{row_idx}&" - "&K{row_idx})', formats["locked_text"], item["label"])

    worksheet.write("O1", "Các lựa chọn khác", formats["section"])
    worksheet.write("O2", "Thanh toán", formats["helper_header"])
    worksheet.write("P2", "Vận chuyển", formats["helper_header"])
    worksheet.write("Q2", "Trạng thái đơn", formats["helper_header"])
    worksheet.write("R2", "Thu / Chi", formats["helper_header"])
    max_misc = max(len(sample_data["lists"]["payment_methods"]), len(sample_data["lists"]["carriers"]), len(sample_data["lists"]["order_statuses"]))
    for idx in range(max_misc):
        row = idx + 3
        if idx < len(sample_data["lists"]["payment_methods"]):
            worksheet.write(f"O{row}", sample_data["lists"]["payment_methods"][idx], formats["setup_input"])
        if idx < len(sample_data["lists"]["carriers"]):
            worksheet.write(f"P{row}", sample_data["lists"]["carriers"][idx], formats["setup_input"])
        if idx < len(sample_data["lists"]["order_statuses"]):
            worksheet.write(f"Q{row}", sample_data["lists"]["order_statuses"][idx], formats["setup_input"])
    worksheet.write("R3", "Thu", formats["setup_input"])
    worksheet.write("R4", "Chi", formats["setup_input"])

    list_ranges = {
        "channels": (3, 2 + config["catalog_capacity"]["channels"], "G"),
        "products": (3, 2 + config["catalog_capacity"]["products"], "E"),
        "payment_methods": (3, 2 + len(sample_data["lists"]["payment_methods"]), "O"),
        "carriers": (3, 2 + len(sample_data["lists"]["carriers"]), "P"),
        "order_statuses": (3, 2 + len(sample_data["lists"]["order_statuses"]), "Q"),
        "flow_types": (3, 4, "R"),
        "cashbook_categories": (3, 2 + config["catalog_capacity"]["cashbook_categories"], "M"),
    }
    for name, (start, end, col) in list_ranges.items():
        sheet = config["sheets"]["lists"]
        formula = f"='{sheet}'!${col}${start}:${col}${end}"
        workbook.define_name(f"shop_{name}", formula)
    worksheet.data_validation(f"J3:J{list_ranges['cashbook_categories'][1]}", {"validate": "list", "source": f"='{sheet}'!$R$3:$R$4"})
    protect_sheet(worksheet)
    return list_ranges


def _write_orders_sheet(workbook, worksheet, *, config: dict, sample_data: dict, formats: dict, metrics: dict, design_tokens: dict) -> None:
    configure_sheet(worksheet, freeze_row=3, freeze_col=2, tab_color=_tabs(design_tokens)["orders"])
    write_banner(worksheet, formats, "1. Đơn hàng", "Ô hồng là ô nhập. Ô xanh là ô tự tính. Mã đơn sẽ tự hiện.", len(config["orders_columns"]) - 1)
    write_table_headers(worksheet, 2, config["orders_columns"], formats)

    max_input_rows = config["max_input_rows"]
    sample_orders = sample_data["orders"]

    for row_offset in range(max_input_rows):
        row_number = row_offset + 4
        row_idx = row_number - 1
        apply_row_defaults(worksheet, row_idx, config["orders_columns"], formats)

        row_data = sample_orders[row_offset] if row_offset < len(sample_orders) else {}
        cached_metrics = metrics["orders"][row_offset] if row_offset < len(sample_orders) else {"order_id": "", "cod_expected": "", "cod_status": ""}
        formula_payload = order_formula_payload(config, row_number, cached_metrics)

        for col_idx, column in enumerate(config["orders_columns"]):
            key = column["key"]
            cell_format = formats[get_format_key(column["type"], column["editable"])]
            if column["editable"]:
                raw_value = row_data.get(key, "")
                value = _parse_date(raw_value) if column["type"] == "date" and raw_value else raw_value
                write_cell(worksheet, row_idx, col_idx, value, cell_format)
            else:
                payload = formula_payload[key]
                worksheet.write_formula(row_idx, col_idx, payload["formula"], cell_format, payload["value"])

    worksheet.autofilter(2, 0, max_input_rows + 2, len(config["orders_columns"]) - 1)
    _apply_order_conditional_formatting(workbook, worksheet, design_tokens, max_input_rows, sample_data)
    protect_sheet(worksheet)


def _write_cashbook_sheet(workbook, worksheet, *, config: dict, sample_data: dict, formats: dict, design_tokens: dict) -> None:
    configure_sheet(worksheet, freeze_row=3, freeze_col=2, tab_color=_tabs(design_tokens)["cashbook"])
    write_banner(worksheet, formats, "2. Thu chi", "Mã giao dịch tự hiện. Chỉ cần chọn Thu hoặc Chi rồi nhập số tiền.", len(config["cashbook_columns"]) - 1)
    write_table_headers(worksheet, 2, config["cashbook_columns"], formats)

    max_input_rows = config["max_input_rows"]
    sample_rows = sample_data["cashbook"]
    for row_offset in range(max_input_rows):
        row_number = row_offset + 4
        row_idx = row_number - 1
        apply_row_defaults(worksheet, row_idx, config["cashbook_columns"], formats)
        row_data = sample_rows[row_offset] if row_offset < len(sample_rows) else {}
        formula_payload = cashbook_formula_payload(row_number, row_data if row_data else {"txn_id": ""})
        for col_idx, column in enumerate(config["cashbook_columns"]):
            cell_format = formats[get_format_key(column["type"], column["editable"])]
            if column["editable"]:
                raw_value = row_data.get(column["key"], "")
                value = _parse_date(raw_value) if column["type"] == "date" and raw_value else raw_value
                write_cell(worksheet, row_idx, col_idx, value, cell_format)
            else:
                payload = formula_payload[column["key"]]
                worksheet.write_formula(row_idx, col_idx, payload["formula"], cell_format, payload["value"])

    worksheet.autofilter(2, 0, max_input_rows + 2, len(config["cashbook_columns"]) - 1)
    _apply_cashbook_conditional_formatting(workbook, worksheet, design_tokens, max_input_rows)
    protect_sheet(worksheet)


def _write_cod_sheet(workbook, worksheet, *, config: dict, formats: dict, metrics: dict, design_tokens: dict) -> None:
    configure_sheet(worksheet, freeze_row=3, freeze_col=1, tab_color=_tabs(design_tokens)["cod"])
    write_banner(worksheet, formats, "3. Theo dõi COD", "Sheet này chỉ để xem. File tự tổng hợp tiền COD đã nhận và còn chờ.", len(config["cod_columns"]) - 1)
    write_table_headers(worksheet, 2, config["cod_columns"], formats)

    max_input_rows = config["max_input_rows"]
    for row_offset in range(max_input_rows):
        row_number = row_offset + 4
        row_idx = row_number - 1
        orders_row_number = row_number
        apply_row_defaults(worksheet, row_idx, config["cod_columns"], formats)
        cached_metrics = (
            metrics["cod"][row_offset]
            if row_offset < len(metrics["cod"])
            else {
                "order_id": "",
                "customer_name": "",
                "carrier": "",
                "expected_payout": "",
                "cod_expected": "",
                "cod_received": "",
                "cod_outstanding": "",
                "cod_health": "",
            }
        )
        payload = cod_formula_payload(config, row_number, orders_row_number, cached_metrics)
        for col_idx, column in enumerate(config["cod_columns"]):
            cell_format = formats[get_format_key(column["type"], column["editable"])]
            item = payload[column["key"]]
            worksheet.write_formula(row_idx, col_idx, item["formula"], cell_format, item["value"])

    worksheet.autofilter(2, 0, max_input_rows + 2, len(config["cod_columns"]) - 1)
    _apply_cod_conditional_formatting(workbook, worksheet, design_tokens, max_input_rows)
    protect_sheet(worksheet)


def _write_metadata_sheet(worksheet, *, config: dict, formats: dict, context, qc_note: str, design_tokens: dict) -> None:
    configure_sheet(worksheet, tab_color=design_tokens["sheet_tabs"]["metadata"])
    worksheet.set_column("A:A", 24)
    worksheet.set_column("B:B", 56)
    write_banner(worksheet, formats, "6. Hệ thống", "Sheet ẩn phục vụ versioning và kiểm tra chất lượng", 3)

    rows = [
        ("Thương hiệu", config["brand"]),
        ("Mã template", config["template_id"]),
        ("Tên template", config["template_name"]),
        ("Phiên bản", context.version),
        ("Thời gian build", context.build_timestamp_iso),
        ("Tên file", context.paths.file_name),
        ("Quy tắc QC", qc_note),
    ]
    for idx, (label, value) in enumerate(rows, start=4):
        worksheet.write(f"A{idx}", label, formats["meta_key"])
        worksheet.write(f"B{idx}", value, formats["meta_value"])

    worksheet.hide()
    protect_sheet(worksheet)


def build_workbook(*, context, config: dict, sample_data: dict, design_tokens: dict) -> None:
    workbook = xlsxwriter.Workbook(str(context.paths.workbook_path))
    workbook.set_properties(
        {
            "title": config["template_name"],
            "company": config["brand"],
            "comments": f"Built by File Đi Làm factory on {context.build_timestamp_iso}",
        }
    )
    formats = create_format_catalog(workbook, design_tokens)
    today = context.build_timestamp.date()
    metrics = build_sample_metrics(config, sample_data, today)
    dashboard_cache = build_dashboard_cache(sample_data, metrics, today)

    guide_ws = workbook.add_worksheet(config["sheets"]["guide"])
    orders_ws = workbook.add_worksheet(config["sheets"]["orders"])
    cashbook_ws = workbook.add_worksheet(config["sheets"]["cashbook"])
    cod_ws = workbook.add_worksheet(config["sheets"]["cod"])
    dashboard_ws = workbook.add_worksheet(config["sheets"]["dashboard"])
    lists_ws = workbook.add_worksheet(config["sheets"]["lists"])
    metadata_ws = workbook.add_worksheet(config["sheets"]["metadata"])

    _write_setup_sheet(guide_ws, config=config, sample_data=sample_data, formats=formats, context=context, design_tokens=design_tokens)
    list_ranges = _write_lists_sheet(workbook, lists_ws, config=config, sample_data=sample_data, formats=formats)
    _write_orders_sheet(workbook, orders_ws, config=config, sample_data=sample_data, formats=formats, metrics=metrics, design_tokens=design_tokens)
    _write_cashbook_sheet(workbook, cashbook_ws, config=config, sample_data=sample_data, formats=formats, design_tokens=design_tokens)
    _write_cod_sheet(workbook, cod_ws, config=config, formats=formats, metrics=metrics, design_tokens=design_tokens)

    configure_sheet(dashboard_ws, tab_color=_tabs(design_tokens)["dashboard"])
    write_dashboard(
        workbook,
        dashboard_ws,
        config=config,
        formats=formats,
        dashboard_cache=dashboard_cache,
        design_tokens=design_tokens,
        shop_profile=sample_data["shop_profile"],
        sample_data=sample_data,
    )
    protect_sheet(dashboard_ws)

    _write_metadata_sheet(
        metadata_ws,
        config=config,
        formats=formats,
        context=context,
        qc_note="Factory build xong sẽ tạo file QC JSON và manifest riêng, không ghi đè bản cũ.",
        design_tokens=design_tokens,
    )

    apply_validations(orders_ws, cashbook_ws, config=config, list_ranges=list_ranges)
    workbook.close()
