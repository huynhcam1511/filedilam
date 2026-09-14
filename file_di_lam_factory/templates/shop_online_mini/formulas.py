from __future__ import annotations

from collections import defaultdict
from datetime import date


def _orders_sheet(config: dict) -> str:
    return config["sheets"]["orders"]


def _cashbook_sheet(config: dict) -> str:
    return config["sheets"]["cashbook"]


def _max_row(config: dict) -> int:
    return config["max_input_rows"] + 3


def _safe_int(value) -> int:
    return int(value or 0)


def _receipt_totals(sample_data: dict) -> dict[str, int]:
    totals: dict[str, int] = defaultdict(int)
    for row in sample_data["cashbook"]:
        if row["flow_type"] == "Thu" and row["category"] == "T01 - Nhận COD" and row["related_order"]:
            totals[row["related_order"]] += _safe_int(row["amount"])
    return totals


def compute_order_metrics(order: dict, receipts_total: int, today: date) -> dict[str, object]:
    order_total = _safe_int(order["order_total"])
    cod_expected = order_total if order["payment_method"] == "COD" else 0

    if not order["order_id"]:
        cod_status = ""
    elif order["payment_method"] != "COD":
        cod_status = "Không áp dụng"
    elif order["order_status"] in {"Hoàn", "Hủy"}:
        cod_status = "Giao thất bại"
    elif receipts_total > 0:
        cod_status = "Đã nhận COD"
    elif date.fromisoformat(order["expected_payout"]) < today:
        cod_status = "COD quá hạn"
    else:
        cod_status = "COD chờ về"

    return {
        "order_id": order["order_id"],
        "order_total": order_total,
        "cod_expected": cod_expected,
        "cod_status": cod_status,
    }


def order_formula_payload(config: dict, row_number: int, cached_metrics: dict[str, object]) -> dict[str, dict[str, object]]:
    return {
        "order_id": {
            "formula": f'=IF(A{row_number}="","", "DH-"&TEXT(A{row_number},"yymmdd")&"-"&TEXT(ROW()-3,"000"))',
            "value": cached_metrics["order_id"],
        },
        "cod_expected": {
            "formula": f'=IF(F{row_number}<>"COD",0,IF(E{row_number}="", "", E{row_number}))',
            "value": cached_metrics["cod_expected"],
        },
        "cod_status": {
            "formula": (
                f'=IF(K{row_number}="","",'
                f'IF(F{row_number}<>"COD","Không áp dụng",'
                f'IF(OR(I{row_number}="Hoàn",I{row_number}="Hủy"),"Giao thất bại",'
                f'IF(COUNTIFS(\'{_cashbook_sheet(config)}\'!$E$4:$E${_max_row(config)},K{row_number},'
                f'\'{_cashbook_sheet(config)}\'!$B$4:$B${_max_row(config)},"Thu",'
                f'\'{_cashbook_sheet(config)}\'!$C$4:$C${_max_row(config)},"T01 - Nhận COD")>0,'
                f'"Đã nhận COD",IF(TODAY()>H{row_number},"COD quá hạn","COD chờ về")))))'
            ),
            "value": cached_metrics["cod_status"],
        },
    }


def cashbook_formula_payload(row_number: int, cached_row: dict[str, object]) -> dict[str, dict[str, object]]:
    return {
        "txn_id": {
            "formula": f'=IF(A{row_number}="","",IF(B{row_number}="Thu","PT","PC")&"-"&TEXT(A{row_number},"yymmdd")&"-"&TEXT(ROW()-3,"000"))',
            "value": cached_row["txn_id"],
        }
    }


def cod_formula_payload(config: dict, cod_row_number: int, orders_row_number: int, cached_metrics: dict[str, object]) -> dict[str, dict[str, object]]:
    cashbook_sheet = _cashbook_sheet(config)
    orders_sheet = _orders_sheet(config)
    return {
        "order_id": {
            "formula": f"='{orders_sheet}'!K{orders_row_number}",
            "value": cached_metrics["order_id"],
        },
        "customer_name": {
            "formula": f"='{orders_sheet}'!C{orders_row_number}",
            "value": cached_metrics["customer_name"],
        },
        "carrier": {
            "formula": f"='{orders_sheet}'!G{orders_row_number}",
            "value": cached_metrics["carrier"],
        },
        "expected_payout": {
            "formula": f"='{orders_sheet}'!H{orders_row_number}",
            "value": cached_metrics["expected_payout"],
        },
        "cod_expected": {
            "formula": f"='{orders_sheet}'!L{orders_row_number}",
            "value": cached_metrics["cod_expected"],
        },
        "cod_received": {
            "formula": (
                f'=IF(A{cod_row_number}="","",SUMIFS(\'{cashbook_sheet}\'!$D$4:$D${_max_row(config)},'
                f'\'{cashbook_sheet}\'!$B$4:$B${_max_row(config)},"Thu",'
                f'\'{cashbook_sheet}\'!$C$4:$C${_max_row(config)},"T01 - Nhận COD",'
                f'\'{cashbook_sheet}\'!$E$4:$E${_max_row(config)},A{cod_row_number}))'
            ),
            "value": cached_metrics["cod_received"],
        },
        "cod_outstanding": {
            "formula": f'=IF(A{cod_row_number}="","",MAX(E{cod_row_number}-F{cod_row_number},0))',
            "value": cached_metrics["cod_outstanding"],
        },
        "cod_health": {
            "formula": (
                f'=IF(A{cod_row_number}="","",IF(E{cod_row_number}<=0,"Không áp dụng",'
                f'IF(G{cod_row_number}<=0,"Đã nhận đủ",IF(TODAY()>D{cod_row_number},"Quá hạn tiền về","Chờ tiền về"))))'
            ),
            "value": cached_metrics["cod_health"],
        },
    }


