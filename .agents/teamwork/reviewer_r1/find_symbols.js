const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Regex for emojis and non-standard symbols
const nonAsciiSymbols = [...html.matchAll(/[^\x00-\x7F\u00C0-\u024F\u1EA0-\u1EF9\u2010-\u2026\u2018-\u201D]/g)];
const symbolCounts = {};
nonAsciiSymbols.forEach(s => {
  const ch = s[0];
  symbolCounts[ch] = (symbolCounts[ch] || 0) + 1;
});

console.log('--- NON-ASCII SYMBOLS IN FILE ---');
Object.entries(symbolCounts).forEach(([ch, count]) => {
  console.log(`Char: ${ch} (U+${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}) -> Count: ${count}`);
});
