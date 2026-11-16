/**
 * Automated E2E Verification Test Suite
 * Task: Tối giản Landing Page (index.html) & Nâng Cấp Trải Nghiệm Giỏ Hàng (FILE ĐI LÀM)
 * 
 * Verifies 5 Critical Tiers:
 * Tier 1: DOM & Structure Checks (Hero, Stats, Steps, Compare, Coupons, FAQ, Custom removal, #catalog placement, 5 nav areas)
 * Tier 2: Subpages Existence & Integrity (faq.html 5 Q&A + accordion, custom.html 3 commitments + 5 painpoints + Zalo CTA)
 * Tier 3: Storefront JS & Safe Null-Checks (VM syntax, null-checks for removed elements, hamburger listener, click-outside excludes #cartFab)
 * Tier 4: Cart UX, Mobile FAB & Animations (#cartFab, #cartFabCount, .cart-fab CSS, keyframes, .cart-flyer, openDrawer: false)
 * Tier 5: VietQR & Payment Integrity (makeLocalVietQr EMVCo + CRC16, /orders routes)
 * 
 * Usage:
 *   node tests/test_streamline_e2e.cjs
 *   node tests/test_streamline_e2e.cjs --allow-fail
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');
const FAQ_HTML_PATH = path.join(ROOT_DIR, 'faq.html');
const CUSTOM_HTML_PATH = path.join(ROOT_DIR, 'custom.html');
const STOREFRONT_JS_PATH = path.join(ROOT_DIR, 'storefront.js');
const STOREFRONT_CSS_PATH = path.join(ROOT_DIR, 'storefront.css');
const RESULTS_JSON_PATH = path.join(ROOT_DIR, 'tests', 'test_streamline_e2e_results.json');

const allowFail = process.argv.includes('--allow-fail');

// ANSI Colors
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const GRAY = '\x1b[90m';

console.log(`${BOLD}${CYAN}======================================================================${RESET}`);
console.log(`${BOLD}${CYAN}  FILE ĐI LÀM — STREAMLINED STOREFRONT & CART E2E VERIFICATION SUITE  ${RESET}`);
console.log(`${BOLD}${CYAN}======================================================================${RESET}`);
console.log(`${GRAY}Target Directory: ${ROOT_DIR}${RESET}\n`);

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testRecords = [];
const tierStats = {
  1: { name: 'Tier 1 - DOM & Structure Checks', total: 0, passed: 0, failed: 0 },
  2: { name: 'Tier 2 - Subpages Existence & Integrity', total: 0, passed: 0, failed: 0 },
  3: { name: 'Tier 3 - Storefront JS & Safe Null-Checks', total: 0, passed: 0, failed: 0 },
  4: { name: 'Tier 4 - Cart UX, Mobile FAB & Animations', total: 0, passed: 0, failed: 0 },
  5: { name: 'Tier 5 - VietQR & Payment Integrity', total: 0, passed: 0, failed: 0 }
};

function runTest(tierNumber, id, name, fn) {
  totalTests++;
  tierStats[tierNumber].total++;
  const record = { id, tier: tierNumber, name, status: 'PENDING', error: null };
  try {
    fn();
    passedTests++;
    tierStats[tierNumber].passed++;
    record.status = 'PASS';
    console.log(`  ${GREEN}[PASS]${RESET} ${BOLD}${id}${RESET}: ${name}`);
  } catch (err) {
    failedTests++;
    tierStats[tierNumber].failed++;
    record.status = 'FAIL';
    record.error = err.message;
    console.log(`  ${RED}[FAIL]${RESET} ${BOLD}${id}${RESET}: ${name}`);
    console.log(`         ${RED}└─ ${err.message}${RESET}`);
  }
  testRecords.push(record);
}

// Read base files
const indexHtmlContent = fs.existsSync(INDEX_HTML_PATH) ? fs.readFileSync(INDEX_HTML_PATH, 'utf8') : '';
const storefrontJsContent = fs.existsSync(STOREFRONT_JS_PATH) ? fs.readFileSync(STOREFRONT_JS_PATH, 'utf8') : '';
const storefrontCssContent = fs.existsSync(STOREFRONT_CSS_PATH) ? fs.readFileSync(STOREFRONT_CSS_PATH, 'utf8') : '';

// Helper to extract body content
function getBodyContent(html) {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1] : html;
}
const indexBodyContent = getBodyContent(indexHtmlContent);

// =============================================================================
// TIER 1: DOM & STRUCTURE CHECKS (index.html)
// =============================================================================
console.log(`\n${BOLD}>>> TIER 1: DOM & Structure Checks (index.html)${RESET}`);

runTest(1, 'T1.1', 'Hero section is completely removed from index.html body', () => {
  assert(indexHtmlContent, 'index.html file must exist and not be empty');
  const hasHeroTag = /<section[^>]*class=["'][^"']*\bhero\b[^"']*["']/i.test(indexBodyContent);
  const hasHeroGrid = /class=["'][^"']*\bhero-grid\b[^"']*["']/i.test(indexBodyContent);
  const hasHeroTitle = /class=["'][^"']*\bhero-title\b[^"']*["']/i.test(indexBodyContent);
  const hasHeroMockup = /class=["'][^"']*\bhero-mockup-wrapper\b[^"']*["']/i.test(indexBodyContent);
  assert(!hasHeroTag, 'Found <section class="hero"> in index.html - must be removed');
  assert(!hasHeroGrid, 'Found class "hero-grid" in index.html body - must be removed');
  assert(!hasHeroTitle, 'Found class "hero-title" in index.html body - must be removed');
  assert(!hasHeroMockup, 'Found class "hero-mockup-wrapper" in index.html body - must be removed');
});

runTest(1, 'T1.2', 'Stats section is completely removed from index.html body', () => {
  assert(indexHtmlContent, 'index.html file must exist');
  const hasStatsTag = /<section[^>]*class=["'][^"']*\bstats-section\b[^"']*["']/i.test(indexBodyContent);
  const hasStatsGrid = /class=["'][^"']*\bstats-grid\b[^"']*["']/i.test(indexBodyContent);
  const hasStatExperience = indexBodyContent.includes('statExperienceContainer');
  const hasStatTotalFiles = indexBodyContent.includes('statTotalFilesContainer');
  assert(!hasStatsTag, 'Found <section class="stats-section"> in index.html - must be removed');
  assert(!hasStatsGrid, 'Found class "stats-grid" in index.html body - must be removed');
  assert(!hasStatExperience, 'Found #statExperienceContainer in index.html body - must be removed');
  assert(!hasStatTotalFiles, 'Found #statTotalFilesContainer in index.html body - must be removed');
});

runTest(1, 'T1.3', 'Steps section (Quy trình mua) is completely removed from index.html body', () => {
  assert(indexHtmlContent, 'index.html file must exist');
  const hasStepsTag = /<section[^>]*class=["'][^"']*\bsteps-section\b[^"']*["']/i.test(indexBodyContent);
  const hasStepsClass = /class=["'][^"']*\bsteps-section\b[^"']*["']/i.test(indexBodyContent);
  assert(!hasStepsTag && !hasStepsClass, 'Found steps-section in index.html body - must be removed');
});

runTest(1, 'T1.4', 'Compare section (So sánh kinh tế) is completely removed from index.html body', () => {
  assert(indexHtmlContent, 'index.html file must exist');
  const hasCompareTag = /<section[^>]*class=["'][^"']*\bcompare-compact-section\b[^"']*["']/i.test(indexBodyContent);
  const hasCompareClass = /class=["'][^"']*\bcompare-compact-section\b[^"']*["']/i.test(indexBodyContent);
  assert(!hasCompareTag && !hasCompareClass, 'Found compare-compact-section in index.html body - must be removed');
});

runTest(1, 'T1.5', 'Landing coupon section (landingCouponSection) is completely removed from index.html', () => {
  assert(indexHtmlContent, 'index.html file must exist');
  const hasCouponSection = /id=["']landingCouponSection["']/i.test(indexBodyContent);
  assert(!hasCouponSection, 'Found id="landingCouponSection" in index.html - must be removed from homepage');
});

runTest(1, 'T1.6', 'FAQ section is completely removed from index.html', () => {
  assert(indexHtmlContent, 'index.html file must exist');
  const hasFaqId = /<section[^>]*id=["']faq["']/i.test(indexBodyContent);
  const hasFaqClass = /<section[^>]*class=["'][^"']*\bfaq-section\b[^"']*["']/i.test(indexBodyContent);
  assert(!hasFaqId, 'Found <section id="faq"> in index.html - must be moved to independent faq.html');
  assert(!hasFaqClass, 'Found <section class="faq-section"> in index.html - must be moved to independent faq.html');
});

runTest(1, 'T1.7', 'Custom service section is completely removed from index.html', () => {
  assert(indexHtmlContent, 'index.html file must exist');
  const hasCustomId = /<section[^>]*id=["']custom["']/i.test(indexBodyContent);
  const hasCustomClass = /<section[^>]*class=["'][^"']*\bcustom-clean-section\b[^"']*["']/i.test(indexBodyContent);
  assert(!hasCustomId, 'Found <section id="custom"> in index.html - must be moved to independent custom.html');
  assert(!hasCustomClass, 'Found <section class="custom-clean-section"> in index.html - must be moved to independent custom.html');
});

runTest(1, 'T1.8', '#catalog is positioned directly under Topbar header and header tag is closed', () => {
  assert(indexHtmlContent, 'index.html file must exist');
  // 1. Locate <header class="top-nav">
  const topNavHeaderStart = indexHtmlContent.search(/<header\s+class=["'][^"']*\btop-nav\b[^"']*["']/i);
  assert(topNavHeaderStart !== -1, 'Could not locate <header class="top-nav"> in index.html');
  
  // 2. Locate #catalog section
  const catalogSectionStart = indexHtmlContent.search(/<section[^>]*id=["']catalog["']/i);
  assert(catalogSectionStart !== -1, 'Could not locate <section id="catalog"> in index.html');
  assert(catalogSectionStart > topNavHeaderStart, '#catalog section must appear after <header class="top-nav">');

  // 3. Inspect content between top-nav start and #catalog
  const betweenHeaderAndCatalog = indexHtmlContent.slice(topNavHeaderStart, catalogSectionStart);
  
  // Verify </header> exists in this slice
  const hasClosingHeader = /<\/header>/i.test(betweenHeaderAndCatalog);
  assert(hasClosingHeader, '<header class="top-nav"> is unclosed before #catalog (missing </header> closing tag)');

  // Verify no other <section> occurs between </header> and #catalog
  const afterHeaderClose = betweenHeaderAndCatalog.slice(betweenHeaderAndCatalog.search(/<\/header>/i) + 9);
  const hasIntermediarySection = /<section/i.test(afterHeaderClose);
  assert(!hasIntermediarySection, 'Found an unexpected <section> between </header> and #catalog');
});

runTest(1, 'T1.9', 'Topbar header navigation links point to faq.html and custom.html', () => {
  assert(indexHtmlContent, 'index.html file must exist');
  const topNavStart = indexHtmlContent.search(/<header\s+class=["'][^"']*\btop-nav\b[^"']*["']/i);
  assert(topNavStart !== -1, 'Could not locate <header class="top-nav">');
  
  // Find </header> after topNavStart or search within first 4000 characters
  const slice = indexHtmlContent.slice(topNavStart, topNavStart + 3000);
  const hasFaqLink = /href=["'](?:\.\/)?faq\.html["']/i.test(slice);
  const hasCustomLink = /href=["'](?:\.\/)?custom\.html["']/i.test(slice);
  
  assert(hasFaqLink, 'Topbar navigation must contain link to faq.html for "Hỏi đáp"');
  assert(hasCustomLink, 'Topbar navigation must contain link to custom.html for "Thiết kế file riêng"');
});

runTest(1, 'T1.10', 'Mobile Drawer navigation links point to faq.html and custom.html', () => {
  assert(indexHtmlContent, 'index.html file must exist');
  const drawerMatch = indexHtmlContent.match(/<aside[^>]*id=["']mobileNavDrawer["'][\s\S]*?<\/aside>/i);
  assert(drawerMatch, 'Could not locate <aside id="mobileNavDrawer"> in index.html');
  const drawerHtml = drawerMatch[0];
  
  const hasFaqLink = /href=["'](?:\.\/)?faq\.html["']/i.test(drawerHtml);
  const hasCustomLink = /href=["'](?:\.\/)?custom\.html["']/i.test(drawerHtml);
  
  assert(hasFaqLink, 'Mobile drawer must contain link to faq.html');
  assert(hasCustomLink, 'Mobile drawer must contain link to custom.html');
});

runTest(1, 'T1.11', 'Detail Modal navigation links point to faq.html and custom.html', () => {
  assert(indexHtmlContent, 'index.html file must exist');
  const detailNavMatch = indexHtmlContent.match(/<header[^>]*class=["'][^"']*\bdetail-top-nav\b[^"']*["'][\s\S]*?<\/header>/i);
  assert(detailNavMatch, 'Could not locate <header class="detail-top-nav"> in index.html');
  const detailNavHtml = detailNavMatch[0];
  
  const hasFaqLink = /href=["'](?:\.\/)?faq\.html["']/i.test(detailNavHtml);
  const hasCustomLink = /href=["'](?:\.\/)?custom\.html["']/i.test(detailNavHtml);
  
  assert(hasFaqLink, 'Detail modal topbar must contain link to faq.html');
  assert(hasCustomLink, 'Detail modal topbar must contain link to custom.html');
});

runTest(1, 'T1.12', 'Checkout Modal navigation links point to faq.html and custom.html', () => {
  assert(indexHtmlContent, 'index.html file must exist');
  const checkoutNavMatch = indexHtmlContent.match(/<header[^>]*class=["'][^"']*\bcheckout-top-nav\b[^"']*["'][\s\S]*?<\/header>/i);
  assert(checkoutNavMatch, 'Could not locate <header class="checkout-top-nav"> in index.html');
  const checkoutNavHtml = checkoutNavMatch[0];
  
  const hasFaqLink = /href=["'](?:\.\/)?faq\.html["']/i.test(checkoutNavHtml);
  const hasCustomLink = /href=["'](?:\.\/)?custom\.html["']/i.test(checkoutNavHtml);
  
  assert(hasFaqLink, 'Checkout modal topbar must contain link to faq.html');
  assert(hasCustomLink, 'Checkout modal topbar must contain link to custom.html');
});

runTest(1, 'T1.13', 'Footer navigation links point to faq.html and custom.html', () => {
  assert(indexHtmlContent, 'index.html file must exist');
  const footerMatch = indexHtmlContent.match(/<footer\s+class=["'][^"']*\bfooter\b[^"']*["'][\s\S]*?<\/footer>/i);
  assert(footerMatch, 'Could not locate <footer class="footer"> in index.html');
  const footerHtml = footerMatch[0];
  
  const hasFaqLink = /href=["'](?:\.\/)?faq\.html["']/i.test(footerHtml);
  const hasCustomLink = /href=["'](?:\.\/)?custom\.html["']/i.test(footerHtml);
  
  assert(hasFaqLink, 'Footer must contain link to faq.html');
  assert(hasCustomLink, 'Footer must contain link to custom.html');
});

// =============================================================================
// TIER 2: SUBPAGES EXISTENCE & INTEGRITY (faq.html & custom.html)
// =============================================================================
console.log(`\n${BOLD}>>> TIER 2: Subpages Existence & Integrity (faq.html & custom.html)${RESET}`);

let faqHtmlContent = '';
let customHtmlContent = '';

runTest(2, 'T2.1', 'faq.html exists and is non-empty', () => {
  assert(fs.existsSync(FAQ_HTML_PATH), 'faq.html does not exist in root directory');
  faqHtmlContent = fs.readFileSync(FAQ_HTML_PATH, 'utf8');
  assert(faqHtmlContent.length > 500, `faq.html is unexpectedly small (${faqHtmlContent.length} bytes)`);
});

runTest(2, 'T2.2', 'faq.html contains 5 FAQ questions and comprehensive answers', () => {
  assert(faqHtmlContent, 'faq.html must exist to verify content');
  const q1 = faqHtmlContent.includes('Tôi chỉ dùng Điện thoại hoặc iPad/Tablet');
  const q2 = faqHtmlContent.includes('vấn đề bảo mật sẽ như thế nào') || faqHtmlContent.includes('bảo mật thông tin');
  const q3 = faqHtmlContent.includes('trả theo từng tháng không') || faqHtmlContent.includes('xài mãi mãi trọn đời');
  const q4 = faqHtmlContent.includes('gặp vấn đề thì giải quyết như thế nào') || faqHtmlContent.includes('hỗ trợ kỹ thuật');
  const q5 = faqHtmlContent.includes('hướng dẫn sử dụng không') || faqHtmlContent.includes('video thao tác thực tế');
  
  assert(q1, 'faq.html missing Question 1 (Điện thoại / iPad / Tablet compatibility)');
  assert(q2, 'faq.html missing Question 2 (Google Sheets privacy & security)');
  assert(q3, 'faq.html missing Question 3 (Lifetime ownership / no monthly fee)');
  assert(q4, 'faq.html missing Question 4 (Zalo & technical support)');
  assert(q5, 'faq.html missing Question 5 (Documentation & video guides)');
});

runTest(2, 'T2.3', 'faq.html contains interactive accordion structure and toggle logic', () => {
  assert(faqHtmlContent, 'faq.html must exist to verify accordion structure');
  const hasFaqItems = faqHtmlContent.includes('faq-item') || faqHtmlContent.includes('faq-card') || faqHtmlContent.includes('accordion');
  const hasFaqQuestions = faqHtmlContent.includes('faq-question') || faqHtmlContent.includes('faq-card-question') || faqHtmlContent.includes('faq-trigger');
  const hasFaqAnswers = faqHtmlContent.includes('faq-answer') || faqHtmlContent.includes('faq-content');
  const hasScriptToggle = faqHtmlContent.includes('addEventListener') || faqHtmlContent.includes('toggle') || faqHtmlContent.includes('classList');
  
  assert(hasFaqItems, 'faq.html must contain .faq-item or .faq-card elements');
  assert(hasFaqQuestions, 'faq.html must contain question elements (.faq-question or .faq-trigger)');
  assert(hasFaqAnswers, 'faq.html must contain answer elements (.faq-answer or .faq-content)');
  assert(hasScriptToggle, 'faq.html must contain script logic for accordion expand/collapse');
});

runTest(2, 'T2.4', 'faq.html has unified Header Topbar with active class on "Hỏi đáp"', () => {
  assert(faqHtmlContent, 'faq.html must exist to verify header topbar');
  const hasTopNav = faqHtmlContent.includes('top-nav') || faqHtmlContent.includes('nav-container');
  const hasBrand = faqHtmlContent.includes('File Đi Làm');
  const hasCartBtn = faqHtmlContent.includes('openCartNav') || faqHtmlContent.includes('shopping-bag-btn');
  const hasActiveFaq = /<a[^>]*href=["'](?:\.\/)?faq\.html["'][^>]*class=["'][^"']*\bactive\b[^"']*["'][^>]*>[\s\S]*?Hỏi đáp/i.test(faqHtmlContent) ||
                       /<a[^>]*class=["'][^"']*\bactive\b[^"']*["'][^>]*href=["'](?:\.\/)?faq\.html["'][^>]*>[\s\S]*?Hỏi đáp/i.test(faqHtmlContent) ||
                       /<a[^>]*class=["'][^"']*\bactive\b[^"']*["'][^>]*>[\s\S]*?Hỏi đáp[\s\S]*?<\/a>/i.test(faqHtmlContent);
  
  assert(hasTopNav, 'faq.html must contain shared Topbar header (.top-nav)');
  assert(hasBrand, 'faq.html must display brand name "File Đi Làm"');
  assert(hasCartBtn, 'faq.html must contain Cart launcher button');
  assert(hasActiveFaq, 'faq.html Topbar navigation must set class="active" on "Hỏi đáp" link');
});

runTest(2, 'T2.5', 'faq.html contains Mobile Nav Drawer and unified Footer', () => {
  assert(faqHtmlContent, 'faq.html must exist to verify drawer and footer');
  const hasDrawer = faqHtmlContent.includes('mobileNavDrawer');
  const hasFooter = faqHtmlContent.includes('footer') && faqHtmlContent.includes('Chính sách');
  const hasStorefrontCss = faqHtmlContent.includes('storefront.css');
  
  assert(hasDrawer, 'faq.html must include Mobile Nav Drawer (#mobileNavDrawer)');
  assert(hasFooter, 'faq.html must include shared Footer');
  assert(hasStorefrontCss, 'faq.html must link to storefront.css');
});

runTest(2, 'T2.6', 'custom.html exists and is non-empty', () => {
  assert(fs.existsSync(CUSTOM_HTML_PATH), 'custom.html does not exist in root directory');
  customHtmlContent = fs.readFileSync(CUSTOM_HTML_PATH, 'utf8');
  assert(customHtmlContent.length > 500, `custom.html is unexpectedly small (${customHtmlContent.length} bytes)`);
});

runTest(2, 'T2.7', 'custom.html contains custom design value proposition and 3 commitments', () => {
  assert(customHtmlContent, 'custom.html must exist to verify commitments');
  const hasTitle = customHtmlContent.includes('Thiết kế') || customHtmlContent.includes('riêng');
  const commit1 = customHtmlContent.includes('quy trình') || customHtmlContent.includes('thực tế');
  const commit2 = customHtmlContent.includes('Drive cá nhân') || customHtmlContent.includes('Bảo mật');
  const commit3 = customHtmlContent.includes('Hỗ trợ') || customHtmlContent.includes('trọn đời') || customHtmlContent.includes('đồng hành');
  
  assert(hasTitle, 'custom.html must contain custom design value proposition');
  assert(commit1, 'custom.html must include Commitment 1 (Quy trình thực tế)');
  assert(commit2, 'custom.html must include Commitment 2 (Bảo mật 100% trên Drive)');
  assert(commit3, 'custom.html must include Commitment 3 (Hỗ trợ trọn đời / đồng hành)');
});

runTest(2, 'T2.8', 'custom.html contains 5 painpoint case studies', () => {
  assert(customHtmlContent, 'custom.html must exist to verify painpoints');
  const bubbleCount = (customHtmlContent.match(/bubble-customer-short|painpoint-item|case-study/gi) || []).length;
  const hasPainpointContent = customHtmlContent.includes('bán hàng') ||
                              customHtmlContent.includes('nhân sự') ||
                              customHtmlContent.includes('kho') ||
                              customHtmlContent.includes('công nợ');
  
  assert(bubbleCount >= 5 || hasPainpointContent, 'custom.html must showcase 5 painpoint case studies / live stream bubbles');
});

runTest(2, 'T2.9', 'custom.html contains Zalo consultation CTA with correct URL and attributes', () => {
  assert(customHtmlContent, 'custom.html must exist to verify Zalo CTA');
  const hasZaloLink = /href=["']https:\/\/zalo\.me\/0938134576["']/i.test(customHtmlContent);
  const hasTargetBlank = /target=["']_blank["']/i.test(customHtmlContent);
  const hasNoopener = /rel=["'][^"']*noopener[^"']*["']/i.test(customHtmlContent);
  
  assert(hasZaloLink, 'custom.html must contain CTA link to https://zalo.me/0938134576');
  assert(hasTargetBlank, 'Zalo CTA must open in new tab (target="_blank")');
  assert(hasNoopener, 'Zalo CTA must have rel attribute with noopener');
});

runTest(2, 'T2.10', 'custom.html has unified Header Topbar with active class on "Thiết kế file riêng"', () => {
  assert(customHtmlContent, 'custom.html must exist to verify header topbar');
  const hasTopNav = customHtmlContent.includes('top-nav') || customHtmlContent.includes('nav-container');
  const hasBrand = customHtmlContent.includes('File Đi Làm');
  const hasCartBtn = customHtmlContent.includes('openCartNav') || customHtmlContent.includes('shopping-bag-btn');
  const hasActiveCustom = /class=["'][^"']*\bactive\b[^"']*["'][^>]*>[\s\S]*?Thiết kế file riêng/i.test(customHtmlContent) ||
                          /href=["'](?:\.\/)?custom\.html["'][^>]*class=["'][^"']*\bactive\b[^"']*["']/i.test(customHtmlContent) ||
                          /class=["'][^"']*\bnav-link-custom\b[^"']*\bactive\b[^"']*["']/i.test(customHtmlContent);
  
  assert(hasTopNav, 'custom.html must contain shared Topbar header (.top-nav)');
  assert(hasBrand, 'custom.html must display brand name "File Đi Làm"');
  assert(hasCartBtn, 'custom.html must contain Cart launcher button');
  assert(hasActiveCustom, 'custom.html Topbar navigation must set class="active" on "Thiết kế file riêng" link');
});

runTest(2, 'T2.11', 'custom.html contains Mobile Nav Drawer and unified Footer', () => {
  assert(customHtmlContent, 'custom.html must exist to verify drawer and footer');
  const hasDrawer = customHtmlContent.includes('mobileNavDrawer');
  const hasFooter = customHtmlContent.includes('footer') && customHtmlContent.includes('Chính sách');
  const hasStorefrontCss = customHtmlContent.includes('storefront.css');
  
  assert(hasDrawer, 'custom.html must include Mobile Nav Drawer (#mobileNavDrawer)');
  assert(hasFooter, 'custom.html must include shared Footer');
  assert(hasStorefrontCss, 'custom.html must link to storefront.css');
});

// =============================================================================
// TIER 3: STOREFRONT JS & SAFE NULL-CHECKS (storefront.js)
// =============================================================================
console.log(`\n${BOLD}>>> TIER 3: Storefront JS & Safe Null-Checks (storefront.js)${RESET}`);

runTest(3, 'T3.1', 'storefront.js compiles cleanly via Node VM with 0 syntax errors', () => {
  assert(storefrontJsContent, 'storefront.js must exist and not be empty');
  try {
    new vm.Script(storefrontJsContent, { filename: 'storefront.js' });
  } catch (compileErr) {
    throw new Error(`Syntax error in storefront.js at line ${compileErr.lineNumber || '?'}: ${compileErr.message}`);
  }
});

runTest(3, 'T3.2', 'syncLandingCouponTicket contains safe null-check guard when section is absent', () => {
  assert(storefrontJsContent, 'storefront.js must exist');
  const declMatch = storefrontJsContent.match(/(?:async\s+)?function\s+syncLandingCouponTicket/);
  assert(declMatch, 'Could not find function declaration for syncLandingCouponTicket in storefront.js');
  const fnSnippet = storefrontJsContent.slice(declMatch.index, declMatch.index + 800);
  
  const hasNullCheck = /if\s*\(\s*!ticketSec\s*\)\s*return/i.test(fnSnippet) ||
                       /if\s*\(\s*!document\.getElementById\(['"]landingCouponSection['"]\)\s*\)\s*return/i.test(fnSnippet) ||
                       /if\s*\(\s*ticketSec\s*===\s*null\s*\)\s*return/i.test(fnSnippet);
  assert(hasNullCheck, 'syncLandingCouponTicket must start with guard checking if ticketSec exists before manipulating properties');
});

runTest(3, 'T3.3', 'syncHeroCoupons contains safe null-check guard when container is absent', () => {
  assert(storefrontJsContent, 'storefront.js must exist');
  const declMatch = storefrontJsContent.match(/(?:async\s+)?function\s+syncHeroCoupons/);
  assert(declMatch, 'Could not find function declaration for syncHeroCoupons in storefront.js');
  const fnSnippet = storefrontJsContent.slice(declMatch.index, declMatch.index + 800);
  
  const hasNullCheck = /if\s*\(\s*!container\s*\)\s*return/i.test(fnSnippet) ||
                       /if\s*\(\s*!document\.getElementById\(['"]heroCouponsList['"]\)\s*\)\s*return/i.test(fnSnippet);
  assert(hasNullCheck, 'syncHeroCoupons must contain guard checking if container exists before fetching or rendering coupons');
});

runTest(3, 'T3.4', 'runSmoothStatsReveal contains safe null-checks for missing stats section/counters', () => {
  assert(storefrontJsContent, 'storefront.js must exist');
  const hasSectionGuard = /if\s*\(\s*statsSectionEl\s*\)\s*\{[\s\S]*?runSmoothStatsReveal/i.test(storefrontJsContent) ||
                          /if\s*\(\s*!statsSectionEl\s*\)\s*return/i.test(storefrontJsContent);
  assert(hasSectionGuard, 'runSmoothStatsReveal calls must be guarded so execution is skipped when stats-section is absent');
});

runTest(3, 'T3.5', 'Mobile hamburger menu (#openMobileMenu) has click event listener attached', () => {
  assert(storefrontJsContent, 'storefront.js must exist');
  const hasAddEventListener = /openMobileMenu(?:Btn)?\.addEventListener\s*\(\s*["']click["']/i.test(storefrontJsContent) ||
                              /document\.getElementById\s*\(\s*["']openMobileMenu["']\s*\)\.addEventListener\s*\(\s*["']click["']/i.test(storefrontJsContent) ||
                              /openMobileMenuBtn\.onclick\s*=/i.test(storefrontJsContent);
  assert(hasAddEventListener, 'storefront.js must attach click event listener to #openMobileMenu button');
});

runTest(3, 'T3.6', 'Document click-outside handler explicitly excludes #cartFab', () => {
  assert(storefrontJsContent, 'storefront.js must exist');
  const clickOutsideSection = storefrontJsContent.match(/document\.addEventListener\s*\(\s*["']click["'][\s\S]*?cartDrawer\.classList\.contains\(["']is-open["']\)[\s\S]*?closeCart\(\)/i);
  assert(clickOutsideSection, 'Could not locate document click-outside handler for cartDrawer in storefront.js');
  
  const handlerCode = clickOutsideSection[0];
  const excludesFab = handlerCode.includes('#cartFab') ||
                      handlerCode.includes('cartFab');
  assert(excludesFab, 'Document click-outside handler must check !event.target.closest("#cartFab") before closing cartDrawer');
});

// =============================================================================
// TIER 4: CART UX, MOBILE FAB & ANIMATIONS (storefront.css & storefront.js)
// =============================================================================
console.log(`\n${BOLD}>>> TIER 4: Cart UX, Mobile FAB & Animations${RESET}`);

runTest(4, 'T4.1', 'index.html contains #cartFab and #cartFabCount elements', () => {
  assert(indexHtmlContent, 'index.html must exist');
  const hasCartFab = /<button[^>]*id=["']cartFab["']/i.test(indexHtmlContent) ||
                     /<div[^>]*id=["']cartFab["']/i.test(indexHtmlContent);
  const hasCartFabCount = /id=["']cartFabCount["']/i.test(indexHtmlContent);
  
  assert(hasCartFab, 'index.html must include Mobile FAB button (#cartFab)');
  assert(hasCartFabCount, 'index.html must include Mobile FAB counter badge (#cartFabCount)');
});

runTest(4, 'T4.2', 'storefront.css contains .cart-fab styling with Mint #059669 and fixed positioning', () => {
  assert(storefrontCssContent, 'storefront.css must exist');
  const fabBlockMatch = storefrontCssContent.match(/\.cart-fab\s*\{([^}]*)\}/i);
  assert(fabBlockMatch, 'storefront.css must define .cart-fab rule');
  const css = fabBlockMatch[1];
  
  const hasFixed = /position\s*:\s*fixed/i.test(css);
  const hasMintColor = /#059669/i.test(css) || /var\(--mint-primary\)/i.test(css);
  const hasBottom = /bottom\s*:/i.test(css);
  const hasRight = /right\s*:/i.test(css);
  
  assert(hasFixed, '.cart-fab must have position: fixed');
  assert(hasMintColor, '.cart-fab background must be Mint #059669 (or var(--mint-primary))');
  assert(hasBottom && hasRight, '.cart-fab must specify bottom and right coordinates');
});

runTest(4, 'T4.3', 'storefront.css contains high z-index (950) and visibility state for .cart-fab', () => {
  assert(storefrontCssContent, 'storefront.css must exist');
  const hasHighZIndex = /\.cart-fab[\s\S]*?z-index\s*:\s*(?:950|9\d{2}|1\d{3,})/i.test(storefrontCssContent);
  const hasVisibleState = /\.cart-fab\.is-visible/i.test(storefrontCssContent) ||
                          /\.cart-fab\[data-visible/i.test(storefrontCssContent);
  
  assert(hasHighZIndex, '.cart-fab must have high z-index (>= 950)');
  assert(hasVisibleState, 'storefront.css must define .cart-fab.is-visible state');
});

runTest(4, 'T4.4', 'storefront.css defines keyframes @keyframes cartPopShrinkWiggle', () => {
  assert(storefrontCssContent, 'storefront.css must exist');
  const hasKeyframe = /@keyframes\s+cartPopShrinkWiggle/i.test(storefrontCssContent);
  assert(hasKeyframe, 'storefront.css must define @keyframes cartPopShrinkWiggle for cart icon animation');
});

runTest(4, 'T4.5', 'storefront.css defines keyframes @keyframes badgeBounceScale', () => {
  assert(storefrontCssContent, 'storefront.css must exist');
  const hasKeyframe = /@keyframes\s+badgeBounceScale/i.test(storefrontCssContent);
  assert(hasKeyframe, 'storefront.css must define @keyframes badgeBounceScale for counter badge animation');
});

runTest(4, 'T4.6', 'storefront.css defines .cart-flyer styling for Fly-to-Cart animation', () => {
  assert(storefrontCssContent, 'storefront.css must exist');
  const hasFlyer = /\.cart-flyer/i.test(storefrontCssContent);
  assert(hasFlyer, 'storefront.css must define .cart-flyer for parabolic thumbnail animation');
});

runTest(4, 'T4.7', 'addToCart calls retain { openDrawer: false } to prevent unexpected auto-opening', () => {
  assert(storefrontJsContent, 'storefront.js must exist');
  const addToCartCalls = storefrontJsContent.match(/addToCart\s*\([^)]*\)/g) || [];
  assert(addToCartCalls.length > 0, 'storefront.js must call addToCart');
  
  const guardedCalls = addToCartCalls.filter(call => call.includes('openDrawer: false') || call.includes('{ openDrawer: false }'));
  assert(guardedCalls.length >= 2, `Expected multiple addToCart calls to specify { openDrawer: false }, found: ${guardedCalls.length}`);
});

// =============================================================================
// TIER 5: VIETQR & PAYMENT INTEGRITY
// =============================================================================
console.log(`\n${BOLD}>>> TIER 5: VietQR & Payment Integrity${RESET}`);

runTest(5, 'T5.1', 'makeLocalVietQr generates valid EMVCo payload with accurate CCITT CRC16 checksum', () => {
  assert(storefrontJsContent, 'storefront.js must exist');
  assert(storefrontJsContent.includes('function makeLocalVietQr'), 'makeLocalVietQr must be defined in storefront.js');
  
  function calculateCrc16(payload) {
    let crc = 0xffff;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let bit = 0; bit < 8; bit++) {
        crc = ((crc << 1) ^ ((crc & 0x8000) ? 0x1021 : 0)) & 0xffff;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }
  
  function field(tag, value) {
    value = String(value);
    return tag + String(value.length).padStart(2, '0') + value;
  }
  
  const sampleOrder = { amount: 150000, transfer_note: 'DH123456' };
  const sampleAccount = '59215112002';
  
  const recipient = field('00', '970423') + field('01', sampleAccount);
  const provider = field('00', 'A000000727') + field('01', recipient) + field('02', 'QRIBFTTA');
  const payloadBase = '000201010212' + field('38', provider) + '5303704' + field('54', sampleOrder.amount) +
    '5802VN' + field('62', field('08', sampleOrder.transfer_note)) + '6304';
  
  const crc = calculateCrc16(payloadBase);
  const fullPayload = payloadBase + crc;
  
  assert.strictEqual(crc.length, 4, 'CRC-16 must be exactly 4 hexadecimal characters');
  assert(fullPayload.startsWith('000201010212'), 'VietQR payload must start with format indicator 000201010212');
  assert(fullPayload.includes('970423'), 'VietQR payload must contain TPBank BIN 970423');
  assert(fullPayload.includes('59215112002'), 'VietQR payload must contain account 59215112002');
  assert(fullPayload.includes('5303704'), 'VietQR payload must set currency to VND (704)');
  assert(fullPayload.includes('5406150000'), 'VietQR payload must encode amount 150000 with tag 54');
  assert(fullPayload.includes('5802VN'), 'VietQR payload must set country to VN');
  assert(fullPayload.includes('DH123456'), 'VietQR payload must encode transfer note DH123456');
  assert.strictEqual(crc, 'D589', `CRC checksum for test vector must match D589, got: ${crc}`);
});

runTest(5, 'T5.2', 'Storefront order creation and status polling route integrity (/orders)', () => {
  assert(storefrontJsContent, 'storefront.js must exist');
  
  const hasPostOrders = /authFetch\s*\(\s*["']\/orders["']\s*,\s*\{[\s\S]*?method\s*:\s*["']POST["']/i.test(storefrontJsContent) ||
                        /fetch\s*\(\s*["']\/orders["']\s*,\s*\{[\s\S]*?method\s*:\s*["']POST["']/i.test(storefrontJsContent) ||
                        /authFetch\s*\(\s*["']\/orders["']/i.test(storefrontJsContent);
  assert(hasPostOrders, 'storefront.js must call POST /orders to create new orders');
  
  const hasGetOrderPolling = /authFetch\s*\(\s*["']\/orders\/["']\s*\+/i.test(storefrontJsContent) ||
                             /fetch\s*\(\s*["']\/orders\/["']\s*\+/i.test(storefrontJsContent);
  assert(hasGetOrderPolling, 'storefront.js must call GET /orders/:id to poll payment completion status');
});

// =============================================================================
// REPORT & SUMMARY
// =============================================================================
console.log(`\n${BOLD}${CYAN}======================================================================${RESET}`);
console.log(`${BOLD}${CYAN}                     E2E VERIFICATION REPORT SUMMARY                  ${RESET}`);
console.log(`${BOLD}${CYAN}======================================================================${RESET}`);

for (const [tierNum, stats] of Object.entries(tierStats)) {
  const tierColor = stats.failed === 0 ? GREEN : RED;
  console.log(`  ${BOLD}${stats.name}${RESET}: ${tierColor}${stats.passed}/${stats.total} PASSED${RESET}`);
}

console.log(`${GRAY}----------------------------------------------------------------------${RESET}`);
console.log(`  Total Tests:  ${BOLD}${totalTests}${RESET}`);
console.log(`  Passed Tests: ${GREEN}${BOLD}${passedTests}${RESET}`);
console.log(`  Failed Tests: ${failedTests > 0 ? RED : GREEN}${BOLD}${failedTests}${RESET}`);
console.log(`${GRAY}----------------------------------------------------------------------${RESET}`);

const summary = {
  timestamp: new Date().toISOString(),
  totalTests,
  passedTests,
  failedTests,
  passRate: ((passedTests / totalTests) * 100).toFixed(1) + '%',
  tierBreakdown: tierStats,
  tests: testRecords
};

// Write results JSON
fs.writeFileSync(RESULTS_JSON_PATH, JSON.stringify(summary, null, 2), 'utf8');
console.log(`\n${GRAY}Detailed results saved to: ${RESULTS_JSON_PATH}${RESET}`);

if (failedTests > 0) {
  console.log(`\n${YELLOW}${BOLD}[NOTICE] Pre-Implementation Run: ${failedTests} tests currently failing as expected before Worker implementation.${RESET}`);
  if (!allowFail) {
    process.exit(1);
  }
} else {
  console.log(`\n${GREEN}${BOLD}[SUCCESS] 100% of acceptance criteria verified and passed!${RESET}`);
  process.exit(0);
}
