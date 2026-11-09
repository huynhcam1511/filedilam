const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

const start = html.indexOf('/* STEP 01: FILE SELECTOR ANIMATION */');
const end = html.indexOf('/* 4-PILLAR VALUE SECTION (USP) */');
console.log(html.slice(start, end));
