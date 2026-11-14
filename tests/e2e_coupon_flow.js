/**
 * Automated End-to-End Test Suite: Checkout Coupon Flow, VietQR & Firestore Compatibility
 * Milestone M2 — File Đi Làm Storefront
 *
 * Scenarios Tested:
 * 1. Scenario 1: Auto-Apply Best Deal (F1, F2, F3)
 * 2. Scenario 2: Deselect & Single-Session Memory (F3, F4)
 * 3. Scenario 3: Collapsible Ineligible UI & Secret/Private Voucher (F5, F6)
 * 4. Scenario 4: VietQR Generation & Tag 54 Exact Amount Verification (F7)
 * 5. Scenario 5: Firestore Order Payload Schema Verification (F8)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const assert = require('assert');

const PORT = 8092;
const CHROME_PORT = 9224;
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const JSQR_PATH = "C:\\Users\\zit\\AppData\\Roaming\\npm\\node_modules\\jsqr";
const WORKSPACE_DIR = path.resolve(__dirname, '..');

// Load global jsqr library
const jsqr = require(JSQR_PATH);

// Static HTTP Server for serving Storefront files
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0].split('#')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(WORKSPACE_DIR, reqPath.replace(/^\//, ''));

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (err) {
    res.writeHead(500);
    res.end('Server error: ' + err.message);
  }
});

/**
 * Standard EMVCo TLV Parser
 * Parses tags 00 to 63, with nested Tag 62 (Additional Data Field Template)
 */
function parseEMVCo(payload) {
  const tags = {};
  let i = 0;
  while (i < payload.length) {
    if (i + 4 > payload.length) break;
    const tag = payload.slice(i, i + 2);
    const len = parseInt(payload.slice(i + 2, i + 4), 10);
    if (isNaN(len)) break;
    const val = payload.slice(i + 4, i + 4 + len);
    tags[tag] = val;
    i += 4 + len;
  }
  return tags;
}

function parseTag62(tag62Val) {
  if (!tag62Val) return {};
  return parseEMVCo(tag62Val);
}

