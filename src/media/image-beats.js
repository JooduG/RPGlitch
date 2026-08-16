/**
 * src/media/image-beats.js
 * 🖼️ IMAGE BEATS — PLACEHOLDER & GENERATION LIFECYCLE
 * A "beat" is one queued image generation bound to a log placeholder. This
 * module spawns beats, bounds concurrency, and keeps the chat log honest:
 * every placeholder resolves to a real image or is marked failed, and stale
 * ghosts are swept.
 */
import { visual_engine } from "./visual.svelte.js";
import { IMAGE_TIERS } from "./image-tiers.js";
import { state_bridge } from "@utils";

// 🖼️ Image beat queue — bounds concurrent background image generations.
// When the queue reaches capacity the oldest beat is dropped and its placeholder
// is marked failed so evicted beats never leave permanent `src: null` ghost cards.
export const IMAGE_GEN_QUEUE_CAPACITY = 5;
export const _image_gen_queue = [];

// Ghost-card hard cap: at most this many unresolved (src:null) placeholders may
// exist in the log at once. Beyond it, new triggers are refused until resolution
// or the age-based sweep clears some — a permanent hard bound on ghost images.
export const IMAGE_PLACEHOLDER_HARD_CAP = 5;
export const IMAGE_RESOLVE_TIMEOUT_MS = 120000;
export const IMAGE_GHOST_MAX_AGE_MS = 2 * 60 * 1000;

/**
 * Counts unresolved image placeholders (src:null, not already marked failed) in
 * the current story's log.
 * @returns {Promise<number>}
 */
export async function count_pending_ghosts() {
  try {
    const story_id = state_bridge.runtime.story_id;
    if (!story_id) return 0;
    const entries = await state_bridge.session_driver.load_log(story_id);
    let count = 0;
    for (const entry of entries) {
      const atts = entry?.attachments || [];
      for (const a of atts) {
        if (a && a.src == null && !a.metadata?.failed) count++;
      }
    }
    return count;
  } catch (_err) {
    return 0;
  }
}

/**
 * Marks any placeholder older than IMAGE_GHOST_MAX_AGE_MS as failed and deletes
 * standalone empty-text ghost rows so hung or timed-out generations never linger.
 * @returns {Promise<void>}
 */
export async function sweep_stale_ghosts() {
  try {
    const story_id = state_bridge.runtime.story_id;
    if (!story_id) return;
    const entries = await state_bridge.session_driver.load_log(story_id);
    const now = Date.now();
    for (const entry of entries) {
      const atts = entry?.attachments || [];
      for (let i = 0; i < atts.length; i++) {
        const a = atts[i];
        if (a && a.src == null) {
          const is_failed = a.metadata?.failed === true || a.metadata?.image_ghost_swept === true;
          const is_stale = now - (entry.created_at || 0) > IMAGE_GHOST_MAX_AGE_MS;
          const is_empty_text = !entry.text || !entry.text.trim();
          if (is_empty_text && (is_failed || is_stale)) {
            await state_bridge.session_driver.delete_log_entry(entry.id);
            state_bridge.simulation_log?.remove?.(entry.id);
          } else if (is_stale && !is_failed) {
            await state_bridge.session_driver.update_log_attachment(entry.id, i, {
              src: null,
              metadata: {
                ...(a.metadata || {}),
                failed: true,
                image_ghost_swept: true,
                error: "Image beat timed out before it could resolve.",
              },
            });
          }
        }
      }
    }
  } catch (_err) {
    /* sweep must never break the trigger path */
  }
}

/**
 * Marks a logged placeholder attachment as failed so it never lingers as a
 * permanent `src: null` ghost card in the chat log.
 * @param {string | number} id
 * @param {Record<string, any>} [metadata]
 * @returns {Promise<void>}
 */
