# BOOM: Operation Ground-Up Simplification

## 1. Must Survive (The Core Jewels)

- **Pseudo-JSON Brackets**: Fast, reliable bracket mutations (`[KEY: VALUE]`).
- **Quad-Partitioned Entities**: `ETERNAL`, `PRESENT`, `PAST`, and `FUTURE`.
- **The Two-Step Dance**: `User (Turn 3)` → `Director (Turn 1)` → `Actor (Turn 2)`.
- **Director's Staging & Cognition Seeding**: Director's note seeded directly into the Actor's opening `<think>` tag.

---

## 2. Redesigning Clunky Implementations (The Elegance Upgrade)

### A. Epistemic Isolation & `| hide` (Replacing Clunky Veil Filters)

- **The Problem**: Right now, `veil.js` and `profile.js` do messy multi-pass regex scanning to detect `| hide` flags, stripping keys and leaving broken pseudo-JSON chunks.
- **The Elegant Fix**:
  - Store entity state cleanly as either **Public** (shared physical reality) or **Private/Inner** (thoughts, hidden pockets, private motives).
  - Instead of parsing `| hide` strings inside text values on every single prompt compilation, the entity state simply partitions into:
    - `public`: visible to all characters.
    - `private`: visible ONLY to the owner and the Director (never the opposing actor).
  - When rendering an entity for a speaker, it's a one-line object filter:
    `const visible_state = (viewer === owner || viewer === 'director') ? { ...entity.public, ...entity.private } : entity.public;`
  - Zero regex acrobatics, zero telepathy, instant evaluation.

### B. Keywords & Subtext Injection (Replacing the 40 KB Protocol Registry)

- **The Problem**: Currently, `protocols.js` (40 KB) and `reflex.js` (46 KB) define dozens of static XML protocol atoms. The Director outputs keywords, which run through heavy lookup tables to inject giant static `<SHAME>`, `<TENSION>`, or `<COLD>` blocks into the prompt.
- **The Elegant Fix**:
  - The Director shouldn't just pick rigid pre-canned keywords from a rigid enum dictionary; the Director emits dynamic, contextual staging guidance:

    ```json
    {
      "next_speaker": "ai",
      "somatic_tension": "cold, shivers, breath misting in the alley",
      "director_note": "She realizes he's lying about the key. Don't confront him outright; test his reaction."
    }
    ```

  - We inject this directly into the Actor prompt as:
    `<staging subtext="${director.somatic_tension}">${director.director_note}</staging>`
  - No massive protocol dictionaries, no XML atom compilation, no hardcoded keywords to keep in sync. It is fluid, intelligent, and uses 95% less code.

---

## 3. Demolition Targets (Files to Completely Delete)

We are eliminating **32 bloated files** (~450+ KB of over-engineered indirection):

### The `modules/` Sprawl (DELETE ENTIRE FOLDER: 20 files)

- `src/intelligence/modules/constitution.js` & `.test.js`
- `src/intelligence/modules/entities.js` & `.test.js`
- `src/intelligence/modules/output.js` & `.test.js`
- `src/intelligence/modules/protocols.js` & `.test.js`
- `src/intelligence/modules/recency.js` & `.test.js`
- `src/intelligence/modules/reflex.js` & `.test.js`
- `src/intelligence/modules/sheets.js` & `.test.js`
- `src/intelligence/modules/style.js` & `.test.js`
- `src/intelligence/modules/system.js` & `.test.js`
- `src/intelligence/modules/task.js` & `.test.js`

### Over-Engineered Builders & Verifiers (DELETE: 6 files)

- `src/intelligence/builder.js` & `builder.test.js` (58 KB of atom assembly bloat)
- `src/intelligence/prompts.js` & `prompts.test.js` (37 KB catalog bloat)
- `src/intelligence/prompt-verification.js` & `.test.js` (28 KB defensive bloat)

### Fragmented Parsers & Helpers (DELETE: 6 files)

- `src/intelligence/veil.js` & `veil.test.js` (replaced by clean state partitioning)
- `src/intelligence/profile.js` & `profile.test.js` (merged into single state formatter)
- `src/intelligence/dynamics.js` & `dynamics.test.js` (merged into director)

### Data Definitions Purge (DELETE / SLIM: 5 files)

