/**
 * src/utils/tags.js
 * ============================================================================
 * Shared tagged-entry `[KEY: VALUE | flags]` tokenizer + tag helpers.
 * Pure, stateless, domain-agnostic. No upward imports.
 * Phase 1 unification: moved verbatim from src/data/parser.js (bracket core),
 * src/utils/text.js (pseudo-JSON / merge / repair / bond / key sets) and
 * src/utils/xml.js (physical/clothing key normalization).
 * ============================================================================
 */

import { collapse_whitespace } from "./text.js";
import { strip_cognition_blocks } from "./llm-sanitize.js";

/**
 * Bracket Format: [KEY: VALUE | flags]
 * Flags: | hide, | show, | w: <1-10>, | is_origin
 *
 * Invariant: Pipes inside `{Option A | Option B}` alternation scopes are NOT
 * treated as metadata flag separators.
 */

/**
 * Parses a single bracket token string like "[KEY: value | hide | w: 8]".
 * Key is normalized to uppercase.
 * Safely isolates pipes inside `{A | B}` alternation scopes.
 *
 * @param {string} bracket_string
 * @returns {{ key: string, value: string, flags: { hide: boolean, show: boolean, is_origin: boolean, weight?: number }, raw: string } | null}
 */
export function parse_bracket_token(bracket_string) {
  if (!bracket_string || typeof bracket_string !== "string") return null;

  const trimmed = bracket_string.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return null;

  const inner = trimmed.slice(1, -1).trim();
  const colon_index = inner.indexOf(":");
  if (colon_index === -1) return null;

  const raw_key = inner.slice(0, colon_index).trim();
  const key = raw_key.toUpperCase();
  const payload = inner.slice(colon_index + 1).trim();

  // Walk payload character-by-character to locate top-level pipes outside { ... }
  const segments = [];
  let current_segment = "";
  let brace_depth = 0;

  for (let i = 0; i < payload.length; i++) {
    const character = payload[i];
    if (character === "{") {
      brace_depth++;
      current_segment += character;
    } else if (character === "}") {
      brace_depth = Math.max(0, brace_depth - 1);
      current_segment += character;
    } else if (character === "|" && brace_depth === 0) {
      segments.push(current_segment.trim());
      current_segment = "";
    } else {
      current_segment += character;
    }
  }
  segments.push(current_segment.trim());

  const value = segments[0] || "";
  const flags = { hide: false, show: false, is_origin: false, weight: undefined };

  for (let j = 1; j < segments.length; j++) {
    const flag = segments[j].toLowerCase();
    if (flag === "hide") {
      flags.hide = true;
    } else if (flag === "show") {
      flags.show = true;
    } else if (flag === "is_origin" || flag === "origin") {
      flags.is_origin = true;
    } else if (flag.startsWith("w:") || flag.startsWith("weight:")) {
      const parts = flag.split(":");
      const parsed_number = parseInt(parts[1]?.trim(), 10);
      if (!isNaN(parsed_number)) {
        flags.weight = Math.min(10, Math.max(1, parsed_number));
      }
    }
  }

  return { key, value, flags, raw: trimmed };
}

/**
 * Extracts all top-level bracket tokens from a multiline string.
 *
 * @param {string} text
 * @returns {Array<ReturnType<typeof parse_bracket_token>>}
 */
export function parse_brackets(text) {
  if (!text || typeof text !== "string") return [];

  const tokens = [];
  let bracket_depth = 0;
  let start_index = -1;

  for (let i = 0; i < text.length; i++) {
    const character = text[i];
    if (character === "[") {
      if (bracket_depth === 0) {
        start_index = i;
      }
      bracket_depth++;
    } else if (character === "]") {
      if (bracket_depth > 0) {
        bracket_depth--;
        if (bracket_depth === 0 && start_index !== -1) {
          const raw = text.slice(start_index, i + 1);
          const parsed = parse_bracket_token(raw);
          if (parsed) tokens.push(parsed);
          start_index = -1;
        }
      }
    }
  }

  return tokens;
}

/**
 * Parses all [KEY: value | flags] bracket entries from a text string with token positions.
 *
 * @param {string|null|undefined} text
 * @returns {Array<{ key: string, original_key: string, value: string, visibility: 'show'|'hide', weight: number, status: 'active'|'superseded', raw: string, start_index: number, end_index: number }>}
 */
