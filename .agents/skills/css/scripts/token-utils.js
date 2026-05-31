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

  const entries = css.split("\n").reduce(
    (acc, line, i, lines) => {
      if (acc.skip_until !== null) {
        if (i <= acc.skip_until) {
          return acc;
        }
        acc.skip_until = null;
      }

      const comment_match = line.match(/^\s*\/\*\s*(.*?)\s*\*\//);
      if (comment_match && !comment_match[1].includes("---") && !comment_match[1].includes("===")) {
        acc.last_comment = comment_match[1];
        return acc;
      }

      const token_match = line.match(/^\s*(--[a-zA-Z0-9_-]+)\s*:\s*(.*?)\s*;?$/);
      if (token_match) {
        const name = token_match[1];
        let value = token_match[2].replace(/;$/, "").trim();

        // Handle multi-line values
        if (!line.trim().endsWith(";")) {
          const rest = lines.slice(i + 1);
          const end_index = rest.findIndex((l) => l.trim().endsWith(";"));
          if (end_index !== -1) {
            value +=
              "\n" +
              rest
                .slice(0, end_index + 1)
                .map((l) => l.trim())
                .join("\n");
            value = value.replace(/;$/, "").trim();
            acc.skip_until = i + 1 + end_index;
          }
        }

        acc.tokens.set(name, { value, comment: acc.last_comment });
        acc.last_comment = null;
        return acc;
      }

      return acc;
    },
    { tokens: new Map(), last_comment: null, skip_until: null },
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

    const file_path = path.join(dir, file);
    const stat = fs.statSync(file_path);

    if (stat?.isDirectory()) {
      results.push(...getSourceFiles(file_path, extensions));
    } else if (extensions.includes(path.extname(file))) {
      results.push(file_path);
    }

    return results;
  }, []);
}
