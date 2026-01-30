# 💾 Data Persistence Architect

Expert guidance on the project's dual-layer persistence strategy: **Dexie.js** (Client/Local) and **Supabase** (Cloud/Sync).

> [!TIP]
> **Implementation**: For specific implementation details, consult the **[Role: Scholar](../SKILL.md)**.

## 1. The Persistence Philosophy

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
    - **Vector Embeddings**: managed via `pinecone-mcp-server` (see [Long Term Memory](./long-term-memory.md)).

## 3. Best Practices

### Schema Design

- **Dexie**: Normalized-ish. It's NoSQL, but keep entities distinct (Characters, Chats, Settings).
- **Supabase**: Strictly Normalized (3NF). Use Foreign Keys.

### Performance

- **Indexing**: Always index fields used in `where()` clauses.
- **Pagination**: Use `offset/limit` on Supabase, `offset/limit` on Dexie for large lists.

### Security

- **Sanitization**: All text inputs must be sanitized via `DOMPurify` before rendering, regardless of storage source.
- **Secrets**: No API keys in client code. Use Supabase RLS context.

## 4. Knowledge Base

- [Dexie.js Documentation](https://dexie.org/docs/)
- [Supabase Architecture](https://supabase.com/docs/guides/architecture)
- [PostgreSQL Indexing](https://www.postgresql.org/docs/current/indexes.html)
