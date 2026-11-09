# Original User Request

## Parameters

[skip-interview]
How this run was launched; not part of the task.

## Initial Request — 2026-11-09T13:37:45Z

XỬ LÝ TRIỆT ĐỂ: Web App Google Apps Script CRM Bất Động Sản đang bị lỗi:
1. Console báo: "Uncaught SyntaxError: Invalid or unexpected token userCodeAppPanel?crc_authDialog=true:4145" và "Uncaught ReferenceError: switchTab is not defined at HTMLButtonElement.onclick".
2. Hệ thống bị đơ về số 0, tab không chuyển được.
3. Cần audit toàn diện codebase theo tiêu chuẩn AGENTS_MASTER.md (STANDARDS_TEMPLATE/AGENTS_MASTER.md) bao gồm:
   - File cấu trúc đúng 2 file: PROJECTS_WEBAPPS/BatDongSan_Code.gs và PROJECTS_WEBAPPS/BatDongSan_Index.html.
   - Cơ chế nạp dữ liệu và xử lý Javascript trong HtmlService của Google Apps Script không bị lỗi token, không dùng inline/raw data gây crash parser của Google.
   - Phân tích kiến trúc tại sao các template chuẩn như CONGNO_Index.html hoặc TAISAN_Index.html chạy mượt mà không bao giờ bị lỗi token này, để áp dụng kiến trúc chuẩn Model-View Flat Monolith.
   - Xóa bỏ triệt để mọi nguyên nhân gây SyntaxError, ReferenceError và đảm bảo ứng dụng nạp data tức thì, chuyển tab mượt mà 100%.


## Follow-up — 2026-11-09T13:42:22Z

User has approved the plan plan_eliminate_token_error.md. Please proceed with executing the fix:
1. Re-architect PROJECTS_WEBAPPS/BatDongSan_Index.html following the golden Model-View Flat Monolith standard from TAISAN_Index.html and CONGNO_Index.html.
2. Replace giant embedded 2500-line raw JSON with a clean, lightweight micro-seed (10 properties, 15 representative leads, 10 logs, 5 deals) formatted safely under 100 chars per line.
3. Expose all navigation functions (e.g. window.switchTab = switchTab) on global scope immediately at the top of the script so ReferenceError is impossible.
4. Ensure zero syntax errors, test with node/vm parser, commit and push to git.
