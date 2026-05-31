import fs from "fs";
import path from "path";
import { PATHS, parseDefinedTokens, getSourceFiles } from "./token-utils.js";

/**
 * Static CSS lint rules applied by the Warden (warden.js --css).
 * @type {Array<{id: string, severity: string, regex: RegExp, message: string, validate?: function}>}
 */
export const cssRules = [
  {
    id: "RAW_COLOR",
    severity: "HERESY",
    regex: /#([0-9A-Fa-f]{3}){1,2}\b|\brgba?\(|\bhsla?\(/,
    message: "❌ Hardcoded color detected. Use Tokens: var(--chalk), etc.",
    validate: (line) =>
      !line.includes("url(") &&
      !line.includes("var(") &&
      !line.includes("hex_to_rgb") &&
      !line.trim().startsWith("/*") &&
      !line.trim().startsWith("*"),
  },
  {
    id: "PIXEL_BORDER",
    severity: "ADVICE",
    regex: /border:\s*[1-9]px/,
    message: "❌ Pixel border detected. Use depth markers like shadows.",
  },
];

/**
 * Extended theme rules applied by the Warden (warden.js --theme).
 * @type {Array<{id: string, severity: string, regex: RegExp, message: string, validate?: function}>}
 */
export const themeRules = [
  ...cssRules,
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

/** Internal HERESY rules used by the full design-auditor scan. */
const COMPILING_LINT_RULES = [
  {
    id: "RAW_COLOR",
    severity: "HERESY",
    regex: /#([0-9A-Fa-f]{3}){1,2}\b|\brgba?\(|\bhsla?\( /i,
    message: "Hardcoded raw color values observed. Route through system variables.",
    validate: (line) =>
      !line.includes("url(") &&
      !line.includes("var(") &&
      !line.includes("hex_to_rgb") &&
      !/^\s*(\/\*|\*)/.test(line),
  },
  {
    id: "PIXEL_BORDER",
    severity: "ADVICE",
    regex: /border:\s*[1-9]px/,
    message: "Direct pixel borders are discouraged. Employ elevation layers or clean borders.",
  },
  {
    id: "THEME_HOVER_TRANSFORM",
    severity: "HERESY",
    regex: /:hover\s*\{[^}]*translateY|:hover\s*\{[^}]*transform:\s*translate/,
    message:
      "Grounded Policy violation: Block translateY shifts on hover to preserve subterranean weight bounds.",
  },
  {
    id: "LEGACY_SPACING_SYNTAX",
    severity: "HERESY",
    regex:
      /\b(margin|padding|gap|row-gap|column-gap|grid-gap|top|bottom|left|right|inset|width|height|min-width|min-height|max-width|max-height|flex-basis)\s*:[^;]*\bvar\(--spacing-[0-9]+\)/i,
    message: "Legacy hardcoded spacing scale used inside structural descriptors. Update rules.",
  },
];

/**
 * Scans all source files for lint rule violations and hallucinated CSS variable references.
 * @returns {number} Count of HERESY-severity failures found.
 */
export function auditCodebaseTokens() {
  const definedMap = parseDefinedTokens();
  const source_files = getSourceFiles(PATHS.src).filter(
    (file) => file !== PATHS.designCss && file !== PATHS.jsBridge,
  );

  let total_failures = 0;

  for (const file of source_files) {
    const rel_path = path.relative(PATHS.root, file);
    const lines = fs.readFileSync(file, "utf8").split("\n");
    const is_test_file = file.endsWith(".test.js") || file.endsWith(".test.ts");

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];

      // 1. Lint Rule Checks
      for (const rule of COMPILING_LINT_RULES) {
        if (rule.regex.test(line) && (typeof rule.validate !== "function" || rule.validate(line))) {
          console.error(
            `\x1b[31m[${rule.severity}] ${rel_path}:${index + 1} - ${rule.message}\x1b[0m`
          );
          if (rule.severity === "HERESY") {
            total_failures++;
          }
        }
      }

      // 2. Token Invalidation Check
      const is_comment_or_doc = /^\s*(\/\/|\*|\/\*)/.test(line);
      if (!is_test_file && !is_comment_or_doc) {
        const var_matches = [...line.matchAll(/var\((--[a-zA-Z0-9_-]+)/g)];
        for (const match of var_matches) {
          const token_name = match[1];
          if (!definedMap.has(token_name)) {
            console.error(
              `\x1b[31m[HERESY] ${rel_path}:${index + 1} - Hallucinated variable reference: ${token_name}\x1b[0m`
            );
            total_failures++;
          }
        }
      }
    }
  }

  return total_failures;
}

/**
 * Identifies CSS custom properties defined in design.css that are never referenced in source files.
 * @returns {string[]} List of unused token names (with leading --).
 */
export function findUnusedTokens() {
  const definedMap = parseDefinedTokens();
  const source_files = getSourceFiles(PATHS.src).filter(
    (f) => f !== PATHS.designCss && f !== PATHS.jsBridge,
  );

  const contents = source_files.map((f) => fs.readFileSync(f, "utf8"));

  return Array.from(definedMap.keys()).filter((token) => {
    const regex = new RegExp(`${token}\\b`);
    return !contents.some((text) => regex.test(text));
  });
}

if (
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith(".agents/skills/css/scripts/design-auditor.js")
) {
  const core_failures = auditCodebaseTokens();
  findUnusedTokens();
  if (core_failures > 0) process.exit(1);
}
