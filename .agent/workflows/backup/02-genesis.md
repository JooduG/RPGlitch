---
name: 02-genesis
description: Scoping & Design. Defines the blueprint and UI physics for a feature.
---

# 02-genesis (The Blueprint)

> **Goal:** Eliminate ambiguity through engineered plans and Stitch design synthesis.

## 1. Triggers
- **New Feature**: "Build X", "Add Y".
- **Ambiguous Request**: User Vibe (A3+).
- **Slash Command**: `/02-genesis`

## 2. Brain (Context Injection)
- **Vision**: `.agent/knowledge/atlas/01-vision.md`.
- **UI Design**: `stitch_design` skill and `.agent/rules/03-technetium.md` (Chalk Regime).
- **Plan File**: `.agent/state/tracks/<slug>/<slug>.md` (The target track file).

## 3. Procedures

### Phase 1: The Clarity Gate
1. **Analyze**: If the request is A3+ (Ambiguous), propose 2-3 **Technical Options** with pros/cons. **Wait for Approval.**
2. **Design**: If UI is involved, call `stitch_design` to generate the Svelte 5 / Chalk Regime spec.

### Phase 2: Plan Generation
1. **Structure**: Create `.agent/state/tracks/<slug>/<slug>.md`.
2. **Draft**: Define **Success Criteria** and an **Atomic Checklist** (< 1hr tasks).
3. **Register**: Add the track to `.agent/state/tracks.md` as `[ ]`.

### Phase 3: Approval
1. **Notify**: Present the plan to the user.
2. **Authorize**: Move status to `[/]` only once the user says "Proceed".

## 4. Anti-Patterns
- **YOLO Coding**: Skipping the plan.
- **Vague Plans**: "Implement the feature" is not a plan.
- **Ignoring Physics**: Planning a React component in a Svelte 5 project.
