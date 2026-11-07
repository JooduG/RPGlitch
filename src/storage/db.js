/**
 * src/storage/db.js
 * ============================================================================
 * 🗄️ GREENFIELD PERSISTENCE ENGINE (Dexie.js)
 * ============================================================================
 *
 * Single source of truth for pure Promise-based persistence across:
 * - Entities (Characters and Fractals with 4-quadrant adapt-on-read)
 * - Stories & Narrative Archives
 * - Simulation Logs
 * - Session tracking & KV settings
 * - Mutation Ledger (Event-sourced diffs tagged writer: "kernel")
 *
 * Invariant: Schema strictly remains at db.version(2) to prevent versionchange
 * page reloads during parallel coexistence.
 * ============================================================================
 */

import Dexie from "dexie";
import { normalize_entity } from "./entities.js";
import { ALL_PREMADES } from "./presets.js";

/** Durably stored active session key in kv_settings */
export const SESSION_ID_KEY = "active_session_id";

/**
 * Greenfield Dexie database instance.
 */
export const db = /** @type {any} */ (new Dexie("rpglitch"));

// Canonical Schema (Strictly Version 2)
db.version(1).stores({
  entities: "id, name, description, profile_picture, signature_color, created_at, updated_at, tags, type",
  stories: "++id, title, ai_id, user_id, fractal_id, round, created_at, updated_at, *npc_ids",
  simulation_log: "++id, story_id, role, type, character_name, text, seed, meta, created_at",
  kv_settings: "key",
  sessions: "++id, session_id, timestamp",
  audio_prefs: "key",
});

db.version(2).stores({
  mutation_ledger: "++id, story_id, entity_id, [story_id+round+seq], [entity_id+field], round, timestamp",
});

/**
 * Initializes and opens the database connection.
 * @returns {Promise<typeof db>}
 */
export async function init_db() {
  if (!db.isOpen()) {
    await db.open();
  }
  return db;
}

// ============================================================================
// 1. STORY CRUD
// ============================================================================

/**
 * Coerces numeric string keys into numbers for Dexie table lookups.
 * @param {string | number} id
 * @returns {string | number}
 */
export function coerce_story_key(id) {
  if (typeof id === "string" && /^\d+$/.test(id)) return Number(id);
  return id;
}

/**
 * Lists all stories with associated fractal summary metadata.
 * @returns {Promise<Array<object>>}
 */
export async function list_stories() {
  const all_stories = await db.stories.orderBy("updated_at").reverse().toArray();
  const fractal_ids = [...new Set(all_stories.filter((s) => s.fractal_id).map((s) => s.fractal_id))];

  const fractals = await db.entities.where("id").anyOf(fractal_ids).toArray();
  const fractal_map = new Map(fractals.map((f) => [f.id, f]));

  return all_stories.map((story) => {
    const fractal = fractal_map.get(story.fractal_id);
    const is_concluded = Boolean(story.is_concluded);

    return {
      id: story.id,
      title: story.title || "Untitled Story",
      state: is_concluded ? "concluded" : "active",
      last_played: story.updated_at || story.created_at,
      fractal_profile_picture: fractal?.profile_picture || "",
      fractal_name: fractal?.name || "The Void",
      signature_color: fractal?.signature_color || "default",
      npc_ids: Array.isArray(story.npc_ids) ? story.npc_ids : [],
      ai_id: story.ai_id != null ? String(story.ai_id) : null,
      user_id: story.user_id != null ? String(story.user_id) : null,
      fractal_id: story.fractal_id != null ? String(story.fractal_id) : null,
    };
  });
}

/**
 * Retrieves a single story by ID.
 * @param {string | number} id
 * @returns {Promise<object | undefined>}
 */
export async function get_story(id) {
  return await db.stories.get(coerce_story_key(id));
}

/**
 * Creates a new story record.
 * @param {object} data
 * @returns {Promise<number | string>} created story id
 */
