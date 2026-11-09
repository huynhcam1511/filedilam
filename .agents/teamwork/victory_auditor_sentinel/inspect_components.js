const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find step 1, 2, 3 markup
const steps = [...html.matchAll(/<div class="checkout-step">([\s\S]*?)<\/div>\s*(?=<div class="checkout-step">|<\/div>\s*<\/div>\s*<\/section>)/gi)];
console.log('Found checkout steps: ' + steps.length);
steps.forEach((st, idx) => {
  console.log(`\n=== STEP ${idx + 1} PREVIEW ===`);
  console.log(st[1].trim().slice(0, 350));
});

// Find scripts
const scriptMatch = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
if (scriptMatch) {
  console.log('\n=== INLINE JAVASCRIPT ===');
  console.log(scriptMatch[1].trim());
}
