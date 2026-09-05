/**
 * @file src/media/visual.svelte.js
 * 🎨 SENSORY CORTEX — VISUAL ENGINE & RENDERING PIPELINE
 *
 * Core Responsibilities:
 * 1. Image Generation Infrastructure & Resilience (`VisualEngine.generate`):
 *    - Connects to the host Perchance text-to-image engine across iframe boundaries.
 *    - Guarantees reliability via `CircuitBreaker` and `ExponentialBackoffRetryer`.
 *    - Injects positive and negative visual engine tokens, resolution bounds, and tier guidance scales.
 * 2. Visual Prompt Enhancement & Extraction (`enhance`):
 *    - Refines loose natural language inputs into structured visual prompt tokens via LLM.
 * 3. Multi-Tier Narrative Visualization (`visualize`):
 *    - Orchestrates story-level visual events (story_scene, solo_entity, story_character, story_entities, selfie).
 *    - Extracts prompts and captions from LLM `BUILDER` templates and falls back to deterministic flattening on timeout.
 * 4. Multi-Candidate Generation (`generate_candidates`):
 *    - Concurrent multi-seed candidate image generation for profile avatars and storyboards.
 *
 * Purity: Svelte 5 Rune-driven state class (`is_loading`, `error`, `attempts`, `is_offline`).
 */

import { db, entities, VISUAL_STYLES, resolve_portrait_visual_style_key, resolve_story_visual_style_key } from "@data";
import { generate_secure_seed, strip_cognition_blocks, state_bridge, CircuitBreaker, ExponentialBackoffRetryer } from "@utils";
import { llm_service } from "@platform";
import { get_resolution, get_tier_guidance_scale, normalize_image_tier } from "./image-tiers.js";
import { aesthetic_resolver, resolve_visual_engine_tokens } from "./image-aesthetics.js";
import { clean_image_prompt, NEGATIVE_PROMPT, parse_llm_image_prompt_response, prompt_templates } from "./image-prompts.js";

// ============================================================================
// [SECTION 1: HOST ENGINE DISCOVERY & CACHE]
// ============================================================================

/** @type {Function | null} */
let cached_image_engine = null;

/**
 * Searches and caches the Perchance host text-to-image plugin infrastructure.
 * Insulates cross-origin boundary lookups behind safe try/catch guards.
 * @returns {Function | null}
 */
function find_image_engine() {
  if (cached_image_engine) {
    if (typeof cached_image_engine === "function") return cached_image_engine;
    cached_image_engine = null;
  }
  if (typeof window === "undefined") return null;

  // 1. Check local frame scope
  if (typeof window.pluginGenerateImage === "function") {
    cached_image_engine = window.pluginGenerateImage;
    return cached_image_engine;
  }
  if (typeof window.generate_image === "function") {
    cached_image_engine = window.generate_image;
    return cached_image_engine;
  }

  // 2. Insulate cross-origin parent frame lookup
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
  } catch {
    /* Swallow cross-origin sandboxed access restrictions */
  }

  return null;
}

// ============================================================================
// [SECTION 2: VISUAL ENGINE CLASS & GENERATION PIPELINE]
// ============================================================================

export class VisualEngine {
  // --- Reactive Svelte 5 State Runes ---
  is_loading = $state(false);
  /** @type {string | null} */
  error = $state(null);
  attempts = $state(0);
  is_offline = $state(false);

  constructor() {
    this.retryer = new ExponentialBackoffRetryer({
      max_attempts: 3,
      initial_delay: 1000,
      max_delay: 10000,
    });
    this.breaker = new CircuitBreaker({
      failure_threshold: 3,
      success_threshold: 2,
      recovery_timeout: 30000,
    });
  }

