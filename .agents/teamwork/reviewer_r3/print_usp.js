const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

const idx = html.indexOf('/* 4-PILLAR VALUE SECTION (USP) */');
console.log(html.slice(idx, idx + 1200));

const markupIdx = html.indexOf('class="usp-section"');
console.log(html.slice(markupIdx, markupIdx + 2000));
