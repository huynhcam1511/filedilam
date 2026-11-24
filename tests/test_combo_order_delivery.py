# -*- coding: utf-8 -*-
"""
Automated Verification Suite for Combo Order Processing and Delivery Email Splitting
Targeting:
- functions/main.py: extract_combo_items, normalize_product_type, send_single_delivery_email, send_order_success_email
- Validation of Acceptance Criteria:
  1. Combo extraction with product_name, product_file_url, product_type
  2. N independent delivery emails for N child files in combo (never lumped together)
  3. Combo 2 Apps Script -> Exactly 2 separate emails with Web App guide
  4. Combo 1 Apps Script + 1 Google Sheets -> Exactly 2 separate emails with respective guides
  5. Combo 2 Google Sheets -> Exactly 2 separate emails with Sheets guide
  6. General combo N files -> Exactly N separate emails with corresponding templates
  7. Single orders (Apps Script and Sheets) -> Exactly 1 email with no regressions
"""
from __future__ import annotations

import email
import email.header
import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# Ensure hermetic environment regardless of host machine dependencies
for mod in [
    'firebase_functions', 'firebase_functions.https_fn', 'firebase_functions.options', 'firebase_functions.scheduler_fn',
    'firebase_admin', 'firebase_admin.initialize_app', 'firebase_admin.get_app', 'firebase_admin.firestore', 'firebase_admin.auth',
    'google', 'google.cloud', 'google.cloud.firestore'
]:
    if mod not in sys.modules:
        sys.modules[mod] = MagicMock()

# Add functions directory to path
FUNCTIONS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "functions"))
if FUNCTIONS_DIR not in sys.path:
    sys.path.insert(0, FUNCTIONS_DIR)

import main


def parse_email_message(raw_msg_str: str) -> tuple[str, str, str]:
    """Parse raw MIME email string into decoded (Subject, plain_text, html_content)."""
    msg = email.message_from_string(raw_msg_str)
    
    # Decode subject
    subject = ""
    for text, enc in email.header.decode_header(msg.get("Subject", "")):
        if isinstance(text, bytes):
            subject += text.decode(enc or "utf-8", errors="replace")
        else:
            subject += str(text)

    # Decode body parts
    body_text = ""
    body_html = ""
    for part in msg.walk():
        content_type = part.get_content_type()
        payload = part.get_payload(decode=True)
        if payload:
            decoded_content = payload.decode("utf-8", errors="replace")
            if content_type == "text/plain":
                body_text += decoded_content
            elif content_type == "text/html":
                body_html += decoded_content

    return subject, body_text, body_html


class CapturingSMTP:
    """In-memory SMTP server mock capturing all sent email messages and calls."""
    sent_messages = []

    def __init__(self, host=None, port=None, timeout=None):
        self.host = host
        self.port = port
        self.timeout = timeout

    def login(self, user, password):
        return (235, b"2.7.0 Accepted")

    def sendmail(self, from_addr, to_addrs, msg_str):
        CapturingSMTP.sent_messages.append({
            "from": from_addr,
            "to": to_addrs,
            "raw": msg_str
        })
        return {}

    def quit(self):
        return (221, b"2.0.0 Bye")


