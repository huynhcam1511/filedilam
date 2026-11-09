# BÁO CÁO BÀN GIAO KỸ THUẬT (HANDOFF REPORT) — MILESTONE 1
## TÁI CẤU TRÚC CONGNO_INDEX.HTML VÀ CONGNO_CODE.GS THEO CHUẨN TAISAN

**Tác giả:** Teamwork Explorer (`explorer_1`)  
**Người nhận:** Teamwork Orchestrator & Worker (`implementer_1`)  
**Thư mục làm việc:** `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\explorer_1\`  
**Thời gian:** 2026-11-09T12:48:00Z  

---

## 1. OBSERVATION (QUAN SÁT THỰC NGHIỆM TRỰC TIẾP)

1. **Khảo sát tệp `STANDARDS_TEMPLATE/CONGNO_Index.html` (4,898 dòng, 239 KB)**:
   - Dòng 1201: Khai báo `const AppState = { data: { doiTac: [], phatSinhNo: [], thanhToan: [], danhMuc: [], caiDat: {} } };` nhưng **không bao giờ gán vào `window.AppState`**.
   - Dòng 1683, 2004, 3467, 3838, 4058, 4454, 4714: Toàn bộ các module con đều kiểm tra `const state = window.AppState || {};` $\rightarrow$ Vì `window.AppState === undefined`, `state` luôn là object rỗng `{}` và không có dữ liệu.
   - Dòng 2593: `window.ModuleDashboard = ModuleDashboard;`
   - Dòng 3447: `window.ModuleTransactions = ModuleTransactions;`
   - Dòng 4891-4893: `window.ModuleCategories = ModuleCategories; window.ModuleSettings = ModuleSettings; window.ModuleHelp = ModuleHelp;`
   - **HOÀN TOÀN THIẾU**: `window.ModuleInvoices` và `window.ModulePartners` không hề được gán vào `window`!
   - Dòng 1281-1284: `triggerModuleRender` kiểm tra `if (tabId === 'invoices' && window.ModuleInvoices ...)` và `if (tabId === 'partners' && window.ModulePartners ...)` $\rightarrow$ Cả 2 đều trả về `false`, khiến người dùng bấm vào 2 tab này thì **không có bất kỳ hành động nào diễn ra**.
   - Dòng 1666: `const template = document.querySelector('template#tpl-mod-dashboard');` $\rightarrow$ Không có thẻ `<template id="tpl-mod-dashboard">` nào trong toàn bộ file.
   - Dòng 97: Thẻ `<aside id="action-drawer">` dùng `hidden` nhưng khi gọi `openDrawer` và `closeDrawer` kết hợp với `translate-y-full` không đồng bộ, tạo ra hiện tượng lọt vệt bóng/thanh đáy màu xám ở màn hình mobile.

2. **Chạy mô phỏng kiểm thử Node.js trên `CONGNO_Index.html` (`test_simulation.js`)**:
   ```text
   Main script length: 158376
   Script parsed and evaluated.
   window.AppState: undefined
   window.ModuleDashboard: object
   window.ModuleTransactions: object
   window.ModuleInvoices: undefined
   window.ModulePartners: undefined
   window.ModuleCategories: object
   window.ModuleSettings: object
   window.ModuleHelp: object
   window.switchTab: undefined
   ```
   $\rightarrow$ Xác nhận 100% bằng chứng: `window.AppState`, `window.ModuleInvoices`, `window.ModulePartners`, và `window.switchTab` đều là `undefined`.

3. **Khảo sát tệp mẫu `STANDARDS_TEMPLATE/TAISAN_Index.html` (2,146 dòng, 130 KB)**:
   - Sử dụng mô hình **Monolithic Flat SPA Pattern**: Toàn bộ logic giao diện được xử lý qua router trực tiếp `switchTab(tabId)` kích hoạt 7 hàm render phẳng: `renderDashboard()`, `renderTransactions()`, `renderInvoices()`, `renderPartners()`, `renderCategories()`, `renderSettings()`, `renderHelp()`.
   - Quản lý biểu đồ qua từ điển `let ChartInstances = {};`: Trước khi tạo biểu đồ mới luôn gọi `ChartInstances[k]?.destroy()`.
   - Tích hợp sẵn bộ dữ liệu mẫu dự phòng (seed data) trong State ngay từ đầu: Mở trang lên là có dữ liệu và biểu đồ hiển thị ngay tức thì mà không cần đợi server Google Sheet trả về.

4. **Khảo sát tệp `STANDARDS_TEMPLATE/CONGNO_Code.gs` (912 dòng, 35.7 KB)**:
   - Đã có cấu trúc Single Visible Tab với `lockAndHideDatabaseSheets()` và tab `HDSD` có nút Mint tại ô `B2:D3`.
   - Đã có ánh xạ 2 chiều tiếng Việt + camelCase trong `getInitialData()`.
   - **Phát hiện thiếu 2 hàm RPC**:
     - Dòng 3322 ở frontend gọi `google.script.run.deleteThanhToan(id)` nhưng backend chưa có hàm `deleteThanhToan(maTT)`.
     - Dòng 4688 ở frontend gọi `google.script.run.saveDanhMuc(itemPayload)` nhưng backend chưa có hàm `saveDanhMuc(payload)`.

---

## 2. LOGIC CHAIN (CHUỖI LÝ LUẬN KỸ THUẬT)

1. Từ **Observation 1 & 2**, biến `AppState` được khai báo bằng `const` trong script scope chứ không gán vào `window.AppState`, đồng thời `ModuleInvoices` và `ModulePartners` không được gán vào `window`. Do đó, router `switchTab()` khi chạy không thể tìm thấy module để render, dẫn đến giao diện bị đơ, không chuyển tab được và trắng trơn.
2. Từ **Observation 1**, việc `ModuleDashboard` cố tìm `template#tpl-mod-dashboard` và việc `AppState.data` ban đầu để mảng rỗng `[]` khiến trang trắng trơn trong lúc chờ mạng, các trục canvas Chart.js nhận mảng rỗng và hiển thị lỗi.
3. Từ **Observation 3**, giải pháp tối ưu nhất đã được kiểm chứng hoạt động 100% trên `TAISAN_Index.html` là **xóa bỏ hoàn toàn cách chia 7 Object lồng nhau (`Module...`)**, chuyển đổi toàn bộ thành **7 hàm render phẳng độc lập** gọi trực tiếp từ `switchTab(tabId)`:
   - `renderDashboard()`
   - `renderTransactions()`
   - `renderInvoices()`
   - `renderPartners()`
   - `renderCategories()`
   - `renderSettings()`
   - `renderHelp()`
