/**
 * INDEPENDENT FORENSIC AUDIT & ADVERSARIAL TEST SUITE
 * Auditor: teamwork_auditor (auditor_m3_1)
 * Target Work Products:
 *   - STANDARDS_TEMPLATE/CONGNO_Index.html
 *   - STANDARDS_TEMPLATE/CONGNO_Code.gs
 */

const fs = require('fs');
const vm = require('vm');
const path = require('path');

console.log('======================================================================');
console.log('>>> RUNNING INDEPENDENT FORENSIC INTEGRITY AUDIT SUITE <<<');
console.log('======================================================================\n');

let passCount = 0;
let failCount = 0;
const findings = [];

function auditAssert(condition, checkName, evidence) {
  if (condition) {
    console.log(`[PASS] ${checkName}`);
    passCount++;
  } else {
    console.error(`[FAIL - INTEGRITY VIOLATION] ${checkName}`);
    console.error(`       Evidence: ${evidence}`);
    findings.push({ checkName, evidence });
    failCount++;
  }
}

// -----------------------------------------------------------------------------
// CHECK 1: CODE STANDARDS COMPLIANCE & STATIC ANALYSIS
// -----------------------------------------------------------------------------
console.log('--- CHECK 1: Code Standards Compliance & Title Exact Match ---');

const htmlPath = path.resolve('STANDARDS_TEMPLATE/CONGNO_Index.html');
const gsPath = path.resolve('STANDARDS_TEMPLATE/CONGNO_Code.gs');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const gsContent = fs.readFileSync(gsPath, 'utf8');

const EXPECTED_TITLE = 'QUẢN LÝ CÔNG NỢ KHÁCH HÀNG & NCC — WEB APP v1.0 — FILE ĐI LÀM';

// 1.1 Title Exact Match
const htmlTitleMatch = htmlContent.match(/<title>([^<]+)<\/title>/);
auditAssert(
  htmlTitleMatch && htmlTitleMatch[1] === EXPECTED_TITLE,
  'CONGNO_Index.html title exact match',
  `Found: "${htmlTitleMatch ? htmlTitleMatch[1] : 'NONE'}"`
);

const gsTitleMatch = gsContent.match(/var APP_TITLE = "([^"]+)";/);
auditAssert(
  gsTitleMatch && gsTitleMatch[1] === EXPECTED_TITLE,
  'CONGNO_Code.gs APP_TITLE exact match',
  `Found: "${gsTitleMatch ? gsTitleMatch[1] : 'NONE'}"`
);

// 1.2 Single Visible Tab Compliance
const hasLockAndHide = gsContent.includes('function lockAndHideDatabaseSheets()');
const hidesDBSheets = gsContent.includes("sh.hideSheet()");
const showsHDSD = gsContent.includes("sh.getName() === SHEETS.HDSD") || gsContent.includes("name === SHEETS.HDSD");
const hasMintButton = gsContent.includes("sHDSD.getRange('B2:D3')") && gsContent.includes("#059669");

auditAssert(
  hasLockAndHide && hidesDBSheets && showsHDSD && hasMintButton,
  'Single Visible Tab compliance in CONGNO_Code.gs (lock & hide DB_*, show HDSD with B2:D3 Mint button)',
  `hasLockAndHide: ${hasLockAndHide}, hidesDBSheets: ${hidesDBSheets}, showsHDSD: ${showsHDSD}, hasMintButton: ${hasMintButton}`
);

