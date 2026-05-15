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
 * Generates design.css and tokens.js from the Sovereign Source (DESIGN.md).
 * Supports bidirectional synchronization.
 */

/**
 * Runs the project formatter to ensure generated files are clean.
 */
function formatGeneratedFiles() {
  try {
    console.log("💅 Formatting generated artifacts...");
    // Only format the specific paths we touched to avoid project-wide lag
    execSync(`npx prettier --write "${CSS_PATH}" "${DESIGN_MD_PATH}" "${JS_BRIDGE_PATH}"`, {
      stdio: "ignore",
    });
  } catch {
    console.warn("⚠️ Warning: Could not run formatter automatically.");
  }
}

const CATEGORY_RULES = [
  { id: "depth", patterns: [/^z-index-/, /-z-index$/, /-z$/] },
  {
    id: "kinetic",
    patterns: [
      /^duration-/,
      /^angle-/,
      /^scale-/,
      /^ease-/,
      /^kinetic-/,
      /^motion-/,
      /^hover-/,
      /^click-/,
    ],
  },
  {
    id: "grid",
    patterns: [/^grid-/, /^column-/, /^columns-/, /^row-/, /^rows-/, /^column$/, /^row$/],
  },
  { id: "filters", patterns: [/^blur-/, /^brightness-/, /^contrast-/, /^saturation-/] },
  { id: "effects", patterns: [/^noise-/, /-noise$/, /^noise-url$/] },
  { id: "breakpoints", patterns: [/^breakpoint-/] },
  { id: "opacity", patterns: [/^opacity-/] },
  {
    id: "components",
    patterns: [
      /^state-/,
      /^toggle-/,
      /^slider-/,
      /^swatch-/,
      /^icon-/,
      /^avatar-/,
      /^modal-/,
      /^skeleton-/,
      /^profile-/,
      /^storyboard-/,
      /^dev-/,
      /^scrollbar-/,
      /^title-/,
      /swatch-/,
    ],
  },
  {
    id: "colors",
    patterns: [/^color-/, /^background-/, /-color$/, /-color-/],
  },
  { id: "typography", patterns: [/^font-/] },
  { id: "spacing", patterns: [/^spacing-/, /^gap-/, /^padding-/, /^auto-resize-buffer$/] },
  { id: "rounded", patterns: [/^radius-/] },
  { id: "borders", patterns: [/^border-/, /-border$/] },
  {
    id: "elevation",
    patterns: [/^shadow-/, /-shadow$/, /-glow$/, /^glass-/, /^elevation-/, /-glow$/],
  },
  {
    id: "layout",
    patterns: [
      /^width-/,
      /^height-/,
      /-width$/,
      /-height$/,
      /-size$/,
      /-max$/,
      /^aspect-square$/,
      /^golden-ratio$/,
    ],
  },
];

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

const TIERS = ["foundations", "semantics", "organisms"];

/**
 * Categorizes a token based on CATEGORY_RULES and its value.
 * Maps to { tier, category }
 */
