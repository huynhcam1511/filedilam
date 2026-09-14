from __future__ import annotations


def _metric_formula(metric_name: str, config: dict) -> str:
    orders_sheet = config["sheets"]["orders"]
    cashbook_sheet = config["sheets"]["cashbook"]
    cod_sheet = config["sheets"]["cod"]
    max_row = config["max_input_rows"] + 3

    formulas = {
        "order_count": f'=COUNTIF(\'{orders_sheet}\'!$K$4:$K${max_row},"<>")',
        "total_revenue": f'=SUM(\'{orders_sheet}\'!$E$4:$E${max_row})',
        "cod_outstanding": f'=SUM(\'{cod_sheet}\'!$G$4:$G${max_row})',
        "net_cashflow": (
            f'=SUMIFS(\'{cashbook_sheet}\'!$D$4:$D${max_row},\'{cashbook_sheet}\'!$B$4:$B${max_row},"Thu")'
            f'-SUMIFS(\'{cashbook_sheet}\'!$D$4:$D${max_row},\'{cashbook_sheet}\'!$B$4:$B${max_row},"Chi")'
        ),
    }
    return formulas[metric_name]


def _write_helper_block(worksheet, label_col: str, value_col: str, start_row: int, header_left: str, header_right: str, rows: list[tuple[str, int]], formats: dict) -> None:
    worksheet.write(f"{label_col}{start_row}", header_left, formats["helper_header"])
    worksheet.write(f"{value_col}{start_row}", header_right, formats["helper_header"])
    for idx, (label, value) in enumerate(rows, start=1):
        worksheet.write(f"{label_col}{start_row + idx}", label, formats["helper_text"])
        worksheet.write_number(f"{value_col}{start_row + idx}", value, formats["helper_currency"])


