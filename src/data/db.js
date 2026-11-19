/**
 * src/data/db.js
 * ============================================================================
 * 🗄️ PERSISTENCE ENGINE (Dexie.js)
 * ============================================================================
 *
 * Single source of truth for pure Promise-based persistence across:
 * - Entities (Characters and Fractals with 4-quadrant adapt-on-read)
 * - Stories & Narrative Archives
 * - Simulation Logs
 * - Session tracking & KV settings
 * - Mutation Ledger (Event-sourced diffs tagged writer: "kernel")
 *
 * Invariant: Schema strictly remains at db.version(2) to prevent versionchange
 * page reloads during parallel coexistence.
 * ============================================================================
 */

import Dexie from "dexie";
import { normalize_entity } from "./records.js";
import { ALL_PREMADES, ORION_NOVA_GLITCH_STORY } from "@definitions";

/**
 * Dexie database instance.
 */
export const db = /** @type {any} */ (new Dexie("rpglitch"));

// Canonical Schema (Strictly Version 2)
db.version(1).stores({
  entities: "id, name, description, profile_picture, signature_color, created_at, updated_at, tags, type",
  stories: "++id, title, ai_id, user_id, fractal_id, round, created_at, updated_at, *npc_ids",
  simulation_log: "++id, story_id, role, type, character_name, text, seed, meta, created_at",
  kv_settings: "key",
  sessions: "++id, session_id, timestamp",
  audio_prefs: "key",
});

db.version(2).stores({ mutation_ledger: "++id, story_id, entity_id, [story_id+round+seq], [entity_id+field], round, timestamp" });

let _versionchange_quiesce = null;
let _is_versionchange_pending = false;

/**
 * Registers an emergency quiesce callback invoked synchronously when Dexie receives
 * a `versionchange` event from another tab attempting an upgrade.
 * @param {(() => void) | null} quiesce_callback
 */
export function set_versionchange_quiesce(quiesce_callback) {
  _versionchange_quiesce = quiesce_callback;
}

db.on("blocked", () => {
  console.warn("[Database] Database is blocked by another tab/version. Please close other instances.");
});

db.on("versionchange", () => {
  if (_is_versionchange_pending) return;
  _is_versionchange_pending = true;
  try {
    _versionchange_quiesce?.();
  } catch (error) {
    console.warn("[Database] Versionchange quiesce failed:", error);
  }
  db.close();
  if (typeof window !== "undefined") {
    window.location.reload();
  }
});

/**
 * Initializes and opens the database connection.
 * @returns {Promise<typeof db>}
 */
export async function init_db() {
  if (!db.isOpen()) {
    await db.open();
  }
  return db;
}

// ============================================================================
// 1. STORY CRUD
// ============================================================================

/**
 * Coerces numeric string keys into numbers for Dexie table lookups.
 * @param {string | number} id
 * @returns {string | number}
 */
export function coerce_story_key(id) {
  if (typeof id === "string" && /^\d+$/.test(id)) return Number(id);
  return id;
}

/**
 * Lists all stories with associated fractal summary metadata.
 * @returns {Promise<Array<object>>}
 */
