/**
 * src/data/sessions.svelte.js
 * 📜 SESSION DRIVER & SIMULATION LOG DATA ACCESS
 *
 * Manages active session pointers (`active_session_id`), story initialization,
 * and CRUD operations for the simulation log. All reactive state writes pass
 * through `@utils/state_bridge` so the persistence layer maintains clean
 * downward unidirectional layer boundaries without importing `@state`.
 *
 * DOMAINS:
 *   1. Session Pointer Management (`active_id`, `set_active`, `clear_active`, `restore_active`, `require_active`)
 *   2. Story Session Creation (`create_from_selection`)
 *   3. Simulation Log CRUD (`log_message`, `log_system_entry`, `load_log`, `edit_log_entry`, `delete_log_entry`, `update_log_attachment`, `delete_log_attachment`, `regenerate`)
 *
 * RULES FOR MODIFICATION:
 *   - Never import directly from `src/state` or `src/ui`. Use `state_bridge` or `stories_bridge`.
 *   - Use `$state.snapshot()` before persisting plain objects to IndexedDB via Dexie.
 *   - Adhere strictly to P4: Zero Backwards Compatibility and full descriptive naming.
 */

import { parse_relational_vector, state_bridge, stories_bridge } from "@utils";
import { db } from "./db.js";

/** Durable IndexedDB key for the active-session pointer (kv_settings). */
export const SESSION_ID_KEY = "active_session_id";

/** @type {string | null} */
let _active_id = null;

// ============================================================================
// SESSION DRIVER
// ============================================================================