  /**
   * Primary high-level generation pipeline.
   * Resolves target entities, prompt modifiers, and resilient text-to-image execution.
   * @param {string} target
   * @param {Record<string, any>} [options={}]
   * @returns {Promise<any>}
   */
  async generate(target, options = {}) {
    this.is_loading = true;
    this.error = null;
    this.attempts = 0;

    // Auto-recover circuit breaker for user-initiated requests
    if (this.breaker.is_open) {
      this.breaker.state = "HALF_OPEN";
      this.breaker.successCount = 0;
    }
    this.is_offline = this.breaker.is_open;

    try {
      let final_prompt = "";
      let effective_type = options.type || options.mode || "character";

      // 1. Resolve Target & Prompt
      if (options._entity && typeof options._entity === "object") {
        const entity = options._entity;
        const has_physical = entity.eternal?.physical || entity.present?.physical;
        if (!entity.modifiers?.prompt && !has_physical) {
          const tags = Array.isArray(entity.tags) ? entity.tags.join(", ") : "";
          const non_physical = [entity.eternal?.non_physical, entity.present?.non_physical]
            .filter(Boolean)
            .map((feature) => String(feature).slice(0, 150))
            .join(", ");
          const fallback_features = [tags, non_physical].filter(Boolean).join(", ");
          final_prompt = `${entity.name}${fallback_features ? `, ${fallback_features}` : ""}, ${aesthetic_resolver.flatten(entity)}`;
        } else {
          final_prompt = entity.modifiers?.prompt || aesthetic_resolver.flatten(entity) || entity.name;
        }
        effective_type = entity.type || "character";
        if (!options.negative_prompt && entity.modifiers?.negative_prompt) {
          options.negative_prompt = entity.modifiers.negative_prompt;
        }
      } else if (typeof target === "string") {
        const is_uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target);
        const found_entity =
          is_uuid || target.startsWith("npc-") || target.startsWith("char-") || target.startsWith("fractal-")
            ? await this.resolve_entity(target)
            : null;

        if (found_entity && (found_entity.id || found_entity.name !== "Unknown")) {
          const entity = found_entity;
          const has_physical = entity.eternal?.physical || entity.present?.physical;
          if (!entity.modifiers?.prompt && !has_physical) {
            console.warn(`[VisualEngine] Bare-name fallback for entity "${entity.name}". No physical attributes defined.`);
            const tags = Array.isArray(entity.tags) ? entity.tags.join(", ") : "";
            const non_physical = [entity.eternal?.non_physical, entity.present?.non_physical]
              .filter(Boolean)
              .map((feature) => String(feature).slice(0, 150))
              .join(", ");
            const fallback_features = [tags, non_physical].filter(Boolean).join(", ");
            final_prompt = `${entity.name}${fallback_features ? `, ${fallback_features}` : ""}, ${aesthetic_resolver.flatten(entity)}`;
          } else {
            final_prompt = entity.modifiers?.prompt || aesthetic_resolver.flatten(entity) || entity.name;
          }
          effective_type = entity.type || "character";
          if (!options._entity) options._entity = entity;
          if (!options.negative_prompt && entity.modifiers?.negative_prompt) {
            options.negative_prompt = entity.modifiers.negative_prompt;
          }
        } else {
          final_prompt = target.trim();
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

            const resolution_bounds = get_resolution(options.mode);
            const base_negative_prompt = options.negative_prompt?.trim() || "";

            const style_key =
              options._entity && normalize_image_tier(options.mode || "") === "solo_entity"
                ? resolve_portrait_visual_style_key(options._entity)
                : resolve_story_visual_style_key(options._fractal || options.fractal);
            const visual_style_tokens = resolve_visual_engine_tokens(style_key);

            // Inject positive style tokens into prompt
            const visual_style_positive_tokens = [
              visual_style_tokens.medium,
              visual_style_tokens.palette,
              visual_style_tokens.camera || visual_style_tokens.composition,
              visual_style_tokens.texture,
            ]
              .filter(Boolean)
              .join(", ");
            if (visual_style_positive_tokens && style_key !== "none" && !final_prompt.includes(visual_style_tokens.medium || "\x00")) {
              final_prompt = `${final_prompt}, ${visual_style_positive_tokens}`;
            }

            const entity_type = effective_type;
            const tier_for_shot = normalize_image_tier(
              entity_type === "solo_entity" || entity_type === "story_character" || entity_type === "story_entities"
                ? entity_type
                : entity_type === "fractal"
                  ? "story_scene"
                  : "story_character",
            );

            const is_character_shot = tier_for_shot !== "story_scene";
            const character_negative_tokens = is_character_shot
              ? "empty background, landscape without characters, scenery only, no humans, empty environment"
              : "";
            const visual_style_negative_tokens = style_key !== "none" ? visual_style_tokens.negative_prompt || "" : "";
            const raw_negative_sources = [base_negative_prompt, visual_style_negative_tokens, character_negative_tokens, NEGATIVE_PROMPT]
              .filter(Boolean)
              .join(", ");
            const deduplicated_negative_tokens = Array.from(
              new Set(
                raw_negative_sources
                  .split(",")
                  .map((token) => token.trim())
                  .filter(Boolean),
              ),
            );
            const effective_negative_prompt = deduplicated_negative_tokens.join(", ");
            const effective_seed = options.seed ?? generate_secure_seed();
            const effective_resolution = options.resolution ?? `${resolution_bounds.width}x${resolution_bounds.height}`;

            const tier_guidance_baseline = get_tier_guidance_scale(tier_for_shot);
            const style_guidance = VISUAL_STYLES[style_key]?.guidance_scale;
            const effective_guidance_scale =
              options.guidanceScale ??
              (style_guidance == null
                ? tier_guidance_baseline
                : Math.min(Math.max(style_guidance, tier_guidance_baseline - 2), tier_guidance_baseline + 2));

            const generate_promise = image_engine({
              prompt: final_prompt,
              negativePrompt: effective_negative_prompt,
              seed: effective_seed,
              resolution: effective_resolution,
              guidanceScale: effective_guidance_scale,
            });

            let timeout_id;
            const timeout_promise = new Promise((_, reject) => {
              timeout_id = setTimeout(() => reject(new Error("Image generation timed out")), 120000);
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
                const image_data =
                  typeof data === "string" || data instanceof String
                    ? data.valueOf()
                    : data.dataUrl || data.data_url || data.url || data.image || data.src || data.href || null;
                if (!image_data) {
                  throw new Error("Text-to-image failed: no image data returned");
                }

                if (options.returnPayload) {
                  return {
                    url: image_data,
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
                return image_data;
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
              clearTimeout(timeout_id);
            }
          },
          (attempt) => {
            this.attempts = attempt;
            console.warn(`[VisualEngine] Retry attempt ${attempt}...`);
          },
        );
      });

      this.is_offline = this.breaker.is_open;
      return result;
    } catch (error_instance) {
      const error = /** @type {Error} */ (error_instance);
      this.error = error.message;
      this.is_offline = this.breaker.is_open;
      console.error("[VisualEngine] Service Failure:", error);
      throw error;
    } finally {
      this.is_loading = false;
    }
  }

