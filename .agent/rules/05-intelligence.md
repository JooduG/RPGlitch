---
name: 05-intelligence
description: The Core Protocol. Cognitive Routing, Lexical Laws and Strategic Alignment.
trigger: always_on
---

# 🛡️ 05-intelligence

> **Persona**: "I am the nervous system of the agent. I enforce the linguistic law, manage complexity, and ensure that every action is grounded in a verified plan. I am the bridge between intent and reality."

## ⚖️ The Law

### 1. Cognitive Routing Reference

Use this reference to select the appropriate MCP reasoning framework based on the shape of the problem.

| Block Type      | Trigger                                       | MCP / Framework                                       |
| :-------------- | :-------------------------------------------- | :---------------------------------------------------- |
| **Research**    | Knowledge gaps, library patterns, web access. | `context7`, `svelte`, `deepwiki`, `firecrawl`, `data` |
| **Logic**       | Core engine mutations, unit tests.            | `node`, `vitest` (Local)                              |
| **Operations**  | Repository lifecycle, PRs, Issues.            | **GH CLI** (`gh`)                                     |
| **Resonance**   | Quality gates, template compliance, health.   | `warden`                                              |
| **Reasoning**   | Multi-step breakdown, chain-of-thought.       | `mcp-sequentialthinking-tools`                        |
| **Reframing**   | "Impossible" bugs, flawed approach.           | `waldzell-clear-thought`                              |
| **Diversity**   | Trade-offs, simulated expertise.              | `waldzell-collaborative-reasoning`                    |
| **Decision**    | Complex choices, multi-criteria.              | `waldzell-decision-framework`                         |
| **Calibration** | Bias detection, confidence assessment.        | `waldzell-metacognitive-monitoring`                   |

---

### 2. Information Grounding

Every claim must be anchored in the "Reality of the Codebase."

- **Quoting Mandate**: Verify logic state by quoting exact applicable information.
- **Path Sovereignty**: All internal file/logical references MUST use relative paths.
- **Absolute Mapping**: Technical explanations MUST map to actual file paths and line numbers.

---

### 3. Lexical Laws & Nomenclature

To prevent cognitive drift, nomenclature is absolute.

#### **Casing Standards**

- **kebab-case**: Folders and files (e.g., `simulation-engine/`, `context-broker.js`).
- **PascalCase**: Svelte components (e.g., `StoryPanel.svelte`).
- **snake_case**: Variables and process state (e.g., `current_char`).
- **question_snake**: Booleans (e.g., `is_active`, `has_token`).
- **SCREAMING_SNAKE**: Constants and Globals (e.g., `MAX_ENTROPY`).
- **User-Facing**: All user-facing labels, nomenclature, and typography are defined in [Aesthetics](./04-aesthetics.md).

#### **The RPGlitch Lexicon**

- **Swarm**: The tactical engine and lifecycle for multi-agent operations. A "Swarm" represents the technical engine that manages token scaling, parallel execution, and the 80% Confidence Gate.
- **RPglitch**: (Deprecated) See **RPGlitch**.
- **RPGlitch**: The core simulation engine and repository name.
- **Entity**: The fundamental unit of the simulation. An `entity` is either a `character` or a `fractal`.
- **Fractal**: World, setting, or environmental entity.
- **User Persona**: Human-controlled character (Entity).
- **AI Character**: Agent-controlled character (Entity).
- **Character**: An entity that can be used as either a `User Persona` or an `AI Character`. All characters and fractals share the same underlying entity pool.
- **Devmode**: Developer workspace.
- **GH CLI**: (`gh`) The primary interface for GitHub lifecycle management. Mandatory for Issue/PR/Workflow operations.
- **Lean Agent**: A performance configuration maintaining < 50 active MCP tools to ensure context window integrity.
- **Localization**: Metric/SI only. ISO 8601. GMT+1.

---

### 4. Complexity & Workflow Routing

See the authoritative triage table in **[using-agent-skills §Complexity Triage](../skills/using-agent-skills/SKILL.md)**.

All complexity routing (Level 1/2/3 → Role → Workflow) is defined there. `GEMINI.md` and this rule defer to it as the single source of truth.

---

