const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

console.log('--- RUNNING DEEP VERIFICATION ON NOURISHGROUP.HTML ---');

let failureCount = 0;
function assert(desc, condition, detail = '') {
  if (condition) {
    console.log(`[PASS] ${desc}`);
  } else {
    console.error(`[FAIL] ${desc} :: ${detail}`);
    failureCount++;
  }
}

// 1. Tag matching check (void tags excluded)
const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const tagRegex = /<\/?([a-zA-Z0-9]+)(\s+[^>]*)?>/g;
const stack = [];
let match;
while ((match = tagRegex.exec(html)) !== null) {
  const full = match[0];
  const tagName = match[1].toLowerCase();
  const isClosing = full.startsWith('</');
  const isSelfClosing = full.endsWith('/>') || voidTags.has(tagName);

  if (isSelfClosing) continue;

  if (!isClosing) {
    stack.push({ tagName, index: match.index });
  } else {
    if (stack.length === 0) {
      assert('Tag balancing', false, `Unexpected closing tag </${tagName}> at index ${match.index}`);
    } else {
      const top = stack.pop();
      if (top.tagName !== tagName) {
        assert('Tag balancing', false, `Mismatched tags: opened <${top.tagName}> at ${top.index}, closed with </${tagName}> at ${match.index}`);
      }
    }
  }
}
assert('All HTML tags correctly nested and closed', stack.length === 0, `Unclosed tags: ${stack.map(s => s.tagName).join(', ')}`);

// 2. Headings font weight check
const headingStylesInCSS = html.match(/h1,\s*h2,\s*h3,\s*h4,\s*h5,\s*h6\s*\{[^}]*font-weight:\s*600/i);
assert('CSS resets all headings to maximum font-weight 600', !!headingStylesInCSS);

// 3. Check all inline styles for font-weight
const inlineStyles = [...html.matchAll(/style=["']([^"']*)["']/gi)];
const heavyInlineWeights = [];
inlineStyles.forEach(s => {
  const fw = s[1].match(/font-weight:\s*([0-9a-zA-Z]+)/i);
  if (fw) {
    const val = fw[1];
    const n = parseInt(val, 10);
    if (!isNaN(n) && n > 600) heavyInlineWeights.push(val);
    if (val === 'bold' || val === 'bolder' || val === 'black') heavyInlineWeights.push(val);
  }
});
assert('No inline style specifies font-weight > 600', heavyInlineWeights.length === 0, heavyInlineWeights.join(', '));

// 4. Color checks: #181925, #666666, #333333
assert('Primary color #181925 is set', html.includes('--text: #181925'));
assert('Secondary color #666666 is set', html.includes('--muted: #666666'));
assert('Body answer color #333333 is set', html.includes('--answer-body: #333333') && html.includes('color: #333333'));

// 5. Letter spacing checks
assert('H1 letter-spacing -1.385px', html.includes('letter-spacing: -1.385px'));
assert('H2 letter-spacing -1.03px', html.includes('letter-spacing: -1.03px'));
assert('Body letter-spacing -0.1px', html.includes('letter-spacing: -0.1px'));
assert('Stats letter-spacing -1.003px', html.includes('letter-spacing: -1.003px'));

// 6. Section borders checks
// FAQ
const faqCSS = html.match(/\.faq-item\s*\{([^}]*)\}/i);
assert('.faq-item has border: none', faqCSS && faqCSS[1].includes('border: none'));
assert('.faq-item has background: transparent', faqCSS && faqCSS[1].includes('background: transparent'));

// Stats
const statCardCSS = html.match(/\.stat-card\s*\{([^}]*)\}/i);
assert('.stat-card has border: none', statCardCSS && statCardCSS[1].includes('border: none'));
assert('.stat-card has background: transparent', statCardCSS && statCardCSS[1].includes('background: transparent'));

// Social
const socialCardCSS = html.match(/\.social-card\s*\{([^}]*)\}/i);
assert('.social-card has border: none', socialCardCSS && socialCardCSS[1].includes('border: none'));
assert('.social-card has background: transparent', socialCardCSS && socialCardCSS[1].includes('background: transparent'));

// Custom banner
const customBannerCSS = html.match(/\.custom-banner\s*\{([^}]*)\}/i);
assert('.custom-banner has 24px border-radius', customBannerCSS && customBannerCSS[1].includes('border-radius: 24px'));
assert('.custom-banner has 52px 48px padding', customBannerCSS && customBannerCSS[1].includes('padding: 52px 48px'));
assert('.custom-banner has gradient background', customBannerCSS && customBannerCSS[1].includes('linear-gradient(118deg, rgb(228, 231, 245) 0%, rgb(240, 253, 244) 100%)'));

// Coupon ticket
const ticketCSS = html.match(/\.coupon-ticket\s*\{([^}]*)\}/i);
assert('.coupon-ticket has #f5f5f5 background', ticketCSS && ticketCSS[1].includes('background: #f5f5f5'));
assert('.coupon-ticket has 24px border-radius', ticketCSS && ticketCSS[1].includes('border-radius: 24px'));
assert('.coupon-ticket has border: none', ticketCSS && ticketCSS[1].includes('border: none'));
const ticketBtnCSS = html.match(/\.ticket-copy-btn\s*\{([^}]*)\}/i);
assert('.ticket-copy-btn has 2px dashed #6a5ae0 border', ticketBtnCSS && ticketBtnCSS[1].includes('border: 2px dashed #6a5ae0'));

// 7. Micro-animations keyframes inspection
// selectItem1 start/end loop consistency
const select1 = html.match(/@keyframes\s+selectItem1\s*\{([^}]*)\}/is);
assert('selectItem1 keyframe exists', !!select1);
const box1 = html.match(/@keyframes\s+boxItem1\s*\{([^}]*)\}/is);
assert('boxItem1 keyframe exists with #22c55e', box1 && box1[1].includes('#22c55e'));

// laser beam scan
const laserCSS = html.match(/\.qr-laser-beam\s*\{([^}]*)\}/i);
assert('.qr-laser-beam has #2563eb background', laserCSS && laserCSS[1].includes('background: #2563eb'));
const scanKeyframe = html.match(/@keyframes\s+scanLaserCycle\s*\{([^}]*)\}/is);
assert('scanLaserCycle keyframe exists', !!scanKeyframe);

// copy link pill
const pillCSS = html.match(/\.file-pill-incoming\s*\{([^}]*)\}/i);
assert('.file-pill-incoming has color #15803d', pillCSS && pillCSS[1].includes('color: #15803d'));
assert('.file-pill-incoming has background #f0fdf4', pillCSS && pillCSS[1].includes('background: #f0fdf4'));
const slideUpKeyframe = html.match(/@keyframes\s+slideUpCopyLink\s*\{([^}]*)\}/is);
assert('slideUpCopyLink keyframe exists', !!slideUpKeyframe);

console.log(`\nDeep Verification Completed: ${failureCount === 0 ? 'ALL CHECKS PASSED' : `${failureCount} FAILURES`}`);
if (failureCount > 0) process.exit(1);
