---
name: busy-state-implementation
description: Implementing background processing and interactive loading states in the RPGlitch UI. Use when adding features that involve AI generation, background sync, or long-running tasks that require visual feedback (Scanning/Busy states).
---

# Busy State Implementation

The RPGlitch engine uses a unified pattern for handling background processing and interactive feedback to ensure the UI remains responsive and the user is informed of engine activity.

## Core Components

### 1. State Management (Orchestrator)

In the parent component (e.g., `Profile.svelte`), track active fields using a `SvelteSet`:

```javascript
import { SvelteSet } from "svelte/reactivity";
let busy_fields = new SvelteSet();

async function handle_action(fieldKey) {
  busy_fields.add(fieldKey);
  try {
    await long_running_task();
  } finally {
    busy_fields.delete(fieldKey);
  }
}
```

### 2. Component Integration

Pass the `busy` state to atomic components. `TextField.svelte` is the primary consumer.

```svelte
<TextField bind:value={entity[field]} busy={busy_fields.has(field)} />
```

### 3. Engine Heartbeat

Broadcast the engine phase to the global `simulationState` to trigger typing indicators or system-level busy states.

```javascript
import { simulationState } from "@state/status.svelte.js";

// Start
simulationState.start_generation(role); // phase: "generating"

// Stop
simulationState.stop_generation(); // phase: "idle"
```

## Visual Patterns

### The "Pulse" (Scanning) Animation

For "Scanning" or "Enhancing" states (like in `VisualWing.svelte`), use the `pulse` animation on status indicators.

```css
.status-tag.is-loading {
  animation: pulse var(--motion-l) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: var(--opacity-m);
  }
  50% {
    opacity: var(--opacity-xl);
  }
}
```

### Input Feedback

`TextField.svelte` automatically handles:

- **Cursor**: Sets `cursor: wait` when `busy` is true.
- **Interaction**: Disables the textarea to prevent concurrent edits.
- **Opacity**: Dims the field slightly (`opacity: var(--opacity-m)`).

## Verification Checklist

- [ ] Is the field key added to `busy_fields` before the async call?
- [ ] Is the field key removed in a `finally` block?
- [ ] Does the `TextField` receive the `busy` prop?
- [ ] If it's a generation task, is `simulationState.start_generation()` called?
