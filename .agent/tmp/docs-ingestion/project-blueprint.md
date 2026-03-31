# RPGlitch Project Blueprint (Architecture Mapping)

## Core Engine (`src/core/engine`)

- **Bootstrap**: Handles engine initialization and orchestration.
- **Chrono**: Manages game time and reactive cycles using Svelte 5 runes.
- **Session Driver**: Controls state transitions and session logic.
- **Text Parser**: High-fidelity parsing for narrative and game commands.

## Data Layer (`src/data`)

- **Persistence**: Uses `Dexie.js` for IndexedDB-based local persistence.
- **Normaliser**: Ensures data consistency across different sources.
- **Repository**: Handles CRUD operations for Entities and Stories.
- **Bridge**: Manages communication between the UI and the persistence layer.

## UI Layer (`src/ui`)

- **Atomic Design**: Structured into `atoms`, `molecules`, and `organisms`.
- **Headless Components**: Integrates `Bits UI` for accessible, unstyled components.
- **Reactivity**: Uses Svelte 5 runes (`$state`, `$derived`, `$effect`) for all UI logic.
- **Styling**: Vanilla CSS with tokenized variables.

## Intelligence Layer (`src/core/intelligence`)

- **Agent Integration**: Handles communication with external AI models and sub-agents.
- **Context Management**: Manages short-term and long-term memory for game state.
