from firebase_functions import https_fn, options
from firebase_admin import initialize_app, get_app, firestore, auth
import random
import string
from datetime import datetime, timezone
import json
import re
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_USER = "kiencam.work@gmail.com"
SMTP_PASS = "eohmiuavreukunhk"

def send_order_success_email(customer_email, customer_name, order_id, order_data):
    if not customer_email or "@" not in customer_email:
        print(f"[Email] Bỏ qua gửi email do địa chỉ không hợp lệ: {customer_email}")
        return False
    
    try:
        product_name = order_data.get("product_name") or "File Quản Lý Google Sheets"
        file_url = order_data.get("product_file_url") or "https://filedilam.web.app"
        items = order_data.get("items") or []

        # Tạo danh sách file nếu là combo nhiều file
        files_html = ""
        if isinstance(items, list) and len(items) > 0:
            files_html += "<ul style='margin: 10px 0; padding-left: 20px; line-height: 1.8;'>"
            for it in items:
                it_name = it.get("title") or it.get("name") or "File Google Sheets"
                it_url = it.get("file_url") or file_url
                files_html += f"<li><strong>{it_name}</strong>: <a href='{it_url}' style='color: #059669; font-weight: 600;' target='_blank'>[Bấm vào đây để tạo bản sao /copy]</a></li>"
            files_html += "</ul>"
        else:
            files_html = f"<div style='margin: 16px 0; text-align: center;'><a href='{file_url}' style='display: inline-block; padding: 14px 28px; background-color: #059669; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px;' target='_blank'>Mở Bản Sao Google Sheet Ngay</a></div>"

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #059669; padding: 24px; text-align: center; color: #ffffff;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">FILE ĐI LÀM</h1>
      <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Xác nhận kích hoạt đơn hàng thành công</p>
    </div>
    <div style="padding: 28px;">
      <p style="font-size: 15px; margin-top: 0;">Xin chào <strong>{customer_name or 'Quý khách'}</strong>,</p>
      <p style="font-size: 15px; line-height: 1.6;">Hệ thống <strong>File Đi Làm</strong> đã nhận được thanh toán cho mã đơn hàng <strong style="color: #059669; font-family: monospace;">{order_id}</strong>.</p>
      
      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 14px;">
        <div style="margin-bottom: 8px;"><strong>Sản phẩm:</strong> {product_name}</div>
        <div style="margin-bottom: 8px;"><strong>Mã đơn hàng:</strong> <span style="font-family: monospace;">{order_id}</span></div>
        <div><strong>Gói bản quyền:</strong> {order_data.get('package_name', 'Bản Tự Dùng')}</div>
      </div>

      <h3 style="font-size: 16px; color: #0f172a; margin-top: 24px;">Link truy cập và tạo bản sao:</h3>
      {files_html}

      <div style="margin-top: 24px; padding: 16px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; font-size: 13.5px; line-height: 1.6; color: #065f46;">
        <strong>3 bước bắt đầu sử dụng nhanh:</strong><br>
        1. Bấm vào link mở bản sao ở trên.<br>
        2. Bấm nút <strong>"Tạo bản sao" (Make a copy)</strong> để lưu file về Drive cá nhân của bạn.<br>
        3. File là của bạn vĩnh viễn, bạn có thể chỉnh sửa dữ liệu và chia sẻ cho cộng sự tùy ý.
      </div>

      <p style="font-size: 14px; color: #64748b; margin-top: 24px; line-height: 1.5;">
        Nếu cần hỗ trợ trong quá trình sử dụng, bạn có thể liên hệ trực tiếp qua Zalo/Hotline: <strong>0938 134 576</strong> (hoặc phản hồi trực tiếp email này).
      </p>
    </div>
    <div style="background-color: #f8fafc; padding: 16px 28px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
      © File Đi Làm · Kho File Quản Lý Tự Động Trên Google Sheets<br>
      Email này được gửi tự động từ hệ thống quản lý đơn hàng.
    </div>
  </div>
</body>
</html>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[File Đi Làm] Kích hoạt đơn hàng #{order_id} - Link nhận file Google Sheet"
        msg["From"] = f'"File Đi Làm" <{SMTP_USER}>'
        msg["To"] = customer_email
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        server = smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15)
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, [customer_email], msg.as_string())
        server.quit()
        print(f"[Email] Gửi email thành công tới {customer_email} cho đơn {order_id}")
        return True
    except Exception as e:
        print(f"[Email] Lỗi gửi email cho đơn {order_id} ({customer_email}): {e}")
        return False

