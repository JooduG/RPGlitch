# Spec: Event Bus Purge

## Objective

Eliminate the legacy `bus.svelte.js` layer to fully embrace Svelte 5's direct reactivity. Shift from an event-driven "reactive-bridge" to a direct-mutation and hydration pattern.

## Architectural Shift

- **Old Path:** `Source -> Event Bus (Emit) -> Store (Listener) -> UI (Reactive)`.
- **New Path:** `Source -> Store (Direct Mutation) -> UI (Reactive)`.

## Key Mappings

| Legacy Event            | New Implementation Strategy                                                         |
| :---------------------- | :---------------------------------------------------------------------------------- |
| `CHAT_REFRESH`          | `messages` store listens to `runtime.storyId` changes via `$derived` or `$effect`.  |
| `MESSAGE_RECEIVED`      | `Session.addAiMessage` and `Session.send` call `messages.add()` directly.           |
| `GENERATION_*`          | `Engine` updates `engineState` (status store) directly. UI reacts to `engineState`. |
| `ENTITY_UPDATED`        | `Engine` and `ImageGeneration` call `runtime.updateEntity()` directly.              |
| `MEMORY_PRESSURE_CHECK` | `Engine` triggers `NarrativeDirector.consolidate()` directly.                       |

## Acceptance Criteria

- [x] `src/core/engine/bus.svelte.js` is deleted.
- [x] No imports of `@core/engine/bus.svelte.js` remain in the codebase.
- [x] Application boots and hydrates successfully from `Dexie.js` without the bus.
- [x] Real-time updates (Generation, Message Append, Entity Updates) work seamlessly.
- [x] All unit and integration tests for state and engine pass.
