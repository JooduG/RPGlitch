import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PATHS = {
  root: path.resolve(__dirname, "../../../../"),
  src: path.resolve(__dirname, "../../../../src"),
  designMd: process.env.DESIGN_MD_PATH || path.resolve(__dirname, "../../../../DESIGN.md"),
  designCss: process.env.CSS_PATH || path.resolve(__dirname, "../../../../src/media/design.css"),
  jsBridge: process.env.JS_BRIDGE_PATH || path.resolve(__dirname, "../../../../src/media/tokens.js"),
};

export const AUTHORITATIVE_CATEGORIES = ["colors", "typography", "rounded", "spacing", "components"];

/**
 * Classifies a token name into the project's authoritative 5-category system.
 * @param {string} name - The CSS custom property name (without leading --).
 * @param {string} [value] - The raw value assigned to the property.
 * @returns {"colors"|"typography"|"rounded"|"spacing"|"components"} The resolved category.
 */
export function getCategory(name, value = "") {
  const cleanVal = String(value).trim();
  const cleanName = name.trim();

  if (/^color-/.test(cleanName) || /^background-/.test(cleanName) || /-color$/.test(cleanName) || /-color-/.test(cleanName) || /gradient/.test(cleanName) || cleanVal.startsWith("#") || cleanVal.startsWith("rgb") || cleanVal.startsWith("hsl")) {
    return "colors";
  }
  if (/^font-/.test(cleanName)) return "typography";
  if (/^radius-/.test(cleanName) || /-radius$/.test(cleanName)) return "rounded";
  if (/^spacing-/.test(cleanName) || /^gap-/.test(cleanName) || /^padding-/.test(cleanName) || /^margin-/.test(cleanName) || /column/.test(cleanName) || /row/.test(cleanName) || /grid-/.test(cleanName) || cleanName === "auto-resize-buffer") {
    return "spacing";
  }
  return "components";
}

/**
 * Parses DESIGN.md and extracts all defined custom properties from the YAML frontmatter.
 * @returns {Map<string, {value: string}>} Map of token name -> { value }
 */
export function parseDefinedTokens() {
  const tokens = new Map();
  if (!fs.existsSync(PATHS.designMd)) return tokens;

  const content = fs.readFileSync(PATHS.designMd, "utf8");
  const parts = content.split(/^---$/m);
  if (parts.length < 3) return tokens;

  let data = {};
  try {
    data = yaml.load(parts[1]) || {};
  } catch (error) {
    console.error(`[ERROR] Failed to parse DESIGN.md YAML frontmatter: ${error.message}`);
    return tokens;
  }

  /**
   * Recursively walks the frontmatter tree to collect all leaf token values.
   * @param {Record<string, unknown>} obj - The current node in the token tree.
   */
  function traverse(obj) {
    if (!obj || typeof obj !== "object") return;
    Object.entries(obj).forEach(([key, value]) => {
      if (value && typeof value === "object") {
        traverse(value);
      } else {
        tokens.set(`--${key}`, { value: String(value) });
      }
    });
  }

  AUTHORITATIVE_CATEGORIES.forEach((cat) => {
    if (data[cat]) {
      traverse(data[cat]);
    }
  });

  return tokens;
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
