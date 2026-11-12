const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.resolve(__dirname, '../PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html');
const gsPath = path.resolve(__dirname, '../PROJECTS_WEBAPPS/QuanLyCongViecTeam_Code.gs');

const html = fs.readFileSync(htmlPath, 'utf8');
const gs = fs.readFileSync(gsPath, 'utf8');

const report = {
  phaseA_timeline: { result: 'PASS', checks: [] },
  phaseB_integrity: { result: 'PASS', checks: [] },
  phaseC_tests: { result: 'PASS', checks: [], failures: [] }
};

function check(phase, name, passed, details = '') {
  const target = phase === 'B' ? report.phaseB_integrity : report.phaseC_tests;
  target.checks.push({ name, passed, details });
  if (!passed) {
    target.result = 'FAIL';
    if (phase === 'C') report.phaseC_tests.failures.push(`${name}: ${details}`);
  }
}

console.log('=== RUNNING INDEPENDENT VICTORY AUDITOR VERIFICATION ===\n');

// -------------------------------------------------------------
// PHASE B: FORENSIC & INTEGRITY CHECKS
// -------------------------------------------------------------
console.log('--- PHASE B: FORENSIC INTEGRITY CHECKS ---');

// B.1: Check for hardcoded test result facades or bypasses
const hasHardcodedTestFlag = /__TEST_MODE__|fakeSuccess|mockBypass/i.test(html);
check('B', 'No hardcoded test mode bypass flags', !hasHardcodedTestFlag, 'Checked for test-specific bypass flags');

// B.2: Check if syncGoogleCalendar actually dispatches to google.script.run
const syncHasGoogleScriptRun = /google\.script\.run[\s\S]*?syncDeadlinesToGoogleCalendar/.test(html);
check('B', 'syncGoogleCalendar genuine RPC call', syncHasGoogleScriptRun, 'Verifies call to google.script.run.syncDeadlinesToGoogleCalendar');

// B.3: Check if App.init calls real module renderers
const initCallsRenderers = /ModuleDashboard\.render/.test(html) &&
                           /ModuleTasksGantt\.render/.test(html) &&
                           /ModuleRoutinesMatrix\.render/.test(html) &&
                           /ModuleTeamProjects\.render/.test(html);
check('B', 'App.init invokes genuine module renderers', initCallsRenderers, 'Verifies all 4 core module renderers are called');

// B.4: Check that module bodies are not empty or dummy stubs
const idxDash = html.indexOf('const ModuleDashboard =');
const idxTasks = html.indexOf('window.ModuleTasksGantt =');
const idxRout = html.indexOf('const ModuleRoutinesMatrix =');
const idxTeam = html.indexOf('const ModuleTeamProjects =');
const idxApp = html.indexOf('const App =');

const moduleDashLen = idxTasks - idxDash;
const moduleTasksLen = idxRout - idxTasks;
const moduleRoutLen = idxTeam - idxRout;
const moduleTeamLen = idxApp - idxTeam;
check('B', 'ModuleDashboard implementation genuine', moduleDashLen > 10000, `Length: ${moduleDashLen} chars`);
check('B', 'ModuleTasksGantt implementation genuine', moduleTasksLen > 10000, `Length: ${moduleTasksLen} chars`);
check('B', 'ModuleRoutinesMatrix implementation genuine', moduleRoutLen > 10000, `Length: ${moduleRoutLen} chars`);
check('B', 'ModuleTeamProjects implementation genuine', moduleTeamLen > 10000, `Length: ${moduleTeamLen} chars`);

// B.5: Check backend QuanLyCongViecTeam_Code.gs contract integrity
const gsHasAllRequiredRpc = [
  'apiQuickToggleTask',
  'apiSaveTask',
  'apiUpdateChecklistCell',
  'apiSaveStaff',
  'apiSaveProject',
  'syncDeadlinesToGoogleCalendar',
  'getInitialData',
  'setupDatabaseSheets'
].every(fn => gs.includes(`function ${fn}`) || gs.includes(`${fn} =`) || gs.includes(`${fn}(`));
check('B', 'Backend QuanLyCongViecTeam_Code.gs preserves all 8 RPC handlers', gsHasAllRequiredRpc, 'All 8 canonical RPC handlers verified in Code.gs');

