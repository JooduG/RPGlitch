# 🗺️ RPGlitch Project Blueprint (Macro-Architecture)

As the engine's heartbeat, the **simulation** skill maintains the overarching topological map of our reality. The engine is divided into four sovereign layers, each with specific interfaces for state and interaction.

## ⚙️ Core Engine (`src/core/engine`)
*The physical laws and chronos of the simulation.*

- **Bootstrap**: Engine initialization lifecycle and global state orchestration.
- **Chrono**: Temporal tracking and reactive cycles via Svelte 5 Runes.
- **Session Driver**: State transitions, persistence checkpoints, and high-level logic loops.
- **Text Parser**: The diegetic bridge for translating narrative into command state.

## 💾 Data Layer (`src/data`)
*The permanent record and local persistence.*

- **Persistence**: `Dexie.js` implementation for local-first IndexedDB storage.
- **Normaliser**: Data sanitization and consistency enforcement for cross-source inputs.
- **Repository**: Sovereign CRUD operations for Entities (Characters/Fractals) and Stories.
- **Bridge**: The IPC layer mediating between the UI and the persistence layer.

## 💎 UI Layer (`src/ui`)
*The sensory expression and the Atomic UI.*

- **Atomic Design**: Structural hierarchy (Atoms → Molecules → Organisms).
- **Headless SDKs**: Integrated `Bits UI` for accessible interaction primitives.
- **Reactivity Model**: Pure Svelte 5 Runes (`$state`, `$derived`, `$effect`) for all presentation logic.

## 📡 Intelligence Layer (`src/core/intelligence`)
*The neural drivers and context management.*

- **Agent Integration**: Communication with external AI models and the Swarm/Jules SDK.
- **Context Management**: Coordination of the "Living Memory" (Pinecone) and the "Echo" for diegetic continuity.

---

> "Architecture is the blueprint of possibility."

---

## RPGlitch Project Blueprint (Architecture Mapping)

### Core Engine (`src/core/engine`)

- **Bootstrap**: Handles engine initialization and orchestration.
- **Chrono**: Manages game time and reactive cycles using Svelte 5 runes.
- **Session Driver**: Controls state transitions and session logic.
- **Text Parser**: High-fidelity parsing for narrative and game commands.

### Data Layer (`src/data`)

- **Persistence**: Uses `Dexie.js` for IndexedDB-based local persistence.
- **Normaliser**: Ensures data consistency across different sources.
- **Repository**: Handles CRUD operations for Entities and Stories.
- **Bridge**: Manages communication between the UI and the persistence layer.

### UI Layer (`src/ui`)

- **Atomic Design**: Structured into `atoms`, `molecules`, and `organisms`.
- **Headless Components**: Integrates `Bits UI` for accessible, unstyled components.
- **Reactivity**: Uses Svelte 5 runes (`$state`, `$derived`, `$effect`) for all UI logic.
- **Styling**: Vanilla CSS with tokenized variables.

### Intelligence Layer (`src/core/intelligence`)

- **Agent Integration**: Handles communication with external AI models and sub-agents.
- **Context Management**: Manages short-term and long-term memory for game state.
