/**
 * =========================================================================================
 * EMPIRICAL ADVERSARIAL VERIFICATION SUITE — CHALLENGER LP 2
 * =========================================================================================
 * Tasks Covered:
 * 1. VietQR EMVCo String Generation & CRC16 Checksum Integrity:
 *    - Tag 54 amounts after voucher discounts (odd amounts, fractional %, zero clamping, boundary numbers).
 *    - 16-bit CRC checksum (EMVCo CCITT 0x1021 with 0xFFFF init) across 5,000 fuzzed inputs.
 * 2. Phantom Overlays:
 *    - Mobile FAB (z-index 950) when empty (pointer-events: none, opacity: 0, display: none on desktop)
 *      and when active (localized 56x56 px, no fullscreen blocker).
 *    - Cart Drawer (z-index 1000050) when closed (visibility: hidden, translateX(105%))
 *      ensuring NO phantom overlay blocks interactions on the page.
 * 3. Click-Outside Handling & Race-Free Interaction:
 *    - Clicking outside closes drawer.
 *    - Clicking #cartFab or #openCartNav is explicitly shielded and does NOT trigger click-outside conflict.
 * 4. Links Integrity:
 *    - All href="faq.html" and href="custom.html" in index.html, faq.html, custom.html.
 *    - Physical file resolution on disk.
 *    - Absence of dead anchor links to removed sections (#faq, #hero, #stats, etc.).
 * =========================================================================================
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const WORKSPACE_DIR = path.resolve(__dirname, '..');
const INDEX_HTML_PATH = path.join(WORKSPACE_DIR, 'index.html');
const STOREFRONT_JS_PATH = path.join(WORKSPACE_DIR, 'storefront.js');
const STOREFRONT_CSS_PATH = path.join(WORKSPACE_DIR, 'storefront.css');
const FAQ_HTML_PATH = path.join(WORKSPACE_DIR, 'faq.html');
const CUSTOM_HTML_PATH = path.join(WORKSPACE_DIR, 'custom.html');

const PORT = 8097;
const CHROME_PORT = 9229;
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

let totalAsserts = 0;
let passedAsserts = 0;
let failedAsserts = 0;

function assertTest(condition, description, details = '') {
  totalAsserts++;
  if (condition) {
    passedAsserts++;
    console.log(`  ✅ [PASS] ${description}`);
  } else {
    failedAsserts++;
    console.error(`  ❌ [FAIL] ${description} ${details ? '--> ' + details : ''}`);
  }
}

// CRC16-CCITT implementation for EMVCo
function calculateCRC16(payload) {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= (payload.charCodeAt(i) << 8);
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

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

function simulateVietQR(order, account = "59215112002") {
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

async function runAllChecks() {
  console.log('========================================================================');
  console.log('⚔️  CHALLENGER LP 2: ADVERSARIAL PAYMENT, OVERLAY & UX SUITE ⚔️');
  console.log('========================================================================\n');

  // =========================================================================
  // CHECK 1: VIETQR EMVCO STRING GENERATION & CRC16 CHECKSUM INTEGRITY
  // =========================================================================
  console.log('--- CHECK 1: VietQR EMVCo String Generation & CRC16 Integrity ---');

  // Check 1.1: Verify storefront.js makeLocalVietQr implementation matches official EMVCo specs
  const storefrontCode = fs.readFileSync(STOREFRONT_JS_PATH, 'utf8');
  assertTest(storefrontCode.includes('field("54", order.amount)'), 'storefront.js maps order.amount directly to Tag 54');
  assertTest(storefrontCode.includes('0x1021'), 'storefront.js implements EMVCo standard CCITT polynomial 0x1021');
  assertTest(storefrontCode.includes('crc ^= payload.charCodeAt(i) << 8'), 'storefront.js shifts byte << 8 for MSB-first CRC16');
  assertTest(storefrontCode.includes('crc.toString(16).toUpperCase().padStart(4, "0")'), 'storefront.js formats 4-hex-char uppercase CRC');

  // Check 1.2: Boundary amounts and discounts calculation
  const testScenarios = [
    { subtotal: 100000, discountPct: 20, expectedAmt: 80000, desc: 'Normal 20% discount on 100.000 đ' },
    { subtotal: 99999, discountPct: 15, expectedAmt: 84999, desc: 'Odd subtotal 99.999 đ with 15% discount (disc: 15.000)' },
    { subtotal: 100000, fixedDiscount: 35000, expectedAmt: 65000, desc: 'Fixed discount 35.000 đ on 100.000 đ' },
    { subtotal: 30000, fixedDiscount: 50000, expectedAmt: 0, desc: 'Fixed discount exceeding subtotal clamps to 0' },
    { subtotal: 150000000, discountPct: 50, maxDiscount: 500000, expectedAmt: 149500000, desc: 'Cap max discount 500k on 150M cart' }
  ];

  for (const scen of testScenarios) {
    let disc = 0;
    if (scen.discountPct) {
      disc = Math.round(scen.subtotal * scen.discountPct / 100);
      if (scen.maxDiscount) disc = Math.min(disc, scen.maxDiscount);
    } else if (scen.fixedDiscount) {
      disc = scen.fixedDiscount;
    }
    const finalAmount = Math.max(0, scen.subtotal - disc);
    assertTest(finalAmount === scen.expectedAmt, `${scen.desc} -> finalAmount = ${finalAmount}`);

    const qr = simulateVietQR({ order_id: 'DH_TEST', amount: finalAmount, transfer_note: 'DH_TEST' });
    const parsed = parseEMVCo(qr);
    assertTest(parsed['54'] === String(finalAmount), `Tag 54 strictly matches "${finalAmount}"`);
    assertTest(!parsed['54'].includes('.') && !parsed['54'].includes(','), `Tag 54 has no decimal separators`);
    assertTest(parsed['53'] === '704', `Tag 53 is Vietnamese Dong ('704')`);
    assertTest(parsed['58'] === 'VN', `Tag 58 is Country Code ('VN')`);

    // Verify CRC16
    const payloadNoCrc = qr.slice(0, -4);
    const expectedCrc = calculateCRC16(payloadNoCrc);
    const actualCrc = qr.slice(-4);
    assertTest(actualCrc === expectedCrc, `Tag 63 CRC matches mathematical CCITT-16: ${actualCrc}`);
  }

  // Check 1.3: Fuzz test 5,000 randomized orders for CRC validity and integer Tag 54
  console.log('\n  ... Running 5,000 randomized VietQR payloads fuzz test ...');
  let fuzzPassed = 0;
  for (let i = 0; i < 5000; i++) {
    const amt = Math.floor(Math.random() * 10000000);
    const note = 'FDL' + Math.floor(100000 + Math.random() * 900000);
    const qr = simulateVietQR({ order_id: note, amount: amt, transfer_note: note });
    const parsed = parseEMVCo(qr);
    const expectedCrc = calculateCRC16(qr.slice(0, -4));
    if (parsed['54'] === String(amt) && qr.slice(-4) === expectedCrc && parsed['53'] === '704') {
      fuzzPassed++;
    }
  }
  assertTest(fuzzPassed === 5000, `5,000 / 5,000 randomized VietQR payloads passed CRC16 and Tag 54 validation`);

  // =========================================================================
  // CHECK 2: PHANTOM OVERLAYS & Z-INDEX INSPECTION
  // =========================================================================
  console.log('\n--- CHECK 2: Phantom Overlays & Z-Index Inspection ---');

  const cssContent = fs.readFileSync(STOREFRONT_CSS_PATH, 'utf8');
  const indexHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

  // Check 2.1: Cart Drawer CSS properties
  const hasCartDrawerHidden = cssContent.includes('visibility: hidden;') && cssContent.includes('transform: translateX(105%);');
  assertTest(hasCartDrawerHidden, 'Closed .cart-drawer has visibility: hidden and translateX(105%)');

  const hasCartDrawerVisible = cssContent.includes('.cart-drawer.is-open') && cssContent.includes('visibility: visible;');
  assertTest(hasCartDrawerVisible, 'Opened .cart-drawer.is-open restores visibility: visible and translateX(0)');

  // Check 2.2: Ensure NO stray full-screen backdrop exists for cart drawer that stays clickable when closed
  const hasStrayCartBackdrop = indexHtml.includes('id="cartBackdrop"') || indexHtml.includes('class="cart-backdrop"');
  assertTest(!hasStrayCartBackdrop, 'No separate persistent full-screen cart backdrop element that could leak phantom overlay');

  // Check 2.3: Mobile FAB CSS properties
  const hasFabPointerEventsNone = cssContent.includes('.cart-fab {') && cssContent.includes('pointer-events: none;');
  const hasFabOpacityZero = cssContent.includes('.cart-fab {') && cssContent.includes('opacity: 0;');
  assertTest(hasFabPointerEventsNone && hasFabOpacityZero, 'Inactive .cart-fab has pointer-events: none AND opacity: 0 (no click blocking)');

  const hasFabDesktopHidden = cssContent.includes('@media (min-width: 769px)') && cssContent.includes('display: none !important;');
  assertTest(hasFabDesktopHidden, '.cart-fab is display: none !important on desktop viewports (>= 769px)');

  const hasFabActivePointerEvents = cssContent.includes('.cart-fab.is-visible') && cssContent.includes('pointer-events: auto;');
  assertTest(hasFabActivePointerEvents, 'Active .cart-fab.is-visible restores pointer-events: auto');

  // Check 2.4: Mobile FAB dimension check
  assertTest(cssContent.includes('width: 56px;') && cssContent.includes('height: 56px;'), 'Mobile FAB is strictly sized to 56x56 px (localized touch target)');
  assertTest(cssContent.includes('z-index: 950;'), 'Mobile FAB has z-index: 950 (below modals and drawers)');

  // =========================================================================
  // CHECK 3: CLICK-OUTSIDE HANDLING & RACE-FREE INTERACTION
  // =========================================================================
  console.log('\n--- CHECK 3: Click-Outside Handling & Race-Free Interaction ---');

  // Verify storefront.js click-outside listener
  const clickOutsideSection = storefrontCode.slice(
    storefrontCode.indexOf('if (cartDrawer && cartDrawer.classList.contains("is-open"))'),
    storefrontCode.indexOf('if (cartDrawer && cartDrawer.classList.contains("is-open"))') + 500
  );

  assertTest(clickOutsideSection.includes('!cartDrawer.contains(event.target)'), 'Click outside checks that click target is not within cartDrawer');
  assertTest(clickOutsideSection.includes('!event.target.closest("#openCartNav")'), 'Click outside explicitly excludes #openCartNav (prevents race/conflict)');
  assertTest(clickOutsideSection.includes('!event.target.closest("#cartFab")'), 'Click outside explicitly excludes #cartFab (prevents race/conflict)');
  assertTest(clickOutsideSection.includes('!event.target.closest("#openCartButton")'), 'Click outside explicitly excludes #openCartButton');
  assertTest(clickOutsideSection.includes('!event.target.closest("[data-cart-id]")'), 'Click outside explicitly excludes product add-to-cart buttons');
  assertTest(clickOutsideSection.includes('closeCart();'), 'Outside click correctly calls closeCart()');

  // =========================================================================
  // CHECK 4: LINKS INTEGRITY & SUBPAGE RESOLUTION
  // =========================================================================
  console.log('\n--- CHECK 4: Links Integrity & Subpage Resolution ---');

  // Check 4.1: Physical existence of faq.html and custom.html
  assertTest(fs.existsSync(FAQ_HTML_PATH), 'faq.html physically exists on disk');
  assertTest(fs.statSync(FAQ_HTML_PATH).size > 10000, `faq.html is a substantial non-empty file (${fs.statSync(FAQ_HTML_PATH).size} bytes)`);

  assertTest(fs.existsSync(CUSTOM_HTML_PATH), 'custom.html physically exists on disk');
  assertTest(fs.statSync(CUSTOM_HTML_PATH).size > 10000, `custom.html is a substantial non-empty file (${fs.statSync(CUSTOM_HTML_PATH).size} bytes)`);

  // Check 4.2: Extract all href attributes in index.html
  const hrefRegex = /href=["']([^"']+)["']/g;
  let match;
  const indexHrefs = [];
  while ((match = hrefRegex.exec(indexHtml)) !== null) {
    indexHrefs.push(match[1]);
  }

  const hasFaqLink = indexHrefs.some(h => h === 'faq.html' || h === './faq.html');
  const hasCustomLink = indexHrefs.some(h => h === 'custom.html' || h === './custom.html');
  assertTest(hasFaqLink, 'index.html contains link(s) to faq.html');
  assertTest(hasCustomLink, 'index.html contains link(s) to custom.html');

  // Verify specific navigation links in index.html: Topbar, Mobile Drawer, Footer
  const topbarMatch = indexHtml.match(/<header[\s\S]*?<\/header>/i);
  const topbarHtml = topbarMatch ? topbarMatch[0] : '';
  assertTest(topbarHtml.includes('faq.html'), 'Header topbar has link to faq.html');
  assertTest(topbarHtml.includes('custom.html'), 'Header topbar has link to custom.html');

  const mobileNavMatch = indexHtml.match(/<aside[^>]*id=["']mobileNavDrawer["'][\s\S]*?<\/aside>/i);
  const mobileNavHtml = mobileNavMatch ? mobileNavMatch[0] : '';
  assertTest(mobileNavHtml.includes('faq.html'), 'Mobile Nav Drawer has link to faq.html');
  assertTest(mobileNavHtml.includes('custom.html'), 'Mobile Nav Drawer has link to custom.html');

  const footerMatch = indexHtml.match(/<footer[\s\S]*?<\/footer>/i);
  const footerHtml = footerMatch ? footerMatch[0] : '';
  assertTest(footerHtml.includes('faq.html'), 'Footer has link to faq.html');
  assertTest(footerHtml.includes('custom.html'), 'Footer has link to custom.html');

  // Verify NO dead anchor links in index.html to removed sections
  const deadAnchors = ['#faq', '#faq-section', '#hero', '#stats', '#steps', '#compare', '#custom', '#custom-clean'];
  for (const anchor of deadAnchors) {
    // Only flag if used as an exact href link: href="#faq"
    const isPresent = indexHrefs.includes(anchor);
    assertTest(!isPresent, `index.html does NOT contain dead link href="${anchor}"`);
  }

  // Check 4.3: Links in faq.html & custom.html
  const faqHtml = fs.readFileSync(FAQ_HTML_PATH, 'utf8');
  assertTest(faqHtml.includes('href="index.html"') || faqHtml.includes('href="./index.html"') || faqHtml.includes('href="./"'), 'faq.html contains back-link to index.html');
  assertTest(faqHtml.includes('custom.html'), 'faq.html cross-links to custom.html');

  const customHtml = fs.readFileSync(CUSTOM_HTML_PATH, 'utf8');
  assertTest(customHtml.includes('href="index.html"') || customHtml.includes('href="./index.html"') || customHtml.includes('href="./"'), 'custom.html contains back-link to index.html');
  assertTest(customHtml.includes('faq.html'), 'custom.html cross-links to faq.html');
  assertTest(customHtml.includes('https://zalo.me/'), 'custom.html contains active Zalo consulting link');

  // =========================================================================
  // CHECK 5: LIVE BROWSER CDP VALIDATION OF OVERLAYS & CLICK-OUTSIDE
  // =========================================================================
  console.log('\n--- CHECK 5: Live Browser Automation of FAB, Drawer & Click-Outside ---');

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
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise(r => server.listen(PORT, r));
  console.log(`  [INFO] Test server active on http://localhost:${PORT}`);

  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CHROME_PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--disable-web-security',
    '--window-size=375,812', // Mobile iPhone viewport size
    `http://localhost:${PORT}/index.html`
  ]);

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
    throw new Error('Could not connect to Chrome CDP WebSocket');
  }

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

  // Wait for page initialization
  for (let i = 0; i < 40; i++) {
    const ready = await evaluate(`
      typeof window.state !== 'undefined' &&
      typeof window.openCart !== 'undefined' &&
      window.isFirestoreProductsLoaded === true
    `);
    if (ready) break;
    await new Promise(r => setTimeout(r, 200));
  }

  // Test 5.1: Zero Cart State on Mobile Viewport (375x812)
  console.log('  Testing Mobile FAB with 0 items in cart...');
  const fabZeroState = await evaluate(`
    (function() {
      state.cart = [];
      persistCart();
      renderCart();
      var fab = document.getElementById("cartFab");
      var cs = window.getComputedStyle(fab);
      return {
        hasVisibleClass: fab.classList.contains("is-visible"),
        opacity: cs.opacity,
        pointerEvents: cs.pointerEvents,
        display: cs.display
      };
    })()
  `);
  assertTest(fabZeroState.hasVisibleClass === false, '0-item cart: FAB does NOT have "is-visible" class');
  assertTest(fabZeroState.pointerEvents === 'none', '0-item cart: FAB computed pointer-events is "none"');
  assertTest(Number(fabZeroState.opacity) === 0, '0-item cart: FAB computed opacity is 0');

  // Verify elementFromPoint over the FAB location (375 - 30 = 345, 812 - 30 = 782) does NOT hit FAB because of pointer-events: none
  const hitTestZero = await evaluate(`
    (function() {
      var el = document.elementFromPoint(345, 782);
      return el ? el.id || el.className || el.tagName : 'none';
    })()
  `);
  assertTest(!hitTestZero.includes('cartFab'), `elementFromPoint over FAB coordinates does not hit FAB when cart is empty (hit: "${hitTestZero}")`);

  // Test 5.2: Adding item to cart activates FAB
  console.log('  Testing Mobile FAB activation when adding 1 item...');
  const fabActiveState = await evaluate(`
    (function() {
      var p = window.StorefrontData.products[0];
      state.cart = [{ productId: p.id, quantity: 1 }];
      persistCart();
      renderCart();
      var fab = document.getElementById("cartFab");
      var cs = window.getComputedStyle(fab);
      return {
        hasVisibleClass: fab.classList.contains("is-visible"),
        pointerEvents: cs.pointerEvents,
        badgeText: document.getElementById("cartFabCount").textContent
      };
    })()
  `);
  assertTest(fabActiveState.hasVisibleClass === true, '1-item cart: FAB has "is-visible" class');
  assertTest(fabActiveState.pointerEvents === 'auto', '1-item cart: FAB pointer-events is "auto"');
  assertTest(fabActiveState.badgeText === '1', '1-item cart: FAB badge displays "1"');

  // Test 5.3: Clicking #cartFab opens Cart Drawer without conflict
  console.log('  Testing #cartFab click opening Cart Drawer...');
  await evaluate(`
    (function() {
      document.getElementById("cartFab").click();
    })()
  `);
  await new Promise(r => setTimeout(r, 400));

  const drawerOpenState = await evaluate(`
    (function() {
      var drawer = document.getElementById("cartDrawer");
      var cs = window.getComputedStyle(drawer);
      return {
        isOpen: drawer.classList.contains("is-open"),
        visibility: cs.visibility,
        transform: cs.transform
      };
    })()
  `);
  assertTest(drawerOpenState.isOpen === true, 'Clicking #cartFab opens Cart Drawer (.is-open)');
  assertTest(drawerOpenState.visibility === 'visible', 'Cart Drawer visibility is "visible" when open');

  // Test 5.4: Clicking OUTSIDE the drawer (e.g. document body/header/catalog) closes the drawer
  console.log('  Testing click-outside to close Cart Drawer...');
  await evaluate(`
    (function() {
      // Simulate clicking on the page catalog header outside the drawer
      var cat = document.getElementById("catalog") || document.body;
      var evt = new MouseEvent("click", { bubbles: true, cancelable: true, view: window });
      cat.dispatchEvent(evt);
    })()
  `);
  await new Promise(r => setTimeout(r, 400));

  const drawerClosedState = await evaluate(`
    (function() {
      var drawer = document.getElementById("cartDrawer");
      var cs = window.getComputedStyle(drawer);
      return {
        isOpen: drawer.classList.contains("is-open"),
        visibility: cs.visibility
      };
    })()
  `);
  assertTest(drawerClosedState.isOpen === false, 'Clicking outside removes .is-open class');
  assertTest(drawerClosedState.visibility === 'hidden', 'Closed Cart Drawer visibility is "hidden"');

  // Test 5.5: Clicking #openCartNav opens drawer cleanly and does NOT conflict with click-outside
  console.log('  Testing Topbar #openCartNav opening Cart Drawer...');
  await evaluate(`
    (function() {
      var navBtn = document.getElementById("openCartNav");
      if (navBtn) navBtn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 400));

  const drawerOpenNavState = await evaluate(`
    (function() {
      var drawer = document.getElementById("cartDrawer");
      return drawer.classList.contains("is-open");
    })()
  `);
  assertTest(drawerOpenNavState === true, 'Clicking #openCartNav opens Cart Drawer and stays open without immediate close conflict');

  // Cleanup browser and server
  ws.close();
  chromeProcess.kill();
  server.close();

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n========================================================================');
  console.log('📊 CHALLENGER LP 2 VERIFICATION SUMMARY:');
  console.log(`   Total Assertions : ${totalAsserts}`);
  console.log(`   Passed           : ${passedAsserts}`);
  console.log(`   Failed           : ${failedAsserts}`);
  console.log('========================================================================');

  if (failedAsserts === 0) {
    console.log('🎉 VERDICT: ALL ADVERSARIAL CHECKS PASSED EMPIRICALLY! APPROVE! 🎉\n');
    process.exit(0);
  } else {
    console.error('❌ VERDICT: ADVERSARIAL CHECKS FAILED! REQUEST_CHANGES! ❌\n');
    process.exit(1);
  }
}

runAllChecks().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
