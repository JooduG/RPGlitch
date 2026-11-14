# RPGlitch Application Source (`src/`)

## Overview

Application root for **RPGlitch**, containing the browser boot entrypoint, root Svelte 5 shell, canonical system configuration constants, Perchance plugin integration manifest, HTML host document, and all six layered domain packages.

## Interface

### 1. Subsystems & Contracts

- [Simulation Engine (`./engine/README.md`)](./engine/README.md): Headless Svelte 5 simulation kernel, 3-turn orchestration pipeline (`Director`, `Character`, `Caretaker`), XML prompt compiler and verifier, priority-gated LLM transport, Two-Tier Sieve RAG, and dynamics math.
- [Domain UI & Controllers (`./ui/README.md`)](./ui/README.md): Presentation components (`Storyboard`, `Storymode`, `Console`, `Profile`, `RelationalGraph`, `ChatBubble`, `EntityCard`, `ImagePreview`, `ContextMenu`, `Typewriter`) and reactive controllers (`app`, `ProfileState`).
  - [UI Primitives (`./ui/primitives/README.md`)](./ui/primitives/README.md): 18 design-system Svelte 5 primitives and the `tooltip` action built on `bits-ui`.
- [Data & Persistence (`./data/README.md`)](./data/README.md): Dexie `"rpglitch"` IndexedDB engine, event-sourced `mutation_ledger`, 4-quadrant entity normalization and genesis, pseudo-JSON bracket parser, TavernAI/PNG card conversion, premades/presets, `session_driver`, and reactive log stores.
- [Definitions Registry (`./definitions/README.md`)](./definitions/README.md): Declarative dynamics protocols/rules, 24 literary narrative styles, 4-layer profile taxonomy, speaking-style/anti-AI detox rules, and 26 visual diffusion styles.
- [Sensory Cortex (`./media/README.md`)](./media/README.md): Procedural Web Audio SFX, Web Speech synthesis, Svelte 5 kinetic motion and card-flight physics, stateless Perchance image dispatching, pure optics taxonomy, and design-token palettes.
- [Shared Utilities (`./utils/README.md`)](./utils/README.md): Pure data codecs, text/bracket parsing, macro expansion, XML/Markdown compilers, prose detox/slop auditing, HTML sanitization, vector math/Q8 quantization, ONNX MiniLM embeddings, job queues, resilience primitives, and cross-layer bridge registries.

### 2. Local Entry Points & Configuration

- [`main.js`](./main.js): Composition root and application bootstrap:
  - `app_bootstrap`: `{ async init() }` — orchestrates premade seeding, non-blocking model preloads, parallel store/audio initialization, active story auto-resume, vector cap normalization, and mounting `<App />`.
  - `reset_bootstrap_guard()`: Test-only reset setting `has_initialized = false` when `import.meta.env.MODE === "test"` (no-op otherwise).
- [`App.svelte`](./App.svelte): Default-exported Svelte 5 root shell component (takes no `$props()`) hosting the atmospheric backdrop, `<ImagePreview />`, persistent 12-column grid stage (`<Storyboard />` or `<Storymode />`), persistent `<footer>` containing `<Console />` when `app.entities_loaded` is true, conditional `<Profile />`, `<Tooltip />`, and `[data-dev="grid"]` 12x12 diagnostic overlay.
- [`config.js`](./config.js): Single source of truth for canonical subsystem agreements and numerical policies:
  - Section 1: `TIMING_MS`, `PATIENCE_POLICY`.
  - Section 2: `DYNAMICS`, `LENGTH_THRESHOLDS`, `IMAGE_RESOLUTIONS`, `EMBEDDING_SPECS`, `TEMPO_ROUNDS`, `CHARS_PER_TOKEN`, `IMAGE_POLICY`, `VOICE_CADENCE`, `CANONICAL_ROLES`, `NARRATOR_ROLES`, `SPEAKING_STYLES`.
  - Section 3: `TELEMETRY_CAPS`, `FIELD_FLOORS`.
