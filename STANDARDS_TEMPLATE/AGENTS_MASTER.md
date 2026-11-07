# MASTER AGENTS — HIẾN PHÁP & TIÊU CHUẨN PHÁT TRIỂN WEB APP GOOGLE APPS SCRIPT
> **Thương hiệu:** FILE ĐI LÀM (Workbook & Apps Script Web App Architecture)  
> **Phiên bản:** Master Standard V1.0  
> **Mục đích:** Quy chuẩn bất biến áp dụng cho TẤT CẢ các giải pháp Google Sheets + Google Apps Script Web App (Nhà trọ, BĐS CRM, Bán hàng, Thu nợ, Quản lý kho, v.v.).

---

## 1. NGUYÊN TẮC QUẢN TRỊ & KHÓA CỨNG (HARD LOCKS)
1. **Google Sheets là Database nền (Single Source of Truth)**:
   - Toàn bộ dữ liệu nghiệp vụ lưu trữ tại các tab có tiền tố `DB_` hoặc theo schema định danh.
   - Tuyệt đối CẤM hardcode dữ liệu nghiệp vụ trong code JS hay HTML.
   - CẤM xóa dữ liệu thật, giao dịch đã ghi sổ hoặc hóa đơn/phiếu đã phát hành.
2. **Quy trình làm việc nghiêm ngặt**:
   - `AUDIT → ROOT CAUSE → DESIGN IMPACT → IMPLEMENT TRÊN FILE LOCAL → TEST → BÀN GIAO`.
   - Tuyệt đối không báo tính năng "đã hoàn tất / đã chạy" khi chưa kiểm chứng thực tế.
   - Không fake success (không hiển thị thông báo thành công khi server chưa trả về kết quả hợp lệ).
3. **Mô hình triển khai 2 file vật lý (File-Based Development)**:
   - **`Code.gs`**: Chứa toàn bộ backend logic, routing `doGet()`, xử lý dữ liệu Google Sheets, tính toán công thức, bảo mật và RPC handlers cho frontend.
   - **`Index.html`**: File giao diện duy nhất (Monolithic Single-Page App) tích hợp HTML5 Semantic, Tailwind CSS (CDN), Lucide Icons (CDN), Chart.js (CDN), State Management và Client-side API Bridge.
   - Mọi thay đổi logic hay UI đều được sửa đổi trực tiếp vào 2 file này trên ổ đĩa máy tính để người dùng copy-paste sang Apps Script Editor một cách nhất quán, tránh lỗi tràn token của AI.

---

## 2. QUY CHUẨN THIẾT KẾ UI/UX FINTECH CAO CẤP (MINIMALIST & CLASSY)
1. **Bảng màu chủ đạo**:
   - Primary: Xanh ngọc Mint Emerald (`#059669` / `#10b981`), Mint nhạt nền (`#ecfdf5`).
   - Nền & Khung: Slate thanh lịch (`#f8fafc`, `#f1f5f9`, `#e2e8f0`), chữ đen xám sâu (`#0f172a`, `#334155`).
2. **CẤM Emoji trẻ con**:
   - Tuyệt đối không gắn emoji (⚡, ✨, 🔑, 🏠, 📞, ⏳, ⚠️) vào nút bấm, tab, tiêu đề hay thông báo toast.
   - 100% sử dụng hệ thống vector icon **Lucide Icons** mảnh mai, sang trọng.
3. **Triệt tiêu lậm Card & lậm Pill ("Anti-Pill & Anti-Card Overload")**:
   - Không bọc thông tin hiển nhiên vào các khối card nổi lòe loẹt.
   - CẤM lạm dụng khung pill bo tròn (badge viên thuốc) cho các trường dữ liệu bình thường.
   - Mã định danh (SKU, Mã đơn, Mã phòng, Mã hợp đồng) bắt buộc hiển thị text font **Monospace** phẳng (`font-mono text-xs font-semibold text-slate-700`).
   - Trạng thái chỉ dùng chấm tròn nhỏ tinh tế (`•` bullet) kèm chữ phẳng màu tương ứng.
