from __future__ import annotations

from datetime import date, datetime


FORMAT_KEY_BY_TYPE = {
    ("text", True): "input_text",
    ("integer", True): "input_integer",
    ("currency", True): "input_currency",
    ("date", True): "input_date",
    ("text", False): "locked_text",
    ("integer", False): "locked_integer",
    ("currency", False): "locked_currency",
    ("date", False): "locked_date",
}


def configure_sheet(worksheet, *, freeze_row: int = 0, freeze_col: int = 0, zoom: int = 95, tab_color: str | None = None) -> None:
    worksheet.hide_gridlines(2)
    worksheet.set_zoom(zoom)
    if freeze_row or freeze_col:
        worksheet.freeze_panes(freeze_row, freeze_col)
    if tab_color:
        worksheet.set_tab_color(tab_color)


def protect_sheet(worksheet) -> None:
    worksheet.protect(
        "",
        {
            "format_cells": False,
            "format_columns": False,
            "format_rows": False,
            "insert_columns": False,
            "insert_rows": False,
            "delete_columns": False,
            "delete_rows": False,
            "sort": False,
            "autofilter": True,
        },
    )


def write_banner(worksheet, formats: dict, title: str, subtitle: str, end_col: int) -> None:
    worksheet.merge_range(0, 0, 0, end_col, title, formats["title"])
    worksheet.merge_range(1, 0, 1, end_col, subtitle, formats["subtitle"])
    worksheet.set_row(0, 26)
    worksheet.set_row(1, 18)


def write_table_headers(worksheet, row_idx: int, columns: list[dict], formats: dict) -> None:
    worksheet.set_row(row_idx, 24)
    for col_idx, column in enumerate(columns):
        header_format = formats["table_header_input"] if column["editable"] else formats["table_header_formula"]
        worksheet.write(row_idx, col_idx, column["header"], header_format)
        worksheet.set_column(col_idx, col_idx, column.get("width", 14))


def write_table_instruction_row(worksheet, row_idx: int, columns: list[dict], formats: dict) -> None:
    worksheet.set_row(row_idx, 20)
    for col_idx, column in enumerate(columns):
        if column["editable"]:
            worksheet.write(row_idx, col_idx, "Nhập", formats["instruction_input"])
        else:
            worksheet.write(row_idx, col_idx, "Tự tính", formats["instruction_formula"])


def get_format_key(column_type: str, editable: bool) -> str:
    return FORMAT_KEY_BY_TYPE[(column_type, editable)]


def _normalize_value(value):
    if isinstance(value, datetime):
        return value
    if isinstance(value, date):
        return datetime(value.year, value.month, value.day)
    return value


def write_cell(worksheet, row_idx: int, col_idx: int, value, cell_format) -> None:
    normalized = _normalize_value(value)
    if isinstance(normalized, datetime):
        worksheet.write_datetime(row_idx, col_idx, normalized, cell_format)
    elif isinstance(normalized, (int, float)) and not isinstance(normalized, bool):
        worksheet.write_number(row_idx, col_idx, normalized, cell_format)
    elif normalized in ("", None):
        worksheet.write_blank(row_idx, col_idx, None, cell_format)
    else:
        worksheet.write(row_idx, col_idx, normalized, cell_format)


def apply_row_defaults(worksheet, row_idx: int, columns: list[dict], formats: dict) -> None:
    worksheet.set_row(row_idx, 22)
    for col_idx, column in enumerate(columns):
        cell_format = formats[get_format_key(column["type"], column["editable"])]
        worksheet.write_blank(row_idx, col_idx, None, cell_format)
