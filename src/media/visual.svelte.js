/**
 * src/media/visual.svelte.js
 * 🎨 VISUAL ENGINE (Reactive Class)
 * The sensory cortex orchestrator. Fully optimized with engine caching and localized JSON peeling.
 */
import { generateSecureSeed } from "@utils";
import { db, entities } from "@data";
import { strip_cognition_blocks } from "@intelligence";
import { AestheticResolver, CircuitBreaker, ExponentialBackoffRetryer, getResolution, NEGATIVE_PROMPT, PromptTemplates } from "@media";
import { llm_service } from "@platform";
import { runtime, simulationState as simulation } from "@state";

// Global cache for the Perchance text-to-image engine function to eliminate runtime lookup overhead
let cachedImageEngine = null;

/**
 * Lazily searches and caches the hosted Perchance text-to-image plugin infrastructure.
 * Safely insulates cross-origin boundary lookups to prevent Same-Origin Policy crashes.
 * @returns {Function | null}
 */
function findImageEngine() {
  if (cachedImageEngine) return cachedImageEngine;
  if (typeof window === "undefined") return null;

  // 1. Check local frame scope immediately
  if (typeof window.pluginTextToImage === "function") {
    cachedImageEngine = window.pluginTextToImage;
    return cachedImageEngine;
  }
  if (typeof window.textToImage === "function") {
    cachedImageEngine = window.textToImage;
    return cachedImageEngine;
  }

  // 2. Insulate cross-origin parent lookups behind a secure fence
  try {
    if (typeof window.parent !== "undefined") {
      if (typeof window.parent.pluginTextToImage === "function") {
        cachedImageEngine = window.parent.pluginTextToImage;
        return cachedImageEngine;
      }
      if (typeof window.parent.textToImage === "function") {
        cachedImageEngine = window.parent.textToImage;
        return cachedImageEngine;
      }
    }
  } catch (_) {
    // Quietly swallow cross-origin access exceptions if parent frame is sandboxed away
  }

  return null;
}

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
        finalPrompt = target.trim(); // Clean raw inputs
      } else if (typeof target === "string") {
        entityId = target;
        /** @type {any} */
        const entity = await this._resolveEntity(entityId);

        const hasPhysical = entity.eternal?.physical || entity.present?.physical;
        if (!entity.modifiers?.prompt && !hasPhysical) {
          console.warn(`[VisualEngine] Bare-name fallback for entity "${entity.name}". No physical attributes defined.`);
          finalPrompt = `${entity.name}, ${AestheticResolver.extract(entity)}`;
        } else {
          finalPrompt = entity.modifiers?.prompt || AestheticResolver.extract(entity) || entity.name;
        }

        /** @type {any} */ (options).type = entity.type || "character"; // Store resolved type
        // Store the entity's custom negative prompt for use in generation
        if (!options.negativePrompt && entity.modifiers?.negative_prompt) {
          /** @type {any} */ (options).negativePrompt = entity.modifiers.negative_prompt;
        }
      } else {
        finalPrompt = String(target);
      }

      // 2. Execute Resilient Generation
      const result = await this.breaker.execute(async () => {
        return await this.retryer.retry(
          async () => {
            const image_engine = findImageEngine();
            if (!image_engine) throw new Error("Image plugin missing");

            const res = getResolution(options.mode);
            const effectiveNegativePrompt = /** @type {any} */ (options).negativePrompt?.trim() || NEGATIVE_PROMPT;
            const effectiveSeed = options.seed ?? generateSecureSeed();
            const effectiveResolution = `${res.width}x${res.height}`;

            const generatePromise = image_engine({
              prompt: finalPrompt,
              negativePrompt: effectiveNegativePrompt,
              seed: effectiveSeed,
              // Map custom resolution parameters directly to the strict string formats expected by Perchance
              resolution: effectiveResolution,
              removeBackground: !!(options.removeBackground ?? options.no_background),
            });

            let timeoutId;
            const timeoutPromise = new Promise((_, reject) => {
              timeoutId = setTimeout(() => reject(new Error("Image generation timed out")), 45000);
            });
            // Catch rejection on the timeout promise itself to prevent unhandled promise rejection warnings
            timeoutPromise.catch(() => {});

            try {
              const data = await Promise.race([generatePromise, timeoutPromise]);

              if (typeof data === "object" && data !== null) {
                if (data.status && data.status !== "success") {
                  throw new Error(`Text-to-image failed: ${data.status}`);
                }
                if (data.error) {
                  throw new Error(`Text-to-image failed: ${data.error}`);
                }
                const img = data.dataUrl || data.url || data.image;
                if (!img) {
                  throw new Error("Text-to-image failed: no image data returned");
                }

                if (options.returnPayload) {
                  return {
                    url: img,
                    metadata: {
                      prompt: finalPrompt,
                      negativePrompt: effectiveNegativePrompt,
                      seed: effectiveSeed,
                      resolution: effectiveResolution,
                    },
                  };
                }
                return img;
              }

              if (options.returnPayload) {
                return {
                  url: data,
                  metadata: {
                    prompt: finalPrompt,
                    negativePrompt: effectiveNegativePrompt,
                    seed: effectiveSeed,
                    resolution: effectiveResolution,
                  },
                };
              }
              return data;
            } finally {
              clearTimeout(timeoutId);
            }
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
        await this._cacheImage(entityId, result, options.type === "user" ? "character" : options.type || "character");
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
   * Refines raw text into structured { prompt, negativePrompt } visual tokens
   * using an internalized Scribe-parsing block to handle logging artifacts safely.
   * @param {string} text
   * @param {string} [type]
   * @returns {Promise<{ prompt: string, negativePrompt: string } | null>}
   */
  async enhance(text, type = "character") {
    return await this.breaker.execute(async () => {
      return await this.retryer.retry(
        async () => {
          const system = PromptTemplates.ENHANCE(text, type);

          const result = await llm_service.generate({ system, messages: [] }, { silent: true });
          if (!result) throw new Error("Prompt enhancement failed - no content.");

          // Internalized structural parse loop
          const parsed = this._parseRefineResponse(result);
          if (parsed) return parsed;

          // Fallback: treat raw result as plain-text prompt only
          const cleanPrompt = this._cleanPrompt(result);
          return cleanPrompt ? { prompt: cleanPrompt, negativePrompt: "" } : null;
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
    const dbKey = typeof storyId === "string" && /^\d+$/.test(storyId) ? Number(storyId) : typeof storyId === "number" ? storyId : null;
    const story = typeof dbKey === "number" && Number.isInteger(dbKey) && dbKey > 0 ? await db.stories.get(dbKey) : runtime.active_story;

    if (!story) {
      console.warn("[VISUALIZE] No active story!");
      return { imageUrl: null, refinedPrompt: null };
    }

    const targetTypeMap = { fractal: "scene", scene: "scene", user: "user", selfie: "selfie" };
    const vTarget = /** @type {any} */ (targetTypeMap)[targetType] || "ai";

    const targetIdMap = { fractal: story.fractal_id, scene: story.fractal_id, user: story.user_id };
    const targetId = /** @type {any} */ (targetIdMap)[targetType] || story.ai_id;
    simulation.start_typing(targetType === "scene" ? "fractal" : targetType || "ai", targetId);

    try {
      const ai = await this._resolveEntity(story.ai_id);
      const user = await this._resolveEntity(story.user_id);
      const fractal = await this._resolveEntity(story.fractal_id);

      const system = PromptTemplates.BUILDER(vTarget, visualPrompt, {
        ai,
        user,
        fractal,
        history: "",
        mode: "visualize",
      });

      const refined = await llm_service.generate(
        {
          system: system,
          messages: [],
        },
        { silent: true },
      );

      if (!refined) return { imageUrl: null, refinedPrompt: null, caption: null };

      const match = refined?.match(/<image_prompt[^>]*>([\s\S]*?)<\/image_prompt>/i);
      const extracted = match?.[1] || refined || "";
      const cleanPrompt = this._cleanPrompt(extracted.replace(/<think>[\s\S]*?<\/think>/gi, ""));

      let caption = null;
      if (vTarget === "selfie") {
        const captionMatch = refined?.match(/<caption\s+text="([^"]+)"/i) || refined?.match(/<caption>([\s\S]*?)<\/caption>/i);
        caption = captionMatch?.[1] || "You wanted a selfie? There you go.";
      }

      const payload = await this.generate(cleanPrompt, { mode: vTarget, returnPayload: true, ...options });
      if (payload && payload.url) {
        return {
          imageUrl: payload.url,
          refinedPrompt: cleanPrompt,
          caption,
          metadata: payload.metadata,
        };
      }
      return { imageUrl: payload, refinedPrompt: cleanPrompt, caption };
    } catch (err) {
      console.error("[VisualEngine] Visualize error:", err);
      return { imageUrl: null, refinedPrompt: null, caption: null };
    } finally {
      simulation.stop_typing();
    }
  }

  /**
   * Triggers manual file upload. Supports native Perchance upload-plugin when hosted,
   * and falls back to a secure HTML5 local file picker with Zero-Trust image checks
   * when running locally or offline.
   * @returns {Promise<string | null>}
   */
  async upload() {
    // Secure local fallback
    try {
      const { validateImage } = await import("@platform/security.js");
      return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";

        input.onchange = async (e) => {
          const file = /** @type {HTMLInputElement} */ (e.target).files?.[0];
          if (!file) {
            resolve(null);
            return;
          }

          try {
            await validateImage(file);
            const reader = new globalThis.FileReader();
            reader.onload = (event) => {
              resolve(/** @type {string} */ (event.target?.result) || null);
            };
            reader.onerror = (err) => {
              console.error("[VisualEngine] Local FileReader error:", err);
              resolve(null);
            };
            reader.readAsDataURL(file);
          } catch (err) {
            console.error("[VisualEngine] Security validation failed:", err);
            resolve(null);
          }
        };

        input.oncancel = () => {
          resolve(null);
        };

        input.click();
      });
    } catch (err) {
      console.error("[VisualEngine] Local fallback initialisation failure:", err);
      return null;
    }
  }

  // --- Private Helpers ---

  /**
   * @param {string} id
   */
  async _resolveEntity(id) {
    return (await entities.get("character", id)) || (await entities.get("fractal", id)) || { name: "Unknown", description: "" };
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
   * Localized JSON isolation peeler to separate incoming text streams flawlessly.
   * @param {string} raw
   * @returns {{ prompt: string, negativePrompt: string } | null}
   */
  _parseRefineResponse(raw) {
    if (!raw || typeof raw !== "string") return null;

    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");

    if (start !== -1 && end !== -1 && end > start) {
      try {
        const parsed = JSON.parse(raw.slice(start, end + 1));
        if (parsed && typeof parsed.prompt === "string") {
          return {
            prompt: parsed.prompt.trim(),
            negativePrompt: typeof parsed.negativePrompt === "string" ? parsed.negativePrompt.trim() : "",
          };
        }
      } catch (_) {
        // Fall through safely
      }
    }
    return null;
  }

  /**
   * @param {string} raw
   */
  _cleanPrompt(raw) {
    if (typeof raw !== "string") return raw;
    return strip_cognition_blocks(raw)
      .replace(/^["']|["']$/g, "")
      .replace(/^(here is|sure|the prompt).*?:/i, "")
      .replace(/```.*?[\r\n]|```/g, "")
      .trim();
  }
}

// Export a singleton instance for global state persistence
export const visual_engine = new VisualEngine();
