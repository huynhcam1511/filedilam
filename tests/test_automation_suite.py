"""
Automated Verification Suite for File Đi Làm Automation Features.
Hermetic, standalone unittest test harness testing:
1. Phone normalization & 1-tap Zalo URL generation (Python & JavaScript).
2. SePay webhook handling, PAID status updates, customer delivery email,
   and instant Admin "Nổ tiền" email with exact subject format and Zalo link.
3. Automated PENDING order scanner (10-60 min window), dual email dispatch
   (VietQR customer reminder & Admin summary), reminder_sent_at flag,
   and 100% idempotency on re-run.
4. Admin frontend static verification: normalizePhoneNumber, inline table button
   with event.stopPropagation(), inspector panel button, and scoped CSS styles.
"""
from __future__ import annotations

import base64
import email
from email.header import decode_header
import json
import os
import re
import smtplib
import subprocess
import sys
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

# Configure UTF-8 encoding for standard streams to prevent Windows console encoding issues
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Setup workspace paths hermetically
WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FUNCTIONS_DIR = os.path.join(WORKSPACE_DIR, "functions")
SITE_PACKAGES_DIR = os.path.join(FUNCTIONS_DIR, "venv", "Lib", "site-packages")

for p in (FUNCTIONS_DIR, SITE_PACKAGES_DIR):
    if p not in sys.path:
        sys.path.insert(0, p)

# Import backend module
import main


# ==============================================================================
# HERMETIC TEST HARNESS INFRASTRUCTURE
# ==============================================================================

def decode_mime_header(header_val: str | None) -> str:
    """Decode RFC 2047 MIME encoded-words header into unicode string."""
    if not header_val:
        return ""
    try:
        parts = decode_header(header_val)
        decoded = []
        for text, encoding in parts:
            if isinstance(text, bytes):
                decoded.append(text.decode(encoding or "utf-8", errors="replace"))
            else:
                decoded.append(str(text))
        return "".join(decoded)
    except Exception:
        return str(header_val)


def _apply_val(existing, new_val):
    """Handle Firestore Increment transform objects and plain updates."""
    if hasattr(new_val, "value"):
        base = existing if isinstance(existing, (int, float)) else 0
        return base + new_val.value
    return new_val


class MockDocumentSnapshot:
    """In-memory simulation of google.cloud.firestore.DocumentSnapshot."""
    def __init__(self, doc_id: str, data: dict | None, ref: MockDocumentReference):
        self.id = doc_id
        self._data = data.copy() if data else {}
        self.reference = ref
        self.exists = bool(data)

    def to_dict(self) -> dict:
        return self._data.copy()


class MockDocumentReference:
    """In-memory simulation of google.cloud.firestore.DocumentReference."""
    def __init__(self, doc_id: str, initial_data: dict | None = None):
        self.id = doc_id
        self.data: dict = initial_data.copy() if initial_data else {}

    def get(self) -> MockDocumentSnapshot:
        return MockDocumentSnapshot(self.id, self.data, self)

    def update(self, update_dict: dict) -> None:
        for k, v in update_dict.items():
            self.data[k] = _apply_val(self.data.get(k), v)

    def set(self, set_dict: dict, merge: bool = False) -> None:
        if merge:
            for k, v in set_dict.items():
                self.data[k] = _apply_val(self.data.get(k), v)
        else:
            self.data = {k: _apply_val(None, v) for k, v in set_dict.items()}

    def delete(self) -> None:
        self.data.clear()


class MockQuery:
    """In-memory simulation of google.cloud.firestore.Query with filter support."""
    def __init__(self, collection: MockCollectionReference, filters: list | None = None):
        self.collection = collection
        self.filters = list(filters) if filters else []

    def where(self, field: str, op: str, value: any) -> MockQuery:
        new_filters = list(self.filters)
        new_filters.append((field, op, value))
        return MockQuery(self.collection, new_filters)

    def stream(self):
        for doc_id, doc_ref in list(self.collection.docs.items()):
            data = doc_ref.data
            if not data:
                continue
            matches = True
            for field, op, val in self.filters:
                doc_val = data.get(field)
                if op == "==":
                    if doc_val != val:
                        matches = False
                        break
                elif op == "!=":
                    if doc_val == val:
                        matches = False
                        break
                elif op == "<":
                    if doc_val is None or doc_val >= val:
                        matches = False
                        break
                elif op == "<=":
                    if doc_val is None or doc_val > val:
                        matches = False
                        break
                elif op == ">":
                    if doc_val is None or doc_val <= val:
                        matches = False
                        break
                elif op == ">=":
                    if doc_val is None or doc_val < val:
                        matches = False
                        break
                elif op == "in":
                    if val is None or doc_val not in val:
                        matches = False
                        break
            if matches:
                yield MockDocumentSnapshot(doc_id, data, doc_ref)