export async function create_story(data) {
  const now = Date.now();
  const payload = {
    title: data.title || "Untitled Story",
    ai_id: data.ai_id || null,
    user_id: data.user_id || null,
    fractal_id: data.fractal_id || null,
    round: Number(data.round ?? 0),
    npc_ids: Array.isArray(data.npc_ids) ? data.npc_ids : [],
    is_concluded: 0,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
    ...data,
  };
  return await db.stories.add(payload);
}

/**
 * Updates an existing story record.
 * @param {string | number} id
 * @param {object} changes
 * @returns {Promise<number>}
 */
export async function update_story(id, changes) {
  const updated_at = changes.updated_at || Date.now();
  return await db.stories.update(coerce_story_key(id), { ...changes, updated_at });
}

/**
 * Replaces a story's world-cast roster (NPC ids).
 * Sanitizes input (trims, drops empties, dedupes).
 *
 * @param {string | number} id
 * @param {string[]} npc_ids
 * @returns {Promise<number>}
 */
export async function update_cast(id, npc_ids) {
  const sanitized_npc_ids = Array.isArray(npc_ids)
    ? [...new Set(npc_ids.map((npc_identifier) => (npc_identifier == null ? "" : String(npc_identifier).trim())).filter(Boolean))]
    : [];
  return await db.stories.update(coerce_story_key(id), { npc_ids: sanitized_npc_ids, updated_at: Date.now() });
}

/**
 * Resolves the entity ids currently claimed by active (non-concluded) stories.
 * Matches legacy repository active claims resolver semantics without importing @data.
 *
 * @returns {Promise<string[]>}
 */
export async function active_entity_ids() {
  try {
    const all_stories = await db.stories.toArray();
    const story_ids = all_stories.map((story_record) => story_record.id);
    const normalized_ids = [...new Set(story_ids.flatMap((id) => [String(id), id]))];

    const epilogue_story_id_set = new Set();
    if (normalized_ids.length > 0) {
      const simulation_log_entries = await db.simulation_log.where("story_id").anyOf(normalized_ids).toArray();
      for (const entry of simulation_log_entries) {
        if (entry?.meta?.is_epilogue) epilogue_story_id_set.add(String(entry.story_id));
      }
    }

    const claimed_entity_ids = new Set();
    for (const story of all_stories) {
      if (story.is_concluded || epilogue_story_id_set.has(String(story.id))) continue;
      for (const key of ["ai_id", "user_id", "fractal_id"]) {
        if (story[key] != null) claimed_entity_ids.add(String(story[key]));
      }
    }

    return [...claimed_entity_ids];
  } catch (error) {
    console.error("[Storage] Failed to resolve active entity claims:", error);
    return [];
  }
}

/**
 * Marks a story as concluded.
 * @param {string | number} id
 * @returns {Promise<number>}
 */
export async function conclude_story(id) {
  return await db.stories.update(coerce_story_key(id), { is_concluded: 1, updated_at: Date.now() });
}

/**
 * Deletes a story and cascades to simulation logs and mutation ledger.
 * @param {string | number} id
 * @returns {Promise<void>}
 */
export async function delete_story(id) {
  const story_id = coerce_story_key(id);
  const ids_to_match = [...new Set([story_id, String(story_id)])];

  await db.simulation_log.where("story_id").anyOf(ids_to_match).delete();
  if (db.mutation_ledger) {
    await db.mutation_ledger.where("story_id").anyOf(ids_to_match).delete();
  }
  await db.stories.delete(story_id);
}

// ============================================================================
// 2. ENTITY CRUD & SEEDING
// ============================================================================

/**
 * Concurrency guard for starter seeding.
 */
let _is_seeding_active = false;

/**
 * Seeds starter entities into IndexedDB idempotently by ID.
 * @returns {Promise<void>}
 */
export async function seed_starter_entities() {
  if (_is_seeding_active) return;
  _is_seeding_active = true;

  try {
    const existing_records = await db.entities.toArray();
    const existing_ids = new Set(existing_records.map((r) => r.id));

    const to_add = [];
    for (const premade of ALL_PREMADES) {
      if (!existing_ids.has(premade.id)) {
        to_add.push(normalize_entity(premade));
      }
    }

    if (to_add.length > 0) {
      await db.entities.bulkPut(to_add);
    }
  } finally {
    _is_seeding_active = false;
  }
}

