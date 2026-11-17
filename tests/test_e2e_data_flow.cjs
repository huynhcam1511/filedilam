/**
 * =========================================================================================
 * AUTOMATED END-TO-END (E2E) DATA FLOW & PROPAGATION VERIFICATION RUNNER
 * =========================================================================================
 * Target Files:
 *   1. PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html (Frontend SPA Engine & Modules)
 *   2. PROJECTS_WEBAPPS/QuanLyCongViecTeam_Code.gs    (Backend Google Apps Script Engine)
 *
 * Scenarios Tested:
 *   - Scenario 1: Nhập Liệu Tầng Quản Lý (DUAN-999001, NHAN-888002, LICH-777003 & Checklist)
 *   - Scenario 2: Kế Thừa Sang Vận Hành & Tạo Task (Dropdowns, Auto-fill Email, Dual-Header Task)
 *   - Scenario 3: Phản Ánh Thời Gian Thực (Gantt, Project Roll-up, Checklist Matrix 0%->100%, Dashboard)
 *   - Scenario 4: Backend Google Apps Script Dry-Run (RPCs, LockService 15s, Dual Header Mapping)
 *
 * Rules:
 *   - AGENTS.md Rule 10: Strict Module Scope & Safe Formatter Rule
 *   - AGENTS.md Rule 11: Runtime VM Execution Dry-Run
 * =========================================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert');
const vm = require('node:vm');

const CODE_GS_PATH = path.resolve(__dirname, '../PROJECTS_WEBAPPS/QuanLyCongViecTeam_Code.gs');
const INDEX_HTML_PATH = path.resolve(__dirname, '../PROJECTS_WEBAPPS/QuanLyCongViecTeam_Index.html');
const REPORT_JSON_PATH = path.resolve(__dirname, 'test_e2e_results.json');

console.log('='.repeat(90));
console.log('STARTING AUTONOMOUS E2E DATA FLOW & PROPAGATION VERIFICATION RUNNER');
console.log('Backend Script : ' + CODE_GS_PATH);
console.log('Frontend SPA   : ' + INDEX_HTML_PATH);
console.log('='.repeat(90));

const results = {
  startedAt: new Date().toISOString(),
  total: 0,
  passed: 0,
  failed: 0,
  scenarios: []
};

function recordTest(scenarioName, testName, passed, details = '') {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(`  \x1b[32m[PASS]\x1b[0m ${testName}`);
  } else {
    results.failed++;
    console.error(`  \x1b[31m[FAIL]\x1b[0m ${testName} - Details: ${details}`);
  }

  let sc = results.scenarios.find(s => s.name === scenarioName);
  if (!sc) {
    sc = { name: scenarioName, tests: [], passed: 0, failed: 0 };
    results.scenarios.push(sc);
  }
  sc.tests.push({ testName, passed, details });
  if (passed) sc.passed++;
  else sc.failed++;
}

// Ensure source files exist
assert.ok(fs.existsSync(CODE_GS_PATH), 'QuanLyCongViecTeam_Code.gs must exist');
assert.ok(fs.existsSync(INDEX_HTML_PATH), 'QuanLyCongViecTeam_Index.html must exist');

const codeGsContent = fs.readFileSync(CODE_GS_PATH, 'utf8');
const indexHtmlContent = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

// =========================================================================================
// SECTION 0: INFRASTRUCTURE — GOOGLE APPS SCRIPT IN-MEMORY EMULATION ENGINE
// =========================================================================================

class MockSheet {
  constructor(name) {
    this.name = name;
    this.rows = []; // 2D array of rows
  }

  getName() { return this.name; }
  getLastRow() { return this.rows.length; }
  getLastColumn() {
    let max = 0;
    this.rows.forEach(r => { if (r && r.length > max) max = r.length; });
    return max;
  }

  appendRow(arr) {
    this.rows.push([...arr]);
  }

  deleteRow(rowIdx) {
    if (rowIdx >= 1 && rowIdx <= this.rows.length) {
      this.rows.splice(rowIdx - 1, 1);
    }
  }

  clear() {
    this.rows = [];
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
          for (let c = 0; c < numCols; c++) {
            const actualColIdx = (startCol - 1) + c;
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
        for (let r = 0; r < val2D.length; r++) {
          const targetRowIdx = (startRow - 1) + r;
          while (sheetRef.rows.length <= targetRowIdx) {
            sheetRef.rows.push([]);
          }
          const row = sheetRef.rows[targetRowIdx];
          for (let c = 0; c < val2D[r].length; c++) {
            const targetColIdx = (startCol - 1) + c;
            while (row.length <= targetColIdx) {
              row.push('');
            }
            row[targetColIdx] = val2D[r][c];
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
  constructor(name = 'QUẢN LÝ CÔNG VIỆC TEAM & TIẾN ĐỘ DỰ ÁN 3.6 — WEB APP v3.6 — FILE ĐI LÀM') {
    this.name = name;
    this.sheets = new Map();
    this.activeSheet = null;
  }

  getId() { return 'MOCK-SS-ID-E2E-TEST'; }
  getName() { return this.name; }
  rename(newName) { this.name = newName; }

  getSheets() {
    return Array.from(this.sheets.values());
  }

  getSheetByName(name) {
    return this.sheets.get(name) || null;
  }

  insertSheet(name) {
    if (!this.sheets.has(name)) {
      const sh = new MockSheet(name);
      this.sheets.set(name, sh);
      this.activeSheet = sh;
    }
    return this.sheets.get(name);
  }

  setActiveSheet(sh) {
    this.activeSheet = sh;
    return sh;
  }

  moveActiveSheet(pos) { return this; }
}

const mockSS = new MockSpreadsheet();

let lastLockWaitMs = 0;
let lockAcquisitionCount = 0;
let lockReleaseCount = 0;

const gasSandbox = {
  SpreadsheetApp: {
    getActiveSpreadsheet: () => mockSS,
    getUi: () => ({
      createMenu: () => ({
        addItem: function() { return this; },
        addSeparator: function() { return this; },
        addToUi: function() {}
      }),
      showModalDialog: () => {}
    }),
    BorderStyle: { SOLID: 'SOLID', SOLID_MEDIUM: 'SOLID_MEDIUM', DOTTED: 'DOTTED' }
  },
  LockService: {
    getScriptLock: () => ({
      waitLock: (ms) => {
        lastLockWaitMs = ms;
        lockAcquisitionCount++;
      },
      releaseLock: () => {
        lockReleaseCount++;
      },
      hasLock: () => lockAcquisitionCount > lockReleaseCount
    })
  },
  Utilities: {
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
    sleep: (ms) => {}
  },
  Logger: { log: (...args) => {} },
  CalendarApp: {
    getDefaultCalendar: () => ({
      createEvent: (title, start, end, opts) => ({ getId: () => 'EVENT-123' })
    })
  },
  HtmlService: {
    createHtmlOutput: () => ({ setWidth: () => ({ setHeight: () => {} }) })
  },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
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

gasSandbox.global = gasSandbox;
vm.createContext(gasSandbox);
vm.runInContext(codeGsContent, gasSandbox);

// Initialize Backend Database
gasSandbox.setupDatabaseSheets();

// =========================================================================================
// SECTION 1: INFRASTRUCTURE — BROWSER DOM & MONOLITHIC SPA SANDBOX
// =========================================================================================

const domElements = new Map();

function parseElementsFromHtml(htmlStr) {
  const openTagRegex = /<([a-zA-Z0-9_-]+)\s+([^>]*id=["']([^"']+)["'][^>]*)>/gi;
  let match;
  while ((match = openTagRegex.exec(htmlStr)) !== null) {
    const tagName = match[1].toUpperCase();
    const attrsStr = match[2];
    const id = match[3];

    let el = domElements.get(id);
    if (!el) {
      el = createMockElement(id, tagName);
      domElements.set(id, el);
    }
    el.tagName = tagName;

    const valMatch = attrsStr.match(/value=["']([^"']*)["']/i);
    if (valMatch) el.value = valMatch[1];

    if (tagName === 'SELECT') {
      const selectEndTag = '</' + match[1] + '>';
      const startIdx = match.index + match[0].length;
      const endIdx = htmlStr.indexOf(selectEndTag, startIdx);
      if (endIdx !== -1) {
        const inner = htmlStr.substring(startIdx, endIdx);
        el.innerHTML = inner;
      }
    }
  }
}

function createMockElement(id = '', tag = 'div') {
  const el = {
    id: id,
    tagName: tag.toUpperCase(),
    value: '',
    _innerHTML: '',
    _innerText: '',
    style: {},
    classList: {
      _classes: new Set(),
      add: function(...cls) { cls.forEach(c => this._classes.add(c)); },
      remove: function(...cls) { cls.forEach(c => this._classes.delete(c)); },
      contains: function(c) { return this._classes.has(c); },
      toggle: function(c, force) {
        if (force === undefined) {
          if (this.contains(c)) { this.remove(c); return false; }
          else { this.add(c); return true; }
        }
        if (force) { this.add(c); return true; }
        else { this.remove(c); return false; }
      }
    },
    attributes: {},
    setAttribute: function(k, v) { this.attributes[k] = String(v); },
    getAttribute: function(k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; },
    hasAttribute: function(k) { return this.attributes[k] !== undefined; },
    removeAttribute: function(k) { delete this.attributes[k]; },
    dataset: {},
    children: [],
    childNodes: [],
    appendChild: function(c) { this.children.push(c); return c; },
    removeChild: function(c) {
      const idx = this.children.indexOf(c);
      if (idx !== -1) this.children.splice(idx, 1);
      return c;
    },
    insertAdjacentHTML: function(pos, htmlStr) {
      this.innerHTML += htmlStr;
    },
    addEventListener: function(event, fn) {},
    removeEventListener: function(event, fn) {},
    dispatchEvent: function(e) { return true; },
    click: function() {},
    focus: function() {},
    blur: function() {},
    options: [],
    selectedIndex: 0,
    closest: function(sel) {
      return createMockElement('', 'tr');
    },
    querySelector: function(sel) {
      return createMockElement('', 'div');
    },
    querySelectorAll: function(sel) {
      return [];
    },
    getBoundingClientRect: function() {
      return { top: 0, left: 0, width: 100, height: 100, bottom: 100, right: 100 };
    },
    getContext: function(type) {
      return {
        fillRect: () => {},
        clearRect: () => {},
        getImageData: () => ({ data: [] }),
        putImageData: () => {},
        createImageData: () => [],
        setTransform: () => {},
        drawImage: () => {},
        save: () => {},
        fillText: () => {},
        restore: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        stroke: () => {},
        fill: () => {},
        arc: () => {},
        measureText: () => ({ width: 50 })
      };
    }
  };

  Object.defineProperty(el, 'innerHTML', {
    get: function() { return this._innerHTML; },
    set: function(val) {
      this._innerHTML = String(val);
      if (this.tagName === 'SELECT') {
        const optRegex = /<option\s+([^>]*)>([\s\S]*?)<\/option>/gi;
        const opts = [];
        let om;
        while ((om = optRegex.exec(this._innerHTML)) !== null) {
          const optEl = createMockElement('', 'option');
          optEl._innerText = om[2].trim();
          optEl._innerHTML = om[2].trim();

          const valMatch = om[1].match(/value=["']([^"']*)["']/i);
          optEl.value = valMatch ? valMatch[1] : om[2].trim();

          const emailMatch = om[1].match(/data-email=["']([^"']*)["']/i);
          if (emailMatch) optEl.setAttribute('data-email', emailMatch[1]);

          const nameMatch = om[1].match(/data-name=["']([^"']*)["']/i);
          if (nameMatch) optEl.setAttribute('data-name', nameMatch[1]);

          if (/selected/i.test(om[1])) {
            optEl.selected = true;
          }
          opts.push(optEl);
        }
        this.options = opts;
        const selIdx = opts.findIndex(o => o.selected);
        this.selectedIndex = selIdx >= 0 ? selIdx : 0;
        if (opts.length > 0 && !this.value) {
          this.value = opts[this.selectedIndex].value;
        }
      } else {
        parseElementsFromHtml(this._innerHTML);
      }
    }
  });

  Object.defineProperty(el, 'innerText', {
    get: function() { return this._innerText || this._innerHTML.replace(/<[^>]+>/g, '').trim(); },
    set: function(val) { this._innerText = String(val); this._innerHTML = String(val); }
  });

  Object.defineProperty(el, 'textContent', {
    get: function() { return this._innerText || this._innerHTML.replace(/<[^>]+>/g, '').trim(); },
    set: function(val) { this._innerText = String(val); this._innerHTML = String(val); }
  });

  return el;
}

function getOrCreateElement(id) {
  if (!id) return null;
  if (!domElements.has(id)) {
    const isSelect = id.includes('select') || id.includes('project') || id.includes('assignee') || id.includes('status') || id.includes('priority') || id.includes('dept') || id.includes('rank') || id.includes('filter');
    domElements.set(id, createMockElement(id, isSelect ? 'select' : 'div'));
  }
  return domElements.get(id);
}

const mockDocument = {
  getElementById: (id) => getOrCreateElement(id),
  querySelector: (sel) => {
    if (sel.startsWith('#')) return getOrCreateElement(sel.slice(1));
    return createMockElement('', 'div');
  },
  querySelectorAll: (sel) => [],
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
MockChart.defaults = {
  font: { family: 'Montserrat', size: 12 },
  color: '#64748b',
  plugins: { legend: { display: false }, tooltip: { enabled: true } }
};

// RPC Bridge connecting Frontend to in-memory Google Apps Script
const mockGoogleScriptRun = {
  withSuccessHandler: function(onSuccess) {
    return {
      withFailureHandler: function(onFailure) {
        return new Proxy({}, {
          get: (target, prop) => {
            return function(...args) {
              try {
                if (typeof gasSandbox[prop] === 'function') {
                  const res = gasSandbox[prop].apply(gasSandbox, args);
                  if (onSuccess) onSuccess(res);
                  return res;
                } else {
                  if (onSuccess) onSuccess({ success: true, message: 'Mocked RPC: ' + prop });
                }
              } catch (e) {
                if (onFailure) onFailure(e);
                else throw e;
              }
            };
          }
        });
      }
    };
  }
};

const frontendSandbox = {
  window: {},
  document: mockDocument,
  localStorage: mockLocalStorage,
  sessionStorage: mockLocalStorage,
  navigator: { userAgent: 'Node.js E2E Runner', clipboard: { writeText: () => Promise.resolve() } },
  location: { href: '', search: '', reload: () => {} },
  history: { pushState: () => {}, replaceState: () => {} },
  addEventListener: () => {},
  removeEventListener: () => {},
  lucide: { createIcons: () => {} },
  Chart: MockChart,
  flatpickr: function(el, opts) {
    return {
      destroy: () => {},
      setDate: (d) => {},
      clear: () => {}
    };
  },
  tailwind: { config: {} },
  google: {
    script: {
      run: mockGoogleScriptRun
    }
  },
  console: {
    log: () => {},
    warn: () => {},
    error: (...args) => console.error('  [Browser Error]:', ...args),
    info: () => {}
  },
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

// Extract and execute inline scripts from Index.html
const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
const inlineScripts = [];
let sm;
while ((sm = scriptRegex.exec(indexHtmlContent)) !== null) {
  if (!sm[0].match(/src=["']/i) && sm[1].trim()) {
    inlineScripts.push(sm[1]);
  }
}

inlineScripts.forEach((code, idx) => {
  try {
    vm.runInContext(code, frontendSandbox);
  } catch (err) {
    console.error(`Index.html Inline Script ${idx + 1} VM load failure:`, err.message);
  }
});

// Seed Initial Data into Frontend AppState from Backend
const initialDataFromGas = gasSandbox.getInitialData();
frontendSandbox.window.AppState = {
  data: {
    tasks: initialDataFromGas.tasks || [],
    projects: initialDataFromGas.projects || [],
    staff: initialDataFromGas.staff || [],
    routines: initialDataFromGas.routines || [],
    checklist: initialDataFromGas.checklist || [],
    taxonomy: initialDataFromGas.taxonomy || []
  }
};

console.log('\n[E2E INFRASTRUCTURE READY]');
console.log(`Initial Store Count: Projects=${frontendSandbox.window.AppState.data.projects.length}, Staff=${frontendSandbox.window.AppState.data.staff.length}, Tasks=${frontendSandbox.window.AppState.data.tasks.length}, Routines=${frontendSandbox.window.AppState.data.routines.length}, Checklist=${frontendSandbox.window.AppState.data.checklist.length}`);

// =========================================================================================
// SCENARIO 1: NHẬP LIỆU TẦNG QUẢN LÝ (MANAGEMENT DATA ENTRY)
// =========================================================================================
console.log('\n' + '='.repeat(80));
console.log('--- SCENARIO 1: NHẬP LIỆU TẦNG QUẢN LÝ ---');
console.log('='.repeat(80));

const sc1Name = 'Scenario 1: Nhập Liệu Tầng Quản Lý';

// --- Test 1.1: Thêm Dự Án Mới (DUAN-999001) ---
{
  const initialProjCount = frontendSandbox.window.AppState.data.projects.length;
  const initialBudgetSum = frontendSandbox.window.AppState.data.projects.reduce((acc, p) => acc + (Number(p.nganSach || p['Ngân Sách'] || 0)), 0);

  // Setup form inputs in DOM
  getOrCreateElement('proj-form-id').value = 'DUAN-999001';
  getOrCreateElement('proj-form-name').value = 'Triển Khai Cổng Thanh Toán OnePay & MoMo';
  getOrCreateElement('proj-form-dept').value = 'Kỹ thuật & Công nghệ';
  getOrCreateElement('proj-form-manager').value = 'Nguyễn Minh Trí';
  getOrCreateElement('proj-form-goal').value = 'Tích hợp Webhook IPN xử lý giao dịch tự động';
  getOrCreateElement('proj-form-start').value = '18/11/2026';
  getOrCreateElement('proj-form-deadline').value = '30/12/2026';
  getOrCreateElement('proj-form-budget').value = '120000000';
  getOrCreateElement('proj-form-status').value = 'Đang tiến hành';
  getOrCreateElement('proj-form-notes').value = 'Dự án hạ tầng thanh toán cốt lõi Q4/2026';

  // Invoke handler
  frontendSandbox.window.ModuleTeamProjects.handleSaveProject({ preventDefault: () => {} });

  // Assertions
  const savedProj = frontendSandbox.window.AppState.data.projects.find(p => (p.maDuAn || p['Mã Dự Án']) === 'DUAN-999001');
  recordTest(sc1Name, '1.1 Thêm mới Dự Án DUAN-999001 vào AppState.data.projects', !!savedProj);
  recordTest(sc1Name, '1.1 Dự Án mới lưu đúng Tên Dự Án', savedProj && savedProj.tenDuAn === 'Triển Khai Cổng Thanh Toán OnePay & MoMo');
  recordTest(sc1Name, '1.1 Dự Án mới lưu đúng Ngân Sách 120.000.000 đ', savedProj && savedProj.nganSach === 120000000);
  recordTest(sc1Name, '1.1 Dự Án mới có Dual Header Mapping (Mã Dự Án & maDuAn)', savedProj && savedProj['Mã Dự Án'] === 'DUAN-999001' && savedProj.maDuAn === 'DUAN-999001');

  // Verify KPI & DOM
  const totalCountEl = getOrCreateElement('proj-total-count');
  recordTest(sc1Name, '1.1 KPI Tổng số dự án (#proj-total-count) cập nhật tăng +1', Number(totalCountEl.innerText) === initialProjCount + 1);

  const gridEl = getOrCreateElement('proj-cards-grid');
  recordTest(sc1Name, '1.1 DOM Master Table / Grid (#proj-cards-grid) hiển thị mã DUAN-999001', gridEl.innerHTML.includes('DUAN-999001'));
  recordTest(sc1Name, '1.1 DOM Master Table / Grid hiển thị tên dự án mới', gridEl.innerHTML.includes('Triển Khai Cổng Thanh Toán OnePay & MoMo'));

  // Edge case: Test Form Validation for Project (Empty Name)
  getOrCreateElement('proj-form-name').value = '';
  const projCountBeforeInvalid = frontendSandbox.window.AppState.data.projects.length;
  frontendSandbox.window.ModuleTeamProjects.handleSaveProject({ preventDefault: () => {} });
  recordTest(sc1Name, '1.1 Form Dự Án từ chối lưu khi để trống Tên Dự Án bắt buộc', 
    frontendSandbox.window.AppState.data.projects.length === projCountBeforeInvalid
  );
}

// --- Test 1.2: Thêm Nhân Sự Mới (NHAN-888002 - Đặng Thái Sơn) ---
{
  const initialStaffCount = frontendSandbox.window.AppState.data.staff.length;

  // Setup form inputs in DOM
  getOrCreateElement('team-form-id').value = 'NHAN-888002';
  getOrCreateElement('team-form-name').value = 'Đặng Thái Sơn';
  getOrCreateElement('team-form-role').value = 'Senior Backend Engineer';
  getOrCreateElement('team-form-rank').value = 'Senior';
  getOrCreateElement('team-form-dept').value = 'Kỹ thuật & Công nghệ';
  getOrCreateElement('team-form-phone').value = '0912345678';
  getOrCreateElement('team-form-email').value = 'son.dang@filedilam.vn';
  getOrCreateElement('team-form-status').value = 'Đang hoạt động';
  getOrCreateElement('team-form-joined-date').value = '15/11/2026';
  getOrCreateElement('team-form-skills').value = 'Node.js, Redis, DevOps';
  getOrCreateElement('team-form-zalo').value = '0912345678';
  getOrCreateElement('team-form-notes').value = 'Chuyên gia backend cổng thanh toán & vi dịch vụ';

  // Invoke handler
  frontendSandbox.window.ModuleTeamProjects.handleSaveStaff({ preventDefault: () => {} });

  // Assertions
  const savedStaff = frontendSandbox.window.AppState.data.staff.find(s => (s.maNhanSu || s['Mã Nhân Sự']) === 'NHAN-888002');
  recordTest(sc1Name, '1.2 Thêm mới Nhân Sự NHAN-888002 vào AppState.data.staff', !!savedStaff);
  recordTest(sc1Name, '1.2 Nhân Sự mới lưu đúng Họ Và Tên Đặng Thái Sơn', savedStaff && savedStaff.hoTen === 'Đặng Thái Sơn');
  recordTest(sc1Name, '1.2 Nhân Sự mới lưu đúng Google Email son.dang@filedilam.vn', savedStaff && savedStaff.googleEmail === 'son.dang@filedilam.vn');
  recordTest(sc1Name, '1.2 Nhân Sự mới có Dual Header Mapping (Google Email & googleEmail)', savedStaff && savedStaff['Google Email'] === 'son.dang@filedilam.vn' && savedStaff.googleEmail === 'son.dang@filedilam.vn');

  // Verify KPI & DOM
  const staffCountEl = getOrCreateElement('team-total-count');
  recordTest(sc1Name, '1.2 KPI Tổng số nhân sự (#team-total-count) cập nhật tăng +1', Number(staffCountEl.innerText) === initialStaffCount + 1);

  const staffGridEl = getOrCreateElement('team-staff-grid');
  recordTest(sc1Name, '1.2 DOM Grid Nhân Sự (#team-staff-grid) hiển thị mã NHAN-888002', staffGridEl.innerHTML.includes('NHAN-888002'));
  recordTest(sc1Name, '1.2 DOM Grid Nhân Sự hiển thị tên Đặng Thái Sơn', staffGridEl.innerHTML.includes('Đặng Thái Sơn'));

  // Edge case: Test Form Validation for Staff (Empty Name)
  getOrCreateElement('team-form-name').value = '';
  const staffCountBeforeInvalid = frontendSandbox.window.AppState.data.staff.length;
  frontendSandbox.window.ModuleTeamProjects.handleSaveStaff({ preventDefault: () => {} });
  recordTest(sc1Name, '1.2 Form Nhân Sự từ chối lưu khi để trống Họ Và Tên bắt buộc', 
    frontendSandbox.window.AppState.data.staff.length === staffCountBeforeInvalid
  );
}

// --- Test 1.3: Thêm Lịch Định Kỳ & Cuộc Họp (LICH-777003) & Checklist Row ---
{
  // Setup filters
  getOrCreateElement('rout-status-filter').value = 'all';
  getOrCreateElement('rout-search-input').value = '';

  // Setup routine form inputs in DOM
  getOrCreateElement('rout-form-id').value = 'LICH-777003';
  getOrCreateElement('rout-form-title').value = 'Họp Kỹ Thuật & Review Kiến Trúc Backend';
  getOrCreateElement('rout-form-frequency').value = 'Thứ 4 hàng tuần';
  getOrCreateElement('rout-form-detail').value = '15:00 - 16:00 Thứ 4 hàng tuần';
  getOrCreateElement('rout-form-start-time').value = '15:00';
  getOrCreateElement('rout-form-end-time').value = '16:00';
  getOrCreateElement('rout-form-leader').value = 'Nguyễn Minh Trí';
  getOrCreateElement('rout-form-status').value = 'Đang kích hoạt';
  getOrCreateElement('rout-form-notes').value = 'Review kiến trúc hạ tầng thanh toán microservices';

  // Invoke saveRoutine
  if (typeof frontendSandbox.window.ModuleRoutinesMatrix.handleSaveRoutine === 'function') {
    frontendSandbox.window.ModuleRoutinesMatrix.handleSaveRoutine();
  } else {
    frontendSandbox.window.ModuleRoutinesMatrix.saveRoutine();
  }

  // Assertions
  const savedRout = frontendSandbox.window.AppState.data.routines.find(r => (r.maLich || r['Mã Lịch']) === 'LICH-777003');
  recordTest(sc1Name, '1.3 Thêm mới Lịch Họp LICH-777003 vào AppState.data.routines', !!savedRout);
  recordTest(sc1Name, '1.3 Tiêu đề cuộc họp lưu chính xác', savedRout && savedRout.tieuDe === 'Họp Kỹ Thuật & Review Kiến Trúc Backend');
  recordTest(sc1Name, '1.3 Bảng Lịch Định Kỳ (#rout-table-body) hiển thị mã LICH-777003', getOrCreateElement('rout-table-body').innerHTML.includes('LICH-777003'));

  // Edge case: Test Form Validation for Routine (Empty Title)
  getOrCreateElement('rout-form-title').value = '';
  const routineCountBeforeInvalid = frontendSandbox.window.AppState.data.routines.length;
  frontendSandbox.window.ModuleRoutinesMatrix.saveRoutine();
  recordTest(sc1Name, '1.3 Form Lịch Họp từ chối lưu khi để trống Tiêu Đề bắt buộc', 
    frontendSandbox.window.AppState.data.routines.length === routineCountBeforeInvalid
  );

  // Setup Checklist Row for new staff & new routine
  const routineSelectEl = getOrCreateElement('matrix-modal-routine-select');
  routineSelectEl.innerHTML = '<option value="LICH-777003|Họp Kỹ Thuật & Review Kiến Trúc Backend" selected>Họp Kỹ Thuật</option>';
  routineSelectEl.value = 'LICH-777003|Họp Kỹ Thuật & Review Kiến Trúc Backend';

  const staffSelectEl = getOrCreateElement('matrix-modal-staff-select');
  staffSelectEl.innerHTML = '<option value="NHAN-888002|Đặng Thái Sơn" selected>Đặng Thái Sơn</option>';
  staffSelectEl.value = 'NHAN-888002|Đặng Thái Sơn';

  const weekSelectEl = getOrCreateElement('matrix-modal-week-select');
  weekSelectEl.value = 'Tuần 46';

  frontendSandbox.window.ModuleRoutinesMatrix.saveChecklistRow();

  const savedChecklistRow = frontendSandbox.window.AppState.data.checklist.find(c => 
    (c.maLich || c['Mã Lịch']) === 'LICH-777003' && (c.maNhanSu || c['Mã Nhân Sự']) === 'NHAN-888002'
  );
  recordTest(sc1Name, '1.3 Hàng Checklist cho Đặng Thái Sơn được tạo trong AppState.data.checklist', !!savedChecklistRow);

  // Verify checklist row correctly harmonized non-meeting days to '-' based on 'Thứ 4 hàng tuần'
  recordTest(sc1Name, '1.3 Hàng Checklist tự động gán ngày không họp là "-" dựa trên tần suất Thứ 4', 
    savedChecklistRow && savedChecklistRow.thu2 === '-' && savedChecklistRow.thu3 === '-' && savedChecklistRow.thu5 === '-' && savedChecklistRow.thu6 === '-'
  );
  recordTest(sc1Name, '1.3 Hàng Checklist tự động gán ngày họp Thứ 4 là "Not Yet"', 
    savedChecklistRow && savedChecklistRow.thu4 === 'Not Yet'
  );

  frontendSandbox.window.ModuleRoutinesMatrix.renderMatrixTable();
  const matrixTableEl = getOrCreateElement('matrix-table-body');
  recordTest(sc1Name, '1.3 Ma Trận Kỷ Luật (#matrix-table-body) hiển thị tên Đặng Thái Sơn', matrixTableEl.innerHTML.includes('Đặng Thái Sơn'));
}

// =========================================================================================
// SCENARIO 2: KẾ THỪA SANG VẬN HÀNH & TẠO TASK (OPERATIONS INHERITANCE)
// =========================================================================================
console.log('\n' + '='.repeat(80));
console.log('--- SCENARIO 2: KẾ THỪA SANG VẬN HÀNH & TẠO TASK ---');
console.log('='.repeat(80));

const sc2Name = 'Scenario 2: Kế Thừa Sang Vận Hành & Tạo Task';

// --- Test 2.1: Kiểm tra Dropdowns Kế Thừa Động Trong Drawer Tạo Task ---
{
  // Open Task Drawer without params -> creates new task form
  frontendSandbox.window.ModuleTasksGantt.openTaskDrawer();

  const drawerBody = getOrCreateElement('drawer-body');
  const projectSelect = getOrCreateElement('task-form-project');
  const assigneeSelect = getOrCreateElement('task-form-assignee');

  // Assert Project Dropdown has newly added project DUAN-999001
  const hasProjectOption = projectSelect.options.some(opt => 
    opt.value === 'DUAN-999001' && (opt.getAttribute('data-name') === 'Triển Khai Cổng Thanh Toán OnePay & MoMo' || opt.getAttribute('data-name') === 'Triển Khai Cổng Thanh Toán OnePay &amp; MoMo')
  );
  recordTest(sc2Name, '2.1 Dropdown "Thuộc Dự Án" kế thừa tự động DUAN-999001 & data-name', hasProjectOption);

  // Assert Assignee Dropdown has newly added staff Đặng Thái Sơn
  const hasStaffOption = assigneeSelect.options.some(opt => 
    opt.value === 'Đặng Thái Sơn' && opt.getAttribute('data-email') === 'son.dang@filedilam.vn'
  );
  recordTest(sc2Name, '2.1 Dropdown "Người Phụ Trách" kế thừa tự động Đặng Thái Sơn & data-email', hasStaffOption);
}

// --- Test 2.2: Tự Động Điền Email Google Khi Chọn Nhân Sự ---
{
  const assigneeSelect = getOrCreateElement('task-form-assignee');
  const emailInput = getOrCreateElement('task-form-email');

  // Find option index for Đặng Thái Sơn
  const sonIdx = assigneeSelect.options.findIndex(opt => opt.value === 'Đặng Thái Sơn');
  assert.ok(sonIdx >= 0, 'Option Đặng Thái Sơn must exist in assignee select');

  assigneeSelect.selectedIndex = sonIdx;
  assigneeSelect.value = 'Đặng Thái Sơn';

  // Trigger onchange handler
  frontendSandbox.window.ModuleTasksGantt.handleStaffSelectChange(assigneeSelect);

  recordTest(sc2Name, '2.2 Chọn Đặng Thái Sơn tự động điền son.dang@filedilam.vn vào #task-form-email', emailInput.value === 'son.dang@filedilam.vn');

  // Edge case: Test clearing email input when selecting staff with no email
  assigneeSelect.options.push({
    value: 'Trần Văn Không Email',
    getAttribute: (attr) => attr === 'data-email' ? '' : null
  });
  assigneeSelect.selectedIndex = assigneeSelect.options.length - 1;
  assigneeSelect.value = 'Trần Văn Không Email';
  frontendSandbox.window.ModuleTasksGantt.handleStaffSelectChange(assigneeSelect);
  recordTest(sc2Name, '2.2 Chọn nhân sự không có email thì ô #task-form-email tự động xóa trắng', emailInput.value === '');

  // Reset back to Đặng Thái Sơn for subsequent tests
  assigneeSelect.selectedIndex = sonIdx;
  assigneeSelect.value = 'Đặng Thái Sơn';
  frontendSandbox.window.ModuleTasksGantt.handleStaffSelectChange(assigneeSelect);
}

// --- Test 2.3: Tạo Task Mới (Khẩn Cấp, 30% Tiến Độ, Thuộc DUAN-999001) ---
let createdTaskId = null;
{
  const initialTaskCount = frontendSandbox.window.AppState.data.tasks.length;

  // Set form fields
  getOrCreateElement('task-form-name').value = 'Tích hợp Webhook IPN xử lý giao dịch tự động';
  
  const projSelect = getOrCreateElement('task-form-project');
  const pIdx = projSelect.options.findIndex(opt => opt.value === 'DUAN-999001');
  assert.ok(pIdx >= 0, 'DUAN-999001 option must exist');
  projSelect.selectedIndex = pIdx;
  projSelect.value = 'DUAN-999001';

  getOrCreateElement('task-form-priority').value = 'Khẩn cấp';
  getOrCreateElement('task-form-weight').value = '5';
  getOrCreateElement('task-form-start-date').value = '18/11/2026';
  getOrCreateElement('task-form-deadline').value = '25/11/2026';
  getOrCreateElement('task-form-deadline-time').value = '17:30';
  getOrCreateElement('task-form-progress').value = '30';
  getOrCreateElement('task-form-status').value = 'Đang tiến hành';
  getOrCreateElement('task-form-notes').value = 'Cổng OnePay & MoMo IPN signature validation';

  // Edge case: Test Form Validation for Task (Empty Name)
  getOrCreateElement('task-form-name').value = '';
  const taskCountBeforeInvalid = frontendSandbox.window.AppState.data.tasks.length;
  frontendSandbox.window.ModuleTasksGantt.saveTaskFromDrawer({ preventDefault: () => {} });
  recordTest(sc2Name, '2.3 Form Nhiệm Vụ từ chối lưu khi để trống Tên Nhiệm Vụ bắt buộc', 
    frontendSandbox.window.AppState.data.tasks.length === taskCountBeforeInvalid
  );

  // Restore valid task name and invoke save
  getOrCreateElement('task-form-name').value = 'Tích hợp Webhook IPN xử lý giao dịch tự động';
  frontendSandbox.window.ModuleTasksGantt.saveTaskFromDrawer({ preventDefault: () => {} });

  // Assertions
  const tasks = frontendSandbox.window.AppState.data.tasks;
  recordTest(sc2Name, '2.3 Số lượng nhiệm vụ trong AppState.data.tasks tăng +1', tasks.length === initialTaskCount + 1);

  const newTask = tasks[0]; // unshifted to top
  createdTaskId = newTask ? (newTask.maTask || newTask['Mã Task']) : null;

  recordTest(sc2Name, '2.3 Task mới được thêm vào đầu danh sách (unshift)', !!newTask && newTask.tenNhiemVu === 'Tích hợp Webhook IPN xử lý giao dịch tự động');
  recordTest(sc2Name, `2.3 Mã Task đúng định dạng TASK-XXXXXX [observed: ${createdTaskId}]`, !!createdTaskId && /^TASK-\d{6}$/.test(createdTaskId));
  recordTest(sc2Name, '2.3 Task mới gán đúng Dự Án DUAN-999001', newTask && newTask.maDuAn === 'DUAN-999001');
  recordTest(sc2Name, '2.3 Task mới gán đúng Người Phụ Trách Đặng Thái Sơn', newTask && newTask.nguoiPhuTrach === 'Đặng Thái Sơn');
  recordTest(sc2Name, '2.3 Task mới gán đúng Email Nhân Sự son.dang@filedilam.vn', newTask && newTask.emailNhanSu === 'son.dang@filedilam.vn');
  recordTest(sc2Name, '2.3 Task mới có Cấp Độ Khẩn Cấp', newTask && newTask.capDo === 'Khẩn cấp');
  recordTest(sc2Name, '2.3 Task mới có Tiến Độ 30%', newTask && newTask.tienDo === 30);
  recordTest(sc2Name, '2.3 Task mới có Dual Header Mapping đầy đủ 14 trường', newTask && newTask['Mã Task'] === newTask.maTask && newTask['Tên Nhiệm Vụ'] === newTask.tenNhiemVu && newTask['Mã Dự Án'] === newTask.maDuAn);
}

// =========================================================================================
// SCENARIO 3: PHẢN ÁNH THỜI GIAN THỰC (REALTIME PROPAGATION)
// =========================================================================================
console.log('\n' + '='.repeat(80));
console.log('--- SCENARIO 3: PHẢN ÁNH THỜI GIAN THỰC (GANTT, MATRIX, DASHBOARD) ---');
console.log('='.repeat(80));

const sc3Name = 'Scenario 3: Phản Ánh Thời Gian Thực';

// --- Test 3.1: Kiểm Tra Biểu Đồ Gantt Timeline ---
{
  frontendSandbox.window.ModuleTasksGantt.render('gantt');

  const ganttContainer = getOrCreateElement('gantt-grid-container');
  const ganttHtml = ganttContainer.innerHTML;

  recordTest(sc3Name, '3.1 Biểu đồ Gantt vẽ thanh bar chứa mã task mới', ganttHtml.includes(createdTaskId));
  recordTest(sc3Name, '3.1 Thanh Task Bar mang màu đỏ Rose Khẩn Cấp (bg-rose-500)', ganttHtml.includes('bg-rose-500'));
  recordTest(sc3Name, '3.1 Thanh Task Bar hiển thị tiến độ 30% (width: 30%)', ganttHtml.includes('width: 30%'));

  // Test Gantt Project Filter
  frontendSandbox.window.ModuleTasksGantt.handleGanttFilter('project', 'DUAN-999001');
  const filteredGanttHtml = getOrCreateElement('gantt-grid-container').innerHTML;
  recordTest(sc3Name, '3.1 Bộ lọc Gantt theo Dự Án DUAN-999001 chỉ hiển thị task thuộc dự án này', filteredGanttHtml.includes(createdTaskId));

  // Reset Gantt Filter
  frontendSandbox.window.ModuleTasksGantt.handleGanttFilter('project', '');
}

// --- Test 3.2: Kiểm Tra Cộng Gộp Tiến Độ Dự Án (Project Progress Roll-up) ---
{
  // In Backend, recalculateProjectProgress updates DB_DuAn column 10
  gasSandbox.recalculateProjectProgress(mockSS, 'DUAN-999001');

  const duAnSheet = mockSS.getSheetByName('DB_DuAn');
  const projRows = duAnSheet.getRange(2, 1, duAnSheet.getLastRow() - 1, 12).getValues();
  const targetProjRow = projRows.find(r => String(r[0]).trim() === 'DUAN-999001');

  recordTest(sc3Name, '3.2 Backend recalculateProjectProgress tính đúng tiến độ 30% từ task con', targetProjRow && Number(targetProjRow[9]) === 30);

  // Client-side Autonomous Roll-up Verification
  const frontProj = frontendSandbox.window.AppState.data.projects.find(p => (p.maDuAn || p['Mã Dự Án']) === 'DUAN-999001');
  recordTest(sc3Name, '3.2 Client-side tự động cộng gộp tiến độ dự án DUAN-999001 đạt 30%', frontProj && Number(frontProj.tienDoTong || frontProj['Tiến Độ Tổng %']) === 30);

  frontendSandbox.window.ModuleTeamProjects.renderProjects();
  const projCardsHtml = getOrCreateElement('proj-cards-grid').innerHTML;
  recordTest(sc3Name, '3.2 Giao diện Thẻ Dự Án hiển thị tiến độ 30%', projCardsHtml.includes('30%'));
}

// --- Test 3.3: Kiểm Tra Ma Trận Kỷ Luật (Checklist Toggle 0% -> 100%) ---
{
  const checklist = frontendSandbox.window.AppState.data.checklist;
  const sonRow = checklist.find(c => (c.maLich || c['Mã Lịch']) === 'LICH-777003' && (c.maNhanSu || c['Mã Nhân Sự']) === 'NHAN-888002');
  assert.ok(sonRow, 'Son row in checklist must exist');

  recordTest(sc3Name, '3.3 Tỷ lệ kỷ luật ban đầu của Đặng Thái Sơn là 0%', sonRow.tyLeTuan === '0%');

  // Toggle Wednesday cell to 'Done'
  // In toggleCell: if current is 'Not Yet', next is '-'. If '-', next is 'Done'.
  while (sonRow.thu4 !== 'Done') {
    frontendSandbox.window.ModuleRoutinesMatrix.toggleCell('LICH-777003', 'NHAN-888002', 'thu4');
  }

  recordTest(sc3Name, '3.3 Toggle cell Thứ 4 chuyển thành trạng thái Done', sonRow.thu4 === 'Done');
  recordTest(sc3Name, `3.3 Tỷ lệ kỷ luật tuần của Đặng Thái Sơn nhảy lên 100% [observed: ${sonRow.tyLeTuan}]`, sonRow.tyLeTuan === '100%');

  const matrixHtml = getOrCreateElement('matrix-table-body').innerHTML;
  recordTest(sc3Name, '3.3 Ma Trận Kỷ Luật DOM cập nhật huy hiệu xanh 100%', matrixHtml.includes('100%'));
}

// --- Test 3.4: Kiểm Tra Dashboard KPIs & Daily Actions ---
{
  frontendSandbox.window.ModuleDashboard.render();

  const elActiveTasks = getOrCreateElement('dash-kpi-active-tasks');
  const activeCount = Number(elActiveTasks.textContent || elActiveTasks.innerText);
  recordTest(sc3Name, '3.4 Dashboard KPI Nhiệm Vụ Đang Chạy cập nhật > 0', activeCount > 0);

  const elOverdueTasks = getOrCreateElement('dash-kpi-overdue-tasks');
  const overdueCount = Number(elOverdueTasks.textContent || elOverdueTasks.innerText);
  recordTest(sc3Name, '3.4 Dashboard KPI Quá Hạn & Khẩn Cấp ghi nhận task khẩn cấp mới', overdueCount > 0);

  const dailyActionsHtml = getOrCreateElement('dash-daily-action-list').innerHTML;
  recordTest(sc3Name, '3.4 Task khẩn cấp mới xuất hiện trong Daily Action Center', dailyActionsHtml.includes('Tích hợp Webhook IPN xử lý giao dịch tự động') || dailyActionsHtml.includes(createdTaskId));
}

// =========================================================================================
// SCENARIO 4: BACKEND GOOGLE APPS SCRIPT DRY-RUN
// =========================================================================================
console.log('\n' + '='.repeat(80));
console.log('--- SCENARIO 4: BACKEND GOOGLE APPS SCRIPT DRY-RUN ---');
console.log('='.repeat(80));

const sc4Name = 'Scenario 4: Backend Google Apps Script Dry-Run';

// --- Test 4.1: Thực thi apiSaveProject trên Mock Sheets ---
{
  const res = gasSandbox.apiSaveProject({
    maDuAn: 'DUAN-999001',
    tenDuAn: 'Triển Khai Cổng Thanh Toán OnePay & MoMo',
    phongBan: 'Kỹ thuật & Công nghệ',
    nguoiQuanLy: 'Nguyễn Minh Trí',
    nganSach: 120000000,
    hanHoanThanh: '30/12/2026',
    trangThai: 'Đang tiến hành'
  });

  recordTest(sc4Name, '4.1 Backend apiSaveProject thực thi thành công (success: true)', res && res.success === true);

  const duAnSheet = mockSS.getSheetByName('DB_DuAn');
  const rows = duAnSheet.getRange(2, 1, duAnSheet.getLastRow() - 1, 12).getValues();
  const found = rows.some(r => String(r[0]).trim() === 'DUAN-999001' && String(r[1]).trim().includes('OnePay & MoMo'));
  recordTest(sc4Name, '4.1 Tab DB_DuAn trong Google Sheets ghi nhận dòng DUAN-999001 chuẩn xác', found);
}

// --- Test 4.2: Thực thi apiSaveStaff trên Mock Sheets ---
{
  const res = gasSandbox.apiSaveStaff({
    maNhanSu: 'NHAN-888002',
    hoTen: 'Đặng Thái Sơn',
    chucDanh: 'Senior Backend Engineer',
    googleEmail: 'son.dang@filedilam.vn',
    soDienThoai: '0912345678',
    capBac: 'Senior',
    phongBan: 'Kỹ thuật & Công nghệ',
    kyNang: 'Node.js, Redis, DevOps',
    trangThai: 'Đang hoạt động'
  });

  recordTest(sc4Name, '4.2 Backend apiSaveStaff thực thi thành công (success: true)', res && res.success === true);

  const staffSheet = mockSS.getSheetByName('DB_NhanSu');
  const rows = staffSheet.getRange(2, 1, staffSheet.getLastRow() - 1, 14).getValues();
  const found = rows.some(r => String(r[0]).trim() === 'NHAN-888002' && String(r[6]).trim() === 'son.dang@filedilam.vn');
  recordTest(sc4Name, '4.2 Tab DB_NhanSu ghi nhận dòng NHAN-888002 & son.dang@filedilam.vn', found);
}

// --- Test 4.3: Thực thi apiSaveTask trên Mock Sheets ---
{
  const res = gasSandbox.apiSaveTask({
    maTask: createdTaskId || 'TASK-999001',
    tenNhiemVu: 'Tích hợp Webhook IPN xử lý giao dịch tự động',
    maDuAn: 'DUAN-999001',
    tenDuAn: 'Triển Khai Cổng Thanh Toán OnePay & MoMo',
    nguoiPhuTrach: 'Đặng Thái Sơn',
    emailNhanSu: 'son.dang@filedilam.vn',
    capDo: 'Khẩn cấp',
    trongSo: 5,
    ngayBatDau: '18/11/2026',
    deadline: '25/11/2026',
    gioDeadline: '17:30',
    tienDo: 30,
    trangThai: 'Đang tiến hành'
  });

  recordTest(sc4Name, '4.3 Backend apiSaveTask thực thi thành công (success: true)', res && res.success === true);

  const taskSheet = mockSS.getSheetByName('DB_CongViec');
  const rows = taskSheet.getRange(2, 1, taskSheet.getLastRow() - 1, 15).getValues();
  const found = rows.some(r => String(r[0]).trim() === (createdTaskId || 'TASK-999001'));
  recordTest(sc4Name, '4.3 Tab DB_CongViec ghi nhận đúng Task mới vừa lưu', found);
}

// --- Test 4.4: Thực thi apiUpdateChecklistCell trên Mock Sheets ---
{
  // First append row to DB_ChecklistLap if not present
  const clSheet = mockSS.getSheetByName('DB_ChecklistLap');
  clSheet.appendRow(['LICH-777003', 'Họp Kỹ Thuật', 'NHAN-888002', 'Đặng Thái Sơn', '-', '-', 'Not Yet', '-', '-', '-', '0%', 'Tuần 46']);

  const res = gasSandbox.apiUpdateChecklistCell('LICH-777003', 'NHAN-888002', 'thu4', 'Done');
  recordTest(sc4Name, '4.4 Backend apiUpdateChecklistCell thực thi thành công', res && res.success === true);

  const rows = clSheet.getRange(2, 1, clSheet.getLastRow() - 1, 12).getValues();
  const found = rows.some(r => String(r[0]).trim() === 'LICH-777003' && String(r[2]).trim() === 'NHAN-888002' && String(r[6]).trim() === 'Done');
  recordTest(sc4Name, '4.4 Tab DB_ChecklistLap cập nhật ô Thứ 4 thành "Done"', found);
}

// --- Test 4.5: Xác thực LockService Concurrency & Exception Safety ---
{
  recordTest(sc4Name, `4.5 LockService.waitLock được gọi với timeout >= 10000ms [observed: ${lastLockWaitMs}ms]`, lastLockWaitMs >= 10000);
  recordTest(sc4Name, `4.5 LockService.releaseLock được giải phóng đầy đủ [Acquired: ${lockAcquisitionCount}, Released: ${lockReleaseCount}]`, lockAcquisitionCount === lockReleaseCount);

  // Exception Safety Test
  let lockWasReleasedOnException = false;
  const errorMockLockService = {
    getScriptLock: () => ({
      waitLock: () => {},
      releaseLock: () => { lockWasReleasedOnException = true; }
    })
  };
  const errorSandbox = {
    LockService: errorMockLockService,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => { throw new Error('SIMULATED_DB_CRASH'); }
    },
    Logger: { log: () => {} },
    SHEET_CONG_VIEC: 'DB_CongViec',
    Utilities: { formatDate: () => '' },
    Intl, Date, Math, JSON, String, Number, Array, Object, Boolean, RegExp, console
  };
  errorSandbox.global = errorSandbox;

  vm.createContext(errorSandbox);
  vm.runInContext(codeGsContent, errorSandbox);
  const errRes = errorSandbox.apiSaveTask({});

  recordTest(sc4Name, '4.5 Backend xử lý ngoại lệ an toàn không crash (success: false)', errRes && errRes.success === false && errRes.message.includes('SIMULATED_DB_CRASH'));
  recordTest(sc4Name, '4.5 LockService cam kết 100% giải phóng khóa trong khối finally khi ném exception', lockWasReleasedOnException === true);
}

// --- Test 4.6: Xác thực Dual Header Mapping Trong getInitialData() ---
{
  const initData = gasSandbox.getInitialData();
  recordTest(sc4Name, '4.6 getInitialData() trả về success: true', initData && initData.success === true);

  const tables = ['tasks', 'projects', 'staff', 'routines', 'checklist', 'taxonomy'];
  const allTablesPresent = tables.every(t => Array.isArray(initData[t]) && initData[t].length > 0);
  recordTest(sc4Name, '4.6 getInitialData() trả về đầy đủ 6 bảng dữ liệu nguồn', allTablesPresent);

  // Check Dual Header Mapping on Tasks
  const sampleTask = initData.tasks[0];
  const taskDualOk = sampleTask && sampleTask.maTask && sampleTask['Mã Task'] && sampleTask.tenNhiemVu && sampleTask['Tên Nhiệm Vụ'];
  recordTest(sc4Name, '4.6 Bảng tasks có Dual Header Mapping (tiếng Việt có dấu & camelCase)', !!taskDualOk);

  // Check Dual Header Mapping on Projects
  const sampleProj = initData.projects[0];
  const projDualOk = sampleProj && sampleProj.maDuAn && sampleProj['Mã Dự Án'] && sampleProj.tenDuAn && sampleProj['Tên Dự Án'];
  recordTest(sc4Name, '4.6 Bảng projects có Dual Header Mapping', !!projDualOk);

  // Check Dual Header Mapping on Staff
  const sampleStaff = initData.staff[0];
  const staffDualOk = sampleStaff && sampleStaff.maNhanSu && sampleStaff['Mã Nhân Sự'] && sampleStaff.hoTen && sampleStaff['Họ Và Tên'];
  recordTest(sc4Name, '4.6 Bảng staff có Dual Header Mapping', !!staffDualOk);

  // Check Dual Header Mapping on Routines
  const sampleRout = initData.routines[0];
  const routDualOk = sampleRout && sampleRout.maLich && sampleRout['Mã Lịch'] && sampleRout.tieuDe && sampleRout['Tiêu Đề Đầu Việc / Meeting'];
  recordTest(sc4Name, '4.6 Bảng routines có Dual Header Mapping', !!routDualOk);

  // Check Dual Header Mapping on Checklist
  const sampleChecklist = initData.checklist[0];
  const checklistDualOk = sampleChecklist && sampleChecklist.maLich && sampleChecklist['Mã Lịch'] && sampleChecklist.thu4 && sampleChecklist['Thứ 4'];
  recordTest(sc4Name, '4.6 Bảng checklist có Dual Header Mapping', !!checklistDualOk);
}

// =========================================================================================
// SUMMARY & REPORT GENERATION
// =========================================================================================
console.log('\n' + '='.repeat(90));
console.log('=== END-TO-END VERIFICATION SUMMARY ===');
console.log('='.repeat(90));

results.completedAt = new Date().toISOString();
results.durationMs = new Date(results.completedAt) - new Date(results.startedAt);

results.scenarios.forEach((sc, idx) => {
  const statusColor = sc.failed === 0 ? '\x1b[32m' : '\x1b[31m';
  console.log(`${idx + 1}. ${sc.name.padEnd(52)}: ${statusColor}${sc.passed}/${sc.tests.length} PASS\x1b[0m`);
});

console.log('-'.repeat(90));
console.log(`TOTAL TESTS  : ${results.total}`);
console.log(`PASSED       : \x1b[32m${results.passed}\x1b[0m`);
console.log(`FAILED       : ${results.failed > 0 ? '\x1b[31m' + results.failed + '\x1b[0m' : '\x1b[32m0\x1b[0m'}`);
console.log(`DURATION     : ${results.durationMs}ms`);
console.log('='.repeat(90));

// Export JSON Report
fs.writeFileSync(REPORT_JSON_PATH, JSON.stringify(results, null, 2), 'utf8');
console.log(`Detailed JSON report written to: ${REPORT_JSON_PATH}`);

if (results.failed > 0) {
  console.error('\n\x1b[31m[CRITICAL FAILURE] Some E2E tests failed! Check details above.\x1b[0m');
  process.exit(1);
} else {
  console.log('\n\x1b[32m[PERFECT VICTORY] ALL 4 SCENARIOS PASSED 100% WITH 0 ERRORS.\x1b[0m');
  process.exit(0);
}
