# Architecture

## V10 copy-first deployment (current)

Seller deploys a standalone HTML Service host as USER_ACCESSING, then embeds its deployment URL into a script bound to a new template Sheet. Google copies the bound launcher with the Sheet. openCostApp reads getActiveSpreadsheet().getId() and constructs a URL with spreadsheetId. Host injects that ID into the page and every apiV10 request passes it explicitly. Request-local context routes repositories; finally clears it. Google enforces access via the accessing user's account. No target in UserProperties and no master fallback; master mutations are blocked. Minimal launcher scopes: current spreadsheet + container UI. Host uses Sheets scope; authorization/verification are separate release gates.

UI: Apps Script HTML Service, responsive HTML/CSS/JS. Services: validate request, CRUD, search, dashboard. Cost engine: pure functions over normalized records. Repository: batched reads/writes to Google Sheets. Database: MATERIALS, SEMI_FINISHED_PRODUCTS, FINISHED_PRODUCTS, RECIPE_COMPONENTS, SETTINGS, AUDIT_LOG.

Stable IDs are the only relationships. The workbook presentation is an interface, not the calculation engine.

## Implemented 8.1 frontend adapter

Source is `outputs/fnb_cost_v8_webapp`. Existing `Code.gs` and V8_* sheet schema remain; `UiServices.gs` adds UI bootstrap, validated upsert, whole-recipe component replacement, reference-safe delete and persistent settings. `uiEvaluate_` derives costs for UI with explicit incomplete states; no independent cost cache is written. Legacy endpoints remain for compatibility but the new frontend calls only `ui*` endpoints.

Actual table names: V8_MATERIALS, V8_BATCHES, V8_PRODUCTS, V8_COMPONENTS, V8_SETTINGS, V8_AUDIT_LOG. UI reads Dates serialized as JSON strings to avoid HTML Service RPC Date failures. Writes use ScriptLock and audit records. Multi-table writes are not transactional; live Google API failure/rollback testing remains pending.

`build.cjs` bundles Code.gs + UiServices.gs into install/Code.gs and copies WebApp.html. Installation is TWO files; CostEngine.gs/reference files are not required by this bundle. build does not deploy. Tests use actual UI services with an in-memory repository plus headless Chrome; live Google execution remains a separate gate.