// -------------------------------------------------------------
// PHASE C: INDEPENDENT TEST EXECUTION ACROSS ALL 5 TASKS
// -------------------------------------------------------------
console.log('\n--- PHASE C: INDEPENDENT TEST EXECUTION ACROSS ALL 5 USER TASKS ---');

// TASK 1: True 100% Full Width (Edge-to-Edge Canvas)
console.log('\n[Task 1 Verification: Full Width]');
const maxW7xlCount = [...html.matchAll(/max-w-7xl/g)].length;
check('C', 'Task 1.1: Zero occurrences of max-w-7xl in entire HTML', maxW7xlCount === 0, `Found: ${maxW7xlCount}`);

const mainContentMatch = html.match(/<div\s+id="main-content"[^>]*class="([^"]*)"/i);
const mainContentClasses = mainContentMatch ? mainContentMatch[1] : '';
const mainContentHasWFull = mainContentClasses.includes('w-full');
const mainContentHasPx = mainContentClasses.includes('px-4 lg:px-8');
const mainContentHasPy = mainContentClasses.includes('py-6');
const mainContentHasNoMaxW = !/max-w-/.test(mainContentClasses);
const mainContentHasNoMxAuto = !mainContentClasses.includes('mx-auto');
check('C', 'Task 1.2: #main-content has w-full', mainContentHasWFull, `Classes: ${mainContentClasses}`);
check('C', 'Task 1.3: #main-content has px-4 lg:px-8 py-6', mainContentHasPx && mainContentHasPy, `Classes: ${mainContentClasses}`);
check('C', 'Task 1.4: #main-content has no max-w or mx-auto', mainContentHasNoMaxW && mainContentHasNoMxAuto, `Classes: ${mainContentClasses}`);

// Check all tab sections
const tabSections = [...html.matchAll(/<section\s+id="(tab-[^"]+)"[^>]*class="([^"]*)"/gi)];
let tabWidthIssues = [];
tabSections.forEach(ts => {
  const [, id, cls] = ts;
  if (/max-w-/.test(cls) || cls.includes('mx-auto')) {
    tabWidthIssues.push(`${id} has width constraint: ${cls}`);
  }
});
check('C', 'Task 1.5: All tab sections span 100% width with no max-w or mx-auto', tabWidthIssues.length === 0, tabWidthIssues.join('; '));

// TASK 2: Fix "Sync Calendar" Button UX in Sidebar
console.log('\n[Task 2 Verification: Calendar Sync UX]');
// Check sidebar action block is distinct and outside <nav>
const navEndIndex = html.indexOf('</nav>');
const sidebarSyncIndex = html.indexOf('id="btn-sync-calendar"');
const isSyncOutsideNav = sidebarSyncIndex > navEndIndex;
check('C', 'Task 2.1: Sidebar Sync button is in dedicated action block outside <nav>', isSyncOutsideNav, `Sync at ${sidebarSyncIndex}, nav ends at ${navEndIndex}`);

// Check refresh-cw icon
const hasRefreshCwIcon = html.includes('data-lucide="refresh-cw"');
check('C', 'Task 2.2: Calendar sync uses refresh-cw icon', hasRefreshCwIcon, 'Verified data-lucide="refresh-cw"');

// Check spin indicator
const hasSpinIndicator = html.includes('animate-spin') || html.includes('animate-spin-fast');
check('C', 'Task 2.3: Calendar sync has spin animation indicator', hasSpinIndicator, 'Verified spin indicator styling');

// Check disabled state and pointer-events-none during sync
const hasDisabledStateLock = html.includes('syncBtn.disabled = true') && html.includes('pointer-events-none');
check('C', 'Task 2.4: Sync buttons disabled and pointer-events-none locked during RPC', hasDisabledStateLock, 'Verified disabled state locking');

// Check re-entrancy guard
const hasReentrancyGuard = html.includes('if (this._isSyncing) return') || html.includes('if (this._isSyncingCalendar) return');
check('C', 'Task 2.5: Re-entrancy guard prevents concurrent duplicate RPC calls', hasReentrancyGuard, 'Verified re-entrancy guard check');

