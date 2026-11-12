const fs = require('fs');
const html = fs.readFileSync('PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html', 'utf8');
const lines = html.split('\n');

console.log('=== DASHBOARD HTML (Lines 310 to 465) ===');
for (let i = 310; i < 465; i++) {
  console.log((i + 1).toString().padStart(5) + ': ' + lines[i]);
}
