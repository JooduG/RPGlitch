import fs from "fs";
import ignore from "ignore";
import path from "path";
import { PATHS, getSourceFiles, parseDefinedTokens } from "./token-utils.js";

const ROOT_DIR = process.cwd();
const SRC_DIR = path.join(ROOT_DIR, "src");

// Load gitignore for standard ignores
const ig = ignore();
const gitignorePath = path.join(ROOT_DIR, ".gitignore");
if (fs.existsSync(gitignorePath)) {
  ig.add(fs.readFileSync(gitignorePath, "utf-8"));
}

const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";

const themeRules = [
  {
    id: "THEME_HOVER_TRANSFORM",
    severity: "HERESY",
    regex: /:hover\s*\{[^}]*translateY|:hover\s*\{[^}]*transform:\s*translate/,
    message: "❌ Rule 04 violation: GROUNDED POLICY. Avoid translateY on hover to maintain subterranean weight.",
  },
  {
    id: "THEME_RADIUS",
    severity: "ADVICE",
    regex: /border-radius:\s*[0-9]+px/,
    message: "❌ Hardcoded border-radius. Use Tokens: var(--border-radius-m), etc.",
  },
  {
    id: "PIXEL_BORDER",
    severity: "ADVICE",
    regex: /border:\s*[1-9]px/,
    message: "❌ Pixel border detected. Use depth markers like shadows.",
  },
  {
    id: "LEGACY_SPACING_SYNTAX",
    severity: "HERESY",
    regex:
      /\b(margin|padding|gap|row-gap|column-gap|grid-gap|top|bottom|left|right|inset|width|height|min-width|min-height|max-width|max-height|flex-basis)\s*:[^;]*\bvar\(--spacing-[0-9]+\)/i,
    message: "Legacy hardcoded spacing scale used inside structural descriptors. Update rules.",
  },
  {
    id: "EM_DASH_VIOLATION",
    severity: "ADVICE",
    regex: /\u2014/,
    message: "❌ Typographic slop detected: Raw em-dash in UI file. Use clean punctuation, en-dashes, or hyphens.",
  },
  {
    id: "VIEWPORT_H_SCREEN",
    severity: "ADVICE",
    regex: /\b(h-screen|min-h-screen)\b/,
    message: "❌ Viewport instability detected: Use min-h-[100dvh] instead of h-screen.",
  },
  {
    id: "MOTION_SCALE_ZERO",
    severity: "ADVICE",
    regex: /scale\(0\)/,
    message: "❌ Rule 05 violation: Never animate scale(0). Start from scale(0.95) with opacity: 0.",
  },
  {
    id: "MOTION_TRANSITION_ALL",
    severity: "ADVICE",
    regex: /transition:\s*all\b|\btransition-all\b/,
    message: "❌ Rule 07 violation: Banned transition: all. Name exact animated properties.",
  },
  {
    id: "MOTION_EASE_IN",
    severity: "ADVICE",
    regex: /transition:[^;]*\bease-in\b|\btransition-timing-function:\s*ease-in\b/,
    message: "❌ Rule 03 violation: Banned ease-in on UI. Use ease-out or custom cubic-bezier.",
  },
  {
    id: "MOTION_LAYOUT_PROPS",
    severity: "ADVICE",
    regex: /transition:[^;]*\b(width|height|top|left|margin|padding)\b/,
    message: "❌ Rule 07 violation: Animating layout properties triggers repaint/reflow. Animate transform or opacity.",
  },
];

let scanned = 0;
let violations = 0;
let hasHeresy = false;

/**
 *
 */
function scan(dir) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relPath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, "/");

    if (ig.ignores(relPath) || relPath.includes("node_modules")) continue;

    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      scan(fullPath);
    } else {
      const ext = path.extname(fullPath);
      if (ext === ".css" || ext === ".svelte") {
        scanned++;
        auditFile(fullPath);
      }
    }
  }
}

/**
 *
 */
function auditFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const relPath = path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");

  if (relPath.includes("audit-") || relPath.endsWith("design.css") || relPath.includes(".bak.")) return;

  themeRules.forEach((rule) => {
    lines.forEach((line, i) => {
      if (rule.regex.test(line)) {
        violations++;
        const color = rule.severity === "HERESY" ? RED : YELLOW;
        if (rule.severity === "HERESY") hasHeresy = true;

        console.log(`${color}[${rule.severity}] ${relPath}:${i + 1}${RESET}`);
        console.log(`  ${rule.message}`);
        console.log(`  Code: ${line.trim().substring(0, 100)}\n`);
      }
    });
  });
}

/**
 *
 */
export function auditCodebaseTokens() {
  const definedMap = parseDefinedTokens();
  const source_files = getSourceFiles(PATHS.src).filter((file) => file !== PATHS.designCss && file !== PATHS.jsBridge);

  let total_failures = 0;

  for (const file of source_files) {
    const rel_path = path.relative(PATHS.root, file).replace(/\\/g, "/");
    const lines = fs.readFileSync(file, "utf8").split("\n");
    const is_test_file = file.endsWith(".test.js") || file.endsWith(".test.ts");

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const is_comment_or_doc = /^\s*(\/\/|\*|\/\*)/.test(line);
      if (!is_test_file && !is_comment_or_doc) {
        const var_matches = [...line.matchAll(/var\((--[a-zA-Z0-9_-]+)/g)];
        for (const match of var_matches) {
          const token_name = match[1];
          if (!definedMap.has(token_name)) {
            // Exempt local component variables and standard Tailwind variables
            if (token_name === "--stage-align" || token_name === "--shimmer-color") continue;
            if (token_name.startsWith("--color-")) continue;
            if (token_name.startsWith("--bits-")) continue;
            if (token_name.startsWith("--state-")) continue;

            console.error(`${RED}[HERESY] ${rel_path}:${index + 1} - Hallucinated variable reference: ${token_name}${RESET}`);
            total_failures++;
            hasHeresy = true;
          }
        }
      }
    }
  }

  return total_failures;
}

