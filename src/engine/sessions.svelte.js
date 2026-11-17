/**
 * src/engine/sessions.svelte.js
 * 📜 SESSION DRIVER — story sessions & simulation-log orchestration
 *
 * Owns the active story pointer, story creation, and all simulation-log
 * writes. Strict one-way DAG: this module NEVER imports `runtime`
 * (nor `simulation_log`/`status`). Runtime context arrives as parameters
 * (`snapshots`, `story_id`, `round`); when omitted, pure-DB fallbacks apply
 * (story row snapshots/round, entity name scan). Reactive-feed notification
 * and runtime sync travel through bindings installed by the composition root
 * (`bind_session_driver` in `src/main.js`), never through direct imports.
 *
 * DOMAINS:
 *   1. Session Pointer Management (`active_id`, `set_active`, `clear_active`, `restore_active`, `require_active`)
 *   2. Story Session Creation (`create_from_selection`)
 *   3. Simulation Log Orchestration (`send`, `log_message`, `load_log`, `edit_log_entry`, `delete_log_entry`, `update_log_attachment`, `delete_log_attachment`, `regenerate`)
 *
 * RULES FOR MODIFICATION:
 *   - Never import `runtime` or `simulation_log` (directly or via `state_bridge`).
 *   - Same-layer `simulation_state` is imported directly; bridge use is limited
 *     to the `stories_bridge` bump.
 *   - Use `$state.snapshot()` before persisting plain objects to IndexedDB via Dexie.
 *   - Adhere strictly to P4: Zero Backwards Compatibility and full descriptive naming.
 */

import { has_bracket_bond, is_empty_narrative_message, is_telemetry_meta, stories_bridge } from "@utils";
import { append_ledger_entries, db, SESSION_ID_KEY } from "@data";
import { simulation_state } from "./status.svelte.js";

/**
 * Bound environment installed once by the composition root (`src/main.js`):
 * reactive-feed notification goes through `log_store`, runtime sync through
 * the set/clear hooks — never through direct engine imports.
 * @type {{ log_store: any, on_set_active: ((id: string) => Promise<void>) | null, on_clear_active: (() => Promise<void>) | null }}
 */
let _environment = { log_store: null, on_set_active: null, on_clear_active: null };

/**
 * Installs the reactive-feed store and runtime sync hooks. Invoked once at boot.
 * @param {{ log_store?: any, on_set_active?: ((id: string) => Promise<void>) | null, on_clear_active?: (() => Promise<void>) | null }} environment
 */
export function bind_session_driver(environment = {}) {
  if (environment.log_store !== undefined) _environment.log_store = environment.log_store ?? null;
  if (environment.on_set_active !== undefined) _environment.on_set_active = environment.on_set_active ?? null;
  if (environment.on_clear_active !== undefined) _environment.on_clear_active = environment.on_clear_active ?? null;
}

/**
 * Matches a speaker name against snapshot entities (trio + NPC cast, case-insensitive).
 * Single shared core for log-time stamping (sessions) and feed-time stamping (log store).
 * @param {{ AI?: any, USER?: any, FRACTAL?: any, NPCS?: any }} [snapshots]
 * @param {string} key - lowercased trimmed speaker name
 * @returns {string|null} canonical entity id
 */
export function match_speaker_snapshots(snapshots, key) {
  if (!key || !snapshots || typeof snapshots !== "object") return null;
  for (const candidate of [snapshots.AI, snapshots.USER, snapshots.FRACTAL]) {
    if (candidate?.name && String(candidate.name).toLowerCase().trim() === key && candidate?.id) return String(candidate.id);
  }
  const npcs = snapshots.NPCS;
  const npc_list =
    Array.isArray(npcs) ? npcs
    : npcs && typeof npcs === "object" ? Object.values(npcs)
    : [];
  for (const npc of npc_list) {
    if (npc?.name && String(npc.name).toLowerCase().trim() === key && npc?.id) return String(npc.id);
  }
  return null;
}

