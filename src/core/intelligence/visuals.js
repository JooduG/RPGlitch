/**
 * src/core/intelligence/visuals.js
 * 🎨 VISUALS SERVICE
 * Orchestrates prompt synthesis and Perchance t2i integration.
 */

import { events, EVENTS } from "@core/engine/bus.js"
import { db } from "@data/db.js"
import { ContextBroker } from "./broker.js"
import { LlmService } from "./service.js"

const RPG_LIGHTING =
    "volumetric lighting, cinematic, high-contrast, anamorphic flare"
const RPG_STYLE =
    "cybernetic realism, hyper-detailed, obsidian surfaces, neon glitch"
const DEFAULT_FLUFF =
    "high quality, hyper-realistic, volumetric lighting, raytracing, cinematic, 8k resolution, detailed texture"

export const VisualsService = {
    /**
     * Composes the "Base Prompt" using the specific "Physicals + Color + Fluff" formula.
     * @param {Object} entity
     * @returns {string}
     */
    composeBasePrompt(entity) {
        if (!entity) return ""

        const eternalPhys = entity.eternal?.physical || ""
        const presentPhys = entity.present?.physical || ""
        const sigColor = entity.visuals?.signatureColor || ""

        const parts = [
            eternalPhys,
            presentPhys,
            sigColor ? `accented with ${sigColor} highlights` : "",
            DEFAULT_FLUFF,
        ].filter((p) => p && p.trim().length > 0)

        return parts.join(", ").trim()
    },

    /**
     * Returns resolution format based on target mode.
     */
    getResolution(mode) {
        switch (mode) {
            case "landscape":
            case "scene":
            case "fractal":
                return { width: 768, height: 512 }
            case "portrait":
            case "character":
            case "user":
            case "ai":
                return { width: 512, height: 768 }
            default:
                return { width: 512, height: 512 }
        }
    },

    /**
     * Synthesizes and generates an image for a specific entity.
     * @param {string|Object} target - Either an entityId or a raw prompt string.
     * @param {Object} options - Override parameters.
     * @returns {Promise<string>} The generated image URL.
     */
    async generate(target, options = {}) {
        if (!window.t2i) {
            console.warn("[Visuals] Perchance t2i plugin not available.")
            return null
        }

        try {
            let finalPrompt = ""
            let entityId = null

            if (typeof target === "string" && target.length > 100) {
                // If it looks like a long specific prompt, use it
                finalPrompt = target
            } else if (typeof target === "string") {
                // It's an ID
                entityId = target
                const context = await ContextBroker.assemble(entityId, "visual")
                const baseDescription = context.system || ""
                finalPrompt =
                    await LlmService.optimizeImagePrompt(baseDescription)
            } else {
                // Target is likely an object or raw prompt
                finalPrompt = target.toString()
            }

            // Apply RPGlitch Aesthetic Matrix if requested or if it's a character
            if (options.rpgStyle !== false) {
                finalPrompt = `${finalPrompt}, ${RPG_STYLE}, ${RPG_LIGHTING}`
            }

            const negativePrompt =
                "text, watermark, blurry, low quality, deformed, cartoon, anime"

            const res = this.getResolution(options.mode)

            const result = await window.t2i({
                prompt: finalPrompt,
                negativePrompt,
                seed: options.seed || Math.floor(Math.random() * 1000000),
                width: options.width || res.width,
                height: options.height || res.height,
            })

            if (result && entityId && !options.noCache) {
                await this.cacheImage(entityId, result)
            }

            return result
        } catch (err) {
            console.error("[Visuals] Generation Failed:", err)
            throw err
        }
    },

    /**
     * Uploads a file to the server.
     */
    async upload(file) {
        if (!window.upload) {
            console.error("[Visuals] upload plugin not found.")
            return null
        }

        try {
            const result = await window.upload(file)
            return result?.url || result
        } catch (e) {
            console.error("[Visuals] Upload failed:", e)
            return null
        }
    },

    /**
     * Stores the generated image in the entities table.
     */
    async cacheImage(entityId, imageData) {
        try {
            await db.entities.update(entityId, {
                profilePicture: imageData,
                updatedAt: Date.now(),
            })

            // Notify simulation of the update
            events.dispatchEvent(
                new CustomEvent(EVENTS.ENTITY_UPDATED, {
                    detail: { id: entityId, profilePicture: imageData },
                })
            )
        } catch (err) {
            console.error("[Visuals] Caching Failed:", err)
        }
    },
}
