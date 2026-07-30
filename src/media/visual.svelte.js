/**
 * src/media/visual.svelte.js
 * 🎨 VISUAL ENGINE (Reactive Class)
 * The sensory cortex orchestrator. Fully optimized with engine caching and localized JSON peeling.
 */

import { db, detox_prose, entities } from "@data";
import { generate_secure_seed as generateSecureSeed, strip_cognition_blocks, state_bridge } from "@utils";
import { llm_service, sanitize_llm } from "@platform";
import {
  AestheticResolver,
  get_resolution,
  NEGATIVE_PROMPT,
  PromptTemplates,
  resolve_portrait_visual_style_key,
  resolve_story_visual_style_key,
  resolve_visual_engine_tokens,
} from "./optics.js";
import { CircuitBreaker, ExponentialBackoffRetryer } from "./resilience.js";

// Global cache for the Perchance text-to-image engine function to eliminate runtime lookup overhead
let cached_image_engine = null;

/**
 * Lazily searches and caches the hosted Perchance text-to-image plugin infrastructure.
 * Safely insulates cross-origin boundary lookups to prevent Same-Origin Policy crashes.
 * @returns {Function | null}
 */
function find_image_engine() {
  if (cached_image_engine) return cached_image_engine;
  if (typeof window === "undefined") return null;

  // 1. Check local frame scope immediately
  if (typeof window.pluginGenerateImage === "function") {
    cached_image_engine = window.pluginGenerateImage;
    return cached_image_engine;
  }
  if (typeof window.generate_image === "function") {
    cached_image_engine = window.generate_image;
    return cached_image_engine;
  }

  // 2. Insulate cross-origin parent lookups behind a secure fence
  try {
    if (typeof window.parent !== "undefined") {
      if (typeof window.parent.pluginGenerateImage === "function") {
        cached_image_engine = window.parent.pluginGenerateImage;
        return cached_image_engine;
      }
      if (typeof window.parent.generate_image === "function") {
        cached_image_engine = window.parent.generate_image;
        return cached_image_engine;
      }
    }
  } catch (_) {
    // Quietly swallow cross-origin access exceptions if parent frame is sandboxed away
  }

  return null;
}

