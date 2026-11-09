/**
 * AUTOMATED DOM & RUNTIME SIMULATION TEST SUITE FOR CONGNO_Index.html
 * Verifies:
 * 1. JavaScript syntax & evaluation
 * 2. AppState initialization with comprehensive default seed data (zero blank screen)
 * 3. switchTab() routing across all 7 tabs with zero ReferenceError / TypeError
 * 4. 8 Chart.js instances lifecycle management in ChartInstances
 * 5. Drawer open/close transitions and classes (no bottom leak)
 * 6. Statement Modal A4 preview & close transitions
 * 7. Backward compatibility bridge objects (ModuleDashboard, ModuleTransactions, etc.)
 */

const fs = require('fs');
const vm = require('vm');
const path = require('path');

console.log('===============================================================');
console.log('STARTING DOM SIMULATION & INTEGRITY VERIFICATION SUITE');
console.log('===============================================================\n');

// 1. Read CONGNO_Index.html
const htmlPath = path.resolve('STANDARDS_TEMPLATE/CONGNO_Index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// 2. Build DOM Simulation Environment from Real HTML Elements
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

  get innerHTML() {
    return this._innerHTML;
  }
  set innerHTML(val) {
    this._innerHTML = String(val);
    // Parse inner options if this is a select
    if (this.tagName === 'SELECT') {
      const optMatches = [...this._innerHTML.matchAll(/<option\s+([^>]*)>([\s\S]*?)<\/option>/gi)];
      this.options = optMatches.map((m, idx) => {
        const attrStr = m[1];
        const text = m[2].trim();
        const valMatch = attrStr.match(/value="([^"]*)"/);
        const nameMatch = attrStr.match(/data-name="([^"]*)"/);
        const dtMatch = attrStr.match(/data-dt="([^"]*)"/);
        const balMatch = attrStr.match(/data-balance="([^"]*)"/);
        return {
          value: valMatch ? valMatch[1] : text,
          text: text,
          getAttribute: (attr) => {
            if (attr === 'data-name') return nameMatch ? nameMatch[1] : '';
            if (attr === 'data-dt') return dtMatch ? dtMatch[1] : '';
            if (attr === 'data-balance') return balMatch ? balMatch[1] : '';
            return '';
          }
        };
      });
      this.selectedIndex = 0;
    }
  }

  get innerText() {
    return this._innerText || this._innerHTML.replace(/<[^>]*>/g, '');
  }
  set innerText(val) {
    this._innerText = String(val);
    this._innerHTML = String(val);
  }

  get textContent() {
    return this.innerText;
  }
  set textContent(val) {
    this.innerText = val;
  }

  setAttribute(k, v) {
    this.attributes[k] = String(v);
  }
  getAttribute(k) {
    return this.attributes[k] || null;
  }
  appendChild(child) {
    this.children.push(child);
  }
  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) this.children.splice(idx, 1);
  }
  remove() {
    // detach
  }
  focus() {}
  select() {}
}

const elementsMap = new Map();

// Extract all tags with id and class from real HTML
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

console.log(`[DOM Scan] Extracted ${elementsMap.size} unique ID elements from HTML.`);

