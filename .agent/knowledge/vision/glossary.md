# 👁️ Mesmer: The Lexicon (Glossary)

The domain language of RPGlitch. These terms unify the technical architecture with the creative vision.

## 🏛️ The Five Pillars (The Pentarchitecture)

1. **Gamemaster (The Executive):** The logic and turn orchestration engine. Pure logic. No UI.
    - _Module:_ `src/gamemaster/chrono.svelte.js`
2. **Artificer (The Body):** The structural specialist. Manages the UI kit, components, and layout systems.
    - _Module:_ `src/artificer/`
3. **Mesmer (The Senses):** The sensory specialist. Owns visuals, audio, themes, and AI-generated media.
    - _Module:_ `src/mesmer/`
4. **Scholar (The Archivist):** The data persistence layer. Manages Dexie.js (IndexedDB) and the "Truth" of the simulation.
    - _Module:_ `src/scholar/`
5. **Warden (The Protector):** The security and hygiene guardian. Manages testing, linting, and LLM safety boundaries.
    - _Module:_ `src/warden/`

## 🧩 Core Concepts

- **Chrono Kinetics:** The system where input density determines time progression.
    - _Micro:_ Second-by-second (Combat/Sex).
    - _Macro:_ Time jumps (Travel/Rest).
- **Entropy Engine:** The randomizer that injects chaos into outcomes (Fail-Forward logic).
- **Resonance Monitor:** The unified HUD that tracks state variables (Trust, Will, Tension).
- **Runes:** Svelte 5 reactive primitives (`$state`, `$derived`, `$effect`) used for global state management.
- **Lorebook (ANEX):** A speculative knowledge injection system (See [Incubator](../incubator/lorebook-spec.md)).
- **Silent Stage:** The design philosophy of minimizing UI noise to prioritize narrative immersion.
- **Echo:** A persistent memory fragment stored by the Scholar.
- **Fractal:** Speculative branching narrative paths (See [Incubator](../incubator/mechanics-concepts.md)).
