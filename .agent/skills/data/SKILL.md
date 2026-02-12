---
name: data
description: >
    Manages persistence and hydration. Owns the 'Bridge' between Svelte Runes and IndexedDB.
    Triggers:
    - "Implement Save Logic"
    - "Debug Hydration"
    - "Define Schema"
---

# 💾 Data Skill

> **Mandate**: "I am the steward of persistence. I ensure that the project's state is reliably mirrored between memory and disk, prioritizing system stability over complex migrations during development."

## 🛑 Runtime Limitation

> [!WARNING]
> **You are an Engineer.** You write the `src/data/db.js` and `src/data/bridge.js` files. You do not have access to the browser's IndexedDB at runtime. You cannot "wipe data" for the user; you can only write code that _allows_ the user to wipe data.

## 🏗️ Scope

This skill owns the persistence layer of the application:

- `src/data/db.js`: Dexie.js database configuration and schema.
- `src/data/bridge.js`: Serialization and hydration logic between Svelte Runes and IndexedDB.

## 🔴 The Alpha Rule

> [!IMPORTANT]
> **We are in Alpha/Dev.** Backwards compatibility is **NOT** required.
> If a schema changes, prefer **wiping/resetting the DB** over complex migrations. Reliability of the current version is the priority.

## 🛠️ Triggers

- **Implement Save Logic**: Write methods to flush current state to IndexedDB.
- **Debug Hydration**: Verify Svelte Runes are correctly initialized from stored data.
- **Define Schema**: Modify `db.js` to structure the database tables.

## 📐 Implementation Standards

1.  **Rune Integration**: Always ensure that data loaded from `db.js` is correctly wrapped in Svelte 5 Runes (`$state`) via the `bridge.js`.
2.  **Explicit Serialization**: Do not rely on implicit structured cloning for complex objects; use the `bridge.js` to handle transformations.
3.  **Error Handling**: Persistence failures should be caught and logged, but should not crash the main simulation loop.
