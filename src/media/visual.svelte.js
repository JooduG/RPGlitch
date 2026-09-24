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

import { SvelteSet } from "svelte/reactivity";
import { db, entities, VISUAL_STYLES, resolve_portrait_visual_style_key, resolve_story_visual_style_key } from "@data";
import { generate_secure_seed, strip_cognition_blocks, state_bridge, CircuitBreaker, ExponentialBackoffRetryer } from "@utils";
import { llm_service } from "@platform";
import {
  get_resolution,
  get_tier_guidance_scale,
  normalize_image_tier,
  aesthetic_resolver,
  compose_visual_generation_prompt,
  IMAGE_TIERS,
} from "./optics.js";
import { compile_prompt, clean_image_prompt, parse_llm_image_prompt_response, render_optics_fallback, render_visual_history } from "@intelligence";

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

            const resolution_bounds = get_resolution(options._entity?.type === "fractal" ? "fractal_profile" : options.mode);
            const base_negative_prompt = options.negative_prompt?.trim() || "";

            const style_key =
              options._entity && normalize_image_tier(options.mode || "") === "solo_entity"
                ? resolve_portrait_visual_style_key(options._entity)
                : resolve_story_visual_style_key(options._fractal || options.fractal);

            const tier_for_shot = normalize_image_tier(effective_type === "fractal" ? "story_scene" : effective_type);
            const { prompt: composed_prompt, negative_prompt: effective_negative_prompt } = compose_visual_generation_prompt({
              prompt: final_prompt,
              style_key,
              is_character_shot: tier_for_shot !== "story_scene",
              base_negative_prompt,
            });
            final_prompt = composed_prompt;

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
          const { system, task } = compile_prompt("optics", {
            tier: type,
            target_type: type,
            raw_intent: text,
            entity,
            mode: "enhance",
            variant: type === "selfie" ? "selfie" : undefined,
          });
          const result = await llm_service.generate({ system, task, messages: [] }, { silent: true });
          if (!result) throw new Error("Prompt enhancement failed - no content.");

          const parsed = parse_llm_image_prompt_response(result);
          if (parsed) return parsed;

          const clean_prompt = clean_image_prompt(result, { names: [entity?.name] });
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

      const solo_or_character_entity = options.entity || (subject === "user" ? user : subject === "fractal" ? fractal : ai);
      const frame_names = (
        tier === "story_entities" ? [ai?.name, user?.name] : tier === "story_scene" ? [] : [solo_or_character_entity?.name]
      ).filter(Boolean);

      const required_keys = tier === "story_entities" ? ["ai", "user"] : tier === "story_scene" ? ["fractal"] : [subject];
      const subject_by_key = { ai, user, fractal };
      const missing_subjects = required_keys
        .filter((key) => {
          const entity = subject_by_key[key];
          return !entity || (entity.name === "Unknown" && !entity.description && !entity.eternal && !entity.present);
        })
        .map((key) => `${key} ("${subject_by_key[key]?.name || "missing"}")`);

      if (missing_subjects.length) {
        console.warn(
          `[VisualEngine] visualize: skipping ${tier} generation — no resolvable character state for ${missing_subjects.join(", ")}. Image suppressed to avoid "Unknown" subjects.`,
        );
        return { imageUrl: null, refinedPrompt: null, caption: null };
      }

      const style_key_for_llm =
        tier === "solo_entity" ? resolve_portrait_visual_style_key(solo_or_character_entity) : resolve_story_visual_style_key(fractal);
      const use_llm = is_selfie || tier === "story_entities" || (tier !== "solo_entity" && (VISUAL_STYLES[style_key_for_llm]?.llm_refine ?? true));

      let refined = null;
      if (use_llm) {
        const { system, task } = compile_prompt("optics", {
          tier,
          target_type: tier,
          raw_intent: sanitized_prompt,
          ai,
          user,
          fractal,
          entity: tier === "solo_entity" || tier === "story_character" ? solo_or_character_entity : undefined,
          variant: is_selfie ? "selfie" : options?.variant,
          visual_staging: options?.visual_staging || "",
          history: render_visual_history(state_bridge.simulation_log?.feed),
          mode: "visualize",
          onAlternationPick: (picks) => {
            for (const pick of picks) {
              const line = `[ALT] ${pick.label || "field"} → option ${pick.index + 1} "${pick.option}" (dice)`;
              try {
                state_bridge.app?.log?.(line, "system");
              } catch {
                // Fallback ignored in headless or unattached environments
              }
            }
          },
        });

        try {
          const extraction_timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("LLM prompt extraction timed out")), 90000));
          refined = await Promise.race([llm_service.generate({ system, task, messages: [] }, { silent: true }), extraction_timeout]);
        } catch (extract_error) {
          console.warn("[VisualEngine] visualize: LLM prompt extraction failed, using fallback:", /** @type {Error} */ (extract_error).message);
        }
      }

      if (!refined) {
        if (use_llm) console.warn("[VisualEngine] visualize: LLM returned empty/null, synthesizing fallback prompt.");
        refined = render_optics_fallback({ tier, subject, ai, user, fractal, intent: sanitized_prompt });
      }

      const parsed_response = parse_llm_image_prompt_response(refined);
      let clean_prompt;
      let extracted_negative = null;

      if (parsed_response) {
        clean_prompt = clean_image_prompt(strip_cognition_blocks(parsed_response.prompt), { names: frame_names });
        extracted_negative = parsed_response.negative_prompt || null;
      } else {
        clean_prompt = clean_image_prompt(strip_cognition_blocks(refined || ""), { names: frame_names });
      }

      if ((!clean_prompt || clean_prompt.length < 10) && (tier === "story_scene" || tier === "story_entities")) {
        const fractal_description = aesthetic_resolver.flatten(fractal);
        clean_prompt = `RAW photograph or structured artistic rendering of ${fractal?.name || "an environment"}, ${fractal_description || "high architectural definition, crisp spatial depth details, professional landscape layout alignment"}`;
      }

      let caption = null;
      if (is_selfie) {
        caption = parsed_response?.caption || "You wanted a selfie? There you go.";
      }

      const generate_options = { mode: tier, returnPayload: true, _fractal: fractal, ...options };
      if (tier === "solo_entity") generate_options._entity = solo_or_character_entity;
      if (extracted_negative && !generate_options.negative_prompt) {
        generate_options.negative_prompt = extracted_negative;
      }

      if (solo_or_character_entity?.signature_color && tier !== "story_scene") {
        const signature_name = solo_or_character_entity.signature_color.toLowerCase();
        const base_color_word = signature_name.split(/\s+/).pop();
        if (base_color_word && !clean_prompt.toLowerCase().includes(base_color_word)) {
          clean_prompt = `${clean_prompt}, with signature ${signature_name} accent details`;
        }
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
    const resolution_bounds = get_resolution(options._entity?.type === "fractal" ? "fractal_profile" : options.mode);
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
          negative_prompt: options.negative_prompt || VISUAL_STYLES.none.negative_prompt || "",
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

/**
 * Resets the cached host image engine reference.
 * Used for testing and dynamic plugin reconnects.
 */
export function reset_cached_image_engine() {
  cached_image_engine = null;
}

// ============================================================================
// [SECTION 4: IMAGE BEATS, QUEUE & GHOST-SWEEP LIFECYCLE]
// ============================================================================

/** Maximum concurrent image beats in the active queue before oldest eviction */
export const IMAGE_GENERATION_QUEUE_CAPACITY = 5;

/** Maximum unresolved placeholders permitted in active story log before trigger refusal */
export const IMAGE_PLACEHOLDER_HARD_CAP = 5;

/** Timeout limit (120s) for a single visual generation beat */
export const IMAGE_RESOLVE_TIMEOUT_MS = 120000;

/** Maximum age (2m) before an unresolved placeholder is swept as stale */
export const IMAGE_GHOST_MAX_AGE_MS = 2 * 60 * 1000;

/**
 * In-memory generation queue tracking active image generation beats.
 * @type {Array<{ id: string | number, tier: string, source: string, metadata: Record<string, any> }>}
 */
export const _image_generation_queue = [];

/**
 * Returns a shallow copy snapshot of active queued image beats.
 * @returns {Array<{ id: string | number, tier: string, source: string, metadata: Record<string, any> }>}
 */
export function get_image_generation_queue() {
  return [..._image_generation_queue];
}

/**
 * Resets the in-memory generation queue (used for testing and teardowns).
 */
export function reset_image_generation_queue() {
  _image_generation_queue.length = 0;
}

/**
 * Tracks attachments whose image generation is currently in flight, keyed
 * `${entry_id}:${attachment_index}`. The ghost sweeper consults this so a
 * legitimately slow generation (the prologue runs an LLM refinement pass
 * before texturing) is never reaped while it is still working.
 * @type {SvelteSet<string>}
 */
export const _in_flight_image_generations = new SvelteSet();

/**
 * Marks an attachment's image generation as in flight.
 * @param {string | number} id
 * @param {number} [attachment_index=0]
 */
export function mark_generation_in_flight(id, attachment_index = 0) {
  if (id == null) return;
  _in_flight_image_generations.add(`${id}:${attachment_index}`);
}

/**
 * Clears an attachment's in-flight generation marker.
 * @param {string | number} id
 * @param {number} [attachment_index=0]
 */
export function clear_generation_in_flight(id, attachment_index = 0) {
  if (id == null) return;
  _in_flight_image_generations.delete(`${id}:${attachment_index}`);
}

/**
 * Reports whether an attachment's image generation is currently in flight.
 * @param {string | number} id
 * @param {number} [attachment_index=0]
 * @returns {boolean}
 */
export function is_generation_in_flight(id, attachment_index = 0) {
  if (id == null) return false;
  return _in_flight_image_generations.has(`${id}:${attachment_index}`);
}

/**
 * Clears all in-flight generation markers (used for testing and teardowns).
 */
export function reset_generation_in_flight() {
  _in_flight_image_generations.clear();
}

/**
 * Internal helper to remove a resolved or failed beat from the active queue.
 * @param {string | number} id
 */
export function _remove_from_image_generation_queue(id) {
  const index = _image_generation_queue.findIndex((entry) => entry.id === id);
  if (index !== -1) _image_generation_queue.splice(index, 1);
}

/**
 * Counts unresolved image placeholders (`src: null`, not marked failed) in the active story log.
 * @returns {Promise<number>}
 */
export async function count_pending_ghosts() {
  try {
    const story_id = state_bridge.runtime.story_id;
    if (!story_id) return 0;

    const entries = await state_bridge.session_driver.load_log(story_id);
    let count = 0;

    for (const entry of entries) {
      const attachments = entry?.attachments || [];
      for (const attachment of attachments) {
        if (attachment && attachment.src == null && !attachment.metadata?.failed) {
          count++;
        }
      }
    }
    return count;
  } catch {
    return 0;
  }
}

/**
 * Marks placeholders older than `IMAGE_GHOST_MAX_AGE_MS` as failed and removes empty ghost rows.
 * @returns {Promise<void>}
 */
export async function sweep_stale_ghosts() {
  try {
    const story_id = state_bridge.runtime.story_id;
    if (!story_id) return;

    const entries = await state_bridge.session_driver.load_log(story_id);
    const now = Date.now();

    for (const entry of entries) {
      const attachments = entry?.attachments || [];
      for (let attachment_index = 0; attachment_index < attachments.length; attachment_index++) {
        const attachment = attachments[attachment_index];
        if (attachment && attachment.src == null) {
          // Never reap a placeholder whose generation is still running.
          if (is_generation_in_flight(entry.id, attachment_index)) continue;
          const is_failed = attachment.metadata?.failed === true || attachment.metadata?.image_ghost_swept === true;
          const requested_at = Number(attachment.metadata?.requested_at) || entry.created_at || 0;
          const is_stale = now - requested_at > IMAGE_GHOST_MAX_AGE_MS;
          const is_empty_text = !entry.text || !entry.text.trim();

          if (is_empty_text && (is_failed || is_stale)) {
            await state_bridge.session_driver.delete_log_entry(entry.id);
            state_bridge.simulation_log?.remove?.(entry.id);
          } else if (is_stale && !is_failed) {
            await state_bridge.session_driver.update_log_attachment(entry.id, attachment_index, {
              src: null,
              metadata: {
                ...(attachment.metadata || {}),
                failed: true,
                image_ghost_swept: true,
                error: "Image beat timed out before it could resolve.",
              },
            });
          }
        }
      }
    }
  } catch {
    /* sweep must never throw into trigger execution */
  }
}

/**
 * Marks a logged placeholder attachment as failed so it never lingers as a broken ghost card.
 * @param {string | number} id
 * @param {Record<string, any>} [metadata={}]
 * @returns {Promise<void>}
 */
export async function mark_placeholder_failed(id, metadata = {}) {
  if (!id) return;
  clear_generation_in_flight(id, 0);
  try {
    const key = isNaN(Number(id)) ? id : Number(id);
    let has_narrative_text = false;

    const current_story_id = state_bridge.runtime?.story_id;
    const feed_match = state_bridge.simulation_log?.feed?.find(
      (entry) =>
        (!entry.story_id || !current_story_id || entry.story_id === current_story_id) &&
        (entry.id === key || entry.id === id || String(entry.id) === String(id)),
    );
    if (feed_match && feed_match.text && feed_match.text.trim()) {
      has_narrative_text = true;
    } else {
      try {
        const database_entries = await state_bridge.session_driver.load_log(current_story_id);
        const match = database_entries?.find((entry) => entry.id === key || entry.id === id || String(entry.id) === String(id));
        if (match && match.text && match.text.trim()) has_narrative_text = true;
      } catch {
        /* db lookup fallback ignore */
      }
    }

    if (has_narrative_text) {
      await state_bridge.session_driver.update_log_attachment(id, 0, {
        src: null,
        metadata: { ...metadata, failed: true, error: "Image beat was dropped before it could resolve." },
      });
      return;
    }

    // For standalone image placeholders (empty text), purge row completely
    await state_bridge.session_driver.delete_log_entry(id);
    state_bridge.simulation_log?.remove?.(key);
    state_bridge.simulation_log?.remove?.(id);
  } catch (error) {
    console.warn("[ImageQueue] Failed to mark image placeholder as failed:", error);
  }
}

/**
 * Spawns an image beat: logs placeholder attachment and initiates background image generation.
 * @param {string} tier - One of the 4-tier targets (story_entities | story_character | solo_entity | story_scene).
 * @param {{ explicit?: boolean, source?: string, prompt?: string, visual_staging?: string }} [options={}]
 * @returns {Promise<void>}
 */
export async function spawn_image_beat(tier, options = {}) {
  const { explicit = false, source = "dynamics", prompt = "", visual_staging = "", engine = null } = options;
  if (!tier || !IMAGE_TIERS.includes(tier)) return;

  const runtime_state = state_bridge.runtime;
  const visual_prompt = String(prompt || "").trim() || "A significant narrative moment unfolds.";
  const fractal_name = runtime_state.active_fractal?.name || "Fractal";

  try {
    await sweep_stale_ghosts();
    const pending_ghosts = await count_pending_ghosts();

    if (pending_ghosts >= IMAGE_PLACEHOLDER_HARD_CAP) {
      state_bridge.app.log(
        `[Image Trigger] Skipped ${tier} — ${pending_ghosts} unresolved image beats pending (hard cap ${IMAGE_PLACEHOLDER_HARD_CAP}).`,
        "warn",
      );
      return;
    }

    const placeholder_metadata = { mode: tier, image_source: source, image_explicit: explicit, requested_at: Date.now() };
    const placeholder_entry = await state_bridge.session_driver.log_message("", "fractal", fractal_name, {
      turn_type: "SYSTEM_TURN",
      attachments: [{ src: null, metadata: placeholder_metadata }],
    });
    if (!placeholder_entry?.id) return;

    // Bounded queue management
    _image_generation_queue.push({ id: placeholder_entry.id, tier, source, metadata: placeholder_metadata });
    if (_image_generation_queue.length > IMAGE_GENERATION_QUEUE_CAPACITY) {
      const evicted = _image_generation_queue.shift();
      if (evicted?.id) await mark_placeholder_failed(evicted.id, evicted.metadata);
    }

    mark_generation_in_flight(placeholder_entry.id, 0);
    const resolve_placeholder = async () => {
      try {
        const engine_ref = engine || (typeof this !== "undefined" && this instanceof VisualEngine ? this : visual_engine);
        const result = await Promise.race([
          engine_ref.visualize(runtime_state.story_id, visual_prompt, tier, { silent: true, visual_staging }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("IMAGE_RESOLVE_TIMEOUT")), IMAGE_RESOLVE_TIMEOUT_MS)),
        ]);

        _remove_from_image_generation_queue(placeholder_entry.id);

        const resolved_image_url = result?.imageUrl || result?.image_url;
        const refined_prompt = result?.refinedPrompt || result?.refined_prompt;

        if (resolved_image_url) {
          await state_bridge.session_driver.update_log_attachment(placeholder_entry.id, 0, {
            src: resolved_image_url,
            metadata: { mode: tier, image_source: source, ...result.metadata, prompt: refined_prompt },
          });
        } else {
          await mark_placeholder_failed(placeholder_entry.id, placeholder_metadata);
          state_bridge.app.log(`[Image Trigger] ${tier} generation returned no image.`, "warn");
        }
      } catch (error) {
        _remove_from_image_generation_queue(placeholder_entry.id);
        await mark_placeholder_failed(placeholder_entry.id, placeholder_metadata);
        throw error;
      } finally {
        clear_generation_in_flight(placeholder_entry.id, 0);
      }
    };

    // Dispatch background execution
    resolve_placeholder().catch((error) => {
      console.warn(`[Image Trigger] Background resolution failed for beat ${placeholder_entry.id}:`, error);
    });
  } catch (error) {
    console.warn("[Image Trigger] Failed to spawn image beat:", error);
  }
}

