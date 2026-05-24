/**
 * src/media/visual-engine.svelte.js
 * 🎨 VISUAL ENGINE (Reactive Class)
 * The sensory cortex orchestrator.
 */
import { llm_service } from "@platform/transport.js";
import { entities } from "@data/repository.js";
import { db } from "@data/db.js";
import { runtime } from "@state/runtime.svelte.js";
import { simulationState as simulation } from "@state/status.svelte.js";
import { generateSecureSeed } from "@ui/components/render-helpers.js";
import { ExponentialBackoffRetryer, CircuitBreaker } from "@media/resilience.js";
import { getResolution, NEGATIVE_PROMPT } from "@media/optics.js";

/**
 *
 */
export class VisualEngine {
  // --- Reactive State (Runes) ---
  isLoading = $state(false);
  /** @type {string | null} */
  error = $state(null);
  attempts = $state(0);
  isOffline = $state(false); // Circuit breaker status

  /**
   *
   */
  constructor() {
    this.retryer = new ExponentialBackoffRetryer({
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 10000,
    });
    this.breaker = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      recoveryTimeout: 30000,
    });
  }

  /**
   * Primary high-level generation pipeline.
   * Handles character resolution, prompt optimization, and resilient generation.
   * @param {string} target
   * @param {any} [options]
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
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target);

      if (typeof target === "string" && !isUuid) {
        finalPrompt = target; // Direct prompt
      } else if (typeof target === "string") {
        entityId = target;
        /** @type {any} */
        const entity = await this._resolveEntity(entityId);

        // PRIORITY: Use user-edited prompt if available.
        // Fallback to name ONLY for the engine's final generation path.
        finalPrompt = entity.modifiers?.prompt || entity.name;

        /** @type {any} */ (options).type = entity.type || "character"; // Store resolved type
      } else {
        finalPrompt = String(target);
      }

      // 2. Execute Resilient Generation
      const result = await this.breaker.execute(async () => {
        return await this.retryer.retry(
          async () => {
            // @ts-ignore
            if (!window.pluginTextToImage) throw new Error("Image plugin missing");

            const res = getResolution(options.mode);
            // @ts-ignore
            const data = await window.pluginTextToImage({
              prompt: finalPrompt,
              negativePrompt: NEGATIVE_PROMPT,
              seed: options.seed ?? generateSecureSeed(),
              width: options.width || res.width,
              height: options.height || res.height,
              removeBackground: !!(options.removeBackground ?? options.no_background),
            });

            return typeof data === "object" && data !== null
              ? data.dataUrl || data.url || data.image || data
              : data;
          },
          (/** @type {number} */ attempt) => {
            this.attempts = attempt;
            console.warn(`[VisualEngine] Retry attempt ${attempt}...`);
          },
        );
      });

      // 3. Persistence & State Sync
      this.isOffline = this.breaker.isOpen;

      if (result && entityId && !options.noCache) {
        await this._cacheImage(
          entityId,
          result,
          options.type === "user" ? "character" : options.type || "character",
        );
      }

      return result;
    } catch (err) {
      const error = /** @type {Error} */ (err);
      this.error = error.message;
      this.isOffline = this.breaker.isOpen;
      console.error("[VisualEngine] Service Failure:", error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Translates text into enhanced visual tokens.
   * @param {string} text
   */
  async enhance(text) {
    return await this.breaker.execute(async () => {
      return await this.retryer.retry(
        async () => {
          const system = `[SYSTEM: CINEMATOGRAPHY_DIRECTOR] Translate into a single descriptive paragraph: ${text}`;

          const result = await llm_service.generate({ system, messages: [] }, { silent: true });
          if (!result) throw new Error("Prompt enhancement failed - no content.");

          return this._cleanPrompt(result);
        },
        (/** @type {number} */ attempt) => {
          console.warn(`[VisualEngine] Enhancement retry ${attempt}...`);
        },
      );
    });
  }

  /**
   * Comprehensive visualization for narrative events.
   * @param {string} storyId
   * @param {string} visualPrompt
   * @param {any} [targetType]
   * @param {any} [options]
   */
  async visualize(storyId, visualPrompt, targetType, options = {}) {
    /** @type {any} */
    const story = /** @type {any} */ (runtime.simulation)?.story?.by_id?.[storyId];
    if (!story) return { imageUrl: null, refinedPrompt: null };

    const targetTypeMap = { fractal: "scene", scene: "scene", user: "user" };
    const vTarget = /** @type {any} */ (targetTypeMap)[targetType] || "ai";

    const targetIdMap = { fractal: story.fractal_id, scene: story.fractal_id, user: story.user_id };
    const targetId = /** @type {any} */ (targetIdMap)[targetType] || story.ai_id;
    simulation.start_typing(targetType === "scene" ? "fractal" : targetType || "ai", targetId);

    try {
      const system = `[SYSTEM: SENSORY_CORTEX] Target: ${vTarget}. Convert intent into an image prompt: "${visualPrompt}"`;

      const refined = await llm_service.generate(
        {
          system: system,
          messages: [],
        },
        { silent: true },
      );

      if (!refined) return { imageUrl: null, refinedPrompt: null };

      const cleanPrompt = this._cleanPrompt(
        refined
          ?.replace(/<think>[\s\S]*?<\/think>/gi, "")
          .replace(/<image_prompt[^>]*>|<\/image_prompt>/gi, ""),
      );

      const imageUrl = await this.generate(cleanPrompt, { mode: vTarget, ...options });
      return { imageUrl, refinedPrompt: cleanPrompt };
    } catch {
      return { imageUrl: null, refinedPrompt: null };
    } finally {
      simulation.stop_typing();
    }
  }

  /**
   * Triggers manual file upload using Perchance upload-plugin.
   * @returns {Promise<string | null>}
   */
  async upload() {
    // @ts-ignore
    if (!window.pluginUpload) return null;
    return new Promise((resolve) => {
      try {
        // @ts-ignore
        window.pluginUpload((dataUrl) => {
          resolve(dataUrl || null);
        });
      } catch (err) {
        console.error("[VisualEngine] Upload failure:", err);
        resolve(null);
      }
    });
  }

  // --- Private Helpers ---

  /**
   * @param {string} id
   */
  async _resolveEntity(id) {
    return (
      (await entities.get("character", id)) ||
      (await entities.get("fractal", id)) || { name: "Unknown", description: "" }
    );
  }

  /**
   * @param {string} id
   * @param {any} data
   * @param {'character' | 'fractal' | 'story'} type
   */
  async _cacheImage(id, data, type = "character") {
    await db.entities.update(id, { profile_picture: data, updated_at: Date.now() });
    await runtime.update_entity(type, id, { profile_picture: data });
  }

  /**
   * @param {string} raw
   */
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
