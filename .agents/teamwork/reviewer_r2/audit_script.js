const fs = require('fs');
const html = fs.readFileSync('nourishgroup.html', 'utf8');

const weights = [...html.matchAll(/font-weight\s*:\s*([^;}"']+)/gi)];
console.log('--- FONT WEIGHTS ---');
const unique = new Set(weights.map(m => m[1].trim()));
console.log('Unique weights:', [...unique]);

weights.forEach(m => {
  const line = html.substring(0, m.index).split('\n').length;
  console.log(`Line ${line}: ${m[0]}`);
});
