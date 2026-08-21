# RPGlitch — Full `src/` Review Report

Date: 2026-08-21 · Scope: entire `src/` tree (~147 production files + ~48 test files)

Method: import-graph analysis (alias-aware), per-file readthroughs, barrel audit, and a live-bundle check (the shipped `index.html` bundle) to confirm which dead code actually ships.

---

## 1. Wiring — VERIFIED SOUND

- **Entry chain**: `main.js` → boot sequence → `mount(App)` → `App.svelte` shell → `Layout` + `Storymode`/`Storyboard` + `Console` + `CardHand`/`Profile`/`ImagePicker`/`ImagePreview`/`Tooltip`. Everything downstream resolves through the alias map (`@`, `@state`, `@data`, `@media`, `@platform`, `@intelligence`, `@utils`, `@ui`, `@primitives`, `@motion`, `@image`, `@entity`, `@profile`, `@console`, `@story`, `@message`).
- **Import-graph check**: every production file is reachable from `main.js`. The only "orphans" are expected:
  - `src/index.html` — the Vite entry template (wired via vite config build input, not a JS import).
  - `src/RPGlitch-left-panel.pjs` — a standalone Perchance left-panel config stub, not part of the JS graph.
- **Layer discipline holds** (ui → state → intelligence → data → platform, with `@media`/`@utils` bridges). Specifically checked for upward imports: `data/character-cards.js` only references `apply_profile_to_entity` in _comments_, not imports. Cross-layer reads go through `state_bridge` / `stories_bridge` from `@utils` — correct pattern.
- **Runtime verified**: the deployed app boots, mounts, renders the shell, captures all three plugins (`generate_text`/`generate_image`/`fetch_web`), and reports no `perchanceErrors`.

---

## 2. Dead code — confirmed

### 2.1 Whole dead modules (they ship in the ~1.2 MB bundle today)

| File                          | What's dead                                                                                                                                                                                                                     | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/utils/markdown.js`       | `parse_markdown` — referenced nowhere, not even tests                                                                                                                                                                           | `ui/message/render.js` already uses `markdown-it`; the `"strong-em"` string is in the shipped bundle. Safe to delete.                                                                                                                                                                                                                                                                                                                     |
| `src/ui/Storyboard.svelte.js` | The `storyboard` controller + `install_begin_flight_effect` (the "begin-flight" prologue card-morph feature) — never consumed; the `Storyboard.svelte` component does not import it. Only re-exported through the `@ui` barrel. | Its `pickup_scale` / `deck_clearance` / `begin-flight` strings are in the shipped bundle. Safe to delete, together with its two private helpers `capture_storyboard_flight` + `fly_storyboard_cards_into_prologue` in `EntityCard.svelte.js` (their only live caller is this dead module). Keep `update_card_scrub`/`clear_card_location` (used by `Feed.svelte`) and `fly_card_in`/`fly_card_out`/`rect_of` (used by `CardHand.svelte`). |

### 2.2 Dead exports (production-unused; most are test-only surface)

