# Master Execution Plan: Triệt để sửa lỗi BatDongSan Web App & Tái cấu trúc theo AGENTS_MASTER.md

## 1. Context & Problem Statement
Web App Google Apps Script CRM Bất Động Sản đang gặp sự cố nghiêm trọng:
1. Console: `Uncaught SyntaxError: Invalid or unexpected token userCodeAppPanel?crc_authDialog=true:4145` và `Uncaught ReferenceError: switchTab is not defined at HTMLButtonElement.onclick`.
2. Hệ thống đơ về 0, không thể chuyển tab hoặc thao tác.
3. Nguyên nhân dự kiến: HtmlService parser của Google Apps Script bị crash bởi ký tự/token không hợp lệ (ví dụ: unescaped template literals, raw data injection, script tag parsing issue, hoặc script syntax error dẫn đến toàn bộ khối script bị dừng thực thi, làm cho hàm toàn cục `switchTab` không được định nghĩa).

## 2. Mục tiêu kỹ thuật & Tiêu chuẩn AGENTS_MASTER.md
- Cấu trúc chuẩn 2 file vật lý duy nhất:
  - `PROJECTS_WEBAPPS/BatDongSan_Code.gs`
  - `PROJECTS_WEBAPPS/BatDongSan_Index.html`
- Áp dụng kiến trúc Model-View Flat Monolith đã chứng minh tính ổn định tuyệt đối trên `STANDARDS_TEMPLATE/TAISAN_Index.html` và `STANDARDS_TEMPLATE/CONGNO_Index.html`.
- Cơ chế nạp dữ liệu an toàn trong Apps Script:
  - Khởi tạo `AppState` với default seed data hoàn chỉnh để ứng dụng hiển thị tức thì, không bị trống/trắng.
  - RPC an toàn qua `google.script.run` hoặc JSON-safe serialization, không nhồi script inline gây vỡ HtmlService token.
- Đảm bảo `switchTab(tabId)` được định nghĩa toàn cục, an toàn ở đầu lifecycle, render phẳng theo module, không có ReferenceError/SyntaxError.
- Kiểm thử DOM giả lập (Node.js) để xác nhận 100% các tab chuyển mượt mà, không throw bất kỳ error nào.

## 3. Milestones & Team Dispatch Plan
- **Milestone 1: Technical Exploration & Root Cause Analysis**
  - Dispatch: 1 `teamwork_explorer`
  - Scope:
    - Điều tra `PROJECTS_WEBAPPS/BatDongSan_Index.html` và `PROJECTS_WEBAPPS/BatDongSan_Code.gs`.
    - Xác định chính xác vị trí token lỗi (dòng ~4145 hoặc tương đương trong userCodeAppPanel / rendered HTML), các chuỗi ký tự đặc biệt, regex, template literal, hoặc ký tự Unicode/escape gây lỗi parser của Google HtmlService.
    - So sánh với kiến trúc mẫu của `STANDARDS_TEMPLATE/TAISAN_Index.html` và `STANDARDS_TEMPLATE/CONGNO_Index.html` để vạch rõ phương án chuẩn hóa Model-View Flat Monolith.
    - Bàn giao `analysis.md` và `handoff.md` chi tiết phương án xử lý.
- **Milestone 2: Monolithic Flat SPA Implementation**
  - Dispatch: 1 `teamwork_worker`
  - Scope:
    - Triệt tiêu hoàn toàn nguyên nhân gây `SyntaxError` và `ReferenceError`.
    - Tái cấu trúc `BatDongSan_Index.html` và `BatDongSan_Code.gs` theo chuẩn AGENTS_MASTER.md (Flat Monolith, `switchTab` toàn cục, render function rõ ràng, seed data AppState, Drawer/Modal sạch đẹp, không pill rác).
    - Viết script kiểm thử Node.js DOM test để tự kiểm tra trước khi bàn giao.
- **Milestone 3: Comprehensive Verification & Gate Check**
  - Dispatch:
    - 2 `teamwork_reviewer` (độc lập review syntax, kiến trúc, tuân thủ AGENTS_MASTER.md).
    - 1 `teamwork_challenger` (stress test DOM, adversarial scenarios, payload injection, edge cases).
    - 1 `teamwork_auditor` (forensic integrity audit, kiểm tra tính xác thực, cấm hardcode gian lận).
  - Gate check: Phải 100% APPROVE + CLEAN audit.
- **Milestone 4: Clean Git Commit & Final Report**
  - Worker dọn dẹp artifact tạm, kiểm tra git status và commit.
  - Orchestrator tổng hợp báo cáo chi tiết gửi caller.
