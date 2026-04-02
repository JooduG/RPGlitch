/**
 * src/data/repository.js
 * 📂 THE REPOSITORY (Knowledge Access Layer)
 * RUTHLESSLY FLATTENED SCHEMA — ZERO BACKWARDS COMPATIBILITY.
 * If it's not at the top level, it doesn't exist.
 */
import { db } from "./db.js";
import { premade } from "./entity-premades.js";
import { normalize, STORAGE_VERSION } from "./content-normaliser.js";
const error = console.error;
// ============================================================================
// 1. DATA SEEDING (The Entity Foundry)
// ============================================================================
/**
 * Seeds the database with premade entities if they don't already exist.
 * Trusts the Normalizer to enforce the flattened "Twin-Cylinder" structure.
 */
export const seed_premades = async () => {
  if (typeof globalThis !== "undefined" && globalThis._seeding) return;
  if (typeof globalThis !== "undefined") globalThis._seeding = true;
  try {
    const existing = await db.entities.toArray();
    const toAdd = [];
    const existingIds = new Set();
    for (const e of existing) {
      if (e.id != null) existingIds.add(e.id);
      if (e.originId != null) existingIds.add(e.originId);
    }
    for (const bp of premade.entities) {
      // Check by ID or originId to prevent duplicates of factory stock
      const hasChild = existingIds.has(bp.id);
      if (!hasChild) {
        // Trust the Normalizer to handle flattening and type-aware dynamics
        const normalized = normalize(bp);
        toAdd.push({
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
    if (toAdd.length > 0) {
      await db.entities.bulkPut(toAdd);
    }
  } catch (err) {
    error("Foundry Error: Failed to seed the premade gods.", err);
  } finally {
    if (typeof globalThis !== "undefined") globalThis._seeding = false;
  }
};
// ============================================================================
// 2. ENTITIES (The CRUD Engine)
// ============================================================================
export const entities = {
  /**
   * Lists all entities of a specific type (character/fractal).
   */
  async list(type) {
    try {
      const items = await db.entities.where("type").equals(type).toArray();
      return items.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } catch (err) {
      error(`Error listing the ${type} census:`, err);
      return [];
    }
  },
  /**
   * Retrieves a single entity by ID, falling back to premades if not in DB.
   */
  async get(type, id) {
    try {
      let item = await db.entities.get(id);
      if (!item) item = premade.entities.find((e) => e.id === id);
      return item && item.type === type ? item : null;
    } catch (err) {
      error(`Failed to fetch ${type} [${id}] from the void:`, err);
      return null;
    }
  },
  /**
   * Saves or updates an entity.
   * Force-normalizes and flattens everything before it touches the disk.
   */
  async upsert(type, entity) {
    try {
      const id = entity.id || crypto.randomUUID();
      const base = (await db.entities.get(id)) || {};
      // Break the Svelte 5 Proxy chains - deep clone for safety
      const cleanEntity = JSON.parse(JSON.stringify(entity));
      const saved = {
        ...base,
        ...normalize({ ...base, ...cleanEntity }),
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
      const allStories = await db.stories.orderBy("updated_at").reverse().toArray();
      return await Promise.all(
        allStories.map(async (story) => {
          const fractal = await db.entities.get(story.fractal_id);
          // Simple, flat return. No .visuals nesting here.
          return {
            id: story.id,
            title: story.title || "Untitled Fragment",
            state: story.isConcluded ? "concluded" : "active",
            lastPlayed: story.updated_at,
            fractal_profile_picture: fractal?.profile_picture || "",
            fractal_name: fractal?.name || "The Void",
            signature_color: fractal?.signature_color || "default",
          };
        }),
      );
    } catch (err) {
      error("Archive Failure: Failed to list narrative records.", err);
      return [];
    }
  },
  get: (id) => db.stories.get(id),
  update: (id, changes) => db.stories.update(id, changes),
  /**
   * Deletes a story and its entire simulation log.
   */
  async delete(id) {
    await db.simulation_log.where("story_id").equals(id).delete();
    return db.stories.delete(id);
  },
};
