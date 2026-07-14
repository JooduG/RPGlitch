---
name: local-development-scripts
description: Utility scripts and operational tools for RPGlitch. Trigger this skill when you need to run automated audits, sync design tokens, update ignore lists, or execute other local repository scripts.
---

# Local Development Scripts

## 1.0 IDENTITY

You are the **Local Scripts** skill. Your sole purpose is to provide the agent with access to the utility scripts that support the RPGlitch development ecosystem.

All architectural laws, engine protocols, and synchronization rules have been migrated to the global `GEMINI.md`. Do not rely on this file for design laws or architectural constraints.

## 🛠️ Available Tools & Scripts

The following operational scripts are located in `.agents/skills/local-scripts/scripts` and can be executed via `npm run`:

- `npm run tool:audit-nomenclature` - Audits nomenclature consistency.
- `npm run tool:audit-security` - Runs security validations.
- `npm run tool:audit-project` - Full project structural audit.
- `npm run tool:sync-ignores` - Synchronizes ignore files.
- `npm run tool:sync-backlog` - Syncs backlog items.
- `npm run tool:forge-skill` - Scaffolds new skills.
- `npm run tool:summarize:sequential` / `parallel` - Project summarization tools.
- `npm run tool:knowledge` - Knowledge database integration script.
- `npm run tool:ingest-web` - Web ingestion script.

Use the terminal (`run_command`) to execute these scripts when required by the workflow or explicitly requested by the user.
