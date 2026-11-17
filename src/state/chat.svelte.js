/**
 * src/state/chat.svelte.js
 * 💬 CHAT STORE: Reactive Simulation Log Feed & Session Driver Facade
 * (Rank 3, state)
 *
 * Core Responsibilities:
 * - Owns the reactive active session dialogue log entries (`feed`) rendered
 *   by the UI message stack, plus the reactive active story pointer
 *   (`active_id`, upgraded from a non-reactive module `let` to `$state`).
 * - Wraps the pure persistence service (`src/data/session.js`, Rank 2)
 *   directly so IndexedDB writes and `feed` updates happen in one place.
 * - Single orchestrated log writer (`session_driver.log_message`) stamps the
 *   speaker entity id and notifies the bound reactive feed.
 * - Provides the session pointer lifecycle (require/set/restore/clear) with
 *   explicit boot-wired hooks (`on_set_active` / `on_clear_active` installed
 *   by the composition root in `src/main.js`) — no callback bridge.
 *
 * Dependencies & Layer Boundaries:
 * - `@data` (persistence CRUD + kv_settings + pure session fns).
 * - `@simulation` (`resolve_entity_id_by_name`, `match_speaker_snapshots`
 *   re-exported for barrel stability).
 * - `./status.svelte.js` (`simulation_state`, same layer).
 * - NEVER imports `runtime` (strict one-way `runtime` → chat DAG; runtime
 *   context arrives as parameters or via the boot-wired hooks).
 */

