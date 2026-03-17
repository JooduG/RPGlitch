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

- **Atlas**: [.agent/knowledge/atlas/07-physics.md](../knowledge/atlas/07-physics.md).
- **Stitch**: Triggered for UI-centric tasks via `stitch`.

## 3. Procedures

### Phase 1: The Clarity Gate (Plausible Options Protocol)

1. **Analyze Intent**: Is the request clear? [Invoke: `vibe-decoder`]
    - **Ambiguous (A3+)**: STOP. Do not ask open-ended questions. Formulate 2-3 **Technical Options** with brief pros/cons (Logic vs Performance vs UX). Ask the user to select.
    - **Clear**: Proceed.
2. **Context Trigger**: If the task involves UI (`.svelte` files, styling, layout):
    - **Action**: Call `stitch` to synthesize a design spec. [Invoke: `stitch`] / [Invoke: `style-extraction`]
3. **Draft Plan**: Create/Update a file in [.agent/state/tracks/](../state/tracks/).
    - Include **Success Criteria** and **Atomic Checklist**.

### Phase 2: Interaction

1. **Present**: Share the plan (and UI specs if applicable) with the user.
2. **Select**: If options exist, present clear technical choices.

### Phase 3: Registration

1. **State Update**: Add the track to [.agent/state/tracks.md](../state/tracks.md) as `[ ]`. Wait for user approval to move to `[/]`. [Invoke: `project`]

## 4. Anti-Patterns

- **Hidden UI**: Forgetting to plan the design for a UI feature.
- **Vagueness**: Creating tasks that take longer than 1 hour.
