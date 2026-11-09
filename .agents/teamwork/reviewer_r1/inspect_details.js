const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

const idx = html.indexOf('class="faq-section"');
if (idx !== -1) {
  console.log(html.substring(idx - 20, idx + 2500));
}
