/**
 * src/data/story-library.js
 * ============================================================================
 * 📚 STORY LIBRARY & SIMULATION LOGS (pure, no runes)
 * ============================================================================
 *
 * Cohesive persistence for stories (`db.stories`) and their narrative logs
 * (`db.simulation_log`), including cast management, speaker resolution,
 * story creation from selection, and turn writers (`send`, `regenerate`).
 * ============================================================================
 */

import { has_bracket_bond, is_empty_narrative_message, is_telemetry_meta, match_speaker_snapshots } from "@simulation";
import { coerce_numeric_key, db, require_active, story_key_variants } from "./db.js";

// ============================================================================
// 1. STORY CRUD & CAST MANAGEMENT
// ============================================================================

/**
 * Lists all stories with associated fractal summary metadata.
 * @returns {Promise<Array<object>>}
 */
async function list_stories() {
  const all_stories = await db.stories.orderBy("updated_at").reverse().toArray();
  const fractal_ids = [...new Set(all_stories.filter((story) => story.fractal_id).map((story) => story.fractal_id))];

  const fractals = await db.entities.where("id").anyOf(fractal_ids).toArray();
  const fractal_map = new Map(fractals.map((fractal) => [fractal.id, fractal]));

  return all_stories.map((story) => {
    const fractal = fractal_map.get(story.fractal_id);
    const is_concluded = Boolean(story.is_concluded);

    return {
      id: story.id,
      title: story.title || "Untitled Story",
      state: is_concluded ? "concluded" : "active",
      last_played: story.updated_at || story.created_at,
      fractal_profile_picture: fractal?.profile_picture || "",
      fractal_name: fractal?.name || "The Void",
      signature_color: fractal?.signature_color || "default",
      npc_ids: Array.isArray(story.npc_ids) ? story.npc_ids : [],
      ai_id: story.ai_id != null ? String(story.ai_id) : null,
      user_id: story.user_id != null ? String(story.user_id) : null,
      fractal_id: story.fractal_id != null ? String(story.fractal_id) : null,
    };
  });
}

/**
 * Retrieves a single story by ID.
 * @param {string | number} id
 * @returns {Promise<object | undefined>}
 */
async function get_story(id) {
  return await db.stories.get(coerce_numeric_key(id));
}

/**
 * Updates an existing story record.
 * @param {string | number} id
 * @param {object} changes
 * @returns {Promise<number>}
 */
async function update_story(id, changes) {
  const updated_at = changes.updated_at || Date.now();
  return await db.stories.update(coerce_numeric_key(id), { ...changes, updated_at });
}

/**
 * Replaces a story's world-cast roster (NPC ids).
 * Sanitizes input (trims, drops empties, dedupes).
 *
 * @param {string | number} id
 * @param {string[]} npc_ids
 * @returns {Promise<number>}
 */
async function update_cast(id, npc_ids) {
  const sanitized_npc_ids =
    Array.isArray(npc_ids) ? [...new Set(npc_ids.map((npc_identifier) => (npc_identifier == null ? "" : String(npc_identifier).trim())).filter(Boolean))] : [];
  return await db.stories.update(coerce_numeric_key(id), { npc_ids: sanitized_npc_ids, updated_at: Date.now() });
}

/**
 * Resolves the entity ids currently claimed by active (non-concluded) stories.
 *
 * @returns {Promise<string[]>}
 */
async function active_entity_ids() {
  try {
    const all_stories = await db.stories.toArray();
    const normalized_ids = [...new Set(all_stories.flatMap((story_record) => story_key_variants(story_record.id)))];

    const epilogue_story_id_set = new Set();
    if (normalized_ids.length > 0) {
      const simulation_log_entries = await db.simulation_log.where("story_id").anyOf(normalized_ids).toArray();
      for (const entry of simulation_log_entries) {
        if (entry?.meta?.is_epilogue) epilogue_story_id_set.add(String(entry.story_id));
      }
    }

    const claimed_entity_ids = new Set();
    for (const story of all_stories) {
      if (story.is_concluded || epilogue_story_id_set.has(String(story.id))) continue;
      for (const key of ["ai_id", "user_id", "fractal_id"]) {
        if (story[key] != null) claimed_entity_ids.add(String(story[key]));
      }
    }

    return [...claimed_entity_ids];
  } catch (error) {
    console.error("[Storage] Failed to resolve active entity claims:", error);
    return [];
  }
}

