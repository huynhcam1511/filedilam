const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

const colors = [...html.matchAll(/#([0-9a-fA-F]{3,8})\b/gi)].map(m => '#' + m[1].toLowerCase());
const colorCounts = {};
colors.forEach(c => colorCounts[c] = (colorCounts[c] || 0) + 1);

console.log('--- ALL HEX COLORS IN NOURISHGROUP.HTML ---');
const sorted = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
sorted.forEach(([color, count]) => console.log(`${color}: ${count}`));
