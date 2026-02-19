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
- **Physics**: `.agent/rules/03-physics.md` (Constraints)
- **Tracks**: `.agent/tasks/tracks.md` (Project State)

## 3. Procedures

### Phase 1: The Clarity Gate

1.  **Analyze Intent**: Is the request clear?
    - **Ambiguous**: STOP. Ask clarifying questions.
    - **Clear**: Proceed.
2.  **Check Lab**: Look for existing specs in `.agent/knowledge/lab/`.

### Phase 2: The Blueprint

1.  **Slug**: Define `kebab-case-name`.
2.  **Draft Spec**: `.agent/tasks/<slug>/spec.md`.
    - **Must** align with Product Vision.
    - **Must** define "Success" (Acceptance Criteria).
3.  **Draft Plan**: `.agent/tasks/<slug>/plan.md`.
    - **Skeleton-First**: State → Logic → UI → Style.
    - **Atomic**: Break tasks into `< 1hr` chunks.

### Phase 3: Registration

1.  **Update Tracks**: Add to `.agent/tasks/tracks.md`.
2.  **Review**: Present Spec & Plan to user.
3.  **Approval**: Wait for "Proceed" or "Green Light".

## 4. Anti-Patterns

- **YOLO Coding**: Skipping the plan.
- **Mega-Tasks**: "Build the whole app" as one task.
- **Silent Assumptions**: Guessing requirements.

## 5. Tools

- `write_to_file` (Create artifacts)
- `sequentialthinking` (Complex scoping)