| File                              | Dead exports                                                                                                                                                                                                             | Live exports in the same file (keep)                                                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `intelligence/temporal.js`        | `TEMPORAL_SCORING`, `score_async`, `MAX_TOTAL_VECTORS`, `MAX_VECTOR_CHARS`, `PAST_VECTOR_CAP`, `is_origin`, `ensure_unique_vector_id`, `append_past_vector`, `format`, `format_async`, `archive_chapter`, `forge_memory` | `temporal_engine`, `prune`, `resolve_vector_pool`, `reconcile_vector_caps`, `score`, `apply_state_mutations`, `precompute_context_embedding`, `set_round` |
| `media/image-beats.js`            | `count_pending_ghosts`, `mark_placeholder_failed`, `_image_gen_queue`, `IMAGE_GEN_QUEUE_CAPACITY`, `IMAGE_GHOST_MAX_AGE_MS`, `IMAGE_PLACEHOLDER_HARD_CAP`, `_remove_from_image_gen_queue`                                | `spawn_image_beat`, `sweep_stale_ghosts`, `IMAGE_RESOLVE_TIMEOUT_MS`                                                                                      |
| `media/image-trigger.js`          | `IMAGE_TRIGGER`, `evaluate_image_trigger`                                                                                                                                                                                | `resolve_image_trigger`                                                                                                                                   |
| `media/palette.js`                | `get_deterministic_color`, `get_color_name`, `resolve_token`                                                                                                                                                             | `get_signature_color`, `get_signature_label`, `ensure_theme_tokens`, `PALETTE`, `PALETTE_VARS`, `SIGNATURE_COLORS`                                        |
| `ui/primitives/Tooltip.svelte`    | `tooltip_state`, `show_tooltip`, `hide_tooltip`                                                                                                                                                                          | `tooltip` (the action), default `Tooltip`                                                                                                                 |
| `data/normalizer.js`              | `ENTITY_TEMPLATES`, `get_random_signature_key`, `coerce_temporal_array`, `coerce_temporal_vectors`                                                                                                                       | `normalize`, `create_new`, `format_premade`, `serialize_entity_for_export`                                                                                |
| `data/definitions/fragments.js`   | `build_profile_sections`, `PROFILE_SECTIONS_BY_TYPE`                                                                                                                                                                     | `ENTITY_FRAGMENTS`, `ENTITY_CATALOG`, `TEMPORAL_CONTRACT`                                                                                                 |
| `data/definitions/triggers.js`    | `SOMATIC_REGISTRY`, `STYLE_MOTIF_REGISTRY`, `resolve_somatic_directives`, `render_somatic_directives_xml`                                                                                                                | `build_somatic_directives_block`, `build_available_keywords_xml`, `GLOBAL_TRIGGERS`                                                                       |
| `data/definitions/detox-rules.js` | `DETOX_RULES` const                                                                                                                                                                                                      | `detox_prose`, `resolve_voice_register`                                                                                                                   |
| `utils/story-export.js`           | `format_story_beat`                                                                                                                                                                                                      | `export_story_markdown`, `build_story_export_filename`                                                                                                    |
| `media/speech.js`                 | `extract_styled_segments`, `infer_voice_for_chunk`                                                                                                                                                                       | `KOKORO_VOICES`, `CADENCE_RATES`, `VOICE_CADENCES`, `get_cadence_rate`, `resolve_voice_uri`, `resolve_voice_name`, `split_speech_by_speaker`              |
| `intelligence/prompts.js`         | `render_ghostwriter` — live feature, export exists only for tests                                                                                                                                                        | everything else                                                                                                                                           |
| `intelligence/dynamics.js`        | `evaluate_dynamics_signals` — live feature, export exists only for tests                                                                                                                                                 | `dynamics_engine`, `DYNAMICS_META`, `run_causality_shield`, `compute_deltas`                                                                              |
| `data/db.js`                      | `init()` — never called (Dexie lazy-opens)                                                                                                                                                                               | `db`, `set_versionchange_quiesce`                                                                                                                         |
| `ui/entity/EntityCard.svelte.js`  | `make_card_clone`, `capture_storyboard_flight`, `fly_storyboard_cards_into_prologue` (reachable only via barrel/dead module)                                                                                             | `rect_of`, `strip_card_text`, `fly_card_in`, `fly_card_out`, `update_card_scrub`, `clear_card_location`                                                   |

> Note: `render_ghostwriter` and `evaluate_dynamics_signals` are exported purely so tests can exercise them — the features themselves are live. Not a bug; just a convention worth codifying (e.g. test-only subpath or `_`-prefixed exports).

---

## 3. Notable issues / low-hanging fruit

1. **Stale mount target** — `main.js:44` mounts into `#main-app-container`, which exists in neither `src/index.html` nor the deployed page, so it silently falls back to `document.body`. Add the container or drop the fallback.
2. **Eager model preloads on every boot** — `main.js` fires `embeddings_engine.load_model()` (all-MiniLM-L6-v2, ~80 MB) **and** `Audio.voice.load_model()` (Kokoro-82M, much heavier) unconditionally. Both are already lazy behind the onnx mutex; the preload is a cache-warm heuristic that costs real bandwidth on first load. Consider gating the voice preload on the `voice_enabled` setting (default off) and letting embeddings warm on the first turn.
3. **`$meta.title = "RPGlitchen"`** in `main.pjs` (and duplicated in `src/RPGlitch-left-panel.pjs`) — looks like a typo for "RPGlitch" (the deployed page correctly says "RPGlitch"). The pjs stub also duplicates `main.pjs`'s plugin imports; keep them in sync or derive one from the other.
4. **Trim barrels** — after removing the dead modules/exports, the barrels become honest (several `@utils` exports use `export *`), and ~25 KB+ of shipped-but-dead code leaves the bundle.

