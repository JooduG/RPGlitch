
const fs = require('fs');
const http = require('http');
const path = require('path');

const PORT = 8080;
// Use __dirname for robust path resolution relative to this script
const ROOT = path.resolve(__dirname, '..', 'apps/rpglitch');

const server = http.createServer((req, res) => {
  const unsafeUrl = req.url === '/' ? 'RPGlitch.html' : req.url;

  // Prevent path traversal attacks.
  const resolvedPath = path.normalize(path.join(ROOT, unsafeUrl));

  if (!resolvedPath.startsWith(ROOT)) {
    console.log(`Forbidden access attempt: ${req.url}`);
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Basic MIME types
  const ext = path.extname(resolvedPath);
  const mimeTypes = {
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
  };
  const contentType = mimeTypes[ext] || 'text/html';

  fs.readFile(resolvedPath, (err, data) => {
    if (err) {
      console.log(`404: ${req.url}`);
      res.writeHead(404);
      // Fixed: Do not leak error details
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
