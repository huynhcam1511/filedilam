const fs = require('fs');
const html = fs.readFileSync('PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html', 'utf8');
const lines = html.split('\n');

console.log('=== renderTeam continued (Lines 6650 to 6750) ===');
for (let i = 6650; i < 6750; i++) {
  console.log((i + 1).toString().padStart(5) + ': ' + lines[i]);
}
