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
     * "The Director": Merges extraction and stylization into one pass.
     * Generates a fully realized Flux prompt from entity data + style settings.
     * Replaces the old 'extractTraits' and 'stylize' split workflow.
     */
    async composePrompt(entity, stylePreference = "photorealistic", extraContext = null) {
        if (!window.ai) throw new Error("AI plugin not loaded.");

        let context = `
SUBJECT: ${entity.name}
ROLE: ${entity.description}
TRAITS: ${(entity.tags || []).join(", ")}
CURRENT STATE: ${entity.present || "Neutral"}
TARGET STYLE: ${stylePreference}
`.trim();

        if (extraContext && extraContext.trim()) {
            context += `\nUSER NOTES: ${extraContext.trim()}`;
        }

        const systemPrompt = `[SYSTEM: VISUAL_DIRECTOR]
You are a Lead Cinematographer using the Flux Image Engine.
Task: Write a cohesive "Visual Specification" paragraph (3-4 sentences) that combines the SUBJECT with the TARGET STYLE.

<RULES>
1. **Integration:** Do not just list traits. Describe the subject *within* the lighting and atmosphere of the style.
2. **Camera:** Specify a lens/film stock that fits the "${stylePreference}" (e.g., 35mm for realism, loose brushwork for painting).
3. **Details:** Focus on texture (skin, fabric, metal) and lighting physics (volumetric, rim light).
4. **User Notes:** If USER NOTES are provided, they are mandatory instructions. Integrate them seamlessly.
5. **Format:** Output ONLY the prompt text. No "Here is the prompt:" chatter.
</RULES>`;

        // Call the LLM
        const result = await window.ai(`${systemPrompt}\n\n[DATA]\n${context}`);

        // Clean up any potential quotes or leading/trailing whitespace
        return result.replace(/^["']|["']$/g, "").trim();
    }
};