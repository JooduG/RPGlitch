/**
 * src/utils/text.js
 * 📝 TEXT UTILITIES
 * Pure, stateless text formatting helpers.
 * ZERO dependencies on any architectural layer — the only intra-layer import is
 * CLOTHING_KEYS from ./xml.js (used by merge_prose_into_field).
 */

import { CLOTHING_KEYS } from "./xml.js";

/**
 * Strips cognition blocks (<think>...</think>) from text.
 * CANONICAL implementation — lives in @utils (the top architectural layer) so
 * lower layers may import it downward without violating the layer hierarchy.
 * @intelligence re-exports it (parser.js), keeping exactly one copy of this logic.
 * @param {string|null|undefined} text
 * @returns {string}
 */
const MODEL_ARTIFACT_PATTERNS = [
  // Certain model variants prepend an authorial tag like "Mattis. Archetypes: ..."
  // or "Mattis:" before actual content; strip the entire leading artifact.
  /^Mattis\b(?:\.\s*Archetypes:[^\n]*\n*|\.|:|\s)*/i,
];

export function strip_cognition_blocks(text) {
  if (!text) return "";
  let clean = text.replace(/<think\b[^>]*>[\s\S]*?(?:<\/think\s*>|$)\r?\n?/gi, "");
  // Models occasionally re-close the think block after the narrative has started
  // (e.g. "...collision of wills.</think>"). A lone closing tag like that must not
  // survive into history, narrative display, or visual prompt intents.
  clean = clean.replace(/<\/think\s*>/gi, "");
  for (const pattern of MODEL_ARTIFACT_PATTERNS) {
    clean = clean.replace(pattern, "");
  }
  return clean.trim();
}

/**
 * Universal atomic-clearing tokens — emitting [KEY: one of these] deletes KEY
 * from the present-state dictionary (e.g. [HELD: none], [INJURY: healed],
 * [STATUS: normal], [SECRET: cleared]). Shared by safe_parse_pseudo_json
 * (@utils) and merge_prose_into_field (@utils/text.js).
 */
export const CLEAR_TOKENS = new Set(["none", "bare", "naked", "off", "removed", "disrobed", "healed", "cleared", "normal"]);

/**
 * Keys whose repeated brackets aggregate into a single multi-item list.
 */
export const AGGREGATE_KEYS = new Set(["INVENTORY", "STASH"]);

/**
 * High-fidelity parser that extracts pseudo-JSON configurations.
 * Exclusively parses bracketed [KEY: VALUE] parameters.
 * Inlined here to avoid cross-layer imports from @intelligence.
 * @param {string} raw
 * @returns {Record<string, string | string[]>}
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
    let matched_any = false;
    while ((match = bracket_regex.exec(clean_raw)) !== null) {
      matched_any = true;
      const k = match[1].replace(/["']/g, "").trim().replace(/\s+/g, "_");
      const v = match[2].replace(/^["']|["']$/g, "").trim();
      if (!k || !v) continue;

      // Universal atomic clearing: clear-token values drop the key entirely.
      if (CLEAR_TOKENS.has(v.toLowerCase())) {
        delete bracket_extracted[k];
        continue;
      }

      // Multi-item aggregation: repeated INVENTORY/STASH brackets (and
      // comma-separated values) merge into one normalized list.
      if (AGGREGATE_KEYS.has(k)) {
        const items = v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const existing = bracket_extracted[k];
        const list = Array.isArray(existing) ? existing : existing ? [existing] : [];
        for (const item of items) {
          if (item && !list.includes(item)) list.push(item);
        }
        bracket_extracted[k] = list;
        continue;
      }

      bracket_extracted[k] = v;
    }
    if (matched_any) return bracket_extracted; // all keys cleared → {}
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
  // consumers (optics aesthetic_resolver, prompt XML builders) can still feed
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

/**
 * Collapses conversation history into role-grouped entries.
 * Consecutive messages from the same character are merged into a single entry.
 * @param {Array<{role: string, content?: string, text?: string, character_name?: string}>} messages
 * @param {{separator?: string, stripBoldQuotes?: boolean}} [options]
 * @returns {Array<{role: string, name: string, content: string}>}
 */
