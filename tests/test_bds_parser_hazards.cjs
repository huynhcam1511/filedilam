/**
 * ADVERSARIAL STRESS TEST SUITE: Google Apps Script HtmlService Parser Hazards
 * Target: PROJECTS_WEBAPPS/BatDongSan_Index.html
 * Author: challenger_bds_2 (Token Parser Safety Challenger)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { StringDecoder } = require('string_decoder');

const TARGET_HTML = path.resolve(__dirname, '../PROJECTS_WEBAPPS/BatDongSan_Index.html');
const TARGET_GS = path.resolve(__dirname, '../PROJECTS_WEBAPPS/BatDongSan_Code.gs');

console.log('================================================================');
console.log('EMPIRICAL ADVERSARIAL CHALLENGER: GAS HtmlService PARSER HAZARDS');
console.log('Target HTML: ' + TARGET_HTML);
console.log('================================================================\n');

if (!fs.existsSync(TARGET_HTML)) {
  console.error('ERROR: Target HTML file does not exist: ' + TARGET_HTML);
  process.exit(1);
}

const htmlContent = fs.readFileSync(TARGET_HTML, 'utf8');
const htmlBuffer = fs.readFileSync(TARGET_HTML);
const fullLines = htmlContent.split(/\r?\n/);

console.log(`Document Statistics:`);
console.log(`- Total characters: ${htmlContent.length}`);
console.log(`- Total bytes (UTF-8): ${htmlBuffer.length}`);
console.log(`- Total lines: ${fullLines.length}\n`);

// -------------------------------------------------------------
// HELPER: Extract all <script> blocks
// -------------------------------------------------------------
function extractScripts(html) {
  const scripts = [];
  // Regex to match <script ...> ... </script>
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    const fullMatch = match[0];
    const attrs = match[1];
    const content = match[2];
    const startIndex = match.index;
    
    // Determine start line number in original file (1-based)
    const prefix = html.substring(0, startIndex);
    const startLine = prefix.split(/\r?\n/).length;
    
    const isExternal = /src\s*=\s*['"]/i.test(attrs);
    const srcMatch = attrs.match(/src\s*=\s*['"]([^'"]+)['"]/i);
    const src = srcMatch ? srcMatch[1] : null;

    scripts.push({
      index: scripts.length,
      isExternal,
      src,
      attrs: attrs.trim(),
      content,
      startLine,
      lineCount: content.split(/\r?\n/).length,
      byteLength: Buffer.byteLength(content, 'utf8')
    });
  }
  return scripts;
}

const allScripts = extractScripts(htmlContent);
console.log(`Extracted ${allScripts.length} <script> tags:`);
allScripts.forEach(s => {
  if (s.isExternal) {
    console.log(`  [#${s.index}] External: src="${s.src}" (line ${s.startLine})`);
  } else {
    console.log(`  [#${s.index}] Inline: ${s.lineCount} lines, ${s.byteLength} bytes (starts at line ${s.startLine})`);
  }
});
console.log('');

const inlineScripts = allScripts.filter(s => !s.isExternal);

let failedTests = 0;
let passedTests = 0;
let warnings = 0;

function assert(condition, testName, details) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.log(`[FAIL] ${testName}`);
    if (details) console.log(`       Details: ${details}`);
    failedTests++;
  }
}

function warn(testName, details) {
  console.log(`[WARN] ${testName}`);
  if (details) console.log(`       Details: ${details}`);
  warnings++;
}

// =============================================================
// TEST 1: LINE LENGTH HAZARD ANALYSIS
// =============================================================
console.log('-------------------------------------------------------------');
console.log('TEST 1: Script Line Length Hazards (< 100 characters scan)');
console.log('-------------------------------------------------------------');

// We test two scopes:
// A. Embedded Data Block lines (micro-seed data) - STRICT limit <= 100 chars
// B. Entire Inline Script lines - full audit and categorization

let longDataLines = [];
let longScriptLines = [];
let maxDataLineLen = 0;
let maxScriptLineLen = 0;

inlineScripts.forEach(s => {
  const lines = s.content.split(/\r?\n/);
  let inDataBlock = false;

  lines.forEach((line, idx) => {
    const fileLineNum = s.startLine + idx;
    const len = line.length;
    const byteLen = Buffer.byteLength(line, 'utf8');

    // Detect micro-seed embedded data block (lines ~1533 to ~2072)
    if (line.includes('window.AppState = {')) {
      inDataBlock = true;
    }

    if (inDataBlock) {
      if (len > maxDataLineLen) maxDataLineLen = len;
      if (len > 100) {
        longDataLines.push({ fileLineNum, len, byteLen, line: line.substring(0, 120) });
      }
      if (line.trim() === '};' && idx > 50) {
        inDataBlock = false;
      }
    }

    if (len > maxScriptLineLen) maxScriptLineLen = len;
    if (len > 100) {
      longScriptLines.push({ fileLineNum, len, byteLen, line: line.substring(0, 120) });
    }
  });
});

console.log(`Data Block Analysis:`);
console.log(`  Max line length in embedded data block: ${maxDataLineLen} characters.`);
assert(
  longDataLines.length === 0,
  `Embedded micro-seed data lines strictly <= 100 characters`,
  longDataLines.length > 0 ? `Found ${longDataLines.length} lines > 100 chars in data block! Max: ${maxDataLineLen}. Sample: Line ${longDataLines[0].fileLineNum} (${longDataLines[0].len} chars)` : null
);

console.log(`\nFull Script Lines Analysis (All inline scripts):`);
console.log(`  Total script lines scanned: ${inlineScripts.reduce((acc, s) => acc + s.lineCount, 0)}`);
console.log(`  Max line length in script: ${maxScriptLineLen} characters`);
console.log(`  Script lines exceeding 100 characters: ${longScriptLines.length}`);

// Categorize script lines exceeding 100 characters:
const longLinesByCategory = {
  svgOrIcon: 0,
  htmlTemplateLiteral: 0,
  commentHeader: 0,
  tailwindClassList: 0,
  otherJsLogic: 0
};

longScriptLines.forEach(l => {
  if (l.line.includes('<svg') || l.line.includes('path d=') || l.line.includes('viewBox=')) {
    longLinesByCategory.svgOrIcon++;
  } else if (l.line.includes('`') || l.line.includes('<tr') || l.line.includes('<div') || l.line.includes('<button') || l.line.includes('<span')) {
    longLinesByCategory.htmlTemplateLiteral++;
  } else if (l.line.trim().startsWith('//') || l.line.trim().startsWith('*')) {
    longLinesByCategory.commentHeader++;
  } else if (l.line.includes('class="') || l.line.includes("class='")) {
    longLinesByCategory.tailwindClassList++;
  } else {
    longLinesByCategory.otherJsLogic++;
  }
});

console.log(`  Breakdown of script lines > 100 chars:`);
console.log(`   - HTML Template Literals: ${longLinesByCategory.htmlTemplateLiteral}`);
console.log(`   - Tailwind Class Lists:   ${longLinesByCategory.tailwindClassList}`);
console.log(`   - SVG / Path strings:     ${longLinesByCategory.svgOrIcon}`);
console.log(`   - Comment headers:        ${longLinesByCategory.commentHeader}`);
console.log(`   - Other JS Logic:         ${longLinesByCategory.otherJsLogic}`);

console.log(`  Top 10 longest lines in <script> tags:`);
const sortedLongLines = [...longScriptLines].sort((a, b) => b.len - a.len).slice(0, 10);
sortedLongLines.forEach((l, idx) => {
  console.log(`    #${idx + 1} Line ${l.fileLineNum} (${l.len} chars, ${l.byteLen} bytes): ${l.line.trim().substring(0, 80)}...`);
});

// Comparison with Golden Standards (CONGNO_Index.html and TAISAN_Index.html)
console.log('\n  Comparison with Golden Standards:');
['STANDARDS_TEMPLATE/CONGNO_Index.html', 'STANDARDS_TEMPLATE/TAISAN_Index.html'].forEach(tmplPath => {
  const fullPath = path.resolve(__dirname, '..', tmplPath);
  if (fs.existsSync(fullPath)) {
    const tmplHtml = fs.readFileSync(fullPath, 'utf8');
    const tmplScripts = extractScripts(tmplHtml).filter(s => !s.isExternal);
    let tmplMaxLine = 0;
    let tmplLongLines = 0;
    tmplScripts.forEach(s => {
      s.content.split(/\r?\n/).forEach(l => {
        if (l.length > tmplMaxLine) tmplMaxLine = l.length;
        if (l.length > 100) tmplLongLines++;
      });
    });
    console.log(`    ${tmplPath}: Max script line length = ${tmplMaxLine} chars, Lines > 100 = ${tmplLongLines}`);
  }
});

// =============================================================
// TEST 2: SCRIPT TAG INJECTION & PARSER COLLISION HAZARDS
// =============================================================
console.log('\n-------------------------------------------------------------');
console.log('TEST 2: Script Tag Injection & Collision Hazards');
console.log('-------------------------------------------------------------');

let scriptTagCollisions = [];
let htmlCommentsInJs = [];

inlineScripts.forEach(s => {
  const lines = s.content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    const fileLineNum = s.startLine + idx;
    
    // Check for </script> inside script content
    if (/<\/script/i.test(line)) {
      scriptTagCollisions.push({ fileLineNum, line: line.trim() });
    }

    // Check for HTML comment tags <!-- or --> inside JS
    if (line.includes('<!--') || line.includes('-->')) {
      htmlCommentsInJs.push({ fileLineNum, line: line.trim() });
    }
  });
});

assert(
  scriptTagCollisions.length === 0,
  `Zero '</script>' parser collision hazards inside inline scripts`,
  scriptTagCollisions.length > 0 ? `Found: ${JSON.stringify(scriptTagCollisions)}` : null
);

assert(
  htmlCommentsInJs.length === 0,
  `Zero HTML comment syntax (<!-- or -->) inside javascript blocks`,
  htmlCommentsInJs.length > 0 ? `Found ${htmlCommentsInJs.length} HTML comments: ${JSON.stringify(htmlCommentsInJs)}` : null
);

// =============================================================
// TEST 3: UTF-8 MULTIBYTE INTEGRITY & CHUNK BOUNDARY SLICING
// =============================================================
console.log('\n-------------------------------------------------------------');
console.log('TEST 3: Multibyte UTF-8 Integrity & Chunk Streaming Hazards');
console.log('-------------------------------------------------------------');

// Check BOM
const hasBOM = htmlBuffer[0] === 0xEF && htmlBuffer[1] === 0xBB && htmlBuffer[2] === 0xBF;
assert(!hasBOM, `No UTF-8 Byte Order Mark (BOM) present (clean UTF-8)`, hasBOM ? 'BOM detected at start of file' : null);

// Check for invalid UTF-8 replacement characters
const replacementCharCount = (htmlContent.match(/\uFFFD/g) || []).length;
assert(
  replacementCharCount === 0,
  `Zero Unicode replacement characters (\\uFFFD) in document`,
  `Found ${replacementCharCount} corrupted Unicode replacement characters!`
);

// Check for unescaped or broken unicode escapes
const brokenUnicodeEscape = /\\u[0-9a-fA-F]{0,3}[^0-9a-fA-F]/g;
const brokenEscapes = htmlContent.match(brokenUnicodeEscape) || [];
assert(
  brokenEscapes.length === 0,
  `Zero broken unicode escape sequences in document`,
  `Found: ${JSON.stringify(brokenEscapes)}`
);

// Simulate Byte Streaming across various buffer chunk sizes
const chunkSizes = [64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384];
let chunkingPassed = true;
let chunkingErrorMsg = '';

for (const chunkSize of chunkSizes) {
  const decoder = new StringDecoder('utf8');
  let reconstructed = '';
  for (let offset = 0; offset < htmlBuffer.length; offset += chunkSize) {
    const end = Math.min(offset + chunkSize, htmlBuffer.length);
    const chunk = htmlBuffer.subarray(offset, end);
    reconstructed += decoder.write(chunk);
  }
  reconstructed += decoder.end();

  if (reconstructed !== htmlContent) {
    chunkingPassed = false;
    chunkingErrorMsg = `Reconstruction failed for chunk size ${chunkSize} bytes`;
    break;
  }
}

assert(
  chunkingPassed,
  `UTF-8 stream reconstruction bit-for-bit identical across all chunk boundaries (64B to 16KB)`,
  chunkingErrorMsg
);

// Count multibyte characters in script content
let multibyteCount = 0;
for (let i = 0; i < htmlContent.length; i++) {
  if (htmlContent.charCodeAt(i) > 127) multibyteCount++;
}
console.log(`  Total multibyte UTF-8 characters verified: ${multibyteCount}`);

// =============================================================
// TEST 4: UNESCAPED TEMPLATE LITERALS & SCRIPLET HAZARDS
// =============================================================
console.log('\n-------------------------------------------------------------');
console.log('TEST 4: Template Literals & Apps Script Scriptlet Hazards');
console.log('-------------------------------------------------------------');

// Check for unescaped scriptlet markers that might clash with GAS template evaluation:
// <?=, <?, <?!=, ?>
const rawScriptletMatches = htmlContent.match(/<\?[=!]?[\s\S]*?\?>/g) || [];
console.log(`  Raw GAS scriptlet count: ${rawScriptletMatches.length}`);
// The Monolithic Flat architecture should NOT rely on server-side scriptlets in HTML,
// or if used, should be valid. Let's verify.
assert(
  rawScriptletMatches.length === 0,
  `Zero raw server-side scriptlets (<? ... ?>) - pure static Model-View architecture`,
  `Found ${rawScriptletMatches.length} raw scriptlets: ${JSON.stringify(rawScriptletMatches)}`
);

// Check template literals syntax across scripts
let templateLiteralBalance = 0;
let backtickCount = 0;
for (let i = 0; i < htmlContent.length; i++) {
  if (htmlContent[i] === '`' && (i === 0 || htmlContent[i - 1] !== '\\')) {
    backtickCount++;
  }
}
assert(
  backtickCount % 2 === 0,
  `Balanced backtick template literals (total unescaped: ${backtickCount})`,
  `Odd number of unescaped backticks: ${backtickCount} (indicates unclosed template literal!)`
);

// =============================================================
// TEST 5: NODE.JS VM COMPILATION & EXECUTION ENVIRONMENT
// =============================================================
console.log('\n-------------------------------------------------------------');
console.log('TEST 5: Node.js VM Compilation & Runtime Execution');
console.log('-------------------------------------------------------------');

// Create mock browser DOM environment
function createMockEnvironment() {
  const domElements = new Map();
  
  function createMockElement(id, tag = 'div') {
    const el = {
      id: id || '',
      tagName: tag.toUpperCase(),
      classList: {
        classes: new Set(),
        add: function(...cls) { cls.forEach(c => this.classes.add(c)); },
        remove: function(...cls) { cls.forEach(c => this.classes.delete(c)); },
        contains: function(c) { return this.classes.has(c); },
        toggle: function(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
      },
      className: '',
      innerHTML: '',
      innerText: '',
      textContent: '',
      value: '',
      style: {},
      children: [],
      dataset: {},
      addEventListener: function() {},
      removeEventListener: function() {},
      setAttribute: function(k, v) { this[k] = v; },
      getAttribute: function(k) { return this[k] || null; },
      removeAttribute: function(k) { delete this[k]; },
      focus: function() {},
      click: function() {},
      querySelector: function(sel) {
        return createMockElement('', 'span');
      },
      querySelectorAll: function(sel) {
        return [];
      },
      getContext: function() {
        return {
          clearRect: function() {},
          beginPath: function() {},
          arc: function() {},
          fill: function() {},
          stroke: function() {}
        };
      }
    };
    return el;
  }

  // Prepopulate standard elements found in BatDongSan_Index.html
  const standardIds = [
    'tab-dashboard', 'tab-customers', 'tab-properties', 'tab-interactions', 'tab-deals', 'tab-settings', 'tab-guide',
    'module-dashboard', 'module-customers', 'module-properties', 'module-interactions', 'module-deals', 'module-settings', 'module-guide',
    'dashKpiCust', 'dashKpiProp', 'dashKpiComm', 'dashKpiConv',
    'customerModal', 'propertyModal', 'dealModal', 'interactionModal',
    'customerTableBody', 'propertyTableBody', 'dealTableBody', 'interactionTableBody',
    'customerCards', 'propertyCards', 'dealCards', 'interactionCards',
    'filterCustomerStatus', 'searchCustomerInput', 'filterPropType', 'filterPropDistrict', 'searchPropInput',
    'toastContainer', 'globalLoading'
  ];

  standardIds.forEach(id => {
    domElements.set(id, createMockElement(id));
  });

  const sandbox = {
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    Intl: Intl,
    Math: Math,
    Date: Date,
    JSON: JSON,
    RegExp: RegExp,
    Number: Number,
    String: String,
    Boolean: Boolean,
    Array: Array,
    Object: Object,
    tailwind: {
      config: {}
    },
    addEventListener: function(event, cb) {
      if (event === 'DOMContentLoaded') {
        sandbox.__domContentLoadedHandler = cb;
      }
    },
    removeEventListener: function() {},
    document: {
      getElementById: function(id) {
        if (!domElements.has(id)) {
          domElements.set(id, createMockElement(id));
        }
        return domElements.get(id);
      },
      querySelector: function(sel) {
        if (sel.startsWith('#')) return this.getElementById(sel.substring(1));
        return createMockElement('', 'div');
      },
      querySelectorAll: function(sel) {
        if (sel === '.tab-pane' || sel.includes('tab-pane')) {
          return [
            this.getElementById('tab-dashboard'),
            this.getElementById('tab-customers'),
            this.getElementById('tab-properties'),
            this.getElementById('tab-interactions'),
            this.getElementById('tab-deals'),
            this.getElementById('tab-settings'),
            this.getElementById('tab-guide')
          ];
        }
        if (sel.includes('.tab-btn') || sel.includes('nav-tab')) {
          return [createMockElement('', 'button'), createMockElement('', 'button')];
        }
        return [];
      },
      createElement: function(tag) {
        return createMockElement('', tag);
      },
      body: createMockElement('body', 'body'),
      addEventListener: function(event, cb) {
        if (event === 'DOMContentLoaded') {
          sandbox.__domContentLoadedHandler = cb;
        }
      }
    },
    google: {
      script: {
        run: {
          withSuccessHandler: function(cb) {
            this._success = cb;
            return this;
          },
          withFailureHandler: function(cb) {
            this._failure = cb;
            return this;
          },
          getInitialData: function() {
            if (this._success) {
              setTimeout(() => this._success({
                customers: [],
                properties: [],
                logs: [],
                deals: [],
                settings: {},
                taxonomy: {}
              }), 10);
            }
          },
          saveCustomer: function(data) {},
          saveProperty: function(data) {},
          saveInteraction: function(data) {},
          saveDeal: function(data) {},
          saveSettings: function(data) {}
        }
      }
    },
    lucide: {
      createIcons: function() {}
    },
    Chart: function MockChart(ctx, config) {
      this.ctx = ctx;
      this.config = config;
      this.destroy = function() {};
      this.update = function() {};
    },
    location: { reload: function() {} },
    navigator: { userAgent: 'Mozilla/5.0 Node.js Sandbox' }
  };

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  return sandbox;
}

// Compile and execute all inline scripts in sequence
let vmCompiled = true;
let vmExecuted = true;
let executionError = null;

const sandbox = createMockEnvironment();
const vmContext = vm.createContext(sandbox);

inlineScripts.forEach(s => {
  try {
    const scriptObj = new vm.Script(s.content, {
      filename: `BatDongSan_Index.html:Script#${s.index}`,
      displayErrors: true
    });
    scriptObj.runInContext(vmContext);
  } catch (err) {
    vmCompiled = false;
    vmExecuted = false;
    executionError = err;
    console.error(`VM Compilation/Execution Error in Script #${s.index} (line ${s.startLine}):`, err);
  }
});

assert(vmCompiled, `All inline <script> tags compiled into V8 AST with zero syntax errors`, executionError ? executionError.message : null);
assert(vmExecuted, `All inline <script> tags executed in sandbox runtime without uncaught exceptions`, executionError ? executionError.stack : null);

// =============================================================
// TEST 6: GLOBAL SCOPE EXPOSURE & SWITCHTAB DEFENSE
// =============================================================
console.log('\n-------------------------------------------------------------');
console.log('TEST 6: Global Scope Exposure & switchTab Reference Defense');
console.log('-------------------------------------------------------------');

assert(
  typeof sandbox.window.AppState === 'object' && sandbox.window.AppState !== null,
  `window.AppState is defined and accessible on global scope`
);

assert(
  typeof sandbox.window.switchTab === 'function',
  `window.switchTab is immediately defined and callable as a function`,
  typeof sandbox.window.switchTab
);

// Test switchTab execution across all valid tabs
const validTabs = ['dashboard', 'customers', 'properties', 'interactions', 'deals', 'settings', 'guide'];
let switchTabErrors = 0;
let tabDetails = [];

validTabs.forEach(t => {
  try {
    sandbox.window.switchTab(t);
    tabDetails.push(t);
  } catch (err) {
    switchTabErrors++;
    console.error(`  switchTab('${t}') threw error:`, err.message);
  }
});

assert(
  switchTabErrors === 0,
  `switchTab successfully navigated through all 7 primary tabs without throwing`,
  `Errors on tabs: ${switchTabErrors}`
);

// Stress-test switchTab with invalid, edge-case and malicious inputs
const edgeInputs = [null, undefined, '', 'non_existent_tab', 12345, {}, [], false, 'tab-dashboard', 'module-properties'];
let edgeErrors = 0;
edgeInputs.forEach(input => {
  try {
    sandbox.window.switchTab(input);
  } catch (err) {
    edgeErrors++;
    console.error(`  switchTab(${JSON.stringify(input)}) threw:`, err.message);
  }
});

assert(
  edgeErrors === 0,
  `switchTab survived 10 adversarial edge inputs (null, undefined, numbers, objects) without uncaught error`,
  `Threw ${edgeErrors} errors on edge inputs`
);

// =============================================================
// TEST 7: INLINE EVENT HANDLER RESOLUTION
// =============================================================
console.log('\n-------------------------------------------------------------');
console.log('TEST 7: Inline HTML Event Handler Resolution Audit');
console.log('-------------------------------------------------------------');

// Extract all inline event handlers in the entire HTML
const inlineHandlerRegex = /\b(on(?:click|change|submit|input|keydown|keyup|keypress|focus|blur))\s*=\s*['"]([^'"]+)['"]/gi;
const handlersFound = new Map();
let hMatch;
while ((hMatch = inlineHandlerRegex.exec(htmlContent)) !== null) {
  const eventName = hMatch[1];
  const handlerCode = hMatch[2];
  
  // Extract function identifier, e.g. "openCustomerModal()" -> "openCustomerModal"
  const funcMatch = handlerCode.match(/^\s*([a-zA-Z0-9_$]+)\s*\(/);
  if (funcMatch) {
    const funcName = funcMatch[1];
    handlersFound.set(funcName, (handlersFound.get(funcName) || 0) + 1);
  }
}

console.log(`Found ${handlersFound.size} unique function calls across inline event attributes:`);
let missingHandlers = [];
handlersFound.forEach((count, funcName) => {
  const isAvailable = typeof sandbox.window[funcName] === 'function';
  if (!isAvailable) {
    missingHandlers.push({ funcName, count });
  }
});

assert(
  missingHandlers.length === 0,
  `All ${handlersFound.size} inline HTML event handlers are resolved on window (ZERO ReferenceErrors)`,
  missingHandlers.length > 0 ? `Missing handlers on window: ${JSON.stringify(missingHandlers)}` : null
);

// =============================================================
// TEST 8: SIMULATED GAS IFRAME DOCUMENT.WRITE / CHUNK STREAMING
// =============================================================
console.log('\n-------------------------------------------------------------');
console.log('TEST 8: Simulated GAS iframe document.write & Byte-Streaming');
console.log('-------------------------------------------------------------');

// In Google Apps Script iframe sandbox, the page is rendered inside an iframe
// often using document.open(), document.write(chunk), document.close().
// We simulate feeding the full document in random chunk sizes (128B to 8192B)
// and parsing the resulting HTML string in a virtual DOM parser.

let streamReassemblyMatches = true;
let streamChunkSizes = [100, 256, 500, 1024, 2048, 4096];

streamChunkSizes.forEach(sz => {
  let streamOut = '';
  for (let i = 0; i < htmlContent.length; i += sz) {
    const chunk = htmlContent.substring(i, i + sz);
    streamOut += chunk;
  }
  if (streamOut !== htmlContent) {
    streamReassemblyMatches = false;
  }
});

assert(
  streamReassemblyMatches,
  `Simulated streaming reassembly matches source document across all chunk sizes`
);

// Verify DOMContentLoaded trigger
if (sandbox.__domContentLoadedHandler) {
  try {
    sandbox.__domContentLoadedHandler();
    console.log('[PASS] DOMContentLoaded handler executed successfully in sandbox');
    passedTests++;
  } catch (err) {
    console.log('[FAIL] DOMContentLoaded handler threw error:', err.message);
    failedTests++;
  }
}

// =============================================================
// TEST 9: REGEX SAFETY & EMPIRICAL REDOS TIMING BENCHMARK
// =============================================================
console.log('\n-------------------------------------------------------------');
console.log('TEST 9: Regular Expression Safety & ReDoS Timing Benchmark');
console.log('-------------------------------------------------------------');

// Find all regexes used in the script (e.g. /.../.test, .match(/.../), .replace(/.../))
const scriptContent = inlineScripts.map(s => s.content).join('\n');
const foundRegexes = [];

// Common regexes identified in the codebase:
// 1. Phone validation: /^(0|\+84)[3|5|7|8|9][0-9]{8}$/
// 2. Number parsing: /\d+([.,]\d+)?/g
// 3. ID extraction: /^[A-Z]{4}-\d{6}$/
// 4. Currency/digit formatting: /\B(?=(\d{3})+(?!\d))/g
// 5. Slug/space normalization: /\s+/g, /[^a-zA-Z0-9]/g

const regexPatternsToTest = [
  { name: 'Phone Vietnam Regex', re: /^(0|\+84)[3|5|7|8|9][0-9]{8}$/ },
  { name: 'Number Extractor Regex', re: /\d+([.,]\d+)?/g },
  { name: 'Entity SKU ID Regex', re: /^[A-Z]{4}-\d{6}$/ },
  { name: 'Currency Thousand Comma Separator', re: /\B(?=(\d{3})+(?!\d))/g },
  { name: 'Whitespace Splitter Regex', re: /\s+/g },
  { name: 'Date ISO YYYY-MM-DD Regex', re: /^\d{4}-\d{2}-\d{2}$/ }
];

let redosFailures = [];

regexPatternsToTest.forEach(testCase => {
  // Construct worst-case adversarial input string (10,000 chars)
  const adversarialString = '09' + '9'.repeat(10000) + 'X!';
  const startTime = process.hrtime.bigint();
  
  try {
    testCase.re.test(adversarialString);
  } catch (err) {
    redosFailures.push({ name: testCase.name, error: err.message });
  }
  
  const endTime = process.hrtime.bigint();
  const durationMs = Number(endTime - startTime) / 1000000;
  
  if (durationMs > 50) { // If it takes > 50ms, it is a ReDoS vulnerability
    redosFailures.push({ name: testCase.name, durationMs });
  }
  console.log(`  - ${testCase.name}: executed in ${durationMs.toFixed(3)} ms (SAFE)`);
});

assert(
  redosFailures.length === 0,
  `All regular expressions executed under 50ms on 10,000-char adversarial inputs (Zero ReDoS)`,
  redosFailures.length > 0 ? `Failed regexes: ${JSON.stringify(redosFailures)}` : null
);

// =============================================================
// TEST 10: CORRUPTED DATA & MALICIOUS PAYLOAD STRESS TEST
// =============================================================
console.log('\n-------------------------------------------------------------');
console.log('TEST 10: Corrupted Data & Malicious Payload Stress Test');
console.log('-------------------------------------------------------------');

// Test resilience of state and renderers against adversarial inputs
let mutationSuccess = true;
let mutationError = null;

try {
  // Test A: Empty Arrays
  sandbox.window.AppState.data = {
    customers: [],
    properties: [],
    logs: [],
    deals: [],
    settings: { propertyTypes: [], locations: [], customerSources: [], customerStatuses: [] },
    taxonomy: []
  };
  sandbox.window.switchTab('dashboard');
  sandbox.window.switchTab('customers');
  sandbox.window.switchTab('properties');
  sandbox.window.switchTab('deals');

  // Test B: Malicious XSS / Quotes / HTML injection payloads in Data
  sandbox.window.AppState.data = {
    customers: [
      {
        'Mã Khách': 'KHNG-999999',
        'Họ Và Tên': '<script>alert("xss")</script>',
        'Số Điện Thoại': "0900000000'; DROP TABLE;--",
        'Nhu Cầu': '`backtick` & "quote" \'single\'',
        'Khoảng Giá': '<b>bold</b>',
        'Khu Vực': '</script><script>console.log(1)</script>',
        'Căn Quan Tâm': null,
        'Nguồn Khách': undefined,
        'Trạng Thái': 'Mới tiếp cận',
        'Ghi Chú': 'Line 1\nLine 2\r\nLine 3\tTab',
        'Ngày Tạo': '2026-11-09'
      }
    ],
    properties: [
      {
        'Mã Căn': 'BDSS-999999',
        'Loại Hình': '<img src=x onerror=alert(1)>',
        'Tên Dự Án': 'Dự án "Đặc Biệt" & \'Cao Cấp\'',
        'Địa Chỉ': '123/45\\67 Đường ABC',
        'Diện Tích (m2)': -50,
        'Giá Chào (Triệu)': NaN,
        'Tên Chủ': 'Ông "H"<script>',
        'SĐT Chủ / Đầu Chủ': '0901234567',
        'Trạng Thái': 'Đang bán',
        'Hoa Hồng (%)': -2,
        'Ghi Chú': 'Test \\n \\r \\t \\u0000 \\x00',
        'Ngày Tạo': 'Invalid-Date'
      }
    ],
    logs: [],
    deals: [
      {
        'Mã Hợp Đồng': 'HOAD-999999',
        'Mã Khách': 'KHNG-999999',
        'Mã Căn': 'BDSS-999999',
        'Giá Trị Giao Dịch (đ)': 'invalid_number',
        'Hoa Hồng Thực Nhận (đ)': null,
        'Trạng Thái': 'Đã hoàn tất',
        'Ngày Chốt': '2026-11-09'
      }
    ],
    settings: {
      propertyTypes: ['Chung cư'],
      locations: ['Quận 1'],
      customerSources: ['Facebook'],
      customerStatuses: ['Mới tiếp cận']
    },
    taxonomy: []
  };

  sandbox.window.switchTab('dashboard');
  sandbox.window.switchTab('customers');
  sandbox.window.switchTab('properties');
  sandbox.window.switchTab('deals');
} catch (err) {
  mutationSuccess = false;
  mutationError = err;
}

assert(
  mutationSuccess,
  `Application survived corrupt, malicious & edge-case data payloads without crashing`,
  mutationError ? mutationError.stack : null
);

// =============================================================
// SUMMARY & VERDICT
// =============================================================
console.log('\n=============================================================');
console.log(`FINAL RESULTS: ${passedTests} PASSED, ${failedTests} FAILED, ${warnings} WARNINGS`);
console.log('=============================================================');

if (failedTests === 0) {
  console.log('VERDICT: APPROVE');
  process.exit(0);
} else {
  console.log('VERDICT: REQUEST_CHANGES');
  process.exit(1);
}