// 1.3 Drawer Leak Fix
const drawerInitialHidden = /<aside[^>]*id=["']action-drawer["'][^>]*class=["'][^"']*hidden/.test(htmlContent);
const backdropInitialHidden = /<div[^>]*id=["']action-drawer-backdrop["'][^>]*class=["'][^"']*hidden/.test(htmlContent);

auditAssert(
  drawerInitialHidden && backdropInitialHidden,
  'action-drawer & backdrop have hidden class initially to prevent bottom leak',
  `drawerInitialHidden: ${drawerInitialHidden}, backdropInitialHidden: ${backdropInitialHidden}`
);

// 1.4 No Phantom Templates
const phantomTemplateQuery = htmlContent.includes("template#tpl-mod-dashboard") || htmlContent.includes("tpl-mod-dashboard");
auditAssert(
  !phantomTemplateQuery,
  'No phantom template queries (tpl-mod-dashboard) remaining in codebase',
  `phantomTemplateQuery: ${phantomTemplateQuery}`
);

// -----------------------------------------------------------------------------
// CHECK 2: BACKEND RPC LOGIC & SPREADSHEET MANIPULATION (deleteThanhToan)
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 2: Backend RPC & deleteThanhToan Genuine Manipulation ---');

class MockRange {
  constructor(sheet, row, col, numRows = 1, numCols = 1) {
    this.sheet = sheet;
    this.row = row;
    this.col = col;
    this.numRows = numRows;
    this.numCols = numCols;
  }
  setValue(val) {
    this.sheet._grid[this.row - 1][this.col - 1] = val;
    return this;
  }
  setValues(vals) {
    for (let r = 0; r < vals.length; r++) {
      for (let c = 0; c < vals[r].length; c++) {
        this.sheet._grid[this.row - 1 + r][this.col - 1 + c] = vals[r][c];
      }
    }
    return this;
  }
  merge() { return this; }
  setBackground() { return this; }
  setFontColor() { return this; }
  setFontSize() { return this; }
  setFontWeight() { return this; }
  setHorizontalAlignment() { return this; }
  setVerticalAlignment() { return this; }
}

class MockSheet {
  constructor(name, initialGrid = []) {
    this.name = name;
    this._grid = initialGrid.map(row => [...row]);
  }
  getName() { return this.name; }
  getLastRow() { return this._grid.length; }
  getLastColumn() { return this._grid[0] ? this._grid[0].length : 0; }
  getDataRange() {
    return {
      getValues: () => this._grid.map(r => [...r])
    };
  }
  getRange(row, col, numRows = 1, numCols = 1) {
    return new MockRange(this, row, col, numRows, numCols);
  }
  deleteRow(rowIdx) {
    this._grid.splice(rowIdx - 1, 1);
  }
  appendRow(rowArr) {
    this._grid.push([...rowArr]);
  }
  clear() {
    this._grid = [];
  }
  setTabColor() {}
  setColumnWidth() {}
  setFrozenRows() {}
  showSheet() {}
  hideSheet() {}
  protect() {
    return {
      setDescription: () => ({ setWarningOnly: () => {} })
    };
  }
  getProtections() { return []; }
}

class MockSpreadsheet {
  constructor() {
    this.sheets = {};
  }
  getSheetByName(name) {
    return this.sheets[name] || null;
  }
  insertSheet(name) {
    const s = new MockSheet(name);
    this.sheets[name] = s;
    return s;
  }
  getSheets() {
    return Object.values(this.sheets);
  }
  setActiveSheet() {}
  getActiveSpreadsheet() { return this; }
}

const mockSS = new MockSpreadsheet();

// Populate initial mock data
// DB_PhatSinhNo: [Mã GD, Mã ĐT, Tên ĐT, Loại GD, Số Tiền, Đã Thanh Toán, Còn Lại, Hạn Thanh Toán, Ngày Chứng Từ, Số Hóa Đơn, Ghi Chú, Trạng Thái]
mockSS.sheets['DB_PhatSinhNo'] = new MockSheet('DB_PhatSinhNo', [
  ['Mã GD', 'Mã ĐT', 'Tên ĐT', 'Loại GD', 'Số Tiền', 'Đã Thanh Toán', 'Còn Lại', 'Hạn Thanh Toán', 'Ngày Chứng Từ', 'Số Hóa Đơn', 'Ghi Chú', 'Trạng Thái'],
  ['HOAD-TEST-01', 'KHNG-100', 'Công ty Test A', 'Bán hàng', 50000000, 20000000, 30000000, '20/02/2026', '01/01/2026', 'HD-001', 'Test', 'Còn nợ']
]);

// DB_ThanhToan: [Mã TT, Mã GD, Mã ĐT, Tên ĐT, Loại TT, Số Tiền, Phương Thức, Ngày TT, Ghi Chú, Mã Tham Chiếu]
mockSS.sheets['DB_ThanhToan'] = new MockSheet('DB_ThanhToan', [
  ['Mã TT', 'Mã GD', 'Mã ĐT', 'Tên ĐT', 'Loại TT', 'Số Tiền', 'Phương Thức', 'Ngày TT', 'Ghi Chú', 'Mã Tham Chiếu'],
  ['PTHU-TEST-01', 'HOAD-TEST-01', 'KHNG-100', 'Công ty Test A', 'Thu nợ', 20000000, 'VietQR', '15/01/2026', 'Ghi chú', 'VCB-001']
]);

mockSS.sheets['DB_DoiTac'] = new MockSheet('DB_DoiTac', [['Mã ĐT', 'Loại', 'Tên Đối Tác'], ['KHNG-100', 'Khách hàng', 'Công ty Test A']]);
mockSS.sheets['DB_DanhMuc'] = new MockSheet('DB_DanhMuc', [['Nhóm', 'Mã', 'Tên', 'Ghi Chú']]);
mockSS.sheets['DB_CaiDat'] = new MockSheet('DB_CaiDat', [['Khóa', 'Giá Trị', 'Diễn Giải']]);
mockSS.sheets['HDSD'] = new MockSheet('HDSD', []);

const gasSandbox = vm.createContext({
  SpreadsheetApp: {
    getActiveSpreadsheet: () => mockSS
  },
  LockService: {
    getScriptLock: () => ({
      waitLock: () => {},
      releaseLock: () => {}
    })
  },
  Utilities: {
    formatDate: (d, tz, fmt) => '15/01/2026'
  },
  HtmlService: {
    createTemplateFromFile: () => ({ evaluate: () => ({ setTitle: () => ({ addMetaTag: () => ({ setXFrameOptionsMode: () => {} }) }) }) }),
    createHtmlOutputFromFile: () => ({ getContent: () => '' }),
    createHtmlOutput: () => ({ setWidth: () => ({ setHeight: () => {} }) }),
    XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' }
  },
  console: console,
  Math: Math,
  Number: Number
});

// Run CONGNO_Code.gs in sandbox
vm.runInContext(gsContent, gasSandbox);

// Execute deleteThanhToan('PTHU-TEST-01')
const deleteResult = gasSandbox.deleteThanhToan('PTHU-TEST-01');

// Verify results
const ttSheetAfter = mockSS.getSheetByName('DB_ThanhToan');
const psSheetAfter = mockSS.getSheetByName('DB_PhatSinhNo');

const ttValues = ttSheetAfter.getDataRange().getValues();
const psValues = psSheetAfter.getDataRange().getValues();

const ttDeleted = ttValues.length === 1 && !ttValues.some(r => r[0] === 'PTHU-TEST-01');
const invRow = psValues[1];
const daThanhToanNew = invRow[5]; // col 6 (0-indexed 5)
const conLaiNew = invRow[6];        // col 7 (0-indexed 6)
const trangThaiNew = invRow[11];    // col 12 (0-indexed 11)

auditAssert(
  ttDeleted,
  'deleteThanhToan genuine row deletion in DB_ThanhToan',
  `DB_ThanhToan rows: ${ttValues.length}`
);

auditAssert(
  daThanhToanNew === 0 && conLaiNew === 50000000 && trangThaiNew === 'Còn nợ',
  'deleteThanhToan genuine invoice balance reversal in DB_PhatSinhNo (daTra restored to 0, conLai to 50M, status Còn nợ)',
  `daTra: ${daThanhToanNew}, conLai: ${conLaiNew}, trangThai: ${trangThaiNew}`
);

// Test non-existent payment code
const nonExistentResult = gasSandbox.deleteThanhToan('PTHU-NON-EXISTENT');
auditAssert(
  nonExistentResult && nonExistentResult.success === false,
  'deleteThanhToan returns failure object on non-existent code',
  `Result: ${JSON.stringify(nonExistentResult)}`
);

// -----------------------------------------------------------------------------
// CHECK 3: ANTI-CHEAT & DYNAMIC CALCULATION ADVERSARIAL STRESS TEST
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 3: Anti-Cheat & Dynamic Computation Verification ---');

// Build minimal DOM environment for testing CONGNO_Index.html
const elementsMap = new Map();
class DOMElement {
  constructor(tagName = 'div', id = '', classStr = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.classList = new Set(classStr.split(/\s+/).filter(Boolean));
    this._innerHTML = '';
    this._innerText = '';
    this.style = {};
  }
  get innerHTML() { return this._innerHTML; }
  set innerHTML(val) { this._innerHTML = String(val); }
  get innerText() { return this._innerText || this._innerHTML.replace(/<[^>]*>/g, ''); }
  set innerText(val) { this._innerText = String(val); this._innerHTML = String(val); }
  get textContent() { return this.innerText; }
  set textContent(val) { this.innerText = val; }
}

const tagRegex = /<([a-zA-Z0-9\-]+)([^>]*)>/g;
let match;
while ((match = tagRegex.exec(htmlContent)) !== null) {
  const tagName = match[1];
  const attrStr = match[2];
  const idMatch = attrStr.match(/id=["']([^"']+)["']/);
  const classMatch = attrStr.match(/class=["']([^"']+)["']/);
  if (idMatch) {
    const id = idMatch[1];
    elementsMap.set(id, new DOMElement(tagName, id, classMatch ? classMatch[1] : ''));
  }
}

const docMock = {
  getElementById: (id) => {
    if (!elementsMap.has(id)) elementsMap.set(id, new DOMElement('div', id));
    return elementsMap.get(id);
  },
  querySelector: (sel) => {
    if (sel.startsWith('#')) return docMock.getElementById(sel.slice(1));
    return new DOMElement('div');
  },
  querySelectorAll: () => [],
  createElement: (tag) => new DOMElement(tag),
  body: new DOMElement('body')
};

const winMock = {
  document: docMock,
  navigator: { clipboard: { writeText: () => Promise.resolve() } },
  lucide: { createIcons: () => {} },
  Chart: function(ctx, config) {
    this.destroy = function() {};
  },
  open: () => ({ document: { write: () => {}, close: () => {} }, focus: () => {} }),
  addEventListener: () => {},
  requestAnimationFrame: (cb) => cb(),
  setTimeout: (cb) => cb(),
  clearTimeout: () => {},
  Intl: Intl,
  Math: Math,
  Date: Date,
  console: console
};

const domSandbox = vm.createContext({
  window: winMock,
  document: docMock,
  navigator: winMock.navigator,
  lucide: winMock.lucide,
  Chart: winMock.Chart,
  tailwind: { config: {} },
  requestAnimationFrame: (cb) => cb(),
  Intl: Intl,
  Math: Math,
  Date: Date,
  console: console,
  setTimeout: (cb) => cb(),
  clearTimeout: () => {}
});

// Extract and evaluate script from HTML
const scriptRegex = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi;
const scriptBlocks = [...htmlContent.matchAll(scriptRegex)];
scriptBlocks.forEach(sb => vm.runInContext(sb[1], domSandbox));

const AppState = domSandbox.window.AppState;

// 3.1 Initial calculation baseline
domSandbox.window.renderDashboard();
const kpiContainer = docMock.getElementById('dash-kpi-container');
const initialHTML = kpiContainer.innerHTML;

// 3.2 Dynamic Recalculation Challenge:
// Inject an invoice with 150,000,000 AR and re-run renderDashboard()
console.log('Injecting adversarial invoice: +150,000,000 AR...');
AppState.data.phatSinhNo.push({
  maGD: 'HOAD-ADVERSARIAL-99',
  maDT: 'KHNG-102938',
  tenDT: 'Công ty CP Đầu Tư Alpha',
  loaiGD: 'Bán hàng',
  soTien: 150000000,
  daTra: 0,
  conLai: 150000000,
  hanThanhToan: '01/01/2026',
  soHoaDon: 'HD-ADV-99',
  trangThai: 'Còn nợ'
});

domSandbox.window.renderDashboard();
const updatedHTML = kpiContainer.innerHTML;

// The AR KPI card MUST reflect the updated sum:
// Baseline AR was 15M + 12.5M = 27.5M. With +150M, it should be 177.5M!
const hasUpdatedAR = updatedHTML.includes('177.500.000');
auditAssert(
  hasUpdatedAR,
  'Dashboard KPI totalAR recalculates dynamically from data (not hardcoded static string)',
  `Updated KPI HTML contains 177.500.000: ${hasUpdatedAR}`
);

// 3.3 Dynamic Partner Overrun Check:
// Check if KHNG-102938 limit (50M) is now exceeded by (177.5M - 50M)
domSandbox.window.renderPartners();
const partnersTbody = docMock.getElementById('partners-table-body');
const partnerHTML = partnersTbody.innerHTML;
const hasOverrunBadge = partnerHTML.includes('Vượt');

auditAssert(
  hasOverrunBadge,
  'Partners renderPartners() dynamically computes debt and fires credit overrun badge',
  `Partner table HTML contains overrun badge: ${hasOverrunBadge}`
);

// 3.4 Dynamic Transactions Insertion & Render Check:
console.log('Injecting adversarial transaction: PTHU-ADVERSARIAL-99...');
AppState.data.thanhToan.push({
  maTT: 'PTHU-ADVERSARIAL-99',
  maGD: 'HOAD-ADVERSARIAL-99',
  maDT: 'KHNG-102938',
  tenDT: 'Công ty CP Đầu Tư Alpha',
  loaiTT: 'Thu nợ',
  soTien: 50000000,
  phuongThuc: 'Chuyển khoản VietQR',
  ngayTT: '01/03/2026',
  ghiChu: 'Thanh toán kiểm thử độc lập'
});

domSandbox.window.renderTransactions();
const txTbody = docMock.getElementById('tx-table-body');
const txHTML = txTbody.innerHTML;
const hasTxInjected = txHTML.includes('PTHU-ADVERSARIAL-99') && txHTML.includes('50.000.000');

auditAssert(
  hasTxInjected,
  'Transactions renderTransactions() dynamically renders newly added payments',
  `Transactions table contains PTHU-ADVERSARIAL-99: ${hasTxInjected}`
);

// -----------------------------------------------------------------------------
// CHECK 4: FACADE IMPLEMENTATION & DUMMY FUNCTION CHECK
// -----------------------------------------------------------------------------
console.log('\n--- CHECK 4: Facade Implementation & Dummy Mock Search ---');

const emptyFunctionRegex = /function\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{\s*(return(\s+[^;]+)?;\s*)?\}/g;
const matches = [...htmlContent.matchAll(emptyFunctionRegex)];
const nonTrivialEmpty = matches.filter(m => {
  const name = m[1];
  // Ignore harmless callbacks like focus, noop
  return !['focus', 'select', 'noop'].includes(name);
});

auditAssert(
  nonTrivialEmpty.length === 0,
  'No empty facade functions found in CONGNO_Index.html',
  `Empty functions: ${nonTrivialEmpty.map(m => m[1]).join(', ')}`
);

// -----------------------------------------------------------------------------
// AUDIT SUMMARY
// -----------------------------------------------------------------------------
console.log('\n======================================================================');
console.log(`AUDIT RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('======================================================================');

if (failCount === 0) {
  console.log('\n>>> VERDICT: CLEAN <<<');
  console.log('The work product complies with all integrity rules and standards.');
  process.exit(0);
} else {
  console.error('\n>>> VERDICT: INTEGRITY VIOLATION <<<');
  console.error(`Total violations detected: ${failCount}`);
  process.exit(1);
}
