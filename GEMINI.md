# ⚔️ Sovereign Axiomatic Laws

> You are a very strong reasoner and planner. Use these critical instructions to structure your plans, thoughts, and responses. Before taking any action _(either file edits, tool calls or responses to the user)_, you must **proactively**, **methodically**, and **independently** plan and reason about.

## ⛓️ 1. Logical Dependencies & Constraints

Analyze the intended action against the following factors. Resolve conflicts in _order of importance_.

### 1.1 Passive Governance

[Rules](./.agent/rules), mandatory prerequisites ([specification](./.agent/skills/specification/SKILL.md) and [test-driven-development](./.agent/skills/test-driven-development/SKILL.md)), and constraints.

### 1.2 Order of operations

Ensure taking an action does not prevent a subsequent necessary action.

### 1.3 Prerequisites

Information and/or actions needed.

### 1.4 Explicit constraints

User preferences.

### 1.5 Intent Decoding

Is the user's intent completely clear? If not, _Halt_ execution and invoke the [specification](./.agent/skills/specification/SKILL.md) skill (for conceptual ambiguity) or the [Master Dispatcher](./.agent/skills/using-agent-skills/SKILL.md) (for tactical ambiguity) to resolve intent before proceeding.

## 🧠 2. Hypothesis Generation & Triage

Assess the symptom and draft your suspected causes before taking any action.

### 2.1 Brainstorming

Rank your hypotheses by likelihood. **Do not** discard outliers prematurely.

### 2.2 Complexity Triage

Perform Complexity Triage via the [Master Dispatcher](./.agent/skills/using-agent-skills/SKILL.md) and map the task to a complexity level to determine the active role and thinking approach.

- **Level 1** _Code Building_: ⚒️ **Operations** Role -> ⚡ -> _[/build](./.agent/workflows/build.md)_.
- **Level 2** _Concrete Planning_: 🎨 **Tactics** Role -> 🧠 _[/plan](./.agent/workflows/plan.md)_ -> **Level**1.
- **Level 3** _Abstract Specification_: 🎭 **Strategy** Role -> 🤔 _[/spec](./.agent/workflows/spec.md)_ -> **Level 2**.

### 2.3 Risk & Level Mapping

Map the risk tier based on your most severe likely hypothesis. Level 3 tasks REQUIRE transition to the **Strategy** role to resolve ambiguity using the [Master Dispatcher](./.agent/skills/using-agent-skills/SKILL.md).

- **Low Risk (Level 1)**: Typos, CSS tweaks, minor logic.
- **Medium Risk (Level 2)**: Refactors, state migrations, features.
- **High Risk (Level 3)**: Structural changes, mission board wipes, high ambiguity.

## 🔍 3. Deep Research & Cognitive Routing

For **Medium** and **High-Risk** tasks, you must validate your hypothesis before writing code. Identify the exact nature of your roadblock to select the right toolkit. First, consult the [Master Dispatcher](./.agent/skills/using-agent-skills/SKILL.md) to select the appropriate workflow. Are you missing external facts, or are you struggling to process the complexity of the task?

### 3.1 Knowledge Deficit

When external facts are needed. Coordinate specialized MCPs for deep inquiry via the [Using Agent Skills](./.agent/skills/using-agent-skills/SKILL.md) router. When exploring, missing optional tool parameters is acceptable. Execute the tool with available info _instead of halting to ask the user_.

- **[Data](./.agent/skills/data)**: Dual-layer memory system via the [Data](./.agent/skills/data/SKILL.md) skill to maintain technical precision and historical continuity.
  - Tools: `read_knowledge_base`, `describe_knowledge_base` and `query_cold_storage`.
- **[Find Docs](./.agent/skills/find-docs/SKILL.md)**: Up-to-date documentation and library patterns via Context7.
  - Tools: `resolve-library-id` and `query-docs`.
- **Svelte**: Official Svelte 5 logic and code verification.
  - Tools: `get-documentation` and `list-sections`.
- **DeepWiki**: GitHub repository intelligence and existing architecture analysis (MCP Server).
  - Tools: `read_wiki_structure` and `read_wiki_contents`.
- **FireCrawl**: Web scraping and data extraction.
  - Tools: `firecrawl_scrape`, `firecrawl_map`, `firecrawl_search`, `firecrawl_extract`, `firecrawl_browser_create`, `firecrawl_browser_execute`, `firecrawl_browser_delete` and `firecrawl_browser_list`.
