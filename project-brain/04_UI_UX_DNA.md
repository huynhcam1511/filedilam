# UI UX DNA

Modern F&B SaaS: forest green #065F46, emerald #047857, light green #D1FAE5, slate text #0F172A, background #F8FAFC, border #E2E8F0. Left navigation, short labels, one primary action per page, responsive cards, clear empty and error states. Never use emoji as the only icon system.

## Premium frontend 8.1 — 18/10/2026

Implemented CSS tokens: brand #047857, deep #064e3b, background #f7f9fb, ink #152b28, muted #687b78, border #e3ebe7. Eight-pixel spacing basis; 240px white sidebar; SVG line icons; active inset brand border. Native HTML/CSS/JS compatible with HTML Service, no framework/CDN dependency.

Pages: onboarding start with three actions and progress; dashboard with six metrics and four data visualizations; searchable management tables; raw-material drawer; shared batch/product Recipe Builder with live summary; sectioned Help Center; editable VND/target/rounding/density settings. Dashboard, Help and Settings never contain ingredient-entry forms.

Reusable renderers: icon, button, field, empty, badge, metric, table/list, drawer, confirmDialog, toast, ingredient rows and cost summary. CSS handles skeletons, keyboard focus, compact tables and responsive shell at 1150/960/600px. Dialogs trap Tab and support Escape; dirty recipes prompt before leaving.
