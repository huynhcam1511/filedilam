# Current State — 18/10/2026

## 19/10/2026 — Product/module review (planning only)

- Reviewed the main pipeline, architecture, storefront/admin/Cloud Functions, factory and Cost V10 source/evidence. Saved module-level P0/P1/P2 assessment and an asset-management discovery example in `REVIEW_MODULES_AND_ASSET_DISCOVERY_20261019.md`.
- No code, deployment, product data or live configuration changed. Findings based on static source and existing evidence; storefront live flows and Cost V10 customer OAuth/business CRUD/cross-account isolation remain unverified.

## V10 — current product delivery

- 18/10/2026: Saved owner-approved Adam voiceover style and last script in PIPELINE_FILE_DI_LAM_FACTORY.md: speaker “chồng”, audience “con vợ”, natural spoken Vietnamese, concrete hook, no forced advertising. Applies to voiceover scripts, not app UI. No audio timing verified; no product code/deployment changed in this documentation update.

- 18/10/2026: Packaging split into sidebar Bao bì and filtered Nguyên liệu view, sharing V8_MATERIALS. Added materialType column (INGREDIENT/PACKAGING); legacy Bao bì category supported. Ingredient/mẻ sources exclude packaging; packaging source excludes ingredients/batches. Server rejects new mismatches, preserves saved historical references and blocks type changes while used. Browser fixture confirmed list separation, new-packaging form type, correct source options and 2,600 VND combined preview. 8 packaging service checks pass. No business records rewritten for this UI change.

- Packaging live check on existing owner copy: Bao bì shows only BB_LY / Ly và nắp (600 VND per bộ), Nguyên liệu shows only NL_TRA and NL_DAO. Sidebar/module separation observed after reload; screenshot packaging-live.png. New packaging saves and recipe-source dropdown interactions tested on local fixture, not written to user's live data.

- 18/10/2026 latest live verification: existing owner copy 1cTD394T3tva6tWPd3RF6H0VZSwXUpFY1HYB-hSCMszs loads successfully after speed fix. One measured data RPC: 5.3 s total / 3.5 s server (not a benchmark or guaranteed latency). Help links tested live: internal scroll/focus, no redirect. New dashboard 4 KPI + 6 charts and group filtering observed with actual sample (cost 7,866.67 VND, 26.22%). Settings report refresh completed successfully with existing scopes, fixing effective-user/email error. Business CRUD, layout repair, independent customer account and initial customer OAuth remain unverified; earlier blanket “no live write” notes below are superseded only for derived report refresh.
- Performance implementation: request-local table read memoization and write invalidation, 7 table reads / 0 presentation writes on normal bootstrap fixture. Bootstrap no longer redraws/protects Sheet; mutations or explicit refresh update report. No identity scope added. Evidence: performance-tests.json, experience-tests.json, LIVE_EXPERIENCE_VERIFICATION.md, dashboard-live-after-fix.png.

- 18/10/2026: Saved owner's default manufacturing workflow in main pipeline and AGENTS: prompt → agent prepares/configures/deploys/verifies everything → one product link → copy and open menu. No owner-side script creation, multi-file paste or URL wiring. Documentation-only update for this request; no additional Sheet/project/deployment created.

- 18/10/2026: Completed six catalog kinds: material groups, calculation/purchase/output units, batch groups, product groups, selling units and optional sizes. Forms use corresponding dropdowns; batch/product lists have group filters and show classification/size/sale unit. New schema columns append to existing tables; legacy records remain unclassified until user chooses. Product sizes appear in dashboard/report labels. 13 full-service recipe-catalog fixture tests pass plus browser selections/draft bindings/filter checks. Stable deployment updated; live OAuth/persistence gate remains unverified.

- 18/10/2026: User chose app-first input and two visible Google Sheet pages (BẮT ĐẦU / TỔNG QUAN). Master updated via native connector: pastel layout, 4 formula KPIs, 6 formula-backed charts, protected pages/backends and editable composition picker. Demo cost read back as 7,866.6667 VND / 26.2222%. Initial source page preserved in hidden backup. Actual Google browser visual review performed.
- New WorkbookPlan.gs is shared by seller REST batch adapter and Apps Script renderer. Request schema gate blocks missing/duplicate headers, duplicate IDs and missing tables; lookup remains header-based. Settings exposes refresh/check and backup-before-layout-repair. OnOpen rewrites button for active copy. 11 workbook fixture tests passed; actual Apps Script repair/persistence still awaits first-use OAuth. Existing copies receive host upgrade when opened from menu; latest template contains updated bound launcher. No live storefront or sharing change.

