const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const lines = fs.readFileSync(targetPath, 'utf8').split('\n');

const symbols = ['→', '▷', '⊞', '▾', '✓'];
symbols.forEach(sym => {
  console.log(`\n=== Usages of '${sym}' ===`);
  lines.forEach((line, idx) => {
    if (line.includes(sym)) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  });
});
