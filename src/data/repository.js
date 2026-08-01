/**
 * @typedef {Object} Story
 * @property {string|number} id
 * @property {string} title
 * @property {'concluded'|'active'} state
 * @property {number} lastPlayed
 * @property {string} fractal_profile_picture
 * @property {string} fractal_name
 * @property {string} signature_color
 */
import { db } from "./db.js";
import { normalize, STORAGE_VERSION } from "./normalizer.js";
import { premade } from "./presets/premades.js";

const error = console.error;
const premade_entity_map = new Map((premade?.entities || []).map((e) => [e.id, e]));
// ============================================================================
// 1. DATA SEEDING (The Entity Foundry)
// ============================================================================
/**
 * Seeds the database with premade entities if they don't already exist.
 * Trusts the Normalizer to enforce the flattened "Twin-Cylinder" structure.
 */
export const seed_premades = async () => {
  const g = /** @type {any} */ (globalThis);
  if (typeof globalThis !== "undefined" && g._seeding) return;
  if (typeof globalThis !== "undefined") g._seeding = true;
  try {
    const existing = await db.entities.toArray();
    const to_add = [];
    const existing_ids = new Set();
    for (const e of existing) {
      if (e.id != null) existing_ids.add(e.id);
      if (e.originId != null) existing_ids.add(e.originId);
    }
    for (const bp of premade.entities) {
      // Check by ID or originId to prevent duplicates of factory stock
      const has_child = existing_ids.has(bp.id);
      if (!has_child) {
        // Trust the Normalizer to handle flattening and type-aware dynamics
        const normalized = normalize(bp);
        to_add.push({
          ...normalized,
          id: bp.id,
          originId: bp.id,
          isPremade: 1,
          isCustom: 0,
          isSnapshot: 0,
          version: STORAGE_VERSION,
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      }
    }
    if (to_add.length > 0) {
      await db.entities.bulkPut(to_add);
    }
  } catch (err) {
    error("Foundry Error: Failed to seed the premade gods.", err);
  } finally {
    if (typeof globalThis !== "undefined") /** @type {any} */ (globalThis)._seeding = false;
  }
};
// ============================================================================
// 2. ENTITIES (The CRUD Engine)
// ============================================================================
export const entities = {
  /**
   * Lists all entities of a specific type (character/fractal).
   * @param {'character'|'fractal'} type
   */
  async list(type) {
    try {
      const items = await db.entities.where("type").equals(type).toArray();
      return items.sort((a, b) => (String(/** @type {any} */ (a).name) || "").localeCompare(String(/** @type {any} */ (b).name) || ""));
    } catch (err) {
      error(`Error listing the ${type} census:`, err);
      return [];
    }
  },
  /**
   * Retrieves a single entity by ID, falling back to premades if not in DB.
   * @param {'character'|'fractal'} type
   * @param {string} id
   */
  async get(type, id) {
    try {
      let item = await db.entities.get(id);
      if (!item) item = premade_entity_map.get(id);
      return item && item.type === type ? item : null;
    } catch (err) {
      error(`Failed to fetch ${type} [${id}] from the void:`, err);
      return null;
    }
  },
  /**
   * Saves or updates an entity.
   * Force-normalizes and flattens everything before it touches the disk.
   * @param {'character'|'fractal'} type
   * @param {any} entity
   */
  async upsert(type, entity) {
    try {
      const id = entity.id || crypto.randomUUID();
      const base = (await db.entities.get(id)) || {};
      // Break the Svelte 5 Proxy chains - deep clone for safety
      const clean_entity = JSON.parse(JSON.stringify(entity));
      const saved = {
        ...base,
        ...normalize({ ...base, ...clean_entity }),
        id,
        type: type,
        isCustom: 1,
        isPremade: 0,
        version: STORAGE_VERSION,
        updated_at: Date.now(),
      };
      await db.entities.put(saved);
      return saved;
    } catch (err) {
      error(`Failed to manifest ${type} into the database:`, err);
      throw err;
    }
  },
  /**
   * Deletes an entity if it matches the requested type.
   * @param {'character'|'fractal'} type
   * @param {string} id
   */
  async remove(type, id) {
    try {
      const item = await db.entities.get(id);
      if (item && item.type === type) {
        return db.entities.delete(id);
      }
    } catch (err) {
      error(`Failed to delete ${type} [${id}] - it's fighting back:`, err);
      throw err;
    }
  },
  /**
   * Updates an entity directly without full normalization.
   * Useful for partial updates or metadata stamps.
   * @param {'character'|'fractal'} type
   * @param {string} id
   * @param {any} data
   */
  async update(type, id, data) {
    try {
      const clean_data = JSON.parse(JSON.stringify(data));
      const item = await db.entities.get(id);
      if (item && item.type === type) {
        return db.entities.update(id, clean_data);
      }
    } catch (err) {
      error(`Failed to update ${type} [${id}]:`, err);
      throw err;
    }
  },
};
// ============================================================================
// 3. STORIES (The Narrative Archive)
// ============================================================================
export const stories = {
  /**
   * Lists all stories with associated fractal metadata.
   * UPDATED: Accesses flattened fractal properties directly.
   */
  async list() {
    try {
      const all_stories = await db.stories.orderBy("updated_at").reverse().toArray();

      // Batch fetch fractals to avoid N+1 queries
      const fractal_ids = [...new Set(all_stories.filter((s) => s.fractal_id).map((s) => s.fractal_id))];
      const fractals = await db.entities
        .where("id")
        .anyOf(/** @type {any[]} */ (fractal_ids))
        .toArray();
      const fractal_map = new Map(fractals.map((f) => [f.id, f]));

      const unique_map = new Map();
      for (const story of all_stories) {
        if (!unique_map.has(story.id)) {
          const fractal = fractal_map.get(story.fractal_id);
          unique_map.set(story.id, {
            id: story.id,
            title: story.title || "Untitled Fragment",
            state: story.isConcluded ? "concluded" : "active",
            lastPlayed: story.updated_at,
            fractal_profile_picture: fractal?.profile_picture || "",
            fractal_name: fractal?.name || "The Void",
            signature_color: fractal?.signature_color || "default",
          });
        }
      }
      return Array.from(unique_map.values());
    } catch (err) {
      error("Archive Failure: Failed to list narrative records.", err);
      return [];
    }
  },
  /** @param {any} id */
  get: (id) => db.stories.get(id),
  /** @param {any} id @param {any} changes */
  update: (id, changes) => db.stories.update(id, changes),
  /**
   * Deletes a story and its entire simulation log.
   * @param {any} id
   */
  async delete(id) {
    await db.simulation_log.where("story_id").equals(id).delete();
    return db.stories.delete(id);
  },
};

// ============================================================================
// 4. COMPRESSION (Memory & State Snapshots)
// ============================================================================

/**
 * @param {any[]} vectors
 * @param {'past'|'future'} type
 */
export function prune(vectors, type) {
  if (!Array.isArray(vectors)) return [];
  const limit = type === "past" ? 3 : 1;
  return vectors.slice(0, limit).map((/** @type {any} */ v) => ({
    id: v.id,
    content: v.content || v.directive || v.text || v.summary || "",
    directive: v.directive || v.content || v.text || "",
    emotional_weight: v.emotional_weight ?? 5,
    type: v.type || type,
    meta: v.meta || {},
  }));
}

/**
 * @param {any} snapshot
 */
export function hydrate(snapshot) {
  if (!snapshot) return null;
  // Zero Data Loss: if it's already an entity, return as is
  if (snapshot.fragments) return snapshot;

  return {
    id: snapshot.id,
    name: snapshot.n || snapshot.name || "Unknown",
    fragments: {
      present: { non_physical: snapshot.p || "" },
      eternal: { non_physical: snapshot.e || "" },
    },
  };
}
