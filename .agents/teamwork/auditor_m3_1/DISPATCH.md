# Task Assignment: Forensic Auditor (Integrity Forensics & Attestation)

## Context & Objectives
You are the Forensic Auditor (`teamwork_auditor`) on the Flat Canvas Refactor team.
Target files:
- `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\PROJECTS_WEBAPPS\QuanLyCongViecTeam_Index.html`
- `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\PROJECTS_WEBAPPS\QuanLyCongViecTeam_Code.gs`

MANDATORY FIRST STEP: Read ORIGINAL_REQUEST.md at:
`c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\ORIGINAL_REQUEST.md`

Read:
- `C:\Users\zit\.gemini\antigravity\brain\a6c9a7f7-5965-4d62-b431-f34a04801348\PLAN_FLAT_CANVAS_REFACTOR.md`
- `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\AGENTS.md`
- Worker handoff report: `c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\worker_m2_1\handoff.md`

## Audit Mission
Perform rigorous integrity forensics:
1. **Authenticity Check**: Verify that the refactored code contains genuine functional HTML and JavaScript, and does not hardcode test pass flags or mock facades.
2. **Implementation Verification**:
   - Verify that `APP_VERSION = 'v3.2'` in `Code.gs` and `Bản 3.2` badges in `Index.html` are genuine.
   - Verify that the Flat Metric Bar, Daily Actions flat list, Gantt Matrix 1-row table, Routines checklist, and Master-Tables are authentically rendered by JavaScript and not static stub strings.
   - Verify that all DOM elements and event handlers connect to real state in `AppState`.
3. **Execution Validation**:
   - Independently execute:
     `node .agents/teamwork/explorer_m1_3/verify_test_suite.js`
     `node .agents/teamwork/explorer_m1_3/sandbox_test.js`
   - Confirm outputs and exit codes.
4. **Binary Verdict**:
   Provide your explicit verdict: `CLEAN` or `INTEGRITY VIOLATION`.
   Document all evidence in `handoff.md`.


## 2026-11-11T20:57:01Z
You are the Forensic Auditor. Your working directory is:
`c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\auditor_m3_1`

MANDATORY FIRST STEP: Read ORIGINAL_REQUEST.md at:
`c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\ORIGINAL_REQUEST.md`

Read your dispatch instructions at:
`c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\auditor_m3_1\DISPATCH.md`

Perform rigorous integrity forensics on `PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html` and `PROJECTS_WEBAPPS/QuanLyCongViecTeam_Code.gs`.
Verify authenticity of implementation: ensure no hardcoded test stubs, fake success flags, or dummy facade implementations.
Verify that `APP_VERSION = 'v3.2'`, Flat Metric Bar, Daily Actions, Gantt Matrix 1-row table, Routines, and Master-Tables are genuinely rendered and bound to real state.
Independently execute:
- `node .agents/teamwork/explorer_m1_3/verify_test_suite.js`
- `node .agents/teamwork/explorer_m1_3/sandbox_test.js`
Provide your binary verdict (`CLEAN` or `INTEGRITY VIOLATION`) with evidence in `handoff.md`. Send a completion message when done.
