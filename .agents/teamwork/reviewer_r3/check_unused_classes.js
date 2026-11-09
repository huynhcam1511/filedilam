const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

const styleContent = html.match(/<style>([\s\S]*?)<\/style>/i)[1];
// Extract classes from CSS
const classMatches = [...styleContent.matchAll(/\.([a-zA-Z0-9_-]+)/g)].map(m => m[1]);
const uniqueClasses = [...new Set(classMatches)];

const unused = [];
const bodyHtml = html.slice(html.indexOf('</style>'));
for (const cls of uniqueClasses) {
  // Check if class is present in body HTML (as class="...cls..." or in JS)
  const regex = new RegExp(`['"\\s]${cls}['"\\s]`, 'i');
  if (!regex.test(bodyHtml)) {
    unused.push(cls);
  }
}
console.log('Unused classes in markup/JS:', unused);
