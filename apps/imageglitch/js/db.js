// IndexedDB database configuration and initialization for ImageGlitch
// Uses Dexie.js (vendored library bundled into build output)

// Dexie is provided globally by vendored library in /build/local_libs/ (bundled into build output)
// In test environment, it will be mocked by the test setup
const Dexie = window.Dexie || globalThis.Dexie;

if (typeof Dexie === "undefined" && typeof global === "undefined") {
  // Only error in browser environment (not in test environment)
  console.error(
    "[ImageGlitch DB] Dexie is not available. Ensure build includes vendored Dexie library.",
  );
}

// Create database instance
const db = new Dexie("ImageGlitchDB");

// Version 1: Clean schema
db.version(1).stores({
  settings: "id",
});

/**
 * Initializes the database connection.
 * If the database has a corrupt schema, delete it and recreate fresh.
 */
export const init = async () => {
  try {
    return await db.open();
  } catch (err) {
    // Check if this is a schema incompatibility error
    if (
      err.name === "UpgradeError" ||
      (err.message && err.message.includes("primary key"))
    ) {
      console.warn(
        "[ImageGlitch DB] Schema corruption detected. Deleting and recreating database...",
      );

      try {
        // Delete the corrupted database
        await Dexie.delete("ImageGlitchDB");
        console.log("[ImageGlitch DB] Old database deleted.");

        // Recreate the database with fresh schema
        const newDb = new Dexie("ImageGlitchDB");
        newDb.version(1).stores({
          settings: "id",
        });
        await newDb.open();

        // Create default settings after opening
        await newDb.table("settings").put({
          id: "app-settings",
          mainPromptContent: "",
          seed: "",
          numImagesToGen: 1,
          masterCreativity: 4,
          instructionInput: "",
          instructionsVisible: false,
        });

        await newDb.open();
        console.log(
          "[ImageGlitch DB] Fresh database created and opened successfully.",
        );
        return newDb;
      } catch (deleteErr) {
        console.error(
          "[ImageGlitch DB] Failed to recover from corruption:",
          deleteErr,
        );
        throw deleteErr;
      }
    } else {
      console.error("Failed to open ImageGlitch DB:", err.stack || err);
      throw err;
    }
  }
};

// Export database instance
export { db };
