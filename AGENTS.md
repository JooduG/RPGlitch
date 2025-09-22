# AGENTS.md – Universal Agent Protocol

Version **4.0.0** · Updated **2025-09-22**

**IMMUTABILITY DIRECTIVE:** The `/memory-bank/past` and `/memory-bank/archive` directories are considered historical archives. They are strictly read-only. You MUST NOT modify, update, delete, or validate links within any files in these directories during any task, unless given explicit, single-use permission to do so. These directories are to be excluded from all automated refactoring, cleanup, and validation processes.

This is the canonical playbook for human contributors and AI agents working in this repository. It defines how we think, what we’re allowed to touch, and how we keep work deterministic, safe, and shippable.

-----

## 1\. Core Principles

- **Radical Tool-First Mentality:** For any task, actively seek opportunities to use the specialized MCP servers or other available tools. Prefer using a tool to automate, enrich, or validate, rather than relying on manual analysis or general knowledge.
  - For any non-trivial task, your first thought must be 'Is there a tool for this?'
  - Complex reasoning, planning, debugging, and decision-making MUST be delegated to a specialized reasoning tool whenever appropriate.
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

### 1.2. Advanced Reasoning Tool Protocol

- **RULE:** For any task that requires a multi-step plan, a complex decision, or breaking down a problem, your default starting point **MUST** be the `sequentialthinking_tools` MCP. Use it to map out your plan and identify other tools.
- **RULE:** When you encounter an error or need to debug code, you **MUST** use the `debuggingapproach` MCP to systematically diagnose the issue.
- **RULE:** When assessing your own reasoning or the certainty of your conclusions, you **MUST** use the `metacognitivemonitoring` MCP to ensure accuracy and identify knowledge gaps.
- **RULE:** For tasks involving causal analysis or hypothesis testing, you **MUST** use the `scientificmethod` MCP.

-----

## 2\. ✨ PERCHANCE DEVELOPMENT MANDATE (NON-NEGOTIABLE) ✨

This is the **most important protocol** for any agent performing development on the **ImageGlitch** or **RPGlitch** applications. Failure to adhere to these rules is a critical error.

### 2.1. The Golden Rule: The Two-Panel Paradigm

The Perchance platform has a unique and strict architecture. All development **MUST** be understood through the lens of its two-panel system.

- **Left Panel (The "Engine"):** This is where **ALL** logic, lists, variables, and procedural generation rules are defined.
  - **Source Files:** The content for this panel comes exclusively from `.txt` files (e.g., `ImageGlitch-left-panel.txt`).
  - **Your Task:** You will edit these `.txt` files when working on generator logic. You will **NEVER** write HTML or CSS here.

- **Right Panel (The "Face"):** This is the user-facing UI, which is rendered from a single, compiled HTML file.
  - **Source Files:** You will edit the source files in `apps/[appName]/html`, `apps/[appName]/js`, and `apps/[appName]/scss`.
  - **Build Process:** The build scripts (e.g., `build-imageglitch.js`) compile all source files into **one** self-contained `index.html`. This final file is what populates the Right Panel.

### 2.2. The Source of Truth

For any task involving Perchance development, you are **REQUIRED** to read and apply the principles from the canonical guide:

➡️ **[`/rules/PERCHANCE-DEVELOPMENT-GUIDE.md`](/rules/PERCHANCE-DEVELOPMENT-GUIDE.md)** ⬅️

This guide is the single source of truth for all Perchance-related work. Ignorance of its contents is not an excuse for failure. **You MUST confirm your understanding of this guide before writing any code.**

-----

## 3\. Agent Operating Loop

At the start of every session, and for every task, you must follow this loop:

1. **Load Context:** Read the project state in the order specified in **Context Sources**, applying rules contextually based on the task.
2. **Plan → Implement → Validate:**
      - **Plan:** Record a concise plan or TODO in `memory-bank/present/`.
      - **Implement:** Make small, reviewable changes only in permitted write paths.
      - **Validate:** Run `npm run lint && npm test` (or `npm run validate`) to ensure changes are safe.
3. **Record & Archive:**
      - Capture key decisions and a summary in a new file in `memory-bank/present/`.
      - Upon task completion, promote the summary to `memory-bank/past/` with a date stamp.

-----

## 4\. Context Sources

Read in this order before you start changing anything:

