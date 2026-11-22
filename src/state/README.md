# Reactive State Stores (`src/state/`)

## Overview

Rank 3 Svelte 5 rune store layer (`@state`) owning shared cross-subsystem state across a strictly acyclic one-way DAG (`session` -> `execution` / `interface`). Connects `@data` and `@media` to `@engine` and `@ui` without upward imports.

## Interface

- [`index.js`](./index.js): Barrel re-exporting all `@state` modules below.
- [`interface.svelte.js`](./interface.svelte.js): `InterfaceStore`, `app` — Rank 3 leaf store owning top-level navigation (`view`, `control_panel_open`, `profile_open`, `editing_entity`), viewport observers (`viewport`), persistent `settings`, `stories_version`, `ghostwrite_request`/`is_ghostwriting`, and storyboard draft staging (`selected_*`, `*_list`, `claimed_entity_ids`, `card_hand`, `prologue`, `story_title`, `begin_story_pending`, `suppress_card_transitions`).
- [`execution.svelte.js`](./execution.svelte.js): `ExecutionStore`, `execution`, `install_freeze_watchdog`, `uninstall_freeze_watchdog` — unified turn execution state machine (`phase`, `intent_active`, `loading`, `busy`, `director_thinking`, `speaker_thinking`, `media_generating`, `generating_entity`), live LLM stream (`stream`, `start_stream`, `update_stream`, `end_stream`, `interrupt`), and freeze watchdog / forced recovery (`recover`).
- [`session.svelte.js`](./session.svelte.js): `SessionStore`, `session` — unified active story session (`active_id`, `is_ready`, `round`, `turn_type`, `active_story`), active cast & live dynamics (`active_ai`, `active_user`, `active_fractal`, `active_npcs`, `ai_dynamics`, `fractal_dynamics`), reactive feed (`feed`, `refresh_feed`, `add`, `update`, `remove`, `clear_feed`), session/log CRUD (`set_active`, `clear_active`, `create_from_selection`, `send_user_message`, `rollback_for_retry`, `log_message`, `load_log`, `delete_entry`, `edit_entry`, `update_attachment`, `delete_attachment`), entity persistence (`save_entity`, `update_entity`, `delete_entity`), and auto-save `$effect.root`.

## Invariants

- **Acyclic One-Way `@state` DAG**: `interface.svelte.js` and `execution.svelte.js` have zero sibling `@state` imports; `session.svelte.js` imports `./interface.svelte.js` and `./execution.svelte.js` one-way.
- **Draft vs Active Cast Separation (`session.svelte.js`)**: `session.sync()` hydrates `session.active_*` and updates `app.set_active_story_title()`, never overwriting `app.selected_*` storyboard draft slots.
- **Single Execution Busy Gate (`execution.svelte.js`)**: `execution.busy` is `phase === "generating" || intent_active || loading`; `execution.recover()` clears all three locks, aborts `stream.abort_controller`, stops `Audio.voice`, and ends the stream.
- **Feed Deduplication (`session.svelte.js`)**: `add` deduplicates by `id` via `#id_set` and stamps missing `entity_id` via `resolve_entity_id_by_name`; `delete_attachment` removes the feed entry if it becomes empty.

## Side Effects

- **IndexedDB Writes (`interface.svelte.js`, `session.svelte.js`)**: `InterfaceStore` hydrates/writes `db.kv_settings["rpg_settings"]`; `SessionStore` persists active session pointers, logs, entities, and auto-saves story snapshots to `db.stories`.
- **Browser & Watchdog Timers (`interface.svelte.js`, `execution.svelte.js`)**: `InterfaceStore.init_viewport()` attaches `matchMedia` listeners and `toggle_profile` updates `--active-signature-color` + triggers `guarded_transition`; `install_freeze_watchdog()` runs a `TIMING_MS.HEARTBEAT` interval; `ExecutionStore` drives `Audio.voice` TTS on stream events.

## Verification

- Run: `npm test` (or `npx vitest run src/state/`)
