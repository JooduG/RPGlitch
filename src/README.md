# RPGlitch Application Source (`src/`)

## Overview

Application root for **RPGlitch**, containing the browser boot entrypoint, root Svelte 5 shell, canonical system configuration constants, Perchance plugin integration manifest, HTML host document, and all eight layered domain packages.

## Interface

### 1. Subsystems & Contracts

- [Simulation Engine (`./engine/README.md`)](./engine/README.md): Turn orchestration pipeline (`Director`, `Character`, `Caretaker`), `ChronoEngine`, `lifecycle.js`, and priority-gated LLM streaming transport (`transport.js`).
- [Reactive State Stores (`./state/README.md`)](./state/README.md): Rank 3 acyclic 3-store Svelte 5 rune layer (`app` in `interface.svelte.js`, `execution` in `execution.svelte.js`, `session` in `session.svelte.js`) and freeze watchdog.
- [Simulation Core (`./simulation/README.md`)](./simulation/README.md): Rank 1 pure bracket/pseudo-JSON parser, dynamics reducer, history normalization, prose slop linter, two-tier RAG memory selection, and XML/diffusion prompt compilation.
- [Domain UI & Controllers (`./ui/README.md`)](./ui/README.md): Presentation components (`Storyboard`, `Storymode`, `Console`, `Profile`, `RelationalGraph`, `ChatBubble`, `EntityCard`, `ImagePreview`, `ContextMenu`, `DevGrid`, `Typewriter`) and reactive controllers (`app`, `ProfileState`).
  - [UI Primitives (`./ui/primitives/README.md`)](./ui/primitives/README.md): 15 design-system Svelte 5 primitives and the `tooltip` action built on `bits-ui`.
- [Data & Persistence (`./data/README.md`)](./data/README.md): Pure persistence layer (zero Svelte runes, zero upward imports) — Dexie `"rpglitch"` IndexedDB engine, event-sourced `mutation_ledger`, 4-quadrant entity normalization (`records.js`), TavernAI/PNG card codecs (`card-codec.js`), 3-tier session checkpoints (`checkpoint.js`), and Markdown story exporters (`exporters.js`).
- [Definitions Registry (`./definitions/README.md`)](./definitions/README.md): Declarative dynamics protocols/rules, 24 literary narrative styles, 4-layer profile taxonomy, speaking-style/anti-AI detox rules, and 26 visual diffusion styles.
- [Sensory Cortex (`./media/README.md`)](./media/README.md): Procedural Web Audio SFX, Web Speech synthesis, Svelte 5 kinetic motion and card-flight physics, stateless Perchance image dispatching, pure optics taxonomy, and design-token palettes.
- [Shared Utilities (`./utils/README.md`)](./utils/README.md): Rank 0 shared foundation — generated tokens (`tokens.js`), deterministic palette resolution (`palette.js`), numeric/cosine math (`math.js`), text/XML/style helpers (`text.js`), inline Markdown AST (`markdown.js`), dot-path accessors (`field-path.js`), `@ENTITY` macros (`macros.js`), HTML sanitization/extraction (`html.js`), web/image ingestion (`ingestion.js`), browser DOM/actions (`dom.js`), MiniLM embeddings (`embeddings.svelte.js`), and async queues/circuit breaking (`async.js`).

### 2. Local Entry Points & Configuration

- [`main.js`](./main.js): Composition root and application bootstrap:
  - `app_bootstrap`: `{ async init() }` — runs environment hardening and theme token checks, orchestrates premade seeding, non-blocking model preloads, parallel store/audio initialization, unconditional `app.load_entities()`, active story auto-resume, and mounting `<App />` to `document.body`.
  - `reset_bootstrap_guard()`: Test-only reset setting `has_initialized = false` when `import.meta.env.MODE === "test"` (no-op otherwise).
- [`App.svelte`](./App.svelte): Default-exported Svelte 5 root shell component (takes no `$props()`) hosting the atmospheric backdrop, `<ImagePreview />`, persistent 12-column grid stage (`<Storyboard />` or `<Storymode />`), persistent `<footer>` containing `<Console />` when `app.entities_loaded` is true, conditional `<Profile />`, `<Tooltip />`, and `<DevGrid />` 12x12 diagnostic overlay.
- [`config.js`](./config.js): Single source of truth for canonical subsystem agreements and numerical policies:
  - Section 1: `TIMING_MS`, `PATIENCE_POLICY`.
  - Section 2: `DYNAMICS`, `LENGTH_THRESHOLDS`, `IMAGE_RESOLUTIONS`, `EMBEDDING_SPECS`, `TEMPO_ROUNDS`, `CHARS_PER_TOKEN`, `IMAGE_POLICY`, `VOICE_CADENCE`, `CANONICAL_ROLES`, `NARRATOR_ROLES`, `SPEAKING_STYLES`.
  - Section 3: `TELEMETRY_CAPS`, `FIELD_FLOORS`.
