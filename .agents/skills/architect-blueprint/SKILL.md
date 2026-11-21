---
name: architect-blueprint
description: >-
  RPGlitch architectural design, first-principles trade-off synthesis, vertical impact slicing, and non-canon feature proposal vault (`references/`). Use when designing subsystems, weighing competing RPGlitch architectures, slicing multi-file migrations (<= 5 files per slice), or reviewing parked ideas before promoting them into `ROADMAP.md`. Do NOT use for live production specs (`README.md`, `simulation`) or global codebase-wide Goldfish audits (`egm-brainstorm`, `egm-review`).
---

# Architect Blueprint & Feature Proposals

> **Non-Canon Boundary**: Documents in `references/` are exploratory design proposals, NOT live system specs. Promote approved proposals explicitly into [ROADMAP.md](../../../ROADMAP.md) while checking alignment with [README.md](../../../README.md) and [DESIGN.md](../../../DESIGN.md).

---

## 1. First Principles & Inversion Thinking

1. **Strip Accidental Complexity**: Separate true runtime constraints (`4.00 MB` single-file cap, Perchance plugin APIs, Dexie v2 schema lock, 6-Rank DAG) from legacy conventions or speculative abstractions.
2. **Inversion**: Ask _"What coupling, state leak, or schema flaw would guarantee corruption or maintenance failure?"_ and eliminate those failure modes before designing helpers or UI.
3. **Constraint Lock (80/20)**: Lock the critical-path contract (layer boundary, data schema, or priority gate) first. Do not build peripheral wrappers before core physics are verified.

---

## 2. Dialectic Synthesis & Trade-Off Framing

Evaluate competing directions head-to-head on identical axes (coupling, failure modes, testability, migration cost) instead of settling on vague compromises:

```text
[Thesis: Pattern A]  vs.  [Antithesis: Pattern B / Edge Case]
                              │
                              ▼
             [Synthesis: Conditional Boundary]
```

- State explicit conditional boundaries: _"Choose X when constraint A holds; choose Y when constraint B holds."_
- Check assumption framing for false dichotomies and XY problems.
- Resolve open architectural branches before writing implementation specs (or pair with `/grill-me` / `egm-brainstorm` when formal design docs are needed).

---

## 3. Blast Radius & Vertical Impact Slicing

Before editing across layers, audit ripple effects across four boundaries:

1. **State & Persistence**: `db.version(2)` IndexedDB compatibility and `@state` rune store ownership (`session`, `execution`, `app`).
2. **Epistemic & Security Trust**: `| hide` filtering across the Epistemic Wall, DOMPurify `SANITIZE_NAMED_PROPS`, and P1 user agency.
3. **Performance & Bundle Budget**: Single-file bundle ceiling, `max_concurrency: 1` queues, and layout shift (`CLS < 0.1`).
4. **Downstream Consumers**: All `@alias` barrels and tests (update consumers directly per P4; zero backwards-compatibility shims).

Map file changes using plain tokens (`NEW`, `EDIT`, `DELETE`):

| File | Action (`NEW` / `EDIT` / `DELETE`) | Rationale |
| :--- | :--------------------------------- | :-------- |

Partition migrations into independently verifiable vertical slices of **$\le 5$ files** each, verifying `npm run verify` after each slice.

---

## 4. Feature Proposal Vault (`references/`)

Browse parked feature proposals in [`references/`](./references/) when exploring new mechanics:

1. **Browse**: Read proposal notes (attachment archetypes, composable style entities, d20 stat resolution, fate branching choices, gambit blackjack engine, model overlays, mystery mode, DeepSeek research).
2. **Evaluate**: Stress-test against Section 1–3 constraints and [README.md](../../../README.md).
3. **Promote**: Move approved specs into [ROADMAP.md](../../../ROADMAP.md) and remove or archive superseded drafts from `references/`.
