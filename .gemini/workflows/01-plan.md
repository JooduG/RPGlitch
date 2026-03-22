---
name: 01-plan
description: Integrated Scoping & Design. Defines the blueprint.
---

# 01-plan (The Blueprint)

> **Goal:** Build the logical and visual skeleton of a feature.

## 1. Triggers

- **Request**: Initial user prompt.
- **Backtrack**: Re-planning after failed execution.
- **Slash Command**: [/01-plan](./01-plan.md)

## 2. Brain (Context Injection)

- **Rules**: [.agent/rules/01-foundation.md](../rules/01-foundation.md).
- **Rules**: [.agent/rules/03-technetium.md](../rules/03-technetium.md).
- **State**: [.agent/state/tracks.md](../state/tracks.md) (Mission Board).
- **Reference**: [.agent/knowledge/atlas/07-physics.md](../knowledge/atlas/07-physics.md).

## 3. Procedures

### Phase 1: The Clarity Gate (Plausible Options Protocol)

1. **Analyze Intent**: Is the request clear? [[Invoke: vibe-decoder]](../skills/vibe-decoder/SKILL.md)
   - **Ambiguous (A3+)**: STOP. Do not ask open-ended questions. Formulate 2-3 **Technical Options** (Logic vs Performance vs UX). Ask user to select.
   - **Clear**: Proceed.
2. **Semantic Recall**: If targeting complex core engine files (e.g., `ContextBroker`), query the vector database for historical context. Stop guessing; start searching. [[Invoke: data]](../skills/data/SKILL.md)
3. **Context Trigger**: If the task involves UI (`.svelte` files, styling, layout):
   - **Action**: Call `stitch` to synthesize a design spec. [[Invoke: stitch]](../skills/stitch/SKILL.md) / [[Invoke: style-extraction]](../skills/style-extraction/SKILL.md)

### Phase 2: The Blueprint

1. **Draft Plan**: Create/Update a "Task Shard" in [.agent/state/tracks/](../state/tracks/). [[Invoke: project]](../skills/project/SKILL.md)
   - Include **Success Criteria** and **Atomic Checklist** (< 1hr tasks).
2. **Scope Definition**: Identify out-of-scope messes. Do not attempt to fix them. Mark them for `#TODO-AI:`.
3. **Present**: Share the plan (and UI specs) with the user. Identify any required review.

### Phase 3: The Quality Gate (Registration)

1. **State Update**: Add the track to [.agent/state/tracks.md](../state/tracks.md) as `[ ]`. [[Invoke: project]](../skills/project/SKILL.md)
2. **Verification**: Match the plan against the **Red Thread** (Rule 01).

## 4. Anti-Patterns

- **Hidden UI**: Forgetting to plan the design for a UI feature.
- **The Interrogator**: Asking lazy, open-ended questions instead of presenting engineered options.
- **Vagueness**: Creating tasks that are not atomic or lack specific success criteria.
