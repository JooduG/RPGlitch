# ⚡ Optimization: The Opportunity Matrix

> **Core Philosophy:** Performance is a feature. Architecture is the bridge between Logic and Speed.

## 1. The Equivalence Oracle

When refactoring for performance, use the **Equivalence Oracle** test:

- Can the system distinguish between the "New Fast Way" and the "Old Slow Way" at the result layer?
- If the result is isomorphic, the change is safe.

## 2. Isomorphic Transformations

Focus on changes that reduce complexity without changing semantics:

- **State Flattening**: Reducing `$state` nesting to minimize reactive dependency tracking.
- **Computed Caching**: Moving complex `$derived` logic into event-driven state updates if the dependency graph is too deep.

## 3. High-Opportunity Areas

1. **The Pulse (Gamemaster)**: Optimizing the `chrono.svelte.js` loop to skip unnecessary ticks.
2. **The Senses (Mesmer)**: Offloading CSS heavy lifting to hardware-accelerated transforms.
3. **The Archive (Scholar)**: Batching Dexie.js operations to reduce IndexedDB lock contention.

## 4. Performance Benchmarks

- **Initial Boot**: < 500ms (to Interactive).
- **State Propagation**: < 16ms (60fps reactivity).
- **RAG Recovery**: < 200ms for local lore lookup.
