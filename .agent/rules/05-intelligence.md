---
name: intelligence
trigger: always_on
description: The conceptual and linguistic laws governing agent intelligence.
---

# ⚡ Rule 05: Intelligence

> "I am the nervous system of the agent. I enforce the linguistic law, manage complexity, and ensure that every action is grounded in a verified plan. I am the bridge between intent and reality."

---

## ⚖️ The Law

### 1. Cognitive Routing Reference

Use this reference to select the appropriate MCP reasoning framework based on the shape of the problem.

| Block Type      | Trigger                                 | MCP / Framework                        |
| :-------------- | :-------------------------------------- | :------------------------------------- |
| **Research**    | Knowledge gaps, library patterns.       | `context7`, `svelte`, `deepwiki` (MCP) |
| **Reasoning**   | Multi-step breakdown, chain-of-thought. | `mcp-sequentialthinking-tools`         |
| **Reframing**   | "Impossible" bugs, flawed approach.     | `waldzell-clear-thought`               |
| **Diversity**   | Trade-offs, simulated expertise.        | `waldzell-collaborative-reasoning`     |
| **Decision**    | Complex choices, multi-criteria.        | `waldzell-decision-framework`          |
| **Calibration** | Bias detection, confidence assessment.  | `waldzell-metacognitive-monitoring`    |
| **Systems**     | Pattern recognition, spatial mapping.   | `waldzell-visual-reasoning`            |

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
- **RPSWARMtch**: (Deprecated) See **RPGlitch**.
- **RPGlitch**: The core simulation engine and repository name.
- **Entity**: The fundamental unit of the simulation. An `entity` is either a `character` or a `fractal`.
- **Fractal**: World, setting, or environmental entity.
- **User Persona**: Human-controlled character (Entity).
- **AI Character**: Agent-controlled character (Entity).
- **Character**: An entity that can be used as either a `User Persona` or an `AI Character`. All characters and fractals share the same underlying entity pool.
- **Devmode**: Developer workspace.
- **Localization**: Metric/SI only. ISO 8601. GMT+1.

---

### 4. Complexity & Role Routing

To optimize cognitive load, tasks are triaged into three complexity levels, each triggering a specific role and thinking approach.

#### **Level 1: Quick Fix (⚒️ Operational Role)**

- **Scope**: Typos, CSS tweaks, minor logic, or well-defined single-file edits.
- **Approach**: ⚡ _Professional Coding_. Direct execution, TDD, quick fixes, and cleanup.
- **Skill**: [Orchestration Operations](../../.agent/skills/orchestration-operations/SKILL.md).

#### **Level 2: Enhancement (🎨 Tactical Role)**

- **Scope**: New small features, refactors, state migrations, or multi-file logic changes.
- **Approach**: 🧠 _Sequential Thinking_ (mcp: `mcp-sequentialthinking-tools`). Multi-step logic, tool-guided analysis, implementation plans.
- **Execution**: Full analysis and implementation plan required.
- **Skill**: [Orchestration Tactics](../../.agent/skills/orchestration-tactics/SKILL.md).

#### **Level 3: Complex Feature (🎭 Strategic Role)**

- **Scope**: Major architectural changes, new core systems, or highly ambiguous requirements.
- **Approach**: 🤔 _Contemplative Thinking_ (mcp: `waldzell-clear-thought`). Deep exploration, architectural mapping, reframing.
- **Execution**: Trigger `warden:debugging` if high risk. Requires transition from `orchestration-strategy` (Intake) to `orchestration-strategy` (Strategy).
- **Skill**: [Orchestration Strategy](../../.agent/skills/orchestration-strategy/SKILL.md).

---

### 5. Architectural Documentation (The Blueprint)

To maintain the technical quality trail and ensure historical continuity, all complex missions (Level 2 & Level 3) MUST have a dedicated blueprint file.

- **Location**: `.agent/orchestration/plans/XXX-mission-slug.md`
- **Mirroring**: During the planning phase, the blueprint MUST be mirrored to an `implementation_plan` **Brain Artifact** for user feedback. The `.agent/` directory remains the permanent source of truth.
- **Archival**: Upon mission completion (`[DONE]`), move the blueprint file from `./plans/` to `.agent/archive/tracks/`.

---

### 6. Completeness & Truncation

Any tool output that is truncated (e.g. `(...N more results not shown)`) represents a **Hard Stop**. You MUST NOT proceed with an audit or implementation assuming the hidden data is irrelevant.

- **Exhaustive Requirement**: Before concluding a search-based task (audit, refactor, bug hunt), the agent MUST continue searching until **100% of all possible hits** have been reviewed.
- **Recursion**: Utilize targeted sub-directory searches or more specific filters to bypass tool caps (e.g. 50-result grep limits).
- **Verification**: Zero tolerance for truncation. An audit is only "done" when the search results return a count that fits within a single, uncapped response.

---

### 6. Workflow Registry

The following sovereign workflows are registered for agentic orchestration.

- **/00-boot**: Fresh Session Initialization. Syncs context, mental model, and global state.
- **/01-plan**: The Master Router. Enforces the execution process, categorizes risk, and routes complex features.
- **/02-execute**: Code Execution Loop. Tactical implementation, Logic wiring, and Aesthetic polish.
- **/03-clean**: Maintenance & Security. Fixes bugs, audits security, and ensures hygiene.
- **/04-review**: Quality Assurance & Review.
- **/05-deploy**: Solo Deployment. Ships the bundle to Perchance.
- **/06-continue**: Resume Interrupted Work.
- **/07-swarm**: Swarm Command. Manual Swarm Orchestration. Human-initiated specialized sub-agent deployment.
- **/08-github**: Local GitHub Ops. Automates PRs, issues, and local sync.
- **/99-rewind**: Emergency Stop. Restore state from failover.

---

### 7. Memory Protocol (Agent vs Application)

> **CRITICAL DISTINCTION**:
> - **Application Memory** (Dexie.js, RPGlitch State, Entity memory): Consult the **[Simulation](../../.agent/skills/simulation/SKILL.md)** skill.
> - **Development Data** (Pinecone, Supabase, Agent Context): Consult the **[Data](../../.agent/skills/data/SKILL.md)** skill.

Agents MUST utilize the dual-layer memory system via the [Data](../../.agent/skills/data/SKILL.md) skill to maintain technical precision and historical continuity.

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

Every turn response must conclude with this metadata block to log operational weights. Include the active Role and Thinking Approach emojis. 

> [!TIP]
> **Brevity Mandate**: 
> 1. If a **Skill** is the active **Role**, do not repeat the skill name in the `Skills` line.
> 2. Use simple names or slash commands for Rules, Skills, and Workflows (e.g., `05-intelligence`, `00-boot`, `warden`) rather than full file paths.

```text
### 🕹️ Operational Heartbeat
-   **🎭   Role**: [Strategy 🤔 | Tactics 🧠 | Operations ⚡]
-   **📡   MCPs**: [Specific MCP called]
-   **🛠️  Tools**: [Specific tool used]
-   **📜  Rules**: [Rule Name]
-   **🧠 Skills**: [Skill Name]
- **🛤️ Workflow**: [/Workflow]
```
