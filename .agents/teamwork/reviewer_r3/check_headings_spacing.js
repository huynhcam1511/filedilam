const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Check H1
const h1s = [...html.matchAll(/h1\b[^}]*\{([^}]+)\}/gi)];
console.log('H1 rules in CSS:');
h1s.forEach(h => console.log(h[0]));

// Check H2
const h2s = [...html.matchAll(/h2\b[^}]*\{([^}]+)\}/gi)];
console.log('\nH2 rules in CSS:');
h2s.forEach(h => console.log(h[0]));

// Check .section-title, .hero-title, etc.
const titles = [...html.matchAll(/\.(?:hero-title|section-title|custom-title)[^}]*\{([^}]+)\}/gi)];
console.log('\nTitle classes in CSS:');
titles.forEach(t => console.log(t[0]));

// Check inline styles on h1 and h2
const inlineH = [...html.matchAll(/<h[12][^>]*style="([^"]*)"/gi)];
console.log('\nInline styles on H1/H2:');
inlineH.forEach(h => console.log(h[0]));
