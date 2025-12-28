
const fs = require('fs');
const http = require('http');
const path = require('path');

const PORT = 8080;
const ROOT = path.join(process.cwd(), 'apps/rpglitch');

const server = http.createServer((req, res) => {
  const filePath = path.join(ROOT, req.url === '/' ? 'RPGlitch.html' : req.url);
  // Basic MIME types
  const ext = path.extname(filePath);
  let contentType = 'text/html';
  if (ext === '.js') contentType = 'application/javascript';
  else if (ext === '.css') contentType = 'text/css';
  else if (ext === '.json') contentType = 'application/json';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.log(`404: ${req.url}`);
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
