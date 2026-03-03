import Dexie from "dexie"

const error = console.error

/**
 * @typedef {import('dexie').Table} Table
 */

/**
 * @type {import('dexie').Dexie & {
 *  entities: Table;
 *  stories: Table;
 *  messages: Table;
 *  settings: Table;
 *  kv_settings: Table;
 *  sessions: Table;
 *  audio_prefs: Table;
 * }}
 */
const db = /** @type {any} */ (new Dexie("rpglitch"))

// 2. Define the schema (Final Version Only)
db.version(9).stores({
    entities: "id, name, description, profilePicture, signatureColor, createdAt, updatedAt, tags, type, [type+isCustom], isChosen",
    stories: "++id, title, aiId, userId, fractalId, createdAt, updatedAt",
    messages: "++id, storyId, role, type, characterName, text, seed, meta, createdAt",
    settings: "id",
    kv_settings: "key",
    sessions: "++id, sessionId, timestamp",
    audio_prefs: "key",
})

// --- STABILITY HANDLERS ---
db.on("blocked", () => {
    console.warn("[Data] Database is blocked by another tab/version. Please close other instances.")
})

db.on("versionchange", () => {
    db.close()
    if (typeof window !== "undefined") window.location.reload()
})

// 3. Populate default data
db.on("populate", async (trans) => {
    try {
        const settings = trans.table("settings")
        await settings.put({
            id: "app-settings",
            temperature: 0.7,
            top_p: 1.0,
            maxTokens: 512,
            stop: [],
            model: "default",
            debugMode: false,
            developerMode: false,
            storyPrologueInstructions: "",
            storyboardSelection: { fractal: null, user: null },
        })
    } catch (err) {
        error("[Data] Failed to populate default settings:", err)
        throw err
    }
})

/**
 * Initializes the database connection.
 */
export const init = async () => {
    try {
        await db.open()
        return db
    } catch (err) {
        error("[Data] Failed to open database. You may need to manually delete it from browser DevTools.", err.stack || err)
        throw err
    }
}

// 4. Export the database instance so other modules can use it
export { db }
