const fs = require('fs');
const html = fs.readFileSync('PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html', 'utf8');

const dashIdx = html.indexOf('var ModuleDashboard =');
console.log('ModuleDashboard index:', dashIdx);
console.log(html.slice(dashIdx, dashIdx + 3000));
