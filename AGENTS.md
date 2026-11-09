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
   - Tối ưu trải nghiệm mobile-first (khách vào từ TikTok/Facebook bio-link hoặc môi giới/chủ quán thao tác ngoài hiện trường).
2. **CẤM emoji & icon trẻ con**: Không gắn emoji (⚡, ✨, 🔑, 🟢, ⏳, ⚠️, ➔) vào nút bấm, tab chuyển đổi, tiêu đề popup hay thông báo. Sử dụng SVG icon đồng bộ, văn phong nhã nhặn.
3. **Chống lạm dụng thẻ container & pill ("LẬM CARD, LẬM PILL")**:
   - Không bọc thông tin hiển nhiên vào các khối card màu mè chiếm diện tích.
   - Tránh lạm dụng khung pill bo tròn (badge/viên thuốc) tràn lan cho các trường dữ liệu bình thường (như Mã SKU, Mã đơn, text trạng thái...). Hãy hiển thị văn bản phẳng, sạch, dùng font chữ monospace (`font-mono text-xs font-semibold text-slate-700`) hoặc màu chữ thanh lịch thay vì bọc border/background pill dày đặc. Trạng thái chỉ dùng chấm tròn nhỏ (`•`) tinh tế.
4. **Phân định 2 trải nghiệm độc lập: Mobile View vs Desktop View**:
   - **Giao diện Desktop (Màn hình lớn / Laptop)**:
     - Sidebar cố định có nút Hamburger thu gọn về dạng Icon-only (~64px).
     - Bảng Master-Table phẳng tràn viền (Edge-to-Edge Full Bleed), cố định tiêu đề (`Freeze Panes`), không dùng đường kẻ dọc cột Excel, menu 3 chấm (`MoreVertical`) ở cột ngoài cùng bên phải (tiêu đề `<th>` để rỗng).
     - Màn hình chi tiết ưu tiên Drawer trượt từ bên phải hoặc Flat Canvas toàn màn hình (Zero Popup Policy).
   - **Giao diện Mobile (Điện thoại thông minh / Hiện trường)**:
     - **Chuyển bảng thành thẻ gọn (Table-to-Card Transformation)**: Tuyệt đối CẤM bắt người dùng vuốt ngang màn hình tìm cột. Bảng tự động gom thành danh sách các khối thẻ phẳng: Hàng 1 (Mã ID mono + chấm trạng thái), Hàng 2 (Tiêu đề/Tên đậm), Hàng 3 (SĐT có link gọi 1 chạm `tel:` + Giá trị), Nút 3 chấm mở menu thao tác.
     - **Thanh điều hướng đáy (Bottom Navigation Dock)**: Ẩn hẳn Sidebar, ghim thanh dock 4 icon chính ở đáy màn hình trong tầm với ngón tay cái.
     - **Nút hành động nổi (Floating Action Button - FAB)**: Nút `+ Thêm Mới` trên desktop tự chuyển thành nút tròn nổi màu Mint xanh ở góc dưới bên phải (`fixed bottom-20 right-4`) để thao tác 1 chạm bằng 1 tay.
     - **Form nhập liệu Bottom Sheet**: Trượt êm từ đáy màn hình lên, tự bật bàn phím số (`inputmode="numeric"`) khi chạm vào ô SĐT hay Tiền tệ.
5. **Tính đồng nhất form 100%**: Tất cả modal/form nhập liệu phải dùng chung cấu trúc: Segmented Control Tabs, trường `.checkout-field`, nhãn `.checkout-label` kèm `<span class="req">*</span>`, nút toggle mắt mật khẩu, nút chính cao 46px nền Mint, nút Google phẳng.
6. **Quy chuẩn mã sản phẩm & định danh (SKU/ID)**:
   - Bắt buộc dạng tiền tố nghiệp vụ kèm đúng 6 chữ số ngẫu nhiên: `PRD-XXXXXX`, `KH-XXXXXX`, `BDS-XXXXXX`.
   - CẤM sinh slug tiếng Việt cắt dấu lem nhem kèm timestamp miligiây.
   - Mã ID là bất biến và hiển thị dạng text mono phẳng, không bọc pill.

---

## 3. SẢN PHẨM GOOGLE SHEETS + APPS SCRIPT (BÁN BẰNG LINK /COPY)
- **Quy trình trọn gói**: Người dùng đưa prompt nghiệp vụ; Agent tự hoàn thành Sheet, Apps Script launcher gắn sẵn, Web App và cấu hình triển khai. Bàn giao 1 link sản phẩm duy nhất.
- **Trải nghiệm người mua**: Bấm `/copy` → Tạo bản sao vào Drive → Menu **File Đi Làm** tự xuất hiện sau khi Sheet tải xong → Mở ứng dụng → Cấp quyền Google lần đầu.
- **Không bắt khách cấu hình & Quy tắc Auto-Seed on First Load**:
  - Không yêu cầu khách mở Apps Script editor, dán mã nguồn, deploy web app, nhập Spreadsheet ID hay bấm Run hàm setup thủ công.
  - Hàm `getInitialData()` backend phải tự động kiểm tra: nếu Sheet chưa có bảng hoặc dữ liệu rỗng, tự động chạy khởi tạo và nạp dữ liệu mẫu thực chiến ngay trong lần load đầu tiên.
  - Trên giao diện Web App luôn có nút "Dữ liệu mẫu" để nạp lại dữ liệu 1 chạm bất kỳ lúc nào.
