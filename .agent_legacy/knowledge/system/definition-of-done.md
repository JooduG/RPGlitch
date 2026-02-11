# ✅ Definition of Done (The Gold Standard)

> **Directive:** A task in RPGlitch is not finished when the code is written; it is finished when reality matches the spec with auditable proof.

## 1. Implementation Standards

- [ ] Code is implemented strictly to the `spec.md`.
- [ ] Logic follows the [Five Pillars](../../rules/02-architecture.md) (Pure IO where possible).
- [ ] Svelte components use **Runes** exclusively (`$state`, `$derived`, `$props`).
- [ ] Styling adheres to [The Chalk Regime](../../rules/06-aesthetic.md).

## 2. Integrity & Quality Gates

- [ ] **Test Coverage**: Unit tests exist and pass for all new logic.
- [ ] **Security**: All `@html` and `innerHTML` inputs are sanitized via Warden.
- [ ] **Hygiene**: No `console.log`, `FIXME`, or dead comments remain.
- [ ] **Accessibility**: Interactive elements have unique IDs and ARIA labels.

## 3. Auditability (The Paper Trail)

- [ ] All checkpoints in `plan.md` are marked with Git SHAs.
- [ ] A [walkthrough](../../../task.md) exists with visual or console-based proof of work.
- [ ] Git commit messages follow the `gamemaster(type): description` format.

## 4. Resonance Check

- [ ] The change does not introduce "Pillar Leakage" (e.g., Logic in Artificer).
- [ ] The system architecture remains decoupled and reactive.
