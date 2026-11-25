/**
 * Automated Verification Suite for Retention Email & 1-Click Checkout / Explore All Link
 * Tests real Chrome headless browser (with live Firestore) + isolated delayed-Firestore VM edge cases + functions/main.py email template assertions.
 */
const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');
const vm = require('vm');

const PORT = 8094;
const CHROME_PORT = 9226;
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const WORKSPACE_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function startStaticServer() {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0].split('#')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(WORKSPACE_DIR, reqPath.replace(/^\//, ''));
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

async function openCdpSession(url) {
  const userDataDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'fdl-chrome-'));
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1280,900',
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const resp = await fetch(`http://127.0.0.1:${CHROME_PORT}/json`);
      const tabs = await resp.json();
      const pageTab = tabs.find(t => t.type === 'page');
      if (pageTab && pageTab.webSocketDebuggerUrl) {
        wsUrl = pageTab.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    chromeProcess.kill();
    throw new Error('Failed to connect to Chrome CDP');
  }

  const ws = new WebSocket(wsUrl);
  let msgId = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };
  await new Promise(r => { ws.onopen = r; });

  function sendCommand(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await sendCommand('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.result && res.result.exceptionDetails) {
      throw new Error(JSON.stringify(res.result.exceptionDetails));
    }
    return res.result && res.result.result ? res.result.result.value : null;
  }

  await sendCommand('Runtime.enable');
  await sendCommand('Page.enable');
  await sendCommand('Page.navigate', { url });

  return {
    sendCommand,
    evaluate,
    async close() {
      try { ws.close(); } catch (e) {}
      try { chromeProcess.kill(); } catch (e) {}
      await new Promise(r => setTimeout(r, 300));
      try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
    }
  };
}

