# BÁO CÁO BÀN GIAO KỸ THUẬT (HANDOFF REPORT) — EXPLORER 1
## KHẢO SÁT & BẢN THIẾT KẾ KỸ THUẬT: EDGE-TO-EDGE CANVAS & CALENDAR SYNC UX
**Dự án:** QUẢN LÝ CÔNG VIỆC TEAM & TIẾN ĐỘ DỰ ÁN 3.0 — FILE ĐI LÀM  
**Tệp mục tiêu:** `PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html`  
**Tệp Backend liên quan:** `PROJECTS_WEBAPPS/QuanLyCongViecTeam_Code.gs`  
**Tác giả:** Explorer 1 (`explorer_1`)  
**Người nhận:** Teamwork Orchestrator (`013619e0-3ed3-491c-9953-d4b3fc27933e`) & Implementer Worker  
**Thời gian:** 2026-11-12T13:40:00Z  

---

## 1. OBSERVATION (QUAN SÁT THỰC NGHIỆM TRỰC TIẾP)

### A. Nhiệm vụ 1: Edge-to-Edge Canvas (100% Full Width Không Giới Hạn Chiều Rộng)
1. **Nút thắt thắt cổ chai trực tiếp tại dòng 312 của `PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html`**:
   - Dòng 312:
     ```html
     <!-- CONTENT PANELS CONTAINER (Chứa 7 Tab Chức Năng Cốt Lõi) -->
     <div id="main-content" class="p-4 lg:p-8 flex-1 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
     ```
   - **Phân tích thuộc tính gây lỗi hiển thị**:
     - `max-w-7xl`: Ép toàn bộ giao diện làm việc của ứng dụng vào chiều rộng tối đa 80rem (1280px). Trên các màn hình máy tính phổ biến (Full HD 1920x1080, 2K 2560x1440, hoặc Ultrawide), giao diện bị bóp nghẽn ở giữa, tạo ra 2 khoảng trống xám vô ích khổng lồ ở hai bên lề trái và phải.
     - `mx-auto`: Căn giữa container 1280px, biến nội dung thành "hòn đảo" tách rời khỏi cấu trúc tràn viền của Topbar Header và Sidebar.
     - `p-4 lg:p-8`: Áp dụng padding 16px/32px cho cả 4 phía (`top`, `bottom`, `left`, `right`), nhưng bị xung đột/ghi đè một phần bởi `pb-24 lg:pb-12` ở đuôi class list.
   - **Khảo sát toàn bộ 29 lần xuất hiện khác của `max-w` và `mx-auto` trong tệp**:
     - *Hộp thoại Modal & Toast*:
       * Dòng 114 (`#confirm-modal-container`): `max-w-sm w-full` (chuẩn hộp thoại xác nhận).
       * Dòng 4132 (`#matrix-add-modal`): `max-w-md w-full` (chuẩn modal thêm hàng).
       * Dòng 4192 (`#rout-delete-modal`): `max-w-sm w-full` (chuẩn modal xóa).
       * Dòng 8141 (Toast notification): `max-w-sm` (chuẩn thông báo góc phải).
     - *Popover & Tooltip*:
       * Dòng 2037 (`#gantt-task-popover`): `max-w-sm w-full` (chuẩn tooltip chi tiết tác vụ Gantt).
     - *Ngắt dòng văn bản (Text Truncation) trong ô bảng*:
       * Dòng 2051 (`max-w-[190px]`), dòng 2738 (`max-w-[200px]`), dòng 2749 (`max-w-[120px]`), dòng 2858 (`max-w-[100px]`), dòng 4895 (`max-w-xs`), dòng 6551 (`max-w-[180px]`): Đây là các giới hạn chiều rộng vi mô cần thiết để class `truncate` hoạt động trên span văn bản, tránh làm vỡ cột bảng.
     - *Khối Empty State tập trung giữa màn hình*:
       * Dòng 448, 812, 1912, 1916, 1929, 2027, 2964, 3925, 4012, 4193, 5681, 5685, 5796, 5800: Sử dụng `mx-auto` và `max-w-sm` để căn giữa biểu tượng và đoạn văn thông báo khi dữ liệu rỗng.
     - *Tab Help Hero & Support*:
       * Dòng 5818: `max-w-3xl` (khối giới thiệu hero) và dòng 6025: `max-w-xl` (khối hỗ trợ). Thuộc phạm vi đại tu của Tab HDSD.
   - **Khảo sát cấu trúc vùng chứa của các Tab con bên trong `#main-content`**:
     - `tab-dashboard` (dòng 319-1774): Dải KPI dùng `grid grid-cols-2 lg:grid-cols-5`, Việc cần xử lý dùng `border-y border-slate-100`, Lưới 6 biểu đồ Chart.js dùng `grid grid-cols-1 lg:grid-cols-2 gap-6`. **Không có bất kỳ thẻ nào bị giới hạn max-width**.
     - `tab-tasks` (dòng 1775-1946): Bảng Master-Table desktop (dòng 1886-1919) bọc trong `<div class="overflow-x-auto max-h-[680px]"><table class="w-full text-left border-collapse">`.
     - `tab-gantt` (dòng 1947-2032): Dòng 2018-2023 dùng `<div id="gantt-grid-wrapper" class="overflow-x-auto min-h-[460px]"><div id="gantt-grid-container" class="min-w-[1250px] select-none">`.
     - `tab-routines` (dòng 3763-4220): Bảng Ma trận Checklist tuần (dòng 3895) bọc trong `<table class="w-full text-left border-collapse text-sm min-w-[860px]">`.
     - `tab-team` (dòng 5583-5695): Bọc trong `<div id="team-staff-grid" class="w-full">` và sinh bảng `<table class="w-full text-left border-collapse">` (dòng 6646).
     - `tab-projects` (dòng 5699-5809): Bọc trong `<div id="proj-cards-grid" class="w-full">` và sinh bảng `<table class="w-full text-left border-collapse">` (dòng 6896).
   - **Căn lề ngang với Top Header Bar**:
     - Dòng 264 (Header): `<header class="h-16 px-4 lg:px-8 border-b border-slate-200/80 bg-white/95 ...">`.
     - Header sử dụng padding ngang chuẩn `px-4 lg:px-8`.

