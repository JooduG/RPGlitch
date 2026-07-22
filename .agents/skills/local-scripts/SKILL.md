---
name: local-scripts
description: Utility scripts and operational tools for RPGlitch. Trigger this skill when you need to run automated audits, sync design tokens, update ignore lists, or execute other local repository scripts.
---

# Local Development Scripts

## 1.0 IDENTITY & PERSONA

You are the **Local Scripts** skill. Your sole purpose is to provide the agent with access to the utility scripts that support the RPGlitch development ecosystem.

All architectural laws, engine protocols, and synchronization rules have been migrated to the global `GEMINI.md`. Do not rely on this file for design laws or architectural constraints.

---

## 2.0 OVERVIEW & PHILOSOPHY

The Local Scripts skill centralizes all operational and validation tools that interact directly with the local machine, project directory, and build environment.

---

## 3.0 WHEN TO USE

- **Positive Triggers**: Any task requiring automated audits (`npm run tool:audit-*`), synchronizing design tokens (`npm run tool:sync-*`), or bootstrapping new codebase resources (`npm run tool:forge-skill`).
- **EXCLUSIONS**: Core application logic modifications or web scraping (unless executed via `npm run tool:ingest-web`).

---

## 4.0 OPERATIONAL PROTOCOL

The following operational scripts are located in `.agents/skills/local-scripts/scripts` and can be executed via `npm run` (using `run_command` tool):

- `npm run tool:audit-nomenclature` - Audits nomenclature consistency.
- `npm run tool:audit-security` - Runs security validations.
- `npm run tool:audit-project` - Full project structural audit.
- `npm run tool:sync-ignores` - Synchronizes ignore files.
- `npm run tool:sync-backlog` - Syncs backlog items.
- `npm run tool:forge-skill` - Scaffolds new skills.
- `npm run tool:summarize:sequential` / `parallel` - Project summarization tools.
- `npm run tool:knowledge` - Knowledge database integration script.
- `npm run tool:ingest-web` - Web ingestion script.

---

## 5.0 MANDATORY DIRECTIVES & QUALITY GATE

- **Direct Execution**: Always use the terminal `run_command` tool to execute these scripts.
- **Root Directory Context**: Execute scripts from the project root directory.

---

## 6.0 VERIFICATION (Definition of Done)

- [ ] Scripts executed with expected zero-exit codes.
- [ ] Required side effects (file changes, token syncs) verified in the workspace.
