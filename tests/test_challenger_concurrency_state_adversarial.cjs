/**
 * =========================================================================================
 * EMPIRICAL ADVERSARIAL STRESS TEST: CONCURRENCY, LOCK SAFETY & STATE RECOVERY
 * =========================================================================================
 * Challenger 2 Verification Harness
 * Tests:
 *  1. Concurrent RPC calls to apiSaveProject, apiSaveStaff, apiSaveTask, apiUpdateChecklistCell
 *  2. Mutual exclusion and race condition / write corruption prevention by LockService
 *  3. Guaranteed lock.releaseLock() execution in finally under error injection
 *  4. recalculateProjectProgress division-by-zero & boundary invariants
 *  5. toggleCell invalid day keys ('thu8', etc.) safety in frontend & backend
 *  6. getInitialData dual header mapping under empty & corrupt sheet states
 * =========================================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert');
const vm = require('node:vm');

const CODE_GS_PATH = path.resolve(__dirname, '../PROJECTS_WEBAPPS/QuanLyCongViecTeam_Code.gs');
const INDEX_HTML_PATH = path.resolve(__dirname, '../PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html');

console.log('='.repeat(90));
console.log('CHALLENGER 2: ADVERSARIAL CONCURRENCY, LOCK SAFETY & STATE RECOVERY SUITE');
console.log('='.repeat(90));

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  failures: []
};

function recordTest(suite, name, passed, details = '') {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(`  [PASS] [${suite}] ${name}`);
  } else {
    results.failed++;
    console.error(`  [FAIL] [${suite}] ${name} -> Details: ${details}`);
    results.failures.push({ suite, name, details });
  }
}

// Load source code
const codeGsRaw = fs.readFileSync(CODE_GS_PATH, 'utf8');
const indexHtmlRaw = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

// =========================================================================================
// MOCK GAS INFRASTRUCTURE FOR ADVERSARIAL CONCURRENCY & ISOLATION
// =========================================================================================

class AsyncScriptLock {
  constructor() {
    this.locked = false;
    this.acquireCount = 0;
    this.releaseCount = 0;
  }

  hasLock() {
    return this.locked;
  }

  waitLock(timeoutMs) {
    if (!this.locked) {
      this.locked = true;
      this.acquireCount++;
      return true;
    }
    throw new Error('Lock timeout: Could not obtain lock after ' + timeoutMs + 'ms');
  }

  releaseLock() {
    if (this.locked) {
      this.locked = false;
      this.releaseCount++;
    }
  }
}

class MockSheet {
  constructor(name) {
    this.name = name;
    this.rows = [];
    this.throwOnGetLastRow = false;
    this.throwOnSetValues = false;
    this.throwOnAppendRow = false;
  }

  getName() { return this.name; }

  getLastRow() {
    if (this.throwOnGetLastRow) {
      throw new Error('INJECTED_GET_LAST_ROW_ERROR');
    }
    return this.rows.length;
  }

  getLastColumn() {
    let max = 0;
    for (const r of this.rows) {
      if (r && r.length > max) max = r.length;
    }
    return max;
  }

  appendRow(rowValues) {
    if (this.throwOnAppendRow) {
      throw new Error('INJECTED_APPEND_ROW_ERROR');
    }
    this.rows.push([...rowValues]);
    return this;
  }

  deleteRow(rowIdx) {
    const idx = rowIdx - 1;
    if (idx >= 0 && idx < this.rows.length) {
      this.rows.splice(idx, 1);
    }
  }

  clear() {
    this.rows = [];
    return this;
  }

  hideSheet() { return this; }
  showSheet() { return this; }
  protect() {
    return {
      setDescription: () => this,
      setWarningOnly: () => this,
      remove: () => {}
    };
  }
  setFrozenRows() { return this; }
  setColumnWidth() { return this; }
  setRowHeight() { return this; }
  setTabColor() { return this; }
  autoResizeColumns() { return this; }

  getRange(a, b, c, d) {
    let startRow, startCol, numRows, numCols;
    if (typeof a === 'string') {
      const match = a.match(/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/i);
      if (match) {
        function colToNum(colStr) {
          let num = 0;
          for (let i = 0; i < colStr.length; i++) {
            num = num * 26 + (colStr.toUpperCase().charCodeAt(i) - 64);
          }
          return num;
        }
        startCol = colToNum(match[1]);
        startRow = parseInt(match[2], 10);
        if (match[3] && match[4]) {
          const endCol = colToNum(match[3]);
          const endRow = parseInt(match[4], 10);
          numCols = endCol - startCol + 1;
          numRows = endRow - startRow + 1;
        } else {
          numCols = 1;
          numRows = 1;
        }
      } else {
        startRow = 1; startCol = 1; numRows = 1; numCols = 1;
      }
    } else {
      startRow = a;
      startCol = b;
      numRows = c || 1;
      numCols = d || 1;
    }

    const sheetRef = this;
    const rangeObj = {
      sheet: sheetRef,
      startRow, startCol, numRows, numCols,
      getValues: function() {
        const result = [];
        for (let r = 0; r < numRows; r++) {
          const rowArr = [];
          const actualRowIdx = (startRow - 1) + r;
          const srcRow = sheetRef.rows[actualRowIdx] || [];
          for (let col = 0; col < numCols; col++) {
            const actualColIdx = (startCol - 1) + col;
            rowArr.push(srcRow[actualColIdx] !== undefined ? srcRow[actualColIdx] : '');
          }
          result.push(rowArr);
        }
        return result;
      },
      getValue: function() {
        const vals = this.getValues();
        return vals[0] && vals[0][0] !== undefined ? vals[0][0] : '';
      },
      setValues: function(val2D) {
        if (sheetRef.throwOnSetValues) {
          throw new Error('INJECTED_SET_VALUES_ERROR');
        }
        if (typeof startCol !== 'number' || isNaN(startCol)) {
          throw new TypeError('Invalid column index: must be a number');
        }
        for (let r = 0; r < val2D.length; r++) {
          const targetRowIdx = (startRow - 1) + r;
          while (sheetRef.rows.length <= targetRowIdx) {
            sheetRef.rows.push([]);
          }
          const row = sheetRef.rows[targetRowIdx];
          for (let col = 0; col < val2D[r].length; col++) {
            const targetColIdx = (startCol - 1) + col;
            while (row.length <= targetColIdx) {
              row.push('');
            }
            row[targetColIdx] = val2D[r][col];
          }
        }
        return rangeObj;
      },
      setValue: function(val) {
        return this.setValues([[val]]);
      }
    };

    let proxy;
    proxy = new Proxy(rangeObj, {
      get(target, prop) {
        if (prop in target) {
          if (typeof target[prop] === 'function') {
            return function(...args) {
              const res = target[prop].apply(target, args);
              if (res === rangeObj) return proxy;
              return res;
            };
          }
          return target[prop];
        }
        return function() { return proxy; };
      }
    });

    return proxy;
  }
}

class MockSpreadsheet {
  constructor() {
    this.sheets = new Map();
    this.name = 'QUẢN LÝ CÔNG VIỆC TEAM & TIẾN ĐỘ DỰ ÁN 3.5 — WEB APP — FILE ĐI LÀM';
    this.id = 'MOCK_SS_ID_999';
    this.activeSheet = null;
  }

  getName() { return this.name; }
  rename(newName) { this.name = newName; }
  getId() { return this.id; }

  getSheetByName(name) {
    return this.sheets.get(name) || null;
  }

  insertSheet(name) {
    if (!this.sheets.has(name)) {
      const s = new MockSheet(name);
      this.sheets.set(name, s);
      this.activeSheet = s;
    }
    return this.sheets.get(name);
  }

  getSheets() {
    return Array.from(this.sheets.values());
  }

  setActiveSheet(sh) {
    this.activeSheet = sh;
    return sh;
  }

  moveActiveSheet() {
    return this;
  }
}

function createGasEnvironment(initialSetup = true) {
  const ss = new MockSpreadsheet();
  const globalLock = new AsyncScriptLock();

  const mockLockService = {
    getScriptLock: () => globalLock
  };

  const mockSpreadsheetApp = {
    getActiveSpreadsheet: () => ss,
    getUi: () => ({
      createMenu: () => ({
        addItem: function() { return this; },
        addSeparator: function() { return this; },
        addToUi: () => {}
      }),
      showModalDialog: () => {}
    }),
    BorderStyle: { SOLID: 'SOLID', SOLID_MEDIUM: 'SOLID_MEDIUM', DOTTED: 'DOTTED' }
  };

  const mockUtilities = {
    formatDate: (d, tz, fmt) => {
      const date = (d instanceof Date) ? d : new Date(d);
      if (isNaN(date.getTime())) return String(d);
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      const HH = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      if (fmt.includes('HH:mm')) return `${dd}/${mm}/${yyyy} ${HH}:${min}`;
      return `${dd}/${mm}/${yyyy}`;
    },
    sleep: () => {}
  };

  const sandbox = {
    SpreadsheetApp: mockSpreadsheetApp,
    LockService: mockLockService,
    Utilities: mockUtilities,
    Logger: { log: () => {} },
    CalendarApp: {
      getDefaultCalendar: () => ({
        createEvent: () => ({ getId: () => 'EVENT-123' })
      })
    },
    console: { log: () => {}, warn: () => {}, error: () => {} }
  };

  vm.createContext(sandbox);
  vm.runInContext(codeGsRaw, sandbox);

  if (initialSetup) {
    sandbox.setupDatabaseSheets();
  }

  return { sandbox, ss, globalLock };
}

// =========================================================================================
// TEST SUITE 1: CONCURRENCY, MUTUAL EXCLUSION & RACE CONDITION RESILIENCY
// =========================================================================================
console.log('\n--- TEST SUITE 1: Concurrency & Lock Safety Stress Testing ---');
{
  const suite = 'Lock & Concurrency';
  const { sandbox, ss, globalLock } = createGasEnvironment(true);

  // 1.1 Verify lock prevents simultaneous entry
  let concurrentDetected = false;

  const originalWaitLock = globalLock.waitLock.bind(globalLock);
  globalLock.waitLock = function(timeout) {
    if (globalLock.locked) {
      concurrentDetected = true;
      throw new Error('Lock contention: already held by another execution');
    }
    globalLock.locked = true;
    globalLock.acquireCount++;
  };

  // Simulate call 1 acquiring lock
  globalLock.waitLock(15000);
  recordTest(suite, 'Lock is acquired by Call 1', globalLock.hasLock() === true);

  // Call 2 tries to save task while Call 1 is holding
  let call2Result = null;
  try {
    call2Result = sandbox.apiSaveTask({ tenNhiemVu: 'Concurrent Task' });
  } catch (e) {
    call2Result = { success: false, message: e.message };
  }
  recordTest(suite, 'Concurrent call detects held lock and fails safely without corrupting sheet', call2Result.success === false);
  recordTest(suite, 'Lock contention was triggered', concurrentDetected === true);

  // Call 1 releases lock
  globalLock.releaseLock();
  recordTest(suite, 'Call 1 releases lock successfully', globalLock.hasLock() === false);

  // Restore standard lock
  globalLock.waitLock = originalWaitLock;

  // 1.2 Interleaved Multi-Entity Sequential RPC Transactions
  // Simulate rapid bursts of apiSaveProject, apiSaveStaff, apiSaveTask, apiUpdateChecklistCell
  const initialTaskCount = ss.getSheetByName('DB_CongViec').getLastRow();
  const initialProjCount = ss.getSheetByName('DB_DuAn').getLastRow();
  const initialStaffCount = ss.getSheetByName('DB_NhanSu').getLastRow();

  const transactions = [
    () => sandbox.apiSaveProject({ tenDuAn: 'Dự Án Burst A', nganSach: 1000000 }),
    () => sandbox.apiSaveStaff({ hoTen: 'Nhân Sự Burst B', googleEmail: 'burst.b@test.com' }),
    () => sandbox.apiSaveTask({ tenNhiemVu: 'Task Burst C', maDuAn: 'DUAN-BURST-A' }),
    () => sandbox.apiUpdateChecklistCell('LICH-301921', 'NHAN-201941', 'thu3', 'Done'),
    () => sandbox.apiSaveProject({ tenDuAn: 'Dự Án Burst D', nganSach: 2000000 }),
    () => sandbox.apiSaveStaff({ hoTen: 'Nhân Sự Burst E', googleEmail: 'burst.e@test.com' }),
    () => sandbox.apiSaveTask({ tenNhiemVu: 'Task Burst F', maDuAn: 'DUAN-BURST-D' }),
    () => sandbox.apiUpdateChecklistCell('LICH-301921', 'NHAN-201941', 'thu4', 'Done')
  ];

  let allSuccess = true;
  for (let i = 0; i < transactions.length; i++) {
    const res = transactions[i]();
    if (!res || !res.success) {
      allSuccess = false;
      console.error(`Transaction ${i} failed:`, res);
    }
  }

  recordTest(suite, 'All 8 interleaved multi-entity RPC calls execute successfully', allSuccess);
  recordTest(suite, 'Lock is released after all transactions completed', globalLock.hasLock() === false);
  recordTest(suite, 'Project sheet row count incremented by 2', ss.getSheetByName('DB_DuAn').getLastRow() === initialProjCount + 2);
  recordTest(suite, 'Staff sheet row count incremented by 2', ss.getSheetByName('DB_NhanSu').getLastRow() === initialStaffCount + 2);
  recordTest(suite, 'Task sheet row count incremented by 2', ss.getSheetByName('DB_CongViec').getLastRow() === initialTaskCount + 2);
}

// =========================================================================================
// TEST SUITE 2: ERROR INJECTION & UNCONDITIONAL FINALLY RELEASE VERIFICATION
// =========================================================================================
console.log('\n--- TEST SUITE 2: Error Injection & Unconditional Finally Lock Release ---');
{
  const suite = 'Error Injection Lock Safety';

  // Test 2.1: apiSaveTask error during getLastRow()
  {
    const { sandbox, ss, globalLock } = createGasEnvironment(true);
    const taskSheet = ss.getSheetByName('DB_CongViec');
    taskSheet.throwOnGetLastRow = true;

    const res = sandbox.apiSaveTask({ tenNhiemVu: 'Crashing Task' });
    recordTest(suite, 'apiSaveTask handles injected getLastRow error safely', res.success === false);
    recordTest(suite, 'apiSaveTask guarantees lock.releaseLock() executed on getLastRow error', globalLock.hasLock() === false);
  }

  // Test 2.2: apiSaveProject error during setValues()
  {
    const { sandbox, ss, globalLock } = createGasEnvironment(true);
    const projSheet = ss.getSheetByName('DB_DuAn');
    projSheet.throwOnSetValues = true;

    // First create a project to update
    projSheet.appendRow(['DUAN-999', 'Existing Project', '', '', '', '', '', 0, '', 0, '']);
    const res = sandbox.apiSaveProject({ maDuAn: 'DUAN-999', tenDuAn: 'Updated Name' });
    recordTest(suite, 'apiSaveProject handles injected setValues error safely', res.success === false);
    recordTest(suite, 'apiSaveProject guarantees lock.releaseLock() on setValues error', globalLock.hasLock() === false);
  }

  // Test 2.3: apiSaveStaff error during appendRow()
  {
    const { sandbox, ss, globalLock } = createGasEnvironment(true);
    const staffSheet = ss.getSheetByName('DB_NhanSu');
    staffSheet.throwOnAppendRow = true;

    const res = sandbox.apiSaveStaff({ hoTen: 'New Staff' });
    recordTest(suite, 'apiSaveStaff handles injected appendRow error safely', res.success === false);
    recordTest(suite, 'apiSaveStaff guarantees lock.releaseLock() on appendRow error', globalLock.hasLock() === false);
  }

  // Test 2.4: apiUpdateChecklistCell error during setValues()
  {
    const { sandbox, ss, globalLock } = createGasEnvironment(true);
    const chkSheet = ss.getSheetByName('DB_ChecklistLap');
    chkSheet.throwOnSetValues = true;

    const res = sandbox.apiUpdateChecklistCell('LICH-301921', 'NHAN-201941', 'thu2', 'Done');
    recordTest(suite, 'apiUpdateChecklistCell handles injected setValues error safely', res.success === false);
    recordTest(suite, 'apiUpdateChecklistCell guarantees lock.releaseLock() on error', globalLock.hasLock() === false);
  }

  // Test 2.5: apiQuickToggleTask error during non-existent task
  {
    const { sandbox, ss, globalLock } = createGasEnvironment(true);
    const res = sandbox.apiQuickToggleTask('TASK-NONEXISTENT', true);
    recordTest(suite, 'apiQuickToggleTask handles non-existent task ID gracefully', res.success === false);
    recordTest(suite, 'apiQuickToggleTask releases lock on non-existent task error', globalLock.hasLock() === false);
  }
}

// =========================================================================================
// TEST SUITE 3: recalculateProjectProgress DIVISION-BY-ZERO & BOUNDARY INVARIANTS
// =========================================================================================
console.log('\n--- TEST SUITE 3: recalculateProjectProgress Invariants ---');
{
  const suite = 'recalculateProjectProgress';
  const { sandbox, ss } = createGasEnvironment(true);

  const projSheet = ss.getSheetByName('DB_DuAn');
  const taskSheet = ss.getSheetByName('DB_CongViec');

  // Insert a clean test project
  const testProjectId = 'DUAN-ZERO-TEST';
  projSheet.appendRow([testProjectId, 'Zero Task Project', 'IT', 'Manager', 'Goal', '01/01/2026', '31/12/2026', 100000, 'Đang tiến hành', 50, '']);
  const projRowIdx = projSheet.getLastRow();

  // 3.1 Case A: Project with 0 child tasks (while taskSheet has other tasks)
  sandbox.recalculateProjectProgress(ss, testProjectId);
  const updatedProgressA = projSheet.getRange(projRowIdx, 10).getValue();
  recordTest(suite, '0 child tasks sets project progress to 0 without division by zero', updatedProgressA === 0);
  recordTest(suite, 'Progress is numeric and not NaN', typeof updatedProgressA === 'number' && !isNaN(updatedProgressA));

  // 3.2 Case B: Project with empty taskSheet (no tasks at all)
  taskSheet.rows = [taskSheet.rows[0]]; // Only header
  sandbox.recalculateProjectProgress(ss, testProjectId);
  const updatedProgressB = projSheet.getRange(projRowIdx, 10).getValue();
  recordTest(suite, 'Empty task sheet handled gracefully (no crash or NaN)', !isNaN(updatedProgressB));

  // 3.3 Case C: Child tasks have corrupted progress values (null, undefined, string, NaN)
  taskSheet.appendRow(['TASK-01', 'Task 1', testProjectId, 'Zero Task Project', 'Assignee', 'email@test.com', 'Bình thường', 1, '01/01/2026', '10/01/2026', '18:00', null, 'Đang tiến hành', '', '']);
  taskSheet.appendRow(['TASK-02', 'Task 2', testProjectId, 'Zero Task Project', 'Assignee', 'email@test.com', 'Bình thường', 1, '01/01/2026', '10/01/2026', '18:00', 'invalid_string', 'Đang tiến hành', '', '']);
  taskSheet.appendRow(['TASK-03', 'Task 3', testProjectId, 'Zero Task Project', 'Assignee', 'email@test.com', 'Bình thường', 1, '01/01/2026', '10/01/2026', '18:00', 60, 'Đang tiến hành', '', '']);
  
  sandbox.recalculateProjectProgress(ss, testProjectId);
  const updatedProgressC = projSheet.getRange(projRowIdx, 10).getValue();
  // Expected: (0 + 0 + 60) / 3 = 20
  recordTest(suite, 'Corrupted task progress values safely coerced via Number(val)||0 [expected: 20]', updatedProgressC === 20);

  // 3.4 Case D: Non-existent or empty project ID passed
  let exceptionThrown = false;
  try {
    sandbox.recalculateProjectProgress(ss, '');
    sandbox.recalculateProjectProgress(ss, null);
    sandbox.recalculateProjectProgress(ss, undefined);
    sandbox.recalculateProjectProgress(ss, 'DUAN-NON-EXISTENT-XYZ');
  } catch (e) {
    exceptionThrown = true;
  }
  recordTest(suite, 'Empty, null, undefined or non-existent project ID handled without throwing', exceptionThrown === false);
}

// =========================================================================================
// TEST SUITE 4: toggleCell INVALID DAY KEYS ('thu8') & ADVERSARIAL DISCIPLINE MATRIX
// =========================================================================================
console.log('\n--- TEST SUITE 4: toggleCell Invalid Day Keys & Boundary Tests ---');
{
  const suite = 'toggleCell & Matrix Invariants';
  const { sandbox, globalLock } = createGasEnvironment(true);

  // 4.1 Backend apiUpdateChecklistCell with standard invalid day keys
  const invalidKeys = ['thu8', 'chu_nhat', 'sunday', '', 'xyz', '123'];
  invalidKeys.forEach(k => {
    const res = sandbox.apiUpdateChecklistCell('LICH-301921', 'NHAN-201941', k, 'Done');
    recordTest(suite, `Backend rejects invalid day key "${k}" safely`, res.success === false && res.message.includes('không hợp lệ'));
  });

  // 4.2 Backend apiUpdateChecklistCell with prototype property injection ('__proto__', 'toString')
  const protoRes = sandbox.apiUpdateChecklistCell('LICH-301921', 'NHAN-201941', '__proto__', 'Done');
  recordTest(suite, 'Backend rejects __proto__ day key without corrupting lock', protoRes.success === false && globalLock.hasLock() === false);

  const toStringRes = sandbox.apiUpdateChecklistCell('LICH-301921', 'NHAN-201941', 'toString', 'Done');
  recordTest(suite, 'Backend rejects toString day key without corrupting lock', toStringRes.success === false && globalLock.hasLock() === false);

  // 4.3 Frontend ModuleRoutinesMatrix.toggleCell and calculateRowRate
  // Setup simulated DOM & Window for frontend testing
  const domElements = new Map();
  function createMockElement(id, tagName = 'div') {
    const el = {
      id,
      tagName: tagName.toUpperCase(),
      classList: {
        classes: new Set(),
        add: function(c) { this.classes.add(c); },
        remove: function(c) { this.classes.delete(c); },
        contains: function(c) { return this.classes.has(c); },
        toggle: function(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
      },
      style: {},
      innerHTML: '',
      textContent: '',
      innerText: '',
      value: '',
      closest: () => null,
      querySelector: () => null,
      querySelectorAll: () => []
    };
    return el;
  }

  function getOrCreateElement(id) {
    if (!id) return null;
    if (!domElements.has(id)) {
      domElements.set(id, createMockElement(id));
    }
    return domElements.get(id);
  }

  const mockDocument = {
    getElementById: (id) => getOrCreateElement(id),
    querySelector: (sel) => {
      if (sel.startsWith('#')) return getOrCreateElement(sel.slice(1));
      return createMockElement('', 'div');
    },
    querySelectorAll: () => [],
    createElement: (tag) => createMockElement('', tag),
    addEventListener: () => {},
    removeEventListener: () => {},
    body: createMockElement('body', 'body')
  };

  const mockLocalStorage = {
    _store: new Map(),
    getItem: function(k) { return this._store.has(k) ? this._store.get(k) : null; },
    setItem: function(k, v) { this._store.set(k, String(v)); },
    removeItem: function(k) { this._store.delete(k); },
    clear: function() { this._store.clear(); }
  };

  function MockChart() {
    this.destroy = () => {};
    this.update = () => {};
    this.data = { datasets: [{ data: [] }] };
  }
  MockChart.defaults = { font: {}, plugins: {} };

  const frontendSandbox = {
    window: {},
    document: mockDocument,
    localStorage: mockLocalStorage,
    sessionStorage: mockLocalStorage,
    navigator: { userAgent: 'Node', clipboard: { writeText: () => Promise.resolve() } },
    location: { href: '', search: '', reload: () => {} },
    history: { pushState: () => {}, replaceState: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    lucide: { createIcons: () => {} },
    Chart: MockChart,
    flatpickr: () => ({ destroy: () => {}, setDate: () => {}, clear: () => {} }),
    tailwind: { config: {} },
    google: {
      script: {
        run: {
          withSuccessHandler: () => ({
            withFailureHandler: () => new Proxy({}, { get: () => () => {} })
          })
        }
      }
    },
    console: { log: () => {}, warn: () => {}, error: () => {} },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    requestAnimationFrame: (cb) => setTimeout(cb, 16),
    cancelAnimationFrame: (id) => clearTimeout(id),
    matchMedia: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }),
    scrollTo: () => {},
    Intl: Intl,
    Date: Date,
    Math: Math,
    JSON: JSON,
    String: String,
    Number: Number,
    Array: Array,
    Object: Object,
    Boolean: Boolean,
    RegExp: RegExp
  };
  frontendSandbox.window = frontendSandbox;
  frontendSandbox.global = frontendSandbox;
  frontendSandbox.self = frontendSandbox;

  vm.createContext(frontendSandbox);

  // Extract and execute inline scripts safely
  const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
  let sm;
  while ((sm = scriptRegex.exec(indexHtmlRaw)) !== null) {
    if (!sm[0].match(/src=["']/i) && sm[1].trim()) {
      try {
        vm.runInContext(sm[1], frontendSandbox);
      } catch (e) {
        // Ignored for non-JS template tags
      }
    }
  }

  const ModuleRoutinesMatrix = frontendSandbox.window.ModuleRoutinesMatrix;
  assert.ok(ModuleRoutinesMatrix, 'ModuleRoutinesMatrix must be defined');

  // Verify calculateRowRate with normal row
  const sampleRow = {
    thu2: 'Done',
    thu3: 'Done',
    thu4: '-',
    thu5: '-',
    thu6: '-',
    thu7: '-'
  };
  const rate2of2 = ModuleRoutinesMatrix.calculateRowRate(sampleRow);
  recordTest(suite, 'calculateRowRate calculates 2/2 active days as 100%', rate2of2 === '100%');

  // 4.4 calculateRowRate with all inactive days (-)
  const emptyRow = { thu2: '-', thu3: '-', thu4: '-', thu5: '-', thu6: '-', thu7: '-' };
  const rateEmpty = ModuleRoutinesMatrix.calculateRowRate(emptyRow);
  recordTest(suite, 'calculateRowRate returns 0% when activeDays === 0 (no division by zero)', rateEmpty === '0%');

  // 4.5 calculateRowRate with corrupted / null / undefined row
  recordTest(suite, 'calculateRowRate(null) returns 0%', ModuleRoutinesMatrix.calculateRowRate(null) === '0%');
  recordTest(suite, 'calculateRowRate({}) returns 0%', ModuleRoutinesMatrix.calculateRowRate({}) === '0%');

  // 4.6 toggleCell with invalid dayKey 'thu8' in frontend
  // Should not crash, and calculateRowRate must still ignore 'thu8'
  const checklist = frontendSandbox.window.AppState.data.checklist;
  assert.ok(checklist && checklist.length > 0, 'Checklist data must exist');
  const targetItem = checklist[0];
  const targetMaLich = targetItem.maLich || targetItem['Mã Lịch'];
  const targetMaNhanSu = targetItem.maNhanSu || targetItem['Mã Nhân Sự'];

  let toggleCrash = false;
  let toggleCrashMsg = '';
  try {
    ModuleRoutinesMatrix.toggleCell(targetMaLich, targetMaNhanSu, 'thu8');
  } catch (e) {
    toggleCrash = true;
    toggleCrashMsg = e ? (e.message || String(e)) : 'Unknown error';
    console.error('  [Observed Exception in toggleCell("thu8")]:', e);
  }
  recordTest(suite, 'Frontend toggleCell with "thu8" does not crash', toggleCrash === false, toggleCrashMsg);
  recordTest(suite, 'calculateRowRate ignores "thu8" and produces valid % format', /^\d+%$/.test(targetItem.tyLeTuan));
}

// =========================================================================================
// TEST SUITE 5: getInitialData DUAL HEADER MAPPING UNDER EMPTY & CORRUPT SHEETS
// =========================================================================================
console.log('\n--- TEST SUITE 5: getInitialData Dual Header Mapping & Resiliency ---');
{
  const suite = 'getInitialData Resilience';

  // 5.1 Call getInitialData on a completely blank spreadsheet (0 sheets)
  {
    const { sandbox, ss } = createGasEnvironment(false); // No initial setup
    ss.sheets.clear(); // Completely empty

    const data = sandbox.getInitialData();
    recordTest(suite, 'getInitialData auto-seeds when database is empty (success: true)', data.success === true);
    recordTest(suite, 'Auto-seed populated tasks (count >= 10)', data.tasks.length >= 10);
    recordTest(suite, 'Auto-seed populated projects (count >= 3)', data.projects.length >= 3);
    recordTest(suite, 'Auto-seed populated staff (count >= 6)', data.staff.length >= 6);
  }

  // 5.2 Call getInitialData on sheets that exist but have 0 data rows (only header row)
  {
    const { sandbox, ss } = createGasEnvironment(true);
    // Truncate all sheets to only header row
    Array.from(ss.sheets.values()).forEach(sh => {
      sh.rows = [sh.rows[0]];
    });
    // Add 1 task row so it doesn't re-seed
    const taskSheet = ss.getSheetByName('DB_CongViec');
    taskSheet.appendRow(['TASK-SOLO', 'Single Task', 'DUAN-01', 'Project 1', 'Assignee', 'a@b.com', 'Bình thường', 1, '01/01/2026', '10/01/2026', '18:00', 50, 'Đang tiến hành', '', '']);

    const data = sandbox.getInitialData();
    recordTest(suite, 'getInitialData succeeds when other sheets have 0 data rows', data.success === true);
    recordTest(suite, 'Empty sheets return empty array [] without throwing', Array.isArray(data.projects) && data.projects.length === 0);
  }

  // 5.3 Verify Dual Header Mapping across all entities under partial/malformed rows
  {
    const { sandbox, ss } = createGasEnvironment(true);
    const taskSheet = ss.getSheetByName('DB_CongViec');
    // Add row with empty strings and nulls
    taskSheet.appendRow(['TASK-MALFORMED', '', null, undefined, '', '', null, null, '', '', '', null, '', '', '']);

    const data = sandbox.getInitialData();
    const malformedTask = data.tasks.find(t => (t.maTask || t['Mã Task']) === 'TASK-MALFORMED');

    recordTest(suite, 'Malformed task row mapped without error', !!malformedTask);
    recordTest(suite, 'Malformed task has camelCase maTask', malformedTask.maTask === 'TASK-MALFORMED');
    recordTest(suite, 'Malformed task has Vietnamese "Mã Task"', malformedTask['Mã Task'] === 'TASK-MALFORMED');
    recordTest(suite, 'Malformed task has numeric tienDo (0)', malformedTask.tienDo === 0);
    recordTest(suite, 'Malformed task has numeric "Tiến Độ %" (0)', malformedTask['Tiến Độ %'] === 0);
    recordTest(suite, 'Malformed task has numeric trongSo (1)', malformedTask.trongSo === 1);
  }
}

// =========================================================================================
// SUMMARY & VERDICT
// =========================================================================================
console.log('\n' + '='.repeat(90));
console.log('CHALLENGER 2 VERIFICATION SUMMARY:');
console.log(`  Total Tests  : ${results.total}`);
console.log(`  Passed Tests : ${results.passed}`);
console.log(`  Failed Tests : ${results.failed}`);
console.log('='.repeat(90));

if (results.failed === 0) {
  console.log('VERDICT: [ APPROVE ] - All concurrency, lock, and state invariants verified empirically.');
} else {
  console.log('VERDICT: [ REQUEST_CHANGES ] - Found critical failures:');
  results.failures.forEach(f => console.log(`  - [${f.suite}] ${f.name}: ${f.details}`));
}

// Write result to file for reference
fs.writeFileSync(
  path.resolve(__dirname, 'challenger_2_adversarial_results.json'),
  JSON.stringify(results, null, 2),
  'utf8'
);