class TestComboOrderDelivery(unittest.TestCase):
    """
    Test suite verifying combo order extraction, separation into independent emails,
    and matching email guides for Google Sheets and Apps Script Web Apps.
    """

    def setUp(self):
        CapturingSMTP.sent_messages.clear()
        self.smtp_patcher = patch("smtplib.SMTP_SSL", new=CapturingSMTP)
        self.smtp_patcher.start()

    def tearDown(self):
        self.smtp_patcher.stop()

    def test_extract_combo_items_explicit_payload(self):
        """R1: Test extracting combo items from explicit combo_items payload."""
        order_data = {
            "product_id": "combo-pro",
            "product_name": "Combo 2 Trong 1",
            "is_combo": True,
            "combo_items": [
                {
                    "product_id": "app-script-1",
                    "product_name": "Quản Lý Kho Mini Web App",
                    "product_file_url": "https://docs.google.com/spreadsheets/d/abc12345/edit",
                    "product_type": "apps_script"
                },
                {
                    "product_id": "sheets-1",
                    "product_name": "Quản Lý Bán Hàng Smart Sheets",
                    "product_file_url": "https://docs.google.com/spreadsheets/d/xyz67890/edit",
                    "product_type": "google_sheets"
                }
            ]
        }
        items = main.extract_combo_items(order_data)
        self.assertEqual(len(items), 2)

        # File 1
        self.assertEqual(items[0]["product_name"], "Quản Lý Kho Mini Web App")
        self.assertEqual(items[0]["product_type"], "apps_script")
        self.assertEqual(items[0]["product_file_url"], "https://docs.google.com/spreadsheets/d/abc12345/copy")

        # File 2
        self.assertEqual(items[1]["product_name"], "Quản Lý Bán Hàng Smart Sheets")
        self.assertEqual(items[1]["product_type"], "google_sheets")
        self.assertEqual(items[1]["product_file_url"], "https://docs.google.com/spreadsheets/d/xyz67890/copy")

    def test_combo_two_apps_script_files_triggers_exactly_two_separate_emails(self):
        """
        Acceptance Criteria:
        Đơn hàng combo gồm 2 file Apps Script kích hoạt CHÍNH XÁC 2 email riêng biệt:
        mỗi email hướng dẫn kích hoạt Web App Apps Script cho từng file tương ứng.
        """
        order_data = {
            "id": "DH882910",
            "product_id": "combo-2-apps-script",
            "product_name": "Combo 2 Web App Apps Script",
            "is_combo": True,
            "combo_items": [
                {
                    "product_name": "Quản Lý Nhà Trọ Web App",
                    "product_file_url": "https://docs.google.com/spreadsheets/d/tro111/copy",
                    "product_type": "apps_script"
                },
                {
                    "product_name": "Bảng Tính Giá Vốn F&B Costing Web App",
                    "product_file_url": "https://docs.google.com/spreadsheets/d/fnb222/copy",
                    "product_type": "apps_script"
                }
            ]
        }

        success = main.send_order_success_email(
            customer_email="khachhang@gmail.com",
            customer_name="Trần Văn A",
            order_id="DH882910",
            order_data=order_data
        )

        self.assertTrue(success)
        self.assertEqual(len(CapturingSMTP.sent_messages), 2, "Phải gửi CHÍNH XÁC 2 email riêng biệt")

        # Email 1: Quản Lý Nhà Trọ Web App
        sub1, txt1, html1 = parse_email_message(CapturingSMTP.sent_messages[0]["raw"])
        self.assertIn("Quản Lý Nhà Trọ Web App", sub1)
        self.assertIn("DH882910", sub1)
        self.assertIn("Quản Lý Nhà Trọ Web App", html1)
        self.assertIn("tro111/copy", html1)
        # Verify Web App Guide & Red Warning Box present
        self.assertIn("LƯU Ý CỰC KỲ QUAN TRỌNG TRƯỚC KHI BẮT ĐẦU", html1)
        self.assertIn("Quy trình 6 bước kích hoạt lần đầu", html1)
        self.assertIn("Bắt đầu Bước 1: Khởi động & Tạo bản sao (Quản Lý Nhà Trọ Web App)", html1)
        # Verify File 2 is NOT in Email 1 delivery button
        self.assertNotIn("fnb222/copy", html1)

        # Email 2: Bảng Tính Giá Vốn F&B Costing Web App
        sub2, txt2, html2 = parse_email_message(CapturingSMTP.sent_messages[1]["raw"])
        self.assertIn("Bảng Tính Giá Vốn F&B Costing Web App", sub2)
        self.assertIn("DH882910", sub2)
        self.assertIn("Bảng Tính Giá Vốn F&B Costing Web App", html2)
        self.assertIn("fnb222/copy", html2)
        # Verify Web App Guide & Red Warning Box present
        self.assertIn("LƯU Ý CỰC KỲ QUAN TRỌNG TRƯỚC KHI BẮT ĐẦU", html2)
        self.assertIn("Quy trình 6 bước kích hoạt lần đầu", html2)
        self.assertIn("Bắt đầu Bước 1: Khởi động & Tạo bản sao (Bảng Tính Giá Vốn F&B Costing Web App)", html2)
        # Verify File 1 is NOT in Email 2 delivery button
        self.assertNotIn("tro111/copy", html2)

    def test_combo_one_apps_script_and_one_google_sheets(self):
        """
        Acceptance Criteria:
        Đơn hàng combo gồm 1 file Apps Script và 1 file Google Sheets kích hoạt CHÍNH XÁC 2 email riêng biệt:
        1 email hướng dẫn Sheets cho file Sheets và 1 email hướng dẫn Apps Script cho file Apps Script.
        """
        order_data = {
            "id": "DH993812",
            "product_id": "combo-hybrid",
            "product_name": "Combo Quản Lý Toàn Diện",
            "is_combo": True,
            "combo_items": [
                {
                    "product_name": "Quản Lý Kho Mini Web App",
                    "product_file_url": "https://docs.google.com/spreadsheets/d/khoWebAppId/copy",
                    "product_type": "apps_script"
                },
                {
                    "product_name": "Kế Hoạch Tài Chính Cá Nhân Sheets",
                    "product_file_url": "https://docs.google.com/spreadsheets/d/sheetsPlanId/copy",
                    "product_type": "google_sheets"
                }
            ]
        }

        success = main.send_order_success_email(
            customer_email="nguyenvana@gmail.com",
            customer_name="Nguyễn Văn A",
            order_id="DH993812",
            order_data=order_data
        )

        self.assertTrue(success)
        self.assertEqual(len(CapturingSMTP.sent_messages), 2, "Phải gửi CHÍNH XÁC 2 email riêng biệt")

        # Email 1: Apps Script Web App
        sub1, txt1, html1 = parse_email_message(CapturingSMTP.sent_messages[0]["raw"])
        self.assertIn("Quản Lý Kho Mini Web App", sub1)
        self.assertIn("khoWebAppId/copy", html1)
        self.assertIn("LƯU Ý CỰC KỲ QUAN TRỌNG TRƯỚC KHI BẮT ĐẦU", html1)
        self.assertIn("Quy trình 6 bước kích hoạt lần đầu", html1)
        self.assertNotIn("sheetsPlanId/copy", html1)

        # Email 2: Google Sheets
        sub2, txt2, html2 = parse_email_message(CapturingSMTP.sent_messages[1]["raw"])
        self.assertIn("Kế Hoạch Tài Chính Cá Nhân Sheets", sub2)
        self.assertIn("sheetsPlanId/copy", html2)
        # Google Sheets guide MUST be present
        self.assertIn("Hướng dẫn nhận và sử dụng file Google Sheets", html2)
        self.assertIn("Tạo bản sao Google Sheets (Kế Hoạch Tài Chính Cá Nhân Sheets)", html2)
        # Apps Script warning box and 6 steps MUST NOT be present in Sheets email!
        self.assertNotIn("LƯU Ý CỰC KỲ QUAN TRỌNG TRƯỚC KHI BẮT ĐẦU", html2)
        self.assertNotIn("Quy trình 6 bước kích hoạt lần đầu", html2)
        self.assertNotIn("khoWebAppId/copy", html2)

    def test_combo_two_google_sheets_files(self):
        """
        Acceptance Criteria:
        Đơn hàng combo gồm 2 file Google Sheets kích hoạt CHÍNH XÁC 2 email riêng biệt:
        mỗi email hướng dẫn Sheets cho từng file tương ứng.
        """
        order_data = {
            "id": "DH112233",
            "product_id": "combo-sheets-pair",
            "product_name": "Combo 2 File Google Sheets",
            "is_combo": True,
            "combo_items": [
                {
                    "product_name": "Sổ Thu Chi Gia Đình Google Sheets",
                    "product_file_url": "https://docs.google.com/spreadsheets/d/thuchi123/copy",
                    "product_type": "google_sheets"
                },
                {
                    "product_name": "Bảng Theo Dõi Công Nợ Google Sheets",
                    "product_file_url": "https://docs.google.com/spreadsheets/d/congno456/copy",
                    "product_type": "google_sheets"
                }
            ]
        }

        success = main.send_order_success_email(
            customer_email="lethib@gmail.com",
            customer_name="Lê Thị B",
            order_id="DH112233",
            order_data=order_data
        )

        self.assertTrue(success)
        self.assertEqual(len(CapturingSMTP.sent_messages), 2, "Phải gửi CHÍNH XÁC 2 email riêng biệt")

        sub1, txt1, html1 = parse_email_message(CapturingSMTP.sent_messages[0]["raw"])
        self.assertIn("Sổ Thu Chi Gia Đình Google Sheets", sub1)
        self.assertIn("thuchi123/copy", html1)
        self.assertIn("Hướng dẫn nhận và sử dụng file Google Sheets", html1)
        self.assertNotIn("LƯU Ý CỰC KỲ QUAN TRỌNG TRƯỚC KHI BẮT ĐẦU", html1)
        self.assertNotIn("congno456/copy", html1)

        sub2, txt2, html2 = parse_email_message(CapturingSMTP.sent_messages[1]["raw"])
        self.assertIn("Bảng Theo Dõi Công Nợ Google Sheets", sub2)
        self.assertIn("congno456/copy", html2)
        self.assertIn("Hướng dẫn nhận và sử dụng file Google Sheets", html2)
        self.assertNotIn("LƯU Ý CỰC KỲ QUAN TRỌNG TRƯỚC KHI BẮT ĐẦU", html2)
        self.assertNotIn("thuchi123/copy", html2)

    def test_general_combo_n_files(self):
        """
        Acceptance Criteria:
        Tổng quát cho combo N file con: gửi chính xác N email riêng biệt với đúng template theo product_type của từng file.
        """
        n = 4
        combo_items = [
            {"product_name": f"File Apps Script {i}", "product_file_url": f"https://docs.google.com/spreadsheets/d/as{i}/copy", "product_type": "apps_script"}
            for i in range(1, 3)
        ] + [
            {"product_name": f"File Sheets {j}", "product_file_url": f"https://docs.google.com/spreadsheets/d/sh{j}/copy", "product_type": "google_sheets"}
            for j in range(1, 3)
        ]

        order_data = {
            "id": "DH_MEGA_4",
            "product_id": "combo-mega-4",
            "product_name": "Gói Combo Mega 4 File",
            "is_combo": True,
            "combo_items": combo_items
        }

        success = main.send_order_success_email(
            customer_email="vip@filedilam.vn",
            customer_name="Khách VIP",
            order_id="DH_MEGA_4",
            order_data=order_data
        )

        self.assertTrue(success)
        self.assertEqual(len(CapturingSMTP.sent_messages), n, f"Phải gửi chính xác {n} email")

        for idx, item in enumerate(combo_items):
            sub, txt, html = parse_email_message(CapturingSMTP.sent_messages[idx]["raw"])
            self.assertIn(item["product_name"], sub)
            self.assertIn(item["product_file_url"], html)
            if item["product_type"] == "apps_script":
                self.assertIn("LƯU Ý CỰC KỲ QUAN TRỌNG TRƯỚC KHI BẮT ĐẦU", html)
                self.assertIn("Quy trình 6 bước kích hoạt lần đầu", html)
            else:
                self.assertIn("Hướng dẫn nhận và sử dụng file Google Sheets", html)
                self.assertNotIn("LƯU Ý CỰC KỲ QUAN TRỌNG TRƯỚC KHI BẮT ĐẦU", html)

    def test_single_order_regular_sheets_no_regression(self):
        """Đơn hàng đơn lẻ Google Sheets thông thường gửi đúng 1 email, không bị tách."""
        order_data = {
            "id": "DH_SINGLE_1",
            "product_id": "quan-ly-kho",
            "product_name": "Quản Lý Kho Mini Thông Thường",
            "product_file_url": "https://docs.google.com/spreadsheets/d/single111/edit",
            "product_type": "google_sheets"
        }

        success = main.send_order_success_email(
            customer_email="single@gmail.com",
            customer_name="Trần Thị C",
            order_id="DH_SINGLE_1",
            order_data=order_data
        )

        self.assertTrue(success)
        self.assertEqual(len(CapturingSMTP.sent_messages), 1)
        sub, txt, html = parse_email_message(CapturingSMTP.sent_messages[0]["raw"])
        self.assertIn("Quản Lý Kho Mini Thông Thường", sub)
        self.assertIn("single111/copy", html)
        self.assertIn("Hướng dẫn nhận và sử dụng file Google Sheets", html)
        self.assertNotIn("LƯU Ý CỰC KỲ QUAN TRỌNG TRƯỚC KHI BẮT ĐẦU", html)

    def test_single_order_apps_script_no_regression(self):
        """Đơn hàng đơn lẻ Web App Apps Script gửi đúng 1 email kèm hướng dẫn 6 bước."""
        order_data = {
            "id": "DH_SINGLE_2",
            "product_id": "quan-ly-nha-tro",
            "product_name": "Quản Lý Nhà Trọ Web App",
            "product_file_url": "https://docs.google.com/spreadsheets/d/troSingle/edit",
            "product_type": "apps_script"
        }

        success = main.send_order_success_email(
            customer_email="tro@gmail.com",
            customer_name="Chủ Trọ A",
            order_id="DH_SINGLE_2",
            order_data=order_data
        )

        self.assertTrue(success)
        self.assertEqual(len(CapturingSMTP.sent_messages), 1)
        sub, txt, html = parse_email_message(CapturingSMTP.sent_messages[0]["raw"])
        self.assertIn("Quản Lý Nhà Trọ Web App", sub)
        self.assertIn("troSingle/copy", html)
        self.assertIn("LƯU Ý CỰC KỲ QUAN TRỌNG TRƯỚC KHI BẮT ĐẦU", html)
        self.assertIn("Quy trình 6 bước kích hoạt lần đầu", html)

    def test_invalid_email_skips_sending(self):
        """Email không hợp lệ hoặc rỗng bị bỏ qua an toàn."""
        order_data = {
            "id": "DH_ERR_1",
            "product_name": "Test",
            "product_type": "google_sheets"
        }
        self.assertFalse(main.send_order_success_email("", "User", "DH_ERR_1", order_data))
        self.assertFalse(main.send_order_success_email("invalid_email", "User", "DH_ERR_1", order_data))
        self.assertEqual(len(CapturingSMTP.sent_messages), 0)

    def test_mixed_cart_single_and_combo_triggers_all_separate_emails(self):
        """
        Adversarial Edge Case:
        Khách mua giỏ hàng hỗn hợp gồm 1 sản phẩm đơn lẻ Sheets + 1 Combo gồm 2 file Apps Script.
        Hệ thống phải mở rộng và gửi CHÍNH XÁC 3 email riêng biệt, không bỏ sót sản phẩm đơn lẻ.
        """
        order_data = {
            "id": "DH_MIXED_3",
            "product_name": "Sổ Thu Chi Gia Đình Google Sheets + Combo 2 Web App",
            "items": [
                {
                    "product_id": "single-sheets-1",
                    "product_name": "Sổ Thu Chi Gia Đình Google Sheets",
                    "product_file_url": "https://docs.google.com/spreadsheets/d/singleSheets123/edit",
                    "product_type": "google_sheets"
                },
                {
                    "product_id": "combo-apps-1",
                    "product_name": "Combo 2 Web App",
                    "is_combo": True,
                    "combo_items": [
                        {
                            "product_id": "app-1",
                            "product_name": "Quản Lý Kho Mini Web App",
                            "product_file_url": "https://docs.google.com/spreadsheets/d/khoApp111/edit",
                            "product_type": "apps_script"
                        },
                        {
                            "product_id": "app-2",
                            "product_name": "Quản Lý Nhà Trọ Web App",
                            "product_file_url": "https://docs.google.com/spreadsheets/d/troApp222/edit",
                            "product_type": "apps_script"
                        }
                    ]
                }
            ]
        }

        success = main.send_order_success_email(
            customer_email="buyer@test.vn",
            customer_name="Khách Mua Giỏ Hàng",
            order_id="DH_MIXED_3",
            order_data=order_data
        )

        self.assertTrue(success)
        self.assertEqual(len(CapturingSMTP.sent_messages), 3, "Phải gửi CHÍNH XÁC 3 email riêng biệt cho 3 file")

        # Email 1: Single Sheets
        sub1, txt1, html1 = parse_email_message(CapturingSMTP.sent_messages[0]["raw"])
        self.assertIn("Sổ Thu Chi Gia Đình Google Sheets", sub1)
        self.assertIn("singleSheets123/copy", html1)
        self.assertIn("Hướng dẫn nhận và sử dụng file Google Sheets", html1)
        self.assertNotIn("LƯU Ý CỰC KỲ QUAN TRỌNG TRƯỚC KHI BẮT ĐẦU", html1)

        # Email 2: App 1
        sub2, txt2, html2 = parse_email_message(CapturingSMTP.sent_messages[1]["raw"])
        self.assertIn("Quản Lý Kho Mini Web App", sub2)
        self.assertIn("khoApp111/copy", html2)
        self.assertIn("LƯU Ý CỰC KỲ QUAN TRỌNG TRƯỚC KHI BẮT ĐẦU", html2)
        self.assertIn("Quy trình 6 bước kích hoạt lần đầu", html2)

        # Email 3: App 2
        sub3, txt3, html3 = parse_email_message(CapturingSMTP.sent_messages[2]["raw"])
        self.assertIn("Quản Lý Nhà Trọ Web App", sub3)
        self.assertIn("troApp222/copy", html3)
        self.assertIn("LƯU Ý CỰC KỲ QUAN TRỌNG TRƯỚC KHI BẮT ĐẦU", html3)
        self.assertIn("Quy trình 6 bước kích hoạt lần đầu", html3)

    def test_combo_fallback_from_name_split_with_child_links(self):
        """
        Adversarial Edge Case:
        Đơn hàng combo không có mảng combo_items sẵn, nhưng có tên 'Combo A + B' và mảng child_links.
        Hệ thống phải tự động bóc tách thành 2 file con và gửi 2 email riêng biệt tương ứng.
        """
        order_data = {
            "id": "DH_FALLBACK_SPLIT",
            "product_name": "Combo Quản Lý Nhà Trọ Web App + Bảng Quản Lý Kho Google Sheets",
            "is_combo": True,
            "child_links": [
                "https://docs.google.com/spreadsheets/d/troApp999/edit",
                "https://docs.google.com/spreadsheets/d/khoSheets888/edit"
            ]
        }

        success = main.send_order_success_email(
            customer_email="fallback@test.vn",
            customer_name="Người Dùng Fallback",
            order_id="DH_FALLBACK_SPLIT",
            order_data=order_data
        )

        self.assertTrue(success)
        self.assertEqual(len(CapturingSMTP.sent_messages), 2, "Phải bóc tách thành 2 email")

        # Email 1: Apps Script
        sub1, txt1, html1 = parse_email_message(CapturingSMTP.sent_messages[0]["raw"])
        self.assertIn("Quản Lý Nhà Trọ Web App", sub1)
        self.assertIn("troApp999/copy", html1)
        self.assertIn("LƯU Ý CỰC KỲ QUAN TRỌNG TRƯỚC KHI BẮT ĐẦU", html1)

        # Email 2: Google Sheets
        sub2, txt2, html2 = parse_email_message(CapturingSMTP.sent_messages[1]["raw"])
        self.assertIn("Bảng Quản Lý Kho Google Sheets", sub2)
        self.assertIn("khoSheets888/copy", html2)
        self.assertIn("Hướng dẫn nhận và sử dụng file Google Sheets", html2)
        self.assertNotIn("LƯU Ý CỰC KỲ QUAN TRỌNG TRƯỚC KHI BẮT ĐẦU", html2)

    def test_normalize_product_type_accuracy(self):
        """
        Adversarial Edge Case:
        Kiểm tra độ chính xác của normalize_product_type:
        - Các file Sheets thông thường chứa từ khóa nghiệp vụ ('kho', 'f&b') KHÔNG được nhầm thành apps_script.
        - Chỉ các file thực sự là Web App / Apps Script mới trả về 'apps_script'.
        """
        self.assertEqual(main.normalize_product_type("google_sheets", "Quản Lý Kho Mini"), "google_sheets")
        self.assertEqual(main.normalize_product_type("", "Quản Lý Kho Mini Google Sheets"), "google_sheets")
        self.assertEqual(main.normalize_product_type("", "Sổ Bán Hàng & Quản Lý Quán F&B Google Sheets"), "google_sheets")
        self.assertEqual(main.normalize_product_type("excel", "Bảng Tính Giá Vốn"), "google_sheets")
        self.assertEqual(main.normalize_product_type("", "Quản Lý Nhà Trọ Web App"), "apps_script")
        self.assertEqual(main.normalize_product_type("apps_script", "Bất kỳ tên nào"), "apps_script")
        self.assertEqual(main.normalize_product_type("", "Hệ Thống Google Apps Script Tự Động"), "apps_script")

    def test_mixed_cart_from_db_with_unexpanded_items(self):
        """
        Adversarial Edge Case:
        Đơn hàng được lưu vào Firestore và đọc lại khi webhook SePay kích hoạt.
        Lúc này order_data có:
        - items: 2 sản phẩm (1 Combo chưa bóc tách và 1 file Sheets lẻ).
        - combo_items: 3 file con đã bóc tách hoàn chỉnh.
        Hệ thống KHÔNG ĐƯỢC để mảng items chưa bóc tách đè mất 3 file trong combo_items!
        Bắt buộc gửi CHÍNH XÁC 3 email riêng biệt.
        """
        order_data = {
            "id": "DH_DB_MIXED",
            "customer_email": "db_mixed@test.vn",
            "customer_name": "Khách DB Mixed",
            "product_name": "Combo 2 Web App + Sổ Thu Chi Gia Đình",
            "items": [
                {
                    "product_id": "combo-1",
                    "product_name": "Combo 2 Web App",
                    "product_file_url": "https://docs.google.com/spreadsheets/d/comboRaw/edit",
                    "product_type": "apps_script"
                },
                {
                    "product_id": "sheet-1",
                    "product_name": "Sổ Thu Chi Gia Đình Google Sheets",
                    "product_file_url": "https://docs.google.com/spreadsheets/d/thuchi999/edit",
                    "product_type": "google_sheets"
                }
            ],
            "combo_items": [
                {
                    "product_id": "app-1",
                    "product_name": "Quản Lý Kho Mini Web App",
                    "product_file_url": "https://docs.google.com/spreadsheets/d/khoApp111/edit",
                    "product_type": "apps_script"
                },
                {
                    "product_id": "app-2",
                    "product_name": "Quản Lý Nhà Trọ Web App",
                    "product_file_url": "https://docs.google.com/spreadsheets/d/troApp222/edit",
                    "product_type": "apps_script"
                },
                {
                    "product_id": "sheet-1",
                    "product_name": "Sổ Thu Chi Gia Đình Google Sheets",
                    "product_file_url": "https://docs.google.com/spreadsheets/d/thuchi999/edit",
                    "product_type": "google_sheets"
                }
            ]
        }

        success = main.send_order_success_email(
            customer_email="db_mixed@test.vn",
            customer_name="Khách DB Mixed",
            order_id="DH_DB_MIXED",
            order_data=order_data
        )

        self.assertTrue(success)
        self.assertEqual(len(CapturingSMTP.sent_messages), 3, "Phải gửi CHÍNH XÁC 3 email riêng biệt")
        sub1, _, _ = parse_email_message(CapturingSMTP.sent_messages[0]["raw"])
        sub2, _, _ = parse_email_message(CapturingSMTP.sent_messages[1]["raw"])
        sub3, _, _ = parse_email_message(CapturingSMTP.sent_messages[2]["raw"])
        self.assertIn("Quản Lý Kho Mini Web App", sub1)
        self.assertIn("Quản Lý Nhà Trọ Web App", sub2)
        self.assertIn("Sổ Thu Chi Gia Đình Google Sheets", sub3)

    def test_two_combos_order_from_db(self):
        """
        Adversarial Edge Case:
        Khách mua cùng lúc 2 gói Combo trong 1 đơn hàng (VD: 2 gói Combo 2 file = 4 file con).
        Lưu trên DB có items = [Combo A, Combo B] và combo_items = [Child 1, 2, 3, 4].
        Hệ thống phải gửi CHÍNH XÁC 4 email riêng biệt cho 4 file con, không gửi 2 email cho 2 combo.
        """
        order_data = {
            "id": "DH_TWO_COMBOS_DB",
            "customer_email": "two_combos@test.vn",
            "customer_name": "Khách Mua 2 Combo",
            "product_name": "Combo 2 Web App + Combo 2 Sheets",
            "items": [
                {"product_id": "combo-a", "product_name": "Combo 2 Web App", "product_type": "apps_script"},
                {"product_id": "combo-b", "product_name": "Combo 2 Sheets", "product_type": "google_sheets"}
            ],
            "combo_items": [
                {"product_id": "a1", "product_name": "Web App 1", "product_file_url": "https://docs.google.com/spreadsheets/d/a1/copy", "product_type": "apps_script"},
                {"product_id": "a2", "product_name": "Web App 2", "product_file_url": "https://docs.google.com/spreadsheets/d/a2/copy", "product_type": "apps_script"},
                {"product_id": "s1", "product_name": "Sheet File 1", "product_file_url": "https://docs.google.com/spreadsheets/d/s1/copy", "product_type": "google_sheets"},
                {"product_id": "s2", "product_name": "Sheet File 2", "product_file_url": "https://docs.google.com/spreadsheets/d/s2/copy", "product_type": "google_sheets"}
            ]
        }

        success = main.send_order_success_email(
            customer_email="two_combos@test.vn",
            customer_name="Khách Mua 2 Combo",
            order_id="DH_TWO_COMBOS_DB",
            order_data=order_data
        )

        self.assertTrue(success)
        self.assertEqual(len(CapturingSMTP.sent_messages), 4, "Phải gửi CHÍNH XÁC 4 email riêng biệt cho 4 file con")

    def test_combo_items_with_string_ids_db_lookup(self):
        """
        Adversarial Edge Case:
        combo_items chứa mảng string ID (VD: ['prod-app-1', 'prod-sheet-1']).
        Hệ thống tra cứu DB Firestore mô phỏng và bóc tách thành đúng 2 email độc lập.
        """
        mock_db = MagicMock()
        mock_doc1 = MagicMock()
        mock_doc1.exists = True
        mock_doc1.to_dict.return_value = {
            "name": "Quản Lý Kho Mini Web App",
            "sheetUrl": "https://docs.google.com/spreadsheets/d/khoAppDB/edit",
            "type": "apps_script"
        }
        mock_doc2 = MagicMock()
        mock_doc2.exists = True
        mock_doc2.to_dict.return_value = {
            "name": "Kế Hoạch Tài Chính Sheets",
            "sheetUrl": "https://docs.google.com/spreadsheets/d/taiChinhDB/edit",
            "type": "google_sheets"
        }

        def mock_doc_get(doc_id):
            doc = MagicMock()
            if doc_id == "prod-app-1":
                return mock_doc1
            elif doc_id == "prod-sheet-1":
                return mock_doc2
            doc.exists = False
            return doc

        mock_db.collection.return_value.document.side_effect = lambda cid: MagicMock(get=lambda: mock_doc_get(cid))

        with patch.object(main, "get_db", return_value=mock_db):
            order_data = {
                "id": "DH_STR_IDS",
                "customer_email": "str_ids@test.vn",
                "customer_name": "Khách String IDs",
                "product_name": "Combo Tra Cứu DB",
                "is_combo": True,
                "combo_items": ["prod-app-1", "prod-sheet-1"]
            }

            success = main.send_order_success_email(
                customer_email="str_ids@test.vn",
                customer_name="Khách String IDs",
                order_id="DH_STR_IDS",
                order_data=order_data
            )

            self.assertTrue(success)
            self.assertEqual(len(CapturingSMTP.sent_messages), 2)
            sub1, _, html1 = parse_email_message(CapturingSMTP.sent_messages[0]["raw"])
            sub2, _, html2 = parse_email_message(CapturingSMTP.sent_messages[1]["raw"])
            self.assertIn("Quản Lý Kho Mini Web App", sub1)
            self.assertIn("khoAppDB/copy", html1)
            self.assertIn("LƯU Ý CỰC KỲ QUAN TRỌNG TRƯỚC KHI BẮT ĐẦU", html1)
            self.assertIn("Kế Hoạch Tài Chính Sheets", sub2)
            self.assertIn("taiChinhDB/copy", html2)
            self.assertIn("Hướng dẫn nhận và sử dụng file Google Sheets", html2)

    def test_single_order_with_ampersand_in_name_not_split(self):
        """
        Adversarial Edge Case:
        Sản phẩm đơn lẻ có chứa ký tự '&' trong tên như:
        'Quản Lý Tài Sản & Thiết Bị Doanh Nghiệp'
        TUYỆT ĐỐI KHÔNG ĐƯỢC bóc tách thành 2 file con hay gửi 2 email thừa!
        Hệ thống phải nhận diện đúng là 1 sản phẩm đơn lẻ và gửi CHÍNH XÁC 1 email.
        """
        order_data = {
            "id": "DH_AMP_SINGLE",
            "product_name": "Quản Lý Tài Sản & Thiết Bị Doanh Nghiệp",
            "product_file_url": "https://docs.google.com/spreadsheets/d/taisan123/edit",
            "product_type": "google_sheets"
        }

        combo_items = main.extract_combo_items(order_data)
        self.assertEqual(len(combo_items), 0, "extract_combo_items phải trả về rỗng cho sản phẩm đơn có dấu &")

        success = main.send_order_success_email(
            customer_email="taisan@test.vn",
            customer_name="Trần Văn Tài",
            order_id="DH_AMP_SINGLE",
            order_data=order_data
        )

        self.assertTrue(success)
        self.assertEqual(len(CapturingSMTP.sent_messages), 1, "Chỉ được gửi đúng 1 email cho sản phẩm đơn lẻ chứa dấu &")
        sub, _, html = parse_email_message(CapturingSMTP.sent_messages[0]["raw"])
        self.assertIn("Quản Lý Tài Sản & Thiết Bị Doanh Nghiệp", sub)
        self.assertIn("taisan123/copy", html)
        self.assertIn("Hướng dẫn nhận và sử dụng file Google Sheets", html)

    def test_single_order_with_ampersand_in_items_not_split(self):
        """
        Adversarial Edge Case:
        Sản phẩm trong giỏ hàng có tên 'Sổ Bán Hàng & Quản Lý Quán F&B Google Sheets'.
        Nằm trong mảng items của order_data, không được coi là combo khi không có is_combo/combo_items/child_links.
        """
        order_data = {
            "id": "DH_FNB_SINGLE",
            "items": [
                {
                    "product_id": "fnb-prod-1",
                    "product_name": "Sổ Bán Hàng & Quản Lý Quán F&B Google Sheets",
                    "product_file_url": "https://docs.google.com/spreadsheets/d/fnbSheet123/edit",
                    "product_type": "google_sheets"
                }
            ]
        }

        combo_items = main.extract_combo_items(order_data)
        self.assertEqual(len(combo_items), 1, "extract_combo_items phải giữ nguyên 1 item đơn lẻ")

        success = main.send_order_success_email(
            customer_email="fnb@test.vn",
            customer_name="Chủ Quán F&B",
            order_id="DH_FNB_SINGLE",
            order_data=order_data
        )

        self.assertTrue(success)
        self.assertEqual(len(CapturingSMTP.sent_messages), 1, "Chỉ được gửi đúng 1 email cho sản phẩm F&B")
        sub, _, html = parse_email_message(CapturingSMTP.sent_messages[0]["raw"])
        self.assertIn("Sổ Bán Hàng & Quản Lý Quán F&B Google Sheets", sub)
        self.assertIn("fnbSheet123/copy", html)

    def test_ensure_copy_link_with_drive_file_url(self):
        """
        Adversarial Edge Case:
        Link dạng Google Drive (drive.google.com/file/d/...) phải được chuẩn hóa về /copy.
        """
        drive_url = "https://drive.google.com/file/d/1AbC_xYz-12345/view?usp=sharing"
        normalized = main.ensure_copy_link(drive_url)
        self.assertEqual(normalized, "https://drive.google.com/file/d/1AbC_xYz-12345/copy")

    def test_explicit_combo_with_ampersand_in_name_splits_correctly(self):
        """
        Sản phẩm thực sự là combo bắt đầu bằng 'Combo ' có chứa '&' và child_links:
        'Combo Quản Lý Kho & Sổ Bán Hàng' -> Phải bóc tách và gửi 2 email.
        """
        order_data = {
            "id": "DH_COMBO_AMP",
            "product_name": "Combo Quản Lý Kho Mini Web App & Sổ Bán Hàng Google Sheets",
            "child_links": [
                "https://docs.google.com/spreadsheets/d/khoApp888/edit",
                "https://docs.google.com/spreadsheets/d/banHang777/edit"
            ]
        }

        combo_items = main.extract_combo_items(order_data)
        self.assertEqual(len(combo_items), 2)
        self.assertEqual(combo_items[0]["product_name"], "Quản Lý Kho Mini Web App")
        self.assertEqual(combo_items[0]["product_type"], "apps_script")
        self.assertEqual(combo_items[1]["product_name"], "Sổ Bán Hàng Google Sheets")
        self.assertEqual(combo_items[1]["product_type"], "google_sheets")

        success = main.send_order_success_email(
            customer_email="combo_amp@test.vn",
            customer_name="Người Mua Combo",
            order_id="DH_COMBO_AMP",
            order_data=order_data
        )

        self.assertTrue(success)
        self.assertEqual(len(CapturingSMTP.sent_messages), 2)

    def test_nested_combo_items_with_string_ids_db_lookup(self):
        """
        Adversarial Edge Case:
        items chứa sản phẩm có combo_items là mảng string ID ['prod-app-1', 'prod-sheet-1'].
        Xác thực bóc tách qua DB lookup thành công và gửi đủ 2 email riêng biệt.
        """
        mock_db = MagicMock()
        mock_doc1 = MagicMock()
        mock_doc1.exists = True
        mock_doc1.to_dict.return_value = {
            "name": "Quản Lý Kho Mini Web App",
            "sheetUrl": "https://docs.google.com/spreadsheets/d/khoAppNested/edit",
            "type": "apps_script"
        }
        mock_doc2 = MagicMock()
        mock_doc2.exists = True
        mock_doc2.to_dict.return_value = {
            "name": "Kế Hoạch Tài Chính Sheets",
            "sheetUrl": "https://docs.google.com/spreadsheets/d/taiChinhNested/edit",
            "type": "google_sheets"
        }

        def mock_doc_get(doc_id):
            doc = MagicMock()
            if doc_id == "prod-app-1":
                return mock_doc1
            elif doc_id == "prod-sheet-1":
                return mock_doc2
            doc.exists = False
            return doc

        mock_db.collection.return_value.document.side_effect = lambda cid: MagicMock(get=lambda: mock_doc_get(cid))

        with patch.object(main, "get_db", return_value=mock_db):
            order_data = {
                "id": "DH_NESTED_STR_IDS",
                "customer_email": "nested_str@test.vn",
                "customer_name": "Khách Nested String IDs",
                "items": [
                    {
                        "product_id": "combo-nested",
                        "product_name": "Gói Combo Siêu Đẳng",
                        "combo_items": ["prod-app-1", "prod-sheet-1"]
                    }
                ]
            }

            extracted = main.extract_combo_items(order_data)
            self.assertEqual(len(extracted), 2, "Phải bóc tách thành công 2 file từ nested string IDs")

            success = main.send_order_success_email(
                customer_email="nested_str@test.vn",
                customer_name="Khách Nested String IDs",
                order_id="DH_NESTED_STR_IDS",
                order_data=order_data
            )

            self.assertTrue(success)
            self.assertEqual(len(CapturingSMTP.sent_messages), 2)
            sub1, _, html1 = parse_email_message(CapturingSMTP.sent_messages[0]["raw"])
            sub2, _, html2 = parse_email_message(CapturingSMTP.sent_messages[1]["raw"])
            self.assertIn("Quản Lý Kho Mini Web App", sub1)
            self.assertIn("khoAppNested/copy", html1)
            self.assertIn("LƯU Ý CỰC KỲ QUAN TRỌNG TRƯỚC KHI BẮT ĐẦU", html1)
            self.assertIn("Kế Hoạch Tài Chính Sheets", sub2)
            self.assertIn("taiChinhNested/copy", html2)
            self.assertIn("Hướng dẫn nhận và sử dụng file Google Sheets", html2)

    def test_normalize_product_type_spaced_variations(self):
        """
        Adversarial Edge Case:
        Kiểm tra các biến thể định dạng chuỗi của product_type (có dấu cách, gạch nối, hoa thường):
        'web app', 'apps script', 'Google Apps Script', 'google-apps-script'.
        Dù tên sản phẩm không chứa từ khóa gợi ý, hệ thống vẫn phải chuẩn hóa thành 'apps_script'.
        """
        self.assertEqual(main.normalize_product_type("web app", "Bản Quyền 1"), "apps_script")
        self.assertEqual(main.normalize_product_type("apps script", "Bản Quyền 2"), "apps_script")
        self.assertEqual(main.normalize_product_type("Google Apps Script", "Bản Quyền 3"), "apps_script")
        self.assertEqual(main.normalize_product_type("google-apps-script", "Bản Quyền 4"), "apps_script")
        self.assertEqual(main.normalize_product_type("Google Sheets", "Bản Quyền 5"), "google_sheets")
        self.assertEqual(main.normalize_product_type("google-sheet", "Bản Quyền 6"), "google_sheets")

    def test_ensure_copy_link_multi_account_and_open_id(self):
        """
        Adversarial Edge Case:
        Kiểm tra chuẩn hóa các định dạng URL Google Workspace đa tài khoản:
        /u/0/, /u/1/ và dạng link drive open?id=
        """
        u0_sheet = "https://docs.google.com/spreadsheets/u/0/d/sheetMulti0/edit"
        self.assertEqual(main.ensure_copy_link(u0_sheet), "https://docs.google.com/spreadsheets/d/sheetMulti0/copy")

        u1_sheet = "https://docs.google.com/spreadsheets/u/1/d/sheetMulti1/edit#gid=0"
        self.assertEqual(main.ensure_copy_link(u1_sheet), "https://docs.google.com/spreadsheets/d/sheetMulti1/copy")

        u0_drive = "https://drive.google.com/u/0/file/d/driveMulti0/view"
        self.assertEqual(main.ensure_copy_link(u0_drive), "https://drive.google.com/file/d/driveMulti0/copy")

        open_id_drive = "https://drive.google.com/open?id=driveOpenId123"
        self.assertEqual(main.ensure_copy_link(open_id_drive), "https://drive.google.com/file/d/driveOpenId123/copy")

    def test_combo_items_with_web_app_type_receives_apps_script_guide(self):
        """
        Đơn hàng combo chứa file có product_type='web app' và tên chung chung:
        Hệ thống phải gửi email chứa hướng dẫn 6 bước và hộp lưu ý màu đỏ.
        """
        order_data = {
            "id": "DH_WEBAPP_SPACED",
            "is_combo": True,
            "combo_items": [
                {
                    "product_name": "Phần Mềm Quản Trị Hệ Thống",
                    "product_file_url": "https://docs.google.com/spreadsheets/u/1/d/quantri123/edit",
                    "product_type": "web app"
                },
                {
                    "product_name": "Bảng Kế Hoạch Năm",
                    "product_file_url": "https://docs.google.com/spreadsheets/u/0/d/kehoach456/edit",
                    "product_type": "google_sheets"
                }
            ]
        }

        success = main.send_order_success_email(
            customer_email="webapp_spaced@test.vn",
            customer_name="Người Mua WebApp Spaced",
            order_id="DH_WEBAPP_SPACED",
            order_data=order_data
        )

        self.assertTrue(success)
        self.assertEqual(len(CapturingSMTP.sent_messages), 2)

        # Email 1: Apps Script Guide
        sub1, _, html1 = parse_email_message(CapturingSMTP.sent_messages[0]["raw"])
        self.assertIn("Phần Mềm Quản Trị Hệ Thống", sub1)
        self.assertIn("quantri123/copy", html1)
        self.assertIn("LƯU Ý CỰC KỲ QUAN TRỌNG TRƯỚC KHI BẮT ĐẦU", html1)
        self.assertIn("Quy trình 6 bước kích hoạt lần đầu", html1)

        # Email 2: Google Sheets Guide
        sub2, _, html2 = parse_email_message(CapturingSMTP.sent_messages[1]["raw"])
        self.assertIn("Bảng Kế Hoạch Năm", sub2)
        self.assertIn("kehoach456/copy", html2)
        self.assertIn("Hướng dẫn nhận và sử dụng file Google Sheets", html2)
        self.assertNotIn("LƯU Ý CỰC KỲ QUAN TRỌNG TRƯỚC KHI BẮT ĐẦU", html2)


if __name__ == "__main__":
    unittest.main()
