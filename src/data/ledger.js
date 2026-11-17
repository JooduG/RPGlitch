/**
 * src/data/ledger.js
 * ============================================================================
 * 📒 MUTATION LEDGER & EVENT-SOURCED PROVENANCE (pure, no runes)
 * ============================================================================
 *
 * State mutation diffs tagged with a writer (`kernel` by default). Imports
 * `@utils` statically — no dynamic parser imports.
 * ============================================================================
 */

import { parse_bracket_entries } from "@utils";
import { coerce_story_key, db } from "./db.js";

// ============================================================================
// 1. WRITE PATH (identical-entry filtering)
// ============================================================================

function is_identical_mutation(entry) {
  if (!entry) return true;
  if (entry.old_value === undefined && entry.old_visibility === undefined && entry.old_weight === undefined) {
    return false;
  }
  const is_same_value = (entry.old_value ?? null) === (entry.new_value ?? null);
  const is_same_visibility = (entry.old_visibility ?? null) === (entry.visibility ?? null);
  const is_same_weight = (entry.old_weight ?? null) === (entry.weight ?? null);
  return is_same_value && is_same_visibility && is_same_weight;
}

/**
 * Appends a state mutation diff to the ledger tagged with writer: "kernel".
 *
 * @param {object} entry
 * @returns {Promise<number | null>} entry id
 */
export async function append_ledger_entry(entry) {
  if (!entry || !entry.entity_id || !entry.field) {
    throw new Error("[Ledger] Invalid entry: entity_id and field are required.");
  }
  if (is_identical_mutation(entry)) {
    return null;
  }
  const payload = {
    story_id: entry.story_id != null ? coerce_story_key(entry.story_id) : null,
    entity_id: String(entry.entity_id || ""),
    round: Number(entry.round ?? 0),
    seq: Number(entry.seq ?? 0),
    turn_id: entry.turn_id ?? null,
    field: String(entry.field || ""),
    key: entry.key ? String(entry.key).toUpperCase().trim() : null,
    old_value: entry.old_value != null ? String(entry.old_value) : null,
    new_value: entry.new_value != null ? String(entry.new_value) : null,
    visibility:
      entry.visibility === "hide" ? "hide"
      : entry.visibility === "show" ? "show"
      : null,
    weight: typeof entry.weight === "number" && !Number.isNaN(entry.weight) ? entry.weight : null,
    writer: entry.writer || "kernel",
    decider: entry.decider || "kernel",
    timestamp: entry.timestamp || Date.now(),
  };

  return await db.mutation_ledger.add(payload);
}

/**
 * Appends multiple mutation entries to the ledger in a batch.
 *
 * @param {Array<object>} entries
 * @returns {Promise<void>}
 */
export async function append_ledger_entries(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return;
  const filtered_entries = entries.filter((entry) => entry && entry.entity_id && entry.field && !is_identical_mutation(entry));
  if (filtered_entries.length === 0) return;
  const payloads = filtered_entries.map((entry) => ({
    story_id: entry.story_id != null ? coerce_story_key(entry.story_id) : null,
    entity_id: String(entry.entity_id || ""),
    round: Number(entry.round ?? 0),
    seq: Number(entry.seq ?? 0),
    field: String(entry.field || ""),
    key: entry.key ? String(entry.key).toUpperCase().trim() : null,
    old_value: entry.old_value != null ? String(entry.old_value) : null,
    new_value: entry.new_value != null ? String(entry.new_value) : null,
    visibility:
      entry.visibility === "hide" ? "hide"
      : entry.visibility === "show" ? "show"
      : null,
    weight: typeof entry.weight === "number" && !Number.isNaN(entry.weight) ? entry.weight : null,
    writer: entry.writer || "kernel",
    decider: entry.decider || "kernel",
    timestamp: entry.timestamp || Date.now(),
  }));
  await db.mutation_ledger.bulkAdd(payloads);
}

// ============================================================================
// 2. READ PATH (history, snapshots, replay)
// ============================================================================

/**
 * Retrieves mutation ledger entries for a story ordered by id.
 *
 * @param {string | number} story_id
 * @returns {Promise<Array<object>>}
 */
export async function get_story_ledger(story_id) {
  const key = coerce_story_key(story_id);
  const ids_to_match = [...new Set([key, String(key)])];
  return await db.mutation_ledger.where("story_id").anyOf(ids_to_match).sortBy("id");
}

/**
 * Queries mutation ledger records for a specific entity or [entity_id + field].
 *
 * @param {string|number} entity_id
 * @param {string|null} [field=null]
 * @returns {Promise<any[]>}
 */
export async function query_entity_history(entity_id, field = null) {
  if (!entity_id) return [];
  if (field) {
    return await db.mutation_ledger
      .where("[entity_id+field]")
      .equals([String(entity_id), String(field)])
      .sortBy("timestamp");
  }
  return await db.mutation_ledger.where("entity_id").equals(String(entity_id)).sortBy("timestamp");
}

/**
 * Retrieves all ledger entries for a story up to a specific (round, seq) point.
 *
 * @param {string|number} story_id
 * @param {number} [max_round=Infinity]
 * @param {number} [max_seq=Infinity]
 * @returns {Promise<Array<object>>}
 */