---

### B. Nhiệm vụ 2: Trải nghiệm nút "Đồng Bộ Calendar" (Calendar Sync Button UX)
1. **Khảo sát cấu trúc Sidebar Desktop (`desktop-sidebar`, dòng 170-258)**:
   - Dòng 230-243:
     ```html
     <!-- CỤM 3: TẦNG 3 - HỆ THỐNG & CÔNG CỤ (5%) -->
     <div>
       <div class="px-3 mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase sidebar-text">Hệ Thống</div>
       <div class="space-y-1">
         <button onclick="App.syncGoogleCalendar()" class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition text-slate-600 hover:bg-slate-50 hover:text-emerald-700" title="Đồng bộ deadline ra Google Calendar">
           <i id="btn-sync-cal-icon" data-lucide="calendar" class="w-4 h-4 shrink-0 text-emerald-600"></i>
           <span class="sidebar-text truncate">Đồng Bộ Calendar</span>
         </button>
         <button onclick="App.switchTab('help')" id="nav-help" class="nav-item w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition text-slate-600 hover:bg-slate-50">
           <i data-lucide="help-circle" class="w-4 h-4 shrink-0"></i>
           <span class="sidebar-text truncate">Hướng Dẫn & FAQ</span>
         </button>
       </div>
     </div>
     ```
   - **Các nhược điểm UX phát hiện**:
     - *Trộn lẫn Hành động tác vụ (Action) với Điều hướng trang (Navigation Tab)*: "Đồng Bộ Calendar" là một tác vụ gọi RPC ngầm (`syncDeadlinesToGoogleCalendar`), nhưng lại được xếp chung một khối `space-y-1` với tab "Hướng Dẫn & FAQ" (`nav-help`).
     - *Giao diện bị nhầm lẫn với Nav Tab*: Nút có cấu trúc class `px-3 py-2 rounded-xl text-xs font-semibold transition text-slate-600 hover:bg-slate-50`, trông y hệt các nút tab khác trong sidebar. Người dùng dễ lầm tưởng đây là một trang quản lý lịch và kỳ vọng chuyển tab khi nhấp chuột.
     - *Icon không phù hợp cho thao tác xoay (Spin Animation)*: Nút sử dụng `data-lucide="calendar"` (hình cuốn lịch vuông vắn có còng và ô lưới). Khi gọi `App.syncGoogleCalendar()`, icon bị gắn class `animate-spin-fast` khiến khối hình chữ nhật xoay tít lảo đảo quanh tâm, gây méo mó thị giác và thiếu tính chuyên nghiệp của chuẩn Fintech.
     - *Icon đồng bộ trên Header bị lệch pha*: Dòng 290 có nút tắt đồng bộ Calendar trên Topbar:
       ```html
       <button onclick="App.syncGoogleCalendar()" class="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition" title="Đồng bộ Google Calendar">
         <i data-lucide="calendar" class="w-4 h-4"></i>
       </button>
       ```
       Icon này không có `id` nên khi nhấn đồng bộ, chỉ icon ở sidebar xoay, còn icon trên header đứng yên.
     - *Trạng thái bấm nút thiếu khóa bảo vệ*: Trong quá trình gọi RPC ngầm, nút không bị khóa `disabled` và không có class `pointer-events-none cursor-not-allowed`, cho phép người dùng click liên tục nhiều lần (spam RPC).

