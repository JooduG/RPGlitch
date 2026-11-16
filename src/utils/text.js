/**
 * src/utils/text.js
 * 📝 TEXT & PROSE PROCESSING ENGINE
 *
 * Core Responsibilities:
 * - Pure, stateless string manipulation, parsing, and formatting utilities.
 * - Shared write-guard predicates (`is_telemetry_meta`,
 *   `is_empty_narrative_message`) for the persistence write paths.
 * - Relational Vector Serialization (`parse_relational_vector`, `format_relational_vector`): Manages directed graph edge syntax.
 * - Story Transcript & History Utilities: History collapsing, story title decomposition with entity colors,
 *   Swedish datetime formatting, and JSON quote escaping.
 * (Bracket tokenization, LLM/cognition sanitization and pseudo-JSON repair
 * live in `./tags.js` + `./llm-sanitize.js`; import from the `@utils` barrel.)
 *
 * Consumed across the engine by UI, State, Media, and Intelligence layers.
 */

import { CANONICAL_ROLES, CHARS_PER_TOKEN } from "@config";
import { escape_xml, prompt_escape } from "./xml.js";
import { strip_cognition_blocks } from "./llm-sanitize.js";

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
 * Heuristic token estimator for prompt budgeting (Track 2.2: 6k cliff guard).
 * Inference servers bill and truncate on tokens; prose averages ~3.35 characters
 * per token in BPE tokenizers when structured prompt XML and pseudo-JSON brackets are present.
 * @param {string} text
 * @returns {number} Estimated token count (0 for blank input).
 */
export function estimate_tokens(text) {
  const length = String(text ?? "").length;
  if (length === 0) return 0;
  return Math.max(1, Math.ceil(length / CHARS_PER_TOKEN));
}

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
 * Extracts a single short sentence (<= max_len chars) from a blob of text.
 * Strips think blocks, markdown fences, and excessive whitespace.
 * @param {string | null | undefined} text
 * @param {number} [max_len=160]
 * @returns {string}
 */
