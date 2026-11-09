# BRIEFING — 2026-11-09T13:45:00Z

## Mission
Xử lý triệt để lỗi Web App Google Apps Script CRM Bất Động Sản (SyntaxError: Invalid or unexpected token :4145 và ReferenceError: switchTab is not defined, đơ về số 0, tab không chuyển được), audit và tái cấu trúc PROJECTS_WEBAPPS/BatDongSan_Code.gs và PROJECTS_WEBAPPS/BatDongSan_Index.html theo chuẩn Model-View Flat Monolith của AGENTS_MASTER.md kế thừa kiến trúc từ TAISAN_Index.html và CONGNO_Index.html.

## 🔒 My Identity
- Archetype: teamwork_orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\orchestrator_1\
- Original parent: parent (sentinel/caller)
- Original parent conversation ID: ae44ac66-8a23-4b01-9f0d-c1a391d66a99

## 🔒 My Workflow
- **Pattern**: Project / Canonical (Explorer -> Worker -> Reviewer -> Challenger -> Auditor)
- **Scope document**: c:\Users\zit\.gemini\antigravity\brain\19e35396-a37b-4779-88ee-3209f29e65c2\plan_refactor_congno.md
1. **Decompose**:
   - Milestone 1: Exploration & Technical Design alignment with TAISAN_Index.html
   - Milestone 2: Implementation of CONGNO_Index.html and CONGNO_Code.gs (monolithic flat SPA, seed data, tabs, drawer, single visible tab)
   - Milestone 3: Verification (DOM Node.js simulation test, Reviewer, Challenger, Forensic Auditor)
   - Milestone 4: Git commit & cleanup
2. **Dispatch & Execute**:
   - Direct iteration loop delegating all exploration, implementation, review, adversarial testing, and forensic auditing to subagents.
3. **On failure**:
   - Retry -> Replace -> Skip -> Redistribute -> Redesign -> Escalate
4. **Succession**:
   - Self-succeed at 16 spawns if needed.
- **Work items**:
  1. Exploration & Technical Alignment [pending]
  2. Refactoring Implementation [pending]
  3. Quality & Adversarial Verification [pending]
  4. Final Audit & Git Commit [pending]
- **Current phase**: 1
- **Current focus**: Exploration & Technical Alignment

### Update 2026-11-09T13:45:00Z — New Scope: BatDongSan CRM Web App Refactor
- **Scope document**: c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\orchestrator_1\plan.md
- **Work items (BatDongSan)**:
  1. Milestone 1: Technical Exploration & Root Cause Analysis (SyntaxError :4145, switchTab undefined, token parsing crash in GAS HtmlService) [in-progress]
  2. Milestone 2: Monolithic Flat SPA Refactoring of BatDongSan_Index.html & BatDongSan_Code.gs [pending]
  3. Milestone 3: Comprehensive Verification (Automated DOM Test + 2 Reviewers + Challenger + Forensic Auditor) [pending]
  4. Milestone 4: Clean Git Commit & Final Verification [pending]

## 🔒 Key Constraints
- NEVER write, modify, or create source code files directly.
- NEVER run build/test commands yourself — require workers to do so.
- NEVER investigate or explore the problem at the code level — dispatch Explorers for technical investigation.
- Delegate ALL work to subagents via invoke_subagent.
- Forensic Auditor verdict is a binary veto.
- Do NOT reuse subagents after handoff.
- Target physical files: PROJECTS_WEBAPPS/BatDongSan_Code.gs, PROJECTS_WEBAPPS/BatDongSan_Index.html.

## Current Parent
- Conversation ID: 11268754-0824-49dd-9a1a-2a6a30448651
- Updated: 2026-11-09T13:45:00Z

## Key Decisions Made
- Audit BatDongSan against AGENTS_MASTER.md and the gold-standard architecture of TAISAN_Index.html & CONGNO_Index.html.
- Do not let inline raw data / unescaped characters / script tags break Google Apps Script's HtmlService parser.
- Keep monolithic 2-file structure: BatDongSan_Code.gs and BatDongSan_Index.html.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|

## Succession Status
- Succession required: no
- Spawn count: 0 / 16
- Pending subagents: none
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: not started
- Safety timer: none

## Artifact Index
- ORIGINAL_REQUEST.md — c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\ORIGINAL_REQUEST.md
- DISPATCH.md — c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\orchestrator_1\DISPATCH.md
- plan.md — c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\orchestrator_1\plan.md
- progress.md — c:\Users\zit\OneDrive\Tài liệu\ANTIGRAVITY\FILE_DI_LAM_MVP\.agents\teamwork\orchestrator_1\progress.md
