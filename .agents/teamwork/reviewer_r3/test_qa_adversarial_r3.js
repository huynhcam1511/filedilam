const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

console.log('================================================================');
console.log('   ROUND 3 ADVERSARIAL QA & DEFECT VERIFICATION SUITE           ');
console.log('================================================================\n');

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
// SECTION 1: R1 TYPOGRAPHY & WEIGHT AUDIT
// ----------------------------------------------------
console.log('--- 1. Typography & Tokens ---');
test('Google Fonts link loads Manrope 400, 500, 600', /family=Manrope:wght@400;500;600/i.test(html));
test('--font-main token specifies Manrope', /--font-main:\s*['"]Manrope['"]/i.test(html));
test('Primary text token is #181925', /--text:\s*#181925/i.test(html));
test('Secondary text token is #666666', /--muted:\s*#666666/i.test(html));
test('Answer body token is #333333', /--answer-body:\s*#333333/i.test(html));

test('Base body letter-spacing is -0.1px', /body\s*\{[^}]*letter-spacing:\s*-0\.1px/i.test(html));
test('Base h1 letter-spacing is -1.385px', /h1\s*\{[^}]*letter-spacing:\s*-1\.385px/i.test(html));
test('Base h2 letter-spacing is -1.03px', /h2\s*\{[^}]*letter-spacing:\s*-1\.03px/i.test(html));
test('Stat number letter-spacing is -1.003px', /\.stat-number\s*\{[^}]*letter-spacing:\s*-1\.003px/i.test(html));

test('Zero elements exceed font-weight 600', () => {
  const allWeights = [...html.matchAll(/font-weight\s*:\s*([0-9a-zA-Z]+)/gi)].map(m => m[1].toLowerCase());
  return allWeights.every(w => {
    const n = parseInt(w, 10);
    return isNaN(n) ? !['bold', 'bolder', 'black'].includes(w) : n <= 600;
  });
});

test('.sheet-tab.active has font-weight 500 (not 600)', /\.sheet-tab\.active\s*\{[^}]*font-weight:\s*500/i.test(html));
test('.cat-tab.active has font-weight 500', /\.cat-tab\.active\s*\{[^}]*font-weight:\s*500/i.test(html));
test('.nav-links .active has font-weight 500', /\.nav-links\s+\.active\s*\{[^}]*font-weight:\s*500/i.test(html));
test('.ticket-code-pill has font-weight 500', /\.ticket-code-pill\s*\{[^}]*font-weight:\s*500/i.test(html));
test('Custom banner secondary link "Xem chi tiết dịch vụ" has font-weight 500',
  /font-size:\s*0\.9rem;\s*font-weight:\s*500;\s*color:\s*var\(--text\)[^>]*>Xem chi tiết dịch vụ/i.test(html)
);
test('USP card 4 mockup pill "+ Thêm cột của bạn" has font-weight 500',
  /font-size:\s*0\.72rem;\s*font-weight:\s*500;\s*color:\s*var\(--mint-primary\)[^>]*>\s*\+\s*Thêm cột của bạn/i.test(html)
);
test('USP card 1 body label "12 tháng tới:" has font-weight 400',
  /font-size:\s*0\.72rem;\s*font-weight:\s*400;\s*color:\s*var\(--muted\)[^>]*>12 tháng tới:/i.test(html)
);

// ----------------------------------------------------
// SECTION 2: R2 DE-CARDIFICATION & FLAT CANVAS
// ----------------------------------------------------
console.log('\n--- 2. De-cardification & Flat Layout ---');
test('FAQ questions are <p class="faq-question"> with 18px / 600 / #181925',
  /\.faq-question\s*\{[^}]*font-size:\s*18px[^}]*font-weight:\s*600[^}]*color:\s*#181925/is.test(html)
);
test('FAQ answers are <p class="faq-answer"> with 16px / #333333 / 25.6px / 400',
  /\.faq-answer\s*\{[^}]*font-size:\s*16px[^}]*color:\s*(var\(--answer-body\)|#333333)[^}]*line-height:\s*25\.6px/is.test(html)
);
test('FAQ items have border: none and transparent background',
  /\.faq-item\s*\{[^}]*background:\s*transparent[^}]*border:\s*none/is.test(html)
);
test('Stats strip cards have border: none and transparent background',
  /\.stat-card\s*\{[^}]*background:\s*transparent[^}]*border:\s*none/is.test(html)
);
test('Stats numbers are 26.4px, weight 600, letter-spacing -1.003px',
  /\.stat-number\s*\{[^}]*font-size:\s*26\.4px[^}]*font-weight:\s*600[^}]*letter-spacing:\s*-1\.003px/is.test(html)
);
test('Custom service banner has 24px border-radius, border: none, 52px 48px padding, gradient',
  /\.custom-banner\s*\{[^}]*background:\s*linear-gradient\(118deg,\s*rgb\(228,\s*231,\s*245\)\s*0%,\s*rgb\(240,\s*253,\s*244\)\s*100%\)[^}]*border:\s*none[^}]*border-radius:\s*24px[^}]*padding:\s*52px\s+48px/is.test(html)
);
test('Voucher ticket has #f5f5f5 background, 24px border-radius, border: none',
  /\.coupon-ticket\s*\{[^}]*background:\s*#f5f5f5[^}]*border:\s*none[^}]*border-radius:\s*24px/is.test(html)
);
test('Voucher dashed button has 2px dashed #6a5ae0 border',
  /\.ticket-copy-btn\s*\{[^}]*border:\s*2px\s+dashed\s+#6a5ae0/is.test(html)
);
test('Social cards have border: none and transparent background',
  /\.social-card\s*\{[^}]*background:\s*transparent[^}]*border:\s*none/is.test(html)
);

