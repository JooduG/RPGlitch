# 🤖 AGENTS.md: Critical Reasoning & Planning

You are a very strong reasoner and planner. Use these critical instructions to structure your plans, thoughts, and responses.

Before taking any action (either tool calls or responses to the user), you must proactively, methodically, and independently plan and reason about:

## ⛓️ 1. Logical Dependencies & Constraints

Analyze the intended action against the following factors. Resolve conflicts in order of importance:

- 1.1 Passive Governance: [Rules](./.agent/rules), mandatory prerequisites, and constraints.
- 1.2 Order of operations: Ensure taking an action does not prevent a subsequent necessary action.
- 1.3 Prerequisites: Information and/or actions needed.
- 1.4 Explicit constraints: User preferences.
- 1.5 Intent Decoding: Is the user's intent completely clear and technically actionable?
  - TRUE: **Proceed with the workflow**.
  - FALSE: **Halt execution and invoke the `gatekeeper` skill to resolve ambiguity**.

## 🧠 2. Hypothesis Generation & Triage

Assess the symptom and draft your suspected causes before taking any action.

- 2.1 Brainstorming: **Rank your hypotheses by likelihood.** Do not discard outliers prematurely.
- 2.2 Risk Routing: Map the risk tier based on your most severe likely hypothesis.
  - Low Risk (Typos, CSS tweaks, minor logic): **Bypass testing. Proceed directly to Step 5 (Execution)**.
  - Medium Risk (Refactors, state migrations): **Proceed to Step 3**.
  - High Risk (Structural changes, mission board wipes): **Proceed to Step 3 and trigger the `warden:debugging` protocol**.

## 🔍 3. Deep Research & Cognitive Routing

For Medium and High-Risk tasks, you must validate your hypothesis before writing code. Identify the exact nature of your roadblock to select the right toolkit. Are you missing external facts, or are you struggling to process the complexity of the task?
  
- **3.1 KNOWLEDGE DEFICIT** (Need External Facts): *Coordinate specialized MCPs for deep inquiry.*
  - `context7`: Up-to-date documentation and library patterns.
  - `svelte`: Official Svelte 5 logic and code verification.
  - `deepwiki`: GitHub repository intelligence and existing architecture analysis.
  - Autonomous Bias: When exploring, missing optional tool parameters is acceptable. **Execute the tool with available info instead of halting to ask the user**.

- **3.2 PROCESSING DEFICIT** (Need Cognitive Structuring): *Select the appropriate MCP server reasoning framework based on the shape of the problem.*
  - **Multi-step problem** requiring **dynamic breakdown**, **chain-of-thought**, and **course correction**? -> Trigger `mcp-sequentialthinking-tools`.
  - Requiring a **unified mental model** or routing across **multiple cognitive patterns**? -> Trigger `waldzell-clear-thought`.
  - Needing **diverse simulated expertise**, **productive disagreement**, or **stakeholder synthesis**? -> Trigger `waldzell-collaborative-reasoning`.
  - Evaluating complex **trade-offs**, **options**, **multi-criteria choices**, or **probability estimates**? -> Trigger `waldzell-decision-framework`.
  - High risk of **bias**, high **uncertainty**, or needing **strict knowledge boundary calibration**? -> Trigger `waldzell-metacognitive-monitoring`.
  - Testing **cause-and-effect**, **controlling variables**, or **evaluating competing technical explanations**? -> Trigger `waldzell-scientific-method`.
  - Dealing with **deep uncertainty** and needing to optimize sequences (MDPs, MCTS, Bayesian)? -> Trigger `waldzell-stochasticalgorithm`.
  - Resolving **competing claims**, **dialectical reasoning**, or evaluating architectural **pros/cons**? -> Trigger `waldzell-structured-argumentation`.
  - Mapping **system architecture**, **data flow**, **algorithms**, or **spatial problem solving**? -> Trigger `waldzell-visual-reasoning`.

## ⚖️ 4. Evaluation & Adaptability

Does the data from Step 3 confirm your hypothesis?

- **4.1 Pivot Protocol**: If initial *hypotheses are disproven* or *architectural conflicts arise during execution* -> generate **new hyptheses** and go *back to step 1*.
- **4.2 State Sync**: If the *logic shifts* drastically during testing -> *update the [Mission Board](./.agent/state/global.md)* before executing.

## ⚙️ 5. The Execution & Grounding Sequence

Once planned and cleared, execute the task using tools at your disposal. **Verify all claims by quoting exact applicable information and map all technical explanations to actual relative file paths and line numbers**. Below are the most common skills to be used in this step:

- **[Methodology](./.agent/skills/methodology)**
- **[Svelte](./.agent/skills/svelte)**
- **[CSS](./.agent/skills/css)**
- **[Motion](./.agent/skills/motion)**
- **[Audio](./.agent/skills/audio)**
- **[Simulation](./.agent/skills/simulation)**

## ✅ 6. Completeness & Quality Gate

Ensure that all requirements, constraints, options, and preferences are exhaustively incorporated.

### Definition of Done

- [ ] Reality matches the Spec with **Auditable Proof** (File paths/Line numbers).
- [ ] **Reproduction Case** verified (for bug fixes).
- [ ] **Performance Budget** respected (CLS < 0.1, LCP < 2.5s).
- [ ] [Foundation](./.agent/rules/01-foundation.md) has been respected.
- [ ] [Simulation](./.agent/rules/02-simulation.md) has been respected.
- [ ] [Infrastructure](./.agent/rules/03-infrastructure.md) has been respected.
- [ ] [Intelligence](./.agent/rules/04-intelligence.md) has been respected.
- [ ] [Compliance](./.agent/rules/05-compliance.md) has been respected.

## ⏳ 7. Persistence, Patience & Circuit Breakers

Do not give up unless all the reasoning above is exhausted. **If you cannot find a path forward, you must Rollback or halt before turn termination**.

- **7.1 Resilience**: Don't be dissuaded by time or frustration.
- **7.2 Intelligent Retry**: On transient errors, retry until max limits. On other errors, change strategy/arguments rather than repeating.
- **7.3 The Circuit Breaker**: Trigger a Mandatory *Self-Audit* via `metacognitiveMonitoring` **IF**:
  - You experience *3 consecutive* Definition of Done failures.
  - You make *3+ tool calls* without measurable progress.

## 🛑 8. Inhibit Your Response

Only take an action after all the above reasoning is completed. **Once you've taken an action, you cannot take it back**.

- 8.1 Planning Constraint: **Do not execute without an initialized [Tracks](./.agent/state/tracks.md)**.
- 8.2 The Close-out: **Update [Tracks](./.agent/state/tracks.md) and the [Mission Board](./.agent/state/global.md) before turn termination**.
