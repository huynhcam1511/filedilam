const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

const sections = [...html.matchAll(/<(?:header|section|footer|nav|main)[^>]*>/gi)].map(m => m[0]);
console.log('Top level elements:');
sections.forEach(s => console.log(s));
