import fs from "fs";
import path from "path";
import { safeStatSync } from "../../warden/scripts/safe-fs.js";

const PROJECT_ROOT = process.cwd();

// Directories to never descend into
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".svelte-kit",
  ".vite",
  "archive",
  ".antigravityignore",
]);

// File/folder name prefixes that indicate special syntax (not project names)
const SKIP_PREFIXES = ["@", "$"];

/**
 * Rule 05 — Casing Standards
 *
 * kebab-case : all files and folders
 * PascalCase : .svelte component files (NOT .template.svelte)
 * ALL_CAPS   : intentional project convention (SKILL.md, SECURITY_AUDIT.md, etc.)
 *              — whitelisted, never flagged
 */

// kebab-case: lowercase letters, digits, hyphens. No underscores, no mixed case.
// Allows numeric prefix like "00-boot" or "01-plan".
const RE_KEBAB = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

// PascalCase: starts uppercase, followed by any alphanumeric chars, no hyphens/underscores.
const RE_PASCAL = /^[A-Z][a-zA-Z0-9]+$/;

// ALL_CAPS: starts uppercase, rest is uppercase letters, digits, underscores.
// This is the project's intentional whitelist bucket.
const RE_ALL_CAPS = /^[A-Z][A-Z0-9_]*$/;

/**
 * Returns true if the file is a real Svelte component (not a template wrapper).
 * e.g. "App.svelte" → true, "COMPONENT.template.svelte" → false
 */
function is_svelte_component(filename) {
  return filename.endsWith(".svelte") && !filename.includes(".template.");
}

/**
 * Compound suffixes that are valid project conventions and must be stripped
 * before casing validation. Order matters — strip longest first.
 * e.g. "audit-css.svelte.js" → strip ".svelte" → stem "audit-css"
 *      "bootstrap.test.js"   → strip ".test"   → stem "bootstrap"
 */
const STRIP_SUFFIXES = [
  ".template",
  ".svelte",
  ".test",
  ".spec",
  ".manual",
  ".unit",
  ".integration",
];

/**
 * Extracts the logical stem: splits on the first dot, then strips any
 * known compound suffixes from what remains.
 *
 * "App.svelte"                → "App"
 * "audit-css.js"              → "audit-css"
 * "SKILL.template.md"         → "SKILL"   (all-caps → whitelisted)
 * "bootstrap.test.js"         → "bootstrap"
 * "chrono.svelte.js"          → "chrono"
 * "STORE.template.svelte.ts"  → "STORE"   (all-caps → whitelisted)
 */
function get_base(filename) {
  // Strip the final extension first
  const withoutExt = filename.slice(0, filename.length - path.extname(filename).length);
  // Strip compound suffixes repeatedly until none remain
  // (e.g. "STORE.template.svelte.ts" → strip ".svelte" → strip ".template" → "STORE")
  let stem = withoutExt;
  let changed = true;
  while (changed) {
    changed = false;
    for (const suffix of STRIP_SUFFIXES) {
      if (stem.endsWith(suffix)) {
        stem = stem.slice(0, stem.length - suffix.length);
        changed = true;
        break;
      }
    }
  }
  return stem;
}

/**
 * Test suffixes that signal the file is a test companion.
 * Must match the same values used in STRIP_SUFFIXES.
 */
const TEST_SUFFIXES = [".test", ".spec", ".manual", ".unit", ".integration"];

/**
 * Extensions we look for when searching for a test subject sibling.
 * Ordered from most-specific to least-specific.
 */
const SUBJECT_EXTS = [".svelte", ".svelte.js", ".svelte.ts", ".js", ".ts"];

/**
 * Returns true when `filename` is a test file whose subject exists as a
 * sibling in `dir`. The subject name is derived by stripping the test suffix
 * from the stem (before the final extension).
 *
 * e.g.  VisualWing.test.js  →  subject stem "VisualWing"
 *       looks for VisualWing.svelte, VisualWing.js, etc. in `dir`
 *
 * @param {string} filename - Bare filename (e.g. "VisualWing.test.js")
 * @param {string} dir      - Absolute path to the containing directory
 */
function find_test_subject(filename, dir) {
  const ext = path.extname(filename);
  const withoutExt = filename.slice(0, filename.length - ext.length);

  // Check whether withoutExt ends in a test suffix
  let subject_stem = null;
  for (const suffix of TEST_SUFFIXES) {
    if (withoutExt.endsWith(suffix)) {
      subject_stem = withoutExt.slice(0, withoutExt.length - suffix.length);
      break;
    }
  }

  // Not a test file at all
  if (subject_stem === null) return false;

  // Look for any recognised subject extension in the same directory
  return SUBJECT_EXTS.some((se) => fs.existsSync(path.join(dir, subject_stem + se)));
}

