const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Tăng cache version cho storefront.css và storefront.js
html = html.replace(/href="\.\/storefront\.css\?v=\d+"/, 'href="./storefront.css?v=286"');
html = html.replace(/src="storefront\.js\?v=\d+"/, 'src="storefront.js?v=286"');

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully updated cache buster version in index.html to v=286');
