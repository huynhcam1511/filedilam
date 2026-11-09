const fs = require('fs');
const html = fs.readFileSync('nourishgroup.html', 'utf8');

console.log('--- ACCURATE KEYFRAME PARSER ---');

function parseKeyframes(css) {
  const kfRegex = /@keyframes\s+([a-zA-Z0-9_-]+)\s*\{/g;
  let match;
  const keyframes = {};

  while ((match = kfRegex.exec(css)) !== null) {
    const name = match[1];
    let depth = 1;
    let startIdx = match.index + match[0].length;
    let endIdx = startIdx;

    while (depth > 0 && endIdx < css.length) {
      if (css[endIdx] === '{') depth++;
      else if (css[endIdx] === '}') depth--;
      endIdx++;
    }

    const content = css.substring(startIdx, endIdx - 1);
    keyframes[name] = content;
  }
  return keyframes;
}

const keyframes = parseKeyframes(html);
for (const [name, content] of Object.entries(keyframes)) {
  console.log(`\n=== Keyframe: ${name} ===`);
  const stepRegex = /([0-9%,\s]+)\s*\{([^}]*)\}/g;
  let sMatch;
  while ((sMatch = stepRegex.exec(content)) !== null) {
    const percent = sMatch[1].trim().replace(/\s+/g, ' ');
    const props = sMatch[2].trim().replace(/\s+/g, ' ');
    console.log(`  ${percent} => ${props}`);
  }
}
