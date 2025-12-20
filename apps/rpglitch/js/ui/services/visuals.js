import { extractImageUrl, log } from "../../core/utils.js";
import { VISUAL_PRESETS } from "../../data/visual-styles.js";

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
    options = options || {}; // Safety: Ensure options is an object
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

      if (typeof result === "string" && result.startsWith("(")) {
        throw new Error(result);
      }

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
   * "The Assembler": Instantly constructs a prompt without a second LLM call.
   * Combines Style + Action + Entity Traits.
   */
  async composePrompt(
    entity,
    stylePreference = "photorealistic",
    extraContext = null,
    options = {},
  ) {
    options = options || {}; // Safety: Ensure options is an object
    // 0. DETECT TYPE (Robust check)
    const type = (entity.type || entity.kind || "").toLowerCase();
    const isFractal = type === "world" || type === "fractal";

    // 1. DEFINE STYLE PREFIX
    let stylePrefix = isFractal
      ? VISUAL_PRESETS.STYLES.FRACTAL
      : VISUAL_PRESETS.STYLES.CHARACTER;

    // Messenger Mode Override (Characters Only)
    if (options.isMessenger && !isFractal) {
      stylePrefix = VISUAL_PRESETS.STYLES.MESSENGER;

      const promptLower = (extraContext || "").toLowerCase();
      if (promptLower.includes("selfie")) {
        stylePrefix += VISUAL_PRESETS.STYLES.SELFIE;
      }
      if (promptLower.includes("mirror")) {
        stylePrefix += VISUAL_PRESETS.STYLES.MIRROR;
      }
    } else {
      // Standard styles
      if (stylePreference === "anime")
        stylePrefix = VISUAL_PRESETS.STYLES.ANIME;
      if (stylePreference === "oil") stylePrefix = VISUAL_PRESETS.STYLES.OIL;
    }

    // Inject Lens (Prepend)
    if (options.lens && VISUAL_PRESETS.LENSES[options.lens]) {
      stylePrefix = `${VISUAL_PRESETS.LENSES[options.lens]}, ${stylePrefix}`;
    } else if (VISUAL_PRESETS.LENSES.DEFAULT) {
      // Optional: enforce default lens?
      // stylePrefix = `${VISUAL_PRESETS.LENSES.DEFAULT}, ${stylePrefix}`;
    }

    // Inject Texture (Append)
    if (options.texture && VISUAL_PRESETS.TEXTURES[options.texture]) {
      stylePrefix += `, ${VISUAL_PRESETS.TEXTURES[options.texture]}`;
    }

    // 2. EXTRACT VISUAL ANCHOR
    // We combine specific fields to ensure consistency.
    const visualTraits = [
      entity.name,
      // entity.description, // Description is for user context only
      entity.forever, // Immutable traits
      entity.present, // Current outfit/state
    ]
      .filter(Boolean)
      .join(", ");

    // 3. DEFINE ACTION (The "Extra Context" from Chat)
    let defaultAction = isFractal
      ? "panoramic view of the location"
      : "standing in neutral pose";

    const action = extraContext ? extraContext.trim() : defaultAction;

    // 4. ASSEMBLE FINAL PROMPT
    // Format: [Style] + [Action/Subject] + [Visual Definitions]
    const finalPrompt = `${stylePrefix}, ${action}, (${visualTraits})`;

    log("[VisualManager] Assembled Prompt:", finalPrompt);

    // Return immediately (No await)
    return finalPrompt;
  },
};
