# Test Cases

Cover material CRUD, unit cost, batch creation, batch output, finished product with batch, selling price, food cost, suggested price, price propagation, missing data, duplicate IDs, circular dependency, refresh persistence, dashboard counts, menu actions, help navigation and broken buttons.

## Executed 18/10/2026

Runner: outputs/fnb_cost_v8_webapp/test-ui.cjs. Evidence: verification/test-results.json and screenshots.

- 21 calculation/CRUD fixture cases: raw creation/cost, invalid/missing price, batch cost, empty recipe, product using batch, reference deletion guard, nested batch guard, missing component, negative quantity, price propagation, zero-price validity, settings/rounding, delete, RPC-safe dates.
- 33 Chrome browser checks: seven pages, one active nav, no unrelated recipe form, drawer create/save, live summary updates, recipe save, reload, duplicate, cancel/confirm delete, settings save, batch choices excluding batches, no horizontal page overflow at 768/390px, mobile builder, no runtime errors.
- Desktop screenshots 1440px; tablet 768px; mobile 390px. Images reviewed for every desktop page, builder, and smaller layouts.

These are local fixture tests. They do not establish Apps Script deployment, OAuth, live spreadsheet writes, menu behavior or multi-user concurrency success. Acceptance remains conditional on live verification.
