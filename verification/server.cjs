
const fs = require('fs');
const http = require('http');
const path = require('path');

const PORT = 8080;
const ROOT = path.join(process.cwd(), 'apps/rpglitch');

const server = http.createServer((req, res) => {
  const filePath = path.join(ROOT, req.url === '/' ? 'RPGlitch.html' : req.url);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
