const fs = require('fs');
const html = fs.readFileSync('PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html', 'utf8');

const ganttFuncIdx = html.indexOf('function renderGantt(');
console.log(html.slice(ganttFuncIdx + 11000, ganttFuncIdx + 15000));
