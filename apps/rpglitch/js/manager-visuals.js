import { extractImageUrl } from "./core-utils.js";

/**
 * THE VISUAL MANAGER
 * Handles all interaction with Image Gen APIs and Prompt Engineering for visuals.
 * Decouples "Business Logic" (Prompting) from "UI Logic" (Buttons/Modals).
 */

const DEFAULT_NEGATIVE =
  "blurry, low quality, text, watermark, bad anatomy, distorted faces, extra limbs, mutated hands, poorly drawn face, disfigured, asymmetric, ugly, grain, noise, messy, worst quality, low resolution";

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
        negative_prompt: options.negative || DEFAULT_NEGATIVE,

        // [NEW] Pass the transparency flag if requested (Great for character tokens)
        removeBackground: options.removeBackground || false,
      });

      return typeof result === "string" ? result : extractImageUrl(result);
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
          const url = typeof res === "string" ? res : extractImageUrl(res);
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
  async composePrompt(
    entity,
    stylePreference = "photorealistic",
    extraContext = null,
  ) {
    if (!window.ai) throw new Error("AI plugin not loaded.");

    const isWorld = entity.type && entity.type.toLowerCase() === "world";

    // [UPDATED] Context to include ALL narrative fields for extraction
    let context = `
SUBJECT NAME: ${entity.name || "Unknown"}
ROLE/DESC: ${entity.description || ""}
TAGS: ${(entity.tags || []).join(", ")}
--
PERMANENT TRAITS (Forever): ${entity.forever || "Not specified"}
PAST HISTORY: ${entity.past || "Not specified"}
CURRENT STATE (Present): ${entity.present || "Neutral"}
FUTURE: ${entity.future || "Not specified"}
--
TARGET STYLE: ${stylePreference}
`.trim();

    if (extraContext && extraContext.trim()) {
      context += `\nUSER NOTES: ${extraContext.trim()}`;
    }

    let systemPrompt;

    if (isWorld) {
      systemPrompt = `[SYSTEM: VISUAL_DIRECTOR]
You are a Lead Environment Artist & Landscape Photographer using the Flux Image Engine.
Task: Write a cohesive "Visual Specification" paragraph (3-4 sentences) that combines the SUBJECT with the TARGET STYLE.

<RULES>
1. **Architecture & Terrain:** Focus 80% of the prompt on the geography, structures, and scale of the place found in <PERMANENT> and <PRESENT>.
2. **Atmosphere:** Describe the lighting (Golden Hour, Neon, Stormy) and weather conditions.
3. **Perspective:** Use a "Wide Angle" or "Bird's Eye View" to capture the scale.
4. **No Characters:** Do not focus on specific individuals. Focus on the *world* itself.
5. **Format:** Output ONLY the prompt text.
</RULES>`;
    } else {
      // [UPDATED] Strict Extraction & Orchestration Logic
      systemPrompt = `[SYSTEM: VISUAL_DIRECTOR]
You are a Lead Character Artist & Portrait Photographer using the Flux Image Engine.
Target: Create a high-fidelity image prompt for "${entity.name}".

<MISSION>
1. **EXTRACT EVERYTHING:** Scan <PERMANENT TRAITS>, <CURRENT STATE>, and <ROLE/DESC>. You must find EVERY detail about physical appearance (body type, hair color, eye color, scars, clothing, race, gender, mutations).
   - **CRITICAL:** If the data says "plump lips", you MUST write "plump lips". If it says "195cm", you MUST write "tall/imposing".
   - **DO NOT** ignore specific physical traits.
   - **DO NOT** include "game mechanics" or "stat blocks". Translate them to visual traits (e.g., "Strength 100" -> "Muscular build").

2. **DETERMINE POSE:** Analyze the personality/vibe.
   - *Dominant/Heroic?* -> "Standing tall, chest out, heroic stance, looking down at camera."
   - *Bratty/Sassy?* -> "Smirking playfully, hand on hip, teasing expression."
   - *Shy/Weak?* -> "Looking away nervously, defensive posture."
   - *Action?* -> "Mid-motion, dynamic energy."

3. **ORCHESTRATE THE PROMPT:**
   - **Subject:** Start with the specific physical description extracted above.
   - **Pose:** Add the derived pose.
   - **Style:** Apply "${stylePreference}" (e.g. "Simulated Analog Film" or "Digital Painting").
   - **Keywords:** ALWAYS append: "Best quality, masterpiece, character portrait, sharp focus, detailed skin texture, 8k resolution."

<OUTPUT_FORMAT>
- Write ONE cohesive paragraph.
- NO conversational filler ("Here is the prompt").
- Output ONLY the raw prompt text.
</OUTPUT_FORMAT>`;
    }

    // Call the LLM
    const result = await window.ai(`${systemPrompt}\n\n[DATA]\n${context}`);

    // Clean up any potential quotes or leading/trailing whitespace
    return result.replace(/^["']|["']$/g, "").trim();
  },
};
