# Decision Log

- 18/10/2026: Packaging is a separate user module, common materials pricing repository. Persist materialType for new/edited records; infer legacy category Bao bì without resetting data. Source selectors and server validations enforce role, with grandfathering of existing historical lines to preserve costs. Referenced material type changes blocked.

- 18/10/2026: Speed/navigation/dashboard repair: request-local table memoization with write invalidation; bootstrap does not refresh or protect workbook. Writes/explicit refresh update derived Sheet report. Remove effective-user identity API from protection rather than broaden scopes. Help anchors scroll inside iframe. Web dashboard moves to 4 KPI/6 charts with consistent group filter and true ranking.

- 18/10/2026: Owner reaffirmed prompt-to-delivery as default: agent handles Sheet, bound Apps Script, host, configuration, deployment and verification; owner/customer receives one product link and opens copied Sheet menu. Technical projects stay behind the scenes. Same-product upgrades reuse stable deployment; no manual multi-file installation. OAuth/user authorization remains a real boundary; this is not a claim of a one-command factory bootstrap.

- 18/10/2026: Separate BATCH_GROUP / PRODUCT_GROUP / SALE_UNIT / SIZE from material GROUP / UNIT. Size is optional descriptive classification, never an automatic recipe multiplier; each variant can have its own stable recipe ID. Group renames cascade; referenced units/sizes cannot be relabeled silently. Append-only schema migration preserves legacy recipes and leaves unknown classifications blank.

- 18/10/2026: Owner chose webapp as sole supported operational editor, with beautiful Sheet start/dashboard views. Technical tables are hidden/protected, not repackaged as a second input surface. Derived report snapshots update through common cost engine; formulas provide KPIs/ranking/chart sources. Backups precede presentation repair; corrupted business schema blocks writes and is never silently reset.

- 18/10/2026: V10 adds centralized GROUP/UNIT catalogs in each customer's spreadsheet. Existing material category/unit string schema retained for compatibility; group rename cascades and used unit rename is blocked. Recipe source relations retain stable IDs. Catalog choices are validated on server as well as dropdown UI.

- 18/10/2026 — V10 copy-first is the commercial delivery model: bound launcher in template + centrally deployed USER_ACCESSING host. Customers never paste code, deploy or configure URLs. Each RPC carries its own copy ID; no user-global last-opened-sheet state, no master fallback. Google authorization remains an explicit first-use step, not silently bypassed.

- 2026-10-17: Product is a new spreadsheet and Apps Script project; the prior Smart GAS file remains unchanged.
- 2026-10-17: Google Sheets is the persistence layer for V1; calculation logic is separated from visual cell positions.
- 2026-10-18: Redesign retains the V8 backend/schema and adds a UI adapter only where edit/delete/settings were missing. Legacy endpoints stay available; new screens call the adapter with stable IDs.
- 2026-10-18: Deliver two bundled install files, plus plain-text copies; source modules/reference files are excluded from installation to prevent repeated copy/paste mistakes.
- 2026-10-18: Four responsive dashboard visualizations follow the user's Premium SaaS brief. Screenshots and fixture tests are not evidence of live Apps Script deployment.
