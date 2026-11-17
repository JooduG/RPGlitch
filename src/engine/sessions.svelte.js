/**
 * src/engine/sessions.svelte.js
 * 📜 SESSION DRIVER - story sessions & simulation-log orchestration (facade)
 *
 * Thin reactive shell over the pure persistence service (`src/data/session.js`,
 * Rank 2). Owns the RAM-held active pointer, the Svelte-rune boundary
 * ($state.snapshot lives HERE, never in data/), and the composition-root
 * bindings. All IndexedDB I/O and log writers live in session.js.
 *
 * Strict one-way DAG: this module NEVER imports `runtime`
 * (nor `simulation_log`/`status`). Runtime context arrives as parameters
 * (`snapshots`, `story_id`, `round`); when omitted, pure-DB fallbacks apply
 * (story row snapshots/round, entity name scan). Reactive-feed notification
 * and runtime sync travel through bindings installed by the composition root
 * (`bind_session_driver` in `src/main.js`), never through direct imports.
 *
 * DOMAINS (implementations in src/data/session.js):
 *   1. Session Pointer Management (`active_id`, `set_active`, `clear_active`, `restore_active`, `require_active`)
 *   2. Story Session Creation (`create_from_selection`)
 *   3. Simulation Log Orchestration (`send`, `log_message`, `load_log`, `edit_log_entry`, `delete_log_entry`, `update_log_attachment`, `delete_log_attachment`, `regenerate`)
 *
 * RULES FOR MODIFICATION:
 *   - Never import `runtime` or `simulation_log` (directly or via `state_bridge`).
 *   - Same-layer `simulation_state` is imported directly; bridge use is limited
 *     to the `stories_bridge` bump (inside session.js).
 *   - `$state.snapshot()` calls stay in THIS file before crossing into data/.
 *   - Adhere strictly to P4: Zero Backwards Compatibility and full descriptive naming.
 */

import {
  bind_session_store,
  clear_active_session_id as clear_persisted_active_session,
  create_from_selection as create_story_from_selection,
  delete_log_attachment as remove_log_attachment,
  delete_log_entry as remove_log_entry,
  edit_log_entry as edit_stored_log_entry,
  load_log as load_story_log,
  log_message as write_log_message,
  record_session_access,
  regenerate as regenerate_trailing_turns,
  send as send_user_turn,
  set_active_session_id as persist_active_session,
  update_log_attachment as update_stored_log_attachment,
} from "@data";
import { simulation_state } from "./status.svelte.js";

export { match_speaker_snapshots, resolve_log_entity_id } from "@data";

/**
 * Bound environment installed once by the composition root (`src/main.js`):
 * reactive-feed notification goes through `log_store`, runtime sync through
 * the set/clear hooks — never through direct engine imports.
 * @type {{ log_store: any, on_set_active: ((id: string) => Promise<void>) | null, on_clear_active: (() => void) | null }}
 */
let _environment = { log_store: null, on_set_active: null, on_clear_active: null };

/**
 * Installs the reactive-feed store and runtime sync hooks. Invoked once at boot.
 * Forwards the feed sink into the pure session store.
 * @param {{ log_store?: any, on_set_active?: ((id: string) => Promise<void>) | null, on_clear_active?: (() => void) | null }} environment
 */
export function bind_session_driver(environment = {}) {
  if (environment.log_store !== undefined) _environment.log_store = environment.log_store ?? null;
  if (environment.on_set_active !== undefined) _environment.on_set_active = environment.on_set_active ?? null;
  if (environment.on_clear_active !== undefined) _environment.on_clear_active = environment.on_clear_active ?? null;
  bind_session_store({ log_store: _environment.log_store });
}

/** @type {string | null} */
let _active_id = null;

// ============================================================================
// SESSION DRIVER (reactive shell; persistence lives in @data/session.js)
// ============================================================================

