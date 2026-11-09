const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find all keyframes and their CSS rules
const keyframeMatches = [...html.matchAll(/@keyframes\s+([a-zA-Z0-9_-]+)\s*\{([\s\S]*?)\n\s*\}/gi)];
console.log('--- Keyframes Found ---');
for (const km of keyframeMatches) {
  console.log('Name:', km[1]);
  console.log(km[2].trim());
  console.log('-------------------');
}

// Find elements that use animation
const animationStyles = [...html.matchAll(/animation\s*:\s*([^;\}]+)/gi)].map(m => m[0]);
console.log('--- Animation usages in CSS ---');
console.log(animationStyles);

// Find checkout flow section in HTML
const flowIdx = html.indexOf('step-card') !== -1 ? html.indexOf('step-card') : html.indexOf('qr-scanner');
if (flowIdx !== -1) {
  console.log('--- Flow HTML (context around flowIdx) ---');
  console.log(html.slice(Math.max(0, flowIdx - 200), flowIdx + 1200));
}