/**
 * Marks a story as concluded.
 * @param {string | number} id
 * @returns {Promise<number>}
 */
async function conclude_story(id) {
  return await db.stories.update(coerce_numeric_key(id), { is_concluded: 1, updated_at: Date.now() });
}

/**
 * Deletes a story and cascades to its simulation logs.
 * @param {string | number} id
 * @returns {Promise<void>}
 */
async function delete_story(id) {
  const story_id = coerce_numeric_key(id);
  await db.simulation_log.where("story_id").anyOf(story_key_variants(story_id)).delete();
  await db.stories.delete(story_id);
}

export const stories = {
  list: list_stories,
  get: get_story,
  update: update_story,
  update_cast,
  active_entity_ids,
  conclude: conclude_story,
  delete: delete_story,
};

// ============================================================================
// 2. SPEAKER & ROUND RESOLUTION
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
 * role-keyed trio ids.
 * @param {string} role
 * @param {string} character_name
 * @param {{ AI?: any, USER?: any, FRACTAL?: any, ai?: any, user?: any, fractal?: any, NPCS?: any } | null} [snapshots=null]
 * @param {string|number|null} [story_id=null]
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
      const story = await db.stories.get(coerce_numeric_key(story_id));
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

  const role_key =
    role === "user" ? "USER"
    : role === "fractal" ? "FRACTAL"
    : role === "ai" ? "AI"
    : null;
  const trio_entry = role_key ? read_trio_snapshot(effective_trio, role_key) : null;
  return trio_entry?.id ? String(trio_entry.id) : null;
}

/**
 * Resolves the round for a log write from the story row.
 * @param {string|number|null} story_id
 * @returns {Promise<number>}
 */
async function resolve_story_round(story_id) {
  if (story_id == null) return 0;
  try {
    const story = await db.stories.get(coerce_numeric_key(story_id));
    return typeof story?.round === "number" ? story.round : 0;
  } catch {
    return 0;
  }
}

// ============================================================================
// 3. SIMULATION LOG CRUD
// ============================================================================

/**
 * Resolves a simulation log entry by exact ID or metadata reference,
 * optionally consulting a reactive feed for metadata matches.
 * @param {string | number} id
 * @param {Array<any> | null} [feed=null]
 * @returns {Promise<any | null>}
 */
