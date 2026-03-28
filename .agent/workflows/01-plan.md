---
description: The Master Router. Enforces the 8-step process from AGENTS.md, categorizes risk, and routes complex features through the intake -> Directives -> Warden funnel.
---

# [/01-plan](./01-plan.md) - The Master Router

> **Goal:** Evaluate user intent, brainstorm hypotheses, and route the request to the correct cognitive framework (AGENTS.md Steps 2-3).

## 1. Triggers

- **Request**: Initial user prompt or "I have an idea".
- **Slash Command**: **[/01-plan](./01-plan.md)**

## 2. Context Injection

- **Rules**: [Foundation](../rules/01-foundation.md).
- **Rules**: [Intelligence](../rules/05-intelligence.md).
- **State**: [.agent/project-management/mission-board.md](../project-management/mission-board.md).
- **Core**: [AGENTS.md](../../AGENTS.md).

## 3. Procedures

### Phase 1: Ambiguity Gate (Step 1.5: Intent Decoding)

1. **Assess**: Is the intent technically actionable?
2. **The Loop**: If ambiguous, invoke `intake` to resolve the vibe via the **One Question Loop**. [[Invoke: intake]](../skills/intake/SKILL.md)
3. **The Pulse**: Formulate 2-3 **Technical Options** with trade-offs. Present the design in 300-word beats for iterative validation.
4. **Recall**: Query `data` for historical context if targeting complex core engine logic. [[Invoke: data]](../skills/data/SKILL.md)

### Phase 2: Hypothesis & Risk Triage (Step 2)

1. **Hypothesize**: Brainstorm and rank causes/solutions by likelihood.
2. **Risk Routing**:
   - **Low Risk** (CSS, Typos, Minor Logic): Skip Phase 3. Proceed directly to [/02-build](./02-build.md).
   - **Medium Risk** (Refactors, State Migrations): Proceed to Phase 3.
   - **High Risk** (Architecture Shift, Mission Wipe): **HALT PLANNING**. Invoke `codebase-review-question-audit` to generate `QUESTIONS.md`. Do not proceed to Phase 3 until the user resolves all structural ambiguities. [[Invoke: codebase-review-question-audit]](../skills/codebase-review-question-audit/SKILL.md)

### Phase 3: Cognitive Routing & The Warden (Step 3)

1. **Cognitive Routing**: Select the appropriate Waldzell framework (Sequential Thinking, Decision Framework, Metacognitive Monitoring, etc.) based on Rule 05.
2. **Forge & Stress Test**:
   - Categorize into the Narrative Triad (Spec, State, or Echo).
   - If UI involved, call `designer` to orchestrate the aesthetic spec and sensory requirements. [[Invoke: designer]](../skills/designer/SKILL.md)
   - Invoke `warden` to stress-test the plan against Rule 03 (Svelte 5 Runes). [[Invoke: warden]](../skills/warden/SKILL.md)
3. **User Approval**: Halt and request explicit approval on the finalized plan.

### Phase 4: Registration (Step 8.1)

1. **Scaffold**: Create or update the task shard in `.agent/project-management/tracks/<slug>.md`. [[Invoke: orchestrator]](../skills/orchestrator/SKILL.md)
2. **Kanban**: Register the track on the [Mission Board](../project-management/mission-board.md). [[Invoke: orchestrator]](../skills/orchestrator/SKILL.md)
3. **Prompt**: Prepare the user to trigger [/02-build](./02-build.md).

## 4. Anti-Patterns

- **The Ghost Route**: Writing code during the planning phase.
- **Complexity Denial**: Treating High-Risk tasks as Low-Risk to skip the Warden.
- **Metadata Omission**: Failing to conclude with the Rule 05 Heartbeat.
