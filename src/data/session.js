/**
 * src/data/session.js
 * ============================================================================
 * 📜 SESSION STORE - Pure session & simulation-log persistence (Rank 2, data)
 * ============================================================================
 *
 * Pure Promise-based session tracking, story-session creation and simulation
 * log CRUD over the Dexie `db` (same layer, ./db.js). Zero Svelte runes, zero
 * upward imports: reactive-feed notification travels through an explicit
 * `log_store` passed per-call, runtime sync through caller hooks — never
 * through direct engine imports.
 *
 * Phase 3 consolidation: session/log logic moved out of `src/data/db.js`
 * (Sections 3 & 4) and the pure DB operations absorbed from
 * `src/engine/sessions.svelte.js` (which remains as the reactive driver
 * facade). Fixes vs. the originals:
 * - create_from_selection filters nullish ai_id/user_id BEFORE String(), so
 *   missing ids no longer poison the exclusion set as "null"/"undefined".
 * - match_speaker_snapshots + resolve_log_entity_id accept lowercase AND
 *   uppercase snapshot keys (story rows persist lowercase trio snapshots).
 * - delete_log_entry resolves meta.id references (not just raw keys).
 * - edit_log_entry accepts an optional meta patch (prologue finalize path).
 * - delete_log_attachment reuses is_empty_narrative_message.
 * - regenerate keeps its STORY_START / prologue / epilogue protection.
 * ============================================================================
 */

import { has_bracket_bond, is_empty_narrative_message, is_telemetry_meta, match_speaker_snapshots } from "@simulation";
import { coerce_story_key, db } from "./db.js";
import { append_ledger_entries } from "./ledger.js";

/** Durably stored active session key in kv_settings */
export const SESSION_ID_KEY = "active_session_id";

// ============================================================================
// 1. SESSION TRACKING & KV SETTINGS (from db.js Section 4)
// ============================================================================

/**
 * Records a session access timestamp.
 * @param {string} session_id
 * @returns {Promise<number>}
 */
export async function record_session_access(session_id) {
  return await db.sessions.add({ session_id: String(session_id), timestamp: Date.now() });
}

/**
 * Retrieves recent session access entries.
 * @param {number} [limit=10]
 * @returns {Promise<Array<object>>}
 */
export async function get_recent_sessions(limit = 10) {
  return await db.sessions.orderBy("id").reverse().limit(limit).toArray();
}

/**
 * Retrieves the currently active session ID pointer.
 * @returns {Promise<string | null>}
 */
export async function get_active_session_id() {
  const row = await db.kv_settings.get(SESSION_ID_KEY);
  return row?.value ?? null;
}

/**
 * Returns the currently active session ID pointer, or throws if none is active.
 * @returns {Promise<string>}
 * @throws {Error} If no active session found.
 */
export async function require_active() {
  const active_id = await get_active_session_id();
  if (!active_id) {
    throw new Error("[Session] No active session found.");
  }
  return active_id;
}

/**
 * Sets the active session ID pointer.
 * @param {string} session_id
 * @returns {Promise<void>}
 */
export async function set_active_session_id(session_id) {
  await db.kv_settings.put({ key: SESSION_ID_KEY, value: String(session_id), updated_at: Date.now() });
}

/**
 * Clears the active session ID pointer.
 * @returns {Promise<void>}
 */
export async function clear_active_session_id() {
  await db.kv_settings.delete(SESSION_ID_KEY);
}

// ============================================================================
// 2. SPEAKER RESOLUTION (from sessions.svelte.js, case fixes applied)
// ============================================================================

/**
 * Reads a trio/cast snapshot tolerant to lowercase AND uppercase keys.
 * Story rows persist lowercase (`ai`/`user`/`fractal`); live snapshots use
 * uppercase (`AI`/`USER`/`FRACTAL`).
 * @param {any} snapshots
 * @param {"AI" | "USER" | "FRACTAL"} role_key
 * @returns {any}
 */
function read_trio_snapshot(snapshots, role_key) {
  if (!snapshots || typeof snapshots !== "object") return null;
  return snapshots[role_key] ?? snapshots[role_key.toLowerCase()] ?? null;
}

