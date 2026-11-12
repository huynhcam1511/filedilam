const fs = require('fs');
const html = fs.readFileSync('PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html', 'utf8');

const navMatches = html.match(/data-tab=["'][^"']+["']/g) || [];
console.log('Nav data-tabs:', [...new Set(navMatches)]);

const tabPanes = html.match(/id=["']tab-[^"']+["']/g) || [];
console.log('Tab panes:', [...new Set(tabPanes)]);
