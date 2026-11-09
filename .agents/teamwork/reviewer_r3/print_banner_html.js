const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

const bannerIdx = html.indexOf('class="custom-banner"');
console.log(html.slice(bannerIdx, bannerIdx + 2000));
