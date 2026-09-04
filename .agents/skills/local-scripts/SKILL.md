---
name: local-scripts
description: Utility scripts and operational tools for RPGlitch. Trigger this skill when you need to run automated audits, sync design tokens, update ignore lists, or execute other local repository scripts.
---

# Local Development Scripts

> **Persona: Sovereign Operator**  
> _"I maintain the operational and validation tooling of the local repository, executing audits, synchronizations, and scaffolding scripts."_

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

## 5.0 ANTIGRAVITY LIFECYCLE HOOKS

The workspace registers automated agent lifecycle hooks in [`.agents/hooks.json`](file:///c:/Users/johng/source/repos/RPGlitch/.agents/hooks.json) to enforce runtime behavioral laws from [GEMINI.md](file:///c:/Users/johng/source/repos/RPGlitch/GEMINI.md). Hook implementations reside in `.agents/skills/local-scripts/scripts/`:

| Hook Identifier                 | Lifecycle Event | Target / Matcher                         | Script                                                                                                                                                   | Enforced Rule & Behavior                                                                                                                                                                                                                     |
| :------------------------------ | :-------------- | :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`destructive-command-guard`** | `PreToolUse`    | `run_command`                            | [`hook-guard-commands.js`](file:///c:/Users/johng/source/repos/RPGlitch/.agents/skills/local-scripts/scripts/hook-guard-commands.js)                     | 3-tier command gate: **DENY** destructive commands (`git reset --hard`, force cleans, un-scoped recursive `rm`), **ASK** sensitive operations (`git push --force`, `branch -D`, `stash drop`, `npm install`), and **ALLOW** safe operations. |
| **`sequential-thinking-gate`**  | `PreToolUse`    | `write_to_file\|replace_file_content...` | [`hook-sequential-thinking-gate.js`](file:///c:/Users/johng/source/repos/RPGlitch/.agents/skills/local-scripts/scripts/hook-sequential-thinking-gate.js) | Enforces running `sequentialthinking_tools` before multi-file edits across `src/` or thrashing loops (2+ consecutive edits on the same file). Single-file edits pass without overhead.                                                       |
| **`waldzell-mcp-router`**       | `PreToolUse`    | `call_mcp_tool`                          | [`hook-waldzell-router.js`](file:///c:/Users/johng/source/repos/RPGlitch/.agents/skills/local-scripts/scripts/hook-waldzell-router.js)                   | Intercepts calls to `waldzell-clear-thought` and reroutes specialized operations to dedicated Waldzell servers; injects workspace `available_tools` into `sequentialthinking_tools`.                                                         |
| **`file-architecture-gate`**    | `PreToolUse`    | `write_to_file`                          | [`hook-file-architecture-gate.js`](file:///c:/Users/johng/source/repos/RPGlitch/.agents/skills/local-scripts/scripts/hook-file-architecture-gate.js)     | Enforces Universal File Architecture (GEMINI.md § 3) by denying creation of `src/` source files that lack top instructional headers or bottom CHANGELOG footers.                                                                             |
| **`grep-truncation-breaker`**   | `PostToolUse`   | `grep_search`                            | [`hook-grep-truncation.js`](file:///c:/Users/johng/source/repos/RPGlitch/.agents/skills/local-scripts/scripts/hook-grep-truncation.js)                   | Enforces Phase 4.4 Exhaustive Search by alerting the agent whenever `grep_search` results hit the 50-match cap or contain truncation warnings.                                                                                               |
| **`strike-circuit-breaker`**    | `PostToolUse`   | `.*`                                     | [`hook-circuit-breaker.js`](file:///c:/Users/johng/source/repos/RPGlitch/.agents/skills/local-scripts/scripts/hook-circuit-breaker.js)                   | Enforces Phase 5.2 Circuit Breaker by tracking consecutive failures in `tmp/.tool-failures.json` and mandating `waldzell-metacognitive-monitoring` after 3 consecutive tool failures.                                                        |
| **`svelte-autofixer-reminder`** | `PreInvocation` | (All)                                    | [`hook-svelte-pre-invocation.js`](file:///c:/Users/johng/source/repos/RPGlitch/.agents/skills/local-scripts/scripts/hook-svelte-pre-invocation.js)       | Injects an ephemeral reminder when `.svelte` components are in active context.                                                                                                                                                               |
| **`svelte-autofixer-gate`**     | `Stop`          | (All)                                    | [`hook-svelte-stop-gate.js`](file:///c:/Users/johng/source/repos/RPGlitch/.agents/skills/local-scripts/scripts/hook-svelte-stop-gate.js)                 | Blocks turn completion if `.svelte` files were modified without executing `svelte-autofixer`.                                                                                                                                                |
| **`planning-handoff-gate`**     | `Stop`          | (All)                                    | [`hook-planning-handoff.js`](file:///c:/Users/johng/source/repos/RPGlitch/.agents/skills/local-scripts/scripts/hook-planning-handoff.js)                 | Blocks turn completion if `src/` production files were modified without synchronizing the pulse log in `tasks/PRESENT.md`.                                                                                                                   |
| **`workspace-hygiene-gate`**    | `Stop`          | (All)                                    | [`hook-stop-hygiene.js`](file:///c:/Users/johng/source/repos/RPGlitch/.agents/skills/local-scripts/scripts/hook-stop-hygiene.js)                         | Enforces Workspace Hygiene by blocking turn completion if transient files (`.tmp`, `.log`, `scratch_*`) exist in repository root.                                                                                                            |

### Working Directory Standard for Hooks

The Antigravity lifecycle runner sets the working directory to the directory containing `hooks.json` (i.e. `.agents/`). Therefore, command paths inside `hooks.json` must be written relative to `.agents/` (e.g., `node skills/local-scripts/scripts/hook-...js`).

---

## 6.0 MANDATORY DIRECTIVES & QUALITY GATE

- **Direct Execution**: Always use the terminal `run_command` tool to execute operational scripts.
- **Root Directory Context**: Execute scripts from the project root directory.
- **Hook Idempotence**: Hook scripts must execute synchronously, fail gracefully on stdin EOF, and return valid JSON to stdout.

---

## 7.0 VERIFICATION (Definition of Done)

- [ ] Scripts executed with expected zero-exit codes.
- [ ] Required side effects (file changes, token syncs) verified in the workspace.
- [ ] Lifecycle hooks pass stdin/stdout contract validation without unhandled exceptions.