/**
 *
 */
export function findUnusedTokens() {
  const definedMap = parseDefinedTokens();
  const source_files = getSourceFiles(PATHS.src).filter((f) => f !== PATHS.designCss && f !== PATHS.jsBridge);

  const combined_content = source_files.map((f) => fs.readFileSync(f, "utf8")).join("\n");

  // Tailwind v4 resolves utilities from theme tokens, so a token counts as
  // USED when any of these appear in src: the literal `--token`, its bare
  // name as a hyphen-delimited class fragment (bg-glass-elevated,
  // font-heading, opacity-ghost, ...), or a namespace-aliased utility
  // (rounded-X -> --radius-X, size-X -> --spacing-X). Unprefixed multi-word
  // rests (glass-elevated) are distinctive enough to count; single words are
  // not, so they only count with their namespace prefix.
  function token_used_in_code(token, combined_content) {
    const literal = new RegExp(`(?<![a-zA-Z0-9_-])${token}(?![a-zA-Z0-9_-])`);
    if (literal.test(combined_content)) return true;
    const bare = token.startsWith("--") ? token.slice(2) : token;
    const fragment = new RegExp(`(?<![a-zA-Z0-9])${bare}(?![a-zA-Z0-9])`);
    if (fragment.test(combined_content)) return true;
    const rest_aliases = [];
    if (bare.startsWith("radius-")) rest_aliases.push(`rounded-${bare.slice("radius-".length)}`);
    if (bare.startsWith("spacing-")) rest_aliases.push(`size-${bare.slice("spacing-".length)}`);
    for (const alias of rest_aliases) {
      if (new RegExp(`(?<![a-zA-Z0-9])${alias}(?![a-zA-Z0-9])`).test(combined_content)) return true;
    }
    if (bare.startsWith("color-")) {
      const rest = bare.slice("color-".length);
      if (rest.includes("-") && new RegExp(`(?<![a-zA-Z0-9])${rest}(?![a-zA-Z0-9])`).test(combined_content)) return true;
      for (const utility of [
        "bg",
        "text",
        "border",
        "ring",
        "fill",
        "stroke",
        "from",
        "via",
        "to",
        "accent",
        "decoration",
        "placeholder",
        "outline",
        "shadow",
      ]) {
        if (new RegExp(`(?<![a-zA-Z0-9])${utility}-${rest}(?![a-zA-Z0-9])`).test(combined_content)) return true;
      }
    }
    const bare_rest =
      bare.includes("-") && (bare.startsWith("spacing-") || bare.startsWith("grid-") || bare.startsWith("order-"))
        ? bare.split("-").slice(1).join("-")
        : null;
    if (bare_rest && bare_rest.includes("-") && new RegExp(`(?<![a-zA-Z0-9])${bare_rest}(?![a-zA-Z0-9])`).test(combined_content)) return true;
    return false;
  }

  // Tokens referenced only through runtime construction (setProperty,
  // `--${name}` hydration over the generated bridge) never appear literally.
  // Each entry names a concrete construction site in src/.
  const RUNTIME_CONSTRUCTED_TOKENS = new Set([
    "--signature-color", // Storyboard.svelte: clone/element setProperty
    "--active-signature-color", // interface.svelte.js: documentElement setProperty
  ]);

  const unused = Array.from(definedMap.keys()).filter((token) => {
    // Exempt signature color palette stuff from debt
    const signatureColors = [
      "--coral-rose",
      "--forest-green",
      "--lemon-yellow",
      "--lime-green",
      "--neon-teal",
      "--ocean-blue",
      "--pumpkin-amber",
      "--royal-purple",
      "--sunset-orange",
      "--twilight-violet",
      "--crimson-red",
      "--frisk",
      "--glass-peak",
      "--frozen",
      "--frozen",
      "--frozen",
    ];
    if (signatureColors.includes(token)) return false;

    if (RUNTIME_CONSTRUCTED_TOKENS.has(token)) return false;
    return !token_used_in_code(token, combined_content);
  });

  if (unused.length > 0) {
    console.log(`${YELLOW}[DEBT] Unused tokens defined in design.css:${RESET}`);
    unused.forEach((tok) => console.log(`  - ${tok}`));
    console.log("");
  }
}

console.log("\n================================================================================");
console.log("🎨 AUDIT: DESIGN SYSTEM");
console.log("================================================================================\n");

scan(SRC_DIR);
const token_failures = auditCodebaseTokens();
violations += token_failures;
findUnusedTokens();

console.log("--------------------------------------------------------------------------------");
console.log(`📊 SCAN COMPLETE: ${scanned} design assets verified.`);
console.log(`🔥 VIOLATIONS: ${violations}`);
console.log("--------------------------------------------------------------------------------\n");

if (hasHeresy) {
  console.log(`${RED}❌ REJECTED: Heresy detected in design tokens. Gate closed.${RESET}`);
  process.exit(1);
} else {
  console.log(`${GREEN}✅ RESONANT: All protocols align. Proceeding.${RESET}`);
}
