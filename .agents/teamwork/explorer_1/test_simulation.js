const fs = require('fs');

const html = fs.readFileSync('STANDARDS_TEMPLATE/CONGNO_Index.html', 'utf8');

const elements = {};
function getEl(id) {
  if (!elements[id]) {
    elements[id] = {
      id,
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false
      },
      textContent: '',
      innerText: '',
      innerHTML: '',
      style: {},
      setAttribute: () => {},
      getAttribute: () => '',
      appendChild: () => {},
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: () => {}
    };
  }
  return elements[id];
}

const mockDoc = {
  getElementById: getEl,
  querySelectorAll: () => [],
  querySelector: () => null,
  createElement: (tag) => getEl('mock-' + tag),
  addEventListener: () => {}
};

const mockWindow = {
  document: mockDoc,
  lucide: { createIcons: () => {} },
  Chart: function(ctx, config) {
    return { destroy: () => {} };
  },
  Intl: Intl
};

const scriptMatches = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi)];
const mainScript = scriptMatches[1][1];

console.log('Main script length:', mainScript.length);

try {
  const runFn = new Function('window', 'document', 'lucide', 'Chart', 'Intl', mainScript);
  runFn(mockWindow, mockDoc, mockWindow.lucide, mockWindow.Chart, Intl);
  console.log('Script parsed and evaluated.');

  console.log('window.AppState:', typeof mockWindow.AppState);
  console.log('window.ModuleDashboard:', typeof mockWindow.ModuleDashboard);
  console.log('window.ModuleTransactions:', typeof mockWindow.ModuleTransactions);
  console.log('window.ModuleInvoices:', typeof mockWindow.ModuleInvoices);
  console.log('window.ModulePartners:', typeof mockWindow.ModulePartners);
  console.log('window.ModuleCategories:', typeof mockWindow.ModuleCategories);
  console.log('window.ModuleSettings:', typeof mockWindow.ModuleSettings);
  console.log('window.ModuleHelp:', typeof mockWindow.ModuleHelp);
  console.log('window.switchTab:', typeof mockWindow.switchTab);

} catch (e) {
  console.error('Execution error:', e);
}
