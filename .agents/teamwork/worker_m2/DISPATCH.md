## 2026-11-09T12:48:18Z
You are teamwork_worker assigned to Milestone 2: Monolithic Flat SPA Implementation for CONGNO_Index.html and CONGNO_Code.gs.

Working Directory: c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\worker_m2\
Parent Conversation ID: 5762d32b-3f13-408e-a713-64266374f48b

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY READING BEFORE CODING:
1. Original Request: c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\ORIGINAL_REQUEST.md
2. Approved Refactoring Plan: c:\Users\zit\.gemini\antigravity\brain\19e35396-a37b-4779-88ee-3209f29e65c2\plan_refactor_congno.md
3. Explorer Analysis & Blueprint:
   - c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\explorer_1\analysis.md
   - c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\explorer_1\handoff.md
4. Golden Reference Monolithic Architecture:
   - c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\STANDARDS_TEMPLATE\TAISAN_Index.html
5. Current Target Files:
   - c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\STANDARDS_TEMPLATE\CONGNO_Index.html
   - c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\STANDARDS_TEMPLATE\CONGNO_Code.gs

YOUR MISSION & SPECIFICATIONS:
You own writing and modifying the target files:
- `STANDARDS_TEMPLATE/CONGNO_Index.html`
- `STANDARDS_TEMPLATE/CONGNO_Code.gs`

SPECIFIC REQUIREMENTS:
1. `STANDARDS_TEMPLATE/CONGNO_Index.html`:
   - Title: `<title>QUẢN LÝ CÔNG NỢ KHÁCH HÀNG & NCC — WEB APP v1.0 — FILE ĐI LÀM</title>`
   - Tab IDs standardization: `tab-dashboard`, `tab-transactions`, `tab-invoices`, `tab-partners`, `tab-categories`, `tab-settings`, `tab-help` across Sidebar, Mobile Dock, main container sections, and router.
   - Comprehensive Default Seed Data embedded in `window.AppState.data` (refer to Section 5.1 in `analysis.md` for complete partner, invoice, payment, category, and settings objects). Initial load must render instantly with zero blank screen.
   - Architecture flattening: Remove the fragmented nested module objects (`ModuleInvoices`, `ModulePartners`, etc.). Use the Monolithic Flat SPA pattern modeled after `TAISAN_Index.html`:
     * Global `window.AppState` accessible everywhere.
     * Direct router function: `function switchTab(tabId) { ... }`
     * 7 flat render functions:
       1) `renderDashboard()`: 5 KPI cards + 8 Chart.js instances + Debt reminder table with `tel:` and Zalo template buttons.
       2) `renderTransactions()`: Master-Table (desktop) & Card list (mobile) + Right Drawer Form + Dynamic VietQR.
       3) `renderInvoices()`: Invoices ledger + Statement modal preview & print A4 (`#statement-modal`).
       4) `renderPartners()`: Partners directory + Credit limit badge/warning.
       5) `renderCategories()`: Category management (debt groups & payment methods).
       6) `renderSettings()`: Bank VietQR and Zalo message configuration.
       7) `renderHelp()`: 3-step onboarding guide + FAQ accordion + hotline support.
   - Chart.js lifecycle management: Maintain `let ChartInstances = {};` and call `ChartInstances[id]?.destroy()` safely before creating each chart.
   - Remove phantom template bug: Do NOT look for `template#tpl-mod-dashboard`. Render directly or through clean innerHTML/DOM building.
   - Fix Drawer bottom leak: `#action-drawer` must have `hidden` class when closed. In `openDrawer()`, remove `hidden` then remove `translate-y-full`. In `closeDrawer()`, add `translate-y-full`, and after 300ms transition add `hidden`.

2. `STANDARDS_TEMPLATE/CONGNO_Code.gs`:
   - Add `deleteThanhToan(maTT)` with `LockService`: deletes transaction in `DB_ThanhToan`, restores invoice remaining balance in `DB_PhatSinhNo` (recalculating `daTra`, `conLai`, status `'Còn nợ'`), returns `getInitialData()`.
   - Add `saveDanhMuc(payload)` with `LockService`.
   - Ensure Single Visible Tab rule: `lockAndHideDatabaseSheets()` protects and hides all `DB_*` sheets, leaving only `HDSD` visible with the Mint button at `B2:D3`.

3. VERIFICATION:
   - Write a Node.js test script (e.g. in your working directory `test_dom_simulation.js`) using jsdom or DOM simulation to:
     * Check JavaScript syntax and execution.
     * Call `switchTab()` across all 7 tabs sequentially and verify zero ReferenceError or TypeError.
     * Verify that 8 chart canvases are processed and stored in `ChartInstances`.
     * Verify drawer opening/closing toggle classes.
     * Verify modal statement preview opening/closing.
   - Run the test script and ensure it passes completely with 0 errors.


## 2026-11-09T13:01:08Z
**Context**: Milestone 2 Monolithic Flat SPA Implementation
**Content**: Heartbeat check. How is the implementation of CONGNO_Index.html, CONGNO_Code.gs, and DOM test simulation progressing?
**Action**: Please update progress.md with your latest steps as you finalize the code and verification tests.
