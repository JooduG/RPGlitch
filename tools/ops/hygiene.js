import fs from "fs";
import path from "path";
import { glob } from "glob";
import { fileURLToPath } from "url";

// --- SETUP ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../../");

// Config
const SEARCH_DIR = "apps";
const IGNORE_PATTERNS = [
  "**/node_modules/**",
  "**/build/**",
  "**/*.d.ts",
  "**/setup.js", // Often entry points
  "**/index.js", // Entry points
  "**/bootstrap.js", // Entry point
  "**/index.scss", // Entry point
];

async function scan() {
  console.log("🧹 RPGlitch Hygiene Scanner");
  console.log("---------------------------");

  // 1. Find all candidates
  // glob handles cwd relative to process.cwd() by default, which is convenient
  const files = await glob(`${SEARCH_DIR}/**/*.{js,scss}`, {
    ignore: IGNORE_PATTERNS,
  });
  console.log(`Found ${files.length} files to analyze.`);

  // 2. Load all content into memory (Repo is small enough)
  const allContent = files.map((f) => ({
    path: f,
    content: fs.readFileSync(f, "utf-8"),
    basename: path.basename(f, path.extname(f)), // e.g. "button" from "button.js"
  }));

  const possibleOrphans = [];

  // 3. Check each file
  for (const file of allContent) {
    let references = 0;
    const searchName = file.basename;
    const searchPath = file.path.replace(/\\/g, "/"); // Normalize for JS imports

    for (const other of allContent) {
      if (other.path === file.path) continue;

      // Checks:
      // 1. Basename import (import ... from './button')
      // 2. Full path usage (@use 'components/buttons')
      if (
        other.content.includes(searchName) ||
        other.content.includes(searchPath)
      ) {
        references++;
        break; // Found one, it's safe
      }
    }

    if (references === 0) {
      possibleOrphans.push(file.path);
    }
  }

  // 4. Report
  if (possibleOrphans.length === 0) {
    console.log("✨ Clean! No obvious orphans found.");
  } else {
    console.log(`⚠️  Found ${possibleOrphans.length} potential orphans:`);
    possibleOrphans.forEach((p) => console.log(`   - ${p}`));
    console.log("\n(Note: False positives possible. Verify before deleting.)");
    // process.exit(1); // Removed exit 1 so it doesn't fail the build/workflow if just reporting
  }
}

scan().catch(console.error);
