/**
 * @file src/engine/chrono.svelte.js
 * Reactive session/turn facade: coordinates story startup, user send,
 * retry, continue-in-place, abort rollback, and single-attempt orphan recovery.
 */

import { reset_generation_in_flight, reset_image_generation_queue } from "@media";
import { build_turn_summary } from "@simulation";
import { app, execution, session } from "@state";
import { stories } from "@data";
import { generate_closing, generate_opening } from "./lifecycle.js";
import { is_abort_error } from "./transport.js";
import { continue_turn, reset_turn_scope_for_testing, run_turn } from "./turns.js";

/**
 * @typedef {Object} StorySelection
 * @property {any} ai
 * @property {any} user
 * @property {any} fractal
 */

/**
 * @typedef {Object} AdvanceTurnOptions
 * @property {boolean} [is_retry]
 * @property {boolean} [is_continue]
 * @property {string} [role]
 */

export class ChronoEngine {
  /** @type {string | null} */
  error = $state(null);
  _orphan_retry_in_flight = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  #stop_fallback_timer = null;

  #is_busy() {
    return execution.busy;
  }

  /**
   * Force-recovers execution state and resets engine/media locks.
   * @param {string} reason
   */
  #force_recover(reason) {
    if (this.#stop_fallback_timer) {
      clearTimeout(this.#stop_fallback_timer);
      this.#stop_fallback_timer = null;
    }
    try {
      execution.recover(reason);
    } finally {
      for (const reset_fn of [reset_turn_scope_for_testing, reset_generation_in_flight, reset_image_generation_queue]) {
        try {
          if (typeof reset_fn === "function") reset_fn();
        } catch {
          /* best-effort */
        }
      }
    }
  }

  /**
   * Aborts the active generation cleanly via AbortController, escalating to
   * forced recovery if the turn does not unwind or is already wedged.
   */
  abort() {
    if (this.#stop_fallback_timer) {
      clearTimeout(this.#stop_fallback_timer);
      this.#stop_fallback_timer = null;
    }

    const controller = execution.stream.abort_controller;
    if (controller && !controller.signal.aborted) {
      execution.interrupt();
      this.#stop_fallback_timer = setTimeout(() => {
        this.#stop_fallback_timer = null;
        if (execution.busy || execution.stream.active || execution.loading) {
          this.#force_recover("Stop escalation timeout");
        }
      }, 1500);
      return;
    }

    this.#force_recover("Manual stop");
  }

  /**
   * Runs `fn` under the stream lock with a fresh AbortController wired into `execution.stream`.
   * @param {(controller: AbortController) => Promise<any>} fn
   * @returns {Promise<any>}
   */
  async #with_stream_lock(fn) {
    execution.set_intent_active(true);
    execution.set_loading(true);
    const controller = new AbortController();
    execution.stream.abort_controller = controller;
    execution.stream.active = true;
    try {
      return await fn(controller);
    } finally {
      if (execution.stream.abort_controller === controller) {
        execution.stream.abort_controller = null;
      }
      execution.end_stream();
      execution.set_loading(false);
      execution.unlock();
      execution.set_intent_active(false);
    }
  }

  /**
   * Starts a new story session from storyboard selection and runs the prologue.
   * @param {StorySelection} selection
   */
  async start(selection) {
    this.error = null;
    if (this.#is_busy()) return;

    await this.#with_stream_lock(async (controller) => {
      try {
        app.reset_story_title();
        const story_title = app.story_title || `The Journey of ${selection.ai.name} & ${selection.user.name} in ${selection.fractal.name}`;

        const story_id = await session.create_from_selection({
          ai_id: selection.ai.id,
          user_id: selection.user.id,
          fractal_id: selection.fractal.id,
          visual_style: selection.fractal?.visual_style,
          narrative_style: selection.fractal?.narrative_style,
          fractal: selection.fractal,
          story_title,
        });

        await session.sync(story_id);

        app.suppress_card_transitions = true;
        app.begin_story_pending = true;
        app.begin_flight_claimed = false;

        execution.start_generation("fractal");
        try {
          await generate_opening(story_id, { signal: controller.signal });
          console.info("[Chrono] Prologue generated and opening turn executed.");
        } catch (e) {
          console.error("[Chrono] Prologue Failed:", e);
          throw e;
        } finally {
          execution.complete();
          execution.end_stream();
        }

        if (app.begin_story_pending && !app.begin_flight_claimed) {
          if (app.view !== "storymode") app.set_view("storymode");
          app.begin_story_pending = false;
          app.suppress_card_transitions = false;
          app.begin_flight_claimed = false;
        }
      } catch (e) {
        console.error("[Chrono] Start Failed:", e);
        if (app.view !== "storymode") app.set_view("storymode");
        app.begin_story_pending = false;
        app.suppress_card_transitions = false;
        app.begin_flight_claimed = false;
        this.error = /** @type {Error} */ (e).message;
      }
    });
  }

  /**
   * Sends user input and advances the simulation turn.
   * Returns false when rejected so composer input is never lost.
   * @param {string} text
   * @returns {Promise<boolean>}
   */
  async send(text) {
    this.error = null;
    if (this.#is_busy() || !text?.trim()) {
      return false;
    }
    const result = await this.advance_turn(text);
    return Boolean(result);
  }

  /**
   * Retries the last AI turn by rolling back session state and re-advancing.
   */
  async retry() {
    this.error = null;
    if (this.#is_busy()) return;
    try {
      await session.rollback_for_retry();
      await this.advance_turn(null, { is_retry: true });
    } catch (e) {
      this.error = /** @type {Error} */ (e).message;
    }
  }

  /**
   * Continues the story without user input, or extends `target_id` in place.
   * @param {string | null} [target_id=null]
   */
  async continue(target_id = null) {
    this.error = null;
    if (this.#is_busy()) return;
    try {
      if (!session.feed?.length) {
        await session.refresh_feed();
      }

      if (target_id) {
        const feed = session.feed || [];
        const target_entry = feed.find((e) => String(e.id) === String(target_id));
        if (target_entry) {
          await this.#with_stream_lock(async (controller) => {
            await continue_turn(target_entry, { signal: controller.signal });
          });
          return;
        }
      }

      await this.advance_turn(null, { is_continue: true });
    } catch (e) {
      this.error = /** @type {Error} */ (e).message;
    }
  }

  async #purge_aborted_user_message(story_id) {
    try {
      const latest_log = await session.load_log(story_id);
      const last_message = latest_log[latest_log.length - 1];
      if (last_message?.role === "user" && last_message.id != null) {
        await session.delete_entry(last_message.id);
      }
    } catch (cleanup_err) {
      console.warn("[Chrono] Failed to purge aborted user message:", cleanup_err);
    }
  }

  async #recover_orphaned_turn(story_id, final_input, controller, error, round_after_failure) {
    let retry_landed = false;

    if (final_input && !this._orphan_retry_in_flight) {
      this._orphan_retry_in_flight = true;
      try {
        const latest_log = await session.load_log(story_id);
        const tail = latest_log.filter((m) => m.role !== "system");
        const last = tail[tail.length - 1];

        if (last?.role === "user" && last.created_at) {
          const has_reply_after = tail.some((m) => (m.role === "ai" || m.role === "fractal") && (m.created_at ?? 0) > (last.created_at ?? 0));
          if (!has_reply_after) {
            console.warn("[Chrono] Detected orphaned turn - retrying generation once...");
            execution.start_director_stage();
            try {
              await run_turn(final_input, { signal: controller.signal });
              retry_landed = true;
            } finally {
              execution.complete();
              execution.end_stream();
            }
          }
        }
      } catch (retry_err) {
        console.error("[Chrono] Orphan retry failed:", retry_err);
      } finally {
        this._orphan_retry_in_flight = false;
      }
    }

    try {
      await session.log_message(
        `A turn failed after the message was recorded${retry_landed ? " (recovered by automatic retry)" : " - no reply was generated"}. Round ${round_after_failure}. (${error.message || "Unknown error"})`,
        "system",
        "System",
        {
          turn_type: "SYSTEM_TURN",
          round: round_after_failure,
          story_id,
          meta: { type: "TURN_ORPHANED", round: round_after_failure, recovered: retry_landed },
        },
      );
    } catch (log_err) {
      console.error("[Chrono] Failed to persist orphan marker:", log_err);
    }

    return retry_landed;
  }

  /**
   * Executes a single turn cycle with abort rollback and orphan recovery.
   * @param {string | null} input
   * @param {AdvanceTurnOptions} [options={}]
   */
  async advance_turn(input, options = {}) {
    this.error = null;
    const story_id = session.active_id;
    if (!story_id) return;

    const final_input = input;

    return this.#with_stream_lock(async (controller) => {
      const previous_round = Number(session.round || 0);

      try {
        if (final_input) {
          try {
            await session.send_user_message(final_input);
          } catch (db_err) {
            console.error("[Chrono] Database write error during send:", db_err);
          }
        }

        execution.start_director_stage();
        try {
          await run_turn(final_input || "", { signal: controller.signal, is_retry: options.is_retry, is_continue: options.is_continue });
          try {
            console.info(build_turn_summary(session.feed || [], session.round));
          } catch {
            /* Telemetry logging must never break turn progression */
          }
        } catch (e) {
          if (is_abort_error(e, controller.signal)) {
            console.warn("[Chrono] Generation aborted by user.");
          } else {
            console.error("[Chrono] Generation Failed:", e);
          }
          throw e;
        } finally {
          execution.complete();
          execution.end_stream();
        }

        return true;
      } catch (err) {
        const error = /** @type {any} */ (err);
        if (is_abort_error(error, controller.signal)) {
          console.info("[Chrono] Generation interrupted cleanly.");
          session.round = previous_round;
          if (final_input && story_id) {
            await this.#purge_aborted_user_message(story_id);
          }
          return false;
        }

        console.error("[Chrono] Time Fracture:", error);
        session.round = previous_round;

        const retry_landed = await this.#recover_orphaned_turn(story_id, final_input, controller, error, session.round);
        if (retry_landed) {
          return true;
        }

        this.error = error.message || "Unknown Time Fracture";
        session.add({ id: `err-${Date.now()}`, role: "system", text: `Simulation Error: ${error.message || "Unknown Time Fracture"}`, timestamp: Date.now() });
      }
    });
  }

  /**
   * Concludes the active story session, saves state, and clears active pointers.
   */
  async stop() {
    this.error = null;
    if (session?.active_id) {
      await session.save();
    }
    await session.clear_active();
  }

  /**
   * Starts a new story session from the currently staged entities in interface store.
   * @returns {Promise<string | null>}
   */
  async begin_selected_story() {
    if (!app.selected_ai || !app.selected_user || !app.selected_fractal) {
      this.error = "Select all three cast roles (AI, User, Fractal) to begin.";
      return null;
    }
    await this.start({ ai: app.selected_ai, user: app.selected_user, fractal: app.selected_fractal });
    return session.active_id;
  }

  /**
   * Concludes the active story session, optionally generating an epilogue.
   * Keeps the concluded story loaded in Storymode in read-only state.
   *
   * @param {{ with_epilogue?: boolean, conclusion_status?: "CONCLUDED" | "COLLAPSED" }} [options={}]
   * @returns {Promise<void>}
   */
  async conclude_active_story(options = {}) {
    const { with_epilogue = false, conclusion_status = "CONCLUDED" } = options;
    const story_id = session.active_id;
    if (!story_id) return;

    this.error = null;
    try {
      if (with_epilogue) {
        await generate_closing(story_id, conclusion_status);
      }
      await stories.conclude(story_id);
      await session.save();
      app.bump_stories_version();
      execution.lock();
    } catch (err) {
      console.error("[Chrono] Conclude Failed:", err);
      this.error = /** @type {Error} */ (err).message;
    }
  }

  /**
   * Rewinds a concluded active story back to active state.
   * @returns {Promise<void>}
   */
  async rewind_active_story() {
    const story_id = session.active_id;
    if (!story_id) return;

    this.error = null;
    try {
      await stories.rewind(story_id);
      await session.sync(story_id);
      app.bump_stories_version();
      execution.unlock();
    } catch (err) {
      console.error("[Chrono] Rewind Failed:", err);
      this.error = /** @type {Error} */ (err).message;
    }
  }
}

export const chrono_engine = new ChronoEngine();