class MockCollectionReference:
    """In-memory simulation of google.cloud.firestore.CollectionReference."""
    def __init__(self, name: str):
        self.name = name
        self.docs: dict[str, MockDocumentReference] = {}

    def document(self, doc_id: str | None = None) -> MockDocumentReference:
        if not doc_id:
            import uuid
            doc_id = str(uuid.uuid4())
        if doc_id not in self.docs:
            self.docs[doc_id] = MockDocumentReference(doc_id)
        return self.docs[doc_id]

    def where(self, field: str, op: str, value: any) -> MockQuery:
        return MockQuery(self, [(field, op, value)])

    def stream(self):
        for doc_id, doc_ref in list(self.docs.items()):
            if doc_ref.data:
                yield MockDocumentSnapshot(doc_id, doc_ref.data, doc_ref)


class MockFirestoreDB:
    """Hermetic in-memory Firestore client replacement."""
    def __init__(self):
        self.collections: dict[str, MockCollectionReference] = {}

    def collection(self, name: str) -> MockCollectionReference:
        if name not in self.collections:
            self.collections[name] = MockCollectionReference(name)
        return self.collections[name]


class CapturingSMTP:
    """Hermetic replacement for smtplib.SMTP_SSL capturing all sent emails."""
    sent_messages: list[dict] = []

    def __init__(self, host: str, port: int, timeout: int = 15):
        self.host = host
        self.port = port
        self.timeout = timeout

    def login(self, user: str, password: str):
        return (235, b"2.7.0 Authentication successful")

    def sendmail(self, from_addr: str, to_addrs: list | str, msg_str: str | bytes):
        if isinstance(msg_str, bytes):
            parsed = email.message_from_bytes(msg_str)
            raw_str = msg_str.decode("utf-8", errors="replace")
        else:
            parsed = email.message_from_string(str(msg_str))
            raw_str = str(msg_str)

        subject = decode_mime_header(parsed.get("Subject", ""))
        from_hdr = decode_mime_header(parsed.get("From", ""))
        to_hdr = decode_mime_header(parsed.get("To", ""))
        reply_to_hdr = decode_mime_header(parsed.get("Reply-To", ""))

        plain_text = ""
        html_text = ""
        if parsed.is_multipart():
            for part in parsed.walk():
                ctype = part.get_content_type()
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    decoded_part = payload.decode(charset, errors="replace")
                    if ctype == "text/plain":
                        plain_text += decoded_part
                    elif ctype == "text/html":
                        html_text += decoded_part
        else:
            payload = parsed.get_payload(decode=True)
            if payload:
                charset = parsed.get_content_charset() or "utf-8"
                decoded_body = payload.decode(charset, errors="replace")
                if parsed.get_content_type() == "text/html":
                    html_text = decoded_body
                else:
                    plain_text = decoded_body

        message_record = {
            "from": from_addr,
            "to": to_addrs if isinstance(to_addrs, list) else [to_addrs],
            "subject": subject,
            "raw_subject": parsed.get("Subject", ""),
            "from_header": from_hdr,
            "to_header": to_hdr,
            "reply_to": reply_to_hdr,
            "plain_text": plain_text,
            "html_text": html_text,
            "raw": raw_str,
            "message": parsed,
        }
        CapturingSMTP.sent_messages.append(message_record)
        return {}

    def quit(self):
        pass

    def close(self):
        pass


class MockUrlResponse:
    """Mock context-managed response for urllib.request.urlopen."""
    def __init__(self, data: bytes, status: int = 200):
        self._data = data
        self.status = status

    def read(self) -> bytes:
        return self._data

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass


