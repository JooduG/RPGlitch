/**
 * src/intelligence/synaptic.js
 * ============================================================================
 * 🧠 SYNAPTIC BRACKET ENGINE — Universal Bracket Predicate Domain Engine
 * ============================================================================
 *
 * Provides sovereign, deterministic parsing, targeted mutation, epistemic
 * filtering, and relationship harvesting for RPGlitch bracket predicates.
 *
 * Architecture & Modification Rules:
 * - Pure domain utility: zero UI, zero persistence, zero LLM dependencies.
 * - Universal bracket syntax: [KEY: value | flags]
 * - Brace-depth aware tokenization preserving Perchance alternations {a|b}.
 * - Targeted slice splicing: natural language prose and layout are 100% preserved.
 * - Supersession ledger contract: { text, superseded, history }.
 * - Three perspectives: 'owner', 'other', 'vision'.
 * - Secrecy signal preservation: hidden entries render as [KEY: value | private]
 *   for the owner so persona LLMs do not voice covert items/plans openly.
 * - Strict full-name domain nomenclature.
 * ============================================================================
 */

import { strip_visual_excluded } from "@utils";

// -----------------------------------------------------------------------------
// Constants & Configuration
// -----------------------------------------------------------------------------

const DEFAULT_WEIGHT = 5;
const MINIMUM_WEIGHT = 1;
const MAXIMUM_WEIGHT = 10;

/**
 * Recognized atomic clearing keywords that indicate an entry has been removed.
 * Restricts strictly to 'none' and explicit 'cleared' to avoid accidental data loss
 * of natural descriptive states (e.g., 'normal', 'bare', 'healed').
 */
const CLEARING_KEYWORDS = new Set(["none", "cleared"]);

// -----------------------------------------------------------------------------
// Bracket Entry Tokenization & Parsing
// -----------------------------------------------------------------------------

/**
 * @typedef {Object} BracketEntry
 * @property {string} key - Normalized uppercase key (e.g., 'TOP', 'ORION')
 * @property {string} original_key - Original key string preserving author casing
 * @property {string} value - Value content, preserving inner alternations {a|b}
 * @property {'show'|'hide'} visibility - Epistemic visibility flag
 * @property {number} weight - Narrative weight clamped between 1 and 10
 * @property {'active'|'superseded'} status - Lifecycle status
 * @property {string} raw - Full raw bracket token string including brackets
 * @property {number} start_index - Starting character index in the source text
 * @property {number} end_index - Ending character index in the source text
 */

/**
 * Parses all [KEY: value | flags] bracket entries from a text string.
 * Tracks curly brace depth so Perchance alternations like {a|b} inside values
 * are not split on pipes.
 *
 * @param {string|null|undefined} text
 * @returns {BracketEntry[]}
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

          // Split remainder on pipes ONLY when outside curly braces
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
          let weight = DEFAULT_WEIGHT;
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
                weight = Math.max(MINIMUM_WEIGHT, Math.min(MAXIMUM_WEIGHT, weight_value));
              }
            }
          }

          entries.push({
            key,
            original_key,
            value,
            visibility: /** @type {'show'|'hide'} */ (visibility),
            weight,
            status: /** @type {'active'|'superseded'} */ (status),
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

// -----------------------------------------------------------------------------
// Formatting
// -----------------------------------------------------------------------------

/**
 * Reconstructs a canonical bracket string from an entry object.
 *
 * @param {Object} options
 * @param {string} options.key
 * @param {string} options.value
 * @param {'show'|'hide'} [options.visibility='show']
 * @param {number} [options.weight=5]
 * @returns {string}
 */
export function format_bracket_entry({ key, value, visibility = "show", weight = DEFAULT_WEIGHT }) {
  const flags = [];
  if (visibility === "hide") {
    flags.push("hide");
  }
  if (weight !== DEFAULT_WEIGHT && weight != null) {
    const clamped_weight = Math.max(MINIMUM_WEIGHT, Math.min(MAXIMUM_WEIGHT, weight));
    flags.push(`w: ${clamped_weight}`);
  }

  if (flags.length > 0) {
    return `[${key}: ${value} | ${flags.join(" | ")}]`;
  }
  return `[${key}: ${value}]`;
}

// -----------------------------------------------------------------------------
// Targeted Slice Mutation & Ledger
// -----------------------------------------------------------------------------

