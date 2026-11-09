const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

const idx = html.indexOf('.row-anim-1');
console.log(html.substring(idx - 100, idx + 1500));
