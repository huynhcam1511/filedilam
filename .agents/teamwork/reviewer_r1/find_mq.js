const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

const mqs = [...html.matchAll(/@media[^{]+\{[\s\S]+?\n\s*\}/gi)].map(m => m[0]);
console.log('Media queries found (' + mqs.length + '):');
mqs.forEach((m, i) => console.log(`[MQ ${i+1}]\n${m}\n`));
