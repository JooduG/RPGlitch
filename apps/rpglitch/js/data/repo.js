// apps/rpglitch/js/entity-crud.js
import { db } from "../core/db.js";
import { error } from "../core/utils.js";
import { normalize, premade, STORAGE_VERSION } from "./models.js";

// --- SEEDER (The Factory) ---
export async function seedPremades() {
  console.log("[RPGlitch] Verifying starter content...");
  try {
    const existing = await db.entities.toArray();

    // Define the Factory Blueprints from the hardcoded structures
    const blueprints = [
      ...premade.entities.map((e) => ({ ...e, kind: e.type.toLowerCase() })),
    ];

    const toAdd = [];

    for (const bp of blueprints) {
      // Check if a child of this blueprint exists in the DB.
      const hasChild = existing.some((e) => e.originId === bp.id);

      if (!hasChild) {
        console.log(`[Factory] Minting fresh copy of ${bp.name}`);

        const type = bp.kind || bp.type || "character";

        // [FIX] Flatten the 'sections' object so normalize() can find the fields
        const flatBp = {
          ...bp,
          ...(bp.sections || {}), // Merge sections (forever, past, etc.) to root
        };
        delete flatBp.sections; // Cleanup

        const normalized = normalize({ ...flatBp, type });

        toAdd.push({
          ...normalized,
          id: crypto.randomUUID(), // New unique ID for the living entity
          originId: bp.id, // Secret link to the blueprint (for Revert)
          type: type.toLowerCase(),
          isPremade: 0, // It acts like a custom entity
          isCustom: 1, // It is fully editable
          isSnapshot: 0, // It is a Master
          version: STORAGE_VERSION,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    if (toAdd.length > 0) {
      await db.entities.bulkPut(toAdd);
      console.log(`[RPGlitch] Minted ${toAdd.length} new starter entities.`);
    }
  } catch (err) {
    error("Failed to seed premades:", err);
  }
}

// --- CRUD OPERATIONS ---

export const entities = {
  // List all entities (No filtering needed anymore - Ghosts are gone)
  // [MOD] Added aliasing for Fractal <-> World backward compatibility
  async list(type) {
    try {
      const reqType = type.toLowerCase();
      const items = await db.entities.where("type").equals(reqType).toArray();
      return items.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } catch (err) {
      error(`Error listing ${type}:`, err);
      return [];
    }
  },

  // Get the REAL entity
  async get(type, id) {
    try {
      const item = await db.entities.get(id);
      const reqType = type.toLowerCase();
      return item && item.type === reqType ? item : null;
    } catch (err) {
      error(`Failed to get ${type} with id ${id}:`, err);
      return null;
    }
  },

  // Save changes (Used by AI directly and UI)
  async upsert(type, entity) {
    try {
      const id = entity.id || crypto?.randomUUID?.() || `${type}-${Date.now()}`;
      const base = (await db.entities.get(id)) || {};

      const saved = {
        ...base,
        ...normalize({ ...base, ...entity }),
        id: id,
        type: type.toLowerCase(), // This effectively migrates 'world' -> 'fractal' on save
        // Ensure it remains a custom, editable entity
        isCustom: 1,
        isPremade: 0,
        version: STORAGE_VERSION,
        updatedAt: Date.now(),
      };

      await db.entities.put(saved);
      return saved;
    } catch (err) {
      error(`Failed to save ${type}:`, err);
      throw new Error(`Failed to save ${type}. Please try again.`);
    }
  },

  async remove(type, id) {
    try {
      const item = await db.entities.get(id);
      if (item && item.type === type.toLowerCase()) {
        return db.entities.delete(id);
      }
    } catch (err) {
      error(`Failed to delete ${type}:`, err);
      throw err;
    }
  },
};

export const stories = {
  // List all stories with Fractal Avatar enrichment
  async list() {
    try {
      const allStories = await db.stories
        .orderBy("updatedAt")
        .reverse()
        .toArray();

      // Enrich with Fractal Data for the UI Card
      const enriched = await Promise.all(
        allStories.map(async (story) => {
          // Fetch Fractal Identifier
          const fractal = await db.entities.get(story.fractalId);
          const fractalAvatar =
            fractal?.visuals?.profilePictureUrl ||
            fractal?.profilePictureUrl ||
            "";

          return {
            id: story.id,
            title: story.storyTitle || "Untitled Story",
            state: story.isConcluded ? "concluded" : "active",
            lastPlayed: story.updatedAt,
            fractalAvatar: fractalAvatar,
            fractalName: fractal?.name || "Unknown World",
          };
        }),
      );

      return enriched;
    } catch (err) {
      error("Repo: Failed to list stories", err);
      return [];
    }
  },

  async get(id) {
    return db.stories.get(id);
  },

  async update(id, changes) {
    return db.stories.update(id, changes);
  },

  async delete(id) {
    // Cascade delete messages
    await db.messages.where("storyId").equals(id).delete();
    return db.stories.delete(id);
  },
};

// --- UTILITIES ---

export async function copyEntity(type, id) {
  try {
    const item = await entities.get(type, id);
    if (!item) return null;

    const newEntity = { ...item };
    delete newEntity.id;

    // Break the lineage for manual duplicates
    newEntity.originId = null;

    newEntity.isPremade = 0;
    newEntity.isCustom = 1;
    newEntity.name = `${newEntity.name || "Untitled"} (Copy)`;
    newEntity.createdAt = Date.now();
    newEntity.updatedAt = Date.now();

    return newEntity;
  } catch (err) {
    error(`Failed to copy ${type}:`, err);
    return null;
  }
}
