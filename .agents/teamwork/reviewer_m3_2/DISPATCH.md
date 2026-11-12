# Task Assignment: Reviewer 2 (Business Logic, AppState & Interface Contracts)

## Context & Objectives
You are Reviewer 2 on the Flat Canvas Refactor team.
Target files:
- `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\PROJECTS_WEBAPPS\QuanLyCongViecTeam_Index.html`
- `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\PROJECTS_WEBAPPS\QuanLyCongViecTeam_Code.gs`

MANDATORY FIRST STEP: Read ORIGINAL_REQUEST.md at:
`c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\ORIGINAL_REQUEST.md`

Read:
- `C:\Users\zit\.gemini\antigravity\brain\a6c9a7f7-5965-4d62-b431-f34a04801348\PLAN_FLAT_CANVAS_REFACTOR.md`
- `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\AGENTS.md`
- Worker handoff report: `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\worker_m2_1\handoff.md`

## Review Scope
1. **Business Logic & AppState Preservation**:
   - Check that `AppState`, `INITIAL_EMBEDDED_DATA` (12 tasks, 4 projects, 6 staff, 5 routines, 8 checklists) are 100% preserved.
   - Verify that instant render (0s load) functions properly.
2. **Backend Contracts & CalendarApp Sync**:
   - Verify RPC handlers in `Code.gs` (`getInitialData`, `apiSaveTask`, `apiSaveProject`, `apiSaveStaff`, `syncDeadlinesToGoogleCalendar`).
3. **Zero Phantom Overlay**:
   - Inspect drawer and modal containers (`#action-drawer-container`, `#confirm-modal-container`, `#team-proj-drawer-container`) to ensure `hidden` class is toggled properly and pointer-events are not blocked.
4. **Router & Module Integration**:
   - Verify `ModuleTasksGantt.render(tabId)`, `ModuleDashboard.renderDailyActions()`, `ModuleTeamProjects.renderTeam()`, and `ModuleTeamProjects.renderProjects()`.
5. **Run Verification Commands**:
   - `node .agents/teamwork/explorer_m1_3/verify_test_suite.js`
   - `node .agents/teamwork/explorer_m1_3/sandbox_test.js`

Write your verdict (`APPROVE` or `REQUEST_CHANGES`) with full evidence in `handoff.md`.


## 2026-11-11T20:56:05Z
You are Reviewer 2. Your working directory is:
`c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\reviewer_m3_2`

MANDATORY FIRST STEP: Read ORIGINAL_REQUEST.md at:
`c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\ORIGINAL_REQUEST.md`

Read your dispatch instructions at:
`c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\reviewer_m3_2\DISPATCH.md`

Review `PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html` and `PROJECTS_WEBAPPS/QuanLyCongViecTeam_Code.gs`. Focus on Business Logic, AppState preservation, Zero Phantom Overlay (`hidden` on modals/drawers), CalendarApp sync, and module interface contracts. Run tests and document your verdict (`APPROVE` or `REQUEST_CHANGES`) in `handoff.md`. Send a completion message when done.
