import { extractImageUrl, log, error } from "../../core/utils.js";

/**
 * THE VISUAL MANAGER (V7.3: THE REALISM HAMMER)
 * Handles interaction with the Perchance Text-to-Image Plugin.
 * FORCEFULLY injects realism tags into every single prompt.
 */

const VISUAL_CONSTANTS = {
  // COMPULSORY REALISM TAGS. These will be prepended to EVERY prompt.
  REALISM_ANCHOR:
    "raw photo, amateur phone photography, flash photography, realistic skin texture, pores, acne scars, imperfections, high iso, film grain, unpolished, snapchat quality",

  // THE FIREWALL (Strict Anti-Anime)
  NEGATIVE_CONSTRAINTS:
    "anime, cartoon, illustration, drawing, 3d render, painting, sketch, smooth skin, plastic skin, doll-like, glowing skin, matte, low resolution, bad anatomy, text, watermark, cgi, unreal engine, video game, airbrushed, perfect lighting, rendered",

  DEFAULT_RESOLUTION: "512x768",
};

export const VisualManager = {
  // --- CORE SERVICES ---

  async generate(prompt, options = {}) {
    options = options || {};
    if (!window.textToImage) throw new Error("Image plugin not loaded.");

    log(`[Visuals] Raw Input: ${prompt.substring(0, 50)}...`);

    // 1. SANITIZATION (Remove <think> and brackets)
    let cleanPrompt = prompt.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    cleanPrompt = cleanPrompt.replace(/[\[\]\{\}]/g, "");
    cleanPrompt = cleanPrompt.replace(/\n/g, ", ");

    // 2. THE REALISM HAMMER (Force Injection)
    // We prepend the realism anchor to ensure it's the first thing Flux sees.
    const finalPrompt = `${VISUAL_CONSTANTS.REALISM_ANCHOR}, ${cleanPrompt}`;

    log(`[Visuals] Final Realism Prompt: ${finalPrompt.substring(0, 100)}...`);

    let negativePrompt = options.negative || "";
    if (!negativePrompt.includes("anime")) {
      negativePrompt +=
        (negativePrompt ? ", " : "") + VISUAL_CONSTANTS.NEGATIVE_CONSTRAINTS;
    }

    const resolution =
      options.resolution || VISUAL_CONSTANTS.DEFAULT_RESOLUTION;

    try {
      const result = await window.textToImage(finalPrompt, {
        resolution: resolution,
        negativePrompt: negativePrompt,
        removeBackground: options.removeBackground || false,
        guidanceScale: 7,
        seed: -1,
      });

      if (typeof result === "string" && result.startsWith("(")) {
        throw new Error(result);
      }

      return typeof result === "string" ? result : extractImageUrl(result);
    } catch (e) {
      error("[VisualManager] Generation failed:", e);
      throw e;
    }
  },

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

  // --- PROMPT ENGINEERING (MANUAL FALLBACK) ---

  composePrompt(
    entity,
    stylePreference = null,
    extraContext = null,
    options = {},
  ) {
    const name = entity.name || "Subject";
    const appearance = entity.sections?.forever || entity.forever || "";
    const outfit =
      entity.sections?.present || entity.present || "casual clothes";

    let anchor = "";
    const traits = (appearance + " " + outfit).toLowerCase();

    // Identity Weighting
    if (
      traits.includes("male") ||
      traits.includes("man") ||
      traits.includes("himbo")
    ) {
      anchor = "(MALE:1.6), (MAN:1.5)";
    } else if (traits.includes("female") || traits.includes("woman")) {
      anchor = "(FEMALE:1.6), (WOMAN:1.5)";
    }

    // Mass Weighting
    if (
      traits.includes("bodybuilder") ||
      traits.includes("steroid") ||
      traits.includes("muscle")
    ) {
      anchor += ", (HYPER-MUSCULAR:1.4), (MASSIVE BUILD:1.3)";
    }

    // Note: We don't need to add BASE_STYLE here anymore, because
    // the generate() function above will automatically prepend it.

    const realityFilter =
      "bioluminescent body paint, subdermal LED implants, latex texture, tactical gear";

    const isFractal = entity.type === "fractal" || entity.kind === "fractal";
    let action = extraContext ? extraContext.trim() : "standing candidly";
    if (isFractal && !extraContext) action = "panoramic view";

    const parts = [
      anchor,
      // VISUAL_CONSTANTS.REALISM_ANCHOR, // Removed, handled by generate()
      `Subject: ${name}, ${action}`,
      `Physical Details: ${appearance}, ${outfit}`,
      `Material Effects: ${realityFilter}`,
    ];

    const finalPrompt = parts.filter(Boolean).join(", ");

    log(
      "[VisualManager] Assembled Manual Prompt (Pre-Injection):",
      finalPrompt,
    );
    return finalPrompt;
  },

  getResolutionForMode: (mode) => {
    if (mode === "scene" || mode === "landscape") return "768x512";
    if (mode === "portrait" || mode === "selfie") return "512x768";
    return VISUAL_CONSTANTS.DEFAULT_RESOLUTION;
  },
};
