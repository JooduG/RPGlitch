/**
 * src/utils/text.js
 * 📝 TEXT & PROSE PROCESSING ENGINE
 *
 * Core Responsibilities:
 * - Pure, stateless string manipulation, parsing, and formatting utilities.
 * - String truncation, token counting, label/datetime formatting.
 * (Bracket tokenization, history/transcript codecs, LLM/cognition
 * sanitization and pseudo-JSON repair live in `@simulation`
 * (`./brackets.js`, `./history.js`, `./llm-output.js`); import from the
 * `@simulation` barrel.)
 *
 * Consumed across the engine by UI, State, Media, and Intelligence layers.
 */

import { CHARS_PER_TOKEN } from "@config";

/**
 * Matches an uppercase pseudo-JSON key (single or multi-word) terminated by a colon.
 */

/**
 * Common title prefixes and stop words for entity naming and initials calculation.
 * @type {ReadonlyArray<string>}
 */
export const NAME_PREFIXES = Object.freeze([
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
]);

/**
 * `NAME_PREFIXES` with trailing periods stripped, so a name token like "Dr."
 * matches its stop-word stem "dr". Shared by `compute_initials`.
 * @type {ReadonlySet<string>}
 */
export const NAME_PREFIX_STEMS = Object.freeze(new Set(NAME_PREFIXES.map((prefix) => prefix.replace(/\.$/, ""))));

/**
 * Collapses every run of whitespace to a single space and trims the result.
 * @param {string | null | undefined} text
 * @returns {string}
 */
export function collapse_whitespace(text) {
  if (!text || typeof text !== "string") return "";
  return text.replace(/\s+/g, " ").trim();
}

/**
 * The single word-boundary truncator every layer shares - `clean_text`,
 * `derive_vector_title` (this module) and `truncate_readable` (html.js) all
 * delegate here, so clipping behaviour is defined once.
 *
 * @param {string | null | undefined} text
 * @param {number} [limit=200] - Character budget for the retained content.
 * @param {Object} [options={}]
 * @param {string} [options.ellipsis="…"] - Suffix appended only when text was cut.
 * @param {boolean} [options.reserve_ellipsis=false] - Count the ellipsis inside `limit`.
 * @param {number} [options.min_bound_ratio=0] - Only break at a space past this fraction of the budget.
 * @param {number} [options.min_bound_chars=0] - Only break at a space at/after this column.
 * @param {boolean} [options.strip_trailing_punctuation=false] - Drop trailing `. , ; :` before the ellipsis.
 * @returns {string}
 */
export function truncate_at_word(text, limit = 200, options = {}) {
  if (!text || typeof text !== "string") return "";
  const { ellipsis = "…", reserve_ellipsis = false, min_bound_ratio = 0, min_bound_chars = 0, strip_trailing_punctuation = false } = options;

  const trimmed = text.trim();
  if (trimmed.length <= limit) {
    return strip_trailing_punctuation ? trimmed.replace(/[.,;:]+$/, "") : trimmed;
  }

  const budget = reserve_ellipsis ? Math.max(1, limit - ellipsis.length) : limit;
  const sub = trimmed.slice(0, budget);
  const last_space = sub.lastIndexOf(" ");
  const threshold = Math.max(min_bound_chars, Math.floor(budget * min_bound_ratio));
  const cut = (last_space > threshold ? sub.slice(0, last_space) : sub).trimEnd();
  const final = strip_trailing_punctuation ? cut.replace(/[.,;:]+$/, "") : cut;
  return `${final}${ellipsis}`;
}

/**
 * Universal text truncation ensuring pseudo-JSON bracket syntax integrity.
 * If text contains pseudo-JSON brackets and a bracket tag is cut off mid-tag,
 * clips cleanly at the last intact ']' before limit; otherwise falls back to truncate_at_word.
 *
 * @param {string | null | undefined} text
 * @param {number} [limit=200]
 * @param {Object} [options={}]
 * @returns {string}
 */
export function truncate_at_boundary(text, limit = 200, options = {}) {
  if (!text || typeof text !== "string") return "";
  const trimmed = text.trim();
  if (trimmed.length <= limit) return trimmed;

  const sub = trimmed.slice(0, limit);
  const last_open = sub.lastIndexOf("[");
  const last_close = sub.lastIndexOf("]");

  // If there is an unclosed bracket cut off mid-tag
  if (last_open > last_close) {
    if (last_close > 0) {
      return sub.slice(0, last_close + 1).trimEnd();
    }
    // If the unclosed bracket is the very first one, drop it and return empty/trimmed
    return "";
  }

  return truncate_at_word(text, limit, options);
}

/**
 * Unified token counter for prompt budgeting (Track 2.2: 6k cliff guard).
 * Prefers the native Perchance tokenizer when available; otherwise budgets on
 * prose averaging ~3.35 characters per token in BPE tokenizers when structured
 * prompt XML and pseudo-JSON brackets are present.
 * @param {string} text
 * @returns {number} Token count (0 for blank input).
 */
export function count_tokens(text) {
  if (!text || typeof text !== "string" || text.length === 0) return 0;
  if (typeof window !== "undefined" && typeof window.generateText === "function") {
    try {
      const meta = window.generateText({ getMetaObject: true });
      if (meta && typeof meta.countTokens === "function") {
        return meta.countTokens(text);
      }
    } catch {
      // Fall through to the character-ratio fallback below.
    }
  }
  return Math.max(1, Math.ceil(text.length / CHARS_PER_TOKEN));
}