export function parse_bracket_entries(text) {
  if (!text || typeof text !== "string") return [];

  const entries = [];
  const length = text.length;
  let index = 0;

  while (index < length) {
    if (text[index] === "[") {
      const start_index = index;
      let depth = 1;
      let brace_depth = 0;
      let end_index = -1;

      for (let cursor = index + 1; cursor < length; cursor++) {
        const character = text[cursor];

        if (character === "{") {
          brace_depth++;
        } else if (character === "}") {
          if (brace_depth > 0) brace_depth--;
        } else if (character === "[" && brace_depth === 0) {
          depth++;
        } else if (character === "]" && brace_depth === 0) {
          depth--;
          if (depth === 0) {
            end_index = cursor;
            break;
          }
        }
      }

      if (end_index !== -1) {
        const raw = text.slice(start_index, end_index + 1);
        const inner_content = text.slice(start_index + 1, end_index).trim();
        const colon_index = inner_content.indexOf(":");

        if (colon_index !== -1) {
          const original_key = inner_content.slice(0, colon_index).trim();
          const key = original_key.toUpperCase();
          const remainder = inner_content.slice(colon_index + 1).trim();

          const segments = [];
          let segment_start = 0;
          let current_brace_depth = 0;

          for (let character_index = 0; character_index < remainder.length; character_index++) {
            const current_char = remainder[character_index];
            if (current_char === "{") {
              current_brace_depth++;
            } else if (current_char === "}") {
              if (current_brace_depth > 0) current_brace_depth--;
            } else if (current_char === "|" && current_brace_depth === 0) {
              segments.push(remainder.slice(segment_start, character_index).trim());
              segment_start = character_index + 1;
            }
          }
          segments.push(remainder.slice(segment_start).trim());

          const value = segments[0] || "";
          let visibility = "show";
          let weight = 5;
          let status = "active";

          for (let flag_index = 1; flag_index < segments.length; flag_index++) {
            const flag = segments[flag_index].toLowerCase();
            if (flag === "hide" || flag === "private") {
              visibility = "hide";
            } else if (flag === "show") {
              visibility = "show";
            } else if (flag === "superseded") {
              status = "superseded";
            } else if (flag.startsWith("w:") || flag.startsWith("weight:")) {
              const weight_value = parseInt(flag.split(":")[1], 10);
              if (!Number.isNaN(weight_value)) {
                weight = Math.max(1, Math.min(10, weight_value));
              }
            }
          }

          entries.push({ key, original_key, value, visibility, weight, status, raw, start_index, end_index: end_index + 1 });
        }

        index = end_index + 1;
        continue;
      }
    }
    index++;
  }

  return entries;
}

/**
 * Filters brackets based on visibility and strips internal flags for clean prompt rendering.
 *
 * @param {string} brackets_text - multiline brackets string
 * @param {object} [options]
 * @param {"all" | "own" | "none"} [options.see_hidden="own"]
 * @param {boolean} [options.is_counterpart=false] - whether this entity is counterpart across Epistemic Wall
 * @param {boolean} [options.strip_inventory=false] - whether to strip INVENTORY and STASH brackets
 * @returns {string} clean brackets string without metadata flags
 */
export function format_clean_brackets(brackets_text, options = {}) {
  const { see_hidden = "own", is_counterpart = false, strip_inventory = false } = options;
  const parsed = parse_brackets(brackets_text);

  const kept = [];

  for (const token of parsed) {
    if (!token) continue;

    // Visual/diffusion filter: strip inventory and stash containers if requested or if see_hidden === "none"
    if (strip_inventory || see_hidden === "none") {
      const upper_key = token.key.toUpperCase();
      if (upper_key === "INVENTORY" || upper_key === "STASH") {
        continue;
      }
    }

    // Epistemic Wall rules:
    // If see_hidden is "none": strip all hidden brackets
    // If see_hidden is "own": strip hidden brackets if is_counterpart is true
    // If see_hidden is "all": keep everything
    if (token.flags.hide) {
      if (see_hidden === "none") continue;
      if (see_hidden === "own" && is_counterpart) continue;
    }

    // Strip internal control flags for clean rendered output
    kept.push(`[${token.key}: ${token.value}]`);
  }

  return kept.join(", ");
}

/**
 * Reconstructs a clean, normalized bracket string [KEY: value | flags].
 * Ensures the key is always uppercase and flags are properly formatted.
 *
 * @param {ReturnType<typeof parse_bracket_token>} token
 * @returns {string}
 */
function reconstruct_bracket_string(token) {
  if (!token) return "";
  const flags = [];
  if (token.flags?.hide) flags.push("hide");
  if (token.flags?.show) flags.push("show");
  if (token.flags?.is_origin) flags.push("is_origin");
  if (typeof token.flags?.weight === "number" && !isNaN(token.flags.weight)) {
    flags.push(`w: ${token.flags.weight}`);
  }
  const flag_part = flags.length > 0 ? ` | ${flags.join(" | ")}` : "";
  return `[${token.key}: ${token.value}${flag_part}]`;
}

