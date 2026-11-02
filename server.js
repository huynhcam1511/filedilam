const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';

  // Provide exact Firebase config matching production
  if (reqPath === '/__/firebase/init.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
    res.end(`
      if (typeof firebase === 'undefined') throw new Error('hosting/init-error: Firebase SDK not detected.');
      if (!firebase.apps.length) {
        firebase.initializeApp({
          "apiKey": "AIzaSyDBO9kY1C9SXuTLkbIxpVDwu8ynJtt4eQY",
          "authDomain": "filedilam.firebaseapp.com",
          "databaseURL": "https://filedilam-default-rtdb.asia-southeast1.firebasedatabase.app",
          "messagingSenderId": "808461994761",
          "projectId": "filedilam",
          "storageBucket": "filedilam.firebasestorage.app"
        });
      }
    `);
    return;
  }

  // Redirect SDK requests to Google CDN
  if (reqPath.startsWith('/__/firebase/')) {
    const fileName = path.basename(reqPath);
    res.writeHead(302, { 'Location': 'https://www.gstatic.com/firebasejs/10.7.1/' + fileName });
    res.end();
    return;
  }

  const filePath = path.join(__dirname, reqPath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found: ' + reqPath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(data);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
