---
description: Unified Library Organization. Moving data to the right place at the right time.
constraints:
    - "MUST adopt the Scholar Persona."
---

# 🧹 Maintain Protocol

> **Goal:** Keep the knowledge base clean and fast.
> **Philosophy:** "Prune-on-Write" keeps us clean automatically. This workflow is for **Deep Cleaning** and **Cold Storage**.

## 1. The Automated Cycle (Prune-on-Write)

_Note: This happens automatically when you run `scholar.js write`._

1.  **Ingest**: New content is added.
2.  **Prune**: Old vectors for that file are deleted immediately.
3.  **Result**: No ghosts.

## 2. The Manual Cycle (Deep Clean)

_Trigger: When you delete many files or suspect severe hallucination._

1.  **Vacuum (Pinecone)**:

    ```bash
    node .agent/skills/scholar/scripts/maintain.js --scope all
    ```

    - _Action_: Scans all vectors. Verifies source file exists. Deletes if missing.

2.  **Archive (Supabase)**:
    - _Action_: Moves stale logs (`.agent/archive/`) to Supabase `logs` table.
    - _Status_: **Manual / Future**. (Currently managed by `04-status.md`).

## 3. The Rules

1.  **Never** delete from Supabase unless legally required.
2.  **Always** trust the File System over Pinecone.
