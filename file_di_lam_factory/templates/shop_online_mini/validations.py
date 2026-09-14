from __future__ import annotations


def _range_formula(sheet_name: str, start_row: int, end_row: int, column_letter: str) -> str:
    return f"='{sheet_name}'!${column_letter}${start_row}:${column_letter}${end_row}"


def apply_validations(orders_ws, cashbook_ws, *, config: dict, list_ranges: dict[str, tuple[int, int, str]]) -> None:
    sheet_name = config["sheets"]["lists"]
    max_row = config["max_input_rows"] + 1
    def source(name: str) -> str:
        start_row, end_row, column_letter = list_ranges[name]
        return _range_formula(sheet_name, start_row, end_row, column_letter)

    orders_validations = {
        "B": source("channels"),
        "D": source("products"),
        "F": source("payment_methods"),
        "G": source("carriers"),
        "I": source("order_statuses"),
    }
    for column_letter, source_formula in orders_validations.items():
        orders_ws.data_validation(
            f"{column_letter}4:{column_letter}{max_row + 2}",
            {
                "validate": "list",
                "source": source_formula,
                "input_title": "Chọn giá trị",
                "input_message": "Vui lòng chọn trong danh sách có sẵn",
                "error_title": "Giá trị không hợp lệ",
                "error_message": "Hãy dùng ô chọn sẵn trong file",
            },
        )

    cashbook_validations = {
        "B": source("flow_types"),
        "C": source("cashbook_categories"),
    }
    for column_letter, source_formula in cashbook_validations.items():
        cashbook_ws.data_validation(
            f"{column_letter}4:{column_letter}{max_row + 2}",
            {
                "validate": "list",
                "source": source_formula,
                "input_title": "Chọn giá trị",
                "input_message": "Vui lòng chọn trong danh sách có sẵn",
                "error_title": "Giá trị không hợp lệ",
                "error_message": "Hãy dùng ô chọn sẵn trong file",
            },
        )

    orders_ws.data_validation(
        f"E4:E{max_row + 2}",
        {
            "validate": "integer",
            "criteria": ">=",
            "value": 0,
            "error_title": "Tổng đơn không hợp lệ",
            "error_message": "Tổng đơn phải lớn hơn hoặc bằng 0",
        },
    )
    cashbook_ws.data_validation(
        f"E4:E{max_row + 2}",
        {
            "validate": "integer",
            "criteria": ">=",
            "value": 0,
            "error_title": "Số tiền không hợp lệ",
            "error_message": "Số tiền phải lớn hơn hoặc bằng 0",
        },
    )
