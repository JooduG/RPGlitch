/**
 * src/media/visual-engine.svelte.js
 * 🎨 VISUAL ENGINE (Reactive Class)
 * The sensory cortex orchestrator.
 */
import { llm_service } from "@core/intelligence/llm-service.js";
import { context_broker } from "@core/intelligence/context-broker.js";
import { entities } from "@data/repository.js";
import { db } from "@data/db.js";
import { runtime } from "@state/runtime.svelte.js";
import { simulationState as simulation } from "@state/status.svelte.js";
import { generateSecureSeed } from "@ui/utils/helpers.js";
import { ExponentialBackoffRetryer, CircuitBreaker } from "./resilience.js";
import { AestheticResolver, PromptTemplates, getResolution, NEGATIVE_PROMPT } from "./optics.js";

export class VisualEngine {
  // --- Reactive State (Runes) ---
  isLoading = $state(false);
  error = $state(null);
  attempts = $state(0);
  isOffline = $state(false); // Circuit breaker status

  constructor() {
    this.retryer = new ExponentialBackoffRetryer({ maxAttempts: 3 });
    this.breaker = new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 30000,
    });
  }

  /**
   * Primary high-level generation pipeline.
   * Handles character resolution, prompt optimization, and resilient generation.
   */
  async generate(target, options = {}) {
    this.isLoading = true;
    this.error = null;
    this.attempts = 0;
    this.isOffline = this.breaker.isOpen;

    try {
      let finalPrompt = "";
      let entityId = null;

      // 1. Resolve Target & Prompt
      if (typeof target === "string" && target.length > 100) {
        finalPrompt = target; // Direct prompt
      } else if (typeof target === "string") {
        entityId = target;
        const entity = await this._resolveEntity(entityId);
        finalPrompt = await this.optimize(entity.description || entity.name, {
          physical: entity.description,
        });
      } else {
        finalPrompt = String(target);
      }

      // 2. Execute Resilient Generation
      const result = await this.breaker.execute(async () => {
        return await this.retryer.retry(
          async () => {
            if (!window.pluginTextToImage) throw new Error("Image plugin missing");

            const res = getResolution(options.mode);
            const data = await window.pluginTextToImage({
              prompt: finalPrompt,
              negativePrompt: NEGATIVE_PROMPT,
              seed: options.seed ?? generateSecureSeed(),
              width: options.width || res.width,
              height: options.height || res.height,
            });

            return data?.dataUrl || data;
          },
          (attempt) => {
            this.attempts = attempt;
            console.warn(`[VisualEngine] Retry attempt ${attempt}...`);
          },
        );
      });

      // 3. Persistence
      if (result && entityId && !options.noCache) {
        await this._cacheImage(entityId, result);
      }

      return result;
    } catch (err) {
      this.error = err.message;
      this.isOffline = this.breaker.isOpen;
      console.error("[VisualEngine] Service Failure:", err);
      throw err;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Translates character descriptions into optimized visual tokens.
   */
  async optimize(text, context = {}) {
    const optics = AestheticResolver.resolve(context);
    const system = PromptTemplates.OPTIMIZE(text, optics);

    const result = await llm_service.generate({ system, messages: [] }, { silent: true });
    return this._cleanPrompt(result);
  }

  /**
   * Comprehensive visualization for narrative events.
   */
  async visualize(storyId, visualPrompt, targetType, options = {}) {
    const story = runtime.story.byId[storyId];
    if (!story) return { imageUrl: null, refinedPrompt: null };

    const targetTypeMap = { fractal: "scene", scene: "scene", user: "user" };
    const vTarget = targetTypeMap[targetType] || "ai";

    simulation.start_typing(targetType || "ai", story.aiId);

    try {
      const hydrated = await context_broker.hydrate("", "image");
      const optics = AestheticResolver.resolve({ physical: visualPrompt });
      const context = {
        ai: hydrated.entities.AI,
        user: hydrated.entities.USER,
        fractal: hydrated.entities.FRACTAL,
        history: "",
        mode: "visualize"
      };
      const system = PromptTemplates.BUILDER(vTarget, visualPrompt, context, optics);

      const refined = await llm_service.generate(
        {
          system: system + `\n<RAW_INTENT>\n${visualPrompt}\n</RAW_INTENT>`,
        },
        { silent: true },
      );

      const cleanPrompt = refined
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .replace(/<image_prompt[^>]*>|<\/image_prompt>/gi, "")
        .trim();

      const imageUrl = await this.generate(cleanPrompt, { mode: vTarget });
      return { imageUrl, refinedPrompt: cleanPrompt };
    } catch (err) {
      return { imageUrl: null, refinedPrompt: null };
    } finally {
      simulation.stop_typing();
    }
  }

  async upload(file) {
    if (!window.pluginUpload) return null;
    return await window.pluginUpload(file);
  }

  // --- Private Helpers ---

  async _resolveEntity(id) {
    return (
      (await entities.get("character", id)) ||
      (await entities.get("user", id)) ||
      (await entities.get("fractal", id)) || { name: "Unknown", description: "" }
    );
  }

  async _cacheImage(id, data) {
    await db.entities.update(id, { profile_picture: data, updatedAt: Date.now() });
    await runtime.updateEntity("character", id, { profile_picture: data });
  }

  _cleanPrompt(raw) {
    if (typeof raw !== "string") return raw;
    return raw
      .replace(/^["']|["']$/g, "")
      .replace(/^(here is|sure|the prompt).*?:/i, "")
      .replace(/```.*?[\r\n]|```/g, "")
      .trim();
  }
}

// Export a singleton instance for global state persistence
export const visual_engine = new VisualEngine();