- `src/data/definitions/speaking-styles.js` & `.test.js` (**DELETE ENTIRELY** - replace 1,200 lines of regex with prompt-level anti-cliché directives)
- `src/data/definitions/narrative-styles.js` (**PURGE** - prune all styles down to 2 canonical presets: e.g. Gritty & Cinematic, deleting 800+ lines of DNA bloat)
- `src/data/definitions/visual-styles.js` (**PURGE** - prune diffusion styles down to 2 essential presets, deleting unused visual configs)
- `src/data/definitions/profile-fields.js` (**STREAMLINE** - strip out unused AI prompt directives, enhancer enums, and over-engineered metadata leaves; keep clean UI labels and canonical 4-quadrant field paths)
- `src/data/definitions/premade-entities.js` (**KEEP AS-IS** - valid test & starter assets)

### Data & Persistence Consolidation (`src/data/`)

Prune definitions bloat and collapse repository layers into **3 clean files**:

- **Consolidate Schemas & Persistence**: Merge `repository.js`, `sessions.svelte.js`, `ledger.js`, and `normalizer.js` directly into `src/data/db.js` with pure Dexie operations.
- **Quad-Partitioned Entities (`src/data/entities.js`)**: Canonical 4-quadrant schema (`ETERNAL`, `PRESENT`, `PAST`, `FUTURE`) with one-line public/private epistemic isolation. Delete `profile-fields.js` and `card-conversion.js`.
- **Presets & Starters (`src/data/presets.js`)**: 2 canonical narrative presets (Gritty & Cinematic) and starter entity cards. Completely purge `speaking-styles.js` (1,200 lines of regex), `narrative-styles.js`, and `visual-styles.js`.

### Media Layer Consolidation (`src/media/` - Governed by Design Skill)

Audio, visual synthesis, and kinetic motion live together as the sensory cortex (**3 clean files**):

- **`audio.svelte.js`**: Web Audio SFX and speech synthesis. Delete standalone `speech.js` (pruning the 1,248-line ONNX/Kokoro monster).
- **`visual.svelte.js`**: Lean Perchance `generate_image` caller with clean prompts. Delete `optics.js`.
- **`motion.js`**: Unified kinetic physics, spring transitions, and card flight math. Absorbs `transitions.svelte.js`, `engine.svelte.js`, `kinetic.svelte.js`, and `card-flight.svelte.js`.
- **Styling Root**: `design.css` lives at root `src/design.css`, retaining tokens and glassmorphism.

### State & Platform Consolidation (`src/state/` & `src/platform/` -> `src/engine/`)

Eliminate the split-brain architecture across 5 stores and bridge registries into **`src/engine/`**:

- **Authoritative Kernel (`src/engine/simulation.svelte.js`)**: Single Svelte 5 state class owning active entities (`user`, `ai`, `fractal`), `round`, `phase` (`idle`, `generating`), and turn dispatch. Purges `chrono.svelte.js`, `status.svelte.js`, `runtime.svelte.js`, `interface.svelte.js`, and `freeze-watchdog`.
- **The Two-Step Heartbeat (`src/engine/turns.js`)**: Coordinates Director turn (staging JSON) and Storyteller turn (sensory prose).
- **The 2 Canonical Prompts (`src/engine/prompts.js`)**: Replaces all 9 legacy prompt modes and 20 atom catalog files with 2 clean template functions.
- **Bracket Parser (`src/engine/parser.js`)**: Clean pseudo-JSON parser (`[KEY: VALUE]`), diff applier, and `<think>` stripper.
- **Transport Gatekeeper (`src/engine/transport.js`)**: Perchance LLM streaming (`onChunk`), stop sequence enforcement, and priority queuing. Merges `llm-gate.js`.
- **Telemetry HUD (`src/engine/log.svelte.js`)**: Event log and telemetry feed.
- **Deletions**: Purge `web-fetch.js`, `security.js` (moved to `utils/format.js`), and `embeddings.svelte.js`.

### System Configuration Slimming (`src/config.js`)

- **Purge Pseudo-Physics**: Delete `DYNAMICS_SCALE`, `GRAVITY_RATE` (0.08 orbital tension drift), `SEISMIC_SHIFT_DISPLACEMENT`, and artificial `LATENCY_TIERS_MS`.
- **Retain Honest Hardware Literals**: Reduce 272 lines down to ~30 lines of real physical limits (`PROMPT_CHAR_LIMIT = 20000`, `CHARS_PER_TOKEN = 3.35`, `MAX_ACTIVE_MEMORIES = 20`, `LLM_TIMEOUT_MS = 60000`).

