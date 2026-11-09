const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

const scriptMatches = [...html.matchAll(/<script[\s\S]*?<\/script>/gi)];
console.log('Script count:', scriptMatches.length);
scriptMatches.forEach((m, i) => {
  console.log(`=== SCRIPT ${i + 1} ===`);
  console.log(m[0]);
});
