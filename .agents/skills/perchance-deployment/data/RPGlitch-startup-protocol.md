# RPGlitch — Session Protocol & Handover Specification

> **System Designation**: Sovereign AI Roleplay Engine  
> **Core Architecture**: Svelte 5 Runes + Vite 8 (Single-File Production Bundle)  
> **Target Deployment**: Perchance (`perchance.org`)  
> **Source Repository**: `https://github.com/JooduG/RPGlitch`  
> **Global Instructions & System Rules**: `https://github.com/JooduG/gemini`  
> **Protocol Audience**: External AI Engineering Agents & Collaborators

---

## ⚡ 1.0 Initial Setup & Session Protocol (For External Agents)

External AI agents executing tasks on this repository operate without direct access to local execution shells or machine-specific environments. Adhere to these universal operational laws:

1. 📥 **Repository & Context Alignment**
   - Treat the workspace `src/` as the single source of truth.
   - Always reference relative repository paths (e.g., `src/engine/session.js`, `tasks/PRESENT.md`). Never invent or reference machine-specific absolute file paths.
   - Ground all architectural decisions in the active conventions established in `GEMINI.md`, `DESIGN.md`, this specification, and global instructions in `https://github.com/JooduG/gemini`.

2. 📜 **Shell & Template Protection**
   - The shell host `index.html` at the project root is hand-maintained between sessions.
   - Never rebuild `index.html` from scratch or overwrite custom wrapper tags and external CDN script imports.

3. 🛡️ **Svelte 5 Sovereignty (Non-Negotiable)**
   - Utilize Svelte 5 **Runes exclusively** (`$state()`, `$derived()`, `$effect()`, `{@render snippet}`).
   - Legacy Svelte 4 primitives (`export let`, `$:`, `writable()`, `readable()`, `<slot />`, `createEventDispatcher`) are strictly forbidden.

4. 💾 **Persistence Boundary (IndexedDB Only)**
   - Usage of `localStorage` is forbidden due to Perchance iframe sandbox security boundaries.
   - All persistence must route exclusively through **Dexie.js (IndexedDB)** via `src/data/db.js` and `src/data/repository.js`. Reload-safe session checkpoints additionally fall back through `sessionStorage` → `window.name` in `src/engine/session.js`.

5. 📦 **Code Modification & Handover Protocol**
   - Output complete, production-ready code with exact relative target filepaths (`src/...`).
   - When delivering multiple file changes, organize them clearly with explicit file paths or package them in a single drop-in archive/structure for unzipping into the local repository root.
   - The developer locally verifies changes via `npm run verify` and compiles the single-file distribution bundle via `npm run deploy:prepare`.

6. 🤝 **Session Acknowledgment & Kickoff**
   - Confirm full comprehension of the engine architecture, layer boundaries, and state schemas.
   - State the active track or primary task before providing modified code.

---

## 🚀 2.0 Deployment Loop (`src/` ➔ Local Repo ➔ Perchance)

```text
[External AI Code Output] ➔ [Local Repo Unpack] ➔ [npm run deploy:prepare] ➔ [Perchance Generator]
```

- **Handoff & Build Path**:
  1. AI provides modified/created files with exact relative paths.
  2. Developer applies files into the local workspace.
  3. Developer executes `npm run deploy:prepare` locally (runs `sync` ➔ parallel `deploy:check` `[typecheck, lint, unit tests]` ➔ `build` in ~12s).
  4. Developer copies the compiled single-file bundle (`dist/index.html`) into the Perchance generator's code panel.

---

## 🏗️ 3.0 Subsystem & Directory Topography

