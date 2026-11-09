const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

const mediaQueries = [...html.matchAll(/@media[^{]+\{([\s\S]+?\n\s*\})/gi)];
console.log('Media queries found:');
mediaQueries.forEach(m => {
  console.log(m[0]);
  console.log('------------------------------------');
});
