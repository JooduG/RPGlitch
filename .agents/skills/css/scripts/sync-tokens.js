import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { execSync } from "child_process";

const CSS_PATH = process.env.CSS_PATH || path.join(process.cwd(), "src", "theme", "design.css");
const DESIGN_MD_PATH = process.env.DESIGN_MD_PATH || path.join(process.cwd(), "DESIGN.md");
const JS_BRIDGE_PATH =
  process.env.JS_BRIDGE_PATH || path.join(process.cwd(), "src", "theme", "tokens.js");

/**
 * 🎨 The Weaver (sync-tokens.js)
 * ----------------------------
 * The absolute synchronization engine for the Chalk Regime.
 * Generates design.css and tokens.js from the Sovereign Source (DESIGN.md)
 * using the flattened, 5-category design system spec.
 * Supports bidirectional synchronization.
 */

const ROOT_CATEGORIES = ["colors", "typography", "rounded", "spacing", "components"];

/**
 * Runs the project formatter to ensure generated files are clean.
 */
function formatGeneratedFiles() {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    console.log("💅 Skipping formatting in test environment.");
    return;
  }
  try {
    console.log("💅 Formatting generated artifacts...");
    execSync(`npx prettier --write "${CSS_PATH}" "${DESIGN_MD_PATH}" "${JS_BRIDGE_PATH}"`, {
      stdio: "ignore",
    });
  } catch {
    console.warn("⚠️ Warning: Could not run formatter automatically.");
  }
}

/**
 * Parses DESIGN.md into data (frontmatter) and body.
 */
function parseDesignDoc(content) {
  const parts = content.split(/^---$/m);
  if (parts.length < 3) return { data: {}, body: content };

  try {
    const data = yaml.load(parts[1]) || {};
    const body = parts.slice(2).join("---").trim();
    return { data, body };
  } catch (e) {
    console.error("❌ YAML Parse Error:", e.message);
    return { data: {}, body: content };
  }
}

/**
 * Extracts CSS blocks from markdown body.
 */
function extractCSSBlocks(body) {
  const regex = /```css([\s\S]*?)```/g;
  let match;
  let cssBlocks = [];
  while ((match = regex.exec(body)) !== null) {
    cssBlocks.push(match[1].trim());
  }
  return cssBlocks.join("\n\n");
}

/**
 * Categorizes a token into one of our 5 root categories.
 * @param {string} name
 * @param {string} value
 * @returns {"colors" | "typography" | "rounded" | "spacing" | "components"}
 */
function getCategory(name, value) {
  const cleanValue = String(value || "").trim();

  // 1. Colors
  if (
    /^color-/.test(name) ||
    /^background-/.test(name) ||
    /-color$/.test(name) ||
    /-color-/.test(name) ||
    /gradient/.test(name) ||
    cleanValue.startsWith("#") ||
    cleanValue.startsWith("rgb") ||
    cleanValue.startsWith("hsl")
  ) {
    return "colors";
  }

  // 2. Typography
  if (/^font-/.test(name)) {
    return "typography";
  }

  // 3. Rounded
  if (/^radius-/.test(name) || /-radius$/.test(name)) {
    return "rounded";
  }

  // 4. Spacing
  if (
    /^spacing-/.test(name) ||
    /^gap-/.test(name) ||
    /^padding-/.test(name) ||
    /^margin-/.test(name) ||
    /column/.test(name) ||
    /row/.test(name) ||
    /grid-width/.test(name) ||
    /grid-height/.test(name) ||
    name === "auto-resize-buffer"
  ) {
    return "spacing";
  }

  // 5. Components (Default / Everything else)
  return "components";
}

/**
 * Recursively flattens any nested frontmatter structure and maps all key-value
 * pairs into the 5 authoritative categories of the Chalk Regime.
 */