```text
src/
├── App.svelte                # Root Svelte container component
├── main.js                   # Composition root & entry point (registers state bridges, then app_bootstrap.init())
├── index.html                # HTML host template & asset anchors
├── RPGlitch-left-panel.pjs   # Perchance iframe left-panel integration script
├── engine/                   # Physical logic, turn cycle execution & session orchestration
│   ├── boot.js                 # app_bootstrap — startup sequence, persistence hydration & asset pre-downloads
│   ├── chrono.svelte.js        # ChronoEngine (exported as chrono_engine) — simulation turn/round state machine
│   ├── session.js              # Session checkpointing helpers (save/load/clear) + reload-safe quiesce
│   ├── session.svelte.js       # session_driver — active session lifecycle & state manager
│   ├── transition-guard.js     # Stasis guard & UI lock validation
│   ├── config.js               # CONFIG / APP_VERSION / SESSION_ID_KEY — engine constants & clamp/log helpers
│   └── index.js                # @engine barrel
├── data/                    # Persistence layer, Dexie.js schemas, cards & entity repositories
│   ├── db.js                   # Dexie.js IndexedDB schema definitions & database instance
│   ├── repository.js           # Entity & session CRUD operations & query methods
│   ├── normalizer.js           # Entity schema sanitization, default assertions & detox rules
│   ├── cards.js                # Character Card V2/V3 codec & JSON export/import converter
│   ├── index.js                # @data barrel
│   └── definitions/            # Static authorial & visual engine definitions
│       ├── narrative-styles.js # XML authorial narrative engines & style presets
│       ├── visual-styles.js    # XML diffusion visual engines & parameters
│       ├── premades.js         # Pre-configured character & fractal entity templates
│       ├── protocols.js        # PROTOCOL_LIBRARY catalog (DIRECTOR, COGNITION, POV, EPISTEMIC_PHYSICS)
│       ├── fragments.js        # Entity taxonomy & field directives
│       └── detox-rules.js      # Prose detoxification rules
├── intelligence/           # Turn loop, XML prompt engineering & temporal RAG
│   ├── kernel.js               # gamemaster — 2-Shot simulation pipeline (Director Shot 1 ➔ Character Shot 2), fallback mutations
│   ├── prompts.js              # prompt_builder — deconstructed XML prompt assembly (render_character, render_director, render_protocols)
│   ├── context.svelte.js       # context_builder — context assembly, token budgeting & lexical filter
│   ├── temporal.js             # RAG vector scoring, memory forge consolidation, telemetry logging & future_consolidated standing agenda engine
│   ├── embeddings.svelte.js    # Semantic vector RAG embeddings via Transformers.js (main-thread WASM, numThreads = 1, onnx_mutex guarded)
│   ├── parser.js               # Pseudo-JSON extraction, <think> parsing, extract_immediate_intent, merge_prose_into_field
│   ├── dynamics.js             # Gravity settlement math & slider metadata
│   ├── telemetry.js            # Turn telemetry aggregation & snapshot logging
│   └── index.js                # @intelligence barrel
├── media/                  # Visual synthesis, visual parameters & audio TTS pipelines
│   ├── audio.svelte.js         # Audio / VoiceEngine — Kokoro-82M Neural TTS (wait_ort_ready 10s gate, onnx_mutex guarded) & Web AudioContext
│   ├── visual.svelte.js        # visual_engine — Visual Wing state & generated artwork gallery (F4 sweep watchdog)
│   ├── optics.js               # aesthetic_resolver / prompt_templates — Perchance T2I prompt builders & parameter resolver
│   ├── image-prompts.js        # System image prompt templates & parameter interpolators
│   ├── tokens.js               # Design tokens & color system bridge
│   ├── design.css              # Primary design styles & Tailwind CSS directives
│   └── index.js                # @media barrel
├── platform/               # External transport, security & iframe boundaries
│   ├── transport.js            # llm_service — core text/image generation & enhancement API handlers
│   ├── security.js             # security — DOMPurify sanitization & boundary input validation
│   └── index.js                # @platform barrel
├── state/                  # Centralized Svelte 5 Rune stores & reactive state
│   ├── app.svelte.js           # app — application configuration, view state & user preferences
│   ├── runtime.svelte.js       # runtime — active entity state, chronology & turn status (sync restores active session)
│   ├── status.svelte.js        # simulation_state — execution stasis phase & simulation lock (STASIS)
│   ├── log.svelte.js           # simulation_log — telemetry & diagnostic log state
│   └── index.js                # @state barrel
├── utils/                  # Shared utilities — safe for ANY layer to import via @utils
│   ├── bridges.js              # state_bridge / stream_bridge — cross-layer state access
│   ├── ui-helpers.js           # DOM & UI helper functions
│   ├── markdown.js             # Markdown rendering helpers
│   ├── xml.js                  # XML string building helpers
│   ├── physical-xml.js         # Physical-trait XML serialization
│   ├── crypto.js               # UUID & secure-seed generation
│   ├── field-path.js           # Nested field-path accessors
│   ├── text.js                 # Raw-prose fallback, text cleaning & strip_cognition_blocks
│   ├── resilience.js           # ExponentialBackoffRetryer / CircuitBreaker / onnx_mutex / wait_ort_ready
│   ├── story-export.js         # Story Markdown transcript exporter & compiler
│   ├── embedding-serialization.js # Vector embedding byte serialization helpers
│   └── index.js                # @utils barrel
└── ui/                     # Sensory UI layer (Atomic design structure)
    ├── Layout.svelte           # Top-level view: persistent app frame
    ├── Storymode.svelte        # Top-level view: Storymode shell
    ├── Storyboard.svelte       # Top-level view: Storyboard deck
    ├── Storyboard.svelte.js    # Storyboard component-sibling state module
    ├── actions.js              # Svelte DOM actions
    ├── index.js                # @ui barrel
    ├── console/                # Console module (ControlPanel, SettingsButton, DevControls, AudioControls)
    ├── story/                  # Story library module (StoryCard, StoryManager)
    ├── message/                # Message module (Message, Header, Body, Attachments, Feed, TelemetryCard)
    ├── entity/                 # Entity module (EntityCard, CardHand, ContextMenu, ImportModal)
    ├── profile/                # Profile module (Profile, Header, Vectors, VisualWing, AudioWing, DevWing)
    ├── image/                  # Image module (ImagePicker, ImagePreview, ProfilePicture)
    ├── primitives/             # Shared UI primitives (Button, Modal, Dialog, Slider, TextField, Toggle, etc.)
    └── motion/                 # Animation engines (Typewriter, kinetic, transitions)
```

