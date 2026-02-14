---
name: data
version: 1.0.0
description: >
    Manages persistence and hydration. Owns the 'Bridge' between Svelte Runes and IndexedDB.
    Triggers:
    - "Implement Save Logic"
    - "Debug Hydration"
    - "Define Schema"
    - "Context: [Data]"
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

## 🗄️ Persistent Schema (Dexie.js)

The following schema defines the core tables in `src/data/db.js`.

### Table Definitions

| Table      | Key (`++id`) | Indexes                                 | Usage                                      |
| :--------- | :----------- | :-------------------------------------- | :----------------------------------------- |
| `entities` | `id`         | `name, type, [type+isCustom], isChosen` | Characters, World info, Locations.         |
| `stories`  | `++id`       | `title, aiId, userId, fractalId`        | Metadata for different playthroughs.       |
| `messages` | `++id`       | `storyId, role, type, characterName`    | The chat history logs.                     |
| `settings` | `id`         | `(none)`                                | Global app configuration (Key-Value pair). |

### Persistence Patterns (Church & State)

- **Church (UI)**: Reacts to `liveQuery` or `$state`. Never calls `db.table.put()` directly in the template.
- **State (Logic)**: Managed by `Bridge` classes that handle serialization before saving.

## 🔴 The Alpha Rule

> [!IMPORTANT]
> **We are in Alpha/Dev.** Backwards compatibility is **NOT** required.
> If a schema changes, prefer **wiping/resetting the DB** over complex migrations. Reliability of the current version is the priority.

## 🛠️ Triggers

- **Implement Save Logic**: Write methods to flush current state to IndexedDB.
- **Debug Hydration**: Verify Svelte Runes are correctly initialized from stored data.
- **Define Schema**: Modify `db.js` to structure the database tables.

## 📐 Implementation Standards

1.  **Rune Integration**: Bridge Dexie `liveQuery` to Runes using `fromStore(liveQuery(...))`. This is the single source of truth.
2.  **Explicit Serialization**: Do not rely on implicit structured cloning for complex objects; use the `bridge.js` to handle transformations.
3.  **Error Handling**: Persistence failures should be caught and logged, but should not crash the main simulation loop.

## Anti-Patterns

| Pattern                               | Mitigation                                                                |
| :------------------------------------ | :------------------------------------------------------------------------ |
| **Direct `db.put()` in template**     | **Forbidden**. All persistence goes through `bridge.js` methods.          |
| **`localStorage` / `sessionStorage`** | **Forbidden**. Perchance intercepts these; use Dexie.js (IndexedDB).      |
| **Complex migrations in Alpha**       | **Avoid**. Wipe/reset the DB instead of writing migration scripts.        |
| **Implicit cloning**                  | **Avoid**. Use explicit serialization in `bridge.js` for complex objects. |
