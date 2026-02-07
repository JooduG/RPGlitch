---
description: Scaffolds a new work track (feature/bug) with Spec, Plan, and mandatory user consultation.
constraints:
    - "MUST execute Rule 07: Clarity Gate before any file generation."
    - "MUST adopt the Gamemaster Persona."
---

# 🛤️ 02: Track Protocol

> **Goal:** Scope and blueprint a new feature or fix with zero ambiguity through recursive refinement.

## 1. Discovery & Intelligence

1. **Context Scan**:
    - Read [product.md](../../product.md) and [03-tech-stack.md](../../rules/03-tech-stack.md) to ground the request in reality.
    - Scan [tracks.md](../../tasks/tracks.md) to ensure this isn't a duplicate or conflicting effort.
2. **Resource Extraction**:
    - Consult [roadmap.md](../../roadmap.md) and [.agent/knowledge/incubator/](../../knowledge/incubator/) to "steal" existing design specs or conceptual foundations.
    - _Constraint_: Do not reinvent the wheel if the incubator has a partial solution.

## 2. Phase 0: The Clarity Gate

> **CRITICAL**: Do not proceed to file generation until you have established alignment.

1. **Analyze Intent**: Determine if this is a `Feature` or `Bug`. Draft a mental model of the solution.
2. **The Interrogation**:
    - Identify 2-3 gaps in the user's prompt (e.g., "How should this handle error state X?", "Is this mobile-only?", "Which existing component owns this data?").
    - **Action**: Present these questions to the user.
    - **Pause**: Wait for user clarification.
3. **Synthesis**: Once answered, confirm the final scope with the user.

## 3. Blueprinting (The Baton Loop)

Once the user approves the scope:

1. **Define**: finalize the `kebab-case-slug`.
2. **Draft Spec** (`spec.md`):
    - Define the "What" and "Why".
    - **Verify**: Does this align with the [Rules](../../rules/)?
3. **Draft Plan** (`plan.md`):
    - **Constraint**: Break down into **Atomic Items** (steps small enough to be stateless).
    - **Integration**: Every major component change must include a specific "Quality Gate" or "Verification" step.

## 4. Materialization

1. **Scaffold**: Run `python3 .agent/skills/gamemaster/scripts/scaffold_state.py` (or create directories manually if script unavailable):
    - Create `.agent/tasks/<slug>/`.
    - Write `.agent/tasks/<slug>/spec.md`.
    - Write `.agent/tasks/<slug>/plan.md`.
2. **Registry**:
    - Append to [tracks.md](../../tasks/tracks.md):

        ```markdown
        ## [ ] Track: <Short Title>

        - Path: .agent/tasks/<slug>/
        - Status: Scoped
        ```

## 5. Handoff

- **Prompt**: "Track `<slug>` initialized and registered. Ready to `/implement`?"
