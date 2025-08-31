#!/usr/bin/env node
/*
 * Fetch/refresh local libs into build/local_libs.
 * This version includes updated integrity checks and will report the
 * new checksum if a mismatch is found.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const LOCAL_LIBS_DIR = path.join(ROOT, 'build', 'local_libs');

// Libraries with UPDATED pinned versions and integrity checksums
const SOURCES = [
  { 
    url: 'https://unpkg.com/@picocss/pico@2.0.6/css/pico.min.css', 
    file: 'pico.min.css',
    sha256: '792be4374f635c942aac24c89b7c6c4c9a2072186f9f0914e44b94f0d853c07f' 
  },
  { 
    url: 'https://unpkg.com/cash-dom@8.1.5/dist/cash.min.js', 
    file: 'cash.min.js',
    sha256: '948e50b1d33c84025a72f07328e436c8435b8a531f82c6baf234b6b6028a07f0'
  },
  { 
    url: 'https://unpkg.com/dexie@3.2.4/dist/dexie.js', 
    file: 'dexie.js',
    sha256: '9232c65a0c326075c328131518f88f01b8705c754668b813f56f18378d380f2d'
  },
  { 
    url: 'https://unpkg.com/dompurify@3.1.6/dist/purify.min.js', 
    file: 'purify.min.js',
    sha256: 'e8334a171d18a42f883210d79679234190c68196e8d2f1f54924a259bb84cc37'
  },
  { 
    url: 'https://unpkg.com/hyperscript.org@0.9.12/dist/_hyperscript.min.js', 
    file: '_hyperscript.min.js',
    sha256: '95821c1f1c75c87a1441c9f658c279326e3860064f77c385c786e24f74d9e033'
  },
];

function ensureDir(p) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}

function getFileChecksum(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

function download(url, dest, sha256) {
  return new Promise((resolve, reject) => {
    // If file exists and checksum matches, we're good.
    if (fs.existsSync(dest) && getFileChecksum(dest) === sha256) {
      return resolve();
    }

    const tmpDest = `${dest}.tmp`;
    const file = fs.createWriteStream(tmpDest);
    
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        if(fs.existsSync(tmpDest)) fs.unlinkSync(tmpDest);
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          const actualHash = getFileChecksum(tmpDest);
          if (actualHash === sha256) {
            fs.renameSync(tmpDest, dest);
            resolve();
          } else {
            fs.unlinkSync(tmpDest);
            const errorMsg = `Checksum mismatch for ${path.basename(dest)}.\n` +
                             `Expected: ${sha256}\n` +
                             `Got:      ${actualHash} <-- You might need to update this in the script.`;
            reject(new Error(errorMsg));
          }
        });
      });
    }).on('error', (err) => {
      try { if(fs.existsSync(tmpDest)) fs.unlinkSync(tmpDest); } catch (e) { /* suppress */ }
      reject(err);
    });
  });
}

(async function main() {
  console.log('⬇️  Fetching and verifying local libs...');
  ensureDir(LOCAL_LIBS_DIR);

  const downloadPromises = SOURCES.map(async ({ url, file, sha256 }) => {
    const dest = path.join(LOCAL_LIBS_DIR, file);
    try {
      await download(url, dest, sha256);
      const size = fs.statSync(dest).size;
      console.log(`✅ ${file} (${(size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`❌ Failed to fetch ${file}: ${err.message}`);
    }
  });

  await Promise.all(downloadPromises);
  console.log('✅ Lib sync complete.');
})();
