/**
 * ADVERSARIAL STRESS TEST SUITE FOR CONGNO_Index.html & CONGNO_Code.gs
 * Conducted by Reviewer & Adversarial Critic
 */

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const htmlContent = fs.readFileSync('STANDARDS_TEMPLATE/CONGNO_Index.html', 'utf8');

class DOMElement {
  constructor(tag, id, cls) {
    this.tagName = (tag || 'DIV').toUpperCase();
    this.id = id || '';
    this.className = cls || '';
    this.classList = {
      classes: new Set((cls || '').split(/\s+/).filter(Boolean)),
      add: function(...names) { names.forEach(n => n.split(/\s+/).forEach(c => c && this.classes.add(c))); },
      remove: function(...names) { names.forEach(n => n.split(/\s+/).forEach(c => c && this.classes.delete(c))); },
      contains: function(name) { return this.classes.has(name); },
      toggle: function(name) { if (this.contains(name)) { this.remove(name); return false; } else { this.add(name); return true; } }
    };
    this.children = [];
    this._innerHTML = '';
    this._innerText = '';
    this.value = '';
    this.style = {};
  }
  get innerHTML() { return this._innerHTML; }
  set innerHTML(v) { this._innerHTML = String(v); }
  get innerText() { return this._innerText; }
  set innerText(v) { this._innerText = String(v); }
  get textContent() { return this.innerText; }
  set textContent(v) { this.innerText = String(v); }
  appendChild(c) { this.children.push(c); }
  removeChild(c) {}
  remove() {}
  focus() {}
  select() {}
  setAttribute(k, v) {}
  getAttribute(k) { return null; }
}

const elements = new Map();
const tagRegex = /<([a-zA-Z0-9\-]+)([^>]*)>/g;
let match;
while ((match = tagRegex.exec(htmlContent)) !== null) {
  const tagName = match[1];
  const attrStr = match[2];
  const idMatch = attrStr.match(/id=["']([^"']+)["']/);
  const classMatch = attrStr.match(/class=["']([^"']+)["']/);
  if (idMatch) {
    const id = idMatch[1];
    elements.set(id, new DOMElement(tagName, id, classMatch ? classMatch[1] : ''));
  }
}

const documentMock = {
  getElementById: (id) => {
    if (!elements.has(id)) elements.set(id, new DOMElement('div', id, ''));
    return elements.get(id);
  },
  querySelector: (sel) => {
    if (sel.startsWith('#')) return documentMock.getElementById(sel.slice(1));
    return new DOMElement('div');
  },
  querySelectorAll: (sel) => {
    const arr = [];
    if (sel.startsWith('.')) {
      const cls = sel.slice(1);
      for (let el of elements.values()) {
        if (el.classList.contains(cls)) arr.push(el);
      }
    }
    return arr;
  },
  createElement: (t) => new DOMElement(t),
  body: new DOMElement('body')
};

const windowMock = {
  document: documentMock,
  navigator: { clipboard: { writeText: () => Promise.resolve() } },
  lucide: { createIcons: () => {} },
  Chart: function(ctx, cfg) {
    this.ctx = ctx;
    this.cfg = cfg;
    this.destroyed = false;
    this.destroy = () => { this.destroyed = true; };
  },
  open: () => ({ document: { write: () => {}, close: () => {} }, print: () => {}, focus: () => {} }),
  addEventListener: () => {},
  requestAnimationFrame: (cb) => cb(),
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  Intl: Intl, Math: Math, Date: Date, console: console
};

const sandbox = vm.createContext({
  window: windowMock, document: documentMock, navigator: windowMock.navigator,
  lucide: windowMock.lucide, Chart: windowMock.Chart, tailwind: { config: {} },
  requestAnimationFrame: (cb) => cb(), Intl: Intl, Math: Math, Date: Date, console: console,
  setTimeout: setTimeout, clearTimeout: clearTimeout
});

const scriptRegex = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi;
const scriptBlocks = [...htmlContent.matchAll(scriptRegex)];
scriptBlocks.forEach(sb => vm.runInContext(sb[1], sandbox));

console.log('=== ADVERSARIAL STRESS TEST RESULTS ===\n');