2. **Khảo sát cơ chế JavaScript `App.syncGoogleCalendar()` (dòng 8371-8404)**:
   - Dòng 8371:
     ```javascript
     syncGoogleCalendar() {
       const calIcon = document.getElementById('btn-sync-cal-icon');
       if (calIcon) calIcon.classList.add('animate-spin-fast');

       const topBar = document.getElementById('top-loading-bar');
       if (topBar) topBar.classList.remove('-translate-y-full');

       if (typeof google !== 'undefined' && google.script && google.script.run) {
         google.script.run
           .withSuccessHandler(res => {
             if (calIcon) calIcon.classList.remove('animate-spin-fast');
             if (topBar) topBar.classList.add('-translate-y-full');
             if (res && res.success) {
               this.toast('Đồng bộ Calendar thành công', `Đã đồng bộ ${res.count || 0} deadline vào Google Calendar.`);
             } else {
               this.toast('Thông báo Calendar', res.message || 'Hoàn tất đồng bộ.');
             }
           })
           .withFailureHandler(err => {
             if (calIcon) calIcon.classList.remove('animate-spin-fast');
             if (topBar) topBar.classList.add('-translate-y-full');
             this.toast('Lỗi đồng bộ Calendar', err.toString(), 'error');
           })
           .syncDeadlinesToGoogleCalendar();
       } else {
         // Local fallback simulation
         setTimeout(() => {
           if (calIcon) calIcon.classList.remove('animate-spin-fast');
           if (topBar) topBar.classList.add('-translate-y-full');
           this.toast('Chế độ Local Standalone', 'Đã mô phỏng đồng bộ Calendar thành công.');
         }, 800);
       }
     }
     ```
   - **Tên hàm RPC**: Tên hàm thực tế trong JS là `syncGoogleCalendar()`. Trong tài liệu yêu cầu có lúc nhắc tới `App.syncCalendar()`. Hiện chưa có alias `syncCalendar()`.
   - **Hợp đồng Backend**: Tệp `PROJECTS_WEBAPPS/QuanLyCongViecTeam_Code.gs` dòng 1056 có hàm:
     `function syncDeadlinesToGoogleCalendar()`
     Trả về Object: `{ success: true, count: syncCount, message: ... }`. Hợp đồng RPC hoàn toàn khớp và hoạt động tốt.

---

## 2. LOGIC CHAIN (CHUỖI SUY LUẬN KỸ THUẬT)

