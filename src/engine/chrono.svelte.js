/**
 * src/state/chrono.svelte.js
 * ⏳ CHRONO: The Heartbeat of Time & Turn Orchestration
 *
 * Core Responsibilities:
 * - Manages the strict turn-based progression and temporal heartbeat of the simulation.
 * - Coordinates session initialization and prologue generation from storyboard selection (`start`).
 * - Dispatches user inputs (`send`), regenerative rerolls (`retry`), and narrative extensions (`continue`).
 * - Executes the atomic 5-phase Turn Advancement cycle:
 *     1. STASIS: System Lock & Intent Gate (sub-millisecond double-click protection).
 *     2. SYNTHESIS: Background LLM Stream Synthesis via Gamemaster.
 *     3. PAST: Echo & Continuum formation.
 *     4. ANCHOR: Timeline persistence into IndexedDB via Runtime.
 *     5. UNIFIED CLEANUP: Stream release, error handling, and orphaned-turn self-healing.
 *
 * Dependencies & Cross-Module Invariants:
 * - `@data` (`session_driver`): Creates sessions, persists user inputs, loads logs, and logs durable markers.
 * - `@intelligence` (`gamemaster`, `build_turn_summary`): AI narrative synthesis and round summaries.
 * - `@state` (`app`): Direct application interface store import.
 */

