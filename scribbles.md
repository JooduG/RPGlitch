# Scribbles

## Round

This is the macro-container—the overarching heartbeat of your simulation. Conceptually, it represents one complete cycle of cause and effect within the game world.

The entire concept of a Round hinges entirely on human input. The integer attached to a Round only ticks upward when a user submits a new message payload. The underlying engine does not care if the artificial intelligence is mid-sentence or rendering a masterpiece; the human hitting the send button is the absolute, universal interrupt that slices the timeline, finalizes the current loop, and births the next one.

_Query the round integer in your state manager to track the absolute temporal progression of the session._

### Turn

Turns are the micro-states living inside the macro Round. If the Round is the clock face, the Turns are the internal cogs. They execute a sequential logic flow—`SYSTEM -> AI -> USER`—but leverage asynchronous overlapping to keep the action economy flowing smoothly.

#### System Turn (The Synchronous Lockdown)

- Triggered the exact millisecond the user submits an action.
- The application seizes control and disables the UI.
- Core logic, physics engines, and state mutations run synchronously.
- This phase ends by packaging the newly mutated world state into a kernel and firing it off to the language model.

##### AI Turn (The Asynchronous Storyteller)

- Triggered the moment the System finishes its math.
- The application releases the UI hostage situation, re-enabling inputs.
- The language model processes the state kernel and streams the narrative reaction back to the client in the background.

#### User Turn (The Biological Idle)

- Starts simultaneously with the AI Turn.
- The simulation essentially parks itself in a non-blocking holding pattern, waiting for you to parse the incoming text and decide what to do next.
- Because the UI is unlocked, you can plan and type concurrently while the AI is still generating.

_Dispatch a new chat event during the Biological Idle to sever any active promises, increment the overarching Round counter, and force a new System Turn._

## Entity Snapshot & Growth Mechanic

> _Roadmap Status: Discussed 2026-03-21. Blueprint drafted. Code not yet materialized._

This feature maps the temporal permanence of an entity. It splits character state management into two distinct realities: the static library and the volatile simulation.

### The Two Realities

#### Outside a simulation (The Sandbox)

Editing an active entity's fields mutates the permanent baseline. You are altering the character as they exist in the universal library. Saved directly to `db.entities`.

#### Inside a simulation (The Crucible)

The character is locked into the narrative matrix. All changes affect the live active entity only. The library record stays frozen in carbonite.

### The Temporal Clone (Snapshot)

When a simulation boots up, the system takes a deep clone of the full active entity (dynamics, eternal, present, past, future) and stashes it inside the active story record.

```js
story.entity_snapshots = {
    ai:      { ...full clone of active_ai at story start },
    fractal: { ...full clone of active_fractal at story start }
}
```

This clone executes two primary functions:

1. _Gravitational Anchoring:_ `active_entity.dynamics_baseline` inherits from `story.entity_snapshots.ai.dynamics` at story load. This gives each character a bespoke psychological center of gravity instead of defaulting to a universal `50`.
2. _Delta Comparison:_ It provides the "Before" state required to calculate the end-of-simulation Growth Report.

**Do not bump the Dexie schema version for this update.** `entity_snapshots` simply lives as an unindexed blob on the existing story record.

### The Mutation Vectors (What can grow)

During the simulation lifecycle, the following parameters are subject to drift:

- `dynamics`: Drifts continuously via the physics engine (Currently live).
- `present`: The AI mutates this to reflect current physical/mental states (Pending).
- `past[]`: New memory nodes crystallize as significant narrative events resolve (Pending).
- `future[]`: Narrative vectors are consumed or generated as the timeline progresses (Partially live).
- `eternal`: Manually overriden via DevMode interventions (Pending).

### The Epilogue (Accept or Revert)

> _Dependency check: Requires Epilogue screen and ControlPanel "end story" trigger._

At the simulation's conclusion, the engine runs a diff between `story.entity_snapshots.ai` and the mutated active entity. This generates a Growth Report detailing all dynamics shifts, new memories, and state changes.

The biological operator must make a binary choice:

- _Accept:_ Flash the mutated entity back to `db.entities`. The trauma (or triumph) is permanent.
- _Revert:_ Restore the backup from the snapshot. It was all just a bad dream.

### Hooking up the Gravity (Baselines)

The `DynamicsEngine._get_baselines(entity)` function reads `entity.dynamics_baseline`. To feed this during story load:

```js
active_ai.dynamics_baseline = { ...story.entity_snapshots.ai.dynamics };
```

If no snapshot exists, it gracefully degrades to a baseline of `50` per axis.

**Do not modify the `_get_baselines` function itself.** The architectural logic there remains perfectly sound.