/**
 * @typedef {Object} SupersededRecord
 * @property {string} key
 * @property {string} value
 * @property {'show'|'hide'} visibility
 * @property {number} weight
 * @property {number} round_superseded
 * @property {string} raw
 */

/**
 * Applies new bracket directives onto current text using targeted slice splicing.
 * Preserves non-bracket prose, leading descriptions, and spacing verbatim.
 *
 * @param {string} current_text
 * @param {string} directives
 * @param {Object} [options={}]
 * @param {number} [options.round=0]
 * @param {SupersededRecord[]} [options.history=[]]
 * @returns {{ text: string, superseded: SupersededRecord[], history: SupersededRecord[] }}
 */
export function apply_bracket_mutation(current_text, directives, { round = 0, history = [] } = {}) {
  const incoming_entries = parse_bracket_entries(directives);
  if (incoming_entries.length === 0) {
    return { text: current_text || "", superseded: [], history: [...history] };
  }

  let text_buffer = String(current_text || "");
  const superseded = [];
  const updated_history = [...history];

  for (const incoming of incoming_entries) {
    const current_entries = parse_bracket_entries(text_buffer);
    const existing_entry = current_entries.find((entry) => entry.key === incoming.key);
    const is_clearing = CLEARING_KEYWORDS.has(incoming.value.toLowerCase().trim());

    if (existing_entry) {
      // Check for identical values (idempotence)
      if (
        !is_clearing &&
        existing_entry.value === incoming.value &&
        existing_entry.visibility === incoming.visibility &&
        existing_entry.weight === incoming.weight
      ) {
        continue;
      }

      // Record supersession
      const record = {
        key: existing_entry.key,
        value: existing_entry.value,
        visibility: existing_entry.visibility,
        weight: existing_entry.weight,
        round_superseded: round,
        raw: existing_entry.raw,
      };
      superseded.push(record);
      updated_history.push(record);

      if (is_clearing) {
        // Remove the bracket and cleanly collapse whitespace/newlines
        const before = text_buffer.slice(0, existing_entry.start_index);
        let after = text_buffer.slice(existing_entry.end_index);

        if (before.endsWith("\n") && after.startsWith("\n")) {
          after = after.slice(1);
        } else if (before.endsWith(" ") && after.startsWith(" ")) {
          after = after.slice(1);
        }

        text_buffer = (before + after).trim();
      } else {
        // Targeted slice replacement
        const replacement = format_bracket_entry({
          key: incoming.key,
          value: incoming.value,
          visibility: incoming.visibility,
          weight: incoming.weight,
        });

        text_buffer = text_buffer.slice(0, existing_entry.start_index) + replacement + text_buffer.slice(existing_entry.end_index);
      }
    } else if (!is_clearing) {
      // Append new entry cleanly
      const formatted_new_entry = format_bracket_entry({
        key: incoming.key,
        value: incoming.value,
        visibility: incoming.visibility,
        weight: incoming.weight,
      });

      if (!text_buffer.trim()) {
        text_buffer = formatted_new_entry;
      } else if (text_buffer.includes("\n")) {
        text_buffer = `${text_buffer.trimEnd()}\n${formatted_new_entry}`;
      } else {
        text_buffer = `${text_buffer.trimEnd()} ${formatted_new_entry}`;
      }
    }
  }

  return {
    text: text_buffer,
    superseded,
    history: updated_history,
  };
}

// -----------------------------------------------------------------------------
// Epistemic Perspectives Filter
// -----------------------------------------------------------------------------

/**
 * Filters a string containing bracket entries according to perspective.
 *
 * - 'owner': sees all entries. Hidden entries receive the '| private' secrecy signal.
 * - 'other': hide entries are completely removed. Engine flags stripped from show entries.
 * - 'vision': hide entries are removed AND visual-excluded keys (INVENTORY, STASH, etc.) removed.
 *
 * @param {string|null|undefined} text
 * @param {'owner'|'other'|'vision'} [perspective='other']
 * @returns {string}
 */
