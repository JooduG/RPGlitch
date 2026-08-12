// ⏳ CHRONO: The Heartbeat of Time
// Manages the strict turn-based progression of the simulation.
import { session_driver } from "./session.svelte.js";
import { gamemaster } from "@intelligence";
import { security } from "@platform";
import { state_bridge } from "@utils"; // Engine cannot import from @state — use bridge

export class ChronoEngine {
  error = $state(null);

  /**
   * Start a new story from the Lobby.
   * @param {{ ai: any, user: any, fractal: any }} selection - { ai, user, fractal }
   */
  async start(selection) {
    if (state_bridge.app.simulation.loading || state_bridge.simulation_state.intent_active) return;
    state_bridge.simulation_state.set_intent_active(true); // Exact sub-millisecond Intent Lock
    state_bridge.app.simulation.loading = true;

    try {
      const story_title = state_bridge.app.story_title || `The Journey of ${selection.ai.name} & ${selection.user.name} in ${selection.fractal.name}`;
      // 1. Create Core Session
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

      // 3. Begin-story card choreography: hold the cards in "prologue" mode and
      // suppress the card-slot view-transition morph so the cards don't fly to
      // the side panels. The storyboard STAYS VISIBLE while the prologue
      // generate (so the viewport is never empty); the Console watcher
      // flips to storymode the moment the real prologue entry renders, then
      // flies the storyboard cards into its message.
      state_bridge.app.suppress_card_transitions = true;
      state_bridge.app.begin_story_pending = true;
      state_bridge.app._begin_flight_assets = null;

      // 4. Trigger Prologue Generation (view remains on the storyboard)
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

      // The Console watcher consumes begin_story_pending the moment the
      // prologue renders (it also flips the view). If it somehow never did —
      // and no flight is mid-air (signalled by _begin_flight_assets) — flip to
      // storymode and fall back to panel placement so the cards are never left
      // stranded.
      if (state_bridge.app.begin_story_pending && !state_bridge.app._begin_flight_assets) {
        if (state_bridge.app.view !== "storymode") state_bridge.app.set_view("storymode");
        state_bridge.app.begin_story_pending = false;
        state_bridge.app.suppress_card_transitions = false;
        state_bridge.app._begin_flight_assets = null;
      }
    } catch (e) {
      console.error("[Chrono] Start Failed:", e);
      // Failure fallback: cards live in the panels, no pending flight.
      if (state_bridge.app.view !== "storymode") state_bridge.app.set_view("storymode");
      state_bridge.app.begin_story_pending = false;
      state_bridge.app.suppress_card_transitions = false;
      state_bridge.app._begin_flight_assets = null;
      this.error = /** @type {Error} */ (e).message;
    } finally {
      state_bridge.app.simulation.loading = false;
      state_bridge.simulation_state.set_intent_active(false); // Release Intent Lock
    }
  }

  /**
   * Send user input and advance the simulation turn.
   * @param {string} text
   */
  async send(text) {
    if (state_bridge.app.simulation.loading || state_bridge.simulation_state.intent_active || !text.trim()) return;
    await this.advance_turn(text);
  }

  /**
   * Retry the last AI turn.
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
   * Continue the story (AI generates next part).
   */
  async continue() {
    if (state_bridge.app.simulation.loading || state_bridge.simulation_state.intent_active) return;
    try {
      await this.advance_turn(null, { is_continue: true });
    } catch (e) {
      this.error = /** @type {Error} */ (e).message;
    }
  }

  /**
   * Delete a log entry by ID
   * @param {string} id
   */
  async delete_log_entry(id) {
    await session_driver.delete_log_entry(id);
  }

  /**
   * Edit a log entry by ID
   * @param {string} id
   * @param {string} new_text
   */
  async edit_log_entry(id, new_text) {
    await session_driver.edit_log_entry(id, new_text);
  }

  /**
   * Update an attachment in a log entry by ID
   * @param {string} id
   * @param {number} attachment_index
   * @param {any} new_attachment
   */
  async update_log_attachment(id, attachment_index, new_attachment) {
    await session_driver.update_log_attachment(id, attachment_index, new_attachment);
  }

  /**
   * 🧪 DEBUG: Inject AI Message
   * @param {string} text
   * @param {string} character_name
   * @param {string} role
   */

