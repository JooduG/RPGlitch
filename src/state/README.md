# Reactive State Stores (`src/state/`)

## Overview

Rank 3 Svelte 5 rune store layer (`@state`) owning reactive simulation kernel state, session feed orchestration, navigation/UI modal state, macro phase/watchdog state, LLM token streaming, and developer telemetry. Connects `@data` and `@media` to `@engine` and `@ui` without upward imports.

## Interface

- [`index.js`](./index.js): Barrel re-exporting all `@state` modules below.
- [`chat.svelte.js`](./chat.svelte.js):
  - `ChatLogStore`, `simulation_log` — reactive session feed (`feed`, `active_id`, `#id_set`) with `refresh`, `add`, `update`, `remove`, `delete_entry`, `edit_entry`, `update_attachment`, `delete_attachment`, `clear`.
  - `session_driver` — reactive facade over `@data` session persistence (`active_id`, `on_set_active`, `on_clear_active`, `require_active`, `set_active`, `restore_active`, `clear_active`, `create_from_selection`, `send`, `regenerate`, `log_message`, `load_log`, entry/attachment CRUD).
- [`devlog.svelte.js`](./devlog.svelte.js): `DEVELOPER_TELEMETRY_STORAGE_KEY` (`"dev_telemetry"`), `DeveloperLogStore`, `developer_log` (`entries`, `log`, `flush`, `hydrate`, `clear`).
- [`interface.svelte.js`](./interface.svelte.js):
  - `InterfaceStore`, `app` — central UI/navigation/storyboard/settings store (`view`, modals, viewport, `selected_*`, `claimed_entity_ids`, `card_hand`, `settings`, `editing_entity`, `init`, `save_settings`, `set_view`, `toggle_profile`, `load_entities`, `select_entity`, streaming/image-preview proxies).
  - `image_preview` — reactive lightbox getter (`open_image_preview`, `close_image_preview`).
  - `image_picker` — regeneration candidate picker (`start_regenerate`, `deliver_candidates`, `open_picker`, `select_candidate`, `begin_picker_regeneration`, `close_picker`, `close_regenerate`, `set_regenerate_error`, `get_persisted_meta`, `run_image_regeneration`).
- [`runtime.svelte.js`](./runtime.svelte.js): `RuntimeEngineStore`, `runtime` (`active_user`, `active_ai`, `active_fractal`, `active_npcs`, `round`, `turn_type`, `is_ready`, `ai`/`fractal` physics, `story_id`, `active_story`, foreground/background mutexes, stagnation/drift, director latency pool, `init_effects`, `teardown_effects`, `sync`, `save`, entity CRUD, `_debug_inject`).
- [`status.svelte.js`](./status.svelte.js): `SimulationStateStore`, `simulation_state` (`"idle" | "generating" | "locked"`, `intent_active`, `busy`, `is_consolidating`, thinking/media stage mutators), `UIStateStore`, `ui_state`, `install_freeze_watchdog`, `uninstall_freeze_watchdog`, `force_recover_simulation`.
- [`streaming.svelte.js`](./streaming.svelte.js): `StreamingStore`, `streaming` (`active`, `content`, `node_id`, `role`, `abort_controller`, `start_stream`, `update_stream`, `end_stream`, `trigger_interrupt`).

## Invariants

- **One-Way Session DAG (`chat.svelte.js:session_driver`)**: Never imports `runtime`; `runtime` sync and reset flow through boot-wired `on_set_active` / `on_clear_active` hooks. `require_active` throws if `simulation_log.active_id` is falsy.
- **Feed Deduplication & Pruning (`chat.svelte.js:ChatLogStore`)**: `add` deduplicates by `id` via `#id_set` and stamps missing `entity_id` via `resolve_entity_id_by_name`. `delete_attachment` removes the feed entry if it becomes empty.
- **Telemetry Cap (`devlog.svelte.js:DeveloperLogStore.log`)**: Caps in-memory `#entries` and persisted slice to `TELEMETRY_CAPS.DEVELOPER_LOG_ENTRIES`.
- **Zero Upward UI Imports (`interface.svelte.js:InterfaceStore`)**: Never imports from `src/ui/`; UI modals register `regenerate_image_handler` and `take_photo_handler` externally. `clean_claimed_selections` clears claimed slots only when `force` is true or `view === "storyboard"`. `run_image_regeneration` errors via `set_regenerate_error` if fewer than 2 candidates are generated.
- **Story ID & Auto-Save Guard (`runtime.svelte.js:RuntimeEngineStore`)**: `story_id` reads from `session_driver.active_id` and sets via `restore_active`. `sync` holds `#auto_save_suspended = true` during hydration. Setting `ai`/`fractal` mirrors onto entity `dynamics` with `default_dynamics_for_scope` fallback. `record_turn_drift` clamps drift to `[0.0, 1.0]`, incrementing `stagnation_turns` when `< 0.15` and resetting otherwise.
- **Busy & Watchdog Guards (`status.svelte.js`)**: `busy` is `phase === "generating" || intent_active`; `is_consolidating` is `phase === "idle" && intent_active`. `install_freeze_watchdog` uses singleton guard `_freeze_watchdog_started` and skips recovery while `get_queue_status().foreground_queued > 0`.

## Side Effects

- **IndexedDB Writes (`chat.svelte.js`, `devlog.svelte.js`, `runtime.svelte.js`)**: `session_driver` persists active session IDs, timestamps, and log entries via `@data`; `DeveloperLogStore.log` schedules a `500ms` debounced write to `db.kv_settings` and registers `pagehide`/`visibilitychange` flush listeners; `RuntimeEngineStore.init_effects` installs `$effect.root` auto-saving round, dynamics, beat rounds, and drift/stagnation to `db.stories`.
- **Browser Globals & DOM (`interface.svelte.js`, `runtime.svelte.js`)**: Assign `window.app`, `window.visual`, and `window.runtime` in browser environments; `InterfaceStore.init` attaches `matchMedia` listeners and installs the freeze watchdog; `toggle_profile` sets `--active-signature-color` on `document.documentElement.style` and triggers `guarded_transition`; `select_candidate` schedules a `400ms` `close_regenerate()` timer.
- **Watchdog & Stream Abort (`status.svelte.js`, `streaming.svelte.js`)**: `install_freeze_watchdog` starts a `window.setInterval` at `TIMING_MS.HEARTBEAT`; `force_recover_simulation` resets stores, aborts `streaming.abort_controller`, stops `Audio.voice`, and ends the stream; `StreamingStore` drives `Audio.voice` TTS on stream lifecycle events.

## Verification

- Run state unit tests: `npx vitest run src/state/`
