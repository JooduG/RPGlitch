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
 * @returns {Promise<string>} entity id
 */
export async function upsert_entity(entity) {
  const normalized = normalize_entity(entity);
  await db.entities.put(normalized);
  return normalized.id;
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
  };
  return await db.simulation_log.add(payload);
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
