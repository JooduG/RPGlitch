/**
 * src/mesmer/logic/manager.js
 * VISUAL MANAGER
 * Handles prompt composition and image generation calls.
 */

const log = console.log
const error = console.error

export const TextToImage = {
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

        // The "Fluff" - signature quality tokens
        const fluff =
            "high quality, hyper-realistic, volumetric lighting, raytracing, cinematic, 8k resolution, detailed texture"

        const parts = [
            eternalPhys,
            presentPhys,
            sigColor ? `accented with ${sigColor} highlights` : "",
            fluff,
        ].filter((p) => p && p.trim().length > 0)

        return parts.join(", ").trim()
    },

    /**
     * Returns resolution format based on target mode.
     * @param {string} mode - 'portrait' | 'landscape' | 'square' | 'scene' | 'character'
     * @returns {string} - "portrait", "landscape", "square"
     */
    getResolutionForMode(mode) {
        switch (mode) {
            case "landscape":
            case "scene":
            case "fractal":
                return "768x512"
            case "portrait":
            case "character":
            case "user":
            case "ai":
                return "512x768"
            default:
                return "512x512"
        }
    },

    /**
     * Generates an image from a prompt.
     * @param {string} prompt
     * @param {Object} options { resolution, removeBackground }
     * @returns {Promise<string|null>} The image URL
     */
    async generate(prompt, options = {}) {
        if (!window.textToImage) {
            error("[The_Mesmer] textToImage plugin not found.")
            return null
        }

        try {
            log("[The_Mesmer] Generating:", prompt, options)
            // Mocking the plugin call, assuming perchant textToImage API
            // In a real scenario, this matches the plugin signature
            const result = await window.textToImage(prompt, options)
            return result?.url || result // Adapt to plugin return type
        } catch (e) {
            error("[The_Mesmer] Generation failed:", e)
            return null
        }
    },

    /**
     * Uploads a file to the server.
     * @param {File} file
     * @returns {Promise<string|null>}
     */
    async upload(file) {
        if (!window.upload) {
            error("[The_Mesmer] upload plugin not found.")
            return null
        }

        try {
            log("[The_Mesmer] Uploading file:", file.name)
            const result = await window.upload(file)
            return result?.url || result
        } catch (e) {
            error("[The_Mesmer] Upload failed:", e)
            return null
        }
    },
}
