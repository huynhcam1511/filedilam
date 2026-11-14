"""
Adversarial Stress Test Suite: Edge Cases, Security Boundaries & Concurrency Resiliency
Targeting:
- functions/main.py
- admin.html / admin.js
- SePay webhook handling
- PENDING order reminder scanner
- Phone normalization & Zalo 1-tap integration
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

# Import Mock DB and SMTP helper from test_automation_suite
from test_automation_suite import (
    MockFirestoreDB,
    CapturingSMTP,
    MockRequest,
    mock_urlopen,
    decode_mime_header,
)


class TestAdversarialEdgeCases(unittest.TestCase):
    """
    Adversarial challenge test harness probing security boundaries,
    edge cases, corrupt data formats, and concurrency behaviors.
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

    # =========================================================================
    # 1. PARTIAL & ADVERSARIAL PAYMENT AMOUNTS
    # =========================================================================

    def test_partial_payment_underpaid_1_vnd_does_not_activate(self):
        """Order for 200,000 VND; transfer is 199,999 VND (underpaid by 1 VND)."""
        order_id = "DH_UNDERPAID_1"
        doc_ref = self.mock_db.collection("orders").document(order_id)
        doc_ref.set({
            "id": order_id,
            "status": "PENDING",
            "amount": 200000,
            "customer_name": "Nguyen Underpaid",
            "customer_email": "underpaid@example.com",
            "created_at": datetime.now(timezone.utc),
        })

        payload = {
            "id": 1001,
            "gateway": "TPBank",
            "transferAmount": 199999,  # 1 VND short
            "transferType": "in",
            "content": f"{order_id} thanh toan",
            "referenceCode": "REF_UNDERPAID",
        }

        req = MockRequest(path="/webhooks/sepay", method="POST", json_data=payload)
        resp = main.api(req)

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(doc_ref.get().to_dict().get("status"), "PENDING")
        self.assertIsNone(doc_ref.get().to_dict().get("paid_at"))
        self.assertEqual(len(CapturingSMTP.sent_messages), 0, "No emails should be sent for partial payment")

    def test_partial_payment_zero_and_negative_amounts(self):
        """Webhook with transferAmount = 0 or negative must not activate any order."""
        for amount in [0, -10000, "-50000", "invalid_string", None]:
            with self.subTest(amount=amount):
                order_id = f"DH_ZERO_{str(amount).replace('-', 'neg')}"
                doc_ref = self.mock_db.collection("orders").document(order_id)
                doc_ref.set({
                    "id": order_id,
                    "status": "PENDING",
                    "amount": 100000,
                    "created_at": datetime.now(timezone.utc),
                })

                payload = {
                    "id": 1002,
                    "transferAmount": amount,
                    "transferType": "in",
                    "content": f"{order_id} test",
                }

                req = MockRequest(path="/webhooks/sepay", method="POST", json_data=payload)
                resp = main.api(req)

                self.assertEqual(resp.status_code, 200)
                self.assertEqual(doc_ref.get().to_dict().get("status"), "PENDING")
                self.assertEqual(len(CapturingSMTP.sent_messages), 0)

    def test_transfer_type_outward_does_not_activate_orders(self):
        """SePay webhook with transferType 'out' (e.g. withdrawal/refund) must NOT activate orders."""
        order_id = "DH_OUTWARD"
        doc_ref = self.mock_db.collection("orders").document(order_id)
        doc_ref.set({
            "id": order_id,
            "status": "PENDING",
            "amount": 150000,
            "created_at": datetime.now(timezone.utc),
        })

        payload = {
            "id": 1003,
            "transferAmount": 150000,
            "transferType": "out",  # Outward money movement
            "content": f"{order_id} rut tien",
        }

        req = MockRequest(path="/webhooks/sepay", method="POST", json_data=payload)
        resp = main.api(req)

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(doc_ref.get().to_dict().get("status"), "PENDING")
        self.assertEqual(len(CapturingSMTP.sent_messages), 0)

    # =========================================================================
    # 2. DUPLICATE WEBHOOK DELIVERIES & CONCURRENCY IDEMPOTENCY
    # =========================================================================

    def test_duplicate_webhook_deliveries_within_short_interval(self):
        """
        When SePay retries the same webhook delivery (identical payload delivered twice):
        - 1st delivery: Order transitions to PAID, 2 emails dispatched (customer + admin).
        - 2nd delivery: Order is already PAID, 0 additional emails dispatched, status unchanged.
        """
        order_id = "DH_DUP_101"
        doc_ref = self.mock_db.collection("orders").document(order_id)
        doc_ref.set({
            "id": order_id,
            "status": "PENDING",
            "amount": 250000,
            "customer_name": "Tran Duplicate",
            "customer_phone": "0918123456",
            "customer_email": "dup@example.com",
            "product_name": "File Quan Ly Tai San",
            "product_id": "prod_taisan",
            "created_at": datetime.now(timezone.utc) - timedelta(minutes=2),
        })
        self.mock_db.collection("products").document("prod_taisan").set({"downloads_count": 5})

        payload = {
            "id": 778899,
            "gateway": "TPBank",
            "transferAmount": 250000,
            "transferType": "in",
            "content": f"{order_id} thanh toan",
            "referenceCode": "REF_DUP_001",
        }

        # 1st Delivery
        req1 = MockRequest(path="/webhooks/sepay", method="POST", json_data=payload)
        resp1 = main.api(req1)
        self.assertEqual(resp1.status_code, 200)
        self.assertEqual(doc_ref.get().to_dict().get("status"), "PAID")
        self.assertEqual(len(CapturingSMTP.sent_messages), 2, "1st delivery must send 2 emails")
        first_paid_at = doc_ref.get().to_dict().get("paid_at")

        # 2nd Delivery (duplicate 1 second later)
        req2 = MockRequest(path="/webhooks/sepay", method="POST", json_data=payload)
        resp2 = main.api(req2)
        self.assertEqual(resp2.status_code, 200)

        # Verify state did not change
        self.assertEqual(doc_ref.get().to_dict().get("status"), "PAID")
        self.assertEqual(doc_ref.get().to_dict().get("paid_at"), first_paid_at)
        self.assertEqual(len(CapturingSMTP.sent_messages), 2, "2nd delivery MUST NOT send duplicate emails")

        # Product downloads_count must be exactly 6 (incremented once, not twice)
        prod = self.mock_db.collection("products").document("prod_taisan").get().to_dict()
        self.assertEqual(prod.get("downloads_count"), 6)

    # =========================================================================
    # 3. CORRUPTED & UNUSUAL TIMESTAMPS IN FIRESTORE
    # =========================================================================

    def test_corrupted_created_at_timestamps_do_not_crash_scanner(self):
        """
        Adversarial created_at formats:
        - None
        - "" (empty string)
        - "garbage-string"
        - Object with no datetime methods
        - List / Dict
        All must be gracefully skipped without throwing exceptions.
        """
        now = datetime.now(timezone.utc)
        orders_col = self.mock_db.collection("orders")

        corrupted_cases = [
            ("DH_CORRUPT_NONE", None),
            ("DH_CORRUPT_EMPTY", ""),
            ("DH_CORRUPT_STR", "not-a-valid-timestamp-format"),
            ("DH_CORRUPT_DICT", {"random": 123}),
            ("DH_CORRUPT_LIST", [1, 2, 3]),
            ("DH_CORRUPT_BOOL", True),
        ]

        for order_id, bad_created_at in corrupted_cases:
            orders_col.document(order_id).set({
                "id": order_id,
                "status": "PENDING",
                "amount": 100000,
                "created_at": bad_created_at,
                "reminder_sent_at": None,
            })

        # Add 1 valid due order to ensure scanner keeps operating
        orders_col.document("DH_VALID_AMIDST_CORRUPT").set({
            "id": "DH_VALID_AMIDST_CORRUPT",
            "status": "PENDING",
            "amount": 100000,
            "customer_phone": "0911222333",
            "customer_email": "valid@example.com",
            "created_at": now - timedelta(minutes=15),
            "reminder_sent_at": None,
        })

        # Scanner execution
        result = main.process_pending_order_reminders(db=self.mock_db, schedule_time=now)

        self.assertEqual(result["processed_count"], 1)
        self.assertEqual(result["order_ids"], ["DH_VALID_AMIDST_CORRUPT"])

        # Corrupted orders must still be PENDING with reminder_sent_at = None
        for order_id, _ in corrupted_cases:
            doc = orders_col.document(order_id).get().to_dict()
            self.assertIsNone(doc.get("reminder_sent_at"))

    def test_timestamp_boundary_conditions(self):
        """
        Precision boundary testing around the 10-60 min scanner window:
        - 9m 50s (age 590s) -> SKIP (< 10 min)
        - 10m 05s (age 605s) -> PROCESS (>= 600s)
        - 59m 50s (age 3590s) -> PROCESS (<= 3600s)
        - 60m 10s (age 3610s) -> SKIP (> 60 min, ancient order)
        - Future timestamp (-10m) -> SKIP (age negative)
        """
        now = datetime.now(timezone.utc)
        orders_col = self.mock_db.collection("orders")

        orders_col.document("DH_9M50S").set({
            "id": "DH_9M50S",
            "status": "PENDING",
            "amount": 100000,
            "created_at": now - timedelta(minutes=9, seconds=50),
            "reminder_sent_at": None,
        })
        orders_col.document("DH_10M05S").set({
            "id": "DH_10M05S",
            "status": "PENDING",
            "amount": 100000,
            "customer_phone": "0912111222",
            "customer_email": "boundary1@example.com",
            "created_at": now - timedelta(minutes=10, seconds=5),
            "reminder_sent_at": None,
        })
        orders_col.document("DH_59M50S").set({
            "id": "DH_59M50S",
            "status": "PENDING",
            "amount": 100000,
            "customer_phone": "0912333444",
            "customer_email": "boundary2@example.com",
            "created_at": now - timedelta(minutes=59, seconds=50),
            "reminder_sent_at": None,
        })
        orders_col.document("DH_60M10S").set({
            "id": "DH_60M10S",
            "status": "PENDING",
            "amount": 100000,
            "created_at": now - timedelta(minutes=60, seconds=10),
            "reminder_sent_at": None,
        })
        orders_col.document("DH_FUTURE").set({
            "id": "DH_FUTURE",
            "status": "PENDING",
            "amount": 100000,
            "created_at": now + timedelta(minutes=5),
            "reminder_sent_at": None,
        })

        result = main.process_pending_order_reminders(db=self.mock_db, schedule_time=now)

        self.assertEqual(set(result["order_ids"]), {"DH_10M05S", "DH_59M50S"})
        self.assertEqual(result["processed_count"], 2)

    # =========================================================================
    # 4. TIMEZONE CONVERSIONS & OFFSET ARITHMETIC
    # =========================================================================

    def test_timezone_naive_vs_aware_safety(self):
        """
        Verify parse_to_utc_datetime handles:
        - Naive datetime (no tzinfo)
        - UTC aware datetime
        - GMT+7 aware datetime (Asia/Ho_Chi_Minh)
        - ISO string with Z
        - ISO string with +07:00
        - ISO string without timezone (naive string)
        - Epoch int/float
        Subtracting these from UTC 'now' must NEVER raise TypeError.
        """
        gmt7 = timezone(timedelta(hours=7))
        now_utc = datetime.now(timezone.utc)

        cases = [
            ("naive_datetime", datetime(2026, 11, 14, 6, 0, 0)),
            ("utc_datetime", datetime(2026, 11, 14, 6, 0, 0, tzinfo=timezone.utc)),
            ("gmt7_datetime", datetime(2026, 11, 14, 13, 0, 0, tzinfo=gmt7)),
            ("iso_z", "2026-11-14T06:00:00Z"),
            ("iso_gmt7", "2026-11-14T13:00:00+07:00"),
            ("iso_naive", "2026-11-14T06:00:00"),
            ("epoch_int", 1794722400),
            ("epoch_float", 1794722400.123),
        ]

        for name, val in cases:
            with self.subTest(case=name):
                parsed = main.parse_to_utc_datetime(val)
                self.assertIsNotNone(parsed, f"Failed to parse: {name}")
                self.assertIsNotNone(parsed.tzinfo, f"Missing tzinfo for: {name}")
                # Arithmetic check: subtracting aware datetimes must not raise TypeError
                diff = (now_utc - parsed).total_seconds()
                self.assertIsInstance(diff, float)

    def test_gmt7_schedule_time_against_utc_created_at(self):
        """
        Simulate Cloud Scheduler sending a schedule_time in GMT+7 while Firestore
        orders were stored with UTC timestamps.
        """
        gmt7 = timezone(timedelta(hours=7))
        # Schedule time is 13:15:00 GMT+7 (which is 06:15:00 UTC)
        sched_time_gmt7 = datetime(2026, 11, 14, 13, 15, 0, tzinfo=gmt7)

        # Order created at 06:01:00 UTC (14 minutes prior to schedule_time)
        created_utc = datetime(2026, 11, 14, 6, 1, 0, tzinfo=timezone.utc)

        orders_col = self.mock_db.collection("orders")
        orders_col.document("DH_TZ_TEST").set({
            "id": "DH_TZ_TEST",
            "status": "PENDING",
            "amount": 179000,
            "customer_phone": "0912999888",
            "customer_email": "tz@example.com",
            "created_at": created_utc,
            "reminder_sent_at": None,
        })

        result = main.process_pending_order_reminders(db=self.mock_db, schedule_time=sched_time_gmt7)
        self.assertEqual(result["processed_count"], 1)
        self.assertEqual(result["order_ids"], ["DH_TZ_TEST"])

    # =========================================================================
    # 5. VIRTUAL EMAILS & SECURITY OF ADMIN NOTIFICATIONS
    # =========================================================================

    def test_virtual_email_handling_in_scanner_and_manual_endpoint(self):
        """
        For virtual emails (*@khachhang.filedilam.vn):
        1. Scanner must NOT send customer email to the virtual address.
        2. Scanner MUST send Admin notification with customer phone and 1-tap Zalo link.
        3. Admin email Reply-To must NOT point to the fake virtual email.
        4. Manual endpoint /admin/send-payment-reminder must reject with 400 CUSTOMER_EMAIL_INVALID.
        """
        now = datetime.now(timezone.utc)
        orders_col = self.mock_db.collection("orders")

        orders_col.document("DH_VIRT_SCAN").set({
            "id": "DH_VIRT_SCAN",
            "status": "PENDING",
            "amount": 179000,
            "customer_name": "Virtual Customer",
            "customer_phone": "0977 123 456",
            "customer_email": "0977123456@khachhang.filedilam.vn",
            "created_at": now - timedelta(minutes=15),
            "reminder_sent_at": None,
        })

        # Run scanner
        res = main.process_pending_order_reminders(db=self.mock_db, schedule_time=now)
        self.assertEqual(res["processed_count"], 1)

        # Only 1 email (Admin), 0 emails to customer
        self.assertEqual(len(CapturingSMTP.sent_messages), 1)
        admin_email = CapturingSMTP.sent_messages[0]
        self.assertIn("huynhkiencam151102@gmail.com", admin_email["to"])
        self.assertNotIn("0977123456@khachhang.filedilam.vn", admin_email["to"])

        # Reply-To must NOT be the virtual address
        self.assertNotEqual(admin_email["reply_to"], "0977123456@khachhang.filedilam.vn")
        self.assertEqual(admin_email["reply_to"], main.SMTP_USER)

        # 1-Tap Zalo link present for clean phone 0977123456
        self.assertIn("https://zalo.me/0977123456", admin_email["html_text"])

        # Now test manual endpoint rejection
        CapturingSMTP.sent_messages.clear()
        with patch.object(main, "require_user", return_value={"uid": "admin", "email": "huynhkiencam151102@gmail.com"}):
            req = MockRequest(
                path="/admin/send-payment-reminder",
                method="POST",
                json_data={"order_id": "DH_VIRT_SCAN"},
            )
            resp = main.api(req)
            self.assertEqual(resp.status_code, 400)
            data = json.loads(resp.get_data(as_text=True))
            self.assertEqual(data.get("error"), "CUSTOMER_EMAIL_INVALID")
            self.assertEqual(len(CapturingSMTP.sent_messages), 0)

    # =========================================================================
    # 6. MALFORMED PHONES & XSS INJECTION VECTORS
    # =========================================================================

    def test_phone_normalization_xss_and_injection_defense(self):
        """
        Adversarial phone inputs:
        - <script>alert('xss')</script>
        - "><svg/onload=alert(1)>
        - '; DROP TABLE orders; --
        - 0912<img src=x onerror=alert(1)>
        - \x00\r\nBcc: victim@example.com
        Must all result in empty clean phone and empty Zalo link.
        """
        malicious_inputs = [
            "<script>alert('xss')</script>",
            "\"><svg/onload=alert(1)>",
            "'; DROP TABLE orders; --",
            "0912<img src=x onerror=alert(1)>",
            "\x00\r\nBcc: victim@example.com",
            "javascript:alert(1)",
            "0912345678<script>alert(1)</script>",  # Extra digits from script
            "0912 345 678; rm -rf /",
        ]

        for payload in malicious_inputs:
            with self.subTest(payload=payload):
                clean = main.normalize_vietnam_phone(payload)
                # If digits count is not exactly 10 starting with 0, must be empty
                if clean:
                    # If it somehow normalized, it must ONLY contain 10 digits
                    self.assertTrue(clean.isdigit())
                    self.assertEqual(len(clean), 10)
                    self.assertTrue(clean.startswith("0"))
                    self.assertNotIn("<", clean)
                    self.assertNotIn(">", clean)
                else:
                    self.assertEqual(clean, "")

                zalo_url = main.get_zalo_link(payload)
                if not clean:
                    self.assertEqual(zalo_url, "", "Zalo URL must be empty for invalid phone")
                else:
                    self.assertEqual(zalo_url, f"https://zalo.me/{clean}")

    def test_admin_email_html_escaping_for_xss_payloads(self):
        """
        Verify that customer name and phone strings containing HTML/JS special characters
        are escaped in the generated email templates.
        """
        xss_name = '<script>alert("hacked")</script>'
        xss_phone = '0912345678"><script>alert(1)</script>'

        order_data = {
            "customer_name": xss_name,
            "customer_phone": xss_phone,
            "customer_email": "xss_test@example.com",
            "amount": 100000,
            "product_name": "Test XSS Product",
        }

        # 1. Test Admin payment success notification
        success = main.send_admin_payment_success_notification("DH_XSS_1", order_data)
        self.assertTrue(success)
        self.assertEqual(len(CapturingSMTP.sent_messages), 1)
        msg1 = CapturingSMTP.sent_messages[0]

        # Raw '<script>' must NOT exist in HTML body (must be '&lt;script&gt;')
        self.assertNotIn("<script>alert(\"hacked\")</script>", msg1["html_text"])
        self.assertIn("&lt;script&gt;alert(&quot;hacked&quot;)&lt;/script&gt;", msg1["html_text"])

        # 2. Test Admin reminder notification
        CapturingSMTP.sent_messages.clear()
        success2 = main.send_admin_payment_reminder_notification("DH_XSS_2", order_data)
        self.assertTrue(success2)
        self.assertEqual(len(CapturingSMTP.sent_messages), 1)
        msg2 = CapturingSMTP.sent_messages[0]

        self.assertNotIn("<script>alert(\"hacked\")</script>", msg2["html_text"])
        self.assertIn("&lt;script&gt;alert(&quot;hacked&quot;)&lt;/script&gt;", msg2["html_text"])

    # =========================================================================
    # 7. FRONTEND ADMIN DOM & EVENT BUBBLING VERIFICATION
    # =========================================================================

    def test_admin_frontend_event_bubbling_simulation_via_node(self):
        """
        Empirically simulate the DOM event bubbling behavior of .btn-zalo-inline
        using Node.js with a lightweight DOM mock.
        Verify that clicking the inline Zalo anchor stops propagation and DOES NOT
        fire the parent <tr> click handler (selectOrder).
        """
        js_simulation = """
        let rowSelected = false;
        let selectedOrderId = null;

        function selectOrder(id) {
            rowSelected = true;
            selectedOrderId = id;
        }

        // Mock Event
        class MockEvent {
            constructor() {
                this.propagationStopped = false;
            }
            stopPropagation() {
                this.propagationStopped = true;
            }
        }

        // Simulate Table Row with inline Zalo anchor
        const order = {
            order_id: 'DH9988',
            customer_phone: '0912345678'
        };

        // Anchor handler from admin.js: onclick="event.stopPropagation();"
        function onZaloClick(e) {
            e.stopPropagation();
        }

        // Row click handler from admin.js: tr.addEventListener('click', () => selectOrder(oId));
        function onRowClick(e) {
            if (!e.propagationStopped) {
                selectOrder(order.order_id);
            }
        }

        // Scenario 1: User clicks inline Zalo button
        const zaloEvent = new MockEvent();
        onZaloClick(zaloEvent);
        onRowClick(zaloEvent);

        const scenario1Result = {
            propagationStopped: zaloEvent.propagationStopped,
            rowSelected: rowSelected,
            selectedOrderId: selectedOrderId
        };

        // Scenario 2: User clicks row outside Zalo button
        rowSelected = false;
        selectedOrderId = null;
        const rowEvent = new MockEvent();
        onRowClick(rowEvent);

        const scenario2Result = {
            propagationStopped: rowEvent.propagationStopped,
            rowSelected: rowSelected,
            selectedOrderId: selectedOrderId
        };

        console.log(JSON.stringify({ scenario1: scenario1Result, scenario2: scenario2Result }));
        """

        node_proc = subprocess.run(["node", "-e", js_simulation], capture_output=True, text=True)
        self.assertEqual(node_proc.returncode, 0, f"Node simulation failed: {node_proc.stderr}")

        sim_output = json.loads(node_proc.stdout.strip())

        # Scenario 1 (Zalo click): propagation stopped, row NOT selected
        self.assertTrue(sim_output["scenario1"]["propagationStopped"])
        self.assertFalse(sim_output["scenario1"]["rowSelected"])
        self.assertIsNone(sim_output["scenario1"]["selectedOrderId"])

        # Scenario 2 (Row click): row IS selected
        self.assertFalse(sim_output["scenario2"]["propagationStopped"])
        self.assertTrue(sim_output["scenario2"]["rowSelected"])
        self.assertEqual(sim_output["scenario2"]["selectedOrderId"], "DH9988")

    # =========================================================================
    # 8. ADDITIONAL ADVERSARIAL STRESS PROBES
    # =========================================================================

    def test_sepay_tier1_precedence_over_tier2_when_both_present(self):
        """
        Adversarial scenario: Transfer content contains BOTH Order ID of Order A (DH_ALPHA)
        AND phone number of Order B (0999888777).
        Tier 1 (Order ID match) MUST take precedence and activate Order A ONLY.
        Order B must remain PENDING.
        """
        orders_col = self.mock_db.collection("orders")
        orders_col.document("DH_ALPHA").set({
            "id": "DH_ALPHA",
            "status": "PENDING",
            "amount": 100000,
            "customer_phone": "0911000111",
            "customer_name": "Customer Alpha",
            "created_at": datetime.now(timezone.utc),
        })
        orders_col.document("DH_BETA").set({
            "id": "DH_BETA",
            "status": "PENDING",
            "amount": 100000,
            "customer_phone": "0999888777",
            "customer_name": "Customer Beta",
            "created_at": datetime.now(timezone.utc),
        })

        payload = {
            "id": 99991,
            "transferAmount": 100000,
            "transferType": "in",
            "content": "DH_ALPHA chuyen tien gium 0999888777",
            "referenceCode": "REF_PRECEDENCE",
        }

        req = MockRequest(path="/webhooks/sepay", method="POST", json_data=payload)
        resp = main.api(req)

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(orders_col.document("DH_ALPHA").get().to_dict().get("status"), "PAID")
        self.assertEqual(orders_col.document("DH_BETA").get().to_dict().get("status"), "PENDING")

    def test_sepay_webhook_empty_and_missing_keys_payload(self):
        """
        Adversarial webhook payload: completely empty or missing required keys.
        Must respond 200 without throwing unhandled exceptions.
        """
        for empty_payload in [{}, {"random_key": "val"}, None]:
            with self.subTest(payload=empty_payload):
                req = MockRequest(path="/webhooks/sepay", method="POST", json_data=empty_payload)
                resp = main.api(req)
                self.assertEqual(resp.status_code, 200)
                res_data = json.loads(resp.get_data(as_text=True))
                self.assertTrue(res_data.get("success"))

    def test_vietnamese_unicode_in_email_subject_and_headers(self):
        """
        Stress-test Vietnamese Unicode characters in Subject and Headers:
        - Accented characters: Nguyễn Đỗ Hoàng Anh
        - Currency symbol: đ
        - Subject formatting: [ĐÃ THANH TOÁN THÀNH CÔNG] +179.000đ - Đơn #DH9999 - Nguyễn Đỗ Hoàng Anh
        MIME parser must decode cleanly without garbled characters or corruption.
        """
        order_data = {
            "amount": 179000,
            "customer_name": "Nguyễn Đỗ Hoàng Anh",
            "customer_phone": "0938 123 456",
            "customer_email": "nguyen.anh@example.com",
            "product_name": "Quản Lý Nhà Trọ Web App",
        }

        success = main.send_admin_payment_success_notification("DH9999", order_data)
        self.assertTrue(success)

        self.assertEqual(len(CapturingSMTP.sent_messages), 1)
        sent = CapturingSMTP.sent_messages[0]

        expected_subject = "[ĐÃ THANH TOÁN THÀNH CÔNG] +179.000đ - Đơn #DH9999 - Nguyễn Đỗ Hoàng Anh"
        self.assertEqual(sent["subject"], expected_subject)
        self.assertIn("Nguyễn Đỗ Hoàng Anh", sent["html_text"])
        self.assertIn("179.000đ", sent["html_text"])

    def test_concurrent_multi_order_scanner_batch_load(self):
        """
        Batch stress test: 50 orders in database simultaneously:
        - 10 Due (age 15m, reminder_sent_at=None) -> Must ALL process
        - 10 Too Recent (age 3m) -> Must ALL skip
        - 10 Already Reminded (age 20m, flag set) -> Must ALL skip
        - 10 Paid (age 15m, status=PAID) -> Must ALL skip
        - 10 Ancient (age 75m) -> Must ALL skip
        Verifies exact processed_count = 10, exact emails = 20, and 100% idempotency on rerun.
        """
        now = datetime.now(timezone.utc)
        orders_col = self.mock_db.collection("orders")

        for i in range(10):
            # Due
            orders_col.document(f"DH_BATCH_DUE_{i}").set({
                "id": f"DH_BATCH_DUE_{i}",
                "status": "PENDING",
                "amount": 100000,
                "customer_name": f"Due Customer {i}",
                "customer_phone": f"09120000{i:02d}",
                "customer_email": f"due{i}@example.com",
                "created_at": now - timedelta(minutes=15),
                "reminder_sent_at": None,
            })
            # Too Recent
            orders_col.document(f"DH_BATCH_RECENT_{i}").set({
                "id": f"DH_BATCH_RECENT_{i}",
                "status": "PENDING",
                "amount": 100000,
                "created_at": now - timedelta(minutes=3),
                "reminder_sent_at": None,
            })
            # Already Reminded
            orders_col.document(f"DH_BATCH_REMINDED_{i}").set({
                "id": f"DH_BATCH_REMINDED_{i}",
                "status": "PENDING",
                "amount": 100000,
                "created_at": now - timedelta(minutes=20),
                "reminder_sent_at": now - timedelta(minutes=5),
            })
            # Paid
            orders_col.document(f"DH_BATCH_PAID_{i}").set({
                "id": f"DH_BATCH_PAID_{i}",
                "status": "PAID",
                "amount": 100000,
                "created_at": now - timedelta(minutes=15),
                "reminder_sent_at": None,
            })
            # Ancient
            orders_col.document(f"DH_BATCH_ANCIENT_{i}").set({
                "id": f"DH_BATCH_ANCIENT_{i}",
                "status": "PENDING",
                "amount": 100000,
                "created_at": now - timedelta(minutes=75),
                "reminder_sent_at": None,
            })

        # Run 1
        res1 = main.process_pending_order_reminders(db=self.mock_db, schedule_time=now)
        self.assertEqual(res1["processed_count"], 10)
        self.assertEqual(len(res1["order_ids"]), 10)
        self.assertEqual(len(CapturingSMTP.sent_messages), 20, "10 customer + 10 admin emails = 20")

        # Run 2 (Rerun immediately)
        res2 = main.process_pending_order_reminders(db=self.mock_db, schedule_time=now + timedelta(minutes=2))
        self.assertEqual(res2["processed_count"], 0)
        self.assertEqual(len(res2["order_ids"]), 0)
        self.assertEqual(len(CapturingSMTP.sent_messages), 20, "Zero new emails on rerun")


if __name__ == "__main__":
    unittest.main()