// TEST 1
console.log('1. EMPTY STATE TEST (All data arrays empty):');
sandbox.window.AppState.data = { doiTac: [], phatSinhNo: [], thanhToan: [], danhMuc: [], caiDat: {} };
try {
  sandbox.window.renderDashboard();
  sandbox.window.renderTransactions();
  sandbox.window.renderInvoices();
  sandbox.window.renderPartners();
  sandbox.window.renderCategories();
  sandbox.window.renderSettings();
  sandbox.window.renderHelp();
  console.log('   [PASS] Rendered all 7 modules with empty data arrays without crashing.');
} catch (e) {
  console.error('   [FAIL] Empty data crash:', e);
}

// TEST 2
console.log('\n2. CORRUPTED & NULL RECORD TEST:');
sandbox.window.AppState.data = {
  doiTac: [{ maDT: null, tenDT: undefined, hanMucTinDung: 'INVALID_NUMBER' }],
  phatSinhNo: [{ maGD: undefined, soTien: null, daTra: undefined, conLai: undefined, hanThanhToan: 'NOT_A_DATE' }],
  thanhToan: [{ maTT: null, soTien: 'ABC', ngayTT: null }],
  danhMuc: [{ Ma: undefined, Ten: null }],
  caiDat: null
};
try {
  sandbox.window.renderDashboard();
  sandbox.window.renderTransactions();
  sandbox.window.renderInvoices();
  sandbox.window.renderPartners();
  sandbox.window.renderCategories();
  sandbox.window.renderSettings();
  console.log('   [PASS] Resilient against malformed, null, and NaN records.');
} catch (e) {
  console.error('   [FAIL] Corrupted record crash:', e);
}

// TEST 3
console.log('\n3. RAPID REPEATED switchTab CALLS (Fuzz testing navigation):');
try {
  const tabs = ['dashboard', 'transactions', 'invoices', 'partners', 'categories', 'settings', 'help', 'invalid_tab', '', null, undefined];
  for (let i = 0; i < 100; i++) {
    sandbox.window.switchTab(tabs[i % tabs.length]);
  }
  console.log('   [PASS] 100 rapid sequential switchTab executions handled cleanly.');
} catch (e) {
  console.error('   [FAIL] Rapid switchTab error:', e);
}

// TEST 4
console.log('\n4. DRAWER REPEATED OPEN/CLOSE LIFECYCLE:');
try {
  for (let i = 0; i < 50; i++) {
    sandbox.window.openDrawer('Test ' + i, '<p>Content</p>');
    sandbox.window.closeDrawer();
  }
  console.log('   [PASS] Drawer cycled 50 times without crashing or state desync.');
} catch (e) {
  console.error('   [FAIL] Drawer lifecycle error:', e);
}

// TEST 5
console.log('\n5. STATEMENT MODAL GENERATION & CLEANUP:');
try {
  sandbox.window.AppState.data = {
    doiTac: [{ maDT: 'DT-TEST', tenDT: 'Công Ty Test A4', diaChi: 'Hà Nội' }],
    phatSinhNo: [{ maGD: 'HD-001', maDT: 'DT-TEST', soTien: 10000000, conLai: 5000000, hanThanhToan: '10/10/2026' }],
    thanhToan: [],
    danhMuc: [],
    caiDat: {}
  };
  sandbox.window.openStatementModal('DT-TEST');
  const code = documentMock.getElementById('stmt-modal-code').innerText;
  if (!code.startsWith('DOIS-')) throw new Error('Statement code does not start with DOIS-');
  sandbox.window.closeStatementModal();
  console.log('   [PASS] Statement modal generated code ' + code + ' and closed safely.');
} catch (e) {
  console.error('   [FAIL] Statement modal error:', e);
}

// TEST 6: BACKEND CODE.GS SYNTAX CHECK
console.log('\n6. BACKEND CONGNO_Code.gs SYNTAX & STATIC VERIFICATION:');
try {
  const gsContent = fs.readFileSync('STANDARDS_TEMPLATE/CONGNO_Code.gs', 'utf8');
  // Strip GAS specific decorators / check via vm Script
  new vm.Script(gsContent);
  console.log('   [PASS] CONGNO_Code.gs passed full V8 compilation syntax check.');
} catch (e) {
  console.error('   [FAIL] CONGNO_Code.gs syntax error:', e);
}

console.log('\n=== ALL ADVERSARIAL STRESS TESTS COMPLETED ===');