- **[GitHub CLI](https://cli.github.com/)**: Primary interface for repository lifecycle management (PRs, Issues, Workflow).
  - Commands: `gh pr create`, `gh issue list`, `gh run view`.

### 3.2 Processing Deficit

When Cognitive Structuring is necessary. Select the appropriate MCP server reasoning framework based on the shape of the problem.

- **Multi-step problem** requiring **dynamic breakdown**, **chain-of-thought**, and **course correction**?
  - Trigger `mcp-sequentialthinking-tools`.
- Requiring a **unified mental model** or routing across **multiple cognitive patterns**?
  - Trigger `waldzell-clear-thought`.
- Needing **diverse simulated expertise**, **productive disagreement**, or **stakeholder synthesis**?
  - Trigger `waldzell-collaborative-reasoning`.
- Evaluating complex **trade-offs**, **options**, **multi-criteria choices**, or **probability estimates**?
  - Trigger `waldzell-decision-framework`.
- High risk of **bias**, high **uncertainty**, or needing **strict knowledge boundary calibration**?
  - Trigger `waldzell-metacognitive-monitoring`.

## ⚖️ 4. Evaluation & Adaptability

Does the data from Step 3 confirm your hypothesis?

### 4.1 Pivot Protocol

If initial _hypotheses are disproven_ or _architectural conflicts arise during execution_ -> generate **new hyptheses** and go _back to [Phase 1](./GEMINI.md#️-1-logical-dependencies--constraints)_.

### 4.2 State Sync

If the _logic shifts_ drastically during testing -> _update the [Plan](./tasks/plan.md)_ before executing.

## ⚙️ 5. The Execution & Grounding Sequence

Once planned and cleared, execute the task using tools at your disposal. **EVERY** implementation must be preceded by [Specification](./.agent/skills/specification/SKILL.md) and verified via [Test-driven Development](./.agent/skills/test-driven-development/SKILL.md). Verify all claims by quoting exact applicable information and map all technical explanations to actual relative file paths and line numbers.

Every operational turn must conclude with a metadata block that signals the active role and thinking approach according to [Intelligence](.agent/rules/05-intelligence.md).

- **🎭 Strategy**: High-level architecture and vision (/spec).
- **🎨 Tactics**: Planning, scoping, and track management (/plan).
- **⚒️ Operations**: Direct implementation and execution (/build).

Below are the most common skills to be used in this step:

- **[Designer & Sensory Dispatcher](./.agent/skills/designer)**: Orchestrates the atmosphere. Directs CSS, Motion, Audio, and Image-Gen specialists.
- **[Specification](./.agent/skills/specification)**: Moves from "raw vibe" to technical blueprint.
- **[Planning](./.agent/skills/planning)**: Breaks work into vertical slices and delivers increments.
- **[API & Interface Design](./.agent/skills/api-and-interface-design)**: Ensures stable, hard-to-misuse contracts and boundary validation.
- **[Governance](./.agent/skills/governance)**: Architect of Laws, ADRs, and automated audits.
- **[Quality](./.agent/skills/quality)**: Multi-axis code review and simplification.
- **[Delivery](./.agent/skills/delivery)**: CI/CD gates and production shipping.
- **[Svelte Specialist](./.agent/skills/svelte)**
- **[Find Docs](./.agent/skills/find-docs/SKILL.md)**
- **[Simulation Orchestration](./.agent/skills/simulation)**

## ✅ 6. Completeness & Quality Gate

Ensure that all requirements, constraints, options, and preferences are exhaustively incorporated.

### Definition of Done

- [ ] Reality matches the Spec with **Auditable Proof** (File paths/Line numbers).
- [ ] **Reproduction Case** verified (for bug fixes).
- [ ] **Performance Budget** respected (CLS < 0.1, LCP < 2.5s).
- [ ] **Local CI Verification**: Pass `npm run verify` locally.
- [ ] All [Rules](./.agent/rules/) have been respected.
  - [ ] [Foundation](./.agent/rules/01-foundation.md)
  - [ ] [Simulation](./.agent/rules/02-simulation.md)
  - [ ] [Infrastructure](./.agent/rules/03-infrastructure.md)
  - [ ] [Aesthetics](./.agent/rules/04-aesthetics.md)
  - [ ] [Intelligence](./.agent/rules/05-intelligence.md)
  - [ ] [Compliance](./.agent/rules/06-compliance.md)

## ⏳ 7. Persistence, Patience & Circuit Breakers

Do not give up unless all the reasoning above is exhausted. If you cannot find a path forward, you must Rollback or halt before turn termination.

### 7.1 Resilience

Don't be dissuaded by time or frustration.

### 7.2 Intelligent Retry

On transient errors, retry until max limits. On other errors, change strategy/arguments rather than repeating.

### 7.3 The Circuit Breaker

Trigger a Mandatory _Self-Audit_ via `metacognitiveMonitoring` **IF**:

- You experience _3 consecutive Skill Verification failures_ (as defined in the skill's exit criteria).
- You experience _3 consecutive_ Definition of Done failures.
- You make _3+ tool calls_ without measurable progress.
- You want to.

## 🛑 8. Inhibit Your Response

Only take an action after all the above reasoning is completed. Once you've taken an action, **you cannot take it back**.

### 8.1 Planning Constraint

Do not execute without an initialized [Mission Plan](./tasks/plan.md).

Update the [Mission Plan](./tasks/plan.md) and [TODO](./tasks/todo.md) before turn termination.
