/**
 * src/js/scholar/repository.js
 * THE REPOSITORY (Knowledge Access Layer)
 * Handles CRUD operations for Entities and Stories using Dexie.
 */

import { db } from "./db.js"

// Data Providers
import { normalize, premade, STORAGE_VERSION } from "@data/lore.js"

const error = console.error

// ============================================================================
// 1. DATA SEEDING (The Factory)
// ============================================================================

export const seedPremades = async () => {
    try {
        const existing = await db.entities.toArray()

        // Map premade entities to blueprints
        const blueprints = premade.entities.map((e) => ({
            ...e,
            kind: e.type,
        }))

        const toAdd = []

        for (const bp of blueprints) {
            const hasChild = existing.some((e) => e.originId === bp.id)

            if (!hasChild) {
                const type = bp.kind || bp.type || "character"
                const flatBp = { ...bp }

                const normalized = normalize({ ...flatBp, type })

                toAdd.push({
                    ...normalized,
                    id: crypto.randomUUID(),
                    originId: bp.id,
                    type: type,
                    isPremade: 0,
                    isCustom: 1,
                    isSnapshot: 0,
                    version: STORAGE_VERSION,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                })
            }
        }
        if (toAdd.length > 0) {
            await db.entities.bulkPut(toAdd)
        }
    } catch (err) {
        error("Failed to seed premades:", err)
    }
}

// ============================================================================
// 2. ENTITIES (CRUD)
// ============================================================================

export const entities = {
    async list(type) {
        try {
            const items = await db.entities.where("type").equals(type).toArray()
            return items.sort((a, b) =>
                (a.name || "").localeCompare(b.name || "")
            )
        } catch (err) {
            error(`Error listing ${type}:`, err)
            return []
        }
    },

    async get(type, id) {
        try {
            let item = await db.entities.get(id)

            // Fallback to Premades if not in DB
            if (!item) {
                item = premade.entities.find((e) => e.id === id)
            }

            return item && item.type === type ? item : null
        } catch (err) {
            error(`Failed to get ${type} with id ${id}:`, err)
            return null
        }
    },

    async upsert(type, entity, options = {}) {
        try {
            const id = entity.id || crypto.randomUUID()
            const base = (await db.entities.get(id)) || {}

            // SANITIZE: ENSURE PLAIN OBJECT (Fixes DataCloneError for Svelte 5 Proxies)
            const cleanEntity = JSON.parse(JSON.stringify(entity))

            const saved = {
                ...base,
                ...normalize({ ...base, ...cleanEntity }),
                id,
                type: type,
                isCustom: 1,
                isPremade: 0,
                version: STORAGE_VERSION,
                updatedAt: Date.now(),
            }

            await db.entities.put(saved)

            if (!options?.silent) {
                // FIX: Correct Import Path (Removed 'js/')
                const { events, EVENTS } =
                    await import("@core/engine/engine.js")
                events.dispatchEvent(
                    new CustomEvent(EVENTS.DB_UPDATED, {
                        detail: { id, type, store: "entities" },
                    })
                )
            }

            return saved
        } catch (err) {
            error(`Failed to save ${type}:`, err)
            throw new Error(`Failed to save ${type}. Please try again.`)
        }
    },

    async remove(type, id) {
        try {
            const item = await db.entities.get(id)
            if (item && item.type === type) {
                return db.entities.delete(id)
            }
        } catch (err) {
            error(`Failed to delete ${type}:`, err)
            throw err
        }
    },
}

// ============================================================================
// 3. STORIES (CRUD)
// ============================================================================

export const stories = {
    async list() {
        try {
            const allStories = await db.stories
                .orderBy("updatedAt")
                .reverse()
                .toArray()

            return await Promise.all(
                allStories.map(async (story) => {
                    const fractal = await db.entities.get(story.fractalId)
                    const avatar =
                        fractal?.visuals?.profilePicture ||
                        fractal?.visuals?.profilePictureUrl ||
                        fractal?.profilePictureUrl ||
                        ""

                    return {
                        id: story.id,
                        title: story.storyTitle || "Untitled Story",
                        state: story.isConcluded ? "concluded" : "active",
                        lastPlayed: story.updatedAt,
                        fractalAvatar: avatar,
                        fractalName: fractal?.name || "Unknown Fractal",
                        signatureColor: fractal?.signatureColor || "default",
                    }
                })
            )
        } catch (err) {
            error("Repo: Failed to list stories", err)
            return []
        }
    },

    get: (id) => db.stories.get(id),
    update: (id, changes) => db.stories.update(id, changes),

    async delete(id) {
        await db.messages.where("storyId").equals(id).delete()
        return db.stories.delete(id)
    },
}

// ============================================================================
// 4. LORE SEARCH (Hybrid Engine)
// ============================================================================

/**
 * Perform a keyword/semantic search for lorebook entries.
 * DEV: Uses Supabase Edge Function with SQL fallback.
 * PROD: Uses direct SQL text search.
 * @param {string} query - The search query
 * @returns {Promise<Array>} List of lorebook entries
 */
export const searchLore = async (query) => {
    if (!query) return []
    console.warn("[Data] Supabase search disabled (Local-First Mode).")
    return []
}

/**
 * Direct SQL Text Search for Lorebook entries.
 * @param {string} query - The search query
 * @returns {Promise<Array>} List of lorebook entries
 */
export const searchLoreSQL = async (query) => {
    return []
}

// ============================================================================
// 5. UTILITIES
// ============================================================================

export const copyEntity = async (type, id) => {
    try {
        const item = await entities.get(type, id)
        if (!item) return null

        const newEntity = {
            ...item,
            id: undefined,
            originId: null,
            isPremade: 0,
            isCustom: 1,
            name: `${item.name || "Untitled"} (Copy)`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }

        return newEntity
    } catch (err) {
        error(`Failed to copy ${type}:`, err)
        return null
    }
}
