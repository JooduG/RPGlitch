import fs from "fs";
import ignore from "ignore";
import path from "path";
import { PATHS, getSourceFiles, parseDefinedTokens } from "./token-utils.js";

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

const themeRules = [
  {
    id: "THEME_HOVER_TRANSFORM",
    severity: "HERESY",
    regex: /:hover\s*\{[^}]*translateY|:hover\s*\{[^}]*transform:\s*translate/,
    message:
      "❌ Rule 04 violation: GROUNDED POLICY. Avoid translateY on hover to maintain subterranean weight.",
  },
  {
    id: "THEME_RADIUS",
    severity: "ADVICE",
    regex: /border-radius:\s*[0-9]+px/,
    message: "❌ Hardcoded border-radius. Use Tokens: var(--border-radius-m), etc.",
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

  themeRules.forEach((rule) => {
    lines.forEach((line, i) => {
      if (rule.regex.test(line)) {
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

/**
 *
 */
export function auditCodebaseTokens() {
  const definedMap = parseDefinedTokens();
  const source_files = getSourceFiles(PATHS.src).filter(
    (file) => file !== PATHS.designCss && file !== PATHS.jsBridge,
  );

  let total_failures = 0;

  for (const file of source_files) {
    const rel_path = path.relative(PATHS.root, file).replace(/\\/g, "/");
    const lines = fs.readFileSync(file, "utf8").split("\n");
    const is_test_file = file.endsWith(".test.js") || file.endsWith(".test.ts");

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const is_comment_or_doc = /^\s*(\/\/|\*|\/\*)/.test(line);
      if (!is_test_file && !is_comment_or_doc) {
        const var_matches = [...line.matchAll(/var\((--[a-zA-Z0-9_-]+)/g)];
        for (const match of var_matches) {
          const token_name = match[1];
          if (!definedMap.has(token_name)) {
            // Exempt local component variables and standard Tailwind variables
            if (token_name === "--stage-align") continue;
            if (token_name.startsWith("--color-")) continue;
            if (token_name.startsWith("--bits-")) continue;
            if (token_name.startsWith("--state-")) continue;

            console.error(
              `${RED}[HERESY] ${rel_path}:${index + 1} - Hallucinated variable reference: ${token_name}${RESET}`,
            );
            total_failures++;
            hasHeresy = true;
          }
        }
      }
    }
  }

  return total_failures;
}

/**
 *
 */
export function findUnusedTokens() {
  const definedMap = parseDefinedTokens();
  const source_files = getSourceFiles(PATHS.src).filter(
    (f) => f !== PATHS.designCss && f !== PATHS.jsBridge,
  );

  const combined_content = source_files.map((f) => fs.readFileSync(f, "utf8")).join("\n");

  const unused = Array.from(definedMap.keys()).filter((token) => {
    // Exempt signature color palette stuff from debt
    const signatureColors = [
      "--coral-rose",
      "--forest-green",
      "--lemon-yellow",
      "--lime-green",
      "--neon-teal",
      "--ocean-blue",
      "--pumpkin-amber",
      "--royal-purple",
      "--sunset-orange",
      "--twilight-violet",
      "--crimson-red",
      "--frisk",
      "--glass-peak",
      "--frozen",
      "--frozen",
      "--frozen",
    ];
    if (signatureColors.includes(token)) return false;

    const regex = new RegExp(`(?<![a-zA-Z0-9_-])${token}(?![a-zA-Z0-9_-])`);
    return !regex.test(combined_content);
  });

  if (unused.length > 0) {
    console.log(`${YELLOW}[DEBT] Unused tokens defined in design.css:${RESET}`);
    unused.forEach((tok) => console.log(`  - ${tok}`));
    console.log("");
  }
}

console.log("\n================================================================================");
console.log("🎨 AUDIT: DESIGN SYSTEM");
console.log("================================================================================\n");

scan(SRC_DIR);
const token_failures = auditCodebaseTokens();
violations += token_failures;
findUnusedTokens();

console.log("--------------------------------------------------------------------------------");
console.log(`📊 SCAN COMPLETE: ${scanned} design assets verified.`);
console.log(`🔥 VIOLATIONS: ${violations}`);
console.log("--------------------------------------------------------------------------------\n");

if (hasHeresy) {
  console.log(`${RED}❌ REJECTED: Heresy detected in design tokens. Gate closed.${RESET}`);
  process.exit(1);
} else {
  console.log(`${GREEN}✅ RESONANT: All protocols align. Proceeding.${RESET}`);
}
