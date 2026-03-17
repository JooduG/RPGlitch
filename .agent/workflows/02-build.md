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

- **Rules**: [.agent/rules/01-foundation.md](../rules/01-foundation.md).
- **Rules**: [.agent/rules/03-technetium.md](../rules/03-technetium.md).
- **State**: [.agent/state/tracks.md](../state/tracks.md) (Mission Board).
- **Reference**: [.agent/knowledge/atlas/07-physics.md](../knowledge/atlas/07-physics.md).

## 3. Procedures

### Phase 1: The Clarity Gate (Fabrication)

1. **Generation**: If using Stitch, generate the component. [[Invoke: stitch]](../skills/stitch/SKILL.md)
2. **Validation**: Ensure all logic uses **Svelte 5 Runes** exclusively. No legacy `export let` or `$:`. [[Invoke: svelte]](../skills/svelte/SKILL.md)
3. **Drafting**: Write minimal code to fulfill the task requirements.

### Phase 2: Refinement (The Chalk Regime)

1. **Styling**: Apply **Chalk Regime** tokens. No hardcoded hex or Tailwind. [[Invoke: styling]](../skills/styling/SKILL.md)
2. **Motion**: Add kinetic transitions and Snappy Curve animations. [[Invoke: motion]](../skills/motion/SKILL.md)

### Phase 3: The Quality Gate (Proving)

1. **Verify**: Run `npm run check` and `npm test`. [[Invoke: quality-assurance]](../skills/quality-assurance/SKILL.md)
2. **Evidence**: You MUST read and report terminal output to confirm success. No "blind" completion.
3. **Checkbox**: Mark the sub-task `[x]` in the task shard. [[Invoke: project]](../skills/project/SKILL.md)

## 4. Anti-Patterns

- **Blind Coding**: Committing without testing or verifying output.
- **Legacy Reactivity**: Sneaking in Svelte 3/4 patterns.
- **Style Drift**: Using CSS values not defined in `tokens.css`.
