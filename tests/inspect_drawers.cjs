const fs = require('fs');
const html = fs.readFileSync('PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html', 'utf8');
const lines = html.split('\n');

console.log('=== Staff & Project Drawers (Lines 7150 to 7350) ===');
for (let i = 7150; i < 7350; i++) {
  console.log((i + 1).toString().padStart(5) + ': ' + lines[i]);
}
