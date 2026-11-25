from firebase_functions import https_fn, options, scheduler_fn
from firebase_admin import initialize_app, get_app, firestore, auth
import random
import string
from datetime import datetime, timezone, timedelta
from promotions import build_promotion_order
from html import escape
import json
import re
import smtplib
import email.utils
import urllib.request
import urllib.parse
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
import base64

SMTP_USER = "kiencam.work@gmail.com"
SMTP_PASS = "eohmiuavreukunhk"
ADMIN_NOTIFICATION_EMAIL = "huynhkiencam151102@gmail.com"

def normalize_vietnam_phone(phone_str: str) -> str:
    """
    Chuẩn hóa số điện thoại Việt Nam về định dạng 10 số bắt đầu bằng '0'.
    Xử lý tiền tố +84, 0084, 84, hoặc 9 số không có 0 đầu.
    """
    if not phone_str:
        return ""
    digits = re.sub(r"\D", "", str(phone_str))
    if not digits:
        return ""
    if digits.startswith("0084"):
        digits = digits[4:]
        if not digits.startswith("0"):
            digits = "0" + digits
    elif digits.startswith("84") and len(digits) >= 11:
        digits = digits[2:]
        if not digits.startswith("0"):
            digits = "0" + digits
    elif not digits.startswith("0") and len(digits) == 9:
        digits = "0" + digits

    if len(digits) == 10 and digits.startswith("0"):
        return digits
    return ""

def get_zalo_link(phone_str: str) -> str:
    """Sinh đường link Zalo 1 chạm https://zalo.me/<SĐT_chuẩn_hóa> hoặc chuỗi rỗng."""
    clean = normalize_vietnam_phone(phone_str)
    if clean:
        return f"https://zalo.me/{clean}"
    return ""

# Tương thích ngược với các tên gọi khác nếu có
normalize_phone_vn = normalize_vietnam_phone
get_zalo_chat_url = get_zalo_link


def ensure_copy_link(url):
    raw = str(url or "").strip()
    if "docs.google.com/spreadsheets" in raw:
        m = re.search(r"docs\.google\.com/spreadsheets/(?:u/\d+/)?d/([a-zA-Z0-9_-]+)", raw)
        if m:
            return f"https://docs.google.com/spreadsheets/d/{m.group(1)}/copy"
    if "drive.google.com" in raw:
        m = re.search(r"drive\.google\.com/(?:(?:u/\d+/)?file/d/|open\?id=)([a-zA-Z0-9_-]+)", raw)
        if m:
            return f"https://drive.google.com/file/d/{m.group(1)}/copy"
    return raw

def normalize_product_type(ptype_str, name=""):
    """
    Chuẩn hoá định dạng sản phẩm:
    - apps_script / web_app -> 'apps_script'
    - google_sheets / excel -> 'google_sheets'
    """
    raw = str(ptype_str or "").strip().lower().replace("-", "_").replace(" ", "_")
    if raw in ["apps_script", "appscript", "web_app", "webapp", "google_apps_script", "app_script"]:
        return "apps_script"
    if raw in ["google_sheets", "googlesheets", "sheet", "sheets", "excel", "xlsx", "google_sheet"]:
        return "google_sheets"

    # Fallback kiểm tra từ khóa trong tên file nếu chưa có định dạng rõ ràng
    name_lower = str(name or "").lower()
    if any(kw in name_lower for kw in ["web app", "webapp", "apps script", "appscript", "google apps script"]):
        return "apps_script"
    return "google_sheets"


def extract_combo_items(order_data):
    """
    Bóc tách và chuẩn hóa danh sách các file con trong đơn hàng combo:
    Mỗi file con trả về đảm bảo đủ các trường:
    - product_name (tên file con)
    - product_file_url (link copy chuẩn)
    - product_type ('apps_script' hoặc 'google_sheets')
    """
    if not isinstance(order_data, dict):
        return []

    # 1. Bóc tách và chuẩn hóa danh sách combo_items cấp cao nhất (nếu có)
    raw_combo = order_data.get("combo_items")
    normalized_combo = []
    if isinstance(raw_combo, list) and len(raw_combo) > 0:
        for it in raw_combo:
            if isinstance(it, dict):
                c_name = it.get("product_name") or it.get("name") or it.get("title") or "File Đã Mua"
                c_url = ensure_copy_link(it.get("product_file_url") or it.get("sheetUrl") or it.get("delivery_link") or it.get("file_url") or "")
                c_type = normalize_product_type(it.get("product_type") or it.get("type"), c_name)
                normalized_combo.append({
                    "product_id": str(it.get("product_id") or it.get("id") or ""),
                    "product_name": c_name,
                    "product_file_url": c_url,
                    "product_type": c_type
                })
            elif isinstance(it, str) and it.strip():
                cid = it.strip()
                try:
                    db_conn = get_db()
                    if db_conn:
                        c_doc = db_conn.collection("products").document(cid).get()
                        if c_doc.exists:
                            cd = c_doc.to_dict()
                            c_name = cd.get("name") or "File Google Sheets"
                            c_url = ensure_copy_link(cd.get("sheetUrl") or cd.get("delivery_link") or cd.get("fileUrl") or "")
                            c_type = normalize_product_type(cd.get("type"), c_name)
                            normalized_combo.append({
                                "product_id": cid,
                                "product_name": c_name,
                                "product_file_url": c_url,
                                "product_type": c_type
                            })
                except Exception:
                    pass

    # 2. Bóc tách và mở rộng từ danh sách items (nếu có)
    items = order_data.get("items")
    expanded_from_items = []
    if isinstance(items, list) and len(items) > 0:
        for it in items:
            if not isinstance(it, dict):
                continue
            nested = it.get("combo_items")
            if isinstance(nested, list) and len(nested) > 0:
                for c in nested:
                    if isinstance(c, dict):
                        c_name = c.get("product_name") or c.get("name") or c.get("title") or "File Đã Mua"
                        c_url = ensure_copy_link(c.get("product_file_url") or c.get("sheetUrl") or c.get("delivery_link") or c.get("file_url") or "")
                        c_type = normalize_product_type(c.get("product_type") or c.get("type"), c_name)
                        expanded_from_items.append({
                            "product_id": str(c.get("product_id") or c.get("id") or ""),
                            "product_name": c_name,
                            "product_file_url": c_url,
                            "product_type": c_type
                        })
                    elif isinstance(c, str) and c.strip():
                        cid = c.strip()
                        try:
                            db_conn = get_db()
                            if db_conn:
                                c_doc = db_conn.collection("products").document(cid).get()
                                if c_doc.exists:
                                    cd = c_doc.to_dict()
                                    c_name = cd.get("name") or "File Google Sheets"
                                    c_url = ensure_copy_link(cd.get("sheetUrl") or cd.get("delivery_link") or cd.get("fileUrl") or "")
                                    c_type = normalize_product_type(cd.get("type"), c_name)
                                    expanded_from_items.append({
                                        "product_id": cid,
                                        "product_name": c_name,
                                        "product_file_url": c_url,
                                        "product_type": c_type
                                    })
                        except Exception:
                            pass
            else:
                # Kiểm tra nếu item này là combo nhưng chưa được lồng combo_items
                it_name = str(it.get("product_name") or it.get("name") or it.get("title") or "")
                it_name_lower = it_name.lower()
                is_it_combo = (
                    it.get("is_combo") is True
                    or str(it.get("product_type") or "").lower() == "combo"
                    or str(it.get("type") or "").lower() == "combo"
                    or it_name_lower.startswith("combo ")
                    or it_name_lower.startswith("combo-")
                    or it_name_lower.startswith("combo:")
                    or it_name_lower.startswith("gói combo")
                    or (isinstance(it.get("child_links"), list) and len(it.get("child_links")) > 1)
                )
                expanded_sub = []
                it_pid = it.get("product_id")
                if is_it_combo and it_pid:
                    try:
                        db_conn = get_db()
                        if db_conn:
                            p_doc = db_conn.collection("products").document(str(it_pid)).get()
                            if p_doc.exists:
                                p_dict = p_doc.to_dict()
                                db_combo = p_dict.get("combo_items")
                                if isinstance(db_combo, list) and len(db_combo) > 0:
                                    for cid in db_combo:
                                        if isinstance(cid, str):
                                            c_doc = db_conn.collection("products").document(cid).get()
                                            if c_doc.exists:
                                                cd = c_doc.to_dict()
                                                expanded_sub.append({
                                                    "product_id": cid,
                                                    "product_name": cd.get("name") or "File Google Sheets",
                                                    "product_file_url": ensure_copy_link(cd.get("sheetUrl") or cd.get("delivery_link") or cd.get("fileUrl") or ""),
                                                    "product_type": normalize_product_type(cd.get("type"), cd.get("name"))
                                                })
                                        elif isinstance(cid, dict):
                                            c_name = cid.get("product_name") or cid.get("name") or "File Google Sheets"
                                            expanded_sub.append({
                                                "product_id": str(cid.get("product_id") or cid.get("id") or ""),
                                                "product_name": c_name,
                                                "product_file_url": ensure_copy_link(cid.get("product_file_url") or cid.get("sheetUrl") or ""),
                                                "product_type": normalize_product_type(cid.get("product_type") or cid.get("type"), c_name)
                                            })
                    except Exception:
                        pass
                if len(expanded_sub) > 1:
                    expanded_from_items.extend(expanded_sub)
                elif is_it_combo and ("+" in it_name or " & " in it_name):
                    clean_it_name = re.sub(r'^(combo\s*[\-:]*|\s*gói\s*combo[\s\-:]*)', '', it_name, flags=re.I).strip()
                    it_parts = [p.strip() for p in re.split(r'\s*\+\s*|\s+&\s+', clean_it_name) if p.strip()]
                    if len(it_parts) >= 2:
                        it_links = it.get("child_links") or []
                        for idx, part in enumerate(it_parts):
                            p_url = it_links[idx] if (idx < len(it_links) and it_links[idx]) else (it.get("product_file_url") or "")
                            expanded_from_items.append({
                                "product_id": "",
                                "product_name": part,
                                "product_file_url": ensure_copy_link(p_url),
                                "product_type": normalize_product_type("", part)
                            })
                    else:
                        c_name = it_name or "File Đã Mua"
                        c_url = ensure_copy_link(it.get("product_file_url") or it.get("sheetUrl") or it.get("delivery_link") or it.get("file_url") or "")
                        c_type = normalize_product_type(it.get("product_type") or it.get("type"), c_name)
                        expanded_from_items.append({
                            "product_id": str(it.get("product_id") or it.get("id") or ""),
                            "product_name": c_name,
                            "product_file_url": c_url,
                            "product_type": c_type
                        })
                else:
                    c_name = it_name or "File Đã Mua"
                    c_url = ensure_copy_link(it.get("product_file_url") or it.get("sheetUrl") or it.get("delivery_link") or it.get("file_url") or "")
                    c_type = normalize_product_type(it.get("product_type") or it.get("type"), c_name)
                    expanded_from_items.append({
                        "product_id": str(it.get("product_id") or it.get("id") or ""),
                        "product_name": c_name,
                        "product_file_url": c_url,
                        "product_type": c_type
                    })

    # Quyết định kết quả bóc tách tối ưu nhất:
    # Ưu tiên danh sách có nhiều file thực tế hơn (tránh trường hợp items chứa combo chưa mở rộng lấn át combo_items đã mở rộng)
    if len(normalized_combo) > 1 and len(normalized_combo) >= len(expanded_from_items):
        return normalized_combo
    if len(expanded_from_items) > 1:
        return expanded_from_items
    if len(normalized_combo) > 0:
        return normalized_combo
    if len(expanded_from_items) > 0:
        return expanded_from_items

    # 3. Kiểm tra cờ combo hoặc từ khóa tên combo
    order_ptype = str(order_data.get("product_type") or "").lower()
    is_combo_flag = order_data.get("is_combo") is True or order_ptype == "combo"
    prod_name = str(order_data.get("product_name") or "")
    if not is_combo_flag:
        name_lower = prod_name.lower()
        if (
            name_lower.startswith("combo ")
            or name_lower.startswith("combo-")
            or name_lower.startswith("combo:")
            or name_lower.startswith("gói combo")
            or (isinstance(order_data.get("child_links"), list) and len(order_data.get("child_links")) > 1)
        ):
            is_combo_flag = True

    # 4. Tra cứu từ Firestore DB nếu có database connection và product_id là combo
    pid = order_data.get("product_id")
    if pid and is_combo_flag:
        try:
            db_conn = get_db()
            if db_conn:
                p_doc = db_conn.collection("products").document(str(pid)).get()
                if p_doc.exists:
                    p_dict = p_doc.to_dict()
                    db_combo = p_dict.get("combo_items")
                    if isinstance(db_combo, list) and len(db_combo) > 0:
                        child_items = []
                        for cid in db_combo:
                            if isinstance(cid, str):
                                c_doc = db_conn.collection("products").document(cid).get()
                                if c_doc.exists:
                                    cd = c_doc.to_dict()
                                    child_items.append({
                                        "product_id": cid,
                                        "product_name": cd.get("name") or "File Google Sheets",
                                        "product_file_url": ensure_copy_link(cd.get("sheetUrl") or cd.get("delivery_link") or cd.get("fileUrl") or ""),
                                        "product_type": normalize_product_type(cd.get("type"), cd.get("name"))
                                    })
                            elif isinstance(cid, dict):
                                c_name = cid.get("product_name") or cid.get("name") or cid.get("title") or "File Google Sheets"
                                c_url = ensure_copy_link(cid.get("product_file_url") or cid.get("sheetUrl") or cid.get("delivery_link") or cid.get("fileUrl") or "")
                                c_type = normalize_product_type(cid.get("product_type") or cid.get("type"), c_name)
                                child_items.append({
                                    "product_id": str(cid.get("product_id") or cid.get("id") or ""),
                                    "product_name": c_name,
                                    "product_file_url": c_url,
                                    "product_type": c_type
                                })
                        if len(child_items) > 1:
                            return child_items
        except Exception:
            pass

    # 5. Phân giải dự phòng từ tên combo (VD: "Combo A + B" hoặc "Combo A & B") kèm child_links nếu có
    if is_combo_flag:
        clean_name = re.sub(r'^(combo\s*[\-:]*|\s*gói\s*combo[\s\-:]*)', '', prod_name, flags=re.I).strip()
        raw_parts = [p.strip() for p in re.split(r'\s*\+\s*|\s+&\s+', clean_name) if p.strip()]
        if len(raw_parts) >= 2:
            child_links = order_data.get("child_links")
            if not isinstance(child_links, list):
                child_links = []
            fallback_items = []
            for idx, part in enumerate(raw_parts):
                part_url = child_links[idx] if (idx < len(child_links) and child_links[idx]) else (order_data.get("product_file_url") or "")
                fallback_items.append({
                    "product_id": "",
                    "product_name": part,
                    "product_file_url": ensure_copy_link(part_url),
                    "product_type": normalize_product_type("", part)
                })
            return fallback_items

    return []


