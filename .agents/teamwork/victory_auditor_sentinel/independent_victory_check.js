const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');

if (!fs.existsSync(targetPath)) {
  console.error(`TARGET NOT FOUND: ${targetPath}`);
  process.exit(1);
}

const html = fs.readFileSync(targetPath, 'utf8');
console.log(`Auditing target: ${targetPath} (${html.length} bytes, ${html.split('\n').length} lines)`);

const results = [];
function check(phase, id, title, condition, details = '') {
  const passed = Boolean(condition);
  results.push({ phase, id, title, passed, details });
  const mark = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${phase}] ${mark} [${id}] ${title}${details ? ` -> ${details}` : ''}`);
}

// ----------------------------------------------------
// PHASE A: TIMELINE & PROVENANCE AUDIT
// ----------------------------------------------------
const stat = fs.statSync(targetPath);
const isRecent = (Date.now() - stat.mtimeMs) < 24 * 3600 * 1000;
check('PHASE-A', 'A1-PROVENANCE', 'nourishgroup.html exists and was modified during current session',
  isRecent && stat.size > 50000,
  `Size: ${stat.size} bytes, Modified: ${stat.mtime.toISOString()}`);

// ----------------------------------------------------
// PHASE B: FORENSIC INTEGRITY & ANTI-CHEATING
// ----------------------------------------------------
// B1: No fabricated test assertions or mock victory strings in production file
const fakeTestStrings = ['TEST_PASSED', 'ALL_TESTS_PASS', '__MOCK_VICTORY__', 'ASSERTION_OK', 'dummy_implementation'];
const foundFake = fakeTestStrings.filter(s => html.includes(s));
check('PHASE-B', 'B1-NO-FAKE-MARKERS', 'No fabricated test markers or mock assertions',
  foundFake.length === 0, foundFake.join(', '));

// B2: Facade detection - substantial genuine HTML document
const hasDoctype = /<!DOCTYPE\s+html>/i.test(html);
const hasHead = /<head[\s>]/i.test(html) && /<\/head>/i.test(html);
const hasBody = /<body[\s>]/i.test(html) && /<\/body>/i.test(html);
const hasHeader = /<header\b[^>]*>/i.test(html);
const hasFooter = /<footer\b[^>]*>/i.test(html);
const isSubstantial = html.length > 50000 && html.split('\n').length > 1500;
check('PHASE-B', 'B2-GENUINE-PAGE', 'Substantial genuine HTML structure (>50KB, >1500 lines)',
  hasDoctype && hasHead && hasBody && hasHeader && hasFooter && isSubstantial,
  `size: ${html.length}B, lines: ${html.split('\n').length}`);

// B3: Prohibited emojis (AGENTS.md Rule 2: ⚡, ✨, 🔑, 🟢, ⏳, ⚠️, ➔)
const prohibitedEmojis = ['⚡', '✨', '🔑', '🟢', '⏳', '⚠️', '➔'];
const foundForbidden = prohibitedEmojis.filter(emoji => html.includes(emoji));
check('PHASE-B', 'B3-NO-PROHIBITED-EMOJIS', 'Zero prohibited emojis (AGENTS.md Rule 2)',
  foundForbidden.length === 0, foundForbidden.join(', '));

// B4: Decorative emojis in text nodes (clean SVG vector icons preferred)
const stripped = html
  .replace(/[\u0000-\u007F]/g, '')
  .replace(/[\u00C0-\u024F\u1EA0-\u1EF9]/g, '');
const nonStdSet = new Set(stripped);
const nonStdArr = Array.from(nonStdSet);
// Allowed unicode non-ASCII: ✓ (U+2713), – (U+2013), © (U+00A9)
const disallowedUnicode = nonStdArr.filter(c => !['✓', '–', '©'].includes(c));
check('PHASE-B', 'B4-CLEAN-ICONS', 'Clean vector SVG icons, zero decorative emoji characters',
  disallowedUnicode.length === 0,
  disallowedUnicode.length > 0 ? `Disallowed: ${disallowedUnicode.join(' ')}` : 'Clean (only ✓, –, ©)');

// B5: HTML tag balance (zero unclosed or mismatched tags)
const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const tagRegex = /<\/?([a-zA-Z0-9]+)(\s+[^>]*)?>/g;
const stack = [];
let tMatch;
let tagMismatch = null;
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
      tagMismatch = `Unexpected </${tagName}> at index ${tMatch.index}`;
      break;
    }
    const top = stack.pop();
    if (top.tagName !== tagName) {
      tagMismatch = `Mismatched <${top.tagName}> closed by </${tagName}> at index ${tMatch.index}`;
      break;
    }
  }
}
check('PHASE-B', 'B5-HTML-TAG-BALANCE', 'HTML tags properly nested and closed',
  !tagMismatch && stack.length === 0,
  tagMismatch || `Stack length: ${stack.length}`);

// B6: CSS brace balance
const styleMatches = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)];
const fullCss = styleMatches.map(m => m[1]).join('\n');
const openBraces = (fullCss.match(/{/g) || []).length;
const closeBraces = (fullCss.match(/}/g) || []).length;
check('PHASE-B', 'B6-CSS-SYNTAX-BALANCE', 'CSS syntax balanced (open/close braces match)',
  openBraces > 0 && openBraces === closeBraces,
  `open: ${openBraces}, close: ${closeBraces}`);

// B7: Inline JS syntax and real logic
const scriptMatches = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
const inlineScripts = scriptMatches.map(m => m[1]).filter(s => s.trim().length > 0);
let jsSyntaxOk = true;
let jsSyntaxError = null;
try {
  inlineScripts.forEach((code) => {
    new Function(code);
  });
} catch (e) {
  jsSyntaxOk = false;
  jsSyntaxError = e.message;
}
check('PHASE-B', 'B7-JS-SYNTAX-VALIDITY', 'JavaScript syntax valid with genuine clipboard logic',
  jsSyntaxOk && inlineScripts.length > 0,
  jsSyntaxError || `${inlineScripts.length} valid inline script(s)`);

// B8: Link security on target="_blank"
const blankLinks = [...html.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)];
const insecureLinks = blankLinks.filter(l => !l[0].includes('rel="noopener noreferrer"') && !l[0].includes("rel='noopener noreferrer'"));
check('PHASE-B', 'B8-LINK-SECURITY', 'All target="_blank" links include rel="noopener noreferrer"',
  insecureLinks.length === 0 && blankLinks.length > 0,
  `Total target="_blank": ${blankLinks.length}, Insecure: ${insecureLinks.length}`);

// B9: Accessibility: aria-label on input elements
const searchInputs = [...html.matchAll(/<input\b[^>]*>/gi)];
const accessibleInputs = searchInputs.filter(i => /aria-label=/i.test(i[0]));
check('PHASE-B', 'B9-ACCESSIBILITY-ARIA', 'Inputs have accessible aria-label attributes',
  accessibleInputs.length === searchInputs.length,
  `Accessible: ${accessibleInputs.length}/${searchInputs.length}`);


// ----------------------------------------------------
// PHASE C: REQUIREMENTS VERIFICATION
// ----------------------------------------------------

// --- R1: Typography & Visual Tokens ---
// C1: Manrope font loaded from Google Fonts with weights 400, 500, 600
const manropeLink = /fonts\.googleapis\.com\/css2\?[^"']*family=Manrope:wght@400;500;600/i.test(html);
check('PHASE-C', 'C1-MANROPE-FONT-LINK', 'Google Fonts link loads Manrope strictly with weights 400, 500, 600', manropeLink);

// C2: Font token --font-main specifies Manrope and sans-serif fallback
const fontTokenMatch = /--font-main:\s*['"]Manrope['"],\s*-apple-system,\s*BlinkMacSystemFont,\s*sans-serif;/i.test(fullCss);
check('PHASE-C', 'C2-FONT-MAIN-TOKEN', 'Token --font-main specifies Manrope with sans-serif fallback stack', fontTokenMatch);

// C3: Color hierarchy: Primary #181925, Secondary text #666666, Answer body #333333
const colorTextToken = /--text:\s*#181925;/i.test(fullCss);
const colorMutedToken = /--muted:\s*#666666;/i.test(fullCss);
const colorAnswerToken = /--answer-body:\s*#333333;/i.test(fullCss);
check('PHASE-C', 'C3-COLOR-HIERARCHY', 'Color hierarchy tokens (--text #181925, --muted #666666, --answer-body #333333)',
  colorTextToken && colorMutedToken && colorAnswerToken,
  `text:${colorTextToken}, muted:${colorMutedToken}, answer:${colorAnswerToken}`);

// C4: Headings max weight 600, body weight 400
const headingsReset = /h1,\s*h2,\s*h3,\s*h4,\s*h5,\s*h6[^{]*\{[^}]*font-weight:\s*600;/is.test(fullCss);
const bodyWeight400 = /body\s*\{[^}]*font-weight:\s*400;/is.test(fullCss);
check('PHASE-C', 'C4-HEADINGS-AND-BODY-WEIGHT', 'Headings reset font-weight to 600 max, body to 400',
  headingsReset && bodyWeight400,
  `headings(600):${headingsReset}, body(400):${bodyWeight400}`);

// C5: Maximum 600 across ALL font-weight declarations in stylesheet and inline styles
const allWeightMatches = [...html.matchAll(/font-weight\s*:\s*([^;}\s]+)/gi)].map(m => m[1].toLowerCase());
const heavyWeights = allWeightMatches.filter(w => {
  const n = parseInt(w, 10);
  if (!isNaN(n)) return n > 600;
  return ['bold', 'bolder', 'black'].includes(w);
});
check('PHASE-C', 'C5-NO-WEIGHT-OVER-600', 'No font-weight exceeds 600 anywhere in document',
  heavyWeights.length === 0,
  heavyWeights.length > 0 ? `Found: ${heavyWeights.join(', ')}` : `Zero heavy weights (Scanned ${allWeightMatches.length} declarations)`);

// C6: Pills and nav links styled with weight 500
const navLinkWeight500 = /\.nav-links\s+\.active\s*\{[^}]*font-weight:\s*500/i.test(fullCss) &&
                         /\.nav-links\s+a\s*\{[^}]*font-weight:\s*500/i.test(fullCss);
const ticketPillWeight500 = /\.ticket-code-pill\s*\{[^}]*font-weight:\s*500/i.test(fullCss);
const sheetTabWeight500 = /\.sheet-tab\.active\s*\{[^}]*font-weight:\s*500/i.test(fullCss);
check('PHASE-C', 'C6-PILLS-NAV-WEIGHT-500', 'Pills, tabs, and nav links styled with weight 500',
  navLinkWeight500 && ticketPillWeight500 && sheetTabWeight500,
  `navLinks:${navLinkWeight500}, ticketPill:${ticketPillWeight500}, sheetTab:${sheetTabWeight500}`);

// C7: Precise letter-spacing: H1 -1.385px, H2 -1.03px, body -0.1px, stats -1.003px
const lsBody = /body\s*\{[^}]*letter-spacing:\s*-0\.1px;/is.test(fullCss);
const lsH1 = /h1\s*\{[^}]*letter-spacing:\s*-1\.385px;/is.test(fullCss);
const lsH2 = /h2\s*\{[^}]*letter-spacing:\s*-1\.03px;/is.test(fullCss);
const lsStats = /\.stat-number\s*\{[^}]*letter-spacing:\s*-1\.003px;/is.test(fullCss);
check('PHASE-C', 'C7-PRECISE-LETTER-SPACING', 'Letter spacing tokens (H1 -1.385px, H2 -1.03px, body -0.1px, stats -1.003px)',
  lsBody && lsH1 && lsH2 && lsStats,
  `body:${lsBody}, h1:${lsH1}, h2:${lsH2}, stats:${lsStats}`);

// --- R2: De-cardification & Flat Canvas Layout ---
// C8: FAQ borderless flat items with p.faq-question (18px, 600, #181925) and p.faq-answer (16px, #333333, 25.6px)
const faqItemBorderless = /\.faq-item\s*\{[^}]*background:\s*transparent;[^}]*border:\s*none;/is.test(fullCss);
const faqQuestionCSS = /\.faq-question\s*\{[^}]*font-size:\s*18px;[^}]*font-weight:\s*600;[^}]*color:\s*#181925;/is.test(fullCss);
const faqAnswerCSS = /\.faq-answer\s*\{[^}]*font-size:\s*16px;[^}]*color:\s*#333333;[^}]*line-height:\s*25\.6px;/is.test(fullCss);
const faqQuestionsP = [...html.matchAll(/<p\s+class=["']faq-question["']/gi)].length;
const faqAnswersP = [...html.matchAll(/<p\s+class=["']faq-answer["']/gi)].length;
check('PHASE-C', 'C8-FAQ-FLAT-SPEC', 'FAQ: Clean borderless flat items, p.faq-question & p.faq-answer',
  faqItemBorderless && faqQuestionCSS && faqAnswerCSS && faqQuestionsP >= 4 && faqAnswersP >= 4,
  `borderless:${faqItemBorderless}, qCSS:${faqQuestionCSS}, aCSS:${faqAnswerCSS}, count:${faqQuestionsP}/${faqAnswersP}`);

// C9: Stats strip: Borderless flat columns with 26.4px numbers (600, -1.003px) and 13.5px captions
const statCardBorderless = /\.stat-card\s*\{[^}]*background:\s*transparent;[^}]*border:\s*none;/is.test(fullCss);
const statNumberCSS = /\.stat-number\s*\{[^}]*font-size:\s*26\.4px;[^}]*font-weight:\s*600;[^}]*letter-spacing:\s*-1\.003px;/is.test(fullCss);
const statLabelCSS = /\.stat-label\s*\{[^}]*font-size:\s*13\.5px;[^}]*color:\s*var\(--muted\);/is.test(fullCss);
check('PHASE-C', 'C9-STATS-STRIP-SPEC', 'Stats strip: borderless columns, 26.4px numbers, 13.5px captions',
  statCardBorderless && statNumberCSS && statLabelCSS,
  `borderless:${statCardBorderless}, number:${statNumberCSS}, label:${statLabelCSS}`);

// C10: Custom service banner: 24px radius, 118deg gradient, 52px 48px padding, border none
const bannerCSS = /\.custom-banner\s*\{[^}]*background:\s*linear-gradient\(118deg,\s*rgb\(228,\s*231,\s*245\)\s*0%,\s*rgb\(240,\s*253,\s*244\)\s*100%\);[^}]*border:\s*none;[^}]*border-radius:\s*24px;[^}]*padding:\s*52px\s+48px;/is.test(fullCss);
check('PHASE-C', 'C10-CUSTOM-BANNER-SPEC', 'Custom service banner: 24px radius, 118deg gradient, 52px 48px padding, border none',
  bannerCSS);

// C11: Voucher ticket: flat #f5f5f5, 24px radius, no outer border, dashed button 2px dashed #6a5ae0
const ticketCSS = /\.coupon-ticket\s*\{[^}]*background:\s*#f5f5f5;[^}]*border:\s*none;[^}]*border-radius:\s*24px;/is.test(fullCss);
const ticketBtnCSS = /\.ticket-copy-btn\s*\{[^}]*border:\s*2px\s+dashed\s+#6a5ae0;/is.test(fullCss);
check('PHASE-C', 'C11-VOUCHER-TICKET-SPEC', 'Voucher ticket: #f5f5f5, 24px radius, border none, 2px dashed #6a5ae0 button',
  ticketCSS && ticketBtnCSS,
  `ticket:${ticketCSS}, button:${ticketBtnCSS}`);

// C12: Social channels: flat minimalist strip without bloated box cards
const socialCardBorderless = /\.social-card\s*\{[^}]*background:\s*transparent;[^}]*border:\s*none;/is.test(fullCss);
const socialStripCSS = /\.social-strip\s*\{/i.test(fullCss);
check('PHASE-C', 'C12-SOCIAL-CHANNELS-FLAT', 'Social channels: flat minimalist strip (border none, background transparent)',
  socialCardBorderless && socialStripCSS,
  `borderless:${socialCardBorderless}, strip:${socialStripCSS}`);

// --- R3: Fluid Micro-Animations & Interactions ---
// C13: Step 1 animation: Smooth 3-item file selection cycle with #22c55e light green badge accent
const step1Keyframe1 = /@keyframes\s+selectItem1/i.test(fullCss);
const step1Keyframe2 = /@keyframes\s+selectItem2/i.test(fullCss);
const step1Keyframe3 = /@keyframes\s+selectItem3/i.test(fullCss);
const step1HasGreenAccent = fullCss.includes('#22c55e');
check('PHASE-C', 'C13-STEP1-ANIMATION', 'Step 1: Smooth 3-item file selection cycle with #22c55e accent',
  step1Keyframe1 && step1Keyframe2 && step1Keyframe3 && step1HasGreenAccent,
  `keyframes: 1=${step1Keyframe1}, 2=${step1Keyframe2}, 3=${step1Keyframe3}, green=${step1HasGreenAccent}`);

// C14: Step 2 animation: SVG vector QR code with laser beam scan effect (#2563eb) and glowing overlay
const qrSVG = html.includes('<svg class="qr-matrix-svg"');
const laserBeam = /\.qr-laser-beam\s*\{[^}]*background:\s*#2563eb;/is.test(fullCss);
const laserGlow = /\.qr-laser-glow\s*\{[^}]*background:\s*linear-gradient/is.test(fullCss);
const laserAnim = /@keyframes\s+scanLaserCycle/i.test(fullCss);
check('PHASE-C', 'C14-STEP2-ANIMATION', 'Step 2: SVG vector QR code, #2563eb laser beam scan effect and glowing overlay',
  qrSVG && laserBeam && laserGlow && laserAnim,
  `svg:${qrSVG}, beam:${laserBeam}, glow:${laserGlow}, anim:${laserAnim}`);

// C15: Step 3 animation: Notification card with slide-up copy link pill (#15803d on #f0fdf4)
const pillRuleMatch = html.match(/\.file-pill-incoming\s*\{([^}]*)\}/is);
const pillRule = pillRuleMatch && pillRuleMatch[1].includes('color: #15803d') && pillRuleMatch[1].includes('background: #f0fdf4');
const pillAnim = /@keyframes\s+slideUpCopyLink/i.test(fullCss);
check('PHASE-C', 'C15-STEP3-ANIMATION', 'Step 3: Notification card with slide-up copy link pill (#15803d on #f0fdf4)',
  pillRule && pillAnim,
  `pillRule:${pillRule}, anim:${pillAnim}`);

// C16: Animation performance & smoothness: GPU layer promotion / composite hints
const willChange = /will-change:\s*[^;]+/i.test(fullCss);
const translateZ = /transform:\s*translateZ\(0\)/i.test(fullCss);
check('PHASE-C', 'C16-ANIMATION-PERFORMANCE', 'CSS animations include GPU composite hints (will-change & translateZ(0))',
  willChange && translateZ,
  `willChange:${willChange}, translateZ:${translateZ}`);

// C17: Interactive elements: copyVoucherCode with re-entrant click race condition guard
const copyVoucherFunc = /function\s+copyVoucherCode/i.test(html);
const raceConditionGuard = /btn\._copyTimer\s*=\s*setTimeout|btn\.dataset\.origText/i.test(html);
const fallbackCopyFunc = /function\s+fallbackCopy/i.test(html);
check('PHASE-C', 'C17-VOUCHER-INTERACTION', 'Voucher copy interaction implemented with race condition guards and safe mobile fallback',
  copyVoucherFunc && raceConditionGuard && fallbackCopyFunc,
  `copyFunc:${copyVoucherFunc}, raceGuard:${raceConditionGuard}, fallback:${fallbackCopyFunc}`);

// ----------------------------------------------------
// SUMMARY
// ----------------------------------------------------
const total = results.length;
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;

console.log(`\n====================================================`);
console.log(`VICTORY AUDIT SUMMARY: ${passed}/${total} CHECKS PASSED, ${failed} FAILED`);
console.log(`====================================================`);

if (failed > 0) {
  console.log('VERDICT: VICTORY REJECTED');
  process.exit(1);
} else {
  console.log('VERDICT: VICTORY CONFIRMED');
  process.exit(0);
}
