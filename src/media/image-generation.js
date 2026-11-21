/**
 * @file src/media/image-generation.js
 * 👁️ SENSORY CORTEX - STATELESS PERCHANCE IMAGE DISPATCHER (Rank 2, media)
 *
 * Stateless visual generation dispatcher. Handles host engine discovery
 * across window/iframe boundaries, exponential backoff, circuit breaking,
 * cancellation via AbortSignal, and queue / in-flight bookkeeping.
 *
 * Prompt builders (`sanitize_visual_text`, `resolve_story_beat_style`,
 * `compose_story_beat_prompt`) and tier/optics vocabulary live canonically
 * in `@simulation` and are imported here - this module keeps only dispatch,
 * bookkeeping, beat orchestration, and the VisualEngine facade.
 *
 * Cross-cutting context (runtime settings, session driver, feed) arrives as
 * an explicit required `ctx` parameter (`{ app, runtime, session_driver,
 * simulation_log }`, built by the caller from `@state`), so every entry
 * point stays injectable for tests. Media never imports `@engine` or `@state`
 * (Rank 2 cannot import Rank 3 or Rank 4).
 */

import { IMAGE_POLICY, TIMING_MS } from "@config";
import {
  compose_story_beat_prompt,
  get_resolution_string,
  get_tier_guidance_scale,
  IMAGE_TIERS,
  resolve_story_beat_style,
  sanitize_visual_text,
} from "@simulation";
import { CircuitBreaker, ExponentialBackoffRetryer, generate_secure_seed, resolve_perchance_plugin } from "@utils";

// ============================================================================
// [SECTION 1: HOST ENGINE DISCOVERY]
// ============================================================================

/** @type {Function | null} */
let cached_image_engine = null;

/**
 * Searches and caches the Perchance host text-to-image plugin infrastructure.
 * @returns {Function | null}
 */
export function find_image_engine() {
  if (cached_image_engine) {
    if (typeof cached_image_engine === "function") return cached_image_engine;
    cached_image_engine = null;
  }

  const engine = resolve_perchance_plugin("generate_image");
  if (engine) cached_image_engine = engine;
  return engine;
}

export function reset_cached_image_engine() {
  cached_image_engine = null;
}

// ============================================================================
// [SECTION 2: RESILIENCE & DISPATCHER]
// ============================================================================

const visual_circuit_breaker = new CircuitBreaker({ failure_threshold: 3, success_threshold: 2, recovery_timeout: 30000 });

const visual_retryer = new ExponentialBackoffRetryer({
  max_attempts: 3,
  initial_delay: 2500, // 2500ms backoff for Perchance 429/503 rate limits
  max_delay: 15000,
});

/**
 * Generates an offline SVG data URI fallback for test/offline environments.
 * @param {string} prompt
 * @param {number} width
 * @param {number} height
 * @returns {string}
 */