---

## 4. Layer-by-layer notes

### `src/` root

- `main.js` (7.5 KB) — composition root. Exposes `Dexie`/`DOMPurify` on `window`, installs environment hardening, registers state/stream bridges, runs the boot sequence (seed premades → model preloads → parallel `sync`/`init`/`Audio.init` → auto-resume → vector-cap reconciliation → mount), with a `SYSTEM HALTED` error screen. Guarded for tests. Sound.
- `App.svelte` (22.7 KB) — shell. Persistent-layout hoist (`Layout` + snippets), entity action menus, photo/group-photo/regenerate/ghostwrite/mock handlers, image-preview bridge wiring, audio pagehide cleanup. Sound.
- `index.html` (3 KB) — Vite entry template; `document.domain` bootstrap, fonts, `#svelte-root`, Perchance plugin-capture script, `<script type="module" src="/main.js">`.
- `RPGlitch-left-panel.pjs` (0.2 KB) — Perchance left-panel stub (duplicates `main.pjs` imports). Keep in sync.

### `data/`

- `index.js` — barrel with a documented cyclic-import ordering fix (`PROTOCOL_LIBRARY` first). Good.
- `db.js` — Dexie schema v10→v14 migrations, `versionchange` quiesce + reload, `blocked` warning. `init()` unused. Solid.
- `repository.js` — `seed_premades`, `entities`/`stories` CRUD, vector-embedding mapping, epilogue story filters. Solid.
- `sessions.svelte.js` — `session_driver` (log/update attachments, NPC cast, story lifecycle) via `state_bridge`. Solid.
- `normalizer.js` — entity normalization/templates, signature-key, temporal-vector coercion. Live core; 4 dead exports.
- `character-cards.js` — PNG/character-card import-export codec (PNG chunk extraction, detection, serialization). Wired; used by UI import flow + tests.
- `definitions/` — `detox-rules.js` (44 KB, cliché lexicon), `protocols.js` (27 KB), `narrative-styles.js` (36 KB), `visual-styles.js` (32 KB), `premades.js` (39 KB, seeded entities), `fragments.js` (profile fragment schema), `triggers.js` (somatic registry), `signature-colors.js`. Big, data-heavy, coherent; only the specific exports listed in §2.2 are dead.

### `intelligence/`

- `kernel.js` (55 KB) — `gamemaster`. Orchestrates director → speaker engine → dynamics → image beats → memory forge → prologue/epilogue/ghostwriter, with retries, background job queue, causality shield. Well-structured.
- `temporal.js` (39 KB) — memory/temporal scoring, forge, state mutations, chapters. Core live; many test-only exports (§2.2).
- `prompts.js` (69 KB) — prompt compiler (director/character/NPC/narrator + shared `<SYSTEM>` head + profile/ghostwriter builders). Recently refactored (shared head) and verified. Solid.
- `embeddings.svelte.js` — transformers.js feature-extraction with pinned onnxruntime 1.22.0, single-threaded WASM, LRU embedding cache, dimension guard, model-reload retry. Robust.
- `onnx.js` — serialized WASM mutex + ort-ready signal. Prevents embedding↔TTS heap collisions. Good.
- `director.js` — director JSON normalization/speaker resolution. Live.
- `dynamics.js` — dynamics deltas/signals + causality shield. Live.
- `context.js` — context-builder (semantic retrieval + entity catalog expansion). Live.
- `parser.js` — think-block extraction, JSON extraction, image-prompt cleaning, refusal checks. Live.
- `telemetry.js` — update/retrieval/turn-summary entries. Live.
- `profile-pipeline.js` — LLM profile sorter + apply. Live.

### `state/`

