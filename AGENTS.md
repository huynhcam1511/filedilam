# AGENTS — TIÊU CHUẨN PHÁT TRIỂN & QUY TẮC BẮT BUỘC

> Bản hiến pháp phát triển sản phẩm (Workbook, Google Sheets Apps Script & Storefront Web App) của hệ thống **FILE ĐI LÀM**.

---

## 1. NGUYÊN TẮC QUẢN TRỊ & BẢO TOÀN DỮ LIỆU
- **Chủ quyền sản phẩm & giá thuộc về ADMIN**: Admin (`huynhkiencam151102@gmail.com`) trực tiếp quản lý giá, danh mục, file và combo trên `/admin.html`. Cloud Firestore là nguồn sự thật duy nhất (Single Source of Truth).
- **CẤM reset/ghi đè Firestore**: Không bao giờ tự ý xóa collection `products` hoặc hardcode danh mục để thay thế dữ liệu thật. Mọi sản phẩm đã tạo phải được bảo toàn đầy đủ.

---

## 2. CHUẨN THIẾT KẾ UI/UX & GIAO DIỆN HỆ THỐNG
1. **Thẩm mỹ Fintech cao cấp (Minimalist & Classy)**:
   - Màu chủ đạo: Xanh ngọc Mint (`#059669` / `#10b981`), nền trắng/xám slate thanh lịch, trung tính (`#f8fafc`, `#e2e8f0`).
   - Tối ưu trải nghiệm mobile-first (khách vào từ TikTok/Facebook bio-link).
2. **CẤM emoji & icon trẻ con**: Không gắn emoji (⚡, ✨, 🔑, 🟢, ⏳, ⚠️, ➔) vào nút bấm, tab chuyển đổi, tiêu đề popup hay thông báo. Sử dụng SVG icon đồng bộ, văn phong nhã nhặn.
3. **Chống lạm dụng thẻ container & pill ("LẬM CARD, LẬM PILL")**:
   - Không bọc thông tin hiển nhiên vào các khối card màu mè chiếm diện tích.
   - Tránh lạm dụng khung pill bo tròn (badge/viên thuốc) tràn lan cho các trường dữ liệu bình thường (như Mã SKU, Mã đơn, text trạng thái...). Hãy hiển thị văn bản phẳng, sạch, dùng font chữ monospace hoặc màu chữ thanh lịch thay vì bọc border/background pill dày đặc.
4. **Tính đồng nhất form 100%**: Tất cả modal đăng nhập/đăng ký và checkout phải dùng chung cấu trúc: Segmented Control Tabs, trường `.checkout-field`, nhãn `.checkout-label` kèm `<span class="req">*</span>`, nút toggle mắt mật khẩu, nút chính cao 46px nền Mint, nút Google phẳng.
5. **Quy chuẩn mã sản phẩm (SKU)**:
   - Bắt buộc dạng `PRD-` kèm đúng 6 chữ số ngẫu nhiên: `PRD-XXXXXX` (VD: `PRD-102938`).
   - CẤM sinh slug tiếng Việt cắt dấu lem nhem kèm timestamp miligiây.

---

## 3. SẢN PHẨM GOOGLE SHEETS + APPS SCRIPT (BÁN BẰNG LINK /COPY)
- **Quy trình trọn gói**: Người dùng đưa prompt nghiệp vụ; Agent tự hoàn thành Sheet, Apps Script launcher gắn sẵn, Web App và cấu hình triển khai. Bàn giao 1 link sản phẩm duy nhất.
- **Trải nghiệm người mua**: Bấm `/copy` → Tạo bản sao vào Drive → Menu **File Đi Làm** tự xuất hiện sau khi Sheet tải xong → Mở ứng dụng → Cấp quyền Google lần đầu.
- **Không bắt khách cấu hình**: Không yêu cầu khách mở Apps Script editor, dán mã nguồn, deploy web app, nhập Spreadsheet ID hay dán URL `/exec`.
- **Nguyên tắc kỹ thuật script**:
  - Menu lấy ID động bằng `SpreadsheetApp.getActiveSpreadsheet().getId()`.
  - Mọi RPC mang ID bản sao tương ứng. Không hardcode Spreadsheet ID master, không fallback về master làm database.
  - Web App chạy dưới quyền người truy cập (`USER_ACCESSING`) để bảo mật dữ liệu riêng của từng khách.

---

## 4. CHUẨN WORKBOOK & DASHBOARD BÁO CÁO
- **Kế thừa thiết kế mẫu Shop Online Mini v1.4.0**:
  - Palette pastel dịu: Nền kem `#FFFDFB`, hồng chủ đạo `#C88FA1`, lavender `#CFC5E9`, mint `#B9E1D6`. Ô nhập liệu `#FFF3F7`, ô tính toán tự động `#EEF7FC`, ô ghi chú hướng dẫn `#FFF8DB`.
  - Font chữ hỗ trợ tiếng Việt đầy đủ, phân cấp tiêu đề, khoảng thở và header bảng rõ ràng.
- **Cấu trúc trải nghiệm**:
  - Bố trí theo nhu cầu khách: chỉ cần điền 1–2 trang nghiệp vụ là hoàn thành một luồng và ra kết quả ngay.
  - Cột nhập liệu đặt bên trái, cột kết quả tự tính đặt cạnh bên/bên phải trong cùng tầm nhìn.
- **Chuẩn Dashboard TỔNG QUAN**:
  - Giữ chuẩn **4 thẻ KPI + 6 biểu đồ trực quan** bố trí 2 cột / 3 hàng.
  - Dữ liệu biểu đồ liên kết công thức động; ngày tháng thống nhất `dd/mm/yyyy`; số tiền có phân cách hàng nghìn.

---

## 5. BẢN ĐỒ TÀI NGUYÊN & MÃ NGUỒN CỐT LÕI
- `index.html` / `storefront.js` / `storefront.css`: Storefront mua hàng, giỏ hàng, xác thực khách, thanh toán VietQR và kích hoạt đơn tự động.
- `admin.html` / `admin.js`: Trang quản trị đăng bán, quản lý danh sách sản phẩm, quản lý đơn hàng và báo cáo doanh thu.
- `functions/main.py`: Firebase Cloud Functions tiếp nhận webhook ngân hàng (SePay), API đơn hàng và đối soát.
- `system_filedilam.md`: Kiến trúc hệ thống, chức năng chi tiết và luồng dữ liệu khách hàng.
- `project-brain/` & `brain.json`: Lưu trữ quyết định kiến trúc, bài học và bằng chứng kiểm thử thực tế.

---

## 6. QUY TRÌNH KIỂM THỬ VÀ BÀN GIAO
1. **Kiểm tra cú pháp & toàn vẹn**: Xác minh modal, form và các event listener hoạt động chuẩn xác, không có lỗi console.
2. **Cập nhật Cache Buster**: Luôn tăng tham số version (VD: `admin.js?v=XX`, `storefront.js?v=XX`, `storefront.css?v=XX`) khi chỉnh sửa CSS/JS.
3. **Chỉ commit đúng phạm vi**: Không gom thay đổi ngoài luồng; ghi rõ nội dung thay đổi theo chuẩn conventional commits.
4. **Minh bạch bằng chứng**: Phân định rõ giữa trạng thái dự kiến, đã code và đã thử nghiệm thực tế trước khi tuyên bố hoàn tất.
