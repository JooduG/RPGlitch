# Track Template - `[Feature-Name]`

> **Goal**: `[Brief-intent]`
> **Status**: `[ ]` Pending, `[~]` Active, `[x]` Complete, `[!]` Blocked, `[-]` Skipped
> **Type**: `[Feature/Bug/Chore/Refactor]`
> **Risk**: `[Low/Medium/High]`
> **Start Date**: 2026-03-27

## Phase 1: Grounding/Plan ([/01-plan](../../../workflows/01-plan.md))

- **Hypothesis**: `[Reasoning]`
- **Risk Tier**: `[Low/Medium/High]`
- **Reproduction Case**: `[Steps]`
- **Context**: [Rule 03](../../../rules/03-infrastructure.md), [Rule 06](../../../rules/06-compliance.md).

## Phase 2: Execution/Build ([/02-build](../../../workflows/02-build.md))

Use the **Micro-Beat Loop** (Red -> Green -> Refactor -> Verify).

- [ ] **Beat 1**: `[Description]`
- [ ] **Beat 2**: `[Description]`

## Phase 3: Hardening/Audit ([/03-clean](../../../workflows/03-clean.md))

- [ ] **Type Safety**: Zero `any` types in Svelte 5 logic.
- [ ] **Performance Budget**: CLS < 0.1, LCP < 2.5s.
- [ ] **Perchance Audit**: No `localStorage`, `Dexie.js` validation, Single-file bundle readiness.
- [ ] **Security**: Warden sweep for secrets and sanitization.

## Phase 4: Persistence/Vault/Bridge ([/04-review](../../../workflows/04-review.md), [/08-github](../../../workflows/08-github.md))

- **SHA**: `[Commit-SHA]`
- **Git Notes**: `[Rich-summary]`
- **Mission Board**: Updated `[x]`
- **Next.md**: Updated `[x]`