try:
    get_app()
except ValueError:
    initialize_app()

def get_db():
    return firestore.client()

def generate_order_id(phone=None):
    digits = "".join(filter(str.isdigit, str(phone or "")))
    if len(digits) >= 4:
        return "DH" + digits[-4:] + "".join(random.choices(string.digits, k=2))
    return "DH" + "".join(random.choices(string.digits, k=6))

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, GET, PUT, OPTIONS",
    }

def serialize_datetime(val):
    if not val:
        return None
    if hasattr(val, "isoformat"):
        return val.isoformat()
    if hasattr(val, "seconds"):
        return datetime.fromtimestamp(val.seconds, tz=timezone.utc).isoformat()
    match = re.search(r'seconds=(\d+)', str(val))
    if match:
        return datetime.fromtimestamp(int(match.group(1)), tz=timezone.utc).isoformat()
    return str(val)

def extract_date_str(val):
    if not val:
        return ""
    if hasattr(val, "strftime"):
        return val.strftime("%Y-%m-%d")
    if hasattr(val, "seconds"):
        return datetime.fromtimestamp(val.seconds, tz=timezone.utc).strftime("%Y-%m-%d")
    match = re.search(r'seconds=(\d+)', str(val))
    if match:
        return datetime.fromtimestamp(int(match.group(1)), tz=timezone.utc).strftime("%Y-%m-%d")
    return str(val)[:10]

def json_response(payload, status=200):
    return https_fn.Response(json.dumps(payload, default=str), status=status, content_type="application/json", headers=cors_headers())

def require_user(req):
    header = req.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    try:
        return auth.verify_id_token(header.split(" ", 1)[1])
    except Exception:
        return None

