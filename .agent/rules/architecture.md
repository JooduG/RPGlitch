---
trigger: always_on
---

# 🏗️ Mental Model: System Architecture

> **The Bicameral Mind:** A hybrid organism where chaos (AI) and order (Code) co-evolve.

---

## 1. The Bicameral Architecture

The system operates on two distinct planes of existence:

### 🧠 Left Hemisphere (The Dreamer)

- **Role:** Creative generation, randomness, narrative possibilities.
- **Tech:** **Perchance Engine** (Declarative Lists).
- **Interface:** `window.ai` (The subconscious connection).

### ⚙️ Right Hemisphere (The Architect)

- **Role:** Logic, physics, rendering, state management.
- **Tech:** **Javascript Enclave** (Imperative Logic).
- **Structure:** The Four Pillars (see below).

### 🌉 The Corpus Callosum (Bridge)

- **Concept:** Synchronizes the dream with reality.
- **Implementation:**
  - **Infrastructure:** `tools/build.js` injects the `PERCHANCE_BRIDGE` shim to map global variables (`ai` -> `window.ai`).
  - **Logic:** `src/js/gamemaster/llm.js` abstracts the API calls to the AI Native Plugin.

---

## 2. The Four Pillars (Right Hemisphere)

The Javascript codebase is strictly organized into four domains:

### 🎭 1. GameMaster (The Executive)

- **Location:** `src/js/gamemaster/`
- **Role:** Orchestration, Decision Making, AI Interface.
- **Key Modules:** `Director` (Loop), `Session` (Flow), `LlmService` (Bridge).

### 👁️ 2. Mesmer (The Illusionist)

- **Location:** `src/js/mesmer/`
- **Role:** Presentation, UI, Audio, Sensory Output.
- **Tech:** **Svelte 5** (Runes) + **Pico.css**.
- **Motto:** "If it looks real, it is real."

### 📜 3. Scholar (The Archivist)

- **Location:** `src/js/scholar/`
- **Role:** Memory, History, Truth.
- **Tech:** **Dexie.js** (IndexedDB).
- **Mandate:** The Single Source of Truth. If it's not in the Scholar's library, it didn't happen.

### 🛡️ 4. Warden (The Protector)

- **Location:** `src/js/warden/`
- **Role:** Physics, Security, Entropy, Variance.
- **Key Modules:** `Physics` (Thermodynamics), `Security` (Sanitization).

---

## 3. The Simulation Loop (The Heartbeat)

1. **Pulse:** `GameMaster.Director` triggers a frame.
2. **Observation:** `Warden.Physics` scans the narrative for thermodynamic shifts (Velocity/Entropy).
3. **Synthesis:** `GameMaster` decides the next state.
4. **Memory:** `Scholar` commits the state to the DB.
5. **Rendering:** `Mesmer` observes the DB change and updates the DOM (Reactivity).

---

## 4. The Freedom Protocol

- **Constraint:** User data belongs to the User.
- **Mechanism:** `localStorage` getters/setters are intercepted in `src/js/gamemaster/bootstrap.js` to prevent platform-side data eviction.
- **Sanitization:** `Warden.Security` strictly filters all inputs to prevent injection.

## 5. Deployment Architecture

- **Build Target:** Single HTML Monolith (`dist/RPGlitch.html`).
- **Dependencies:** Inlined by `esbuild`.
- **Bridge:** Left-Panel variables (`ai`, `rpgLists`) are automatically mapped to `window` scope by the build injector.
