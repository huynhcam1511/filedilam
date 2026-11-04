"""Quote checkout promotions using catalog records and server-side prices."""


def quote_coupon(coupon, products, quantities, subtotal):
    scope = coupon.get("scope") or "all"
    rewards = coupon.get("reward_ids") or []
    eligible = {
        pid: p for pid, p in products.items()
        if p["price"] > 0 and pid not in rewards and (
            scope == "all" or scope == "product:" + pid
            or scope == "category:" + str(p.get("categoryId", ""))
            or (scope == "combo" and p.get("type") == "combo")
            or (scope == "single" and p.get("type") != "combo")
        )
    }
    count = len(eligible)
    required = int(coupon.get("min_items") or 0)
    base = subtotal if scope == "all" and not rewards else sum(
        p["price"] * quantities[pid] for pid, p in eligible.items()
    )
    if not count or count < required or base < int(coupon.get("min_order") or 0):
        raise ValueError("Giỏ hàng chưa đủ điều kiện của mã.")
    kind = coupon["type"]
    value = int(coupon.get("value") or 0)
    selected = [pid for pid in products if pid in rewards]
    if kind == "gift":
        if selected or len(rewards) != 1:
            raise ValueError("File tặng phải khác file trong giỏ.")
        return 0, rewards[0]
    if kind in ("choice", "addon"):
        if len(selected) != 1:
            raise ValueError("Chọn đúng một file quà hoặc mua kèm.")
        amount = products[selected[0]]["price"] - (value if kind == "addon" else 0)
        base = subtotal
    elif kind == "bundle":
        if count != required:
            raise ValueError("Số sản phẩm chưa khớp với nhóm đồng giá.")
        amount = sum(p["price"] for p in eligible.values()) - value
    elif kind == "tier":
        amount = max((t["amount"] for t in coupon["tiers"] if count >= t["count"]), default=0)
    elif kind in ("percent", "cheapest"):
        price = base if kind == "percent" else min(p["price"] for p in eligible.values())
        amount = (price * value + 50) // 100
    elif kind in ("fixed", "returning"):
        amount = value
    else:
        raise ValueError("Chương trình chưa được hỗ trợ.")
    if amount <= 0:
        raise ValueError("Mã chưa tạo được ưu đãi cho giỏ hàng này.")
    cap = int(coupon.get("max_discount") or 0)
    if cap and (kind in ("percent", "cheapest") or (kind == "fixed" and scope == "all" and not required)):
        amount = min(amount, cap)
    return min(amount, base), None


def build_promotion_order(db, data, codes, today, user_id, now):
    def catalog(pid):
        if not isinstance(pid, str) or not pid or "/" in pid:
            raise ValueError("Mã sản phẩm không hợp lệ.")
        product = db.collection("products").document(pid).get().to_dict()
        if not product:
            raise ValueError("Sản phẩm không còn trong danh mục.")
        return product

    def order_item(pid, product, quantity, gift=False):
        return {
            "product_id": pid, "product_name": product["name"],
            "product_file_url": product.get("sheetUrl") or product.get("delivery_link") or product.get("fileUrl", ""),
            "product_type": product.get("type") or "excel",
            "price": 0 if gift else product["price"], "quantity": quantity, "is_gift": gift,
        }

    products, quantities, items = {}, {}, []
    for item in data.get("items") or [{"product_id": data.get("product_id")}]:
        pid = item["product_id"]
        quantity = item.get("quantity", 1)
        if pid in products or type(quantity) is not int or quantity < 1:
            raise ValueError("Số lượng sản phẩm không hợp lệ.")
        product = catalog(pid)
        products[pid], quantities[pid] = product, quantity
        items.append(order_item(pid, product, quantity))
    first = next(iter(products.values()))
    subtotal = sum(p["price"] * quantities[pid] for pid, p in products.items())
    if data.get("package_type") == "coaching" and first.get("hasCoaching"):
        subtotal += max(0, (first.get("coachingPrice") or 0) - first["price"])
    discount = 0
    if len(set(codes)) != len(codes):
        raise ValueError("Mã giảm giá bị trùng.")
    for code in codes:
        if not isinstance(code, str) or not code or "/" in code:
            raise ValueError("Mã giảm giá không hợp lệ.")
        coupons = db.collection("coupons")
        c = coupons.document(code).get().to_dict()
        if not c:
            c = next((d.to_dict() for d in coupons.where("code", "==", code).limit(1).stream()), None)
        if not c or not c.get("is_active") or (c.get("start_date") or "") > today or (c.get("end_date") or "9999") < today:
            raise ValueError("Mã giảm giá không còn hiệu lực.")
        if len(codes) > 1 and (c["type"] not in ("fixed", "percent") or c.get("min_items") or c.get("scope", "all") != "all"):
            raise ValueError("Chương trình này áp dụng riêng.")
        if c["type"] == "returning":
            previous = db.collection("orders").where("user_id", "==", user_id).where("status", "==", "PAID").stream()
            times = [d.to_dict() for d in previous]
            paid = [order.get("paid_at") or order.get("created_at") for order in times]
            if not any(hasattr(t, "timestamp") and 0 <= now.timestamp() - t.timestamp() <= int(c["return_days"]) * 86400 for t in paid):
                raise ValueError("Tài khoản chưa có đơn đã thanh toán trong thời gian áp dụng.")
        amount, gift = quote_coupon(c, products, quantities, subtotal)
        discount += amount
        if gift:
            product = catalog(gift)
            entry = order_item(gift, product, 1, True)
            if not entry["product_file_url"]:
                raise ValueError("File quà chưa có liên kết bàn giao.")
            items.append(entry)
    discount = min(subtotal, discount)
    if int(data.get("amount") or 0) != subtotal - discount:
        raise ValueError("Giá hoặc chương trình đã thay đổi. Vui lòng tải lại giỏ hàng.")
    return items, discount