- [`main.pjs`](./main.pjs): Perchance generator manifest declaring `$meta` (`title = RPGlitchen`, `description = RPGlitchen`, `header.mode = minimal`) and importing `generate_text` (`ai-text-plugin`), `generate_image` (`text-to-image-plugin`), and `fetch_web` (`super-fetch-plugin`).
- [`index.html`](./index.html): HTML5 host container declaring `#svelte-root`, `#main-content` skip link, `<!--PERCHANCE_CONFIG_TARGET-->` injection marker, `data-no-vault` plugin capture script (`window.generate_text`, `window.pluginGenerateText`, `window.generate_image`, `window.pluginGenerateImage`, `window.fetch_web`, `window.pluginFetchWeb`), and `<script type="module" src="/main.js"></script>`.

## Invariants

- **Strict Layer Hierarchy**: Ranked layers flow downward or laterally within equal ranks across `src/ui/` (Rank 4) -> `src/engine/` & `src/data/` (Rank 2, including lateral `src/data/` -> `@engine` imports in `entities.js` and `log.svelte.js`) -> `src/media/` & `src/utils/` (Rank 1), enforced by the repository layer gate (`npm run audit:layers`). `src/definitions/` is unranked in `LAYER_HIERARCHY` (`layers.js`) and has a mutual dependency with `src/media/` (`profile-taxonomy.js` -> `../media/tokens.js`; `optics.js` & `visual.svelte.js` -> `../definitions/visual-styles.js`).
- **Config Evaluation Order (`config.js`)**: All exported configuration objects, arrays, and sets are frozen via `Object.freeze`; Section 1 and Section 2 have zero cross-references between homes, and Section 3 only references Sections 1–2 to prevent module-evaluation TDZ errors. `DYNAMICS` axis definitions are uppercase (`CHAOS`, `INTENSITY`, `OPENNESS`, `AFFINITY`, `VELOCITY`, `ENTROPY`) and indexed by lowercase runtime IDs via `.toUpperCase()`.
- **Bootstrap Sequencing & Single-Init Guard (`main.js`)**: `Dexie` and `DOMPurify` are attached to `window` and `register_state_accessors` / `register_stream_handlers` execute before `app_bootstrap.init()`. `app_bootstrap.init()` guards against duplicate calls via `has_initialized`, skips auto-execution on module load when `import.meta.env.MODE === "test"`, awaits `seed_premades()` prior to `runtime.sync()`, guards `set_versionchange_quiesce` against partial `@data` mocks, and sanitizes critical boot error markup via `sanitize_to_fragment()`.
- **Root Shell Lifecycle (`App.svelte`)**: `<Console />` remains mounted in the persistent stage `<footer>` across `"storyboard"` and `"storymode"` transitions; `register_image_preview_handlers(open_image_preview, close_image_preview)` runs at shell setup to preserve layer boundaries; fractal `view-transition-name: entity-morph-fractal` applies only during `"storymode"` when `!app.transitioning_profile`; noise animation respects `motion.is_reduced`; AudioContexts are destroyed on both `pagehide` and `$effect` cleanup.
- **Perchance Host Polling (`index.html`)**: `document.domain = "perchance.org"` is wrapped in `try/catch`; `capturePlugins()` polls undefined plugin slots at `50ms` intervals capped at `MAX_POLLS = 100` inside a `data-no-vault` script tag.

## Side Effects

- **Module-Load Globals & Bridges (`main.js`)**: Imports `@media/design.css`, mutates `window` (`Dexie`, `DOMPurify`), runs `install_environment_hardening()` and `ensure_theme_tokens()`, populates `@utils` state/stream bridges, registers the Dexie `versionchange` checkpoint callback, and auto-runs `app_bootstrap.init()` outside `"test"` mode.
- **Startup Initialization & DOM Mounting (`main.js`, `App.svelte`)**: `app_bootstrap.init()` seeds IndexedDB, triggers background ONNX/voice preloads, reconciles over-cap `past`/`future` fields via `runtime.update_entity`, mounts `<App />` onto `document.body` (removing `#svelte-root`), and replaces `document.body` on fatal boot failure. `<App />` effects trigger `app.load_entities()`, `runtime.sync()`, `motion.intensity = 1.0` during active streaming, and `window` `pagehide` audio cleanup.
- **Host Document & Plugin Binding (`index.html`, `main.pjs`)**: Sets `document.domain`, loads external Google Fonts stylesheets (`Inter`, `Satisfy`, `Ubuntu`, `JetBrains Mono`), polls and binds `window` Perchance plugin globals, and executes `/main.js`.

## Verification

- Run all unit tests under `src/`: `npm run test:unit`
- Run entrypoint bootstrap tests: `npx vitest run src/main.test.js`