/**
 * Legacy token-counter name (pre-Phase-2 `sieve.js` export).
 * Canonical alias of {@link count_tokens}: native Perchance tokenizer when
 * available, otherwise the ~3.35 chars/token character-ratio fallback.
 * @param {string} text
 * @returns {number} Token count (0 for blank input).
 */
export const count_text_tokens = count_tokens;

/**
 * Text sanitization for prompt safety.
 * Removes markdown-like characters and collapses redundant whitespace.
 * @param {string | null | undefined} text
 * @param {number} [limit=500] - Maximum character boundary.
 * @returns {string} Sanitized string.
 */
export function clean_text(text, limit = 500) {
  if (!text || typeof text !== "string") return "";
  const clean = collapse_whitespace(text.replace(/[*_~`#[\]]/g, " "));
  if (limit && clean.length > limit) {
    return truncate_at_word(clean, limit, { ellipsis: "..." });
  }
  return clean;
}

// ============================================================================
// [SECTION 4: STRING FORMATTING & RELATIONAL VECTORS]
// ============================================================================

/**
 * Indents every line after the first (the caller supplies the leading-line
 * prefix) - the continuation-indent counterpart to `indent_all`.
 * @param {string | null | undefined} text
 * @param {number} spaces - Number of leading spaces to apply per continuation line.
 * @returns {string}
 */
export const indent_continuation = (text, spaces) => {
  if (!text) return "";
  const prefix = " ".repeat(spaces);
  return String(text).trim().split("\n").join(`\n${prefix}`);
};

/**
 * Derives up to 3 uppercase initials from an entity name, skipping title/stop
 * prefixes (`NAME_PREFIX_STEMS`) when any remain. Falls back to the raw words
 * when every word is a stop word, and to "?" for empty input.
 * @param {string | null | undefined} text
 * @param {Set<string>} [stop_words=NAME_PREFIX_STEMS]
 * @returns {string}
 */
export function compute_initials(text, stop_words = NAME_PREFIX_STEMS) {
  const words = String(text || "")
    .replace(/[‘’']/g, "")
    .replace(/[^\p{L}\s]/gu, " ")
    .trim()
    .split(/\s+/);
  const filtered = words.filter((word) => !stop_words.has(word.toLowerCase()));
  return (
    (filtered.length ? filtered : words)
      .slice(0, 3)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase() || "?"
  );
}

/**
 * Matches the capitalization of the original string on the replacement string.
 * If the first character of original is uppercase, capitalizes replacement.
 * @param {string | null | undefined} original
 * @param {string | null | undefined} replacement
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
 * Auto-formats object keys into UI labels (e.g. "non_physical" -> "Non-Physical", "future" -> "Future").
 * @param {string | null | undefined} key
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
 * Formats a timestamp as YYYY-MM-DD HH:mm (sv-SE locale, comma separator
 * stripped for a clean clock-style readout).
 * @param {number | string | Date | null | undefined} ts
 * @returns {string}
 */
export function format_datetime(ts) {
  if (!ts) return "---";
  return new Date(ts).toLocaleString("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(",", "");
}

/**
 * Normalizes spacing after commas (e.g. "a,b,c" -> "a, b, c").
 * @param {string} str
 * @returns {string}
 */
export const normalize_comma_spacing = (str) => String(str ?? "").replace(/,([^\s])/g, ", $1");

export * from "./alternations.js";

/**
 * Tests one pattern/key against a haystack. Pass precedence: /regex/ literals
 * first, * ? glob wildcards second, bare strings as case-insensitive
 * whole-word matches last.
 * @param {string} pattern
 * @param {string} haystack
 * @returns {Readonly<{ hit: boolean, pass: "regex"|"glob"|"word"|"none" }>}
 */
export function match_keyword_pattern(pattern, haystack) {
  const needle = String(pattern ?? "").trim();
  const text = String(haystack ?? "");
  if (!needle || !text) return Object.freeze({ hit: false, pass: "none" });
  if (needle.length > 2 && needle.startsWith("/") && needle.lastIndexOf("/") > 0) {
    const last_slash = needle.lastIndexOf("/");
    let regex = null;
    try {
      regex = new RegExp(needle.slice(1, last_slash), needle.slice(last_slash + 1));
    } catch {
      /* invalid regex falls through to glob/word matching below */
    }
    if (regex) {
      const hit = regex.test(text);
      return Object.freeze({ hit, pass: hit ? "regex" : "none" });
    }
  }
  if (needle.includes("*") || needle.includes("?")) {
    const glob = needle
      .split("")
      .map((char) =>
        char === "*" ? ".*"
        : char === "?" ? "."
        : char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      )
      .join("");
    try {
      if (new RegExp(glob, "i").test(text)) return Object.freeze({ hit: true, pass: "glob" });
    } catch {
      /* unreachable - escaped construction cannot throw */
    }
    return Object.freeze({ hit: false, pass: "none" });
  }
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`, "i").test(text)) {
    return Object.freeze({ hit: true, pass: "word" });
  }
  return Object.freeze({ hit: false, pass: "none" });
}
