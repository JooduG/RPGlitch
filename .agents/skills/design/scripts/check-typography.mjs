import fs from "node:fs";
import path from "node:path";
import { has_ignore_next_line } from "../../housekeeping/scripts/lib/io.js";

const warn_only = process.argv.includes("--warn");
const ROOT_DIR = path.resolve("src");

function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(walk(full));
    else if (entry.name.endsWith(".svelte")) results.push(full);
  }
  return results;
}

const FONT_SIZE_RE = /^(?:[a-z0-9_-]+:)*text-(?:xs|sm|base|lg|xl|[2-9]xl|\[(?:[0-9.]+(?:px|rem|em|vw|vh|ch|%)|clamp\([^\]]+\))\])$/;
const ARBITRARY_SIZE_RE = /^(?:[a-z0-9_-]+:)*text-\[(?:[0-9.]+(?:px|rem|em|vw|vh|ch|%)|clamp\([^\]]+\))\]$/;
const TYPE_UTILITY_RE = /^type-(?:body|interact|uppercase-label|data)$/;
const WEIGHT_RE = /^(?:[a-z0-9_-]+:)*font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/;
const TRACKING_RE = /^(?:[a-z0-9_-]+:)*tracking-(?:tighter|tight|normal|wide|wider|widest|\[[^\]]+\])$/;
const LEADING_RE = /^(?:[a-z0-9_-]+:)*leading-(?:none|tight|snug|normal|relaxed|loose|\[[^\]]+\]|\d+)$/;

function split_prefix(token) {
  const parts = token.split(":");
  const base = parts.pop();
  const prefix = parts.join(":");
  return { prefix, base };
}

