/**
 * Test Suite for storefront.js combo items resolution and payload construction
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const storefrontCode = fs.readFileSync(path.join(__dirname, '..', 'storefront.js'), 'utf-8');

// Mock DOM & browser globals
const mockStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; }
};

const mockWindow = {
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { hash: '' },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  StorefrontData: {
    categories: [],
    products: [
      {
        id: 'quan-ly-kho-appscript',
        name: 'Quản Lý Kho Mini Web App',
        sheetUrl: 'https://docs.google.com/spreadsheets/d/kho123/edit',
        type: 'apps_script',
        price: 149000
      },
      {
        id: 'quan-ly-ban-hang-sheets',
        name: 'Quản Lý Bán Hàng Google Sheets',
        sheetUrl: 'https://docs.google.com/spreadsheets/d/banhang456/edit',
        type: 'google_sheets',
        price: 99000
      },
      {
        id: 'fnb-costing-appscript',
        name: 'Bảng Tính Giá Vốn F&B Costing Web App',
        sheetUrl: 'https://docs.google.com/spreadsheets/d/costing789/edit',
        type: 'apps_script',
        price: 199000
      },
      {
        id: 'combo-2-in-1',
        name: 'Combo Quản Lý Toàn Diện (Kho + Bán Hàng)',
        type: 'combo',
        is_combo: true,
        combo_items: ['quan-ly-kho-appscript', 'quan-ly-ban-hang-sheets'],
        price: 199000
      },
      {
        id: 'combo-split-name',
        name: 'Combo Quản Lý Kho Mini Web App + Bảng Tính Giá Vốn F&B Costing Web App',
        type: 'combo',
        is_combo: true,
        combo_items: [],
        child_links: [
          'https://docs.google.com/spreadsheets/d/kho123/edit',
          'https://docs.google.com/spreadsheets/d/costing789/edit'
        ],
        price: 249000
      }
    ]
  },
  localStorage: mockStorage,
  sessionStorage: mockStorage
};

const makeDummyElement = () => ({
  style: {},
  classList: { add: () => {}, remove: () => {}, contains: () => false },
  appendChild: () => {},
  addEventListener: () => {},
  setAttribute: () => {},
  getAttribute: () => null,
  innerHTML: '',
  textContent: '',
  children: [],
  cloneNode: () => makeDummyElement(),
  querySelectorAll: () => [],
  querySelector: () => null
});

const context = vm.createContext({
  window: mockWindow,
  document: {
    getElementById: () => makeDummyElement(),
    querySelectorAll: () => [],
    querySelector: () => makeDummyElement(),
    addEventListener: () => {},
    createElement: () => makeDummyElement(),
    body: { appendChild: () => {}, querySelector: () => makeDummyElement() }
  },
  navigator: { userAgent: 'test' },
  console: console,
  location: mockWindow.location,
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
  URLSearchParams: class {
    constructor() {}
    get() { return null; }
  },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  localStorage: mockStorage,
  sessionStorage: mockStorage
});

// Run storefront.js in sandbox
vm.runInContext(storefrontCode, context);

console.log('Testing resolveComboItems in storefront.js...');

// Extract helper functions from window
const helpers = {
  resolveComboItems: mockWindow.resolveComboItems,
  isComboProduct: mockWindow.isComboProduct,
  getProductById: (id) => mockWindow.StorefrontData.products.find(p => p.id === id)
};
assert.strictEqual(typeof helpers.resolveComboItems, 'function', 'resolveComboItems must be a function');
assert.strictEqual(typeof helpers.isComboProduct, 'function', 'isComboProduct must be a function');

// Test Case 1: Combo with ID array
const combo1 = helpers.getProductById('combo-2-in-1');
assert.strictEqual(helpers.isComboProduct(combo1), true, 'combo1 should be identified as combo');

const resolvedItems1 = helpers.resolveComboItems(combo1);
assert.strictEqual(resolvedItems1.length, 2, 'combo1 must resolve to 2 child items');

// Item 1: Apps Script
assert.strictEqual(resolvedItems1[0].product_name, 'Quản Lý Kho Mini Web App');
assert.strictEqual(resolvedItems1[0].product_type, 'apps_script');
assert.strictEqual(resolvedItems1[0].product_file_url, 'https://docs.google.com/spreadsheets/d/kho123/copy');

// Item 2: Google Sheets
assert.strictEqual(resolvedItems1[1].product_name, 'Quản Lý Bán Hàng Google Sheets');
assert.strictEqual(resolvedItems1[1].product_type, 'google_sheets');
assert.strictEqual(resolvedItems1[1].product_file_url, 'https://docs.google.com/spreadsheets/d/banhang456/copy');

console.log('PASS: Test Case 1 - Combo with child IDs array resolved correctly');

// Test Case 2: Combo with split names
const combo2 = helpers.getProductById('combo-split-name');
assert.strictEqual(helpers.isComboProduct(combo2), true, 'combo2 should be identified as combo');

const resolvedItems2 = helpers.resolveComboItems(combo2);
assert.strictEqual(resolvedItems2.length, 2, 'combo2 must resolve to 2 child items');
assert.strictEqual(resolvedItems2[0].product_name, 'Quản Lý Kho Mini Web App');
assert.strictEqual(resolvedItems2[0].product_type, 'apps_script');
assert.strictEqual(resolvedItems2[1].product_name, 'Bảng Tính Giá Vốn F&B Costing Web App');
assert.strictEqual(resolvedItems2[1].product_type, 'apps_script');

console.log('PASS: Test Case 2 - Combo with split names resolved correctly');

// Test Case 3: Combo with inline object configurations
const customCombo = {
  name: 'Combo Tùy Chọn',
  type: 'combo',
  is_combo: true,
  combo_items: [
    {
      product_name: 'File Custom Sheets',
      product_file_url: 'https://docs.google.com/spreadsheets/d/cust123/edit',
      product_type: 'google_sheets'
    },
    {
      product_name: 'File Custom Web App',
      product_file_url: 'https://docs.google.com/spreadsheets/d/cust456/edit',
      product_type: 'apps_script'
    }
  ]
};

const resolvedItems3 = helpers.resolveComboItems(customCombo);
assert.strictEqual(resolvedItems3.length, 2);
assert.strictEqual(resolvedItems3[0].product_type, 'google_sheets');
assert.strictEqual(resolvedItems3[0].product_file_url, 'https://docs.google.com/spreadsheets/d/cust123/copy');
assert.strictEqual(resolvedItems3[1].product_type, 'apps_script');
assert.strictEqual(resolvedItems3[1].product_file_url, 'https://docs.google.com/spreadsheets/d/cust456/copy');

console.log('PASS: Test Case 3 - Combo with inline objects resolved correctly');

// Test Case 4: Non-combo product
const singleProd = helpers.getProductById('quan-ly-kho-appscript');
assert.strictEqual(helpers.isComboProduct(singleProd), false);
const resolvedSingle = helpers.resolveComboItems(singleProd);
assert.strictEqual(resolvedSingle.length, 0);

console.log('PASS: Test Case 4 - Single product returns empty array');

// Test Case 5: Mixed cart simulation (Single + Combo)
const testCart = [
  { productId: 'quan-ly-ban-hang-sheets', quantity: 1 },
  { productId: 'combo-2-in-1', quantity: 1 }
];
const allDeliv = [];
testCart.forEach(entry => {
  const p = helpers.getProductById(entry.productId);
  if (!p) return;
  if (helpers.isComboProduct(p)) {
    const children = helpers.resolveComboItems(p);
    allDeliv.push(...children);
  } else {
    allDeliv.push({
      product_id: p.id,
      product_name: p.name,
      product_file_url: p.sheetUrl,
      product_type: p.type
    });
  }
});
assert.strictEqual(allDeliv.length, 3, 'Mixed cart must contain 1 single + 2 combo children = 3 files');
assert.strictEqual(allDeliv[0].product_name, 'Quản Lý Bán Hàng Google Sheets');
assert.strictEqual(allDeliv[1].product_name, 'Quản Lý Kho Mini Web App');
assert.strictEqual(allDeliv[2].product_name, 'Quản Lý Bán Hàng Google Sheets');
console.log('PASS: Test Case 5 - Mixed cart (1 single + 1 combo) resolved all 3 files without loss');

// Test Case 6: Single product with '&' in title must NOT be a combo
const ampProduct1 = {
  id: 'tai-san-thiet-bi',
  name: 'Quản Lý Tài Sản & Thiết Bị Doanh Nghiệp',
  sheetUrl: 'https://docs.google.com/spreadsheets/d/taisan123/edit',
  type: 'google_sheets'
};
assert.strictEqual(helpers.isComboProduct(ampProduct1), false, 'Product with & must not be recognized as combo');
assert.strictEqual(helpers.resolveComboItems(ampProduct1).length, 0, 'resolveComboItems must return empty array for single product with &');

const ampProduct2 = {
  id: 'fnb-costing',
  name: 'Sổ Bán Hàng & Quản Lý Quán F&B Google Sheets',
  sheetUrl: 'https://docs.google.com/spreadsheets/d/fnb123/edit',
  type: 'google_sheets'
};
assert.strictEqual(helpers.isComboProduct(ampProduct2), false);
assert.strictEqual(helpers.resolveComboItems(ampProduct2).length, 0);

console.log('PASS: Test Case 6 - Single products with & in title are not falsely detected as combos');

// Test Case 7: Explicit combo starting with 'Combo ' and containing '&' resolves correctly
const explicitComboAmp = {
  id: 'combo-kho-banhang',
  name: 'Combo Quản Lý Kho Mini Web App & Quản Lý Bán Hàng Google Sheets',
  is_combo: true,
  type: 'combo',
  child_links: [
    'https://docs.google.com/spreadsheets/d/kho123/edit',
    'https://docs.google.com/spreadsheets/d/banhang456/edit'
  ]
};
assert.strictEqual(helpers.isComboProduct(explicitComboAmp), true);
const resolvedAmp = helpers.resolveComboItems(explicitComboAmp);
assert.strictEqual(resolvedAmp.length, 2);
assert.strictEqual(resolvedAmp[0].product_name, 'Quản Lý Kho Mini Web App');
assert.strictEqual(resolvedAmp[0].product_type, 'apps_script');
assert.strictEqual(resolvedAmp[1].product_name, 'Quản Lý Bán Hàng Google Sheets');
assert.strictEqual(resolvedAmp[1].product_type, 'google_sheets');

console.log('PASS: Test Case 7 - Explicit combo with & resolved into 2 child items');

// Test Case 8: isAppsScriptType and inline product_type: 'web_app' inside combo_items
assert.strictEqual(typeof mockWindow.isAppsScriptType, 'function', 'isAppsScriptType must be exported on window');
assert.strictEqual(mockWindow.isAppsScriptType('web_app', 'File Đơn Giản'), true);
assert.strictEqual(mockWindow.isAppsScriptType('web app', 'File Đơn Giản'), true);
assert.strictEqual(mockWindow.isAppsScriptType('apps script', 'File Đơn Giản'), true);
assert.strictEqual(mockWindow.isAppsScriptType('Google Apps Script', 'File Đơn Giản'), true);
assert.strictEqual(mockWindow.isAppsScriptType('google_sheets', 'File Đơn Giản'), false);

const inlineWebAppCombo = {
  name: 'Combo Chứa WebApp Format Khác Nhau',
  type: 'combo',
  is_combo: true,
  combo_items: [
    {
      product_name: 'Bản Quyền Ứng Dụng A',
      product_file_url: 'https://docs.google.com/spreadsheets/u/1/d/webapp123/edit',
      product_type: 'web_app'
    },
    {
      product_name: 'Bản Quyền Ứng Dụng B',
      product_file_url: 'https://docs.google.com/spreadsheets/u/0/d/webapp456/edit',
      product_type: 'apps script'
    }
  ]
};
const resolvedWebAppCombo = helpers.resolveComboItems(inlineWebAppCombo);
assert.strictEqual(resolvedWebAppCombo.length, 2);
assert.strictEqual(resolvedWebAppCombo[0].product_type, 'apps_script');
assert.strictEqual(resolvedWebAppCombo[0].product_file_url, 'https://docs.google.com/spreadsheets/d/webapp123/copy');
assert.strictEqual(resolvedWebAppCombo[1].product_type, 'apps_script');
assert.strictEqual(resolvedWebAppCombo[1].product_file_url, 'https://docs.google.com/spreadsheets/d/webapp456/copy');

console.log('PASS: Test Case 8 - Inline web_app and apps script variations resolved to apps_script');

// Test Case 9: Multi-account spreadsheet URL /u/0/ and /u/1/ normalized to /copy
const multiAccountSheetCombo = {
  name: 'Combo Multi Account Sheets',
  type: 'combo',
  is_combo: true,
  combo_items: [
    {
      product_name: 'Sheet Multi 0',
      product_file_url: 'https://docs.google.com/spreadsheets/u/0/d/sheetMulti000/edit#gid=0',
      product_type: 'google_sheets'
    },
    {
      product_name: 'Sheet Multi 1',
      product_file_url: 'https://docs.google.com/spreadsheets/u/1/d/sheetMulti111/edit',
      product_type: 'google_sheets'
    }
  ]
};
const resolvedMultiSheets = helpers.resolveComboItems(multiAccountSheetCombo);
assert.strictEqual(resolvedMultiSheets[0].product_file_url, 'https://docs.google.com/spreadsheets/d/sheetMulti000/copy');
assert.strictEqual(resolvedMultiSheets[1].product_file_url, 'https://docs.google.com/spreadsheets/d/sheetMulti111/copy');

console.log('PASS: Test Case 9 - Multi-account spreadsheet URLs (/u/0/, /u/1/) normalized to /copy');

// Test Case 10: Google Drive multi-account and open?id= normalized to /copy
const driveCombo = {
  name: 'Combo Drive Files',
  type: 'combo',
  is_combo: true,
  combo_items: [
    {
      product_name: 'Drive File Multi 1',
      product_file_url: 'https://drive.google.com/u/1/file/d/driveFile111/view?usp=sharing',
      product_type: 'google_sheets'
    },
    {
      product_name: 'Drive Open Id File',
      product_file_url: 'https://drive.google.com/open?id=driveOpen222',
      product_type: 'google_sheets'
    }
  ]
};
const resolvedDrive = helpers.resolveComboItems(driveCombo);
assert.strictEqual(resolvedDrive[0].product_file_url, 'https://drive.google.com/file/d/driveFile111/copy');
assert.strictEqual(resolvedDrive[1].product_file_url, 'https://drive.google.com/file/d/driveOpen222/copy');

console.log('PASS: Test Case 10 - Google Drive multi-account and open?id= normalized to /copy');

console.log('\nALL STOREFRONT COMBO TESTS PASSED!');
process.exit(0);
