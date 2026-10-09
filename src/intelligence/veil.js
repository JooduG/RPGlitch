/**
 * src/intelligence/veil.js
 * ============================================================================
 * 🛡️ THE VEIL ENGINE — Universal Bracket Predicates & Epistemic Wall
 * ============================================================================
 *
 * Provides sovereign, deterministic parsing, targeted mutation, epistemic
 * filtering, secrecy signaling, and relationship harvesting for RPGlitch.
 *
 * The Veil embodies phenomenological perspective and the Epistemic Wall:
 * what remains veiled from other entities versus what is unveiled to the
 * owner and omniscient director.
 *
 * Architecture & Modification Rules:
 * - Pure domain utility: zero UI, zero persistence, zero LLM dependencies.
 * - Universal bracket syntax: [KEY: value | flags]
 * - Brace-depth aware tokenization preserving Perchance alternations {a|b}.
 * - Targeted slice splicing: natural language prose and layout are 100% preserved.
 * - Supersession ledger contract: { text, superseded, history }.
 * - Three perspectives: 'owner', 'other', 'vision'.
 * - Secrecy signal preservation: hidden entries render as [KEY: value | hide]
 *   for the owner so persona LLMs do not voice covert items/plans openly.
 * - Epistemic wall enforcement: non-owner perspectives have all | hide brackets stripped.
 * - Vector retrieval sanitization: strip_bracket_engine_flags removes flags before embeddings.
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
// Epistemic Perspectives Filter & Secrecy Signaling
// -----------------------------------------------------------------------------

/**
 * Filters a string containing bracket entries according to perspective.
 *
 * - 'owner': sees all entries. Hidden entries receive the '| hide' secrecy signal.
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

  return working_text.trim();
}

/**
 * Strips hidden bracket entries from rendered state strings.
 * Enforces the Epistemic Wall so AI models never receive another entity's private knowledge.
 *
 * @param {string|null|undefined} text
 * @returns {string}
 */
export function strip_epistemic_tags(text) {
  if (!text) return "";
  return filter_epistemic_brackets(text, "other");
}

/**
 * Conditionally strips epistemic secrets and plans based on entity perspective.
 * When is_owner is true, private state is preserved; when false, state is sanitized.
 *
 * @param {string|null|undefined} state_text
 * @param {boolean} [is_owner=false]
 * @returns {string}
 */
export function strip_epistemic_secrets(state_text, is_owner = false) {
  if (!state_text) return "";
  return filter_epistemic_brackets(state_text, is_owner ? "owner" : "other");
}

/**
 * Verifies epistemic wall integrity in a compiled prompt string.
 * Audits for forbidden private tags or uncompiled | hide entries in unauthorized viewpoints.
 *
 * @param {string} prompt_text - Compiled prompt text to audit.
 * @param {Object} [options={}]
 * @param {boolean} [options.is_owner=false] - Whether the prompt perspective belongs to the owner entity.
 * @returns {boolean} True if clean, false if an epistemic leak was detected.
 */
export function verify_epistemic_integrity(prompt_text, { is_owner = false } = {}) {
  if (!prompt_text || typeof prompt_text !== "string") return true;
  if (!is_owner) {
    const hide_match = prompt_text.match(/\[[^\]]*\|\s*hide\s*[^\]]*\]/i);
    if (hide_match) {
      return false;
    }
    const private_match = prompt_text.match(/\[[^\]]*\|\s*private\s*[^\]]*\]/i);
    if (private_match) {
      return false;
    }
  }
  return true;
}

