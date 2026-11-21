/**
 * @file src/state/session.svelte.js
 * Unified active story session, cast/dynamics kernel, reactive feed, and
 * persistence synchronization store (Rank 3, state).
 *
 * Imports `./interface.svelte.js` and `./execution.svelte.js` strictly one-way
 * so no circular imports, `_app_sink`, or `main.js` boot hooks are needed.
 */

import {
  clear_active_session_id,
  clear_session_checkpoint,
  coerce_story_key,
  create_from_selection as create_story_from_selection,
  db,
  delete_log_attachment,
  delete_log_entry,
  edit_log_entry,
  entities,
  load_log as load_story_log,
  load_session_checkpoint,
  log_message as write_log_message,
  record_session_access,
  regenerate as regenerate_trailing_turns,
  send as send_user_turn,
  SESSION_ID_KEY,
  set_active_session_id,
  update_log_attachment,
} from "@data";
import { default_dynamics_for_scope } from "@definitions";
import { decompose_story_title, resolve_entity_id_by_name } from "@simulation";
import { get_signature_color } from "@utils";
import { SvelteSet } from "svelte/reactivity";
import { execution } from "./execution.svelte.js";
import { app } from "./interface.svelte.js";

/**
 * @typedef {Object} EntityDynamics
 * @property {number} [chaos]
 * @property {number} [intensity]
 * @property {number} [openness]
 * @property {number} [affinity]
 * @property {number} [velocity]
 * @property {number} [entropy]
 */

/**
 * @typedef {Object} SimulationEntity
 * @property {string | number | null} id
 * @property {string} name
 * @property {string} [description]
 * @property {{ physical: string, non_physical: string }} eternal
 * @property {{ physical: string, non_physical: string }} present
 * @property {string | any[]} past
 * @property {string} future
 * @property {EntityDynamics} dynamics
 * @property {EntityDynamics} [dynamics_baseline]
 * @property {Record<string, any>} [voice]
 * @property {string | null} [profile_picture]
 * @property {string} [signature_color]
 * @property {Record<string, any>} [modifiers]
 * @property {string[]} [associated_ids]
 */

/**
 * @typedef {Object} LogEntry
 * @property {string | number} [id]
 * @property {'user' | 'ai' | 'fractal' | 'system' | 'narrator' | string} role
 * @property {string} [type]
 * @property {string} text
 * @property {string} [turn_type]
 * @property {string} [character_name]
 * @property {string | null} [entity_id]
 * @property {number} [round]
 * @property {Record<string, any>} [meta]
 * @property {number} [created_at]
 * @property {string} [story_id]
 * @property {string | Date | number} [timestamp]
 * @property {any[]} [attachments]
 */

export class SessionStore {
  // --- ACTIVE SESSION & CHRONOLOGY ---
  /** @type {string | null} */
  active_id = $state(null);
  is_ready = $state(false);
  round = $state(0);
  turn_type = $state("USER_TURN");
  last_director_beat_round = $state(-1);
  last_dynamics_beat_round = $state(-1);
  back_shot_cursor = $state(0);

  // --- ACTIVE CAST & STORY DYNAMICS ---
  /** @type {SimulationEntity | null} */
  active_user = $state(null);
  /** @type {SimulationEntity | null} */
  active_ai = $state(null);
  /** @type {SimulationEntity | null} */
  active_fractal = $state(null);
  /** @type {Record<string, any>} */
  active_npcs = $state({});

  /** @type {EntityDynamics | null} */
  #ai_dynamics = $state(null);
  /** @type {EntityDynamics | null} */
  #fractal_dynamics = $state(null);
  /** @type {Record<string, any>} */
  #story_by_id = $state({});

  // --- REACTIVE SIMULATION FEED ---
  /** @type {LogEntry[]} */
  feed = $state([]);
  /** @type {SvelteSet<string | number>} */
  #id_set = new SvelteSet();
  /** @type {string | number | null} */
  #last_story_id = null;

  // --- AUTO-SAVE LIFECYCLE ---
  /** @type {(() => void) | null} */
  #effects_cleanup = null;
  #auto_save_suspended = false;

  get active_story() {
    if (this.active_id == null) return null;
    return this.#story_by_id[this.active_id] ?? this.#story_by_id[coerce_story_key(this.active_id)] ?? null;
  }

  get ai_dynamics() {
    return this.#ai_dynamics;
  }

  set ai_dynamics(value) {
    const next = value || default_dynamics_for_scope("somatic");
    this.#ai_dynamics = next;
    if (this.active_ai) {
      this.active_ai.dynamics = next;
    }
  }

  get fractal_dynamics() {
    return this.#fractal_dynamics;
  }

