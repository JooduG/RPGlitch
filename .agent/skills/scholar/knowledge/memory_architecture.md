# 💾 Scholar Architecture: The Memory Stack

> **Philosophy**: Offline-First, Cloud-Sync, Vector-Enhanced.

## 1. 🟢 The Hot Layer (Local)

- **Tech**: `Dexie.js` (IndexedDB Wrapper).
- **Role**: Single Source of Truth for the UI.
- **Protocol**:
    - **Reads**: Instant, synchronous-like feel using `liveQuery`.
    - **Writes**: Atomic transactions via `db.transaction('rw', ...)`

## 2. 🔵 The Cold Layer (Cloud)

- **Tech**: Supabase (PostgreSQL).
- **Role**: Archival, Auth, and Multi-device Sync.
- **Security**: **RLS (Row Level Security)** is MANDATORY. No public tables.

## 3. 🟣 The Semantic Layer (Vector)

- **Tech**: Pinecone.
- **Role**: The "Soul" of the data (Embeddings).
- **Ingestion Loop**:
    1.  **Chunk**: Split text by semantic entity (not just char count).
    2.  **Embed**: Generate vector.
    3.  **Upsert**: Store with metadata (`type`, `tags`, `weight`).

## 4. ⚖️ Memory Weighting (The Algorithm)

Data is not binary. It decays based on **Emotional Intensity (W)**.

| Tier            | Weight (W) | Persistence | Examples                         |
| :-------------- | :--------- | :---------- | :------------------------------- |
| **Core**        | 10         | Immutable   | Identity, Trauma, Death.         |
| **Major**       | 8-9        | Resistant   | Betrayals, Key Decisions.        |
| **Significant** | 6-7        | Stable      | Promises, Conflicts.             |
| **Minor**       | 1-5        | Decays      | Routine actions, Sensory static. |
