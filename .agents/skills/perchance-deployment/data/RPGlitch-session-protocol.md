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

5. 📦 **File Modifications & Handoff**
   - Whenever any codebase file is modified or created during a session, ensure changes are verified via `npm run verify`.
   - Provide complete updated files or trigger automated bridge deployments via `npm run deploy:auto`.

6. 🤝 **Session Acknowledgment & Kickoff**
   - Explicitly confirm full comprehension of the engine architecture, state schemas, and startup protocol.
   - Declare the active track or primary task before executing changes.

---

## 🚀 Deployment Loop (workspace ↔ repo ↔ Perchance)

- The workspace `src/` is the **source of truth** for live code; the repo mirrors it and performs the build.
- Ship path: sync workspace `src/` → repo → `npm run deploy:prepare` (runs `sync` → `deploy:check` = `lint:fix` + `deploy:audit` + `test:unit` → `build`) → copy the vaulted `dist/index.html` into the Perchance generator's `index.html` (the live shell).
- `npm run deploy` = `deploy:prepare` + `deploy:auto` (automated bridge push). `npm run verify` = `lint` + `audit` + `test` (full TDD gate).
- **After any edit, the shell `index.html` is hand-maintained** — always re-read it before touching; never rebuild it from scratch.

---

## 🏗️ Subsystem & Directory Topography

```
src/
├── App.svelte                # Root Svelte container component
├── main.js                   # Composition root & entry point (registers state bridges, then app_bootstrap.init())
├── index.html                # HTML host template & asset anchors
├── RPGlitch-left-panel.pjs   # Perchance iframe left-panel integration script (kept by decision)
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
│   └── definitions/            # Static authorial & visual engine definitions (previously "presets/")
│       ├── narrative-styles.js # XML authorial narrative engines & style presets
│       ├── visual-styles.js    # XML diffusion visual engines & parameters
│       ├── premades.js         # Pre-configured character & fractal entity templates
│       ├── protocols.js        # Entity protocol & directive definitions
│       ├── fragments.js        # Entity taxonomy & field directives
│       └── detox-rules.js      # Prose detoxification rules
├── intelligence/           # Turn loop, XML prompt engineering & temporal RAG
│   ├── kernel.js               # gamemaster — synchronous Round & Turn simulation pipeline
│   ├── prompts.js              # prompt_builder / render_builder — XML prompt assembly (Character, Director, Narrator, Enhancement)
│   ├── context.svelte.js       # context_builder — context assembly, token budgeting & lexical filter
│   ├── temporal.js             # Past/Future vector scoring, memory consolidation & forging
│   ├── embeddings.svelte.js    # Semantic vector RAG embeddings via Transformers.js
│   ├── parser.js               # Pseudo-JSON extraction, <think> stripping, merge_prose_into_field
│   ├── dynamics.js             # Gravity settlement math & slider metadata
│   └── index.js                # @intelligence barrel
├── media/                  # Visual synthesis, visual parameters & audio TTS pipelines
│   ├── audio.svelte.js         # Audio / VoiceEngine — Kokoro-82M Neural TTS (voice.load_model()) & Web AudioContext
│   ├── visual.svelte.js        # visual_engine — Visual Wing state & generated artwork gallery
│   ├── optics.js               # aesthetic_resolver / prompt_templates — Perchance T2I prompt builders & parameter resolver
│   ├── tokens.js               # Design tokens & color system bridge
│   ├── design.css              # Primary design styles & Tailwind CSS directives
│   ├── resilience.js           # ExponentialBackoffRetryer / CircuitBreaker — media error handling & fallbacks
│   └── index.js                # @media barrel
├── platform/               # External transport, security & iframe boundaries
│   ├── transport.js            # llm_service — core text/image generation & enhancement API handlers
│   ├── security.js             # security — DOMPurify sanitization & boundary input validation
│   └── index.js                # @platform barrel
├── state/                  # Centralized Svelte 5 Rune stores & reactive state
│   ├── app.svelte.js           # app — application configuration, view state & user preferences
│   ├── runtime.svelte.js       # runtime — active entity state, chronology & turn status
│   ├── status.svelte.js        # simulation_state — execution stasis phase & simulation lock (STASIS)
│   ├── log.svelte.js           # simulation_log — telemetry & diagnostic log state
│   └── index.js                # @state barrel
├── utils/                  # Shared utilities — safe for ANY layer to import via @utils
│   ├── bridges.js              # state_bridge / stream_bridge — cross-layer state access (engine reads state without importing @state)
│   ├── ui-helpers.js           # DOM & UI helper functions
│   ├── markdown.js             # Markdown rendering helpers
│   ├── xml.js                  # XML string building helpers
│   ├── physical-xml.js         # Physical-trait XML serialization
│   ├── crypto.js               # UUID & secure-seed generation
│   ├── field-path.js           # Nested field-path accessors
│   ├── text.js                 # Raw-prose fallback & text cleaning
│   ├── vectors.js              # Vector helpers
│   ├── use-actions.js          # Svelte DOM actions (moved from ui/actions)
│   └── index.js                # @utils barrel
└── ui/                     # Sensory UI layer (feature modules + shared primitives)
    ├── shell/                  # App shell & top-level views (Layout, Storymode, Storyboard)
    ├── console/                # Console module (Console, InputBar, AudioControls, DevControls)
    ├── story/                  # Story library module (StoryCard, StoryManager)
    ├── message/                # Message module (Message, Header, Body, Feed, UndoToast, TelemetryCard, TelemetryBlocks, TelemetryVector)
    ├── entity/                 # Entity module (EntityCard, EntityCardHand, ImportModal)
    ├── profile/                # Profile module (Profile, Header, Vectors, VisualWing, AudioWing, DevWing)
    ├── image/                  # Image module (ImagePicker, ImagePreview, ProfilePicture)
    ├── primitives/             # Shared primitives (Accordion, Backdrop, Button, DataBox, Dialog, Dropdown, GlassWrapper, Label, Meter, Modal, NumberField, ProgressBar, ScrollArea, Skeleton, Slider, StyleBadge, TextField, Toggle, Tooltip)
    └── motion/                 # Animation engines (Typewriter, kinetic, engine)
```

