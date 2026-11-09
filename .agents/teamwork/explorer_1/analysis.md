# BÁO CÁO PHÂN TÍCH KỸ THUẬT & BẢN THIẾT KẾ KIẾN TRÚC TÁI CẤU TRÚC
## HỆ THỐNG QUẢN LÝ CÔNG NỢ KHÁCH HÀNG & NCC — WEB APP v1.0 — FILE ĐI LÀM

**Ngày phân tích:** 09/11/2026  
**Người thực hiện:** Teamwork Explorer (`explorer_1`)  
**Đối tượng khảo sát:**
1. Bản mẫu chuẩn (Golden Reference): `STANDARDS_TEMPLATE/TAISAN_Index.html` & `STANDARDS_TEMPLATE/TAISAN_Code.gs`
2. Tệp mục tiêu cần tái cấu trúc: `STANDARDS_TEMPLATE/CONGNO_Index.html` & `STANDARDS_TEMPLATE/CONGNO_Code.gs`
3. Tài liệu chuẩn: `AGENTS_MASTER.md` V2.4, `plan_refactor_congno.md`, `ORIGINAL_REQUEST.md`

---

## 1. TỔNG QUAN PHÂN TÍCH & KẾT LUẬN CHÍNH (EXECUTIVE SUMMARY)

1. **Hiện trạng lỗi của `CONGNO_Index.html`**:
   - Web App mở ra bị **trắng trơn hoàn toàn**, các biểu đồ không hiển thị, bấm tab "Sổ Hóa Đơn & Nợ" và "Hồ Sơ Đối Tác" không có bất kỳ phản hồi nào.
   - Nguyên nhân chính:
     - Lỗi **Global Scope Collision**: Biến `AppState` được khai báo bằng `const AppState` ở local scope và không được gán vào `window.AppState`. Trong khi đó, các module con bên dưới đều truy vấn `window.AppState` dẫn đến dữ liệu luôn là `undefined` hoặc mảng rỗng `[]`.
     - Lỗi **Thiếu Khai Báo Window Module**: `window.ModuleInvoices` và `window.ModulePartners` hoàn toàn không được gán vào `window` (khác với `ModuleDashboard` và `ModuleTransactions`). Khi `triggerModuleRender('invoices')` và `triggerModuleRender('partners')` chạy, hàm kiểm tra `window.ModuleInvoices` trả về `undefined` và **bỏ qua việc render trong im lặng (Silent Failure)**.
     - Lỗi **Template Phụ Thuộc Ảo**: `ModuleDashboard.render()` cố gắng tìm `template#tpl-mod-dashboard` nhưng trong toàn bộ tệp HTML không hề tồn tại thẻ `<template>` này.
     - Lỗi **Thiếu Dữ Liệu Mẫu Mặc Định Khởi Tạo**: `AppState.data` được khai báo với các mảng rỗng `[]` ban đầu. Khi mở trang, trong 1-2 giây chờ RPC `getInitialData()` từ Google Sheets nạp về, giao diện bị trắng tinh và Chart.js nhận dữ liệu rỗng.
     - Lỗi **Lọt Thanh Popup Đáy Màn Hình**: Thẻ `<aside id="action-drawer">` sử dụng `translate-y-full` trên mobile nhưng không được ẩn triệt để (`display: none` / `hidden`), khiến bóng đổ `shadow-2xl` và phần viền trên của drawer bị lộ một vệt màu trắng/xám ở đáy màn hình.

2. **Bài học thành công từ `TAISAN_Index.html`**:
   - Sử dụng **Kiến trúc Nguyên khối Phẳng (Monolithic Flat SPA Pattern)**: Toàn bộ logic giao diện được điều phối bởi router tập trung `switchTab(tabId)` gọi trực tiếp 7 hàm render phẳng: `renderDashboard()`, `renderTransactions()`, `renderInvoices()`, `renderPartners()`, `renderCategories()`, `renderSettings()`, `renderHelp()`.
   - Không chia nhỏ thành các Object lồng nhau (`Module...`) độc lập để tránh hoàn toàn lỗi scope `this` và lỗi phụ thuộc thứ tự nạp script.
   - Quản lý vòng đời Chart.js bằng từ điển `ChartInstances`: Trước khi vẽ canvas mới, luôn gọi `ChartInstances[key]?.destroy()` an toàn, triệt tiêu 100% lỗi tái sử dụng canvas của Chart.js.
   - Tích hợp sẵn **Default Seed Data** ngay từ khi khởi tạo `AppState`: Khi vừa tải trang xong, 5 thẻ KPI, 8 biểu đồ Chart.js, bảng danh sách nhắc nợ, danh bạ đối tác và sổ hóa đơn đều có sẵn dữ liệu mẫu hiển thị ngay lập tức với tốc độ < 0.1 giây.

