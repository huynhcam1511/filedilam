const fs = require('fs');
const html = fs.readFileSync('PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html', 'utf8');
const lines = html.split('\n');

console.log('=== renderTasksCardsMobile top (Lines 2824 to 2845) ===');
for (let i = 2824; i < 2845; i++) {
  console.log((i + 1).toString().padStart(5) + ': ' + lines[i]);
}
