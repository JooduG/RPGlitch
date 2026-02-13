# ⚡ Optimization: The Opportunity Matrix

> **Skill:** devops
> **Red Thread:** Performance is a feature. Architecture bridges logic and speed.

## 1. The Equivalence Oracle

When refactoring for performance, use the **Equivalence Oracle** test:

- Can the system distinguish between the "New Fast Way" and the "Old Slow Way" at the result layer?
- If the result is isomorphic, the change is safe.

## 2. Isomorphic Transformations

Focus on reducing complexity without changing semantics:

- **State Flattening**: Reducing `$state` nesting to minimize reactive dependency tracking.
- **Computed Caching**: Moving complex `$derived` logic into event-driven state updates.

## 3. High-Opportunity Areas

1. **🕹️ GameMaster**: Optimizing the `chrono.svelte.js` loop.
2. **🎭 Mesmer**: Offloading visuals to hardware-accelerated CSS transforms.
3. **📚 Scholar**: Batching Dexie.js operations to reduce IndexedDB lock contention.

## 4. Performance Benchmarks

- **Initial Boot**: < 500ms (to Interactive).
- **State Propagation**: < 16ms (60fps reactivity).
- **RAG Recovery**: < 200ms for local lore lookup.