1. Từ **Observation A1**, toàn bộ các module dữ liệu chính (Dashboard 6 biểu đồ, Bảng Công việc, Ma trận Gantt Timeline, Ma trận Kỷ luật Checklist tuần, Danh bạ Nhân sự và Dự án) đều dùng các class co giãn tự nhiên `w-full`, `overflow-x-auto`, `grid-cols-1 lg:grid-cols-2`. Điểm nghẽn duy nhất làm co cụm giao diện vào giữa màn hình chính là dòng 312: `max-w-7xl mx-auto`.
2. Do đó, việc thay thế dòng 312 bằng:
   `<div id="main-content" class="w-full px-4 lg:px-8 py-6 flex-1 pb-24 lg:pb-12">`
   sẽ giải phóng 100% không gian hiển thị, giúp tất cả các bảng dữ liệu Master-Table và Gantt Timeline mở rộng tối đa ra toàn bộ bề ngang màn hình, đồng thời căn chỉnh lề ngang `px-4 lg:px-8` khớp chuẩn từng pixel với Top Header Bar (`h-16 px-4 lg:px-8`).
3. Từ **Observation B1 & B2**, để triệt tiêu sự nhầm lẫn giữa Nút Điều Hướng (Nav Tab) và Nút Hành Động (Action):
   - Cần đưa nút "Đồng Bộ Calendar" ra khỏi danh sách `<nav>` của `Cụm 3 (Hệ Thống)`.
   - Đặt nút vào một **Khối Tác Vụ Riêng Biệt (Dedicated Action Block)** được ghim phía trên Footer thông tin phiên bản của Sidebar (`border-t border-slate-100 p-3`).
   - Tạo kiểu dáng phẳng sang trọng chuẩn Fintech: Khung viền mỏng `border border-emerald-200/80`, nền xanh Mint nhạt `bg-emerald-50/70 hover:bg-emerald-100`, có icon box riêng biệt chứa biểu tượng `refresh-cw` tròn trịa, tiêu đề in đậm kèm chú thích phụ và huy hiệu `Sync`.
   - Khi thu gọn Sidebar về 64px (`w-16`), nhờ class `.sidebar-text`, các phần text tự động ẩn đi, chỉ để lại hộp icon Mint tinh tế căn giữa, giữ nguyên tooltip `title`.
   - Trong JS: Nâng cấp `syncGoogleCalendar()` để khóa nút `disabled`, đổi nhãn trạng thái khi đang đồng bộ, xoay icon `refresh-cw` tròn trịa mượt mà, và bổ sung alias `syncCalendar() { return this.syncGoogleCalendar(); }` để đảm bảo tương thích 100%.

---

## 3. CAVEATS (GIỚI HẠN & ĐIỀU KIỆN BIÊN)

1. **Phạm vi Explorer 1**: Explorer 1 chỉ thực hiện khảo sát chuyên sâu, chứng minh bằng chứng thực nghiệm và lập bản thiết kế kỹ thuật. Explorer 1 **KHÔNG chỉnh sửa tệp nguồn** `PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html` hay `QuanLyCongViecTeam_Code.gs`.
2. **Tab HDSD (Tab-help)**: Khối `max-w-3xl` tại dòng 5818 và `max-w-xl` tại dòng 6025 thuộc tab "Hướng Dẫn & FAQ". Tab này đang được bàn giao cho Explorer 2 khảo sát cấu trúc đại tu toàn diện (Task 3).
3. **Môi trường Web App Google Apps Script**: Khi nhúng vào iframe Google Apps Script (`/exec`), chiều cao màn hình có thể thay đổi tùy thuộc thanh banner của Google. Việc giữ vững `min-h-screen`, `flex-1`, và `pb-24 lg:pb-12` là điều kiện bắt buộc để bảo đảm nội dung không bị che khuất bởi Mobile Bottom Dock hay thanh cuộn.

---

## 4. CONCLUSION (KẾT LUẬN & BẢN THIẾT KẾ CHI TIẾT CHO WORKER)

### Giải Pháp Kỹ Thuật 1: Tràn Viền Edge-to-Edge Canvas 100%
**Vị trí sửa:** Dòng 312 tệp `PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html`

```html
<!-- BEFORE (Dòng 312): -->
<div id="main-content" class="p-4 lg:p-8 flex-1 max-w-7xl w-full mx-auto pb-24 lg:pb-12">

<!-- AFTER: -->
<div id="main-content" class="w-full px-4 lg:px-8 py-6 flex-1 pb-24 lg:pb-12">
```