async function find_log_entry(id, feed = null) {
  const numeric_key = isNaN(Number(id)) ? null : Number(id);
  let entry = numeric_key != null ? await db.simulation_log.get(numeric_key) : null;
  if (!entry && typeof id === "string") {
    entry = await db.simulation_log.get(id);
  }
  if (!entry && Array.isArray(feed)) {
    const feed_match = feed.find((message) => message.id === id || message.meta?.id === id || String(message.id) === String(id));
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
 * story row, and notifies the bound reactive feed.
 * Sessionless writes degrade to a no-op sentinel instead of throwing.
 * @param {string} text
 * @param {string} role
 * @param {string} character_name
 * @param {Object} [options]
 * @param {string} [options.turn_type="USER_TURN"]
 * @param {Record<string, any>} [options.meta={}]
 * @param {any[]} [options.attachments=[]]
 * @param {string|number|null} [options.story_id=null]
 * @param {number|null} [options.round=null]
 * @param {string|null} [options.entity_id=null]
 * @param {{ AI?: any, USER?: any, FRACTAL?: any, NPCS?: any } | null} [options.snapshots=null]
 * @param {{ log_store?: any } | null} [env=null]
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
      return { id: meta?.id || `skip-${Date.now()}`, story_id: null, role, text: "", character_name, turn_type, meta };
    }
  }

  if (is_empty_narrative_message(text, { attachments, meta })) {
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
 * Fetches the full simulation log history for a given story ordered by creation time.
 * @param {string|number} story_id
 * @returns {Promise<any[]>}
 */
export async function load_log(story_id) {
  if (!story_id) return [];
  return await db.simulation_log.where("story_id").anyOf(story_key_variants(story_id)).sortBy("created_at");
}

/**
 * Deletes a single simulation log entry by ID or metadata reference.
 * @param {string | number} id
 * @param {{ log_store?: any } | null} [env=null]
 * @returns {Promise<void>}
 */
export async function delete_log_entry(id, env = null) {
  const entry = await find_log_entry(id, env?.log_store?.feed);
  const key = entry?.id != null ? entry.id : coerce_numeric_key(id);
  await db.simulation_log.delete(key);
  env?.log_store?.remove?.(key);
}

/**
 * Updates text for an existing simulation log entry, with optional meta merge.
 * @param {string | number} id
 * @param {string} new_text
 * @param {Record<string, any> | null} [meta_patch=null]
 * @param {{ log_store?: any } | null} [env=null]
 * @returns {Promise<void>}
 */
export async function edit_log_entry(id, new_text, meta_patch = null, env = null) {
  const entry = await find_log_entry(id, env?.log_store?.feed);
  const key = entry ? entry.id : coerce_numeric_key(id);
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
 * @param {{ log_store?: any } | null} [env=null]
 * @returns {Promise<void>}
 */
export async function update_log_attachment(id, attachment_index, new_attachment, env = null) {
  const entry = await find_log_entry(id, env?.log_store?.feed);
  if (!entry) return;
  if (!Array.isArray(entry.attachments)) {
    entry.attachments = [];
  }
  entry.attachments[attachment_index] = structuredClone(new_attachment);
  const plain_entry = structuredClone(entry);
  await db.simulation_log.put(plain_entry);
  env?.log_store?.update?.(id, { attachments: plain_entry.attachments });
}

/**
 * Removes an attachment from a log entry (or deletes the entry if it becomes
 * an empty non-telemetry bubble).
 * @param {string | number} id
 * @param {number} attachment_index
 * @param {{ log_store?: any } | null} [env=null]
 * @returns {Promise<void>}
 */
export async function delete_log_attachment(id, attachment_index, env = null) {
  const entry = await find_log_entry(id, env?.log_store?.feed);
  if (!entry || !Array.isArray(entry.attachments)) return;

  entry.attachments.splice(attachment_index, 1);
  if (is_empty_narrative_message(entry.text, { attachments: entry.attachments, meta: entry.meta })) {
    const key = entry.id != null ? entry.id : coerce_numeric_key(id);
    await db.simulation_log.delete(key);
    env?.log_store?.remove?.(key);
    return;
  }

  const plain_entry = structuredClone(entry);
  await db.simulation_log.put(plain_entry);
  env?.log_store?.update?.(id, { attachments: plain_entry.attachments });
}

// ============================================================================
// 4. STORY SESSION CREATION & TURN WRITERS
// ============================================================================

/**
 * Creates a new story record from a character/fractal storyboard selection,
 * auto-seeding the cast roster with connected NPCs and Wanderers, and writing
 * the STORY_START system entry.
 * @param {Record<string, any>} selection
 * @param {{ log_store?: any, set_active?: (id: string) => Promise<void> }} [deps={}]
 * @returns {Promise<string>} story id
 */
export async function create_from_selection(selection, deps = {}) {
  const [ai_entity, user_entity, fractal_entity] = await Promise.all([
    selection.ai_id ? db.entities.get(selection.ai_id) : null,
    selection.user_id ? db.entities.get(selection.user_id) : null,
    selection.fractal_id ? db.entities.get(selection.fractal_id) : null,
  ]);

  const visual_style = selection.visual_style || selection.fractal?.visual_style || fractal_entity?.visual_style;
  const narrative_style = selection.narrative_style || selection.fractal?.narrative_style || fractal_entity?.narrative_style;

  // Filter nullish ids BEFORE String() so unpicked slots do not poison the exclusion set.
  const excluded_ids = new Set([selection.ai_id, selection.user_id].filter((slot_id) => slot_id != null).map((slot_id) => String(slot_id)));
  const initial_npc_ids = new Set(Array.isArray(selection.npc_ids) ? selection.npc_ids.map(String).filter((id) => !excluded_ids.has(id)) : []);

  try {
    const all_characters = await db.entities.where("type").equals("character").toArray();

    for (const character of all_characters) {
      const character_id = String(character.id);
      if (excluded_ids.has(character_id)) continue;

      if (character.is_wanderer || has_bracket_bond(fractal_entity, character) || (fractal_entity && has_bracket_bond(character, fractal_entity))) {
        initial_npc_ids.add(character_id);
      }
    }
  } catch (error) {
    console.warn("[Session] Auto-seeding fractal roster failed, falling back to selection:", error);
  }

  const now = Date.now();
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
    created_at: now,
    updated_at: now,
    round: 0,
  });

  const story_id = String(id);
  if (typeof deps.set_active === "function") {
    await deps.set_active(story_id);
  }

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

  return story_id;
}

