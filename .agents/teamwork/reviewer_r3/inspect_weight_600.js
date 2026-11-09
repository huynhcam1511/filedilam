const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const lines = fs.readFileSync(targetPath, 'utf8').split('\n');

for (let i = 0; i < 1350; i++) {
  const line = lines[i];
  if (/font-weight\s*:\s*600/i.test(line)) {
    // Find preceding selector
    let selector = '';
    for (let j = i; j >= Math.max(0, i - 15); j--) {
      if (lines[j].includes('{')) {
        selector = lines.slice(Math.max(0, j - 2), j + 1).join(' ').trim();
        break;
      }
    }
    console.log(`Line ${i + 1}: ${selector} -> ${line.trim()}`);
  }
}
