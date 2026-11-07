/**
 * src/storage/parser.js
 * ============================================================================
 * 📜 CANONICAL BRACKET TOKENIZER & EPISTEMIC WALL
 * ============================================================================
 *
 * Single source of truth for bracket tokenization, metadata flag parsing,
 * Epistemic Wall filtering, delta merging, and memory candidate extraction.
 *
 * Bracket Format: [KEY: VALUE | flags]
 * Flags: | hide, | show, | w: <1-10>, | is_origin
 *
 * Invariant: Pipes inside `{Option A | Option B}` alternation scopes are NOT
 * treated as metadata flag separators.
 * ============================================================================
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
  const flags = {
    hide: false,
    show: false,
    is_origin: false,
    weight: undefined,
  };

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

  return {
    key,
    value,
    flags,
    raw: trimmed,
  };
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

          entries.push({
            key,
            original_key,
            value,
            visibility,
            weight,
            status,
            raw,
            start_index,
            end_index: end_index + 1,
          });
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
  const current_entries = existing_tokens.map((token) => ({
    key: token.key,
    raw: reconstruct_bracket_string(token),
    value: token.value,
  }));

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
      current_entries.push({
        key: delta_key,
        raw: normalized_raw,
        value: delta.value,
      });
      continue;
    }

    // Single-value keys overwrite or append
    const existing_index = current_entries.findIndex((entry) => entry.key === delta_key);
    if (existing_index !== -1) {
      current_entries[existing_index] = {
        key: delta_key,
        raw: normalized_raw,
        value: delta.value,
      };
    } else {
      current_entries.push({
        key: delta_key,
        raw: normalized_raw,
        value: delta.value,
      });
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
      const entity_meta = {
        id: item.id || item.name || "",
        name: item.name || item.id || "",
      };
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

import { safe_parse_json } from "@utils";

/**
 * Parses a raw LLM profile-sorting response into a structured object.
 * Strips cognition blocks and code fences, isolates the outermost JSON object,
 * and returns null on any failure (no braces, malformed JSON).
 *
 * @param {string} raw
 * @returns {Object|null}
 */
export function parse_profile_json(raw) {
  if (typeof raw !== "string") {
    if (raw == null) return null;
    const coerced = typeof raw.text === "string" ? raw.text : String(raw);
    if (!coerced || coerced === "[object Object]") return null;
    raw = coerced;
  }
  const clean = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```json\n?|```/g, "")
    .trim();
  return safe_parse_json(clean);
}

/**
 * Removes <image_prompt> tags, <image> tags, and Markdown images from text.
 *
 * @param {string|null|undefined} text
 * @returns {string}
 */
export function clean_image_prompts(text) {
  if (!text) return "";
  let clean = text.replace(/<image_prompt>[\s\S]*?<\/image_prompt>/gi, "");
  clean = clean.replace(/<image>[\s\S]*?<\/image>/gi, "");
  clean = clean.replace(/!\[.*?\]\(.*?\)/g, "");
  return clean.trim();
}

/**
 * Extracts <think> blocks from text.
 * Handles partial tags during streaming and merges multiple blocks cleanly.
 *
 * @param {string|null|undefined} text
 * @returns {{ content: string, think: string|null }}
 */
export function parse_think_block(text) {
  if (!text) return { content: "", think: null };

  const think_accumulator = [];

  // 1. Match and extract closed <think>...</think> blocks
  const closed_think_regex = /<think>([\s\S]*?)<\/think>/gi;
  let match;
  while ((match = closed_think_regex.exec(text)) !== null) {
    const raw_block = match[1].replace(/<\/?think>/gi, "").trim();
    if (raw_block) {
      think_accumulator.push(raw_block);
    }
  }

  // Clean closed <think>...</think> blocks from content
  let content = text.replace(/<think>[\s\S]*?<\/think>/gi, "");

  // 2. Check for an unclosed partial block (streaming)
  const think_openers = (text.match(/<think>/gi) || []).length;
  const think_closers = (text.match(/<\/think>/gi) || []).length;

  if (think_openers > think_closers) {
    const lower_text = text.toLowerCase();
    const last_think_index = lower_text.lastIndexOf("<think>");
    if (last_think_index !== -1) {
      const partial_think = text
        .slice(last_think_index)
        .replace(/<\/?think>/gi, "")
        .trim();
      if (partial_think) {
        think_accumulator.push(partial_think);
      }
      content = text.slice(0, last_think_index);
    }
  }

  return {
    content: content.trim(),
    think: think_accumulator.length > 0 ? think_accumulator.join("\n\n") : null,
  };
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
 * Strips private directive brackets across entity boundaries.
 *
 * @param {string|null|undefined} text
 * @returns {string}
 */
export function strip_covert_directives(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/\[(?:covert|secret|private|hidden)\s*:[^\]]*\]/gi, "")
    .replace(/«(?:covert|secret|private|hidden)(?::[^»]*)?»/gi, "")
    .replace(/[ \t]{2,}/g, " ");
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
