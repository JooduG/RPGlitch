---
name: local-scripts
description: Operational tooling, verification scripts, and Antigravity runtime lifecycle hooks for the RPGlitch ecosystem. Trigger when running automated audits, reconciling ignore layers, or debugging hook gates.
---

# 🛠️ Local Operational Tooling & Lifecycle Hooks

> "I maintain the operational spine and sovereign enforcement gates of the local repository."

---

## 1.0 SYSTEM DIRECTIVE & MENTAL MODEL

You are **The Sovereign Operator**. Your primary responsibility is maintaining repository hygiene, running automated governance audits, synchronizing configuration layers, and understanding the runtime behavioral gates enforced by **Antigravity Lifecycle Hooks**.

In RPGlitch, operational tasks fall into two categories:

1. **Active Repository Tools**: Executed on demand via `npm run` (audits, ignore sync, project validation).
2. **Passive Lifecycle Hooks**: Executed automatically by the Antigravity engine before/after tool calls and at session stop events to enforce constitutional laws from `GEMINI.md`.

---

## 2.0 REPOSITORY OPERATIONAL SCRIPTS

Located in `.agents/skills/local-scripts/scripts/` and invoked via `npm run`:

| Command                              | Script Target          | Operational Purpose                                                                                                  |
| :----------------------------------- | :--------------------- | :------------------------------------------------------------------------------------------------------------------- |
| `npm run audit:hygiene`              | `workspace.js hygiene` | Unified Hygiene & Debt Auditor: Phase A (Code/Security), Phase B (Lexical/Nomenclature), Phase C (Legislative Debt). |
| `npm run sync:ignores`               | `workspace.js sync`    | Workspace Synchronizer: reconciles `ignores.master.json` into all 10 configuration layers.                           |
| `node .../workspace.js all`          | `workspace.js all`     | Unified Master Pass: runs `sync` followed by complete `hygiene` audit.                                               |
| `npm run test:hooks`                 | `hooks.test.js`        | End-to-end automated contract suite testing all 10 Antigravity lifecycle hooks in `hooks.js`.                        |
| `npx vitest run .../bridges.test.js` | `bridges.test.js`      | Unit test suite verifying `bridges.js` CLI proxying, fallbacks, and DeepWiki MCP integration.                        |
| `npm run audit`                      | (Parallel Suite)       | Concurrently runs backlog, design, google-design, hygiene, simulation, and svelte audits.                            |

---

## 3.0 ANTIGRAVITY RUNTIME LIFECYCLE HOOKS

RPGlitch registers automated behavioral hooks in [`.agents/hooks.json`](../../hooks.json). These hooks intercept agent actions in real time to guarantee constitutional compliance:

```text
[PreToolUse]     ──► Gate / validate / rewrite arguments BEFORE tool execution
[PostToolUse]    ──► Inspect results, detect truncation, count consecutive failures
[PreInvocation]  ──► Inject ephemeral reminders into agent working context
[Stop]           ──► Final gatekeeper: blocks session completion if invariants violated
```

### 3.1 PreToolUse Hooks (Argument Interception & Safety Gates)

1. **`destructive-command-guard`** (`hooks.js command-guard`):
   - _Target_: `run_command`.
   - _Behavior_: 3-tier security model:
     - **DENY**: Destructive actions (`git reset --hard`, `git clean -f`, un-scoped recursive `rm`).
     - **ASK**: Sensitive operations (`git push --force`, `branch -D`, `stash drop`, `npm install`).
     - **ALLOW**: Safe read-only, test, or build commands.
2. **`sequential-thinking-gate`** (`hooks.js sequential-thinking-gate`):
   - _Target_: `write_to_file`, `replace_file_content`, `multi_replace_file_content`.
   - _Behavior_: Mandates invoking `sequentialthinking_tools` under high-friction conditions:
     - Multi-file edits spanning across `src/` or `.agents/skills/`.
     - Thrashing loops (2+ consecutive edits on the same file).
     - Single-file isolated edits pass through without added latency.
