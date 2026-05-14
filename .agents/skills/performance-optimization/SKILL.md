---
name: performance-optimization
description: Optimizes RPGlitch Engine performance. Use Svelte 5 Runes for fine-grained reactivity, focus on local-first persistence (Dexie), and maintain Chalk Regime aesthetic efficiency.
---

# Performance Optimization

> "Performance is diegetic. Low latency ensures narrative momentum. Measure before optimizing, then apply fine-grained reactivity."

## Overview

The `performance-optimization` skill ensures the RPGlitch Engine remains responsive during complex simulations. It prioritizes the Perchance output panel's unique constraints, focusing on local-first persistence (Dexie.js), Svelte 5 Rune efficiency, and hardware-accelerated CSS. Every optimization starts with measurement to find actual bottlenecks rather than guessing at improvements.

### Strategic Context

- **Latency as Immersion**: Target <100ms for System Turns to maintain narrative flow.
- **Fine-Grained Reactivity**: Use atomic `$state` and `$derived` to prevent component layout thrashing.
- **Persistence Efficiency**: Optimize Dexie.js transactions and queries for the "Echo" recall.

## When to Use

- **Positive Triggers**: UI lag when switching entities, slow "Echo" persistence, animation jank in the Chalk Regime, or when exceeding performance budgets in `tasks/ETERNAL.md`.
- **Engineering Triggers**: Noticing N+1 query patterns or unnecessary `$effect` usage.
- **EXCLUSIONS**: Do not optimize prematurely before functional correctness is proven with tests. Use `test-driven-development` first.

## How It Works

1. **Measure**: Profile the Svelte 5 component tree or use `console.time` for logic traces.
2. **Identify**: Find the specific state mutation or query loop causing the bottleneck.
3. **Fix**: Refactor to fine-grained Runes, move expensive computations to `$derived`, or batch Dexie operations.
4. **Verify**: Re-measure and confirm 60fps stability and low latency (Rule 06).

### Core Simulation Targets

| Metric                  | Good    | Needs Improvement | Poor    |
| :---------------------- | :------ | :---------------- | :------ |
| **System Turn Latency** | ≤ 100ms | ≤ 300ms           | > 500ms |
| **Interaction (INP)**   | ≤ 50ms  | ≤ 150ms           | > 200ms |
| **Logic Frame Rate**    | 60fps   | 30fps             | < 20fps |

### Svelte 5 Patterns

Avoid large, monolithic `$state` objects. Break them into atomic reactive units. Use `$derived` for all layout-dependent logic to keep the UI light.

### Perchance & Offline Performance

- **Asset Preloading**: Initialize SFX and textures during the boot sequence.
- **Memory Management**: Explicitly close `AudioContext` and kill pending AI streams during story swaps.
- **Batching**: Use `db.transaction()` for all multi-entity persistence operations.

## Usage

```bash
# Profile the engine performance via DevTools
mcp_chrome_devtools_performance_start_trace

# Log persistence timing
# console.time('Dexie:EchoSave'); ... console.timeEnd('Dexie:EchoSave');
```

## Present Results

Present the "Before vs. After" metrics and the rationale for the fix.

- **Evidence**: Browser performance traces and Dexie timing logs.
- **Validation**: Demonstrate a measurable reduction in turn latency or an increase in frame stability.

## Common Rationalizations

| Agent Excuse                   | The Reality                                                                                   |
| :----------------------------- | :-------------------------------------------------------------------------------------------- |
| "It's just local JavaScript."  | Logic debt compounds. Complex simulations can freeze the main thread if unoptimized.          |
| "The browser handles caching." | Perchance environments have transient storage. Use Dexie intentionally for local-first speed. |
| "I'll optimize it later."      | Performance is an architectural choice. Build with fine-grained reactivity from the start.    |

## Red Flags

- **Giant State Objects**: Updating a single field in a 100-field object triggers unnecessary reactivity.
- **N+1 Queries**: Fetching related entities inside an `each` loop logic.
- **Layout Shift (CLS)**: Failing to define dimensions for icons or glass containers, causing "Chalk hop".

## Troubleshooting

- **Memory Leaks**: Audit long-running simulation rounds for uncleaned event listeners or stale reactive pointers.
- **Animation Jank**: Check for excessive blur filter overhead on low-end hardware.

## Verification

- [ ] Before and after measurements are documented in the Walkthrough.
- [ ] No Svelte compiler warnings for "unnecessary reactivity" or "excessive cycles".
- [ ] Logic frame rate maintained at 60fps for interaction atoms (Rule 04).
- [ ] **Hard Evidence Recorded**: A browser trace confirming 60fps stability during peak load.