/**
 * Merges delta brackets into an existing bracket text.
 * - Single-value keys overwrite existing entries.
 * - Multi-entry keys (INVENTORY, STASH) append to existing entries.
 * - Keys with value "none" or "cleared" delete the key.
 * - New keys append to the end.
 * - All saved/merged bracket keys are normalized to uppercase.
 *
 * @param {string} existing_text - existing multiline bracket string
 * @param {string} delta_text - delta multiline bracket string
 * @returns {string} merged multiline bracket string
 */
export function apply_bracket_deltas(existing_text, delta_text) {
  const existing_tokens = parse_brackets(existing_text);
  const delta_tokens = parse_brackets(delta_text);

  if (delta_tokens.length === 0) {
    return existing_text ? existing_text.trim() : "";
  }

  // Track multi-entry keys
  const multi_entry_keys = new Set(["INVENTORY", "STASH"]);

  // Build mutable entries list from existing tokens
  // Each entry: { key: string, raw: string, value: string }
  const current_entries = existing_tokens.map((token) => ({ key: token.key, raw: reconstruct_bracket_string(token), value: token.value }));

  for (const delta of delta_tokens) {
    const delta_key = delta.key;
    const lower_value = delta.value.trim().toLowerCase();

    // Check for deletion
    if (lower_value === "none" || lower_value === "cleared") {
      for (let i = current_entries.length - 1; i >= 0; i--) {
        if (current_entries[i].key === delta_key) {
          current_entries.splice(i, 1);
        }
      }
      continue;
    }

    const normalized_raw = reconstruct_bracket_string(delta);

    // Multi-entry keys append
    if (multi_entry_keys.has(delta_key)) {
      current_entries.push({ key: delta_key, raw: normalized_raw, value: delta.value });
      continue;
    }

    // Single-value keys overwrite or append
    const existing_index = current_entries.findIndex((entry) => entry.key === delta_key);
    if (existing_index !== -1) {
      current_entries[existing_index] = { key: delta_key, raw: normalized_raw, value: delta.value };
    } else {
      current_entries.push({ key: delta_key, raw: normalized_raw, value: delta.value });
    }
  }

  return current_entries.map((entry) => entry.raw).join(", ");
}

/**
 * Converts a canonical past multiline bracket string into candidate memory objects
 * ready for Sieve RAG vector cosine similarity scoring.
 *
 * @param {string} past_text - multiline [KEY: VALUE | flags] string
 * @returns {Array<{ id: string, text: string, is_origin: boolean, weight: number, key: string }>}
 */
export function extract_memory_candidates(past_text) {
  const tokens = parse_brackets(past_text);
  if (!tokens || tokens.length === 0) return [];

  return tokens.map((token, index) => {
    return {
      id: `mem_${index}_${token.key.toLowerCase()}`,
      text: token.value,
      is_origin: Boolean(token.flags.is_origin),
      weight: typeof token.flags.weight === "number" ? token.flags.weight : 5,
      key: token.key,
    };
  });
}

// ============================================================================
// 📜 RELATIONAL CONSTELLATION HARVESTING
// ============================================================================

/**
 * Harvests all entity-keyed relationship brackets across an entity's fields.
 * Supports target keys starting with '@' (e.g. [@JULIEN: ...], [@USER: ...])
 * as well as plain keys, resolving dynamic role targets and expanding @ME/@SPEAKER
 * and @YOU/@LISTENER macros relative to the directed edge.
 * Supports perspective-aware filtering ('owner' | 'other') to prevent private/hidden
 * relational dynamics from leaking to unauthorized viewpoints.
 *
 * @param {any} entity
 * @param {string[]|Array<{ id?: string, name?: string }>} [known_entities=[]]
 * @param {'owner'|'other'} [perspective='owner']
 * @param {Object} [ambient_entities={}] - Ambient { USER, AI, FRACTAL }
 * @returns {Map<string, { eternal?: string, present?: string, past: string[], future?: string }>}
 */