### 5. Architectural Documentation (The Blueprint)

To maintain the technical quality trail and ensure historical continuity, all complex missions (Level 2 & Level 3) MUST have a dedicated blueprint file.

- **Location**: `tasks/plan.md`
- **Archival**: Upon mission completion (`[DONE]`), move the blueprint file content to a persistent archive or the `walkthrough.md`.

---

### 6. Completeness & Truncation

Any tool output that is truncated (e.g. `(...N more results not shown)`) represents a **Hard Stop**. You MUST NOT proceed with an audit or implementation assuming the hidden data is irrelevant.

- **Exhaustive Requirement**: Before concluding a search-based task (audit, refactor, bug hunt), the agent MUST continue searching until **100% of all possible hits** have been reviewed.
- **Recursion**: Utilize targeted sub-directory searches or more specific filters to bypass tool caps (e.g. 50-result grep limits).
- **Verification**: Zero tolerance for truncation. An audit is only "done" when the search results return a count that fits within a single, uncapped response.

---

### 6. Workflow Registry

The following sovereign workflows are registered for agentic orchestration.

- **/boot**: Fresh Session Initialization. Syncs context, mental model, and global state.
- **/continue**: Resume Interrupted Work.
- **/swarm**: Swarm Command. Manual Swarm Orchestration. Human-initiated specialized sub-agent deployment.
- **/github**: Local GitHub Ops. Automates PRs, issues, and local sync via **GH CLI**.
- **/rewind**: Emergency Stop. Restore state from failover.

---

### 7. Memory Protocol (Agent vs Application)

> **CRITICAL DISTINCTION**:
>
> - **Application Memory** (Dexie.js, RPGlitch State, Entity memory): Consult the **[Simulation](../skills/simulation/SKILL.md)** skill.
> - **Development Data** (Pinecone, Supabase, Agent Context): Consult the **[Data](../skills/data/SKILL.md)** skill.

Agents MUST utilize the dual-layer memory system via the [Data](../skills/data/SKILL.md) skill to maintain technical precision and historical continuity.

#### **Working Memory (Pinecone)**

- **Mandate**: Use `read_knowledge_base` BEFORE starting any task involving architectural patterns or external library implementation (e.g., Svelte 5 runes, Bits UI).
- **Injection**: Use `write_knowledge_base` to ingest verified research, new patterns, or significant architectural shifts.
- **Namespaces**:
- `knowledge-base.meta`: Constitution (Rules/Skills).
- `knowledge-base.src`: Source code logic.
- `knowledge-base.external`: Third-party docs and patterns.

#### **Cold Storage (Supabase)**

- **Mandate**: Use `archive_log_entry` to persist task plans, research logs, and final implementation summaries upon mission completion.
- **Recall**: Use `query_cold_storage` to resolve conflicts or understand past design decisions (the "Why").

---

### 8. Turn Signal & Skill Log Protocol

Operational metadata is emitted at two layers:

#### Turn Signal (inline — end of every response)

A single lean line emitted at the end of each response. No tables, no lists.

```
> [Role emoji] [Role] | `[active-skill]` | [/workflow]
```

**Examples:**

```
> ⚒️ Operations | `incremental-implementation` | /build
> 🎨 Tactics | `planning-and-task-breakdown` | /plan
> 🎭 Strategy | `spec-driven-development` | /spec
```

> [!TIP]
> Omit the workflow if none is active (e.g., analysis-only turns).

#### Skill Log (persistent — `tasks/todo.md`)

A durable table updated whenever a skill is invoked or a task transitions state. This survives context drops and provides cross-session forensics.

```markdown
## 🧠 Skill Log

| Timestamp (ISO 8601)   | Task                   | Skill Invoked                | Outcome     |
| ---------------------- | ---------------------- | ---------------------------- | ----------- |
| 2026-04-12T12:00+02:00 | Fix round counter race | debugging-and-error-recovery | ✅ Resolved |
```

**Mandate**: Update the Skill Log in `tasks/todo.md`:

- When a new skill is invoked (new row, `Outcome: 🔄 Active`).
- When a task completes (update row, `Outcome: ✅ Done` or `❌ Failed`).
- At session end, add a summary row if multiple skills were used.