function flattenAndCategorize(data) {
  const result = {
    colors: {},
    typography: {},
    rounded: {},
    spacing: {},
    components: {},
  };

  /**
   *
   */
  function traverse(obj, currentCategory = null) {
    if (!obj || typeof obj !== "object") return;

    for (const [key, value] of Object.entries(obj)) {
      // Skip top-level metadata
      if (obj === data && ["name", "version", "description"].includes(key)) {
        continue;
      }

      // If it's one of the root categories at the top level, enforce that category
      let category = currentCategory;
      if (obj === data && ROOT_CATEGORIES.includes(key)) {
        category = key;
      }

      if (value && typeof value === "object") {
        traverse(value, category);
      } else {
        const resolvedCategory = category || getCategory(key, value);
        result[resolvedCategory][key] = value;
      }
    }
  }

  traverse(data);
  return result;
}

/**
 * Generates the full CSS content.
 */
function generateCSS(data, cssPatterns, metadata = {}) {
  let css = `/* ============================================================================
 * [GENERATED] src/theme/design.css
 * DO NOT EDIT DIRECTLY. Sovereign Source: DESIGN.md
 * ============================================================================ */

:root {`;

  const preservedComments = metadata.comments || {};

  ROOT_CATEGORIES.forEach((category) => {
    if (data[category] && typeof data[category] === "object") {
      css += `\n  /* --- ${category.toUpperCase()} --- */\n`;
      Object.entries(data[category])
        .sort()
        .forEach(([name, value]) => {
          if (preservedComments[name]) {
            css += `  /* ${preservedComments[name]} */\n`;
          }
          css += `  --${name}: ${value};\n`;
        });
    }
  });

  css += `}\n\n`;
  css += cssPatterns;
  if (!css.endsWith("\n")) css += "\n";

  return css;
}

/**
 * Generates the JS Bridge.
 */
function generateJSBridge(data) {
  const allTokens = {};
  const palette = {};
  const paletteVars = {};

  ROOT_CATEGORIES.forEach((category) => {
    if (data[category] && typeof data[category] === "object") {
      Object.entries(data[category]).forEach(([name, value]) => {
        allTokens[name] = value;

        // Capture colors for palette constants
        if (category === "colors") {
          // Only include foundation colors (raw hex values)
          if (typeof value === "string" && value.startsWith("#")) {
            const label = name
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
            palette[label] = value;
            paletteVars[value] = `var(--${name})`;
          }
        }
      });
    }
  });

  // Sort keys for stability
  const sortedTokens = {};
  Object.keys(allTokens)
    .sort()
    .forEach((key) => {
      sortedTokens[key] = allTokens[key];
    });

  const content = `/* ============================================================================
 * [GENERATED] src/theme/tokens.js
 * DO NOT EDIT DIRECTLY. Sync via 'npm run sync:design'.
 * ============================================================================ */

export const TOKENS = ${JSON.stringify(sortedTokens, null, 2)};

export const PALETTE = ${JSON.stringify(palette, null, 2)};

export const PALETTE_VARS = ${JSON.stringify(paletteVars, null, 2)};
`;

  fs.writeFileSync(JS_BRIDGE_PATH, content);
  console.log("✅ Generated src/theme/tokens.js");
}

/**
 * Synchronizes from MD to CSS (Default behavior).
 */
