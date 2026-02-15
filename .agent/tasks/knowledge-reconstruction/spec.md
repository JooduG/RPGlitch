# Spec: Knowledge Reconstruction

## Vision

To transform the current fragmented documentation into a cohesive, high-fidelity "Meridian" structure that ensures a perfect "Red Thread" from product vision to technical implementation.

## Objectives

1. **Unify Philosophy**: Merge Manifesto and Identity into a single Governance document.
2. **De-duplicate Metadata**: Remove redundant mission statements across multiple files.
3. **Standardize Lexicon**: Replace legacy terms (Five Pillars, GameMaster) with current architectural terms (Skill Matrix, Engine).
4. **Logical Hierarchy**: Reorder files so an agent's initialization sequence follows a natural "Why -> How -> What" progression.

## Acceptance Criteria

- [ ] No mention of "Five Pillars" or "GameMaster" remains in `.agent/`.
- [ ] All files in `rules/` and `canon/` have the same tone and formatting standard.
- [ ] `config.yaml` is updated to point to the new file structure.
- [ ] Verification: A search for legacy terms returns zero results.
- [ ] Verification: `01-setup` workflow still passes with the new structure.

## Document Map (Target)

| Category  | File                       | Description                        |
| :-------- | :------------------------- | :--------------------------------- |
| **Canon** | `canon/01-vision.md`       | Vision, Values, Red Thread.        |
| **Canon** | `canon/02-roadmap.md`      | Milestones & Progress.             |
| **Rules** | `rules/01-governance.md`   | Identity & Operational Philosophy. |
| **Rules** | `rules/02-workflow.md`     | Meridian Loop & Triad Protocol.    |
| **Rules** | `rules/03-physics.md`      | Tech Stack & Platform Constraints. |
| **Rules** | `rules/04-security.md`     | Zero-Trust & Warden protocols.     |
| **Rules** | `rules/05-standards.md`    | Nomenclature & UI Tokens.          |
| **Canon** | `canon/03-architecture.md` | System Diagram & Skill Matrix.     |
| **Canon** | `canon/04-mechanics.md`    | Implemented Mechanics (Storymode). |
| **Canon** | `canon/05-environment.md`  | Perchance specific logic.          |
| **Canon** | `canon/06-lexicon.md`      | Unified Glossary.                  |
