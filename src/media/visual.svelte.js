/**
 * src/media/visual.svelte.js
 * 🎨 VISUAL ENGINE (Reactive Class)
 * The sensory cortex orchestrator. Fully optimized with engine caching and localized JSON peeling.
 */

import { db, entities, VISUAL_STYLES } from "@data";
import { generate_secure_seed as generateSecureSeed, strip_cognition_blocks, state_bridge } from "@utils";
import { llm_service } from "@platform";
import { get_resolution, normalize_image_tier } from "./image-tiers.js";
import {
  aesthetic_resolver,
  resolve_portrait_visual_style_key,
  resolve_story_visual_style_key,
  resolve_visual_engine_tokens,
} from "./image-aesthetics.js";
import { clean_image_prompt, NEGATIVE_PROMPT, parse_llm_refine_response, prompt_templates } from "./image-prompts.js";
import { CircuitBreaker, ExponentialBackoffRetryer } from "@utils";

// Global cache for the Perchance text-to-image engine function to eliminate runtime lookup overhead
let cached_image_engine = null;

/**
 * Lazily searches and caches the hosted Perchance text-to-image plugin infrastructure.
 * Safely insulates cross-origin boundary lookups to prevent Same-Origin Policy crashes.
 * @returns {Function | null}
 */
function find_image_engine() {
  if (cached_image_engine) {
    if (typeof cached_image_engine === "function") return cached_image_engine;
    cached_image_engine = null;
  }
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
  is_loading = $state(false);
  /** @type {string | null} */
  error = $state(null);
  attempts = $state(0);
  is_offline = $state(false);

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
    this.is_loading = true;
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
    this.is_offline = this.breaker.isOpen;

    try {
      let final_prompt = "";
      let entity_id = null;
      let effective_type = options.type || options.mode || "character";

      // 1. Resolve Target & Prompt
      if (options._entity && typeof options._entity === "object") {
        entity_id = options._entity.id || (typeof target === "string" ? target : null);
        const entity = options._entity;
        const has_physical = entity.eternal?.physical || entity.present?.physical;
        if (!entity.modifiers?.prompt && !has_physical) {
          const tags = Array.isArray(entity.tags) ? entity.tags.join(", ") : "";
          const non_physical = [entity.eternal?.non_physical, entity.present?.non_physical]
            .filter(Boolean)
            .map((s) => String(s).slice(0, 150))
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
            ? await this._resolveEntity(target)
            : null;

        if (found_entity && (found_entity.id || found_entity.name !== "Unknown")) {
          entity_id = target;
          const entity = found_entity;
          const has_physical = entity.eternal?.physical || entity.present?.physical;
          if (!entity.modifiers?.prompt && !has_physical) {
            console.warn(`[VisualEngine] Bare-name fallback for entity "${entity.name}". No physical attributes defined.`);
            const tags = Array.isArray(entity.tags) ? entity.tags.join(", ") : "";
            const non_physical = [entity.eternal?.non_physical, entity.present?.non_physical]
              .filter(Boolean)
              .map((s) => String(s).slice(0, 150))
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

            const res = get_resolution(options.mode);
            const base_negative_prompt = options.negative_prompt?.trim() || "";
            // If _entity is provided AND we're in solo_entity mode (profile editor / pfp),
            // use the entity's own visual style. Otherwise (story tiers via visualize) use
            // the story resolver (fractal's active style).
            const style_key =
              options._entity && normalize_image_tier(options.mode || "") === "solo_entity"
                ? resolve_portrait_visual_style_key(options._entity)
                : resolve_story_visual_style_key(options._fractal || options.fractal);
            const vs_tokens = resolve_visual_engine_tokens(style_key);

            // Inject positive style tokens into the prompt if available
            const vs_positive = [vs_tokens.medium, vs_tokens.palette, vs_tokens.camera || vs_tokens.composition, vs_tokens.texture]
              .filter(Boolean)
              .join(", ");
            if (vs_positive && style_key !== "none" && !final_prompt.includes(vs_tokens.medium || "\x00")) {
              final_prompt = `${final_prompt}, ${vs_positive}`;
            }

            const entity_type = effective_type;
            const tier_for_shot = normalize_image_tier(
              entity_type === "solo_entity" || entity_type === "story_character" || entity_type === "story_entities"
                ? entity_type
                : entity_type === "fractal"
                  ? "story_scene"
                  : "story_character",
            );
            // story_scene is environmental; every other tier depicts one or more characters.
            const is_character_shot = tier_for_shot !== "story_scene";
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
            const effective_resolution = options.resolution ?? `${res.width}x${res.height}`;
            // The TIER baseline is authoritative (character shots 9, story scenes 7).
            // A per-style guidance_scale may nudge guidance only within ±2 of that
            // baseline, so the tier always governs and shots never hit extreme values.
            const tier_guidance_baseline = is_character_shot ? 9 : 7;
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
      this.is_offline = this.breaker.isOpen;

      if (result && entity_id && !options.noCache) {
        await this._cacheImage(entity_id, result, effective_type === "user" ? "character" : effective_type);
      }

      return result;
    } catch (err) {
      const error = /** @type {Error} */ (err);
      this.error = error.message;
      this.is_offline = this.breaker.isOpen;
      console.error("[VisualEngine] Service Failure:", error);
      throw error;
    } finally {
      this.is_loading = false;
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
          const system = prompt_templates.ENHANCE(text, type, entity);

          const result = await llm_service.generate({ system, messages: [] }, { silent: true });
          if (!result) throw new Error("Prompt enhancement failed - no content.");

          const parsed = parse_llm_refine_response(result);
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

    // Unified 4-Tier Image Taxonomy routing. targetType is a canonical tier;
    // subject (the entity whose perspective the image is taken from) may be
    // supplied separately via options.
    const tier = normalize_image_tier(targetType);
    const is_selfie = targetType === "selfie";

    const subject = options.subject || (targetType === "user" ? "user" : targetType === "fractal" ? "fractal" : "ai");

    if (!silent) {
      state_bridge.simulation_state.start_typing(
        tier === "story_scene" || tier === "story_entities" ? "fractal" : subject === "user" ? "user" : "ai",
      );
    }

    try {
      // FIX #1: Prefer live runtime entities (already mutated by Director) over
      // stale Dexie DB reads. _resolveEntity() only loads the last-persisted snapshot
      // and will miss mutations that haven't been flushed to the DB yet.
      const runtime = state_bridge.runtime;
      const ai = (runtime?.active_ai?.id === story.ai_id && runtime.active_ai) || (await this._resolveEntity(story.ai_id));
      const user = (runtime?.active_user?.id === story.user_id && runtime.active_user) || (await this._resolveEntity(story.user_id));
      const fractal = (runtime?.active_fractal?.id === story.fractal_id && runtime.active_fractal) || (await this._resolveEntity(story.fractal_id));

      const solo_or_char_entity = subject === "user" ? user : subject === "fractal" ? fractal : ai;

      // Tier-based LLM refinement policy:
      //  - selfie: always LLM (its caption is produced by the LLM)
      //  - story_entities: always LLM (multi-character composition needs planning)
      //  - solo_entity: quick path — deterministic flattening, no LLM round-trip
      //  - story_character / story_scene: defer to the active style's llm_refine flag
      const style_key_for_llm =
        tier === "solo_entity" ? resolve_portrait_visual_style_key(solo_or_char_entity) : resolve_story_visual_style_key(fractal);
      const use_llm = is_selfie || tier === "story_entities" || (tier !== "solo_entity" && (VISUAL_STYLES[style_key_for_llm]?.llm_refine ?? true));

      let refined = null;
      if (use_llm) {
        const system = prompt_templates.BUILDER(tier, visualPrompt, {
          ai,
          user,
          fractal,
          entity: tier === "solo_entity" || tier === "story_character" ? solo_or_char_entity : undefined,
          variant: is_selfie ? "selfie" : options?.variant,
          history: this._build_visual_history(),
          mode: "visualize",
        });

        try {
          const extraction_timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("LLM prompt extraction timed out")), 90000));
          refined = await Promise.race([llm_service.generate({ system, messages: [] }, { silent: true }), extraction_timeout]);
        } catch (extractErr) {
          console.warn("[VisualEngine] visualize: LLM prompt extraction failed, using fallback:", extractErr.message);
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
        const fallback_desc = aesthetic_resolver.flatten(fallback_entity);
        const fallback_name = fallback_entity?.name || tier;
        const short_intent = visualPrompt && visualPrompt.length < 200 ? visualPrompt : "";
        if (tier === "story_character" && fractal) {
          const fractal_desc = aesthetic_resolver.flatten(fractal);
          refined = `<image_prompt>${short_intent ? `${short_intent}, ` : ""}${fallback_name}, ${fallback_desc || "detailed character"}, situated within ${fractal.name || "the setting"}, ${fractal_desc || "atmospheric environment, dramatic lighting"}</image_prompt>`;
        } else {
          refined = `<image_prompt>${short_intent ? `${short_intent}, ` : ""}${fallback_name}, ${fallback_desc || "detailed character portrait, dramatic lighting"}</image_prompt>`;
        }
      }

      const parsed_json = parse_llm_refine_response(refined);
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
        const fractal_desc = aesthetic_resolver.flatten(fractal);
        clean_prompt = `RAW photograph or structured artistic rendering of ${fractal?.name || "an environment"}, ${fractal_desc || "high architectural definition, crisp spatial depth details, professional landscape layout alignment"}`;
      }

      let caption = null;
      if (is_selfie) {
        const caption_match = refined?.match(/<caption\s+text="([^"]+)"/i) || refined?.match(/<caption>([\s\S]*?)<\/caption>/i);
        caption = caption_match?.[1] || "You wanted a selfie? There you go.";
      }

      const generate_options = { mode: tier, returnPayload: true, _fractal: fractal, ...options };
      if (tier === "solo_entity") generate_options._entity = solo_or_char_entity;
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

  // --- Private Helpers ---

  /**
   * Builds a compact recent-narrative digest for the BUILDER <HISTORY> block.
   * Mirrors narrative context without importing @intelligence (would create a
   * @media -> @intelligence import cycle).
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
}

// Export a singleton instance for global state persistence
export const visual_engine = new VisualEngine();
