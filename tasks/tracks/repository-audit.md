# Repository Audit: RPGlitch Monorepo

## Macro Architecture & Logic Harmonization Report

Scope covered: `src/` (engine, intelligence, data, state, platform, media, ui). Findings are based on static cross-reference of import/export chains and call-site tracing across all provided files. Where a finding depends on code outside the provided tree (compiled `dist/RPGlitch.html`, Perchance left-panel runtime), this is noted explicitly.

---

## 1. Executive Repository Health Summary

The layering itself is sound — `data → engine → intelligence → platform/media → state → ui` is a clean, mostly-acyclic dependency direction, and test coverage per module is unusually thorough. The structural debt is not "spaghetti," it's **duplication via abandonment**: multiple complete, tested implementations of the same concern exist side-by-side, where only one was ever actually wired to the UI. The other sits fully built, fully tested, and fully inert.

The five headline issues:

1. **Two turn-advancement engines.** `ChronoStore` (`engine/chrono.svelte.js`) and `ReactiveSession` (`state/session.svelte.js`) both implement "advance the turn." Only `ReactiveSession` is reachable from `UnifiedConsole.svelte`. `Chrono` is the more capable of the two (causality scanning, abort/interrupt support) and is completely dormant — which means the interrupt button infrastructure built around it (`app.trigger_interrupt`, `Button.svelte`'s `is_interrupt_btn`) is dead too, because nothing ever populates `app.streaming.abort_controller`.

2. **The View/Tab "hibernation" context system computes a result it never consumes.** `context_broker.loadViewContext()` builds a hibernation set every time the storyboard view changes, but `hydrate()` — the function that actually assembles the LLM payload — reads from the _unfiltered_ cache. Switching tabs currently has zero effect on AI context.

3. **The `Engine` facade in `intelligence kernel.js`... sorry, `engine/kernel.js`** is mostly a museum. 7 of its ~9 exported methods have no callers; the live code calls `session_driver`/`ReactiveSession` directly.

4. **Three `ControlPanel` buttons are stubs** ("GHOSTWRITE", "PHOTO", "END STORY") that call `log_action(...)` and nothing else — while two of them have a fully-built backend sitting one call away (`visual_engine.visualize()`, `gamemaster.execute_epilogue()`).

5. **The data model carries several speculative fields** (`_backup_state`, `_last_update_msg_id`, `is_snapshot`, `is_chosen`, `associated_ids`, `story.entity_snapshots`) that are normalized/defaulted but never written _or_ read by application logic — scaffolding for features that were never started, or started from the wrong end.

None of this is breaking anything today — it's all either dormant alternates or no-op stubs. But it roughly doubles the cognitive load of "which implementation is the real one," and the dormant code (Chrono, hibernation, epilogue, visualize) represents real, finished work that's currently providing zero user value.

---

## 2. The Ghost File Purge Log

Only one file in the provided tree has **zero references** outside its own export/test chain:

| File                                                       | Status                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/platform/bridge.js` (+ `src/platform/bridge.test.js`) | `PerchanceBridge` / `bridge` singleton. Exported from `platform/index.js`, but no module in `engine/`, `intelligence/`, `state/`, or `ui/` imports `bridge`. The app talks to `window.ai` / `window.pluginTextToImage` directly (via `transport.js` / `visual.svelte.js`) instead of going through this abstraction. |

**Recommendation**: confirm `window.oc` / `bridge` isn't consumed by the compiled `dist/RPGlitch.html` or the Perchance left-panel runtime (neither is in this source tree — this is the one place I can't fully verify). If clean, delete both files and the `bridge` export from `platform/index.js`.

Everything else flagged below is "dead exports inside otherwise-live files," not standalone ghost files — see Section 3.

---

## 3. Dangling & Unwired Functionality Registry

### 3.1 Turn-Advancement Duplication (Chrono vs. ReactiveSession)

- `engine/chrono.svelte.js` (`ChronoStore`/`Chrono`): full pipeline — intent-lock → `Shield.process()` causality scan → background non-blocking generation via `AbortController` → round increment → save. Exported from `engine/index.js`, exposed as `window.chrono`.
- `state/session.svelte.js` (`ReactiveSession.advance_turn`): simpler pipeline — round increment → `session_driver.send()` → `Engine.generate_ai_response()` → save. **This is the one `UnifiedConsole.svelte` actually calls** (via `session.send()`).
- `Chrono` has no import in any `.svelte` file, `app.svelte.js`, `runtime.svelte.js`, or `session.svelte.js`.

**Downstream consequences:**

- `app.streaming.abort_controller` is set **only** inside `Chrono.advance_turn`. Since that path never runs, it stays `null` forever.
- `app.trigger_interrupt()` (`state/app.svelte.js`) checks `this.streaming.abort_controller` and aborts it — but it's always `null`, so this is a permanent no-op.
- `ui/atoms/Button.svelte` has a dedicated `is_interrupt_btn` derivation that special-cases any button whose `label`/`aria-label`/`class` contains "interrupt" so it stays enabled during `controlState.intent_active`. **No button anywhere in the UI tree has "interrupt" in any of those fields.** This is conditional logic with zero matching elements.
- `Security.process()` (`platform/security.js`) — the causality/physics scan placeholder — is called **only** from `Chrono.advance_turn`. It never executes in the live path.

### 3.2 View/Tab Context Hibernation (Storyboard "Chin" coupling)

- `Storyboard.svelte` calls `context_broker.loadViewContext(app.view)` on every view change.
- `loadViewContext` computes `hibernated_vector_ids` (a `Set` of vector IDs whose `vector_tags` don't match the active view).
- `context_broker.hydrate()` — the function that builds the payload sent to `prompt_builder.synthesize()` — sources `entities[role].future`/`.past` from `runtime.snapshot_entities` (i.e., `raw.future`), **not** from `get_active_knowledge()` (the hibernation-filtered accessor).
- The only thing `KnowledgeCache_*` / `get_active_vectors()` feeds into `hydrate()` is `active_vector` (FRACTAL's first future-vector text, used to seed `lexical_filter`'s `objective`) — and that itself comes from the _unfiltered_ cache.
- `is_hibernating()`, `get_active_knowledge()`, `get_active_view_id()` have no production call sites. `kernel.test.js`'s "Tab-Context Coupling" suite tests a **hand-rewritten standalone copy** (`buildHibernationSet`) of the hibernation logic, not the real `context_broker` implementation.

**Net effect**: switching storyboard tabs currently has no influence on what the AI sees, despite a full caching/effects/hibernation layer existing to support exactly that.

### 3.3 ControlPanel Stub Buttons

All three call `log_action("...")` and return:

| Button       | Backend that exists but isn't called                                                                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PHOTO`      | `visual_engine.visualize(storyId, prompt, targetType, options)` — `media/visual.svelte.js`. Fully implemented: refines a prompt via LLM, generates the image, caches it to the entity. Tested in `visual.test.js`. |
| `END STORY`  | `gamemaster.execute_epilogue()` / `Engine.trigger_epilogue()` / `prompt_builder.build_epilogue()` / `SYSTEM_PROMPTS.epilogue`. Fully implemented and tested (`kernel.test.js`, `prompts.test.js`).                 |
| `GHOSTWRITE` | No corresponding backend located anywhere in the provided tree.                                                                                                                                                    |

### 3.4 Prologue Custom Instructions Are Captured but Discarded

- `ControlPanel.svelte` binds a `TextField` ("Optional Prologue Instructions like 'Start in media res'...") to `app.prologue`.
- `gamemaster.execute_prologue(story_id)` calls `context_broker.hydrate("", "prologue")` — the input is a **hardcoded empty string**. `app.prologue` is never read by the generation pipeline.
- `SYSTEM_PROMPTS.prologue`'s `<INPUT_COMMAND>` therefore always falls back to `"The scene begins."`, regardless of what the user typed.

### 3.5 `engine/kernel.js` — `Engine` Facade Mostly Unused

Of the exported `Engine` object's surface:

- **Live**: `generate_ai_response`, `generate_prologue`.
- **No call sites found**: `require_active`, `get_active`, `create_from_selection`, `load_messages`, `send`, `regenerate`, and the re-export `Session = session_driver`.

The rest of the codebase calls `session_driver.*` / `ReactiveSession.*` directly for all of these, bypassing the facade entirely.

### 3.6 Session Restoration — Two Implementations, One Used

- `session_driver.restore_session()` (`engine/session.svelte.js`): reads `SESSION_ID_KEY` from `kv_settings`, sets `_active_id` + `runtime.story_id`. **Never called.**
- `runtime.sync()` (`state/runtime.svelte.js`): does its **own independent** `SESSION_ID_KEY` lookup at boot. This is the one `AppBootstrap.init()` actually triggers.
- Also unreferenced: `session_driver.create_session()` ("legacy simplified start") and `session_driver.clear_active()`.

### 3.7 Per-Character Dynamics Baseline — Read Side Built, Write Side Missing

- `dynamics_engine._get_baselines(entity)` returns `entity.dynamics_baseline ?? {}`, used for the "gravity pull toward baseline" physics in `_process_entity_dynamics`.
- `runtime.sync()` populates `active_ai_state.dynamics_baseline` / `active_fractal_state.dynamics_baseline` from `story.entity_snapshots?.ai?.dynamics` / `?.fractal?.dynamics`.
- **`story.entity_snapshots` is never written.** Not by `session_driver.create_from_selection`, not by `runtime.save()`, not by `gamemaster`. So `dynamics_baseline` is permanently `undefined`, and `_get_baselines()` always falls back to `{}` → gravity always pulls toward the hardcoded `?? 50`.

This is the closest-to-complete dangling feature in the repo — it just needs one write site at story creation (stamp `entity_snapshots` from the selected AI/Fractal's `dynamics`/`dynamics_baseline`).

### 3.8 The Fate Card System

- `app.fate = { active: false, hand: [], selected: null }`, with a documented `FateSystem` typedef ("Whether the Fate Card system is currently engaged" / "unresolved fate vectors").
- No read or write of `app.fate` anywhere outside its own declaration. An entire planned subsystem exists only as an empty shape.

### 3.9 `db.sessions` — Write-Only Table

- `session_driver.set_active()` writes `{ session_id, timestamp }` to `db.sessions` on every activation.
- Nothing reads `db.sessions` back — no history view, no analytics, no cleanup. Pure accumulation.

### 3.10 Speculative Entity Schema Fields

`data/normalizer.js` normalizes (and in one case, Dexie-indexes) several fields with no producer _and_ no consumer anywhere in application logic:

- `_backup_state`, `_last_update_msg_id` — pass-through only.
- `is_snapshot` / `isSnapshot` — defaulted to `0`, never set to `1`, never filtered on.
- `is_chosen` / `isChosen` — defaulted to `0`, **is part of the Dexie index** (`db.version(10).stores.entities` includes `isChosen`), but nothing ever sets or queries it.
- `associated_ids` / `associatedIds` — normalized array, never populated, never read.

These look like the data-layer half of features (undo/rollback, "marked" entities, entity relationships) that never got their logic layer built.

### 3.11 `normalizer.js` — `coerce_temporal_array` Defined but Bypassed

- `coerce_temporal_array(val)` is exported and tested: splits newline-delimited strings into a cleaned array, intended "for `past`/`future` temporal hybrid fields" per its docstring.
- `normalize()` itself never calls it — it does `past: Array.isArray(past) ? past : []`. Any legacy string-form `past`/`future` data is silently discarded as `[]` rather than coerced.

### 3.12 `intelligence/fragments.js` — Dead `ENTITY_CATALOG["future.*"]` / `["past.*"]` Entries

`build_entity_catalog()` generically flattens `ENTITY_FRAGMENTS.future.fields` / `.past.fields` (`text`, `dynamics_tags`, `vector_tags`, `emotional_weight`) into catalog keys — including `character.*` / `fractal.*` namespaced variants, roughly two dozen entries total.

The sole consumer, `to_data_points()` in `context.svelte.js`, calls `get_path_value(entity, fieldId)` and only keeps results where `typeof val === "string"`. For `fieldId = "future.text"`, `get_path_value` resolves `entity.future.text` — but `entity.future` is an **array**, so `.text` is `undefined`. For `fieldId = "future"` itself, the result is the array, which also fails the string check.

So the entire future/past slice of `ENTITY_CATALOG` is inert from `to_data_points`'s perspective. `fragments.test.js` validates the _shape_ of these entries exists, not that anything productive happens with them.

### 3.13 `parser.js` — `parse_message().sceneData` Always `null`

`parse_message()` returns `{ displayText, think, sceneData: null }`. `sceneData` is hardcoded `null` with no assignment path, and `Message.svelte` (the only consumer of `parse_message`) never reads `.sceneData`. Looks like a stub for a planned "structured scene extraction" feature.

### 3.14 Miscellaneous Dead Getters/Methods

No call sites found for any of:

- `app.fate`, `app.tension`, `app.env`, `app.isProcessing`, `app.voiceSuppressed`, `app.storyboard_ready`, `app.close_image_preview`, `app.force_start` (`state/app.svelte.js`). Notably, `StorymodeFeed.svelte` re-derives `app.isProcessing`'s exact condition inline as `is_active_turn` instead of using the getter.
- `runtime.log_turn`, `runtime.complete_vector`, `runtime.active_vector` (singular) (`state/runtime.svelte.js`). Vector "completion" in production actually goes through `temporal_engine.resolve()` (splice + transfer to `past`), a structurally different operation from `complete_vector` (`shift()`, no `past` transfer).
- `uiState.menu_open`, `uiState.input_active` (`state/status.svelte.js`).
- `SimulationLogStore.remove`, `SimulationLogStore.clear` (`state/log.svelte.js`) — the real deletion/refresh flow goes DB-delete → `refresh()`, never through these.
- `MESSAGES.REFUSAL_TRIGGERS` (`engine/config.js`) and `Security.checkRefusal` / `Security.authorizeVisuals` (`platform/security.js`) — an AI-refusal-detection and visual-authorization scaffold that `validate_and_repair_response()` doesn't consult (it only checks `<think>` closure and CJK bleed).
- `THEME` (`GRID_UNITS`, `ANIMATION_STANDARD`, `EASE_STANDARD`) in `engine/config.js` — exported, re-exported, never imported by any UI module.

---

## 4. Inter-File Synergy Optimization Plan

A sequenced blueprint — each phase is independently shippable and ordered roughly by risk/impact ratio.

### Phase 1 — Resolve the Chrono / ReactiveSession Fork

Pick one. Given `Chrono` is the more complete implementation (causality + interruption), the lower-waste path is:

- Repoint `UnifiedConsole.svelte`'s send action (via `ReactiveSession.send`) to delegate to `Chrono.advance_turn`, or fold `Chrono`'s causality/abort logic into `ReactiveSession.advance_turn`.
- Add an actual "Interrupt" button (label/aria-label containing "interrupt") wherever generation is shown as active, so `app.trigger_interrupt()` + `Button.svelte`'s `is_interrupt_btn` branch finally has a target.
- If, instead, Chrono was an abandoned prototype: delete `chrono.svelte.js` + `chrono.test.js`, strip `app.streaming.abort_controller`/`trigger_interrupt`, remove `is_interrupt_btn` from `Button.svelte`, and remove the `Security.process()` call site (and decide independently whether `process()`'s causality concept gets reimplemented inside `ReactiveSession` or dropped).

### Phase 2 — Collapse the `Engine` Facade

Remove `require_active`, `get_active`, `create_from_selection`, `load_messages`, `send`, `regenerate`, and the `Session` re-export from `engine/kernel.js` — confirmed zero callers. Keep `generate_ai_response` / `generate_prologue`. For `trigger_epilogue`, see Phase 4 (wire it rather than delete it — it's the most "finished" of the orphans).

### Phase 3 — Fix or Remove View-Context Hibernation

Either:

- **(a) Complete it**: change `context_broker.hydrate()` to source `entities[role].future`/`.past` (or at least the `active_vector` seed) via `get_active_knowledge()` instead of `get_active_vectors()`, so `loadViewContext` calls from `Storyboard.svelte` actually affect the LLM payload; or
- **(b) Remove it**: strip `loadViewContext`, `hibernated_vector_ids`, `is_hibernating`, `get_active_knowledge`, `active_view_id` from `context.svelte.js`, drop the `Storyboard.svelte` effect that calls it, and simplify `hydrate()`'s `view_id` parameter accordingly.

### Phase 4 — Wire the Three ControlPanel Buttons

- `PHOTO` → `app.visual.visualize(runtime.story_id, <prompt>, targetType)`.
- `END STORY` → `gamemaster.execute_epilogue(runtime.story_id)` (directly, or via a slimmed `Engine.trigger_epilogue` retained from Phase 2).
- `GHOSTWRITE` → no backend exists; either scope and build one, or remove the button until it does.
- **Prologue instructions**: thread `app.prologue` into `context_broker.hydrate(app.prologue, "prologue")` so `SYSTEM_PROMPTS.prologue`'s `<INPUT_COMMAND>` reflects what the user actually typed.

### Phase 5 — Consolidate "Current Top Vector" Accessors

There are at least three ways to ask "what's this entity's most relevant future vector right now": `runtime.active_vector()`, `context_broker.get_active_vectors().X[0]?.text` (via `KnowledgeCache_*`), and `temporal_engine.format(entity.future, ctx, {mode:'future', limit:1, vector_text:true})` (the one actually used for the `<SYSTEM objective="...">` attribute). Standardize on the `temporal_engine.format`/`score` path (it's the only RAG-scored one), and remove `runtime.active_vector`/`active_vectors` plus the `KnowledgeCache_*` mirror in `context.svelte.js` (retaining `dynamics_scan`-based `is_suspicious`, which is independent and still used).

Separately: `runtime.simulation.{is_ready,story_id,round,turn_type,simulation_log}` are 1:1 duplicates of top-level `runtime.{is_ready,story_id,round,turn_type,simulation_log}` (same backing variables, two access paths). Collapse to one surface; update `context.svelte.js`'s `manage_vector_lifecycle` (`get_path_value(runtime.simulation, req_key)` fallback) to use `runtime` directly.

### Phase 6 — Data-Model Field Cleanup

For `_backup_state`, `_last_update_msg_id`, `is_snapshot`/`isSnapshot`, `is_chosen`/`isChosen`, `associated_ids`/`associatedIds`, `story.entity_snapshots`: per-field decision between "implement" and "excise in next `db.version()` bump." Priority order:

1. `story.entity_snapshots` — closest to complete (Phase-3.7 above); add a write site in `session_driver.create_from_selection` stamping `entity_snapshots` from the selected AI/Fractal's `dynamics`.
2. Everything else — confirm intent with whoever scoped them, then either build or strip from `normalize()`, `ENTITY_TEMPLATES`, and the Dexie `isChosen` index.

Also: wire `coerce_temporal_array` into `normalize()`'s `past`/`future` handling (replace `Array.isArray(x) ? x : []`), or delete it if legacy string-form data is confirmed not to occur.

For `ENTITY_CATALOG["future.*"]`/`["past.*"]`: special-case `build_entity_catalog()` to skip per-field flattening for array-type sections (since `to_data_points` can never use array-valued or `.text`-on-array results), removing ~24 inert catalog entries.

For `parse_message().sceneData`: either implement structured-scene extraction, or drop the field.

### Phase 7 — Trim Confirmed-Dead Module Exports

- `engine/utils.js`: `debounce` has no callers — remove. `clamp` has no callers, but `ui/atoms/DynamicsMeter.svelte`'s `decrease`/`increase`/`handle_input` each hand-roll `Math.max(0, Math.min(100, ...))` — replace those three with `clamp(val, 0, 100)` instead of deleting it.
- `engine/logger.svelte.js`: remove `error`, `initDebugMode`, `setDebug` (self-documented as legacy, zero callers).
- `media/optics.js`: `PromptTemplates.ENHANCE`/`BUILDER` are fully dead and notably _more_ sophisticated (entity-aware, history-aware) than the inline prompt strings currently used in `visual_engine.enhance()`/`.visualize()`. Recommend swapping the inline strings for `PromptTemplates` rather than deleting — looks like the intended implementation.
- `media/tokens.js`: remove `IMG_RESOLUTION`, `PROFILE_PICTURE_PLACEHOLDERS`, `get_contrast_color`, `darken_color` from `media/index.js`'s export list (no external callers; `get_deterministic_color`/`resolve_token` stay — used internally).
- `intelligence/fragments.js`: remove `PROFILE_SECTIONS` (self-documented "Deprecated") and its export from `intelligence/index.js`.
- `state/log.svelte.js`: remove `SimulationLogStore.remove`/`.clear`, or adopt them in `delete_log_entry`/story-switch flows to avoid full DB re-reads (minor perf win either way).

### Phase 8 — Decide Refusal-Detection / Visual-Authorization Scaffolding

Either wire `MESSAGES.REFUSAL_TRIGGERS` into `validate_and_repair_response()` (intelligence/kernel.js) to detect+retry on AI-refusal phrasing — genuinely useful for a Perchance-backed model that may occasionally hit upstream guardrails — and implement `Security.checkRefusal`/`authorizeVisuals` for real, or remove all three as unused placeholders.

### Phase 9 — `bridge.js` Disposition

Per Section 2: confirm against compiled/Perchance-side code, then delete if confirmed unused.

---

That's the full sweep. The good news, structurally speaking: nothing here is a _live_ bug — it's all dormant capability or harmless dead weight. The bad news is that "dormant capability" describes roughly a third of the interesting features in this codebase (interrupts, epilogues, photo generation, view-aware context, per-character dynamics gravity) — they're built, they're tested, and they're currently doing absolutely nothing for the person playing the game.
