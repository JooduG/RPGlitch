// apps/rpglitch/js/entity-crud.js
import { db } from "../core/db.js";
import { log, error } from "../core/utils.js";
import { normalize, premade, STORAGE_VERSION } from "./models.js";

// --- SEEDER (The Factory) ---
export const seedPremades = async () => {
  log("[RPGlitch] Verifying starter content...");
  try {
    const existing = await db.entities.toArray();

    // Map premade entities to blueprints
    const blueprints = premade.entities.map((e) => ({
      ...e,
      kind: e.type.toLowerCase(),
    }));

    const toAdd = [];

    for (const bp of blueprints) {
      const hasChild = existing.some((e) => e.originId === bp.id);

      if (!hasChild) {
        log(`[Factory] Minting fresh copy of ${bp.name}`);

        const type = bp.kind || bp.type || "character";
        const flatBp = { ...bp, ...(bp.sections || {}) };
        delete flatBp.sections;

        const normalized = normalize({ ...flatBp, type });

        toAdd.push({
          ...normalized,
          id: crypto.randomUUID(),
          originId: bp.id,
          type: type.toLowerCase(),
          isPremade: 0,
          isCustom: 1,
          isSnapshot: 0,
          version: STORAGE_VERSION,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    if (toAdd.length > 0) {
      await db.entities.bulkPut(toAdd);
      log(`[RPGlitch] Minted ${toAdd.length} new starter entities.`);
    }
  } catch (err) {
    error("Failed to seed premades:", err);
  }
};

// --- CRUD OPERATIONS ---

export const entities = {
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

  async get(type, id) {
    try {
      const item = await db.entities.get(id);
      return item && item.type === type.toLowerCase() ? item : null;
    } catch (err) {
      error(`Failed to get ${type} with id ${id}:`, err);
      return null;
    }
  },

  async upsert(type, entity, options = {}) {
    try {
      const id = entity.id || crypto.randomUUID();
      const base = (await db.entities.get(id)) || {};

      const saved = {
        ...base,
        ...normalize({ ...base, ...entity }),
        id,
        type: type.toLowerCase(),
        isCustom: 1,
        isPremade: 0,
        version: STORAGE_VERSION,
        updatedAt: Date.now(),
      };

      await db.entities.put(saved);

      if (!options?.silent) {
        const { events, EVENTS } = await import("../core/events.js");
        events.dispatchEvent(
          new CustomEvent(EVENTS.DB_UPDATED, {
            detail: { id, type, store: "entities" },
          }),
        );
      }

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
  async list() {
    try {
      const allStories = await db.stories
        .orderBy("updatedAt")
        .reverse()
        .toArray();

      return await Promise.all(
        allStories.map(async (story) => {
          const fractal = await db.entities.get(story.fractalId);
          const avatar =
            fractal?.visuals?.profilePictureUrl ||
            fractal?.profilePictureUrl ||
            "";

          return {
            id: story.id,
            title: story.storyTitle || "Untitled Story",
            state: story.isConcluded ? "concluded" : "active",
            lastPlayed: story.updatedAt,
            fractalAvatar: avatar,
            fractalName: fractal?.name || "Unknown World",
            signatureColor: fractal?.signatureColor || "default",
          };
        }),
      );
    } catch (err) {
      error("Repo: Failed to list stories", err);
      return [];
    }
  },

  get: (id) => db.stories.get(id),
  update: (id, changes) => db.stories.update(id, changes),

  async delete(id) {
    await db.messages.where("storyId").equals(id).delete();
    return db.stories.delete(id);
  },
};

// --- UTILITIES ---

export const copyEntity = async (type, id) => {
  try {
    const item = await entities.get(type, id);
    if (!item) return null;

    const newEntity = {
      ...item,
      id: undefined,
      originId: null,
      isPremade: 0,
      isCustom: 1,
      name: `${item.name || "Untitled"} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return newEntity;
  } catch (err) {
    error(`Failed to copy ${type}:`, err);
    return null;
  }
};
