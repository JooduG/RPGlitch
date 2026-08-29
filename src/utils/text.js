/**
 * src/utils/text.js
 * 📝 TEXT & PROSE PROCESSING ENGINE
 *
 * Core Responsibilities:
 * - Pure, stateless string manipulation, parsing, and formatting utilities.
 * - Cognition Stripping (`strip_cognition_blocks`): Strips `<think>...</think>` internal monologue blocks
 *   and model artifacts from AI responses before display, history persistence, or image generation.
 * - Pseudo-JSON & State Extraction (`safe_parse_pseudo_json`): Extracts bracketed `[KEY: VALUE]` parameters,
 *   enforcing universal atomic clearing (`CLEAR_TOKENS`), multi-item aggregation (`AGGREGATE_KEYS`), and raw prose fallback.
 * - Present State Field Mutation (`merge_prose_into_field`): Merges new bracket directives and state prose into
 *   physical/non-physical character fields.
 * - Relational Vector Serialization (`parse_relational_vector`, `format_relational_vector`): Manages directed graph edge syntax.
 * - Story Transcript & History Utilities: History collapsing, story title decomposition with entity colors,
 *   Swedish datetime formatting, and JSON quote escaping.
 *
 * Consumed across the engine by UI, State, Media, and Intelligence layers.
 */

import { CLOTHING_KEYS } from "./xml.js";

// ============================================================================
// [SECTION 1: CONSTANTS & TOKEN SETS]
// ============================================================================

/**
 * Universal atomic-clearing tokens — emitting `[KEY: one of these]` deletes KEY
 * from the present-state dictionary (e.g. `[HELD: none]`, `[INJURY: healed]`,
 * `[STATUS: normal]`, `[SECRET: cleared]`).
 * @type {ReadonlySet<string>}
 */
export const CLEAR_TOKENS = Object.freeze(new Set(["none", "bare", "naked", "off", "removed", "disrobed", "healed", "cleared", "normal"]));

/**
 * Keys whose repeated brackets aggregate into a single multi-item array.
 * @type {ReadonlySet<string>}
 */
export const AGGREGATE_KEYS = Object.freeze(new Set(["INVENTORY", "STASH"]));

/**
 * Model artifact leading prefixes to strip from prose output.
 */
const MODEL_ARTIFACT_PATTERNS = [/^Mattis\b(?:\.\s*Archetypes:[^\n]*\n*|\.|:|\s)*/i];

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
 * @typedef {Object} ParsedRelationalVector
 * @property {string} source_name - Source node entity name.
 * @property {string} target_name - Target node entity name.
 * @property {string} dynamic - Relationship bond or tension dynamic.
 * @property {string} raw - Original unparsed string.
 */

/**
 * @typedef {Object} StoryTitlePart
 * @property {string} text - Text slice.
 * @property {string} [color] - Entity signature color code.
 */

/**
 * @typedef {Object} HistoryMessage
 * @property {string} [role] - Message turn role.
 * @property {string} [content] - Message primary content.
 * @property {string} [text] - Fallback text content.
 * @property {string} [character_name] - Name of speaking character.
 */

/**
 * @typedef {Object} CollapsedHistoryEntry
 * @property {string} role - Standardized role ("USER_PERSONA" | "FRACTAL" | "AI_CHARACTER").
 * @property {string} name - Entity display name.
 * @property {string} content - Collapsed message content.
 */

// ============================================================================
// [SECTION 2: COGNITION & SANITIZATION UTILITIES]
// ============================================================================

/**
 * Strips cognition blocks (`<think>...</think>`) and model artifacts from prose.
 * @param {string | null | undefined} text - Input text.
 * @returns {string} Cleaned prose without internal thoughts.
 */
export function strip_cognition_blocks(text) {
  if (!text) return "";
  let clean = text.replace(/<think\b[^>]*>[\s\S]*?(?:<\/think\s*>|$)\r?\n?/gi, "");
  clean = clean.replace(/<\/think\s*>/gi, "");
  for (const pattern of MODEL_ARTIFACT_PATTERNS) {
    clean = clean.replace(pattern, "");
  }
  return clean.trim();
}

/**
 * Extracts the outermost JSON object from a raw string.
 * Strips markdown code fences and isolates the substring between the first "{" and last "}".
 * @param {string | null | undefined} raw
 * @returns {string | null} Extracted JSON string, or null if no braces found.
 */