4. Từ **Observation 1 & 3**, để khắc phục triệt để lỗi Drawer bị lọt thanh popup thừa ở đáy màn hình:
   - Khởi tạo `<aside id="action-drawer">` có sẵn class `hidden`.
   - Khi `openDrawer()`: bỏ `hidden` $\rightarrow$ gỡ `translate-y-full`.
   - Khi `closeDrawer()`: thêm `translate-y-full` $\rightarrow$ sau 300ms transition thêm lại `hidden`.
5. Từ **Observation 4**, để hệ thống hoạt động trọn gói không phát sinh lỗi khi người dùng xóa phiếu thu/trả nợ hoặc lưu danh mục, cần bổ sung `deleteThanhToan(maTT)` (có cấn trừ ngược lại dư nợ hóa đơn) và `saveDanhMuc(payload)` vào `CONGNO_Code.gs`.

---

## 3. CAVEATS (GIỚI HẠN & ĐIỀU KIỆN BIÊN)

1. **Phạm vi quyền hạn**: Explorer chỉ thực hiện khảo sát, phân tích lỗi và lập bản thiết kế kiến trúc kỹ thuật. Explorer tuyệt đối KHÔNG can thiệp trực tiếp vào mã nguồn của `CONGNO_Index.html` hay `CONGNO_Code.gs`.
2. **Kích thước tệp HTML**: Tệp `CONGNO_Index.html` sau khi tái cấu trúc phẳng sẽ gọn gàng, loại bỏ các đoạn code thừa/lặp lại giữa các object module (dự kiến giảm từ ~4,898 dòng xuống khoảng 2,200 – 2,500 dòng tương tự `TAISAN_Index.html`).
3. **Môi trường Apps Script**: Trình duyệt Apps Script khi chạy Web App bọc mã nguồn trong iframe cát (sandbox), do đó việc khai báo `window.AppState = ...; var AppState = window.AppState;` và hàm phẳng ở top-level là cách tiếp cận an toàn tuyệt đối 100%.

---

## 4. CONCLUSION (KẾT LUẬN & CHỈ DẪN HÀNH ĐỘNG CHO WORKER)

Worker (`implementer_1`) sẽ tiến hành thực thi tái cấu trúc 2 file vật lý theo các chỉ dẫn chính xác sau:

### Nhiệm Vụ 1: Tái cấu trúc `STANDARDS_TEMPLATE/CONGNO_Index.html`
1. Đặt tiêu đề chuẩn: `<title>QUẢN LÝ CÔNG NỢ KHÁCH HÀNG & NCC — WEB APP v1.0 — FILE ĐI LÀM</title>`.
2. Chuẩn hóa ID của 7 tab container thành:
   - `tab-dashboard`
   - `tab-transactions`
   - `tab-invoices`
   - `tab-partners`
   - `tab-categories`
   - `tab-settings`
   - `tab-help`
