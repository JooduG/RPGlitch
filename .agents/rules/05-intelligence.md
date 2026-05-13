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

| **Strategy** | Product vision, blueprints, specs. | `planning`, `designer` |
| **Tactics** | Task breakdown, implementation tracks. | `planning`, `source-driven-development` |
| **Research** | Knowledge gaps, library patterns, web access. | `find-docs`, `svelte`, `deepwiki`, `firecrawl`, `data` |
| **Simulation** | Core engine mutations, **Enhancement**, unit tests. | `simulation`, `node`, `vitest` (Local) |
| **Sensory** | Vision, **Optics**, Audio, Design. | `designer`, `image-generation`, `audio`, `css` |
| **Operations** | Repository lifecycle, PRs, Issues. | /04-release ↔ release, security-and-hardening |
| **Resonance** | Quality gates, template compliance, health. | `/03-review` ↔ `quality`, `governance` |
| **Reasoning** | Multi-step breakdown, chain-of-thought. | `mcp-sequentialthinking-tools` |
| **Reframing** | "Impossible" bugs, flawed approach. | `waldzell-clear-thought` |
| **Diversity** | Trade-offs, simulated expertise. | `waldzell-collaborative-reasoning` |
| **Decision** | Complex choices, multi-criteria. | `waldzell-decision-framework` |
| **Calibration** | Bias detection, confidence assessment. | `waldzell-metacognitive-monitoring` |
| **VCS** | Reverts, branch management, history. | /05-revert ↔ git |
| **Verification**| Tests, audits, TDD cycles. | /06-test ↔ test, quality |

---

### 2. Information Grounding (Sovereignty Axioms)

Every claim must be anchored in the "Reality of the Codebase." The following **Sovereignty Axioms** are master laws that cannot be overridden:

- **Quoting Mandate**: Verify logic state by quoting exact applicable information.
- **Path Sovereignty**: All internal file/logical references MUST use relative paths (e.g., `tasks/plan.md`).
- **Absolute Mapping**: Technical explanations MUST map to actual file paths and line numbers.
- **Auditable Proof (Git Notes)**: Verification reports and task summaries MUST be attached to commits via `git notes` to maintain a clean workspace while preserving forensics.

---

### 3. Lexical Laws & Nomenclature (Sovereignty Axioms)

To prevent cognitive drift, nomenclature is absolute.

#### **Casing Standards**

- **kebab-case**: Folders and files (e.g., `simulation-engine/`, `context-broker.js`).
- **PascalCase**: Svelte components (e.g., `StoryPanel.svelte`).
- **snake_case**: Variables and process state (e.g., `current_char`).
- **question_snake**: Booleans (e.g., `is_active`, `has_token`).
- **SCREAMING_SNAKE**: Constants and Globals (e.g., `MAX_ENTROPY`).
- **User-Facing**: All user-facing labels, nomenclature, and typography are defined in [Aesthetics](./04-aesthetics.md).
- **Localization**: Metric/SI only. ISO 8601. Europe/Stockholm (GMT+2 CEST).

#### **The RPGlitch Lexicon**

- **Swarm**: The tactical engine and lifecycle for multi-agent operations. A "Swarm" represents the technical engine that manages token scaling, parallel execution, and the 80% Confidence Gate.
- **RPglitch**: (Deprecated) See **RPGlitch**.
- **RPGlitch**: The core simulation engine and repository name.
- **Temporal Engine**: The consolidated intelligence module managing the temporal continuum of an entity.
- **Temporal Essence**: The four-quadrant state architecture: **Eternal** (Baseline), **Present** (Immediate), **Past** (History), and **Future** (Intent).
- **Enhancement**: The process of refining raw entity data into high-fidelity fragments using the **3rd-Person Affirmative** law. Primarily targets `non_physical` fields and `vector` arrays.
- **Optics**: Physical fragments and image-prompts optimized for geometric and texture precision. Strictly synthesized from `physical` fields, excluding narrative traits.
- **Past Vectors**: (User UI: **Memories**) Historical anchors, critical precedents, and session resonances. Stored in the `past` vector array.
- **Future Vectors**: Active impulses, plans, prophecies, and impending intent. Stored in the `future` vector array.
- **Entity**: The fundamental unit of the simulation. An `entity` is either a `character` or a `fractal`.
- **Fractal**: World, setting, or environmental entity.
- **User Persona**: Human-controlled character (Entity).
- **AI Character**: Agent-controlled character (Entity).
- **Profile Readonly**: A state where entity data is locked from user editing (e.g., during specific narrative sequences or preview modes).
- **Simulation Lock**: A state where the simulation UI is disabled while the engine processes a turn.
- **Character**: An entity that can be used as either a `User Persona` or an `AI Character`. All characters and fractals share the same underlying entity pool.
- **Devmode**: Developer workspace.
- **GH CLI**: (`gh`) The primary interface for GitHub lifecycle management. Mandatory for Issue/PR/Workflow operations.
- **Lean Agent**: A performance configuration maintaining < 50 active MCP tools to ensure context window integrity.
- **Localization**: Metric/SI only. ISO 8601. Europe/Stockholm (GMT+2 CEST).

