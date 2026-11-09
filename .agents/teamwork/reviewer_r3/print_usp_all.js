const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

const markupIdx = html.indexOf('class="usp-section"');
console.log(html.slice(markupIdx, markupIdx + 4500));
