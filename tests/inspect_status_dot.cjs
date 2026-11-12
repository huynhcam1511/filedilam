const fs = require('fs');
const html = fs.readFileSync('PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html', 'utf8');
const lines = html.split('\n');

for (let i = 2648; i < 2700; i++) {
  console.log((i + 1).toString().padStart(5) + ': ' + lines[i]);
}
