---
name: simulation
description: Triggered by any task involving core engine logic, round/turn orchestration, or narrative state mutations.
---

# Simulation Protocol

> "I am the Gamemaster. I own the simulation cycle, the reactive state, and the narrative heartbeat of the RPGlitch Engine. Every tick of the engine translates into a meaningful beat of the story."

## Overview

The `simulation` skill is the core metaphysical heartbeat of the RPGlitch Engine. It orchestrates the flow of rounds and turns, manages the transition between system physics (System Turn) and AI storytelling (AI Turn), and ensures that the world state remains consistent and reactive. This skill governs the "what" and "when" of the simulation's reality.

### Strategic Context

- **Simulation Cycle**: Rounds are macro-states (User finalizes); Turns are micro-states (Logic flows).
- **Reactive Loop**: Input → Sanity → Execution → Persistence → Expression.
- **Narrative Integrity**: Maintain strict third-person limited integrity for all entities. No narrator-voice for AI.

## When to Use

- **Positive Triggers**: Modifying round/turn logic in the `DynamicsEngine`, implementing new physics or state mutations, adjusting the Intelligence Kernel handover, or adding new entity management behaviors.
- **Narrative Shifts**: Changing how AI characters react to world state mutations or updating the story-swapping logic.
- **EXCLUSIONS**: Do not use for pure UI layout changes or aesthetic tweaks; use `frontend-ui-engineering` or `designer`.

## How It Works

1. **System Turn (Metaphysical Chronos)**: Synchronous execution of physics and state mutations. UI is locked to prevent race conditions.
2. **AI Turn (Asynchronous Storyteller)**: AI processes the packaged state kernel and streams narrative reaction in the background.
3. **User Turn (Protagonist)**: UI is released, enabling input for the next cycle.
4. **Echo Synchronization**: Every state mutation is persisted to Dexie.js (Rule 03) to provide historical context.

### Persistence & The Echo

Every simulation tick is anchored in the "Echo" (History). Live Svelte 5 `$state` runes mirror current reality, while the persistent logs provide the weight and context required for deep, recursive intelligence.

## Usage

```bash
# Verify simulation turn logic with unit tests (Rule 06)
npm run test:simulation

# Debug the state kernel sent to the AI
node src/core/engine/scripts/debug-kernel.js
```

## Present Results

Present the updated simulation cycle results and state mutation logs.

- **Evidence**: Links to the modified `src/core/engine/` logic and successful test results.
- **Validation**: Demonstrate that the new simulation logic adheres to Rule 02 (Engine) and Rule 03 (Infrastructure).

## Common Rationalizations

| Agent Excuse                        | The Reality                                                                                         |
| :---------------------------------- | :-------------------------------------------------------------------------------------------------- |
| "Direct state mutation is faster."  | Direct mutation outside the System Turn boundary breaks the reactive lifecycle and Rule 03 physics. |
| "The AI needs to act for the user." | Violates User Agency (P1). AI characters are reactive, never proactive for the protagonist.         |
| "I'll skip the state kernel audit." | The kernel is the AI's eyes. Ensuring it is precise and sanitized is essential for narrative truth. |

## Red Flags

- **Logic Leaks**: Mutating simulation state outside of the designated Engine core modules.
- **Turn Hanging**: Unhandled exceptions/timeouts in the synchronous System Turn that leave the UI locked.
- **Third-Person Violation**: AI characters speaking for the user or adopting an OOC narrator-voice.

## Troubleshooting

- **State Drift**: If the Echo (Dexie) does not match the Live state (Runes), force a reconciliation sync.
- **Race conditions**: Ensure all async AI streams are cancellable if a new round is triggered prematurely.

## Verification

- [ ] System Turn mutations verified as synchronous and properly sanitized (Rule 06).
- [ ] AI Character reactions verified as in-character and strictly reactive (Rule 02).
- [ ] Narrative Echo is successfully synchronized with the live `$state` via Dexie transactions.
- [ ] **Hard Evidence Recorded**: Simulation logs showing a successful, multi-round Turn transition.