/**
 * Resolves a log speaker to its canonical entity id at creation:
 * explicit ids win; otherwise `character_name` matches the trio (+ NPC cast
 * when snapshots carry them, else a story-fallback scan), falling back to
 * role-keyed trio ids. Snapshot keys may be lowercase or uppercase.
 * @param {string} role
 * @param {string} character_name
 * @param {{ AI?: any, USER?: any, FRACTAL?: any, ai?: any, user?: any, fractal?: any, NPCS?: any } | null} [snapshots=null]
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
      const story = await db.stories.get(coerce_story_key(story_id));
      trio = story?.entity_snapshots ?? story?.entity_Snapshots ?? null;
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
  const role_key =
    role === "user" ? "USER"
    : role === "fractal" ? "FRACTAL"
    : role === "ai" ? "AI"
    : null;
  const trio_entry = role_key ? read_trio_snapshot(effective_trio, role_key) : null;
  return trio_entry?.id ? String(trio_entry.id) : null;
}

/**
 * Resolves the round for a log write when the caller passes none: the story
 * row's round (maintained by `runtime.save` every turn).
 * @param {string|number|null} story_id
 * @returns {Promise<number>}
 */
export async function resolve_story_round(story_id) {
  if (story_id == null) return 0;
  try {
    const story = await db.stories.get(coerce_story_key(story_id));
    return typeof story?.round === "number" ? story.round : 0;
  } catch {
    return 0;
  }
}

// ============================================================================
// 3. SIMULATION LOG CRUD (from db.js Section 3, feed-aware)
// ============================================================================

/**
 * Resolves a simulation log entry by exact ID or metadata reference,
 * optionally consulting a reactive feed for metadata matches.
 * @param {string | number} id
 * @param {Array<any> | null} [feed=null] - reactive feed for metadata matches
 * @returns {Promise<any | null>}
 */