### Utils Layer Pruning (`src/utils/`)

The catch-all junk drawer is pruned down to **2 clean utility files**:

- **Delete Indirection & Bloat**: Delete `bridges.js`, `catalog.js`, `detox.js`, `styles.js`, `job-queue.js`, `xml.js`, `field-path.js`, and `ui-helpers.js`.
- **`format.js`**: Dialogue quote wrapping, markdown-it rendering, DOMPurify HTML sanitization, and Markdown story export.
- **`actions.js`**: Pure Svelte DOM actions (`click_outside`, `auto_resize`, `safe_html`).

### UI Layer Complete Flattening (`src/ui/`)

Flatten all 8 fragmented UI subfolders (`console/`, `entity/`, `image/`, `message/`, `motion/`, `primitives/`, `profile/`, `story/`) with zero subdirectories into **11 pure Svelte 5 domain components**:

- **Delete 22 Fake Wrapper Primitives**: Remove empty wrappers (`GlassWrapper`, `Backdrop`, `Label`, `Indicator`, `ScrollArea`, `DevControls`, `AudioControls`). Use native HTML5 semantic elements + CSS.
- **Merge Micro-Components**:
  - Merge message subcomponents (`Body`, `MessageHeader`, `Attachments`, `Prologue`, `Epilogue`, `TelemetryBlocks`) directly into `MessageCard.svelte` using Svelte 5 snippets.
  - Merge profile subcomponents (14 files, 170 KB including SVG graph math) into a single dual-mode `EntityProfile.svelte` (Readonly Dossier + Edit 4-quadrant mode).
  - Merge console bars into `Storyboard.svelte` and `Storymode.svelte`.
  - Merge story cards into `StoryDrawer.svelte`.
- **Retain Only Genuine Complex Primitives**: `Modal.svelte` (dialog focus trap) and `Slider.svelte` (accessible range). All other elements are standard semantic HTML.

---

## 4. The True "Start From Nothing" Masterpiece Map

This is what RPGlitch looks like if we started from an empty directory today with zero legacy baggage: **2 Core Prompts**, **4 Clean Folders**, and **~25 purposeful files total**.

```
src/
├── main.js                     # Mounts App.svelte with design.css
├── App.svelte                  # Root layout router (Lobby vs. Story)
├── config.js                   # Canonical hardware limits (20k char ceiling, timeouts)
├── design.css                  # CSS design tokens, typography, glassmorphism, animations
│
├── engine/                     # 🧠 THE SIMULATION & STATE (6 Files)
│   ├── simulation.svelte.js    # Single authoritative state kernel (entities, round, phase, actions)
│   ├── turns.js                # The Two-Step Heartbeat (run_director_turn & run_story_turn)
│   ├── prompts.js              # The 2 Canonical Prompts (Director JSON staging & Storyteller in-character prose)
│   ├── parser.js               # Robust bracket parser ([KEY: VALUE], diffs, clean prose, strip <think>)
│   ├── transport.js            # Perchance LLM streaming & priority queue gatekeeper
│   └── log.svelte.js           # Developer HUD telemetry and event log feed
│
├── data/                       # 💾 PERSISTENCE & SCHEMAS (3 Files)
│   ├── db.js                   # Dexie database schema + clean CRUD persistence (stories, characters)
│   ├── entities.js             # 4-quadrant schema (ETERNAL/PRESENT/PAST/FUTURE) + public/private epistemic filter
│   └── presets.js              # 2 Narrative Styles (Gritty/Cinematic) + default starter entities
│
├── media/                      # 🎨 SENSORY CORTEX & DESIGN (3 Files, governed by design skill)
│   ├── audio.svelte.js         # Web Audio SFX + speech dispatch
│   ├── visual.svelte.js        # Perchance generate_image caller
│   └── motion.js               # Kinetic physics, spring transitions & card flight math
│
├── utils/                      # 🛠️ PURE HELPERS (2 Files)
│   ├── format.js               # Dialogue quotes wrapping, markdown-it, DOMPurify sanitization, story export
│   └── actions.js              # Svelte DOM actions (click_outside, auto_resize, safe_html)
│
└── ui/                         # 🖥️ THE USER INTERFACE (11 Pure Svelte Components)
    ├── Layout.svelte           # Shell & top navigation header
    ├── Storyboard.svelte       # The Lobby (3-card hand, slot picker, shuffle & flight)
    ├── Storymode.svelte        # The Game Screen (chat feed, input bar, continue button)
    ├── MessageCard.svelte      # Single turn card (prose, dialogue quotes, collapsible thoughts & subtext)
    ├── EntityCard.svelte       # Physical card in the lobby hand
    ├── EntityProfile.svelte    # Character dossier & 4-quadrant editor modal (Readonly & Edit mode)
    ├── SettingsDrawer.svelte   # Quick settings, volume sliders, and end story action
    ├── StoryDrawer.svelte      # Saved stories drawer (load, rename, markdown export)
    ├── ImageLightbox.svelte    # Full-screen image preview lightbox & candidate picker
    ├── Avatar.svelte           # Styled portrait frame with initials fallback & signature color ring
    ├── Modal.svelte            # Accessible dialog chassis (trap focus, escape key)
    └── Slider.svelte           # Accessible range slider (volume)
```

