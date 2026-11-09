// Simulating the bug in node
let btn = {
  textContent: 'Sao chép'
};

function copyVoucherCode(btnOrCode, maybeCode) {
  const code = typeof maybeCode === 'string' ? maybeCode : (typeof btnOrCode === 'string' ? btnOrCode : 'NOURISH');
  const b = typeof btnOrCode === 'object' && btnOrCode ? btnOrCode : btn;
  function showSuccess() {
    if (b) {
      const origText = b.textContent;
      b.textContent = 'Đã sao chép!';
      setTimeout(function() { b.textContent = origText; }, 2000);
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

// Check at t=2100ms (after first timeout)
setTimeout(() => {
  console.log('At 2100ms (after timer 1):', btn.textContent);
}, 2100);

// Check at t=3100ms (after second timeout)
setTimeout(() => {
  console.log('At 3100ms (after timer 2):', btn.textContent);
  if (btn.textContent === 'Đã sao chép!') {
    console.log('BUG CONFIRMED: Button text is permanently corrupted!');
  } else {
    console.log('Button text correctly reverted.');
  }
}, 3100);