export async function query_story_snapshot(story_id, max_round = Infinity, max_seq = Infinity) {
  if (story_id == null) return [];
  const story_ids = [...new Set([String(story_id), coerce_story_key(story_id)])];
  const entries = await db.mutation_ledger.where("story_id").anyOf(story_ids).sortBy("id");

  return entries.filter((e) => {
    if (e.round < max_round) return true;
    if (e.round === max_round && e.seq <= max_seq) return true;
    return false;
  });
}

/**
 * Replays ledger entries for an entity's field to reconstruct the bracket dictionary or prose state.
 *
 * @param {string} entity_id
 * @param {string} field
 * @param {number} [up_to_round=Infinity]
 * @param {number} [up_to_seq=Infinity]
 * @returns {Promise<{
 *   key_values: Map<string, string>,
 *   entries_map: Map<string, { value: string, visibility: 'show'|'hide', weight: number }>,
 *   reconstructed_brackets: string,
 *   raw_prose: string
 * }>}
 */
export async function replay_entity_field(entity_id, field, up_to_round = Infinity, up_to_seq = Infinity) {
  const history = await query_entity_history(entity_id, field);
  const key_values = new Map();
  const entries_map = new Map();
  let raw_prose = "";

  for (const entry of history) {
    if (entry.round > up_to_round) continue;
    if (entry.round === up_to_round && entry.seq > up_to_seq) continue;

    if (entry.key) {
      if (entry.new_value === null) {
        key_values.delete(entry.key);
        entries_map.delete(entry.key);
      } else {
        key_values.set(entry.key, entry.new_value);
        entries_map.set(entry.key, {
          value: entry.new_value,
          visibility: entry.visibility === "hide" ? "hide" : "show",
          weight: typeof entry.weight === "number" ? entry.weight : 5,
        });
      }
      if (Array.isArray(entry.supersedes)) {
        for (const super_key of entry.supersedes) {
          key_values.delete(super_key.toUpperCase());
          entries_map.delete(super_key.toUpperCase());
        }
      }
    } else if (entry.new_value != null) {
      const parsed_brackets = parse_bracket_entries(entry.new_value);
      if (parsed_brackets.length > 0) {
        for (const bracket of parsed_brackets) {
          key_values.set(bracket.key, bracket.value);
          const is_hidden = bracket.flags ? bracket.flags.hide : bracket.visibility === "hide";
          const resolved_weight = bracket.flags?.weight ?? bracket.weight ?? 5;
          entries_map.set(bracket.key, {
            value: bracket.value,
            visibility: is_hidden ? "hide" : "show",
            weight: typeof resolved_weight === "number" ? resolved_weight : 5,
          });
        }
        const unbracketed = entry.new_value
          .replace(/\[[^\]:]+:[^\]]+\]/g, "")
          .replace(/^[\s,]+|[\s,]+$/g, "")
          .trim();
        if (unbracketed) raw_prose = unbracketed;
      } else {
        raw_prose = entry.new_value;
      }
    }
  }

  const bracket_lines = [];
  for (const [key, meta] of entries_map.entries()) {
    const flags = [];
    if (meta.visibility === "hide") flags.push("hide");
    if (meta.weight && meta.weight !== 5) flags.push(`w:${meta.weight}`);
    const flag_suffix = flags.length > 0 ? ` | ${flags.join(" ")}` : "";
    bracket_lines.push(`[${key}: ${meta.value}${flag_suffix}]`);
  }
  const reconstructed_brackets = bracket_lines.join(" ");

  return { key_values, entries_map, reconstructed_brackets, raw_prose };
}

/**
 * Replays all quadrants for an entity up to a target round to reconstruct its full profile state.
 *
 * @param {string} entity_id
 * @param {number} [up_to_round=Infinity]
 * @returns {Promise<{
 *   eternal: { physical: string, non_physical: string },
 *   present: { physical: string, non_physical: string },
 *   future: string
 * }>}
 */
export async function replay_full_entity_at_round(entity_id, up_to_round = Infinity) {
  const [eternal_p, eternal_np, present_p, present_np, past_res, future_res] = await Promise.all([
    replay_entity_field(entity_id, "eternal.physical", up_to_round),
    replay_entity_field(entity_id, "eternal.non_physical", up_to_round),
    replay_entity_field(entity_id, "present.physical", up_to_round),
    replay_entity_field(entity_id, "present.non_physical", up_to_round),
    replay_entity_field(entity_id, "past", up_to_round),
    replay_entity_field(entity_id, "future", up_to_round),
  ]);

  return {
    eternal: {
      physical: eternal_p.reconstructed_brackets || eternal_p.raw_prose || "",
      non_physical: eternal_np.reconstructed_brackets || eternal_np.raw_prose || "",
    },
    present: {
      physical: present_p.reconstructed_brackets || present_p.raw_prose || "",
      non_physical: present_np.reconstructed_brackets || present_np.raw_prose || "",
    },
    past: past_res.reconstructed_brackets || past_res.raw_prose || "",
    future: future_res.raw_prose || future_res.reconstructed_brackets || "",
  };
}
