/**
 * Adversarial Independent Review Script
 * reviewer_lp_1
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_HTML = path.join(ROOT_DIR, 'index.html');
const FAQ_HTML = path.join(ROOT_DIR, 'faq.html');
const CUSTOM_HTML = path.join(ROOT_DIR, 'custom.html');
const STOREFRONT_JS = path.join(ROOT_DIR, 'storefront.js');
const STOREFRONT_CSS = path.join(ROOT_DIR, 'storefront.css');

const results = {
  passed: [],
  failed: [],
  warnings: [],
  observations: []
};

function check(title, fn) {
  try {
    fn();
    results.passed.push(title);
    console.log(`[PASS] ${title}`);
  } catch (err) {
    results.failed.push({ title, error: err.message });
    console.error(`[FAIL] ${title}: ${err.message}`);
  }
}

console.log('=== STARTING INDEPENDENT ADVERSARIAL AUDIT ===');

const indexHtml = fs.readFileSync(INDEX_HTML, 'utf8');
const bodyStartIndex = indexHtml.indexOf('<body');
assert(bodyStartIndex !== -1, 'index.html must have <body>');
const indexBody = indexHtml.slice(bodyStartIndex);

// 1. SECTION INVENTORY in index.html body
check('Section Tag Inventory in index.html Body', () => {
  const sectionMatches = indexBody.match(/<section[^>]*>/gi) || [];
  results.observations.push(`Found ${sectionMatches.length} <section> tags in index.html body: ${JSON.stringify(sectionMatches)}`);
  console.log(`  Discovered sections:`, sectionMatches);
  
  // Exactly 1 section should be the primary content: #catalog
  assert(sectionMatches.length >= 1, 'Should have at least 1 section (#catalog)');
  assert(sectionMatches.some(s => s.includes('id="catalog"') || s.includes("id='catalog'")), 'Must have #catalog');
  
  // Forbidden sections must not exist
  for (const s of sectionMatches) {
    assert(!/hero/i.test(s), `Forbidden hero section found: ${s}`);
    assert(!/stats/i.test(s), `Forbidden stats section found: ${s}`);
    assert(!/steps/i.test(s), `Forbidden steps section found: ${s}`);
    assert(!/compare/i.test(s), `Forbidden compare section found: ${s}`);
    assert(!/coupon/i.test(s), `Forbidden coupon section found: ${s}`);
    assert(!/id=['"]faq['"]/i.test(s), `Forbidden faq section found: ${s}`);
    assert(!/id=['"]custom['"]/i.test(s), `Forbidden custom section found: ${s}`);
  }
});

// 2. Direct sequence check: <header class="top-nav"> ... </header> -> #catalog
check('Header and Catalog Immediate Succession', () => {
  const headerOpen = indexBody.indexOf('<header class="top-nav"');
  assert(headerOpen !== -1, 'Must find <header class="top-nav">');
  const headerClose = indexBody.indexOf('</header>', headerOpen);
  assert(headerClose !== -1, 'Must find closing </header>');
  const catalogOpen = indexBody.indexOf('<section class="catalog-section-wrap" id="catalog"');
  assert(catalogOpen !== -1, 'Must find <section ... id="catalog">');
  assert(catalogOpen > headerClose, '#catalog must appear after </header>');
  
  // Check what is between </header> and #catalog
  const interstitial = indexBody.slice(headerClose + 9, catalogOpen).trim();
  results.observations.push(`Interstitial between </header> and #catalog: "${interstitial}"`);
  // Should only be comments and whitespace
  const nonComment = interstitial.replace(/<!--[\s\S]*?-->/g, '').trim();
  assert(nonComment === '', `Unexpected elements between </header> and #catalog: "${nonComment}"`);
});

// 3. Navigation sync across 5 areas in index.html
check('Navigation Sync across 5 areas in index.html', () => {
  // 1. Topbar
  const topNav = indexBody.slice(indexBody.indexOf('<header class="top-nav"'), indexBody.indexOf('</header>'));
  assert(topNav.includes('href="faq.html"'), 'Topbar must link to faq.html');
  assert(topNav.includes('href="custom.html"'), 'Topbar must link to custom.html');

  // 2. Mobile Nav Drawer
  const mobileDrawer = indexBody.slice(indexBody.indexOf('id="mobileNavDrawer"'), indexBody.indexOf('</aside>', indexBody.indexOf('id="mobileNavDrawer"')));
  assert(mobileDrawer.includes('href="faq.html"'), 'Mobile drawer must link to faq.html');
  assert(mobileDrawer.includes('href="custom.html"'), 'Mobile drawer must link to custom.html');

  // 3. Detail Top Nav
  const detailNav = indexBody.slice(indexBody.indexOf('class="detail-top-nav"'), indexBody.indexOf('</header>', indexBody.indexOf('class="detail-top-nav"')));
  assert(detailNav.includes('href="faq.html"'), 'Detail Topbar must link to faq.html');
  assert(detailNav.includes('href="custom.html"'), 'Detail Topbar must link to custom.html');

  // 4. Checkout Top Nav
  const checkoutNav = indexBody.slice(indexBody.indexOf('class="checkout-top-nav"'), indexBody.indexOf('</header>', indexBody.indexOf('class="checkout-top-nav"')));
  assert(checkoutNav.includes('href="faq.html"'), 'Checkout Topbar must link to faq.html');
  assert(checkoutNav.includes('href="custom.html"'), 'Checkout Topbar must link to custom.html');

  // 5. Footer
  const footer = indexBody.slice(indexBody.indexOf('<footer class="footer"'), indexBody.indexOf('</footer>'));
  assert(footer.includes('href="faq.html"'), 'Footer must link to faq.html');
  assert(footer.includes('href="custom.html"'), 'Footer must link to custom.html');
});

// 4. Detailed audit of faq.html
check('faq.html Structure, Content, and Interactivity', () => {
  assert(fs.existsSync(FAQ_HTML), 'faq.html must exist');
  const faqHtml = fs.readFileSync(FAQ_HTML, 'utf8');
  assert(faqHtml.length > 2000, `faq.html should be substantial (got ${faqHtml.length} bytes)`);

  // Verify Topbar
  assert(faqHtml.includes('class="top-nav"'), 'faq.html must have top-nav');
  // Check active link on "Hỏi đáp"
  assert(/<a[^>]*href=["'](?:\.\/)?faq\.html["'][^>]*class=["'][^"']*\bactive\b[^"']*["']/i.test(faqHtml) ||
         /<a[^>]*class=["'][^"']*\bactive\b[^"']*["'][^>]*href=["'](?:\.\/)?faq\.html["']/i.test(faqHtml),
         'faq.html "Hỏi đáp" must have active class');

  // Verify questions
  const qList = [
    'Tôi chỉ dùng Điện thoại hoặc iPad/Tablet',
    'vấn đề bảo mật sẽ như thế nào',
    'trả theo từng tháng không',
    'gặp vấn đề thì giải quyết như thế nào',
    'hướng dẫn sử dụng không'
  ];
  for (const q of qList) {
    assert(faqHtml.includes(q), `Missing FAQ question containing: "${q}"`);
  }

  // Verify Accordion Logic
  assert(faqHtml.includes('faq-trigger') || faqHtml.includes('faq-card-question'), 'Must have accordion triggers');
  assert(faqHtml.includes('faq-content') || faqHtml.includes('faq-card-answer'), 'Must have accordion content containers');
  assert(faqHtml.includes('addEventListener'), 'Must have JavaScript interactivity');

  // Verify Zalo CTA
  assert(faqHtml.includes('https://zalo.me/0938134576') || faqHtml.includes('0938 134 576'), 'Must have Zalo contact');

  // Verify Mobile Drawer & Footer
  assert(faqHtml.includes('id="mobileNavDrawer"'), 'faq.html must have mobileNavDrawer');
  assert(faqHtml.includes('class="footer"'), 'faq.html must have footer');
});

// 5. Detailed audit of custom.html
check('custom.html Structure, Content, Value Prop, Commitments, Painpoints, and Zalo CTA', () => {
  assert(fs.existsSync(CUSTOM_HTML), 'custom.html must exist');
  const customHtml = fs.readFileSync(CUSTOM_HTML, 'utf8');
  assert(customHtml.length > 2000, `custom.html should be substantial (got ${customHtml.length} bytes)`);

  // Verify Topbar & Active state
  assert(customHtml.includes('class="top-nav"'), 'custom.html must have top-nav');
  assert(/class=["'][^"']*\bactive\b[^"']*["'][^>]*>[\s\S]*?Thiết kế file riêng/i.test(customHtml) ||
         /href=["'](?:\.\/)?custom\.html["'][^>]*class=["'][^"']*\bactive\b[^"']*["']/i.test(customHtml) ||
         /class=["'][^"']*\bnav-link-custom\b[^"']*\bactive\b[^"']*["']/i.test(customHtml),
         'custom.html "Thiết kế file riêng" must have active class');

  // Verify 3 commitments
  assert(customHtml.includes('Tư vấn cấu trúc') || customHtml.includes('quy trình'), 'Commitment 1 missing');
  assert(customHtml.includes('Chốt tiến độ') || customHtml.includes('24 – 48h'), 'Commitment 2 missing');
  assert(customHtml.includes('bảo hành trọn đời') || customHtml.includes('Hỗ trợ trọn đời'), 'Commitment 3 missing');

  // Verify 5 painpoints case studies
  const storyCards = (customHtml.match(/class=["'][^"']*\bpainpoint-story-card\b[^"']*["']/gi) || []).length;
  assert(storyCards >= 5, `Expected at least 5 painpoint story cards, found ${storyCards}`);
  const authors = ['Anh Nam', 'Chị Mai', 'Hoàng Tuấn', 'Chị Hằng', 'Bác Hùng'];
  for (const author of authors) {
    assert(customHtml.includes(author), `Missing painpoint case study for: ${author}`);
  }

  // Verify Zalo CTA
  assert(customHtml.includes('https://zalo.me/0938134576'), 'Zalo link missing');
  assert(/<a[^>]*href=["']https:\/\/zalo\.me\/0938134576["'][^>]*target=["']_blank["']/i.test(customHtml), 'Zalo CTA must have target="_blank"');
  assert(/<a[^>]*href=["']https:\/\/zalo\.me\/0938134576["'][^>]*rel=["'][^"']*noopener[^"']*["']/i.test(customHtml), 'Zalo CTA must have rel="noopener"');

  // Verify Mobile Drawer & Footer
  assert(customHtml.includes('id="mobileNavDrawer"'), 'custom.html must have mobileNavDrawer');
  assert(customHtml.includes('class="footer"'), 'custom.html must have footer');
});

// 6. Navigation cross-linking integrity check (no broken relative links)
check('Cross-Page Navigation Parity and Link Integrity', () => {
  const pages = [
    { name: 'index.html', content: indexHtml },
    { name: 'faq.html', content: fs.readFileSync(FAQ_HTML, 'utf8') },
    { name: 'custom.html', content: fs.readFileSync(CUSTOM_HTML, 'utf8') }
  ];

  for (const page of pages) {
    // Check Topbar nav in each page
    const topNavMatch = page.content.match(/<header\s+class=["'][^"']*\btop-nav\b[^"']*["'][\s\S]*?<\/header>/i);
    assert(topNavMatch, `${page.name} must contain <header class="top-nav">`);
    const topNav = topNavMatch[0];

    // Check that Home, Catalog, FAQ, and Custom links exist and are valid
    assert(/href=["'](?:\/|index\.html|#)?["']/i.test(topNav), `${page.name} topbar missing Home link`);
    assert(/href=["'](?:\/?index\.html)?#catalog["']/i.test(topNav), `${page.name} topbar missing Catalog link`);
    assert(/href=["'](?:\.\/)?faq\.html["']/i.test(topNav), `${page.name} topbar missing FAQ link`);
    assert(/href=["'](?:\.\/)?custom\.html["']/i.test(topNav), `${page.name} topbar missing Custom link`);

    // Check Drawer in each page
    const drawerMatch = page.content.match(/<aside[^>]*id=["']mobileNavDrawer["'][\s\S]*?<\/aside>/i);
    assert(drawerMatch, `${page.name} must contain mobileNavDrawer`);
    const drawer = drawerMatch[0];
    assert(/href=["'](?:\.\/)?faq\.html["']/i.test(drawer), `${page.name} drawer missing FAQ link`);
    assert(/href=["'](?:\.\/)?custom\.html["']/i.test(drawer), `${page.name} drawer missing Custom link`);

    // Check Footer in each page
    const footerMatch = page.content.match(/<footer\s+class=["'][^"']*\bfooter\b[^"']*["'][\s\S]*?<\/footer>/i);
    assert(footerMatch, `${page.name} must contain footer`);
    const footer = footerMatch[0];
    assert(/href=["'](?:\.\/)?faq\.html["']/i.test(footer), `${page.name} footer missing FAQ link`);
    assert(/href=["'](?:\.\/)?custom\.html["']/i.test(footer), `${page.name} footer missing Custom link`);
  }
});

// 7. Storefront JS & CSS Adversarial Check (Integrity, Null-Checks, Animations)
check('Storefront JS & CSS Integrity and Edge Cases', () => {
  const js = fs.readFileSync(STOREFRONT_JS, 'utf8');
  const css = fs.readFileSync(STOREFRONT_CSS, 'utf8');

  // Verify no hardcoded test shortcuts
  assert(!js.includes('__MOCK_TEST_OVERRIDE__'), 'Found unauthorized mock test override in storefront.js');
  assert(!css.includes('/* TEST_OVERRIDE */'), 'Found unauthorized test override in storefront.css');

  // Verify safe guards for removed sections
  assert(js.includes('syncLandingCouponTicket'), 'syncLandingCouponTicket must exist');
  assert(/function\s+syncLandingCouponTicket[\s\S]*?if\s*\(\s*!ticketSec\s*\)\s*return/i.test(js), 'syncLandingCouponTicket missing guard');
  assert(/function\s+syncHeroCoupons[\s\S]*?if\s*\(\s*!container\s*\)\s*return/i.test(js), 'syncHeroCoupons missing guard');

  // Verify mobile FAB styling
  assert(css.includes('.cart-fab'), 'storefront.css missing .cart-fab');
  assert(css.includes('#059669') || css.includes('var(--mint-primary)'), '.cart-fab must be Mint color');
  assert(css.includes('cartPopShrinkWiggle'), 'Keyframe cartPopShrinkWiggle missing in CSS');
  assert(css.includes('badgeBounceScale'), 'Keyframe badgeBounceScale missing in CSS');
  assert(css.includes('.cart-flyer'), '.cart-flyer missing in CSS');

  // Verify mobile hamburger event listener
  assert(/openMobileMenu(?:Btn)?\.addEventListener\s*\(\s*["']click["']/i.test(js) ||
         /document\.getElementById\s*\(\s*["']openMobileMenu["']\s*\)\.addEventListener\s*\(\s*["']click["']/i.test(js),
         'openMobileMenu listener must be attached');

  // Verify click outside excludes cartFab
  assert(/!event\.target\.closest\(['"]#cartFab['"]\)/i.test(js) ||
         /!event\.target\.closest\(['"]\.cart-fab['"]\)/i.test(js),
         'Click-outside must exclude #cartFab');
});

console.log('=== AUDIT SUMMARY ===');
console.log(`Passed: ${results.passed.length}`);
console.log(`Failed: ${results.failed.length}`);

if (results.failed.length > 0) {
  process.exit(1);
} else {
  console.log('ALL INDEPENDENT ADVERSARIAL AUDITS PASSED WITH ZERO ERRORS.');
}
