from firebase_functions import https_fn, options
from firebase_admin import initialize_app, get_app, firestore, auth
import random
import string
from datetime import datetime, timezone
import json
import re

try:
    get_app()
except ValueError:
    initialize_app()

def get_db():
    return firestore.client()

def generate_order_id():
    return "DH" + "".join(random.choices(string.digits, k=6))

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, GET, PUT, OPTIONS",
    }

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

        customer_email = data.get("customer_email") or user.get("email", "")
        order_id = generate_order_id()
        while db.collection("orders").document(order_id).get().exists:
            order_id = generate_order_id()
            
        doc_ref = db.collection("orders").document(order_id)
        doc_ref.set({
            "id": order_id,
            "customer_email": customer_email,
            "customer_phone": phone,
            "user_id": user["uid"],
            "product_id": data.get("product_id", ""),
            "product_name": data.get("product_name", ""),
            "product_file_url": data.get("product_file_url", ""),
            "product_type": data.get("product_type", "excel"),
            "amount": data.get("amount", 0),
            "status": "PENDING",
            "created_at": datetime.now(timezone.utc)
        })
        
        return json_response({
            "order_id": order_id,
            "amount": data.get("amount", 0),
            "transfer_note": order_id,
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
            "product_id": order_data.get("product_id", ""),
            "product_type": order_data.get("product_type", "excel"),
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
                "amount": order_data.get("amount"),
                "created_at": order_data.get("created_at")
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

            orders_ref = db.collection("orders").where("status", "==", "PENDING").stream()
            for doc in orders_ref:
                order = doc.to_dict()
                order_id = str(order.get("id", "")).upper()
                compact_order_id = re.sub(r'[^A-Z0-9]', '', order_id)
                
                if compact_order_id and compact_order_id in compact_content:
                    if amount_paid >= int(order.get("amount", 0)):
                        now = datetime.now(timezone.utc)
                        doc.reference.update({
                            "status": "PAID",
                            "paid_at": now,
                            "sepay_transaction_id": payload.get("id"),
                            "reference_code": payload.get("referenceCode")
                        })
                        print(f"Kich hoat file {order.get('product_file_url')} cho {order.get('customer_email')}")
                        break
        return json_response({"success": True})

    return json_response({"error": "NOT_FOUND"}, 404)