def send_single_delivery_email(customer_email, customer_name, order_id, file_item, order_data=None):
    """
    Gửi đúng 1 email bàn giao file cho 1 sản phẩm/file con độc lập:
    - Tiêu đề gắn liền với tên sản phẩm con cụ thể.
    - Template hướng dẫn tương ứng chính xác:
      + apps_script: Cảnh báo đỏ, 6 bước cấp quyền bảo mật, 1 nút link tạo bản sao.
      + google_sheets: Hướng dẫn Google Sheets 3 bước ngắn gọn, 1 nút link tạo bản sao.
    """
    if not customer_email or "@" not in customer_email:
        print(f"[Email] Bỏ qua gửi email do địa chỉ không hợp lệ: {customer_email}")
        return False

    try:
        order_data = order_data or {}
        product_name = file_item.get("product_name") or order_data.get("product_name") or "File Quản Lý Google Sheets"
        raw_file_url = file_item.get("product_file_url") or order_data.get("product_file_url") or "https://filedilam.web.app"
        file_url = ensure_copy_link(raw_file_url)

        file_ptype = normalize_product_type(file_item.get("product_type") or file_item.get("type"), product_name)
        has_appscript = (file_ptype == "apps_script")

        # Nút bấm nhận file chuẩn Fintech 1-chạm cho đúng file này
        btn_title = f"Đã đọc kỹ hướng dẫn &rarr; Bắt đầu Bước 1: Khởi động & Tạo bản sao ({product_name})" if has_appscript else f"Đã đọc kỹ hướng dẫn &rarr; Bắt đầu: Tạo bản sao Google Sheets ({product_name})"
        files_html = f"""
        <div style="margin: 24px 0 20px 0; padding: 22px 20px; background-color: #f0fdf4; border: 2px dashed #059669; border-radius: 10px; text-align: center;">
          <div style="font-size: 13px; font-weight: 700; color: #065f46; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.3px;">
            {"Link khởi động & Cấp quyền Web App (Mở trên máy tính):" if has_appscript else "Link tạo bản sao Google Sheets:"}
          </div>
          <a href="{file_url}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; background-color: #059669; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 15px 24px; border-radius: 8px; letter-spacing: 0.2px; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.25);">
            {btn_title}
          </a>
          <div style="margin-top: 12px; font-size: 12px; color: #64748b; line-height: 1.5;">
            Link dự phòng (Copy dán vào trình duyệt máy tính):<br>
            <a href="{file_url}" target="_blank" style="color: #059669; text-decoration: underline; word-break: break-all;">{file_url}</a>
          </div>
        </div>
        """

        pkg_name = order_data.get("package_name") or "Bản Tự Dùng"

        if has_appscript:
            guide_section_html = """<!-- Hướng dẫn sử dụng & Khởi động Web App Apps Script chuẩn xác từng bước -->
      <!-- Hộp lưu ý quan trọng bắt buộc đọc trước khi làm (Dành cho bản Web App / Apps Script) -->
      <div style="margin-top: 24px; margin-bottom: 24px; padding: 16px 18px; background-color: #fef2f2; border: 1.5px solid #fecaca; border-left: 5px solid #ef4444; border-radius: 8px;">
        <div style="font-size: 14.5px; font-weight: 700; color: #b91c1c; margin-bottom: 8px;">
          LƯU Ý CỰC KỲ QUAN TRỌNG TRƯỚC KHI BẮT ĐẦU:
        </div>
        <div style="font-size: 13.5px; color: #7f1d1d; line-height: 1.6;">
          • <strong>Hãy đọc kỹ toàn bộ 6 bước hướng dẫn bên dưới trước khi thao tác:</strong> Đường link mở file được đặt ở <strong>cuối email này</strong> để bạn nắm rõ các bước xác nhận trước khi bấm.<br>
          • <strong>BẮT BUỘC KÍCH HOẠT LẦN ĐẦU BẰNG MÁY TÍNH (PC / LAPTOP):</strong> Tuyệt đối không bấm kích hoạt lần đầu bằng điện thoại vì trình duyệt di động sẽ chặn pop-up uỷ quyền tài khoản Google.<br>
          • <strong>Sử dụng trên Điện thoại / iPad:</strong> Sau khi hoàn thành xong <strong>Bước 6</strong> trên máy tính, bạn xem hướng dẫn ngay dưới Bước 6 để lấy link mở trên điện thoại / iPad dùng như ứng dụng thật.
        </div>
      </div>

      <div style="padding-top: 10px; border-top: 1px solid #e2e8f0;">
        <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 14px; letter-spacing: -0.2px;">
          Quy trình 6 bước kích hoạt lần đầu (Thực hiện trên máy tính):
        </div>

        <!-- Video hướng dẫn thao tác thực tế -->
        <div style="margin-bottom: 22px; padding: 14px 16px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px;">
          <div style="font-size: 13.5px; font-weight: 600; color: #065f46; margin-bottom: 6px;">
            Video quay màn hình thao tác thực tế (Khuyên xem):
          </div>
          <div style="font-size: 13px; color: #047857; line-height: 1.5; margin-bottom: 10px;">
            Bạn có thể bấm nút bên dưới để xem video quay lại toàn bộ quá trình tạo bản sao và cấp quyền hệ thống trong 30 giây:
          </div>
          <a href="https://filedilam.web.app/assets/guide/huong_dan_kich_hoat_appscript.mp4" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 8px 18px; border-radius: 6px;">
            Xem video hướng dẫn thao tác thực tế
          </a>
        </div>
        
        <div style="font-size: 13.5px; color: #334155; line-height: 1.6;">
          
          <!-- Bước 1 -->
          <div style="margin-bottom: 24px;">
            <div style="margin-bottom: 8px;">
              <strong style="color: #0f172a;">Bước 1. Bấm nút nhận link ở cuối email này &rarr; Bấm "Tạo một bản sao" (Make a copy):</strong><br>
              <span style="color: #64748b; font-size: 13px;">File sẽ được tự động nhân bản và lưu trữ riêng tư vào Google Drive cá nhân của bạn.</span>
            </div>
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; max-width: 520px;">
              <img src="https://filedilam.web.app/assets/guide/01_tao_ban_sao.jpg" alt="Bước 1: Bấm Tạo một bản sao" style="display: block; width: 100%; height: auto;" />
            </div>
          </div>

          <!-- Bước 2 -->
          <div style="margin-bottom: 24px;">
            <div style="margin-bottom: 8px;">
              <strong style="color: #0f172a;">Bước 2. Bấm vào Menu ứng dụng trên thanh công cụ trang tính:</strong><br>
              <span style="color: #64748b; font-size: 13px;">Khi tạo bản sao xong, đợi khoảng <strong>10–20 giây</strong> là bên phải mục <strong>Trợ giúp (Help)</strong> trên thanh menu sẽ xuất hiện nút ứng dụng (VD: <strong>File Đi Làm &rarr; Mở Ứng Dụng Quản Lý</strong>).</span><br>
              <span style="color: #b45309; font-size: 12.5px; font-weight: 600; display: inline-block; margin-top: 5px; background: #fef3c7; padding: 4px 10px; border-radius: 4px; border: 1px solid #fde68a; line-height: 1.45;">Lưu ý: Nếu đợi 10–20 giây chưa thấy nút menu xuất hiện, bạn chỉ cần tải lại trang (F5 hoặc reload trình duyệt).</span>
            </div>
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; max-width: 520px;">
              <img src="https://filedilam.web.app/assets/guide/02_menu_mo_ung_dung.jpg" alt="Bước 2: Bấm menu mở ứng dụng" style="display: block; width: 100%; height: auto;" />
            </div>
          </div>

          <!-- Bước 3 -->
          <div style="margin-bottom: 24px;">
            <div style="margin-bottom: 8px;">
              <strong style="color: #0f172a;">Bước 3. Hộp thoại "Phải uỷ quyền" xuất hiện &rarr; Bấm OK:</strong><br>
              <span style="color: #64748b; font-size: 13px;">Google thông báo tập lệnh cần quyền để chạy trên bảng tính của bạn &rarr; Bấm <strong>OK</strong> rồi chọn tài khoản Gmail của bạn.</span>
            </div>
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; max-width: 520px;">
              <img src="https://filedilam.web.app/assets/guide/03_phai_uy_quyen_ok.jpg" alt="Bước 3: Hộp thoại uỷ quyền bấm OK" style="display: block; width: 100%; height: auto;" />
            </div>
          </div>

          <!-- Bước 4 -->
          <div style="margin-bottom: 24px;">
            <div style="margin-bottom: 8px;">
              <strong style="color: #0f172a;">Bước 4. Màn hình cảnh báo xác minh &rarr; Bấm Nâng cao (Advanced):</strong><br>
              <span style="color: #64748b; font-size: 13px;">Vì đây là bản sao file của bạn, Google hiện cảnh báo lần đầu &rarr; Bấm vào dòng chữ <strong>Nâng cao (Advanced)</strong> ở góc trái bên dưới.</span>
            </div>
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; max-width: 520px;">
              <img src="https://filedilam.web.app/assets/guide/04_canh_bao_bam_nang_cao.jpg" alt="Bước 4: Bấm Nâng cao" style="display: block; width: 100%; height: auto;" />
            </div>
          </div>

          <!-- Bước 5 -->
          <div style="margin-bottom: 24px;">
            <div style="margin-bottom: 8px;">
              <strong style="color: #0f172a;">Bước 5. Bấm vào dòng "Đi tới hệ thống / Menu bản sao (Không an toàn)":</strong><br>
              <span style="color: #64748b; font-size: 13px;">Bấm trực tiếp vào đường link bên dưới để xác nhận mở ứng dụng trên tài khoản của bạn.</span>
            </div>
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; max-width: 520px;">
              <img src="https://filedilam.web.app/assets/guide/05_di_toi_he_thong_khong_an_toan.jpg" alt="Bước 5: Đi tới hệ thống không an toàn" style="display: block; width: 100%; height: auto;" />
            </div>
          </div>

          <!-- Bước 6 -->
          <div style="margin-bottom: 24px;">
            <div style="margin-bottom: 8px;">
              <strong style="color: #0f172a;">Bước 6. Bấm "Tiếp tục" (Hoặc Cho phép / Allow):</strong><br>
              <span style="color: #64748b; font-size: 13px;">Sau khi bấm Cho phép / Tiếp tục xong, bạn bấm lại vào Menu ứng dụng &rarr; Chọn <strong>Mở ứng dụng</strong>. Sau đó đợi khoảng <strong>10–20 giây</strong> là ứng dụng Web App sẽ mở ra. Nếu chưa thấy thì tải lại trang (reload / F5).</span><br>
              <span style="color: #059669; font-size: 12.5px; font-weight: 600; display: inline-block; margin-top: 5px; background: #ecfdf5; padding: 4px 10px; border-radius: 4px; border: 1px solid #a7f3d0; line-height: 1.45;">Bạn chỉ cần cấp quyền duy nhất 1 lần đầu tiên này, những lần sau mở là dùng được ngay!</span>
            </div>
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; max-width: 520px;">
              <img src="https://filedilam.web.app/assets/guide/06_cho_phep_tiep_tuc.jpg" alt="Bước 6: Bấm Tiếp tục / Cho phép" style="display: block; width: 100%; height: auto;" />
            </div>
          </div>

          <!-- Bước 7: Mở trên điện thoại & Safari Home screen -->
          <div style="margin-bottom: 20px; padding: 16px 18px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #059669; border-radius: 8px;">
            <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
              Cách mở trên Điện thoại hoặc iPad / Laptop sau khi hoàn thành Bước 6:
            </div>
            <div style="font-size: 13px; color: #334155; line-height: 1.6;">
              Sau khi đã hoàn thành cấp quyền xong ở <strong>Bước 6</strong> trên máy tính, giao diện Web App sẽ hiển thị ra. Bạn chỉ cần <strong>copy đường link trình duyệt của ứng dụng Web App</strong> đó để gửi qua Zalo / Tin nhắn và mở trực tiếp trên điện thoại, iPad hoặc laptop khác bất kỳ lúc nào mà không cần mở lại file Sheet.<br><br>
              <strong style="color: #0f172a;">Mẹo tạo biểu tượng App ra màn hình chính (Dùng như ứng dụng thật):</strong><br>
              • <strong>Trên iPhone / iPad (Safari):</strong> Bấm biểu tượng <strong>Chia sẻ (Share)</strong> &rarr; Chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>.<br>
              • <strong>Trên Android (Chrome):</strong> Bấm dấu 3 chấm góc phải trên &rarr; Chọn <strong>Cài đặt ứng dụng / Thêm vào màn hình chính</strong>.
            </div>
          </div>

        </div>
      </div>"""
        else:
            guide_section_html = """      <!-- Hướng dẫn sử dụng file Google Sheets thông thường -->
      <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 14px; letter-spacing: -0.2px;">
          Hướng dẫn nhận và sử dụng file Google Sheets:
        </div>
        <div style="font-size: 13.5px; color: #334155; line-height: 1.65;">
          <div style="margin-bottom: 12px;">
            <strong style="color: #0f172a;">1. Bấm nút nhận file ở cuối email này:</strong><br>
            Hệ thống Google Drive sẽ mở trang nhân bản &rarr; Bạn bấm <strong>Tạo một bản sao (Make a copy)</strong>.
          </div>
          <div style="margin-bottom: 12px;">
            <strong style="color: #0f172a;">2. File được lưu vĩnh viễn trên Drive cá nhân:</strong><br>
            Bản sao này hoàn toàn thuộc quyền sở hữu của riêng bạn. Bạn có thể chỉnh sửa dữ liệu, thêm dòng cột hoặc chia sẻ cho nhân sự / cộng sự tùy ý.
          </div>
          <div style="margin-bottom: 16px;">
            <strong style="color: #0f172a;">3. Tương thích mọi thiết bị:</strong><br>
            Bạn có thể mở chỉnh sửa trên máy tính hoặc tải ứng dụng <strong>Google Trang tính (Google Sheets)</strong> trên điện thoại (App Store / CH Play) để theo dõi và nhập liệu mọi lúc mọi nơi.
          </div>
        </div>
      </div>"""

        return_offers = []

        parent_combo_name = order_data.get("product_name") if (order_data.get("is_combo") or order_data.get("combo_items")) else None
        combo_row_html = ""
        if parent_combo_name and parent_combo_name != product_name:
            combo_row_html = f"""
          <tr>
            <td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f8fafc;">Gói Combo:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #059669; border-bottom: 1px solid #f8fafc;">{parent_combo_name}</td>
          </tr>
        """

        html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Kích hoạt đơn hàng #{order_id} - {product_name} - File Đi Làm</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #0f172a; line-height: 1.6; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
    
    <!-- Header: Thanh lịch, chuẩn Fintech kèm Logo chính thức -->
    <div style="padding: 24px 32px 20px 32px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 14px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 44px; vertical-align: middle;">
            <img src="https://filedilam.web.app/assets/logo.jpg" alt="Logo File Đi Làm" style="width: 42px; height: 42px; border-radius: 8px; display: block; border: 1px solid #e2e8f0;" />
          </td>
          <td style="padding-left: 12px; vertical-align: middle;">
            <div style="font-size: 17px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; line-height: 1.2;">File Đi Làm</div>
            <div style="font-size: 13px; color: #64748b; margin-top: 2px;">Xác nhận kích hoạt đơn hàng thành công</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Body Content -->
    <div style="padding: 28px 32px 32px 32px;">
      <p style="font-size: 15px; margin: 0 0 16px 0; color: #334155;">
        Xin chào <strong>{customer_name or 'Quý khách'}</strong>,
      </p>
      <p style="font-size: 14.5px; margin: 0 0 24px 0; color: #334155; line-height: 1.6;">
        Hệ thống File Đi Làm đã nhận đủ thanh toán cho đơn hàng của bạn. {"Bản quyền <strong>Ứng dụng Web App Quản Lý</strong> đã được cấp phép vĩnh viễn" if has_appscript else "Bản quyền <strong>file Google Sheets</strong> đã được cấp phép vĩnh viễn"} vào tài khoản của bạn.
      </p>

      <!-- Bảng thông tin đơn hàng dạng phẳng -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13.5px;">
        <tbody>
          <tr>
            <td style="padding: 8px 0; color: #64748b; width: 110px; border-bottom: 1px solid #f8fafc;">Sản phẩm:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f8fafc;">{product_name}</td>
          </tr>
          {combo_row_html}
          <tr>
            <td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f8fafc;">Mã đơn:</td>
            <td style="padding: 8px 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 600; color: #059669; border-bottom: 1px solid #f8fafc;">#{order_id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f8fafc;">Gói sở hữu:</td>
            <td style="padding: 8px 0; color: #0f172a; border-bottom: 1px solid #f8fafc;">{pkg_name}</td>
          </tr>
        </tbody>
      </table>

