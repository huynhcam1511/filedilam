# MASTER AGENTS — HIẾN PHÁP & TIÊU CHUẨN PHÁT TRIỂN WEB APP GOOGLE APPS SCRIPT
> **Thương hiệu:** FILE ĐI LÀM (Workbook & Apps Script Web App Architecture)  
> **Phiên bản:** Master Standard V2.4 (Quy chuẩn Siêu Tốc: Parallel Subagents & Master Assembler Pipeline)  
> **Mục đích:** Quy chuẩn bất biến áp dụng cho TẤT CẢ các giải pháp Google Sheets + Google Apps Script Web App (Quản lý nhà trọ, CRM Bất động sản, Quản lý công nợ, Bán hàng, Quản lý kho, Quản lý tài sản, v.v.).

---

## 1. NGUYÊN TẮC QUẢN TRỊ & MÔ HÌNH 2 FILE VẬT LÝ (HARD LOCKS)

1. **Google Sheets là Database nền & Quy tắc "Chỉ 1 Tab Hiển Thị" (Single Visible Tab Policy)**:
   - **Chỉ hiển thị duy nhất 1 tab `HDSD`**: Khi người dùng mở Google Sheet, màn hình chỉ hiển thị duy nhất tab hướng dẫn sử dụng kèm nút bấm Mint mở Web App tại ô `B2:D3`.
   - **Khóa & Ẩn toàn bộ các tab Database (`DB_...`)**: Tất cả các tab chứa dữ liệu nguồn (`DB_TaiSan`, `DB_GiaoDich`, `DB_DanhMuc`, `DB_DoiTac`...) bắt buộc phải được **Khóa bảo vệ (Protect Sheet)** và **Ẩn đi (Hide Sheet)** tự động qua Apps Script.
   - **Định hướng người dùng thao tác 100% trên Web App**: Người mua tuyệt đối không thao tác gõ tay trực tiếp trên các dòng Excel/Sheets để tránh làm xáo trộn công thức hay sai lệch cấu trúc dữ liệu. Mọi hành vi Nhập liệu, Tra cứu, Sửa chữa, Xóa đều phải thông qua giao diện Web App.
   - Tuyệt đối CẤM hardcode dữ liệu nghiệp vụ trong code JS hay HTML.
   - CẤM xóa dữ liệu thật, giao dịch đã ghi sổ hoặc hóa đơn/phiếu đã phát hành.

2. **Quy chuẩn đặt tên File Google Sheet & File Code Local**:
   - **Tên File Google Sheet (Hiển thị cho khách)**:
     - Bắt buộc cấu trúc: `[TÊN SẢN PHẨM IN HOA CÓ DẤU] v[X.X] — FILE ĐI LÀM`
     - *Ví dụ*: `QUẢN LÝ TÀI SẢN & THIẾT BỊ DOANH NGHIỆP v1.0 — FILE ĐI LÀM`, `SỔ QUẢN LÝ CÔNG NỢ KHÁCH HÀNG & NCC v1.0 — FILE ĐI LÀM`
   - **Tên 2 File Code Vật Lý (Local)**:
     - `[TENDUAN]_Code.gs`: Backend logic, menu Sheet, routing `doGet()`, xử lý Sheets, bảo mật và RPC handlers.
     - `[TENDUAN]_Index.html`: File giao diện duy nhất (Monolithic SPA) tích hợp Tailwind CSS, Lucide Icons, Chart.js.

3. **Quy chuẩn Nút Launcher kích hoạt trên Google Sheet**:
   - **Menu thanh công cụ (`onOpen`)**: Tên menu `File Đi Làm` $\rightarrow$ Mục con duy nhất `Mở Ứng Dụng Quản Lý`.
   - **Nút bấm trực quan trên Sheet (Tab HDSD)**: Đặt tại ô `B2:D3` merge, nền xanh Mint `#059669`, chữ trắng in đậm: `MỞ ỨNG DỤNG WEB APP (BẤM VÀO ĐÂY)`.

4. **Quy trình làm việc nghiêm ngặt**:
   - `AUDIT → ROOT CAUSE → DESIGN IMPACT → IMPLEMENT TRÊN FILE LOCAL → TEST → BÀN GIAO`.
   - Tuyệt đối không báo tính năng "đã hoàn tất / đã chạy" khi chưa kiểm chứng thực tế.
   - Không fake success (không hiển thị toast thành công khi server chưa trả về kết quả hợp lệ).

---

## 2. CHUẨN THIẾT KẾ UI/UX FINTECH CAO CẤP (MINIMALIST & CLASSY)