---

## 5. Summary Metrics (The True Transformation)

| Metric                 | Pre-Nuke (Legacy Spaghetti)            | Post-Nuke ("Start From Nothing")                           | Reduction            |
| :--------------------- | :------------------------------------- | :--------------------------------------------------------- | :------------------- |
| **Total Source Files** | ~170 files                             | **~26 files**                                              | **-85% files**       |
| **Total Code Size**    | ~1,250 KB                              | **~180 KB**                                                | **-85% code**        |
| **Prompt Modes**       | 9 fragmented, overlapping prompts      | **2 unified prompts (Director + Story)**                   | **-78% prompts**     |
| **Intelligence Suite** | 41 files (~600 KB)                     | **3 engine files (`turns`, `prompts`, `parser` - ~25 KB)** | **-96% code**        |
| **UI Components**      | 71 fragmented micro-components         | **11 cohesive Svelte 5 domain components**                 | **-84% files**       |
| **State Flow**         | 5 disjointed stores via `bridges.js`   | **1 authoritative `simulation.svelte.js`**                 | **Zero indirection** |
| **Layer Coupling**     | Entangled imports & circular callbacks | **Unidirectional downward flow, pure siblings**            | **100% decoupled**   |

---

## 6. Execution Sequencing (The 4-Phase Transition)

To transition safely without breaking intermediate states, we execute in 4 discrete vertical phases:

### Phase 1: Foundation & Sensory Cortex

- **`src/config.js`**: Prune pseudo-physics, lock honest limits.
- **`src/utils/`**: Create `format.js` and `actions.js`, delete legacy utility bloat.
- **`src/media/`**: Merge `audio.svelte.js` (absorbing speech), create `visual.svelte.js`, and build unified `motion.js`.

### Phase 2: Persistence & Simulation Engine

- **`src/data/`**: Consolidate Dexie schema into `db.js`, 4-quadrant schema + public/private filter in `entities.js`, and canonical narrative styles in `presets.js`.
- **`src/engine/`**: Build `prompts.js` (Director JSON + Storyteller prose), `parser.js` (`[KEY: VALUE]` + `<think>` stripper), `transport.js` (Perchance LLM queue), `turns.js` (two-step heartbeat), `simulation.svelte.js` (Svelte 5 state kernel), and `log.svelte.js`.
- **Purge `src/intelligence/`, `src/state/`, and `src/platform/`**: Remove the 41 legacy files.

### Phase 3: Flat UI Domain Components

- **Consolidate `src/ui/`**: Implement the 11 domain components:
  1. `Modal.svelte` & `Slider.svelte` (primitives).
  2. `Avatar.svelte` & `ImageLightbox.svelte` (sensory visuals).
  3. `EntityCard.svelte` & `EntityProfile.svelte` (dossier & 4-quadrant editor).
  4. `MessageCard.svelte` (turn prose, dialogue quotes, collapsible thoughts).
  5. `StoryDrawer.svelte` & `SettingsDrawer.svelte` (drawers).
  6. `Storyboard.svelte` (lobby hand & shuffle) & `Storymode.svelte` (chat feed & input).
  7. `Layout.svelte` (top header & app shell).
- **Purge legacy UI subfolders**: Demolish all 8 subdirectories in `src/ui/`.

### Phase 4: Integration, Styling & Verification

- **`src/App.svelte` & `src/main.js`**: Connect root layout to `simulation.svelte.js`.
- **`src/design.css`**: Verify visual tokens and kinetic glassmorphic styles.
- **Full Verification Sweep**: Run `npm run verify` and test simulation roundtrip.
