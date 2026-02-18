/**
 * src/core/intelligence/visuals.js
 * 🎨 VISUALS SERVICE
 * Orchestrates prompt synthesis and Perchance t2i integration.
 */

import { events, EVENTS } from "@core/engine/bus.js"
import { CONFIG } from "@core/engine/config.js"
import { db } from "@data/db.js"
import { ContextBroker } from "./broker.js"
import { LlmService } from "./service.js"

const { PALETTE } = CONFIG

const RPG_LIGHTING =
    "volumetric lighting, cinematic, high-contrast, anamorphic flare"
const RPG_STYLE =
    "cybernetic realism, hyper-detailed, obsidian surfaces, neon glitch"

export const VisualsService = {
    /**
     * Composes the "Base Prompt" using the specific "Physicals + Color + Fluff" formula.
     * @param {Object} entity
     * @returns {string}
     */
    composeBasePrompt(entity) {
        const present = entity.present?.physical || ""
        const eternal = entity.eternal?.physical || ""
        // We strictly use semantic names (e.g. "neon crimson"), NOT hex codes.
        // If colorName is missing, we check signatureColor.
        // If signatureColor is a hex code, we try to find its semantic name from the PALETTE.
        let semanticColor = entity.visuals?.colorName || ""

        if (!semanticColor && entity.visuals?.signatureColor) {
            const sigColor = entity.visuals.signatureColor
            const isHex = /^#[0-9A-F]{6}$/i.test(sigColor)

            if (isHex) {
                // Try to find the key in PALETTE that matches this hex
                const match = Object.entries(PALETTE).find(
                    ([, hex]) => hex.toLowerCase() === sigColor.toLowerCase()
                )
                if (match) {
                    semanticColor = match[0] // e.g., "purple"
                }
            } else {
                // It's already semantic (e.g. "crimson")
                semanticColor = sigColor
            }
        }

        // Strict Primacy Hierarchy
        const fragments = []

        if (present) fragments.push(present)
        if (eternal) fragments.push(eternal)
        if (semanticColor)
            fragments.push(
                `accented with ${semanticColor} lighting and details`
            )

        // Baseline fluff if the user bypasses the LLM enhancer
        fragments.push(
            "high quality, hyper-realistic, volumetric lighting, 8k resolution"
        )

        return fragments.join(", ")
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
        if (!window.pluginTextToImage) {
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

            const result = await window.pluginTextToImage({
                prompt: finalPrompt,
                negativePrompt,
                seed: options.seed || Math.floor(Math.random() * 1000000),
                width: options.width || res.width,
                height: options.height || res.height,
            })

            if (result && result.dataUrl) {
                // Perchance plugin returns an object with dataUrl
                if (entityId && !options.noCache) {
                    await this.cacheImage(entityId, result.dataUrl)
                }
                return result.dataUrl
            }

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
        if (!window.pluginUpload) {
            console.error("[Visuals] upload plugin not found.")
            return null
        }

        try {
            const result = await window.pluginUpload(file)
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
                "visuals.profilePicture": imageData,
                updatedAt: Date.now(),
            })

            // Notify simulation of the update
            events.dispatchEvent(
                new CustomEvent(EVENTS.ENTITY_UPDATED, {
                    detail: {
                        id: entityId,
                        visuals: { profilePicture: imageData },
                    },
                })
            )
        } catch (err) {
            console.error("[Visuals] Caching Failed:", err)
        }
    },
}