1. **Bảng màu chủ đạo**:
   - Primary: Xanh ngọc Mint Emerald (`#059669` / `#10b981`), Mint nhạt nền hover (`#ecfdf5`).
   - Nền & Khung: Slate thanh lịch (`#f8fafc`, `#f1f5f9`, `#e2e8f0`), chữ đen xám sâu (`#0f172a`, `#334155`).
   - Nút chính (CTA): Nền Mint `#059669`, chữ trắng, bo góc `rounded-xl`, chiều cao chuẩn **46px** (`h-[46px]`), hover mượt mà.

2. **CẤM Emoji trẻ con & Iconography đồng bộ**:
   - Tuyệt đối không gắn emoji (⚡, ✨, 🔑, 🏠, 📞, ⏳, ⚠️, 🟢) vào nút bấm, tab, tiêu đề hay thông báo toast.
   - 100% sử dụng hệ thống vector icon **Lucide Icons** qua CDN (`lucide.createIcons()`), nét mảnh tinh tế (`stroke-width="1.75"` hoặc `2`).

3. **Triệt tiêu lậm Card & lậm Pill ("Anti-Pill & Anti-Card Overload")**:
   - Không bọc thông tin hiển nhiên vào các khối card nổi viền dày chiếm diện tích.
   - CẤM lạm dụng khung pill bo tròn (badge viên thuốc) cho các trường dữ liệu bình thường.
   - Trạng thái chỉ dùng chấm tròn nhỏ tinh tế (`•` bullet) kèm chữ phẳng màu tương ứng (VD: `<span class="text-emerald-600 font-medium text-xs">● Đang hoạt động</span>`).

4. **Quy chuẩn mã sản phẩm & định danh nghiệp vụ (ID / SKU)**:
   - Bắt buộc chuẩn: **Đúng 4 ký tự tiền tố nghiệp vụ + dấu gạch nối `-` + đúng 6 chữ số ngẫu nhiên**: `XXXX-YYYYYY`.
   - Ví dụ chuẩn mẫu cho các giải pháp:
     - Tài sản: `TSAN-839201`
     - Nhân sự: `NHAN-109284`
     - Phiếu bàn giao: `BGIA-582910`
     - Phiếu thu hồi: `THOI-394821`
     - Phiếu bảo trì: `BTRI-749102`
     - Khách hàng: `KHNG-839201`
     - Nhà cung cấp: `NCCP-109284`
     - Hóa đơn / Đơn nợ: `HOAD-582910`
   - CẤM sinh slug tiếng Việt cắt dấu lem nhem kèm timestamp miligiây dài dòng.
   - Mã ID là bất biến và hiển thị dạng text **Monospace** phẳng (`font-mono text-xs font-semibold text-slate-700`), không bọc khung pill.

5. **Quy chuẩn định dạng số liệu & thời gian**:
   - Ngày tháng thống nhất định dạng: `dd/mm/yyyy`.
   - Tiền tệ Việt Nam thống nhất phân cách hàng nghìn: `Intl.NumberFormat('vi-VN')` kèm đơn vị `đ` hoặc `VND`.

---

## 3. CẤU TRÚC PHÂN TẦNG THEO TẦN SUẤT SỬ DỤNG (FREQUENCY-BASED ARCHITECTURE)

Triệt tiêu tư duy "đẻ tab" tràn lan hoặc trùng lặp (Dashboard đã có sẵn KPI và biểu đồ thì KHÔNG tạo thêm tab Báo cáo riêng biệt). Mọi Web App phải được phân cấp theo **3 tầng chu kỳ sử dụng thực tế** gồm đúng **7 hạng mục chức năng**:

### 🟢 TẦNG 1: VẬN HÀNH THƯỜNG XUYÊN (HẰNG NGÀY / TUẦN / THÁNG — Tần suất 80%)
Đặt ở vị trí cao nhất trên thanh điều hướng:
1. **TỔNG QUAN & VIỆC HÔM NAY (Dashboard & Daily Actions)**:
   - **4 – 5 Thẻ KPI Cốt Lõi**: Tổng nguyên giá / Phải Thu / Phải Trả / Dòng tiền thuần / Cảnh báo đỏ.
   - **6 – 8 Biểu Đồ Trực Quan (Chart.js CDN)**: Lưới Desktop 2 cột (`grid grid-cols-1 lg:grid-cols-2 gap-6`).
   - **Khối Việc Cần Xử Lý Ngay (Daily Action Center)**: Nút gọi `tel:`, nút copy tin nhắn nhắc nợ kèm mã VietQR / hạn bảo dưỡng.