/**
 * Resolves a log speaker to its canonical entity id at creation:
 * explicit ids win; otherwise `character_name` matches the trio (+ NPC cast
 * when snapshots carry them, else a story-fallback scan), falling back to
 * role-keyed trio ids.
 * @param {string} role
 * @param {string} character_name
 * @param {{ AI?: any, USER?: any, FRACTAL?: any, NPCS?: any } | null} [snapshots=null]
 * @param {string|number|null} [story_id=null] - story row used for DB fallbacks
 * @returns {Promise<string|null>}
 */
export async function resolve_log_entity_id(role, character_name, snapshots = null, story_id = null) {
  const key = String(character_name || "")
    .toLowerCase()
    .trim();
  const direct = match_speaker_snapshots(snapshots, key);
  if (direct) return direct;

  let trio = null;
  if (story_id != null) {
    try {
      const story = await db.stories.get(story_id);
      trio = story?.entity_snapshots ?? null;
      if (key && (!trio || !match_speaker_snapshots({ ...trio, NPCS: [] }, key))) {
        const npc_match = await db.entities
          .filter(
            (entity) =>
              String(entity?.name || "")
                .toLowerCase()
                .trim() === key,
          )
          .first();
        if (npc_match?.id) return String(npc_match.id);
      }
    } catch {
      /* DB fallback is best-effort; fall through to null */
    }
  }
  const effective_trio = snapshots ?? trio;
  if (key) {
    const snap_match = match_speaker_snapshots(effective_trio, key);
    if (snap_match) return snap_match;
  }
  const trio_entry =
    role === "user" ? effective_trio?.USER
    : role === "fractal" ? effective_trio?.FRACTAL
    : role === "ai" ? effective_trio?.AI
    : null;
  return trio_entry?.id ? String(trio_entry.id) : null;
}

/**
 * Resolves the round for a log write when the caller passes none: the story
 * row's round (maintained by `runtime.save` every turn).
 * @param {string|number|null} story_id
 * @returns {Promise<number>}
 */
async function resolve_story_round(story_id) {
  if (story_id == null) return 0;
  try {
    const story = await db.stories.get(story_id);
    return typeof story?.round === "number" ? story.round : 0;
  } catch {
    return 0;
  }
}

/** @type {string | null} */
let _active_id = null;

// ============================================================================
// INTERNAL QUERY HELPERS
// ============================================================================

/**
 * Resolves a simulation log entry by exact ID or feed metadata reference.
 * @param {string | number} id
 * @param {Array<any> | null} [feed=null] - reactive feed for metadata matches (defaults to bound store)
 * @returns {Promise<any | null>}
 */
async function _find_log_entry(id, feed = null) {
  const numeric_key = isNaN(Number(id)) ? null : Number(id);
  let entry = numeric_key != null ? await db.simulation_log.get(numeric_key) : null;
  if (!entry && typeof id === "string") {
    entry = await db.simulation_log.get(id);
  }
  if (!entry) {
    const feed_list = feed ?? _environment.log_store?.feed ?? [];
    const feed_match = feed_list.find((message) => message.id === id || message.meta?.id === id || String(message.id) === String(id));
    if (feed_match) {
      entry = await db.simulation_log.get(feed_match.id);
    }
  }
  if (!entry) {
    entry = await db.simulation_log.filter((message) => message.meta?.id === id).first();
  }
  return entry || null;
}

