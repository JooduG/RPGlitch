/**
 * src/data/repository.js
 * 🏛️ REPOSITORY PERSISTENCE & ENTITY/STORY DATA ACCESS LAYER
 *
 * Provides high-level asynchronous CRUD operations for Characters, Fractals,
 * and Stories on top of the IndexedDB (Dexie) storage engine.
 *
 * DOMAINS:
 *   1. Foundry & Premade Seeding (`seed_premades`)
 *   2. Vector Embedding Serialization/Deserialization (`_map_vector_embeddings`)
 *   3. Entity Data Access (`entities`: `list`, `get`, `upsert`, `remove`, `update`)
 *   4. Narrative Story Access (`stories`: `list`, `get`, `update`, `update_cast`, `conclude`, `active_entity_ids`, `delete`)
 *   5. Key Coercion (`coerce_story_key`)
 *
 * ARCHITECTURAL INVARIANTS:
 *   - Normalization: Every entity is normalized through `format_premade` / `normalize`
 *     to preserve the canonical Four-Quadrant schema (eternal, present, past, future).
 *   - Float32Array Serialization: Temporal past memory vector embeddings are serialized
 *     into plain JSON arrays for Dexie storage and deserialized to Float32Array upon retrieval.
 *   - Reactive Story Bridge: Story mutations notify active subscribers via `stories_bridge.bump()`.
 */

import { generate_uuid, stories_bridge } from "@utils";
import { deserialize_embedding, serialize_embedding } from "@platform";
import { db } from "./db.js";
import { format_premade, normalize } from "./normalizer.js";
import { PREMADE_ENTITIES, PREMADE_ENTITY_MAP } from "./definitions/premade-entities.js";

// ============================================================================
// 1. DATA SEEDING (The Entity Foundry)
// ============================================================================

/**
 * Seeds the database with premade entities if they do not already exist.
 * Uses the Normalizer to enforce the Four-Quadrant entity structure.
 * @returns {Promise<void>}
 */
