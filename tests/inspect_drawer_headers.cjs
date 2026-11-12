const fs = require('fs');
const html = fs.readFileSync('PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html', 'utf8');
const lines = html.split('\n');

console.log('=== Staff Drawer header (Lines 7120 to 7150) ===');
for (let i = 7120; i < 7150; i++) {
  console.log((i + 1).toString().padStart(5) + ': ' + lines[i]);
}

console.log('=== Project Drawer header (Lines 7350 to 7380) ===');
for (let i = 7350; i < 7380; i++) {
  console.log((i + 1).toString().padStart(5) + ': ' + lines[i]);
}
