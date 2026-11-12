/**
 * CHALLENGER FINAL: Comprehensive Adversarial Verification Harness
 * Tests all 5 verification tasks + adversarial edge cases
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const targetHtmlPath = path.resolve(__dirname, '../PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html');
const targetGsPath = path.resolve(__dirname, '../PROJECTS_WEBAPPS/QuanLyCongViecTeam_Code.gs');

const htmlContent = fs.readFileSync(targetHtmlPath, 'utf8');
const gsContent = fs.readFileSync(targetGsPath, 'utf8');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${testName} - ${details}`);
  }
}

console.log('================================================================');
console.log('CHALLENGER FINAL: ADVERSARIAL VERIFICATION HARNESS');
console.log(`Target: ${targetHtmlPath}`);
console.log('================================================================\n');

// -------------------------------------------------------------
// TASK 1: Verify Item 1 - Regex check for ⏳ and forbidden emojis
// -------------------------------------------------------------
console.log('--- TASK 1: EMOJI & HOURGLASS ZERO-TOLERANCE CHECK ---');
const hourglassOccurrences = [...htmlContent.matchAll(/⏳/g)];
assert(hourglassOccurrences.length === 0, 'Zero occurrences of ⏳ emoji in entire HTML file', `Found: ${hourglassOccurrences.length}`);

// Check specific lines previously reported (7290 - 7550)
const saveStaffMatches = htmlContent.match(/handleSaveStaff[\s\S]*?submitBtn\.innerHTML\s*=\s*['"]([^'"]+)['"]/);
const staffInner = saveStaffMatches ? saveStaffMatches[1] : '';
assert(!staffInner.includes('⏳') && staffInner.includes('<svg'), 'handleSaveStaff uses SVG spinner, not ⏳', staffInner);

const saveProjMatches = htmlContent.match(/handleSaveProject[\s\S]*?submitBtn\.innerHTML\s*=\s*['"]([^'"]+)['"]/);
const projInner = saveProjMatches ? saveProjMatches[1] : '';
assert(!projInner.includes('⏳') && projInner.includes('<svg'), 'handleSaveProject uses SVG spinner, not ⏳', projInner);

const forbiddenList = ['⚡', '✨', '🔑', '🏠', '📞', '⏳', '⚠️', '🟢', '📅', '⏰', '👤', '🚀', '💡'];
let forbiddenCount = 0;
forbiddenList.forEach(emoji => {
  const count = [...htmlContent.matchAll(new RegExp(emoji, 'g'))].length;
  if (count > 0) {
    forbiddenCount += count;
    console.error(`    Found forbidden emoji: ${emoji} (${count} times)`);
  }
});
assert(forbiddenCount === 0, 'Zero occurrences of all AGENTS.md forbidden emojis in entire file', `Total found: ${forbiddenCount}`);

// -------------------------------------------------------------
// TASK 2: Verify Item 2 - Header button ID, re-entrancy lock, disabled state
// -------------------------------------------------------------
console.log('\n--- TASK 2: CALENDAR SYNC HEADER BUTTON & RE-ENTRANCY LOCK ---');
const hasHeaderButtonId = htmlContent.includes('id="btn-sync-calendar-header"');
assert(hasHeaderButtonId, 'Header button has explicit id="btn-sync-calendar-header"');

// Mock DOM representation for deep behavioral testing
class MockElement {
  constructor(tag = 'div', id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.classList = {
      _classes: new Set(),
      add: function(...c) { c.forEach(x => this._classes.add(x)); },
      remove: function(...c) { c.forEach(x => this._classes.delete(x)); },
      contains: function(c) { return this._classes.has(c); }
    };
    this.style = {};
    this.value = '';
    this.disabled = false;
    this.innerText = '';
  }
  setAttribute(k, v) { this[k] = v; }
  addEventListener() {}
  remove() {}
  dispatchEvent() { return true; }
  appendChild(c) { return c; }
  getContext() { return {}; }
}

const elementsById = new Map();
const idAttrRegex = /<([a-zA-Z0-9_-]+)\b[^>]*\bid=["']([^"']+)["'][^>]*>/gi;
let match;
while ((match = idAttrRegex.exec(htmlContent)) !== null) {
  elementsById.set(match[2], new MockElement(match[1], match[2]));
}

let rpcDispatches = 0;
let lastSuccessHandler = null;
let lastFailureHandler = null;

const mockRun = {
  withSuccessHandler: function(fn) { lastSuccessHandler = fn; return this; },
  withFailureHandler: function(fn) { lastFailureHandler = fn; return this; },
  getInitialData: function() {},
  syncDeadlinesToGoogleCalendar: function() {
    rpcDispatches++;
  }
};

const sandbox = {
  console,
  setTimeout: (fn) => fn(),
  requestAnimationFrame: (fn) => fn(),
  cancelAnimationFrame: () => {},
  Event: class { constructor(t) { this.type = t; } },
  CustomEvent: class {},
  tailwind: { config: {} },
  window: null,
  addEventListener: () => {},
  document: {
    getElementById: (id) => elementsById.get(id) || null,
    querySelector: () => new MockElement(),
    querySelectorAll: (selector) => {
      if (selector === '.tab-panel') {
        return ['tab-dashboard', 'tab-tasks', 'tab-gantt', 'tab-routines', 'tab-team', 'tab-projects', 'tab-help']
          .map(id => elementsById.get(id) || new MockElement('section', id));
      }
      return [];
    },
    createElement: (t) => new MockElement(t),
    body: new MockElement('body')
  },
  navigator: { clipboard: { writeText: async () => {} }, userAgent: '' },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  lucide: { createIcons: () => {} },
  Chart: function() { return { destroy: () => {} }; },
  google: { script: { run: mockRun } },
  Intl, Date, Math, JSON, Array, Object, String, Number, Boolean, RegExp, Map, Set, Promise
};
sandbox.window = sandbox;
sandbox.Chart.defaults = { font: {}, color: '' };

// Execute scripts into sandbox
const scriptRegex = /<script\b(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
while ((match = scriptRegex.exec(htmlContent)) !== null) {
  vm.runInNewContext(match[1], sandbox);
}

sandbox.App.init();

const headerBtn = elementsById.get('btn-sync-calendar-header');
const sidebarBtn = elementsById.get('btn-sync-calendar');

assert(headerBtn !== undefined, 'Element btn-sync-calendar-header exists in DOM registry');
assert(sidebarBtn !== undefined, 'Element btn-sync-calendar exists in DOM registry');

// Trigger initial sync
sandbox.App.syncGoogleCalendar();
assert(rpcDispatches === 1, 'Initial syncGoogleCalendar triggers RPC exactly once', `Dispatches: ${rpcDispatches}`);
assert(headerBtn.disabled === true, 'Header button is disabled (disabled=true) during sync');
assert(headerBtn.classList.contains('pointer-events-none'), 'Header button has pointer-events-none during sync');
assert(sidebarBtn.disabled === true, 'Sidebar button is disabled (disabled=true) during sync');
assert(sandbox.App._isSyncing === true, 'App._isSyncing lock is set to true');

// ADVERSARIAL STRESS TEST: Fire 50 rapid calls while sync is in progress
for (let i = 0; i < 50; i++) {
  sandbox.App.syncGoogleCalendar();
}
assert(rpcDispatches === 1, 'Re-entrancy guard blocked all 50 rapid concurrent calls (RPC count remains 1)', `Dispatches: ${rpcDispatches}`);

// Complete sync via withSuccessHandler
lastSuccessHandler({ success: true, count: 8 });
assert(headerBtn.disabled === false, 'Header button re-enabled after successful sync');
assert(!headerBtn.classList.contains('pointer-events-none'), 'Header button pointer-events-none removed after success');
assert(sidebarBtn.disabled === false, 'Sidebar button re-enabled after successful sync');
assert(sandbox.App._isSyncing === false, 'App._isSyncing lock is released (false) after success');

// Test Failure Handler Reset: Trigger sync again and fail it
sandbox.App.syncGoogleCalendar();
assert(rpcDispatches === 2, 'Second sync dispatched after lock release');
assert(headerBtn.disabled === true, 'Header button disabled again for second sync');
lastFailureHandler('Simulated Google Calendar API Quota Error');
assert(headerBtn.disabled === false, 'Header button re-enabled even after RPC failure');
assert(sandbox.App._isSyncing === false, 'App._isSyncing lock released even after RPC failure');

// -------------------------------------------------------------
// TASK 3: Verify Item 3 - navigate alias & tab transition
// -------------------------------------------------------------
console.log('\n--- TASK 3: App.navigate ALIAS & TAB TRANSITIONS ---');
assert(typeof sandbox.App.navigate === 'function', 'App.navigate method exists and is a function');

// Test App.navigate directly
sandbox.App.switchTab('dashboard');
assert(sandbox.AppState.currentTab === 'dashboard', 'Initial tab set to dashboard');

sandbox.App.navigate('tasks');
assert(sandbox.AppState.currentTab === 'tasks', 'App.navigate("tasks") sets AppState.currentTab to "tasks"');
assert(!elementsById.get('tab-tasks').classList.contains('hidden'), 'tab-tasks is not hidden after navigate("tasks")');

// Test with 'tab-tasks' prefix
sandbox.App.navigate('tab-gantt');
assert(sandbox.AppState.currentTab === 'gantt', 'App.navigate("tab-gantt") strips prefix and sets AppState.currentTab to "gantt"');

// Test default / falsy handling
sandbox.App.navigate(null);
assert(sandbox.AppState.currentTab === 'dashboard', 'App.navigate(null) defaults gracefully to "dashboard"');

// Test ModuleTeamProjects.viewStaffTasks transition
sandbox.App.switchTab('team');
assert(sandbox.AppState.currentTab === 'team', 'Current tab set to team');
sandbox.ModuleTeamProjects.viewStaffTasks('NHAN-109284', 'Nguyễn Minh Trí');
assert(sandbox.AppState.currentTab === 'tasks', 'ModuleTeamProjects.viewStaffTasks successfully transitions tab to "tasks"');
assert(!elementsById.get('tab-tasks').classList.contains('hidden'), 'tab-tasks element is displayed');

// Test ModuleTeamProjects.viewProjectTasks transition
sandbox.App.switchTab('projects');
assert(sandbox.AppState.currentTab === 'projects', 'Current tab set to projects');
sandbox.ModuleTeamProjects.viewProjectTasks('DUAN-839201');
assert(sandbox.AppState.currentTab === 'tasks', 'ModuleTeamProjects.viewProjectTasks successfully transitions tab to "tasks"');
assert(!elementsById.get('tab-tasks').classList.contains('hidden'), 'tab-tasks element is displayed');

// -------------------------------------------------------------
// TASK 4: Run Challenger 2 UX Regression Suite
// -------------------------------------------------------------
console.log('\n--- TASK 4: CHALLENGER 2 UX REGRESSION SUITE (32 TESTS) ---');
const { execSync } = require('child_process');
try {
  const suiteOutput = execSync('node tests/test_challenger_2_ux_regression.js', { encoding: 'utf8' });
  const passedMatch = suiteOutput.match(/Passed\s*:\s*(\d+)/);
  const failedMatch = suiteOutput.match(/Failed\s*:\s*(\d+)/);
  const warningsMatch = suiteOutput.match(/Warnings\s*:\s*(\d+)/);
  const passCount = passedMatch ? parseInt(passedMatch[1], 10) : 0;
  const failCount = failedMatch ? parseInt(failedMatch[1], 10) : -1;
  const warnCount = warningsMatch ? parseInt(warningsMatch[1], 10) : -1;

  assert(passCount === 32, `test_challenger_2_ux_regression.js passed 32 tests (Actual: ${passCount})`);
  assert(failCount === 0, `test_challenger_2_ux_regression.js has 0 failures (Actual: ${failCount})`);
  assert(warnCount === 0, `test_challenger_2_ux_regression.js has 0 warnings (Actual: ${warnCount})`);
} catch (err) {
  assert(false, 'test_challenger_2_ux_regression.js threw an error', err.message);
}

// -------------------------------------------------------------
// TASK 5: Node.js V8 Syntax Check across all script blocks
// -------------------------------------------------------------
console.log('\n--- TASK 5: NODE.JS V8 SYNTAX & CODE COMPILATION AUDIT ---');
let scriptBlockIdx = 1;
let v8Errors = 0;
const scriptCheckRegex = /<script\b(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
let scMatch;
while ((scMatch = scriptCheckRegex.exec(htmlContent)) !== null) {
  const code = scMatch[1];
  try {
    new vm.Script(code, { filename: `inline-script-${scriptBlockIdx}.js` });
    assert(true, `Inline script block ${scriptBlockIdx} compiled cleanly (${code.length} characters)`);
  } catch (err) {
    v8Errors++;
    assert(false, `Inline script block ${scriptBlockIdx} compilation failed`, err.message);
  }
  scriptBlockIdx++;
}
assert(v8Errors === 0, 'All inline script blocks compiled cleanly with 0 syntax errors');

// Also check backend Code.gs
try {
  new vm.Script(gsContent, { filename: 'QuanLyCongViecTeam_Code.gs' });
  assert(true, `Backend QuanLyCongViecTeam_Code.gs compiled cleanly (${gsContent.length} characters)`);
} catch (err) {
  assert(false, 'Backend QuanLyCongViecTeam_Code.gs compilation failed', err.message);
}

// -------------------------------------------------------------
// TASK 6: ADVERSARIAL INTEGRITY CHECKS (Version Badge, Filter DOMs, Zero Empty State)
// -------------------------------------------------------------
console.log('\n--- TASK 6: ADVERSARIAL INTEGRITY CHECKS ---');
assert(htmlContent.includes('Bản 3.2'), 'Visual Version Badge "Bản 3.2" is present in HTML');
assert(htmlContent.includes('id="appBuildVersionBadge"'), 'Sidebar version badge id="appBuildVersionBadge" is present');

const hasInitialData = htmlContent.includes('INITIAL_EMBEDDED_DATA') || htmlContent.includes('AppState.data');
assert(hasInitialData, 'Initial embedded data is present for 0s Instant Render');

// Check filter elements used by viewStaffTasks / viewProjectTasks
const hasTaskSearch = htmlContent.includes('id="task-search-input"') || htmlContent.includes('id="search-task-input"');
assert(hasTaskSearch, 'Task search input element exists for filtered navigation');

const hasTaskFilterProj = htmlContent.includes('id="task-filter-project"') || htmlContent.includes('id="task-project-filter"');
assert(hasTaskFilterProj, 'Task project filter dropdown (id="task-filter-project") exists in Tasks tab');

// Verify that calling viewProjectTasks populates search or filter
sandbox.ModuleTeamProjects.viewProjectTasks('DUAN-839201');
const searchEl = elementsById.get('task-search-input');
assert(searchEl && searchEl.value === 'DUAN-839201', 'viewProjectTasks successfully populates task search with project code');


// -------------------------------------------------------------
// SUMMARY & VERDICT
// -------------------------------------------------------------
console.log('\n================================================================');
console.log('FINAL CHALLENGER VERIFICATION SUMMARY:');
console.log(`  Total Tests Checked : ${totalTests}`);
console.log(`  Passed              : ${passedTests}`);
console.log(`  Failed              : ${failedTests}`);
console.log('================================================================\n');

if (failedTests === 0) {
  console.log('>>> VERDICT: APPROVE <<<');
  process.exit(0);
} else {
  console.error('>>> VERDICT: REQUEST_CHANGES <<<');
  process.exit(1);
}
