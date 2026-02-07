---
trigger: always_on
---

# 🏗️ 02: App Architecture (The Blueprint)

> **The Reactive Engine:** A system where State (`$state`) drives Reality (UI) without imperative glue.

## 1. The Five Pillars

The application is structured into five distinct, decoupled pillars:

### 🕰️ 1. Core Engine (The Executive)

- **Role:** Logic, Timing, and Turn Orchestration.
- **Core:** `src/core/engine/engine.js`.
- **Constraint:** Logic is pure. No UI code allowed here.

### 🛠️ 2. UI & Structure (The Body)

- **Role:** Structure and UI Kit.
- **Core:** `src/ui/`.
- **Responsibility:** Atomic building blocks and layout systems.

### 🎭 3. Sensory (The Senses)

- **Role:** Visuals, Audio, Form, and Theme.
- **Core:** `src/media/`.
- **Responsibility:** Theme states, SCSS Architecture, and AI-generated visuals.

### 📚 4. Data (The Archivist)

- **Role:** Data Persistence.
- **Tech:** **Dexie.js**.
- **Rule:** The **Data API** (e.g., `runtime.save()`) is the only way to anchor reality to disk.

### 🛡️ 5. Security (The Protector)

- **Role:** Security, Physics, and Sanitization.
- **Core:** `src/core/security/security.js`.
- **Responsibility:** Sanitize all inputs and enforce system limits before the LLM speaks.

## 2. The Reactive Cycle

Every interaction follows a 5-step loop. We do not use imperative "managers"; we use **Runes** to propagate changes.

1. **Input (Trigger):** A user action, a timed event, or an AI response arrives.
2. **Sanity (Security):** Validation occurs. Is the action legal? Is the input sanitized?
3. **Execution (Core Engine):** The "Brain" processes the event, and logic state is updated.
4. **Persistence (Data):** The state change is anchored to persistence (Dexie.js). Reality is "saved."
5. **Expression (UI/Sensory):** The UI Runes detect the state change and update the DOM, generate images, or trigger audio.

## 3. The Triad Principle (Data States)

Within the system, data exists in three distinct states:

- **The Spec (The Blueprint):** The raw definitions (Lorebook, character profiles).
- **The State (The Current):** The live, reactive `$state` in memory.
- **The Echo (The History):** The persisted record of the past (Data records).

## 4. Strategic Orchestration

- **Bounded Contexts:** Each pillar manages its own state.
- **Choreography:** Pillars react to state changes in others via native reactivity (`$effect`, `$derived`), avoiding a central "Manager-Mediator" bottleneck.
- **Constraint - Pure Logic:** The **Core Engine** and **Data** layers must remain **Pure IO**. They are not allowed to touch the DOM or use CSS classes. They provide the "Mathematical Truth" that the **UI** and **Sensory** layers interpret.

---

**Next:** Architecture is realized through standard tools. See [03: Tech Stack](./03-tech-stack.md).