export class VisualEngine {
  // --- Reactive State (Svelte 5 Runes) ---
  isLoading = $state(false);
  /** @type {string | null} */
  error = $state(null);
  attempts = $state(0);
  isOffline = $state(false);

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
   * @returns {Promise<any>}
   */
  async generate(target, options = {}) {
    this.isLoading = true;
    this.error = null;
    this.attempts = 0;

    // Auto-recover circuit breaker for user-initiated requests.
    // Image generation is always explicitly triggered by the user, so we
    // should never permanently block them — just let the retryer handle
    // transient failures.
    if (this.breaker.isOpen) {
      this.breaker.state = "HALF_OPEN";
      this.breaker.successCount = 0;
    }
    this.isOffline = this.breaker.isOpen;

    try {
      let final_prompt = "";
      let entity_id = null;

      // 1. Resolve Target & Prompt
      const is_uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target);

      if (typeof target === "string" && !is_uuid) {
        final_prompt = target.trim();
      } else if (typeof target === "string") {
        entity_id = target;
        const entity = await this._resolveEntity(entity_id);

        const has_physical = entity.eternal?.physical || entity.present?.physical;
        if (!entity.modifiers?.prompt && !has_physical) {
          console.warn(`[VisualEngine] Bare-name fallback for entity "${entity.name}". No physical attributes defined.`);
          const tags = Array.isArray(entity.tags) ? entity.tags.join(", ") : "";
          const non_physical = [entity.eternal?.non_physical, entity.present?.non_physical]
            .filter(Boolean)
            .map((s) => String(s).slice(0, 150))
            .join(", ");
          const fallback_features = [tags, non_physical].filter(Boolean).join(", ");
          final_prompt = `${entity.name}${fallback_features ? `, ${fallback_features}` : ""}, ${AestheticResolver.flatten(entity)}`;
        } else {
          final_prompt = entity.modifiers?.prompt || AestheticResolver.flatten(entity) || entity.name;
        }

        options.type = entity.type || "character";
        if (!options._entity) options._entity = entity;
        if (!options.negative_prompt && entity.modifiers?.negative_prompt) {
          options.negative_prompt = entity.modifiers.negative_prompt;
        }
      } else {
        final_prompt = String(target);
      }

      // 1.1 Empty Prompt Safeguard
      if (!final_prompt || !final_prompt.trim()) {
        console.warn("[VisualEngine] Empty visual prompt detected. Synthesizing generic aesthetic prompt.");
        final_prompt = "professional portrait configuration, sharp details, high-end studio layout, realistic textures";
      }

      // 1.2 Perchance Curly-Bracket Sanitization
      final_prompt = final_prompt.replace(/[{}]/g, "");

      // 2. Execute Resilient Generation
      const result = await this.breaker.execute(async () => {
        return await this.retryer.retry(
          async () => {
            const image_engine = find_image_engine();
            if (!image_engine) {
              const is_mockable =
                typeof window !== "undefined" &&
                !(typeof process !== "undefined" && process.env.VITEST) &&
                (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || import.meta.env.DEV);

              if (is_mockable) {
                console.warn("[VisualEngine] Image plugin not found. Synthesizing local mock preview image.");
                return this._mock_generate(final_prompt, options);
              }
              throw new Error("Image plugin missing");
            }

            const res = get_resolution(options.mode);
            const base_negative_prompt = options.negative_prompt?.trim() || "";
            // If _entity is provided (profile editor), use portrait resolver.
            // Otherwise (storymode via visualize), use story resolver (fractal's style).
            const style_key = options._entity ? resolve_portrait_visual_style_key(options._entity) : resolve_story_visual_style_key();
            const vs_tokens = resolve_visual_engine_tokens(style_key);

            // Inject positive style tokens into the prompt if available
            const vs_positive = [vs_tokens.medium, vs_tokens.palette, vs_tokens.camera || vs_tokens.composition, vs_tokens.texture]
              .filter(Boolean)
              .join(", ");
            if (vs_positive && style_key !== "none" && !final_prompt.includes(vs_tokens.medium || "\x00")) {
              final_prompt = `${vs_positive}, ${final_prompt}`;
            }

            const entity_type = options.type || options.mode || "character";
            const is_character_shot =
              ["character", "ai", "user", "selfie", "portrait", "characters", "prologue"].includes(entity_type) ||
              options.mode === "prologue" ||
              options.mode === "characters";
            const char_neg_tokens = is_character_shot
              ? "empty background, landscape without characters, scenery only, no humans, empty environment"
              : "";
            const vs_neg = style_key !== "none" ? vs_tokens.negative_prompt || "" : "";
            const raw_neg_sources = [base_negative_prompt, vs_neg, char_neg_tokens, NEGATIVE_PROMPT].filter(Boolean).join(", ");
            const deduplicated_neg_tokens = Array.from(
              new Set(
                raw_neg_sources
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              ),
            );
            const effective_negative_prompt = deduplicated_neg_tokens.join(", ");
            const effective_seed = options.seed ?? generateSecureSeed();
            const effective_resolution = `${res.width}x${res.height}`;
            const effective_guidance_scale = options.guidanceScale ?? (is_character_shot ? 9 : 7);

            const generate_promise = image_engine({
              prompt: final_prompt,
              negativePrompt: effective_negative_prompt,
              seed: effective_seed,
              resolution: effective_resolution,
              removeBackground: !!(options.removeBackground ?? options.no_background),
              guidanceScale: effective_guidance_scale,
            });

            let timeoutId;
            const timeout_promise = new Promise((_, reject) => {
              timeoutId = setTimeout(() => reject(new Error("Image generation timed out")), 120000);
            });
            timeout_promise.catch(() => {});

            try {
              const data = await Promise.race([generate_promise, timeout_promise]);

              if (typeof data === "object" && data !== null) {
                if (data.status && data.status !== "success") {
                  throw new Error(`Text-to-image failed: ${data.status}`);
                }
                if (data.error) {
                  throw new Error(`Text-to-image failed: ${data.error}`);
                }
                const img =
                  typeof data === "string" || data instanceof String
                    ? data.valueOf()
                    : data.dataUrl || data.data_url || data.url || data.image || data.src || data.href || null;
                if (!img) {
                  throw new Error("Text-to-image failed: no image data returned");
                }

                if (options.returnPayload) {
                  return {
                    url: img,
                    metadata: {
                      prompt: final_prompt,
                      negative_prompt: effective_negative_prompt,
                      seed: effective_seed,
                      resolution: effective_resolution,
                      guidanceScale: effective_guidance_scale,
                      mode: options.mode,
                    },
                  };
                }
                return img;
              }

              if (options.returnPayload) {
                return {
                  url: data,
                  metadata: {
                    prompt: final_prompt,
                    negative_prompt: effective_negative_prompt,
                    seed: effective_seed,
                    resolution: effective_resolution,
                    guidanceScale: effective_guidance_scale,
                    mode: options.mode,
                  },
                };
              }
              return data;
            } finally {
              clearTimeout(timeoutId);
            }
          },
          (attempt) => {
            this.attempts = attempt;
            console.warn(`[VisualEngine] Retry attempt ${attempt}...`);
          },
        );
      });

      // 3. Persistence & State Sync
      this.isOffline = this.breaker.isOpen;

      if (result && entity_id && !options.noCache) {
        await this._cacheImage(entity_id, result, options.type === "user" ? "character" : options.type || "character");
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
   * Refines raw text into structured { prompt, negative_prompt } visual tokens.
   * @param {string} text
   * @param {string} [type]
   * @param {any} [entity]
   * @returns {Promise<{ prompt: string, negative_prompt: string } | null>}
   */
  async enhance(text, type = "character", entity = null) {
    return await this.breaker.execute(async () => {
      return await this.retryer.retry(
        async () => {
          const system = PromptTemplates.ENHANCE(text, type, entity);

          const result = await llm_service.generate({ system, messages: [] }, { silent: true });
          if (!result) throw new Error("Prompt enhancement failed - no content.");

          const parsed = this._parseRefineResponse(result);
          if (parsed) return parsed;

          const clean_prompt = this._cleanPrompt(result);
          return clean_prompt ? { prompt: clean_prompt, negative_prompt: "" } : null;
        },
        (attempt) => {
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
   * @returns {Promise<{ imageUrl: any, refinedPrompt: string | null, caption: string | null, metadata?: any }>}
   */
  async visualize(storyId, visualPrompt, targetType, options = {}) {
    const { silent = false } = options;
    let story = null;

    // Defensive: strip cognition blocks from any narrative text passed as visual prompt.
    // Prologue/epilogue responses contain <think> blocks that must not leak into the image LLM system prompt.
    if (typeof visualPrompt === "string") {
      visualPrompt = strip_cognition_blocks(visualPrompt);
    }

    if (storyId) {
      const db_key = typeof storyId === "string" && /^\d+$/.test(storyId) ? Number(storyId) : storyId;
      try {
        story = await db.stories.get(db_key);
      } catch (_) {
        /* ignore */
      }
    }
    if (!story && state_bridge.runtime.active_story) {
      story = state_bridge.runtime.active_story;
    }
    if (!story) {
      story = {
        ai_id: state_bridge.runtime.active_ai?.id || state_bridge.app.selected_ai?.id,
        user_id: state_bridge.runtime.active_user?.id || state_bridge.app.selected_user?.id,
        fractal_id: state_bridge.runtime.active_fractal?.id || state_bridge.app.selected_fractal?.id,
      };
    }

    const target_type_map = { ai: "ai", fractal: "fractal", user: "user", selfie: "selfie", characters: "characters" };
    const v_target = target_type_map[targetType] || "character";

    const target_id_map = { ai: story.ai_id, fractal: story.fractal_id, scene: story.fractal_id, user: story.user_id };
    const target_id = target_id_map[targetType] || story.ai_id;

    if (!silent) {
      state_bridge.simulation_state.start_typing(targetType === "fractal" || targetType === "characters" ? "fractal" : targetType || "ai", target_id);
    }

    try {
      const ai = await this._resolveEntity(story.ai_id);
      const user = await this._resolveEntity(story.user_id);
      const fractal = await this._resolveEntity(story.fractal_id);

      const system = PromptTemplates.BUILDER(v_target, visualPrompt, {
        ai,
        user,
        fractal,
        history: "",
        mode: "visualize",
      });

      let refined = null;
      try {
        const extraction_timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("LLM prompt extraction timed out")), 90000));
        refined = await Promise.race([llm_service.generate({ system, messages: [] }, { silent: true }), extraction_timeout]);
      } catch (extractErr) {
        console.warn("[VisualEngine] visualize: LLM prompt extraction failed, using fallback:", extractErr.message);
      }

      if (!refined) {
        console.warn("[VisualEngine] visualize: LLM returned empty/null, synthesizing fallback prompt.");
        const fallback_entity = v_target === "user" ? user : v_target === "fractal" || v_target === "characters" ? fractal : ai;
        const fallback_desc = AestheticResolver.flatten(fallback_entity);
        const fallback_name = fallback_entity?.name || v_target;
        const short_intent = visualPrompt && visualPrompt.length < 200 ? visualPrompt : "";
        refined = `<image_prompt>${short_intent ? `${short_intent}, ` : ""}${fallback_name}, ${fallback_desc || "detailed character portrait, dramatic lighting"}</image_prompt>`;
      }

      const parsed_json = this._parseRefineResponse(refined);
      let clean_prompt;
      let extracted_negative = null;

      if (parsed_json) {
        clean_prompt = this._cleanPrompt(strip_cognition_blocks(parsed_json.prompt));
        extracted_negative = parsed_json.negative_prompt || null;
      } else {
        const match = refined?.match(/<image_prompt[^>]*>([\s\S]*?)<\/image_prompt>/i);
        const extracted = match?.[1] || refined || "";
        clean_prompt = this._cleanPrompt(strip_cognition_blocks(extracted));
      }

      if ((!clean_prompt || clean_prompt.length < 10) && (v_target === "fractal" || v_target === "characters")) {
        const fractal_desc = AestheticResolver.flatten(fractal);
        clean_prompt = `RAW photograph or structured artistic rendering of ${fractal?.name || "an environment"}, ${fractal_desc || "high architectural definition, crisp spatial depth details, professional landscape layout alignment"}`;
      }

      let caption = null;
      if (v_target === "selfie") {
        const caption_match = refined?.match(/<caption\s+text="([^"]+)"/i) || refined?.match(/<caption>([\s\S]*?)<\/caption>/i);
        caption = caption_match?.[1] || "You wanted a selfie? There you go.";
      }

      const generate_options = { mode: v_target, returnPayload: true, ...options };
      if (extracted_negative && !generate_options.negative_prompt) {
        generate_options.negative_prompt = extracted_negative;
      }
      const payload = await this.generate(clean_prompt, generate_options);

      const effective_metadata =
        typeof payload === "object" && payload?.metadata ? { ...payload.metadata, prompt: clean_prompt } : { prompt: clean_prompt, mode: v_target };

      if (payload && payload.url) {
        return {
          imageUrl: payload.url,
          refinedPrompt: clean_prompt,
          caption,
          metadata: effective_metadata,
        };
      }
      return {
        imageUrl: typeof payload === "string" ? payload : payload?.url || null,
        refinedPrompt: clean_prompt,
        caption,
        metadata: effective_metadata,
      };
    } catch (err) {
      console.error("[VisualEngine] Visualize error:", err);
      return { imageUrl: null, refinedPrompt: null, caption: null };
    } finally {
      if (!silent) state_bridge.simulation_state.stop_typing();
    }
  }

  /**
   * Generates N image candidates concurrently with the same prompt but different seeds.
   * Retries failures until at least `min_success` candidates succeed.
   * @param {string} prompt - The (already refined) image prompt.
   * @param {{ mode?: string, negative_prompt?: string, count?: number, min_success?: number, resolution?: string }} options
   * @returns {Promise<Array<{ url: string, metadata: any }>>}
   */
  async generate_candidates(prompt, options = {}) {
    const count = options.count ?? 3;
    const min_success = options.min_success ?? 2;
    const base_opts = {
      mode: options.mode || "character",
      negative_prompt: options.negative_prompt,
      returnPayload: true,
    };

    /** @type {Array<{ url: string, metadata: any } | null>} */
    const results = new Array(count).fill(null);

    // Fire all generations concurrently
    const attempts = [];
    for (let i = 0; i < count; i++) {
      attempts.push(
        this.generate(prompt, { ...base_opts })
          .then((payload) => {
            if (payload?.url) return { index: i, payload };
            return { index: i, payload: null };
          })
          .catch(() => ({ index: i, payload: null })),
      );
    }
    const settled = await Promise.all(attempts);
    for (const s of settled) {
      if (s.payload) results[s.index] = s.payload;
    }

    // Retry failures until we have at least min_success
    const get_success_count = () => results.filter((r) => r !== null).length;
    let retry_round = 0;
    while (get_success_count() < min_success && retry_round < 3) {
      const failed_indices = results.map((r, i) => (r === null ? i : -1)).filter((i) => i >= 0);
      const retries = failed_indices.map((i) =>
        this.generate(prompt, { ...base_opts })
          .then((payload) => ({ index: i, payload }))
          .catch(() => ({ index: i, payload: null })),
      );
      const retry_results = await Promise.all(retries);
      for (const r of retry_results) {
        if (r.payload?.url) results[r.index] = r.payload;
      }
      retry_round++;
    }

    return results.filter((r) => r !== null);
  }

  /**
   * Generates an aesthetic SVG data URL for local dev & mock testing when image plugin is missing.
   * @param {string} prompt
   * @param {any} [options]
   * @returns {any}
   */
  _mock_generate(prompt, options = {}) {
    const res = get_resolution(options.mode);
    const width = res.width || 768;
    const height = res.height || 512;
    const is_scene = options.mode === "fractal" || options.mode === "landscape";
    const label = is_scene ? "SCENE PREVIEW" : "ENTITY PREVIEW";
    const clean_p = String(prompt || "")
      .substring(0, 50)
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${is_scene ? "#0f172a" : "#18181b"}"/>
          <stop offset="50%" stop-color="${is_scene ? "#1e1b4b" : "#09090b"}"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <circle cx="${width / 2}" cy="${height / 2 - 20}" r="60" fill="none" stroke="#a855f7" stroke-width="2" opacity="0.3"/>
      <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="#c084fc" font-family="sans-serif" font-size="22" font-weight="bold">${label}</text>
      <text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14">${clean_p}...</text>
    </svg>`;
    const data_url = `data:image/svg+xml;base64,${btoa(svg)}`;
    if (options.returnPayload) {
      return {
        url: data_url,
        metadata: {
          prompt,
          negative_prompt: options.negative_prompt || NEGATIVE_PROMPT,
          seed: options.seed || 12345,
          resolution: `${width}x${height}`,
          guidanceScale: 7,
        },
      };
    }
    return data_url;
  }

  /**
   * Triggers manual file upload via Zero-Trust image checks with automatic canvas compression.
   * Downscales large images (up to 25MB) to max 1024px to prevent IndexedDB storage exhaustion.
   * @param {Object} [options]
   * @param {number} [options.max_dimension=1024]
   * @param {number} [options.quality=0.85]
   * @returns {Promise<string | null>}
   */
  async upload(options = {}) {
    const max_dimension = options.max_dimension || 1024;
    const quality = options.quality || 0.85;

    try {
      return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/jpeg,image/png,image/webp,image/gif,image/avif";

        input.onchange = async (e) => {
          const file = /** @type {HTMLInputElement} */ (e.target).files?.[0];
          if (!file) {
            resolve(null);
            return;
          }

          try {
            const { validate_image } = await import("@platform/security.js");
            await validate_image(file, { max_size: 25 * 1024 * 1024 });

            const reader = new globalThis.FileReader();
            reader.onload = (event) => {
              const raw_data_url = /** @type {string} */ (event.target?.result);
              if (!raw_data_url) {
                resolve(null);
                return;
              }

              // Create HTML Image element for canvas compression
              const img = new Image();
              img.onload = () => {
                try {
                  let width = img.width;
                  let height = img.height;

                  if (width > max_dimension || height > max_dimension) {
                    if (width > height) {
                      height = Math.round((height * max_dimension) / width);
                      width = max_dimension;
                    } else {
                      width = Math.round((width * max_dimension) / height);
                      height = max_dimension;
                    }
                  }

                  const canvas = document.createElement("canvas");
                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext("2d");
                  if (!ctx) {
                    resolve(raw_data_url);
                    return;
                  }

                  ctx.drawImage(img, 0, 0, width, height);
                  const compressed_data_url = canvas.toDataURL("image/webp", quality);
                  resolve(compressed_data_url || raw_data_url);
                } catch (canvasErr) {
                  console.warn("[VisualEngine] Canvas compression fallback:", canvasErr);
                  resolve(raw_data_url);
                }
              };
              img.onerror = (imgErr) => {
                console.error("[VisualEngine] Image loading error:", imgErr);
                resolve(raw_data_url);
              };
              img.src = raw_data_url;
            };
            reader.onerror = (err) => {
              console.error("[VisualEngine] Local FileReader error:", err);
              if (state_bridge.app) state_bridge.app.log("Upload failed: Could not read file.", "error");
              resolve(null);
            };
            reader.readAsDataURL(file);
          } catch (err) {
            const msg = /** @type {Error} */ (err).message || String(err);
            console.error("[VisualEngine] Security validation failed:", msg);
            if (state_bridge.app) state_bridge.app.log(`Upload failed: ${msg}`, "error");
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
   * @returns {Promise<any>}
   */
  async _resolveEntity(id) {
    if (!id) return { name: "Unknown", description: "" };
    return (await entities.get("character", id)) || (await entities.get("fractal", id)) || { name: "Unknown", description: "" };
  }

  /**
   * @param {string} id
   * @param {any} data
   * @param {'character' | 'fractal' | 'story'} type
   */
  async _cacheImage(id, data, type = "character") {
    await db.entities.update(id, { profile_picture: data, updated_at: Date.now() });
    await state_bridge.runtime.update_entity(type, id, { profile_picture: data });
  }

  /**
   * Localized JSON isolation peeler to separate incoming text streams.
   * @param {string} raw
   * @returns {{ prompt: string, negative_prompt: string } | null}
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
            negative_prompt: typeof parsed.negative_prompt === "string" ? parsed.negative_prompt.trim() : "",
          };
        }
      } catch (parseErr) {
        console.warn(
          "[VisualEngine._parseRefineResponse] JSON.parse failed:",
          parseErr.message,
          "raw slice:",
          raw.slice(start, Math.min(start + 200, end + 1)),
        );
      }
    }
    return null;
  }

  /**
   * @param {string} raw
   * @returns {string}
   */
  _cleanPrompt(raw) {
    if (typeof raw !== "string") return raw;
    let cleaned = sanitize_llm(strip_cognition_blocks(raw));
    if (cleaned.includes("{")) {
      const prompt_match = cleaned.match(/"prompt"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
      if (prompt_match && prompt_match[1]) {
        cleaned = prompt_match[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
      } else {
        cleaned = cleaned.replace(/[{}]/g, "");
      }
    }
    return detox_prose(cleaned);
  }
}

// Export a singleton instance for global state persistence
export const visual_engine = new VisualEngine();
