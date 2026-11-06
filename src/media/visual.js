/**
 * @file src/media/visual.js
 * 👁️ SENSORY CORTEX — STATELESS PERCHANCE IMAGE DISPATCHER
 *
 * Greenfield stateless visual generation dispatcher.
 * Handles host engine discovery across window/iframe boundaries, exponential backoff,
 * circuit breaking, cancellation via AbortSignal, and queue / in-flight bookkeeping.
 */

import { generate_secure_seed, strip_cognition_blocks, CircuitBreaker, ExponentialBackoffRetryer, state_bridge } from "@utils";
import { IMAGE_TIERS } from "./optics.js";
import { llm_service } from "@platform";
import { compile_prompt } from "../engine/prompts.js";
import { get_visual_style } from "../data/definitions/visual-styles.js";

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

export function reset_cached_image_engine() {
  cached_image_engine = null;
}

// ============================================================================
// [SECTION 2: RESILIENCE & DISPATCHER]
// ============================================================================

const visual_circuit_breaker = new CircuitBreaker({
  failure_threshold: 3,
  success_threshold: 2,
  recovery_timeout: 30000,
});

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
 * Greenfield stateless visual generation dispatcher.
 * @param {Object} payload
 * @param {string} payload.prompt
 * @param {string} [payload.negative_prompt]
 * @param {string} [payload.resolution]
 * @param {number} [payload.guidance_scale]
 * @param {number} [payload.seed]
 * @param {Object} [options={}]
 * @param {AbortSignal} [options.signal]
 * @param {Function} [options.engine] - Injectable mock engine for testing
 * @returns {Promise<{ image_url: string, seed: number, metadata: Record<string, any> }>}
 */
export async function dispatch_visual_generation(payload, options = {}) {
  const { prompt, negative_prompt = "", resolution = "512x768", guidance_scale = 7, seed: explicit_seed } = payload || {};
  const seed = explicit_seed != null ? explicit_seed : generate_secure_seed();
  const [width_str, height_str] = String(resolution).split("x");
  const width = parseInt(width_str, 10) || 512;
  const height = parseInt(height_str, 10) || 768;

  if (options.signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  // Check circuit breaker
  if (visual_circuit_breaker.is_open) {
    throw new Error("CIRCUIT_BREAKER_OPEN: Visual generation temporarily disabled due to consecutive failures.");
  }

  const raw_engine = options.engine || find_image_engine();

  // If no host engine available, return test fallback
  if (!raw_engine) {
    return {
      image_url: create_offline_svg(prompt, width, height),
      seed,
      metadata: {
        offline: true,
        resolution,
        guidance_scale,
      },
    };
  }

  const execute_attempt = async () => {
    if (options.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const engine_arguments = {
      prompt,
      negativePrompt: negative_prompt,
      resolution,
      guidanceScale: guidance_scale,
      seed,
    };

    let result = raw_engine(engine_arguments);
    if (result && typeof result.then === "function") {
      result = await result;
    }

    const image_url = typeof result === "string" ? result : result?.dataUrl || result?.url || result?.imageUrl || result?.image_url || result?.image;
    if (!image_url) {
      throw new Error("EMPTY_IMAGE_RESPONSE: Engine returned no image URL");
    }

    return {
      image_url,
      seed,
      metadata: {
        resolution,
        guidance_scale,
        offline: false,
      },
    };
  };

  const response = await visual_circuit_breaker.execute(() => visual_retryer.retry(execute_attempt));
  return response;
}

// ============================================================================
// [SECTION 3: IN-FLIGHT BOOKKEEPING & QUEUE]
// ============================================================================

export const _in_flight_image_generations = new Set();
export const _image_generation_queue = [];

export const IMAGE_GENERATION_QUEUE_CAPACITY = 5;
export const IMAGE_PLACEHOLDER_HARD_CAP = 5;
export const IMAGE_RESOLVE_TIMEOUT_MS = 120000;
export const IMAGE_GHOST_MAX_AGE_MS = 2 * 60 * 1000;

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

export async function count_pending_ghosts() {
  try {
    const story_id = state_bridge.runtime?.story_id;
    if (!story_id) return 0;

    const entries = await state_bridge.session_driver?.load_log(story_id);
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
        const database_entries = await state_bridge.session_driver?.load_log(current_story_id);
        const match = database_entries?.find((entry) => entry.id === key || entry.id === id || String(entry.id) === String(id));
        if (match && match.text && match.text.trim()) has_narrative_text = true;
      } catch {
        /* db lookup fallback ignore */
      }
    }

    if (has_narrative_text) {
      await state_bridge.session_driver?.update_log_attachment(id, 0, {
        src: null,
        metadata: { ...metadata, failed: true, error: "Image beat was dropped before it could resolve." },
      });
      return;
    }

    await state_bridge.session_driver?.delete_log_entry(id);
    state_bridge.simulation_log?.remove?.(key);
    state_bridge.simulation_log?.remove?.(id);
  } catch (error) {
    console.warn("[ImageQueue] Failed to mark image placeholder as failed:", error);
  }
}

