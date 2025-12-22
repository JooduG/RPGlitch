---
trigger: always_on
---

# 🏗️ Mental Model: System Architecture

## The Split-Brain Architecture (Hybrid Execution)

This monorepo operates on a bicameral model where two distinct execution environments collaborate:

1. **Left Hemisphere (Declarative):**
   - **Tech:** Perchance Lists (Configuration, Text Gen, Randomization).
   - **Role:** The "Configuration & Creative" layer.
2. **Right Hemisphere (Imperative):**
   - **Tech:** Vanilla JS / HTML / SCSS.
   - **Role:** The "Logic & Rendering" layer.
3. **The Corpus Callosum (Bridge):**
   - **File:** `engine-prompt-builder.js`
   - **Function:** Fetches context from Right -> sends to Left for generation.

## Simulation Loop (The Heartbeat)

- **State:** Persisted in `Dexie.js` (Single Source of Truth).
- **Physics:** Computed in `worker.js` (WebWorker) to unblock the UI thread.
- **Rendering:** Reactivity system listens to DB changes -> updates DOM.

## Security Model (Freedom Protocol)

- **Storage Override:** `localStorage` is intercepted in `index.js` to prevent platform-side data eviction.
- **Sandboxing:** `DOMPurify` filters all user/AI outputs.
- **Isolation:**
  - `apps/` contains isolated sandboxes.
  - `libs/` and `tools/` contain shared code.
