"""Live chart sources shared by the factory and workbook repair tooling."""
from __future__ import annotations


def chart_formulas(config: dict) -> dict[str, str]:
    sheets = config["sheets"]
    end = config["max_input_rows"] + 3
    products = config["catalog_capacity"]["products"] + 2
    channels = config["catalog_capacity"]["channels"] + 2
    order = lambda col: f"'{sheets['orders']}'!${col}$4:${col}${end}"
    cash = lambda col: f"'{sheets['cashbook']}'!${col}$4:${col}${end}"
    cod = lambda col: f"'{sheets['cod']}'!${col}$4:${col}${end}"
    lists = f"'{sheets['lists']}'!"
    formulas = {}
    # Full catalog aggregates; unique ranks retain ties in catalog order.
    for row in range(3, channels + 1):
        formulas[f"AS{row}"] = f'=IF({lists}G{row}="","",{lists}G{row})'
        formulas[f"AT{row}"] = f'=IF(AS{row}="",0,SUMIF({order("B")},AS{row},{order("E")}))'
        formulas[f"AU{row}"] = f'=IF(AS{row}="",0,COUNTIFS({order("B")},AS{row},{order("A")},">0"))'
        for rank_col, value_col in [("AV", "AT"), ("AW", "AU")]:
            formulas[f"{rank_col}{row}"] = f'=IF({value_col}{row}<=0,0,COUNTIF(${value_col}$3:${value_col}${channels},">"&{value_col}{row})+COUNTIF(${value_col}$3:{value_col}{row},{value_col}{row}))'
    for row in range(3, products + 1):
        formulas[f"AY{row}"] = f'=IF({lists}E{row}="","",{lists}E{row})'
        formulas[f"AZ{row}"] = f'=IF(AY{row}="",0,SUMIF({order("D")},AY{row},{order("E")}))'
        formulas[f"BA{row}"] = f'=IF(AZ{row}<=0,0,COUNTIF($AZ$3:$AZ${products},">"&AZ{row})+COUNTIF($AZ$3:AZ{row},AZ{row}))'
    for row in range(3, 10):
        rank = row - 2
        for label_col, value_col, metric_col, rank_col in [("AA", "AB", "AT", "AV"), ("AD", "AE", "AU", "AW")]:
            match = f'MATCH({rank},${rank_col}$3:${rank_col}${channels},0)'
            exists = f'COUNTIF(${rank_col}$3:${rank_col}${channels},{rank})=0'
            formulas[f"{label_col}{row}"] = f'=IF({exists},"",INDEX($AS$3:$AS${channels},{match}))'
            formulas[f"{value_col}{row}"] = f'=IF({exists},0,INDEX(${metric_col}$3:${metric_col}${channels},{match}))'
    formulas['AB10'] = f'=SUM({order("E")})-SUM(AB3:AB9)'
    formulas['AE10'] = f'=COUNT({order("A")})-SUM(AE3:AE9)'
    for row in range(3, 8):
        formulas[f'AG{row}'] = f'={lists}Q{row}'
        formulas[f'AH{row}'] = f'=COUNTIFS({order("I")},AG{row},{order("A")},">0")'
        rank = row - 2
        match = f'MATCH({rank},$BA$3:$BA${products},0)'
        exists = f'COUNTIF($BA$3:$BA${products},{rank})=0'
        formulas[f'AP{row}'] = f'=IF({exists},"",INDEX($AY$3:$AY${products},{match}))'
        formulas[f'AQ{row}'] = f'=IF({exists},0,INDEX($AZ$3:$AZ${products},{match}))'
    for row in (3, 4):
        formulas[f'AN{row}'] = f'=SUMIF({cash("B")},AM{row},{cash("D")})'
    for row, lower, upper in [(3, '">="&TODAY()', None), (4, '">="&TODAY()-3', '"<"&TODAY()'), (5, '">="&TODAY()-7', '"<"&TODAY()-3'), (6, '">0"', '"<"&TODAY()-7')]:
        terms = f'{cod("G")},{cod("D")},{lower}'
        if upper:
            terms += f',{cod("D")},{upper}'
        formulas[f'AK{row}'] = f'=SUMIFS({terms})'
    return formulas


def chart_cached_values(config: dict, sample_data: dict, cache: dict) -> dict:
    """Initial display values only; every derived cell still stores a formula."""
    values = {}
    channels = [p['name'] for p in sample_data['platforms']]
    products = [p['label'] for p in sample_data['products_catalog']]
    revenue = {p: sum(o['order_total'] for o in sample_data['orders'] if o['product_name'] == p) for p in products}
    for labels, capacity, label_col, metrics in [
        (channels, config['catalog_capacity']['channels'], 'AS', [('AT', 'AV', cache['revenue_by_channel']), ('AU', 'AW', cache['order_count_by_channel'])]),
        (products, config['catalog_capacity']['products'], 'AY', [('AZ', 'BA', revenue)]),
    ]:
        for i in range(capacity):
            row = i + 3
            label = labels[i] if i < len(labels) else ''
            values[f'{label_col}{row}'] = label
            for value_col, rank_col, amounts in metrics:
                amount = amounts.get(label, 0)
                values[f'{value_col}{row}'] = amount
                values[f'{rank_col}{row}'] = (sum(amounts.get(p, 0) > amount for p in labels) + sum(amounts.get(p, 0) == amount for p in labels[:i + 1])) if amount > 0 else 0
    for label_col, value_col, labels, amounts, size in [('AA', 'AB', channels, cache['revenue_by_channel'], 7), ('AD', 'AE', channels, cache['order_count_by_channel'], 7), ('AP', 'AQ', products, revenue, 5)]:
        ranked = sorted(((p, amounts.get(p, 0)) for p in labels if amounts.get(p, 0) > 0), key=lambda item: -item[1])[:size]
        for i in range(size):
            label, value = ranked[i] if i < len(ranked) else ('', 0)
            values[f'{label_col}{i+3}'] = label
            values[f'{value_col}{i+3}'] = value
        if size == 7:
            total = cache['total_revenue'] if value_col == 'AB' else cache['order_count']
            values[f'{value_col}10'] = total - sum(v for _, v in ranked)
    for row, status in enumerate(sample_data['lists']['order_statuses'], 3):
        values[f'AG{row}'] = status
        values[f'AH{row}'] = cache['orders_by_status'].get(status, 0)
    for row, value in enumerate(cache['cod_aging'].values(), 3):
        values[f'AK{row}'] = value
    values['AN3'] = cache['income_total']
    values['AN4'] = cache['expense_total']
    return values
