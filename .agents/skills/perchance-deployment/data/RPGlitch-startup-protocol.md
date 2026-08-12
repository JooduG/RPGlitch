# RPGlitch — Session Protocol & Handover Specification

> **System Designation**: Sovereign AI Roleplay Engine
> **Core Architecture**: Svelte 5 Runes + Vite 8 (Single-File Distribution)
> **Target Deployment**: Perchance (`perchance.org`)
> **Source Repository**: `JooduG/RPGlitch`

---

## ⚡ Initial Setup & Execution Protocol

Execute these steps in strict chronological sequence upon session initialization:

1. 📥 **Synchronize Repository State**
   - Fetch or clone the latest `main` branch state from `https://github.com/JooduG/RPGlitch`.
   - Ensure local workspace mirrors the active repository state.

2. 📜 **Audit Workspace & Shell State**
   - Review `GEMINI.md`, `DESIGN.md`, `package.json`, and `README.md` for active conventions and script targets.
   - **Critical Shell Constraint**: Re-read `index.html` in the root prior to making edits. Shell markup/script updates occur between sessions — preserve all existing custom wrappers and script imports.

3. 🛡️ **Svelte 5 Sovereignty (Non-Negotiable)**
   - Utilize Svelte 5 **Runes exclusively** (`$state()`, `$derived()`, `$effect()`, `{@render snippet}`).
   - Legacy Svelte 4 primitives (`export let`, `$:`, `writable()`, `readable()`, `<slot />`) are strictly forbidden.

4. 💾 **Local-First Storage & Persistence Boundary**
   - Usage of `localStorage` is forbidden due to Perchance iframe sandbox security boundaries.
   - All persistence must route exclusively through **Dexie.js (IndexedDB)** via `src/data/db.js` and `src/data/repository.js`. Reload-safe session checkpoints additionally fall back through `sessionStorage` → `window.name` in `src/engine/session.js`.

5. 📦 **File Modifications & Handoff (Zip Archive Boundary)**
   - Whenever any codebase file is modified or created during an AI session, the AI agent **MUST provide all modified/created files packaged in a single ZIP archive** (or exact relative file structures).
   - The user unzips the archive into the root of this local repository.
   - The user executes `npm run deploy:prepare` locally to trigger quality gates and compile the single-file production bundle (`dist/index.html`).
   - The user manually pastes/forwards the compiled `dist/index.html` bundle into the live Perchance generator.

6. 🤝 **Session Acknowledgment & Kickoff**
   - Explicitly confirm full comprehension of the engine architecture, state schemas, and startup protocol.
   - Declare the active track or primary task before executing changes.

---

## 🚀 Deployment Loop (workspace ↔ repo ↔ Perchance)

- The workspace `src/` is the **source of truth** for live code; the repo mirrors it and performs the build.
- **Handoff & Build Path**: AI provides modified files in a ZIP archive ➔ User unzips in repo root ➔ User executes `npm run deploy:prepare` (executes `sync` → parallel `deploy:check` → `build` in ~12s) ➔ User copies the vaulted `dist/index.html` bundle into the Perchance generator's code panel.
- **After any edit, the shell `index.html` is hand-maintained** — always re-read it before touching; never rebuild it from scratch.

---

## 🏗️ Subsystem & Directory Topography

```
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
├── data/                    # Persistence layer, Dexie.js schemas & entity repositories
│   ├── db.js                   # Dexie.js IndexedDB schema definitions & database instance
│   ├── repository.js           # Entity & session CRUD operations & query methods
│   ├── normalizer.js           # Entity schema sanitization, default assertions & detox rules
│   ├── index.js                # @data barrel
│   └── definitions/            # Static authorial & visual engine definitions
│       ├── narrative-styles.js # XML authorial narrative engines & style presets
│       ├── visual-styles.js    # XML diffusion visual engines & parameters
│       ├── premades.js         # Pre-configured character & fractal entity templates
│       ├── protocols.js        # PROTOCOL_LIBRARY catalog (DIRECTOR, COGNITION, POV, EPISTEMIC_PHYSICS)
│       ├── fragments.js        # Entity taxonomy & field directives
│       └── detox-rules.js      # Prose detoxification rules
├── intelligence/           # Turn loop, XML prompt engineering & temporal RAG
│   ├── kernel.js               # gamemaster — 2-Shot simulation pipeline (Director Shot 1 ➔ Character Shot 2), fallback mutations, 1-turn intent extraction
│   ├── prompts.js              # prompt_builder — deconstructed XML prompt assembly (render_character, render_director, render_protocols)
│   ├── context.svelte.js       # context_builder — context assembly, token budgeting & lexical filter
│   ├── temporal.js             # RAG vector scoring, memory forge consolidation, telemetry logging & future_consolidated standing agenda engine
│   ├── embeddings.svelte.js    # Semantic vector RAG embeddings via Transformers.js (main-thread WASM, numThreads = 1, onnx_mutex guarded)
│   ├── parser.js               # Pseudo-JSON extraction, <think> parsing, extract_immediate_intent, merge_prose_into_field
│   ├── dynamics.js             # Gravity settlement math & slider metadata
│   └── index.js                # @intelligence barrel
├── media/                  # Visual synthesis, visual parameters & audio TTS pipelines
│   ├── audio.svelte.js         # Audio / VoiceEngine — Kokoro-82M Neural TTS (wait_ort_ready 10s gate, onnx_mutex guarded) & Web AudioContext
│   ├── visual.svelte.js        # visual_engine — Visual Wing state & generated artwork gallery (F4 sweep watchdog)
│   ├── optics.js               # aesthetic_resolver / prompt_templates — Perchance T2I prompt builders & parameter resolver
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
│   ├── vectors.js              # Vector helpers
│   └── index.js                # @utils barrel
└── ui/                     # Sensory UI layer (top-level views + feature modules + shared primitives)
    ├── Layout.svelte           # Top-level view: persistent app frame
    ├── Storymode.svelte        # Top-level view: Storymode shell
    ├── Storyboard.svelte       # Top-level view: Storyboard deck
    ├── Storyboard.svelte.js    # Component-sibling state module
    ├── actions.js              # Svelte DOM actions
    ├── index.js                # @ui barrel
    ├── console/                # Console module (ControlPanel, SettingsButton, DevControls, AudioControls)
    ├── story/                  # Story library module (StoryCard, StoryManager)
    ├── message/                # Message module (Message, Header, Body, Attachments, Feed, TelemetryCard)
    ├── entity/                 # Entity module (EntityCard, CardHand, ContextMenu, ImportModal)
    ├── profile/                # Profile module (Profile, Header, Vectors, VisualWing, AudioWing, DevWing)
    ├── image/                  # Image module (ImagePicker, ImagePreview, ProfilePicture)
    ├── primitives/             # Shared primitives (Button, Modal, Dialog, Slider, TextField, Toggle, etc.)
    └── motion/                 # Animation engines (Typewriter, kinetic, engine)
```

