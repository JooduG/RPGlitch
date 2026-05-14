import fs from "fs";
import path from "path";
import yaml from "js-yaml";

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
  { id: "colors", patterns: [/^color-/, /^background-/, /-color$/, /-color-/] },
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

const ORDERED_CATEGORIES = CATEGORY_RULES.map((r) => r.id);

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
 * Categorizes a token based on CATEGORY_RULES.
 */
function getCategory(name) {
  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((p) => p.test(name))) {
      return rule.id;
    }
  }
  return "other";
}

/**
 * Generates the full CSS content.
 */
function generateCSS(data, cssPatterns, metadata = {}) {
  let css = `/* ============================================================================
 * [GENERATED] src/theme/design.css
 * DO NOT EDIT DIRECTLY. Sovereign Source: DESIGN.md
 * ============================================================================ */

:root {
`;

  const preservedComments = metadata.comments || {};
  const processedTokens = new Set();

  for (const cat of ORDERED_CATEGORIES) {
    const tokens = data[cat];
    if (!tokens || typeof tokens !== "object") continue;

    css += `  /* --- ${cat.toUpperCase()} --- */\n`;
    Object.entries(tokens)
      .sort()
      .forEach(([name, value]) => {
        processedTokens.add(name);
        if (preservedComments[name]) {
          css += `  /* ${preservedComments[name]} */\n`;
        }
        css += `  --${name}: ${value};\n`;
      });
    css += `\n`;
  }

  // Handle uncategorized tokens that might be in the root of the data
  const otherTokens = {};
  Object.entries(data).forEach(([key, value]) => {
    // If it's not a known category and not a known metadata field, it's an uncategorized token
    if (!ORDERED_CATEGORIES.includes(key) && !["name", "version", "description"].includes(key)) {
      if (typeof value !== "object") {
        otherTokens[key] = value;
      } else {
        // It's an object but not a recognized category. We'll still treat its entries as tokens.
        Object.entries(value).forEach(([subKey, subValue]) => {
          otherTokens[subKey] = subValue;
        });
      }
    }
  });

  if (Object.keys(otherTokens).length > 0) {
    css += `  /* --- OTHER --- */\n`;
    Object.entries(otherTokens)
      .sort()
      .forEach(([name, value]) => {
        if (!processedTokens.has(name)) {
          processedTokens.add(name);
          if (preservedComments[name]) {
            css += `  /* ${preservedComments[name]} */\n`;
          }
          css += `  --${name}: ${value};\n`;
        }
      });
    css += `\n`;
  }

  css += `}\n\n`;
  css += `/* --- T4: Realization (Patterns & Resets) --- */\n\n`;
  css += cssPatterns;

  return css;
}

/**
 * Generates the JS Bridge.
 */
function generateJSBridge(data) {
  const allTokens = {};

  // Collect all tokens including uncategorized ones
  for (const cat of ORDERED_CATEGORIES) {
    if (data[cat] && typeof data[cat] === "object") {
      Object.assign(allTokens, data[cat]);
    }
  }

  Object.entries(data).forEach(([key, value]) => {
    if (typeof value !== "object" && !["name", "version", "description"].includes(key)) {
      allTokens[key] = value;
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
  const tokens = {};
  const comments = [];

  // Extract tokens and comments from :root block
  const rootMatch = cssContent.match(/:root\s*\{([\s\S]*?)\}/);
  if (rootMatch) {
    const lines = rootMatch[1].split("\n");
    let currentLine = 0;
    while (currentLine < lines.length) {
      const line = lines[currentLine];

      const commentMatch = line.match(/\/\* (.*?) \*\//);
      if (commentMatch && !commentMatch[1].startsWith("---")) {
        comments.push(commentMatch[1]);
      }

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

        const category = getCategory(name);
        if (!tokens[category]) tokens[category] = {};
        tokens[category][name] = value;
      }
      currentLine++;
    }
  }

  const originalMd = fs.existsSync(DESIGN_MD_PATH)
    ? fs.readFileSync(DESIGN_MD_PATH, "utf8")
    : "# Design\n";
  const { data: originalData, body } = parseDesignDoc(originalMd);

  // Update original data with new tokens, maintaining non-token metadata
  const newData = { ...originalData };

  // Clear old categories and replace with new tokens to handle deletions
  ORDERED_CATEGORIES.forEach((cat) => delete newData[cat]);
  if (newData.other) delete newData.other;

  // Re-insert categorized tokens in sorted order
  Object.keys(tokens)
    .sort()
    .forEach((cat) => {
      const sortedTokens = {};
      Object.keys(tokens[cat])
        .sort()
        .forEach((key) => {
          sortedTokens[key] = tokens[cat][key];
        });
      newData[cat] = sortedTokens;
    });

  // Rebuild the file
  let yamlStr = yaml.dump(newData, {
    indent: 2,
    lineWidth: -1,
    sortKeys: true,
    quotingType: '"',
    forceQuotes: false,
  });

  // Fix up formatting for test expectations
  yamlStr = yamlStr.replace(/: '(#.*?)'/g, ': "$1"');
  yamlStr = yamlStr.replace(/: '(\d+px)'/g, ': "$1"');
  yamlStr = yamlStr.replace(/: '(\d+)'/g, ': "$1"');

  let finalMd = `---\n${yamlStr}---\n\n`;

  if (comments.length > 0) {
    const uniqueComments = comments.filter((c) => !body.includes(c) && !yamlStr.includes(c));
    if (uniqueComments.length > 0) {
      finalMd += "> " + uniqueComments.join("\n> ") + "\n\n";
    }
  }
  finalMd += body;

  fs.writeFileSync(DESIGN_MD_PATH, finalMd);
  console.log("✅ Updated DESIGN.md frontmatter.");

  generateJSBridge(newData);
}

/**
 * Main Entry Point
 */
function main() {
  const args = process.argv.slice(2);
  if (args.includes("--from-css")) {
    syncFromCSS();
  } else {
    // Default to --to-css
    syncToCSS();
  }
  console.log("✨ Synchronization Complete.");
}

main();
