from firebase_functions import https_fn, options
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

def ensure_copy_link(url):
    raw = str(url or "").strip()
    if "docs.google.com/spreadsheets" in raw:
        m = re.search(r"docs\.google\.com/spreadsheets/d/([a-zA-Z0-9_-]+)", raw)
        if m:
            return f"https://docs.google.com/spreadsheets/d/{m.group(1)}/copy"
    return raw

def send_order_success_email(customer_email, customer_name, order_id, order_data):
    if not customer_email or "@" not in customer_email:
        print(f"[Email] Bỏ qua gửi email do địa chỉ không hợp lệ: {customer_email}")
        return False
    
    try:
        product_name = order_data.get("product_name") or "File Quản Lý Google Sheets"
        raw_file_url = order_data.get("product_file_url") or "https://filedilam.web.app"
        file_url = ensure_copy_link(raw_file_url)
        items = order_data.get("items") or []

        # Kiểm tra xem đơn hàng có file Apps Script / Web App hay chỉ là Google Sheets thuần
        has_appscript = False
        all_names = (product_name or "").lower()
        if isinstance(items, list) and len(items) > 0:
            for it in items:
                all_names += " " + (it.get("product_name") or it.get("name") or it.get("title") or "").lower()
                all_names += " " + (it.get("product_id") or "").lower()
        if any(kw in all_names for kw in ["cost", "appscript", "web app", "webapp", "smart", "kho mini smart"]):
            has_appscript = True

        # Bóc tách danh sách file (đơn lẻ hoặc combo)
        resolved_files = []
        if isinstance(items, list) and len(items) > 0:
            for it in items:
                it_name = it.get("product_name") or it.get("name") or it.get("title") or "File Google Sheets"
                it_raw_url = it.get("product_file_url") or it.get("file_url") or file_url
                resolved_files.append({
                    "name": it_name,
                    "url": ensure_copy_link(it_raw_url)
                })
        else:
            resolved_files.append({
                "name": product_name,
                "url": file_url
            })

        # Danh sách nút / link nhận file chuẩn Fintech phẳng, sạch, không bọc pill rườm rà
        if len(resolved_files) == 1:
            single = resolved_files[0]
            files_html = f"""
            <div style="margin: 28px 0 20px 0;">
              <a href="{single['url']}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; background-color: #059669; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 24px; border-radius: 8px; letter-spacing: 0.2px;">
                Tạo bản sao Google Sheets ({single['name']})
              </a>
              <div style="margin-top: 10px; font-size: 12.5px; color: #64748b; text-align: center; line-height: 1.5;">
                Link dự phòng: <a href="{single['url']}" target="_blank" style="color: #059669; text-decoration: underline; word-break: break-all;">{single['url']}</a>
              </div>
            </div>
            """
        else:
            items_list = ""
            for idx, f in enumerate(resolved_files, 1):
                items_list += f"""
                <div style="padding: 14px 0; border-bottom: 1px solid #f1f5f9;">
                  <div style="font-size: 14.5px; font-weight: 600; color: #0f172a; margin-bottom: 8px;">{idx}. {f['name']}</div>
                  <a href="{f['url']}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-size: 13.5px; font-weight: 600; padding: 9px 18px; border-radius: 6px;">
                    Tạo bản sao /copy
                  </a>
                  <div style="margin-top: 6px; font-size: 12px; color: #64748b;">
                    Link trực tiếp: <a href="{f['url']}" target="_blank" style="color: #059669; text-decoration: underline;">{f['url']}</a>
                  </div>
                </div>
                """
            files_html = f"""
            <div style="margin: 20px 0 16px 0; border-top: 1px solid #f1f5f9;">
              {items_list}
            </div>
            """

        pkg_name = order_data.get("package_name") or "Bản Tự Dùng"

        if has_appscript:
            guide_section_html = """<!-- Hướng dẫn sử dụng & Khởi động Web App Apps Script chuẩn xác từng bước -->
      <div style="margin-top: 28px; padding-top: 22px; border-top: 1px solid #e2e8f0;">
        <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 12px; letter-spacing: -0.2px;">
          Hướng dẫn kích hoạt và mở ứng dụng (Thực hiện trên máy tính):
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
              <strong style="color: #0f172a;">Bước 1. Mở link bằng máy tính &rarr; Bấm "Tạo một bản sao" (Make a copy):</strong><br>
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
              <span style="color: #64748b; font-size: 13px;">Khi tạo bản sao xong, đợi khoảng <strong>10–20 giây</strong> là bên phải mục <strong>Trợ giúp (Help)</strong> trên thanh menu sẽ xuất hiện nút ứng dụng (VD: <strong>File Đi Làm Cost &rarr; Mở ứng dụng tính cost</strong>).</span><br>
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
          <div style="margin-bottom: 12px; padding: 16px 18px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #059669; border-radius: 8px;">
            <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">
              Cách mở trên Điện thoại hoặc Laptop sau khi cấp quyền:
            </div>
            <div style="font-size: 13px; color: #334155; line-height: 1.6;">
              Sau khi ứng dụng Web App mở ra, bạn chỉ cần <strong>copy đường link trình duyệt của ứng dụng</strong> để mở trực tiếp trên điện thoại hoặc laptop bất kỳ lúc nào mà không cần mở lại file Sheet.<br><br>
              <strong style="color: #0f172a;">Mẹo tạo biểu tượng App ra màn hình chính:</strong><br>
              • <strong>Riêng trên iPhone (Safari):</strong> Bấm biểu tượng <strong>Chia sẻ (Share)</strong> ở thanh dưới cùng &rarr; Chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong> để tạo icon mở 1 chạm như App thật.<br>
              • <strong>Trên Android (Chrome):</strong> Bấm dấu 3 chấm góc phải trên &rarr; Chọn <strong>Cài đặt ứng dụng / Thêm vào màn hình chính</strong>.
            </div>
          </div>

        </div>
      </div>"""
        else:
            guide_section_html = """      <!-- Hướng dẫn sử dụng file Google Sheets thông thường -->
      <div style="margin-top: 28px; padding-top: 22px; border-top: 1px solid #e2e8f0;">
        <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 14px; letter-spacing: -0.2px;">
          Hướng dẫn nhận và sử dụng file Google Sheets:
        </div>
        <div style="font-size: 13.5px; color: #334155; line-height: 1.65;">
          <div style="margin-bottom: 12px;">
            <strong style="color: #0f172a;">1. Bấm vào nút Tạo bản sao ở trên:</strong><br>
            Hệ thống Google Drive sẽ mở trang nhân bản &rarr; Bạn bấm <strong>Tạo một bản sao (Make a copy)</strong>.
          </div>
          <div style="margin-bottom: 12px;">
            <strong style="color: #0f172a;">2. File được lưu vĩnh viễn trên Drive cá nhân:</strong><br>
            Bản sao này hoàn toàn thuộc quyền sở hữu của riêng bạn. Bạn có thể chỉnh sửa dữ liệu, thêm dòng cột hoặc chia sẻ cho nhân sự / cộng sự tùy ý. (Khi tạo bản sao đợi khoảng 10–20 giây là bên phải Trợ giúp sẽ có nút menu, nếu chưa thấy thì tải lại trang).
          </div>
          <div style="margin-bottom: 8px;">
            <strong style="color: #0f172a;">3. Tương thích mọi thiết bị:</strong><br>
            Bạn có thể mở chỉnh sửa trên máy tính hoặc tải ứng dụng <strong>Google Trang tính (Google Sheets)</strong> trên điện thoại (App Store / CH Play) để theo dõi và nhập liệu mọi lúc mọi nơi.
          </div>
        </div>
      </div>"""

        return_offers = []
        try:
            today = (datetime.now(timezone.utc) + timedelta(hours=7)).date().isoformat()
            for snapshot in get_db().collection("coupons").where("type", "==", "returning").stream():
                campaign = snapshot.to_dict()
                if campaign.get("is_active") and (campaign.get("start_date") or "") <= today <= (campaign.get("end_date") or "9999"):
                    code = escape(str(campaign.get("code") or snapshot.id))
                    terms = escape(str(campaign.get("description") or ""))
                    return_offers.append(f"<p>Mã cho lần mua sau <strong>{code}</strong><br>{terms}</p>")
        except Exception as error:
            print(f"Không tải được ưu đãi lần sau cho email bàn giao: {error}")

        html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Kích hoạt đơn hàng #{order_id} - File Đi Làm</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #0f172a; line-height: 1.6; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
    
    <!-- Header: Thanh lịch, tối giản (Fintech Classy) -->
    <div style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #f1f5f9;">
      <div style="font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: -0.4px;">File Đi Làm</div>
      <div style="font-size: 13.5px; color: #64748b; margin-top: 4px;">Xác nhận kích hoạt đơn hàng thành công</div>
    </div>

    <!-- Body Content -->
    <div style="padding: 28px 32px 32px 32px;">
      <p style="font-size: 15px; margin: 0 0 16px 0; color: #334155;">
        Xin chào <strong>{customer_name or 'Quý khách'}</strong>,
      </p>
      <p style="font-size: 14.5px; margin: 0 0 24px 0; color: #334155; line-height: 1.6;">
        Hệ thống File Đi Làm đã nhận đủ thanh toán cho đơn hàng của bạn. Bản quyền file Google Sheets đã được cấp phép vĩnh viễn vào tài khoản của bạn.
      </p>

      <!-- Bảng thông tin đơn hàng dạng phẳng -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13.5px;">
        <tbody>
          <tr>
            <td style="padding: 8px 0; color: #64748b; width: 110px; border-bottom: 1px solid #f8fafc;">Sản phẩm:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f8fafc;">{product_name}</td>
          </tr>
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

      <!-- Danh sách nút nhận file -->
      <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 8px;">Liên kết nhận file Google Sheets:</div>
      {files_html}
      {"".join(return_offers)}

