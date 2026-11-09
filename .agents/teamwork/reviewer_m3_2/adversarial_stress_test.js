const fs = require('fs');
const vm = require('vm');
const path = require('path');

console.log('===============================================================');
console.log('STARTING ADVERSARIAL STRESS TEST & FAILURE MODE SUITE');
console.log('===============================================================\n');

const htmlPath = path.resolve('STANDARDS_TEMPLATE/CONGNO_Index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Build simulated DOM
class ClassList {
  constructor(initial = []) {
    this.classes = new Set(initial.filter(Boolean));
  }
  add(...names) {
    names.forEach(n => n.split(/\s+/).forEach(c => c && this.classes.add(c)));
  }
  remove(...names) {
    names.forEach(n => n.split(/\s+/).forEach(c => c && this.classes.delete(c)));
  }
  contains(name) {
    return this.classes.has(name);
  }
  toggle(name, force) {
    if (force !== undefined) {
      if (force) this.add(name);
      else this.remove(name);
      return force;
    }
    if (this.contains(name)) {
      this.remove(name);
      return false;
    } else {
      this.add(name);
      return true;
    }
  }
  toString() {
    return Array.from(this.classes).join(' ');
  }
}

class DOMElement {
  constructor(tagName = 'div', id = '', classStr = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.classList = new ClassList(classStr.split(/\s+/));
    this._innerHTML = '';
    this._innerText = '';
    this.value = '';
    this.style = {};
    this.children = [];
    this.options = [];
    this.selectedIndex = 0;
    this.attributes = {};
  }
  get innerHTML() { return this._innerHTML; }
  set innerHTML(val) {
    this._innerHTML = String(val);
    if (this.tagName === 'SELECT') {
      const optMatches = [...this._innerHTML.matchAll(/<option\s+([^>]*)>([\s\S]*?)<\/option>/gi)];
      this.options = optMatches.map((m, idx) => {
        const attrStr = m[1];
        const text = m[2].trim();
        const valMatch = attrStr.match(/value="([^"]*)"/);
        return {
          value: valMatch ? valMatch[1] : text,
          text: text,
          getAttribute: () => ''
        };
      });
      this.selectedIndex = 0;
    }
  }
  get innerText() { return this._innerText || this._innerHTML.replace(/<[^>]*>/g, ''); }
  set innerText(val) { this._innerText = String(val); this._innerHTML = String(val); }
  get textContent() { return this.innerText; }
  set textContent(val) { this.innerText = val; }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return this.attributes[k] || null; }
  appendChild(child) { this.children.push(child); }
  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) this.children.splice(idx, 1);
  }
  remove() {}
  focus() {}
  select() {}
}

const elementsMap = new Map();
const tagRegex = /<([a-zA-Z0-9\-]+)([^>]*)>/g;
let match;
while ((match = tagRegex.exec(htmlContent)) !== null) {
  const tagName = match[1];
  const attrStr = match[2];
  const idMatch = attrStr.match(/id=["']([^"']+)["']/);
  const classMatch = attrStr.match(/class=["']([^"']+)["']/);
  if (idMatch) {
    const id = idMatch[1];
    const el = new DOMElement(tagName, id, classMatch ? classMatch[1] : '');
    elementsMap.set(id, el);
  }
}

const documentMock = {
  getElementById: (id) => {
    if (!elementsMap.has(id)) {
      const el = new DOMElement('div', id, '');
      elementsMap.set(id, el);
    }
    return elementsMap.get(id);
  },
  querySelector: (sel) => {
    if (sel.startsWith('#')) return documentMock.getElementById(sel.slice(1));
    if (sel.startsWith('.')) {
      const cls = sel.slice(1);
      for (let el of elementsMap.values()) {
        if (el.classList.contains(cls)) return el;
      }
    }
    return new DOMElement('div', '', '');
  },
  querySelectorAll: (sel) => {
    const res = [];
    if (sel.startsWith('.')) {
      const cls = sel.slice(1);
      for (let el of elementsMap.values()) {
        if (el.classList.contains(cls)) res.push(el);
      }
    } else if (sel.startsWith('#')) {
      const el = documentMock.getElementById(sel.slice(1));
      if (el) res.push(el);
    }
    return res;
  },
  createElement: (tag) => new DOMElement(tag),
  body: new DOMElement('body')
};