export function collapse_history(messages, options = {}) {
  const { separator = "\n", stripBoldQuotes = false } = options;
  if (!Array.isArray(messages) || messages.length === 0) return [];

  const collapsed = [];
  for (const m of messages) {
    if (m.role === "system") continue;
    const lower_role = (m.role || "").toLowerCase();
    const role = lower_role === "user" ? "USER_PERSONA" : ["prologue", "fractal"].includes(lower_role) ? "FRACTAL" : "AI_CHARACTER";
    const name = m.character_name || "";
    let content = strip_cognition_blocks(m.content || m.text || "");
    if (stripBoldQuotes) {
      content = content.replace(/\*\*\s*"(.*?)"\s*\*\*/g, '"$1"');
    }
    if (!content) continue;

    const last = collapsed[collapsed.length - 1];
    if (last && last.role === role && last.name === name) {
      last.content += `${separator}${content}`;
    } else {
      collapsed.push({ role, name, content });
    }
  }
  return collapsed;
}

/**
 * Web ingestion budget (characters) applied to fetched page text. Character
 * imports clip here; fractal/world imports use INGESTION_WORD_LIMIT.
 */
export const INGESTION_CHAR_LIMIT = 8000;

/**
 * Web ingestion budget (characters) applied to fetched page text for fractal
 * (world/setting) imports — larger, since lore pages need more room.
 */
export const INGESTION_WORD_LIMIT = 10000;

/** Element tags treated as block boundaries when extracting text from HTML. */
const BLOCK_LEVEL_TAGS = new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "dd",
  "div",
  "dl",
  "dt",
  "figcaption",
  "figure",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "li",
  "main",
  "ol",
  "p",
  "pre",
  "section",
  "table",
  "tr",
  "ul",
]);

/** Tags whose entire subtree is navigation/chrome noise, never page content. */
const NOISE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "template",
  "svg",
  "canvas",
  "iframe",
  "object",
  "embed",
  "form",
  "button",
  "input",
  "select",
  "textarea",
  "nav",
  "aside",
];

/**
 * Decodes the most common HTML entities into plain text characters.
 * Numeric references (decimal + hex) are decoded generically.
 * @param {string} text
 * @returns {string}
 */
export function decode_html_entities(text) {
  return String(text)
    .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => {
      const code = parseInt(hex, 16);
      return Number.isNaN(code) ? "" : String.fromCodePoint(code);
    })
    .replace(/&#(\d+);/g, (_m, dec) => {
      const code = Number(dec);
      return Number.isNaN(code) ? "" : String.fromCodePoint(code);
    })
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&hellip;/gi, "…")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–");
}

/**
 * Recursively walks a DOM node, emitting text plus newline separators at block
 * boundaries so headings, paragraphs, and list items land on their own lines.
 * @param {Node} root
 * @returns {string}
 */
function _dom_to_text(root) {
  let out = "";
  /** @param {Node} node */
  function walk(node) {
    if (node.nodeType === 3) {
      out += node.textContent || "";
      return;
    }
    if (node.nodeType !== 1) return;
    const tag = /** @type {string} */ (node.nodeName).toLowerCase();
    if (tag === "br" || tag === "hr") {
      out += "\n";
      return;
    }
    if (BLOCK_LEVEL_TAGS.has(tag)) out += "\n";
    for (const child of node.childNodes) walk(child);
    if (BLOCK_LEVEL_TAGS.has(tag)) out += "\n";
  }
  walk(root);
  return out;
}

/**
 * Regex-only HTML→text fallback for environments without DOMParser.
 * Far cruder than the DOM path, but deterministic and dependency-free.
 * @param {string} html
 * @returns {string}
 */
function _regex_html_to_text(html) {
  return html
    .replace(new RegExp(`<(?:${NOISE_SELECTORS.join("|")})\\b[^>]*>[\\s\\S]*?</(?:${NOISE_SELECTORS.join("|")})>`, "gi"), " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<hr\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|blockquote|h[1-6]|tr|pre|table|ul|ol|dl|dd|dt|section|article|figure|figcaption)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ");
}

/**
 * Converts a webpage's HTML into clean, readable plain text.
 * Strips scripts, navigation, and interactive chrome; block boundaries become
 * newlines. Optionally clips the result with truncate_readable.
 * @param {string} html
 * @param {{ max_chars?: number }} [options]
 * @returns {string}
 */
