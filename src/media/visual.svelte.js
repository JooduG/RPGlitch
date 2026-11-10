/**
 * @file src/media/visual.svelte.js
 * 👁️ SENSORY CORTEX — STATELESS PERCHANCE IMAGE DISPATCHER
 *
 * Greenfield stateless visual generation dispatcher.
 * Handles host engine discovery across window/iframe boundaries, exponential backoff,
 * circuit breaking, cancellation via AbortSignal, and queue / in-flight bookkeeping.
 */

import { generate_secure_seed, CircuitBreaker, ExponentialBackoffRetryer, state_bridge } from "@utils";
import { IMAGE_TIERS, get_resolution_string } from "./optics.js";
import { get_visual_style } from "../definitions/visual-styles.js";
import { IMAGE_POLICY, TIMING_MS } from "../config.js";

// ============================================================================
// Visual prompt hygiene.
//
// The host text-to-image plugin evaluates prompt text as Perchance template
// syntax, where `{...}` / `[...]` are structural. A raw visualizer JSON blob
// (or a decapitated fragment of one) stored as the prompt therefore throws a
// curly-bracket mismatch downstream. These helpers keep that from happening:
// rescue prose out of JSON-shaped text, reject unusable leftovers, and strip
// stray template-significant characters before dispatch.
// ============================================================================

const VISUAL_JSON_PROMPT_RE = /"prompt"\s*:\s*"((?:[^"\\]|\\.)*)"/i;
const VISUAL_JSON_NEG_RE = /"negative(?:Prompt|_prompt)"\s*:\s*"((?:[^"\\]|\\.)*)"/i;

function unescape_visual_json_value(value) {
  return String(value || "")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n");
}

/** True when text still carries visualizer JSON structure instead of prose. */
function looks_like_visual_json(text) {
  const t = String(text || "");
  return t.includes("_thought_process") || /"(negative_?prompt|prompt)"\s*:/i.test(t);
}

/**
 * Rescues image prose out of a persisted raw-JSON blob (or a fragment of one
 * whose opener was stripped upstream — prose then runs up to the negative
 * key). Returns the input unchanged when it is already prose.
 */
