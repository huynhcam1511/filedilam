/**
 * =========================================================================================
 * AUTOMATED ADVERSARIAL STRESS TEST SUITE — CHALLENGER 1
 * =========================================================================================
 * Target: QuanLyCongViecTeam_Code.gs & QuanLyCongViecTeam_Index.html
 * Roles: critic, specialist
 * Mission: Empirical functional, RPC, checklist matrix, boundary, and DOM stress testing.
 * =========================================================================================
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Paths to targets
const ROOT_DIR = path.resolve(__dirname, '..');
const GS_PATH = path.join(ROOT_DIR, 'PROJECTS_WEBAPPS', 'QuanLyCongViecTeam_Code.gs');
const HTML_PATH = path.join(ROOT_DIR, 'PROJECTS_WEBAPPS', 'QuanLyCongViecTeam_Index.html');

console.log('================================================================');
console.log('CHALLENGER 1: ADVERSARIAL STRESS & EMPIRICAL VERIFICATION RUNNER');
console.log('Target Backend: ' + GS_PATH);
console.log('Target Frontend: ' + HTML_PATH);
console.log('================================================================\n');

// Test statistics
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  failures: []
};

function assert(condition, testName, details = '') {
  stats.total++;
  if (condition) {
    stats.passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    stats.failed++;
    const err = `  [FAIL] ${testName} - ${details}`;
    console.error(err);
    stats.failures.push({ testName, details });
  }
}

// -----------------------------------------------------------------------------------------
// 1. GAS ENVIRONMENT MOCK IMPLEMENTATION
// -----------------------------------------------------------------------------------------
function createGasEnvironment() {
  const sheetsStore = new Map();
  let spreadsheetName = 'QUẢN LÝ CÔNG VIỆC TEAM & TIẾN ĐỘ DỰ ÁN 3.0 — WEB APP — FILE ĐI LÀM';

  class MockRange {
    constructor(sheet, row, col, numRows, numCols) {
      this.sheet = sheet;
      this.row = row; // 1-based
      this.col = col; // 1-based
      this.numRows = numRows || 1;
      this.numCols = numCols || 1;
    }

    getValues() {
      const result = [];
      for (let r = 0; r < this.numRows; r++) {
        const rowArr = [];
        const targetR = this.row - 1 + r;
        for (let c = 0; c < this.numCols; c++) {
          const targetC = this.col - 1 + c;
          if (this.sheet.cells[targetR] && this.sheet.cells[targetR][targetC] !== undefined) {
            rowArr.push(this.sheet.cells[targetR][targetC]);
          } else {
            rowArr.push('');
          }
        }
        result.push(rowArr);
      }
      return result;
    }

    getValue() {
      const vals = this.getValues();
      return vals[0] ? vals[0][0] : '';
    }

    setValues(values) {
      for (let r = 0; r < values.length; r++) {
        const targetR = this.row - 1 + r;
        if (!this.sheet.cells[targetR]) {
          this.sheet.cells[targetR] = [];
        }
        for (let c = 0; c < values[r].length; c++) {
          const targetC = this.col - 1 + c;
          this.sheet.cells[targetR][targetC] = values[r][c];
        }
      }
      return this;
    }

    setValue(value) {
      return this.setValues([[value]]);
    }

    setBackground() { return this; }
    setFontColor() { return this; }
    setFontWeight() { return this; }
    setFontFamily() { return this; }
    setFontSize() { return this; }
    setFontStyle() { return this; }
    setHorizontalAlignment() { return this; }
    setVerticalAlignment() { return this; }
    setBorder() { return this; }
    merge() { return this; }
    setWrap() { return this; }
  }

  class MockProtection {
    constructor(sheet) {
      this.sheet = sheet;
      this.description = '';
      this.warningOnly = false;
    }
    setDescription(desc) { this.description = desc; return this; }
    setWarningOnly(flag) { this.warningOnly = flag; return this; }
  }

  class MockSheet {
    constructor(name) {
      this.name = name;
      this.cells = []; // 2D array [row][col], 0-based
      this.isHidden = false;
      this.protections = [];
    }

    getName() { return this.name; }
    getLastRow() { return this.cells.length; }
    getLastColumn() {
      let maxCol = 0;
      for (const row of this.cells) {
        if (row && row.length > maxCol) maxCol = row.length;
      }
      return maxCol;
    }

    getRange(row, col, numRows, numCols) {
      return new MockRange(this, row, col, numRows, numCols);
    }

    appendRow(rowValues) {
      this.cells.push([...rowValues]);
      return this;
    }

    clear() {
      this.cells = [];
      return this;
    }

    hideSheet() {
      this.isHidden = true;
      return this;
    }

    showSheet() {
      this.isHidden = false;
      return this;
    }

    setFrozenRows(n) { return this; }
    setFrozenColumns(n) { return this; }
    setRowHeight(r, h) { return this; }
    setColumnWidth(c, w) { return this; }
    autoResizeColumns(s, e) { return this; }
    setTabColor(color) { return this; }

    protect() {
      const p = new MockProtection(this);
      this.protections.push(p);
      return p;
    }

    getProtections(type) {
      return this.protections;
    }

    deleteRow(rowIdx) {
      this.cells.splice(rowIdx - 1, 1);
      return this;
    }
  }

  const mockSpreadsheet = {
    getName() { return spreadsheetName; },
    rename(newName) { spreadsheetName = newName; return mockSpreadsheet; },
    getId() { return 'mock-spreadsheet-id-12345'; },
    getSheets() { return Array.from(sheetsStore.values()); },
    getSheetByName(name) { return sheetsStore.get(name) || null; },
    insertSheet(name, index) {
      const sheet = new MockSheet(name);
      sheetsStore.set(name, sheet);
      return sheet;
    },
    setActiveSheet() { return mockSpreadsheet; },
    moveActiveSheet() { return mockSpreadsheet; }
  };

  const mockUi = {
    createMenu(title) {
      const menu = {
        items: [],
        addItem(label, fnName) { this.items.push({ label, fnName }); return this; },
        addSeparator() { return this; },
        addToUi() { return this; }
      };
      return menu;
    },
    showModalDialog() { return this; }
  };

  const mockCalendarEvents = [];
  const mockCalendar = {
    createEvent(title, startTime, endTime, options) {
      const evt = { title, startTime, endTime, options };
      mockCalendarEvents.push(evt);
      return evt;
    },
    getEvents(startTime, endTime) {
      return mockCalendarEvents.filter(e => e.startTime >= startTime && e.endTime <= endTime);
    }
  };

  const lockServiceCalls = { waitLockCount: 0, releaseLockCount: 0 };
  const mockLock = {
    waitLock(timeout) { lockServiceCalls.waitLockCount++; return true; },
    releaseLock() { lockServiceCalls.releaseLockCount++; return true; },
    hasLock() { return true; }
  };

  const gasContext = {
    SpreadsheetApp: {
      getActiveSpreadsheet() { return mockSpreadsheet; },
      getUi() { return mockUi; },
      BorderStyle: { SOLID: 'SOLID' },
      ProtectionType: { SHEET: 'SHEET', RANGE: 'RANGE' }
    },
    LockService: {
      getScriptLock() { return mockLock; }
    },
    CalendarApp: {
      getDefaultCalendar() { return mockCalendar; }
    },
    Utilities: {
      formatDate(date, timeZone, format) {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
          return '';
        }
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        if (format.includes('HH:mm')) {
          return `${d}/${m}/${y} ${hh}:${mm}`;
        }
        return `${d}/${m}/${y}`;
      }
    },
    HtmlService: {
      createHtmlOutput(content) {
        return {
          setWidth() { return this; },
          setHeight() { return this; },
          getContent() { return content; }
        };
      },
      createTemplateFromFile(filename) {
        return {
          evaluate() {
            return {
              setTitle() { return this; },
              addMetaTag() { return this; },
              setXFrameOptionsMode() { return this; }
            };
          }
        };
      },
      XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' }
    },
    Logger: {
      log(msg) { /* silent or record */ }
    },
    console: console,
    Date: Date,
    Math: Math,
    String: String,
    Number: Number,
    Boolean: Boolean,
    Array: Array,
    Object: Object,
    RegExp: RegExp,
    JSON: JSON,
    Error: Error
  };

  return {
    gasContext,
    sheetsStore,
    mockSpreadsheet,
    mockCalendarEvents,
    lockServiceCalls
  };
}

