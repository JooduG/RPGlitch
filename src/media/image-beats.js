/**
 * @file src/media/image-beats.js
 * 🖼️ SENSORY CORTEX — IMAGE BEATS & PLACEHOLDER LIFECYCLE
 *
 * Core Responsibilities:
 * 1. Image Generation Queue & Concurrency Bounding:
 *    - Bounds background image generation queue (`_image_generation_queue`, capacity: 5).
 *    - Drops and marks evicted placeholder beats as failed on overflow.
 * 2. Ghost-Card Mitigation & Stale Sweeping:
 *    - Enforces hard limit on unresolved placeholders (`IMAGE_PLACEHOLDER_HARD_CAP = 5`).
 *    - Sweeps stale placeholders older than 2 minutes (`sweep_stale_ghosts`).
 * 3. Asynchronous Beat Lifecycle (`spawn_image_beat`):
 *    - Logs placeholder attachment immediately to avoid blocking narrative turns.
 *    - Executes background visualization via `visual_engine.visualize` with 120s timeout guard.
 *
 * Purity & Layer Rules:
 * - Background asynchronous job queue coordinator.
 * - Layer: Media (`src/media/`).
 * - Downward dependencies only: `visual.svelte.js`, `image-tiers.js`, and `@utils/state_bridge`.
 */

import { visual_engine } from "./visual.svelte.js";
import { IMAGE_TIERS } from "./image-tiers.js";
import { state_bridge } from "@utils";

// ============================================================================
// [SECTION 1: CONSTANTS & QUEUE MANAGEMENT]
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
 * Internal helper to remove a resolved or failed beat from the active queue.
 * @param {string | number} id
 */
export function _remove_from_image_generation_queue(id) {
  const index = _image_generation_queue.findIndex((entry) => entry.id === id);
  if (index !== -1) _image_generation_queue.splice(index, 1);
}

// ============================================================================
// [SECTION 2: GHOST PLACEHOLDER SWEEPING & FAILURE RECOVERY]
// ============================================================================

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
          const is_failed = attachment.metadata?.failed === true || attachment.metadata?.image_ghost_swept === true;
          const is_stale = now - (entry.created_at || 0) > IMAGE_GHOST_MAX_AGE_MS;
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

// ============================================================================
// [SECTION 3: IMAGE BEAT SPAWNER]
// ============================================================================

/**
 * Spawns an image beat: logs placeholder attachment and initiates background image generation.
 * @param {string} tier - One of the 4-tier targets (story_entities | story_character | solo_entity | story_scene).
 * @param {{ explicit?: boolean, source?: string, prompt?: string }} [options={}]
 * @returns {Promise<void>}
 */
export async function spawn_image_beat(tier, options = {}) {
  const { explicit = false, source = "dynamics", prompt = "", visual_staging = "" } = options;
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

    const placeholder_metadata = { mode: tier, image_source: source, image_explicit: explicit };
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

    const resolve_placeholder = async () => {
      try {
        const result = await Promise.race([
          visual_engine.visualize(runtime_state.story_id, visual_prompt, tier, { silent: true, visual_staging }),
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

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol:
 *   - Renamed queue constants and functions per Anti-Abbreviation Mandate (`_image_generation_queue`, `IMAGE_GENERATION_QUEUE_CAPACITY`, `get_image_generation_queue`, `reset_image_generation_queue`, `_remove_from_image_generation_queue`).
 *   - Enhanced variable and parameter naming (`attachment_index`, `has_narrative_text`, `database_entries`, `resolved_image_url`, `refined_prompt`).
 *   - Retained Universal File Architecture with complete header contracts and section dividers.
 *   - Enforced P4 Zero Backwards Compatibility across downstream consumers and tests.
 * - 2026-08-29: Applied ground-up /refactor protocol: added Universal File Architecture header block,
 *   structured 3 explicit section dividers, standardized parameter nomenclature (pending_ghosts, attachments),
 *   and verified unit test suite.
 * - 2026-08-29: Added get_image_generation_queue snapshot and reset_image_generation_queue helpers.
 * - 2026-08-28: Implemented 5-slot bounded image beat queue and ghost card sweeping.
 */
