---
description: Scoping and planning a new feature. Defines WHAT to build, not HOW.
---

# 01-plan (The Blueprint)

> **Goal:** Eliminate ambiguity. Define the "What" and the "How" before writing a single line of code.

## 1. Triggers

- **User Request**: "Build X", "New Feature".
- **Roadmap**: Next item in `tracks.md`.
- **Slash Command**: `/01-plan`

## 2. Brain (Context Injection)

- **Vision**: `.agent/knowledge/atlas/01-vision.md`
- **Physics**: `.agent/knowledge/atlas/07-physics.md` (Constraints)
- **Tracks**: `.agent/tasks/tracks.md` (Project State)

## 3. Procedures

### Phase 1: The Clarity Gate (Plausible Options Protocol)

1.  **Analyze Intent**: Is the request clear?
    - **Ambiguous**: STOP. **Do not ask open-ended questions.** Instead, classify the missing information as either "Additive" (features/scope) or "Exclusive Choice" (core logic/design). Formulate 2-3 plausible technical options with brief pros/cons, and ask the user to select their preferred route.
    - **Clear**: Proceed.
2.  **Check Lab**: Look for existing specs in `.agent/knowledge/lab/`. Use `waldzell-decision-framework` for complex roadmap tradeoffs.
3.  **UI/UX Gate**: If the task involves new screens or complex UI components, trigger the `stitch-design` skill to generate placeholders/specs BEFORE drafting the blueprint.

### Phase 2: The Blueprint

1.  **Slug**: Define `kebab-case-name`.
2.  **Draft Spec**: Embed spec block at top of `.agent/tasks/<slug>.md`.
    - **Must** align with Product Vision.
    - **Must** define "Success" (Acceptance Criteria).
3.  **Draft Plan**: Append plan checklist to `.agent/tasks/<slug>.md` (single flat file — Spec + Plan combined).
    - **Skeleton-First**: State → Logic → UI → Style.
    - **Atomic**: Break tasks into `< 1hr` chunks.

### Phase 3: Registration

1.  **Update Tracks**: Add to `.agent/tasks/tracks.md`. **Mandatory**: Use the high-fidelity "Track Block" format (Path, Status, Checkpoint, Note).
2.  **Context**: Read relevant files for _this specific task_.
3.  **UI/UX Verification**: If the task involves UI components, verify against `design.md` and ensure Stitch iterations are reconciled before starting code fabrication.
4.  **Approval**: Wait for "Proceed" or "Green Light".

## 4. Anti-Patterns

- **YOLO Coding**: Skipping the plan.
- **Mega-Tasks**: "Build the whole app" as one task.
- **Silent Assumptions**: Guessing requirements.
- **The Interrogator**: Asking lazy, open-ended questions ("How should this work?") instead of presenting engineered options ("Should we use LocalStorage or IndexedDB?").

## 5. Tools

- `write_to_file` (Create artifacts)
- `waldzell-decision-framework` (Complexity/Tradeoffs)
- `waldzell-stochastic-thinking` (Estimation)
- `sequentialthinking` (Internal Branching)
