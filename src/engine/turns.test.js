import * as simulation_module from "@simulation";
import { execution, session } from "@state";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { continue_turn, dispatch_consolidation, maybe_spawn_turn_image, reset_turn_scope, run_turn, write_back_turn_state } from "./turns.js";

describe("src/engine/turns.js", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    session.active_ai = null;
    session.active_user = null;
    session.active_fractal = null;
    session.round = 0;
    session.back_shot_cursor = 0;
    session.active_id = null;
    session.last_image_beat_round = -1;
    session.feed = [];
    reset_turn_scope();
  });

  describe("Turn stage transitions & dynamics_baseline preservation", () => {
    it("sets generating_entity during run_turn", async () => {
      await run_turn("Step into the light");

      expect(execution.generating_entity.type).toBe("ai");
    });

    it("preserves entity dynamics_baseline through normalize_entity for gravity settling", async () => {
      session.active_ai = {
        id: "ai-1",
        name: "Lyra",
        dynamics: { chaos: 80, intensity: 50, openness: 50, affinity: 50 },
        dynamics_baseline: { chaos: 80, intensity: 50, openness: 50, affinity: 50 },
      };
      session.active_user = { id: "u-1", name: "Glitch", dynamics: {} };
      session.active_fractal = {
        id: "f-1",
        name: "Station",
        type: "fractal",
        dynamics: { velocity: 50, entropy: 50 },
        dynamics_baseline: { velocity: 50, entropy: 50 },
      };
      session.active_id = "story-baseline";
      session.round = 1;
      vi.spyOn(session, "save_entity").mockResolvedValue(true);
      vi.spyOn(session, "save").mockResolvedValue(true);
      vi.spyOn(session, "log_message").mockResolvedValue({ id: 1, created_at: Date.now() });

      const original_gen = window.generate_text;
      window.generate_text = vi.fn(async ({ instruction }) => {
        const text = typeof instruction === "function" ? instruction() : instruction;
        if (text.includes('identity="director"') || text.includes("orchestrating simulation mechanics")) {
          return JSON.stringify({ next_action: "MAIN_CHARACTER", directors_note: "Steady.", dynamics_deltas: { chaos: 0 } });
        }
        return "<think>Steady.</think>Lyra holds position.";
      });

      try {
        await run_turn("Hold.");
        // With baseline=80 and delta=0, gravity pulls toward 80 (remains 80),
        // whereas losing dynamics_baseline would pull toward 50 (dropping to 78).
        expect(session.active_ai.dynamics.chaos).toBe(80);
      } finally {
        window.generate_text = original_gen;
      }
    });
  });

  describe("write_back_turn_state & dispatch_consolidation", () => {
    it("writes back updated dynamics and round to session and persistence", async () => {
      session.active_ai = { id: "ai-1", name: "Viper", dynamics: { chaos: 50, intensity: 50, openness: 50, affinity: 50 } };
      session.active_fractal = { id: "f-1", name: "Station", dynamics: { velocity: 50, entropy: 50 } };
      session.round = 1;
      const save_entity_spy = vi.spyOn(session, "save_entity").mockResolvedValue(true);
      const save_spy = vi.spyOn(session, "save").mockResolvedValue(true);

      await write_back_turn_state({
        ai: { id: "ai-1", name: "Viper", dynamics: { chaos: 65, intensity: 75, openness: 50, affinity: 50 } },
        fractal: { id: "f-1", name: "Station", dynamics: { velocity: 80, entropy: 40 } },
        user: session.active_user,
        round: 2,
        outcome: { director_staging: { dynamics_deltas: { chaos: 15, intensity: 25, velocity: 30, entropy: -10 } }, character_turn: { prose: "", think: "" } },
      });

      expect(session.active_ai.dynamics.chaos).toBe(65);
      expect(session.ai_dynamics.chaos).toBe(65);
      expect(session.active_fractal.dynamics.velocity).toBe(80);
      expect(session.fractal_dynamics.velocity).toBe(80);
      expect(session.round).toBe(2);
      expect(save_entity_spy).toHaveBeenCalledWith("character", expect.objectContaining({ id: "ai-1" }));
      expect(save_entity_spy).toHaveBeenCalledWith("fractal", expect.objectContaining({ id: "f-1" }));
      expect(save_spy).toHaveBeenCalledWith(2);
    });

    it("persists all 4 quadrants during Caretaker consolidation", async () => {
      session.active_ai = {
        id: "ai-1",
        name: "AI",
        present: { physical: "[CLOTHING: jacket]", non_physical: "[MOOD: calm]" },
        future: "[AGENDA: wait]",
        past: "[MEMORY: met the traveler]",
      };
      session.back_shot_cursor = 0;
      session.active_id = null;
      const save_entity_spy = vi.spyOn(session, "save_entity").mockResolvedValue(true);

      const mock_transport = {
        stream: vi
          .fn()
          .mockResolvedValue(
            JSON.stringify({
              _thought_process: "synthesizing all quadrants",
              target: "AI",
              present_physical: "[INJURY: bruised knee]",
              present_non_physical: "[MOOD: alert]",
              future: "[AGENDA: scout the perimeter]",
              past: "[MEMORY: heard strange noises near the gate]",
            }),
          ),
      };

      await dispatch_consolidation({ ai: { id: "ai-1", name: "AI" }, round: 1 }, mock_transport);

      expect(session.active_ai.present.physical).toContain("[INJURY: bruised knee]");
      expect(session.active_ai.present.non_physical).toContain("[MOOD: alert]");
      expect(session.active_ai.future).toContain("[AGENDA: scout the perimeter]");
      expect(session.active_ai.past).toContain("[MEMORY: heard strange noises near the gate]");
      expect(save_entity_spy).toHaveBeenCalledWith("character", expect.objectContaining({ id: "ai-1" }));
    });

    it("skips dispatch_consolidation when signal is aborted", async () => {
      session.active_ai = { id: "ai-1", name: "AI", present: {}, future: "", past: "" };
      const save_entity_spy = vi.spyOn(session, "save_entity").mockResolvedValue(true);
      const mock_transport = { stream: vi.fn() };
      const controller = new AbortController();
      controller.abort();

      await dispatch_consolidation({ ai: { id: "ai-1", name: "AI" }, round: 1 }, mock_transport, controller.signal);
      expect(mock_transport.stream).not.toHaveBeenCalled();
      expect(save_entity_spy).not.toHaveBeenCalled();
    });
  });

  describe("continue_turn streaming deduplication", () => {
    it("does not duplicate target_prose when ai-text-plugin echoes startWith chunk", async () => {
      const original_gen = window.generate_text;
      const streamed_chunks = [];

      window.generate_text = vi.fn(({ startWith, onChunk }) => {
        onChunk({ textChunk: startWith, isFromStartWith: true });
        onChunk({ textChunk: "Next paragraph beat.", isFromStartWith: false });
        return Promise.resolve({ text: `${startWith}Next paragraph beat.`, generatedText: "Next paragraph beat." });
      });

      const target_entry = { id: "msg-42", role: "ai", text: "Initial paragraph.", round: 1, meta: { think: "Initial thought." } };

      session.active_ai = { id: "ai-1", name: "Orion" };
      session.active_user = { id: "u-1", name: "Glitch" };
      session.active_fractal = { id: "f-1", name: "Nova" };
      session.round = 1;
      session.feed = [target_entry];
      const edit_entry_spy = vi.spyOn(session, "edit_entry").mockResolvedValue(true);

      vi.spyOn(execution, "start_stream").mockImplementation(() => {});
      vi.spyOn(execution, "update_stream").mockImplementation((c) => streamed_chunks.push(c));
      vi.spyOn(execution, "end_stream").mockImplementation(() => {});

      try {
        const outcome = await continue_turn(target_entry);
        expect(streamed_chunks.join("")).toBe("Initial paragraph.\n\nNext paragraph beat.");
        expect(outcome.prose).toBe("Initial paragraph.\n\nNext paragraph beat.");
        expect(edit_entry_spy).toHaveBeenCalledWith(
          "msg-42",
          "Initial paragraph.\n\nNext paragraph beat.",
          expect.objectContaining({ think: expect.any(String) }),
        );
      } finally {
        window.generate_text = original_gen;
      }
    });

    it("sets generating_entity with AI metadata on first chunk", async () => {
      const original_gen = window.generate_text;
      window.generate_text = vi.fn(async () => "Extended paragraph.");

      const target_entry = { id: "msg-99", role: "ai", text: "Existing text.", round: 1, meta: {} };

      session.active_ai = { id: "ai-1", name: "Lyra", profile_picture: "avatar.png", signature_color: "#00ffee" };
      session.active_user = { id: "u-1", name: "Glitch" };
      session.active_fractal = { id: "f-1", name: "Station" };
      session.round = 1;
      session.feed = [target_entry];
      vi.spyOn(session, "edit_entry").mockResolvedValue(true);
      vi.spyOn(execution, "start_stream").mockImplementation(() => {});
      vi.spyOn(execution, "update_stream").mockImplementation(() => {});
      vi.spyOn(execution, "end_stream").mockImplementation(() => {});

      try {
        await continue_turn(target_entry);
        expect(execution.generating_entity).toEqual({ type: "ai", name: "Lyra", avatar: "avatar.png", color: "#00ffee" });
      } finally {
        window.generate_text = original_gen;
      }
    });
  });

  describe("automatic visual synthesis wire-up", () => {
    it("evaluates queue and spawns image beat without blocking turn", async () => {
      session.active_ai = { id: "ai-1", name: "Lyra", dynamics: { chaos: 60, intensity: 60, openness: 50, affinity: 50 } };
      session.active_user = { id: "u-1", name: "Glitch", dynamics: {} };
      session.active_fractal = { id: "f-1", name: "Station", dynamics: { velocity: 50, entropy: 50 } };
      session.round = 1;
      session.active_id = "story-visual-test";
      session.feed = [];
      vi.spyOn(session, "save_entity").mockResolvedValue(true);
      vi.spyOn(session, "save").mockResolvedValue(true);
      vi.spyOn(execution, "start_stream").mockImplementation(() => {});
      vi.spyOn(execution, "update_stream").mockImplementation(() => {});
      vi.spyOn(execution, "end_stream").mockImplementation(() => {});

      const log_spy = vi.spyOn(session, "log_message").mockResolvedValue({ id: 1 });
      const lifecycle_module = await import("./lifecycle.js");
      const capture_spy = vi.spyOn(lifecycle_module, "capture_story_image").mockResolvedValue({ image_url: "data:image/png;base64,OK" });
      const trigger_spy = vi
        .spyOn(simulation_module, "resolve_image_trigger")
        .mockReturnValue({ active: true, tier: "story_scene", source: "dynamics", next_image_beat_round: 1 });

      const original_gen = window.generate_text;
      window.generate_text = vi.fn(async ({ instruction }) => {
        const text = typeof instruction === "function" ? instruction() : instruction;
        if (text.includes("orchestrating simulation mechanics and staging")) {
          return JSON.stringify({
            _thought_process: "Scene shifts to ruined hall.",
            next_action: "MAIN_CHARACTER",
            directors_note: "Look around.",
            camera_note: "Wide establishing shot of the overgrown observatory.",
            dynamics_deltas: { chaos: 5 },
          });
        }
        return "<think>Observe carefully.</think>The dust hangs frozen in the air.";
      });

      try {
        const outcome = await run_turn("Enter the observatory.");
        expect(outcome.character_turn.prose).toBe("The dust hangs frozen in the air.");
        expect(trigger_spy).toHaveBeenCalledWith(
          expect.objectContaining({ prev_dynamics: expect.objectContaining({ ai: expect.any(Object), fractal: expect.any(Object) }) }),
        );
        expect(capture_spy).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: "fractal",
            kind: "story_scene",
            prompt: "The dust hangs frozen in the air. Wide establishing shot of the overgrown observatory.",
            background: true,
          }),
        );
        expect(log_spy).toHaveBeenCalledWith(
          "",
          "system",
          "Director",
          expect.objectContaining({ meta: expect.objectContaining({ type: "DYNAMICS_DELTA", thoughts: "Scene shifts to ruined hall." }) }),
        );
      } finally {
        window.generate_text = original_gen;
      }
    });

    it("fails silently when capture_story_image rejects", async () => {
      session.active_ai = { id: "ai-1", name: "Lyra", dynamics: {} };
      session.active_user = { id: "u-1", name: "Glitch", dynamics: {} };
      session.active_fractal = { id: "f-1", name: "Station", dynamics: {} };
      session.round = 1;
      session.active_id = "story-fail-test";
      session.feed = [];
      vi.spyOn(session, "save_entity").mockResolvedValue(true);
      vi.spyOn(session, "save").mockResolvedValue(true);
      vi.spyOn(execution, "start_stream").mockImplementation(() => {});
      vi.spyOn(execution, "update_stream").mockImplementation(() => {});
      vi.spyOn(execution, "end_stream").mockImplementation(() => {});
      vi.spyOn(session, "log_message").mockResolvedValue({ id: 1 });
      vi.spyOn(simulation_module, "resolve_image_trigger").mockReturnValue({ active: true, tier: "story_character", source: "dynamics" });
      const lifecycle_module = await import("./lifecycle.js");
      vi.spyOn(lifecycle_module, "capture_story_image").mockRejectedValue(new Error("Visual plugin timeout"));

      const original_gen = window.generate_text;
      window.generate_text = vi.fn(async () => "<think>Thinking</think>Safe prose.");

      try {
        const outcome = await run_turn("Walk forward.");
        expect(outcome.character_turn.prose).toBe("Safe prose.");
      } finally {
        window.generate_text = original_gen;
      }
    });

    it("forwards entity-keyed prev_dynamics through maybe_spawn_turn_image", async () => {
      const trigger_spy = vi.spyOn(simulation_module, "resolve_image_trigger").mockReturnValue({ active: false, tier: null, source: null });
      session.active_id = "story-prev-shape";

      const prev = { ai: { chaos: 10 }, fractal: { velocity: 20 } };
      await maybe_spawn_turn_image({
        prose: "Some prose.",
        outcome: { director_staging: null },
        ai_quadrant: { dynamics: { chaos: 12 } },
        fractal_quadrant: { dynamics: { velocity: 22 } },
        prev_dynamics: prev,
        turn_round: 3,
      });

      expect(trigger_spy).toHaveBeenCalledWith(expect.objectContaining({ prev_dynamics: prev }));
    });
  });
});