def mock_urlopen(req, *args, **kwargs):
    """Returns valid mock VietQR response with 1x1 png base64 without network calls."""
    dummy_payload = json.dumps({
        "code": "00",
        "data": {
            "qrDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        }
    }).encode("utf-8")
    return MockUrlResponse(dummy_payload, 200)


class MockRequest:
    """Mock HTTP Request compatible with firebase_functions https_fn.Request."""
    def __init__(self, path: str, method: str, json_data: dict | None = None, headers: dict | None = None):
        self.path = path
        self.method = method
        self._json_data = json_data or {}
        self.headers = headers or {}

    def get_json(self, silent: bool = True):
        return self._json_data


# ==============================================================================
# TEST CASE CLASS 1: PHONE NORMALIZATION & ZALO LINK GENERATION
# ==============================================================================

class TestPhoneNormalization(unittest.TestCase):
    """
    Test suite for Python normalize_vietnam_phone and get_zalo_link helpers.
    Verifies 16+ domestic and international variations, edge cases, and aliases.
    """

    def test_phone_normalization_14_plus_variations(self):
        test_matrix = [
            ("0912345678", "0912345678", "Standard 10-digit format"),
            ("0912 345 678", "0912345678", "Space-separated format"),
            ("+84 912 345 678", "0912345678", "International with plus and spaces"),
            ("+84-912-345-678", "0912345678", "International with plus and dashes"),
            ("+84912345678", "0912345678", "International with plus no space"),
            ("84912345678", "0912345678", "Country code 84 without plus"),
            ("0084912345678", "0912345678", "IDD prefix 0084"),
            ("0084 912 345 678", "0912345678", "IDD prefix 0084 with spaces"),
            ("0912.345.678", "0912345678", "Dot-separated format"),
            ("(0912) 345 678", "0912345678", "Parentheses area code style"),
            ("912345678", "0912345678", "9 digits missing leading zero"),
            ("0389123456", "0389123456", "Viettel mobile prefix (03x)"),
            ("0589123456", "0589123456", "Vietnamobile prefix (05x)"),
            ("0789123456", "0789123456", "Vinaphone prefix (07x)"),
            ("0889123456", "0889123456", "Vinaphone/Mobifone prefix (08x)"),
            ("+84-912.345 678", "0912345678", "Mixed plus, dash, dot, and space"),
        ]

        for raw_input, expected_phone, description in test_matrix:
            with self.subTest(raw_input=raw_input, case=description):
                clean = main.normalize_vietnam_phone(raw_input)
                self.assertEqual(clean, expected_phone, f"Failed for case: {description}")
                zalo_url = main.get_zalo_link(raw_input)
                self.assertEqual(zalo_url, f"https://zalo.me/{expected_phone}")

    def test_phone_normalization_invalid_and_edge_cases(self):
        invalid_cases = [
            ("invalid_text", "Pure alphabetic string"),
            ("Khach vang lai", "Guest description string"),
            ("12345", "Too short (< 9 digits)"),
            ("091234567890123", "Too long (> 11 digits)"),
            ("", "Empty string"),
            ("   ", "Whitespace string"),
            (None, "None value"),
        ]

        for raw_input, description in invalid_cases:
            with self.subTest(raw_input=raw_input, case=description):
                clean = main.normalize_vietnam_phone(raw_input)
                self.assertEqual(clean, "", f"Expected empty clean phone for: {description}")
                zalo_url = main.get_zalo_link(raw_input)
                self.assertEqual(zalo_url, "", f"Expected empty Zalo URL for: {description}")

    def test_function_backward_compatibility_aliases(self):
        """Verify backward compatibility aliases point to canonical functions."""
        self.assertIs(main.normalize_phone_vn, main.normalize_vietnam_phone)
        self.assertIs(main.get_zalo_chat_url, main.get_zalo_link)


# ==============================================================================
# TEST CASE CLASS 2: SEPAY WEBHOOK & INSTANT ADMIN NOTIFICATION
# ==============================================================================

class TestSepayWebhookAdminNotification(unittest.TestCase):
    """
    Test suite for SePay Webhook route (/webhooks/sepay) and instant Admin 'Nổ tiền' email.
    Verifies Tier 1 Order ID match, Tier 2 Phone match, PAID update, customer file email,
    and exact Admin subject line format with 1-tap Zalo link.
    """

    def setUp(self):
        CapturingSMTP.sent_messages.clear()
        self.smtp_patcher = patch("smtplib.SMTP_SSL", new=CapturingSMTP)
        self.smtp_patcher.start()

        self.mock_db = MockFirestoreDB()
        self.orig_get_db = main.get_db
        main.get_db = lambda: self.mock_db

        self.urlopen_patcher = patch("urllib.request.urlopen", side_effect=mock_urlopen)
        self.urlopen_patcher.start()

    def tearDown(self):
        CapturingSMTP.sent_messages.clear()
        self.smtp_patcher.stop()
        self.urlopen_patcher.stop()
        main.get_db = self.orig_get_db

    def test_sepay_webhook_tier1_order_id_match(self):
        """
        Tier 1: Webhook content contains exact order ID (e.g. DH120289).
        Verifies PAID status, paid_at, product download increment, customer delivery email,
        and Admin 'Nổ tiền' email with exact subject and 1-tap Zalo link.
        """
        order_id = "DH120289"
        doc_ref = self.mock_db.collection("orders").document(order_id)
        doc_ref.set({
            "id": order_id,
            "status": "PENDING",
            "amount": 179000,
            "customer_name": "Huỳnh Kiên Cam",
            "customer_phone": "0912 345 678",
            "customer_email": "customer@example.com",
            "product_name": "Quản Lý Kho Mini",
            "product_file_url": "https://docs.google.com/spreadsheets/d/abc12345/copy",
            "product_id": "prod_kho_mini",
            "items": [{"product_id": "prod_kho_mini", "product_name": "Quản Lý Kho Mini", "price": 179000}],
            "created_at": datetime.now(timezone.utc) - timedelta(minutes=5),
        })

        # Seed product doc
        self.mock_db.collection("products").document("prod_kho_mini").set({
            "downloads_count": 10
        })

        sepay_payload = {
            "id": 998877,
            "gateway": "TPBank",
            "transferAmount": 179000,
            "transferType": "in",
            "content": "DH120289 thanh toan don hang File Di Lam",
            "referenceCode": "FT2611140001",
        }

        req = MockRequest(path="/webhooks/sepay", method="POST", json_data=sepay_payload)
        resp = main.api(req)

        # 1. Assert HTTP response
        self.assertEqual(resp.status_code, 200)
        res_json = json.loads(resp.get_data(as_text=True))
        self.assertTrue(res_json.get("success"))

        # 2. Assert Firestore order document update
        order_snapshot = doc_ref.get().to_dict()
        self.assertEqual(order_snapshot.get("status"), "PAID")
        self.assertEqual(order_snapshot.get("sepay_transaction_id"), 998877)
        self.assertEqual(order_snapshot.get("reference_code"), "FT2611140001")
        self.assertIsNotNone(order_snapshot.get("paid_at"))

        # 3. Assert downloads_count incremented
        prod_data = self.mock_db.collection("products").document("prod_kho_mini").get().to_dict()
        self.assertEqual(prod_data.get("downloads_count"), 11)

        # 4. Assert exactly 2 emails sent: Customer file delivery + Admin 'Nổ tiền'
        self.assertEqual(len(CapturingSMTP.sent_messages), 2, "Expected 2 emails (customer + admin)")

        customer_email = CapturingSMTP.sent_messages[0]
        admin_email = CapturingSMTP.sent_messages[1]

        # Verify customer delivery email
        self.assertIn("customer@example.com", customer_email["to"])
        self.assertIn("DH120289", customer_email["subject"])
        self.assertIn("https://docs.google.com/spreadsheets/d/abc12345/copy", customer_email["html_text"])

        # Verify Admin 'Nổ tiền' email
        self.assertIn("huynhkiencam151102@gmail.com", admin_email["to"])

        # EXACT SUBJECT FORMAT: [ĐÃ THANH TOÁN THÀNH CÔNG] +<Số_tiền>đ - Đơn #<Mã_đơn> - <Tên_khách_hàng>
        expected_subject = "[ĐÃ THANH TOÁN THÀNH CÔNG] +179.000đ - Đơn #DH120289 - Huỳnh Kiên Cam"
        self.assertEqual(admin_email["subject"], expected_subject)

        # Admin email body verification
        admin_body = admin_email["html_text"] + admin_email["plain_text"]
        self.assertIn("DH120289", admin_body)
        self.assertIn("179.000", admin_body)
        self.assertIn("TPBank", admin_body)
        self.assertIn("FT2611140001", admin_body)
        self.assertIn("Huỳnh Kiên Cam", admin_body)
        self.assertIn("Quản Lý Kho Mini", admin_body)
        self.assertIn("0912 345 678", admin_body)

        # 1-Tap Zalo Link in Admin Email
        expected_zalo = "https://zalo.me/0912345678"
        self.assertIn(expected_zalo, admin_email["html_text"])
        self.assertIn(expected_zalo, admin_email["plain_text"])

    def test_sepay_webhook_tier2_phone_fallback_match(self):
        """
        Tier 2: Customer omitted order ID and typed their phone number in transfer content.
        Verifies successful fallback match, PAID update, and Admin 'Nổ tiền' email.
        """
        order_id = "DH889900"
        doc_ref = self.mock_db.collection("orders").document(order_id)
        doc_ref.set({
            "id": order_id,
            "status": "PENDING",
            "amount": 250000,
            "customer_name": "Trần Thị B",
            "customer_phone": "0988 776 655",
            "customer_email": "tranthib@example.com",
            "product_name": "Quản Lý Nhà Trọ Web App",
            "product_file_url": "https://docs.google.com/spreadsheets/d/def67890/copy",
            "created_at": datetime.now(timezone.utc) - timedelta(minutes=8),
        })

        sepay_payload = {
            "id": 998878,
            "gateway": "MBBank",
            "transferAmount": 250000,
            "transferType": "in",
            "content": "0988776655 chuyen tien phan mem",
            "referenceCode": "MB992211",
        }

        req = MockRequest(path="/webhooks/sepay", method="POST", json_data=sepay_payload)
        resp = main.api(req)

        self.assertEqual(resp.status_code, 200)
        self.assertTrue(json.loads(resp.get_data(as_text=True)).get("success"))

        # Verify order updated to PAID
        order_snapshot = doc_ref.get().to_dict()
        self.assertEqual(order_snapshot.get("status"), "PAID")
        self.assertEqual(order_snapshot.get("sepay_transaction_id"), 998878)

        # Verify Admin email
        self.assertEqual(len(CapturingSMTP.sent_messages), 2)
        admin_email = CapturingSMTP.sent_messages[1]
        self.assertIn("huynhkiencam151102@gmail.com", admin_email["to"])

        expected_subject = "[ĐÃ THANH TOÁN THÀNH CÔNG] +250.000đ - Đơn #DH889900 - Trần Thị B"
        self.assertEqual(admin_email["subject"], expected_subject)

        # 1-Tap Zalo Link for 0988776655
        self.assertIn("https://zalo.me/0988776655", admin_email["html_text"])

    def test_sepay_webhook_underpaid_does_not_activate(self):
        """Transfer amount lower than order amount must not activate order."""
        order_id = "DH112233"
        doc_ref = self.mock_db.collection("orders").document(order_id)
        doc_ref.set({
            "id": order_id,
            "status": "PENDING",
            "amount": 200000,
            "customer_name": "Nguyen Van C",
            "created_at": datetime.now(timezone.utc),
        })

        sepay_payload = {
            "id": 998879,
            "gateway": "TPBank",
            "transferAmount": 50000,  # Underpaid
            "transferType": "in",
            "content": "DH112233 thanh toan",
        }

        req = MockRequest(path="/webhooks/sepay", method="POST", json_data=sepay_payload)
        resp = main.api(req)

        self.assertEqual(resp.status_code, 200)
        # Order must remain PENDING
        self.assertEqual(doc_ref.get().to_dict().get("status"), "PENDING")
        self.assertEqual(len(CapturingSMTP.sent_messages), 0)


# ==============================================================================
# TEST CASE CLASS 3: PENDING ORDER REMINDER SCANNER & IDEMPOTENCY
# ==============================================================================

class TestPendingOrderReminderScanner(unittest.TestCase):
    """
    Test suite for process_pending_order_reminders scheduled business logic.
    Verifies 4-order matrix (Due, Too Recent, Already Reminded, Paid),
    dual email dispatch (customer VietQR reminder & Admin summary),
    reminder_sent_at timestamp update, and 100% idempotency on immediate re-run.
    """

    def setUp(self):
        CapturingSMTP.sent_messages.clear()
        self.smtp_patcher = patch("smtplib.SMTP_SSL", new=CapturingSMTP)
        self.smtp_patcher.start()

        self.mock_db = MockFirestoreDB()
        self.orig_get_db = main.get_db
        main.get_db = lambda: self.mock_db

        self.urlopen_patcher = patch("urllib.request.urlopen", side_effect=mock_urlopen)
        self.urlopen_patcher.start()

    def tearDown(self):
        CapturingSMTP.sent_messages.clear()
        self.smtp_patcher.stop()
        self.urlopen_patcher.stop()
        main.get_db = self.orig_get_db

    def test_pending_order_matrix_processing_and_dual_emails(self):
        """
        Matrix of 4 orders:
        1. DH_DUE: PENDING, age 12m, reminder_sent_at=None -> MUST PROCESS
        2. DH_TOO_RECENT: PENDING, age 4m, reminder_sent_at=None -> MUST SKIP (< 10m)
        3. DH_ALREADY_REMINDED: PENDING, age 20m, reminder_sent_at set -> MUST SKIP (Anti-spam)
        4. DH_PAID: PAID, age 15m, reminder_sent_at=None -> MUST SKIP (Already paid)
        """
        now = datetime.now(timezone.utc)
        orders_col = self.mock_db.collection("orders")

        # 1. DH_DUE
        orders_col.document("DH_DUE").set({
            "id": "DH_DUE",
            "status": "PENDING",
            "amount": 179000,
            "customer_name": "Nguyen Van Due",
            "customer_phone": "0901234567",
            "customer_email": "due_cust@example.com",
            "product_name": "Bảng Tính Giá Vốn F&B",
            "created_at": now - timedelta(minutes=12),
            "reminder_sent_at": None,
        })

        # 2. DH_TOO_RECENT
        orders_col.document("DH_TOO_RECENT").set({
            "id": "DH_TOO_RECENT",
            "status": "PENDING",
            "amount": 179000,
            "customer_name": "Recent Customer",
            "customer_phone": "0901112222",
            "customer_email": "recent@example.com",
            "created_at": now - timedelta(minutes=4),
            "reminder_sent_at": None,
        })

        # 3. DH_ALREADY_REMINDED
        existing_reminder_time = now - timedelta(minutes=5)
        orders_col.document("DH_ALREADY_REMINDED").set({
            "id": "DH_ALREADY_REMINDED",
            "status": "PENDING",
            "amount": 179000,
            "customer_name": "Reminded Customer",
            "customer_phone": "0903334444",
            "customer_email": "reminded@example.com",
            "created_at": now - timedelta(minutes=20),
            "reminder_sent_at": existing_reminder_time,
        })

        # 4. DH_PAID
        orders_col.document("DH_PAID").set({
            "id": "DH_PAID",
            "status": "PAID",
            "amount": 179000,
            "customer_name": "Paid Customer",
            "customer_phone": "0905556666",
            "customer_email": "paid@example.com",
            "created_at": now - timedelta(minutes=15),
            "reminder_sent_at": None,
        })

        # Execute core scanner function
        scan_result = main.process_pending_order_reminders(db=self.mock_db, schedule_time=now)

        # 1. Assert only DH_DUE was processed
        self.assertEqual(scan_result["processed_count"], 1)
        self.assertEqual(scan_result["order_ids"], ["DH_DUE"])

        # 2. Assert Firestore state changes
        due_order = orders_col.document("DH_DUE").get().to_dict()
        self.assertIsNotNone(due_order.get("reminder_sent_at"))
        self.assertEqual(due_order.get("status"), "PENDING")

        recent_order = orders_col.document("DH_TOO_RECENT").get().to_dict()
        self.assertIsNone(recent_order.get("reminder_sent_at"))

        reminded_order = orders_col.document("DH_ALREADY_REMINDED").get().to_dict()
        self.assertEqual(reminded_order.get("reminder_sent_at"), existing_reminder_time)

        paid_order = orders_col.document("DH_PAID").get().to_dict()
        self.assertIsNone(paid_order.get("reminder_sent_at"))

        # 3. Assert exactly 2 emails sent (Customer reminder + Admin notification)
        self.assertEqual(len(CapturingSMTP.sent_messages), 2)

        customer_email = CapturingSMTP.sent_messages[0]
        admin_email = CapturingSMTP.sent_messages[1]

        # Verify Customer Reminder Email
        self.assertIn("due_cust@example.com", customer_email["to"])
        self.assertIn("DH_DUE", customer_email["subject"])
        # VietQR image attachment check
        self.assertIn("cid:vietqr_code", customer_email["html_text"])
        # TPBank details
        self.assertIn("TPBank", customer_email["html_text"])
        self.assertIn("59215112002", customer_email["html_text"])
        self.assertIn("HUYNH KIEN CAM", customer_email["html_text"])
        self.assertIn("DH_DUE", customer_email["html_text"])
        # Friendly support message check
        expected_friendly = "Hệ thống thấy bạn đang gặp vướng mắc khi thanh toán đơn hàng #DH_DUE"
        self.assertIn(expected_friendly, customer_email["html_text"])
        self.assertIn("0938 134 576", customer_email["html_text"])

        # Verify Admin Reminder Summary Email
        self.assertIn("huynhkiencam151102@gmail.com", admin_email["to"])
        expected_admin_subj = "[NHẮC THANH TOÁN] Đơn #DH_DUE - Nguyen Van Due (SĐT: 0901234567)"
        self.assertEqual(admin_email["subject"], expected_admin_subj)

        admin_body = admin_email["html_text"] + admin_email["plain_text"]
        self.assertIn("DH_DUE", admin_body)
        self.assertIn("179.000", admin_body)
        self.assertIn("Nguyen Van Due", admin_body)
        self.assertIn("0901234567", admin_body)
        # 1-Tap Zalo Link for 0901234567
        self.assertIn("https://zalo.me/0901234567", admin_email["html_text"])
        self.assertIn("https://zalo.me/0901234567", admin_email["plain_text"])

    def test_scanner_idempotency_on_immediate_rerun(self):
        """Re-running scanner immediately must process 0 orders and dispatch 0 new emails."""
        now = datetime.now(timezone.utc)
        orders_col = self.mock_db.collection("orders")

        orders_col.document("DH_DUE").set({
            "id": "DH_DUE",
            "status": "PENDING",
            "amount": 179000,
            "customer_name": "Nguyen Van Due",
            "customer_phone": "0901234567",
            "customer_email": "due_cust@example.com",
            "created_at": now - timedelta(minutes=12),
            "reminder_sent_at": None,
        })

        # Run 1: processes 1 order, sends 2 emails
        res1 = main.process_pending_order_reminders(db=self.mock_db, schedule_time=now)
        self.assertEqual(res1["processed_count"], 1)
        self.assertEqual(len(CapturingSMTP.sent_messages), 2)

        # Run 2: immediate re-run (e.g. cron triggers again 5 min later)
        res2 = main.process_pending_order_reminders(db=self.mock_db, schedule_time=now + timedelta(minutes=5))
        self.assertEqual(res2["processed_count"], 0)
        self.assertEqual(res2["order_ids"], [])
        self.assertEqual(len(CapturingSMTP.sent_messages), 2, "Zero duplicate emails must be sent")

    def test_virtual_customer_email_skips_customer_but_notifies_admin(self):
        """
        Orders with virtual fallback email (@khachhang.filedilam.vn) must skip customer email
        (to avoid SMTP delivery failure) but STILL send Admin notification with 1-tap Zalo link.
        """
        now = datetime.now(timezone.utc)
        orders_col = self.mock_db.collection("orders")

        orders_col.document("DH_VIRTUAL").set({
            "id": "DH_VIRTUAL",
            "status": "PENDING",
            "amount": 179000,
            "customer_name": "Khách Vãng Lai",
            "customer_phone": "0909887766",
            "customer_email": "0909887766@khachhang.filedilam.vn",
            "created_at": now - timedelta(minutes=14),
            "reminder_sent_at": None,
        })

        res = main.process_pending_order_reminders(db=self.mock_db, schedule_time=now)
        self.assertEqual(res["processed_count"], 1)
        self.assertEqual(res["order_ids"], ["DH_VIRTUAL"])

        # Exactly 1 email sent (Admin only, customer skipped)
        self.assertEqual(len(CapturingSMTP.sent_messages), 1)
        admin_email = CapturingSMTP.sent_messages[0]
        self.assertIn("huynhkiencam151102@gmail.com", admin_email["to"])
        self.assertIn("https://zalo.me/0909887766", admin_email["html_text"])

        # Flag updated
        doc = orders_col.document("DH_VIRTUAL").get().to_dict()
        self.assertIsNotNone(doc.get("reminder_sent_at"))

    def test_manual_admin_endpoint_authorization(self):
        """
        Endpoint /admin/check-pending-reminders:
        - Blocks unauthenticated or non-admin users (403 ADMIN_AUTH_REQUIRED)
        - Allows admin huynhkiencam151102@gmail.com (200 OK)
        """
        # 1. Forbidden without admin user
        req_unauth = MockRequest(path="/admin/check-pending-reminders", method="POST")
        resp_unauth = main.api(req_unauth)
        self.assertEqual(resp_unauth.status_code, 403)

        # 2. Allowed with admin user
        with patch.object(main, "require_user", return_value={"uid": "admin123", "email": "huynhkiencam151102@gmail.com"}):
            req_auth = MockRequest(path="/admin/check-pending-reminders", method="POST")
            resp_auth = main.api(req_auth)
            self.assertEqual(resp_auth.status_code, 200)
            res_json = json.loads(resp_auth.get_data(as_text=True))
            self.assertTrue(res_json.get("success"))
            self.assertIn("result", res_json)


# ==============================================================================
# TEST CASE CLASS 4: FRONTEND ADMIN ZALO 1-TAP INTEGRATION
# ==============================================================================

class TestAdminFrontendZaloIntegration(unittest.TestCase):
    """
    Test suite for frontend admin assets (admin.js and admin.html).
    Verifies normalizePhoneNumber JavaScript implementation across 15 cases,
    inline Zalo button with event.stopPropagation(), inspector panel Zalo badge,
    and scoped CSS styles with cache-busting version query string.
    """

    @classmethod
    def setUpClass(cls):
        admin_js_path = os.path.join(WORKSPACE_DIR, "admin.js")
        admin_html_path = os.path.join(WORKSPACE_DIR, "admin.html")

        with open(admin_js_path, "r", encoding="utf-8") as f:
            cls.admin_js_content = f.read()

        with open(admin_html_path, "r", encoding="utf-8") as f:
            cls.admin_html_content = f.read()

    def test_admin_js_normalize_phone_number_via_nodejs_execution(self):
        """
        Extract normalizePhoneNumber directly from admin.js and execute against 15 test cases
        using the Node.js runtime.
        """
        # Extract normalizePhoneNumber declaration
        fn_match = re.search(r"function\s+normalizePhoneNumber\s*\([^)]*\)\s*\{[\s\S]*?\n\}", self.admin_js_content)
        self.assertIsNotNone(fn_match, "normalizePhoneNumber function definition not found in admin.js")
        fn_code = fn_match.group(0)

        test_cases_js = [
            ("0912345678", "0912345678"),
            ("+84912345678", "0912345678"),
            ("84912345678", "0912345678"),
            ("0912 345 678", "0912345678"),
            ("0912-345-678", "0912345678"),
            ("0912.345.678", "0912345678"),
            ("+84 912-345-678", "0912345678"),
            ("+84 (0) 912 345 678", "0912345678"),
            ("912345678", "0912345678"),
            ("084912345678", "0912345678"),
            ("0084912345678", "0912345678"),
            ("Khach vang lai", ""),
            ("", ""),
            (None, ""),
            ("123", ""),
        ]

        js_runner = f"""
        {fn_code}
        const testInputs = {json.dumps([c[0] for c in test_cases_js])};
        const results = testInputs.map(input => normalizePhoneNumber(input));
        console.log(JSON.stringify(results));
        """

        node_proc = subprocess.run(["node", "-e", js_runner], capture_output=True, text=True)
        self.assertEqual(node_proc.returncode, 0, f"Node execution failed: {node_proc.stderr}")

        actual_results = json.loads(node_proc.stdout.strip())
        for idx, (raw_in, expected_out) in enumerate(test_cases_js):
            with self.subTest(input=raw_in, index=idx):
                self.assertEqual(actual_results[idx], expected_out, f"Mismatch for input: {raw_in}")

    def test_admin_js_table_inline_zalo_badge_and_stop_propagation(self):
        """
        Verify that in admin.js table canvas:
        - .btn-zalo-inline is rendered for orders with valid phone numbers.
        - event.stopPropagation() is explicitly bound to prevent row click selection.
        - Zalo URL https://zalo.me/${cleanPhone} is dynamically generated.
        - target="_blank" and rel="noopener noreferrer" are included.
        """
        self.assertIn("btn-zalo-inline", self.admin_js_content)
        self.assertIn("onclick=\"event.stopPropagation();\"", self.admin_js_content)
        self.assertIn("https://zalo.me/${cleanPhone}", self.admin_js_content)
        self.assertIn("rel=\"noopener noreferrer\"", self.admin_js_content)

    def test_admin_js_inspector_zalo_badge(self):
        """
        Verify that in admin.js Order Inspector drawer:
        - .btn-zalo-badge is rendered in Section 1 next to customer phone.
        - https://zalo.me/${cleanPhone} is dynamically bound.
        """
        self.assertIn("btn-zalo-badge", self.admin_js_content)
        inspector_badge_match = re.search(
            r'class="btn-zalo-badge"[\s\S]*?https://zalo\.me/\$\{cleanPhone\}',
            self.admin_js_content
        )
        self.assertIsNotNone(inspector_badge_match, "Inspector Zalo badge link binding not found in admin.js")

    def test_admin_html_css_styling_and_cache_busting(self):
        """
        Verify that admin.html contains:
        - Scoped CSS rules for .btn-zalo-inline and .btn-zalo-inline:hover
        - Scoped CSS rules for .btn-zalo-badge and .btn-zalo-badge:hover
        - Cache-busting script version (v=313 or higher)
        """
        # CSS rules check
        self.assertIn(".btn-zalo-inline {", self.admin_html_content)
        self.assertIn(".btn-zalo-inline:hover {", self.admin_html_content)
        self.assertIn(".btn-zalo-badge {", self.admin_html_content)
        self.assertIn(".btn-zalo-badge:hover {", self.admin_html_content)

        # Style specifics
        self.assertIn("#0284c7", self.admin_html_content)
        self.assertIn("#e0f2fe", self.admin_html_content)

        # Cache-busting script tag check (v=313)
        script_tag_match = re.search(r'<script\s+src=["\']\./admin\.js\?v=(\d+)["\']></script>', self.admin_html_content)
        self.assertIsNotNone(script_tag_match, "admin.js script tag with ?v= query string not found in admin.html")
        version_num = int(script_tag_match.group(1))
        self.assertGreaterEqual(version_num, 313, f"Expected cache-busting version >= 313, found {version_num}")


# ==============================================================================
# MAIN RUNNER
# ==============================================================================

if __name__ == "__main__":
    unittest.main()
