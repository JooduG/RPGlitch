// apps/rpglitch/js/db.js
"use strict";

// 1. Create the database instance.
// In the browser, Dexie is provided globally by a vendored library.
// In the Jest/Node.js test environment, we must require it.
let Dexie;
if (typeof window !== "undefined" && window.Dexie) {
  Dexie = window.Dexie;
} else {
  // Jest/Node.js environment
  Dexie = require("dexie").default;
}

const db = new Dexie("rpglitch");

// 2. Define the schema (Final Version Only)
// All previous migration logic has been "nuked" into this single version.
db.version(1).stores({
  entities:
    "++id, name, type, updated, avatar, persona, scenario, tags, createdAt, updatedAt, isSelected, [type+isCustom], signatureColour",
  stories: "++id, characterId, title, settingsSnapshot, createdAt, updatedAt",
  messages: "++id, storyId, role, text, seed, meta, createdAt",
  settings: "id", // Singleton settings table
});

// 3. Populate default data
// This hook runs ONLY when the database is created for the first time.
// It sets up the default settings singleton.
db.on("populate", async (trans) => {
  console.log("[RPGlitch DB] Populating new database with default settings...");
  try {
    const settings = trans.table("settings");
    await settings.put({
      id: "app-settings",
      temperature: 0.7,
      top_p: 1.0,
      maxTokens: 512,
      stop: [],
      model: "default",
      debugMode: false,
      storyboardSelection: { ai: null, user: null, world: null },
    });
    console.log("[RPGlitch DB] Default settings created successfully.");
  } catch (err) {
    console.error("[RPGlitch DB] Failed to populate default settings:", err);
    throw err; // Make sure the populate transaction fails if this fails
  }
});

/**
 * Initializes the database connection.
 * This simplified function just opens the database.
 * If it fails (e.g., schema error from you editing version(1) later),
 * just delete the database from your browser's DevTools as you normally do.
 */
export async function init() {
  try {
    await db.open();
    console.log("[RPGlitch DB] Database opened successfully.");
    return db; // Return the opened instance
  } catch (err) {
    console.error(
      "[RPGlitch DB] Failed to open database. You may need to manually delete it from browser DevTools.",
      err.stack || err
    );
    throw err;
  }
}

// 4. Export the database instance so other modules can use it
export { db };