3. **Backend `CONGNO_Code.gs`**:
   - Đã có nền tảng cấu trúc tương đối tốt với quy tắc **Single Visible Tab** (bảo vệ `protect()` và ẩn `hideSheet()` các sheet `DB_*`, chỉ hiển thị duy nhất tab `HDSD` có nút Mint tại `B2:D3`).
   - Đã triển khai ánh xạ dữ liệu 2 chiều (vừa giữ Header tiếng Việt vừa ánh xạ camelCase alias) trong `getInitialData()`.
   - **Điểm khuyết thiếu cần bổ sung**:
     - Thiếu hàm `deleteThanhToan(maTT)`: Khi xóa phiếu thu/trả nợ, cần tự động cấn trừ ngược lại số tiền `Đã Thanh Toán` và `Còn Lại` trên hóa đơn `DB_PhatSinhNo` tương ứng để đảm bảo toàn vẹn nghiệp vụ kế toán.
     - Thiếu hàm `saveDanhMuc(payload)`: Để hỗ trợ thêm/sửa danh mục từ tab Cấu hình hệ thống.

---

## 2. PHÂN TÍCH CHI TIẾT KIẾN TRÚC MẪU (TAISAN_INDEX.HTML GOLDEN REFERENCE)

### 2.1. Cấu Trúc AppState & Cơ Chế Zero White-Screen
Trong `TAISAN_Index.html`, dữ liệu hiển thị không bao giờ bị phụ thuộc hoàn toàn vào tốc độ mạng hay thời gian phản hồi của máy chủ Google Apps Script:
```javascript
// Khởi tạo State toàn cục an toàn
window.AppState = {
  currentTab: 'tab-dashboard',
  sidebarCollapsed: false,
  data: {
    doiTac: [ /* Bộ dữ liệu mẫu đầy đủ */ ],
    phatSinhNo: [ /* Bộ dữ liệu mẫu đầy đủ */ ],
    thanhToan: [ /* Bộ dữ liệu mẫu đầy đủ */ ],
    danhMuc: [ /* Bộ dữ liệu mẫu đầy đủ */ ],
    caiDat: { /* Cấu hình doanh nghiệp & VietQR mẫu */ }
  }
};
var AppState = window.AppState; // Đồng bộ alias truy xuất
```
- **Fallback Data cục bộ**: Trong mỗi hàm render, nếu `AppState.data` chưa kịp nạp dữ liệu từ server, hàm luôn dự phòng fallback data để render lập tức.
- **RPC Background Hydration**: Hàm `refreshData()` gọi `google.script.run.getInitialData()` ngầm dưới nền. Khi server phản hồi thành công, `AppState.data` được ghi đè bằng dữ liệu thực từ Google Sheet và tự động kích hoạt hàm render của tab hiện tại kèm thông báo Toast êm ái.

