import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * 🕵️ Token Integrity Auditor
 * Verifies that all CSS variables used in the project are defined in engine.css
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve engine.css path relative to this script:
// .agents/skills/css/scripts/token-integrity.js -> ../../../../src/theme/engine.css
const ENGINE_CSS_PATH = path.resolve(__dirname, "../../../../src/theme/engine.css");

let cachedTokens = null;

/**
 * Extracts all defined tokens from engine.css
 * @returns {Set<string>} Set of valid token names
 */
export function getDefinedTokens() {
  if (cachedTokens !== null) return cachedTokens;

  if (!fs.existsSync(ENGINE_CSS_PATH)) {
    console.error(
      `\x1b[31m[ERROR] Token Auditor: engine.css not found at ${ENGINE_CSS_PATH}\x1b[0m`,
    );
    cachedTokens = new Set();
    return cachedTokens;
  }

  try {
    const content = fs.readFileSync(ENGINE_CSS_PATH, "utf-8");
    const tokens = new Set();

    // Matches --token-name: (definitions)
    // We use a more robust regex that ensures we capture the name exactly
    const tokenRegex = /(--[a-zA-Z0-9_-]+)\s*:/g;
    let match;
    while ((match = tokenRegex.exec(content)) !== null) {
      tokens.add(match[1]);
    }

    cachedTokens = tokens;

    // Log a few samples for verification
  } catch (err) {
    console.error(
      `\x1b[31m[ERROR] Token Auditor: Failed to read engine.css: ${err.message}\x1b[0m`,
    );
    cachedTokens = new Set();
  }

  return cachedTokens;
}

/**
 * Validates if a line contains any hallucinated tokens
 * @param {string} line - The line of code to check
 * @returns {string|null} The first invalid token found, or null if all are valid
 */
export function validateLine(line) {
  const defined = getDefinedTokens();
  // Support hyphens and underscores in variable usage
  const varRegex = /var\((--[a-zA-Z0-9_-]+)/g;
  let match;

  while ((match = varRegex.exec(line)) !== null) {
    const token = match[1];
    if (!defined.has(token)) {
      // Quietly return for the auditor, but we could log here if needed for debugging

      return token;
    }
  }

  return null;
}
