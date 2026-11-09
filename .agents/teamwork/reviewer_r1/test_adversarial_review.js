const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

console.log('====================================================');
console.log('   ADVERSARIAL REVIEWER TEST SUITE (TEAMWORK QA)   ');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;
const failures = [];

function test(description, passed, details = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`[PASS] ${description}`);
  } else {
    failures.push({ description, details });
    console.error(`[FAIL] ${description} -> ${details}`);
  }
}

// ----------------------------------------------------
// SECTION 1: R1 TYPOGRAPHY & VISUAL TOKENS ALIGNMENT
// ----------------------------------------------------
console.log('\n--- R1: Typography & Tokens ---');

// 1. Manrope font link
const fontLink = html.match(/fonts\.googleapis\.com\/css2\?[^"']+/i);
test(
  'Google Fonts link loads Manrope with weights 400, 500, 600 only',
  fontLink &&
    fontLink[0].includes('family=Manrope') &&
    fontLink[0].includes('400') &&
    fontLink[0].includes('500') &&
    fontLink[0].includes('600') &&
    !fontLink[0].includes('700') &&
    !fontLink[0].includes('800'),
  `Link: ${fontLink ? fontLink[0] : 'missing'}`
);

// 2. CSS variables
test('Token --font-main specifies Manrope and fallback sans-serif',
  /--font-main:\s*['"]Manrope['"],\s*-apple-system,\s*BlinkMacSystemFont,\s*sans-serif/i.test(html)
);
test('Token --text is #181925', /--text:\s*#181925/i.test(html));
test('Token --muted is #666666', /--muted:\s*#666666/i.test(html));
test('Token --answer-body is #333333', /--answer-body:\s*#333333/i.test(html));

// 3. Precise Letter Spacings
test('Body letter-spacing is -0.1px', /body\s*\{[^}]*letter-spacing:\s*-0\.1px/i.test(html));
test('H1 base letter-spacing is -1.385px', /h1\s*\{[^}]*letter-spacing:\s*-1\.385px/i.test(html));
test('H2 base letter-spacing is -1.03px', /h2\s*\{[^}]*letter-spacing:\s*-1\.03px/i.test(html));
test('Stat number letter-spacing is -1.003px', /\.stat-number\s*\{[^}]*letter-spacing:\s*-1\.003px/i.test(html));

// 4. Font Weights Hierarchy
test('Headings reset max weight is 600', /h1,\s*h2,\s*h3,\s*h4,\s*h5,\s*h6\s*\{[^}]*font-weight:\s*600/i.test(html));
test('Body font-weight is 400', /body\s*\{[^}]*font-weight:\s*400/i.test(html));

// Check pills and nav links: all MUST be <= 500
const navActiveWeight = html.match(/\.nav-links\s+\.active\s*\{[^}]*font-weight:\s*([0-9]+)/i);
test('Nav links active font-weight is 500 (not 600)',
  navActiveWeight && parseInt(navActiveWeight[1], 10) === 500,
  `Actual: ${navActiveWeight ? navActiveWeight[1] : 'not found'}`
);

const ticketPillWeight = html.match(/\.ticket-code-pill\s*\{[^}]*font-weight:\s*([0-9]+)/i);
test('Ticket code pill font-weight is 500 (not 600)',
  ticketPillWeight && parseInt(ticketPillWeight[1], 10) === 500,
  `Actual: ${ticketPillWeight ? ticketPillWeight[1] : 'not found'}`
);

const navBtnWeight = html.match(/\.search-btn,\s*\.cart-btn\s*\{[^}]*font-weight:\s*([0-9]+)/i);
test('Nav actions buttons font-weight is 500',
  navBtnWeight && parseInt(navBtnWeight[1], 10) === 500,
  `Actual: ${navBtnWeight ? navBtnWeight[1] : 'not found'}`
);

// Verify no text anywhere exceeds 600
const allWeights = [...html.matchAll(/font-weight:\s*([0-9a-zA-Z]+)/gi)].map(m => m[1].toLowerCase());
const heavyWeights = allWeights.filter(w => {
  const n = parseInt(w, 10);
  if (!isNaN(n)) return n > 600;
  return ['bold', 'bolder', 'black'].includes(w);
});
test('Zero occurrences of font-weight > 600 in CSS or inline styles',
  heavyWeights.length === 0,
  `Found heavy weights: ${heavyWeights.join(', ')}`
);

// ----------------------------------------------------
// SECTION 2: R2 DE-CARDIFICATION & FLAT CANVAS LAYOUT
// ----------------------------------------------------
console.log('\n--- R2: De-cardification & Flat Canvas ---');

// FAQ
test('FAQ questions use <p class="faq-question"> (18px, weight 600, color #181925)',
  /\.faq-question\s*\{[^}]*font-size:\s*18px[^}]*font-weight:\s*600[^}]*color:\s*#181925/is.test(html) &&
  [...html.matchAll(/<p\s+class=["']faq-question["']/g)].length >= 4 &&
  ![...html.matchAll(/<h[1-6]\s+class=["']faq-question["']/g)].length
);
test('FAQ answers use <p class="faq-answer"> (16px, color #333333, line-height 25.6px, weight 400)',
  /\.faq-answer\s*\{[^}]*font-size:\s*16px[^}]*color:\s*(var\(--answer-body\)|#333(?:333)?)[^}]*line-height:\s*25\.6px[^}]*font-weight:\s*400/is.test(html) &&
  [...html.matchAll(/<p\s+class=["']faq-answer["']/g)].length >= 4
);
test('FAQ items have border: none and background: transparent (borderless flat surface)',
  /\.faq-item\s*\{[^}]*background:\s*transparent[^}]*border:\s*none/is.test(html)
);

// Stats strip
test('Stat items have border: none and background: transparent',
  /\.stat-card\s*\{[^}]*background:\s*transparent[^}]*border:\s*none/is.test(html)
);
test('Stat numbers are 26.4px, weight 600, letter-spacing -1.003px',
  /\.stat-number\s*\{[^}]*font-size:\s*26\.4px[^}]*font-weight:\s*600[^}]*letter-spacing:\s*-1\.003px/is.test(html)
);
test('Stat captions are 13.5px with muted color',
  /\.stat-label\s*\{[^}]*font-size:\s*13\.5px[^}]*color:\s*var\(--muted\)/is.test(html)
);

// Custom service banner
test('Custom service banner has 24px border-radius, border: none, and 52px 48px padding',
  /\.custom-banner\s*\{[^}]*background:\s*linear-gradient\(118deg,\s*rgb\(228,\s*231,\s*245\)\s*0%,\s*rgb\(240,\s*253,\s*244\)\s*100%\)[^}]*border:\s*none[^}]*border-radius:\s*24px[^}]*padding:\s*52px\s+48px/is.test(html)
);

// Voucher ticket
test('Voucher ticket has #f5f5f5 background, 24px border-radius, and border: none',
  /\.coupon-ticket\s*\{[^}]*background:\s*#f5f5f5[^}]*border:\s*none[^}]*border-radius:\s*24px/is.test(html)
);
test('Voucher ticket copy button has 2px dashed #6a5ae0 border',
  /\.ticket-copy-btn\s*\{[^}]*border:\s*2px\s+dashed\s+#6a5ae0/is.test(html)
);

// Social strip
test('Social strip cards have border: none and background: transparent',
  /\.social-card\s*\{[^}]*background:\s*transparent[^}]*border:\s*none/is.test(html)
);

// Responsive edge cases
const mq900 = html.match(/@media\s*\(max-width:\s*900px\)\s*\{([\s\S]*?)\n\s*\}\s*@media/i);
test('Responsive media query adapts ticket dashed border for mobile (stacked single column)',
  mq900 && mq900[1].includes('.ticket-left') && mq900[1].includes('border-right: none') && mq900[1].includes('border-bottom: 2px dashed #e2e8f0'),
  `Found: ${mq900 ? mq900[1].substring(0, 100) : 'none'}`
);
test('Responsive media query adds mobile padding for 640px screens',
  /@media\s*\(max-width:\s*640px\)\s*\{[^}]*\.custom-banner\s*\{[^}]*padding:\s*36px\s+20px/is.test(html)
);

// ----------------------------------------------------
// SECTION 3: R3 FLUID MICRO-ANIMATIONS
// ----------------------------------------------------
console.log('\n--- R3: Micro-Animations & Loops ---');

// Step 1: 3-item file selection cycle with #22c55e light green badge accent
test('Step 1: File selection cycle keyframes exist and use #22c55e',
  html.includes('@keyframes selectItem1') &&
  html.includes('@keyframes boxItem1') &&
  html.includes('#22c55e')
);
test('Step 1: Item 1 keyframe loops seamlessly (0% matches 100%)',
  html.includes('0%, 28% {\n        background: #f0fdf4;\n        border-color: #86efac;\n        box-shadow: 0 2px 8px rgba(34, 197, 94, 0.12);\n      }') &&
  html.includes('100% {\n        background: #f0fdf4;\n        border-color: #86efac;\n        box-shadow: 0 2px 8px rgba(34, 197, 94, 0.12);\n      }')
);

// Step 2: SVG vector QR code with laser beam scan effect (#2563eb)
test('Step 2: SVG vector QR code is present with viewBox and modules',
  html.includes('<svg class="qr-matrix-svg"') && html.includes('stroke="#181925"')
);
test('Step 2: Laser beam scan line uses #2563eb and glowing gradient',
  /\.qr-laser-beam\s*\{[^}]*background:\s*#2563eb/is.test(html) &&
  /\.qr-laser-glow\s*\{[^}]*background:\s*linear-gradient/is.test(html)
);
test('Step 2: scanLaserCycle keyframes animate scan with 0% opacity at loop boundaries',
  /0%\s*\{[^}]*opacity:\s*0/i.test(html) && /100%\s*\{[^}]*opacity:\s*0/i.test(html)
);

// Step 3: Notification card with slide-up copy link pill (#15803d)
test('Step 3: Notification card and slide-up copy link pill styled with #15803d and #f0fdf4',
  /\.file-pill-incoming\s*\{[^}]*background:\s*#f0fdf4[^}]*color:\s*#15803d/is.test(html)
);
test('Step 3: Copy link pill uses authentic SVG vector sheet icon instead of raw character glyph',
  /<div\s+class="file-pill-incoming">\s*<svg\s+width="14"\s+height="14"/is.test(html) &&
  !/<div\s+class="file-pill-incoming">\s*<span[^>]*>⊞<\/span>/is.test(html)
);

// ----------------------------------------------------
// SECTION 4: RULE 2 COMPLIANCE & TAG BALANCING
// ----------------------------------------------------
console.log('\n--- RULE 2 Compliance & Integrity ---');

const forbidden = ['⚡', '✨', '🔑', '🟢', '⏳', '⚠️', '➔', '⊞', '▷', '▾'];
const foundForbidden = forbidden.filter(ch => html.includes(ch));
test('Zero forbidden emojis or raw glyphs in markup (⚡, ✨, 🔑, 🟢, ⏳, ⚠️, ➔, ⊞, ▷, ▾)',
  foundForbidden.length === 0,
  `Found: ${foundForbidden.join(', ')}`
);

// Tag nesting stack validation
const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const tagRegex = /<\/?([a-zA-Z0-9]+)(\s+[^>]*)?>/g;
const stack = [];
let tMatch;
let tagError = null;
while ((tMatch = tagRegex.exec(html)) !== null) {
  const full = tMatch[0];
  const tagName = tMatch[1].toLowerCase();
  const isClosing = full.startsWith('</');
  const isSelfClosing = full.endsWith('/>') || voidTags.has(tagName);
  if (isSelfClosing) continue;
  if (!isClosing) {
    stack.push({ tagName, index: tMatch.index });
  } else {
    if (stack.length === 0) {
      tagError = `Unexpected </${tagName}> at index ${tMatch.index}`;
      break;
    }
    const top = stack.pop();
    if (top.tagName !== tagName) {
      tagError = `Mismatched <${top.tagName}> at ${top.index} closed by </${tagName}> at ${tMatch.index}`;
      break;
    }
  }
}
test('HTML structure is 100% properly nested and closed',
  !tagError && stack.length === 0,
  tagError || `Unclosed tags: ${stack.map(s => s.tagName).join(', ')}`
);

console.log('\n====================================================');
console.log(`Results: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
if (failures.length > 0) {
  console.log('FAILURES:');
  failures.forEach(f => console.log(`  - ${f.description}: ${f.details}`));
  process.exit(1);
} else {
  console.log('STATUS: ALL ADVERSARIAL QA CHECKS PASSED WITH ZERO FAILURES!');
  process.exit(0);
}
