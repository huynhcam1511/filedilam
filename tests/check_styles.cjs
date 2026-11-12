const fs = require('fs');
const html = fs.readFileSync('PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html', 'utf8');
const lines = html.split('\n');

const rounded2xl = [];
const shadows = [];

lines.forEach((l, i) => {
  if (l.includes('rounded-2xl')) {
    rounded2xl.push({ line: i + 1, content: l.trim() });
  }
  if (l.includes('shadow-') && !l.includes('shadow-xs') && !l.includes('shadow-sm') && !l.includes('shadow-[2px')) {
    shadows.push({ line: i + 1, content: l.trim() });
  }
});

console.log('rounded-2xl count:', rounded2xl.length);
rounded2xl.forEach(r => console.log(`L${r.line}: ${r.content.slice(0, 100)}`));

console.log('\nshadow count (non-subtle):', shadows.length);
shadows.forEach(s => console.log(`L${s.line}: ${s.content.slice(0, 100)}`));
