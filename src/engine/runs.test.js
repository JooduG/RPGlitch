import * as dataModule from "@data";
import * as media_module from "@media";
import { register_state_accessors, reset_registries_for_testing } from "@utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { simulation_log } from "./log.svelte.js";
import { runtime } from "./runtime.svelte.js";
import { dispatch_caretaker_consolidation, execute_continue, execute_turn, reset_turn_scope_for_testing, write_back_turn_state } from "./runs.js";
import { session_driver } from "./sessions.svelte.js";
import { simulation_state } from "./status.svelte.js";
import { reconstruct_history_from_feed } from "./turns.js";

describe("src/engine/runs.js - Engine Runs Unit Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    reset_registries_for_testing();
    runtime.active_ai = null;
    runtime.active_user = null;
    runtime.active_fractal = null;
    runtime.round = 0;
    runtime.back_shot_cursor = 0;
    runtime.story_id = null;
    runtime.last_director_beat_round = -1;
    runtime.last_dynamics_beat_round = -1;
    simulation_log.clear();
    reset_turn_scope_for_testing();
  });

  describe("Gap 5: reconstruct_history_from_feed role and origin preservation", () => {
    it("preserves fractal, system, user, and ai roles with proper origin attribution", () => {
      const mock_feed = [
        { role: "system", text: "The air smells of ozone.", origin: "SYSTEM" },
        { role: "user", text: "I open the rusty airlock.", character_name: "John" },
        { role: "fractal", text: "Steam hisses from the ceiling pipe.", origin: "Deep Station" },
        { role: "ai", text: "Stay behind me.", character_name: "Viper" },
        { role: "unknown", text: "Echo in the dark." },
      ];

      const cast = { user: { name: "John" }, ai: { name: "Viper" }, fractal: { name: "Deep Station" } };

      const history = reconstruct_history_from_feed(mock_feed, cast);

      expect(history).toHaveLength(5);
      expect(history[0]).toEqual({ role: "system", origin: "SYSTEM", text: "The air smells of ozone.", round: 1 });
      expect(history[1]).toEqual({ role: "user", origin: "John", text: "I open the rusty airlock.", round: 1 });
      expect(history[2]).toEqual({ role: "fractal", origin: "Deep Station", text: "Steam hisses from the ceiling pipe.", round: 1 });
      expect(history[3]).toEqual({ role: "ai", origin: "Viper", text: "Stay behind me.", round: 1 });
      expect(history[4]).toEqual({ role: "ai", origin: "Viper", text: "Echo in the dark.", round: 1 });
    });

    it("handles empty or null feed gracefully", () => {
      expect(reconstruct_history_from_feed(null)).toEqual([]);
      expect(reconstruct_history_from_feed([])).toEqual([]);
    });
  });

  describe("Gap 3: director_enabled toggle from app settings", () => {
    it("respects app.settings.director_enabled flag", async () => {
      const mock_app = { settings: { director_enabled: false }, start_stream: vi.fn(), update_stream: vi.fn(), end_stream: vi.fn() };
      register_state_accessors({ app: mock_app });

      const outcome = await execute_turn("Move forward");

      // With director_enabled = false, 1-shot mode runs and director_staging is null
      expect(outcome.director_staging).toBeNull();
      expect(outcome.character_turn).toBeDefined();
    });
  });

  describe("B03: Turn stage transitions on Director and Speaker", () => {
    it("invokes set_delegated_speaker and start_stream_stage during execute_turn", async () => {
      const mock_app = { settings: { director_enabled: false }, start_stream: vi.fn(), update_stream: vi.fn(), end_stream: vi.fn() };
      register_state_accessors({ app: mock_app });
      const speaker_spy = vi.spyOn(simulation_state, "set_delegated_speaker").mockImplementation(() => {});
      const stage_spy = vi.spyOn(simulation_state, "start_stream_stage").mockImplementation(() => {});

      await execute_turn("Step into the light");

      expect(speaker_spy).toHaveBeenCalled();
      expect(stage_spy).toHaveBeenCalled();
      const speaker_arg = speaker_spy.mock.calls[0][0];
      expect(speaker_arg.type).toBe("ai");
    });
  });

  describe("Gap 4: write_back_turn_state updates and persists dynamics, round and Caretaker diffs", () => {
    it("writes back updated dynamics and round to runtime and persistence", async () => {
      runtime.active_ai = { id: "ai-1", name: "Viper", dynamics: { chaos: 50, intensity: 50, openness: 50, affinity: 50 } };
      runtime.active_fractal = { id: "f-1", name: "Station", dynamics: { velocity: 50, entropy: 50 } };
      runtime.round = 1;
      const save_entity_spy = vi.spyOn(runtime, "save_entity").mockResolvedValue(true);
      const save_spy = vi.spyOn(runtime, "save").mockResolvedValue(true);

      const outcome = {
        director_staging: { dynamics_deltas: { chaos: 15, intensity: 25, velocity: 30, entropy: -10 } },
        character_turn: { prose: "", think: "" },
      };

      await write_back_turn_state({
        ai: { id: "ai-1", name: "Viper", dynamics: { chaos: 65, intensity: 75, openness: 50, affinity: 50 } },
        fractal: { id: "f-1", name: "Station", dynamics: { velocity: 80, entropy: 40 } },
        user: runtime.active_user,
        round: 2,
        outcome,
        options: {},
      });

      // Verify AI dynamics write-back (active entity + live physics getter, NOT the removed ai_physics field)
      expect(runtime.active_ai.dynamics.chaos).toBe(65);
      expect(runtime.active_ai.dynamics.intensity).toBe(75);
      expect(runtime.ai.chaos).toBe(65);

      // Verify Fractal dynamics write-back
      expect(runtime.active_fractal.dynamics.velocity).toBe(80);
      expect(runtime.fractal.velocity).toBe(80);

      // Verify round write-back
      expect(runtime.round).toBe(2);

      // Verify persistence calls
      expect(save_entity_spy).toHaveBeenCalledWith("character", expect.objectContaining({ id: "ai-1" }));
      expect(save_entity_spy).toHaveBeenCalledWith("fractal", expect.objectContaining({ id: "f-1" }));
      expect(save_spy).toHaveBeenCalledWith(2);
    });

    it("persists all 4 quadrants (present_physical, present_non_physical, future, past) during Caretaker consolidation", async () => {
      runtime.active_ai = {
        id: "ai-1",
        name: "AI",
        present: { physical: "[CLOTHING: jacket]", non_physical: "[MOOD: calm]" },
        future: "[AGENDA: wait]",
        past: "[MEMORY: met the traveler]",
      };
      runtime.back_shot_cursor = 0;
      runtime.story_id = null;
      const save_entity_spy = vi.spyOn(runtime, "save_entity").mockResolvedValue(true);
      vi.spyOn(dataModule, "append_ledger_entries").mockResolvedValue([]);

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

      await dispatch_caretaker_consolidation({ ai: { id: "ai-1", name: "AI" }, round: 1 }, mock_transport);

      expect(runtime.active_ai.present.physical).toContain("[INJURY: bruised knee]");
      expect(runtime.active_ai.present.non_physical).toContain("[MOOD: alert]");
      expect(runtime.active_ai.future).toContain("[AGENDA: scout the perimeter]");
      expect(runtime.active_ai.past).toContain("[MEMORY: heard strange noises near the gate]");
      expect(save_entity_spy).toHaveBeenCalledWith("character", expect.objectContaining({ id: "ai-1" }));
    });

    it("skips dispatch_caretaker_consolidation when signal is aborted or character prose is empty", async () => {
      runtime.active_ai = { id: "ai-1", name: "AI", present: {}, future: "", past: "" };
      const save_entity_spy = vi.spyOn(runtime, "save_entity").mockResolvedValue(true);

      const mock_transport = { stream: vi.fn() };
      const controller = new AbortController();
      controller.abort();

      await dispatch_caretaker_consolidation({ ai: { id: "ai-1", name: "AI" }, round: 1 }, mock_transport, controller.signal);
      expect(mock_transport.stream).not.toHaveBeenCalled();
      expect(save_entity_spy).not.toHaveBeenCalled();
    });
  });

  describe("execute_continue streaming deduplication", () => {
    it("does not duplicate target_prose in update_stream when ai-text-plugin echoes startWith chunk", async () => {
      const original_gen = window.generate_text;
      const streamed_chunks = [];

      window.generate_text = vi.fn(({ startWith, onChunk }) => {
        // Simulate Perchance ai-text-plugin emitting startWith first with isFromStartWith: true
        onChunk({ textChunk: startWith, isFromStartWith: true });
        onChunk({ textChunk: "Next paragraph beat.", isFromStartWith: false });
        return Promise.resolve({ text: `${startWith}Next paragraph beat.`, generatedText: "Next paragraph beat." });
      });

      const mock_app = {
        settings: { director_enabled: false },
        start_stream: vi.fn(),
        update_stream: vi.fn((c) => streamed_chunks.push(c)),
        end_stream: vi.fn(),
      };
      const target_entry = { id: "msg-42", role: "ai", text: "Initial paragraph.", round: 1, meta: { think: "Initial thought." } };

      runtime.active_ai = { id: "ai-1", name: "Orion" };
      runtime.active_user = { id: "u-1", name: "Glitch" };
      runtime.active_fractal = { id: "f-1", name: "Nova" };
      runtime.round = 1;
      simulation_log.feed = [target_entry];
      const edit_entry_spy = vi.spyOn(simulation_log, "edit_entry").mockResolvedValue(true);

      register_state_accessors({ app: mock_app });

      try {
        const outcome = await execute_continue(target_entry);
        expect(streamed_chunks.join("")).toBe("Initial paragraph.\n\nNext paragraph beat.");
        expect(outcome.prose).toBe("Initial paragraph.\n\nNext paragraph beat.");
        expect(edit_entry_spy).toHaveBeenCalledWith("msg-42", "Initial paragraph.\n\nNext paragraph beat.");
      } finally {
        window.generate_text = original_gen;
      }
    });

    it("B03 coverage: execute_continue transitions stages via set_delegated_speaker and start_stream_stage", async () => {
      const original_gen = window.generate_text;
      window.generate_text = vi.fn(async () => "Extended paragraph.");

      const mock_app = { settings: { director_enabled: false }, start_stream: vi.fn(), update_stream: vi.fn(), end_stream: vi.fn() };
      const target_entry = { id: "msg-99", role: "ai", text: "Existing text.", round: 1, meta: {} };

      runtime.active_ai = { id: "ai-1", name: "Lyra", profile_picture: "avatar.png", signature_color: "#00ffee" };
      runtime.active_user = { id: "u-1", name: "Glitch" };
      runtime.active_fractal = { id: "f-1", name: "Station" };
      runtime.round = 1;
      simulation_log.feed = [target_entry];
      vi.spyOn(simulation_log, "edit_entry").mockResolvedValue(true);

      register_state_accessors({ app: mock_app });
      const speaker_spy2 = vi.spyOn(simulation_state, "set_delegated_speaker").mockImplementation(() => {});
      const stage_spy2 = vi.spyOn(simulation_state, "start_stream_stage").mockImplementation(() => {});

      try {
        await execute_continue(target_entry);
        expect(speaker_spy2).toHaveBeenCalledWith({ type: "ai", name: "Lyra", avatar: "avatar.png", color: "#00ffee" });
        expect(stage_spy2).toHaveBeenCalled();
      } finally {
        window.generate_text = original_gen;
      }
    });
  });

  describe("B19: Automatic Visual Synthesis Wire-Up", () => {
    it("evaluates get_image_generation_queue and calls spawn_image_beat without blocking turn", async () => {
      const mock_app = { settings: { director_enabled: true }, start_stream: vi.fn(), update_stream: vi.fn(), end_stream: vi.fn() };

      runtime.active_ai = { id: "ai-1", name: "Lyra", dynamics: { chaos: 60, intensity: 60, openness: 50, affinity: 50 } };
      runtime.active_user = { id: "u-1", name: "Glitch", dynamics: {} };
      runtime.active_fractal = { id: "f-1", name: "Station", dynamics: { velocity: 50, entropy: 50 } };
      runtime.round = 1;
      runtime.story_id = "story-visual-test";
      runtime.last_director_beat_round = -1;
      runtime.last_dynamics_beat_round = -1;
      simulation_log.feed = [];
      vi.spyOn(runtime, "save_entity").mockResolvedValue(true);
      vi.spyOn(runtime, "save").mockResolvedValue(true);

      register_state_accessors({ app: mock_app });

      const log_spy = vi.spyOn(session_driver, "log_message").mockResolvedValue({ id: 1 });
      const spawn_spy = vi.spyOn(media_module, "spawn_image_beat").mockResolvedValue({ id: "img-1" });
      const queue_spy = vi.spyOn(media_module, "get_image_generation_queue").mockReturnValue([]);
      const trigger_spy = vi
        .spyOn(media_module, "resolve_image_trigger")
        .mockReturnValue({ active: true, tier: "story_scene", source: "director", director_explicit: true, next_director_round: 1 });

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
        const outcome = await execute_turn("Enter the observatory.");
        expect(outcome.character_turn.prose).toBe("The dust hangs frozen in the air.");

        // Queue checked and spawn_image_beat dispatched
        expect(queue_spy).toHaveBeenCalled();
        expect(trigger_spy).toHaveBeenCalled();
        expect(spawn_spy).toHaveBeenCalledWith(
          "story_scene",
          expect.objectContaining({
            explicit: true,
            source: "director",
            prompt: "The dust hangs frozen in the air.",
            visual_staging: "Wide establishing shot of the overgrown observatory.",
          }),
        );

        // Verify DYNAMICS_DELTA log message includes director thoughts
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

    it("fails silently and never blocks the turn when spawn_image_beat rejects", async () => {
      const mock_app = { settings: { director_enabled: false }, start_stream: vi.fn(), update_stream: vi.fn(), end_stream: vi.fn() };

      runtime.active_ai = { id: "ai-1", name: "Lyra", dynamics: {} };
      runtime.active_user = { id: "u-1", name: "Glitch", dynamics: {} };
      runtime.active_fractal = { id: "f-1", name: "Station", dynamics: {} };
      runtime.round = 1;
      runtime.story_id = "story-fail-test";
      simulation_log.feed = [];
      vi.spyOn(runtime, "save_entity").mockResolvedValue(true);
      vi.spyOn(runtime, "save").mockResolvedValue(true);

      register_state_accessors({ app: mock_app });

      vi.spyOn(session_driver, "log_message").mockResolvedValue({ id: 1 });
      vi.spyOn(media_module, "resolve_image_trigger").mockReturnValue({ active: true, tier: "story_character", source: "dynamics" });
      vi.spyOn(media_module, "get_image_generation_queue").mockReturnValue([]);
      vi.spyOn(media_module, "spawn_image_beat").mockRejectedValue(new Error("Visual plugin timeout"));

      const original_gen = window.generate_text;
      window.generate_text = vi.fn(async () => "<think>Thinking</think>Safe prose.");

      try {
        const outcome = await execute_turn("Walk forward.");
        expect(outcome.character_turn.prose).toBe("Safe prose.");
      } finally {
        window.generate_text = original_gen;
      }
    });
  });
});
