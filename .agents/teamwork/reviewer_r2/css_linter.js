const fs = require('fs');
const html = fs.readFileSync('nourishgroup.html', 'utf8');

// Extract style block
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
if (!styleMatch) {
  console.error('No style block found');
  process.exit(1);
}
const css = styleMatch[1];

// 1. Check for unclosed braces or syntax issues
let openBraces = 0;
let lineNum = 1;
for (let i = 0; i < css.length; i++) {
  if (css[i] === '\n') lineNum++;
  if (css[i] === '{') openBraces++;
  if (css[i] === '}') openBraces--;
  if (openBraces < 0) {
    console.error(`Extra closing brace around CSS line ${lineNum}`);
    break;
  }
}
console.log('Open braces remaining at end of CSS:', openBraces);

// 2. Check for duplicate or conflicting properties within same rule block
const rules = css.split('}');
rules.forEach((rule, idx) => {
  const parts = rule.split('{');
  if (parts.length === 2) {
    const selector = parts[0].trim();
    const declarations = parts[1].split(';').map(d => d.trim()).filter(Boolean);
    const props = declarations.map(d => d.split(':')[0].trim());
    const propCounts = {};
    props.forEach(p => {
      propCounts[p] = (propCounts[p] || 0) + 1;
      if (propCounts[p] > 1) {
        console.warn(`Duplicate property "${p}" in rule: ${selector.replace(/\s+/g, ' ')}`);
      }
    });
  }
});

// 3. Inspect all media queries and responsive rules
const mediaQueries = [...css.matchAll(/@media[^{]+\{([\s\S]+?\n\s*\})/g)];
console.log('Media queries found:', mediaQueries.length);
mediaQueries.forEach((mq, i) => {
  console.log(`MQ ${i + 1}:`, mq[0].substring(0, 60), '...');
});
