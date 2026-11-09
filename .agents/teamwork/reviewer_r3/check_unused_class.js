const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

const matches = [...html.matchAll(/file-icon-sheets/g)];
console.log('file-icon-sheets matches in html:', matches.length);