export function extract_entity_relationships(entity, known_entities = [], perspective = "owner", ambient_entities = {}) {
  const relationships = new Map();
  if (!entity || typeof entity !== "object") return relationships;

  const slug_to_entity = new Map();

  for (const item of known_entities || []) {
    if (typeof item === "string") {
      const clean = item.trim().toUpperCase();
      slug_to_entity.set(clean, { id: clean, name: item.trim() });
    } else if (item && typeof item === "object") {
      const id_slug = item.id ? String(item.id).trim().toUpperCase() : null;
      const name_slug = item.name ? String(item.name).trim().toUpperCase() : null;
      const entity_meta = { id: item.id || item.name || "", name: item.name || item.id || "" };
      if (id_slug) slug_to_entity.set(id_slug, entity_meta);
      if (name_slug) slug_to_entity.set(name_slug, entity_meta);
    }
  }

  const normalize_target = (raw_key) => {
    let clean = String(raw_key || "")
      .trim()
      .toUpperCase();
    if (clean.startsWith("@")) clean = clean.slice(1);
    if (clean === "USER" && ambient_entities.USER?.name) {
      const user_key = ambient_entities.USER.name.toUpperCase();
      return { key: user_key, display: ambient_entities.USER.name, id: ambient_entities.USER.id || user_key };
    }
    if (clean === "CHAR" && ambient_entities.AI?.name) {
      const ai_key = ambient_entities.AI.name.toUpperCase();
      return { key: ai_key, display: ambient_entities.AI.name, id: ambient_entities.AI.id || ai_key };
    }
    if (clean === "FRACTAL" && ambient_entities.FRACTAL?.name) {
      const fractal_key = ambient_entities.FRACTAL.name.toUpperCase();
      return { key: fractal_key, display: ambient_entities.FRACTAL.name, id: ambient_entities.FRACTAL.id || fractal_key };
    }
    const meta = slug_to_entity.get(clean);
    if (meta) {
      const key = meta.id ? String(meta.id).toUpperCase() : clean;
      return { key, display: meta.name || clean, id: meta.id || key };
    }
    return { key: clean, display: clean, id: clean };
  };

  const get_or_create_relationship = (target_key, target_id, target_name) => {
    if (!relationships.has(target_key)) {
      relationships.set(target_key, {
        target_id: target_id || target_key,
        target_name: target_name || target_key,
        eternal: undefined,
        present: undefined,
        past: [],
        future: undefined,
      });
    }
    return relationships.get(target_key);
  };

  const is_visible = (entry) => {
    if (perspective === "owner" || perspective === "omniscient") return true;
    const is_hidden = entry.flags ? entry.flags.hide : entry.visibility === "hide";
    return !is_hidden;
  };

  const process_value = (value, target_name) => {
    if (!value || typeof value !== "string") return "";
    // Expand directed edge macros: @SPEAKER/@ME -> source entity name, @LISTENER/@YOU -> target name
    const source_name = entity.name || "Speaker";
    return value.replace(/(?<!\w)@(SPEAKER|ME|LISTENER|YOU)\b/gi, (match, token) => {
      const upper = token.toUpperCase();
      if (upper === "SPEAKER" || upper === "ME") return source_name;
      if (upper === "LISTENER" || upper === "YOU") return target_name;
      return match;
    });
  };

  const scan_field = (text, field_name) => {
    if (!text || typeof text !== "string") return;
    const entries = parse_bracket_entries(text);
    for (const entry of entries) {
      let key = entry.key;
      const starts_with_at = entry.original_key?.startsWith("@") || key.startsWith("@");
      if (starts_with_at) {
        key = key.replace(/^@/, "");
      }
      if (starts_with_at && is_visible(entry)) {
        const target = normalize_target(key);
        const processed_val = process_value(entry.value, target.display);
        const record = get_or_create_relationship(target.key, target.id, target.display);
        if (field_name === "past") {
          record.past.push(processed_val);
        } else {
          record[field_name] = processed_val;
        }
      }
    }
  };

  // 1. Eternal non-physical
  scan_field(entity.eternal?.non_physical, "eternal");

  // 2. Present non-physical
  scan_field(entity.present?.non_physical, "present");

  // 3. Past
  if (typeof entity.past === "string") {
    scan_field(entity.past, "past");
  } else if (Array.isArray(entity.past)) {
    for (const vector of entity.past) {
      const content = vector?.content || vector?.text || "";
      scan_field(content, "past");
    }
  }

  // 4. Future
  scan_field(entity.future, "future");

  return relationships;
}

// ============================================================================
// [SECTION 1: CONSTANTS & TOKEN SETS]
// ============================================================================

/**
 * Universal atomic-clearing tokens - emitting `[KEY: one of these]` deletes KEY
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
 * Keys that must NEVER reach an image-generation prompt (private state or physical inventory).
 * @type {ReadonlySet<string>}
 */
export const VISUAL_EXCLUDED_KEYS = Object.freeze(new Set(["INVENTORY", "STASH", "SECRET", "PLAN", "STATUS"]));