function testEmailTemplateSource() {
  console.log('\n--- TEST 1: functions/main.py Retention Email Template Verification ---');
  const mainPy = fs.readFileSync(path.join(WORKSPACE_DIR, 'functions', 'main.py'), 'utf8');
  const fnMatch = mainPy.match(/def send_retention_voucher_email\([\s\S]*?(?=\ndef send_order_success_email)/);
  assert(fnMatch, 'Could not locate send_retention_voucher_email in functions/main.py');
  const fnBody = fnMatch[0];

  // Extract string literals inside html_content, plain_text, cards_html, and msg["Subject"]
  const emailOutputStart = fnBody.indexOf('cards_html = []');
  assert(emailOutputStart !== -1, 'Could not locate email template construction');
  const emailTemplateCode = fnBody.slice(emailOutputStart);

  // Forbidden phrases must NOT appear anywhere in the email text/subject
  const forbidden = ['tối đa 20.000đ', 'tối đa 20.000', 'Chi phí chuẩn', 'Giá gốc', 'Giá niêm yết', 'giá gốc', 'giá niêm yết'];
  for (const term of forbidden) {
    assert(!emailTemplateCode.includes(term), `Email template must NOT contain forbidden phrase: "${term}"`);
  }

  // Required phrases & formatting
  assert(emailTemplateCode.includes('Mức phí: <span>{price_fmt}</span>'), 'Must format price with "Mức phí:"');
  assert(emailTemplateCode.includes('Đặc quyền thành viên: <strong'), 'Must format member price with "Đặc quyền thành viên:"');
  assert(emailTemplateCode.includes('Đặc quyền tài trợ 30% chi phí khi cần thêm giải pháp đồng hành'), 'Must contain exact approved privilege wording');
  assert(emailTemplateCode.includes('msg["Subject"] = f"Thư cảm ơn và quà tặng đồng hành gửi {subject_name_part} - File Đi Làm"'), 'Must use approved subject format');
  assert(fnBody.includes('min((p_price * 30 + 50) // 100, 20000)'), 'Backend discount cap rule (max 20,000đ) must be preserved');
  assert(emailTemplateCode.includes('https://filedilam.web.app/?add={p_id}&{user_params}'), 'Must include 1-click direct_buy_url');
  assert(emailTemplateCode.includes('https://filedilam.web.app/?{user_params}'), 'Must include explore_all_url with prefill params');
  assert(emailTemplateCode.includes('{explore_all_url}') && fnBody.includes('plain_text ='), 'plain_text must also use explore_all_url');
  assert(fnBody.includes('("khách hàng", "quý khách")'), 'Must normalize placeholder customer names like "Khách hàng"');
  assert(fnBody.includes('clean_name.lower().startswith("bạn ")'), 'Must avoid duplicate "bạn bạn" in subject');
  console.log('PASS: Test 1 - Email template copy, subject, pricing format, and backend cap verified.');
}

async function testBrowserDirectBuy1Click() {
  console.log('\n--- TEST 2: Real Chrome E2E - 1-Click Direct Buy Link (?add=PRD-662235&coupon=MEMBER30) ---');
  const targetUrl = `http://localhost:${PORT}/index.html?add=PRD-662235&name=Ki%C3%AAn%20C%E1%BA%A9m&email=huynhkiencam151102%40gmail.com&phone=0938134576&coupon=MEMBER30`;
  const session = await openCdpSession(targetUrl);
  try {
    let observed = null;
    for (let i = 0; i < 100; i++) {
      observed = await session.evaluate(`
        (function() {
          var modal = document.getElementById('checkoutModal');
          var isOpen = !!(modal && modal.classList.contains('is-open'));
          var codeEl = document.getElementById('appliedCouponCodeDisplay');
          var discEl = document.getElementById('checkoutDiscountVal');
          var grandEl = document.getElementById('checkoutGrandTotal');
          var itemsEl = document.getElementById('checkoutItems');
          var qName = document.getElementById('quickName');
          var qEmail = document.getElementById('quickEmail');
          var qPhone = document.getElementById('quickPhone');
          var appliedCode = (window.state && window.state.appliedCoupons && window.state.appliedCoupons[0]) ? window.state.appliedCoupons[0].code : null;
          return {
            isOpen: isOpen,
            appliedCode: appliedCode,
            codeDisplay: codeEl ? codeEl.textContent.trim() : '',
            discountVal: discEl ? discEl.textContent.trim() : '',
            grandTotal: grandEl ? grandEl.textContent.trim() : '',
            itemsText: itemsEl ? itemsEl.textContent : '',
            quickName: qName ? qName.value : '',
            quickEmail: qEmail ? qEmail.value : '',
            quickPhone: qPhone ? qPhone.value : '',
            cartIds: window.state ? window.state.cart.map(function(c){ return c.productId; }) : [],
            hash: window.location.hash
          };
        })()
      `);
      if (observed && observed.isOpen && observed.appliedCode === 'MEMBER30') break;
      await new Promise(r => setTimeout(r, 200));
    }

    assert(observed && observed.isOpen, 'Checkout modal MUST open automatically from ?add=PRD-662235 link');
    assert.strictEqual(observed.cartIds[0], 'PRD-662235', 'PRD-662235 must be added/prioritized in cart');
    assert(observed.itemsText.includes('Quản Lý Kho'), 'Checkout summary must render Quản Lý Kho & Nhập Xuất Tồn');
    assert.strictEqual(observed.appliedCode, 'MEMBER30', 'MEMBER30 must be applied automatically');
    assert.strictEqual(observed.codeDisplay, 'MEMBER30', 'Applied coupon display must show MEMBER30');
    assert(observed.discountVal.includes('14.700'), `Expected 14.700 discount for 49k product, got ${observed.discountVal}`);
    assert(observed.grandTotal.includes('34.300'), `Expected 34.300 total, got ${observed.grandTotal}`);
    assert.strictEqual(observed.quickName, 'Kiên Cẩm', 'Name input must be pre-filled');
    assert.strictEqual(observed.quickEmail, 'huynhkiencam151102@gmail.com', 'Email input must be pre-filled');
    assert.strictEqual(observed.quickPhone, '0938134576', 'Phone input must be pre-filled');

    // Wait 1.8s to verify async Firestore listeners/auth/exit-intent do not wipe profile, coupon, or history
    await new Promise(r => setTimeout(r, 1800));
    const afterWait = await session.evaluate(`
      ({
        isOpen: document.getElementById('checkoutModal').classList.contains('is-open'),
        appliedCode: window.state.appliedCoupons[0] ? window.state.appliedCoupons[0].code : null,
        quickName: document.getElementById('quickName').value,
        quickEmail: document.getElementById('quickEmail').value,
        quickPhone: document.getElementById('quickPhone').value,
        hash: window.location.hash
      })
    `);
    assert.strictEqual(afterWait.isOpen, true, 'Checkout modal must stay open after async initialization');
    assert.strictEqual(afterWait.appliedCode, 'MEMBER30', 'MEMBER30 must NOT be overwritten by FILEDILAM30');
    assert.strictEqual(afterWait.quickName, 'Kiên Cẩm', 'Name must not be wiped by initAuth');
    assert.strictEqual(afterWait.quickEmail, 'huynhkiencam151102@gmail.com', 'Email must not be wiped by initAuth');
    assert.strictEqual(afterWait.quickPhone, '0938134576', 'Phone must not be wiped by initAuth');
    assert.strictEqual(afterWait.hash, '#thanh-toan', 'URL hash must stay #thanh-toan');
    console.log('PASS: Test 2 - Fresh-session 1-click checkout opens Order screen with PRD-662235, MEMBER30 (34.300 đ), and pre-filled customer info.');
  } finally {
    await session.close();
  }
}

async function testBrowserExploreAllLink() {
  console.log('\n--- TEST 3: Real Chrome E2E - Explore All Link (?name=...&coupon=MEMBER30 -> Browse -> Buy Now) ---');
  const targetUrl = `http://localhost:${PORT}/index.html?name=Minh%20Anh&email=minhanh%40gmail.com&phone=0901234567&coupon=MEMBER30`;
  const session = await openCdpSession(targetUrl);
  try {
    // Wait for Firestore products to load and initAuth to settle
    for (let i = 0; i < 100; i++) {
      const ready = await session.evaluate(`
        window.isFirestoreProductsLoaded === true &&
        window.StorefrontData &&
        window.StorefrontData.products.some(function(p) { return p.id === 'PRD-818270'; })
      `);
      if (ready) break;
      await new Promise(r => setTimeout(r, 200));
    }
    await new Promise(r => setTimeout(r, 800));

    const initialCheckoutOpen = await session.evaluate(`document.getElementById('checkoutModal').classList.contains('is-open')`);
    assert.strictEqual(initialCheckoutOpen, false, 'Explore all link must stay on storefront homepage initially');

    // Click product card PRD-818270, then click "Mua ngay"
    await session.evaluate(`
      (function() {
        var card = document.querySelector('.product-card[data-detail-id="PRD-818270"]');
        if (!card) throw new Error('Product card PRD-818270 not found');
        card.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 200));
    await session.evaluate(`
      (function() {
        var buyBtn = document.getElementById('detailBuyNow');
        if (!buyBtn) throw new Error('detailBuyNow button not found');
        buyBtn.click();
      })()
    `);

    let observed = null;
    for (let i = 0; i < 30; i++) {
      observed = await session.evaluate(`
        ({
          isOpen: document.getElementById('checkoutModal').classList.contains('is-open'),
          appliedCode: (window.state.appliedCoupons && window.state.appliedCoupons[0]) ? window.state.appliedCoupons[0].code : null,
          discountVal: document.getElementById('checkoutDiscountVal').textContent.trim(),
          grandTotal: document.getElementById('checkoutGrandTotal').textContent.trim(),
          quickName: document.getElementById('quickName').value,
          quickEmail: document.getElementById('quickEmail').value,
          quickPhone: document.getElementById('quickPhone').value
        })
      `);
      if (observed && observed.isOpen && observed.appliedCode === 'MEMBER30') break;
      await new Promise(r => setTimeout(r, 200));
    }

    assert(observed && observed.isOpen, 'Checkout modal must open after clicking Buy Now');
    assert.strictEqual(observed.appliedCode, 'MEMBER30', 'MEMBER30 from explore_all_url must auto-apply instead of FILEDILAM30');
    assert(observed.discountVal.includes('11.700'), `Expected 11.700 discount for 39k product, got ${observed.discountVal}`);
    assert(observed.grandTotal.includes('27.300'), `Expected 27.300 total, got ${observed.grandTotal}`);
    assert.strictEqual(observed.quickName, 'Minh Anh', 'Name from explore_all_url must pre-fill checkout form');
    assert.strictEqual(observed.quickEmail, 'minhanh@gmail.com', 'Email from explore_all_url must pre-fill checkout form');
    assert.strictEqual(observed.quickPhone, '0901234567', 'Phone from explore_all_url must pre-fill checkout form');
    console.log('PASS: Test 3 - explore_all_url preserves MEMBER30 and customer profile across browsing into checkout.');
  } finally {
    await session.close();
  }
}

async function testDelayedFirestoreAndEdgeCasesVm() {
  console.log('\n--- TEST 4: VM Edge Cases (Delayed Firestore, Stale Cache, Active Order Isolation, Deselect, Unknown Product) ---');
  const storefrontCode = fs.readFileSync(path.join(WORKSPACE_DIR, 'storefront.js'), 'utf8');

  function runVmScenario({ search = '', staleCache = null, activeOrder = null, existingCart = null }) {
    const elements = {};
    const makeEl = (id = '', tag = 'div') => {
      const el = {
        id,
        tagName: tag.toUpperCase(),
        style: { setProperty() {}, removeProperty() {} },
        classList: {
          _s: new Set(),
          add(c) { this._s.add(c); },
          remove(c) { this._s.delete(c); },
          contains(c) { return this._s.has(c); },
          toggle(c, f) { if (f === undefined) { if (this.contains(c)) this.remove(c); else this.add(c); } else if (f) this.add(c); else this.remove(c); }
        },
        attrs: {},
        setAttribute(k, v) { this.attrs[k] = String(v); },
        getAttribute(k) { return this.attrs[k] !== undefined ? this.attrs[k] : null; },
        children: [],
        appendChild(c) { this.children.push(c); return c; },
        removeChild(c) { this.children = this.children.filter(x => x !== c); return c; },
        value: '',
        textContent: '',
        _html: '',
        set innerHTML(v) { this._html = String(v); },
        get innerHTML() { return this._html; },
        addEventListener() {},
        removeEventListener() {},
        querySelector() { return null; },
        querySelectorAll() { return []; },
        closest() { return null; },
        focus() {},
        scrollTo() {},
        getBoundingClientRect() { return { top: 0, bottom: 0, width: 0, height: 0 }; }
      };
      if (id) elements[id] = el;
      return el;
    };

    const doc = {
      title: 'File Đi Làm',
      body: makeEl('body', 'body'),
      getElementById(id) { return elements[id] || makeEl(id); },
      createElement(t) { return makeEl('', t); },
      querySelector() { return null; },
      querySelectorAll() { return []; },
      addEventListener() {}
    };

    const lsData = {};
    if (staleCache) lsData['filedilam_cached_products_v5'] = JSON.stringify(staleCache);
    if (activeOrder) lsData['filedilam_active_order'] = JSON.stringify(activeOrder);
    if (existingCart) lsData['fileDiLamCart'] = JSON.stringify(existingCart);

    const ssData = {};
    let productSnapshotCb = null;
    let couponSnapshotCb = null;
    let authCb = null;
    const intervals = new Map();
    let intervalSeq = 1;

    const win = {
      innerWidth: 1280,
      location: { origin: 'https://filedilam.web.app', pathname: '/', search, hash: '', protocol: 'https:' },
      history: { pushState(s, t, u) { if (u.includes('#')) win.location.hash = u.slice(u.indexOf('#')); }, replaceState() {} },
      localStorage: {
        get length() { return Object.keys(lsData).length; },
        key(i) { return Object.keys(lsData)[i] || null; },
        getItem(k) { return lsData[k] !== undefined ? lsData[k] : null; },
        setItem(k, v) { lsData[k] = String(v); },
        removeItem(k) { delete lsData[k]; }
      },
      sessionStorage: {
        getItem(k) { return ssData[k] !== undefined ? ssData[k] : null; },
        setItem(k, v) { ssData[k] = String(v); },
        removeItem(k) { delete ssData[k]; }
      },
      addEventListener() {},
      scrollTo() {},
      setTimeout(fn) { return 1; },
      clearTimeout() {},
      setInterval(fn) { const id = intervalSeq++; intervals.set(id, fn); return id; },
      clearInterval(id) { intervals.delete(id); },
      requestAnimationFrame(fn) { return 1; },
      StorefrontData: {
        store: { bankAccount: { bankShortName: 'TPBank', number: '59215112002', owner: 'HUYNH KIEN CAM', notePrefix: 'FILEDILAM' } },
        categories: [{ id: 'all', name: 'Tất cả' }],
        products: [{ id: 'PRD-102938', name: 'Bán hàng online', price: 39000, type: 'google_sheets' }]
      },
      firebase: {
        auth: () => ({
          onAuthStateChanged(cb) { authCb = cb; return () => {}; }
        }),
        firestore: () => ({
          collection(name) {
            if (name === 'products') {
              return {
                onSnapshot(cb) { productSnapshotCb = cb; }
              };
            }
            if (name === 'coupons') {
              return {
                where() { return { onSnapshot(cb) { couponSnapshotCb = cb; }, limit() { return { get: async () => ({ empty: true, docs: [], forEach() {} }) }; }, get: async () => ({ empty: true, forEach() {} }) }; },
                doc(id) {
                  return {
                    get: async () => {
                      if (id === 'MEMBER30') {
                        return { exists: true, id: 'MEMBER30', data: () => ({ code: 'MEMBER30', type: 'percent', value: 30, max_discount: 20000, min_order: 0, is_active: true, is_public: false, scope: 'all' }) };
                      }
                      if (id === 'TIETKIEM10') {
                        return { exists: true, id: 'TIETKIEM10', data: () => ({ code: 'TIETKIEM10', type: 'fixed', value: 10000, max_discount: 0, min_order: 65000, is_active: true, is_public: true, scope: 'all' }) };
                      }
                      return { exists: false };
                    }
                  };
                },
                get: async () => ({ empty: true, forEach() {} })
              };
            }
            return { onSnapshot() {}, get: async () => ({ empty: true }) };
          }
        })
      }
    };

    const ctx = vm.createContext({
      window: win,
      document: doc,
      navigator: { userAgent: 'node' },
      location: win.location,
      history: win.history,
      firebase: win.firebase,
      localStorage: win.localStorage,
      sessionStorage: win.sessionStorage,
      setTimeout: win.setTimeout,
      clearTimeout: win.clearTimeout,
      setInterval: win.setInterval,
      clearInterval: win.clearInterval,
      requestAnimationFrame: win.requestAnimationFrame,
      URLSearchParams,
      Intl,
      console
    });
    vm.runInContext(storefrontCode, ctx);
    return {
      win, doc, elements, intervals,
      fireAuth(user) { if (authCb) authCb(user); },
      fireCoupons(list) {
        if (couponSnapshotCb) {
          couponSnapshotCb({
            forEach(fn) { list.forEach(c => fn({ id: c.code, data: () => c })); }
          });
        }
      },
      fireProducts(list) {
        if (productSnapshotCb) {
          productSnapshotCb({
            forEach(fn) { list.forEach(p => fn({ id: p.id, data: () => p })); }
          });
        }
      }
    };
  }

  // 4a. Stale cache without PRD-662235, auth fires null first, then Firestore arrives later
  const s4a = runVmScenario({
    search: '?add=PRD-662235&name=Anh%20Khoa&email=khoa%40gmail.com&phone=0912345678&coupon=MEMBER30',
    staleCache: [{ id: 'PRD-102938', name: 'Bán hàng online', price: 39000, type: 'google_sheets' }],
    activeOrder: { order_id: 'DH999999', product_id: 'PRD-102938', amount: 39000, time: Date.now() },
    existingCart: [{ productId: 'PRD-818270', quantity: 1 }]
  });
  s4a.fireAuth(null); // Must NOT wipe URL prefill!
  assert.strictEqual(s4a.doc.getElementById('checkoutModal').classList.contains('is-open'), false, 'Old active order must not open before target product arrives');
  s4a.fireCoupons([
    { code: 'FILEDILAM30', type: 'percent', value: 30, max_discount: 5000, is_active: true, is_public: true, scope: 'all' },
    { code: 'MEMBER30', type: 'percent', value: 30, max_discount: 20000, is_active: true, is_public: false, scope: 'all' }
  ]);
  s4a.fireProducts([
    { id: 'PRD-818270', name: 'Quản lý Bán hàng online', price: 39000, type: 'google_sheets' },
    { id: 'PRD-662235', name: 'Quản Lý Kho & Nhập Xuất Tồn', price: 49000, type: 'apps_script' }
  ]);
  assert.strictEqual(s4a.doc.getElementById('checkoutModal').classList.contains('is-open'), true, 'Checkout must open once delayed Firestore delivers PRD-662235');
  assert.strictEqual(s4a.win.state.cart[0].productId, 'PRD-662235', 'PRD-662235 must be prioritized at top of cart');
  assert.strictEqual(s4a.win.state.cart.length, 2, 'Existing cart item must also be preserved');
  assert.strictEqual(s4a.win.state.appliedCoupons[0].code, 'MEMBER30', 'MEMBER30 must be applied instead of FILEDILAM30');
  assert.strictEqual(s4a.doc.getElementById('quickName').value, 'Anh Khoa');
  assert.strictEqual(s4a.doc.getElementById('quickEmail').value, 'khoa@gmail.com');
  assert.strictEqual(s4a.doc.getElementById('quickPhone').value, '0912345678');

  // 4b. Polling interval picks up product even if StorefrontData.products was populated out-of-band
  const s4b = runVmScenario({
    search: '?add=PRD-791771&name=Lan&email=lan%40gmail.com&phone=0988777666&coupon=MEMBER30'
  });
  assert.strictEqual(s4b.doc.getElementById('checkoutModal').classList.contains('is-open'), false);
  s4b.win.StorefrontData.products.push({ id: 'PRD-791771', name: 'Tính Giá Vốn F&B', price: 39000, type: 'apps_script' });
  for (const fn of s4b.intervals.values()) fn();
  await new Promise(r => setTimeout(r, 20));
  assert.strictEqual(s4b.doc.getElementById('checkoutModal').classList.contains('is-open'), true, 'Polling timer must detect newly available product and open checkout');
  assert.strictEqual(s4b.win.state.appliedCoupons[0].code, 'MEMBER30', 'Offline fallback MEMBER30 must apply cleanly');
  assert.strictEqual(s4b.win.getCartTotal(), 27300, '39.000 - 30% = 27.300');

  // 4c. Manual deselect keeps MEMBER30 unselected on subsequent reopen
  s4b.win.handleDeselectAppliedCoupon();
  assert.strictEqual(s4b.win.state.appliedCoupons.length, 0, 'Manual deselect must clear coupon');
  s4b.win.openCheckout();
  assert.strictEqual(s4b.win.state.appliedCoupons.length, 0, 'Deselected coupon must stay deselected in session');

  // 4d. Non-existent product terminates gracefully after Firestore loads
  const s4d = runVmScenario({
    search: '?add=PRD-DOES-NOT-EXIST&coupon=MEMBER30'
  });
  s4d.fireProducts([{ id: 'PRD-662235', name: 'Kho', price: 49000, type: 'apps_script' }]);
  assert.strictEqual(s4d.doc.getElementById('checkoutModal').classList.contains('is-open'), false, 'Unknown product must not open empty checkout');
  assert.strictEqual(s4d.intervals.size, 0, 'Polling interval must clean up once fresh Firestore confirms product does not exist');

  // 4e. Returning visitor with cached product and Firestore-only coupon (TIETKIEM10) queries db synchronously on bindEvents()
  const s4eWin = runVmScenario({
    search: '?add=PRD-801788&name=Hoa&email=hoa%40gmail.com&phone=0905551111&coupon=TIETKIEM10',
    staleCache: [{ id: 'PRD-801788', name: 'Quản Lý Nhà Trọ', price: 79000, type: 'apps_script' }]
  });
  await new Promise(r => setTimeout(r, 20));
  assert.strictEqual(s4eWin.doc.getElementById('checkoutModal').classList.contains('is-open'), true, 'Cached product must open checkout immediately');
  assert.strictEqual(s4eWin.win.state.appliedCoupons[0].code, 'TIETKIEM10', 'Returning visitor with cached product must apply Firestore coupon TIETKIEM10');
  assert.strictEqual(s4eWin.win.getCartTotal(), 69000, '79.000 - 10.000 = 69.000');
  // Also test offline/no-firebase environment does not throw when db is null
  const s4f = (() => {
    const elements = {};
    const makeEl = (id = '') => ({
      id, style: { setProperty() {}, removeProperty() {} },
      classList: { _s: new Set(), add(c){this._s.add(c);}, remove(c){this._s.delete(c);}, contains(c){return this._s.has(c);}, toggle(c,f){if(f===undefined){if(this.contains(c))this.remove(c);else this.add(c);}else if(f)this.add(c);else this.remove(c);} },
      attrs: {}, setAttribute(k,v){this.attrs[k]=String(v);}, getAttribute(k){return this.attrs[k]??null;},
      children: [], appendChild(c){this.children.push(c);return c;}, removeChild(){}, value: '', textContent: '', innerHTML: '',
      addEventListener(){}, removeEventListener(){}, querySelector(){return null;}, querySelectorAll(){return [];}, closest(){return null;}, focus(){}, scrollTo(){},
      getBoundingClientRect(){return {top:0,bottom:0,width:0,height:0};}
    });
    const doc = { title: '', body: makeEl('body'), getElementById(id){ return elements[id] || (elements[id]=makeEl(id)); }, createElement(){return makeEl('');}, querySelector(){return null;}, querySelectorAll(){return [];}, addEventListener(){} };
    const win = {
      innerWidth: 1280, location: { origin: 'https://filedilam.web.app', pathname: '/', search: '?add=PRD-102938&coupon=MEMBER30', hash: '', protocol: 'https:' },
      history: { pushState(){}, replaceState(){} },
      localStorage: { length: 0, key(){return null;}, getItem(){return null;}, setItem(){}, removeItem(){} },
      sessionStorage: { _d:{}, getItem(k){return this._d[k]??null;}, setItem(k,v){this._d[k]=String(v);}, removeItem(k){delete this._d[k];} },
      addEventListener(){}, scrollTo(){}, setTimeout(){return 1;}, clearTimeout(){}, setInterval(){return 1;}, clearInterval(){}, requestAnimationFrame(){return 1;},
      StorefrontData: { store: { bankAccount: { bankShortName: 'TPBank', number: '59215112002', owner: 'HUYNH KIEN CAM', notePrefix: 'FILEDILAM' } }, categories: [{ id: 'all', name: 'Tất cả' }], products: [{ id: 'PRD-102938', name: 'Bán hàng online', price: 39000, type: 'google_sheets' }] }
    };
    vm.runInContext(storefrontCode, vm.createContext({ window: win, document: doc, navigator: { userAgent: 'node' }, location: win.location, history: win.history, localStorage: win.localStorage, sessionStorage: win.sessionStorage, setTimeout: win.setTimeout, clearTimeout: win.clearTimeout, setInterval: win.setInterval, clearInterval: win.clearInterval, requestAnimationFrame: win.requestAnimationFrame, URLSearchParams, Intl, console }));
    return { win, doc };
  })();
  await new Promise(r => setTimeout(r, 20));
  assert.strictEqual(s4f.doc.getElementById('checkoutModal').classList.contains('is-open'), true, 'No-firebase offline environment must still open checkout cleanly');
  assert.strictEqual(s4f.win.state.appliedCoupons[0].code, 'MEMBER30', 'No-firebase offline fallback MEMBER30 must work without db TypeError');

  console.log('PASS: Test 4 - All delayed Firestore, stale cache, active order isolation, polling, deselect, offline null-db, and unknown product edge cases passed!');
}

async function testBrowserCachedAndReloadEdgeCases() {
  console.log('\n--- TEST 5: Real Chrome E2E - Cached Returning User (?coupon=TIETKIEM10) & #thanh-toan Reload ---');
  const url1 = `http://localhost:${PORT}/index.html?add=PRD-801788&name=Hoa&email=hoa%40gmail.com&phone=0905551111&coupon=TIETKIEM10`;
  const session = await openCdpSession(url1);
  try {
    // Wait until products cache is populated in localStorage
    for (let i = 0; i < 60; i++) {
      const ready = await session.evaluate(`
        window.isFirestoreProductsLoaded === true &&
        !!document.getElementById('checkoutModal') &&
        document.getElementById('checkoutModal').classList.contains('is-open') &&
        window.state && window.state.appliedCoupons && window.state.appliedCoupons[0] && window.state.appliedCoupons[0].code === 'TIETKIEM10'
      `);
      if (ready) break;
      await new Promise(r => setTimeout(r, 200));
    }
    // Now navigate again with localStorage cache already warm (returning customer)
    await session.evaluate("localStorage.setItem('fileDiLamCart', '[]');");
    await session.sendCommand('Page.navigate', { url: url1 });
    let resCached = null;
    for (let i = 0; i < 40; i++) {
      resCached = await session.evaluate(`({
        isOpen: !!(document.getElementById('checkoutModal') && document.getElementById('checkoutModal').classList.contains('is-open')),
        code: (window.state && window.state.appliedCoupons && window.state.appliedCoupons[0]) ? window.state.appliedCoupons[0].code : null,
        grandTotal: document.getElementById('checkoutGrandTotal') ? document.getElementById('checkoutGrandTotal').textContent.trim() : ''
      })`);
      if (resCached.isOpen && resCached.code === 'TIETKIEM10') break;
      await new Promise(r => setTimeout(r, 200));
    }
    assert.strictEqual(resCached.isOpen, true, 'Returning user with warm cache must open checkout');
    assert.strictEqual(resCached.code, 'TIETKIEM10', 'Returning user with warm cache must fetch Firestore coupon TIETKIEM10');
    assert(resCached.grandTotal.includes('69.000'), `Expected 69.000 total (79k - 10k), got ${resCached.grandTotal}`);

    // Reload #thanh-toan with cleared product cache and Firestore product in cart
    await session.evaluate(`
      localStorage.removeItem('filedilam_cached_products_v5');
      localStorage.setItem('fileDiLamCart', JSON.stringify([{productId:'PRD-662235',quantity:1}]));
    `);
    await session.sendCommand('Page.navigate', { url: `http://localhost:${PORT}/index.html?name=Minh&email=minh%40gmail.com&phone=0901234567&coupon=MEMBER30#thanh-toan` });
    let resReload = null;
    for (let i = 0; i < 60; i++) {
      resReload = await session.evaluate(`({
        isOpen: !!(document.getElementById('checkoutModal') && document.getElementById('checkoutModal').classList.contains('is-open')),
        cartIds: (window.state && window.state.cart) ? window.state.cart.map(function(c){return c.productId;}) : [],
        code: (window.state && window.state.appliedCoupons && window.state.appliedCoupons[0]) ? window.state.appliedCoupons[0].code : null,
        grandTotal: document.getElementById('checkoutGrandTotal') ? document.getElementById('checkoutGrandTotal').textContent.trim() : ''
      })`);
      if (resReload.isOpen && resReload.code === 'MEMBER30') break;
      await new Promise(r => setTimeout(r, 200));
    }
    assert.strictEqual(resReload.isOpen, true, 'Reloading #thanh-toan without product cache must wait for Firestore and reopen checkout');
    assert.strictEqual(resReload.cartIds[0], 'PRD-662235', 'Cart must NOT be wiped by cleanCart before Firestore loads');
    assert.strictEqual(resReload.code, 'MEMBER30', 'MEMBER30 must still apply after #thanh-toan reload');
    assert(resReload.grandTotal.includes('34.300'), `Expected 34.300 after reload, got ${resReload.grandTotal}`);
    console.log('PASS: Test 5 - Warm-cache Firestore coupon lookup & #thanh-toan reload preservation verified.');
  } finally {
    await session.close();
  }
}

(async () => {
  testEmailTemplateSource();
  const server = await startStaticServer();
  try {
    await testBrowserDirectBuy1Click();
    await testBrowserExploreAllLink();
    await testBrowserCachedAndReloadEdgeCases();
  } finally {
    server.close();
  }
  await testDelayedFirestoreAndEdgeCasesVm();
  console.log('\n====================================================');
  console.log('ALL RETENTION EMAIL & 1-CLICK CHECKOUT TESTS PASSED!');
  console.log('====================================================');
})().catch((err) => {
  console.error('\nTEST FAILURE:', err);
  process.exit(1);
});
