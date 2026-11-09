const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');

const refactoredHTML = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NourishGroup | Giải Pháp Google Sheets & Web App Tự Động</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #ffffff;
      --bg-alt: #f8fafc;
      --surface: #ffffff;
      --line: #e2e8f0;
      --line-subtle: #f1f5f9;
      --text: #181925;
      --muted: #666666;
      --answer-body: #333333;
      --mint-primary: #059669;
      --mint-hover: #047857;
      --mint-light: #ecfdf5;
      --mint-border: #a7f3d0;
      --accent-purple: #8b5cf6;
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 20px;
      --radius-xl: 24px;
      --radius-full: 9999px;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.04);
      --shadow-md: 0 4px 20px -2px rgba(0,0,0,0.05);
      --shadow-lg: 0 10px 30px -5px rgba(0,0,0,0.08);
      --font-main: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-main);
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.5;
      letter-spacing: -0.1px;
      font-weight: 400;
      -webkit-font-smoothing: antialiased;
    }

    h1, h2, h3, h4, h5, h6 {
      font-weight: 600;
      color: var(--text);
    }
    strong, b {
      font-weight: 600;
    }

    a { text-decoration: none; color: inherit; }
    button { font-family: inherit; cursor: pointer; border: none; outline: none; }

    .container {
      width: 100%;
      max-width: 1180px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* TOP HEADER */
    .header {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--line-subtle);
    }
    .header-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 70px;
    }
    .logo {
      font-size: 1.35rem;
      font-weight: 600;
      letter-spacing: -0.03em;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .logo-badge {
      font-size: 0.65rem;
      font-weight: 500;
      background: var(--mint-light);
      color: var(--mint-primary);
      padding: 2px 7px;
      border-radius: var(--radius-full);
      border: 1px solid var(--mint-border);
      text-transform: uppercase;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 28px;
      list-style: none;
    }
    .nav-links a {
      font-size: 0.92rem;
      font-weight: 500;
      color: var(--muted);
      transition: color 0.15s;
    }
    .nav-links a:hover { color: var(--mint-primary); }
    .nav-links .active { color: var(--text); font-weight: 600; }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .search-btn, .cart-btn {
      background: transparent;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.9rem;
      font-weight: 600;
      padding: 8px 12px;
      border-radius: var(--radius-full);
      transition: background 0.15s;
    }
    .search-btn:hover, .cart-btn:hover { background: var(--bg-alt); }
    .cart-btn {
      background: var(--bg-alt);
      border: 1px solid var(--line);
    }

    /* HERO SECTION */
    .hero {
      padding: 64px 0 48px;
      background: radial-gradient(circle at 85% 20%, rgba(236, 253, 245, 0.8) 0%, rgba(255, 255, 255, 0) 60%);
    }
    .hero-grid {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 48px;
      align-items: center;
    }
    .hero-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 5px 14px;
      border-radius: var(--radius-full);
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--muted);
      margin-bottom: 20px;
    }
    .hero-pill span.badge-new {
      background: #3b82f6;
      color: white;
      font-size: 0.7rem;
      padding: 1px 6px;
      border-radius: var(--radius-full);
      font-weight: 500;
    }
    .hero-title {
      font-size: 3rem;
      font-weight: 600;
      line-height: 1.15;
      letter-spacing: -1.385px;
      color: var(--text);
      margin-bottom: 18px;
    }
    .hero-desc {
      font-size: 1.05rem;
      color: var(--muted);
      line-height: 1.6;
      margin-bottom: 28px;
      max-width: 540px;
      font-weight: 400;
    }
    .hero-cta {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 20px;
    }
    .btn-primary {
      background: var(--mint-primary);
      color: #ffffff;
      padding: 13px 28px;
      border-radius: var(--radius-full);
      font-weight: 600;
      font-size: 0.95rem;
      transition: all 0.2s ease;
      box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
    }
    .btn-primary:hover {
      background: var(--mint-hover);
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: #ffffff;
      border: 1px solid var(--line);
      color: var(--text);
      padding: 13px 24px;
      border-radius: var(--radius-full);
      font-weight: 600;
      font-size: 0.95rem;
      transition: all 0.15s;
    }
    .btn-secondary:hover {
      background: var(--bg-alt);
      border-color: #cbd5e1;
    }
    .hero-coupon-hint {
      font-size: 0.86rem;
      color: var(--muted);
    }
    .hero-coupon-hint strong {
      color: var(--mint-primary);
      font-family: var(--font-mono);
      font-weight: 600;
    }

    /* HERO MOCKUP CARD */
    .hero-mockup-wrapper {
      position: relative;
    }
    .sheet-card {
      background: #ffffff;
      border: 1px solid var(--line-subtle);
      border-radius: var(--radius-lg);
      padding: 20px;
      box-shadow: var(--shadow-md);
      position: relative;
    }
    .sheet-status-tag {
      position: absolute;
      top: -12px;
      left: 20px;
      background: #ffffff;
      border: 1px solid var(--mint-border);
      color: var(--mint-primary);
      font-size: 0.78rem;
      font-weight: 500;
      padding: 4px 12px;
      border-radius: var(--radius-full);
      display: inline-flex;
      align-items: center;
      gap: 5px;
      box-shadow: var(--shadow-sm);
    }
    .sheet-header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      padding-top: 6px;
    }
    .sheet-title {
      font-size: 0.9rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text);
    }
    .google-sheets-badge {
      font-size: 0.7rem;
      background: #f1f5f9;
      color: var(--muted);
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 500;
    }
    .fx-bar {
      background: var(--bg-alt);
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 6px 12px;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--muted);
      margin-bottom: 14px;
    }
    .sheet-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
      margin-bottom: 16px;
    }
    .sheet-table th, .sheet-table td {
      border: 1px solid var(--line);
      padding: 8px 10px;
      text-align: left;
    }
    .sheet-table th {
      background: var(--bg-alt);
      font-weight: 600;
      color: var(--muted);
      font-size: 0.72rem;
    }
    .sheet-table td.total-cell {
      font-weight: 600;
      background: #f0fdf4;
      color: var(--mint-primary);
      font-family: var(--font-mono);
    }
    .sheet-tabs {
      display: flex;
      gap: 8px;
      font-size: 0.75rem;
      color: var(--muted);
      border-top: 1px solid var(--line);
      padding-top: 12px;
    }
    .sheet-tab {
      padding: 3px 10px;
      border-radius: 4px;
      background: var(--bg-alt);
    }
    .sheet-tab.active {
      background: #e2e8f0;
      color: var(--text);
      font-weight: 600;
    }
    .floating-revenue-card {
      position: absolute;
      bottom: -24px;
      right: -16px;
      background: #ffffff;
      border: 1px solid var(--line-subtle);
      border-radius: var(--radius-md);
      padding: 14px 18px;
      box-shadow: var(--shadow-md);
      width: 200px;
    }
    .revenue-title {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--muted);
      margin-bottom: 10px;
    }
    .bar-chart {
      display: flex;
      align-items: flex-end;
      gap: 6px;
      height: 48px;
    }
    .chart-col {
      flex: 1;
      background: linear-gradient(180deg, #c084fc 0%, #818cf8 100%);
      border-radius: 3px 3px 0 0;
    }

    /* STATS STRIP */
    .stats-section {
      padding: 40px 0 50px;
      border-bottom: 1px solid var(--line-subtle);
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 32px;
    }
    .stat-card {
      background: transparent;
      border: none;
      border-radius: 0;
      padding: 0;
    }
    .stat-number {
      font-size: 26.4px;
      font-weight: 600;
      letter-spacing: -1.003px;
      color: var(--text);
      margin-bottom: 6px;
      line-height: 1.2;
    }
    .stat-label {
      font-size: 13.5px;
      color: var(--muted);
      line-height: 1.4;
      font-weight: 400;
    }

    /* CATALOG & HORIZONTAL CATEGORY BAR */
    .catalog-section {
      padding: 64px 0 80px;
    }
    .section-tag {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--muted);
      background: var(--bg-alt);
      border: 1px solid var(--line);
      padding: 4px 12px;
      border-radius: var(--radius-full);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
    }
    .section-title {
      font-size: 2.1rem;
      font-weight: 600;
      letter-spacing: -1.03px;
      color: var(--text);
      margin-bottom: 28px;
    }
    .filter-search-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 32px;
      flex-wrap: wrap;
    }
    .category-tabs {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .cat-tab {
      padding: 8px 16px;
      border-radius: var(--radius-full);
      background: var(--bg-alt);
      border: 1px solid var(--line);
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--muted);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }
    .cat-tab:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }
    .cat-tab.active {
      background: var(--text);
      color: #ffffff;
      border-color: var(--text);
      font-weight: 500;
    }
    .cat-tab .count {
      font-size: 0.75rem;
      opacity: 0.8;
      font-family: var(--font-mono);
    }
    .quick-search-box {
      position: relative;
      min-width: 260px;
    }
    .quick-search-box input {
      width: 100%;
      background: var(--bg-alt);
      border: 1px solid var(--line);
      border-radius: var(--radius-full);
      padding: 8px 16px 8px 36px;
      font-size: 0.85rem;
      font-family: inherit;
      outline: none;
      transition: border 0.15s;
    }
    .quick-search-box input:focus {
      border-color: var(--mint-primary);
      background: #ffffff;
    }
    .quick-search-box svg {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
    }

    /* PRODUCT GRID */
    .product-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 28px;
      margin-bottom: 40px;
    }
    .product-card {
      background: #ffffff;
      border: 1px solid var(--line-subtle);
      border-radius: var(--radius-lg);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .product-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
      border-color: #cbd5e1;
    }
    .product-thumbnail {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 10;
      background: #f8fafc;
      border-bottom: 1px solid var(--line-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .mock-browser {
      width: 100%;
      height: 100%;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .browser-top {
      height: 16px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 0 8px;
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: #cbd5e1; }
    .browser-body {
      flex: 1;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .mock-row { height: 8px; background: #f1f5f9; border-radius: 3px; }
    .mock-grid { display: flex; gap: 6px; height: 36px; }
    .mock-col { flex: 1; background: #e0f2fe; border-radius: 3px; }
    .badge-type {
      position: absolute;
      top: 14px;
      left: 14px;
      font-size: 0.68rem;
      font-weight: 500;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .badge-type.webapp { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
    .badge-type.gsheets { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
    .badge-video {
      position: absolute;
      bottom: 14px;
      left: 14px;
      background: rgba(239, 68, 68, 0.95);
      color: #ffffff;
      font-size: 0.65rem;
      font-weight: 500;
      padding: 2px 7px;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .product-info {
      padding: 20px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .product-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text);
      line-height: 1.4;
      margin-bottom: 12px;
      min-height: 44px;
    }
    .price-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 18px;
      margin-top: auto;
    }
    .price-current {
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--text);
      font-family: var(--font-mono);
    }
    .price-old {
      font-size: 0.85rem;
      color: #94a3b8;
      text-decoration: line-through;
      font-family: var(--font-mono);
    }
    .btn-add-cart {
      width: 100%;
      background: var(--text);
      color: #ffffff;
      padding: 10px;
      border-radius: var(--radius-full);
      font-size: 0.88rem;
      font-weight: 600;
      transition: all 0.15s;
    }
    .btn-add-cart:hover {
      background: #334155;
    }

    /* 3-STEP QR CHECKOUT */
    .steps-section {
      padding: 72px 0;
      background: #ffffff;
      border-top: 1px solid var(--line-subtle);
      border-bottom: 1px solid var(--line-subtle);
    }
    .center-header {
      text-align: center;
      max-width: 600px;
      margin: 0 auto 48px;
    }
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }
    .step-card {
      background: #ffffff;
      border: 1px solid var(--line-subtle);
      border-radius: 20px;
      padding: 28px 24px;
      display: flex;
      flex-direction: column;
      box-shadow: none;
    }
    .step-mock {
      height: 180px;
      background: #f8fafc;
      border: 1px solid var(--line-subtle);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      padding: 16px;
    }
    .step-number {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--mint-primary);
      font-family: var(--font-mono);
      margin-bottom: 8px;
    }
    .step-title {
      font-size: 1.05rem;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .step-text {
      font-size: 0.85rem;
      color: var(--muted);
      line-height: 1.5;
      font-weight: 400;
    }

    /* STEP 01: FILE SELECTOR ANIMATION */
    .file-select-anim {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .anim-file-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 14px;
      border-radius: 10px;
      background: #ffffff;
      border: 1px solid var(--line);
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--text);
      transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .anim-file-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .anim-file-box {
      width: 18px;
      height: 18px;
      border-radius: 5px;
      background: #dcfce7;
      border: 1px solid #bbf7d0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.35s ease;
      flex-shrink: 0;
    }
    .anim-file-box svg {
      width: 10px;
      height: 10px;
      stroke: #ffffff;
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    .anim-file-price {
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: var(--muted);
    }

    /* Animation keyframes looping smoothly through 3 items */
    @keyframes selectItem1 {
      0%, 28% {
        background: #f0fdf4;
        border-color: #86efac;
        box-shadow: 0 2px 8px rgba(34, 197, 94, 0.12);
      }
      33%, 95% {
        background: #ffffff;
        border-color: var(--line);
        box-shadow: none;
      }
      100% {
        background: #f0fdf4;
        border-color: #86efac;
        box-shadow: 0 2px 8px rgba(34, 197, 94, 0.12);
      }
    }
    @keyframes boxItem1 {
      0%, 28% {
        background: #22c55e;
        border-color: #22c55e;
      }
      33%, 95% {
        background: #dcfce7;
        border-color: #bbf7d0;
      }
      100% {
        background: #22c55e;
        border-color: #22c55e;
      }
    }
    @keyframes checkItem1 {
      0%, 28% { opacity: 1; transform: scale(1); }
      33%, 95% { opacity: 0; transform: scale(0.6); }
      100% { opacity: 1; transform: scale(1); }
    }

    @keyframes selectItem2 {
      0%, 28% {
        background: #ffffff;
        border-color: var(--line);
        box-shadow: none;
      }
      33%, 61% {
        background: #f0fdf4;
        border-color: #86efac;
        box-shadow: 0 2px 8px rgba(34, 197, 94, 0.12);
      }
      66%, 100% {
        background: #ffffff;
        border-color: var(--line);
        box-shadow: none;
      }
    }
    @keyframes boxItem2 {
      0%, 28% {
        background: #dcfce7;
        border-color: #bbf7d0;
      }
      33%, 61% {
        background: #22c55e;
        border-color: #22c55e;
      }
      66%, 100% {
        background: #dcfce7;
        border-color: #bbf7d0;
      }
    }
    @keyframes checkItem2 {
      0%, 28% { opacity: 0; transform: scale(0.6); }
      33%, 61% { opacity: 1; transform: scale(1); }
      66%, 100% { opacity: 0; transform: scale(0.6); }
    }

    @keyframes selectItem3 {
      0%, 61% {
        background: #ffffff;
        border-color: var(--line);
        box-shadow: none;
      }
      66%, 95% {
        background: #f0fdf4;
        border-color: #86efac;
        box-shadow: 0 2px 8px rgba(34, 197, 94, 0.12);
      }
      100% {
        background: #ffffff;
        border-color: var(--line);
        box-shadow: none;
      }
    }
    @keyframes boxItem3 {
      0%, 61% {
        background: #dcfce7;
        border-color: #bbf7d0;
      }
      66%, 95% {
        background: #22c55e;
        border-color: #22c55e;
      }
      100% {
        background: #dcfce7;
        border-color: #bbf7d0;
      }
    }
    @keyframes checkItem3 {
      0%, 61% { opacity: 0; transform: scale(0.6); }
      66%, 95% { opacity: 1; transform: scale(1); }
      100% { opacity: 0; transform: scale(0.6); }
    }

    .row-anim-1 { animation: selectItem1 6s infinite ease-in-out; }
    .row-anim-1 .anim-file-box { animation: boxItem1 6s infinite ease-in-out; }
    .row-anim-1 .anim-file-box svg { animation: checkItem1 6s infinite ease-in-out; }

    .row-anim-2 { animation: selectItem2 6s infinite ease-in-out; }
    .row-anim-2 .anim-file-box { animation: boxItem2 6s infinite ease-in-out; }
    .row-anim-2 .anim-file-box svg { animation: checkItem2 6s infinite ease-in-out; }

    .row-anim-3 { animation: selectItem3 6s infinite ease-in-out; }
    .row-anim-3 .anim-file-box { animation: boxItem3 6s infinite ease-in-out; }
    .row-anim-3 .anim-file-box svg { animation: checkItem3 6s infinite ease-in-out; }

    /* STEP 02: SVG QR CODE WITH LASER BEAM & GLOW */
    .qr-scan-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
    }
    .qr-frame {
      position: relative;
      width: 90px;
      height: 90px;
      background: #ffffff;
      border-radius: 12px;
      padding: 7px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.04);
      border: 1px solid #e2e8f0;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-matrix-svg {
      width: 100%;
      height: 100%;
    }
    .qr-scanner-line {
      position: absolute;
      left: 0;
      right: 0;
      height: 26px;
      pointer-events: none;
      animation: scanLaserCycle 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
    .qr-laser-glow {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 24px;
      background: linear-gradient(180deg, rgba(37, 99, 235, 0.25) 0%, rgba(37, 99, 235, 0) 100%);
    }
    .qr-laser-beam {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: #2563eb;
      box-shadow: 0 0 10px 2px rgba(37, 99, 235, 0.65);
    }
    @keyframes scanLaserCycle {
      0% { top: -24px; opacity: 0; }
      12% { opacity: 1; }
      85% { opacity: 1; }
      100% { top: calc(100% - 2px); opacity: 0; }
    }
    .qr-amount-text {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text);
      letter-spacing: -0.01em;
      margin-top: 10px;
      font-family: var(--font-main);
    }
    .qr-sub-text {
      font-size: 0.72rem;
      color: var(--muted);
      margin-top: 2px;
    }

    /* STEP 03: NOTIFICATION CARD & SLIDE-UP COPY LINK PILL */
    .receive-anim-container {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .email-notify-card {
      background: #ffffff;
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    }
    .email-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #fdf2f8;
      border: 1px solid #fbcfe8;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .email-body {
      display: flex;
      flex-direction: column;
    }
    .email-sender {
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text);
      line-height: 1.2;
    }
    .email-snippet {
      font-size: 0.75rem;
      color: var(--muted);
      margin-top: 2px;
    }
    .file-pill-incoming {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: var(--radius-full);
      padding: 8px 14px;
      font-size: 0.78rem;
      font-weight: 500;
      color: #15803d;
      box-shadow: 0 4px 14px rgba(21, 128, 61, 0.12);
      animation: slideUpCopyLink 3.6s cubic-bezier(0.16, 1, 0.3, 1) infinite;
    }
    .file-icon-sheets {
      width: 16px;
      height: 16px;
      background: #dcfce7;
      border-radius: 4px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #15803d;
      font-size: 0.7rem;
      font-weight: 600;
      flex-shrink: 0;
    }
    @keyframes slideUpCopyLink {
      0%, 15% {
        opacity: 0;
        transform: translateY(18px) scale(0.96);
      }
      25%, 82% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      92%, 100% {
        opacity: 0;
        transform: translateY(-8px) scale(0.98);
      }
    }

    /* 4-PILLAR VALUE SECTION (USP) */
    .usp-section {
      padding: 80px 0;
      background: #ffffff;
      border-top: 1px solid var(--line-subtle);
    }
    .usp-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-top: 40px;
    }
    .usp-card {
      background: #ffffff;
      border: 1px solid var(--line-subtle);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
    }
    .usp-icon-badge {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: var(--bg-alt);
      border: 1px solid var(--line-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      margin-bottom: 14px;
    }
    .usp-tagline {
      font-size: 0.72rem;
      font-weight: 500;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .usp-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 14px;
      line-height: 1.3;
      color: var(--text);
    }
    .usp-list {
      list-style: none;
      font-size: 0.82rem;
      color: var(--muted);
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 24px;
    }
    .usp-list li {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .usp-list li::before {
      content: "✓";
      color: var(--mint-primary);
      font-weight: 600;
    }
    .usp-footer-visual {
      margin-top: auto;
      padding-top: 16px;
      border-top: 1px dashed var(--line);
    }

    /* CUSTOM SERVICE BANNER */
    .custom-banner {
      margin: 40px 0 80px;
      background: linear-gradient(118deg, rgb(228, 231, 245) 0%, rgb(240, 253, 244) 100%);
      border: none;
      border-radius: 24px;
      padding: 52px 48px;
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 36px;
      align-items: center;
    }
    .custom-pill {
      background: #ffffff;
      color: var(--mint-primary);
      border: 1px solid var(--mint-border);
      font-size: 0.75rem;
      font-weight: 500;
      padding: 3px 12px;
      border-radius: var(--radius-full);
      display: inline-block;
      margin-bottom: 12px;
    }
    .custom-title {
      font-size: 1.9rem;
      font-weight: 600;
      line-height: 1.2;
      letter-spacing: -1.03px;
      margin-bottom: 14px;
      color: var(--text);
    }
    .custom-desc {
      font-size: 0.92rem;
      color: var(--muted);
      margin-bottom: 20px;
      line-height: 1.5;
    }
    .custom-ticks {
      list-style: none;
      font-size: 0.85rem;
      color: var(--text);
      display: flex;
      gap: 20px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .custom-ticks li::before {
      content: "✓ ";
      color: var(--mint-primary);
      font-weight: 600;
    }

    /* DISCOUNT TICKET COUPON */
    .ticket-section {
      margin: 20px 0 80px;
    }
    .coupon-ticket {
      background: #f5f5f5;
      border: none;
      border-radius: 24px;
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      position: relative;
      overflow: hidden;
      box-shadow: none;
    }
    .ticket-left {
      padding: 48px 44px;
      border-right: 2px dashed #e2e8f0;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .ticket-code-pill {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      background: #ffffff;
      padding: 6px 8px 6px 18px;
      border-radius: var(--radius-full);
      font-family: var(--font-mono);
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text);
      margin: 14px 0 20px;
      width: fit-content;
      border: none;
    }
    .ticket-copy-btn {
      background: transparent;
      color: #6a5ae0;
      border: 2px dashed #6a5ae0;
      font-size: 0.78rem;
      font-weight: 500;
      padding: 6px 14px;
      border-radius: var(--radius-full);
      transition: all 0.15s ease;
      cursor: pointer;
    }
    .ticket-copy-btn:hover {
      background: rgba(106, 90, 224, 0.08);
    }
    .ticket-right {
      background: transparent;
      padding: 48px 44px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      margin-bottom: 8px;
      color: var(--muted);
    }
    .summary-total {
      border-top: 1px solid var(--line);
      padding-top: 12px;
      margin-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--text);
      font-family: var(--font-mono);
    }

    /* FAQ ACCORDION */
    .faq-section {
      padding: 60px 0 90px;
    }
    .faq-grid {
      display: grid;
      grid-template-columns: 1fr 1.5fr;
      gap: 48px;
    }
    .faq-list {
      display: flex;
      flex-direction: column;
    }
    .faq-item {
      background: transparent;
      border: none;
      border-radius: 0;
      padding: 24px 0;
      border-bottom: 1px solid var(--line-subtle);
    }
    .faq-item:first-child {
      padding-top: 0;
    }
    .faq-item:last-child {
      border-bottom: none;
    }
    .faq-question {
      font-size: 18px;
      font-weight: 600;
      color: #181925;
      margin-bottom: 8px;
      line-height: 1.4;
    }
    .faq-answer {
      font-size: 16px;
      color: #333333;
      line-height: 25.6px;
      font-weight: 400;
    }

    /* FOOTER */
    .footer {
      background: #ffffff;
      border-top: 1px solid var(--line-subtle);
      padding: 60px 0 30px;
    }
    .social-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      margin-bottom: 60px;
      padding-bottom: 32px;
      border-bottom: 1px solid var(--line-subtle);
    }
    .social-card {
      background: transparent;
      border: none;
      border-radius: 0;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .social-count {
      font-weight: 600;
      font-size: 1.15rem;
      color: #181925;
    }
    .social-name {
      font-size: 0.78rem;
      color: #666666;
    }
    .social-card a, .social-card span.social-platform {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.85rem;
      font-weight: 500;
      color: #181925;
      transition: color 0.15s;
    }
    .social-card a:hover {
      color: var(--mint-primary);
    }
    .footer-columns {
      display: grid;
      grid-template-columns: 1.2fr 1fr 1fr 1fr;
      gap: 40px;
      margin-bottom: 50px;
    }
    .footer-title {
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
      color: var(--text);
    }
    .footer-links {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-size: 0.85rem;
      color: var(--muted);
    }
    .footer-bottom {
      border-top: 1px solid var(--line-subtle);
      padding-top: 24px;
      display: flex;
      justify-content: space-between;
      font-size: 0.78rem;
      color: var(--muted);
      flex-wrap: wrap;
      gap: 12px;
    }
    .footer-bottom-links {
      display: flex;
      gap: 16px;
    }

    /* FLOATING ZALO BUTTON */
    .floating-zalo {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99;
      background: #0068ff;
      color: #ffffff;
      padding: 10px 18px;
      border-radius: var(--radius-full);
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 6px 20px rgba(0, 104, 255, 0.25);
      transition: transform 0.2s;
    }
    .floating-zalo:hover {
      transform: translateY(-2px);
    }

    @media (max-width: 900px) {
      .hero-grid, .custom-banner, .coupon-ticket, .faq-grid { grid-template-columns: 1fr; }
      .stats-grid, .usp-grid, .social-strip, .product-grid, .steps-grid { grid-template-columns: 1fr; }
      .footer-columns { grid-template-columns: 1fr 1fr; }
      .nav-links { display: none; }
      .hero-title { font-size: 2.2rem; }
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <header class="header">
    <div class="container header-inner">
      <div class="logo">
        NourishGroup
        <span class="logo-badge">Sheets & Apps</span>
      </div>
      <ul class="nav-links">
        <li><a href="#" class="active">Trang chủ</a></li>
        <li><a href="#catalog">Template ▾</a></li>
        <li><a href="#faq">Hỗ trợ ▾</a></li>
        <li><a href="#custom" style="color: var(--mint-primary); font-weight: 600;">+ Đặt theo yêu cầu</a></li>
      </ul>
      <div class="nav-actions">
        <button class="search-btn" aria-label="Tìm kiếm">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </button>
        <button class="cart-btn" id="openCart">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
          Giỏ hàng (<span id="cartCount">0</span>)
        </button>
      </div>
    </div>
  </header>

  <!-- HERO SECTION -->
  <section class="hero">
    <div class="container hero-grid">
      <div class="hero-content">
        <div class="hero-pill">
          <span class="badge-new">Mới</span>
          Cần file riêng? Bên mình dựng
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </div>
        <h1 class="hero-title">Google Sheets và Web App mua một lần, dùng mãi mãi</h1>
        <p class="hero-desc">Hơn chục mảng việc đều có file sẵn, từ bán hàng kho vận tới kế toán, nhân sự. Mở ra là dùng, không cần biết công thức. Hỗ trợ tuỳ chỉnh theo yêu cầu.</p>
        <div class="hero-cta">
          <a href="#catalog" class="btn-primary">Xem mẫu file</a>
          <a href="#custom" class="btn-secondary">Đặt file riêng</a>
        </div>
        <p class="hero-coupon-hint">Đơn từ 160k, nhập mã <strong>NOURISH</strong> để giảm 10%.</p>
      </div>

      <!-- INTERACTIVE SHEET MOCKUP -->
      <div class="hero-mockup-wrapper">
        <div class="sheet-card">
          <span class="sheet-status-tag">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Tồn kho tự trừ theo đơn
          </span>
          <div class="sheet-header-bar">
            <div class="sheet-title">
              <span style="color:#16a34a; font-weight:600;">⊞</span> Quản lý bán hàng 2026
            </div>
            <span class="google-sheets-badge">Google Sheets</span>
          </div>
          <div class="fx-bar">
            fx =SUMIFS(ThanhTien; Thang; $A2)
          </div>
          <table class="sheet-table">
            <thead>
              <tr><th>Ngày</th><th>Khách</th><th>Sản phẩm</th><th>Thành tiền</th></tr>
            </thead>
            <tbody>
              <tr><td>02/09</td><td>Chị Nhung</td><td>File bán hàng</td><td>599.000</td></tr>
              <tr><td>03/09</td><td>Anh Tùng</td><td>File chấm công</td><td>150.000</td></tr>
              <tr><td>05/09</td><td>Chị Tuyền</td><td>File kho</td><td>95.000</td></tr>
              <tr><td colspan="3" style="text-align:right; font-weight:600;">Tổng</td><td class="total-cell">844.000</td></tr>
            </tbody>
          </table>
          <div class="sheet-tabs">
            <span class="sheet-tab active">Đơn hàng</span>
            <span class="sheet-tab">Kho</span>
            <span class="sheet-tab">Báo cáo</span>
          </div>
        </div>
        <!-- FLOATING REVENUE MINI CHART -->
        <div class="floating-revenue-card">
          <div class="revenue-title">Doanh thu 7 tháng gần nhất</div>
          <div class="bar-chart">
            <div class="chart-col" style="height: 35%;"></div>
            <div class="chart-col" style="height: 55%;"></div>
            <div class="chart-col" style="height: 40%;"></div>
            <div class="chart-col" style="height: 75%;"></div>
            <div class="chart-col" style="height: 65%;"></div>
            <div class="chart-col" style="height: 90%;"></div>
            <div class="chart-col" style="height: 100%;"></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- STATS STRIP -->
  <section class="stats-section">
    <div class="container stats-grid">
      <div class="stat-card">
        <div class="stat-number">60.000+</div>
        <div class="stat-label">Lượt theo dõi trên TikTok, Facebook và YouTube</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">30+</div>
        <div class="stat-label">Mẫu file cho bán hàng, kho, nhân sự và học tập</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">Từ 2024</div>
        <div class="stat-label">Bên mình bán file và hỗ trợ khách qua Zalo</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" style="color: var(--mint-primary);">0đ</div>
        <div class="stat-label">Phí duy trì hằng tháng cho mọi file</div>
      </div>
    </div>
  </section>

  <!-- CATALOG & FILTER SECTION -->
  <section class="catalog-section" id="catalog">
    <div class="container">
      <span class="section-tag">Thư viện template</span>
      <h2 class="section-title">Chọn file theo việc bạn đang làm</h2>

      <div class="filter-search-row">
        <div class="category-tabs">
          <button class="cat-tab active">Tất cả <span class="count">28</span></button>
          <button class="cat-tab">Kinh doanh <span class="count">8</span></button>
          <button class="cat-tab">Nhân sự <span class="count">4</span></button>
          <button class="cat-tab">Công việc <span class="count">6</span></button>
          <button class="cat-tab">Marketing <span class="count">3</span></button>
          <button class="cat-tab">Kế toán <span class="count">2</span></button>
          <button class="cat-tab">Phát triển bản thân <span class="count">5</span></button>
        </div>
        <div class="quick-search-box">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="Lọc nhanh: kho, chấm công..." />
        </div>
      </div>

      <!-- PRODUCT GRID -->
      <div class="product-grid">
        <!-- Item 1 -->
        <div class="product-card">
          <div class="product-thumbnail">
            <span class="badge-type webapp">Web App</span>
            <div class="mock-browser">
              <div class="browser-top"><div class="dot"></div><div class="dot"></div></div>
              <div class="browser-body">
                <div class="mock-row" style="width: 60%;"></div>
                <div class="mock-grid"><div class="mock-col"></div><div class="mock-col"></div></div>
              </div>
            </div>
            <span class="badge-video">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Video
            </span>
          </div>
          <div class="product-info">
            <h3 class="product-name">Quản lý bán hàng, xuất nhập tồn và công nợ tự động – Web App</h3>
            <div class="price-row">
              <span class="price-current">599.000 đ</span>
            </div>
            <button class="btn-add-cart">Thêm vào giỏ</button>
          </div>
        </div>

        <!-- Item 2 -->
        <div class="product-card">
          <div class="product-thumbnail">
            <span class="badge-type gsheets">GSheets</span>
            <div class="mock-browser">
              <div class="browser-top"><div class="dot"></div><div class="dot"></div></div>
              <div class="browser-body">
                <div class="mock-row"></div>
                <div class="mock-row" style="background:#bbf7d0;"></div>
              </div>
            </div>
            <span class="badge-video">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Video
            </span>
          </div>
          <div class="product-info">
            <h3 class="product-name">Quản lý và tạo hợp đồng mua bán, hợp đồng kinh tế tự động – Google Sheets</h3>
            <div class="price-row">
              <span class="price-current">150.000 đ</span>
              <span class="price-old">350.000 đ</span>
            </div>
            <button class="btn-add-cart">Thêm vào giỏ</button>
          </div>
        </div>

        <!-- Item 3 -->
        <div class="product-card">
          <div class="product-thumbnail">
            <span class="badge-type gsheets">GSheets</span>
            <div class="mock-browser">
              <div class="browser-top"><div class="dot"></div><div class="dot"></div></div>
              <div class="browser-body">
                <div class="mock-row" style="width: 80%;"></div>
                <div class="mock-grid"><div class="mock-col" style="background:#fee2e2;"></div></div>
              </div>
            </div>
            <span class="badge-video">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Video
            </span>
          </div>
          <div class="product-info">
            <h3 class="product-name">Quản lý học sinh & học phí 2.0 – Thu theo tháng, theo khoá, phiếu thu & nhắc phí</h3>
            <div class="price-row">
              <span class="price-current">150.000 đ</span>
              <span class="price-old">250.000 đ</span>
            </div>
            <button class="btn-add-cart">Thêm vào giỏ</button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- 3 STEPS SECTION -->
  <section class="steps-section">
    <div class="container">
      <div class="center-header">
        <span class="section-tag">Cách mua</span>
        <h2 class="section-title">Ba bước, xong trong vài phút</h2>
        <p style="color: var(--muted); font-size: 0.95rem;">Không cần nhắn tin chờ tư vấn, không cần gửi ảnh chuyển khoản.</p>
      </div>

      <div class="steps-grid">
        <!-- Step 1 -->
        <div class="step-card">
          <div class="step-mock">
            <div class="file-select-anim">
              <div class="anim-file-row row-anim-1">
                <div class="anim-file-left">
                  <span class="anim-file-box check-anim-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span>Quản lý bán hàng</span>
                </div>
                <span class="anim-file-price">599k</span>
              </div>
              <div class="anim-file-row row-anim-2">
                <div class="anim-file-left">
                  <span class="anim-file-box check-anim-2">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span>Chấm công & lương</span>
                </div>
                <span class="anim-file-price">150k</span>
              </div>
              <div class="anim-file-row row-anim-3">
                <div class="anim-file-left">
                  <span class="anim-file-box check-anim-3">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span>Quản lý kho</span>
                </div>
                <span class="anim-file-price">95k</span>
              </div>
            </div>
          </div>
          <div class="step-number">01</div>
          <h3 class="step-title">Chọn file</h3>
          <p class="step-text">Mỗi mẫu có ảnh chụp bên trong và nút xem thử để bạn mở ra xem trước khi mua.</p>
        </div>

        <!-- Step 2 -->
        <div class="step-card">
          <div class="step-mock">
            <div class="qr-scan-container">
              <div class="qr-frame">
                <!-- SVG Vector QR Code -->
                <svg class="qr-matrix-svg" viewBox="0 0 100 100" fill="none">
                  <!-- Corner TL -->
                  <rect x="6" y="6" width="28" height="28" rx="4" stroke="#181925" stroke-width="4.5"/>
                  <rect x="14" y="14" width="12" height="12" rx="2" fill="#181925"/>
                  <!-- Corner TR -->
                  <rect x="66" y="6" width="28" height="28" rx="4" stroke="#181925" stroke-width="4.5"/>
                  <rect x="74" y="14" width="12" height="12" rx="2" fill="#181925"/>
                  <!-- Corner BL -->
                  <rect x="6" y="66" width="28" height="28" rx="4" stroke="#181925" stroke-width="4.5"/>
                  <rect x="14" y="74" width="12" height="12" rx="2" fill="#181925"/>
                  
                  <!-- Internal Grid Lines / Modules -->
                  <rect x="42" y="8" width="5" height="14" fill="#181925"/>
                  <rect x="53" y="15" width="5" height="18" fill="#181925"/>
                  
                  <rect x="8" y="42" width="84" height="4" fill="#181925" opacity="0.85"/>
                  <rect x="8" y="52" width="84" height="4" fill="#181925" opacity="0.85"/>
                  <rect x="8" y="62" width="84" height="4" fill="#181925" opacity="0.85"/>
                  
                  <rect x="42" y="38" width="4" height="48" fill="#181925" opacity="0.85"/>
                  <rect x="52" y="38" width="4" height="48" fill="#181925" opacity="0.85"/>
                  <rect x="62" y="38" width="4" height="48" fill="#181925" opacity="0.85"/>
                  <rect x="72" y="44" width="4" height="42" fill="#181925" opacity="0.85"/>
                  <rect x="82" y="44" width="4" height="42" fill="#181925" opacity="0.85"/>

                  <!-- Bottom Right Detail -->
                  <rect x="70" y="70" width="10" height="10" rx="1" fill="#181925"/>
                  <rect x="84" y="84" width="8" height="8" rx="1" fill="#181925"/>
                </svg>
                <!-- Glowing laser scanner beam -->
                <div class="qr-scanner-line">
                  <div class="qr-laser-glow"></div>
                  <div class="qr-laser-beam"></div>
                </div>
              </div>
              <div class="qr-amount-text">599.000 đ</div>
              <div class="qr-sub-text">Nội dung điền sẵn</div>
            </div>
          </div>
          <div class="step-number" style="color: #2563eb;">02</div>
          <h3 class="step-title">Quét mã QR</h3>
          <p class="step-text">Màn hình hiện sẵn số tiền và nội dung, hệ thống tự đối soát nên không phải gửi ảnh.</p>
        </div>

        <!-- Step 3 -->
        <div class="step-card">
          <div class="step-mock">
            <div class="receive-anim-container">
              <!-- Thông báo Email -->
              <div class="email-notify-card">
                <div class="email-avatar">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>
                </div>
                <div class="email-body">
                  <span class="email-sender">Optimate</span>
                  <span class="email-snippet">File của bạn đã sẵn sàng</span>
                </div>
              </div>
              <!-- Slide-up Copy Link Pill (#15803d) -->
              <div class="file-pill-incoming">
                <span class="file-icon-sheets">⊞</span>
                <span>Sao chép link bản sao</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:auto;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </div>
            </div>
          </div>
          <div class="step-number" style="color: #ec4899;">03</div>
          <h3 class="step-title">Nhận file qua email</h3>
          <p class="step-text">Thanh toán xong là file tự gửi về, kèm hướng dẫn tạo bản sao để dùng ngay.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- 4-PILLAR VALUE SECTION (USP) -->
  <section class="usp-section">
    <div class="container">
      <span class="section-tag">Bạn được gì</span>
      <h2 class="section-title">Không phải phần mềm cồng kềnh, chỉ là một file làm đúng việc</h2>
      <p style="color: var(--muted); max-width: 650px; font-size: 0.95rem;">Bên mình dựng sẵn phần khó nhất: công thức, liên kết giữa các sheet và báo cáo. Bạn mở ra, nhập số của mình vào là chạy.</p>

      <div class="usp-grid">
        <div class="usp-card">
          <div class="usp-icon-badge" style="color: var(--mint-primary);">$</div>
          <div class="usp-tagline">Chi phí</div>
          <h3 class="usp-title">Mua một lần, dùng mãi mãi</h3>
          <ul class="usp-list">
            <li>Không phí hằng tháng</li>
            <li>Không giới hạn thời gian dùng</li>
            <li>File nằm trong Google Drive của bạn</li>
          </ul>
          <div class="usp-footer-visual">
            <div style="font-size: 0.72rem; font-weight:600; color: var(--muted); margin-bottom: 4px;">12 tháng tới: <strong style="color: var(--mint-primary); font-weight:600;">0 đ/tháng</strong></div>
            <div style="display:flex; gap: 4px; align-items:center;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background: var(--mint-primary);"></span>
              <div style="flex:1; height: 4px; background: #e2e8f0; border-radius: 2px;"></div>
            </div>
          </div>
        </div>

        <div class="usp-card">
          <div class="usp-icon-badge" style="color: #3b82f6;">▷</div>
          <div class="usp-tagline">Bắt đầu</div>
          <h3 class="usp-title">Mở ra là dùng được ngay</h3>
          <ul class="usp-list">
            <li>Công thức và báo cáo dựng sẵn</li>
            <li>Có dữ liệu mẫu để xem trước</li>
            <li>Gửi kèm hướng dẫn tạo bản sao</li>
          </ul>
          <div class="usp-footer-visual">
            <div style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--muted); background: #fff; padding: 4px; border-radius: 4px; border: 1px solid var(--line);">
              fx =SUMIFS(...)
            </div>
          </div>
        </div>

        <div class="usp-card">
          <div class="usp-icon-badge" style="color: #ec4899;">⊞</div>
          <div class="usp-tagline">Nền tảng</div>
          <h3 class="usp-title">Chạy thẳng trên Google Sheets</h3>
          <ul class="usp-list">
            <li>Không phải cài phần mềm</li>
            <li>Máy cấu hình yếu vẫn chạy</li>
            <li>Mở được trên cả điện thoại</li>
          </ul>
          <div class="usp-footer-visual">
            <div style="font-size: 0.72rem; color: var(--muted);">Laptop & Điện thoại</div>
          </div>
        </div>

        <div class="usp-card">
          <div class="usp-icon-badge" style="color: #f59e0b;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          </div>
          <div class="usp-tagline">Tùy biến</div>
          <h3 class="usp-title">Sửa được theo cách bạn làm</h3>
          <ul class="usp-list">
            <li>Toàn quyền sửa công thức</li>
            <li>Thêm bớt cột theo nhu cầu</li>
            <li>Cần riêng thì bên mình dựng giúp</li>
          </ul>
          <div class="usp-footer-visual">
            <div style="font-size: 0.72rem; font-weight:600; color: var(--mint-primary); border: 1px dashed var(--mint-border); padding: 4px 8px; border-radius: 4px; text-align: center;">
              + Thêm cột của bạn
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CUSTOM SERVICE BANNER -->
  <section class="container" id="custom">
    <div class="custom-banner">
      <div>
        <span class="custom-pill">Đặt theo yêu cầu</span>
        <h2 class="custom-title">Chưa có mẫu nào hợp với cách bạn đang làm?</h2>
        <p class="custom-desc">Bên mình nhận dựng riêng file Google Sheets hoặc Web App theo đúng quy trình bạn đang chạy. Bàn giao kèm hướng dẫn, dùng trọn đời.</p>
        <ul class="custom-ticks">
          <li>Tư vấn và báo giá miễn phí</li>
          <li>Chốt thời gian trước khi bắt đầu</li>
          <li>Chỉnh sửa tới khi bạn thấy đúng ý</li>
        </ul>
        <div style="display:flex; gap: 14px; align-items:center;">
          <a href="https://zalo.me" target="_blank" class="btn-primary" style="background:#0068ff; box-shadow:none; display:inline-flex; align-items:center; gap:6px;">
            Nhắn Zalo tư vấn
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7H7M17 7V17"/></svg>
          </a>
          <a href="#" style="font-size: 0.9rem; font-weight: 600; color: var(--text);">Xem chi tiết dịch vụ</a>
        </div>
      </div>
      <div>
        <div style="background: #ffffff; border: 1px solid rgba(226, 232, 240, 0.8); border-radius: 16px; padding: 24px; box-shadow: var(--shadow-sm);">
          <div style="font-size: 0.82rem; font-weight: 600; color: #16a34a; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Dựng đúng quy trình của bạn
          </div>
          <div style="font-size: 0.75rem; color: var(--muted); border-bottom: 1px solid var(--line-subtle); padding-bottom: 10px; margin-bottom: 12px;">File riêng của bạn (Google Sheets)</div>
          <div style="background: var(--bg-alt); padding: 14px; border-radius: 10px; font-size: 0.78rem;">
            <div style="color: var(--text); font-weight: 500;">Nhập đơn → Kho → Công nợ</div>
            <button style="margin-top: 10px; background: var(--mint-primary); color: white; padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 500;">Lưu vào Sheets</button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- COUPON VOUCHER TICKET -->
  <section class="container ticket-section">
    <div class="coupon-ticket">
      <div class="ticket-left">
        <span class="section-tag" style="margin-bottom: 8px;">Mã giảm giá</span>
        <h2 class="section-title" style="font-size: 1.8rem; font-weight: 600; letter-spacing: -1.03px; margin-bottom: 8px;">Giảm 10% cho đơn từ 160k</h2>
        <div style="font-size: 0.82rem; color: var(--muted);">Chỉ đến ngày 29/11/2026</div>
        <div class="ticket-code-pill">
          <span>NOURISH</span>
          <button class="ticket-copy-btn" onclick="navigator.clipboard.writeText('NOURISH'); alert('Đã sao chép mã NOURISH!');">Sao chép</button>
        </div>
        <p style="font-size: 0.82rem; color: var(--muted);">Nhập mã ở bước thanh toán, hệ thống tự trừ 10%.</p>
      </div>
      <div class="ticket-right">
        <div class="summary-row"><span>Đơn hàng của bạn</span><span>2 file</span></div>
        <div class="summary-row"><span>Quản lý bán hàng</span><span>599.000</span></div>
        <div class="summary-row"><span>Quản lý kho</span><span>95.000</span></div>
        <div class="summary-row"><span>Tạm tính</span><span>694.000</span></div>
        <div class="summary-row" style="color: var(--mint-primary);"><span>Mã NOURISH</span><span>-69.400</span></div>
        <div class="summary-total"><span>Thanh toán</span><span>624.600 đ</span></div>
      </div>
    </div>
  </section>

  <!-- FAQ SECTION -->
  <section class="faq-section" id="faq">
    <div class="container faq-grid">
      <div>
        <span class="section-tag">Trước khi mua</span>
        <h2 class="section-title">Những câu khách hay hỏi</h2>
      </div>
      <div class="faq-list">
        <div class="faq-item">
          <p class="faq-question">Khi sử dụng file template, vấn đề bảo mật sẽ như thế nào?</p>
          <p class="faq-answer">Bên mình dựng file trên Google Sheets. Khi bạn tạo một bản sao, file nằm trong tài khoản Google của bạn. Không có ai có quyền truy cập được, trừ khi bạn tự share quyền.</p>
        </div>
        <div class="faq-item">
          <p class="faq-question">Mua file có trả theo từng tháng không, hay mua một lần và xài mãi mãi?</p>
          <p class="faq-answer">Ở bên mình, bạn chỉ cần mua một lần và xài mãi mãi trọn đời.</p>
        </div>
        <div class="faq-item">
          <p class="faq-question">Sau khi mua hàng, mình sử dụng và gặp vấn đề thì giải quyết như thế nào?</p>
          <p class="faq-answer">Bạn nhắn Zalo cho bên mình hoặc gửi email. Đội ngũ kỹ thuật hỗ trợ cả thứ 7 và chủ nhật.</p>
        </div>
        <div class="faq-item">
          <p class="faq-question">Trong file có hướng dẫn sử dụng không?</p>
          <p class="faq-answer">File nào cũng có trang hướng dẫn đi kèm. File phức tạp sẽ có kèm video thao tác thực tế.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="footer">
    <div class="container">
      <!-- SOCIAL STRIP -->
      <div class="social-strip">
        <div class="social-card">
          <div><div class="social-count">59,1K</div><div class="social-name">người theo dõi</div></div>
          <a href="https://tiktok.com" target="_blank" class="social-platform">
            TikTok
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7H7M17 7V17"/></svg>
          </a>
        </div>
        <div class="social-card">
          <div><div class="social-count">2.582</div><div class="social-name">người theo dõi</div></div>
          <a href="https://facebook.com" target="_blank" class="social-platform">
            Facebook
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7H7M17 7V17"/></svg>
          </a>
        </div>
        <div class="social-card">
          <div><div class="social-count">1,72K</div><div class="social-name">lượt đăng ký</div></div>
          <a href="https://youtube.com" target="_blank" class="social-platform">
            YouTube
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7H7M17 7V17"/></svg>
          </a>
        </div>
        <div class="social-card">
          <div><div class="social-count">1.849</div><div class="social-name">người theo dõi</div></div>
          <a href="https://threads.net" target="_blank" class="social-platform">
            Threads
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17L17 7H7M17 7V17"/></svg>
          </a>
        </div>
      </div>

      <div class="footer-columns">
        <div>
          <div class="logo" style="margin-bottom: 12px;">NourishGroup</div>
          <p style="font-size: 0.85rem; color: var(--muted); margin-bottom: 16px;">Giải pháp Google Sheets & Web App tự động hoá quy trình làm việc cho cá nhân và doanh nghiệp.</p>
        </div>
        <div>
          <h4 class="footer-title">Liên hệ</h4>
          <ul class="footer-links">
            <li>Hotline: 0867 738 365</li>
            <li>Email: hotro@nourishgroup.vn</li>
            <li>Đà Nẵng & TP. Hồ Chí Minh</li>
          </ul>
        </div>
        <div>
          <h4 class="footer-title">Danh mục</h4>
          <ul class="footer-links">
            <li>Tất cả template</li>
            <li>Kinh doanh & Bán hàng</li>
            <li>Nhân sự & Chấm công</li>
            <li>Kế toán & Thu chi</li>
          </ul>
        </div>
        <div>
          <h4 class="footer-title">Chính sách</h4>
          <ul class="footer-links">
            <li>Điều khoản sử dụng</li>
            <li>Bảo mật thông tin</li>
            <li>Chính sách giao hàng</li>
            <li>Hỗ trợ & bảo hành</li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <div>© 2026 NourishGroup. Nền tảng tự động hoá trên Google Sheets.</div>
        <div class="footer-bottom-links">
          <a href="#">Điều khoản</a>
          <a href="#">Bảo mật</a>
          <a href="#">Giao hàng</a>
        </div>
      </div>
    </div>
  </footer>

  <!-- FLOATING ZALO -->
  <a href="https://zalo.me" target="_blank" class="floating-zalo">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    <span>Nhắn Zalo</span>
  </a>

</body>
</html>
`;

fs.writeFileSync(targetPath, refactoredHTML, 'utf8');
console.log('Successfully updated nourishgroup.html');
