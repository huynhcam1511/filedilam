const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

const eventHandlers = [...html.matchAll(/on[a-z]+\s*=\s*["'][^"']+["']/gi)].map(m => m[0]);
console.log('Inline event handlers:', eventHandlers);
