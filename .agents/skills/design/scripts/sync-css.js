import fs from "fs";
import yaml from "js-yaml";
import { PATHS, AUTHORITATIVE_CATEGORIES, getCategory } from "./token-utils.js";

/**
 * Shared header for every generated artifact. It must always state where the
 * file came from so nobody is tempted to edit a generated file by hand.
 * @param {string} rel_path - Workspace-relative path of the generated file.
 * @returns {string}
 */
function generatedHeader(rel_path) {
  return `/* ============================================================================
 * [GENERATED] ${rel_path}
 * DO NOT EDIT DIRECTLY — this file is generated from DESIGN.md by
 * .agents/skills/design/scripts/sync-css.js (npm run sync:css).
 * Hand edits are overwritten on the next sync. Edit DESIGN.md instead.
 * ============================================================================ */`;
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
 * Flattens the DESIGN.md YAML frontmatter into a flat per-category token map,
 * plus the `signatures` list (the canonical vibrant entity colors).
 * @param {Record<string, unknown>} data - The parsed YAML frontmatter object.
 * @returns {Record<string, Record<string, string> | string[]>} Keyed by authoritative category + signatures.
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
      // Top-level frontmatter metadata and the signatures list never become CSS tokens.
      if (obj === data && ["name", "version", "description", "signatures"].includes(key)) return;

      const category = obj === data && AUTHORITATIVE_CATEGORIES.includes(key) ? key : active_category;

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

  const raw_sigs = data.signatures;
  if (Array.isArray(raw_sigs)) {
    result.signatures = raw_sigs.filter((s) => typeof s === "string");
  } else if (raw_sigs && typeof raw_sigs === "object") {
    result.signatures = Object.keys(raw_sigs);
  } else {
    result.signatures = [];
  }
  return result;
}

/**
 * Serializes DESIGN.md into src/media/tokens.js (TOKENS) and
 * src/data/definitions/signature-colors.js (SIGNATURE_COLORS). Both are written
 * in full — there is no hand-maintained section anymore.
 * @param {Record<string, Record<string, string> | string[]>} flat_data - Per-category token map.
 */
function buildJsBridge(flat_data) {
  const tokens = {};
  for (const category of AUTHORITATIVE_CATEGORIES) {
    for (const [name, value] of Object.entries(flat_data[category] || {}).sort()) {
      tokens[name] = value;
    }
  }

  const colors = flat_data.colors || {};
  const signature_names = (flat_data.signatures || [])
    .map((name) => {
      if (!(name in colors)) {
        throw new Error(`[ERROR] signatures lists unknown color token "${name}". Fix DESIGN.md.`);
      }
      if (!String(colors[name]).startsWith("#")) {
        throw new Error(`[ERROR] signature "${name}" must reference a hex color token (got "${colors[name]}"). Fix DESIGN.md.`);
      }
      return name
        .replace(/^color-/, "")
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    })
    .sort();

  const tokens_output = `${generatedHeader("src/media/tokens.js")}\n\nexport const TOKENS = ${JSON.stringify(tokens, null, 2)};\n`;
  fs.writeFileSync(PATHS.jsBridge, tokens_output);

  const signatures_output = `${generatedHeader("src/data/definitions/signature-colors.js")}\n\nexport const SIGNATURE_COLORS = ${JSON.stringify(signature_names, null, 2)};\n`;
  fs.writeFileSync(PATHS.signatureColors, signatures_output);
}

/**
 * Forward sync: reads DESIGN.md frontmatter and writes design.css + tokens.js + signature-colors.js.
 */
export function syncToCss() {
  const { data, body } = parseMarkdownDoc();
  const flat_data = flattenFrontmatter(data);

  const css_header = `${generatedHeader("src/media/design.css")}\n\n@import "tailwindcss";\n@source "../";\n\n@theme {`;

  const css_properties = AUTHORITATIVE_CATEGORIES.map((category) => {
    const category_header = `  /* --- ${category.toUpperCase()} --- */`;
    const entries = Object.entries(flat_data[category]).sort();
    if (entries.length === 0) {
      return category_header;
    }
    const properties = entries.map(([name, value]) => `  --${name}: ${value};`).join("\n");

    return `${category_header}\n${properties}`;
  }).join("\n\n");

  const css_blocks = [...body.matchAll(/```css([\s\S]*?)```/g)].map((m) => m[1].trim()).join("\n\n");

  const css_output = `${css_header}\n${css_properties}\n}\n\n${css_blocks}${css_blocks ? "\n" : ""}`;

  fs.writeFileSync(PATHS.designCss, css_output);
  buildJsBridge(flat_data);
}

if (process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith(".agents/skills/design/scripts/sync-css.js")) {
  syncToCss();
}
