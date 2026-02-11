---
description: Scaffolds a new work track (feature/bug) with Spec, Plan, and mandatory user consultation.
skill: gamemaster
constraints:
    - "MUST execute Rule 07: Clarity Gate before any file generation."
    - "MUST adopt the Gamemaster Persona."
context:
    - "New track"
    - "Start feature"
    - "Fix bug"
---

# 🛤️ Workflow: 02-track

> **Goal:** Scope and blueprint a new feature or fix with zero ambiguity through recursive refinement.

## Phase 1: Scan Context

1.  **Inject Reality**: Read [product.md](../product.md) and [03-tech-stack.md](../rules/03-tech-stack.md) to ground the request.
2.  **Check Duplicates**: Scan [tracks.md](../tasks/tracks.md) to ensure this isn't a conflict.
3.  **Mine Incubator**: Consult [roadmap.md](../roadmap.md) and [.agent/knowledge/incubator/](../knowledge/incubator/) to "steal" existing design specs.
    - _Constraint_: Do not reinvent the wheel if the incubator has a partial solution.

## Phase 2: Consult User (The Clarity Gate)

> **CRITICAL**: Do not proceed to file generation until you have established alignment.

1.  **Analyze Intent**: Determine if this is a `Feature` or `Bug`. Draft a mental model of the solution.
2.  **Execute Consultation**: Read and render the questions from `.agent/skills/gamemaster/templates/CONSULTATION.md`.
    - **Action**: Present these questions to the user.
    - **Pause**: Wait for user clarification.
3.  **Synthesize**: Once answered, confirm the final scope with the user.

## Phase 3: Draft Blueprint (The Baton Loop)

Once the user approves the scope:

1.  **Define Slug**: Finalize the `kebab-case-slug`.
2.  **Draft Spec**: Write `spec.md` (The "What" and "Why").
    - **Verify**: Align with [Rules](../rules/).
3.  **Draft Plan**: Write `plan.md` (The "How").
    - **Constraint**: Break down into **Atomic Items** (steps small enough to be stateless).
    - **Integration**: Every major component change must include a specific "Quality Gate" or "Verification" step.

## Phase 4: Materialize State

1.  **Scaffold**: Create the track directory structure:
    - Create `.agent/tasks/<slug>/`.
    - Write `.agent/tasks/<slug>/spec.md`.
    - Write `.agent/tasks/<slug>/plan.md`.
2.  **Register**: Append to [tracks.md](../tasks/tracks.md):

    ```markdown
    ## [ ] Track: <Short Title>

    - Path: .agent/tasks/<slug>/
    - Status: Scoped
    ```

## Phase 5: Handoff

- **Prompt**: "Track `<slug>` initialized and registered. Ready to `/implement`?"
