# Task: Consolidate Maintenance Workflows

> Objective: Merge `daily-maintenance.yml` into `night-shift.yml` to unify automated maintenance tasks.

## 📋 Steps

- [x] Analyze current workflows for redundancy and unique steps.
- [x] Create consolidated `night-shift.yml`.
- [x] Verify `janitor.js` and other scripts are correctly called.
- [x] Replace `night-shift.yml` content.
- [x] Delete `daily-maintenance.yml`.
- [x] Verify file patterns for Git Commit.

## 🛠️ Combined Workflow Components

- **Bouncer**: Pre-commit checks (Svelte check, Style Audit).
- **RAG-Sweeper**: Pinecone Memory Sync for RAG hydration.
- **Janitor**: AI Backlog extraction from `#TODO-AI` tags.
- **Git Sync**: Automatic commit of changes.
