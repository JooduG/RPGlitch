# JavaScript Guide: Client-Side Storage

This document outlines the project's strategy for storing persistent data on the client-side. It covers the choice of technology, the implementation library, and best practices.

**Core Principle:** All client-side storage must use IndexedDB via the `Dexie.js` wrapper. `localStorage` and `sessionStorage` are prohibited for persistent application data.

---

## 1. Storage Philosophy: Why IndexedDB?

For complex applications that need to store a significant amount of structured data, IndexedDB is the superior choice over `localStorage`.

- **Capacity:** `localStorage` is typically limited to ~5MB. IndexedDB allows for much larger storage capacities (often 1GB or more, depending on the browser and user permissions).
- **Data Types:** `localStorage` can only store strings, requiring constant serialization (`JSON.stringify`) and deserialization (`JSON.parse`). IndexedDB can natively store complex JavaScript objects, arrays, and other types.
- **Performance:** IndexedDB is asynchronous, meaning it does not block the main browser thread. Heavy `localStorage` operations can cause the UI to become unresponsive.
- **Querying:** IndexedDB provides powerful querying capabilities, allowing you to fetch data using indexes, which is impossible with `localStorage`.

---

## 2. Implementation with `Dexie.js`

To simplify working with IndexedDB's verbose API, this project uses `Dexie.js`, a minimalist wrapper that makes database operations feel intuitive and modern.

### Defining the Database Schema

The first step is to define the database name and its tables (object stores) and indexes. This is typically done in a central database initialization file.

```javascript
// Example from RPGlitch
const db = new Dexie('RPGlitchDB');
db.version(1).stores({
  entities: '++id, name, type', // Primary key 'id' auto-increments, index 'name' and 'type'
  profiles: '++id, name'
});
```

### Creating, Reading, Updating, Deleting (CRUD)

Dexie provides a clean, promise-based API for all database operations.

- **Create (Add):**

  ```javascript
  db.entities.add({
    name: 'Gandalf',
    type: 'Wizard',
    level: 20
  }).then(() => {
    console.log('Gandalf has been added.');
  });
  ```

- **Read (Get/Find):**

  ```javascript
  // Get all entities
  const allWizards = await db.entities.where('type').equals('Wizard').toArray();

  // Get a single entity by its primary key
  const firstEntity = await db.entities.get(1);
  ```

- **Update:**

  ```javascript
  db.entities.update(1, { level: 21 }).then((updated) => {
    if (updated) console.log('Gandalf leveled up!');
  });
  ```

- **Delete:**

  ```javascript
  db.entities.delete(1).then(() => {
    console.log('Gandalf was deleted.');
  });
  ```

---

## 3. Error Handling in Dexie

Since database operations can fail, it's crucial to handle potential errors using `async/await` with `try...catch` blocks or by chaining `.catch()` onto promises.

```javascript
async function addNewEntity(entity) {
  try {
    const id = await db.entities.add(entity);
    console.log(`Entity added successfully with ID: ${id}`);
    return id;
  } catch (error) {
    console.error(`Failed to add entity: ${error.stack || error}`);
    // Optionally, display a user-friendly error message in the UI
    return null;
  }
}
```

Common errors to anticipate include:

- **ConstraintError:** Occurs when trying to add an object with a primary key that already exists.
- **TransactionInactiveError:** Occurs if you try to perform an operation after a transaction has completed.
- **QuotaExceededError:** The browser's storage limit has been reached.