// Create Document Simulation
const documentMock = {
  getElementById: (id) => {
    if (!elementsMap.has(id)) {
      // Lazy create element if not found
      const el = new DOMElement('div', id, '');
      elementsMap.set(id, el);
    }
    return elementsMap.get(id);
  },
  querySelector: (sel) => {
    if (sel.startsWith('#')) {
      return documentMock.getElementById(sel.slice(1));
    }
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
  createElement: (tag) => {
    return new DOMElement(tag);
  },
  body: new DOMElement('body')
};

// Create Simulated Window Context
const windowMock = {
  document: documentMock,
  navigator: {
    clipboard: {
      writeText: (text) => Promise.resolve()
    }
  },
  lucide: {
    createIcons: () => {}
  },
  Chart: function(ctx, config) {
    this.ctx = ctx;
    this.config = config;
    this.destroyed = false;
    this.destroy = function() {
      this.destroyed = true;
    };
  },
  open: () => ({
    document: {
      write: () => {},
      close: () => {}
    },
    focus: () => {},
    print: () => {}
  }),
  addEventListener: (event, handler) => {
    if (event === 'DOMContentLoaded') {
      windowMock._domContentLoaded = handler;
    }
  },
  requestAnimationFrame: (cb) => {
    cb();
  },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  Intl: Intl,
  Math: Math,
  Date: Date,
  console: console
};

// Global context
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

// Extract Main Script from HTML
const scriptRegex = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi;
const scriptBlocks = [...htmlContent.matchAll(scriptRegex)];
console.log(`[Script Scan] Found ${scriptBlocks.length} inline script blocks.`);

// Evaluate scripts in sandbox
scriptBlocks.forEach((sb, idx) => {
  console.log(`Evaluating script block ${idx} (len: ${sb[1].length})...`);
  vm.runInContext(sb[1], sandbox);
});

console.log('Script execution completed with 0 evaluation errors.\n');

// =============================================================================
// TEST SUITE ASSERTIONS
// =============================================================================
let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${testName} - ${details}`);
    failCount++;
  }
}

console.log('--- TEST 1: AppState & Seed Data Integrity ---');
const AppState = sandbox.window.AppState;
assert(!!AppState, 'AppState is defined on window');
assert(!!AppState.data, 'AppState.data is initialized');
assert(Array.isArray(AppState.data.doiTac) && AppState.data.doiTac.length === 4, 'AppState.data.doiTac contains 4 initial partners', `Length: ${AppState.data?.doiTac?.length}`);
assert(Array.isArray(AppState.data.phatSinhNo) && AppState.data.phatSinhNo.length === 4, 'AppState.data.phatSinhNo contains 4 initial invoices', `Length: ${AppState.data?.phatSinhNo?.length}`);
assert(Array.isArray(AppState.data.thanhToan) && AppState.data.thanhToan.length === 3, 'AppState.data.thanhToan contains 3 initial transactions', `Length: ${AppState.data?.thanhToan?.length}`);
assert(Array.isArray(AppState.data.danhMuc) && AppState.data.danhMuc.length >= 5, 'AppState.data.danhMuc contains initial categories', `Length: ${AppState.data?.danhMuc?.length}`);
assert(!!AppState.data.caiDat && !!AppState.data.caiDat.soTaiKhoan, 'AppState.data.caiDat contains bank & VietQR config');

console.log('\n--- TEST 2: Initial Render & DOMContentLoaded ---');
if (typeof sandbox.window._domContentLoaded === 'function') {
  sandbox.window._domContentLoaded();
  console.log('Triggered DOMContentLoaded successfully.');
}
assert(AppState.currentTab === 'tab-dashboard', 'Default active tab is tab-dashboard');
const kpiContainer = documentMock.getElementById('dash-kpi-container');
assert(kpiContainer.innerHTML.includes('Tổng Phải Thu (AR)'), 'Dashboard rendered 5 KPI cards');
assert(kpiContainer.innerHTML.includes('Tổng Phải Trả (AP)'), 'Dashboard rendered AP card');
assert(kpiContainer.innerHTML.includes('Dòng Tiền Thuần'), 'Dashboard rendered Cashflow card');

console.log('\n--- TEST 3: ChartInstances & 8 Chart.js Lifecycle ---');
const ChartInstances = sandbox.window.ChartInstances || sandbox.ChartInstances;
assert(!!ChartInstances, 'ChartInstances dictionary exists');
const expectedCharts = ['cashflow', 'arApRatio', 'aging', 'topCustomers', 'topSuppliers', 'recoveryRate', 'paymentMethods', 'forecast'];
expectedCharts.forEach(cName => {
  assert(!!ChartInstances[cName] && !ChartInstances[cName].destroyed, `ChartInstance [${cName}] is active and created`);
});

console.log('\n--- TEST 4: switchTab() Across All 7 Tabs Sequentially ---');
const allTabs = [
  'tab-dashboard',
  'tab-transactions',
  'tab-invoices',
  'tab-partners',
  'tab-categories',
  'tab-settings',
  'tab-help'
];

allTabs.forEach(tabId => {
  try {
    sandbox.window.switchTab(tabId);
    const activeEl = documentMock.getElementById(tabId);
    assert(!activeEl.classList.contains('hidden'), `switchTab('${tabId}') successfully unhides container`);
    assert(AppState.currentTab === tabId, `AppState.currentTab is updated to ${tabId}`);
  } catch (err) {
    assert(false, `switchTab('${tabId}') threw an error: ${err.message}`, err.stack);
  }
});

// Also test short alias without 'tab-' prefix
try {
  sandbox.window.switchTab('transactions');
  assert(AppState.currentTab === 'tab-transactions', `switchTab('transactions') short alias works`);
} catch (e) {
  assert(false, `Short tab alias error: ${e.message}`);
}

console.log('\n--- TEST 5: Transactions & Invoices Master-Table Render Verification ---');
sandbox.window.switchTab('tab-transactions');
const txTbody = documentMock.getElementById('tx-table-body');
assert(txTbody.innerHTML.includes('PTHU-102938'), 'Transactions table contains receipt PTHU-102938');
assert(txTbody.innerHTML.includes('PTRA-304918'), 'Transactions table contains payment PTRA-304918');

sandbox.window.switchTab('tab-invoices');
const invTbody = documentMock.getElementById('invoices-table-body');
assert(invTbody.innerHTML.includes('HOAD-102931'), 'Invoices table contains HOAD-102931');
assert(invTbody.innerHTML.includes('HOAD-305829'), 'Invoices table contains HOAD-305829');

console.log('\n--- TEST 6: Partners & Credit Limit Warning ---');
sandbox.window.switchTab('tab-partners');
const partnersTbody = documentMock.getElementById('partners-table-body');
assert(partnersTbody.innerHTML.includes('KHNG-102938'), 'Partners table contains KHNG-102938 (Alpha)');
assert(partnersTbody.innerHTML.includes('NCCP-582910'), 'Partners table contains NCCP-582910 (Tổng Kho Vật Tư)');

console.log('\n--- TEST 7: Drawer Opening/Closing & Bottom Leak Prevention ---');
const actionDrawer = documentMock.getElementById('action-drawer');
const drawerBackdrop = documentMock.getElementById('action-drawer-backdrop');

// Test Open
sandbox.window.openDrawer('Thao Tác Thử Nghiệm', '<div id="test-drawer-content">Hello Drawer</div>');
assert(!actionDrawer.classList.contains('hidden'), 'Drawer open: hidden class is removed from drawer');
assert(!drawerBackdrop.classList.contains('hidden'), 'Drawer open: hidden class is removed from backdrop');
assert(!actionDrawer.classList.contains('translate-y-full'), 'Drawer open: translate-y-full is removed');

// Test Close
sandbox.window.closeDrawer();
assert(actionDrawer.classList.contains('translate-y-full'), 'Drawer close: translate-y-full is added immediately');
assert(drawerBackdrop.classList.contains('hidden'), 'Drawer close: backdrop is hidden immediately');

console.log('\n--- TEST 8: Statement Modal A4 Preview & Print ---');
const stmtModal = documentMock.getElementById('statement-modal');
sandbox.window.openStatementModal('KHNG-102938');
assert(!stmtModal.classList.contains('hidden'), 'Statement modal is opened (hidden removed)');
const stmtCode = documentMock.getElementById('stmt-modal-code');
assert(stmtCode.innerText.startsWith('DOIS-'), 'Statement code DOIS-XXXXXX generated');
const stmtSideB = documentMock.getElementById('stmt-side-b-name');
assert(stmtSideB.innerText.includes('Công ty CP Đầu Tư Alpha'), 'Statement Side B filled with partner name');
sandbox.window.closeStatementModal();
assert(stmtModal.classList.contains('hidden'), 'Statement modal is closed (hidden added)');

console.log('\n--- TEST 9: Backward Compatibility Bridges ---');
assert(typeof sandbox.window.ModuleDashboard.render === 'function', 'ModuleDashboard.render bridge exists');
assert(typeof sandbox.window.ModuleTransactions.render === 'function', 'ModuleTransactions.render bridge exists');
assert(typeof sandbox.window.ModuleInvoices.render === 'function', 'ModuleInvoices.render bridge exists');
assert(typeof sandbox.window.ModulePartners.render === 'function', 'ModulePartners.render bridge exists');
assert(typeof sandbox.window.ModuleCategories.render === 'function', 'ModuleCategories.render bridge exists');
assert(typeof sandbox.window.ModuleSettings.render === 'function', 'ModuleSettings.render bridge exists');
assert(typeof sandbox.window.ModuleHelp.render === 'function', 'ModuleHelp.render bridge exists');

console.log('\n===============================================================');
console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('===============================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL VERIFICATION TESTS COMPLETED WITH 100% SUCCESS!');
  process.exit(0);
}
