/**
 * src/core/intelligence/visuals.js
 * 🎨 VISUALS SERVICE
 * Orchestrates prompt synthesis and Perchance text to image integration.
 * [VISUALS ENGINE] PRIMARY GENERATION LOGIC
 */

import { events, EVENTS } from "@core/engine/bus.js"
import { CONFIG } from "@core/engine/config.js"
import { db } from "@data/db.js"
import { ContextBroker } from "./broker.js"
import { LlmService } from "./service.js"

const { PALETTE } = CONFIG

const RPG_LIGHTING =
    "volumetric lighting, cinematic, high-contrast, anamorphic flare"
const RPG_STYLE = "natural realism, hyper-detailed, imperfect textures"

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
                `integrate ${semanticColor} into the image, potentially as background color`
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
                return { width: 768, height: 768 }
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
            console.warn(
                "[VISUAL_ENGINE] Perchance text to image plugin not available."
            )
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
                finalPrompt = await LlmService.enhance(
                    baseDescription,
                    "visuals.prompt"
                )
            } else {
                // Target is likely an object or raw prompt
                finalPrompt = target.toString()
            }

            // Apply RPGlitch Aesthetic Matrix if requested or if it's a character
            if (options.rpgStyle !== false) {
                finalPrompt = `${finalPrompt}, ${RPG_STYLE}, ${RPG_LIGHTING}`
            }

            const negativePrompt =
                "text, watermark, blurry, low quality, deformed, cartoon, anime, missing limbs, extra limbs, mutated limbs, deformed limbs, fused limbs, missing eyes, extra eyes, fused eyes, missing ears, extra ears, fused ears, missing nose, extra nose, fused nose, missing mouth, extra mouth, fused mouth, missing teeth, extra teeth, fused teeth, missing fingers, extra fingers, fused fingers, missing toes, extra toes, fused toes, missing hands, extra hands, fused hands, missing feet, extra feet, fused feet, missing legs, extra legs, fused legs, missing arms, extra arms, fused arms"

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
            console.error("[VISUAL_ENGINE] Generation Failed:", err)
            throw err
        }
    },

    /**
     * Uploads a file to the server.
     */
    async upload(file) {
        if (!window.pluginUpload) {
            console.error("[VISUAL_ENGINE] upload plugin not found.")
            return null
        }

        try {
            const result = await window.pluginUpload(file)
            return result?.url || result
        } catch (e) {
            console.error("[VISUAL_ENGINE] Upload failed:", e)
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
            console.error("[VISUAL_ENGINE] Caching Failed:", err)
        }
    },
}
