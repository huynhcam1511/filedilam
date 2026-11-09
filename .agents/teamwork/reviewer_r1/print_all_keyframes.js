const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

function extractKeyframes() {
  const result = [];
  const startRegex = /@keyframes\s+([a-zA-Z0-9_-]+)\s*\{/g;
  let match;
  while ((match = startRegex.exec(html)) !== null) {
    const name = match[1];
    let depth = 1;
    let i = match.index + match[0].length;
    const start = i;
    while (i < html.length && depth > 0) {
      if (html[i] === '{') depth++;
      else if (html[i] === '}') depth--;
      i++;
    }
    const body = html.substring(start, i - 1);
    result.push({ name, body });
  }
  return result;
}

const keyframes = extractKeyframes();
keyframes.forEach(k => {
  console.log(`==================== @keyframes ${k.name} ====================`);
  console.log(k.body.trim());
});
