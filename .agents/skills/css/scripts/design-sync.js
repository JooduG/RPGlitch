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
   * @param {string|null} active_category
   */
  function traverse(obj, active_category = null) {
    if (!obj || typeof obj !== "object") return;

    Object.entries(obj).forEach(([key, value]) => {
      if (obj === data && ["name", "version", "description"].includes(key)) return;

      const category =
        obj === data && AUTHORITATIVE_CATEGORIES.includes(key) ? key : active_category;

      if (value && typeof value === "object") {
        traverse(value, category);
      } else {
        const target_category = category || getCategory(key, value);
        if (result[target_category]) {
          result[target_category][key] = value;
        } else {
          console.error(`[ERROR] Unknown category "${target_category}" for token "${key}"`);
        }
      }
    });
  }
  traverse(data);
  return result;
}

/**
 * Serializes the flat token data into src/media/tokens.js (TOKENS, PALETTE, PALETTE_VARS).
 * @param {Record<string, Record<string, string>>} flat_data - Per-category token map.
 */
function buildJsBridge(flat_data) {
  const { tokens, palette, palette_vars } = AUTHORITATIVE_CATEGORIES.reduce(
    (acc, category) => {
      Object.entries(flat_data[category] || {})
        .sort()
        .forEach(([name, value]) => {
          acc.tokens[name] = value;
          if (category === "colors" && typeof value === "string" && value.startsWith("#")) {
            const label = name
              .split("-")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");
            acc.palette[label] = value;
            acc.palette_vars[value] = `var(--${name})`;
          }
        });
      return acc;
    },
    { tokens: {}, palette: {}, palette_vars: {} },
  );

  const output = `/* ============================================================================
 * [GENERATED] src/media/tokens.js
 * DO NOT EDIT DIRECTLY. Sync via 'npm run sync:design'.
 * ============================================================================ */

export const TOKENS = ${JSON.stringify(tokens, null, 2)};

export const PALETTE = ${JSON.stringify(palette, null, 2)};

export const PALETTE_VARS = ${JSON.stringify(palette_vars, null, 2)};\n`;

  fs.writeFileSync(PATHS.jsBridge, output);
}

/**
 * Forward sync: reads DESIGN.md frontmatter and writes design.css + tokens.js.
 */
export function syncToCss() {
  const { data, body } = parseMarkdownDoc();
  const flat_data = flattenFrontmatter(data);
  const preserved_comments = parseDefinedTokens();

  const css_header = `/* ============================================================================
 * [GENERATED] src/media/design.css
 * DO NOT EDIT DIRECTLY. Sovereign Source: DESIGN.md
 * ============================================================================ */\n\n:root {`;

  const css_properties = AUTHORITATIVE_CATEGORIES.map((category) => {
    const category_header = `  /* --- ${category.toUpperCase()} --- */`;
    const entries = Object.entries(flat_data[category]).sort();
    if (entries.length === 0) {
      return category_header;
    }
    const properties = entries
      .map(([name, value]) => {
        const cached = preserved_comments.get(`--${name}`);
        const comment_str = cached?.comment ? `  /* ${cached.comment} */\n` : "";
        return `${comment_str}  --${name}: ${value};`;
      })
      .join("\n");

    return `${category_header}\n${properties}`;
  }).join("\n\n");

  const css_blocks = [...body.matchAll(/```css([\s\S]*?)```/g)]
    .map((m) => m[1].trim())
    .join("\n\n");

  const css_output = `${css_header}\n${css_properties}\n}\n\n${css_blocks}${css_blocks ? "\n" : ""}`;

  fs.writeFileSync(PATHS.designCss, css_output);
  buildJsBridge(flat_data);
  runFormatter();
}

/**
 * Reverse sync: reads design.css custom properties and back-populates DESIGN.md frontmatter.
 */
export function syncFromCss() {
  const definedTokens = parseDefinedTokens();

  const category_tokens = Array.from(definedTokens.entries()).reduce(
    (acc, [rawName, { value }]) => {
      const name = rawName.slice(2);
      const category = getCategory(name, value);
      if (acc[category]) {
        acc[category][name] = value;
      } else {
        console.error(`[ERROR] Unknown category "${category}" for token "${name}"`);
      }
      return acc;
    },
    Object.fromEntries(AUTHORITATIVE_CATEGORIES.map((cat) => [cat, {}])),
  );

  const { data: old_data, body } = parseMarkdownDoc();

  const new_data = AUTHORITATIVE_CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = Object.keys(category_tokens[cat]).length
        ? Object.fromEntries(Object.entries(category_tokens[cat]).sort(([a], [b]) => a.localeCompare(b)))
        : undefined;
      return acc;
    },
    { ...old_data },
  );

  const yaml_str = yaml
    .dump(new_data, { indent: 2, lineWidth: -1, sortKeys: false, quotingType: '"' })
    .replace(/: '(#.*?)'/g, ': "$1"')
    .replace(/: '(\d+px)'/g, ': "$1"')
    .replace(/: '(\d+)'/g, ': "$1"');

  fs.writeFileSync(PATHS.designMd, `---\n${yaml_str}---\n\n${body}`);
  buildJsBridge(category_tokens);
  runFormatter();
}

if (
  process.argv[1] &&
  process.argv[1].replace(/\\/g, "/").endsWith(".agents/skills/css/scripts/design-sync.js")
) {
  process.argv.includes("--from-css") ? syncFromCss() : syncToCss();
}
