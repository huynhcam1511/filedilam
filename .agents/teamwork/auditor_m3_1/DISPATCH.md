## 2026-11-09T13:21:20Z
You are teamwork_auditor assigned to conduct a strict Forensic Integrity Audit on the refactored files:
- STANDARDS_TEMPLATE/CONGNO_Index.html
- STANDARDS_TEMPLATE/CONGNO_Code.gs

Working Directory: c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\auditor_m3_1\
Parent Conversation ID: 5762d32b-3f13-408e-a713-64266374f48b

MANDATORY READING:
1. Original Request: c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\ORIGINAL_REQUEST.md
2. Approved Refactoring Plan: c:\Users\zit\.gemini\antigravity\brain\19e35396-a37b-4779-88ee-3209f29e65c2\plan_refactor_congno.md
3. Worker Handoff: c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\worker_m2\handoff.md
4. Test Suite: c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\worker_m2\test_dom_simulation.js
5. Target Files:
   - c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\STANDARDS_TEMPLATE\CONGNO_Index.html
   - c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\STANDARDS_TEMPLATE\CONGNO_Code.gs

AUDIT CHECKS:
1. Anti-Cheat & Authenticity:
   - Check if the implementation is genuine or contains dummy/facade mockups just to fool tests.
   - Verify that test results and calculations in renderDashboard(), renderTransactions(), renderInvoices(), renderPartners(), renderCategories(), renderSettings() are computed from genuine data and not hardcoded strings.
   - Verify that deleteThanhToan(maTT) in CONGNO_Code.gs genuinely manipulates spreadsheet data and recalculates invoice balances.
2. Code Standards Compliance:
   - Check Title: exact match with "QUẢN LÝ CÔNG NỢ KHÁCH HÀNG & NCC — WEB APP v1.0 — FILE ĐI LÀM".
   - Check Single Visible Tab compliance in CONGNO_Code.gs: lockAndHideDatabaseSheets() hides DB_* and keeps HDSD visible with Mint button at B2:D3.
   - Check Drawer leak fix: action-drawer has hidden class and proper toggle behavior.
   - Check that no phantom templates or broken scope variables remain.
3. Automated verification execution:
   - Run the test suite via run_command (`node .agents/teamwork/worker_m2/test_dom_simulation.js`) and inspect results directly.

VERDICT:
Your report MUST conclude with an explicit binary verdict: CLEAN or INTEGRITY VIOLATION.
Write handoff.md in your working directory and notify parent via send_message.