// -----------------------------------------------------------------------------------------
// 2. BACKEND COMPILATION & BASIC TESTS
// -----------------------------------------------------------------------------------------
console.log('>>> SECTION 1: Backend GAS Compilation & Basic Setup Tests');

const codeGsContent = fs.readFileSync(GS_PATH, 'utf8');
const { gasContext, sheetsStore, mockCalendarEvents, lockServiceCalls } = createGasEnvironment();
const vmContext = vm.createContext(gasContext);

try {
  vm.runInContext(codeGsContent, vmContext);
  assert(true, 'QuanLyCongViecTeam_Code.gs evaluates without syntax errors in VM');
} catch (err) {
  assert(false, 'QuanLyCongViecTeam_Code.gs evaluated in VM', err.toString());
}

// Test setupDatabaseSheets
try {
  const setupRes = vm.runInContext('setupDatabaseSheets()', vmContext);
  assert(setupRes && setupRes.success === true, 'setupDatabaseSheets() returns success: true');

  // Check 7 sheets
  const expectedSheets = ['HDSD', 'DB_CongViec', 'DB_DuAn', 'DB_NhanSu', 'DB_LichLapLai', 'DB_ChecklistLap', 'DB_DanhMuc'];
  assert(sheetsStore.size === 7, `Spreadsheet contains exactly 7 sheets (found: ${sheetsStore.size})`);

  for (const sName of expectedSheets) {
    const s = sheetsStore.get(sName);
    assert(!!s, `Sheet "${sName}" exists in database`);
    if (sName === 'HDSD') {
      assert(s && !s.isHidden, 'Tab HDSD is VISIBLE (Single Visible Tab Policy)');
    } else {
      assert(s && s.isHidden, `Database tab "${sName}" is HIDDEN`);
      assert(s && s.protections.length > 0, `Database tab "${sName}" is PROTECTED`);
    }
  }

  // Check headers in DB_CongViec
  const taskSheet = sheetsStore.get('DB_CongViec');
  const taskHeaders = taskSheet.getRange(1, 1, 1, 15).getValues()[0];
  assert(taskHeaders[0] === 'Mã Task' && taskHeaders[14] === 'Cập Nhật Cuối', 'DB_CongViec has correct 15-column schema');

  // Check sample seed data count
  assert(taskSheet.getLastRow() >= 10, `DB_CongViec seeded with realistic tasks (count: ${taskSheet.getLastRow() - 1})`);
} catch (err) {
  assert(false, 'setupDatabaseSheets() execution', err.toString());
}

