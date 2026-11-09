const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

const idx = html.indexOf('.faq-section');
console.log(html.slice(idx, idx + 1000));
