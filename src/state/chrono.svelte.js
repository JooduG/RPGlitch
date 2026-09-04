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
 *     3. PAST: Echo & Vector Memory formation.
 *     4. ANCHOR: Timeline persistence into IndexedDB via Runtime.
 *     5. UNIFIED CLEANUP: Stream release, error handling, and orphaned-turn self-healing.
 *
 * Dependencies & Cross-Module Invariants:
 * - `@data` (`session_driver`): Creates sessions, persists user inputs, loads logs, and logs durable markers.
 * - `@intelligence` (`gamemaster`, `build_turn_summary`): AI narrative synthesis and round summaries.
 * - `@utils` (`state_bridge`): Decoupled bridge to `app`, `runtime`, `simulation_state`, and `simulation_log`.
 */

import { session_driver } from "@data";
import { build_turn_summary, gamemaster } from "@intelligence";
import { state_bridge } from "@utils";

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
    if (state_bridge.app.simulation.loading || state_bridge.simulation_state.intent_active) return;
    state_bridge.simulation_state.set_intent_active(true);
    state_bridge.app.simulation.loading = true;

    try {
      const story_title = state_bridge.app.story_title || `The Journey of ${selection.ai.name} & ${selection.user.name} in ${selection.fractal.name}`;

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
      await state_bridge.runtime.sync(story_id);

      // 3. Begin-story card choreography: hold cards in prologue mode and suppress morph
      state_bridge.app.suppress_card_transitions = true;
      state_bridge.app.begin_story_pending = true;
      state_bridge.app._begin_flight_assets = null;

      // 4. Trigger Prologue Generation
      state_bridge.simulation_state.start_generation("fractal");
      try {
        await gamemaster.execute_prologue(story_id);
        state_bridge.app.log("Prologue generated and opening turn executed.", "system");
      } catch (e) {
        console.error("[Chrono] Prologue Failed:", e);
        state_bridge.app.log("Error: Prologue Failed.", "error");
        throw e;
      } finally {
        state_bridge.simulation_state.complete();
        state_bridge.app.end_stream();
      }

      // Safety fallback: if flight was not triggered, switch to storymode cleanly
      if (state_bridge.app.begin_story_pending && !state_bridge.app._begin_flight_assets) {
        if (state_bridge.app.view !== "storymode") state_bridge.app.set_view("storymode");
        state_bridge.app.begin_story_pending = false;
        state_bridge.app.suppress_card_transitions = false;
        state_bridge.app._begin_flight_assets = null;
      }
    } catch (e) {
      console.error("[Chrono] Start Failed:", e);
      if (state_bridge.app.view !== "storymode") state_bridge.app.set_view("storymode");
      state_bridge.app.begin_story_pending = false;
      state_bridge.app.suppress_card_transitions = false;
      state_bridge.app._begin_flight_assets = null;
      this.error = /** @type {Error} */ (e).message;
    } finally {
      state_bridge.app.simulation.loading = false;
      state_bridge.simulation_state.set_intent_active(false);
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
    if (state_bridge.app.simulation.loading || state_bridge.simulation_state.intent_active || !text?.trim()) {
      return false;
    }
    await this.advance_turn(text);
    return true;
  }

  /**
   * Retries the last AI turn by rolling back session state and re-advancing.
   */
  async retry() {
    if (state_bridge.app.simulation.loading || state_bridge.simulation_state.intent_active) return;
    try {
      await session_driver.regenerate();
      await this.advance_turn(null, { is_retry: true });
    } catch (e) {
      this.error = /** @type {Error} */ (e).message;
    }
  }

  /**
   * Continues the story without user input (AI extends the active scene).
   */
  async continue() {
    if (state_bridge.app.simulation.loading || state_bridge.simulation_state.intent_active) return;
    try {
      if (!state_bridge.simulation_log?.feed?.length && typeof state_bridge.simulation_log?.refresh === "function") {
        await state_bridge.simulation_log.refresh();
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
    const story_id = state_bridge.runtime.story_id;
    if (!story_id) return;

    // 1. STASIS: System Lock & Double-Click Gate
    state_bridge.simulation_state.set_intent_active(true);
    state_bridge.app.simulation.loading = true;

    const previous_round = Number(state_bridge.runtime.round || 0);
    const final_input = input;

    // 2. SYNTHESIS: Generate Narrative
    if (!options.is_retry && !options.is_continue) {
      state_bridge.runtime.round = previous_round + 1;
    }
    state_bridge.app.log(`LLM synthesizing turn ${state_bridge.runtime.round}...`, "ai");
    const controller = new AbortController();
    state_bridge.app.streaming.abort_controller = controller;
    state_bridge.app.streaming.active = true;

    return (async () => {
      try {
        if (final_input) {
          try {
            await session_driver.send(final_input);
          } catch (db_err) {
            console.error("[Chrono] Database write error during send:", db_err);
            state_bridge.app.log("Failed to persist user message, but generation continues.", "error");
          }
        }

        state_bridge.simulation_state.start_generation("system");
        state_bridge.simulation_state.set_generating_entity({
          type: "system",
          name: "Director",
          avatar: null,
          color: "var(--color-frozen)",
        });

        try {
          await gamemaster.execute_turn(story_id, {
            input: final_input ?? undefined,
            signal: controller.signal,
          });
          state_bridge.app.log("Generation complete.", "system");

          try {
            state_bridge.app.log(build_turn_summary(state_bridge.simulation_log?.feed || [], state_bridge.runtime.round), "system");
          } catch {
            /* Telemetry logging must never break turn progression */
          }
        } catch (e) {
          console.error("[Chrono] Generation Failed:", e);
          state_bridge.app.log("Error: Generation Failed.", "error");
          throw e;
        } finally {
          state_bridge.simulation_state.complete();
          state_bridge.app.end_stream();
        }

        // 3. PAST: Commit to Memory (Echo)
        state_bridge.simulation_state.lock();
        state_bridge.app.log("Recording memory...", "db");

        // 4. ANCHOR: Persist the timeline
        await state_bridge.runtime.save(state_bridge.runtime.round);
        state_bridge.simulation_state.unlock();
      } catch (err) {
        const error = /** @type {any} */ (err);
        if (error.name === "AbortError" || error.message?.includes("aborted")) {
          state_bridge.app.log("Generation interrupted cleanly.", "system");
        } else {
          state_bridge.app.log(`Time Fracture: ${error.message}`, "error");
          console.error("[Chrono] 💥 Time Fracture:", error);

          state_bridge.runtime.round = previous_round;

          // 🛡️ ORPHANED-TURN GUARD: If user message was recorded but AI reply failed, retry once
          const round_after_failure = state_bridge.runtime.round;
          let retry_landed = false;

          try {
            if (final_input && !this._orphan_retry_in_flight) {
              this._orphan_retry_in_flight = true;
              try {
                const latest_log = await session_driver.load_log(story_id);
                const tail = latest_log.filter((m) => m.role !== "system");
                const last = tail[tail.length - 1];

                if (last?.role === "user" && last.created_at) {
                  const has_reply_after = tail.some(
                    (m) => (m.role === "model" || m.role === "fractal") && (m.created_at ?? 0) > (last.created_at ?? 0),
                  );

                  if (!has_reply_after) {
                    state_bridge.app.log("Detected orphaned turn — retrying generation once...", "warn");
                    state_bridge.simulation_state.start_generation(options.role || "ai");
                    await gamemaster.execute_turn(story_id, {
                      input: final_input,
                      signal: controller.signal,
                    });
                    retry_landed = true;
                    state_bridge.app.log("Orphaned turn recovered.", "system");
                  }
                }
              } catch (retry_err) {
                console.error("[Chrono] Orphan retry failed:", retry_err);
                state_bridge.app.log(`Orphan retry failed: ${retry_err.message || retry_err}`, "error");
              } finally {
                this._orphan_retry_in_flight = false;
              }
            }
          } catch (guard_err) {
            console.error("[Chrono] Orphan guard failed:", guard_err);
          }

          // Durable system entry for forensic auditing
          try {
            await session_driver.log_system_entry(
              `A turn failed after the message was recorded${
                retry_landed ? " (recovered by automatic retry)" : " — no reply was generated"
              }. Round ${round_after_failure}. (${error.message || "Unknown error"})`,
              "system",
              { type: "TURN_ORPHANED", round: round_after_failure, recovered: retry_landed },
            );
          } catch (log_err) {
            console.error("[Chrono] Failed to persist orphan marker:", log_err);
          }

          if (!retry_landed) {
            state_bridge.simulation_log.add({
              id: `err-${Date.now()}`,
              role: "system",
              text: `Simulation Error: ${error.message || "Unknown Time Fracture"}`,
              timestamp: Date.now(),
            });
          }
        }
      } finally {
        // Unified Cleanup Framework
        if (state_bridge.app.streaming.abort_controller === controller) {
          state_bridge.app.streaming.abort_controller = null;
        }
        state_bridge.app.streaming.active = false;
        state_bridge.app.streaming.content = "";
        state_bridge.app.streaming.node_id = null;
        state_bridge.app.streaming.role = "ai";
        state_bridge.app.simulation.loading = false;
        state_bridge.simulation_state.unlock();
        state_bridge.simulation_state.set_intent_active(false);
      }
    })();
  }
}

// ============================================================================
// [SECTION 6: SINGLETON ENGINE INSTANTIATION & GLOBAL EXPOSURE]
// ============================================================================

export const chrono_engine = new ChronoEngine();

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: structured Universal File Architecture,
 *   added section dividers, JSDoc typedefs, normalized variable naming (snake_case/question_snake),
 *   and verified turn pipeline integrity.
 * - 2026-08-16: Added orphaned-turn guard and sub-millisecond intent lock.
 */
