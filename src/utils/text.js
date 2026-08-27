/**
 * src/utils/text.js
 * 📝 TEXT UTILITIES
 * Pure, stateless text formatting helpers.
 * ZERO dependencies on any architectural layer.
 */

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
 * Formats a timestamp as YYYY-MM-DD HH:mm (sv-SE locale, comma separator
 * stripped for a clean clock-style readout). Shared by the story card, the
 * dev console, and the markdown story export.
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

/**
 * @typedef {Object} ParsedRelationalVector
 * @property {string} source_name
 * @property {string} target_name
 * @property {string} dynamic
 * @property {string} raw
 */

/**
 * Parses a directed relational vector string: "[Source] → [Target]: [Dynamic]".
 * Tolerates various arrow notations (→, ->, —, =>).
 * @param {string|null|undefined} vector_str
 * @returns {ParsedRelationalVector | null}
 */
export function parse_relational_vector(vector_str) {
  if (!vector_str || typeof vector_str !== "string") return null;
  const raw = vector_str.trim();
  if (!raw) return null;

  // Match: Source → Target: Dynamic (or Source -> Target: Dynamic)
  // Allows hyphens in source/target names (e.g. "Nova-City", "K-9") while detecting arrows (→, ->, —>, =>, —)
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
 * Decomposes a flat story title into styled title parts matching active entities.
 * Highlights AI, User, and Fractal names with their signature colors.
 * @param {string} title
 * @param {{ ai?: any, user?: any, fractal?: any, get_color?: (e: any) => string }} entities
 * @returns {Array<{text: string, color?: string}>}
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

  // Sort by starting position
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
 * Extracts the outermost JSON object from a raw string.
 * Strips markdown code fences and isolates the substring between the first "{" and last "}".
 * @param {string} raw
 * @returns {string|null} The extracted JSON string, or null if no braces found.
 */
export function extract_json_block(raw) {
  if (!raw) return null;
  const stripped = raw.replace(/```json\n?|```/g, "").trim();
  const first_brace = stripped.indexOf("{");
  const last_brace = stripped.lastIndexOf("}");
  if (first_brace === -1 || last_brace === -1) return null;
  return stripped.substring(first_brace, last_brace + 1);
}

/**
 * Text sanitization for prompt safety.
 * Removes markdown-like characters and collapses whitespace.
 * @param {string|null|undefined} text
 * @param {number} [limit=500]
 * @returns {string}
 */
export function clean_text(text, limit = 500) {
  if (!text) return "";
  let clean = text.replace(/[*_~`#[\]]/g, " ");
  clean = clean.replace(/\s+/g, " ").trim();
  if (limit && clean.length > limit) {
    clean = `${clean.substring(0, limit).trim()}...`;
  }
  return clean;
}