@https_fn.on_request()
def api(req: https_fn.Request) -> https_fn.Response:
    db = get_db()
    path = req.path
    method = req.method
    
    if method == "OPTIONS":
        return https_fn.Response(status=204, headers=cors_headers())

    if path == "/admin/confirm-payment" and method == "POST":
        user = require_user(req)
        if not user or user.get("email") != "huynhkiencam151102@gmail.com":
            return json_response({"error": "ADMIN_AUTH_REQUIRED"}, 403)
        data = req.get_json(silent=True) or {}
        order_id = str(data.get("order_id") or "").strip().upper()
        if not order_id:
            return json_response({"error": "MISSING_ORDER_ID"}, 400)
        
        doc_ref = db.collection("orders").document(order_id)
        doc = doc_ref.get()
        if not doc.exists:
            return json_response({"error": "ORDER_NOT_FOUND"}, 404)
        
        order_data = doc.to_dict()
        now = datetime.now(timezone.utc)
        doc_ref.update({
            "status": "PAID",
            "paid_at": now,
            "manual_confirm_by": user.get("email")
        })

        # Cập nhật lượt mua sản phẩm
        target_pids = set()
        order_items = order_data.get("items")
        if isinstance(order_items, list) and len(order_items) > 0:
            for it in order_items:
                if isinstance(it, dict) and it.get("product_id"):
                    target_pids.add(it["product_id"])
        elif order_data.get("product_id"):
            target_pids.add(order_data["product_id"])

        for pid in target_pids:
            try:
                p_ref = db.collection("products").document(pid)
                if p_ref.get().exists:
                    p_ref.update({"downloads_count": firestore.Increment(1)})
            except Exception as e:
                print(f"[Admin Confirm] Failed to increment downloads_count for {pid}: {e}")

        # Tự động gửi email bàn giao file khi Admin xác nhận thanh toán thủ công
        cust_email = order_data.get("customer_email")
        cust_name = order_data.get("customer_name") or ""
        send_order_success_email(cust_email, cust_name, order_id, order_data)

        return json_response({
            "success": True,
            "order_id": order_id,
            "status": "PAID"
        })

    if path == "/admin/generate-magic-link" and method == "POST":
        user = require_user(req)
        if not user or user.get("email") != "huynhkiencam151102@gmail.com":
            return json_response({"error": "ADMIN_AUTH_REQUIRED"}, 403)
        data = req.get_json(silent=True) or {}
        target_uid = str(data.get("user_id") or "").strip()
        order_id = str(data.get("order_id") or "").strip()

        if not target_uid and order_id:
            order_doc = db.collection("orders").document(order_id).get()
            if order_doc.exists:
                target_uid = order_doc.to_dict().get("user_id")

        if not target_uid:
            return json_response({"error": "MISSING_USER_ID"}, 400)

        try:
            # Tạo Custom Token của Firebase Auth có hạn sử dụng
            custom_token = auth.create_custom_token(target_uid)
            token_str = custom_token.decode("utf-8") if isinstance(custom_token, bytes) else str(custom_token)
            magic_url = f"https://filedilam.web.app/?magic={token_str}&tab=my-files"
            return json_response({
                "magic_url": magic_url,
                "user_id": target_uid
            })
        except Exception as e:
            return json_response({"error": "FAILED_TO_CREATE_MAGIC_TOKEN", "detail": str(e)}, 500)

    if path == "/profile" and method in ("GET", "PUT"):
        user = require_user(req)
        if not user:
            return json_response({"error": "AUTH_REQUIRED"}, 401)
        profile_ref = db.collection("customer_profiles").document(user["uid"])
        if method == "GET":
            profile_doc = profile_ref.get()
            if not profile_doc.exists:
                return json_response({"error": "PROFILE_NOT_FOUND"}, 404)
            return json_response(profile_doc.to_dict())

        data = req.get_json(silent=True) or {}
        phone = "".join(ch for ch in str(data.get("phone", "")) if ch.isdigit())
        if len(phone) < 9 or len(phone) > 11:
            return json_response({"error": "INVALID_PHONE"}, 400)
        now = datetime.now(timezone.utc)
        existing = profile_ref.get()
        payload = {
            "user_id": user["uid"],
            "email": user.get("email", ""),
            "phone": phone,
            "auth_provider": data.get("auth_provider", "unknown"),
            "updated_at": now,
        }
        if not existing.exists:
            payload["created_at"] = now
        profile_ref.set(payload, merge=True)
        return json_response(payload)

    if path == "/orders" and method == "POST":
        user = require_user(req)
        if not user:
            return json_response({"error": "AUTH_REQUIRED"}, 401)
        data = req.get_json(silent=True) or {}
        profile_ref = db.collection("customer_profiles").document(user["uid"])
        profile_doc = profile_ref.get()
        
        phone = ""
        if profile_doc.exists:
            profile = profile_doc.to_dict()
            phone = "".join(ch for ch in str(profile.get("phone", "")) if ch.isdigit())
        
        if len(phone) < 9 or len(phone) > 11:
            req_phone = "".join(ch for ch in str(data.get("customer_phone", "")) if ch.isdigit())
            if 9 <= len(req_phone) <= 11:
                phone = req_phone
            elif user.get("phone_number"):
                user_p = "".join(ch for ch in str(user.get("phone_number", "")) if ch.isdigit())
                if 9 <= len(user_p) <= 11:
                    phone = user_p
            elif user.get("email", "").endswith("@khachhang.filedilam.vn"):
                email_p = "".join(ch for ch in user["email"].split("@")[0] if ch.isdigit())
                if 9 <= len(email_p) <= 11:
                    phone = email_p

            # Graceful fallback: never block an authenticated customer from creating an order
            if len(phone) < 9 or len(phone) > 11:
                phone = "09" + "".join(random.choices(string.digits, k=8))

            now = datetime.now(timezone.utc)
            profile_payload = {
                "user_id": user["uid"],
                "email": data.get("customer_email") or user.get("email", ""),
                "phone": phone,
                "auth_provider": data.get("auth_provider", "quick_checkout"),
                "updated_at": now,
            }
            if not profile_doc.exists:
                profile_payload["created_at"] = now
            profile_ref.set(profile_payload, merge=True)

        now = datetime.now(timezone.utc)
        req_product_id = str(data.get("product_id") or "")
        req_amount = int(data.get("amount") or 0)
        req_package_type = str(data.get("package_type") or "standard")
        req_package_name = str(data.get("package_name") or ("Bản Kèm 1-1 (1 buổi 1 tiếng)" if req_package_type == "coaching" else "Bản Tự Dùng"))

        # Check for existing PENDING order to reuse (prevents lost/duplicate orders on mobile app-switching)
        user_orders = db.collection("orders").where("user_id", "==", user["uid"]).stream()
        for doc in user_orders:
            o_data = doc.to_dict()
            if o_data.get("status") == "PENDING":
                if str(o_data.get("product_id") or "") == req_product_id and int(o_data.get("amount") or 0) == req_amount:
                    c_at = o_data.get("created_at")
                    age_sec = 999999
                    if hasattr(c_at, "timestamp"):
                        age_sec = (now - c_at).total_seconds()
                    elif hasattr(c_at, "seconds"):
                        age_sec = now.timestamp() - c_at.seconds
                    elif isinstance(c_at, str):
                        try:
                            age_sec = (now - datetime.fromisoformat(c_at.replace("Z", "+00:00"))).total_seconds()
                        except Exception:
                            pass
                    if age_sec <= 600:
                        c_at_str = c_at.isoformat() if hasattr(c_at, "isoformat") else str(c_at)
                        return json_response({
                            "order_id": o_data.get("id"),
                            "amount": o_data.get("amount", req_amount),
                            "transfer_note": o_data.get("id"),
                            "package_type": o_data.get("package_type", req_package_type),
                            "package_name": o_data.get("package_name", req_package_name),
                            "created_at": c_at_str,
                            "reused": True
                        })

        raw_items = data.get("items")
        items = []
        if isinstance(raw_items, list) and len(raw_items) > 0:
            for it in raw_items:
                if isinstance(it, dict):
                    items.append({
                        "product_id": str(it.get("product_id") or ""),
                        "product_name": str(it.get("product_name") or ""),
                        "product_file_url": str(it.get("product_file_url") or ""),
                        "product_type": str(it.get("product_type") or "google_sheets"),
                        "price": int(it.get("price") or 0)
                    })

        customer_email = data.get("customer_email") or user.get("email", "")
        order_id = generate_order_id(phone)
        while db.collection("orders").document(order_id).get().exists:
            order_id = generate_order_id(phone)
            
        doc_ref = db.collection("orders").document(order_id)
        order_doc_data = {
            "id": order_id,
            "customer_email": customer_email,
            "customer_phone": phone,
            "user_id": user["uid"],
            "product_id": req_product_id,
            "product_name": data.get("product_name", ""),
            "product_file_url": data.get("product_file_url", ""),
            "product_type": data.get("product_type", "excel"),
            "amount": req_amount,
            "package_type": req_package_type,
            "package_name": req_package_name,
            "status": "PENDING",
            "created_at": now
        }
        if items:
            order_doc_data["items"] = items

        doc_ref.set(order_doc_data)
        
        return json_response({
            "order_id": order_id,
            "amount": req_amount,
            "transfer_note": order_id,
            "package_type": req_package_type,
            "package_name": req_package_name,
            "created_at": now.isoformat(),
            "reused": False
        })
        
    elif path.startswith("/orders/") and method == "GET":
        user = require_user(req)
        if not user:
            return json_response({"error": "AUTH_REQUIRED"}, 401)
        order_id = path.split("/")[-1]
        doc = db.collection("orders").document(order_id).get()
        if not doc.exists:
            return json_response({"error": "ORDER_NOT_FOUND"}, 404)
        
        order_data = doc.to_dict()
        if order_data.get("user_id") != user["uid"]:
            return json_response({"error": "FORBIDDEN"}, 403)
        return json_response({
            "order_id": order_data.get("id"),
            "status": order_data.get("status"),
            "amount": order_data.get("amount"),
            "product_id": order_data.get("product_id", ""),
            "product_name": order_data.get("product_name", ""),
            "product_type": order_data.get("product_type", "excel"),
            "package_type": order_data.get("package_type", "standard"),
            "package_name": order_data.get("package_name", "Bản Tự Dùng"),
            "items": order_data.get("items") if order_data.get("status") == "PAID" else None,
            "product_file_url": order_data.get("product_file_url") if order_data.get("status") == "PAID" else None
        })
        
    elif path == "/my-orders" and method == "GET":
        user = require_user(req)
        if not user:
            return json_response({"error": "AUTH_REQUIRED"}, 401)
        
        docs = db.collection("orders").where("user_id", "==", user["uid"]).where("status", "==", "PAID").stream()
        orders = []
        for doc in docs:
            order_data = doc.to_dict()
            orders.append({
                "order_id": order_data.get("id"),
                "status": "PAID",
                "product_id": order_data.get("product_id", ""),
                "product_name": order_data.get("product_name"),
                "product_file_url": order_data.get("product_file_url"),
                "product_type": order_data.get("product_type", "excel"),
                "package_type": order_data.get("package_type", "standard"),
                "package_name": order_data.get("package_name", "Bản Tự Dùng"),
                "items": order_data.get("items") or [],
                "amount": order_data.get("amount"),
                "has_reviewed": bool(order_data.get("has_reviewed")),
                "review_stars": order_data.get("review_stars", 0),
                "review_comment": order_data.get("review_comment", ""),
                "created_at": order_data.get("created_at")
            })
            
        orders.sort(key=lambda x: str(x.get("created_at") or ""), reverse=True)
        return json_response(orders)

    elif path == "/reviews" and method == "POST":
        user = require_user(req)
        if not user:
            return json_response({"error": "AUTH_REQUIRED"}, 401)
        data = req.get_json(silent=True) or {}
        order_id = str(data.get("order_id", "")).strip().upper()
        if not order_id:
            return json_response({"error": "MISSING_ORDER_ID"}, 400)
            
        try:
            stars = int(data.get("stars", 5))
            if stars < 1 or stars > 5:
                stars = 5
        except (ValueError, TypeError):
            stars = 5

        comment = str(data.get("comment", "")).strip()[:500]

        order_doc = db.collection("orders").document(order_id).get()
        if not order_doc.exists:
            return json_response({"error": "ORDER_NOT_FOUND"}, 404)
        order = order_doc.to_dict()

        if order.get("user_id") != user["uid"] and order.get("customer_email") != user.get("email"):
            return json_response({"error": "PERMISSION_DENIED"}, 403)
        if order.get("status") != "PAID":
            return json_response({"error": "ORDER_NOT_PAID"}, 400)

        product_id = order.get("product_id") or data.get("product_id")
        now = datetime.now(timezone.utc)

        db.collection("reviews").document(order_id).set({
            "id": order_id,
            "order_id": order_id,
            "user_id": user["uid"],
            "customer_phone": order.get("customer_phone", ""),
            "product_id": product_id,
            "product_name": order.get("product_name", ""),
            "stars": stars,
            "comment": comment,
            "created_at": now
        })

        db.collection("orders").document(order_id).set({
            "has_reviewed": True,
            "review_stars": stars,
            "review_comment": comment,
            "reviewed_at": now
        }, merge=True)

        rating_avg = stars
        rating_count = 1
        if product_id:
            try:
                rev_stream = db.collection("reviews").where("product_id", "==", product_id).stream()
                all_stars = [r.to_dict().get("stars", 5) for r in rev_stream if r.to_dict().get("stars")]
                if all_stars:
                    rating_count = len(all_stars)
                    rating_avg = round(sum(all_stars) / rating_count, 1)
                db.collection("products").document(product_id).set({
                    "rating_avg": rating_avg,
                    "rating_count": rating_count
                }, merge=True)
            except Exception as re_err:
                print(f"Error updating product ratings: {re_err}")

        return json_response({
            "success": True,
            "order_id": order_id,
            "stars": stars,
            "comment": comment,
            "rating_avg": rating_avg,
            "rating_count": rating_count
        })

    elif path == "/admin/stats" and method == "GET":
        user = require_user(req)
        if not user or user.get("email") != "huynhkiencam151102@gmail.com":
            return json_response({"error": "ADMIN_AUTH_REQUIRED"}, 403)
        
        now = datetime.now(timezone.utc)
        today_str = now.strftime("%Y-%m-%d")
        month_str = now.strftime("%Y-%m")
        
        orders_stream = db.collection("orders").stream()
        total_revenue = 0
        today_revenue = 0
        month_revenue = 0
        paid_orders_count = 0
        total_orders_count = 0
        unique_customers = set()
        product_sales = {}
        daily_revenue_map = {}
        
        from datetime import timedelta
        for i in range(13, -1, -1):
            day = (now - timedelta(days=i)).strftime("%Y-%m-%d")
            daily_revenue_map[day] = {"date": day, "revenue": 0, "count": 0}

        for doc in orders_stream:
            total_orders_count += 1
            o = doc.to_dict()
            status = str(o.get("status", "")).upper()
            amount = int(o.get("amount") or 0)
            
            created_at = o.get("created_at") or o.get("paid_at")
            created_str = extract_date_str(created_at)
            created_month = created_str[:7]
            
            if status == "PAID":
                paid_orders_count += 1
                total_revenue += amount
                
                cust_id = o.get("customer_phone") or o.get("customer_email") or o.get("user_id")
                if cust_id:
                    unique_customers.add(cust_id)
                    
                if created_str == today_str:
                    today_revenue += amount
                if created_month == month_str:
                    month_revenue += amount
                    
                if created_str in daily_revenue_map:
                    daily_revenue_map[created_str]["revenue"] += amount
                    daily_revenue_map[created_str]["count"] += 1
                    
                # Ghi nhận doanh số / lượt mua cho từng sản phẩm (bao gồm tách các item trong combo)
                order_items = o.get("items")
                if isinstance(order_items, list) and len(order_items) > 0:
                    item_count = len(order_items)
                    for it in order_items:
                        sub_pid = it.get("product_id") or "other"
                        sub_pname = it.get("product_name") or "File con"
                        # Phân bổ doanh thu nếu có giá item hoặc chia đều
                        sub_price = int(it.get("price") or 0)
                        sub_rev = sub_price if sub_price > 0 else round(amount / item_count)
                        if sub_pid not in product_sales:
                            product_sales[sub_pid] = {
                                "id": sub_pid,
                                "name": sub_pname,
                                "count": 0,
                                "revenue": 0,
                                "price": sub_price or amount
                            }
                        product_sales[sub_pid]["count"] += 1
                        product_sales[sub_pid]["revenue"] += sub_rev
                else:
                    pid = o.get("product_id") or "other"
                    pname = o.get("product_name") or "File tổng hợp"
                    if pid not in product_sales:
                        product_sales[pid] = {
                            "id": pid,
                            "name": pname,
                            "count": 0,
                            "revenue": 0,
                            "price": amount
                        }
                    product_sales[pid]["count"] += 1
                    product_sales[pid]["revenue"] += amount

        best_sellers = sorted(product_sales.values(), key=lambda x: x["revenue"], reverse=True)[:10]
        daily_list = sorted(daily_revenue_map.values(), key=lambda x: x["date"])
        
        return json_response({
            "total_revenue": total_revenue,
            "today_revenue": today_revenue,
            "month_revenue": month_revenue,
            "paid_orders_count": paid_orders_count,
            "total_orders_count": total_orders_count,
            "customers_count": len(unique_customers),
            "aov": round(total_revenue / paid_orders_count) if paid_orders_count > 0 else 0,
            "daily_revenue": daily_list,
            "best_sellers": best_sellers
        })

    elif path == "/admin/orders" and method == "GET":
        user = require_user(req)
        if not user or user.get("email") != "huynhkiencam151102@gmail.com":
            return json_response({"error": "ADMIN_AUTH_REQUIRED"}, 403)
            
        orders_stream = db.collection("orders").stream()
        orders = []
        for doc in orders_stream:
            o = doc.to_dict()
            orders.append({
                "order_id": doc.id,
                "amount": o.get("amount", 0),
                "status": o.get("status", "PENDING"),
                "product_id": o.get("product_id", ""),
                "product_name": o.get("product_name", ""),
                "package_type": o.get("package_type", "standard"),
                "package_name": o.get("package_name", "Bản Tự Dùng"),
                "product_file_url": o.get("product_file_url", ""),
                "product_type": o.get("product_type", "excel"),
                "items": o.get("items") or [],
                "customer_phone": o.get("customer_phone", ""),
                "customer_email": o.get("customer_email", ""),
                "user_id": o.get("user_id", ""),
                "has_reviewed": bool(o.get("has_reviewed")),
                "review_stars": o.get("review_stars", 0),
                "review_comment": o.get("review_comment", ""),
                "created_at": serialize_datetime(o.get("created_at")),
                "paid_at": serialize_datetime(o.get("paid_at"))
            })
        orders.sort(key=lambda x: str(x.get("created_at") or ""), reverse=True)
        return json_response(orders)
        
    elif path == "/webhooks/sepay" and method == "POST":
        payload = req.get_json(silent=True) or {}
        transfer_type = str(payload.get("transferType", "in")).lower()
        if transfer_type == "in":
            raw_content = str(payload.get("content") or payload.get("description") or payload.get("code") or "")
            content_upper = raw_content.upper()
            compact_content = re.sub(r'[^A-Z0-9]', '', content_upper)
            
            try:
                amount_paid = int(float(payload.get("transferAmount") or 0))
            except (ValueError, TypeError):
                amount_paid = 0

            matched_doc = None
            matched_order = None

            # Stream all PENDING orders
            pending_orders = list(db.collection("orders").where("status", "==", "PENDING").stream())

            # TIER 1: Match by exact Order ID (e.g. DH120289 or DH324085)
            for doc in pending_orders:
                order = doc.to_dict()
                order_id = str(order.get("id", "")).upper()
                compact_order_id = re.sub(r'[^A-Z0-9]', '', order_id)
                
                if compact_order_id and compact_order_id in compact_content:
                    if amount_paid >= int(order.get("amount", 0)):
                        matched_doc = doc
                        matched_order = order
                        print(f"[SePay] Tier 1 matched Order ID: {order_id}")
                        break

            # TIER 2 (Fail-safe): If customer omitted Order ID and typed their Phone Number
            if not matched_doc:
                candidate_matches = []
                for doc in pending_orders:
                    order = doc.to_dict()
                    cust_phone = re.sub(r'\D', '', str(order.get("customer_phone", "")))
                    if len(cust_phone) >= 9:
                        phone_without_zero = cust_phone[1:] if cust_phone.startswith("0") else cust_phone
                        # Check if full phone or 9 digits without leading 0 appears in transfer content
                        if (cust_phone in compact_content) or (phone_without_zero in compact_content):
                            order_amount = int(order.get("amount", 0))
                            if amount_paid >= order_amount:
                                is_exact_amount = (order_amount == amount_paid)
                                candidate_matches.append((doc, order, is_exact_amount))
                
                if candidate_matches:
                    # Prefer exact amount match first, otherwise most recent
                    candidate_matches.sort(key=lambda x: (1 if x[2] else 0), reverse=True)
                    matched_doc = candidate_matches[0][0]
                    matched_order = candidate_matches[0][1]
                    print(f"[SePay] Tier 2 matched Phone for Order ID: {matched_order.get('id')}")

            if matched_doc and matched_order:
                now = datetime.now(timezone.utc)
                matched_doc.reference.update({
                    "status": "PAID",
                    "paid_at": now,
                    "sepay_transaction_id": payload.get("id"),
                    "reference_code": payload.get("referenceCode")
                })

                # Cập nhật lượt tải / lượt mua cho sản phẩm
                # Nếu đơn hàng có danh sách items (combo gồm nhiều file), tăng downloads_count cho từng file
                target_pids = set()
                order_items = matched_order.get("items")
                if isinstance(order_items, list) and len(order_items) > 0:
                    for it in order_items:
                        it_pid = it.get("product_id")
                        if it_pid:
                            target_pids.add(str(it_pid))
                
                # Bổ sung product_id gốc nếu có
                product_id = matched_order.get("product_id")
                if product_id:
                    target_pids.add(str(product_id))

                if target_pids:
                    try:
                        from google.cloud import firestore as gc_firestore
                        for pid in target_pids:
                            db.collection("products").document(pid).set({
                                "downloads_count": gc_firestore.Increment(1)
                            }, merge=True)
                    except Exception as pe:
                        print(f"Lỗi cập nhật downloads_count: {pe}")

                print(f"Kich hoat file {matched_order.get('product_file_url')} cho {matched_order.get('customer_email')}")
                
                # Tự động gửi email bàn giao file cho khách hàng qua kiencam.work@gmail.com
                cust_email = matched_order.get("customer_email")
                cust_name = matched_order.get("customer_name") or ""
                send_order_success_email(cust_email, cust_name, matched_order.get("id"), matched_order)
        return json_response({"success": True})

    return json_response({"error": "NOT_FOUND"}, 404)
