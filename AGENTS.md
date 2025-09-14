# AGENTS.md – Universal Agent Protocol

Version **2.0.0** · Updated **2025-09-11**

This is the canonical playbook for human contributors and AI agents working in this repository. It defines how we think, what we’re allowed to touch, and how we keep work deterministic, safe, and shippable.

---

## Table of Contents

- Core Principles
- Agent Operating Loop
- Context Sources
- AI Environment Configuration
- Development Environment Guidelines
- Key Project Constraints
- Permissions
- Security & Configuration Tips
- Commit & Pull Request Guidelines
- Changelog

---

## 1. Core Principles

- **Proactive Tool-First Approach:** For any task, actively seek opportunities to use the specialized MCP servers or other available tools. Prefer using a tool to automate, enrich, or validate, rather than relying on manual analysis or general knowledge.
- **Favor determinism over cleverness**. If it’s inspectable, it’s debuggable.
- **Small, reversible diffs** > large, entangled changes.
- **Keep single sources of truth (SSOT)** for config and rules.
- **Strategy → Tactics → Operations (STO)**. State your intent, define the steps, then execute.
- When blocked, create a minimal reproduction and document it in `memory-bank/present/`.

### 1.1. Tool Selection Logic

When selecting a tool, adhere to the following hierarchy:

1. **Explicit User Request:** If the user's prompt directly specifies a tool or action (e.g., "read this file," "list directory"), prioritize that tool.
2. **Task Context and Goal:** Analyze the overall objective to infer the necessary steps and the tools best suited for them.
3. **Tool Descriptions and Capabilities:** Consult the detailed descriptions of each available tool to match its purpose with the task's requirements.
4. **Internal Rules and Protocols:** Your operational rules (e.g., `mcp-pre-task-protocol.md`, `system-orchestration-mode.md`) guide your workflow and often recommend specific tools.
5. **Error Handling and Debugging:** In case of errors, leverage diagnostic tools (e.g., `run_shell_command` for debugging, `metacognitiveMonitoring` for self-assessment).

---

## 2. Agent Operating Loop

At the start of every session, and for every task, you must follow this loop:

1. **Load Context:** Read the project state in the order specified in **Context Sources**, applying rules contextually based on the task.
2. **Plan → Implement → Validate:**
    - **Plan:** Record a concise plan or TODO in `memory-bank/present/`.
    - **Implement:** Make small, reviewable changes only in permitted write paths.
    - **Validate:** Run `npm run lint && npm test` (or `npm run validate`) to ensure changes are safe.
3. **Record & Archive:**
    - Capture key decisions and a summary in a new file in `memory-bank/present/`.
    - Upon task completion, promote the summary to `memory-bank/past/` with a date stamp.

---

## 3. Context Sources

Read in this order before you start changing anything:

1. **This Protocol:** The rules in this `AGENTS.md` file.
2. **Core Framework Rules (Always Load):**

- `docs/system-documentation-guide.md`: The main entry point for all documentation.
- `rules/system-orchestration-mode.md`: The primary 3-role (Strategic, Tactical, Operational) model.
- `rules/system-thinking-framework.md`: The 3 thinking approaches (Contemplative, Sequential, Professional).
- `rules/system-architecture.md`: The overall system design and principles.
- `rules/system-rule-interactions.md`: Explains how rules are prioritized and combined.

1. **Supporting Systems (Load as needed):**

- `docs/mcp/guide.md`: The consolidated guide for Metacognitive Process (MCP) configuration and usage.

1. **Technology-Specific Rules (Load based on task domain):**

- `rules/js-*.md`, `rules/html-*.md`, `rules/scss-*.md`

1. **Memory Bank & Live Pointers:**

- `memory-bank/**`: Emphasize `present/` for current tasks.
- `memory-bank/present/INDEX.md`: For the most current operational context.

---

## 4. AI Environment Configuration

### 4.1. Gemini CLI (`.gemini/settings.json`)

This file defines available Model Context Protocol (MCP) servers for the Gemini CLI agent.

- **On Startup:** Check this file to identify available tools and their startup configurations.
- **Server Management:** For tools that are not URL-based, check if they can be started automatically via their `autoStart: true` flag. If a required server cannot be auto-started, inform the user and ask them to start it manually.

### 4.2. Other AI Environments (e.g., Codex)

- **Custom instructions** should reference this file (`AGENTS.md`).
- **Branch format:** `agent/{date}-{time}-{feature}` (e.g., `codex/2025-08-25-fix-title`).
- **Internet access:** **Off by default**. If enabled, use an explicit domain allowlist.
- **Timezone:** `TZ=Europe/Stockholm` for consistent timestamps and tests.

---

## 5. Development Environment Guidelines

- Use **npm** for Node-based operations (Node 22).
- Prefer `npm ci` for clean, reproducible installs.
- Respect the **allowed write paths** (see **Permissions**).

### Build commands

- **Deploy:** `npm run deploy` (sync all, test, lint, build & copy)
- **Build:** `npm run build`
- **Lint:** `npm run lint` (auto-fix: `npm run lint:fix`)
- **Sync:** `npm run sync` (libs, configs, combined docs)
- **Test:** `npm test`

---

## 6. Key Project Constraints

- **Build Commands:** Use the `npm run ...` commands defined in this document.
- **Permissions:** Respect the `allow_write` and `deny_write` paths. Do not modify files in `node_modules`, `.cursor`, or `build/output`.
- **Security:**
  - Never commit secrets.
  - Sanitize all dynamic HTML with `DOMPurify.sanitize()`.
  - Fetch time exclusively via the **Time MCP**.

---

## 7. Permissions

Explicitly managed to ensure repository integrity and security:

```yaml
allow_read:
  - "./**/*"

allow_write:
  - "./apps/**/*"
  - "./build/scripts/**/*"
  - "./memory-bank/**/*"
  - "./docs/**/*"
  - "./tests/**/*"
  - "./tools/**/*"

deny_write:
  - "./build/output/**/*"
  - "./.cursor/**"
  - "./node_modules/**"
```

---

## 8. Security & Configuration Tips

- Never commit secrets. Use local `.env` for dev-only values.
- Avoid external network calls in app code; prefer vendoring to `build/local_libs/`.
- Always sanitize dynamic HTML with `DOMPurify.sanitize()`.
- Fetch time via **Time MCP**; default timezone is **Europe/Stockholm**.
- Don’t hand-edit derived configs. Edit the **master** config and run the sync script.

---

## 9. Commit & Pull Request Guidelines

- **Commits:** `<scope>: <summary>` (present tense)
  - Example: `rpglitch: add storyboard title sync`
- **PRs:** Keep them small and focused.
- **Branch naming:** `{agent}/{scope}/{short-task}`
  - Example: `gemini/rpglitch/storyboard-title-sync`

---

## Changelog

- **2.0.0 (2025-09-11)** — Merged `GEMINI.md` into `AGENTS.md` to create a single, unified agent protocol. Added sections on Core Principles, Tool Selection, and MCP Configuration. Updated Agent Operating Loop and Context Sources.
- **1.6.0 (2025-08-25)** — Add Orchestrator pointer, Codex policy, design/time constraints, DOMPurify requirement, deny writes to `node_modules`, live plan pointers under “Context Sources”.
- **1.5.x** — Earlier revisions.
