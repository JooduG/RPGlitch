/**
 * ============================================================================
 * src/data/ledger.js
 * 📜 MUTATION LEDGER & EVENT-SOURCING ACCESS LAYER
 * ============================================================================
 *
 * Implements change-only event storage for the Four-Quadrant entity fields
 * (eternal, present, past, future). Each mutation record captures discrete key updates,
 * atomic clearings, or prose pivots.
 *
 * SCHEMA:
 *   - id: Auto-increment primary key
 *   - story_id: Story identifier (or null for library births)
 *   - round: Coarse arc counter
 *   - seq: Intra-round sequence number (e.g. 1 for Director, 2 for Character, 3 for Forge)
 *   - turn_id: Simulation log message ID if applicable
 *   - entity_id: UUID of the affected entity
 *   - field: Quadrant leaf ("eternal.physical", "eternal.non_physical", "present.physical", "present.non_physical", "past", "future")
 *   - key: Bracket directive key (e.g. "SHIRT", "MIRA") or null for bare prose
 *   - old_value: Previous value or null
 *   - new_value: Updated value or null (null represents an atomic clear)
 *   - supersedes: Array of superseded keys/ids if cross-key override
 *   - timestamp: Millisecond epoch
 *   - writer: Origin subsystem ("genesis", "sorter", "forge", "director", "user")
 *
 * INVARIANTS:
 *   - Ledger lines are never embedded; semantic RAG operates on reconstructed text or past vector stores.
 *   - Mutations are append-only.
 *   - Ordering is strictly by (round, seq, timestamp).
 *
 * RULES FOR MODIFICATION:
 *   - Maintain compatibility with Dexie db.mutation_ledger schema.
 *   - Do not import UI or state stores directly into this persistence file.
 * ============================================================================
 */

import { db } from "./db.js";

/**
 * @typedef {Object} LedgerEntry
 * @property {number} [id] - Auto-incremented ID
 * @property {number|string|null} story_id - Story ID
 * @property {number} [round] - Round index
 * @property {number} [seq] - Sequence index within round (0: genesis/user, 1: director, 2: character, 3: forge)
 * @property {number|string|null} [turn_id] - Simulation log ID
 * @property {string} entity_id - Entity ID
 * @property {string} field - Quadrant field key
 * @property {string|null} [key] - Bracket directive key
 * @property {string|null} [old_value] - Prior value
 * @property {string|null} [new_value] - New value (null = cleared)
 * @property {'show'|'hide'|null} [visibility] - Bracket visibility flag
 * @property {number|null} [weight] - Bracket weight flag (1-10)
 * @property {string[]} [supersedes] - Array of superseded keys
 * @property {number} [timestamp] - Timestamp
 * @property {'genesis'|'sorter'|'forge'|'director'|'user'|string} [writer] - Origin writer
 * @property {string|null} [decider] - Origin subsystem deciding the mutation ('director', 'forge', 'user', 'genesis')
 */

// -----------------------------------------------------------------------------
// 1. MUTATION APPEND OPERATIONS
// -----------------------------------------------------------------------------

export function is_identical_mutation(entry) {
  if (!entry) return true;
  // If no prior state was provided for comparison, it is an explicit mutation/append and cannot be deduplicated
  if (entry.old_value === undefined && entry.old_visibility === undefined && entry.old_weight === undefined) {
    return false;
  }
  const is_same_value = (entry.old_value ?? null) === (entry.new_value ?? null);
  const is_same_visibility = (entry.old_visibility ?? null) === (entry.visibility ?? null);
  const is_same_weight = (entry.old_weight ?? null) === (entry.weight ?? null);
  return is_same_value && is_same_visibility && is_same_weight;
}

/**
 * Formats a single entry payload for database persistence.
 * @param {LedgerEntry} entry
 * @param {number} [fallback_timestamp]
 * @returns {Object}
 */
