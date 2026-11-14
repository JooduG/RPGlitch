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
 * Parses DESIGN.md and extracts all defined custom properties from the YAML frontmatter.
 * @returns {Map<string, {value: string}>} Map of token name -> { value }
 */
/**
 * Resolves `{category.token}` references to CSS `var(--token)` syntax.
 * @param {unknown} raw_value - Raw YAML token value.
 * @returns {string} CSS-ready token value.
 */
export function resolveTokenValue(raw_value) {
  return String(raw_value).replace(/\{[a-zA-Z0-9_-]+\.([a-zA-Z0-9_-]+)\}/g, "var(--$1)");
}

/**
 * Loads and parses the YAML frontmatter block from DESIGN.md.
 * Throws on missing file, missing delimiters, or YAML syntax errors.
 * @returns {Record<string, unknown>} Parsed frontmatter object.
 */
function loadDesignFrontmatter() {
  if (!fs.existsSync(PATHS.designMd)) {
    throw new Error(`[ERROR] DESIGN.md not found at ${PATHS.designMd}.`);
  }

  const content = fs.readFileSync(PATHS.designMd, "utf8");
  const parts = content.split(/^---$/m);
  if (parts.length < 3) {
    throw new Error(`[ERROR] DESIGN.md (${PATHS.designMd}) is missing YAML frontmatter delimiters (---).`);
  }

  try {
    const parsed = yaml.load(parts[1]);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Parsed frontmatter is not a YAML mapping object.");
    }
    return parsed;
  } catch (error) {
    throw new Error(`[ERROR] Failed to parse DESIGN.md YAML frontmatter: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
}

export function parseDefinedTokens() {
  const tokens = new Map();
  const frontmatter_data = loadDesignFrontmatter();

  /**
   * Recursively walks a frontmatter branch to collect CSS token definitions.
   * @param {Record<string, unknown>} branch - The current node in the token tree.
   */
  function traverse(branch) {
    if (!branch || typeof branch !== "object") return;
    Object.entries(branch).forEach(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        if (Object.hasOwn(value, "fontFamily")) {
          tokens.set(`--${key}`, { value: resolveTokenValue(value.fontFamily) });
        } else {
          traverse(value);
        }
      } else if (value !== undefined && value !== null) {
        tokens.set(`--${key}`, { value: resolveTokenValue(value) });
      }
    });
  }

  for (const category_name of new Set([...AUTHORITATIVE_CATEGORIES, "theme"])) {
    if (frontmatter_data[category_name]) {
      traverse(frontmatter_data[category_name]);
    }
  }

  return tokens;
}

/**
 * Parses declared signature color identifiers from DESIGN.md frontmatter.
 * @returns {Set<string>} Set of `--color-*` signature CSS variable names.
 */
export function parseSignatureTokens() {
  const frontmatter_data = loadDesignFrontmatter();
  if (!Array.isArray(frontmatter_data.signatures)) return new Set();

  return new Set(
    frontmatter_data.signatures
      .filter((entry) => typeof entry === "string" && entry.trim().length > 0)
      .map((entry) => (entry.startsWith("--") ? entry : `--${entry}`)),
  );
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
