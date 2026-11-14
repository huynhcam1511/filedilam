import sys
import os
import json
import math

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'functions'))
import promotions

def js_evaluate_coupon_sim(c, products_dict, quantities, subtotal):
    """
    Exact simulation of storefront.js:4936 evaluateCoupon logic in Python.
    """
    scope = c.get('scope') or 'all'
    reward_ids = c.get('reward_ids') or []
    
    # products: list of product dicts
    products = [products_dict[pid] for pid in quantities.keys() if pid in products_dict]
    eligible = [p for p in products if p['price'] > 0 and p['id'] not in reward_ids and (
        scope == 'all' or (scope == 'single' and p.get('type') != 'combo') or
        (scope == 'combo' and p.get('type') == 'combo') or
        scope == ('category:' + str(p.get('categoryId', ''))) or
        scope == ('product:' + str(p['id']))
    )]
    count = len({p['id'] for p in eligible})
    required = int(c.get('min_items') or 0)
    
    if scope == 'all' and not reward_ids:
        base = subtotal
    else:
        base = sum(p['price'] * quantities[p['id']] for p in eligible)
        
    if not count or count < required:
        return {'error': 'Chưa đủ sản phẩm', 'amount': 0}
    if base < int(c.get('min_order') or 0):
        return {'error': 'Chưa đạt min_order', 'amount': 0}
        
    value = int(c.get('value') or 0)
    amount = 0
    gift = None
    selected = [p for p in products if p['id'] in reward_ids]
    kind = c.get('type')
    
    if kind == 'returning':
        amount = value
    elif kind == 'fixed':
        amount = value
    elif kind == 'percent':
        # In JS: Math.round(base * value / 100)
        # Note: In JS Math.round(x), x.5 rounds toward +infinity (e.g. 15.5 -> 16, -15.5 -> -15)
        amount = math.floor(base * value / 100 + 0.5)
    elif kind == 'cheapest':
        min_p = min(p['price'] for p in eligible)
        amount = math.floor(min_p * value / 100 + 0.5)
    elif kind == 'bundle':
        if count != required:
            return {'error': 'bundle count mismatch', 'amount': 0}
        amount = sum(p['price'] for p in eligible) - value
    elif kind == 'tier':
        tiers = c.get('tiers') or []
        eligible_tiers = [t['amount'] for t in tiers if count >= t.get('count', 0)]
        amount = max(eligible_tiers, default=0)
    elif kind == 'gift':
        if not reward_ids or selected:
            return {'error': 'gift invalid', 'amount': 0}
        gift = reward_ids[0]
        return {'amount': 0, 'gift': gift}
    elif kind in ('choice', 'addon'):
        if len(selected) != 1:
            return {'error': 'choice/addon invalid', 'amount': 0}
        amount = selected[0]['price'] - (value if kind == 'addon' else 0)
    else:
        return {'error': 'unsupported', 'amount': 0}
        
    if not gift and amount <= 0:
        return {'error': 'amount <= 0', 'amount': 0}
        
    cap = int(c.get('max_discount') or 0)
    advanced = (kind not in ('percent', 'fixed')) or (c.get('scope') and c.get('scope') != 'all') or (int(c.get('min_items') or 0) > 0)
    if cap and (kind in ('percent', 'cheapest') or not advanced):
        amount = min(amount, cap)
        
    limit = subtotal if kind in ('choice', 'addon') else base
    return {'amount': min(amount, limit), 'gift': gift}


