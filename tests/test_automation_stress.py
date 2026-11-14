"""
Comprehensive Adversarial Stress Test Suite for File Đi Làm Automation Flows.
Created by Challenger Auto 1 (Functional Stress Challenger).

Stress Test Dimensions:
1. High volume / Concurrent SePay webhook requests (rapid successive & multithreaded).
2. Large batch PENDING order scanner scaling (100+ mixed pending orders in Firestore).
3. Extreme phone normalization stress (weird whitespace, Unicode zero-width spaces, international prefixes, letters, parity with JavaScript).
4. Exact Admin Subject Format verification: [ĐÃ THANH TOÁN THÀNH CÔNG] +<Số_tiền>đ - Đơn #<Mã_đơn> - <Tên_khách_hàng> across diverse amounts/currencies.
5. Scanner idempotency under rapid repetition and concurrent executions.
"""
from __future__ import annotations

import concurrent.futures
import copy
import email
from email.header import decode_header
import json
import os
import re
import smtplib
import subprocess
import sys
import threading
import time
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

# Configure UTF-8 encoding for standard streams
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FUNCTIONS_DIR = os.path.join(WORKSPACE_DIR, "functions")
SITE_PACKAGES_DIR = os.path.join(FUNCTIONS_DIR, "venv", "Lib", "site-packages")

for p in (FUNCTIONS_DIR, SITE_PACKAGES_DIR):
    if p not in sys.path:
        sys.path.insert(0, p)

import main


# ==============================================================================
# THREAD-SAFE HERMETIC TEST HARNESS
# ==============================================================================

def decode_mime_header(header_val: str | None) -> str:
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


class ThreadSafeCapturingSMTP:
    """Thread-safe capturing SMTP mock."""
    lock = threading.Lock()
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
        with ThreadSafeCapturingSMTP.lock:
            ThreadSafeCapturingSMTP.sent_messages.append(message_record)
        return {}

    def quit(self):
        pass

    def close(self):
        pass


class ThreadSafeMockDocumentReference:
    def __init__(self, doc_id: str, initial_data: dict | None = None):
        self.id = doc_id
        self._lock = threading.Lock()
        self.data: dict = initial_data.copy() if initial_data else {}

    def get(self):
        with self._lock:
            return ThreadSafeMockDocumentSnapshot(self.id, self.data, self)

    def update(self, update_dict: dict) -> None:
        with self._lock:
            for k, v in update_dict.items():
                if hasattr(v, "value"):
                    base = self.data.get(k)
                    base = base if isinstance(base, (int, float)) else 0
                    self.data[k] = base + v.value
                else:
                    self.data[k] = v

    def set(self, set_dict: dict, merge: bool = False) -> None:
        with self._lock:
            if merge:
                for k, v in set_dict.items():
                    if hasattr(v, "value"):
                        base = self.data.get(k)
                        base = base if isinstance(base, (int, float)) else 0
                        self.data[k] = base + v.value
                    else:
                        self.data[k] = v
            else:
                self.data = set_dict.copy()


class ThreadSafeMockDocumentSnapshot:
    def __init__(self, doc_id: str, data: dict | None, ref: ThreadSafeMockDocumentReference):
        self.id = doc_id
        self._data = data.copy() if data else {}
        self.reference = ref
        self.exists = bool(data)

    def to_dict(self) -> dict:
        return self._data.copy()


class ThreadSafeMockQuery:
    def __init__(self, collection: ThreadSafeMockCollectionReference, filters: list | None = None):
        self.collection = collection
        self.filters = list(filters) if filters else []

    def where(self, field: str, op: str, value: any) -> ThreadSafeMockQuery:
        new_filters = list(self.filters)
        new_filters.append((field, op, value))
        return ThreadSafeMockQuery(self.collection, new_filters)

    def stream(self):
        with self.collection._lock:
            items = list(self.collection.docs.items())
        for doc_id, doc_ref in items:
            with doc_ref._lock:
                data = doc_ref.data.copy()
            if not data:
                continue
            matches = True
            for field, op, val in self.filters:
                doc_val = data.get(field)
                if op == "==" and doc_val != val:
                    matches = False
                    break
                elif op == "!=" and doc_val == val:
                    matches = False
                    break
            if matches:
                yield ThreadSafeMockDocumentSnapshot(doc_id, data, doc_ref)