### 2.2. Bộ Điều Hướng Router `switchTab(tabId)` & 7 Hàm Render Phẳng
Kiến trúc điều hướng phẳng loại bỏ hoàn toàn các lớp kiểm tra phức tạp:
```javascript
const TabMeta = {
  'tab-dashboard': { title: 'Tổng Quan & Nhắc Nợ', subtitle: 'Theo dõi tổng quan công nợ, hạn thu trả và gửi tin nhắc nợ' },
  'tab-transactions': { title: 'Thu - Trả Nợ', subtitle: 'Ghi nhận phiếu thu tiền khách hàng và phiếu trả nợ nhà cung cấp' },
  'tab-invoices': { title: 'Sổ Hóa Đơn & Nợ', subtitle: 'Quản lý phát sinh nợ chi tiết, hóa đơn mua/bán và đối soát chứng từ' },
  'tab-partners': { title: 'Hồ Sơ Đối Tác', subtitle: 'Danh bạ Khách hàng và Nhà cung cấp kèm sổ công nợ chi tiết' },
  'tab-categories': { title: 'Danh Mục Hệ Thống', subtitle: 'Phân loại nhóm khách hàng, nhà cung cấp và hình thức thanh toán' },
  'tab-settings': { title: 'Cài Đặt & Cấu Hình QR', subtitle: 'Thông tin cơ sở kinh doanh, tài khoản ngân hàng và mã VietQR' },
  'tab-help': { title: 'Hướng Dẫn Sử Dụng', subtitle: 'Quy trình vận hành chuẩn 3 bước và kênh hỗ trợ FILE ĐI LÀM' }
};

function switchTab(tabId) {
  if (!TabMeta[tabId]) return;
  AppState.currentTab = tabId;

  // 1. Ẩn tất cả panels, kích hoạt panel đang chọn
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  const activePane = document.getElementById(tabId);
  if (activePane) activePane.classList.remove('hidden');

  // 2. Kích hoạt trực tiếp hàm render tương ứng
  if (tabId === 'tab-dashboard') renderDashboard();
  if (tabId === 'tab-transactions') renderTransactions();
  if (tabId === 'tab-invoices') renderInvoices();
  if (tabId === 'tab-partners') renderPartners();
  if (tabId === 'tab-categories') renderCategories();
  if (tabId === 'tab-settings') renderSettings();
  if (tabId === 'tab-help') renderHelp();

  // 3. Cập nhật tiêu đề trang Header
  document.getElementById('top-page-title').innerText = TabMeta[tabId].title;
  document.getElementById('top-page-subtitle').innerText = TabMeta[tabId].subtitle;

  // 4. Cập nhật trạng thái active Sidebar Desktop
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.remove('bg-brand-50', 'text-brand-600', 'font-bold');
    el.classList.add('text-slate-600');
  });
  const activeNav = document.getElementById('nav-' + tabId);
  if (activeNav) {
    activeNav.classList.remove('text-slate-600');
    activeNav.classList.add('bg-brand-50', 'text-brand-600', 'font-bold');
  }

  // 5. Cập nhật trạng thái active Mobile Bottom Dock
  document.querySelectorAll('.mobile-nav-item').forEach(el => {
    el.classList.remove('text-brand-600', 'font-bold');
    el.classList.add('text-slate-400');
  });
  const activeMob = document.getElementById('mobile-' + tabId);
  if (activeMob) {
    activeMob.classList.remove('text-slate-400');
    activeMob.classList.add('text-brand-600', 'font-bold');
  }

  // 6. Vẽ lại Icon Lucide
  if (window.lucide) lucide.createIcons();
}
```

### 2.3. Quản Lý Vòng Đời Chart.js (ChartInstances Dictionary)
- Không lưu biến rời rạc trong các object module.
- Khai báo một dictionary duy nhất: `let ChartInstances = {};`
- Hàm hủy an toàn trước khi vẽ mới:
  ```javascript
  function destroyAllCharts() {
    Object.keys(ChartInstances).forEach(k => {
      if (ChartInstances[k]) {
        try { ChartInstances[k].destroy(); } catch (e) {}
        ChartInstances[k] = null;
      }
    });
  }
  ```
- Khi khởi tạo chart trên canvas:
  ```javascript
  const ctx = document.getElementById('dash-chart-cashflow');
  if (ctx) {
    if (ChartInstances.cashflow) ChartInstances.cashflow.destroy();
    ChartInstances.cashflow = new Chart(ctx, { ... });
  }
  ```

