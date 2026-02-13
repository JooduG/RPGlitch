---
description: The "Tollgate" Audit. Validates work against the Definition of Done.
---

# 05-review (The Tollgate)

> **Goal:** Verify that a Body of Work meets Product Standards and Technical Integrity.

## 1. Triggers

- **Feature Complete**: "I'm done", "Ready for review".
- **Milestone Reached**: "Phase 1 complete".
- **Slash Command**: `/05-review`

## 2. Brain (Context Injection)

- **Definition of Done**: `.agent/rules/standards.md`
- **Spec**: `.agent/tasks/<slug>/spec.md`
- **Tests**: `tests/**`

## 3. Capabilities

- **Auditor**: Comprehensive Review (Lore, Tech, Aesthetic).

## 4. Procedures

### Phase 1: Scope Definition

1.  **Identify**: What is being reviewed? (Track ID, Feature, or Module).
2.  **Target**: Current HEAD vs Main/Dev branch.

### Phase 2: The Audit Matrix (Auditor)

#### A. Product Matrix (The Soul)

- [ ] **Alignment**: Does this match `product.md` and `spec.md`?
- [ ] **Agency**: Did we respect User constraints?
- [ ] **Aesthetic**: Does it comply with Design System / constraints?

#### B. Tech Matrix (The Body)

- [ ] **Svelte 5**: Correct usage of Runes (`$state`, `$derived`, `$effect`).
- [ ] **Security**: Zero `innerHTML` without sanitization. No exposed secrets.
- [ ] **Hygiene**: No `console.log`, `FIXME`, or dead code.
- [ ] **Performance**: No obvious bottlenecks or heavy assets.

#### C. Validation Matrix (The Proof)

- [ ] **Tests**: Unit/E2E tests pass.
- [ ] **Manual**: "Walkthrough" artifacts generated or manual verification plan ready.

### Phase 3: The Verdict

- **PASS**: Proceed to Close Track.
- **REVISE**: List specific gaps. Return to **Builder** mode in `02-feature` or `03-bug-fix`.
- **REJECT**: Fundamental flaw. Trigger `06-revert`.

## 5. Anti-Patterns

- **Rubber Stamping**: Passing without checking the matrices.
- **Ignoring Warnings**: "It's just a warning, I'll fix it later" (Narrator: They didn't).
- **Scope Creep**: Suggesting new features during review.

## 6. Tools

- `read_file` (Audit code)
- `run_command` (Run tests/lint)