def write_dashboard(
    workbook,
    worksheet,
    *,
    config: dict,
    formats: dict,
    dashboard_cache: dict[str, object],
    design_tokens: dict,
    shop_profile: dict[str, str],
    sample_data: dict,
) -> None:
    colors = design_tokens["colors"]
    platform_color_map = {item["name"]: item["chip_bg"] for item in sample_data["platforms"]}

    worksheet.set_column("A:T", 10)
    worksheet.set_column("AA:AZ", 18, None, {"hidden": True})
    worksheet.set_row(0, 28)
    worksheet.set_row(1, 20)

    worksheet.merge_range("B1:H1", "", formats["title"])
    worksheet.write_formula("B1", f"='{config['sheets']['guide']}'!B4", formats["title"], shop_profile["shop_name"])
    worksheet.merge_range("B2:H2", "", formats["subtitle"])
    worksheet.write_formula(
        "B2",
        f'="Báo cáo nhanh của "&\'{config["sheets"]["guide"]}\'!B4&" - chỉ xem, không cần nhập"',
        formats["subtitle"],
        f'Báo cáo nhanh của {shop_profile["shop_name"]} - chỉ xem, không cần nhập',
    )
    worksheet.write("J1", "Hotline", formats["helper_header"])
    worksheet.write_formula("K1", f"='{config['sheets']['guide']}'!B5", formats["helper_text"], shop_profile["shop_hotline"])
    worksheet.write("J2", "Kênh liên hệ", formats["helper_header"])
    worksheet.write_formula("K2", f"='{config['sheets']['guide']}'!B6", formats["helper_text"], shop_profile["shop_social"])

    for card in config["dashboard"]["cards"]:
        start_cell = card["cell"]
        start_col = ord(start_cell[0]) - ord("A")
        start_row = int(start_cell[1:]) - 1
        end_col = start_col + 2
        worksheet.merge_range(start_row, start_col, start_row, end_col, card["title"], formats["card_title"])
        worksheet.merge_range(start_row + 1, start_col, start_row + 2, end_col, "", formats["card_value_currency"])
        worksheet.write_formula(
            start_row + 1,
            start_col,
            _metric_formula(card["metric"], config),
            formats[f"card_value_{card['format']}"],
            dashboard_cache[card["metric"]],
        )

    _write_helper_block(worksheet, "AA", "AB", 2, "Kênh", "Doanh thu", list(dashboard_cache["revenue_by_channel"].items()), formats)
    _write_helper_block(worksheet, "AD", "AE", 2, "Kênh", "Số đơn", list(dashboard_cache["order_count_by_channel"].items()), formats)
    _write_helper_block(worksheet, "AG", "AH", 2, "Trạng thái", "Số đơn", list(dashboard_cache["orders_by_status"].items()), formats)
    _write_helper_block(worksheet, "AJ", "AK", 2, "Nhóm COD", "Số tiền", list(dashboard_cache["cod_aging"].items()), formats)
    _write_helper_block(worksheet, "AM", "AN", 2, "Thu/Chi", "Số tiền", list(dashboard_cache["cashflow_summary"].items()), formats)
    _write_helper_block(worksheet, "AP", "AQ", 2, "Sản phẩm", "Doanh thu", dashboard_cache["product_revenue"], formats)

    chart_positions = [
        ("B12", "Doanh thu theo kênh", "column", "AA", "AB", len(dashboard_cache["revenue_by_channel"])),
        ("J12", "Số đơn theo kênh", "bar", "AD", "AE", len(dashboard_cache["order_count_by_channel"])),
        ("B30", "Cơ cấu trạng thái đơn", "doughnut", "AG", "AH", len(dashboard_cache["orders_by_status"])),
        ("J30", "Thu và chi", "column", "AM", "AN", len(dashboard_cache["cashflow_summary"])),
        ("B48", "Top sản phẩm", "bar", "AP", "AQ", len(dashboard_cache["product_revenue"])),
        ("J48", "Tiền COD chờ về", "bar", "AJ", "AK", len(dashboard_cache["cod_aging"])),
    ]

    for anchor, title, chart_type, category_col, value_col, size in chart_positions:
        chart = workbook.add_chart({"type": chart_type})
        points = None
        if category_col in {"AA", "AD"}:
            labels = list(dashboard_cache["revenue_by_channel"].keys()) if category_col == "AA" else list(dashboard_cache["order_count_by_channel"].keys())
            points = [{"fill": {"color": platform_color_map.get(label, colors["secondary"])}, "border": {"color": platform_color_map.get(label, colors["secondary"])}} for label in labels]

        series = {
            "name": title,
            "categories": f"='{config['sheets']['dashboard']}'!${category_col}$3:${category_col}${2 + size}",
            "values": f"='{config['sheets']['dashboard']}'!${value_col}$3:${value_col}${2 + size}",
        }
        if chart_type == "doughnut":
            series["data_labels"] = {"percentage": True}
            series["points"] = [
                {"fill": {"color": colors["info"]}},
                {"fill": {"color": colors["accent"]}},
                {"fill": {"color": colors["success"]}},
                {"fill": {"color": colors["lavender"]}},
                {"fill": {"color": colors["danger"]}},
            ]
        elif points:
            series["points"] = points
        else:
            series["fill"] = {"color": colors["secondary"] if chart_type == "column" else colors["accent"]}
            series["border"] = {"color": colors["secondary"] if chart_type == "column" else colors["accent"]}

        chart.add_series(series)
        chart.set_title({"name": title})
        chart.set_chartarea({"fill": {"color": colors["white"]}, "border": {"color": colors["border"]}})
        chart.set_plotarea({"fill": {"color": colors["white"]}, "border": {"color": colors["white"]}})
        if chart_type != "doughnut":
            chart.set_legend({"none": True})
            chart.set_y_axis({"num_format": "#,##0"})
        worksheet.insert_chart(anchor, chart, {"x_scale": 1.0, "y_scale": 0.9})