2. **GIAO DỊCH THƯỜNG XUYÊN (Transactions / Cấp Phát / Thu-Trả)**:
   - Nghiệp vụ diễn ra liên tục: Bàn giao (`BGIA`), Thu hồi (`THOI`), Thu tiền (`PTHU`), Trả nợ (`PTRA`).
   - Tự động cấn trừ trạng thái thiết bị / công nợ tức thì.

### 🟡 TẦNG 2: QUẢN LÝ BIẾN ĐỘNG ĐỊNH KỲ (LÂU LÂU MỚI LÀM KHI CÓ PHÁT SINH — Tần suất 15%)
Đặt ở phần giữa giao diện:
3. **SỔ THEO DÕI BẢO TRÌ & CHỨNG TỪ (Maintenance / Debt Records)**:
   - Quản lý phiếu bảo trì (`BTRI-XXXXXX`) hoặc hóa đơn nợ (`HOAD-XXXXXX`), trích xuất biên bản in chuẩn A4.
4. **DANH SÁCH THỰC THỂ / ĐỐI TÁC (Core Entities / Staff / Partners)**:
   - Quản lý Tài sản (`TSAN-XXXXXX`), Nhân sự (`NHAN-XXXXXX`), Khách hàng (`KHNG-XXXXXX`), NCC (`NCCP-XXXXXX`).
   - Master-Table tràn viền trên Desktop và Thẻ phẳng gọn trên Mobile (Table-to-Card).

### ⚪ TẦNG 3: CẤU HÌNH & HỖ TRỢ (SETUP 1-2 LẦN BAN ĐẦU / HIẾM KHI SỬA — Tần suất 5%)
Gom về cuối cùng của hệ thống:
5. **DANH MỤC & BẢNG GIÁ (Master Catalogs & Pricing)**:
   - Setup ban đầu: Nhóm tài sản, phòng ban, nhóm đối tác lưu tại tab `DB_DanhMuc`.
6. **CÀI ĐẶT HỆ THỐNG & CƠ SỞ (System Settings)**:
   - Tên cơ sở/doanh nghiệp, Hotline liên hệ, mẫu in biên bản bàn giao A4.
7. **HƯỚNG DẪN SỬ DỤNG & TRỢ GIÚP (User Guide & Onboarding)**:
   - **Quy trình 3 bước Onboarding**: Bước 1 Khai báo danh mục/nhân sự $\rightarrow$ Bước 2 Nhập kho thiết bị $\rightarrow$ Bước 3 Bàn giao theo dõi.
   - Accordion FAQ + Kênh hỗ trợ Zalo 1 chạm của FILE ĐI LÀM.

---

## 4. PHÂN ĐỊNH 2 TRẢI NGHIỆM ĐỘC LẬP: DESKTOP VS MOBILE VIEW

1. **Giao diện Desktop (Laptop / Màn hình lớn)**:
   - **Sidebar bên trái cố định (240px)** có nút Hamburger thu gọn về Icon-only (~64px). Hiển thị 3 cụm menu có tiêu đề nhỏ (`VẬN HÀNH`, `QUẢN LÝ`, `HỆ THỐNG`).
   - **Bảng Master-Table phẳng tràn viền (Edge-to-Edge Full Bleed)**: Cố định tiêu đề (`Freeze Header`), không dùng đường kẻ dọc cột Excel thô kệch, hover hàng nhẹ nhàng (`hover:bg-slate-50`), menu 3 chấm (`MoreVertical`) ở cột ngoài cùng bên phải (tiêu đề `<th>` để rỗng).
   - **Form Nhập liệu / Chi tiết dùng Right Drawer**: Trượt êm từ cạnh phải màn hình (Right Slide-over Drawer, độ rộng 450px – 520px), phủ overlay mờ phía sau.

2. **Giao diện Mobile (Điện thoại thông minh / Hiện trường)**:
   - **Chuyển bảng thành thẻ gọn (Table-to-Card Transformation)**: Tuyệt đối CẤM bắt người dùng vuốt ngang màn hình tìm cột. Bảng tự động gom thành danh sách thẻ phẳng.
   - **Thanh điều hướng đáy (Bottom Navigation Dock)**: Ghim thanh dock đúng **4 icon chính** (Tổng quan, Giao dịch/Cấp phát, Quản lý/Tài sản, Hệ thống).
   - **Nút hành động nổi (Floating Action Button - FAB)**: Nút `+ Thêm Mới` tròn nổi màu Mint xanh ở góc dưới bên phải (`fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg`) để thao tác 1 chạm bằng 1 tay.
   - **Form nhập liệu Bottom Sheet**: Trượt êm từ đáy màn hình lên, phủ nửa hoặc 85% màn hình. Tự bật bàn phím số (`inputmode="numeric"` hoặc `inputmode="tel"`).