### 2.4. Khắc Phục Triệt Để Lỗi Lọt Thanh Popup Ở Đáy Màn Hình (Drawer & Bottom Sheet)
- **Nguyên nhân**: Khi thẻ `aside#action-drawer` được thiết lập `translate-y-full` ở chế độ đóng trên mobile nhưng không có class `hidden`, bóng đổ của thẻ (`shadow-2xl`) và đường viền trên vẫn lọt vào khung nhìn vài pixel. Ngoài ra, khi chuyển đổi kích thước màn hình giữa mobile và desktop, việc thiếu class `hidden` làm lộ thanh đáy.
- **Giải pháp dứt điểm**:
  1. Thêm thuộc tính `hidden` vào mã HTML khởi điểm của `#action-drawer` và backdrop.
  2. Hàm `openDrawer(title, htmlContent)`:
     ```javascript
     function openDrawer(title, htmlContent) {
       const drawer = document.getElementById('action-drawer');
       const backdrop = document.getElementById('action-drawer-backdrop');
       if (title) document.getElementById('drawer-title').innerText = title;
       if (htmlContent) document.getElementById('drawer-body').innerHTML = htmlContent;
       if (backdrop) backdrop.classList.remove('hidden');
       if (drawer) {
         drawer.classList.remove('hidden');
         requestAnimationFrame(() => {
           drawer.classList.remove('lg:translate-x-full', 'translate-y-full');
         });
       }
       if (window.lucide) lucide.createIcons();
     }
     ```
  3. Hàm `closeDrawer()`:
     ```javascript
     function closeDrawer() {
       const drawer = document.getElementById('action-drawer');
       const backdrop = document.getElementById('action-drawer-backdrop');
       if (backdrop) backdrop.classList.add('hidden');
       if (drawer) {
         drawer.classList.add('lg:translate-x-full', 'translate-y-full');
         setTimeout(() => {
           drawer.classList.add('hidden');
         }, 300);
       }
     }
     ```
  4. Cấu trúc HTML chuẩn:
     ```html
     <div id="action-drawer-backdrop" onclick="closeDrawer()" class="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs hidden transition-opacity"></div>
     <aside id="action-drawer" class="fixed z-40 bg-white shadow-2xl transition-all duration-300 hidden
       lg:top-0 lg:right-0 lg:bottom-0 lg:w-[480px] lg:translate-x-full lg:rounded-none
       bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl translate-y-full flex flex-col">
       <div class="p-4 border-b border-slate-100 flex items-center justify-between">
         <h2 id="drawer-title" class="text-sm font-bold text-slate-900">Chi tiết tác vụ</h2>
         <button onclick="closeDrawer()" type="button" class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
           <i data-lucide="x" class="w-5 h-5 stroke-[1.75]"></i>
         </button>
       </div>
       <div id="drawer-body" class="p-5 overflow-y-auto flex-1 space-y-4"></div>
     </aside>
     ```

---

## 3. BẰNG CHỨNG XÁC MINH NGUYÊN NHÂN LỖI TRONG `CONGNO_INDEX.HTML`