def run_cross_parity_tests():
    print("=================================================================")
    print("PROMOTIONS PARITY SUITE: Python quote_coupon vs JS evaluateCoupon")
    print("=================================================================")
    
    test_cases = []
    
    # 1. Percent coupons with diverse odd / even subtotals and percentages
    percentages = [1, 2, 5, 10, 15, 20, 25, 33, 50, 75, 99]
    subtotals = [
        19999, 20000, 25001, 38000, 77777, 100000, 125555, 143999,
        150010, 160000, 161237, 199999, 250000, 500000, 999999, 1234567
    ]
    caps = [0, 15000, 20000, 50000, 100000]
    
    case_idx = 0
    passed = 0
    failed = 0
    
    for pct in percentages:
        for sub in subtotals:
            for cap in caps:
                case_idx += 1
                coupon = {
                    'code': f'TEST_PCT_{pct}',
                    'type': 'percent',
                    'value': pct,
                    'min_order': 0,
                    'max_discount': cap,
                    'scope': 'all',
                    'is_active': True
                }
                products = {
                    'p1': {'id': 'p1', 'name': 'P1', 'price': sub, 'type': 'excel'}
                }
                quantities = {'p1': 1}
                
                # Python quote_coupon
                try:
                    py_amount, py_gift = promotions.quote_coupon(coupon, products, quantities, sub)
                    py_error = None
                except ValueError as e:
                    py_amount = 0
                    py_gift = None
                    py_error = str(e)
                    
                # JS evaluateCoupon
                js_res = js_evaluate_coupon_sim(coupon, products, quantities, sub)
                js_amount = js_res.get('amount', 0)
                js_error = js_res.get('error')
                
                if (py_error is None and js_error is not None) or (py_error is not None and js_error is None):
                    print(f"[FAIL Eligibility] Case {case_idx}: sub={sub}, pct={pct}, cap={cap} -> py_err={py_error}, js_err={js_error}")
                    failed += 1
                elif py_amount != js_amount:
                    print(f"[FAIL Math] Case {case_idx}: sub={sub}, pct={pct}, cap={cap} -> py={py_amount}, js={js_amount}")
                    failed += 1
                else:
                    passed += 1
                    
    # 2. Fixed coupons
    fixed_values = [5000, 10000, 20000, 50000, 100000]
    for fval in fixed_values:
        for sub in subtotals:
            case_idx += 1
            coupon = {
                'code': f'TEST_FIXED_{fval}',
                'type': 'fixed',
                'value': fval,
                'min_order': 20000,
                'max_discount': 0,
                'scope': 'all',
                'is_active': True
            }
            products = {'p1': {'id': 'p1', 'name': 'P1', 'price': sub, 'type': 'excel'}}
            quantities = {'p1': 1}
            try:
                py_amount, py_gift = promotions.quote_coupon(coupon, products, quantities, sub)
                py_error = None
            except ValueError as e:
                py_amount = 0
                py_gift = None
                py_error = str(e)
                
            js_res = js_evaluate_coupon_sim(coupon, products, quantities, sub)
            js_amount = js_res.get('amount', 0)
            js_error = js_res.get('error')
            
            if (py_error is None and js_error is not None) or (py_error is not None and js_error is None):
                print(f"[FAIL Fixed Eligibility] Case {case_idx}: sub={sub}, fval={fval} -> py_err={py_error}, js_err={js_error}")
                failed += 1
            elif py_amount != js_amount:
                print(f"[FAIL Fixed Math] Case {case_idx}: sub={sub}, fval={fval} -> py={py_amount}, js={js_amount}")
                failed += 1
            else:
                passed += 1

    # 3. Cheapest coupons
    for pct in [10, 25, 50]:
        case_idx += 1
        products = {
            'p1': {'id': 'p1', 'name': 'P1', 'price': 38000, 'type': 'excel'},
            'p2': {'id': 'p2', 'name': 'P2', 'price': 19000, 'type': 'excel'},
            'p3': {'id': 'p3', 'name': 'P3', 'price': 55000, 'type': 'excel'}
        }
        quantities = {'p1': 1, 'p2': 1, 'p3': 1}
        sub = 38000 + 19000 + 55000
        coupon = {
            'code': 'CHEAPEST_DEAL',
            'type': 'cheapest',
            'value': pct,
            'min_order': 0,
            'scope': 'all',
            'is_active': True
        }
        py_amount, _ = promotions.quote_coupon(coupon, products, quantities, sub)
        js_res = js_evaluate_coupon_sim(coupon, products, quantities, sub)
        if py_amount != js_res['amount']:
            print(f"[FAIL Cheapest] py={py_amount}, js={js_res['amount']}")
            failed += 1
        else:
            passed += 1

    # 4. Bundle coupons
    case_idx += 1
    products = {
        'p1': {'id': 'p1', 'name': 'P1', 'price': 38000, 'type': 'excel'},
        'p2': {'id': 'p2', 'name': 'P2', 'price': 38000, 'type': 'excel'}
    }
    quantities = {'p1': 1, 'p2': 1}
    sub = 76000
    coupon = {
        'code': 'BUNDLE_2',
        'type': 'bundle',
        'value': 50000, # bundle price is 50.000 -> discount = 76.000 - 50.000 = 26.000
        'min_items': 2,
        'min_order': 0,
        'scope': 'all',
        'is_active': True
    }
    py_amount, _ = promotions.quote_coupon(coupon, products, quantities, sub)
    js_res = js_evaluate_coupon_sim(coupon, products, quantities, sub)
    if py_amount != js_res['amount'] or py_amount != 26000:
        print(f"[FAIL Bundle] py={py_amount}, js={js_res['amount']}")
        failed += 1
    else:
        passed += 1

    # 5. Tier coupons
    case_idx += 1
    coupon = {
        'code': 'TIER_DEAL',
        'type': 'tier',
        'tiers': [{'count': 2, 'amount': 15000}, {'count': 3, 'amount': 30000}],
        'min_order': 0,
        'scope': 'all',
        'is_active': True
    }
    py_amount, _ = promotions.quote_coupon(coupon, products, quantities, sub)
    js_res = js_evaluate_coupon_sim(coupon, products, quantities, sub)
    if py_amount != js_res['amount'] or py_amount != 15000:
        print(f"[FAIL Tier] py={py_amount}, js={js_res['amount']}")
        failed += 1
    else:
        passed += 1

    print(f"\nTotal test cases evaluated: {case_idx}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    
    if failed == 0:
        print("ALL PROMOTIONS PARITY TESTS PASSED PERFECTLY (100% IDENTICAL MATH)!")
        return 0
    else:
        print(f"PARITY DISCREPANCIES DETECTED: {failed} cases failed!")
        return 1

if __name__ == '__main__':
    exit(run_cross_parity_tests())
