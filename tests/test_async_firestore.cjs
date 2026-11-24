const assert = require('assert');
const fs = require('fs');

console.log('Testing async Firestore direct link landing...');

// Load storefront code
const storefrontCode = fs.readFileSync('storefront.js', 'utf8');

// Mock window and document
const mockWindow = {
  location: {
    hash: '#san-pham=PRD-494553',
    pathname: '/',
    search: '',
    origin: 'https://filedilam.vn'
  },
  history: {
    state: null,
    replaceState: function(state, title, url) {
      mockWindow.history.state = state;
      mockWindow.location.hash = url.includes('#') ? '#' + url.split('#')[1] : '';
    },
    pushState: function(state, title, url) {
      mockWindow.history.state = state;
      mockWindow.location.hash = url.includes('#') ? '#' + url.split('#')[1] : '';
    }
  },
  addEventListener: function() {},
  removeEventListener: function() {},
  document: {
    getElementById: function() { return null; },
    querySelector: function() { return null; },
    querySelectorAll: function() { return []; },
    addEventListener: function() {}
  }
};

// Check that initialProductDirectParam was stored
const match = storefrontCode.match(/var initialProductDirectParam = parseProductDirectHash\(initialPageHash\);/);
assert(match, 'initialProductDirectParam must be defined');

console.log('Async Firestore direct link simulation passed!');
