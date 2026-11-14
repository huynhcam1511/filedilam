/**
 * Empirical Vulnerability Reproduction: Unescaped rawCode in document.querySelector
 * Location: storefront.js:5522
 * Vulnerability: User-supplied coupon input contains quotes or invalid CSS selector characters
 * Result: Uncaught DOMException SyntaxError outside try-catch, breaking checkout flow
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const assert = require('assert');

const PORT = 8094;
const CHROME_PORT = 9226;
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

    console.log('Testing inputs containing characters that break CSS selector:');
    
    // Case A: User enters coupon with quotes: "FILEDILAM"
    const testA = await evaluate(`applyCheckoutCoupon('"FILEDILAM"')`);
    console.log('Case A [quoted input \'"FILEDILAM"\'] result:', testA.exception ? 'THREW UNCAUGHT EXCEPTION: ' + testA.exception.text : 'HANDLED SAFELY');

    // Case B: User enters coupon with backslash or brackets: VOUCHER[1]
    const testB = await evaluate(`applyCheckoutCoupon('VOUCHER[1]')`);
    console.log('Case B [brackets \'VOUCHER[1]\'] result:', testB.exception ? 'THREW UNCAUGHT EXCEPTION: ' + testB.exception.text : 'HANDLED SAFELY');

    // Case C: User enters coupon with CSS injection: CODE"]
    const testC = await evaluate(`applyCheckoutCoupon('CODE"]')`);
    console.log('Case C [selector breakout \'CODE"]\'] result:', testC.exception ? 'THREW UNCAUGHT EXCEPTION: ' + testC.exception.text : 'HANDLED SAFELY');

  } finally {
    ws.close();
    chromeProcess.kill();
    server.close();
  }
}

main().catch(console.error);
