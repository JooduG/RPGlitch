# 💾 Dexie.js Persistence Patterns (Simulation State)

Simulation state in RPGlitch relies on local-first reactivity anchored in `Dexie.js`. As the engine responsible for the Physical and Echo states, the **simulation** skill must adhere to these data-fetching patterns.

## Reactive Fetching (`liveQuery`)

- **Standard**: Always utilize `liveQuery` for reactive data fetching from IndexedDB. This ensures the simulation state reflects real-time mutations.
- **Svelte 5 Adaptation**: In Rune-based environments, wrap `liveQuery` observables to bridge them into the `$state` lifecycle if standard store-like behavior is insufficient.

## The Data Bridge Pattern

1. **Load Sovereignty**: Fetch simulation-critical data within `load` functions or centralized state constructors.
2. **Prop Delegation**: Pass fetched data into UI components via props. This decouples the **Simulation Engine** logic from the **Atomic UI** layer.
3. **Transaction Integrity**: All mutations to the World or Entity state must be wrapped in scoped Dexie transactions to prevent state corruption during heavy round-processing ticks.

---

> "Persistence is the physical anchor of our narrative reality."
