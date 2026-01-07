import fs from "fs";
import path from "path";

const SEARCH_DIR = "src";
// Unused but kept for clarity or future use if extended
// const WARNING_KEYWORD = "console.log";
// const ERROR_KEYWORD = "alert";

let warningCount = 0;
let errorCount = 0;

const EXCLUDE_FILES = [
  path.join("src", "js", "core", "utils.js"),
  path.join("src", "js", "ui", "services", "modals.js"),
];

function scanFile(filePath) {
  // Check if file is excluded (using relative paths for portability)
  if (EXCLUDE_FILES.some((ex) => filePath.includes(ex))) return;

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  // Regex specifically targeting function calls, not within strings or property names
  // and ignoring lines that start with common comment patterns
  const warningRegex = /console\.log\(/;
  const errorRegex = /\balert\(/;
  const commentRegex = /^\s*(\/\/|\*|\/\*)/;

  lines.forEach((line, index) => {
    // Skip logical comments
    if (commentRegex.test(line)) return;

    if (warningRegex.test(line)) {
      console.warn(`[WARNING] Found "console.log" in ${filePath}:${index + 1}`);
      console.warn(`    ${line.trim()}`);
      warningCount++;
    }
    if (errorRegex.test(line)) {
      console.error(`[ERROR] Found "alert" in ${filePath}:${index + 1}`);
      console.error(`    ${line.trim()}`);
      errorCount++;
    }
  });
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    process.exit(1);
  }
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (
      file.endsWith(".js") ||
      file.endsWith(".jsx") ||
      file.endsWith(".ts") ||
      file.endsWith(".tsx")
    ) {
      scanFile(filePath);
    }
  });
}

console.log(`Starting Hygiene Scan in "${SEARCH_DIR}"...`);
walkDir(SEARCH_DIR);

console.log("--- Hygiene Scan Complete ---");
console.log(`Warnings: ${warningCount}`);
console.log(`Errors:   ${errorCount}`);

if (errorCount > 0) {
  console.error(`Hygiene Check Failed! Found ${errorCount} errors.`);
  process.exit(1);
} else {
  console.log("Hygiene Check Passed.");
  process.exit(0);
}