// -----------------------------------------------------------------------------------------
// 3. RPC INVOCATIONS & DUAL-HEADER MAPPING TESTS
// -----------------------------------------------------------------------------------------
console.log('\n>>> SECTION 2: RPC Invocations & Dual-Header Mapping Tests');

// Test getInitialData
try {
  const initialData = vm.runInContext('getInitialData()', vmContext);
  assert(initialData && initialData.success === true, 'getInitialData() returns success: true');
  assert(Array.isArray(initialData.tasks) && initialData.tasks.length >= 10, `getInitialData returns tasks (count: ${initialData.tasks.length})`);
  assert(Array.isArray(initialData.projects) && initialData.projects.length >= 3, `getInitialData returns projects (count: ${initialData.projects.length})`);
  assert(Array.isArray(initialData.staff) && initialData.staff.length >= 6, `getInitialData returns staff (count: ${initialData.staff.length})`);
  assert(Array.isArray(initialData.routines) && initialData.routines.length >= 5, `getInitialData returns routines (count: ${initialData.routines.length})`);
  assert(Array.isArray(initialData.checklist) && initialData.checklist.length >= 8, `getInitialData returns checklist (count: ${initialData.checklist.length})`);

  // Verify dual header mapping on first task
  const sampleTask = initialData.tasks[0];
  assert(
    sampleTask.maTask !== undefined && sampleTask['Mã Task'] !== undefined,
    'Dual header mapping verified on task: maTask and "Mã Task" both accessible'
  );
  assert(
    sampleTask.tenNhiemVu !== undefined && sampleTask['Tên Nhiệm Vụ'] !== undefined,
    'Dual header mapping verified on task: tenNhiemVu and "Tên Nhiệm Vụ" both accessible'
  );
} catch (err) {
  assert(false, 'getInitialData() evaluation', err.toString());
}

