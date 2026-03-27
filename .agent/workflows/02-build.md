---
name: 02-build
description: Implementation Loop. Logic, State, and Style fabrication.
---

# [/02-build](./02-build.md) - The Forge

> **Goal:** High-fidelity implementation using Svelte 5 Runes and the Chalk Regime (AGENTS.md Step 5).

## 1. Triggers

- **Logic Fabrication**: New runes or components.
- **Style Polishing**: Chalk Regime updates.
- **Slash Command**: [/02-build](./02-build.md)

## 2. Context Injection

- **Rules**: [Foundation](../rules/01-foundation.md).
- **Rules**: [Infrastructure](../rules/03-infrastructure.md).
- **Rules**: [Aesthetics](../rules/04-aesthetics.md).
- **Rules**: [Intelligence](../rules/05-intelligence.md).
- **State**: [.agent/project-management/tracks/](../project-management/tracks/) (Active Shard).

## 3. Procedures

### Phase 1: Fabrication & Isolation (The Micro-Beat Loop)

1. **Generation**: If UI involved, follow the Stitch design spec. [[Invoke: stitch]](../skills/stitch/SKILL.md)
2. **Validation**: Ensure all logic uses **Svelte 5 Runes** explicitly (`$state`, `$derived`, `$effect`).
   - **Legacy Refactor**: Silently refactor any Svelte 3/4 patterns (`stores`, `export let`) encountered in the sector. [[Invoke: svelte]](../skills/svelte/SKILL.md)
3. **Perchance Isolation**: No node-only imports. Rely on `esm.sh` and JIT compilation.
4. **Execution**: Implement changes in small, atomic beats. After each beat, verify the logic state matches the TDD expectation. [[Invoke: project-manager]](../skills/project-manager/SKILL.md)

### Phase 2: Refinement (The Chalk Regime)

1. **Styling**: Apply **Chalk Regime** tokens. Use native CSS variables. Avoid Tailwind unless explicitly requested. [[Invoke: css]](../skills/css/SKILL.md)
2. **Motion**: Add kinetic transitions using Svelte actions. [[Invoke: motion]](../skills/motion/SKILL.md)

### Phase 3: The Quality Gate (Step 6: Completeness)

1. **Verify**: Run `npm run verify` and manual browser checks. Proactively report terminal output. [[Invoke: warden]](../skills/warden/SKILL.md)
2. **Persistence**: Ensure state mutations are documented in the active track shard.
3. **Checkbox**: Mark sub-tasks `[x]` as they pass verification.

## 4. Anti-Patterns

- **Blind Coding**: Committing without seeing the verification output.
- **Legacy Reactivity**: Using `$:` or `writable()`.
- **Style Drift**: Hardcoding hex values instead of using `tokens.css`.

### 🕹️ Operational Heartbeat
- **🤖 AGENTS.md**: Step 5 (Execution - Forge active)
- **📜 Rules**: Rule 01 (Foundation), Rule 03 (Infrastructure), Rule 05 (Intelligence)
- **🧠 Capabilities**: svelte (Runes), css (Chalk Regime), project-manager (TDD)
- **💾 State**: .agent/project-management/tracks/<slug>.md