export const session_driver = {
  /**
   * The currently active story session ID held in RAM.
   * @returns {string | null}
   */
  get active_id() {
    return _active_id;
  },

  /**
   * Returns the active story ID or throws if none is active.
   * @returns {string}
   */
  require_active() {
    if (!_active_id) throw new Error("[Session] No active session found.");
    return _active_id;
  },

  /**
   * Sets the active session ID and persists it to IndexedDB kv_settings and history.
   * Runtime sync + feed refresh travel through the bound hooks (composition root).
   * @param {string} id
   * @returns {Promise<void>}
   */
  async set_active(id) {
    _active_id = id;
    if (typeof window !== "undefined") {
      await persist_active_session(id);
      await record_session_access(id);
    }
    if (_environment.on_set_active) {
      await _environment.on_set_active(id);
    }
  },

  /**
   * Restores active session ID in RAM without redundant DB writes (used during sync).
   * @param {string} id
   */
  restore_active(id) {
    _active_id = id;
  },

  /**
   * Clears active session state. Runtime reset + feed clear travel through the
   * bound hook (composition root); the simulation-state unlock stays on the bridge.
   * @returns {Promise<void>}
   */
  async clear_active() {
    _active_id = null;
    simulation_state?.unlock?.();
    if (typeof window !== "undefined") {
      await clear_persisted_active_session();
    }
    if (_environment.on_clear_active) {
      await _environment.on_clear_active();
    }
  },

  /**
   * Creates a new story record from a character/fractal storyboard selection,
   * auto-seeding the cast roster with connected NPCs and Wanderers.
   * @param {Record<string, any>} selection
   * @returns {Promise<string>}
   */
  async create_from_selection(selection) {
    return await create_story_from_selection(selection, { log_store: _environment.log_store, set_active: (id) => session_driver.set_active(id) });
  },

  /**
   * Logs a user turn message in the simulation log. Speaker name and round
   * resolve from the active story row (no runtime dependency).
   * @param {string} text
   * @returns {Promise<any>}
   */
  async send(text) {
    return await send_user_turn(text, { active_id: _active_id, log_store: _environment.log_store });
  },

  /**
   * Removes trailing turns back to the last user message to allow regeneration.
   * Consolidated single pass for efficiency.
   * @returns {Promise<void>}
   */
  async regenerate() {
    return await regenerate_trailing_turns({ active_id: _active_id, log_store: _environment.log_store });
  },

  /**
   * Deletes a single simulation log entry by ID or metadata reference.
   * @param {string | number} id
   * @returns {Promise<void>}
   */
  async delete_log_entry(id) {
    return await remove_log_entry(id, { log_store: _environment.log_store });
  },

  /**
   * Updates text for an existing simulation log entry, with optional meta merge.
   * @param {string | number} id
   * @param {string} new_text
   * @param {Record<string, any> | null} [meta_patch=null]
   * @returns {Promise<void>}
   */
  async edit_log_entry(id, new_text, meta_patch = null) {
    return await edit_stored_log_entry(id, new_text, meta_patch, { log_store: _environment.log_store });
  },

  /**
   * Updates an attachment at a specific index in a log entry.
   * @param {string | number} id
   * @param {number} attachment_index
   * @param {Record<string, any>} new_attachment
   * @returns {Promise<void>}
   */
  async update_log_attachment(id, attachment_index, new_attachment) {
    return await update_stored_log_attachment(id, attachment_index, $state.snapshot(new_attachment), { log_store: _environment.log_store });
  },

  /**
   * Removes an attachment from a log entry (or deletes the entry if it becomes empty).
   * @param {string | number} id
   * @param {number} attachment_index
   * @returns {Promise<void>}
   */
  async delete_log_attachment(id, attachment_index) {
    return await remove_log_attachment(id, attachment_index, { log_store: _environment.log_store });
  },

  /**
   * Single orchestrated log writer: appends a narrative message to the
   * simulation log with snapshot-safe metadata, stamps the speaker entity id,
   * and notifies the bound reactive feed. System telemetry goes through here
   * too (`turn_type: "SYSTEM_TURN"`).
   * @param {string} text
   * @param {string} role
   * @param {string} character_name
   * @param {Object} [options]
   * @param {string} [options.turn_type="USER_TURN"]
   * @param {Record<string, any>} [options.meta={}]
   * @param {any[]} [options.attachments=[]]
   * @param {string|number|null} [options.story_id=null]
   * @param {number|null} [options.round=null] - defaults to the story row's round
   * @param {string|null} [options.entity_id=null]
   * @param {{ AI?: any, USER?: any, FRACTAL?: any, NPCS?: any } | null} [options.snapshots=null]
   * @returns {Promise<Record<string, any>>}
   */
  async log_message(
    text,
    role,
    character_name,
    { turn_type = "USER_TURN", meta = {}, attachments = [], story_id = null, entity_id = null, round = null, snapshots = null } = {},
  ) {
    return await write_log_message(
      text,
      role,
      character_name,
      {
        turn_type,
        meta: meta ? $state.snapshot(meta) : meta,
        attachments: attachments && attachments.length > 0 ? $state.snapshot(attachments) : attachments,
        story_id,
        entity_id,
        round,
        snapshots: snapshots ? $state.snapshot(snapshots) : snapshots,
      },
      { log_store: _environment.log_store },
    );
  },

  /**
   * Fetches the full simulation log history for a given story.
   * @param {string|number} story_id
   * @returns {Promise<any[]>}
   */
  async load_log(story_id) {
    return await load_story_log(story_id);
  },
};
