import fs from "fs";
import path from "path";
import ignore from "ignore";

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, "src");

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

const securityRules = [
  {
    id: "SECURITY_SVELTE_HTML",
    severity: "HERESY",
    regex: /\{@html\s+/,
    message: "🚨 Svelte {@html ...} Compliance Violation! Use `use:safe_html` action to prevent DOM Clobbering in static components.",
    validate: (line, filePath) => path.basename(filePath) !== "Typewriter.svelte",
  },

  {
    id: "SECURITY_DEBUG_LOG",
    severity: "DEBT",
    regex: /console\.log\(|alert\(|debugger;/,
    message: "⚠️ Debug statement detected. Please purge before commit.",
    validate: (line, filePath) => {
      return !filePath.endsWith(".test.js") && !filePath.includes("/scripts/");
    },
  },
  {
    id: "SECURITY_SECRET_LEAK",
    severity: "HERESY",
    // Look for assignments/keys that look like secrets. Avoid matching generic "key" or "token".
    regex: /\b(api_?key|auth_?token|secret_?key|password)\b\s*[:=]\s*["'][^"']{8,}/i,
    message: "🚨 Potential Secret Leak! Verify that variables are environment-bound and NOT hardcoded.",
    validate: (line) => !line.includes("process.env"),
  },
  {
    id: "SECURITY_DOMPURIFY_CONFIG",
    severity: "HERESY",
    regex: /DOMPurify\.sanitize\s*\(/,
    message: "🚨 DOMPurify Compliance Violation! You MUST include SANITIZE_NAMED_PROPS: true to prevent DOM Clobbering (Rule 06).",
    validate: (() => {
      const cache = new Map();
      return (line, filePath) => {
        const content = fs.readFileSync(filePath, "utf-8");
        const fileLines = content.split("\n");
        const lastIndex = cache.get(filePath) ?? -1;
        const lineIndex = fileLines.indexOf(line, lastIndex + 1);
        cache.set(filePath, lineIndex);
        if (lineIndex === -1) return true;
        const context = fileLines.slice(lineIndex, lineIndex + 10).join("\n");
        return !context.includes("SANITIZE_NAMED_PROPS: true");
      };
    })(),
  },
];

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

    if (stat.isDirectory()) {
      scan(fullPath);
    } else {
      const ext = path.extname(fullPath);
      if (ext === ".js" || ext === ".ts" || ext === ".svelte") {
        scanned++;
        auditFile(fullPath);
      }
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

  securityRules.forEach((rule) => {
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
console.log("🛡️  AUDIT: SECURITY RULES");
console.log("================================================================================\n");

scan(SRC_DIR);

console.log("--------------------------------------------------------------------------------");
console.log(`📊 SCAN COMPLETE: ${scanned} javascript/typescript assets verified.`);
console.log(`🔥 VIOLATIONS: ${violations}`);
console.log("--------------------------------------------------------------------------------\n");

if (hasHeresy) {
  console.log(`${RED}❌ REJECTED: Security Heresy detected. Gate closed.${RESET}`);
  process.exit(1);
} else {
  console.log(`${GREEN}✅ RESONANT: All protocols align. Proceeding.${RESET}`);
}
