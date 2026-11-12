const fs = require('fs');
const html = fs.readFileSync('PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html', 'utf8');
const lines = html.split('\n');

console.log('=== renderProjects (Lines 6850 to 6980) ===');
for (let i = 6850; i < 6980; i++) {
  console.log((i + 1).toString().padStart(5) + ': ' + lines[i]);
}
