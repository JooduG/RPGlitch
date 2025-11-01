// apps/rpglitch/js/db.js
'use strict';

// 1. Create the database instance.
// Dexie is provided globally by vendored library in /build/local_libs/ (bundled into build output)
// In test environment, it will be mocked by the test setup
const Dexie = window.Dexie || globalThis.Dexie;

if (typeof Dexie === 'undefined' && typeof global === 'undefined') {
  // Only error in browser environment (not in test environment)
  console.error('[RPGlitch DB] Dexie is not available. Ensure build includes vendored Dexie library.');
}

const db = new Dexie('rpglitch');

// 2. Define the schema
// Version 2: Original schema with entities, threads, messages, settings
db.version(2).stores({
  entities: '++id, name, type, updated, avatar, persona, scenario, tags, createdAt, updatedAt, isSelected, [type+isCustom]',
  threads: '++id, characterId, title, settingsSnapshot, createdAt, updatedAt',
  messages: '++id, threadId, role, text, seed, meta, createdAt',
  settings: 'id',  // Singleton settings table (non-auto-increment primary key)
});

// Version 3: Add fields to settings for debug mode and storyboard selection
// Migration from localStorage to IndexedDB
db.version(3).stores({
  entities: '++id, name, type, updated, avatar, persona, scenario, tags, createdAt, updatedAt, isSelected, [type+isCustom]',
  threads: '++id, characterId, title, settingsSnapshot, createdAt, updatedAt',
  messages: '++id, threadId, role, text, seed, meta, createdAt',
  settings: 'id',  // Singleton settings table (non-auto-increment primary key)
}).upgrade(async (trans) => {
  try {
    console.log('[RPGlitch DB Migration] Starting migration v3...');

    // Migrate localStorage data to IndexedDB
    const settings = trans.table('settings');

    // Get existing settings or create new one
    let existingSettings = await settings.get('app-settings');
    if (!existingSettings) {
      existingSettings = { id: 'app-settings' };
    }

    // Migrate debug flag from localStorage
    try {
      const storedDebug = localStorage.getItem('rpglitch.debug') || '';
      existingSettings.debugMode = /^(1|true)$/i.test(String(storedDebug).trim());
    } catch {
      existingSettings.debugMode = false;
    }

    // Migrate storyboard selection from localStorage
    try {
      const storedSelection = localStorage.getItem('rpglitch-storyboard-selection');
      if (storedSelection) {
        existingSettings.storyboardSelection = JSON.parse(storedSelection);
      } else {
        existingSettings.storyboardSelection = { ai: null, user: null, world: null };
      }
    } catch {
      existingSettings.storyboardSelection = { ai: null, user: null, world: null };
    }

    // Save migrated settings
    await settings.put(existingSettings);

    // Clean up localStorage after successful migration
    try {
      localStorage.removeItem('rpglitch.debug');
      localStorage.removeItem('rpglitch-storyboard-selection');
    } catch {
      // Ignore errors when cleaning up localStorage
    }

    console.log('[RPGlitch DB Migration] Migration v3 completed successfully.');
  } catch (err) {
    console.error('[RPGlitch DB Migration] Migration v3 failed:', err);
    // Re-throw to mark migration as failed
    throw err;
  }
});

// Version 4: Migrate stories from localStorage to IndexedDB
db.version(4).stores({
  entities: '++id, name, type, updated, avatar, persona, scenario, tags, createdAt, updatedAt, isSelected, [type+isCustom]',
  threads: '++id, characterId, title, settingsSnapshot, createdAt, updatedAt',
  messages: '++id, threadId, role, text, seed, meta, createdAt',
  settings: 'id',  // Use 'id' as primary key (singleton pattern, non-auto-increment)
}).upgrade(async (trans) => {
  // Migrate stories from localStorage to IndexedDB
  const entities = trans.table('entities');

  try {
    // Read stories from localStorage
    const storiesJSON = localStorage.getItem('stories');
    if (storiesJSON) {
      const stories = JSON.parse(storiesJSON);

      if (Array.isArray(stories) && stories.length > 0) {
        // Transform stories to entity format and add to database
        const storyEntities = stories.map(story => ({
          ...story,
          type: 'story',
          name: story.title || story.name || 'Untitled Story',
          isCustom: !story.isPremade,
          isPremade: story.isPremade || false,
          createdAt: story.createdAt || Date.now(),
          updatedAt: story.updatedAt || Date.now(),
          isSelected: false,
        }));

        // Bulk add stories to entities table
        await entities.bulkAdd(storyEntities);

        console.log(`[Migration v4] Migrated ${storyEntities.length} stories from localStorage to IndexedDB`);
      }
    }

    // Clean up localStorage after successful migration
    try {
      localStorage.removeItem('stories');
    } catch {
      // Ignore errors when cleaning up localStorage
    }
  } catch (err) {
    console.error('Migration v4 error:', err);
    // Don't throw - allow app to continue even if migration fails
  }
});

// Version 5: Fix settings table primary key definition (correct singleton pattern)
// This handles the Dexie schema correction from previous versions
db.version(5).stores({
  entities: '++id, name, type, updated, avatar, persona, scenario, tags, createdAt, updatedAt, isSelected, [type+isCustom]',
  threads: '++id, characterId, title, settingsSnapshot, createdAt, updatedAt',
  messages: '++id, threadId, role, text, seed, meta, createdAt',
  settings: 'id',  // Correct singleton pattern
}).upgrade(async (trans) => {
  // Ensure settings singleton exists
  try {
    const settings = trans.table('settings');
    const existing = await settings.get('app-settings');
    if (!existing) {
      // Create default settings singleton if missing
      await settings.put({
        id: 'app-settings',
        temperature: 0.7,
        top_p: 1.0,
        maxTokens: 512,
        stop: [],
        model: 'default',
        debugMode: false,
        storyboardSelection: { ai: null, user: null, world: null }
      });
      console.log('[RPGlitch DB Migration] Created default settings singleton.');
    }
  } catch (err) {
    console.error('[RPGlitch DB Migration v5] Settings check failed:', err);
    // Continue anyway - schema is now correct
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
      console.warn('[RPGlitch DB] Schema corruption detected. Deleting and recreating database...');

      try {
        // Delete the corrupted database
        await Dexie.delete('rpglitch');
        console.log('[RPGlitch DB] Old database deleted.');

        // Recreate the database with fresh schema
        const newDb = new Dexie('rpglitch');
        newDb.version(5).stores({
          entities: '++id, name, type, updated, avatar, persona, scenario, tags, createdAt, updatedAt, isSelected, [type+isCustom]',
          threads: '++id, characterId, title, settingsSnapshot, createdAt, updatedAt',
          messages: '++id, threadId, role, text, seed, meta, createdAt',
          settings: 'id',
        });

        await newDb.open();
        console.log('[RPGlitch DB] Fresh database created and opened successfully.');

        // Create default settings
        await newDb.settings.put({
          id: 'app-settings',
          temperature: 0.7,
          top_p: 1.0,
          maxTokens: 512,
          stop: [],
          model: 'default',
          debugMode: false,
          storyboardSelection: { ai: null, user: null, world: null }
        });

        return newDb;
      } catch (deleteErr) {
        console.error('[RPGlitch DB] Failed to recover from corruption:', deleteErr);
        throw deleteErr;
      }
    } else {
      console.error('Failed to open DB:', err.stack || err);
      throw err;
    }
  }
}

// 3. Export the database instance so other modules can use it
export { db };