/**
 * Logs a user turn message in the simulation log.
 * @param {string} text
 * @param {{ active_id?: string | null, log_store?: any }} [deps={}]
 * @returns {Promise<any>}
 */
export async function send(text, deps = {}) {
  let speaker_name = "User";
  let round = 0;
  let story_id = deps?.active_id ?? null;
  try {
    if (story_id == null) story_id = await require_active();
    const story = await db.stories.get(coerce_numeric_key(story_id));
    speaker_name = story?.entity_snapshots?.user?.name || story?.entity_snapshots?.USER?.name || "User";
    round = typeof story?.round === "number" ? story.round : 0;
  } catch {
    story_id = null;
  }
  return await log_message(text, "user", speaker_name, { turn_type: "USER_TURN", round, story_id }, { log_store: deps?.log_store });
}

/**
 * Removes trailing turns back to the last user message to allow regeneration.
 * Never walks past protected init entries (STORY_START / prologue / epilogue)
 * or the target round.
 * @param {{ active_id?: string | null, log_store?: any }} [deps={}]
 * @returns {Promise<void>}
 */
export async function regenerate(deps = {}) {
  const story_id = deps?.active_id ?? (await require_active());
  const logs = await load_log(story_id);
  const tail = logs.length > 0 ? logs[logs.length - 1] : null;
  const target_round = tail?.round ?? null;
  let found_user_turn = false;

  for (let index = logs.length - 1; index >= 0; index--) {
    const entry = logs[index];
    const is_protected_init = entry.meta?.type === "STORY_START" || entry.meta?.is_prologue || entry.meta?.is_epilogue || entry.meta?.is_prologue_image;
    if (target_round != null && entry.round != null && entry.round < target_round) break;

    if (!found_user_turn) {
      if (entry.role === "user") {
        found_user_turn = true;
        continue;
      }
      if (is_telemetry_meta(entry.meta) && !is_protected_init) {
        if (target_round == null || entry.round === target_round) {
          await db.simulation_log.delete(entry.id);
          deps?.log_store?.remove?.(entry.id);
        }
        continue;
      }
      if (is_telemetry_meta(entry.meta)) {
        continue;
      }
      await db.simulation_log.delete(entry.id);
      deps?.log_store?.remove?.(entry.id);
    } else if (is_empty_narrative_message(entry.text, { attachments: entry.attachments, meta: entry.meta })) {
      await db.simulation_log.delete(entry.id);
      deps?.log_store?.remove?.(entry.id);
    }
  }
}