3. **Tính đồng nhất Form & Thông báo**:
   - Nhãn rõ ràng kèm đánh dấu bắt buộc: `<label class="block text-xs font-semibold text-slate-700 mb-1.5">Tên trường <span class="text-rose-500">*</span></label>`.
   - Ô input cao 42px – 46px, bo góc `rounded-lg`, focus viền Mint.
   - **Tuyệt đối CẤM `alert()` / `confirm()` mặc định**: 100% dùng Toast Notification 3s và Custom Confirmation Modal màu đỏ.

---

## 5. QUY CHUẨN GOOGLE APPS SCRIPT & TRẢI NGHIỆM LINK /COPY

1. **Khởi tạo Menu Sheet tự động**:
   ```javascript
   function onOpen() {
     SpreadsheetApp.getUi()
       .createMenu('File Đi Làm')
       .addItem('Mở Ứng Dụng Quản Lý', 'openWebApp')
       .addSeparator()
       .addItem('Khóa & Ẩn Database (Bảo vệ dữ liệu)', 'lockAndHideDatabaseSheets')
       .addToUi();
   }
   
   function openWebApp() {
     var html = HtmlService.createHtmlOutput(
       '<script>window.open("' + WEB_APP_URL + '", "_blank");google.script.host.close();</script>'
     ).setWidth(300).setHeight(80);
     SpreadsheetApp.getUi().showModalDialog(html, 'Đang mở ứng dụng...');
   }

   /**
    * QUY TẮC SINGLE VISIBLE TAB: Khóa và Ẩn toàn bộ tab DB_, chỉ để lại tab HDSD hiển thị
    */
   function lockAndHideDatabaseSheets() {
     var ss = SpreadsheetApp.getActiveSpreadsheet();
     var sheets = ss.getSheets();
     sheets.forEach(function(sh) {
       var name = sh.getName();
       if (name.indexOf('DB_') === 0) {
         sh.hideSheet(); // Ẩn tab DB_
         var protection = sh.protect().setDescription('Khóa bảo vệ Database FILE ĐI LÀM');
         protection.setWarningOnly(true);
       } else if (name === 'HDSD') {
         sh.showSheet(); // Luôn hiển thị duy nhất tab HDSD
         ss.setActiveSheet(sh);
       }
     });
   }
   ```
2. **Ghim hằng số `WEB_APP_URL`**: Cố định URL Web App đã deploy ở đầu file script.
3. **ID bảng tính luôn động**: Luôn dùng `SpreadsheetApp.getActiveSpreadsheet().getId()`.
4. **Cơ chế khóa ghi đồng thời (`LockService`)**: Tất cả hàm thêm, sửa, xóa bắt buộc bọc trong `LockService.getScriptLock()` (waitLock 15s).
5. **Gom dữ liệu 1 chạm (`getInitialData()`)**: Gom toàn bộ database về một Object JSON duy nhất trong 1 lần gọi RPC ban đầu.

---

## 6. QUY TRÌNH PHÁT TRIỂN SIÊU TỐC: PARALLEL SUBAGENTS & MASTER ASSEMBLER (MAP-REDUCE PIPELINE)

Để tối ưu hóa tốc độ làm việc (rút ngắn thời gian từ hàng chục phút xuống còn **3 – 5 phút**) mà vẫn triệt tiêu hoàn toàn lỗi tràn token hoặc code vắn tắt, hệ thống áp dụng **Mô hình Chạy song song hàng loạt Subagents (Fan-Out) $\rightarrow$ Subagent cuối gom vào 2 file vật lý (Fan-In / Assembler)**:

