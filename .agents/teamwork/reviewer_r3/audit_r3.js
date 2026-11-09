const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

console.log('HTML byte length:', html.length);

// 1. Font weights inspection
const weights = [...html.matchAll(/font-weight\s*:\s*([^;\"'\}]+)/gi)].map(m => m[1].trim());
console.log('Unique font weights:', [...new Set(weights)]);

// Check any font-weight > 600 or bold/bolder/black
const heavyWeights = weights.filter(w => {
  const n = parseInt(w, 10);
  return isNaN(n) ? ['bold', 'bolder', 'black'].includes(w.toLowerCase()) : n > 600;
});
console.log('Heavy weights (>600):', heavyWeights);

// 2. Check headings
const headings = [...html.matchAll(/<h[1-6][^>]*>/gi)].map(m => m[0]);
console.log('Headings count:', headings.length);

// Check if any heading or element has inline bold or weight
const inlineHeadingWeights = headings.filter(h => /font-weight/i.test(h));
console.log('Inline heading weights:', inlineHeadingWeights);

// 3. Check all pills and nav links for font-weight 500
console.log('\n--- Checking pills and nav links ---');
const pillClasses = [
  '.logo-badge', '.sheet-tag', '.status-pill', '.cat-tab', '.nav-links a',
  '.ticket-code-pill', '.faq-category-pill', '.file-pill-incoming',
  '.sheet-tab', '.preview-badge'
];

// 4. Check letter spacings
console.log('\n--- Checking letter-spacings ---');
const letterSpacings = [...html.matchAll(/letter-spacing\s*:\s*([^;\"'\}]+)/gi)].map(m => m[1].trim());
console.log('Unique letter spacings:', [...new Set(letterSpacings)]);

// 5. Check CSS variables and token declarations
console.log('\n--- Checking Tokens ---');
const tokens = [...html.matchAll(/--[a-zA-Z0-9_-]+\s*:\s*([^;\}]+)/gi)].map(m => ({ token: m[0].split(':')[0].trim(), val: m[1].trim() }));
console.log('Tokens found:', tokens);

// 6. Check borders in FAQ, Stats, Voucher, Social, Custom banner
console.log('\n--- Checking sections for cards / borders ---');
const faqSection = html.slice(html.indexOf('id="faq"'), html.indexOf('</section>', html.indexOf('id="faq"')) + 10);
console.log('FAQ section has card class?', faqSection.includes('card'));

const statsSection = html.slice(html.indexOf('stat-grid'), html.indexOf('</div>', html.indexOf('stat-grid') + 100));
console.log('Stats snippet:', statsSection.slice(0, 300));

// 7. Check animations
console.log('\n--- Checking Animations ---');
const keyframes = [...html.matchAll(/@keyframes\s+([a-zA-Z0-9_-]+)\s*\{([^}]+(\{[^}]*\}[^}]*)*)\}/gi)].map(m => m[1]);
console.log('Keyframe names:', keyframes);

// 8. Check external links
const links = [...html.matchAll(/<a\s+[^>]*>/gi)].map(m => m[0]);
console.log('Total <a> tags:', links.length);
const external = links.filter(l => l.includes('http'));
console.log('External links:', external);
