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
  // [AMATEUR UPDATE] Removed "bad anatomy, blurry, low resolution" to allow glitches/realism
  NEGATIVE_CONSTRAINTS:
    "anime, cartoon, illustration, drawing, 3d render, painting, sketch, smooth skin, plastic skin, doll-like, glowing skin, matte, perfect lighting, rendered, cgi, unreal engine, video game",

  CAMERA_ARTIFACTS: [
    "motion blur, out of focus hand, harsh flash, red eye, dirty lens",
    "low light noise, grain, cctv footage, security camera angle",
    "unflattering angle, double chin, blurry background, photobomber",
    "reflection in mirror, fingerprints on glass, overexposed",
    "shaky camera, slightly out of focus, lens flare, thumb over lens",
  ],

  DEFAULT_RESOLUTION: "512x768",
};

export const VisualManager = {
  // --- CORE SERVICES ---

  async generate(prompt, options = {}) {
    options = options || {};
    if (!window.textToImage) throw new Error("Image plugin not loaded.");

    log(`[Visuals] Raw Input: ${prompt.substring(0, 50)}...`);

    // 1. SANITIZATION (Remove <think>, brackets, and Perchance list syntax)
    let cleanPrompt = prompt.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    // Brackets [ ] and Braces { } trigger Perchance list evaluation.
    // We must remove them or escape them. Removal is safer for simple prompting.
    cleanPrompt = cleanPrompt.replace(/[[\]{}]/g, "");
    // Remove potential double-brace list calls ({{list}}) just in case
    cleanPrompt = cleanPrompt.replace(/\{\{.*?\}\}/g, "");
    cleanPrompt = cleanPrompt.replace(/\n/g, ", ");

    // 2. THE REALISM HAMMER (Force Injection)
    // We prepend the realism anchor to ensure it's the first thing Flux sees.
    const randomArtifact =
      VISUAL_CONSTANTS.CAMERA_ARTIFACTS[
        Math.floor(Math.random() * VISUAL_CONSTANTS.CAMERA_ARTIFACTS.length)
      ];
    const finalPrompt = `${VISUAL_CONSTANTS.REALISM_ANCHOR}, (${randomArtifact}:1.3), ${cleanPrompt}`;

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
    // [V6] NESTED ACCESSORS
    const appearance =
      entity.forever?.physical || entity.appearance || entity.forever || "";
    const outfit =
      entity.present?.physical ||
      entity.outfit ||
      entity.present ||
      "casual clothes";

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

    const realityFilter =
      "bioluminescent body paint, subdermal LED implants, latex texture, tactical gear";

    const isFractal = entity.type === "fractal" || entity.kind === "fractal";
    let action = extraContext ? extraContext.trim() : "standing candidly";
    if (isFractal && !extraContext) action = "panoramic view";

    const parts = [
      anchor,
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
    if (mode === "square") return "768x768";
    return VISUAL_CONSTANTS.DEFAULT_RESOLUTION;
  },
};
