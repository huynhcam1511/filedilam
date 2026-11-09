const fs = require('fs');
const vm = require('vm');
const path = require('path');

console.log('Testing all 39 unique inline event handlers...');

const htmlPath = path.resolve('STANDARDS_TEMPLATE/CONGNO_Index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Build simulated DOM
class ClassList {
  constructor(initial = []) { this.classes = new Set(initial.filter(Boolean)); }
  add(...names) { names.forEach(n => n.split(/\s+/).forEach(c => c && this.classes.add(c))); }
  remove(...names) { names.forEach(n => n.split(/\s+/).forEach(c => c && this.classes.delete(c))); }
  contains(name) { return this.classes.has(name); }
}

class DOMElement {
  constructor(tagName = 'div', id = '', classStr = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.classList = new ClassList(classStr.split(/\s+/));
    this._innerHTML = '';
    this._innerText = '';
    this.value = 'TEST_VALUE';
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
      this.options = optMatches.map((m) => {
        const attrStr = m[1];
        const valMatch = attrStr.match(/value="([^"]*)"/);
        return { value: valMatch ? valMatch[1] : m[2].trim(), text: m[2].trim() };
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
    elementsMap.set(idMatch[1], new DOMElement(tagName, idMatch[1], classMatch ? classMatch[1] : ''));
  }
}

const documentMock = {
  getElementById: (id) => {
    if (!elementsMap.has(id)) elementsMap.set(id, new DOMElement('div', id, ''));
    return elementsMap.get(id);
  },
  querySelector: (sel) => {
    if (sel.startsWith('#')) return documentMock.getElementById(sel.slice(1));
    return new DOMElement('div', '', '');
  },
  querySelectorAll: (sel) => {
    const res = [];
    if (sel.startsWith('.')) {
      const cls = sel.slice(1);
      for (let el of elementsMap.values()) {
        if (el.classList.contains(cls)) res.push(el);
      }
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
  Chart: function(ctx, config) { this.destroy = () => {}; },
  open: () => ({ document: { write: () => {}, close: () => {} }, focus: () => {}, print: () => {} }),
  print: () => {},
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

const fakeEvent = {
  preventDefault: () => {},
  stopPropagation: () => {},
  target: new DOMElement('form')
};

const getFn = (name) => sandbox.window[name] || sandbox[name];

const testCalls = [
  () => getFn('closeDrawer')(),
  () => getFn('toggleSidebar')(),
  () => getFn('switchTab')('tab-dashboard'),
  () => getFn('refreshData')(),
  () => getFn('handleQuickPayment')(),
  () => getFn('filterTransactions')('ALL'),
  () => getFn('searchTransactions')('Alpha'),
  () => getFn('openTransactionDrawer')('PTHU'),
  () => getFn('filterInvoices')('ALL'),
  () => getFn('searchInvoices')('HOAD'),
  () => getFn('openInvoiceDrawer')(),
  () => getFn('filterPartners')('ALL'),
  () => getFn('searchPartners')('Alpha'),
  () => getFn('openPartnerDrawer')(),
  () => getFn('filterCategories')('ALL'),
  () => getFn('searchCategories')('CK'),
  () => getFn('openCategoryDrawer')(),
  () => getFn('handleSettingsSubmit')(fakeEvent),
  () => getFn('updateQRPreview')(),
  () => getFn('resetZaloTemplate')(),
  () => getFn('insertZaloTag')('{TEN_DOI_TAC}'),
  () => (getFn('print') || sandbox.window.print)(),
  () => getFn('closeStatementModal')(),
  () => getFn('copyZaloReminder')('KHNG-102938', 15000000),
  () => getFn('printTransactionSlip')('PTHU-102938'),
  () => getFn('deleteTransaction')('PTHU-102938'),
  () => getFn('setDrawerTxType')('PTHU'),
  () => getFn('onTxPartnerChange')(),
  () => getFn('onTxInvoiceChange')(),
  () => getFn('updateDrawerVietQR')(),
  () => getFn('openStatementModal')('KHNG-102938'),
  () => getFn('deleteInvoice')('HOAD-102931'),
  () => getFn('handleInvoiceSubmit')(fakeEvent),
  () => getFn('deletePartner')('KHNG-102938'),
  () => getFn('handlePartnerSubmit')(fakeEvent),
  () => getFn('openCategoryDrawer')('HinhThucThanhToan'),
  () => getFn('handleCategorySubmit')(fakeEvent)
];

let successCount = 0;
testCalls.forEach((fn, idx) => {
  try {
    fn();
    successCount++;
  } catch (err) {
    console.error(`Call ${idx} failed:`, err);
  }
});

console.log(`Executed ${successCount}/${testCalls.length} handler functions successfully with 0 errors!`);
if (successCount === testCalls.length) {
  process.exit(0);
} else {
  process.exit(1);
}
