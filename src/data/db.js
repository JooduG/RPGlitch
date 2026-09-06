/**
 * ============================================================================
 * src/data/db.js
 * 🗄️ INDEXEDDB DATABASE ENGINE (Dexie.js)
 * ============================================================================
 *
 * Single source of truth for the local-first IndexedDB schema and connection
 * lifecycle hooks (blocked/versionchange).
 *
 * TABLES:
 *   - entities:       All Character and Fractal records.
 *   - stories:        Narrative session descriptors and cast rosters (*npc_ids).
 *   - simulation_log: Turn-by-turn simulation message log.
 *   - kv_settings:    Key-value application and debug configuration.
 *   - sessions:       Session tracking timestamps.
 *   - audio_prefs:    Master audio preferences and volume keys.
 *
 * RULES FOR MODIFICATION:
 *   - Multi-entry indexes like *npc_ids must be declared with an asterisk prefix.
 *   - Do not import UI or reactive state layers into this persistence file.
 *   - Adhere strictly to P4: Zero Backwards Compatibility (pre-beta purity).
 *
 * DEPENDENCIES:
 *   - dexie
 * ============================================================================
 */

import Dexie from "dexie";

/**
 * @typedef {import('dexie').Table} Table
 */

/**
 * Typed Dexie Database instance.
 * @type {import('dexie').Dexie & {
 *  entities: Table;
 *  stories: Table;
 *  simulation_log: Table;
 *  kv_settings: Table;
 *  sessions: Table;
 *  audio_prefs: Table;
 * }}
 */
const db = /** @type {any} */ (new Dexie("rpglitch"));

// ============================================================================
// 1. CANONICAL SCHEMA DEFINITION
// ============================================================================

db.version(1).stores({
  entities: "id, name, description, profile_picture, signature_color, created_at, updated_at, tags, type",
  stories: "++id, title, ai_id, user_id, fractal_id, round, created_at, updated_at, *npc_ids",
  simulation_log: "++id, story_id, role, type, character_name, text, seed, meta, created_at",
  kv_settings: "key",
  sessions: "++id, session_id, timestamp",
  audio_prefs: "key",
});

// ============================================================================
// 2. LIFECYCLE & RESILIENCE HOOKS
// ============================================================================

/** @type {(() => void) | null} */
let _versionchange_quiesce = null;
let _is_versionchange_pending = false;

/**
 * Registers a quiesce callback invoked just before a versionchange reload.
 * The application uses it to stash a reload-safe session checkpoint — IndexedDB is
 * mid-upgrade at that point, so no DB writes are possible.
 * @param {(() => void) | null} quiesce_callback
 */
export function set_versionchange_quiesce(quiesce_callback) {
  _versionchange_quiesce = quiesce_callback;
}

db.on("blocked", () => {
  console.warn("[Database] Database is blocked by another tab/version. Please close other instances.");
});

db.on("versionchange", () => {
  // Guard against reload loops when multiple versionchange events fire.
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

// ============================================================================
// 3. INITIALIZATION & EXPORTS
// ============================================================================

/**
 * Initializes and opens the database connection.
 * @returns {Promise<typeof db>}
 */
export async function init_db() {
  try {
    await db.open();
    return db;
  } catch (error) {
    console.error(
      "[Database] Failed to open database. You may need to manually delete it from browser DevTools.",
      /** @type {any} */ (error).stack || error,
    );
    throw error;
  }
}

export { db };

// ============================================================================
// CHANGELOG
// ============================================================================
/**
 * CHANGELOG
 * - 2026-09-06: Flattened schema to clean canonical v1 under P4 Zero Backwards Compatibility;
 *   purged legacy v10-v13 migration chain and retired tables/indexes (settings, isChosen).
 * - 2026-08-29: Harmonized module structure, updated nomenclature (quiesce_callback, transaction, error, _is_versionchange_pending), added Universal File Architecture header and changelog blocks.
 */
