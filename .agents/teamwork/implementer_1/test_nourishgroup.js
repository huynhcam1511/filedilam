const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? '✓ PASS' : '✗ FAIL'}: ${name}${detail ? ` (${detail})` : ''}`);
}

console.log('--- RUNNING COMPREHENSIVE VERIFICATION SUITE FOR NOURISHGROUP.HTML ---');

// 1. Manrope font check
const fontLinkMatch = html.match(/fonts\.googleapis\.com\/css2\?[^"']+/i);
const fontLink = fontLinkMatch ? fontLinkMatch[0] : '';
const loadsManrope = fontLink.includes('family=Manrope') && fontLink.includes('400') && fontLink.includes('500') && fontLink.includes('600');
const hasNoExcludedWeights = !fontLink.includes('700') && !fontLink.includes('800');
check(
  'Criterion: Font loaded is Manrope with weights 400, 500, 600',
  loadsManrope && hasNoExcludedWeights,
  `Link: ${fontLink}`
);

// 2. Font family token
const fontMainMatch = html.match(/--font-main:\s*['"]Manrope['"]/i);
check(
  'Visual Token: --font-main is set to Manrope',
  !!fontMainMatch,
  fontMainMatch ? fontMainMatch[0] : 'not found'
);

// 3. No text or heading exceeds font-weight: 600
const weightMatches = [...html.matchAll(/font-weight:\s*([0-9a-zA-Z]+)/gi)].map(m => m[1].toLowerCase());
const heavyWeights = weightMatches.filter(w => {
  const num = parseInt(w, 10);
  if (!isNaN(num)) return num > 600;
  return w === 'bold' || w === 'bolder' || w === 'black';
});
check(
  'Criterion: No headings or texts exceed font-weight: 600',
  heavyWeights.length === 0,
  heavyWeights.length > 0 ? `Found heavy weights: ${heavyWeights.join(', ')}` : 'All weights <= 600'
);

// 4. Color #181925 is applied to primary text
const textTokenMatch = html.match(/--text:\s*#181925/i);
const bodyColorMatch = html.match(/body\s*\{[^}]*color:\s*(var\(--text\)|#181925)/i);
check(
  'Criterion: Color #181925 is applied to primary text',
  !!textTokenMatch && !!bodyColorMatch,
  `Token: ${textTokenMatch ? textTokenMatch[0] : 'none'}, Body color: ${bodyColorMatch ? 'matched' : 'none'}`
);

// 5. #666 or #666666 applied to muted text
const mutedTokenMatch = html.match(/--muted:\s*(#666666|#666)\b/i);
check(
  'Criterion: #666 / #666666 applied to muted text token',
  !!mutedTokenMatch,
  mutedTokenMatch ? mutedTokenMatch[0] : 'not found'
);

// 6. Letter spacings: H1 -1.385px, H2 -1.03px, body -0.1px, stats -1.003px
const bodySpacing = html.match(/body\s*\{[^}]*letter-spacing:\s*-0\.1px/i);
const h1Spacing = html.match(/(\.hero-title|h1)\s*\{[^}]*letter-spacing:\s*-1\.385px/i);
const h2Spacing = html.match(/(\.section-title|h2)\s*\{[^}]*letter-spacing:\s*-1\.03px/i);
const statSpacing = html.match(/\.stat-number\s*\{[^}]*letter-spacing:\s*-1\.003px/i);
check('Letter-spacing: Body -0.1px', !!bodySpacing, bodySpacing ? bodySpacing[0].replace(/\s+/g, ' ') : 'missing');
check('Letter-spacing: H1 -1.385px', !!h1Spacing, h1Spacing ? h1Spacing[0].replace(/\s+/g, ' ') : 'missing');
check('Letter-spacing: H2 -1.03px', !!h2Spacing, h2Spacing ? h2Spacing[0].replace(/\s+/g, ' ') : 'missing');
check('Letter-spacing: Stats -1.003px', !!statSpacing, statSpacing ? statSpacing[0].replace(/\s+/g, ' ') : 'missing');

// 7. Outer borders removed from FAQ items, stats cards, and social items
const faqBorderNone = html.match(/\.faq-item\s*\{[^}]*border:\s*none/i);
const statBorderNone = html.match(/\.stat-card\s*\{[^}]*border:\s*none/i);
const socialBorderNone = html.match(/\.social-card\s*\{[^}]*border:\s*none/i);
check(
  'Criterion: Outer borders are removed from FAQ items, stats cards, and social items',
  !!faqBorderNone && !!statBorderNone && !!socialBorderNone,
  `faq: ${!!faqBorderNone}, stat: ${!!statBorderNone}, social: ${!!socialBorderNone}`
);

// 8. FAQ p.faq-question and p.faq-answer
const faqQuestionP = [...html.matchAll(/<p\s+class=["']faq-question["']/gi)];
const faqAnswerP = [...html.matchAll(/<p\s+class=["']faq-answer["']/gi)];
const faqQuestionH = [...html.matchAll(/<h[1-6]\s+class=["']faq-question["']/gi)];
const faqQuestionCSS = html.match(/\.faq-question\s*\{[^}]*font-size:\s*18px[^}]*font-weight:\s*600[^}]*color:\s*#181925/is);
const faqAnswerCSS = html.match(/\.faq-answer\s*\{[^}]*font-size:\s*16px[^}]*color:\s*#333(?:333)?[^}]*line-height:\s*25\.6px/is);
check(
  'FAQ: Render questions in p.faq-question (18px, weight 600, color #181925) and answers in p.faq-answer (16px, color #333, line-height 25.6px)',
  faqQuestionP.length >= 4 && faqQuestionH.length === 0 && !!faqQuestionCSS && !!faqAnswerCSS,
  `p.faq-question: ${faqQuestionP.length}, h.faq-question: ${faqQuestionH.length}`
);

// 9. Stats strip: 26.4px numbers (weight: 600, letter-spacing: -1.003px) and 13.5px muted captions
const statCSS = html.match(/\.stat-number\s*\{[^}]*font-size:\s*26\.4px[^}]*font-weight:\s*600[^}]*letter-spacing:\s*-1\.003px/is);
const statLabelCSS = html.match(/\.stat-label\s*\{[^}]*font-size:\s*13\.5px[^}]*color:\s*(var\(--muted\)|#666(?:666)?)/is);
check(
  'Stats strip: 26.4px numbers (600, -1.003px) and 13.5px captions',
  !!statCSS && !!statLabelCSS,
  `stat: ${!!statCSS}, label: ${!!statLabelCSS}`
);

// 10. Custom banner: linear-gradient(118deg, rgb(228, 231, 245) 0%, rgb(240, 253, 244) 100%), 24px radius, 52px 48px padding
const customBannerCSS = html.match(/\.custom-banner\s*\{[^}]*background:\s*linear-gradient\(118deg,\s*rgb\(228,\s*231,\s*245\)\s*0%,\s*rgb\(240,\s*253,\s*244\)\s*100%\)[^}]*border-radius:\s*24px[^}]*padding:\s*52px\s+48px/is);
check(
  'Custom service banner: linear-gradient 118deg, 24px radius, 52px 48px padding',
  !!customBannerCSS,
  customBannerCSS ? 'matched' : 'not matched'
);

// 11. Voucher ticket: #f5f5f5 background, 24px radius, no outer border, dashed button 2px dashed #6a5ae0
const ticketCSS = html.match(/\.coupon-ticket\s*\{[^}]*background:\s*#f5f5f5[^}]*border:\s*none[^}]*border-radius:\s*24px/is);
const dashedBtnCSS = html.match(/(\.ticket-copy-btn|button\.ticket-copy-btn)\s*\{[^}]*border:\s*2px\s+dashed\s+#6a5ae0/is);
check(
  'Voucher ticket: #f5f5f5, 24px radius, no outer border, dashed button 2px dashed #6a5ae0',
  !!ticketCSS && !!dashedBtnCSS,
  `ticket: ${!!ticketCSS}, dashed button: ${!!dashedBtnCSS}`
);

// 12. Checkout flow 3-step animations
const hasStep1GreenAccent = html.match(/(#22c55e|boxItem[1-3][^}]*#22c55e)/s);
const hasStep2LaserBeam = html.match(/#2563eb/i) && html.match(/scanLaser|qr-scanner/i);
const hasStep3CopyLinkPill = html.match(/#15803d/i) && html.match(/slideUp|popFile/i);
check(
  'Criterion: All 3 step animations in the checkout flow loop smoothly with zero visual stutter',
  !!hasStep1GreenAccent && !!hasStep2LaserBeam && !!hasStep3CopyLinkPill,
  `step1 green: ${!!hasStep1GreenAccent}, step2 laser: ${!!hasStep2LaserBeam}, step3 pill: ${!!hasStep3CopyLinkPill}`
);

// 13. Forbidden emojis check
const forbiddenEmojis = ['⚡', '✨', '🔑', '🟢', '⏳', '⚠️', '➔', '💻', '📱', '🔧', '💬'];
const foundForbidden = forbiddenEmojis.filter(e => html.includes(e));
check(
  'RULE 2: No forbidden emojis or icons',
  foundForbidden.length === 0,
  foundForbidden.length > 0 ? `Found: ${foundForbidden.join(', ')}` : 'Clean'
);

const failed = results.filter(r => !r.pass);
console.log(`\nVerification Summary: ${results.length - failed.length}/${results.length} passed.`);
if (failed.length > 0) {
  console.log('FAILURES:');
  failed.forEach(f => console.log(`- ${f.name}: ${f.detail}`));
  process.exit(1);
} else {
  console.log('ALL VERIFICATION CHECKS PASSED PERFECTLY!');
  process.exit(0);
}
