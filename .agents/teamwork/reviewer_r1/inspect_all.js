const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
const css = styleMatch ? styleMatch[1] : '';

// Helper to extract CSS rule for a selector
function getCSSRulesFor(selectorPattern) {
  const regex = new RegExp(`([^\{\}]*${selectorPattern}[^\{\}]*)\\{([^\\}]*)\\}`, 'gi');
  const matches = [];
  let m;
  while ((m = regex.exec(css)) !== null) {
    matches.push({ selector: m[1].trim(), body: m[2].trim() });
  }
  return matches;
}

console.log('=== CSS INSPECTION ===\n');

console.log('1. FAQ CSS:');
console.log(getCSSRulesFor('faq'));

console.log('\n2. STATS CSS:');
console.log(getCSSRulesFor('stat'));

console.log('\n3. CUSTOM BANNER CSS:');
console.log(getCSSRulesFor('custom-banner'));

console.log('\n4. COUPON / TICKET CSS:');
console.log(getCSSRulesFor('coupon|ticket'));

console.log('\n5. SOCIAL CSS:');
console.log(getCSSRulesFor('social'));

console.log('\n6. STEP / ANIMATION CSS:');
console.log(getCSSRulesFor('step|anim|laser|qr-scan|file-pill'));

console.log('\n7. MEDIA QUERIES:');
const mqRegex = /@media[^{]+\{([\s\S]+?\})\s*\}/gi;
let mq;
while ((mq = mqRegex.exec(css)) !== null) {
  console.log('MQ:', mq[0].substring(0, 300) + '...\n');
}