- `app-store.svelte.js` — `AppStore`: view/viewport/card-hand/settings/round/turn-type, `load_entities`, image-preview handler registration, freeze-watchdog install. Solid.
- `runtime.svelte.js` — runtime store: active entity bindings, story_id, round, sync, update_entity persistence. Solid.
- `chrono.svelte.js` — story lifecycle orchestrator (begin/prologue/epilogue/continue, causality shield, turn summaries). Solid.
- `freeze-watchdog.js` — post-turn/turn watchdog that force-recovers stuck simulations; installed from `AppStore.init()`, manual unstick in UI. Live.
- `log.svelte.js` / `dev-log.svelte.js` — feed/dev log stores. Live.
- `status.svelte.js` — `simulation_state`/`ui_state`. Live.
- `streaming.svelte.js` — stream state. Live.
- `index.js` — barrel; `force_recover_simulation` re-exported (used by `StorymodeBar`). OK.

### `media/`

- `audio.svelte.js` (41 KB) — `Audio` + `VoiceEngine` (Kokoro-82M TTS via transformers.js), WebGPU-first device selection with wasm fallback, queue/sentence streaming, voice profiles, `AudioEffectsEngine` (sound FX with IndexedDB prefs). Robust.
- `visual.svelte.js` (28 KB) — `visual_engine`: tier/prompt building, LLM prompt enhance, retry + circuit breaker, candidate generation, mock fallback. Robust.
- `image-*.js` — triggers/aesthetics/beats/prompts/tiers form the image pipeline (dynamics-gated beats, ghost queue, aesthetic tokens). Only the §2.2 dead exports.
- `speech.js`, `palette.js`, `tokens.js` — voice cadence/segmentation, signature colors, design tokens. Live core.
- `design.css` — Tailwind v4 entry + theme tokens. Wired via `main.js`.

### `platform/`

- `transport.js` — `llm_service`: the single generate_text adapter. Prefix-cache-ordered instruction assembly, streaming bridge, abort→`.stop()`, DataClone retry, sanitization, mock mode. Excellent.
- `web-fetch.js`, `security.js`, `session-storage.js`, `environment.js` — fetch_web wrapper, DOMPurify sanitize + URL validation, checkpoint tiers, ResizeObserver/frame-error hardening. All sound.

### `utils/`

- `bridges.js` — `state_bridge`/`stream_bridge`/`stories_bridge`; the cross-layer seam. Central.
- `ui-helpers.js`, `text.js`, `xml.js`, `html.js`, `math.js`, `embedding-serialization.js`, `job-queue.js`, `field-path.js`, `resilience.js`, `story-export.js`, `onnx.js` — all live except `markdown.js` (§2.1).

### `ui/`

- Shell (`Layout`, `Storymode`, `Storyboard`) — persistent 3-column layout, view morphing, title generator. Live.
- `console/` — `Console`, `ControlPanel`, `StorymodeBar`, `StoryboardBar`, `AudioControls`, `DevControls`, `SettingsButton`. Live.
- `entity/` — `EntityCard`/`CardHand`/`ImportModal` + motion helpers. Live (3 dead flight helpers, §2.1).
- `message/` — `Feed`, `Message`, `Body`, `Attachments`, `Prologue`, `Epilogue`, telemetry cards, `render.js` (markdown-it + dialogue wrap), `UndoToast`. Live.
- `profile/` — `Profile` (42 KB), wings (Visual/Audio/Dev), `Vectors`, header. Live.
- `image/` — `ImagePicker`, `ImagePreview`, `ProfilePicture`. Live.
- `motion/` — `engine`/`kinetic`/`transitions`/`Typewriter`. Live.
- `primitives/` — 22 components incl. bits-ui-backed Tooltip/Dropdown/Slider/TextField. Live (3 dead Tooltip exports).
- `story/` — `StoryCard`, `StoryManager` (export story markdown). Live.
- `actions.js` — `use_actions`, `click_outside`, `safe_html`, `auto_resize`. Live.

---

## 5. Verdict

- Nothing is broken; wiring is complete and layer-disciplined.
- The one concrete cleanup + bundle win: delete `utils/markdown.js` and `ui/Storyboard.svelte.js` (+ the two orphaned flight helpers in `EntityCard.svelte.js`), then prune the §2.2 dead re-exports from the barrels (~25 KB+ of shipped-but-dead code).
- Worth fixing opportunistically: the stale `#main-app-container` mount target and gating the boot-time voice/embedding model preloads on user settings.
- Cosmetic: `"RPGlitchen"` typo in `$meta.title`/left-panel stub.
