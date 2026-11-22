/**
 * src/simulation/brackets.js
 * ============================================================================
 * 🏷️ TAGGED-FIELD BRACKET ENGINE (Rank 1, pure simulation)
 * ============================================================================
 *
 * Canonical home for the `[KEY: VALUE | flags]` tagged-field language:
 * brace-aware parsing, epistemic formatting, delta application, memory
 * harvesting, relational constellation harvesting, pseudo-JSON recovery,
 * and the shared token constants.
 *
 * Phase 2 unification: merged from `src/utils/tags.js`
 * (`parse_bracket_token` + `parse_brackets` + `parse_bracket_entries` into
 * `parse_tagged_fields`; `format_clean_brackets` + `filter_epistemic_brackets`
 * + `strip_bracket_engine_flags` + `strip_visual_excluded` into
 * `format_tagged_fields`; `apply_bracket_deltas` + `merge_prose_into_field`
 * into `apply_tagged_field_deltas`) plus the relational vector codecs from
 * `src/utils/text.js`.
 *
 * Pure, stateless, domain-agnostic. No Svelte runes, no IndexedDB, no DOM.
 * Imports only Rank 0 (`@utils`) and the sibling `llm-output.js`.
 * ============================================================================
 */

import { collapse_whitespace, create_relational_context, parse_bracket_display_flags, parse_macros, truncate_at_word } from "@utils";
import { strip_cognition_blocks } from "./llm-output.js";

/**
 * Bracket Format: [KEY: VALUE | flags]
 * Flags: | hide, | show, | is_origin, | w: <1-10>
 *
 * Invariant: Pipes inside `{Option A | Option B}` alternation scopes are NOT
 * treated as metadata flag separators.
 */

/**
 * Parses all top-level tagged-field entries from a text string with token positions.
 * Brace-aware: pipes inside `{...}` alternation scopes never split flags.
 * Single entry point replacing `parse_bracket_token` / `parse_brackets` /
 * `parse_bracket_entries`.
 *
 * @param {string|null|undefined} text
 * @returns {Array<{ key: string, original_key: string, value: string, visibility: 'show'|'hide', is_origin: boolean, weight: number, status: 'active'|'superseded', raw: string, start_index: number, end_index: number }>}
 */
