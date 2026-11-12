# Original User Request

## Parameters

[skip-interview]
How this run was launched; not part of the task.

## Request — 2026-11-11T18:55:00Z

Execute the approved refactoring plan PLAN_FLAT_CANVAS_REFACTOR.md (C:\Users\zit\.gemini\antigravity\brain\a6c9a7f7-5965-4d62-b431-f34a04801348\PLAN_FLAT_CANVAS_REFACTOR.md).

Context & Goal:
Project: QUẢN LÝ CÔNG VIỆC TEAM & TIẾN ĐỘ DỰ ÁN 3.0 — FILE ĐI LÀM
Target File: `PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html` (preserve 100% backend contract and logic).
Standards: `AGENTS.md` and `STANDARDS_TEMPLATE/AGENTS_MASTER.md`.

Detailed Objectives (Triệt tiêu 100% "AI Slob" - chuyển đổi sang Pure Fintech Flat Canvas chuẩn ảnh 1 TikTok):
1. Anti-Card Overload: Xóa bỏ hoàn toàn các khối Card viền dày, bo hộp lổn nhổn ở Dashboard, Daily Actions, Nhân sự và Dự án. Chuyển sang nền phẳng sạch phân cách bằng đường kẻ mỏng nhẹ `border-b border-slate-100`.
2. Anti-Pill Overload: Xóa bỏ 100% các badge viên thuốc tròn xoe (`rounded-full`) màu mè thừa thãi. Trạng thái chỉ dùng chấm tròn nhỏ tinh tế `●` + text phẳng font chuẩn. Mã ID chuyển thành text font Mono phẳng (`font-mono text-xs text-slate-600`) không viền hộp.
3. Gantt Matrix Liền Mạch (Ảnh 1 TikTok): Hợp nhất bảng Task Info bên trái và dải Timeline Gantt theo ngày bên phải trên cùng một hàng ma trận phẳng, không viền hộp bao bọc rời rạc.
4. Master-Table Tràn Viền: Chuyển đổi toàn bộ màn hình Nhân sự và Dự án từ các thẻ Card khổng lồ sang Master-Table phẳng tràn viền (Edge-to-Edge), xem trọn vẹn toàn bộ danh sách trong 1 màn hình.
5. Bảo toàn 100% logic: Giữ nguyên `AppState`, `INITIAL_EMBEDDED_DATA`, Instant Render 0s, cơ chế gọi RPC, drawer modal Zero Phantom Overlay, CalendarApp sync.
6. Đóng dấu huy hiệu phiên bản lên `Bản 3.2` tại Topbar Header và Sidebar Footer. Chạy kiểm thử Node.js tự động đảm bảo cú pháp sạch và runtime không lỗi trước khi bàn giao.


## Follow-up — 2026-11-12T13:18:47Z

Execute the complete refinement of PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html to resolve all 5 identified issues:

Context & Goals:
Project: QUẢN LÝ CÔNG VIỆC TEAM & TIẾN ĐỘ DỰ ÁN 3.0 — FILE ĐI LÀM
File targeted: `PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html` (preserve 100% backend contract in `QuanLyCongViecTeam_Code.gs`).
Standards: `AGENTS.md` and `STANDARDS_TEMPLATE/AGENTS_MASTER.md`.

Detailed Tasks to execute:
1. True 100% Full Width (Edge-to-Edge Canvas):
   - Remove `max-w-7xl mx-auto` constraints on `#main-content` and everywhere else.
   - Let the entire viewport span 100% full width (`w-full px-4 lg:px-8 py-6`) so Master-Tables, Gantt timeline, and dashboards stretch edge-to-edge across wide screens without awkward empty side margins.
2. Fix "Sync Calendar" Button UX in Sidebar:
   - Make the Calendar Sync button distinct from normal navigation tabs. Place it in a dedicated Action block or polish its state with an elegant action button design (with proper Lucide icon, hover effect, and spinning animation indicator when syncing) rather than looking like an active navigation tab.
3. Completely Overhaul Tab "Hướng Dẫn & FAQ" (Tab HDSD) to Professional Flat Documentation:
   - Eliminate all card-box layouts (`BƯỚC 01`, `BƯỚC 02`, `BƯỚC 03` in colored boxes) and pill badges.
   - Reconstruct it into a comprehensive, professional Flat Workflow Guide detailing exact operational steps for each module:
     * Module 1: Vận hành Dashboard KPI & Xử lý việc khẩn cấp hôm nay (nhấp vào đâu, xem tỷ lệ kỷ luật ra sao).
     * Module 2: Quản lý Công việc & Đọc ma trận Gantt Timeline liền mạch (cách kéo tiến độ, lọc theo tuần/tháng, xem Today Line).
     * Module 3: Vận hành Lịch Routine & Ma trận Checklist tuần (cách click trực tiếp từng ô ngày để chấm Done/Chưa và tự tính % kỷ luật).
     * Module 4: Quản lý Nhân sự & Dự án (thao tác gọi điện `tel:`, xem khối lượng công việc đang gánh, tạo dự án).
     * Module 5: Cơ chế đồng bộ Google Calendar tự động qua CalendarApp và chính sách Single Visible Tab bảo vệ dữ liệu.
   - Accordion FAQ formatted cleanly with minimalist borders (`border-b border-slate-100`), without bulky card frames.
4. Eliminate 100% "Icon Pills" & Remaining Pill Artifacts:
   - Remove all colored box avatar containers (`w-9 h-9 rounded-xl bg-purple-50 text-purple-700`, `bg-blue-50`, etc.).
   - Replace with sleek flat typography or delicate Lucide icons without pill backgrounds.
5. Verification:
   - Ensure automated Node.js syntax checks (`node -c` or VM evaluation) pass with 0 errors.
   - Maintain instant render 0s and all existing RPC handlers.