export function rescue_visual_prose(text) {
  const t = String(text || "");
  if (!looks_like_visual_json(t)) return t;
  const full = VISUAL_JSON_PROMPT_RE.exec(t);
  if (full && full[1]) {
    const prose = unescape_visual_json_value(full[1]).trim();
    if (prose && !looks_like_visual_json(prose)) return prose;
  }
  const neg = VISUAL_JSON_NEG_RE.exec(t);
  if (neg && typeof neg.index === "number") {
    const head = unescape_visual_json_value(t.slice(0, neg.index))
      .replace(/["\s,]+$/, "")
      .trim();
    if (head && !looks_like_visual_json(head)) return head;
  }
  return t;
}

/**
 * Makes prompt text safe for the template-evaluating image plugin: rescues
 * prose out of JSON-shaped leftovers, strips '@' prefixes from @TARGET-style
 * tokens (preserving the entity/target name), then drops `{`/`}`/`[`/`]`
 * (which would otherwise be parsed as template syntax and throw).
 */
export function sanitize_visual_text(text) {
  return rescue_visual_prose(text)
    .replace(/@([A-Za-z0-9_-]+)/g, "$1")
    .replace(/[{}[\]]/g, "")
    .replace(/,\s*\./g, ",")
    .replace(/\.\s*,/g, ",");
}

/**
 * Resolves the visual style key governing a story image beat.
 * Precedence mirrors envision(): explicit option > app-level choice >
 * active fractal (which carries the story-level override, else its own) >
 * caller-asserted subject entity > "none".
 * NOTE: entity flavor is deliberately last — story-level coherence wins for
 * beats (a story-wide monochrome stays monochrome); per-entity styles still
 * govern profile pictures via envision().
 */
export function resolve_story_beat_style(options = {}) {
  const explicit = options.style || options.app_style;
  if (explicit && explicit !== "none" && explicit !== "default") return explicit;
  const app_choice = state_bridge.app?.settings?.visual_style;
  if (app_choice && app_choice !== "none" && app_choice !== "default") return app_choice;
  const fractal_style = state_bridge.runtime?.active_fractal?.visual_style;
  if (fractal_style && fractal_style !== "none" && fractal_style !== "default") return fractal_style;
  const entity_style = options.entity?.visual_style;
  if (entity_style && entity_style !== "none" && entity_style !== "default") return entity_style;
  return "none";
}

/**
 * Composes the final story-beat image prompt: prose + staging directive +
 * style engine tokens, with the style negative over the baseline floor.
 * Story beats never inherit the solo-portrait "empty background" guard —
 * characters belong in scenes here.
 */
export function compose_story_beat_prompt(prompt_text, style_key, base_negative = "") {
  const style_def = get_visual_style(style_key);
  let prompt = String(prompt_text || "").trim();
  const negatives = [];
  if (String(base_negative || "").trim()) negatives.push(String(base_negative).trim());
  if (style_def && style_key !== "none") {
    const medium = style_def.engine?.medium || "";
    const tokens = [
      style_def.engine?.medium,
      style_def.engine?.palette,
      style_def.engine?.camera,
      style_def.engine?.composition,
      style_def.engine?.texture,
    ]
      .filter(Boolean)
      .join(", ");
    // Style tokens lead: image models weight early tokens most, and story
    // prose is saturated with color words that would otherwise drown a style
    // coda. The medium dedupe still guards against double-injection.
    if (tokens && (!medium || !prompt.toLowerCase().includes(medium.toLowerCase()))) {
      prompt = prompt ? `${tokens}, ${prompt}` : tokens;
    }
    if (style_def.negative_prompt) negatives.push(style_def.negative_prompt);
  }
  const floor = get_visual_style("none")?.negative_prompt;
  if (floor) negatives.push(floor);
  return {
    prompt: sanitize_visual_text(prompt),
    negative_prompt: sanitize_visual_text(negatives.filter(Boolean).join(", ")),
  };
}

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
  const {
    prompt: raw_prompt,
    negative_prompt: raw_negative_prompt = "",
    resolution = "512x768",
    guidance_scale = 7,
    seed: explicit_seed,
  } = payload || {};
  // The host image plugin evaluates prompt text as Perchance template syntax
  // (`{...}` / `[...]` are structural). Sanitize first so a persisted raw-JSON
  // blob or stray braces can never throw a curly-bracket mismatch downstream.
  const prompt = sanitize_visual_text(raw_prompt);
  const negative_prompt = sanitize_visual_text(raw_negative_prompt);
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
          const is_stale = now - requested_at > TIMING_MS.CEILING;
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
    const mode = options.mode || "solo_entity";
    const tier_resolution = get_resolution_string(mode);
    const dispatched = await dispatch_visual_generation(
      {
        prompt: typeof target === "string" ? target : options.prompt || "",
        negative_prompt: options.negative_prompt,
        resolution: options.resolution || tier_resolution,
        guidance_scale: options.guidance_scale,
        seed: options.seed,
      },
      options,
    );
    return {
      ...dispatched,
      url: dispatched.image_url,
    };
  }

  async visualize(story_id, text, tier, options = {}) {
    const base_prompt = typeof text === "string" ? text : options.prompt || "Narrative scene";
    const tier_resolution = get_resolution_string(tier);
    // Story beats previously dispatched raw model prose with no style tokens
    // and no negative — and dropped visual_staging entirely. Compose everything
    // here so all callers (beats, prologue/finale scenes, manual photos) are covered.
    const staged = [base_prompt, options.visual_staging].filter((part) => part && String(part).trim()).join(" ");
    const style_key = resolve_story_beat_style(options);
    const composed = compose_story_beat_prompt(staged, style_key, options.negative_prompt || "");
    const dispatched = await dispatch_visual_generation(
      {
        prompt: composed.prompt,
        negative_prompt: composed.negative_prompt,
        resolution: options.resolution || tier_resolution,
        guidance_scale: options.guidance_scale,
        seed: options.seed,
      },
      options,
    );
    return {
      imageUrl: dispatched.image_url,
      image_url: dispatched.image_url,
      seed: dispatched.seed,
      refinedPrompt: composed.prompt,
      refined_prompt: composed.prompt,
      metadata: { ...dispatched.metadata, style_key },
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
   * Style Precedence:
   * 1. Explicit app_style (if provided and != "none" / "default") wins as the user's active camera choice.
   * 2. Otherwise entity.visual_style (if != "none" / "default").
   * 3. Otherwise active_fractal.visual_style (if != "none" / "default").
   * 4. Otherwise "none" (Unstyled Draft).
   *
   * @param {string} text - Raw natural language intent or draft prompt
   * @param {string} [type="character"] - Entity type or generation mode ("character", "fractal", "story_scene", etc.)
   * @param {object} [entity=null] - Target entity snapshot (if available)
   * @param {string|null} [app_style=null] - User-selected app-level visual style (e.g. from app.settings.visual_style)
   * @returns {Promise<{ prompt: string, negative_prompt: string, resolution?: string }>}
   */
  async envision(text, type = "character", entity = null, app_style = null) {
    if (!text || typeof text !== "string") {
      return { prompt: "", negative_prompt: "" };
    }

    const { execute_visualizer_envision } = await import("@engine");
    return execute_visualizer_envision(text, type, entity, app_style);
  }
}

export const visual_engine = new VisualEngine();

export async function spawn_image_beat(tier, options = {}) {
  const { explicit = false, source = "dynamics", prompt = "", visual_staging = "", engine = null } = options;
  if (!tier || !IMAGE_TIERS.includes(tier)) return;

  const runtime_state = state_bridge.runtime || {};
  const visual_prompt = String(prompt || "").trim() || "A significant narrative moment unfolds.";
  const fractal_name = runtime_state.active_fractal?.name || "Fractal";

  try {
    await sweep_stale_ghosts();
    const pending_ghosts = await count_pending_ghosts();

    if (pending_ghosts >= IMAGE_POLICY.MAX_PENDING_IMAGES) {
      state_bridge.app?.log(
        `[Image Trigger] Skipped ${tier} — ${pending_ghosts} unresolved image beats pending (hard cap ${IMAGE_POLICY.MAX_PENDING_IMAGES}).`,
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
    if (_image_generation_queue.length > IMAGE_POLICY.MAX_PENDING_IMAGES) {
      const evicted = _image_generation_queue.shift();
      if (evicted?.id) {
        await mark_placeholder_failed(evicted.id, evicted.metadata);
      }
    }

    mark_generation_in_flight(placeholder_entry.id, 0);
    const resolve_placeholder = async () => {
      try {
        let active_engine = engine || visual_engine;
        try {
          const media_barrel = await import("./index.js");
          if (media_barrel?.visual_engine) active_engine = engine || media_barrel.visual_engine;
        } catch {
          /* fallback to visual_engine */
        }

        let result;
        if (active_engine?.visualize) {
          result = await Promise.race([
            active_engine.visualize(runtime_state.story_id, visual_prompt, tier, { silent: true, visual_staging }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("IMAGE_RESOLVE_TIMEOUT")), TIMING_MS.CEILING)),
          ]);
        } else {
          const fallback_style = resolve_story_beat_style({});
          const fallback_composed = compose_story_beat_prompt(
            [visual_prompt, visual_staging].filter((part) => part && String(part).trim()).join(" "),
            fallback_style,
          );
          const dispatched = await Promise.race([
            dispatch_visual_generation({ prompt: fallback_composed.prompt, negative_prompt: fallback_composed.negative_prompt }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("IMAGE_RESOLVE_TIMEOUT")), TIMING_MS.CEILING)),
          ]);
          result = {
            imageUrl: dispatched.image_url,
            metadata: { ...dispatched.metadata, style_key: fallback_style },
            refinedPrompt: fallback_composed.prompt,
          };
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
