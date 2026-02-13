---
description: Technical manual for the Simulation Engine (Event Bus, Chrono Loop, State Management).
---

# ⚙️ Simulation Engine

> **Context**: The Unified Theory of Project Operations and Narrative Physics.
> **Jurisdiction**: `src/core/**`, `src/state/**`, `.agent/tasks/**`

## 1. ⚡ The Synapse (Event Bus)

We use a global Event Bus to decouple the UI (Mesmer) from the Logic (Gamemaster).

**Source**: `src/core/engine/bus.js`

### Usage

```javascript
import { events, EVENTS } from "@core/engine/bus.js"

// 📡 PUBLISH (Trigger an action)
events.dispatchEvent(
    new CustomEvent(EVENTS.STATE_CHANGED, {
        detail: { patch: { mode: "game" } },
    })
)

// 👂 SUBSCRIBE (React to changes)
events.addEventListener(EVENTS.TURN_COMPLETED, (e) => {
    console.log("Turn ended:", e.detail)
})
```

### Core Events

- `STATE_CHANGED`: Generic state update (legacy).
- `TURN_COMPLETED`: The simulation cycle finished.
- `GENERATION_STARTED` / `GENERATION_COMPLETED`: LLM streaming status.
- `ENTITY_UPDATED`: specific entity (character/world) changed.

## 2. 🕰️ Chrono Kinetics (The Loop)

Time is scale-adaptive. The Engine shifts "Gears" based on content density.

| Gear      | Time Span  | Context                    | Action                                                            |
| :-------- | :--------- | :------------------------- | :---------------------------------------------------------------- |
| **Micro** | Seconds    | Combat, Intimacy, Duel     | **Decelerate**. Describe blow-by-blow physics.                    |
| **Meso**  | Minutes    | Travel, crafting, dialogue | **Real-time**. Standard flow.                                     |
| **Macro** | Hours/Days | Resting, Time Jumps        | **Skip**. Use a "Sensory Bridge" (e.g., "The fire dies down..."). |

### The Heartbeat Protocol (Simulation Loop)

1.  **Actor (LLM)**: Generates prose based on `state.snapshot`.
2.  **Simulator (Gamemaster)**: Calculates consequences _after_ generation (e.g., "Fall damage" -> `visuals.update()`).
3.  **Render (Mesmer)**: The UI reflects the new state via `$effect` or `$derived` runes.
4.  **Archive (Scholar)**: Compresses the turn into Long Term Memory keys.

## 3. 💾 State Management (Svelte 5 Runes)

We use Svelte 5 Runes for all reactive state. Stores are Singletons located in `src/state/`.

### Core Stores

- **AppStore** (`src/state/app.svelte.js`):
    - **Responsibility**: UI state (Views, Panels, Settings, Toasts).
    - **Access**: `import { app } from "@state/app.svelte.js"`
    - **Key Feature**: `app.simulation` tracks the heartbeat status.

- **RuntimeStore** (`src/state/runtime.svelte.js`):
    - **Responsibility**: Simulation Data (Characters, World, Inventory).
    - **Access**: `import { runtime } from "@state/runtime.svelte.js"`
    - **Key Feature**: `runtime.character` is the active player entity.

### Integration Rules

1.  **No Direct Mutation from UI**:
    - ❌ BAD: `<button onclick={() => app.view = 'game'}>`
    - ✅ GOOD: `<button onclick={() => app.setView('game')}>`
    - **Why**: Logic belongs in the Store class methods, not the template.

2.  **Reactivity**:
    - Use `$state` for mutable data.
    - Use `$derived` for computed values (e.g., `canStart`).
    - Use `$effect` only for side effects (e.g., calling `saveSettings()` on change).

3.  **Persistence**:
    - `runtime.save()` triggers a DB sync.
    - `app.saveSettings()` syncs to `localStorage`.

## 4. 🏗️ Feature Implementation Guide

When asked to "Create a Feature":

1.  **Define State**: Add new properties to `app.svelte.js` or `runtime.svelte.js` using `$state`.
2.  **Define Actions**: Add methods to the Store class to mutate that state.
3.  **Hook Events**: If the feature needs to react to the Engine (e.g., "On Turn End"), add a listener in `_initListeners()`.
4.  **Bind UI**: Create a Svelte component that reads the store state and calls the actions.