def build_sample_metrics(config: dict, sample_data: dict, today: date) -> dict[str, object]:
    receipts = _receipt_totals(sample_data)
    orders_metrics = []
    cod_metrics = []

    for order in sample_data["orders"]:
        order_receipts = receipts.get(order["order_id"], 0)
        order_metrics = compute_order_metrics(order, order_receipts, today)
        orders_metrics.append(order_metrics)

        expected_payout = date.fromisoformat(order["expected_payout"])
        cod_outstanding = max(order_metrics["cod_expected"] - order_receipts, 0)
        if not order["order_id"]:
            health = ""
        elif order_metrics["cod_expected"] <= 0:
            health = "Không áp dụng"
        elif cod_outstanding <= 0:
            health = "Đã nhận đủ"
        elif expected_payout < today:
            health = "Quá hạn tiền về"
        else:
            health = "Chờ tiền về"

        cod_metrics.append(
            {
                "order_id": order["order_id"],
                "customer_name": order["customer_name"],
                "carrier": order["carrier"],
                "expected_payout": order["expected_payout"],
                "cod_expected": order_metrics["cod_expected"],
                "cod_received": order_receipts,
                "cod_outstanding": cod_outstanding,
                "cod_health": health,
            }
        )

    return {
        "orders": orders_metrics,
        "cod": cod_metrics,
        "receipts": receipts,
    }


def build_dashboard_cache(sample_data: dict, metrics: dict[str, object], today: date) -> dict[str, object]:
    orders = sample_data["orders"]
    cashbook = sample_data["cashbook"]
    order_metrics = metrics["orders"]
    cod_metrics = metrics["cod"]

    total_income = sum(row["amount"] for row in cashbook if row["flow_type"] == "Thu")
    total_expense = sum(row["amount"] for row in cashbook if row["flow_type"] == "Chi")

    revenue_by_channel: dict[str, int] = defaultdict(int)
    order_count_by_channel: dict[str, int] = defaultdict(int)
    orders_by_status: dict[str, int] = defaultdict(int)
    product_revenue: dict[str, int] = defaultdict(int)
    cod_aging = {
        "Trong hạn": 0,
        "Trễ 1-3 ngày": 0,
        "Trễ 4-7 ngày": 0,
        "Trễ trên 7 ngày": 0
    }

    for order, metric in zip(orders, order_metrics, strict=True):
        revenue_by_channel[order["channel"]] += metric["order_total"]
        order_count_by_channel[order["channel"]] += 1
        orders_by_status[order["order_status"]] += 1
        product_revenue[order["product_name"]] += metric["order_total"]

    for order, item in zip(orders, cod_metrics, strict=True):
        outstanding = item["cod_outstanding"]
        if outstanding <= 0:
            continue
        expected_payout = date.fromisoformat(order["expected_payout"])
        age = max((today - expected_payout).days, 0)
        if expected_payout >= today:
            cod_aging["Trong hạn"] += outstanding
        elif age <= 3:
            cod_aging["Trễ 1-3 ngày"] += outstanding
        elif age <= 7:
            cod_aging["Trễ 4-7 ngày"] += outstanding
        else:
            cod_aging["Trễ trên 7 ngày"] += outstanding

    top_channel = max(revenue_by_channel.items(), key=lambda pair: pair[1])[0]
    top_products = sorted(product_revenue.items(), key=lambda pair: pair[1], reverse=True)[:5]

    return {
        "order_count": len([order for order in orders if order["order_id"]]),
        "total_revenue": sum(metric["order_total"] for metric in order_metrics),
        "cod_outstanding": sum(item["cod_outstanding"] for item in cod_metrics),
        "net_cashflow": total_income - total_expense,
        "income_total": total_income,
        "expense_total": total_expense,
        "top_channel": top_channel,
        "revenue_by_channel": revenue_by_channel,
        "order_count_by_channel": order_count_by_channel,
        "orders_by_status": orders_by_status,
        "cashflow_summary": {"Thu": total_income, "Chi": total_expense},
        "product_revenue": top_products,
        "cod_aging": cod_aging
    }
