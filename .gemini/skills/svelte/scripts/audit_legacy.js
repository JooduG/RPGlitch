/**
 * 🕵️ Legacy Svelte Auditor
 * Scans for prohibited Svelte 4 syntax.
 */

import fs from "fs";
import path from "path";

const ROOT_DIR = process.cwd();
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

const BANNED = [
  {
    regex: /export\s+let\s+\w+/,
    msg: "CRITICAL: 'export let' is deprecated. Use '$props()'.",
  },
  {
    regex: /\$:/,
    msg: "CRITICAL: '$:' is deprecated. Use '$derived' or '$effect'.",
  },
  {
    regex: /createEventDispatcher/,
    msg: "CRITICAL: 'createEventDispatcher' is deprecated. Use callback props.",
  },
  {
    regex: /<slot/,
    msg: "WARNING: '<slot>' is deprecated. Use snippets '{@render ...}'.",
  },
  {
    regex: /\$\$props|\$\$restProps/,
    msg: "CRITICAL: '$$props' is banned. Destructure '$props()'.",
  },
];

function scan(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      const BLACKLIST = ["node_modules", ".git", ".svelte-kit", "dist", "build", ".vercel"];
      if (!BLACKLIST.includes(file)) scan(fullPath);
    } else if (file.endsWith(".svelte")) {
      checkFile(fullPath);
    }
  });
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  lines.forEach((line, i) => {
    BANNED.forEach((rule) => {
      if (rule.regex.test(line)) {
        console.log(`${RED}[VIOLATION] ${path.relative(ROOT_DIR, filePath)}:${i + 1}${RESET}`);
        console.log(`  ${rule.msg}`);
        console.log(`  Code: ${line.trim()}\n`);
      }
    });
  });
}

console.log("🔍 Scanning for Svelte 4 Violations...");
scan(path.join(ROOT_DIR, "src"));