function syncToCSS() {
  console.log("🔄 Syncing DESIGN.md -> design.css...");

  if (!fs.existsSync(DESIGN_MD_PATH)) {
    console.error("❌ Error: DESIGN.md not found at", DESIGN_MD_PATH);
    process.exit(1);
  }

  const content = fs.readFileSync(DESIGN_MD_PATH, "utf8");
  const { data: rawData, body } = parseDesignDoc(content);
  const data = flattenAndCategorize(rawData);

  // Try to extract comments from existing CSS to preserve them if possible
  const metadata = { comments: {} };
  if (fs.existsSync(CSS_PATH)) {
    const oldCss = fs.readFileSync(CSS_PATH, "utf8");
    const lines = oldCss.split("\n");
    let lastComment = null;
    lines.forEach((line) => {
      const commentMatch = line.match(/^\s*\/\* (.*?) \*\//);
      if (commentMatch && !commentMatch[1].includes("---") && !commentMatch[1].includes("===")) {
        lastComment = commentMatch[1];
      } else if (lastComment) {
        const tokenMatch = line.match(/^\s*--([\w-]+):/);
        if (tokenMatch) {
          metadata.comments[tokenMatch[1]] = lastComment;
        }
        lastComment = null;
      }
    });
  }

  const cssPatterns = extractCSSBlocks(body);
  const finalCSS = generateCSS(data, cssPatterns, metadata);

  fs.writeFileSync(CSS_PATH, finalCSS);
  console.log("✅ Generated src/theme/design.css");

  generateJSBridge(data);

  formatGeneratedFiles();
}

/**
 * Synchronizes from CSS back to MD.
 */
function syncFromCSS() {
  console.log("🔄 Syncing design.css -> DESIGN.md...");

  if (!fs.existsSync(CSS_PATH)) {
    console.error("❌ Error: design.css not found at", CSS_PATH);
    process.exit(1);
  }

  const cssContent = fs.readFileSync(CSS_PATH, "utf8");
  const categoryTokens = {};

  // Extract tokens and comments from :root block
  const rootMatch = cssContent.match(/:root\s*\{([\s\S]*?)\}/);
  if (rootMatch) {
    const lines = rootMatch[1].split("\n");
    let currentLine = 0;
    while (currentLine < lines.length) {
      const line = lines[currentLine];

      const match = line.match(/^\s*--([\w-]+):\s*(.*?)\s*$/);
      if (match) {
        const name = match[1];
        let value = match[2];

        // Handle multiline or complex values ending with ;
        if (!value.endsWith(";")) {
          while (currentLine + 1 < lines.length && !value.endsWith(";")) {
            currentLine++;
            value += "\n" + lines[currentLine].trim();
          }
        }
        value = value.replace(/;$/, "").trim();

        const category = getCategory(name, value);
        if (!categoryTokens[category]) categoryTokens[category] = {};
        categoryTokens[category][name] = value;
      }
      currentLine++;
    }
  }

  const originalMd = fs.existsSync(DESIGN_MD_PATH)
    ? fs.readFileSync(DESIGN_MD_PATH, "utf8")
    : "# Design\n";
  const { data: originalData, body } = parseDesignDoc(originalMd);

  // Update original data with new tokens
  const newData = { ...originalData };

  // Rebuild the flat structure
  ROOT_CATEGORIES.forEach((category) => {
    if (categoryTokens[category]) {
      newData[category] = {};
      Object.keys(categoryTokens[category])
        .sort()
        .forEach((key) => {
          newData[category][key] = categoryTokens[category][key];
        });
    }
  });

  // Rebuild the file
  let yamlStr = yaml.dump(newData, {
    indent: 2,
    lineWidth: -1,
    sortKeys: false, // Maintain root order
    quotingType: '"',
    forceQuotes: false,
  });

  // Fix up formatting for test expectations
  yamlStr = yamlStr.replace(/: '(#.*?)'/g, ': "$1"');
  yamlStr = yamlStr.replace(/: '(\d+px)'/g, ': "$1"');
  yamlStr = yamlStr.replace(/: '(\d+)'/g, ': "$1"');

  const finalMd = `---\n${yamlStr}---\n\n${body}`;

  fs.writeFileSync(DESIGN_MD_PATH, finalMd);
  console.log("✅ Updated DESIGN.md frontmatter.");

  generateJSBridge(newData);

  formatGeneratedFiles();
}

/**
 * Main Entry Point for CLI execution.
 */
export function main() {
  const args = process.argv.slice(2);
  if (args.includes("--from-css")) {
    syncFromCSS();
  } else {
    // Default to --to-css
    syncToCSS();
  }
  console.log("✨ Synchronization Complete.");
}

if (process.argv[1] && process.argv[1].endsWith("sync-tokens.js")) {
  main();
}

export { syncToCSS, syncFromCSS };