export function first_sentence(text, max_len = 160) {
  const clean = collapse_whitespace(strip_cognition_blocks(text).replace(/```/g, ""));
  if (!clean) return "";
  const regex = new RegExp(`^[^.!?]{1,${max_len}}[.!?:;]?`);
  const m = clean.match(regex);
  const sentence = (m ? m[0] : clean.slice(0, max_len)).trim();
  return sentence;
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
 * Parses a directed relational vector string: `"[Source] → [Target]: [Dynamic]"`.
 * Tolerates various arrow notations (`→`, `->`, `—>`, `=>`, `—`).
 * @param {string | null | undefined} vector_str
 * @returns {ParsedRelationalVector | null}
 */
export function parse_relational_vector(vector_str) {
  if (!vector_str || typeof vector_str !== "string") return null;
  const raw = vector_str.trim();
  if (!raw) return null;

  // Match: Source → Target: Dynamic (or Source -> Target: Dynamic)
  const match = raw.match(/^([^\n→—=>:]+?)\s*(?:→|->|—>|=>|—)\s*([^\n:]+?)(?:\s*:\s*([\s\S]*))?$/);
  if (!match) return null;

  const source_name = (match[1] || "").trim();
  const target_name = (match[2] || "").trim();
  const dynamic = (match[3] || "").trim();

  if (!source_name || !target_name) return null;

  return { source_name, target_name, dynamic, raw };
}

/**
 * Formats a canonical directed relational vector string.
 * @param {string} source_name
 * @param {string} target_name
 * @param {string} [dynamic=""]
 * @returns {string}
 */
export function format_relational_vector(source_name, target_name, dynamic = "") {
  const src = (source_name || "").trim();
  const tgt = (target_name || "").trim();
  const dyn = (dynamic || "").trim();
  if (!src || !tgt) return "";
  return dyn ? `${src} → ${tgt}: ${dyn}` : `${src} → ${tgt}`;
}

/**
 * Derives a punchy single-line header title from directive text.
 * @param {string | null | undefined} text - Raw directive text.
 * @param {number} [max_len=38] - Target maximum length.
 * @returns {string}
 */
export function derive_vector_title(text, max_len = 38) {
  if (!text || typeof text !== "string") return "";
  const cleaned = collapse_whitespace(text.replace(/^["'“”«»]+|["'“”«»]+$/g, ""));
  if (!cleaned) return "";
  return truncate_at_word(cleaned, max_len, { min_bound_chars: 15, strip_trailing_punctuation: true });
}

// ============================================================================
// [SECTION 5: HISTORY & STORY TITLE DECOMPOSITION]
// ============================================================================

/**
 * Maps an entry/message role to its human-readable display label used in
 * history envelopes (`User` / `Fractal` / `Character`). Single source for the
 * role→label ternary previously duplicated in history.js and transport.js.
 * @param {string | null | undefined} role
 * @returns {"User" | "Fractal" | "Character"}
 */
export function role_display_label(role) {
  const key = String(role || "").toLowerCase();
  if (key === "user" || key === "user_persona") return "User";
  if (key === "fractal") return "Fractal";
  return "Character";
}

/**
 * Resolves any raw role string to its canonical Sovereign RPGlitch role.
 *
 * @param {string|null|undefined} role
 * @returns {"user" | "ai" | "npc" | "fractal" | "system" | string}
 */
export function canonicalize_role(role) {
  const normalized = String(role || "")
    .toLowerCase()
    .trim();
  if (normalized === "user" || normalized === "user_persona") {
    return CANONICAL_ROLES.USER;
  }
  if (normalized === "ai" || normalized === "ai_character" || normalized === "model" || normalized === "assistant") {
    return CANONICAL_ROLES.AI;
  }
  if (normalized === "npc") {
    return CANONICAL_ROLES.NPC;
  }
  if (normalized === "fractal" || normalized === "prologue" || normalized === "epilogue" || normalized === "narrator") {
    return CANONICAL_ROLES.FRACTAL;
  }
  if (normalized === "system" || normalized === "telemetry") {
    return CANONICAL_ROLES.SYSTEM;
  }
  return role ? String(role).toLowerCase().trim() : CANONICAL_ROLES.AI;
}

/**
 * Canonical normalizer for turn beats, simulation log rows, and narrative dialog.
 * Unifies role mapping, cognition stripping, whitespace normalization, speaker
 * attribution, and image attachments into a clean, frozen record.
 *
 * @param {any} entry - Raw dialogue or log entry object.
 * @param {Object} [options={}]
 * @param {boolean} [options.include_cognition=false] - Whether to preserve <think> blocks.
 * @param {boolean} [options.normalize_whitespace=false] - Collapse multiple whitespace chars to single spaces.
 * @param {number} [options.max_chars] - Word-boundary character truncation limit.
 * @param {string} [options.text_source="content"] - "content" reads content ?? text; "text" reads text only.
 * @param {string} [options.label_policy="entry"] - "entry" resolves full origin chain; "visual" resolves Name: label.
 * @param {string} [options.label_fallback] - Fallback when attribution is unresolved.
 * @returns {Readonly<{
 *   role: string,
 *   raw_role: string,
 *   origin: string,
 *   character_name: string,
 *   text: string,
 *   attachments: ReadonlyArray<any>,
 *   round: number | null,
 *   timestamp: number | null,
 *   raw_entry: any
 * }>|null}
 */
export function normalize_history_beat(entry, options = {}) {
  if (!entry || typeof entry !== "object") return null;

  const { include_cognition = false, normalize_whitespace = false, max_chars, text_source = "content", label_policy = "entry", label_fallback } = options;

  const raw_role = String(entry.role || "");
  const canonical_role = canonicalize_role(raw_role);

  const raw_text = text_source === "text" ? entry?.text : (entry?.content ?? entry?.text);
  let text = String(raw_text ?? "");
  if (!include_cognition) {
    text = strip_cognition_blocks(text);
  }
  text = text.trim();
  if (normalize_whitespace) {
    text = collapse_whitespace(text);
  }
  if (max_chars && max_chars > 0) {
    text = truncate_at_word(text, max_chars);
  }

  const fallback =
    label_fallback ??
    (label_policy === "visual" ? "narrator"
    : canonical_role === CANONICAL_ROLES.USER ? "User"
    : canonical_role === CANONICAL_ROLES.FRACTAL ? "Fractal"
    : "Character");

  const origin =
    label_policy === "visual" ?
      entry?.character_name || entry?.role || fallback
    : entry?.entity_id || entry?.origin || entry?.character_name || entry?.name || (entry?.role ? role_display_label(entry.role) : "") || fallback;

  const character_name = String(
    entry?.character_name || (canonical_role === CANONICAL_ROLES.USER ? "You" : entry?.origin || entry?.name || (origin !== fallback ? origin : "")),
  ).trim();

  const attachments = Array.isArray(entry.attachments) ? Object.freeze([...entry.attachments]) : Object.freeze([]);
  const round = entry.round != null && Number.isFinite(Number(entry.round)) ? Number(entry.round) : null;
  const timestamp = entry.timestamp ?? entry.created_at ?? null;

  return Object.freeze({ role: canonical_role, raw_role, origin: String(origin), character_name, text, attachments, round, timestamp, raw_entry: entry });
}

/**
 * @param {string | null | undefined} role
 * @returns {boolean} Whether a role is a narrative participant.
 */
export function is_narrative_role(role) {
  if (role == null) return false;
  return String(role).toLowerCase() !== CANONICAL_ROLES.SYSTEM;
}

/**
 * Collapses conversation history into role-grouped entries.
 * Consecutive messages from the same character are merged into a single entry.
 * @param {Array<HistoryMessage>} messages
 * @param {{ separator?: string, stripBoldQuotes?: boolean }} [options={}]
 * @returns {Array<CollapsedHistoryEntry>}
 */
export function collapse_history(messages, options = {}) {
  const { separator = "\n", stripBoldQuotes = false } = options;
  if (!Array.isArray(messages) || messages.length === 0) return [];

  const collapsed = [];
  for (const m of messages) {
    if (m.role === "system") continue;
    const lower_role = (m.role || "").toLowerCase();
    const role =
      ["user", "user_persona"].includes(lower_role) ? "user_persona"
      : ["prologue", "fractal"].includes(lower_role) ? "fractal"
      : "ai_character";
    const name = m.character_name || "";
    let content = strip_cognition_blocks(m.content || m.text || "");
    if (stripBoldQuotes) {
      content = content.replace(/\*\*\s*"(.*?)"\s*\*\*/g, '"$1"');
    }
    if (!content) continue;

    const last = collapsed[collapsed.length - 1];
    const is_same_speaker = last && last.role === role && last.name === name && (last.origin || "") === (m.origin || "");
    if (is_same_speaker) {
      last.content += `${separator}${content}`;
    } else {
      collapsed.push({ role, name, content, origin: m.origin });
    }
  }
  return collapsed;
}

/**
 * Filters a sequence of dialogue messages or log records to retain only narrative turns.
 * Strips out system messages and optionally excludes consolidated rounds.
 *
 * @param {Array<any>} messages - Array of dialogue/log records.
 * @param {Object} [options={}]
 * @param {boolean} [options.exclude_consolidated=false] - Whether to exclude turns already consolidated into memories.
 * @returns {Array<any>} Filtered narrative message records.
 */
export function filter_narrative_messages(messages, options = {}) {
  if (!Array.isArray(messages) || messages.length === 0) return [];
  const { exclude_consolidated = false, keep_resolved_image_rows = false } = options;

  return messages.filter((message) => {
    if (!message || message.role === CANONICAL_ROLES.SYSTEM) return false;
    if (exclude_consolidated && message.meta?.consolidated) return false;
    const text = String(message.content ?? message.text ?? "").trim();
    if (!text && !message.meta?.is_prologue && !message.meta?.is_epilogue) {
      if (keep_resolved_image_rows && Array.isArray(message.attachments)) {
        const first_source = message.attachments[0]?.src;
        if (typeof first_source === "string" && first_source.trim()) return true;
      }
      return false;
    }
    return true;
  });
}

/**
 * Universal conversation history serializer.
 * Transforms an array of messages/entries into clean XML `<ENTRY>` sequences with origin attributes,
 * round counters, stripped cognition blocks, and optional word-boundary truncation.
 *
 * @param {Array<any>} messages - Array of dialogue/log entries.
 * @param {Object} [options={}]
 * @param {number} [options.limit] - Optional window limit of entries to include from the end.
 * @param {number} [options.offset=0] - Offset from the end of the history window.
 * @param {number} [options.max_chars] - Maximum characters per entry before word-boundary truncation.
 * @param {boolean} [options.collapse=true] - Whether to collapse consecutive turns from the same speaker.
 * @param {string} [options.separator="\n\n"] - Separator between merged paragraphs in collapsed turns.
 * @param {boolean} [options.stripBoldQuotes=false] - Whether to strip bold markdown quotes during collapsing.
 * @param {number} [options.indent=0] - Leading space indentation preceding each <ENTRY> tag.
 * @returns {string} XML formatted <ENTRY> sequence string.
 */
export function format_history_entries(messages, options = {}) {
  if (!messages) return "";
  if (typeof messages === "string") return messages;
  if (!Array.isArray(messages) || messages.length === 0) return "";

  const { limit, offset = 0, max_chars, collapse = true, separator = "\n\n", stripBoldQuotes = false, indent = 0 } = options;

  const raw_entries = collapse ? collapse_history(messages, { separator, stripBoldQuotes }) : messages;

  const total = raw_entries.length;
  const start_index = limit ? Math.max(0, total - (limit + offset)) : 0;
  const end_index = Math.max(0, total - offset);

  const prefix = indent > 0 ? " ".repeat(indent) : "";

  return raw_entries
    .slice(start_index, end_index)
    .map((entry, index) => {
      const raw_text = String(entry?.content ?? entry?.text ?? "");
      const clean_text = strip_cognition_blocks(raw_text).trim();
      if (!clean_text) return null;

      const origin = entry.origin || entry.character_name || entry.name || (entry.role ? role_display_label(entry.role) : "") || "Character";
      const round_number = start_index + index + 1;
      const content = max_chars ? truncate_at_word(clean_text, max_chars) : clean_text;

      return `${prefix}<ACTION round="${round_number}" origin="${escape_xml(origin)}">${prompt_escape(content)}</ACTION>`;
    })
    .filter(Boolean)
    .join("\n");
}

/**
 * Decomposes a flat story title into styled title parts matching active entities.
 * Highlights AI, User, and Fractal names with their signature colors.
 * @param {string | null | undefined} title
 * @param {{ ai?: any, user?: any, fractal?: any, get_color?: (e: any) => string }} [entities={}]
 * @returns {Array<StoryTitlePart>}
 */
export function decompose_story_title(title, entities = {}) {
  if (!title || typeof title !== "string") return [{ text: "" }];
  const clean = title.trim();
  if (!clean) return [{ text: "" }];

  const { ai, user, fractal, get_color = () => "" } = entities;
  const matches = [];

  if (ai?.name) {
    const idx = clean.indexOf(ai.name);
    if (idx !== -1) {
      matches.push({ name: ai.name, color: get_color(ai), start: idx, end: idx + ai.name.length });
    }
  }
  if (user?.name && (!ai?.name || user.name !== ai.name)) {
    const idx = clean.indexOf(user.name);
    if (idx !== -1) {
      matches.push({ name: user.name, color: get_color(user), start: idx, end: idx + user.name.length });
    }
  }
  if (fractal?.name) {
    const idx = clean.indexOf(fractal.name);
    if (idx !== -1) {
      matches.push({ name: fractal.name, color: get_color(fractal), start: idx, end: idx + fractal.name.length });
    }
  }

  if (matches.length === 0) {
    return [{ text: clean }];
  }

  matches.sort((a, b) => a.start - b.start);

  const parts = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start > cursor) {
      parts.push({ text: clean.slice(cursor, m.start) });
    }
    if (m.start >= cursor) {
      parts.push({ text: m.name, color: m.color });
      cursor = m.end;
    }
  }
  if (cursor < clean.length) {
    parts.push({ text: clean.slice(cursor) });
  }

  return parts;
}

/**
 * Normalizes spacing after commas (e.g. "a,b,c" -> "a, b, c").
 * @param {string} str
 * @returns {string}
 */
export const normalize_comma_spacing = (str) => str.replace(/,([^\s])/g, ", $1");

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
    try {
      if (new RegExp(needle.slice(1, last_slash), needle.slice(last_slash + 1)).test(text)) {
        return Object.freeze({ hit: true, pass: "regex" });
      }
    } catch {
      /* invalid regex falls through to literal matching */
    }
    return Object.freeze({ hit: false, pass: "none" });
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

// ============================================================================
// [SHARED WRITE-GUARD PREDICATES — single home for db.js + sessions.svelte.js]
// ============================================================================

const TELEMETRY_MESSAGE_TYPES = new Set(["DYNAMICS_DELTA", "STORY_START", "VECTOR_RESOLUTION", "CONTINUUM_FORMATION", "MEMORY_FORMATION"]);

/**
 * Shared telemetry predicate (db.js + sessions.svelte.js write guards).
 * @param {any} meta
 * @returns {boolean}
 */
export function is_telemetry_meta(meta) {
  return Boolean(meta) && (TELEMETRY_MESSAGE_TYPES.has(meta.type) || Boolean(meta.is_telemetry));
}

/**
 * Shared empty-write predicate (db.js + sessions.svelte.js write guards).
 * @param {string} text
 * @param {{ attachments?: any[], meta?: any }} [options={}]
 * @returns {boolean}
 */
export function is_empty_narrative_message(text, { attachments = [], meta = {} } = {}) {
  return (
    typeof text === "string" &&
    !text.trim() &&
    (!attachments || attachments.length === 0) &&
    !meta?.is_prologue &&
    !meta?.is_epilogue &&
    !is_telemetry_meta(meta)
  );
}