export function extract_json_block(raw) {
  if (!raw || typeof raw !== "string") return null;
  const stripped = raw.replace(/```json\n?|```/g, "").trim();
  const first_brace = stripped.indexOf("{");
  const last_brace = stripped.lastIndexOf("}");
  if (first_brace === -1 || last_brace === -1) return null;
  return stripped.substring(first_brace, last_brace + 1);
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
  let clean = text.replace(/[*_~`#[\]]/g, " ");
  clean = clean.replace(/\s+/g, " ").trim();
  if (limit && clean.length > limit) {
    clean = `${clean.substring(0, limit).trim()}...`;
  }
  return clean;
}

/**
 * Replaces unescaped interior double-quotes with backslashed equivalents (\") inside JSON string values.
 * @param {string} json_string
 * @returns {string}
 */
export function escape_unescaped_json_quotes(json_string) {
  if (typeof json_string !== "string") return json_string;
  return json_string.replace(/:\s*"([\s\S]*?)"(?=,\s*"[^"]+"\s*:|\s*\}|\s*\]|$)/g, (_match, value) => {
    const escaped_value = value.replace(/(?<!\\)"/g, '\\"');
    return `: "${escaped_value}"`;
  });
}

// ============================================================================
// [SECTION 3: PSEUDO-JSON & FIELD MERGING]
// ============================================================================

/**
 * High-fidelity parser that extracts pseudo-JSON configurations.
 * Exclusively parses bracketed `[KEY: VALUE]` parameters.
 * @param {string | null | undefined} raw - Raw input text.
 * @returns {Record<string, string | string[]>} Extracted key-value pairs.
 */
export const safe_parse_pseudo_json = (raw) => {
  if (!raw || typeof raw !== "string") return {};
  const clean_raw = strip_cognition_blocks(raw).trim();
  if (!clean_raw) return {};

  // Tier 1: Process bracketed configuration [KEY: VALUE] or [KEY: VALUE] [KEY2: VALUE2]
  if (clean_raw.includes("[") && clean_raw.includes("]")) {
    /** @type {Record<string, string | string[]>} */
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

      // Multi-item aggregation: repeated INVENTORY/STASH brackets merge into one list.
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

    if (matched_any) return bracket_extracted;
  }

  // Tier 2: Process quoted key-value pairs "KEY": "VALUE" or JSON {"KEY": "VALUE"}
  if (clean_raw.includes('"') && clean_raw.includes(":")) {
    /** @type {Record<string, string | string[]>} */
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

  // Tier 3: No structured keys found — preserve raw prose sentinel.
  return { __raw_prose__: clean_raw };
};

/**
 * Pure simulation function that merges newly emitted [KEY: VALUE] bracket directives
 * into an entity's present physical/non-physical state field.
 * @param {string | null | undefined} current_field_value - Current field string.
 * @param {string | null | undefined} new_prose - Newly emitted mutations.
 * @returns {string} Reconciled state field string.
 */
export function merge_prose_into_field(current_field_value, new_prose) {
  if (!new_prose || !new_prose.trim()) return current_field_value || "";

  const MAX_FIELD_CHARS = 2000;
  const parsed = safe_parse_pseudo_json(current_field_value);
  const clean_new_prose = new_prose.trim();

  // Plain prose field (no structured keys, or raw-prose sentinel)
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

  // Apply structured key updates in sequence
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

    if (is_clear_token) {
      delete parsed[key];
      continue;
    }

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
      const clean_existing = String(parsed[cond_key])
        .replace(/^[\s,]+|[\s,]+$/g, "")
        .replace(/,\s*,+/g, ", ");
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
}

// ============================================================================
// [SECTION 4: STRING FORMATTING & RELATIONAL VECTORS]
// ============================================================================

/**
 * Safely indents multi-line string content.
 * @param {string | null | undefined} text
 * @param {number} spaces - Number of leading spaces to apply per line.
 * @returns {string}
 */
export const ind = (text, spaces) => {
  if (!text) return "";
  const prefix = " ".repeat(spaces);
  return String(text).trim().split("\n").join(`\n${prefix}`);
};

/**
 * Derives up to 3 uppercase initials from a style or entity name.
 * @param {string | null | undefined} name - Style or entity display name.
 * @returns {string} Up to 3 uppercase initial letters.
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
 * Extracts a single short sentence (<= max_len chars) from a blob of text.
 * Strips think blocks, markdown fences, and excessive whitespace.
 * @param {string | null | undefined} text
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
  return new Date(ts)
    .toLocaleString("sv-SE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(",", "");
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

  return {
    source_name,
    target_name,
    dynamic,
    raw,
  };
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
  const cleaned = text
    .trim()
    .replace(/^["'“”«»]+|["'“”«»]+$/g, "")
    .replace(/\s+/g, " ");

  if (!cleaned) return "";

  if (cleaned.length <= max_len) {
    return cleaned.replace(/[.,;:]+$/, "");
  }

  const sub = cleaned.slice(0, max_len);
  const last_space = sub.lastIndexOf(" ");
  const truncated = last_space > 15 ? sub.slice(0, last_space) : sub;
  return truncated.replace(/[.,;:]+$/, "") + "…";
}

// ============================================================================
// [SECTION 5: HISTORY & STORY TITLE DECOMPOSITION]
// ============================================================================

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
      matches.push({
        name: ai.name,
        color: get_color(ai),
        start: idx,
        end: idx + ai.name.length,
      });
    }
  }
  if (user?.name && (!ai?.name || user.name !== ai.name)) {
    const idx = clean.indexOf(user.name);
    if (idx !== -1) {
      matches.push({
        name: user.name,
        color: get_color(user),
        start: idx,
        end: idx + user.name.length,
      });
    }
  }
  if (fractal?.name) {
    const idx = clean.indexOf(fractal.name);
    if (idx !== -1) {
      matches.push({
        name: fractal.name,
        color: get_color(fractal),
        start: idx,
        end: idx + fractal.name.length,
      });
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

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured 5 clear section dividers, exported frozen collections (CLEAR_TOKENS, AGGREGATE_KEYS,
 *   NAME_PREFIXES), added comprehensive JSDoc schemas, and verified 100% test pass.
 * - 2026-06-15: Initial text processing engine with bracket pseudo-JSON parser and state merging.
 */