const windowMock = {
  document: documentMock,
  navigator: { clipboard: { writeText: () => Promise.resolve() } },
  lucide: { createIcons: () => {} },
  Chart: function(ctx, config) {
    this.ctx = ctx;
    this.config = config;
    this.destroy = function() { this.destroyed = true; };
  },
  open: () => ({
    document: { write: () => {}, close: () => {} },
    focus: () => {},
    print: () => {}
  }),
  addEventListener: () => {},
  requestAnimationFrame: (cb) => cb(),
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  Intl: Intl,
  Math: Math,
  Date: Date,
  console: console
};

const sandbox = vm.createContext({
  window: windowMock,
  document: documentMock,
  navigator: windowMock.navigator,
  lucide: windowMock.lucide,
  Chart: windowMock.Chart,
  tailwind: { config: {} },
  requestAnimationFrame: (cb) => cb(),
  Intl: Intl,
  Math: Math,
  Date: Date,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout
});

const scriptRegex = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi;
const scriptBlocks = [...htmlContent.matchAll(scriptRegex)];
scriptBlocks.forEach((sb) => vm.runInContext(sb[1], sandbox));

let passCount = 0;
let failCount = 0;

function assert(cond, name, msg = '') {
  if (cond) {
    console.log(`  [PASS] ${name}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${name} - ${msg}`);
    failCount++;
  }
}

// -------------------------------------------------------------
// ADVERSARIAL TEST 1: Empty Data & Zero Handling
// -------------------------------------------------------------
console.log('\n--- ADVERSARIAL TEST 1: Empty AppState.data State ---');
const AppState = sandbox.window.AppState;
const originalData = JSON.parse(JSON.stringify(AppState.data));

try {
  AppState.data = {
    doiTac: [],
    phatSinhNo: [],
    thanhToan: [],
    danhMuc: [],
    caiDat: {}
  };
  sandbox.window.renderDashboard();
  sandbox.window.renderTransactions();
  sandbox.window.renderInvoices();
  sandbox.window.renderPartners();
  sandbox.window.renderCategories();
  sandbox.window.renderSettings();
  sandbox.window.renderHelp();
  assert(true, 'All 7 render functions survive completely empty data arrays without crashing');
} catch (e) {
  assert(false, 'Render crashed on empty data', e.message);
}

// Check empty state visibility
const txEmpty = documentMock.getElementById('tx-empty-state');
assert(!txEmpty.classList.contains('hidden'), 'Transactions shows empty state when data is empty');

// Restore original seed data
AppState.data = originalData;

// -------------------------------------------------------------
// ADVERSARIAL TEST 2: Corrupted & Missing Data Fields
// -------------------------------------------------------------
console.log('\n--- ADVERSARIAL TEST 2: Corrupted & Null Data Records ---');
try {
  AppState.data.doiTac.push({
    maDT: 'KHNG-CORRUPT',
    tenDT: undefined,
    sdt: null,
    loaiDT: null,
    hanMucTinDung: 'NOT_A_NUMBER'
  });
  AppState.data.phatSinhNo.push({
    maGD: 'HOAD-CORRUPT',
    maDT: 'KHNG-CORRUPT',
    soTien: null,
    daTra: undefined,
    conLai: NaN,
    hanThanhToan: 'invalid-date-string'
  });
  AppState.data.thanhToan.push({
    maTT: 'PTHU-CORRUPT',
    maGD: null,
    maDT: null,
    soTien: -9999999
  });

  sandbox.window.renderDashboard();
  sandbox.window.renderTransactions();
  sandbox.window.renderInvoices();
  sandbox.window.renderPartners();
  assert(true, 'Survives corrupted/null fields and invalid dates without throwing exceptions');
} catch (e) {
  assert(false, 'Corrupted data threw exception', e.message);
}

// -------------------------------------------------------------
// ADVERSARIAL TEST 3: Invalid Router Inputs
// -------------------------------------------------------------
console.log('\n--- ADVERSARIAL TEST 3: Invalid Router Inputs ---');
try {
  sandbox.window.switchTab('unknown-tab');
  sandbox.window.switchTab('');
  sandbox.window.switchTab(null);
  sandbox.window.switchTab(undefined);
  sandbox.window.switchTab('123456');
  assert(true, 'switchTab gracefully ignores invalid tab strings without throwing');
} catch (e) {
  assert(false, 'switchTab crashed on invalid input', e.message);
}