export async function list_stories() {
  const all_stories = await db.stories.orderBy("updated_at").reverse().toArray();
  const fractal_ids = [...new Set(all_stories.filter((s) => s.fractal_id).map((s) => s.fractal_id))];

  const fractals = await db.entities.where("id").anyOf(fractal_ids).toArray();
  const fractal_map = new Map(fractals.map((f) => [f.id, f]));

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
export async function get_story(id) {
  return await db.stories.get(coerce_story_key(id));
}

/**
 * Creates a new story record.
 * @param {object} data
 * @returns {Promise<number | string>} created story id
 */
export async function create_story(data) {
  const now = Date.now();
  const payload = {
    title: data.title || "Untitled Story",
    ai_id: data.ai_id || null,
    user_id: data.user_id || null,
    fractal_id: data.fractal_id || null,
    round: Number(data.round ?? 0),
    npc_ids: Array.isArray(data.npc_ids) ? data.npc_ids : [],
    is_concluded: 0,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
    ...data,
  };
  return await db.stories.add(payload);
}

/**
 * Updates an existing story record.
 * @param {string | number} id
 * @param {object} changes
 * @returns {Promise<number>}
 */
export async function update_story(id, changes) {
  const updated_at = changes.updated_at || Date.now();
  return await db.stories.update(coerce_story_key(id), { ...changes, updated_at });
}

/**
 * Replaces a story's world-cast roster (NPC ids).
 * Sanitizes input (trims, drops empties, dedupes).
 *
 * @param {string | number} id
 * @param {string[]} npc_ids
 * @returns {Promise<number>}
 */
export async function update_cast(id, npc_ids) {
  const sanitized_npc_ids =
    Array.isArray(npc_ids) ? [...new Set(npc_ids.map((npc_identifier) => (npc_identifier == null ? "" : String(npc_identifier).trim())).filter(Boolean))] : [];
  return await db.stories.update(coerce_story_key(id), { npc_ids: sanitized_npc_ids, updated_at: Date.now() });
}

/**
 * Resolves the entity ids currently claimed by active (non-concluded) stories.
 *
 * @returns {Promise<string[]>}
 */
export async function active_entity_ids() {
  try {
    const all_stories = await db.stories.toArray();
    const story_ids = all_stories.map((story_record) => story_record.id);
    const normalized_ids = [...new Set(story_ids.flatMap((id) => [String(id), id]))];

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
export async function conclude_story(id) {
  return await db.stories.update(coerce_story_key(id), { is_concluded: 1, updated_at: Date.now() });
}

export const stories = {
  list: list_stories,
  get: get_story,
  create: create_story,
  update: update_story,
  update_cast,
  active_entity_ids,
  conclude: conclude_story,
  delete: delete_story,
};

export const entities = {
  list: (type) => list_entities(type),
  get: (type_or_id, maybe_id) => {
    const id = maybe_id !== undefined ? maybe_id : type_or_id;
    const type = maybe_id !== undefined ? type_or_id : null;
    return get_entity(id, type);
  },
  upsert: (type_or_entity, maybe_entity) => {
    const entity = maybe_entity !== undefined ? maybe_entity : type_or_entity;
    if (maybe_entity !== undefined && type_or_entity) {
      entity.type = type_or_entity;
    }
    return upsert_entity(entity);
  },
  update: update_entity,
  delete: (type_or_id, maybe_id) => {
    const id = maybe_id !== undefined ? maybe_id : type_or_id;
    return delete_entity(id);
  },
  remove: (type_or_id, maybe_id) => {
    const id = maybe_id !== undefined ? maybe_id : type_or_id;
    return delete_entity(id);
  },
};

/**
 * Deletes a story and cascades to simulation logs and mutation ledger.
 * @param {string | number} id
 * @returns {Promise<void>}
 */
export async function delete_story(id) {
  const story_id = coerce_story_key(id);
  const ids_to_match = [...new Set([story_id, String(story_id)])];

  await db.simulation_log.where("story_id").anyOf(ids_to_match).delete();
  if (db.mutation_ledger) {
    await db.mutation_ledger.where("story_id").anyOf(ids_to_match).delete();
  }
  await db.stories.delete(story_id);
}

// ============================================================================
// 2. ENTITY CRUD & SEEDING
// ============================================================================

/**
 * Concurrency guard for starter seeding.
 */
let _is_seeding_active = false;

/**
 * Seeds starter entities into IndexedDB idempotently by ID.
 * @returns {Promise<void>}
 */
export async function seed_premades() {
  if (_is_seeding_active) return;
  _is_seeding_active = true;

  try {
    const existing_records = await db.entities.toArray();
    const existing_by_id = new Map(existing_records.map((r) => [r.id, r]));

    const to_put = [];
    for (const premade of ALL_PREMADES) {
      const existing = existing_by_id.get(premade.id);
      if (!existing) {
        to_put.push(normalize_entity(premade));
      }
    }

    if (to_put.length > 0) {
      await db.entities.bulkPut(to_put);
    }

    await seed_premade_story(ORION_NOVA_GLITCH_STORY);
  } finally {
    _is_seeding_active = false;
  }
}

/**
 * Seeds a premade concluded story, its simulation log, and its mutation ledger
 * entries idempotently by `premade_key` so premade entities share inspectable
 * history on boot.
 * @param {typeof ORION_NOVA_GLITCH_STORY} fixture
 * @returns {Promise<void>}
 */
async function seed_premade_story(fixture) {
  if (!fixture?.key || !db.stories || !db.simulation_log) return;

  const existing_stories = await db.stories.toArray();
  if (existing_stories.some((story) => story.premade_key === fixture.key)) {
    return;
  }

  const [ai_entity, user_entity, fractal_entity] = await Promise.all([
    db.entities.get(fixture.ai_id),
    db.entities.get(fixture.user_id),
    db.entities.get(fixture.fractal_id),
  ]);
  if (!ai_entity || !user_entity || !fractal_entity) return;

  const base_time = Date.now() - fixture.turns.length * 60_000;
  const story_row_id = await db.stories.add({
    premade_key: fixture.key,
    title: fixture.title,
    ai_id: fixture.ai_id,
    user_id: fixture.user_id,
    fractal_id: fixture.fractal_id,
    visual_style: fixture.visual_style,
    narrative_style: fixture.narrative_style,
    entity_snapshots: { ai: structuredClone(ai_entity), user: structuredClone(user_entity), fractal: structuredClone(fractal_entity) },
    npc_ids: [],
    round: fixture.round,
    is_concluded: fixture.is_concluded ?? 1,
    created_at: base_time,
    updated_at: base_time + fixture.turns.length * 60_000,
  });

  const story_id = String(story_row_id);
  const log_rows = [
    {
      story_id,
      role: "system",
      type: "text",
      text: `Story Started: ${fixture.title}`,
      turn_type: "SYSTEM_TURN",
      round: 0,
      meta: { type: "STORY_START" },
      created_at: base_time,
    },
  ];

  const ledger_rows = [];
  for (const record of [ai_entity, user_entity, fractal_entity]) {
    const genesis_fields = {
      "eternal.physical": record.eternal?.physical,
      "eternal.non_physical": record.eternal?.non_physical,
      "present.physical": record.present?.physical,
      "present.non_physical": record.present?.non_physical,
      past: record.past,
      future: record.future,
    };
    for (const [field_path, value] of Object.entries(genesis_fields)) {
      if (value == null || !String(value).trim()) continue;
      ledger_rows.push({
        story_id,
        entity_id: String(record.id),
        round: 0,
        seq: 0,
        field: field_path,
        key: null,
        old_value: null,
        new_value: String(value),
        visibility: null,
        weight: null,
        writer: "genesis",
        decider: "genesis",
        timestamp: base_time,
      });
    }
  }

  for (const turn of fixture.turns) {
    const turn_time = base_time + turn.round * 60_000;
    log_rows.push(
      {
        story_id,
        role: "user",
        type: "text",
        character_name: user_entity.name,
        text: turn.user_text,
        turn_type: "USER_TURN",
        round: turn.round,
        meta: {},
        created_at: turn_time,
      },
      {
        story_id,
        role: "ai",
        type: "text",
        character_name: ai_entity.name,
        text: turn.ai_text,
        turn_type: "ACTOR_TURN",
        round: turn.round,
        meta: {},
        created_at: turn_time + 10_000,
      },
    );

    for (const mutation of turn.mutations) {
      ledger_rows.push({
        story_id,
        entity_id: String(mutation.entity_id),
        round: turn.round,
        seq: Number(mutation.seq ?? 1),
        field: String(mutation.field),
        key: mutation.key ? String(mutation.key).toUpperCase().trim() : null,
        old_value: mutation.old_value != null ? String(mutation.old_value) : null,
        new_value: mutation.new_value != null ? String(mutation.new_value) : null,
        visibility:
          mutation.visibility === "hide" ? "hide"
          : mutation.visibility === "show" ? "show"
          : null,
        weight: typeof mutation.weight === "number" && !Number.isNaN(mutation.weight) ? mutation.weight : null,
        writer: mutation.writer || "kernel",
        decider: mutation.decider || "director",
        timestamp: turn_time + 15_000 + Number(mutation.seq ?? 1) * 100,
      });
    }
  }

  log_rows.push({
    story_id,
    role: "system",
    type: "text",
    text: `Story Concluded: ${fixture.title}`,
    turn_type: "SYSTEM_TURN",
    round: fixture.round,
    meta: { type: "EPILOGUE", is_epilogue: true },
    created_at: base_time + fixture.turns.length * 60_000 + 20_000,
  });

  await db.simulation_log.bulkAdd(log_rows);
  if (db.mutation_ledger && ledger_rows.length > 0) {
    await db.mutation_ledger.bulkAdd(ledger_rows);
  }
}

/**
 * Lists entities filtered by optional type ("character" | "fractal").
 * Always passes records through adapt-on-read normalize_entity.
 *
 * @param {"character" | "fractal"} [type]
 * @returns {Promise<Array<object>>}
 */
export async function list_entities(type) {
  let records;
  if (type) {
    records = await db.entities.where("type").equals(type).toArray();
  } else {
    records = await db.entities.toArray();
  }
  return records.map((record) => normalize_entity(record));
}

/**
 * Retrieves a single entity by ID with adapt-on-read.
 * Returns null if record does not exist.
 *
 * @param {string} id
 * @returns {Promise<object | null>}
 */
export async function get_entity(id, expected_type = null) {
  if (!id) return null;
  const raw = await db.entities.get(id);
  if (!raw) return null;
  if (expected_type && raw.type !== expected_type) return null;
  return normalize_entity(raw);
}

/**
 * Upserts a canonical entity record into IndexedDB.
 *
 * @param {object} entity
 * @returns {Promise<object>} normalized entity record
 */
export async function upsert_entity(entity) {
  const normalized = normalize_entity(entity);
  await db.entities.put(normalized);
  return normalized;
}

/**
 * Updates specific fields on an existing entity record in IndexedDB.
 *
 * @param {string} id
 * @param {Record<string, any>} changes
 * @returns {Promise<number>} Number of updated records (1 if updated, 0 if not found)
 */
export async function update_entity(id, changes) {
  if (!id) return 0;
  const updated_at = changes.updated_at || Date.now();
  return await db.entities.update(id, { ...changes, updated_at });
}

/**
 * Deletes an entity by ID.
 *
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function delete_entity(id) {
  if (!id) return;
  await db.entities.delete(id);
}