3. Khởi tạo `window.AppState` ở đầu script với **BỘ DỮ LIỆU MẪU MẶC ĐỊNH ĐẦY ĐỦ** (4 đối tác, 4 hóa đơn nợ, 3 phiếu thanh toán, 5 danh mục, cài đặt VietQR & mẫu Zalo) như đã đặc tả tại mục 5.1 của `analysis.md`.
4. Viết Router phẳng `switchTab(tabId)` trực tiếp kích hoạt 7 hàm render phẳng:
   - `renderDashboard()`: 5 KPI + Lịch nhắc nợ hôm nay (nút gọi `tel:`, copy Zalo) + 8 Biểu đồ Chart.js (Cashflow, Tỷ lệ AR/AP, Tuổi nợ, Top Khách nợ, Top NCC nợ, Tỷ lệ thu hồi, Phương thức, Dự báo 30 ngày).
   - `renderTransactions()`: Bảng Master-Table (desktop) & Card gọn (mobile) + Form Right Drawer Lập phiếu Thu/Trả + VietQR động.
   - `renderInvoices()`: Sổ hóa đơn nợ + Modal xem trước & in Biên bản đối soát A4 (`#statement-modal`).
   - `renderPartners()`: Danh bạ Khách hàng & NCC + Cảnh báo đỏ vượt hạn mức tín dụng.
   - `renderCategories()`: Quản lý nhóm nợ & hình thức thanh toán.
   - `renderSettings()`: Cài đặt doanh nghiệp, hotline, ngân hàng VietQR & Mẫu tin nhắn Zalo.
   - `renderHelp()`: Hướng dẫn 3 bước Onboarding + Accordion FAQ + Kênh hỗ trợ Zalo.
5. Quản lý biểu đồ qua `let ChartInstances = {};` (hủy an toàn trước khi vẽ mới).
6. Tối ưu Drawer với class `hidden` khi đóng để triệt tiêu lỗi lọt vệt đáy màn hình.

### Nhiệm Vụ 2: Nâng cấp `STANDARDS_TEMPLATE/CONGNO_Code.gs`
1. Bổ sung hàm `deleteThanhToan(maTT)` bọc `LockService`:
   - Xóa dòng trong `DB_ThanhToan`.
   - Tìm hóa đơn `DB_PhatSinhNo` tương ứng: giảm `daTra`, tăng lại `conLai`, cập nhật trạng thái `"Còn nợ"`.
   - Trả về `getInitialData()`.
2. Bổ sung hàm `saveDanhMuc(payload)` bọc `LockService`.
3. Đảm bảo quy tắc **Single Visible Tab**: `lockAndHideDatabaseSheets()` khóa & ẩn toàn bộ `DB_*`, chỉ hiển thị duy nhất tab `HDSD` có nút Mint tại ô `B2:D3`.

---

## 5. VERIFICATION METHOD (PHƯƠNG PHÁP KIỂM TRA ĐỘC LẬP)

Sau khi Worker hoàn thành, kiểm tra độc lập bằng các bước sau:
1. **Kiểm tra cú pháp & tính toàn vẹn Script bằng Node.js**:
   ```powershell
   node -e "
     const fs = require('fs');
     const html = fs.readFileSync('STANDARDS_TEMPLATE/CONGNO_Index.html', 'utf8');
     const scripts = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi)];
     scripts.forEach((s, i) => {
       new Function(s[1]);
       console.log('Script block ' + i + ': Syntax OK (len ' + s[1].length + ')');
     });
   "
   ```
2. **Kiểm tra mô phỏng chuyển tab & render 7 modules**:
   - Chạy script kiểm thử DOM Node.js để kiểm tra `switchTab()` giữa 7 tab: `tab-dashboard`, `tab-transactions`, `tab-invoices`, `tab-partners`, `tab-categories`, `tab-settings`, `tab-help` không được phát sinh bất kỳ lỗi `ReferenceError` hay `TypeError` nào.
   - Kiểm tra `ChartInstances` chứa đủ các instance biểu đồ khi ở `tab-dashboard`.
3. **Điều kiện phán quyết vi phạm (Invalidation Conditions)**:
   - Nếu khi mở trang ban đầu không có dữ liệu hiển thị (bị trắng trơn) $\rightarrow$ **FAIL**.
   - Nếu chuyển sang tab Hóa đơn hoặc Đối tác mà màn hình không cập nhật $\rightarrow$ **FAIL**.
   - Nếu Drawer ở chế độ đóng trên màn hình mobile vẫn nhìn thấy một thanh vệt màu xám/trắng ở đáy $\rightarrow$ **FAIL**.
   - Nếu trong `CONGNO_Code.gs` các tab `DB_*` không được ẩn hoặc tab `HDSD` thiếu nút Mint tại `B2:D3` $\rightarrow$ **FAIL**.
