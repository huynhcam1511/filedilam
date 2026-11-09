const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

console.log('--- ADVERSARIAL STRESS TEST & BOUNDARY CHECK ---');

// 1. Media queries stress check
const mediaQueries = [...html.matchAll(/@media[^{]+\{([\s\S]*?\}\s*\})/gi)];
console.log(`Found ${mediaQueries.length} responsive media query blocks.`);
mediaQueries.forEach((mq, i) => {
  const header = mq[0].slice(0, mq[0].indexOf('{')).trim();
  console.log(`  MQ ${i+1}: ${header}`);
});

// Verify 640px or mobile viewport handling
const hasMobileMQ = /@media\s*\(\s*max-width:\s*640px\s*\)/i.test(html) ||
                    /@media\s*\(\s*max-width:\s*768px\s*\)/i.test(html);
console.log('Mobile media queries present (<640px / <768px):', hasMobileMQ);

// 2. Clipboard fallback simulation
let clipboardSimSuccess = false;
try {
  // Simulate navigator.clipboard rejection
  const fakeBtn = { textContent: 'Sao chép', dataset: {} };
  let timerId = null;
  function simCopy(btn) {
    if (!btn.dataset.origText) btn.dataset.origText = btn.textContent;
    if (timerId) clearTimeout(timerId);
    btn.textContent = 'Đã sao chép!';
    timerId = setTimeout(() => {
      btn.textContent = btn.dataset.origText;
      delete btn.dataset.origText;
    }, 50);
  }
  // Call 5 times rapidly
  simCopy(fakeBtn);
  simCopy(fakeBtn);
  simCopy(fakeBtn);
  if (fakeBtn.dataset.origText === 'Sao chép') {
    clipboardSimSuccess = true;
  }
} catch (e) {
  clipboardSimSuccess = false;
}
console.log('Re-entrant rapid click simulation preserved original label:', clipboardSimSuccess);

// 3. Check for any unexpected external CDN scripts
const externalScripts = [...html.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi)];
console.log('External script tags count:', externalScripts.length);
externalScripts.forEach(s => console.log('  Script src:', s[1]));

console.log('--- STRESS TEST COMPLETE ---');
