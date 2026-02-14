---
description: Scoping and planning a new feature. Defines WHAT to build, not HOW.
---

# 02-feature (The Flight Plan)

> **Goal:** Scope, blueprint, and register a new feature with zero ambiguity. Implementation happens in `03-implement`.

## 1. Triggers

- **User Request**: "New feature", "Build X", "Add ability to Y".
- **Roadmap**: "Start next milestone".
- **Slash Command**: `/02-feature`

## 2. Brain (Context Injection)

- **Product**: `.agent/knowledge/canon/product.md`
- **Stack**: `.agent/rules/stack.md`
- **Tracks**: `.agent/tasks/tracks.md`

## 3. Procedures

### Phase 1: The Clarity Gate

1. **Analyze Intent**: Assess Ambiguity (A1-A5).
    - If **A3-A5** (Ambiguous/Hazard): **STOP**. Present questions.
    - If **A1-A2**: Proceed.
2. **Check Incubation**: Consult `.agent/knowledge/incubator/` for existing specs or concepts.

### Phase 2: Blueprinting

1. **Define Slug**: `kebab-case-feature-name`.
2. **Draft Spec**: Create `.agent/tasks/<slug>/spec.md` (The "What").
    - **Must** align with `product.md`.
    - Define acceptance criteria.
3. **Draft Plan**: Create `.agent/tasks/<slug>/plan.md` (The "How").
    - Break into numbered, sequential tasks.
    - Use `[ ]` for each task item.
    - **Constraint**: Use "Skeleton-First" approach (State → Logic → Markup → Style).
4. **Register**: Add entry to `.agent/tasks/tracks.md` with status `In Progress`.

### Phase 3: Handoff

1. **Present**: Show the spec and plan to the user for approval.
2. **Decision**:
    - **Approved**: Proceed to `03-implement`.
    - **Revise**: Update spec/plan and re-present.

## 4. Anti-Patterns

- **Building During Planning**: Writing code before the plan is approved.
- **Skipping Clarity**: Guessing requirements instead of asking.
- **Mega-Features**: Plans with 20+ tasks. Break into sub-tracks.

## 5. Tools

- `sequentialthinking` (Complex scoping)
- `write_to_file` (Create spec/plan)
- `task_boundary` (Track progress)