/**
 * CHANGELOG:
 * - 2026-09-24: Media layer consolidation — absorbed image-beats.js (queue bounds, in-flight registry, ghost sweeping, spawn_image_beat) directly into visual.svelte.js per P4 Zero Backwards Compatibility.
 * - 2026-09-24: Prompt-domain fold-in — the optics recent-narrative window now calls `render_visual_history` (@intelligence), the empty-response fallback now calls `render_optics_fallback` (@intelligence), the `<image_prompt>`/`<caption>` extraction now uses `parse_llm_image_prompt_response`, and `generate()` consumes the finished spec from `compose_visual_generation_prompt` (@media/image-aesthetics); removed the local `_build_visual_history`, fallback templates, caption regexes, and inline token assembly.
 * - 2026-09-24: Optics envelope regression — enhance() and visualize() now forward the compiled <TASK> (task) alongside the <SYSTEM> fragment, honoring the universal { system, task } package contract; previously only .system was sent, so the LLM never received the OUTPUT_FORMAT JSON schema and improvised XML/Markdown envelopes.
 * - 2026-09-19: Prompt Unification (Mega Report S1, R4): Retired prompt_templates; routed enhance and visualize prompt compilation directly through switchboard compile_prompt("optics", ...).
 * - 2026-09-19: Pipeline correctness & fidelity fixes: (1) Fixed tier mapping so story_scene passes without character negatives (R2); (2) Applied VISUAL_STYLES.none as universal baseline quality floor in generate() (F2); (3) Case-folded and stripped punctuation during negative token deduplication (F5); (4) Enforced signature color trait verification in visualize() (F1).
 * - 2026-09-18: Migrated image prompt templates and response parsers from local image-prompts.js to @intelligence barrel.
 * - 2026-09-06: Suppressed image generation for unresolvable/Unknown subjects, excluded system entries from visual history, and used truncate_at_word.
 * - 2026-09-06: Allowed explicit options.entity in visualize to support custom characters/NPC portraits.
 * - 2026-09-05: Fractal profile pictures now render in landscape (768x512) — resolution selection is
 *   entity-type aware, routing fractal `_entity` solo_entity shots through the `fractal_profile`/story_scene
 *   tier while character portraits stay portrait (512x768).
 * - 2026-08-29: Executed /harmonize protocol: purged shorthand abbreviations (resolution_bounds,
 *   visual_style_tokens, visual_style_positive_tokens, character_negative_tokens,
 *   deduplicated_negative_tokens, cleaned_prompt_preview, etc.), structured full descriptive nomenclature,
 *   reinforced Universal File Architecture, and verified unit test passes.
 * - 2026-08-29: Applied ground-up /refactor protocol: added Universal File Architecture header block,
 *   structured 3 explicit section dividers, converted _resolveEntity to snake_case resolve_entity,
 *   standardized camelCase parameters and local variables (generate_secure_seed, timeout_id).
 * - 2026-09-04: visualize() logs code-side alternation dice picks as [ALT] FIELD -> option N "..." (dice).
 * - 2026-09-18: Negative Prompt Pipeline Harmonization — Purged orphan NEGATIVE_PROMPT constant from protocols.js and intelligence barrel; resolved negative prompts strictly through visual_style_tokens.negative_prompt and VISUAL_STYLES.none baseline floor.
 */