---

## 🏛️ 4.0 Layer Boundaries & Unidirectional Hierarchy

Strict unidirectional import rules must be respected across all modules:

```text
src/ui ➔ src/state ➔ src/engine ➔ src/intelligence ➔ src/data ➔ src/platform
```

- **Downward imports only**: Upper layers may import from lower layers; lower layers **must never** import from upper layers.
- **`src/engine` boundary**: `src/engine/` must not import `src/state/` directly. Cross-layer state access routes strictly through `state_bridge` in `@utils`.
- **`@utils` sovereignty**: `src/utils/` contains pure helper modules safe for any layer to import.

---

## 🎨 5.0 Naming & Code Conventions (Enforced DDD Standards)

Treat naming violations as bugs; fix all consumers in the same change — **no backwards compatibility, no aliases**.

- **Folders & files**: `kebab-case` (`transition-guard.js`, `field-path.js`).
- **PascalCase ONLY for**: Svelte components (`.svelte` files) and JS classes (`ChronoEngine`, `VoiceEngine`, `ExponentialBackoffRetryer`).
- **snake_case for everything else**: variables, functions, instances, public methods, state runes, process state, save-schema keys, and DTO/persistence keys (`chrono_engine`, `app_bootstrap`, `security`, `aesthetic_resolver`, `prompt_templates`, `voice.load_model()`, `voice_id`, `message_id`, `non_physical`, `visual_style`).
- **Question-snake booleans**: `is_*` / `has_*` (`is_processing`, `is_concluded`, `is_snapshot`, `has_token`).
- **SCREAMING_SNAKE constants/globals**: `CONFIG`, `APP_VERSION`, `NEGATIVE_PROMPT`, `ENTITIES`.
- **Documented exceptions** (do NOT rename):
  - `Audio` singleton (PascalCase) — prevents collision with DOM `Audio` constructor.
  - External plugin API keys stay camelCase (`startWith`, `onChunk`, `onToken` in `transport.js`).

---

## 📋 6.0 Data Model, Temporal Engine & Memory Mechanics

### 6.1 State Quadrants & Profile Hygiene

Each simulation entity consists of 4 discrete temporal fragments:

1. **Eternal State** (`entity.eternal`)
   - `physical`: Immutable baseline physical traits and appearance.
   - `non_physical`: Core essence, archetype, personality, and philosophical invariants (capped at **1,500 characters** with tail deduplication via `merge_eternal_field()`).

2. **Present State** (`entity.present`)
   - `physical`: Active physical condition, attire, and situational state governed by Pseudo-JSON brackets (`[KEY: VALUE]`):
     - **Direct Overwrite**: `[SHIRT: sweater]` replaces `SHIRT` cleanly.
     - **Universal Atomic Clearing**: `[KEY: none]`, `[KEY: bare]`, `[KEY: naked]`, `[KEY: off]`, `[KEY: removed]`, `[KEY: disrobed]`, `[KEY: healed]`, `[KEY: cleared]`, `[KEY: normal]` deletes that specific key.
     - **Wildcard Purge**: `[CLOTHING: none]` purges all clothing keys atomically.
     - **Multi-Item Aggregation**: Repeated `[INVENTORY: ...]` / `[STASH: ...]` brackets merge into an aggregated array.
     - **Undress / Redress Lifecycle**: Undressing stashes garments in `[INVENTORY: ...]`; redressing reads items back from inventory without hallucination.
   - `non_physical`: Dynamic immediate physical scene state and active physical posture (capped at **3 concise segments** via `cap_present_prose()`).

3. **Past State (Memories)** (`entity.past`)
   - Vector array (`{ id, timestamp, content, type, emotional_weight, meta, _embedding }`) retrieved via vector RAG scored by `embeddings.svelte.js` and `temporal.js`.
   - **ID Provenance & Forge-Skip**: Memories with `usr_` prefix (user/lore authored) are origin-protected (`is_origin`), immune to Memory Forge eviction/compression, and receive a **1.5x relevance multiplier** in `compute_relevance()`.
   - **Session Vectors**: `ai_` session memories roll with a cap of 20 (`PAST_VECTOR_CAP = 20`).
   - **Hard Boundaries**: Maximum 200 total vectors per entity; <= 220 characters per entry. Deduplication uses > 60% word overlap and > 0.92 cosine similarity.

