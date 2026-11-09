const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

const regex = /([^{}]*)\{([^{}]*font-weight:\s*([^;}]+)[^{}]*)\}/gi;
let m;
console.log('--- ALL FONT WEIGHT RULES IN CSS ---');
while ((m = regex.exec(html)) !== null) {
  const sel = m[1].trim().replace(/\s+/g, ' ');
  const weight = m[3].trim();
  console.log(`${sel} -> ${weight}`);
}

console.log('\n--- ALL INLINE FONT WEIGHTS IN HTML ---');
const inline = [...html.matchAll(/style=["'][^"']*font-weight:\s*([^;"']+)[^"']*["']/gi)];
inline.forEach(i => {
  console.log(`inline: ${i[1].trim()} in: ${i[0]}`);
});
