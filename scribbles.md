# 🏗️ Mental Model: The Reactive Engine (Svelte 5)

> **The Living Graph:** A reactive system where State (`$state`) drives Reality (UI) without imperative glue.

## 1. The Reactive Cycle (The Heartbeat)

The system operates on a strict **Unidirectional Data Flow**. We do not manually update the DOM. We update the _State_, and the DOM reacts.

1. **Input (User/System):** Triggers `Chrono.advanceTurn()` or a reactive input.
1. **Physics (Warden):** Validates causality, security, and entropy.
1. **Synthesis (Gamemaster):** The LLM hallucinates the narrative outcome.
1. **Resonance (Scholar):** `Echo` consolidates the event into `Dexie` (DB) via `runtime.save()`.
1. **Reaction (Mesmer/Artificer):** Svelte Runes (`$state`, `$derived`) automatically update the UI.

## 2. The Five Pillars

### 🕰️ 1. Gamemaster (The Executive)

- **Role:** Time, Logic & Orchestration.
- **Core:** `src/gamemaster/chrono.svelte.js` (The Timekeeper).
- **Responsibility:** Manages the turn lifecycle (`idle` -> `scanning` -> `forecasting` -> `echoing`).
- **Constraint:** Logic here is pure. No UI code.

### 🛠️ 2. Artificer (The Body)

- **Role:** Structure, Form, & Tooling.
- **Core:** `src/artificer/` (UI Kit) & `tools/` (Build System).
- **Global State**: `src/gamemaster/state.svelte.js` (The App's "Consciousness").
- **Responsibility:**
    - Provides the atomic building blocks (`Card`, `Button`, `Layout`).
    - Manages the `Storymode` (Chat) and `Storyboard` (Grid) interfaces.
    - Handles the build pipeline (Vite).

### 🎭 3. Mesmer (The Senses)

- **Role:** Sensory Output (Visuals, Audio, Theme).
- **Core:** `src/mesmer/index.js` (The Facade).
- **Reactive Stores:**
    - `voice.svelte.js` (TTS State).
    - `theme.svelte.js` (Color/Style State).
- **Responsibility:** The "Illusionist" that paints over the Artificer's structures. Handles Text-to-Speech and Stable Diffusion requests.

### 📚 4. Scholar (The Archivist)

- **Tech:** **Dexie.js**.
- **Responsibility:** `runtime.save()` is the **ONLY** way to anchor reality to disk. If it isn't in Scholar, it didn't happen.

### 🛡️ 5. Warden (The Protector)

- **Role:** Security & Physics.
- **Core:** `src/warden/`.
- **Responsibility:** Sanitizes inputs and enforces "World Physics" before the LLM is allowed to speak.

## 3. The "Svelte 5 Native" Law (STRICT)

1. **Runes Over Everything:** Use `$state`, `$derived`, `$effect`, and `$props`.
    - ❌ **BAN:** `writable`, `readable` (Svelte 4 Stores).
    - ❌ **BAN:** `export let` (Legacy Props).
1. **Universal Reactivity:** Global state lives in `.svelte.js` modules (e.g., `voice.svelte.js`), NEVER in UI components. UI components just consume them.
1. **No Direct DOM:** Never use `document.querySelector` or `getElementById`. Bind to state.
1. **No Legacy Loops:** The old `engine/` loop is dead. Use `Chrono` (State Machine).

## 4. Strategic Orchestration (The Hybrid Model)

We avoid the "Manager-Mediator" bottleneck by utilizing a hybrid orchestration/choreography pattern:

- **Orchestration (Inside Bounded Contexts):** `Chrono` acts as the central orchestrator for the Turn Lifecycle, ensuring strict sequencing of physics, logic, and synthesis.
- **Choreography (Between Pillars):** Pillars react to state changes in other pillars via native Svelte reactivity (`$effect`, `$derived`). For example, `Scholar` automatically persists changes when `Chrono` completes a turn, and `Mesmer` visualizes state without being explicitly "told" to by the Gamemaster.