---

## 🎨 Naming & Code Conventions (enforced — DDD compliance)

The codebase enforces a strict, fully-audited naming discipline. Treat violations as bugs; fix all consumers in the same change — **no backwards compatibility, no aliases**.

- **Folders & files**: `kebab-case` (`transition-guard.js`, `field-path.js`).
- **PascalCase ONLY for**: Svelte components (`.svelte` files) and JS classes (e.g. `ChronoEngine`, `VoiceEngine`, `ExponentialBackoffRetryer`).
- **snake_case for everything else**: variables, functions, instances, public methods, state, process state, save-schema keys, DTO/persistence keys (`chrono_engine`, `app_bootstrap`, `security`, `aesthetic_resolver`, `prompt_templates`, `voice.load_model()`, `voice_id`, `message_id`, `non_physical`, `visual_style`).
- **Question-snake booleans**: `is_*` / `has_*` (`is_processing`, `voice_suppressed`, `is_concluded`, `is_snapshot`).
- **SCREAMING_SNAKE constants/globals**: `CONFIG`, `APP_VERSION`, `NEGATIVE_PROMPT`, `ENTITIES`.
- **Documented exceptions** (do NOT rename):
  - `Audio` singleton (PascalCase) — collides with DOM `Audio` constructor.
  - External plugin API keys stay camelCase (`startWith`, `onChunk`, `onToken` in `transport.js`).
- **Import hygiene**: layers import downward only — `@engine` must not import `@state` (uses `state_bridge` from `@utils`).

---

## 📋 Data Model, Temporal Engine & Memory Mechanics

### 1. State Quadrants & Profile Hygiene

- **Eternal & Present State** (`entity.eternal`, `entity.present`)
  - `physical`: Sanitized pseudo-JSON key-value pairs (`normalizer.js`).
  - `non_physical`: Dynamic prose paragraphs.
    - `ETERNAL`: Capped at **1,500 characters** with tail deduplication via `merge_eternal_field()`.
    - `PRESENT`: Capped at **3 concise segments** via `cap_present_prose()`.
- **Past State** (`entity.past`)
  - Vector array (`{ id, timestamp, content, type, emotional_weight, meta, _embedding }`).
  - Scored via semantic RAG (`embeddings.svelte.js`). High-threshold selectivity enforced for Fractal past vectors (major facility destructions only).
- **Future State / Standing Agenda** (`entity.future_consolidated`)
  - Single consolidated prose field representing the entity's active trajectory, impending intent, or environmental prophecy.
  - Rewritten **wholesale** by the Memory Forge on every consolidation cycle (every 8 turns), evolving post-climax into aftermath. Eliminates FIFO vector eviction and ONNX embedding overhead.

### 2. 1-Turn Immediate Intent Carryover

- **Extraction**: On Turn N, `extract_immediate_intent(think_text)` extracts the 1-sentence physical/vocal beat line from the character's `<think>` block.
- **Runtime Attachment**: Attached to `state_bridge.runtime.active_ai.immediate_intent`.
- **Snapshot Injection**: Injected inside `<SNAPSHOT>` in Turn N+1's prompt:

  ```xml
  <YOUR_IDENTITY name="Orion" intensity="70">
    <PRESENT>Standing in Sector 4 conduit corridor.</PRESENT>
    <IMMEDIATE_INTENT>Challenge his pride with a smirk, lean against the doorframe, hand near sidearm.</IMMEDIATE_INTENT>
    <PAST>Promised Beast we would reach Sector 4 together.</PAST>
  </YOUR_IDENTITY>
  ```

- **1-Turn TTL**: Replaced on Turn N+2 (1-turn lifespan), ensuring physical body language momentum without storage bloat or thought-anchoring.
