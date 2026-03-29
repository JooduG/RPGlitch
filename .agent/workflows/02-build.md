---
name: 02-build
description: Implementation Loop. Logic, State, and Style fabrication.
risk: low
source: AI
date_added: 2024-03-29
---

# [/02-build](./02-build.md) - Code Execution

## Objectives: Fabrication

- Objective: Implement approved features using Svelte 5 Runes.
- Objective: Ensure aesthetic compliance with the Chalk Regime.

## Context-Injection: Tactical Implementation

- [Foundation](../rules/01-foundation.md)
- [Aesthetics](../rules/04-aesthetics.md)
- [Svelte Specialist](../skills/svelte/)
- [Designer Orchestrator](../skills/designer/)
- [Operations Executor](../skills/orchestration-operations/)

## Capabilities: Reactive Construction

- **Logic**: Svelte 5 Runes ($state, $derived, $effect).
- **Style**: Native CSS (The Chalk Regime).
- **Sensory**: [Motion](../skills/motion/) & [Audio](../skills/audio/).

## Procedure

### Phase 1: Foundational Scaffolding (Step 1.2: Order of Ops)

1. **State First**: Define the reactive state models using Svelte 5 Runes. Prioritize data integrity over UI layout. [[Invoke: svelte]](../skills/svelte/)
2. **Logic Wiring**: Connect state mutations to the Core Engine. Maintain strict separation of concerns—pure IO only. [[Invoke: orchestrator]](../skills/orchestrator/)

### Phase 2: Cosmetic Polish (Step 5: Execution)

1. **The Chalk Regime**: Apply CSS tokens (Rule 04: Aesthetics). Use glassmorphism and the Nordic palette for all surface components. [[Invoke: css]](../skills/css/)
2. **Kinetic UI**: Add motion bridges using Svelte actions (use:shimmy, use:pulse). Ensure physics-based transitions. [[Invoke: motion]](../skills/motion/)

### Phase 3: Logic Grounding (Step 4: Persistence)

1. **Persistence**: Anchor the new state in Dexie.js (IndexedDB). Ensure memory continuity. [[Invoke: orchestrator]](../skills/orchestrator/)

## Anti-Patterns

- **Ad-hoc Utilities**: Using inline styles or one-off CSS instead of tokens.
- **Legacy Reactivity**: Using `export let` or `writable()` in Svelte 5.
- **Shadow Logic**: Managing state in the DOM instead of the context block.
