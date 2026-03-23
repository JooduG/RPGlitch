/**
 * src/media/visuals/image_engine.js
 * ⚙️ [COMPONENT: GENERATION ENGINE]
 * Orchestrates physical image generation, API bridging, and pipeline facades.
 */
import { CONFIG, ROLES } from "@core/engine/config.js";
import { ContextBroker } from "@core/intelligence/context-broker.js";
import { LlmService } from "@core/intelligence/llm-service.js";
import { db } from "@data/db.js";
import { entities } from "@data/repository.js";
import { runtime } from "@state/runtime.svelte.js";
import { simulationState as simulation } from "@state/status.svelte.js";
import {
  AestheticRouter,
  NEGATIVE_PROMPT,
  PROMPT_TEMPLATES,
  PromptEngine,
} from "./image-prompts.js";
const { DYNAMICS } = CONFIG;
const DYNAMICS_CONSTANTS = DYNAMICS;
/************************************************************************************
 * 🧩 [SECTION: GENERATOR ENGINE (API BRIDGE)]
 ************************************************************************************/
export const GeneratorEngine = {
  /**
   * Returns optimal resolution for various image modes.
   */
  getResolution(mode) {
    switch (mode) {
      case "landscape":
      case "scene":
      case "fractal":
        return { width: 768, height: 512 };
      case "portrait":
      case "character":
      case "user":
      case "ai":
        return { width: 512, height: 768 };
      default:
        return { width: 768, height: 768 };
    }
  },
  /**
   * Persists generated images to the Entity store.
   */
  async cacheImage(entityId, imageData) {
    try {
      await db.entities.update(entityId, {
        profile_picture: imageData,
        updatedAt: Date.now(),
      });
      await runtime.updateEntity("character", entityId, {
        profile_picture: imageData,
      });
    } catch (err) {
      console.error("[IMAGE_ENGINE] Caching Failed:", err);
    }
  },
  /**
   * Bridges to the Perchance upload plugin.
   */
  async upload(file) {
    if (!window.pluginUpload) {
      console.error("[IMAGE_ENGINE] upload plugin not found.");
      return null;
    }
    try {
      const result = await window.pluginUpload(file);
      return result?.url || result;
    } catch (e) {
      console.error("[IMAGE_ENGINE] Upload failed:", e);
      return null;
    }
  },
  /**
   * Executes the Text-to-Image request via Perchance plugin.
   */
  async execute(finalPrompt, negativePrompt, options) {
    if (!window.pluginTextToImage) {
      console.warn("[IMAGE_ENGINE] Perchance text to image plugin not available.");
      return null;
    }
    const res = this.getResolution(options.mode);
    const result = await window.pluginTextToImage({
      prompt: finalPrompt,
      negativePrompt: negativePrompt,
      seed: options.seed || Math.floor(Math.random() * 1000000),
      width: options.width || res.width,
      height: options.height || res.height,
    });
    return result;
  },
};
/************************************************************************************
 * 🧩 [SECTION: PIPELINE FACADES]
 ************************************************************************************/