function get_line_num(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

function has_ignore_comment(lines, line_num) {
  if (has_ignore_next_line(lines, line_num)) return true;
  for (let i = line_num - 2; i >= Math.max(0, line_num - 3); i--) {
    if (/<!--\s*typography-ignore:\s*\S+[\s\S]*?-->/.test(lines[i])) return true;
  }
  return false;
}

const violations = [];

function report(rel, line, rule, snippet, fix) {
  violations.push({ rel, line, rule, snippet: snippet.trim().slice(0, 120), fix });
}

for (const file of walk(ROOT_DIR)) {
  const rel = path.relative(".", file).replace(/\\/g, "/");
  const is_storyboard_title = path.basename(file) === "StoryboardTitle.svelte";
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split(/\r?\n/);

  // 1. no-inline-font-style
  const inline_style_re = /(?:style\s*=\s*"([^"]*)"|style:(font[a-z-]*|line-height|letter-spacing|text-transform)\s*=)/gi;
  let sm;
  while ((sm = inline_style_re.exec(content)) !== null) {
    const line_num = get_line_num(content, sm.index);
    if (has_ignore_comment(lines, line_num)) continue;
    if (sm[2] || /\b(font(?:-[a-z-]+)?|line-height|letter-spacing|text-transform)\s*:/i.test(sm[1] || "")) {
      report(rel, line_num, "no-inline-font-style", sm[0], "Move inline typography styling to bare h1–h6 or a type-* utility.");
    }
  }

  // Scan HTML/Svelte opening tags with class attributes
  const tag_re = /<([A-Za-z0-9_.:-]+)\b([^>]*?)>/gs;
  let tm;
  while ((tm = tag_re.exec(content)) !== null) {
    const tag = tm[1];
    const attrs = tm[2] || "";
    const tag_line = get_line_num(content, tm.index);
    if (has_ignore_comment(lines, tag_line)) continue;

    // Extract static strings inside class="..." or class={[...]}
    const class_matches = [];
    const static_class = attrs.match(/\bclass\s*=\s*"([^"]*)"/);
    if (static_class) class_matches.push(static_class[1]);
    const array_class = attrs.match(/\bclass\s*=\s*\{\[([\s\S]*?)\]\}/);
    if (array_class) {
      for (const str_m of array_class[1].matchAll(/"([^"]*)"|'([^']*)'/g)) {
        class_matches.push(str_m[1] ?? str_m[2] ?? "");
      }
    }
    if (!class_matches.length) continue;

    const all_tokens = class_matches.join(" ").trim().split(/\s+/).filter(Boolean);
    const base_tokens = new Set(all_tokens.map((t) => split_prefix(t).base));

    // 2. no-font-display
    if (!is_storyboard_title && base_tokens.has("font-display")) {
      report(rel, tag_line, "no-font-display", all_tokens.join(" "), "font-display is quarantined to StoryboardTitle.svelte.");
    }

    // 3. no-raw-uppercase-label
    if (base_tokens.has("uppercase") && all_tokens.some((t) => TRACKING_RE.test(t))) {
      report(rel, tag_line, "no-raw-uppercase-label", all_tokens.join(" "), "Replace raw uppercase + tracking stack with type-uppercase-label or <h6>.");
    }

    // 4. no-raw-font-recipe
    const has_font_family = base_tokens.has("font-heading") || base_tokens.has("font-mono");
    const has_recipe_mod = all_tokens.some((t) => TRACKING_RE.test(t) || LEADING_RE.test(t) || FONT_SIZE_RE.test(t));
    if (has_font_family && has_recipe_mod) {
      report(rel, tag_line, "no-raw-font-recipe", all_tokens.join(" "), "Replace raw font-* recipe with bare h1–h5, <h6>, type-uppercase-label, or type-data.");
    }

    // 5. no-heading-override
    let reported_override = false;
    if (/^h[1-6]$/i.test(tag) && !is_storyboard_title) {
      const has_override =
        base_tokens.has("font-sans") ||
        base_tokens.has("font-mono") ||
        base_tokens.has("font-heading") ||
        base_tokens.has("font-display") ||
        base_tokens.has("uppercase") ||
        all_tokens.some((t) => WEIGHT_RE.test(t) || FONT_SIZE_RE.test(t) || TRACKING_RE.test(t) || LEADING_RE.test(t));
      if (has_override) {
        reported_override = true;
        report(
          rel,
          tag_line,
          "no-heading-override",
          `<${tag} class="${all_tokens.join(" ")}">`,
          "Bare h1–h6 tags are pre-styled in DESIGN.md; remove override or use the appropriate heading level.",
        );
      }
    }

    // 6. no-type-utility-override
    if (all_tokens.some((t) => TYPE_UTILITY_RE.test(split_prefix(t).base))) {
      const has_type_override =
        base_tokens.has("font-sans") ||
        base_tokens.has("font-mono") ||
        base_tokens.has("font-heading") ||
        base_tokens.has("font-display") ||
        all_tokens.some((t) => WEIGHT_RE.test(t) || FONT_SIZE_RE.test(t) || TRACKING_RE.test(t) || LEADING_RE.test(t));
      if (has_type_override) {
        reported_override = true;
        report(
          rel,
          tag_line,
          "no-type-utility-override",
          `<${tag} class="${all_tokens.join(" ")}">`,
          "type-* utilities already define family, size, weight, tracking, and leading; remove inline overrides.",
        );
      }
    }

    // 7. no-raw-typography
    if (!is_storyboard_title && !reported_override && !(base_tokens.has("uppercase") && all_tokens.some((t) => TRACKING_RE.test(t))) && !has_font_family) {
      const has_raw = all_tokens.some((t) => TRACKING_RE.test(t) || LEADING_RE.test(t) || ARBITRARY_SIZE_RE.test(t));
      if (has_raw) {
        report(
          rel,
          tag_line,
          "no-raw-typography",
          `<${tag} class="${all_tokens.join(" ")}">`,
          "Replace raw tracking/leading/arbitrary font-size with bare h1–h6 or a type-* utility.",
        );
      }
    }

    // 6. no-typography-collision (on static class="...")
    if (static_class) {
      const static_tokens = static_class[1].trim().split(/\s+/).filter(Boolean);
      const by_prefix = { size: new Map(), weight: new Map(), tracking: new Map(), leading: new Map() };
      for (const tok of static_tokens) {
        const { prefix } = split_prefix(tok);
        if (FONT_SIZE_RE.test(tok)) by_prefix.size.set(prefix, (by_prefix.size.get(prefix) || 0) + 1);
        if (WEIGHT_RE.test(tok)) by_prefix.weight.set(prefix, (by_prefix.weight.get(prefix) || 0) + 1);
        if (TRACKING_RE.test(tok)) by_prefix.tracking.set(prefix, (by_prefix.tracking.get(prefix) || 0) + 1);
        if (LEADING_RE.test(tok)) by_prefix.leading.set(prefix, (by_prefix.leading.get(prefix) || 0) + 1);
      }
      const has_dup = Object.values(by_prefix).some((m) => [...m.values()].some((c) => c > 1));
      if (has_dup) {
        report(rel, tag_line, "no-typography-collision", static_class[1], "Conflicting typography utilities on the same element; remove duplicates.");
      }
    }
  }
}

for (const v of violations) {
  console.log(`${v.rel}:${v.line} [${v.rule}]`);
  console.log(`  Snippet: ${v.snippet}`);
  console.log(`  Fix:     ${v.fix}\n`);
}
console.log(`Typography check complete: ${violations.length} violation(s) found.`);
if (violations.length > 0 && !warn_only) {
  process.exit(1);
}
