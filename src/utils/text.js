/**
 * @file src/utils/text.js
 * Pure string processing, word-boundary truncation, token estimation,
 * XML escaping, and style-key resolution.
 */

import { CHARS_PER_TOKEN } from "@config";
import { get_signature_color } from "./palette.js";

/**
 * Common title prefixes and stop words for entity naming and initials calculation.
 * @type {ReadonlyArray<string>}
 */
const NAME_PREFIXES = Object.freeze([
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
]);

/**
 * Stop-word set derived from `NAME_PREFIXES` for `compute_initials`.
 * @type {ReadonlySet<string>}
 */
const NAME_PREFIX_STEMS = Object.freeze(new Set(NAME_PREFIXES));

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
 * Truncates text at a word boundary within `limit`.
 * @param {string | null | undefined} text
 * @param {number} [limit=200]
 * @param {Object} [options={}]
 * @param {string} [options.ellipsis="…"]
 * @param {boolean} [options.reserve_ellipsis=false]
 * @param {number} [options.min_bound_ratio=0]
 * @param {number} [options.min_bound_chars=0]
 * @param {boolean} [options.strip_trailing_punctuation=false]
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
 * Estimates prompt token count using the native Perchance tokenizer when present,
 * falling back to `CHARS_PER_TOKEN` (~3.35 chars/token).
 * @param {string} text
 * @returns {number}
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
      // Fall through to character-ratio estimate.
    }
  }
  return Math.max(1, Math.ceil(text.length / CHARS_PER_TOKEN));
}

/**
 * Strips markdown formatting characters and collapses whitespace.
 * @param {string | null | undefined} text
 * @param {number} [limit=500]
 * @returns {string}
 */
