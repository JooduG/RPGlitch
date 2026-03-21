# Track: Narrative Bridge

## Goal

Connect the `DynamicsEngine` output to the `SessionDriver` and `NarrativeDirector` to trigger automatic scene complications (e.g., environmental shifts, "Fractal" interventions) based on high-entropy or high-chaos states.

## Success Criteria

- [ ] `NarrativeDirector.processComplications(snapshot)` implemented.
- [ ] `IntelligenceKernel.executeTurn` calls the complication bridge.
- [ ] Crisis thresholds (Chaos > 80, Intensity > 90) trigger visible narrative shifts.
- [ ] `npm run test` passes.

## Atomic Checklist

- [ ] [ENGINE] Implement crisis detection logic in `NarrativeDirector`.
- [ ] [ENGINE] Integrate bridge into `IntelligenceKernel` simulation loop.
- [ ] [ENGINE] Define complication turn injection protocol (Fractal voice).
- [ ] [TEST] Create `src/core/engine/NarrativeDirector.test.js`.
- [ ] [VERIFY] Verify "Glitch" complications via DevWing state forcing.

## Entity Snapshot & Growth Mechanic

> Discussed 2026-03-21. Not yet implemented.

### The Two Modes

**Outside a simulation (setup):**
Editing an active entity's fields changes the **permanent baseline** — the character as they exist in the library. Saved to `db.entities`.

**Inside a simulation:**
The character is "locked in". All changes are to the **live active entity** only. The library record stays frozen.

---

### Snapshot at Story Creation

When a simulation starts, take a **deep clone of the full active entity** (all fields: dynamics, eternal, present, past, future) and store it inside the story record:

```js
story.entity_snapshots = {
    ai:      { ...full clone of active_ai at story start },
    fractal: { ...full clone of active_fractal at story start }
}
```

This snapshot serves two purposes:

1. **Gravity baseline** — `active_entity.dynamics_baseline` gets stamped from `story.entity_snapshots.ai.dynamics` at story load, giving each character a personal gravitational center instead of the universal `50`.
2. **"Before" state** for the end-of-simulation Growth Report.

No Dexie schema version bump needed — `entity_snapshots` is an unindexed blob on the existing story record.

---

### What Can Grow During a Simulation

- `dynamics` — drifts via the physics engine (already live)
- `present` — AI can update to reflect the character's current state (not yet implemented)
- `past[]` — new memories can accumulate as significant events happen (not yet implemented)
- `future[]` — vectors get consumed/added as the story progresses (partially live)
- `eternal` — user can edit in DevMode (not yet implemented)

---

### Epilogue: Accept or Revert

> Depends on: Epilogue screen + ControlPanel "end story" button (neither built yet).

At the end of a simulation, diff `story.entity_snapshots.ai` vs the current active entity and show a **Growth Report** (dynamics shifts, changed `present` text, new memories, etc.).

User chooses:

- **Accept** — write the evolved entity back to `db.entities`. The character has permanently grown.
- **Revert** — restore from the snapshot. The simulation never happened to them.

---

### Gravity Hookup (How `dynamics_baseline` Gets Fed)

`DynamicsEngine._get_baselines(entity)` reads `entity.dynamics_baseline`. At story load:

```js
active_ai.dynamics_baseline = { ...story.entity_snapshots.ai.dynamics }
```

Falls back to `50` per axis if no snapshot exists. `_get_baselines` itself requires no changes.
