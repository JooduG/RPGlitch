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

const cssRules = [
  //  {
  //   id: "RAW_COLOR",
  // severity: "HERESY",
  // regex: /#([0-9A-Fa-f]{3}){1,2}\b|\brgba?\(|\bhsla?\(/i,
  // message: "❌ Hardcoded color detected. Use Tokens: var(--chalk), etc.",
  // validate: (line) =>
  //  !line.includes("url(") &&
  //  !line.includes("var(") &&
  // !line.includes("hex_to_rgb") &&
  //!line.trim().startsWith("/*") &&
  // !line.trim().startsWith("*"),
  // },
  {
    id: "PIXEL_BORDER",
    severity: "ADVICE",
    regex: /border:\s*[1-9]px/,
    message: "❌ Pixel border detected. Use depth markers like shadows.",
  },
  {
    id: "LEGACY_SPACING_SYNTAX",
    severity: "HERESY",
    regex:
      /\b(margin|padding|gap|row-gap|column-gap|grid-gap|top|bottom|left|right|inset|width|height|min-width|min-height|max-width|max-height|flex-basis)\s*:[^;]*\bvar\(--spacing-[0-9]+\)/i,
    message: "Legacy hardcoded spacing scale used inside structural descriptors. Update rules.",
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
      if (ext === ".css" || ext === ".svelte") {
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

  if (relPath.includes("audit-") || relPath.endsWith("design.css") || relPath.includes(".bak."))
    return;

  cssRules.forEach((rule) => {
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
console.log("🎨 AUDIT: CSS RULES");
console.log("================================================================================\n");

scan(SRC_DIR);

console.log("--------------------------------------------------------------------------------");
console.log(`📊 SCAN COMPLETE: ${scanned} styling files verified.`);
console.log(`🔥 VIOLATIONS: ${violations}`);
console.log("--------------------------------------------------------------------------------\n");

if (hasHeresy) {
  console.log(`${RED}❌ REJECTED: Heresy detected in styling. Gate closed.${RESET}`);
  process.exit(1);
} else {
  console.log(`${GREEN}✅ RESONANT: All protocols align. Proceeding.${RESET}`);
}
