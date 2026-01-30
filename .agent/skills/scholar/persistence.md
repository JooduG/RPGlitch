# Scholar Skill: Persistence Strategy

> **Context:** Memory weighting, context consolidation, and the Scholar API.

The **Scholar Pillar** acts as the archivist of reality. It ensures that the "Red Thread" of the story remains consistent across sessions.

## 1. The Persistence Philosophy (Offline-First)

This application follows an **Offline-First, Cloud-Sync** architecture.

- **Local First**: The UI _always_ reads from `Dexie.js` (IndexedDB). It never waits for a network request to render.
- **Cloud Second**: Background processes sync local changes to Supabase when connectivity permits.

## 2. Capabilities

### 🟢 Local Layer (Dexie.js)

The `src/scholar` pillar manages the local database.

- **Technology**: Dexie.js (Wrapper for IndexedDB)
- **Role**: Single Source of Truth for the UI (`$state` mirrors this).
- **Patterns**:
    - **LiveQuery**: Use `liveQuery` only for specific, bounded data subscriptions.
    - **Versioning**: strictly sequential `db.version(n).stores({})`.
    - **Atomic Updates**: Use `db.transaction('rw', table, ...)` for multi-table consistency.

### 🔵 Cloud Layer (Supabase)

The backend layer for lore archival, user auth, and vector memory.

- **Technology**: PostgreSQL (via Supabase)
- **Role**: Long-term archival, Vector Search, and Multi-device sync.
- **Patterns**:
    - **Row Level Security (RLS)**: **MANDATORY**. Never expose tables without RLS policies.
    - **Edge Functions**: Use for sensitive logic that cannot run on the client.

## 3. The Scholar API

- **`scholar.save()`:** The only way to commit memory to disk. Triggers a "Resonance Update" to listeners.
- **`scholar.recall()`:** Retrieves data atoms based on semantic tags or timestamps.

## 4. Memory Tiers (Weighting)

Memory is not binary. It is weighted by **Emotional Intensity (W)**.

| Tier            | Weight (W) | Persistence | Examples                                     |
| :-------------- | :--------- | :---------- | :------------------------------------------- |
| **Core**        | 10         | Immutable   | Identity, Trauma, Death of an NPC.           |
| **Major**       | 8-9        | Resistant   | Betrayals, Life Decisions, Major Secrets.    |
| **Significant** | 6-7        | Stable      | Promises, Conflicts, Intimate Moments.       |
| **Minor**       | 1-5        | Decays      | Small talk, Routine actions, Sensory static. |

## 5. Constraint: The Save Scrub

The Scholar automatically purges "Penalty Flags" and temporary session data on boot to ensure the **Freedom Protocol** remains active. Memory is a tool, not a cage.