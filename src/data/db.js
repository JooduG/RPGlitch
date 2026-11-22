/**
 * src/data/db.js
 * ============================================================================
 * 🗄️ PERSISTENCE ENGINE (Dexie.js)
 * ============================================================================
 *
 * Pure Promise-based IndexedDB cabinet (`"rpglitch"`, schema v2):
 * - Database instance, lifecycle, and cross-tab `versionchange` quiesce
 * - Story & simulation-log key coercion helpers
 * - Active session pointer (`kv_settings`) & recent session access tracking
 * ============================================================================
 */

import Dexie from "dexie";

/** Durably stored active session key in `kv_settings`. */
export const SESSION_ID_KEY = "active_session_id";

/**
 * Dexie database instance.
 */
export const db = /** @type {any} */ (new Dexie("rpglitch"));

// Canonical Schema (Version 2; mutation_ledger removed)
db.version(1).stores({
  entities: "id, name, description, profile_picture, signature_color, created_at, updated_at, tags, type",
  stories: "++id, title, ai_id, user_id, fractal_id, round, created_at, updated_at, *npc_ids",
  simulation_log: "++id, story_id, role, type, character_name, text, seed, meta, created_at",
  kv_settings: "key",
  sessions: "++id, session_id, timestamp",
  audio_prefs: "key",
});

db.version(2).stores({ mutation_ledger: null });

let _versionchange_quiesce = null;
let _is_versionchange_pending = false;

/**
 * Registers an emergency quiesce callback invoked synchronously when Dexie receives
 * a `versionchange` event from another tab attempting an upgrade.
 * @param {(() => void) | null} quiesce_callback
 */
export function set_versionchange_quiesce(quiesce_callback) {
  _versionchange_quiesce = quiesce_callback;
}

db.on("blocked", () => {
  console.warn("[Database] Database is blocked by another tab/version. Please close other instances.");
});

db.on("versionchange", () => {
  if (_is_versionchange_pending) return;
  _is_versionchange_pending = true;
  try {
    _versionchange_quiesce?.();
  } catch (error) {
    console.warn("[Database] Versionchange quiesce failed:", error);
  }
  db.close();
  if (typeof window !== "undefined") {
    window.location.reload();
  }
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
// 1. KEY COERCION HELPERS
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
 * Returns deduplicated `[coerced, string]` key variants for IndexedDB `anyOf()` queries
 * across tables where `story_id` may be stored as either number or string.
 * @param {string | number} id
 * @returns {Array<string | number>}
 */
export function story_key_variants(id) {
  const coerced = coerce_story_key(id);
  return [...new Set([coerced, String(coerced)])];
}

/**
 * Coerces numeric string log IDs into numbers while preserving string IDs.
 * @param {string | number} id
 * @returns {string | number}
 */
export function coerce_log_key(id) {
  if (typeof id === "number") return id;
  if (typeof id === "string" && id.trim() !== "" && !isNaN(Number(id))) return Number(id);
  return id;
}

// ============================================================================
// 2. SESSION TRACKING & KV SETTINGS
// ============================================================================

/**
 * Records a session access timestamp.
 * @param {string} session_id
 * @returns {Promise<number>}
 */
export async function record_session_access(session_id) {
  return await db.sessions.add({ session_id: String(session_id), timestamp: Date.now() });
}

/**
 * Retrieves recent session access entries.
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
 * Sets the active session ID pointer.
 * @param {string} session_id
 * @returns {Promise<void>}
 */
export async function set_active_session_id(session_id) {
  await db.kv_settings.put({ key: SESSION_ID_KEY, value: String(session_id), updated_at: Date.now() });
}

/**
 * Clears the active session ID pointer.
 * @returns {Promise<void>}
 */
export async function clear_active_session_id() {
  await db.kv_settings.delete(SESSION_ID_KEY);
}

/**
 * Resets the entire IndexedDB database, wiping all tables and clearing session pointers.
 * @returns {Promise<void>}
 */
export async function reset_database() {
  await Promise.all([db.entities.clear(), db.stories.clear(), db.simulation_log.clear(), db.kv_settings.clear(), db.sessions.clear(), db.audio_prefs.clear()]);
}
