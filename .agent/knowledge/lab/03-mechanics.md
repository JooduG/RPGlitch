---
trigger: always_on
description: Speculative gameplay mechanics, simulation physics, and causality systems.
---

# 🕹️ Lab 03: Mechanics (System & Physics)

> **Red Thread:** The underlying logic that governs risk, time, and world-persistence in the RPGlitch simulation.

## ⏳ Chrono Kinetics (Time Simulation)

**Hypothesis:** Content Density = Time Span. The "weight" of user input determines the simulation speed.

```xml
<CHRONO_KINETICS>
  <!-- Micro (Seconds): Dialogue, Combat, Intimacy. Action: Decelerate. -->
  <!-- meso (Minutes): Real-time flow for specific instructions. -->
  <!-- Macro (Hours/Days): Execute Time Jump. -->
  <AUTOMATION_TRIGGERS>
    1. Auto-Accelerate: If input contains "Then/After/Later" -> Jump to next node.
    2. Auto-Decelerate: If Conflict or Intimacy -> Force slow pacing.
    3. No Empty Jumps: Jumps require a Sensory Bridge (Light shift, sound decay).
  </AUTOMATION_TRIGGERS>
</CHRONO_KINETICS>
```

## 🎲 The Entropy Engine (Chaos & Risk)

**Hypothesis:** Every high-stakes action generates a Chaos Seed (1-100) to determine visceral outcomes.

```xml
<ENTROPY_SYSTEM>
  <MECHANIC>
    01-15 (BACKFIRE): Critical Failure + New Threat.
    16-40 (FRICTION): Struggle / Resistance.
    41-75 (STANDARD): Competent Flow.
    76-95 (VISCERAL): High Impact / Brutality.
    96-100 (SHATTER): Permanent Change / Lethality.
  </MECHANIC>
</ENTROPY_SYSTEM>
```

## 🧱 Object Permanence (Anchor System)

**Hypothesis:** Introduced objects, wounds, or threats act as "Anchors" that must be referenced until resolved.

- **Anchor Items:** Persistent tracking of held/holstered items.
- **Wound Persistence:** Injuries apply ongoing physiological and narrative penalties.
- **Chekhov's Rule:** If clothing is torn or a room is damaged, it stays that way until the simulation state is explicitly updated.

## 🧬 Entity Snapshot & Growth

> **Status:** BLUEPRINT (Drafted 2026-03-21)
> **Goal:** Map the temporal permanence of an entity by splitting character state into two distinct realities: the static library and the volatile simulation.

### The Dual Realities

1.  **The Sandbox (Library):** Outside a simulation, editing an entity mutates the permanent baseline (`db.entities`).
2.  **The Crucible (Simulation):** Inside a simulation, the character is locked into the narrative matrix. All changes affect the live active entity only; the library record stays frozen.

### The Temporal Clone (Snapshot)

When a simulation boots up, the system takes a deep clone of the full active entity (dynamics, eternal, present, past, future) and stashes it inside the active story record.

```js
story.entity_snapshots = {
    ai:      { ...full clone of active_ai at story start },
    fractal: { ...full clone of active_fractal at story start }
}
```

**Functions:**

- **Gravitational Anchoring:** `active_entity.dynamics_baseline` inherits from the snapshot at story load, giving characters bespoke psychological centers of gravity.
- **Delta Comparison:** Provides the "Before" state required for the Growth Report.

### Mutation Vectors

During the simulation lifecycle, the following parameters are subject to drift:

- `dynamics`: Drifts continuously via the physics engine (LIVE).
- `present`: Mutated by AI to reflect current physical/mental states (PENDING).
- `past[]`: New memory nodes crystallization (PENDING).
- `future[]`: Narrative vector consumption/generation (PARTIALLY LIVE).
- `eternal`: Manual DevMode interventions (PENDING).

### The Epilogue (Accept or Revert)

At the simulation's conclusion, the engine diffs the snapshot against the mutated active entity to generate a **Growth Report**.

**Binary Choice:**

- **Accept:** Flash the mutated entity back to `db.entities`. Trauma/Triumph is permanent.
- **Revert:** Restore from snapshot. It was just a dream.

### Implementation Hook

`DynamicsEngine._get_baselines(entity)` reads `entity.dynamics_baseline`. To feed this during story load:

```js
active_ai.dynamics_baseline = { ...story.entity_snapshots.ai.dynamics };
```

If no snapshot exists, it gracefully degrades to a baseline of `50` per axis.

## ⛈️ Atmospheric Logic

**Hypothesis:** The environment must dynamically reflect or contrast the Narrative Mood.

- **Atmospheric Mirror:** Environment as character (Tension -> Claustrophobia; Intimacy -> Warm textures).
- **Linguistic Priming:** Use of textures (Chiaroscuro, Kenopsia, Petrichor) to guide environment description without naming them.
