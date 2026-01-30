---
trigger: always_on
---

# 🏗️ 02: App Architecture (The Blueprint)

> **The Reactive Engine:** A system where State (`$state`) drives Reality (UI) without imperative glue.

## 1. The Five Pillars

The application is structured into five distinct, decoupled pillars:

### 🕰️ 1. Gamemaster (The Executive)

- **Role:** Logic, Timing, and Turn Orchestration.
- **Core:** `src/gamemaster/chrono.svelte.js`.
- **Constraint:** Logic is pure. No UI code allowed here.

### 🛠️ 2. Artificer (The Body)

- **Role:** Structure and UI Kit.
- **Core:** `src/artificer/`.
- **Responsibility:** Atomic building blocks and layout systems.

### 🎭 3. Mesmer (The Senses)

- **Role:** Visuals, Audio, Form, and Theme.
- **Core:** `src/mesmer/`.
- **Responsibility:** Theme states, SCSS Architecture, and AI-generated visuals.

### 📚 4. Scholar (The Archivist)

- **Role:** Data Persistence.
- **Tech:** **Dexie.js**.
- **Rule:** The **Scholar API** (e.g., `runtime.save()`) is the only way to anchor reality to disk.

### 🛡️ 5. Warden (The Protector)

- **Role:** Security and Physics.
- **Responsibility:** Sanitize all inputs and enforce system limits before the LLM speaks.

## 2. The Reactive Cycle

1. **Input**: User action or system event.
2. **Physics (Warden)**: Validation.
3. **Synthesis (Gamemaster)**: Logic execution.
4. **Resonance (Scholar)**: Persistence.
5. **Reaction (Artificer/Mesmer)**: UI updates via Svelte Runes.

## 3. Strategic Orchestration

- **Bounded Contexts:** Each pillar manages its own state.
- **Choreography:** Pillars react to state changes in others via native reactivity (`$effect`, `$derived`), avoiding a central "Manager-Mediator" bottleneck.

---

**Next:** Architecture is realized through standard tools. See [03: Tech Stack](./03-tech-stack.md).
