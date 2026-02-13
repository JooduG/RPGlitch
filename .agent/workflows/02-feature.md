---
description: End-to-end orchestration for building a new UI/Logic feature.
---

# 02-feature (The Flight Plan)

> **Goal:** Scope, blueprint, and execute a new feature with zero ambiguity.

## 1. Triggers

- **User Request**: "New feature", "Build X", "Add ability to Y".
- **Roadmap**: "Start next milestone".
- **Slash Command**: `/02-feature`

## 2. Brain (Context Injection)

- **Product**: `.agent/product.md`
- **Stack**: `.agent/rules/stack.md`
- **Tracks**: `.agent/tasks/tracks.md`

## 3. Capabilities

- **Architect**: Scoping, Spec Generation, Planning.
- **Builder**: Implementation, Skeleton Creation, Logic Wiring.
- **Auditor**: Validation against the "Definition of Done".

## 4. Procedures

### Phase 1: The Clarity Gate (Architect)

1.  **Analyze Intent**: Assess Ambiguity (A1-A5).
    - If **A3-A5** (Ambiguous/Hazard): **STOP**. Present questions using `.agent/skills/project/templates/CONSULTATION.md`.
    - If **A1-A2**: Proceed.
2.  **Check Incubation**: Consult `.agent/knowledge/incubator/` or `roadmap.md` for existing specs.

### Phase 2: Blueprinting

1.  **Define Slug**: `kebab-case-feature-name`.
2.  **Draft Spec**: Create `.agent/tasks/<slug>/spec.md` (The "What").
    - **Must** align with `product.md`.
3.  **Draft Plan**: Create `.agent/tasks/<slug>/plan.md` (The "How").
    - **Constraint**: Use "Skeleton-First" approach (Logic -> UI -> Style).
4.  **Register**: Update `.agent/tasks/tracks.md`.

### Phase 3: The Skeleton (Builder)

_Goal: Functional backbone. ZERO CSS._

1.  **State**: Define Runes (`$state`, `$derived`) in `src/core/` or `src/data/`.
2.  **Logic**: Implement core events and data handlers.
3.  **Markup**: Generate `.svelte` files with semantic HTML only.
    - **Constraint**: No `<style>` blocks. No classes.

### Phase 4: The Tollgate (Auditor)

1.  **Audit**: Check the Skeleton.
    - No `export let`?
    - No `style="..."`?
2.  **Decision**:
    - **FAIL**: Refactor logic.
    - **PASS**: Proceed to Skinning.

### Phase 5: The Skin (Builder)

_Goal: Visual layer._

1.  **Classes**: Add semantic class names (BEM or Utility-to-Semantic).
2.  **Styles**: Add `<style lang="scss">`.
3.  **Tokens**: Use `var(--token)` exclusively.

### Phase 6: Verification (Auditor)

1.  **Verify**: Run `npm test` or specific validation scripts.
2.  **Close**: Mark `[x]` in `tracks.md` and `plan.md`.

## 5. Anti-Patterns

- **Style-First**: Building the UI before the Data Model.
- **God-Components**: Putting all logic inside `.svelte` files.
- **Skipping Clarity**: Guessing requirements.

## 6. Tools

- `feature_creator`
- `sequentialthinking`
- `task_boundary`