/**
 * Splits a bracket body into its constituent `KEY: value` segments, so a value
 * that swallowed a following key (e.g. `[HAIR: … temples DENTAL_FEATURES: …]`)
 * never merges keys or loses a key's opening bracket.
 * @param {string} content - Inner text of a `[...]` block.
 * @returns {{ key: string, value: string }[]}
 */
function _split_key_value_segments(content) {
  const text = String(content || "").trim();
  const lead = text.match(/^([^:[\]]+?)\s*:\s*/);
  if (!lead) return [];
  const segments = [{ key: lead[1], value: "" }];
  const rest = text.slice(lead[0].length);
  PSEUDO_JSON_KEY_REGEX.lastIndex = 0;
  const marks = [];
  let match;
  while ((match = PSEUDO_JSON_KEY_REGEX.exec(rest)) !== null) {
    if (rest.slice(PSEUDO_JSON_KEY_REGEX.lastIndex, PSEUDO_JSON_KEY_REGEX.lastIndex + 2) === "//") continue;
    marks.push({ key: match[1], start: match.index, value_start: PSEUDO_JSON_KEY_REGEX.lastIndex });
  }
  segments[0].value = (marks.length ? rest.slice(0, marks[0].start) : rest).trim();
  for (let i = 0; i < marks.length; i++) {
    const end = i + 1 < marks.length ? marks[i + 1].start : rest.length;
    segments.push({ key: marks[i].key, value: rest.slice(marks[i].value_start, end).trim() });
  }
  return segments;
}

/**
 * Stores a parsed pseudo-JSON entry, applying universal atomic clearing
 * (`CLEAR_TOKENS`) and multi-item aggregation (`AGGREGATE_KEYS`).
 * @param {Record<string, string | string[]>} target
 * @param {string} k
 * @param {string} v
 */
