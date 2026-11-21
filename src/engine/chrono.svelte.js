/**
 * src/engine/chrono.svelte.js
 * ============================================================================
 * ⏳ CHRONO: The Heartbeat of Time & Turn Orchestration (PHASE 5)
 * ============================================================================
 *
 * Core Responsibilities:
 * - Manages the strict turn-based progression and temporal heartbeat of the simulation.
 * - Coordinates session initialization and prologue generation from storyboard selection (`start`).
 * - Dispatches user inputs (`send`), regenerative rerolls (`retry`), and narrative extensions (`continue`).
 * - Executes the atomic 5-phase Turn Advancement cycle:
 *     1. STASIS: System Lock & Intent Gate (sub-millisecond double-click protection).
 *     2. SYNTHESIS: Background LLM Stream Synthesis via the turn runner.
 *     3. PAST: Echo & Continuum formation.
 *     4. ANCHOR: Timeline persistence into IndexedDB via Runtime.
 *     5. UNIFIED CLEANUP: Stream release, error handling, and orphaned-turn self-healing.
 *
 * Dependencies & Cross-Module Invariants:
 * - `@state`: session_driver (persistence), simulation_log (feed), runtime,
 *   simulation_state (phase/intent), app (streaming/log).
 * - `@simulation` (`build_turn_summary`): round telemetry that must never
 *   break turn progression.
 * - `./runner.js` (`run_turn`, `continue_turn`): turn execution.
 * - `./lifecycle.js` (`generate_opening`): prologue choreography.
 */

import { build_turn_summary } from "@simulation";
import { app, execution, session } from "@state";
import { generate_opening } from "./lifecycle.js";
import { continue_turn, run_turn } from "./runner.js";

// ============================================================================
// [SECTION 1: JSDOC SCHEMAS & TYPE DEFINITIONS]
// ============================================================================

/**
 * @typedef {Object} StorySelection
 * @property {any} ai - Selected AI Character entity.
 * @property {any} user - Selected User Persona entity.
 * @property {any} fractal - Selected Fractal / Setting entity.
 */

/**
 * @typedef {Object} AdvanceTurnOptions
 * @property {boolean} [is_retry] - Whether this turn re-executes the previous AI turn.
 * @property {boolean} [is_continue] - Whether this turn requests a narrative continuation.
 * @property {string} [role] - Generating role identifier for logging/stasis.
 */

// ============================================================================
// [SECTION 2: CHRONO ENGINE CLASS INITIALIZATION]
// ============================================================================

export class ChronoEngine {
  /** @type {string | null} */
  error = $state(null);
  /** @type {boolean} */
  _orphan_retry_in_flight = false;

