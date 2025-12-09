import { extractImageUrl } from "./core-utils.js";

/**
 * THE VISUAL MANAGER
 * Handles all interaction with Image Gen APIs and Prompt Engineering for visuals.
 * Decouples "Business Logic" (Prompting) from "UI Logic" (Buttons/Modals).
 */
export const VisualManager = {

    // --- CORE SERVICES ---

    /**
     * Generates an image using the text-to-image plugin.
     * @param {string} prompt - The raw prompt.
     * @param {Object} options - { resolution, negative }
     */

    async generate(prompt, options = {}) {
        if (!window.textToImage) throw new Error("Image plugin not loaded.");

        const resolution = options.resolution || "512x768";

        try {
            const result = await window.textToImage({
                prompt: prompt,
                resolution: resolution,
                negative_prompt: options.negative || "blurry, low quality, text, watermark, bad anatomy, distorted faces",

                // [NEW] Pass the transparency flag if requested
                removeBackground: options.removeBackground || false
            });

            return typeof result === 'string' ? result : extractImageUrl(result);
        } catch (e) {
            console.error("[VisualManager] Generation failed:", e);
            throw e;
        }
    },

    /**
     * Uploads an image blob using the upload plugin.
     * @param {Blob} fileBlob 
     */

    async upload(fileBlob) {
        if (!window.upload) throw new Error("Upload plugin not loaded.");

        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = async () => {
                try {
                    const res = await window.upload(reader.result);
                    const url = typeof res === 'string' ? res : extractImageUrl(res);
                    resolve(url);
                } catch (e) {
                    reject(e);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(fileBlob);
        });
    },

    // --- PROMPT ENGINEERING ---

    /**
     * "Magic Wand": Extracts visual traits from a JSON entity.
     * Uses the LLM to convert raw data -> visual keywords.
     */
    async extractTraits(entity, type) {
        if (!window.ai) throw new Error("AI plugin not loaded.");

        // Build a compact context block for the extraction model
        const context = `
Name: ${entity.name}
Description: ${entity.description}
Traits: ${(entity.tags || []).join(", ")}
${entity.present ? "Current State: " + entity.present : ""}
    `.trim();

        const systemPrompt = `[SYSTEM: VISUAL_EXTRACTOR]
You are a Concept Artist. Your task is to read the character/world profile and output a comma-separated list of VISUAL keywords for an image generator.
Rules:
1. Ignore abstract concepts (e.g., "brave", "ancient history").
2. Focus on PHYSICALITY (Race, Hair, Eyes, Clothes, Lighting, Biome, Architecture).
3. Output ONLY the list. No chatter.`;

        const result = await window.ai(`${systemPrompt}\n\n[DATA]\n${context}`);

        // Clean up any "Here is the list:" chatter from the LLM
        return result.replace(/^Visuals:?\s*/i, "").replace(/["[.]$/, "");
    },

    /**
     * "Paint Brush": Applies a specific style to a prompt.
     * Now uses SOTA Flux-friendly natural language structures.
     * @param {string} basePrompt - The user's current input.
     * @param {string} styleType - The color/vibe (e.g., "Neon", "Cinematic").
     * @param {string} entityType - 'world' or 'character'.
     */
    async stylize(basePrompt, styleType, entityType) {
        // 1. Clean up old "Danbooru" tags if they exist
        const cleanPrompt = basePrompt.replace(/\(masterpiece\), best quality, /g, "").trim();

        // 2. Apply SOTA Natural Language Formatting
        if (entityType === 'world') {
            // Landscape Logic
            return `A cinematic wide shot of ${cleanPrompt}, rendered in a ${styleType} style, featuring atmospheric lighting, 8k resolution, and detailed environmental textures.`;
        } else {
            // Portrait Logic (Standardized Side Profile for UI consistency)
            return `A high-fidelity character portrait of ${cleanPrompt}, captured in a ${styleType} style. The subject is facing slightly right, side profile, dramatic lighting, detailed skin texture.`;
        }
    }
};