---
description: Unified Library Organization. Moving data to the right place at the right time.
constraints:
    - "MUST adopt the Scholar Persona."
---

# 🧹 Maintain Protocol

> **Goal:** Keep the knowledge base clean and fast.
> **Status:** The "Deep Clean" vacuum is **deferred**. Prune-on-Write handles the common case.

## 1. The Automated Cycle (Prune-on-Write)

_Note: This happens automatically when you run `scholar.js write`._

1.  **Ingest**: New content is added.
2.  **Prune**: Old vectors for that file are deleted immediately.
3.  **Result**: No ghosts.

## 2. The Manual Cycle (Deep Clean) — _Deferred_

_Trigger: When you delete many files or suspect severe hallucination._

1.  **Vacuum (Pinecone)**:

    ```bash
    node .agent/skills/scholar/scripts/scholar.js maintain --scope all
    ```

    - _Action_: Currently logs a deferred status. Future implementation will scan all vectors and verify source files exist.

2.  **Archive (Supabase)**:
    - _Status_: **Deferred**. Supabase archival is scaffolded but not yet active.

## 3. The Rules

1.  **Never** delete from Supabase unless legally required.
2.  **Always** trust the File System over Pinecone.
