/**
 * @file .agents/skills/local-scripts/scripts/audit-layers.js
 * 🏛️ Strict Layer Boundary Enforcement Gate
 *
 * Verifies that imports strictly flow DOWNWARD:
 * src/ui/ -> src/state/ -> src/intelligence/ -> src/data/ -> (src/platform/, src/media/, src/utils/)
 *
 * Upward imports are strictly prohibited:
 * - src/state/ CANNOT import from src/ui/
 * - src/intelligence/ CANNOT import from src/state/ or src/ui/
 * - src/data/ CANNOT import from src/intelligence/, src/state/, or src/ui/
 * - src/platform/, src/media/, src/utils/ CANNOT import from data, intelligence, state, or ui
 *
 * Exits with status code 1 if any upward imports or boundary violations are detected.
 */

import fs from "fs";
import path from "path";

const LAYER_HIERARCHY = {
  "src/ui": 5,
  "src/state": 4,
  "src/intelligence": 3,
  "src/data": 2,
  "src/media": 1, // Sensory presentation & audio/visual engine (platform sibling)
  "src/platform": 1,
  "src/utils": 1,
};

const ALIAS_LAYER_MAP = {
  "@ui": "src/ui",
  "@console": "src/ui",
  "@story": "src/ui",
  "@message": "src/ui",
  "@entity": "src/ui",
  "@profile": "src/ui",
  "@image": "src/ui",
  "@primitives": "src/ui",
  "@motion": "src/ui",
  "@state": "src/state",
  "@intelligence": "src/intelligence",
  "@data": "src/data",
  "@platform": "src/platform",
  "@media": "src/media",
  "@utils": "src/utils",
};

/**
 * Returns the layer key for a given file path.
 * @param {string} file_path
 * @returns {string|null}
 */
function get_file_layer(file_path) {
  const normalized = file_path.replace(/\\/g, "/");
  for (const layer of Object.keys(LAYER_HIERARCHY)) {
    if (normalized.includes(`/${layer}/`) || normalized.startsWith(`${layer}/`)) {
      return layer;
    }
  }
  return null;
}

/**
 * Recursively scans directory for source files (.js, .svelte).
 * @param {string} dir
 * @returns {string[]}
 */
function walk_dir(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full_path = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".git" && entry.name !== "dist") {
        files = files.concat(walk_dir(full_path));
      }
    } else if ((entry.name.endsWith(".js") || entry.name.endsWith(".svelte")) && !entry.name.endsWith(".test.js")) {
      files.push(full_path);
    }
  }
  return files;
}

/**
 * Audits all source files in src/ for architectural layer violations.
 */
function audit_layers() {
  const root_dir = process.cwd();
  const src_dir = path.join(root_dir, "src");
  const files = walk_dir(src_dir);

  const violations = [];

  for (const file of files) {
    const relative_path = path.relative(root_dir, file).replace(/\\/g, "/");
    const file_layer = get_file_layer(relative_path);
    if (!file_layer) continue;

    const file_rank = LAYER_HIERARCHY[file_layer];
    const raw_content = fs.readFileSync(file, "utf8");
    // Strip block and line comments to avoid matching @typedef JSDoc or commented out imports
    const content = raw_content.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

    // Match static and dynamic import statements
    const import_regex = /(?:import\s+(?:[\s\S]*?from\s+)?['"]([^'"]+)['"])|(?:import\(['"]([^'"]+)['"]\))/g;
    let match;

    while ((match = import_regex.exec(content)) !== null) {
      const specifier = match[1] || match[2];
      if (!specifier) continue;

      let imported_layer = null;

      // Check alias imports
      for (const [alias, mapped_layer] of Object.entries(ALIAS_LAYER_MAP)) {
        if (specifier === alias || specifier.startsWith(`${alias}/`)) {
          imported_layer = mapped_layer;
          break;
        }
      }

      // Check relative imports
      if (!imported_layer && specifier.startsWith(".")) {
        const target_path = path.resolve(path.dirname(file), specifier);
        const rel_target = path.relative(root_dir, target_path).replace(/\\/g, "/");
        imported_layer = get_file_layer(rel_target);
      }

      // If imported layer found, check rank
      if (imported_layer && LAYER_HIERARCHY[imported_layer] !== undefined) {
        const imported_rank = LAYER_HIERARCHY[imported_layer];

        // Violation: imported file layer rank is higher than importing file layer rank
        if (imported_rank > file_rank) {
          violations.push({
            file: relative_path,
            file_layer,
            specifier,
            imported_layer,
          });
        }
      }
    }
  }

  return violations;
}

// -----------------------------------------------------------------------------
// CLI Execution
// -----------------------------------------------------------------------------

console.log("🏛️ [AUDIT] Checking architectural layer boundaries in src/...");
const violations = audit_layers();

if (violations.length === 0) {
  console.log("✅ [PASSED] 0 layer boundary violations detected. All imports flow downward.");
  process.exit(0);
} else {
  console.error(`❌ [FAILED] Found ${violations.length} layer boundary violation(s):`);
  for (const v of violations) {
    console.error(`  - ${v.file} (${v.file_layer}) -> imported "${v.specifier}" (${v.imported_layer})`);
  }
  process.exit(1);
}
