# File Di Lam Template Factory

Config-driven workbook factory for building commercial Excel templates under the `File di lam` brand.

## What this repo now contains

- One shared engine for build, versioning, timestamped export, and QC
- One shared design system for colors, typography roles, editable vs formula zones, and dashboard cards
- Multiple palette presets with explicit color-harmony rules instead of ad-hoc color picks
- Production-style templates: `Shop Online Mini` and `Quản Lý Kho Mini`
- One automatic QC flow that runs after build and writes a JSON report next to the `.xlsx`

## Current template

`Shop Online Mini` includes:

- order tracking
- cash in / cash out
- COD receivables ledger
- dashboard
- usage guide
- dropdown lists
- worksheet protection
- sample data for demo/TikTok
- metadata with version and build timestamp

`Quản Lý Kho Mini` includes:

- product/SKU setup
- inbound and outbound stock ledgers
- formula-driven inventory and inventory value
- low-stock alerts
- dashboard with KPI cards and charts
- sample data, validations, and quick-start guide

## Palette presets

Current presets in `file_di_lam_factory/design_systems/`:

- `pastel_feminine_spring`: pastel analogous system for female-leaning retail/admin products
- `corporate_clean_blue`: clean blue system for office / B2B templates
- `neutral_beige_soft`: soft beige neutral system for premium minimal templates

Each preset defines:

- core harmony model
- role-based color tokens
- sheet tab colors
- reusable format surfaces for input, formula, guide, and dashboard areas

## Architecture

```text
file_di_lam_factory/
  core/                   # engine, versioning, formats, workbook helpers
  design_systems/         # shared visual tokens
  templates/
    shop_online_mini/
      config.json         # sheet structure, columns, guide copy
      sample_data.json    # demo data + dropdown source lists
      formulas.py         # formula generation + cached results
      validations.py      # dropdown/data entry rules
      dashboard.py        # dashboard cards + charts
      qc.py               # template-specific checks
      builder.py          # template renderer using shared engine
```

The split is intentionally opinionated:

- shared engine logic stays in `core/`
- each template owns its own config and domain logic
- design tokens are not duplicated per file
- exports are timestamped and never overwrite older builds

## Usage

List templates:

```bash
python3 -m file_di_lam_factory.cli list
```

Build the first template:

```bash
python3 -m file_di_lam_factory.cli build shop_online_mini
```

Run QC on an existing exported workbook:

```bash
python3 -m file_di_lam_factory.cli qc shop_online_mini /absolute/path/to/workbook.xlsx
```

Run the smoke test:

```bash
python3 -m unittest discover -s tests
```

## Output convention

Build artifacts are written to:

```text
outputs/<template_id>/<file_stem>__v<version>__<timestamp>.xlsx
outputs/<template_id>/<file_stem>__v<version>__<timestamp>.qc.json
outputs/<template_id>/<file_stem>__v<version>__<timestamp>.manifest.json
```

If a filename already exists, the engine appends `__01`, `__02`, ... instead of overwriting.

## Landing page

This repo now also includes a static storefront landing page for TikTok bio links:

- `index.html`
- `storefront.css`
- `storefront.js`
- `storefront-data.js`

How it works:

- category folders on top
- product cards inside each folder
- cart drawer
- bank-transfer checkout flow
- manual payment confirmation stored in browser localStorage

To customize before publishing:

1. Edit product list, prices, folder names, and bank account in `storefront-data.js`
2. Open `index.html` locally to review
3. Upload the four storefront files to Vercel, Netlify, GitHub Pages, or any static host

## Extend with a new template

1. Add a new folder in `file_di_lam_factory/templates/<template_id>/`
2. Create `config.json` and `sample_data.json`
3. Implement `builder.py`, `formulas.py`, `validations.py`, `dashboard.py`, `qc.py`
4. Register the template in `file_di_lam_factory/templates/registry.py`
5. Build via the same CLI

## Notes

This implementation uses `xlsxwriter` for authoring and `openpyxl` for post-build QC because those libraries are available in the current environment. The structure is still designed so the template logic stays separate from the export engine and can later be ported to a Google Sheets or alternate Excel backend.