{guide_section_html}

      <!-- Danh sách nút nhận file (Chỉ bấm sau khi đã đọc hướng dẫn) -->
      {files_html}
      
      <!-- Hỗ trợ kỹ thuật -->
      <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #f1f5f9; font-size: 13px; color: #64748b; line-height: 1.5;">
        Nếu cần hỗ trợ kỹ thuật hoặc có bất kỳ câu hỏi nào trong quá trình thao tác, bạn vui lòng liên hệ Zalo/Hotline: <strong style="color: #0f172a;">0938 134 576</strong> (hoặc phản hồi trực tiếp email này). Đội ngũ kỹ thuật hỗ trợ cả Thứ 7 và Chủ Nhật.
      </div>
    </div>

    <!-- Footer phẳng, tối giản -->
    <div style="padding: 16px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
      File Đi Làm &middot; Hệ thống quản lý và tự động hoá quy trình trên Google Sheets<br>
      Website: <a href="https://filedilam.web.app" target="_blank" style="color: #64748b; text-decoration: underline;">filedilam.web.app</a>
    </div>
  </div>
</body>
</html>"""

        plain_text = f"""Xin chào {customer_name or 'Quý khách'},

Hệ thống File Đi Làm xác nhận đã nhận đủ thanh toán cho đơn hàng #{order_id}.
Sản phẩm: {product_name}
Phân loại: {pkg_name}

Bạn có thể truy cập link nhận file trực tiếp tại:
{file_url}

