const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../../../nourishgroup.html');
if (!fs.existsSync(filePath)) {
  console.error('CRITICAL: nourishgroup.html does not exist at ' + filePath);
  process.exit(1);
}

const html = fs.readFileSync(filePath, 'utf8');

const auditResults = [];
let passCount = 0;
let failCount = 0;

function audit(section, testId, description, condition, evidence) {
  const passed = Boolean(condition);
  if (passed) {
    passCount++;
  } else {
    failCount++;
  }
  auditResults.push({
    section,
    testId,
    description,
    status: passed ? 'PASS' : 'FAIL',
    evidence: evidence || (passed ? 'Verified' : 'Verification failed')
  });
}

// ==========================================
// PHASE B: FORENSIC INTEGRITY CHECKS
// ==========================================

// Check 1: No hardcoded test results / verification banners embedded
const hasEmbeddedTestBanners = /TEST\s+SUITE|ALL\s+VERIFICATION\s+CHECKS\s+PASSED|ADVERSARIAL\s+REVIEWER/i.test(html);
audit('Integrity', 'INT-1', 'No hardcoded test suite banners or results in nourishgroup.html', !hasEmbeddedTestBanners, `Found test banners: ${hasEmbeddedTestBanners}`);

// Check 2: Facade check - page must be substantial (>20KB, >500 lines) with genuine DOM nodes
const isSubstantial = html.length > 30000 && html.split('\n').length > 1000;
audit('Integrity', 'INT-2', 'Page is substantial genuine implementation (>30KB, >1000 lines)', isSubstantial, `Length: ${html.length} bytes, Lines: ${html.split('\n').length}`);

// Check 3: Tag balancing check (Well-formed HTML DOM)
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
audit('Integrity', 'INT-3', 'HTML tags properly nested and closed', !tagMismatch && stack.length === 0, tagMismatch || `Remaining unclosed: ${stack.length}`);

// Check 4: Anti-pattern check - RULE 2 forbidden emojis & icons
const forbidden = ['⚡', '✨', '🔑', '🟢', '⏳', '⚠️', '➔'];
const foundForbidden = forbidden.filter(ch => html.includes(ch));
audit('Integrity', 'INT-4', 'RULE 2 Compliance: Zero forbidden emojis (⚡, ✨, 🔑, 🟢, ⏳, ⚠️, ➔)', foundForbidden.length === 0, `Found: ${foundForbidden.join(', ')}`);

// ==========================================
// PHASE C: INDEPENDENT REQUIREMENT AUDIT
// ==========================================

