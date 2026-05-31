import fs from "fs";
import yaml from "js-yaml";
import { execSync } from "child_process";
import { PATHS, AUTHORITATIVE_CATEGORIES, getCategory, parseDefinedTokens } from "./token-utils.js";

/**
 * Runs Prettier over the three generated design artifacts.
 * Skipped automatically during test runs via VITEST env flag.
 */
function runFormatter() {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) return;
  try {
    execSync(`npx prettier --write "${PATHS.designCss}" "${PATHS.designMd}" "${PATHS.jsBridge}"`, {
      stdio: "ignore",
    });
  } catch {
    console.warn("⚠️ Formatting skip encountered.");
  }
}

/**
 * Reads and parses DESIGN.md, splitting YAML frontmatter from the markdown body.
 * @returns {{data: Record<string, unknown>, body: string}}
 */
function parseMarkdownDoc() {
  const content = fs.readFileSync(PATHS.designMd, "utf8");
  const parts = content.split(/^---$/m);
  if (parts.length < 3) return { data: {}, body: content };
  try {
    return { data: yaml.load(parts[1]) || {}, body: parts.slice(2).join("---").trim() };
  } catch {
    return { data: {}, body: content };
  }
}

/**
 * Flattens the DESIGN.md YAML frontmatter into a flat per-category token map.
 * @param {Record<string, unknown>} data - The parsed YAML frontmatter object.
 * @returns {Record<string, Record<string, string>>} Keyed by authoritative category.
 */
function flattenFrontmatter(data) {
  const result = Object.fromEntries(AUTHORITATIVE_CATEGORIES.map((cat) => [cat, {}]));
  /**
   * Recursively walks the frontmatter tree, routing leaf values into their category bucket.
   * @param {Record<string, unknown>} obj
   * @param {string|null} activeCategory
   */
  function traverse(obj, activeCategory = null) {
    if (!obj || typeof obj !== "object") return;
    for (const [key, value] of Object.entries(obj)) {
      if (obj === data && ["name", "version", "description"].includes(key)) continue;
      let category = obj === data && AUTHORITATIVE_CATEGORIES.includes(key) ? key : activeCategory;
      if (value && typeof value === "object") {
        traverse(value, category);
      } else {
        const targetCategory = category || getCategory(key, value);
        result[targetCategory][key] = value;
      }
    }
  }
  traverse(data);
  return result;
}

/**
 * Serializes the flat token data into src/media/tokens.js (TOKENS, PALETTE, PALETTE_VARS).
 * @param {Record<string, Record<string, string>>} flatData - Per-category token map.
 */
function buildJsBridge(flatData) {
  const tokens = {};
  const palette = {};
  const paletteVars = {};

  AUTHORITATIVE_CATEGORIES.forEach((category) => {
    Object.entries(flatData[category] || {})
      .sort()
      .forEach(([name, value]) => {
        tokens[name] = value;
        if (category === "colors" && typeof value === "string" && value.startsWith("#")) {
          const label = name
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
          palette[label] = value;
          paletteVars[value] = `var(--${name})`;
        }
      });
  });

  const output = `/* ============================================================================
 * [GENERATED] src/media/tokens.js
 * DO NOT EDIT DIRECTLY. Sync via 'npm run sync:design'.
 * ============================================================================ */

export const TOKENS = ${JSON.stringify(tokens, null, 2)};

export const PALETTE = ${JSON.stringify(palette, null, 2)};

export const PALETTE_VARS = ${JSON.stringify(paletteVars, null, 2)};\n`;

  fs.writeFileSync(PATHS.jsBridge, output);
}

/**
 * Forward sync: reads DESIGN.md frontmatter and writes design.css + tokens.js.
 */
export function syncToCss() {
  const { data, body } = parseMarkdownDoc();
  const flatData = flattenFrontmatter(data);
  const preservedComments = parseDefinedTokens();

  let cssOutput = `/* ============================================================================
 * [GENERATED] src/media/design.css
 * DO NOT EDIT DIRECTLY. Sovereign Source: DESIGN.md
 * ============================================================================ */\n\n:root {`;

  AUTHORITATIVE_CATEGORIES.forEach((category) => {
    cssOutput += `\n  /* --- ${category.toUpperCase()} --- */\n`;
    Object.entries(flatData[category])
      .sort()
      .forEach(([name, value]) => {
        const cached = preservedComments.get(`--${name}`);
        if (cached?.comment) cssOutput += `  /* ${cached.comment} */\n`;
        cssOutput += `  --${name}: ${value};\n`;
      });
  });

  cssOutput += `}\n\n`;
  const cssBlocks = [...body.matchAll(/```css([\s\S]*?)```/g)].map((m) => m[1].trim()).join("\n\n");
  cssOutput += cssBlocks + (cssBlocks ? "\n" : "");

  fs.writeFileSync(PATHS.designCss, cssOutput);
  buildJsBridge(flatData);
  runFormatter();
}

/**
 * Reverse sync: reads design.css custom properties and back-populates DESIGN.md frontmatter.
 */
export function syncFromCss() {
  const definedTokens = parseDefinedTokens();
  const categoryTokens = Object.fromEntries(AUTHORITATIVE_CATEGORIES.map((cat) => [cat, {}]));

  for (const [rawName, { value }] of definedTokens.entries()) {
    const name = rawName.slice(2);
    const category = getCategory(name, value);
    categoryTokens[category][name] = value;
  }

  const { data: oldData, body } = parseMarkdownDoc();
  const newData = { ...oldData };

  AUTHORITATIVE_CATEGORIES.forEach((cat) => {
    newData[cat] = Object.keys(categoryTokens[cat]).length
      ? Object.fromEntries(Object.entries(categoryTokens[cat]).sort())
      : undefined;
  });

  let yamlStr = yaml
    .dump(newData, { indent: 2, lineWidth: -1, sortKeys: false, quotingType: '"' })
    .replace(/: '(#.*?)'/g, ': "$1"')
    .replace(/: '(\d+px)'/g, ': "$1"')
    .replace(/: '(\d+)'/g, ': "$1"');

  fs.writeFileSync(PATHS.designMd, `---\n${yamlStr}---\n\n${body}`);
  buildJsBridge(categoryTokens);
  runFormatter();
}

if (
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith(".agents/skills/css/scripts/design-sync.js")
) {
  process.argv.includes("--from-css") ? syncFromCss() : syncToCss();
}
