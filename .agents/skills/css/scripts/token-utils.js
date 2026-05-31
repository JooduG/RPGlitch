import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PATHS = {
  root: path.resolve(__dirname, "../../../../"),
  src: path.resolve(__dirname, "../../../../src"),
  designMd: process.env.DESIGN_MD_PATH || path.resolve(__dirname, "../../../../DESIGN.md"),
  designCss: process.env.CSS_PATH || path.resolve(__dirname, "../../../../src/media/design.css"),
  jsBridge:
    process.env.JS_BRIDGE_PATH || path.resolve(__dirname, "../../../../src/media/tokens.js"),
};

export const AUTHORITATIVE_CATEGORIES = [
  "colors",
  "typography",
  "rounded",
  "spacing",
  "components",
];

/**
 * Classifies a token name into the project's authoritative 5-category system.
 * @param {string} name - The CSS custom property name (without leading --).
 * @param {string} [value] - The raw value assigned to the property.
 * @returns {"colors"|"typography"|"rounded"|"spacing"|"components"} The resolved category.
 */
export function getCategory(name, value = "") {
  const cleanVal = String(value).trim();
  const cleanName = name.trim();

  if (
    /^color-/.test(cleanName) ||
    /^background-/.test(cleanName) ||
    /-color$/.test(cleanName) ||
    /-color-/.test(cleanName) ||
    /gradient/.test(cleanName) ||
    cleanVal.startsWith("#") ||
    cleanVal.startsWith("rgb") ||
    cleanVal.startsWith("hsl")
  ) {
    return "colors";
  }
  if (/^font-/.test(cleanName)) return "typography";
  if (/^radius-/.test(cleanName) || /-radius$/.test(cleanName)) return "rounded";
  if (
    /^spacing-/.test(cleanName) ||
    /^gap-/.test(cleanName) ||
    /^padding-/.test(cleanName) ||
    /^margin-/.test(cleanName) ||
    /column/.test(cleanName) ||
    /row/.test(cleanName) ||
    /grid-/.test(cleanName) ||
    cleanName === "auto-resize-buffer"
  ) {
    return "spacing";
  }
  return "components";
}

/**
 * Parses design.css and extracts all defined custom properties with their adjacent context comments.
 * @returns {Map<string, {value: string, comment: string|null}>} Map of token name -> value and comment.
 */
export function parseDefinedTokens() {
  if (!fs.existsSync(PATHS.designCss)) return new Map();

  const css = fs.readFileSync(PATHS.designCss, "utf8");

  // Extract block comments and token definitions
  const entries = css.split("\n").reduce(
    (acc, line, i, lines) => {
      const commentMatch = line.match(/^\s*\/\*\s*(.*?)\s*\*\//);
      if (commentMatch && !commentMatch[1].includes("---") && !commentMatch[1].includes("===")) {
        return { ...acc, lastComment: commentMatch[1] };
      }

      const tokenMatch = line.match(/^\s*(--[a-zA-Z0-9_-]+)\s*:\s*(.*?)\s*;?$/);
      if (tokenMatch) {
        const name = tokenMatch[1];
        let value = tokenMatch[2].replace(/;$/, "").trim();

        // Handle multi-line values
        if (!line.trim().endsWith(";")) {
          const rest = lines.slice(i + 1);
          const endIndex = rest.findIndex((l) => l.trim().endsWith(";"));
          if (endIndex !== -1) {
            value +=
              "\n" +
              rest
                .slice(0, endIndex + 1)
                .map((l) => l.trim())
                .join("\n");
            value = value.replace(/;$/, "").trim();
          }
        }

        acc.tokens.set(name, { value, comment: acc.lastComment });
        return { ...acc, lastComment: null };
      }

      return acc;
    },
    { tokens: new Map(), lastComment: null },
  ).tokens;

  return entries;
}

/**
 * Recursively collects all source files under a directory matching given extensions.
 * @param {string} dir - Absolute path to the directory to sweep.
 * @param {string[]} [extensions] - File extensions to include.
 * @returns {string[]} Absolute paths to all matched files.
 */
export function getSourceFiles(dir, extensions = [".svelte", ".js", ".css", ".html"]) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir).reduce((results, file) => {
    if (file === "node_modules" || file === ".git") return results;

    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat?.isDirectory()) {
      return [...results, ...getSourceFiles(filePath, extensions)];
    }

    if (extensions.includes(path.extname(file))) {
      return [...results, filePath];
    }

    return results;
  }, []);
}