4. **Future State (Standing Agenda)** (`entity.future_consolidated`)
   - Single consolidated prose field representing the entity's active trajectory, impending intent, or environmental prophecy.
   - Rewritten **wholesale** by the Memory Forge on every consolidation cycle (every 8 turns), evolving post-climax into aftermath without FIFO vector eviction or ONNX embedding overhead.

---

### 6.2 Dual Filter Engine

- **Visual Prompt Filter**: `INVENTORY`, `STASH`, `SECRET`, `PLAN`, and `STATUS` are strictly stripped from image generation prompts (`build_aesthetic_map` & `strip_visual_excluded` in `optics.js`).
- **Epistemic Prompt Filter**: `[SECRET: ...]` and `[PLAN: ...]` of the User are stripped across the Epistemic Wall in `render_character()` to prevent AI telepathy, while remaining fully visible in `render_director()`.

---

### 6.3 Intelligence Kernel XML Prompt Schema

The prompt compiler (`src/intelligence/prompts.js`) separates static archetypes into `<SYSTEM>` and volatile turn dynamics into `<SNAPSHOT>`:

- **Static Identity (`<SYSTEM>`)**:
  - `<YOUR_IDENTITY>` / `<USER_PERSONA>`: `<PERSONALITY>` (`eternal.non_physical`), `<PERMANENT_APPEARANCE>` (`eternal.physical`).
  - `<FRACTAL>`: `<METAPHYSICAL_TRUTHS>` (`eternal.non_physical`), `<ENVIRONMENT>` (`eternal.physical`).

- **Volatile Dynamic Snapshot (`<SNAPSHOT>`)**:

  ```xml
  <SNAPSHOT>
    <YOUR_IDENTITY name="Orion" intensity="70" openness="40">
      <STATE_OF_MIND>Focused, pulse steady, analyzing movement ahead.</STATE_OF_MIND>
      <CURRENT_LOOK>[SHIRT: flight jacket] [EQUIPMENT: sidearm]</CURRENT_LOOK>
      <INTENT>Reach Sector 4 conduit without triggering alarms.</INTENT>
      <MEMORIES>[usr_1] Promised Beast we would reach Sector 4 together.</MEMORIES>
    </YOUR_IDENTITY>
    <USER_PERSONA name="Alex">
      <STATE_OF_MIND>Wary, observing the hallway corridor.</STATE_OF_MIND>
      <CURRENT_LOOK>[ARMOR: combat vest]</CURRENT_LOOK>
      <BACKSTORY>[usr_2] Docked transport at loading bay 3.</BACKSTORY>
    </USER_PERSONA>
    <FRACTAL name="Orbital Sub-Level" entropy="15">
      <CURRENT_STATE>Low vibration of cooling conduits, flickering halogen lights.</CURRENT_STATE>
      <ACTIVE_ATMOSPHERE>Cold, metallic mist rising along the bulkhead.</ACTIVE_ATMOSPHERE>
      <AGENDA>Automated security patrol cycling in 3 turns.</AGENDA>
      <HISTORY>Sector 2 blast doors sealed after explosive decompression.</HISTORY>
    </FRACTAL>
  </SNAPSHOT>
  ```

---

### 6.4 Data Portability & Card Codec

- **3-in-1 Import Modal** (`src/ui/entity/ImportModal.svelte`):
  - **Inbound Web URL Ingestion**: Proxy scraping via `superFetch` with schema and plain-text token budgeting.
  - **Standalone Entity JSON**: Native RPGlitch entity serialization and deserialization.
  - **Character Card V2/V3**: Full interoperability codec (`src/data/cards.js`) converting Tavern/Chub/Janitor character cards to and from RPGlitch entity schemas.
- **Story Export**: Compiles clean Markdown transcripts from the Story Library (`src/utils/story-export.js`).

---

## 🗺️ 7.0 Task Tracking & 2-File Temporal System

Maintain task planning and operational progress in the project root:

- **`tasks/PRESENT.md`**: Active mission board, Roadmap (Tracks), and durable Pulse (History Log).
- **`tasks/FUTURE.md`**: Implementation blueprint for the active track (Goal, Research, Audit, TDD, Steps).
- **Track Archival**: Completed track blueprints are archived exclusively in `archive/YYYY-MM/` (e.g., `archive/2026-08/2026-08-16-track-memory-bundle.md`).