function create_offline_svg(prompt, width, height) {
  const sanitized = String(prompt || "Visual Prompt")
    .replace(/[<>&"]/g, " ")
    .slice(0, 80);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#1a1a24"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#8888aa" font-family="monospace" font-size="14">${sanitized}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Stateless visual generation dispatcher.
 * @param {Object} payload
 * @param {string} payload.prompt
 * @param {string} [payload.negative_prompt]
 * @param {string} [payload.resolution]
 * @param {string} [payload.mode] - tier mode used to derive the default guidance scale
 * @param {number} [payload.guidance_scale]
 * @param {number} [payload.seed]
 * @param {Object} [options={}]
 * @param {AbortSignal} [options.signal]
 * @param {Function} [options.engine] - Injectable mock engine for testing
 * @returns {Promise<{ image_url: string, seed: number, metadata: Record<string, any> }>}
 */
export async function dispatch_visual_generation(payload, options = {}) {
  const {
    prompt: raw_prompt,
    negative_prompt: raw_negative_prompt = "",
    resolution = "512x768",
    mode,
    guidance_scale: explicit_guidance,
    seed: explicit_seed,
  } = payload || {};

  // The host image plugin evaluates prompt text as Perchance template syntax
  // (`{...}` / `[...]` are structural). Sanitize first so a persisted raw-JSON
  // blob or stray braces can never throw a curly-bracket mismatch downstream.
  const prompt = sanitize_visual_text(raw_prompt);
  const negative_prompt = sanitize_visual_text(raw_negative_prompt);
  const guidance_scale = explicit_guidance ?? get_tier_guidance_scale(mode ?? options.mode);
  const seed = explicit_seed ?? generate_secure_seed();
  const [width_str, height_str] = String(resolution).split("x");
  const width = parseInt(width_str, 10) || 512;
  const height = parseInt(height_str, 10) || 768;

  if (options.signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  if (visual_circuit_breaker.is_open) {
    throw new Error("CIRCUIT_BREAKER_OPEN: Visual generation temporarily disabled due to consecutive failures.");
  }

  const raw_engine = options.engine || find_image_engine();

  if (!raw_engine) {
    return { image_url: create_offline_svg(prompt, width, height), seed, metadata: { offline: true, resolution, guidance_scale } };
  }

  const execute_attempt = async () => {
    if (options.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const engine_arguments = { prompt, negativePrompt: negative_prompt, resolution, guidanceScale: guidance_scale, seed };

    let result = raw_engine(engine_arguments);
    if (result && typeof result.then === "function") {
      result = await result;
    }

    const image_url = typeof result === "string" ? result : result?.dataUrl || result?.url || result?.imageUrl || result?.image_url || result?.image;
    if (!image_url) {
      throw new Error("EMPTY_IMAGE_RESPONSE: Engine returned no image URL");
    }

    return { image_url, seed, metadata: { resolution, guidance_scale, offline: false } };
  };

  return await visual_circuit_breaker.execute(() => visual_retryer.retry(execute_attempt));
}

// ============================================================================
// [SECTION 3: IN-FLIGHT BOOKKEEPING & QUEUE]
// ============================================================================

export const _in_flight_image_generations = new Set();
export const _image_generation_queue = [];

export function mark_generation_in_flight(id, attachment_index = 0) {
  if (id == null) return;
  _in_flight_image_generations.add(`${id}:${attachment_index}`);
}

export function clear_generation_in_flight(id, attachment_index = 0) {
  if (id == null) return;
  _in_flight_image_generations.delete(`${id}:${attachment_index}`);
}

export function is_generation_in_flight(id, attachment_index = 0) {
  if (id == null) return false;
  return _in_flight_image_generations.has(`${id}:${attachment_index}`);
}

export function reset_generation_in_flight() {
  _in_flight_image_generations.clear();
}

export function get_image_generation_queue() {
  return [..._image_generation_queue];
}

export function reset_image_generation_queue() {
  _image_generation_queue.length = 0;
}

export function _remove_from_image_generation_queue(id) {
  const index = _image_generation_queue.findIndex((entry) => entry.id === id);
  if (index !== -1) _image_generation_queue.splice(index, 1);
}

export async function count_pending_ghosts(ctx) {
  try {
    const story_id = ctx.session?.active_id;
    if (!story_id) return 0;

    const entries = await ctx.session?.load_log(story_id);
    if (!entries) return 0;
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

export async function mark_placeholder_failed(id, metadata = {}, ctx) {
  if (!id) return;
  clear_generation_in_flight(id, 0);
  try {
    const key = isNaN(Number(id)) ? id : Number(id);
    let has_narrative_text = false;

    const current_story_id = ctx.session?.active_id;
    const feed_match = ctx.session?.feed?.find(
      (entry) =>
        (!entry.story_id || !current_story_id || entry.story_id === current_story_id) &&
        (entry.id === key || entry.id === id || String(entry.id) === String(id)),
    );
    if (feed_match && feed_match.text && feed_match.text.trim()) {
      has_narrative_text = true;
    } else {
      try {
        const database_entries = await ctx.session?.load_log(current_story_id);
        const match = database_entries?.find((entry) => entry.id === key || entry.id === id || String(entry.id) === String(id));
        if (match && match.text && match.text.trim()) has_narrative_text = true;
      } catch {
        /* db lookup fallback ignore */
      }
    }

    if (has_narrative_text) {
      await ctx.session?.update_attachment(id, 0, {
        src: null,
        metadata: { ...metadata, failed: true, error: "Image beat was dropped before it could resolve." },
      });
      return;
    }

    await ctx.session?.delete_entry(id);
    ctx.session?.remove?.(key);
    ctx.session?.remove?.(id);
  } catch (error) {
    console.warn("[ImageQueue] Failed to mark image placeholder as failed:", error);
  }
}

export async function sweep_stale_ghosts(ctx) {
  try {
    const story_id = ctx.session?.active_id;
    if (!story_id) return;

    const entries = await ctx.session?.load_log(story_id);
    if (!entries) return;
    const now = Date.now();

    for (const entry of entries) {
      const attachments = entry?.attachments || [];
      for (let attachment_index = 0; attachment_index < attachments.length; attachment_index++) {
        const attachment = attachments[attachment_index];
        if (attachment && attachment.src == null) {
          if (is_generation_in_flight(entry.id, attachment_index)) continue;
          const is_failed = attachment.metadata?.failed === true || attachment.metadata?.image_ghost_swept === true;
          const requested_at = Number(attachment.metadata?.requested_at) || entry.created_at || 0;
          const is_stale = now - requested_at > TIMING_MS.CEILING;
          const is_empty_text = !entry.text || !entry.text.trim();

          if (is_empty_text && (is_failed || is_stale)) {
            await ctx.session?.delete_entry(entry.id);
            ctx.session?.remove?.(entry.id);
          } else if (is_stale && !is_failed) {
            await ctx.session?.update_attachment(entry.id, attachment_index, {
              src: null,
              metadata: { ...(attachment.metadata || {}), failed: true, image_ghost_swept: true, error: "Image beat timed out before it could resolve." },
            });
          }
        }
      }
    }
  } catch {
    /* sweep must never throw into trigger execution */
  }
}

// ============================================================================
// [SECTION 4: IMAGE SERVICE FACADE]
// ============================================================================

export class VisualEngine {
  async generate(target, options = {}) {
    const mode = options.mode || "solo_entity";
    const tier_resolution = get_resolution_string(mode);
    return await dispatch_visual_generation(
      {
        prompt: typeof target === "string" ? target : options.prompt || "",
        negative_prompt: options.negative_prompt,
        resolution: options.resolution || tier_resolution,
        mode,
        guidance_scale: options.guidance_scale,
        seed: options.seed,
      },
      options,
    );
  }

  async visualize(text, tier, options = {}, ctx = {}) {
    const base_prompt = typeof text === "string" ? text : options.prompt || "Narrative scene";
    const tier_resolution = get_resolution_string(tier);
    const style_key = resolve_story_beat_style({
      style: options.style,
      app_style: options.app_style ?? ctx.app?.settings?.visual_style,
      fractal_style: options.fractal_style ?? ctx.session?.active_fractal?.visual_style,
      entity: options.entity,
    });
    const staged = [base_prompt, options.visual_staging].filter((part) => part && String(part).trim()).join(" ");
    const composed = compose_story_beat_prompt(staged, style_key, options.negative_prompt || "");
    const dispatched = await dispatch_visual_generation(
      {
        prompt: composed.prompt,
        negative_prompt: composed.negative_prompt,
        resolution: options.resolution || tier_resolution,
        mode: tier,
        guidance_scale: options.guidance_scale,
        seed: options.seed,
      },
      options,
    );
    return { image_url: dispatched.image_url, seed: dispatched.seed, refined_prompt: composed.prompt, metadata: { ...dispatched.metadata, style_key } };
  }

  async generate_candidates(prompt, options = {}) {
    const count = options.count ?? 3;
    const base_options = {
      mode: options.mode || "solo_entity",
      negative_prompt: options.negative_prompt,
      resolution: options.resolution,
      guidance_scale: options.guidance_scale,
    };

    const attempts = [];
    for (let index = 0; index < count; index++) {
      attempts.push(
        this.generate(prompt, { ...base_options })
          .then((payload) => {
            if (payload?.image_url) return { index, url: payload.image_url, metadata: payload.metadata || {} };
            return null;
          })
          .catch(() => null),
      );
    }
    const settled = await Promise.all(attempts);
    return settled.filter(Boolean);
  }
}

export const visual_engine = new VisualEngine();

/**
 * Runs a promise against the ceiling timeout and clears the timer on settlement.
 * @template T
 * @param {Promise<T>} work
 * @returns {Promise<T>}
 */
function with_resolve_timeout(work) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("IMAGE_RESOLVE_TIMEOUT")), TIMING_MS.CEILING);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

export async function spawn_image_beat(tier, options = {}, ctx) {
  const { explicit = false, source = "dynamics", prompt = "", visual_staging = "", engine = null } = options;
  if (!tier || !IMAGE_TIERS.includes(tier)) return;

  const session_state = ctx.session || {};
  const visual_prompt = String(prompt || "").trim() || "A significant narrative moment unfolds.";
  const fractal_name = session_state.active_fractal?.name || "Fractal";

  try {
    await sweep_stale_ghosts(ctx);
    const pending_ghosts = await count_pending_ghosts(ctx);

    if (pending_ghosts >= IMAGE_POLICY.MAX_PENDING_IMAGES) {
      console.warn(`[Image Trigger] Skipped ${tier} - ${pending_ghosts} unresolved image beats pending (hard cap ${IMAGE_POLICY.MAX_PENDING_IMAGES}).`);
      return;
    }

    const placeholder_metadata = { mode: tier, image_source: source, image_explicit: explicit, requested_at: Date.now() };
    const placeholder_entry = await ctx.session?.log_message("", "fractal", fractal_name, {
      turn_type: "SYSTEM_TURN",
      attachments: [{ src: null, metadata: placeholder_metadata }],
    });
    if (!placeholder_entry?.id) return;

    _image_generation_queue.push({ id: placeholder_entry.id, tier, source, metadata: placeholder_metadata });
    if (_image_generation_queue.length > IMAGE_POLICY.MAX_PENDING_IMAGES) {
      const evicted = _image_generation_queue.shift();
      if (evicted?.id) {
        await mark_placeholder_failed(evicted.id, evicted.metadata, ctx);
      }
    }

    mark_generation_in_flight(placeholder_entry.id, 0);
    const resolve_placeholder = async () => {
      try {
        const active_engine = engine?.visualize ? engine : visual_engine;
        const result = await with_resolve_timeout(active_engine.visualize(visual_prompt, tier, { silent: true, visual_staging }, ctx));

        _remove_from_image_generation_queue(placeholder_entry.id);

        if (result?.image_url) {
          await ctx.session?.update_attachment(placeholder_entry.id, 0, {
            src: result.image_url,
            metadata: { mode: tier, image_source: source, ...result.metadata, prompt: result.refined_prompt },
          });
        } else {
          await mark_placeholder_failed(placeholder_entry.id, placeholder_metadata, ctx);
          console.warn(`[Image Trigger] ${tier} generation returned no image.`);
        }
      } catch (error) {
        _remove_from_image_generation_queue(placeholder_entry.id);
        await mark_placeholder_failed(placeholder_entry.id, placeholder_metadata, ctx);
        throw error;
      } finally {
        clear_generation_in_flight(placeholder_entry.id, 0);
      }
    };

    resolve_placeholder().catch((error) => {
      console.warn(`[Image Trigger] Background resolution failed for beat ${placeholder_entry.id}:`, error);
    });
  } catch (error) {
    console.warn("[Image Trigger] Failed to spawn image beat:", error);
  }
}