function format_entry_payload(entry, fallback_timestamp = Date.now()) {
  return {
    story_id: entry.story_id ?? null,
    round: Number(entry.round ?? 0),
    seq: Number(entry.seq ?? 0),
    turn_id: entry.turn_id ?? null,
    entity_id: String(entry.entity_id),
    field: String(entry.field),
    key: entry.key ? String(entry.key).toUpperCase().trim() : null,
    old_value: entry.old_value != null ? String(entry.old_value) : null,
    new_value: entry.new_value != null ? String(entry.new_value) : null,
    visibility: entry.visibility === "hide" ? "hide" : entry.visibility === "show" ? "show" : null,
    weight: typeof entry.weight === "number" && !Number.isNaN(entry.weight) ? entry.weight : null,
    supersedes: Array.isArray(entry.supersedes) ? entry.supersedes.map(String) : [],
    timestamp: Number(entry.timestamp ?? fallback_timestamp),
    writer: String(entry.writer || "unknown"),
    decider: entry.decider ? String(entry.decider) : entry.writer ? String(entry.writer) : null,
  };
}

/**
 * Appends a discrete mutation entry to the ledger.
 * Skips append if the new mutation is identical to the old state (dedup guard).
 *
 * @param {LedgerEntry} entry
 * @returns {Promise<number|null>} Inserted row ID, or null if deduplicated
 */
export async function append_ledger_entry(entry) {
  if (!entry || !entry.entity_id || !entry.field) {
    throw new Error("[Ledger] Invalid entry: entity_id and field are required.");
  }

  // Dedup Guard: Skip append if values and flags did not change
  if (is_identical_mutation(entry)) {
    return null;
  }

  const payload = format_entry_payload(entry);
  return await db.mutation_ledger.add(payload);
}

/**
 * Appends multiple mutation entries in a single transaction.
 * Filters out no-op identical mutations.
 *
 * @param {LedgerEntry[]} entries
 * @returns {Promise<void>}
 */
export async function append_ledger_entries(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return;
  const now = Date.now();
  const payloads = entries.filter((e) => e && e.entity_id && e.field && !is_identical_mutation(e)).map((entry) => format_entry_payload(entry, now));

  if (payloads.length > 0) {
    await db.mutation_ledger.bulkAdd(payloads);
  }
}

// -----------------------------------------------------------------------------
// 2. QUERY & REPLAY OPERATIONS
// -----------------------------------------------------------------------------

/**
 * Retrieves the mutation history for a specific entity and optional field.
 * @param {string} entity_id
 * @param {string} [field]
 * @returns {Promise<LedgerEntry[]>}
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
 * @param {string|number} story_id
 * @param {number} [max_round=Infinity]
 * @param {number} [max_seq=Infinity]
 * @returns {Promise<LedgerEntry[]>}
 */
export async function query_story_snapshot(story_id, max_round = Infinity, max_seq = Infinity) {
  if (story_id == null) return [];
  const entries = await db.mutation_ledger.where("story_id").equals(story_id).sortBy("id");

  return entries.filter((e) => {
    if (e.round < max_round) return true;
    if (e.round === max_round && e.seq <= max_seq) return true;
    return false;
  });
}

/**
 * Replays ledger entries for an entity's field to reconstruct the bracket dictionary or prose state.
 * Restores visibility, weight, and formatted bracket lines.
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
      raw_prose = entry.new_value;
    }
  }

  // Build reconstructed bracket string with preserved flags
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

export const ledger_repository = {
  append: append_ledger_entry,
  append_batch: append_ledger_entries,
  query_entity_history,
  query_story_snapshot,
  replay_entity_field,
  replay_full_entity_at_round,
};

// -----------------------------------------------------------------------------
// CHANGELOG
// -----------------------------------------------------------------------------
/**
 * CHANGELOG
 * - 2026-10-03: Added `replay_full_entity_at_round` to reconstruct an entity's complete Four-Quadrant state at any historical round.
 * - 2026-10-03: Phase B1.1 Hardening — Added `is_identical_mutation` dedup guard, `visibility`, `weight`, and `decider` properties, and enhanced `replay_entity_field` to reconstruct full bracket predicates preserving flags.
 * - 2026-10-02: Initial creation of the mutation ledger persistence module per Part 8 architecture.
 */
