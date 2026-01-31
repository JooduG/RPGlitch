# Plan: Structural Audit of Agent Core

> **Goal:** Reorganize the `.agent/` directory for logical separation and token efficiency.

## Phase 1: Knowledge Distillation

- [x] **Audit `.agent/knowledge/`**
    - [x] Identify operational vs. informational content.
    - [x] Move reasoning logic to `skills/cortex/`.
    - [x] Move persistence/memory logic to `skills/scholar/`.
    - [x] Move UI/Aesthetic rules to `skills/mesmer/`.

## Phase 2: Rules & Workflows Separation

- [x] **Audit `.agent/rules/`**
    - [x] Verify only invariant constraints remain.
    - [x] Move procedural steps to `workflows/`.
- [x] **Audit `.agent/workflows/`**
    - [x] Verify all are user-activated sequences.

## Phase 3: Skill Encapsulation

- [x] **Enforce Territorial Integrity**
    - [x] Update `SKILL.md` files to link to new skill-specific rules.
    - [x] Verify `.agent/index.md` reflects the Skill-Centric structure.

## Phase 4: Final Validation

- [x] **Hygiene & Sync**
    - [x] Delete empty directories (`knowledge/logic/`, etc.).
    - [x] Run `npm run hygiene` to ensure no broken links.
    - [x] **Verify**: Confirm all 5 pillars are self-contained.
