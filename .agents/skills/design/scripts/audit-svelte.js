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

const svelteRules = [
  {
    id: "SVELTE_LEGACY_PROPS",
    severity: "HERESY",
    regex: /export\s+let\s+\w+/,
    message: "CRITICAL: 'export let' is deprecated. Use '$props()'.",
  },
  {
    id: "SVELTE_LEGACY_REACTIVE",
    severity: "HERESY",
    regex: /\$:/,
    message: "CRITICAL: '$:' reactive declarations are deprecated. Use '$derived' or '$effect'.",
  },
  {
    id: "SVELTE_LEGACY_DISPATCHER",
    severity: "HERESY",
    regex: /createEventDispatcher/,
    message: "CRITICAL: 'createEventDispatcher' is deprecated. Use callback props.",
  },
  {
    id: "SVELTE_LEGACY_SLOT",
    severity: "ADVICE",
    regex: /<slot/,
    message: "WARNING: '<slot>' is deprecated. Use snippets '{@render ...}'.",
  },
  {
    id: "SVELTE_BANNED_PROPS",
    severity: "HERESY",
    regex: /\$\$props|\$\$restProps/,
    message: "CRITICAL: '$$props' is banned. Destructure '$props()' for better performance and clarity.",
  },
  {
    id: "SVELTE_LEGACY_STORES",
    severity: "HERESY",
    // Use a negative lookbehind to ensure we don't match $derived, etc.
    regex: /(?<!\$)\b(writable|readable|derived)\(/,
    message: "CRITICAL: Svelte 4 stores are redundant. Use '$state()' and '$derived()' runes.",
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
      if (ext === ".svelte") {
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

  svelteRules.forEach((rule) => {
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
console.log("🔥 AUDIT: SVELTE 5 RUNES");
console.log("================================================================================\n");

scan(SRC_DIR);

console.log("--------------------------------------------------------------------------------");
console.log(`📊 SCAN COMPLETE: ${scanned} svelte files verified.`);
console.log(`🔥 VIOLATIONS: ${violations}`);
console.log("--------------------------------------------------------------------------------\n");

if (hasHeresy) {
  console.log(`${RED}❌ REJECTED: Heresy detected in Svelte 5 logic. Gate closed.${RESET}`);
  process.exit(1);
} else {
  console.log(`${GREEN}✅ RESONANT: All protocols align. Proceeding.${RESET}`);
}
