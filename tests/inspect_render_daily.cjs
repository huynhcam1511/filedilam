const fs = require('fs');
const html = fs.readFileSync('PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html', 'utf8');
const lines = html.split('\n');

console.log('=== DASHBOARD renderDailyActions (Lines 880 to 980) ===');
for (let i = 880; i < 980; i++) {
  console.log((i + 1).toString().padStart(5) + ': ' + lines[i]);
}