export async function sweep_stale_ghosts() {
  try {
    const story_id = state_bridge.runtime?.story_id;
    if (!story_id) return;

    const entries = await state_bridge.session_driver?.load_log(story_id);
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
          const is_stale = now - requested_at > IMAGE_GHOST_MAX_AGE_MS;
          const is_empty_text = !entry.text || !entry.text.trim();

          if (is_empty_text && (is_failed || is_stale)) {
            await state_bridge.session_driver?.delete_log_entry(entry.id);
            state_bridge.simulation_log?.remove?.(entry.id);
          } else if (is_stale && !is_failed) {
            await state_bridge.session_driver?.update_log_attachment(entry.id, attachment_index, {
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

// ============================================================================
// [SECTION 4: TRANSITIONAL COMPATIBILITY FACADE]
// ============================================================================

export class VisualEngine {
  is_loading = false;
  error = null;
  attempts = 0;
  is_offline = false;

  async generate(target, options = {}) {
    return dispatch_visual_generation(
      {
        prompt: typeof target === "string" ? target : options.prompt || "",
        negative_prompt: options.negative_prompt,
        resolution: options.resolution,
        guidance_scale: options.guidance_scale,
        seed: options.seed,
      },
      options,
    );
  }

  async visualize(story_id, text, tier, options = {}) {
    const prompt = typeof text === "string" ? text : options.prompt || "Narrative scene";
    const dispatched = await dispatch_visual_generation(
      {
        prompt,
        negative_prompt: options.negative_prompt,
        resolution: options.resolution,
        guidance_scale: options.guidance_scale,
        seed: options.seed,
      },
      options,
    );
    return {
      imageUrl: dispatched.image_url,
      image_url: dispatched.image_url,
      seed: dispatched.seed,
      refinedPrompt: prompt,
      refined_prompt: prompt,
      metadata: dispatched.metadata,
    };
  }

  async generate_candidates(prompt, options = {}) {
    const count = options.count ?? 3;
    const base_options = {
      mode: options.mode || "character",
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

  /**
   * Refines draft prompt text via the greenfield Visualizer Purpose Core.
   * If style has `llm_refine === false`, bypasses the LLM and returns the prompt untouched.
   *
   * @param {string} text - Raw natural language intent or draft prompt
   * @param {string} [type="character"] - Entity type or generation mode ("character", "fractal", "story_scene", etc.)
   * @param {object} [entity=null] - Target entity snapshot (if available)
   * @returns {Promise<{ prompt: string, negative_prompt: string, resolution?: string }>}
   */
  async enhance(text, type = "character", entity = null) {
    if (!text || typeof text !== "string") {
      return { prompt: "", negative_prompt: "" };
    }

    // Check style-level bypass (default true; explicit false bypasses LLM)
    const style_key = entity?.visual_style || state_bridge.runtime?.active_fractal?.visual_style || "none";
    const style_def = get_visual_style(style_key);
    if (style_def && style_def.llm_refine === false) {
      return { prompt: text.trim(), negative_prompt: style_def.negative_prompt || "" };
    }

    try {
      const runtime_state = state_bridge.runtime || {};
      const target_entity = entity || (type === "fractal" ? runtime_state.active_fractal : runtime_state.active_ai);

      const system = compile_prompt({
        core: "visualizer",
        round: runtime_state.round || 1,
        entities: {
          AI: type !== "fractal" ? target_entity : runtime_state.active_ai,
          USER: runtime_state.active_user,
          FRACTAL: type === "fractal" ? target_entity : runtime_state.active_fractal,
        },
        task_options: {
          camera_note: text.trim(),
        },
      });

      const response = await llm_service.generate({ system, role: "model" }, { silent: true, priority: "background" });

      if (!response) {
        return { prompt: text.trim(), negative_prompt: "" };
      }

      // Peel JSON format from visualizer output
      const json_match = /\{[\s\S]*\}/.exec(String(response));
      if (json_match) {
        try {
          const parsed = JSON.parse(json_match[0]);
          if (parsed && typeof parsed.prompt === "string" && parsed.prompt.trim()) {
            return {
              prompt: parsed.prompt.trim(),
              negative_prompt: typeof parsed.negative_prompt === "string" ? parsed.negative_prompt.trim() : "",
              resolution: parsed.resolution,
            };
          }
        } catch (_json_err) {
          /* Fall back to regex/text extraction */
        }
      }

      // Emergency fallback: strip think blocks and cleanup text
      const cleaned = strip_cognition_blocks(String(response)).trim();
      return { prompt: cleaned || text.trim(), negative_prompt: "" };
    } catch (err) {
      console.warn("[VisualEngine.enhance] Visualizer refinement failed, using draft:", err);
      return { prompt: text.trim(), negative_prompt: "" };
    }
  }
}

export const visual_engine = new VisualEngine();

let _default_visual_engine = visual_engine;

export function register_default_visual_engine(engine) {
  _default_visual_engine = engine;
}

export function get_default_visual_engine() {
  return _default_visual_engine;
}

export async function spawn_image_beat(tier, options = {}) {
  const { explicit = false, source = "dynamics", prompt = "", visual_staging = "", engine = null } = options;
  if (!tier || !IMAGE_TIERS.includes(tier)) return;

  const runtime_state = state_bridge.runtime || {};
  const visual_prompt = String(prompt || "").trim() || "A significant narrative moment unfolds.";
  const fractal_name = runtime_state.active_fractal?.name || "Fractal";

  try {
    await sweep_stale_ghosts();
    const pending_ghosts = await count_pending_ghosts();

    if (pending_ghosts >= IMAGE_PLACEHOLDER_HARD_CAP) {
      state_bridge.app?.log(
        `[Image Trigger] Skipped ${tier} — ${pending_ghosts} unresolved image beats pending (hard cap ${IMAGE_PLACEHOLDER_HARD_CAP}).`,
        "warn",
      );
      return;
    }

    const placeholder_metadata = { mode: tier, image_source: source, image_explicit: explicit, requested_at: Date.now() };
    const placeholder_entry = await state_bridge.session_driver?.log_message("", "fractal", fractal_name, {
      turn_type: "SYSTEM_TURN",
      attachments: [{ src: null, metadata: placeholder_metadata }],
    });
    if (!placeholder_entry?.id) return;

    _image_generation_queue.push({ id: placeholder_entry.id, tier, source, metadata: placeholder_metadata });
    if (_image_generation_queue.length > IMAGE_GENERATION_QUEUE_CAPACITY) {
      const evicted = _image_generation_queue.shift();
      if (evicted?.id) {
        await mark_placeholder_failed(evicted.id, evicted.metadata);
      }
    }

    mark_generation_in_flight(placeholder_entry.id, 0);
    const resolve_placeholder = async () => {
      try {
        let active_engine = engine || _default_visual_engine;
        try {
          const media_barrel = await import("./index.js");
          if (media_barrel?.visual_engine) active_engine = engine || media_barrel.visual_engine;
        } catch {
          /* fallback to _default_visual_engine */
        }

        let result;
        if (active_engine?.visualize) {
          result = await Promise.race([
            active_engine.visualize(runtime_state.story_id, visual_prompt, tier, { silent: true, visual_staging }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("IMAGE_RESOLVE_TIMEOUT")), IMAGE_RESOLVE_TIMEOUT_MS)),
          ]);
        } else {
          const dispatched = await Promise.race([
            dispatch_visual_generation({ prompt: visual_prompt }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("IMAGE_RESOLVE_TIMEOUT")), IMAGE_RESOLVE_TIMEOUT_MS)),
          ]);
          result = { imageUrl: dispatched.image_url, metadata: dispatched.metadata, refinedPrompt: visual_prompt };
        }

        _remove_from_image_generation_queue(placeholder_entry.id);

        const resolved_image_url = result?.imageUrl || result?.image_url;
        const refined_prompt = result?.refinedPrompt || result?.refined_prompt;

        if (resolved_image_url) {
          await state_bridge.session_driver?.update_log_attachment(placeholder_entry.id, 0, {
            src: resolved_image_url,
            metadata: { mode: tier, image_source: source, ...result.metadata, prompt: refined_prompt },
          });
        } else {
          await mark_placeholder_failed(placeholder_entry.id, placeholder_metadata);
          state_bridge.app?.log(`[Image Trigger] ${tier} generation returned no image.`, "warn");
        }
      } catch (error) {
        _remove_from_image_generation_queue(placeholder_entry.id);
        await mark_placeholder_failed(placeholder_entry.id, placeholder_metadata);
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
