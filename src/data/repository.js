/**
 * src/data/repository.js
 * 🏛️ REPOSITORY PERSISTENCE & ENTITY/STORY DATA ACCESS LAYER
 *
 * Provides high-level asynchronous CRUD operations for Characters, Fractals,
 * and Stories on top of the IndexedDB (Dexie) storage engine.
 *
 * DOMAINS:
 *   1. Foundry & Premade Seeding (`seed_premades`)
 *   2. Entity Data Access (`entities`: `list`, `get`, `upsert`, `remove`, `update`)
 *   3. Narrative Story Access (`stories`: `list`, `get`, `update`, `update_cast`, `conclude`, `active_entity_ids`, `delete`)
 *   4. Key Coercion (`coerce_story_key`)
 */

import { generate_uuid, stories_bridge } from "@utils";
import { deserialize_embedding, serialize_embedding } from "@platform";
import { db } from "./db.js";
import { format_premade, normalize } from "./normalizer.js";
import { premade } from "./definitions/premades.js";

/**
 * @typedef {Object} StorySummary
 * @property {string|number} id
 * @property {string} title
 * @property {'concluded'|'active'} state
 * @property {number} last_played
 * @property {string} fractal_profile_picture
 * @property {string} fractal_name
 * @property {string} signature_color
 * @property {string[]} npc_ids
 */

const premade_entity_map = new Map((premade?.entities || []).map((e) => [e.id, e]));

// ============================================================================
// 1. DATA SEEDING (The Entity Foundry)
// ============================================================================

/**
 * Seeds the database with premade entities if they do not already exist.
 * Uses the Normalizer to enforce the Four-Quadrant entity structure.
 * @returns {Promise<void>}
 */
export async function seed_premades() {
  const g = /** @type {any} */ (globalThis);
  if (typeof globalThis !== "undefined" && g._seeding) return;
  if (typeof globalThis !== "undefined") g._seeding = true;

  try {
    const existing = await db.entities.toArray();
    const to_add = [];
    const existing_ids = new Set();

    for (const e of existing) {
      if (e.id != null) existing_ids.add(e.id);
      if (e.origin_id != null) existing_ids.add(e.origin_id);
    }

    for (const bp of premade.entities) {
      if (!existing_ids.has(bp.id)) {
        const formatted = format_premade(bp, bp.type);
        to_add.push({
          ...formatted,
          id: bp.id,
          origin_id: bp.id,
          is_snapshot: 0,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      }
    }

    if (to_add.length > 0) {
      await db.entities.bulkPut(to_add);
    }
  } catch (err) {
    console.error("[Repository] Foundry Error: Failed to seed premades:", err);
  } finally {
    if (typeof globalThis !== "undefined") {
      /** @type {any} */ (globalThis)._seeding = false;
    }
  }
}

// ============================================================================
// 2. VECTOR EMBEDDING HELPERS
// ============================================================================

/**
 * Transforms `_embedding` Float32Array on temporal past memory vectors
 * without mutating the input object.
 * @param {Record<string, any>} entity
 * @param {(emb: any) => any} transform
 * @returns {Record<string, any>}
 */
function _map_vector_embeddings(entity, transform) {
  if (!entity || typeof entity !== "object") return entity;
  const out = { ...entity };
  if (!Array.isArray(out.past)) return out;

  out.past = out.past.map((v) => {
    if (!v || !Object.prototype.hasOwnProperty.call(v, "_embedding")) return v;
    const mapped = transform(v._embedding);
    if (mapped) return { ...v, _embedding: mapped };
    const copy = { ...v };
    delete copy._embedding;
    return copy;
  });

  return out;
}

// ============================================================================
// 3. ENTITIES (The CRUD Engine)
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
      return items.sort((a, b) => (String(/** @type {any} */ (a).name) || "").localeCompare(String(/** @type {any} */ (b).name) || ""));
    } catch (err) {
      console.error(`[Repository] Error listing ${type} census:`, err);
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
      let item = await db.entities.get(id);
      if (!item) {
        const raw_premade = premade_entity_map.get(id);
        if (raw_premade) item = normalize(raw_premade);
      }
      if (!item || item.type !== type) return null;
      return _map_vector_embeddings(item, deserialize_embedding);
    } catch (err) {
      console.error(`[Repository] Failed to fetch ${type} [${id}]:`, err);
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
      const base = (await db.entities.get(id)) || {};
      const serializable = _map_vector_embeddings(entity, serialize_embedding);
      const clean_entity = JSON.parse(JSON.stringify(serializable));

      const saved = {
        ...base,
        ...normalize({ ...base, ...clean_entity }),
        id,
        type,
        is_snapshot: 0,
        updated_at: Date.now(),
      };

      await db.entities.put(saved);
      return saved;
    } catch (err) {
      console.error(`[Repository] Failed to upsert ${type} [${entity?.id}]:`, err);
      throw err;
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
      const item = await db.entities.get(id);
      if (item && item.type === type) {
        await db.entities.delete(id);
      }
    } catch (err) {
      console.error(`[Repository] Failed to delete ${type} [${id}]:`, err);
      throw err;
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
      const serializable = _map_vector_embeddings(data, serialize_embedding);
      const clean_data = JSON.parse(JSON.stringify(serializable));
      const item = await db.entities.get(id);
      if (item && item.type === type) {
        return await db.entities.update(id, clean_data);
      }
      return 0;
    } catch (err) {
      console.error(`[Repository] Failed to update ${type} [${id}]:`, err);
      throw err;
    }
  },
};

