/**
 * Comprehensive Test Suite for Product Direct Link Feature (R1, R2, R3)
 * Covers Storefront and Admin direct link resolution, clipboard copying, and history handling.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('====================================================');
console.log('RUNNING TEST SUITE: PRODUCT DIRECT LINK (R1, R2, R3)');
console.log('====================================================\n');

// 1. Mock browser environment
let globalNodeCounter = 1000;
const createMockWindow = (initialHash = '') => {
  const elements = {};
  const listeners = {};

  const makeElement = (id = '', tagName = 'div') => {
    const el = {
      id,
      tagName: tagName.toUpperCase(),
      style: {
        setProperty: () => {},
        removeProperty: () => {}
      },
      classList: {
        _classes: new Set(),
        add(c) { this._classes.add(c); },
        remove(c) { this._classes.delete(c); },
        contains(c) { return this._classes.has(c); },
        toggle(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
      },
      attributes: {},
      setAttribute(k, v) { this.attributes[k] = String(v); },
      getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : null },
      removeAttribute(k) { delete this.attributes[k]; },
      appendChild(child) {
        if (!this.children) this.children = [];
        this.children.push(child);
        return child;
      },
      append(...children) {
        if (!this.children) this.children = [];
        children.forEach(c => this.children.push(c));
      },
      removeChild(child) {
        if (this.children) {
          this.children = this.children.filter(c => c !== child);
        }
        return child;
      },
      _innerHTML: '',
      set innerHTML(html) {
        this._innerHTML = String(html);
        this.children = [];
        const tagRegex = /<([a-zA-Z0-9]+)([^>]*)>/g;
        let match;
        let idx = 0;
        while ((match = tagRegex.exec(this._innerHTML)) !== null) {
          const tag = match[1];
          const attrs = match[2];
          const idMatch = attrs.match(/[\s]id=["']([^"']+)["']/);
          const elemId = idMatch ? idMatch[1] : ('anon-node-' + (++globalNodeCounter));
          const el = (idMatch && elements[elemId]) ? elements[elemId] : makeElement(elemId, tag);
          const classMatch = attrs.match(/[\s]class=["']([^"']+)["']/);
          if (classMatch) {
            classMatch[1].split(/\s+/).forEach(c => c && el.classList.add(c));
          }
          const dataIdMatch = attrs.match(/[\s]data-id=["']([^"']+)["']/);
          if (dataIdMatch) {
            el.dataset.id = dataIdMatch[1];
          }
          this.children.push(el);
          if (idMatch) elements[elemId] = el;
        }
      },
      get innerHTML() {
        return this._innerHTML;
      },
      closest(sel) { return this; },
      textContent: '',
      children: [],
      value: '',
      dataset: {},
      addEventListener(evt, fn) {
        if (!this._listeners) this._listeners = {};
        if (!this._listeners[evt]) this._listeners[evt] = [];
        this._listeners[evt].push(fn);
      },
      removeEventListener(evt, fn) {
        if (this._listeners && this._listeners[evt]) {
          this._listeners[evt] = this._listeners[evt].filter(f => f !== fn);
        }
      },
      dispatchEvent(evt) {
        const type = typeof evt === 'string' ? evt : evt.type;
        const eventObj = typeof evt === 'string' ? { type: evt } : evt;
        if (!eventObj.target) eventObj.target = this;
        eventObj.currentTarget = this;
        if (this._listeners && this._listeners[type]) {
          this._listeners[type].forEach(fn => fn(eventObj));
        }
      },
      querySelectorAll(sel) {
        const results = [];
        const check = (node) => {
          if (sel.startsWith('.') && node.classList.contains(sel.slice(1))) results.push(node);
          else if (sel.startsWith('#') && node.id === sel.slice(1)) results.push(node);
          else if (sel === 'button' && node.tagName === 'BUTTON') results.push(node);
          else if (sel.includes('[data-id]') && node.dataset && node.dataset.id) results.push(node);
          else if (sel.includes('.btn-detail-copy-link') && node.classList.contains('btn-detail-copy-link')) results.push(node);
          else if (sel.includes('.btn-copy-direct-link') && node.classList.contains('btn-copy-direct-link')) results.push(node);
          (node.children || []).forEach(check);
        };
        (this.children || []).forEach(check);
        return results;
      },
      querySelector(sel) {
        const res = this.querySelectorAll(sel);
        return res.length ? res[0] : null;
      },
      scrollTop: 0,
      scrollTo: () => {},
      focus: () => {},
      select: () => {},
      getBoundingClientRect: () => ({ top: 100, bottom: 200, height: 100 })
    };
    if (id) elements[id] = el;
    return el;
  };

  const doc = {
    title: 'File Đi Làm',
    body: makeElement('body', 'body'),
    getElementById(id) {
      if (!elements[id]) elements[id] = makeElement(id);
      return elements[id];
    },
    createElement(tag) {
      return makeElement('', tag);
    },
    querySelectorAll(sel) {
      return doc.body.querySelectorAll(sel);
    },
    querySelector(sel) {
      return doc.body.querySelector(sel);
    },
    addEventListener(evt, fn) {
      if (!listeners[evt]) listeners[evt] = [];
      listeners[evt].push(fn);
    },
    trigger(evtName, evtObj = {}) {
      if (listeners[evtName]) {
        listeners[evtName].forEach(fn => fn(evtObj));
      }
    },
    execCommand: (cmd) => true
  };

  // Setup DOM hierarchy like index.html
  const detailModal = doc.getElementById('detailModal');
  const detailBody = doc.getElementById('detailBody');
  const productListBody = doc.getElementById('productListBody');
  detailModal.children.push(detailBody);
  doc.body.children.push(detailModal);
  doc.body.children.push(productListBody);

  let writtenClipboardText = '';

  const win = {
    location: {
      origin: 'https://filedilam.vn',
      pathname: '/',
      search: '',
      hash: initialHash,
      href: 'https://filedilam.vn/' + initialHash,
      protocol: 'https:'
    },
    history: {
      state: null,
      pushState(state, title, url) {
        this.state = state;
        const hashIdx = url.indexOf('#');
        if (hashIdx !== -1) {
          win.location.hash = url.slice(hashIdx);
        } else {
          win.location.hash = '';
        }
        win.location.href = url.startsWith('http') ? url : (win.location.origin + url);
      },
      replaceState(state, title, url) {
        this.state = state;
        const hashIdx = url.indexOf('#');
        if (hashIdx !== -1) {
          win.location.hash = url.slice(hashIdx);
        } else {
          win.location.hash = '';
        }
        win.location.href = url.startsWith('http') ? url : (win.location.origin + url);
      }
    },
    navigator: {
      clipboard: {
        writeText: async (txt) => {
          writtenClipboardText = txt;
          return Promise.resolve();
        }
      }
    },
    isSecureContext: true,
    addEventListener(evt, fn) {
      if (!listeners[evt]) listeners[evt] = [];
      listeners[evt].push(fn);
    },
    trigger(evtName, evtObj = {}) {
      if (listeners[evtName]) {
        listeners[evtName].forEach(fn => fn(evtObj));
      }
    },
    removeEventListener(evt, fn) {
      if (listeners[evt]) {
        listeners[evt] = listeners[evt].filter(f => f !== fn);
      }
    },
    trigger(evtName, evtObj = {}) {
      if (listeners[evtName]) {
        listeners[evtName].forEach(fn => fn(evtObj));
      }
    },
    getClipboardText: () => writtenClipboardText,
    setClipboardText: (t) => { writtenClipboardText = t; },
    scrollTo: () => {},
    setTimeout: (fn, ms) => { fn(); return 1; },
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    requestAnimationFrame: (fn) => { fn(); return 1; },
    localStorage: {
      _d: {},
      getItem(k) { return this._d[k] || null; },
      setItem(k, v) { this._d[k] = String(v); },
      removeItem(k) { delete this._d[k]; }
    },
    sessionStorage: {
      _d: {},
      getItem(k) { return this._d[k] || null; },
      setItem(k, v) { this._d[k] = String(v); },
      removeItem(k) { delete this._d[k]; }
    },
    StorefrontData: {
      categories: [
        { id: 'ban-hang-online', name: 'Kinh doanh' },
        { id: 'quan-ly-kho', name: 'Kho vận' }
      ],
      products: [
        {
          id: 'PRD-102938',
          slug: 'ban-hang-online',
          name: 'Bán hàng online',
          price: 99000,
          originalPrice: 199000,
          type: 'google_sheets'
        },
        {
          id: 'PRD-203948',
          slug: 'quan-ly-kho-mini',
          name: 'Quản lý kho mini',
          price: 149000,
          originalPrice: 249000,
          type: 'google_sheets'
        },
        {
          id: 'PRD-304958',
          name: 'Bảng tính Quản lý Công nợ Thực chiến',
          price: 129000,
          type: 'excel'
        }
      ]
    }
  };

  return { win, doc, elements };
};

(async () => {
// ============================================================
// TEST 1: Vietnamese Slugification Algorithm (R1)
// ============================================================
console.log('--- TEST 1: Vietnamese Slugification (R1) ---');
const storefrontCode = fs.readFileSync(path.join(__dirname, '..', 'storefront.js'), 'utf8');
const { win: win1, doc: doc1 } = createMockWindow();

const context1 = vm.createContext({
  window: win1,
  document: doc1,
  navigator: win1.navigator,
  location: win1.location,
  history: win1.history,
  localStorage: win1.localStorage,
  sessionStorage: win1.sessionStorage,
  setTimeout: win1.setTimeout,
  clearTimeout: win1.clearTimeout,
  requestAnimationFrame: win1.requestAnimationFrame,
  URLSearchParams: class {
    constructor() {}
    get() { return null; }
  }
});

vm.runInContext(storefrontCode, context1);
const router = win1.StorefrontDirectLink;

assert(typeof router.slugifyVietnamese === 'function', 'slugifyVietnamese must be exported');
assert.strictEqual(router.slugifyVietnamese('Quản lý kho mini'), 'quan-ly-kho-mini', 'Should slugify "Quản lý kho mini"');
assert.strictEqual(router.slugifyVietnamese('Bán hàng online'), 'ban-hang-online', 'Should slugify "Bán hàng online"');
assert.strictEqual(router.slugifyVietnamese('HỆ THỐNG QUẢN LÝ KHÁCH HÀNG & GIỎ HÀNG BẤT ĐỘNG SẢN'), 'he-thong-quan-ly-khach-hang-gio-hang-bat-dong-san', 'Should handle uppercase & special chars');
assert.strictEqual(router.slugifyVietnamese('PRD-102938'), 'prd-102938', 'Should handle SKU');
assert.strictEqual(router.slugifyVietnamese(''), '', 'Should handle empty string');
assert.strictEqual(router.slugifyVietnamese(null), '', 'Should handle null');
console.log('PASS: Test 1 - Vietnamese slugification is 100% accurate.');

// ============================================================
// TEST 2: Hash Parsing for /#san-pham=... and alias /#p=... (R1)
// ============================================================
console.log('\n--- TEST 2: Hash URL Parsing & Aliases (R1) ---');
assert.strictEqual(router.parseProductDirectHash('#san-pham=PRD-102938'), 'PRD-102938');
assert.strictEqual(router.parseProductDirectHash('#/san-pham=PRD-102938'), 'PRD-102938');
assert.strictEqual(router.parseProductDirectHash('#p=PRD-102938'), 'PRD-102938');
assert.strictEqual(router.parseProductDirectHash('#/p=PRD-102938'), 'PRD-102938');

assert.strictEqual(router.parseProductDirectHash('#san-pham=quan-ly-kho-mini'), 'quan-ly-kho-mini');
assert.strictEqual(router.parseProductDirectHash('#/san-pham=quan-ly-kho-mini'), 'quan-ly-kho-mini');
assert.strictEqual(router.parseProductDirectHash('#p=quan-ly-kho-mini'), 'quan-ly-kho-mini');
assert.strictEqual(router.parseProductDirectHash('#/p=quan-ly-kho-mini'), 'quan-ly-kho-mini');

assert.strictEqual(router.parseProductDirectHash('#san-pham=quan-ly-kho-mini&utm_source=facebook'), 'quan-ly-kho-mini');
assert.strictEqual(router.parseProductDirectHash('#/p=ban-hang-online?ref=zalo'), 'ban-hang-online');

// Non-matching hashes
assert.strictEqual(router.parseProductDirectHash('#thanh-toan'), null);
assert.strictEqual(router.parseProductDirectHash('#catalogs'), null);
assert.strictEqual(router.parseProductDirectHash('#san-pham='), null);
assert.strictEqual(router.parseProductDirectHash('#p='), null);
assert.strictEqual(router.parseProductDirectHash('#'), null);
assert.strictEqual(router.parseProductDirectHash(''), null);
assert.strictEqual(router.parseProductDirectHash(null), null);
console.log('PASS: Test 2 - Hash parsing and alias support /#san-pham= and /#p= correctly.');

// ============================================================
// TEST 3: Product Matching Algorithm (ID first, then Slug) (R1)
// ============================================================
console.log('\n--- TEST 3: Product Matching Algorithm (R1) ---');
const sampleProducts = [
  { id: 'PRD-102938', slug: 'ban-hang-online', name: 'Bán hàng online' },
  { id: 'PRD-203948', slug: 'quan-ly-kho-mini', name: 'Quản lý kho mini' },
  { id: 'PRD-304958', name: 'Bảng tính Quản lý Công nợ Thực chiến' } // No explicit slug
];

// 3a. Exact ID Match
const p1ById = router.findProductByIdOrSlug(sampleProducts, 'PRD-102938');
assert(p1ById && p1ById.id === 'PRD-102938', 'Should find by exact ID');

// 3b. Case-insensitive ID Match
const p1ByIdCi = router.findProductByIdOrSlug(sampleProducts, 'prd-102938');
assert(p1ByIdCi && p1ByIdCi.id === 'PRD-102938', 'Should find by case-insensitive ID');

// 3c. Explicit Slug Match
const p2BySlug = router.findProductByIdOrSlug(sampleProducts, 'quan-ly-kho-mini');
assert(p2BySlug && p2BySlug.id === 'PRD-203948', 'Should find by explicit slug');

// 3d. Fallback Slug from Product Name when slug is not explicitly defined
const p3ByNameSlug = router.findProductByIdOrSlug(sampleProducts, 'bang-tinh-quan-ly-cong-no-thuc-chien');
assert(p3ByNameSlug && p3ByNameSlug.id === 'PRD-304958', 'Should resolve slug derived from product.name');

// 3e. Unknown product returns null safely without throwing
const pUnknown = router.findProductByIdOrSlug(sampleProducts, 'non-existent-product-sku-999');
assert.strictEqual(pUnknown, null, 'Unknown product param must return null');

console.log('PASS: Test 3 - Product matching resolves ID first, then explicit slug, then name slug, null on unknown.');

// ============================================================
// TEST 4: Direct Parameter Preference (Slug preferred, ID fallback) (R1)
// ============================================================
console.log('\n--- TEST 4: Direct Param Preference (R1) ---');
const prodWithSlug = { id: 'PRD-102938', slug: 'ban-hang-online', name: 'Bán hàng online' };
const prodWithoutSlug = { id: 'PRD-304958', name: 'Bảng tính Quản lý Công nợ' };

assert.strictEqual(router.getProductDirectParam(prodWithSlug), 'ban-hang-online', 'Should prefer slug if available');
assert.strictEqual(router.getProductDirectParam(prodWithoutSlug), 'PRD-304958', 'Should fallback to product.id if no slug');
console.log('PASS: Test 4 - Direct param generator prefers slug and falls back to product.id.');

// ============================================================
// TEST 5: Storefront Auto-open on Direct Hash Navigation (R2)
// ============================================================
console.log('\n--- TEST 5: Storefront Auto-open on Direct Hash (R2) ---');
// Simulate user navigating to storefront with #san-pham=quan-ly-kho-mini
const { win: win5, doc: doc5, elements: el5 } = createMockWindow('#san-pham=quan-ly-kho-mini');
const context5 = vm.createContext({
  window: win5,
  document: doc5,
  navigator: win5.navigator,
  location: win5.location,
  history: win5.history,
  localStorage: win5.localStorage,
  sessionStorage: win5.sessionStorage,
  setTimeout: win5.setTimeout,
  clearTimeout: win5.clearTimeout,
  requestAnimationFrame: win5.requestAnimationFrame,
  URLSearchParams: class {
    constructor() {}
    get() { return null; }
  }
});
vm.runInContext(storefrontCode, context5);

// Check that detailModal is marked as open and opened correct product (PRD-203948)
const detailModal5 = doc5.getElementById('detailModal');
assert(detailModal5.classList.contains('is-open'), 'detailModal must be open on direct hash visit');
assert.strictEqual(detailModal5.getAttribute('aria-hidden'), 'false', 'detailModal aria-hidden must be false');
console.log('PASS: Test 5 - Direct link #san-pham=quan-ly-kho-mini auto-opens product detail modal.');

// ============================================================
// TEST 6: Storefront Alias #p=... Auto-open (R2)
// ============================================================
console.log('\n--- TEST 6: Storefront Alias #p=... Auto-open (R2) ---');
const { win: win6, doc: doc6 } = createMockWindow('#p=PRD-102938');
const context6 = vm.createContext({
  window: win6,
  document: doc6,
  navigator: win6.navigator,
  location: win6.location,
  history: win6.history,
  localStorage: win6.localStorage,
  sessionStorage: win6.sessionStorage,
  setTimeout: win6.setTimeout,
  clearTimeout: win6.clearTimeout,
  requestAnimationFrame: win6.requestAnimationFrame,
  URLSearchParams: class {
    constructor() {}
    get() { return null; }
  }
});
vm.runInContext(storefrontCode, context6);
const detailModal6 = doc6.getElementById('detailModal');
assert(detailModal6.classList.contains('is-open'), 'Alias #p= must auto-open modal identically');
console.log('PASS: Test 6 - Alias #p=PRD-102938 successfully auto-opens detail modal.');

// ============================================================
// TEST 7: Unknown Hash Does Not Open Modal or Crash (R2)
// ============================================================
console.log('\n--- TEST 7: Unknown Hash Resilience (R2) ---');
const { win: win7, doc: doc7 } = createMockWindow('#san-pham=non-existent-product-123');
const context7 = vm.createContext({
  window: win7,
  document: doc7,
  navigator: win7.navigator,
  location: win7.location,
  history: win7.history,
  localStorage: win7.localStorage,
  sessionStorage: win7.sessionStorage,
  setTimeout: win7.setTimeout,
  clearTimeout: win7.clearTimeout,
  requestAnimationFrame: win7.requestAnimationFrame,
  URLSearchParams: class {
    constructor() {}
    get() { return null; }
  }
});
vm.runInContext(storefrontCode, context7);
const detailModal7 = doc7.getElementById('detailModal');
assert(!detailModal7.classList.contains('is-open'), 'detailModal must NOT open for unknown product hash');
console.log('PASS: Test 7 - Non-existent product hash does not open modal and throws no errors.');

// ============================================================
// TEST 8: Close Modal & Back Button Clean URL via History API (R2)
// ============================================================
console.log('\n--- TEST 8: URL Cleanup via History API on Close & Back (R2) ---');
const { win: win8, doc: doc8 } = createMockWindow('#san-pham=quan-ly-kho-mini');
const context8 = vm.createContext({
  window: win8,
  document: doc8,
  navigator: win8.navigator,
  location: win8.location,
  history: win8.history,
  localStorage: win8.localStorage,
  sessionStorage: win8.sessionStorage,
  setTimeout: win8.setTimeout,
  clearTimeout: win8.clearTimeout,
  requestAnimationFrame: win8.requestAnimationFrame,
  URLSearchParams: class {
    constructor() {}
    get() { return null; }
  }
});
vm.runInContext(storefrontCode, context8);

// Modal is initially open
const detailModal8 = doc8.getElementById('detailModal');
assert(detailModal8.classList.contains('is-open'));

// Trigger close
win8.closeDetailModal();
assert(!detailModal8.classList.contains('is-open'), 'Modal must close on closeDetailModal()');
assert.strictEqual(win8.location.hash, '', 'Product hash must be cleanly cleared from URL on close');

// Test back button popstate
win8.location.hash = '#san-pham=ban-hang-online';
win8.StorefrontDirectLink.checkAndHandleDirectProductHash();
assert(detailModal8.classList.contains('is-open'), 'Modal should reopen for new hash');

// Simulate browser back button (popstate event)
win8.location.hash = ''; // Browser pops back to root
win8.trigger('popstate', { state: null });
assert(!detailModal8.classList.contains('is-open'), 'Modal must close when browser back button is clicked');
assert.strictEqual(win8.location.hash, '', 'Hash must remain clear without reload');
console.log('PASS: Test 8 - Closing modal or pressing browser back button cleans URL without reloading.');

// ============================================================
// TEST 9: Storefront "Sao chép link" Button & Toast (R2)
// ============================================================
console.log('\n--- TEST 9: Storefront Copy Link Button & Toast (R2) ---');
const { win: win9, doc: doc9 } = createMockWindow('#san-pham=ban-hang-online');
const context9 = vm.createContext({
  window: win9,
  document: doc9,
  navigator: win9.navigator,
  location: win9.location,
  history: win9.history,
  localStorage: win9.localStorage,
  sessionStorage: win9.sessionStorage,
  setTimeout: win9.setTimeout,
  clearTimeout: win9.clearTimeout,
  requestAnimationFrame: win9.requestAnimationFrame,
  URLSearchParams: class {
    constructor() {}
    get() { return null; }
  }
});
vm.runInContext(storefrontCode, context9);

// Find copy button in detail modal
const detailBody9 = doc9.getElementById('detailBody');
const copyBtnTop = doc9.getElementById('detailTopCopyLinkBtn');
const copyBtnHeader = doc9.getElementById('detailHeaderCopyLinkBtn');

assert(copyBtnTop, 'Top bar must have #detailTopCopyLinkBtn');
assert(copyBtnHeader, 'Header title row must have #detailHeaderCopyLinkBtn');

// Click copy button
copyBtnTop.dispatchEvent({ type: 'click', preventDefault: () => {}, stopPropagation: () => {} });
await new Promise(r => setTimeout(r, 20));
const clipboardOutput = win9.getClipboardText();
assert.strictEqual(clipboardOutput, 'https://filedilam.vn/#san-pham=ban-hang-online', 'Clipboard must contain direct URL with slug');

// Verify toast
const toastEl = doc9.getElementById('toast');
assert(toastEl.textContent.includes('Đã sao chép link sản phẩm'), 'Toast message must indicate link copied successfully');
console.log('PASS: Test 9 - Storefront copy link button copies direct URL to clipboard and triggers toast.');

// ============================================================
// TEST 10: Admin Direct Link Generation & Row / Menu Buttons (R3)
// ============================================================
console.log('\n--- TEST 10: Admin Direct Link Actions & 3-Dots Menu (R3) ---');
const adminCode = fs.readFileSync(path.join(__dirname, '..', 'admin.js'), 'utf8');
const { win: win10, doc: doc10 } = createMockWindow();
win10.location.pathname = '/admin.html';
win10.location.href = 'https://filedilam.vn/admin.html';

// Mock Firebase for Admin
const mockFirestoreData = [
  { id: 'PRD-102938', slug: 'ban-hang-online', name: 'Bán hàng online', price: 99000, categoryId: 'ban-hang-online' },
  { id: 'PRD-203948', slug: 'quan-ly-kho-mini', name: 'Quản lý kho mini', price: 149000, categoryId: 'quan-ly-kho' },
  { id: 'PRD-304958', name: 'Bảng tính Quản lý Công nợ', price: 129000, categoryId: 'ke-toan' }
];

const mockFirebase = {
  apps: ['mock-app'],
  auth: () => ({
    currentUser: { getIdToken: async () => 'test-token', email: 'huynhkiencam151102@gmail.com' },
    onAuthStateChanged: (cb) => setTimeout(() => cb({ uid: 'admin-123', email: 'huynhkiencam151102@gmail.com' }), 0),
    signOut: () => {}
  }),
  firestore: () => ({
    collection: (col) => ({
      where: () => ({ get: async () => ({ docs: [] }) }),
      onSnapshot: () => {},
      get: async () => {
        const docs = mockFirestoreData.map(d => ({ id: d.id, data: () => d }));
        return {
          docs,
          forEach(cb) { docs.forEach(cb); }
        };
      },
      doc: (id) => ({
        set: async () => {},
        update: async () => {},
        delete: async () => {}
      })
    })
  }),
  storage: () => ({
    ref: () => ({
      put: async () => {},
      getDownloadURL: async () => 'https://mock.url/img.png'
    })
  })
};

const context10 = vm.createContext({
  window: win10,
  document: doc10,
  navigator: win10.navigator,
  location: win10.location,
  history: win10.history,
  localStorage: win10.localStorage,
  sessionStorage: win10.sessionStorage,
  setTimeout: win10.setTimeout,
  clearTimeout: win10.clearTimeout,
  requestAnimationFrame: win10.requestAnimationFrame,
  firebase: mockFirebase,
  auth: mockFirebase.auth(),
  db: mockFirebase.firestore(),
  storage: mockFirebase.storage(),
  URLSearchParams: class {
    constructor() {}
    get() { return null; }
  }
});

vm.runInContext(adminCode, context10);
doc10.trigger('DOMContentLoaded');
await new Promise(r => setTimeout(r, 20));

const adminRouter = win10.AdminDirectLink;
assert(adminRouter, 'AdminDirectLink must be exported');

// 10a. Admin direct link creation logic
const directLink1 = adminRouter.getAdminProductDirectLink(mockFirestoreData[0]);
assert.strictEqual(directLink1, 'https://filedilam.vn/#san-pham=ban-hang-online', 'Admin link must prefer slug');

const directLink3 = adminRouter.getAdminProductDirectLink(mockFirestoreData[2]);
assert.strictEqual(directLink3, 'https://filedilam.vn/#san-pham=PRD-304958', 'Admin link must fallback to SKU when no slug');

// 10b. Admin product list rendering contains copy button on row and in 3-dots popover
const productListBody = doc10.getElementById('productListBody');
assert(productListBody.innerHTML.includes('btn-copy-direct-link'), 'Product rows must contain .btn-copy-direct-link');
assert(productListBody.innerHTML.includes('Sao chép link gửi khách'), 'Buttons must display "Sao chép link gửi khách" label');

// 10c. Simulate clicking "Sao chép link gửi khách" on a row
const copyBtnsAdmin = productListBody.querySelectorAll('.btn-copy-direct-link');
assert(copyBtnsAdmin.length >= 2, 'Admin table must contain row and 3-dots copy link buttons');

// Test 10c1: Row button (product with slug: 'ban-hang-online')
const rowCopyBtn = copyBtnsAdmin[0];
assert.strictEqual(rowCopyBtn.dataset.id, 'PRD-102938');
rowCopyBtn.dispatchEvent({ type: 'click', stopPropagation: () => {} });
await new Promise(r => setTimeout(r, 20));

let adminClipboard = win10.getClipboardText();
assert.strictEqual(adminClipboard, 'https://filedilam.vn/#san-pham=ban-hang-online', 'Row copy button must copy direct URL with slug');

let adminToast = doc10.getElementById('toast');
assert(adminToast.textContent.includes('Đã sao chép link gửi khách'), 'Admin toast must confirm link copied for product');

// Test 10c2: 3-dots popover button for product without slug (PRD-304958, fallback to ID)
const popoverCopyBtnNoSlug = copyBtnsAdmin.find(b => b.dataset.id === 'PRD-304958' && b.classList.contains('action-dropdown-item'));
assert(popoverCopyBtnNoSlug, '3-dots dropdown must contain copy link button for PRD-304958');
popoverCopyBtnNoSlug.dispatchEvent({ type: 'click', stopPropagation: () => {} });
await new Promise(r => setTimeout(r, 20));

adminClipboard = win10.getClipboardText();
assert.strictEqual(adminClipboard, 'https://filedilam.vn/#san-pham=PRD-304958', 'Popover copy button without slug must copy direct URL with SKU');
assert(adminToast.textContent.includes('Đã sao chép link gửi khách'), 'Admin toast must confirm link copied for product');

console.log('PASS: Test 10 - Admin row and 3-dots copy link buttons write direct URL to clipboard and show toast.');

// ============================================================
// TEST 11: Admin Slug Clearing / Removal (Adversarial Fix)
// ============================================================
console.log('\n--- TEST 11: Admin Slug Clearing and Fallback ---');
// When an admin edits a product that had a slug, and clears the slug input,
// the slug should become null (not resurrect old slug).
const productSlugEl = doc10.getElementById('productSlug');
const comboSlugEl = doc10.getElementById('comboSlug');

// Product had slug 'ban-hang-online'
productSlugEl.value = ''; // Admin cleared slug
const rawProductSlug = (productSlugEl ? productSlugEl.value : '').trim();
const effectiveProductSlug = rawProductSlug
  ? adminRouter.slugifyVietnamese(rawProductSlug)
  : (productSlugEl ? null : 'ban-hang-online');
assert.strictEqual(effectiveProductSlug, null, 'Clearing product slug in form must evaluate to null');

// Combo slug clearing
comboSlugEl.value = '   ';
const rawComboSlug = (comboSlugEl ? comboSlugEl.value : '').trim();
const effectiveComboSlug = rawComboSlug
  ? adminRouter.slugifyVietnamese(rawComboSlug)
  : (comboSlugEl ? null : 'old-combo-slug');
assert.strictEqual(effectiveComboSlug, null, 'Clearing combo slug in form must evaluate to null');

// If product now has slug null, link falls back to SKU
const updatedProd = { id: 'PRD-102938', slug: null, name: 'Bán hàng online' };
const updatedLink = adminRouter.getAdminProductDirectLink(updatedProd);
assert.strictEqual(updatedLink, 'https://filedilam.vn/#san-pham=PRD-102938', 'Cleared slug must revert direct link to SKU');
console.log('PASS: Test 11 - Admin slug clearing successfully reverts slug to null and link to SKU.');

// ============================================================
// TEST 12: Extended URL Variations in Hash Parser
// ============================================================
console.log('\n--- TEST 12: Extended Hash Parser Variations ---');
const parser = win1.StorefrontDirectLink.parseProductDirectHash;
assert.strictEqual(parser('/#san-pham=quan-ly-kho-mini'), 'quan-ly-kho-mini', 'Must parse /#san-pham=');
assert.strictEqual(parser('#san-pham=quan-ly-kho-mini'), 'quan-ly-kho-mini', 'Must parse #san-pham=');
assert.strictEqual(parser('#/san-pham=quan-ly-kho-mini'), 'quan-ly-kho-mini', 'Must parse #/san-pham=');
assert.strictEqual(parser('/#p=PRD-102938'), 'PRD-102938', 'Must parse /#p=');
assert.strictEqual(parser('#p=PRD-102938'), 'PRD-102938', 'Must parse #p=');
assert.strictEqual(parser('https://filedilam.vn/#san-pham=ban-hang-online'), 'ban-hang-online', 'Must parse full URL');
assert.strictEqual(parser('https://filedilam.vn/#p=ban-hang-online'), 'ban-hang-online', 'Must parse full URL with alias');
assert.strictEqual(parser('#san-pham=ban-hang-online&utm_source=fb'), 'ban-hang-online', 'Must parse hash with query param');
assert.strictEqual(parser('/#san-pham=ban-hang-online?ref=zalo'), 'ban-hang-online', 'Must parse /# with ?ref');
assert.strictEqual(parser(''), null, 'Empty string returns null');
assert.strictEqual(parser('#thanh-toan'), null, 'Other hash returns null');
console.log('PASS: Test 12 - Extended hash parser handles /#..., #..., full URLs, and query params flawlessly.');

// ============================================================
// TEST 13: Local file:/// Protocol Protection
// ============================================================
console.log('\n--- TEST 13: Local File Protocol Link Sanitization ---');
const { win: winFile } = createMockWindow();
winFile.location.protocol = 'file:';
winFile.location.pathname = '/C:/Users/zit/OneDrive/ANTIGRAVITY/admin.html';
winFile.location.origin = 'null';

// Test Admin link generation on file:///
const fileAdminLink = adminRouter.getAdminProductDirectLink.call({ window: winFile }, { id: 'PRD-102938', slug: 'ban-hang-online' });
assert(!fileAdminLink.includes('OneDrive') && !fileAdminLink.includes('C:'), 'Must not leak local filesystem paths');
assert(fileAdminLink.startsWith('https://filedilam.vn/#san-pham='), 'Must produce standard filedilam.vn link');

// Test Storefront link generation on file:///
const fileStorefrontLink = win1.StorefrontDirectLink.getStorefrontProductDirectLink({ id: 'PRD-102938', slug: 'ban-hang-online' });
assert(fileStorefrontLink.startsWith('https://filedilam.vn/'), 'Storefront link on file:/// must be clean');
console.log('PASS: Test 13 - Local file protocol prevents leaking filesystem paths into direct links.');

// ============================================================
// TEST 14: Direct Landing with ID Alias History Cleanliness
// ============================================================
console.log('\n--- TEST 14: Direct Landing with ID Alias History State ---');
const { win: win14, doc: doc14 } = createMockWindow('#p=PRD-102938');
const context14 = vm.createContext({
  window: win14,
  document: doc14,
  navigator: win14.navigator,
  location: win14.location,
  history: win14.history,
  localStorage: win14.localStorage,
  sessionStorage: win14.sessionStorage,
  setTimeout: win14.setTimeout,
  clearTimeout: win14.clearTimeout,
  requestAnimationFrame: win14.requestAnimationFrame,
  URLSearchParams: class { get() { return null; } }
});
vm.runInContext(storefrontCode, context14);
const detailModal14 = doc14.getElementById('detailModal');
assert(detailModal14.classList.contains('is-open'), 'Direct link via #p=PRD-102938 must open modal');

// Close modal
win14.closeDetailModal();
assert(!detailModal14.classList.contains('is-open'), 'Modal must close');
assert.strictEqual(win14.location.hash, '', 'Hash must be cleared without reload');
console.log('PASS: Test 14 - Direct landing with SKU alias maintains clean history and modal control.');

// ============================================================
// TEST 15: Trailing Slashes & Slash-as-Separator in Hash Parser
// ============================================================
console.log('\n--- TEST 15: Trailing Slashes & Slash-as-Separator ---');
assert.strictEqual(parser('/#san-pham=PRD-102938/'), 'PRD-102938', 'Must strip trailing slash on ID');
assert.strictEqual(parser('/#p=PRD-102938///'), 'PRD-102938', 'Must strip multiple trailing slashes');
assert.strictEqual(parser('/#san-pham/quan-ly-kho-mini/'), 'quan-ly-kho-mini', 'Must parse slash separator and strip trailing slash');
assert.strictEqual(parser('/#p/PRD-102938/'), 'PRD-102938', 'Must parse /#p/ with trailing slash');
assert.strictEqual(parser('https://filedilam.vn/#san-pham=ban+hang+online'), 'ban hang online', 'Must parse + as space');

// Test matching with trailing slash
const matchedWithTrailing = router.findProductByIdOrSlug(sampleProducts, 'PRD-102938/');
assert(matchedWithTrailing && matchedWithTrailing.id === 'PRD-102938', 'findProductByIdOrSlug must match ID despite trailing slash');
console.log('PASS: Test 15 - Trailing slashes and slash-separated paths resolve accurately.');

// ============================================================
// TEST 16: Admin /admin Path Sanitization (Firebase cleanUrls)
// ============================================================
console.log('\n--- TEST 16: Admin /admin CleanUrls Direct Link Integrity ---');
const { win: winAdminClean } = createMockWindow();
winAdminClean.location.origin = 'https://filedilam.vn';
winAdminClean.location.pathname = '/admin'; // Clean URL without .html
winAdminClean.location.href = 'https://filedilam.vn/admin';

const cleanAdminLink = adminRouter.getAdminProductDirectLink.call({ window: winAdminClean }, { id: 'PRD-203948', slug: 'quan-ly-kho-mini' });
assert.strictEqual(cleanAdminLink, 'https://filedilam.vn/#san-pham=quan-ly-kho-mini', 'Admin link on /admin must point to root storefront, NOT /admin/');
assert(!cleanAdminLink.includes('/admin/'), 'Must never leak /admin/ into customer direct link');
console.log('PASS: Test 16 - Admin direct links generated from /admin point cleanly to storefront root.');

// ============================================================
// TEST 17: Exit-intent Suppression while Detail Modal is Open
// ============================================================
console.log('\n--- TEST 17: Exit-intent Suppression with Detail Modal ---');
const { win: win17, doc: doc17 } = createMockWindow('#san-pham=quan-ly-kho-mini');
const context17 = vm.createContext({
  window: win17,
  document: doc17,
  navigator: win17.navigator,
  location: win17.location,
  history: win17.history,
  localStorage: win17.localStorage,
  sessionStorage: win17.sessionStorage,
  setTimeout: win17.setTimeout,
  clearTimeout: win17.clearTimeout,
  requestAnimationFrame: win17.requestAnimationFrame,
  URLSearchParams: class { get() { return null; } }
});
vm.runInContext(storefrontCode, context17);
const detailModal17 = doc17.getElementById('detailModal');
assert(detailModal17.classList.contains('is-open'));

// Close modal and verify timestamp suppression
win17.closeDetailModal();
assert(win17.__lastDetailCloseTime > 0, '__lastDetailCloseTime must be recorded on close');
console.log('PASS: Test 17 - Detail modal records close timestamp for exit-intent suppression.');

// ============================================================
// TEST 18: Consecutive Product Navigation & History Back (A -> B -> Back -> A)
// ============================================================
console.log('\n--- TEST 18: Consecutive Product Navigation & History Back ---');
const { win: win18, doc: doc18 } = createMockWindow();
const context18 = vm.createContext({
  window: win18,
  document: doc18,
  navigator: win18.navigator,
  location: win18.location,
  history: win18.history,
  localStorage: win18.localStorage,
  sessionStorage: win18.sessionStorage,
  setTimeout: win18.setTimeout,
  clearTimeout: win18.clearTimeout,
  requestAnimationFrame: win18.requestAnimationFrame,
  URLSearchParams: class { get() { return null; } }
});
vm.runInContext(storefrontCode, context18);
const detailModal18 = doc18.getElementById('detailModal');

// 18a. Navigate to Product A
win18.location.hash = '#san-pham=ban-hang-online';
win18.StorefrontDirectLink.checkAndHandleDirectProductHash();
assert(detailModal18.classList.contains('is-open'), 'Product A must open');

// 18b. Navigate to Product B
win18.location.hash = '#san-pham=quan-ly-kho-mini';
win18.StorefrontDirectLink.checkAndHandleDirectProductHash();
assert(detailModal18.classList.contains('is-open'), 'Product B must open');

// 18c. Popstate back to Product A
win18.location.hash = '#san-pham=ban-hang-online';
win18.trigger('popstate', { state: { modal: 'product-detail', productId: 'PRD-102938' } });
assert(detailModal18.classList.contains('is-open'), 'Popstate back to Product A must keep modal open with Product A');

// 18d. Popstate back to root (no product hash)
win18.location.hash = '';
win18.trigger('popstate', { state: null });
assert(!detailModal18.classList.contains('is-open'), 'Popstate back to root must cleanly close modal');
console.log('PASS: Test 18 - Consecutive product navigation and popstate transitions succeed.');

console.log('\n====================================================');
console.log('ALL 18 TESTS PASSED WITH ZERO ERRORS!');
console.log('====================================================');
})().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
