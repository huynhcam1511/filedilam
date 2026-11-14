const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8089;
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const WORKSPACE_DIR = path.resolve(__dirname, '..');

// 1. Static file server
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

async function main() {
  await new Promise(r => server.listen(PORT, r));
  console.log(`HTTP Server listening on port ${PORT}`);

  // 2. Launch Chrome Headless
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-web-security',
    '--window-size=1280,900',
    `http://localhost:${PORT}/index.html`
  ]);

  let cdpWsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 300));
    try {
      const resp = await fetch('http://127.0.0.1:9222/json');
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

  console.log('Connected to Chrome via CDP:', cdpWsUrl);
  const ws = new WebSocket(cdpWsUrl);
  let id = 1;
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
      const msgId = id++;
      pendingRequests.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
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

    console.log('\n--- Waiting for page initialization ---');
    await new Promise(r => setTimeout(r, 1200));

    // Seed mock cart: 2 items of 99.000 đ = 198.000 đ (exceeds min_order 160.000 đ of FILEDILAM)
    await evaluate(`
      (function() {
        sessionStorage.clear();
        localStorage.clear();
        // Add items to state.cart
        var p = (window.StorefrontData && window.StorefrontData.products) ? window.StorefrontData.products[0] : null;
        var pId = p ? p.id : "prod_1";
        state.cart = [{ productId: pId, quantity: 2 }];
        state.selectedPackage = "standard";
        state.appliedCoupons = [];
        state.appliedCoupon = null;
        state.discountAmount = 0;
        persistCart();
        renderCart();
      })()
    `);

    // Verify cart subtotal
    const subtotal = await evaluate(`getCartSubtotal()`);
    console.log(`Cart subtotal initialized: ${subtotal} đ`);

    console.log('\n--- TEST SUITE 1: F1 (Auto-Apply Best Deal) & F2 (Zero-Click Total Update) & F3 (Applied Bar) ---');
    await evaluate(`openCheckout(true);`);
    await new Promise(r => setTimeout(r, 300));

    const test1 = await evaluate(`
      (function() {
        var appliedBar = document.getElementById("checkoutAppliedCouponBar");
        var appliedCode = document.getElementById("appliedCouponCodeDisplay");
        var discountRow = document.getElementById("checkoutDiscountRow");
        var discountVal = document.getElementById("checkoutDiscountVal");
        var grandTotal = document.getElementById("checkoutGrandTotal");
        var toggleWrap = document.getElementById("checkoutPromoToggleWrap");
        var collapseContent = document.getElementById("checkoutPromoCollapseContent");

        return {
          appliedCouponsLength: state.appliedCoupons.length,
          appliedCodeState: state.appliedCoupons[0] ? state.appliedCoupons[0].code : null,
          appliedBarVisible: appliedBar ? window.getComputedStyle(appliedBar).display !== "none" : false,
          appliedCodeDisplay: appliedCode ? appliedCode.textContent.trim() : "",
          discountRowVisible: discountRow ? window.getComputedStyle(discountRow).display !== "none" : false,
          discountValText: discountVal ? discountVal.textContent.trim() : "",
          grandTotalText: grandTotal ? grandTotal.textContent.trim() : "",
          toggleWrapHidden: toggleWrap ? window.getComputedStyle(toggleWrap).display === "none" : false,
          collapseContentHidden: collapseContent ? window.getComputedStyle(collapseContent).display === "none" : false,
          cartTotalNum: getCartTotal()
        };
      })()
    `);

    console.log('Test 1 Results:', JSON.stringify(test1, null, 2));

    if (test1.appliedCouponsLength === 1 && test1.appliedCodeState === 'FILEDILAM') {
      console.log('✓ PASS F1: Best coupon (FILEDILAM) auto-applied on checkout entry');
    } else {
      throw new Error(`FAIL F1: Expected FILEDILAM auto-applied, got ${test1.appliedCodeState}`);
    }

    if (test1.discountRowVisible && test1.cartTotalNum < subtotal) {
      console.log(`✓ PASS F2: Zero-click instant discount row updated (${test1.discountValText}), grand total is ${test1.grandTotalText}`);
    } else {
      throw new Error(`FAIL F2: Discount row not updated properly`);
    }

    if (test1.appliedBarVisible && test1.appliedCodeDisplay === 'FILEDILAM') {
      console.log('✓ PASS F3: Applied coupon status bar displayed with "ĐÃ ÁP DỤNG" and code FILEDILAM');
    } else {
      throw new Error(`FAIL F3: Applied coupon bar not displayed correctly`);
    }

    console.log('\n--- TEST SUITE 2: F3 & F4 (Deselect Button & Session Memory) ---');
    await evaluate(`
      (function() {
        var deselectBtn = document.getElementById("btnDeselectAppliedCoupon");
        deselectBtn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 200));

    const test2 = await evaluate(`
      (function() {
        var appliedBar = document.getElementById("checkoutAppliedCouponBar");
        var discountRow = document.getElementById("checkoutDiscountRow");
        var grandTotal = document.getElementById("checkoutGrandTotal");
        var sessionFlag = sessionStorage.getItem("filedilam_user_deselected_coupon");
        var toggleWrap = document.getElementById("checkoutPromoToggleWrap");

        return {
          appliedCouponsLength: state.appliedCoupons.length,
          sessionFlag: sessionFlag,
          appliedBarHidden: appliedBar ? window.getComputedStyle(appliedBar).display === "none" : false,
          discountRowHidden: discountRow ? window.getComputedStyle(discountRow).display === "none" : false,
          grandTotalText: grandTotal ? grandTotal.textContent.trim() : "",
          toggleWrapVisible: toggleWrap ? window.getComputedStyle(toggleWrap).display !== "none" : false,
          cartTotalNum: getCartTotal()
        };
      })()
    `);

    console.log('Test 2 Results (After Deselect):', JSON.stringify(test2, null, 2));

    if (test2.sessionFlag === 'true' && test2.appliedCouponsLength === 0) {
      console.log('✓ PASS F4: Session flag filedilam_user_deselected_coupon set to "true"');
    } else {
      throw new Error(`FAIL F4: Session flag not set properly: ${test2.sessionFlag}`);
    }

    if (test2.appliedBarHidden && test2.discountRowHidden && test2.cartTotalNum === subtotal) {
      console.log(`✓ PASS F4: Totals restored to subtotal (${test2.grandTotalText}), discount row hidden`);
    } else {
      throw new Error(`FAIL F4: Totals or rows not restored after deselect`);
    }

    // Verify session persistence: re-run openCheckout in the same session
    await evaluate(`openCheckout(true);`);
    await new Promise(r => setTimeout(r, 200));
    const test2Reopen = await evaluate(`
      (function() {
        return {
          appliedCouponsLength: state.appliedCoupons.length,
          sessionFlag: sessionStorage.getItem("filedilam_user_deselected_coupon")
        };
      })()
    `);

    if (test2Reopen.appliedCouponsLength === 0 && test2Reopen.sessionFlag === 'true') {
      console.log('✓ PASS F4: Subsequent checkout in same session DOES NOT auto-apply (respected user choice)');
    } else {
      throw new Error(`FAIL F4: Auto-apply improperly re-applied after user deselected!`);
    }

    console.log('\n--- TEST SUITE 3: F5 (Collapsible UI: "Bạn có mã ưu đãi?") ---');
    const test3 = await evaluate(`
      (function() {
        var toggleWrap = document.getElementById("checkoutPromoToggleWrap");
        var toggleText = document.getElementById("promoToggleText");
        var collapseContent = document.getElementById("checkoutPromoCollapseContent");
        return {
          toggleWrapVisible: toggleWrap ? window.getComputedStyle(toggleWrap).display !== "none" : false,
          toggleText: toggleText ? toggleText.textContent.trim() : "",
          collapseContentHidden: collapseContent ? window.getComputedStyle(collapseContent).display === "none" : false
        };
      })()
    `);

    console.log('Test 3 Results (State C Collapsed):', JSON.stringify(test3, null, 2));

    if (test3.toggleWrapVisible && test3.toggleText.includes("Bạn có mã ưu đãi?") && test3.collapseContentHidden) {
      console.log('✓ PASS F5: Sleek text link "Bạn có mã ưu đãi?" shown, bulky list collapsed');
    } else {
      throw new Error(`FAIL F5: Collapsible UI not in expected State C`);
    }

    console.log('\n--- TEST SUITE 4: F6 (Private Voucher Form & Application e.g. TRIAN20) ---');
    // Click "Bạn có mã ưu đãi?" to expand
    await evaluate(`
      (function() {
        var toggleBtn = document.getElementById("btnTogglePromoForm");
        toggleBtn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 200));

    const test4Expand = await evaluate(`
      (function() {
        var collapseContent = document.getElementById("checkoutPromoCollapseContent");
        var privateInput = document.getElementById("privateCouponInput");
        var applyBtn = document.getElementById("btnApplyPrivateCoupon");
        return {
          collapseVisible: collapseContent ? window.getComputedStyle(collapseContent).display !== "none" : false,
          inputExists: !!privateInput,
          applyBtnExists: !!applyBtn
        };
      })()
    `);

    console.log('Test 4 Expand Results:', JSON.stringify(test4Expand, null, 2));
    if (test4Expand.collapseVisible && test4Expand.inputExists && test4Expand.applyBtnExists) {
      console.log('✓ PASS F6: Promo collapse form expanded smoothly, input & apply button visible');
    } else {
      throw new Error('FAIL F6: Promo collapse form did not expand properly');
    }

    // Type private coupon 'TRIAN20' and click "Áp dụng"
    await evaluate(`
      (function() {
        var privateInput = document.getElementById("privateCouponInput");
        privateInput.value = "TRIAN20";
        var applyBtn = document.getElementById("btnApplyPrivateCoupon");
        applyBtn.click();
      })()
    `);
    await new Promise(r => setTimeout(r, 400));

    const test4Apply = await evaluate(`
      (function() {
        var appliedBar = document.getElementById("checkoutAppliedCouponBar");
        var appliedCode = document.getElementById("appliedCouponCodeDisplay");
        var discountRow = document.getElementById("checkoutDiscountRow");
        var discountVal = document.getElementById("checkoutDiscountVal");
        var grandTotal = document.getElementById("checkoutGrandTotal");
        var sessionFlag = sessionStorage.getItem("filedilam_user_deselected_coupon");
        var collapseContent = document.getElementById("checkoutPromoCollapseContent");

        return {
          appliedCouponsLength: state.appliedCoupons.length,
          appliedCode: state.appliedCoupons[0] ? state.appliedCoupons[0].code : null,
          appliedBarVisible: appliedBar ? window.getComputedStyle(appliedBar).display !== "none" : false,
          appliedCodeText: appliedCode ? appliedCode.textContent.trim() : "",
          discountRowVisible: discountRow ? window.getComputedStyle(discountRow).display !== "none" : false,
          discountValText: discountVal ? discountVal.textContent.trim() : "",
          grandTotalText: grandTotal ? grandTotal.textContent.trim() : "",
          sessionFlagCleared: sessionFlag === null,
          collapseContentHidden: collapseContent ? window.getComputedStyle(collapseContent).display === "none" : false,
          cartTotalNum: getCartTotal()
        };
      })()
    `);

    console.log('Test 4 Apply Results:', JSON.stringify(test4Apply, null, 2));

    if (test4Apply.appliedCode === 'TRIAN20' && test4Apply.appliedBarVisible && test4Apply.appliedCodeText === 'TRIAN20') {
      console.log('✓ PASS F6: Private voucher TRIAN20 applied successfully, bar shows TRIAN20');
    } else {
      throw new Error(`FAIL F6: Private voucher TRIAN20 not applied properly: ${test4Apply.appliedCode}`);
    }

    if (test4Apply.sessionFlagCleared) {
      console.log('✓ PASS F4/F6: filedilam_user_deselected_coupon cleared when user explicitly applies a voucher');
    } else {
      throw new Error('FAIL F4/F6: session flag was not cleared after applying voucher');
    }

    if (test4Apply.discountRowVisible && test4Apply.cartTotalNum === Math.round(subtotal * 0.8)) {
      console.log(`✓ PASS F6: 20% discount applied accurately (-${test4Apply.discountValText}), total = ${test4Apply.grandTotalText}`);
    } else {
      throw new Error(`FAIL F6: Discount amount incorrect: expected 20%, got total ${test4Apply.cartTotalNum}`);
    }

    console.log('\n======================================================');
    console.log('🎉 ALL MILESTONE M1 VERIFICATION TESTS PASSED 100%! 🎉');
    console.log('======================================================\n');
  } finally {
    ws.close();
    chromeProcess.kill();
    server.close();
  }
}

main().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