**Hiệu ứng đạt được:**
- Xóa bỏ hoàn toàn `max-w-7xl` và `mx-auto`.
- Viewport mở rộng 100% tràn viền không lề xám thừa thãi.
- Lề ngang `px-4 lg:px-8` đồng bộ hoàn hảo với Header `px-4 lg:px-8`.
- Khoảng cách trên `py-6` (24px) thanh lịch và giữ nguyên khoảng đệm đáy `pb-24 lg:pb-12`.

---

### Giải Pháp Kỹ Thuật 2: Tái Thiết Kế Nút "Đồng Bộ Calendar" Tại Sidebar Desktop
**Vị trí sửa:** Dòng 229-243 và dòng 244-246 trong `desktop-sidebar`.

#### Bước 2.1: Chuẩn hóa lại Cụm 3 (Hệ Thống) trong `<nav>` — Chỉ giữ lại Tab Hướng Dẫn
```html
<!-- CỤM 3: TẦNG 3 - HỆ THỐNG & CÔNG CỤ (5%) -->
<div>
  <div class="px-3 mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase sidebar-text">Hệ Thống</div>
  <div class="space-y-1">
    <button onclick="App.switchTab('help')" id="nav-help" class="nav-item w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition text-slate-600 hover:bg-slate-50">
      <i data-lucide="help-circle" class="w-4 h-4 shrink-0"></i>
      <span class="sidebar-text truncate">Hướng Dẫn & FAQ</span>
    </button>
  </div>
</div>
```

#### Bước 2.2: Thêm Khối Action Riêng Biệt (Dedicated Action Block) nằm giữa `<nav>` và Footer Sidebar
```html
<!-- DEDICATED ACTION BLOCK: GOOGLE CALENDAR SYNC -->
<div class="p-3 border-t border-slate-100 shrink-0">
  <button 
    id="btn-sync-calendar" 
    onclick="App.syncGoogleCalendar()" 
    type="button"
    class="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/70 text-emerald-800 transition-all duration-200 group shadow-2xs active:scale-[0.98]" 
    title="Đồng bộ deadline ra Google Calendar"
  >
    <div class="flex items-center gap-2.5 min-w-0">
      <div class="w-7 h-7 rounded-lg bg-white border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs group-hover:border-emerald-300">
        <i id="btn-sync-cal-icon" data-lucide="refresh-cw" class="w-3.5 h-3.5 text-emerald-600 transition-transform"></i>
      </div>
      <div class="sidebar-text text-left min-w-0">
        <span id="btn-sync-cal-label" class="block truncate font-bold text-[11px] leading-tight text-emerald-900">Đồng Bộ Calendar</span>
        <span class="block truncate text-[10px] text-emerald-600 font-normal">Ghi nhận deadline</span>
      </div>
    </div>
    <span class="sidebar-text text-[9px] text-emerald-700 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">Sync</span>
  </button>
</div>
```

#### Bước 2.3: Đồng bộ Nút Tắt trên Topbar Header (Dòng 290)
```html
<!-- Calendar Sync Shortcut Trên Header Topbar -->
<button onclick="App.syncGoogleCalendar()" class="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition" title="Đồng bộ Google Calendar">
  <i id="btn-sync-cal-header-icon" data-lucide="refresh-cw" class="w-4 h-4"></i>
</button>
```

#### Bước 2.4: Nâng cấp Hàm `syncGoogleCalendar()` và bổ sung alias `syncCalendar()` trong JavaScript
Tại đối tượng `App` (khoảng dòng 8370):