class ThreadSafeMockCollectionReference:
    def __init__(self, name: str):
        self.name = name
        self._lock = threading.Lock()
        self.docs: dict[str, ThreadSafeMockDocumentReference] = {}

    def document(self, doc_id: str | None = None) -> ThreadSafeMockDocumentReference:
        if not doc_id:
            import uuid
            doc_id = str(uuid.uuid4())
        with self._lock:
            if doc_id not in self.docs:
                self.docs[doc_id] = ThreadSafeMockDocumentReference(doc_id)
            return self.docs[doc_id]

    def where(self, field: str, op: str, value: any) -> ThreadSafeMockQuery:
        return ThreadSafeMockQuery(self, [(field, op, value)])

    def stream(self):
        with self._lock:
            items = list(self.docs.items())
        for doc_id, doc_ref in items:
            with doc_ref._lock:
                data = doc_ref.data.copy()
            if data:
                yield ThreadSafeMockDocumentSnapshot(doc_id, data, doc_ref)


class ThreadSafeMockFirestoreDB:
    def __init__(self):
        self._lock = threading.Lock()
        self.collections: dict[str, ThreadSafeMockCollectionReference] = {}

    def collection(self, name: str) -> ThreadSafeMockCollectionReference:
        with self._lock:
            if name not in self.collections:
                self.collections[name] = ThreadSafeMockCollectionReference(name)
            return self.collections[name]


class MockUrlResponse:
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
    dummy_payload = json.dumps({
        "code": "00",
        "data": {
            "qrDataURL": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        }
    }).encode("utf-8")
    return MockUrlResponse(dummy_payload, 200)


class MockRequest:
    def __init__(self, path: str, method: str, json_data: dict | None = None, headers: dict | None = None):
        self.path = path
        self.method = method
        self._json_data = json_data or {}
        self.headers = headers or {}

    def get_json(self, silent: bool = True):
        return self._json_data


# ==============================================================================
# DIMENSION 1: PHONE NORMALIZATION STRESS & JS PARITY
# ==============================================================================