```
┌────────────────────────────────────────────────────────────────────────┐
│ BƯỚC 0: KHÓA HỢP ĐỒNG DỮ LIỆU ĐẦU TIÊN (CONTRACT-FIRST LOCKING)        │
│ • Master Agent chốt Schema các tab DB_, danh sách hàm RPC Backend.     │
│ • Chốt cấu trúc Store: AppState = { data: {...}, currentTab: ... }    │
├────────────────────────────────────────────────────────────────────────┤
│ BƯỚC 1: BẮN ĐỒNG THỜI HÀNG LOẠT SUBAGENTS (PARALLEL FAN-OUT)           │
│ Các Subagents chạy song song độc lập, mỗi agent xuất ra 1 file tạm:    │
│ 1. Subagent Backend    → Xuất: _part_backend.gs                        │
│ 2. Subagent Shell      → Xuất: _part_shell.html (Layout, Dock, Router) │
│ 3. Subagent Module 1   → Xuất: _part_mod1.html (Dashboard 4 KPI + 6 C) │
│ 4. Subagent Module 2   → Xuất: _part_mod2.html (Giao dịch, Drawer Form)│
│ 5. Subagent Module 3+4 → Xuất: _part_mod3_4.html (Bảo trì, MasterTable)│
│ 6. Subagent Module 567 → Xuất: _part_mod5_6_7.html (Danh mục, Help FAQ)│
│                                                                        │
│ * QUY TẮC CỐT LÕI TRÁNH XUNG ĐỘT KHI CHẠY SONG SONG:                   │
│ • Mỗi module đóng gói trong 1 Object: const ModuleXYZ = { render()... }│
│ • Mọi ID DOM bắt buộc có tiền tố module: #dash-..., #tx-..., #core-... │
├────────────────────────────────────────────────────────────────────────┤
│ BƯỚC 2: SUBAGENT CUỐI GOM VÀ ĐẤU NỐI (THE MASTER ASSEMBLER - FAN-IN)   │
│ • Đọc tất cả các file _part_* đã sinh ra trong workspace.              │
│ • Ghép chuẩn xác vào đúng 2 File vật lý duy nhất:                      │
│   1. [TENDUAN]_Code.gs  ← Ráp từ _part_backend.gs                      │
│   2. [TENDUAN]_Index.html ← Ráp các part HTML vào đúng các Slot Marker │
│ • Tự động dọn dẹp (xóa) các file tạm _part_*.                          │
├────────────────────────────────────────────────────────────────────────┤
│ BƯỚC 3: KIỂM THỬ TỔNG THỂ & BÀN GIAO (INTEGRATION TEST)                │
│ • Kiểm tra tính toàn vẹn sự kiện JS, không lỗi Console.                │
│ • Rà soát Checklist 10 điểm và cấp link triển khai /copy.              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 7. BỘ THƯ VIỆN CDN CHUẨN TRONG `[TENDUAN]_Index.html`

1. **Tailwind CSS CDN**: `<script src="https://cdn.tailwindcss.com"></script>`
2. **Lucide Icons CDN**: `<script src="https://unpkg.com/lucide@latest"></script>`
3. **Chart.js CDN**: `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>`

---

## 8. DANH MỤC KIỂM TRA TRƯỚC KHI BÀN GIAO (CHECKLIST 10 ĐIỂM)

- [ ] 1. Tên file local đúng chuẩn: `[TENDUAN]_Code.gs` và `[TENDUAN]_Index.html`.
- [ ] 2. Tên file Google Sheet chuẩn: `[TÊN SẢN PHẨM IN HOA CÓ DẤU] v[X.X] — FILE ĐI LÀM`.
- [ ] 3. Chuẩn **Single Visible Tab**: Chỉ hiển thị duy nhất tab `HDSD` (kèm nút Mint ô `B2:D3` và Menu `File Đi Làm`), toàn bộ tab `DB_...` đã được KHÓA và ẨN đi.
- [ ] 4. Không chứa bất kỳ emoji trẻ con nào trên giao diện hoặc thông báo.
- [ ] 5. Cấu trúc chuẩn **3 Tầng tần suất (7 Hạng mục)** và thực hiện chuẩn theo **Mô hình Parallel Subagents & Master Assembler**.
- [ ] 6. Dashboard chuẩn: **4–5 thẻ KPI** và **6–8 biểu đồ trực quan** (Grid 2 cột Desktop).
- [ ] 7. Desktop hiển thị bảng tràn viền + Right Drawer; Mobile hiển thị Card + Bottom Sheet + FAB.
- [ ] 8. Mã định danh đúng chuẩn: **Đúng 4 ký tự tiền tố + 6 số ngẫu nhiên** (`XXXX-YYYYYY`), font monospace phẳng, không bọc pill.
- [ ] 9. Tất cả thao tác lưu/xóa đều bọc `LockService` trong Apps Script.
- [ ] 10. Nút gọi điện thoại trên mobile đều gắn link `tel:`; ô số tiền/SĐT có `inputmode="numeric"`.