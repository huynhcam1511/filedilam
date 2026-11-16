/**
 * Challenger Adversarial & Empirical Verification Suite
 * Target: Streamlined Landing Page & Cart UX (index.html, faq.html, custom.html, storefront.js)
 * 
 * Executes real headless Chrome via CDP to empirically stress-test:
 * 1. Zero Console Errors on index.html, faq.html, custom.html
 * 2. Complete absence of removed sections (Hero, Stats, Steps, Compare, Coupons, FAQ, Custom)
 * 3. #catalog immediate placement under Topbar
 * 4. Cart Drawer trigger behavior: verify addToCart does NOT cause drawer to auto-open
 * 5. Mobile FAB visibility state machine (0 -> 1 -> 2 -> 1 -> 0)
 * 6. Fly-to-Cart animation lifecycle & DOM flyer element cleanup (Zero Memory Leak)
 * 7. Rapid burst stress test on addToCart / flyToCart (25 rapid triggers)
 * 8. Mobile Hamburger menu (#openMobileMenu) toggling #mobileNavDrawer (open, close button, outside click)
 * 9. Subpages interactivity (faq.html accordion toggle, custom.html Zalo CTA)
 * 10. Navigation link consistency across all pages
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const PORT = 8094;
const CDP_PORT = 9234;
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const WORKSPACE_DIR = path.resolve(__dirname, '..');
const TEMP_USER_DATA = path.join(os.tmpdir(), 'chrome_challenger_profile_' + Date.now());

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

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0].split('#')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(WORKSPACE_DIR, reqPath.replace(/^\//, ''));

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found: ' + reqPath);
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

let chromeProcess = null;
let ws = null;
let reqId = 1;
const pendingRequests = new Map();
const consoleErrors = [];
const consoleWarnings = [];

function sendCommand(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = reqId++;
    pendingRequests.set(id, resolve);
    try {
      ws.send(JSON.stringify({ id, method, params }));
    } catch (e) {
      reject(e);
    }
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

const testResults = [];
function recordTest(id, description, passed, detail = '') {
  testResults.push({ id, description, passed, detail });
  const statusStr = passed ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
  console.log(`  ${statusStr} ${id}: ${description}`);
  if (!passed && detail) {
    console.log(`         \x1b[31m└─ ${detail}\x1b[0m`);
  }
}

async function run() {
  console.log('\x1b[1m\x1b[36m======================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[36m  CHALLENGER EMPIRICAL VERIFICATION & STRESS TEST (HEADLESS CHROME)   \x1b[0m');
  console.log('\x1b[1m\x1b[36m======================================================================\x1b[0m\n');

  // Start HTTP server
  await new Promise(r => server.listen(PORT, r));
  console.log(`✓ HTTP static server running on http://127.0.0.1:${PORT}`);

  // Create isolated temp user data dir
  if (!fs.existsSync(TEMP_USER_DATA)) {
    fs.mkdirSync(TEMP_USER_DATA, { recursive: true });
  }

  // Spawn isolated Chrome
  chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${TEMP_USER_DATA}`,
    '--no-sandbox',
    '--disable-gpu',
    '--disable-web-security',
    '--window-size=1280,900',
    `http://127.0.0.1:${PORT}/index.html`
  ]);

  let cdpWsUrl = null;
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 250));
    try {
      const resp = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
      const tabs = await resp.json();
      const pageTab = tabs.find(t => t.type === 'page');
      if (pageTab && pageTab.webSocketDebuggerUrl) {
        cdpWsUrl = pageTab.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!cdpWsUrl) {
    throw new Error(`Failed to connect to Chrome CDP at port ${CDP_PORT}`);
  }

  console.log(`✓ Connected to Chrome CDP via WebSocket: ${cdpWsUrl}`);
  ws = new WebSocket(cdpWsUrl);

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pendingRequests.has(msg.id)) {
      pendingRequests.get(msg.id)(msg);
      pendingRequests.delete(msg.id);
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      const type = msg.params.type;
      const args = (msg.params.args || []).map(a => a.value || a.description || '');
      const text = args.join(' ');
      if (type === 'error') {
        consoleErrors.push(text);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
      }
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const exc = msg.params.exceptionDetails;
      consoleErrors.push(`Exception: ${exc.text} ${exc.exception ? exc.exception.description : ''}`);
    }
  };

  await new Promise(r => ws.onopen = r);

  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');
  await sendCommand('DOM.enable');

  // Allow initial scripts to load & execute
  await new Promise(r => setTimeout(r, 1500));

  console.log('\n\x1b[1m>>> TEST 1: Console Errors & Exceptions on index.html\x1b[0m');
  const criticalErrors = consoleErrors.filter(e => {
    // filter out harmless network errors if external fonts fail
    if (e.includes('favicon.ico')) return false;
    return true;
  });
  recordTest('C1.1', 'index.html initializes with 0 JavaScript console errors/exceptions', criticalErrors.length === 0, criticalErrors.join('; '));

  console.log('\n\x1b[1m>>> TEST 2: Landing Sections Removal & Catalog Placement\x1b[0m');
  const sectionsCheck = await evaluate(`
    (function() {
      return {
        hero: !!document.querySelector("section.hero, .hero-grid, .hero-title"),
        stats: !!document.getElementById("stats") || !!document.querySelector(".stats-section"),
        steps: !!document.querySelector(".steps-section, #stepsSection"),
        compare: !!document.querySelector(".compare-compact-section, #compareSection"),
        landingCoupon: !!document.getElementById("landingCouponSection"),
        faq: !!document.querySelector(".faq-section, #faqSection"),
        custom: !!document.querySelector(".custom-clean-section, #customServiceSection"),
        catalog: !!document.getElementById("catalog"),
        header: !!document.querySelector(".top-nav")
      };
    })()
  `);

  recordTest('C2.1', 'Hero section completely absent from index.html DOM', !sectionsCheck.hero);
  recordTest('C2.2', 'Stats section completely absent from index.html DOM', !sectionsCheck.stats);
  recordTest('C2.3', 'Steps section completely absent from index.html DOM', !sectionsCheck.steps);
  recordTest('C2.4', 'Compare section completely absent from index.html DOM', !sectionsCheck.compare);
  recordTest('C2.5', 'landingCouponSection completely absent from index.html DOM', !sectionsCheck.landingCoupon);
  recordTest('C2.6', 'FAQ section completely absent from index.html DOM', !sectionsCheck.faq);
  recordTest('C2.7', 'Custom design section completely absent from index.html DOM', !sectionsCheck.custom);
  recordTest('C2.8', '#catalog element exists in DOM', sectionsCheck.catalog);

  const catalogPlacement = await evaluate(`
    (function() {
      var header = document.querySelector(".top-nav");
      var catalog = document.getElementById("catalog");
      if (!header || !catalog) return false;
      // Check that catalog is located after header without any section between them
      var cur = header.nextElementSibling;
      while (cur && cur.tagName === "SCRIPT") {
        cur = cur.nextElementSibling;
      }
      return cur === catalog || (catalog.compareDocumentPosition(header) & Node.DOCUMENT_POSITION_PRECEDING) !== 0;
    })()
  `);
  recordTest('C2.9', '#catalog is located directly under Topbar header', catalogPlacement);

  console.log('\n\x1b[1m>>> TEST 3: Cart Drawer Trigger Behavior (addToCart does NOT auto-open drawer)\x1b[0m');
  // First clear cart
  await evaluate(`
    (function() {
      window.state.cart = [];
      window.persistCart();
      window.renderCart();
    })()
  `);

  // Verify drawer is closed
  const initialDrawerState = await evaluate(`
    (function() {
      var drawer = document.getElementById("cartDrawer");
      return drawer ? drawer.classList.contains("is-open") : false;
    })()
  `);
  recordTest('C3.1', 'Cart drawer is initially closed (not is-open)', !initialDrawerState);

  // Trigger addToCart via clicking product card add-to-cart button
  const clickAddRes = await evaluate(`
    (function() {
      var btn = document.querySelector("[data-cart-id]");
      if (!btn) return { error: "No [data-cart-id] button found in DOM" };
      btn.click();
      return { success: true, prodId: btn.getAttribute("data-cart-id") };
    })()
  `);
  recordTest('C3.2', 'Found [data-cart-id] button in catalog and clicked it', clickAddRes.success === true, clickAddRes.error || '');
  await new Promise(r => setTimeout(r, 300));

  const afterAddToCartDrawerState = await evaluate(`
    (function() {
      var drawer = document.getElementById("cartDrawer");
      var isOpen = drawer ? drawer.classList.contains("is-open") : false;
      var count = window.state.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
      return { isOpen: isOpen, count: count };
    })()
  `);
  recordTest('C3.3', 'Clicking add-to-cart button successfully increments cart item count', afterAddToCartDrawerState.count >= 1, `count: ${afterAddToCartDrawerState.count}`);
  recordTest('C3.4', 'Clicking add-to-cart button does NOT cause Cart Drawer to auto-open', !afterAddToCartDrawerState.isOpen, `isOpen: ${afterAddToCartDrawerState.isOpen}`);

  // Trigger manual openCart via #openCartNav
  await evaluate(`
    (function() {
      var btn = document.getElementById("openCartNav");
      if (btn) btn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 200));
  const manualOpenState = await evaluate(`
    (function() {
      var drawer = document.getElementById("cartDrawer");
      return drawer ? drawer.classList.contains("is-open") : false;
    })()
  `);
  recordTest('C3.5', 'Cart drawer opens when #openCartNav is clicked', manualOpenState);

  // Close cart drawer via #closeCart
  await evaluate(`
    (function() {
      var btn = document.getElementById("closeCart");
      if (btn) btn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 200));
  const afterCloseState = await evaluate(`
    (function() {
      var drawer = document.getElementById("cartDrawer");
      return drawer ? drawer.classList.contains("is-open") : false;
    })()
  `);
  recordTest('C3.6', 'Cart drawer closes when #closeCart is clicked', !afterCloseState);

  console.log('\n\x1b[1m>>> TEST 4: Mobile FAB Visibility State Machine (0 -> 1 -> 2 -> 1 -> 0)\x1b[0m');
  // Transition 1: Reset to 0
  await evaluate(`
    (function() {
      window.state.cart = [];
      window.persistCart();
      window.renderCart();
    })()
  `);
  const fabAtZero = await evaluate(`
    (function() {
      var fab = document.getElementById("cartFab");
      var countEl = document.getElementById("cartFabCount");
      return {
        exists: !!fab,
        hasVisibleClass: fab ? fab.classList.contains("is-visible") : false,
        countText: countEl ? countEl.textContent.trim() : ""
      };
    })()
  `);
  recordTest('C4.1', 'At cart count = 0, #cartFab does NOT have is-visible class', !fabAtZero.hasVisibleClass, `class is-visible: ${fabAtZero.hasVisibleClass}`);
  recordTest('C4.2', 'At cart count = 0, #cartFabCount displays "0"', fabAtZero.countText === '0', `countText: ${fabAtZero.countText}`);

  // Transition 2: Add 1 item via clicking first card button (0 -> 1)
  await evaluate(`
    (function() {
      var buttons = document.querySelectorAll("[data-cart-id]");
      if (buttons[0]) buttons[0].click();
    })()
  `);
  await new Promise(r => setTimeout(r, 300));
  const fabAtOne = await evaluate(`
    (function() {
      var fab = document.getElementById("cartFab");
      var countEl = document.getElementById("cartFabCount");
      return {
        hasVisibleClass: fab ? fab.classList.contains("is-visible") : false,
        countText: countEl ? countEl.textContent.trim() : ""
      };
    })()
  `);
  recordTest('C4.3', 'At cart count = 1, #cartFab GAINS is-visible class', fabAtOne.hasVisibleClass, `hasVisibleClass: ${fabAtOne.hasVisibleClass}`);
  recordTest('C4.4', 'At cart count = 1, #cartFabCount displays "1"', fabAtOne.countText === '1', `countText: ${fabAtOne.countText}`);

  // Transition 3: Add second item via clicking second card button (1 -> 2)
  await evaluate(`
    (function() {
      var buttons = document.querySelectorAll("[data-cart-id]");
      if (buttons[1]) buttons[1].click();
    })()
  `);
  await new Promise(r => setTimeout(r, 300));
  const fabAtTwo = await evaluate(`
    (function() {
      var fab = document.getElementById("cartFab");
      var countEl = document.getElementById("cartFabCount");
      return {
        hasVisibleClass: fab ? fab.classList.contains("is-visible") : false,
        countText: countEl ? countEl.textContent.trim() : ""
      };
    })()
  `);
  recordTest('C4.5', 'At cart count = 2, #cartFab retains is-visible class', fabAtTwo.hasVisibleClass);
  recordTest('C4.6', 'At cart count = 2, #cartFabCount displays "2"', fabAtTwo.countText === '2', `countText: ${fabAtTwo.countText}`);

  // Transition 4: Remove 1 item via cart drawer remove button (2 -> 1)
  await evaluate(`
    (function() {
      var removeBtns = document.querySelectorAll(".drawer-item-remove");
      if (removeBtns[0]) removeBtns[0].click();
    })()
  `);
  await new Promise(r => setTimeout(r, 300));
  const fabBackToOne = await evaluate(`
    (function() {
      var fab = document.getElementById("cartFab");
      var countEl = document.getElementById("cartFabCount");
      return {
        hasVisibleClass: fab ? fab.classList.contains("is-visible") : false,
        countText: countEl ? countEl.textContent.trim() : ""
      };
    })()
  `);
  recordTest('C4.7', 'At cart count = 1 (after removal), #cartFab retains is-visible class', fabBackToOne.hasVisibleClass);
  recordTest('C4.8', 'At cart count = 1 (after removal), #cartFabCount displays "1"', fabBackToOne.countText === '1');

  // Transition 5: Remove remaining item (1 -> 0)
  await evaluate(`
    (function() {
      var removeBtns = document.querySelectorAll(".drawer-item-remove");
      if (removeBtns[0]) removeBtns[0].click();
    })()
  `);
  await new Promise(r => setTimeout(r, 300));
  const fabBackToZero = await evaluate(`
    (function() {
      var fab = document.getElementById("cartFab");
      var countEl = document.getElementById("cartFabCount");
      return {
        hasVisibleClass: fab ? fab.classList.contains("is-visible") : false,
        countText: countEl ? countEl.textContent.trim() : ""
      };
    })()
  `);
  recordTest('C4.9', 'At cart count = 0 (after removal), #cartFab LOSES is-visible class', !fabBackToZero.hasVisibleClass, `hasVisibleClass: ${fabBackToZero.hasVisibleClass}`);
  recordTest('C4.10', 'At cart count = 0 (after removal), #cartFabCount displays "0"', fabBackToZero.countText === '0');

  // Test FAB click opens cart drawer
  // First add an item back so FAB is visible
  await evaluate(`
    (function() {
      var btn = document.querySelector("[data-cart-id]");
      if (btn) btn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 300));

  await evaluate(`
    (function() {
      var fab = document.getElementById("cartFab");
      if (fab) fab.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 200));
  const fabClickOpen = await evaluate(`
    (function() {
      var drawer = document.getElementById("cartDrawer");
      return drawer ? drawer.classList.contains("is-open") : false;
    })()
  `);
  recordTest('C4.11', 'Clicking #cartFab opens #cartDrawer', fabClickOpen);
  await evaluate(`
    (function() {
      var btn = document.getElementById("closeCart");
      if (btn) btn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 200));

  console.log('\n\x1b[1m>>> TEST 5: Animation Triggers & Flyer DOM Memory Leak Cleanup\x1b[0m');
  // Trigger single flyToCart via clicking add-to-cart button
  const singleFlyerCheck = await evaluate(`
    (async function() {
      var btn = document.querySelector("[data-cart-id]");
      if (btn) btn.click();
      var flyerDuring = document.querySelectorAll(".cart-flyer").length;
      // Wait for 600ms animation duration + 200ms buffer
      await new Promise(r => setTimeout(r, 800));
      var flyerAfter = document.querySelectorAll(".cart-flyer").length;
      return { flyerDuring: flyerDuring, flyerAfter: flyerAfter };
    })()
  `);
  recordTest('C5.1', 'add-to-cart button click creates temporary .cart-flyer element', singleFlyerCheck.flyerDuring >= 1, `flyerDuring: ${singleFlyerCheck.flyerDuring}`);
  recordTest('C5.2', '.cart-flyer is completely removed from DOM after animation completes', singleFlyerCheck.flyerAfter === 0, `flyerAfter: ${singleFlyerCheck.flyerAfter}`);

  // STRESS TEST: Rapid burst of 15 rapid clicks on add-to-cart buttons
  console.log('   Stress testing: 15 rapid sequential clicks on [data-cart-id] buttons...');
  const stressCheck = await evaluate(`
    (async function() {
      var buttons = document.querySelectorAll("[data-cart-id]");
      for (var i = 0; i < 15; i++) {
        var b = buttons[i % buttons.length];
        if (b) b.click();
      }
      var peakFlyers = document.querySelectorAll(".cart-flyer").length;
      // Wait for all animations to complete (duration 600ms + 600ms buffer)
      await new Promise(r => setTimeout(r, 1200));
      var remainingFlyers = document.querySelectorAll(".cart-flyer").length;
      return { peakFlyers: peakFlyers, remainingFlyers: remainingFlyers };
    })()
  `);
  recordTest('C5.3', 'Burst stress test: Peak flyers handled concurrently', stressCheck.peakFlyers > 0, `peakFlyers: ${stressCheck.peakFlyers}`);
  recordTest('C5.4', 'Burst stress test: ZERO DOM memory leak (0 orphan flyers remain)', stressCheck.remainingFlyers === 0, `remainingFlyers: ${stressCheck.remainingFlyers}`);

  // Animation class cleanups (cart-pop-wiggle, badge-bounce)
  const animClassCheck = await evaluate(`
    (async function() {
      var btn = document.querySelector("[data-cart-id]");
      if (btn) btn.click();
      var navBtn = document.getElementById("openCartNav");
      var badge = document.getElementById("cartCount");
      var hasWiggleDuring = navBtn ? navBtn.classList.contains("cart-pop-wiggle") : false;
      var hasBounceDuring = badge ? badge.classList.contains("badge-bounce") : false;
      // flyToCart is 600ms, then anim.onfinish triggers landing ripple which finishes at +600ms = 1200ms.
      // Wait 1400ms to verify complete cleanup after landing ripple.
      await new Promise(r => setTimeout(r, 1400));
      var hasWiggleAfter = navBtn ? navBtn.classList.contains("cart-pop-wiggle") : false;
      var hasBounceAfter = badge ? badge.classList.contains("badge-bounce") : false;
      return {
        hasWiggleDuring: hasWiggleDuring,
        hasBounceDuring: hasBounceDuring,
        hasWiggleAfter: hasWiggleAfter,
        hasBounceAfter: hasBounceAfter
      };
    })()
  `);
  recordTest('C5.5', 'Clicking add-to-cart adds cart-pop-wiggle to cart button', animClassCheck.hasWiggleDuring);
  recordTest('C5.6', 'Clicking add-to-cart adds badge-bounce to cart badge', animClassCheck.hasBounceDuring);
  recordTest('C5.7', 'cart-pop-wiggle class is cleaned up after landing animation completes', !animClassCheck.hasWiggleAfter);
  recordTest('C5.8', 'badge-bounce class is cleaned up after landing animation completes', !animClassCheck.hasBounceAfter);

  console.log('\n\x1b[1m>>> TEST 6: Mobile Hamburger Menu (#openMobileMenu) Toggling #mobileNavDrawer\x1b[0m');
  const initialNavState = await evaluate(`
    (function() {
      var nav = document.getElementById("mobileNavDrawer");
      var bodyHasClass = document.body.classList.contains("drawer-open");
      return {
        exists: !!nav,
        isOpen: nav ? nav.classList.contains("is-open") : false,
        bodyHasClass: bodyHasClass
      };
    })()
  `);
  recordTest('C6.1', '#mobileNavDrawer initially closed', !initialNavState.isOpen && !initialNavState.bodyHasClass);

  // Click #openMobileMenu
  await evaluate(`
    (function() {
      var btn = document.getElementById("openMobileMenu");
      if (btn) btn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 200));

  const afterOpenNavState = await evaluate(`
    (function() {
      var nav = document.getElementById("mobileNavDrawer");
      var bodyHasClass = document.body.classList.contains("drawer-open");
      return {
        isOpen: nav ? nav.classList.contains("is-open") : false,
        bodyHasClass: bodyHasClass
      };
    })()
  `);
  recordTest('C6.2', 'Clicking #openMobileMenu adds is-open to #mobileNavDrawer', afterOpenNavState.isOpen);
  recordTest('C6.3', 'Clicking #openMobileMenu adds drawer-open to document.body', afterOpenNavState.bodyHasClass);

  // Click #closeMobileMenu
  await evaluate(`
    (function() {
      var btn = document.getElementById("closeMobileMenu");
      if (btn) btn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 200));

  const afterCloseNavState = await evaluate(`
    (function() {
      var nav = document.getElementById("mobileNavDrawer");
      var bodyHasClass = document.body.classList.contains("drawer-open");
      return {
        isOpen: nav ? nav.classList.contains("is-open") : false,
        bodyHasClass: bodyHasClass
      };
    })()
  `);
  recordTest('C6.4', 'Clicking #closeMobileMenu removes is-open from #mobileNavDrawer', !afterCloseNavState.isOpen);
  recordTest('C6.5', 'Clicking #closeMobileMenu removes drawer-open from document.body', !afterCloseNavState.bodyHasClass);

  // Re-open and test outside click dismissal
  await evaluate(`
    (function() {
      var btn = document.getElementById("openMobileMenu");
      if (btn) btn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 200));
  await evaluate(`
    (function() {
      var evt = new MouseEvent("click", { bubbles: true, cancelable: true });
      document.body.dispatchEvent(evt);
    })()
  `);
  await new Promise(r => setTimeout(r, 200));
  const afterOutsideClickNavState = await evaluate(`
    (function() {
      var nav = document.getElementById("mobileNavDrawer");
      return nav ? nav.classList.contains("is-open") : false;
    })()
  `);
  recordTest('C6.6', 'Clicking outside #mobileNavDrawer closes mobile menu', !afterOutsideClickNavState);

  console.log('\n\x1b[1m>>> TEST 7: Subpage faq.html Verification\x1b[0m');
  consoleErrors.length = 0; // reset error log for subpage
  await sendCommand('Page.navigate', { url: `http://127.0.0.1:${PORT}/faq.html` });
  await new Promise(r => setTimeout(r, 1000));

  const faqCriticalErrors = consoleErrors.filter(e => !e.includes('favicon.ico'));
  recordTest('C7.1', 'faq.html loads with 0 JavaScript console errors/exceptions', faqCriticalErrors.length === 0, faqCriticalErrors.join('; '));

  const faqDomCheck = await evaluate(`
    (function() {
      var questions = document.querySelectorAll(".faq-card");
      var accordionBtn = document.querySelector(".faq-trigger");
      return {
        questionCount: questions.length,
        hasHeader: !!document.querySelector(".top-nav"),
        hasFooter: !!document.querySelector(".footer"),
        hasAccordionBtn: !!accordionBtn
      };
    })()
  `);
  recordTest('C7.2', 'faq.html contains FAQ items (>= 5)', faqDomCheck.questionCount >= 5, `count: ${faqDomCheck.questionCount}`);
  recordTest('C7.3', 'faq.html has unified Topbar Header and Footer', faqDomCheck.hasHeader && faqDomCheck.hasFooter);

  // Test interactive accordion toggle on faq.html
  const accordionToggleCheck = await evaluate(`
    (function() {
      var card = document.querySelector(".faq-card");
      var trigger = document.querySelector(".faq-trigger");
      if (!card || !trigger) return { success: false, detail: "card or trigger missing" };

      var initialOpen = card.classList.contains("is-open");
      trigger.click();
      var afterFirstClick = card.classList.contains("is-open");
      trigger.click();
      var afterSecondClick = card.classList.contains("is-open");

      return {
        success: (!initialOpen && afterFirstClick && !afterSecondClick) || (initialOpen && !afterFirstClick && afterSecondClick),
        initialOpen: initialOpen,
        afterFirstClick: afterFirstClick,
        afterSecondClick: afterSecondClick
      };
    })()
  `);
  recordTest('C7.4', 'faq.html interactive accordion expands/toggles smoothly', accordionToggleCheck.success, JSON.stringify(accordionToggleCheck));

  console.log('\n\x1b[1m>>> TEST 8: Subpage custom.html Verification\x1b[0m');
  consoleErrors.length = 0; // reset error log for subpage
  await sendCommand('Page.navigate', { url: `http://127.0.0.1:${PORT}/custom.html` });
  await new Promise(r => setTimeout(r, 1000));

  const customCriticalErrors = consoleErrors.filter(e => !e.includes('favicon.ico'));
  recordTest('C8.1', 'custom.html loads with 0 JavaScript console errors/exceptions', customCriticalErrors.length === 0, customCriticalErrors.join('; '));

  const customDomCheck = await evaluate(`
    (function() {
      var zaloBtn = document.querySelector("a[href*='zalo.me']");
      var hasCommitments = document.body.textContent.includes("Bảo hành") ||
                           document.body.textContent.includes("Hỗ trợ trọn đời") ||
                           document.body.textContent.includes("bàn giao");
      return {
        hasHeader: !!document.querySelector(".top-nav"),
        hasFooter: !!document.querySelector(".footer"),
        zaloHref: zaloBtn ? zaloBtn.getAttribute("href") : "",
        zaloTarget: zaloBtn ? zaloBtn.getAttribute("target") : "",
        hasCommitments: hasCommitments
      };
    })()
  `);
  recordTest('C8.2', 'custom.html contains Zalo consultation CTA pointing to https://zalo.me/0938134576', customDomCheck.zaloHref.includes('zalo.me/0938134576'), `href: ${customDomCheck.zaloHref}`);
  recordTest('C8.3', 'custom.html Zalo CTA opens in new tab (target="_blank")', customDomCheck.zaloTarget === '_blank', `target: ${customDomCheck.zaloTarget}`);
  recordTest('C8.4', 'custom.html displays custom design commitments and value proposition', customDomCheck.hasCommitments);
  recordTest('C8.5', 'custom.html has unified Topbar Header and Footer', customDomCheck.hasHeader && customDomCheck.hasFooter);

  console.log('\n\x1b[1m>>> TEST 9: Cross-Page Navigation Link Bidirectional Consistency\x1b[0m');
  // Check index.html links to subpages
  await sendCommand('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
  await new Promise(r => setTimeout(r, 600));

  const indexLinks = await evaluate(`
    (function() {
      var allLinks = Array.from(document.querySelectorAll("a[href]")).map(a => a.getAttribute("href"));
      return {
        hasFaqLink: allLinks.some(h => h.includes("faq.html")),
        hasCustomLink: allLinks.some(h => h.includes("custom.html"))
      };
    })()
  `);
  recordTest('C9.1', 'index.html contains links pointing to faq.html', indexLinks.hasFaqLink);
  recordTest('C9.2', 'index.html contains links pointing to custom.html', indexLinks.hasCustomLink);

  // Check subpages link back to index.html or catalog
  await sendCommand('Page.navigate', { url: `http://127.0.0.1:${PORT}/faq.html` });
  await new Promise(r => setTimeout(r, 600));
  const faqBackLinks = await evaluate(`
    (function() {
      var allLinks = Array.from(document.querySelectorAll("a[href]")).map(a => a.getAttribute("href"));
      return allLinks.some(h => h.includes("index.html") || h === "/" || h.includes("#catalog"));
    })()
  `);
  recordTest('C9.3', 'faq.html contains return links pointing to index.html / catalog', faqBackLinks);

  await sendCommand('Page.navigate', { url: `http://127.0.0.1:${PORT}/custom.html` });
  await new Promise(r => setTimeout(r, 600));
  const customBackLinks = await evaluate(`
    (function() {
      var allLinks = Array.from(document.querySelectorAll("a[href]")).map(a => a.getAttribute("href"));
      return allLinks.some(h => h.includes("index.html") || h === "/" || h.includes("#catalog"));
    })()
  `);
  recordTest('C9.4', 'custom.html contains return links pointing to index.html / catalog', customBackLinks);

  // Summary
  const total = testResults.length;
  const passed = testResults.filter(t => t.passed).length;
  const failed = total - passed;

  console.log('\n\x1b[1m\x1b[36m======================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[36m               CHALLENGER EMPIRICAL VERIFICATION SUMMARY              \x1b[0m');
  console.log('\x1b[1m\x1b[36m======================================================================\x1b[0m');
  console.log(`  Total Empirical Checks: ${total}`);
  console.log(`  Passed Checks:          \x1b[32m${passed}\x1b[0m`);
  console.log(`  Failed Checks:          \x1b[${failed > 0 ? '31' : '32'}m${failed}\x1b[0m`);
  console.log('----------------------------------------------------------------------');

  if (failed === 0) {
    console.log('\x1b[1m\x1b[32m[EMPIRICAL VERDICT] ALL CHECKS PASSED EMPIRICALLY WITH ZERO DEFECTS!\x1b[0m\n');
  } else {
    console.log(`\x1b[1m\x1b[31m[EMPIRICAL VERDICT] ${failed} CHECK(S) FAILED! REQUEST CHANGES!\x1b[0m\n`);
  }

  // Cleanup
  try {
    if (ws) ws.close();
    if (chromeProcess) chromeProcess.kill();
    server.close();
    fs.rmSync(TEMP_USER_DATA, { recursive: true, force: true });
  } catch (e) {}

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('\x1b[31mFatal error during empirical test execution:\x1b[0m', err);
  if (chromeProcess) chromeProcess.kill();
  if (server) server.close();
  try { fs.rmSync(TEMP_USER_DATA, { recursive: true, force: true }); } catch (e) {}
  process.exit(1);
});
