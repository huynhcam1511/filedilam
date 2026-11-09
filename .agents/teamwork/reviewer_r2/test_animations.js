const fs = require('fs');
const html = fs.readFileSync('nourishgroup.html', 'utf8');

console.log('--- ANIMATION TESTING ---');

// Parse keyframes
const keyframeMatches = [...html.matchAll(/@keyframes\s+([a-zA-Z0-9_-]+)\s*\{([\s\S]*?\n\s*\})/g)];
console.log(`Found ${keyframeMatches.length} @keyframes definitions:`);

keyframeMatches.forEach(km => {
  const name = km[1];
  const body = km[2];
  console.log(`\nKeyframe: ${name}`);
  
  // Extract percentages
  const steps = [...body.matchAll(/([0-9%,\s]+)\s*\{([^}]*)\}/g)];
  steps.forEach(s => {
    const selector = s[1].trim();
    const props = s[2].trim().replace(/\s+/g, ' ');
    console.log(`  [${selector}] -> ${props}`);
  });
});
