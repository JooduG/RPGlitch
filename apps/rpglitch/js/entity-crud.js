// apps/rpglitch/js/entity-crud.js
import { db } from "./core-db.js";
import { error } from "./core-utils.js";
import { normalize, formatPremade, premade, STORAGE_VERSION } from "./entity-structs.js";

// --- SEEDER ---
export async function seedPremades() {
    console.log("[RPGlitch] Seeding premade content...");
    try {
        const chars = premade.characters.map(c => formatPremade(c, "character"));
        const worlds = premade.worlds.map(w => formatPremade(w, "world"));
        const stories = premade.stories.map(s => formatPremade(s, "story"));
        await db.entities.bulkPut([...chars, ...worlds, ...stories]);
        console.log(`[RPGlitch] Seeded ${chars.length} characters, ${worlds.length} worlds.`);
    } catch (err) {
        error("Failed to seed premades:", err);
    }
}

// --- CRUD & SNAPSHOTS ---

export const entities = {
    async list(type) {
        try {
            const items = await db.entities.where("type").equals(type).toArray();
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

    async upsert(type, entity) {
        try {
            const id = entity.id || crypto?.randomUUID?.() || `${type}-${Date.now()}`;
            const base = (await db.entities.get(id)) || {};

            const saved = {
                ...base,
                ...normalize({ ...base, ...entity }),
                id: id,
                type: type.toLowerCase(),
                isCustom: base.isPremade ? 0 : 1,
                isPremade: base.isPremade || 0,
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
            if (item && item.type === type.toLowerCase() && item.isCustom === 1) {
                return db.entities.delete(id);
            }
            if (item && item.isPremade) {
                throw new Error("Cannot delete premade content.");
            }
        } catch (err) {
            error(`Failed to delete ${type}:`, err);
            throw err;
        }
    },

    // Note: copy is removed from the internal entities object to be an external export
    // and maintain a cleaner separation, as used in the original views.js.

    // --- SNAPSHOT SYSTEM (V4.2) ---

    async getSnapshot(storyId, type, masterId) {
        try {
            const candidates = await db.entities.where("type").equals(type.toLowerCase()).toArray();
            return candidates.find(e =>
                e.storyId === storyId &&
                e.isSnapshot === 1 &&
                (!masterId || e.snapshotOf === masterId)
            ) || null;
        } catch (err) {
            error(`Error fetching snapshot for story ${storyId}:`, err);
            return null;
        }
    },

    async createSnapshot(storyId, masterEntity) {
        try {
            const snapshot = {
                ...masterEntity,
                id: crypto.randomUUID() || `${masterEntity.type}-snap-${Date.now()}`,
                storyId: storyId,
                snapshotOf: masterEntity.id,
                isSnapshot: 1,
                isCustom: 1,
                isPremade: 0,
                updatedAt: Date.now(),
                dynamics: {
                    entropy: 10,
                    permeability: 50,
                    velocity: 10,
                    resonance: 10
                }
            };

            await db.entities.put(snapshot);
            return snapshot;
        } catch (err) {
            error(`Failed to create snapshot for ${masterEntity.name}:`, err);
            throw err;
        }
    }
};

// --- Exported for ui-views.js ---
export async function copyEntity(type, id) {
    try {
        const item = await entities.get(type, id);
        if (!item) return null;
        const newEntity = { ...item };
        delete newEntity.id;
        newEntity.isPremade = 0;
        newEntity.isCustom = 1;
        newEntity.name = `${newEntity.name || "Untitled"} (Clone)`;
        return newEntity;
    } catch (err) {
        error(`Failed to copy ${type}:`, err);
        return null;
    }
}