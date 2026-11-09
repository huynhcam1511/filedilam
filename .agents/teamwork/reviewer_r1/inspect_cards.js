const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
const css = styleMatch ? styleMatch[1] : '';

console.log('--- ALL CARD CLASSES IN CSS ---');
const cardRules = [...css.matchAll(/(\.[a-zA-Z0-9_-]*card[a-zA-Z0-9_-]*)\s*\{([^}]*)\}/gi)];
cardRules.forEach(r => {
  console.log(r[1].trim() + ' {\n  ' + r[2].trim().replace(/\n\s*/g, '\n  ') + '\n}\n');
});
