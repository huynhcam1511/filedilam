const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const lines = fs.readFileSync(targetPath, 'utf8').split('\n');

lines.forEach((line, i) => {
  if (line.includes('540px')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
});
