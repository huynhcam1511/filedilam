const fs = require('fs');

const html = fs.readFileSync('STANDARDS_TEMPLATE/TAISAN_Index.html', 'utf8');

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

console.log('TAISAN script length:', mainScript.length);

try {
  const runFn = new Function('window', 'document', 'lucide', 'Chart', 'Intl', mainScript);
  runFn(mockWindow, mockDoc, mockWindow.lucide, mockWindow.Chart, Intl);
  console.log('TAISAN Script evaluated successfully.');

} catch (e) {
  console.error('TAISAN execution error:', e);
}
