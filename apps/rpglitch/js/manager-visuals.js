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
     * @param {Object} options - { resolution, negative, removeBackground }
     */
    async generate(prompt, options = {}) {
        if (!window.textToImage) throw new Error("Image plugin not loaded.");

        const resolution = options.resolution || "512x768";

        try {
            const result = await window.textToImage({
                prompt: prompt,
                resolution: resolution,
                negative_prompt: options.negative || "blurry, low quality, text, watermark, bad anatomy, distorted faces, cartoon, cgi",

                // [NEW] Pass the transparency flag if requested (Great for character tokens)
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

        // [UPGRADE] Instruct the AI to output visual *sentences* rather than just tags for Flux
        const systemPrompt = `[SYSTEM: VISUAL_EXTRACTOR]
You are a Concept Artist. Your task is to extract VISUAL DATA from the profile.
Rules:
1. Ignore abstract concepts (e.g., "brave", "ancient history").
2. Focus on PHYSICALITY (Race, Hair, Eyes, Clothes, Scars, Accessories).
3. Output a comma-separated list of visual adjectives and nouns.`;

        const result = await window.ai(`${systemPrompt}\n\n[DATA]\n${context}`);

        // Clean up any "Here is the list:" chatter from the LLM
        return result.replace(/^Visuals:?\s*/i, "").replace(/["[.]$/, "");
    },

    /**
     * "Paint Brush": Applies a specific style to a prompt.
     * [UPGRADE] Now injects 'rpgLists' logic for high-fidelity output.
     * * @param {string} basePrompt - The user's current input (or extracted traits).
     * @param {string} styleType - The user-selected style (optional).
     * @param {string} entityType - 'world' or 'character'.
     */
    async stylize(basePrompt, styleType, entityType) {
        // 1. Clean up old tags
        const cleanPrompt = basePrompt.replace(/\(masterpiece\), best quality, /g, "").trim();

        // 2. Fetch "Flavor" from the new Global Lists (if available)
        const lists = window.rpgLists || {};
        const pick = (jsonList) => {
            if (!jsonList) return "";
            try { const arr = JSON.parse(jsonList); return arr[Math.floor(Math.random() * arr.length)]; }
            catch (e) { return ""; }
        };

        // If no specific style requested, pick a high-quality default or random one
        const tech = pick(lists.tech) || "cinematic 35mm";
        const lighting = pick(lists.lighting) || "volumetric lighting";
        const vibe = styleType || pick(lists.styles) || "photorealistic";

        // 3. Apply SOTA Natural Language Formatting (Flux Architecture)
        if (entityType === 'world') {
            // SCENE LOGIC: Focus on atmosphere and depth
            return `A cinematic wide shot of ${cleanPrompt}. The scene is rendered in a ${vibe} style with ${lighting}. Captured on ${tech}, featuring atmospheric depth, 8k resolution, and detailed environmental textures.`;
        } else {
            // PORTRAIT LOGIC: Focus on skin/material fidelity
            // Note: We keep "Side Profile" for UI consistency (Avatar cards look better uniform)
            return `A high-fidelity character portrait of ${cleanPrompt}. The subject is facing slightly right, side profile. The image is a ${vibe} piece with ${lighting}. Captured on ${tech} focusing on natural skin pores, realistic blemishes, and fabric weave. Blurred background.`;
        }
    }
};