- 18/10/2026: Added Danh mục module (groups and units) backed by per-copy V10_CATALOGS. Material group/purchase unit/cost unit and batch output unit use dropdowns. Existing labels migrate on first initialization. Group rename propagates; referenced unit rename blocked. 10 local catalog checks and browser fixture test passed (create unit and select in all four fields). Deployment updated on existing V10 URL; live customer authorization/write gate remains pending.

- Main production pipeline is PIPELINE_FILE_DI_LAM_FACTORY.md, updated with copy-first delivery, manufacturing steps, acceptance gates and actual V10 status. AGENTS.md, factory README and Project Brain point there. Factory CLI remains workbook-only; V10 is a separate implementation, not a registered one-command factory template.

- New template: `1t0TmIKn02w7pewdspXgicXS2usj5phtV0c7gCFCI1eE`; source/deployment record: outputs/fnb_cost_v10.
- Shared Web App deployed (host version in deployment.json), executing as USER_ACCESSING. Bound launcher project already attached to template; buyer does not configure URL, deploy or paste code.
- Each RPC receives its copy ID; no fixed master database or last-opened copy in UserProperties.
- Real browser /copy created test copy `1f7a3QhFmZk1nVeqp8QtvjLYLqNPz5BCjsb-syulZQ2k`. Copy dialog confirmed attached Apps Script copied. Menu File Đi Làm Cost appeared in copy. Screenshot copied-sheet-menu.png.
- 13 local routing/launcher tests pass. API source readback confirmed uploaded host and bound launcher config.
- Remaining gate: Google first-use authorization displays an unverified-app warning. Left authorization page for user handoff; no live Web App write test or second customer account test completed. Commercial readiness NOT confirmed. Template sharing remains private.
- Do not reuse V8 paste-code installation instructions for customers. The V8 history below is local development history, not the V10 customer workflow.

## Implemented locally: Cost UI 8.1

- Source: outputs/fnb_cost_v8_webapp. New premium HTML Service frontend; seven purposeful pages and shared Recipe Builder.
- Existing V8_* tables and legacy backend endpoints retained. New UiServices adapter handles validated create/edit, deletion guards, whole-recipe saves, settings and serialized bootstrap.
- Four dashboard charts and six metrics read actual bootstrap records. No demo numbers or reserved workbook rows counted as products.
- Two-file bundle: install/Code.gs + install/WebApp.html. Text copies provided for unambiguous copy/paste. Do not install reference files or the unused standalone CostEngine.gs.
- 21 local calculation/CRUD and 33 Chrome browser checks pass. Actual fixture screenshots generated and reviewed. Report: verification/test-results.json.

## Not verified live

- User screenshots establish 8.1 UI opens from its deployment URL and shows synced status; the Sheet menu opens a different deployment ID and fails. Menu launcher now uses an explicitly saved /exec URL and a user-clickable link; source fix tested locally, installation/menu verification still pending.

- No new deployment was pushed from this session. User's earlier screenshot showed V7 HTML served with a V8 backend; installed version may still differ from local source.
- Google Apps Script execution, OAuth, live Sheets persistence and Google Sheets menu require verification after the two-file bundle is deployed.
- Multi-table API writes are not transactional; simulated API failure/rollback and concurrent users are not covered.

## Known scope limits

- VND only. Recipe quantities use the displayed source calculation unit. No automatic g/ml conversion.
- Product category is not stored by the current legacy product schema.
- No automatic migration of V7 workbook demo data into V8 tables.
- Existing older Code.gs/CostEngine.gs endpoints contain earlier logic; UI 8.1 calls only UiServices endpoints.

## Next gate

Install the bundled Code.gs and WebApp.html into the intended Apps Script project; deploy a new version and verify material → batch → product, price propagation, refresh persistence and menu on a separate test Sheet. Do not call the commercial product released before live verification.