/**
 * Lists entities filtered by optional type ("character" | "fractal").
 * Always passes records through adapt-on-read normalize_entity.
 *
 * @param {"character" | "fractal"} [type]
 * @returns {Promise<Array<object>>}
 */
export async function list_entities(type) {
  let records;
  if (type) {
    records = await db.entities.where("type").equals(type).toArray();
  } else {
    records = await db.entities.toArray();
  }
  return records.map((record) => normalize_entity(record));
}

/**
 * Retrieves a single entity by ID with adapt-on-read.
 * Returns null if record does not exist.
 *
 * @param {string} id
 * @returns {Promise<object | null>}
 */
export async function get_entity(id) {
  if (!id) return null;
  const raw = await db.entities.get(id);
  if (!raw) return null;
  return normalize_entity(raw);
}

/**
 * Upserts a canonical entity record into IndexedDB.
 *
 * @param {object} entity
 * @returns {Promise<object>} normalized entity record
 */
export async function upsert_entity(entity) {
  const normalized = normalize_entity(entity);
  await db.entities.put(normalized);
  return normalized;
}

/**
 * Updates specific fields on an existing entity record in IndexedDB.
 *
 * @param {string} id
 * @param {Record<string, any>} changes
 * @returns {Promise<number>} Number of updated records (1 if updated, 0 if not found)
 */
export async function update_entity(id, changes) {
  if (!id) return 0;
  const updated_at = changes.updated_at || Date.now();
  return await db.entities.update(id, { ...changes, updated_at });
}

/**
 * Deletes an entity by ID.
 *
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function delete_entity(id) {
  if (!id) return;
  await db.entities.delete(id);
}

// ============================================================================
// 3. SIMULATION LOG CRUD
// ============================================================================

/**
 * Internal helper to find a simulation log entry by exact ID or metadata reference.
 *
 * @param {string | number} id
 * @returns {Promise<any | null>}
 */
export async function _find_log_entry(id) {
  const numeric_key = isNaN(Number(id)) ? null : Number(id);
  let entry = numeric_key != null ? await db.simulation_log.get(numeric_key) : null;
  if (!entry && typeof id === "string") {
    entry = await db.simulation_log.get(id);
  }
  if (!entry) {
    entry = await db.simulation_log.filter((message) => message.meta?.id === id).first();
  }
  return entry || null;
}

/**
 * Appends a message entry to the simulation log.
 *
 * @param {object} entry
 * @returns {Promise<number>} entry id
 */
export async function append_log_entry(entry) {
  const payload = {
    story_id: entry.story_id != null ? coerce_story_key(entry.story_id) : null,
    role: entry.role || "model",
    type: entry.type || "prose",
    character_name: entry.character_name || "",
    text: entry.text || "",
    seed: entry.seed ?? null,
    meta: entry.meta || {},
    created_at: entry.created_at || Date.now(),
    round: entry.round != null ? Number(entry.round) : null,
    turn_type: entry.turn_type || null,
    entity_id: entry.entity_id != null ? String(entry.entity_id) : null,
    attachments: Array.isArray(entry.attachments) ? entry.attachments : [],
  };
  return await db.simulation_log.add(payload);
}

/**
 * Deletes a single simulation log entry by ID.
 *
 * @param {string | number} id
 * @returns {Promise<void>}
 */
export async function delete_log_entry(id) {
  const entry = await _find_log_entry(id);
  const key = entry?.id != null ? entry.id : isNaN(Number(id)) ? id : Number(id);
  await db.simulation_log.delete(key);
}

/**
 * Updates text for an existing simulation log entry.
 *
 * @param {string | number} id
 * @param {string} new_text
 * @returns {Promise<void>}
 */
export async function edit_log_entry(id, new_text) {
  const entry = await _find_log_entry(id);
  const key = entry?.id != null ? entry.id : isNaN(Number(id)) ? id : Number(id);
  await db.simulation_log.update(key, { text: new_text });
}

/**
 * Updates an attachment at a specific index in a log entry.
 *
 * @param {string | number} id
 * @param {number} attachment_index
 * @param {Record<string, any>} new_attachment
 * @returns {Promise<void>}
 */