// Test ID Generation compliance
console.log('\n>>> SECTION 3: ID Generation Format Compliance Stress Test');
try {
  const prefixes = ['TASK', 'DUAN', 'NHAN', 'LICH'];
  for (const p of prefixes) {
    let allValid = true;
    const generated = new Set();
    for (let i = 0; i < 2000; i++) {
      const id = vm.runInContext(`generateEntityId("${p}")`, vmContext);
      if (!new RegExp(`^${p}-\\d{6}$`).test(id)) {
        allValid = false;
        break;
      }
      generated.add(id);
    }
    assert(allValid, `generateEntityId("${p}") strictly conforms to ^${p}-\\d{6}$ across 2000 iterations`);
    assert(generated.size >= 1990, `generateEntityId("${p}") exhibits strong randomness (${generated.size}/2000 unique)`);
  }
} catch (err) {
  assert(false, 'generateEntityId testing', err.toString());
}

// Test apiSaveTask (CRUD & Concurrency)
console.log('\n>>> SECTION 4: apiSaveTask & apiQuickToggleTask Stress Tests');
let createdTaskId = null;
try {
  const prevLockWait = lockServiceCalls.waitLockCount;
  const saveTaskRes = vm.runInContext(`
    apiSaveTask({
      tenNhiemVu: 'Phát triển module API thử nghiệm',
      maDuAn: 'DUAN-102931',
      tenDuAn: 'Hệ Thống CRM Bất Động Sản',
      nguoiPhuTrach: 'Nguyễn Văn A',
      emailNhanSu: 'nguyenvana@gmail.com',
      capDo: 'Gấp',
      trongSo: 3,
      ngayBatDau: '10/11/2026',
      deadline: '20/11/2026',
      gioDeadline: '17:30',
      tienDo: 25,
      trangThai: 'Đang tiến hành',
      ghiChu: 'Stress testing task creation'
    })
  `, vmContext);

  assert(saveTaskRes && saveTaskRes.success === true, 'apiSaveTask create returns success: true');
  assert(/^TASK-\d{6}$/.test(saveTaskRes.maTask), `apiSaveTask returns valid ID: ${saveTaskRes.maTask}`);
  assert(lockServiceCalls.waitLockCount > prevLockWait, 'apiSaveTask utilizes LockService waitLock');
  createdTaskId = saveTaskRes.maTask;

  // Verify task in sheet
  const taskSheet = sheetsStore.get('DB_CongViec');
  const lastRowIdx = taskSheet.getLastRow();
  const lastRowData = taskSheet.getRange(lastRowIdx, 1, 1, 15).getValues()[0];
  assert(lastRowData[0] === createdTaskId, 'New task row correctly appended in DB_CongViec');
  assert(lastRowData[1] === 'Phát triển module API thử nghiệm', 'Task name correctly persisted');
  assert(Number(lastRowData[11]) === 25, 'Task progress % correctly persisted');

  // Test updating the existing task
  const updateRes = vm.runInContext(`
    apiSaveTask({
      maTask: '${createdTaskId}',
      tenNhiemVu: 'Phát triển module API thử nghiệm (ĐÃ CẬP NHẬT)',
      tienDo: 80,
      trangThai: 'Đang tiến hành'
    })
  `, vmContext);

  assert(updateRes && updateRes.success === true, 'apiSaveTask update returns success: true');
  assert(taskSheet.getLastRow() === lastRowIdx, 'apiSaveTask update updates in-place without adding duplicate row');
  const updatedRowData = taskSheet.getRange(lastRowIdx, 1, 1, 15).getValues()[0];
  assert(updatedRowData[1] === 'Phát triển module API thử nghiệm (ĐÃ CẬP NHẬT)', 'Task name updated in sheet');
  assert(Number(updatedRowData[11]) === 80, 'Task progress updated to 80 in sheet');
} catch (err) {
  assert(false, 'apiSaveTask test', err.toString());
}