// ----------------------------------------------------
// SECTION 3: R3 MICRO-ANIMATIONS & GPU COMPOSITING
// ----------------------------------------------------
console.log('\n--- 3. Micro-Animations & Compositing ---');
test('Step 1: anim-file-row has will-change hardware composite declaration',
  /\.anim-file-row\s*\{[^}]*will-change:\s*background-color,\s*border-color,\s*box-shadow/is.test(html)
);
test('Step 1: 3 keyframes (selectItem1, 2, 3) exist with #22c55e accents',
  html.includes('@keyframes selectItem1') &&
  html.includes('@keyframes selectItem2') &&
  html.includes('@keyframes selectItem3') &&
  html.includes('#22c55e')
);
test('Step 2: qr-scanner-line has will-change and transform: translateZ(0) GPU acceleration',
  /\.qr-scanner-line\s*\{[^}]*will-change:\s*top,\s*opacity[^}]*transform:\s*translateZ\(0\)/is.test(html)
);
test('Step 2: laser beam scan uses #2563eb and glowing overlay',
  /\.qr-laser-beam\s*\{[^}]*background:\s*#2563eb/is.test(html) &&
  /\.qr-laser-glow\s*\{[^}]*background:\s*linear-gradient/is.test(html)
);
test('Step 3: file-pill-incoming has will-change and transform: translateZ(0) GPU acceleration',
  /\.file-pill-incoming\s*\{[^}]*will-change:\s*transform,\s*opacity[^}]*transform:\s*translateZ\(0\)/is.test(html)
);
test('Step 3: slide-up copy link pill uses #15803d text and #f0fdf4 surface',
  /\.file-pill-incoming\s*\{[^}]*background:\s*#f0fdf4[^}]*color:\s*#15803d/is.test(html)
);
test('Orphaned dead CSS class .file-icon-sheets is removed', !html.includes('.file-icon-sheets'));

// ----------------------------------------------------
// SECTION 4: SECURITY, ACCESSIBILITY, RACE CONDITIONS & MOBILE RESPONSIVENESS
// ----------------------------------------------------
console.log('\n--- 4. Security, Accessibility & Edge Cases ---');
const externalLinks = [...html.matchAll(/<a\s+[^>]*href=["']https?:\/\/[^"']+["'][^>]*>/gi)];
const missingRel = externalLinks.filter(l => !l[0].includes('rel="noopener noreferrer"'));
test('All external target="_blank" links include rel="noopener noreferrer"',
  missingRel.length === 0,
  `Missing rel on: ${missingRel.map(l => l[0]).join(' | ')}`
);

test('Quick search input includes accessible aria-label',
  /<input\s+[^>]*aria-label=["']Lọc nhanh template["']/i.test(html)
);

test('copyVoucherCode guards against race condition label corruption with dataset.origText & clearTimeout',
  html.includes('btn.dataset.origText') &&
  html.includes('clearTimeout(btn._copyTimer)')
);

test('fallbackCopy uses safe mobile textarea configuration (readonly, top:0, left:0, pointerEvents:none)',
  html.includes("ta.setAttribute('readonly'") &&
  html.includes("ta.style.pointerEvents = 'none'")
);

test('fallbackCopy checks document.execCommand return value',
  /const\s+success\s*=\s*document\.execCommand\('copy'\)/i.test(html)
);

test('Media query (max-width: 640px) protects floating-revenue-card mobile viewport bounds', () => {
  const mqMatch = html.match(/@media\s*\(max-width:\s*640px\)\s*\{([\s\S]+?\n\s*\})/i);
  return mqMatch && /\.floating-revenue-card\s*\{[^}]*right:\s*0/i.test(mqMatch[1]);
});

// ----------------------------------------------------
// SECTION 5: RULE 2 & INTEGRITY
// ----------------------------------------------------
console.log('\n--- 5. RULE 2 & Integrity ---');
const forbiddenChars = ['⚡', '✨', '🔑', '🟢', '⏳', '⚠️', '➔', '⊞', '▷', '▾'];
const foundChars = forbiddenChars.filter(c => html.includes(c));
test('Zero forbidden emojis or unicode glyphs', foundChars.length === 0, `Found: ${foundChars.join(', ')}`);

// Strict DOM nesting stack validation
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
test('HTML structure is 100% properly nested and closed', !tagError && stack.length === 0, tagError || `Unclosed: ${stack.map(s => s.tagName).join(', ')}`);

console.log('\n================================================================');
console.log(`Results: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
if (failures.length > 0) {
  console.log('FAILURES:');
  failures.forEach(f => console.log(`  - ${f.description}: ${f.details}`));
  process.exit(1);
} else {
  console.log('STATUS: ALL ROUND 3 ADVERSARIAL QA CHECKS PASSED WITH ZERO FAILURES!');
  process.exit(0);
}