Nếu cần hỗ trợ kỹ thuật hoặc có bất kỳ câu hỏi nào, vui lòng liên hệ Zalo/Hotline: 0938 134 576.
Trân trọng,
File Đi Làm - https://filedilam.web.app
"""

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[File Đi Làm] Kích hoạt đơn hàng #{order_id} - {product_name}"
        msg["From"] = f'"File Đi Làm" <{SMTP_USER}>'
        msg["To"] = customer_email
        msg["Reply-To"] = "huynhkiencam151102@gmail.com"
        msg["Date"] = email.utils.formatdate(localtime=True)
        msg["Message-ID"] = email.utils.make_msgid(domain="gmail.com")
        msg.attach(MIMEText(plain_text, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        server = smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15)
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, [customer_email], msg.as_string())
        server.quit()
        print(f"[Email] Gửi email thành công tới {customer_email} cho file {product_name} (đơn #{order_id})")
        return True
    except Exception as e:
        print(f"[Email] Lỗi gửi email cho file {product_name} đơn #{order_id} ({customer_email}): {e}")
        return False


def send_retention_voucher_email(customer_email, customer_name, order_id, order_data=None):
    """
    EMAIL 3 ĐỘC LẬP: Thư cảm ơn và quà tặng đồng hành (Chăm sóc & hỗ trợ công việc sau 30-60 phút).
    - Tiêu đề: Thư cảm ơn và quà tặng đồng hành gửi bạn [Tên khách] - File Đi Làm
    - Tông giọng: Tự nhiên, chân thành như một người đồng nghiệp/sáng lập gửi hỗ trợ công việc.
    - Tránh các từ ngữ kích hoạt bộ lọc quảng cáo (Voucher, giảm %, khuyến mãi sốc, giá gốc, giá niêm yết).
    - Đặc quyền: Tài trợ 30% chi phí khi cần thêm giải pháp đồng hành (quy tắc trần 20.000đ áp dụng ở backend/checkout).
    """
    if not customer_email or "@" not in customer_email:
        return False

    try:
        order_data = order_data or {}
        # Lấy danh sách ID các file khách vừa mua
        purchased_ids = set()
        combo_items = extract_combo_items(order_data)
        for ci in (combo_items or []):
            cid = ci.get("product_id") or ci.get("id")
            if cid:
                purchased_ids.add(str(cid))
        single_pid = order_data.get("product_id")
        if single_pid:
            purchased_ids.add(str(single_pid))

        CATALOG_PRODS = [
            {"id": "PRD-662235", "name": "Quản Lý Kho & Nhập Xuất Tồn", "type": "Web App (Apps Script)", "price": 49000, "original_price": 129000, "sales": 23},
            {"id": "PRD-818270", "name": "Quản Lý Bán Hàng Online", "type": "Google Sheets", "price": 39000, "original_price": 99000, "sales": 67},
            {"id": "PRD-791771", "name": "Tính Giá Vốn F&B", "type": "Web App (Apps Script)", "price": 39000, "original_price": 89000, "sales": 8},
            {"id": "PRD-801788", "name": "Quản Lý Nhà Trọ", "type": "Web App (Apps Script)", "price": 79000, "original_price": 299000, "sales": 1},
            {"id": "PRD-506079", "name": "Quản Lý Tiến Độ Dự Án & Công Việc Đội Nhóm", "type": "Web App (Apps Script)", "price": 69000, "original_price": 149000, "sales": 0},
            {"id": "PRD-262098", "name": "Quản Lý Công Việc & Thói Quen", "type": "Google Sheets", "price": 29000, "original_price": 109000, "sales": 0}
        ]

        available_prods = [p for p in CATALOG_PRODS if p["id"] not in purchased_ids]
        available_prods.sort(key=lambda x: x.get("sales", 0), reverse=True)
        suggested_prods = available_prods[:2]

        raw_name = str(customer_name or "").strip()
        clean_name = "" if raw_name.lower() in ("khách hàng", "quý khách") else raw_name
        safe_name_html = escape(clean_name) if clean_name else "bạn"
        if not clean_name:
            subject_name_part = "bạn"
        elif clean_name.lower().startswith("bạn "):
            subject_name_part = clean_name
        else:
            subject_name_part = f"bạn {clean_name}"
        raw_phone = str(order_data.get("customer_phone") or "").strip()
        clean_phone = normalize_vietnam_phone(raw_phone) or raw_phone

        q_name = urllib.parse.quote(clean_name)
        q_email = urllib.parse.quote(str(customer_email or "").strip())
        q_phone = urllib.parse.quote(clean_phone)
        user_params = f"name={q_name}&email={q_email}&phone={q_phone}&coupon=MEMBER30"

        cards_html = []
        for sp in suggested_prods:
            p_name = sp["name"]
            p_type = sp["type"]
            p_id = sp["id"]
            p_price = sp["price"]
            discount_val = min((p_price * 30 + 50) // 100, 20000)
            member_price = p_price - discount_val
            price_fmt = f"{p_price:,}".replace(",", ".") + " đ"
            member_fmt = f"{member_price:,}".replace(",", ".") + " đ"

            direct_buy_url = f"https://filedilam.web.app/?add={p_id}&{user_params}"

            cards_html.append(f"""
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 18px; margin-bottom: 12px; text-align: left;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="vertical-align: top;">
                    <div style="font-size: 14.5px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
                      {escape(p_name)}
                    </div>
                    <div style="font-size: 12px; color: #059669; font-weight: 500; margin-bottom: 8px;">
                      &bull; {escape(p_type)}
                    </div>
                    <div style="font-size: 13px; color: #64748b; line-height: 1.6;">
                      Mức phí: <span>{price_fmt}</span><br>
                      Đặc quyền thành viên: <strong style="color: #059669; font-size: 14px;">{member_fmt}</strong>
                    </div>
                  </td>
                </tr>
              </table>
              <div style="margin-top: 12px;">
                <a href="{direct_buy_url}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; background-color: #059669; color: #ffffff; text-decoration: none; font-size: 13.5px; font-weight: 700; padding: 11px 16px; border-radius: 6px; letter-spacing: 0.2px;">
                  Xem chi tiết &amp; Nhận giải pháp ({member_fmt}) &rarr;
                </a>
              </div>
            </div>
            """)

        suggested_box_html = "".join(cards_html)
        explore_all_url = f"https://filedilam.web.app/?{user_params}"

        html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Thư cảm ơn và quà tặng đồng hành gửi {escape(subject_name_part)} - File Đi Làm</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #0f172a; line-height: 1.6; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
    
    <!-- Header: Thanh lịch kèm Logo chính thức -->
    <div style="padding: 24px 32px 20px 32px; border-bottom: 1px solid #f1f5f9;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 44px; vertical-align: middle;">
            <img src="https://filedilam.web.app/assets/logo.jpg" alt="Logo File Đi Làm" style="width: 42px; height: 42px; border-radius: 8px; display: block; border: 1px solid #e2e8f0;" />
          </td>
          <td style="padding-left: 12px; vertical-align: middle;">
            <div style="font-size: 17px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; line-height: 1.2;">File Đi Làm</div>
            <div style="font-size: 13px; color: #64748b; margin-top: 2px;">Thư cảm ơn &amp; Đồng hành cùng công việc của bạn</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Body Content -->
    <div style="padding: 28px 32px 32px 32px;">
      <p style="font-size: 15px; margin: 0 0 14px 0; color: #334155;">
        Chào <strong>{safe_name_html}</strong>,
      </p>
      <p style="font-size: 14px; margin: 0 0 14px 0; color: #334155; line-height: 1.65;">
        Mình là Cẩm từ đội ngũ <strong>File Đi Làm</strong>. Trước hết, mình xin gửi lời cảm ơn chân thành vì bạn đã tin tưởng lựa chọn giải pháp từ hệ thống.
      </p>
      <p style="font-size: 14px; margin: 0 0 20px 0; color: #475569; line-height: 1.65;">
        Không biết là bạn đã kịp mở file và bắt đầu thao tác thử chưa? Trong quá trình nhập liệu hoặc vận hành thực tế, nếu gặp bất kỳ vướng mắc nào về cách dùng hoặc cần điều chỉnh thêm theo thói quen làm việc, bạn cứ nhắn tin Zalo cho mình bất cứ lúc nào qua số <strong>0938 134 576</strong> nhé. Đội ngũ luôn sẵn sàng hỗ trợ bạn.
      </p>

      <!-- Khối Quà Tặng Đồng Hành Thiết Kế Phẳng & Tinh Tế -->
      <div style="margin: 22px 0 24px 0; padding: 22px 24px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
        <div style="font-size: 14.5px; font-weight: 700; color: #0f172a; margin-bottom: 6px; letter-spacing: -0.2px;">
          ĐẶC QUYỀN ĐỒNG HÀNH CÙNG BẠN
        </div>
        <p style="font-size: 13.5px; color: #475569; line-height: 1.65; margin: 0 0 14px 0;">
          Để đồng hành lâu dài cùng công việc của bạn, hệ thống đã kích hoạt sẵn <strong>Đặc quyền tài trợ 30% chi phí khi cần thêm giải pháp đồng hành</strong>.
        </p>
        <div style="font-size: 13.5px; color: #334155; margin-bottom: 16px;">
          Mã đặc quyền của bạn: <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 14.5px; font-weight: 700; color: #059669; background: #ecfdf5; padding: 3px 8px; border-radius: 4px; border: 1px solid #a7f3d0;">MEMBER30</span>
        </div>

        <div style="font-size: 12.5px; font-weight: 700; color: #334155; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.3px;">
          2 giải pháp bổ trợ thường được dùng kèm hiệu quả nhất:
        </div>
        {suggested_box_html}

        <div style="text-align: center; margin-top: 16px;">
          <a href="{explore_all_url}" target="_blank" rel="noopener noreferrer" style="font-size: 13.5px; color: #059669; font-weight: 600; text-decoration: underline;">
            Khám phá thêm các giải pháp khác (Đã kích hoạt sẵn MEMBER30) &rarr;
          </a>
        </div>
      </div>

      <!-- Lời kết chân thành -->
      <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #f1f5f9; font-size: 13.5px; color: #64748b; line-height: 1.65;">
        Chúc công việc của bạn luôn trôi chảy và đạt hiệu suất cao nhất mỗi ngày!<br><br>
        Thân mến,<br>
        <strong style="color: #0f172a;">Kiên Cẩm &amp; Đội ngũ File Đi Làm</strong><br>
        <span style="font-size: 12.5px; color: #94a3b8;">Hotline / Zalo hỗ trợ: 0938 134 576</span>
      </div>
    </div>

    <!-- Footer phẳng, tối giản -->
    <div style="padding: 16px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
      File Đi Làm &middot; Hệ thống quản lý và tự động hoá quy trình trên Google Sheets<br>
      Website: <a href="https://filedilam.web.app" target="_blank" style="color: #64748b; text-decoration: underline;">filedilam.web.app</a>
    </div>
  </div>
</body>
</html>"""

        plain_text = f"""Chào {clean_name or 'bạn'},

Mình là Cẩm từ đội ngũ File Đi Làm. Cảm ơn bạn rất nhiều vì đã tin tưởng lựa chọn giải pháp từ hệ thống!

Không biết bạn đã kịp mở file thao tác thử chưa? Nếu có bất kỳ câu hỏi nào trong quá trình sử dụng, bạn cứ nhắn tin cho mình qua Zalo số 0938 134 576 nhé.

Để đồng hành lâu dài cùng bạn, hệ thống đã kích hoạt sẵn Đặc quyền tài trợ 30% chi phí khi cần thêm giải pháp đồng hành:
Mã đặc quyền: MEMBER30

Bạn có thể tham khảo thêm tại:
{explore_all_url}

Chúc công việc của bạn luôn trôi chảy và hiệu quả!
Thân mến,
Kiên Cẩm - File Đi Làm
Hotline/Zalo: 0938 134 576
"""

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Thư cảm ơn và quà tặng đồng hành gửi {subject_name_part} - File Đi Làm"
        msg["From"] = f'"File Đi Làm" <{SMTP_USER}>'
        msg["To"] = customer_email
        msg["Reply-To"] = "huynhkiencam151102@gmail.com"
        msg["Date"] = email.utils.formatdate(localtime=True)
        msg["Message-ID"] = email.utils.make_msgid(domain="gmail.com")
        msg.attach(MIMEText(plain_text, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        server = smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15)
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, [customer_email], msg.as_string())
        server.quit()
        print(f"[Email] Đã gửi thư cảm ơn & quà tặng đồng hành tới {customer_email}")
        return True
    except Exception as e:
        print(f"[Email] Lỗi gửi thư cảm ơn tới {customer_email}: {e}")
        return False

def send_order_success_email(customer_email, customer_name, order_id, order_data):
    """
    Xử lý gửi email bàn giao đơn hàng thành công:
    - Nếu là đơn hàng COMBO (có danh sách combo_items gồm N file con):
      BẮT BUỘC tách riêng chính xác N email độc lập cho từng file con.
      TUYỆT ĐỐI KHÔNG gom chung dù các file cùng là Apps Script hay cùng là Google Sheets.
    - Nếu là đơn hàng đơn lẻ: Gửi đúng 1 email cho sản phẩm đó.
    """
    if not customer_email or "@" not in customer_email:
        print(f"[Email] Bỏ qua gửi email do địa chỉ không hợp lệ: {customer_email}")
        return False

    order_data = order_data or {}
    combo_items = extract_combo_items(order_data)

    if combo_items and len(combo_items) > 1:
        print(f"[Email] Đơn hàng combo #{order_id} có {len(combo_items)} file con -> Tách gửi {len(combo_items)} email riêng biệt.")
        all_success = True
        for idx, item in enumerate(combo_items, 1):
            print(f"[Email] Gửi email bàn giao file con {idx}/{len(combo_items)}: {item.get('product_name')} ({item.get('product_type')})")
            success = send_single_delivery_email(
                customer_email=customer_email,
                customer_name=customer_name,
                order_id=order_id,
                file_item=item,
                order_data=order_data
            )
            if not success:
                all_success = False
        return all_success
    else:
        # Đơn hàng đơn lẻ (hoặc combo chỉ có 1 file)
        single_item = combo_items[0] if (combo_items and len(combo_items) == 1) else {
            "product_name": order_data.get("product_name") or "File Quản Lý Google Sheets",
            "product_file_url": order_data.get("product_file_url") or "https://filedilam.web.app",
            "product_type": order_data.get("product_type") or "google_sheets",
            "product_id": order_data.get("product_id") or ""
        }
        return send_single_delivery_email(
            customer_email=customer_email,
            customer_name=customer_name,
            order_id=order_id,
            file_item=single_item,
            order_data=order_data
        )

def send_admin_new_order_notification(order_id, order_data):
    """
    Gửi thông báo có đơn hàng mới từ kiencam.work@gmail.com đến huynhkiencam151102@gmail.com
    giúp Admin nắm bắt ngay đơn hàng mới tạo trên hệ thống, kèm link Zalo 1 chạm.
    """
    try:
        cust_name = order_data.get("customer_name") or "Khách hàng"
        cust_email = order_data.get("customer_email") or "Chưa cung cấp"
        cust_phone = order_data.get("customer_phone") or "Chưa cung cấp"
        clean_phone = normalize_vietnam_phone(cust_phone)
        zalo_link = get_zalo_link(cust_phone)
        amount = int(order_data.get("amount") or 0)
        amount_fmt = f"{amount:,}".replace(",", ".") + " đ"
        product_name = order_data.get("product_name") or "Sản phẩm File Đi Làm"
        package_name = order_data.get("package_name") or "Bản Tự Dùng"
        status = order_data.get("status") or "PENDING"
        status_label = "Đã thanh toán (PAID)" if status == "PAID" else "Chờ thanh toán (PENDING)"

        items = order_data.get("items") or []
        items_detail = ""
        if isinstance(items, list) and len(items) > 0:
            item_rows = []
            for idx, it in enumerate(items, 1):
                i_name = escape(str(it.get("product_name") or it.get("name") or "File"))
                i_price = f"{int(it.get('price') or 0):,}".replace(",", ".") + " đ"
                item_rows.append(f"<tr><td style='padding:6px 10px; border-bottom:1px solid #f1f5f9; font-size:13px; color:#334155;'>{idx}. {i_name}</td><td style='padding:6px 10px; border-bottom:1px solid #f1f5f9; font-size:13px; text-align:right; font-weight:600; color:#0f172a;'>{i_price}</td></tr>")
            items_detail = f"""
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0;">
              <tr><th align="left" style="padding:8px 10px; font-size:12px; color:#64748b; font-weight:600; border-bottom:1px solid #e2e8f0;">Chi tiết sản phẩm</th><th align="right" style="padding:8px 10px; font-size:12px; color:#64748b; font-weight:600; border-bottom:1px solid #e2e8f0;">Giá</th></tr>
              {''.join(item_rows)}
            </table>
            """

        phone_cell_html = f'<a href="tel:{escape(cust_phone)}" style="color:#059669; text-decoration:none;">{escape(cust_phone)}</a>'
        if zalo_link:
            phone_cell_html += f' <a href="{zalo_link}" target="_blank" rel="noopener noreferrer" style="margin-left: 8px; display: inline-block; background-color: #0068ff; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; vertical-align: middle;">Chat Zalo</a>'

        zalo_cta_html = ""
        if zalo_link:
            zalo_cta_html = f"""
            <div style="margin: 18px 0; text-align: center;">
              <a href="{zalo_link}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #0068ff; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 20px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 104, 255, 0.3);">
                Mở Chat Zalo Với Khách ({cust_phone})
              </a>
            </div>
            """

        html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Đơn hàng mới #{order_id}</title>
