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
  const tokens = new Map();
  if (!fs.existsSync(PATHS.designCss)) return tokens;

  const css = fs.readFileSync(PATHS.designCss, "utf8");
  const lines = css.split("\n");
  let lastComment = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const commentMatch = line.match(/^\s*\/\*\s*(.*?)\s*\*\//);
    if (commentMatch && !commentMatch[1].includes("---") && !commentMatch[1].includes("===")) {
      lastComment = commentMatch[1];
      continue;
    }

    const tokenMatch = line.match(/^\s*(--[a-zA-Z0-9_-]+)\s*:\s*(.*?)\s*;?$/);
    if (tokenMatch) {
      const name = tokenMatch[1];
      let value = tokenMatch[2].replace(/;$/, "").trim();

      if (!line.trim().endsWith(";")) {
        while (i + 1 < lines.length && !value.endsWith(";")) {
          i++;
          value += "\n" + lines[i].trim();
        }
        value = value.replace(/;$/, "").trim();
      }

      tokens.set(name, { value, comment: lastComment });
      lastComment = null;
    }
  }
  return tokens;
}

/**
 * Recursively collects all source files under a directory matching given extensions.
 * @param {string} dir - Absolute path to the directory to sweep.
 * @param {string[]} [extensions] - File extensions to include.
 * @returns {string[]} Absolute paths to all matched files.
 */
export function getSourceFiles(dir, extensions = [".svelte", ".js", ".css", ".html"]) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === "node_modules" || file === ".git") continue;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat?.isDirectory()) {
      results.push(...getSourceFiles(filePath, extensions));
    } else if (extensions.includes(path.extname(file))) {
      results.push(filePath);
    }
  }
  return results;
}
