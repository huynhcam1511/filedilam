const fs = require('fs');
const vm = require('vm');

console.log('=== VERIFYING CODE.GS VM SYNTAX ===');
const codeGs = fs.readFileSync('PROJECTS_WEBAPPS/QuanLyCongViecTeam_Code.gs', 'utf8');
try {
  new vm.Script(codeGs);
  console.log('Code.gs syntax: [ PASS ]');
} catch (e) {
  console.error('Code.gs syntax error:', e);
  process.exit(1);
}

console.log('\n=== VERIFYING INDEX.HTML SCRIPT BLOCKS VM SYNTAX ===');
const indexHtml = fs.readFileSync('PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html', 'utf8');

const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let match;
let scriptIdx = 0;
let errors = 0;

while ((match = scriptRegex.exec(indexHtml)) !== null) {
  scriptIdx++;
  const srcAttr = match[0].match(/src=["']([^"']+)["']/i);
  if (srcAttr) {
    console.log(`Script ${scriptIdx} is external (${srcAttr[1]}), skipping eval.`);
    continue;
  }
  const code = match[1];
  if (!code.trim()) continue;
  try {
    new vm.Script(code);
    console.log(`Script ${scriptIdx} (${code.length} chars): [ PASS ]`);
  } catch (e) {
    console.error(`Script ${scriptIdx} syntax error:`, e.message);
    errors++;
  }
}

console.log(`\nTotal inline scripts verified: ${scriptIdx}, Errors: ${errors}`);
if (errors > 0) process.exit(1);
console.log('ALL SYNTAX CHECKS PASSED WITH 0 ERRORS.');
