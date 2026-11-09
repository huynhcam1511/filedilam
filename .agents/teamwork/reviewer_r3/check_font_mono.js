const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

const occurrences = [...html.matchAll(/(?:JetBrains Mono|--font-mono)/gi)];
console.log('JetBrains Mono / --font-mono occurrences:');
occurrences.forEach(o => {
  const start = Math.max(0, o.index - 50);
  const end = Math.min(html.length, o.index + 80);
  console.log(html.slice(start, end));
  console.log('---');
});