---

### 4. Complexity & Workflow Routing

See the authoritative triage table in **[using-agent-skills §Complexity Triage](../skills/using-agent-skills/SKILL.md)**.

All complexity routing (Level 1/2/3 → Role → Workflow) is defined there. `GEMINI.md` and this rule defer to it as the single source of truth.

---

### 5. Architectural Documentation (The Blueprint)

To maintain the technical quality trail and ensure historical continuity, all complex missions (Level 2 & Level 3) MUST have a dedicated blueprint file.

- **Location**: `tasks/plan.md`
- **Status Protocol**: Tasks in the blueprint must follow a strict lifecycle:
  - `[ ]`: Pending
  - `[~]`: In Progress (Active)
  - `[x] <sha>`: Completed (with 7-char commit hash)
- **Archival**: To comply with strict zero-trust hygiene (Rule 06), the blueprint file MUST be persisted to Cold Storage (see §7.3.2) and then deleted from the local workspace upon mission completion ([DONE]). Do not archive it to walkthrough.md.

---

### 6. Execution & Verification Protocol (TDD)

Every implementation must be preceded by a verification plan and follow the Red-Green-Refactor cycle.

#### **The TDD Cycle**

1. **Red**: Write a failing test that defines the task's success criteria.
2. **Green**: Implement the minimum code required to pass the test.
3. **Refactor**: Optimize the code while maintaining the green state.

#### **Phase Checkpointing**

Upon completing a logical phase in the blueprint:

- **Diff Audit**: Verify all changes since the last checkpoint (`git diff --name-only <last_sha>`).
- **Test Coverage**: Ensure every modified code file has a corresponding test file.
- **Verification Plan**: Present a manual verification plan to the user before final checkpointing.
- **Checkpoint Commit**: Create a dedicated `conductor(checkpoint)` commit to anchor the phase.

### 7. Completeness & Truncation

Any tool output that is truncated (e.g. `(...N more results not shown)`) represents a **Hard Stop**. You MUST NOT proceed with an audit or implementation assuming the hidden data is irrelevant.

- **Exhaustive Requirement**: Before concluding a search-based task (audit, refactor, bug hunt), the agent MUST continue searching until **100% of all possible hits** have been reviewed.
- **Recursion**: Utilize targeted sub-directory searches or more specific filters to bypass tool caps (e.g. 50-result grep limits).
- **Verification**: Zero tolerance for truncation. An audit is only "done" when the search results return a count that fits within a single, uncapped response.

---

### 8. Workflow Registry

The following sovereign workflows are registered for agentic orchestration within the Conductor framework.

- **[/00-status](../workflows/conductor/00-status.md)**: Unified Session Initialization & Monitoring. (Includes Boot, Continue, and Status).
- **[/01-plan](../workflows/conductor/01-plan.md)**: Tactical Planning & Specification. Generates track-specific blueprints.
- **[/02-implement](../workflows/conductor/02-implement.md)**: Incremental Tactical Implementation. Drives the TDD loop.
- **[/03-review](../workflows/conductor/03-review.md)**: Quality Gate & Verification. Reviews completed track work.
- **[/04-release](../workflows/conductor/04-release.md)**: Release & Handoff. Hardening and GitHub Deployment.
- **[/05-revert](../workflows/conductor/05-revert.md)**: Git-aware State Reconciliation. Reverts logical units of work.
- **[/06-test](../workflows/conductor/06-test.md)**: Unified Verification & Diagnostics. Runs tests and audits.
- **[/07-triage](../workflows/conductor/07-triage.md)**: Cognitive Classification & Sorting. Categorizes tasks and issues.
- **[/swarm](../workflows/utility/swarm.md)**: Manual Swarm Orchestration.- **/boot**: (Legacy alias for /00-status) Fresh Session Initialization.
- **/continue**: (Legacy alias for /00-status) Resume Interrupted Work.

---

### 9. Memory Protocol (Agent vs Application)

> **CRITICAL DISTINCTION**:
>
> - **Application Memory** (**Temporal Engine**, Dexie.js, RPGlitch State): Consult the [Simulation](../skills/simulation/SKILL.md) skill.
> - **Development Data** (Pinecone, Supabase, Agent Context): Consult the [Data](../skills/data/SKILL.md) skill.

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

### 10. Turn Signal & Skill Log Protocol

Operational metadata is emitted at two layers:

#### Turn Signal (inline — end of every response)

A single lean line emitted at the end of each response. No tables, no lists.

```
> [Role emoji] [Role] | `[active-skill]` | [/workflow]
```

**Examples:**

```
> ⚒️ Operations | `incremental-implementation` | /02-implement
> 🎨 Tactics | `planning` | /01-plan
> 🎭 Strategy | `planning` | /01-plan
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