export async function _find_log_entry(id, feed = null) {
  const numeric_key = isNaN(Number(id)) ? null : Number(id);
  let entry = numeric_key != null ? await db.simulation_log.get(numeric_key) : null;
  if (!entry && typeof id === "string") {
    entry = await db.simulation_log.get(id);
  }
  if (!entry) {
    const feed_list = Array.isArray(feed) ? feed : [];
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

/**
 * Single orchestrated log writer: appends a narrative message to the
 * simulation log, stamps the speaker entity id, resolves the round from the
 * story row, and notifies the bound reactive feed. System telemetry goes
 * through here too (`turn_type: "SYSTEM_TURN"`).
 * Sessionless writes (story wiped while a background job was in flight)
 * degrade to a no-op sentinel instead of throwing.
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
 * @param {{ log_store?: any }} [env] - notification sink (defaults to bound store)
 * @returns {Promise<Record<string, any>>}
 */
export async function log_message(
  text,
  role,
  character_name,
  { turn_type = "USER_TURN", meta = {}, attachments = [], story_id = null, entity_id = null, round = null, snapshots = null } = {},
  env = null,
) {
  let effective_story_id = story_id ?? null;
  if (effective_story_id == null) {
    try {
      effective_story_id = await require_active();
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
    meta: structuredClone(meta),
    created_at: Date.now(),
  };
  if (attachments && attachments.length > 0) {
    entry.attachments = structuredClone(attachments);
  }
  if (meta && meta.id) {
    entry.id = meta.id;
    await db.simulation_log.put(entry);
  } else {
    entry.id = await db.simulation_log.add(entry);
  }
  env?.log_store?.add?.(entry, snapshots);
  return entry;
}

/**
 * Fetches the full simulation log history for a given story.
 * @param {string|number} story_id
 * @returns {Promise<any[]>}
 */
export async function load_log(story_id) {
  if (!story_id) return [];
  const normalized_ids = [...new Set([String(story_id), isNaN(Number(story_id)) ? story_id : Number(story_id)])];
  return await db.simulation_log.where("story_id").anyOf(normalized_ids).sortBy("created_at");
}

/**
 * Story-row log fetch, key-coerced and id-ordered (db.js get_story_log).
 * @param {string | number} story_id
 * @returns {Promise<Array<object>>}
 */
export async function get_story_log(story_id) {
  const key = coerce_story_key(story_id);
  const ids_to_match = [...new Set([key, String(key)])];
  return await db.simulation_log.where("story_id").anyOf(ids_to_match).sortBy("id");
}

/**
 * Deletes all simulation log entries for a story.
 * @param {string | number} story_id
 * @returns {Promise<number>} deleted count
 */
export async function delete_story_log(story_id) {
  const key = coerce_story_key(story_id);
  const ids_to_match = [...new Set([key, String(key)])];
  return await db.simulation_log.where("story_id").anyOf(ids_to_match).delete();
}

/**
 * Deletes a single simulation log entry by ID or metadata reference.
 * @param {string | number} id
 * @param {{ log_store?: any }} [env] - notification sink (defaults to bound store)
 * @returns {Promise<void>}
 */
export async function delete_log_entry(id, env = null) {
  const entry = await _find_log_entry(id, env?.log_store?.feed);
  const key =
    entry?.id != null ? entry.id
    : isNaN(Number(id)) ? id
    : Number(id);
  await db.simulation_log.delete(key);
  env?.log_store?.remove?.(key);
}

/**
 * Updates text for an existing simulation log entry, with optional meta merge
 * (prologue finalize path stamps `{ think }` after the beat resolves).
 * @param {string | number} id
 * @param {string} new_text
 * @param {Record<string, any> | null} [meta_patch=null]
 * @param {{ log_store?: any }} [env] - notification sink (defaults to bound store)
 * @returns {Promise<void>}
 */
export async function edit_log_entry(id, new_text, meta_patch = null, env = null) {
  const entry = await _find_log_entry(id, env?.log_store?.feed);
  const key =
    entry ? entry.id
    : isNaN(Number(id)) ? id
    : Number(id);
  const changes = { text: new_text };
  if (meta_patch && typeof meta_patch === "object") {
    changes.meta = { ...(entry?.meta || {}), ...meta_patch };
  }
  await db.simulation_log.update(key, changes);
  env?.log_store?.update?.(id, meta_patch && typeof meta_patch === "object" ? { text: new_text, meta: changes.meta } : { text: new_text });
}

/**
 * Updates an attachment at a specific index in a log entry.
 * @param {string | number} id
 * @param {number} attachment_index
 * @param {Record<string, any>} new_attachment
 * @param {{ log_store?: any }} [env] - notification sink (defaults to bound store)
 * @returns {Promise<void>}
 */
export async function update_log_attachment(id, attachment_index, new_attachment, env = null) {
  const entry = await _find_log_entry(id, env?.log_store?.feed);
  if (entry) {
    if (!Array.isArray(entry.attachments)) {
      entry.attachments = [];
    }
    entry.attachments[attachment_index] = structuredClone(new_attachment);
    const plain_entry = structuredClone(entry);
    await db.simulation_log.put(plain_entry);
    env?.log_store?.update?.(id, { attachments: plain_entry.attachments });
  }
}

/**
 * Removes an attachment from a log entry (or deletes the entry if it becomes
 * an empty non-telemetry bubble).
 * @param {string | number} id
 * @param {number} attachment_index
 * @param {{ log_store?: any }} [env] - notification sink (defaults to bound store)
 * @returns {Promise<void>}
 */
export async function delete_log_attachment(id, attachment_index, env = null) {
  const entry = await _find_log_entry(id, env?.log_store?.feed);
  if (entry && Array.isArray(entry.attachments)) {
    entry.attachments.splice(attachment_index, 1);
    const is_empty_image_bubble = is_empty_narrative_message(entry.text, { attachments: entry.attachments, meta: entry.meta });
    if (is_empty_image_bubble) {
      const key =
        entry.id != null ? entry.id
        : isNaN(Number(id)) ? id
        : Number(id);
      await db.simulation_log.delete(key);
      env?.log_store?.remove?.(key);
    } else {
      const plain_entry = structuredClone(entry);
      await db.simulation_log.put(plain_entry);
      env?.log_store?.update?.(id, { attachments: plain_entry.attachments });
    }
  }
}

// ============================================================================
// 4. STORY SESSION CREATION & TURN WRITERS (from sessions.svelte.js)
// ============================================================================

/**
 * Creates a new story record from a character/fractal storyboard selection,
 * auto-seeding the cast roster with connected NPCs and Wanderers, writing
 * genesis ledger lines and the STORY_START system entry.
 * @param {Record<string, any>} selection
 * @param {{ log_store?: any, set_active?: (id: string) => Promise<void> }} [deps]
 * @returns {Promise<string>} story id
 */
export async function create_from_selection(selection, deps = {}) {
  const ai_entity = selection.ai_id ? await db.entities.get(selection.ai_id) : null;
  const user_entity = selection.user_id ? await db.entities.get(selection.user_id) : null;
  const fractal_entity = selection.fractal_id ? await db.entities.get(selection.fractal_id) : null;

  const visual_style = selection.visual_style || selection.fractal?.visual_style || fractal_entity?.visual_style;
  const narrative_style = selection.narrative_style || selection.fractal?.narrative_style || fractal_entity?.narrative_style;

  // Filter nullish ids BEFORE String(): String(null) is "null" (truthy) and
  // would poison the exclusion set when a slot is unpicked.
  const excluded_ids = new Set([selection.ai_id, selection.user_id].filter((slot_id) => slot_id != null).map((slot_id) => String(slot_id)));
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
      ai: ai_entity ? structuredClone(ai_entity) : { dynamics: {} },
      user: user_entity ? structuredClone(user_entity) : { dynamics: {} },
      fractal: fractal_entity ? structuredClone(fractal_entity) : { dynamics: {}, visual_style, narrative_style },
    },
    npc_ids: Array.from(initial_npc_ids),
    created_at: Date.now(),
    updated_at: Date.now(),
    round: 0,
  });

  const story_id = String(id);
  if (typeof deps.set_active === "function") {
    await deps.set_active(story_id);
  }

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
  deps.log_store?.add?.(entry);

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
}

