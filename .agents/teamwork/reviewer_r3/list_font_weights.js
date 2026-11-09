const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const lines = fs.readFileSync(targetPath, 'utf8').split('\n');

console.log('=== ALL FONT-WEIGHT OCCURRENCES ===');
lines.forEach((line, i) => {
  if (/font-weight/i.test(line)) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
});
