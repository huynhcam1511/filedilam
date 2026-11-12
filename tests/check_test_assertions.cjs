const fs = require('fs');

const audit = fs.readFileSync('tests/independent_victory_audit.cjs', 'utf8');
const testRes = fs.readFileSync('tests/test_quanlycongviec_concurrency_resiliency.js', 'utf8');

console.log('=== independent_victory_audit.cjs assertions ===');
const auditLines = audit.split('\n');
auditLines.forEach((l, i) => {
  if (l.includes('assert') || l.includes('Test ') || l.includes('test(')) {
    console.log(`L${i+1}: ${l.trim().slice(0, 100)}`);
  }
});

console.log('\n=== test_quanlycongviec_concurrency_resiliency.js assertions ===');
const testLines = testRes.split('\n');
testLines.forEach((l, i) => {
  if (l.includes('assert') || l.includes('Test ') || l.includes('test(')) {
    console.log(`L${i+1}: ${l.trim().slice(0, 100)}`);
  }
});
