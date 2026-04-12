---
name: deprecation-and-migration
description: Manages deprecation and migration within the Engine. Use when removing legacy Svelte 4 patterns (stores,$:), consolidating entity state, or migrating users from one Engine version to another.
---

# Deprecation and Migration

> "Code is a liability. Deprecation is the discipline of removing code that no longer earns its keep, and migration is moving safely to the modern standard."

## Overview

The `deprecation-and-migration` skill governs the technical evolution of the RPGlitch Engine. It ensures that legacy patterns (such as Svelte 4 stores) are systematically replaced by high-performance modern alternatives like Svelte 5 Runes. This process maintains engine integrity while reducing technical debt and improving local-first simulation performance.

### Strategic Context

- **Runes Over Stores**: Svelte 5 Runes are the sovereign standard for reactive state.
- **Hyrum's Law**: Migration must be transparent to narrative logic and AI-observed states.
- **Sunsetting**: Proactively remove features that clash with the Chalk Regime or Nordic Collection.

## When to Use

- **Positive Triggers**: Migrating Svelte 4 components to Svelte 5 (`writable() -> $state()`), consolidating Entity types, or sunsetting legacy Engine modules.
- **Refactoring Triggers**: Moving logic from external stores into the core DynamicsEngine.
- **EXCLUSIONS**: Do not use for initial feature implementation; use domain-specific skills instead.

## How It Works

1. **Advisory Phase**: Tag legacy logic with `TODO-AI: Deprecated` labels.
2. **Adapter Construction**: Build bridges for legacy components to read from new state if necessary.
3. **Compulsory Cutover**: Migrate UI atoms to the new patterns (e.g., `$props()`).
4. **Final Scouring**: Remove the legacy imports and modules from `src/legacy/` or state repositories.

### The Svelte 5 Migration Pattern

Utilize the `$state` rune for core engine logic and exposing values via a getter/setter interface. Avoid leaking raw stores into components; use fine-grained reactivity.

## Usage

```bash
# Identify files using legacy Svelte 4 patterns
grep -r "writable(" src/

# Audit migration progress
npm run audit:migration
```

## Present Results

Present the migration plan and proof of safe cutover.

- **Evidence**: A side-by-side comparison of the legacy vs. modern implementation and passed test logs.
- **Validation**: Confirmation that both performance metrics (LCP) and functional requirements (Engine rounds) are maintained.

## Common Rationalizations

| Agent Excuse                     | The Reality                                                                |
| :------------------------------- | :------------------------------------------------------------------------- |
| "The store works fine."          | Stores have significantly more overhead than Runes in complex simulations. |
| "Users will migrate themselves." | You are the Physics. Structural changes must drive behavioral alignment.   |
| "It's too risky to delete."      | Keeping dead code increases cognitive load and causes maintainability rot. |

## Red Flags

- **Store-Rune Hybridization**: Mixing `$state` and `writable()` in the same logical boundary.
- **Legacy Persistence**: Features being built on top of deprecated Dexie schemas or store paths.
- **Silent Sunsetting**: Removing functionality without notifying the user or providing an ADR.

## Troubleshooting

- **State Sync Issues**: Use Svelte 5's `$effect` to synchronize legacy components during the transition.
- **Type Mismatches**: Ensure JSDoc/TS definitions represent the new reactive shape precisely.

## Verification

- [ ] New implementation follows Rule 03 (Infrastructure) and Rule 05 (Nomenclature).
- [ ] Legacy imports removed from all migrated `src/ui/` components.
- [ ] Benchmarks confirm zero regression in simulation tick performance.
- [ ] **Hard Evidence Recorded**: A "Final Migration" log confirming zero remaining references to deprecated stores.