```javascript
// Alias hỗ trợ cả 2 tên gọi
syncCalendar() {
  return this.syncGoogleCalendar();
},

// 9. Đồng bộ Deadline ra Google Calendar
syncGoogleCalendar() {
  const syncBtn = document.getElementById('btn-sync-calendar');
  const calIcon = document.getElementById('btn-sync-cal-icon');
  const headerIcon = document.getElementById('btn-sync-cal-header-icon');
  const calLabel = document.getElementById('btn-sync-cal-label');
  const topBar = document.getElementById('top-loading-bar');

  // Kích hoạt trạng thái Loading
  if (syncBtn) {
    syncBtn.disabled = true;
    syncBtn.classList.add('opacity-70', 'cursor-not-allowed', 'pointer-events-none');
  }
  if (calIcon) calIcon.classList.add('animate-spin-fast');
  if (headerIcon) headerIcon.classList.add('animate-spin-fast');
  if (calLabel) calLabel.innerText = 'Đang đồng bộ...';
  if (topBar) topBar.classList.remove('-translate-y-full');

  const finalizeUI = () => {
    if (syncBtn) {
      syncBtn.disabled = false;
      syncBtn.classList.remove('opacity-70', 'cursor-not-allowed', 'pointer-events-none');
    }
    if (calIcon) calIcon.classList.remove('animate-spin-fast');
    if (headerIcon) headerIcon.classList.remove('animate-spin-fast');
    if (calLabel) calLabel.innerText = 'Đồng Bộ Calendar';
    if (topBar) topBar.classList.add('-translate-y-full');
  };

  if (typeof google !== 'undefined' && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler(res => {
        finalizeUI();
        if (res && res.success) {
          this.toast('Đồng bộ Calendar thành công', `Đã đồng bộ ${res.count || 0} deadline vào Google Calendar.`);
        } else {
          this.toast('Thông báo Calendar', res.message || 'Hoàn tất đồng bộ.');
        }
      })
      .withFailureHandler(err => {
        finalizeUI();
        this.toast('Lỗi đồng bộ Calendar', err.toString(), 'error');
      })
      .syncDeadlinesToGoogleCalendar();
  } else {
    // Local fallback simulation
    setTimeout(() => {
      finalizeUI();
      this.toast('Chế độ Local Standalone', 'Đã mô phỏng đồng bộ Calendar thành công.');
    }, 800);
  }
},
```

---

## 5. VERIFICATION METHOD (PHƯƠNG PHÁP KIỂM TRA ĐỘC LẬP)

Sau khi Implementer hoàn tất các chỉnh sửa, tiến hành kiểm tra bằng các bước sau:

1. **Kiểm tra loại bỏ giới hạn chiều rộng container**:
   ```powershell
   powershell -Command "Select-String -Path 'PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html' -Pattern 'id=\x22main-content\x22' | Select-Object LineNumber, Line"
   ```
   *Điều kiện ĐẠT:* Dòng chứa `id="main-content"` phải có class `w-full px-4 lg:px-8 py-6` và **hoàn toàn không chứa `max-w-7xl` hoặc `mx-auto`**.

2. **Kiểm tra cấu trúc nút Calendar Sync**:
   ```powershell
   powershell -Command "Select-String -Path 'PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html' -Pattern 'btn-sync-calendar|btn-sync-cal-icon|refresh-cw' | Select-Object LineNumber, Line"
   ```
   *Điều kiện ĐẠT:* Nút `btn-sync-calendar` nằm trong khối `border-t border-slate-100` riêng biệt, sử dụng icon `refresh-cw`.

3. **Kiểm tra cú pháp JavaScript & Runtime với Node.js**:
   ```powershell
   node -e "
     const fs = require('fs');
     const html = fs.readFileSync('PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html', 'utf8');
     const scripts = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi)];
     scripts.forEach((s, i) => {
       new Function(s[1]);
       console.log('Script block ' + i + ': Syntax OK (len ' + s[1].length + ')');
     });
   "
   ```
   *Điều kiện ĐẠT:* Không có bất kỳ lỗi cú pháp nào (`SyntaxError`).

4. **Điều kiện phán quyết vi phạm (Invalidation Conditions)**:
   - Nếu `#main-content` vẫn còn `max-w-7xl` hoặc `mx-auto` $\rightarrow$ **FAIL**.
   - Nếu nút Đồng Bộ Calendar vẫn nằm chung hàng với `nav-help` trong `<nav>` $\rightarrow$ **FAIL**.
   - Nếu icon quay khi bấm đồng bộ vẫn là `calendar` thay vì `refresh-cw` $\rightarrow$ **FAIL**.
   - Nếu bấm liên tục nút Đồng Bộ Calendar mà nút không bị khóa `disabled` trong lúc RPC chạy $\rightarrow$ **FAIL**.
