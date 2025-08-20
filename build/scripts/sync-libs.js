#!/usr/bin/env node
/* Fetch/refresh local libs into build/local_libs to satisfy Perchance constraints. */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..', '..');
const LOCAL_LIBS_DIR = path.join(ROOT, 'build', 'local_libs');

const SOURCES = [
// Versions pinned intentionally (stable, widely used)
{ url: 'https://unpkg.com/@picocss/pico@2.0.6/css/pico.min.css', file: 'pico.min.css' },
{ url: 'https://unpkg.com/cash-dom@8.1.5/dist/cash.min.js', file: 'cash.min.js' },
{ url: 'https://unpkg.com/dexie@3.2.4/dist/dexie.js', file: 'dexie.js' },
{ url: 'https://unpkg.com/dompurify@3.1.6/dist/purify.min.js', file: 'purify.min.js' },
{ url: 'https://unpkg.com/hyperscript.org@0.9.12/dist/_hyperscript.min.js', file: '_hyperscript.min.js' },
];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
      const tmp = `${dest}.tmp`;
      const file = fs.createWriteStream(tmp);
      https.get(url, (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} for ${url}`));
              res.resume();
              return;
            }
            res.pipe(file);
            file.on('finish', () => {
                file.close(() => {
                    fs.renameSync(tmp, dest);
                    resolve();
                  });
              });
          }).on('error', (err) => {
            try { fs.unlinkSync(tmp); } catch { /* empty */ }
            reject(err);
          });
      });
  }

  (async function main() {
    console.log('⬇️  Fetching local libs into build/local_libs …');
    ensureDir(LOCAL_LIBS_DIR);
    for (const { url, file } of SOURCES) {
      const dest = path.join(LOCAL_LIBS_DIR, file);
      try {
        await download(url, dest);
        const size = fs.statSync(dest).size;
        console.log(`✅ ${file} (${size} bytes)`);
        }
        catch (err) {
          console.warn(`⚠️  Failed to fetch ${file} from ${url}: ${err.message}`);
          }
        }
        console.log('✅ Done.');
      })();
