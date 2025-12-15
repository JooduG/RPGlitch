import fs from "fs";
import path from "path";
import { glob } from "glob";

// --- SETUP ---

// Config
const SEARCH_DIR = "apps";
const IGNORE_PATTERNS = ["**/node_modules/**", "**/build/**", "**/*.d.ts"];

// Files that are allowed to have 0 internal references (Entry Points)
const ENTRY_POINTS = ["setup.js", "index.js", "bootstrap.js", "index.scss"];

async function scan() {
  console.log("🧹 RPGlitch Hygiene Scanner");
  console.log("---------------------------");

  // 1. Find all candidates (Including entry points, so we can see what THEY import)
  const files = await glob(`${SEARCH_DIR}/**/*.{js,scss}`, {
    ignore: IGNORE_PATTERNS,
  });
  console.log(`Found ${files.length} files to analyze.`);

  // 2. Load all content into memory (Repo is small enough)
  const allContent = files.map((f) => ({
    path: f,
    content: fs.readFileSync(f, "utf-8"),
    basename: path.basename(f, path.extname(f)), // e.g. "button" from "button.js"
    filename: path.basename(f),
  }));

  const possibleOrphans = [];

  // 3. Check each file
  for (const file of allContent) {
    // Skip entry points from being reported as orphans
    if (ENTRY_POINTS.includes(file.filename)) continue;

    let references = 0;
    let searchNames = [file.basename];

    // SCSS Specific Logic
    if (file.path.endsWith(".scss")) {
      // 1. Handle partials: "_foo.scss" -> search for "foo"
      if (file.basename.startsWith("_")) {
        searchNames.push(file.basename.substring(1));
      }
      // 2. Handle index files: "dir/_index.scss" -> search for "dir"
      if (file.basename === "_index") {
        const parentDir = path.basename(path.dirname(file.path));
        searchNames.push(parentDir);
      }
    }

    const searchPath = file.path.replace(/\\/g, "/"); // Normalize for JS imports

    for (const other of allContent) {
      if (other.path === file.path) continue;

      // Check if ANY of the search names appear in the other file
      if (
        searchNames.some((name) => other.content.includes(name)) ||
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