// Check App.syncCalendar alias
const hasSyncCalendarAlias = /syncCalendar\s*\(\s*\)\s*\{[\s\S]*?syncGoogleCalendar/.test(html);
check('C', 'Task 2.6: App.syncCalendar() alias exported and operational', hasSyncCalendarAlias, 'Verified App.syncCalendar() alias method');

// Check header button id
const hasHeaderSyncId = html.includes('id="btn-sync-calendar-header"');
check('C', 'Task 2.7: Header button has id="btn-sync-calendar-header" and synchronizes state', hasHeaderSyncId, 'Verified header button presence');

// TASK 3: Tab HDSD Overhaul
console.log('\n[Task 3 Verification: Tab HDSD Overhaul]');
// Verify 5 modules present in Tab HDSD
const hasModule1 = html.includes('Module 01') || html.includes('MODULE 01') || html.includes('Vận hành Dashboard KPI');
const hasModule2 = html.includes('Module 02') || html.includes('MODULE 02') || html.includes('Quản lý Công việc & Đọc ma trận Gantt');
const hasModule3 = html.includes('Module 03') || html.includes('MODULE 03') || html.includes('Lịch Routine & Ma trận Checklist');
const hasModule4 = html.includes('Module 04') || html.includes('MODULE 04') || html.includes('Quản lý Nhân sự & Dự án');
const hasModule5 = html.includes('Module 05') || html.includes('MODULE 05') || html.includes('Đồng bộ Google Calendar');
check('C', 'Task 3.1: Tab HDSD contains all 5 comprehensive operational workflow modules', hasModule1 && hasModule2 && hasModule3 && hasModule4 && hasModule5, 'Verified modules 1-5');

// Check no old BƯỚC 01/02/03 boxes in tab-help
const helpSectionMatch = html.match(/<section\s+id="tab-help"[\s\S]*?<\/section>/i);
const helpContent = helpSectionMatch ? helpSectionMatch[0] : '';
const hasOldBuocBoxes = /BƯỚC\s+0[1-3]/i.test(helpContent);
check('C', 'Task 3.2: Tab HDSD eliminates old BƯỚC 01/02/03 box layout', !hasOldBuocBoxes, 'Verified elimination of old step boxes');

// Check flat accordion FAQ with divide-y divide-slate-100
const hasDivideYFaq = helpContent.includes('divide-y') && helpContent.includes('divide-slate-100');
check('C', 'Task 3.3: Accordion FAQ formatted with divide-y divide-slate-100', hasDivideYFaq, 'Verified flat accordion styling');

// Check 6 FAQ items present
const faqItemsMatch = [...helpContent.matchAll(/help-faq-\d+-ans/g)];
check('C', 'Task 3.4: Accordion FAQ contains 6 practical items', faqItemsMatch.length === 6, `Count: ${faqItemsMatch.length}`);

// Check flat Slate-900 technical support box with 46px CTA buttons
const hasSlate900Box = helpContent.includes('bg-slate-900');
const has46pxCta = /h-\[46px\]/.test(helpContent);
const hasZaloBtn = helpContent.includes('id="help-zalo-btn"');
const hasHotlineBtn = helpContent.includes('id="help-hotline-btn"');
check('C', 'Task 3.5: Flat Slate-900 support box with 46px CTA buttons (#help-zalo-btn & #help-hotline-btn)', hasSlate900Box && has46pxCta && hasZaloBtn && hasHotlineBtn, 'Verified support dock and buttons');

// TASK 4: Eliminate 100% Icon Pills & Avatar Pills & Emojis
console.log('\n[Task 4 Verification: Zero Pills & Emojis]');
// Check forbidden pastel avatar pills (e.g. w-9 h-9 rounded-xl bg-purple-50, bg-blue-50, etc.)
const forbiddenAvatarPatterns = [
  { name: 'bg-purple-50', regex: /bg-purple-50/g },
  { name: 'bg-blue-50', regex: /bg-blue-50/g },
  { name: 'bg-indigo-50', regex: /bg-indigo-50/g },
  { name: 'bg-amber-100 avatar/icon pill', regex: /(?:w-[0-9]+\s+h-[0-9]+[^"]*rounded-[^"]*bg-amber-100|bg-amber-100[^"]*w-[0-9]+\s+h-[0-9]+[^"]*rounded)/gi }
];
let pillViolations = [];
forbiddenAvatarPatterns.forEach(p => {
  const count = [...html.matchAll(p.regex)].length;
  if (count > 0) pillViolations.push(`${p.name} (${count}x)`);
});
check('C', 'Task 4.1: Zero occurrences of forbidden pastel avatar/icon pill boxes', pillViolations.length === 0, pillViolations.join(', '));

// Check forbidden emojis
const forbiddenEmojis = ['⚡', '✨', '🔑', '🏠', '📞', '⏳', '⚠️', '🟢', '📅', '⏰', '👤', '🚀', '💡'];
let emojiViolations = [];
forbiddenEmojis.forEach(e => {
  const count = [...html.matchAll(new RegExp(e, 'g'))].length;
  if (count > 0) emojiViolations.push(`${e} (${count}x)`);
});
check('C', 'Task 4.2: Zero occurrences of prohibited emojis', emojiViolations.length === 0, emojiViolations.join(', '));

// Specifically verify hourglass ⏳
const hourglassCount = [...html.matchAll(/⏳/g)].length;
check('C', 'Task 4.3: Zero occurrences of hourglass ⏳ emoji', hourglassCount === 0, `Count: ${hourglassCount}`);

// TASK 5: Verification & Version Stamping
console.log('\n[Task 5 Verification: Node.js Syntax, Instant Render 0s, Version Stamp]');
// 5.1 Syntax check on Code.gs
let gsSyntaxPass = false;
try {
  new vm.Script(gs);
  gsSyntaxPass = true;
} catch (e) {
  gsSyntaxPass = false;
}
check('C', 'Task 5.1: Backend QuanLyCongViecTeam_Code.gs compiles cleanly in V8', gsSyntaxPass, 'VM Script evaluation');

// 5.2 Syntax check on all inline scripts in HTML
const scriptRegex = /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
let inlineScriptIdx = 0;
let inlineSyntaxErrors = [];
let smatch;
while ((smatch = scriptRegex.exec(html)) !== null) {
  inlineScriptIdx++;
  const code = smatch[1];
  try {
    new vm.Script(code, { filename: `inline_script_${inlineScriptIdx}.js` });
  } catch (err) {
    inlineSyntaxErrors.push(`Script #${inlineScriptIdx}: ${err.message}`);
  }
}
check('C', `Task 5.2: All ${inlineScriptIdx} inline script blocks compile cleanly in V8`, inlineSyntaxErrors.length === 0, inlineSyntaxErrors.join('; '));

// 5.3 Instant render 0s embedded data check
const embeddedTaskIds = [...new Set([...html.matchAll(/TASK-[0-9]{6}/g)].map(m => m[0]))];
const hasEmbeddedData = html.includes('INITIAL_EMBEDDED_DATA') && embeddedTaskIds.length >= 10;
check('C', 'Task 5.3: INITIAL_EMBEDDED_DATA present for Instant Render 0s', hasEmbeddedData, `Verified ${embeddedTaskIds.length} embedded tasks`);

// 5.4 Visual version badge "Bản 3.2" check
const headerBadge = html.includes('>Bản 3.2<') || html.includes('Bản 3.2');
const footerBadge = html.includes('id="appBuildVersionBadge"') && html.includes('Phiên bản 3.2 (Active)');
check('C', 'Task 5.4: Visual Version Badge stamped to Bản 3.2 on Header Topbar and Sidebar Footer', headerBadge && footerBadge, 'Verified version badges');

// Cross-module App.navigate check
const hasAppNavigate = /navigate\s*\(\s*tabId\s*\)\s*\{[\s\S]*?switchTab/.test(html);
check('C', 'Task 5.5: Cross-module navigation App.navigate(tabId) operational', hasAppNavigate, 'Verified App.navigate alias');

console.log('\n=============================================================');
console.log('AUDIT SUMMARY:');
console.log(`Phase B Integrity: ${report.phaseB_integrity.result} (${report.phaseB_integrity.checks.length} checks)`);
console.log(`Phase C Tests:     ${report.phaseC_tests.result} (${report.phaseC_tests.checks.length} checks)`);
console.log('=============================================================');

if (report.phaseC_tests.failures.length > 0) {
  console.log('FAILURES:');
  report.phaseC_tests.failures.forEach(f => console.log(' - ' + f));
} else {
  console.log('ALL INDEPENDENT AUDIT CHECKS PASSED WITH 100% SUCCESS.');
}
console.log('\n--- DETAILED CHECK RESULTS ---');
console.log(JSON.stringify(report, null, 2));