export async function mark_placeholder_failed(id, metadata = {}) {
  if (!id) return;
  try {
    const key = isNaN(Number(id)) ? id : Number(id);
    let has_text = false;
    const feed_match = state_bridge.simulation_log?.feed?.find((m) => m.id === key || m.id === id || String(m.id) === String(id));
    if (feed_match && feed_match.text && feed_match.text.trim()) {
      has_text = true;
    } else {
      try {
        const db_entries = await state_bridge.session_driver.load_log(state_bridge.runtime?.story_id);
        const match = db_entries?.find((m) => m.id === key || m.id === id || String(m.id) === String(id));
        if (match && match.text && match.text.trim()) has_text = true;
      } catch (_) {
        /* ignore error during db lookup fallback */
      }
    }

    if (has_text) {
      await state_bridge.session_driver.update_log_attachment(id, 0, {
        src: null,
        metadata: { ...metadata, failed: true, error: "Image beat was dropped before it could resolve." },
      });
      return;
    }
    // For standalone image placeholders (empty or whitespace text), delete entry completely so no ghost row lingers
    await state_bridge.session_driver.delete_log_entry(id);
    state_bridge.simulation_log?.remove?.(key);
    state_bridge.simulation_log?.remove?.(id);
  } catch (err) {
    console.warn("[ImageQueue] Failed to mark image placeholder as failed:", err);
  }
}

export function _remove_from_image_gen_queue(id) {
  const idx = _image_gen_queue.findIndex((entry) => entry.id === id);
  if (idx !== -1) _image_gen_queue.splice(idx, 1);
}

/**
 * 🖼️ SPAWN IMAGE BEAT
 * Executes a resolved trigger decision: logs a placeholder attachment immediately,
 * then kicks off background image generation against the resolved 4-tier target. Fire-and-forget: the narrative turn is never blocked
 * on image latency; the UI fills the placeholder when the generation resolves.
 * @param {string} tier - One of the 4-tier targets (story_entities | story_character | solo_entity | story_scene).
 * @param {{ explicit?: boolean, source?: string, prompt?: string }} [options]
 * @returns {Promise<void>}
 */
export async function spawn_image_beat(tier, options = {}) {
  const { explicit = false, source = "dynamics", prompt = "" } = options;
  if (!tier || !IMAGE_TIERS.includes(tier)) return;

  const runtime_state = state_bridge.runtime;
  const visual_prompt = String(prompt || "").trim() || "A significant narrative moment unfolds.";
  const fractal_name = runtime_state.active_fractal?.name || "Fractal";

  try {
    // Ghost hard cap: refuse new beats once too many placeholders are already
    // unresolved, and sweep stale ones first so recovered placeholders count.
    await sweep_stale_ghosts();
    const pending = await count_pending_ghosts();
    if (pending >= IMAGE_PLACEHOLDER_HARD_CAP) {
      state_bridge.app.log(
        `[Image Trigger] Skipped ${tier} — ${pending} unresolved image beats pending (hard cap ${IMAGE_PLACEHOLDER_HARD_CAP}).`,
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

    // Bounded image beat queue: when at capacity, drop the oldest beat and mark
    // its placeholder failed so evicted beats don't linger as src:null ghosts.
    _image_gen_queue.push({ id: placeholder_entry.id, tier, source, metadata: placeholder_metadata });
    if (_image_gen_queue.length > IMAGE_GEN_QUEUE_CAPACITY) {
      const evicted = _image_gen_queue.shift();
      if (evicted?.id) await mark_placeholder_failed(evicted.id, evicted.metadata);
    }

    const resolve_placeholder = async () => {
      try {
        const result = await Promise.race([
          visual_engine.visualize(runtime_state.story_id, visual_prompt, tier, { silent: true }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("IMAGE_RESOLVE_TIMEOUT")), IMAGE_RESOLVE_TIMEOUT_MS)),
        ]);
        _remove_from_image_gen_queue(placeholder_entry.id);
        if (result?.imageUrl) {
          await state_bridge.session_driver.update_log_attachment(placeholder_entry.id, 0, {
            src: result.imageUrl,
            metadata: { mode: tier, image_source: source, ...result.metadata, prompt: result.refinedPrompt },
          });
        } else {
          await mark_placeholder_failed(placeholder_entry.id, placeholder_metadata);
          state_bridge.app.log(`[Image Trigger] ${tier} generation returned no image.`, "warn");
        }
      } catch (err) {
        _remove_from_image_gen_queue(placeholder_entry.id);
        await mark_placeholder_failed(placeholder_entry.id, placeholder_metadata);
        throw err;
      }
    };

    // Fire background job without awaiting
    resolve_placeholder().catch((err) => {
      console.warn(`[Image Trigger] Background resolution failed for beat ${placeholder_entry.id}:`, err);
    });
  } catch (err) {
    console.warn("[Image Trigger] Failed to spawn image beat:", err);
  }
}
