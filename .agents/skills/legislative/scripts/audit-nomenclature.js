import fs from "fs";
import path from "path";
import ignore from "ignore";
import { nomenclatureRules } from "./rules.js";

const ROOT_DIR = process.cwd();

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