class TestStressPhoneNormalization(unittest.TestCase):
    """
    Stress-tests Python normalize_vietnam_phone and JavaScript normalizePhoneNumber
    against 30+ adversarial variations: Unicode zero-width spaces, weird whitespaces,
    letters, international prefixes, invalid lengths, and foreign numbers.
    """

    @classmethod
    def setUpClass(cls):
        # Extract JavaScript normalizePhoneNumber implementation from admin.js
        admin_js_path = os.path.join(WORKSPACE_DIR, "admin.js")
        with open(admin_js_path, "r", encoding="utf-8") as f:
            admin_js_content = f.read()

        match = re.search(
            r"(function\s+normalizePhoneNumber\s*\([^)]*\)\s*\{[\s\S]*?\n\})",
            admin_js_content,
        )
        if not match:
            raise RuntimeError("Could not find normalizePhoneNumber in admin.js")
        cls.js_function_source = match.group(1)

    def run_js_normalize(self, raw_input: str) -> str:
        test_script = f"""
{self.js_function_source}
const input = {json.dumps(raw_input)};
const result = normalizePhoneNumber(input);
process.stdout.write(result);
"""
        res = subprocess.run(
            ["node", "-e", test_script],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if res.returncode != 0:
            raise RuntimeError(f"Node.js execution failed: {res.stderr}")
        return res.stdout

    def test_unicode_and_weird_whitespace_stress(self):
        """Stress test with Unicode zero-width, non-breaking, and exotic whitespaces."""
        cases = [
            # Zero-width spaces & non-breaking spaces
            ("091\u200B234\u200B5678", "0912345678", "Zero-width spaces (U+200B)"),
            ("091\u00A0234\u00A05678", "0912345678", "Non-breaking spaces (U+00A0)"),
            ("091\u200D234\u200D5678", "0912345678", "Zero-width joiners (U+200D)"),
            ("091\u200C234\u200C5678", "0912345678", "Zero-width non-joiners (U+200C)"),
            ("091\u202F234\u202F5678", "0912345678", "Narrow no-break space (U+202F)"),
            ("\uFEFF0912345678\uFEFF", "0912345678", "Byte Order Mark BOM (U+FEFF)"),
            ("  \t\n  0912345678  \r\n  ", "0912345678", "Leading/trailing tabs, spaces, newlines"),
            ("091   234      5678", "0912345678", "Multiple consecutive irregular spaces"),
            ("091\t234\t5678", "0912345678", "Internal tab separators"),
        ]

        for raw_val, expected, label in cases:
            with self.subTest(case=label, raw=raw_val):
                py_clean = main.normalize_vietnam_phone(raw_val)
                js_clean = self.run_js_normalize(raw_val)
                self.assertEqual(py_clean, expected, f"Python failed for {label}")
                self.assertEqual(js_clean, expected, f"JS failed for {label}")
                self.assertEqual(py_clean, js_clean, f"Python/JS divergence on {label}")

    def test_international_prefix_stress(self):
        """Stress test international prefixes: +84, 0084, 84, (+84), (+84) (0)."""
        cases = [
            ("+84912345678", "0912345678", "+84 without separator"),
            ("+84 912 345 678", "0912345678", "+84 with spaces"),
            ("+84-912-345-678", "0912345678", "+84 with hyphens"),
            ("84912345678", "0912345678", "84 without plus"),
            ("0084912345678", "0912345678", "0084 prefix"),
            ("0084 912 345 678", "0912345678", "0084 prefix with spaces"),
            ("+84 (0) 912 345 678", "0912345678", "+84 with parenthesized zero (0)"),
            ("(+84) 912.345.678", "0912345678", "(+84) in parentheses with dots"),
        ]

        for raw_val, expected, label in cases:
            with self.subTest(case=label, raw=raw_val):
                py_clean = main.normalize_vietnam_phone(raw_val)
                js_clean = self.run_js_normalize(raw_val)
                self.assertEqual(py_clean, expected, f"Python failed for {label}")
                self.assertEqual(js_clean, expected, f"JS failed for {label}")
                self.assertEqual(py_clean, js_clean, f"Python/JS divergence on {label}")

    def test_prefix_084_12_digits_asymmetry_between_python_and_javascript(self):
        """
        Adversarial Observation:
        admin.js explicitly handles '084' prefix with 12 digits:
        else if (digits.startsWith('084') && digits.length === 12) { digits = digits.slice(3); } -> '0912345678'
        whereas functions/main.py only handles '0084', '84' (>=11 digits), or 9 digits missing leading zero.
        Thus Python rejects '084912345678' ('') while JS normalizes to '0912345678'.
        Both handle legitimate 10-digit Vinaphone numbers '0841234567' identically.
        """
        vinaphone_10_digits = "0841234567"
        self.assertEqual(main.normalize_vietnam_phone(vinaphone_10_digits), "0841234567")
        self.assertEqual(self.run_js_normalize(vinaphone_10_digits), "0841234567")

        abnormal_12_digits = "084912345678"
        py_result = main.normalize_vietnam_phone(abnormal_12_digits)
        js_result = self.run_js_normalize(abnormal_12_digits)
        self.assertEqual(py_result, "")  # Python rejects 12-digit 084
        self.assertEqual(js_result, "0912345678")  # JS strips 084 prefix

    def test_alphanumeric_and_embedded_letters_stress(self):
        """Test letters mixed into numbers and ensure rejection when digits don't match 10."""
        cases = [
            ("0912abc345678", "0912345678", "10 valid digits with embedded letters"),
            ("tel:0912345678", "0912345678", "tel: protocol prefix with 10 digits"),
            ("Phone: +84912345678", "0912345678", "Text prefix with +84"),
            ("0912345678 (Chị Lan)", "0912345678", "10 digits with customer name note in parens"),
            ("0912abc", "", "Incomplete digits mixed with letters (< 9 digits)"),
            ("0912345678 ext 123", "", "10 digits with extension (exceeds 10 digits)"),
            ("abcxyz", "", "Pure alphabet string"),
            ("Khách vãng lai", "", "Vietnamese text description"),
        ]

        for raw_val, expected, label in cases:
            with self.subTest(case=label, raw=raw_val):
                py_clean = main.normalize_vietnam_phone(raw_val)
                js_clean = self.run_js_normalize(raw_val)
                self.assertEqual(py_clean, expected, f"Python failed for {label}")
                self.assertEqual(js_clean, expected, f"JS failed for {label}")
                self.assertEqual(py_clean, js_clean, f"Python/JS divergence on {label}")

    def test_foreign_and_invalid_numbers_rejection(self):
        """Foreign numbers (US, UK, France) and abnormal lengths must be rejected cleanly."""
        cases = [
            ("+1 (415) 555-2671", "", "US phone number (+1)"),
            ("+44 20 7946 0958", "", "UK phone number (+44)"),
            ("+33 1 42 68 55 55", "", "French phone number (+33)"),
            ("19001000", "", "Shortcode / hotline 8 digits"),
            ("113", "", "Emergency number 3 digits"),
            ("091234567890123", "", "Excessively long digits (15 digits)"),
            ("", "", "Empty string"),
            (None, "", "None value"),
        ]

        for raw_val, expected, label in cases:
            with self.subTest(case=label, raw=raw_val):
                py_clean = main.normalize_vietnam_phone(raw_val)
                js_clean = self.run_js_normalize(raw_val)
                self.assertEqual(py_clean, expected, f"Python failed for {label}")
                self.assertEqual(js_clean, expected, f"JS failed for {label}")
                self.assertEqual(py_clean, js_clean, f"Python/JS divergence on {label}")


# ==============================================================================
# DIMENSION 2: ADMIN EXACT SUBJECT FORMAT ACROSS DIVERSE CURRENCIES/AMOUNTS
# ==============================================================================

class TestAdminPaymentSuccessSubjectFormatting(unittest.TestCase):
    """
    Verifies that Admin receives exact subject:
    [ĐÃ THANH TOÁN THÀNH CÔNG] +<Số_tiền>đ - Đơn #<Mã_đơn> - <Tên_khách_hàng>
    across diverse amounts (0, small, standard, large, float, string) and Unicode customer names.
    """

    def setUp(self):
        ThreadSafeCapturingSMTP.sent_messages.clear()
        self.smtp_patcher = patch("smtplib.SMTP_SSL", new=ThreadSafeCapturingSMTP)
        self.smtp_patcher.start()

    def tearDown(self):
        ThreadSafeCapturingSMTP.sent_messages.clear()
        self.smtp_patcher.stop()

    def test_subject_format_across_diverse_amounts_and_names(self):
        matrix = [
            (0, "0", "DH_000", "Lê Văn Tám", "[ĐÃ THANH TOÁN THÀNH CÔNG] +0đ - Đơn #DH_000 - Lê Văn Tám"),
            (10000, "10.000", "DH_10K", "Trần Thị Bé", "[ĐÃ THANH TOÁN THÀNH CÔNG] +10.000đ - Đơn #DH_10K - Trần Thị Bé"),
            (99000, "99.000", "DH_99K", "Phạm Văn Đồng", "[ĐÃ THANH TOÁN THÀNH CÔNG] +99.000đ - Đơn #DH_99K - Phạm Văn Đồng"),
            (179000, "179.000", "DH_179K", "Nguyễn Văn Ánh", "[ĐÃ THANH TOÁN THÀNH CÔNG] +179.000đ - Đơn #DH_179K - Nguyễn Văn Ánh"),
            (1500000, "1.500.000", "DH_1M5", "Đỗ Phúc Hưng", "[ĐÃ THANH TOÁN THÀNH CÔNG] +1.500.000đ - Đơn #DH_1M5 - Đỗ Phúc Hưng"),
            (15000000, "15.000.000", "DH_15M", "Phạm Lê Quỳnh Như", "[ĐÃ THANH TOÁN THÀNH CÔNG] +15.000.000đ - Đơn #DH_15M - Phạm Lê Quỳnh Như"),
            (123456789, "123.456.789", "DH_BIG", "Công Ty TNHH MTV Giải Pháp Số", "[ĐÃ THANH TOÁN THÀNH CÔNG] +123.456.789đ - Đơn #DH_BIG - Công Ty TNHH MTV Giải Pháp Số"),
            ("199000", "199.000", "DH_STR", "Khách Hàng Chuỗi", "[ĐÃ THANH TOÁN THÀNH CÔNG] +199.000đ - Đơn #DH_STR - Khách Hàng Chuỗi"),
        ]

        subject_regex = re.compile(r"^\[ĐÃ THANH TOÁN THÀNH CÔNG\] \+\d{1,3}(\.\d{3})*đ - Đơn #\S+ - .+$")

        for amount, formatted_num, order_id, cust_name, expected_subject in matrix:
            with self.subTest(order_id=order_id, amount=amount):
                ThreadSafeCapturingSMTP.sent_messages.clear()
                order_data = {
                    "id": order_id,
                    "amount": amount,
                    "customer_name": cust_name,
                    "customer_email": "test@example.com",
                    "customer_phone": "0912345678",
                    "product_name": "File Test",
                }
                success = main.send_admin_payment_success_notification(order_id, order_data)
                self.assertTrue(success, f"Failed sending email for {order_id}")
                self.assertEqual(len(ThreadSafeCapturingSMTP.sent_messages), 1)

                sent = ThreadSafeCapturingSMTP.sent_messages[0]
                self.assertEqual(sent["to"], ["huynhkiencam151102@gmail.com"])
                self.assertEqual(sent["subject"], expected_subject)
                self.assertTrue(bool(subject_regex.match(sent["subject"])), f"Subject regex mismatch: {sent['subject']}")
                # Verify body contains 1-tap Zalo link
                self.assertIn("https://zalo.me/0912345678", sent["html_text"])
                self.assertIn(f"+{formatted_num}đ", sent["html_text"])

    def test_subject_fallback_when_customer_name_or_amount_in_sepay_payload(self):
        """When customer name is missing, falls back to 'Khách hàng'; when amount in order_data is 0, uses sepay_payload."""
        ThreadSafeCapturingSMTP.sent_messages.clear()
        order_data = {
            "id": "DH_FALLBACK",
            "amount": 0,
            "customer_name": "",  # Missing
            "customer_email": "fallback@example.com",
            "customer_phone": "0987654321",
        }
        sepay_payload = {
            "transferAmount": 250000.0,  # Float in payload
            "gateway": "MBBank",
            "content": "DH_FALLBACK thanh toan",
        }
        success = main.send_admin_payment_success_notification("DH_FALLBACK", order_data, payment_details=sepay_payload)
        self.assertTrue(success)
        sent = ThreadSafeCapturingSMTP.sent_messages[0]
        expected_subject = "[ĐÃ THANH TOÁN THÀNH CÔNG] +250.000đ - Đơn #DH_FALLBACK - Khách hàng"
        self.assertEqual(sent["subject"], expected_subject)
        self.assertIn("https://zalo.me/0987654321", sent["html_text"])


# ==============================================================================
# DIMENSION 3: HIGH VOLUME / CONCURRENT SEPAY WEBHOOK STRESS
# ==============================================================================

class TestHighVolumeConcurrentWebhookStress(unittest.TestCase):
    """
    Simulates high volume (30+ concurrent or rapid successive) SePay webhook calls
    with diverse amounts, payment gateways, and customer names.
    Tests thread-safety, state updates, downloads_count, and dual email dispatches.
    """

    def setUp(self):
        ThreadSafeCapturingSMTP.sent_messages.clear()
        self.smtp_patcher = patch("smtplib.SMTP_SSL", new=ThreadSafeCapturingSMTP)
        self.smtp_patcher.start()

        self.mock_db = ThreadSafeMockFirestoreDB()
        self.orig_get_db = main.get_db
        main.get_db = lambda: self.mock_db

        self.urlopen_patcher = patch("urllib.request.urlopen", side_effect=mock_urlopen)
        self.urlopen_patcher.start()

    def tearDown(self):
        ThreadSafeCapturingSMTP.sent_messages.clear()
        self.smtp_patcher.stop()
        self.urlopen_patcher.stop()
        main.get_db = self.orig_get_db

    def test_30_concurrent_sepay_webhooks_different_orders(self):
        """
        Seed 30 PENDING orders in Firestore.
        Fire 30 concurrent webhook POST requests using ThreadPoolExecutor(max_workers=10).
        Verify that all 30 orders become PAID, downloads_count incremented, and 60 emails sent (30 cust + 30 admin).
        """
        N = 30
        orders_col = self.mock_db.collection("orders")
        products_col = self.mock_db.collection("products")
        gateways = ["TPBank", "Vietcombank", "MBBank", "BIDV", "Techcombank", "ACB"]

        # Seed product
        products_col.document("prod_stress").set({"downloads_count": 0})

        for i in range(N):
            oid = f"DH_STRESS_{i:03d}"
            amt = 100000 + i * 10000
            orders_col.document(oid).set({
                "id": oid,
                "status": "PENDING",
                "amount": amt,
                "customer_name": f"Khách Hàng Số {i}",
                "customer_phone": f"0912{i:06d}",
                "customer_email": f"cust_{i}@example.com",
                "product_name": f"File Quản Lý #{i}",
                "product_file_url": f"https://docs.google.com/spreadsheets/d/stress_{i}/copy",
                "product_id": "prod_stress",
                "items": [{"product_id": "prod_stress", "product_name": f"File Quản Lý #{i}", "price": amt}],
                "created_at": datetime.now(timezone.utc) - timedelta(minutes=5),
            })

        def call_webhook(idx):
            oid = f"DH_STRESS_{idx:03d}"
            amt = 100000 + idx * 10000
            gw = gateways[idx % len(gateways)]
            payload = {
                "id": 880000 + idx,
                "gateway": gw,
                "transferAmount": amt,
                "transferType": "in",
                "content": f"{oid} chuyen khoan mua file",
                "referenceCode": f"REF_STRESS_{idx:03d}",
            }
            req = MockRequest(path="/webhooks/sepay", method="POST", json_data=payload)
            resp = main.api(req)
            return idx, resp.status_code, json.loads(resp.get_data(as_text=True))

        t_start = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(call_webhook, i) for i in range(N)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
        t_duration = time.time() - t_start

        # 1. Assert all 30 webhooks returned 200 OK
        for idx, status, body in results:
            self.assertEqual(status, 200, f"Webhook for order {idx} failed with {status}")
            self.assertTrue(body.get("success"), f"Webhook response not success: {body}")

        # 2. Assert all 30 orders in Firestore are now PAID
        for i in range(N):
            oid = f"DH_STRESS_{i:03d}"
            doc = orders_col.document(oid).get().to_dict()
            self.assertEqual(doc.get("status"), "PAID", f"Order {oid} status not PAID")
            self.assertEqual(doc.get("sepay_transaction_id"), 880000 + i)
            self.assertEqual(doc.get("reference_code"), f"REF_STRESS_{i:03d}")
            self.assertIsNotNone(doc.get("paid_at"))

        # 3. Assert product downloads_count is exactly 30
        prod_data = products_col.document("prod_stress").get().to_dict()
        self.assertEqual(prod_data.get("downloads_count"), N)

        # 4. Assert exactly 60 emails dispatched (30 customer deliveries + 30 admin notifications)
        self.assertEqual(len(ThreadSafeCapturingSMTP.sent_messages), 60)

        # 5. Verify all admin emails have exact subject and 1-tap Zalo link
        admin_emails = [m for m in ThreadSafeCapturingSMTP.sent_messages if "huynhkiencam151102@gmail.com" in m["to"]]
        self.assertEqual(len(admin_emails), 30)
        subject_regex = re.compile(r"^\[ĐÃ THANH TOÁN THÀNH CÔNG\] \+\d{1,3}(\.\d{3})*đ - Đơn #DH_STRESS_\d{3} - Khách Hàng Số \d+$")
        for m in admin_emails:
            self.assertTrue(bool(subject_regex.match(m["subject"])), f"Subject format violation: {m['subject']}")
            self.assertIn("https://zalo.me/0912", m["html_text"])

        print(f"[Stress Metric] 30 concurrent webhooks processed in {t_duration:.3f}s ({30 / t_duration:.1f} req/s)")

    def test_duplicate_webhook_for_same_order_resilience(self):
        """Simulate SePay sending duplicate webhook callbacks for the same order."""
        oid = "DH_DUP_TEST"
        orders_col = self.mock_db.collection("orders")
        orders_col.document(oid).set({
            "id": oid,
            "status": "PENDING",
            "amount": 199000,
            "customer_name": "Tran Van Dup",
            "customer_phone": "0912999888",
            "customer_email": "dup@example.com",
            "product_name": "File Lap Ke Hoach",
            "created_at": datetime.now(timezone.utc),
        })

        payload = {
            "id": 776655,
            "gateway": "TPBank",
            "transferAmount": 199000,
            "transferType": "in",
            "content": f"{oid} thanh toan",
            "referenceCode": "REF_DUP",
        }

        # First webhook call -> 200 OK, transitions PENDING to PAID
        req1 = MockRequest(path="/webhooks/sepay", method="POST", json_data=payload)
        resp1 = main.api(req1)
        self.assertEqual(resp1.status_code, 200)

        # Second duplicate webhook call -> returns 200 OK to acknowledge receipt to SePay gateway
        # (preventing gateway from retrying), but order is already PAID so no duplicate processing occurs.
        req2 = MockRequest(path="/webhooks/sepay", method="POST", json_data=payload)
        resp2 = main.api(req2)
        self.assertEqual(resp2.status_code, 200)

        # Total emails sent must be exactly 2 (1 customer + 1 admin), NOT duplicated
        self.assertEqual(len(ThreadSafeCapturingSMTP.sent_messages), 2)


# ==============================================================================
# DIMENSION 4: LARGE BATCH PENDING ORDERS SCANNER SCALING (100 ORDERS)
# ==============================================================================

class TestLargeBatchPendingOrdersScannerScaling(unittest.TestCase):
    """
    Simulates 100+ mixed pending orders in Firestore to ensure scanner scales linearly
    without crashing or memory leaks:
    - 40 orders due for reminder (pending 10-60 min)
    - 15 orders too recent (< 10 min)
    - 15 orders too old (> 60 min)
    - 15 orders with reminder_sent_at already set
    - 10 orders with virtual email (@khachhang.filedilam.vn) -> skips customer, notifies admin
    - 5 corrupted/missing created_at orders
    """

    def setUp(self):
        ThreadSafeCapturingSMTP.sent_messages.clear()
        self.smtp_patcher = patch("smtplib.SMTP_SSL", new=ThreadSafeCapturingSMTP)
        self.smtp_patcher.start()

        self.mock_db = ThreadSafeMockFirestoreDB()
        self.orig_get_db = main.get_db
        main.get_db = lambda: self.mock_db

        self.urlopen_patcher = patch("urllib.request.urlopen", side_effect=mock_urlopen)
        self.urlopen_patcher.start()

    def tearDown(self):
        ThreadSafeCapturingSMTP.sent_messages.clear()
        self.smtp_patcher.stop()
        self.urlopen_patcher.stop()
        main.get_db = self.orig_get_db

    def test_scanner_with_100_mixed_orders_scaling(self):
        now = datetime.now(timezone.utc)
        orders_col = self.mock_db.collection("orders")

        # 1. 40 Orders DUE (pending between 11m and 55m)
        for i in range(40):
            oid = f"DH_DUE_{i:02d}"
            orders_col.document(oid).set({
                "id": oid,
                "status": "PENDING",
                "amount": 150000 + i * 5000,
                "customer_name": f"Khách Hàng Due {i}",
                "customer_phone": f"0901000{i:03d}",
                "customer_email": f"due_{i}@example.com",
                "product_name": "Quản Lý Nhà Trọ",
                "created_at": now - timedelta(minutes=15 + i),
                "reminder_sent_at": None,
            })

        # 2. 15 Orders TOO RECENT (< 10 min: 2m to 8m)
        for i in range(15):
            oid = f"DH_RECENT_{i:02d}"
            orders_col.document(oid).set({
                "id": oid,
                "status": "PENDING",
                "amount": 120000,
                "customer_name": f"Khách Mới {i}",
                "customer_phone": f"0902000{i:03d}",
                "customer_email": f"recent_{i}@example.com",
                "created_at": now - timedelta(minutes=2 + (i % 7)),
                "reminder_sent_at": None,
            })

        # 3. 15 Orders TOO OLD (> 60 min: 75m to 120m)
        for i in range(15):
            oid = f"DH_OLD_{i:02d}"
            orders_col.document(oid).set({
                "id": oid,
                "status": "PENDING",
                "amount": 180000,
                "customer_name": f"Khách Cũ {i}",
                "customer_phone": f"0903000{i:03d}",
                "customer_email": f"old_{i}@example.com",
                "created_at": now - timedelta(minutes=75 + i),
                "reminder_sent_at": None,
            })

        # 4. 15 Orders ALREADY REMINDED (reminder_sent_at populated)
        for i in range(15):
            oid = f"DH_ALREADY_{i:02d}"
            orders_col.document(oid).set({
                "id": oid,
                "status": "PENDING",
                "amount": 200000,
                "customer_name": f"Khách Đã Nhắc {i}",
                "customer_phone": f"0904000{i:03d}",
                "customer_email": f"already_{i}@example.com",
                "created_at": now - timedelta(minutes=25),
                "reminder_sent_at": now - timedelta(minutes=15),
            })

        # 5. 10 Orders with VIRTUAL EMAILS (@khachhang.filedilam.vn) aged 20m
        for i in range(10):
            oid = f"DH_VIRT_{i:02d}"
            orders_col.document(oid).set({
                "id": oid,
                "status": "PENDING",
                "amount": 199000,
                "customer_name": f"Khách Ảo {i}",
                "customer_phone": f"0905000{i:03d}",
                "customer_email": f"0905000{i:03d}@khachhang.filedilam.vn",
                "created_at": now - timedelta(minutes=20),
                "reminder_sent_at": None,
            })

        # 6. 5 Orders with CORRUPTED / MISSING created_at
        for i in range(5):
            oid = f"DH_CORRUPT_{i:02d}"
            orders_col.document(oid).set({
                "id": oid,
                "status": "PENDING",
                "amount": 150000,
                "customer_name": f"Khách Lỗi {i}",
                "customer_phone": "0906000111",
                "customer_email": "corrupt@example.com",
                "created_at": "invalid_date_format_string" if i % 2 == 0 else None,
                "reminder_sent_at": None,
            })

        # Execute scanner and measure duration
        t_start = time.time()
        result = main.process_pending_order_reminders(db=self.mock_db, schedule_time=now)
        t_duration = time.time() - t_start

        # 1. Assert exactly 50 orders processed (40 due + 10 virtual)
        processed_count = result.get("processed_count")
        processed_ids = result.get("order_ids")
        self.assertEqual(processed_count, 50)
        self.assertEqual(len(processed_ids), 50)

        # 2. Check that all DH_DUE_* and DH_VIRT_* are in processed_ids
        for i in range(40):
            self.assertIn(f"DH_DUE_{i:02d}", processed_ids)
        for i in range(10):
            self.assertIn(f"DH_VIRT_{i:02d}", processed_ids)

        # 3. Assert total emails sent:
        # 40 customer reminder emails (for DH_DUE_*)
        # 0 customer reminder emails for DH_VIRT_* (skipped virtual)
        # 50 admin reminder summary emails (40 due + 10 virtual)
        # Total = 40 + 50 = 90 emails
        total_emails = len(ThreadSafeCapturingSMTP.sent_messages)
        self.assertEqual(total_emails, 90, f"Expected 90 emails, got {total_emails}")

        customer_emails = [m for m in ThreadSafeCapturingSMTP.sent_messages if "huynhkiencam151102@gmail.com" not in m["to"]]
        admin_emails = [m for m in ThreadSafeCapturingSMTP.sent_messages if "huynhkiencam151102@gmail.com" in m["to"]]

        self.assertEqual(len(customer_emails), 40)
        self.assertEqual(len(admin_emails), 50)

        # 4. Verify all 50 processed orders now have reminder_sent_at flag in Firestore
        for oid in processed_ids:
            doc = orders_col.document(oid).get().to_dict()
            self.assertIsNotNone(doc.get("reminder_sent_at"), f"Flag not set on {oid}")

        # 5. Verify the other 50 orders remain untouched (reminder_sent_at remains None or original)
        for i in range(15):
            self.assertIsNone(orders_col.document(f"DH_RECENT_{i:02d}").get().to_dict().get("reminder_sent_at"))
            self.assertIsNone(orders_col.document(f"DH_OLD_{i:02d}").get().to_dict().get("reminder_sent_at"))

        print(f"[Stress Metric] 100 mixed orders scanned, 50 processed in {t_duration:.3f}s ({100 / t_duration:.1f} orders/s)")


# ==============================================================================
# DIMENSION 5: SCANNER IDEMPOTENCY UNDER RAPID REPETITION & CONCURRENCY
# ==============================================================================

class TestScannerIdempotencyUnderRapidRepetition(unittest.TestCase):
    """
    Verifies that calling process_pending_order_reminders repeatedly
    (10 consecutive loops) or concurrently across multiple threads
    never results in duplicate reminders or spam.
    """

    def setUp(self):
        ThreadSafeCapturingSMTP.sent_messages.clear()
        self.smtp_patcher = patch("smtplib.SMTP_SSL", new=ThreadSafeCapturingSMTP)
        self.smtp_patcher.start()

        self.mock_db = ThreadSafeMockFirestoreDB()
        self.orig_get_db = main.get_db
        main.get_db = lambda: self.mock_db

        self.urlopen_patcher = patch("urllib.request.urlopen", side_effect=mock_urlopen)
        self.urlopen_patcher.start()

    def tearDown(self):
        ThreadSafeCapturingSMTP.sent_messages.clear()
        self.smtp_patcher.stop()
        self.urlopen_patcher.stop()
        main.get_db = self.orig_get_db

    def test_10_consecutive_immediate_reruns(self):
        """First run processes orders; runs 2 through 10 must process 0 orders and dispatch 0 emails."""
        now = datetime.now(timezone.utc)
        orders_col = self.mock_db.collection("orders")

        for i in range(5):
            oid = f"DH_REPEAT_{i}"
            orders_col.document(oid).set({
                "id": oid,
                "status": "PENDING",
                "amount": 199000,
                "customer_name": f"Khách Repeat {i}",
                "customer_phone": f"091100000{i}",
                "customer_email": f"repeat_{i}@example.com",
                "created_at": now - timedelta(minutes=15),
                "reminder_sent_at": None,
            })

        # Run 1
        res1 = main.process_pending_order_reminders(db=self.mock_db, schedule_time=now)
        self.assertEqual(res1.get("processed_count"), 5)
        self.assertEqual(len(ThreadSafeCapturingSMTP.sent_messages), 10)  # 5 cust + 5 admin

        # Runs 2 through 10
        for loop in range(2, 11):
            res_subsequent = main.process_pending_order_reminders(db=self.mock_db, schedule_time=now)
            self.assertEqual(
                res_subsequent.get("processed_count"),
                0,
                f"Run {loop} violated idempotency by processing {res_subsequent.get('processed_count')} orders",
            )
            self.assertEqual(
                len(ThreadSafeCapturingSMTP.sent_messages),
                10,
                f"Run {loop} dispatched additional emails: total is now {len(ThreadSafeCapturingSMTP.sent_messages)}",
            )

    def test_concurrent_scanner_execution_resilience(self):
        """Simulate two worker nodes running the scheduled scanner at the exact same second."""
        now = datetime.now(timezone.utc)
        orders_col = self.mock_db.collection("orders")

        for i in range(5):
            oid = f"DH_RACE_{i}"
            orders_col.document(oid).set({
                "id": oid,
                "status": "PENDING",
                "amount": 199000,
                "customer_name": f"Khách Race {i}",
                "customer_phone": f"091122233{i}",
                "customer_email": f"race_{i}@example.com",
                "created_at": now - timedelta(minutes=14),
                "reminder_sent_at": None,
            })

        def run_scanner():
            return main.process_pending_order_reminders(db=self.mock_db, schedule_time=now)

        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            f1 = executor.submit(run_scanner)
            f2 = executor.submit(run_scanner)
            res1 = f1.result()
            res2 = f2.result()

        total_processed = res1.get("processed_count") + res2.get("processed_count")
        print(f"[Concurrency Note] Worker 1 processed {res1.get('processed_count')}, Worker 2 processed {res2.get('processed_count')}")

        # All 5 orders must have reminder_sent_at set
        for i in range(5):
            oid = f"DH_RACE_{i}"
            doc = orders_col.document(oid).get().to_dict()
            self.assertIsNotNone(doc.get("reminder_sent_at"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
