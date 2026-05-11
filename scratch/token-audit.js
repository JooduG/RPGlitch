import fs from "fs";
import path from "path";

const srcDir = "./src";
const engineCssPath = "./src/theme/engine.css";

// 1. Get all tokens defined in engine.css
const engineCss = fs.readFileSync(engineCssPath, "utf-8");
const definedTokens = new Set();
const tokenRegex = /--[a-zA-Z0-9-]+(?=:)/g;
let match;
while ((match = tokenRegex.exec(engineCss)) !== null) {
  definedTokens.add(match[0]);
}

console.log(`Found ${definedTokens.size} defined tokens in engine.css`);

// 2. Scan src for used tokens
const usedTokens = new Map();
const varRegex = /var\((--[a-zA-Z0-9-]+)\)/g;

/**
 * Recursively scans a directory for files and extracts used CSS tokens.
 * @param {string} dir - The directory path to scan.
 */
function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith(".svelte") || file.endsWith(".css") || file.endsWith(".js")) {
      const content = fs.readFileSync(fullPath, "utf-8");
      let m;
      while ((m = varRegex.exec(content)) !== null) {
        const token = m[1];
        if (!usedTokens.has(token)) {
          usedTokens.set(token, []);
        }
        usedTokens.get(token).push(fullPath);
      }
    }
  }
}

scanDir(srcDir);

console.log(`Found ${usedTokens.size} unique tokens used in src`);

// 3. Find discrepancies
const missingTokens = [];
for (const [token, paths] of usedTokens.entries()) {
  if (!definedTokens.has(token)) {
    missingTokens.push({ token, paths: [...new Set(paths)] });
  }
}

if (missingTokens.length > 0) {
  console.log("\n[FATAL] Found missing/hallucinated tokens:");
  missingTokens.forEach(({ token, paths }) => {
    console.log(`- ${token}`);
    paths.forEach((p) => console.log(`  - ${p}`));
  });
} else {
  console.log("\nAll used tokens are defined in engine.css");
}