// ============================================================================
// SESSION DRIVER
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
      await db.kv_settings.put({ key: SESSION_ID_KEY, value: id });
      await db.sessions.add({ session_id: id, timestamp: Date.now() });
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
      await db.kv_settings.put({ key: SESSION_ID_KEY, value: null });
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
    const ai_entity = selection.ai_id ? await db.entities.get(selection.ai_id) : null;
    const user_entity = selection.user_id ? await db.entities.get(selection.user_id) : null;
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

      for (const character of all_characters) {
        const character_id = String(character.id);
        if (excluded_ids.has(character_id)) continue;

        // 1. Check if Character is a Wanderer
        if (character.is_wanderer) {
          initial_npc_ids.add(character_id);
          continue;
        }

        // 2. Check if Fractal has an outgoing bracket bond to this Character
        // (Track 1.4: universal predicates replace the legacy relationships array)
        const has_fractal_bond = has_bracket_bond(fractal_entity, character);
        if (has_fractal_bond) {
          initial_npc_ids.add(character_id);
          continue;
        }

        // 3. Check if Character has an outgoing bracket bond to this Fractal
        const has_character_to_fractal_bond = fractal_entity ? has_bracket_bond(character, fractal_entity) : false;
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
        ai: ai_entity ? structuredClone($state.snapshot(ai_entity)) : { dynamics: {} },
        user: user_entity ? structuredClone($state.snapshot(user_entity)) : { dynamics: {} },
        fractal: fractal_entity ? structuredClone($state.snapshot(fractal_entity)) : { dynamics: {}, visual_style, narrative_style },
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
    _environment.log_store?.add?.(entry);

    try {
      const cast_records = [
        ["ai", ai_entity],
        ["user", user_entity],
        ["fractal", fractal_entity],
      ];
      const genesis_lines = [];
      for (const [, record] of cast_records) {
        if (!record || record.id == null) continue;
        const fields = {
          "eternal.physical": record.eternal?.physical,
          "eternal.non_physical": record.eternal?.non_physical,
          "present.physical": record.present?.physical,
          "present.non_physical": record.present?.non_physical,
          past: record.past,
          future: record.future,
        };
        for (const [field_path, value] of Object.entries(fields)) {
          if (value == null) continue;
          const string_value =
            Array.isArray(value) ? JSON.stringify(value)
            : typeof value === "object" ? JSON.stringify(value)
            : String(value);
          if (!string_value.trim() || string_value === "[]" || string_value === "{}") continue;
          genesis_lines.push({
            story_id,
            round: 0,
            seq: 0,
            entity_id: String(record.id),
            field: field_path,
            new_value: string_value,
            writer: "genesis",
            decider: "genesis",
          });
        }
      }
      if (genesis_lines.length > 0) await append_ledger_entries(genesis_lines);
    } catch (error) {
      console.warn("[Session] Story genesis ledger backfill failed:", error);
    }

    return story_id;
  },

  /**
   * Logs a user turn message in the simulation log. Speaker name and round
   * resolve from the active story row (no runtime dependency).
   * @param {string} text
   * @returns {Promise<any>}
   */
  async send(text) {
    let speaker_name = "User";
    let round = 0;
    try {
      const story_id = session_driver.require_active();
      const story = await db.stories.get(story_id);
      speaker_name = story?.entity_snapshots?.user?.name || "User";
      round = typeof story?.round === "number" ? story.round : 0;
    } catch {
      /* No active story: fall through to the sessionless sentinel in log_message */
    }
    return await this.log_message(text, "user", speaker_name, { turn_type: "USER_TURN", round });
  },

  /**
   * Removes trailing turns back to the last user message to allow regeneration.
   * Consolidated single pass for efficiency.
   * @returns {Promise<void>}
   */
  async regenerate() {
    const story_id = session_driver.require_active();
    const logs = await db.simulation_log.where("story_id").equals(story_id).sortBy("created_at");
    // Round-bounded prune: capture the tail round first so a Continue-then-Regenerate
    // (rounds without a preceding user message) can't cross into the prior round.
    const tail = logs.length > 0 ? logs[logs.length - 1] : null;
    const target_round = tail?.round ?? null;
    let found_user_turn = false;

    for (let index = logs.length - 1; index >= 0; index--) {
      const entry = logs[index];
      const is_protected_init = entry.meta?.type === "STORY_START" || entry.meta?.is_prologue || entry.meta?.is_epilogue;
      // Never walk past the round being regenerated once a target is known.
      if (target_round != null && entry.round != null && entry.round < target_round) break;

      if (!found_user_turn) {
        if (entry.role === "user") {
          found_user_turn = true;
          continue;
        }
        // Delete trailing same-round turn telemetry (director/caretaker cards) so a
        // retry replaces the round instead of stacking a duplicate card per attempt.
        if (is_telemetry_meta(entry.meta) && !is_protected_init) {
          if (target_round == null || entry.round === target_round) {
            await db.simulation_log.delete(entry.id);
            _environment.log_store?.remove?.(entry.id);
            continue;
          }
        }
        // Preserve prior telemetry entries even if placed near trailing turns
        if (is_telemetry_meta(entry.meta)) {
          continue;
        }
        await db.simulation_log.delete(entry.id);
        _environment.log_store?.remove?.(entry.id);
      } else {
        const is_empty_stale = is_empty_narrative_message(entry.text, { attachments: entry.attachments, meta: entry.meta });

        if (is_empty_stale) {
          await db.simulation_log.delete(entry.id);
          _environment.log_store?.remove?.(entry.id);
        }
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
    _environment.log_store?.remove?.(key);
  },

  /**
   * Updates text for an existing simulation log entry.
   * @param {string | number} id
   * @param {string} new_text
   * @returns {Promise<void>}
   */
  async edit_log_entry(id, new_text) {
    const entry = await _find_log_entry(id);
    const key =
      entry ? entry.id
      : isNaN(Number(id)) ? id
      : Number(id);
    await db.simulation_log.update(key, { text: new_text });
    _environment.log_store?.update?.(id, { text: new_text });
  },

  /**
   * Updates an attachment at a specific index in a log entry.
   * @param {string | number} id
   * @param {number} attachment_index
   * @param {Record<string, any>} new_attachment
   * @returns {Promise<void>}
   */
  async update_log_attachment(id, attachment_index, new_attachment) {
    const entry = await _find_log_entry(id);
    if (entry) {
      if (!Array.isArray(entry.attachments)) {
        entry.attachments = [];
      }
      entry.attachments[attachment_index] = $state.snapshot(new_attachment);
      const plain_entry = $state.snapshot(entry);
      await db.simulation_log.put(plain_entry);
      _environment.log_store?.update?.(id, { attachments: plain_entry.attachments });
    }
  },

  /**
   * Removes an attachment from a log entry (or deletes the entry if it becomes empty).
   * @param {string | number} id
   * @param {number} attachment_index
   * @returns {Promise<void>}
   */
  async delete_log_attachment(id, attachment_index) {
    const entry = await _find_log_entry(id);
    if (entry && Array.isArray(entry.attachments)) {
      entry.attachments.splice(attachment_index, 1);
      const is_empty_image_bubble =
        !entry.text?.trim() && !entry.meta?.is_prologue && !entry.meta?.is_epilogue && (!entry.attachments || entry.attachments.length === 0);
      if (is_empty_image_bubble) {
        const key =
          entry.id != null ? entry.id
          : isNaN(Number(id)) ? id
          : Number(id);
        await db.simulation_log.delete(key);
        _environment.log_store?.remove?.(key);
      } else {
        const plain_entry = $state.snapshot(entry);
        await db.simulation_log.put(plain_entry);
        _environment.log_store?.update?.(id, { attachments: plain_entry.attachments });
      }
    }
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
    let effective_story_id = story_id ?? null;
    if (effective_story_id == null) {
      try {
        effective_story_id = session_driver.require_active();
      } catch {
        // Sessionless write (story wiped/ended while a fire-and-forget
        // background job - image beat, caretaker, telemetry - was in flight):
        // degrade to a no-op sentinel instead of throwing an unhandled
        // rejection at the user. Foreground flows should check active_id first.
        return { id: meta?.id || `skip-${Date.now()}`, story_id: null, role, text: "", character_name, turn_type, meta };
      }
    }
    const is_empty = is_empty_narrative_message(text, { attachments, meta });

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
      entity_id: entity_id ?? (await resolve_log_entity_id(role, character_name, snapshots, effective_story_id)),
      turn_type,
      round: round != null ? round : await resolve_story_round(effective_story_id),
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
    _environment.log_store?.add?.(entry, snapshots);
    return entry;
  },

  /**
   * Fetches the full simulation log history for a given story.
   * @param {string|number} story_id
   * @returns {Promise<any[]>}
   */
  async load_log(story_id) {
    if (!story_id) return [];
    const normalized_ids = [...new Set([String(story_id), isNaN(Number(story_id)) ? story_id : Number(story_id)])];
    return await db.simulation_log.where("story_id").anyOf(normalized_ids).sortBy("created_at");
  },
};
