const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve('STANDARDS_TEMPLATE/CONGNO_Index.html'), 'utf8');

const eventRegex = /\s(on[a-z]+)=["']([^"']+)["']/gi;
let m;
const handlers = [];
while ((m = eventRegex.exec(html)) !== null) {
  handlers.push({ event: m[1], code: m[2] });
}

console.log('Total inline event handlers found:', handlers.length);
const uniqueSnippets = [...new Set(handlers.map(h => h.code.trim()))];
console.log('Unique snippets count:', uniqueSnippets.length);
uniqueSnippets.forEach(s => console.log('  -', s));