export const session_driver = {
  /**
   * The currently active story session ID in memory.
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
   * @param {string} id
   * @returns {Promise<void>}
   */
  async set_active(id) {
    _active_id = id;
    if (state_bridge.runtime) {
      state_bridge.runtime.story_id = id;
    }
    if (typeof window !== "undefined") {
      await db.kv_settings.put({ key: SESSION_ID_KEY, value: id });
      await db.sessions.add({ session_id: id, timestamp: Date.now() });
    }
    if (state_bridge.simulation_log?.refresh) {
      await state_bridge.simulation_log.refresh();
    }
  },

  /**
   * Restores active session ID in memory without redundant DB writes (used during sync).
   * @param {string} id
   */
  restore_active(id) {
    _active_id = id;
  },

  /**
   * Clears active session state and resets runtime counters.
   * @returns {Promise<void>}
   */
  async clear_active() {
    _active_id = null;
    state_bridge.simulation_state?.unlock?.();
    if (state_bridge.runtime) {
      state_bridge.runtime.story_id = null;
      state_bridge.runtime.round = 0;
    }
    if (typeof window !== "undefined") {
      await db.kv_settings.put({ key: SESSION_ID_KEY, value: null });
    }
    await state_bridge.simulation_log?.refresh?.();
  },

  /**
   * Creates a new story record from a character/fractal storyboard selection,
   * auto-seeding the cast roster with connected NPCs and Wanderers.
   * @param {Record<string, any>} selection
   * @returns {Promise<string>}
   */
  async create_from_selection(selection) {
    const ai_entity = selection.ai_id ? await db.entities.get(selection.ai_id) : null;
    const fractal_entity = selection.fractal_id ? await db.entities.get(selection.fractal_id) : null;

    const visual_style = selection.visual_style || selection.fractal?.visual_style || fractal_entity?.visual_style;
    const narrative_style = selection.narrative_style || selection.fractal?.narrative_style || fractal_entity?.narrative_style;

    const excluded_ids = new Set([String(selection.ai_id), String(selection.user_id)].filter(Boolean));
    const initial_npc_ids = new Set(Array.isArray(selection.npc_ids) ? selection.npc_ids.map(String).filter((id) => !excluded_ids.has(id)) : []);

    try {
      const all_characters = await db.entities
        .where("type")
        .equals("character")
        .toArray()
        .catch(() => []);
      const fractal_name = (fractal_entity?.name || "").trim().toLowerCase();

      for (const character of all_characters) {
        const character_id = String(character.id);
        if (excluded_ids.has(character_id)) continue;

        // 1. Check if Character is a Wanderer
        if (character.is_wanderer) {
          initial_npc_ids.add(character_id);
          continue;
        }

        // 2. Check if Fractal has outgoing relationship to this Character
        const fractal_relationships = Array.isArray(fractal_entity?.relationships) ? fractal_entity.relationships : [];
        const character_name = (character.name || "").trim().toLowerCase();
        const has_fractal_bond = fractal_relationships.some((rel) => {
          const parsed = parse_relational_vector(rel);
          return parsed && parsed.target_name.toLowerCase() === character_name;
        });
        if (has_fractal_bond) {
          initial_npc_ids.add(character_id);
          continue;
        }

        // 3. Check if Character has outgoing relationship to this Fractal
        const character_relationships = Array.isArray(character.relationships) ? character.relationships : [];
        const has_character_to_fractal_bond = character_relationships.some((rel) => {
          const parsed = parse_relational_vector(rel);
          return parsed && fractal_name && parsed.target_name.toLowerCase() === fractal_name;
        });
        if (has_character_to_fractal_bond) {
          initial_npc_ids.add(character_id);
        }
      }
    } catch (error) {
      console.warn("[Session] Auto-seeding fractal roster failed, falling back to selection:", error);
    }

    const id = await db.stories.add({
      title: selection.story_title || "New Story",
      ai_id: selection.ai_id,
      user_id: selection.user_id,
      fractal_id: selection.fractal_id,
      visual_style,
      narrative_style,
      entity_snapshots: {
        ai: { dynamics: ai_entity?.dynamics || {} },
        fractal: {
          dynamics: fractal_entity?.dynamics || {},
          visual_style,
          narrative_style,
        },
      },
      npc_ids: Array.from(initial_npc_ids),
      created_at: Date.now(),
      updated_at: Date.now(),
      round: 0,
    });

    const story_id = String(id);
    stories_bridge.bump();
    await session_driver.set_active(story_id);

    // Initial system entry for story start
    const entry = {
      story_id,
      role: "system",
      type: "text",
      text: `Story Started: ${selection.story_title}`,
      turn_type: "SYSTEM_TURN",
      round: 0,
      meta: { type: "STORY_START" },
      created_at: Date.now(),
    };
    entry.id = await db.simulation_log.add(entry);
    if (state_bridge.simulation_log?.add) {
      state_bridge.simulation_log.add(entry);
    }

    return story_id;
  },

  /**
   * Logs a user turn message in the simulation log.
   * @param {string} text
   * @returns {Promise<any>}
   */
  async send(text) {
    const character_name = state_bridge.runtime?.active_user?.name || "User";
    return await this.log_message(text, "user", character_name, { turn_type: "USER_TURN" });
  },

  /**
   * Removes trailing turns back to the last user message to allow regeneration.
   * @returns {Promise<void>}
   */
  async regenerate() {
    const story_id = session_driver.require_active();
    const logs = await db.simulation_log.where("story_id").equals(story_id).sortBy("created_at");
    for (let i = logs.length - 1; i >= 0; i--) {
      const entry = logs[i];
      if (entry.role === "user") break;
      await db.simulation_log.delete(entry.id);
      state_bridge.simulation_log?.remove?.(entry.id);
    }
    // Prune any empty text records without attachments
    const remaining = await db.simulation_log.where("story_id").equals(story_id).toArray();
    for (const entry of remaining) {
      if (
        typeof entry.text === "string" &&
        !entry.text.trim() &&
        (!entry.attachments || entry.attachments.length === 0) &&
        !entry.meta?.is_prologue &&
        !entry.meta?.is_epilogue
      ) {
        await db.simulation_log.delete(entry.id);
        state_bridge.simulation_log?.remove?.(entry.id);
      }
    }
  },

  /**
   * Deletes a single simulation log entry by ID.
   * @param {string | number} id
   * @returns {Promise<void>}
   */
  async delete_log_entry(id) {
    const key = isNaN(Number(id)) ? id : Number(id);
    await db.simulation_log.delete(key);
    state_bridge.simulation_log?.remove?.(key);
  },

  /**
   * Updates text for an existing simulation log entry.
   * @param {string | number} id
   * @param {string} new_text
   * @returns {Promise<void>}
   */
  async edit_log_entry(id, new_text) {
    let key = isNaN(Number(id)) ? id : Number(id);
    let entry = await db.simulation_log.get(key);
    if (!entry) {
      const match = state_bridge.simulation_log?.feed?.find((m) => m.id === id || m.meta?.id === id || String(m.id) === String(id));
      if (match) key = match.id;
    }
    await db.simulation_log.update(key, { text: new_text });
    state_bridge.simulation_log?.update?.(id, { text: new_text });
  },

  /**
   * Updates an attachment at a specific index in a log entry.
   * @param {string | number} id
   * @param {number} attachment_index
   * @param {Record<string, any>} new_attachment
   * @returns {Promise<void>}
   */
  async update_log_attachment(id, attachment_index, new_attachment) {
    const numeric_key = isNaN(Number(id)) ? null : Number(id);
    let entry = numeric_key ? await db.simulation_log.get(numeric_key) : null;
    if (!entry) {
      const feed_match = state_bridge.simulation_log?.feed?.find((m) => m.id === id || m.meta?.id === id || String(m.id) === String(id));
      if (feed_match) {
        entry = await db.simulation_log.get(feed_match.id);
      }
    }
    if (!entry) {
      entry = await db.simulation_log.filter((m) => m.meta?.id === id).first();
    }
    if (entry) {
      if (!Array.isArray(entry.attachments)) {
        entry.attachments = [];
      }
      entry.attachments[attachment_index] = $state.snapshot(new_attachment);
      const plain_entry = $state.snapshot(entry);
      await db.simulation_log.put(plain_entry);
      state_bridge.simulation_log?.update?.(id, { attachments: plain_entry.attachments });
    }
  },

  /**
   * Removes an attachment from a log entry (or deletes the entry if it becomes empty).
   * @param {string | number} id
   * @param {number} attachment_index
   * @returns {Promise<void>}
   */
  async delete_log_attachment(id, attachment_index) {
    const numeric_key = isNaN(Number(id)) ? null : Number(id);
    let entry = numeric_key ? await db.simulation_log.get(numeric_key) : null;
    if (!entry) {
      const feed_match = state_bridge.simulation_log?.feed?.find((m) => m.id === id || m.meta?.id === id || String(m.id) === String(id));
      if (feed_match) {
        entry = await db.simulation_log.get(feed_match.id);
      }
    }
    if (!entry) {
      entry = await db.simulation_log.filter((m) => m.meta?.id === id).first();
    }
    if (entry && Array.isArray(entry.attachments)) {
      entry.attachments.splice(attachment_index, 1);
      const is_empty_image_bubble =
        !entry.text?.trim() && !entry.meta?.is_prologue && !entry.meta?.is_epilogue && (!entry.attachments || entry.attachments.length === 0);
      if (is_empty_image_bubble) {
        const key = entry.id != null ? entry.id : isNaN(Number(id)) ? id : Number(id);
        await db.simulation_log.delete(key);
        state_bridge.simulation_log?.remove?.(key);
      } else {
        const plain_entry = $state.snapshot(entry);
        await db.simulation_log.put(plain_entry);
        state_bridge.simulation_log?.update?.(id, { attachments: plain_entry.attachments });
      }
    }
  },

  /**
   * Adds a narrative message to the simulation log with snapshot-safe metadata.
   * @param {string} text
   * @param {string} role
   * @param {string} character_name
   * @param {Object} [options]
   * @param {string} [options.turn_type]
   * @param {Record<string, any>} [options.meta]
   * @param {any[]} [options.attachments]
   * @param {string|number|null} [options.story_id]
   * @returns {Promise<Record<string, any>>}
   */
  async log_message(text, role, character_name, { turn_type = "USER_TURN", meta = {}, attachments = [], story_id = null } = {}) {
    const effective_story_id = story_id ?? session_driver.require_active();
    const is_empty =
      typeof text === "string" && !text.trim() && (!attachments || attachments.length === 0) && !meta?.is_prologue && !meta?.is_epilogue;
    if (is_empty) {
      return { id: meta?.id || `skip-${Date.now()}`, story_id: effective_story_id, role, text: "", character_name, turn_type, meta };
    }
    /** @type {any} */
    const entry = {
      story_id: effective_story_id,
      role,
      type: "text",
      text,
      character_name,
      turn_type,
      round: state_bridge.runtime?.round ?? 0,
      meta: $state.snapshot(meta),
      created_at: Date.now(),
    };
    if (attachments && attachments.length > 0) {
      entry.attachments = $state.snapshot(attachments);
    }
    if (meta && meta.id) {
      entry.id = meta.id;
      await db.simulation_log.put(entry);
    } else {
      entry.id = await db.simulation_log.add(entry);
    }
    state_bridge.simulation_log?.add?.(entry);
    return entry;
  },

  /**
   * Fetches the full simulation log history for a given story.
   * @param {string|number} story_id
   * @returns {Promise<any[]>}
   */
  async load_log(story_id) {
    if (!story_id) return [];
    const string_id = String(story_id);
    const numeric_id = Number(story_id);
    let messages = await db.simulation_log.where("story_id").equals(string_id).sortBy("created_at");
    if (messages.length === 0 && !isNaN(numeric_id)) {
      messages = await db.simulation_log.where("story_id").equals(numeric_id).sortBy("created_at");
    }
    return messages;
  },

  /**
   * Appends a system telemetry or status entry into the log.
   * @param {string} text
   * @param {string} [role='system']
   * @param {Record<string, any>} [meta={}]
   * @param {string|number|null} [story_id=null]
   * @returns {Promise<void>}
   */
  async log_system_entry(text, role = "system", meta = {}, story_id = null) {
    const effective_story_id = story_id ?? session_driver.require_active();
    const entry = {
      story_id: effective_story_id,
      role,
      type: "text",
      text,
      turn_type: "SYSTEM_TURN",
      round: state_bridge.runtime?.round ?? 0,
      meta: $state.snapshot(meta),
      created_at: Date.now(),
    };
    entry.id = await db.simulation_log.add(entry);
    state_bridge.simulation_log?.add?.(entry);
  },
};

// ============================================================================
// CHANGELOG
// ============================================================================
/**
 * CHANGELOG
 * - 2026-08-29: Harmonized sessions.svelte.js to adhere strictly to constitutional
 *   lexical standards (unabbreviated naming, full descriptive variables), added
 *   instructional header block, standard dividers, and changelog footer.
 */
