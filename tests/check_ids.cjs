const fs = require('fs');
const html = fs.readFileSync('PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html', 'utf8');

console.log('--- Task IDs ---');
const taskContainer = html.match(/id="[^"]*task[^"]*"/gi);
console.log('Task IDs:', taskContainer ? taskContainer.slice(0, 25) : null);

console.log('\n--- Matrix / Routine Containers ---');
const matrixContainer = html.match(/id="[^"]*matrix[^"]*"/gi);
console.log('Matrix IDs:', matrixContainer ? matrixContainer.slice(0, 25) : null);

console.log('\n--- Where is the table rendered? ---');
const renderMatches = html.match(/function\s+render[a-zA-Z0-9_]*\s*\(/g);
console.log('Render functions:', renderMatches);
