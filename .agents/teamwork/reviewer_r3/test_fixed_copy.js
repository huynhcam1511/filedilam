// Testing the updated copy function logic
let btn = {
  textContent: 'Sao chép',
  dataset: {}
};

function copyVoucherCode(btnOrCode, maybeCode) {
  const code = typeof maybeCode === 'string' ? maybeCode : (typeof btnOrCode === 'string' ? btnOrCode : 'NOURISH');
  const b = typeof btnOrCode === 'object' && btnOrCode ? btnOrCode : btn;
  function showSuccess() {
    if (b) {
      if (!b.dataset.origText) {
        b.dataset.origText = b.textContent;
      }
      if (b._copyTimer) {
        clearTimeout(b._copyTimer);
      }
      b.textContent = 'Đã sao chép!';
      b._copyTimer = setTimeout(function() {
        b.textContent = b.dataset.origText || 'Sao chép';
        delete b.dataset.origText;
        b._copyTimer = null;
      }, 2000);
    }
  }
  showSuccess();
}

console.log('Initial text:', btn.textContent);
// Click 1 at t=0
copyVoucherCode(btn, 'NOURISH');
console.log('Immediately after click 1:', btn.textContent);

// Click 2 at t=500ms
setTimeout(() => {
  console.log('Click 2 at 500ms...');
  copyVoucherCode(btn, 'NOURISH');
  console.log('After click 2:', btn.textContent);
}, 500);

// Check at t=2100ms (first timeout would have fired)
setTimeout(() => {
  console.log('At 2100ms:', btn.textContent);
}, 2100);

// Check at t=2600ms (second timeout fires at 500 + 2000 = 2500ms)
setTimeout(() => {
  console.log('At 2600ms (after final timer):', btn.textContent);
  if (btn.textContent === 'Sao chép') {
    console.log('SUCCESS: Button text reverted cleanly to "Sao chép"!');
  } else {
    console.error('FAIL: Button text not reverted:', btn.textContent);
    process.exit(1);
  }
}, 2600);