// -------------------------------------------------------------
// ADVERSARIAL TEST 4: Non-existent Statement Modal Partner
// -------------------------------------------------------------
console.log('\n--- ADVERSARIAL TEST 4: Statement Modal with Non-existent Partner ---');
try {
  sandbox.window.openStatementModal('KHNG-NONEXISTENT');
  const stmtModal = documentMock.getElementById('statement-modal');
  assert(!stmtModal.classList.contains('hidden'), 'Statement modal opens even if partner not found');
  sandbox.window.closeStatementModal();
  assert(stmtModal.classList.contains('hidden'), 'Statement modal closes properly');
} catch (e) {
  assert(false, 'openStatementModal crashed on missing partner', e.message);
}

// -------------------------------------------------------------
// ADVERSARIAL TEST 5: Rapid Drawer Toggle Stress
// -------------------------------------------------------------
console.log('\n--- ADVERSARIAL TEST 5: Rapid Drawer Toggle Stress ---');
try {
  for (let i = 0; i < 25; i++) {
    sandbox.window.openDrawer('Stress ' + i, '<p>Stress test body</p>');
    sandbox.window.closeDrawer();
  }
  assert(true, 'Survived 25 rapid openDrawer/closeDrawer cycles');
} catch (e) {
  assert(false, 'Rapid drawer toggle failed', e.message);
}

// -------------------------------------------------------------
// ADVERSARIAL TEST 6: Formatting Utilities Edge Cases
// -------------------------------------------------------------
console.log('\n--- ADVERSARIAL TEST 6: Formatting Edge Cases ---');
const formatVND = sandbox.window.formatVND || sandbox.formatVND;
const formatDate = sandbox.window.formatDate || sandbox.formatDate;

assert(formatVND(0) === '0 đ', 'formatVND(0) -> 0 đ');
assert(formatVND(null) === '0 đ', 'formatVND(null) -> 0 đ');
assert(formatVND(undefined) === '0 đ', 'formatVND(undefined) -> 0 đ');
assert(formatVND(NaN) === '0 đ', 'formatVND(NaN) -> 0 đ');
assert(formatVND('abc') === '0 đ', 'formatVND("abc") -> 0 đ');

assert(formatDate(null) === '', 'formatDate(null) -> empty string');
assert(formatDate(undefined) === '', 'formatDate(undefined) -> empty string');
assert(formatDate('15/02/2026') === '15/02/2026', 'formatDate("15/02/2026") preserves format');

// -------------------------------------------------------------
// ADVERSARIAL TEST 7: Search & Filter Stress
// -------------------------------------------------------------
console.log('\n--- ADVERSARIAL TEST 7: Search & Filter Stress ---');
try {
  sandbox.window.searchTransactions('Alpha');
  sandbox.window.searchTransactions('!@#$%^&*()');
  sandbox.window.searchTransactions('');
  sandbox.window.filterTransactions('PTHU');
  sandbox.window.filterTransactions('PTRA');
  sandbox.window.filterTransactions('ALL');

  sandbox.window.searchInvoices('HOAD');
  sandbox.window.searchInvoices('nonexistent');
  sandbox.window.searchInvoices('');
  sandbox.window.filterInvoices('CON_NO');
  sandbox.window.filterInvoices('DA_XONG');
  sandbox.window.filterInvoices('ALL');

  sandbox.window.searchPartners('Alpha');
  sandbox.window.filterPartners('KHACH_HANG');
  sandbox.window.filterPartners('NHA_CUNG_CAP');
  sandbox.window.filterPartners('ALL');

  assert(true, 'Search and filter handlers survive weird characters and rapid queries');
} catch (e) {
  assert(false, 'Search/Filter threw exception', e.message);
}

console.log('\n===============================================================');
console.log(`ADVERSARIAL SUITE SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('===============================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL ADVERSARIAL STRESS TESTS PASSED WITH 100% SUCCESS!');
  process.exit(0);
}