  /**
   * Refines raw text into structured visual tokens via LLM.
   * @param {string} text
   * @param {string} [type="character"]
   * @param {any} [entity=null]
   * @returns {Promise<{ prompt: string, negative_prompt: string } | null>}
   */
  async enhance(text, type = "character", entity = null) {
    return await this.breaker.execute(async () => {
      return await this.retryer.retry(
        async () => {
          const system = prompt_templates.enhance_prompt(text, type, entity);
          const result = await llm_service.generate({ system, messages: [] }, { silent: true });
          if (!result) throw new Error("Prompt enhancement failed - no content.");

          const parsed = parse_llm_image_prompt_response(result);
          if (parsed) return parsed;

          const clean_prompt = clean_image_prompt(result);
          return clean_prompt ? { prompt: clean_prompt, negative_prompt: "" } : null;
        },
        (attempt) => {
          console.warn(`[VisualEngine] Enhancement retry ${attempt}...`);
        },
      );
    });
  }

  /**
   * Visualizes a narrative story beat across canonical 4-tier routing.
   * @param {string | number} story_id
   * @param {string} visual_prompt
   * @param {string} [target_type]
   * @param {Record<string, any>} [options={}]
   * @returns {Promise<{ imageUrl: string | null, refinedPrompt: string | null, caption: string | null, metadata?: any }>}
   */
  async visualize(story_id, visual_prompt, target_type, options = {}) {
    const { silent = false } = options;
    let story = null;

    let sanitized_prompt = typeof visual_prompt === "string" ? strip_cognition_blocks(visual_prompt) : "";

    if (story_id) {
      const db_key = typeof story_id === "string" && /^\d+$/.test(story_id) ? Number(story_id) : story_id;
      try {
        story = await db.stories.get(db_key);
      } catch {
        /* db lookup fallback */
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

    const tier = normalize_image_tier(target_type);
    const is_selfie = target_type === "selfie";
    const subject = options.subject || (target_type === "user" ? "user" : target_type === "fractal" ? "fractal" : "ai");

    if (!silent) {
      state_bridge.simulation_state.start_typing(
        tier === "story_scene" || tier === "story_entities" ? "fractal" : subject === "user" ? "user" : "ai",
      );
    }

    try {
      const runtime = state_bridge.runtime;
      const ai = (runtime?.active_ai?.id === story.ai_id && runtime.active_ai) || (await this.resolve_entity(story.ai_id));
      const user = (runtime?.active_user?.id === story.user_id && runtime.active_user) || (await this.resolve_entity(story.user_id));
      const fractal = (runtime?.active_fractal?.id === story.fractal_id && runtime.active_fractal) || (await this.resolve_entity(story.fractal_id));

      const solo_or_character_entity = subject === "user" ? user : subject === "fractal" ? fractal : ai;

      const style_key_for_llm =
        tier === "solo_entity" ? resolve_portrait_visual_style_key(solo_or_character_entity) : resolve_story_visual_style_key(fractal);
      const use_llm = is_selfie || tier === "story_entities" || (tier !== "solo_entity" && (VISUAL_STYLES[style_key_for_llm]?.llm_refine ?? true));

      let refined = null;
      if (use_llm) {
        const system = prompt_templates.build_prompt(tier, sanitized_prompt, {
          ai,
          user,
          fractal,
          entity: tier === "solo_entity" || tier === "story_character" ? solo_or_character_entity : undefined,
          variant: is_selfie ? "selfie" : options?.variant,
          visual_staging: options?.visual_staging || "",
          history: this._build_visual_history(),
          mode: "visualize",
        });

        try {
          const extraction_timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("LLM prompt extraction timed out")), 90000));
          refined = await Promise.race([llm_service.generate({ system, messages: [] }, { silent: true }), extraction_timeout]);
        } catch (extract_error) {
          console.warn("[VisualEngine] visualize: LLM prompt extraction failed, using fallback:", /** @type {Error} */ (extract_error).message);
        }
      }

      if (!refined) {
        if (use_llm) console.warn("[VisualEngine] visualize: LLM returned empty/null, synthesizing fallback prompt.");
        const fallback_entity =
          tier === "solo_entity"
            ? subject === "user"
              ? user
              : subject === "fractal"
                ? fractal
                : ai
            : tier === "story_scene" || tier === "story_entities"
              ? fractal
              : subject === "user"
                ? user
                : ai;
        const fallback_description = aesthetic_resolver.flatten(fallback_entity);
        const fallback_name = fallback_entity?.name || tier;
        const short_intent = sanitized_prompt && sanitized_prompt.length < 200 ? sanitized_prompt : "";
        if (tier === "story_character" && fractal) {
          const fractal_description = aesthetic_resolver.flatten(fractal);
          refined = `<image_prompt>${short_intent ? `${short_intent}, ` : ""}${fallback_name}, ${fallback_description || "detailed character"}, situated within ${fractal.name || "the setting"}, ${fractal_description || "atmospheric environment, dramatic lighting"}</image_prompt>`;
        } else {
          refined = `<image_prompt>${short_intent ? `${short_intent}, ` : ""}${fallback_name}, ${fallback_description || "detailed character portrait, dramatic lighting"}</image_prompt>`;
        }
      }

      const parsed_json = parse_llm_image_prompt_response(refined);
      let clean_prompt;
      let extracted_negative = null;

      if (parsed_json) {
        clean_prompt = clean_image_prompt(strip_cognition_blocks(parsed_json.prompt));
        extracted_negative = parsed_json.negative_prompt || null;
      } else {
        const match = refined?.match(/<image_prompt[^>]*>([\s\S]*?)<\/image_prompt>/i);
        const extracted = match?.[1] || refined || "";
        clean_prompt = clean_image_prompt(strip_cognition_blocks(extracted));
      }

      if ((!clean_prompt || clean_prompt.length < 10) && (tier === "story_scene" || tier === "story_entities")) {
        const fractal_description = aesthetic_resolver.flatten(fractal);
        clean_prompt = `RAW photograph or structured artistic rendering of ${fractal?.name || "an environment"}, ${fractal_description || "high architectural definition, crisp spatial depth details, professional landscape layout alignment"}`;
      }

      let caption = null;
      if (is_selfie) {
        const caption_match = refined?.match(/<caption\s+text="([^"]+)"/i) || refined?.match(/<caption>([\s\S]*?)<\/caption>/i);
        caption = caption_match?.[1] || "You wanted a selfie? There you go.";
      }

