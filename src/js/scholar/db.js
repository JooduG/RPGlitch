// apps/rpglitch/js/core-db.js
"use strict";

import { log, error } from "../gamemaster/utils.js";

// 1. Create the database instance.
let Dexie;
if (typeof window !== "undefined" && window.Dexie) {
  Dexie = window.Dexie;
} else if (typeof self !== "undefined" && self.Dexie) {
  // WebWorker environment
  Dexie = self.Dexie;
} else if (typeof globalThis !== "undefined" && globalThis.Dexie) {
  Dexie = globalThis.Dexie;
}

const db = new Dexie("rpglitch");

// 2. Define the schema (Final Version Only)
db.version(7).stores({
  entities:
    "id, name, description, profilePicture, signatureColor, createdAt, updatedAt, tags, type, [type+isCustom], isChosen",
  stories: "++id, title, aiId, userId, fractalId, createdAt, updatedAt",
  messages:
    "++id, storyId, role, type, characterName, text, seed, meta, createdAt",
  settings: "id",
});

// --- STABILITY HANDLERS ---
db.on("blocked", () => {
  console.warn(
    "[RPGlitch DB] Database is blocked by another tab/version. Please close other instances.",
  );
});

db.on("versionchange", () => {
  log("[RPGlitch DB] Database version change detected. Refreshing...");
  db.close();
  if (typeof window !== "undefined") window.location.reload();
});

// 3. Populate default data
db.on("populate", async (trans) => {
  log("[RPGlitch DB] Populating new database with default settings...");
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
      developerMode: false,
      storyPrologueInstructions: "",
      storyboardSelection: { fractal: null, user: null },
    });
    log("[RPGlitch DB] Default settings created successfully.");
  } catch (err) {
    error("[RPGlitch DB] Failed to populate default settings:", err);
    throw err;
  }
});

/**
 * Initializes the database connection.
 */
export const init = async () => {
  try {
    await db.open();
    log("[RPGlitch DB] Database opened successfully.");
    return db;
  } catch (err) {
    error(
      "[RPGlitch DB] Failed to open database. You may need to manually delete it from browser DevTools.",
      err.stack || err,
    );
    throw err;
  }
};

// 4. Export the database instance so other modules can use it
export { db };
