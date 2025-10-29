// apps/rpglitch/js/db.js
'use strict';

// 1. Create the database instance.
// The 'Dexie' global variable is loaded by your build script.
import Dexie from 'dexie';

const db = new Dexie('rpglitch');

// 2. Define the schema
db.version(2).stores({
  entities: '++id, name, type, updated, avatar, persona, scenario, tags, createdAt, updatedAt, isSelected, [type+isCustom]',
  threads: '++id, characterId, title, settingsSnapshot, createdAt, updatedAt',
  messages: '++id, threadId, role, text, seed, meta, createdAt',
  settings: '&id, temperature, top_p, maxTokens, stop, model', // 'id' as singleton key
});

/**
 * Initializes the database connection.
 */
export function init() {
  return db.open().catch((err) => {
    console.error('Failed to open DB:', err.stack || err);
  });
}

// 3. Export the database instance so other modules can use it
export { db };