export async function update_log_attachment(id, attachment_index, new_attachment) {
  const entry = await _find_log_entry(id);
  if (entry) {
    if (!Array.isArray(entry.attachments)) {
      entry.attachments = [];
    }
    entry.attachments[attachment_index] = new_attachment;
    await db.simulation_log.put(entry);
  }
}

/**
 * Removes an attachment from a log entry (or deletes the entry if it becomes empty).
 *
 * @param {string | number} id
 * @param {number} attachment_index
 * @returns {Promise<void>}
 */
export async function delete_log_attachment(id, attachment_index) {
  const entry = await _find_log_entry(id);
  if (entry && Array.isArray(entry.attachments)) {
    entry.attachments.splice(attachment_index, 1);
    const is_empty_image_bubble =
      !entry.text?.trim() && !entry.meta?.is_prologue && !entry.meta?.is_epilogue && (!entry.attachments || entry.attachments.length === 0);
    if (is_empty_image_bubble) {
      const key = entry.id != null ? entry.id : isNaN(Number(id)) ? id : Number(id);
      await db.simulation_log.delete(key);
    } else {
      await db.simulation_log.put(entry);
    }
  }
}

/**
 * Retrieves all simulation log entries for a story ordered by id.
 *
 * @param {string | number} story_id
 * @returns {Promise<Array<object>>}
 */
export async function get_story_log(story_id) {
  const key = coerce_story_key(story_id);
  const ids_to_match = [...new Set([key, String(key)])];
  return await db.simulation_log.where("story_id").anyOf(ids_to_match).sortBy("id");
}

/**
 * Deletes all simulation log entries for a story.
 *
 * @param {string | number} story_id
 * @returns {Promise<number>} deleted count
 */
export async function delete_story_log(story_id) {
  const key = coerce_story_key(story_id);
  const ids_to_match = [...new Set([key, String(key)])];
  return await db.simulation_log.where("story_id").anyOf(ids_to_match).delete();
}

// ============================================================================
// 4. SESSION TRACKING & KV SETTINGS
// ============================================================================

/**
 * Records a session access timestamp.
 *
 * @param {string} session_id
 * @returns {Promise<number>}
 */
export async function record_session_access(session_id) {
  return await db.sessions.add({
    session_id: String(session_id),
    timestamp: Date.now(),
  });
}

/**
 * Retrieves recent session access entries.
 *
 * @param {number} [limit=10]
 * @returns {Promise<Array<object>>}
 */
export async function get_recent_sessions(limit = 10) {
  return await db.sessions.orderBy("id").reverse().limit(limit).toArray();
}

/**
 * Retrieves the currently active session ID pointer.
 * @returns {Promise<string | null>}
 */
export async function get_active_session_id() {
  const row = await db.kv_settings.get(SESSION_ID_KEY);
  return row?.value ?? null;
}

/**
 * Returns the currently active session ID pointer, or throws if none is active.
 *
 * @returns {Promise<string>}
 * @throws {Error} If no active session found.
 */
export async function require_active() {
  const active_id = await get_active_session_id();
  if (!active_id) {
    throw new Error("[Session] No active session found.");
  }
  return active_id;
}

/**
 * Appends a log message entry to the simulation log preserving the telemetry-sentinel guard.
 * Discards empty-prose messages unless attachments, prologue/epilogue, or telemetry sentinels
 * (e.g. DYNAMICS_DELTA, STORY_START, VECTOR_RESOLUTION, CONTINUUM_FORMATION, MEMORY_FORMATION) are present.
 *
 * @param {string} text - Message text or prose.
 * @param {string} role - Message author role ('user', 'model', 'ai', 'system', 'fractal').
 * @param {string} character_name - Name of the speaker.
 * @param {object} [options={}]
 * @param {string} [options.turn_type="USER_TURN"]
 * @param {object} [options.meta={}]
 * @param {Array<object>} [options.attachments=[]]
 * @param {string | number} [options.story_id=null]
 * @param {string} [options.entity_id=null]
 * @param {number} [options.round=null]
 * @returns {Promise<object>} Inserted or skipped log entry payload.
 */