// ============================================================================
// 4. STORIES (The Narrative Archive)
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
  const ids = [...new Set(story_ids.flatMap((id) => [String(id), id]))];
  if (ids.length === 0) return new Set();

  const entries = await db.simulation_log.where("story_id").anyOf(ids).toArray();
  const out = new Set();
  for (const entry of entries) {
    if (entry?.meta?.is_epilogue) out.add(String(entry.story_id));
  }
  return out;
}

export const stories = {
  /**
   * Lists all stories with associated fractal metadata.
   * @returns {Promise<StorySummary[]>}
   */
  async list() {
    try {
      const all_stories = await db.stories.orderBy("updated_at").reverse().toArray();
      const fractal_ids = [...new Set(all_stories.filter((s) => s.fractal_id).map((s) => s.fractal_id))];

      const fractals = await db.entities
        .where("id")
        .anyOf(/** @type {any[]} */ (fractal_ids))
        .toArray();
      const fractal_map = new Map(fractals.map((f) => [f.id, f]));

      const epilogue_ids = await _epilogue_story_ids(all_stories.map((s) => s.id));
      const unique_map = new Map();

      for (const story of all_stories) {
        if (!unique_map.has(story.id)) {
          const fractal = fractal_map.get(story.fractal_id);
          const is_concluded = Boolean(story.is_concluded || epilogue_ids.has(String(story.id)));

          unique_map.set(story.id, {
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

      return Array.from(unique_map.values());
    } catch (err) {
      console.error("[Repository] Archive Failure: Failed to list narrative records:", err);
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
    const clean = Array.isArray(npc_ids) ? [...new Set(npc_ids.map((x) => (x == null ? "" : String(x).trim())).filter(Boolean))] : [];
    const result = await db.stories.update(coerce_story_key(id), { npc_ids: clean });
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
      const epilogue_ids = await _epilogue_story_ids(all_stories.map((s) => s.id));
      const claimed = new Set();

      for (const story of all_stories) {
        if (story.is_concluded || epilogue_ids.has(String(story.id))) continue;
        for (const key of ["ai_id", "user_id", "fractal_id"]) {
          if (story[key] != null) claimed.add(String(story[key]));
        }
      }

      return [...claimed];
    } catch (err) {
      console.error("[Repository] Archive Failure: Failed to resolve active entity claims:", err);
      return [];
    }
  },

  /**
   * Deletes a story and its entire simulation log.
   * @param {string|number} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    const ids = [...new Set([String(id), id])];
    await db.simulation_log.where("story_id").anyOf(ids).delete();
    await db.stories.delete(coerce_story_key(id));
    stories_bridge.bump();
  },
};