import { build_turn_summary } from "./turns.js";
import { app, runtime, session_driver, simulation_log, simulation_state } from "@state";
import { execute_prologue } from "./lifecycle.js";
import { execute_continue, execute_turn } from "./runs.js";

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

  // ============================================================================
  // [SECTION 3: SESSION STARTUP & PROLOGUE CHOREOGRAPHY]
  // ============================================================================

  /**
   * Starts a new story session from the Lobby selection.
   * Creates the session record, synchronizes runtime, and executes the opening prologue.
   * @param {StorySelection} selection
   */
  async start(selection) {
    if (app.simulation.loading || simulation_state.intent_active) return;
    simulation_state.set_intent_active(true);
    app.simulation.loading = true;

    try {
      // Clear stale story title from previous stories before session creation
      runtime?.reset_story_title?.();
      const story_title = app.story_title || `The Journey of ${selection.ai.name} & ${selection.user.name} in ${selection.fractal.name}`;

      // 1. Create Core Session in persistence
      const story_id = await session_driver.create_from_selection({
        ai_id: selection.ai.id,
        user_id: selection.user.id,
        fractal_id: selection.fractal.id,
        visual_style: selection.fractal?.visual_style,
        narrative_style: selection.fractal?.narrative_style,
        fractal: selection.fractal,
        story_title,
      });

      // 2. Synchronize Runtime State with the new session
      await runtime.sync(story_id);

      // 3. Begin-story card choreography: hold cards in prologue mode and suppress morph
      app.suppress_card_transitions = true;
      app.begin_story_pending = true;
      app._begin_flight_assets = null;

      // 4. Trigger Prologue Generation
      simulation_state.start_generation("fractal");
      try {
        await execute_prologue(story_id);
        app.log("Prologue generated and opening turn executed.", "system");
      } catch (e) {
        console.error("[Chrono] Prologue Failed:", e);
        app.log("Error: Prologue Failed.", "error");
        throw e;
      } finally {
        simulation_state.complete();
        app.end_stream();
      }

      // Safety fallback: if flight was not triggered, switch to storymode cleanly
      if (app.begin_story_pending && !app._begin_flight_assets) {
        if (app.view !== "storymode") app.set_view("storymode");
        app.begin_story_pending = false;
        app.suppress_card_transitions = false;
        app._begin_flight_assets = null;
      }
    } catch (e) {
      console.error("[Chrono] Start Failed:", e);
      if (app.view !== "storymode") app.set_view("storymode");
      app.begin_story_pending = false;
      app.suppress_card_transitions = false;
      app._begin_flight_assets = null;
      this.error = /** @type {Error} */ (e).message;
    } finally {
      app.simulation.loading = false;
      simulation_state.set_intent_active(false);
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
    if (app.simulation.loading || simulation_state.intent_active || !text?.trim()) {
      return false;
    }
    const result = await this.advance_turn(text);
    return result !== false;
  }

  /**
   * Retries the last AI turn by rolling back session state and re-advancing.
   */
  async retry() {
    if (app.simulation.loading || simulation_state.intent_active) return;
    try {
      await session_driver.regenerate();
      await this.advance_turn(null, { is_retry: true });
    } catch (e) {
      this.error = /** @type {Error} */ (e).message;
    }
  }

  /**
   * Continues the story without user input (AI extends the active scene).
   * If target_id is provided, continues that specific message in-place.
   *
   * @param {string} [target_id]
   */
  async continue(target_id = null) {
    if (app.simulation.loading || simulation_state.intent_active) return;
    try {
      if (!simulation_log?.feed?.length && typeof simulation_log?.refresh === "function") {
        await simulation_log.refresh();
      }

      // If target_id specified, run surgical continue-in-place
      if (target_id) {
        const feed = simulation_log?.feed || [];
        const target_entry = feed.find((e) => String(e.id) === String(target_id));
        if (target_entry) {
          simulation_state.set_intent_active(true);
          app.simulation.loading = true;
          const controller = new AbortController();
          app.streaming.abort_controller = controller;
          app.streaming.active = true;

          try {
            await execute_continue(target_entry, { signal: controller.signal });
            app.log("Continuation complete.", "system");
          } finally {
            simulation_state.set_intent_active(false);
            app.simulation.loading = false;
            app.streaming.active = false;
          }
          return;
        }
      }

      await this.advance_turn(null, { is_continue: true });
    } catch (e) {
      this.error = /** @type {Error} */ (e).message;
    }
  }

  // ============================================================================
  // [SECTION 5: ADVANCE TURN ENGINE (STASIS, SYNTHESIS, ECHO, CLEANUP)]
  // ============================================================================

  /**
   * Advances the simulation by executing an atomic turn cycle.
   * @param {string | null} input
   * @param {AdvanceTurnOptions} [options={}]
   */
  async advance_turn(input, options = {}) {
    const story_id = runtime.story_id;
    if (!story_id) return;

    // 1. STASIS: System Lock & Double-Click Gate
    simulation_state.set_intent_active(true);
    app.simulation.loading = true;

    const previous_round = Number(runtime.round || 0);
    const final_input = input;

    // 2. SYNTHESIS: Generate Narrative (round is owned by runtime)
    app.log(`LLM synthesizing turn ${runtime.round}...`, "ai");
    const controller = new AbortController();
    app.streaming.abort_controller = controller;
    app.streaming.active = true;

    return (async () => {
      try {
        if (final_input) {
          try {
            await session_driver.send(final_input);
          } catch (db_err) {
            console.error("[Chrono] Database write error during send:", db_err);
            app.log("Failed to persist user message, but generation continues.", "error");
          }
        }

        simulation_state.start_director_stage();

        try {
          app.log("Executing turn via Sovereign Engine...", "system");
          await execute_turn(final_input || "", { signal: controller.signal, is_retry: options.is_retry, is_continue: options.is_continue });
          app.log("Generation complete.", "system");

          try {
            app.log(build_turn_summary(simulation_log?.feed || [], runtime.round), "system");
          } catch {
            /* Telemetry logging must never break turn progression */
          }
        } catch (e) {
          const aborted =
            /** @type {any} */ (e)?.name === "AbortError" || String(/** @type {any} */ (e)?.message || "").includes("aborted") || controller.signal.aborted;
          if (aborted) {
            console.warn("[Chrono] Generation aborted by user.");
            app.log("Generation interrupted by user.", "warn");
          } else {
            console.error("[Chrono] Generation Failed:", e);
            app.log("Error: Generation Failed.", "error");
          }
          throw e;
        } finally {
          simulation_state.complete();
          app.end_stream();
        }

        // 3. PAST: Commit to Continuum (Echo)
        simulation_state.lock();
        app.log("Recording continuum...", "db");

        // 4. ANCHOR: Persist the timeline
        await runtime.save(runtime.round);
        simulation_state.unlock();
        return true;
      } catch (err) {
        const error = /** @type {any} */ (err);
        const is_aborted = error.name === "AbortError" || error.message?.includes("aborted") || controller.signal.aborted;
        if (is_aborted) {
          app.log("Generation interrupted cleanly.", "system");
          runtime.round = previous_round;

          // 🛡️ ABORT CLEANUP: Purge orphaned unresponded user turn row from IndexedDB and feed
          if (final_input && story_id) {
            try {
              const latest_log = await session_driver.load_log(story_id);
              const last_message = latest_log[latest_log.length - 1];
              if (last_message?.role === "user" && last_message.id != null) {
                // Store-level delete: removes the DB row AND the in-memory feed entry
                // (bare delete_log_entry left a ghost in the feed until refresh).
                await simulation_log.delete_entry(last_message.id);
              }
            } catch (cleanup_err) {
              console.warn("[Chrono] Failed to purge aborted user message:", cleanup_err);
            }
          }
          return false;
        } else {
          app.log(`Time Fracture: ${error.message}`, "error");
          console.error("[Chrono] 💥 Time Fracture:", error);

          runtime.round = previous_round;

          // 🛡️ ORPHANED-TURN GUARD: If user message was recorded but AI reply failed, retry once
          const round_after_failure = runtime.round;
          let retry_landed = false;

          try {
            if (final_input && !this._orphan_retry_in_flight) {
              this._orphan_retry_in_flight = true;
              try {
                const latest_log = await session_driver.load_log(story_id);
                const tail = latest_log.filter((m) => m.role !== "system");
                const last = tail[tail.length - 1];

                if (last?.role === "user" && last.created_at) {
                  const has_reply_after = tail.some((m) => (m.role === "ai" || m.role === "fractal") && (m.created_at ?? 0) > (last.created_at ?? 0));

                  if (!has_reply_after) {
                    app.log("Detected orphaned turn - retrying generation once...", "warn");
                    simulation_state.start_generation(options.role || "ai");
                    await execute_turn(final_input, { signal: controller.signal });
                    retry_landed = true;
                    app.log("Orphaned turn recovered.", "system");
                  }
                }
              } catch (retry_err) {
                console.error("[Chrono] Orphan retry failed:", retry_err);
                app.log(`Orphan retry failed: ${retry_err.message || retry_err}`, "error");
              } finally {
                this._orphan_retry_in_flight = false;
              }
            }
          } catch (guard_err) {
            console.error("[Chrono] Orphan guard failed:", guard_err);
          }

          // Durable system entry for forensic auditing
          try {
            await session_driver.log_message(
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

          if (!retry_landed) {
            simulation_log.add({
              id: `err-${Date.now()}`,
              role: "system",
              text: `Simulation Error: ${error.message || "Unknown Time Fracture"}`,
              timestamp: Date.now(),
            });
          }
        }
      } finally {
        // Unified Cleanup Framework
        if (app.streaming.abort_controller === controller) {
          app.streaming.abort_controller = null;
        }
        app.streaming.active = false;
        app.streaming.content = "";
        app.streaming.node_id = null;
        app.streaming.role = "ai";
        app.simulation.loading = false;
        simulation_state.unlock();
        simulation_state.set_intent_active(false);
      }
    })();
  }

  /**
   * Concludes the active story session, saves state, and clears active pointers.
   * @returns {Promise<void>}
   */
  async stop() {
    if (runtime?.story_id) {
      await runtime.save();
    }
    await session_driver.clear_active();
  }
}

// ============================================================================
// [SECTION 6: SINGLETON ENGINE INSTANTIATION & GLOBAL EXPOSURE]
// ============================================================================

export const chrono_engine = new ChronoEngine();
