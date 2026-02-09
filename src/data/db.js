import Dexie from "dexie"

const log = console.log
const error = console.error

const db = new Dexie("rpglitch")

// 2. Define the schema (Final Version Only)
db.version(7).stores({
    entities:
        "id, name, description, profilePicture, signatureColor, createdAt, updatedAt, tags, type, [type+isCustom], isChosen",
    stories: "++id, title, aiId, userId, fractalId, createdAt, updatedAt",
    messages:
        "++id, storyId, role, type, characterName, text, seed, meta, createdAt",
    settings: "id",
})

// --- STABILITY HANDLERS ---
db.on("blocked", () => {
    console.warn(
        "[Scholar] Database is blocked by another tab/version. Please close other instances."
    )
})

db.on("versionchange", () => {
    log("[Scholar] Database version change detected. Refreshing...")
    db.close()
    if (typeof window !== "undefined") window.location.reload()
})

// 3. Populate default data
db.on("populate", async (trans) => {
    log("[Scholar] Populating new database with default settings...")
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
        log("[Scholar] Default settings created successfully.")
    } catch (err) {
        error("[Scholar] Failed to populate default settings:", err)
        throw err
    }
})

/**
 * Initializes the database connection.
 */
export const init = async () => {
    try {
        await db.open()
        log("[Scholar] Database opened successfully.")
        return db
    } catch (err) {
        error(
            "[Scholar] Failed to open database. You may need to manually delete it from browser DevTools.",
            err.stack || err
        )
        throw err
    }
}

// 4. Export the database instance so other modules can use it
export { db }