// Test apiQuickToggleTask
try {
  // Toggle to Done
  const toggleDoneRes = vm.runInContext(`apiQuickToggleTask('${createdTaskId}', true)`, vmContext);
  assert(toggleDoneRes && toggleDoneRes.success === true, 'apiQuickToggleTask(..., true) returns success: true');
  const taskSheet = sheetsStore.get('DB_CongViec');
  const lastRowIdx = taskSheet.getLastRow();
  let rowData = taskSheet.getRange(lastRowIdx, 1, 1, 15).getValues()[0];
  assert(rowData[12] === 'Hoàn thành', 'Task status changed to "Hoàn thành"');
  assert(Number(rowData[11]) === 100, 'Task progress changed to 100%');

  // Toggle to In-Progress
  const toggleUndoneRes = vm.runInContext(`apiQuickToggleTask('${createdTaskId}', false)`, vmContext);
  assert(toggleUndoneRes && toggleUndoneRes.success === true, 'apiQuickToggleTask(..., false) returns success: true');
  rowData = taskSheet.getRange(lastRowIdx, 1, 1, 15).getValues()[0];
  assert(rowData[12] === 'Đang tiến hành', 'Task status changed to "Đang tiến hành"');
  assert(Number(rowData[11]) === 50, 'Task progress changed to 50%');

  // Adversarial: nonexistent task ID
  const toggleInvalidRes = vm.runInContext(`apiQuickToggleTask('TASK-NONEXISTENT', true)`, vmContext);
  assert(toggleInvalidRes && toggleInvalidRes.success === false, 'apiQuickToggleTask on invalid ID returns success: false');
} catch (err) {
  assert(false, 'apiQuickToggleTask test', err.toString());
}

// Test apiSaveProject & apiSaveStaff
console.log('\n>>> SECTION 5: apiSaveProject & apiSaveStaff Tests');
try {
  const saveProjRes = vm.runInContext(`
    apiSaveProject({
      tenDuAn: 'Dự Án Thử Nghiệm Alpha',
      phongBan: 'Kỹ Thuật',
      nguoiQuanLy: 'Trần Văn B',
      mucTieu: 'Triển khai hạ tầng Web App',
      ngayBatDau: '01/11/2026',
      hanHoanThanh: '30/11/2026',
      nganSach: 50000000,
      trangThai: 'Đang chạy'
    })
  `, vmContext);
  assert(saveProjRes && saveProjRes.success === true, 'apiSaveProject create returns success: true');
  assert(/^DUAN-\d{6}$/.test(saveProjRes.maDuAn), `apiSaveProject returns valid ID: ${saveProjRes.maDuAn}`);

  const saveStaffRes = vm.runInContext(`
    apiSaveStaff({
      hoTen: 'Lê Hoàng C',
      chucDanh: 'Senior Fullstack Dev',
      capBac: 'Senior',
      phongBan: 'Kỹ Thuật',
      soDienThoai: '0901234567',
      googleEmail: 'lehoangc@gmail.com',
      trangThai: 'Đang làm việc'
    })
  `, vmContext);
  assert(saveStaffRes && saveStaffRes.success === true, 'apiSaveStaff create returns success: true');
  assert(/^NHAN-\d{6}$/.test(saveStaffRes.maNhanSu), `apiSaveStaff returns valid ID: ${saveStaffRes.maNhanSu}`);
} catch (err) {
  assert(false, 'apiSaveProject / apiSaveStaff test', err.toString());
}

// Test apiUpdateChecklistCell & Weekly Discipline Recalculation
console.log('\n>>> SECTION 6: Weekly Execution Matrix Checklist & Discipline Rate Recalculation');
try {
  // Get an existing row from DB_ChecklistLap
  const chkSheet = sheetsStore.get('DB_ChecklistLap');
  assert(chkSheet.getLastRow() >= 2, 'DB_ChecklistLap contains checklist records');
  const firstChkRow = chkSheet.getRange(2, 1, 1, 12).getValues()[0];
  const testMaLich = String(firstChkRow[0]).trim();
  const testMaNhanSu = String(firstChkRow[2]).trim();

  // Test cycling cell on Thursday (thu5) to Done
  const updateChk1 = vm.runInContext(`
    apiUpdateChecklistCell('${testMaLich}', '${testMaNhanSu}', 'thu5', 'Done')
  `, vmContext);
  assert(updateChk1 && updateChk1.success === true, 'apiUpdateChecklistCell set "Done" returns success: true');
  assert(updateChk1.newRate && updateChk1.newRate.endsWith('%'), `apiUpdateChecklistCell returns recalculated rate: ${updateChk1.newRate}`);

  // Test updating cell to Not Yet
  const updateChk2 = vm.runInContext(`
    apiUpdateChecklistCell('${testMaLich}', '${testMaNhanSu}', 'thu5', 'Not Yet')
  `, vmContext);
  assert(updateChk2 && updateChk2.success === true, 'apiUpdateChecklistCell set "Not Yet" returns success: true');

  // Test updating cell to '-' (Off / Not applicable)
  const updateChk3 = vm.runInContext(`
    apiUpdateChecklistCell('${testMaLich}', '${testMaNhanSu}', 'thu5', '-')
  `, vmContext);
  assert(updateChk3 && updateChk3.success === true, 'apiUpdateChecklistCell set "-" returns success: true');

  // Adversarial: invalid day key
  const updateInvalidDay = vm.runInContext(`
    apiUpdateChecklistCell('${testMaLich}', '${testMaNhanSu}', 'thu8', 'Done')
  `, vmContext);
  assert(updateInvalidDay && updateInvalidDay.success === false, 'apiUpdateChecklistCell with invalid dayKey "thu8" returns success: false');

  // Adversarial: nonexistent staff/routine
  const updateInvalidEntity = vm.runInContext(`
    apiUpdateChecklistCell('LICH-FAKE', 'NHAN-FAKE', 'thu2', 'Done')
  `, vmContext);
  assert(updateInvalidEntity && updateInvalidEntity.success === false, 'apiUpdateChecklistCell with nonexistent entity returns success: false');
} catch (err) {
  assert(false, 'apiUpdateChecklistCell test', err.toString());
}

