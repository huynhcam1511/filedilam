const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

console.log('=== CHECKING ALL H1 & H2 IN HTML ===');
const headings = [...html.matchAll(/<(h[12])([^>]*)>([\s\S]*?)<\/\1>/gi)];
headings.forEach(h => {
  const tag = h[1];
  const attrs = h[2];
  const text = h[3].replace(/<[^>]+>/g, '').trim().substring(0, 40);
  console.log(`<${tag} ${attrs}> : "${text}"`);
});

console.log('\n=== CHECKING ALL PILLS AND BADGES ===');
const pills = [...html.matchAll(/class=["']([^"']*(?:pill|badge)[^"']*)["']/gi)];
const uniquePillClasses = [...new Set(pills.map(p => p[1]))];
console.log('Unique pill/badge classes in HTML:', uniquePillClasses);

console.log('\n=== CHECKING FONT WEIGHTS FOR ALL PILLS/BADGES IN CSS ===');
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
const css = styleMatch ? styleMatch[1] : '';

uniquePillClasses.forEach(cls => {
  const classes = cls.split(/\s+/);
  classes.forEach(c => {
    const reg = new RegExp(`\\.${c}\\s*\\{([^\\}]*)\\}`, 'i');
    const m = css.match(reg);
    if (m) {
      const fw = m[1].match(/font-weight:\s*([^;]+);/i);
      console.log(`.${c} -> font-weight: ${fw ? fw[1] : 'not set'}`);
    }
  });
});