function _store_parsed_entry(target, k, v) {
  if (!k || !v) return;
  if (CLEAR_TOKENS.has(v.toLowerCase())) {
    delete target[k];
    return;
  }
  if (AGGREGATE_KEYS.has(k) || k.startsWith("@")) {
    const items =
      AGGREGATE_KEYS.has(k) ?
        v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [v];
    const existing = target[k];
    const list =
      Array.isArray(existing) ? existing
      : existing ? [existing]
      : [];
    for (const item of items) {
      if (item && !list.includes(item)) list.push(item);
    }
    target[k] = list;
    return;
  }
  target[k] = v;
}
const PSEUDO_JSON_KEY_REGEX = /\b([A-Z][A-Z0-9_]*(?:\s+[A-Z][A-Z0-9_]*)*)\s*:/g;

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
    const bracket_regex = /\[([^[\]]+)\]/g;
    let match;
    let matched_any = false;

    while ((match = bracket_regex.exec(clean_raw)) !== null) {
      for (const segment of _split_key_value_segments(match[1])) {
        matched_any = true;
        const k = segment.key.replace(/["']/g, "").trim().replace(/\s+/g, "_");
        const v = segment.value.replace(/^["']|["']$/g, "").trim();
        _store_parsed_entry(bracket_extracted, k, v);
      }
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

  // Tier 2.5: Process unbracketed uppercase key-value pairs KEY: VALUE (e.g. "CLOTHING: tight tank top EXPRESSION: grin")
  if (clean_raw.includes(":")) {
    const unbracketed_regex = /\b([A-Z][A-Z0-9_]*(?:\s+[A-Z][A-Z0-9_]*)*)\s*:\s*([^:]+?)(?=\s+[A-Z][A-Z0-9_]*(?:\s+[A-Z][A-Z0-9_]*)*\s*:|$)/g;
    /** @type {Record<string, string | string[]>} */
    const unbracketed_extracted = {};
    let match;
    while ((match = unbracketed_regex.exec(clean_raw)) !== null) {
      const k = match[1].trim().replace(/\s+/g, "_");
      const v = match[2].trim();
      _store_parsed_entry(unbracketed_extracted, k, v);
    }
    if (Object.keys(unbracketed_extracted).length > 0) return unbracketed_extracted;
  }

  // Tier 3: No structured keys found - preserve raw prose sentinel.
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
    if (!existing) return clean_new_prose;

    const normalize = (t) => collapse_whitespace(String(t || "").toLowerCase());
    const existing_lines = existing
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const existing_norm = new Set(existing_lines.map(normalize));

    const incoming_lines = clean_new_prose
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const retained_new = incoming_lines.filter((l) => !existing_norm.has(normalize(l)));

    if (retained_new.length === 0) {
      return existing;
    }

    let result = `${existing}\n${retained_new.join("\n")}`;
    if (result.length > MAX_FIELD_CHARS) {
      result = result.substring(result.length - MAX_FIELD_CHARS);
    }
    return result;
  }

  // 1. Extract bracketed [KEY: Value] directives first
  const bracketed_regex = /\[([A-Z_ ]{3,25}):\s*([\s\S]*?)\]/g;
  let match;
  const key_updates = [];

  while ((match = bracketed_regex.exec(clean_new_prose)) !== null) {
    const raw_key = match[1].toUpperCase().replace(/\s+/g, "_");
    const raw_val = match[2].trim();
    if (raw_val) {
      key_updates.push({ key: raw_key, val: raw_val });
    }
  }

  // Strip all bracketed directives cleanly in one pass to prevent string mutation drift
  let remaining_prose = clean_new_prose.replace(bracketed_regex, "").trim();

  // 2. Extract unbracketed KEY: Value segments if any
  const unbracketed_regex = /(?:^|,\s*|\s*)([A-Z_]{3,15}):\s*([^,[\]]+(?:\s+[^,[\]]+)*)/g;
  while ((match = unbracketed_regex.exec(remaining_prose)) !== null) {
    const raw_key = match[1].toUpperCase();
    const raw_val = match[2].trim();
    if (raw_val) {
      key_updates.push({ key: raw_key, val: raw_val });
    }
  }

  // Strip all unbracketed directives cleanly in one pass
  remaining_prose = remaining_prose
    .replace(unbracketed_regex, "")
    .replace(/^[\s,;[\]]+|[\s,;[\]]+$/g, "")
    .replace(/,\s*,+/g, ",")
    .trim();

  // Apply structured key updates in sequence
  for (const { key, val: incoming_val } of key_updates) {
    let target_key = key;
    let val = incoming_val;
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
      const list =
        Array.isArray(existing) ? existing
        : existing ?
          String(existing)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      const existing_norm = new Set(list.map((item) => collapse_whitespace(String(item)).toLowerCase()));
      for (const item of incoming) {
        const item_norm = collapse_whitespace(item).toLowerCase();
        if (item && !existing_norm.has(item_norm)) {
          list.push(item);
          existing_norm.add(item_norm);
        }
      }
      parsed[key] = list;
      continue;
    }

    if (key === "CLOTHING" && parsed.SHIRT) target_key = "SHIRT";
    if (key === "SHIRT" && parsed.CLOTHING) target_key = "CLOTHING";

    // E2: Concealment preservation on structured key overwrite
    const existing_val = typeof parsed[target_key] === "string" ? parsed[target_key] : "";
    const existing_had_hide = /\|\s*hide\b/i.test(existing_val);
    const incoming_has_show = /\|\s*show\b/i.test(val);
    const incoming_has_hide = /\|\s*hide\b/i.test(val);
    if (existing_had_hide && !incoming_has_show && !incoming_has_hide) {
      val = `${val} | hide`;
    } else if (incoming_has_show) {
      val = val.replace(/\|\s*show\b/gi, "").trim();
    }

    parsed[target_key] = val;
  }

  // Append any remaining unstructured prose to CONDITION
  if (remaining_prose) {
    const cond_key =
      parsed.CONDITION ? "CONDITION"
      : parsed.condition ? "condition"
      : "CONDITION";
    if (parsed[cond_key]) {
      const clean_existing = String(parsed[cond_key])
        .replace(/^[\s,]+|[\s,]+$/g, "")
        .replace(/,\s*,+/g, ", ");
      const existing_phrases = clean_existing
        .split(",")
        .map((s) => collapse_whitespace(s).toLowerCase())
        .filter(Boolean);
      const incoming_phrases = remaining_prose
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const new_phrases = incoming_phrases.filter((phrase) => !existing_phrases.includes(collapse_whitespace(phrase).toLowerCase()));
      if (new_phrases.length > 0) {
        parsed[cond_key] = `${clean_existing}, ${new_phrases.join(", ")}`;
      }
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

/**
 * Strips non-visual pseudo-JSON keys from a raw parameter string for image generation prompts.
 *
 * @param {string | null | undefined} raw_parameter_string
 * @returns {string} Sanitized visual parameter string
 */
export function strip_visual_excluded(raw_parameter_string) {
  if (!raw_parameter_string) return "";
  const parsed_parameters = safe_parse_pseudo_json(raw_parameter_string);
  if (parsed_parameters.__raw_prose__) return raw_parameter_string;

  const retained_entries = Object.entries(parsed_parameters)
    .filter(([key]) => !VISUAL_EXCLUDED_KEYS.has(key))
    .map(([key, value]) => `[${key}: ${Array.isArray(value) ? value.join(", ") : String(value).replace(/[[\]]/g, "")}]`);

  return retained_entries.join(" ");
}

/**
 * Repairs unclosed or unopened brackets in state strings and directives.
 * Fixes malformed strings such as:
 * - "foo | w: 8]\n[BAR: baz" -> "[foo | w: 8]\n[BAR: baz]"
 * - "ANOMALY: alert" -> "[ANOMALY: alert]"
 *
 * @param {string | null | undefined} raw - Input string with potentially malformed brackets
 * @returns {string} Clean string where every bracket predicate is properly enclosed
 */
export function balance_brackets(raw) {
  if (!raw || typeof raw !== "string") return "";
  const lines = raw.split(/\r?\n/);
  const repaired_lines = lines.map((line) => {
    let trimmed = line.trim();
    if (!trimmed) return "";

    // Case 1: Line ends with ']' but does not start with '['
    if (trimmed.endsWith("]") && !trimmed.startsWith("[")) {
      trimmed = `[${trimmed}`;
    }

    // Case 2: Line starts with '[' but does not end with ']'
    if (trimmed.startsWith("[") && !trimmed.endsWith("]")) {
      trimmed = `${trimmed}]`;
    }

    // Case 3: Line has no brackets at all, but looks like a key-value or weight directive
    // e.g. "ANOMALY: alert | w: 8" or "@DR_TARIQ: hostile | hide"
    if (!trimmed.includes("[") && !trimmed.includes("]")) {
      const is_predicate = /^(@?[A-Z][A-Z0-9_]{1,24}:|[^:|]+\|\s*(?:w:\s*\d+|show|hide)\b)/.test(trimmed);
      if (is_predicate) {
        trimmed = `[${trimmed}]`;
      }
    }

    return trimmed;
  });

  return repaired_lines.join("\n").trim();
}

/**
 * Checks whether an entity has a directed bracket bond ([@target: ...]) or key targeting
 * another entity's id or name (case-insensitively).
 *
 * @param {any} entity - The source entity
 * @param {any|string} target_identifier_or_entity - Target entity object or identifier string
 * @returns {boolean}
 */
export function has_bracket_bond(entity, target_identifier_or_entity) {
  if (!entity || !target_identifier_or_entity) return false;

  const target_ids = new Set();
  if (typeof target_identifier_or_entity === "object") {
    if (target_identifier_or_entity.id) target_ids.add(String(target_identifier_or_entity.id).trim().toLowerCase());
    if (target_identifier_or_entity.name) target_ids.add(String(target_identifier_or_entity.name).trim().toLowerCase());
  } else {
    target_ids.add(String(target_identifier_or_entity).trim().toLowerCase());
  }

  const layers = [
    entity?.eternal?.non_physical,
    entity?.present?.non_physical,
    entity?.eternal?.physical,
    entity?.present?.physical,
    ...(Array.isArray(entity?.past) ? entity.past.map((item) => (typeof item === "string" ? item : item?.text)) : []),
    typeof entity?.future === "string" ? entity.future : "",
  ];

  for (const text of layers) {
    if (typeof text !== "string" || text.indexOf("[") < 0) continue;
    const matches = text.matchAll(/\[@?([^\]:]+):/g);
    for (const match of matches) {
      const parsed_target = String(match[1] || "")
        .trim()
        .toLowerCase();
      if (target_ids.has(parsed_target)) {
        return true;
      }
    }
  }

  return false;
}

// ============================================================================
// [SECTION 1: CONSTANTS & CLOTHING KEYS]
// ============================================================================

/**
 * Canonical clothing tag keys - shared across the engine for clothing overrides,
 * visual strip filters, and state mutations.
 * @type {ReadonlyArray<string>}
 */
export const CLOTHING_KEYS = Object.freeze([
  "SHIRT",
  "PANTS",
  "SUIT",
  "JACKET",
  "DRESS",
  "SKIRT",
  "COAT",
  "SHOES",
  "BOOTS",
  "GLOVES",
  "HAT",
  "ARMOR",
  "ROBE",
  "ROBES",
  "APPAREL",
  "UNDERWEAR",
  "OUTFIT",
  "CLOTHING",
  "CLOAK",
  "BOTTOMS",
  "TOPS",
  "ACCESSORIES",
  "HARNESS",
  "SCRUBS",
  "HARDWARE",
  "EQUIPMENT",
  "GEAR",
]);

// ============================================================================
// [SECTION 3: PHYSICAL STATE XML BUILDER]
// ============================================================================

/**
 * Canonical remaps for physical-state keys the Director may write as variants of
 * the shared vocabulary. Canonically-named keys always win over these aliases.
 * @type {Readonly<Record<string, string>>}
 */
export const PHYSICAL_KEY_ALIASES = Object.freeze({ SHORTS: "APPAREL", SOMA: "SOMATIC", POSE: "POSTURE" });

/**
 * Strips a duplicated "KEY:" prefix echoed inside its own value (e.g. the value
 * "STATE: protective" for key "STATE"). Matches whole underscore-or-space keys.
 * @param {string | null | undefined} value
 * @param {string | string[]} keys
 * @returns {string}
 */
export function strip_leading_key_echo(value, keys = []) {
  const text = String(value ?? "");
  const patterns = (Array.isArray(keys) ? keys : [keys]).filter(Boolean).map((k) =>
    String(k)
      .replace(/[^A-Za-z0-9_]/g, "")
      .replace(/_/g, "[_ ]"),
  );
  if (!patterns.length) return text.trim();
  return text.replace(new RegExp("^\\s*(?:" + patterns.join("|") + ")\\s*:\\s*", "i"), "").trim();
}

/**
 * Canonicalizes parsed physical/non-physical keys: known aliases remap to their
 * canonical SCREAMING_SNAKE name, other keys keep their original casing, echoed
 * "KEY:" value prefixes are stripped, and duplicate keys collapse (the
 * canonically-named entry wins over an alias).
 * @param {Record<string, any>} parsed
 * @returns {Record<string, string>}
 */
export function normalize_physical_entries(parsed) {
  const out = {};
  for (const [k, v] of Object.entries(parsed || {})) {
    if (k === "__raw_prose__") continue;
    const raw_key = String(k).replace(/\s+/g, "_").trim();
    if (!raw_key) continue;
    const upper_key = raw_key.toUpperCase();
    const canonical = PHYSICAL_KEY_ALIASES[upper_key] || raw_key;
    const value = Array.isArray(v) ? v.join(", ") : String(v);
    const cleaned = strip_leading_key_echo(value, [raw_key, upper_key, canonical]);
    if (!cleaned) continue;
    if (out[canonical] === undefined || raw_key === canonical) {
      out[canonical] = cleaned;
    }
  }
  return out;
}

/**
 * Filters [KEY: value | flags] bracket tokens through the Epistemic Wall.
 *
 * @param {string|null|undefined} text
 * @param {'owner'|'other'|'vision'} [perspective='other']
 * @returns {string}
 */
export function filter_epistemic_brackets(text, perspective = "other") {
  if (!text || typeof text !== "string") return "";

  let working_text = text;

  const entries = parse_bracket_entries(working_text);
  if (entries.length === 0) return working_text;

  // Process backwards to preserve character indices
  for (let index = entries.length - 1; index >= 0; index--) {
    const entry = entries[index];

    if (entry.visibility === "hide") {
      if (perspective === "owner") {
        // Secrecy signal: keep entry formatted cleanly with '| hide'
        const secret_replacement = `[${entry.original_key}: ${entry.value} | hide]`;
        working_text = working_text.slice(0, entry.start_index) + secret_replacement + working_text.slice(entry.end_index);
      } else {
        // Omit completely for 'other' and 'vision'
        const before = working_text.slice(0, entry.start_index);
        let after = working_text.slice(entry.end_index);

        if (before.endsWith("\n") && after.startsWith("\n")) {
          after = after.slice(1);
        } else if (before.endsWith(" ") && after.startsWith(" ")) {
          after = after.slice(1);
        }

        working_text = before + after;
      }
    } else {
      // Show entry: strip all internal engine flags (hide, show, w: N) before prompt sees it
      const clean_replacement = `[${entry.original_key}: ${entry.value}]`;
      working_text = working_text.slice(0, entry.start_index) + clean_replacement + working_text.slice(entry.end_index);
    }
  }

  return working_text;
}

/**
 * Strips internal engine flags (| hide, | show, | w: N) from bracketed entries
 * for clean vector embedding calculations, eliminating false semantic collisions.
 *
 * @param {string|null|undefined} text
 * @returns {string} Clean text suitable for embedding models
 */
export function strip_bracket_engine_flags(text) {
  if (!text || typeof text !== "string") return "";
  const entries = parse_bracket_entries(text);
  if (entries.length === 0) return text;

  let working_text = text;
  for (let index = entries.length - 1; index >= 0; index--) {
    const entry = entries[index];
    const stripped = `[${entry.original_key}: ${entry.value}]`;
    working_text = working_text.slice(0, entry.start_index) + stripped + working_text.slice(entry.end_index);
  }
  return working_text;
}
