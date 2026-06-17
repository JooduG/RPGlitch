/**
 * src/media/visual-engine.svelte.js
 * 🎨 VISUAL ENGINE (Reactive Class)
 * The sensory cortex orchestrator.
 */
import { generateSecureSeed } from "@utils";
import { db, entities } from "@data";
import { strip_cognition_blocks } from "@intelligence/parser.js";
import { AestheticResolver, CircuitBreaker, ExponentialBackoffRetryer, getResolution, NEGATIVE_PROMPT, PromptTemplates } from "@media";
import { llm_service } from "@platform";
import { runtime, simulationState as simulation } from "@state";

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

        finalPrompt = entity.modifiers?.prompt || AestheticResolver.extract(entity) || entity.name;

        /** @type {any} */ (options).type = entity.type || "character"; // Store resolved type
      } else {
        finalPrompt = String(target);
      }

      // 2. Execute Resilient Generation
      const result = await this.breaker.execute(async () => {
        return await this.retryer.retry(
          async () => {
            // Resolve the text-to-image plugin function
            const get_image_engine = () => {
              if (typeof window === "undefined") return null;
              try {
                if (typeof window.pluginTextToImage === "function") return window.pluginTextToImage;
              } catch (_e) {
                /* ignore */
              }
              try {
                if (typeof window.textToImage === "function") return window.textToImage;
              } catch (_e) {
                /* ignore */
              }
              try {
                if (window.parent && typeof window.parent.pluginTextToImage === "function") return window.parent.pluginTextToImage;
              } catch (_e) {
                /* ignore */
              }
              try {
                if (window.parent && typeof window.parent.textToImage === "function") return window.parent.textToImage;
              } catch (_e) {
                /* ignore */
              }
              try {
                const lexical = eval("typeof textToImage !== 'undefined' ? textToImage : undefined");
                if (typeof lexical === "function") return lexical;
              } catch (_e) {
                /* ignore */
              }
              return null;
            };

            const image_engine = get_image_engine();
            if (!image_engine) throw new Error("Image plugin missing");

            const res = getResolution(options.mode);
            const generatePromise = image_engine({
              prompt: finalPrompt,
              negativePrompt: NEGATIVE_PROMPT,
              seed: options.seed ?? generateSecureSeed(),
              width: options.width || res.width,
              height: options.height || res.height,
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
                return img;
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
   * Translates text into enhanced visual tokens.
   * @param {string} text
   * @param {string} [type]
   */
  async enhance(text, type = "character") {
    return await this.breaker.execute(async () => {
      return await this.retryer.retry(
        async () => {
          const system = PromptTemplates.ENHANCE(text, type);

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
    console.log("[VISUALIZE] storyId arg:", storyId);
    console.log("[VISUALIZE] runtime.story_id:", runtime.story_id);
    console.log("[VISUALIZE] runtime.active_story:", runtime.active_story);

    const story = runtime.active_story;

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

      const imageUrl = await this.generate(cleanPrompt, { mode: vTarget, ...options });
      return { imageUrl, refinedPrompt: cleanPrompt, caption };
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
    let hasUploadPlugin = false;
    try {
      if (typeof window !== "undefined" && typeof window.pluginUpload === "function") hasUploadPlugin = true;
    } catch (_e) {
      /* ignore */
    }

    if (hasUploadPlugin) {
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
