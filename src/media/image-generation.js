/**
 * @file src/media/image-generation.js
 * 👁️ SENSORY CORTEX - STATELESS PERCHANCE IMAGE DISPATCHER (Rank 2, media)
 *
 * Stateless visual generation dispatcher (`visual_engine`), in-flight
 * attachment locks (`mark_generation_in_flight`, `clear_generation_in_flight`,
 * `reset_generation_in_flight`), and single-pass ghost sweep
 * (`sweep_stale_ghosts`).
 *
 * Prompt builders (`sanitize_visual_text`, `get_resolution_string`) live
 * canonically in `@simulation`. Cross-cutting session context arrives as an
 * explicit `{ session }` `ctx` parameter so media never imports `@engine` or
 * `@state` (Rank 2 cannot import Rank 3 or Rank 4).
 */

import { TIMING_MS } from "@config";
import { get_resolution_string, sanitize_visual_text } from "@simulation";
import { CircuitBreaker, generate_secure_seed, resolve_perchance_plugin } from "@utils";

// ============================================================================
// [SECTION 1: RESILIENCE & DISPATCHER]
// ============================================================================

const visual_circuit_breaker = new CircuitBreaker();

/**
 * Generates an offline SVG data URI fallback for test/offline environments.
 * Renders a neutral label on purpose: the prompt text can contain spoilers
 * (character names, scene beats) and must never show in the feed.
 * @param {string} resolution
 * @returns {string}
 */
