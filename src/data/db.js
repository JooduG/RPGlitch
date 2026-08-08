import Dexie from "dexie";
/**
 * @typedef {import('dexie').Table} Table
 */
/**
 * @type {import('dexie').Dexie & {
 *  entities: Table;
 *  stories: Table;
 *  simulation_log: Table;
 *  settings: Table;
 *  kv_settings: Table;
 *  sessions: Table;
 *  audio_prefs: Table;
 * }}
 */
const db = /** @type {any} */ (new Dexie("rpglitch"));
// --- SCHEMA VERSIONS ---
// v10: Baseline schema (entities, stories, simulation_log, kv_settings, sessions, audio_prefs, settings).
db.version(10).stores({
  entities: "id, name, description, profile_picture, signature_color, created_at, updated_at, tags, type, isChosen",
  stories: "++id, title, ai_id, user_id, fractal_id, created_at, updated_at",
  simulation_log: "++id, story_id, role, type, character_name, text, seed, meta, created_at",
  kv_settings: "key",
  sessions: "++id, session_id, timestamp",
  audio_prefs: "key",
  settings: "id",
});
// v11: Add `round` to stories; drop unused `settings` store.
db.version(11)
  .stores({
    stories: "++id, title, ai_id, user_id, fractal_id, round, created_at, updated_at",
    settings: null,
  })
  .upgrade(async (trans) => {
    return await trans
      .table("stories")
      .toCollection()
      .modify((story) => {
        if (story.turn !== undefined) {
          story.round = story.turn;
          delete story.turn;
        } else if (story.round === undefined) {
          story.round = 0;
        }
      });
  });
// v12: Prune `isChosen` index from entities (stability — align indexes with actual queries).
// --- STABILITY HANDLERS ---
db.version(12).stores({
  entities: "id, name, description, profile_picture, signature_color, created_at, updated_at, tags, type",
});
// v13: Drop the `[type+isCustom]` index (isCustom field retired by the Dev wing
// data-block harmonization). Re-declaring entities is a no-op for existing rows;
// the index simply stops existing going forward.
db.version(13).stores({
  entities: "id, name, description, profile_picture, signature_color, created_at, updated_at, tags, type",
});
/** @type {(() => void) | null} */
let _versionchange_quiesce = null;
let _versionchange_pending = false;

/**
 * Registers a quiesce callback invoked just before a versionchange reload.
 * The app uses it to stash a reload-safe session checkpoint — IndexedDB is
 * mid-upgrade at that point, so no DB writes are possible.
 * @param {(() => void) | null} fn
 */
export function set_versionchange_quiesce(fn) {
  _versionchange_quiesce = fn;
}

db.on("blocked", () => {
  console.warn("[Data] Database is blocked by another tab/version. Please close other instances.");
});
db.on("versionchange", () => {
  // Guard against reload loops when multiple versionchange events fire.
  if (_versionchange_pending) return;
  _versionchange_pending = true;
  try {
    _versionchange_quiesce?.();
  } catch (err) {
    console.warn("[Data] Versionchange quiesce failed:", err);
  }
  db.close();
  if (typeof window !== "undefined") window.location.reload();
});
/**
 * Initializes the database connection.
 */
export const init = async () => {
  try {
    await db.open();
    return db;
  } catch (err) {
    console.error("[Data] Failed to open database. You may need to manually delete it from browser DevTools.", /** @type {any} */ (err).stack || err);
    throw err;
  }
};
// Export the database instance so other modules can use it
export { db };