      const generate_options = { mode: tier, returnPayload: true, _fractal: fractal, ...options };
      if (tier === "solo_entity") generate_options._entity = solo_or_character_entity;
      if (extracted_negative && !generate_options.negative_prompt) {
        generate_options.negative_prompt = extracted_negative;
      }
      const payload = await this.generate(clean_prompt, generate_options);

      const effective_metadata =
        typeof payload === "object" && payload?.metadata ? { ...payload.metadata, prompt: clean_prompt } : { prompt: clean_prompt, mode: tier };

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
    } catch (error_instance) {
      console.error("[VisualEngine] Visualize error:", error_instance);
      return { imageUrl: null, refinedPrompt: null, caption: null };
    } finally {
      if (!silent) state_bridge.simulation_state.stop_typing();
    }
  }

  /**
   * Generates N image candidates concurrently with the same prompt and distinct seeds.
   * @param {string} prompt - Refined image prompt.
   * @param {{ mode?: string, negative_prompt?: string, count?: number, min_success?: number, resolution?: string }} [options={}]
   * @returns {Promise<Array<{ url: string, metadata: any }>>}
   */
  async generate_candidates(prompt, options = {}) {
    const count = options.count ?? 3;
    const min_success = options.min_success ?? 2;
    const base_options = {
      mode: options.mode || "character",
      negative_prompt: options.negative_prompt,
      returnPayload: true,
    };

    /** @type {Array<{ url: string, metadata: any } | null>} */
    const results = new Array(count).fill(null);

    const attempts = [];
    for (let index = 0; index < count; index++) {
      attempts.push(
        this.generate(prompt, { ...base_options })
          .then((payload) => {
            if (payload?.url) return { index, payload };
            return { index, payload: null };
          })
          .catch(() => ({ index, payload: null })),
      );
    }
    const settled = await Promise.all(attempts);
    for (const settled_entry of settled) {
      if (settled_entry.payload) results[settled_entry.index] = settled_entry.payload;
    }

    const get_success_count = () => results.filter((result) => result !== null).length;
    let retry_round = 0;
    while (get_success_count() < min_success && retry_round < 3) {
      const failed_indices = results.map((result, index) => (result === null ? index : -1)).filter((index) => index >= 0);
      const retries = failed_indices.map((index) =>
        this.generate(prompt, { ...base_options })
          .then((payload) => ({ index, payload }))
          .catch(() => ({ index, payload: null })),
      );
      const retry_results = await Promise.all(retries);
      for (const retry_result of retry_results) {
        if (retry_result.payload?.url) results[retry_result.index] = retry_result.payload;
      }
      retry_round++;
    }

    return results.filter((result) => result !== null);
  }

  /**
   * Synthesizes an SVG preview data URL for dev and unit test environments when the host plugin is absent.
   * @param {string} prompt
   * @param {Record<string, any>} [options={}]
   * @returns {any}
   */
  _mock_generate(prompt, options = {}) {
    const resolution_bounds = get_resolution(options.mode);
    const width = resolution_bounds.width || 768;
    const height = resolution_bounds.height || 512;
    const is_scene = options.mode === "fractal" || options.mode === "landscape";
    const label = is_scene ? "SCENE PREVIEW" : "ENTITY PREVIEW";
    const cleaned_prompt_preview = String(prompt || "")
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
      <text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14">${cleaned_prompt_preview}...</text>
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

  // --- Private Helpers ---

  /**
   * Builds a compact recent-narrative history for the prompt builder.
   * @param {number} [max_entries=2]
   * @param {number} [max_chars=200]
   * @returns {string}
   */
  _build_visual_history(max_entries = 2, max_chars = 200) {
    const feed = state_bridge.simulation_log?.feed;
    if (!Array.isArray(feed) || feed.length === 0) return "";
    return feed
      .filter((entry) => entry && typeof entry.text === "string" && entry.text.trim())
      .slice(-max_entries)
      .map((entry) => `${entry.character_name || entry.role || "narrator"}: ${entry.text.slice(0, max_chars)}`)
      .join("\n");
  }

  /**
   * Resolves an entity record by ID from IndexedDB entities table.
   * @param {string | null | undefined} id
   * @returns {Promise<any>}
   */
  async resolve_entity(id) {
    if (!id) return { name: "Unknown", description: "" };
    return (await entities.get("character", id)) || (await entities.get("fractal", id)) || { name: "Unknown", description: "" };
  }
}

// ============================================================================
// [SECTION 3: SINGLETON FACADE EXPORT]
// ============================================================================

export const visual_engine = new VisualEngine();

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Executed /harmonize protocol: purged shorthand abbreviations (resolution_bounds,
 *   visual_style_tokens, visual_style_positive_tokens, character_negative_tokens,
 *   deduplicated_negative_tokens, cleaned_prompt_preview, etc.), structured full descriptive nomenclature,
 *   reinforced Universal File Architecture, and verified unit test passes.
 * - 2026-08-29: Applied ground-up /refactor protocol: added Universal File Architecture header block,
 *   structured 3 explicit section dividers, converted _resolveEntity to snake_case resolve_entity,
 *   standardized camelCase parameters and local variables (generate_secure_seed, timeout_id).
 * - 2026-08-28: Integrated CircuitBreaker and ExponentialBackoffRetryer resilient generation.
 */