{guide_section_html}
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

Bạn có thể truy cập link nhận file Google Sheets trực tiếp tại:
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
        print(f"[Email] Gửi email thành công tới {customer_email} cho đơn {order_id}")
        return True
    except Exception as e:
        print(f"[Email] Lỗi gửi email cho đơn {order_id} ({customer_email}): {e}")
        return False

def generate_vietqr_emvco(amount, order_id, account="59215112002"):
    def field(tag, val):
        s = str(val)
        return f"{tag}{len(s):02d}{s}"

    recipient = field("00", "970423") + field("01", account)
    provider = field("00", "A000000727") + field("01", recipient) + field("02", "QRIBFTTA")
    payload = "000201010212" + field("38", provider) + "5303704" + field("54", amount) + "5802VN" + field("62", field("08", order_id)) + "6304"

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
        
        # 1. Gọi trực tiếp API chính thức của VietQR để lấy mẫu tem chuẩn đẹp đầy đủ Logo Napas + TPBank dạng PNG
        qr_bytes = None
        img_src = ""
        emvco = generate_vietqr_emvco(amount, order_id)
        backup_png_url = f"https://quickchart.io/qr?size=360&text={urllib.parse.quote(emvco)}"
        
        try:
            api_payload = json.dumps({
                "accountNo": "59215112002",
                "accountName": "HUYNH KIEN CAM",
                "acqId": "970423",
                "amount": amount,
                "addInfo": order_id,
                "format": "text",
                "template": "compact2"
            }).encode("utf-8")
            
            v_req = urllib.request.Request(
                "https://api.vietqr.io/v2/generate",
                data=api_payload,
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0"
                }
            )
            with urllib.request.urlopen(v_req, timeout=5) as v_resp:
                res_data = json.loads(v_resp.read().decode("utf-8"))
                if res_data.get("code") == "00" and res_data.get("data", {}).get("qrDataURL"):
                    raw_b64 = res_data["data"]["qrDataURL"].split(",")[1]
                    qr_bytes = base64.b64decode(raw_b64)
                    img_src = "cid:vietqr_code"
        except Exception as ve:
            print(f"[Email] VietQR official API failed, fallback to QuickChart: {ve}")

        # Dự phòng nếu VietQR API bận: Tải ảnh PNG raster từ QuickChart
        if not qr_bytes:
            try:
                q_req = urllib.request.Request(backup_png_url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(q_req, timeout=4) as q_resp:
                    if q_resp.status == 200:
                        qr_bytes = q_resp.read()
                        img_src = "cid:vietqr_code"
            except Exception as qe:
                print(f"[Email] QuickChart backup failed: {qe}")
                img_src = backup_png_url

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
          Hệ thống File Đi Làm đã tiếp nhận thông tin đơn hàng của bạn. Bạn vui lòng quét mã VietQR bên dưới hoặc chuyển khoản theo thông tin để kích hoạt file:
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
                        doc.reference.set({
                            "customer_name": str(data.get("customer_name") or ""),
                            "customer_email": data.get("customer_email") or user.get("email", ""),
                            "customer_phone": phone,
                        }, merge=True)
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
        if quoted_items is not None:
            order_doc_data.update(product_id=quoted_items[0]["product_id"],
                                  product_file_url=quoted_items[0]["product_file_url"],
                                  product_type=quoted_items[0]["product_type"],
                                  items=quoted_items, discount_amount=quoted_discount,
                                  coupon_codes=codes, coupon_code=codes[0] if codes else None)
        elif items:
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
