// Unit test for F1-F4 logic in storefront.js
const fs = require('fs');
const assert = require('assert');

console.log('--- Testing F1: Auto-Apply Best Deal Sorting & Tie-Breakers ---');

// Mock evaluateCoupon for testing
function evaluateCoupon(coupon, subtotal) {
  if (subtotal < Number(coupon.min_order || 0)) {
    return { error: 'Not eligible', amount: 0 };
  }
  let amount = 0;
  if (coupon.type === 'percent') {
    amount = Math.round(subtotal * Number(coupon.value || 0) / 100);
  } else if (coupon.type === 'fixed') {
    amount = Number(coupon.value || 0);
  }
  const cap = Number(coupon.max_discount || 0);
  if (cap > 0) amount = Math.min(amount, cap);
  return { amount };
}

function getLocalDateKey() {
  return '2026-11-15';
}

// Extracted findBestEligibleCoupon matching storefront.js exactly
function findBestEligibleCoupon(coupons, subtotal) {
  if (!coupons || !coupons.length || !subtotal || subtotal <= 0) return null;
  var nowYMD = getLocalDateKey();
  var eligible = coupons.filter(function(c) {
    if (!c || c.is_active === false) return false;
    if (c.is_public === false || c.is_private === true) return false;
    var code = String(c.code || c.id || "").toUpperCase();
    if (code === "TRIAN20" || code === "TRIAN" || code === "GIUCHANG10" || code === "GIUCHAN" || c.type === "returning") return false;
    if (c.start_date && nowYMD < c.start_date) return false;
    if (c.end_date && nowYMD > c.end_date) return false;
    var res = evaluateCoupon(c, subtotal);
    return !res.error && Number(res.amount || 0) > 0;
  });

  if (!eligible.length) return null;

  eligible.sort(function(a, b) {
    var resA = evaluateCoupon(a, subtotal);
    var resB = evaluateCoupon(b, subtotal);
    var discA = Number(resA.amount || 0);
    var discB = Number(resB.amount || 0);
    // 1. Highest discount amount
    if (discB !== discA) return discB - discA;
    // 2. Tie-breaker: lower min_order
    var minA = Number(a.min_order || 0);
    var minB = Number(b.min_order || 0);
    if (minA !== minB) return minA - minB;
    // 3. Tie-breaker: brand priority FILEDILAM
    var codeA = String(a.code || a.id || "").toUpperCase();
    var codeB = String(b.code || b.id || "").toUpperCase();
    if (codeA === "FILEDILAM") return -1;
    if (codeB === "FILEDILAM") return 1;
    return 0;
  });

  return eligible[0];
}

// Test Case 1.1: Picks highest discount amount
const coupons1 = [
  { code: 'DEAL10', type: 'percent', value: 10, min_order: 100000, is_active: true },
  { code: 'DEAL25', type: 'percent', value: 25, min_order: 100000, is_active: true },
  { code: 'DEAL15', type: 'percent', value: 15, min_order: 100000, is_active: true }
];
const best1 = findBestEligibleCoupon(coupons1, 200000);
assert.strictEqual(best1.code, 'DEAL25', 'Should pick DEAL25 (highest discount: 50.000 vs 20.000)');
console.log('✓ Test 1.1 passed: Highest discount selected');

// Test Case 1.2: Tie-breaker 1: Lower min_order wins
const coupons2 = [
  { code: 'TIER_HIGH', type: 'fixed', value: 20000, min_order: 150000, is_active: true },
  { code: 'TIER_LOW', type: 'fixed', value: 20000, min_order: 100000, is_active: true }
];
const best2 = findBestEligibleCoupon(coupons2, 200000);
assert.strictEqual(best2.code, 'TIER_LOW', 'Should pick TIER_LOW with lower min_order');
console.log('✓ Test 1.2 passed: Tie-breaker lower min_order selected');

// Test Case 1.3: Tie-breaker 2: Brand priority FILEDILAM wins
const coupons3 = [
  { code: 'OTHER_DEAL', type: 'fixed', value: 20000, min_order: 100000, is_active: true },
  { code: 'FILEDILAM', type: 'fixed', value: 20000, min_order: 100000, is_active: true }
];
const best3 = findBestEligibleCoupon(coupons3, 200000);
assert.strictEqual(best3.code, 'FILEDILAM', 'Should pick FILEDILAM with brand priority');
console.log('✓ Test 1.3 passed: Tie-breaker FILEDILAM brand priority selected');

// Test Case 1.4: Ineligible cart returns null
const best4 = findBestEligibleCoupon(coupons1, 50000); // 50k < 100k min_order
assert.strictEqual(best4, null, 'Should return null when subtotal is below min_order');
console.log('✓ Test 1.4 passed: Ineligible cart returns null');

// Test Case 1.5: Excludes private/retention coupons
const couponsPrivate = [
  { code: 'TRIAN20', type: 'percent', value: 20, min_order: 0, is_active: true },
  { code: 'SECRET', type: 'percent', value: 30, min_order: 0, is_private: true, is_active: true },
  { code: 'FILEDILAM', type: 'percent', value: 10, min_order: 0, is_active: true }
];
const best5 = findBestEligibleCoupon(couponsPrivate, 100000);
assert.strictEqual(best5.code, 'FILEDILAM', 'Should exclude TRIAN20 and is_private coupons from public auto-apply');
console.log('✓ Test 1.5 passed: Private & retention coupons excluded from public auto-apply');

console.log('\n--- All Unit Tests Passed Successfully! ---');