- **Quy tắc Zero Phantom Overlay (Chống màng vô hình chặn click chuột)**:
  - Trên môi trường iframe của Google Apps Script, tuyệt đối CẤM chỉ dùng `opacity-0` và `pointer-events-none` cho container phủ màn hình khi phần tử con (Backdrop) vẫn còn giữ `pointer-events-auto`.
  - Bắt buộc: Khi Drawer/Modal đóng, container ngoài cùng BẮT BUỘC phải gắn class `hidden` (`display: none`) để giải phóng 100% diện tích màn hình cho chuột thao tác.
- **Quy tắc Instant Render & Zero-Blocking UI (Tải ngay 0s, Cấm vòng quay treo màn hình)**:
  - Web App BẮT BUỘC nạp và hiển thị ngay lập tức giao diện và dữ liệu (từ LocalStorage hoặc Mock Cache) trong 0.05 giây ngay khi mở trang (`App.init()`), để người dùng bấm thao tác được ngay lập tức.
  - Quá trình kết nối Google Sheets (`getInitialData`) phải chạy ngầm trong background (Background Sync).
  - TUYỆT ĐỐI CẤM đặt các khối `loading-state` to tướng ở giữa màn hình khiến giao diện bị che khuất và quay vô tận. Chỉ báo tải duy nhất là icon xoay nhỏ tại nút Làm mới trên thanh Header.
  - Backend RPC khi khởi tạo dữ liệu mẫu phải tối ưu tốc độ phản hồi < 1.5 giây; không lặp các lệnh `sh.protect()` gây nghẽn timeout.
- **Quy tắc Bất Biến "Inline Embedded Realistic Mock Data By Default" (CẤM BIẾN RỖNG [])**:
  - Tuyệt đối CẤM khai báo biến lưu trữ ban đầu là mảng rỗng (`AppState.data = { rooms: [], bookings: [], ... }`).
  - Biến `AppState.data` trong file `Index.html` BẮT BUỘC phải được nhúng sẵn bộ dữ liệu mẫu thực chiến đầy đủ (10–15 thực thể với đủ mọi trạng thái nghiệp vụ).
  - Web App phải hiển thị hoàn hảo ngay trong 0.001 giây khi vừa parse HTML, không phụ thuộc vào việc server phản hồi hay cache trình duyệt.
  - Tuyệt đối không cho phép LocalStorage lưu hoặc ghi đè mảng rỗng `[]` vào bộ nhớ làm hỏng dữ liệu hiển thị.
- **Nguyên tắc kỹ thuật script**:
  - Menu lấy ID động bằng `SpreadsheetApp.getActiveSpreadsheet().getId()`.
  - Mọi RPC mang ID bản sao tương ứng. Không hardcode Spreadsheet ID master, không fallback về master làm database.
  - Web App chạy dưới quyền người truy cập (`USER_ACCESSING`) hoặc cấu hình máy chủ độc lập phù hợp (`EXECUTE_AS_ME` + `ANYONE`) để bảo mật dữ liệu.
- **Quy chuẩn Deploy Web App & Quản lý phiên bản (Tránh bẫy treo URL của Google)**:
  - *Cấm phụ thuộc `ScriptApp.getService().getUrl()` khi đang dev nhiều version*: Google bị treo URL ở deployment đầu tiên trong lịch sử dự án.
  - *Quy trình chuẩn*:
    1. Kiểm tra và thao tác trực tiếp trên URL của bản deploy mới nhất cho tới khi giao diện và API mượt mà, không lỗi console.
    2. Dọn sạch (Archive/Delete) các bản deploy rác trong *Quản lý các bản triển khai*, chỉ giữ 1 bản Active duy nhất.
    3. Ghim URL chính thức đã test thành công vào hằng số `WEB_APP_URL` ở đầu script để menu `onOpen()` và nút Sheet mở chuẩn xác 100%.
    4. Cẩn trọng tuyệt đối với ký tự Case-Sensitive (như chữ `O` hoa vs số `0`) khi xử lý URL Google Apps Script.
- **Quy chuẩn Kiến trúc Modular HTML (Component-Based Architecture)**:
  - Khi Web App mở rộng từ 3 module trở lên, tuyệt đối KHÔNG nhồi toàn bộ CSS, HTML và JS vào một file `Index.html` duy nhất (tránh lỗi token truncation, khó quản lý và dễ ghi đè lỗi).
  - Bắt buộc áp dụng cơ chế `include()` của Apps Script:
    - `Mã.gs`: Định nghĩa hàm `include(filename)` helper.
    - `Index.html`: Giữ vai trò Main Shell / Layout chung nạp các partials.
    - Phân tách thành các file thành phần độc lập: `Style.html`, `Module_Dashboard.html`, `Module_Customers.html`, `Module_Properties.html`, `Script.html`.
  - Quy trình nâng cấp theo từng Sprint: Mỗi phiên chat hoàn thiện sâu duy nhất 1 component file tương ứng, không làm ảnh hưởng các phần khác.

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
