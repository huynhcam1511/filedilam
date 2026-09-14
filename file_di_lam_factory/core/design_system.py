from __future__ import annotations

from pathlib import Path

from file_di_lam_factory.core.loader import load_json


def load_design_system_tokens(design_system_id: str) -> dict:
    base_dir = Path(__file__).resolve().parent.parent / "design_systems"
    path = base_dir / f"{design_system_id}.json"
    return load_json(path)


def create_format_catalog(workbook, tokens: dict) -> dict[str, object]:
    colors = tokens["colors"]
    fonts = tokens["fonts"]
    borders = {"border": 1, "border_color": colors["border"]}

    return {
        "title": workbook.add_format(
            {
                "bold": True,
                "font_name": fonts["display_name"],
                "font_size": 20,
                "font_color": colors["primary"],
                "bg_color": colors["background"],
                "align": "left",
                "valign": "vcenter",
            }
        ),
        "subtitle": workbook.add_format(
            {
                "italic": True,
                "font_name": fonts["body_name"],
                "font_size": 10,
                "font_color": colors["muted_text"],
                "bg_color": colors["background"],
                "align": "left",
                "valign": "vcenter",
            }
        ),
        "section": workbook.add_format(
            {
                "bold": True,
                "font_name": fonts["display_name"],
                "font_size": 11,
                "font_color": colors["text"],
                "bg_color": colors["brand_lavender_soft"],
                "align": "left",
                "valign": "vcenter",
            }
        ),
        "table_header_input": workbook.add_format(
            {
                **borders,
                "bold": True,
                "font_name": fonts["body_name"],
                "font_size": 10,
                "font_color": colors["white"],
                "bg_color": colors["brand_rose"],
                "text_wrap": True,
                "align": "center",
                "valign": "vcenter",
            }
        ),
        "table_header_formula": workbook.add_format(
            {
                **borders,
                "bold": True,
                "font_name": fonts["body_name"],
                "font_size": 10,
                "font_color": colors["text"],
                "bg_color": colors["brand_mist"],
                "text_wrap": True,
                "align": "center",
                "valign": "vcenter",
            }
        ),
        "instruction_input": workbook.add_format(
            {
                **borders,
                "font_name": fonts["body_name"],
                "font_size": 9,
                "italic": True,
                "bg_color": colors["input_fill"],
                "font_color": colors["muted_text"],
                "align": "center",
                "valign": "vcenter",
            }
        ),
        "instruction_formula": workbook.add_format(
            {
                **borders,
                "font_name": fonts["body_name"],
                "font_size": 9,
                "italic": True,
                "bg_color": colors["formula_fill"],
                "font_color": colors["muted_text"],
                "align": "center",
                "valign": "vcenter",
            }
        ),
        "input_text": workbook.add_format(
            {
                **borders,
                "font_name": fonts["body_name"],
                "bg_color": colors["input_fill"],
                "locked": False,
                "valign": "vcenter",
            }
        ),
        "input_integer": workbook.add_format(
            {
                **borders,
                "font_name": fonts["body_name"],
                "bg_color": colors["input_fill"],
                "locked": False,
                "valign": "vcenter",
                "align": "right",
                "num_format": "#,##0",
            }
        ),
        "input_currency": workbook.add_format(
            {
                **borders,
                "font_name": fonts["body_name"],
                "bg_color": colors["input_fill"],
                "locked": False,
                "valign": "vcenter",
                "align": "right",
                "num_format": "#,##0",
            }
        ),
        "input_date": workbook.add_format(
            {
                **borders,
                "font_name": fonts["body_name"],
                "bg_color": colors["input_fill"],
                "locked": False,
                "valign": "vcenter",
                "align": "center",
                "num_format": "yyyy-mm-dd",
            }
        ),
        "locked_text": workbook.add_format(
            {
                **borders,
                "font_name": fonts["body_name"],
                "bg_color": colors["formula_fill"],
                "font_color": colors["text"],
                "valign": "vcenter",
            }
        ),
        "locked_integer": workbook.add_format(
            {
                **borders,
                "font_name": fonts["body_name"],
                "bg_color": colors["formula_fill"],
                "align": "right",
                "valign": "vcenter",
                "num_format": "#,##0",
            }
        ),
        "locked_currency": workbook.add_format(
            {
                **borders,
                "font_name": fonts["body_name"],
                "bg_color": colors["formula_fill"],
                "align": "right",
                "valign": "vcenter",
                "num_format": "#,##0",
            }
        ),
        "locked_date": workbook.add_format(
            {
                **borders,
                "font_name": fonts["body_name"],
                "bg_color": colors["formula_fill"],
                "align": "center",
                "valign": "vcenter",
                "num_format": "yyyy-mm-dd",
            }
        ),
        "note": workbook.add_format(
            {
                **borders,
                "text_wrap": True,
                "font_name": fonts["body_name"],
                "font_size": 10,
                "bg_color": colors["brand_butter_soft"],
                "valign": "top",
            }
        ),
        "meta_key": workbook.add_format(
            {
                **borders,
                "bold": True,
                "font_name": fonts["body_name"],
                "bg_color": colors["brand_rose_soft"],
            }
        ),
        "meta_value": workbook.add_format(
            {
                **borders,
                "font_name": fonts["body_name"],
                "bg_color": colors["surface"],
                "text_wrap": True,
            }
        ),
        "setup_label": workbook.add_format(
            {
                **borders,
                "bold": True,
                "font_name": fonts["body_name"],
                "bg_color": colors["brand_butter_soft"],
                "font_color": colors["text"],
            }
        ),
        "setup_input": workbook.add_format(
            {
                **borders,
                "font_name": fonts["body_name"],
                "bg_color": colors["input_fill"],
                "locked": False,
            }
        ),
        "setup_hint": workbook.add_format(
            {
                **borders,
                "font_name": fonts["body_name"],
                "italic": True,
                "font_color": colors["muted_text"],
                "bg_color": colors["brand_mist_soft"],
                "text_wrap": True,
            }
        ),
        "logo_box": workbook.add_format(
            {
                "border": 2,
                "border_color": colors["brand_rose_soft"],
                "bg_color": colors["white"],
                "align": "center",
                "valign": "vcenter",
                "font_name": fonts["display_name"],
                "font_size": 12,
                "font_color": colors["muted_text"],
                "italic": True,
            }
        ),
        "helper_header": workbook.add_format(
            {
                **borders,
                "bold": True,
                "font_name": fonts["body_name"],
                "bg_color": colors["brand_lavender_soft"],
                "align": "center",
            }
        ),
        "helper_text": workbook.add_format(
            {
                **borders,
                "font_name": fonts["body_name"],
                "bg_color": colors["surface"],
            }
        ),
        "helper_currency": workbook.add_format(
            {
                **borders,
                "font_name": fonts["body_name"],
                "bg_color": colors["surface"],
                "num_format": "#,##0",
                "align": "right",
            }
        ),
        "card_title": workbook.add_format(
            {
                "bold": True,
                "font_name": fonts["body_name"],
                "font_color": colors["muted_text"],
                "bg_color": colors["brand_lavender_soft"],
                "border": 1,
                "border_color": colors["border"],
                "align": "left",
                "valign": "vcenter",
            }
        ),
        "card_value_currency": workbook.add_format(
            {
                "bold": True,
                "font_name": fonts["display_name"],
                "font_size": 16,
                "font_color": colors["primary"],
                "bg_color": colors["white"],
                "border": 1,
                "border_color": colors["border"],
                "num_format": "#,##0",
                "align": "left",
                "valign": "vcenter",
            }
        ),
        "card_value_number": workbook.add_format(
            {
                "bold": True,
                "font_name": fonts["display_name"],
                "font_size": 16,
                "font_color": colors["primary"],
                "bg_color": colors["white"],
                "border": 1,
                "border_color": colors["border"],
                "num_format": "#,##0",
                "align": "left",
                "valign": "vcenter",
            }
        ),
        "card_value_text": workbook.add_format(
            {
                "bold": True,
                "font_name": fonts["display_name"],
                "font_size": 16,
                "font_color": colors["primary"],
                "bg_color": colors["white"],
                "border": 1,
                "border_color": colors["border"],
                "align": "left",
                "valign": "vcenter",
            }
        ),
        "dashboard_panel": workbook.add_format(
            {
                "border": 1,
                "border_color": colors["border"],
                "bg_color": colors["white"],
            }
        ),
    }