/**
 * Scrubs covert directives and secret flags (Track 3.3: private directive
 * purging) — [COVERT|SECRET|PRIVATE|HIDDEN: …] brackets and «COVERT»-style
 * runtime refs are stripped across entity boundaries before persona prompts
 * compile, while legitimate veil brackets ([KEY: value | hide]) pass through
 * to the perspective filter untouched.
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

// -----------------------------------------------------------------------------
// Relational Constellation Harvesting
// -----------------------------------------------------------------------------

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

  const entity_name_set = new Set();
  const id_to_name = new Map();

  for (const item of known_entities || []) {
    if (typeof item === "string") {
      const clean = item.trim().toUpperCase();
      entity_name_set.add(clean);
      entity_name_set.add(clean.replace(/\s+/g, "_"));
      if (clean.startsWith("@")) {
        entity_name_set.add(clean.slice(1));
        entity_name_set.add(clean.slice(1).replace(/\s+/g, "_"));
      }
    } else if (item && typeof item === "object") {
      if (item.name) {
        const clean = String(item.name).trim().toUpperCase();
        entity_name_set.add(clean);
        entity_name_set.add(clean.replace(/\s+/g, "_"));
        id_to_name.set(clean.replace(/\s+/g, "_"), item.name);
        if (item.id) id_to_name.set(String(item.id).toUpperCase(), item.name);
      }
      if (item.id) {
        const id_clean = String(item.id).trim().toUpperCase();
        entity_name_set.add(id_clean);
        entity_name_set.add(id_clean.replace(/\s+/g, "_"));
      }
    }
  }

  // Also register active role targets
  entity_name_set.add("USER");
  entity_name_set.add("CHAR");
  entity_name_set.add("FRACTAL");

  const normalize_target = (raw_key) => {
    let clean = String(raw_key || "")
      .trim()
      .toUpperCase();
    if (clean.startsWith("@")) clean = clean.slice(1);
    if (clean === "USER" && ambient_entities.USER?.name)
      return { key: ambient_entities.USER.name.toUpperCase(), display: ambient_entities.USER.name };
    if (clean === "CHAR" && ambient_entities.AI?.name) return { key: ambient_entities.AI.name.toUpperCase(), display: ambient_entities.AI.name };
    if (clean === "FRACTAL" && ambient_entities.FRACTAL?.name)
      return { key: ambient_entities.FRACTAL.name.toUpperCase(), display: ambient_entities.FRACTAL.name };
    const mapped = id_to_name.get(clean) || id_to_name.get(clean.replace(/\s+/g, "_"));
    return { key: mapped ? mapped.toUpperCase() : clean, display: mapped || clean };
  };

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
        const record = get_or_create_relationship(target.key);
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

/**
 * Strips all `@`-prefixed relational bracket entries from a text string.
 * Used by the `<STATE>` renderer to ensure entity-targeted dynamics
 * (e.g. `[@BEAST: prized asset]`) are never rendered in the STATE field
 * where they would leak across the Epistemic Wall — they belong exclusively
 * in the `<DISPOSITIONS>` block.
 *
 * @param {string|null|undefined} text
 * @returns {string}
 */
export function strip_relational_brackets(text) {
  if (!text || typeof text !== "string") return "";
  const entries = parse_bracket_entries(text);
  if (entries.length === 0) return text;

  let working_text = text;

  // Process backwards to preserve character indices
  for (let index = entries.length - 1; index >= 0; index--) {
    const entry = entries[index];
    const is_relational = entry.original_key?.startsWith("@") || entry.key.startsWith("@");
    if (!is_relational) continue;

    const before = working_text.slice(0, entry.start_index);
    let after = working_text.slice(entry.end_index);

    if (before.endsWith("\n") && after.startsWith("\n")) {
      after = after.slice(1);
    } else if (before.endsWith(" ") && after.startsWith(" ")) {
      after = after.slice(1);
    }

    working_text = before + after;
  }

  return working_text.trim();
}

/**
 * CHANGELOG
 * ============================================================================
 * - 2026-10-01: Added strip_relational_brackets to remove @-prefixed entity-targeted brackets from STATE fields, preventing relational dynamics from leaking across the Epistemic Wall outside of DISPOSITIONS blocks.
 * - 2026-10-01: Renamed synaptic.js to veil.js and merged all epistemic wall functions from epistemic.js (strip_epistemic_tags, strip_epistemic_secrets, verify_epistemic_integrity).
 * - 2026-10-01: Standardized on | hide secrecy flag for owner perspective in filter_epistemic_brackets, eliminating redundant | private translation; exported strip_bracket_engine_flags for false semantic embedding protection.
 * - 2026-09-30: Tightened CLEARING_KEYWORDS to 'none' and 'cleared' preventing data loss of valid narrative values ('normal', 'bare', 'healed'). Added perspective parameter to extract_entity_relationships to prevent private relationship leaks.
 * - 2026-09-29: Initial implementation of the Synaptic Bracket Engine. Delivers brace-depth aware parsing for Perchance alternations, targeted slice mutation with supersession ledger, three-way epistemic filtering ('owner' | 'other' | 'vision') with owner secrecy signals, and cross-tempus relationship harvesting.
 * ============================================================================
 */