function getCategoryAndTier(name, value) {
  // 1. Identify category by pattern
  let category = "other";
  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((p) => p.test(name))) {
      category = rule.id;
      break;
    }
  }

  // 1.1 Detect color by value if not caught by pattern (for prefix-less tokens)
  if (
    category === "other" &&
    (value.startsWith("#") || value.startsWith("rgb") || value.startsWith("hsl"))
  ) {
    category = "colors";
  }

  // 2. Assign tier based on category and value
  let tier = "foundations"; // Default

  if (category === "components" || category === "organisms") {
    tier = "organisms";
    category = "components";
  } else if (["borders", "effects", "elevation", "filters", "layout", "depth"].includes(category)) {
    tier = "semantics";
  } else if (category === "colors") {
    // If it's a foundation color primitive (raw hex or named color without var)
    if (value.startsWith("#") || !value.includes("var(")) tier = "foundations";
    else tier = "semantics";
  } else if (category === "spacing") {
    if (/spacing-(unit|pixel|\d+px)/.test(name)) tier = "foundations";
    else tier = "semantics";
  } else if (category === "typography") {
    if (/font-(family|weight|height-base|height-short|height-tall)/.test(name))
      tier = "foundations";
    else tier = "semantics";
  } else if (category === "kinetic") {
    if (/^(duration|ease)-/.test(name)) tier = "foundations";
    else tier = "semantics";
  } else if (category === "grid") {
    if (/^(column-units|row-units|grid-width-min|grid-width-max|grid-height-max)/.test(name))
      tier = "foundations";
    else tier = "semantics";
  } else if (category === "rounded") {
    if (name === "radius-full") tier = "foundations";
    else tier = "semantics";
  } else if (category === "breakpoints" || category === "opacity") {
    tier = "foundations";
  }

  return { tier, category };
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
  const processedTokens = new Set();

  TIERS.forEach((tier) => {
    if (data[tier] && typeof data[tier] === "object") {
      css += `\n  /* ==================== T${TIERS.indexOf(tier) + 1}: ${tier.toUpperCase()} ==================== */\n`;
      Object.entries(data[tier]).forEach(([category, tokens]) => {
        if (!tokens || typeof tokens !== "object") return;
        css += `\n  /* --- ${category.toUpperCase()} --- */\n`;
        Object.entries(tokens)
          .sort()
          .forEach(([name, value]) => {
            processedTokens.add(name);
            if (preservedComments[name]) {
              css += `  /* ${preservedComments[name]} */\n`;
            }
            css += `  --${name}: ${value};\n`;
          });
      });
    }
  });

  // Handle uncategorized tokens that might be in the root of the data
  const otherTokens = {};
  Object.entries(data).forEach(([key, value]) => {
    if (!TIERS.includes(key) && !["name", "version", "description"].includes(key)) {
      if (typeof value !== "object") {
        otherTokens[key] = value;
      } else {
        Object.entries(value).forEach(([subKey, subValue]) => {
          otherTokens[subKey] = subValue;
        });
      }
    }
  });

  if (Object.keys(otherTokens).length > 0) {
    const remaining = Object.entries(otherTokens).filter(([name]) => !processedTokens.has(name));
    if (remaining.length > 0) {
      css += `\n  /* --- UNMAPPED --- */\n`;
      remaining.sort().forEach(([name, value]) => {
        processedTokens.add(name);
        if (preservedComments[name]) {
          css += `  /* ${preservedComments[name]} */\n`;
        }
        css += `  --${name}: ${value};\n`;
      });
    }
  }

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

  // Flatten nested structure
  TIERS.forEach((tier) => {
    if (data[tier] && typeof data[tier] === "object") {
      Object.entries(data[tier]).forEach(([category, categoryTokens]) => {
        if (categoryTokens && typeof categoryTokens === "object") {
          Object.assign(allTokens, categoryTokens);

          // Capture colors for palette constants
          if (category === "colors") {
            Object.entries(categoryTokens).forEach(([name, value]) => {
              // Only include foundation colors (raw hex values)
              if (value.startsWith("#")) {
                const label = name
                  .split("-")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ");
                palette[label] = value;
                paletteVars[value] = `var(--${name})`;
              }
            });
          }
        }
      });
    }
  });

  // Handle root tokens
  Object.entries(data).forEach(([key, value]) => {
    if (!TIERS.includes(key) && !["name", "version", "description"].includes(key)) {
      if (typeof value !== "object") {
        allTokens[key] = value;
      }
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
  const { data, body } = parseDesignDoc(content);

  // Try to extract comments from existing CSS to preserve them if possible
  const metadata = { comments: {} };
  if (fs.existsSync(CSS_PATH)) {
    const oldCss = fs.readFileSync(CSS_PATH, "utf8");
    const lines = oldCss.split("\n");
    let lastComment = null;
    lines.forEach((line) => {
      const commentMatch = line.match(/^\s*\/\* (.*?) \*\//);
      if (commentMatch && !commentMatch[1].startsWith("---")) {
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
  const tieredTokens = {};

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

        const { tier, category } = getCategoryAndTier(name, value);
        if (!tieredTokens[tier]) tieredTokens[tier] = {};
        if (!tieredTokens[tier][category]) tieredTokens[tier][category] = {};
        tieredTokens[tier][category][name] = value;
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

  // Rebuild the tiered structure
  TIERS.forEach((tier) => {
    if (tieredTokens[tier]) {
      newData[tier] = {};
      Object.keys(tieredTokens[tier])
        .sort()
        .forEach((category) => {
          const sortedTokens = {};
          Object.keys(tieredTokens[tier][category])
            .sort()
            .forEach((key) => {
              sortedTokens[key] = tieredTokens[tier][category][key];
            });
          newData[tier][category] = sortedTokens;
        });
    }
  });

  // Rebuild the file
  let yamlStr = yaml.dump(newData, {
    indent: 2,
    lineWidth: -1,
    sortKeys: false, // Maintain tier order
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

// Main Entry Point
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
