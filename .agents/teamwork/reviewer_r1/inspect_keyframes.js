const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

const keyframeBlocks = [...html.matchAll(/@keyframes\s+([a-zA-Z0-9_-]+)\s*\{([^}]*)\}/gi)];
console.log('--- ALL KEYFRAME BLOCKS ---');
keyframeBlocks.forEach(k => {
  console.log(`@keyframes ${k[1]} {\n${k[2]}\n}\n`);
});

const animClasses = [...html.matchAll(/(\.[a-zA-Z0-9_-]+)\s*\{([^}]*animation:[^}]*)\}/gi)];
console.log('--- CLASSES WITH ANIMATION ---');
animClasses.forEach(a => {
  console.log(`${a[1]} {\n${a[2]}\n}\n`);
});