4. **Phân định 2 trải nghiệm độc lập (Desktop vs Mobile View)**:
   - **Giao diện Desktop (Laptop/Màn hình lớn)**:
     - Sidebar bên trái cố định (240px) có nút Hamburger thu gọn về Icon-only (64px).
     - Bảng Master-Table phẳng tràn viền (Edge-to-Edge Full Bleed), cố định tiêu đề (`Freeze Header`), không dùng đường kẻ dọc cột Excel, menu 3 chấm (`MoreVertical`) ở cột ngoài cùng bên phải.
     - Màn hình chi tiết ưu tiên **Drawer trượt từ bên phải** (Right Slide-over Drawer 450px - 500px), hạn chế dùng modal popup che khuất màn hình.
   - **Giao diện Mobile (Điện thoại / Ngoài hiện trường)**:
     - **Table-to-Card Transformation**: Tuyệt đối CẤM bắt người dùng vuốt ngang màn hình tìm cột. Bảng tự động chuyển thành danh sách các thẻ phẳng tinh gọn.
     - **Nút gọi 1 chạm**: Các trường số điện thoại luôn có link `tel:` bấm trực tiếp.
     - **Bottom Navigation Dock**: Ẩn Sidebar, ghim thanh dock điều hướng ở đáy màn hình trong tầm với ngón tay cái.
     - **Floating Action Button (FAB)**: Nút `+ Thêm Mới` trên desktop chuyển thành nút tròn nổi màu Mint xanh ở góc dưới bên phải (`fixed bottom-20 right-4`).

---

## 3. BÀI HỌC VẬN HÀNH & NGUYÊN TẮC GOOGLE APPS SCRIPT
1. **Bản chất 4 định danh kỹ thuật (Không nhầm lẫn)**:
   - `Spreadsheet ID`: Định danh bảng tính Google Sheets.
   - `Apps Script Project ID`: Định danh dự án Apps Script gắn với Sheet.
   - `Deployment ID`: Định danh bản triển khai Web App.
   - `Web App URL (/exec)`: Đường dẫn truy cập phiên bản triển khai cụ thể.
2. **Cơ chế cập nhật Deployment (Tránh bẫy treo URL đầu tiên)**:
   - Hàm `ScriptApp.getService().getUrl()` chỉ trả về URL của deployment đầu tiên trong lịch sử dự án, không tự cập nhật khi tạo deployment mới.
   - **Quy trình chuẩn khi deploy**:
     - Vào `Triển khai` (Deploy) $\rightarrow$ `Quản lý các bản triển khai` (Manage deployments) $\rightarrow$ Bấm icon Bút chì (`Chỉnh sửa`) $\rightarrow$ Chọn `Phiên bản: Phiên bản mới` $\rightarrow$ Bấm `Triển khai`.
     - Giữ nguyên URL triển khai cố định để không làm đứt gãy link đã gửi cho khách hoặc ghim trong menu Sheet.
3. **Cẩn trọng ký tự URL (Case-Sensitive)**:
   - URL Google Script phân biệt chữ hoa/thường cực kỳ chặt chẽ (ví dụ: chữ `O` hoa khác số `0`).
4. **Phân quyền truy cập an toàn**:
   - Bản nội bộ/bán kèm file: Chọn `Execute as: Me` (Tôi) và `Who has access: Anyone` (Bất kỳ ai có link) để tránh lỗi xác thực đa tài khoản Google khi người dùng mở trên trình duyệt.

---

## 4. QUY CHUẨN KIẾN TRÚC MÃ NGUỒN 2 FILE
1. **`Code.gs`**:
   - `doGet()`: Trả về `HtmlService.createHtmlOutputFromFile('Index').setTitle(...).setXFrameOptionsMode(...)`.
   - `getInitialData()`: RPC gom toàn bộ dữ liệu các tab Sheet cần thiết về 1 JSON duy nhất trong 1 lần gọi, giảm thiểu độ trễ mạng.
   - Các API ghi dữ liệu: `saveEntity(payload)`, `deleteEntity(id)`, `updateStatus(id, status)`... luôn bọc trong `LockService.getScriptLock()` để chống ghi đè đồng thời (race condition).
2. **`Index.html`**:
   - Khởi tạo `state = { activeTab: '', data: {}, filters: {} }`.
   - Router điều hướng không tải lại trang (`switchTab(tabId)`).
   - Component Render tách biệt: `renderTable()`, `renderCards()`, `renderDrawer()`, `renderCharts()`.
   - Toàn bộ gọi server qua: `google.script.run.withSuccessHandler(...).withFailureHandler(...).serverMethod(...)`.