> Note: component-sibling `.svelte.js` state modules keep the component's PascalCase filename (`Profile.svelte.js`, `ImagePicker.svelte.js`, `EntityCardContextMenu.svelte.js`, `Typewriter.svelte.js`) — they mirror their component and are NOT renamed.

---

## 🎨 Naming & Code Conventions (enforced — DDD compliance)

The codebase enforces a strict, fully-audited naming discipline. Treat violations as bugs; fix all consumers in the same change — **no backwards compatibility, no aliases**.

- **Folders & files**: `kebab-case` (`transition-guard.js`, `field-path.js`).
- **PascalCase ONLY for**: Svelte components (`.svelte` files) and JS classes (e.g. `ChronoEngine`, `VoiceEngine`, `ExponentialBackoffRetryer`).
- **snake_case for everything else**: variables, functions, instances, public methods, state, process state, save-schema keys, DTO/persistence keys (`chrono_engine`, `app_bootstrap`, `security`, `aesthetic_resolver`, `prompt_templates`, `voice.load_model()`, `voice_id`, `message_id`, `non_physical`, `visual_style`).
- **Question-snake booleans**: `is_*` / `has_*` (`is_processing`, `voice_suppressed`, `is_concluded`, `is_snapshot`).
- **SCREAMING_SNAKE constants/globals**: `CONFIG`, `APP_VERSION`, `NEGATIVE_PROMPT`, `ENTITIES`.
- **Documented exceptions** (do NOT rename):
  - `Audio` singleton (PascalCase) — collides with the DOM `Audio` constructor and local `audio` variables.
  - External plugin/API passthrough keys stay camelCase: `startWith`, `onChunk`, `onToken` in `platform/transport.js` (ai-text-plugin contract).
  - Native API mocks keep native names (e.g. `File.arrayBuffer()` in tests).
- **Import hygiene**: layers import downward only — `@engine` must not import `@state` (uses `state_bridge`/`stream_bridge` from `@utils` instead). Access imported plugins through `root` in browser code.

---

## 📋 Data Model & Temporal Taxonomy

### 1. State Quadrants

- **Eternal & Present State** (Single-value properties: `state.eternal`, `state.present`)
  - `physical`: Pseudo-JSON key-value pairs (sanitized via `normalizer.js`).
  - `non_physical`: Dynamic prose paragraphs (Director mutations merged via `merge_prose_into_field` in `intelligence/parser.js`, capped at 2,000 characters).
- **Past & Future State** (Vector arrays)
  - Array of vector objects (`{ id, timestamp, content, type, emotional_weight, meta, _embedding }`).
  - Managed by `temporal.js`, scored via semantic RAG (`embeddings.svelte.js`), and resolved from Future → Past during Director settlement ticks.

### 2. Entity Optics & Taxonomy

- **`visual_style`**: Controls diffusion prompt synthesis for character cards and story visuals via `optics.js`.
- **`pov`**: Defines narrative perspective (`"1st_person"` or `"3rd_person"` for Characters; forced `"3rd_person"` for Fractals).
- **Entity Classification**:
  - `character`: User Persona (human protagonist) or AI Character (agent-controlled entity).
  - `fractal`: Environmental, geographic, or spatial world entity.
