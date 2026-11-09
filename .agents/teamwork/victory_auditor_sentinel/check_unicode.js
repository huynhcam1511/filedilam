const fs = require('fs');
const path = require('path');

const target = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(target, 'utf8');

// Strip standard ASCII and Vietnamese characters
// Vietnamese unicode range: \u00C0-\u024F, \u1EA0-\u1EF9
const stripped = html
  .replace(/[\u0000-\u007F]/g, '')
  .replace(/[\u00C0-\u024F\u1EA0-\u1EF9]/g, '');

const unique = Array.from(new Set(stripped));
console.log('Unique non-ASCII / non-Vietnamese characters:', unique.length);
unique.forEach(ch => {
  const code = ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
  console.log(`Char: ${ch} | Unicode: U+${code}`);
});
