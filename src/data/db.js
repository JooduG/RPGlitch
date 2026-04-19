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
// 2. Define the schema (Final Version Only)
db.version(10).stores({
  entities:
    "id, name, description, profile_picture, signature_color, created_at, updated_at, tags, type, [type+isCustom], isChosen",
  stories: "++id, title, ai_id, user_id, fractal_id, created_at, updated_at",
  simulation_log: "++id, story_id, role, type, character_name, text, seed, meta, created_at",
  kv_settings: "key",
  sessions: "++id, session_id, timestamp",
  audio_prefs: "key",
  settings: "id",
});
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
// --- STABILITY HANDLERS ---
db.on("blocked", () => {
  console.warn("[Data] Database is blocked by another tab/version. Please close other instances.");
});
db.on("versionchange", () => {
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
    console.error(
      "[Data] Failed to open database. You may need to manually delete it from browser DevTools.",
      err.stack || err,
    );
    throw err;
  }
};
// 4. Export the database instance so other modules can use it
export { db };
