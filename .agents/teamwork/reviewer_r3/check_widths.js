const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find all width: ...px, min-width: ...px
const fixedWidths = [...html.matchAll(/(?:min-width|width)\s*:\s*([0-9]+px)/gi)].map(m => m[0]);
console.log('Fixed widths:', [...new Set(fixedWidths)]);

// Find all elements with large widths
const largeWidths = fixedWidths.filter(w => {
  const num = parseInt(w.match(/[0-9]+/)[0], 10);
  return num > 300;
});
console.log('Large fixed widths (> 300px):', largeWidths);