export const ImageGeneration = {
  /**
   * Primary generation pipeline.
   */
  async generate(target, options = {}) {
    try {
      let finalPrompt = "";
      let entityId = null;
      if (typeof target === "string" && target.length > 100) {
        finalPrompt = target;
      } else if (typeof target === "string") {
        entityId = target;
        const character = (await entities.get("character", entityId)) ||
          (await entities.get("user", entityId)) ||
          (await entities.get("fractal", entityId)) || {
            name: "",
            description: "",
            fragments: [],
          };
        const characterData = {
          physical: character.description || character.name,
          fragments: character.fragments || [],
        };
        const system =
          `[SYSTEM: PROMPT_ENGINEER]\nI translate a character description into dense, visual-only tokens for Stable Diffusion.\n\n<CONSTRAINTS>\n- Output ONLY a comma-separated list of visual descriptors.\n- No first-person language. No abstract concepts or backstory.\n- Focus on: subject, clothing, physical features, lighting, camera angle, aesthetic style.\n</CONSTRAINTS>\n\n<DRAFT_DESCRIPTION>\n${characterData.physical}\n</DRAFT_DESCRIPTION>`.trim();
        finalPrompt = await PromptEngine.optimize(system, characterData);
      } else {
        finalPrompt = target.toString();
      }
      const result = await GeneratorEngine.execute(finalPrompt, NEGATIVE_PROMPT, options);
      if (result && result.dataUrl) {
        if (entityId && !options.noCache) {
          await GeneratorEngine.cacheImage(entityId, result.dataUrl);
        }
        return result.dataUrl;
      }
      if (result && entityId && !options.noCache) {
        await GeneratorEngine.cacheImage(entityId, result);
      }
      return result;
    } catch (err) {
      console.error("[IMAGE_ENGINE] Generation Failed:", err);
      throw err;
    }
  },
  /**
   * Context-aware visualization pipeline for Storymode.
   */
  visualize: async (storyId, visualPrompt, targetType, options = {}) => {
    const story = runtime.story.byId[storyId];
    if (!story) throw new Error(`Story ${storyId} not found`);
    let targetRole = ROLES.AI;
    let targetId = story.aiId;
    if (targetType === ROLES.FRACTAL || targetType === "scene") {
      targetRole = ROLES.FRACTAL;
      targetId = story.fractalId;
    } else if (targetType === ROLES.USER) {
      targetRole = ROLES.USER;
      targetId = story.userId;
    }
    simulation.start_typing(targetRole, targetId);
    try {
      let vTarget = targetType || "character";
      if (targetType === ROLES.FRACTAL) vTarget = "scene";
      const hydrated = await ContextBroker.hydrate("", "image");
      const vPayload = {
        fractal: {
          present: { physical: hydrated.entities.FRACTAL.description || "" },
        },
        user: {
          present: { physical: hydrated.entities.USER.description || "" },
        },
        ai: { present: { physical: hydrated.entities.AI.description || "" } },
      };
      const characterData = {
        physical:
          vTarget === "scene"
            ? hydrated.entities.FRACTAL.description
            : vTarget === "user"
              ? hydrated.entities.USER.description
              : hydrated.entities.AI.description,
        fragments: [],
      };
      const selections = AestheticRouter.select(characterData);
      vPayload.system = PROMPT_TEMPLATES.builder(vTarget, visualPrompt, vPayload, selections);
      vPayload.system += `\n<RAW_INTENT>\n${visualPrompt}\n</RAW_INTENT>`;
      const refinedPrompt = await LlmService.generate(
        { system: vPayload.system },
        {
          max_tokens: 300,
          temperature: DYNAMICS_CONSTANTS.VISUAL_TEMP_DEFAULT,
        },
      );
      const thinkMatch = refinedPrompt.match(/<think>([\s\S]*?)<\/think>/i);
      const opticsThoughts = thinkMatch ? thinkMatch[1].trim() : null;
      const cleanRefinedPrompt = refinedPrompt
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/<image_prompt[^>]*>|<\/image_prompt>/gi, "")
        .trim();
      const imageUrl = await ImageGeneration.generate(cleanRefinedPrompt, {
        mode: options.aspect || vTarget,
        guidanceScale: options.guidanceScale,
      });
      return {
        imageUrl,
        refinedPrompt: cleanRefinedPrompt,
        opticsThoughts,
      };
    } catch (visErr) {
      console.error("[IMAGE_ENGINE] Visualizer Failed:", visErr);
      return { imageUrl: null, refinedPrompt: null, opticsThoughts: null };
    } finally {
      simulation.stop_typing();
    }
  },
  /**
   * Portrait scraper pipeline for Character fetch.
   */
  fetch: async (characterId) => {
    try {
      const character = await entities.get("character", characterId);
      if (!character) throw new Error("Character not found");
      const characterData = {
        physical: character.description || character.name,
        fragments: character.fragments || [],
      };
      const selections = AestheticRouter.select(characterData);
      const system = `[SYSTEM: PROMPT_ENGINEER]
I translate a character description into dense, visual-only tokens for Stable Diffusion.
<CONSTRAINTS>
- Output ONLY a comma-separated list of visual descriptors.
- No first-person language. No abstract concepts or backstory.
- Focus on: subject, clothing, physical features, lighting, camera angle, aesthetic style.
</CONSTRAINTS>
<DRAFT_DESCRIPTION>
${character.description || character.name}
</DRAFT_DESCRIPTION>`.trim();
      const payload = {
        system: PROMPT_TEMPLATES.optimize(system, selections),
        messages: [],
      };
      const refinedPrompt = await LlmService.generate(payload);
      const imageUrl = await ImageGeneration.generate(refinedPrompt, {
        mode: "character",
      });
      return imageUrl;
    } catch (e) {
      console.error("[IMAGE_ENGINE] Fetch Failed:", e);
      throw e;
    }
  },
  // --- ALIASES FOR BACKWARD COMPATIBILITY ---
  optimizeImagePrompt: PromptEngine.optimize,
  composeBasePrompt: PromptEngine.composeBase,
  getResolution: GeneratorEngine.getResolution,
  upload: GeneratorEngine.upload,
  cacheImage: GeneratorEngine.cacheImage,
  templateVisual: PROMPT_TEMPLATES.builder,
};
