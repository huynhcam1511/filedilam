const fs = require('fs');
const html = fs.readFileSync('PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html', 'utf8');

// Find sidebar navigation items (buttons or links with switchTab)
const switchTabMatches = html.match(/switchTab\([^)]+\)/g) || [];
console.log('switchTab calls:', [...new Set(switchTabMatches)]);
