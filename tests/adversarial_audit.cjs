const fs = require('fs');
const html = fs.readFileSync('PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html', 'utf8');

console.log('HTML Total Length:', html.length);

// 1. Search for pill/badge-like classes in dynamically generated HTML and static HTML
const classMatches = html.match(/class=["'][^"']*["']/g) || [];
console.log('Total class attributes:', classMatches.length);

const pillClasses = [];
classMatches.forEach(c => {
  if (c.includes('rounded-full') && !c.includes('w-') && !c.includes('h-2') && !c.includes('h-1') && !c.includes('h-2.5') && !c.includes('h-3')) {
    pillClasses.push(c);
  }
  if (c.includes('border') && (c.includes('rounded-full') || (c.includes('px-') && c.includes('py-') && c.includes('text-[')))) {
    pillClasses.push(c);
  }
});

console.log('Pill class candidates count:', pillClasses.length);
console.log([...new Set(pillClasses)]);

// 2. Search for bracketed patterns like [Senior], [P1], etc.
const bracketMatches = html.match(/\[[A-Za-z0-9\s•]+\]/g) || [];
console.log('Bracket patterns found:', bracketMatches);

// 3. Search for card overload in Dashboard, Staff, Projects, Gantt
// Check tab-dashboard, tab-team, tab-projects, tab-gantt
const sections = ['id="tab-dashboard"', 'id="tab-team"', 'id="tab-projects"', 'id="tab-gantt"'];
sections.forEach(sec => {
  const idx = html.indexOf(sec);
  console.log(`Section ${sec} exists at index:`, idx);
});

