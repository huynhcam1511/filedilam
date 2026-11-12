const fs = require('fs');
const html = fs.readFileSync('PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html', 'utf8');

console.log('=== 1. SEARCH FOR RESIDUAL PILL BADGES & PILL FRAMES ===');
// Search for rounded-full, rounded-md with px-2 or bg-*-50, border-*, etc.
const lines = html.split('\n');

const findings = [];
lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  // Check for badge-like things
  if (line.match(/class=["'][^"']*(rounded-full|rounded-pill|rounded-md|rounded)\s+[^"']*(px-[1-3]|py-0\.5)[^"']*(bg-[a-z]+-50|bg-[a-z]+-100|border)[^"']*["']/)) {
    // Exclude button CTA classes or small avatars
    if (!line.includes('rounded-full w-') && !line.includes('w-6 h-6 rounded-full') && !line.includes('w-8 h-8 rounded-full') && !line.includes('w-10 h-10 rounded-full') && !line.includes('w-5 h-5 rounded-full') && !line.includes('h-[4') && !line.includes('h-[3')) {
      findings.push({ lineNum, line: line.trim() });
    }
  }
});

console.log('Found badge-like occurrences:', findings.length);
findings.forEach(f => console.log(`L${f.lineNum}: ${f.line.slice(0, 140)}`));

console.log('\n=== 2. SEARCH FOR SPECIFIC PATTERNS MENTIONED IN TASK ===');
const targetPhrases = ['Live 0s', 'việc', 'Senior', 'Thiết kế', 'P1', 'P2', 'P3', 'P4', 'Lead', 'Mid', 'Junior'];
targetPhrases.forEach(phrase => {
  const matches = [];
  lines.forEach((l, i) => {
    if (l.includes(phrase)) {
      matches.push({ lineNum: i + 1, line: l.trim() });
    }
  });
  console.log(`Phrase "${phrase}": ${matches.length} matches`);
  // Print any that look like pills or bracketed badges
  matches.forEach(m => {
    if (m.line.includes('px-') || m.line.includes('[') && m.line.includes(']') || m.line.includes('border') || m.line.includes('rounded')) {
      if (!m.line.includes('w-[') && !m.line.includes('h-[') && !m.line.includes('max-w-[') && !m.line.includes('text-[')) {
        console.log(`   L${m.lineNum}: ${m.line.slice(0, 120)}`);
      }
    }
  });
});