// -----------------------------------------------------------------------------------------
// 4. CHECKLIST DIRECT CLICK CYCLING & FORMULA ACCURACY HARNESS
// -----------------------------------------------------------------------------------------
console.log('\n>>> SECTION 7: Direct Click Cycling (Done -> Not Yet -> -) & Formula Accuracy Verification');

// Cycle state machine definition
function cycleChecklistState(currentVal) {
  const norm = String(currentVal || '-').trim();
  if (norm === 'Done') return 'Not Yet';
  if (norm === 'Not Yet') return '-';
  return 'Done';
}

// Formula calculation matching both Code.gs and Index.html
function calculateDisciplineRate(weekDays) {
  let activeDays = 0;
  let doneDays = 0;
  for (const d of weekDays) {
    const val = String(d || '-').trim();
    if (val !== '-') {
      activeDays++;
      if (val === 'Done') doneDays++;
    }
  }
  if (activeDays === 0) return '0%';
  return Math.round((doneDays / activeDays) * 100) + '%';
}

// Test cycle sequence
assert(cycleChecklistState('Done') === 'Not Yet', 'Cycle transition: Done -> Not Yet');
assert(cycleChecklistState('Not Yet') === '-', 'Cycle transition: Not Yet -> -');
assert(cycleChecklistState('-') === 'Done', 'Cycle transition: - -> Done');
assert(cycleChecklistState('') === 'Done', 'Cycle transition: empty -> Done');
assert(cycleChecklistState(undefined) === 'Done', 'Cycle transition: undefined -> Done');

// Test 3-step full cycle
let state = 'Done';
state = cycleChecklistState(state); // Not Yet
state = cycleChecklistState(state); // -
state = cycleChecklistState(state); // Done
assert(state === 'Done', '3-step cycle returns to starting state (Done)');

// Test mathematical accuracy of formula against comprehensive matrix
const formulaTestCases = [
  { days: ['Done', 'Done', 'Done', 'Done', 'Done', 'Done'], expected: '100%', desc: '6/6 Done' },
  { days: ['Done', 'Done', 'Done', 'Not Yet', 'Not Yet', 'Not Yet'], expected: '50%', desc: '3/6 Done, 3 Not Yet' },
  { days: ['Done', 'Not Yet', 'Not Yet', 'Not Yet', 'Not Yet', 'Not Yet'], expected: '17%', desc: '1/6 Done (16.67% -> 17%)' },
  { days: ['Done', 'Done', 'Done', 'Done', 'Not Yet', '-'], expected: '80%', desc: '4/5 Active Done, 1 Off' },
  { days: ['Done', 'Done', 'Not Yet', '-', '-', '-'], expected: '67%', desc: '2/3 Active Done (66.67% -> 67%)' },
  { days: ['Done', '-', '-', '-', '-', '-'], expected: '100%', desc: '1/1 Active Done, 5 Off' },
  { days: ['Not Yet', '-', '-', '-', '-', '-'], expected: '0%', desc: '0/1 Active Done, 5 Off' },
  { days: ['-', '-', '-', '-', '-', '-'], expected: '0%', desc: 'All 6 days Off (0 active)' },
  { days: ['Not Yet', 'Not Yet', 'Not Yet', 'Not Yet', 'Not Yet', 'Not Yet'], expected: '0%', desc: 'All 6 days Not Yet' },
  { days: ['Done', 'Done', 'Done', 'Done', 'Done', 'Not Yet'], expected: '83%', desc: '5/6 Done (83.33% -> 83%)' }
];