  /**
   * ADVANCE TURN
   * The ONLY way time moves forward.
   * 1. Locks UI (Loading)
   * 2. Processes Physics (security)
   * 3. Generates Narrative (Engine)
   * 4. PAST: Commit to Memory (Data)
   * 5. Anchoring State (Runtime)
   * 6. Unlocks UI
   * @param {string|null} input
   * @param {object} options
   */
  async advance_turn(input = null, options = {}) {
    if (state_bridge.simulation_state.phase === "locked") return;
    if (state_bridge.app.simulation.loading || state_bridge.simulation_state.intent_active) return; // Prevent double-clicks
    const story_id = state_bridge.runtime.story_id;
    if (!story_id) {
      console.error("[Chrono] No active story found.");
      return;
    }
    // 1. STASIS: Lock the Universe
    state_bridge.simulation_state.set_intent_active(true); // Exact sub-millisecond Intent Lock
    state_bridge.app.simulation.loading = true;
    state_bridge.simulation_state.lock(); // Phase 1: System Lock
    state_bridge.app.log("Shield scanning causality and physics...", "system");

    /** @type {any} */
    let shield_context = null;
    let final_input = input;

    try {
      // 2. OBSERVATION: Process Input & Physics (Shield)
      // We pass the current runtime character context to the Shield
      if (input && state_bridge.runtime.character) {
        // Pass Fractal State for Causality Checks
        shield_context = await security.process(input, state_bridge.runtime.character, state_bridge.runtime.active_fractal || {});
        // 🛑 CAUSALITY CHECK
        if (shield_context && shield_context.causality && shield_context.causality.result === "failure") {
          state_bridge.app.log(`Causality Violation: ${shield_context.causality.constraint}`, "error");
          // We override the 'Action' to be a System Constraint.
          // This forces the AI to narrate the failure instead of the action.
          final_input = `[SYSTEM]: The user attempted '${input}' but failed because: "${shield_context.causality.constraint}". Describe this failed attempt briefly and dryly.`;
        }
      }
    } catch (err) {
      const error = /** @type {any} */ (err);
      state_bridge.app.log(`Time Fracture during Shield: ${error.message}`, "error");
      console.error("[Chrono] 💥 Shield Failure:", error);
      state_bridge.simulation_log.add({
        id: `err-${Date.now()}`,
        role: "system",
        text: `Simulation Error: ${error.message || "Shield Scan Failure"}`,
        timestamp: Date.now(),
      });
      state_bridge.app.simulation.loading = false;
      state_bridge.simulation_state.unlock();
      state_bridge.simulation_state.set_intent_active(false); // Release Intent Lock
      return;
    }

    // 3. SYNTHESIS: Generate Narrative (Engine) - Runs in background, non-blocking
    if (!options.is_retry && !options.is_continue) {
      state_bridge.runtime.round = Number(state_bridge.runtime.round || 0) + 1;
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
          } catch (dbErr) {
            console.error("[Chrono] Database write error during send:", dbErr);
            state_bridge.app.log("Failed to persist user message, but generation continues.", "error");
          }
        }

        state_bridge.simulation_state.start_generation(options.role || "ai");
        try {
          await gamemaster.execute_turn(story_id, {
            shield_context,
            input: final_input ?? undefined,
            signal: controller.signal,
          });
          state_bridge.app.log("Generation complete.", "system");
          try {
            // Per-turn telemetry summary: what the round actually produced.
            const tail = (state_bridge.simulation_log?.feed || []).slice(-16);
            const counts = {};
            for (const m of tail) {
              if (!m || m.role === "system") continue;
              const role = m.role === "model" ? "ai" : m.role;
              counts[role] = (counts[role] || 0) + 1;
            }
            const parts = Object.entries(counts).map(([r, n]) => `${r}×${n}`);
            state_bridge.app.log(
              `Turn ${state_bridge.runtime.round} complete — ${parts.length ? parts.join(", ") : "no messages recorded"}.`,
              "system",
            );
          } catch (_err) {
            /* telemetry must never break the turn */
          }
        } catch (e) {
          console.error("[Chrono] Generation Failed:", e);
          state_bridge.app.log("Error: Generation Failed.", "error");
          throw e;
        } finally {
          state_bridge.simulation_state.complete();
          state_bridge.app.end_stream();
        }

        // 4. PAST: Commit to Memory (Echo) - Timeline Safety Lock
        state_bridge.simulation_state.lock(); // Phase 3: Database Lock (Post-Generation)
        state_bridge.app.log("Recording memory...", "db");

        // 5. ANCHOR: Persist the timeline
        await state_bridge.runtime.save(state_bridge.runtime.round);
        state_bridge.simulation_state.unlock();
      } catch (err) {
        const error = /** @type {any} */ (err);
        if (error.name === "AbortError" || error.message?.includes("aborted")) {
          state_bridge.app.log("Generation interrupted cleanly.", "system");
        } else {
          state_bridge.app.log(`Time Fracture: ${error.message}`, "error");
          console.error("[Chrono] 💥 Time Fracture:", error);
          // 🛡️ ORPHANED-TURN GUARD: if the user's message was persisted but the AI
          // reply never landed, retry generation ONCE and record a durable marker so
          // the failure is never lost to a reload (the pre-fix state of round 14).
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
                      shield_context,
                      input: final_input,
                      signal: controller.signal,
                    });
                    retry_landed = true;
                    state_bridge.app.log("Orphaned turn recovered.", "system");
                  }
                }
              } catch (retryErr) {
                console.error("[Chrono] Orphan retry failed:", retryErr);
                state_bridge.app.log(`Orphan retry failed: ${retryErr.message || retryErr}`, "error");
              } finally {
                this._orphan_retry_in_flight = false;
              }
            }
          } catch (guardErr) {
            console.error("[Chrono] Orphan guard failed:", guardErr);
          }

          // Durable record: survives reloads, unlike the in-memory feed entry.
          try {
            await session_driver.log_system_entry(
              `A turn failed after the message was recorded${
                retry_landed ? " (recovered by automatic retry)" : " — no reply was generated"
              }. Round ${round_after_failure}. (${error.message || "Unknown error"})`,
              "system",
              { type: "TURN_ORPHANED", round: round_after_failure, recovered: retry_landed },
            );
          } catch (logErr) {
            console.error("[Chrono] Failed to persist orphan marker:", logErr);
          }

          if (!retry_landed) {
            // Push error to feed so user knows what happened
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
        state_bridge.simulation_state.set_intent_active(false); // Release Intent Lock
      }
    })();
  }
}
export const chrono_engine = new ChronoEngine();