export function parse_tagged_fields(text) {
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
          let is_origin = false;
          let weight = 5;
          let status = "active";

          for (let flag_index = 1; flag_index < segments.length; flag_index++) {
            const flag = segments[flag_index].toLowerCase();
            if (flag === "hide" || flag === "private") {
              visibility = "hide";
            } else if (flag === "show") {
              visibility = "show";
            } else if (flag === "is_origin" || flag === "origin") {
              is_origin = true;
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
            is_origin,
            weight,
            status,
            raw,
            start_index,
            end_index: end_index + 1,
            flags: { weight, visibility, is_origin },
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
 * Formats a parsed entry back into a clean `[KEY: value]` string,
 * preserving the `| hide` secrecy signal when requested.
 *
 * @param {{ key: string, value: string, visibility?: string }} entry
 * @param {boolean} [keep_hide_signal=false]
 * @returns {string}
 */
function _format_entry_clean(entry, keep_hide_signal = false) {
  if (!entry) return "";
  const suffix = keep_hide_signal && entry.visibility === "hide" ? " | hide" : "";
  return `[${entry.key}: ${entry.value}${suffix}]`;
}

/**
 * Formats tagged fields through the Epistemic Wall for clean prompt rendering.
 * Merges `format_clean_brackets` + `filter_epistemic_brackets` +
 * `strip_bracket_engine_flags` + `strip_visual_excluded`.
 *
 * In-place span surgery (not a rebuild): kept entries are replaced with their
 * cleaned form at their original span; dropped entries are excised via
 * _drop_span so surrounding prose survives (display paths pass full prose).
 * Prose-safe: text without tagged fields is returned unchanged (never wiped
 * to `""`).
 *
 * @param {string|null|undefined} text - multiline tagged-field string (or prose)
 * @param {object} [options]
 * @param {"all" | "own" | "none"} [options.see_hidden="own"]
 * @param {boolean} [options.is_counterpart=false] - whether this entity is counterpart across Epistemic Wall
 * @param {boolean} [options.strip_inventory=false] - whether to strip INVENTORY and STASH containers
 * @param {boolean} [options.visual_only=false] - whether to drop VISUAL_EXCLUDED_KEYS (image-prompt path)
 * @param {boolean} [options.reveal_hidden=false] - keep hidden entries with flags stripped (telemetry display path)
 * @returns {string} clean tagged-field string
 */
export function format_tagged_fields(text, options = {}) {
  if (!text || typeof text !== "string") return "";
  const { see_hidden = "own", is_counterpart = false, strip_inventory = false, visual_only = false, reveal_hidden = false } = options;

  const entries = parse_tagged_fields(text);
  if (entries.length === 0) return text;

  let working_text = text;

  for (let index = entries.length - 1; index >= 0; index--) {
    const entry = entries[index];
    const { start_index, end_index } = entry;

    // Aggregate-container filter (inventory/stash never reach prompts or vectors on request)
    if ((strip_inventory || see_hidden === "none") && AGGREGATE_KEYS.has(entry.key)) {
      working_text = _drop_span(working_text, start_index, end_index);
      continue;
    }

    // Visual filter (private state / physical inventory never reach image prompts)
    if (visual_only && VISUAL_EXCLUDED_KEYS.has(entry.key)) {
      working_text = _drop_span(working_text, start_index, end_index);
      continue;
    }

    if (entry.visibility === "hide") {
      if (reveal_hidden) {
        const clean_replacement = _format_entry_clean(entry, false);
        working_text = working_text.slice(0, start_index) + clean_replacement + working_text.slice(end_index);
        continue;
      }
      // Epistemic Wall rules:
      // - see_hidden "none": strip all hidden entries
      // - see_hidden "own" + counterpart: strip hidden entries
      // - see_hidden "own" + owner: keep with `| hide` secrecy signal
      // - see_hidden "all": keep with `| hide` secrecy signal
      if (see_hidden === "none") {
        working_text = _drop_span(working_text, start_index, end_index);
        continue;
      }
      if (see_hidden === "own" && is_counterpart) {
        working_text = _drop_span(working_text, start_index, end_index);
        continue;
      }
      const secret_replacement = _format_entry_clean(entry, true);
      working_text = working_text.slice(0, start_index) + secret_replacement + working_text.slice(end_index);
    } else {
      // Show entry: strip all internal engine flags for clean rendered output
      const clean_replacement = _format_entry_clean(entry, false);
      working_text = working_text.slice(0, start_index) + clean_replacement + working_text.slice(end_index);
    }
  }

  return working_text;
}

/**
 * Excises the span [start_index, end_index) from working_text, cleaning up
 * the joint so no orphan separators survive. Back-to-front safe.
 *
 * Rules:
 * - both sides blank → ""
 * - before blank → after stripped of leading [\s,]+
 * - after blank → before stripped of trailing [\s,]+
 * - trailing-comma-before + leading-comma-after → drop before's comma run
 * - newline doubling at the joint → single \n
 * - space doubling at the joint → single space
 *
 * @param {string} working_text
 * @param {number} start_index
 * @param {number} end_index
 * @returns {string}
 */
function _drop_span(working_text, start_index, end_index) {
  const before = working_text.slice(0, start_index);
  const after = working_text.slice(end_index);

  if (!before.trim() && !after.trim()) return "";
  if (!before.trim()) return after.replace(/^[\s,]+/, "");
  if (!after.trim()) return before.replace(/[\s,]+$/, "");

  let kept_before = before;
  let kept_after = after;

  // Trailing-comma-before + leading-comma-after → drop before's comma run
  // ("[A: 1], [DROP], [B: 2]" must rejoin as "[A: 1], [B: 2]", not "[A: 1],, [B: 2]").
  if (/[ \t]*,[ \t,]*$/.test(kept_before) && /^[ \t,]*,/.test(kept_after)) {
    kept_before = kept_before.replace(/[ \t]*,[ \t,]*$/, "");
  }

  // Trailing spaces before a newline start → drop them ("Line one ⏎" not "Line one ⏎").
  if (/[ \t]+$/.test(kept_before) && /^\n/.test(kept_after)) {
    kept_before = kept_before.replace(/[ \t]+$/, "");
  }

  // Newline doubling at the joint → single \n (joint-local only: never touch
  // paragraph breaks elsewhere in the prose).
  if (/[ \t]*\n[ \t\n]*$/.test(kept_before) && /^[ \t\n]*\n/.test(kept_after)) {
    kept_before = kept_before.replace(/[ \t]*\n[ \t\n]*$/, "\n");
    kept_after = kept_after.replace(/^[ \t\n]*\n/, "\n");
    kept_after = kept_after.replace(/^\n/, "");
  }

  // Space doubling at the joint → single space (joint-local only).
  if (/[ \t]$/.test(kept_before) && /^[ \t]/.test(kept_after)) {
    kept_after = kept_after.replace(/^[ \t]+/, "");
    kept_before = kept_before.replace(/[ \t]+$/, " ");
  }

  // Comma debris at the joint (", ," from adjacent drops) → single comma.
  let joined = kept_before + kept_after;
  const boundary = kept_before.length;
  const window_start = Math.max(0, boundary - 12);
  const window_end = boundary + 12;
  const window_text = joined.slice(window_start, window_end).replace(/,[ \t]*,/g, ",");
  joined = joined.slice(0, window_start) + window_text + joined.slice(window_end);

  return joined;
}

/**
 * Reconstructs a normalized `[KEY: value | flags]` string for a parsed entry,
 * preserving origin / weight / hide signals across delta merges.
 *
 * @param {{ key: string, value: string, visibility?: string, is_origin?: boolean, weight?: number }} entry
 * @returns {string}
 */
function _reconstruct_entry(entry) {
  if (!entry) return "";
  const flags = [];
  if (entry.visibility === "hide") flags.push("hide");
  if (entry.is_origin) flags.push("is_origin");
  if (typeof entry.weight === "number" && !isNaN(entry.weight) && entry.weight !== 5) {
    flags.push(`w: ${entry.weight}`);
  }
  const flag_part = flags.length > 0 ? ` | ${flags.join(" | ")}` : "";
  return `[${entry.key}: ${entry.value}${flag_part}]`;
}

/**
 * Merges tagged-field delta directives into an existing tagged-field string,
 * appending any non-bracket prose remainder with line-level dedup.
 * Merges `apply_bracket_deltas` + `merge_prose_into_field`.
 * - Single-value keys overwrite existing entries.
 * - Multi-value keys (AGGREGATE_KEYS, or `options.multi_keys`) append.
 * - CLEAR_TOKENS values (`none`, `cleared`, ...) delete the key; a
 *   `[CLOTHING: <clear>]` directive purges every clothing key at once.
 * - New keys append to the end. All keys normalize to uppercase.
 *
 * @param {string|null|undefined} existing_text - existing multiline tagged-field string
 * @param {string|null|undefined} delta_text - delta directives (brackets and/or prose)
 * @param {object} [options]
 * @param {Set<string>|string[]} [options.multi_keys=AGGREGATE_KEYS] - keys that aggregate instead of overwrite
 * @returns {string} merged multiline tagged-field string
 */
export function apply_tagged_field_deltas(existing_text, delta_text, options = {}) {
  const multi_keys = options.multi_keys instanceof Set ? options.multi_keys : new Set(options.multi_keys || AGGREGATE_KEYS);
  const MAX_FIELD_CHARS = 2000;

  const existing_entries = parse_tagged_fields(existing_text || "");
  const delta_entries = parse_tagged_fields(delta_text || "");

  // Split the delta into bracket directives + unstructured prose remainder.
  let prose_remainder = String(delta_text || "");
  for (const entry of delta_entries) {
    prose_remainder = prose_remainder.replace(entry.raw, " ");
  }
  prose_remainder = prose_remainder.replace(/[\s,;[\]]+/g, " ").trim();
  // A remainder that is only flag debris (e.g. "| hide") is not prose.
  if (/^[|\s\w:;-]*$/.test(prose_remainder) && !/[a-zA-Z]{3,}/.test(prose_remainder)) prose_remainder = "";

  if (delta_entries.length === 0) {
    const base = existing_text ? existing_text.trim() : "";
    if (!prose_remainder) return base;
    return _append_prose_remainder(base, prose_remainder, MAX_FIELD_CHARS);
  }

  const current = existing_entries.map((entry) => ({ key: entry.key, raw: _reconstruct_entry(entry), value: entry.value }));

  for (const delta of delta_entries) {
    const delta_key = delta.key;
    const lower_value = delta.value.trim().toLowerCase();

    // Atomic clearing: `[KEY: none]` deletes the key; `[CLOTHING: <clear>]`
    // purges every clothing key at once.
    if (CLEAR_TOKENS.has(lower_value)) {
      if (delta_key === "CLOTHING") {
        for (let i = current.length - 1; i >= 0; i--) {
          if (current[i].key === delta_key || CLOTHING_KEYS.includes(current[i].key)) current.splice(i, 1);
        }
      } else {
        for (let i = current.length - 1; i >= 0; i--) {
          if (current[i].key === delta_key) current.splice(i, 1);
        }
      }
      continue;
    }

    const normalized_raw = _reconstruct_entry(delta);

    // Multi-value keys aggregate
    if (multi_keys.has(delta_key) || delta_key.startsWith("@")) {
      const incoming = delta.value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const existing_index = current.findIndex((entry) => entry.key === delta_key);
      if (existing_index !== -1 && incoming.length > 0) {
        const merged = _merge_aggregate_value(current[existing_index].value, incoming);
        current[existing_index] = { key: delta_key, raw: `[${delta_key}: ${merged}]`, value: merged };
      } else {
        current.push({ key: delta_key, raw: normalized_raw, value: delta.value });
      }
      continue;
    }

    // Single-value keys overwrite or append, preserving concealment:
    // an existing `| hide` survives unless the delta shows or hides explicitly.
    const existing_index = current.findIndex((entry) => entry.key === delta_key);
    if (existing_index !== -1) {
      const existing_had_hide = /\|\s*hide\b/i.test(current[existing_index].raw);
      const incoming_has_show = /\|\s*show\b/i.test(normalized_raw);
      const incoming_has_hide = /\|\s*hide\b/i.test(normalized_raw);
      let final_raw = normalized_raw;
      let final_value = delta.value;
      if (existing_had_hide && !incoming_has_show && !incoming_has_hide) {
        final_value = `${delta.value} | hide`;
        final_raw = _reconstruct_entry({ key: delta_key, value: final_value, visibility: "hide", is_origin: delta.is_origin, weight: delta.weight });
      } else if (incoming_has_show) {
        final_value = delta.value.replace(/\|\s*show\b/gi, "").trim();
        final_raw = _reconstruct_entry({ key: delta_key, value: final_value, visibility: "show", is_origin: delta.is_origin, weight: delta.weight });
      }
      current[existing_index] = { key: delta_key, raw: final_raw, value: final_value };
    } else {
      current.push({ key: delta_key, raw: normalized_raw, value: delta.value });
    }
  }

  let merged = current.map((entry) => entry.raw).join(", ");
  if (prose_remainder) merged = _append_prose_remainder(merged, prose_remainder, MAX_FIELD_CHARS);

  if (merged.length > MAX_FIELD_CHARS) {
    merged = merged.substring(merged.length - MAX_FIELD_CHARS);
  }
  return merged;
}

/**
 * Appends unstructured prose to a tagged-field string with line-level dedup
 * and a trailing-window character cap. Shared by the delta merge above.
 */
function _append_prose_remainder(base, prose, max_chars) {
  const existing = (base || "").trim();
  const incoming = String(prose || "").trim();
  if (!incoming) return existing;
  if (!existing) return incoming;
  const normalize = (t) => collapse_whitespace(String(t || "").toLowerCase());
  const existing_lines = existing
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const existing_norm = new Set(existing_lines.map(normalize));
  const retained = incoming
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !existing_norm.has(normalize(l)));
  if (retained.length === 0) return existing;
  let result = `${existing}\n${retained.join("\n")}`;
  if (result.length > max_chars) result = result.substring(result.length - max_chars);
  return result;
}

/** Merges aggregate string values with case-insensitive dedup. */
function _merge_aggregate_value(existing_value, incoming_items) {
  const list = String(existing_value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set(list.map((item) => collapse_whitespace(String(item)).toLowerCase()));
  for (const item of incoming_items) {
    const norm = collapse_whitespace(item).toLowerCase();
    if (item && !seen.has(norm)) {
      list.push(item);
      seen.add(norm);
    }
  }
  return list.join(", ");
}

// ============================================================================
// 📜 RELATIONAL CONSTELLATION HARVESTING
// ============================================================================

/**
 * Harvests all entity-referencing relationship brackets across an entity's 6 quadrant fields.
 * Scans bracket values (`[KEY: ... @TARGET ...]`) for `@TARGET` tokens, resolving them strictly
 * against `known_entities` and ambient role tokens (`@USER`, `@CHAR`, `@FRACTAL`), and delegates
 * `@ME`/`@SPEAKER`/`@YOU`/`@LISTENER` expansion to `parse_macros`.
 * Supports perspective-aware filtering ('owner' | 'other') to prevent private/hidden
 * relational dynamics from leaking to unauthorized viewpoints.
 *
 * @param {any} entity
 * @param {string[]|Array<{ id?: string, name?: string }>} [known_entities=[]]
 * @param {'owner'|'other'|'omniscient'} [perspective='owner']
 * @param {Object} [ambient_entities={}] - Ambient { USER, AI, FRACTAL }
 * @returns {Map<string, { target_id: string, target_name: string, eternal: string[], present: string[], past: string[], future: string[] }>}
 */
export function extract_entity_relationships(entity, known_entities = [], perspective = "owner", ambient_entities = {}) {
  const relationships = new Map();
  if (!entity || typeof entity !== "object") return relationships;

  const slug_to_entity = new Map();

  for (const item of known_entities || []) {
    if (typeof item === "string") {
      const clean = item.trim().toUpperCase();
      if (clean) slug_to_entity.set(clean, { id: clean, name: item.trim() });
    } else if (item && typeof item === "object") {
      const id_slug = item.id ? String(item.id).trim().toUpperCase() : null;
      const name_slug = item.name ? String(item.name).trim().toUpperCase() : null;
      const entity_meta = { id: item.id || item.name || "", name: item.name || item.id || "" };
      if (id_slug) slug_to_entity.set(id_slug, entity_meta);
      if (name_slug) slug_to_entity.set(name_slug, entity_meta);
    }
  }

  const PERSPECTIVE_MACROS = new Set(["ME", "YOU", "SPEAKER", "LISTENER", "OWNER", "TARGET"]);

  const resolve_target_token = (raw_key) => {
    const clean = String(raw_key || "")
      .trim()
      .replace(/^@/, "")
      .toUpperCase();
    if (!clean || PERSPECTIVE_MACROS.has(clean)) return null;
    if (clean === "USER" && ambient_entities.USER?.name) {
      const user_key = String(ambient_entities.USER.id || ambient_entities.USER.name).toUpperCase();
      return { key: user_key, display: ambient_entities.USER.name, id: ambient_entities.USER.id || user_key };
    }
    if (clean === "CHAR" && ambient_entities.AI?.name) {
      const ai_key = String(ambient_entities.AI.id || ambient_entities.AI.name).toUpperCase();
      return { key: ai_key, display: ambient_entities.AI.name, id: ambient_entities.AI.id || ai_key };
    }
    if (clean === "FRACTAL" && ambient_entities.FRACTAL?.name) {
      const fractal_key = String(ambient_entities.FRACTAL.id || ambient_entities.FRACTAL.name).toUpperCase();
      return { key: fractal_key, display: ambient_entities.FRACTAL.name, id: ambient_entities.FRACTAL.id || fractal_key };
    }
    const meta = slug_to_entity.get(clean);
    if (meta) {
      const key = meta.id ? String(meta.id).toUpperCase() : clean;
      return { key, display: meta.name || clean, id: meta.id || key };
    }
    return null;
  };

  const get_or_create_relationship = (target_key, target_id, target_name) => {
    if (!relationships.has(target_key)) {
      relationships.set(target_key, {
        target_id: target_id || target_key,
        target_name: target_name || target_key,
        eternal: [],
        present: [],
        past: [],
        future: [],
      });
    }
    return relationships.get(target_key);
  };

  const is_visible = (entry) => {
    if (perspective === "owner" || perspective === "omniscient") return true;
    return entry.visibility !== "hide";
  };

  const process_value = (value, target_entity) => {
    if (!value || typeof value !== "string") return "";
    const rel_ctx = create_relational_context({
      owner: entity,
      me: entity,
      speaker: entity,
      you: target_entity,
      listener: target_entity,
      target: target_entity,
    });
    return parse_macros(value, rel_ctx, {
      AI: ambient_entities.AI || entity,
      USER: ambient_entities.USER || target_entity,
      FRACTAL: ambient_entities.FRACTAL || null,
    });
  };

  const scan_field = (text, field_name) => {
    if (!text || typeof text !== "string") return;
    const entries = parse_tagged_fields(text);
    for (const entry of entries) {
      if (!is_visible(entry)) continue;
      const seen_in_entry = new Set();
      const token_matches = entry.value.matchAll(/(?<!\w)@([A-Za-z0-9_-]+)\b/g);
      for (const match of token_matches) {
        const target = resolve_target_token(match[1]);
        if (!target || seen_in_entry.has(target.key)) continue;
        seen_in_entry.add(target.key);
        const processed_val = process_value(entry.value, { id: target.id, name: target.display });
        const record = get_or_create_relationship(target.key, target.id, target.display);
        record[field_name].push(`[${entry.key}: ${processed_val}]`);
      }
    }
  };

  // 1. Eternal (physical & non-physical)
  scan_field(entity.eternal?.physical, "eternal");
  scan_field(entity.eternal?.non_physical, "eternal");

  // 2. Present (physical & non-physical)
  scan_field(entity.present?.physical, "present");
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
    /** @type {Record<string, string[]>} */
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
    if (typeof text !== "string" || text.indexOf("@") < 0) continue;
    const entries = parse_tagged_fields(text);
    for (const entry of entries) {
      const token_matches = entry.value.matchAll(/(?<!\w)@([A-Za-z0-9_-]+)\b/g);
      for (const match of token_matches) {
        const parsed_target = String(match[1] || "")
          .trim()
          .toLowerCase();
        if (target_ids.has(parsed_target)) {
          return true;
        }
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
// [SECTION 3: PHYSICAL STATE NORMALIZATION]
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

// ============================================================================
// [SECTION 4: RELATIONAL VECTOR CODECS]
// ============================================================================

/**
 * Parses a directed relational vector string: `"[Source] → [Target]: [Dynamic]"`.
 * Tolerates various arrow notations (`→`, `->`, `—>`, `=>`, `—`).
 * @param {string | null | undefined} vector_str
 * @returns {{ source_name: string, target_name: string, dynamic: string, raw: string } | null}
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

/**
 * Parses structured relationship links across quadrants into unified bracket items.
 *
 * @param {Array<Record<string, any>> | Record<string, any>} links_list
 * @param {boolean} [force_hidden=false]
 * @returns {Array<{ key: string, value: string, is_hidden: boolean, quadrant: string }>}
 */
export function parse_relationship_brackets(links_list, force_hidden = false) {
  const items = [];
  const seen = new Set();
  const list = Array.isArray(links_list) ? links_list : [links_list];

  for (const links of list) {
    if (!links || typeof links !== "object") continue;
    for (const [quadrant, bucket] of [
      ["present", links.present],
      ["eternal", links.eternal],
      ["past", links.past],
      ["future", links.future],
    ]) {
      if (!Array.isArray(bucket)) continue;
      for (const raw_entry of bucket) {
        const text = String(raw_entry || "").trim();
        if (!text) continue;
        const match = text.match(/^\[([^:\]]+):([\s\S]*)\]$/);
        const key = match ? match[1].trim() : "BOND";
        const raw_val = match ? match[2].trim() : text;
        const { value: parsed_val, is_hidden: flag_hidden } = parse_bracket_display_flags(raw_val);
        const is_hidden = force_hidden || flag_hidden || /(?:^|\s)\|(?:\s*(?:hide|private)\b)/i.test(raw_val);
        const value = parsed_val.replace(/^[→—=>:-]+\s*/, "").trim();
        if (!value) continue;
        const dedupe_key = `${quadrant}:${key.toUpperCase()}:${value}`;
        if (seen.has(dedupe_key)) continue;
        seen.add(dedupe_key);
        items.push({ key, value, is_hidden, quadrant });
      }
    }
  }
  return items;
}