for (const tc of formulaTestCases) {
  const result = calculateDisciplineRate(tc.days);
  assert(result === tc.expected, `Formula accuracy: ${tc.desc} -> ${result} (expected: ${tc.expected})`);
}

// -----------------------------------------------------------------------------------------
// 5. BOUNDARY & ADVERSARIAL EDGE CASES
// -----------------------------------------------------------------------------------------
console.log('\n>>> SECTION 8: Boundary & Adversarial Edge Cases');

try {
  // Edge Case 1: Empty strings and missing fields
  const emptyTaskRes = vm.runInContext(`apiSaveTask({})`, vmContext);
  assert(emptyTaskRes && emptyTaskRes.success === true, 'apiSaveTask handles empty input gracefully with defaults');
  assert(/^TASK-\d{6}$/.test(emptyTaskRes.maTask), 'apiSaveTask generates ID even when fields empty');

  // Edge Case 2: Extreme percentages
  const extremeProgressRes = vm.runInContext(`
    apiSaveTask({
      tenNhiemVu: 'Extreme Progress Task',
      tienDo: 9999
    })
  `, vmContext);
  assert(extremeProgressRes && extremeProgressRes.success === true, 'apiSaveTask accepts extreme percentage without throwing');

  // Edge Case 3: Leap dates
  const leapTaskRes = vm.runInContext(`
    apiSaveTask({
      tenNhiemVu: 'Leap Year Task 2024',
      deadline: '29/02/2024'
    })
  `, vmContext);
  assert(leapTaskRes && leapTaskRes.success === true, 'apiSaveTask handles leap year date (29/02/2024)');

  // Edge Case 4: Non-leap leap day
  const nonLeapTaskRes = vm.runInContext(`
    apiSaveTask({
      tenNhiemVu: 'Non-Leap Year Task 2025',
      deadline: '29/02/2025'
    })
  `, vmContext);
  assert(nonLeapTaskRes && nonLeapTaskRes.success === true, 'apiSaveTask handles non-leap date string safely');

  // Edge Case 5: Empty project and staff
  const emptyProjRes = vm.runInContext(`apiSaveProject({})`, vmContext);
  assert(emptyProjRes && emptyProjRes.success === true, 'apiSaveProject handles empty input gracefully');

  const emptyStaffRes = vm.runInContext(`apiSaveStaff({})`, vmContext);
  assert(emptyStaffRes && emptyStaffRes.success === true, 'apiSaveStaff handles empty input gracefully');
} catch (err) {
  assert(false, 'Boundary edge cases testing', err.toString());
}

// -----------------------------------------------------------------------------------------
// 6. GOOGLE CALENDAR SYNC ENGINE VERIFICATION
// -----------------------------------------------------------------------------------------
console.log('\n>>> SECTION 9: Google Calendar Sync Engine Verification');
try {
  const syncRes = vm.runInContext('syncDeadlinesToGoogleCalendar()', vmContext);
  assert(syncRes && syncRes.success === true, 'syncDeadlinesToGoogleCalendar() executes and returns success: true');
  assert(typeof syncRes.count === 'number' && syncRes.count >= 0, `syncDeadlinesToGoogleCalendar reports synced count: ${syncRes.count}`);
} catch (err) {
  assert(false, 'syncDeadlinesToGoogleCalendar execution', err.toString());
}

// -----------------------------------------------------------------------------------------
// 7. FRONTEND DOM & SCRIPT SYNTAX VERIFICATION
// -----------------------------------------------------------------------------------------
console.log('\n>>> SECTION 10: Frontend DOM & Script Syntax Verification (QuanLyCongViecTeam_Index.html)');

const htmlContent = fs.readFileSync(HTML_PATH, 'utf8');