export async function seed_premades() {
  const global_scope = /** @type {any} */ (globalThis);
  if (typeof globalThis !== "undefined" && global_scope._seeding) return;
  if (typeof globalThis !== "undefined") global_scope._seeding = true;

  try {
    const existing_records = await db.entities.toArray();
    const entities_to_add = [];
    const existing_entity_ids = new Set();

    for (const existing_entity of existing_records) {
      if (existing_entity.id != null) existing_entity_ids.add(existing_entity.id);
      if (existing_entity.origin_id != null) existing_entity_ids.add(existing_entity.origin_id);
    }

    for (const blueprint of PREMADE_ENTITIES) {
      if (!existing_entity_ids.has(blueprint.id)) {
        const formatted_entity = format_premade(blueprint, blueprint.type);
        entities_to_add.push({
          ...formatted_entity,
          id: blueprint.id,
          origin_id: blueprint.id,
          is_snapshot: 0,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      }
    }

    if (entities_to_add.length > 0) {
      await db.entities.bulkPut(entities_to_add);
    }
  } catch (error) {
    console.error("[Repository] Foundry Error: Failed to seed premades:", error);
  } finally {
    if (typeof globalThis !== "undefined") {
      /** @type {any} */ (globalThis)._seeding = false;
    }
  }
}

// ============================================================================
// 2. VECTOR EMBEDDING TRANSFORMATIONS
// ============================================================================

/**
 * Transforms `_embedding` Float32Array on temporal past memory vectors
 * without mutating the input object.
 * @param {Record<string, any>} entity
 * @param {(embedding: any) => any} transform
 * @returns {Record<string, any>}
 */
function _map_vector_embeddings(entity, transform) {
  if (!entity || typeof entity !== "object") return entity;
  const transformed_entity = { ...entity };
  if (!Array.isArray(transformed_entity.past)) return transformed_entity;

  transformed_entity.past = transformed_entity.past.map((vector_entry) => {
    if (!vector_entry || !Object.prototype.hasOwnProperty.call(vector_entry, "_embedding")) return vector_entry;
    const mapped_embedding = transform(vector_entry._embedding);
    if (mapped_embedding) return { ...vector_entry, _embedding: mapped_embedding };
    const sanitized_entry = { ...vector_entry };
    delete sanitized_entry._embedding;
    return sanitized_entry;
  });

  return transformed_entity;
}

// ============================================================================
// 3. ENTITY DATA ACCESS LAYER (The CRUD Engine)
// ============================================================================

export const entities = {
  /**
   * Lists all entities of a specific type (character or fractal).
   * @param {'character'|'fractal'} type
   * @returns {Promise<any[]>}
   */
  async list(type) {
    try {
      const items = await db.entities.where("type").equals(type).toArray();
      return items.sort((alpha, beta) => (String(/** @type {any} */ (alpha).name) || "").localeCompare(String(/** @type {any} */ (beta).name) || ""));
    } catch (error) {
      console.error(`[Repository] Error listing ${type} census:`, error);
      return [];
    }
  },

  /**
   * Retrieves a single entity by ID, falling back to premades if not in DB.
   * @param {'character'|'fractal'} type
   * @param {string} id
   * @returns {Promise<Record<string, any>|null>}
   */
  async get(type, id) {
    try {
      let found_entity = await db.entities.get(id);
      if (!found_entity) {
        const raw_premade = PREMADE_ENTITY_MAP.get(id);
        if (raw_premade) found_entity = normalize(raw_premade);
      }
      if (!found_entity || found_entity.type !== type) return null;
      return _map_vector_embeddings(found_entity, deserialize_embedding);
    } catch (error) {
      console.error(`[Repository] Failed to fetch ${type} [${id}]:`, error);
      return null;
    }
  },

  /**
   * Saves or updates an entity, normalizing and deep-cloning to break Proxy reactivity.
   * @param {'character'|'fractal'} type
   * @param {Record<string, any>} entity
   * @returns {Promise<Record<string, any>>}
   */
  async upsert(type, entity) {
    try {
      const id = entity.id || generate_uuid();
      const base_entity = (await db.entities.get(id)) || {};
      const serializable_entity = _map_vector_embeddings(entity, serialize_embedding);
      const cloned_entity = JSON.parse(JSON.stringify(serializable_entity));

      const saved_entity = {
        ...base_entity,
        ...normalize({ ...base_entity, ...cloned_entity }),
        id,
        type,
        is_snapshot: 0,
        updated_at: Date.now(),
      };

      await db.entities.put(saved_entity);
      return saved_entity;
    } catch (error) {
      console.error(`[Repository] Failed to upsert ${type} [${entity?.id}]:`, error);
      throw error;
    }
  },

  /**
   * Deletes an entity if it matches the requested type.
   * @param {'character'|'fractal'} type
   * @param {string} id
   * @returns {Promise<void>}
   */
  async remove(type, id) {
    try {
      const existing_entity = await db.entities.get(id);
      if (existing_entity && existing_entity.type === type) {
        await db.entities.delete(id);
      }
    } catch (error) {
      console.error(`[Repository] Failed to delete ${type} [${id}]:`, error);
      throw error;
    }
  },

  /**
   * Updates an entity directly with partial data.
   * @param {'character'|'fractal'} type
   * @param {string} id
   * @param {Record<string, any>} data
   * @returns {Promise<number>}
   */
  async update(type, id, data) {
    try {
      const serializable_data = _map_vector_embeddings(data, serialize_embedding);
      const cloned_data = JSON.parse(JSON.stringify(serializable_data));
      const existing_entity = await db.entities.get(id);
      if (existing_entity && existing_entity.type === type) {
        return await db.entities.update(id, cloned_data);
      }
      return 0;
    } catch (error) {
      console.error(`[Repository] Failed to update ${type} [${id}]:`, error);
      throw error;
    }
  },
};

// ============================================================================
// 4. NARRATIVE STORY ARCHIVE (Story Data Access Layer)
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
 * Resolves the set of story ids whose log contains an epilogue entry.
 * @param {(string | number)[]} story_ids
 * @returns {Promise<Set<string>>}
 */
async function _epilogue_story_ids(story_ids) {
  const normalized_ids = [...new Set(story_ids.flatMap((id) => [String(id), id]))];
  if (normalized_ids.length === 0) return new Set();

  const simulation_log_entries = await db.simulation_log.where("story_id").anyOf(normalized_ids).toArray();
  const epilogue_story_id_set = new Set();
  for (const entry of simulation_log_entries) {
    if (entry?.meta?.is_epilogue) epilogue_story_id_set.add(String(entry.story_id));
  }
  return epilogue_story_id_set;
}

export const stories = {
  /**
   * Lists all stories with associated fractal metadata.
   * @returns {Promise<StorySummary[]>}
   */
  async list() {
    try {
      const all_stories = await db.stories.orderBy("updated_at").reverse().toArray();
      const fractal_ids = [...new Set(all_stories.filter((story_record) => story_record.fractal_id).map((story_record) => story_record.fractal_id))];

      const fractals = await db.entities
        .where("id")
        .anyOf(/** @type {any[]} */ (fractal_ids))
        .toArray();
      const fractal_map = new Map(fractals.map((fractal_entity) => [fractal_entity.id, fractal_entity]));

      const epilogue_ids = await _epilogue_story_ids(all_stories.map((story_record) => story_record.id));
      const unique_story_map = new Map();

      for (const story of all_stories) {
        if (!unique_story_map.has(story.id)) {
          const fractal = fractal_map.get(story.fractal_id);
          const is_concluded = Boolean(story.is_concluded || epilogue_ids.has(String(story.id)));

          unique_story_map.set(story.id, {
            id: story.id,
            title: story.title || "Untitled Fragment",
            state: is_concluded ? "concluded" : "active",
            last_played: story.updated_at,
            fractal_profile_picture: fractal?.profile_picture || "",
            fractal_name: fractal?.name || "The Void",
            signature_color: fractal?.signature_color || "default",
            npc_ids: Array.isArray(story.npc_ids) ? story.npc_ids : [],
          });
        }
      }

      return Array.from(unique_story_map.values());
    } catch (error) {
      console.error("[Repository] Archive Failure: Failed to list narrative records:", error);
      return [];
    }
  },

  /**
   * Retrieves a story by ID.
   * @param {string|number} id
   * @returns {Promise<any>}
   */
  async get(id) {
    return await db.stories.get(coerce_story_key(id));
  },

  /**
   * Updates a story and notifies reactive story subscribers.
   * @param {string|number} id
   * @param {Record<string, any>} changes
   * @returns {Promise<number>}
   */
  async update(id, changes) {
    const result = await db.stories.update(coerce_story_key(id), changes);
    stories_bridge.bump();
    return result;
  },

  /**
   * Replaces a story's world-cast roster (NPC ids).
   * @param {string | number} id
   * @param {string[]} npc_ids
   * @returns {Promise<number>}
   */
  async update_cast(id, npc_ids) {
    const sanitized_npc_ids = Array.isArray(npc_ids)
      ? [...new Set(npc_ids.map((npc_identifier) => (npc_identifier == null ? "" : String(npc_identifier).trim())).filter(Boolean))]
      : [];
    const result = await db.stories.update(coerce_story_key(id), { npc_ids: sanitized_npc_ids });
    stories_bridge.bump();
    return result;
  },

  /**
   * Marks a story as concluded after its epilogue has been delivered.
   * @param {string | number} id
   * @returns {Promise<number>}
   */
  async conclude(id) {
    const result = await db.stories.update(coerce_story_key(id), { is_concluded: 1 });
    stories_bridge.bump();
    return result;
  },

  /**
   * Resolves the entity ids currently claimed by active (non-concluded) stories.
   * @returns {Promise<string[]>}
   */
  async active_entity_ids() {
    try {
      const all_stories = await db.stories.toArray();
      const epilogue_ids = await _epilogue_story_ids(all_stories.map((story_record) => story_record.id));
      const claimed_entity_ids = new Set();

      for (const story of all_stories) {
        if (story.is_concluded || epilogue_ids.has(String(story.id))) continue;
        for (const key of ["ai_id", "user_id", "fractal_id"]) {
          if (story[key] != null) claimed_entity_ids.add(String(story[key]));
        }
      }

      return [...claimed_entity_ids];
    } catch (error) {
      console.error("[Repository] Archive Failure: Failed to resolve active entity claims:", error);
      return [];
    }
  },

  /**
   * Deletes a story and its entire simulation log.
   * @param {string|number} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    const story_ids_to_purge = [...new Set([String(id), id])];
    await db.simulation_log.where("story_id").anyOf(story_ids_to_purge).delete();
    await db.stories.delete(coerce_story_key(id));
    stories_bridge.bump();
  },
};

// ============================================================================
// CHANGELOG
// ============================================================================
/**
 * 2026-08-29: Harmonized `src/data/repository.js` via `/harmonize`:
 *   - Structured Universal File Architecture with instructional header, 4 domain dividers, and changelog footer.
 *   - Enforced Full-Name & Anti-Abbreviation Mandate across all identifiers (e.g. `global_scope`, `existing_records`,
 *     `entities_to_add`, `existing_entity_ids`, `blueprint`, `transformed_entity`, `vector_entry`, `mapped_embedding`,
 *     `found_entity`, `base_entity`, `serializable_entity`, `cloned_entity`, `saved_entity`, `sanitized_npc_ids`, `claimed_entity_ids`).
 *   - Retained Float32Array vector embedding serialization/deserialization and reactive `stories_bridge` events.
 *   - Verified 100% test pass on `repository.test.js` and 0 nomenclature audit violations.
 */
