const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

const matches = [...html.matchAll(/btn-add-cart/g)];
console.log('btn-add-cart count:', matches.length);

const addCartLines = [];
html.split('\n').forEach((line, i) => {
  if (line.includes('btn-add-cart')) {
    addCartLines.push(`${i + 1}: ${line.trim()}`);
  }
});
console.log(addCartLines);
