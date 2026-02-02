# ⚙️ Gamemaster: The Simulation Engine & Laws

> **Context**: The Unified Theory of Project Operations and Narrative Physics.
> **Jurisdiction**: `src/core/**`, `src/state/**`, `.agent/tasks/**`

## 1. 📜 The Prime Directives (Governance)

All logic processing must respect this three-tier priority system:

- **L1 (ABSOLUTE): User Agency**. The system must never violate user intent or "god-mod" the user's character.
- **L2 (CRITICAL): Internal Consistency**. Character personality, world physics, and established memory (The "Forever" Store) must be maintained.
- **L3 (HIGH): Narrative Momentum**. Strive for cinematic pacing and sensory depth ("Sensory Bridges").

## 2. 🕰️ Chrono Kinetics (Temporal Physics)

Time is scale-adaptive. The Engine shifts "Gears" based on content density.

| Gear      | Time Span  | Context                    | Action                                                            |
| :-------- | :--------- | :------------------------- | :---------------------------------------------------------------- |
| **Micro** | Seconds    | Combat, Intimacy, Duel     | **Decelerate**. Describe blow-by-blow physics.                    |
| **Meso**  | Minutes    | Travel, crafting, dialogue | **Real-time**. Standard flow.                                     |
| **Macro** | Hours/Days | Resting, Time Jumps        | **Skip**. Use a "Sensory Bridge" (e.g., "The fire dies down..."). |

## 3. 💾 Data Architecture (The Four-Field Schema)

The Engine separates immutable truth from mutable state.

1.  **Forever (Truth)**: Immutable personality, biology, and core drives. (Stored in `src/data/library/`).
2.  **Present (State)**: Mutable, reactive status using **Svelte 5 Runes** (`$state`). (Stored in `src/state/*.svelte.js`).
3.  **Past (Log)**: Compressed narrative history. (Managed by **Scholar**).
4.  **Future (Goals)**: Immediate objectives and looming threats.

## 4. 🏗️ System Design (Clean Architecture)

We strictly enforce the **Dependency Rule**: _Dependencies point INWARDS._

- **Entities (`src/gamemaster`)**: Core business logic. Zero dependencies on UI.
- **State (`src/state`)**: Singleton Stores (`.svelte.js`).
- **Adapters (`src/ui`)**: UI components (`mesmer`) that _observe_ state but never mutate it directly.
- **Infrastructure (`src/scholar`)**: Database and Persistence.

## 5. ⚡ The Heartbeat Protocol (Simulation Loop)

1.  **Actor (LLM)**: Generates prose based on `state.snapshot`.
2.  **Simulator (Gamemaster)**: Calculates consequences _after_ generation (e.g., "Fall damage" -> `health.update(h => h - 10)`).
3.  **Render (Mesmer)**: The UI reflects the new state via `$effect` or `$derived` runes.
4.  **Archive (Scholar)**: Compresses the turn into Long Term Memory if significant.

## 6. 🛡️ Operational Constraints

- **Physics of Friction**: Success is earned. Enforce realistic consequences.
- **No Direct Mutation**: UI components must call methods (e.g., `inventory.add()`), not mutate private fields.
- **Pure IO**: Logic classes must not touch the DOM. They return mathematical truths; Mesmer paints them.
