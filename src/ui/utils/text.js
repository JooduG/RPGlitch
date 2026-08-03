/**
 * src/ui/utils/text.js
 * 📝 TEXT UTILITIES
 * Pure, stateless text formatting helpers.
 * ZERO dependencies on any architectural layer.
 */

/**
 * Strips cognition blocks (</think>...) from text.
 * Inlined here to avoid cross-layer imports.
 * @param {string|null|undefined} text
 * @returns {string}
 */
export function strip_cognition_blocks(text) {
  if (!text) return "";
  let clean = text.replace(/<think\b[^>]*>[\s\S]*?(?:<\/think\s*>|$)\r?\n?/gi, "");
  // Strip certain model artifacts
  clean = clean.replace(/^Mattis\b(?:\.\s*Archetypes:[^\n]*\n*|\.|:|\s)*/i, "");
  return clean.trim();
}

/**
 * High-fidelity parser that extracts pseudo-JSON configurations.
 * Exclusively parses bracketed [KEY: VALUE] parameters.
 * Inlined here to avoid cross-layer imports from @intelligence.
 * @param {string} raw
 * @returns {Record<string, string>}
 */
export const safe_parse_pseudo_json = (raw) => {
  if (!raw) return {};
  const clean_raw = strip_cognition_blocks(raw).trim();
  if (!clean_raw) return {};

  // Tier 1: Process bracketed configuration [KEY: VALUE] or [KEY: VALUE] [KEY2: VALUE2]
  if (clean_raw.includes("[") && clean_raw.includes("]")) {
    const bracket_extracted = {};
    const bracket_regex = /\[([^:\]]+)\s*:\s*([^\]]+)\]/g;
    let match;
    while ((match = bracket_regex.exec(clean_raw)) !== null) {
      const k = match[1].replace(/["']/g, "").trim().replace(/\s+/g, "_");
      const v = match[2].replace(/^["']|["']$/g, "").trim();
      if (k && v) bracket_extracted[k] = v;
    }
    if (Object.keys(bracket_extracted).length > 0) return bracket_extracted;
  }

  // Tier 2: Process quoted key-value pairs "KEY": "VALUE" or JSON {"KEY": "VALUE"}
  if (clean_raw.includes('"') && clean_raw.includes(":")) {
    const quoted_extracted = {};
    const quoted_regex = /"([^"]+)"\s*:\s*"([^"]*)"/g;
    let match;
    while ((match = quoted_regex.exec(clean_raw)) !== null) {
      const k = match[1].trim().replace(/\s+/g, "_");
      const v = match[2].trim();
      if (k && v) quoted_extracted[k] = v;
    }
    if (Object.keys(quoted_extracted).length > 0) return quoted_extracted;
  }

  // Tier 3: No structured keys found — preserve the raw prose so downstream
  // consumers (optics AestheticResolver, prompt XML builders) can still feed
  // physical-trait prose into image/LLM prompts instead of silently dropping it.
  return { __raw_prose__: clean_raw };
};

/**
 * Safely indents multi-line string content.
 * @param {string|null|undefined} text
 * @param {number} spaces
 * @returns {string}
 */
export const ind = (text, spaces) => {
  if (!text) return "";
  const prefix = " ".repeat(spaces);
  return String(text).trim().split("\n").join(`\n${prefix}`);
};

/**
 * Derives up to 3 uppercase initials from a style name.
 * @param {string} name - Style display name
 * @returns {string}
 */
export function get_style_initials(name) {
  if (!name || name === "No Narrative Style" || name === "No Visual Style") return "?";
  return name
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

/**
 * Derives a punchy single-line header title from directive text.
 * @param {string} text - Raw directive text
 * @param {number} [maxLen=38] - Target maximum length
 * @returns {string}
 */
export function derive_vector_title(text, maxLen = 38) {
  if (!text || typeof text !== "string") return "";
  const cleaned = text
    .trim()
    .replace(/^["'“”«»]+|["'“”«»]+$/g, "")
    .replace(/\s+/g, " ");

  if (!cleaned) return "";

  if (cleaned.length <= maxLen) {
    return cleaned.replace(/[.,;:]+$/, "");
  }

  const sub = cleaned.slice(0, maxLen);
  const last_space = sub.lastIndexOf(" ");
  const truncated = last_space > 15 ? sub.slice(0, last_space) : sub;
  return truncated.replace(/[.,;:]+$/, "") + "…";
}
