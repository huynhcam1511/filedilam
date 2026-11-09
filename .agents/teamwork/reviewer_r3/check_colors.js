const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

// Find all color: declarations
const colorDecls = [...html.matchAll(/(?:^|[^a-zA-Z0-9_-])color\s*:\s*([^;\}]+)/gi)].map(m => m[1].trim());
console.log('Unique color declarations:', [...new Set(colorDecls)]);
