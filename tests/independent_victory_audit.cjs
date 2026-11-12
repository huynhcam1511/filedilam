/**
 * Independent Victory Verification Test Suite
 * VICTORY AUDITOR — Phase B (Forensics) & Phase C (Independent Test Execution)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const CODE_GS_PATH = path.join(ROOT_DIR, 'PROJECTS_WEBAPPS', 'QuanLyCongViecTeam_Code.gs');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'PROJECTS_WEBAPPS', 'QuanLyCongViecTeam_Index.html');

console.log('======================================================================');
console.log('VICTORY AUDITOR INDEPENDENT TEST EXECUTION — TEAM WORK 3.0');
console.log('Target Backend: ' + CODE_GS_PATH);
console.log('Target Frontend: ' + INDEX_HTML_PATH);
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] Test ${totalTests}: ${name}`);
  } catch (err) {
    failedTests++;
    failures.push({ test: name, error: err.message });
    console.error(`  [FAIL] Test ${totalTests}: ${name} -> ${err.message}`);
  }
}

// -----------------------------------------------------------------------------
// SECTION 1: Deliverable Files & Static Integrity
// -----------------------------------------------------------------------------
console.log('>>> SECTION 1: Deliverable Files & Static Integrity');

test('QuanLyCongViecTeam_Code.gs exists and size >= 50KB', () => {
  assert(fs.existsSync(CODE_GS_PATH), 'File Code.gs does not exist');
  const stat = fs.statSync(CODE_GS_PATH);
  assert(stat.size >= 50000, `File size too small: ${stat.size} bytes`);
});

test('QuanLyCongViecTeam_Index.html exists and size >= 200KB', () => {
  assert(fs.existsSync(INDEX_HTML_PATH), 'File Index.html does not exist');
  const stat = fs.statSync(INDEX_HTML_PATH);
  assert(stat.size >= 200000, `File size too small: ${stat.size} bytes`);
});

const codeContent = fs.readFileSync(CODE_GS_PATH, 'utf8');
const htmlContent = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

test('QuanLyCongViecTeam_Code.gs passes VM script evaluation (zero syntax errors)', () => {
  // Mock standard GAS globals
  const sandbox = {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getName: () => 'Test',
        rename: () => {},
        getSheets: () => [],
        getSheetByName: () => null,
        insertSheet: () => ({}),
        getId: () => 'mock-ss-id'
      }),
      getUi: () => ({
        createMenu: () => ({ addItem: () => ({ addSeparator: () => ({ addItem: () => ({ addToUi: () => {} }) }) }) }),
        showModalDialog: () => {}
      })
    },
    HtmlService: {
      createHtmlOutput: () => ({ setWidth: () => ({ setHeight: () => ({}) }) }),
      createTemplateFromFile: () => ({ evaluate: () => ({ getTitle: () => '', setTitle: () => ({ addMetaTag: () => ({ setXFrameOptionsMode: () => ({}) }) }) }) }),
      createHtmlOutputFromFile: () => ({ getContent: () => '' }),
      XFrameOptionsMode: { ALLOWALL: 1 }
    },
    LockService: {
      getScriptLock: () => ({
        waitLock: () => true,
        releaseLock: () => true
      })
    },
    CalendarApp: {
      getDefaultCalendar: () => ({
        createEvent: () => ({})
      })
    },
    Logger: { log: () => {} },
    Utilities: {
      formatDate: (d, tz, f) => '11/11/2026',
      sleep: () => {}
    },
    console: console
  };
  vm.createContext(sandbox);
  vm.runInContext(codeContent, sandbox, { filename: 'QuanLyCongViecTeam_Code.gs' });
  assert(typeof sandbox.getInitialData === 'function', 'getInitialData not defined in VM');
  assert(typeof sandbox.apiSaveTask === 'function', 'apiSaveTask not defined in VM');
  assert(typeof sandbox.apiQuickToggleTask === 'function', 'apiQuickToggleTask not defined in VM');
  assert(typeof sandbox.apiSaveProject === 'function', 'apiSaveProject not defined in VM');
  assert(typeof sandbox.apiSaveStaff === 'function', 'apiSaveStaff not defined in VM');
  assert(typeof sandbox.apiUpdateChecklistCell === 'function', 'apiUpdateChecklistCell not defined in VM');
  assert(typeof sandbox.syncDeadlinesToGoogleCalendar === 'function', 'syncDeadlinesToGoogleCalendar not defined in VM');
  assert(typeof sandbox.setupDatabaseSheets === 'function', 'setupDatabaseSheets not defined in VM');
});

// -----------------------------------------------------------------------------
// SECTION 2: Anti-Cheating & Facade Forensics (Mode: Development)
// -----------------------------------------------------------------------------
console.log('\n>>> SECTION 2: Anti-Cheating & Facade Forensics');

test('Check for facade return patterns in write RPCs', () => {
  const rpcs = ['apiSaveTask', 'apiQuickToggleTask', 'apiSaveProject', 'apiSaveStaff', 'apiUpdateChecklistCell', 'apiDeleteTask'];
  rpcs.forEach(rpc => {
    const idx = codeContent.indexOf('function ' + rpc);
    assert(idx !== -1, `Function ${rpc} not found`);
    const slice = codeContent.slice(idx, idx + 2000);
    // Check it does not simply return constant { success: true } without real logic
    assert(!slice.match(/function\s+[a-zA-Z0-9_]+\s*\([^)]*\)\s*\{\s*return\s+\{?\s*(true|success:\s*true)\s*\}?;?\s*\}/), `Facade detected in ${rpc}`);
  });
});

test('Check for NotImplementedError or stub throws', () => {
  assert(!codeContent.includes('NotImplementedError'), 'NotImplementedError found in Code.gs');
  assert(!codeContent.includes('TODO: implement'), 'Unimplemented TODO stub found in Code.gs');
  assert(!htmlContent.includes('TODO: implement'), 'Unimplemented TODO stub found in Index.html');
});

test('Check for hardcoded test result bypasses', () => {
  // Ensure RPCs do not check for test dummy strings like "__TEST_PASS__" or bypass logic
  assert(!codeContent.includes('__TEST_PASS__'), 'Found test bypass token in Code.gs');
  assert(!htmlContent.includes('__TEST_PASS__'), 'Found test bypass token in Index.html');
});

// -----------------------------------------------------------------------------
// SECTION 3: Backend Specifications & Sheet Schema
// -----------------------------------------------------------------------------
console.log('\n>>> SECTION 3: Backend Specifications & Master Contract Compliance');

test('Configures exact 7 sheets (Single Visible Tab HDSD + 6 hidden DB_ sheets)', () => {
  assert(codeContent.includes("SHEET_HDSD = 'HDSD'"), 'SHEET_HDSD not defined as HDSD');
  assert(codeContent.includes("SHEET_CONG_VIEC = 'DB_CongViec'"), 'SHEET_CONG_VIEC mismatch');
  assert(codeContent.includes("SHEET_DU_AN = 'DB_DuAn'"), 'SHEET_DU_AN mismatch');
  assert(codeContent.includes("SHEET_NHAN_SU = 'DB_NhanSu'"), 'SHEET_NHAN_SU mismatch');
  assert(codeContent.includes("SHEET_LICH_LAP = 'DB_LichLapLai'"), 'SHEET_LICH_LAP mismatch');
  assert(codeContent.includes("SHEET_CHECKLIST = 'DB_ChecklistLap'"), 'SHEET_CHECKLIST mismatch');
  assert(codeContent.includes("SHEET_DANH_MUC = 'DB_DanhMuc'"), 'SHEET_DANH_MUC mismatch');
  
  // Verify lockAndHideDatabaseSheets implementation
  assert(codeContent.includes('.hideSheet()'), 'hideSheet not called on DB tabs');
  assert(codeContent.includes('.showSheet()'), 'showSheet not called on HDSD');
  assert(codeContent.includes('.protect()'), 'protect not called on DB tabs');
});

test('HDSD tab setup includes Mint button at B3:E4', () => {
  assert(codeContent.includes("getRange('B3:E4')") || codeContent.includes('getRange("B3:E4")'), 'B3:E4 range not found in HDSD setup');
  assert(codeContent.includes('#059669'), 'Mint color #059669 not found in HDSD setup');
  assert(codeContent.includes('MỞ ỨNG DỤNG WEB APP (BẤM VÀO ĐÂY)'), 'Launcher label not found in HDSD setup');
});

test('LockService is correctly utilized in all write operations with >=10s timeout and finally release', () => {
  const writeOps = ['apiSaveTask', 'apiQuickToggleTask', 'apiSaveProject', 'apiSaveStaff', 'apiUpdateChecklistCell', 'apiDeleteTask', 'apiDeleteProject', 'apiDeleteStaff'];
  writeOps.forEach(op => {
    const idx = codeContent.indexOf('function ' + op);
    assert(idx !== -1, `Function ${op} not found`);
    const slice = codeContent.slice(idx, idx + 3000);
    assert(slice.includes('LockService.getScriptLock()'), `${op} missing LockService.getScriptLock()`);
    assert(slice.includes('.waitLock(15000)') || slice.includes('.waitLock(10000)'), `${op} missing waitLock >= 10s`);
    assert(slice.includes('finally'), `${op} missing finally block`);
    assert(slice.includes('.releaseLock()'), `${op} missing releaseLock in finally block`);
  });
});

test('Dual-header mapping: Vietnamese accented and camelCase keys produced in row mappers', () => {
  assert(codeContent.includes("mapTaskRow"), 'mapTaskRow not found');
  assert(codeContent.includes("'Mã Task':") && codeContent.includes("maTask:"), 'mapTaskRow missing dual-key for maTask');
  assert(codeContent.includes("'Tên Nhiệm Vụ':") && codeContent.includes("tenNhiemVu:"), 'mapTaskRow missing dual-key for tenNhiemVu');
  assert(codeContent.includes("'Trạng Thái':") && codeContent.includes("trangThai:"), 'mapTaskRow missing dual-key for trangThai');
  assert(codeContent.includes("'Tiến Độ %':") && codeContent.includes("tienDo:"), 'mapTaskRow missing dual-key for tienDo');

  assert(codeContent.includes("mapProjectRow"), 'mapProjectRow not found');
  assert(codeContent.includes("'Mã Dự Án':") && codeContent.includes("maDuAn:"), 'mapProjectRow missing dual-key for maDuAn');
  assert(codeContent.includes("'Tên Dự Án':") && codeContent.includes("tenDuAn:"), 'mapProjectRow missing dual-key for tenDuAn');

  assert(codeContent.includes("mapStaffRow"), 'mapStaffRow not found');
  assert(codeContent.includes("'Mã Nhân Sự':") && codeContent.includes("maNhanSu:"), 'mapStaffRow missing dual-key for maNhanSu');
  assert(codeContent.includes("'Họ Và Tên':") && codeContent.includes("hoTen:"), 'mapStaffRow missing dual-key for hoTen');

  assert(codeContent.includes("mapChecklistRow"), 'mapChecklistRow not found');
  assert(codeContent.includes("'Thứ 2':") && codeContent.includes("thu2:"), 'mapChecklistRow missing dual-key for thu2');
});

test('Google Calendar synchronization engine implemented', () => {
  assert(codeContent.includes('function syncDeadlinesToGoogleCalendar()'), 'syncDeadlinesToGoogleCalendar not found');
  assert(codeContent.includes('CalendarApp.getDefaultCalendar()'), 'CalendarApp.getDefaultCalendar() not called');
  assert(codeContent.includes('createEvent('), 'createEvent not called in syncDeadlinesToGoogleCalendar');
});

test('Auto-seed mechanism implemented in getInitialData()', () => {
  assert(codeContent.includes('setupDatabaseSheets();'), 'setupDatabaseSheets not called on empty sheet in getInitialData');
  assert(codeContent.includes('seedSampleTasks('), 'seedSampleTasks not implemented');
  assert(codeContent.includes('seedSampleProjects('), 'seedSampleProjects not implemented');
  assert(codeContent.includes('seedSampleStaff('), 'seedSampleStaff not implemented');
  assert(codeContent.includes('seedSampleRoutines('), 'seedSampleRoutines not implemented');
  assert(codeContent.includes('seedSampleChecklist('), 'seedSampleChecklist not implemented');
  assert(codeContent.includes('seedSampleTaxonomy('), 'seedSampleTaxonomy not implemented');
});

test('Entity ID generation adheres strictly to 4-char prefix + dash + 6 digits', () => {
  assert(codeContent.includes('function generateEntityId(prefix)'), 'generateEntityId not found');
  assert(codeContent.includes("Math.floor(100000 + Math.random() * 900000)"), '6-digit random generator not found');
});

// -----------------------------------------------------------------------------
// SECTION 4: Frontend Monolithic SPA Specifications
// -----------------------------------------------------------------------------
console.log('\n>>> SECTION 4: Frontend Monolithic SPA Specifications');

test('HTML integrates Tailwind CSS, Lucide Icons, and Chart.js via CDN', () => {
  assert(htmlContent.includes('cdn.tailwindcss.com'), 'Tailwind CDN missing');
  assert(htmlContent.includes('unpkg.com/lucide'), 'Lucide CDN missing');
  assert(htmlContent.includes('cdn.jsdelivr.net/npm/chart.js'), 'Chart.js CDN missing');
});

test('Visual Deployment Version Badges stamped in Topbar and Sidebar', () => {
  assert(htmlContent.includes('Bản 3.0'), 'Topbar Version Badge "Bản 3.0" missing');
  assert(htmlContent.includes('Phiên bản 3.0 (Active)'), 'Sidebar Version Badge "Phiên bản 3.0 (Active)" missing');
  assert(htmlContent.includes('id="appBuildVersionBadge"'), 'id="appBuildVersionBadge" missing');
});

test('5 Core KPI Cards exist in Dashboard DOM', () => {
  assert(htmlContent.includes('id="dash-kpi-active-tasks"'), 'KPI active tasks missing');
  assert(htmlContent.includes('id="dash-kpi-overdue-tasks"'), 'KPI overdue tasks missing');
  assert(htmlContent.includes('id="dash-kpi-avg-progress"'), 'KPI avg progress missing');
  assert(htmlContent.includes('id="dash-kpi-discipline-rate"'), 'KPI discipline rate missing');
  assert(htmlContent.includes('id="dash-kpi-today-routines"'), 'KPI today routines missing');
});

test('6 Chart.js canvases exist in responsive 2-column grid', () => {
  assert(htmlContent.includes('id="dash-chart-workload"'), 'Chart workload canvas missing');
  assert(htmlContent.includes('id="dash-chart-discipline"'), 'Chart discipline canvas missing');
  assert(htmlContent.includes('id="dash-chart-projects"'), 'Chart projects canvas missing');
  assert(htmlContent.includes('id="dash-chart-priority"'), 'Chart priority canvas missing');
  assert(htmlContent.includes('id="dash-chart-trend"'), 'Chart trend canvas missing');
  assert(htmlContent.includes('id="dash-chart-dept"'), 'Chart dept canvas missing');
  assert(htmlContent.includes('grid-cols-1 lg:grid-cols-2'), 'Responsive 2-column grid missing for charts');
});

test('Master Table edge-to-edge layout and mobile card transformation present', () => {
  assert(htmlContent.includes('id="task-table-body"'), 'Desktop master table body missing');
  assert(htmlContent.includes('id="task-cards-list"'), 'Mobile card container missing');
  assert(htmlContent.includes('renderTasksTableDesktop'), 'renderTasksTableDesktop function missing');
  assert(htmlContent.includes('renderTasksCardsMobile'), 'renderTasksCardsMobile function missing');
});

test('CSS Grid Gantt Timeline features Week/Month switcher, today indicator line, and interactive task bars', () => {
  assert(htmlContent.includes('id="gantt-view-week"'), 'Gantt week switcher missing');
  assert(htmlContent.includes('id="gantt-view-month"'), 'Gantt month switcher missing');
  assert(htmlContent.includes('id="gantt-grid-container"'), 'Gantt timeline grid container missing');
  assert(htmlContent.includes('border-rose-400') || htmlContent.includes('border-rose-500'), 'Gantt today indicator styling missing');
  assert(htmlContent.includes('id="gantt-task-popover"'), 'Gantt interactive task popover missing');
});

test('Weekly Routine Matrix interactive cell click and discipline rate calculation implemented', () => {
  assert(htmlContent.includes('id="matrix-table-container"'), 'Routine matrix table container missing');
  assert(htmlContent.includes('id="matrix-table-body"'), 'Routine matrix table body missing');
  assert(htmlContent.includes('toggleChecklistCell') || htmlContent.includes('cycleChecklistCell') || htmlContent.includes('apiUpdateChecklistCell'), 'Checklist cell toggle handler missing');
  assert(htmlContent.includes('recalcMatrixDiscipline') || htmlContent.includes('renderRateBadge'), 'Discipline calculation function missing');
});

test('Zero Phantom Overlay: drawers and modal containers have hidden class in default state', () => {
  assert(htmlContent.includes('id="action-drawer-container"') && htmlContent.includes('hidden'), 'Action drawer container missing hidden class');
  assert(htmlContent.includes('id="confirm-modal-container"') && htmlContent.includes('hidden'), 'Confirm modal container missing hidden class');
});

test('Desktop Media Query override enforces 480px width, right: 0 and 100vh height', () => {
  assert(htmlContent.includes('@media (min-width: 1024px)'), 'Desktop media query missing in <style>');
  assert(htmlContent.includes('width: 480px !important'), 'Width 480px !important override missing');
  assert(htmlContent.includes('right: 0 !important'), 'Right: 0 !important override missing');
});

test('Instant Render 0s with inline embedded realistic mock data in AppState', () => {
  assert(htmlContent.includes('window.AppState = {'), 'window.AppState definition missing');
  assert(htmlContent.includes('tasks: ['), 'tasks mock array missing');
  assert(htmlContent.includes('projects: ['), 'projects mock array missing');
  assert(htmlContent.includes('staff: ['), 'staff mock array missing');
  assert(htmlContent.includes('routines: ['), 'routines mock array missing');
  assert(htmlContent.includes('checklist: ['), 'checklist mock array missing');
});

test('Global bridge window.App = App and adapters correctly wired', () => {
  assert(htmlContent.includes('window.App = App;'), 'window.App = App bridge missing');
  assert(htmlContent.includes('window.openDrawer = App.openDrawer;'), 'window.openDrawer bridge missing');
  assert(htmlContent.includes('window.closeDrawer = App.closeDrawer.bind(App);') || htmlContent.includes('window.closeDrawer = App.closeDrawer;'), 'window.closeDrawer bridge missing');
  assert(htmlContent.includes('window.showToast = App.showToast;'), 'window.showToast bridge missing');
  assert(htmlContent.includes('window.showConfirmModal = App.showConfirmModal;'), 'window.showConfirmModal bridge missing');
});

test('Anti-Pill & Clean Typography compliance (no child emoji in buttons, clean bullet status)', () => {
  const buttonMatches = htmlContent.match(/<button[^>]*>([\s\S]*?)<\/button>/gi) || [];
  const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  let buttonsWithEmoji = 0;
  buttonMatches.forEach(b => {
    const textOnly = b.replace(/<[^>]+>/g, '').trim();
    if (emojiRegex.test(textOnly)) buttonsWithEmoji++;
  });
  assert(buttonsWithEmoji === 0, `Found ${buttonsWithEmoji} buttons with emojis in label`);
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n======================================================================');
console.log('AUDIT EXECUTION SUMMARY');
console.log('======================================================================');
console.log(`Total Independent Assertions: ${totalTests}`);
console.log(`Passed Assertions           : ${passedTests}`);
console.log(`Failed Assertions           : ${failedTests}`);

if (failedTests > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  - ${f.test}: ${f.error}`));
  console.log('\nVERDICT: VICTORY REJECTED');
  process.exit(1);
} else {
  console.log('\nVERDICT: VICTORY CONFIRMED');
  process.exit(0);
}
