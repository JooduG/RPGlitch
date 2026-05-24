import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { validateLine } from "./token-integrity.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..", "..", "..", "..");
const SRC_DIR = path.join(ROOT_DIR, "src");

/**
 * Scans a directory recursively for CSS tokens and validates them.
 * @param {string} dir - The directory to scan.
 */
function scan(dir) {
  const items = fs.readdirSync(dir);
  items.forEach((item) => {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      if (item !== "node_modules") scan(fullPath);
    } else if (fullPath.endsWith(".svelte") || fullPath.endsWith(".css")) {
      if (fullPath.endsWith("design.css")) return;
      const content = fs.readFileSync(fullPath, "utf-8");
      const lines = content.split("\n");
      lines.forEach((line, i) => {
        // Enforce strict regular expression check to catch legacy spacing syntax
        // whenever var(--spacing-[0-9]+) appears inside layout descriptors
        const LEGACY_SPACING_REGEX =
          /\b(margin|padding|gap|row-gap|column-gap|grid-gap|top|bottom|left|right|inset|width|height|min-width|min-height|max-width|max-height|flex-basis)\s*:[^;]*\bvar\(--spacing-[0-9]+\)/i;
        if (LEGACY_SPACING_REGEX.test(line)) {
          console.error(
            `\x1b[31m[HERESY] Legacy spacing syntax 'var(--spacing-[0-9])' detected in layout descriptor at ${path.relative(
              ROOT_DIR,
              fullPath,
            )}:${i + 1}\x1b[0m`,
          );
          console.error(`  Line: ${line.trim()}`);
          process.exit(1);
        }

        const invalidToken = validateLine(line);
        if (invalidToken) {
          console.log(`[INVALID] ${path.relative(ROOT_DIR, fullPath)}:${i + 1} - ${invalidToken}`);
        }
      });
    }
  });
}

// Main entry block for manual token scanning
if (process.argv[1] && process.argv[1].endsWith("scan-tokens.js")) {
  console.log("Scanning project for hallucinated tokens...");
  scan(SRC_DIR);
  console.log("Scan complete.");
}
