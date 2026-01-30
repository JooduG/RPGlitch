# 🏗️ Artificer: System Architecture (The Skeleton)

The RPGlitch engine is a **Reactive Monolith** where state drives reality. It is designed to be genre-agnostic, handling everything from high-fantasy combat to intimate social simulations with the same underlying physics.

## 1. The Five Pillars (Revisited)

The system is decoupled into five distinct domains, each with its own "Pillar Head" (a Svelte Rune module).

| Pillar         | Focus            | Module            |
| :------------- | :--------------- | :---------------- |
| **Gamemaster** | Logic & Time     | `src/gamemaster/` |
| **Artificer**  | Body & Structure | `src/artificer/`  |
| **Mesmer**     | Senses & Visuals | `src/mesmer/`     |
| **Scholar**    | Memory & Truth   | `src/scholar/`    |
| **Warden**     | Shield & Physics | `src/warden/`     |

## 2. The Reactive Cycle

Every interaction in RPGlitch follows a 5-step loop. We do not use imperative "managers"; we use **Runes** to propagate changes.

1. **Input (Trigger):** A user action, a timed event, or an AI response arrives.
2. **Physics (Warden):** Validation occurs. Is the action legal? Is the input sanitized?
3. **Synthesis (Gamemaster):** The "Brain" processes the event, and logic state is updated.
4. **Resonance (Scholar):** The state change is anchored to persistence (Dexie.js). Reality is "saved."
5. **Reaction (Mesmer/Artificer):** The UI Runes detect the state change and update the DOM, generate images, or trigger audio.

## 3. The Triad Principle

Within the system, data exists in three distinct states:

- **The Spec (The Blueprint):** The raw definitions (Lorebook, character profiles).
- **The State (The Current):** The live, reactive `$state` in memory.
- **The Echo (The History):** The persisted record of the past (Scholar records).

## 4. Constraint: Pure Logic

The **Gamemaster** and **Scholar** must remain **Pure IO**. They are not allowed to touch the DOM or use CSS classes. They provide the "Mathematical Truth" that the **Artificer** and **Mesmer** interpret.
