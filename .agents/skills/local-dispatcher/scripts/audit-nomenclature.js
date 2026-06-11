import fs from "fs";
import path from "path";
import ignore from "ignore";
const ROOT_DIR = process.cwd();
const PROJECT_ROOT = ROOT_DIR;

/**
 * ==========================================
 * NOMENCLATURE RULES
 * ==========================================
 */

const RE_KEBAB = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
const RE_PASCAL = /^[A-Z][a-zA-Z0-9]+$/;
const RE_ALL_CAPS = /^[A-Z][A-Z0-9_]*$/;
const RE_VAR = /\bvar\s+[a-zA-Z_$][a-zA-Z0-9_$]*/;

const STRIP_SUFFIXES = [
  ".template",
  ".svelte",
  ".test",
  ".spec",
  ".manual",
  ".unit",
  ".integration",
  ".d",
];
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
  return SUBJECT_EXTS.some((se) => fs.existsSync(path.join(dir, subjectStem + se)));
};

export const nomenclatureRules = [
  {
    id: "N-LANG-001",
    severity: "DEBT",
    message: "Svelte component must be PascalCase.",
    auditPath: (name, isDir) => {
      if (isDir || !name.endsWith(".svelte") || name.includes(".template.")) return true;
      const base = getBase(name);
      return RE_PASCAL.test(base);
    },
  },
  {
    id: "N-LANG-002",
    severity: "DEBT",
    message: "File must be kebab-case.",
    auditPath: (name, isDir, relPath) => {
      if (isDir || name.includes("RPGlitch") || name.startsWith("@") || name.startsWith("$"))
        return true;
      if (name.endsWith(".svelte") && !name.includes(".template.")) return true;
      const base = getBase(name);
      if (RE_ALL_CAPS.test(base)) return true;

      const parentDir = path.dirname(path.join(PROJECT_ROOT, relPath));
      if (findTestSubject(name, parentDir)) return true;

      return RE_KEBAB.test(base);
    },
  },
  {
    id: "N-LANG-003",
    severity: "DEBT",
    message: "Folder must be kebab-case or All-Caps abbreviation.",
    auditPath: (name, isDir) => {
      if (!isDir || name.startsWith(".") || name.startsWith("@") || name.startsWith("$"))
        return true;
      return RE_KEBAB.test(name) || RE_ALL_CAPS.test(name);
    },
  },
  {
    id: "N-LANG-VAR",
    severity: "HERESY",
    message: "Forbidden usage of 'var' detected.",
    regex: RE_VAR,
    validate: (line, filePath) => filePath.match(/\.(js|ts|svelte)$/),
  },
];

// Load gitignore for standard ignores
const ig = ignore();
const gitignorePath = path.join(ROOT_DIR, ".gitignore");
if (fs.existsSync(gitignorePath)) {
  ig.add(fs.readFileSync(gitignorePath, "utf-8"));
}

const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";

let scanned = 0;
let violations = 0;
let hasHeresy = false;

/**
 *
 */
function scan(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relPath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, "/");

    if (ig.ignores(relPath) || relPath.includes("node_modules")) continue;

    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch {
      continue;
    }

    const isDir = stat.isDirectory();
    scanned++;

    // Run structural path rules
    nomenclatureRules.forEach((rule) => {
      if (rule.auditPath && !rule.auditPath(item, isDir, relPath)) {
        violations++;
        const color = rule.severity === "HERESY" ? RED : YELLOW;
        if (rule.severity === "HERESY") hasHeresy = true;

        console.log(`${color}[${rule.severity}] ${relPath}${RESET}`);
        console.log(`  ${rule.message}\n`);
      }
    });

    if (isDir) {
      scan(fullPath);
    } else {
      auditFile(fullPath);
    }
  }
}

/**
 *
 */
function auditFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");

  if (relPath.includes("audit-") || relPath.includes(".bak.")) return;

  const fileRules = nomenclatureRules.filter((r) => r.regex);

  fileRules.forEach((rule) => {
    lines.forEach((line, i) => {
      if (rule.regex.test(line)) {
        if (rule.validate && !rule.validate(line, filePath)) return;

        violations++;
        const color = rule.severity === "HERESY" ? RED : YELLOW;
        if (rule.severity === "HERESY") hasHeresy = true;

        console.log(`${color}[${rule.severity}] ${relPath}:${i + 1}${RESET}`);
        console.log(`  ${rule.message}`);
        console.log(`  Code: ${line.trim().substring(0, 100)}\n`);
      }
    });
  });
}

console.log("\n================================================================================");
console.log("🏷️ AUDIT: NOMENCLATURE & PATHS");
console.log("================================================================================\n");

const SRC_DIR = path.join(ROOT_DIR, "src");
const SKILLS_DIR = path.join(ROOT_DIR, ".agents/skills");
const WORKFLOWS_DIR = path.join(ROOT_DIR, ".agents/workflows");

[SRC_DIR, SKILLS_DIR, WORKFLOWS_DIR].forEach((dir) => scan(dir));

console.log("--------------------------------------------------------------------------------");
console.log(`📊 SCAN COMPLETE: ${scanned} items verified.`);
console.log(`🔥 VIOLATIONS: ${violations}`);
console.log("--------------------------------------------------------------------------------\n");

if (hasHeresy) {
  console.log(
    `${RED}❌ REJECTED: Heresy detected in file names or forbidden variables. Gate closed.${RESET}`,
  );
  process.exit(1);
} else {
  console.log(`${GREEN}✅ RESONANT: All protocols align. Proceeding.${RESET}`);
}