</head>
<body style="margin: 0; padding: 16px 8px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.5;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
    <div style="height: 4px; background: #059669;"></div>
    <div style="padding: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <span style="font-size: 13px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 0.5px;">File Đi Làm &bull; Thông báo đơn hàng</span>
        <span style="font-size: 12px; color: #64748b; font-family: monospace;">#{order_id}</span>
      </div>
      <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #0f172a;">Có đơn hàng mới #{order_id}</h2>
      
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <tr>
          <td style="padding: 8px 12px; font-size: 13px; color: #64748b; width: 120px; border-bottom: 1px solid #f1f5f9;">Trạng thái:</td>
          <td style="padding: 8px 12px; font-size: 13px; font-weight: 600; color: {'#059669' if status == 'PAID' else '#d97706'}; border-bottom: 1px solid #f1f5f9;">{status_label}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Tổng tiền:</td>
          <td style="padding: 8px 12px; font-size: 14px; font-weight: 700; color: #059669; font-family: monospace; border-bottom: 1px solid #f1f5f9;">{amount_fmt}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Khách hàng:</td>
          <td style="padding: 8px 12px; font-size: 13px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">{escape(cust_name)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Email:</td>
          <td style="padding: 8px 12px; font-size: 13px; color: #0f172a; font-family: monospace; border-bottom: 1px solid #f1f5f9;">{escape(cust_email)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Số điện thoại:</td>
          <td style="padding: 8px 12px; font-size: 13px; font-weight: 600; color: #0f172a; font-family: monospace; border-bottom: 1px solid #f1f5f9;">{phone_cell_html}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-size: 13px; color: #64748b;">Sản phẩm:</td>
          <td style="padding: 8px 12px; font-size: 13px; color: #0f172a;">{escape(product_name)} ({escape(package_name)})</td>
        </tr>
      </table>

      {items_detail}

      {zalo_cta_html}

      <div style="margin-top: 20px; text-align: center;">
        <a href="https://filedilam.web.app/admin.html" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 8px;">Mở Admin Dashboard</a>
      </div>
    </div>
  </div>
</body>
</html>"""

        zalo_plain = f" (Zalo: {zalo_link})" if zalo_link else ""
        plain_text = f"""[File Đi Làm] Có đơn hàng mới #{order_id}

- Trạng thái: {status_label}
- Tổng tiền: {amount_fmt}
- Khách hàng: {cust_name}
- Email: {cust_email}
- SĐT: {cust_phone}{zalo_plain}
- Sản phẩm: {product_name} ({package_name})
- Link Zalo 1 chạm: {zalo_link or 'Chưa có'}

Xem chi tiết tại: https://filedilam.web.app/admin.html
"""

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[Đơn Mới #{order_id}] {amount_fmt} - {cust_name} ({product_name[:30]})"
        msg["From"] = f'"File Đi Làm" <{SMTP_USER}>'
        msg["To"] = ADMIN_NOTIFICATION_EMAIL
        msg["Reply-To"] = cust_email if ("@" in cust_email and not cust_email.endswith("@khachhang.filedilam.vn")) else SMTP_USER
        msg["Date"] = email.utils.formatdate(localtime=True)
        msg["Message-ID"] = email.utils.make_msgid(domain="gmail.com")
        msg.attach(MIMEText(plain_text, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        server = smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15)
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, [ADMIN_NOTIFICATION_EMAIL], msg.as_string())
        server.quit()
        print(f"[Admin Email] Đã gửi thông báo đơn hàng mới #{order_id} đến {ADMIN_NOTIFICATION_EMAIL}")
        return True
    except Exception as e:
        print(f"[Admin Email] Lỗi gửi thông báo đơn hàng mới #{order_id} đến Admin: {e}")
        return False

def send_admin_payment_success_notification(order_id, order_data, payment_details=None):
    """
    Gửi thông báo 'Nổ tiền' phẳng, tối giản theo chuẩn AGENTS_MASTER.md
    từ kiencam.work@gmail.com đến huynhkiencam151102@gmail.com khi đơn hàng thanh toán thành công.
    Tiêu đề: [ĐÃ THANH TOÁN] +<Số_tiền>đ - Đơn #<Mã_đơn> - <Tên_khách_hàng>
    """
    try:
        amount = int(order_data.get("amount") or 0)
        if not amount and payment_details:
            try:
                amount = int(float(payment_details.get("transferAmount") or 0))
            except (ValueError, TypeError):
                amount = 0
        amount_str = f"{amount:,}".replace(",", ".")
        
        cust_name = order_data.get("customer_name") or "Khách hàng"
        cust_email = order_data.get("customer_email") or "Chưa cung cấp"
        cust_phone = order_data.get("customer_phone") or "Chưa cung cấp"
        clean_phone = normalize_vietnam_phone(cust_phone)
        zalo_link = get_zalo_link(cust_phone)
        
        product_name = order_data.get("product_name") or "Sản phẩm File Đi Làm"
        package_name = order_data.get("package_name") or "Bản Tự Dùng"
        
        sepay_payload = payment_details or {}
        gateway = sepay_payload.get("gateway") or "SePay / Ngân hàng (TPBank)"
        sepay_id = str(sepay_payload.get("id") or order_data.get("sepay_transaction_id") or "Tự động")
        ref_code = str(sepay_payload.get("referenceCode") or order_data.get("reference_code") or "N/A")
        transfer_content = str(sepay_payload.get("content") or sepay_payload.get("description") or f"DH{order_id}")
        
        vn_now_str = datetime.now(timezone(timedelta(hours=7))).strftime("%H:%M:%S %d/%m/%Y")
        
        items = order_data.get("items") or []
        items_detail = ""
        if isinstance(items, list) and len(items) > 0:
            item_rows = []
            for idx, it in enumerate(items, 1):
                i_name = escape(str(it.get("product_name") or it.get("name") or "File"))
                i_price = f"{int(it.get('price') or 0):,}".replace(",", ".") + " đ"
                item_rows.append(f"<tr><td style='padding:4px 0; color:#64748b; font-size:13px;'>{idx}. {i_name}</td><td style='padding:4px 0; text-align:right; font-weight:600; color:#0f172a; font-size:13px;'>{i_price}</td></tr>")
            items_detail = f"""
            <div style="padding-top: 14px; border-top: 1px solid #f1f5f9; margin-bottom: 18px;">
              <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                Chi tiết sản phẩm / Combo
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                {''.join(item_rows)}
              </table>
            </div>
            """

        phone_cell_html = f'<a href="tel:{escape(cust_phone)}" style="color:#0f172a; text-decoration:none; font-weight:600;">{escape(cust_phone)}</a>'
        if zalo_link:
            phone_cell_html += f' <a href="{zalo_link}" target="_blank" rel="noopener noreferrer" style="margin-left:8px; color:#0068ff; text-decoration:none; font-size:12px; font-weight:600;">Nhắn Zalo &rarr;</a>'

        zalo_cta_html = ""
        if zalo_link:
            zalo_cta_html = f"""
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 8px;">
              <tr>
                <td>
                  <a href="{zalo_link}" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; box-sizing: border-box; background-color: #059669; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 600; line-height: 46px; height: 46px; border-radius: 8px; text-align: center;">
                    Mở Zalo khách ({cust_phone})
                  </a>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top: 12px;">
                  <a href="https://filedilam.web.app/admin.html" target="_blank" style="font-size: 12.5px; color: #64748b; text-decoration: none;">
                    Mở trang quản trị Admin &rarr;
                  </a>
                </td>
              </tr>
            </table>
            """
        else:
            zalo_cta_html = f"""
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 8px;">
              <tr>
                <td align="center">
                  <a href="https://filedilam.web.app/admin.html" target="_blank" style="font-size: 13px; color: #059669; text-decoration: none; font-weight: 600;">
                    Mở trang quản trị Admin &rarr;
                  </a>
                </td>
              </tr>
            </table>
            """

        html_content = f"""<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Đã thanh toán #{order_id}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.5;">
  <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
    
    <!-- Header phẳng, tối giản thương hiệu -->
    <div style="padding: 20px 24px 16px 24px; border-bottom: 1px solid #f1f5f9;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="left">
            <span style="font-size: 13px; font-weight: 700; color: #059669; letter-spacing: 0.3px;">FILE ĐI LÀM</span>
            <span style="color: #cbd5e1; margin: 0 6px;">|</span>
            <span style="font-size: 13px; color: #64748b;">Nổ tiền SePay</span>
          </td>
          <td align="right">
            <span style="font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; font-weight: 600; color: #64748b;">#{order_id}</span>
          </td>
        </tr>
      </table>
    </div>

    <div style="padding: 24px;">
      
      <!-- Số tiền biến động phẳng, thanh lịch -->
      <div style="margin-bottom: 24px;">
        <div style="font-size: 12px; color: #64748b; font-weight: 500; margin-bottom: 4px;">Số tiền thực nhận</div>
        <div style="font-size: 32px; font-weight: 700; color: #059669; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: -0.5px; line-height: 1;">
          +{amount_str} đ
        </div>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 6px;">
          Ghi nhận lúc {vn_now_str} &bull; <span style="color: #059669; font-weight: 600;">Đã thanh toán</span>
        </div>
      </div>

      <!-- Khối 1: Khách hàng & Sản phẩm (Phẳng, không đóng khung card) -->
      <div style="padding-top: 16px; border-top: 1px solid #f1f5f9; margin-bottom: 20px;">
        <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
          Thông tin khách hàng
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13.5px;">
          <tr>
            <td style="padding: 5px 0; color: #64748b; width: 110px;">Khách hàng:</td>
            <td style="padding: 5px 0; font-weight: 600; color: #0f172a;">{escape(cust_name)}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748b;">Số điện thoại:</td>
            <td style="padding: 5px 0; color: #0f172a;">{phone_cell_html}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748b;">Email nhận file:</td>
            <td style="padding: 5px 0; color: #0f172a; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 13px;">{escape(cust_email)}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748b;">Sản phẩm:</td>
            <td style="padding: 5px 0; color: #0f172a;">{escape(product_name)} <span style="color: #64748b; font-size: 12px;">({escape(package_name)})</span></td>
          </tr>
        </table>
      </div>

      {items_detail}

      <!-- Khối 2: Chi tiết đối soát giao dịch SePay (Dạng bảng phẳng thanh mảnh) -->
      <div style="padding-top: 16px; border-top: 1px solid #f1f5f9; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
          Chi tiết giao dịch ngân hàng
        </div>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 12.5px;">
          <tr>
            <td style="padding: 4px 0; color: #64748b; width: 110px;">Ngân hàng:</td>
            <td style="padding: 4px 0; color: #0f172a; font-weight: 500;">{escape(gateway)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Mã GD SePay:</td>
            <td style="padding: 4px 0; color: #0f172a; font-family: ui-monospace, Menlo, Consolas, monospace;">{escape(sepay_id)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Mã tham chiếu:</td>
            <td style="padding: 4px 0; color: #0f172a; font-family: ui-monospace, Menlo, Consolas, monospace;">{escape(ref_code)}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Nội dung CK:</td>
            <td style="padding: 4px 0; color: #475569; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px;">{escape(transfer_content)}</td>
          </tr>
        </table>
      </div>

      <!-- Nút hành động chuẩn: Đơn giản, cao 46px, không bóng đổ lòe loẹt -->
      {zalo_cta_html}

    </div>

    <!-- Footer phẳng một dòng -->
    <div style="padding: 12px 24px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 11.5px; color: #94a3b8; text-align: center;">
      File Đi Làm &bull; Thông báo giao dịch tự động SePay
    </div>

  </div>
</body>
</html>"""

        zalo_plain = f" (Zalo: {zalo_link})" if zalo_link else ""
        plain_text = f"""[ĐÃ THANH TOÁN] +{amount_str}đ - Đơn #{order_id} - {cust_name}

Thông tin giao dịch SePay:
- Mã đơn hàng: #{order_id}
- Số tiền: +{amount_str} đ
- Trạng thái: ĐÃ THANH TOÁN (PAID)
- Cổng thanh toán: {gateway}
- Mã GD SePay: {sepay_id}
- Mã tham chiếu: {ref_code}
- Nội dung CK: {transfer_content}
- Thời gian: {vn_now_str} (GMT+7)

Thông tin khách hàng:
- Khách hàng: {cust_name}
- Email: {cust_email}
- SĐT: {cust_phone}{zalo_plain}
- Sản phẩm: {product_name} ({package_name})
- Link Zalo: {zalo_link or 'Chưa có SĐT hợp lệ'}

Xem chi tiết tại Admin Dashboard: https://filedilam.web.app/admin.html
"""

        subject = f"[ĐÃ THANH TOÁN] +{amount_str}đ - Đơn #{order_id} - {cust_name}"
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f'"File Đi Làm" <{SMTP_USER}>'
        msg["To"] = ADMIN_NOTIFICATION_EMAIL
        msg["Reply-To"] = cust_email if ("@" in cust_email and not cust_email.endswith("@khachhang.filedilam.vn")) else SMTP_USER
        msg["Date"] = email.utils.formatdate(localtime=True)
        msg["Message-ID"] = email.utils.make_msgid(domain="gmail.com")
        msg.attach(MIMEText(plain_text, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        server = smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15)
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, [ADMIN_NOTIFICATION_EMAIL], msg.as_string())
        server.quit()
        print(f"[Admin Email] Đã gửi thông báo thanh toán thành công đơn #{order_id} đến {ADMIN_NOTIFICATION_EMAIL}")
        return True
    except Exception as e:
        print(f"[Admin Email] Lỗi gửi thông báo thanh toán thành công đơn #{order_id} đến Admin: {e}")
        return False


# Compatibility alias
def send_admin_payment_notification(order_id, order_data, amount_paid=None, sepay_payload=None):
    if sepay_payload is None and isinstance(amount_paid, dict):
        sepay_payload = amount_paid
    return send_admin_payment_success_notification(order_id, order_data, payment_details=sepay_payload)

def send_admin_payment_reminder_notification(order_id, order_data):
    """
    Gửi email thông báo cho Admin khi hệ thống tự động nhắc đơn hàng PENDING sau 10-15 phút.
    Tiêu đề: [NHẮC THANH TOÁN] Đơn #<Mã_đơn> - <Tên_khách> (SĐT: <SĐT>)
    """
    try:
        cust_name = order_data.get("customer_name") or "Khách hàng"
        cust_email = order_data.get("customer_email") or "Chưa cung cấp"
        cust_phone = order_data.get("customer_phone") or "Chưa cung cấp"
        clean_phone = normalize_vietnam_phone(cust_phone)
        zalo_link = get_zalo_link(cust_phone)
        amount = int(order_data.get("amount") or 0)
        amount_fmt = f"{amount:,}".replace(",", ".") + " đ"
        product_name = order_data.get("product_name") or "Sản phẩm File Đi Làm"
        package_name = order_data.get("package_name") or "Bản Tự Dùng"
        
        subject = f"[NHẮC THANH TOÁN] Đơn #{order_id} - {cust_name} (SĐT: {cust_phone})"
        
        phone_cell_html = f'<a href="tel:{escape(cust_phone)}" style="color:#059669; text-decoration:none;">{escape(cust_phone)}</a>'
        if zalo_link:
            phone_cell_html += f' <a href="{zalo_link}" target="_blank" rel="noopener noreferrer" style="margin-left: 8px; display: inline-block; background-color: #0068ff; color: #ffffff; text-decoration: none; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; vertical-align: middle;">Chat Zalo</a>'

        zalo_btn_html = ""
        if zalo_link:
            zalo_btn_html = f"""
            <div style="margin: 20px 0 16px 0; text-align: center;">
              <a href="{zalo_link}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #0068ff; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 24px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 104, 255, 0.3);">
                Mở Chat Zalo Với Khách Hàng ({cust_phone})
              </a>
            </div>
            """

        html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nhắc thanh toán #{order_id}</title>
</head>
<body style="margin: 0; padding: 16px 8px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.5;">
  <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
    <div style="height: 4px; background: #d97706;"></div>
    <div style="padding: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <span style="font-size: 13px; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 0.5px;">File Đi Làm &bull; Tự động nhắc thanh toán</span>
        <span style="font-size: 12px; color: #64748b; font-family: monospace;">#{order_id}</span>
      </div>
      <h2 style="margin: 0 0 12px 0; font-size: 17px; font-weight: 700; color: #0f172a;">Đơn hàng #{order_id} sau 10 phút chưa thanh toán</h2>
      
      <p style="margin: 0 0 16px 0; font-size: 13.5px; color: #475569; line-height: 1.6;">
        Đơn #{order_id} của khách <strong>{escape(cust_name)}</strong> (SĐT: {escape(cust_phone)}) sau 10 phút chưa thanh toán. Hệ thống đã tự động gửi email nhắc thanh toán kèm mã VietQR cho khách.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <tr>
          <td style="padding: 8px 12px; font-size: 13px; color: #64748b; width: 120px; border-bottom: 1px solid #f1f5f9;">Trạng thái:</td>
          <td style="padding: 8px 12px; font-size: 13px; font-weight: 600; color: #d97706; border-bottom: 1px solid #f1f5f9;">Đang chờ thanh toán (PENDING)</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Số tiền:</td>
          <td style="padding: 8px 12px; font-size: 14px; font-weight: 700; color: #059669; font-family: monospace; border-bottom: 1px solid #f1f5f9;">{amount_fmt}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Khách hàng:</td>
          <td style="padding: 8px 12px; font-size: 13px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">{escape(cust_name)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Email:</td>
          <td style="padding: 8px 12px; font-size: 13px; color: #0f172a; font-family: monospace; border-bottom: 1px solid #f1f5f9;">{escape(cust_email)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-size: 13px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Số điện thoại:</td>
          <td style="padding: 8px 12px; font-size: 13px; font-weight: 600; color: #0f172a; font-family: monospace; border-bottom: 1px solid #f1f5f9;">{phone_cell_html}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-size: 13px; color: #64748b;">Sản phẩm:</td>
          <td style="padding: 8px 12px; font-size: 13px; color: #0f172a;">{escape(product_name)} ({escape(package_name)})</td>
        </tr>
      </table>

      {zalo_btn_html}

      <div style="margin-top: 20px; text-align: center;">
        <a href="https://filedilam.web.app/admin.html" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 8px;">Mở Admin Dashboard</a>
      </div>
    </div>
  </div>
</body>
</html>"""

        zalo_plain = f" (Zalo: {zalo_link})" if zalo_link else ""
        plain_text = f"""[File Đi Làm] Thông báo nhắc thanh toán đơn hàng #{order_id}

Đơn #{order_id} - {cust_name} (SĐT: {cust_phone}) sau 10 phút chưa thanh toán. Hệ thống đã tự động gửi email nhắc cho khách.

- Trạng thái: Chờ thanh toán (PENDING)
- Tổng tiền: {amount_fmt}
- Khách hàng: {cust_name}
- Email: {cust_email}
- SĐT: {cust_phone}{zalo_plain}
- Sản phẩm: {product_name} ({package_name})
- Link Zalo 1 chạm: {zalo_link or 'Chưa có SĐT hợp lệ'}

Xem chi tiết tại: https://filedilam.web.app/admin.html
"""

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f'"File Đi Làm" <{SMTP_USER}>'
        msg["To"] = ADMIN_NOTIFICATION_EMAIL
        msg["Reply-To"] = cust_email if ("@" in cust_email and not cust_email.endswith("@khachhang.filedilam.vn")) else SMTP_USER
        msg["Date"] = email.utils.formatdate(localtime=True)
        msg["Message-ID"] = email.utils.make_msgid(domain="gmail.com")
        msg.attach(MIMEText(plain_text, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        server = smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15)
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, [ADMIN_NOTIFICATION_EMAIL], msg.as_string())
        server.quit()
        print(f"[Admin Email] Đã gửi thông báo nhắc thanh toán đơn #{order_id} đến {ADMIN_NOTIFICATION_EMAIL}")
        return True
    except Exception as e:
        print(f"[Admin Email] Lỗi gửi thông báo nhắc thanh toán đơn #{order_id} đến Admin: {e}")
        return False


def generate_vietqr_emvco(amount, order_id, account="59215112002"):
    def field(tag, val):
        s = str(val)
        return f"{tag}{len(s):02d}{s}"

    # Tag 38 Provider:
    # 00: GUID NAPAS 'A000000727'
    # 01: Beneficiary Org (00: Bin '970423', 01: Account '59215112002') -> 25 ký tự
    # 02: Service Code 'QRIBFTTA'
    recipient = "000697042301" + f"{len(str(account)):02d}" + str(account)
    provider = "0010A000000727" + f"01{len(recipient):02d}" + recipient + "0208QRIBFTTA"
    payload = "000201010212" + f"38{len(provider):02d}" + provider + "5303704" + field("54", amount) + "5802VN" + field("62", field("08", order_id)) + "6304"

    crc = 0xFFFF
    for ch in payload:
        crc ^= ord(ch) << 8
        for _ in range(8):
            if crc & 0x8000:
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF
            else:
                crc = (crc << 1) & 0xFFFF
    return payload + f"{crc:04X}"

def send_payment_reminder_email(customer_email, customer_name, order_id, order_data):
    if not customer_email or "@" not in customer_email:
        print(f"[Email] Bỏ qua gửi email nhắc do địa chỉ không hợp lệ: {customer_email}")
        return False
    
    try:
        product_name = order_data.get("product_name") or "File Quản Lý Google Sheets"
        amount = int(order_data.get("amount") or 0)
        amount_fmt = f"{amount:,}".replace(",", ".") + " đ"
        phone = order_data.get("customer_phone") or ""
        
        # 1. Tạo đường dẫn ảnh VietQR chuẩn PNG render qua QuickChart EMVCo (100% hiển thị trên Gmail App iPad/iPhone/Android và Desktop)
        emvco_payload = generate_vietqr_emvco(amount, order_id)
        quickchart_qr_url = f"https://quickchart.io/qr?size=320&text={urllib.parse.quote(emvco_payload)}"
        img_src = quickchart_qr_url
        qr_bytes = None

        cust_display_name = customer_name if customer_name else "Quý khách"

        customer_name_row = f'<tr><td align="left" style="white-space: nowrap; width: 120px; padding: 7px 12px; font-size: 13px; color: #64748b;">Họ tên:</td><td align="right" style="padding: 7px 12px; font-size: 13px; font-weight: 600; color: #0f172a;">{escape(customer_name)}</td></tr>' if customer_name else ''
        phone_row = f'<tr><td align="left" style="white-space: nowrap; width: 120px; padding: 7px 12px; font-size: 13px; color: #64748b;">Số điện thoại:</td><td align="right" style="white-space: nowrap; padding: 7px 12px; font-size: 13px; font-weight: 600; color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">{escape(phone)}</td></tr>' if phone else ''

        html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hoàn tất đơn hàng #{order_id}</title>
</head>
<body style="margin: 0; padding: 16px 8px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.5; -webkit-font-smoothing: antialiased;">
  
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
    
    <!-- Thanh viền màu xanh Mint nhận diện thương hiệu -->
    <tr>
      <td style="height: 4px; background: #059669; font-size: 0; line-height: 0;">&nbsp;</td>
    </tr>

    <!-- Header đơn giản, thanh lịch -->
    <tr>
      <td style="padding: 20px 20px 14px 20px; border-bottom: 1px solid #f1f5f9;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="left" style="vertical-align: middle;">
              <div style="font-size: 17px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;">FILE ĐI LÀM</div>
              <div style="font-size: 12.5px; color: #64748b; margin-top: 2px;">Thông tin hoàn tất thanh toán đơn hàng</div>
            </td>
            <td align="right" style="vertical-align: middle;">
              <span style="display: inline-block; padding: 4px 10px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; font-size: 12px; font-weight: 600; color: #059669; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">#{order_id}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Thân thư -->
    <tr>
      <td style="padding: 20px 18px;">
        
        <p style="margin: 0 0 10px 0; font-size: 15px; color: #1e293b; line-height: 1.5;">
          Xin chào <strong>{escape(cust_display_name)}</strong>,
        </p>
        
        <p style="margin: 0 0 18px 0; font-size: 13.5px; color: #475569; line-height: 1.6;">
          Hệ thống thấy bạn đang gặp vướng mắc khi thanh toán đơn hàng #{order_id}. Bạn vui lòng quét mã VietQR bên dưới hoặc chuyển khoản theo thông tin để kích hoạt file. Nếu bạn cần hỗ trợ, hãy liên hệ Zalo: 0938 134 576.
        </p>

        <!-- Bảng đối chiếu thông tin (Chống co chữ, chống wraptext vô lý) -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px;">
          <tr>
            <td style="padding: 10px 14px 6px 14px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #edf2f7;" colspan="2">
              Thông tin đơn hàng & Khách hàng
            </td>
          </tr>
          {customer_name_row}
          {phone_row}
          <tr>
            <td align="left" style="white-space: nowrap; width: 120px; padding: 7px 12px; font-size: 13px; color: #64748b;">Email nhận file:</td>
            <td align="right" style="padding: 7px 12px; font-size: 13px; font-weight: 600; color: #0f172a; word-break: break-all;">{escape(customer_email)}</td>
          </tr>
          <tr>
            <td align="left" style="white-space: nowrap; width: 120px; padding: 7px 12px; font-size: 13px; color: #64748b;">Mã đơn hàng:</td>
            <td align="right" style="white-space: nowrap; padding: 7px 12px; font-size: 13px; font-weight: 600; color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">#{order_id}</td>
          </tr>
          <tr>
            <td align="left" style="white-space: nowrap; width: 120px; padding: 7px 12px; font-size: 13px; color: #64748b;">Sản phẩm:</td>
            <td align="right" style="padding: 7px 12px; font-size: 13px; font-weight: 600; color: #0f172a;">{escape(product_name)}</td>
          </tr>
          <tr>
            <td align="left" style="white-space: nowrap; width: 120px; padding: 10px 12px; font-size: 13.5px; font-weight: 600; color: #0f172a; border-top: 1px dashed #cbd5e1;">Số tiền:</td>
            <td align="right" style="white-space: nowrap; padding: 10px 12px; font-size: 16px; font-weight: 700; color: #059669; border-top: 1px dashed #cbd5e1; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">{amount_fmt}</td>
          </tr>
        </table>

        <!-- Khung quét mã VietQR chuẩn mẫu ngân hàng -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px;">
          <tr>
            <td align="center" style="padding: 18px 14px 14px 14px;">
              <div style="font-size: 14.5px; font-weight: 700; color: #0f172a;">Mã QR chuyển khoản tự động (VietQR)</div>
              <div style="font-size: 12px; color: #64748b; margin-top: 3px;">Mở ứng dụng ngân hàng bất kỳ để quét mã</div>
              
              <!-- Ảnh VietQR mẫu chuẩn Napas + TPBank -->
              <table align="center" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff !important; border: 1px solid #e2e8f0; border-radius: 10px; margin: 12px auto 12px auto;">
                <tr>
                  <td style="padding: 6px; background-color: #ffffff !important; border-radius: 10px;">
                    <img src="{img_src}" alt="VietQR đơn #{order_id}" width="260" style="display: block; width: 100%; max-width: 260px; height: auto; border: 0; outline: none; margin: 0 auto; background-color: #ffffff !important; border-radius: 6px;" />
                  </td>
                </tr>
              </table>

              <!-- Bảng thông tin chuyển khoản 2 cột rõ ràng, chống co chữ -->
              <table align="center" cellpadding="0" cellspacing="0" border="0" style="max-width: 380px; width: 100%; background: #f8fafc; border: 1px solid #edf2f7; border-radius: 6px; margin: 0 auto;">
                <tr>
                  <td align="left" style="white-space: nowrap; width: 100px; padding: 7px 12px; font-size: 12.5px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Ngân hàng:</td>
                  <td align="right" style="white-space: nowrap; padding: 7px 12px; font-size: 12.5px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">TPBank (Tiên Phong)</td>
                </tr>
                <tr>
                  <td align="left" style="white-space: nowrap; width: 100px; padding: 7px 12px; font-size: 12.5px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Số tài khoản:</td>
                  <td align="right" style="white-space: nowrap; padding: 7px 12px; font-size: 13.5px; font-weight: 700; color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; border-bottom: 1px solid #f1f5f9;">59215112002</td>
                </tr>
                <tr>
                  <td align="left" style="white-space: nowrap; width: 100px; padding: 7px 12px; font-size: 12.5px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Chủ tài khoản:</td>
                  <td align="right" style="white-space: nowrap; padding: 7px 12px; font-size: 12.5px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">HUYNH KIEN CAM</td>
                </tr>
                <tr>
                  <td align="left" style="white-space: nowrap; width: 100px; padding: 7px 12px; font-size: 12.5px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Số tiền:</td>
                  <td align="right" style="white-space: nowrap; padding: 7px 12px; font-size: 13.5px; font-weight: 700; color: #059669; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; border-bottom: 1px solid #f1f5f9;">{amount_fmt}</td>
                </tr>
                <tr>
                  <td align="left" style="white-space: nowrap; width: 100px; padding: 7px 12px; font-size: 12.5px; color: #64748b;">Nội dung CK:</td>
                  <td align="right" style="white-space: nowrap; padding: 7px 12px;">
                    <span style="display: inline-block; background: #0f172a; color: #ffffff; padding: 2px 8px; border-radius: 4px; font-size: 13px; font-weight: 700; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;">{order_id}</span>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>

        <!-- Khung kích hoạt tự động -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; margin-bottom: 16px;">
          <tr>
            <td style="padding: 12px 14px; font-size: 12.5px; color: #065f46; line-height: 1.5;">
              <strong>Bàn giao tự động 24/7:</strong> Ngay sau khi ngân hàng báo nhận tiền thành công, hệ thống sẽ tự động gửi email kèm đường dẫn nhận file Google Sheets về đúng hòm thư này trong vòng 3 - 5 giây.
            </td>
          </tr>
        </table>

        <!-- Hỗ trợ kỹ thuật -->
        <div style="font-size: 12.5px; color: #64748b; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 12px;">
          Nếu bạn đã chuyển khoản hoặc cần hỗ trợ thêm, vui lòng phản hồi trực tiếp email này hoặc liên hệ Hotline/Zalo: <strong style="color: #0f172a;">0938 134 576</strong>.
        </div>

      </td>
    </tr>

    <!-- Footer phẳng, tối giản -->
    <tr>
      <td style="padding: 14px 20px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
        File Đi Làm &bull; Hệ thống quản lý và tự động hoá quy trình trên Google Sheets<br>
        Website: <a href="https://filedilam.web.app" target="_blank" style="color: #64748b; text-decoration: underline;">filedilam.web.app</a>
      </td>
    </tr>

  </table>

</body>
</html>"""

        plain_text = f"""Xin chào {cust_display_name},

Hệ thống thấy bạn đang gặp vướng mắc khi thanh toán đơn hàng #{order_id}. Nếu bạn cần hỗ trợ, hãy liên hệ Zalo: 0938 134 576.

Hệ thống File Đi Làm gửi bạn thông tin hoàn tất đơn hàng #{order_id}:
- Họ tên khách hàng: {customer_name or 'Quý khách'}
- Số điện thoại: {phone or 'Chưa cập nhật'}
- Email nhận file: {customer_email}
- Sản phẩm: {product_name}
- Số tiền thanh toán: {amount_fmt}

Thông tin chuyển khoản ngân hàng (TPBank):
- Số tài khoản: 59215112002
- Chủ tài khoản: HUYNH KIEN CAM
- Số tiền: {amount_fmt}
- Nội dung chuyển khoản: {order_id}

Ngay sau khi ngân hàng báo nhận tiền thành công, hệ thống sẽ tự động gửi email kèm đường dẫn nhận file Google Sheets về hòm thư này trong vòng 3 - 5 giây.
Nếu cần hỗ trợ thêm, vui lòng liên hệ Hotline/Zalo: 0938 134 576.

Trân trọng,
File Đi Làm - https://filedilam.web.app
"""

        msg_root = MIMEMultipart("related")
        msg_root["Subject"] = f"[File Đi Làm] Hoàn tất đơn hàng #{order_id}"
        msg_root["From"] = f'"File Đi Làm" <{SMTP_USER}>'
        msg_root["To"] = customer_email
        msg_root["Reply-To"] = "huynhkiencam151102@gmail.com"
        msg_root["Date"] = email.utils.formatdate(localtime=True)
        msg_root["Message-ID"] = email.utils.make_msgid(domain="gmail.com")

        msg_alt = MIMEMultipart("alternative")
        msg_alt.attach(MIMEText(plain_text, "plain", "utf-8"))
        msg_alt.attach(MIMEText(html_content, "html", "utf-8"))
        msg_root.attach(msg_alt)

        if qr_bytes:
            img_part = MIMEImage(qr_bytes, "png")
            img_part.add_header("Content-ID", "<vietqr_code>")
            img_part.add_header("Content-Disposition", "inline", filename=f"vietqr_{order_id}.png")
            msg_root.attach(img_part)

        server = smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15)
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, [customer_email], msg_root.as_string())
        server.quit()
        print(f"[Email] Gửi email nhắc thanh toán thành công tới {customer_email} cho đơn {order_id}")
        return True
    except Exception as e:
        print(f"[Email] Lỗi gửi email nhắc thanh toán cho đơn {order_id} ({customer_email}): {e}")
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
        combo_items_list = order_data.get("combo_items")
        if isinstance(combo_items_list, list) and len(combo_items_list) > 0:
            for cit in combo_items_list:
                if isinstance(cit, dict) and cit.get("product_id"):
                    target_pids.add(cit["product_id"])
                elif isinstance(cit, str) and cit.strip():
                    target_pids.add(cit.strip())
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

    if path == "/admin/send-payment-reminder" and method == "POST":
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
        cust_email = str(order_data.get("customer_email") or "").strip()
        if not cust_email or "@" not in cust_email or cust_email.endswith("@khachhang.filedilam.vn"):
            return json_response({"error": "CUSTOMER_EMAIL_INVALID"}, 400)

        cust_name = order_data.get("customer_name") or ""
        success = send_payment_reminder_email(cust_email, cust_name, order_id, order_data)
        if success:
            now = datetime.now(timezone.utc)
            doc_ref.update({"reminder_sent_at": now})
            return json_response({"success": True, "email": cust_email})
        else:
            return json_response({"error": "FAILED_TO_SEND_EMAIL"}, 500)

    if path == "/admin/check-pending-reminders" and method == "POST":
        user = require_user(req)
        if not user or user.get("email") != "huynhkiencam151102@gmail.com":
            return json_response({"error": "ADMIN_AUTH_REQUIRED"}, 403)
        res = process_pending_order_reminders(db)
        return json_response({"success": True, "result": res})

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

        codes = data.get("coupon_codes") or ([data["coupon_code"]] if data.get("coupon_code") else [])
        if not isinstance(codes, list):
            return json_response({"error": "Mã giảm giá không hợp lệ."}, 400)
        quoted_items = None
        quoted_discount = 0
        if codes or data.get("discount_amount"):
            try:
                today = (now + timedelta(hours=7)).date().isoformat()
                quoted_items, quoted_discount = build_promotion_order(db, data, codes, today, user["uid"], now)
            except (ValueError, KeyError, TypeError) as error:
                return json_response({"error": str(error)}, 400)

        # Check for existing PENDING order to reuse (prevents lost/duplicate orders on mobile app-switching)
        user_orders = db.collection("orders").where("user_id", "==", user["uid"]).stream()
        for doc in user_orders:
            o_data = doc.to_dict()
            if o_data.get("status") == "PENDING":
                if (o_data.get("coupon_codes") or []) != codes:
                    continue
                if quoted_items is not None and (o_data.get("items") != quoted_items or o_data.get("package_type") != req_package_type):
                    continue
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
                        reused_update = {
                            "customer_name": str(data.get("customer_name") or ""),
                            "customer_email": data.get("customer_email") or user.get("email", ""),
                            "customer_phone": phone,
                        }
                        reused_combo = extract_combo_items(data)
                        if reused_combo:
                            reused_update["combo_items"] = reused_combo
                            reused_update["is_combo"] = True
                        doc.reference.set(reused_update, merge=True)
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
                    item_dict = {
                        "product_id": str(it.get("product_id") or ""),
                        "product_name": str(it.get("product_name") or ""),
                        "product_file_url": str(it.get("product_file_url") or ""),
                        "product_type": str(it.get("product_type") or "google_sheets"),
                        "price": int(it.get("price") or 0)
                    }
                    if it.get("combo_items"):
                        item_dict["combo_items"] = it.get("combo_items")
                    if it.get("is_combo"):
                        item_dict["is_combo"] = True
                    items.append(item_dict)

        customer_email = data.get("customer_email") or user.get("email", "")
        order_id = generate_order_id(phone)
        while db.collection("orders").document(order_id).get().exists:
            order_id = generate_order_id(phone)
            
        doc_ref = db.collection("orders").document(order_id)
        order_doc_data = {
            "id": order_id,
            "customer_name": str(data.get("customer_name") or ""),
            "customer_email": customer_email,
            "customer_phone": phone,
            "user_id": user["uid"],
            "product_id": req_product_id,
            "product_name": data.get("product_name", ""),
            "product_file_url": data.get("product_file_url", ""),
            "product_type": data.get("product_type", "excel"),
            "amount": req_amount,
            "coupon_code": data.get("coupon_code"),
            "coupon_codes": data.get("coupon_codes") if isinstance(data.get("coupon_codes"), list) else [],
            "discount_amount": int(data.get("discount_amount") or 0),
            "package_type": req_package_type,
            "package_name": req_package_name,
            "status": "PENDING",
            "created_at": now
        }
        order_combo_items = extract_combo_items(data)
        if order_combo_items:
            order_doc_data["combo_items"] = order_combo_items
            order_doc_data["is_combo"] = True

        if quoted_items is not None:
            order_doc_data.update(product_id=quoted_items[0]["product_id"],
                                  product_file_url=quoted_items[0]["product_file_url"],
                                  product_type=quoted_items[0]["product_type"],
                                  items=quoted_items, discount_amount=quoted_discount,
                                  coupon_codes=codes, coupon_code=codes[0] if codes else None)
        elif items:
            order_doc_data["items"] = items

        doc_ref.set(order_doc_data)

        # Lưu ý luồng Automation 100%: Khi khách vừa bấm xác nhận đặt hàng, hệ thống KHÔNG bắn email ngay để tránh spam.
        # Sau 10-15 phút, Cron Job (check_pending_orders_reminder) sẽ tự động kiểm tra trạng thái đơn:
        # - Nếu ĐÃ THANH TOÁN (PAID) -> Đã có mail báo tiền về SePay cho Admin & mail bàn giao cho khách.
        # - Nếu CHƯA THANH TOÁN (PENDING) -> Tự động gửi email nhắc thanh toán kèm VietQR cho khách & báo Admin kèm Zalo 1 chạm.
        
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
                "paid_at": order_data.get("paid_at"),
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
                "customer_name": o.get("customer_name", ""),
                "customer_phone": o.get("customer_phone", ""),
                "customer_email": o.get("customer_email", ""),
                "user_id": o.get("user_id", ""),
                "coupon_code": o.get("coupon_code") or "",
                "coupon_codes": o.get("coupon_codes") or [],
                "discount_amount": int(o.get("discount_amount") or 0),
                "has_reviewed": bool(o.get("has_reviewed")),
                "review_stars": o.get("review_stars", 0),
                "review_comment": o.get("review_comment", ""),
                "created_at": serialize_datetime(o.get("created_at")),
                "paid_at": serialize_datetime(o.get("paid_at"))
            })
        orders.sort(key=lambda x: str(x.get("created_at") or ""), reverse=True)
        return json_response(orders)

    elif path == "/track" and method == "POST":
        payload = req.get_json(silent=True) or {}
        event_type = str(payload.get("type") or "page_view")
        session_id = str(payload.get("session_id") or "")
        source = str(payload.get("source") or "direct").lower()
        now = datetime.now(timezone.utc)
        today_str = now.strftime("%Y-%m-%d")
        
        from google.cloud import firestore as gc_firestore
        daily_ref = db.collection("daily_analytics").document(today_str)
        
        if event_type == "page_view":
            is_new = bool(payload.get("is_new_session"))
            update_data = {
                "date": today_str,
                "page_views": gc_firestore.Increment(1),
                f"sources.{source}": gc_firestore.Increment(1),
                "updated_at": now
            }
            if is_new:
                update_data["unique_sessions"] = gc_firestore.Increment(1)
            daily_ref.set(update_data, merge=True)
            
        elif event_type == "dwell_time":
            seconds = int(payload.get("seconds") or 0)
            if 0 < seconds <= 1800:
                daily_ref.set({
                    "date": today_str,
                    "total_dwell_seconds": gc_firestore.Increment(seconds),
                    "dwell_samples": gc_firestore.Increment(1),
                    "updated_at": now
                }, merge=True)
                
        elif event_type == "add_to_cart":
            prod_id = str(payload.get("product_id") or "")
            prod_name = str(payload.get("product_name") or "")
            cart_total = int(payload.get("cart_total") or 0)
            items = payload.get("items") or []
            
            update_data = {
                "date": today_str,
                "add_to_cart_count": gc_firestore.Increment(1),
                "updated_at": now
            }
            if prod_id:
                safe_pid = re.sub(r'[^A-Za-z0-9_-]', '_', prod_id)
                update_data[f"cart_products.{safe_pid}"] = gc_firestore.Increment(1)
            daily_ref.set(update_data, merge=True)
            
            if session_id:
                db.collection("cart_sessions").document(session_id).set({
                    "session_id": session_id,
                    "status": "IN_CART",
                    "source": source,
                    "items": items,
                    "cart_total": cart_total,
                    "last_product_id": prod_id,
                    "last_product_name": prod_name,
                    "created_at": now,
                    "updated_at": now
                }, merge=True)

        elif event_type == "checkout_opened":
            daily_ref.set({
                "date": today_str,
                "checkout_opened_count": gc_firestore.Increment(1),
                "updated_at": now
            }, merge=True)
            if session_id:
                db.collection("cart_sessions").document(session_id).set({
                    "status": "CHECKOUT_OPENED",
                    "updated_at": now
                }, merge=True)

        return json_response({"status": "ok"})

    elif path == "/admin/analytics" and method == "GET":
        user = require_user(req)
        if not user or user.get("email") != "huynhkiencam151102@gmail.com":
            return json_response({"error": "ADMIN_AUTH_REQUIRED"}, 403)
            
        from google.cloud import firestore as gc_firestore
        docs = db.collection("daily_analytics").order_by("date", direction=gc_firestore.Query.DESCENDING).limit(60).stream()
        daily_metrics = [d.to_dict() for d in docs]
        
        cart_docs = db.collection("cart_sessions").order_by("updated_at", direction=gc_firestore.Query.DESCENDING).limit(50).stream()
        cart_sessions = []
        for cd in cart_docs:
            cdata = cd.to_dict()
            cart_sessions.append({
                "session_id": cdata.get("session_id"),
                "status": cdata.get("status"),
                "source": cdata.get("source"),
                "cart_total": cdata.get("cart_total", 0),
                "items": cdata.get("items", []),
                "last_product_name": cdata.get("last_product_name"),
                "updated_at": serialize_datetime(cdata.get("updated_at"))
            })
            
        return json_response({
            "daily_metrics": daily_metrics,
            "cart_sessions": cart_sessions
        })
        
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
                
                # Bổ sung các product_id từ combo_items nếu có
                combo_items_list = matched_order.get("combo_items")
                if isinstance(combo_items_list, list) and len(combo_items_list) > 0:
                    for cit in combo_items_list:
                        if isinstance(cit, dict) and cit.get("product_id"):
                            target_pids.add(str(cit["product_id"]))
                        elif isinstance(cit, str) and cit.strip():
                            target_pids.add(cit.strip())
                
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

                # R1: Gửi email 'Nổ tiền' tức thì cho Admin (huynhkiencam151102@gmail.com)
                try:
                    send_admin_payment_success_notification(
                        order_id=matched_order.get("id"),
                        order_data=matched_order,
                        payment_details=payload
                    )
                except Exception as admin_notify_err:
                    print(f"[Admin Notify] Lỗi khi gửi email nổ tiền cho đơn {matched_order.get('id')}: {admin_notify_err}")
        return json_response({"success": True})

    return json_response({"error": "NOT_FOUND"}, 404)

def parse_to_utc_datetime(dt_val):
    """Chuyển đổi linh hoạt datetime, Timestamp, số hoặc chuỗi ISO về datetime UTC."""
    if not dt_val:
        return None
    if isinstance(dt_val, datetime):
        return dt_val if dt_val.tzinfo else dt_val.replace(tzinfo=timezone.utc)
    if hasattr(dt_val, "to_datetime"):
        d = dt_val.to_datetime()
        return d if d.tzinfo else d.replace(tzinfo=timezone.utc)
    if isinstance(dt_val, (int, float)):
        return datetime.fromtimestamp(dt_val, tz=timezone.utc)
    if isinstance(dt_val, str):
        cleaned = dt_val.strip().replace("Z", "+00:00")
        try:
            d = datetime.fromisoformat(cleaned)
            return d if d.tzinfo else d.replace(tzinfo=timezone.utc)
        except Exception:
            pass
    return None

def process_pending_order_reminders(db=None, schedule_time=None) -> dict:
    """
    Quét các đơn hàng PENDING tạo từ 10-60 phút trước chưa được gửi nhắc (reminder_sent_at is None),
    tự động gửi email nhắc kèm VietQR cho khách hàng, cập nhật cờ reminder_sent_at trong Firestore,
    và gửi email thông báo tổng kết kèm link Zalo 1 chạm cho Admin.
    """
    if db is None:
        db = get_db()

    now = parse_to_utc_datetime(schedule_time) or datetime.now(timezone.utc)

    pending_stream = db.collection("orders").where("status", "==", "PENDING").stream()
    processed_ids = []

    for doc in pending_stream:
        order_data = doc.to_dict() if hasattr(doc, "to_dict") else {}
        order_id = str(order_data.get("id") or getattr(doc, "id", "")).strip().upper()
        if not order_id:
            continue

        # Bỏ qua nếu đã gửi nhắc rồi (Idempotency)
        if order_data.get("reminder_sent_at"):
            continue

        c_at = parse_to_utc_datetime(order_data.get("created_at"))
        if not c_at:
            continue

        age_seconds = (now - c_at).total_seconds()

        # Cửa sổ thời gian: 10 phút đến 60 phút (600 <= age_seconds <= 3600)
        if 600 <= age_seconds <= 3600:
            # 1. Cập nhật cờ reminder_sent_at ngay lập tức trong Firestore để chống lặp
            try:
                doc.reference.update({"reminder_sent_at": now})
            except Exception as ue:
                print(f"[Reminder Scanner] Lỗi cập nhật reminder_sent_at cho đơn #{order_id}: {ue}")

            cust_email = str(order_data.get("customer_email") or "").strip()
            cust_name = order_data.get("customer_name") or ""

            # 2. Gửi email nhắc thanh toán cho khách nếu email hợp lệ (không phải email ảo)
            if cust_email and "@" in cust_email and not cust_email.endswith("@khachhang.filedilam.vn"):
                try:
                    send_payment_reminder_email(cust_email, cust_name, order_id, order_data)
                except Exception as ce:
                    print(f"[Reminder Scanner] Lỗi gửi email nhắc cho khách {cust_email}: {ce}")
            else:
                print(f"[Reminder Scanner] Bỏ qua gửi email khách cho đơn #{order_id} (email ảo hoặc không hợp lệ: {cust_email})")

            # 3. Gửi email thông báo cho Admin kèm link Zalo 1 chạm
            try:
                send_admin_payment_reminder_notification(order_id, order_data)
            except Exception as ae:
                print(f"[Reminder Scanner] Lỗi gửi thông báo Admin cho đơn #{order_id}: {ae}")

            processed_ids.append(order_id)

    print(f"[Reminder Scanner] Đã xử lý {len(processed_ids)} đơn hàng PENDING: {processed_ids}")
    return {"processed_count": len(processed_ids), "order_ids": processed_ids}

# Alias
scan_and_remind_pending_orders = process_pending_order_reminders

# Cấu hình Scheduled Function định kỳ mỗi 10 phút
try:
    VN_TZ = scheduler_fn.Timezone("Asia/Ho_Chi_Minh")
except Exception:
    VN_TZ = None

schedule_kwargs = {"schedule": "every 10 minutes"}
if VN_TZ is not None:
    schedule_kwargs["timezone"] = VN_TZ

def process_paid_order_retention_vouchers(db=None, schedule_time=None) -> dict:
    """
    Quét các đơn hàng PAID đã thanh toán từ 30 phút đến 24 giờ trước (retention_voucher_sent_at is None),
    tự động gửi Thư cảm ơn và quà tặng đồng hành (MEMBER30) sau khi khách đã làm quen với file,
    giúp tăng tỷ lệ đọc ở tab Primary và trải nghiệm tự nhiên nhất.
    """
    if db is None:
        db = get_db()

    now = parse_to_utc_datetime(schedule_time) or datetime.now(timezone.utc)
    processed_ids = []

    try:
        paid_stream = db.collection("orders").where("status", "==", "PAID").stream()
        for doc in paid_stream:
            order_data = doc.to_dict() if hasattr(doc, "to_dict") else {}
            order_id = str(order_data.get("id") or getattr(doc, "id", "")).strip().upper()
            if not order_id:
                continue

            # Đã gửi thư cảm ơn rồi thì bỏ qua
            if order_data.get("retention_voucher_sent_at"):
                continue

            # Tính thời gian từ lúc thanh toán thành công (hoặc lúc tạo đơn)
            paid_at = parse_to_utc_datetime(order_data.get("paid_at") or order_data.get("updated_at") or order_data.get("created_at"))
            if not paid_at:
                continue

            age_seconds = (now - paid_at).total_seconds()

            # Gửi sau 30 phút (>= 1800 giây) và trong vòng 24 giờ (<= 86400 giây)
            if 1800 <= age_seconds <= 86400:
                cust_email = str(order_data.get("customer_email") or "").strip()
                cust_name = order_data.get("customer_name") or ""

                if cust_email and "@" in cust_email and not cust_email.endswith("@khachhang.filedilam.vn"):
                    try:
                        # Đánh dấu đã gửi trước để chống duplicate
                        doc.reference.update({"retention_voucher_sent_at": now})
                        send_retention_voucher_email(cust_email, cust_name, order_id, order_data)
                        processed_ids.append(order_id)
                        print(f"[Retention Scheduler] Đã gửi thư cảm ơn cho đơn #{order_id} ({cust_email}) sau {int(age_seconds/60)} phút")
                    except Exception as err:
                        print(f"[Retention Scheduler] Lỗi gửi thư cảm ơn đơn #{order_id}: {err}")
    except Exception as e:
        print(f"[Retention Scheduler] Lỗi quét đơn hàng PAID: {e}")

    return {"retention_processed_count": len(processed_ids), "order_ids": processed_ids}

@scheduler_fn.on_schedule(**schedule_kwargs)
def check_pending_orders_reminder(event: scheduler_fn.ScheduledEvent) -> None:
    db = get_db()
    schedule_time = getattr(event, "schedule_time", None)
    process_pending_order_reminders(db, schedule_time)
    process_paid_order_retention_vouchers(db, schedule_time)