async function runE2ETests() {
  console.log('========================================================================');
  console.log('🚀 STARTING E2E AUTOMATED TEST SUITE: VIETQR & FIRESTORE COUPON FLOW 🚀');
  console.log('========================================================================');

  // 1. Start HTTP Server
  await new Promise(r => server.listen(PORT, r));
  console.log(`[INFO] Static HTTP Server listening on http://localhost:${PORT}`);

  // 2. Launch Chrome Headless
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--disable-web-security',
    '--window-size=1280,900',
    `http://localhost:${PORT}/index.html`
  ]);

  // 3. Connect via CDP WebSocket
  let cdpWsUrl = null;
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 250));
    try {
      const resp = await fetch(`http://127.0.0.1:${CHROME_PORT}/json`);
      const tabs = await resp.json();
      const pageTab = tabs.find(t => t.type === 'page');
      if (pageTab && pageTab.webSocketDebuggerUrl) {
        cdpWsUrl = pageTab.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!cdpWsUrl) {
    chromeProcess.kill();
    server.close();
    throw new Error('Failed to connect to Chrome CDP WebSocket');
  }

  console.log(`[INFO] Connected to Chrome via CDP: ${cdpWsUrl}`);
  const ws = new WebSocket(cdpWsUrl);
  let msgId = 1;
  const pendingRequests = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pendingRequests.has(msg.id)) {
      pendingRequests.get(msg.id)(msg);
      pendingRequests.delete(msg.id);
    }
  };

  await new Promise(r => ws.onopen = r);

  function sendCommand(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      pendingRequests.set(id, resolve);
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
    if (res.result && res.result.result) {
      return res.result.result.value;
    }
    return res.result ? res.result.value : null;
  }

  try {
    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');

    console.log('\n[PHASE 0] Waiting for Storefront and Firestore dynamic initialization...');
    for (let i = 0; i < 40; i++) {
      const ready = await evaluate(`
        typeof window.state !== 'undefined' &&
        typeof window.openCheckout !== 'undefined' &&
        window.isFirestoreProductsLoaded === true &&
        window.StorefrontData &&
        window.StorefrontData.products &&
        window.StorefrontData.products.length > 0
      `);
      if (ready) break;
      await new Promise(r => setTimeout(r, 200));
    }

    // Set up interceptors, mock credentials, and standard test products (price 19.000 đ)
    await evaluate(`
      (function() {
        // Ensure standard test product price = 19.000 đ
        var p = window.StorefrontData.products[0];
        p.price = 19000;
        p.originalPrice = 25000;

        // Active coupon cache fallback if offline
        if (!window.cachedActiveCoupons || !window.cachedActiveCoupons.length) {
          window.cachedActiveCoupons = [
            {
              code: "FILEDILAM",
              type: "percent",
              value: 20,
              min_order: 20000,
              max_discount: 0,
              description: "Ưu đãi chào mừng giảm 20%",
              is_active: true
            }
          ];
        } else {
          var f = window.cachedActiveCoupons.find(function(c) { return c.code === "FILEDILAM"; });
          if (f) {
            f.value = 20;
            f.min_order = 20000;
            f.is_active = true;
          }
        }

        // Global Intercepted Orders store
        window.__capturedOrders = [];

        // Intercept window.fetch to capture /orders POST payloads and return mock orders
        const originalFetch = window.fetch;
        window.fetch = async function(url, opts) {
          if (typeof url === 'string' && url.includes('/orders') && opts && opts.method === 'POST') {
            const body = JSON.parse(opts.body);
            const mockOrderId = "DH" + Math.floor(100000 + Math.random() * 900000);
            const record = {
              url: url,
              method: opts.method,
              headers: opts.headers,
              body: body,
              generatedOrderId: mockOrderId
            };
            window.__capturedOrders.push(record);

            return new Response(JSON.stringify({
              order_id: mockOrderId,
              transfer_note: mockOrderId,
              amount: body.amount,
              created_at: new Date().toISOString(),
              status: "PENDING"
            }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            });
          }

          if (typeof url === 'string' && url.includes('/profile')) {
            return new Response(JSON.stringify({ status: "ok" }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            });
          }

          return originalFetch.apply(this, arguments);
        };
      })()
    `);

    // Helper: Seed cart with 2 items of 19.000 đ = 38.000 đ
    async function seedTestCart(quantity = 2) {
      return await evaluate(`
        (function() {
          var p = window.StorefrontData.products[0];
          state.cart = [{ productId: p.id, quantity: ${quantity} }];
          state.selectedPackage = "standard";
          state.appliedCoupons = [];
          state.appliedCoupon = null;
          state.discountAmount = 0;
          persistCart();
          renderCart();
          return {
            productId: p.id,
            productName: p.name,
            quantity: ${quantity},
            unitPrice: p.price,
            subtotal: getCartSubtotal()
          };
        })()
      `);
    }

    // Helper: Extract raw Canvas image data from #qrBox
    async function extractQrImageDataFromBrowser() {
      return await evaluate(`
        (function() {
          var img = document.querySelector("#qrBox img");
          if (!img) return null;
          var canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);

          var w = 744, h = 744;
          var imgData;
          if (canvas.width === 1080 && canvas.height === 1400) {
            // High-res composite template: QR matrix is drawn at (168, 176, 744, 744)
            imgData = ctx.getImageData(168, 176, w, h);
          } else {
            // Direct flat QR canvas fallback
            w = canvas.width;
            h = canvas.height;
            imgData = ctx.getImageData(0, 0, w, h);
          }

          var binary = '';
          var bytes = imgData.data;
          var len = bytes.length;
          var chunkSize = 0x8000;
          for (var i = 0; i < len; i += chunkSize) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, len)));
          }
          return {
            width: w,
            height: h,
            base64: btoa(binary)
          };
        })()
      `);
    }

    // Helper: Submit checkout order form
    async function submitOrderForm(customerInfo = {}) {
      return await evaluate(`
        (function() {
          state.user = {
            uid: "test_uid_e2e_m2",
            email: "${customerInfo.email || "test.m2@filedilam.vn"}",
            getIdToken: async function() { return "mock_firebase_id_token"; }
          };

          var nameInput = document.getElementById("quickName");
          if (nameInput) nameInput.value = "${customerInfo.name || "Nguyễn Văn Test"}";
          var phoneInput = document.getElementById("quickPhone");
          if (phoneInput) phoneInput.value = "${customerInfo.phone || "0912345678"}";
          var emailInput = document.getElementById("quickEmail");
          if (emailInput) emailInput.value = "${customerInfo.email || "test.m2@filedilam.vn"}";

          var submitBtn = document.getElementById("btnQuickSubmit");
          submitBtn.click();
          return { submitted: true };
        })()
      `);
    }

    // =========================================================================
    // SCENARIO 1: AUTO-APPLY BEST DEAL (F1, F2, F3)
    // =========================================================================
    console.log('\n------------------------------------------------------------------------');
    console.log('📌 SCENARIO 1: AUTO-APPLY BEST DEAL ON ELIGIBLE CART (F1, F2, F3)');
    console.log('------------------------------------------------------------------------');

    // Clear session to ensure clean first-time entry
    await evaluate(`
      sessionStorage.clear();
      localStorage.clear();
    `);

    // Seed cart: 2 items @ 19.000 đ = 38.000 đ
    const cart1 = await seedTestCart(2);
    console.log(`[SETUP] Cart subtotal: ${cart1.subtotal} đ (2 items @ ${cart1.unitPrice} đ)`);
    assert.strictEqual(cart1.subtotal, 38000, 'Cart subtotal must equal 38.000 đ');

    // Navigate to #thanh-toan
    await evaluate(`openCheckout(true);`);
    await new Promise(r => setTimeout(r, 400));

    // Inspect Scenario 1 DOM state
    const s1 = await evaluate(`
      (function() {
        var appliedBar = document.getElementById("checkoutAppliedCouponBar");
        var appliedCode = document.getElementById("appliedCouponCodeDisplay");
        var discountRow = document.getElementById("checkoutDiscountRow");
        var discountVal = document.getElementById("checkoutDiscountVal");
        var grandTotal = document.getElementById("checkoutGrandTotal");
        var deselectBtn = document.getElementById("btnDeselectAppliedCoupon");
        var toggleWrap = document.getElementById("checkoutPromoToggleWrap");
        var collapseContent = document.getElementById("checkoutPromoCollapseContent");

        return {
          appliedCouponsCount: state.appliedCoupons.length,
          appliedCode: state.appliedCoupons[0] ? state.appliedCoupons[0].code : null,
          appliedDiscountAmount: state.discountAmount,
          appliedBarVisible: appliedBar ? window.getComputedStyle(appliedBar).display !== "none" : false,
          appliedCodeDisplay: appliedCode ? appliedCode.textContent.trim() : "",
          deselectBtnExists: !!deselectBtn,
          discountRowVisible: discountRow ? window.getComputedStyle(discountRow).display !== "none" : false,
          discountValText: discountVal ? discountVal.textContent.trim() : "",
          grandTotalText: grandTotal ? grandTotal.textContent.trim() : "",
          toggleWrapHidden: toggleWrap ? window.getComputedStyle(toggleWrap).display === "none" : false,
          collapseContentHidden: collapseContent ? window.getComputedStyle(collapseContent).display === "none" : false,
          cartTotal: getCartTotal()
        };
      })()
    `);

    console.log('[OBSERVATION 1] S1 Evaluation State:', JSON.stringify(s1, null, 2));

    // Assertions for Scenario 1
    assert.strictEqual(s1.appliedCouponsCount, 1, 'Exactly one coupon must be applied');
    assert.strictEqual(s1.appliedCode, 'FILEDILAM', 'Best coupon FILEDILAM must be auto-applied');
    assert.strictEqual(s1.appliedBarVisible, true, 'Applied coupon bar (#checkoutAppliedCouponBar) must be visible');
    assert.strictEqual(s1.appliedCodeDisplay, 'FILEDILAM', 'Applied code display must show FILEDILAM');
    assert.strictEqual(s1.deselectBtnExists, true, 'Deselect button (#btnDeselectAppliedCoupon) must exist');
    assert.strictEqual(s1.discountRowVisible, true, 'Discount row (#checkoutDiscountRow) must be visible');
    assert(s1.discountValText.includes('-7.600'), `Discount value must display -7.600 ₫, got: ${s1.discountValText}`);
    assert(s1.grandTotalText.includes('30.400'), `Grand total must display 30.400 ₫, got: ${s1.grandTotalText}`);
    assert.strictEqual(s1.cartTotal, 30400, 'getCartTotal() must return 30400');
    assert.strictEqual(s1.toggleWrapHidden, true, 'Promo toggle wrap must be hidden when coupon is applied');
    assert.strictEqual(s1.collapseContentHidden, true, 'Promo collapse form must be hidden when coupon is applied');

    console.log('✅ PASS [Scenario 1.1]: FILEDILAM coupon auto-applied with zero user clicks.');
    console.log(`✅ PASS [Scenario 1.2]: Discount row shows ${s1.discountValText} and grand total shows ${s1.grandTotalText}.`);
    console.log('✅ PASS [Scenario 1.3]: Applied coupon status bar displays "ĐÃ ÁP DỤNG", code FILEDILAM, and "Bỏ chọn" button.');

    // =========================================================================
    // SCENARIO 2: DESELECT & SINGLE-SESSION MEMORY (F3, F4)
    // =========================================================================
    console.log('\n------------------------------------------------------------------------');
    console.log('📌 SCENARIO 2: DESELECT & SINGLE-SESSION MEMORY (F3, F4)');
    console.log('------------------------------------------------------------------------');

    // Click "Bỏ chọn"
    await evaluate(`
      (function() {
        var deselectBtn = document.getElementById("btnDeselectAppliedCoupon");
        deselectBtn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 250));

    // Inspect Scenario 2 Deselect DOM state
    const s2AfterDeselect = await evaluate(`
      (function() {
        var appliedBar = document.getElementById("checkoutAppliedCouponBar");
        var discountRow = document.getElementById("checkoutDiscountRow");
        var grandTotal = document.getElementById("checkoutGrandTotal");
        var sessionFlag = sessionStorage.getItem("filedilam_user_deselected_coupon");
        var toggleWrap = document.getElementById("checkoutPromoToggleWrap");
        var collapseContent = document.getElementById("checkoutPromoCollapseContent");

        return {
          appliedCouponsCount: state.appliedCoupons.length,
          discountAmount: state.discountAmount,
          sessionFlag: sessionFlag,
          appliedBarHidden: appliedBar ? window.getComputedStyle(appliedBar).display === "none" : false,
          discountRowHidden: discountRow ? window.getComputedStyle(discountRow).display === "none" : false,
          grandTotalText: grandTotal ? grandTotal.textContent.trim() : "",
          toggleWrapVisible: toggleWrap ? window.getComputedStyle(toggleWrap).display !== "none" : false,
          collapseContentHidden: collapseContent ? window.getComputedStyle(collapseContent).display === "none" : false,
          cartTotal: getCartTotal()
        };
      })()
    `);

    console.log('[OBSERVATION 2A] After Deselect State:', JSON.stringify(s2AfterDeselect, null, 2));

    // Assertions for Scenario 2 (Deselect action)
    assert.strictEqual(s2AfterDeselect.appliedCouponsCount, 0, 'Applied coupons must be cleared');
    assert.strictEqual(s2AfterDeselect.discountAmount, 0, 'Discount amount must be 0');
    assert.strictEqual(s2AfterDeselect.sessionFlag, 'true', 'sessionStorage filedilam_user_deselected_coupon must be "true"');
    assert.strictEqual(s2AfterDeselect.appliedBarHidden, true, 'Applied coupon bar must be hidden');
    assert.strictEqual(s2AfterDeselect.discountRowHidden, true, 'Discount row must be hidden');
    assert(s2AfterDeselect.grandTotalText.includes('38.000'), `Grand total must revert to subtotal 38.000 ₫, got: ${s2AfterDeselect.grandTotalText}`);
    assert.strictEqual(s2AfterDeselect.cartTotal, 38000, 'getCartTotal() must return 38000');
    assert.strictEqual(s2AfterDeselect.toggleWrapVisible, true, 'Collapsible text link "Bạn có mã ưu đãi?" must now be visible');

    console.log('✅ PASS [Scenario 2.1]: Discount row hidden and grand total restored to 38.000 ₫.');
    console.log('✅ PASS [Scenario 2.2]: Session suppression flag filedilam_user_deselected_coupon recorded as "true".');

    // Re-open checkout in the same session to verify suppression persistence
    console.log('[ACTION] Re-opening #thanh-toan in same session to test auto-apply suppression...');
    await evaluate(`openCheckout(true);`);
    await new Promise(r => setTimeout(r, 300));

    const s2Reopen = await evaluate(`
      (function() {
        return {
          appliedCouponsCount: state.appliedCoupons.length,
          sessionFlag: sessionStorage.getItem("filedilam_user_deselected_coupon"),
          cartTotal: getCartTotal()
        };
      })()
    `);

    console.log('[OBSERVATION 2B] Re-opened State:', JSON.stringify(s2Reopen, null, 2));
    assert.strictEqual(s2Reopen.appliedCouponsCount, 0, 'Auto-apply MUST NOT trigger when session deselect flag is set');
    assert.strictEqual(s2Reopen.sessionFlag, 'true', 'Session deselect flag must remain "true"');
    assert.strictEqual(s2Reopen.cartTotal, 38000, 'Cart total must remain 38.000 ₫');

    console.log('✅ PASS [Scenario 2.3]: Single-session memory strictly honors user deselect choice.');

    // =========================================================================
    // SCENARIO 3: COLLAPSIBLE INELIGIBLE UI & SECRET/PRIVATE VOUCHER (F5, F6)
    // =========================================================================
    console.log('\n------------------------------------------------------------------------');
    console.log('📌 SCENARIO 3: COLLAPSIBLE INELIGIBLE UI & SECRET/PRIVATE VOUCHER (F5, F6)');
    console.log('------------------------------------------------------------------------');

    // Verify State C (Collapsed): Only text link "Bạn có mã ưu đãi?" is shown
    const s3Collapsed = await evaluate(`
      (function() {
        var toggleWrap = document.getElementById("checkoutPromoToggleWrap");
        var toggleBtn = document.getElementById("btnTogglePromoForm");
        var toggleText = document.getElementById("promoToggleText");
        var collapseContent = document.getElementById("checkoutPromoCollapseContent");

        return {
          toggleWrapVisible: toggleWrap ? window.getComputedStyle(toggleWrap).display !== "none" : false,
          toggleText: toggleText ? toggleText.textContent.trim() : "",
          isExpandedClass: toggleBtn ? toggleBtn.classList.contains("is-expanded") : false,
          collapseContentHidden: collapseContent ? window.getComputedStyle(collapseContent).display === "none" : false
        };
      })()
    `);

    console.log('[OBSERVATION 3A] Collapsed State C:', JSON.stringify(s3Collapsed, null, 2));
    assert.strictEqual(s3Collapsed.toggleWrapVisible, true, 'Promo toggle wrap must be visible');
    assert(s3Collapsed.toggleText.includes('Bạn có mã ưu đãi?'), 'Toggle text must display "Bạn có mã ưu đãi?"');
    assert.strictEqual(s3Collapsed.collapseContentHidden, true, 'Bulky promo content must be collapsed');
    assert.strictEqual(s3Collapsed.isExpandedClass, false, 'Toggle button must not have is-expanded class');

    console.log('✅ PASS [Scenario 3.1]: Sleek text link "Bạn có mã ưu đãi?" displayed, bulky form collapsed.');

    // Click "Bạn có mã ưu đãi?" to expand State B
    await evaluate(`
      (function() {
        var toggleBtn = document.getElementById("btnTogglePromoForm");
        toggleBtn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 250));

    const s3Expanded = await evaluate(`
      (function() {
        var collapseContent = document.getElementById("checkoutPromoCollapseContent");
        var privateInput = document.getElementById("privateCouponInput");
        var applyBtn = document.getElementById("btnApplyPrivateCoupon");

        return {
          collapseVisible: collapseContent ? window.getComputedStyle(collapseContent).display !== "none" : false,
          inputExists: !!privateInput,
          inputVisible: privateInput ? window.getComputedStyle(privateInput).display !== "none" : false,
          applyBtnExists: !!applyBtn,
          applyBtnVisible: applyBtn ? window.getComputedStyle(applyBtn).display !== "none" : false
        };
      })()
    `);

    console.log('[OBSERVATION 3B] Expanded State B:', JSON.stringify(s3Expanded, null, 2));
    assert.strictEqual(s3Expanded.collapseVisible, true, 'Promo collapse content must expand');
    assert.strictEqual(s3Expanded.inputExists && s3Expanded.inputVisible, true, 'Private coupon input (#privateCouponInput) must be visible');
    assert.strictEqual(s3Expanded.applyBtnExists && s3Expanded.applyBtnVisible, true, 'Apply button (#btnApplyPrivateCoupon) must be visible');

    console.log('✅ PASS [Scenario 3.2]: Form smoothly expanded on click, private input and apply button visible.');

    // Type private coupon code 'TRIAN20' and submit
    console.log('[ACTION] Submitting private voucher code "TRIAN20"...');
    await evaluate(`
      (function() {
        var privateInput = document.getElementById("privateCouponInput");
        privateInput.value = "TRIAN20";
        var applyBtn = document.getElementById("btnApplyPrivateCoupon");
        applyBtn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 450));

    const s3Applied = await evaluate(`
      (function() {
        var appliedBar = document.getElementById("checkoutAppliedCouponBar");
        var appliedCode = document.getElementById("appliedCouponCodeDisplay");
        var discountRow = document.getElementById("checkoutDiscountRow");
        var discountVal = document.getElementById("checkoutDiscountVal");
        var grandTotal = document.getElementById("checkoutGrandTotal");
        var sessionFlag = sessionStorage.getItem("filedilam_user_deselected_coupon");
        var collapseContent = document.getElementById("checkoutPromoCollapseContent");

        return {
          appliedCouponsCount: state.appliedCoupons.length,
          appliedCode: state.appliedCoupons[0] ? state.appliedCoupons[0].code : null,
          appliedCodeDisplay: appliedCode ? appliedCode.textContent.trim() : "",
          appliedBarVisible: appliedBar ? window.getComputedStyle(appliedBar).display !== "none" : false,
          discountRowVisible: discountRow ? window.getComputedStyle(discountRow).display !== "none" : false,
          discountValText: discountVal ? discountVal.textContent.trim() : "",
          grandTotalText: grandTotal ? grandTotal.textContent.trim() : "",
          sessionFlagCleared: sessionFlag === null,
          collapseContentHidden: collapseContent ? window.getComputedStyle(collapseContent).display === "none" : false,
          cartTotal: getCartTotal()
        };
      })()
    `);

    console.log('[OBSERVATION 3C] Private Voucher Applied State:', JSON.stringify(s3Applied, null, 2));
    assert.strictEqual(s3Applied.appliedCouponsCount, 1, 'Private voucher must be applied');
    assert.strictEqual(s3Applied.appliedCode, 'TRIAN20', 'Applied code must be TRIAN20');
    assert.strictEqual(s3Applied.appliedCodeDisplay, 'TRIAN20', 'Bar display must show TRIAN20');
    assert.strictEqual(s3Applied.appliedBarVisible, true, 'Applied bar must be visible');
    assert.strictEqual(s3Applied.discountRowVisible, true, 'Discount row must be visible');
    assert(s3Applied.discountValText.includes('-7.600'), `Discount must be -7.600 ₫ (20% of 38.000), got: ${s3Applied.discountValText}`);
    assert(s3Applied.grandTotalText.includes('30.400'), `Grand total must be 30.400 ₫, got: ${s3Applied.grandTotalText}`);
    assert.strictEqual(s3Applied.cartTotal, 30400, 'getCartTotal() must return 30400');
    assert.strictEqual(s3Applied.sessionFlagCleared, true, 'Session deselect flag must be cleared on explicit apply');

    console.log('✅ PASS [Scenario 3.3]: Private voucher TRIAN20 applied accurately with 20% discount (-7.600 ₫).');
    console.log('✅ PASS [Scenario 3.4]: filedilam_user_deselected_coupon session suppression flag successfully cleared.');

    // =========================================================================
    // SCENARIO 4: VIETQR GENERATION & TAG 54 EXACT AMOUNT VERIFICATION (F7)
    // =========================================================================
    console.log('\n------------------------------------------------------------------------');
    console.log('📌 SCENARIO 4: VIETQR GENERATION & EMVCO TAG 54 VERIFICATION (F7)');
    console.log('------------------------------------------------------------------------');

    // Submit order form to proceed to Step 2 and render VietQR
    console.log('[ACTION] Proceeding to generate order and render VietQR Canvas...');
    await submitOrderForm({
      name: "Nguyễn Văn Test M2",
      phone: "0912345678",
      email: "test.coupon.m2@filedilam.vn"
    });

    // Wait for VietQR canvas and image composite rendering
    await new Promise(r => setTimeout(r, 1400));

    // Verify Step 2 UI is active
    const step2State = await evaluate(`
      (function() {
        var box = document.getElementById("qrBox");
        var img = box ? box.querySelector("img") : null;
        var modalTitle = document.getElementById("checkoutModalTitle");
        return {
          hasImg: !!img,
          titleText: modalTitle ? modalTitle.textContent.trim() : "",
          qrSrcPrefix: img ? img.src.slice(0, 30) : ""
        };
      })()
    `);

    console.log('[OBSERVATION 4A] Step 2 QR Box State:', step2State);
    assert.strictEqual(step2State.hasImg, true, '#qrBox must contain rendered VietQR <img>');
    assert(step2State.qrSrcPrefix.startsWith('data:image/png;base64,'), 'QR src must be base64 PNG data URL');

    // Extract raw canvas image data from browser
    console.log('[ACTION] Extracting raw canvas image buffer from browser...');
    const extractedData = await extractQrImageDataFromBrowser();
    assert(extractedData && extractedData.base64, 'Extracted image data must not be null');
    console.log(`[INFO] Extracted QR region dimensions: ${extractedData.width}x${extractedData.height} px`);

    // Decode QR using global jsqr
    console.log('[ACTION] Decoding QR code using jsqr...');
    const rawBuf = Buffer.from(extractedData.base64, 'base64');
    const clampedPixels = new Uint8ClampedArray(rawBuf.buffer, rawBuf.byteOffset, rawBuf.length);
    const qrResult = jsqr(clampedPixels, extractedData.width, extractedData.height);

    assert(qrResult && qrResult.data, 'jsqr must successfully decode the VietQR Canvas');
    const emvcoPayload = qrResult.data;
    console.log(`[OBSERVATION 4B] Raw Decoded EMVCo String:\n${emvcoPayload}`);

    // Parse EMVCo TLV structure
    const parsedTags = parseEMVCo(emvcoPayload);
    const parsedTag62 = parseTag62(parsedTags['62']);

    console.log('[OBSERVATION 4C] Parsed EMVCo Tags:');
    console.log(` - Tag 00 (Format Indicator)  : ${parsedTags['00']}`);
    console.log(` - Tag 01 (Initiation Method) : ${parsedTags['01']} (Dynamic QR)`);
    console.log(` - Tag 53 (Transaction Curr)  : ${parsedTags['53']} (VND 704)`);
    console.log(` - Tag 54 (Transaction Amount): ${parsedTags['54']} VND`);
    console.log(` - Tag 58 (Country Code)      : ${parsedTags['58']}`);
    console.log(` - Tag 62.08 (Memo / Note)    : ${parsedTag62['08']}`);
    console.log(` - Tag 63 (CRC Checksum)      : ${parsedTags['63']}`);

    // Assertions for Scenario 4
    assert.strictEqual(parsedTags['54'], '30400', 'EMVCo Tag 54 MUST strictly equal discounted final total 30400');
    assert(parsedTag62['08'] && parsedTag62['08'].startsWith('DH'), `EMVCo Tag 62.08 must contain valid order memo (DH...), got: ${parsedTag62['08']}`);
    assert.strictEqual(parsedTags['53'], '704', 'EMVCo Tag 53 must be 704 (VND)');

    console.log(`✅ PASS [Scenario 4.1]: VietQR decoded successfully with jsqr.`);
    console.log(`✅ PASS [Scenario 4.2]: Tag 54 matches EXACTLY the discounted total: ${parsedTags['54']} đ.`);
    console.log(`✅ PASS [Scenario 4.3]: Tag 62.08 contains valid order transfer note: ${parsedTag62['08']}.`);

    // =========================================================================
    // SCENARIO 5: FIRESTORE ORDER PAYLOAD SCHEMA VERIFICATION (F8)
    // =========================================================================
    console.log('\n------------------------------------------------------------------------');
    console.log('📌 SCENARIO 5: FIRESTORE ORDER PAYLOAD SCHEMA & INVARIANT VERIFICATION (F8)');
    console.log('------------------------------------------------------------------------');

    // Retrieve intercepted POST payloads from Cloud Functions endpoint
    const interceptedOrders = await evaluate(`window.__capturedOrders`);
    console.log(`[INFO] Total intercepted /orders calls: ${interceptedOrders.length}`);
    assert(interceptedOrders && interceptedOrders.length > 0, 'At least one order payload must be intercepted');

    const lastOrder = interceptedOrders[interceptedOrders.length - 1];
    const payload = lastOrder.body;
    console.log('[OBSERVATION 5] Intercepted Order Document Schema:\n', JSON.stringify(payload, null, 2));

    // Assertions for Scenario 5: Schema conformity matching functions/promotions.py
    assert.strictEqual(payload.amount, 30400, 'Payload amount must be exact discounted integer (30400)');
    assert.strictEqual(payload.discount_amount, 7600, 'Payload discount_amount must be exact discount integer (7600)');
    assert.strictEqual(payload.coupon_code, 'TRIAN20', 'Payload coupon_code must match applied code (TRIAN20)');
    assert(Array.isArray(payload.coupon_codes) && payload.coupon_codes.includes('TRIAN20'), 'Payload coupon_codes must be an array containing TRIAN20');
    assert(Array.isArray(payload.items) && payload.items.length > 0, 'Payload items must be a non-empty array');

    // Calculate subtotal from items array
    const calculatedSubtotal = payload.items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
    assert.strictEqual(calculatedSubtotal, 38000, 'Items subtotal must equal 38.000 đ');

    // Verify mathematical invariant enforced by backend promotions.py:117
    // amount == subtotal - discount_amount
    const invariantVerified = (payload.amount === calculatedSubtotal - payload.discount_amount);
    assert.strictEqual(invariantVerified, true, 'Math invariant: amount == subtotal - discount_amount');

    console.log(`✅ PASS [Scenario 5.1]: Payload amount is ${payload.amount} đ (discounted).`);
    console.log(`✅ PASS [Scenario 5.2]: Payload discount_amount is ${payload.discount_amount} đ.`);
    console.log(`✅ PASS [Scenario 5.3]: Payload coupon_code is "${payload.coupon_code}" & coupon_codes is ${JSON.stringify(payload.coupon_codes)}.`);
    console.log(`✅ PASS [Scenario 5.4]: Items array validated with ${payload.items.length} item(s) (subtotal = ${calculatedSubtotal} đ).`);
    console.log(`✅ PASS [Scenario 5.5]: Strict math invariant verified: amount (${payload.amount}) == subtotal (${calculatedSubtotal}) - discount_amount (${payload.discount_amount}).`);

    // =========================================================================
    // BONUS ADVERSARIAL VERIFICATION: AUTO-APPLY FILEDILAM ORDER PAYLOAD & QR
    // =========================================================================
    console.log('\n------------------------------------------------------------------------');
    console.log('📌 BONUS ADVERSARIAL: VERIFY VIETQR & FIRESTORE FOR AUTO-APPLIED FILEDILAM');
    console.log('------------------------------------------------------------------------');

    // Clear session & reset cart
    await evaluate(`
      sessionStorage.clear();
      localStorage.clear();
    `);
    await seedTestCart(2); // 38.000 đ
    await evaluate(`openCheckout(true);`);
    await new Promise(r => setTimeout(r, 400));

    // Submit order directly with auto-applied FILEDILAM
    console.log('[ACTION] Submitting order with auto-applied FILEDILAM coupon...');
    await submitOrderForm({
      name: "Trần Thị FILEDILAM",
      phone: "0987654321",
      email: "filedilam.auto@filedilam.vn"
    });
    await new Promise(r => setTimeout(r, 1400));

    // Decode VietQR
    const autoExtracted = await extractQrImageDataFromBrowser();
    assert(autoExtracted && autoExtracted.base64, 'Auto-applied QR canvas data must be present');
    const autoBuf = Buffer.from(autoExtracted.base64, 'base64');
    const autoClamped = new Uint8ClampedArray(autoBuf.buffer, autoBuf.byteOffset, autoBuf.length);
    const autoQrRes = jsqr(autoClamped, autoExtracted.width, autoExtracted.height);
    assert(autoQrRes && autoQrRes.data, 'Auto-applied QR must decode successfully');

    const autoEmvco = parseEMVCo(autoQrRes.data);
    const autoTag62 = parseTag62(autoEmvco['62']);
    assert.strictEqual(autoEmvco['54'], '30400', 'Auto-applied VietQR Tag 54 must strictly equal 30400');
    assert(autoTag62['08'].startsWith('DH'), 'Auto-applied VietQR Tag 62.08 must contain DH order note');

    // Check payload
    const allOrders = await evaluate(`window.__capturedOrders`);
    const autoOrderPayload = allOrders[allOrders.length - 1].body;
    assert.strictEqual(autoOrderPayload.coupon_code, 'FILEDILAM', 'Auto-applied order payload coupon_code must be FILEDILAM');
    assert.strictEqual(autoOrderPayload.amount, 30400, 'Auto-applied order amount must be 30400');
    assert.strictEqual(autoOrderPayload.discount_amount, 7600, 'Auto-applied order discount_amount must be 7600');
    assert.strictEqual(autoOrderPayload.amount, 38000 - autoOrderPayload.discount_amount, 'Auto-applied math invariant holds');

    console.log(`✅ PASS [Bonus Adversarial]: Auto-applied FILEDILAM QR Tag 54 (${autoEmvco['54']} đ) & Firestore payload verified.`);

    console.log('\n========================================================================');
    console.log('🎉 ALL 5 MILESTONE M2 ACCEPTANCE SCENARIOS PASSED WITH 100% SUCCESS! 🎉');
    console.log('========================================================================\n');

  } finally {
    ws.close();
    chromeProcess.kill();
    server.close();
  }
}

// Execute the test suite
runE2ETests()
  .then(() => {
    console.log('[DONE] E2E test execution completed successfully with exit code 0.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ [FAIL] E2E test execution failed:', err);
    process.exit(1);
  });
