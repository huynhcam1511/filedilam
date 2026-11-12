const fs = require('fs');
const html = fs.readFileSync('PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html', 'utf8');

const renderStaffIdx = html.indexOf('function renderStaff(');
console.log('renderStaff index:', renderStaffIdx);
console.log(html.slice(renderStaffIdx, renderStaffIdx + 4000));