Bằng kiểm thử mô phỏng môi trường Node.js DOM trực tiếp trên file `STANDARDS_TEMPLATE/CONGNO_Index.html` (kịch bản `.agents/teamwork/explorer_1/test_simulation.js`), chúng tôi thu được kết quả:
```text
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

### Các phát hiện chi tiết:
1. **Lỗi `window.AppState` bị `undefined`**:
   - Dòng 1201: `const AppState = { data: { ... } };`
   - Dòng 1683, 2004, 3467, 3838, 4058, 4454, 4714: Đều đọc `window.AppState`.
   - Kết quả: Tất cả các module đều không lấy được dữ liệu từ `AppState`.
2. **Lỗi thiếu đăng ký `window.ModuleInvoices` và `window.ModulePartners`**:
   - Dòng 2593: `window.ModuleDashboard = ModuleDashboard;`
   - Dòng 3447: `window.ModuleTransactions = ModuleTransactions;`
   - Dòng 4891: `window.ModuleCategories = ModuleCategories;`
   - Dòng 4892: `window.ModuleSettings = ModuleSettings;`
   - Dòng 4893: `window.ModuleHelp = ModuleHelp;`
   - `ModuleInvoices` và `ModulePartners` hoàn toàn bị quên gán vào `window`. Do đó khi người dùng chuyển tab sang Invoices hoặc Partners, router kiểm tra `window.ModuleInvoices` và `window.ModulePartners` đều trả về `undefined`, không chạy hàm render.
3. **Lỗi tìm kiếm thẻ mẫu không tồn tại**:
   - Dòng 1666: `const template = document.querySelector('template#tpl-mod-dashboard');`
   - Thẻ `<template id="tpl-mod-dashboard">` hoàn toàn không có trong file HTML.
4. **Lỗi đặt tên ID Tab không đồng bộ**:
   - Container tab: `id="mod-dashboard"`, `id="mod-transactions"`, `id="mod-invoices"`, v.v.
   - Nút Sidebar: `id="nav-btn-dashboard"`, `onclick="switchTab('dashboard')"`
   - Nút Mobile: `id="dock-btn-dashboard"`
   - Chuẩn thống nhất theo `TAISAN_Index.html`: Cần chuẩn hóa toàn bộ thành `tab-dashboard`, `tab-transactions`, `tab-invoices`, `tab-partners`, `tab-categories`, `tab-settings`, `tab-help` với prefix `nav-tab-...`, `mobile-tab-...` và container `id="tab-..."`.

---

## 4. PHÂN TÍCH BACKEND & GOOGLE APPS SCRIPT (`CONGNO_CODE.GS`)

### 4.1. Đánh Giá Hiện Trạng
- Hằng số cấu hình:
  - `APP_TITLE`: `"QUẢN LÝ CÔNG NỢ KHÁCH HÀNG & NCC — WEB APP v1.0 — FILE ĐI LÀM"` (Khớp 100% chuẩn).
  - Tên các tab Database: `DB_DoiTac`, `DB_PhatSinhNo`, `DB_ThanhToan`, `DB_DanhMuc`, `DB_CaiDat`, `HDSD`.
- `onOpen()`: Đã có logic tự động đổi tên file Google Sheet khớp với `APP_TITLE` và tạo menu "File Đi Làm".
- `setupDatabaseSheets()`: Đã tạo 5 tab `DB_*` và tab `HDSD` có nút Mint tại `B2:D3`.
- `lockAndHideDatabaseSheets()`: Đã khóa và ẩn toàn bộ tab `DB_*`, duy trì duy nhất tab `HDSD`.

### 4.2. Các Hàm RPC Bị Thiếu Cần Bổ Sung Ngay
1. **Hàm `deleteThanhToan(maTT)`**:
   - Frontend dòng 3322 gọi `google.script.run.deleteThanhToan(id)`.
   - Backend hiện tại chưa có hàm này!
   - Cần bổ sung hàm `deleteThanhToan(maTT)` bọc `LockService`:
     - Tìm dòng thanh toán trong `DB_ThanhToan` qua `maTT`.
     - Lấy `soTien` và `maGD` (mã hóa đơn phát sinh nợ liên kết).
     - Xóa dòng thanh toán.
     - Tìm dòng hóa đơn `maGD` trong `DB_PhatSinhNo`: Trừ `soTien` khỏi `Đã Thanh Toán` (`daTra`), cộng lại vào `Còn Lại` (`conLai`), cập nhật trạng thái `"Còn nợ"`.
     - Trả về dữ liệu cập nhật mới nhất qua `getInitialData()`.
2. **Hàm `saveDanhMuc(payload)`**:
   - Frontend dòng 4688 gọi `google.script.run.saveDanhMuc(itemPayload)`.
   - Backend hiện tại chưa có hàm này!
   - Cần bổ sung hàm `saveDanhMuc(payload)` bọc `LockService`:
     - Nếu `maDanhMuc` đã tồn tại: Cập nhật dòng tương ứng trong `DB_DanhMuc`.
     - Nếu mới: Tạo mã `DMUC-XXXXXX` và thêm dòng mới `[Nhóm, Mã, Tên, Ghi Chú]`.
     - Trả về `{ success: true, message: 'Đã lưu danh mục thành công' }`.

---

## 5. BẢN ĐẶC TẢ CHI TIẾT DÀNH CHO BƯỚC TRIỂN KHAI (WORKER BLUEPRINT)

### 5.1. Cấu Trúc Khởi Tạo `AppState.data` Kèm Dữ Liệu Mẫu Hoàn Chỉnh
Khai báo trực tiếp ở đầu script của `CONGNO_Index.html`:
```javascript
window.AppState = {
  currentTab: 'tab-dashboard',
  sidebarCollapsed: false,
  data: {
    doiTac: [
      { maDT: 'KHNG-102938', tenDT: 'Công ty CP Đầu Tư Alpha', loaiDT: 'Khách hàng', sdt: '0903123456', email: 'alpha.corp@gmail.com', diaChi: '72 Lê Lợi, Bến Nghé, Quận 1, TP.HCM', hanMucTinDung: 50000000, hanNoNgay: 30, ghiChu: 'Khách hàng VIP dự án nội thất', trangThai: 'Đang giao dịch' },
      { maDT: 'KHNG-294819', tenDT: 'Đại Lý Phân Phối Minh Khang', loaiDT: 'Khách hàng', sdt: '0918765432', email: 'minhkhang.dist@gmail.com', diaChi: '128 Nguyễn Trãi, Thanh Xuân, Hà Nội', hanMucTinDung: 30000000, hanNoNgay: 15, ghiChu: 'Đại lý độc quyền miền Bắc', trangThai: 'Đang giao dịch' },
      { maDT: 'NCCP-582910', tenDT: 'Tổng Kho Vật Tư Nam Sài Gòn', loaiDT: 'Nhà cung cấp', sdt: '0982345678', email: 'vattu.namsaigon@gmail.com', diaChi: 'Khu CN Tân Bình, Tây Thạnh, Tân Phú, TP.HCM', hanMucTinDung: 100000000, hanNoNgay: 45, ghiChu: 'Nhà cung cấp vật tư chính', trangThai: 'Đang giao dịch' },
      { maDT: 'NCCP-691823', tenDT: 'Xưởng Sản Xuất Bao Bì Toàn Cầu', loaiDT: 'Nhà cung cấp', sdt: '0977889900', email: 'baobi.toancau@gmail.com', diaChi: 'Lô 4B Cụm CN Hưng Yên', hanMucTinDung: 20000000, hanNoNgay: 30, ghiChu: 'Cung ứng thùng carton', trangThai: 'Đang giao dịch' }
    ],
    phatSinhNo: [
      { maGD: 'HOAD-102931', maDT: 'KHNG-102938', tenDT: 'Công ty CP Đầu Tư Alpha', loaiGD: 'Bán hàng', soTien: 25000000, daTra: 10000000, conLai: 15000000, hanThanhToan: '15/02/2026', ngayChungTu: '16/01/2026', soHoaDon: 'HD-00129', ghiChu: 'Đơn hàng setup văn phòng Q1', trangThai: 'Còn nợ' },
      { maGD: 'HOAD-204918', maDT: 'KHNG-294819', tenDT: 'Đại Lý Phân Phối Minh Khang', loaiGD: 'Bán hàng', soTien: 18000000, daTra: 18000000, conLai: 0, hanThanhToan: '05/03/2026', ngayChungTu: '21/02/2026', soHoaDon: 'HD-00135', ghiChu: 'Lô hàng giao đợt 1', trangThai: 'Đã tất toán' },
      { maGD: 'HOAD-305829', maDT: 'NCCP-582910', tenDT: 'Tổng Kho Vật Tư Nam Sài Gòn', loaiGD: 'Mua hàng', soTien: 45000000, daTra: 20000000, conLai: 25000000, hanThanhToan: '20/02/2026', ngayChungTu: '06/01/2026', soHoaDon: 'PO-2026-08', ghiChu: 'Nhập gỗ An Cường đợt đầu', trangThai: 'Còn nợ' },
      { maGD: 'HOAD-492019', maDT: 'KHNG-102938', tenDT: 'Công ty CP Đầu Tư Alpha', loaiGD: 'Bán hàng', soTien: 12500000, daTra: 0, conLai: 12500000, hanThanhToan: '10/01/2026', ngayChungTu: '25/12/2025', soHoaDon: 'HD-00118', ghiChu: 'Cung cấp phụ kiện decor', trangThai: 'Còn nợ' }
    ],
    thanhToan: [
      { maTT: 'PTHU-102938', maGD: 'HOAD-102931', maDT: 'KHNG-102938', tenDT: 'Công ty CP Đầu Tư Alpha', loaiTT: 'Thu nợ', soTien: 10000000, phuongThuc: 'Chuyển khoản VietQR', ngayTT: '18/01/2026', ghiChu: 'Tạm ứng đợt 1 hợp đồng', maThamChieu: 'VCB-98230192' },
      { maTT: 'PTHU-203948', maGD: 'HOAD-204918', maDT: 'KHNG-294819', tenDT: 'Đại Lý Phân Phối Minh Khang', loaiTT: 'Thu nợ', soTien: 18000000, phuongThuc: 'Chuyển khoản VietQR', ngayTT: '28/02/2026', ghiChu: 'Tất toán hóa đơn HD-00135', maThamChieu: 'TCB-81923011' },
      { maTT: 'PTRA-304918', maGD: 'HOAD-305829', maDT: 'NCCP-582910', tenDT: 'Tổng Kho Vật Tư Nam Sài Gòn', loaiTT: 'Trả nợ', soTien: 20000000, phuongThuc: 'Chuyển khoản', ngayTT: '15/01/2026', ghiChu: 'Thanh toán đợt 1 tiền vật tư', maThamChieu: 'MB-39102831' }
    ],
    danhMuc: [
      { Nhom: 'HinhThucThanhToan', Ma: 'CK_VIETQR', Ten: 'Chuyển khoản VietQR', GhiChu: 'Thanh toán quét mã ngân hàng' },
      { Nhom: 'HinhThucThanhToan', Ma: 'TIEN_MAT', Ten: 'Tiền mặt', GhiChu: 'Thu/chi tiền mặt trực tiếp' },
      { Nhom: 'HinhThucThanhToan', Ma: 'CHUYEN_KHOAN', Ten: 'Chuyển khoản thường', GhiChu: 'Internet Banking thông thường' },
      { Nhom: 'LoaiDoiTac', Ma: 'KHACH_HANG', Ten: 'Khách hàng', GhiChu: 'Đối tác phát sinh công nợ phải thu' },
      { Nhom: 'LoaiDoiTac', Ma: 'NHA_CUNG_CAP', Ten: 'Nhà cung cấp', GhiChu: 'Đối tác phát sinh công nợ phải trả' }
    ],
    caiDat: {
      tenDoanhNghiep: 'CÔNG TY TNHH FILE ĐI LÀM VIỆT NAM',
      diaChi: 'Tòa nhà Innovation Hub, Quận 1, TP.HCM',
      hotline: '0901234567',
      email: 'contact@filedilam.com',
      nganHang: 'Vietcombank',
      soTaiKhoan: '9901234567',
      chuTaiKhoan: 'CONG TY TNHH FILE DI LAM',
      mauNhacNoZalo: 'Kính gửi {TEN_DOI_TAC}, Doanh nghiệp {TEN_DON_VI} xin gửi thông báo công nợ đến ngày {NGAY_HIEN_TAI}: Tổng dư nợ còn lại là {CON_LAI} đ. Hạn thanh toán: {HAN_THANH_TOAN}. Vui lòng chuyển khoản về STK {STK} ({NGAN_HANG}) - CTK {CHU_TAI_KHOAN}. Xin chân thành cảm ơn Quý đối tác!'
    }
  }
};
var AppState = window.AppState;
```

### 5.2. Danh Sách & Chữ Ký 7 Hàm Render Phẳng
1. `function renderDashboard()`:
   - Tính toán 5 thẻ KPI: Tổng Phải Thu, Tổng Phải Trả, Nợ Quá Hạn, Thu Trong Tháng, Dòng Tiền Thuần.
   - Render Lịch nhắc nợ hôm nay (Daily Action Center): Danh sách các hóa đơn quá hạn hoặc đến hạn trong vòng 3 ngày, kèm nút gọi `tel:` và nút copy tin nhắn Zalo kèm thông tin nợ và STK VietQR.
   - Render 8 biểu đồ Chart.js (Cashflow, Tỷ lệ AR/AP, Tuổi nợ, Top Khách nợ, Top NCC nợ, Tỷ lệ thu hồi, Cơ cấu phương thức, Dự báo 30 ngày) sử dụng `ChartInstances`.
2. `function renderTransactions()`:
   - Lọc dữ liệu theo tab: Tất cả / Thu tiền khách (`PTHU`) / Trả nợ NCC (`PTRA`).
   - Lọc theo ô tìm kiếm tức thì.
   - Hiển thị bảng Master-table trên Desktop (cột Mã TT mono, Loại giao dịch, Đối tác, Số tiền, Phương thức, Ngày TT, Thao tác in & xóa).
   - Hiển thị thẻ gọn trên Mobile (Table-to-Card transformation).
   - Xử lý mở Drawer thêm mới giao dịch với mã VietQR động theo STK cấu hình.
3. `function renderInvoices()`:
   - Sổ hóa đơn nợ (`HOAD-XXXXXX`).
   - Lọc: Tất cả / Còn nợ / Đã tất toán / Quá hạn.
   - Hiển thị tiến độ thanh toán (thanh progress bar phần trăm đã trả).
   - Nút hành động: "Đối Soát A4" mở modal `#statement-modal`, "Thu nợ nhanh" chuyển trực tiếp sang Drawer thanh toán, "Xóa" mở modal xác nhận màu đỏ.
