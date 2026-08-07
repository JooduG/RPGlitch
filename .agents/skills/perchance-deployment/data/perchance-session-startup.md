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
   - All persistence must route exclusively through **Dexie.js (IndexedDB)** via `src/data/db.js` and `src/data/repository.js`.

5. 📦 **File Modifications & Handoff**
   - Whenever any codebase file is modified or created during a session, ensure changes are verified via `npm run verify`.
   - Provide complete updated files or trigger automated bridge deployments via `npm run deploy:auto`.

6. 🤝 **Session Acknowledgment & Kickoff**
   - Explicitly confirm full comprehension of the engine architecture, state schemas, and startup protocol.
   - Declare the active track or primary task before executing changes.

---

## 🏗️ Subsystem & Directory Topography

```
src/
├── App.svelte              # Root Svelte container component
├── main.js                 # Application entry point & mounting logic
├── app.svelte.js           # Global application state bridge
├── index.html              # HTML host template & asset anchors
├── RPGlitch-left-panel.pjs # Perchance iframe left-panel integration script
├── engine/                 # Physical logic, turn cycle execution & session orchestration
│   ├── boot.js               # Application startup sequence & persistence hydration
│   ├── chrono.svelte.js      # Simulation turn & round macro/micro state tracker
│   ├── session.svelte.js     # Active session lifecycle & state manager
│   ├── transition-guard.js   # Stasis guard & UI lock validation
│   ├── helpers.js            # Engine mathematical & timing utilities
│   ├── config.js             # Simulation engine constants & configuration
│   └── session-checkpoint.js # Auto-save & session checkpointing engine
├── data/                   # Persistence layer, Dexie.js schemas & entity repositories
│   ├── db.js                 # Dexie.js IndexedDB schema definitions & database instance
│   ├── repository.js         # Entity & session CRUD operations & query methods
│   ├── normalizer.js         # Entity schema sanitization & default assertions
│   └── presets/              # Static authorial & visual engine definitions
│       ├── narrative-styles.js # XML authorial narrative engines & style presets
│       ├── visual-styles.js    # XML diffusion visual engines & parameters
│       └── premades.js         # Pre-configured character & fractal entity templates
├── intelligence/           # Turn loop, XML prompt engineering & temporal RAG
│   ├── kernel.js             # Synchronous Round & Turn simulation pipeline
│   ├── prompts.js            # XML prompt assembly (Character, Director, Narrator, Enhancement)
│   ├── context.svelte.js     # Context broker, token budgeting & lexical filter
│   ├── temporal.js           # Past/Future vector scoring, memory consolidation & forging
│   ├── embeddings.svelte.js  # Semantic vector RAG embeddings via Transformers.js
│   ├── parser.js             # Pseudo-JSON extraction, <think> block stripping & prose merging
│   ├── dynamics.js           # Gravity settlement math & slider metadata
│   ├── fragments.js          # Entity taxonomy & field directives
│   └── normalizer.js         # Intelligence payload normalizer
├── media/                  # Visual synthesis, visual parameters & audio TTS pipelines
│   ├── audio.svelte.js       # Kokoro-82M Neural TTS & Web AudioContext management
│   ├── visual.svelte.js      # Visual Wing state & generated artwork gallery
│   ├── optics.js             # Perchance T2I system prompt builder & parameter resolver
│   ├── tokens.js             # Design tokens & color system bridge
│   ├── design.css            # Primary design styles & Tailwind CSS directives
│   └── resilience.js         # Media error handling & audio fallback bounds
├── platform/               # External transport, security & iframe boundaries
│   ├── transport.js          # Core text/image generation & enhancement API handlers
│   └── security.js           # DOMPurify sanitization & boundary input validation
├── state/                  # Centralized Svelte 5 Rune stores & reactive state
│   ├── app.svelte.js         # Application configuration, view state & user preferences
│   ├── runtime.svelte.js     # Active entity state, chronology & turn status
│   ├── status.svelte.js      # Execution stasis phase & simulation lock (STASIS)
│   └── log.svelte.js         # Telemetry & diagnostic log state
└── ui/                     # Sensory UI layer (Atomic Design Structure)
    ├── organisms/            # Complex views (CardHand, Layout, Message, Profile, ProfileArray, ProfileHeader, Storyboard, Storymode, UnifiedConsole)
    ├── molecules/            # Composite components (AudioWing, DevTelemetryBlock, DevWing, Dialog, EntityCard, ImagePreview, ImageRegenerate, ImportModal, StoryCard, VisualWing)
    ├── atoms/                # Primitive controls (Accordion, Backdrop, Button, DataBox, Dropdown, GlassWrapper, Label, Meter, Modal, NumberField, ProfilePicture, ProgressBar, ScrollArea, Skeleton, Slider, StyleBadge, TextField, Toggle, Tooltip)
    ├── motion/               # Animation engines (Typewriter, FitText, kinetic, engine)
    ├── actions/              # Svelte DOM actions (click-outside, resize, safe-html, use-actions)
    └── utils/                # UI helper scripts (protocols, ui-helpers, markdown, xml, crypto, field-path, state-bridge, stream-bridge, text, vectors)
```

---

## 📋 Data Model & Temporal Taxonomy

### 1. State Quadrants

- **Eternal & Present State** (Single-value properties: `state.eternal`, `state.present`)
  - `physical`: Pseudo-JSON key-value pairs (sanitized via `normalizer.js`).
  - `non_physical`: Dynamic prose paragraphs (Director mutations merged via `merge_prose_into_field`, capped at 2,000 characters).
- **Past & Future State** (Vector arrays)
  - Array of vector objects (`{ id, timestamp, content, type, emotional_weight, meta }`).
  - Managed by `temporal.js`, scored via semantic RAG (`embeddings.svelte.js`), and resolved from Future → Past during Director settlement ticks.

### 2. Entity Optics & Taxonomy

- **`visual_style`**: Controls diffusion prompt synthesis for character cards and story visuals via `optics.js`.
- **`pov`**: Defines narrative perspective (`"1st_person"` or `"3rd_person"` for Characters; forced `"3rd_person"` for Fractals).
- **Entity Classification**:
  - `character`: User Persona (human protagonist) or AI Character (agent-controlled entity).
  - `fractal`: Environmental, geographic, or spatial world entity.

---

## 🛠️ Verification & Quality Gate

Before declaring work complete or deploying to production, execute local verification:

- 🧪 **Static Analysis & Verification**: Run `npm run verify` to validate JS, CSS, MD linting, project audits, and unit tests.
- 🎨 **Design Token Synchronization**: Run `npm run sync` to reconcile CSS variables in `DESIGN.md` and ignore rules.
- 📦 **Bundle Integrity**: Validate single-file Vite compilation via `npm run build`.
- 🚀 **Pre-Flight Quality Gate**: Run `npm run deploy:prepare` to execute full pre-flight quality verification (sync + checks + tests + build).
- 🌉 **Production Deployment**: Run `npm run deploy:auto` to deploy the single-file production bundle directly to Perchance via Playwright.