import { SvelteSet } from "svelte/reactivity";
import {
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
import { resolve_entity_id_by_name } from "@simulation";
import { simulation_state } from "./status.svelte.js";

// ============================================================================
// [SECTION 1: JSDOC SCHEMAS & TYPE DEFINITIONS]
// ============================================================================

/**
 * @typedef {Object} LogEntry
 * @property {string | number} [id] - Unique message identifier or database primary key.
 * @property {'user' | 'ai' | 'fractal' | 'system' | 'narrator' | string} role - Message sender role.
 * @property {string} [type] - Message category or system event type.
 * @property {string} text - Message body or dialogue prose.
 * @property {string} [turn_type] - Temporal turn category.
 * @property {string} [character_name] - Name of speaking entity.
 * @property {string | null} [entity_id] - Canonical entity id of the speaker (stamped at creation; prompt compilation emits `<ENTRY origin="entity_id">` directly).
 * @property {number} [round] - Round number when message was recorded.
 * @property {Record<string, any>} [meta] - Telemetry metadata, tags, dynamics, or prologue/epilogue flags.
 * @property {number} [created_at] - Creation timestamp in milliseconds.
 * @property {string} [story_id] - Associated story identifier.
 * @property {string | Date | number} [timestamp] - Display timestamp.
 * @property {string[]} [attachments] - Array of base64 data URLs or asset paths.
 */

// ============================================================================
// [SECTION 2: CHAT LOG STORE CLASS]
// ============================================================================

export class ChatLogStore {
  /** @type {LogEntry[]} */
  feed = $state([]);

  /** @type {string | null} */
  active_id = $state(null);

  /** @type {SvelteSet<string | number>} */
  #id_set = new SvelteSet();

  /** @type {string | number | null} Last story id loaded (zero-arg refresh fallback). */
  #last_story_id = null;

  /**
   * Synchronizes in-memory feed with persistence for the given story.
   * @param {string | number | null} [story_id=null] - defaults to the last loaded story
   */
  async refresh(story_id = null) {
    const effective_story_id = story_id ?? this.#last_story_id;
    if (!effective_story_id) {
      this.clear();
      return;
    }
    this.#last_story_id = effective_story_id;

    const messages = await load_story_log(effective_story_id);
    this.feed = messages;
    this.#id_set = new SvelteSet(messages.filter((m) => m.id != null).map((m) => m.id));
  }

  /**
   * Appends a log entry to the feed if not already present.
   * Stamps `entity_id` when missing and speaker snapshots are provided.
   * @param {LogEntry} entry - The log entry to append.
   * @param {{ AI?: any, USER?: any, FRACTAL?: any, NPCS?: any } | null} [snapshots=null]
   */
  add(entry, snapshots = null) {
    if (entry.id != null && this.#id_set.has(entry.id)) return;
    if (entry.id != null) this.#id_set.add(entry.id);
    if (entry && entry.entity_id == null && entry.character_name) {
      const stamped = resolve_entity_id_by_name(entry.character_name, snapshots);
      if (stamped) entry = { ...entry, entity_id: stamped };
    }
    this.feed.push(entry);
  }

  /**
   * Updates an existing entry in the in-memory feed.
   * Matches against entry `id` or `meta.id`.
   * @param {string | number} id
   * @param {Partial<LogEntry>} updates
   */
  update(id, updates) {
    const target = this.feed.find((entry) => entry.id === id || entry.meta?.id === id || String(entry.id) === String(id));
    if (target) {
      Object.assign(target, updates);
    }
  }

  /**
   * Removes an entry from the in-memory feed by identifier.
   * @param {string | number} id
   */
  remove(id) {
    const index = this.feed.findIndex((entry) => entry.id === id || entry.meta?.id === id || String(entry.id) === String(id));
    if (index !== -1) {
      const removed_id = this.feed[index].id;
      this.feed.splice(index, 1);
      if (removed_id != null) this.#id_set.delete(removed_id);
    }
  }

  /**
   * Deletes a log entry from persistence and removes it from the in-memory feed.
   * @param {string | number} id
   */
  async delete_entry(id) {
    await remove_log_entry(id, { log_store: this });
  }

  /**
   * Updates text for an existing log entry in persistence and mirrors the
   * change in the in-memory feed, with optional meta merge (prologue /
   * continuation persistence).
   * @param {string | number} id
   * @param {string} new_text
   * @param {Record<string, any> | null} [meta_patch=null]
   */
  async edit_entry(id, new_text, meta_patch = null) {
    await edit_stored_log_entry(id, new_text, meta_patch, { log_store: this });
  }

  /**
   * Updates an attachment at a specific index in a log entry.
   * @param {string | number} id
   * @param {number} attachment_index
   * @param {Record<string, any>} new_attachment
   */
  async update_attachment(id, attachment_index, new_attachment) {
    await update_stored_log_attachment(id, attachment_index, $state.snapshot(new_attachment), { log_store: this });
  }

  /**
   * Removes an attachment from a log entry (or deletes the entry if it becomes
   * empty), keeping the in-memory feed in sync with persistence.
   * @param {string | number} id
   * @param {number} attachment_index
   */
  async delete_attachment(id, attachment_index) {
    await remove_log_attachment(id, attachment_index, { log_store: this });
    // The persistence layer notifies remove/update through the log_store sink
    // above; mirror explicitly so the feed can never drift when the sink shape
    // changes (previously the feed kept a ghost of the edited entry).
    const key = isNaN(Number(id)) ? id : Number(id);
    const target = this.feed.find((entry) => entry.id === key || entry.id === id || String(entry.id) === String(id));
    if (!target) {
      this.remove(key);
      this.remove(id);
      return;
    }
    if (!target.text?.trim() && !(target.attachments || []).some((a) => a && a.src != null)) {
      this.remove(key);
      this.remove(id);
    }
  }

  /**
   * Empties the in-memory feed and resets the ID deduplication cache.
   */
  clear() {
    this.feed = [];
    this.#id_set.clear();
  }
}

// ============================================================================
// [SECTION 3: SESSION DRIVER FACADE]
// ============================================================================

/**
 * Reactive shell over the pure persistence service (`src/data/session.js`,
 * Rank 2). Owns the RAM-held active pointer as a Svelte 5 `$state` rune on
 * the chat store (`simulation_log.active_id`) and the composition-root
 * hooks. All IndexedDB I/O and log writers live in session.js.
 *
 * Strict one-way DAG: this module NEVER imports `runtime`
 * (nor `simulation_state` beyond the unlock call below). Runtime context
 * arrives through the boot-wired hooks — never through direct imports.
 */
export const session_driver = {
  /**
   * Boot-wired hook: runs after set_active persists (runtime sync + feed
   * refresh). Installed once by the composition root (`src/main.js`).
   * @type {((id: string) => Promise<void>) | null}
   */
  on_set_active: null,

  /**
   * Boot-wired hook: runs after clear_active nulls the pointer (feed clear).
   * Installed once by the composition root (`src/main.js`).
   * @type {(() => void | Promise<void>) | null}
   */
  on_clear_active: null,

  /**
   * The currently active story session ID held in RAM (reactive).
   * @returns {string | null}
   */
  get active_id() {
    return simulation_log.active_id;
  },

  /**
   * Returns the active story ID or throws if none is active.
   * @returns {string}
   */
  require_active() {
    if (!simulation_log.active_id) throw new Error("[Session] No active session found.");
    return simulation_log.active_id;
  },

  /**
   * Sets the active session ID and persists it to IndexedDB kv_settings and history.
   * Runtime sync + feed refresh travel through the bound hook (composition root).
   * @param {string} id
   * @returns {Promise<void>}
   */
  async set_active(id) {
    simulation_log.active_id = id;
    if (typeof window !== "undefined") {
      await persist_active_session(id);
      await record_session_access(id);
    }
    if (this.on_set_active) {
      await this.on_set_active(id);
    }
  },

  /**
   * Restores active session ID in RAM without redundant DB writes (used during sync).
   * @param {string} id
   */
  restore_active(id) {
    simulation_log.active_id = id;
  },

  /**
   * Clears active session state. The simulation-state unlock stays local;
   * runtime reset + feed clear travel through the bound hook (composition root).
   * @returns {Promise<void>}
   */
  async clear_active() {
    simulation_log.active_id = null;
    simulation_state?.unlock?.();
    if (typeof window !== "undefined") {
      await clear_persisted_active_session();
    }
    if (this.on_clear_active) {
      await this.on_clear_active();
    }
  },

  /**
   * Creates a new story record from a character/fractal storyboard selection,
   * auto-seeding the cast roster with connected NPCs and Wanderers.
   * @param {Record<string, any>} selection
   * @returns {Promise<string>}
   */
  async create_from_selection(selection) {
    return await create_story_from_selection(selection, { log_store: simulation_log, set_active: (id) => this.set_active(id) });
  },

  /**
   * Logs a user turn message in the simulation log. Speaker name and round
   * resolve from the active story row (no runtime dependency).
   * @param {string} text
   * @returns {Promise<any>}
   */
  async send(text) {
    return await send_user_turn(text, { active_id: simulation_log.active_id, log_store: simulation_log });
  },

  /**
   * Removes trailing turns back to the last user message to allow regeneration.
   * Consolidated single pass for efficiency.
   * @returns {Promise<void>}
   */
  async regenerate() {
    return await regenerate_trailing_turns({ active_id: simulation_log.active_id, log_store: simulation_log });
  },

  /**
   * Deletes a single simulation log entry by ID or metadata reference.
   * @param {string | number} id
   * @returns {Promise<void>}
   */
  async delete_log_entry(id) {
    return await remove_log_entry(id, { log_store: simulation_log });
  },

  /**
   * Updates text for an existing simulation log entry, with optional meta merge.
   * @param {string | number} id
   * @param {string} new_text
   * @param {Record<string, any> | null} [meta_patch=null]
   * @returns {Promise<void>}
   */
  async edit_log_entry(id, new_text, meta_patch = null) {
    return await edit_stored_log_entry(id, new_text, meta_patch, { log_store: simulation_log });
  },

  /**
   * Updates an attachment at a specific index in a log entry.
   * @param {string | number} id
   * @param {number} attachment_index
   * @param {Record<string, any>} new_attachment
   * @returns {Promise<void>}
   */
  async update_log_attachment(id, attachment_index, new_attachment) {
    return await update_stored_log_attachment(id, attachment_index, $state.snapshot(new_attachment), { log_store: simulation_log });
  },

  /**
   * Removes an attachment from a log entry (or deletes the entry if it becomes empty).
   * @param {string | number} id
   * @param {number} attachment_index
   * @returns {Promise<void>}
   */
  async delete_log_attachment(id, attachment_index) {
    return await remove_log_attachment(id, attachment_index, { log_store: simulation_log });
  },

  // Legacy short-name aliases (pre-Phase-4 session_driver API). Kept so older
  // callers/tests using delete_entry/edit_entry keep working; canonical names
  // are delete_log_entry/edit_log_entry/delete_log_attachment.
  async delete_entry(id) {
    return await remove_log_entry(id, { log_store: simulation_log });
  },
  async edit_entry(id, new_text, meta_patch = null) {
    return await edit_stored_log_entry(id, new_text, meta_patch, { log_store: simulation_log });
  },
  async update_attachment(id, attachment_index, new_attachment) {
    return await update_stored_log_attachment(id, attachment_index, $state.snapshot(new_attachment), { log_store: simulation_log });
  },
  async delete_attachment(id, attachment_index) {
    return await remove_log_attachment(id, attachment_index, { log_store: simulation_log });
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
      { log_store: simulation_log },
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

// ============================================================================
// [SECTION 4: SINGLETON INSTANCES & EXPORTS]
// ============================================================================

export const simulation_log = new ChatLogStore();