  set fractal_dynamics(value) {
    const next = value || default_dynamics_for_scope("fractal");
    this.#fractal_dynamics = next;
    if (this.active_fractal) {
      this.active_fractal.dynamics = next;
    }
  }

  init_effects() {
    if (this.#effects_cleanup) return;
    this.#effects_cleanup = $effect.root(() => {
      $effect(() => {
        const current_round = this.round;
        void this.#ai_dynamics;
        void this.#fractal_dynamics;
        void this.last_director_beat_round;
        void this.last_dynamics_beat_round;
        if (this.is_ready && !this.#auto_save_suspended && this.active_id) {
          this.#persist_story_snapshot(current_round).catch((err) => console.error("[Session] Auto-save failed:", err));
        }
      });
    });
  }

  teardown_effects() {
    if (this.#effects_cleanup) {
      this.#effects_cleanup();
      this.#effects_cleanup = null;
    }
  }

  // ==========================================================================
  // [FEED NOTIFICATION SINK & CACHE]
  // ==========================================================================

  /**
   * Synchronizes in-memory feed with persistence for the given story.
   * @param {string | number | null} [story_id=null]
   */
  async refresh_feed(story_id = null) {
    const effective_story_id = story_id ?? this.active_id ?? this.#last_story_id;
    if (!effective_story_id) {
      this.clear_feed();
      return;
    }
    this.#last_story_id = effective_story_id;

    const messages = await load_story_log(effective_story_id);
    this.feed = messages;
    this.#id_set = new SvelteSet(messages.filter((m) => m.id != null).map((m) => m.id));
  }

  /**
   * Appends a log entry to the reactive feed if not already present.
   * Implements `log_store.add` for `@data/session.js`.
   * @param {LogEntry} entry
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
   * Implements `log_store.update` for `@data/session.js`.
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
   * Implements `log_store.remove` for `@data/session.js`.
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

  clear_feed() {
    this.feed = [];
    this.#id_set.clear();
  }

  // ==========================================================================
  // [SESSION POINTER & STORY LIFECYCLE]
  // ==========================================================================

  /**
   * Returns the active story ID or throws if none is active.
   * @returns {string}
   */
  require_active() {
    if (!this.active_id) throw new Error("[Session] No active session found.");
    return this.active_id;
  }

  /**
   * Sets the active session ID, persists it, syncs cast/dynamics, and refreshes feed.
   * @param {string} id
   */
  async set_active(id) {
    this.active_id = id;
    if (typeof window !== "undefined") {
      await set_active_session_id(id);
      await record_session_access(id);
    }
    await this.sync(id);
    await this.refresh_feed(id);
  }

  /**
   * Restores active session ID in RAM without redundant DB writes.
   * @param {string | null} id
   */
  restore_active(id) {
    this.active_id = id;
  }

  /**
   * Clears active session state, unlocks execution, and clears the reactive feed.
   */
  async clear_active() {
    this.active_id = null;
    execution.unlock();
    if (typeof window !== "undefined") {
      await clear_active_session_id();
    }
    this.clear_feed();
  }

  /**
   * Creates a new story record from storyboard selection and activates it.
   * @param {Record<string, any>} selection
   * @returns {Promise<string>}
   */
  async create_from_selection(selection) {
    const story_id = await create_story_from_selection(selection, { log_store: this, set_active: (id) => this.set_active(id) });
    app.bump_stories_version();
    return story_id;
  }

  // ==========================================================================
  // [LOG & TURN MESSAGE CRUD]
  // ==========================================================================

  /** @param {string} text */
  async send_user_message(text) {
    return await send_user_turn(text, { active_id: this.active_id, log_store: this });
  }

  async rollback_for_retry() {
    return await regenerate_trailing_turns({ active_id: this.active_id, log_store: this });
  }

  /**
   * @param {string} text
   * @param {string} role
   * @param {string} character_name
   * @param {Record<string, any>} [options={}]
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
      { log_store: this },
    );
  }

  /** @param {string | number} story_id */
  async load_log(story_id) {
    return await load_story_log(story_id);
  }

  /** @param {string | number} id */
  async delete_entry(id) {
    await delete_log_entry(id, { log_store: this });
  }

  /**
   * @param {string | number} id
   * @param {string} new_text
   * @param {Record<string, any> | null} [meta_patch=null]
   */
  async edit_entry(id, new_text, meta_patch = null) {
    await edit_log_entry(id, new_text, meta_patch, { log_store: this });
  }

  /**
   * @param {string | number} id
   * @param {number} attachment_index
   * @param {Record<string, any>} new_attachment
   */
  async update_attachment(id, attachment_index, new_attachment) {
    await update_log_attachment(id, attachment_index, $state.snapshot(new_attachment), { log_store: this });
  }

  /**
   * @param {string | number} id
   * @param {number} attachment_index
   */
  async delete_attachment(id, attachment_index) {
    await delete_log_attachment(id, attachment_index, { log_store: this });
    const key = isNaN(Number(id)) ? id : Number(id);
    const target = this.feed.find((entry) => entry.id === key || entry.id === id || String(entry.id) === String(id));
    if (!target || (!target.text?.trim() && !(target.attachments || []).some((a) => a && a.src != null))) {
      this.remove(key);
      this.remove(id);
    }
  }

  // ==========================================================================
  // [DATABASE SYNCHRONIZATION & ENTITY PERSISTENCE]
  // ==========================================================================

  /**
   * Hydrates active cast, story chronology, dynamics, and title from IndexedDB.
   * Never overwrites `app.selected_*` storyboard draft slots.
   * @param {string | number | null} [active_story_id=null]
   */
  async sync(active_story_id = null) {
    this.#auto_save_suspended = true;
    try {
      let resolved_id = active_story_id ? String(active_story_id) : (this.active_id ?? null);

      const checkpoint = !resolved_id ? load_session_checkpoint() : null;
      if (!resolved_id) {
        if (checkpoint?.story_id) {
          resolved_id = checkpoint.story_id;
        } else {
          try {
            const entry = await db.kv_settings.get(SESSION_ID_KEY);
            if (entry?.value) resolved_id = entry.value;
            else return;
          } catch {
            return;
          }
        }
      }

      this.restore_active(String(resolved_id));
      const active_id = this.active_id ?? String(resolved_id);

      try {
        const db_key = coerce_story_key(active_id);
        const story = await db.stories.get(db_key);
        if (!story) {
          clear_session_checkpoint();
          return;
        }

        if (story.round != null) this.round = story.round;
        if (typeof checkpoint?.round === "number" && checkpoint.round > (story.round ?? 0)) {
          this.round = checkpoint.round;
        }
        this.last_director_beat_round = typeof story.last_director_beat_round === "number" ? story.last_director_beat_round : -1;
        this.last_dynamics_beat_round = typeof story.last_dynamics_beat_round === "number" ? story.last_dynamics_beat_round : -1;

        const [user_data, ai_data, fractal_data] = await Promise.all([
          /** @type {Promise<SimulationEntity | null>} */ (entities.get("character", story.user_id)),
          /** @type {Promise<SimulationEntity | null>} */ (entities.get("character", story.ai_id || "unknown_ai")),
          /** @type {Promise<SimulationEntity | null>} */ (entities.get("fractal", story.fractal_id)),
        ]);

        if (user_data) {
          this.active_user = { ...user_data };
        }

        if (ai_data) {
          this.active_ai = ai_data;
          this.#ai_dynamics =
            story.ai_dynamics ? { ...story.ai_dynamics }
            : story.entity_snapshots?.ai?.dynamics ? { ...story.entity_snapshots.ai.dynamics }
            : { ...ai_data.dynamics };
        }

        if (fractal_data) {
          const effective_visual_style = story.visual_style || story.entity_snapshots?.fractal?.visual_style || fractal_data.visual_style;
          const effective_narrative_style = story.narrative_style || story.entity_snapshots?.fractal?.narrative_style || fractal_data.narrative_style;

          this.active_fractal = {
            ...fractal_data,
            ...(effective_visual_style ? { visual_style: effective_visual_style } : {}),
            ...(effective_narrative_style ? { narrative_style: effective_narrative_style } : {}),
          };
          this.#fractal_dynamics =
            story.fractal_dynamics ? { ...story.fractal_dynamics }
            : story.entity_snapshots?.fractal?.dynamics ? { ...story.entity_snapshots.fractal.dynamics }
            : { ...fractal_data.dynamics };
        }

        if (story.entity_snapshots?.ai?.dynamics && this.active_ai) {
          this.active_ai.dynamics_baseline = { ...story.entity_snapshots.ai.dynamics };
        }
        if (story.entity_snapshots?.fractal?.dynamics && this.active_fractal) {
          this.active_fractal.dynamics_baseline = { ...story.entity_snapshots.fractal.dynamics };
        }

        const npc_ids = Array.isArray(story.npc_ids) ? story.npc_ids : [];
        if (npc_ids.length) {
          const npc_list = (await Promise.all(npc_ids.map((nid) => entities.get("character", nid)))).filter(Boolean);
          this.active_npcs = Object.fromEntries(npc_list.map((n) => [String(n.id), { ...n, presence: "active" }]));
        } else {
          this.active_npcs = {};
        }

        if (story.title) {
          const parts = decompose_story_title(story.title, {
            ai: this.active_ai,
            user: this.active_user,
            fractal: this.active_fractal,
            get_color: get_signature_color,
          });
          app.set_active_story_title(story.title, parts);
        }

        this.#story_by_id[db_key] = story;
        if (String(db_key) !== String(active_id)) {
          this.#story_by_id[active_id] = story;
        }

        this.is_ready = true;
        clear_session_checkpoint();
      } catch (err) {
        console.warn("[Session] Sync failed:", err);
      }
    } finally {
      this.#auto_save_suspended = false;
    }
  }

  /**
   * @param {number} target_round
   * @returns {Promise<boolean>}
   */
  async #persist_story_snapshot(target_round) {
    if (this.active_id == null) return false;
    await db.stories.update(coerce_story_key(this.active_id), {
      round: target_round,
      last_played: Date.now(),
      updated_at: Date.now(),
      ai_dynamics: $state.snapshot(this.#ai_dynamics),
      fractal_dynamics: $state.snapshot(this.#fractal_dynamics),
      last_director_beat_round: this.last_director_beat_round,
      last_dynamics_beat_round: this.last_dynamics_beat_round,
    });
    return true;
  }

  /** @param {number | null} [round=null] */
  async save(round = null) {
    if (this.active_id == null) return;
    try {
      const target_round = typeof round === "number" ? round : this.round;
      const wrote = await this.#persist_story_snapshot(target_round);
      if (wrote) app.bump_stories_version();
    } catch (err) {
      console.error("[Session] Story save failed:", err);
    }
  }

  /**
   * @param {'character' | 'fractal'} type
   * @param {SimulationEntity} entity
   */
  async save_entity(type, entity) {
    try {
      const entity_payload = $state.snapshot(entity);
      await entities.upsert(type, entity_payload);
      if (this.active_ai?.id === entity.id) Object.assign(this.active_ai, entity);
      if (this.active_user?.id === entity.id) Object.assign(this.active_user, entity);
      if (this.active_fractal?.id === entity.id) Object.assign(this.active_fractal, entity);
      if (this.active_npcs[String(entity.id)]) {
        this.active_npcs[String(entity.id)] = entity;
      }
    } catch (err) {
      console.error("[Session] Entity save failed:", err);
      throw err;
    }
  }

  /**
   * @param {'character' | 'fractal' | 'story'} type
   * @param {string | number} id
   * @param {Record<string, any>} data
   */
  async update_entity(type, id, data) {
    try {
      if (type === "story") {
        await db.stories.update(coerce_story_key(id), data);
        app.bump_stories_version();
        if (this.active_id != null && String(this.active_id) === String(id)) {
          for (const key of [id, coerce_story_key(id)]) {
            if (this.#story_by_id[key] != null) Object.assign(this.#story_by_id[key], data);
          }
        }
      } else {
        let unproxied_data = data;
        try {
          unproxied_data = $state.snapshot(data);
        } catch {
          unproxied_data = data;
        }
        const payload = { ...unproxied_data, updated_at: Date.now() };
        await entities.update(type, String(id), payload);
        for (const target of new SvelteSet([this.active_user, this.active_ai, this.active_fractal])) {
          if (target && target.id === id) Object.assign(target, payload);
        }
        if (this.active_npcs[String(id)]) {
          this.active_npcs[String(id)] = { ...this.active_npcs[String(id)], ...payload };
        }
        if (payload.dynamics) {
          if (this.active_ai && id === this.active_ai.id) {
            this.#ai_dynamics = { ...this.#ai_dynamics, ...payload.dynamics };
          } else if (this.active_fractal && id === this.active_fractal.id) {
            this.#fractal_dynamics = { ...this.#fractal_dynamics, ...payload.dynamics };
          }
        }
      }
    } catch (err) {
      console.error(`[Session] Update entity (${type}) failed:`, err);
    }
  }

  /**
   * @param {'character' | 'fractal'} type
   * @param {string | number} id
   */
  async delete_entity(type, id) {
    try {
      await entities.remove(type, String(id));
      if (type === "character") {
        if (this.active_ai?.id === id) this.active_ai = null;
        if (this.active_user?.id === id) this.active_user = null;
      } else if (this.active_fractal?.id === id) {
        this.active_fractal = null;
      }

      if (this.active_npcs[String(id)]) {
        const next_npcs = { ...this.active_npcs };
        delete next_npcs[String(id)];
        this.active_npcs = next_npcs;
      }
    } catch (err) {
      console.error("[Session] Entity delete failed:", err);
      throw err;
    }
  }
}

export const session = new SessionStore();

if (typeof window !== "undefined") {
  session.init_effects();
}
