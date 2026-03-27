# Track: `PM-Upgrade-Sovereign-2.0`

> **Goal**: Upgrade Project Manager skill to high-fidelity Sovereign 2.0 lifecycle.
> **Status**: `[~]` Active
> **Type**: `Chore`
> **Risk**: `Medium`
> **Start Date**: 2026-03-27

## 1. Context Injection

- **plan**: [/01-plan](../../../workflows/01-plan.md)
- **Infrastructure**: [Rule 03](../../../rules/03-infrastructure.md)
- **Compliance**: [Rule 06](../../../rules/06-compliance.md)
- **Archive Source**: [project-management-comp.md](../../archive/project-management-comp.md)

## 2. Hypothesis & Risk

- **Hypothesis**: Adopting TDD Granularity and Git Notes will improve session handoff reliability and auditability.
- **Risk Tier**: `Medium`. Modifying the core PM behavior could lead to procedural confusion if not documented clearly.
- **Reproduction Case**: Attempt to resolve an architectural conflict using only standard `TRACKS.md` markers vs new Sovereign 2.0 markers.

## 3. Implementation (Micro-Beats)

- `[x]` **Beat 1**: Research high-fidelity patterns and verify Rule 03/05 alignment.
- `[x]` **Beat 2**: Refactor `SKILL.md` with 7-step lifecycle.
- `[x]` **Beat 3**: Update `TRACK.template.md` with Quality Gates.
- `[~]` **Beat 4**: Perform manual dry-run and sync `mission-board.md`.
- `[ ]` **Beat 5**: Generate final walkthrough and archive.

## 4. Verification & Quality Gates

- [x] **Type Safety**: N/A (Markdown).
- [x] **Performance Budget**: Verified CLS/LCP metrics are included in the skill definition.
- [x] **Perchance Audit**: No `localStorage` used in templates; Rule 03 compliant.
- [x] **Security**: Warden sweep passed (no secrets in skill docs).
- [ ] **Manual Verification**: User to verify the new track-log and mission-board presentation.

## 5. Persistence (Echo)

- **SHA**: `[In-Progress]`
- **Git Notes**: `Implementing Sovereign 2.0 lifecycle. Successfully updated skill logic and assets. performing live verification.`
