---
name: 02-build
description: Implementation Loop. Logic, State, and Style fabrication.
---

# 02-build (The Forge)

> **Goal:** High-fidelity implementation using Svelte 5 Runes.

## 1. Triggers

- **Logic Fabrication**: New runes or components.
- **Style Polishing**: Chalk Regime updates.
- **Slash Command**: [/02-build](./02-build.md)

## 2. Brain (Context Injection)

- **Svelte**: [.agent/rules/02-technetium.md](../rules/02-technetium.md).
- **Logic**: [.agent/rules/01-foundation.md](../rules/01-foundation.md).
- **Active Track**: [.agent/state/tracks/](../state/tracks/).

## 3. Procedures

### Phase 1: Fabrication (The Validation Gate)

1. **Generation**: If using Stitch, generate the component.
2. **Audit (The Gate)**: You MUST validate the output against `SKILL.md` triggers:
    - **Syntax**: No trailing brackets, proper `$props()` destructuring.
    - **Styling**: REJECT if Tailwind or hardcoded hex is present. Force `var(--token)`.
    - **Refinement**: Self-correct via `stitch` until the gate passes. [Invoke: `stitch`]
3. **Red**: Write a test. Watch it fail.
4. **Green**: Write minimal code using **Runes** to pass. [Invoke: `svelte`]
5. **Refactor**: Apply **Chalk Regime** tokens and clean logic. [[Invoke: styling]](../skills/styling/SKILL.md) / [[Invoke: motion]](../skills/motion/SKILL.md)

### Phase 2: Proving

1. **Report**: Run `npm test` and `npm run check`. [[Invoke: quality-assurance]](../skills/quality-assurance/SKILL.md)

2. **Evidence**: Read and report terminal output to confirm success.

### Phase 3: Record

1. **Checkbox**: Mark the sub-task `[x]` in the track plan.

2. **Commit**: Use defined commit standards.

## 4. Anti-Patterns

- **Blind Coding**: Committing without testing.
- **Legacy Reactivity**: Using `export let` or stores.
