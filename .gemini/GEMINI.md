# Gemini CLI Operational Protocol

Version **2.0.0** · Adapted from **AGENTS.md v1.6.0**

This is your foundational bootstrap protocol. You MUST follow these steps at the beginning of every session to align with the project's operational context. It defines how you think, what you're allowed to touch, and how you keep your work deterministic, safe, and shippable.

---

## 1. Core Principles

- **Proactive Tool-First Approach:** For any task, actively seek opportunities to use the specialized MCP servers. Prefer using a tool to automate, enrich, or validate, rather than relying on manual analysis or general knowledge.

### 1.1 Tool Selection Logic

When selecting a tool, I adhere to the following hierarchy and considerations:

1. **Explicit User Request:** If the user's prompt directly specifies a tool or action (e.g., "read this file," "list directory"), I prioritize that tool.
2. **Task Context and Goal:** I analyze the overall objective of the task (e.g., bug fix, feature implementation, code explanation) to infer the necessary steps and the tools best suited for those steps.
3. **Tool Descriptions and Capabilities:** I consult the detailed descriptions of each available tool to match its purpose and parameters with the current task's requirements.
4. **Internal Rules and Protocols:** My operational rules (e.g., `mcp-pre-task-protocol.md`, `system-orchestration-mode.md`) guide my workflow and often recommend specific tools for particular stages of a task.
5. **Error Handling and Debugging:** In case of unexpected outcomes or errors, I leverage diagnostic tools (e.g., `run_shell_command` for debugging, `metacognitiveMonitoring` for self-assessment) to identify and resolve issues.

- **Favor determinism over cleverness**. If it’s inspectable, it’s debuggable.
- **Small, reversible diffs** > large, entangled changes.
- **Keep single sources of truth (SSOT)** for config and rules.
- **Strategy → Tactics → Operations (STO)**. State your intent, define the steps, then execute.
- When blocked, create a minimal reproduction and document it in `memory-bank/present/`.

---

## 2. Agent Operating Loop

At the start of every session, and for every task, you must follow this loop:

1. **Load Context:** Read the project state in this specific order, applying rules contextually based on the task.
    - **This Protocol:** The rules in this `GEMINI.md` file.
    - **Core Framework Rules (Always Load):** These define your fundamental operating system.
        - `system-orchestration-mode.md`: The primary 3-role (Strategic, Tactical, Operational) model.
        - `thinking-framework.md`: The 3 thinking approaches (Contemplative, Sequential, Professional).
        - `system-architecture.md`: The overall system design and principles.
        - `system-documentation-guide.md`: Rules and guidelines for writing any documentation.
        - `system-rule-interactions.md`: Explains how rules are prioritized and combined.
        - `thinking-framework.md`: The strategy for loading other rules efficiently.
    - **Supporting Systems (Load as needed):** These define how you interact with key subsystems.
        - `memory-bank-*.md`: For reading from or writing to long-term memory.
        - `mcp-*.md`: For interacting with the MCP tool ecosystem.
    - **Technology-Specific Rules (Load based on task domain):**
        - `js-*.md`: When working with JavaScript.
        - `html-*.md`: When working with HTML.
        - `scss-*.md`: When working with SCSS.
    - **Memory Bank & Live Pointers:**
        - `memory-bank/**`: Emphasize `present/` for current tasks.
        - `memory-bank/present/INDEX.md` and `context-*.md`: For the most current operational context.

2. **Plan → Implement → Validate:**
    - **Plan:** Record a concise plan or TODO in `memory-bank/present/`.
    - **Implement:** Make small, reviewable changes only in permitted write paths.
    - **Validate:** Run `npm run lint && npm test` (or `npm run validate`) to ensure changes are safe.

3. **Record & Archive:**
    - Capture key decisions and a summary in a new file in `memory-bank/present/`.
    - Upon task completion, promote the summary to `memory-bank/past/` with a date stamp.

---

## 3. MCP Server Configuration (`.gemini/settings.json`)

The `.gemini/settings.json` file defines available Model Context Protocol (MCP) servers.

- **On Startup:** You will check this file to identify available tools and their startup configurations.
- **Server Management:** For tools that are not URL-based, you will check if they can be started automatically via their `autoStart: true` flag. If a required server cannot be auto-started, you will inform the user and ask them to start it manually, providing the necessary command from its `description` or `command`/`args`.

---

## 4. Key Project Constraints

- **Build Commands:** Use the `npm run ...` commands defined in `AGENTS.md` for building, testing, and linting.
- **Permissions:** Respect the `allow_write` and `deny_write` paths specified in `AGENTS.md`. Do not modify files in `node_modules`, `.cursor`, or `build/output`.
- **Security:**
  - Never commit secrets.
  - Sanitize all dynamic HTML with `DOMPurify.sanitize()`.
  - Fetch time exclusively via the **Time MCP**.

## Rationale

This protocol ensures that you, the Gemini CLI agent, operate not on general knowledge, but on the specific, documented conventions, standards, and state of this project. This makes you a project-aware expert, consistent with the behavior of the in-editor Cursor experience, while optimizing for token efficiency by applying rules contextually.
