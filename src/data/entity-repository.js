/**
 * src/data/entity-repository.js
 * ============================================================================
 * 🧬 ENTITY REPOSITORY & PREMADE SEEDING (pure, no runes)
 * ============================================================================
 *
 * IndexedDB CRUD for characters and fractals with adapt-on-read normalization,
 * plus idempotent starter seeding (`ALL_PREMADES` and `ORION_NOVA_GLITCH_STORY`).
 * ============================================================================
 */

import { ALL_PREMADES, ORION_NOVA_GLITCH_STORY } from "@definitions";
import { db } from "./db.js";
import { normalize_entity } from "./records.js";

// ============================================================================
// 1. PREMADE SEEDING
// ============================================================================

/** Concurrency guard for starter seeding. */
let _is_seeding_active = false;

/**
 * Seeds starter entities into IndexedDB idempotently by ID.
 * @returns {Promise<void>}
 */
export async function seed_premades() {
  if (_is_seeding_active) return;
  _is_seeding_active = true;

  try {
    await db.transaction("rw", db.entities, async () => {
      const existing_records = await db.entities.toArray();
      const existing_by_id = new Map(existing_records.map((record) => [record.id, record]));

      const to_put = [];
      for (const premade of ALL_PREMADES) {
        if (!existing_by_id.has(premade.id)) {
          to_put.push(normalize_entity(premade));
        }
      }

      if (to_put.length > 0) {
        await db.entities.bulkPut(to_put);
      }
    });

    await seed_premade_story(ORION_NOVA_GLITCH_STORY);
  } finally {
    _is_seeding_active = false;
  }
}

/**
 * Seeds a premade concluded story and its simulation log idempotently by
 * `premade_key` so premade entities share inspectable history on boot.
 * @param {typeof ORION_NOVA_GLITCH_STORY} fixture
 * @returns {Promise<void>}
 */
async function seed_premade_story(fixture) {
  if (!fixture?.key || !db.stories || !db.simulation_log) return;

  await db.transaction("rw", [db.entities, db.stories, db.simulation_log], async () => {
    const existing_stories = await db.stories.toArray();
    if (existing_stories.some((story) => story.premade_key === fixture.key)) {
      return;
    }

    const legacy_story = existing_stories.find(
      (story) =>
        !story.premade_key &&
        story.title === fixture.title &&
        story.ai_id === fixture.ai_id &&
        story.user_id === fixture.user_id &&
        story.fractal_id === fixture.fractal_id &&
        Boolean(story.is_concluded),
    );
    if (legacy_story) {
      await db.stories.update(legacy_story.id, { premade_key: fixture.key });
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
  });
}

// ============================================================================
// 2. ENTITY CRUD
// ============================================================================

/**
 * Lists entities filtered by optional type ("character" | "fractal").
 * Always passes records through adapt-on-read normalize_entity.
 *
 * @param {"character" | "fractal"} [type]
 * @returns {Promise<Array<object>>}
 */
export async function list_entities(type) {
  const records = type ? await db.entities.where("type").equals(type).toArray() : await db.entities.toArray();
  return records.map((record) => normalize_entity(record));
}

/**
 * Retrieves a single entity by ID with adapt-on-read.
 * Returns null if record does not exist or fails optional type check.
 *
 * @param {string} id
 * @param {"character" | "fractal" | null} [expected_type=null]
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

export const entities = { list: list_entities, get: get_entity, upsert: upsert_entity, update: update_entity, delete: delete_entity };
