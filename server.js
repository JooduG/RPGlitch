import http from 'http';
import fs from 'fs';
import path from 'path';

const port = 8080;
const projectRoot = process.cwd();

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
};

http.createServer((request, response) => {
    let filePath = path.join(projectRoot, request.url);
    if (request.url === '/') {
        filePath = path.join(projectRoot, 'apps/rpglitch/html/index.html');
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                response.writeHead(404);
                response.end('File not found');
            } else {
                response.writeHead(500);
                response.end('Internal server error: ' + error.code);
            }
        } else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });
}).listen(port);

console.log(`Server running at http://localhost:${port}`);