// --- R1. Manrope Typography & Visual Tokens Alignment ---
// R1.1: Font loaded is Manrope with weights 400, 500, 600 from Google Fonts
const fontHrefMatch = html.match(/<link[^>]*href=["']([^"']*fonts\.googleapis\.com\/css2\?[^"']+)["'][^>]*>/i);
const fontHref = fontHrefMatch ? fontHrefMatch[1] : '';
const loadsManropeCorrectly = fontHref.includes('family=Manrope:wght@400;500;600') && !fontHref.includes('700') && !fontHref.includes('800');
audit('R1-Typography', 'R1-1', 'Google Fonts link loads Manrope strictly with weights 400, 500, 600', loadsManropeCorrectly, `Font URL: ${fontHref}`);

// R1.2: Fallback sans-serif in --font-main
const fontTokenMatch = html.match(/--font-main:\s*['"]Manrope['"],\s*-apple-system,\s*BlinkMacSystemFont,\s*sans-serif;/i);
audit('R1-Typography', 'R1-2', 'Primary font token --font-main has Manrope and sans-serif fallback', Boolean(fontTokenMatch), fontTokenMatch ? fontTokenMatch[0] : 'Missing');

// R1.3: Color hierarchy: Primary #181925, Secondary text #666666, Answer body #333333
const textToken = html.match(/--text:\s*#181925;/i);
const mutedToken = html.match(/--muted:\s*#666666;/i);
const answerBodyToken = html.match(/--answer-body:\s*#333333;/i);
audit('R1-Typography', 'R1-3', 'Color hierarchy tokens (--text #181925, --muted #666666, --answer-body #333333)', Boolean(textToken && mutedToken && answerBodyToken), `text: ${Boolean(textToken)}, muted: ${Boolean(mutedToken)}, answer-body: ${Boolean(answerBodyToken)}`);

// R1.4: Font weights: Maximum 600 for headings, 500 for pills/nav links, 400 for body text. Zero > 600.
const headingsReset = html.match(/h1,\s*h2,\s*h3,\s*h4,\s*h5,\s*h6[^{]*\{[^}]*font-weight:\s*600;/is);
const bodyWeight = html.match(/body\s*\{[^}]*font-weight:\s*400;/is);
audit('R1-Typography', 'R1-4a', 'Headings reset font-weight to 600 max, body to 400', Boolean(headingsReset && bodyWeight), `Headings: ${Boolean(headingsReset)}, Body: ${Boolean(bodyWeight)}`);

// Scan every font-weight across CSS and inline style attributes
const allWeightDeclarations = [...html.matchAll(/font-weight\s*:\s*([0-9a-zA-Z]+)/gi)].map(m => m[1].toLowerCase());
const heavyWeights = allWeightDeclarations.filter(w => {
  const n = parseInt(w, 10);
  if (!isNaN(n)) return n > 600;
  return ['bold', 'bolder', 'black'].includes(w);
});
audit('R1-Typography', 'R1-4b', 'No headings or texts exceed font-weight: 600 anywhere (eliminate heavy 700/800)', heavyWeights.length === 0, heavyWeights.length > 0 ? `Found: ${heavyWeights.join(', ')}` : 'Zero heavy weights');

// Verify pills and nav links are weight 500
const navLinkActive = html.match(/\.nav-links\s+\.active\s*\{[^}]*font-weight:\s*500/i);
const ticketPill = html.match(/\.ticket-code-pill\s*\{[^}]*font-weight:\s*500/i);
audit('R1-Typography', 'R1-4c', 'Pills and nav links set to font-weight: 500', Boolean(navLinkActive && ticketPill), `nav-link: ${Boolean(navLinkActive)}, ticket-pill: ${Boolean(ticketPill)}`);

// R1.5: Letter spacings: H1 -1.385px, H2 -1.03px, body -0.1px, stats -1.003px
const bodySpacing = html.match(/body\s*\{[^}]*letter-spacing:\s*-0\.1px;/is);
const h1Spacing = html.match(/h1\s*\{[^}]*letter-spacing:\s*-1\.385px;/is);
const h2Spacing = html.match(/h2\s*\{[^}]*letter-spacing:\s*-1\.03px;/is);
const statSpacing = html.match(/\.stat-number\s*\{[^}]*letter-spacing:\s*-1\.003px;/is);
audit('R1-Typography', 'R1-5', 'Precise letter-spacings (H1 -1.385px, H2 -1.03px, body -0.1px, stats -1.003px)', Boolean(bodySpacing && h1Spacing && h2Spacing && statSpacing), `body: ${Boolean(bodySpacing)}, h1: ${Boolean(h1Spacing)}, h2: ${Boolean(h2Spacing)}, stats: ${Boolean(statSpacing)}`);

// --- R2. De-cardification & Flat Canvas Layout ---
// R2.1: FAQ
const faqItemRule = html.match(/\.faq-item\s*\{([^}]*)\}/is);
const faqItemBorder = faqItemRule && faqItemRule[1].includes('border: none') && faqItemRule[1].includes('background: transparent');
const faqQuestionP = [...html.matchAll(/<p\s+class=["']faq-question["']/gi)].length;
const faqAnswerP = [...html.matchAll(/<p\s+class=["']faq-answer["']/gi)].length;
const faqQuestionCSS = html.match(/\.faq-question\s*\{[^}]*font-size:\s*18px;[^}]*font-weight:\s*600;[^}]*color:\s*#181925;/is);
const faqAnswerCSS = html.match(/\.faq-answer\s*\{[^}]*font-size:\s*16px;[^}]*color:\s*(var\(--answer-body\)|#333333);[^}]*line-height:\s*25\.6px;/is);
audit('R2-FlatLayout', 'R2-1', 'FAQ: Clean borderless flat items, p.faq-question (18px, 600, #181925), p.faq-answer (16px, #333333, 25.6px)', Boolean(faqItemBorder && faqQuestionP >= 4 && faqAnswerP >= 4 && faqQuestionCSS && faqAnswerCSS), `border-none: ${Boolean(faqItemBorder)}, p-count: ${faqQuestionP}/${faqAnswerP}, styles: ${Boolean(faqQuestionCSS && faqAnswerCSS)}`);

// R2.2: Stats strip: Borderless flat columns with 26.4px numbers (600, -1.003px) and 13.5px muted captions
const statCardRule = html.match(/\.stat-card\s*\{([^}]*)\}/is);
const statCardCSS = statCardRule && statCardRule[1].includes('border: none') && statCardRule[1].includes('background: transparent');
const statNumberCSS = html.match(/\.stat-number\s*\{[^}]*font-size:\s*26\.4px;[^}]*font-weight:\s*600;[^}]*letter-spacing:\s*-1\.003px;/is);
const statLabelCSS = html.match(/\.stat-label\s*\{[^}]*font-size:\s*13\.5px;[^}]*color:\s*var\(--muted\);/is);
audit('R2-FlatLayout', 'R2-2', 'Stats strip: borderless flat columns, 26.4px numbers (600, -1.003px), 13.5px captions', Boolean(statCardCSS && statNumberCSS && statLabelCSS), `card: ${Boolean(statCardCSS)}, number: ${Boolean(statNumberCSS)}, label: ${Boolean(statLabelCSS)}`);

// R2.3: Custom service banner: 24px rounded block, linear-gradient(118deg, rgb(228, 231, 245) 0%, rgb(240, 253, 244) 100%), 52px 48px padding, no harsh dark borders
const customBannerCSS = html.match(/\.custom-banner\s*\{[^}]*background:\s*linear-gradient\(118deg,\s*rgb\(228,\s*231,\s*245\)\s*0%,\s*rgb\(240,\s*253,\s*244\)\s*100%\);[^}]*border:\s*none;[^}]*border-radius:\s*24px;[^}]*padding:\s*52px\s+48px;/is);
audit('R2-FlatLayout', 'R2-3', 'Custom service banner: 24px radius, 52px 48px padding, gradient, border none', Boolean(customBannerCSS), customBannerCSS ? 'Matches specification' : 'Not matched');

// R2.4: Voucher ticket: flat #f5f5f5, 24px radius, no outer border, dashed button 2px dashed #6a5ae0
const ticketCSS = html.match(/\.coupon-ticket\s*\{[^}]*background:\s*#f5f5f5;[^}]*border:\s*none;[^}]*border-radius:\s*24px;/is);
const ticketBtnCSS = html.match(/\.ticket-copy-btn\s*\{[^}]*border:\s*2px\s+dashed\s+#6a5ae0;/is);
audit('R2-FlatLayout', 'R2-4', 'Voucher ticket: #f5f5f5, 24px radius, no outer border, dashed button 2px dashed #6a5ae0', Boolean(ticketCSS && ticketBtnCSS), `ticket: ${Boolean(ticketCSS)}, button: ${Boolean(ticketBtnCSS)}`);

// R2.5: Social channels: flat minimalist strip without bloated box cards
const socialCardRule = html.match(/\.social-card\s*\{([^}]*)\}/is);
const socialCardCSS = socialCardRule && socialCardRule[1].includes('border: none') && socialCardRule[1].includes('background: transparent');
audit('R2-FlatLayout', 'R2-5', 'Social channels: flat minimalist list/strip (border none, background transparent)', Boolean(socialCardCSS), socialCardCSS ? 'Flat borderless' : 'Not found');

// --- R3. Fluid Micro-Animations & Interactions ---
// R3.1: Step 1: Smooth 3-item file selection cycle with authentic light green badge accent (#22c55e)
const step1Keyframe1 = html.match(/@keyframes\s+selectItem1\s*\{([\s\S]*?)\n\s*\}/i);
const step1Keyframe2 = html.match(/@keyframes\s+selectItem2\s*\{([\s\S]*?)\n\s*\}/i);
const step1Keyframe3 = html.match(/@keyframes\s+selectItem3\s*\{([\s\S]*?)\n\s*\}/i);
const step1HasGreenAccent = html.includes('#22c55e');
audit('R3-Animations', 'R3-1', 'Step 1: Smooth 3-item file selection cycle with #22c55e green accent and keyframes', Boolean(step1Keyframe1 && step1Keyframe2 && step1Keyframe3 && step1HasGreenAccent), `Keyframes: 1=${Boolean(step1Keyframe1)}, 2=${Boolean(step1Keyframe2)}, 3=${Boolean(step1Keyframe3)}, accent #22c55e=${step1HasGreenAccent}`);

// R3.2: Step 2: SVG vector QR code with laser beam scan effect (#2563eb) and glowing overlay
const qrSVG = html.includes('<svg class="qr-matrix-svg"');
const laserBeam = html.match(/\.qr-laser-beam\s*\{[^}]*background:\s*#2563eb;/is);
const laserGlow = html.match(/\.qr-laser-glow\s*\{[^}]*background:\s*linear-gradient/is);
const laserAnim = html.match(/@keyframes\s+scanLaserCycle/i);
audit('R3-Animations', 'R3-2', 'Step 2: SVG vector QR code, #2563eb laser beam scan effect and glowing overlay', Boolean(qrSVG && laserBeam && laserGlow && laserAnim), `svg: ${qrSVG}, beam: ${Boolean(laserBeam)}, glow: ${Boolean(laserGlow)}, anim: ${Boolean(laserAnim)}`);

// R3.3: Step 3: Notification card with slide-up copy link pill (#15803d)
const pillRule = html.match(/\.file-pill-incoming\s*\{([^}]*)\}/is);
const pillColor = pillRule && pillRule[1].includes('color: #15803d') && pillRule[1].includes('background: #f0fdf4');
const pillAnim = html.match(/@keyframes\s+slideUpCopyLink/i);
audit('R3-Animations', 'R3-3', 'Step 3: Notification card with slide-up copy link pill (#15803d on #f0fdf4)', Boolean(pillColor && pillAnim), `pill: ${Boolean(pillColor)}, anim: ${Boolean(pillAnim)}`);

// R3.4: Looping smoothness - start and end keyframes align to prevent visual stutter
const laserStart = html.match(/@keyframes\s+scanLaserCycle\s*\{[^}]*0%\s*\{[^}]*opacity:\s*0/is);
const laserEnd = html.match(/@keyframes\s+scanLaserCycle\s*\{[\s\S]*100%\s*\{[^}]*opacity:\s*0/is);
audit('R3-Animations', 'R3-4', 'Animation loops match 0% and 100% boundary states with zero visual stutter', Boolean(laserStart && laserEnd), `laser boundary loop aligned: ${Boolean(laserStart && laserEnd)}`);

// ==========================================
// OUTPUT INDEPENDENT AUDIT SUMMARY
// ==========================================
console.log('====================================================');
console.log('       INDEPENDENT VICTORY AUDITOR REPORT           ');
console.log('====================================================');
auditResults.forEach(r => {
  const symbol = r.status === 'PASS' ? '✓' : '✗';
  console.log(`[${r.section}] [${r.testId}] ${symbol} ${r.status}: ${r.description}`);
  if (r.status === 'FAIL') {
    console.log(`    Evidence: ${r.evidence}`);
  }
});
console.log('----------------------------------------------------');
console.log(`Summary: ${passCount} PASSED, ${failCount} FAILED out of ${auditResults.length} total checks.`);
if (failCount > 0) {
  console.log('VERDICT: VICTORY REJECTED');
  process.exit(1);
} else {
  console.log('VERDICT: VICTORY CONFIRMED');
  process.exit(0);
}