export function html_to_plain_text(html, options = {}) {
  if (typeof html !== "string" || !html.trim()) return "";
  const max_chars = options.max_chars || 0;
  let text;
  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    for (const selector of NOISE_SELECTORS) {
      doc.body.querySelectorAll(selector).forEach((n) => n.remove());
    }
    text = decode_html_entities(_dom_to_text(doc.body));
  } else {
    text = decode_html_entities(_regex_html_to_text(html));
  }
  text = text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (max_chars > 0 && text.length > max_chars) {
    text = truncate_readable(text, max_chars);
  }
  return text;
}

/**
 * Clips text at a natural word boundary near `max_chars`, appending an ellipsis.
 * Never splits mid-word; trims trailing punctuation so the cut reads cleanly.
 * @param {string} text
 * @param {number} [max_chars]
 * @param {string} [ellipsis]
 * @returns {string}
 */
export function truncate_readable(text, max_chars = INGESTION_CHAR_LIMIT, ellipsis = "…") {
  if (typeof text !== "string" || !text) return "";
  if (text.length <= max_chars) return text;
  const budget = Math.max(1, max_chars - ellipsis.length);
  let slice = text.slice(0, budget);
  const last_space = slice.lastIndexOf(" ");
  if (last_space > Math.floor(budget * 0.5)) slice = slice.slice(0, last_space);
  slice = slice.replace(/[.,;:\s]+$/, "");
  return slice + ellipsis;
}

/**
 * Extracts a single short sentence (≤max_len chars) from a blob of text.
 * Strips think blocks, markdown fences, and excessive whitespace.
 * @param {string|null|undefined} text
 * @param {number} [max_len=160]
 * @returns {string}
 */
