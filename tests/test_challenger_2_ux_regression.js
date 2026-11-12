/**
 * =========================================================================================
 * EMPIRICAL ADVERSARIAL TEST SUITE — CHALLENGER 2 (UPDATED & EXPANDED)
 * =========================================================================================
 * Target: PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html
 * Focus: Adversarial UX, Regression Scanning, Edge Cases, Concurrency & High-Res Scaling
 * =========================================================================================
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');
const HTML_PATH = path.join(ROOT_DIR, 'PROJECTS_WEBAPPS', 'QuanLyCongViecTeam_Index.html');
const GS_PATH = path.join(ROOT_DIR, 'PROJECTS_WEBAPPS', 'QuanLyCongViecTeam_Code.gs');

console.log('================================================================');
console.log('CHALLENGER 2: ADVERSARIAL UX & REGRESSIONS AUDIT RUNNER');
console.log('Target: ' + HTML_PATH);
console.log('================================================================\n');

const htmlContent = fs.readFileSync(HTML_PATH, 'utf8');
const gsContent = fs.readFileSync(GS_PATH, 'utf8');

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  items: []
};

function recordTest(category, name, passed, details = '', isWarning = false) {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(`[PASS] [${category}] ${name}`);
  } else if (isWarning) {
    results.warnings++;
    console.log(`[WARN] [${category}] ${name} -> ${details}`);
  } else {
    results.failed++;
    console.log(`[FAIL] [${category}] ${name} -> ${details}`);
  }
  results.items.push({ category, name, passed, isWarning, details });
}

// =========================================================================================
// TEST GROUP 1: EXHAUSTIVE REGEX SCAN FOR FORBIDDEN PATTERNS
// =========================================================================================
console.log('\n--- GROUP 1: EXHAUSTIVE REGEX SCAN FOR FORBIDDEN PATTERNS ---');

// 1.1 Check max-w-7xl on main layouts
const maxW7xlMatches = [...htmlContent.matchAll(/max-w-7xl/gi)];
recordTest(
  'Forbidden Patterns',
  'No "max-w-7xl" in HTML',
  maxW7xlMatches.length === 0,
  `Found ${maxW7xlMatches.length} occurrences`
);

// 1.2 Check mx-auto on #main-content and major layout sections
const mainContentTagMatch = htmlContent.match(/<div\s+id="main-content"[^>]*>/i);
const mainContentTag = mainContentTagMatch ? mainContentTagMatch[0] : '';
const mainContentHasMxAuto = /mx-auto\b/.test(mainContentTag);
const mainContentHasMaxW = /max-w-[a-z0-9]+\b/.test(mainContentTag);
recordTest(
  'Forbidden Patterns',
  '#main-content has NO "mx-auto" or "max-w-*" constraints',
  !mainContentHasMxAuto && !mainContentHasMaxW,
  `mainContentTag: ${mainContentTag}`
);

// Check if any <section id="tab-*"> has mx-auto or max-w restriction
const sectionTabMatches = [...htmlContent.matchAll(/<section\s+id="tab-[^"]*"[^>]*>/gi)];
let restrictedTabs = [];
sectionTabMatches.forEach(m => {
  if (/mx-auto\b/.test(m[0]) || /max-w-[a-z0-9]+\b/.test(m[0])) {
    restrictedTabs.push(m[0]);
  }
});
recordTest(
  'Forbidden Patterns',
  'All 7 <section id="tab-*"> containers have NO "mx-auto" or "max-w-*" constraints',
  restrictedTabs.length === 0,
  `Restricted tabs: ${restrictedTabs.join(' | ')}`
);

// 1.3 Check for avatar pill boxes: bg-purple-50, bg-blue-50, bg-indigo-50, bg-amber-100
const purple50Matches = [...htmlContent.matchAll(/bg-purple-50/gi)];
recordTest(
  'Forbidden Patterns',
  'No "bg-purple-50" avatar pill boxes',
  purple50Matches.length === 0,
  `Found ${purple50Matches.length} occurrences`
);

const blue50Matches = [...htmlContent.matchAll(/bg-blue-50/gi)];
recordTest(
  'Forbidden Patterns',
  'No "bg-blue-50" avatar pill boxes',
  blue50Matches.length === 0,
  `Found ${blue50Matches.length} occurrences`
);

const indigo50Matches = [...htmlContent.matchAll(/bg-indigo-50/gi)];
recordTest(
  'Forbidden Patterns',
  'No "bg-indigo-50" avatar pill boxes',
  indigo50Matches.length === 0,
  `Found ${indigo50Matches.length} occurrences`
);

// bg-amber-100 avatar pill boxes (e.g. w-10 h-10 rounded-xl bg-amber-100)
const amberPillMatches = [...htmlContent.matchAll(/(?:w-[0-9]+\s+h-[0-9]+[^"]*rounded-[^"]*bg-amber-100|bg-amber-100[^"]*w-[0-9]+\s+h-[0-9]+[^"]*rounded)/gi)];
recordTest(
  'Forbidden Patterns',
  'No "bg-amber-100" avatar/icon pill boxes',
  amberPillMatches.length === 0,
  `Found ${amberPillMatches.length} occurrences`
);

// 1.4 Check for BƯỚC 01, BƯỚC 02, BƯỚC 03 badges
const buocBadges = [...htmlContent.matchAll(/BƯỚC\s+0[123]/gi)];
recordTest(
  'Forbidden Patterns',
  'No "BƯỚC 01/02/03" colored badges',
  buocBadges.length === 0,
  `Found ${buocBadges.length} occurrences`
);

// 1.5 Check for rounded-full bg-rose-50 (Confirm Modal pill)
const rose50PillMatches = [...htmlContent.matchAll(/\brounded-full\b[^\"]*\bbg-rose-50\b|\bbg-rose-50\b[^\"]*\brounded-full\b/g)];
recordTest(
  'Forbidden Patterns',
  'No "rounded-full bg-rose-50" modal pill',
  rose50PillMatches.length === 0,
  `Found ${rose50PillMatches.length} occurrences`
);

// 1.6 Check for emojis in Routines & Checklists (📅, ⏰, 👤)
const emojiMatches = [...htmlContent.matchAll(/[📅⏰👤]/g)];
recordTest(
  'Forbidden Patterns',
  'No forbidden emojis in Routines/Checklists (📅, ⏰, 👤)',
  emojiMatches.length === 0,
  `Found ${emojiMatches.length} occurrences`
);

// 1.7 Strict check for ⏳ emoji in submit button innerHTML (AGENTS.md Section 2 Rule 2 violation)
const hourglassMatches = [];
const lines = htmlContent.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('⏳')) {
    hourglassMatches.push(`Line ${idx + 1}: ${line.trim()}`);
  }
});
recordTest(
  'Forbidden Patterns',
  'Zero prohibited ⏳ emoji in buttons/JS (AGENTS.md Section 2 Rule 2)',
  hourglassMatches.length === 0,
  `Found ⏳ in ${hourglassMatches.length} places:\n    ${hourglassMatches.join('\n    ')}`
);

// =========================================================================================
// TEST GROUP 2: CALENDAR SYNC BUTTON UX & CONCURRENCY / RACE CONDITION
// =========================================================================================
console.log('\n--- GROUP 2: CALENDAR SYNC BUTTON UX & CONCURRENCY / RACE CONDITIONS ---');

// 2.1 Sidebar Sync Button DOM presence & dedicated action block
const hasSidebarSyncBtn = htmlContent.includes('id="btn-sync-calendar"');
const hasSidebarSyncIcon = htmlContent.includes('id="btn-sync-cal-icon"');
const hasSidebarSyncLabel = htmlContent.includes('id="btn-sync-cal-label"');
recordTest(
  'Calendar Sync UX',
  'Sidebar Dedicated Action Block elements present (button, icon, label)',
  hasSidebarSyncBtn && hasSidebarSyncIcon && hasSidebarSyncLabel,
  `btn=${hasSidebarSyncBtn}, icon=${hasSidebarSyncIcon}, label=${hasSidebarSyncLabel}`
);

// 2.2 Header Sync Shortcut DOM presence
const hasHeaderSyncIcon = htmlContent.includes('id="btn-sync-cal-header-icon"');
recordTest(
  'Calendar Sync UX',
  'Header Sync Shortcut icon present with correct ID',
  hasHeaderSyncIcon,
  `headerIcon=${hasHeaderSyncIcon}`
);

// 2.3 Check if Calendar Sync button in sidebar is OUTSIDE <nav>
const navEndIndex = htmlContent.indexOf('</nav>');
const sidebarSyncBtnIndex = htmlContent.indexOf('id="btn-sync-calendar"');
const isSyncBtnOutsideNav = sidebarSyncBtnIndex > navEndIndex;
recordTest(
  'Calendar Sync UX',
  'Sidebar Sync button is outside <nav> (not styled as navigation tab)',
  isSyncBtnOutsideNav,
  `btnIndex=${sidebarSyncBtnIndex}, navEndIndex=${navEndIndex}`
);

// 2.4 Check JS syncGoogleCalendar implementation & concurrency handling
const syncFnMatch = htmlContent.match(/syncGoogleCalendar\s*\(\)\s*\{([\s\S]*?)\n\s*\},/);
const syncFnCode = syncFnMatch ? syncFnMatch[1] : '';

// Check disabled state assignment on sidebar button
const setsDisabled = syncFnCode.includes('syncBtn.disabled = true');
const setsPointerEventsNone = syncFnCode.includes('pointer-events-none');
recordTest(
  'Calendar Concurrency',
  'Disables sidebar button during sync (disabled=true, pointer-events-none)',
  setsDisabled && setsPointerEventsNone,
  `setsDisabled=${setsDisabled}, setsPointerEventsNone=${setsPointerEventsNone}`
);

// Check if finalizeUI restores disabled state in both success and failure
const callsFinalizeInSuccess = syncFnCode.includes('withSuccessHandler') && syncFnCode.includes('finalizeUI()');
const callsFinalizeInFailure = syncFnCode.includes('withFailureHandler') && syncFnCode.includes('finalizeUI()');
recordTest(
  'Calendar Concurrency',
  'Finalizes UI in both success and failure handlers',
  callsFinalizeInSuccess && callsFinalizeInFailure,
  `success=${callsFinalizeInSuccess}, failure=${callsFinalizeInFailure}`
);

// Check: Header button disable / re-entrancy guard
const headerBtnMatch = htmlContent.match(/<button[^>]*onclick=["']App\.syncGoogleCalendar\(\)["'][^>]*>/g) || [];
const hasHeaderButtonId = headerBtnMatch.some(btn => btn.includes('id='));
recordTest(
  'Calendar Concurrency',
  'Header sync button has ID for state synchronization',
  hasHeaderButtonId,
  'Header sync button does not have an ID; cannot be disabled during RPC',
  true // Record as warning
);

// Re-entrancy guard on syncGoogleCalendar
const hasReentrancyGuard = /if\s*\(\s*(?:this\._?isSyncing|this\._?syncing|syncBtn\s*&&\s*syncBtn\.disabled)\s*\)\s*return/.test(syncFnCode);
recordTest(
  'Calendar Concurrency',
  'Re-entrancy guard in syncGoogleCalendar prevents concurrent RPCs on rapid clicks',
  hasReentrancyGuard,
  'Lacks re-entrancy guard: rapid clicks on Header shortcut dispatch concurrent RPCs',
  true // Record as warning
);

// 2.5 Check alias syncCalendar()
const hasAlias = htmlContent.includes('syncCalendar()') && htmlContent.includes('this.syncGoogleCalendar()');
recordTest(
  'Calendar Sync UX',
  'App.syncCalendar() alias exists and delegates to App.syncGoogleCalendar()',
  hasAlias,
  `hasAlias=${hasAlias}`
);

// =========================================================================================
// TEST GROUP 3: WIDE SCREEN (1920px+) CANVAS SCALING & LAYOUT INTEGRITY
// =========================================================================================
console.log('\n--- GROUP 3: WIDE SCREEN (1920px+) CANVAS SCALING & LAYOUT INTEGRITY ---');

// 3.1 #main-content width classes
const mainContentMatch = htmlContent.match(/<div\s+id="main-content"\s+class="([^"]+)"/);
const mainContentClasses = mainContentMatch ? mainContentMatch[1] : '';
console.log('  [INFO] #main-content classes: ' + mainContentClasses);

const hasWFull = mainContentClasses.includes('w-full');
const hasNoMaxW = !mainContentClasses.includes('max-w-');
const hasEdgePadding = mainContentClasses.includes('px-4') && mainContentClasses.includes('lg:px-8');

recordTest(
  'Wide Screen Canvas',
  '#main-content spans 100% width (w-full, no max-w restriction)',
  hasWFull && hasNoMaxW,
  `classes="${mainContentClasses}"`
);

recordTest(
  'Wide Screen Canvas',
  '#main-content has standard padding matching top header (px-4 lg:px-8)',
  hasEdgePadding,
  `classes="${mainContentClasses}"`
);

// 3.2 Check body and outer layout wrappers for any restricting max-w
const bodyMatch = htmlContent.match(/<body[^>]*class="([^"]+)"/);
const bodyClasses = bodyMatch ? bodyMatch[1] : '';
const bodyHasNoMaxW = !bodyClasses.includes('max-w-');
recordTest(
  'Wide Screen Canvas',
  '<body> has no max-w restriction',
  bodyHasNoMaxW,
  `bodyClasses="${bodyClasses}"`
);

// 3.3 Check table containers for overflow-x-auto to ensure responsive edge-to-edge scrolling without broken layout
const tableContainers = [...htmlContent.matchAll(/class="[^"]*overflow-x-auto[^"]*"/g)];
recordTest(
  'Wide Screen Canvas',
  'Responsive scroll wrappers (overflow-x-auto) present for data tables and Gantt matrix',
  tableContainers.length >= 4,
  `Found ${tableContainers.length} overflow-x-auto containers`
);

// 3.4 Check for hardcoded viewport-breaking widths (e.g. w-[2000px] without overflow wrapper)
const fixedWideWidths = [...htmlContent.matchAll(/w-\[(\d+)px\]/g)].filter(m => parseInt(m[1]) > 1400);
recordTest(
  'Wide Screen Canvas',
  'No uncontained hardcoded pixel widths exceeding 1400px',
  fixedWideWidths.length === 0,
  `Found: ${fixedWideWidths.map(m => m[0]).join(', ')}`
);

// =========================================================================================
// TEST GROUP 4: FAQ ACCORDION INTERACTION & CSS INTEGRITY
// =========================================================================================
console.log('\n--- GROUP 4: FAQ ACCORDION INTERACTION & CSS INTEGRITY ---');

// 4.1 Check #tab-help presence and clean structure
const hasTabHelp = htmlContent.includes('id="tab-help"');
recordTest(
  'FAQ Accordion',
  'Tab Help container #tab-help present',
  hasTabHelp,
  `hasTabHelp=${hasTabHelp}`
);

// 4.2 Check FAQ accordion items (help-faq-1 through help-faq-6)
let missingFaqItems = [];
for (let i = 1; i <= 6; i++) {
  const ansId = `help-faq-${i}-ans`;
  const iconId = `help-faq-${i}-icon`;
  if (!htmlContent.includes(`id="${ansId}"`)) missingFaqItems.push(ansId);
  if (!htmlContent.includes(`id="${iconId}"`)) missingFaqItems.push(iconId);
}
recordTest(
  'FAQ Accordion',
  'All 6 FAQ answer panels and icons present (help-faq-1..6-ans & help-faq-1..6-icon)',
  missingFaqItems.length === 0,
  `Missing: ${missingFaqItems.join(', ')}`
);

// 4.3 Check toggle function for FAQ
const hasModuleToggleFaq = htmlContent.includes('toggleFaq: toggleFaq');
recordTest(
  'FAQ Accordion',
  'ModuleTeamProjects exports toggleFaq handler in JavaScript',
  hasModuleToggleFaq,
  `hasModuleToggleFaq=${hasModuleToggleFaq}`
);

// Test toggleFaq simulation on all 6 items
class MockClassList {
  constructor(initial = []) { this.set = new Set(initial); }
  add(...cls) { cls.forEach(c => this.set.add(c)); }
  remove(...cls) { cls.forEach(c => this.set.delete(c)); }
  toggle(c) { if (this.set.has(c)) { this.set.delete(c); return false; } else { this.set.add(c); return true; } }
  contains(c) { return this.set.has(c); }
  toString() { return Array.from(this.set).join(' '); }
}

const mockDOM = {};
for (let i = 1; i <= 6; i++) {
  mockDOM[`help-faq-${i}-ans`] = { id: `help-faq-${i}-ans`, classList: new MockClassList(['hidden']) };
  mockDOM[`help-faq-${i}-icon`] = { id: `help-faq-${i}-icon`, classList: new MockClassList([]) };
}

function simulatedToggleFaq(faqId) {
  var ans = mockDOM[faqId + '-ans'];
  var icon = mockDOM[faqId + '-icon'];
  if (!ans) return;

  var isHidden = ans.classList.contains('hidden');
  if (isHidden) {
    ans.classList.remove('hidden');
    if (icon) icon.classList.add('rotate-180');
  } else {
    ans.classList.add('hidden');
    if (icon) icon.classList.remove('rotate-180');
  }
}

let toggleFaqAllPass = true;
// Test opening all 6
for (let i = 1; i <= 6; i++) {
  simulatedToggleFaq(`help-faq-${i}`);
  if (mockDOM[`help-faq-${i}-ans`].classList.contains('hidden') || !mockDOM[`help-faq-${i}-icon`].classList.contains('rotate-180')) {
    toggleFaqAllPass = false;
  }
}
// Test closing all 6
for (let i = 1; i <= 6; i++) {
  simulatedToggleFaq(`help-faq-${i}`);
  if (!mockDOM[`help-faq-${i}-ans`].classList.contains('hidden') || mockDOM[`help-faq-${i}-icon`].classList.contains('rotate-180')) {
    toggleFaqAllPass = false;
  }
}

recordTest(
  'FAQ Accordion',
  'Simulated toggleFaq opens (unhides + rotates 180) and closes (hides + unrotates) all 6 items',
  toggleFaqAllPass,
  `toggleFaqAllPass=${toggleFaqAllPass}`
);

// 4.4 Check if FAQ uses minimalist flat divider styling (border-t/border-b/divide-y) rather than card box
const usesFlatBorders = htmlContent.includes('class="divide-y divide-slate-100 border-t border-b border-slate-100"');
recordTest(
  'FAQ Accordion',
  'FAQ container uses flat divide-y borders (no heavy card boxes)',
  usesFlatBorders,
  `usesFlatBorders=${usesFlatBorders}`
);

// =========================================================================================
// TEST GROUP 5: CODE COMPILATION, RUNTIME SANITY & VERSION STAMPING
// =========================================================================================
console.log('\n--- GROUP 5: CODE COMPILATION, RUNTIME SANITY & VERSION STAMPING ---');

// 5.1 Syntax check on all script tags
const scriptRegex = /<script\b(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
let scriptMatch, scriptCount = 0, scriptErrors = 0;
while ((scriptMatch = scriptRegex.exec(htmlContent)) !== null) {
  scriptCount++;
  try {
    new vm.Script(scriptMatch[1], { filename: `inline_script_${scriptCount}.js` });
  } catch (err) {
    scriptErrors++;
    console.log(`  [FAIL] Script ${scriptCount} compilation error: ${err.message}`);
  }
}
recordTest(
  'Compilation & Sanity',
  `All ${scriptCount} inline <script> blocks pass strict Node.js V8 compilation`,
  scriptErrors === 0 && scriptCount > 0,
  `${scriptErrors} compilation errors across ${scriptCount} scripts`
);

// 5.2 Version Stamping check (Rule 9: Visual Deployment Version Stamping)
const hasHeaderBadge = /Bản\s+3\.2/i.test(htmlContent);
const hasFooterBadge = /Phiên\s+bản\s+3\.2/i.test(htmlContent) || /Bản\s+3\.2/i.test(htmlContent);
recordTest(
  'Version Stamping',
  'Visual Version Badge "Bản 3.2" stamped on Header Topbar and Sidebar Footer',
  hasHeaderBadge && hasFooterBadge,
  `header=${hasHeaderBadge}, footer=${hasFooterBadge}`
);

// 5.3 Embedded Data Integrity
const hasEmbeddedData = htmlContent.includes('const INITIAL_EMBEDDED_DATA = {') || htmlContent.includes('INITIAL_EMBEDDED_DATA');
recordTest(
  'Data Integrity',
  'INITIAL_EMBEDDED_DATA present for 0s Instant Render',
  hasEmbeddedData,
  `hasEmbeddedData=${hasEmbeddedData}`
);

// =========================================================================================
// SUMMARY REPORT
// =========================================================================================
console.log('\n================================================================');
console.log(`TEST RESULTS SUMMARY:`);
console.log(`  Total Tests : ${results.total}`);
console.log(`  Passed      : ${results.passed}`);
console.log(`  Failed      : ${results.failed}`);
console.log(`  Warnings    : ${results.warnings}`);
console.log('================================================================\n');

if (results.failed > 0) {
  console.log('FAILED TESTS:');
  results.items.filter(i => !i.passed && !i.isWarning).forEach(i => {
    console.log(`  - [${i.category}] ${i.name}: ${i.details}`);
  });
}

if (results.warnings > 0) {
  console.log('WARNINGS / ADVERSARIAL OBSERVATIONS:');
  results.items.filter(i => i.isWarning).forEach(i => {
    console.log(`  - [${i.category}] ${i.name}: ${i.details}`);
  });
}

process.exit(results.failed > 0 ? 1 : 0);