/**
 * Core check for a single item (file or folder).
 *
 * @param {string}   name       - The bare file/folder name (no path)
 * @param {boolean}  is_dir     - Whether it is a directory
 * @param {string}   rel_path   - Path relative to project root (for reporting)
 * @param {Function} report     - Callback: (id, severity, rel_path, message)
 * @param {string}   [parent_dir] - Absolute path to the parent directory.
 *                                  Required for test-subject sibling lookup.
 */
function check_item(name, is_dir, rel_path, report, parent_dir = null) {
  // Skip special-syntax names (prefix check on raw name AND on base)
  if (SKIP_PREFIXES.some((p) => name.startsWith(p))) return;

  if (is_dir) {
    // Folders must always be kebab-case
    if (!RE_KEBAB.test(name)) {
      report(
        "N-LANG-003",
        "DEBT",
        rel_path + "/",
        `Folder must be kebab-case (lowercase, hyphens only). Got: "${name}"`,
      );
    }
    return;
  }

  const base = get_base(name);

  // Skip if base starts with a special-syntax prefix (e.g. $inspect.md → base "$inspect")
  if (SKIP_PREFIXES.some((p) => base.startsWith(p))) return;

  // ALL_CAPS names are intentional project convention — skip
  if (RE_ALL_CAPS.test(base)) return;

  // .svelte component files must be PascalCase
  if (is_svelte_component(name)) {
    if (!RE_PASCAL.test(base)) {
      report(
        "N-LANG-001",
        "DEBT",
        rel_path,
        `Svelte component must be PascalCase (e.g. "StoryPanel.svelte"). Got: "${base}"`,
      );
    }
    return;
  }

  // Everything else must be kebab-case.
  // Exception: test files that mirror the casing of their subject sibling
  // (e.g. VisualWing.test.js is valid when VisualWing.svelte exists nearby).
  if (!RE_KEBAB.test(base)) {
    if (parent_dir && find_test_subject(name, parent_dir)) return;
    report(
      "N-LANG-002",
      "DEBT",
      rel_path,
      `File must be kebab-case (lowercase, hyphens only). Got: "${base}"`,
    );
  }
}

/**
 * Recursively scans a directory, checking every file and folder name.
 *
 * @param {string}   dir     - Absolute path to scan
 * @param {object}   stats   - Mutable stats object { scanned, violations }
 * @param {Function} report  - Callback: (id, severity, rel_path, message)
 */
export function scan_nomenclature(dir, stats, report) {
  if (!fs.existsSync(dir)) return;

  const items = fs.readdirSync(dir);

  for (const item of items) {
    // Skip dotfiles and hidden dirs
    if (item.startsWith(".")) continue;

    const full_path = path.join(dir, item);
    const rel_path = path.relative(PROJECT_ROOT, full_path).replace(/\\/g, "/");

    const stat = safeStatSync(full_path);
    if (!stat) continue;

    if (stat.isDirectory()) {
      if (SKIP_DIRS.has(item)) continue;
      stats.scanned++;
      check_item(
        item,
        true,
        rel_path,
        (id, sev, rp, msg) => {
          stats.violations++;
          report(id, sev, rp, msg);
        },
        dir,
      );
      scan_nomenclature(full_path, stats, report);
    } else {
      stats.scanned++;
      check_item(
        item,
        false,
        rel_path,
        (id, sev, rp, msg) => {
          stats.violations++;
          report(id, sev, rp, msg);
        },
        dir,
      );
    }
  }
}

/**
 * Standalone entry point.
 * Usage: node audit-nomenclature.js [dir]
 */
if (process.argv[1] && process.argv[1].endsWith("audit-nomenclature.js")) {
  const target = process.argv[2] ? path.resolve(process.argv[2]) : path.join(PROJECT_ROOT, "src");

  const stats = { scanned: 0, violations: 0 };
  const RED = "\x1b[31m";
  const YELLOW = "\x1b[33m";
  const RESET = "\x1b[0m";

  const SLEVELS = {
    HERESY: { color: RED, label: "HERESY" },
    DEBT: { color: YELLOW, label: "DEBT" },
  };

  console.log("\n================================================================================");
  console.log("🔤 NOMENCLATURE AUDITOR (Rule 05 — Lexical Laws)");
  console.log("================================================================================\n");

  scan_nomenclature(target, stats, (id, sev, rel_path, msg) => {
    const s = SLEVELS[sev] || SLEVELS.DEBT;
    console.log(`${s.color}[${s.label}] ${rel_path}${RESET}`);
    console.log(`  [${id}] ${msg}\n`);
  });

  console.log("------------------------------------------");
  console.log(`📊 SCAN COMPLETE: ${stats.scanned} items scanned.`);
  console.log(`🔥 VIOLATIONS: ${stats.violations}`);
  console.log("------------------------------------------\n");
}