4. `function renderPartners()`:
   - Quản lý danh bạ Khách hàng (`KHNG-XXXXXX`) và Nhà cung cấp (`NCCP-XXXXXX`).
   - Tính toán tổng dư nợ hiện tại và so khớp với `Hạn Mức Tín Dụng` để hiển thị cảnh báo đỏ khi vượt mức.
   - Nút gọi `tel:`, xem lịch sử hóa đơn, sửa thông tin qua Drawer.
5. `function renderCategories()`:
   - Quản lý nhóm hình thức thanh toán và loại đối tác.
   - Thêm/sửa danh mục trực tiếp.
6. `function renderSettings()`:
   - Điền sẵn form cấu hình: Tên doanh nghiệp, Địa chỉ, Hotline, Email, Ngân hàng, STK, Chủ tài khoản, Mẫu tin nhắn nhắc nợ.
   - Hiển thị trực quan thẻ VietQR mẫu test quét mã ngân hàng.
7. `function renderHelp()`:
   - Hướng dẫn 3 bước Onboarding chuẩn `AGENTS_MASTER.md`.
   - FAQ Accordion (bấm vào mở nội dung câu trả lời).
   - Nút bấm 1 chạm liên hệ hỗ trợ Zalo `FILE ĐI LÀM`.

### 5.3. Tiêu Chí Kiểm Thử DOM Node.js (Automated Node.js Test Verification)
Trước khi bàn giao, Worker phải chạy kịch bản kiểm thử Node.js đạt 100% các tiêu chí sau:
1. Parse cú pháp JavaScript không phát sinh bất kỳ lỗi `SyntaxError` nào.
2. `switchTab('tab-dashboard')` $\rightarrow$ KPI cập nhật đúng giá trị số, 8 chart instances được tạo trong `ChartInstances`.
3. `switchTab('tab-transactions')` $\rightarrow$ Danh sách giao dịch render đầy đủ cả table và mobile card.
4. `switchTab('tab-invoices')` $\rightarrow$ Danh sách hóa đơn render đầy đủ.
5. `switchTab('tab-partners')` $\rightarrow$ Danh bạ đối tác render đầy đủ.
6. `switchTab('tab-categories')` $\rightarrow$ Danh mục render đầy đủ.
7. `switchTab('tab-settings')` $\rightarrow$ Form cài đặt nhận đúng giá trị.
8. `switchTab('tab-help')` $\rightarrow$ Hướng dẫn sử dụng render đầy đủ.
9. Mở & đóng Drawer: Đảm bảo class `hidden` và `translate-y-full` được thêm/xóa chuẩn xác, không có phần tử nào bị lọt.
10. Mở & đóng Statement Modal: Kiểm tra thẻ `#statement-modal` chuyển đổi trạng thái `hidden` mượt mà.