export function filter_epistemic_brackets(text, perspective = "other") {
  if (!text || typeof text !== "string") return "";

  let working_text = text;

  // For vision perspective, apply visual excluded sanitization first
  if (perspective === "vision") {
    working_text = strip_visual_excluded(working_text);
  }

  const entries = parse_bracket_entries(working_text);
  if (entries.length === 0) return working_text;

  // Process backwards to preserve character indices
  for (let index = entries.length - 1; index >= 0; index--) {
    const entry = entries[index];

    if (entry.visibility === "hide") {
      if (perspective === "owner") {
        // Secrecy signal: keep entry but format cleanly with '| private'
        const secret_replacement = `[${entry.original_key}: ${entry.value} | private]`;
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
      // Show entry: strip all internal engine flags (hide, w: N) before prompt sees it
      const clean_replacement = `[${entry.original_key}: ${entry.value}]`;
      working_text = working_text.slice(0, entry.start_index) + clean_replacement + working_text.slice(entry.end_index);
    }
  }

  return working_text.trim();
}

// -----------------------------------------------------------------------------
// Relational Constellation Harvesting
// -----------------------------------------------------------------------------

/**
 * Harvests all entity-keyed relationship brackets across an entity's fields.
 * Supports perspective-aware filtering ('owner' | 'other') to prevent private/hidden
 * relational dynamics from leaking to unauthorized viewpoints.
 *
 * @param {any} entity
 * @param {string[]} [known_entity_names=[]]
 * @param {'owner'|'other'} [perspective='owner']
 * @returns {Map<string, { eternal?: string, present?: string, past: string[], future?: string }>}
 */
export function extract_entity_relationships(entity, known_entity_names = [], perspective = "owner") {
  const relationships = new Map();
  if (!entity || typeof entity !== "object") return relationships;

  const entity_name_set = new Set(
    known_entity_names.map((name) =>
      String(name || "")
        .toUpperCase()
        .trim(),
    ),
  );

  const get_or_create_relationship = (normalized_name) => {
    if (!relationships.has(normalized_name)) {
      relationships.set(normalized_name, { past: [] });
    }
    return relationships.get(normalized_name);
  };

  const is_visible = (entry) => {
    if (perspective === "owner") return true;
    return entry.visibility !== "hide";
  };

  // 1. Eternal non-physical
  if (entity.eternal?.non_physical) {
    const eternal_entries = parse_bracket_entries(entity.eternal.non_physical);
    for (const entry of eternal_entries) {
      if (entity_name_set.has(entry.key) && is_visible(entry)) {
        get_or_create_relationship(entry.key).eternal = entry.value;
      }
    }
  }

  // 2. Present non-physical
  if (entity.present?.non_physical) {
    const present_entries = parse_bracket_entries(entity.present.non_physical);
    for (const entry of present_entries) {
      if (entity_name_set.has(entry.key) && is_visible(entry)) {
        get_or_create_relationship(entry.key).present = entry.value;
      }
    }
  }

  // 3. Past vectors (read content from TemporalVector objects)
  if (Array.isArray(entity.past)) {
    for (const vector of entity.past) {
      const content = vector?.content || vector?.text || "";
      const past_entries = parse_bracket_entries(content);
      if (past_entries.length > 0) {
        for (const entry of past_entries) {
          if (entity_name_set.has(entry.key) && is_visible(entry)) {
            get_or_create_relationship(entry.key).past.push(entry.value);
          }
        }
      } else if (vector?.meta?.key && entity_name_set.has(String(vector.meta.key).toUpperCase())) {
        if (perspective === "owner" || vector?.meta?.visibility !== "hide") {
          get_or_create_relationship(String(vector.meta.key).toUpperCase()).past.push(content);
        }
      }
    }
  }

  // 4. Future
  if (entity.future && typeof entity.future === "string") {
    const future_entries = parse_bracket_entries(entity.future);
    for (const entry of future_entries) {
      if (entity_name_set.has(entry.key) && is_visible(entry)) {
        get_or_create_relationship(entry.key).future = entry.value;
      }
    }
  }

  return relationships;
}

/**
 * CHANGELOG
 * ============================================================================
 * - 2026-09-30: Tightened CLEARING_KEYWORDS to 'none' and 'cleared' preventing data loss
 *   of valid narrative values ('normal', 'bare', 'healed'). Added 'private' flag alias
 *   in tokenizer to preserve secrecy round-trips. Added perspective parameter to
 *   extract_entity_relationships to prevent private relationship leaks.
 * - 2026-09-29: Initial implementation of the Synaptic Bracket Engine (synaptic.js).
 *   Delivers brace-depth aware parsing for Perchance alternations, targeted slice
 *   mutation with supersession ledger, three-way epistemic filtering ('owner' |
 *   'other' | 'vision') with owner secrecy signals, and cross-tempus relationship harvesting.
 * ============================================================================
 */
