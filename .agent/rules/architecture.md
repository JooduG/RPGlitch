---
trigger: always_on
---
# Mental Model: System Architecture

## Pattern C (Hybrid Execution)

1. **Left Panel:** Declarative Configuration (Perchance Lists).
2. **Right Panel:** Imperative Logic (JS/HTML).
3. **Bridge:** `engine-prompt-builder.js` fetches context from Right Panel -> sends to Left Panel for generation.

## Simulation Loop (The Heartbeat)

- **State:** Persisted in `Dexie.js`.
- **Physics:** Computed in `worker.js` (WebWorker) to unblock UI.
- **Rendering:** Reacts to DB changes.

## Security Model (Freedom Protocol)

- **Storage Override:** `localStorage` is intercepted to prevent platform-side data eviction.
- **Sandboxing:** `DOMPurify` filters all user/AI outputs.
- **Isolation:** `apps/` are isolated sandboxes. Shared code lives in `libs/` or `tools/`.

