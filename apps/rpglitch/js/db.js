// apps/rpglitch/js/db.js
'use strict';

// 1. Create the database instance.
// The 'Dexie' global variable is loaded by your build script.
const db = new Dexie('RPGlitchDB');

// 2. Define the schema
db.version(1).stores({
  entities: '++id, name, type, updated',
  threads: '++id, characterId, worldId, updated',
  messages: '++id, threadId, role, created',
  settings: '&key', // '&key' means 'key' is the unique primary key
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