const fs = require('fs');
const html = fs.readFileSync('nourishgroup.html', 'utf8');

// Find all non-ascii characters that are not Vietnamese text
const nonAscii = [...html.matchAll(/[^\x00-\x7F]/g)];
const vietnameseRegex = /[\u00C0-\u1EF9]/; // Vietnamese accents range approx

const interesting = [];
nonAscii.forEach(m => {
  const char = m[0];
  if (!vietnameseRegex.test(char)) {
    interesting.push({ char, code: char.charCodeAt(0).toString(16), index: m.index });
  }
});

const unique = [...new Set(interesting.map(i => `${i.char} (U+${i.code})`))];
console.log('Non-Vietnamese non-ASCII chars:', unique);