- [`main.pjs`](./main.pjs): Perchance generator manifest declaring `$meta` (`title = RPGlitchen`, `description = RPGlitchen`, `header.mode = minimal`) and importing `generate_text` (`ai-text-plugin`), `generate_image` (`text-to-image-plugin`), and `fetch_web` (`super-fetch-plugin`).
- [`index.html`](./index.html): HTML5 host container declaring the `#main-content` skip link, `data-no-vault` plugin capture script (`window.generate_text`, `window.generate_image`, `window.fetch_web`), and `<script type="module" src="/main.js"></script>`.

## Invariants

- **Strict Layer Hierarchy**: Ranked layers flow downward or laterally within equal ranks across the 6-Rank DAG: `src/ui/` (Rank 5) -> `src/engine/` (Rank 4) -> `src/state/` (Rank 3) -> `src/data/` & `src/media/` (Rank 2) -> `src/simulation/` (Rank 1) -> `src/definitions/` & `src/utils/` (Rank 0), enforced by both `npm run audit:layers` (`layers.js`) and `graph-it check-architecture` (`graphit.architecture.json`).
- **Config Evaluation Order (`config.js`)**: All exported configuration objects, arrays, and sets are frozen via `Object.freeze`; Section 1 and Section 2 have zero cross-references between homes, and Section 3 only references Sections 1–2 to prevent module-evaluation TDZ errors. `DYNAMICS` axis definitions are uppercase (`CHAOS`, `INTENSITY`, `OPENNESS`, `AFFINITY`, `VELOCITY`, `ENTROPY`) and indexed by lowercase runtime IDs via `.toUpperCase()`.
- **Bootstrap Sequencing & Single-Init Guard (`main.js`)**: `app_bootstrap.init()` guards against duplicate calls via `has_initialized`, skips auto-execution on module load when `import.meta.env.MODE === "test"`, runs `install_environment_hardening()` and `ensure_theme_tokens()` before `seed_premades()`, awaits `seed_premades()` prior to `session.sync()`, loads lobby entities unconditionally before mount, guards `set_versionchange_quiesce` against partial `@data` mocks, and sanitizes critical boot error markup via `sanitize_to_fragment()`.
- **Root Shell Lifecycle (`App.svelte`)**: `<Console />` remains mounted in the persistent stage `<footer>` across `"storyboard"` and `"storymode"` transitions; `<ImagePreview />` mounts directly in root shell markup driven by `ImagePreview.svelte.js`; fractal `view-transition-name: entity-morph-fractal` applies only during `"storymode"` when `!app.transitioning_profile`; noise animation respects `motion.is_reduced`; AudioContexts are destroyed on both `pagehide` and `$effect` cleanup.
- **Perchance Host Polling (`index.html`)**: `document.domain = "perchance.org"` is wrapped in `try/catch`; `capture_plugins()` polls undefined canonical plugin slots (`generate_text`, `generate_image`, `fetch_web`) at `50ms` intervals capped at `MAX_POLLS = 100` inside a `data-no-vault` script tag.

## Side Effects

- **Module-Load Globals (`main.js`)**: Imports `@media/design.css`, registers the Dexie `versionchange` checkpoint callback, and auto-runs `app_bootstrap.init()` outside `"test"` mode.
- **Startup Initialization & DOM Mounting (`main.js`, `App.svelte`)**: `app_bootstrap.init()` hardens the environment, ensures CSS theme tokens, seeds IndexedDB, triggers background ONNX/voice preloads, hydrates session/UI/audio/entities, mounts `<App />` onto `document.body`, and replaces `document.body` on fatal boot failure. `<App />` effects trigger `motion.intensity = 1.0` during active streaming and `window` `pagehide` audio cleanup.
- **Host Document & Plugin Binding (`index.html`, `main.pjs`)**: Sets `document.domain`, loads external Google Fonts stylesheets (`Inter`, `Satisfy`, `Ubuntu`, `JetBrains Mono`), polls and binds `window` Perchance plugin globals, and executes `/main.js`.

## Verification

- Run all unit tests under `src/`: `npm run test:unit`
- Run entrypoint bootstrap tests: `npx vitest run src/main.test.js`
