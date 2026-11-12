const fs = require('fs');
const html = fs.readFileSync('PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html', 'utf8');

const ganttIdx = html.indexOf('id="tab-gantt"');
const ganttEndIdx = html.indexOf('</section>', ganttIdx);
console.log(html.slice(ganttIdx + 1800, ganttEndIdx));
