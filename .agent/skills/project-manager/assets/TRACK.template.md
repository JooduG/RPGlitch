# Track Template - `[Feature-Name]`

> **Goal**: `[Brief-intent]`
> **Status**: `[ ]` Pending, `[~]` Active, `[x]` Complete, `[!]` Blocked, `[-]` Skipped
> **Type**: `[Feature/Bug/Chore/Refactor]`
> **Risk**: `[Low/Medium/High]`
> **Start Date**: 2026-03-27

## 1. Context Injection

- **Blueprint**: [/01-blueprint](../../../workflows/01-blueprint.md)
- **Infrastructure**: [Rule 03](../../../rules/03-infrastructure.md)
- **Compliance**: [Rule 06](../../../rules/06-compliance.md)
- **Existing Logic**: [File.js](../../../../src/)

## 2. Hypothesis & Risk

- **Hypothesis**: `[Reasoning]`
- **Risk Tier**: `[Low/Medium/High]`
- **Reproduction Case**: `[Steps]`

## 3. Implementation (Micro-Beats)

Use the **Micro-Beat Loop** (Red -> Green -> Refactor -> Verify).

- `[ ]` **Beat 1**: `[Description]`
- `[ ]` **Beat 2**: `[Description]`

## 4. Verification & Quality Gates

Ensure all boxes are checked before marking the track as `[x]` Complete.

- [ ] **Type Safety**: Zero `any` types in Svelte 5 logic.
- [ ] **Performance Budget**: CLS < 0.1, LCP < 2.5s.
- [ ] **Perchance Audit**: No `localStorage`, `Dexie.js` validation, Single-file bundle readiness.
- [ ] **Security**: Warden sweep for secrets and sanitization.
- [ ] **Manual Verification**: User-facing checklist generated.

## 5. Persistence (Echo)

- **SHA**: `[Commit-SHA]`
- **Git Notes**: `[Rich-summary]`
