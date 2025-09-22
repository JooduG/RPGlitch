import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';

const REPO_ROOT = process.cwd();
const LOCAL_LIBS_DIR = path.join(REPO_ROOT, 'build', 'local_libs');

// Libraries with UPDATED pinned versions and integrity checksums
const SOURCES = [
  {
    url: 'https://unpkg.com/@picocss/pico@2.0.6/css/pico.min.css',
    file: 'pico.min.css',
    sha256: 'dd5fd5591afd81ee21dcc117ad85c014dc3f1f19dc2d7b7d101ea0acc29274c2'
  },
  {
    url: 'https://unpkg.com/cash-dom@8.1.5/dist/cash.min.js',
    file: 'cash.min.js',
    sha256: '9a044188efdb625c5e04d1220698c099927ff16bfb434c37cd7f04dd5ee1ae1f'
  },
  {
    url: 'https://unpkg.com/dexie@4.0.7/dist/dexie.js',
    file: 'dexie.js',
    sha256: 'abf1352af0b3d46aa875be259fcee0454bfc7e95e5f8b22e071c19027b6a3b64'
  },
  {
    url: 'https://unpkg.com/dompurify@3.1.6/dist/purify.min.js',
    file: 'purify.min.js',
    sha256: 'c0845096a7c4a6741f362ac506c94c1c7d27dc603bcc1bf64a587f76f2dbe3a1'
  },
  {
    url: 'https://unpkg.com/hyperscript.org@0.9.12/dist/_hyperscript.min.js',
    file: '_hyperscript.min.js',
    sha256: 'cd737e9904a7eed1ee9639b75eb07915baad92961586d0a1fd6d998d24179de6'
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
    if (fs.existsSync(dest) && getFileChecksum(dest) === sha256) {
      // File exists and checksum is correct, we're good
      return resolve();
    }

    const tmpDest = `${dest}.tmp`;
    const file = fs.createWriteStream(tmpDest);

    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        if (fs.existsSync(tmpDest)) fs.unlinkSync(tmpDest);
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
      try { if (fs.existsSync(tmpDest)) fs.unlinkSync(tmpDest); }
      catch { /* suppress */ }
      reject(err);
    });
  });
}

(async function main() {
  console.log('\n⬇️  Fetching and verifying local libs...');
  ensureDir(LOCAL_LIBS_DIR);

  const downloadPromises = SOURCES.map(async ({ url, file, sha256 }) => {
    const dest = path.join(LOCAL_LIBS_DIR, file);
    try {
      await download(url, dest, sha256);
      const size = fs.statSync(dest).size;
      console.log(`✅ ${file} (${(size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`❌ Failed to fetch ${file}: ${err.message}`);
      // Exit with an error code to stop the deploy process if a lib fails
      process.exit(1);
    }
  });

  await Promise.all(downloadPromises);
  console.log('✅ Lib sync complete.');
})();

