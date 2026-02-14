---
description: The "Tollgate" Audit. Validates work against the Definition of Done.
---

# 06-review (The Tollgate)

> **Goal:** Verify that a Body of Work meets Product Standards and Technical Integrity.

## 1. Triggers

- **Feature Complete**: "I'm done", "Ready for review".
- **Milestone Reached**: "Phase complete".
- **Slash Command**: `/06-review`

## 2. Brain (Context Injection)

- **Definition of Done**: `.agent/rules/standards.md`
- **Spec**: `.agent/tasks/<slug>/spec.md`
- **Tests**: `tests/**`

## 3. Procedures

### Phase 1: Scope Definition

1. **Identify**: What is being reviewed? (Track ID, Feature, or Module).
2. **Target**: Current HEAD vs last checkpoint SHA.

### Phase 2: The Audit Matrix

#### A. Product Matrix (The Soul)

- [ ] **Alignment**: Does this match `product.md` and `spec.md`?
- [ ] **Agency**: Did we respect User constraints?
- [ ] **Aesthetic**: Does it comply with Design System tokens?

#### B. Tech Matrix (The Body)

- [ ] **Svelte 5**: Correct usage of Runes (`$state`, `$derived`, `$effect`).
- [ ] **Security**: Zero `innerHTML` without sanitization. No exposed secrets.
- [ ] **Hygiene**: No `console.log`, `FIXME`, or dead code.
- [ ] **Performance**: No obvious bottlenecks or heavy assets.

#### C. Validation Matrix (The Proof)

- [ ] **Tests**: Unit/E2E tests pass.
- [ ] **Coverage**: New code has adequate test coverage.
- [ ] **Manual Verification**: Present step-by-step manual verification plan.
    - For UI: "Start dev server → Open URL → Confirm visual".
    - For Logic: "Run command → Confirm output".
- [ ] **User Confirmation**: Await explicit user sign-off.

### Phase 3: The Verdict

- **PASS**: Proceed to `05-checkpoint` to anchor, then `07-deploy` if shipping.
- **REVISE**: List specific gaps. Return to `03-implement` or `04-bug-fix`.
- **REJECT**: Fundamental flaw. Trigger `10-revert`.

## 4. Anti-Patterns

- **Rubber Stamping**: Passing without checking the matrices.
- **Ignoring Warnings**: "It's just a warning, I'll fix it later".
- **Scope Creep**: Suggesting new features during review.

## 5. Tools

- `view_file` (Audit code)
- `run_command` (Run tests/lint)
