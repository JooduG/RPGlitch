import { extractImageUrl, log, error } from "../../../../gamemaster/utils.js";

/**
 * THE VISUAL MANAGER
 * Handles interaction with the Perchance Text-to-Image Plugin.
 * Injects technical photography references and stylistic glitches.
 */

const VISUAL_CONSTANTS = {
  // HIGH-FIDELITY REALISM ANCHORS
  REALISM_ANCHOR:
    "ultra-sharp raw photo, Kodak Portra 400 film stock, authentic skin textures, subtle imperfections, natural cinematic lighting, shot on Fujifilm X-T5, high-end candid, professional color grading",

  // THE FIREWALL (Strict Anti-Anime & Synthetic looks)
  NEGATIVE_CONSTRAINTS:
    "anime, cartoon, illustration, drawing, 3d render, painting, sketch, rendered, cgi, unreal engine, video game, bad anatomy, blurry, low resolution, plastic skin, airbrushed, glowing eyes",

  DEFAULT_RESOLUTION: "512x768",
};

// Helper: Fetch random item from window.rpgLists (injected by Left Panel)
const getList = (key, fallback = []) => {
  if (window.rpgLists && window.rpgLists[key]) {
    try {
      // Perchance exports lists as an array containing a single JSON string
      const raw = window.rpgLists[key][0];
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length > 0) {
        return arr[Math.floor(Math.random() * arr.length)];
      }
    } catch (e) {
      console.warn(`[Visuals] Failed to parse list '${key}'`, e);
    }
  }
  if (fallback.length > 0) {
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
  return "";
};

export const VisualManager = {
  // --- CORE SERVICES ---

  async generate(prompt, options = {}) {
    options = options || {};
    if (!window.textToImage) throw new Error("Image plugin not loaded.");

    log(`[Visuals] Raw Input: ${prompt.substring(0, 40)}...`);

    // 1. SANITIZATION
    let cleanPrompt = prompt
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/<image_prompt[^>]*>|<\/image_prompt>/gi, "")
      .trim();

    cleanPrompt = cleanPrompt.replace(/[[\]{}]/g, "");
    cleanPrompt = cleanPrompt.replace(/\{\{.*?\}\}/g, "");
    cleanPrompt = cleanPrompt.replace(/\n/g, ", ");

    // 2. THE REALISM HAMMER
    const randomArtifact = getList("artifacts", [
      "motion blur, cinematic shadows", // Fallback
    ]);

    // Weighted anchor for stronger influence
    const finalPrompt = `((${VISUAL_CONSTANTS.REALISM_ANCHOR}):1.2), (${randomArtifact}:1.3), ${cleanPrompt}`;

    log(`[Visuals] Final Prompt: ${finalPrompt.substring(0, 100)}...`);

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
        guidanceScale: options.guidanceScale || 8, // Dynamic or fallback to 8
        seed: -1,
      });

      if (
        typeof result === "string" &&
        (result.startsWith("(") || result.includes("invalid_key"))
      ) {
        throw new Error(result);
      }

      return typeof result === "string" ? result : extractImageUrl(result);
    } catch (e) {
      error("[VisualManager] Generation failed:", e);
      if (String(e).includes("invalid_key")) {
        import("../../core/modal.js").then(({ showAlert }) => {
          showAlert(
            "Visual Engine Error",
            "The image generation key is invalid. Please refresh the page.",
          );
        });
      }
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

  // --- PROMPT ENGINEERING ---

  composePrompt(
    entity,
    stylePreference = null,
    extraContext = null,
    options = {},
  ) {
    const name = entity.name || "Subject";

    // TEMPORAL HYBRID 6: Using primary physical fields
    const appearance = entity.forever?.physical || "";
    const outfit = entity.present?.physical || "casual streetwear";

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

    // Mass / Detail Weighting
    if (traits.includes("bodybuilder") || traits.includes("muscle")) {
      anchor += ", (HYPER-MUSCULAR:1.4), (MASSIVE PHYSIQUE:1.3)";
    }

    // Dynamic Style Glitch
    const styleGlitch = getList("glitches", [
      "bioluminescent accents, digital noise", // Fallback
    ]);

    const isFractal = entity.type === "fractal" || entity.kind === "fractal";
    let action = extraContext ? extraContext.trim() : "standing candidly";
    if (isFractal && !extraContext) action = "panoramic abstract macro view";

    const parts = [
      anchor,
      `(Subject: ${name}:1.2), ${action}`,
      `Physical: ${appearance}`,
      `Outfit: ${outfit}`,
      `Aesthetic: ${styleGlitch}`,
    ];

    const finalPrompt = parts.filter(Boolean).join(", ");

    log("[VisualManager] Assembled Prompt:", finalPrompt);
    return finalPrompt;
  },

  getResolutionForMode: (mode) => {
    if (mode === "landscape" || mode === "scene") return "768x512";
    if (mode === "portrait" || mode === "selfie") return "512x768";
    if (mode === "square") return "768x768";
    return VISUAL_CONSTANTS.DEFAULT_RESOLUTION;
  },

  /**
   * Visual State Accessor
   * Ensures safe access to visual properties with sensible defaults.
   */
  getVisualState: (entity = {}) => {
    return (
      entity.visuals || {
        flipped: false,
        profilePictureUrl: "",
        fullBodyUrl: "",
        scale: 1.0,
        yOffset: 0,
      }
    );
  },
};