export async function log_message(
  text,
  role,
  character_name,
  { turn_type = "USER_TURN", meta = {}, attachments = [], story_id = null, entity_id = null, round = null } = {},
) {
  let effective_story_id = story_id ?? null;
  if (effective_story_id == null) {
    try {
      effective_story_id = await require_active();
    } catch {
      return { id: meta?.id || `skip-${Date.now()}`, story_id: null, role, text: "", character_name, turn_type, meta };
    }
  }

  const is_telemetry_meta =
    meta?.type === "DYNAMICS_DELTA" ||
    meta?.type === "STORY_START" ||
    meta?.type === "VECTOR_RESOLUTION" ||
    meta?.type === "CONTINUUM_FORMATION" ||
    meta?.type === "MEMORY_FORMATION" ||
    Boolean(meta?.is_telemetry);

  const is_empty =
    typeof text === "string" &&
    !text.trim() &&
    (!attachments || attachments.length === 0) &&
    !meta?.is_prologue &&
    !meta?.is_epilogue &&
    !is_telemetry_meta;

  if (is_empty) {
    return { id: meta?.id || `skip-${Date.now()}`, story_id: effective_story_id, role, text: "", character_name, turn_type, meta };
  }

  const entry = {
    story_id: effective_story_id,
    role: role === "ai" ? "model" : role,
    type: "text",
    text,
    character_name,
    entity_id: entity_id ?? null,
    turn_type,
    round: round != null ? round : 0,
    meta: { ...meta },
    created_at: Date.now(),
  };

  if (attachments && attachments.length > 0) {
    entry.attachments = attachments;
  }

  if (meta && meta.id) {
    entry.id = meta.id;
    await db.simulation_log.put(entry);
  } else {
    entry.id = await db.simulation_log.add(entry);
  }

  return entry;
}

/**
 * Sets the active session ID pointer.
 * @param {string} session_id
 * @returns {Promise<void>}
 */
export async function set_active_session_id(session_id) {
  await db.kv_settings.put({
    key: SESSION_ID_KEY,
    value: String(session_id),
    updated_at: Date.now(),
  });
}

/**
 * Clears the active session ID pointer.
 * @returns {Promise<void>}
 */
export async function clear_active_session_id() {
  await db.kv_settings.delete(SESSION_ID_KEY);
}

// ============================================================================
// 5. MUTATION LEDGER & PROVENANCE TAGGING
// ============================================================================

/**
 * Appends a state mutation diff to the ledger tagged with writer: "kernel".
 *
 * @param {object} entry
 * @returns {Promise<number>} entry id
 */
export async function append_ledger_entry(entry) {
  const payload = {
    story_id: entry.story_id != null ? coerce_story_key(entry.story_id) : null,
    entity_id: String(entry.entity_id || ""),
    round: Number(entry.round ?? 0),
    seq: Number(entry.seq ?? 0),
    turn_id: entry.turn_id ?? null,
    field: String(entry.field || ""),
    key: entry.key ? String(entry.key).toUpperCase().trim() : null,
    old_value: entry.old_value ?? null,
    new_value: entry.new_value ?? null,
    visibility: entry.visibility ?? null,
    weight: entry.weight ?? null,
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
  const payloads = entries.map((entry) => ({
    story_id: entry.story_id != null ? coerce_story_key(entry.story_id) : null,
    entity_id: String(entry.entity_id || ""),
    round: Number(entry.round ?? 0),
    seq: Number(entry.seq ?? 0),
    turn_id: entry.turn_id ?? null,
    field: String(entry.field || ""),
    key: entry.key ? String(entry.key).toUpperCase().trim() : null,
    old_value: entry.old_value ?? null,
    new_value: entry.new_value ?? null,
    visibility: entry.visibility ?? null,
    weight: entry.weight ?? null,
    writer: entry.writer || "kernel",
    decider: entry.decider || "kernel",
    timestamp: entry.timestamp || Date.now(),
  }));
  await db.mutation_ledger.bulkAdd(payloads);
}

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
