---
description: Unified Library Organization. Moving data to the right place at the right time.
---

# 📚 Organize Protocol

> **Goal:** Ensure the right data is in the right place at the right time. Move static content to Cold Storage (Supabase) and keep active context in Hot Recall (Pinecone).

## 1. The Shuffle (Lifecycle Management)

1.  **Archival**: Move stale tasks and logs from `.agent/archive` to cold storage.
    - _Why_: Keeps the repo light.
2.  **Pruning**: Delete vectors in Pinecone for files that have been archived.
    - _Why_: Prevents hallucinating on old data.

## 2. Decentralized Consultation (The Librarian)

1.  **Security**: Warden consults Scholar inputs.
2.  **Strategy**: Gamemaster consults Scholar for [Roadmap](../roadmap.md) context.
