// IndexedDB database configuration and initialization for ImageGlitch
// Uses Dexie.js (vendored library bundled into build output)

// Dexie is provided globally by vendored library in /build/local_libs/ (bundled into build output)
// In test environment, it will be mocked by the test setup
const Dexie = window.Dexie || globalThis.Dexie;

if (typeof Dexie === 'undefined' && typeof global === 'undefined') {
  // Only error in browser environment (not in test environment)
  console.error('[ImageGlitch DB] Dexie is not available. Ensure build includes vendored Dexie library.');
}

// Create database instance
const db = new Dexie('ImageGlitchDB');

// Version 1: Initial schema
db.version(1).stores({
  settings: 'id' // Primary key for settings document
});

// Version 2: Migration from localStorage to IndexedDB
db.version(2).stores({
  settings: 'id'
}).upgrade(async (trans) => {
  console.log('[ImageGlitch DB Migration] Starting migration v2...');

  try {
    // Check if migration already completed
    const existingSettings = await trans.table('settings').get('app-settings');
    if (existingSettings && existingSettings._migrated) {
      console.log('Migration already completed, skipping...');
      return;
    }

    // Access localStorage from global scope (supports both browser and test environments)
    const storage = typeof window !== 'undefined' ? window.localStorage : (typeof global !== 'undefined' ? global.localStorage : localStorage);

    // Read all localStorage keys
    const mainPromptContent = storage.getItem('mainPromptContent') || '';
    const imgSeed = storage.getItem('imgSeed');
    const numImagesToGen = storage.getItem('numImagesToGen');
    const masterCreativity = storage.getItem('masterCreativity');
    const instructionInput = storage.getItem('instructionInput') || '';
    const instructionsVisible = storage.getItem('instructionsVisible');

    // Transform and normalize values
    const settings = {
      id: 'app-settings',
      mainPromptContent: mainPromptContent,
      seed: imgSeed !== null && imgSeed !== '' ? Number(imgSeed) : '',
      numImagesToGen: numImagesToGen !== null ? Number(numImagesToGen) : 1,
      masterCreativity: masterCreativity !== null ? Number(masterCreativity) : 4, // DEFAULT_CREATIVITY_LEVEL
      instructionInput: instructionInput,
      instructionsVisible: instructionsVisible === 'true',
      _migrated: true, // Flag to prevent re-migration
      _migratedAt: new Date().toISOString()
    };

    // Write to IndexedDB
    await trans.table('settings').put(settings);
    console.log('Migration successful:', settings);

    // Clean up localStorage ONLY after successful IndexedDB write
    storage.removeItem('mainPromptContent');
    storage.removeItem('imgSeed');
    storage.removeItem('numImagesToGen');
    storage.removeItem('masterCreativity');
    storage.removeItem('instructionInput');
    storage.removeItem('instructionsVisible');

    console.log('[ImageGlitch DB Migration] Migration v2 completed successfully.');
  } catch (error) {
    console.error('[ImageGlitch DB Migration] Migration v2 failed, localStorage preserved:', error);
    // Do NOT remove localStorage if migration fails
    throw error; // Re-throw to mark migration as failed
  }
});

/**
 * Initializes the database connection.
 * If the database has a corrupt schema, delete it and recreate fresh.
 */
export async function init() {
  try {
    return await db.open();
  } catch (err) {
    // Check if this is a schema incompatibility error
    if (err.name === 'UpgradeError' ||
        (err.message && err.message.includes('primary key'))) {
      console.warn('[ImageGlitch DB] Schema corruption detected. Deleting and recreating database...');

      try {
        // Delete the corrupted database
        await Dexie.delete('ImageGlitchDB');
        console.log('[ImageGlitch DB] Old database deleted.');

        // Recreate the database with fresh schema
        const newDb = new Dexie('ImageGlitchDB');
        newDb.version(2).stores({
          settings: 'id'
        }).upgrade(async (trans) => {
          // Create default settings
          await trans.table('settings').put({
            id: 'app-settings',
            mainPromptContent: '',
            seed: '',
            numImagesToGen: 1,
            masterCreativity: 4,
            instructionInput: '',
            instructionsVisible: false,
            _migrated: true,
            _migratedAt: new Date().toISOString()
          });
        });

        await newDb.open();
        console.log('[ImageGlitch DB] Fresh database created and opened successfully.');
        return newDb;
      } catch (deleteErr) {
        console.error('[ImageGlitch DB] Failed to recover from corruption:', deleteErr);
        throw deleteErr;
      }
    } else {
      console.error('Failed to open ImageGlitch DB:', err.stack || err);
      throw err;
    }
  }
}

// Export database instance
export { db };
