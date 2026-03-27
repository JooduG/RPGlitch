---
description: The Master Router. Enforces the 8-step process from AGENTS.md, categorizes risk, and routes complex features through the intake -> Cognition -> Warden funnel.
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
2. **Halt**: If ambiguous, invoke `intake` to resolve the vibe into a concrete schema. formulated 2-3 **Technical Options** if applicable. [[Invoke: intake]](../skills/intake/SKILL.md)
3. **Recall**: Query `data` for historical context if targeting complex core engine logic. [[Invoke: data]](../skills/data/SKILL.md)

### Phase 2: Hypothesis & Risk Triage (Step 2)

1. **Hypothesize**: Brainstorm and rank causes/solutions by likelihood.
2. **Risk Routing**:
   - **Low Risk** (CSS, Typos, Minor Logic): Skip Phase 3. Proceed directly to [/02-build](./02-build.md).
   - **Medium Risk** (Refactors, State Migrations): Proceed to Phase 3.
   - **High Risk** (Architecture Shift, Mission Wipe): Proceed to Phase 3 and trigger the `warden:debugging` protocol.

### Phase 3: Cognitive Routing & The Warden (Step 3)

1. **Cognitive Routing**: Select the appropriate Waldzell framework (Sequential Thinking, Decision Framework, Metacognitive Monitoring, etc.) based on Rule 05.
2. **Forge & Stress Test**:
   - Categorize into the Narrative Triad (Spec, State, or Echo).
   - If UI involved, call `stitch` for a design spec. [[Invoke: stitch]](../skills/stitch/SKILL.md)
   - Invoke `warden` to stress-test the plan against Rule 03 (Svelte 5 Runes). [[Invoke: warden]](../skills/warden/SKILL.md)
3. **User Approval**: Halt and request explicit approval on the finalized plan.

### Phase 4: Registration (Step 8.1)

1. **Scaffold**: Create or update the task shard in `.agent/project-management/tracks/<slug>.md`. [[Invoke: cognition]](../skills/cognition/SKILL.md)
2. **Kanban**: Registered the track on the [Mission Board](../project-management/mission-board.md). [[Invoke: project-manager]](../skills/project-manager/SKILL.md)
3. **Prompt**: Prepare the user to trigger [/02-build](./02-build.md).

## 4. Anti-Patterns

- **The Ghost Route**: Writing code during the planning phase.
- **Complexity Denial**: Treating High-Risk tasks as Low-Risk to skip the Warden.
- **Metadata Omission**: Failing to conclude with the Rule 05 Heartbeat.

### 🕹️ Operational Heartbeat
- **🤖 AGENTS.md**: Step 2.1 (Brainstorming - Router initialized)
- **📜 Rules**: Rule 01 (Foundation), Rule 05 (Intelligence)
- **🧠 Capabilities**: intake (Intent Decoding), project-manager (Track Registration)
- **💾 State**: .agent/project-management/mission-board.md
