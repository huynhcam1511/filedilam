/**
 * Challenger Re-verification Fuzz & Stress Test Harness
 * Role: Adversarial Verification Recheck Challenger (Iteration 2)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const assert = require('assert');

const PORT = 8095;
const CHROME_PORT = 9227;
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const WORKSPACE_DIR = path.resolve(__dirname, '..');

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0].split('#')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(WORKSPACE_DIR, reqPath.replace(/^\//, ''));

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const data = fs.readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(data);
});

async function main() {
  await new Promise(r => server.listen(PORT, r));
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    `http://localhost:${PORT}/index.html`
  ]);

  let cdpWsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
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
      return { exception: res.result.exceptionDetails };
    }
    if (res.result && res.result.result) {
      return { value: res.result.result.value };
    }
    return { value: res.result ? res.result.value : null };
  }

  try {
    await sendCommand('Page.enable');
    await sendCommand('Runtime.enable');
    await new Promise(r => setTimeout(r, 1200));

    // Seed cart
    await evaluate(`
      (function() {
        var p = window.StorefrontData.products[0];
        p.price = 50000;
        state.cart = [{ productId: p.id, quantity: 2 }];
        openCheckout(true);
      })()
    `);
    await new Promise(r => setTimeout(r, 300));

    console.log('--- Adversarial Fuzzing: Comprehensive Quote & Selector Breakout Vectors ---');
    
    const fuzzVectors = [
      // Standard quotes
      '"FILEDILAM"',
      '\'FILEDILAM\'',
      '“FILEDILAM”',
      '‘FILEDILAM’',
      '"TRIAN20"',
      '\'TRIAN20\'',
      '“TRIAN20”',
      '‘TRIAN20’',
      // Quotes inside
      'FILE"DI"LAM',
      'FOO\'BAR',
      'A“B”C',
      // Multiple / unclosed quotes
      '"""',
      '""',
      '\'\'',
      '"""""',
      '["VOUCHER"]',
      'CODE"]',
      'CODE\'"',
      'CODE"][data-x="',
      'a"] { color: red; } [x="',
      // CSS selector special chars
      'VOUCHER[1]',
      'TAG:hover',
      'DIV > P',
      'A + B ~ C',
      'FOO#BAR.BAZ',
      'FOO\\BAR',
      'FOO\\\\\\BAR',
      '\\0',
      'null',
      'undefined',
      '__proto__',
      'constructor',
      'toString',
      'valueOf',
      // Whitespace and control chars
      '   "  FILEDILAM  "   ',
      '\t\r\n"TRIAN20"\t\r\n',
      'A\x00B',
      // Long input
      'A"'.repeat(200)
    ];

    let passedCount = 0;
    let failedCount = 0;

    for (const vec of fuzzVectors) {
      const res = await evaluate(`applyCheckoutCoupon(${JSON.stringify(vec)})`);
      if (res.exception) {
        console.error(`  [FAIL] Vector ${JSON.stringify(vec)} threw unhandled exception:`, res.exception.text);
        failedCount++;
      } else {
        passedCount++;
      }
    }

    console.log(`Fuzz Results: ${passedCount} passed, ${failedCount} failed out of ${fuzzVectors.length} vectors.`);
    assert.strictEqual(failedCount, 0, `Expected 0 fuzz failures, got ${failedCount}`);

    // Verify that quoted legitimate codes actually get applied successfully
    console.log('\n--- Verifying Quoted Legitimate Codes Apply Successfully ---');
    
    // Clear applied coupons
    await evaluate(`(function() { state.appliedCoupons = []; renderCheckoutSummary(); })()`);

    // Apply "FILEDILAM" with double quotes
    const applyDouble = await evaluate(`applyCheckoutCoupon('"FILEDILAM"')`);
    assert(!applyDouble.exception, 'Double-quoted FILEDILAM should not throw');
    const state1 = await evaluate(`({ count: state.appliedCoupons.length, code: state.appliedCoupons[0] ? state.appliedCoupons[0].code : null, discount: state.discountAmount })`);
    console.log('Quoted "FILEDILAM" application state:', state1.value);
    assert.strictEqual(state1.value.code, 'FILEDILAM', 'Quoted FILEDILAM should normalize and apply');
    assert.strictEqual(state1.value.discount, 20000, 'Discount should be 20.000 đ (20% of 100k)');

    // Deselect
    await evaluate(`handleDeselectAppliedCoupon()`);

    // Apply “TRIAN20” with Vietnamese smart quotes
    const applySmart = await evaluate(`applyCheckoutCoupon('“TRIAN20”')`);
    assert(!applySmart.exception, 'Smart-quoted TRIAN20 should not throw');
    const state2 = await evaluate(`({ count: state.appliedCoupons.length, code: state.appliedCoupons[0] ? state.appliedCoupons[0].code : null, discount: state.discountAmount })`);
    console.log('Smart-quoted “TRIAN20” application state:', state2.value);
    assert.strictEqual(state2.value.code, 'TRIAN20', 'Smart-quoted TRIAN20 should normalize and apply');
    assert.strictEqual(state2.value.discount, 20000, 'Discount should be 20.000 đ (20% of 100k)');

    console.log('\n[PASS] All fuzz vectors and quoted normalization tests succeeded with 100% reliability!');

  } finally {
    ws.close();
    chromeProcess.kill();
    server.close();
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