  /**
   * Single busy predicate for every public entry gate.
   * @returns {boolean}
   */
  #is_busy() {
    return execution.busy;
  }

  /**
   * Runs fn under the stream lock: intent + loading + a fresh
   * AbortController wired into the execution store.
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

  // ============================================================================
  // [SECTION 3: SESSION STARTUP & PROLOGUE CHOREOGRAPHY]
  // ============================================================================

  /**
   * Starts a new story session from the Lobby selection.
   * Creates the session record, synchronizes runtime, and executes the opening prologue.
   * @param {StorySelection} selection
   */
  async start(selection) {
    this.error = null;
    if (this.#is_busy()) return;
    execution.set_intent_active(true);
    execution.set_loading(true);

    try {
      // Clear stale story title from previous stories before session creation
      app.reset_story_title();
      const story_title = app.story_title || `The Journey of ${selection.ai.name} & ${selection.user.name} in ${selection.fractal.name}`;

      // 1. Create Core Session in persistence
      const story_id = await session.create_from_selection({
        ai_id: selection.ai.id,
        user_id: selection.user.id,
        fractal_id: selection.fractal.id,
        visual_style: selection.fractal?.visual_style,
        narrative_style: selection.fractal?.narrative_style,
        fractal: selection.fractal,
        story_title,
      });

      // 2. Synchronize Session State with the new session
      await session.sync(story_id);

      // 3. Begin-story card choreography: hold cards in prologue mode and suppress morph
      app.suppress_card_transitions = true;
      app.begin_story_pending = true;
      app.begin_flight_claimed = false;

      // 4. Trigger Prologue Generation
      execution.start_generation("fractal");
      try {
        await generate_opening(story_id);
        console.info("[Chrono] Prologue generated and opening turn executed.");
      } catch (e) {
        console.error("[Chrono] Prologue Failed:", e);
        throw e;
      } finally {
        execution.complete();
        execution.end_stream();
      }

      // Safety fallback: if flight was not triggered, switch to storymode cleanly
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
    } finally {
      execution.set_loading(false);
      execution.set_intent_active(false);
    }
  }

  // ============================================================================
  // [SECTION 4: TURN PROGRESSION & USER DISPATCH (SEND, RETRY, CONTINUE)]
  // ============================================================================

  /**
   * Sends user input and advances the simulation turn.
   * Returns false when rejected (e.g. composer busy or empty text) so user input is never lost.
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
   * Continues the story without user input (AI extends the active scene).
   * If target_id is provided, continues that specific message in-place.
   *
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
          const aborted =
            /** @type {any} */ (e)?.name === "AbortError" || String(/** @type {any} */ (e)?.message || "").includes("aborted") || controller.signal.aborted;
          if (aborted) {
            console.warn("[Chrono] Generation aborted by user.");
          } else {
            console.error("[Chrono] Generation Failed:", e);
          }
          throw e;
        } finally {
          execution.complete();
          execution.end_stream();
        }

        // 3. PAST: Commit to Continuum (Echo)
        execution.lock();

        // 4. ANCHOR: Persist the timeline
        await session.save(session.round);
        execution.unlock();
        return true;
      } catch (err) {
        const error = /** @type {any} */ (err);
        const is_aborted = error.name === "AbortError" || error.message?.includes("aborted") || controller.signal.aborted;
        if (is_aborted) {
          console.info("[Chrono] Generation interrupted cleanly.");
          session.round = previous_round;

          if (final_input && story_id) {
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
          return false;
        } else {
          console.error("[Chrono] Time Fracture:", error);
          session.round = previous_round;

          const round_after_failure = session.round;
          let retry_landed = false;

          try {
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
                    execution.start_generation(options.role || "ai");
                    await run_turn(final_input, { signal: controller.signal });
                    retry_landed = true;
                  }
                }
              } catch (retry_err) {
                console.error("[Chrono] Orphan retry failed:", retry_err);
              } finally {
                this._orphan_retry_in_flight = false;
              }
            }
          } catch (guard_err) {
            console.error("[Chrono] Orphan guard failed:", guard_err);
          }

          try {
            await session.log_message(
              `A turn failed after the message was recorded${
                retry_landed ? " (recovered by automatic retry)" : " - no reply was generated"
              }. Round ${round_after_failure}. (${error.message || "Unknown error"})`,
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

          if (retry_landed) {
            await session.save(session.round);
            return true;
          }

          this.error = error.message || "Unknown Time Fracture";
          session.add({
            id: `err-${Date.now()}`,
            role: "system",
            text: `Simulation Error: ${error.message || "Unknown Time Fracture"}`,
            timestamp: Date.now(),
          });
        }
      }
    });
  }

  /**
   * Concludes the active story session, saves state, and clears active pointers.
   * @returns {Promise<void>}
   */
  async stop() {
    this.error = null;
    if (session?.active_id) {
      await session.save();
    }
    await session.clear_active();
  }
}

// ============================================================================
// [SECTION 6: SINGLETON ENGINE INSTANTIATION & GLOBAL EXPOSURE]
// ============================================================================

export const chrono_engine = new ChronoEngine();