/**
 * Logs a user turn message in the simulation log. Speaker name and round
 * resolve from the active story row (no runtime dependency).
 * @param {string} text
 * @param {{ active_id?: string | null, log_store?: any }} [deps]
 * @returns {Promise<any>}
 */
export async function send(text, deps = {}) {
  let speaker_name = "User";
  let round = 0;
  let story_id = deps?.active_id ?? null;
  try {
    if (story_id == null) story_id = await require_active();
    const story = await db.stories.get(coerce_story_key(story_id));
    speaker_name = story?.entity_snapshots?.user?.name || story?.entity_snapshots?.USER?.name || "User";
    round = typeof story?.round === "number" ? story.round : 0;
  } catch {
    /* No active story: fall through to the sessionless sentinel in log_message */
    story_id = null;
  }
  return await log_message(text, "user", speaker_name, { turn_type: "USER_TURN", round, story_id }, { log_store: deps?.log_store });
}

/**
 * Removes trailing turns back to the last user message to allow regeneration.
 * Consolidated single pass for efficiency. Never walks past protected init
 * entries (STORY_START / prologue / epilogue) or the target round.
 * @param {{ active_id?: string | null, log_store?: any }} [deps]
 * @returns {Promise<void>}
 */
export async function regenerate(deps = {}) {
  const story_id = deps?.active_id ?? (await require_active());
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
          deps?.log_store?.remove?.(entry.id);
          continue;
        }
      }
      // Preserve prior telemetry entries even if placed near trailing turns
      if (is_telemetry_meta(entry.meta)) {
        continue;
      }
      await db.simulation_log.delete(entry.id);
      deps?.log_store?.remove?.(entry.id);
    } else {
      const is_empty_stale = is_empty_narrative_message(entry.text, { attachments: entry.attachments, meta: entry.meta });

      if (is_empty_stale) {
        await db.simulation_log.delete(entry.id);
        deps?.log_store?.remove?.(entry.id);
      }
    }
  }
}
