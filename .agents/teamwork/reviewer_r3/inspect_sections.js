const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../../nourishgroup.html');
const html = fs.readFileSync(targetPath, 'utf8');

// 1. Inspect FAQ markup and CSS
console.log('=== FAQ INSPECTION ===');
const faqIdx = html.indexOf('id="faq"');
console.log('FAQ HTML snippet:');
console.log(html.slice(faqIdx, faqIdx + 1500));

// 2. Inspect Stats strip markup and CSS
console.log('\n=== STATS INSPECTION ===');
const statIdx = html.indexOf('stat-grid');
if (statIdx !== -1) {
  console.log(html.slice(statIdx - 100, statIdx + 1000));
} else {
  console.log('No stat-grid found! Searching for stat:');
  const statMatch = [...html.matchAll(/class="[^"]*stat[^"]*"/gi)];
  console.log('Stat matches:', statMatch.map(m => m[0]));
}

// 3. Inspect Custom Banner
console.log('\n=== CUSTOM BANNER INSPECTION ===');
const bannerIdx = html.indexOf('custom-banner');
console.log(html.slice(bannerIdx - 50, bannerIdx + 600));

// 4. Inspect Voucher Ticket
console.log('\n=== VOUCHER TICKET INSPECTION ===');
const voucherIdx = html.indexOf('coupon-ticket');
console.log(html.slice(voucherIdx - 50, voucherIdx + 800));

// 5. Inspect Social Strip
console.log('\n=== SOCIAL STRIP INSPECTION ===');
const socialIdx = html.indexOf('social-strip');
console.log(html.slice(socialIdx - 50, socialIdx + 800));

// 6. Inspect Animations CSS & Markup
console.log('\n=== ANIMATION SECTION INSPECTION ===');
const animIdx = html.indexOf('how-it-works');
console.log(html.slice(animIdx, animIdx + 2000));
