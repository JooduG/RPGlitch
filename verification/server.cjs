
const fs = require('fs');
const http = require('http');
const path = require('path');

const PORT = 8080;
const ROOT = path.join(process.cwd(), 'apps/rpglitch');

const server = http.createServer((req, res) => {
  const unsafeUrl = req.url === '/' ? 'RPGlitch.html' : req.url;

  // Prevent path traversal attacks.
  // We explicitly decode the URL to handle spaces/special chars, although basic req.url usually is encoded.
  // Actually, req.url is raw. let's just join.
  const resolvedPath = path.normalize(path.join(ROOT, unsafeUrl));

  if (!resolvedPath.startsWith(ROOT)) {
    console.log(`Forbidden access attempt: ${req.url}`);
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Basic MIME types
  const ext = path.extname(resolvedPath);
  let contentType = 'text/html';
  if (ext === '.js') contentType = 'application/javascript';
  else if (ext === '.css') contentType = 'text/css';
  else if (ext === '.json') contentType = 'application/json';

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