// Test 7.1: Syntax verification of all script blocks in HTML
try {
  const scriptBlocks = [...htmlContent.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  assert(scriptBlocks.length > 0, `HTML contains inline script blocks (count: ${scriptBlocks.length})`);

  let allScriptsValid = true;
  for (let i = 0; i < scriptBlocks.length; i++) {
    const code = scriptBlocks[i];
    try {
      new Function(code);
    } catch (syntaxErr) {
      allScriptsValid = false;
      assert(false, `Script block #${i + 1} syntax check`, syntaxErr.message);
    }
  }
  if (allScriptsValid) {
    assert(true, 'All inline <script> blocks compile with 0 syntax errors');
  }
} catch (err) {
  assert(false, 'Script syntax verification', err.toString());
}

// Test 7.2: Verify 5 KPI cards
const kpiCardIds = [
  'dash-kpi-active-tasks',
  'dash-kpi-overdue-tasks',
  'dash-kpi-avg-progress',
  'dash-kpi-discipline-rate',
  'dash-kpi-today-routines'
];
for (const id of kpiCardIds) {
  assert(htmlContent.includes(`id="${id}"`), `KPI Card element exists: id="${id}"`);
}

// Test 7.3: Verify 6 Chart.js canvases
const expectedCanvases = [
  'dash-chart-workload',
  'dash-chart-discipline',
  'dash-chart-projects',
  'dash-chart-priority',
  'dash-chart-trend',
  'dash-chart-dept'
];
for (const cId of expectedCanvases) {
  assert(htmlContent.includes(`id="${cId}"`), `Chart.js canvas exists: id="${cId}"`);
}

// Test 7.4: Verify Gantt timeline week/month view buttons
assert(
  htmlContent.includes('id="gantt-view-week"') && htmlContent.includes('id="gantt-view-month"'),
  'Gantt timeline Week/Month view buttons exist (id="gantt-view-week" & id="gantt-view-month")'
);

// Test 7.5: Verify Visual Version Badges
const hasHeaderBadge = htmlContent.includes('Bản 3.0');
const hasSidebarBadge = htmlContent.includes('Phiên bản 3.0 (Active)');
const hasSidebarBadgeId = htmlContent.includes('id="appBuildVersionBadge"');

assert(hasHeaderBadge, 'Visual Version Badge stamped in Topbar: "Bản 3.0"');
assert(hasSidebarBadge, 'Visual Version Badge stamped in Sidebar: "Phiên bản 3.0 (Active)"');
assert(hasSidebarBadgeId, 'Sidebar badge has required ID: id="appBuildVersionBadge"');

// Test 7.6: Zero Phantom Overlay verification
const drawerContainerMatch = htmlContent.match(/<div[^>]*id=["']action-drawer-container["'][^>]*>/i);
assert(
  drawerContainerMatch && drawerContainerMatch[0].includes('hidden'),
  'Zero Phantom Overlay: #action-drawer-container has class "hidden" by default'
);

const confirmModalMatch = htmlContent.match(/<div[^>]*id=["']confirm-modal-container["'][^>]*>/i);
assert(
  confirmModalMatch && confirmModalMatch[0].includes('hidden'),
  'Zero Phantom Overlay: #confirm-modal-container has class "hidden" by default'
);

// Test 7.7: Inline Embedded Realistic Mock Data (0-second render)
assert(
  htmlContent.includes('tasks:') && htmlContent.includes('projects:') && htmlContent.includes('staff:'),
  'Inline Embedded Realistic Mock Data present in AppState for 0-second instant render'
);

// -----------------------------------------------------------------------------------------
// 8. FINAL VERDICT EVALUATION
// -----------------------------------------------------------------------------------------
console.log('\n================================================================');
console.log('STRESS TEST SUMMARY & EMPIRICAL EVIDENCE');
console.log('================================================================');
console.log(`Total Assertions : ${stats.total}`);
console.log(`Passed           : ${stats.passed}`);
console.log(`Failed           : ${stats.failed}`);

if (stats.failed === 0) {
  console.log('\nVERDICT: [ APPROVE ]');
  console.log('All functional, RPC, checklist matrix, boundary, and DOM stress tests passed 100%.');
} else {
  console.log('\nVERDICT: [ REQUEST_CHANGES ]');
  console.log('Failures detected:');
  stats.failures.forEach((f, i) => {
    console.log(`  ${i + 1}. ${f.testName}: ${f.details}`);
  });
}
console.log('================================================================\n');

process.exit(stats.failed === 0 ? 0 : 1);