export function clean_text(text, limit = 500) {
  if (!text || typeof text !== "string") return "";
  const clean = collapse_whitespace(text.replace(/[*_~`#[\]]/g, " "));
  if (limit && clean.length > limit) {
    return truncate_at_word(clean, limit, { ellipsis: "..." });
  }
  return clean;
}

/**
 * Derives up to 3 uppercase initials from an entity name, skipping `stop_words`
 * when non-stop words remain.
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
 * Matches the capitalization of `original` on `replacement`.
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
 * Formats snake_case keys into UI labels (e.g. `"non_physical"` -> `"Non-Physical"`).
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
 * Formats a timestamp as Swedish Date Standard (`YYYY-MM-DD HH:MM`).
 * @param {number | string | Date | null | undefined} ts
 * @returns {string}
 */
export function format_datetime(ts) {
  if (!ts) return "---";
  return new Date(ts).toLocaleString("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(",", "");
}

/**
 * Normalizes spacing after commas (e.g. `"a,b,c"` -> `"a, b, c"`).
 * @param {string} str
 * @returns {string}
 */
export const normalize_comma_spacing = (str) => String(str ?? "").replace(/,([^\s])/g, ", $1");

/**
 * Escapes characters for safe use in XML attributes and strict XML nodes.
 * @param {string | null | undefined} str
 * @returns {string}
 */
export function escape_xml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\[/g, "&#91;")
    .replace(/\]/g, "&#93;");
}

/**
 * Escapes only `<` and `>` for LLM prompt text nodes so pseudo-JSON `[KEY: value]`
 * tags and dialogue remain verbatim while preventing tag injection.
 * @param {string | null | undefined} str
 * @returns {string}
 */
export function prompt_escape(str) {
  if (typeof str !== "string") return "";
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Resolves a style key across an explicit override, an app-level choice, and a fallback.
 * @param {string | null | undefined} explicit_style
 * @param {string | null | undefined} app_style
 * @param {Record<string, any>} [registry={}]
 * @param {string} [fallback=""]
 * @returns {string}
 */
export function resolve_style(explicit_style, app_style, registry = {}, fallback = "") {
  if (explicit_style && explicit_style !== "default" && registry?.[explicit_style]) {
    return explicit_style;
  }
  if (app_style && app_style !== "default" && registry?.[app_style]) {
    return app_style;
  }
  return fallback;
}

/**
 * Parses bracket display flags (e.g., `| hide`, `| show`) from a raw bracket value.
 * @param {string | null | undefined} raw_val
 * @returns {{ value: string, is_hidden: boolean }}
 */
export function parse_bracket_display_flags(raw_val) {
  if (typeof raw_val !== "string") {
    return { value: "", is_hidden: false };
  }
  const is_hidden = /(?:^|\s)\|(?:\s*)(?:hide|private)(?:\b|$)/i.test(raw_val);
  const value = raw_val
    .replace(/(?:^|\s)\|(?:\s*)(?:hide|private)(?:\b|$)/gi, "")
    .replace(/(?:^|\s)\|(?:\s*)show(?:\b|$)/gi, "")
    .trim();
  return { value, is_hidden };
}

/**
 * Transforms an entity record into standard Avatar atom props.
 * @param {Record<string, any> | null | undefined} entity
 * @returns {{ src: string, alt: string, initials: string, signature_color: string, flipped: boolean }}
 */
export function entity_avatar_props(entity) {
  if (!entity || typeof entity !== "object") {
    return { src: "", alt: "", initials: "?", signature_color: "var(--color-gunmetal)", flipped: false };
  }

  const name = entity.name || entity.id || "Entity";
  const src = entity.profile_picture || entity.portrait || entity.avatar_url || "";
  const initials = compute_initials(name);
  const signature_color = get_signature_color(entity);
  const flipped = Boolean(entity.modifiers?.flipped);

  return { src, alt: name, initials, signature_color, flipped };
}

/**
 * Converts a style registry map into standard Dropdown item options.
 * @param {Record<string, any> | null | undefined} styles_map
 * @param {string} [default_key="default"]
 * @returns {Array<{ value: string, label: string, portrait: string, tag: string, tooltip: string }>}
 */
export function to_style_dropdown_items(styles_map, default_key = "default") {
  if (!styles_map || typeof styles_map !== "object") {
    return [];
  }

  return Object.values(styles_map).map((style) => ({
    value: style.id || "",
    label: style.name || style.id || "",
    portrait: style.portrait || "",
    tag: style.id === default_key ? "DEFAULT" : style.speaking_style || style.genre || "",
    tooltip: style.description || style.name || "",
  }));
}

const INLINE_TOKEN_REGEX = /\*\*\*([\s\S]+?)\*\*\*|\*\*([\s\S]+?)\*\*|\*([\s\S]+?)\*|"([^"]+)"/g;

/**
 * @typedef {"text" | "strong" | "em" | "strong-em" | "quote"} MarkdownTokenType
 */

/**
 * @typedef {Object} MarkdownToken
 * @property {MarkdownTokenType} type
 * @property {string} content
 */

/**
 * @typedef {MarkdownToken[]} MarkdownParagraph
 */

/**
 * Parses lightweight inline markdown prose into structured paragraph token arrays.
 * @param {string | unknown} text
 * @returns {MarkdownParagraph[]}
 */
export function parse_markdown(text) {
  if (text === null || text === undefined || text === "") return [];

  const raw_str = typeof text !== "string" ? String(text) : text;
  if (!raw_str.trim()) return [];

  return raw_str.split(/\n\s*\n/).map((paragraph) => {
    const normalized = paragraph.replace(/\n/g, " ");
    /** @type {MarkdownToken[]} */
    const tokens = [];
    let last_index = 0;
    let match;

    INLINE_TOKEN_REGEX.lastIndex = 0;

    while ((match = INLINE_TOKEN_REGEX.exec(normalized)) !== null) {
      if (match.index > last_index) {
        tokens.push({ type: "text", content: normalized.substring(last_index, match.index) });
      }

      if (match[1] !== undefined) {
        tokens.push({ type: "strong-em", content: match[1] });
      } else if (match[2] !== undefined) {
        tokens.push({ type: "strong", content: match[2] });
      } else if (match[3] !== undefined) {
        tokens.push({ type: "em", content: match[3] });
      } else if (match[4] !== undefined) {
        tokens.push({ type: "quote", content: match[4] });
      }

      last_index = match.index + match[0].length;
    }

    if (last_index < normalized.length) {
      tokens.push({ type: "text", content: normalized.substring(last_index) });
    }

    return tokens;
  });
}
