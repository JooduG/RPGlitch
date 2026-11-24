/**
 * src/data/entity-repository.js
 * ============================================================================
 * 🧬 ENTITY REPOSITORY & PREMADE SEEDING (pure, no runes)
 * ============================================================================
 *
 * IndexedDB CRUD for characters and fractals with adapt-on-read normalization,
 * plus idempotent starter entity seeding (`ALL_PREMADES`).
 * ============================================================================
 */

import { ALL_PREMADES } from "@definitions";
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
  } finally {
    _is_seeding_active = false;
  }
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
async function list_entities(type) {
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
async function get_entity(id, expected_type = null) {
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
async function upsert_entity(entity) {
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
async function update_entity(id, changes) {
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
async function delete_entity(id) {
  if (!id) return;
  await db.entities.delete(id);
}

export const entities = { list: list_entities, get: get_entity, upsert: upsert_entity, update: update_entity, delete: delete_entity };