export function first_sentence(text, max_len = 160) {
  const clean = strip_cognition_blocks(text).replace(/```/g, "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const regex = new RegExp(`^[^.!?]{1,${max_len}}[.!?:;]?`);
  const m = clean.match(regex);
  const sentence = (m ? m[0] : clean.slice(0, max_len)).trim();
  return sentence;
}

/**
 * Matches the capitalization of the original string on the replacement string.
 * If the first character of original is uppercase, capitalizes replacement.
 * @param {string|null|undefined} original
 * @param {string|null|undefined} replacement
 * @returns {string}
 */
export function match_case(original, replacement) {
  if (!original || !replacement) return replacement || "";
  const first_char = original.charAt(0);
  const is_uppercase = first_char === first_char.toUpperCase() && first_char !== first_char.toLowerCase();
  if (is_uppercase) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/**
 * Shared entity name stop words and title prefixes for visual initials calculations
 * and prefix-aware name formatting breaks.
 */
export const NAME_PREFIXES = [
  "mr",
  "mrs",
  "ms",
  "dr",
  "prof",
  "sir",
  "lady",
  "lord",
  "the",
  "a",
  "an",
  "of",
  "in",
  "and",
  "or",
  "for",
  "to",
  "at",
  "by",
  "with",
  "mr.",
  "mrs.",
  "ms.",
  "dr.",
  "prof.",
];

/**
 * Auto-formats object keys into UI labels (e.g. "non_physical" -> "Non-Physical", "future" -> "Future").
 * @param {string} key
 * @returns {string}
 */
export function format_key_as_label(key) {
  if (!key || typeof key !== "string") return "";
  if (key === "non_physical") return "Non-Physical";
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Merges raw prose into an existing field (either pseudo-JSON or plain text)
 * and reserializes it securely without destructive appends.
 * @param {string} current_field_value
 * @param {string} new_prose
 * @returns {string}
 */
export const merge_prose_into_field = (current_field_value, new_prose) => {
  if (!new_prose || !new_prose.trim()) return current_field_value || "";

  const MAX_FIELD_CHARS = 2000;
  const parsed = safe_parse_pseudo_json(current_field_value);
  const clean_new_prose = new_prose.trim();

  // Plain prose field (no structured keys, or raw-prose sentinel from safe_parse_pseudo_json)
  if (!parsed || parsed.__raw_prose__ || Object.keys(parsed).length === 0) {
    const existing = (current_field_value || "").trim();
    let result = !existing ? clean_new_prose : `${existing}\n${clean_new_prose}`;
    if (result.length > MAX_FIELD_CHARS) {
      result = result.substring(result.length - MAX_FIELD_CHARS);
    }
    return result;
  }

  // 1. Extract bracketed [KEY: Value] directives first
  const bracketed_regex = /\[([A-Z_ ]{3,25}):\s*([\s\S]*?)\]/g;
  let remaining_prose = clean_new_prose;
  let match;
  const key_updates = [];

  while ((match = bracketed_regex.exec(clean_new_prose)) !== null) {
    const full_match = match[0];
    const raw_key = match[1].toUpperCase().replace(/\s+/g, "_");
    const raw_val = match[2].trim();
    if (raw_val) {
      key_updates.push({ key: raw_key, val: raw_val });
      remaining_prose = remaining_prose.replace(full_match, "").trim();
    }
  }

  // 2. Extract unbracketed KEY: Value segments if any
  const unbracketed_regex = /(?:^|,\s*|\s*)([A-Z_]{3,15}):\s*([^,[\]]+(?:\s+[^,[\]]+)*)/g;
  while ((match = unbracketed_regex.exec(remaining_prose)) !== null) {
    const full_match = match[0];
    const raw_key = match[1].toUpperCase();
    const raw_val = match[2].trim();
    if (raw_val) {
      key_updates.push({ key: raw_key, val: raw_val });
      remaining_prose = remaining_prose.replace(full_match, "").trim();
    }
  }

  remaining_prose = remaining_prose
    .replace(/^[\s,;[\]]+|[\s,;[\]]+$/g, "")
    .replace(/,\s*,+/g, ",")
    .trim();

  // Apply structured key updates in sequence to respect hierarchy
  for (const { key, val } of key_updates) {
    let target_key = key;
    const is_clear_token = CLEAR_TOKENS.has(val.toLowerCase());

    // Wildcard purge: [CLOTHING: none] strips every clothing key at once.
    if (key === "CLOTHING" && is_clear_token) {
      for (const ck of CLOTHING_KEYS) delete parsed[ck];
      continue;
    }

    if (CLOTHING_KEYS.includes(key) && is_clear_token) {
      delete parsed[key];
      continue;
    }

    // Universal atomic clearing: [KEY: none/bare/naked/off/removed/disrobed/
    // healed/cleared/normal] deletes the key, preventing stale clutter.
    if (is_clear_token) {
      delete parsed[key];
      continue;
    }

    // Multi-item aggregation: repeated INVENTORY/STASH directives merge into a
    // single normalized list instead of clobbering the existing collection.
    if (AGGREGATE_KEYS.has(key)) {
      const incoming = val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const existing = parsed[key];
      const list = Array.isArray(existing)
        ? existing
        : existing
          ? String(existing)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
      for (const item of incoming) {
        if (item && !list.includes(item)) list.push(item);
      }
      parsed[key] = list;
      continue;
    }

    if (key === "CLOTHING" && parsed.SHIRT) target_key = "SHIRT";
    if (key === "SHIRT" && parsed.CLOTHING) target_key = "CLOTHING";
    parsed[target_key] = val;
  }

  // Append any remaining unstructured prose to CONDITION
  if (remaining_prose) {
    const cond_key = parsed.CONDITION ? "CONDITION" : parsed.condition ? "condition" : "CONDITION";
    if (parsed[cond_key]) {
      const clean_existing = parsed[cond_key].replace(/^[\s,]+|[\s,]+$/g, "").replace(/,\s*,+/g, ", ");
      parsed[cond_key] = `${clean_existing}, ${remaining_prose}`;
    } else {
      parsed[cond_key] = remaining_prose;
    }
  }

  // Clean up double commas inside all values of parsed
  for (const k in parsed) {
    if (typeof parsed[k] === "string") {
      parsed[k] = parsed[k].replace(/^[\s,]+|[\s,]+$/g, "").replace(/,\s*,+/g, ", ");
    }
  }

  let lines = Object.entries(parsed)
    .map(([k, v]) => `[${k}: ${String(Array.isArray(v) ? v.join(", ") : v).replace(/[[]]/g, "")}]`)
    .join(" ");

  if (lines.length > MAX_FIELD_CHARS) {
    lines = lines.substring(lines.length - MAX_FIELD_CHARS);
  }

  return lines;
};

/**
 * Replaces unescaped interior double-quotes with backslashed equivalents (\")
 * inside JSON string values.
 * @param {string} json_string
 * @returns {string}
 */
export function escape_unescaped_json_quotes(json_string) {
  if (typeof json_string !== "string") return json_string;
  return json_string.replace(/:\s*"([\s\S]*?)"(?=,\s*"[^"]+"\s*:|\s*\}|\s*\]|$)/g, (match, value) => {
    const escaped_value = value.replace(/(?<!\\)"/g, '\\"');
    return `: "${escaped_value}"`;
  });
}
