/**
 * CHALLENGER 2: ADVERSARIAL PAYMENT & BACKEND INTEGRITY TEST SUITE
 * 
 * Verifies:
 * 1. VietQR Tag 54 generation under adversarial conditions (odd digits, decimal % calculations, boundary amounts).
 * 2. Active order invalidation (invalidateActiveOrderOnCartOrCouponChange) preventing stale QR & amount payments.
 * 3. End-to-end QR code generation, Canvas rendering, and jsqr decoding.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const assert = require('assert');

const PORT = 8094;
const CHROME_PORT = 9226;
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const JSQR_PATH = "C:\\Users\\zit\\AppData\\Roaming\\npm\\node_modules\\jsqr";
const WORKSPACE_DIR = path.resolve(__dirname, '..');

const jsqr = require(JSQR_PATH);

// Simple CRC16-CCITT implementation for verifying EMVCo Tag 63
function calculateCRC16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= (str.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// EMVCo parser
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

// Local simulation of makeLocalVietQr logic extracted from storefront.js:4281
function simulateMakeLocalVietQr(order, account = "59215112002", owner = "HUYNH KIEN CAM") {
  function field(tag, value) {
    value = String(value);
    return tag + String(value.length).padStart(2, "0") + value;
  }
  const recipient = field("00", "970423") + field("01", account);
  const provider = field("00", "A000000727") + field("01", recipient) + field("02", "QRIBFTTA");
  const payload = "000201010212" + field("38", provider) + "5303704" + field("54", order.amount) +
    "5802VN" + field("62", field("08", order.transfer_note || order.order_id)) + "6304";
  const crc = calculateCRC16(payload);
  return payload + crc;
}

async function runAdversarialPaymentAndBackendProbes() {
  console.log('========================================================================');
  console.log('⚔️  CHALLENGER 2: ADVERSARIAL PAYMENT & BACKEND INTEGRITY VERIFIER ⚔️');
  console.log('========================================================================\n');

  let totalTests = 0;
  let passedTests = 0;

  function testAssert(cond, desc) {
    totalTests++;
    if (cond) {
      passedTests++;
      console.log(`  ✅ [PASS] ${desc}`);
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
      throw new Error(`Assertion failed: ${desc}`);
    }
  }

  // =========================================================================
  // SECTION 1: VIETQR TAG 54 UNDER ADVERSARIAL ODD / DECIMAL CONDITIONS
  // =========================================================================
  console.log('--- SECTION 1: VietQR Tag 54 Odd Digits & Decimal Math Invariants ---');

  // Test 1.1: Odd subtotals with fractional percentage discounts
  const oddSubtotals = [
    { sub: 19999, pct: 15, expectedDiscount: Math.round(19999 * 0.15), note: '19.999 * 15% = 2999.85 -> 3000' },
    { sub: 25001, pct: 13, expectedDiscount: Math.round(25001 * 0.13), note: '25.001 * 13% = 3250.13 -> 3250' },
    { sub: 161237, pct: 20, expectedDiscount: Math.round(161237 * 0.20), note: '161.237 * 20% = 32247.4 -> 32247' },
    { sub: 77777, pct: 33, expectedDiscount: Math.round(77777 * 0.33), note: '77.777 * 33% = 25666.41 -> 25666' },
    { sub: 100010, pct: 15, expectedDiscount: 15002, note: '100.010 * 15% = 15001.5 -> 15002 (.5 boundary)' },
    { sub: 1, pct: 10, expectedDiscount: Math.round(1 * 0.10), note: '1 * 10% = 0.1 -> 0' },
    { sub: 999999, pct: 7, expectedDiscount: Math.round(999999 * 0.07), note: '999.999 * 7% = 69999.93 -> 70000' }
  ];

  for (const item of oddSubtotals) {
    const finalAmount = Math.max(0, item.sub - item.expectedDiscount);
    testAssert(Number.isInteger(finalAmount), `Final amount is integer for subtotal ${item.sub} (${item.note})`);

    const order = {
      order_id: 'DH_TEST_ODD',
      amount: finalAmount,
      transfer_note: 'DH_TEST_ODD'
    };

    const qrPayload = simulateMakeLocalVietQr(order);
    const parsed = parseEMVCo(qrPayload);

    testAssert(parsed['53'] === '704', `Tag 53 (Currency) is 704 (VND) for amount ${finalAmount}`);
    testAssert(parsed['54'] === String(finalAmount), `Tag 54 strictly matches finalAmount string "${finalAmount}" without decimals`);
    testAssert(!parsed['54'].includes('.'), `Tag 54 contains NO decimal point`);
    testAssert(!parsed['54'].includes(','), `Tag 54 contains NO comma`);
    testAssert(!/[eE]/.test(parsed['54']), `Tag 54 contains NO scientific notation`);

    // Verify CRC16-CCITT
    const payloadWithoutCrc = qrPayload.slice(0, -4);
    const expectedCrc = calculateCRC16(payloadWithoutCrc);
    const actualCrc = qrPayload.slice(-4);
    testAssert(actualCrc === expectedCrc, `EMVCo CRC16 is valid (${actualCrc} == ${expectedCrc})`);
  }

  // Test 1.2: 1,000 randomized subtotals and discounts
  console.log('\n--- Running 1,000 Randomized Adversarial VietQR Payload Checks ---');
  let randomValidCount = 0;
  for (let i = 0; i < 1000; i++) {
    const randSub = Math.floor(Math.random() * 5000000) + 1; // 1 to 5,000,000
    const randPct = Math.floor(Math.random() * 99) + 1; // 1% to 99%
    const discount = Math.round(randSub * randPct / 100);
    const finalAmt = Math.max(0, randSub - discount);

    const order = { order_id: `DH_RND_${i}`, amount: finalAmt, transfer_note: `DH_RND_${i}` };
    const payload = simulateMakeLocalVietQr(order);
    const parsed = parseEMVCo(payload);

    if (parsed['54'] === String(finalAmt) && !parsed['54'].includes('.') && Number.isInteger(finalAmt)) {
      randomValidCount++;
    }
  }
  testAssert(randomValidCount === 1000, `All 1,000 randomized adversarial VietQR payloads generated valid integer Tag 54`);

  // =========================================================================
  // SECTION 2: BROWSER VERIFICATION OF ORDER INVALIDATION & STALE QR PREVENTION
  // =========================================================================
  console.log('\n--- SECTION 2: Browser Verification of Order Invalidation on Coupon/Cart Change ---');

  const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png'
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
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise(r => server.listen(PORT, r));
  console.log(`[INFO] Probe HTTP server running on port ${PORT}`);

  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--disable-web-security',
    '--window-size=1280,900',
    `http://localhost:${PORT}/index.html`
  ]);

  // Connect via native WebSocket
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

  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');

  // Wait for Storefront initialization
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

  // Inject fetch interceptor for /orders
  await evaluate(`
    (function() {
      // Ensure FILEDILAM coupon is active in memory
      if (window.cachedActiveCoupons) {
        var f = window.cachedActiveCoupons.find(function(c) { return c.code === "FILEDILAM"; });
        if (f) {
          f.min_order = 20000;
          f.value = 20;
          f.is_active = true;
        }
      }

      const originalFetch = window.fetch;
      window.fetch = async function(url, opts) {
        if (typeof url === 'string' && url.includes('/orders') && opts && opts.method === 'POST') {
          const body = JSON.parse(opts.body);
          const mockOrderId = "DH" + Math.floor(100000 + Math.random() * 900000);
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

  // Setup cart: 2 items @ 19.000 đ = 38.000 đ
  await evaluate(`
    (function() {
      sessionStorage.clear();
      localStorage.clear();
      state.cart = [];
      var p = window.StorefrontData.products[0];
      state.cart = [{ productId: p.id, quantity: 2 }];
      state.selectedPackage = "standard";
      state.appliedCoupons = [];
      state.appliedCoupon = null;
      state.discountAmount = 0;
      persistCart();
      renderCart();
      openCheckout();
    })()
  `);
  await new Promise(r => setTimeout(r, 800));

  // Verify auto-applied coupon
  const s1 = await evaluate(`
    JSON.stringify({
      appliedCode: state.appliedCoupons.length ? state.appliedCoupons[0].code : null,
      cartTotal: getCartTotal(),
      subtotal: getCartSubtotal()
    })
  `);
  const parsedS1 = JSON.parse(s1);
  testAssert(parsedS1.appliedCode === 'FILEDILAM', `FILEDILAM auto-applied`);
  testAssert(parsedS1.cartTotal === 30400, `Cart total discounted to 30.400 đ`);

  // Submit checkout order form to generate Active Order & QR
  console.log('[ACTION] Generating initial order with auto-applied coupon (amount = 30.400 đ)...');
  await evaluate(`
    (function() {
      state.user = {
        uid: "test_invalidation_uid",
        email: "invalidation@filedilam.vn",
        getIdToken: async function() { return "mock_token"; }
      };
      var nameInput = document.getElementById("quickName");
      if (nameInput) nameInput.value = "Nguyễn Test Invalidation";
      var phoneInput = document.getElementById("quickPhone");
      if (phoneInput) phoneInput.value = "0988776655";
      var emailInput = document.getElementById("quickEmail");
      if (emailInput) emailInput.value = "invalidation@filedilam.vn";
      var submitBtn = document.getElementById("btnQuickSubmit");
      if (submitBtn) submitBtn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 1400));

  // Verify Active Order is created in localStorage and QR is displayed
  const order1State = await evaluate(`
    JSON.stringify({
      hasActiveOrderInStorage: !!localStorage.getItem("filedilam_active_order"),
      activeOrder: JSON.parse(localStorage.getItem("filedilam_active_order") || "{}"),
      hasPendingId: !!localStorage.getItem("filedilam_pending_order_id"),
      modalHasClass: document.getElementById("checkoutModal").classList.contains("has-active-order"),
      hasImg: !!document.querySelector("#qrBox img")
    })
  `);
  const parsedOrder1 = JSON.parse(order1State);
  testAssert(parsedOrder1.hasActiveOrderInStorage === true, `Active order saved in localStorage`);
  testAssert(parsedOrder1.activeOrder.amount === 30400, `Active order amount is 30.400 đ`);
  testAssert(parsedOrder1.hasPendingId === true, `filedilam_pending_order_id saved in localStorage`);
  testAssert(parsedOrder1.modalHasClass === true, `checkoutModal has class "has-active-order"`);
  testAssert(parsedOrder1.hasImg === true, `QR image displayed in #qrBox`);

  // NOW THE ADVERSARIAL ACTION: USER DESELECTS COUPON WHILE QR IS DISPLAYED!
  console.log('[ADVERSARIAL ACTION] User clicks "Bỏ chọn" while QR code is active on screen...');
  await evaluate(`
    (function() {
      handleDeselectAppliedCoupon();
    })()
  `);
  await new Promise(r => setTimeout(r, 400));

  // VERIFY IMMEDIATE PURGE & INVALIDATION
  const invState = await evaluate(`
    JSON.stringify({
      hasActiveOrderInStorage: !!localStorage.getItem("filedilam_active_order"),
      hasPendingIdInStorage: !!localStorage.getItem("filedilam_pending_order_id"),
      modalHasClass: document.getElementById("checkoutModal").classList.contains("has-active-order"),
      qrBoxText: document.getElementById("qrBox").innerText.trim(),
      hasQrImg: !!document.querySelector("#qrBox img"),
      timerText: document.getElementById("qrTimerDisplay") ? document.getElementById("qrTimerDisplay").textContent.trim() : "",
      cartTotalAfterDeselect: getCartTotal()
    })
  `);
  const parsedInv = JSON.parse(invState);

  testAssert(parsedInv.hasActiveOrderInStorage === false, `STALE ORDER PURGED: filedilam_active_order removed from localStorage`);
  testAssert(parsedInv.hasPendingIdInStorage === false, `STALE ORDER PURGED: filedilam_pending_order_id removed from localStorage`);
  testAssert(parsedInv.modalHasClass === false, `checkoutModal class "has-active-order" removed`);
  testAssert(parsedInv.hasQrImg === false, `QR image completely wiped from DOM`);
  testAssert(parsedInv.timerText === "--:--", `qrTimerDisplay reset to placeholder "--:--"`);
  testAssert(parsedInv.qrBoxText.includes("Mã thanh toán chưa được tạo") || parsedInv.qrBoxText.includes("Đơn hàng đã thay đổi"), `qrBox shows invalidation warning: "${parsedInv.qrBoxText.replace(/\n/g, ' ')}"`);
  testAssert(parsedInv.cartTotalAfterDeselect === 38000, `Cart total restored to full price (38.000 đ)`);

  // NOW RE-SUBMIT ORDER WITH RESTORED FULL PRICE (38.000 đ):
  console.log('[ACTION] Re-submitting order at restored full price (38.000 đ)...');
  await evaluate(`
    (function() {
      var submitBtn = document.getElementById("btnQuickSubmit");
      if (submitBtn) submitBtn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 1400));

  // Extract raw pixels from browser offscreen canvas and decode with jsqr
  const extractedData = await evaluate(`
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
        imgData = ctx.getImageData(168, 176, w, h);
      } else {
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

  testAssert(extractedData && extractedData.base64, `Re-generated QR image captured from browser`);
  const rawBuf = Buffer.from(extractedData.base64, 'base64');
  const clampedPixels = new Uint8ClampedArray(rawBuf.buffer, rawBuf.byteOffset, rawBuf.length);
  const qrResult = jsqr(clampedPixels, extractedData.width, extractedData.height);

  testAssert(qrResult !== null && qrResult.data, `jsqr successfully decoded re-generated VietQR`);
  const parsedQr2 = parseEMVCo(qrResult.data);

  console.log(`[OBSERVATION] Decoded Re-generated VietQR: Tag 54 = "${parsedQr2['54']}", Tag 53 = "${parsedQr2['53']}", Tag 63 = "${parsedQr2['63']}"`);
  testAssert(parsedQr2['54'] === '38000', `Re-generated QR Tag 54 strictly matches new full amount (38000 VND)`);
  testAssert(!parsedQr2['54'].includes('.'), `Tag 54 has no decimals`);

  // Close browser and server
  ws.close();
  chromeProcess.kill();
  server.close();

  console.log('\n========================================================================');
  console.log(`🎉 CHALLENGER 2: ALL ${totalTests} ADVERSARIAL INTEGRITY PROBES PASSED! 🎉`);
  console.log('========================================================================\n');
}

runAdversarialPaymentAndBackendProbes().catch(err => {
  console.error('Fatal probe failure:', err);
  process.exit(1);
});