1. **Perchance Development Mandate:** For any task on ImageGlitch or RPGlitch, you must first read and internalize the **[`/rules/PERCHANCE-DEVELOPMENT-GUIDE.md`](/rules/PERCHANCE-DEVELOPMENT-GUIDE.md)**.
2. **This Protocol:** The general rules in this `AGENTS.md` file.
3. **Core Framework Rules (Always Load):**
      - `rules/mcp-pre-task-protocol.md`
      - `rules/system-orchestration-mode.md`
4. **Technology-Specific Rules (Load based on task domain):**
      - `rules/js-*.md`, `rules/html-*.md`, `rules/scss-*.md`
5. **Memory Bank & Live Pointers:**
      - `memory-bank/**`: Emphasize `present/` for current tasks.
      - `memory-bank/present/INDEX.md`: For the most current operational context.

-----

## 5\. AI Environment Configuration

### 5.1. Gemini CLI (`.gemini/settings.json`)

This file defines available Model Context Protocol (MCP) servers for the Gemini CLI agent.

- **On Startup:** Check this file to identify available tools and their startup configurations.
- **Server Management:** For tools that are not URL-based, check if they can be started automatically via their `autoStart: true` flag. If a required server cannot be auto-started, inform the user and ask them to start it manually.

### 5.2. Other AI Environments (e.g., Codex)

- **Custom instructions** should reference this file (`AGENTS.md`).
- **Branch format:** `agent/{date}-{time}-{feature}` (e.g., `codex/2025-08-25-fix-title`).
- **Internet access:** **Off by default**. If enabled, use an explicit domain allowlist.
- **Timezone:** `TZ=Europe/Stockholm` for consistent timestamps and tests.

-----

## 6\. Development Environment Guidelines

- Use **npm** for Node-based operations (Node 22).
- Prefer `npm ci` for clean, reproducible installs.
- Respect the **allowed write paths** (see **Permissions**).

### Build commands

- **Deploy:** `npm run deploy` (sync all, test, lint, build & copy)
- **Build:** `npm run build`
- **Lint:** `npm run lint` (auto-fix: `npm run lint:fix`)
- **Sync:** `npm run sync` (libs, configs, combined docs)
- **Test:** `npm test`

-----

## 7\. Key Project Constraints

- **Build Commands:** Use the `npm run ...` commands defined in this document.
- **Permissions:** Respect the `allow_write` and `deny_write` paths. Do not modify files in `node_modules`, `.cursor`, or `build/output`.
- **Security:**
  - Never commit secrets.
  - Sanitize all dynamic HTML with `DOMPurify.sanitize()`.
  - Fetch time exclusively via the **Time MCP**.

-----

## 8\. Permissions

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
  - "./memory-bank/past/**/*"
  - "./memory-bank/archive/**/*"
````

-----

## 9\. Security & Configuration Tips

- Never commit secrets. Use local `.env` for dev-only values.
- Avoid external network calls in app code; prefer vendoring to `build/local_libs/`.
- Always sanitize dynamic HTML with `DOMPurify.sanitize()`.
- Fetch time via **Time MCP**; default timezone is **Europe/Stockholm**.
- Don’t hand-edit derived configs. Edit the **master** config and run the sync script.

-----

## 10\. Commit & Pull Request Guidelines

- **Commits:** `<scope>: <summary>` (present tense)
      - Example: `rpglitch: add storyboard title sync`
- **PRs:** Keep them small and focused.
- **Branch naming:** `{agent}/{scope}/{short-task}`
      - Example: `gemini/rpglitch/storyboard-title-sync`

-----

## Changelog

- **4.0.0 (2025-09-22)** — Overhauled the Perchance Development Protocol to be a non-negotiable mandate. It now points directly to the canonical `/rules/PERCHANCE_DEVELOPMENT_GUIDE.md` as the single source of truth. Re-prioritized the Context Sources to enforce reading this guide first for relevant tasks.
- **3.0.0 (2025-09-22)** — Added the Perchance Development Protocol to enforce the two-panel (left/right) architecture for all Perchance-based applications. Updated context sources to prioritize this new rule.
- **2.0.0 (2025-09-11)** — Merged `GEMINI.md` into `AGENTS.md` to create a single, unified agent protocol. Added sections on Core Principles, Tool Selection, and MCP Configuration. Updated Agent Operating Loop and Context Sources.
- **1.6.0 (2025-08-25)** — Add Orchestrator pointer, Codex policy, design/time constraints, DOMPurify requirement, deny writes to `node_modules`, live plan pointers under “Context Sources”.
- **1.5.x** — Earlier revisions.
