from __future__ import annotations


def apply_validations(orders_ws, cashbook_ws, *, config: dict, list_ranges: dict[str, tuple[int, int, str]]) -> None:
    max_row = config["max_input_rows"] + 1
    def source(name: str) -> str:
        if name not in list_ranges:
            raise ValueError(f"Missing dropdown catalog: {name}")
        start, end, column = list_ranges[name]
        # Sheets' XLSX editor cannot resolve Excel OFFSET-defined names.
        # Reserve capacity in a direct range so new catalog entries still appear.
        return f"='{config['sheets']['lists']}'!${column}${start}:${column}${end}"

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
        f"D4:D{max_row + 2}",
        {
            "validate": "integer",
            "criteria": ">=",
            "value": 0,
            "error_title": "Số tiền không hợp lệ",
            "error_message": "Số tiền phải lớn hơn hoặc bằng 0",
        },
    )
