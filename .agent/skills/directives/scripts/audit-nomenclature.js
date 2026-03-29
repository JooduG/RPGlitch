import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..", "..", "..", "..");

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

const SKIP_PREFIXES = ["@", "$"];

/**
 * Rule 05 — Casing Standards & Rule 06 — Modern Standards (No 'var')
 */

const RE_KEBAB = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
const RE_PASCAL = /^[A-Z][a-zA-Z0-9]+$/;
const RE_ALL_CAPS = /^[A-Z][A-Z0-9_]*$/;
const RE_VAR = /\bvar\s+[a-zA-Z_$][a-zA-Z0-9_$]*/g;

const STRIP_SUFFIXES = [".template", ".svelte", ".test", ".spec", ".manual", ".unit", ".integration"];
const TEST_SUFFIXES = [".test", ".spec", ".manual", ".unit", ".integration"];
const SUBJECT_EXTS = [".svelte", ".svelte.js", ".svelte.ts", ".js", ".ts"];

const getBase = (filename) => {
  const withoutExt = filename.slice(0, filename.length - path.extname(filename).length);
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
};

const findTestSubject = (filename, dir) => {
  const ext = path.extname(filename);
  const withoutExt = filename.slice(0, filename.length - ext.length);
  let subjectStem = null;
  for (const suffix of TEST_SUFFIXES) {
    if (withoutExt.endsWith(suffix)) {
      subjectStem = withoutExt.slice(0, withoutExt.length - suffix.length);
      break;
    }
  }
  if (!subjectStem) return false;
  return SUBJECT_EXTS.some(se => fs.existsSync(path.join(dir, subjectStem + se)));
};

/**
 * 🕵️ Audit Logic
 */
const checkItem = (name, isDir, relPath, report, parentDir = null) => {
  if (SKIP_PREFIXES.some(p => name.startsWith(p))) return;

  if (isDir) {
    if (!RE_KEBAB.test(name)) {
      report("N-LANG-003", "DEBT", relPath + "/", `Folder must be kebab-case. Got: "${name}"`);
    }
    return;
  }

  const base = getBase(name);
  if (SKIP_PREFIXES.some(p => base.startsWith(p))) return;
  if (RE_ALL_CAPS.test(base)) return;

  if (name.endsWith(".svelte") && !name.includes(".template.")) {
    if (!RE_PASCAL.test(base)) {
      report("N-LANG-001", "DEBT", relPath, `Svelte component must be PascalCase. Got: "${base}"`);
    }
  } else if (!RE_KEBAB.test(base)) {
    if (parentDir && findTestSubject(name, parentDir)) return;
    report("N-LANG-002", "DEBT", relPath, `File must be kebab-case. Got: "${base}"`);
  }

  // Modernity Check (Rule 06): No 'var'
  if (name.match(/\.(js|ts|svelte)$/)) {
    const filePath = path.join(parentDir || PROJECT_ROOT, name);
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const varMatches = content.match(RE_VAR);
      if (varMatches) {
        report("N-LANG-VAR", "HERESY", relPath, `Forbidden usage of 'var' detected: ${varMatches.join(", ")}`);
      }
    } catch (e) { /* skip */ }
  }
};

export const scan_nomenclature = (dir, stats, report) => {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);

  for (const item of items) {
    if (item.startsWith(".")) continue;
    const fullPath = path.join(dir, item);
    const relPath = path.relative(PROJECT_ROOT, fullPath).replace(/\\/g, "/");
    const stat = fs.statSync(fullPath);

    stats.scanned++;
    if (stat.isDirectory()) {
      if (SKIP_DIRS.has(item)) continue;
      checkItem(item, true, relPath, report, dir);
      scan_nomenclature(fullPath, stats, report);
    } else {
      checkItem(item, false, relPath, report, dir);
    }
  }
};

// Main entry
if (process.argv[1] && process.argv[1].endsWith("audit-nomenclature.js")) {
  const target = process.argv[2] ? path.resolve(process.argv[2]) : path.join(PROJECT_ROOT, "src");
  const stats = { scanned: 0, violations: 0 };
  
  console.log("\n🔤 NOMENCLATURE & MODERNITY AUDITOR");
  
  scan_nomenclature(target, stats, (id, sev, relPath, msg) => {
    stats.violations++;
    console.log(`  [${sev}] ${relPath}: ${msg} (${id})`);
  });

  console.log(`\n📊 SCAN COMPLETE: ${stats.scanned} scanned, ${stats.violations} violations.\n`);
}
