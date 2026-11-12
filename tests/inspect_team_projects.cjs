const fs = require('fs');
const html = fs.readFileSync('PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html', 'utf8');

const tpIdx = html.indexOf('const ModuleTeamProjects =');
console.log('ModuleTeamProjects index:', tpIdx);
console.log(html.slice(tpIdx, tpIdx + 3000));