function create_offline_svg(resolution) {
  const [width_str, height_str] = String(resolution).split("x");
  const width = parseInt(width_str, 10) || 512;
  const height = parseInt(height_str, 10) || 768;
  const label = "Offline visual preview";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#1a1a24"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#8888aa" font-family="monospace" font-size="14">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Stops a pending Perchance generation promise and suppresses unhandled rejections.
 * @param {any} pending
 */
function stop_pending(pending) {
  try {
    if (typeof pending?.stop === "function") pending.stop();
  } catch {
    /* best-effort cancellation */
  }
  if (typeof pending?.then === "function") pending.then(null, () => {});
}

/**
 * Runs one plugin attempt against the ceiling timeout.
 * @template T
 * @param {Promise<T>} pending
 * @param {AbortSignal | null} [signal=null]
 * @returns {Promise<T>}
 */
function with_attempt_timeout(pending, signal = null) {
  let timer;
  let on_abort = null;
  const timeout = new Promise((_, reject) => {
    const abort_error = new DOMException("Image generation aborted by user.", "AbortError");
    if (signal?.aborted) {
      reject(abort_error);
      return;
    }
    timer = setTimeout(() => {
      stop_pending(pending);
      reject(new Error("IMAGE_ATTEMPT_TIMEOUT: Engine did not settle in time."));
    }, TIMING_MS.CEILING);
    if (signal) {
      on_abort = () => {
        clearTimeout(timer);
        stop_pending(pending);
        reject(abort_error);
      };
      signal.addEventListener("abort", on_abort, { once: true });
    }
  });
  return Promise.race([pending, timeout]).finally(() => {
    clearTimeout(timer);
    if (signal && on_abort) signal.removeEventListener("abort", on_abort);
  });
}

/**
 * Stateless visual generation dispatcher.
 * @param {Object} payload
 * @param {string} payload.prompt
 * @param {string} [payload.negative_prompt]
 * @param {string} [payload.resolution]
 * @param {number} [payload.seed]
 * @param {Object} [options={}]
 * @param {AbortSignal} [options.signal]
 * @param {Function} [options.engine] - Injectable mock engine for testing
 * @returns {Promise<{ image_url: string, seed: number, metadata: Record<string, any> }>}
 */
async function dispatch_visual_generation(payload, options = {}) {
  const { prompt: raw_prompt, negative_prompt: raw_negative_prompt = "", resolution = "512x768", seed: explicit_seed } = payload || {};

  // The host image plugin evaluates prompt text as Perchance template syntax
  // (`{...}` / `[...]` are structural). Sanitize first so a persisted raw-JSON
  // blob or stray braces can never throw a curly-bracket mismatch downstream.
  const prompt = sanitize_visual_text(raw_prompt);
  const negative_prompt = sanitize_visual_text(raw_negative_prompt);
  const seed = explicit_seed ?? generate_secure_seed();

  if (options.signal?.aborted) {
    throw new DOMException("Image generation aborted by user.", "AbortError");
  }

  const raw_engine = options.engine || resolve_perchance_plugin("generate_image");

  if (!raw_engine) {
    return { image_url: create_offline_svg(resolution), seed, metadata: { resolution, seed, offline: true } };
  }

  const execute_attempt = async () => {
    if (options.signal?.aborted) {
      throw new DOMException("Image generation aborted by user.", "AbortError");
    }

    let result = raw_engine({ prompt, negativePrompt: negative_prompt, resolution, seed });
    if (result && typeof result.then === "function") {
      result = await with_attempt_timeout(result, options.signal);
    }

    const image_url = typeof result === "string" ? result : result?.dataUrl;
    if (!image_url) {
      throw new Error("EMPTY_IMAGE_RESPONSE: Engine returned no image URL");
    }

    const resolved_seed = typeof result === "object" && result?.inputs?.seed != null ? Number(result.inputs.seed) : seed;
    return { image_url, seed: resolved_seed, metadata: { resolution, seed: resolved_seed, offline: false } };
  };

  return await visual_circuit_breaker.execute(execute_attempt);
}

// ============================================================================
// [SECTION 2: IN-FLIGHT BOOKKEEPING & GHOST SWEEP]
// ============================================================================

const _in_flight_image_generations = new Set();

export function mark_generation_in_flight(id, attachment_index = 0) {
  if (id == null) return;
  _in_flight_image_generations.add(`${id}:${attachment_index}`);
}

export function clear_generation_in_flight(id, attachment_index = 0) {
  if (id == null) return;
  _in_flight_image_generations.delete(`${id}:${attachment_index}`);
}

export function reset_generation_in_flight() {
  _in_flight_image_generations.clear();
  visual_circuit_breaker.reset();
}

/**
 * Sweeps stale unresolved image placeholders and returns the remaining active
 * pending ghost count in a single IndexedDB pass.
 * @param {{ session?: any }} ctx
 * @returns {Promise<number>}
 */
export async function sweep_stale_ghosts(ctx) {
  try {
    const story_id = ctx.session?.active_id;
    if (!story_id) return 0;

    const entries = await ctx.session?.load_log(story_id);
    if (!entries) return 0;
    const now = Date.now();
    let pending_count = 0;

    for (const entry of entries) {
      const attachments = entry?.attachments || [];
      for (let attachment_index = 0; attachment_index < attachments.length; attachment_index++) {
        const attachment = attachments[attachment_index];
        if (!attachment || attachment.src != null) continue;

        if (_in_flight_image_generations.has(`${entry.id}:${attachment_index}`)) {
          pending_count++;
          continue;
        }

        const is_failed = attachment.metadata?.failed === true || attachment.metadata?.image_ghost_swept === true;
        const requested_at = Number(attachment.metadata?.requested_at) || entry.created_at || 0;
        const is_stale = now - requested_at > TIMING_MS.CEILING;
        const is_empty_text = !entry.text || !entry.text.trim();
        const is_prologue_image = entry.meta?.is_prologue_image === true;

        if (is_empty_text && (is_failed || is_stale)) {
          if (is_prologue_image) {
            // Preserve failed prologue scene image row so user can retry or remove manually
            if (!is_failed) {
              await ctx.session?.update_attachment(entry.id, attachment_index, {
                src: null,
                metadata: { ...(attachment.metadata || {}), failed: true, image_ghost_swept: true, error: "Prologue image timed out." },
              });
            }
          } else {
            await ctx.session?.delete_entry(entry.id);
          }
        } else if (is_stale && !is_failed) {
          await ctx.session?.update_attachment(entry.id, attachment_index, {
            src: null,
            metadata: { ...(attachment.metadata || {}), failed: true, image_ghost_swept: true, error: "Image beat timed out before it could resolve." },
          });
        } else if (!is_failed) {
          pending_count++;
        }
      }
    }
    return pending_count;
  } catch {
    /* sweep must never throw into trigger execution */
    return 0;
  }
}

// ============================================================================
// [SECTION 3: VISUAL ENGINE FACADE]
// ============================================================================

export const visual_engine = {
  async generate(target, options = {}) {
    const mode = options.mode || "solo_entity";
    return await dispatch_visual_generation(
      {
        prompt: typeof target === "string" ? target : options.prompt || "",
        negative_prompt: options.negative_prompt,
        resolution: options.resolution || get_resolution_string(mode),
        seed: options.seed,
      },
      options,
    );
  },

  async generate_candidates(prompt, options = {}) {
    const count = options.count ?? 3;
    const base_options = {
      mode: options.mode || "solo_entity",
      negative_prompt: options.negative_prompt,
      resolution: options.resolution,
      signal: options.signal,
    };
    const settled = await Promise.all(
      Array.from({ length: count }, (_, index) =>
        visual_engine
          .generate(prompt, base_options)
          .then((payload) => (payload?.image_url ? { index, url: payload.image_url, metadata: payload.metadata || {} } : null))
          .catch(() => null),
      ),
    );
    return settled.filter(Boolean);
  },
};