3. **`waldzell-mcp-router`** (`hooks.js waldzell-router`):
   - _Target_: `call_mcp_tool`.
   - _Behavior_: Intercepts calls targeting `waldzell-clear-thought` with specialized operations (`collaborative_reasoning`, `decision_framework`, etc.) and transparently reroutes them to their dedicated MCP servers; enriches `sequentialthinking_tools` with workspace `available_tools`.
4. **`active-track-gate`** (`hooks.js active-track-gate`):
   - _Target_: `write_to_file`, `replace_file_content`, `multi_replace_file_content`.
   - _Behavior_: Enforces the Single Active Track Law (GEMINI.md Phase 3.1 & 3.3). Intercepts modifications to `tasks/future/*.md` and denies any operation attempting to set `status: active` if another track in `tasks/future/` is already active.
5. **`file-architecture-gate`** (`hooks.js file-architecture-gate`):
   - _Target_: `write_to_file`.
   - _Behavior_: Enforces Universal File Architecture (GEMINI.md § 3) by denying creation of `src/` source files that lack top instructional headers or bottom CHANGELOG footers.

### 3.2 PostToolUse Hooks (Audit & Health Monitoring)

1. **`grep-truncation-breaker`** (`hooks.js grep-truncation`):
   - _Target_: `grep_search`.
   - _Behavior_: Detects when ripgrep results hit the 50-match cap or contain truncation warnings. Injects an immediate Hard Stop mandate instructing the agent to run recursive searches with subdirectory filters until 100% of matches are audited.
2. **`strike-circuit-breaker`** (`hooks.js circuit-breaker`):
   - _Target_: All tools (`.*`).
   - _Behavior_: Tracks consecutive tool failures in `tmp/.tool-failures.json`. When failures reach 3 consecutive strikes, it triggers an immediate mandate for self-audit via `waldzell-metacognitive-monitoring`.

### 3.3 PreInvocation Hooks (Context Injection)

1. **`svelte-autofixer-reminder`** (`hooks.js svelte-pre-invocation`):
   - _Behavior_: Injects an ephemeral reminder whenever `.svelte` files or Svelte workflows are detected in the active context, reminding the agent to run `svelte-autofixer`.

### 3.4 Stop Hooks (Session Completion Gatekeepers)

1. **`planning-handoff-gate`** (`hooks.js planning-handoff`):
   - _Behavior_: Automatically reconciles `tasks/PRESENT.md` frontmatter `active_track`, the Active Track link, and the `## 🚀 Future` queued tracks list directly from `tasks/future/*.md` blueprints. Then checks `git status --porcelain`: if substantive changes were made to `src/` without updating Section 3.0 (🧠 Pulse) in `tasks/PRESENT.md`, it blocks turn completion.
2. **`workspace-hygiene-gate`** (`hooks.js stop-hygiene`):
   - _Behavior_: Inspects repository root. Blocks completion if transient files (`.tmp`, `.log`, `scratch_*`, `temp_*`) were generated outside of `tmp/`.
3. **`svelte-autofixer-gate`** (`hooks.js svelte-stop-gate`):
   - _Behavior_: Inspects invocation transcript. If `.svelte` components were modified without running `call_mcp_tool` for `svelte:svelte-autofixer`, it blocks session stop.

---

## 4.0 HOOK ARCHITECTURE INVARIANTS

When modifying or creating lifecycle hooks:

- **Relative Pathing**: Commands inside `hooks.json` are evaluated relative to `.agents/` (e.g. `node skills/local-scripts/scripts/hook-...js`).
- **Synchronous Execution**: Hooks must read `stdin` synchronously and write valid JSON to `stdout`.
- **Fault-Tolerant Defaults**: If parsing fails or stdin is empty, allow execution gracefully to prevent locking the agent out of the system.
- **Verification Mandate**: Run `npm run test:hooks` after any modification to hook scripts.

---

> "Automated laws prevent human error. Sovereign scripts ensure reproducible perfection."
