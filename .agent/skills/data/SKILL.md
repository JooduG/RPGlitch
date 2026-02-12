---
name: data
description: >
    Manages persistence and hydration. Owns the 'Bridge' between Svelte Runes and IndexedDB.
    Triggers:
    - "Save game"
    - "Load game"
    - "Update schema"
    - "Wipe data"
---

# 💾 Data Skill

> **Mandate**: "I am the steward of persistence. I ensure that the project's state is reliably mirrored between memory and disk, prioritizing system stability over complex migrations during development."

## 🏗️ Scope

This skill owns the persistence layer of the application:

- `src/data/db.js`: Dexie.js database configuration and schema.
- `src/data/bridge.js`: Serialization and hydration logic between Svelte Runes and IndexedDB.

## 🔴 The Alpha Rule

> [!IMPORTANT]
> **We are in Alpha/Dev.** Backwards compatibility is **NOT** required.
> If a schema changes, prefer **wiping/resetting the DB** over complex migrations. Reliability of the current version is the priority.

## 🛠️ Triggers

- **Save game**: Flush current state to IndexedDB.
- **Load game**: Hydrate Svelte Runes from IndexedDB.
- **Update schema**: Modify `db.js` and reset local storage if necessary.
- **Wipe data**: Clear all IndexedDB tables and LocalStorage.

## 📐 Implementation Standards

1.  **Rune Integration**: Always ensure that data loaded from `db.js` is correctly wrapped in Svelte 5 Runes (`$state`) via the `bridge.js`.
2.  **Explicit Serialization**: Do not rely on implicit structured cloning for complex objects; use the `bridge.js` to handle transformations.
3.  **Error Handling**: Persistence failures should be caught and logged, but should not crash the main simulation loop.
